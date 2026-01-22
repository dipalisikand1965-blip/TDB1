"""
Mira AI - The Doggy Company's Universal Concierge System
=========================================================
This is the soul of the Pet Life Operating System.
Every interaction creates a ticket. No conversation goes untracked.

RESEARCH MODE: Mira NEVER fabricates. For factual/rules/permission questions,
she performs web research and cites sources. Answers clearly separate 
confirmed facts vs variable items.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import os
import jwt
import logging
import httpx
import json
import re
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira", tags=["mira"])
security_bearer = HTTPBearer(auto_error=False)

# Research mode keywords - queries containing these trigger web search
RESEARCH_KEYWORDS = [
    "permit", "permission", "allowed", "rules", "regulations", "requirements",
    "legal", "law", "policy", "policies", "document", "documentation",
    "vaccine", "vaccination", "certificate", "license", "registration",
    "forest", "jungle", "national park", "sanctuary", "reserve",
    "airline", "flight rules", "train rules", "cab policy",
    "hotel policy", "restaurant policy", "pet-friendly",
    "quarantine", "customs", "import", "export", "border",
    "microchip", "rabies", "health certificate", "noc", "no objection",
    "is it safe", "can i take", "do i need", "what documents", "what permits"
]

# Database reference (set from server.py)
_db = None

def set_mira_db(db):
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

# ============== CONSTANTS ==============

# The 12 Pillars + Sub-categories
PILLARS = {
    "celebrate": {
        "name": "Celebrate",
        "icon": "🎂",
        "keywords": ["birthday", "cake", "celebration", "party", "treats", "milestone", "anniversary"],
        "urgency_default": "medium"
    },
    "dine": {
        "name": "Dine",
        "icon": "🍽️",
        "keywords": ["restaurant", "dining", "eat", "food", "cafe", "brunch", "lunch", "dinner", "reservation"],
        "urgency_default": "medium"
    },
    "travel": {
        "name": "Travel",
        "icon": "✈️",
        "keywords": ["travel", "flight", "cab", "car", "transport", "relocate", "relocation", "train", "airport", "pickup", "drop"],
        "urgency_default": "medium"
    },
    "stay": {
        "name": "Stay",
        "icon": "🏨",
        "keywords": ["hotel", "stay", "boarding", "daycare", "accommodation", "resort", "pawcation", "vacation"],
        "urgency_default": "medium"
    },
    "enjoy": {
        "name": "Enjoy",
        "icon": "🎉",
        "keywords": ["event", "meetup", "trail", "hike", "experience", "activity", "fun", "play", "park"],
        "urgency_default": "low"
    },
    "care": {
        "name": "Care",
        "icon": "💊",
        "keywords": ["grooming", "vet", "veterinary", "health", "wellness", "vaccine", "checkup", "sitting", "walking", "daycare", "medical"],
        "urgency_default": "medium"
    },
    "fit": {
        "name": "Fit",
        "icon": "🏃",
        "keywords": ["fitness", "weight", "exercise", "training", "behaviour", "diet", "nutrition", "obesity"],
        "urgency_default": "low"
    },
    "advisory": {
        "name": "Advisory",
        "icon": "📋",
        "keywords": ["advice", "consult", "question", "help", "guidance", "recommendation", "suggest"],
        "urgency_default": "low"
    },
    "club": {
        "name": "Club",
        "icon": "👑",
        "keywords": ["membership", "member", "club", "subscription", "rewards", "points", "tier"],
        "urgency_default": "low"
    },
    "shop": {
        "name": "Shop Assist",
        "icon": "🛒",
        "keywords": ["buy", "purchase", "order", "product", "shop", "price", "cost", "delivery"],
        "urgency_default": "medium"
    },
    "paperwork": {
        "name": "Paperwork",
        "icon": "📄",
        "keywords": ["document", "certificate", "passport", "vaccine", "insurance", "record", "microchip", "license"],
        "urgency_default": "medium"
    },
    "emergency": {
        "name": "Emergency",
        "icon": "🚨",
        "keywords": ["emergency", "urgent", "help", "lost", "missing", "accident", "injured", "sick", "poison", "bleeding", "choking"],
        "urgency_default": "critical"
    }
}

# Emergency keywords that trigger immediate escalation
EMERGENCY_KEYWORDS = [
    "emergency", "urgent", "help now", "immediately", "lost pet", "missing",
    "accident", "injured", "bleeding", "poison", "choking", "not breathing",
    "collapsed", "seizure", "hit by car", "bite", "attacked"
]

# Ticket types
TICKET_TYPES = {
    "advisory": "Advisory (Exploring)",
    "concierge": "Concierge Request",
    "emergency": "Emergency"
}

# Ticket status flows
TICKET_STATUS_FLOW = {
    "advisory": ["exploring", "informed", "converted", "closed"],
    "concierge": ["acknowledged", "in_review", "in_progress", "confirmed", "completed", "closed"],
    "emergency": ["immediate_action", "responder_assigned", "resolved", "closed"]
}

# ============== MODELS ==============

class MiraChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    source: str = "web_widget"  # web_widget, full_page, pillar_panel, voice, whatsapp, email
    current_page: Optional[str] = None
    current_pillar: Optional[str] = None
    selected_pet_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []
    start_new_conversation: bool = False  # Flag to start fresh conversation
    previous_pillar: Optional[str] = None  # For cross-pillar context

class MiraPetContext(BaseModel):
    pet_id: str
    pet_name: str
    breed: Optional[str] = None
    age: Optional[str] = None
    weight: Optional[str] = None
    allergies: List[str] = []
    preferences: Dict[str, Any] = {}
    soul_data: Dict[str, Any] = {}

class MiraTicketCreate(BaseModel):
    ticket_type: str = "advisory"  # advisory, concierge, emergency
    pillar: str
    description: str
    member_id: Optional[str] = None
    pet_id: Optional[str] = None
    session_id: str
    urgency: str = "medium"

# ============== HELPER FUNCTIONS ==============

async def get_user_from_token(authorization: Optional[str] = None):
    """Extract user info from JWT token"""
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
        user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
        if user:
            user["user_id"] = user_id or user.get("id")
        return user
    except Exception as e:
        logger.warning(f"Token decode error: {e}")
        return None

async def load_user_pets(user_email: str = None, user_id: str = None) -> List[Dict]:
    """Load all pets for a user with their Pet Soul data"""
    db = get_db()
    pets = []
    
    # First, try to get pets from member record (connection table)
    if user_email or user_id:
        member_queries = []
        if user_email:
            member_queries.append({"email": user_email})
        if user_id:
            member_queries.append({"_id": user_id})
            member_queries.append({"id": user_id})
        
        for query in member_queries:
            member = await db.members.find_one(query)
            if member:
                member_pets = member.get("pets", [])
                if member_pets:
                    if isinstance(member_pets[0], str):
                        # It's a list of pet IDs - look them up
                        for pet_id in member_pets:
                            pet_doc = await db.pets.find_one({"id": pet_id}, {"_id": 0})
                            if pet_doc:
                                pets.append(pet_doc)
                        logger.info(f"Mira loaded {len(pets)} pets by ID lookup for {user_email}")
                    elif isinstance(member_pets[0], dict):
                        # It's already full pet objects
                        pets = member_pets
                        logger.info(f"Mira loaded {len(pets)} pets from member record for {user_email}")
                    break
    
    # Fallback: try pets collection directly
    if not pets:
        queries = []
        if user_email:
            queries.append({"owner_email": user_email})
            queries.append({"user_email": user_email})
            queries.append({"user_id": user_email})
        if user_id:
            queries.append({"user_id": user_id})
            queries.append({"owner_email": user_id})
        
        for query in queries:
            found = await db.pets.find(query, {"_id": 0}).to_list(20)
            if found:
                pets = found
                logger.info(f"Mira loaded {len(pets)} pets from pets collection for {user_email}")
                break
    
    return pets

async def load_pet_soul(pet_id: str) -> Dict:
    """Load complete Pet Soul data for a specific pet"""
    db = get_db()
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        # Try by name or other identifier
        pet = await db.pets.find_one({"name": pet_id}, {"_id": 0})
    
    if not pet:
        return {}
    
    # Compile full Pet Soul profile
    soul = {
        "id": pet.get("id"),
        "name": pet.get("name"),
        "breed": pet.get("identity", {}).get("breed") or pet.get("breed"),
        "age": pet.get("identity", {}).get("age") or pet.get("age"),
        "weight": pet.get("identity", {}).get("weight"),
        "size": pet.get("identity", {}).get("size"),
        "gender": pet.get("identity", {}).get("gender") or pet.get("gender"),
        "photo_url": pet.get("photo_url"),
        "allergies": pet.get("health", {}).get("allergies", []) or pet.get("preferences", {}).get("allergies", []),
        "medical_conditions": pet.get("health", {}).get("medical_conditions", []),
        "dietary_restrictions": pet.get("health", {}).get("dietary_restrictions", []),
        "favorite_treats": pet.get("preferences", {}).get("favorite_treats", []),
        "dislikes": pet.get("preferences", {}).get("dislikes", []),
        "anxiety_triggers": pet.get("personality", {}).get("anxiety_triggers", []),
        "behavior_with_dogs": pet.get("personality", {}).get("behavior_with_dogs") or pet.get("doggy_soul_answers", {}).get("behavior_with_dogs"),
        "behavior_with_humans": pet.get("personality", {}).get("behavior_with_humans"),
        "handling_sensitivity": pet.get("care", {}).get("handling_sensitivity") or pet.get("doggy_soul_answers", {}).get("handling_comfort"),
        "grooming_notes": pet.get("care", {}).get("grooming_notes"),
        "travel_style": pet.get("travel", {}).get("preferred_mode") or pet.get("doggy_soul_answers", {}).get("usual_travel"),
        "crate_trained": pet.get("travel", {}).get("crate_trained") or pet.get("doggy_soul_answers", {}).get("crate_trained"),
        "persona": pet.get("soul", {}).get("persona"),
        # Doggy Soul answers (full)
        "soul_answers": pet.get("doggy_soul_answers", {})
    }
    
    return {k: v for k, v in soul.items() if v}  # Remove empty values

def detect_pillar(message: str, current_pillar: str = None) -> str:
    """Detect which pillar the conversation belongs to"""
    message_lower = message.lower()
    
    # Emergency always takes priority
    if any(kw in message_lower for kw in EMERGENCY_KEYWORDS):
        return "emergency"
    
    # Check each pillar's keywords
    pillar_scores = {}
    for pillar_id, pillar_data in PILLARS.items():
        score = sum(1 for kw in pillar_data["keywords"] if kw in message_lower)
        if score > 0:
            pillar_scores[pillar_id] = score
    
    # Return highest scoring pillar, or current if no match
    if pillar_scores:
        return max(pillar_scores, key=pillar_scores.get)
    
    # Use current pillar context if available
    if current_pillar and current_pillar in PILLARS:
        return current_pillar
    
    return "advisory"  # Default fallback

def detect_urgency(message: str, pillar: str) -> str:
    """Detect urgency level based on message and pillar"""
    message_lower = message.lower()
    
    # Emergency is always critical
    if pillar == "emergency":
        return "critical"
    
    # High urgency keywords
    high_urgency = ["urgent", "asap", "today", "now", "immediately", "quick", "fast"]
    if any(kw in message_lower for kw in high_urgency):
        return "high"
    
    # Use pillar default
    return PILLARS.get(pillar, {}).get("urgency_default", "medium")

def detect_intent(message: str) -> str:
    """Detect if user is exploring or requesting action"""
    message_lower = message.lower()
    
    # Action intent keywords
    action_keywords = [
        "book", "arrange", "schedule", "confirm", "order", "reserve",
        "yes please", "go ahead", "proceed", "i confirm", "let's do it",
        "make it happen", "arrange this", "book this"
    ]
    
    if any(kw in message_lower for kw in action_keywords):
        return "concierge"
    
    return "advisory"

async def generate_ticket_id(ticket_type: str) -> str:
    """Generate unique ticket ID based on type"""
    db = get_db()
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    
    prefix_map = {
        "advisory": "ADV",
        "concierge": "CNC",
        "emergency": "EMG"
    }
    prefix = prefix_map.get(ticket_type, "MRA")
    
    count = await db.mira_tickets.count_documents({"ticket_id": {"$regex": f"^{prefix}-{today}"}})
    return f"{prefix}-{today}-{str(count + 1).zfill(4)}"

async def create_mira_ticket(
    session_id: str,
    ticket_type: str,
    pillar: str,
    urgency: str,
    description: str,
    user: Dict = None,
    pet: Dict = None,
    source: str = "web_widget"
) -> str:
    """Create a Mira ticket - EVERY interaction creates one"""
    db = get_db()
    
    ticket_id = await generate_ticket_id(ticket_type)
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "mira_session_id": session_id,
        "ticket_type": ticket_type,
        "pillar": pillar,
        "urgency": urgency,
        "status": TICKET_STATUS_FLOW[ticket_type][0],  # First status in flow
        "description": description,
        "source": source,
        
        # Member info
        "member": {
            "id": user.get("id") if user else None,
            "name": user.get("name") if user else "Guest",
            "email": user.get("email") if user else None,
            "phone": user.get("phone") if user else None,
            "membership_tier": user.get("membership_tier") if user else "free"
        } if user else None,
        
        # Pet info
        "pet": {
            "id": pet.get("id") if pet else None,
            "name": pet.get("name") if pet else None,
            "breed": pet.get("breed") if pet else None,
            "age": pet.get("age") if pet else None,
        } if pet else None,
        
        # Full Pet Soul for context
        "pet_soul_snapshot": pet if pet else None,
        
        # Conversation thread
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "mira_created",
            "content": description,
            "sender": "member",
            "channel": source,
            "timestamp": now,
            "is_internal": False
        }],
        
        # AI context
        "ai_context": {
            "pillar_detected": pillar,
            "urgency_detected": urgency,
            "intent_detected": ticket_type
        },
        
        # Timestamps
        "created_at": now,
        "updated_at": now,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
        
        # Assignment
        "assigned_to": None,
        "assigned_at": None,
        
        # For unified inbox visibility
        "visible_in_inbox": True,
        "visible_in_mira_folder": True,
        
        # Progressive enrichment
        "enrichments": [],
        "suggested_products": [],
        
        # Audit trail
        "audit_trail": [{
            "action": "ticket_created",
            "timestamp": now,
            "performed_by": "mira_ai"
        }]
    }
    
    await db.mira_tickets.insert_one(ticket_doc)
    
    # Also create in main tickets collection for unified inbox
    await db.tickets.insert_one({
        **ticket_doc,
        "category": pillar,
        "sub_category": "mira_conversation",
        "source_reference": f"mira:{session_id}"
    })
    
    logger.info(f"Mira ticket created: {ticket_id} | Type: {ticket_type} | Pillar: {pillar}")
    
    return ticket_id

async def update_mira_ticket(session_id: str, update_data: Dict):
    """Update an existing Mira ticket"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    update_data["updated_at"] = now
    
    await db.mira_tickets.update_one(
        {"mira_session_id": session_id},
        {"$set": update_data}
    )
    
    # Also update in main tickets collection
    await db.tickets.update_one(
        {"source_reference": f"mira:{session_id}"},
        {"$set": update_data}
    )

