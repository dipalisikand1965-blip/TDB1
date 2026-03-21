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
    source: str = "pillar_page"
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
    pillar: Optional[str] = None  # User-selected pillar from edit form
    request_title: Optional[str] = None  # User-edited title

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
        r"\bneeds?\s+a\s+(haircut|trim|groom|bath)\b", r"\bgroomer\b", r"\bsalon\b", r"\bspa\b"
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


def generate_mira_briefing(pet: dict, service_name: str, pillar: str) -> str:
    """Generates a Concierge briefing from pet soul profile — prepended to every ticket."""
    if not pet:
        return ""
    soul = pet.get("doggy_soul_answers", {})
    name = pet.get("name", "this dog")
    breed = pet.get("breed", "Mixed breed")
    soul_score = pet.get("overall_score") or pet.get("soul_score") or 0
    age_map = {"puppy":"Puppy (<1yr)","young":"Young (1-3yr)","adult":"Adult (3-7yr)","senior":"Senior (7+yr)"}
    age_label = age_map.get(soul.get("age_stage",""), soul.get("age_stage","Unknown age"))
    allergies = soul.get("food_allergies",[])
    allergy_clean = [a for a in (allergies if isinstance(allergies,list) else [allergies]) if a not in ["none","none known","","None"]]
    allergy_line = f"⚠️ ALLERGIES: {', '.join(a.title() for a in allergy_clean)} — never suggest these" if allergy_clean else "No known food allergies"
    conditions = soul.get("health_conditions",[])
    cond_clean = [c.replace("_"," ").title() for c in (conditions if isinstance(conditions,list) else [conditions]) if c not in ["none","healthy","all_healthy","","None"]]
    health_line = ", ".join(cond_clean) if cond_clean else "No known health conditions"
    energy = soul.get("energy_level","") or soul.get("energy","")
    city = pet.get("city","") or soul.get("location","")
    briefing = f"""
━━━ ✦ MIRA'S BRIEFING FOR CONCIERGE ━━━
🐾 Pet: {name} | Breed: {breed} | {age_label} | Soul Score: {soul_score}%
📍 Location: {city or 'Not set'}
🍽️ Allergies: {allergy_line}
💊 Health: {health_line}
⚡ Energy: {energy.replace('_',' ').title() if energy else 'Not set'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request: {service_name} | Pillar: {pillar.title()}
Mira says: Concierge, please respond to {name}'s parent with full context above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""
    return briefing.strip()


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


def get_parent_id_from_request(request_parent_id: str, db) -> str:
    """Always returns a non-empty parent_id"""
    if request_parent_id and request_parent_id != "guest":
        return request_parent_id
    return "anonymous"


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
    
    # ── Generate smart subject line ─────────────────────────────────
    service_name = (request.intent_secondary or [request.intent_primary or request.pillar.title()])[0]
    service_name = service_name.replace("_"," ").replace("-"," ").title()
    pet_name = ""
    pet_doc = None
    if request.pet_id:
        pet_doc = await db.pets.find_one({"id": request.pet_id}, {"name":1,"breed":1,"doggy_soul_answers":1,"overall_score":1,"soul_score":1,"city":1})
        if pet_doc:
            pet_name = pet_doc.get("name","")
    subject = f"{service_name} for {pet_name}" if pet_name else f"{service_name} — {request.pillar.title()} Request"

    # ── Generate Mira briefing from soul profile ─────────────────────
    mira_briefing = ""
    if request.pet_id and pet_doc:
        mira_briefing = generate_mira_briefing(pet_doc, service_name, request.pillar)

    # ── Build conversation with briefing prepended ───────────────────
    conversation = []
    if mira_briefing:
        conversation.append({
            "sender": "mira",
            "source": "soul_profile_briefing",
            "text": mira_briefing,
            "timestamp": now.isoformat(),
            "is_briefing": True,
        })
    conversation.append({
        "sender": request.initial_message.sender,
        "source": getattr(request.initial_message, "source", request.channel),
        "text": request.initial_message.text,
        "timestamp": now.isoformat()
    })

    ticket_doc = {
        "ticket_id": ticket_id,
        "subject": subject,
        "parent_id": request.parent_id,
        "pet_id": request.pet_id,
        "pet_name": pet_name,
        "pillar": request.pillar,
        "intent_primary": request.intent_primary,
        "intent_secondary": request.intent_secondary,
        "life_state": request.life_state,
        "channel": request.channel,
        "status": "open_mira_only",
        "handoff_to_concierge": False,
        "concierge_queue": None,
        "completed_steps": [],
        "current_step": None,
        "step_history": [],
        "mira_briefing": mira_briefing,
        "conversation": conversation,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.mira_conversations.insert_one(ticket_doc)

    # ── ALSO write to service_desk_tickets (admin inbox collection) ──────
    admin_ticket = {
        "id":            ticket_id,
        "ticket_id":     ticket_id,
        "type":          request.intent_primary or "service_booking",
        "intent_primary": request.intent_primary or "service_booking",  # alias for my-requests tab filtering
        "category":      request.pillar,
        "sub_category":  service_name.lower().replace(" ","_"),
        "subject":       subject,
        "description":   f"{mira_briefing}\n\n{request.initial_message.text}" if mira_briefing else request.initial_message.text,
        "status":        "urgent" if request.urgency in ("emergency", "urgent") else "open",
        "priority":      request.urgency or "normal",
        "urgency":       request.urgency or "low",
        "channel":       request.channel,
        "pillar":        request.pillar,
        "pet_id":        request.pet_id,
        "pet_name":      pet_name,
        "parent_id":     request.parent_id,
        "user_email":    request.parent_id if "@" in (request.parent_id or "") else None,
        "mira_briefing": mira_briefing,
        "life_state":    request.life_state,
        "created_at":    now.isoformat(),
        "updated_at":    now.isoformat(),
        "assigned_to":   None,
        "activity_log":  [{"action": "created", "timestamp": now.isoformat(), "details": f"Ticket created via {request.channel}"}],
        "conversation":  ticket_doc.get("conversation", []),
    }
    await db.service_desk_tickets.insert_one(admin_ticket)

    # ── Admin notification ─────────────────────────────────────────
    await db.admin_notifications.insert_one({
        "type": "new_ticket", "ticket_id": ticket_id,
        "subject": subject, "pillar": request.pillar,
        "pet_name": pet_name, "parent_id": request.parent_id,
        "read": False, "created_at": now.isoformat(),
    })

    # ── Member notification ────────────────────────────────────────
    await db.member_notifications.insert_one({
        "type": "ticket_created", "ticket_id": ticket_id,
        "parent_id": request.parent_id, "subject": subject,
        "message": f"Your request for {service_name} has been received. Concierge® will be in touch shortly.",
        "pillar": request.pillar, "read": False, "created_at": now.isoformat(),
    })

    logger.info(f"[SERVICE_DESK] Created enriched ticket: {ticket_id} — '{subject}' | briefing={'yes' if mira_briefing else 'no'}")
    
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
    
    # Try mira_conversations first
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        update_ops
    )
    
    # Also try mira_tickets (canonical spine - uses messages[] instead of conversation[])
    mira_tickets_ops = {
        "$push": {"messages": {
            "sender": message_entry["sender"],
            "source": message_entry["source"],
            "content": message_entry["text"],
            "timestamp": message_entry["timestamp"]
        }},
        "$set": {"updated_at": now.isoformat()}
    }
    mira_tickets_result = await db.mira_tickets.update_one(
        {"ticket_id": request.ticket_id},
        mira_tickets_ops
    )
    
    if result.matched_count == 0 and mira_tickets_result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    logger.info(f"[SERVICE_DESK] Appended {request.sender} message to ticket: {request.ticket_id}")
    
    return {"success": True, "ticket_id": request.ticket_id}


@service_desk_router.post("/complete_step")
async def complete_step(request: CompleteStepRequest):
    """
    Mark a step as completed when user answers a clarifying question.
    
    This is the KEY to preventing the loop:
    - Once a step is completed, it should NEVER be asked again
    - The backend must check completed_steps before re-asking any question
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Get the ticket to check current state
    ticket = await db.mira_conversations.find_one({"ticket_id": request.ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    # Check if this step is already completed
    completed_steps = ticket.get("completed_steps", [])
    if request.step_id in completed_steps:
        logger.warning(f"[STEP] Step {request.step_id} already completed for ticket {request.ticket_id}")
        return {
            "success": True,
            "already_completed": True,
            "ticket_id": request.ticket_id,
            "step_id": request.step_id
        }
    
    # Get the current step info (may be None)
    current_step = ticket.get("current_step") or {}
    
    # Build step history entry
    step_entry = {
        "step_id": request.step_id,
        "question": current_step.get("question", "") if current_step else "",
        "answer": request.user_answer,
        "timestamp_asked": current_step.get("timestamp", now.isoformat()) if current_step else now.isoformat(),
        "timestamp_answered": now.isoformat()
    }
    
    # Update ticket: add to completed_steps, clear current_step, add to history
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$addToSet": {"completed_steps": request.step_id},
            "$push": {"step_history": step_entry},
            "$set": {
                "current_step": None,
                "updated_at": now.isoformat()
            }
        }
    )
    
    logger.info(f"[STEP] Completed step {request.step_id} for ticket {request.ticket_id} with answer: {request.user_answer}")
    
    return {
        "success": True,
        "already_completed": False,
        "ticket_id": request.ticket_id,
        "step_id": request.step_id
    }


