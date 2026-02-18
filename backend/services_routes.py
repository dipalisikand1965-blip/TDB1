"""
SERVICES API Routes
===================
Execution Layer - "Where hands move"

Endpoints:
- GET /api/services/launchers - Get featured service launchers
- GET /api/services/inbox - Get all active tickets for user (grouped by status)
- GET /api/services/awaiting - Get tickets awaiting user action
- GET /api/services/orders - Get order-type tickets with shipping
- POST /api/services/request - Create a new service request
- GET /api/services/ticket/{ticket_id} - Get single ticket detail
- PATCH /api/services/ticket/{ticket_id} - Update ticket (user actions)
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import logging
import uuid
import os
import jwt

from motor.motor_asyncio import AsyncIOMotorClient
from ticket_status_system import (
    CanonicalStatus,
    AWAITING_USER_STATUSES,
    ACTIVE_STATUSES,
    SHIPPING_STATUSES,
    TODAY_WATCHLIST_STATUSES,
    TERMINAL_STATUSES,
    FEATURED_SERVICES,
    map_legacy_status,
    get_status_display_info,
    is_awaiting_user,
)
from utils.service_ticket_spine import (
    create_or_attach_service_ticket,
    is_valid_ticket_id,
    get_ticket_by_id,
    update_ticket_status,
    Channel,
    CreatedBy,
    Pillar,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/os/services", tags=["services-os"])

# ═══════════════════════════════════════════════════════════════════════════════
# SOUL INTEGRATION - Intent to Service Mapping
# Mira knows what the pet parent is thinking about
# ═══════════════════════════════════════════════════════════════════════════════

INTENT_TO_SERVICE_MAPPING = {
    "grooming": {
        "service_types": ["grooming", "spa", "bath", "haircut", "nail-trim", "coat-care", "ear-cleaning"],
        "why_timely": "grooming care",
        "emoji": "✂️"
    },
    "health": {
        "service_types": ["vet-consult", "health-checkup", "vaccination", "wellness", "dental-care", "lab-tests"],
        "why_timely": "health care",
        "emoji": "🏥"
    },
    "training": {
        "service_types": ["training", "obedience", "puppy-training", "agility"],
        "why_timely": "training",
        "emoji": "🎓"
    },
    "behaviour": {
        "service_types": ["behaviour-consultation", "anxiety-therapy", "aggression-management", "socialization"],
        "why_timely": "behaviour support",
        "emoji": "🧠"
    },
    "boarding": {
        "service_types": ["boarding", "daycare", "pet-sitting", "home-boarding", "overnight-stay"],
        "why_timely": "boarding",
        "emoji": "🏨"
    },
    "travel": {
        "service_types": ["pet-taxi", "transport", "relocation", "travel-kit", "airport-pickup", "pet-passport"],
        "why_timely": "travel arrangements",
        "emoji": "✈️"
    },
    "food": {
        "service_types": ["custom-meals", "nutrition-consult", "food-delivery", "diet-plan", "treats-subscription"],
        "why_timely": "nutrition",
        "emoji": "🍽️"
    },
    "emergency": {
        "service_types": ["emergency-vet", "urgent-care", "24hr-helpline", "ambulance", "first-aid"],
        "why_timely": "emergency care",
        "emoji": "🚨"
    },
    "puppies": {
        "service_types": ["puppy-training", "puppy-vaccination", "puppy-socialization", "puppy-essentials"],
        "why_timely": "puppy care",
        "emoji": "🐕"
    },
    "senior": {
        "service_types": ["senior-care", "mobility-therapy", "joint-supplements", "comfort-check"],
        "why_timely": "senior care",
        "emoji": "🦴"
    },
    "seasonal": {
        "service_types": ["monsoon-care", "summer-grooming", "winter-care", "flea-treatment"],
        "why_timely": "seasonal care",
        "emoji": "🌦️"
    },
}

# Service display names (pretty formatting)
SERVICE_DISPLAY_NAMES = {
    "grooming": "Grooming",
    "spa": "Spa Treatment",
    "bath": "Bath & Dry",
    "haircut": "Haircut",
    "nail-trim": "Nail Trim",
    "coat-care": "Coat Care",
    "ear-cleaning": "Ear Cleaning",
    "vet-consult": "Vet Consultation",
    "health-checkup": "Health Checkup",
    "vaccination": "Vaccination",
    "wellness": "Wellness Check",
    "dental-care": "Dental Care",
    "lab-tests": "Lab Tests",
    "training": "Training",
    "obedience": "Obedience Training",
    "puppy-training": "Puppy Training",
    "agility": "Agility Training",
    "behaviour-consultation": "Behaviour Consult",
    "anxiety-therapy": "Anxiety Therapy",
    "aggression-management": "Aggression Help",
    "socialization": "Socialization",
    "boarding": "Boarding",
    "daycare": "Daycare",
    "pet-sitting": "Pet Sitting",
    "home-boarding": "Home Boarding",
    "overnight-stay": "Overnight Stay",
    "pet-taxi": "Pet Taxi",
    "transport": "Transport",
    "relocation": "Relocation",
    "travel-kit": "Travel Kit",
    "airport-pickup": "Airport Pickup",
    "pet-passport": "Pet Passport",
    "custom-meals": "Custom Meals",
    "nutrition-consult": "Nutrition Consult",
    "food-delivery": "Food Delivery",
    "diet-plan": "Diet Plan",
    "treats-subscription": "Treats Box",
    "emergency-vet": "Emergency Vet",
    "urgent-care": "Urgent Care",
    "24hr-helpline": "24hr Helpline",
    "ambulance": "Pet Ambulance",
    "first-aid": "First Aid Kit",
    "senior-care": "Senior Care",
    "mobility-therapy": "Mobility Therapy",
    "joint-supplements": "Joint Supplements",
    "comfort-check": "Comfort Check",
    "monsoon-care": "Monsoon Care",
    "summer-grooming": "Summer Grooming",
    "winter-care": "Winter Care",
    "flea-treatment": "Flea Treatment",
    "puppy-vaccination": "Puppy Shots",
    "puppy-socialization": "Puppy Social",
    "puppy-essentials": "Puppy Essentials",
}

def format_service_name(service_type: str) -> str:
    """Get formatted display name for a service type."""
    return SERVICE_DISPLAY_NAMES.get(service_type, service_type.replace('-', ' ').title())

# Database connection (will be set from server.py)
_db = None

def set_database(database):
    """Set the database instance from server.py"""
    global _db
    _db = database
    logger.info("[SERVICES] Database connection set")

def get_db():
    """Get the database instance"""
    return _db

# JWT Config - Match server.py
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"


# ============================================
# MODELS
# ============================================

class ServiceRequestCreate(BaseModel):
    """Create a new service request."""
    service_type: str  # grooming, training, boarding, etc.
    pet_ids: List[str]
    pet_names: List[str]
    title: Optional[str] = None
    description: Optional[str] = None
    preferred_time_window: Optional[str] = None
    location: Optional[str] = None
    constraints: Optional[Dict[str, Any]] = None  # Auto-filled from MOJO
    pillar: Optional[str] = None
    source: str = "services_tab"  # services_tab, picks, today, concierge


class TicketUpdate(BaseModel):
    """User-initiated ticket updates."""
    action: str  # confirm_date, approve_quote, select_option, cancel
    data: Optional[Dict[str, Any]] = None


class PreferenceSave(BaseModel):
    """Save preference after service completion."""
    ticket_id: str
    preference_type: str  # preferred_provider, preferred_time, preferred_style
    value: Any


class UniversalIntentRequest(BaseModel):
    """
    Universal intent capture - used by search, chat, and any UI element.
    This model accepts free-form intent and routes to the unified pipeline.
    """
    intent: str  # Free-form user intent (e.g., "grooming for Lola tomorrow")
    pet_ids: Optional[List[str]] = None
    pet_names: Optional[List[str]] = None
    source: str = "search"  # search, chat, quick_action, voice
    device_type: Optional[str] = None  # mobile, desktop
    pillar_hint: Optional[str] = None  # Optional pillar classification hint


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_user_from_token_services(authorization: Optional[str] = None):
    """Extract user info from JWT token."""
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub") or payload.get("email")
        user_id = payload.get("user_id")
        
        if not user_email:
            return None
        
        db = get_db()
        if db is None:
            return None
        user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
        if user:
            user["user_id"] = user_id or user.get("id")
        return user
    except Exception as e:
        logger.warning(f"[SERVICES] Token decode error: {e}")
        return None


def enrich_ticket_for_frontend(ticket: Dict) -> Dict:
    """Add display info to a ticket for frontend consumption."""
    raw_status = ticket.get("status", "placed")
    canonical_status = map_legacy_status(raw_status)
    display_info = get_status_display_info(raw_status)
    
    return {
        **ticket,
        "status": canonical_status,
        "status_display": display_info,
        "awaiting_user": is_awaiting_user(raw_status),
        "pet_display": ", ".join(ticket.get("pet_names", [])) or ticket.get("pet_name", "Your pet"),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SOUL INTEGRATION HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

async def get_user_recent_intents_for_services(db, user_id: str, pet_id: str = None, hours: int = 48) -> List[Dict]:
    """
    Get user's recent LEARN intents for service recommendations.
    Same shared intent store as LEARN and PICKS - Mira knows!
    """
    if db is None or not user_id:
        return []
    
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=hours)
        
        # Resolve email to UUID if needed
        resolved_user_id = user_id
        if "@" in user_id:
            user_doc = await db.users.find_one({"email": user_id}, {"id": 1})
            if user_doc and user_doc.get("id"):
                resolved_user_id = user_doc["id"]
        
        query = {
            "user_id": resolved_user_id,
            "created_at": {"$gte": cutoff}
        }
        
        if pet_id:
            query["pet_id"] = pet_id
        
        intents = await db.user_learn_intents.find(
            query,
            {"_id": 0, "topic": 1, "confidence": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(10)
        
        # Dedupe by topic
        seen = set()
        unique = []
        for intent in intents:
            if intent["topic"] not in seen:
                seen.add(intent["topic"])
                unique.append(intent)
        
        return unique
        
    except Exception as e:
        logger.error(f"[SERVICES SOUL] Failed to get intents: {e}")
        return []


def get_timely_services_for_intents(intents: List[Dict], pet_name: str) -> List[Dict]:
    """
    Generate service recommendations based on recent chat intents.
    Returns services with 'is_timely' flag and soul-aware 'why_timely' reason.
    """
    timely_services = []
    seen_types = set()
    
    for intent in intents:
        topic = intent.get("topic")
        mapping = INTENT_TO_SERVICE_MAPPING.get(topic)
        if not mapping:
            continue
        
        emoji = mapping.get("emoji", "✨")
        
        for service_type in mapping["service_types"]:
            if service_type not in seen_types:
                seen_types.add(service_type)
                display_name = format_service_name(service_type)
                timely_services.append({
                    "service_type": service_type,
                    "display_name": display_name,  # Pretty name
                    "emoji": emoji,
                    "is_timely": True,
                    "timely_badge": "Timely",
                    "why_timely": f"{pet_name}'s {mapping['why_timely']}",
                    "matched_topic": topic
                })
    
    return timely_services[:8]  # Max 8 timely services


# ============================================
# ROUTES
# ============================================

@router.get("/launchers")
async def get_service_launchers(
    pet_id: Optional[str] = Query(None, description="Pet ID for timely context"),
    authorization: Optional[str] = Header(None)
):
    """
    Get featured service launchers (8 max visible).
    These are action entry points for the Services tab.
    
    SOUL INTEGRATION (NEW):
    - Checks recent chat intents
    - Marks matching launchers as 'is_timely'
    - Returns 'timely_services' shelf for "{petName} might need this"
    """
    db = get_db()
    launchers = []
    
    # Try to get from service_catalog with is_featured flag
    if db is not None:
        try:
            featured = await db.service_catalog.find(
                {"is_active": True, "is_featured": True},
                {"_id": 0}
            ).sort("sort_rank", 1).limit(8).to_list(8)
            
            if featured:
                launchers = featured
        except Exception as e:
            logger.warning(f"[SERVICES] Error fetching launchers from DB: {e}")
    
    # Fallback to static config if no DB launchers
    if not launchers:
        launchers = FEATURED_SERVICES.copy()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SOUL INTEGRATION: Get timely services based on recent chat intents
    # ═══════════════════════════════════════════════════════════════════════════
    timely_services = []
    timely_context = {"enabled": False, "topics": []}
    pet_name = "Your pet"
    
    user = await get_user_from_token_services(authorization)
    if user and db is not None:
        user_email = user.get("email") or user.get("sub")
        user_id = user.get("id") or user.get("user_id")
        
        # Get pet name
        if pet_id:
            pet = await db.pets.find_one(
                {"$or": [{"id": pet_id}, {"name": {"$regex": pet_id, "$options": "i"}}]},
                {"name": 1, "id": 1}
            )
            if pet:
                pet_name = pet.get("name", "Your pet")
                pet_id = pet.get("id") or pet_id
        
        # Get recent intents
        recent_intents = await get_user_recent_intents_for_services(
            db, user_email or user_id, pet_id
        )
        
        if recent_intents:
            timely_context["enabled"] = True
            timely_context["topics"] = [i["topic"] for i in recent_intents]
            logger.info(f"[SERVICES SOUL] Found {len(recent_intents)} intents for {pet_name}: {timely_context['topics']}")
            
            # Get timely service recommendations
            timely_services = get_timely_services_for_intents(recent_intents, pet_name)
            
            # Also mark matching launchers as timely
            timely_types = set()
            for ts in timely_services:
                timely_types.add(ts["service_type"])
            
            for launcher in launchers:
                launcher_id = launcher.get("id", "").lower()
                launcher_name = launcher.get("name", "").lower()
                if any(t in launcher_id or t in launcher_name for t in timely_types):
                    launcher["is_timely"] = True
                    launcher["timely_badge"] = "Timely"
    
    return {
        "success": True,
        "launchers": launchers,
        "timely_services": timely_services,  # NEW: Soul-aware service suggestions
        "timely_context": timely_context,  # NEW: Context info
        "pet_name": pet_name,
        "source": "database" if launchers != FEATURED_SERVICES else "static",
        # Intent-driven services will be added separately via get_intent_driven_services endpoint
    }


@router.get("/inbox")
async def get_services_inbox(
    pet_id: Optional[str] = Query(None, description="Filter by pet ID"),
    include_completed: bool = Query(False, description="Include completed tickets"),
    limit: int = Query(50, le=100),
    authorization: Optional[str] = Header(None)
):
    """
    Get all active tickets for the user, grouped by status.
    This powers the Services inbox view.
    
    OWNERSHIP CONTRACT (unified with icon-state):
    A ticket belongs to this user if ANY of these match:
    - ticket.member.email == user.email (canonical)
    - ticket.member.id == user.id (canonical if present)
    - ticket.parent_id == user.id (legacy back-compat)
    
    parent_id must NEVER be the sole gating filter.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "awaiting_user": [], "active": [], "orders": [], "completed": []}
    
    # Extract user identifiers
    user_email = user.get("email") or user.get("sub")
    user_id = user.get("id") or user.get("user_id")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OWNERSHIP CONTRACT: Match by email (primary) OR member.id OR parent_id (legacy)
    # This ensures new canonical tickets AND legacy tickets both appear
    # ═══════════════════════════════════════════════════════════════════════════
    ownership_conditions = []
    
    if user_email:
        ownership_conditions.append({"member.email": user_email})
    
    if user_id:
        ownership_conditions.append({"member.id": user_id})
        ownership_conditions.append({"parent_id": user_id})  # Legacy back-compat
    
    if not ownership_conditions:
        # Fallback - shouldn't happen but be safe
        return {"success": True, "awaiting_user": [], "active": [], "orders": [], "completed": []}
    
    # Build base query with ownership
    base_query = {"$or": ownership_conditions}
    
    # Add pet filter if specified
    if pet_id:
        base_query = {
            "$and": [
                base_query,
                {"$or": [{"pet_id": pet_id}, {"pet_ids": pet_id}]}
            ]
        }
    
    # Add status filter
    if not include_completed:
        if "$and" in base_query:
            base_query["$and"].append({"status": {"$nin": TERMINAL_STATUSES}})
        else:
            base_query = {"$and": [base_query, {"status": {"$nin": TERMINAL_STATUSES}}]}
    
    # Fetch from BOTH collections and merge (union)
    seen_ticket_ids = set()
    all_tickets = []
    
    # Query mira_tickets first (primary source)
    mira_cursor = db.mira_tickets.find(base_query, {"_id": 0}).sort("updated_at", -1).limit(limit)
    mira_tickets = await mira_cursor.to_list(limit)
    for t in mira_tickets:
        tid = t.get("ticket_id")
        if tid and tid not in seen_ticket_ids:
            seen_ticket_ids.add(tid)
            all_tickets.append(t)
    
    # Query tickets collection for any missed canonical tickets
    remaining = limit - len(all_tickets)
    if remaining > 0:
        tickets_cursor = db.tickets.find(base_query, {"_id": 0}).sort("updated_at", -1).limit(remaining)
        tickets_list = await tickets_cursor.to_list(remaining)
        for t in tickets_list:
            tid = t.get("ticket_id")
            if tid and tid not in seen_ticket_ids:
                seen_ticket_ids.add(tid)
                all_tickets.append(t)
    
    # Sort merged results by updated_at
    all_tickets.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    # Enrich and group
    awaiting_user = []
    active = []
    orders = []
    completed = []
    
    for ticket in all_tickets[:limit]:
        enriched = enrich_ticket_for_frontend(ticket)
        status = enriched["status"]
        
        if status in AWAITING_USER_STATUSES:
            awaiting_user.append(enriched)
        elif status in SHIPPING_STATUSES or ticket.get("ticket_type") == "order":
            orders.append(enriched)
        elif status in TERMINAL_STATUSES:
            completed.append(enriched)
        else:
            active.append(enriched)
    
    return {
        "success": True,
        "awaiting_user": awaiting_user,
        "active": active,
        "orders": orders,
        "completed": completed if include_completed else [],
        "counts": {
            "awaiting_user": len(awaiting_user),
            "active": len(active),
            "orders": len(orders),
            "total": len(all_tickets[:limit])
        },
        "_debug": {
            "ownership_query": "member.email OR member.id OR parent_id",
            "user_email": user_email,
            "user_id": user_id,
            "sources_queried": ["mira_tickets", "tickets"]
        }
    }


