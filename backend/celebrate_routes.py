"""
Celebrate Pillar Routes
Handles cakes, treats, hampers - The flagship pillar
Full admin support: Requests, Partners, Products, Bundles, Settings
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import csv
import io

router = APIRouter(prefix="/api/celebrate", tags=["celebrate"])

def get_db():
    from server import db
    return db

def get_logger():
    from server import logger
    return logger

# ============ MODELS ============

class CelebrateProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    compare_price: Optional[float] = None
    image: Optional[str] = ""
    category: str = "cakes"  # cakes, treats, hampers, accessories, frozen, meals
    subcategory: Optional[str] = ""
    tags: List[str] = []
    sizes: List[Dict] = []  # [{name: "500g", price: 600}, {name: "1kg", price: 1100}]
    flavors: List[str] = []
    bases: List[str] = []  # NEW: Oats, Ragi, etc.
    pet_sizes: List[str] = []  # small, medium, large
    in_stock: bool = True
    is_bestseller: bool = False
    is_new: bool = False
    is_birthday_perk: bool = False
    birthday_discount_percent: Optional[int] = None
    paw_reward_points: int = 0
    delivery_cities: List[str] = []  # empty = all cities
    fresh_delivery_cities: List[str] = []  # NEW: Cities for fresh cake delivery
    life_stage: Optional[str] = None  # NEW: puppy, adult, senior, all-ages
    occasion: Optional[str] = None  # NEW: birthday, gotcha-day, festival, special-treat
    dietary: Optional[str] = None  # NEW: grain-free, vegan, low-fat, hypoallergenic
    pan_india: bool = False

class CelebrateBundleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    original_price: Optional[float] = None
    image: Optional[str] = ""
    category: str = "hampers"
    items: List[str] = []  # List of included items
    is_recommended: bool = True
    occasion: Optional[str] = ""  # birthday, gotcha-day, pawty
    paw_reward_points: int = 0

class CelebratePartnerCreate(BaseModel):
    name: str
    type: str = "bakery"  # bakery, supplier, delivery
    description: Optional[str] = ""
    logo: Optional[str] = ""
    contact_name: Optional[str] = ""
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    website: Optional[str] = ""
    cities: List[str] = []
    specializations: List[str] = []
    commission_percent: float = 0
    rating: float = 5.0
    is_verified: bool = False
    is_active: bool = True

class CelebrateRequestCreate(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    request_type: str = "custom_cake"  # custom_cake, bulk_order, special_event, consultation
    details: Optional[str] = ""
    preferred_date: Optional[str] = None
    budget_range: Optional[str] = None
    city: Optional[str] = None

class CelebrateSettingsUpdate(BaseModel):
    auto_acknowledge: bool = True
    notification_email: Optional[str] = None
    notification_whatsapp: Optional[str] = None
    default_lead_time_days: int = 2
    min_order_value: float = 0
    free_delivery_threshold: float = 1500
    delivery_fee: float = 100
    express_delivery_fee: float = 200
    available_cities: List[str] = []
    pan_india_categories: List[str] = []  # categories available for pan-india shipping
    working_hours: Optional[str] = "9 AM - 8 PM"
    cut_off_time: Optional[str] = "6 PM"

# ============ PUBLIC ENDPOINTS ============

@router.get("/products")
async def get_celebrate_products(
    category: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get celebrate products (cakes, treats, etc.)"""
    db = get_db()
    
    query = {"pillar": "celebrate"}
    if category:
        query["category"] = category
    
    products = await db.celebrate_products.find(query).skip(skip).limit(limit).to_list(length=limit)
    
    for p in products:
        p["id"] = p.get("id", str(p.get("_id", "")))
        p.pop("_id", None)
    
    return {"products": products, "total": await db.celebrate_products.count_documents(query)}

