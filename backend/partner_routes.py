"""
Partner Onboarding Routes
Handles partner/vendor onboarding for The Doggy Company
Partners can include: restaurants, stay providers, groomers, vets, etc.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

# Database reference - will be set from server.py
db = None
verify_admin = None

def set_partner_db(database):
    global db
    db = database

def set_partner_admin_verify(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/partners", tags=["Partners"])
admin_router = APIRouter(prefix="/api/admin/partners", tags=["Partner Admin"])

security = HTTPBasic()

# ==================== MODELS ====================

class PartnerApplication(BaseModel):
    business_name: str
    contact_name: str
    email: str
    phone: str
    partner_type: str  # restaurant, stay, groomer, vet, trainer, etc.
    city: str
    address: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    description: str
    pet_friendly_features: Optional[List[str]] = []
    operating_hours: Optional[str] = None
    seating_capacity: Optional[int] = None  # For restaurants
    room_capacity: Optional[int] = None  # For stays
    services_offered: Optional[List[str]] = []
    price_range: Optional[str] = None  # budget, mid, premium
    photos: Optional[List[str]] = []
    how_heard_about_us: Optional[str] = None
    additional_notes: Optional[str] = None

class PartnerUpdate(BaseModel):
    status: Optional[str] = None  # pending, reviewing, approved, rejected, active, inactive
    admin_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    commission_rate: Optional[float] = None
    contract_signed: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    featured: Optional[bool] = None

# ==================== PUBLIC ROUTES ====================

@router.post("/apply")
async def submit_partner_application(application: PartnerApplication):
    """Submit a new partner application"""
    
    # Check if email already exists
    existing = await db.partner_applications.find_one({"email": application.email})
    if existing and existing.get("status") not in ["rejected"]:
        raise HTTPException(
            status_code=400, 
            detail="An application with this email already exists. Please contact us for status updates."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    application_doc = {
        "id": f"partner-{uuid.uuid4().hex[:12]}",
        **application.model_dump(),
        "status": "pending",
        "admin_notes": "",
        "assigned_to": None,
        "commission_rate": None,
        "contract_signed": False,
        "onboarding_completed": False,
        "featured": False,
        "created_at": now,
        "updated_at": now,
        "reviewed_at": None,
        "approved_at": None
    }
    
    await db.partner_applications.insert_one(application_doc)
    
    # TODO: Send confirmation email to applicant
    # TODO: Create admin notification
    
    return {
        "success": True,
        "application_id": application_doc["id"],
        "message": "Thank you for your application! Our team will review it and contact you within 3-5 business days."
    }

@router.get("/types")
async def get_partner_types():
    """Get available partner types"""
    return {
        "partner_types": [
            {"id": "restaurant", "name": "Restaurant / Café", "icon": "Utensils"},
            {"id": "stay", "name": "Pet Hotel / Boarding", "icon": "Home"},
            {"id": "groomer", "name": "Grooming Salon", "icon": "Scissors"},
            {"id": "vet", "name": "Veterinary Clinic", "icon": "Stethoscope"},
            {"id": "trainer", "name": "Pet Trainer", "icon": "GraduationCap"},
            {"id": "daycare", "name": "Pet Daycare", "icon": "Sun"},
            {"id": "transport", "name": "Pet Transport", "icon": "Truck"},
            {"id": "photographer", "name": "Pet Photographer", "icon": "Camera"},
            {"id": "walker", "name": "Dog Walker", "icon": "Footprints"},
            {"id": "other", "name": "Other", "icon": "Star"}
        ]
    }

@router.get("/check-status/{email}")
async def check_application_status(email: str):
    """Check application status by email"""
    application = await db.partner_applications.find_one(
        {"email": email.lower()},
        {"_id": 0, "id": 1, "business_name": 1, "status": 1, "created_at": 1, "reviewed_at": 1}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    status_messages = {
        "pending": "Your application is pending review. We'll contact you soon!",
        "reviewing": "Your application is currently being reviewed by our team.",
        "approved": "Congratulations! Your application has been approved. We'll contact you for next steps.",
        "rejected": "Unfortunately, your application was not approved at this time. Please contact us for details.",
        "active": "You're an active partner! Welcome to The Doggy Company family.",
        "inactive": "Your partner account is currently inactive. Please contact us for assistance."
    }
    
    return {
        "application_id": application["id"],
        "business_name": application["business_name"],
        "status": application["status"],
        "message": status_messages.get(application["status"], "Status unknown"),
        "submitted_at": application["created_at"],
        "reviewed_at": application.get("reviewed_at")
    }

# ==================== ADMIN ROUTES ====================

@admin_router.get("")
async def get_partner_applications(
    status: Optional[str] = None,
    partner_type: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50,
    username: str = Depends(lambda: verify_admin)
):
    """Get all partner applications with filters"""
    
    query = {}
    if status:
        query["status"] = status
    if partner_type:
        query["partner_type"] = partner_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    applications = await db.partner_applications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get stats
    stats = {
        "total": await db.partner_applications.count_documents({}),
        "pending": await db.partner_applications.count_documents({"status": "pending"}),
        "reviewing": await db.partner_applications.count_documents({"status": "reviewing"}),
        "approved": await db.partner_applications.count_documents({"status": "approved"}),
        "active": await db.partner_applications.count_documents({"status": "active"}),
        "rejected": await db.partner_applications.count_documents({"status": "rejected"})
    }
    
    return {"applications": applications, "stats": stats}

@admin_router.get("/{partner_id}")
async def get_partner_application(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Get a single partner application"""
    application = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"application": application}

