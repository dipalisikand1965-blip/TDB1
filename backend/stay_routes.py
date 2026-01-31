"""
STAY Routes for The Doggy Company
Your dog's second home — everywhere.

Handles:
- Stay Partner Network (Hotels, Resorts, Villas, Farmstays)
- Paw Rating System (Comfort, Safety, Freedom, Care, Joy)
- Booking Requests (Concierge-based)
- Pet Stay Profiles
- Pet Menu & Add-ons
"""

import os
import logging
import uuid
import csv
import io
import resend
from datetime import datetime, timezone
from timestamp_utils import get_utc_timestamp
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets
from bson import ObjectId

# Import auto-ticket creation
from ticket_auto_create import create_ticket_from_event, update_ticket_from_event

logger = logging.getLogger(__name__)

# Create routers
stay_router = APIRouter(prefix="/api/stay", tags=["Stay"])
stay_admin_router = APIRouter(prefix="/api/admin/stay", tags=["Stay Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin verifier (will be set from server.py)
_verify_admin = None

security = HTTPBasic()

# Resend configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_admin_verify(verify_func):
    """Set the admin verification function from server.py"""
    global _verify_admin
    _verify_admin = verify_func


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials using the shared verifier"""
    if _verify_admin:
        return _verify_admin(credentials)
    # Fallback - use env vars
    admin_username = os.environ.get("ADMIN_USERNAME", "admin")
    admin_password = os.environ.get("ADMIN_PASSWORD", "woof2025")
    correct_username = secrets.compare_digest(credentials.username, admin_username)
    correct_password = secrets.compare_digest(credentials.password, admin_password)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class PawRating(BaseModel):
    """Paw Rating System - 5 categories"""
    comfort: float = 0  # Beds, bowls, space (0-5)
    safety: float = 0   # Cleaning, hygiene, policies (0-5)
    freedom: float = 0  # Areas dogs can access (0-5)
    care: float = 0     # Grooming/vet support (0-5)
    joy: float = 0      # Play zones, activities (0-5)
    overall: Optional[float] = None  # Calculated average


class PetPolicy(BaseModel):
    """Pet Policy Configuration"""
    max_pets_per_room: int = 1
    max_weight_kg: Optional[int] = None
    breed_restrictions: List[str] = []
    pet_fee_per_night: float = 0
    pet_deposit: float = 0
    cleaning_fee: float = 0
    # Areas allowed (checkbox grid)
    allowed_in_room: bool = True
    allowed_in_lawn: bool = True
    allowed_in_lobby: bool = False
    allowed_in_restaurant_outdoor: bool = False
    allowed_in_restaurant_indoor: bool = False
    allowed_in_pool_area: bool = False
    allowed_in_spa: bool = False
    # Rules
    leash_required: bool = True
    muzzle_required: bool = False
    vaccination_required: bool = True
    pet_insurance_required: bool = False
    # Documents
    policy_pdf_url: Optional[str] = None
    last_verified_date: Optional[str] = None
    verified: bool = False


class PetMenuItem(BaseModel):
    """Pet Menu Item"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    category: str = "treats"  # treats, meals, snacks, drinks
    dietary_notes: Optional[str] = None  # grain-free, chicken-free, etc.
    available: bool = True
    is_doggy_bakery: bool = False  # From Doggy Bakery inventory


class StayAddOn(BaseModel):
    """Stay Add-on Services"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    type: str  # grooming, pet_sitter, vet_on_call, photographer, welcome_kit
    available: bool = True


class StayCommercials(BaseModel):
    """Commercial Configuration"""
    contract_type: str = "commission"  # commission, fixed, barter, referral
    commission_rate: float = 12  # Default 12% for Stay
    member_price_discount: float = 0  # % discount for members
    blackout_dates: List[str] = []
    payment_terms: Optional[str] = None
    partner_coupon_codes: List[str] = []


class PawReward(BaseModel):
    """Paw Reward - Complimentary treat with every booking"""
    enabled: bool = True
    product_id: Optional[str] = None  # Product ID from inventory
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price: Optional[float] = None
    max_value: float = 600  # Up to ₹600
    custom_message: Optional[str] = None  # "Every stay earns your dog a Paw Reward"


class PillarTag(BaseModel):
    """Pillar-wise Tag"""
    id: Optional[str] = None
    name: str
    pillar: str  # stay, dine, travel, care
    category: str  # rewards, amenities, features, policies
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    active: bool = True


class StayPropertyCreate(BaseModel):
    """Stay Property Creation Model"""
    # TAB 1: Property Basics
    name: str
    brand_group: Optional[str] = None
    property_type: str  # resort, hotel, villa, farmstay, homestay
    city: str
    area: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    full_address: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    escalation_contact: Optional[str] = None
    inventory_notes: Optional[str] = None  # How many pet rooms, categories
    seasonality_notes: Optional[str] = None  # Monsoons, peak pet travel
    photos: List[str] = []
    photos_approved: bool = False
    website: Optional[str] = None
    booking_link: Optional[str] = None
    
    # Display fields
    description: Optional[str] = None
    highlights: List[str] = []
    vibe_tags: List[str] = []  # Quiet, Social, Luxury, Outdoorsy, Beach, Forest, Mountain
    
    # TAB 2: Pet Policy
    pet_policy: Optional[PetPolicy] = None
    pet_policy_snapshot: Optional[str] = None  # 1-line summary
    
    # TAB 3: Paw Standards
    paw_rating: Optional[PawRating] = None
    badges: List[str] = []  # Pet Menu, Off-leash area, Pet sitter, Grooming, Vet on call, Trails
    staff_training_completed: bool = False
    staff_training_date: Optional[str] = None
    last_audit_date: Optional[str] = None
    compliance_status: str = "pending"  # pending, approved, conditional, warning, suspended
    incident_history: List[Dict] = []
    
    # TAB 4: Pet Menu & Add-ons
    pet_menu_available: bool = False
    pet_menu_items: List[PetMenuItem] = []
    pet_menu_prepared_by: str = "hotel"  # hotel, doggy_bakery_tie_up
    add_ons: List[StayAddOn] = []
    
    # TAB 5: Commercials
    commercials: Optional[StayCommercials] = None
    
    # Paw Reward
    paw_reward: Optional[PawReward] = None
    
    # For humans
    room_categories: List[str] = []
    human_amenities: List[str] = []  # pool, spa, kids, etc.
    cuisine_available: List[str] = []
    nearby_vet: Optional[str] = None
    nearby_pet_places: List[str] = []
    
    # Status
    status: str = "draft"  # draft, onboarding, live, paused, suspended
    featured: bool = False
    verified: bool = False
    account_manager: Optional[str] = None
    internal_notes: Optional[str] = None


class StayPropertyUpdate(BaseModel):
    """Partial update for Stay Property"""
    name: Optional[str] = None
    brand_group: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    full_address: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    escalation_contact: Optional[str] = None
    inventory_notes: Optional[str] = None
    seasonality_notes: Optional[str] = None
    photos: Optional[List[str]] = None
    photos_approved: Optional[bool] = None
    website: Optional[str] = None
    booking_link: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    vibe_tags: Optional[List[str]] = None
    pet_policy: Optional[PetPolicy] = None
    pet_policy_snapshot: Optional[str] = None
    paw_rating: Optional[PawRating] = None
    badges: Optional[List[str]] = None
    staff_training_completed: Optional[bool] = None
    staff_training_date: Optional[str] = None
    last_audit_date: Optional[str] = None
    compliance_status: Optional[str] = None
    incident_history: Optional[List[Dict]] = None
    pet_menu_available: Optional[bool] = None
    pet_menu_items: Optional[List[PetMenuItem]] = None
    pet_menu_prepared_by: Optional[str] = None
    add_ons: Optional[List[StayAddOn]] = None
    commercials: Optional[StayCommercials] = None
    room_categories: Optional[List[str]] = None
    human_amenities: Optional[List[str]] = None
    cuisine_available: Optional[List[str]] = None
    nearby_vet: Optional[str] = None
    nearby_pet_places: Optional[List[str]] = None
    paw_reward: Optional[PawReward] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    verified: Optional[bool] = None
    account_manager: Optional[str] = None
    internal_notes: Optional[str] = None


class BookingRequest(BaseModel):
    """Stay Booking Request (Concierge-handled)"""
    property_id: str
    # Guest details
    guest_name: str
    guest_email: str
    guest_phone: str
    guest_whatsapp: Optional[str] = None
    # Pet details - supports both single pet and multi-pet
    pet_name: Optional[str] = None  # For backward compatibility
    pet_breed: Optional[str] = None
    pet_weight_kg: Optional[float] = None
    pet_age: Optional[str] = None
    pet_gender: Optional[str] = None
    # Multi-pet support (new)
    pets: Optional[List[Dict[str, Any]]] = None  # Array of pet objects
    selectedPetIds: Optional[List[str]] = None  # Array of selected pet IDs
    # Stay profile (comprehensive)
    sleep_habits: Optional[str] = None
    fears: Optional[str] = None
    food_preferences: Optional[str] = None
    walking_times: Optional[str] = None
    triggers: Optional[str] = None
    favourite_toy: Optional[str] = None
    special_needs: Optional[str] = None
    # Booking details
    check_in_date: str
    check_out_date: str
    num_rooms: int = 1
    num_adults: int = 2
    num_pets: int = 1
    room_type_preference: Optional[str] = None
    special_requests: Optional[str] = None
    # Add-ons requested
    pet_meal_preorder: bool = False
    welcome_kit: bool = False
    grooming_requested: bool = False
    pet_sitter_requested: bool = False
    # Membership tier
    membership_tier: Optional[str] = None  # tier1, tier2, tier3


class PolicyMismatchReport(BaseModel):
    """Report a policy mismatch (trust control)"""
    property_id: str
    reporter_email: str
    reporter_name: str
    issue_type: str  # pet_fee_different, areas_restricted, policy_changed, other
    description: str
    booking_id: Optional[str] = None


# ==================== PUBLIC ROUTES ====================

@stay_router.get("/properties")
async def get_stay_properties(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_pet_fee: Optional[float] = None,
    badges: Optional[str] = None,  # Comma-separated
    vibe: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all live stay properties (public)"""
    query = {"status": "live"}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if property_type:
        query["property_type"] = property_type
    if min_rating:
        query["paw_rating.overall"] = {"$gte": min_rating}
    if max_pet_fee:
        query["pet_policy.pet_fee_per_night"] = {"$lte": max_pet_fee}
    if badges:
        badge_list = [b.strip() for b in badges.split(",")]
        query["badges"] = {"$all": badge_list}
    if vibe:
        query["vibe_tags"] = vibe
    if featured:
        query["featured"] = True
    
    # Exclude internal fields from public response
    projection = {
        "_id": 0,
        "internal_notes": 0,
        "account_manager": 0,
        "commercials": 0,
        "incident_history": 0
    }
    
    properties = await db.stay_properties.find(query, projection).skip(skip).limit(limit).to_list(limit)
    total = await db.stay_properties.count_documents(query)
    
    # Get cities for filter
    cities = await db.stay_properties.distinct("city", {"status": "live"})
    
    return {
        "properties": properties,
        "total": total,
        "cities": cities,
        "property_types": ["resort", "hotel", "villa", "farmstay", "homestay"]
    }


@stay_router.get("/properties/{property_id}")
async def get_stay_property(property_id: str):
    """Get a specific stay property (public view)"""
    projection = {
        "_id": 0,
        "internal_notes": 0,
        "account_manager": 0,
        "commercials": 0,
        "incident_history": 0
    }


@stay_router.get("/boarding")
async def get_boarding_facilities(
    city: Optional[str] = None,
    boarding_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get pet boarding facilities (public) - queries both collections for compatibility"""
    query = {}
    active_query = {"status": "active"}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
        active_query["city"] = {"$regex": city, "$options": "i"}
    if boarding_type:
        query["boarding_type"] = boarding_type
        active_query["boarding_type"] = boarding_type
    if min_rating:
        query["paw_score"] = {"$gte": min_rating}
        active_query["paw_score"] = {"$gte": min_rating}
    
    projection = {"_id": 0}
    
    # Query both collections and combine results
    facilities_1 = await db.stay_boarding_facilities.find(query, projection).skip(skip).limit(limit).to_list(limit)
    facilities_2 = await db.pet_boarding.find(active_query, projection).skip(skip).limit(limit).to_list(limit)
    
    # Combine and deduplicate by name+city
    seen = set()
    combined = []
    for f in facilities_1 + facilities_2:
        key = f"{f.get('name', '')}-{f.get('city', '')}"
        if key not in seen:
            seen.add(key)
            combined.append(f)
    
    # Sort by paw_score descending
    combined.sort(key=lambda x: x.get('paw_score', 0), reverse=True)
    
    total = len(combined)
    
    # Get cities and types for filters from both collections
    cities_1 = await db.stay_boarding_facilities.distinct("city")
    cities_2 = await db.pet_boarding.distinct("city", {"status": "active"})
    cities = list(set(cities_1 + cities_2))
    
    types_1 = await db.stay_boarding_facilities.distinct("boarding_type")
    types_2 = await db.pet_boarding.distinct("boarding_type", {"status": "active"})
    types = list(set(types_1 + types_2)) or ["Home-style", "Premium", "Private", "Luxury"]
    
    return {
        "facilities": combined[:limit],
        "total": total,
        "cities": sorted(cities),
        "boarding_types": types
    }


@stay_router.get("/boarding/{facility_id}")
async def get_boarding_facility(facility_id: str):
    """Get a specific boarding facility"""
    facility = await db.pet_boarding.find_one({"id": facility_id}, {"_id": 0})
    if not facility:
        raise HTTPException(status_code=404, detail="Boarding facility not found")
    return facility
    
    property = await db.stay_properties.find_one(
        {"id": property_id, "status": "live"}, 
        projection
    )
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return property


@stay_router.post("/booking-request")
async def create_booking_request(booking: BookingRequest):
    """Create a booking request (sent to concierge)"""
    # Verify property exists
    property = await db.stay_properties.find_one({"id": booking.property_id})
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    now = get_utc_timestamp()
    
    # Extract pet names from pets array if provided
    pet_names = []
    if booking.pets and isinstance(booking.pets, list):
        pet_names = [p.get("name", "") for p in booking.pets if p.get("name")]
        # Use first pet name for backward compat if pet_name not set
        if not booking.pet_name and pet_names:
            booking.pet_name = pet_names[0]
    
    # Create booking request
    booking_doc = {
        "id": f"stay-bk-{uuid.uuid4().hex[:12]}",
        **booking.model_dump(),
        "pet_names": pet_names,  # Store all pet names for easy reference
        "property_name": property.get("name"),
        "property_city": property.get("city"),
        "property_type": property.get("property_type"),
        "status": "pending",  # pending, contacted, confirmed, cancelled, completed
        "concierge_notes": "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.stay_bookings.insert_one(booking_doc)
    
    # Send confirmation email to guest
    # Build pet names string for email
    pet_display = ', '.join(pet_names) if pet_names else booking.pet_name or 'your pet'
    
    if RESEND_API_KEY and booking.guest_email:
        try:
            resend.Emails.send({
                "from": f"The Doggy Company Stay <{SENDER_EMAIL}>",
                "to": booking.guest_email,
                "subject": f"🏨 Stay Booking Request - {property.get('name')}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🐾 STAY</h1>
                        <p style="color: white; opacity: 0.9;">Your dog's second home — everywhere</p>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #1f2937;">Hi {booking.guest_name}! 👋</h2>
                        <p style="color: #4b5563;">Your stay request has been submitted!</p>
                        
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #16a34a; margin-top: 0;">🏨 {property.get('name')}</h3>
                            <p style="color: #6b7280;">{property.get('city')}</p>
                            <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
                            <p style="color: #4b5563;"><strong>📅 Check-in:</strong> {booking.check_in_date}</p>
                            <p style="color: #4b5563;"><strong>📅 Check-out:</strong> {booking.check_out_date}</p>
                            <p style="color: #4b5563;"><strong>🐕 Travelling with:</strong> {pet_display}</p>
                        </div>
                        
                        <p style="color: #4b5563;">Our Stay Concierge will review your request and contact you within 4 hours to confirm availability and finalize your booking.</p>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #92400e; margin: 0;"><strong>💡 Tip:</strong> Check your WhatsApp for faster updates!</p>
                        </div>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 The Doggy Company | woof@thedoggycompany.in</p>
                    </div>
                </div>
                """
            })
            logger.info(f"Stay booking confirmation sent to {booking.guest_email}")
        except Exception as e:
            logger.error(f"Failed to send stay booking email: {e}")
    
    # Create admin notification with FULL unified flow fields
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    try:
        notif_doc = {
            "id": notification_id,
            "type": "stay_booking",
            "pillar": "stay",
            "title": f"New Stay Booking - {property.get('name')}",
            "message": f"{booking.guest_name} requested stay for {booking.check_in_date} ({pet_display})",
            "read": False,  # IMPORTANT: For API compatibility
            "status": "unread",
            "urgency": "high",
            "category": "stay",
            "related_id": booking_doc["id"],
            "ticket_id": f"STAY-{booking_doc['id']}",
            "inbox_id": inbox_id,
            "link": f"/admin?tab=stay&subtab=bookings",
            "customer": {
                "name": booking.guest_name,
                "email": booking.guest_email,
                "phone": booking.guest_phone
            },
            "pet": {
                "name": booking.pet_name,
                "breed": booking.pet_breed
            },
            "created_at": now,
            "read_at": None
        }
        notif_result = await db.admin_notifications.insert_one(notif_doc)
        logger.info(f"[UNIFIED FLOW] Stay booking notification created: {notification_id}")
    except Exception as e:
        logger.error(f"Failed to create notification for stay booking: {e}")
    
    # Auto-create Service Desk ticket for Stay booking
    try:
        ticket_id = await create_ticket_from_event(db, "stay_booking", {
            "booking_id": booking_doc["id"],
            "name": booking.guest_name,
            "email": booking.guest_email,
            "phone": booking.guest_phone,
            "property_name": property.get("name"),
            "property_city": property.get("city"),
            "check_in_date": booking.check_in_date,
            "check_out_date": booking.check_out_date,
            "adults": booking.num_adults,
            "pets": booking.num_pets,
            "pet_name": booking.pet_name,
            "pet_breed": booking.pet_breed,
            "pet_age": booking.pet_age,
            "pet_weight_kg": booking.pet_weight_kg,
            "special_requests": booking.special_requests,
            "bundle_name": getattr(booking, 'bundle_name', None)
        })
        logger.info(f"Auto-created ticket {ticket_id} for stay booking {booking_doc['id']}")
    except Exception as e:
        logger.error(f"Failed to auto-create ticket for stay booking: {e}")
    
    # Create Unified Inbox entry for Stay booking
    try:
        inbox_entry = {
            "request_id": f"STAY-{booking_doc['id']}",
            "channel": "web",
            "pillar": "stay",
            "type": "booking_request",
            "status": "pending",
            "customer_name": booking.guest_name,
            "customer_email": booking.guest_email,
            "customer_phone": booking.guest_phone,
            "pet_name": booking.pet_name,
            "message": f"Stay Booking: {property.get('name')} ({booking.check_in_date} - {booking.check_out_date})",
            "metadata": {
                "booking_id": booking_doc["id"],
                "property_id": booking.property_id,
                "property_name": property.get("name"),
                "property_city": property.get("city"),
                "check_in_date": booking.check_in_date,
                "check_out_date": booking.check_out_date,
                "num_adults": booking.num_adults,
                "num_pets": booking.num_pets,
                "ticket_id": ticket_id if 'ticket_id' in dir() else None
            },
            "created_at": now
        }
        await db.channel_intakes.insert_one(inbox_entry)
        logger.info(f"Created Unified Inbox entry for stay booking {booking_doc['id']}")
    except Exception as e:
        logger.error(f"Failed to create Unified Inbox entry for stay booking: {e}")
    
    return {
        "success": True,
        "booking_id": booking_doc["id"],
        "message": "Stay request submitted! Our concierge will contact you within 4 hours."
    }


@stay_router.post("/report-mismatch")
async def report_policy_mismatch(report: PolicyMismatchReport):
    """Report a policy mismatch (trust control)"""
    property = await db.stay_properties.find_one({"id": report.property_id})
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    now = get_utc_timestamp()
    
    report_doc = {
        "id": f"mismatch-{uuid.uuid4().hex[:8]}",
        **report.model_dump(),
        "property_name": property.get("name"),
        "status": "open",  # open, investigating, resolved, dismissed
        "resolution_notes": "",
        "created_at": now
    }
    
    await db.policy_mismatch_reports.insert_one(report_doc)
    
    # Create high-priority admin notification
    await db.admin_notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": "policy_mismatch",
        "title": f"⚠️ Policy Mismatch Reported - {property.get('name')}",
        "message": f"{report.reporter_name} reported: {report.issue_type}",
        "category": "stay",
        "related_id": report_doc["id"],
        "link_to": "/admin?tab=stay&subtab=mismatch",
        "priority": "high",
        "read": False,
        "created_at": now
    })
    
    # Create Service Desk ticket for follow-up
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    ticket_count = await db.tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
    ticket_id = f"TKT-{today}-{str(ticket_count + 1).zfill(3)}"
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "member": {
            "name": report.reporter_name,
            "email": report.reporter_email
        },
        "category": "stay",
        "sub_category": "policy_mismatch",
        "urgency": "high",
        "description": f"Policy mismatch reported for {property.get('name')}: {report.issue_type}\n\nDetails: {report.description}",
        "source": "Stay Mismatch Report",
        "source_reference": report_doc["id"],
        "status": "new",
        "priority": 1,  # High priority
        "tags": ["stay", "policy-mismatch", "auto-created"],
        "created_at": now,
        "updated_at": now,
        "auto_created_from": "stay_mismatch",
        "linked_event_id": report_doc["id"]
    }
    await db.tickets.insert_one(ticket_doc)
    
    return {"success": True, "report_id": report_doc["id"], "ticket_id": ticket_id}