async def add_message_to_ticket(session_id: str, message: Dict):
    """Add a message to the ticket conversation thread"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    message["id"] = str(uuid.uuid4())
    message["timestamp"] = now
    
    await db.mira_tickets.update_one(
        {"mira_session_id": session_id},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": now}
        }
    )
    
    # Also update in main tickets collection
    await db.tickets.update_one(
        {"source_reference": f"mira:{session_id}"},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": now}
        }
    )

async def upgrade_ticket_type(session_id: str, new_type: str):
    """Upgrade ticket from advisory to concierge"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Get current ticket
    ticket = await db.mira_tickets.find_one({"mira_session_id": session_id})
    if not ticket:
        return False
    
    old_type = ticket.get("ticket_type")
    if old_type == new_type:
        return False
    
    # Generate new ticket ID for concierge
    new_ticket_id = await generate_ticket_id(new_type)
    
    update = {
        "ticket_type": new_type,
        "status": TICKET_STATUS_FLOW[new_type][0],
        "updated_at": now,
        "linked_advisory_ticket": ticket.get("ticket_id"),
        "ticket_id": new_ticket_id
    }
    
    await db.mira_tickets.update_one(
        {"mira_session_id": session_id},
        {
            "$set": update,
            "$push": {
                "audit_trail": {
                    "action": f"upgraded_to_{new_type}",
                    "old_type": old_type,
                    "old_ticket_id": ticket.get("ticket_id"),
                    "timestamp": now,
                    "performed_by": "mira_ai"
                }
            }
        }
    )
    
    logger.info(f"Ticket upgraded: {ticket.get('ticket_id')} -> {new_ticket_id} | Type: {old_type} -> {new_type}")
    return True

