"""
Adopt Pillar Routes
Pet adoption services - connecting loving homes with pets in need.

Features:
- Browse adoptable pets from partner rescues/shelters
- Adoption application and matching
- Foster program management
- Adoption events calendar
- Post-adoption support
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/adopt", tags=["adopt"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db


# Adopt Categories Configuration
ADOPT_CATEGORIES = {
    "rescue": {
        "name": "Rescue Adoption",
        "icon": "🏠",
        "description": "Adopt from verified rescue organizations",
        "color": "from-purple-500 to-pink-500"
    },
    "shelter": {
        "name": "Shelter Adoption",
        "icon": "🏛️",
        "description": "Adopt from local animal shelters",
        "color": "from-blue-500 to-cyan-500"
    },
    "foster": {
        "name": "Foster Program",
        "icon": "💝",
        "description": "Temporarily foster a pet in need",
        "color": "from-amber-500 to-orange-500"
    },
    "rehoming": {
        "name": "Pet Rehoming",
        "icon": "🔄",
        "description": "Help pets find new loving homes",
        "color": "from-green-500 to-emerald-500"
    },
    "events": {
        "name": "Adoption Events",
        "icon": "📅",
        "description": "Meet adoptable pets at local events",
        "color": "from-red-500 to-rose-500"
    }
}

# Pet Status Options
PET_STATUSES = ["available", "pending", "adopted", "fostered", "on_hold"]


# Pydantic Models
class AdoptablePet(BaseModel):
    name: str
    species: str = "dog"
    breed: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    photos: Optional[List[str]] = []
    health_status: Optional[str] = None
    temperament: Optional[List[str]] = []
    good_with: Optional[Dict[str, bool]] = {}
    special_needs: Optional[str] = None
    shelter_id: Optional[str] = None
    shelter_name: Optional[str] = None
    location: Optional[str] = None
    adoption_fee: Optional[float] = 0
    status: str = "available"


class AdoptionApplication(BaseModel):
    pet_id: str
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    home_type: Optional[str] = None
    has_yard: Optional[bool] = None
    other_pets: Optional[str] = None
    children_ages: Optional[str] = None
    experience: Optional[str] = None
    reason: Optional[str] = None
    availability: Optional[str] = None
    references: Optional[List[Dict]] = []
    notes: Optional[str] = None


class FosterApplication(BaseModel):
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    home_type: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = None
    foster_duration: Optional[str] = None
    pet_preferences: Optional[Dict] = {}
    notes: Optional[str] = None


class AdoptionEvent(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: Optional[str] = None
    location: str
    address: Optional[str] = None
    organizer: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    max_attendees: Optional[int] = None
    image_url: Optional[str] = None


# ============== ADOPTABLE PETS ROUTES ==============

@router.get("/pets")
async def list_adoptable_pets(
    species: Optional[str] = None,
    breed: Optional[str] = None,
    age: Optional[str] = None,
    size: Optional[str] = None,
    gender: Optional[str] = None,
    status: str = "available",
    shelter_id: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0
):
    """List adoptable pets with filters"""
    db = get_db()
    
    query = {"status": status}
    
    if species:
        query["species"] = species.lower()
    if breed:
        query["breed"] = {"$regex": breed, "$options": "i"}
    if age:
        query["age"] = age
    if size:
        query["size"] = size.lower()
    if gender:
        query["gender"] = gender.lower()
    if shelter_id:
        query["shelter_id"] = shelter_id
    
    cursor = db.adoptable_pets.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    pets = await cursor.to_list(length=limit)
    
    total = await db.adoptable_pets.count_documents(query)
    
    return {
        "pets": pets,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/pets/{pet_id}")
async def get_adoptable_pet(pet_id: str):
    """Get single adoptable pet details"""
    db = get_db()
    
    pet = await db.adoptable_pets.find_one({"pet_id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"pet": pet}


@router.post("/pets")
async def add_adoptable_pet(pet: AdoptablePet):
    """Add a new adoptable pet (admin/shelter use)"""
    db = get_db()
    
    pet_id = f"adopt-{uuid.uuid4().hex[:8]}"
    pet_doc = {
        "pet_id": pet_id,
        **pet.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "views": 0,
        "inquiries": 0
    }
    
    await db.adoptable_pets.insert_one(pet_doc)
    logger.info(f"Added adoptable pet: {pet_id} - {pet.name}")
    
    return {"success": True, "pet_id": pet_id, "message": f"{pet.name} added to adoptable pets"}


@router.put("/pets/{pet_id}")
async def update_adoptable_pet(pet_id: str, updates: Dict[str, Any]):
    """Update adoptable pet details"""
    db = get_db()
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates.pop("_id", None)
    updates.pop("pet_id", None)
    
    result = await db.adoptable_pets.update_one(
        {"pet_id": pet_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"success": True, "message": "Pet updated"}


@router.delete("/pets/{pet_id}")
async def delete_adoptable_pet(pet_id: str):
    """Remove adoptable pet listing"""
    db = get_db()
    
    result = await db.adoptable_pets.delete_one({"pet_id": pet_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"success": True, "message": "Pet removed from listings"}


# ============== ADOPTION APPLICATIONS ==============

@router.post("/applications")
async def submit_adoption_application(application: AdoptionApplication):
    """Submit adoption application for a pet"""
    db = get_db()
    
    # Verify pet exists and is available
    pet = await db.adoptable_pets.find_one({"pet_id": application.pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet.get("status") != "available":
        raise HTTPException(status_code=400, detail="This pet is no longer available for adoption")
    
    application_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    app_doc = {
        "application_id": application_id,
        **application.dict(),
        "pet_name": pet.get("name"),
        "shelter_id": pet.get("shelter_id"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "timeline": [{
            "status": "submitted",
            "at": datetime.now(timezone.utc).isoformat()
        }]
    }
    
    await db.adoption_applications.insert_one(app_doc)
    
    # Update pet inquiry count
    await db.adoptable_pets.update_one(
        {"pet_id": application.pet_id},
        {"$inc": {"inquiries": 1}}
    )
    
    # Create ticket for command center
    try:
        from ticket_auto_creation import create_auto_ticket
        await create_auto_ticket(
            event_type="adoption_application",
            pillar="adopt",
            urgency="high",
            subject=f"New Adoption Application for {pet.get('name')}",
            description=f"Application from {application.applicant_name} ({application.applicant_email}) to adopt {pet.get('name')}",
            member={
                "name": application.applicant_name,
                "email": application.applicant_email,
                "phone": application.applicant_phone
            },
            reference_id=application_id,
            reference_type="adoption_application",
            metadata={"pet_id": application.pet_id, "pet_name": pet.get("name")}
        )
    except Exception as e:
        logger.error(f"Failed to create adoption ticket: {e}")
    
    logger.info(f"Adoption application submitted: {application_id}")
    
    return {
        "success": True,
        "application_id": application_id,
        "message": f"Your application to adopt {pet.get('name')} has been submitted! We'll contact you within 24-48 hours."
    }


@router.get("/applications")
async def list_applications(
    status: Optional[str] = None,
    pet_id: Optional[str] = None,
    applicant_email: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """List adoption applications (admin)"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if pet_id:
        query["pet_id"] = pet_id
    if applicant_email:
        query["applicant_email"] = applicant_email
    
    cursor = db.adoption_applications.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    applications = await cursor.to_list(length=limit)
    
    total = await db.adoption_applications.count_documents(query)
    
    return {
        "applications": applications,
        "total": total
    }


