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

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/os/services", tags=["services-os"])

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


# ============================================
# ROUTES
# ============================================

@router.get("/launchers")
async def get_service_launchers(
    authorization: Optional[str] = Header(None)
):
    """
    Get featured service launchers (8 max visible).
    These are action entry points for the Services tab.
    """
    db = get_db()
    
    # Try to get from service_catalog with is_featured flag
    if db is not None:
        try:
            featured = await db.service_catalog.find(
                {"is_active": True, "is_featured": True},
                {"_id": 0}
            ).sort("sort_rank", 1).limit(8).to_list(8)
            
            if featured:
                return {
                    "success": True,
                    "launchers": featured,
                    "source": "database"
                }
        except Exception as e:
            logger.warning(f"[SERVICES] Error fetching launchers from DB: {e}")
    
    # Fallback to static config
    return {
        "success": True,
        "launchers": FEATURED_SERVICES,
        "source": "static"
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
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "awaiting_user": [], "active": [], "orders": [], "completed": []}
    
    parent_id = user.get("id") or user.get("user_id")
    
    # Build query
    query = {"parent_id": parent_id}
    if pet_id:
        query["$or"] = [
            {"pet_id": pet_id},
            {"pet_ids": pet_id}
        ]
    
    if not include_completed:
        query["status"] = {"$nin": TERMINAL_STATUSES}
    
    # Fetch tickets
    tickets_cursor = db.mira_tickets.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit)
    tickets = await tickets_cursor.to_list(limit)
    
    # Enrich and group
    awaiting_user = []
    active = []
    orders = []
    completed = []
    
    for ticket in tickets:
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
            "total": len(tickets)
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
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        return {"success": True, "watchlist": [], "count": 0, "stale": False}
    
    parent_id = user.get("id") or user.get("user_id")
    
    query = {
        "parent_id": parent_id,
        "status": {"$in": TODAY_WATCHLIST_STATUSES}
    }
    if pet_id:
        query["$or"] = [{"pet_id": pet_id}, {"pet_ids": pet_id}]
    
    tickets_cursor = db.mira_tickets.find(query, {"_id": 0}).sort([
        ("status", 1),  # Awaiting user first
        ("updated_at", -1)
    ]).limit(20)
    tickets = await tickets_cursor.to_list(20)
    
    enriched = [enrich_ticket_for_frontend(t) for t in tickets]
    
    # Check for stale data (older than 5 minutes without update)
    stale = False
    if tickets:
        oldest_update = min(t.get("updated_at", "") for t in tickets)
        if oldest_update:
            try:
                oldest_dt = datetime.fromisoformat(oldest_update.replace("Z", "+00:00"))
                stale = (datetime.now(timezone.utc) - oldest_dt) > timedelta(minutes=5)
            except:
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
    Create a new service request.
    This is the single pipe entry point for all service requests.
    """
    user = await get_user_from_token_services(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    if db is None:
        # Return mock for development
        mock_id = f"SVC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        return {
            "success": True,
            "ticket_id": mock_id,
            "status": "placed",
            "message": f"Service request created (mock)",
            "mock": True
        }
    
    parent_id = user.get("id") or user.get("user_id")
    now = datetime.now(timezone.utc)
    
    # Generate ticket ID
    ticket_id = f"SVC-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Build ticket document
    ticket_doc = {
        "ticket_id": ticket_id,
        "ticket_type": "service",
        "service_type": request.service_type,
        "status": CanonicalStatus.PLACED.value,
        
        # Who
        "parent_id": parent_id,
        "pet_ids": request.pet_ids,
        "pet_names": request.pet_names,
        "pet_id": request.pet_ids[0] if request.pet_ids else None,
        "pet_name": request.pet_names[0] if request.pet_names else None,
        
        # What
        "title": request.title or f"{request.service_type.title()} Request",
        "description": request.description or "",
        "constraints": request.constraints or {},
        
        # When/Where
        "preferred_time_window": request.preferred_time_window,
        "location": request.location,
        
        # Metadata
        "pillar": request.pillar or request.service_type,
        "source": request.source,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        
        # Timeline
        "timeline": [
            {
                "status": "placed",
                "timestamp": now.isoformat(),
                "note": "Request submitted"
            }
        ]
    }
    
    await db.mira_tickets.insert_one(ticket_doc)
    logger.info(f"[SERVICES] Created service request: {ticket_id} | Type: {request.service_type} | Pets: {request.pet_names}")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "status": "placed",
        "message": f"Your {request.service_type} request has been submitted",
        "ticket": enrich_ticket_for_frontend({**ticket_doc, "_id": None})
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
