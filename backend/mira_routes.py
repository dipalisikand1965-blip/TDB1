"""
Mira AI - The Doggy Company's Universal Concierge System
=========================================================
This is the soul of the Pet Life Operating System.
Every interaction creates a ticket. No conversation goes untracked.
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
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira", tags=["mira"])
security_bearer = HTTPBearer(auto_error=False)

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
        "name": pet.get("name"),
        "breed": pet.get("identity", {}).get("breed") or pet.get("breed"),
        "age": pet.get("identity", {}).get("age") or pet.get("age"),
        "weight": pet.get("identity", {}).get("weight"),
        "size": pet.get("identity", {}).get("size"),
        "gender": pet.get("identity", {}).get("gender"),
        "allergies": pet.get("health", {}).get("allergies", []),
        "medical_conditions": pet.get("health", {}).get("medical_conditions", []),
        "dietary_restrictions": pet.get("health", {}).get("dietary_restrictions", []),
        "favorite_treats": pet.get("preferences", {}).get("favorite_treats", []),
        "dislikes": pet.get("preferences", {}).get("dislikes", []),
        "anxiety_triggers": pet.get("personality", {}).get("anxiety_triggers", []),
        "behavior_with_dogs": pet.get("personality", {}).get("behavior_with_dogs"),
        "behavior_with_humans": pet.get("personality", {}).get("behavior_with_humans"),
        "handling_sensitivity": pet.get("care", {}).get("handling_sensitivity"),
        "grooming_notes": pet.get("care", {}).get("grooming_notes"),
        "travel_style": pet.get("travel", {}).get("preferred_mode"),
        "crate_trained": pet.get("travel", {}).get("crate_trained"),
        "photo_url": pet.get("photo_url"),
        "persona": pet.get("soul", {}).get("persona"),
        # Doggy Soul answers
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

def build_mira_system_prompt(user: Dict = None, pets: List[Dict] = None, pillar: str = None) -> str:
    """Build the comprehensive Mira system prompt"""
    
    # Pet context section
    pet_context = ""
    if pets and len(pets) > 0:
        pet_context = "\n\n🐾 **MEMBER'S PET PROFILES (PET SOUL DATA)**:\n"
        for pet in pets:
            pet_context += f"""
**{pet.get('name', 'Pet')}**
- Breed: {pet.get('breed') or pet.get('identity', {}).get('breed', 'Not specified')}
- Age: {pet.get('age') or pet.get('identity', {}).get('age', 'Not specified')}
- Weight: {pet.get('identity', {}).get('weight', 'Not specified')}
"""
            # Add health info
            health = pet.get('health', {})
            if health.get('allergies'):
                pet_context += f"- Allergies: {', '.join(health['allergies'])}\n"
            if health.get('medical_conditions'):
                pet_context += f"- Medical Conditions: {', '.join(health['medical_conditions'])}\n"
            
            # Add preferences
            prefs = pet.get('preferences', {})
            if prefs.get('favorite_treats'):
                pet_context += f"- Favorite Treats: {', '.join(prefs['favorite_treats'])}\n"
            
            # Add personality
            personality = pet.get('personality', {})
            if personality.get('anxiety_triggers'):
                pet_context += f"- Anxiety Triggers: {', '.join(personality['anxiety_triggers'])}\n"
            
            # Add travel info
            travel = pet.get('travel', {})
            if travel.get('preferred_mode'):
                pet_context += f"- Travel Style: {travel['preferred_mode']}\n"
            if travel.get('crate_trained') is not None:
                pet_context += f"- Crate Trained: {'Yes' if travel['crate_trained'] else 'No'}\n"
            
            pet_context += "\n"
    
    # User context section
    user_context = ""
    if user:
        user_context = f"""
**MEMBER CONTEXT**:
- Name: {user.get('name', 'Valued Guest')}
- Membership: {user.get('membership_tier', 'Free').title()}
"""
    
    # Pillar context
    pillar_context = ""
    if pillar and pillar in PILLARS:
        p = PILLARS[pillar]
        pillar_context = f"\n**CURRENT PILLAR CONTEXT**: {p['icon']} {p['name']}\n"
    
    system_prompt = f"""ROLE & IDENTITY
You are Mira, The Doggy Company's distinguished Concierge — the intelligent front door to the Pet Life Operating System. You are not a chatbot. You are a memory-backed concierge layer that silently learns, remembers, and personalizes every interaction.

You speak with warmth, authority, and the quiet confidence of a trusted advisor who genuinely understands the bond between pet and guardian. You are professional yet personable, knowledgeable yet approachable, helpful yet never intrusive.

{user_context}
{pet_context}
{pillar_context}

THE 12 PILLARS (Your Knowledge Domains):
1. **CELEBRATE** — Birthday cakes, custom treats, celebration packages
2. **DINE** — Pet-friendly restaurants, reservations, dining experiences
3. **STAY** — Pet-friendly hotels, boarding, pawcation properties
4. **TRAVEL** — Pet relocation, travel documentation, transport (cab, train, flight)
5. **CARE** — Veterinary services, grooming, wellness appointments, walking, sitting
6. **SHOP** — Premium pet products, nutrition, supplies
7. **ENJOY** — Events, activities, trails, meetups, experiences
8. **CLUB** — Membership benefits, community access
9. **FIT** — Fitness, weight management, behaviour training
10. **ADVISORY** — Expert consultations, guidance
11. **PAPERWORK** — Documents, certifications, insurance, records
12. **EMERGENCY** — Urgent help, lost pet, accidents (IMMEDIATE PRIORITY)

