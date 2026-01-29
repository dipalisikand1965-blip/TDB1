"""
Travel Pillar Routes
Handles all travel-related requests: cab, train, flight, relocation
Every request goes through concierge assessment - never instant confirm

UNIFIED FLOW ENFORCED: All requests create Notification → Ticket → Inbox
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/travel", tags=["travel"])

def get_consistent_timestamp() -> str:
    """Get ISO timestamp with consistent format (always with +00:00 timezone)"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Get logger from server
def get_logger():
    from server import logger
    return logger

# Travel Request Models
class TravelRequestCreate(BaseModel):
    travel_type: str  # cab, train, flight, relocation
    pet_id: Optional[str] = None  # Optional for non-logged-in users
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    pickup_location: Optional[str] = None
    pickup_city: Optional[str] = None
    drop_location: Optional[str] = None
    dropoff_location: Optional[str] = None  # Alias for drop_location
    drop_city: Optional[str] = None
    travel_date: Optional[str] = None
    date: Optional[str] = None  # Alias for travel_date
    travel_time: Optional[str] = None
    time: Optional[str] = None  # Alias for travel_time
    return_date: Optional[str] = None
    is_round_trip: bool = False
    special_requirements: Optional[str] = None
    # Pet details (may be auto-filled or user-provided)
    pet_size: Optional[str] = None
    pet_weight: Optional[float] = None
    crate_trained: Optional[bool] = None
    travel_anxiety: Optional[str] = None
    motion_sickness: bool = False
    additional_notes: Optional[str] = None
    notes: Optional[str] = None  # Alias for additional_notes
    # User info
    user_email: Optional[str] = None
    contact_email: Optional[str] = None  # Alias
    user_phone: Optional[str] = None
    contact_phone: Optional[str] = None  # Alias
    user_name: Optional[str] = None
    contact_name: Optional[str] = None  # Alias
    freeform_query: Optional[str] = None
    
    # Validator to handle empty strings for optional float fields
    @field_validator('pet_weight', mode='before')
    @classmethod
    def empty_str_to_none_float(cls, v):
        if v == '' or v is None:
            return None
        return v


class TravelRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    concierge_notes: Optional[str] = None
    partner_details: Optional[Dict] = None
    quoted_price: Optional[float] = None
    confirmed_date: Optional[str] = None
    confirmed_time: Optional[str] = None


# Travel Types Configuration
TRAVEL_TYPES = {
    "cab": {
        "name": "Cab / Road Travel",
        "category": "ground",
        "requires_assessment": True,
        "typical_response_time": "2-4 hours",
        "risk_level": "low"
    },
    "train": {
        "name": "Train / Bus Travel",
        "category": "ground",
        "requires_assessment": True,
        "typical_response_time": "24-48 hours",
        "risk_level": "medium"
    },
    "flight": {
        "name": "Domestic Flight",
        "category": "air",
        "requires_assessment": True,
        "typical_response_time": "48-72 hours",
        "risk_level": "high",
        "mandatory_checks": ["weight", "crate_trained", "health_certificate"]
    },
    "relocation": {
        "name": "Pet Relocation",
        "category": "premium",
        "requires_assessment": True,
        "typical_response_time": "5-7 days",
        "risk_level": "high",
        "concierge_led": True
    }
}


@router.get("/types")
async def get_travel_types():
    """Get available travel types and their configurations"""
    return {"travel_types": TRAVEL_TYPES}


