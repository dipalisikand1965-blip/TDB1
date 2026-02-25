"""
Pricing, Shipping & Commercial Hub Routes
Central management for all pricing, shipping, and pillar-specific commissions
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import csv
import io

# Database reference - will be set from server.py
db = None
verify_admin = None

def set_pricing_db(database):
    global db
    db = database

def set_pricing_admin_verify(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/admin/pricing", tags=["Pricing Hub"])

# ==================== MODELS ====================

class ProductPricing(BaseModel):
    product_id: str
    cost: float = 0  # Cost of production / cost to us
    margin_percent: float = 100  # Margin percentage (e.g., 150 means 150%)
    calculated_price: Optional[float] = None  # Auto-calculated: cost * (1 + margin/100)
    selling_price: float  # Final selling price (can override calculated)
    gst_percent: float = 5  # GST percentage (5%, 12%, 18%, etc.)
    is_price_overridden: bool = False

class ShippingRule(BaseModel):
    id: Optional[str] = None
    name: str
    rule_type: str  # 'flat', 'weight', 'size', 'location', 'free_above'
    base_amount: float = 0
    per_kg_rate: Optional[float] = None
    per_unit_rate: Optional[float] = None
    gst_percent: float = 18
    zones: Optional[Dict[str, float]] = None  # {"local": 50, "city": 100, "state": 150, "national": 200}
    free_above_amount: Optional[float] = None  # Free shipping above this cart value
    pillar_ids: List[str] = []  # Which pillars this rule applies to
    is_active: bool = True

class PillarCommission(BaseModel):
    pillar_id: str
    pillar_name: str
    commission_type: str  # 'percentage' or 'fixed'
    commission_value: float  # Either % or ₹ amount
    min_commission: Optional[float] = None  # Minimum commission if percentage
    max_commission: Optional[float] = None  # Maximum commission cap
    notes: Optional[str] = None

class BulkPricingUpdate(BaseModel):
    product_ids: List[str]
    update_type: str  # 'margin', 'gst', 'cost', 'selling_price'
    value: float
    is_percentage: bool = False  # For selling_price updates, can be % increase/decrease

# ==================== PRICING ROUTES ====================

@router.get("/products")
async def get_product_pricing(
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all products with their pricing details"""
    query = {}
    
    if pillar:
        # Get products in this pillar via placements
        placements = await db.product_placements.find({"pillar_id": pillar}).to_list(1000)
        product_ids = [p["product_id"] for p in placements]
        query["id"] = {"$in": product_ids}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    
    # Get products
    products = await db.products_master.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products_master.count_documents(query)
    
    # Enrich with pricing data
    enriched = []
    for product in products:
        pricing = await db.product_pricing.find_one({"product_id": product["id"]}, {"_id": 0})
        
        if not pricing:
            # Create default pricing entry
            cost = product.get("cost", 0) or 0
            selling_price = product.get("price", 0) or 0
            margin_percent = ((selling_price - cost) / cost * 100) if cost > 0 else 100
            
            pricing = {
                "product_id": product["id"],
                "cost": cost,
                "margin_percent": round(margin_percent, 2),
                "calculated_price": cost * (1 + margin_percent / 100) if cost > 0 else selling_price,
                "selling_price": selling_price,
                "gst_percent": product.get("gst_percent", 5),
                "is_price_overridden": False
            }
        
        enriched.append({
            **product,
            "pricing": pricing,
            "price_with_gst": round(pricing["selling_price"] * (1 + pricing["gst_percent"] / 100), 2)
        })
    
    return {
        "products": enriched,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.patch("/products/{product_id}")
async def update_product_pricing(product_id: str, pricing: ProductPricing):
    """Update pricing for a single product"""
    # Calculate price if not overridden
    if not pricing.is_price_overridden and pricing.cost > 0:
        pricing.calculated_price = round(pricing.cost * (1 + pricing.margin_percent / 100), 2)
        pricing.selling_price = pricing.calculated_price
    
    pricing_doc = pricing.model_dump()
    pricing_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.product_pricing.update_one(
        {"product_id": product_id},
        {"$set": pricing_doc},
        upsert=True
    )
    
    # Also update the main product's price
    await db.products_master.update_one(
        {"id": product_id},
        {"$set": {
            "price": pricing.selling_price,
            "cost": pricing.cost,
            "gst_percent": pricing.gst_percent
        }}
    )
    
    return {"message": "Pricing updated", "pricing": pricing_doc}

@router.post("/products/bulk-update")
async def bulk_update_pricing(update: BulkPricingUpdate):
    """Bulk update pricing for multiple products"""
    updated_count = 0
    
    for product_id in update.product_ids:
        pricing = await db.product_pricing.find_one({"product_id": product_id})
        product = await db.products_master.find_one({"id": product_id})
        
        if not product:
            continue
        
        if not pricing:
            pricing = {
                "product_id": product_id,
                "cost": product.get("cost", 0) or 0,
                "margin_percent": 100,
                "selling_price": product.get("price", 0) or 0,
                "gst_percent": 5,
                "is_price_overridden": False
            }
        
        if update.update_type == "margin":
            pricing["margin_percent"] = update.value
            if pricing["cost"] > 0:
                pricing["calculated_price"] = round(pricing["cost"] * (1 + update.value / 100), 2)
                if not pricing.get("is_price_overridden"):
                    pricing["selling_price"] = pricing["calculated_price"]
        
        elif update.update_type == "gst":
            pricing["gst_percent"] = update.value
        
        elif update.update_type == "cost":
            pricing["cost"] = update.value
            if pricing["cost"] > 0 and not pricing.get("is_price_overridden"):
                pricing["calculated_price"] = round(pricing["cost"] * (1 + pricing["margin_percent"] / 100), 2)
                pricing["selling_price"] = pricing["calculated_price"]
        
        elif update.update_type == "selling_price":
            if update.is_percentage:
                pricing["selling_price"] = round(pricing["selling_price"] * (1 + update.value / 100), 2)
            else:
                pricing["selling_price"] = update.value
            pricing["is_price_overridden"] = True
        
        pricing["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.product_pricing.update_one(
            {"product_id": product_id},
            {"$set": pricing},
            upsert=True
        )
        
        await db.products_master.update_one(
            {"id": product_id},
            {"$set": {"price": pricing["selling_price"], "gst_percent": pricing["gst_percent"]}}
        )
        
        updated_count += 1
    
    return {"message": f"Updated {updated_count} products", "updated_count": updated_count}

# ==================== SHIPPING ROUTES ====================

@router.get("/shipping-rules")
async def get_shipping_rules():
    """Get all shipping rules"""
    rules = await db.shipping_rules.find({}, {"_id": 0}).to_list(100)
    return {"rules": rules}

@router.post("/shipping-rules")
async def create_shipping_rule(rule: ShippingRule):
    """Create a new shipping rule"""
    rule_doc = rule.model_dump()
    rule_doc["id"] = f"ship-{uuid.uuid4().hex[:8]}"
    rule_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shipping_rules.insert_one(rule_doc)
    rule_doc.pop("_id", None)
    
    return {"message": "Shipping rule created", "rule": rule_doc}

@router.patch("/shipping-rules/{rule_id}")
async def update_shipping_rule(rule_id: str, rule: ShippingRule):
    """Update a shipping rule"""
    rule_doc = rule.model_dump()
    rule_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shipping_rules.update_one(
        {"id": rule_id},
        {"$set": rule_doc}
    )
    
    return {"message": "Shipping rule updated"}

@router.delete("/shipping-rules/{rule_id}")
async def delete_shipping_rule(rule_id: str):
    """Delete a shipping rule"""
    await db.shipping_rules.delete_one({"id": rule_id})
    return {"message": "Shipping rule deleted"}

# ==================== PILLAR COMMISSION ROUTES ====================

@router.get("/commissions")
async def get_pillar_commissions():
    """Get commission settings for all pillars"""
    commissions = await db.pillar_commissions.find({}, {"_id": 0}).to_list(100)
    
    # Return default structure if empty
    if not commissions:
        default_pillars = [
            {"pillar_id": "celebrate", "pillar_name": "Celebrate", "commission_type": "margin", "commission_value": 100, "notes": "Products use cost + margin model"},
            {"pillar_id": "dine", "pillar_name": "Dine", "commission_type": "percentage", "commission_value": 10, "notes": "10% commission on reservations"},
            {"pillar_id": "stay", "pillar_name": "Stay", "commission_type": "percentage", "commission_value": 12, "notes": "12% commission on bookings"},
            {"pillar_id": "travel", "pillar_name": "Travel", "commission_type": "percentage", "commission_value": 15, "notes": "15% commission on travel bookings"},
            {"pillar_id": "care", "pillar_name": "Care", "commission_type": "percentage", "commission_value": 10, "notes": "10% commission on services"}
        ]
        return {"commissions": default_pillars}
    
    return {"commissions": commissions}

@router.post("/commissions")
async def set_pillar_commission(commission: PillarCommission):
    """Set commission for a pillar"""
    commission_doc = commission.model_dump()
    commission_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pillar_commissions.update_one(
        {"pillar_id": commission.pillar_id},
        {"$set": commission_doc},
        upsert=True
    )
    
    return {"message": "Commission updated", "commission": commission_doc}

# ==================== PARTNER/VENDOR COMMISSIONS ====================

@router.get("/partner-commissions")
async def get_partner_commissions(pillar: Optional[str] = None):
    """Get commission settings for individual partners/vendors"""
    query = {}
    if pillar:
        query["pillar"] = pillar
    
    # Get restaurants with their commission settings
    restaurants = await db.restaurants.find(query, {"_id": 0, "id": 1, "name": 1, "city": 1, "commission_type": 1, "commission_value": 1}).to_list(500)
    
    # Get stays with their commission settings
    stays = await db.stays.find(query, {"_id": 0, "id": 1, "name": 1, "city": 1, "commission_type": 1, "commission_value": 1}).to_list(500)
    
    return {
        "restaurants": restaurants,
        "stays": stays
    }

@router.patch("/partner-commissions/{partner_type}/{partner_id}")
async def update_partner_commission(
    partner_type: str,
    partner_id: str,
    commission_type: str,  # 'percentage' or 'fixed'
    commission_value: float
):
    """Update commission for a specific partner"""
    collection = db.restaurants if partner_type == "restaurant" else db.stays
    
    await collection.update_one(
        {"id": partner_id},
        {"$set": {
            "commission_type": commission_type,
            "commission_value": commission_value,
            "commission_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Partner commission updated"}

# ==================== GST CALCULATION ====================

@router.post("/calculate-bundle-gst")
async def calculate_bundle_gst(items: List[Dict[str, Any]]):
    """
    Calculate GST for a bundle with different GST rates
    Items: [{"product_id": "...", "quantity": 1, "price": 100, "gst_percent": 5}, ...]
    """
    total_base = 0
    total_gst = 0
    breakdown = []
    
    for item in items:
        price = item.get("price", 0)
        qty = item.get("quantity", 1)
        gst_percent = item.get("gst_percent", 5)
        
        item_base = price * qty
        item_gst = round(item_base * (gst_percent / 100), 2)
        
        total_base += item_base
        total_gst += item_gst
        
        breakdown.append({
            "product_id": item.get("product_id"),
            "base_amount": item_base,
            "gst_percent": gst_percent,
            "gst_amount": item_gst,
            "total": item_base + item_gst
        })
    
    return {
        "subtotal": round(total_base, 2),
        "total_gst": round(total_gst, 2),
        "grand_total": round(total_base + total_gst, 2),
        "breakdown": breakdown
    }

# ==================== EXPORT/IMPORT ====================

@router.get("/export")
async def export_pricing_data(pillar: Optional[str] = None):
    """Export all pricing data to CSV"""
    query = {}
    if pillar:
        placements = await db.product_placements.find({"pillar_id": pillar}).to_list(1000)
        product_ids = [p["product_id"] for p in placements]
        query["id"] = {"$in": product_ids}
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(5000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "product_id", "name", "category", "cost", "margin_percent", 
        "calculated_price", "selling_price", "gst_percent", "price_with_gst",
        "is_price_overridden"
    ])
    
    for product in products:
        pricing = await db.product_pricing.find_one({"product_id": product["id"]}, {"_id": 0})
        if not pricing:
            pricing = {
                "cost": product.get("cost", 0) or 0,
                "margin_percent": 100,
                "calculated_price": product.get("price", 0),
                "selling_price": product.get("price", 0),
                "gst_percent": product.get("gst_percent", 5),
                "is_price_overridden": False
            }
        
        price_with_gst = round(pricing["selling_price"] * (1 + pricing["gst_percent"] / 100), 2)
        
        writer.writerow([
            product["id"],
            product.get("name", ""),
            product.get("category", ""),
            pricing.get("cost", 0),
            pricing.get("margin_percent", 100),
            pricing.get("calculated_price", 0),
            pricing.get("selling_price", 0),
            pricing.get("gst_percent", 5),
            price_with_gst,
            pricing.get("is_price_overridden", False)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=pricing_export_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.post("/import")
async def import_pricing_data(file: UploadFile = File(...)):
    """Import pricing data from CSV"""
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode()))
    
    updated = 0
    errors = []
    
    for row in reader:
        try:
            product_id = row.get("product_id")
            if not product_id:
                continue
            
            pricing = {
                "product_id": product_id,
                "cost": float(row.get("cost", 0) or 0),
                "margin_percent": float(row.get("margin_percent", 100) or 100),
                "calculated_price": float(row.get("calculated_price", 0) or 0),
                "selling_price": float(row.get("selling_price", 0) or 0),
                "gst_percent": float(row.get("gst_percent", 5) or 5),
                "is_price_overridden": str(row.get("is_price_overridden", "False")).lower() == "true",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.product_pricing.update_one(
                {"product_id": product_id},
                {"$set": pricing},
                upsert=True
            )
            
            await db.products_master.update_one(
                {"id": product_id},
                {"$set": {
                    "price": pricing["selling_price"],
                    "cost": pricing["cost"],
                    "gst_percent": pricing["gst_percent"]
                }}
            )
            
            updated += 1
        except Exception as e:
            errors.append(f"Row {updated + 1}: {str(e)}")
    
    return {
        "message": f"Imported {updated} products",
        "updated": updated,
        "errors": errors[:10] if errors else []
    }

# ==================== DASHBOARD STATS ====================

@router.get("/stats")
async def get_pricing_stats():
    """Get pricing dashboard statistics"""
    total_products = await db.products_master.count_documents({})
    
    # Get products with pricing data
    priced_products = await db.product_pricing.count_documents({})
    
    # Get average margin
    pipeline = [
        {"$group": {"_id": None, "avg_margin": {"$avg": "$margin_percent"}, "avg_gst": {"$avg": "$gst_percent"}}}
    ]
    margin_stats = await db.product_pricing.aggregate(pipeline).to_list(1)
    
    # Get shipping rules count
    shipping_rules = await db.shipping_rules.count_documents({})
    
    # Get pillar commissions
    commissions = await db.pillar_commissions.count_documents({})
    
    return {
        "total_products": total_products,
        "priced_products": priced_products,
        "unpriced_products": total_products - priced_products,
        "avg_margin": round(margin_stats[0]["avg_margin"], 2) if margin_stats else 100,
        "avg_gst": round(margin_stats[0]["avg_gst"], 2) if margin_stats else 5,
        "shipping_rules": shipping_rules,
        "pillar_commissions": commissions
    }


# ==================== AUTOSHIP SETTINGS ====================

class AutoshipTier(BaseModel):
    tier_name: str  # "first", "second_to_fourth", "fifth_plus"
    min_order: int
    max_order: Optional[int] = None  # None means unlimited
    discount_percent: float

class AutoshipProductOverride(BaseModel):
    product_id: str
    discount_percent: float
    is_special: bool = False
    special_label: Optional[str] = None
    special_until: Optional[str] = None  # ISO date string
    notes: Optional[str] = None

class AutoshipSettings(BaseModel):
    default_tiers: List[AutoshipTier]
    product_overrides: List[AutoshipProductOverride] = []


@router.get("/autoship/settings")
async def get_autoship_settings():
    """Get current autoship settings including default tiers and product overrides"""
    # Get default tiers (or return defaults if not customized)
    tiers_doc = await db.autoship_settings.find_one({"type": "default_tiers"})
    
    default_tiers = [
        {"tier_name": "first", "min_order": 1, "max_order": 1, "discount_percent": 10},
        {"tier_name": "second_to_fourth", "min_order": 2, "max_order": 4, "discount_percent": 15},
        {"tier_name": "fifth_plus", "min_order": 5, "max_order": None, "discount_percent": 30}
    ]
    
    if tiers_doc:
        default_tiers = tiers_doc.get("tiers", default_tiers)
    
    # Get all product overrides
    overrides = await db.autoship_product_overrides.find({}, {"_id": 0}).to_list(1000)
    
    # Get product names for overrides
    for override in overrides:
        product = await db.products_master.find_one({"id": override["product_id"]}, {"_id": 0, "name": 1, "image": 1})
        if product:
            override["product_name"] = product.get("name")
            override["product_image"] = product.get("image")
    
    # Count active special offers
    now = datetime.now(timezone.utc).isoformat()
    active_specials = sum(1 for o in overrides if o.get("is_special") and (not o.get("special_until") or o.get("special_until") > now))
    
    return {
        "default_tiers": default_tiers,
        "product_overrides": overrides,
        "stats": {
            "total_overrides": len(overrides),
            "active_specials": active_specials
        }
    }


@router.put("/autoship/tiers")
async def update_autoship_tiers(tiers: List[AutoshipTier]):
    """Update default autoship discount tiers"""
    await db.autoship_settings.update_one(
        {"type": "default_tiers"},
        {
            "$set": {
                "type": "default_tiers",
                "tiers": [t.dict() for t in tiers],
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": "admin"
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": "Autoship tiers updated"}


@router.post("/autoship/product-override")
async def add_product_autoship_override(override: AutoshipProductOverride):
    """Add or update autoship discount override for a specific product"""
    # Verify product exists
    product = await db.products_master.find_one({"id": override.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    override_doc = {
        "product_id": override.product_id,
        "discount_percent": override.discount_percent,
        "is_special": override.is_special,
        "special_label": override.special_label or ("Special Offer" if override.is_special else None),
        "special_until": override.special_until,
        "notes": override.notes,
        "updated_at": now,
        "updated_by": "admin"
    }
    
    await db.autoship_product_overrides.update_one(
        {"product_id": override.product_id},
        {"$set": override_doc},
        upsert=True
    )
    
    # Also update the product document for quick access
    await db.products_master.update_one(
        {"id": override.product_id},
        {
            "$set": {
                "autoship_discount_percent": override.discount_percent,
                "autoship_special_until": override.special_until,
                "autoship_is_special": override.is_special,
                "autoship_special_label": override.special_label
            }
        }
    )
    
    return {
        "success": True,
        "message": f"Autoship override set for {product.get('name')}",
        "override": override_doc
    }


@router.delete("/autoship/product-override/{product_id}")
async def remove_product_autoship_override(product_id: str):
    """Remove autoship override for a product (revert to default tiers)"""
    result = await db.autoship_product_overrides.delete_one({"product_id": product_id})
    
    # Also remove from product document
    await db.products_master.update_one(
        {"id": product_id},
        {
            "$unset": {
                "autoship_discount_percent": "",
                "autoship_special_until": "",
                "autoship_is_special": "",
                "autoship_special_label": ""
            }
        }
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Override not found")
    
    return {"success": True, "message": "Override removed, product will use default tiers"}


@router.get("/autoship/products")
async def get_products_for_autoship():
    """Get all products with their autoship settings for the admin UI"""
    products = await db.products_master.find(
        {},
        {
            "_id": 0,
            "id": 1,
            "name": 1,
            "image": 1,
            "category": 1,
            "price": 1,
            "autoship_discount_percent": 1,
            "autoship_special_until": 1,
            "autoship_is_special": 1,
            "autoship_special_label": 1
        }
    ).to_list(10000)
    
    return {"products": products}


@router.post("/autoship/bulk-override")
async def bulk_update_autoship_overrides(
    product_ids: List[str],
    discount_percent: float,
    is_special: bool = False,
    special_label: Optional[str] = None,
    special_until: Optional[str] = None
):
    """Bulk update autoship overrides for multiple products"""
    now = datetime.now(timezone.utc).isoformat()
    updated = 0
    
    for product_id in product_ids:
        override_doc = {
            "product_id": product_id,
            "discount_percent": discount_percent,
            "is_special": is_special,
            "special_label": special_label or ("Special Offer" if is_special else None),
            "special_until": special_until,
            "updated_at": now,
            "updated_by": "admin"
        }
        
        await db.autoship_product_overrides.update_one(
            {"product_id": product_id},
            {"$set": override_doc},
            upsert=True
        )
        
        await db.products_master.update_one(
            {"id": product_id},
            {
                "$set": {
                    "autoship_discount_percent": discount_percent,
                    "autoship_special_until": special_until,
                    "autoship_is_special": is_special,
                    "autoship_special_label": special_label
                }
            }
        )
        updated += 1
    
    return {
        "success": True,
        "message": f"Updated autoship settings for {updated} products",
        "updated": updated
    }