COMMUNICATION STANDARDS:
- Respond in the guest's language with cultural precision
- Use formal yet warm English
- **Bold** all venue names, cities, dates, times, and key details
- NO emojis in conversation (only 🛎️ for confirmation line)
- Keep responses concise — never verbose or robotic
- ONE question at a time, never bundled
- Never reveal backend processes or technical details

PET-FIRST RULE:
Before responding to any request:
1. Identify which pet the conversation is about
2. If multiple pets exist, ask ONCE: "Which pet is this for?"
3. Lock context to that pet for the session
4. NEVER ask for information already in Pet Soul
5. If information is missing, ask only what is essential

TICKET RULE (CRITICAL):
Every interaction creates a Service Desk ticket. There is no "no-ticket" conversation.
- **Advisory Ticket**: User is exploring/asking questions (Status: Exploring)
- **Concierge Ticket**: User confirms action (Status: Acknowledged → In Progress → Confirmed)
- **Emergency Ticket**: Emergency detected (Status: Immediate Action)

MINIMUM QUESTION LOGIC:
Ask ONLY what you need. For:
- **Travel (Cab)**: Date/time, pickup/drop locations (pet size, anxiety from profile)
- **Stay (Hotel)**: City, dates, adults (pet count, size from profile)
- **Care (Grooming)**: Home or salon, time preference (sensitivity, coat type from profile)
- **Emergency**: NO FORMS — immediate CTAs (Call now, WhatsApp now, Share location)

SERVICE FLOW:
1. **Acknowledge** — Greet warmly, show you know them and their pet
2. **Clarify** — Ask essential questions one at a time (max 5 total)
3. **Curate** — Present verified, personalized options
4. **Enhance** — Suggest relevant products when contextually appropriate
5. **Confirm** — Summarize and obtain consent
6. **Handoff** — Pass to live Concierge team for execution

CONSENT PROTOCOL:
When ready to proceed:
1. Present complete summary with all details
2. Add: "Note: All arrangements subject to partner availability and TDC terms."
3. Request: **🛎️ May I proceed with your request? Please confirm.**

After confirmation: Acknowledge and confirm handoff to live Concierge team.

PROGRESSIVE ENRICHMENT:
If you learn new information during chat, note it for Pet Soul update:
- "He hates nail trims" → Handling sensitivity
- "She gets anxious with loud noises" → Anxiety trigger
- "He prefers chicken treats" → Preference
Only save if explicitly stated or confirmed.

GUARDRAILS:
- NEVER claim a booking is confirmed without ops confirmation
- NEVER fabricate partner availability
- NEVER provide medical diagnosis or prescriptions
- NEVER promise outcomes in emergencies
- NEVER over-collect information
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
        emergency_response = f"""**EMERGENCY DETECTED**

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
    
    # 5. Build prompt and call LLM
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return {
                "response": "I'm having a moment of pause. Please try again shortly.",
                "session_id": session_id,
                "ticket_id": ticket_id,
                "error": "llm_config"
            }
        
        system_prompt = build_mira_system_prompt(user, pets, pillar)
        
        # Build conversation history
        history_text = ""
        if request.history:
            history_text = "\n\nCONVERSATION HISTORY:\n"
            for msg in request.history[-15:]:  # Last 15 messages
                role = msg.get("role", "unknown").upper()
                content = msg.get("content", "")
                history_text += f"{role}: {content}\n"
        
        full_prompt = f"""{history_text}

CURRENT USER MESSAGE: {user_message}

REMEMBER:
- Never ask for information already in Pet Soul
- Ask ONE question at a time
- Progress the conversation forward
- Keep response concise and warm"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mira-{session_id}",
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.1")  # Using GPT-5.1 as requested
        # Note: GPT-5.x models only support temperature=1
        
        response = await chat.send_message(UserMessage(text=full_prompt))
        
        # 6. Add AI response to ticket
        await add_message_to_ticket(session_id, {
            "type": "mira_response",
            "content": response,
            "sender": "mira",
            "channel": request.source,
            "is_internal": False
        })
        
        # 7. Check for enrichments to save to Pet Soul
        enrichments = extract_enrichments(user_message, response)
        if enrichments and selected_pet:
            for enrichment in enrichments:
                await save_pet_soul_enrichment(
                    selected_pet.get("id"),
                    {**enrichment, "session_id": session_id},
                    source="user-stated"
                )
        
        # 8. Return response
        return {
            "response": response,
            "session_id": session_id,
            "ticket_id": ticket_id,
            "pillar": pillar,
            "ticket_type": intent,
            "pets": [{"id": p.get("id"), "name": p.get("name")} for p in pets] if pets else [],
            "selected_pet": selected_pet.get("name") if selected_pet else None
        }
        
    except Exception as e:
        logger.error(f"Mira chat error: {e}")
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

@router.post("/context")
async def get_mira_context(
    authorization: Optional[str] = Header(None),
    current_pillar: Optional[str] = None,
    pet_id: Optional[str] = None
):
    """
    Get contextual Mira data for pillar pages.
    Returns personalized suggestions based on Pet Soul.
    """
    db = get_db()
    
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
