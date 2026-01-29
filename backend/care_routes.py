"""
Care Pillar Routes
The pet wellbeing layer — where daily care, preventive care, emotional care, 
and professional care come together in one intelligent flow.

Principles:
- Dog comes first, not the service
- Every request is read through the pet's profile
- Care is continuous, not transactional
- The system remembers, learns, and anticipates
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/care", tags=["care"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Get logger from server
def get_logger():
    from server import logger
    return logger


# Care Types Configuration
CARE_TYPES = {
    "grooming": {
        "name": "Grooming",
        "category": "physical",
        "icon": "✂️",
        "description": "Full groom, bath, nail trim, ear cleaning, deshedding",
        "requires_assessment": True,
        "typical_response_time": "2-4 hours",
        "profile_fields_needed": ["size", "coat_type", "handling_sensitivity", "anxiety_triggers"],
        "subtypes": ["full_groom", "bath_only", "nail_trim", "ear_cleaning", "deshedding", "haircut"]
    },
    "walks": {
        "name": "Walks & Sitting",
        "category": "daily",
        "icon": "🚶",
        "description": "Daily walks, pet sitting, overnight care",
        "requires_assessment": True,
        "typical_response_time": "4-8 hours",
        "profile_fields_needed": ["energy_level", "walk_routine", "leash_behaviour", "reactivity"],
        "subtypes": ["daily_walk", "pet_sitting_day", "pet_sitting_overnight", "group_walk", "solo_walk"]
    },
    "training": {
        "name": "Training & Behaviour",
        "category": "development",
        "icon": "🎓",
        "description": "Obedience, leash training, anxiety, reactivity, puppy training",
        "requires_assessment": True,
        "typical_response_time": "24-48 hours",
        "profile_fields_needed": ["age", "training_history", "behaviour_concerns", "socialization"],
        "subtypes": ["basic_obedience", "leash_training", "separation_anxiety", "reactivity", "puppy_training", "advanced_training"]
    },
    "vet_coordination": {
        "name": "Vet Coordination",
        "category": "health",
        "icon": "🏥",
        "description": "Find vets, upload records, schedule reminders",
        "requires_assessment": False,
        "typical_response_time": "1-2 hours",
        "profile_fields_needed": ["vaccination_status", "health_conditions", "last_vet_visit"],
        "subtypes": ["find_vet", "upload_records", "schedule_reminder", "health_query"]
    },
    "emergency": {
        "name": "Emergency Help",
        "category": "urgent",
        "icon": "🚨",
        "description": "Urgent care routing, emergency guidance",
        "requires_assessment": False,
        "typical_response_time": "immediate",
        "profile_fields_needed": ["health_conditions", "emergency_contact"],
        "subtypes": ["injury", "illness", "behavioral_emergency", "lost_pet"]
    },
    "special_needs": {
        "name": "Special Needs Care",
        "category": "specialized",
        "icon": "💝",
        "description": "Senior care, disability support, chronic conditions",
        "requires_assessment": True,
        "typical_response_time": "24-48 hours",
        "profile_fields_needed": ["health_conditions", "mobility", "special_requirements", "medications"],
        "subtypes": ["senior_care", "disability_support", "chronic_condition", "post_surgery", "palliative"]
    },
    "routine": {
        "name": "Routine Care",
        "category": "daily",
        "icon": "📋",
        "description": "Daily routine help, feeding, medication reminders",
        "requires_assessment": False,
        "typical_response_time": "4-8 hours",
        "profile_fields_needed": ["feeding_schedule", "medications", "daily_routine"],
        "subtypes": ["feeding_help", "medication_reminder", "routine_check", "wellness_check"]
    }
}


# Care Request Models
class CareRequestCreate(BaseModel):
    care_type: str  # grooming, walks, training, etc.
    subtype: Optional[str] = None
    pet_id: Optional[str] = None  # Optional for non-logged-in users
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    # Request details
    description: Optional[str] = None  # Made optional
    notes: Optional[str] = None  # Alias for description
    preferred_date: Optional[str] = None
    date: Optional[str] = None  # Alias for preferred_date
    preferred_time: Optional[str] = None
    time: Optional[str] = None  # Alias for preferred_time
    frequency: Optional[str] = None  # one_time, daily, weekly, monthly
    duration: Optional[str] = None
    location_type: Optional[str] = None  # home, salon, outdoor
    location_address: Optional[str] = None
    city: Optional[str] = None
    # Pet context (auto-filled or user-provided)
    pet_size: Optional[str] = None
    pet_energy_level: Optional[str] = None
    pet_anxiety_level: Optional[str] = None
    handling_notes: Optional[str] = None
    special_requirements: Optional[str] = None
    # User info
    user_email: Optional[str] = None
    contact_email: Optional[str] = None  # Alias
    user_phone: Optional[str] = None
    contact_phone: Optional[str] = None  # Alias
    user_name: Optional[str] = None
    contact_name: Optional[str] = None  # Alias
    # AI/Mira context
    mira_conversation_id: Optional[str] = None
    freeform_query: Optional[str] = None


class CareRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    concierge_notes: Optional[str] = None
    partner_id: Optional[str] = None
    partner_details: Optional[Dict] = None
    quoted_price: Optional[float] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    completion_notes: Optional[str] = None


# Care Product Models
class CareProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    image: Optional[str] = None
    care_type: str  # grooming, walks, training, etc.
    subcategory: Optional[str] = None
    tags: List[str] = []
    pet_sizes: List[str] = []
    in_stock: bool = True
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    paw_reward_points: int = 0
    is_birthday_perk: bool = False
    birthday_discount_percent: Optional[int] = None
    is_member_exclusive: bool = False


class CareBundleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    image: Optional[str] = None
    care_type: str
    items: List[str] = []
    is_recommended: bool = True
    paw_reward_points: int = 0
    is_birthday_perk: bool = False
    birthday_discount_percent: Optional[int] = None


class CarePartnerCreate(BaseModel):
    name: str
    type: str  # groomer, walker, trainer, vet, sitter
    description: Optional[str] = None
    logo: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    cities: List[str] = []
    services: List[str] = []
    specializations: List[str] = []  # anxious_dogs, large_breeds, puppies, etc.
    commission_percent: float = 0
    rating: float = 5.0
    is_verified: bool = False
    is_active: bool = True
    availability: Optional[Dict] = None  # {monday: {start: "09:00", end: "18:00"}, ...}
    home_service: bool = False
    salon_service: bool = False


# ==================== CORE ENDPOINTS ====================

@router.get("/types")
async def get_care_types():
    """Get available care types and their configurations"""
    return {"care_types": CARE_TYPES}


@router.post("/request")
async def create_care_request(request: CareRequestCreate):
    """
    Create a new care request.
    Profile-first approach: reads pet profile, enriches with context.
    """
    db = get_db()
    logger = get_logger()
    
    try:
        # Generate request ID
        request_id = f"CARE-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Get care type config
        care_config = CARE_TYPES.get(request.care_type, CARE_TYPES["grooming"])
        
        # Handle field aliases - use provided or aliased values
        description = request.description or request.notes or f"{care_config['name']} service request"
        preferred_date = request.preferred_date or request.date or ""
        preferred_time = request.preferred_time or request.time or ""
        user_name = request.user_name or request.contact_name or ""
        user_email = request.user_email or request.contact_email or ""
        user_phone = request.user_phone or request.contact_phone or ""
        pet_name = request.pet_name or "Pet"
        pet_breed = request.pet_breed or ""
        
        # Fetch pet profile for context
        pet_profile = None
        profile_enrichment = {}
        missing_fields = []
        
        if request.pet_id:
            pet_doc = await db.pets.find_one({"id": request.pet_id}, {"_id": 0})
            if pet_doc:
                pet_profile = pet_doc
                soul = pet_doc.get("soul", {})
                
                # Check what profile fields we need vs what we have
                for field in care_config.get("profile_fields_needed", []):
                    if soul.get(field):
                        profile_enrichment[field] = soul[field]
                    else:
                        missing_fields.append(field)
        
        # Determine priority based on care type (1=urgent, 2=high, 3=normal, 4=low)
        priority = 3  # default: normal
        if request.care_type == "emergency":
            priority = 1  # urgent
        elif request.care_type in ["special_needs", "vet_coordination"]:
            priority = 2  # high
        
        # Build care context from profile
        care_context = {
            "size": request.pet_size or profile_enrichment.get("size"),
            "energy_level": request.pet_energy_level or profile_enrichment.get("energy_level"),
            "anxiety_level": request.pet_anxiety_level or profile_enrichment.get("anxiety_level"),
            "handling_sensitivity": profile_enrichment.get("handling_sensitivity"),
            "coat_type": profile_enrichment.get("coat_type"),
            "reactivity": profile_enrichment.get("reactivity"),
            "health_conditions": profile_enrichment.get("health_conditions"),
            "special_requirements": request.special_requirements or profile_enrichment.get("special_requirements")
        }
        
        # Build the request document
        request_doc = {
            "request_id": request_id,
            "care_type": request.care_type,
            "care_type_name": care_config["name"],
            "subtype": request.subtype,
            "status": "submitted",
            "priority": priority,
            
            # Pet info
            "pet": {
                "id": request.pet_id or "",
                "name": pet_name,
                "breed": pet_breed,
                "profile_score": pet_profile.get("soul", {}).get("profile_score") if pet_profile else None
            },
            
            # Care context (from profile + request)
            "care_context": care_context,
            
            # Request details
            "details": {
                "description": description,
                "preferred_date": preferred_date,
                "preferred_time": preferred_time,
                "frequency": request.frequency,
                "duration": request.duration,
                "location_type": request.location_type,
                "location_address": request.location_address,
                "city": request.city,
                "handling_notes": request.handling_notes
            },
            
            # Customer info
            "customer": {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            },
            
            # AI context
            "mira_context": {
                "conversation_id": request.mira_conversation_id
            },
            
            # Profile gaps identified
            "profile_gaps": missing_fields,
            
            # Tracking
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "typical_response_time": care_config["typical_response_time"],
            
            # Will be filled by concierge
            "assigned_to": None,
            "concierge_notes": None,
            "partner_id": None,
            "partner_details": None,
            "quoted_price": None,
            "scheduled_date": None,
            "scheduled_time": None,
            "completion_notes": None
        }
        
        # Insert the request
        await db.care_requests.insert_one(request_doc)
        
        # Create Service Desk ticket
        ticket_id = request_id
        notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
        
        ticket_doc = {
            "ticket_id": ticket_id,
            "notification_id": notification_id,
            "inbox_id": inbox_id,
            "source": "care_pillar",
            "pillar": "care",
            "category": request.care_type,
            "status": "new",
            "priority": priority,
            "urgency": "high" if priority <= 2 else "medium",
            "subject": f"Care Request: {care_config['name']} - {pet_name}",
            "description": f"{user_name or 'Customer'} needs {care_config['name'].lower()} for {pet_name} ({pet_breed or 'pet'}). {description}",
            "member": {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            },
            "pet_context": {
                "pet_id": request.pet_id or "",
                "pet_name": pet_name,
                "pet_breed": pet_breed,
                "care_context": care_context
            },
            "metadata": {
                "care_request_id": request_id,
                "care_type": request.care_type,
                "subtype": request.subtype,
                "priority": priority,
                "profile_gaps": missing_fields
            },
            "tags": ["care", request.care_type, "unified-flow"],
            "messages": [{
                "id": str(uuid.uuid4()),
                "sender": "system",
                "channel": "web",
                "message": f"Care request created for {care_config['name']}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "timeline": [{
                "action": "created",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": f"Care request submitted via Care Pillar - {care_config['name']}"
            }]
        }
        # Insert into BOTH collections for unified flow
        await db.service_desk_tickets.insert_one(ticket_doc)
        await db.tickets.insert_one(ticket_doc)
        
        # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
        await db.admin_notifications.insert_one({
            "id": notification_id,
            "type": f"care_{request.care_type}",
            "pillar": "care",
            "title": f"New {care_config['name']} Request - {pet_name}",
            "message": f"{user_name or 'Customer'} needs {care_config['name'].lower()} for {pet_name}",
            "read": False,  # Use 'read' field for consistency with API
            "status": "unread",
            "urgency": "high" if priority <= 2 else "medium",
            "ticket_id": ticket_id,
            "inbox_id": inbox_id,
            "care_type": request.care_type,
            "customer": {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            },
            "pet": {
                "name": pet_name,
                "breed": pet_breed
            },
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read_at": None
        })
        logger.info(f"[UNIFIED FLOW] Care request notification created: {notification_id}")
        
        # ==================== STEP 2: Unified Inbox entry (MANDATORY) ====================
        inbox_entry = {
            "id": inbox_id,
            "request_id": request_id,
            "ticket_id": ticket_id,
            "notification_id": notification_id,
            "channel": "web",
            "request_type": "care",
            "pillar": "care",
            "category": request.care_type,
            "status": "new",
            "urgency": "high" if priority <= 2 else "medium",
            "customer_name": user_name,
            "customer_email": user_email,
            "customer_phone": user_phone,
            "member": {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            },
            "pet": {
                "name": pet_name,
                "breed": pet_breed
            },
            "preview": f"Care Request: {care_config['name']} - {description[:100] if description else 'No description'}...",
            "message": f"Care Request: {care_config['name']} - {description[:100] if description else 'No description'}...",
            "full_content": description,
            "metadata": {
                "care_request_id": request_id,
                "care_type": request.care_type,
                "priority": priority
            },
            "tags": ["care", request.care_type],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "unified_flow_processed": True
        }
        await db.channel_intakes.insert_one(inbox_entry)
        logger.info(f"[UNIFIED FLOW] Care request inbox entry created: {inbox_id}")
        
        logger.info(f"[UNIFIED FLOW] COMPLETE: Care request {request_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
        
        # Progressive profiling: Update pet profile with new info
        if request.pet_id:
            profile_updates = {}
            if request.pet_size and not profile_enrichment.get("size"):
                profile_updates["soul.size"] = request.pet_size
            if request.pet_energy_level and not profile_enrichment.get("energy_level"):
                profile_updates["soul.energy_level"] = request.pet_energy_level
            if request.pet_anxiety_level and not profile_enrichment.get("anxiety_level"):
                profile_updates["soul.anxiety_level"] = request.pet_anxiety_level
            if request.handling_notes:
                profile_updates["soul.handling_notes"] = request.handling_notes
            
            # Track care history
            profile_updates[f"soul.care_history.{request.care_type}"] = {
                "last_request": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id
            }
            
            if profile_updates:
                profile_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.pets.update_one(
                    {"id": request.pet_id},
                    {"$set": profile_updates}
                )
                logger.info(f"Updated pet profile {request.pet_id} with care context")
        
        logger.info(f"Care request created: {request_id} - {care_config['name']}")
        
        return {
            "success": True,
            "request_id": request_id,
            "ticket_id": ticket_id,
            "notification_id": notification_id,
            "inbox_id": inbox_id,
            "status": "submitted",
            "priority": priority,
            "message": f"Your care request has been submitted. Our concierge will review and contact you within {care_config['typical_response_time']}.",
            "typical_response_time": care_config["typical_response_time"],
            "profile_gaps": missing_fields if missing_fields else None
        }
        
    except Exception as e:
        logger.error(f"Error creating care request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requests")
async def get_care_requests(
    status: Optional[str] = None,
    care_type: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get care requests (for admin/concierge)"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if care_type:
        query["care_type"] = care_type
    if priority:
        query["priority"] = priority
    
    requests = await db.care_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.care_requests.count_documents(query)
    
    return {
        "requests": requests,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/request/{request_id}")
async def get_care_request(request_id: str):
    """Get a specific care request"""
    db = get_db()
    
    request = await db.care_requests.find_one(
        {"request_id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Care request not found")
    
    return request


@router.patch("/request/{request_id}")
async def update_care_request(request_id: str, update: CareRequestUpdate):
    """Update a care request (concierge action)"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.status:
        update_doc["status"] = update.status
    if update.assigned_to:
        update_doc["assigned_to"] = update.assigned_to
    if update.concierge_notes:
        update_doc["concierge_notes"] = update.concierge_notes
    if update.partner_id:
        update_doc["partner_id"] = update.partner_id
    if update.partner_details:
        update_doc["partner_details"] = update.partner_details
    if update.quoted_price:
        update_doc["quoted_price"] = update.quoted_price
    if update.scheduled_date:
        update_doc["scheduled_date"] = update.scheduled_date
    if update.scheduled_time:
        update_doc["scheduled_time"] = update.scheduled_time
    if update.completion_notes:
        update_doc["completion_notes"] = update.completion_notes
    
    result = await db.care_requests.update_one(
        {"request_id": request_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Care request not found")
    
    # Update corresponding ticket
    if update.status:
        ticket_status_map = {
            "submitted": "new",
            "acknowledged": "in_progress",
            "reviewing": "in_progress",
            "matched": "in_progress",
            "scheduled": "in_progress",
            "in_progress": "in_progress",
            "completed": "resolved",
            "cancelled": "closed"
        }
        await db.tickets.update_one(
            {"ticket_id": request_id},
            {"$set": {
                "status": ticket_status_map.get(update.status, "in_progress"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"Care request {request_id} updated")
    
    return {"success": True, "message": "Request updated"}


@router.get("/my-requests")
async def get_my_care_requests(user_email: str, limit: int = 20):
    """Get care requests for a specific user"""
    db = get_db()
    
    requests = await db.care_requests.find(
        {"customer.email": user_email},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"requests": requests, "count": len(requests)}


@router.get("/stats")
async def get_care_stats():
    """Get care statistics for admin dashboard"""
    db = get_db()
    
    # Count by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.care_requests.aggregate(pipeline).to_list(100)
    
    # Count by type
    pipeline = [
        {"$group": {"_id": "$care_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.care_requests.aggregate(pipeline).to_list(100)
    
    # Count by priority
    pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    priority_counts = await db.care_requests.aggregate(pipeline).to_list(100)
    
    # Recent requests
    recent = await db.care_requests.find(
        {},
        {"_id": 0, "request_id": 1, "care_type_name": 1, "pet.name": 1, "status": 1, "priority": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "by_status": {item["_id"]: item["count"] for item in status_counts if item["_id"]},
        "by_type": {item["_id"]: item["count"] for item in type_counts if item["_id"]},
        "by_priority": {item["_id"]: item["count"] for item in priority_counts if item["_id"]},
        "recent_requests": recent,
        "total": sum(item["count"] for item in status_counts if item["_id"])
    }


# ==================== PRODUCTS ENDPOINTS ====================

@router.get("/products")
async def get_care_products(care_type: Optional[str] = None, limit: int = 50):
    """Get care-related products"""
    db = get_db()
    
    query = {"$or": [
        {"category": "care"},
        {"care_type": {"$exists": True}},
        {"tags": {"$in": ["care", "grooming", "training", "walking", "wellness", "health"]}}
    ]}
    
    if care_type:
        query = {"$and": [query, {"$or": [{"care_type": care_type}, {"tags": care_type}]}]}
    
    products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return {"products": products, "total": len(products)}


@router.post("/admin/products")
async def create_care_product(product: CareProductCreate):
    """Create a new care product"""
    db = get_db()
    logger = get_logger()
    
    product_id = f"care-{uuid.uuid4().hex[:8]}"
    
    product_doc = {
        "id": product_id,
        **product.dict(),
        "category": "care",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    logger.info(f"Care product created: {product_id}")
    
    return {"success": True, "product_id": product_id, "product": {k: v for k, v in product_doc.items() if k != "_id"}}


@router.put("/admin/products/{product_id}")
async def update_care_product(product_id: str, product: CareProductCreate):
    """Update a care product"""
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
    
    logger.info(f"Care product updated: {product_id}")
    return {"success": True, "message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_care_product(product_id: str):
    """Delete a care product"""
    db = get_db()
    logger = get_logger()
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logger.info(f"Care product deleted: {product_id}")
    return {"success": True, "message": "Product deleted"}


@router.get("/admin/products/export")
async def export_care_products():
    """Export all care products as CSV-ready data"""
    db = get_db()
    
    products = await db.products.find(
        {"$or": [{"category": "care"}, {"care_type": {"$exists": True}}]},
        {"_id": 0}
    ).to_list(500)
    
    export_data = []
    for p in products:
        export_data.append({
            "id": p.get("id", ""),
            "name": p.get("name", ""),
            "description": p.get("description", ""),
            "price": p.get("price", 0),
            "compare_price": p.get("compare_price", ""),
            "image": p.get("image", ""),
            "care_type": p.get("care_type", ""),
            "subcategory": p.get("subcategory", ""),
            "tags": ",".join(p.get("tags", [])) if isinstance(p.get("tags"), list) else p.get("tags", ""),
            "pet_sizes": ",".join(p.get("pet_sizes", [])) if isinstance(p.get("pet_sizes"), list) else p.get("pet_sizes", ""),
            "in_stock": str(p.get("in_stock", True)).lower(),
            "paw_reward_points": p.get("paw_reward_points", 0),
            "is_birthday_perk": str(p.get("is_birthday_perk", False)).lower(),
            "is_member_exclusive": str(p.get("is_member_exclusive", False)).lower()
        })
    
    return {"products": export_data, "total": len(export_data)}


@router.post("/admin/products/import")
async def import_care_products(products: List[Dict[str, Any]]):
    """Import multiple care products from CSV data"""
    db = get_db()
    logger = get_logger()
    
    imported = 0
    errors = []
    
    for idx, prod in enumerate(products):
        try:
            product_id = prod.get("id") or f"care-{uuid.uuid4().hex[:8]}"
            
            product_doc = {
                "id": product_id,
                "name": prod.get("name", ""),
                "description": prod.get("description", ""),
                "price": float(prod.get("price", 0)),
                "compare_price": float(prod.get("compare_price", 0)) if prod.get("compare_price") else None,
                "image": prod.get("image", ""),
                "category": "care",
                "care_type": prod.get("care_type", ""),
                "subcategory": prod.get("subcategory", ""),
                "tags": prod.get("tags", "").split(",") if isinstance(prod.get("tags"), str) else prod.get("tags", []),
                "pet_sizes": prod.get("pet_sizes", "").split(",") if isinstance(prod.get("pet_sizes"), str) else prod.get("pet_sizes", []),
                "in_stock": prod.get("in_stock", "true").lower() != "false" if isinstance(prod.get("in_stock"), str) else bool(prod.get("in_stock", True)),
                "paw_reward_points": int(prod.get("paw_reward_points", 0)),
                "is_birthday_perk": prod.get("is_birthday_perk", "false").lower() == "true" if isinstance(prod.get("is_birthday_perk"), str) else bool(prod.get("is_birthday_perk", False)),
                "is_member_exclusive": prod.get("is_member_exclusive", "false").lower() == "true" if isinstance(prod.get("is_member_exclusive"), str) else bool(prod.get("is_member_exclusive", False)),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.products.update_one(
                {"id": product_id},
                {"$set": product_doc},
                upsert=True
            )
            imported += 1
            
        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})
    
    logger.info(f"Imported {imported} care products")
    return {"success": True, "imported": imported, "errors": errors}


# ==================== BUNDLES ENDPOINTS ====================

@router.get("/bundles")
async def get_care_bundles(care_type: Optional[str] = None):
    """Get care bundles"""
    db = get_db()
    
    query = {"bundle_type": "care"}
    if care_type:
        query["care_type"] = care_type
    
    bundles = await db.product_bundles.find(query, {"_id": 0}).to_list(50)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_care_bundle(bundle: CareBundleCreate):
    """Create a new care bundle"""
    db = get_db()
    logger = get_logger()
    
    bundle_id = f"care-bundle-{uuid.uuid4().hex[:8]}"
    
    bundle_doc = {
        "id": bundle_id,
        "bundle_type": "care",
        **bundle.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.product_bundles.insert_one(bundle_doc)
    logger.info(f"Care bundle created: {bundle_id}")
    
    return {"success": True, "bundle_id": bundle_id, "bundle": {k: v for k, v in bundle_doc.items() if k != "_id"}}


@router.put("/admin/bundles/{bundle_id}")
async def update_care_bundle(bundle_id: str, bundle: CareBundleCreate):
    """Update a care bundle"""
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
    
    logger.info(f"Care bundle updated: {bundle_id}")
    return {"success": True, "message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_care_bundle(bundle_id: str):
    """Delete a care bundle"""
    db = get_db()
    logger = get_logger()
    
    result = await db.product_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    logger.info(f"Care bundle deleted: {bundle_id}")
    return {"success": True, "message": "Bundle deleted"}


@router.get("/admin/bundles/export")
async def export_care_bundles():
    """Export all care bundles as CSV-ready data"""
    db = get_db()
    
    bundles = await db.product_bundles.find(
        {"bundle_type": "care"},
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
            "care_type": b.get("care_type", ""),
            "items": ",".join(b.get("items", [])) if isinstance(b.get("items"), list) else b.get("items", ""),
            "is_recommended": str(b.get("is_recommended", True)).lower(),
            "paw_reward_points": b.get("paw_reward_points", 0)
        })
    
    return {"bundles": export_data, "total": len(export_data)}


@router.post("/admin/bundles/import")
async def import_care_bundles(bundles: List[Dict[str, Any]]):
    """Import multiple care bundles from CSV data"""
    db = get_db()
    logger = get_logger()
    
    imported = 0
    errors = []
    
    for idx, bnd in enumerate(bundles):
        try:
            bundle_id = bnd.get("id") or f"care-bundle-{uuid.uuid4().hex[:8]}"
            
            bundle_doc = {
                "id": bundle_id,
                "bundle_type": "care",
                "name": bnd.get("name", ""),
                "description": bnd.get("description", ""),
                "price": float(bnd.get("price", 0)),
                "original_price": float(bnd.get("original_price", 0)) if bnd.get("original_price") else None,
                "image": bnd.get("image", ""),
                "care_type": bnd.get("care_type", "grooming"),
                "items": bnd.get("items", "").split(",") if isinstance(bnd.get("items"), str) else bnd.get("items", []),
                "is_recommended": bnd.get("is_recommended", "true").lower() != "false" if isinstance(bnd.get("is_recommended"), str) else bool(bnd.get("is_recommended", True)),
                "paw_reward_points": int(bnd.get("paw_reward_points", 0)),
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
    
    logger.info(f"Imported {imported} care bundles")
    return {"success": True, "imported": imported, "errors": errors}


# ==================== PARTNERS ENDPOINTS ====================

@router.get("/admin/partners")
async def get_care_partners(
    partner_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    city: Optional[str] = None
):
    """Get all care partners"""
    db = get_db()
    
    query = {}
    if partner_type:
        query["type"] = partner_type
    if is_active is not None:
        query["is_active"] = is_active
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.care_partners.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
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
async def create_care_partner(partner: CarePartnerCreate):
    """Create a new care partner"""
    db = get_db()
    logger = get_logger()
    
    partner_id = f"care-partner-{uuid.uuid4().hex[:8]}"
    
    partner_doc = {
        "id": partner_id,
        **partner.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.care_partners.insert_one(partner_doc)
    logger.info(f"Care partner created: {partner_id} - {partner.name}")
    
    return {"success": True, "partner_id": partner_id, "partner": {k: v for k, v in partner_doc.items() if k != "_id"}}


@router.put("/admin/partners/{partner_id}")
async def update_care_partner(partner_id: str, partner: CarePartnerCreate):
    """Update a care partner"""
    db = get_db()
    logger = get_logger()
    
    update_doc = {
        **partner.dict(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.care_partners.update_one(
        {"id": partner_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    logger.info(f"Care partner updated: {partner_id}")
    return {"success": True, "message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_care_partner(partner_id: str):
    """Delete a care partner"""
    db = get_db()
    logger = get_logger()
    
    result = await db.care_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    logger.info(f"Care partner deleted: {partner_id}")
    return {"success": True, "message": "Partner deleted"}


@router.get("/partners/by-type/{partner_type}")
async def get_partners_by_type(partner_type: str, city: Optional[str] = None):
    """Get active partners by type (for frontend matching)"""
    db = get_db()
    
    query = {"type": partner_type, "is_active": True}
    if city:
        query["cities"] = {"$in": [city]}
    
    partners = await db.care_partners.find(
        query,
        {"_id": 0, "id": 1, "name": 1, "rating": 1, "cities": 1, "is_verified": 1, "specializations": 1, "home_service": 1}
    ).sort("rating", -1).to_list(50)
    
    return {"partners": partners, "total": len(partners)}


# ==================== SEED DEFAULTS ====================

@router.post("/admin/seed-products")
async def seed_care_products():
    """Seed default care products and bundles"""
    db = get_db()
    logger = get_logger()
    
    default_products = [
        # Grooming Products
        {
            "id": "care-grooming-brush",
            "name": "Premium Deshedding Brush",
            "description": "Professional-grade brush that removes loose fur and reduces shedding by up to 90%.",
            "price": 899,
            "compare_price": 1299,
            "image": "",
            "category": "care",
            "care_type": "grooming",
            "subcategory": "brush",
            "tags": ["grooming", "deshedding", "brush", "coat care"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 9,
            "is_birthday_perk": False
        },
        {
            "id": "care-nail-clipper",
            "name": "Safety Nail Clipper Set",
            "description": "Professional nail clippers with safety guard. Includes nail file.",
            "price": 499,
            "compare_price": 699,
            "image": "",
            "category": "care",
            "care_type": "grooming",
            "subcategory": "nail_care",
            "tags": ["grooming", "nail", "clipper", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "care-shampoo-sensitive",
            "name": "Gentle Oatmeal Shampoo",
            "description": "Hypoallergenic shampoo for sensitive skin. Soothes itching and moisturizes.",
            "price": 449,
            "compare_price": 599,
            "image": "",
            "category": "care",
            "care_type": "grooming",
            "subcategory": "shampoo",
            "tags": ["grooming", "shampoo", "sensitive", "oatmeal"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "care-ear-cleaner",
            "name": "Ear Cleaning Solution",
            "description": "Gentle ear cleaner that prevents infections. Vet-recommended formula.",
            "price": 349,
            "compare_price": 449,
            "image": "",
            "category": "care",
            "care_type": "grooming",
            "subcategory": "ear_care",
            "tags": ["grooming", "ear", "cleaner", "health"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": False
        },
        # Walking Products
        {
            "id": "care-leash-reflective",
            "name": "Reflective Safety Leash",
            "description": "High-visibility leash with reflective stitching for safe night walks.",
            "price": 599,
            "compare_price": 799,
            "image": "",
            "category": "care",
            "care_type": "walks",
            "subcategory": "leash",
            "tags": ["walks", "leash", "safety", "reflective"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "care-harness-nopu",
            "name": "No-Pull Comfort Harness",
            "description": "Ergonomic harness that discourages pulling. Padded for comfort.",
            "price": 1299,
            "compare_price": 1699,
            "image": "",
            "category": "care",
            "care_type": "walks",
            "subcategory": "harness",
            "tags": ["walks", "harness", "no-pull", "training"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 13,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "care-poop-bags",
            "name": "Biodegradable Poop Bags (120 count)",
            "description": "Eco-friendly waste bags. Extra thick and leak-proof.",
            "price": 299,
            "compare_price": 399,
            "image": "",
            "category": "care",
            "care_type": "walks",
            "subcategory": "accessories",
            "tags": ["walks", "poop bags", "eco-friendly", "biodegradable"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 3,
            "is_birthday_perk": False
        },
        # Training Products
        {
            "id": "care-training-treats",
            "name": "Training Treat Pouch with Treats",
            "description": "Convenient treat pouch with 200g of bite-sized training treats.",
            "price": 549,
            "compare_price": 699,
            "image": "",
            "category": "care",
            "care_type": "training",
            "subcategory": "treats",
            "tags": ["training", "treats", "pouch", "rewards"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "care-clicker",
            "name": "Professional Training Clicker",
            "description": "Consistent click sound for positive reinforcement training.",
            "price": 199,
            "compare_price": 299,
            "image": "",
            "category": "care",
            "care_type": "training",
            "subcategory": "tools",
            "tags": ["training", "clicker", "positive reinforcement"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 2,
            "is_birthday_perk": False
        },
        # Wellness Products
        {
            "id": "care-calming-spray",
            "name": "Calming Pheromone Spray",
            "description": "Reduces anxiety and stress. Perfect for grooming, vet visits, or travel.",
            "price": 699,
            "compare_price": 899,
            "image": "",
            "category": "care",
            "care_type": "wellness",
            "subcategory": "calming",
            "tags": ["wellness", "calming", "anxiety", "pheromone"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "care-dental-kit",
            "name": "Complete Dental Care Kit",
            "description": "Toothbrush, finger brush, and enzymatic toothpaste for fresh breath.",
            "price": 599,
            "compare_price": 799,
            "image": "",
            "category": "care",
            "care_type": "wellness",
            "subcategory": "dental",
            "tags": ["wellness", "dental", "toothbrush", "oral care"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "care-first-aid",
            "name": "Pet First Aid Kit",
            "description": "Complete emergency kit: bandages, antiseptic, tweezers, and guide.",
            "price": 999,
            "compare_price": 1299,
            "image": "",
            "category": "care",
            "care_type": "wellness",
            "subcategory": "emergency",
            "tags": ["wellness", "first-aid", "emergency", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        }
    ]
    
    default_bundles = [
        {
            "id": "care-bundle-grooming",
            "bundle_type": "care",
            "name": "Complete Grooming Kit",
            "description": "Everything you need for home grooming: brush, nail clipper, shampoo, and ear cleaner.",
            "price": 1799,
            "original_price": 2196,
            "image": "",
            "care_type": "grooming",
            "items": ["care-grooming-brush", "care-nail-clipper", "care-shampoo-sensitive", "care-ear-cleaner"],
            "is_recommended": True,
            "paw_reward_points": 20,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "care-bundle-walking",
            "bundle_type": "care",
            "name": "Daily Walks Essentials",
            "description": "Safe walks kit: reflective leash, no-pull harness, and poop bags.",
            "price": 1899,
            "original_price": 2197,
            "image": "",
            "care_type": "walks",
            "items": ["care-leash-reflective", "care-harness-nopu", "care-poop-bags"],
            "is_recommended": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "care-bundle-training",
            "bundle_type": "care",
            "name": "Training Starter Pack",
            "description": "Begin training right: treat pouch with treats and professional clicker.",
            "price": 649,
            "original_price": 748,
            "image": "",
            "care_type": "training",
            "items": ["care-training-treats", "care-clicker"],
            "is_recommended": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        },
        {
            "id": "care-bundle-wellness",
            "bundle_type": "care",
            "name": "Wellness & Health Pack",
            "description": "Complete wellness: calming spray, dental kit, and first aid essentials.",
            "price": 1899,
            "original_price": 2297,
            "image": "",
            "care_type": "wellness",
            "items": ["care-calming-spray", "care-dental-kit", "care-first-aid"],
            "is_recommended": True,
            "paw_reward_points": 25,
            "is_birthday_perk": True,
            "birthday_discount_percent": 10
        },
        {
            "id": "care-bundle-new-pawrent",
            "bundle_type": "care",
            "name": "New Pawrent Starter Kit",
            "description": "Everything a new pet parent needs: grooming brush, leash, training treats, and first aid.",
            "price": 2199,
            "original_price": 2746,
            "image": "",
            "care_type": "general",
            "items": ["care-grooming-brush", "care-leash-reflective", "care-training-treats", "care-first-aid"],
            "is_recommended": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
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
    
    logger.info(f"Seeded {len(default_products)} care products and {len(default_bundles)} bundles")
    
    return {
        "success": True,
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles),
        "message": "Care products and bundles seeded successfully"
    }


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_care_settings():
    """Get care pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "care_settings"}, {"_id": 0})
    
    if not settings:
        return {
            "paw_rewards": {
                "enabled": True,
                "points_per_request": 25,
                "points_per_completed_service": 50,
                "points_per_product_purchase": 10
            },
            "birthday_perks": {
                "enabled": True,
                "discount_percent": 20,
                "free_grooming": False
            },
            "notifications": {
                "email_enabled": True,
                "whatsapp_enabled": True,
                "sms_enabled": False,
                "reminder_hours_before": 24
            },
            "service_types": {
                "grooming": {"enabled": True, "home_service": True, "salon_service": True},
                "walks": {"enabled": True, "home_service": True},
                "training": {"enabled": True, "home_service": True, "center_service": True},
                "vet_coordination": {"enabled": True},
                "emergency": {"enabled": True},
                "special_needs": {"enabled": True}
            }
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_care_settings(settings: Dict[str, Any]):
    """Update care pillar settings"""
    db = get_db()
    logger = get_logger()
    
    await db.app_settings.update_one(
        {"key": "care_settings"},
        {"$set": {
            "key": "care_settings",
            "value": settings,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    logger.info("Care settings updated")
    return {"success": True, "message": "Settings updated"}


@router.get("/config")
async def get_care_config():
    """Get care pillar configuration for frontend"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "care_settings"}, {"_id": 0})
    product_count = await db.products.count_documents({"$or": [{"category": "care"}, {"care_type": {"$exists": True}}]})
    bundle_count = await db.product_bundles.count_documents({"bundle_type": "care"})
    partner_count = await db.care_partners.count_documents({"is_active": True})
    
    return {
        "care_types": CARE_TYPES,
        "settings": settings.get("value", {}) if settings else {},
        "product_count": product_count,
        "bundle_count": bundle_count,
        "partner_count": partner_count,
        "enabled": True
    }