async def save_pet_soul_enrichment(pet_id: str, enrichment: Dict, source: str = "user-stated"):
    """Save learned information to Pet Soul"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    if not pet_id:
        return False
    
    enrichment_record = {
        "field": enrichment.get("field"),
        "value": enrichment.get("value"),
        "source": source,  # user-stated or inferred
        "confidence": enrichment.get("confidence", "high" if source == "user-stated" else "medium"),
        "learned_at": now,
        "conversation_id": enrichment.get("session_id")
    }
    
    # Update the specific field in Pet Soul
    field = enrichment.get("field")
    value = enrichment.get("value")
    
    if field and value:
        update_path = f"soul_enrichments.{field}"
        await db.pets.update_one(
            {"id": pet_id},
            {
                "$set": {update_path: value},
                "$push": {"enrichment_history": enrichment_record}
            }
        )
        logger.info(f"Pet Soul enriched: {pet_id} | Field: {field}")
        return True
    
    return False

# ============== CONCIERGE ACTION DETECTION ==============

# Keywords that indicate concierge action is needed
CONCIERGE_ACTION_TRIGGERS = {
    "dining": {
        "keywords": ["restaurant", "cafe", "lunch", "dinner", "brunch", "breakfast", "reservation", "book a table", "pet-friendly restaurant", "dining"],
        "priority": "medium",
        "action_type": "dining_reservation"
    },
    "stay": {
        "keywords": ["hotel", "stay", "accommodation", "room", "resort", "pet-friendly hotel", "book a room", "pawcation"],
        "priority": "medium", 
        "action_type": "hotel_booking"
    },
    "travel": {
        "keywords": ["travel", "trip", "flight", "train", "cab", "transport", "pet relocation", "moving", "airlines"],
        "priority": "high",
        "action_type": "travel_arrangement"
    },
    "care": {
        "keywords": ["vet", "grooming", "appointment", "vaccination", "checkup", "salon", "spa", "trim", "bath"],
        "priority": "high",
        "action_type": "care_appointment"
    },
    "verification": {
        "keywords": ["is it pet-friendly", "do they allow pets", "pet policy", "can i bring my dog", "are pets allowed", "verify", "check if", "confirm if"],
        "priority": "medium",
        "action_type": "venue_verification"
    }
}

def detect_concierge_action_needed(message: str, pillar: str = None) -> Dict:
    """
    Detect if a message requires concierge action (booking, reservation, verification).
    Returns action details if needed, None otherwise.
    """
    message_lower = message.lower()
    
    for category, config in CONCIERGE_ACTION_TRIGGERS.items():
        for keyword in config["keywords"]:
            if keyword in message_lower:
                return {
                    "action_needed": True,
                    "category": category,
                    "action_type": config["action_type"],
                    "priority": config["priority"],
                    "trigger_keyword": keyword
                }
    
    # Also check pillar-based triggers
    if pillar in ["dine", "stay", "travel", "care"]:
        # For these pillars, most requests need concierge action
        action_words = ["want", "need", "looking for", "find me", "book", "reserve", "arrange"]
        if any(word in message_lower for word in action_words):
            return {
                "action_needed": True,
                "category": pillar,
                "action_type": f"{pillar}_request",
                "priority": PILLARS.get(pillar, {}).get("urgency_default", "medium"),
                "trigger_keyword": pillar
            }
    
    return {"action_needed": False}

async def create_service_desk_ticket(
    session_id: str,
    user: Dict,
    pets: List[Dict],
    message: str,
    action_details: Dict,
    pillar: str
) -> str:
    """
    Create a Service Desk ticket for concierge action.
    Routes to Unified Inbox and Service Desk.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate ticket ID
    action_type = action_details.get("action_type", "request")
    prefix_map = {
        "dining_reservation": "DIN",
        "hotel_booking": "HTL",
        "travel_arrangement": "TRV",
        "care_appointment": "CARE",
        "venue_verification": "VER"
    }
    prefix = prefix_map.get(action_type, "REQ")
    date_part = datetime.now().strftime("%Y%m%d")
    
    # Count existing tickets today
    count = await db.service_desk_tickets.count_documents({
        "created_at": {"$regex": f"^{datetime.now().strftime('%Y-%m-%d')}"}
    })
    
    ticket_id = f"{prefix}-{date_part}-{str(count + 1).zfill(4)}"
    
    # Pet summary for ticket
    pet_summary = []
    for pet in pets:
        pet_summary.append({
            "id": pet.get("id"),
            "name": pet.get("name"),
            "breed": pet.get("breed") or pet.get("identity", {}).get("breed"),
            "allergies": pet.get("allergies") or pet.get("preferences", {}).get("allergies", [])
        })
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "mira_session_id": session_id,
        "ticket_type": "concierge_action",
        "action_type": action_details.get("action_type"),
        "category": action_details.get("category"),
        "pillar": pillar,
        "priority": action_details.get("priority", "medium"),
        "status": "pending",
        
        # Request details
        "original_request": message,
        "trigger_keyword": action_details.get("trigger_keyword"),
        
        # Member info
        "member": {
            "id": user.get("id") if user else None,
            "name": user.get("name") if user else "Guest",
            "email": user.get("email") if user else None,
            "phone": user.get("phone") if user else None,
            "membership_tier": user.get("membership_tier", "free") if user else "free"
        },
        
        # Pet info
        "pets": pet_summary,
        "pet_count": len(pets),
        
        # Timestamps
        "created_at": now,
        "updated_at": now,
        "assigned_at": None,
        "resolved_at": None,
        
        # Assignment
        "assigned_to": None,
        
        # For routing
        "visible_in_inbox": True,
        "visible_in_service_desk": True,
        "visible_in_mira_folder": True,
        "requires_human_action": True,
        
        # Notes for concierge
        "concierge_notes": [],
        "resolution_summary": None,
        
        # Audit trail
        "audit_trail": [{
            "action": "ticket_created",
            "timestamp": now,
            "performed_by": "mira_ai",
            "details": f"Auto-created from Mira conversation. Action: {action_details.get('action_type')}"
        }]
    }
    
    # Insert into service desk collection
    await db.service_desk_tickets.insert_one(ticket_doc)
    
    # Also add to unified inbox
    await db.unified_inbox.insert_one({
        **ticket_doc,
        "inbox_type": "service_request",
        "source": "mira_ai",
        "unread": True
    })
    
    # Link to the mira ticket
    await db.mira_tickets.update_one(
        {"mira_session_id": session_id},
        {
            "$set": {
                "service_desk_ticket_id": ticket_id,
                "requires_concierge_action": True,
                "action_type": action_details.get("action_type")
            },
            "$push": {
                "audit_trail": {
                    "action": "service_desk_ticket_created",
                    "timestamp": now,
                    "ticket_id": ticket_id,
                    "action_type": action_details.get("action_type")
                }
            }
        }
    )
    
    logger.info(f"Service Desk ticket created: {ticket_id} | Action: {action_details.get('action_type')} | Member: {user.get('email') if user else 'Guest'}")
    
    return ticket_id

