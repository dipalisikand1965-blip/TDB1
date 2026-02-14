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

# Operating hours (IST)
CONCIERGE_HOURS = {
    "start": 9,   # 9:00 AM IST
    "end": 21,    # 9:00 PM IST
    "timezone_offset": 5.5  # IST is UTC+5:30
}

def get_concierge_status() -> Dict[str, Any]:
    """
    Get current concierge status based on operating hours.
    Returns live status, next available time, and message.
    """
    now_utc = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=CONCIERGE_HOURS["timezone_offset"])
    now_ist = now_utc + ist_offset
    
    current_hour = now_ist.hour
    current_day = now_ist.weekday()  # 0=Monday, 6=Sunday
    
    # Check if within operating hours (9 AM - 9 PM IST, all days)
    is_live = CONCIERGE_HOURS["start"] <= current_hour < CONCIERGE_HOURS["end"]
    
    if is_live:
        return {
            "is_live": True,
            "status_text": "Live now",
            "status_color": "green",
            "message": "Your Concierge is ready to help",
            "next_available": None
        }
    else:
        # Calculate next available time
        if current_hour < CONCIERGE_HOURS["start"]:
            # Before opening today
            next_time = now_ist.replace(hour=CONCIERGE_HOURS["start"], minute=0, second=0)
        else:
            # After closing, next day
            next_time = (now_ist + timedelta(days=1)).replace(hour=CONCIERGE_HOURS["start"], minute=0, second=0)
        
        return {
            "is_live": False,
            "status_text": f"Back at {CONCIERGE_HOURS['start']}:00",
            "status_color": "amber",
            "message": "Leave a message and we'll respond when we're back",
            "next_available": next_time.strftime("%I:%M %p")
        }


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
    return {
        "success": True,
        **get_concierge_status()
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
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get concierge status
        status = get_concierge_status()
        
        # Build query filters
        user_filter = {"user_id": user_id}
        if pet_id and pet_id != "all":
            user_filter["pet_id"] = pet_id
        
        # Get active requests (tickets awaiting user action)
        awaiting_statuses = ["clarification_needed", "options_ready", "approval_pending", "payment_pending"]
        active_requests = []
        
        tickets_cursor = db.mira_tickets.find({
            **user_filter,
            "status": {"$in": awaiting_statuses}
        }).sort("updated_at", -1).limit(10)
        
        async for ticket in tickets_cursor:
            # Get pet name
            pet_name = "Your pet"
            if ticket.get("pet_id"):
                pet = await db.pets.find_one({"id": ticket["pet_id"]})
                if pet:
                    pet_name = pet.get("name", "Your pet")
            
            active_requests.append({
                "id": str(ticket.get("_id", ticket.get("id", ""))),
                "ticket_id": ticket.get("id", ""),
                "pet_id": ticket.get("pet_id"),
                "pet_name": pet_name,
                "title": ticket.get("title", ticket.get("service_type", "Request")),
                "status": ticket.get("status"),
                "status_display": get_status_display(ticket.get("status")),
                "action_required": get_action_text(ticket.get("status")),
                "updated_at": ticket.get("updated_at", ticket.get("created_at", ""))
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
                "id": str(thread.get("_id", "")),
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
    if not db:
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
        
        # Check if this should auto-create a ticket (for urgent items like lost_pet)
        ticket_id = None
        if request.suggestion_chip == "lost_pet":
            # Create urgent ticket immediately
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
        
        return {
            "success": True,
            "thread": {
                "id": thread_id,
                "pet_id": request.pet_id,
                "pet_name": pet_name,
                "title": title,
                "status": "active" if not ticket_id else "awaiting_concierge",
                "ticket_id": ticket_id,
                "source": request.source,
                "created_at": now
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
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get thread
        thread = await db.concierge_threads.find_one({"id": thread_id, "user_id": user_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Get messages
        messages = []
        messages_cursor = db.concierge_messages.find({"thread_id": thread_id}).sort("timestamp", 1)
        async for msg in messages_cursor:
            messages.append({
                "id": msg.get("id"),
                "sender": msg.get("sender"),
                "content": msg.get("content"),
                "timestamp": msg.get("timestamp"),
                "status_chip": msg.get("status_chip"),
                "attachments": msg.get("attachments")
            })
        
        # Get pet context for drawer
        pet_context = None
        if thread.get("pet_id"):
            pet = await db.pets.find_one({"id": thread["pet_id"]})
            if pet:
                # Build context drawer data
                soul_answers = pet.get("doggy_soul_answers", {})
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
                "created_at": thread.get("created_at")
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


@router.post("/message")
async def send_message(request: MessageSendRequest):
    """
    Send a message in a thread.
    This is used for user messages; concierge responses come from the admin side.
    """
    if not db:
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
