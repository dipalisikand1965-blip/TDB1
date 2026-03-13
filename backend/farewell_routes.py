"""
Farewell Pillar Routes
Handles all farewell/memorial service requests: cremation, burial, memorials, grief support
All requests go through concierge assessment
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/farewell", tags=["farewell"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Get logger from server
def get_logger():
    from server import logger
    return logger


# Service Types Configuration
SERVICE_TYPES = {
    "cremation": {
        "name": "Cremation Services",
        "category": "cremation",
        "description": "Dignified cremation with optional urn and memorial",
        "typical_response_time": "Same day - 24 hours"
    },
    "burial": {
        "name": "Burial Services",
        "category": "burial",
        "description": "Pet cemetery plots and burial arrangements",
        "typical_response_time": "24-48 hours"
    },
    "memorial": {
        "name": "Memorial Products",
        "category": "memorial",
        "description": "Urns, keepsakes, paw prints, and memorial items",
        "typical_response_time": "3-7 days"
    },
    "transport": {
        "name": "Dignified Transport",
        "category": "transport",
        "description": "Home pickup and transport services",
        "typical_response_time": "2-4 hours"
    },
    "grief_support": {
        "name": "Grief Support",
        "category": "support",
        "description": "Counselling and support resources",
        "typical_response_time": "24 hours"
    }
}


@router.get("/types")
async def get_service_types():
    """Get available farewell service types"""
    return {"service_types": SERVICE_TYPES}


@router.get("/requests")
async def get_farewell_requests(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0
):
    """Get all farewell service requests (admin)"""
    db = get_db()
    
    query = {}
    if status and status != 'all':
        query["status"] = status
    if service_type and service_type != 'all':
        query["service_type"] = service_type
    
    requests = await db.farewell_requests.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.farewell_requests.count_documents(query)
    
    return {"requests": requests, "total": total}


@router.get("/stats")
async def get_farewell_stats():
    """Get farewell service statistics"""
    db = get_db()
    
    total = await db.farewell_requests.count_documents({})
    by_status = {}
    for status in ["submitted", "in_progress", "scheduled", "completed", "cancelled"]:
        by_status[status] = await db.farewell_requests.count_documents({"status": status})
    
    by_type = {}
    for stype in SERVICE_TYPES.keys():
        by_type[stype] = await db.farewell_requests.count_documents({"service_type": stype})
    
    # Partner counts
    partners_count = await db.farewell_partners.count_documents({})
    products_count = await db.farewell_products.count_documents({})
    
    return {
        "total": total,
        "by_status": by_status,
        "by_type": by_type,
        "partners": partners_count,
        "products": products_count
    }


@router.patch("/request/{request_id}")
async def update_farewell_request(request_id: str, update_data: dict):
    """Update a farewell request status/details"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.farewell_requests.update_one(
        {"request_id": request_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "message": "Request updated"}


# ============ PARTNERS MANAGEMENT ============

@router.get("/admin/partners")
async def get_farewell_partners(
    partner_type: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50
):
    """Get farewell service partners"""
    db = get_db()
    
    query = {}
    if partner_type:
        query["type"] = partner_type
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.farewell_partners.find(query, {"_id": 0}).to_list(limit)
    return {"partners": partners}