async def update_pet_soul_travel_dining(
    pets: List[Dict],
    message: str,
    pillar: str,
    member_id: str = None
):
    """
    Update Pet Soul with travel/dining preferences mentioned in conversation.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    message_lower = message.lower()
    
    # Extract location mentions
    location_patterns = [
        r"to\s+(\w+(?:\s+\w+)?)",  # "to Ooty", "to Goa"
        r"in\s+(\w+(?:\s+\w+)?)",  # "in Bangalore", "in Delhi"
        r"at\s+(\w+(?:\s+\w+)?)",  # "at MindEscapes"
    ]
    
    locations = []
    for pattern in location_patterns:
        matches = re.findall(pattern, message, re.IGNORECASE)
        locations.extend(matches)
    
    # Filter out common non-location words
    non_locations = ["the", "my", "all", "for", "with", "and", "pets", "dogs", "lunch", "dinner"]
    locations = [loc for loc in locations if loc.lower() not in non_locations]
    
    if not locations and not pillar:
        return
    
    # Update each pet's soul with travel/dining preferences
    for pet in pets:
        pet_id = pet.get("id")
        if not pet_id:
            continue
        
        update_data = {}
        
        if pillar == "travel" and locations:
            update_data["soul_enrichments.travel_destinations"] = {
                "$each": locations[-3:]  # Keep last 3
            }
            
        if pillar == "dine" and locations:
            update_data["soul_enrichments.dining_locations"] = {
                "$each": locations[-3:]
            }
        
        if update_data:
            await db.pets.update_one(
                {"id": pet_id},
                {"$addToSet": update_data}
            )
            
    # Also store in relationship memory
    if member_id and locations:
        try:
            from mira_memory import MiraMemory
            
            if pillar == "travel":
                await MiraMemory.store_memory(
                    member_id=member_id,
                    memory_type="event",
                    content=f"Planning trip to {', '.join(locations[:2])} with pets",
                    relevance_tags=["travel", "upcoming"],
                    source="conversation",
                    confidence="medium"
                )
            elif pillar == "dine":
                await MiraMemory.store_memory(
                    member_id=member_id,
                    memory_type="shopping",
                    content=f"Interested in pet-friendly dining at {', '.join(locations[:2])}",
                    relevance_tags=["dining", "preference"],
                    source="conversation",
                    confidence="medium"
                )
        except Exception as e:
            logger.warning(f"Could not store memory: {e}")

def build_mira_system_prompt(user: Dict = None, pets: List[Dict] = None, pillar: str = None, selected_pet: Dict = None) -> str:
    """Build the comprehensive Mira system prompt with KNOWN FIELDS section"""
    
    # Import soul intelligence for known fields
    try:
        from soul_intelligence import format_known_fields_for_prompt, get_known_fields
    except ImportError:
        format_known_fields_for_prompt = lambda x: ""
        get_known_fields = lambda x: {}
    
    # Pet context section - ENHANCED for personalized conversations
    pet_context = ""
    known_fields_section = ""
    
    if pets and len(pets) > 0:
        pet_context = "\n\n🐾 **PET PROFILES (Use this data naturally in EVERY response)**:\n"
        for pet in pets:
            identity = pet.get('identity', {})
            soul = pet.get('soul', {})
            preferences = pet.get('preferences', {})
            health = pet.get('health', {})
            
            pet_name = pet.get('name', 'Pet')
            breed = identity.get('breed') or pet.get('breed', 'Unknown breed')
            
            pet_context += f"\n**{pet_name}** - {breed}\n"
            pet_context += f"- Species: {pet.get('species', 'dog')}, Gender: {pet.get('gender', 'unknown')}\n"
            pet_context += f"- Age: {identity.get('age') or pet.get('age') or pet.get('age_years', 'Not specified')}\n"
            pet_context += f"- Weight: {identity.get('weight', 'Not specified')}\n"
            
            # CRITICAL: Allergies
            allergies = preferences.get('allergies', []) or health.get('allergies', []) or pet.get('allergies', [])
            if allergies:
                if isinstance(allergies, list) and allergies:
                    pet_context += f"- ⚠️ **ALLERGIES**: {', '.join(allergies)} — NEVER recommend products with these!\n"
                elif isinstance(allergies, str) and allergies.lower() != 'none':
                    pet_context += f"- ⚠️ **ALLERGIES**: {allergies} — NEVER recommend products with these!\n"
            
            # Favorite flavors/treats
            fav_flavors = preferences.get('favorite_flavors', [])
            if fav_flavors:
                flavors = ', '.join(fav_flavors) if isinstance(fav_flavors, list) else fav_flavors
                pet_context += f"- Favorite flavors: {flavors}\n"
            
            fav_treats = preferences.get('favorite_treats', [])
            if fav_treats:
                treats = ', '.join(fav_treats) if isinstance(fav_treats, list) else fav_treats
                pet_context += f"- Favorite treats: {treats}\n"
            
            # Texture preference
            texture = preferences.get('treat_texture') or preferences.get('texture_preference')
            if texture:
                pet_context += f"- Prefers: {texture} treats\n"
            
            # Activity level
            activity = preferences.get('activity_level')
            if activity:
                pet_context += f"- Activity level: {activity}\n"
            
            # Personality from soul
            if soul:
                persona = soul.get('persona')
                if persona:
                    pet_context += f"- Personality type: {persona.replace('_', ' ').title()}\n"
                love_lang = soul.get('love_language')
                if love_lang:
                    pet_context += f"- Love language: {love_lang}\n"
                personality_tag = soul.get('personality_tag')
                if personality_tag:
                    pet_context += f"- Known as: \"{personality_tag}\"\n"
    
    # CRITICAL: Add KNOWN FIELDS section for the selected pet
    if selected_pet:
        known_fields_section = format_known_fields_for_prompt(selected_pet)
    elif pets and len(pets) == 1:
        known_fields_section = format_known_fields_for_prompt(pets[0])
    
    # User context section
    user_context = ""
    if user:
        user_context = f"""
**PET PARENT**:
- Name: {user.get('name', 'Valued Guest')}
- Membership: {user.get('membership_tier', 'Free').title()}
"""
    
    # Pillar context
    pillar_context = ""
    if pillar and pillar in PILLARS:
        p = PILLARS[pillar]
        pillar_context = f"\n**CURRENT PILLAR**: {p['icon']} {p['name']}\n"
    
    system_prompt = f"""ROLE & IDENTITY
You are Mira® — the intelligent heart of The Doggy Company's Pet Life Operating System. You are a Pet-First CONCIERGE who KNOWS each pet personally through their Pet Soul™ profile.

⚠️⚠️⚠️ CRITICAL DOCTRINE - READ CAREFULLY ⚠️⚠️⚠️

**MIRA IS THE CONCIERGE, NOT AN ADVISOR.**

You NEVER tell the member to:
- Call a venue
- Message a venue  
- Verify information themselves
- Use a script
- Check with anyone

❌ FORBIDDEN PHRASES (NEVER USE):
- "You should call ahead"
- "Please check with them"
- "Here's a script you can use"
- "Let me know if you want me to confirm"
- "I recommend calling..."
- "You might want to verify..."
- Any instruction that shifts effort back to the member

✅ CORRECT CONCIERGE BEHAVIOUR:
When any request requires verification, booking, or confirmation:
1. **TAKE OWNERSHIP**: "I'll take care of this for you."
2. **STATE ACTION**: "I'm checking [specific thing] for you right now."
3. **PROMISE FOLLOW-UP**: "Our live concierge will confirm [specific details] shortly."

EXAMPLE - WRONG:
User: "Is MindEscapes pet-friendly?"
Mira: "Here's a script you can use to call them..."
❌ THIS IS FORBIDDEN