@router.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, status: str, notes: Optional[str] = None):
    """Update adoption application status"""
    db = get_db()
    
    valid_statuses = ["pending", "under_review", "approved", "rejected", "withdrawn"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.adoption_applications.update_one(
        {"application_id": application_id},
        {
            "$set": update,
            "$push": {
                "timeline": {
                    "status": status,
                    "notes": notes,
                    "at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # If approved, update pet status to pending
    if status == "approved":
        app = await db.adoption_applications.find_one({"application_id": application_id})
        if app:
            await db.adoptable_pets.update_one(
                {"pet_id": app.get("pet_id")},
                {"$set": {"status": "pending"}}
            )
    
    return {"success": True, "message": f"Application status updated to {status}"}


# ============== FOSTER PROGRAM ==============

@router.post("/foster/apply")
async def submit_foster_application(application: FosterApplication):
    """Submit foster application"""
    db = get_db()
    
    foster_id = f"FOSTER-{uuid.uuid4().hex[:8].upper()}"
    foster_doc = {
        "foster_id": foster_id,
        **application.dict(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.foster_applications.insert_one(foster_doc)
    
    # Create ticket
    try:
        from ticket_auto_creation import create_auto_ticket
        await create_auto_ticket(
            event_type="foster_application",
            pillar="adopt",
            urgency="medium",
            subject=f"New Foster Application from {application.applicant_name}",
            description=f"Foster application from {application.applicant_name} ({application.applicant_email})",
            member={
                "name": application.applicant_name,
                "email": application.applicant_email,
                "phone": application.applicant_phone
            },
            reference_id=foster_id,
            reference_type="foster_application"
        )
    except Exception as e:
        logger.error(f"Failed to create foster ticket: {e}")
    
    return {
        "success": True,
        "foster_id": foster_id,
        "message": "Thank you for wanting to foster! We'll contact you soon to discuss available pets."
    }


@router.get("/foster/applications")
async def list_foster_applications(
    status: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    """List foster applications (admin)"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.foster_applications.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    applications = await cursor.to_list(length=limit)
    
    return {"applications": applications}


# ============== ADOPTION EVENTS ==============

@router.get("/events")
async def list_adoption_events(
    upcoming: bool = True,
    limit: int = Query(20, le=50)
):
    """List adoption events"""
    db = get_db()
    
    query = {}
    if upcoming:
        query["date"] = {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    
    cursor = db.adoption_events.find(query, {"_id": 0}).sort("date", 1).limit(limit)
    events = await cursor.to_list(length=limit)
    
    return {"events": events}


@router.post("/events")
async def create_adoption_event(event: AdoptionEvent):
    """Create adoption event (admin)"""
    db = get_db()
    
    event_id = f"EVENT-{uuid.uuid4().hex[:8].upper()}"
    event_doc = {
        "event_id": event_id,
        **event.dict(),
        "attendees": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.adoption_events.insert_one(event_doc)
    
    return {"success": True, "event_id": event_id}


@router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, name: str, email: str, phone: Optional[str] = None):
    """Register for an adoption event"""
    db = get_db()
    
    event = await db.adoption_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check capacity
    if event.get("max_attendees") and len(event.get("attendees", [])) >= event["max_attendees"]:
        raise HTTPException(status_code=400, detail="This event is fully booked")
    
    await db.adoption_events.update_one(
        {"event_id": event_id},
        {"$push": {"attendees": {"name": name, "email": email, "phone": phone, "registered_at": datetime.now(timezone.utc).isoformat()}}}
    )
    
    return {"success": True, "message": f"You're registered for {event.get('title')}!"}


# ============== SHELTERS/RESCUES ==============

@router.get("/shelters")
async def list_shelters(
    city: Optional[str] = None,
    limit: int = Query(20, le=50)
):
    """List partner shelters and rescues"""
    db = get_db()
    
    query = {"active": True}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    cursor = db.adopt_shelters.find(query, {"_id": 0}).sort("name", 1).limit(limit)
    shelters = await cursor.to_list(length=limit)
    
    return {"shelters": shelters}


@router.post("/shelters")
async def add_shelter(
    name: str,
    city: str,
    address: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    website: Optional[str] = None,
    description: Optional[str] = None
):
    """Add a partner shelter (admin)"""
    db = get_db()
    
    shelter_id = f"SHELTER-{uuid.uuid4().hex[:8].upper()}"
    shelter_doc = {
        "shelter_id": shelter_id,
        "name": name,
        "city": city,
        "address": address,
        "phone": phone,
        "email": email,
        "website": website,
        "description": description,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.adopt_shelters.insert_one(shelter_doc)
    
    return {"success": True, "shelter_id": shelter_id}


# ============== STATS & ANALYTICS ==============

@router.get("/stats")
async def get_adopt_stats():
    """Get adoption statistics"""
    db = get_db()
    
    available_pets = await db.adoptable_pets.count_documents({"status": "available"})
    pending_adoptions = await db.adoptable_pets.count_documents({"status": "pending"})
    adopted_count = await db.adoptable_pets.count_documents({"status": "adopted"})
    pending_applications = await db.adoption_applications.count_documents({"status": "pending"})
    foster_applications = await db.foster_applications.count_documents({"status": "pending"})
    upcoming_events = await db.adoption_events.count_documents({"date": {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}})
    shelters_count = await db.adopt_shelters.count_documents({"active": True})
    
    return {
        "available_pets": available_pets,
        "pending_adoptions": pending_adoptions,
        "total_adopted": adopted_count,
        "pending_applications": pending_applications,
        "foster_applications": foster_applications,
        "upcoming_events": upcoming_events,
        "partner_shelters": shelters_count
    }


# ============== CATEGORIES ==============

@router.get("/categories")
async def get_adopt_categories():
    """Get adopt service categories"""
    return {"categories": ADOPT_CATEGORIES}
