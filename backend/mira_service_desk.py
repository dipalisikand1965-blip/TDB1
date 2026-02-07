"""
Mira Service Desk - Canonical Conversational Flow
==================================================
Implements the exact API contract for the Mira OS conversational flows:
- Treats, Grooming, Birthday, Travel pillars
- Every conversation creates/attaches to a ticket
- Real-time transcript logging
- Concierge handoff (same ticket, status flip)

API Endpoints:
- POST /api/mira/route_intent - Intent classification
- POST /api/service_desk/attach_or_create_ticket - Create or attach to ticket
- POST /api/service_desk/append_message - Log message to ticket
- POST /api/service_desk/handoff_to_concierge - Flip ticket to concierge queue
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import os
import jwt
import logging
import re
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Routers
mira_router = APIRouter(prefix="/api/mira", tags=["mira-service-desk"])
service_desk_router = APIRouter(prefix="/api/service_desk", tags=["service-desk"])

security_bearer = HTTPBearer(auto_error=False)

# Get MongoDB connection
_db = None

def set_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"


# ============================================
# MODELS
# ============================================

class PetContext(BaseModel):
    name: str
    breed: Optional[str] = None
    age_years: Optional[int] = None
    allergies: Optional[List[str]] = []
    notes: Optional[List[str]] = []
    
    class Config:
        # Allow extra fields to be ignored
        extra = 'ignore'
        
    # Handle age_years being passed as string
    @validator('age_years', pre=True, always=True)
    def parse_age(cls, v):
        if v is None:
            return None
        if isinstance(v, int):
            return v
        if isinstance(v, str):
            # Extract digits from strings like "3 years"
            digits = ''.join(filter(str.isdigit, v))
            return int(digits) if digits else None
        return None

class RouteIntentRequest(BaseModel):
    parent_id: str
    pet_id: str
    utterance: str
    source_event: str = "search"
    device: str = "web"
    pet_context: Optional[PetContext] = None

class RouteIntentResponse(BaseModel):
    pillar: str
    intent_primary: str
    intent_secondary: List[str] = []
    life_state: str
    channel: str = "Mira_OS"

class InitialMessage(BaseModel):
    sender: str
    source: str
    text: str

class AttachOrCreateTicketRequest(BaseModel):
    parent_id: str
    pet_id: str
    pillar: str
    intent_primary: str
    intent_secondary: List[str] = []
    life_state: str
    channel: str = "Mira_OS"
    initial_message: InitialMessage

class AttachOrCreateTicketResponse(BaseModel):
    ticket_id: str
    status: str
    is_new: bool = True

class AppendMessageRequest(BaseModel):
    ticket_id: str
    sender: str  # "parent", "mira", "concierge", "system"
    source: str = "Mira_OS"
    text: str
    meta: Optional[Dict[str, Any]] = None
    # New: Step tracking for anti-loop
    step_id: Optional[str] = None  # e.g., "BIRTHDAY_SHAPE", "BIRTHDAY_TREATS_TYPE"
    step_status: Optional[str] = None  # "open" (waiting for answer) or "completed"
    is_clarifying_question: Optional[bool] = False  # True if this message expects user answer

class HandoffToConciergeRequest(BaseModel):
    ticket_id: str
    concierge_queue: str  # "FOOD", "GROOMING", "CELEBRATE", "TRAVEL", etc.
    latest_mira_summary: str

# New: Step completion tracking
class CompleteStepRequest(BaseModel):
    ticket_id: str
    step_id: str
    user_answer: str  # The answer user provided

class ConversationStep(BaseModel):
    """Tracks a single step in the conversation flow"""
    step_id: str
    pillar: str
    question_asked: str
    status: str = "open"  # "open" or "completed"
    user_answer: Optional[str] = None
    timestamp_asked: Optional[str] = None
    timestamp_answered: Optional[str] = None


# ============================================
# INTENT CLASSIFICATION
# ============================================

# Intent patterns for classification
INTENT_PATTERNS = {
    # Food intents
    "FOOD_TREATS": [
        r"\btreats?\b", r"\bsnacks?\b", r"\brewards?\b", r"\bbiscuits?\b",
        r"\btraining\s+treats?\b", r"\blight\s+treats?\b"
    ],
    "FOOD_MAIN": [
        r"\bfood\b", r"\bdiet\b", r"\bkibble\b", r"\bmeal\b", r"\bnutrition\b",
        r"\bwhat\s+should\s+\w+\s+eat\b", r"\bfeeding\b"
    ],
    "FOOD_PORTION": [
        r"\bhow\s+much\b", r"\bportion\b", r"\bamount\b", r"\bcups?\s+per\b"
    ],
    
    # Grooming intents
    "GROOM_PLAN": [
        r"\bhaircut\b", r"\btrim\b", r"\bgrooming\b", r"\bgroom\b", r"\bbath\b",
        r"\bneeds?\s+a\s+(haircut|trim|groom|bath)\b"
    ],
    "GROOM_TOOLS": [
        r"\bshampoo\b", r"\bbrush\b", r"\bwhat\s+tools?\b", r"\bat\s+home\b",
        r"\bhome\s+groom\b"
    ],
    "GROOM_BOOKING": [
        r"\bbook\s+a?\s*groomer\b", r"\bschedule\s+groom\b", r"\bgrooming\s+appointment\b"
    ],
    
    # Celebrate intents
    "CELEBRATE_BIRTHDAY": [
        r"\bbirthday\b", r"\bcelebrate\b", r"\bcelebration\b", r"\bparty\b",
        r"\bplan\s+\w+['\s]s?\s*birthday\b"
    ],
    
    # Travel intents
    "TRAVEL_PLAN": [
        r"\btrip\b", r"\btravel\b", r"\bvacation\b", r"\bholiday\b",
        r"\bplanning\s+a\s+trip\b", r"\bgoing\s+on\s+a\s+trip\b"
    ],
    "TRAVEL_STAY": [
        r"\bpet-friendly\s+stays?\b", r"\bhotel\b", r"\bhomestay\b", r"\bwhere\s+to\s+stay\b"
    ],
    "TRAVEL_PACKING": [
        r"\bwhat\s+should\s+I\s+pack\b", r"\bpacking\s+list\b", r"\bwhat\s+to\s+carry\b"
    ],
    "TRAVEL_BOARDING": [
        r"\bboarding\b", r"\bleave\s+\w+\s+(at|with)\b", r"\bsitter\b", r"\bdaycare\b"
    ],
    
    # Health intents
    "HEALTH_CONCERN": [
        r"\bworried\b", r"\bcoughing\b", r"\bsick\b", r"\bvomit\b", r"\bdiarrhea\b",
        r"\bnot\s+eating\b", r"\blimping\b"
    ],
    
    # General
    "GENERAL_HELP": [
        r"\bhelp\b", r"\badvice\b", r"\bsuggestion\b"
    ]
}

# Pillar mapping
INTENT_TO_PILLAR = {
    "FOOD_TREATS": "Food",
    "FOOD_MAIN": "Food",
    "FOOD_PORTION": "Food",
    "GROOM_PLAN": "Grooming",
    "GROOM_TOOLS": "Grooming",
    "GROOM_BOOKING": "Grooming",
    "CELEBRATE_BIRTHDAY": "Celebrate",
    "TRAVEL_PLAN": "Travel",
    "TRAVEL_STAY": "Travel",
    "TRAVEL_PACKING": "Travel",
    "TRAVEL_BOARDING": "Travel",
    "HEALTH_CONCERN": "Health",
    "GENERAL_HELP": "General"
}

# Life state mapping
INTENT_TO_LIFE_STATE = {
    "FOOD_TREATS": "EXPLORE",
    "FOOD_MAIN": "PLAN",
    "FOOD_PORTION": "PLAN",
    "GROOM_PLAN": "PLAN",
    "GROOM_TOOLS": "EXPLORE",
    "GROOM_BOOKING": "PLAN",
    "CELEBRATE_BIRTHDAY": "CELEBRATE",
    "TRAVEL_PLAN": "PLAN",
    "TRAVEL_STAY": "PLAN",
    "TRAVEL_PACKING": "PLAN",
    "TRAVEL_BOARDING": "PLAN",
    "HEALTH_CONCERN": "CONCERN",
    "GENERAL_HELP": "EXPLORE"
}


def classify_intent(utterance: str) -> tuple:
    """
    Classify user utterance into pillar and intent.
    Returns (pillar, primary_intent, secondary_intents, life_state)
    """
    utterance_lower = utterance.lower()
    
    matched_intents = []
    
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, utterance_lower):
                matched_intents.append(intent)
                break
    
    if not matched_intents:
        return ("General", "GENERAL_HELP", [], "EXPLORE")
    
    # Primary intent is the first (most specific) match
    primary_intent = matched_intents[0]
    secondary_intents = matched_intents[1:] if len(matched_intents) > 1 else []
    
    pillar = INTENT_TO_PILLAR.get(primary_intent, "General")
    life_state = INTENT_TO_LIFE_STATE.get(primary_intent, "EXPLORE")
    
    return (pillar, primary_intent, secondary_intents, life_state)


# ============================================
# ROUTE INTENT ENDPOINT
# ============================================

@mira_router.post("/route_intent", response_model=RouteIntentResponse)
async def route_intent(request: RouteIntentRequest):
    """
    Intent Router - Classifies user utterance into pillar and intent.
    This is the first call when a parent sends a message.
    
    Returns:
    - pillar: Food, Grooming, Celebrate, Travel, Health, General
    - intent_primary: FOOD_TREATS, GROOM_PLAN, CELEBRATE_BIRTHDAY, etc.
    - life_state: EXPLORE, PLAN, CELEBRATE, CONCERN
    """
    pillar, intent_primary, intent_secondary, life_state = classify_intent(request.utterance)
    
    # Log pillar request for analytics
    db = get_db()
    if db is not None:
        try:
            pillar_request = {
                "parent_id": request.parent_id,
                "pet_id": request.pet_id,
                "utterance": request.utterance,
                "pillar": pillar,
                "intent_primary": intent_primary,
                "intent_secondary": intent_secondary,
                "life_state": life_state,
                "source_event": request.source_event,
                "device": request.device,
                "channel": "Mira_OS",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pillar_requests.insert_one(pillar_request)
        except Exception as e:
            logger.warning(f"Failed to log pillar request: {e}")
    
    return RouteIntentResponse(
        pillar=pillar,
        intent_primary=intent_primary,
        intent_secondary=intent_secondary,
        life_state=life_state,
        channel="Mira_OS"
    )


# ============================================
# TICKET MANAGEMENT
# ============================================

async def generate_ticket_id() -> str:
    """Generate a unique ticket ID like TCK-2026-000321"""
    db = get_db()
    now = datetime.now(timezone.utc)
    year = now.strftime("%Y")
    
    # Count today's tickets
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    count = 0
    if db is not None:
        count = await db.mira_conversations.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
    
    return f"TCK-{year}-{str(count + 1).zfill(6)}"


async def find_existing_ticket(
    parent_id: str, 
    pet_id: str, 
    pillar: str,
    window_hours: int = 72
) -> Optional[Dict]:
    """
    Find an existing open ticket for the same (parent, pet, pillar) within the time window.
    This implements the "attach to existing ticket" logic.
    """
    db = get_db()
    if db is None:
        return None
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    
    # Find open tickets within the window
    ticket = await db.mira_conversations.find_one({
        "parent_id": parent_id,
        "pet_id": pet_id,
        "pillar": pillar,
        "status": {"$in": ["open_mira_only", "open_concierge"]},
        "created_at": {"$gte": cutoff.isoformat()}
    }, sort=[("created_at", -1)])
    
    return ticket


@service_desk_router.post("/attach_or_create_ticket", response_model=AttachOrCreateTicketResponse)
async def attach_or_create_ticket(request: AttachOrCreateTicketRequest):
    """
    Create a new ticket or attach to an existing one.
    
    Logic:
    - Check for existing open ticket for same (parent, pet, pillar) within 72 hours
    - If found, attach to it (add message to conversation)
    - If not found, create a new ticket
    
    Returns ticket_id and status.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Check for existing ticket
    existing_ticket = await find_existing_ticket(
        request.parent_id,
        request.pet_id,
        request.pillar
    )
    
    if existing_ticket:
        # Attach to existing ticket
        ticket_id = existing_ticket.get("ticket_id")
        
        # Add the initial message to the conversation
        await db.mira_conversations.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {
                    "conversation": {
                        "sender": request.initial_message.sender,
                        "source": request.initial_message.source,
                        "text": request.initial_message.text,
                        "timestamp": now.isoformat()
                    }
                },
                "$set": {
                    "updated_at": now.isoformat(),
                    "intent_primary": request.intent_primary,
                    "life_state": request.life_state
                }
            }
        )
        
        logger.info(f"[SERVICE_DESK] Attached to existing ticket: {ticket_id}")
        
        return AttachOrCreateTicketResponse(
            ticket_id=ticket_id,
            status=existing_ticket.get("status", "open_mira_only"),
            is_new=False
        )
    
    # Create new ticket
    ticket_id = await generate_ticket_id()
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "parent_id": request.parent_id,
        "pet_id": request.pet_id,
        "pillar": request.pillar,
        "intent_primary": request.intent_primary,
        "intent_secondary": request.intent_secondary,
        "life_state": request.life_state,
        "channel": request.channel,
        "status": "open_mira_only",
        "handoff_to_concierge": False,
        "concierge_queue": None,
        # New: Step tracking for anti-loop
        "completed_steps": [],  # List of step_ids that have been answered
        "current_step": None,  # Currently open step_id waiting for answer
        "step_history": [],  # Full history of steps with questions and answers
        "conversation": [
            {
                "sender": request.initial_message.sender,
                "source": request.initial_message.source,
                "text": request.initial_message.text,
                "timestamp": now.isoformat()
            }
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.mira_conversations.insert_one(ticket_doc)
    
    logger.info(f"[SERVICE_DESK] Created new ticket: {ticket_id} for pillar: {request.pillar}")
    
    return AttachOrCreateTicketResponse(
        ticket_id=ticket_id,
        status="open_mira_only",
        is_new=True
    )


@service_desk_router.post("/append_message")
async def append_message(request: AppendMessageRequest):
    """
    Append a message to the ticket's conversation array.
    
    This is called for:
    - Every parent message
    - Every Mira response
    - Every Concierge response
    - System messages (handoffs, etc.)
    
    The meta field can contain:
    - label: EXPLORE, PLAN, etc.
    - chips_offered: List of quick reply chips shown
    - product_suggestions: List of products shown
    - step_id: Unique identifier for this step (for anti-loop)
    - is_clarifying_question: True if waiting for user answer
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    message_entry = {
        "sender": request.sender,
        "source": request.source,
        "text": request.text,
        "timestamp": now.isoformat()
    }
    
    if request.meta:
        message_entry["meta"] = request.meta
    
    # Add step tracking info if provided
    if request.step_id:
        message_entry["step_id"] = request.step_id
    if request.is_clarifying_question:
        message_entry["is_clarifying_question"] = request.is_clarifying_question
    
    update_ops = {
        "$push": {"conversation": message_entry},
        "$set": {"updated_at": now.isoformat()}
    }
    
    # If this is a Mira message with a clarifying question, set it as current_step
    if request.sender == "mira" and request.step_id and request.is_clarifying_question:
        update_ops["$set"]["current_step"] = {
            "step_id": request.step_id,
            "question": request.text,
            "timestamp": now.isoformat()
        }
        logger.info(f"[STEP] Set current step: {request.step_id}")
    
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        update_ops
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    logger.info(f"[SERVICE_DESK] Appended {request.sender} message to ticket: {request.ticket_id}")
    
    return {"success": True, "ticket_id": request.ticket_id}
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    message_entry = {
        "sender": request.sender,
        "source": request.source,
        "text": request.text,
        "timestamp": now.isoformat()
    }
    
    if request.meta:
        message_entry["meta"] = request.meta
    
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$push": {"conversation": message_entry},
            "$set": {"updated_at": now.isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    logger.info(f"[SERVICE_DESK] Appended {request.sender} message to ticket: {request.ticket_id}")
    
    return {"success": True, "ticket_id": request.ticket_id}


@service_desk_router.post("/handoff_to_concierge")
async def handoff_to_concierge(request: HandoffToConciergeRequest):
    """
    Handoff the ticket to a human Concierge.
    
    This does NOT create a new ticket. It:
    1. Flips status from 'open_mira_only' to 'open_concierge'
    2. Sets handoff_to_concierge = true
    3. Assigns to the appropriate queue (FOOD, GROOMING, CELEBRATE, TRAVEL)
    4. Adds a system message with the handoff summary
    5. Emits a notification event
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Update the ticket
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$set": {
                "status": "open_concierge",
                "handoff_to_concierge": True,
                "concierge_queue": request.concierge_queue,
                "handoff_time": now.isoformat(),
                "latest_mira_summary": request.latest_mira_summary,
                "updated_at": now.isoformat()
            },
            "$push": {
                "conversation": {
                    "sender": "system",
                    "source": "Mira_OS",
                    "text": f"Handoff to pet Concierge® – queue {request.concierge_queue}.",
                    "timestamp": now.isoformat(),
                    "meta": {
                        "type": "handoff",
                        "queue": request.concierge_queue,
                        "summary": request.latest_mira_summary
                    }
                }
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    # Emit notification event (for real-time updates to admin)
    try:
        from push_notification_routes import notify_ticket_update
        await notify_ticket_update(
            ticket_id=request.ticket_id,
            event_type="handoff_to_concierge",
            queue=request.concierge_queue
        )
    except Exception as e:
        logger.warning(f"Failed to send handoff notification: {e}")
    
    logger.info(f"[SERVICE_DESK] Handoff to Concierge: {request.ticket_id} -> queue {request.concierge_queue}")
    
    return {
        "success": True,
        "ticket_id": request.ticket_id,
        "status": "open_concierge",
        "concierge_queue": request.concierge_queue
    }


# ============================================
# TICKET RETRIEVAL
# ============================================

@service_desk_router.get("/ticket/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get a ticket by ID with full conversation history."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    ticket = await db.mira_conversations.find_one(
        {"ticket_id": ticket_id},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    return ticket


@service_desk_router.get("/tickets/by_parent/{parent_id}")
async def get_tickets_by_parent(parent_id: str, limit: int = 20):
    """Get all tickets for a parent, most recent first."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    cursor = db.mira_conversations.find(
        {"parent_id": parent_id},
        {"_id": 0}
    ).sort("updated_at", -1).limit(limit)
    
    tickets = await cursor.to_list(length=limit)
    
    return {"tickets": tickets, "total": len(tickets)}


@service_desk_router.get("/tickets/queue/{queue_name}")
async def get_tickets_by_queue(queue_name: str, status: str = "open_concierge", limit: int = 50):
    """Get tickets in a specific concierge queue."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    query = {"concierge_queue": queue_name.upper()}
    if status:
        query["status"] = status
    
    cursor = db.mira_conversations.find(
        query,
        {"_id": 0}
    ).sort("handoff_time", -1).limit(limit)
    
    tickets = await cursor.to_list(length=limit)
    
    return {"tickets": tickets, "queue": queue_name, "total": len(tickets)}


# ============================================
# CONCIERGE RESPONSE
# ============================================

@service_desk_router.post("/concierge_reply")
async def concierge_reply(
    ticket_id: str,
    concierge_name: str,
    message: str
):
    """
    Concierge sends a reply in the same thread.
    This appears in the parent's Mira OS chat as a message from Concierge.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    result = await db.mira_conversations.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {
                "conversation": {
                    "sender": "concierge",
                    "source": "Service_Desk",
                    "text": message,
                    "timestamp": now.isoformat(),
                    "meta": {
                        "concierge_name": concierge_name
                    }
                }
            },
            "$set": {"updated_at": now.isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    logger.info(f"[SERVICE_DESK] Concierge {concierge_name} replied to ticket: {ticket_id}")
    
    return {"success": True, "ticket_id": ticket_id}


# ============================================
# TICKET STATUS UPDATES
# ============================================

@service_desk_router.post("/resolve_ticket/{ticket_id}")
async def resolve_ticket(ticket_id: str, resolution_note: Optional[str] = None):
    """Mark a ticket as resolved."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    update_doc = {
        "$set": {
            "status": "resolved",
            "resolved_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        "$push": {
            "conversation": {
                "sender": "system",
                "source": "Service_Desk",
                "text": f"Ticket resolved. {resolution_note or ''}".strip(),
                "timestamp": now.isoformat()
            }
        }
    }
    
    result = await db.mira_conversations.update_one(
        {"ticket_id": ticket_id},
        update_doc
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    return {"success": True, "ticket_id": ticket_id, "status": "resolved"}