@service_desk_router.get("/check_step/{ticket_id}/{step_id}")
async def check_step_status(ticket_id: str, step_id: str):
    """
    Check if a specific step has already been completed for this ticket.
    
    This should be called by the frontend/LLM BEFORE asking a clarifying question
    to prevent the loop.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    ticket = await db.mira_conversations.find_one(
        {"ticket_id": ticket_id},
        {"completed_steps": 1, "step_history": 1, "current_step": 1}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    completed_steps = ticket.get("completed_steps", [])
    is_completed = step_id in completed_steps
    
    # Get the answer if completed
    answer = None
    if is_completed:
        for step in ticket.get("step_history", []):
            if step.get("step_id") == step_id:
                answer = step.get("answer")
                break
    
    return {
        "ticket_id": ticket_id,
        "step_id": step_id,
        "is_completed": is_completed,
        "answer": answer,
        "current_step": ticket.get("current_step")
    }


@service_desk_router.get("/completed_steps/{ticket_id}")
async def get_completed_steps(ticket_id: str):
    """
    Get all completed steps for a ticket.
    
    Useful for the frontend/LLM to know what has already been asked and answered.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    ticket = await db.mira_conversations.find_one(
        {"ticket_id": ticket_id},
        {"completed_steps": 1, "step_history": 1, "current_step": 1, "_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    return {
        "ticket_id": ticket_id,
        "completed_steps": ticket.get("completed_steps", []),
        "step_history": ticket.get("step_history", []),
        "current_step": ticket.get("current_step")
    }


@service_desk_router.post("/handoff_to_concierge")
async def handoff_to_concierge(request: HandoffToConciergeRequest):
    """
    Handoff the ticket to a human Concierge.
    
    This does NOT create a new ticket. It:
    1. Checks there's no pending clarifying question (if so, warns)
    2. Flips status from 'open_mira_only' to 'open_concierge'
    3. Sets handoff_to_concierge = true
    4. Assigns to the appropriate queue (FOOD, GROOMING, CELEBRATE, TRAVEL)
    5. Adds system message + Mira's closing line
    6. Emits a notification event
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Check if there's a pending step that hasn't been answered
    ticket = await db.mira_conversations.find_one({"ticket_id": request.ticket_id})
    if ticket and ticket.get("current_step"):
        logger.warning(f"[HANDOFF] Warning: Handoff requested but there's an unanswered step: {ticket.get('current_step')}")
    
    # The proper closing line Mira should say
    mira_closing_line = "I've shared everything we've discussed with your pet Concierge®. They'll take it forward from here and get back to you in this chat."
    
    # Build update with pillar if provided
    update_set = {
        "status": "open_concierge",
        "handoff_to_concierge": True,
        "concierge_queue": request.concierge_queue,
        "handoff_time": now.isoformat(),
        "latest_mira_summary": request.latest_mira_summary,
        "current_step": None,  # Clear any pending step on handoff
        "updated_at": now.isoformat()
    }
    
    # If user edited the pillar, update it
    if request.pillar:
        update_set["pillar"] = request.pillar
        logger.info(f"[HANDOFF] User updated pillar to: {request.pillar}")
    
    # If user edited the title, update it
    if request.request_title:
        update_set["request_title"] = request.request_title
        logger.info(f"[HANDOFF] User updated title to: {request.request_title}")
    
    # Update the ticket in mira_conversations
    result = await db.mira_conversations.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$set": update_set,
            "$push": {
                "conversation": {
                    "$each": [
                        {
                            "sender": "system",
                            "source": "Mira_OS",
                            "text": f"Handoff to pet Concierge® – queue {request.concierge_queue}.",
                            "timestamp": now.isoformat(),
                            "meta": {
                                "type": "handoff",
                                "queue": request.concierge_queue,
                                "pillar": request.pillar,
                                "summary": request.latest_mira_summary
                            }
                        },
                        {
                            "sender": "mira",
                            "source": "Mira_OS",
                            "text": mira_closing_line,
                            "timestamp": now.isoformat(),
                            "meta": {
                                "type": "handoff_closure",
                                "is_clarifying_question": False  # Important: no question here
                            }
                        }
                    ]
                }
            }
        }
    )
    
    # Also update mira_tickets (canonical spine collection) - uses messages[] not conversation[]
    mira_tickets_result = await db.mira_tickets.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$set": update_set,
            "$push": {
                "messages": {
                    "$each": [
                        {
                            "sender": "system",
                            "source": "Mira_OS",
                            "content": f"Handoff to pet Concierge® – queue {request.concierge_queue}.",
                            "timestamp": now.isoformat(),
                            "meta": {
                                "type": "handoff",
                                "queue": request.concierge_queue,
                                "pillar": request.pillar,
                                "summary": request.latest_mira_summary
                            }
                        },
                        {
                            "sender": "mira",
                            "source": "Mira_OS",
                            "content": mira_closing_line,
                            "timestamp": now.isoformat(),
                            "meta": {
                                "type": "handoff_closure",
                                "is_clarifying_question": False
                            }
                        }
                    ]
                }
            }
        }
    )
    
    if result.matched_count == 0 and mira_tickets_result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {request.ticket_id} not found")
    
    # ============================================
    # UNIFORM SERVICE FLOW: Create Admin Notification
    # Concierge is the hands, Mira is the soul
    # Every handoff MUST notify admin dashboard
    # ============================================
    try:
        import uuid
        notification_id = f"notif-{uuid.uuid4().hex[:12]}"
        
        # Get ticket details for notification
        ticket_data = await db.mira_conversations.find_one({"ticket_id": request.ticket_id})
        if not ticket_data:
            # Also check mira_tickets
            ticket_data = await db.mira_tickets.find_one({"ticket_id": request.ticket_id})
        
        pet_name = ticket_data.get("pet_name", "Pet") if ticket_data else "Pet"
        user_email = ticket_data.get("user_email", ticket_data.get("parent_email", "")) if ticket_data else ""
        pillar = request.pillar or ticket_data.get("pillar", "general") if ticket_data else "general"
        
        admin_notification = {
            "id": notification_id,
            "type": "handoff_to_concierge",
            "category": pillar,
            "title": f"🎫 New Request: {request.request_title or 'Service Request'}",
            "message": f"Mira handed off a {pillar.title()} request for {pet_name}. Queue: {request.concierge_queue}",
            "preview": request.latest_mira_summary[:200] if request.latest_mira_summary else "",
            "ticket_id": request.ticket_id,
            "queue": request.concierge_queue,
            "pillar": pillar,
            "pet_name": pet_name,
            "customer_email": user_email,
            "link": f"/admin?tab=servicedesk&ticket={request.ticket_id}",
            "priority": "high" if request.concierge_queue == "EMERGENCY" else "normal",
            "created_at": now.isoformat(),
            "read": False,  # Required for admin notifications query
            "read_at": None,
            "status": "unread"
        }
        
        await db.admin_notifications.insert_one(admin_notification)
        logger.info(f"[SERVICE_DESK] ✅ Admin notification created: {notification_id} for ticket {request.ticket_id}")
        
    except Exception as e:
        logger.error(f"[SERVICE_DESK] Failed to create admin notification: {e}")
    
    # Emit push notification event (for real-time updates)
    try:
        from push_notification_routes import notify_ticket_update
        await notify_ticket_update(
            ticket_id=request.ticket_id,
            user_email=user_email if 'user_email' in dir() else "",
            update_type="new_ticket",
            details={"queue": request.concierge_queue, "pillar": pillar}
        )
    except Exception as e:
        logger.warning(f"Failed to send push notification: {e}")
    
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
async def get_tickets_by_parent(parent_id: str, limit: int = 100):
    """Get all tickets for a parent from service_desk_tickets, most recent first.
    Matches on both id and email variants of parent_id."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    query = {"$or": [
        {"parent_id": parent_id},
        {"parent_email": parent_id},
        {"user_id": parent_id},
    ]}

    cursor = db.service_desk_tickets.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit)

    tickets = await cursor.to_list(length=limit)

    # ── Deduplicate by ticket_id — keep richest document ──────────────────────
    # Multiple docs with same ticket_id can exist (legacy vs new format)
    # Pick the one with the most complete data (has thread, has unread flag, etc.)
    seen_ids: dict = {}
    for t in tickets:
        tid = t.get("ticket_id") or t.get("id")
        if not tid:
            continue
        existing = seen_ids.get(tid)
        if existing is None:
            seen_ids[tid] = t
        else:
            # Keep the one with more data (thread, replies, mira_briefing)
            t_score = len(t.get("thread", []) or []) + (1 if t.get("has_unread_concierge_reply") else 0) + (1 if t.get("mira_briefing") else 0)
            e_score = len(existing.get("thread", []) or []) + (1 if existing.get("has_unread_concierge_reply") else 0) + (1 if existing.get("mira_briefing") else 0)
            if t_score > e_score:
                # Merge: take richest but preserve parent_id from the user-linked one
                merged = {**t, **{k: v for k, v in existing.items() if v and not t.get(k)}}
                merged["parent_id"] = existing.get("parent_id") or t.get("parent_id")
                seen_ids[tid] = merged

    tickets = list(seen_ids.values())

    # Sanitize ObjectId fields + normalize intent_primary (stored as "type" in older tickets)
    clean = []
    for t in tickets:
        t.pop("_id", None)
        if not t.get("intent_primary") and t.get("type"):
            t["intent_primary"] = t["type"]
        clean.append(t)

    return {"tickets": clean, "total": len(clean)}


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
    Also sets has_unread_concierge_reply flag for Services badge.
    Creates member_notification for Bell icon notification.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    concierge_message = {
        "id": str(uuid.uuid4()),
        "sender": "concierge",
        "source": "Service_Desk",
        "content": message,
        "text": message,
        "timestamp": now.isoformat(),
        "meta": {
            "concierge_name": concierge_name
        }
    }
    
    # ── Write to ALL 4 collections for full compatibility ─────────────────────
    # mira_conversations (legacy)
    await db.mira_conversations.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"conversation": concierge_message},
            "$set": {"updated_at": now.isoformat()}
        }
    )
    # mira_tickets
    ticket_result = await db.mira_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": concierge_message},
            "$set": {"updated_at": now.isoformat(), "has_unread_concierge_reply": True, "last_concierge_reply_at": now.isoformat()}
        }
    )
    # tickets (legacy)
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": concierge_message},
            "$set": {"updated_at": now.isoformat(), "has_unread_concierge_reply": True}
        }
    )
    # ── CANONICAL: service_desk_tickets ── update ALL docs with this ticket_id
    result = await db.service_desk_tickets.update_many(
        {"$or": [{"ticket_id": ticket_id}, {"id": ticket_id}]},
        {
            "$push": {"thread": concierge_message},
            "$set": {
                "updated_at": now.isoformat(),
                "has_unread_concierge_reply": True,
                "last_concierge_reply_at": now.isoformat(),
                "status": "in_progress",
            }
        }
    )

    if result.matched_count == 0 and ticket_result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    # ═══════════════════════════════════════════════════════════════════
    # CREATE MEMBER NOTIFICATION (for Bell icon)
    # Rule: No ticket_id = no notification. Every notification has ticket_id.
    # ═══════════════════════════════════════════════════════════════════
    try:
        # Get ticket details for notification context
        ticket = await db.mira_tickets.find_one({"ticket_id": ticket_id})
        if ticket:
            member_email = ticket.get("member", {}).get("email") or ticket.get("user_email")
            pet_id = ticket.get("pet_id")
            pet_name = ticket.get("pet_name") or ticket.get("pet_context", {}).get("name")
            
            if member_email:
                # Truncate message for preview
                preview = message[:100] + "..." if len(message) > 100 else message
                
                notification = {
                    "id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_email": member_email.lower(),
                    "ticket_id": ticket_id,  # REQUIRED - Two-way guarantee
                    "pet_id": pet_id,         # REQUIRED for per-pet filtering
                    "pet_name": pet_name,
                    "type": "concierge_reply",
                    "title": f"Concierge replied • {ticket_id}",
                    "message": preview,
                    "body": preview,
                    "read": False,
                    "created_at": now.isoformat(),
                    "data": {
                        "ticket_id": ticket_id,
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "concierge_name": concierge_name,
                        "thread_url": f"/mira-demo?tab=services&ticket={ticket_id}"
                    }
                }
                
                await db.member_notifications.insert_one(notification)
                logger.info(f"[SERVICE_DESK] Created member notification for {member_email}: {ticket_id}")
                
                # ═══════════════════════════════════════════════════════════════════
                # SEND PUSH NOTIFICATION (Browser alert when concierge replies)
                # ═══════════════════════════════════════════════════════════════════
                try:
                    from push_notification_routes import send_push_notification
                    push_result = await send_push_notification(
                        user_id=member_email,
                        title=f"Concierge replied",
                        body=preview,
                        tag=f"concierge-reply-{ticket_id}",
                        data={
                            "type": "concierge_reply",
                            "ticket_id": ticket_id,
                            "url": f"/tickets/{ticket_id}"
                        },
                        db=db
                    )
                    if push_result.get("sent"):
                        logger.info(f"[SERVICE_DESK] Push notification sent to {member_email}")
                except Exception as push_err:
                    # Don't fail the reply if push notification fails
                    logger.warning(f"[SERVICE_DESK] Push notification failed: {push_err}")
    except Exception as e:
        # Don't fail the reply if notification creation fails
        logger.error(f"[SERVICE_DESK] Failed to create member notification: {e}")
    
    logger.info(f"[SERVICE_DESK] Concierge {concierge_name} replied to ticket: {ticket_id}")
    
    # ═══════════════════════════════════════════════════════════════════
    # SEND WHATSAPP & EMAIL NOTIFICATIONS
    # Notify member via all available channels for omnichannel experience
    # ═══════════════════════════════════════════════════════════════════
    try:
        if ticket:
            member_email = ticket.get("member", {}).get("email") or ticket.get("user_email")
            member_phone = ticket.get("member", {}).get("phone") or ticket.get("member", {}).get("whatsapp") or ticket.get("user_phone")
            member_name = ticket.get("member", {}).get("name") or ticket.get("user_name") or "Valued Customer"
            
            # Send WhatsApp notification
            if member_phone:
                try:
                    from whatsapp_notifications import WhatsAppNotifications
                    wa_result = await WhatsAppNotifications.ticket_update(
                        phone=member_phone,
                        user_name=member_name,
                        ticket_id=ticket_id,
                        status="updated",
                        message_preview=message[:100] if len(message) > 100 else message
                    )
                    if wa_result.get("success"):
                        logger.info(f"[SERVICE_DESK] WhatsApp notification sent to {member_phone[:6]}*** for ticket {ticket_id}")
                except Exception as wa_err:
                    logger.warning(f"[SERVICE_DESK] WhatsApp notification failed: {wa_err}")
            
            # Send Email notification
            if member_email:
                try:
                    import resend
                    import os
                    resend.api_key = os.environ.get("RESEND_API_KEY")
                    sender_email = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.com")
                    
                    if resend.api_key:
                        email_result = resend.Emails.send({
                            "from": f"THEDOGGYCOMPANY <{sender_email}>",
                            "to": member_email,
                            "reply_to": f"ticket+{ticket_id}@replies.thedoggycompany.com",
                            "subject": f"Re: Ticket {ticket_id} - Concierge Update",
                            "html": f"""
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                                        <h2 style="color: white; margin: 0;">The Doggy Company</h2>
                                        <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Concierge Update</p>
                                    </div>
                                    <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                                        <p>Hi {member_name},</p>
                                        <p><strong>{concierge_name}</strong> from our Concierge team has responded to your request:</p>
                                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
                                            {message.replace(chr(10), '<br>')}
                                        </div>
                                        <p style="color: #6b7280; font-size: 12px;">
                                            Reply to this email or message us on WhatsApp to continue the conversation.
                                        </p>
                                    </div>
                                    <div style="background: #1f2937; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                            The Doggy Company Concierge® | woof@thedoggycompany.com
                                        </p>
                                    </div>
                                </div>


                            """,
                            "headers": {
                                "X-Ticket-ID": ticket_id,
                                "References": f"<{ticket_id}@thedoggycompany.com>",
                                "In-Reply-To": f"<{ticket_id}@thedoggycompany.com>"
                            }
                        })
                        logger.info(f"[SERVICE_DESK] Email notification sent to {member_email} for ticket {ticket_id}")
                except Exception as email_err:
                    logger.warning(f"[SERVICE_DESK] Email notification failed: {email_err}")
    except Exception as notify_err:
        logger.warning(f"[SERVICE_DESK] Multi-channel notification error: {notify_err}")
    
    return {
        "success": True, 
        "ticket_id": ticket_id,
        "has_unread_concierge_reply": True
    }


