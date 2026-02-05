"""
FIT Pillar Routes - Pet Fitness, Exercise & Weight Management
Complete CRUD with Service Desk, Notifications, and Unified Inbox integration
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
from timestamp_utils import get_utc_timestamp
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fit", tags=["fit"])

def get_db():
    from server import db
    return db


# ==================== FITNESS REQUESTS ====================

@router.post("/request")
async def create_fitness_request(request_data: dict):
    """Create a new fitness request with FULL UNIFIED FLOW integration"""
    db = get_db()
    
    # Generate IDs for unified flow
    request_id = f"FIT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
    # Handle multi-pet data
    pets_data = request_data.get("pets", [])
    is_multi_pet = request_data.get("is_multi_pet", len(pets_data) > 1)
    pet_count = request_data.get("pet_count", len(pets_data))
    
    # For backward compatibility, also support single pet fields
    single_pet_name = request_data.get("pet_name") or (pets_data[0].get("name") if pets_data else None)
    single_pet_breed = request_data.get("pet_breed") or (pets_data[0].get("breed") if pets_data else None)
    single_pet_id = request_data.get("pet_id") or (pets_data[0].get("id") if pets_data else None)
    
    # Multi-pet names for display
    all_pet_names = ", ".join([p.get("name", "Pet") for p in pets_data]) if pets_data else single_pet_name
    
    fitness_request = {
        "id": request_id,
        "request_id": request_id,
        "fit_type": request_data.get("fit_type", "assessment"),
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "ticket_id": ticket_id,
        
        # Multi-pet support
        "pets": pets_data,
        "pet_count": pet_count,
        "is_multi_pet": is_multi_pet,
        
        # Legacy single pet fields (for backward compatibility)
        "pet_id": single_pet_id,
        "pet_name": all_pet_names,
        "pet_breed": single_pet_breed,
        "pet_age": request_data.get("pet_age"),
        "pet_weight": request_data.get("pet_weight"),
        "pet_size": request_data.get("pet_size"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Fitness Details
        "current_activity_level": request_data.get("current_activity_level"),
        "fitness_goals": request_data.get("fitness_goals", []),
        "health_conditions": request_data.get("health_conditions", []),
        "dietary_restrictions": request_data.get("dietary_restrictions", []),
        "preferred_activities": request_data.get("preferred_activities", []),
        "schedule_preference": request_data.get("schedule_preference"),
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
        "assigned_to": None,
        "partner_id": None,
        "unified_flow_processed": True
    }
    
    pet_display_name = all_pet_names or "Pet"
    user_name = fitness_request["user_name"] or "Customer"
    fit_type = fitness_request["fit_type"].replace('_', ' ').title()
    multi_pet_badge = f" ({pet_count} pets)" if is_multi_pet else ""
    
    await db.fit_requests.insert_one({k: v for k, v in fitness_request.items() if k != "_id"})
    
    # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": f"fit_{fitness_request['fit_type']}",
        "pillar": "fit",
        "title": f"New Fitness Request: {fit_type} - {pet_display_name}{multi_pet_badge}",
        "message": f"{user_name} needs {fit_type.lower()} for {pet_display_name}. Goals: {', '.join(fitness_request['fitness_goals'][:2]) if fitness_request['fitness_goals'] else 'Not specified'}",
        "read": False,
        "status": "unread",
        "urgency": "medium" if not is_multi_pet else "high",  # Multi-pet requests get higher priority
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": user_name,
            "email": fitness_request["user_email"],
            "phone": fitness_request["user_phone"]
        },
        "pet": {
            "name": pet_display_name,
            "breed": fitness_request["pet_breed"],
            "count": pet_count,
            "is_multi_pet": is_multi_pet,
            "pets": pets_data
        },
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": get_utc_timestamp(),
        "read_at": None
    })
    logger.info(f"[UNIFIED FLOW] Fit notification created: {notification_id} (multi_pet={is_multi_pet})")
    
    # ==================== STEP 2: SERVICE DESK TICKET (MANDATORY) ====================
    ticket = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "source": "fit_pillar",
        "source_id": request_id,
        "pillar": "fit",
        "category": "fitness",
        "subcategory": fitness_request["fit_type"],
        "subject": f"Fitness Request: {fit_type} for {pet_display_name}",
        "description": f"New fitness request from {user_name} for {pet_display_name}.\nGoals: {', '.join(fitness_request['fitness_goals'])}\nActivity Level: {fitness_request['current_activity_level']}",
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "member": {
            "name": user_name,
            "email": fitness_request["user_email"],
            "phone": fitness_request["user_phone"]
        },
        "pet": {
            "name": pet_display_name,
            "id": fitness_request["pet_id"],
            "breed": fitness_request["pet_breed"]
        },
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
        "tags": ["fit", fitness_request["fit_type"], "unified-flow"],
        "unified_flow_processed": True
    }
    
    # Insert into BOTH collections
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Fit ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (MANDATORY) ====================
    inbox_item = {
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "request_type": "fit",
        "pillar": "fit",
        "category": fitness_request["fit_type"],
        "status": "new",
        "urgency": "medium",
        "customer_name": user_name,
        "customer_email": fitness_request["user_email"],
        "customer_phone": fitness_request["user_phone"],
        "member": {
            "name": user_name,
            "email": fitness_request["user_email"],
            "phone": fitness_request["user_phone"]
        },
        "pet": {
            "name": pet_display_name,
            "breed": fitness_request["pet_breed"]
        },
        "preview": f"{pet_display_name} - {', '.join(fitness_request['fitness_goals'][:2]) if fitness_request['fitness_goals'] else fit_type}",
        "message": f"Fitness Request: {fit_type} for {pet_display_name}",
        "tags": ["fit", fitness_request["fit_type"]],
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
        "unified_flow_processed": True
    }
    
    await db.channel_intakes.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Fit inbox created: {inbox_id}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: Fit request {request_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
    
    return {
        "message": "Fitness request submitted successfully",
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id
    }


@router.get("/requests")
async def get_fitness_requests(
    status: Optional[str] = None,
    fit_type: Optional[str] = None,
    limit: int = 50
):
    """Get all fitness requests"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if fit_type:
        query["fit_type"] = fit_type
    
    requests = await db.fit_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"requests": requests, "total": len(requests)}