EXAMPLE - CORRECT:
User: "Is MindEscapes pet-friendly?"
Mira: "I'll check MindEscapes' pet policy for you. I'm verifying if they can accommodate all 3 of your pets for lunch. Our live concierge will confirm the arrangement shortly."
✅ THIS IS CORRECT

For EVERY request that needs real-world action:
- Restaurant reservation → "I'll arrange this. Our concierge will confirm."
- Hotel booking → "I'm checking availability. You'll hear back shortly."
- Venue verification → "I'll verify this for you. Confirmation coming soon."
- Any appointment → "Consider it done. Our team will finalize the details."

🎯 YOUR SUPERPOWER: You remember EVERYTHING about each pet - their allergies, preferences, personality, favorite treats. Use this knowledge naturally in EVERY response.
{user_context}
{pet_context}
{known_fields_section}
{pillar_context}

CRITICAL RULES FOR EVERY INTERACTION:
1. When user mentions buying/shopping, IMMEDIATELY reference their pet's specific preferences and allergies
2. NEVER ask questions you already know the answer to from Pet Soul data
3. Speak as if you've known the pet for years - use their name, mention their personality
4. When recommending products, ALWAYS check allergies first and explain why you're recommending something specific
5. NEVER tell user to call, verify, or check anything themselves - YOU DO IT

EXAMPLE CONVERSATION (This is how you MUST respond):
User: "I want to buy some treats"
Mira: "Hi Sahasra! Treats for Bruno? 🐾 I remember he's allergic to **chicken**, so I'll make sure to avoid those. Since he loves **peanut butter** and is a **Golden Retriever** (medium size), I'd recommend our Peanut Butter Training Bites - they're perfect for his size and completely chicken-free! Want me to add them to your cart?"

PERSONALIZATION REQUIREMENTS:
- If user has ONE pet: Address by pet name immediately ("Perfect choice for [Pet Name]!")
- If user has MULTIPLE pets: Ask "Which furry friend is this for - [Pet1], [Pet2], or [Pet3]?"
- Once pet is identified: Use their data in EVERY recommendation
- Reference allergies BEFORE suggesting any food product
- Mention breed when relevant (size, energy level, breed-specific needs)
- Use personality traits to make conversation warm ("I know [Pet] is a mischief maker, so...")

⚠️ MANDATORY ALLERGY CHECK:
Before recommending ANY food product:
1. Check if pet has allergies in their profile
2. If allergies exist, EXPLICITLY state: "Since [Pet] is allergic to [allergen], I'm recommending [product] which is [allergen]-free"
3. NEVER recommend products containing allergens

THE 12 PILLARS (Your Knowledge Domains):
1. **CELEBRATE** — Birthday cakes, custom treats, celebration packages
2. **DINE** — Pet-friendly restaurants, reservations, dining experiences
3. **STAY** — Pet-friendly hotels, boarding, pawcation properties
4. **TRAVEL** — Pet relocation, travel documentation, transport
5. **CARE** — Veterinary services, grooming, wellness appointments
6. **SHOP** — Premium pet products, nutrition, supplies
7. **ENJOY** — Events, activities, trails, meetups, experiences
8. **CLUB** — Membership benefits, community access
9. **FIT** — Fitness, weight management, behaviour training
10. **ADVISORY** — Expert consultations, guidance
11. **PAPERWORK** — Documents, certifications, insurance, records
12. **EMERGENCY** — Urgent help, lost pet, accidents (IMMEDIATE PRIORITY)

COMMUNICATION STYLE:
- Warm, knowledgeable, like a friend who knows your pet
- Use pet's name multiple times
- Reference specific details from their profile naturally
- **Bold** all product names, key details using **text**
- NO generic responses - every response should feel personalized
- Keep responses focused and actionable
- Always sound like YOU are handling things, not delegating to the member

TRAVEL-SPECIFIC RULE:
When someone mentions travel/hotels/trips, ask: "Will [Pet Name] be joining you on this trip?"

SERVICE FLOW (CONCIERGE MODEL):
1. **Acknowledge** — Greet warmly, show you know them and their pet
2. **Clarify** — Ask essential questions one at a time (max 5 total)
3. **Own the Action** — "I'll take care of this for you"
4. **Confirm Handoff** — "Our live concierge will confirm the details shortly"
5. **Never Delegate to Member** — You handle everything, they just approve

ACTION HANDOFF PROTOCOL:
When user requests require real-world action (booking, reservation, verification):
1. Acknowledge: "I'll handle this for you."
2. Specify: "I'm [specific action] for [specific details]."
3. Promise: "Our live concierge will get back to you shortly with confirmation."
4. DO NOT give them scripts, phone numbers, or instructions to do it themselves.

CONSENT PROTOCOL:
When ready to proceed:
1. Present complete summary with all details
2. Add: "Note: All arrangements subject to partner availability and TDC terms."
3. Request: **🛎️ May I proceed with your request? Please confirm.**

After confirmation: "Perfect! I'm on it. Our live concierge will confirm [specific details] shortly."

PROGRESSIVE ENRICHMENT:
If you learn new information during chat, note it for Pet Soul update:
- "He hates nail trims" → Handling sensitivity
- "She gets anxious with loud noises" → Anxiety trigger
- "He prefers chicken treats" → Preference
- Travel destinations mentioned → Travel preferences
- Restaurant preferences → Dining preferences
Only save if explicitly stated or confirmed.