@service_desk_router.post("/mark_reply_read")
async def mark_reply_read(ticket_id: str):
    """Member taps on a ticket — clear the unread concierge reply badge."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB not available")
    await db.service_desk_tickets.update_many(
        {"$or": [{"ticket_id": ticket_id}, {"id": ticket_id}]},
        {"$set": {"has_unread_concierge_reply": False}}
    )
    return {"success": True, "ticket_id": ticket_id}


# ============================================
# MEMBER REPLY - For Outlook-style Inbox Drawer
# ============================================

class MemberReplyRequest(BaseModel):
    content: str
    sender_email: Optional[str] = None

@service_desk_router.post("/tickets/{ticket_id}/reply")
async def member_reply(ticket_id: str, request: MemberReplyRequest):
    """
    Member sends a reply in an existing ticket thread.
    Called from the Concierge Inbox Drawer (Outlook-style).
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    message_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
    
    message_entry = {
        "id": message_id,
        "sender": "member",
        "source": "inbox_drawer",
        "content": request.content,
        "text": request.content,  # For backward compatibility
        "timestamp": now.isoformat(),
        "sender_email": request.sender_email
    }
    
    # Update mira_conversations (uses conversation[])
    result1 = await db.mira_conversations.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"conversation": message_entry},
            "$set": {
                "updated_at": now.isoformat(),
                "has_unread_member_reply": True,
                "last_member_reply_at": now.isoformat()
            }
        }
    )
    
    # Update mira_tickets (uses messages[])
    result2 = await db.mira_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": message_entry},
            "$set": {
                "updated_at": now.isoformat(),
                "has_unread_member_reply": True
            }
        }
    )
    
    # Update service_desk_tickets
    result3 = await db.service_desk_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": message_entry},
            "$set": {
                "updated_at": now.isoformat(),
                "has_unread_member_reply": True
            }
        }
    )
    
    if result1.matched_count == 0 and result2.matched_count == 0 and result3.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    logger.info(f"[SERVICE_DESK] Member reply added to ticket: {ticket_id}")
    
    # Create admin notification for concierge
    try:
        admin_notif_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        await db.admin_notifications.insert_one({
            "id": admin_notif_id,
            "type": "member_reply",
            "title": "New Member Reply",
            "message": request.content[:100] + ("..." if len(request.content) > 100 else ""),
            "ticket_id": ticket_id,
            "read": False,
            "created_at": now.isoformat(),
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}"
        })
    except Exception as e:
        logger.warning(f"Failed to create admin notification for member reply: {e}")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message_id": message_id
    }