@router.get("/awaiting")
async def get_awaiting_user(
    pet_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """
    Get tickets that require user action.
    This powers the "Awaiting You" shelf (the killer UX).
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "tickets": [], "count": 0}
    
    parent_id = user.get("id") or user.get("user_id")
    
    query = {
        "parent_id": parent_id,
        "status": {"$in": AWAITING_USER_STATUSES}
    }
    if pet_id:
        query["$or"] = [{"pet_id": pet_id}, {"pet_ids": pet_id}]
    
    tickets_cursor = db.mira_tickets.find(query, {"_id": 0}).sort("updated_at", -1).limit(20)
    tickets = await tickets_cursor.to_list(20)
    
    enriched = [enrich_ticket_for_frontend(t) for t in tickets]
    
    return {
        "success": True,
        "tickets": enriched,
        "count": len(enriched)
    }


@router.get("/orders")
async def get_orders(
    status: Optional[str] = Query(None, description="Filter by shipping status"),
    limit: int = Query(20, le=50),
    authorization: Optional[str] = Header(None)
):
    """
    Get order-type tickets with shipping info.
    Orders are tickets with shipping sub-states.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "orders": [], "count": 0}
    
    parent_id = user.get("id") or user.get("user_id")
    
    query = {
        "parent_id": parent_id,
        "$or": [
            {"ticket_type": "order"},
            {"status": {"$in": SHIPPING_STATUSES}},
            {"shipping": {"$exists": True}}
        ]
    }
    
    if status:
        query["status"] = map_legacy_status(status)
    
    orders_cursor = db.mira_tickets.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit)
    orders = await orders_cursor.to_list(limit)
    
    enriched = [enrich_ticket_for_frontend(o) for o in orders]
    
    return {
        "success": True,
        "orders": enriched,
        "count": len(enriched)
    }