# ==================== TRIP PLANNER ====================

class TripPlanRequest(BaseModel):
    """Trip Planner request"""
    destination_city: Optional[str] = None
    trip_type: Optional[str] = None  # beach, mountain, road_trip, weekend, luxury, forest
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None


@stay_router.post("/trip-planner")
async def get_trip_recommendations(request: TripPlanRequest):
    """
    Trip Planner - Get personalized recommendations for:
    - Stay properties matching destination and trip type
    - Product bundles suitable for the trip type
    - Upcoming social events at or near the destination
    """
    recommendations = {
        "destination": request.destination_city,
        "trip_type": request.trip_type,
        "properties": [],
        "bundles": [],
        "events": [],
        "tips": []
    }
    
    # 1. Find matching properties
    property_query = {"status": "live"}
    if request.destination_city:
        property_query["city"] = {"$regex": request.destination_city, "$options": "i"}
    if request.trip_type:
        property_query["vibe_tags"] = {"$regex": request.trip_type, "$options": "i"}
    
    properties = await db.stay_properties.find(property_query, {"_id": 0}).sort("paw_rating.overall", -1).limit(6).to_list(6)
    recommendations["properties"] = properties
    
    # 2. Find matching bundles based on trip type
    bundle_query = {"active": True}
    if request.trip_type:
        # Map trip types to bundle trip_types
        trip_type_map = {
            "beach": "beach",
            "mountain": "mountain",
            "road_trip": "road_trip",
            "weekend": "weekend",
            "luxury": "luxury",
            "forest": "forest"
        }
        mapped_type = trip_type_map.get(request.trip_type.lower(), request.trip_type)
        bundle_query["for_trip_type"] = mapped_type
    
    bundles = await db.stay_bundles.find(bundle_query, {"_id": 0}).sort("featured", -1).limit(4).to_list(4)
    
    # If no specific bundles found, get featured bundles
    if not bundles:
        bundles = await db.stay_bundles.find({"active": True, "featured": True}, {"_id": 0}).limit(4).to_list(4)
    
    recommendations["bundles"] = bundles
    
    # 3. Find upcoming events near destination or at properties
    event_query = {"status": "active"}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    event_query["event_date"] = {"$gte": today}
    
    if request.destination_city:
        event_query["property_city"] = {"$regex": request.destination_city, "$options": "i"}
    
    events = await db.pawcation_socials.find(event_query, {"_id": 0}).sort("event_date", 1).limit(3).to_list(3)
    
    # If no events in destination, get any upcoming events
    if not events:
        events = await db.pawcation_socials.find(
            {"status": "active", "event_date": {"$gte": today}}, 
            {"_id": 0}
        ).sort("event_date", 1).limit(3).to_list(3)
    
    recommendations["events"] = events
    
    # 4. Generate personalized tips
    tips = []
    pet_name = request.pet_name or "your pup"
    
    if request.trip_type:
        trip_tips = {
            "beach": [
                f"Pack paw wax to protect {pet_name}'s paws from hot sand!",
                "Bring a cooling mat for post-beach relaxation",
                "Check if the beach allows dogs during your visit hours"
            ],
            "mountain": [
                f"Ensure {pet_name} is comfortable with altitude - start slow!",
                "Pack high-energy treats for trail walks",
                "Bring a reflective collar for evening adventures"
            ],
            "road_trip": [
                f"Take breaks every 2-3 hours for {pet_name} to stretch",
                "Never leave your pet alone in the car",
                "Pack motion sickness treats just in case"
            ],
            "weekend": [
                f"Keep {pet_name}'s routine as normal as possible",
                "Bring familiar items like their favorite blanket or toy",
                "Check hotel pet policies before arrival"
            ],
            "luxury": [
                f"Book spa treatments for {pet_name} in advance",
                "Ask about in-room pet dining options",
                "Request pet-friendly room amenities"
            ],
            "forest": [
                f"Check for ticks after every outdoor adventure with {pet_name}",
                "Keep your pet leashed to protect wildlife",
                "Bring a first-aid kit for minor injuries"
            ]
        }
        tips = trip_tips.get(request.trip_type.lower(), [
            f"Always carry water and treats for {pet_name}",
            "Keep vaccination records handy",
            "Research nearest vet at your destination"
        ])
    else:
        tips = [
            f"Always carry water and treats for {pet_name}",
            "Keep vaccination records handy",
            "Research nearest vet at your destination"
        ]
    
    recommendations["tips"] = tips
    
    return recommendations