@router.get("/requests/{request_id}")
async def get_fitness_request(request_id: str):
    """Get a specific fitness request"""
    db = get_db()
    
    request = await db.fit_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return request


@router.put("/requests/{request_id}")
async def update_fitness_request(request_id: str, update_data: dict):
    """Update a fitness request"""
    db = get_db()
    
    update_data["updated_at"] = get_utc_timestamp()
    update_data.pop("id", None)
    update_data.pop("_id", None)
    
    result = await db.fit_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update linked ticket status if status changed
    if "status" in update_data:
        ticket_status_map = {
            "pending": "open",
            "in_progress": "in_progress", 
            "completed": "resolved",
            "cancelled": "closed"
        }
        new_ticket_status = ticket_status_map.get(update_data["status"])
        if new_ticket_status:
            await db.tickets.update_one(
                {"source_id": request_id},
                {"$set": {"status": new_ticket_status, "updated_at": get_utc_timestamp()}}
            )
    
    return {"message": "Request updated"}


# ==================== FITNESS PLANS ====================

@router.get("/plans")
async def get_fitness_plans(
    plan_type: Optional[str] = None,
    pet_size: Optional[str] = None,
    is_featured: bool = False,
    limit: int = 50
):
    """Get available fitness plans"""
    db = get_db()
    
    query = {"is_active": True}
    if plan_type:
        query["plan_type"] = plan_type
    if pet_size:
        query["pet_sizes"] = {"$in": [pet_size]}
    if is_featured:
        query["is_featured"] = True
    
    plans = await db.fit_plans.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"plans": plans, "total": len(plans)}