@router.post("/admin/partners")
async def create_farewell_partner(partner_data: dict):
    """Add a new farewell service partner"""
    db = get_db()
    
    partner = {
        "id": f"fp-{uuid.uuid4().hex[:8]}",
        **partner_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.farewell_partners.insert_one(partner)
    return {"success": True, "partner_id": partner["id"]}


@router.put("/admin/partners/{partner_id}")
async def update_farewell_partner(partner_id: str, partner_data: dict):
    """Update a farewell partner"""
    db = get_db()
    
    partner_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.farewell_partners.update_one(
        {"id": partner_id},
        {"$set": partner_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True}


@router.delete("/admin/partners/{partner_id}")
async def delete_farewell_partner(partner_id: str):
    """Delete a farewell partner"""
    db = get_db()
    
    result = await db.farewell_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True}


# ============ PRODUCTS MANAGEMENT ============

@router.get("/products")
async def get_farewell_products(
    category: Optional[str] = None,
    in_stock: Optional[bool] = None,
    limit: int = 100
):
    """Get farewell/memorial products from unified_products collection"""
    db = get_db()
    
    query = {"pillar": "farewell"}
    if category:
        query["category"] = category
    if in_stock is not None:
        query["in_stock"] = in_stock
    
    # Try unified_products first
    products = await db.unified_products.find(query, {"_id": 0}).to_list(limit)
    
    # Also check legacy farewell_products collection
    legacy_query = {}
    if category:
        legacy_query["category"] = category
    if in_stock is not None:
        legacy_query["in_stock"] = in_stock
    legacy = await db.farewell_products.find(legacy_query, {"_id": 0}).to_list(limit)
    
    # Merge without duplicates
    seen_ids = {p.get("id") for p in products}
    for p in legacy:
        if p.get("id") not in seen_ids:
            products.append(p)
    
    return {"products": products[:limit], "total": len(products)}


@router.post("/admin/products")
async def create_farewell_product(product_data: dict):
    """Add a new farewell product"""
    db = get_db()
    
    product = {
        "id": f"fprod-{uuid.uuid4().hex[:8]}",
        **product_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "in_stock": True
    }
    
    await db.farewell_products.insert_one(product)
    return {"success": True, "product_id": product["id"]}


@router.put("/admin/products/{product_id}")
async def update_farewell_product(product_id: str, product_data: dict):
    """Update a farewell product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.farewell_products.update_one(
        {"id": product_id},
        {"$set": product_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True}


@router.delete("/admin/products/{product_id}")
async def delete_farewell_product(product_id: str):
    """Delete a farewell product"""
    db = get_db()
    
    result = await db.farewell_products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True}


@router.get("/admin/products/export")
async def export_farewell_products():
    """Export all farewell products for CSV download"""
    db = get_db()
    
    products = await db.farewell_products.find({}, {"_id": 0}).to_list(1000)
    return {"products": products}


@router.post("/admin/products/import")
async def import_farewell_products(products: List[dict]):
    """Import farewell products from CSV"""
    db = get_db()
    
    imported = 0
    for product in products:
        product["id"] = product.get("id") or f"fprod-{uuid.uuid4().hex[:8]}"
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.farewell_products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        imported += 1
    
    return {"success": True, "imported": imported}


# ============ SEED DATA ============

@router.post("/admin/seed-products")
async def seed_farewell_products():
    """Seed default farewell products and partners"""
    db = get_db()
    logger = get_logger()
    
    # Default products
    default_products = [
        {
            "id": "fprod-urn-ceramic",
            "name": "Ceramic Memorial Urn",
            "description": "Beautiful hand-crafted ceramic urn with customisable engravings",
            "price": 3500,
            "compare_price": 4500,
            "category": "urns",
            "subcategory": "Ceramic",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            "sizes": ["Small (up to 5kg)", "Medium (5-15kg)", "Large (15-30kg)", "Extra Large (30kg+)"],
            "paw_reward_points": 100,
            "in_stock": True
        },
        {
            "id": "fprod-urn-wooden",
            "name": "Wooden Memory Box",
            "description": "Elegant wooden memory box with photo frame and compartment for ashes",
            "price": 4500,
            "compare_price": 5500,
            "category": "urns",
            "subcategory": "Wooden",
            "image": "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400",
            "sizes": ["Standard", "Large"],
            "paw_reward_points": 120,
            "in_stock": True
        },
        {
            "id": "fprod-pawprint",
            "name": "Clay Paw Print Kit",
            "description": "Create a lasting impression with our premium clay paw print kit",
            "price": 1200,
            "category": "keepsakes",
            "subcategory": "Paw Prints",
            "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
            "paw_reward_points": 50,
            "in_stock": True
        },
        {
            "id": "fprod-locket",
            "name": "Memorial Locket Pendant",
            "description": "Sterling silver locket to keep a small portion of ashes close to your heart",
            "price": 2800,
            "compare_price": 3500,
            "category": "keepsakes",
            "subcategory": "Jewellery",
            "image": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400",
            "paw_reward_points": 80,
            "in_stock": True
        },
        {
            "id": "fprod-portrait",
            "name": "Custom Pet Portrait",
            "description": "Hand-painted watercolour portrait from your favourite photo",
            "price": 5500,
            "category": "memorial",
            "subcategory": "Art",
            "image": "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400",
            "paw_reward_points": 150,
            "in_stock": True
        },
        {
            "id": "fprod-blanket",
            "name": "Memory Blanket",
            "description": "Soft fleece blanket printed with your pet's photos",
            "price": 2500,
            "category": "memorial",
            "subcategory": "Comfort",
            "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400",
            "paw_reward_points": 70,
            "in_stock": True
        }
    ]
    
    # Default partners
    default_partners = [
        {
            "id": "fp-petrest",
            "name": "Pet Rest Services",
            "type": "cremation",
            "description": "Premium cremation services with home pickup",
            "cities": ["Mumbai", "Pune", "Bangalore"],
            "contact_name": "Rahul Sharma",
            "contact_email": "contact@petrest.in",
            "contact_phone": "+91 98765 43210",
            "services": ["Individual Cremation", "Group Cremation", "Home Pickup", "Urn Delivery"],
            "commission_percent": 15,
            "rating": 4.8,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "fp-pawheaven",
            "name": "Paw Heaven Cemetery",
            "type": "burial",
            "description": "Peaceful pet cemetery with beautiful memorial gardens",
            "cities": ["Bangalore", "Chennai"],
            "contact_name": "Priya Kumar",
            "contact_email": "info@pawheaven.in",
            "contact_phone": "+91 87654 32109",
            "services": ["Plot Booking", "Burial Services", "Memorial Maintenance"],
            "commission_percent": 12,
            "rating": 4.9,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "fp-lastjourney",
            "name": "Last Journey Transport",
            "type": "transport",
            "description": "Dignified pet transport services",
            "cities": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"],
            "contact_name": "Amit Verma",
            "contact_email": "book@lastjourney.pet",
            "contact_phone": "+91 76543 21098",
            "services": ["Home Pickup", "Hospital to Crematorium", "24/7 Service"],
            "commission_percent": 10,
            "rating": 4.7,
            "is_verified": True,
            "is_active": True
        }
    ]
    
    products_seeded = 0
    partners_seeded = 0
    
    for product in default_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.farewell_products.update_one(
            {"id": product["id"]},
            {"$setOnInsert": product},
            upsert=True
        )
        if result.upserted_id:
            products_seeded += 1
    
    for partner in default_partners:
        partner["created_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.farewell_partners.update_one(
            {"id": partner["id"]},
            {"$setOnInsert": partner},
            upsert=True
        )
        if result.upserted_id:
            partners_seeded += 1
    
    logger.info(f"Farewell data seeded: {products_seeded} products, {partners_seeded} partners")
    
    return {
        "success": True,
        "products_seeded": products_seeded,
        "partners_seeded": partners_seeded
    }


# ============ ADMIN SETTINGS ============

@router.get("/admin/settings")
async def get_farewell_settings():
    """Get farewell pillar settings"""
    db = get_db()
    
    settings = await db.farewell_settings.find_one({}, {"_id": 0})
    
    if not settings:
        settings = {
            "auto_assign_enabled": False,
            "default_response_time": "24 hours",
            "notification_emails": [],
            "paw_rewards": {
                "enabled": True,
                "points_per_service": 200,
                "points_per_product_purchase": 50
            },
            "grief_support": {
                "enabled": True,
                "counsellor_email": "support@thedoggycompany.com"
            }
        }
    
    return settings


@router.put("/admin/settings")
async def update_farewell_settings(settings: dict):
    """Update farewell pillar settings"""
    db = get_db()
    
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.farewell_settings.update_one(
        {},
        {"$set": settings},
        upsert=True
    )
    
    return {"success": True}


# ============ BUNDLES ENDPOINTS ============

@router.get("/bundles")
async def get_farewell_bundles(
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get farewell bundles - memorial packages and service bundles"""
    db = get_db()
    
    query = {}
    if category:
        query["category"] = category
    
    bundles = await db.farewell_bundles.find(query, {"_id": 0}).sort("featured", -1).to_list(limit)
    
    return {
        "bundles": bundles,
        "total": len(bundles)
    }


@router.get("/bundles/{bundle_id}")
async def get_farewell_bundle(bundle_id: str):
    """Get a specific farewell bundle by ID"""
    db = get_db()
    
    bundle = await db.farewell_bundles.find_one({"id": bundle_id}, {"_id": 0})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return bundle