@router.get("/watchlist")
async def get_watchlist(
    pet_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """
    Get unified watchlist for TODAY panel.
    Pulls: Awaiting You + in_progress + payment_pending + scheduled + shipped
    From all ticket collections: mira_tickets, tickets, service_desk_tickets
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "watchlist": [], "count": 0, "stale": False}
    
    parent_id = user.get("id") or user.get("user_id")
    user_email = user.get("email")
    
    all_tickets = []
    
    # Query 1: mira_tickets (service requests from SERVICES tab)
    mira_query = {
        "parent_id": parent_id,
        "status": {"$in": TODAY_WATCHLIST_STATUSES}
    }
    if pet_id:
        mira_query["$or"] = [{"pet_id": pet_id}, {"pet_ids": pet_id}]
    
    tickets_cursor = db.mira_tickets.find(mira_query, {"_id": 0}).sort([
        ("status", 1),
        ("updated_at", -1)
    ]).limit(15)
    mira_tickets = await tickets_cursor.to_list(15)
    all_tickets.extend(mira_tickets)
    
    # Query 2: tickets (Service Desk tickets with option cards)
    # Prioritize options_ready and other awaiting user statuses
    awaiting_statuses = ["options_ready", "clarification_needed", "approval_pending", "payment_pending"]
    active_statuses = ["new", "in_progress", "scheduled", "shipped"]
    all_status_list = awaiting_statuses + active_statuses
    
    ticket_query = {
        "member.email": user_email,
        "status": {"$in": all_status_list}
    }
    
    # Use aggregation to sort awaiting statuses first
    pipeline = [
        {"$match": ticket_query},
        {"$addFields": {
            "sort_priority": {
                "$switch": {
                    "branches": [
                        {"case": {"$eq": ["$status", "options_ready"]}, "then": 0},
                        {"case": {"$eq": ["$status", "clarification_needed"]}, "then": 1},
                        {"case": {"$eq": ["$status", "approval_pending"]}, "then": 2},
                        {"case": {"$eq": ["$status", "payment_pending"]}, "then": 3},
                        {"case": {"$eq": ["$status", "in_progress"]}, "then": 4},
                        {"case": {"$eq": ["$status", "scheduled"]}, "then": 5},
                        {"case": {"$eq": ["$status", "shipped"]}, "then": 6},
                    ],
                    "default": 10
                }
            }
        }},
        {"$sort": {"sort_priority": 1, "updated_at": -1}},
        {"$limit": 15},
        {"$project": {"_id": 0, "sort_priority": 0}}
    ]
    
    sd_tickets = await db.tickets.aggregate(pipeline).to_list(15)
    
    # Transform SD tickets to watchlist format
    for t in sd_tickets:
        if not any(x.get("ticket_id") == t.get("ticket_id") for x in all_tickets):
            # Map to watchlist-friendly format
            t["id"] = t.get("ticket_id")
            t["title"] = t.get("description", "Service Request")[:50]
            if t.get("pending_options"):
                t["awaiting_reason"] = t["pending_options"].get("question", "Choose an option")
            all_tickets.append(t)
    
    # Query 3: service_desk_tickets (auto-created from conversations)
    sdt_query = {
        "member.email": user_email,
        "status": {"$in": all_status_list}
    }
    
    tickets_cursor3 = db.service_desk_tickets.find(sdt_query, {"_id": 0}).sort([
        ("updated_at", -1)
    ]).limit(10)
    conv_tickets = await tickets_cursor3.to_list(10)
    
    for t in conv_tickets:
        if not any(x.get("ticket_id") == t.get("ticket_id") for x in all_tickets):
            t["id"] = t.get("ticket_id")
            t["title"] = t.get("subject") or t.get("description", "Request")[:50]
            if t.get("pending_options"):
                t["awaiting_reason"] = t["pending_options"].get("question", "Choose an option")
            all_tickets.append(t)
    
    # Sort combined results by status priority then updated_at
    def status_priority(s):
        priorities = {"options_ready": 0, "clarification_needed": 1, "approval_pending": 2, 
                     "payment_pending": 3, "in_progress": 4, "scheduled": 5, "shipped": 6}
        return priorities.get(s, 10)
    
    def get_updated_at_str(t):
        """Convert updated_at to string for comparison"""
        val = t.get("updated_at", "")
        if val is None:
            return ""
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val)
    
    all_tickets.sort(key=lambda x: (status_priority(x.get("status", "")), get_updated_at_str(x)), reverse=False)
    all_tickets = all_tickets[:20]  # Limit final list
    
    enriched = [enrich_ticket_for_frontend(t) for t in all_tickets]
    
    # Check for stale data (older than 5 minutes without update)
    stale = False
    if all_tickets:
        updates = [get_updated_at_str(t) for t in all_tickets if get_updated_at_str(t)]
        if updates:
            oldest_update = min(updates)
            try:
                oldest_dt = datetime.fromisoformat(oldest_update.replace("Z", "+00:00"))
                stale = (datetime.now(timezone.utc) - oldest_dt) > timedelta(minutes=5)
            except (ValueError, TypeError):
                pass
    
    return {
        "success": True,
        "watchlist": enriched,
        "count": len(enriched),
        "stale": stale
    }


@router.post("/request")
async def create_service_request(
    request: ServiceRequestCreate,
    authorization: Optional[str] = Header(None)
):
    """
    UNIFIED SERVICE PIPELINE (HARDCODED):
    User Request → Service Desk Ticket → Admin Notification → Member Notification 
    → Pillar Request → Tickets → Channel Intakes
    
    Works for BOTH mobile and desktop.
    This is the SINGLE PIPE for ALL service requests from ANY source.
    ALL ticket creation routes through create_or_attach_service_ticket().
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        # Return mock for development
        mock_id = f"TCK-{datetime.now().strftime('%Y')}-000000"
        return {
            "success": True,
            "ticket_id": mock_id,
            "status": "placed",
            "message": "Service request created (mock)",
            "mock": True
        }
    
    user_email = user.get("email", "")
    user_name = user.get("name", user.get("full_name", "Member"))
    user_id = user.get("id") or user.get("user_id")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CENTRALIZED TICKET CREATION via create_or_attach_service_ticket()
    # This is the ONLY allowed way to create/attach tickets.
    # ═══════════════════════════════════════════════════════════════════════════
    result = await create_or_attach_service_ticket(
        db=db,
        
        # Intent
        intent=request.title or f"{request.service_type.title()} Request",
        intent_type="request",
        
        # Member
        member_email=user_email,
        member_name=user_name,
        member_id=user_id,
        
        # Pet
        pet_ids=request.pet_ids,
        pet_names=request.pet_names,
        
        # Classification
        pillar=request.pillar or request.service_type,
        category=request.service_type,
        
        # Source tracking (for audits)
        source_route="services_routes.py",
        channel=Channel.WEB if request.source != "app" else Channel.APP,
        created_by=CreatedBy.MEMBER,
        
        # Payload
        payload={
            "service_type": request.service_type,
            "description": request.description,
            "constraints": request.constraints,
            "preferred_time_window": request.preferred_time_window,
            "location": request.location,
        },
        
        # Options
        urgency="normal",
        notify_admin=True,
        notify_member=True,
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail="Failed to create ticket")
    
    ticket_id = result["ticket_id"]
    
    # Log success
    logger.info(f"[SERVICE DESK] Ticket {result['action']}: {ticket_id} | Type: {request.service_type} | Member: {user_email} | Pets: {request.pet_names}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RETURN: Complete ticket response
    # The centralized helper already handled:
    # - Admin notification
    # - Member notification  
    # - Pillar request logging (via payload)
    # - Channel intake recording (via source tracking)
    # ═══════════════════════════════════════════════════════════════════════════
    return {
        "success": True,
        "ticket_id": ticket_id,
        "status": "placed",
        "message": f"Your {request.service_type} request has been submitted. Our concierge team has been notified.",
        "pipeline_complete": True,
        "action": result["action"],
        "ticket": {
            "ticket_id": ticket_id,
            "status": "placed",
            "pillar": request.pillar or request.service_type,
            "service_type": request.service_type,
            "pet_names": request.pet_names,
            "awaiting_user": False,
            "pet_display": ", ".join(request.pet_names or [])
        }
    }


@router.get("/ticket/{ticket_id}")
async def get_ticket_detail(
    ticket_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get full ticket detail for the task detail view.
    Single source of truth for that request.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    parent_id = user.get("id") or user.get("user_id")
    
    ticket = await db.mira_tickets.find_one(
        {"ticket_id": ticket_id, "parent_id": parent_id},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    return {
        "success": True,
        "ticket": enrich_ticket_for_frontend(ticket)
    }


@router.patch("/ticket/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    update: TicketUpdate,
    authorization: Optional[str] = Header(None)
):
    """
    User-initiated ticket updates.
    Actions: confirm_date, approve_quote, select_option, cancel
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    parent_id = user.get("id") or user.get("user_id")
    now = datetime.now(timezone.utc)
    
    ticket = await db.mira_tickets.find_one(
        {"ticket_id": ticket_id, "parent_id": parent_id}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    # Process action
    new_status = None
    timeline_note = ""
    update_data = {"updated_at": now.isoformat()}
    
    if update.action == "confirm_date":
        new_status = CanonicalStatus.SCHEDULED.value
        timeline_note = f"Date confirmed: {update.data.get('date', 'TBD')}"
        update_data["scheduled_at"] = update.data.get("date")
        
    elif update.action == "approve_quote":
        new_status = CanonicalStatus.PAYMENT_PENDING.value
        timeline_note = f"Quote approved: ₹{update.data.get('amount', '0')}"
        update_data["approved_amount"] = update.data.get("amount")
        
    elif update.action == "select_option":
        new_status = CanonicalStatus.IN_PROGRESS.value
        timeline_note = f"Option selected: {update.data.get('option', 'Option A')}"
        update_data["selected_option"] = update.data.get("option")
        
    elif update.action == "cancel":
        new_status = CanonicalStatus.CANCELLED.value
        timeline_note = "Cancelled by user"
        
    elif update.action == "complete_payment":
        new_status = CanonicalStatus.SCHEDULED.value
        timeline_note = "Payment completed"
        update_data["payment_status"] = "paid"
        update_data["paid_at"] = now.isoformat()
        
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {update.action}")
    
    # Update ticket
    if new_status:
        update_data["status"] = new_status
    
    # Append to timeline
    timeline_entry = {
        "status": new_status,
        "timestamp": now.isoformat(),
        "note": timeline_note,
        "action": update.action
    }
    
    await db.mira_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": update_data,
            "$push": {"timeline": timeline_entry}
        }
    )
    
    logger.info(f"[SERVICES] Ticket updated: {ticket_id} | Action: {update.action} | New status: {new_status}")
    
    # Fetch updated ticket
    updated_ticket = await db.mira_tickets.find_one(
        {"ticket_id": ticket_id},
        {"_id": 0}
    )
    
    return {
        "success": True,
        "ticket": enrich_ticket_for_frontend(updated_ticket),
        "action": update.action,
        "message": timeline_note
    }


# ═══════════════════════════════════════════════════════════════════════════════
# UNIVERSAL INTENT ENDPOINT
# Captures intent from ANYWHERE (search, chat, voice, quick action)
# Routes through the SAME unified pipeline
# ═══════════════════════════════════════════════════════════════════════════════

SERVICE_TYPE_MAPPING = {
    "groom": "grooming",
    "grooming": "grooming",
    "bath": "grooming",
    "haircut": "grooming",
    "nail": "grooming",
    "train": "training",
    "training": "training",
    "obedience": "training",
    "board": "boarding",
    "boarding": "boarding",
    "stay": "boarding",
    "overnight": "boarding",
    "vet": "vet_visit",
    "doctor": "vet_visit",
    "checkup": "vet_visit",
    "vaccination": "vet_visit",
    "walk": "walking",
    "walking": "walking",
    "exercise": "walking",
    "photo": "photography",
    "photography": "photography",
    "shoot": "photography",
    "party": "party_setup",
    "birthday": "party_setup",
    "celebration": "party_setup",
    "travel": "travel",
    "transport": "travel",
    "taxi": "travel",
    "relocate": "travel",
}

def extract_service_type(intent: str) -> str:
    """Extract service type from free-form intent."""
    intent_lower = intent.lower()
    for keyword, service_type in SERVICE_TYPE_MAPPING.items():
        if keyword in intent_lower:
            return service_type
    return "general"


@router.post("/intent")
async def capture_universal_intent(
    request: UniversalIntentRequest,
    authorization: Optional[str] = Header(None)
):
    """
    UNIVERSAL INTENT CAPTURE - Single entry point for ALL service intents.
    
    Sources: search bar, chat input, voice command, quick action buttons
    
    Pipeline: Intent → Parse → Service Desk Ticket → Admin Notify → Member Notify → Channel Intake
    
    Works for BOTH mobile and desktop.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "message": "Intent captured (mock)", "mock": True}
    
    # Extract service type from intent
    service_type = extract_service_type(request.intent)
    
    # Build service request
    service_request = ServiceRequestCreate(
        service_type=service_type,
        pet_ids=request.pet_ids or [],
        pet_names=request.pet_names or [],
        title=request.intent[:100],  # First 100 chars as title
        description=request.intent,
        source=request.source,
        pillar=request.pillar_hint or service_type,
        constraints={
            "original_intent": request.intent,
            "device_type": request.device_type,
            "source": request.source
        }
    )
    
    # Route through the unified pipeline
    return await create_service_request(service_request, authorization)


@router.post("/preference")
async def save_preference(
    pref: PreferenceSave,
    authorization: Optional[str] = Header(None)
):
    """
    Save preference after service completion.
    This is how Services learns without creepiness.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "mock": True}
    
    parent_id = user.get("id") or user.get("user_id")
    now = datetime.now(timezone.utc)
    
    # Update ticket with preference
    await db.mira_tickets.update_one(
        {"ticket_id": pref.ticket_id, "parent_id": parent_id},
        {
            "$set": {
                f"preferences_saved.{pref.preference_type}": pref.value,
                "updated_at": now.isoformat()
            }
        }
    )
    
    # Also update user's pet soul with this preference
    ticket = await db.mira_tickets.find_one({"ticket_id": pref.ticket_id})
    if ticket:
        pet_ids = ticket.get("pet_ids", [ticket.get("pet_id")])
        for pet_id in pet_ids:
            if pet_id:
                await db.doggy_soul_answers.update_one(
                    {"pet_id": pet_id},
                    {
                        "$set": {
                            f"service_preferences.{pref.preference_type}": pref.value,
                            "updated_at": now.isoformat()
                        }
                    },
                    upsert=True
                )
    
    logger.info(f"[SERVICES] Preference saved: {pref.preference_type} = {pref.value}")
    
    return {
        "success": True,
        "message": f"Preference saved: {pref.preference_type}"
    }


@router.get("/stats")
async def get_services_stats(
    authorization: Optional[str] = Header(None)
):
    """
    Get service statistics for the user.
    Useful for dashboard widgets.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        return {"success": True, "stats": {"awaiting": 0, "active": 0, "completed": 0}}
    
    db = get_db()
    if db is None:
        return {"success": True, "stats": {"awaiting": 0, "active": 0, "completed": 0}}
    
    parent_id = user.get("id") or user.get("user_id")
    
    awaiting = await db.mira_tickets.count_documents({
        "parent_id": parent_id,
        "status": {"$in": AWAITING_USER_STATUSES}
    })
    
    active = await db.mira_tickets.count_documents({
        "parent_id": parent_id,
        "status": {"$in": ACTIVE_STATUSES}
    })
    
    completed = await db.mira_tickets.count_documents({
        "parent_id": parent_id,
        "status": {"$in": TERMINAL_STATUSES}
    })
    
    return {
        "success": True,
        "stats": {
            "awaiting": awaiting,
            "active": active,
            "completed": completed,
            "total": awaiting + active + completed
        }
    }
