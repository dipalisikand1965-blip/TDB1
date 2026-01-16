"""
Dine Routes for The Doggy Company
Handles restaurants, reservations, and fresh meals
"""

import os
import logging
import uuid
import csv
import io
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

logger = logging.getLogger(__name__)

# Create router
dine_router = APIRouter(prefix="/api", tags=["Dine"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class RestaurantCreate(BaseModel):
    name: str
    area: str
    city: str
    petMenuAvailable: str = "no"  # yes, partial, no
    petPolicy: str = "outdoor"  # all-pets, outdoor, small-pets
    cuisine: List[str] = []
    tags: List[str] = []
    rating: float = 4.0
    reviewCount: int = 0
    priceRange: str = "₹₹"
    image: Optional[str] = None
    petMenuItems: List[str] = []
    timings: Optional[str] = None
    phone: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    featured: bool = False
    verified: bool = False
    # Enhanced fields
    petMenuImage: Optional[str] = None  # Image of pet menu
    conciergeRecommendation: Optional[str] = None  # Your Concierge® recommends
    zomatoLink: Optional[str] = None
    googleMapsLink: Optional[str] = None
    specialOffers: Optional[str] = None
    address: Optional[str] = None
    birthdayPerks: bool = False  # Offers birthday perks for pets
    country: str = "India"
    state: Optional[str] = None


class ReservationRequest(BaseModel):
    restaurant_id: str
    name: str
    phone: str
    email: str
    date: str
    time: str
    guests: int = 2
    pets: int = 1
    petMealPreorder: bool = False
    specialRequests: Optional[str] = None


class RestaurantVisit(BaseModel):
    restaurant_id: str
    date: str
    time_slot: str  # morning, afternoon, evening
    pet_ids: List[str] = []
    looking_for_buddies: bool = True
    notes: Optional[str] = None


class MeetupRequest(BaseModel):
    visit_id: str
    message: Optional[str] = None


# ==================== PUBLIC ROUTES ====================

@dine_router.get("/dine/restaurants")
async def get_restaurants(
    city: Optional[str] = None,
    petMenu: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all pet-friendly restaurants (public)"""
    query = {}
    
    if city:
        query["city"] = city
    if petMenu:
        query["petMenuAvailable"] = petMenu
    if featured:
        query["featured"] = True
    
    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(100)
    return {"restaurants": restaurants}


@dine_router.get("/dine/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    """Get a specific restaurant"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@dine_router.post("/dine/reservations")
async def create_reservation(reservation: ReservationRequest):
    """Create a reservation request"""
    # Verify restaurant exists
    restaurant = await db.restaurants.find_one({"id": reservation.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    reservation_doc = {
        "id": f"res-{uuid.uuid4().hex[:12]}",
        **reservation.model_dump(),
        "restaurant_name": restaurant.get("name"),
        "restaurant_city": restaurant.get("city"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    logger.info(f"New reservation: {reservation_doc['id']} at {restaurant.get('name')}")
    
    return {
        "message": "Reservation request submitted",
        "reservation_id": reservation_doc["id"],
        "status": "pending"
    }


# ==================== ADMIN ROUTES ====================

@dine_router.get("/admin/dine/restaurants")
async def admin_get_restaurants(username: str = Depends(verify_admin)):
    """Get all restaurants (admin)"""
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(500)
    return {"restaurants": restaurants}


@dine_router.post("/admin/dine/restaurants")
async def admin_create_restaurant(
    restaurant: RestaurantCreate,
    username: str = Depends(verify_admin)
):
    """Create a new restaurant (admin)"""
    restaurant_doc = {
        "id": f"rest-{uuid.uuid4().hex[:12]}",
        **restaurant.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.restaurants.insert_one(restaurant_doc)
    restaurant_doc.pop("_id", None)
    
    logger.info(f"Created restaurant: {restaurant_doc['id']} - {restaurant.name}")
    
    return {"message": "Restaurant created", "restaurant": restaurant_doc}


@dine_router.put("/admin/dine/restaurants/{restaurant_id}")
async def admin_update_restaurant(
    restaurant_id: str,
    restaurant: RestaurantCreate,
    username: str = Depends(verify_admin)
):
    """Update a restaurant (admin)"""
    existing = await db.restaurants.find_one({"id": restaurant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    update_data = {
        **restaurant.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": update_data}
    )
    
    updated = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    return {"message": "Restaurant updated", "restaurant": updated}


@dine_router.delete("/admin/dine/restaurants/{restaurant_id}")
async def admin_delete_restaurant(
    restaurant_id: str,
    username: str = Depends(verify_admin)
):
    """Delete a restaurant (admin)"""
    result = await db.restaurants.delete_one({"id": restaurant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"message": "Restaurant deleted"}


@dine_router.get("/admin/dine/reservations")
async def admin_get_reservations(
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get all reservations (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"reservations": reservations}


@dine_router.put("/admin/dine/reservations/{reservation_id}/status")
async def admin_update_reservation_status(
    reservation_id: str,
    status: str,
    username: str = Depends(verify_admin)
):
    """Update reservation status (admin)"""
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.reservations.update_one(
        {"id": reservation_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    return {"message": f"Reservation status updated to {status}"}


@dine_router.get("/admin/dine/stats")
async def admin_dine_stats(username: str = Depends(verify_admin)):
    """Get Dine statistics (admin)"""
    total_restaurants = await db.restaurants.count_documents({})
    with_pet_menu = await db.restaurants.count_documents({"petMenuAvailable": "yes"})
    partial_menu = await db.restaurants.count_documents({"petMenuAvailable": "partial"})
    featured = await db.restaurants.count_documents({"featured": True})
    
    pending_reservations = await db.reservations.count_documents({"status": "pending"})
    confirmed_reservations = await db.reservations.count_documents({"status": "confirmed"})
    
    # City breakdown
    cities = await db.restaurants.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    return {
        "restaurants": {
            "total": total_restaurants,
            "with_pet_menu": with_pet_menu,
            "partial_menu": partial_menu,
            "featured": featured
        },
        "reservations": {
            "pending": pending_reservations,
            "confirmed": confirmed_reservations
        },
        "cities": cities
    }


# ==================== IMAGE UPLOAD ====================

@dine_router.post("/admin/dine/upload-image")
async def upload_restaurant_image(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Upload an image for a restaurant"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload JPG, PNG, or WebP images."
        )
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"rest_{uuid.uuid4().hex[:12]}.{ext}"
    
    # Create directory if not exists
    upload_dir = "uploads/restaurants"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{unique_filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "message": "Image uploaded successfully",
            "filename": unique_filename,
            "url": f"/uploads/restaurants/{unique_filename}"
        }
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


# ==================== CSV EXPORT ====================

@dine_router.get("/admin/dine/export-csv")
async def export_restaurants_csv(username: str = Depends(verify_admin)):
    """Export all restaurants as CSV"""
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    
    if not restaurants:
        raise HTTPException(status_code=404, detail="No restaurants to export")
    
    # Create CSV in memory
    output = io.StringIO()
    
    # Define CSV fields
    fieldnames = [
        'id', 'name', 'area', 'city', 'petMenuAvailable', 'petPolicy',
        'cuisine', 'tags', 'rating', 'reviewCount', 'priceRange', 'image',
        'petMenuItems', 'timings', 'phone', 'instagram', 'website',
        'featured', 'verified', 'created_at', 'updated_at'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for rest in restaurants:
        # Convert lists to comma-separated strings for CSV
        row = {**rest}
        if isinstance(row.get('cuisine'), list):
            row['cuisine'] = '|'.join(row['cuisine'])
        if isinstance(row.get('tags'), list):
            row['tags'] = '|'.join(row['tags'])
        if isinstance(row.get('petMenuItems'), list):
            row['petMenuItems'] = '|'.join(row['petMenuItems'])
        writer.writerow(row)
    
    output.seek(0)
    
    # Return as downloadable CSV
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=restaurants_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


# ==================== CSV IMPORT ====================

@dine_router.post("/admin/dine/import-csv")
async def import_restaurants_csv(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Import restaurants from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    
    try:
        # Read CSV content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        reader = csv.DictReader(io.StringIO(content_str))
        
        imported = 0
        updated = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            try:
                # Skip empty rows
                if not row.get('name'):
                    continue
                
                # Parse list fields from pipe-separated values
                cuisine = [c.strip() for c in row.get('cuisine', '').split('|') if c.strip()]
                tags = [t.strip() for t in row.get('tags', '').split('|') if t.strip()]
                pet_menu_items = [p.strip() for p in row.get('petMenuItems', '').split('|') if p.strip()]
                
                restaurant_doc = {
                    "name": row.get('name', '').strip(),
                    "area": row.get('area', '').strip(),
                    "city": row.get('city', '').strip(),
                    "petMenuAvailable": row.get('petMenuAvailable', 'no').strip(),
                    "petPolicy": row.get('petPolicy', 'outdoor').strip(),
                    "cuisine": cuisine,
                    "tags": tags,
                    "rating": float(row.get('rating', 4.0) or 4.0),
                    "reviewCount": int(row.get('reviewCount', 0) or 0),
                    "priceRange": row.get('priceRange', '₹₹').strip(),
                    "image": row.get('image', '').strip() or None,
                    "petMenuItems": pet_menu_items,
                    "timings": row.get('timings', '').strip() or None,
                    "phone": row.get('phone', '').strip() or None,
                    "instagram": row.get('instagram', '').strip() or None,
                    "website": row.get('website', '').strip() or None,
                    "featured": str(row.get('featured', 'false')).lower() in ['true', '1', 'yes'],
                    "verified": str(row.get('verified', 'false')).lower() in ['true', '1', 'yes'],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Check if restaurant with same name and city exists
                existing = await db.restaurants.find_one({
                    "name": restaurant_doc["name"],
                    "city": restaurant_doc["city"]
                })
                
                if existing:
                    # Update existing restaurant
                    await db.restaurants.update_one(
                        {"id": existing["id"]},
                        {"$set": restaurant_doc}
                    )
                    updated += 1
                else:
                    # Create new restaurant
                    restaurant_doc["id"] = f"rest-{uuid.uuid4().hex[:12]}"
                    restaurant_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.restaurants.insert_one(restaurant_doc)
                    imported += 1
                    
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        return {
            "message": "CSV import completed",
            "imported": imported,
            "updated": updated,
            "errors": errors[:10] if errors else []  # Return first 10 errors
        }
        
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to import CSV: {str(e)}")


# ==================== PET BUDDY MEETUP FEATURE ====================

@dine_router.post("/dine/visits")
async def schedule_visit(visit: RestaurantVisit, user_id: Optional[str] = None):
    """Schedule a visit to a restaurant (for Pet Buddy feature)"""
    # Verify restaurant exists
    restaurant = await db.restaurants.find_one({"id": visit.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Get pet info if pet_ids provided
    pets_info = []
    if visit.pet_ids:
        for pet_id in visit.pet_ids:
            pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "id": 1, "name": 1, "breed": 1, "photo": 1})
            if pet:
                pets_info.append(pet)
    
    visit_doc = {
        "id": f"visit-{uuid.uuid4().hex[:12]}",
        "restaurant_id": visit.restaurant_id,
        "restaurant_name": restaurant.get("name"),
        "restaurant_area": restaurant.get("area"),
        "restaurant_city": restaurant.get("city"),
        "user_id": user_id,
        "date": visit.date,
        "time_slot": visit.time_slot,
        "pets": pets_info,
        "looking_for_buddies": visit.looking_for_buddies,
        "notes": visit.notes,
        "status": "scheduled",  # scheduled, completed, cancelled
        "meetup_requests": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.restaurant_visits.insert_one(visit_doc)
    visit_doc.pop("_id", None)
    
    return {"message": "Visit scheduled", "visit": visit_doc}


@dine_router.get("/dine/restaurants/{restaurant_id}/visits")
async def get_restaurant_visits(restaurant_id: str, date: Optional[str] = None):
    """Get upcoming visits at a restaurant (Who's Going feature)"""
    query = {
        "restaurant_id": restaurant_id,
        "status": "scheduled",
        "looking_for_buddies": True
    }
    
    if date:
        query["date"] = date
    else:
        # Default to upcoming visits (today and future)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}
    
    visits = await db.restaurant_visits.find(query, {"_id": 0}).sort("date", 1).to_list(50)
    
    # Group by date
    grouped = {}
    for visit in visits:
        date_key = visit.get("date")
        if date_key not in grouped:
            grouped[date_key] = []
        grouped[date_key].append(visit)
    
    return {
        "restaurant_id": restaurant_id,
        "visits": visits,
        "grouped_by_date": grouped,
        "total_upcoming": len(visits)
    }


@dine_router.post("/dine/meetup-request")
async def send_meetup_request(request: MeetupRequest, user_id: Optional[str] = None):
    """Send a meetup request to another pet parent"""
    # Get the visit
    visit = await db.restaurant_visits.find_one({"id": request.visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    meetup_doc = {
        "id": f"meetup-{uuid.uuid4().hex[:12]}",
        "visit_id": request.visit_id,
        "requester_id": user_id,
        "target_user_id": visit.get("user_id"),
        "restaurant_id": visit.get("restaurant_id"),
        "restaurant_name": visit.get("restaurant_name"),
        "visit_date": visit.get("date"),
        "message": request.message,
        "status": "pending",  # pending, accepted, declined
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.meetup_requests.insert_one(meetup_doc)
    
    # Add to visit's meetup_requests list
    await db.restaurant_visits.update_one(
        {"id": request.visit_id},
        {"$push": {"meetup_requests": meetup_doc["id"]}}
    )
    
    return {"message": "Meetup request sent", "request_id": meetup_doc["id"]}


@dine_router.get("/dine/my-visits")
async def get_my_visits(user_id: str):
    """Get user's scheduled visits"""
    visits = await db.restaurant_visits.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("date", -1).to_list(50)
    
    return {"visits": visits}


@dine_router.get("/dine/meetup-requests")
async def get_meetup_requests(user_id: str, status: Optional[str] = None):
    """Get meetup requests for a user"""
    query = {
        "$or": [
            {"requester_id": user_id},
            {"target_user_id": user_id}
        ]
    }
    if status:
        query["status"] = status
    
    requests = await db.meetup_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return {"requests": requests}


@dine_router.put("/dine/meetup-requests/{request_id}/respond")
async def respond_to_meetup(request_id: str, accept: bool, user_id: str):
    """Accept or decline a meetup request"""
    result = await db.meetup_requests.update_one(
        {"id": request_id, "target_user_id": user_id},
        {
            "$set": {
                "status": "accepted" if accept else "declined",
                "responded_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or not authorized")
    
    return {"message": f"Meetup request {'accepted' if accept else 'declined'}"}


@dine_router.delete("/dine/visits/{visit_id}")
async def cancel_visit(visit_id: str, user_id: str):
    """Cancel a scheduled visit"""
    result = await db.restaurant_visits.update_one(
        {"id": visit_id, "user_id": user_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found or not authorized")
    
    return {"message": "Visit cancelled"}


# ==================== UPLOAD PET MENU IMAGE ====================

@dine_router.post("/admin/dine/upload-pet-menu")
async def upload_pet_menu_image(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Upload a pet menu image for a restaurant"""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload JPG, PNG, or WebP images."
        )
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"petmenu_{uuid.uuid4().hex[:12]}.{ext}"
    
    upload_dir = "uploads/pet-menus"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{unique_filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "message": "Pet menu image uploaded successfully",
            "filename": unique_filename,
            "url": f"/uploads/pet-menus/{unique_filename}"
        }
    except Exception as e:
        logger.error(f"Error uploading pet menu image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")
