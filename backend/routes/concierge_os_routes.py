"""
CONCIERGE OS Layer - Backend Routes
====================================
Mira OS Concierge = Judgment + Execution + Accountability

Routes for the Concierge home screen, threads, and messaging.
Integrates with the Unified Service Flow (tickets).

Endpoints:
- GET /api/os/concierge/home - Home screen data (active requests, recent threads)
- GET /api/os/concierge/status - Live/offline status
- POST /api/os/concierge/thread - Create new thread from intent
- GET /api/os/concierge/thread/{id} - Thread detail with messages
- POST /api/os/concierge/message - Send message to thread
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/os/concierge", tags=["Concierge OS"])

# Database reference (set from server.py)
db = None

# Import central signal flow for unified tickets
try:
    from central_signal_flow import create_signal
    CENTRAL_FLOW_AVAILABLE = True
except ImportError:
    CENTRAL_FLOW_AVAILABLE = False
    logger.warning("Central signal flow not available for Concierge OS")

def set_concierge_os_db(database):
    """Set database reference"""
    global db
    db = database
    logger.info("Concierge OS routes initialized")


# ============================================================================
# MODELS
# ============================================================================

class ThreadCreateRequest(BaseModel):
    """Request to create a new concierge thread"""
    pet_id: str
    user_id: str
    intent: str  # "Tell Mira what you need" input
    source: Optional[str] = "concierge_home"  # concierge_home, learn, today, picks, services
    source_context: Optional[Dict[str, Any]] = None  # Context from source layer
    suggestion_chip: Optional[str] = None  # If started from chip: grooming, boarding, travel, lost_pet


class SimpleThreadCreateRequest(BaseModel):
    """Simplified request for creating thread from ConciergeButton"""
    user_id: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    source: Optional[str] = "concierge_button"
    title: Optional[str] = None


class MessageSendRequest(BaseModel):
    """Request to send a message in a thread"""
    thread_id: str
    user_id: str
    content: str
    attachments: Optional[List[Dict[str, Any]]] = None


class ThreadMessage(BaseModel):
    """A message in a concierge thread"""
    id: str
    thread_id: str
    sender: str  # "user" or "concierge"
    content: str
    timestamp: str
    status_chip: Optional[str] = None  # "Options ready", "Payment pending", etc.
    attachments: Optional[List[Dict[str, Any]]] = None


class ConciergeThread(BaseModel):
    """A concierge conversation thread"""
    id: str
    pet_id: str
    user_id: str
    pet_name: str
    title: str  # Generated from first message or intent
    status: str  # "active", "awaiting_user", "awaiting_concierge", "completed"
    ticket_id: Optional[str] = None  # Linked mira_ticket if any
    source: str
    source_context: Optional[Dict[str, Any]] = None
    last_message_preview: str
    last_message_at: str
    message_count: int
    unread_count: int
    created_at: str


# ============================================================================
# CONCIERGE OPERATING HOURS
# ============================================================================

# Default operating hours (IST) - can be overridden via admin settings
# NOTE: Concierge is 24/7 by default - always available for members
DEFAULT_CONCIERGE_HOURS = {
    "start": 0,   # 12:00 AM IST (not used when 24x7)
    "end": 24,    # 12:00 AM IST (not used when 24x7)
    "timezone_offset": 5.5,  # IST is UTC+5:30
    "timezone_name": "IST",
    "is_24x7": True,  # Always online - Concierge® is 24/7
    "weekend_hours": None,  # Optional different hours for weekends
    "offline_message": "We're always here for you! Leave a message and we'll respond shortly."
}

# In-memory cache for settings (refreshed from DB)
_concierge_hours_cache = None
_cache_timestamp = None
_date_overrides_cache = None
_date_overrides_timestamp = None

async def get_concierge_hours() -> Dict[str, Any]:
    """
    Get concierge operating hours from database or use defaults.
    Caches result for 5 minutes to reduce DB calls.
    """
    global _concierge_hours_cache, _cache_timestamp
    
    # Check cache (valid for 5 minutes)
    if _concierge_hours_cache and _cache_timestamp:
        cache_age = (datetime.now(timezone.utc) - _cache_timestamp).total_seconds()
        if cache_age < 300:  # 5 minutes
            return _concierge_hours_cache
    
    # Try to get from database
    if db is not None:
        try:
            settings = await db.admin_settings.find_one({"setting_type": "concierge_hours"})
            if settings:
                hours = {
                    "start": settings.get("start", DEFAULT_CONCIERGE_HOURS["start"]),
                    "end": settings.get("end", DEFAULT_CONCIERGE_HOURS["end"]),
                    "timezone_offset": settings.get("timezone_offset", DEFAULT_CONCIERGE_HOURS["timezone_offset"]),
                    "timezone_name": settings.get("timezone_name", DEFAULT_CONCIERGE_HOURS["timezone_name"]),
                    "is_24x7": settings.get("is_24x7", DEFAULT_CONCIERGE_HOURS["is_24x7"]),
                    "weekend_hours": settings.get("weekend_hours"),
                    "offline_message": settings.get("offline_message", DEFAULT_CONCIERGE_HOURS["offline_message"])
                }
                _concierge_hours_cache = hours
                _cache_timestamp = datetime.now(timezone.utc)
                return hours
        except Exception as e:
            logger.error(f"Error fetching concierge hours from DB: {e}")
    
    # Return defaults
    _concierge_hours_cache = DEFAULT_CONCIERGE_HOURS.copy()
    _cache_timestamp = datetime.now(timezone.utc)
    return DEFAULT_CONCIERGE_HOURS.copy()


async def get_date_overrides() -> List[Dict[str, Any]]:
    """
    Get date-specific schedule overrides (holidays, special hours).
    Caches result for 1 minute.
    """
    global _date_overrides_cache, _date_overrides_timestamp
    
    # Check cache (valid for 1 minute)
    if _date_overrides_cache is not None and _date_overrides_timestamp:
        cache_age = (datetime.now(timezone.utc) - _date_overrides_timestamp).total_seconds()
        if cache_age < 60:  # 1 minute
            return _date_overrides_cache
    
    overrides = []
    if db is not None:
        try:
            cursor = db.concierge_date_overrides.find({}).sort("date", 1)
            async for doc in cursor:
                overrides.append({
                    "id": str(doc.get("_id", "")),
                    "date": doc.get("date"),  # Format: "YYYY-MM-DD"
                    "is_closed": doc.get("is_closed", False),
                    "start_hour": doc.get("start_hour"),
                    "end_hour": doc.get("end_hour"),
                    "reason": doc.get("reason", ""),
                    "created_at": doc.get("created_at")
                })
        except Exception as e:
            logger.error(f"Error fetching date overrides: {e}")
    
    _date_overrides_cache = overrides
    _date_overrides_timestamp = datetime.now(timezone.utc)
    return overrides


async def get_concierge_status() -> Dict[str, Any]:
    """
    Get current concierge status based on operating hours.
    Checks date-specific overrides first, then regular hours.
    Returns live status, next available time, and message.
    """
    hours = await get_concierge_hours()
    
    # Get current time in local timezone
    now_utc = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=hours["timezone_offset"])
    now_local = now_utc + ist_offset
    
    current_hour = now_local.hour
    current_day = now_local.weekday()  # 0=Monday, 6=Sunday
    is_weekend = current_day >= 5  # Saturday=5, Sunday=6
    today_str = now_local.strftime("%Y-%m-%d")  # Format: "2025-12-25"
    
    # Check for date-specific override first (holidays, special hours)
    overrides = await get_date_overrides()
    today_override = next((o for o in overrides if o.get("date") == today_str), None)
    
    if today_override:
        # This date has a special schedule
        if today_override.get("is_closed"):
            # Closed for the day (holiday)
            reason = today_override.get("reason", "Holiday")
            return {
                "is_live": False,
                "status_text": f"Closed - {reason}",
                "status_color": "red",
                "message": f"We're closed today ({reason}). We'll be back tomorrow!",
                "next_available": None,
                "hours_config": hours,
                "date_override": today_override
            }
        else:
            # Custom hours for this date
            start_hour = today_override.get("start_hour", hours["start"])
            end_hour = today_override.get("end_hour", hours["end"])
            is_live = start_hour <= current_hour < end_hour
            
            if is_live:
                return {
                    "is_live": True,
                    "status_text": "Live now",
                    "status_color": "green",
                    "message": "Your Concierge is ready to help",
                    "next_available": None,
                    "hours_config": hours,
                    "date_override": today_override,
                    "custom_hours": f"{start_hour}:00 - {end_hour}:00"
                }
            else:
                if current_hour < start_hour:
                    next_time = now_local.replace(hour=start_hour, minute=0, second=0)
                else:
                    next_time = (now_local + timedelta(days=1)).replace(hour=hours["start"], minute=0, second=0)
                
                return {
                    "is_live": False,
                    "status_text": f"Back at {start_hour}:00 {hours['timezone_name']}",
                    "status_color": "amber",
                    "message": hours.get("offline_message", "Leave a message and we'll respond when we're back"),
                    "next_available": next_time.strftime("%I:%M %p"),
                    "hours_config": hours,
                    "date_override": today_override
                }
    
    # If 24x7 mode, always online (unless there's a date override above)
    if hours.get("is_24x7"):
        return {
            "is_live": True,
            "status_text": "Live now",
            "status_color": "green",
            "message": "Your Concierge is ready to help 24/7",
            "next_available": None,
            "hours_config": hours
        }
    
    # Get applicable hours (weekend or regular)
    start_hour = hours["start"]
    end_hour = hours["end"]
    
    if is_weekend and hours.get("weekend_hours"):
        start_hour = hours["weekend_hours"].get("start", start_hour)
        end_hour = hours["weekend_hours"].get("end", end_hour)
    
    # Check if within operating hours
    # Uses hour-based check: 9 AM to 9 PM means online from 9:00 to 20:59
    is_live = start_hour <= current_hour < end_hour
    
    logger.debug(f"[STATUS] Local time: {now_local}, Hour: {current_hour}, Start: {start_hour}, End: {end_hour}, Is Live: {is_live}")
    
    if is_live:
        return {
            "is_live": True,
            "status_text": "Live now",
            "status_color": "green",
            "message": "Your Concierge is ready to help",
            "next_available": None,
            "hours_config": hours
        }
    else:
        # Calculate next available time
        if current_hour < start_hour:
            # Before opening today
            next_time = now_local.replace(hour=start_hour, minute=0, second=0)
        else:
            # After closing, next day
            next_time = (now_local + timedelta(days=1)).replace(hour=start_hour, minute=0, second=0)
        
        return {
            "is_live": False,
            "status_text": f"Back at {start_hour}:00 {hours['timezone_name']}",
            "status_color": "amber",
            "message": hours.get("offline_message", "Leave a message and we'll respond when we're back"),
            "next_available": next_time.strftime("%I:%M %p"),
            "hours_config": hours
        }


# Request model for updating concierge hours
class ConciergeHoursUpdate(BaseModel):
    """Request to update concierge operating hours"""
    start: int = Field(..., ge=0, le=23, description="Start hour (0-23)")
    end: int = Field(..., ge=0, le=23, description="End hour (0-23)")
    timezone_offset: float = Field(default=5.5, description="Timezone offset from UTC")
    timezone_name: str = Field(default="IST", description="Timezone display name")
    is_24x7: bool = Field(default=False, description="Enable 24/7 mode")
    weekend_hours: Optional[Dict[str, int]] = Field(default=None, description="Different hours for weekends")
    offline_message: str = Field(default="Leave a message and we'll respond when we're back")


@router.get("/admin/hours")
async def get_admin_concierge_hours():
    """
    Get current concierge operating hours configuration.
    Used by admin panel to display/edit settings.
    """
    hours = await get_concierge_hours()
    status = await get_concierge_status()
    overrides = await get_date_overrides()
    
    return {
        "hours": hours,
        "current_status": status,
        "date_overrides": overrides,
        "presets": [
            {"name": "Business Hours (9 AM - 6 PM)", "start": 9, "end": 18},
            {"name": "Extended Hours (9 AM - 9 PM)", "start": 9, "end": 21},
            {"name": "Morning Shift (6 AM - 2 PM)", "start": 6, "end": 14},
            {"name": "Evening Shift (2 PM - 10 PM)", "start": 14, "end": 22},
            {"name": "24/7 Always Online", "is_24x7": True}
        ]
    }


@router.put("/admin/hours")
async def update_concierge_hours(request: ConciergeHoursUpdate):
    """
    Update concierge operating hours.
    Admin-only endpoint to configure when concierge is online.
    """
    global _concierge_hours_cache, _cache_timestamp
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Prepare settings document
        settings_doc = {
            "setting_type": "concierge_hours",
            "start": request.start,
            "end": request.end,
            "timezone_offset": request.timezone_offset,
            "timezone_name": request.timezone_name,
            "is_24x7": request.is_24x7,
            "weekend_hours": request.weekend_hours,
            "offline_message": request.offline_message,
            "updated_at": now
        }
        
        # Upsert into admin_settings collection
        await db.admin_settings.update_one(
            {"setting_type": "concierge_hours"},
            {"$set": settings_doc},
            upsert=True
        )
        
        # Clear cache to force refresh
        _concierge_hours_cache = None
        _cache_timestamp = None
        
        # Get updated status
        new_status = await get_concierge_status()
        
        logger.info(f"Concierge hours updated: {request.start}:00 - {request.end}:00 {request.timezone_name}, 24x7={request.is_24x7}")
        
        return {
            "success": True,
            "message": "Concierge hours updated successfully",
            "hours": settings_doc,
            "current_status": new_status
        }
        
    except Exception as e:
        logger.error(f"Error updating concierge hours: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATE-SPECIFIC OVERRIDES (Holidays, Special Hours)
# ============================================================================

class DateOverrideCreate(BaseModel):
    """Request to create a date-specific schedule override"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    is_closed: bool = Field(default=False, description="If True, concierge is offline all day")
    start_hour: Optional[int] = Field(default=None, ge=0, le=23, description="Custom start hour (if not closed)")
    end_hour: Optional[int] = Field(default=None, ge=0, le=23, description="Custom end hour (if not closed)")
    reason: str = Field(default="", description="Reason for override (e.g., 'Christmas', 'Diwali')")