@router.post("/admin/plans")
async def create_fitness_plan(plan_data: dict):
    """Create a new fitness plan"""
    db = get_db()
    
    plan = {
        "id": f"plan-{uuid.uuid4().hex[:8]}",
        **plan_data,
        "is_active": True,
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.fit_plans.insert_one({k: v for k, v in plan.items() if k != "_id"})
    
    return {"message": "Plan created", "id": plan["id"]}


@router.put("/admin/plans/{plan_id}")
async def update_fitness_plan(plan_id: str, plan_data: dict):
    """Update a fitness plan"""
    db = get_db()
    
    plan_data["updated_at"] = get_utc_timestamp()
    plan_data.pop("id", None)
    plan_data.pop("_id", None)
    
    result = await db.fit_plans.update_one({"id": plan_id}, {"$set": plan_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan updated"}


@router.delete("/admin/plans/{plan_id}")
async def delete_fitness_plan(plan_id: str):
    """Delete a fitness plan"""
    db = get_db()
    
    result = await db.fit_plans.delete_one({"id": plan_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan deleted"}


# ==================== PARTNERS ====================

@router.get("/partners")
async def get_public_fit_partners(
    is_featured: bool = False,
    city: Optional[str] = None,
    limit: int = 20
):
    """Get active fitness partners (public)"""
    db = get_db()
    
    query = {"is_active": True}
    if is_featured:
        query["is_featured"] = True
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.fit_partners.find(query, {"_id": 0}).to_list(limit)
    
    return {"partners": partners, "total": len(partners)}


@router.get("/admin/partners")
async def get_fit_partners(is_active: bool = True):
    """Get all fitness partners"""
    db = get_db()
    
    query = {}
    if is_active:
        query["is_active"] = True
    
    partners = await db.fit_partners.find(query, {"_id": 0}).to_list(100)
    
    return {"partners": partners, "total": len(partners)}


@router.post("/admin/partners")
async def create_fit_partner(partner_data: dict):
    """Create a new fitness partner"""
    db = get_db()
    
    partner = {
        "id": f"fit-partner-{uuid.uuid4().hex[:8]}",
        **partner_data,
        "is_active": True,
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.fit_partners.insert_one({k: v for k, v in partner.items() if k != "_id"})
    
    return {"message": "Partner created", "id": partner["id"]}


@router.put("/admin/partners/{partner_id}")
async def update_fit_partner(partner_id: str, partner_data: dict):
    """Update a fitness partner"""
    db = get_db()
    
    partner_data["updated_at"] = get_utc_timestamp()
    partner_data.pop("id", None)
    partner_data.pop("_id", None)
    
    result = await db.fit_partners.update_one({"id": partner_id}, {"$set": partner_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_fit_partner(partner_id: str):
    """Delete a fitness partner"""
    db = get_db()
    
    result = await db.fit_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner deleted"}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_fit_products(
    fit_type: Optional[str] = None,
    limit: int = 50
):
    """Get fitness products from unified_products collection"""
    db = get_db()
    
    query = {"pillar": "fit"}
    if fit_type:
        query["category"] = fit_type
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(limit)
    total = await db.products_master.count_documents(query)
    
    return {"products": products, "total": total}


@router.post("/admin/products")
async def create_fit_product(product_data: dict):
    """Create a new fitness product"""
    db = get_db()
    
    product = {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "category": "fit",
        **product_data,
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.products_master.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    return {"message": "Product created", "id": product["id"]}


@router.put("/admin/products/{product_id}")
async def update_fit_product(product_id: str, product_data: dict):
    """Update a fitness product"""
    db = get_db()
    
    product_data["updated_at"] = get_utc_timestamp()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products_master.update_one({"id": product_id}, {"$set": product_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_fit_product(product_id: str):
    """Delete a fitness product"""
    db = get_db()
    
    result = await db.products_master.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


@router.post("/admin/seed-products")
async def seed_fit_products():
    """Seed default fitness products"""
    db = get_db()
    now = get_utc_timestamp()
    
    default_products = [
        {"id": "fit-prod-treadmill", "name": "Dog Treadmill (Small)", "description": "Indoor exercise treadmill for small dogs", "price": 15999, "original_price": 19999, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "fit", "tags": ["equipment", "exercise", "indoor"], "pillar": "fit"},
        {"id": "fit-prod-weights", "name": "Weighted Vest for Dogs", "description": "Adjustable weight vest for strength training", "price": 2499, "original_price": 2999, "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600", "category": "fit", "tags": ["equipment", "strength", "training"], "pillar": "fit"},
        {"id": "fit-prod-agility", "name": "Agility Training Kit", "description": "Complete agility course set with tunnels, jumps", "price": 4999, "original_price": 5999, "image": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600", "category": "fit", "tags": ["agility", "training", "kit"], "pillar": "fit"},
        {"id": "fit-prod-tracker", "name": "GPS Fitness Tracker Collar", "description": "Activity and health monitoring collar", "price": 3999, "original_price": 4999, "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", "category": "fit", "tags": ["tracker", "gps", "health"], "pillar": "fit"},
        {"id": "fit-prod-ball", "name": "Exercise Ball Launcher", "description": "Automatic ball launcher for fetch exercises", "price": 2999, "original_price": 3499, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", "category": "fit", "tags": ["launcher", "fetch", "exercise"], "pillar": "fit"},
        {"id": "fit-prod-pool", "name": "Hydrotherapy Pool Kit", "description": "Inflatable pool for water exercises", "price": 1999, "original_price": 2499, "image": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600", "category": "fit", "tags": ["pool", "hydrotherapy", "water"], "pillar": "fit"},
    ]
    
    seeded = 0
    for product in default_products:
        product["created_at"] = now
        product["updated_at"] = now
        result = await db.products_master.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
        if result.upserted_id or result.modified_count:
            seeded += 1
    
    return {"message": f"Seeded {seeded} fit products", "products_seeded": seeded}


@router.post("/admin/products/import")
async def import_fit_products(products: List[dict]):
    """Import fitness products from CSV/JSON"""
    db = get_db()
    now = get_utc_timestamp()
    
    imported = 0
    for product in products:
        product["id"] = product.get("id") or f"fit-{uuid.uuid4().hex[:8]}"
        product["category"] = "fit"
        product["pillar"] = "fit"
        product["created_at"] = now
        product["updated_at"] = now
        await db.products_master.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
        imported += 1
    
    return {"message": f"Imported {imported} products", "imported": imported}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_fit_bundles(limit: int = 20):
    """Get fitness bundles"""
    db = get_db()
    
    bundles = await db.fit_bundles.find({"is_active": True}, {"_id": 0}).to_list(limit)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_fit_bundle(bundle_data: dict):
    """Create a new fitness bundle"""
    db = get_db()
    
    bundle = {
        "id": f"fit-bundle-{uuid.uuid4().hex[:8]}",
        "bundle_type": "fit",
        **bundle_data,
        "is_active": True,
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.fit_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    
    return {"message": "Bundle created", "id": bundle["id"]}


@router.put("/admin/bundles/{bundle_id}")
async def update_fit_bundle(bundle_id: str, bundle_data: dict):
    """Update a fitness bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = get_utc_timestamp()
    bundle_data.pop("id", None)
    bundle_data.pop("_id", None)
    
    result = await db.fit_bundles.update_one({"id": bundle_id}, {"$set": bundle_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_fit_bundle(bundle_id: str):
    """Delete a fitness bundle"""
    db = get_db()
    
    result = await db.fit_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}


# ==================== WEIGHT TRACKING ====================

@router.post("/weight-log")
async def log_pet_weight(log_data: dict):
    """Log a pet's weight for tracking"""
    db = get_db()
    
    weight_log = {
        "id": f"wlog-{uuid.uuid4().hex[:8]}",
        "pet_id": log_data.get("pet_id"),
        "pet_name": log_data.get("pet_name"),
        "weight_kg": log_data.get("weight_kg"),
        "weight_date": log_data.get("weight_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "notes": log_data.get("notes", ""),
        "logged_by": log_data.get("logged_by"),
        "created_at": get_utc_timestamp()
    }
    
    await db.fit_weight_logs.insert_one({k: v for k, v in weight_log.items() if k != "_id"})
    
    # Update pet profile with latest weight
    if log_data.get("pet_id"):
        await db.pets.update_one(
            {"id": log_data["pet_id"]},
            {"$set": {"current_weight": log_data.get("weight_kg"), "weight_updated_at": get_utc_timestamp()}}
        )
    
    return {"message": "Weight logged", "id": weight_log["id"]}


@router.get("/weight-history/{pet_id}")
async def get_weight_history(pet_id: str, limit: int = 30):
    """Get weight history for a pet"""
    db = get_db()
    
    logs = await db.fit_weight_logs.find(
        {"pet_id": pet_id},
        {"_id": 0}
    ).sort("weight_date", -1).to_list(limit)
    
    return {"logs": logs, "total": len(logs)}


# ==================== ACTIVITY TRACKING ====================

@router.post("/activity-log")
async def log_pet_activity(log_data: dict):
    """Log a pet's activity"""
    db = get_db()
    
    activity_log = {
        "id": f"alog-{uuid.uuid4().hex[:8]}",
        "pet_id": log_data.get("pet_id"),
        "pet_name": log_data.get("pet_name"),
        "activity_type": log_data.get("activity_type"),  # walk, run, swim, play, agility
        "duration_minutes": log_data.get("duration_minutes"),
        "distance_km": log_data.get("distance_km"),
        "calories_burned": log_data.get("calories_burned"),
        "intensity": log_data.get("intensity", "moderate"),  # low, moderate, high
        "activity_date": log_data.get("activity_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "notes": log_data.get("notes", ""),
        "logged_by": log_data.get("logged_by"),
        "created_at": get_utc_timestamp()
    }
    
    await db.fit_activity_logs.insert_one({k: v for k, v in activity_log.items() if k != "_id"})
    
    # Award paw points for activity
    paw_points = 5 if log_data.get("duration_minutes", 0) >= 30 else 2
    
    return {"message": "Activity logged", "id": activity_log["id"], "paw_points_earned": paw_points}


@router.get("/activity-history/{pet_id}")
async def get_activity_history(pet_id: str, limit: int = 30):
    """Get activity history for a pet"""
    db = get_db()
    
    logs = await db.fit_activity_logs.find(
        {"pet_id": pet_id},
        {"_id": 0}
    ).sort("activity_date", -1).to_list(limit)
    
    return {"logs": logs, "total": len(logs)}


# ==================== STATS ====================

@router.get("/stats")
async def get_fit_stats():
    """Get fitness pillar statistics"""
    db = get_db()
    
    total_requests = await db.fit_requests.count_documents({})
    pending_requests = await db.fit_requests.count_documents({"status": "pending"})
    completed_requests = await db.fit_requests.count_documents({"status": "completed"})
    total_plans = await db.fit_plans.count_documents({"is_active": True})
    total_partners = await db.fit_partners.count_documents({"is_active": True})
    
    # By type
    pipeline = [
        {"$group": {"_id": "$fit_type", "count": {"$sum": 1}}}
    ]
    by_type = await db.fit_requests.aggregate(pipeline).to_list(20)
    
    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "completed_requests": completed_requests,
        "in_progress_requests": await db.fit_requests.count_documents({"status": "in_progress"}),
        "total_plans": total_plans,
        "total_partners": total_partners,
        "by_type": {item["_id"]: item["count"] for item in by_type if item["_id"]}
    }


# ==================== EXPORT ====================

@router.get("/admin/export/requests")
async def export_fit_requests():
    """Export fitness requests"""
    db = get_db()
    requests = await db.fit_requests.find({}, {"_id": 0}).to_list(1000)
    return {"requests": requests, "total": len(requests)}


@router.get("/admin/export/products")
async def export_fit_products():
    """Export fitness products"""
    db = get_db()
    products = await db.products_master.find({"category": "fit"}, {"_id": 0}).to_list(500)
    return {"products": products, "total": len(products)}


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_fit_settings():
    """Get fitness pillar settings"""
    db = get_db()
    
    settings = await db.pillar_settings.find_one({"pillar": "fit"}, {"_id": 0})
    
    if not settings:
        settings = {
            "pillar": "fit",
            "paw_rewards": {
                "points_per_request": 30,
                "points_per_activity": 5,
                "points_per_weight_log": 3,
                "milestone_bonus": 50
            },
            "birthday_perks": {
                "discount_percent": 15,
                "valid_days": 7
            },
            "notifications": {
                "email_enabled": True,
                "whatsapp_enabled": False,
                "sms_enabled": False,
                "activity_reminder": True,
                "weekly_summary": True
            },
            "service_desk": {
                "auto_create_tickets": True,
                "route_to_partners": True,
                "default_sla": 48
            }
        }
    
    return settings


@router.put("/admin/settings")
async def update_fit_settings(settings_data: dict):
    """Update fitness pillar settings"""
    db = get_db()
    
    settings_data["pillar"] = "fit"
    settings_data["updated_at"] = get_utc_timestamp()
    
    await db.pillar_settings.update_one(
        {"pillar": "fit"},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "Settings updated"}


# ==================== SEED ====================

@router.post("/admin/seed")
async def seed_fit_data():
    """Seed default fitness data"""
    db = get_db()
    
    # Fitness Plans
    default_plans = [
        {
            "id": "plan-puppy-energy",
            "name": "Puppy Energy Burner",
            "description": "Perfect for high-energy puppies! Daily exercise routines to burn excess energy and build healthy habits.",
            "plan_type": "exercise",
            "duration_weeks": 8,
            "sessions_per_week": 5,
            "price": 2999,
            "member_price": 2499,
            "pet_sizes": ["small", "medium"],
            "pet_ages": ["puppy"],
            "activities": ["fetch", "tug", "short_walks", "play"],
            "goals": ["energy_management", "basic_fitness", "socialization"],
            "image": "",
            "paw_reward_points": 40,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "plan-weight-loss",
            "name": "Healthy Weight Program",
            "description": "Comprehensive weight management plan with exercise and nutrition guidance. Ideal for overweight pets.",
            "plan_type": "weight_management",
            "duration_weeks": 12,
            "sessions_per_week": 4,
            "price": 4999,
            "member_price": 3999,
            "pet_sizes": ["small", "medium", "large"],
            "pet_ages": ["adult", "senior"],
            "activities": ["walking", "swimming", "low_impact"],
            "goals": ["weight_loss", "improved_mobility", "better_health"],
            "image": "",
            "paw_reward_points": 60,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "plan-senior-mobility",
            "name": "Senior Gentle Movement",
            "description": "Low-impact exercises designed for senior dogs to maintain mobility and joint health.",
            "plan_type": "senior_fitness",
            "duration_weeks": 8,
            "sessions_per_week": 3,
            "price": 3499,
            "member_price": 2799,
            "pet_sizes": ["small", "medium", "large"],
            "pet_ages": ["senior"],
            "activities": ["gentle_walks", "stretching", "hydrotherapy"],
            "goals": ["joint_health", "mobility", "pain_management"],
            "image": "",
            "paw_reward_points": 45,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "plan-agility-intro",
            "name": "Agility Foundations",
            "description": "Introduction to agility training. Build coordination, confidence, and have fun with obstacles!",
            "plan_type": "agility",
            "duration_weeks": 6,
            "sessions_per_week": 2,
            "price": 5999,
            "member_price": 4999,
            "pet_sizes": ["small", "medium", "large"],
            "pet_ages": ["puppy", "adult"],
            "activities": ["jumps", "tunnels", "weave_poles", "a_frame"],
            "goals": ["coordination", "confidence", "bonding", "mental_stimulation"],
            "image": "",
            "paw_reward_points": 70,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "plan-endurance",
            "name": "Canine Athlete Program",
            "description": "Build stamina and endurance for active dogs. Perfect for hiking, running, and adventure companions.",
            "plan_type": "endurance",
            "duration_weeks": 10,
            "sessions_per_week": 5,
            "price": 6499,
            "member_price": 5499,
            "pet_sizes": ["medium", "large"],
            "pet_ages": ["adult"],
            "activities": ["running", "hiking", "swimming", "interval_training"],
            "goals": ["endurance", "strength", "adventure_readiness"],
            "image": "",
            "paw_reward_points": 80,
            "is_featured": False,
            "is_active": True
        },
        {
            "id": "plan-nutrition-consult",
            "name": "Nutrition Assessment",
            "description": "One-on-one nutrition consultation with diet planning tailored to your pet's needs.",
            "plan_type": "nutrition",
            "duration_weeks": 4,
            "sessions_per_week": 1,
            "price": 1999,
            "member_price": 1499,
            "pet_sizes": ["small", "medium", "large"],
            "pet_ages": ["puppy", "adult", "senior"],
            "activities": ["consultation", "diet_planning", "progress_tracking"],
            "goals": ["optimal_nutrition", "dietary_balance", "health_improvement"],
            "image": "",
            "paw_reward_points": 25,
            "is_featured": False,
            "is_active": True
        }
    ]
    
    # Fitness Products
    default_products = [
        {
            "id": "fit-activity-tracker",
            "name": "Smart Activity Tracker",
            "description": "GPS-enabled collar attachment that tracks steps, distance, and calories. Syncs with app.",
            "price": 3999,
            "compare_price": 4999,
            "category": "fit",
            "fit_type": "tracking",
            "tags": ["fit", "tracker", "gps", "smart", "activity"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 50,
            "is_birthday_perk": False
        },
        {
            "id": "fit-weight-scale",
            "name": "Pet Weight Scale",
            "description": "Digital scale with memory function. Track weight changes over time. Up to 50kg capacity.",
            "price": 2499,
            "compare_price": 2999,
            "category": "fit",
            "fit_type": "tracking",
            "tags": ["fit", "scale", "weight", "tracking"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 30,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "fit-agility-set",
            "name": "Home Agility Starter Kit",
            "description": "Complete set with adjustable jumps, tunnel, weave poles, and training guide.",
            "price": 4999,
            "compare_price": 5999,
            "category": "fit",
            "fit_type": "equipment",
            "tags": ["fit", "agility", "training", "equipment"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 60,
            "is_birthday_perk": False
        },
        {
            "id": "fit-fetch-launcher",
            "name": "Automatic Ball Launcher",
            "description": "Launches balls 10-30 feet. Adjustable distance. Perfect for fetch-loving dogs.",
            "price": 3499,
            "compare_price": 3999,
            "category": "fit",
            "fit_type": "equipment",
            "tags": ["fit", "fetch", "launcher", "exercise", "play"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 40,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "fit-treadmill",
            "name": "Pet Treadmill",
            "description": "Indoor treadmill for dogs. Variable speed, safety rails. Great for rainy days.",
            "price": 15999,
            "compare_price": 18999,
            "category": "fit",
            "fit_type": "equipment",
            "tags": ["fit", "treadmill", "indoor", "exercise"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 150,
            "is_birthday_perk": False
        },
        {
            "id": "fit-swimming-vest",
            "name": "Swimming Safety Vest",
            "description": "Buoyant vest with handle for pool and hydrotherapy sessions. High visibility.",
            "price": 1499,
            "compare_price": 1799,
            "category": "fit",
            "fit_type": "swimming",
            "tags": ["fit", "swimming", "safety", "hydrotherapy"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "fit-treat-pouch",
            "name": "Training Treat Pouch",
            "description": "Clip-on treat bag for training sessions. Easy access, washable, with poop bag holder.",
            "price": 599,
            "compare_price": 799,
            "category": "fit",
            "fit_type": "accessory",
            "tags": ["fit", "training", "treats", "pouch"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "fit-running-leash",
            "name": "Hands-Free Running Leash",
            "description": "Waist-mounted bungee leash for running with your dog. Shock absorbing, reflective.",
            "price": 1299,
            "compare_price": 1499,
            "category": "fit",
            "fit_type": "accessory",
            "tags": ["fit", "running", "leash", "hands-free"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "fit-puzzle-feeder",
            "name": "Slow Feeder Puzzle Bowl",
            "description": "Mental stimulation + slower eating. Reduces bloat risk and adds brain exercise.",
            "price": 899,
            "compare_price": 1099,
            "category": "fit",
            "fit_type": "nutrition",
            "tags": ["fit", "puzzle", "feeder", "mental", "nutrition"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": False
        },
        {
            "id": "fit-joint-supplement",
            "name": "Joint Support Supplement",
            "description": "Glucosamine & chondroitin formula for joint health. 90-day supply.",
            "price": 1799,
            "compare_price": 2199,
            "category": "fit",
            "fit_type": "nutrition",
            "tags": ["fit", "supplement", "joint", "health"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 22,
            "is_birthday_perk": False
        },
        {
            "id": "fit-cooling-vest",
            "name": "Cooling Exercise Vest",
            "description": "Evaporative cooling vest for hot weather workouts. Keeps your dog cool and comfortable.",
            "price": 1699,
            "compare_price": 1999,
            "category": "fit",
            "fit_type": "accessory",
            "tags": ["fit", "cooling", "vest", "summer", "exercise"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "fit-balance-board",
            "name": "Canine Balance Board",
            "description": "Wobble board for core strength and balance training. Great for rehabilitation.",
            "price": 2499,
            "compare_price": 2999,
            "category": "fit",
            "fit_type": "equipment",
            "tags": ["fit", "balance", "core", "rehab", "training"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        }
    ]
    
    # Fitness Bundles
    default_bundles = [
        {
            "id": "fit-bundle-starter",
            "name": "Fitness Starter Kit",
            "description": "Everything to kickstart your pet's fitness journey: tracker, treat pouch, and running leash.",
            "items": ["fit-activity-tracker", "fit-treat-pouch", "fit-running-leash"],
            "price": 4999,
            "original_price": 5897,
            "paw_reward_points": 65,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15,
            "is_active": True
        },
        {
            "id": "fit-bundle-weight-loss",
            "name": "Weight Management Bundle",
            "description": "Complete weight loss support: scale, slow feeder, and activity tracker.",
            "items": ["fit-weight-scale", "fit-puzzle-feeder", "fit-activity-tracker"],
            "price": 6499,
            "original_price": 7397,
            "paw_reward_points": 80,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "fit-bundle-agility",
            "name": "Agility Training Bundle",
            "description": "Home agility setup with training treats pouch and cooling vest for practice sessions.",
            "items": ["fit-agility-set", "fit-treat-pouch", "fit-cooling-vest"],
            "price": 6499,
            "original_price": 7297,
            "paw_reward_points": 85,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "fit-bundle-senior",
            "name": "Senior Wellness Bundle",
            "description": "Support your senior dog's health: joint supplements, balance board, and weight scale.",
            "items": ["fit-joint-supplement", "fit-balance-board", "fit-weight-scale"],
            "price": 5999,
            "original_price": 6797,
            "paw_reward_points": 75,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20,
            "is_active": True
        },
        {
            "id": "fit-bundle-swimmer",
            "name": "Swimmer's Kit",
            "description": "Everything for water-loving dogs: swimming vest and post-swim care essentials.",
            "items": ["fit-swimming-vest", "fit-cooling-vest"],
            "price": 2799,
            "original_price": 3198,
            "paw_reward_points": 35,
            "is_recommended": False,
            "is_birthday_perk": False,
            "is_active": True
        }
    ]
    
    # Fitness Partners
    default_partners = [
        {
            "id": "fit-partner-pawfit",
            "name": "PawFit Studio Mumbai",
            "partner_type": "fitness_center",
            "description": "Premier dog fitness center with indoor pool, agility course, and certified trainers.",
            "services": ["swimming", "agility", "weight_management", "senior_fitness"],
            "contact_name": "Rahul Sharma",
            "contact_email": "rahul@pawfitstudio.com",
            "contact_phone": "+91 98765 43210",
            "address": "Bandra West, Mumbai",
            "cities": ["Mumbai"],
            "rating": 4.8,
            "commission_percent": 15,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "fit-partner-caninek9",
            "name": "K9 Agility Arena",
            "partner_type": "agility_center",
            "description": "Professional agility training facility with competition-grade equipment.",
            "services": ["agility", "obedience", "competition_training"],
            "contact_name": "Priya Nair",
            "contact_email": "priya@k9agility.in",
            "contact_phone": "+91 87654 32109",
            "address": "Whitefield, Bangalore",
            "cities": ["Bangalore"],
            "rating": 4.9,
            "commission_percent": 12,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "fit-partner-aquapaws",
            "name": "Aqua Paws Hydrotherapy",
            "partner_type": "hydrotherapy",
            "description": "Specialized hydrotherapy center for rehabilitation and fitness.",
            "services": ["hydrotherapy", "rehabilitation", "swimming", "senior_care"],
            "contact_name": "Dr. Anjali Mehta",
            "contact_email": "info@aquapaws.in",
            "contact_phone": "+91 76543 21098",
            "address": "Koramangala, Bangalore",
            "cities": ["Bangalore"],
            "rating": 4.7,
            "commission_percent": 18,
            "is_verified": True,
            "is_active": True
        },
        {
            "id": "fit-partner-fitpet",
            "name": "FitPet Trainers",
            "partner_type": "trainer_network",
            "description": "Network of certified pet fitness trainers for home visits.",
            "services": ["personal_training", "weight_management", "puppy_fitness", "senior_mobility"],
            "contact_name": "Vikram Singh",
            "contact_email": "vikram@fitpet.in",
            "contact_phone": "+91 65432 10987",
            "address": "Pan India",
            "cities": ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad"],
            "rating": 4.6,
            "commission_percent": 20,
            "is_verified": True,
            "is_active": True
        }
    ]
    
    # Insert data
    for plan in default_plans:
        await db.fit_plans.update_one({"id": plan["id"]}, {"$set": plan}, upsert=True)
    
    for product in default_products:
        await db.products_master.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
    
    for bundle in default_bundles:
        await db.fit_bundles.update_one({"id": bundle["id"]}, {"$set": bundle}, upsert=True)
    
    for partner in default_partners:
        await db.fit_partners.update_one({"id": partner["id"]}, {"$set": partner}, upsert=True)
    
    logger.info(f"Seeded FIT pillar: {len(default_plans)} plans, {len(default_products)} products, {len(default_bundles)} bundles, {len(default_partners)} partners")
    
    return {
        "message": "FIT pillar data seeded successfully",
        "plans_seeded": len(default_plans),
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles),
        "partners_seeded": len(default_partners)
    }


# ============== ADDITIONAL FITNESS PRODUCTS SEED ==============

@router.post("/admin/seed-extra")
async def seed_extra_fit_products():
    """Seed additional fitness products with images"""
    db = get_db()
    
    new_products = [
        {
            "id": f"fit-prod-{uuid.uuid4().hex[:8]}",
            "name": "Dog Yoga Mat",
            "description": "Non-slip yoga mat designed for pet stretching and relaxation exercises. Perfect for doga sessions with your furry friend.",
            "price": 1299,
            "category": "fit",
            "pillar": "fit",
            "image": "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800",
            "in_stock": True,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"fit-prod-{uuid.uuid4().hex[:8]}",
            "name": "Interactive Fetch Launcher",
            "description": "Automatic ball launcher with adjustable distance settings. Great for high-energy dogs who love fetch.",
            "price": 2499,
            "category": "fit",
            "pillar": "fit",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "in_stock": True,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"fit-prod-{uuid.uuid4().hex[:8]}",
            "name": "Agility Training Kit",
            "description": "Complete agility set with hurdles, tunnel, weave poles, and training guide. Build your backyard agility course.",
            "price": 4999,
            "category": "fit",
            "pillar": "fit",
            "image": "https://images.unsplash.com/photo-1546815693-7533bae19894?w=800",
            "in_stock": True,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"fit-prod-{uuid.uuid4().hex[:8]}",
            "name": "Swimming Vest (All Sizes)",
            "description": "High-visibility flotation vest for water-loving dogs. Adjustable straps and handle for easy lifting.",
            "price": 1799,
            "category": "fit",
            "pillar": "fit",
            "image": "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800",
            "in_stock": True,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"fit-prod-{uuid.uuid4().hex[:8]}",
            "name": "Treadmill for Dogs",
            "description": "Indoor exercise solution for dogs. Variable speed settings and safety rails. Perfect for rainy days or apartment living.",
            "price": 15999,
            "category": "fit",
            "pillar": "fit",
            "image": "https://images.unsplash.com/photo-1676729274491-579573327bd0?w=800",
            "in_stock": True,
            "created_at": get_utc_timestamp()
        }
    ]
    
    inserted = 0
    for product in new_products:
        existing = await db.fit_products.find_one({"name": product["name"]})
        if not existing:
            await db.fit_products.insert_one(product)
            # Also add to unified_products
            await db.products_master.update_one(
                {"name": product["name"]},
                {"$set": product},
                upsert=True
            )
            inserted += 1
    
    return {
        "success": True,
        "products_seeded": inserted,
        "total_new_products": len(new_products)
    }