GUARDRAILS:
- NEVER claim a booking is confirmed without ops confirmation
- NEVER fabricate partner availability
- NEVER provide medical diagnosis or prescriptions
- NEVER promise outcomes in emergencies
- NEVER over-collect information
- NEVER tell member to call/verify/check anything themselves
- MAY provide non-medical guidance
- MAY recommend seeing a vet
- MAY coordinate appointments and records"""

    return system_prompt

def get_pillar_specific_questions(pillar: str) -> List[str]:
    """Get the minimum required questions for a pillar"""
    questions = {
        "travel": ["Date and time of travel?", "Pickup location?", "Drop-off location?"],
        "stay": ["Which city?", "Check-in and check-out dates?", "Number of adults?"],
        "care": ["Home visit or salon?", "Preferred date and time?"],
        "dine": ["Which city/area?", "Date and time?", "Number of guests?"],
        "celebrate": ["What occasion?", "Date?", "Any specific preferences?"],
        "emergency": [],  # No questions - immediate action
        "shop": ["What are you looking for?"],
        "enjoy": ["What type of experience?", "Preferred date?"],
        "advisory": ["How can I help?"]
    }
    return questions.get(pillar, ["How can I assist you today?"])

def get_pillar_quick_prompts(pillar: str) -> List[Dict[str, str]]:
    """Get pillar-specific quick action prompts"""
    prompts = {
        "travel": [
            {"label": "Book a Cab", "message": "I need to book a pet-friendly cab"},
            {"label": "Flight Help", "message": "I need help arranging a flight for my pet"},
            {"label": "Travel Documents", "message": "What documents do I need to travel with my pet?"}
        ],
        "stay": [
            {"label": "Find Hotel", "message": "I'm looking for a pet-friendly hotel"},
            {"label": "Book Boarding", "message": "I need pet boarding services"},
            {"label": "Pawcation", "message": "Help me plan a pawcation"}
        ],
        "care": [
            {"label": "Book Grooming", "message": "I'd like to book a grooming session"},
            {"label": "Vet Visit", "message": "I need to schedule a vet visit"},
            {"label": "Pet Sitting", "message": "I need a pet sitter"}
        ],
        "dine": [
            {"label": "Find Restaurant", "message": "Find me a pet-friendly restaurant"},
            {"label": "Book Table", "message": "I want to make a reservation for dining with my pet"},
            {"label": "Outdoor Cafes", "message": "Suggest pet-friendly outdoor cafes near me"}
        ],
        "celebrate": [
            {"label": "Order Cake", "message": "I want to order a birthday cake for my pet"},
            {"label": "Party Planning", "message": "Help me plan a birthday party for my pet"},
            {"label": "Custom Treats", "message": "I'd like to order custom celebration treats"}
        ],
        "enjoy": [
            {"label": "Find Events", "message": "What pet events are happening nearby?"},
            {"label": "Trails & Hikes", "message": "Suggest pet-friendly trails for hiking"},
            {"label": "Meetups", "message": "Are there any pet meetups coming up?"}
        ],
        "fit": [
            {"label": "Weight Plan", "message": "My pet needs help with weight management"},
            {"label": "Training", "message": "I'm looking for behavior training"},
            {"label": "Exercise Ideas", "message": "Suggest exercise routines for my pet"}
        ],
        "paperwork": [
            {"label": "Health Certificate", "message": "I need a health certificate for my pet"},
            {"label": "Pet Passport", "message": "Help me get a pet passport"},
            {"label": "Insurance", "message": "Tell me about pet insurance options"}
        ],
        "emergency": [
            {"label": "Emergency Vet", "message": "I need an emergency vet NOW"},
            {"label": "Lost Pet", "message": "My pet is lost, please help"},
            {"label": "Poison Help", "message": "My pet may have eaten something toxic"}
        ],
        "shop": [
            {"label": "Treats", "message": "Show me healthy treats for my pet"},
            {"label": "Food", "message": "I'm looking for premium pet food"},
            {"label": "Accessories", "message": "What accessories do you recommend?"}
        ],
        "club": [
            {"label": "Membership", "message": "Tell me about membership benefits"},
            {"label": "Rewards", "message": "How do I redeem my rewards?"},
            {"label": "Upgrade Tier", "message": "I want to upgrade my membership"}
        ],
        "advisory": [
            {"label": "Health Advice", "message": "I have a health question about my pet"},
            {"label": "Nutrition Guide", "message": "What's the best diet for my pet?"},
            {"label": "Behavior Tips", "message": "I need advice about my pet's behavior"}
        ]
    }
    return prompts.get(pillar, prompts["advisory"])

def needs_research(message: str) -> bool:
    """Check if the message requires web research for factual information"""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in RESEARCH_KEYWORDS)

async def perform_web_research(query: str, pet_context: str = "") -> Dict[str, Any]:
    """
    Perform web search for factual queries using Emergent's web search capability.
    Returns sourced information with citations.
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return {"success": False, "error": "No API key configured"}
        
        # Build research prompt
        research_prompt = f"""You are a research assistant. Search the web and provide FACTUAL, SOURCED information about the following query. 

QUERY: {query}
{f"CONTEXT: The user is asking about this in relation to: {pet_context}" if pet_context else ""}

IMPORTANT INSTRUCTIONS:
1. Search for current, verified information from official sources
2. Clearly cite your sources with URLs where possible
3. Separate CONFIRMED FACTS from VARIABLE INFORMATION (things that may change or vary)
4. If information could not be verified, explicitly state "Could not verify"
5. Never fabricate or make assumptions about regulations/rules
6. Include dates of the information if available
7. Mention if policies may have changed or if user should verify

Format your response as:
**CONFIRMED FACTS:**
- [fact 1] (Source: URL or organization name)
- [fact 2] (Source: URL or organization name)

**VARIABLE/MAY CHANGE:**
- [item that varies or may change]

**RECOMMENDED NEXT STEPS:**
- [action item 1]
- [action item 2]

**SOURCES CONSULTED:**
- [source 1]
- [source 2]
"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mira-research-{uuid.uuid4()}",
            system_message="You are a factual research assistant. You must search the web and provide accurate, sourced information. Never fabricate facts."
        )
        chat.with_model("openai", "gpt-5.1")
        
        # The LLM will use its capabilities to provide researched information
        response = await chat.send_message(UserMessage(text=research_prompt))
        
        return {
            "success": True,
            "research_result": response,
            "query": query
        }
        
    except Exception as e:
        logger.error(f"Web research error: {e}")
        return {
            "success": False,
            "error": str(e),
            "query": query
        }

# ============== API ROUTES ==============

@router.post("/chat")
async def mira_chat(
    request: MiraChatRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Main Mira chat endpoint.
    Every interaction creates or updates a ticket.
    """
    db = get_db()
    
    session_id = request.session_id or str(uuid.uuid4())
    user_message = request.message.strip()
    
    # 1. Get user and pets context
    user = await get_user_from_token(authorization)
    pets = []
    selected_pet = None
    
    if user:
        pets = await load_user_pets(user.get("email"), user.get("user_id"))
        
        # If specific pet selected, load full Pet Soul
        if request.selected_pet_id:
            for p in pets:
                if p.get("id") == request.selected_pet_id or p.get("name") == request.selected_pet_id:
                    selected_pet = await load_pet_soul(p.get("id") or p.get("name"))
                    break
        elif len(pets) == 1:
            # Auto-select if only one pet
            selected_pet = await load_pet_soul(pets[0].get("id") or pets[0].get("name"))
    
    # 2. Detect pillar and urgency
    pillar = detect_pillar(user_message, request.current_pillar)
    urgency = detect_urgency(user_message, pillar)
    intent = detect_intent(user_message)
    
    # 3. Check if ticket exists for this session
    existing_ticket = await db.mira_tickets.find_one({"mira_session_id": session_id}, {"_id": 0})
    ticket_id = None
    
    if not existing_ticket:
        # Create new ticket
        ticket_id = await create_mira_ticket(
            session_id=session_id,
            ticket_type=intent,
            pillar=pillar,
            urgency=urgency,
            description=user_message,
            user=user,
            pet=selected_pet,
            source=request.source
        )
    else:
        ticket_id = existing_ticket.get("ticket_id")
        
        # Update ticket if pillar or urgency changed
        updates = {}
        if pillar != existing_ticket.get("pillar"):
            updates["pillar"] = pillar
            updates["ai_context.pillar_detected"] = pillar
        if urgency != existing_ticket.get("urgency"):
            updates["urgency"] = urgency
            updates["ai_context.urgency_detected"] = urgency
        
        if updates:
            await update_mira_ticket(session_id, updates)
        
        # Check if we should upgrade ticket type
        if intent == "concierge" and existing_ticket.get("ticket_type") == "advisory":
            await upgrade_ticket_type(session_id, "concierge")
    
    # Add user message to ticket
    await add_message_to_ticket(session_id, {
        "type": "user_message",
        "content": user_message,
        "sender": "member",
        "sender_name": user.get("name") if user else "Guest",
        "channel": request.source,
        "is_internal": False
    })
    
    # 4. Handle EMERGENCY immediately
    if pillar == "emergency":
        emergency_response = """**EMERGENCY DETECTED**

I understand this is urgent. Let me help you immediately.

**Immediate Actions:**
- 📞 **Call Emergency Vet**: +91-XXXX-XXXX
- 💬 **WhatsApp Help**: [Click to Connect](https://wa.me/919663185747?text=EMERGENCY)
- 📍 **Share Location**: For nearest emergency services

**What's happening?** Please tell me briefly so I can alert our emergency response team.

*Our live team has been alerted and will reach out within minutes.*"""
        
        # Add AI response to ticket
        await add_message_to_ticket(session_id, {
            "type": "mira_response",
            "content": emergency_response,
            "sender": "mira",
            "channel": request.source,
            "is_internal": False
        })
        
        # Update ticket status
        await update_mira_ticket(session_id, {
            "status": "immediate_action",
            "urgency": "critical"
        })
        
        return {
            "response": emergency_response,
            "session_id": session_id,
            "ticket_id": ticket_id,
            "pillar": pillar,
            "ticket_type": "emergency",
            "is_emergency": True
        }
    
    # 5. Check if this needs RESEARCH MODE
    research_context = None
    if needs_research(user_message):
        logger.info(f"Research mode activated for: {user_message[:50]}...")
        pet_context = ""
        if selected_pet:
            pet_context = f"traveling with a {selected_pet.get('breed', 'dog')} named {selected_pet.get('name', 'pet')}"
        research_result = await perform_web_research(user_message, pet_context)
        if research_result.get("success"):
            research_context = research_result.get("research_result")
    
    # 6. Load RELATIONSHIP MEMORY (Store forever, surface selectively)
    relationship_memory_prompt = ""
    member_id = user.get("email") or user.get("id") if user else None
    
    if member_id:
        try:
            from mira_memory import MiraMemory, format_memories_for_prompt
            
            # Get contextually relevant memories
            relevant_memories = await MiraMemory.get_relevant_memories(
                member_id=member_id,
                current_context=user_message,
                pet_id=selected_pet.get("id") if selected_pet else None,
                limit=5
            )
            
            if relevant_memories:
                relationship_memory_prompt = format_memories_for_prompt(relevant_memories)
                # Mark memories as surfaced
                for mem in relevant_memories:
                    await MiraMemory.surface_memory(mem.get("memory_id"))
                logger.info(f"Surfacing {len(relevant_memories)} relationship memories for {member_id}")
        except ImportError:
            logger.warning("Relationship memory module not available")
        except Exception as e:
            logger.warning(f"Error loading relationship memories: {e}")
    
    # 6.5 DETECT CONCIERGE ACTION NEEDED & CREATE SERVICE DESK TICKET
    concierge_action = detect_concierge_action_needed(user_message, pillar)
    service_desk_ticket_id = None
    
    if concierge_action.get("action_needed"):
        # Create service desk ticket for human concierge
        service_desk_ticket_id = await create_service_desk_ticket(
            session_id=session_id,
            user=user,
            pets=pets,
            message=user_message,
            action_details=concierge_action,
            pillar=pillar
        )
        logger.info(f"Concierge action detected: {concierge_action.get('action_type')} | Service Desk Ticket: {service_desk_ticket_id}")
        
        # Update Pet Soul with travel/dining preferences
        if member_id:
            await update_pet_soul_travel_dining(pets, user_message, pillar, member_id)
    
    # 7. Build prompt and call LLM
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not configured")
            return {
                "response": "I'm having a moment of pause. Please try again shortly.",
                "session_id": session_id,
                "ticket_id": ticket_id,
                "error": "llm_config"
            }
        
        system_prompt = build_mira_system_prompt(user, pets, pillar, selected_pet)
        
        # Build conversation history
        history_text = ""
        if request.history:
            history_text = "\n\nCONVERSATION HISTORY:\n"
            for msg in request.history[-15:]:  # Last 15 messages
                role = msg.get("role", "unknown").upper()
                content = msg.get("content", "")
                history_text += f"{role}: {content}\n"
        
        # Cross-pillar context handling
        cross_pillar_note = ""
        if request.previous_pillar and request.previous_pillar != pillar:
            prev_pillar_name = PILLARS.get(request.previous_pillar, {}).get("name", request.previous_pillar)
            curr_pillar_name = PILLARS.get(pillar, {}).get("name", pillar)
            cross_pillar_note = f"""
CROSS-PILLAR CONTEXT: The user has moved from {prev_pillar_name} to {curr_pillar_name}. 
Acknowledge this transition warmly. Example: "I see you've moved from {prev_pillar_name} to {curr_pillar_name}. Let me help you with your {curr_pillar_name} needs now."
Carry forward any relevant context from the previous conversation.
"""
        
        # Research mode integration
        research_instruction = ""
        if research_context:
            research_instruction = f"""
RESEARCH MODE ACTIVE - FACTUAL QUERY DETECTED:
I have researched the following verified information. Use this to respond:

{research_context}

CRITICAL RULES FOR RESEARCH RESPONSES:
1. Clearly separate CONFIRMED FACTS from VARIABLE ITEMS
2. Cite sources when available
3. If any fact could not be verified, say "I could not verify this - please confirm directly"
4. Provide concrete next steps the user can take
5. Maintain your warm, concierge tone while being factually precise
6. NEVER fabricate or assume facts about regulations, permissions, or policies
"""
        
        full_prompt = f"""{history_text}
{cross_pillar_note}
{relationship_memory_prompt}
{research_instruction}

CURRENT USER MESSAGE: {user_message}

REMEMBER:
- Never ask for information already in Pet Soul or Relationship Memory
- If you remember something from past conversations, reference it naturally (e.g., "Last time you mentioned...")
- Don't force memories - only surface when genuinely relevant
- Ask ONE question at a time
- Progress the conversation forward
- Keep response concise and warm
- If this is a factual query about rules/regulations, be precise and cite sources"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mira-{session_id}",
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.1")  # Using GPT-5.1 as requested
        # Note: GPT-5.x models only support temperature=1
        
        response = await chat.send_message(UserMessage(text=full_prompt))
        
        # 8. Add AI response to ticket
        await add_message_to_ticket(session_id, {
            "type": "mira_response",
            "content": response,
            "sender": "mira",
            "channel": request.source,
            "is_internal": False,
            "research_mode": research_context is not None
        })
        
        # 9. Check for enrichments to save to Pet Soul (ADVANCED)
        try:
            from soul_intelligence import extract_enrichments_advanced, save_soul_enrichment
            enrichments = extract_enrichments_advanced(user_message, response)
        except ImportError:
            enrichments = extract_enrichments(user_message, response)
        
        if enrichments and selected_pet:
            for enrichment in enrichments:
                await save_pet_soul_enrichment(
                    selected_pet.get("id"),
                    {**enrichment, "session_id": session_id},
                    source=enrichment.get("source", "user-stated")
                )
        
        # 10. Extract and store RELATIONSHIP MEMORIES
        if member_id:
            try:
                from mira_memory import MemoryExtractor, MiraMemory
                
                extracted_memories = await MemoryExtractor.extract_memories_from_conversation(
                    user_message=user_message,
                    ai_response=response,
                    member_id=member_id,
                    pet_id=selected_pet.get("id") if selected_pet else None,
                    pet_name=selected_pet.get("name") if selected_pet else None,
                    session_id=session_id
                )
                
                for memory in extracted_memories:
                    await MiraMemory.store_memory(
                        member_id=member_id,
                        memory_type=memory["memory_type"],
                        content=memory["content"],
                        pet_id=selected_pet.get("id") if selected_pet else None,
                        pet_name=selected_pet.get("name") if selected_pet else None,
                        context=memory.get("context"),
                        relevance_tags=memory.get("relevance_tags", []),
                        source=memory.get("source", "conversation"),
                        confidence=memory.get("confidence", "medium"),
                        session_id=session_id
                    )
                
                if extracted_memories:
                    logger.info(f"Stored {len(extracted_memories)} new relationship memories for {member_id}")
            except ImportError:
                pass  # Memory module not available
            except Exception as e:
                logger.warning(f"Error storing relationship memories: {e}")
        
        # 11. Return response with additional metadata
        return {
            "response": response,
            "session_id": session_id,
            "ticket_id": ticket_id,
            "pillar": pillar,
            "ticket_type": intent,
            "pets": [{"id": p.get("id"), "name": p.get("name")} for p in pets] if pets else [],
            "selected_pet": selected_pet.get("name") if selected_pet else None,
            "research_mode": research_context is not None,
            "quick_prompts": get_pillar_quick_prompts(pillar)
        }
        
    except Exception as e:
        logger.error(f"Mira chat error: {e}", exc_info=True)
        return {
            "response": "I apologize for the brief pause. Could you please repeat that?",
            "session_id": session_id,
            "ticket_id": ticket_id,
            "error": str(e)
        }

@router.get("/session/{session_id}")
async def get_mira_session(session_id: str):
    """Get full session data including ticket info"""
    db = get_db()
    
    ticket = await db.mira_tickets.find_one({"mira_session_id": session_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "ticket": ticket
    }

@router.post("/session/new")
async def create_new_session(
    authorization: Optional[str] = Header(None)
):
    """
    Create a new Mira conversation session.
    Used when user wants to start fresh.
    """
    new_session_id = f"mira-{uuid.uuid4()}"
    
    user = await get_user_from_token(authorization)
    user_info = None
    if user:
        user_info = {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email")
        }
    
    return {
        "session_id": new_session_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user": user_info,
        "message": "New conversation started. How may I assist you today?"
    }

@router.get("/history")
async def get_chat_history(
    limit: int = 10,
    authorization: Optional[str] = Header(None)
):
    """
    Get user's previous Mira conversation history.
    Returns list of recent sessions with summaries.
    """
    db = get_db()
    user = await get_user_from_token(authorization)
    
    if not user:
        return {"sessions": [], "message": "Sign in to view conversation history"}
    
    user_email = user.get("email")
    
    # Find recent tickets for this user
    tickets = await db.mira_tickets.find(
        {"member.email": user_email},
        {"_id": 0, "mira_session_id": 1, "ticket_id": 1, "pillar": 1, "created_at": 1, "messages": 1}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    sessions = []
    for ticket in tickets:
        # Get first user message as summary
        first_message = ""
        for msg in ticket.get("messages", []):
            if msg.get("sender") == "member":
                first_message = msg.get("content", "")[:100]
                break
        
        sessions.append({
            "session_id": ticket.get("mira_session_id"),
            "ticket_id": ticket.get("ticket_id"),
            "pillar": ticket.get("pillar"),
            "created_at": ticket.get("created_at"),
            "preview": first_message,
            "message_count": len(ticket.get("messages", []))
        })
    
    return {"sessions": sessions}

@router.get("/quick-prompts/{pillar}")
async def get_quick_prompts(pillar: str):
    """
    Get pillar-specific quick action prompts.
    Used by frontend to show context-aware suggestions.
    """
    prompts = get_pillar_quick_prompts(pillar)
    pillar_info = PILLARS.get(pillar, PILLARS.get("advisory"))
    
    return {
        "pillar": pillar,
        "pillar_name": pillar_info.get("name", pillar.title()),
        "pillar_icon": pillar_info.get("icon", "📋"),
        "prompts": prompts
    }

@router.get("/tickets")
async def list_mira_tickets(
    status: Optional[str] = None,
    pillar: Optional[str] = None,
    ticket_type: Optional[str] = None,
    limit: int = 50
):
    """List all Mira tickets for admin"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if pillar:
        query["pillar"] = pillar
    if ticket_type:
        query["ticket_type"] = ticket_type
    
    tickets = await db.mira_tickets.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"tickets": tickets, "total": len(tickets)}

