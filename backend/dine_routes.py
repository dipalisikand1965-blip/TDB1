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
import resend
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

# Resend configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
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


class RestaurantPartialUpdate(BaseModel):
    """For partial updates (PATCH)"""
    name: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    petMenuAvailable: Optional[str] = None
    petPolicy: Optional[str] = None
    cuisine: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    rating: Optional[float] = None
    reviewCount: Optional[int] = None
    priceRange: Optional[str] = None
    image: Optional[str] = None
    petMenuItems: Optional[List[str]] = None
    timings: Optional[str] = None
    phone: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    featured: Optional[bool] = None
    verified: Optional[bool] = None
    petMenuImage: Optional[str] = None
    conciergeRecommendation: Optional[str] = None
    zomatoLink: Optional[str] = None
    googleMapsLink: Optional[str] = None
    specialOffers: Optional[str] = None
    address: Optional[str] = None
    birthdayPerks: Optional[bool] = None
    country: Optional[str] = None
    state: Optional[str] = None


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
        "restaurant_area": restaurant.get("area"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    logger.info(f"New reservation: {reservation_doc['id']} at {restaurant.get('name')}")
    
    # Send confirmation email to customer
    if RESEND_API_KEY and reservation.email:
        try:
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": [reservation.email],
                "subject": f"🍽️ Reservation Request - {restaurant.get('name')}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🐾 The Doggy Company</h1>
                        <p style="color: white; opacity: 0.9;">Dine Pillar</p>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #1f2937;">Hi {reservation.name}! 👋</h2>
                        <p style="color: #4b5563;">Your reservation request has been submitted!</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #1f2937; margin-top: 0;">📍 {restaurant.get('name')}</h3>
                            <p style="color: #6b7280; margin: 5px 0;">{restaurant.get('area')}, {restaurant.get('city')}</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                            <p style="color: #4b5563;"><strong>📅 Date:</strong> {reservation.date}</p>
                            <p style="color: #4b5563;"><strong>🕐 Time:</strong> {reservation.time}</p>
                            <p style="color: #4b5563;"><strong>👥 Guests:</strong> {reservation.guests}</p>
                            <p style="color: #4b5563;"><strong>🐕 Pets:</strong> {reservation.pets}</p>
                            {f'<p style="color: #16a34a;"><strong>🍽️ Pet Meal Pre-order:</strong> Yes</p>' if reservation.petMealPreorder else ''}
                        </div>
                        
                        <p style="color: #4b5563;">Our team will confirm your reservation within 2 hours. You'll receive another email once confirmed.</p>
                        
                        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                            Questions? Reply to this email or chat with Your Concierge® on our website.
                        </p>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 The Doggy Company | woof@thedoggycompany.in</p>
                    </div>
                </div>
                """
            })
            logger.info(f"Reservation confirmation email sent to {reservation.email}")
        except Exception as e:
            logger.error(f"Failed to send reservation email: {e}")
    
    # Send notification email to admin
    if RESEND_API_KEY:
        try:
            notification_email = os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggybakery.in")
            resend.Emails.send({
                "from": f"Dine Reservations <{SENDER_EMAIL}>",
                "to": [notification_email],
                "subject": f"🆕 New Reservation - {restaurant.get('name')} ({reservation.date})",
                "html": f"""
                <div style="font-family: Arial, sans-serif;">
                    <h2>New Dining Reservation</h2>
                    <p><strong>Restaurant:</strong> {restaurant.get('name')} ({restaurant.get('area')}, {restaurant.get('city')})</p>
                    <p><strong>Customer:</strong> {reservation.name}</p>
                    <p><strong>Phone:</strong> {reservation.phone}</p>
                    <p><strong>Email:</strong> {reservation.email}</p>
                    <p><strong>Date/Time:</strong> {reservation.date} at {reservation.time}</p>
                    <p><strong>Guests:</strong> {reservation.guests} | <strong>Pets:</strong> {reservation.pets}</p>
                    <p><strong>Pet Meal Pre-order:</strong> {'Yes' if reservation.petMealPreorder else 'No'}</p>
                    {f'<p><strong>Special Requests:</strong> {reservation.specialRequests}</p>' if reservation.specialRequests else ''}
                    <p style="margin-top: 20px;"><a href="https://thedoggycompany.in/admin" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin</a></p>
                </div>
                """
            })
        except Exception as e:
            logger.error(f"Failed to send admin notification: {e}")
    
    return {
        "message": "Reservation request submitted",
        "reservation_id": reservation_doc["id"],
        "status": "pending"
    }


# ==================== USER DINING HISTORY ====================

@dine_router.get("/dine/my-reservations")
async def get_my_reservations(user_id: Optional[str] = None, email: Optional[str] = None):
    """Get user's dining reservations"""
    if not user_id and not email:
        raise HTTPException(status_code=400, detail="user_id or email required")
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    elif email:
        query["email"] = email
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Categorize by status
    upcoming = [r for r in reservations if r.get("status") in ["pending", "confirmed"]]
    past = [r for r in reservations if r.get("status") in ["completed", "cancelled", "no_show"]]
    
    return {
        "reservations": reservations,
        "upcoming": upcoming,
        "past": past,
        "total": len(reservations)
    }


@dine_router.get("/dine/my-dining-history")
async def get_my_dining_history(user_id: Optional[str] = None, email: Optional[str] = None):
    """Get complete dining history including reservations, visits, and meetups"""
    if not user_id and not email:
        raise HTTPException(status_code=400, detail="user_id or email required")
    
    # Build query to match either user_id OR email for reservations
    res_conditions = []
    if user_id:
        res_conditions.append({"user_id": user_id})
    if email:
        res_conditions.append({"email": email})
    res_query = {"$or": res_conditions} if len(res_conditions) > 1 else res_conditions[0]
    reservations = await db.reservations.find(res_query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Build query for visits - match user_id OR user_email
    visit_conditions = []
    if user_id:
        visit_conditions.append({"user_id": user_id})
    if email:
        visit_conditions.append({"user_email": email})
    visit_query = {"$or": visit_conditions} if len(visit_conditions) > 1 else visit_conditions[0]
    visits = await db.restaurant_visits.find(visit_query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Get meetup requests (sent and received)
    meetup_query = {"$or": [{"requester_id": user_id}, {"target_user_id": user_id}]} if user_id else {}
    meetups = await db.meetup_requests.find(meetup_query, {"_id": 0}).sort("created_at", -1).to_list(50) if user_id else []
    
    return {
        "reservations": {
            "items": reservations,
            "upcoming": [r for r in reservations if r.get("status") in ["pending", "confirmed"]],
            "past": [r for r in reservations if r.get("status") not in ["pending", "confirmed"]]
        },
        "visits": {
            "items": visits,
            "upcoming": [v for v in visits if v.get("status") == "scheduled"],
            "past": [v for v in visits if v.get("status") != "scheduled"]
        },
        "meetups": {
            "items": meetups,
            "pending": [m for m in meetups if m.get("status") == "pending"],
            "accepted": [m for m in meetups if m.get("status") == "accepted"]
        }
    }


# ==================== ADMIN ROUTES ====================

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
    
    # Stats
    stats = {
        "total": len(reservations),
        "pending": len([r for r in reservations if r.get("status") == "pending"]),
        "confirmed": len([r for r in reservations if r.get("status") == "confirmed"]),
        "completed": len([r for r in reservations if r.get("status") == "completed"]),
        "cancelled": len([r for r in reservations if r.get("status") == "cancelled"])
    }
    
    return {"reservations": reservations, "stats": stats}


@dine_router.put("/admin/dine/reservations/{reservation_id}/status")
async def admin_update_reservation_status(
    reservation_id: str,
    status: str,
    username: str = Depends(verify_admin)
):
    """Update reservation status (admin)"""
    valid_statuses = ["pending", "confirmed", "completed", "cancelled", "no_show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send email notification to customer on status change
    if RESEND_API_KEY and reservation.get("email") and status in ["confirmed", "cancelled"]:
        try:
            if status == "confirmed":
                subject = f"✅ Reservation Confirmed - {reservation.get('restaurant_name')}"
                message = f"Great news! Your reservation at {reservation.get('restaurant_name')} on {reservation.get('date')} at {reservation.get('time')} has been confirmed."
            else:
                subject = f"❌ Reservation Cancelled - {reservation.get('restaurant_name')}"
                message = f"We're sorry, but your reservation at {reservation.get('restaurant_name')} on {reservation.get('date')} has been cancelled. Please contact us for assistance."
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": [reservation.get("email")],
                "subject": subject,
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: {'#16a34a' if status == 'confirmed' else '#dc2626'}; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">{'✅' if status == 'confirmed' else '❌'} Reservation {status.title()}</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #4b5563;">{message}</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p><strong>Restaurant:</strong> {reservation.get('restaurant_name')}</p>
                            <p><strong>Date:</strong> {reservation.get('date')}</p>
                            <p><strong>Time:</strong> {reservation.get('time')}</p>
                            <p><strong>Guests:</strong> {reservation.get('guests')} | <strong>Pets:</strong> {reservation.get('pets')}</p>
                        </div>
                    </div>
                </div>
                """
            })
        except Exception as e:
            logger.error(f"Failed to send status update email: {e}")
    
    return {"message": f"Reservation status updated to {status}"}


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
    """Update a restaurant (admin) - full update"""
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


@dine_router.patch("/admin/dine/restaurants/{restaurant_id}")
async def admin_patch_restaurant(
    restaurant_id: str,
    updates: RestaurantPartialUpdate,
    username: str = Depends(verify_admin)
):
    """Partial update a restaurant (admin) - only updates provided fields"""
    existing = await db.restaurants.find_one({"id": restaurant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Only include non-None fields
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
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
async def schedule_visit(visit: RestaurantVisit, user_id: Optional[str] = None, user_email: Optional[str] = None):
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
    
    # Get user info if user_id provided
    user_info = None
    if user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if user:
            user_info = user
            user_email = user_email or user.get("email")
    
    visit_doc = {
        "id": f"visit-{uuid.uuid4().hex[:12]}",
        "restaurant_id": visit.restaurant_id,
        "restaurant_name": restaurant.get("name"),
        "restaurant_area": restaurant.get("area"),
        "restaurant_city": restaurant.get("city"),
        "user_id": user_id,
        "user_email": user_email,
        "user_name": user_info.get("name") if user_info else None,
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
    
    # Send confirmation email
    if RESEND_API_KEY and user_email:
        try:
            time_slot_text = {
                "morning": "Morning (9 AM - 12 PM)",
                "afternoon": "Afternoon (12 PM - 5 PM)",
                "evening": "Evening (5 PM - 10 PM)"
            }.get(visit.time_slot, visit.time_slot)
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": [user_email],
                "subject": f"🐕 Pet Buddy Visit Scheduled - {restaurant.get('name')}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🐾 Pet Buddy Meetups</h1>
                        <p style="color: white; opacity: 0.9;">The Doggy Company</p>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #1f2937;">Your Visit is Scheduled! 🎉</h2>
                        
                        <div style="background: #faf5ff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9d5ff;">
                            <h3 style="color: #7c3aed; margin-top: 0;">📍 {restaurant.get('name')}</h3>
                            <p style="color: #6b7280; margin: 5px 0;">{restaurant.get('area')}, {restaurant.get('city')}</p>
                            <hr style="border: none; border-top: 1px solid #e9d5ff; margin: 15px 0;">
                            <p style="color: #4b5563;"><strong>📅 Date:</strong> {visit.date}</p>
                            <p style="color: #4b5563;"><strong>🕐 Time:</strong> {time_slot_text}</p>
                            {f'<p style="color: #4b5563;"><strong>📝 Notes:</strong> {visit.notes}</p>' if visit.notes else ''}
                        </div>
                        
                        {f'<p style="color: #16a34a; background: #f0fdf4; padding: 15px; border-radius: 8px;">✅ <strong>Looking for Pet Buddies!</strong> Other pet parents will be able to see your visit and send meetup requests.</p>' if visit.looking_for_buddies else ''}
                        
                        <p style="color: #4b5563;">When someone wants to meet up with you, you'll receive a notification. Check back on the Dine page to see who else is visiting!</p>
                        
                        <p style="margin-top: 20px;">
                            <a href="https://thedoggycompany.in/dine" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Pet Buddies</a>
                        </p>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 The Doggy Company | woof@thedoggycompany.in</p>
                    </div>
                </div>
                """
            })
            logger.info(f"Visit confirmation email sent to {user_email}")
        except Exception as e:
            logger.error(f"Failed to send visit email: {e}")
    
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
    
    # Create notification for the target user
    if visit.get("user_id"):
        notification = {
            "id": f"notif-{uuid.uuid4().hex[:12]}",
            "user_id": visit.get("user_id"),
            "type": "meetup_request",
            "title": "New Meetup Request! 🐕",
            "message": f"Someone wants to meet up with you at {visit.get('restaurant_name')} on {visit.get('date')}",
            "related_id": meetup_doc["id"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.dine_notifications.insert_one(notification)
    
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
    # Get the meetup request first
    meetup = await db.meetup_requests.find_one({"id": request_id})
    if not meetup:
        raise HTTPException(status_code=404, detail="Request not found")
    
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
    
    # Send notification to the requester
    if meetup.get("requester_id"):
        status_text = "accepted" if accept else "declined"
        notification = {
            "id": f"notif-{uuid.uuid4().hex[:12]}",
            "user_id": meetup.get("requester_id"),
            "type": f"meetup_{status_text}",
            "title": f"Meetup Request {status_text.title()}! {'🎉' if accept else '😢'}",
            "message": f"Your meetup request at {meetup.get('restaurant_name')} on {meetup.get('visit_date')} was {status_text}",
            "related_id": request_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.dine_notifications.insert_one(notification)
    
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


# ==================== NOTIFICATIONS SYSTEM ====================

@dine_router.get("/dine/notifications")
async def get_user_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.dine_notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    unread_count = await db.dine_notifications.count_documents({
        "user_id": user_id, "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@dine_router.post("/dine/notifications")
async def create_notification(
    user_id: str,
    notification_type: str,  # meetup_request, meetup_accepted, meetup_declined, visit_reminder
    title: str,
    message: str,
    related_id: Optional[str] = None  # meetup_id or visit_id
):
    """Create a notification for a user"""
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "related_id": related_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.dine_notifications.insert_one(notification)
    notification.pop("_id", None)
    
    return {"message": "Notification created", "notification": notification}


@dine_router.put("/dine/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read"""
    result = await db.dine_notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@dine_router.put("/dine/notifications/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    result = await db.dine_notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}


# Helper function to send notification when meetup request is created
async def send_meetup_notification(target_user_id: str, requester_name: str, restaurant_name: str, visit_date: str, meetup_id: str):
    """Send notification for new meetup request"""
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:12]}",
        "user_id": target_user_id,
        "type": "meetup_request",
        "title": "New Meetup Request! 🐕",
        "message": f"{requester_name or 'A pet parent'} wants to meet up at {restaurant_name} on {visit_date}",
        "related_id": meetup_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.dine_notifications.insert_one(notification)
    logger.info(f"Notification sent to {target_user_id} for meetup {meetup_id}")
