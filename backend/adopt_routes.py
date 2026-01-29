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
from timestamp_utils import get_utc_timestamp
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
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
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
    
    updates["updated_at"] = get_utc_timestamp()
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
    
    logger.info(f"Looking for pet_id: {application.pet_id}")
    
    # Verify pet exists and is available - support both pet_id and id fields
    pet = await db.adoptable_pets.find_one({
        "$or": [
            {"pet_id": application.pet_id},
            {"id": application.pet_id}
        ]
    })
    
    if not pet:
        # Log all pets for debugging
        all_pets = await db.adoptable_pets.find({}, {"pet_id": 1, "id": 1, "name": 1}).to_list(20)
        logger.error(f"Pet not found. Available pets: {all_pets}")
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
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
        "timeline": [{
            "status": "submitted",
            "at": get_utc_timestamp()
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
        "updated_at": get_utc_timestamp()
    }
    
    result = await db.adoption_applications.update_one(
        {"application_id": application_id},
        {
            "$set": update,
            "$push": {
                "timeline": {
                    "status": status,
                    "notes": notes,
                    "at": get_utc_timestamp()
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
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
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
        "created_at": get_utc_timestamp()
    }
    
    await db.adoption_events.insert_one(event_doc)
    
    return {"success": True, "event_id": event_id}


@router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, name: str, email: str, phone: Optional[str] = None):
    """Register for an adoption event"""
    db = get_db()
    
    # Support both 'id' and 'event_id' field names for compatibility
    event = await db.adoption_events.find_one({
        "$or": [
            {"event_id": event_id}, 
            {"id": event_id},
            {"event_id": event_id.upper()},  # Handle case variations
            {"id": event_id.lower()}
        ]
    })
    if not event:
        logger.error(f"Event not found: {event_id}")
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check capacity
    if event.get("max_attendees") and len(event.get("attendees", [])) >= event["max_attendees"]:
        raise HTTPException(status_code=400, detail="This event is fully booked")
    
    registration_id = f"REG-{uuid.uuid4().hex[:6].upper()}"
    
    # Update using the correct field name
    event_field = "event_id" if event.get("event_id") else "id"
    await db.adoption_events.update_one(
        {event_field: event_id},
        {"$push": {"attendees": {
            "registration_id": registration_id,
            "name": name, 
            "email": email, 
            "phone": phone, 
            "registered_at": get_utc_timestamp()
        }}}
    )
    
    # Create notification for admin
    notification_doc = {
        "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "adopt_event_registration",
        "pillar": "adopt",
        "title": f"New Event Registration: {event.get('title')}",
        "message": f"{name} registered for {event.get('title')} on {event.get('event_date')}",
        "priority": "normal",
        "status": "unread",
        "source": "adopt_pillar",
        "reference_id": registration_id,
        "reference_type": "event_registration",
        "customer": {"name": name, "email": email, "phone": phone},
        "metadata": {
            "event_id": event_id,
            "event_title": event.get("title"),
            "event_date": event.get("event_date"),
            "venue": event.get("venue")
        },
        "action_required": False,
        "created_at": get_utc_timestamp()
    }
    await db.admin_notifications.insert_one(notification_doc)
    
    # Create service desk ticket
    ticket_doc = {
        "ticket_id": registration_id,
        "source": "adopt_pillar",
        "channel": "web",
        "pillar": "adopt",
        "category": "event_registration",
        "status": "info",
        "priority": "low",
        "subject": f"Event Registration: {event.get('title')} - {name}",
        "description": f"{name} has registered for the adoption event '{event.get('title')}' on {event.get('event_date')}.",
        "customer": {"name": name, "email": email, "phone": phone},
        "metadata": {
            "event_id": event_id,
            "event_title": event.get("title"),
            "event_date": event.get("event_date")
        },
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    await db.service_desk_tickets.insert_one(ticket_doc)
    
    # Create unified inbox entry
    inbox_entry = {
        "request_id": registration_id,
        "channel": "web",
        "request_type": "adopt_event_registration",
        "pillar": "adopt",
        "status": "confirmed",
        "customer_name": name,
        "customer_email": email,
        "customer_phone": phone,
        "message": f"Registered for {event.get('title')} on {event.get('event_date')}",
        "metadata": {"event_id": event_id, "registration_id": registration_id},
        "created_at": get_utc_timestamp()
    }
    await db.channel_intakes.insert_one(inbox_entry)
    
    logger.info(f"Event registration: {registration_id} for {event_id}")
    
    return {"success": True, "registration_id": registration_id, "message": f"You're registered for {event.get('title')}!"}


# ============== SHELTERS/RESCUES ==============

@router.get("/shelters")
async def list_shelters(
    city: Optional[str] = None,
    limit: int = Query(20, le=50)
):
    """List partner shelters and rescues"""
    db = get_db()
    
    query = {}  # Don't filter by active to show all shelters
    if city:
        query["location"] = {"$regex": city, "$options": "i"}
    
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
        "created_at": get_utc_timestamp()
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
    shelters_count = await db.adopt_shelters.count_documents({})  # Count all shelters
    
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


# ============== SEED DATA ==============

@router.post("/admin/seed")
async def seed_adopt_data():
    """Seed comprehensive adopt pillar data"""
    db = get_db()
    
    # Sample adoptable pets
    SAMPLE_PETS = [
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Bruno",
            "species": "dog",
            "breed": "Indie",
            "age": "2 years",
            "age_months": 24,
            "gender": "male",
            "size": "medium",
            "color": "Brown & White",
            "description": "Bruno is a friendly and playful Indie who loves going on walks and playing fetch. He's great with kids and other dogs.",
            "personality_traits": ["friendly", "playful", "loyal", "good with kids"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": True,
            "special_needs": None,
            "good_with_kids": True,
            "good_with_dogs": True,
            "good_with_cats": False,
            "energy_level": "high",
            "training_level": "basic",
            "shelter_id": "shelter-paws",
            "shelter_name": "Paws & Claws Rescue",
            "location": "Mumbai, Maharashtra",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "images": [
                "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
                "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400"
            ],
            "status": "available",
            "adoption_fee": 2500,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Luna",
            "species": "dog",
            "breed": "Labrador Mix",
            "age": "1 year",
            "age_months": 14,
            "gender": "female",
            "size": "large",
            "color": "Golden",
            "description": "Luna is a sweet and gentle Lab mix who was rescued from the streets. She loves cuddles and is eager to please.",
            "personality_traits": ["gentle", "affectionate", "eager to please", "calm"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": True,
            "special_needs": None,
            "good_with_kids": True,
            "good_with_dogs": True,
            "good_with_cats": True,
            "energy_level": "medium",
            "training_level": "intermediate",
            "shelter_id": "shelter-hope",
            "shelter_name": "Hope Animal Shelter",
            "location": "Bangalore, Karnataka",
            "image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
            "images": [
                "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"
            ],
            "status": "available",
            "adoption_fee": 3000,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Whiskers",
            "species": "cat",
            "breed": "Domestic Shorthair",
            "age": "3 years",
            "age_months": 36,
            "gender": "male",
            "size": "medium",
            "color": "Orange Tabby",
            "description": "Whiskers is a laid-back orange tabby who loves sunny spots and gentle pets. Perfect for a calm household.",
            "personality_traits": ["calm", "independent", "affectionate", "quiet"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": True,
            "special_needs": None,
            "good_with_kids": True,
            "good_with_dogs": False,
            "good_with_cats": True,
            "energy_level": "low",
            "training_level": "litter trained",
            "shelter_id": "shelter-meow",
            "shelter_name": "Meow Foundation",
            "location": "Delhi NCR",
            "image": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
            "images": [
                "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"
            ],
            "status": "available",
            "adoption_fee": 1500,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Rocky",
            "species": "dog",
            "breed": "German Shepherd Mix",
            "age": "4 years",
            "age_months": 48,
            "gender": "male",
            "size": "large",
            "color": "Black & Tan",
            "description": "Rocky is a loyal and protective companion. He needs an experienced owner who can provide consistent training.",
            "personality_traits": ["loyal", "protective", "intelligent", "alert"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": True,
            "special_needs": "needs experienced owner",
            "good_with_kids": True,
            "good_with_dogs": False,
            "good_with_cats": False,
            "energy_level": "high",
            "training_level": "advanced",
            "shelter_id": "shelter-paws",
            "shelter_name": "Paws & Claws Rescue",
            "location": "Pune, Maharashtra",
            "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400",
            "images": [
                "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400"
            ],
            "status": "available",
            "adoption_fee": 3500,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Coco",
            "species": "dog",
            "breed": "Beagle",
            "age": "6 months",
            "age_months": 6,
            "gender": "female",
            "size": "small",
            "color": "Tricolor",
            "description": "Coco is an adorable Beagle puppy full of energy and curiosity. She's learning basic commands and loves treats!",
            "personality_traits": ["playful", "curious", "friendly", "food-motivated"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": False,
            "special_needs": None,
            "good_with_kids": True,
            "good_with_dogs": True,
            "good_with_cats": True,
            "energy_level": "very high",
            "training_level": "puppy",
            "shelter_id": "shelter-hope",
            "shelter_name": "Hope Animal Shelter",
            "location": "Hyderabad, Telangana",
            "image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400",
            "images": [
                "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400"
            ],
            "status": "available",
            "adoption_fee": 5000,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Shadow",
            "species": "cat",
            "breed": "Persian Mix",
            "age": "2 years",
            "age_months": 28,
            "gender": "female",
            "size": "medium",
            "color": "Grey",
            "description": "Shadow is a beautiful Persian mix with a luxurious coat. She's shy at first but becomes very loving once comfortable.",
            "personality_traits": ["shy", "sweet", "gentle", "quiet"],
            "health_status": "vaccinated",
            "vaccinated": True,
            "neutered": True,
            "special_needs": "regular grooming needed",
            "good_with_kids": False,
            "good_with_dogs": False,
            "good_with_cats": True,
            "energy_level": "low",
            "training_level": "litter trained",
            "shelter_id": "shelter-meow",
            "shelter_name": "Meow Foundation",
            "location": "Chennai, Tamil Nadu",
            "image": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400",
            "images": [
                "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400"
            ],
            "status": "available",
            "adoption_fee": 2000,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Max",
            "species": "dog",
            "breed": "Pug",
            "age": "5 years",
            "age_months": 60,
            "gender": "male",
            "size": "small",
            "color": "Fawn",
            "description": "Max is a charming senior Pug looking for a quiet home. He loves naps, short walks, and being close to his humans.",
            "personality_traits": ["calm", "affectionate", "loyal", "couch potato"],
            "health_status": "senior care needed",
            "vaccinated": True,
            "neutered": True,
            "special_needs": "senior diet, limited exercise",
            "good_with_kids": True,
            "good_with_dogs": True,
            "good_with_cats": True,
            "energy_level": "low",
            "training_level": "fully trained",
            "shelter_id": "shelter-golden",
            "shelter_name": "Golden Years Rescue",
            "location": "Kolkata, West Bengal",
            "image": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
            "images": [
                "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400"
            ],
            "status": "available",
            "adoption_fee": 1500,
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"adopt-pet-{uuid.uuid4().hex[:8]}",
            "name": "Bella",
            "species": "dog",
            "breed": "Golden Retriever",
            "age": "3 years",
            "age_months": 36,
            "gender": "female",
            "size": "large",
            "color": "Golden",
            "description": "Bella is a beautiful Golden Retriever who was surrendered due to family circumstances. She's well-trained and great with everyone!",
            "personality_traits": ["friendly", "gentle", "well-mannered", "therapy dog potential"],
            "health_status": "excellent",
            "vaccinated": True,
            "neutered": True,
            "special_needs": None,
            "good_with_kids": True,
            "good_with_dogs": True,
            "good_with_cats": True,
            "energy_level": "medium",
            "training_level": "advanced",
            "shelter_id": "shelter-paws",
            "shelter_name": "Paws & Claws Rescue",
            "location": "Ahmedabad, Gujarat",
            "image": "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400",
            "images": [
                "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400"
            ],
            "status": "available",
            "adoption_fee": 4000,
            "created_at": get_utc_timestamp()
        }
    ]
    
    # Sample shelters
    SAMPLE_SHELTERS = [
        {
            "id": "shelter-paws",
            "name": "Paws & Claws Rescue",
            "description": "Dedicated to rescuing and rehoming stray and abandoned dogs across Maharashtra.",
            "location": "Mumbai, Maharashtra",
            "contact_email": "info@pawsclaws.org",
            "contact_phone": "+91 98765 43210",
            "website": "https://pawsclaws.org",
            "logo": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200",
            "verified": True,
            "pets_count": 45,
            "adoptions_completed": 320,
            "founded_year": 2015,
            "created_at": get_utc_timestamp()
        },
        {
            "id": "shelter-hope",
            "name": "Hope Animal Shelter",
            "description": "A no-kill shelter providing sanctuary for dogs and cats until they find their forever homes.",
            "location": "Bangalore, Karnataka",
            "contact_email": "adopt@hopeshelter.in",
            "contact_phone": "+91 80 4567 8901",
            "website": "https://hopeshelter.in",
            "logo": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200",
            "verified": True,
            "pets_count": 78,
            "adoptions_completed": 520,
            "founded_year": 2012,
            "created_at": get_utc_timestamp()
        },
        {
            "id": "shelter-meow",
            "name": "Meow Foundation",
            "description": "Specializing in cat rescue, rehabilitation, and adoption services.",
            "location": "Delhi NCR",
            "contact_email": "hello@meowfoundation.org",
            "contact_phone": "+91 11 2345 6789",
            "website": "https://meowfoundation.org",
            "logo": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200",
            "verified": True,
            "pets_count": 35,
            "adoptions_completed": 180,
            "founded_year": 2018,
            "created_at": get_utc_timestamp()
        },
        {
            "id": "shelter-golden",
            "name": "Golden Years Rescue",
            "description": "Focused on senior pet rescue and providing them comfortable golden years.",
            "location": "Kolkata, West Bengal",
            "contact_email": "care@goldenyears.org",
            "contact_phone": "+91 33 9876 5432",
            "website": "https://goldenyears.org",
            "logo": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
            "verified": True,
            "pets_count": 22,
            "adoptions_completed": 95,
            "founded_year": 2019,
            "created_at": get_utc_timestamp()
        }
    ]
    
    # Sample events
    SAMPLE_EVENTS = [
        {
            "id": f"event-{uuid.uuid4().hex[:8]}",
            "title": "Weekend Adoption Drive",
            "description": "Meet adorable dogs and cats looking for their forever homes. Free vet consultations included!",
            "event_type": "adoption_drive",
            "location": "Phoenix Mall, Lower Parel, Mumbai",
            "date": "2026-02-15",
            "start_time": "10:00",
            "end_time": "18:00",
            "organizer": "Paws & Claws Rescue",
            "image": "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400",
            "registration_required": False,
            "pets_available": 25,
            "status": "upcoming",
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"event-{uuid.uuid4().hex[:8]}",
            "title": "Puppy Socialization Workshop",
            "description": "Learn how to properly socialize your newly adopted puppy with our expert trainers.",
            "event_type": "workshop",
            "location": "Cubbon Park, Bangalore",
            "date": "2026-02-22",
            "start_time": "09:00",
            "end_time": "12:00",
            "organizer": "Hope Animal Shelter",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "registration_required": True,
            "registration_fee": 500,
            "max_participants": 20,
            "status": "upcoming",
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"event-{uuid.uuid4().hex[:8]}",
            "title": "Cat Cafe Adoption Day",
            "description": "Spend time with our rescued cats in a cozy cafe setting. Adoption fees waived for the day!",
            "event_type": "adoption_drive",
            "location": "Cat Cafe Studio, Hauz Khas, Delhi",
            "date": "2026-03-01",
            "start_time": "11:00",
            "end_time": "20:00",
            "organizer": "Meow Foundation",
            "image": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
            "registration_required": False,
            "pets_available": 15,
            "status": "upcoming",
            "created_at": get_utc_timestamp()
        },
        {
            "id": f"event-{uuid.uuid4().hex[:8]}",
            "title": "Senior Pet Adoption Fair",
            "description": "Give a senior pet a loving home. Special adoption packages for senior animals!",
            "event_type": "adoption_drive",
            "location": "Salt Lake Stadium Grounds, Kolkata",
            "date": "2026-03-08",
            "start_time": "10:00",
            "end_time": "16:00",
            "organizer": "Golden Years Rescue",
            "image": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
            "registration_required": False,
            "pets_available": 18,
            "status": "upcoming",
            "created_at": get_utc_timestamp()
        }
    ]
    
    results = {
        "pets_seeded": 0,
        "shelters_seeded": 0,
        "events_seeded": 0
    }
    
    try:
        # Seed pets
        await db.adoptable_pets.delete_many({})
        if SAMPLE_PETS:
            await db.adoptable_pets.insert_many(SAMPLE_PETS)
            results["pets_seeded"] = len(SAMPLE_PETS)
        
        # Seed shelters
        await db.adopt_shelters.delete_many({})
        if SAMPLE_SHELTERS:
            await db.adopt_shelters.insert_many(SAMPLE_SHELTERS)
            results["shelters_seeded"] = len(SAMPLE_SHELTERS)
        
        # Seed events (using adoption_events collection to match route)
        await db.adoption_events.delete_many({})
        if SAMPLE_EVENTS:
            await db.adoption_events.insert_many(SAMPLE_EVENTS)
            results["events_seeded"] = len(SAMPLE_EVENTS)
        
        return {"success": True, "message": "Adopt data seeded successfully", "results": results}
    
    except Exception as e:
        logger.error(f"Error seeding adopt data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