@admin_router.put("/{partner_id}")
async def update_partner_application(
    partner_id: str, 
    update: PartnerUpdate,
    username: str = Depends(lambda: verify_admin)
):
    """Update partner application status and details"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Track status changes
    if "status" in update_data:
        if update_data["status"] in ["reviewing", "approved", "rejected"]:
            update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        if update_data["status"] == "approved":
            update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": update_data}
    )
    
    updated = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    return {"application": updated}

@admin_router.delete("/{partner_id}")
async def delete_partner_application(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Delete a partner application"""
    result = await db.partner_applications.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

@admin_router.post("/{partner_id}/convert-to-listing")
async def convert_to_listing(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Convert approved partner application to actual listing (restaurant, stay, etc.)"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved applications can be converted")
    
    partner_type = application.get("partner_type")
    now = datetime.now(timezone.utc).isoformat()
    
    # Create listing based on partner type
    if partner_type == "restaurant":
        listing = {
            "id": f"rest-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "location": application["city"],
            "address": application.get("address", ""),
            "cuisine": "Pet-Friendly",
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "pet_friendly": True,
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website"),
                "instagram": application.get("instagram")
            },
            "operating_hours": application.get("operating_hours", "10 AM - 10 PM"),
            "seating_capacity": application.get("seating_capacity"),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.restaurants.insert_one(listing)
        listing_collection = "restaurants"
        
    elif partner_type == "stay":
        listing = {
            "id": f"stay-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "location": application["city"],
            "address": application.get("address", ""),
            "type": "boarding",
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website")
            },
            "capacity": application.get("room_capacity"),
            "services": application.get("services_offered", []),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.stays.insert_one(listing)
        listing_collection = "stays"
        
    else:
        # Generic service listing
        listing = {
            "id": f"svc-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "type": partner_type,
            "location": application["city"],
            "address": application.get("address", ""),
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website")
            },
            "services": application.get("services_offered", []),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.services.insert_one(listing)
        listing_collection = "services"
    
    # Update application status
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": {
            "status": "active",
            "listing_id": listing["id"],
            "listing_collection": listing_collection,
            "updated_at": now
        }}
    )
    
    return {
        "success": True,
        "listing_id": listing["id"],
        "listing_collection": listing_collection,
        "message": f"Partner converted to {listing_collection} listing"
    }

# ==================== CSV EXPORT/IMPORT ====================

@admin_router.get("/export/csv")
async def export_partners_csv(username: str = Depends(lambda: verify_admin)):
    """Export partner applications as CSV data"""
    applications = await db.partner_applications.find({}, {"_id": 0}).to_list(10000)
    return {"applications": applications, "total": len(applications)}

@admin_router.post("/import/csv")
async def import_partners_csv(data: dict, username: str = Depends(lambda: verify_admin)):
    """Import partner applications from CSV data"""
    applications = data.get("applications", [])
    imported = 0
    
    for app_data in applications:
        if not app_data.get("email"):
            continue
            
        existing = await db.partner_applications.find_one({"email": app_data["email"]})
        if existing:
            continue
            
        now = datetime.now(timezone.utc).isoformat()
        application_doc = {
            "id": f"partner-{uuid.uuid4().hex[:12]}",
            "business_name": app_data.get("business_name", "Unknown"),
            "contact_name": app_data.get("contact_name", ""),
            "email": app_data["email"],
            "phone": app_data.get("phone", ""),
            "partner_type": app_data.get("partner_type", "other"),
            "city": app_data.get("city", ""),
            "address": app_data.get("address"),
            "description": app_data.get("description", ""),
            "status": app_data.get("status", "pending"),
            "created_at": now,
            "updated_at": now
        }
        await db.partner_applications.insert_one(application_doc)
        imported += 1
    
    return {"imported": imported}