@router.get("/admin/date-overrides")
async def get_all_date_overrides():
    """
    Get all date-specific schedule overrides.
    Returns list of holidays and custom hour dates.
    """
    overrides = await get_date_overrides()
    
    # Also get current status to show if today is affected
    current_status = await get_concierge_status()
    
    return {
        "overrides": overrides,
        "current_status": current_status,
        "total_count": len(overrides)
    }


@router.post("/admin/date-overrides")
async def create_date_override(request: DateOverrideCreate):
    """
    Create a date-specific schedule override.
    Use this for holidays (closed) or custom hours for specific days.
    """
    global _date_overrides_cache, _date_overrides_timestamp
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Validate date format
    try:
        datetime.strptime(request.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check if override already exists for this date
    existing = await db.concierge_date_overrides.find_one({"date": request.date})
    if existing:
        raise HTTPException(status_code=400, detail=f"Override already exists for {request.date}. Delete it first or update.")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        override_doc = {
            "date": request.date,
            "is_closed": request.is_closed,
            "start_hour": request.start_hour if not request.is_closed else None,
            "end_hour": request.end_hour if not request.is_closed else None,
            "reason": request.reason,
            "created_at": now
        }
        
        await db.concierge_date_overrides.insert_one(override_doc)
        
        # Clear cache
        _date_overrides_cache = None
        _date_overrides_timestamp = None
        
        logger.info(f"Date override created: {request.date} - {'CLOSED' if request.is_closed else f'{request.start_hour}:00 - {request.end_hour}:00'} ({request.reason})")
        
        return {
            "success": True,
            "message": f"Schedule override created for {request.date}",
            "override": {
                "date": request.date,
                "is_closed": request.is_closed,
                "start_hour": request.start_hour,
                "end_hour": request.end_hour,
                "reason": request.reason
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating date override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/date-overrides/{date}")
async def delete_date_override(date: str):
    """
    Delete a date-specific schedule override.
    Date should be in YYYY-MM-DD format.
    """
    global _date_overrides_cache, _date_overrides_timestamp
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = await db.concierge_date_overrides.delete_one({"date": date})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"No override found for {date}")
        
        # Clear cache
        _date_overrides_cache = None
        _date_overrides_timestamp = None
        
        logger.info(f"Date override deleted: {date}")
        
        return {
            "success": True,
            "message": f"Schedule override for {date} deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting date override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/date-overrides/{date}")
async def update_date_override(date: str, request: DateOverrideCreate):
    """
    Update an existing date-specific schedule override.
    """
    global _date_overrides_cache, _date_overrides_timestamp
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        update_doc = {
            "date": request.date,  # Allow changing the date
            "is_closed": request.is_closed,
            "start_hour": request.start_hour if not request.is_closed else None,
            "end_hour": request.end_hour if not request.is_closed else None,
            "reason": request.reason,
            "updated_at": now
        }
        
        result = await db.concierge_date_overrides.update_one(
            {"date": date},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"No override found for {date}")
        
        # Clear cache
        _date_overrides_cache = None
        _date_overrides_timestamp = None
        
        return {
            "success": True,
            "message": "Schedule override updated",
            "override": update_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating date override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SUGGESTION CHIPS
# ============================================================================

SUGGESTION_CHIPS = [
    {
        "id": "grooming",
        "label": "Grooming",
        "icon": "scissors",
        "prefill": "I need grooming help for my pet"
    },
    {
        "id": "boarding",
        "label": "Boarding",
        "icon": "home",
        "prefill": "I'm looking for boarding options"
    },
    {
        "id": "travel",
        "label": "Travel",
        "icon": "plane",
        "prefill": "I need help planning travel with my pet"
    },
    {
        "id": "lost_pet",
        "label": "Lost Pet",
        "icon": "alert-triangle",
        "priority": "urgent",
        "prefill": "I need urgent help - my pet is lost"
    }
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/status")
async def get_status():
    """
    Get current concierge operating status.
    Returns whether concierge is live and next available time.
    """
    status = await get_concierge_status()
    return {
        "success": True,
        **status
    }


@router.get("/home")
async def get_concierge_home(
    user_id: str = Query(..., description="User ID"),
    pet_id: Optional[str] = Query(None, description="Filter by pet ID, or 'all' for all pets")
):
    """
    Get concierge home screen data.
    
    Returns:
    - status: Live/offline indicator
    - suggestion_chips: Quick start options
    - active_requests: Tickets awaiting user action
    - recent_threads: Last 5 conversation threads
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get concierge status
        status = await get_concierge_status()
        
        # Build query filters - support both user_id formats
        # user_id can be email (dipali@...) or UUID string
        # tickets collection uses member.id and member.email
        user_filter = {"$or": [
            {"user_id": user_id}, 
            {"user_email": user_id},
            {"member.id": user_id},
            {"member.email": user_id}
        ]}
        
        ticket_filter = {"$or": [
            {"member.id": user_id},
            {"member.email": user_id}
        ]}
        
        if pet_id and pet_id != "all":
            user_filter["pet_id"] = pet_id
            ticket_filter["pet.id"] = pet_id
        
        # Get active requests (tickets in any non-completed status)
        # Include: placed, pending, clarification_needed, options_ready, approval_pending, payment_pending, in_progress, scheduled
        active_statuses = ["placed", "pending", "clarification_needed", "options_ready", "approval_pending", "payment_pending", "in_progress", "scheduled", "working", "acknowledged", "exploring"]
        active_requests = []
        
        # Query the tickets collection (where tickets are actually stored)
        tickets_cursor = db.tickets.find({
            "$and": [
                ticket_filter,
                {"status": {"$in": active_statuses}}
            ]
        }).sort("updated_at", -1).limit(10)
        
        logger.info(f"[CONCIERGE] Query for user_id={user_id}: ticket_filter={ticket_filter}, statuses={active_statuses}")
        
        async for ticket in tickets_cursor:
            logger.info(f"[CONCIERGE] Found ticket: {ticket.get('ticket_id', ticket.get('id'))} - status={ticket.get('status')}")
            # Get pet name
            pet_name = "Your pet"
            if ticket.get("pet_id"):
                pet = await db.pets.find_one({"id": ticket["pet_id"]})
                if pet:
                    pet_name = pet.get("name", "Your pet")
            
            active_requests.append({
                "id": str(ticket.get("_id", ticket.get("id", ""))),
                "ticket_id": ticket.get("ticket_id", ticket.get("id", "")),
                "pet_id": ticket.get("pet_id"),
                "pet_name": pet_name,
                "title": ticket.get("title", ticket.get("service_type", "Request")),
                "status": ticket.get("status"),
                "status_display": get_status_display(ticket.get("status")),
                "action_required": get_action_text(ticket.get("status")),
                "updated_at": ticket.get("updated_at", ticket.get("created_at", "")),
                "has_unread_reply": ticket.get("has_unread_concierge_reply", False)
            })
        
        # Get recent threads
        recent_threads = []
        threads_cursor = db.concierge_threads.find(user_filter).sort("last_message_at", -1).limit(5)
        
        async for thread in threads_cursor:
            # Get pet name
            pet_name = "Your pet"
            if thread.get("pet_id"):
                pet = await db.pets.find_one({"id": thread["pet_id"]})
                if pet:
                    pet_name = pet.get("name", "Your pet")
            
            recent_threads.append({
                "id": thread.get("id", str(thread.get("_id", ""))),  # Prefer UUID id, fallback to ObjectId
                "pet_id": thread.get("pet_id"),
                "pet_name": pet_name,
                "title": thread.get("title", "Conversation"),
                "status": thread.get("status", "active"),
                "ticket_id": thread.get("ticket_id"),
                "last_message_preview": thread.get("last_message_preview", "")[:60] + ("..." if len(thread.get("last_message_preview", "")) > 60 else ""),
                "last_message_at": thread.get("last_message_at", ""),
                "unread_count": thread.get("unread_count", 0)
            })
        
        # Get user's pets for dropdown
        pets = []
        pets_cursor = db.pets.find({"user_id": user_id})
        async for pet in pets_cursor:
            pets.append({
                "id": pet.get("id"),
                "name": pet.get("name"),
                "photo_url": pet.get("photo_url"),
                "breed": pet.get("breed")
            })
        
        return {
            "success": True,
            "status": status,
            "suggestion_chips": SUGGESTION_CHIPS,
            "active_requests": active_requests,
            "recent_threads": recent_threads,
            "pets": pets,
            "selected_pet_id": pet_id if pet_id and pet_id != "all" else None
        }
        
    except Exception as e:
        logger.error(f"Error getting concierge home: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/thread")
async def create_thread(request: ThreadCreateRequest):
    """
    Create a new concierge thread from user intent.
    
    This is the single entry point for all concierge conversations.
    The thread may or may not be linked to a ticket depending on the intent.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Get pet info
        pet_name = "Your pet"
        if request.pet_id:
            pet = await db.pets.find_one({"id": request.pet_id})
            if pet:
                pet_name = pet.get("name", "Your pet")
        
        # Generate thread title from intent
        title = generate_thread_title(request.intent, request.suggestion_chip)
        
        # Create thread document
        thread_id = str(uuid.uuid4())
        thread_doc = {
            "id": thread_id,
            "pet_id": request.pet_id,
            "user_id": request.user_id,
            "pet_name": pet_name,
            "title": title,
            "status": "active",
            "ticket_id": None,  # Will be linked when ticket is created
            "source": request.source,
            "source_context": request.source_context,
            "suggestion_chip": request.suggestion_chip,
            "last_message_preview": request.intent[:100],
            "last_message_at": now,
            "message_count": 1,
            "unread_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        await db.concierge_threads.insert_one(thread_doc)
        
        # Create the first message (user's intent)
        first_message = {
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "sender": "user",
            "content": request.intent,
            "timestamp": now,
            "status_chip": None,
            "attachments": None
        }
        
        await db.concierge_messages.insert_one(first_message)
        
        # ========== UNIFIED SERVICE FLOW ==========
        # Create signal for Service Desk, Admin Notification, Channel Intake
        signal_ids = None
        if CENTRAL_FLOW_AVAILABLE:
            try:
                # Get user info for the signal
                user_info = await db.users.find_one({"_id": request.user_id}) or {}
                member_name = user_info.get("name", "Member")
                member_email = user_info.get("email", "")
                member_phone = user_info.get("phone", "")
                
                # Determine pillar based on suggestion chip or context
                pillar = "concierge"
                if request.suggestion_chip:
                    chip_to_pillar = {
                        "grooming": "care",
                        "boarding": "stay",
                        "travel": "travel",
                        "lost_pet": "emergency",
                        "vet": "care",
                        "training": "learn",
                        "food": "dine",
                        "adoption": "adopt"
                    }
                    pillar = chip_to_pillar.get(request.suggestion_chip, "concierge")
                
                urgency = "critical" if request.suggestion_chip == "lost_pet" else "normal"
                
                signal_ids = await create_signal(
                    pillar=pillar,
                    action_type="concierge_request",
                    title=f"Concierge Request: {title}",
                    description=request.intent,
                    source=request.source or "concierge_chat",
                    urgency=urgency,
                    customer_name=member_name,
                    customer_email=member_email,
                    customer_phone=member_phone,
                    pet_name=pet_name,
                    pet_id=request.pet_id,
                    linked_id=thread_id,
                    extra_data={
                        "thread_id": thread_id,
                        "user_id": request.user_id,
                        "suggestion_chip": request.suggestion_chip,
                        "source_context": request.source_context or {},
                        "first_message": request.intent[:200]
                    }
                )
                logger.info(f"[UNIFIED FLOW] Created signal for concierge thread {thread_id}: ticket={signal_ids.get('ticket_id')}")
                
                # Update thread with signal IDs
                await db.concierge_threads.update_one(
                    {"id": thread_id},
                    {"$set": {
                        "ticket_id": signal_ids.get("ticket_id"),
                        "notification_id": signal_ids.get("notification_id"),
                        "inbox_id": signal_ids.get("inbox_id"),
                        "unified_flow": True
                    }}
                )
            except Exception as signal_error:
                logger.error(f"[UNIFIED FLOW] Error creating signal: {signal_error}")
        
        # Check if this should auto-create a ticket (for urgent items like lost_pet) - LEGACY
        ticket_id = signal_ids.get("ticket_id") if signal_ids else None
        if request.suggestion_chip == "lost_pet" and not ticket_id:
            # Create urgent ticket immediately (fallback if unified flow failed)
            ticket_id = await create_urgent_ticket(request, pet_name, now)
            await db.concierge_threads.update_one(
                {"id": thread_id},
                {"$set": {"ticket_id": ticket_id, "status": "awaiting_concierge"}}
            )
        
        # Generate initial concierge response
        concierge_response = generate_initial_response(request, pet_name)
        
        response_message = {
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "sender": "concierge",
            "content": concierge_response["content"],
            "timestamp": now,
            "status_chip": concierge_response.get("status_chip"),
            "attachments": None
        }
        
        await db.concierge_messages.insert_one(response_message)
        
        # Update thread
        await db.concierge_threads.update_one(
            {"id": thread_id},
            {
                "$set": {
                    "last_message_preview": concierge_response["content"][:100],
                    "last_message_at": now,
                    "message_count": 2
                }
            }
        )
        
        # INSIGHTS FEATURE: Extract insights from the initial intent message
        if request.pet_id:
            extracted_insights = extract_pet_insights(request.intent)
            if extracted_insights:
                await store_conversation_insights(db, request.pet_id, extracted_insights, thread_id, now)
                logger.info(f"[INSIGHTS] Extracted {len(extracted_insights)} insights from thread creation for pet {request.pet_id}")
        
        return {
            "success": True,
            "thread": {
                "id": thread_id,
                "pet_id": request.pet_id,
                "pet_name": pet_name,
                "title": title,
                "status": "active" if not ticket_id else "awaiting_concierge",
                "ticket_id": ticket_id,
                "notification_id": signal_ids.get("notification_id") if signal_ids else None,
                "source": request.source,
                "created_at": now,
                "unified_flow": True if signal_ids else False
            },
            "messages": [
                {
                    "id": first_message["id"],
                    "sender": "user",
                    "content": request.intent,
                    "timestamp": now
                },
                {
                    "id": response_message["id"],
                    "sender": "concierge",
                    "content": concierge_response["content"],
                    "timestamp": now,
                    "status_chip": concierge_response.get("status_chip")
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thread/{thread_id}")
async def get_thread(
    thread_id: str,
    user_id: str = Query(..., description="User ID for authorization")
):
    """
    Get thread detail with all messages and context.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get thread
        thread = await db.concierge_threads.find_one({"id": thread_id, "user_id": user_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Get messages from concierge_messages
        messages = []
        messages_cursor = db.concierge_messages.find({"thread_id": thread_id}).sort("timestamp", 1)
        async for msg in messages_cursor:
            messages.append({
                "id": msg.get("id"),
                "sender": msg.get("sender"),
                "content": msg.get("content"),
                "timestamp": msg.get("timestamp"),
                "status_chip": msg.get("status_chip"),
                "attachments": msg.get("attachments"),
                "type": msg.get("type", "text"),
                "source": msg.get("source", "chat"),  # Track message origin (chat, service_desk, etc.)
                "options_payload": msg.get("options_payload"),
                "selected_option": msg.get("selected_option")
            })
        
        # Also fetch option card messages from linked ticket (if any)
        linked_ticket_id = thread.get("ticket_id")  # This will be used later in the response
        if linked_ticket_id:
            # Try to find ticket in tickets collection
            ticket = await db.tickets.find_one({"ticket_id": linked_ticket_id})
            if not ticket:
                ticket = await db.service_desk_tickets.find_one({"ticket_id": linked_ticket_id})
            
            if ticket and ticket.get("messages"):
                for tmsg in ticket.get("messages", []):
                    # Only add option_cards and option_response messages
                    if tmsg.get("type") in ["option_cards", "option_response"]:
                        # Avoid duplicates by checking if already present
                        if not any(m.get("id") == tmsg.get("id") for m in messages):
                            messages.append({
                                "id": tmsg.get("id"),
                                "sender": tmsg.get("sender", "concierge"),
                                "content": tmsg.get("content"),
                                "timestamp": tmsg.get("timestamp"),
                                "status_chip": tmsg.get("status_chip"),
                                "type": tmsg.get("type"),
                                "options_payload": tmsg.get("options_payload"),
                                "selected_option": tmsg.get("selected_option")
                            })
                
                # Re-sort messages by timestamp after merging
                messages.sort(key=lambda x: x.get("timestamp", ""))
        
        # Get pet context for drawer
        pet_context = None
        if thread.get("pet_id"):
            pet = await db.pets.find_one({"id": thread["pet_id"]})
            if pet:
                # Build context drawer data
                soul_answers = pet.get("doggy_soul_answers") or {}
                preferences = pet.get("preferences", {})
                
                # Calculate age stage
                age_stage = "Adult"
                if pet.get("age"):
                    age = pet["age"]
                    if age < 1:
                        age_stage = "Puppy"
                    elif age >= 7:
                        age_stage = "Senior"
                
                pet_context = {
                    "name": pet.get("name"),
                    "breed": pet.get("breed"),
                    "age_stage": age_stage,
                    "size": soul_answers.get("size", preferences.get("size")),
                    "sensitivities": [],
                    "photo_url": pet.get("photo_url")
                }
                
                # Add sensitivities
                if soul_answers.get("noise_sensitivity"):
                    pet_context["sensitivities"].append("Noise sensitive")
                if soul_answers.get("separation_anxiety"):
                    pet_context["sensitivities"].append("Separation anxiety")
                if preferences.get("allergies"):
                    pet_context["sensitivities"].append(f"Allergies: {preferences['allergies']}")
        
        # Get linked ticket if any
        ticket_context = None
        if thread.get("ticket_id"):
            ticket = await db.mira_tickets.find_one({"id": thread["ticket_id"]})
            if ticket:
                ticket_context = {
                    "id": ticket.get("id"),
                    "status": ticket.get("status"),
                    "status_display": get_status_display(ticket.get("status")),
                    "service_type": ticket.get("service_type"),
                    "created_at": ticket.get("created_at")
                }
        
        # Mark as read
        await db.concierge_threads.update_one(
            {"id": thread_id},
            {"$set": {"unread_count": 0}}
        )
        
        return {
            "success": True,
            "thread": {
                "id": thread.get("id"),
                "pet_id": thread.get("pet_id"),
                "pet_name": thread.get("pet_name"),
                "title": thread.get("title"),
                "status": thread.get("status"),
                "source": thread.get("source"),
                "source_context": thread.get("source_context"),
                "created_at": thread.get("created_at"),
                "ticket_id": linked_ticket_id  # Include linked ticket ID for option card responses
            },
            "messages": messages,
            "context_drawer": {
                "pet": pet_context,
                "source": thread.get("source"),
                "source_context": thread.get("source_context"),
                "ticket": ticket_context
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ticket/{ticket_id}/mark-read")
async def mark_ticket_read(
    ticket_id: str,
    user_id: str = Query(..., description="User ID for authorization")
):
    """
    Mark a ticket's concierge reply as read by the pet parent.
    Called when pet parent views the ticket detail.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Find ticket and verify ownership
        ticket = await db.mira_tickets.find_one({
            "$and": [
                {"$or": [{"id": ticket_id}, {"ticket_id": ticket_id}]},
                {"$or": [{"user_id": user_id}, {"parent_id": user_id}]}
            ]
        })
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Clear the unread flag
        await db.mira_tickets.update_one(
            {"_id": ticket["_id"]},
            {"$set": {"has_unread_concierge_reply": False}}
        )
        
        return {"success": True, "message": "Marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking ticket as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/threads")
async def get_user_threads(
    user_id: str = Query(..., description="User ID"),
    status: Optional[str] = Query(None, description="Filter by status: open, active, closed"),
    pet_id: Optional[str] = Query(None, description="Filter by pet ID"),
    limit: int = Query(10, description="Max threads to return")
):
    """
    Get all threads for a user.
    Used by ConciergeButton to find existing open threads.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Build query
        query = {"user_id": user_id}
        
        # Filter by status (open = active threads still being worked on)
        if status:
            if status == "open":
                query["status"] = {"$in": ["active", "pending", "awaiting_reply"]}
            else:
                query["status"] = status
        
        # Filter by pet
        if pet_id:
            query["pet_id"] = pet_id
        
        # Get threads
        threads = []
        cursor = db.concierge_threads.find(query).sort("last_message_at", -1).limit(limit)
        
        async for thread in cursor:
            # Get pet name
            pet_name = thread.get("pet_name", "Your pet")
            if not pet_name or pet_name == "Your pet":
                if thread.get("pet_id"):
                    pet = await db.pets.find_one({"id": thread["pet_id"]})
                    if pet:
                        pet_name = pet.get("name", "Your pet")
            
            threads.append({
                "id": thread.get("id", str(thread.get("_id", ""))),
                "pet_id": thread.get("pet_id"),
                "pet_name": pet_name,
                "title": thread.get("title", "Chat"),
                "status": thread.get("status", "active"),
                "ticket_id": thread.get("ticket_id"),
                "last_message_preview": thread.get("last_message_preview", ""),
                "last_message_at": thread.get("last_message_at"),
                "message_count": thread.get("message_count", 0),
                "unread_count": thread.get("unread_count", 0),
                "created_at": thread.get("created_at"),
                "source": thread.get("source", "concierge")
            })
        
        return {"threads": threads, "total": len(threads)}
        
    except Exception as e:
        logger.error(f"Error getting threads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/threads")
async def create_simple_thread(request: SimpleThreadCreateRequest):
    """
    Create a simple concierge thread from ConciergeButton.
    This is a simplified version for quick thread creation.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Get pet name if pet_id provided
        pet_name = request.pet_name or "Your pet"
        if not pet_name or pet_name == "Your pet":
            if request.pet_id:
                pet = await db.pets.find_one({"id": request.pet_id})
                if pet:
                    pet_name = pet.get("name", "Your pet")
        
        # Generate thread title
        title = request.title or f"Chat with {pet_name}"
        
        # Create thread
        thread_id = str(uuid.uuid4())
        thread_doc = {
            "id": thread_id,
            "pet_id": request.pet_id,
            "user_id": request.user_id,
            "pet_name": pet_name,
            "title": title,
            "status": "active",
            "ticket_id": None,
            "source": request.source,
            "last_message_preview": "",
            "last_message_at": now,
            "message_count": 0,
            "unread_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        await db.concierge_threads.insert_one(thread_doc)
        
        logger.info(f"Created simple thread {thread_id} for user {request.user_id}")
        
        return {
            "thread": {
                "id": thread_id,
                "pet_id": request.pet_id,
                "pet_name": pet_name,
                "title": title,
                "status": "active",
                "created_at": now
            },
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error creating simple thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message")
async def send_message(request: MessageSendRequest):
    """
    Send a message in a thread.
    This is used for user messages; concierge responses come from the admin side.
    
    INSIGHTS FEATURE: Automatically extracts pet information from messages
    and stores them as "learned_from_conversation" insights.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Verify thread exists and belongs to user
        thread = await db.concierge_threads.find_one({"id": request.thread_id, "user_id": request.user_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Create message
        message_doc = {
            "id": str(uuid.uuid4()),
            "thread_id": request.thread_id,
            "sender": "user",
            "content": request.content,
            "timestamp": now,
            "status_chip": None,
            "attachments": request.attachments
        }
        
        await db.concierge_messages.insert_one(message_doc)
        
        # Update thread
        await db.concierge_threads.update_one(
            {"id": request.thread_id},
            {
                "$set": {
                    "last_message_preview": request.content[:100],
                    "last_message_at": now,
                    "status": "awaiting_concierge",
                    "updated_at": now
                },
                "$inc": {"message_count": 1}
            }
        )
        
        # Create notification for concierge team
        await db.admin_notifications.insert_one({
            "id": str(uuid.uuid4()),
            "type": "concierge_message",
            "thread_id": request.thread_id,
            "user_id": request.user_id,
            "pet_id": thread.get("pet_id"),
            "content": request.content[:200],
            "created_at": now,
            "read": False
        })
        
        # INSIGHTS FEATURE: Extract and store pet information from message
        pet_id = thread.get("pet_id")
        if pet_id:
            extracted_insights = extract_pet_insights(request.content)
            if extracted_insights:
                await store_conversation_insights(db, pet_id, extracted_insights, request.thread_id, now)
                logger.info(f"[INSIGHTS] Extracted {len(extracted_insights)} insights from conversation for pet {pet_id}")
        
        return {
            "success": True,
            "message": {
                "id": message_doc["id"],
                "sender": "user",
                "content": request.content,
                "timestamp": now
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_status_display(status: str) -> Dict[str, str]:
    """Get display text and color for ticket status"""
    status_map = {
        "draft": {"text": "Draft", "color": "gray"},
        "placed": {"text": "Received", "color": "blue"},
        "clarification_needed": {"text": "Needs Clarification", "color": "amber"},
        "options_ready": {"text": "Options Ready", "color": "purple"},
        "approval_pending": {"text": "Awaiting Approval", "color": "amber"},
        "payment_pending": {"text": "Payment Pending", "color": "amber"},
        "in_progress": {"text": "In Progress", "color": "blue"},
        "scheduled": {"text": "Scheduled", "color": "green"},
        "shipped": {"text": "Shipped", "color": "blue"},
        "delivered": {"text": "Delivered", "color": "green"},
        "completed": {"text": "Completed", "color": "green"},
        "cancelled": {"text": "Cancelled", "color": "red"},
        "unable": {"text": "Unable to Complete", "color": "red"}
    }
    return status_map.get(status, {"text": status.replace("_", " ").title(), "color": "gray"})


def get_action_text(status: str) -> str:
    """Get action button text based on status"""
    action_map = {
        "clarification_needed": "Reply",
        "options_ready": "Choose",
        "approval_pending": "Approve",
        "payment_pending": "Pay"
    }
    return action_map.get(status, "View")


def generate_thread_title(intent: str, chip: Optional[str]) -> str:
    """Generate a thread title from intent or chip"""
    if chip:
        chip_titles = {
            "grooming": "Grooming Help",
            "boarding": "Boarding Request",
            "travel": "Travel Planning",
            "lost_pet": "URGENT: Lost Pet"
        }
        return chip_titles.get(chip, chip.replace("_", " ").title())
    
    # Generate from intent - first 5 words or first sentence
    words = intent.split()[:5]
    title = " ".join(words)
    if len(intent.split()) > 5:
        title += "..."
    return title


def generate_initial_response(request: ThreadCreateRequest, pet_name: str) -> Dict[str, Any]:
    """Generate initial concierge response based on intent"""
    
    # Check if urgent (lost pet)
    if request.suggestion_chip == "lost_pet":
        return {
            "content": f"I understand this is urgent. Let me help you find {pet_name} right away.\n\nFirst, please confirm:\n1. When did you last see {pet_name}?\n2. Where was {pet_name} last seen?\n3. Is {pet_name} wearing a collar with ID?\n\nI'm alerting our team now.",
            "status_chip": "Urgent"
        }
    
    # Check source context
    if request.source == "learn" and request.source_context:
        item_title = request.source_context.get("learn_item", {}).get("title", "the guide")
        return {
            "content": f"I see you were reading \"{item_title}\". How can I help you with this for {pet_name}?\n\nWould you like me to:\n• Book a related service\n• Get expert advice\n• Find product recommendations",
            "status_chip": None
        }
    
    if request.source == "today" and request.source_context:
        alert_type = request.source_context.get("alert_type", "")
        return {
            "content": f"I'm here to help with {pet_name}'s {alert_type.replace('_', ' ')}.\n\nWhat would you like to do? I can handle the details for you.",
            "status_chip": None
        }
    
    # Default response based on chip
    chip_responses = {
        "grooming": f"I'd be happy to help with grooming for {pet_name}! Let me know:\n\n• What type of grooming do you need? (Full groom, bath, nail trim, etc.)\n• When would you prefer? (Date/time)\n• Home visit or salon?\n\nI'll find the best options for you.",
        "boarding": f"Let's find the perfect boarding for {pet_name}! Please share:\n\n• When do you need boarding? (Check-in/out dates)\n• Any special requirements? (Medication, diet, etc.)\n• Preference: Home boarding or kennel?\n\nI'll curate options for you.",
        "travel": f"Exciting! Planning travel with {pet_name}. Let me help:\n\n• Where are you traveling to?\n• When? (Dates)\n• Mode of travel? (Car, train, flight)\n\nI'll coordinate everything - pet-friendly stays, transport, documents."
    }
    
    if request.suggestion_chip and request.suggestion_chip in chip_responses:
        return {
            "content": chip_responses[request.suggestion_chip],
            "status_chip": None
        }
    
    # Default fallback
    return {
        "content": f"Hi! I'm here to help with {pet_name}. Tell me more about what you need, and I'll take care of it.\n\nI can help with grooming, boarding, travel, shopping, vet visits, and much more. Just describe what you're looking for!",
        "status_chip": None
    }


async def create_urgent_ticket(request: ThreadCreateRequest, pet_name: str, timestamp: str) -> str:
    """Create an urgent ticket for lost pet or similar emergencies"""
    ticket_id = f"TKT-{str(uuid.uuid4())[:8].upper()}"
    
    ticket_doc = {
        "id": ticket_id,
        "user_id": request.user_id,
        "pet_id": request.pet_id,
        "pet_name": pet_name,
        "title": f"URGENT: {pet_name} - Lost Pet",
        "service_type": "lost_pet_assistance",
        "pillar": "care",
        "status": "placed",
        "priority": "urgent",
        "source": "concierge",
        "source_context": request.source_context,
        "notes": request.intent,
        "created_at": timestamp,
        "updated_at": timestamp,
        "timeline": [
            {
                "timestamp": timestamp,
                "action": "Ticket created",
                "status": "placed",
                "note": "URGENT: Lost pet reported via Concierge"
            }
        ]
    }
    
    await db.mira_tickets.insert_one(ticket_doc)
    
    # Create admin notification
    await db.admin_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "type": "urgent_ticket",
        "ticket_id": ticket_id,
        "user_id": request.user_id,
        "pet_id": request.pet_id,
        "title": f"URGENT: Lost Pet - {pet_name}",
        "content": request.intent[:200],
        "priority": "urgent",
        "created_at": timestamp,
        "read": False
    })
    
    return ticket_id



# ============================================================================
# INSIGHTS EXTRACTION - Learning from Conversations
# ============================================================================

import re

# Patterns to extract pet information from conversation text
INSIGHT_PATTERNS = {
    "fears": [
        r"(?:scared|afraid|terrified|frightened|fears?)\s+(?:of\s+)?(.+?)(?:\.|,|$|and|but)",
        r"(?:hates?|doesn't like|can't stand)\s+(.+?)(?:\.|,|$|and|but)",
    ],
    "loves": [
        r"(?:loves?|adores?|really likes?|favorite)\s+(.+?)(?:\.|,|$|and|but)",
        r"(?:favorite\s+(?:thing|toy|food|treat|activity))\s+(?:is\s+)?(.+?)(?:\.|,|$)",
    ],
    "anxiety": [
        r"(?:anxious|anxiety|nervous|worried)\s+(?:when|about|if)?\s*(.+?)(?:\.|,|$|and|but)",
        r"(?:separation anxiety|gets anxious)\s+(?:when|if)?\s*(.+?)(?:\.|,|$)",
    ],
    "behavior": [
        r"(?:always|usually|tends to)\s+(.+?)(?:\.|,|$|when|if)",
        r"(?:sleeps?|eats?|plays?)\s+(?:best|well|only)\s+(?:when|with|in)?\s*(.+?)(?:\.|,|$)",
    ],
    "preferences": [
        r"(?:prefers?|rather|likes? better)\s+(.+?)(?:\.|,|$|than|over)",
        r"(?:favorite\s+\w+)\s+(?:is\s+)?(.+?)(?:\.|,|$)",
    ],
    "health": [
        r"(?:allergic to|allergy to|can't eat)\s+(.+?)(?:\.|,|$|and|but)",
        r"(?:sensitive to|reacts to)\s+(.+?)(?:\.|,|$|and|but)",
    ],
}

def extract_pet_insights(text: str) -> List[Dict[str, Any]]:
    """
    Extract pet-related insights from conversation text.
    Returns a list of insight objects with category, content, and confidence.
    """
    if not text:
        return []
    
    insights = []
    text_lower = text.lower()
    
    for category, patterns in INSIGHT_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                # Clean up the match
                insight_text = match.strip()
                if len(insight_text) > 3 and len(insight_text) < 200:  # Filter out noise
                    insights.append({
                        "category": category,
                        "content": insight_text,
                        "original_text": text[:500],  # Keep context
                        "confidence": 0.7  # Rule-based extraction
                    })
    
    return insights


async def store_conversation_insights(db, pet_id: str, insights: List[Dict], thread_id: str, timestamp: str):
    """
    Store extracted insights in the pet's profile under 'conversation_insights'.
    These can be reviewed by the user or concierge before being promoted to the main profile.
    
    DEDUPLICATION: Skips insights that already exist (same category + normalized content)
    in pending_review state within last 7 days.
    
    CONFLICT DETECTION: Marks insights that conflict with existing health facts.
    """
    if not insights:
        return
    
    # Import conflict resolver
    try:
        from utils.fact_conflict_resolver import detect_conflict, extract_entity
        CONFLICT_RESOLVER_AVAILABLE = True
    except ImportError:
        CONFLICT_RESOLVER_AVAILABLE = False
        def detect_conflict(new_fact, existing_facts): return None
        def extract_entity(content): return content.lower().strip()[:30]
    
    # Get existing pet
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        return
    
    # Get existing data
    existing_insights = pet.get("conversation_insights", [])
    learned_facts = pet.get("learned_facts", [])
    
    # Build dedup lookup: (normalized_category, normalized_content) -> True
    # CONSERVATIVE DEDUPE: Exact match only (category + content)
    # We want Mira to capture the same fact if restated months later or phrased differently
    existing_pending = set()
    for ins in existing_insights:
        if ins.get("status") == "pending_review":
            norm_cat = (ins.get("category") or "").lower().strip()
            norm_content = (ins.get("content") or "").lower().strip()
            existing_pending.add((norm_cat, norm_content))
    
    # Also check learned_facts for dedup
    for fact in learned_facts:
        norm_cat = (fact.get("category") or "").lower().strip()
        norm_content = (fact.get("content") or "").lower().strip()
        existing_pending.add((norm_cat, norm_content))
    
    # Add new insights with deduplication and conflict detection
    added_count = 0
    skipped_count = 0
    conflict_count = 0
    
    for insight in insights:
        norm_cat = (insight.get("category") or "").lower().strip()
        norm_content = (insight.get("content") or "").lower().strip()
        
        # DEDUPLICATION CHECK
        if (norm_cat, norm_content) in existing_pending:
            skipped_count += 1
            logger.debug(f"[INSIGHTS] Skipped duplicate: [{norm_cat}] {norm_content}")
            continue
        
        # CONFLICT DETECTION
        conflict_info = None
        if CONFLICT_RESOLVER_AVAILABLE:
            conflict_info = detect_conflict(
                {"category": insight["category"], "content": insight["content"]},
                learned_facts
            )
        
        insight_doc = {
            "id": str(uuid.uuid4()),
            "category": insight["category"],
            "content": insight["content"],
            "source_thread_id": thread_id,
            "extracted_at": timestamp,
            "confidence": insight.get("confidence", 0.7),
            "status": "pending_review",
            "original_text": insight.get("original_text", "")[:200],
            "is_active": True,  # Default active
        }
        
        # Add conflict info if detected
        if conflict_info and conflict_info.get("detected"):
            insight_doc["has_conflict"] = True
            insight_doc["conflict_with"] = conflict_info.get("health_fact", {}).get("id")
            insight_doc["conflict_entity"] = conflict_info.get("entity")
            insight_doc["conflict_type"] = conflict_info.get("conflict_type")
            insight_doc["safety_note"] = conflict_info.get("safety_note")
            conflict_count += 1
            logger.info(f"[INSIGHTS] Conflict detected for '{norm_content}' with entity '{conflict_info.get('entity')}'")
        
        existing_insights.append(insight_doc)
        existing_pending.add((norm_cat, norm_content))  # Prevent duplicates within same batch
        added_count += 1
    
    # Update pet with new insights
    if added_count > 0:
        await db.pets.update_one(
            {"id": pet_id},
            {
                "$set": {
                    "conversation_insights": existing_insights,
                    "conversation_insights_updated_at": timestamp
                }
            }
        )
    
    logger.info(f"[INSIGHTS] Pet {pet_id}: Added {added_count}, Skipped {skipped_count} dupes, {conflict_count} conflicts")


@router.get("/insights/{pet_id}")
async def get_pet_conversation_insights(
    pet_id: str,
    status: Optional[str] = Query(None, description="Filter by status: pending_review, confirmed, rejected")
):
    """
    Get conversation insights for a pet.
    These are facts learned about the pet from conversations.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        insights = pet.get("conversation_insights", [])
        
        # Filter by status if provided
        if status:
            insights = [i for i in insights if i.get("status") == status]
        
        # Sort by most recent first
        insights.sort(key=lambda x: x.get("extracted_at", ""), reverse=True)
        
        # Group by category
        grouped = {}
        for insight in insights:
            cat = insight.get("category", "other")
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(insight)
        
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "insights": insights,
            "grouped_insights": grouped,
            "total_count": len(insights),
            "pending_count": len([i for i in insights if i.get("status") == "pending_review"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights/{pet_id}/review")
async def review_conversation_insight(
    pet_id: str,
    insight_id: str = Query(..., description="The insight ID to review"),
    action: str = Query(..., description="Action: confirm or reject")
):
    """
    Review a conversation insight - confirm to add to profile or reject to discard.
    Prevents duplicates by checking normalized category + content.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if action not in ["confirm", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'confirm' or 'reject'")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Find and update the insight
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        insights = pet.get("conversation_insights", [])
        insight_found = None
        
        for i, insight in enumerate(insights):
            if insight.get("id") == insight_id:
                insight_found = insight
                insights[i]["status"] = "confirmed" if action == "confirm" else "rejected"
                insights[i]["reviewed_at"] = now
                break
        
        if not insight_found:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        # Update the pet document with the reviewed insight
        await db.pets.update_one(
            {"id": pet_id},
            {"$set": {"conversation_insights": insights}}
        )
        
        # If confirmed, add to learned_facts (with duplicate and conflict check)
        if action == "confirm":
            learned_facts = pet.get("learned_facts", [])
            
            # Normalize content for comparison (lowercase, strip whitespace)
            def normalize(text):
                return (text or "").lower().strip()
            
            new_category = normalize(insight_found.get("category", ""))
            new_content = normalize(insight_found.get("content", ""))
            
            # Check if this insight already exists in learned_facts
            is_duplicate = any(
                normalize(fact.get("category", "")) == new_category and 
                normalize(fact.get("content", "")) == new_content
                for fact in learned_facts
            )
            
            if is_duplicate:
                logger.info(f"Duplicate insight detected for pet {pet_id}: {new_content}")
                return {
                    "success": True,
                    "insight_id": insight_id,
                    "action": action,
                    "message": "Insight already exists in profile (duplicate skipped)",
                    "duplicate": True
                }
            
            # CHECK FOR CONFLICTS before adding
            conflict_info = None
            has_conflict = insight_found.get("has_conflict", False)
            
            try:
                from utils.fact_conflict_resolver import detect_conflict, is_health_category, is_preference_category
                
                if not has_conflict:
                    # Re-check for conflicts
                    conflict_info = detect_conflict(
                        {"category": insight_found["category"], "content": insight_found["content"]},
                        learned_facts
                    )
                    has_conflict = conflict_info is not None and conflict_info.get("detected", False)
            except ImportError:
                pass
            
            # Build the new fact document
            new_fact = {
                "id": insight_id,
                "category": insight_found["category"],
                "content": insight_found["content"],
                "learned_from": "conversation",
                "confirmed_at": now,
                "is_active": True,  # Default active
            }
            
            # If conflict detected, add conflict metadata
            if has_conflict:
                conflict_entity = insight_found.get("conflict_entity") or (conflict_info.get("entity") if conflict_info else None)
                new_fact["has_conflict"] = True
                new_fact["conflict_entity"] = conflict_entity
                new_fact["conflict_status"] = "pending_resolution"
                
                # Apply safety default: if this is a preference and conflicts with health, suppress it
                try:
                    from utils.fact_conflict_resolver import is_preference_category
                    if is_preference_category(insight_found["category"]):
                        new_fact["is_active"] = False  # Suppress preference until resolved
                        new_fact["suppressed_reason"] = "health_restriction"
                except ImportError:
                    pass
            
            learned_facts.append(new_fact)
            await db.pets.update_one(
                {"id": pet_id},
                {"$set": {"learned_facts": learned_facts}}
            )
            
            # Return with conflict warning if applicable
            if has_conflict:
                conflict_entity = new_fact.get("conflict_entity", "this item")
                return {
                    "success": True,
                    "insight_id": insight_id,
                    "action": action,
                    "message": f"Insight added but has a conflict with existing health data for '{conflict_entity}'",
                    "has_conflict": True,
                    "conflict_entity": conflict_entity,
                    "safety_note": f"Until you resolve this, '{conflict_entity}' will be treated as restricted for safety."
                }
        
        return {
            "success": True,
            "insight_id": insight_id,
            "action": action,
            "message": f"Insight {'added to profile' if action == 'confirm' else 'rejected'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing insight: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conflicts/{pet_id}")
async def get_pet_conflicts(pet_id: str):
    """
    Get all unresolved conflicts for a pet.
    Returns conflicts where health/allergy facts conflict with preference facts.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        from utils.fact_conflict_resolver import get_active_conflicts, get_safe_tags
        
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        learned_facts = pet.get("learned_facts", [])
        conversation_insights = pet.get("conversation_insights", [])
        
        conflicts = get_active_conflicts(conversation_insights, learned_facts)
        safe_tags = get_safe_tags(learned_facts, conversation_insights)
        
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "conflicts": conflicts,
            "conflict_count": len(conflicts),
            "has_unresolved_conflicts": len(conflicts) > 0,
            "safe_tags": safe_tags
        }
        
    except ImportError:
        # Conflict resolver not available
        return {
            "success": True,
            "pet_id": pet_id,
            "conflicts": [],
            "conflict_count": 0,
            "has_unresolved_conflicts": False,
            "error": "Conflict resolver not available"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conflicts/{pet_id}/resolve")
async def resolve_pet_conflict(
    pet_id: str,
    entity: str = Query(..., description="The entity with conflict (e.g., 'chicken')"),
    resolution: str = Query(..., description="Resolution: health_wins, preference_wins, or not_sure")
):
    """
    Resolve a conflict between health and preference facts.
    
    resolution options:
    - health_wins: Health/allergy is true, preference is suppressed (RECOMMENDED)
    - preference_wins: User explicitly allows preference despite health warning
    - not_sure: Keep safety default (health wins) but mark as uncertain
    
    SAFETY RULE: Until resolved, health always wins.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if resolution not in ["health_wins", "preference_wins", "not_sure"]:
        raise HTTPException(
            status_code=400, 
            detail="Resolution must be 'health_wins', 'preference_wins', or 'not_sure'"
        )
    
    try:
        from utils.fact_conflict_resolver import resolve_conflict
        
        result = await resolve_conflict(
            db=db,
            pet_id=pet_id,
            entity=entity,
            resolution=resolution,
            resolved_by="user"
        )
        
        return result
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Conflict resolver not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving conflict: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/safe-tags/{pet_id}")
async def get_pet_safe_tags(pet_id: str):
    """
    Get tags that are safe to display for a pet.
    
    Rules:
    - Health/allergy tags always render
    - Preference tags are suppressed if they conflict with health restrictions
    - Returns both visible and suppressed tags with reasons
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        from utils.fact_conflict_resolver import get_safe_tags
        
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        learned_facts = pet.get("learned_facts", [])
        conversation_insights = pet.get("conversation_insights", [])
        
        result = get_safe_tags(learned_facts, conversation_insights)
        
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            **result
        }
        
    except ImportError:
        # Fallback: return all facts as tags (no conflict filtering)
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        learned_facts = pet.get("learned_facts", [])
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "visible_tags": [
                {"content": f.get("content"), "category": f.get("category"), "suppressed": False}
                for f in learned_facts
            ],
            "suppressed_tags": [],
            "has_conflicts": False,
            "warning": "Conflict resolver not available"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting safe tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN ENDPOINTS - For Service Desk to reply to Concierge threads
# ============================================================================

class AdminReplyRequest(BaseModel):
    """Admin reply to a concierge thread"""
    thread_id: str
    content: str
    status_chip: Optional[str] = None  # Optional status like "Options ready"


@router.get("/admin/threads")
async def get_admin_threads(
    limit: int = Query(50, description="Max threads to return"),
    status: Optional[str] = Query(None, description="Filter by status: active, awaiting_concierge, awaiting_user")
):
    """
    Get all concierge threads for admin view.
    Returns threads awaiting_concierge first for quick action.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        query = {}
        if status:
            query["status"] = status
        
        # Sort by awaiting_concierge first, then by last_message_at
        threads = []
        cursor = db.concierge_threads.find(query).sort([
            ("status", 1),  # awaiting_concierge comes first alphabetically before "active"
            ("last_message_at", -1)
        ]).limit(limit)
        
        async for thread in cursor:
            # Get pet info
            pet_name = thread.get("pet_name", "Unknown Pet")
            
            # Get user info
            user = await db.users.find_one({"id": thread.get("user_id")})
            user_name = "Unknown"
            user_email = ""
            user_phone = ""
            if user:
                user_name = user.get("name", user.get("first_name", "Unknown"))
                user_email = user.get("email", "")
                user_phone = user.get("phone", user.get("whatsapp", ""))
            
            threads.append({
                "id": thread.get("id"),
                "pet_id": thread.get("pet_id"),
                "pet_name": pet_name,
                "user_id": thread.get("user_id"),
                "user_name": user_name,
                "user_email": user_email,
                "user_phone": user_phone,
                "title": thread.get("title", "Conversation"),
                "status": thread.get("status", "active"),
                "last_message_preview": thread.get("last_message_preview", ""),
                "last_message_at": thread.get("last_message_at"),
                "message_count": thread.get("message_count", 0),
                "unread_count": thread.get("unread_count", 0),
                "created_at": thread.get("created_at")
            })
        
        # Get counts by status
        awaiting_count = await db.concierge_threads.count_documents({"status": "awaiting_concierge"})
        active_count = await db.concierge_threads.count_documents({"status": "active"})
        
        return {
            "success": True,
            "threads": threads,
            "counts": {
                "awaiting_concierge": awaiting_count,
                "active": active_count,
                "total": len(threads)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting admin threads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/thread/{thread_id}")
async def get_admin_thread_detail(thread_id: str):
    """
    Get thread detail for admin - includes all messages and context.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get thread
        thread = await db.concierge_threads.find_one({"id": thread_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Get all messages
        messages = []
        cursor = db.concierge_messages.find({"thread_id": thread_id}).sort("timestamp", 1)
        async for msg in cursor:
            messages.append({
                "id": msg.get("id"),
                "sender": msg.get("sender"),
                "content": msg.get("content"),
                "timestamp": msg.get("timestamp"),
                "status_chip": msg.get("status_chip"),
                "source": msg.get("source", "chat")
            })
        
        # Get pet info
        pet = None
        if thread.get("pet_id"):
            pet_doc = await db.pets.find_one({"id": thread.get("pet_id")})
            if pet_doc:
                pet = {
                    "id": pet_doc.get("id"),
                    "name": pet_doc.get("name"),
                    "breed": pet_doc.get("breed"),
                    "photo_url": pet_doc.get("photo_url"),
                    "allergies": pet_doc.get("preferences", {}).get("allergies", []),
                    "temperament": pet_doc.get("temperament")
                }
        
        # Get user info
        user = None
        if thread.get("user_id"):
            user_doc = await db.users.find_one({"id": thread.get("user_id")})
            if user_doc:
                user = {
                    "id": user_doc.get("id"),
                    "name": user_doc.get("name"),
                    "email": user_doc.get("email"),
                    "phone": user_doc.get("phone")
                }
        
        return {
            "success": True,
            "thread": {
                "id": thread.get("id"),
                "title": thread.get("title"),
                "status": thread.get("status"),
                "created_at": thread.get("created_at"),
                "last_message_at": thread.get("last_message_at")
            },
            "messages": messages,
            "pet": pet,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting admin thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/reply")
async def send_admin_reply(request: AdminReplyRequest):
    """
    Admin sends a reply to a concierge thread.
    This creates a message in concierge_messages and updates the thread status.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Verify thread exists
        thread = await db.concierge_threads.find_one({"id": request.thread_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Create the message
        message_doc = {
            "id": str(uuid.uuid4()),
            "thread_id": request.thread_id,
            "sender": "concierge",
            "content": request.content,
            "timestamp": now,
            "status_chip": request.status_chip,
            "attachments": None,
            "type": "reply",
            "source": "service_desk"  # Mark that this came from admin panel
        }
        
        await db.concierge_messages.insert_one(message_doc)
        
        # Update thread status and last message
        await db.concierge_threads.update_one(
            {"id": request.thread_id},
            {
                "$set": {
                    "last_message_preview": request.content[:100],
                    "last_message_at": now,
                    "status": "awaiting_user",  # Now waiting for user response
                    "updated_at": now
                },
                "$inc": {"message_count": 1, "unread_count": 1}
            }
        )
        
        logger.info(f"[ADMIN REPLY] Reply sent to thread {request.thread_id}")
        
        return {
            "success": True,
            "message": {
                "id": message_doc["id"],
                "sender": "concierge",
                "content": request.content,
                "timestamp": now,
                "status_chip": request.status_chip
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending admin reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))
