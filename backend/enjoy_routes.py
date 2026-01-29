"""
ENJOY Pillar Routes
Pet-friendly events, trails, meetups, cafés, pop-ups
Community calendar, RSVP, curated experiences

Principles:
- Profile-first: experiences tagged by pet type (calm, social, adventurous)
- Concierge-led RSVP and ticketing
- Rewards visible for members
- All requests flow through Service Desk + Unified Inbox
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/enjoy", tags=["enjoy"])

def get_db():
    from server import db
    return db

def get_logger():
    from server import logger
    return logger


# Experience Types
EXPERIENCE_TYPES = {
    "event": {
        "name": "Events & Pop-ups",
        "icon": "🎉",
        "description": "Pet-friendly events, markets, and pop-up experiences",
        "color": "from-purple-500 to-pink-500"
    },
    "trail": {
        "name": "Trails & Walks",
        "icon": "🥾",
        "description": "Scenic trails and nature walks for you and your pet",
        "color": "from-green-500 to-emerald-500"
    },
    "meetup": {
        "name": "Meetups & Playdates",
        "icon": "🐕",
        "description": "Breed meetups, playdates, and social gatherings",
        "color": "from-blue-500 to-cyan-500"
    },
    "cafe": {
        "name": "Pet Cafés",
        "icon": "☕",
        "description": "Pet-friendly cafés and restaurants for hangouts",
        "color": "from-amber-500 to-orange-500"
    },
    "workshop": {
        "name": "Workshops & Classes",
        "icon": "📚",
        "description": "Training workshops, pet photography, and learning sessions",
        "color": "from-indigo-500 to-violet-500"
    },
    "wellness": {
        "name": "Wellness Experiences",
        "icon": "🧘",
        "description": "Pet spa days, yoga with dogs, relaxation sessions",
        "color": "from-teal-500 to-cyan-500"
    }
}

# Pet Personality Tags
PET_PERSONALITIES = ["calm", "social", "adventurous", "shy", "energetic", "senior-friendly", "puppy-friendly"]


# Models
class ExperienceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    experience_type: str  # event, trail, meetup, cafe, workshop, wellness
    # Location
    city: str
    venue_name: Optional[str] = None
    address: Optional[str] = None
    map_link: Optional[str] = None
    # Timing
    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # weekly, monthly
    # Capacity
    max_capacity: Optional[int] = None
    current_bookings: int = 0
    # Pricing
    price: float = 0
    member_price: Optional[float] = None
    is_free: bool = False
    # Pet requirements
    pet_personalities: List[str] = []  # calm, social, adventurous
    pet_sizes_allowed: List[str] = []  # small, medium, large, all
    vaccination_required: bool = True
    leash_required: bool = True
    # Media
    image: Optional[str] = None
    gallery: List[str] = []
    # Rewards
    paw_reward_points: int = 0
    member_exclusive: bool = False
    # Tags
    tags: List[str] = []
    # Status
    is_active: bool = True
    is_featured: bool = False


class ExperienceRSVP(BaseModel):
    experience_id: str
    pet_id: Optional[str] = None
    pet_name: str
    pet_breed: Optional[str] = None
    pet_size: Optional[str] = None
    pet_personality: Optional[str] = None
    number_of_pets: int = 1
    number_of_humans: int = 1
    special_requirements: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None


class ExperiencePartnerCreate(BaseModel):
    name: str
    partner_type: str  # venue, organizer, sponsor
    description: Optional[str] = None
    logo: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    cities: List[str] = []
    commission_percent: float = 0
    is_verified: bool = False
    is_active: bool = True


# ==================== EXPERIENCES ENDPOINTS ====================

@router.get("/types")
async def get_experience_types():
    """Get available experience types"""
    return {"experience_types": EXPERIENCE_TYPES, "pet_personalities": PET_PERSONALITIES}


@router.get("/experiences")
async def get_experiences(
    experience_type: Optional[str] = None,
    city: Optional[str] = None,
    pet_personality: Optional[str] = None,
    is_featured: Optional[bool] = None,
    upcoming_only: bool = True,
    limit: int = 50
):
    """Get experiences with filters"""
    db = get_db()
    
    query = {"is_active": True}
    
    if experience_type:
        query["experience_type"] = experience_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if pet_personality:
        query["pet_personalities"] = {"$in": [pet_personality]}
    if is_featured is not None:
        query["is_featured"] = is_featured
    if upcoming_only:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["$or"] = [
            {"event_date": {"$gte": today}},
            {"event_date": None},
            {"is_recurring": True}
        ]
    
    experiences = await db.enjoy_experiences.find(query, {"_id": 0}).sort("event_date", 1).limit(limit).to_list(limit)
    
    return {"experiences": experiences, "total": len(experiences)}


@router.get("/experience/{experience_id}")
async def get_experience(experience_id: str):
    """Get a specific experience"""
    db = get_db()
    
    experience = await db.enjoy_experiences.find_one({"id": experience_id}, {"_id": 0})
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    return experience


@router.post("/admin/experiences")
async def create_experience(experience: ExperienceCreate):
    """Create a new experience"""
    db = get_db()
    logger = get_logger()
    
    experience_id = f"exp-{uuid.uuid4().hex[:8]}"
    
    experience_doc = {
        "id": experience_id,
        **experience.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enjoy_experiences.insert_one(experience_doc)
    logger.info(f"Experience created: {experience_id} - {experience.name}")
    
    return {"success": True, "experience_id": experience_id}


@router.put("/admin/experiences/{experience_id}")
async def update_experience(experience_id: str, experience: ExperienceCreate):
    """Update an experience"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {
        **experience.dict(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.enjoy_experiences.update_one(
        {"id": experience_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    logger.info(f"Experience updated: {experience_id}")
    return {"success": True, "message": "Experience updated"}


@router.delete("/admin/experiences/{experience_id}")
async def delete_experience(experience_id: str):
    """Delete an experience"""
    db = get_db()
    logger = get_logger()
    
    result = await db.enjoy_experiences.delete_one({"id": experience_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    logger.info(f"Experience deleted: {experience_id}")
    return {"success": True, "message": "Experience deleted"}


# ==================== RSVP / BOOKING ====================

@router.post("/rsvp")
async def create_rsvp(rsvp: ExperienceRSVP):
    """Create an RSVP for an experience"""
    db = get_db()
    logger = get_logger()
    
    # Get experience details
    experience = await db.enjoy_experiences.find_one({"id": rsvp.experience_id}, {"_id": 0})
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    # Check capacity
    if experience.get("max_capacity"):
        current = experience.get("current_bookings", 0)
        if current >= experience["max_capacity"]:
            raise HTTPException(status_code=400, detail="This experience is fully booked")
    
    # Generate RSVP ID
    rsvp_id = f"RSVP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Get pet profile for context
    pet_profile = None
    if rsvp.pet_id:
        pet_doc = await db.pets.find_one({"id": rsvp.pet_id}, {"_id": 0})
        if pet_doc:
            pet_profile = pet_doc
    
    rsvp_doc = {
        "rsvp_id": rsvp_id,
        "experience_id": rsvp.experience_id,
        "experience_name": experience.get("name"),
        "experience_type": experience.get("experience_type"),
        "event_date": experience.get("event_date"),
        "venue": experience.get("venue_name"),
        "city": experience.get("city"),
        "status": "pending",  # pending, confirmed, cancelled, attended
        
        "pet": {
            "id": rsvp.pet_id,
            "name": rsvp.pet_name,
            "breed": rsvp.pet_breed,
            "size": rsvp.pet_size,
            "personality": rsvp.pet_personality
        },
        "number_of_pets": rsvp.number_of_pets,
        "number_of_humans": rsvp.number_of_humans,
        "special_requirements": rsvp.special_requirements,
        
        "customer": {
            "name": rsvp.user_name,
            "email": rsvp.user_email,
            "phone": rsvp.user_phone
        },
        
        "pricing": {
            "unit_price": experience.get("price", 0),
            "total": experience.get("price", 0) * (rsvp.number_of_pets + rsvp.number_of_humans)
        },
        "paw_points_earned": experience.get("paw_reward_points", 0),
        
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enjoy_rsvps.insert_one(rsvp_doc)
    
    # Update booking count
    await db.enjoy_experiences.update_one(
        {"id": rsvp.experience_id},
        {"$inc": {"current_bookings": rsvp.number_of_pets}}
    )
    
    # Create Service Desk ticket
    ticket_doc = {
        "ticket_id": rsvp_id,
        "source": "enjoy_pillar",
        "pillar": "enjoy",
        "category": experience.get("experience_type"),
        "status": "new",
        "priority": "normal",
        "subject": f"RSVP: {experience.get('name')} - {rsvp.pet_name}",
        "description": f"{rsvp.user_name} has requested to attend {experience.get('name')} with {rsvp.pet_name}.",
        "member": {
            "name": rsvp.user_name,
            "email": rsvp.user_email,
            "phone": rsvp.user_phone
        },
        "pet_context": {
            "pet_id": rsvp.pet_id,
            "pet_name": rsvp.pet_name,
            "pet_breed": rsvp.pet_breed
        },
        "metadata": {
            "rsvp_id": rsvp_id,
            "experience_id": rsvp.experience_id,
            "event_date": experience.get("event_date")
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket_doc)
    
    # Create Unified Inbox entry
    inbox_entry = {
        "request_id": rsvp_id,
        "channel": "web",
        "request_type": "enjoy_rsvp",
        "pillar": "enjoy",
        "status": "pending",
        "customer_name": rsvp.user_name,
        "customer_email": rsvp.user_email,
        "customer_phone": rsvp.user_phone,
        "pet_info": {"name": rsvp.pet_name, "breed": rsvp.pet_breed},
        "message": f"RSVP for {experience.get('name')} on {experience.get('event_date')}",
        "metadata": {"rsvp_id": rsvp_id, "experience_id": rsvp.experience_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.channel_intakes.insert_one(inbox_entry)
    
    # Create Admin Notification
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    notification_doc = {
        "id": notification_id,
        "type": "enjoy_rsvp",
        "pillar": "enjoy",
        "title": f"New RSVP: {experience.get('name')}",
        "message": f"{rsvp.user_name} wants to attend {experience.get('name')} with {rsvp.pet_name} ({rsvp.pet_breed})",
        "read": False,  # IMPORTANT: For API compatibility
        "priority": "normal",
        "status": "unread",
        "urgency": "medium",
        "source": "enjoy_pillar",
        "reference_id": rsvp_id,
        "reference_type": "rsvp",
        "ticket_id": rsvp_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": rsvp.user_name,
            "email": rsvp.user_email,
            "phone": rsvp.user_phone
        },
        "pet": {
            "name": rsvp.pet_name,
            "breed": rsvp.pet_breed
        },
        "link": f"/admin?tab=servicedesk&ticket={rsvp_id}",
        "metadata": {
            "experience_id": rsvp.experience_id,
            "experience_name": experience.get("name"),
            "event_date": experience.get("event_date"),
            "venue": experience.get("venue_name"),
            "number_of_pets": rsvp.number_of_pets,
            "number_of_humans": rsvp.number_of_humans,
            "total_price": experience.get("price", 0) * (rsvp.number_of_pets + rsvp.number_of_humans)
        },
        "action_required": True,
        "action_type": "confirm_rsvp",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read_at": None
    }
    await db.admin_notifications.insert_one(notification_doc)
    
    # Also add to service_desk_tickets for Command Center visibility
    service_desk_entry = {
        "ticket_id": rsvp_id,
        "source": "enjoy_pillar",
        "channel": "web",
        "pillar": "enjoy",
        "category": "rsvp",
        "subcategory": experience.get("experience_type"),
        "status": "new",
        "priority": "normal",
        "subject": f"RSVP: {experience.get('name')} - {rsvp.pet_name}",
        "description": f"{rsvp.user_name} has requested to attend {experience.get('name')} with {rsvp.pet_name}. Event Date: {experience.get('event_date')}",
        "customer": {
            "name": rsvp.user_name,
            "email": rsvp.user_email,
            "phone": rsvp.user_phone
        },
        "pet_context": {
            "pet_id": rsvp.pet_id,
            "pet_name": rsvp.pet_name,
            "pet_breed": rsvp.pet_breed
        },
        "metadata": {
            "rsvp_id": rsvp_id,
            "experience_id": rsvp.experience_id,
            "event_date": experience.get("event_date"),
            "venue": experience.get("venue_name"),
            "total_price": experience.get("price", 0) * (rsvp.number_of_pets + rsvp.number_of_humans)
        },
        "messages": [{
            "id": f"MSG-{uuid.uuid4().hex[:6]}",
            "sender": "customer",
            "sender_name": rsvp.user_name,
            "content": f"I would like to attend {experience.get('name')} with my pet {rsvp.pet_name}.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.service_desk_tickets.insert_one(service_desk_entry)
    
    # Update pet profile with experience preferences
    if rsvp.pet_id and rsvp.pet_personality:
        await db.pets.update_one(
            {"id": rsvp.pet_id},
            {"$set": {
                "soul.personality": rsvp.pet_personality,
                "soul.enjoy_history.last_rsvp": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"RSVP created: {rsvp_id} for experience {rsvp.experience_id}")
    
    return {
        "success": True,
        "rsvp_id": rsvp_id,
        "status": "pending",
        "message": f"Your RSVP for {experience.get('name')} has been submitted. We'll confirm shortly!"
    }


@router.get("/rsvps")
async def get_rsvps(
    status: Optional[str] = None,
    experience_id: Optional[str] = None,
    limit: int = 50
):
    """Get RSVPs (admin)"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if experience_id:
        query["experience_id"] = experience_id
    
    rsvps = await db.enjoy_rsvps.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"rsvps": rsvps, "total": len(rsvps)}


@router.patch("/admin/rsvp/{rsvp_id}")
async def update_rsvp_status(rsvp_id: str, status: str):
    """Update RSVP status"""
    db = get_db()
    logger = get_logger()
    
    valid_statuses = ["pending", "confirmed", "cancelled", "attended", "no_show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.enjoy_rsvps.update_one(
        {"rsvp_id": rsvp_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RSVP not found")
    
    # Update ticket status
    ticket_status_map = {
        "pending": "new",
        "confirmed": "in_progress",
        "cancelled": "closed",
        "attended": "resolved",
        "no_show": "closed"
    }
    await db.tickets.update_one(
        {"ticket_id": rsvp_id},
        {"$set": {"status": ticket_status_map.get(status, "in_progress")}}
    )
    
    logger.info(f"RSVP {rsvp_id} status updated to {status}")
    return {"success": True, "message": f"RSVP status updated to {status}"}


@router.get("/my-rsvps")
async def get_my_rsvps(user_email: str):
    """Get user's RSVPs"""
    db = get_db()
    
    rsvps = await db.enjoy_rsvps.find(
        {"customer.email": user_email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"rsvps": rsvps, "count": len(rsvps)}


# ==================== PARTNERS ====================

@router.get("/admin/partners")
async def get_enjoy_partners(partner_type: Optional[str] = None):
    """Get experience partners"""
    db = get_db()
    
    query = {}
    if partner_type:
        query["partner_type"] = partner_type
    
    partners = await db.enjoy_partners.find(query, {"_id": 0}).to_list(100)
    return {"partners": partners, "total": len(partners)}


@router.post("/admin/partners")
async def create_enjoy_partner(partner: ExperiencePartnerCreate):
    """Create an experience partner"""
    db = get_db()
    logger = get_logger()
    
    partner_id = f"enjoy-partner-{uuid.uuid4().hex[:8]}"
    
    partner_doc = {
        "id": partner_id,
        **partner.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enjoy_partners.insert_one(partner_doc)
    logger.info(f"Enjoy partner created: {partner_id}")
    
    return {"success": True, "partner_id": partner_id}


@router.put("/admin/partners/{partner_id}")
async def update_enjoy_partner(partner_id: str, partner: ExperiencePartnerCreate):
    """Update a partner"""
    db = get_db()
    
    result = await db.enjoy_partners.update_one(
        {"id": partner_id},
        {"$set": {**partner.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True, "message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_enjoy_partner(partner_id: str):
    """Delete a partner"""
    db = get_db()
    
    result = await db.enjoy_partners.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True, "message": "Partner deleted"}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_enjoy_products(limit: int = 50):
    """Get enjoy-related products from unified_products collection"""
    db = get_db()
    
    # Query unified_products with pillar="enjoy" OR legacy category/tags
    query = {"$or": [
        {"pillar": "enjoy"},
        {"category": "enjoy"},
        {"tags": {"$in": ["enjoy", "outdoor", "social", "adventure", "meetup"]}}
    ]}
    
    products = await db.unified_products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    # Also check legacy products collection
    legacy_products = await db.products.find(
        {"$or": [
            {"category": "enjoy"},
            {"tags": {"$in": ["enjoy", "outdoor", "social", "adventure", "meetup"]}}
        ]},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Merge without duplicates
    seen_ids = {p.get("id") for p in products}
    for p in legacy_products:
        if p.get("id") not in seen_ids:
            products.append(p)
            seen_ids.add(p.get("id"))
    
    return {"products": products[:limit], "total": len(products)}


@router.get("/admin/products/export")
async def export_enjoy_products():
    """Export enjoy products as CSV-ready data"""
    db = get_db()
    
    products = await db.products.find(
        {"$or": [{"category": "enjoy"}, {"enjoy_type": {"$exists": True}}]},
        {"_id": 0}
    ).to_list(500)
    
    return {"products": products, "total": len(products)}


@router.post("/admin/products")
async def create_enjoy_product(product: dict):
    """Create a new enjoy product"""
    db = get_db()
    
    product["id"] = f"enjoy-{uuid.uuid4().hex[:8]}"
    product["category"] = "enjoy"
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    product["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    return {"message": "Product created", "id": product["id"]}


@router.put("/admin/products/{product_id}")
async def update_enjoy_product(product_id: str, product_data: dict):
    """Update an enjoy product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_enjoy_product(product_id: str):
    """Delete an enjoy product"""
    db = get_db()
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_enjoy_bundles(limit: int = 20):
    """Get enjoy bundles"""
    db = get_db()
    
    bundles = await db.enjoy_bundles.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(limit)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_enjoy_bundle(bundle_data: dict):
    """Create a new enjoy bundle"""
    db = get_db()
    
    bundle = {
        "id": f"enjoy-bundle-{uuid.uuid4().hex[:8]}",
        "bundle_type": "enjoy",
        **bundle_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enjoy_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    
    return {"message": "Bundle created", "id": bundle["id"]}


@router.put("/admin/bundles/{bundle_id}")
async def update_enjoy_bundle(bundle_id: str, bundle_data: dict):
    """Update an enjoy bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    bundle_data.pop("id", None)
    bundle_data.pop("_id", None)
    
    result = await db.enjoy_bundles.update_one({"id": bundle_id}, {"$set": bundle_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_enjoy_bundle(bundle_id: str):
    """Delete an enjoy bundle"""
    db = get_db()
    
    result = await db.enjoy_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}


# ==================== CALENDAR ====================

@router.get("/calendar")
async def get_calendar(
    city: Optional[str] = None,
    month: Optional[str] = None,  # YYYY-MM format
    pet_personality: Optional[str] = None
):
    """Get community calendar of experiences"""
    db = get_db()
    
    query = {"is_active": True}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if pet_personality:
        query["pet_personalities"] = {"$in": [pet_personality]}
    if month:
        query["event_date"] = {"$regex": f"^{month}"}
    
    experiences = await db.enjoy_experiences.find(
        query,
        {"_id": 0, "id": 1, "name": 1, "experience_type": 1, "event_date": 1, "start_time": 1, "city": 1, "venue_name": 1, "price": 1, "is_free": 1, "image": 1}
    ).sort("event_date", 1).to_list(100)
    
    # Group by date
    calendar = {}
    for exp in experiences:
        date = exp.get("event_date", "ongoing")
        if date not in calendar:
            calendar[date] = []
        calendar[date].append(exp)
    
    return {"calendar": calendar, "total_experiences": len(experiences)}


# ==================== STATS ====================

@router.get("/stats")
async def get_enjoy_stats():
    """Get enjoy pillar statistics"""
    db = get_db()
    
    total_experiences = await db.enjoy_experiences.count_documents({"is_active": True})
    total_rsvps = await db.enjoy_rsvps.count_documents({})
    pending_rsvps = await db.enjoy_rsvps.count_documents({"status": "pending"})
    confirmed_rsvps = await db.enjoy_rsvps.count_documents({"status": "confirmed"})
    
    # By type
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$experience_type", "count": {"$sum": 1}}}
    ]
    by_type = await db.enjoy_experiences.aggregate(pipeline).to_list(20)
    
    return {
        "total_experiences": total_experiences,
        "total_rsvps": total_rsvps,
        "pending_rsvps": pending_rsvps,
        "confirmed_rsvps": confirmed_rsvps,
        "by_type": {item["_id"]: item["count"] for item in by_type if item["_id"]}
    }


# ==================== SEED ====================

@router.post("/admin/seed")
async def seed_enjoy_data():
    """Seed default experiences and products"""
    db = get_db()
    logger = get_logger()
    
    default_experiences = [
        {
            "id": "exp-dogpark-mumbai",
            "name": "Weekend Dog Park Meetup",
            "description": "Join fellow pet parents for a fun morning at the dog park. Supervised play, training tips, and coffee for humans!",
            "experience_type": "meetup",
            "city": "Mumbai",
            "venue_name": "Shivaji Park Dog Zone",
            "address": "Shivaji Park, Dadar, Mumbai",
            "event_date": "2026-01-25",
            "start_time": "07:00",
            "end_time": "10:00",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 30,
            "current_bookings": 12,
            "price": 0,
            "is_free": True,
            "pet_personalities": ["social", "energetic", "adventurous"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 10,
            "member_exclusive": False,
            "tags": ["meetup", "free", "weekly", "dogs", "social"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-trail-bangalore",
            "name": "Nandi Hills Pet Trek",
            "description": "A guided morning trek to Nandi Hills with your furry companion. Includes breakfast and pet hydration stations.",
            "experience_type": "trail",
            "city": "Bangalore",
            "venue_name": "Nandi Hills",
            "address": "Nandi Hills, Chikkaballapur",
            "event_date": "2026-02-01",
            "start_time": "05:30",
            "end_time": "11:00",
            "is_recurring": False,
            "max_capacity": 20,
            "current_bookings": 8,
            "price": 1500,
            "member_price": 1200,
            "is_free": False,
            "pet_personalities": ["adventurous", "energetic"],
            "pet_sizes_allowed": ["medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 25,
            "member_exclusive": False,
            "tags": ["trek", "nature", "adventure", "outdoor"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-cafe-delhi",
            "name": "Puppuccino Sunday",
            "description": "Bring your pup for a relaxing Sunday at Barks & Beans café. Special puppuccinos and pet-friendly treats included!",
            "experience_type": "cafe",
            "city": "Delhi",
            "venue_name": "Barks & Beans Café",
            "address": "Hauz Khas Village, New Delhi",
            "event_date": "2026-01-26",
            "start_time": "11:00",
            "end_time": "16:00",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 15,
            "current_bookings": 5,
            "price": 500,
            "member_price": 400,
            "is_free": False,
            "pet_personalities": ["calm", "social"],
            "pet_sizes_allowed": ["small", "medium"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 15,
            "member_exclusive": False,
            "tags": ["cafe", "relaxed", "treats", "sunday"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-workshop-training",
            "name": "Basic Obedience Workshop",
            "description": "A 2-hour hands-on workshop covering sit, stay, recall, and leash manners. Perfect for puppies and new pet parents.",
            "experience_type": "workshop",
            "city": "Mumbai",
            "venue_name": "Pawsitive Training Center",
            "address": "Andheri West, Mumbai",
            "event_date": "2026-01-27",
            "start_time": "10:00",
            "end_time": "12:00",
            "is_recurring": False,
            "max_capacity": 10,
            "current_bookings": 6,
            "price": 2000,
            "member_price": 1500,
            "is_free": False,
            "pet_personalities": ["puppy-friendly", "energetic"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 30,
            "member_exclusive": False,
            "tags": ["workshop", "training", "obedience", "puppies"],
            "is_active": True,
            "is_featured": False
        },
        {
            "id": "exp-wellness-spa",
            "name": "Pet Spa & Relaxation Day",
            "description": "Pamper your pet with a full spa experience: grooming, massage, aromatherapy, and calming music.",
            "experience_type": "wellness",
            "city": "Bangalore",
            "venue_name": "Zen Paws Spa",
            "address": "Indiranagar, Bangalore",
            "event_date": "2026-02-05",
            "start_time": "09:00",
            "end_time": "17:00",
            "is_recurring": False,
            "max_capacity": 8,
            "current_bookings": 3,
            "price": 3500,
            "member_price": 2800,
            "is_free": False,
            "pet_personalities": ["calm", "senior-friendly"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 50,
            "member_exclusive": True,
            "tags": ["spa", "wellness", "relaxation", "grooming"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-event-petfest",
            "name": "PetFest 2026",
            "description": "The biggest pet festival of the year! Competitions, stalls, food, games, and celebrity appearances.",
            "experience_type": "event",
            "city": "Mumbai",
            "venue_name": "MMRDA Grounds",
            "address": "BKC, Mumbai",
            "event_date": "2026-02-15",
            "start_time": "10:00",
            "end_time": "20:00",
            "is_recurring": False,
            "max_capacity": 500,
            "current_bookings": 156,
            "price": 299,
            "member_price": 199,
            "is_free": False,
            "pet_personalities": ["social", "adventurous", "calm", "energetic"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 40,
            "member_exclusive": False,
            "tags": ["festival", "event", "competition", "fun"],
            "is_active": True,
            "is_featured": True
        },
        # Additional Experiences
        {
            "id": "exp-photography-mumbai",
            "name": "Pet Photography Day",
            "description": "Professional pet photoshoot in studio with instant digital photos. Props and costumes included!",
            "experience_type": "workshop",
            "city": "Mumbai",
            "venue_name": "Paws & Pixels Studio",
            "address": "Bandra West, Mumbai",
            "event_date": "2026-02-10",
            "start_time": "10:00",
            "end_time": "18:00",
            "is_recurring": False,
            "max_capacity": 25,
            "current_bookings": 10,
            "price": 1999,
            "member_price": 1499,
            "is_free": False,
            "pet_personalities": ["calm", "social"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 35,
            "member_exclusive": False,
            "tags": ["photography", "workshop", "studio", "fun"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-yoga-dogs-bangalore",
            "name": "Doga - Yoga with Dogs",
            "description": "A relaxing yoga session with your furry friend. Calming exercises, breathing, and bonding time.",
            "experience_type": "wellness",
            "city": "Bangalore",
            "venue_name": "Zen Pet Studio",
            "address": "Koramangala, Bangalore",
            "event_date": "2026-01-28",
            "start_time": "07:00",
            "end_time": "08:30",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 15,
            "current_bookings": 7,
            "price": 800,
            "member_price": 600,
            "is_free": False,
            "pet_personalities": ["calm", "senior-friendly"],
            "pet_sizes_allowed": ["small", "medium"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 20,
            "member_exclusive": False,
            "tags": ["wellness", "yoga", "relaxation", "bonding"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-beach-walk-goa",
            "name": "Sunset Beach Walk Goa",
            "description": "A beautiful sunset walk on Goa's pet-friendly beach. Photo ops, coconut water, and sand play!",
            "experience_type": "trail",
            "city": "Goa",
            "venue_name": "Morjim Beach",
            "address": "Morjim, North Goa",
            "event_date": "2026-02-08",
            "start_time": "16:30",
            "end_time": "18:30",
            "is_recurring": False,
            "max_capacity": 20,
            "current_bookings": 5,
            "price": 500,
            "member_price": 350,
            "is_free": False,
            "pet_personalities": ["adventurous", "social", "energetic"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 15,
            "member_exclusive": False,
            "tags": ["beach", "sunset", "goa", "outdoor", "nature"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-puppy-playdate-delhi",
            "name": "Puppy Playdate Party",
            "description": "Supervised play session for puppies under 1 year. Socialization games, treats, and puppy training tips.",
            "experience_type": "meetup",
            "city": "Delhi",
            "venue_name": "Little Paws Play Centre",
            "address": "Vasant Kunj, New Delhi",
            "event_date": "2026-01-26",
            "start_time": "10:00",
            "end_time": "12:00",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 15,
            "current_bookings": 9,
            "price": 350,
            "member_price": 250,
            "is_free": False,
            "pet_personalities": ["puppy-friendly", "social", "energetic"],
            "pet_sizes_allowed": ["small", "medium"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 12,
            "member_exclusive": False,
            "tags": ["puppy", "playdate", "socialization", "training"],
            "is_active": True,
            "is_featured": False
        },
        {
            "id": "exp-cafe-mumbai",
            "name": "Brunch at Woof Cafe",
            "description": "Gourmet brunch for you and treats for your pet at Mumbai's most Instagram-worthy pet cafe.",
            "experience_type": "cafe",
            "city": "Mumbai",
            "venue_name": "Woof Cafe & Kitchen",
            "address": "Andheri West, Mumbai",
            "event_date": "2026-02-02",
            "start_time": "10:00",
            "end_time": "15:00",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 20,
            "current_bookings": 8,
            "price": 1200,
            "member_price": 950,
            "is_free": False,
            "pet_personalities": ["calm", "social"],
            "pet_sizes_allowed": ["small", "medium"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 18,
            "member_exclusive": False,
            "tags": ["cafe", "brunch", "food", "relaxed", "instagram"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-agility-bangalore",
            "name": "Intro to Dog Agility",
            "description": "Learn agility basics with your dog! Jump obstacles, tunnels, and weave poles. Great exercise and bonding.",
            "experience_type": "workshop",
            "city": "Bangalore",
            "venue_name": "K9 Agility Arena",
            "address": "Whitefield, Bangalore",
            "event_date": "2026-02-15",
            "start_time": "08:00",
            "end_time": "11:00",
            "is_recurring": False,
            "max_capacity": 12,
            "current_bookings": 6,
            "price": 2500,
            "member_price": 2000,
            "is_free": False,
            "pet_personalities": ["energetic", "adventurous"],
            "pet_sizes_allowed": ["medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 40,
            "member_exclusive": False,
            "tags": ["agility", "training", "exercise", "workshop", "sport"],
            "is_active": True,
            "is_featured": False
        },
        {
            "id": "exp-golden-meetup-mumbai",
            "name": "Golden Retriever Meetup",
            "description": "A special meetup just for Golden Retrievers! Swimming, fetch games, and lots of golden fluff.",
            "experience_type": "meetup",
            "city": "Mumbai",
            "venue_name": "Powai Lake Garden",
            "address": "Powai, Mumbai",
            "event_date": "2026-02-09",
            "start_time": "07:00",
            "end_time": "09:30",
            "is_recurring": False,
            "max_capacity": 25,
            "current_bookings": 18,
            "price": 0,
            "is_free": True,
            "pet_personalities": ["social", "energetic", "adventurous"],
            "pet_sizes_allowed": ["large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 8,
            "member_exclusive": False,
            "tags": ["breed-meetup", "golden-retriever", "swimming", "free"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-market-pune",
            "name": "Pet-Friendly Flea Market",
            "description": "Shop pet accessories, treats, and toys at this monthly pet market. Live music and food stalls!",
            "experience_type": "event",
            "city": "Pune",
            "venue_name": "Camp Area Ground",
            "address": "MG Road, Pune",
            "event_date": "2026-02-22",
            "start_time": "10:00",
            "end_time": "19:00",
            "is_recurring": True,
            "recurrence_pattern": "monthly",
            "max_capacity": 200,
            "current_bookings": 45,
            "price": 100,
            "member_price": 0,
            "is_free": False,
            "pet_personalities": ["calm", "social", "adventurous"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 15,
            "member_exclusive": False,
            "tags": ["market", "shopping", "event", "music", "food"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-swim-hyderabad",
            "name": "Pool Day for Pups",
            "description": "A dedicated pool session for dogs! Safe swimming in a chlorine-free pet pool with lifeguards.",
            "experience_type": "wellness",
            "city": "Hyderabad",
            "venue_name": "Aqua Paws Swimming",
            "address": "Jubilee Hills, Hyderabad",
            "event_date": "2026-02-12",
            "start_time": "09:00",
            "end_time": "12:00",
            "is_recurring": True,
            "recurrence_pattern": "weekly",
            "max_capacity": 10,
            "current_bookings": 4,
            "price": 1800,
            "member_price": 1400,
            "is_free": False,
            "pet_personalities": ["adventurous", "energetic"],
            "pet_sizes_allowed": ["medium", "large"],
            "vaccination_required": True,
            "leash_required": False,
            "image": "",
            "paw_reward_points": 30,
            "member_exclusive": False,
            "tags": ["swimming", "pool", "exercise", "wellness", "fun"],
            "is_active": True,
            "is_featured": True
        },
        {
            "id": "exp-training-delhi",
            "name": "Basic Obedience Bootcamp",
            "description": "A 2-hour intensive bootcamp covering sit, stay, come, and leash walking. Certified trainers.",
            "experience_type": "workshop",
            "city": "Delhi",
            "venue_name": "Canine Academy",
            "address": "Greater Kailash, New Delhi",
            "event_date": "2026-02-18",
            "start_time": "09:00",
            "end_time": "11:00",
            "is_recurring": False,
            "max_capacity": 8,
            "current_bookings": 5,
            "price": 3000,
            "member_price": 2400,
            "is_free": False,
            "pet_personalities": ["puppy-friendly", "energetic"],
            "pet_sizes_allowed": ["small", "medium", "large"],
            "vaccination_required": True,
            "leash_required": True,
            "image": "",
            "paw_reward_points": 45,
            "member_exclusive": False,
            "tags": ["training", "obedience", "bootcamp", "workshop"],
            "is_active": True,
            "is_featured": False
        }
    ]
    
    default_products = [
        {
            "id": "enjoy-outdoor-bowl",
            "name": "Portable Adventure Bowl",
            "description": "Collapsible silicone bowl for water and treats on outdoor adventures.",
            "price": 349,
            "compare_price": 499,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "adventure", "bowl", "portable"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-bandana",
            "name": "Social Butterfly Bandana",
            "description": "Stylish bandana with 'I'm Friendly' message for meetups and events.",
            "price": 299,
            "compare_price": 399,
            "category": "enjoy",
            "enjoy_type": "social",
            "tags": ["enjoy", "social", "bandana", "fashion", "meetup"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "enjoy-treat-pouch",
            "name": "Adventure Treat Pouch",
            "description": "Waterproof treat pouch with poop bag dispenser for outdoor activities.",
            "price": 599,
            "compare_price": 799,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "treats", "pouch", "adventure"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-cooling-vest",
            "name": "Cooling Vest for Outdoor Fun",
            "description": "Evaporative cooling vest to keep your pet comfortable during outdoor activities.",
            "price": 1299,
            "compare_price": 1699,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "cooling", "summer", "adventure"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-led-collar",
            "name": "LED Safety Collar",
            "description": "Rechargeable LED collar for evening walks and events. 3 light modes.",
            "price": 799,
            "compare_price": 999,
            "category": "enjoy",
            "enjoy_type": "safety",
            "tags": ["enjoy", "safety", "LED", "collar", "evening"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-photo-props",
            "name": "Pet Photo Props Kit",
            "description": "Fun props for pet photography at events: glasses, hats, bow ties, and signs.",
            "price": 449,
            "compare_price": 599,
            "category": "enjoy",
            "enjoy_type": "fun",
            "tags": ["enjoy", "fun", "photos", "props", "events"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": True,
            "birthday_discount_percent": 30
        },
        # Additional Products
        {
            "id": "enjoy-hiking-harness",
            "name": "Trail Adventure Harness",
            "description": "Padded hiking harness with handle and reflective strips for trail adventures.",
            "price": 1899,
            "compare_price": 2499,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "harness", "hiking", "adventure"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 25,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-playdate-kit",
            "name": "Playdate Party Kit",
            "description": "Complete kit for hosting doggy playdates: tug toys, balls, treat bags, and clean-up supplies.",
            "price": 999,
            "compare_price": 1299,
            "category": "enjoy",
            "enjoy_type": "social",
            "tags": ["enjoy", "social", "playdate", "toys", "party"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "enjoy-swim-vest",
            "name": "Safety Swim Vest",
            "description": "Buoyant swim vest with handle for pool and beach adventures. High visibility orange.",
            "price": 1599,
            "compare_price": 1999,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "swimming", "safety", "beach"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-cafe-blanket",
            "name": "Cafe Companion Blanket",
            "description": "Portable, washable blanket for cafe visits. Folds into compact pouch.",
            "price": 699,
            "compare_price": 899,
            "category": "enjoy",
            "enjoy_type": "social",
            "tags": ["enjoy", "social", "cafe", "blanket", "portable"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-event-backpack",
            "name": "Event Day Backpack",
            "description": "Pet parent backpack with treat compartments, waste bag holder, water bottle pocket, and first aid kit.",
            "price": 2499,
            "compare_price": 3299,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "backpack", "events", "adventure"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-meetup-leash",
            "name": "Quick-Release Meetup Leash",
            "description": "6ft leash with quick-release handle for meetups. Reflective stitching and traffic handle.",
            "price": 899,
            "compare_price": 1199,
            "category": "enjoy",
            "enjoy_type": "social",
            "tags": ["enjoy", "social", "leash", "meetup", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-outdoor-bed",
            "name": "Portable Outdoor Bed",
            "description": "Waterproof, foldable bed for outdoor events. Keeps your pet comfortable anywhere.",
            "price": 1799,
            "compare_price": 2299,
            "category": "enjoy",
            "enjoy_type": "outdoor",
            "tags": ["enjoy", "outdoor", "bed", "portable", "comfort"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 22,
            "is_birthday_perk": False
        },
        {
            "id": "enjoy-social-tag",
            "name": "Social Profile Tag",
            "description": "Smart collar tag with QR code linking to your pet's profile. Great for meetups!",
            "price": 599,
            "compare_price": 799,
            "category": "enjoy",
            "enjoy_type": "social",
            "tags": ["enjoy", "social", "tag", "profile", "tech"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        }
    ]
    
    # Seed experiences
    for exp in default_experiences:
        exp["created_at"] = datetime.now(timezone.utc).isoformat()
        exp["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.enjoy_experiences.update_one(
            {"id": exp["id"]},
            {"$set": exp},
            upsert=True
        )
    
    # Seed products
    for prod in default_products:
        prod["created_at"] = datetime.now(timezone.utc).isoformat()
        prod["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one(
            {"id": prod["id"]},
            {"$set": prod},
            upsert=True
        )
    
    # Default Bundles for Enjoy Pillar
    default_bundles = [
        {
            "id": "enjoy-bundle-adventure",
            "name": "Adventure Day Kit",
            "description": "Everything for outdoor adventures: hiking harness, event backpack, and portable bed.",
            "items": ["enjoy-hiking-harness", "enjoy-event-backpack", "enjoy-outdoor-bed"],
            "price": 5499,
            "original_price": 6197,
            "paw_reward_points": 70,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15,
            "is_active": True
        },
        {
            "id": "enjoy-bundle-social",
            "name": "Social Butterfly Kit",
            "description": "Perfect for meetups and playdates: playdate kit, cafe blanket, and social profile tag.",
            "items": ["enjoy-playdate-kit", "enjoy-cafe-blanket", "enjoy-social-tag"],
            "price": 1999,
            "original_price": 2297,
            "paw_reward_points": 28,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "enjoy-bundle-swimmer",
            "name": "Water Lover's Kit",
            "description": "For dogs who love water: swim vest and quick-dry towel essentials.",
            "items": ["enjoy-swim-vest", "enjoy-meetup-leash"],
            "price": 2299,
            "original_price": 2498,
            "paw_reward_points": 30,
            "is_recommended": False,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "enjoy-bundle-photographer",
            "name": "Photo Op Kit",
            "description": "Capture memories: photo props kit and social profile tag for sharing.",
            "items": ["enjoy-photo-props", "enjoy-social-tag"],
            "price": 899,
            "original_price": 1048,
            "paw_reward_points": 14,
            "is_recommended": False,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20,
            "is_active": True
        },
        {
            "id": "enjoy-bundle-complete",
            "name": "Ultimate Enjoy Bundle",
            "description": "Complete kit for the social dog: everything you need for events, meetups, and adventures.",
            "items": ["enjoy-hiking-harness", "enjoy-playdate-kit", "enjoy-cafe-blanket", "enjoy-photo-props", "enjoy-social-tag"],
            "price": 3999,
            "original_price": 4845,
            "paw_reward_points": 85,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 10,
            "is_active": True
        }
    ]
    
    # Seed bundles
    for bundle in default_bundles:
        bundle["bundle_type"] = "enjoy"
        bundle["created_at"] = datetime.now(timezone.utc).isoformat()
        bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.enjoy_bundles.update_one(
            {"id": bundle["id"]},
            {"$set": bundle},
            upsert=True
        )
    
    logger.info(f"Seeded {len(default_experiences)} experiences, {len(default_products)} products, {len(default_bundles)} bundles")
    
    return {
        "success": True,
        "experiences_seeded": len(default_experiences),
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles)
    }


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_enjoy_settings():
    """Get enjoy pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "enjoy_settings"}, {"_id": 0})
    
    if not settings:
        return {
            "paw_rewards": {"enabled": True, "points_per_rsvp": 10},
            "notifications": {"email_enabled": True, "reminder_hours_before": 24},
            "cities_active": ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad"]
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_enjoy_settings(settings: Dict[str, Any]):
    """Update enjoy settings"""
    db = get_db()
    
    await db.app_settings.update_one(
        {"key": "enjoy_settings"},
        {"$set": {"key": "enjoy_settings", "value": settings, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}


@router.get("/config")
async def get_enjoy_config():
    """Get enjoy pillar configuration for frontend"""
    db = get_db()
    
    experience_count = await db.enjoy_experiences.count_documents({"is_active": True})
    rsvp_count = await db.enjoy_rsvps.count_documents({})
    
    return {
        "experience_types": EXPERIENCE_TYPES,
        "pet_personalities": PET_PERSONALITIES,
        "experience_count": experience_count,
        "rsvp_count": rsvp_count,
        "enabled": True
    }