@router.get("/bundles")
async def get_celebrate_bundles():
    """Get celebrate bundles/hampers"""
    db = get_db()
    
    bundles = await db.celebrate_bundles.find({}).to_list(length=100)
    
    for b in bundles:
        b["id"] = b.get("id", str(b.get("_id", "")))
        b.pop("_id", None)
    
    return {"bundles": bundles}

@router.get("/partners")
async def get_celebrate_partners(city: Optional[str] = None):
    """Get celebrate partners (bakeries)"""
    db = get_db()
    
    query = {"is_active": True}
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.celebrate_partners.find(query).to_list(length=100)
    
    for p in partners:
        p["id"] = p.get("id", str(p.get("_id", "")))
        p.pop("_id", None)
    
    return {"partners": partners}

# ============ REQUEST ENDPOINTS ============

@router.post("/requests")
async def create_celebrate_request(request: CelebrateRequestCreate):
    """Create a celebrate request (custom cake, bulk order, etc.)
    
    UNIFIED FLOW: Every request creates Notification → Ticket → Inbox
    """
    db = get_db()
    logger = get_logger()
    from timestamp_utils import get_utc_timestamp
    
    request_id = f"cel-req-{uuid.uuid4().hex[:8]}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-CEL-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = get_utc_timestamp()
    
    user_name = request.user_name or request.customer_name or "Guest"
    pet_name = request.pet_name or "Pet"
    request_type = request.request_type or "custom_order"
    
    request_doc = {
        "id": request_id,
        "pillar": "celebrate",
        "notification_id": notification_id,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        **request.dict(),
        "status": "submitted",
        "priority": "normal",
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True,
        "timeline": [{"status": "submitted", "timestamp": now_iso, "note": "Request submitted"}]
    }
    
    await db.celebrate_requests.insert_one(request_doc)
    
    # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": f"celebrate_{request_type}",
        "pillar": "celebrate",
        "title": f"Celebrate Request: {request_type.replace('_', ' ').title()} - {pet_name}",
        "message": f"{user_name} submitted a {request_type.replace('_', ' ')} request for {pet_name}",
        "read": False,
        "status": "unread",
        "urgency": "medium",
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": user_name,
            "email": getattr(request, 'user_email', None) or getattr(request, 'customer_email', None),
            "phone": getattr(request, 'user_phone', None) or getattr(request, 'customer_phone', None)
        },
        "pet": {"name": pet_name},
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now_iso,
        "read_at": None
    })
    logger.info(f"[UNIFIED FLOW] Celebrate notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (MANDATORY) ====================
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "source": "celebrate_pillar",
        "source_id": request_id,
        "pillar": "celebrate",
        "category": "celebrate",
        "subcategory": request_type,
        "subject": f"Celebrate Request: {request_type.replace('_', ' ').title()} for {pet_name}",
        "description": f"New celebrate request from {user_name} for {pet_name}",
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "member": {
            "name": user_name,
            "email": getattr(request, 'user_email', None) or getattr(request, 'customer_email', None),
            "phone": getattr(request, 'user_phone', None) or getattr(request, 'customer_phone', None)
        },
        "pet": {"name": pet_name},
        "created_at": now_iso,
        "updated_at": now_iso,
        "tags": ["celebrate", request_type, "unified-flow"],
        "unified_flow_processed": True
    }
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Celebrate ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (MANDATORY) ====================
    inbox_entry = {
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "request_type": request_type,
        "pillar": "celebrate",
        "category": request_type,
        "status": "new",
        "urgency": "medium",
        "customer_name": user_name,
        "customer_email": getattr(request, 'user_email', None) or getattr(request, 'customer_email', None),
        "customer_phone": getattr(request, 'user_phone', None) or getattr(request, 'customer_phone', None),
        "member": {
            "name": user_name,
            "email": getattr(request, 'user_email', None) or getattr(request, 'customer_email', None),
            "phone": getattr(request, 'user_phone', None) or getattr(request, 'customer_phone', None)
        },
        "pet": {"name": pet_name},
        "preview": f"Celebrate: {request_type.replace('_', ' ').title()} - {pet_name}",
        "message": f"{request_type.replace('_', ' ').title()} request for {pet_name}",
        "tags": ["celebrate", request_type],
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True
    }
    await db.channel_intakes.insert_one({k: v for k, v in inbox_entry.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Celebrate inbox created: {inbox_id}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: Celebrate {request_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
    
    # Get settings for auto-acknowledge
    settings = await db.celebrate_settings.find_one({"type": "general"})
    if settings and settings.get("auto_acknowledge"):
        request_doc["status"] = "acknowledged"
        request_doc["timeline"].append({
            "status": "acknowledged",
            "timestamp": now_iso,
            "note": "Auto-acknowledged"
        })
        await db.celebrate_requests.update_one(
            {"id": request_id},
            {"$set": {"status": "acknowledged", "timeline": request_doc["timeline"]}}
        )
    
    return {
        "message": "Request submitted",
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id
    }

@router.get("/requests")
async def get_celebrate_requests(status: Optional[str] = None, limit: int = 100):
    """Get all celebrate requests"""
    db = get_db()
    
    query = {}
    if status and status != "all":
        query["status"] = status
    
    requests = await db.celebrate_requests.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    for r in requests:
        r["id"] = r.get("id", str(r.get("_id", "")))
        r.pop("_id", None)
    
    return {"requests": requests}

@router.get("/requests/{request_id}")
async def get_celebrate_request(request_id: str):
    """Get a specific celebrate request"""
    db = get_db()
    
    request = await db.celebrate_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request["id"] = request.get("id", str(request.get("_id", "")))
    request.pop("_id", None)
    
    return request

@router.put("/requests/{request_id}")
async def update_celebrate_request(request_id: str, update: Dict[str, Any]):
    """Update a celebrate request status"""
    db = get_db()
    
    request = await db.celebrate_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update["updated_at"] = datetime.now(timezone.utc)
    
    # Add to timeline if status changed
    if "status" in update and update["status"] != request.get("status"):
        timeline = request.get("timeline", [])
        timeline.append({
            "status": update["status"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": update.get("note", f"Status changed to {update['status']}")
        })
        update["timeline"] = timeline
    
    await db.celebrate_requests.update_one({"id": request_id}, {"$set": update})
    
    return {"message": "Request updated"}

# ============ ADMIN PRODUCT ENDPOINTS ============

@router.get("/admin/products")
async def admin_get_products():
    """Admin: Get all celebrate products"""
    db = get_db()
    
    products = await db.celebrate_products.find({}).to_list(length=500)
    
    for p in products:
        p["id"] = p.get("id", str(p.get("_id", "")))
        p.pop("_id", None)
    
    return {"products": products}

@router.post("/admin/products")
async def admin_create_product(product: CelebrateProductCreate):
    """Admin: Create a celebrate product"""
    db = get_db()
    
    product_id = f"cel-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    product_doc = {
        "id": product_id,
        "pillar": "celebrate",
        **product.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.celebrate_products.insert_one(product_doc)
    
    return {"message": "Product created", "id": product_id}

# ============ CSV IMPORT/EXPORT (Must come BEFORE {product_id} routes) ============

@router.get("/admin/products/export-csv")
async def export_products_csv():
    """Export celebrate products to CSV"""
    db = get_db()
    
    products = await db.celebrate_products.find({}).to_list(length=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "compare_price", "category", 
        "subcategory", "image", "tags", "sizes", "flavors", "in_stock",
        "is_bestseller", "is_new", "paw_reward_points", "pan_india"
    ])
    
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("name", ""),
            p.get("description", ""),
            p.get("price", 0),
            p.get("compare_price", ""),
            p.get("category", ""),
            p.get("subcategory", ""),
            p.get("image", ""),
            "|".join(p.get("tags", [])),
            "|".join([f"{s.get('name')}:{s.get('price')}" for s in p.get("sizes", [])]),
            "|".join(p.get("flavors", [])),
            p.get("in_stock", True),
            p.get("is_bestseller", False),
            p.get("is_new", False),
            p.get("paw_reward_points", 0),
            p.get("pan_india", False)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=celebrate_products.csv"}
    )

@router.post("/admin/products/import-csv")
async def import_products_csv(file: UploadFile = File(...)):
    """Import celebrate products from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        product_id = row.get("id") or f"cel-{uuid.uuid4().hex[:8]}"
        
        sizes = []
        if row.get("sizes"):
            for s in row["sizes"].split("|"):
                if ":" in s:
                    name, price = s.split(":")
                    sizes.append({"name": name, "price": float(price)})
        
        product_doc = {
            "id": product_id,
            "pillar": "celebrate",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "compare_price": float(row["compare_price"]) if row.get("compare_price") else None,
            "category": row.get("category", "cakes"),
            "subcategory": row.get("subcategory", ""),
            "image": row.get("image", ""),
            "tags": row.get("tags", "").split("|") if row.get("tags") else [],
            "sizes": sizes,
            "flavors": row.get("flavors", "").split("|") if row.get("flavors") else [],
            "in_stock": row.get("in_stock", "true").lower() == "true",
            "is_bestseller": row.get("is_bestseller", "false").lower() == "true",
            "is_new": row.get("is_new", "false").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "pan_india": row.get("pan_india", "false").lower() == "true",
            "updated_at": datetime.now(timezone.utc)
        }
        
        existing = await db.celebrate_products.find_one({"id": product_id})
        if existing:
            await db.celebrate_products.update_one({"id": product_id}, {"$set": product_doc})
            updated += 1
        else:
            product_doc["created_at"] = datetime.now(timezone.utc)
            await db.celebrate_products.insert_one(product_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} products"}

@router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, product: CelebrateProductCreate):
    """Admin: Update a celebrate product (checks both celebrate_products and main products collection)"""
    db = get_db()
    
    # Try celebrate_products first
    existing = await db.celebrate_products.find_one({"id": product_id})
    collection = db.celebrate_products
    
    # If not found, try main products collection (Shopify synced products)
    if not existing:
        existing = await db.products_master.find_one({"$or": [{"id": product_id}, {"shopify_id": product_id}]})
        collection = db.products_master
    
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {
        **product.dict(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if collection == db.products_master:
        # For Shopify products, use the _id or shopify_id
        query = {"$or": [{"id": product_id}, {"shopify_id": product_id}]}
    else:
        query = {"id": product_id}
    
    await collection.update_one(query, {"$set": update_data})
    
    return {"message": "Product updated"}

@router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str):
    """Admin: Delete a celebrate product"""
    db = get_db()
    
    result = await db.celebrate_products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

# ============ ADMIN BUNDLE ENDPOINTS ============

@router.get("/admin/bundles")
async def admin_get_bundles():
    """Admin: Get all celebrate bundles"""
    db = get_db()
    
    bundles = await db.celebrate_bundles.find({}).to_list(length=100)
    
    for b in bundles:
        b["id"] = b.get("id", str(b.get("_id", "")))
        b.pop("_id", None)
    
    return {"bundles": bundles}

@router.post("/admin/bundles")
async def admin_create_bundle(bundle: CelebrateBundleCreate):
    """Admin: Create a celebrate bundle"""
    db = get_db()
    
    bundle_id = f"cel-bun-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    bundle_doc = {
        "id": bundle_id,
        "pillar": "celebrate",
        **bundle.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.celebrate_bundles.insert_one(bundle_doc)
    
    return {"message": "Bundle created", "id": bundle_id}

@router.get("/admin/bundles/export-csv")
async def export_bundles_csv():
    """Export celebrate bundles to CSV"""
    db = get_db()
    
    bundles = await db.celebrate_bundles.find({}).to_list(length=500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "category",
        "items", "image", "occasion", "is_recommended", "paw_reward_points"
    ])
    
    for b in bundles:
        writer.writerow([
            b.get("id", ""),
            b.get("name", ""),
            b.get("description", ""),
            b.get("price", 0),
            b.get("original_price", ""),
            b.get("category", ""),
            "|".join(b.get("items", [])),
            b.get("image", ""),
            b.get("occasion", ""),
            b.get("is_recommended", True),
            b.get("paw_reward_points", 0)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=celebrate_bundles.csv"}
    )

@router.post("/admin/bundles/import-csv")
async def import_bundles_csv(file: UploadFile = File(...)):
    """Import celebrate bundles from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        bundle_id = row.get("id") or f"cel-bun-{uuid.uuid4().hex[:8]}"
        
        bundle_doc = {
            "id": bundle_id,
            "pillar": "celebrate",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "category": row.get("category", "hampers"),
            "items": row.get("items", "").split("|") if row.get("items") else [],
            "image": row.get("image", ""),
            "occasion": row.get("occasion", ""),
            "is_recommended": row.get("is_recommended", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "updated_at": datetime.now(timezone.utc)
        }
        
        existing = await db.celebrate_bundles.find_one({"id": bundle_id})
        if existing:
            await db.celebrate_bundles.update_one({"id": bundle_id}, {"$set": bundle_doc})
            updated += 1
        else:
            bundle_doc["created_at"] = datetime.now(timezone.utc)
            await db.celebrate_bundles.insert_one(bundle_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} bundles"}

@router.put("/admin/bundles/{bundle_id}")
async def admin_update_bundle(bundle_id: str, bundle: CelebrateBundleCreate):
    """Admin: Update a celebrate bundle"""
    db = get_db()
    
    existing = await db.celebrate_bundles.find_one({"id": bundle_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    update_data = {
        **bundle.dict(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.celebrate_bundles.update_one({"id": bundle_id}, {"$set": update_data})
    
    return {"message": "Bundle updated"}

@router.delete("/admin/bundles/{bundle_id}")
async def admin_delete_bundle(bundle_id: str):
    """Admin: Delete a celebrate bundle"""
    db = get_db()
    
    result = await db.celebrate_bundles.delete_one({"id": bundle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}

# ============ ADMIN PARTNER ENDPOINTS ============

@router.get("/admin/partners")
async def admin_get_partners():
    """Admin: Get all celebrate partners"""
    db = get_db()
    
    partners = await db.celebrate_partners.find({}).to_list(length=100)
    
    for p in partners:
        p["id"] = p.get("id", str(p.get("_id", "")))
        p.pop("_id", None)
    
    return {"partners": partners}

@router.post("/admin/partners")
async def admin_create_partner(partner: CelebratePartnerCreate):
    """Admin: Create a celebrate partner"""
    db = get_db()
    
    partner_id = f"cel-ptr-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    partner_doc = {
        "id": partner_id,
        "pillar": "celebrate",
        **partner.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.celebrate_partners.insert_one(partner_doc)
    
    return {"message": "Partner created", "id": partner_id}

@router.put("/admin/partners/{partner_id}")
async def admin_update_partner(partner_id: str, partner: CelebratePartnerCreate):
    """Admin: Update a celebrate partner"""
    db = get_db()
    
    existing = await db.celebrate_partners.find_one({"id": partner_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = {
        **partner.dict(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.celebrate_partners.update_one({"id": partner_id}, {"$set": update_data})
    
    return {"message": "Partner updated"}

@router.delete("/admin/partners/{partner_id}")
async def admin_delete_partner(partner_id: str):
    """Admin: Delete a celebrate partner"""
    db = get_db()
    
    result = await db.celebrate_partners.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner deleted"}

# ============ ADMIN SETTINGS ENDPOINTS ============

@router.get("/admin/settings")
async def admin_get_settings():
    """Admin: Get celebrate settings"""
    db = get_db()
    
    settings = await db.celebrate_settings.find_one({"type": "general"})
    if not settings:
        # Return defaults
        return {
            "auto_acknowledge": True,
            "notification_email": "",
            "notification_whatsapp": "",
            "default_lead_time_days": 2,
            "min_order_value": 0,
            "free_delivery_threshold": 1500,
            "delivery_fee": 100,
            "express_delivery_fee": 200,
            "available_cities": ["Mumbai", "Bangalore", "Gurgaon", "Delhi", "Pune", "Hyderabad"],
            "pan_india_categories": ["treats", "nut-butters"],
            "working_hours": "9 AM - 8 PM",
            "cut_off_time": "6 PM"
        }
    
    settings.pop("_id", None)
    return settings

@router.put("/admin/settings")
async def admin_update_settings(settings: CelebrateSettingsUpdate):
    """Admin: Update celebrate settings"""
    db = get_db()
    
    settings_doc = {
        "type": "general",
        **settings.dict(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.celebrate_settings.update_one(
        {"type": "general"},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"message": "Settings updated"}

# ============ STATS ENDPOINT ============

@router.get("/stats")
async def get_celebrate_stats():
    """Get celebrate pillar statistics"""
    db = get_db()
    
    total_products = await db.celebrate_products.count_documents({})
    total_bundles = await db.celebrate_bundles.count_documents({})
    total_partners = await db.celebrate_partners.count_documents({"is_active": True})
    
    # Request stats
    pending_requests = await db.celebrate_requests.count_documents({"status": {"$in": ["submitted", "acknowledged"]}})
    completed_requests = await db.celebrate_requests.count_documents({"status": "completed"})
    
    return {
        "total_products": total_products,
        "total_bundles": total_bundles,
        "total_partners": total_partners,
        "pending_requests": pending_requests,
        "completed_requests": completed_requests
    }


@router.post("/seed")
async def seed_celebrate_endpoint():
    """API endpoint to seed celebrate data"""
    return await seed_celebrate_data()


# ============ SEED DATA ============

async def seed_celebrate_data():
    """Seed sample celebrate data"""
    db = get_db()
    logger = get_logger()
    
    products_seeded = 0
    bundles_seeded = 0
    partners_seeded = 0
    
    # Sample Products
    sample_products = [
        {
            "id": "cel-sample-001",
            "name": "Classic Paw Print Cake",
            "description": "A delicious chicken & oats cake with adorable paw print decoration",
            "price": 599,
            "compare_price": 699,
            "category": "cakes",
            "subcategory": "birthday-cakes",
            "image": "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400",
            "tags": ["bestseller", "birthday"],
            "sizes": [{"name": "500g", "price": 599}, {"name": "1kg", "price": 1099}],
            "flavors": ["Chicken & Oats", "Peanut Butter"],
            "in_stock": True,
            "is_bestseller": True,
            "paw_reward_points": 50
        },
        {
            "id": "cel-sample-002",
            "name": "Breed Special - Golden Retriever",
            "description": "Shaped like a Golden Retriever face, perfect for breed lovers",
            "price": 849,
            "category": "cakes",
            "subcategory": "breed-cakes",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "tags": ["breed-special", "custom"],
            "sizes": [{"name": "750g", "price": 849}],
            "flavors": ["Chicken & Rice"],
            "in_stock": True,
            "paw_reward_points": 80
        },
        {
            "id": "cel-sample-003",
            "name": "Peanut Butter Pupcakes (6 pcs)",
            "description": "Mini cupcakes perfect for sharing at pawties",
            "price": 349,
            "category": "treats",
            "subcategory": "pupcakes",
            "image": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400",
            "tags": ["party-pack", "shareable"],
            "in_stock": True,
            "paw_reward_points": 30
        },
        {
            "id": "cel-sample-004",
            "name": "Desi Ladoo Treats",
            "description": "Traditional Indian ladoo made pet-safe with natural ingredients",
            "price": 299,
            "category": "treats",
            "subcategory": "desi-treats",
            "image": "https://images.unsplash.com/photo-1605196560547-b960fb77d8e4?w=400",
            "tags": ["desi", "indian", "festival"],
            "in_stock": True,
            "pan_india": True,
            "paw_reward_points": 25
        }
    ]
    
    for product in sample_products:
        product["pillar"] = "celebrate"
        product["created_at"] = datetime.now(timezone.utc)
        product["updated_at"] = datetime.now(timezone.utc)
        
        await db.celebrate_products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        products_seeded += 1
    
    # Sample Bundles
    sample_bundles = [
        {
            "id": "cel-bun-001",
            "name": "Birthday Pawty Box",
            "description": "Complete birthday celebration package with cake, treats, and party accessories",
            "price": 1499,
            "original_price": 1899,
            "category": "hampers",
            "items": ["1 Birthday Cake (500g)", "6 Pupcakes", "Party Hat", "Birthday Bandana", "Confetti treats"],
            "image": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400",
            "occasion": "birthday",
            "is_recommended": True,
            "paw_reward_points": 150
        },
        {
            "id": "cel-bun-002",
            "name": "Gotcha Day Celebration",
            "description": "Celebrate your rescue pet's adoption anniversary",
            "price": 999,
            "original_price": 1299,
            "category": "hampers",
            "items": ["1 Heart Cake (500g)", "Treats Jar", "Gotcha Day Bandana", "Photo Frame"],
            "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400",
            "occasion": "gotcha-day",
            "is_recommended": True,
            "paw_reward_points": 100
        }
    ]
    
    for bundle in sample_bundles:
        bundle["pillar"] = "celebrate"
        bundle["created_at"] = datetime.now(timezone.utc)
        bundle["updated_at"] = datetime.now(timezone.utc)
        
        await db.celebrate_bundles.update_one(
            {"id": bundle["id"]},
            {"$set": bundle},
            upsert=True
        )
        bundles_seeded += 1
    
    # Sample Partners
    sample_partners = [
        {
            "id": "cel-ptr-001",
            "name": "The Doggy Bakery Mumbai",
            "type": "bakery",
            "description": "Original Doggy Company bakery - premium pet cakes since 2018",
            "logo": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200",
            "contact_email": "woof@thedoggycompany.in",
            "contact_phone": "+91 98765 43210",
            "cities": ["Mumbai", "Thane", "Navi Mumbai"],
            "specializations": ["Birthday Cakes", "Breed Cakes", "Custom Designs"],
            "commission_percent": 0,
            "rating": 4.9,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "cel-ptr-002",
            "name": "Pawsome Bakes Bangalore",
            "type": "bakery",
            "description": "Partner bakery specializing in South Indian pet treats",
            "logo": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200",
            "contact_email": "bangalore@pawsomebakes.in",
            "contact_phone": "+91 98765 43211",
            "cities": ["Bangalore", "Mysore"],
            "specializations": ["South Indian Treats", "Healthy Options"],
            "commission_percent": 15,
            "rating": 4.7,
            "is_verified": True,
            "is_active": True
        }
    ]
    
    for partner in sample_partners:
        partner["pillar"] = "celebrate"
        partner["created_at"] = datetime.now(timezone.utc)
        partner["updated_at"] = datetime.now(timezone.utc)
        
        await db.celebrate_partners.update_one(
            {"id": partner["id"]},
            {"$set": partner},
            upsert=True
        )
        partners_seeded += 1
    
    logger.info(f"Celebrate seed complete: {products_seeded} products, {bundles_seeded} bundles, {partners_seeded} partners")
    
    return {
        "products_seeded": products_seeded,
        "bundles_seeded": bundles_seeded,
        "partners_seeded": partners_seeded
    }

@router.post("/admin/seed")
async def admin_seed_celebrate():
    """Admin: Seed sample celebrate data"""
    return await seed_celebrate_data()
