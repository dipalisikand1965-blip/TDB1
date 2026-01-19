"""
Travel Pillar Routes
Handles all travel-related requests: cab, train, flight, relocation
Every request goes through concierge assessment - never instant confirm
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/travel", tags=["travel"])

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
    pet_id: str
    pet_name: str
    pet_breed: Optional[str] = None
    pickup_location: str
    pickup_city: str
    drop_location: str
    drop_city: str
    travel_date: str
    travel_time: Optional[str] = None
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
    # User info
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_name: Optional[str] = None
    freeform_query: Optional[str] = None


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
        # Generate request ID
        request_id = f"TRV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Get travel type config
        travel_config = TRAVEL_TYPES.get(request.travel_type, TRAVEL_TYPES["cab"])
        
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
                "id": request.pet_id,
                "name": request.pet_name,
                "breed": request.pet_breed,
                "size": request.pet_size,
                "weight": request.pet_weight,
                "crate_trained": request.crate_trained,
                "travel_anxiety": request.travel_anxiety,
                "motion_sickness": request.motion_sickness
            },
            
            # Journey details
            "journey": {
                "pickup_location": request.pickup_location,
                "pickup_city": request.pickup_city,
                "drop_location": request.drop_location,
                "drop_city": request.drop_city,
                "travel_date": request.travel_date,
                "travel_time": request.travel_time,
                "return_date": request.return_date,
                "is_round_trip": request.is_round_trip
            },
            
            # Customer info
            "customer": {
                "name": request.user_name,
                "email": request.user_email,
                "phone": request.user_phone
            },
            
            # Additional info
            "special_requirements": request.special_requirements,
            "additional_notes": request.additional_notes,
            "freeform_query": request.freeform_query,
            
            # Tracking
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
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
            "priority": "high" if travel_config["risk_level"] == "high" else "normal",
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
            "metadata": {
                "travel_request_id": request_id,
                "travel_type": request.travel_type,
                "risk_level": travel_config["risk_level"],
                "risk_factors": risk_factors
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "timeline": [{
                "action": "created",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": "Travel request submitted via Travel Pillar"
            }]
        }
        await db.tickets.insert_one(ticket_doc)
        
        # Create Unified Inbox entry
        inbox_entry = {
            "request_id": request_id,
            "channel": "web",
            "request_type": "travel",
            "pillar": "travel",
            "status": "pending",
            "customer_name": request.user_name,
            "customer_email": request.user_email,
            "customer_phone": request.user_phone,
            "pet_info": {
                "name": request.pet_name,
                "breed": request.pet_breed
            },
            "message": f"Travel Request: {travel_config['name']} from {request.pickup_city} to {request.drop_city}",
            "metadata": {
                "travel_request_id": request_id,
                "travel_type": request.travel_type,
                "travel_date": request.travel_date,
                "risk_level": travel_config["risk_level"]
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.channel_intakes.insert_one(inbox_entry)
        
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
async def get_travel_products(limit: int = 12):
    """Get travel-related products (kits, crates, harnesses, etc.)"""
    db = get_db()
    
    products = await db.products.find(
        {"$or": [
            {"category": {"$regex": "travel", "$options": "i"}},
            {"tags": {"$in": ["travel", "crate", "harness", "carrier", "calming"]}},
            {"name": {"$regex": "travel|crate|carrier|harness|calm", "$options": "i"}}
        ]},
        {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1, "category": 1}
    ).limit(limit).to_list(limit)
    
    return {"products": products}