@stay_router.get("/trip-planner/options")
async def get_trip_planner_options():
    """Get available options for trip planner filters"""
    cities = await db.stay_properties.distinct("city", {"status": "live"})
    
    trip_types = [
        {"id": "beach", "name": "Beach Getaway", "icon": "🏖️"},
        {"id": "mountain", "name": "Mountain Retreat", "icon": "🏔️"},
        {"id": "forest", "name": "Forest Escape", "icon": "🌲"},
        {"id": "road_trip", "name": "Road Trip", "icon": "🚗"},
        {"id": "weekend", "name": "Weekend Break", "icon": "🌅"},
        {"id": "luxury", "name": "Luxury Stay", "icon": "✨"}
    ]
    
    return {
        "cities": sorted(cities),
        "trip_types": trip_types
    }


# ==================== PAW REWARD SYSTEM ====================

async def get_random_reward_product():
    """Get a random treat product under ₹600 for Paw Reward"""
    # Try to find products from the products collection (treats under ₹600)
    products = await db.products.find({
        "category": {"$in": ["treats", "Treats", "snacks", "Snacks"]},
        "price": {"$lte": 600},
        "price": {"$gt": 0}
    }, {"_id": 0}).limit(20).to_list(20)
    
    # If no products found, use fallback treats
    if not products:
        fallback_treats = [
            {"id": "treat-001", "name": "Chicken Jerky Bites", "price": 299, "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400"},
            {"id": "treat-002", "name": "Peanut Butter Cookies", "price": 249, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"},
            {"id": "treat-003", "name": "Sweet Potato Chews", "price": 349, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"},
            {"id": "treat-004", "name": "Banana Pupcakes (6pc)", "price": 449, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400"},
            {"id": "treat-005", "name": "Salmon Training Treats", "price": 399, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"},
            {"id": "treat-006", "name": "Veggie Dental Sticks", "price": 279, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"},
        ]
        products = fallback_treats
    
    import random
    product = random.choice(products)
    
    return {
        "enabled": True,
        "product_id": product.get("id", f"treat-{uuid.uuid4().hex[:6]}"),
        "product_name": product.get("name", "Complimentary Treat"),
        "product_image": product.get("image", "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"),
        "product_price": product.get("price", 299),
        "max_value": 600,
        "custom_message": "Every stay earns your dog a Paw Reward!"
    }


@stay_router.get("/paw-rewards/eligible-products")
async def get_eligible_reward_products():
    """Get all products eligible for Paw Reward (treats under ₹600)"""
    products = await db.products.find({
        "category": {"$in": ["treats", "Treats", "snacks", "Snacks"]},
        "price": {"$lte": 600},
        "price": {"$gt": 0}
    }, {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1, "images": 1}).limit(50).to_list(50)
    
    # Add fallback treats if no products found
    if not products:
        products = [
            {"id": "treat-001", "name": "Chicken Jerky Bites", "price": 299, "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400"},
            {"id": "treat-002", "name": "Peanut Butter Cookies", "price": 249, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"},
            {"id": "treat-003", "name": "Sweet Potato Chews", "price": 349, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"},
            {"id": "treat-004", "name": "Banana Pupcakes (6pc)", "price": 449, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400"},
            {"id": "treat-005", "name": "Salmon Training Treats", "price": 399, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"},
            {"id": "treat-006", "name": "Veggie Dental Sticks", "price": 279, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"},
        ]
    
    # Normalize image field
    for p in products:
        if not p.get("image") and p.get("images"):
            p["image"] = p["images"][0] if p["images"] else None
    
    return {"products": products, "total": len(products)}


# ==================== PILLAR TAGS SYSTEM ====================

@stay_router.get("/tags")
async def get_pillar_tags(pillar: Optional[str] = None, category: Optional[str] = None):
    """Get all pillar tags"""
    query = {"active": True}
    if pillar:
        query["pillar"] = pillar
    if category:
        query["category"] = category
    
    tags = await db.pillar_tags.find(query, {"_id": 0}).to_list(100)
    
    # If no tags exist, return default tags
    if not tags:
        default_tags = [
            # Stay Tags
            {"id": "tag-paw-reward", "name": "Paw Reward", "pillar": "stay", "category": "rewards", "icon": "🎁", "color": "amber", "description": "Complimentary treat with every booking", "active": True},
            {"id": "tag-pet-menu", "name": "Pet Menu", "pillar": "stay", "category": "amenities", "icon": "🍖", "color": "orange", "description": "In-house pet dining options", "active": True},
            {"id": "tag-off-leash", "name": "Off-Leash Area", "pillar": "stay", "category": "amenities", "icon": "🐕", "color": "green", "description": "Designated off-leash zones", "active": True},
            {"id": "tag-pet-sitter", "name": "Pet Sitter", "pillar": "stay", "category": "amenities", "icon": "👤", "color": "blue", "description": "On-call pet sitting service", "active": True},
            {"id": "tag-grooming", "name": "Grooming", "pillar": "stay", "category": "amenities", "icon": "✨", "color": "purple", "description": "Pet grooming services available", "active": True},
            {"id": "tag-vet-call", "name": "Vet on Call", "pillar": "stay", "category": "amenities", "icon": "🏥", "color": "red", "description": "24/7 veterinary support", "active": True},
            {"id": "tag-trails", "name": "Walking Trails", "pillar": "stay", "category": "amenities", "icon": "🌲", "color": "green", "description": "Pet-friendly walking trails", "active": True},
            {"id": "tag-beach", "name": "Beach Access", "pillar": "stay", "category": "amenities", "icon": "🏖️", "color": "cyan", "description": "Pet-friendly beach nearby", "active": True},
            {"id": "tag-pool", "name": "Pet Pool", "pillar": "stay", "category": "amenities", "icon": "🏊", "color": "blue", "description": "Dedicated pet swimming area", "active": True},
            # Dine Tags
            {"id": "tag-dine-treat", "name": "Paw Treat Included", "pillar": "dine", "category": "rewards", "icon": "🦴", "color": "amber", "description": "Complimentary treat with meal", "active": True},
            {"id": "tag-dog-menu", "name": "Dog Menu", "pillar": "dine", "category": "amenities", "icon": "📋", "color": "orange", "description": "Dedicated pet menu available", "active": True},
            {"id": "tag-outdoor", "name": "Outdoor Seating", "pillar": "dine", "category": "amenities", "icon": "☀️", "color": "yellow", "description": "Pet-friendly outdoor area", "active": True},
            {"id": "tag-water-bowl", "name": "Water Bowls", "pillar": "dine", "category": "amenities", "icon": "💧", "color": "blue", "description": "Fresh water always available", "active": True},
            # Travel Tags
            {"id": "tag-travel-kit", "name": "Pet Kit Included", "pillar": "travel", "category": "rewards", "icon": "🎒", "color": "amber", "description": "Travel essentials included", "active": True},
            {"id": "tag-climate", "name": "Climate Control", "pillar": "travel", "category": "amenities", "icon": "❄️", "color": "cyan", "description": "Temperature-controlled pet area", "active": True},
            # Care Tags
            {"id": "tag-first-visit", "name": "First Visit Discount", "pillar": "care", "category": "rewards", "icon": "🎉", "color": "purple", "description": "Special offer for first-time visitors", "active": True},
            {"id": "tag-certified", "name": "Certified Trainer", "pillar": "care", "category": "features", "icon": "🏅", "color": "gold", "description": "Certified professional trainer", "active": True},
        ]
        
        # Filter by pillar/category if specified
        if pillar:
            default_tags = [t for t in default_tags if t["pillar"] == pillar]
        if category:
            default_tags = [t for t in default_tags if t["category"] == category]
        
        return {"tags": default_tags, "total": len(default_tags)}
    
    return {"tags": tags, "total": len(tags)}


@stay_admin_router.post("/tags")
async def create_pillar_tag(tag: PillarTag, username: str = Depends(verify_admin)):
    """Create a new pillar tag"""
    now = get_utc_timestamp()
    
    tag_doc = {
        "id": tag.id or f"tag-{uuid.uuid4().hex[:8]}",
        **tag.model_dump(exclude={"id"}),
        "created_at": now,
        "created_by": username
    }
    
    await db.pillar_tags.insert_one(tag_doc)
    del tag_doc["_id"]
    
    return {"message": "Tag created", "tag": tag_doc}


@stay_admin_router.put("/tags/{tag_id}")
async def update_pillar_tag(tag_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a pillar tag"""
    updates["updated_at"] = get_utc_timestamp()
    updates["updated_by"] = username
    
    result = await db.pillar_tags.update_one(
        {"id": tag_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return {"message": "Tag updated"}


@stay_admin_router.delete("/tags/{tag_id}")
async def delete_pillar_tag(tag_id: str, username: str = Depends(verify_admin)):
    """Delete a pillar tag"""
    result = await db.pillar_tags.delete_one({"id": tag_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return {"message": "Tag deleted"}


@stay_admin_router.post("/tags/seed")
async def seed_default_tags(username: str = Depends(verify_admin)):
    """Seed default pillar tags"""
    default_tags = [
        # Stay Tags
        {"id": "tag-paw-reward", "name": "Paw Reward", "pillar": "stay", "category": "rewards", "icon": "🎁", "color": "amber", "description": "Complimentary treat with every booking", "active": True},
        {"id": "tag-pet-menu", "name": "Pet Menu", "pillar": "stay", "category": "amenities", "icon": "🍖", "color": "orange", "description": "In-house pet dining options", "active": True},
        {"id": "tag-off-leash", "name": "Off-Leash Area", "pillar": "stay", "category": "amenities", "icon": "🐕", "color": "green", "description": "Designated off-leash zones", "active": True},
        {"id": "tag-pet-sitter", "name": "Pet Sitter", "pillar": "stay", "category": "amenities", "icon": "👤", "color": "blue", "description": "On-call pet sitting service", "active": True},
        {"id": "tag-grooming", "name": "Grooming", "pillar": "stay", "category": "amenities", "icon": "✨", "color": "purple", "description": "Pet grooming services available", "active": True},
        {"id": "tag-vet-call", "name": "Vet on Call", "pillar": "stay", "category": "amenities", "icon": "🏥", "color": "red", "description": "24/7 veterinary support", "active": True},
        {"id": "tag-trails", "name": "Walking Trails", "pillar": "stay", "category": "amenities", "icon": "🌲", "color": "green", "description": "Pet-friendly walking trails", "active": True},
        {"id": "tag-beach", "name": "Beach Access", "pillar": "stay", "category": "amenities", "icon": "🏖️", "color": "cyan", "description": "Pet-friendly beach nearby", "active": True},
        {"id": "tag-pool", "name": "Pet Pool", "pillar": "stay", "category": "amenities", "icon": "🏊", "color": "blue", "description": "Dedicated pet swimming area", "active": True},
        # Dine Tags
        {"id": "tag-dine-treat", "name": "Paw Treat Included", "pillar": "dine", "category": "rewards", "icon": "🦴", "color": "amber", "description": "Complimentary treat with meal", "active": True},
        {"id": "tag-dog-menu", "name": "Dog Menu", "pillar": "dine", "category": "amenities", "icon": "📋", "color": "orange", "description": "Dedicated pet menu available", "active": True},
        {"id": "tag-outdoor", "name": "Outdoor Seating", "pillar": "dine", "category": "amenities", "icon": "☀️", "color": "yellow", "description": "Pet-friendly outdoor area", "active": True},
        {"id": "tag-water-bowl", "name": "Water Bowls", "pillar": "dine", "category": "amenities", "icon": "💧", "color": "blue", "description": "Fresh water always available", "active": True},
        # Travel Tags
        {"id": "tag-travel-kit", "name": "Pet Kit Included", "pillar": "travel", "category": "rewards", "icon": "🎒", "color": "amber", "description": "Travel essentials included", "active": True},
        {"id": "tag-climate", "name": "Climate Control", "pillar": "travel", "category": "amenities", "icon": "❄️", "color": "cyan", "description": "Temperature-controlled pet area", "active": True},
        # Care Tags
        {"id": "tag-first-visit", "name": "First Visit Discount", "pillar": "care", "category": "rewards", "icon": "🎉", "color": "purple", "description": "Special offer for first-time visitors", "active": True},
        {"id": "tag-certified", "name": "Certified Trainer", "pillar": "care", "category": "features", "icon": "🏅", "color": "gold", "description": "Certified professional trainer", "active": True},
    ]
    
    now = get_utc_timestamp()
    seeded = 0
    
    for tag in default_tags:
        existing = await db.pillar_tags.find_one({"id": tag["id"]})
        if not existing:
            tag["created_at"] = now
            tag["created_by"] = username
            await db.pillar_tags.insert_one(tag)
            seeded += 1
    
    return {"message": f"Seeded {seeded} tags", "total": len(default_tags)}


@stay_admin_router.post("/seed-bundles")
async def seed_stay_bundles(username: str = Depends(verify_admin)):
    """Seed default stay/travel bundles with images"""
    now = get_utc_timestamp()
    
    default_bundles = [
        {
            "id": "stay-bundle-weekend",
            "name": "Weekend Getaway Kit",
            "description": "Everything for a short trip: travel bowl, portable bed, and treats.",
            "price": 1499,
            "original_price": 1797,
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
            "category": "travel",
            "items": ["travel-bowl", "portable-bed", "travel-treats"],
            "featured": True,
            "active": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "stay-bundle-beach",
            "name": "Beach Pawcation Pack",
            "description": "Sun & sand essentials: cooling mat, dog sunscreen, and beach towel.",
            "price": 1799,
            "original_price": 2097,
            "image": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600",
            "category": "beach",
            "items": ["cooling-mat", "dog-sunscreen", "beach-towel"],
            "featured": True,
            "active": True,
            "paw_reward_points": 20,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "stay-bundle-mountain",
            "name": "Mountain Adventure Bundle",
            "description": "Hiking essentials: hiking booties, backpack carrier, and energy treats.",
            "price": 2499,
            "original_price": 2997,
            "image": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600",
            "category": "adventure",
            "items": ["hiking-booties", "backpack-carrier", "energy-treats"],
            "featured": True,
            "active": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        },
        {
            "id": "stay-bundle-roadtrip",
            "name": "Road Trip Essentials",
            "description": "Long drive comfort: car seat cover, safety harness, and travel water bottle.",
            "price": 1999,
            "original_price": 2397,
            "image": "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=600",
            "category": "travel",
            "items": ["car-seat-cover", "safety-harness", "travel-bottle"],
            "featured": True,
            "active": True,
            "paw_reward_points": 25,
            "is_birthday_perk": False
        },
        {
            "id": "stay-bundle-first-stay",
            "name": "First Stay Starter Pack",
            "description": "New traveler kit: anxiety wrap, familiar scent blanket, and calming treats.",
            "price": 1299,
            "original_price": 1497,
            "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=600",
            "category": "comfort",
            "items": ["anxiety-wrap", "scent-blanket", "calming-treats"],
            "featured": True,
            "active": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "stay-bundle-luxury",
            "name": "Luxury Pawcation Suite",
            "description": "Premium travel: orthopedic travel bed, gourmet treats, and grooming kit.",
            "price": 3499,
            "original_price": 4197,
            "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600",
            "category": "luxury",
            "items": ["orthopedic-bed", "gourmet-treats", "travel-grooming-kit"],
            "featured": True,
            "active": True,
            "paw_reward_points": 50,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "stay-bundle-boarding",
            "name": "Boarding Comfort Kit",
            "description": "Make boarding feel like home: comfort toy, familiar blanket, and treats.",
            "price": 999,
            "original_price": 1197,
            "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
            "category": "boarding",
            "items": ["comfort-toy", "home-blanket", "favorite-treats"],
            "featured": True,
            "active": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "stay-bundle-staycation",
            "name": "Local Staycation Bundle",
            "description": "Day trip essentials: collapsible bowl, poop bag holder, and snack pack.",
            "price": 699,
            "original_price": 847,
            "image": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600",
            "category": "local",
            "items": ["collapsible-bowl", "poop-bag-holder", "snack-pack"],
            "featured": True,
            "active": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        }
    ]
    
    seeded = 0
    for bundle in default_bundles:
        bundle["created_at"] = now
        bundle["updated_at"] = now
        bundle["created_by"] = username
        
        result = await db.stay_bundles.update_one(
            {"id": bundle["id"]},
            {"$set": bundle},
            upsert=True
        )
        if result.upserted_id or result.modified_count:
            seeded += 1
    
    return {"message": f"Seeded {seeded} stay bundles", "bundles_seeded": seeded}


@stay_admin_router.get("/bundles")
async def get_admin_stay_bundles(username: str = Depends(verify_admin)):
    """Get all stay bundles for admin"""
    bundles = await db.stay_bundles.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"bundles": bundles, "count": len(bundles)}


@stay_admin_router.delete("/bundles/{bundle_id}")
async def delete_stay_bundle(bundle_id: str, username: str = Depends(verify_admin)):
    """Delete a stay bundle"""
    result = await db.stay_bundles.delete_one({"id": bundle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return {"message": "Bundle deleted", "id": bundle_id}


@stay_admin_router.post("/bundles")
async def create_stay_bundle(bundle: dict, username: str = Depends(verify_admin)):
    """Create a new stay bundle"""
    bundle_id = f"stay-bundle-{str(ObjectId())[:8]}"
    now = get_utc_timestamp()
    
    bundle_doc = {
        "id": bundle_id,
        "name": bundle.get("name", ""),
        "description": bundle.get("description", ""),
        "price": float(bundle.get("price", 0)),
        "original_price": float(bundle.get("original_price", 0)) if bundle.get("original_price") else None,
        "image": bundle.get("image", ""),
        "category": bundle.get("category", "travel"),
        "items": bundle.get("items", []),
        "featured": bundle.get("featured", True),
        "active": bundle.get("active", True),
        "paw_reward_points": int(bundle.get("paw_reward_points", 0)),
        "is_birthday_perk": bundle.get("is_birthday_perk", False),
        "birthday_discount_percent": bundle.get("birthday_discount_percent"),
        "created_at": now,
        "updated_at": now,
        "created_by": username
    }
    
    await db.stay_bundles.insert_one(bundle_doc)
    return {"message": "Bundle created", "id": bundle_id, "bundle": bundle_doc}


@stay_admin_router.put("/bundles/{bundle_id}")
async def update_stay_bundle(bundle_id: str, bundle: dict, username: str = Depends(verify_admin)):
    """Update a stay bundle"""
    now = get_utc_timestamp()
    
    update_doc = {
        "name": bundle.get("name"),
        "description": bundle.get("description"),
        "price": float(bundle.get("price", 0)),
        "original_price": float(bundle.get("original_price", 0)) if bundle.get("original_price") else None,
        "image": bundle.get("image"),
        "category": bundle.get("category"),
        "items": bundle.get("items", []),
        "featured": bundle.get("featured", True),
        "active": bundle.get("active", True),
        "paw_reward_points": int(bundle.get("paw_reward_points", 0)),
        "is_birthday_perk": bundle.get("is_birthday_perk", False),
        "birthday_discount_percent": bundle.get("birthday_discount_percent"),
        "updated_at": now,
        "updated_by": username
    }
    
    # Remove None values
    update_doc = {k: v for k, v in update_doc.items() if v is not None}
    
    result = await db.stay_bundles.update_one(
        {"id": bundle_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated", "id": bundle_id}


# ==================== PRODUCTS CRUD ====================

@stay_admin_router.post("/seed-products")
async def seed_stay_products(username: str = Depends(verify_admin)):
    """Seed default stay/travel products with images"""
    now = get_utc_timestamp()
    
    default_products = [
        {
            "id": "stay-prod-carrier",
            "name": "Pet Travel Carrier Bag",
            "description": "Airline-approved soft-sided carrier with mesh ventilation and shoulder strap.",
            "price": 2499,
            "original_price": 2999,
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
            "category": "travel",
            "tags": ["carrier", "airline", "travel"],
            "stock": 50,
            "paw_reward_points": 25,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-bowl",
            "name": "Collapsible Travel Bowl Set",
            "description": "Food and water bowls that collapse flat for easy packing.",
            "price": 499,
            "original_price": 649,
            "image": "https://images.unsplash.com/photo-1601758124096-1fd661873db9?w=600",
            "category": "accessories",
            "tags": ["bowl", "collapsible", "portable"],
            "stock": 100,
            "paw_reward_points": 5,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-bed",
            "name": "Portable Travel Pet Bed",
            "description": "Lightweight, foldable bed with memory foam base for comfort on-the-go.",
            "price": 1799,
            "original_price": 2199,
            "image": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600",
            "category": "comfort",
            "tags": ["bed", "portable", "memory foam"],
            "stock": 30,
            "paw_reward_points": 20,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-cooling",
            "name": "Pet Cooling Mat",
            "description": "Pressure-activated cooling gel mat for hot weather travel.",
            "price": 1299,
            "original_price": 1599,
            "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
            "category": "comfort",
            "tags": ["cooling", "summer", "mat"],
            "stock": 45,
            "paw_reward_points": 15,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-harness",
            "name": "Car Safety Harness",
            "description": "Crash-tested vehicle safety harness with seatbelt attachment.",
            "price": 1499,
            "original_price": 1799,
            "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600",
            "category": "travel",
            "tags": ["safety", "car", "harness"],
            "stock": 60,
            "paw_reward_points": 18,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-anxiety",
            "name": "Travel Anxiety Calming Kit",
            "description": "Includes calming treats, anxiety wrap, and lavender spray.",
            "price": 1199,
            "original_price": 1449,
            "image": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600",
            "category": "comfort",
            "tags": ["anxiety", "calming", "travel"],
            "stock": 40,
            "paw_reward_points": 12,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-firstaid",
            "name": "Pet First Aid Travel Kit",
            "description": "Compact first aid kit with bandages, antiseptic, and emergency supplies.",
            "price": 899,
            "original_price": 1099,
            "image": "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=600",
            "category": "accessories",
            "tags": ["first-aid", "emergency", "safety"],
            "stock": 75,
            "paw_reward_points": 10,
            "pillar": "stay"
        },
        {
            "id": "stay-prod-waterbottle",
            "name": "Portable Water Bottle & Bowl",
            "description": "2-in-1 water bottle with flip-out bowl for walks and travel.",
            "price": 599,
            "original_price": 749,
            "image": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600",
            "category": "accessories",
            "tags": ["water", "portable", "bowl"],
            "stock": 90,
            "paw_reward_points": 6,
            "pillar": "stay"
        }
    ]
    
    seeded = 0
    for product in default_products:
        product["created_at"] = now
        product["updated_at"] = now
        product["created_by"] = username
        
        result = await db.products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        if result.upserted_id or result.modified_count:
            seeded += 1
    
    return {"message": f"Seeded {seeded} stay products", "products_seeded": seeded}


@stay_admin_router.get("/products")
async def get_admin_stay_products(username: str = Depends(verify_admin)):
    """Get all stay products for admin"""
    products = await db.products.find(
        {"pillar": "stay"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"products": products, "count": len(products)}


@stay_admin_router.post("/products")
async def create_stay_product(product: dict, username: str = Depends(verify_admin)):
    """Create a new stay product"""
    product_id = f"stay-prod-{str(ObjectId())[:8]}"
    now = get_utc_timestamp()
    
    product_doc = {
        "id": product_id,
        "name": product.get("name", ""),
        "description": product.get("description", ""),
        "price": float(product.get("price", 0)),
        "original_price": float(product.get("original_price", 0)) if product.get("original_price") else None,
        "image": product.get("image", ""),
        "category": product.get("category", "travel"),
        "tags": product.get("tags", []) if isinstance(product.get("tags"), list) else [t.strip() for t in str(product.get("tags", "")).split(",") if t.strip()],
        "stock": int(product.get("stock", 100)),
        "paw_reward_points": int(product.get("paw_reward_points", 0)),
        "pillar": "stay",
        "created_at": now,
        "updated_at": now,
        "created_by": username
    }
    
    await db.products.insert_one(product_doc)
    return {"message": "Product created", "id": product_id, "product": {k: v for k, v in product_doc.items() if k != "_id"}}


@stay_admin_router.put("/products/{product_id}")
async def update_stay_product(product_id: str, product: dict, username: str = Depends(verify_admin)):
    """Update a stay product"""
    now = get_utc_timestamp()
    
    update_doc = {
        "name": product.get("name"),
        "description": product.get("description"),
        "price": float(product.get("price", 0)),
        "original_price": float(product.get("original_price", 0)) if product.get("original_price") else None,
        "image": product.get("image"),
        "category": product.get("category"),
        "tags": product.get("tags", []) if isinstance(product.get("tags"), list) else [t.strip() for t in str(product.get("tags", "")).split(",") if t.strip()],
        "stock": int(product.get("stock", 100)),
        "paw_reward_points": int(product.get("paw_reward_points", 0)),
        "updated_at": now,
        "updated_by": username
    }
    
    # Remove None values
    update_doc = {k: v for k, v in update_doc.items() if v is not None}
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated", "id": product_id}


@stay_admin_router.delete("/products/{product_id}")
async def delete_stay_product(product_id: str, username: str = Depends(verify_admin)):
    """Delete a stay product"""
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted", "id": product_id}


@stay_admin_router.post("/properties/{property_id}/paw-reward")
async def update_property_paw_reward(
    property_id: str, 
    paw_reward: PawReward,
    username: str = Depends(verify_admin)
):
    """Update Paw Reward for a specific property"""
    result = await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "paw_reward": paw_reward.model_dump(),
            "updated_at": get_utc_timestamp(),
            "updated_by": username
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"message": "Paw Reward updated", "paw_reward": paw_reward.model_dump()}


@stay_admin_router.post("/properties/assign-paw-rewards")
async def bulk_assign_paw_rewards(username: str = Depends(verify_admin)):
    """Auto-assign Paw Rewards to all properties that don't have one"""
    properties = await db.stay_properties.find(
        {"$or": [{"paw_reward": None}, {"paw_reward.enabled": False}, {"paw_reward": {"$exists": False}}]},
        {"_id": 0, "id": 1}
    ).to_list(1000)
    
    assigned = 0
    for prop in properties:
        paw_reward = await get_random_reward_product()
        await db.stay_properties.update_one(
            {"id": prop["id"]},
            {"$set": {"paw_reward": paw_reward}}
        )
        assigned += 1
    
    return {"message": f"Assigned Paw Rewards to {assigned} properties", "assigned": assigned}


# ==================== ADMIN ROUTES ====================

# --- TAB 1: Property Basics ---

@stay_admin_router.get("/properties")
async def admin_get_properties(
    status: Optional[str] = None,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    compliance: Optional[str] = None,
    limit: int = 100,
    username: str = Depends(verify_admin)
):
    """Get all stay properties (admin)"""
    query = {}
    if status:
        query["status"] = status
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if property_type:
        query["property_type"] = property_type
    if compliance:
        query["compliance_status"] = compliance
    
    properties = await db.stay_properties.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Stats
    stats = {
        "total": await db.stay_properties.count_documents({}),
        "live": await db.stay_properties.count_documents({"status": "live"}),
        "draft": await db.stay_properties.count_documents({"status": "draft"}),
        "paused": await db.stay_properties.count_documents({"status": "paused"}),
        "featured": await db.stay_properties.count_documents({"featured": True}),
        "verified": await db.stay_properties.count_documents({"verified": True})
    }
    
    cities = await db.stay_properties.distinct("city")
    
    return {"properties": properties, "stats": stats, "cities": cities}


@stay_admin_router.post("/properties")
async def admin_create_property(
    property: StayPropertyCreate,
    username: str = Depends(verify_admin)
):
    """Create a new stay property"""
    now = get_utc_timestamp()
    
    # Calculate overall paw rating
    if property.paw_rating:
        scores = [property.paw_rating.comfort, property.paw_rating.safety, 
                  property.paw_rating.freedom, property.paw_rating.care, 
                  property.paw_rating.joy]
        valid_scores = [s for s in scores if s > 0]
        property.paw_rating.overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
    
    property_doc = {
        "id": f"stay-{uuid.uuid4().hex[:12]}",
        **property.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": username
    }
    
    await db.stay_properties.insert_one(property_doc)
    property_doc.pop("_id", None)
    
    logger.info(f"Created stay property: {property_doc['id']} - {property.name}")
    
    return {"message": "Property created", "property": property_doc}


@stay_admin_router.get("/properties/{property_id}")
async def admin_get_property(property_id: str, username: str = Depends(verify_admin)):
    """Get a single stay property (admin full view)"""
    property = await db.stay_properties.find_one({"id": property_id}, {"_id": 0})
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"property": property}


@stay_admin_router.put("/properties/{property_id}")
async def admin_update_property(
    property_id: str,
    property: StayPropertyCreate,
    username: str = Depends(verify_admin)
):
    """Full update of a stay property"""
    existing = await db.stay_properties.find_one({"id": property_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Calculate overall paw rating
    if property.paw_rating:
        scores = [property.paw_rating.comfort, property.paw_rating.safety, 
                  property.paw_rating.freedom, property.paw_rating.care, 
                  property.paw_rating.joy]
        valid_scores = [s for s in scores if s > 0]
        property.paw_rating.overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
    
    update_data = {
        **property.model_dump(),
        "updated_at": get_utc_timestamp(),
        "updated_by": username
    }
    
    await db.stay_properties.update_one({"id": property_id}, {"$set": update_data})
    
    updated = await db.stay_properties.find_one({"id": property_id}, {"_id": 0})
    return {"message": "Property updated", "property": updated}


@stay_admin_router.patch("/properties/{property_id}")
async def admin_patch_property(
    property_id: str,
    updates: StayPropertyUpdate,
    username: str = Depends(verify_admin)
):
    """Partial update of a stay property"""
    existing = await db.stay_properties.find_one({"id": property_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    # Recalculate paw rating if updated
    if "paw_rating" in update_data and update_data["paw_rating"]:
        pr = update_data["paw_rating"]
        scores = [pr.get("comfort", 0), pr.get("safety", 0), pr.get("freedom", 0), 
                  pr.get("care", 0), pr.get("joy", 0)]
        valid_scores = [s for s in scores if s > 0]
        update_data["paw_rating"]["overall"] = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
    
    update_data["updated_at"] = get_utc_timestamp()
    update_data["updated_by"] = username
    
    await db.stay_properties.update_one({"id": property_id}, {"$set": update_data})
    
    updated = await db.stay_properties.find_one({"id": property_id}, {"_id": 0})
    return {"message": "Property updated", "property": updated}


@stay_admin_router.delete("/properties/{property_id}")
async def admin_delete_property(property_id: str, username: str = Depends(verify_admin)):
    """Delete a stay property"""
    result = await db.stay_properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}


@stay_admin_router.put("/properties/{property_id}/status")
async def admin_update_status(
    property_id: str,
    status: str,
    username: str = Depends(verify_admin)
):
    """Update property status"""
    valid_statuses = ["draft", "onboarding", "live", "paused", "suspended"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be: {valid_statuses}")
    
    now = get_utc_timestamp()
    
    update = {
        "status": status,
        "updated_at": now,
        f"{status}_at": now,
        f"{status}_by": username
    }
    
    result = await db.stay_properties.update_one({"id": property_id}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"message": f"Status updated to {status}"}


# --- TAB 2: Pet Policy ---

@stay_admin_router.put("/properties/{property_id}/pet-policy")
async def admin_update_pet_policy(
    property_id: str,
    policy: PetPolicy,
    username: str = Depends(verify_admin)
):
    """Update pet policy for a property"""
    now = get_utc_timestamp()
    
    policy_data = policy.model_dump()
    policy_data["last_updated"] = now
    policy_data["updated_by"] = username
    
    # Log policy change for version history
    await db.stay_policy_history.insert_one({
        "id": f"hist-{uuid.uuid4().hex[:8]}",
        "property_id": property_id,
        "policy": policy_data,
        "changed_by": username,
        "changed_at": now
    })
    
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {"pet_policy": policy_data, "updated_at": now}}
    )
    
    return {"message": "Pet policy updated"}


@stay_admin_router.get("/properties/{property_id}/policy-history")
async def admin_get_policy_history(property_id: str, username: str = Depends(verify_admin)):
    """Get policy change history (version control)"""
    history = await db.stay_policy_history.find(
        {"property_id": property_id}, 
        {"_id": 0}
    ).sort("changed_at", -1).to_list(50)
    
    return {"history": history}


# --- TAB 3: Paw Standards ---

@stay_admin_router.put("/properties/{property_id}/paw-rating")
async def admin_update_paw_rating(
    property_id: str,
    rating: PawRating,
    username: str = Depends(verify_admin)
):
    """Update Paw Rating scores"""
    scores = [rating.comfort, rating.safety, rating.freedom, rating.care, rating.joy]
    valid_scores = [s for s in scores if s > 0]
    rating.overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
    
    now = get_utc_timestamp()
    
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "paw_rating": rating.model_dump(),
            "paw_rating_updated_at": now,
            "paw_rating_updated_by": username,
            "updated_at": now
        }}
    )
    
    return {"message": "Paw rating updated", "overall": rating.overall}


@stay_admin_router.put("/properties/{property_id}/badges")
async def admin_update_badges(
    property_id: str,
    badges: List[str],
    username: str = Depends(verify_admin)
):
    """Update property badges"""
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "badges": badges,
            "updated_at": get_utc_timestamp()
        }}
    )
    return {"message": "Badges updated"}


@stay_admin_router.post("/properties/{property_id}/incident")
async def admin_log_incident(
    property_id: str,
    incident: Dict,
    username: str = Depends(verify_admin)
):
    """Log an incident for a property"""
    now = get_utc_timestamp()
    
    incident_doc = {
        "id": f"inc-{uuid.uuid4().hex[:8]}",
        "type": incident.get("type", "general"),
        "description": incident.get("description", ""),
        "severity": incident.get("severity", "low"),  # low, medium, high, critical
        "reported_by": username,
        "reported_at": now,
        "resolution": None,
        "resolved_at": None
    }
    
    await db.stay_properties.update_one(
        {"id": property_id},
        {
            "$push": {"incident_history": incident_doc},
            "$set": {"updated_at": now}
        }
    )
    
    # If high/critical, change compliance status
    if incident.get("severity") in ["high", "critical"]:
        await db.stay_properties.update_one(
            {"id": property_id},
            {"$set": {"compliance_status": "warning"}}
        )
    
    return {"message": "Incident logged", "incident_id": incident_doc["id"]}


# --- TAB 4: Pet Menu & Add-ons ---

@stay_admin_router.put("/properties/{property_id}/pet-menu")
async def admin_update_pet_menu(
    property_id: str,
    menu_items: List[PetMenuItem],
    prepared_by: str = "hotel",
    username: str = Depends(verify_admin)
):
    """Update pet menu items"""
    # Add IDs to items without them
    for item in menu_items:
        if not item.id:
            item.id = f"menu-{uuid.uuid4().hex[:6]}"
    
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "pet_menu_available": len(menu_items) > 0,
            "pet_menu_items": [item.model_dump() for item in menu_items],
            "pet_menu_prepared_by": prepared_by,
            "updated_at": get_utc_timestamp()
        }}
    )
    
    return {"message": "Pet menu updated", "items_count": len(menu_items)}


@stay_admin_router.put("/properties/{property_id}/add-ons")
async def admin_update_add_ons(
    property_id: str,
    add_ons: List[StayAddOn],
    username: str = Depends(verify_admin)
):
    """Update add-on services"""
    for addon in add_ons:
        if not addon.id:
            addon.id = f"addon-{uuid.uuid4().hex[:6]}"
    
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "add_ons": [a.model_dump() for a in add_ons],
            "updated_at": get_utc_timestamp()
        }}
    )
    
    return {"message": "Add-ons updated", "count": len(add_ons)}