class MiraContextRequest(BaseModel):
    current_pillar: Optional[str] = None
    pet_id: Optional[str] = None

@router.post("/context")
async def get_mira_context(
    request: MiraContextRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Get contextual Mira data for pillar pages.
    Returns personalized suggestions based on Pet Soul.
    """
    current_pillar = request.current_pillar
    pet_id = request.pet_id
    
    user = await get_user_from_token(authorization)
    
    response = {
        "user": None,
        "pets": [],
        "selected_pet": None,
        "suggestions": [],
        "pillar_note": None
    }
    
    if not user:
        response["pillar_note"] = "Sign in to get personalized recommendations for your pet."
        return response
    
    pets = await load_user_pets(user.get("email"), user.get("user_id"))
    response["user"] = {"name": user.get("name"), "tier": user.get("membership_tier")}
    response["pets"] = [{"id": p.get("id"), "name": p.get("name"), "breed": p.get("breed")} for p in pets]
    
    # Load selected pet's soul
    if pet_id:
        pet_soul = await load_pet_soul(pet_id)
        response["selected_pet"] = pet_soul
    elif len(pets) >= 1:
        # Auto-select first pet if none specified
        pet_soul = await load_pet_soul(pets[0].get("id") or pets[0].get("name"))
        response["selected_pet"] = pet_soul
    
    # Generate pillar-specific note
    if current_pillar and response["selected_pet"]:
        pet = response["selected_pet"]
        pet_name = pet.get("name", "your pet")
        
        pillar_notes = {
            "travel": f"I see you're planning travel with **{pet_name}**. Based on their profile, I can help arrange pet-friendly transport.",
            "stay": f"Looking for a stay with **{pet_name}**? I'll find options that suit their needs.",
            "care": f"Need care services for **{pet_name}**? I can help book grooming or vet visits.",
            "dine": f"Planning to dine with **{pet_name}**? Let me find pet-friendly restaurants nearby.",
            "celebrate": f"Want to celebrate with **{pet_name}**? I can help arrange the perfect cake and treats.",
            "enjoy": f"Looking for activities for **{pet_name}**? I can find events and experiences they'll love."
        }
        
        response["pillar_note"] = pillar_notes.get(current_pillar, f"How can I help you with **{pet_name}** today?")
    
    # Get product suggestions based on pillar and pet
    if current_pillar and response["selected_pet"]:
        suggestions = await get_pillar_suggestions(current_pillar, response["selected_pet"])
        response["suggestions"] = suggestions
    
    return response

async def get_pillar_suggestions(pillar: str, pet: Dict) -> List[Dict]:
    """Get contextual product/service suggestions based on pillar and pet"""
    db = get_db()
    
    suggestions = []
    pet_name = pet.get("name", "your pet")
    
    # Map pillars to product categories
    pillar_products = {
        "travel": ["travel-essentials", "carriers", "travel-kit"],
        "stay": ["boarding-essentials", "comfort-items"],
        "care": ["grooming", "wellness", "supplements"],
        "celebrate": ["cakes", "treats", "party-supplies"],
        "dine": ["dining-accessories", "travel-bowls"],
        "shop": ["bestsellers", "new-arrivals"]
    }
    
    categories = pillar_products.get(pillar, [])
    
    if categories:
        # Fetch relevant products
        products = await db.products.find(
            {"category": {"$in": categories}, "available": True},
            {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1}
        ).limit(3).to_list(3)
        
        for product in products:
            suggestions.append({
                "type": "product",
                "id": product.get("id"),
                "name": product.get("name"),
                "price": product.get("price"),
                "image": product.get("image"),
                "reason": f"Recommended for {pet_name}"
            })
    
    return suggestions

def extract_enrichments(user_message: str, ai_response: str) -> List[Dict]:
    """Extract Pet Soul enrichments from conversation"""
    enrichments = []
    message_lower = user_message.lower()
    
    # Allergies
    allergy_keywords = ["allergic to", "can't eat", "allergy", "sensitive to"]
    for kw in allergy_keywords:
        if kw in message_lower:
            enrichments.append({
                "field": "allergies",
                "value": user_message,
                "confidence": "high"
            })
            break
    
    # Anxiety triggers
    anxiety_keywords = ["scared of", "afraid of", "anxious", "nervous about", "hates"]
    for kw in anxiety_keywords:
        if kw in message_lower:
            enrichments.append({
                "field": "anxiety_triggers",
                "value": user_message,
                "confidence": "high"
            })
            break
    
    # Preferences
    pref_keywords = ["loves", "prefers", "favorite", "only eats", "likes"]
    for kw in pref_keywords:
        if kw in message_lower:
            enrichments.append({
                "field": "preferences",
                "value": user_message,
                "confidence": "high"
            })
            break
    
    # Travel style
    travel_keywords = ["travels by", "prefer car", "crate trained", "hates car"]
    for kw in travel_keywords:
        if kw in message_lower:
            enrichments.append({
                "field": "travel_style",
                "value": user_message,
                "confidence": "high"
            })
            break
    
    return enrichments

@router.get("/pillars")
async def get_pillars():
    """Get all pillars with their configuration"""
    return {"pillars": PILLARS}

@router.get("/stats")
async def get_mira_stats():
    """Get Mira conversation statistics"""
    db = get_db()
    
    total = await db.mira_tickets.count_documents({})
    by_type = {
        "advisory": await db.mira_tickets.count_documents({"ticket_type": "advisory"}),
        "concierge": await db.mira_tickets.count_documents({"ticket_type": "concierge"}),
        "emergency": await db.mira_tickets.count_documents({"ticket_type": "emergency"})
    }
    by_pillar = {}
    for pillar_id in PILLARS.keys():
        by_pillar[pillar_id] = await db.mira_tickets.count_documents({"pillar": pillar_id})
    
    return {
        "total_conversations": total,
        "by_type": by_type,
        "by_pillar": by_pillar
    }