@router.post("/request")
async def create_travel_request(request: TravelRequestCreate):
    """
    Create a new travel request.
    This does NOT confirm booking - it creates a request for concierge review.
    """
    db = get_db()
    logger = get_logger()
    
    try:
        # Generate IDs for unified flow
        request_id = f"TRV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
        
        # Get travel type config
        travel_config = TRAVEL_TYPES.get(request.travel_type, TRAVEL_TYPES["cab"])
        
        # Handle field aliases - use provided or aliased values
        pickup_loc = request.pickup_location or ""
        pickup_city = request.pickup_city or pickup_loc  # Use pickup_location as city if city not provided
        drop_loc = request.drop_location or request.dropoff_location or ""
        drop_city = request.drop_city or drop_loc  # Use drop_location as city if city not provided
        travel_date = request.travel_date or request.date or ""
        travel_time = request.travel_time or request.time or ""
        user_name = request.user_name or request.contact_name or ""
        user_email = request.user_email or request.contact_email or ""
        user_phone = request.user_phone or request.contact_phone or ""
        additional_notes = request.additional_notes or request.notes or ""
        
        # Calculate risk assessment
        risk_factors = []
        if request.travel_type == "flight":
            if not request.crate_trained:
                risk_factors.append("Not crate trained - may need preparation")
            if request.travel_anxiety:
                risk_factors.append(f"Travel anxiety: {request.travel_anxiety}")
            if request.pet_weight and request.pet_weight > 25:
                risk_factors.append("Large pet - limited airline options")
        
        if request.motion_sickness:
            risk_factors.append("History of motion sickness")
        
        # Build the request document
        request_doc = {
            "request_id": request_id,
            "travel_type": request.travel_type,
            "travel_type_name": travel_config["name"],
            "status": "submitted",
            "risk_level": travel_config["risk_level"],
            "risk_factors": risk_factors,
            
            # Pet info
            "pet": {
                "id": request.pet_id or "",
                "name": request.pet_name or "",
                "breed": request.pet_breed,
                "size": request.pet_size,
                "weight": request.pet_weight,
                "crate_trained": request.crate_trained,
                "travel_anxiety": request.travel_anxiety,
                "motion_sickness": request.motion_sickness
            },
            
            # Journey details
            "journey": {
                "pickup_location": pickup_loc,
                "pickup_city": pickup_city,
                "drop_location": drop_loc,
                "drop_city": drop_city,
                "travel_date": travel_date,
                "travel_time": travel_time,
                "return_date": request.return_date,
                "is_round_trip": request.is_round_trip
            },
            
            # Customer info
            "customer": {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            },
            
            # Additional info
            "special_requirements": request.special_requirements,
            "additional_notes": request.additional_notes,
            "freeform_query": request.freeform_query,
            
            # Tracking
            "created_at": get_consistent_timestamp(),
            "updated_at": get_consistent_timestamp(),
            "typical_response_time": travel_config["typical_response_time"],
            "concierge_led": travel_config.get("concierge_led", False),
            
            # Will be filled by concierge
            "assigned_to": None,
            "concierge_notes": None,
            "partner_details": None,
            "quoted_price": None,
            "confirmed_date": None,
            "confirmed_time": None
        }
        
        # Insert the request
        await db.travel_requests.insert_one(request_doc)
        
        # Create Service Desk ticket
        ticket_doc = {
            "ticket_id": request_id,
            "source": "travel_pillar",
            "pillar": "travel",
            "category": request.travel_type,
            "status": "new",
            "priority": 2 if travel_config["risk_level"] == "high" else 3,
            "urgency": "high" if travel_config["risk_level"] == "high" else "medium",
            "subject": f"Travel Request: {travel_config['name']} - {request.pet_name}",
            "description": f"{request.user_name or 'Customer'} needs {travel_config['name'].lower()} for {request.pet_name} ({request.pet_breed or 'dog'}) from {request.pickup_city} to {request.drop_city} on {request.travel_date}",
            "member": {
                "name": request.user_name,
                "email": request.user_email,
                "phone": request.user_phone,
                "city": request.pickup_city
            },
            "pet_context": {
                "pet_id": request.pet_id,
                "pet_name": request.pet_name,
                "pet_breed": request.pet_breed
            },
            "pet": {
                "name": request.pet_name,
                "breed": request.pet_breed,
                "id": request.pet_id
            },
            "notification_id": notification_id,
            "inbox_id": inbox_id,
            "metadata": {
                "travel_request_id": request_id,
                "travel_type": request.travel_type,
                "risk_level": travel_config["risk_level"],
                "risk_factors": risk_factors
            },
            "tags": ["travel", request.travel_type, "unified-flow"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "timeline": [{
                "action": "created",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": "Travel request submitted via Travel Pillar"
            }],
            "unified_flow_processed": True
        }
        # Insert into BOTH collections
        await db.service_desk_tickets.insert_one(ticket_doc)
        await db.tickets.insert_one(ticket_doc)
        
        # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
        await db.admin_notifications.insert_one({
            "id": notification_id,
            "type": f"travel_{request.travel_type}",
            "pillar": "travel",
            "title": f"New Travel Request: {travel_config['name']} - {request.pet_name}",
            "message": f"{request.user_name or 'Customer'} needs {travel_config['name'].lower()} from {request.pickup_city} to {request.drop_city}",
            "read": False,
            "status": "unread",
            "urgency": "high" if travel_config["risk_level"] == "high" else "medium",
            "ticket_id": request_id,
            "inbox_id": inbox_id,
            "customer": {
                "name": request.user_name,
                "email": request.user_email,
                "phone": request.user_phone
            },
            "pet": {
                "name": request.pet_name,
                "breed": request.pet_breed
            },
            "link": f"/admin?tab=servicedesk&ticket={request_id}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read_at": None
        })
        logger.info(f"[UNIFIED FLOW] Travel notification created: {notification_id}")
        
        # ==================== STEP 2: Unified Inbox (MANDATORY) ====================
        inbox_entry = {
            "id": inbox_id,
            "request_id": request_id,
            "ticket_id": request_id,
            "notification_id": notification_id,
            "channel": "web",
            "request_type": "travel",
            "pillar": "travel",
            "category": request.travel_type,
            "status": "new",
            "urgency": "high" if travel_config["risk_level"] == "high" else "medium",
            "customer_name": request.user_name,
            "customer_email": request.user_email,
            "customer_phone": request.user_phone,
            "member": {
                "name": request.user_name,
                "email": request.user_email,
                "phone": request.user_phone
            },
            "pet": {
                "name": request.pet_name,
                "breed": request.pet_breed
            },
            "preview": f"Travel Request: {travel_config['name']} from {request.pickup_city} to {request.drop_city}",
            "message": f"Travel Request: {travel_config['name']} from {request.pickup_city} to {request.drop_city}",
            "metadata": {
                "travel_request_id": request_id,
                "travel_type": request.travel_type,
                "travel_date": request.travel_date,
                "risk_level": travel_config["risk_level"]
            },
            "tags": ["travel", request.travel_type],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "unified_flow_processed": True
        }
        await db.channel_intakes.insert_one(inbox_entry)
        logger.info(f"[UNIFIED FLOW] Travel inbox entry created: {inbox_id}")
        logger.info(f"[UNIFIED FLOW] COMPLETE: Travel request {request_id} | Notification({notification_id}) → Ticket({request_id}) → Inbox({inbox_id})")
        
        # Update pet profile with travel preferences (progressive profiling)
        if request.pet_id:
            profile_updates = {}
            if request.pet_weight:
                profile_updates["soul.weight"] = request.pet_weight
            if request.crate_trained is not None:
                profile_updates["soul.crate_trained"] = request.crate_trained
            if request.travel_anxiety:
                profile_updates["soul.travel_anxiety"] = request.travel_anxiety
            if request.motion_sickness:
                profile_updates["soul.motion_sickness"] = request.motion_sickness
            
            if profile_updates:
                profile_updates["soul.last_travel_request"] = request.travel_date
                profile_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.pets.update_one(
                    {"id": request.pet_id},
                    {"$set": profile_updates}
                )
                logger.info(f"Updated pet profile {request.pet_id} with travel data")
        
        logger.info(f"Travel request created: {request_id}")
        
        return {
            "success": True,
            "request_id": request_id,
            "ticket_id": request_id,
            "notification_id": notification_id,
            "inbox_id": inbox_id,
            "status": "submitted",
            "message": f"Your travel request has been submitted. Our concierge will review and contact you within {travel_config['typical_response_time']}.",
            "typical_response_time": travel_config["typical_response_time"],
            "risk_factors": risk_factors if risk_factors else None
        }
        
    except Exception as e:
        logger.error(f"Error creating travel request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requests")
async def get_travel_requests(
    status: Optional[str] = None,
    travel_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get travel requests (for admin/concierge)"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if travel_type:
        query["travel_type"] = travel_type
    
    requests = await db.travel_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.travel_requests.count_documents(query)
    
    return {
        "requests": requests,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/request/{request_id}")
async def get_travel_request(request_id: str):
    """Get a specific travel request"""
    db = get_db()
    
    request = await db.travel_requests.find_one(
        {"request_id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    return request


@router.patch("/request/{request_id}")
async def update_travel_request(request_id: str, update: TravelRequestUpdate):
    """Update a travel request (concierge action)"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.status:
        update_doc["status"] = update.status
    if update.assigned_to:
        update_doc["assigned_to"] = update.assigned_to
    if update.concierge_notes:
        update_doc["concierge_notes"] = update.concierge_notes
    if update.partner_details:
        update_doc["partner_details"] = update.partner_details
    if update.quoted_price:
        update_doc["quoted_price"] = update.quoted_price
    if update.confirmed_date:
        update_doc["confirmed_date"] = update.confirmed_date
    if update.confirmed_time:
        update_doc["confirmed_time"] = update.confirmed_time
    
    result = await db.travel_requests.update_one(
        {"request_id": request_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Also update the corresponding ticket
    if update.status:
        ticket_status_map = {
            "submitted": "new",
            "reviewing": "in_progress",
            "coordinating": "in_progress",
            "confirmed": "resolved",
            "completed": "closed",
            "cancelled": "closed"
        }
        await db.tickets.update_one(
            {"ticket_id": request_id},
            {"$set": {
                "status": ticket_status_map.get(update.status, "in_progress"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"Travel request {request_id} updated")
    
    return {"success": True, "message": "Request updated"}


@router.get("/my-requests")
async def get_my_travel_requests(user_email: str, limit: int = 20):
    """Get travel requests for a specific user"""
    db = get_db()
    
    requests = await db.travel_requests.find(
        {"customer.email": user_email},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"requests": requests, "count": len(requests)}


@router.get("/stats")
async def get_travel_stats():
    """Get travel statistics for admin dashboard"""
    db = get_db()
    
    # Count by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.travel_requests.aggregate(pipeline).to_list(100)
    
    # Count by type
    pipeline = [
        {"$group": {"_id": "$travel_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.travel_requests.aggregate(pipeline).to_list(100)
    
    # Recent requests
    recent = await db.travel_requests.find(
        {},
        {"_id": 0, "request_id": 1, "travel_type_name": 1, "pet.name": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "by_status": {item["_id"]: item["count"] for item in status_counts if item["_id"]},
        "by_type": {item["_id"]: item["count"] for item in type_counts if item["_id"]},
        "recent_requests": recent,
        "total": sum(item["count"] for item in status_counts if item["_id"])
    }


@router.get("/products")
async def get_travel_products(limit: int = 50):
    """Get travel-related products (kits, crates, harnesses, etc.)"""
    db = get_db()
    
    products = await db.products.find(
        {"$or": [
            {"category": {"$regex": "travel", "$options": "i"}},
            {"tags": {"$in": ["travel", "crate", "harness", "carrier", "calming"]}},
            {"name": {"$regex": "travel|crate|carrier|harness|calm", "$options": "i"}}
        ]},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return {"products": products, "total": len(products)}


# Travel Product/Bundle Models
class TravelProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    image: Optional[str] = None
    category: str = "travel"
    subcategory: Optional[str] = None  # crate, harness, kit, calming, etc.
    tags: List[str] = []
    pet_sizes: List[str] = []  # small, medium, large
    in_stock: bool = True
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    paw_reward_points: int = 0
    is_birthday_perk: bool = False
    birthday_discount_percent: Optional[int] = None


class TravelBundleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    image: Optional[str] = None
    travel_type: str  # cab, train, flight, relocation
    items: List[str]  # List of product IDs
    is_recommended: bool = True
    paw_reward_points: int = 0
    is_birthday_perk: bool = False
    birthday_discount_percent: Optional[int] = None


@router.post("/admin/products")
async def create_travel_product(product: TravelProductCreate):
    """Create a new travel product"""
    db = get_db()
    logger = get_logger()
    
    product_id = f"travel-{uuid.uuid4().hex[:8]}"
    
    product_doc = {
        "id": product_id,
        **product.dict(),
        "category": "travel",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    logger.info(f"Travel product created: {product_id}")
    
    return {"success": True, "product_id": product_id, "product": {k: v for k, v in product_doc.items() if k != "_id"}}


@router.put("/admin/products/{product_id}")
async def update_travel_product(product_id: str, product: TravelProductCreate):
    """Update a travel product"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {
        **product.dict(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logger.info(f"Travel product updated: {product_id}")
    return {"success": True, "message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_travel_product(product_id: str):
    """Delete a travel product"""
    db = get_db()
    logger = get_logger()
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logger.info(f"Travel product deleted: {product_id}")
    return {"success": True, "message": "Product deleted"}


@router.post("/admin/products/import")
async def import_travel_products(products: List[Dict[str, Any]]):
    """Import multiple travel products from CSV data"""
    db = get_db()
    logger = get_logger()
    
    imported = 0
    errors = []
    
    for idx, prod in enumerate(products):
        try:
            product_id = prod.get("id") or f"travel-{uuid.uuid4().hex[:8]}"
            
            product_doc = {
                "id": product_id,
                "name": prod.get("name", ""),
                "description": prod.get("description", ""),
                "price": float(prod.get("price", 0)),
                "compare_price": float(prod.get("compare_price", 0)) if prod.get("compare_price") else None,
                "image": prod.get("image", ""),
                "category": "travel",
                "subcategory": prod.get("subcategory", ""),
                "tags": prod.get("tags", "").split(",") if isinstance(prod.get("tags"), str) else prod.get("tags", []),
                "pet_sizes": prod.get("pet_sizes", "").split(",") if isinstance(prod.get("pet_sizes"), str) else prod.get("pet_sizes", []),
                "in_stock": prod.get("in_stock", "true").lower() != "false" if isinstance(prod.get("in_stock"), str) else bool(prod.get("in_stock", True)),
                "stock_quantity": int(prod.get("stock_quantity", 0)) if prod.get("stock_quantity") else None,
                "sku": prod.get("sku", ""),
                "paw_reward_points": int(prod.get("paw_reward_points", 0)),
                "is_birthday_perk": prod.get("is_birthday_perk", "false").lower() == "true" if isinstance(prod.get("is_birthday_perk"), str) else bool(prod.get("is_birthday_perk", False)),
                "birthday_discount_percent": int(prod.get("birthday_discount_percent", 0)) if prod.get("birthday_discount_percent") else None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert - update if exists, insert if not
            await db.products.update_one(
                {"id": product_id},
                {"$set": product_doc},
                upsert=True
            )
            imported += 1
            
        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})
    
    logger.info(f"Imported {imported} travel products")
    return {"success": True, "imported": imported, "errors": errors}


@router.get("/admin/products/export")
async def export_travel_products():
    """Export all travel products as CSV-ready data"""
    db = get_db()
    
    products = await db.products.find(
        {"category": "travel"},
        {"_id": 0}
    ).to_list(500)
    
    # Convert arrays to comma-separated strings for CSV
    export_data = []
    for p in products:
        export_data.append({
            "id": p.get("id", ""),
            "name": p.get("name", ""),
            "description": p.get("description", ""),
            "price": p.get("price", 0),
            "compare_price": p.get("compare_price", ""),
            "image": p.get("image", ""),
            "subcategory": p.get("subcategory", ""),
            "tags": ",".join(p.get("tags", [])) if isinstance(p.get("tags"), list) else p.get("tags", ""),
            "pet_sizes": ",".join(p.get("pet_sizes", [])) if isinstance(p.get("pet_sizes"), list) else p.get("pet_sizes", ""),
            "in_stock": str(p.get("in_stock", True)).lower(),
            "stock_quantity": p.get("stock_quantity", ""),
            "sku": p.get("sku", ""),
            "paw_reward_points": p.get("paw_reward_points", 0),
            "is_birthday_perk": str(p.get("is_birthday_perk", False)).lower(),
            "birthday_discount_percent": p.get("birthday_discount_percent", "")
        })
    
    return {"products": export_data, "total": len(export_data)}


# Travel Bundles CRUD
@router.get("/bundles")
async def get_travel_bundles(travel_type: Optional[str] = None):
    """Get travel bundles"""
    db = get_db()
    
    query = {"bundle_type": "travel"}
    if travel_type:
        query["travel_type"] = travel_type
    
    bundles = await db.product_bundles.find(
        query,
        {"_id": 0}
    ).to_list(50)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_travel_bundle(bundle: TravelBundleCreate):
    """Create a new travel bundle"""
    db = get_db()
    logger = get_logger()
    
    bundle_id = f"travel-bundle-{uuid.uuid4().hex[:8]}"
    
    bundle_doc = {
        "id": bundle_id,
        "bundle_type": "travel",
        **bundle.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.product_bundles.insert_one(bundle_doc)
    logger.info(f"Travel bundle created: {bundle_id}")
    
    return {"success": True, "bundle_id": bundle_id, "bundle": {k: v for k, v in bundle_doc.items() if k != "_id"}}


@router.put("/admin/bundles/{bundle_id}")
async def update_travel_bundle(bundle_id: str, bundle: TravelBundleCreate):
    """Update a travel bundle"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {
        **bundle.dict(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.product_bundles.update_one(
        {"id": bundle_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    logger.info(f"Travel bundle updated: {bundle_id}")
    return {"success": True, "message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_travel_bundle(bundle_id: str):
    """Delete a travel bundle"""
    db = get_db()
    logger = get_logger()
    
    result = await db.product_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    logger.info(f"Travel bundle deleted: {bundle_id}")
    return {"success": True, "message": "Bundle deleted"}


@router.post("/admin/bundles/import")
async def import_travel_bundles(bundles: List[Dict[str, Any]]):
    """Import multiple travel bundles from CSV data"""
    db = get_db()
    logger = get_logger()
    
    imported = 0
    errors = []
    
    for idx, bnd in enumerate(bundles):
        try:
            bundle_id = bnd.get("id") or f"travel-bundle-{uuid.uuid4().hex[:8]}"
            
            bundle_doc = {
                "id": bundle_id,
                "bundle_type": "travel",
                "name": bnd.get("name", ""),
                "description": bnd.get("description", ""),
                "price": float(bnd.get("price", 0)),
                "original_price": float(bnd.get("original_price", 0)) if bnd.get("original_price") else None,
                "image": bnd.get("image", ""),
                "travel_type": bnd.get("travel_type", "cab"),
                "items": bnd.get("items", "").split(",") if isinstance(bnd.get("items"), str) else bnd.get("items", []),
                "is_recommended": bnd.get("is_recommended", "true").lower() != "false" if isinstance(bnd.get("is_recommended"), str) else bool(bnd.get("is_recommended", True)),
                "paw_reward_points": int(bnd.get("paw_reward_points", 0)),
                "is_birthday_perk": bnd.get("is_birthday_perk", "false").lower() == "true" if isinstance(bnd.get("is_birthday_perk"), str) else bool(bnd.get("is_birthday_perk", False)),
                "birthday_discount_percent": int(bnd.get("birthday_discount_percent", 0)) if bnd.get("birthday_discount_percent") else None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.product_bundles.update_one(
                {"id": bundle_id},
                {"$set": bundle_doc},
                upsert=True
            )
            imported += 1
            
        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})
    
    logger.info(f"Imported {imported} travel bundles")
    return {"success": True, "imported": imported, "errors": errors}


# Travel Partner Models
class TravelPartnerCreate(BaseModel):
    name: str
    type: str  # cab_service, airline, train_service, relocation, cargo
    description: Optional[str] = None
    logo: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    cities: List[str] = []
    services: List[str] = []
    commission_percent: float = 0
    rating: float = 5.0
    is_verified: bool = False
    is_active: bool = True
    pet_policy: Optional[str] = None
    special_features: Optional[str] = None


# Travel Partners CRUD
@router.get("/admin/partners")
async def get_travel_partners(
    partner_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    city: Optional[str] = None
):
    """Get all travel partners"""
    db = get_db()
    
    query = {}
    if partner_type:
        query["type"] = partner_type
    if is_active is not None:
        query["is_active"] = is_active
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.travel_partners.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Count by type
    type_stats = {}
    for partner in partners:
        ptype = partner.get("type", "other")
        type_stats[ptype] = type_stats.get(ptype, 0) + 1
    
    return {
        "partners": partners,
        "total": len(partners),
        "by_type": type_stats
    }


@router.post("/admin/partners")
async def create_travel_partner(partner: TravelPartnerCreate):
    """Create a new travel partner"""
    db = get_db()
    logger = get_logger()
    
    partner_id = f"partner-{uuid.uuid4().hex[:8]}"
    
    partner_doc = {
        "id": partner_id,
        **partner.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.travel_partners.insert_one(partner_doc)
    logger.info(f"Travel partner created: {partner_id} - {partner.name}")
    
    return {"success": True, "partner_id": partner_id, "partner": {k: v for k, v in partner_doc.items() if k != "_id"}}


@router.put("/admin/partners/{partner_id}")
async def update_travel_partner(partner_id: str, partner: TravelPartnerCreate):
    """Update a travel partner"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {
        **partner.dict(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.travel_partners.update_one(
        {"id": partner_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    logger.info(f"Travel partner updated: {partner_id}")
    return {"success": True, "message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_travel_partner(partner_id: str):
    """Delete a travel partner"""
    db = get_db()
    logger = get_logger()
    
    result = await db.travel_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    logger.info(f"Travel partner deleted: {partner_id}")
    return {"success": True, "message": "Partner deleted"}


@router.get("/partners/by-type/{partner_type}")
async def get_partners_by_type(partner_type: str, city: Optional[str] = None):
    """Get active partners by type (for frontend booking)"""
    db = get_db()
    
    query = {"type": partner_type, "is_active": True}
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.travel_partners.find(
        query,
        {"_id": 0, "id": 1, "name": 1, "rating": 1, "cities": 1, "is_verified": 1, "pet_policy": 1, "special_features": 1}
    ).sort("rating", -1).to_list(50)
    
    return {"partners": partners, "total": len(partners)}


@router.get("/admin/bundles/export")
async def export_travel_bundles():
    """Export all travel bundles as CSV-ready data"""
    db = get_db()
    
    bundles = await db.product_bundles.find(
        {"bundle_type": "travel"},
        {"_id": 0}
    ).to_list(100)
    
    export_data = []
    for b in bundles:
        export_data.append({
            "id": b.get("id", ""),
            "name": b.get("name", ""),
            "description": b.get("description", ""),
            "price": b.get("price", 0),
            "original_price": b.get("original_price", ""),
            "image": b.get("image", ""),
            "travel_type": b.get("travel_type", ""),
            "items": ",".join(b.get("items", [])) if isinstance(b.get("items"), list) else b.get("items", ""),
            "is_recommended": str(b.get("is_recommended", True)).lower(),
            "paw_reward_points": b.get("paw_reward_points", 0),
            "is_birthday_perk": str(b.get("is_birthday_perk", False)).lower(),
            "birthday_discount_percent": b.get("birthday_discount_percent", "")
        })
    
    return {"bundles": export_data, "total": len(export_data)}


# Travel Settings (Paw Rewards, Birthday Perks, etc.)
@router.get("/admin/settings")
async def get_travel_settings():
    """Get travel pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "travel_settings"}, {"_id": 0})
    
    if not settings:
        # Return default settings
        return {
            "paw_rewards": {
                "enabled": True,
                "points_per_request": 50,
                "points_per_purchase": 10,
                "redemption_rate": 100  # 100 points = ₹1
            },
            "birthday_perks": {
                "enabled": True,
                "discount_percent": 15,
                "valid_days_before": 7,
                "valid_days_after": 7,
                "free_product_id": None
            },
            "notifications": {
                "email_enabled": True,
                "whatsapp_enabled": False,
                "sms_enabled": False
            }
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_travel_settings(settings: Dict[str, Any]):
    """Update travel pillar settings"""
    db = get_db()
    logger = get_logger()
    
    await db.app_settings.update_one(
        {"key": "travel_settings"},
        {"$set": {
            "key": "travel_settings",
            "value": settings,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    logger.info("Travel settings updated")
    return {"success": True, "message": "Settings updated"}


# Seed default travel products
@router.post("/admin/seed-products")
async def seed_travel_products():
    """Seed default travel products for the pillar"""
    db = get_db()
    logger = get_logger()
    
    default_products = [
        {
            "id": "travel-crate-small",
            "name": "IATA Approved Travel Crate - Small",
            "description": "Airline-approved crate perfect for small dogs up to 8kg. Ventilated design with secure locks.",
            "price": 3499,
            "compare_price": 4499,
            "image": "/images/products/travel-crate-small.jpg",
            "category": "travel",
            "subcategory": "crate",
            "tags": ["travel", "crate", "flight", "iata", "small"],
            "pet_sizes": ["small"],
            "in_stock": True,
            "paw_reward_points": 35,
            "is_birthday_perk": False
        },
        {
            "id": "travel-crate-medium",
            "name": "IATA Approved Travel Crate - Medium",
            "description": "Airline-approved crate for medium dogs 8-20kg. Durable, easy to clean.",
            "price": 4999,
            "compare_price": 5999,
            "image": "/images/products/travel-crate-medium.jpg",
            "category": "travel",
            "subcategory": "crate",
            "tags": ["travel", "crate", "flight", "iata", "medium"],
            "pet_sizes": ["medium"],
            "in_stock": True,
            "paw_reward_points": 50,
            "is_birthday_perk": False
        },
        {
            "id": "travel-crate-large",
            "name": "IATA Approved Travel Crate - Large",
            "description": "Heavy-duty airline crate for large dogs 20-32kg. Extra ventilation and sturdy construction.",
            "price": 6999,
            "compare_price": 8499,
            "image": "/images/products/travel-crate-large.jpg",
            "category": "travel",
            "subcategory": "crate",
            "tags": ["travel", "crate", "flight", "iata", "large"],
            "pet_sizes": ["large"],
            "in_stock": True,
            "paw_reward_points": 70,
            "is_birthday_perk": False
        },
        {
            "id": "travel-harness",
            "name": "Premium Car Safety Harness",
            "description": "Crash-tested car harness for safe road travel. Adjustable fit for all sizes.",
            "price": 1299,
            "compare_price": 1799,
            "image": "/images/products/travel-harness.jpg",
            "category": "travel",
            "subcategory": "harness",
            "tags": ["travel", "harness", "car", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 13,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "travel-carrier-soft",
            "name": "Soft Sided Pet Carrier",
            "description": "Lightweight, foldable carrier for train/cab travel. Multiple mesh windows for ventilation.",
            "price": 1999,
            "compare_price": 2499,
            "image": "/images/products/travel-carrier.jpg",
            "category": "travel",
            "subcategory": "carrier",
            "tags": ["travel", "carrier", "soft", "train", "cab"],
            "pet_sizes": ["small", "medium"],
            "in_stock": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "travel-calming-treats",
            "name": "Calming Travel Treats",
            "description": "Natural calming treats with chamomile & L-theanine. Perfect for anxious travelers.",
            "price": 599,
            "compare_price": 799,
            "image": "/images/products/calming-treats.jpg",
            "category": "travel",
            "subcategory": "calming",
            "tags": ["travel", "calming", "treats", "anxiety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "travel-water-bottle",
            "name": "Portable Pet Water Bottle",
            "description": "Leak-proof travel water bottle with built-in bowl. Essential for journeys.",
            "price": 449,
            "compare_price": 599,
            "image": "/images/products/water-bottle.jpg",
            "category": "travel",
            "subcategory": "accessory",
            "tags": ["travel", "water", "bottle", "accessory"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "travel-first-aid",
            "name": "Pet Travel First Aid Kit",
            "description": "Compact first aid kit for travel emergencies. Includes bandages, antiseptic, and essentials.",
            "price": 899,
            "compare_price": 1199,
            "image": "/images/products/first-aid.jpg",
            "category": "travel",
            "subcategory": "safety",
            "tags": ["travel", "first-aid", "safety", "emergency"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 9,
            "is_birthday_perk": False
        },
        {
            "id": "travel-blanket",
            "name": "Travel Comfort Blanket",
            "description": "Plush, washable blanket for familiar comfort during travel. Reduces anxiety.",
            "price": 699,
            "compare_price": 899,
            "image": "/images/products/travel-blanket.jpg",
            "category": "travel",
            "subcategory": "comfort",
            "tags": ["travel", "blanket", "comfort", "calming"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "travel-id-tag",
            "name": "GPS Smart ID Tag",
            "description": "QR-enabled smart tag with GPS tracking. Peace of mind during travel.",
            "price": 1499,
            "compare_price": 1999,
            "image": "/images/products/id-tag.jpg",
            "category": "travel",
            "subcategory": "safety",
            "tags": ["travel", "id", "gps", "safety", "tracking"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        }
    ]
    
    default_bundles = [
        {
            "id": "travel-bundle-cab",
            "bundle_type": "travel",
            "name": "Cab Travel Kit",
            "description": "Everything needed for safe car journeys: harness, water bottle, and calming treats.",
            "price": 1999,
            "original_price": 2747,
            "image": "/images/bundles/cab-kit.jpg",
            "travel_type": "cab",
            "items": ["travel-harness", "travel-water-bottle", "travel-calming-treats"],
            "is_recommended": True,
            "paw_reward_points": 25,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "travel-bundle-train",
            "bundle_type": "travel",
            "name": "Train Travel Kit",
            "description": "Complete kit for train journeys: soft carrier, comfort blanket, and calming treats.",
            "price": 2799,
            "original_price": 3297,
            "image": "/images/bundles/train-kit.jpg",
            "travel_type": "train",
            "items": ["travel-carrier-soft", "travel-blanket", "travel-calming-treats"],
            "is_recommended": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        },
        {
            "id": "travel-bundle-flight-small",
            "bundle_type": "travel",
            "name": "Flight Ready Kit - Small Dogs",
            "description": "IATA approved crate with all essentials for safe air travel.",
            "price": 4499,
            "original_price": 5546,
            "image": "/images/bundles/flight-kit-small.jpg",
            "travel_type": "flight",
            "items": ["travel-crate-small", "travel-water-bottle", "travel-calming-treats", "travel-first-aid"],
            "is_recommended": True,
            "paw_reward_points": 50,
            "is_birthday_perk": False
        },
        {
            "id": "travel-bundle-flight-medium",
            "bundle_type": "travel",
            "name": "Flight Ready Kit - Medium Dogs",
            "description": "Complete flight preparation kit with IATA crate and travel essentials.",
            "price": 5999,
            "original_price": 7046,
            "image": "/images/bundles/flight-kit-medium.jpg",
            "travel_type": "flight",
            "items": ["travel-crate-medium", "travel-water-bottle", "travel-calming-treats", "travel-first-aid"],
            "is_recommended": True,
            "paw_reward_points": 65,
            "is_birthday_perk": False
        },
        {
            "id": "travel-bundle-relocation",
            "bundle_type": "travel",
            "name": "Relocation Comfort Pack",
            "description": "Premium pack for long-distance relocations: crate, blanket, treats, first aid & GPS tag.",
            "price": 8499,
            "original_price": 10495,
            "image": "/images/bundles/relocation-pack.jpg",
            "travel_type": "relocation",
            "items": ["travel-crate-large", "travel-blanket", "travel-calming-treats", "travel-first-aid", "travel-id-tag"],
            "is_recommended": True,
            "paw_reward_points": 100,
            "is_birthday_perk": True,
            "birthday_discount_percent": 10
        }
    ]
    
    # Insert products
    for product in default_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
    
    # Insert bundles
    for bundle in default_bundles:
        bundle["created_at"] = datetime.now(timezone.utc).isoformat()
        bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.product_bundles.update_one(
            {"id": bundle["id"]},
            {"$set": bundle},
            upsert=True
        )
    
    logger.info(f"Seeded {len(default_products)} travel products and {len(default_bundles)} bundles")
    
    return {
        "success": True,
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles),
        "message": "Travel products and bundles seeded successfully"
    }


@router.get("/config")
async def get_travel_config():
    """Get travel pillar configuration for frontend"""
    db = get_db()
    
    # Get settings
    settings = await db.app_settings.find_one({"key": "travel_settings"}, {"_id": 0})
    
    # Get product counts
    product_count = await db.products.count_documents({"category": "travel"})
    bundle_count = await db.product_bundles.count_documents({"bundle_type": "travel"})
    
    return {
        "travel_types": TRAVEL_TYPES,
        "settings": settings.get("value", {}) if settings else {},
        "product_count": product_count,
        "bundle_count": bundle_count,
        "enabled": True
    }