# --- TAB 5: Commercials & Reporting ---

@stay_admin_router.put("/properties/{property_id}/commercials")
async def admin_update_commercials(
    property_id: str,
    commercials: StayCommercials,
    username: str = Depends(verify_admin)
):
    """Update commercial settings"""
    await db.stay_properties.update_one(
        {"id": property_id},
        {"$set": {
            "commercials": commercials.model_dump(),
            "updated_at": get_utc_timestamp()
        }}
    )
    return {"message": "Commercials updated"}


@stay_admin_router.get("/properties/{property_id}/stats")
async def admin_get_property_stats(property_id: str, username: str = Depends(verify_admin)):
    """Get property performance stats"""
    # Get bookings for this property
    bookings = await db.stay_bookings.find({"property_id": property_id}).to_list(1000)
    
    total_bookings = len(bookings)
    pending = len([b for b in bookings if b.get("status") == "pending"])
    confirmed = len([b for b in bookings if b.get("status") == "confirmed"])
    completed = len([b for b in bookings if b.get("status") == "completed"])
    
    # Pet menu attach rate
    with_pet_meal = len([b for b in bookings if b.get("pet_meal_preorder")])
    pet_menu_rate = round(with_pet_meal / total_bookings * 100, 1) if total_bookings > 0 else 0
    
    # Mismatch reports
    mismatches = await db.policy_mismatch_reports.count_documents({"property_id": property_id})
    
    return {
        "total_bookings": total_bookings,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "conversion_rate": round(confirmed / total_bookings * 100, 1) if total_bookings > 0 else 0,
        "pet_menu_attach_rate": pet_menu_rate,
        "mismatch_reports": mismatches
    }