# ============================================
# TICKET STATUS UPDATES
# ============================================

@service_desk_router.post("/resolve_ticket/{ticket_id}")
async def resolve_ticket(ticket_id: str, resolution_note: Optional[str] = None):
    """Mark a ticket as resolved and enrich pet Soul from learnings."""
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
    
    # Also prepare update for mira_tickets (uses messages[] instead of conversation[])
    mira_tickets_update = {
        "$set": {
            "status": "resolved",
            "resolved_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        "$push": {
            "messages": {
                "sender": "system",
                "source": "Service_Desk",
                "content": f"Ticket resolved. {resolution_note or ''}".strip(),
                "timestamp": now.isoformat()
            }
        }
    }
    
    # Try mira_tickets first (canonical spine collection)
    result = await db.mira_tickets.update_one(
        {"ticket_id": ticket_id},
        mira_tickets_update
    )
    
    # Also try mira_conversations (for legacy/dual storage)
    legacy_result = await db.mira_conversations.update_one(
        {"ticket_id": ticket_id},
        update_doc
    )
    
    if result.matched_count == 0 and legacy_result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TICKET → SOUL AUTO-ENRICHMENT
    # Extract learnings from resolved ticket and persist to pet's Soul
    # ═══════════════════════════════════════════════════════════════════════════
    enrichment_result = {"success": False, "message": "Enrichment not attempted"}
    try:
        from ticket_soul_enrichment import process_ticket_resolution_enrichment
        enrichment_result = await process_ticket_resolution_enrichment(db, ticket_id)
        logger.info(f"[RESOLVE] Soul enrichment for {ticket_id}: {enrichment_result.get('message', 'done')}")
    except Exception as enrich_err:
        logger.warning(f"[RESOLVE] Soul enrichment failed for {ticket_id}: {enrich_err}")
        enrichment_result = {"success": False, "message": str(enrich_err)}
    
    return {
        "success": True, 
        "ticket_id": ticket_id, 
        "status": "resolved",
        "soul_enrichment": enrichment_result
    }
