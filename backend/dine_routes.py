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
from timestamp_utils import get_utc_timestamp
from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

# Import auto-ticket creation
from ticket_auto_create import create_ticket_from_event, update_ticket_from_event

logger = logging.getLogger(__name__)

# Create router
dine_router = APIRouter(prefix="/api", tags=["Dine"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin notification helper (will be set from server.py)
_create_admin_notification = None

def set_admin_notification_handler(handler):
    """Set the admin notification handler from server.py"""
    global _create_admin_notification
    _create_admin_notification = handler

async def notify_admin(notification_type, title, message, category="dine", related_id=None, link_to=None, priority="normal", metadata=None):
    """Create admin notification if handler is set"""
    if _create_admin_notification:
        try:
            await _create_admin_notification(
                notification_type=notification_type,
                title=title,
                message=message,
                category=category,
                related_id=related_id,
                link_to=link_to,
                priority=priority,
                metadata=metadata
            )
        except Exception as e:
            logger.error(f"Failed to create admin notification: {e}")


# Standalone seed functions (callable from server.py seed_all_pillars)
async def seed_dine_bundles_data():
    """Seed dine bundles - standalone version for auto-seed"""
    sample_bundles = [
        {
            "id": "dine-bundle-birthday",
            "name": "Pawty Birthday Package",
            "description": "Complete birthday celebration kit!",
            "image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800",
            "bundle_price": 2499,
            "original_price": 3200,
            "category": "party_package",
            "items": ["Birthday Cake (500g)", "Gourmet Treats Pack", "Party Hat Set"],
            "for_occasion": "birthday",
            "discount_percent": 22,
            "featured": True,
            "active": True,
            "tags": ["birthday", "celebration"]
        }
    ]
    existing = await db.dine_bundles.count_documents({})
    if existing > 0:
        return {"bundles_seeded": 0, "message": "Bundles exist"}
    for b in sample_bundles:
        b["created_at"] = get_utc_timestamp()
        await db.dine_bundles.insert_one(b)
    return {"bundles_seeded": len(sample_bundles)}

async def seed_dine_products_data():
    """Seed dine products - standalone version for auto-seed"""
    sample_products = [
        {
            "id": "dine-prod-bowl",
            "name": "Portable Travel Bowl Set",
            "price": 599,
            "category": "dine",
            "dine_type": "accessories",
            "in_stock": True
        }
    ]
    existing = await db.products.count_documents({"category": "dine"})
    if existing > 0:
        return {"products_seeded": 0, "message": "Products exist"}
    for p in sample_products:
        p["created_at"] = get_utc_timestamp()
        await db.products.insert_one(p)
    return {"products_seeded": len(sample_products)}

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

class DinePawReward(BaseModel):
    """Dine-specific Paw Reward"""
    enabled: bool = True
    reward_type: str = "free_product"  # free_product, discount
    reward_name: str = "Birthday Cake Reward"
    reward_description: str = "Free TDB birthday cake when celebrating your dog's birthday here"
    product_id: Optional[str] = None  # Specific product ID
    product_category: str = "cakes"  # Default to cakes
    product_collection: str = "bow-treats"  # Small bow treats
    max_value: float = 500
    trigger_condition: str = "birthday"  # birthday, first_visit, any_visit
    custom_message: Optional[str] = None


class RestaurantLocation(BaseModel):
    """Restaurant Location Details"""
    full_address: Optional[str] = None
    area: Optional[str] = None
    city: str = ""
    state: Optional[str] = None
    country: str = "India"
    pincode: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    google_maps_link: Optional[str] = None
    google_place_id: Optional[str] = None


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
    # NEW: Location details (like Stay)
    full_address: Optional[str] = None
    pincode: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    google_place_id: Optional[str] = None
    # NEW: Paw Reward
    paw_reward: Optional[DinePawReward] = None


class ReservationRequest(BaseModel):
    restaurant_id: str
    name: str
    phone: str
    email: str
    date: str
    time: str
    guests: int = 2
    pets: Optional[Any] = 1  # Can be int (count) or list of pet objects
    pets_count: Optional[int] = None  # Explicit pet count for multi-pet
    pet_ids: Optional[List[str]] = None  # Array of selected pet IDs
    petMealPreorder: bool = False
    specialRequests: Optional[str] = None
    # Pet details - for single pet (backward compat)
    pet_name: str = ""
    pet_breed: Optional[str] = None
    pet_about: Optional[str] = None


class RestaurantVisit(BaseModel):
    restaurant_id: str
    date: str
    time_slot: str  # morning, afternoon, evening
    pet_ids: List[str] = []
    looking_for_buddies: bool = True
    notes: Optional[str] = None
    notification_preference: str = "email"  # email or whatsapp
    # User details
    title: str = "Mr."  # Mr., Ms., Mrs., Dr.
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    whatsapp: str = ""
    # Social profiles for verification
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    # Multiple pets support
    pets: List[dict] = []  # [{name, breed, about, photo}]
    # Safety agreement
    safety_agreed: bool = False
    # Legacy single pet fields (backward compatibility)
    pet_name: str = ""
    pet_breed: Optional[str] = None
    pet_about: Optional[str] = None
    pet_photo: Optional[str] = None


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
    # NEW: Location details
    full_address: Optional[str] = None
    pincode: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    google_place_id: Optional[str] = None
    # NEW: Paw Reward
    paw_reward: Optional[DinePawReward] = None


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
    """Create a reservation request
    
    ENFORCES UNIFIED FLOW: Notification → Service Desk Ticket → Unified Inbox
    """
    # Verify restaurant exists
    restaurant = await db.restaurants.find_one({"id": reservation.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Generate unified flow IDs
    reservation_id = f"res-{uuid.uuid4().hex[:12]}"
    ticket_id = f"TKT-DINE-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now = get_utc_timestamp()
    
    # Handle pets field - can be int or list of pet objects
    pet_count = 1
    pet_names = []
    if isinstance(reservation.pets, list):
        pet_names = [p.get("name", "") for p in reservation.pets if isinstance(p, dict) and p.get("name")]
        pet_count = len(reservation.pets)
    elif isinstance(reservation.pets, int):
        pet_count = reservation.pets
    elif reservation.pets_count:
        pet_count = reservation.pets_count
    
    # Use first pet name for backward compat if pet_name not set
    if not reservation.pet_name and pet_names:
        reservation.pet_name = pet_names[0]
    
    reservation_data = reservation.model_dump()
    reservation_data["pets_count"] = pet_count  # Store normalized count
    reservation_data["pet_names"] = pet_names  # Store all pet names
    
    reservation_doc = {
        "id": reservation_id,
        **reservation_data,
        "restaurant_name": restaurant.get("name"),
        "restaurant_city": restaurant.get("city"),
        "restaurant_area": restaurant.get("area"),
        "status": "pending",
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "created_at": now,
        "updated_at": now,
        "unified_flow_processed": True
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    logger.info(f"New reservation: {reservation_id} at {restaurant.get('name')}")
    
    # Build pet display string for email
    pet_display = ', '.join(pet_names) if pet_names else reservation.pet_name or f'{pet_count} pet(s)'
    
    description = f"Dine Reservation at {restaurant.get('name')} on {reservation.date} at {reservation.time}. {reservation.guests} guests, {pet_count} pets. Customer: {reservation.name} ({reservation.phone})"
    
    # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": "dine_reservation",
        "pillar": "dine",
        "title": f"🍽️ New Reservation - {restaurant.get('name')}",
        "message": f"{reservation.name} booked for {reservation.date} at {reservation.time}",
        "read": False,
        "status": "unread",
        "urgency": "medium",
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "reservation_id": reservation_id,
        "customer": {"name": reservation.name, "email": reservation.email, "phone": reservation.phone},
        "pet": {"name": reservation.pet_name, "breed": reservation.pet_breed},
        "link": f"/admin?tab=dine&subtab=reservations&id={reservation_id}",
        "created_at": now,
        "read_at": None
    })
    logger.info(f"[UNIFIED FLOW] Dine reservation notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (MANDATORY) ====================
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "reservation_id": reservation_id,
        "type": "dine_reservation",
        "category": "dine",
        "sub_category": "reservation",
        "subject": f"Dine Reservation - {restaurant.get('name')} ({reservation.date})",
        "description": description,
        "status": "open",
        "priority": "normal",
        "channel": "web",
        "pillar": "dine",
        "member": {"name": reservation.name, "email": reservation.email, "phone": reservation.phone},
        "pet": {"name": reservation.pet_name, "breed": reservation.pet_breed},
        "metadata": {
            "restaurant_name": restaurant.get("name"),
            "restaurant_area": restaurant.get("area"),
            "restaurant_city": restaurant.get("city"),
            "date": reservation.date,
            "time": reservation.time,
            "guests": reservation.guests,
            "pets": pet_count
        },
        "created_at": now,
        "updated_at": now,
        "unified_flow_processed": True
    }
    await db.service_desk_tickets.insert_one(ticket_doc)
    await db.tickets.insert_one(ticket_doc)
    logger.info(f"[UNIFIED FLOW] Dine service desk ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (MANDATORY) ====================
    inbox_entry = {
        "id": inbox_id,
        "request_id": reservation_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "pillar": "dine",
        "request_type": "reservation",
        "category": "dine",
        "status": "new",
        "urgency": "medium",
        "customer_name": reservation.name,
        "customer_email": reservation.email,
        "customer_phone": reservation.phone,
        "member": {"name": reservation.name, "email": reservation.email, "phone": reservation.phone},
        "pet": {"name": reservation.pet_name, "breed": reservation.pet_breed},
        "preview": f"Dine Reservation: {restaurant.get('name')} on {reservation.date} at {reservation.time}",
        "message": description,
        "full_content": description,
        "metadata": {
            "reservation_id": reservation_id,
            "restaurant_id": reservation.restaurant_id,
            "restaurant_name": restaurant.get("name"),
            "date": reservation.date,
            "time": reservation.time,
            "guests": reservation.guests,
            "pets": pet_count
        },
        "tags": ["dine", "reservation"],
        "created_at": now,
        "updated_at": now,
        "unified_flow_processed": True
    }
    await db.channel_intakes.insert_one(inbox_entry)
    logger.info(f"[UNIFIED FLOW] Dine unified inbox entry created: {inbox_id}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: Dine reservation {reservation_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
    
    # Send confirmation email to customer (existing email code, non-blocking)
    if RESEND_API_KEY and reservation.email:
        try:
            pet_info_html = ""
            if pet_names:
                pet_info_html = f"""
                <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fbcfe8;">
                    <p style="color: #be185d; margin: 0;"><strong>🐕 Bringing:</strong> {pet_display}</p>
                </div>
                """
            elif reservation.pet_name:
                pet_info_html = f"""
                <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fbcfe8;">
                    <p style="color: #be185d; margin: 0;"><strong>🐕 Bringing:</strong> {reservation.pet_name}{f' ({reservation.pet_breed})' if reservation.pet_breed else ''}</p>
                    {f'<p style="color: #9d174d; margin: 5px 0 0; font-style: italic;">"{reservation.pet_about}"</p>' if reservation.pet_about else ''}
                </div>
                """
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": reservation.email,
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
                            <p style="color: #4b5563;"><strong>🐕 Pets:</strong> {pet_count}</p>
                            {f'<p style="color: #16a34a;"><strong>🍽️ Pet Meal Pre-order:</strong> Yes</p>' if reservation.petMealPreorder else ''}
                        </div>
                        
                        {pet_info_html}
                        
                        <p style="color: #4b5563;">Our team will confirm your reservation within 2 hours. You'll receive another email once confirmed.</p>
                        <p style="color: #6b7280; font-size: 12px;">Ticket ID: {ticket_id}</p>
                        
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
    
    return {
        "success": True,
        "message": "Reservation request submitted",
        "reservation_id": reservation_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
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
    
    old_status = reservation.get("status")
    
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": status, "updated_at": get_utc_timestamp()}}
    )
    
    # Send notification on status change
    if status != old_status:
        # Send email notification to customer
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
                    "to": reservation.get("email"),
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
                logger.info(f"Reservation status update email sent to {reservation.get('email')}")
            except Exception as e:
                logger.error(f"Failed to send status update email: {e}")
        
        # Also trigger notification engine for logging
        try:
            from notification_engine import notify_booking_status_change
            await notify_booking_status_change(
                booking={
                    "id": reservation_id,
                    "guest_name": reservation.get("name"),
                    "email": reservation.get("email"),
                    "phone": reservation.get("phone"),
                    "restaurant_name": reservation.get("restaurant_name"),
                    "date": reservation.get("date"),
                    "time": reservation.get("time"),
                    "guests": reservation.get("guests"),
                    "pets": reservation.get("pets")
                },
                new_status=status,
                pillar="dine",
                triggered_by="admin"
            )
            logger.info(f"Notification engine triggered for reservation {reservation_id}: {old_status} -> {status}")
        except Exception as e:
            logger.error(f"Failed to trigger notification engine: {e}")
        
        # Update linked service desk ticket
        try:
            await update_ticket_from_event(db, "reservation", reservation_id, {
                "new_status": status,
                "pillar": "dine"
            })
        except Exception as e:
            logger.error(f"Failed to update ticket for reservation: {e}")
    
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
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
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
        "updated_at": get_utc_timestamp()
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
    update_data["updated_at"] = get_utc_timestamp()
    
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


@dine_router.post("/admin/dine/restaurants/{restaurant_id}/paw-reward")
async def update_restaurant_paw_reward(
    restaurant_id: str,
    paw_reward: DinePawReward,
    username: str = Depends(verify_admin)
):
    """Update Paw Reward for a restaurant"""
    result = await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": {
            "paw_reward": paw_reward.model_dump(),
            "birthdayPerks": paw_reward.enabled,  # Also update legacy field
            "updated_at": get_utc_timestamp()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return {"message": "Paw Reward updated", "paw_reward": paw_reward.model_dump()}


@dine_router.post("/admin/dine/restaurants/assign-paw-rewards")
async def assign_paw_rewards_to_restaurants(
    restaurant_ids: List[str] = None,
    all_restaurants: bool = False,
    username: str = Depends(verify_admin)
):
    """Assign default Paw Rewards to multiple restaurants"""
    default_reward = DinePawReward(
        enabled=True,
        reward_type="free_product",
        reward_name="Birthday Cake Reward",
        reward_description="Free TDB birthday cake when celebrating your dog's birthday here",
        product_category="cakes",
        product_collection="bow-treats",
        max_value=500,
        trigger_condition="birthday"
    ).model_dump()
    
    if all_restaurants:
        # Update all restaurants without paw_reward
        result = await db.restaurants.update_many(
            {"paw_reward": {"$exists": False}},
            {"$set": {
                "paw_reward": default_reward,
                "birthdayPerks": True,
                "updated_at": get_utc_timestamp()
            }}
        )
        updated = result.modified_count
    elif restaurant_ids:
        result = await db.restaurants.update_many(
            {"id": {"$in": restaurant_ids}},
            {"$set": {
                "paw_reward": default_reward,
                "birthdayPerks": True,
                "updated_at": get_utc_timestamp()
            }}
        )
        updated = result.modified_count
    else:
        raise HTTPException(status_code=400, detail="Provide restaurant_ids or set all_restaurants=true")
    
    return {"message": f"Paw Rewards assigned to {updated} restaurants", "updated": updated}


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
    
    # Define CSV fields (including new location and paw reward fields)
    fieldnames = [
        'id', 'name', 'area', 'city', 'state', 'country', 
        'full_address', 'pincode', 'geo_lat', 'geo_lng', 'googleMapsLink', 'google_place_id',
        'petMenuAvailable', 'petPolicy',
        'cuisine', 'tags', 'rating', 'reviewCount', 'priceRange', 'image',
        'petMenuItems', 'timings', 'phone', 'instagram', 'website',
        'zomatoLink', 'address', 'birthdayPerks', 'specialOffers',
        'petMenuImage', 'conciergeRecommendation',
        'featured', 'verified',
        'paw_reward_enabled', 'paw_reward_type', 'paw_reward_max_value',
        'created_at', 'updated_at'
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
        # Extract paw_reward fields
        paw_reward = row.get('paw_reward', {})
        if paw_reward:
            row['paw_reward_enabled'] = paw_reward.get('enabled', False)
            row['paw_reward_type'] = paw_reward.get('reward_type', '')
            row['paw_reward_max_value'] = paw_reward.get('max_value', 0)
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
                    "updated_at": get_utc_timestamp()
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
                    restaurant_doc["created_at"] = get_utc_timestamp()
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
    
    # Use form data or fallback to user data
    contact_email = visit.email or user_email
    display_name = f"{visit.first_name} {visit.last_name}".strip() if visit.first_name else (user_info.get("name") if user_info else None)
    
    # Combine pets from form and pet_ids
    all_pets = visit.pets if visit.pets else []
    if not all_pets and visit.pet_name:
        # Fallback to single pet format
        all_pets = [{"name": visit.pet_name, "breed": visit.pet_breed, "about": visit.pet_about, "photo": visit.pet_photo}]
    
    visit_doc = {
        "id": f"visit-{uuid.uuid4().hex[:12]}",
        "restaurant_id": visit.restaurant_id,
        "restaurant_name": restaurant.get("name"),
        "restaurant_area": restaurant.get("area"),
        "restaurant_city": restaurant.get("city"),
        "user_id": user_id,
        "user_email": contact_email,
        "user_name": display_name,
        # User details from form
        "title": visit.title,
        "first_name": visit.first_name,
        "last_name": visit.last_name,
        "email": visit.email,
        "whatsapp": visit.whatsapp,
        # Social profiles for verification
        "instagram": visit.instagram,
        "facebook": visit.facebook,
        "linkedin": visit.linkedin,
        # Multiple pets support
        "pets": all_pets or pets_info,
        # Legacy single pet fields
        "pet_name": visit.pet_name or (all_pets[0].get("name") if all_pets else ""),
        "pet_breed": visit.pet_breed or (all_pets[0].get("breed") if all_pets else None),
        "pet_about": visit.pet_about or (all_pets[0].get("about") if all_pets else None),
        "pet_photo": visit.pet_photo or (all_pets[0].get("photo") if all_pets else None),
        # Visit details
        "date": visit.date,
        "time_slot": visit.time_slot,
        "looking_for_buddies": visit.looking_for_buddies,
        "notes": visit.notes,
        "notification_preference": visit.notification_preference,
        # Safety
        "safety_agreed": visit.safety_agreed,
        "safety_agreed_at": get_utc_timestamp() if visit.safety_agreed else None,
        "status": "scheduled",
        "meetup_requests": [],
        "created_at": get_utc_timestamp()
    }
    
    await db.restaurant_visits.insert_one(visit_doc)
    visit_doc.pop("_id", None)
    
    # Send confirmation email
    confirmation_email = visit.email or contact_email
    if RESEND_API_KEY and confirmation_email:
        try:
            time_slot_text = {
                "morning": "Morning (9 AM - 12 PM)",
                "afternoon": "Afternoon (12 PM - 5 PM)",
                "evening": "Evening (5 PM - 10 PM)"
            }.get(visit.time_slot, visit.time_slot)
            
            pet_info_html = ""
            if visit.pet_name:
                pet_info_html = f"""
                <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fbcfe8;">
                    <p style="color: #be185d; margin: 0;"><strong>🐕 Bringing:</strong> {visit.pet_name}{f' ({visit.pet_breed})' if visit.pet_breed else ''}</p>
                    {f'<p style="color: #9d174d; margin: 5px 0 0; font-style: italic;">"{visit.pet_about}"</p>' if visit.pet_about else ''}
                </div>
                """
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": confirmation_email,
                "subject": f"🐕 Pet Buddy Visit Scheduled - {restaurant.get('name')}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🐾 Pet Buddy Meetups</h1>
                        <p style="color: white; opacity: 0.9;">The Doggy Company</p>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #1f2937;">Your Visit is Scheduled! 🎉</h2>
                        <p style="color: #6b7280;">Hey {visit.title} {visit.first_name} {visit.last_name}!</p>
                        
                        <div style="background: #faf5ff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9d5ff;">
                            <h3 style="color: #7c3aed; margin-top: 0;">📍 {restaurant.get('name')}</h3>
                            <p style="color: #6b7280; margin: 5px 0;">{restaurant.get('area')}, {restaurant.get('city')}</p>
                            <hr style="border: none; border-top: 1px solid #e9d5ff; margin: 15px 0;">
                            <p style="color: #4b5563;"><strong>📅 Date:</strong> {visit.date}</p>
                            <p style="color: #4b5563;"><strong>🕐 Time:</strong> {time_slot_text}</p>
                            {f'<p style="color: #4b5563;"><strong>📝 Notes:</strong> {visit.notes}</p>' if visit.notes else ''}
                        </div>
                        
                        {pet_info_html}
                        
                        {f'<p style="color: #16a34a; background: #f0fdf4; padding: 15px; border-radius: 8px;">✅ <strong>Looking for Pet Buddies!</strong> Other pet parents will be able to see your visit and send meetup requests.</p>' if visit.looking_for_buddies else ''}
                        
                        <p style="color: #4b5563;">When someone wants to meet up with you, you'll receive a notification via {visit.notification_preference}. Check back on the Dine page to see who else is visiting!</p>
                        
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
            logger.info(f"Visit confirmation email sent to {confirmation_email}")
        except Exception as e:
            logger.error(f"Failed to send visit email: {e}")
    
    # Auto-create Service Desk ticket for buddy visit
    try:
        ticket_id = await create_ticket_from_event(db, "buddy_visit", {
            "visit_id": visit_doc["id"],
            "user_name": visit_doc.get("user_name"),
            "user_email": user_email,
            "restaurant_name": restaurant.get("name"),
            "restaurant_area": restaurant.get("area"),
            "restaurant_city": restaurant.get("city"),
            "date": visit.date,
            "time_slot": visit.time_slot,
            "pets": pets_info,
            "looking_for_buddies": visit.looking_for_buddies,
            "notes": visit.notes
        })
        logger.info(f"Auto-created ticket {ticket_id} for buddy visit {visit_doc['id']}")
    except Exception as e:
        logger.error(f"Failed to auto-create ticket for buddy visit: {e}")
    
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
    
    # Get requester info
    requester_info = None
    requester_email = None
    if user_id:
        requester_info = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1, "phone": 1})
        requester_email = requester_info.get("email") if requester_info else None
    
    meetup_doc = {
        "id": f"meetup-{uuid.uuid4().hex[:12]}",
        "visit_id": request.visit_id,
        "requester_id": user_id,
        "requester_name": requester_info.get("name") if requester_info else "Pet Parent",
        "requester_email": requester_email,
        "target_user_id": visit.get("user_id"),
        "target_user_name": visit.get("user_name"),
        "restaurant_id": visit.get("restaurant_id"),
        "restaurant_name": visit.get("restaurant_name"),
        "restaurant_city": visit.get("restaurant_city"),
        "visit_date": visit.get("date"),
        "time_slot": visit.get("time_slot"),
        "message": request.message,
        "status": "pending",  # pending, accepted, declined
        "created_at": get_utc_timestamp()
    }
    
    await db.meetup_requests.insert_one(meetup_doc)
    
    # Add to visit's meetup_requests list
    await db.restaurant_visits.update_one(
        {"id": request.visit_id},
        {"$push": {"meetup_requests": meetup_doc["id"]}}
    )
    
    # Create in-app notification for the target user
    if visit.get("user_id"):
        notification = {
            "id": f"notif-{uuid.uuid4().hex[:12]}",
            "user_id": visit.get("user_id"),
            "type": "meetup_request",
            "title": "New Meetup Request! 🐕",
            "message": f"Someone wants to meet up with you at {visit.get('restaurant_name')} on {visit.get('date')}",
            "related_id": meetup_doc["id"],
            "read": False,
            "created_at": get_utc_timestamp()
        }
        await db.dine_notifications.insert_one(notification)
    
    # Auto-create Service Desk ticket for meetup request
    try:
        target_info = None
        if visit.get("user_id"):
            target_info = await db.users.find_one({"id": visit.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        
        ticket_id = await create_ticket_from_event(db, "meetup_request", {
            "meetup_id": meetup_doc["id"],
            "requester_name": requester_info.get("name") if requester_info else "Pet Parent",
            "requester_email": requester_email,
            "target_user_name": target_info.get("name") if target_info else visit.get("user_name", "Pet Parent"),
            "restaurant_name": visit.get("restaurant_name"),
            "visit_date": visit.get("date"),
            "message": request.message
        })
        logger.info(f"Auto-created ticket {ticket_id} for meetup request {meetup_doc['id']}")
    except Exception as e:
        logger.error(f"Failed to auto-create ticket for meetup request: {e}")
    
    # Send notification to the TARGET user based on their preference
    target_user_email = visit.get("user_email")
    target_notification_pref = visit.get("notification_preference", "email")
    whatsapp_number = os.environ.get("REACT_APP_WHATSAPP_NUMBER", "919663185747")
    
    if target_user_email and RESEND_API_KEY:
        try:
            if target_notification_pref == "whatsapp":
                # For WhatsApp preference, send email with WhatsApp link
                wa_message = f"Hi! Someone wants to meet up with you at {visit.get('restaurant_name')} on {visit.get('date')}. Check the app for details!"
                wa_link = f"https://wa.me/{whatsapp_number}?text={wa_message.replace(' ', '%20')}"
                
                resend.Emails.send({
                    "from": f"Buddy Meet <{SENDER_EMAIL}>",
                    "to": target_user_email,
                    "subject": f"🐕 New Meetup Request at {visit.get('restaurant_name')}!",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: white; margin: 0;">New Meetup Request! 🐕</h1>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                            <p style="font-size: 16px;">Hey {visit.get('user_name', 'there')}!</p>
                            
                            <p>A fellow pet parent wants to meet up with you!</p>
                            
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #25D366;">
                                <p style="margin: 5px 0;"><strong>📍 Restaurant:</strong> {visit.get('restaurant_name')}</p>
                                <p style="margin: 5px 0;"><strong>📅 Date:</strong> {visit.get('date')}</p>
                                {f'<p style="margin: 5px 0;"><strong>💬 Their Message:</strong> {request.message}</p>' if request.message else ''}
                            </div>
                            
                            <p style="text-align: center; margin: 20px 0;">
                                <a href="{wa_link}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    💬 Chat on WhatsApp
                                </a>
                            </p>
                            
                            <p style="text-align: center; font-size: 14px; color: #6b7280;">
                                Or log in to the app to accept/decline this request
                            </p>
                        </div>
                        
                        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                The Doggy Company Concierge® | Making pet friendships happen! 🐾
                            </p>
                        </div>
                    </div>
                    """
                })
                logger.info(f"Sent WhatsApp-preferred notification email to {target_user_email}")
            else:
                # Standard email notification
                resend.Emails.send({
                    "from": f"Buddy Meet <{SENDER_EMAIL}>",
                    "to": target_user_email,
                    "subject": f"🐕 New Meetup Request at {visit.get('restaurant_name')}!",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: white; margin: 0;">New Meetup Request! 🐕</h1>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                            <p style="font-size: 16px;">Hey {visit.get('user_name', 'there')}!</p>
                            
                            <p>A fellow pet parent wants to meet up with you!</p>
                            
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
                                <p style="margin: 5px 0;"><strong>📍 Restaurant:</strong> {visit.get('restaurant_name')}</p>
                                <p style="margin: 5px 0;"><strong>📍 City:</strong> {visit.get('restaurant_city', 'N/A')}</p>
                                <p style="margin: 5px 0;"><strong>📅 Date:</strong> {visit.get('date')}</p>
                                {f'<p style="margin: 5px 0;"><strong>💬 Their Message:</strong> {request.message}</p>' if request.message else ''}
                            </div>
                            
                            <p style="text-align: center; margin: 20px 0;">
                                <a href="https://thedoggycompany.in/dine" style="background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    View Request & Respond
                                </a>
                            </p>
                            
                            <p style="font-size: 14px; color: #6b7280;">
                                Log in to accept or decline this meetup request. Our Concierge® team will help coordinate!
                            </p>
                        </div>
                        
                        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                The Doggy Company Concierge® | Making pet friendships happen! 🐾
                            </p>
                        </div>
                    </div>
                    """
                })
                logger.info(f"Sent meetup request notification email to {target_user_email}")
        except Exception as e:
            logger.error(f"Failed to send meetup notification to target user: {e}")
    
    # Send confirmation email to the REQUESTER
    if requester_email and RESEND_API_KEY:
        try:
            resend.Emails.send({
                "from": f"Buddy Meet <{SENDER_EMAIL}>",
                "to": requester_email,
                "subject": f"🐕 Meetup Request Submitted - {visit.get('restaurant_name')}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="color: white; margin: 0;">Meetup Request Sent! 💕</h1>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                        <p style="font-size: 16px;">Hey {requester_info.get('name', 'there') if requester_info else 'there'}!</p>
                        
                        <p>Your meetup request has been sent to {visit.get('user_name', 'another pet parent')} at <strong>{visit.get('restaurant_name')}</strong>!</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
                            <p style="margin: 5px 0;"><strong>📍 Restaurant:</strong> {visit.get('restaurant_name')}</p>
                            <p style="margin: 5px 0;"><strong>📍 City:</strong> {visit.get('restaurant_city', 'N/A')}</p>
                            <p style="margin: 5px 0;"><strong>📅 Date:</strong> {visit.get('date')}</p>
                            {f'<p style="margin: 5px 0;"><strong>💬 Your Message:</strong> {request.message}</p>' if request.message else ''}
                        </div>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px;">
                                <strong>What happens next?</strong><br>
                                The other pet parent will receive your request and can choose to accept or decline. 
                                We'll notify you as soon as they respond!
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280;">
                            Our Concierge® team has been notified and will help coordinate if needed.
                        </p>
                    </div>
                    
                    <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                            The Doggy Company Concierge® | Making pet friendships happen! 🐾
                        </p>
                    </div>
                </div>
                """
            })
            logger.info(f"Sent meetup confirmation email to requester {requester_email}")
        except Exception as e:
            logger.error(f"Failed to send meetup confirmation: {e}")
    
    # Create admin notification for meetup request
    await notify_admin(
        notification_type="meetup",
        title=f"🐕 New Pet Buddy Meetup Request",
        message=f"{requester_info.get('name', 'Someone') if requester_info else 'Someone'} wants to meet at {visit.get('restaurant_name', 'a restaurant')} on {visit.get('date', 'TBD')}",
        category="dine",
        related_id=meetup_doc["id"],
        link_to="/admin?tab=dine&subtab=meetups",
        priority="normal",
        metadata={
            "restaurant": visit.get("restaurant_name"),
            "requester": requester_info.get("name") if requester_info else None,
            "date": visit.get("date")
        }
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
    # Get the meetup request first
    meetup = await db.meetup_requests.find_one({"id": request_id})
    if not meetup:
        raise HTTPException(status_code=404, detail="Request not found")
    
    result = await db.meetup_requests.update_one(
        {"id": request_id, "target_user_id": user_id},
        {
            "$set": {
                "status": "accepted" if accept else "declined",
                "responded_at": get_utc_timestamp()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or not authorized")
    
    # Send notification to the requester
    status_text = "accepted" if accept else "declined"
    
    if meetup.get("requester_id"):
        # In-app notification
        notification = {
            "id": f"notif-{uuid.uuid4().hex[:12]}",
            "user_id": meetup.get("requester_id"),
            "type": f"meetup_{status_text}",
            "title": f"Meetup Request {status_text.title()}! {'🎉' if accept else '😢'}",
            "message": f"Your meetup request at {meetup.get('restaurant_name')} on {meetup.get('visit_date')} was {status_text}",
            "related_id": request_id,
            "read": False,
            "created_at": get_utc_timestamp()
        }
        await db.dine_notifications.insert_one(notification)
        
        # Get requester's email to send notification
        requester = await db.users.find_one({"id": meetup.get("requester_id")}, {"email": 1, "name": 1})
        responder = await db.users.find_one({"id": user_id}, {"name": 1})
        responder_name = responder.get("name", "A pet parent") if responder else "A pet parent"
        
        if requester and requester.get("email") and RESEND_API_KEY:
            try:
                if accept:
                    # Send acceptance email with details
                    resend.Emails.send({
                        "from": f"Buddy Meet <{SENDER_EMAIL}>",
                        "to": requester["email"],
                        "subject": f"🎉 Great News! Your Meetup Request was Accepted!",
                        "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                <h1 style="color: white; margin: 0;">Meetup Confirmed! 🐕💕🐕</h1>
                            </div>
                            
                            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                                <p style="font-size: 18px;">Hey {requester.get('name', 'there')}!</p>
                                
                                <p><strong>{responder_name}</strong> has accepted your meetup request! Time to arrange the playdate! 🎉</p>
                                
                                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                                    <p style="margin: 5px 0;"><strong>📍 Restaurant:</strong> {meetup.get('restaurant_name')}</p>
                                    <p style="margin: 5px 0;"><strong>📅 Date:</strong> {meetup.get('visit_date')}</p>
                                </div>
                                
                                <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px;">
                                        <strong>What's Next?</strong><br>
                                        Our Concierge® team will reach out to coordinate the meetup details. 
                                        Get your pup ready for some fun! 🐾
                                    </p>
                                </div>
                            </div>
                            
                            <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    The Doggy Company Concierge® | Making pet friendships happen! 🐾
                                </p>
                            </div>
                        </div>
                        """
                    })
                else:
                    # Send decline email
                    resend.Emails.send({
                        "from": f"Buddy Meet <{SENDER_EMAIL}>",
                        "to": requester["email"],
                        "subject": f"Meetup Update - {meetup.get('restaurant_name')}",
                        "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                <h1 style="color: white; margin: 0;">Meetup Update</h1>
                            </div>
                            
                            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                                <p style="font-size: 16px;">Hey {requester.get('name', 'there')},</p>
                                
                                <p>Unfortunately, the other pet parent wasn't able to accept your meetup request at {meetup.get('restaurant_name')} on {meetup.get('visit_date')}.</p>
                                
                                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px;">
                                        <strong>Don't worry!</strong><br>
                                        There are plenty of other pet parents looking for buddies. 
                                        Keep your "Looking for Buddies" option on for your next visit! 🐕
                                    </p>
                                </div>
                            </div>
                            
                            <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    The Doggy Company Concierge® | Making pet friendships happen! 🐾
                                </p>
                            </div>
                        </div>
                        """
                    })
                
                logger.info(f"Sent meetup {status_text} email to {requester['email']}")
            except Exception as e:
                logger.error(f"Failed to send meetup response email: {e}")
    
    # Also update the linked Service Desk ticket if exists
    try:
        from ticket_auto_create import update_ticket_from_event
        await update_ticket_from_event(db, "meetup_request", request_id, {
            "new_status": status_text,
            "status_message": f"Meetup request was {status_text} by {responder_name}"
        })
    except Exception as e:
        logger.error(f"Failed to update ticket for meetup response: {e}")
    
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


# ==================== ADMIN MEETUP MANAGEMENT ====================

@dine_router.put("/admin/dine/meetups/{meetup_id}/status")
async def admin_update_meetup_status(meetup_id: str, status: str, send_notification: bool = True):
    """Admin endpoint to update meetup status and optionally notify both parties"""
    valid_statuses = ["pending", "accepted", "declined", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    meetup = await db.meetup_requests.find_one({"id": meetup_id})
    if not meetup:
        raise HTTPException(status_code=404, detail="Meetup request not found")
    
    old_status = meetup.get("status")
    
    await db.meetup_requests.update_one(
        {"id": meetup_id},
        {"$set": {
            "status": status,
            "admin_updated_at": get_utc_timestamp()
        }}
    )
    
    # Send notifications if requested
    if send_notification and RESEND_API_KEY and status != old_status:
        # Get both users' info
        requester = await db.users.find_one({"id": meetup.get("requester_id")}, {"email": 1, "name": 1})
        target = await db.users.find_one({"id": meetup.get("target_user_id")}, {"email": 1, "name": 1})
        
        emails_to_notify = []
        if requester and requester.get("email"):
            emails_to_notify.append(requester["email"])
        if target and target.get("email"):
            emails_to_notify.append(target["email"])
        
        if emails_to_notify:
            try:
                status_emoji = {
                    "accepted": "🎉",
                    "declined": "😔",
                    "cancelled": "❌",
                    "completed": "✅"
                }.get(status, "📝")
                
                resend.Emails.send({
                    "from": f"Buddy Meet <{SENDER_EMAIL}>",
                    "to": emails_to_notify,
                    "subject": f"{status_emoji} Meetup Status Update - {meetup.get('restaurant_name')}",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: white; margin: 0;">Meetup Update {status_emoji}</h1>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                            <p>Your meetup at <strong>{meetup.get('restaurant_name')}</strong> on <strong>{meetup.get('visit_date')}</strong> has been updated.</p>
                            
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Status changed from</p>
                                <p style="margin: 10px 0; font-size: 18px;">
                                    <span style="text-decoration: line-through; color: #9ca3af;">{old_status}</span>
                                    →
                                    <strong style="color: #9333ea;">{status.upper()}</strong>
                                </p>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px;">
                                If you have any questions, please reply to this email or contact our Concierge® team.
                            </p>
                        </div>
                        
                        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                The Doggy Company Concierge® Team
                            </p>
                        </div>
                    </div>
                    """
                })
                logger.info(f"Sent meetup status update emails to {emails_to_notify}")
            except Exception as e:
                logger.error(f"Failed to send meetup status email: {e}")
    
    return {"success": True, "message": f"Meetup status updated to {status}", "notified": send_notification}


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
        "created_at": get_utc_timestamp()
    }
    
    await db.dine_notifications.insert_one(notification)
    notification.pop("_id", None)
    
    return {"message": "Notification created", "notification": notification}


@dine_router.put("/dine/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read"""
    result = await db.dine_notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read": True, "read_at": get_utc_timestamp()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@dine_router.put("/dine/notifications/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    result = await db.dine_notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": get_utc_timestamp()}}
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
        "created_at": get_utc_timestamp()
    }
    
    await db.dine_notifications.insert_one(notification)
    logger.info(f"Notification sent to {target_user_id} for meetup {meetup_id}")



# ============== ADMIN ENDPOINTS FOR VISITS & MEETUPS ==============

@dine_router.get("/admin/dine/visits")
async def admin_get_visits(
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50
):
    """Admin endpoint to get all pet buddy visits"""
    query = {}
    
    if status:
        query["status"] = status
    
    if date_from:
        query["date"] = {"$gte": date_from}
    if date_to:
        if "date" in query:
            query["date"]["$lte"] = date_to
        else:
            query["date"] = {"$lte": date_to}
    
    cursor = db.restaurant_visits.find(query, {"_id": 0}).sort("date", -1).limit(limit)
    visits = await cursor.to_list(length=limit)
    
    # Get stats
    total = await db.restaurant_visits.count_documents({})
    scheduled = await db.restaurant_visits.count_documents({"status": "scheduled"})
    completed = await db.restaurant_visits.count_documents({"status": "completed"})
    cancelled = await db.restaurant_visits.count_documents({"status": "cancelled"})
    looking_for_buddies = await db.restaurant_visits.count_documents({"looking_for_buddies": True, "status": "scheduled"})
    
    return {
        "visits": visits,
        "stats": {
            "total": total,
            "scheduled": scheduled,
            "completed": completed,
            "cancelled": cancelled,
            "looking_for_buddies": looking_for_buddies
        }
    }

@dine_router.put("/admin/dine/visits/{visit_id}/status")
async def admin_update_visit_status(visit_id: str, status: str, notes: Optional[str] = None):
    """Admin endpoint to update visit status"""
    valid_statuses = ["scheduled", "completed", "cancelled", "no_show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_doc = {
        "status": status,
        "updated_at": get_utc_timestamp()
    }
    
    if notes:
        update_doc["admin_notes"] = notes
    
    result = await db.restaurant_visits.update_one(
        {"id": visit_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    return {"success": True, "message": f"Visit status updated to {status}"}

@dine_router.get("/admin/dine/meetups")
async def admin_get_meetups(
    status: Optional[str] = None,
    limit: int = 50
):
    """Admin endpoint to get all meetup requests"""
    query = {}
    
    if status:
        query["status"] = status
    
    cursor = db.meetup_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    meetups = await cursor.to_list(length=limit)
    
    # Get stats
    total = await db.meetup_requests.count_documents({})
    pending = await db.meetup_requests.count_documents({"status": "pending"})
    accepted = await db.meetup_requests.count_documents({"status": "accepted"})
    declined = await db.meetup_requests.count_documents({"status": "declined"})
    
    return {
        "meetups": meetups,
        "stats": {
            "total": total,
            "pending": pending,
            "accepted": accepted,
            "declined": declined
        }
    }

@dine_router.delete("/admin/dine/meetups/{meetup_id}")
async def admin_delete_meetup(meetup_id: str):
    """Admin endpoint to delete a meetup request"""
    result = await db.meetup_requests.delete_one({"id": meetup_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meetup request not found")
    
    return {"success": True, "message": "Meetup request deleted"}

@dine_router.get("/admin/dine/buddy-stats")
async def admin_get_buddy_stats():
    """Get overall stats for buddy meetup feature"""
    # Visits stats
    total_visits = await db.restaurant_visits.count_documents({})
    visits_with_buddies = await db.restaurant_visits.count_documents({"looking_for_buddies": True})
    
    # Meetup stats
    total_meetups = await db.meetup_requests.count_documents({})
    successful_meetups = await db.meetup_requests.count_documents({"status": "accepted"})
    
    # Top restaurants for buddy visits
    pipeline = [
        {"$match": {"looking_for_buddies": True}},
        {"$group": {"_id": "$restaurant_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_restaurants = await db.restaurant_visits.aggregate(pipeline).to_list(5)
    
    return {
        "total_visits": total_visits,
        "visits_looking_for_buddies": visits_with_buddies,
        "total_meetup_requests": total_meetups,
        "successful_meetups": successful_meetups,
        "match_rate": round(successful_meetups / total_meetups * 100, 1) if total_meetups > 0 else 0,
        "top_buddy_restaurants": top_restaurants
    }


# ==================== DINE BUNDLES / PRODUCTS ====================

class DineBundle(BaseModel):
    """Dine product bundle model"""
    name: str
    description: str
    image: Optional[str] = None
    bundle_price: float
    original_price: float
    category: str  # e.g., "dining_kit", "party_package", "gift_card", "pet_treats"
    items: List[str] = []  # What's included
    for_occasion: Optional[str] = None  # birthday, anniversary, casual, etc.
    discount_percent: Optional[int] = None
    featured: bool = False
    active: bool = True
    stock: Optional[int] = None
    tags: List[str] = []


class DineBundleUpdate(BaseModel):
    """Partial update for dine bundle"""
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    bundle_price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    items: Optional[List[str]] = None
    for_occasion: Optional[str] = None
    discount_percent: Optional[int] = None
    featured: Optional[bool] = None
    active: Optional[bool] = None
    stock: Optional[int] = None
    tags: Optional[List[str]] = None


@dine_router.get("/dine/bundles")
async def get_dine_bundles(
    category: Optional[str] = None,
    occasion: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all active dine bundles (public)"""
    query = {"active": True}
    if category:
        query["category"] = category
    if occasion:
        query["for_occasion"] = occasion
    if featured is not None:
        query["featured"] = featured
    
    bundles = await db.dine_bundles.find(query, {"_id": 0}).sort("featured", -1).to_list(100)
    categories = await db.dine_bundles.distinct("category", {"active": True})
    occasions = await db.dine_bundles.distinct("for_occasion", {"active": True})
    
    return {
        "bundles": bundles,
        "categories": categories,
        "occasions": occasions,
        "total": len(bundles)
    }


@dine_router.get("/dine/bundles/{bundle_id}")
async def get_dine_bundle(bundle_id: str):
    """Get a specific dine bundle"""
    bundle = await db.dine_bundles.find_one({"id": bundle_id}, {"_id": 0})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return bundle


@dine_router.post("/dine/bundles/{bundle_id}/order")
async def order_dine_bundle(
    bundle_id: str,
    customer_name: str = Form(...),
    customer_email: str = Form(...),
    customer_phone: str = Form(...),
    delivery_address: Optional[str] = Form(None),
    special_instructions: Optional[str] = Form(None),
    quantity: int = Form(1)
):
    """Create an order for a dine bundle"""
    bundle = await db.dine_bundles.find_one({"id": bundle_id})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    order_id = f"DINE-{uuid.uuid4().hex[:8].upper()}"
    total_price = bundle["bundle_price"] * quantity
    
    order = {
        "id": order_id,
        "order_type": "dine_bundle",
        "bundle_id": bundle_id,
        "bundle_name": bundle["name"],
        "bundle_category": bundle.get("category", ""),
        "quantity": quantity,
        "unit_price": bundle["bundle_price"],
        "total_price": total_price,
        "customer": {
            "name": customer_name,
            "email": customer_email,
            "phone": customer_phone
        },
        "delivery_address": delivery_address,
        "special_instructions": special_instructions,
        "status": "pending",
        "payment_status": "unpaid",
        "pillar": "dine",
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.orders.insert_one(order)
    
    # Create admin notification
    await notify_admin(
        notification_type="new_order",
        title=f"New Dine Bundle Order",
        message=f"{customer_name} ordered {quantity}x {bundle['name']} (₹{total_price})",
        category="dine",
        related_id=order_id,
        link_to=f"/admin?tab=orders",
        priority="high",
        metadata={"bundle_id": bundle_id, "total": total_price}
    )
    
    # Create service desk ticket
    try:
        await create_ticket_from_event(
            db=db,
            event_type="dine_bundle_order",
            event_data={
                "order_id": order_id,
                "bundle_name": bundle["name"],
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": customer_phone,
                "total": total_price
            }
        )
    except Exception as e:
        logger.error(f"Failed to create ticket for dine bundle order: {e}")
    
    return {
        "success": True,
        "order_id": order_id,
        "message": f"Order placed successfully for {bundle['name']}",
        "total": total_price
    }


# ==================== ADMIN: DINE BUNDLES ====================

@dine_router.get("/admin/dine/bundles")
async def admin_get_dine_bundles(username: str = Depends(verify_admin)):
    """Get all dine bundles (admin)"""
    bundles = await db.dine_bundles.find({}, {"_id": 0}).to_list(100)
    
    # Get stats
    total = len(bundles)
    active = sum(1 for b in bundles if b.get("active", True))
    featured = sum(1 for b in bundles if b.get("featured", False))
    
    return {
        "bundles": bundles,
        "stats": {
            "total": total,
            "active": active,
            "inactive": total - active,
            "featured": featured
        }
    }


@dine_router.post("/admin/dine/bundles")
async def admin_create_dine_bundle(
    bundle: DineBundle,
    username: str = Depends(verify_admin)
):
    """Create a new dine bundle (admin)"""
    bundle_id = f"dine-bundle-{uuid.uuid4().hex[:8]}"
    
    bundle_doc = {
        "id": bundle_id,
        **bundle.model_dump(),
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    # Calculate discount if not provided
    if bundle.original_price > bundle.bundle_price and not bundle.discount_percent:
        bundle_doc["discount_percent"] = int((1 - bundle.bundle_price / bundle.original_price) * 100)
    
    await db.dine_bundles.insert_one(bundle_doc)
    
    return {"success": True, "bundle": {k: v for k, v in bundle_doc.items() if k != "_id"}}


@dine_router.put("/admin/dine/bundles/{bundle_id}")
async def admin_update_dine_bundle(
    bundle_id: str,
    bundle: DineBundleUpdate,
    username: str = Depends(verify_admin)
):
    """Update a dine bundle (admin)"""
    existing = await db.dine_bundles.find_one({"id": bundle_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    update_data = {k: v for k, v in bundle.model_dump().items() if v is not None}
    update_data["updated_at"] = get_utc_timestamp()
    
    # Recalculate discount if prices changed
    new_original = update_data.get("original_price", existing.get("original_price", 0))
    new_bundle = update_data.get("bundle_price", existing.get("bundle_price", 0))
    if new_original > new_bundle:
        update_data["discount_percent"] = int((1 - new_bundle / new_original) * 100)
    
    await db.dine_bundles.update_one({"id": bundle_id}, {"$set": update_data})
    
    updated = await db.dine_bundles.find_one({"id": bundle_id}, {"_id": 0})
    return {"success": True, "bundle": updated}


@dine_router.delete("/admin/dine/bundles/{bundle_id}")
async def admin_delete_dine_bundle(
    bundle_id: str,
    username: str = Depends(verify_admin)
):
    """Delete a dine bundle (admin)"""
    result = await db.dine_bundles.delete_one({"id": bundle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return {"success": True, "message": "Bundle deleted"}


@dine_router.post("/admin/dine/bundles/seed")
async def seed_dine_bundles(username: str = Depends(verify_admin)):
    """Seed sample dine bundles (admin)"""
    sample_bundles = [
        {
            "id": "dine-bundle-birthday",
            "name": "Pawty Birthday Package",
            "description": "Complete birthday celebration kit for your furry friend! Includes doggy cake, treats, party hats, and decoration.",
            "image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800",
            "bundle_price": 2499,
            "original_price": 3200,
            "category": "party_package",
            "items": ["Birthday Cake (500g)", "Gourmet Treats Pack", "Party Hat Set", "Paw Print Napkins", "Birthday Bandana"],
            "for_occasion": "birthday",
            "discount_percent": 22,
            "featured": True,
            "active": True,
            "tags": ["birthday", "celebration", "party"]
        },
        {
            "id": "dine-bundle-dining-kit",
            "name": "Fine Dining Kit",
            "description": "Everything you need for dining out with your pet. Portable bowl, treat pouch, and wipes.",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "bundle_price": 899,
            "original_price": 1200,
            "category": "dining_kit",
            "items": ["Collapsible Travel Bowl", "Treat Pouch", "Pet Wipes (20 pack)", "Portable Water Bottle"],
            "for_occasion": "casual",
            "discount_percent": 25,
            "featured": True,
            "active": True,
            "tags": ["dining", "travel", "essentials"]
        },
        {
            "id": "dine-bundle-treats",
            "name": "Gourmet Treats Box",
            "description": "A curated selection of vet-approved gourmet treats for your furry foodie.",
            "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800",
            "bundle_price": 699,
            "original_price": 900,
            "category": "pet_treats",
            "items": ["Chicken Jerky (100g)", "Peanut Butter Biscuits", "Freeze-dried Liver", "Dental Chews"],
            "for_occasion": "any",
            "discount_percent": 22,
            "featured": False,
            "active": True,
            "tags": ["treats", "gourmet", "healthy"]
        },
        {
            "id": "dine-bundle-anniversary",
            "name": "Adoption Anniversary Special",
            "description": "Celebrate the day they came into your life! Special treats, toys, and a photo frame.",
            "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
            "bundle_price": 1599,
            "original_price": 2000,
            "category": "party_package",
            "items": ["Mini Celebration Cake", "Premium Treats Hamper", "Squeaky Toy", "Paw Print Photo Frame"],
            "for_occasion": "anniversary",
            "discount_percent": 20,
            "featured": True,
            "active": True,
            "tags": ["anniversary", "adoption", "celebration"]
        },
        {
            "id": "dine-bundle-gift",
            "name": "Pet Parent Gift Card",
            "description": "Give the gift of choice! Redeemable at any TDC partner restaurant.",
            "image": "https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=800",
            "bundle_price": 1000,
            "original_price": 1000,
            "category": "gift_card",
            "items": ["₹1000 Gift Voucher", "Valid at 50+ partner restaurants"],
            "for_occasion": "gift",
            "discount_percent": 0,
            "featured": False,
            "active": True,
            "tags": ["gift", "voucher", "restaurant"]
        }
    ]
    
    # Check existing
    existing_count = await db.dine_bundles.count_documents({})
    if existing_count > 0:
        return {"message": f"Bundles already exist ({existing_count}). Skipping seed.", "seeded": 0}
    
    for bundle in sample_bundles:
        bundle["created_at"] = get_utc_timestamp()
        bundle["updated_at"] = get_utc_timestamp()
        await db.dine_bundles.insert_one(bundle)
    
    return {"message": "Dine bundles seeded successfully", "seeded": len(sample_bundles)}


# --- Dine Bundles CSV Export/Import ---

@dine_router.get("/admin/dine/bundles/export-csv")
async def export_dine_bundles_csv(username: str = Depends(verify_admin)):
    """Export all dine bundles as CSV"""
    bundles = await db.dine_bundles.find({}, {"_id": 0}).to_list(1000)
    
    if not bundles:
        raise HTTPException(status_code=404, detail="No bundles to export")
    
    output = io.StringIO()
    
    fieldnames = [
        'id', 'name', 'description', 'image', 'bundle_price', 'original_price',
        'discount_percent', 'category', 'items', 'for_occasion', 'tags',
        'featured', 'active', 'created_at', 'updated_at'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for bundle in bundles:
        row = {**bundle}
        if isinstance(row.get('items'), list):
            row['items'] = '|'.join(row['items'])
        if isinstance(row.get('tags'), list):
            row['tags'] = '|'.join(row['tags'])
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=dine_bundles_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@dine_router.post("/admin/dine/bundles/import-csv")
async def import_dine_bundles_csv(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Import dine bundles from CSV"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content_str))
        
        imported = 0
        updated = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                name = row.get('name', '').strip()
                if not name:
                    errors.append(f"Row {row_num}: Missing name")
                    continue
                
                bundle_data = {
                    "name": name,
                    "description": row.get('description', ''),
                    "image": row.get('image', ''),
                    "bundle_price": float(row.get('bundle_price', 0)) if row.get('bundle_price') else 0,
                    "original_price": float(row.get('original_price', 0)) if row.get('original_price') else 0,
                    "discount_percent": int(row.get('discount_percent', 0)) if row.get('discount_percent') else 0,
                    "category": row.get('category', 'general'),
                    "for_occasion": row.get('for_occasion', ''),
                    "featured": str(row.get('featured', '')).lower() in ['true', '1', 'yes'],
                    "active": str(row.get('active', 'true')).lower() in ['true', '1', 'yes'],
                    "updated_at": get_utc_timestamp()
                }
                
                # Handle list fields
                if row.get('items'):
                    bundle_data['items'] = [x.strip() for x in row['items'].split('|') if x.strip()]
                if row.get('tags'):
                    bundle_data['tags'] = [x.strip() for x in row['tags'].split('|') if x.strip()]
                
                # Check existing
                existing = await db.dine_bundles.find_one({"name": name})
                
                if existing:
                    await db.dine_bundles.update_one({"_id": existing["_id"]}, {"$set": bundle_data})
                    updated += 1
                else:
                    bundle_data["id"] = f"dine-bundle-{uuid.uuid4().hex[:8]}"
                    bundle_data["created_at"] = get_utc_timestamp()
                    await db.dine_bundles.insert_one(bundle_data)
                    imported += 1
                    
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Import completed: {imported} new, {updated} updated",
            "imported": imported,
            "updated": updated,
            "errors": errors[:20] if errors else []
        }
        
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# ==================== DINE PRODUCTS ====================

@dine_router.get("/dine/products")
async def get_dine_products(
    category: Optional[str] = None,
    dine_type: Optional[str] = None,
    in_stock: Optional[bool] = True
):
    """Get all active dine products (public) - includes dine and fresh-meals categories"""
    # Include both dine accessories and fresh meals
    query = {"category": {"$in": ["dine", "fresh-meals"]}}
    if dine_type:
        query["dine_type"] = dine_type
    
    # Get from products collection (dine accessories)
    dine_products = await db.products.find({"category": "dine"}, {"_id": 0}).to_list(50)
    
    # Get fresh meals from unified_products
    fresh_meals_query = {"category": "fresh-meals"}
    if in_stock is not None:
        fresh_meals_query["in_stock"] = {"$ne": False}  # Include if not explicitly false
    
    fresh_meals = await db.unified_products.find(fresh_meals_query, {"_id": 0}).to_list(50)
    
    # Combine both
    all_products = dine_products + fresh_meals
    
    return {
        "products": all_products,
        "total": len(all_products)
    }


@dine_router.get("/dine/products/{product_id}")
async def get_dine_product(product_id: str):
    """Get a specific dine product"""
    product = await db.products.find_one({"id": product_id, "category": "dine"}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@dine_router.post("/admin/dine/products")
async def create_dine_product(product_data: dict, username: str = Depends(verify_admin)):
    """Create a new dine product"""
    product = {
        "id": f"dine-{uuid.uuid4().hex[:8]}",
        **product_data,
        "category": "dine",
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    await db.products.insert_one({k: v for k, v in product.items() if k != "_id"})
    product.pop("_id", None)
    
    return {"message": "Product created", "product": product}


@dine_router.put("/admin/dine/products/{product_id}")
async def update_dine_product(product_id: str, product_data: dict, username: str = Depends(verify_admin)):
    """Update a dine product"""
    product_data["updated_at"] = get_utc_timestamp()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products.update_one({"id": product_id}, {"$set": product_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@dine_router.delete("/admin/dine/products/{product_id}")
async def delete_dine_product(product_id: str, username: str = Depends(verify_admin)):
    """Delete a dine product"""
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


@dine_router.post("/admin/dine/products/seed")
async def seed_dine_products(username: str = Depends(verify_admin)):
    """Seed dine products with sample data"""
    
    # Check if products already exist
    existing_count = await db.products.count_documents({"category": "dine"})
    if existing_count > 0:
        return {"message": f"Products already exist ({existing_count}). Skipping seed.", "seeded": 0}
    
    sample_products = [
        {
            "id": "dine-travel-bowl",
            "name": "Portable Travel Bowl Set",
            "description": "Collapsible silicone bowls for water and food. Perfect for restaurant visits and travel.",
            "price": 449,
            "compare_price": 599,
            "category": "dine",
            "dine_type": "accessories",
            "tags": ["dine", "travel", "bowl", "portable"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "dine-placemat",
            "name": "Pet Dining Placemat",
            "description": "Waterproof, non-slip placemat for mess-free restaurant dining. Folds compact.",
            "price": 349,
            "compare_price": 449,
            "category": "dine",
            "dine_type": "accessories",
            "tags": ["dine", "placemat", "restaurant", "clean"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": False
        },
        {
            "id": "dine-water-bottle",
            "name": "Pet Water Bottle with Bowl",
            "description": "Leak-proof water bottle with attached bowl. One-handed operation for outdoor cafes.",
            "price": 599,
            "compare_price": 799,
            "category": "dine",
            "dine_type": "hydration",
            "tags": ["dine", "water", "bottle", "portable"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "dine-treat-pouch",
            "name": "Restaurant Treat Pouch",
            "description": "Magnetic closure treat pouch for café visits. Keeps treats fresh and accessible.",
            "price": 399,
            "compare_price": 499,
            "category": "dine",
            "dine_type": "accessories",
            "tags": ["dine", "treats", "pouch", "training"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "dine-calming-spray",
            "name": "Dine-Time Calming Spray",
            "description": "Natural pheromone spray to keep pets calm during restaurant visits. Travel-size.",
            "price": 549,
            "compare_price": 699,
            "category": "dine",
            "dine_type": "wellness",
            "tags": ["dine", "calming", "anxiety", "spray"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7,
            "is_birthday_perk": False
        },
        {
            "id": "dine-bandana",
            "name": "Café Ready Bandana",
            "description": "Stylish bandana with 'Dining Out' message. Reversible with two patterns.",
            "price": 299,
            "compare_price": 399,
            "category": "dine",
            "dine_type": "fashion",
            "tags": ["dine", "bandana", "fashion", "cafe"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "dine-pup-cup",
            "name": "Reusable Pup Cup",
            "description": "Eco-friendly reusable cup for puppuccinos and pet drinks at cafes.",
            "price": 249,
            "compare_price": 349,
            "category": "dine",
            "dine_type": "accessories",
            "tags": ["dine", "puppuccino", "cup", "eco"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 3,
            "is_birthday_perk": False
        },
        {
            "id": "dine-portable-mat",
            "name": "Outdoor Dining Mat",
            "description": "Comfortable padded mat for your pet at outdoor cafes. Waterproof and insulated.",
            "price": 899,
            "compare_price": 1199,
            "category": "dine",
            "dine_type": "comfort",
            "tags": ["dine", "mat", "comfort", "outdoor"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": False
        },
        {
            "id": "dine-cooling-vest",
            "name": "Café Cooling Vest",
            "description": "Lightweight cooling vest for summer cafe visits. Keeps your pet comfortable in the heat.",
            "price": 1299,
            "compare_price": 1599,
            "category": "dine",
            "dine_type": "comfort",
            "tags": ["dine", "cooling", "summer", "vest"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "dine-etiquette-guide",
            "name": "Pet Café Etiquette Guide",
            "description": "Digital guide with tips for dining out with pets. Includes training commands.",
            "price": 199,
            "compare_price": 299,
            "category": "dine",
            "dine_type": "training",
            "tags": ["dine", "guide", "training", "etiquette"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 3,
            "is_birthday_perk": False
        },
        {
            "id": "dine-fresh-breath",
            "name": "Fresh Breath Dental Chews",
            "description": "Post-meal dental chews for fresh breath after restaurant visits. Pack of 10.",
            "price": 349,
            "compare_price": 449,
            "category": "dine",
            "dine_type": "treats",
            "tags": ["dine", "dental", "breath", "chews"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "dine-photo-props",
            "name": "Café Photo Props Kit",
            "description": "Fun props for cute café photos: mini sunglasses, bow ties, and cute signs.",
            "price": 399,
            "compare_price": 549,
            "category": "dine",
            "dine_type": "fun",
            "tags": ["dine", "photo", "props", "fun"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        }
    ]
    
    for product in sample_products:
        product["created_at"] = get_utc_timestamp()
        product["updated_at"] = get_utc_timestamp()
        await db.products.insert_one(product)
    
    return {"message": "Dine products seeded successfully", "seeded": len(sample_products)}