# --- Booking Management ---

@stay_admin_router.get("/bookings")
async def admin_get_bookings(
    status: Optional[str] = None,
    property_id: Optional[str] = None,
    limit: int = 100,
    username: str = Depends(verify_admin)
):
    """Get all stay bookings"""
    query = {}
    if status:
        query["status"] = status
    if property_id:
        query["property_id"] = property_id
    
    bookings = await db.stay_bookings.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    stats = {
        "total": await db.stay_bookings.count_documents({}),
        "pending": await db.stay_bookings.count_documents({"status": "pending"}),
        "contacted": await db.stay_bookings.count_documents({"status": "contacted"}),
        "confirmed": await db.stay_bookings.count_documents({"status": "confirmed"}),
        "completed": await db.stay_bookings.count_documents({"status": "completed"})
    }
    
    return {"bookings": bookings, "stats": stats}


@stay_admin_router.put("/bookings/{booking_id}/status")
async def admin_update_booking_status(
    booking_id: str,
    status: str,
    concierge_notes: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Update booking status"""
    valid_statuses = ["pending", "contacted", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be: {valid_statuses}")
    
    # Get booking for notification
    booking = await db.stay_bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    old_status = booking.get("status")
    now = get_utc_timestamp()
    
    update = {
        "status": status,
        "updated_at": now,
        f"{status}_at": now,
        f"{status}_by": username
    }
    
    if concierge_notes:
        update["concierge_notes"] = concierge_notes
    
    result = await db.stay_bookings.update_one({"id": booking_id}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking status unchanged")
    
    # Send notifications on status change
    if status != old_status:
        # Send email notification
        if RESEND_API_KEY and booking.get("guest_email") and status in ["confirmed", "cancelled"]:
            try:
                if status == "confirmed":
                    subject = f"✅ Stay Confirmed - {booking.get('property_name')}"
                    message = f"Great news! Your stay at {booking.get('property_name')} has been confirmed."
                else:
                    subject = f"❌ Stay Cancelled - {booking.get('property_name')}"
                    message = f"Unfortunately, your stay at {booking.get('property_name')} has been cancelled."
                
                resend.Emails.send({
                    "from": f"The Doggy Company Stay <{SENDER_EMAIL}>",
                    "to": booking.get("guest_email"),
                    "subject": subject,
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
                        <h2>{subject}</h2>
                        <p>{message}</p>
                        <p><strong>Property:</strong> {booking.get('property_name')}</p>
                        <p><strong>Check-in:</strong> {booking.get('check_in_date')}</p>
                        <p><strong>Check-out:</strong> {booking.get('check_out_date')}</p>
                        <p><strong>Pet:</strong> {booking.get('pet_name')}</p>
                        {f"<p><strong>Note:</strong> {concierge_notes}</p>" if concierge_notes else ""}
                    </div>
                    """
                })
                logger.info(f"Stay booking status email sent to {booking.get('guest_email')}")
            except Exception as e:
                logger.error(f"Failed to send booking status email: {e}")
        
        # Trigger notification engine
        try:
            from notification_engine import notify_booking_status_change
            await notify_booking_status_change(
                booking={
                    "id": booking_id,
                    "guest_name": booking.get("guest_name"),
                    "email": booking.get("guest_email"),
                    "phone": booking.get("guest_phone"),
                    "property_name": booking.get("property_name"),
                    "check_in_date": booking.get("check_in_date"),
                    "check_out_date": booking.get("check_out_date"),
                    "pet_name": booking.get("pet_name"),
                    "guests": booking.get("guests"),
                    "pets": booking.get("pets")
                },
                new_status=status,
                pillar="stay",
                triggered_by="admin"
            )
            logger.info(f"Notification engine triggered for stay booking {booking_id}: {old_status} -> {status}")
        except Exception as e:
            logger.error(f"Failed to trigger notification engine for stay booking: {e}")
        
        # Update linked service desk ticket
        try:
            from ticket_auto_create import update_ticket_from_event
            await update_ticket_from_event(db, "booking", booking_id, {
                "new_status": status,
                "pillar": "stay"
            })
        except Exception as e:
            logger.error(f"Failed to update ticket for stay booking: {e}")
    
    return {"message": f"Booking status updated to {status}"}


# --- Mismatch Reports ---

@stay_admin_router.get("/mismatch-reports")
async def admin_get_mismatch_reports(
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get policy mismatch reports"""
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.policy_mismatch_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    stats = {
        "total": await db.policy_mismatch_reports.count_documents({}),
        "open": await db.policy_mismatch_reports.count_documents({"status": "open"}),
        "investigating": await db.policy_mismatch_reports.count_documents({"status": "investigating"}),
        "resolved": await db.policy_mismatch_reports.count_documents({"status": "resolved"})
    }
    
    return {"reports": reports, "stats": stats}


@stay_admin_router.put("/mismatch-reports/{report_id}")
async def admin_update_mismatch_report(
    report_id: str,
    status: str,
    resolution_notes: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Update mismatch report status"""
    now = get_utc_timestamp()
    
    update = {
        "status": status,
        "updated_at": now,
        "updated_by": username
    }
    
    if resolution_notes:
        update["resolution_notes"] = resolution_notes
    
    if status == "resolved":
        update["resolved_at"] = now
        update["resolved_by"] = username
    
    await db.policy_mismatch_reports.update_one({"id": report_id}, {"$set": update})
    
    return {"message": "Report updated"}


# --- CSV Export/Import ---

@stay_admin_router.get("/export-csv")
async def admin_export_csv(username: str = Depends(verify_admin)):
    """Export all stay properties as CSV"""
    properties = await db.stay_properties.find({}, {"_id": 0}).to_list(5000)
    
    if not properties:
        raise HTTPException(status_code=404, detail="No properties to export")
    
    output = io.StringIO()
    fieldnames = [
        'id', 'name', 'property_type', 'city', 'area', 'state', 'country',
        'full_address', 'website', 'contact_phone', 'contact_email',
        'paw_rating_overall', 'pet_fee_per_night', 'max_pets_per_room',
        'badges', 'vibe_tags', 'status', 'featured', 'verified'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for prop in properties:
        row = {
            'id': prop.get('id'),
            'name': prop.get('name'),
            'property_type': prop.get('property_type'),
            'city': prop.get('city'),
            'area': prop.get('area'),
            'state': prop.get('state'),
            'country': prop.get('country'),
            'full_address': prop.get('full_address'),
            'website': prop.get('website'),
            'contact_phone': prop.get('contact_phone'),
            'contact_email': prop.get('contact_email'),
            'paw_rating_overall': prop.get('paw_rating', {}).get('overall', 0),
            'pet_fee_per_night': prop.get('pet_policy', {}).get('pet_fee_per_night', 0),
            'max_pets_per_room': prop.get('pet_policy', {}).get('max_pets_per_room', 1),
            'badges': '|'.join(prop.get('badges', [])),
            'vibe_tags': '|'.join(prop.get('vibe_tags', [])),
            'status': prop.get('status'),
            'featured': prop.get('featured'),
            'verified': prop.get('verified')
        }
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=stay_properties_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


# --- CSV Import ---

@stay_admin_router.post("/import-csv")
async def admin_import_csv(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Import properties from CSV file"""
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
                # Required fields
                name = row.get('name', '').strip()
                city = row.get('city', '').strip()
                
                if not name or not city:
                    errors.append(f"Row {row_num}: Missing name or city")
                    continue
                
                # Process property data
                property_data = {
                    "name": name,
                    "city": city,
                    "property_type": row.get('property_type', 'pet_hotel'),
                    "full_address": row.get('full_address', ''),
                    "pincode": row.get('pincode', ''),
                    "contact_phone": row.get('contact_phone', ''),
                    "contact_email": row.get('contact_email', ''),
                    "price_per_night": float(row.get('price_per_night', 0)) if row.get('price_per_night') else 0,
                    "rating": float(row.get('rating', 0)) if row.get('rating') else 0,
                    "image": row.get('image', ''),
                    "description": row.get('description', ''),
                    "status": row.get('status', 'live'),
                    "featured": str(row.get('featured', '')).lower() in ['true', '1', 'yes'],
                    "verified": str(row.get('verified', '')).lower() in ['true', '1', 'yes'],
                    "updated_at": get_utc_timestamp()
                }
                
                # Handle list fields
                for list_field in ['amenities', 'house_rules', 'pet_types_allowed']:
                    if row.get(list_field):
                        property_data[list_field] = [x.strip() for x in row[list_field].split('|') if x.strip()]
                
                # Handle paw_reward
                if row.get('paw_reward_enabled'):
                    property_data['paw_reward'] = {
                        "enabled": str(row.get('paw_reward_enabled', '')).lower() in ['true', '1', 'yes'],
                        "reward_name": row.get('paw_reward_name', 'Paw Reward'),
                        "max_value": float(row.get('paw_reward_max_value', 600)) if row.get('paw_reward_max_value') else 600
                    }
                
                # Check if property exists (by name and city)
                existing = await db.stay_properties.find_one({
                    "name": name,
                    "city": city
                })
                
                if existing:
                    await db.stay_properties.update_one(
                        {"_id": existing["_id"]},
                        {"$set": property_data}
                    )
                    updated += 1
                else:
                    import secrets
                    property_data["id"] = f"stay-{secrets.token_hex(8)}"
                    property_data["created_at"] = get_utc_timestamp()
                    await db.stay_properties.insert_one(property_data)
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


# --- Dashboard Stats ---

@stay_admin_router.get("/stats")
async def admin_get_stats(username: str = Depends(verify_admin)):
    """Get Stay dashboard statistics"""
    
    # Properties stats
    total_properties = await db.stay_properties.count_documents({})
    live_properties = await db.stay_properties.count_documents({"status": "live"})
    featured = await db.stay_properties.count_documents({"featured": True})
    with_pet_menu = await db.stay_properties.count_documents({"pet_menu_available": True})
    
    # Bookings stats
    total_bookings = await db.stay_bookings.count_documents({})
    pending_bookings = await db.stay_bookings.count_documents({"status": "pending"})
    confirmed_bookings = await db.stay_bookings.count_documents({"status": "confirmed"})
    
    # Mismatch reports
    open_mismatches = await db.policy_mismatch_reports.count_documents({"status": "open"})
    
    # By property type
    type_breakdown = await db.stay_properties.aggregate([
        {"$group": {"_id": "$property_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    
    # By city
    city_breakdown = await db.stay_properties.aggregate([
        {"$match": {"status": "live"}},
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "properties": {
            "total": total_properties,
            "live": live_properties,
            "featured": featured,
            "with_pet_menu": with_pet_menu
        },
        "bookings": {
            "total": total_bookings,
            "pending": pending_bookings,
            "confirmed": confirmed_bookings
        },
        "mismatches": {
            "open": open_mismatches
        },
        "by_type": type_breakdown,
        "by_city": city_breakdown
    }


@stay_router.get("/my-bookings")
async def get_my_bookings(email: str, limit: int = 20):
    """Get stay bookings for a specific user"""
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    now = datetime.now(timezone.utc)
    
    # Fetch all bookings for this user
    bookings = await db.stay_bookings.find(
        {"$or": [
            {"guest_email": email},
            {"customer.email": email},
            {"email": email}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Categorize into upcoming and past
    upcoming = []
    past = []
    
    for booking in bookings:
        check_in = booking.get("check_in") or booking.get("check_in_date")
        if check_in:
            try:
                check_in_date = datetime.fromisoformat(check_in.replace('Z', '+00:00')) if isinstance(check_in, str) else check_in
                if check_in_date.tzinfo is None:
                    check_in_date = check_in_date.replace(tzinfo=timezone.utc)
                
                if check_in_date >= now and booking.get("status") not in ["cancelled", "completed"]:
                    upcoming.append(booking)
                else:
                    past.append(booking)
            except:
                past.append(booking)
        else:
            past.append(booking)
    
    return {
        "bookings": bookings,
        "upcoming": upcoming,
        "past": past,
        "total": len(bookings)
    }
