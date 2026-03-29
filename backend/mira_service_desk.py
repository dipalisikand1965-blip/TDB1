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
from breed_normalise import normalise_breed

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


async def generate_ticket_id():
    """Generate a unique ticket ID like TDB-2026-XXXX"""
    db = get_db()
    count = await db.service_desk_tickets.count_documents({})
    return f"TDB-{datetime.now(timezone.utc).year}-{count + 1:04d}"


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
    pet_id: Optional[str] = None
    pillar: str
    intent_primary: str
    intent_secondary: List[str] = []
    life_state: str = "PLAN"
    channel: str = "Mira_OS"
    urgency: str = "medium"
    status: Optional[str] = None
    force_new: bool = False  # ← when True, always creates a new ticket (no dedup)
    initial_message: Optional[InitialMessage] = None
    metadata: Dict[str, Any] = {}  # ← soul_made photo_url, product_name, etc.

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


def generate_mira_briefing(pet: dict, service_name: str, pillar: str, intent: str) -> str:
    """
    Generates a human-readable briefing from the pet's soul profile + Health Vault.
    Prepended to every ticket thread so Concierge can respond immediately.
    Reads: doggy_soul_answers (soul builder) + pet.vault (Health Vault records)
    """
    soul  = pet.get("doggy_soul_answers") or {}
    vault = pet.get("vault") or {}
    name  = pet.get("name", "this dog")
    breed = pet.get("breed", "Mixed breed")
    soul_score = pet.get("overall_score") or pet.get("soul_score") or 0

    # ── Age stage ────────────────────────────────────────────────────
    age_map = {"puppy":"Puppy (under 1yr)","young":"Young (1–3yr)","adult":"Adult (3–7yr)","senior":"Senior (7+yr)"}
    age_label = age_map.get(soul.get("age_stage",""), soul.get("age_stage","Age unknown"))

    # ── Allergies — vault overrides soul (vet-confirmed = ground truth) ──
    vault_allergies = [a.get("name") for a in vault.get("allergies",[]) if a.get("name")]
    soul_allergies  = soul.get("food_allergies",[])
    allergies = vault_allergies or (soul_allergies if isinstance(soul_allergies,list) else [soul_allergies] if soul_allergies else [])
    allergies = [a for a in allergies if a and a.lower() not in ["none","none known","no"]]
    allergy_line = (f"⚠️ CONFIRMED ALLERGIES: {', '.join(a.title() for a in allergies)} — NEVER suggest these"
                    if allergies else "No known food allergies")

    # ── Health conditions ─────────────────────────────────────────────
    conditions = [c for c in (soul.get("health_conditions",[]) or []) if c not in ["none","healthy","all_healthy"]]
    health_line = ", ".join(c.replace("_"," ").title() for c in conditions) if conditions else "No known conditions"

    # ── Active medications from vault ─────────────────────────────────
    active_meds = [m for m in vault.get("medications",[]) if m.get("active",True)]
    meds_line   = ", ".join(f"{m['medication_name']} {m.get('dosage','')}" for m in active_meds[:3]) if active_meds else "None"

    # ── Upcoming vaccines from vault ──────────────────────────────────
    from datetime import date as _date
    today_iso = _date.today().isoformat()
    upcoming_vax = [v["vaccine_name"] for v in vault.get("vaccines",[]) if v.get("next_due_date") and v["next_due_date"] >= today_iso]
    vax_line = ", ".join(upcoming_vax[:3]) if upcoming_vax else f"{len(vault.get('vaccines',[]))} on file" if vault.get("vaccines") else "None recorded"

    # ── Primary vet from vault ────────────────────────────────────────
    vets = vault.get("vets",[])
    pvet = next((v for v in vets if v.get("is_primary")), vets[0] if vets else None)
    vet_line = f"{pvet['name']} — {pvet.get('clinic_name','')} {pvet.get('phone','')}" if pvet else "Not saved"

    # ── Last vet visit from vault ─────────────────────────────────────
    visits = vault.get("visits",[])
    last_visit_line = f"{visits[-1].get('reason','visit')} ({visits[-1].get('visit_date','')[:10]})" if visits else "None recorded"

    # ── Current weight ────────────────────────────────────────────────
    wh = vault.get("weight_history",[])
    weight_line = f"{wh[-1].get('weight_kg')}kg (logged {wh[-1].get('date','')[:10]})" if wh else (
        f"{pet.get('current_weight_kg')}kg" if pet.get("current_weight_kg") else "Not recorded")

    # ── Soul profile fields ───────────────────────────────────────────
    diet_map  = {"dry":"Dry kibble","wet":"Wet food","fresh":"Fresh/cooked","raw":"Raw diet","mixed":"Mixed","homemade":"Home cooked"}
    diet      = diet_map.get(soul.get("diet_type",""), soul.get("diet_type","Not specified"))
    energy_map= {"couch":"Low energy","moderate":"Moderate","active":"Active & playful","intense":"Very high energy"}
    energy    = energy_map.get(soul.get("energy_level",""), soul.get("energy_level","Not specified"))
    personality = soul.get("personality",[]) or []
    personality_str = ", ".join(p.replace("_"," ").title() for p in personality) if personality else soul.get("personality_primary","Not specified")
    training_map={"none":"Just starting","basic":"Basic commands","good":"Well trained","advanced":"Advanced"}
    training  = training_map.get(soul.get("training_level",""), soul.get("training_level","Not specified"))
    home_map  = {"apartment":"Apartment","house_small":"House/small garden","house_large":"House/large yard","farm":"Farm"}
    home      = home_map.get(soul.get("home_type",""), soul.get("home_type","Not specified"))
    fears     = [f.replace("_"," ").title() for f in (soul.get("anxiety_triggers",[]) or []) if f not in ["none","no_fears"]]
    fears_str = ", ".join(fears) if fears else "No known fears"
    activities= soul.get("favourite_activities",[]) or []
    activities_str = ", ".join(a.replace("_"," ").title() for a in activities) if activities else "Not specified"

    score_note = ("Profile comprehensive — Mira knows this dog well." if soul_score >= 80
                  else "Profile partial — some details may be missing." if soul_score >= 50
                  else "Profile early — ask parent for more details.")

    # ── Pillar-specific answered soul questions ───────────────────────
    PILLAR_SOUL_KEYS = {
        "care":      ["coat_type","groom_frequency","grooming_tolerance","bathing_frequency","vet_comfort","sensitive_skin","vaccination_status","vaccinated","has_regular_vet"],
        "dine":      ["diet_type","food_allergies","sensitive_stomach","prefers_grain_free","treat_preference","meal_frequency","meal_amount","raw_food_comfort","water_intake"],
        "learn":     ["training_level","training_goals","commands_known","attention_span","learning_style","reward_preference","socialization_level"],
        "go":        ["travel_comfort","car_comfort","travel_frequency","longest_trip","travel_docs_ready","microchipped","neutered"],
        "play":      ["energy_level","exercise_frequency","exercise_type","play_style","toy_preference","outdoor_vs_indoor","dog_park_comfort","favourite_activities"],
        "celebrate": ["birthday","favourite_treats","celebration_style","party_preference","social_comfort"],
        "emergency": ["health_conditions","vet_comfort","emergency_vet","has_regular_vet","microchipped","blood_type"],
        "farewell":  ["farewell_type_preference","farewell_location","spiritual_beliefs","cremation_vs_burial"],
        "paperwork": ["microchipped","neutered","travel_docs_ready","insurance_status","registered_breed"],
        "adopt":     ["home_type","other_pets","children_at_home","lifestyle","first_time_owner","breed_preference"],
        "shop":      ["size_category","coat_type","brand_preference","budget_range","online_vs_instore"],
        "services":  ["service_preferences","grooming_tolerance","vet_comfort","budget_range"],
    }
    pillar_keys = PILLAR_SOUL_KEYS.get(pillar, [])
    pillar_answered = [(k.replace("_"," ").title(), str(soul[k]).replace("_"," ").title())
                       for k in pillar_keys if soul.get(k) and soul[k] not in ["", "none", "not_sure", None]]
    pillar_intel = "\n".join(f"  {label}: {val}" for label, val in pillar_answered) if pillar_answered else "  No pillar-specific answers yet."

    # ── Pillar guidance ───────────────────────────────────────────────
    pillar_context = {
        "care":     f"Care/wellness request for {name}. ⚠️ Check coat type and grooming tolerance. Primary vet: {vet_line}",
        "dine":     f"Food/nutrition request for {name}. ⚠️ CRITICAL: CHECK ALLERGIES ABOVE before any food suggestion.",
        "celebrate":f"Celebration request for {name}. Check birthday and favourite treats above.",
        "go":       f"Travel/stay request for {name}. Check microchip/travel docs status below.",
        "play":     f"Play/fitness request for {name}. High energy dog may need intensive activity.",
        "learn":    f"Training request for {name}. Check current training level and goals.",
        "shop":     f"Product request for {name}. Check breed, size and any allergens above.",
        "emergency":f"⚠️ EMERGENCY for {name}. Respond immediately. Primary vet: {vet_line}",
        "farewell": f"🌷 Farewell request for {name}. Handle with utmost care and compassion.",
        "paperwork":f"Paperwork/docs request for {name}. Check microchip and insurance below.",
        "adopt":    f"Adoption enquiry. Check home type and lifestyle below.",
        "services": f"General service request for {name}. Review full profile.",
    }.get(pillar, f"Request from {pillar} pillar for {name}.")

    briefing = f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ MIRA'S BRIEFING FOR CONCIERGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVICE REQUESTED: {service_name}
PILLAR: {pillar.title()} · Soul Score: {soul_score}%

━━━ ABOUT {name.upper()} ━━━
Breed:        {breed}
Life stage:   {age_label}
Soul score:   {soul_score}% ({score_note})
Weight:       {weight_line}
Home:         {home}

━━━ ⚠️ HEALTH & SAFETY (READ FIRST) ━━━
{allergy_line}
Health:       {health_line}
Active meds:  {meds_line}
Vaccines:     {vax_line}
Primary vet:  {vet_line}
Last visit:   {last_visit_line}

━━━ DIET & DAILY LIFE ━━━
Diet:         {diet}
Energy:       {energy}
Activities:   {activities_str}
Fears:        {fears_str}
Training:     {training}
Personality:  {personality_str}

━━━ {pillar.upper()} PILLAR INTEL ━━━
{pillar_intel}

━━━ CONCIERGE GUIDANCE ━━━
{pillar_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auto-generated by Mira from {name}'s Soul Profile + Health Vault.
The parent has not seen this message.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""

    return briefing


# ── Enriched ticket creation ───────────────────────────────────────────

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
    
    # Check for existing ticket — SKIP if force_new=True (always create fresh ticket)
    existing_ticket = None
    if not request.force_new:
        existing_ticket = await find_existing_ticket(
            request.parent_id,
            request.pet_id,
            request.pillar
        )
    
    if existing_ticket:
        # Attach to existing ticket
        ticket_id = existing_ticket.get("ticket_id")
        
        # Add the initial message to the conversation (if provided)
        if request.initial_message:
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
        pet_doc = await db.pets.find_one(
            {"id": request.pet_id},
            {"name":1,"breed":1,"doggy_soul_answers":1,"overall_score":1,"soul_score":1,
             "city":1,"vault":1,"owner_email":1,"owner_phone":1,"current_weight_kg":1}
        )
        if pet_doc:
            pet_name = pet_doc.get("name","")
    subject = f"{service_name} for {pet_name}" if pet_name else f"{service_name} — {request.pillar.title()} Request"

    # ── Look up parent identity ──────────────────────────────────────
    member_obj = {"name": "Pet Parent", "id": request.parent_id or ""}
    try:
        if request.parent_id and request.parent_id not in ("anonymous", "guest", ""):
            user_doc = None
            if "@" in request.parent_id:
                user_doc = await db.users.find_one(
                    {"email": request.parent_id.lower()},
                    {"_id":0,"name":1,"first_name":1,"email":1,"phone":1,"mobile":1,"whatsapp":1,"id":1}
                )
            if not user_doc:
                user_doc = await db.users.find_one(
                    {"$or": [{"id": request.parent_id}, {"user_id": request.parent_id}]},
                    {"_id":0,"name":1,"first_name":1,"email":1,"phone":1,"mobile":1,"whatsapp":1,"id":1}
                )
            if user_doc:
                full_name = user_doc.get("name") or ""
                first_name = user_doc.get("first_name") or (full_name.split()[0] if full_name else "")
                member_obj = {
                    "name":  full_name or "Pet Parent",
                    "first_name": first_name or "there",
                    "email": user_doc.get("email", ""),
                    "phone": user_doc.get("phone") or user_doc.get("mobile") or user_doc.get("whatsapp",""),
                    "id":    user_doc.get("id") or request.parent_id,
                }
        elif pet_doc and pet_doc.get("owner_email"):
            user_doc = await db.users.find_one(
                {"email": pet_doc["owner_email"].lower()},
                {"_id":0,"name":1,"first_name":1,"email":1,"phone":1,"mobile":1}
            )
            if user_doc:
                member_obj = {
                    "name":  user_doc.get("name","Pet Parent"),
                    "first_name": user_doc.get("first_name") or (user_doc.get("name","").split()[0] or "there"),
                    "email": user_doc.get("email",""),
                    "phone": user_doc.get("phone") or user_doc.get("mobile",""),
                    "id":    request.parent_id or pet_doc["owner_email"],
                }
    except Exception as _e:
        logger.warning(f"[SERVICE_DESK] Could not resolve parent identity: {_e}")

    # ── Generate Mira briefing from soul profile + vault ─────────────
    mira_briefing = ""
    if request.pet_id and pet_doc:
        mira_briefing = generate_mira_briefing(pet_doc, service_name, request.pillar, request.intent_primary or "concierge_request")

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
    if request.initial_message:
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
        "member": member_obj,
        "user_name": member_obj.get("name"),
        "user_email": member_obj.get("email") or (request.parent_id if "@" in (request.parent_id or "") else None),
        "user_phone": member_obj.get("phone"),
        "pet_id": request.pet_id,
        "pet_name": pet_name,
        "pet_breed": normalise_breed(pet_doc.get("breed")) if pet_doc else "indie",
        "pillar": request.pillar,
        "intent_primary": request.intent_primary,
        "intent_secondary": request.intent_secondary,
        "life_state": request.life_state,
        "channel": request.channel,
        "metadata": request.metadata or {},
        "photo_url":     (request.metadata or {}).get("photo_url", ""),
        "soul_made":     (request.metadata or {}).get("soul_made", False),
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

    # If a soul_made photo was uploaded, append it as a visible image message
    soul_photo_url = (request.metadata or {}).get("photo_url")
    if soul_photo_url:
        ticket_doc["conversation"].append({
            "sender": "parent",
            "source": request.channel,
            "text": f"📸 Pet photo uploaded: {soul_photo_url}",
            "image_url": soul_photo_url,
            "timestamp": now.isoformat(),
            "is_soul_made_photo": True,
        })
    
    await db.mira_conversations.insert_one(ticket_doc)

    # ── ALSO write to service_desk_tickets (admin inbox collection) ──────
    admin_ticket = {
        "id":            ticket_id,
        "ticket_id":     ticket_id,
        "type":          request.intent_primary or "service_booking",
        "intent_primary": request.intent_primary or "service_booking",
        "category":      request.pillar,
        "sub_category":  service_name.lower().replace(" ","_"),
        "subject":       subject,
        "description":   (f"{mira_briefing}\n\n{request.initial_message.text}" if mira_briefing else (request.initial_message.text if request.initial_message else "")) if request.initial_message else (mira_briefing or ""),
        "status":        "urgent" if request.urgency in ("emergency", "urgent") else "open",
        "priority":      request.urgency or "normal",
        "urgency":       request.urgency or "low",
        "channel":       request.channel,
        "pillar":        request.pillar,
        "pet_id":        request.pet_id,
        "pet_name":      pet_name,
        "pet_breed":     normalise_breed(pet_doc.get("breed")) if pet_doc else "indie",
        "parent_id":     request.parent_id,
        "member":        member_obj,
        "user_name":     member_obj.get("name"),
        "user_email":    member_obj.get("email") or (request.parent_id if "@" in (request.parent_id or "") else None),
        "user_phone":    member_obj.get("phone"),
        "mira_briefing": mira_briefing,
        "life_state":    request.life_state,
        "metadata":      request.metadata or {},
        "soul_made_photo": soul_photo_url,
        "photo_url":     (request.metadata or {}).get("photo_url", ""),
        "soul_made":     (request.metadata or {}).get("soul_made", False),
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
    
    # Send WhatsApp + Email confirmation to parent on new ticket
    try:
        import asyncio
        from services.whatsapp_service import send_concierge_request
        from services.email_service import send_concierge_request_email
        ticket_for_notif = {"ticket_id": ticket_id, "subject": subject, "pillar": request.pillar, "id": ticket_id}
        pet_for_notif = {"name": pet_name} if pet_name else None
        asyncio.ensure_future(
            send_concierge_request(member_obj, pet_for_notif, ticket_for_notif)
        )
        if member_obj.get("email"):
            asyncio.ensure_future(
                send_concierge_request_email(member_obj, pet_for_notif, ticket_for_notif)
            )
    except Exception as e:
        logger.warning(f"[SERVICE_DESK] Notification send failed for {ticket_id}: {e}")
    
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

    # ── CRITICAL: Also sync to service_desk_tickets (admin inbox) ──────────
    # Without this, Mira widget conversations are invisible in the Service Desk
    await db.service_desk_tickets.update_one(
        {"ticket_id": request.ticket_id},
        {
            "$push": {"conversation": message_entry},
            "$set": {"updated_at": now.isoformat()}
        }
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
    """Get a ticket by ID with full conversation history. Checks all collections."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check mira_conversations first (concierge/soul-made tickets)
    ticket = await db.mira_conversations.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    # Fall back to service_desk_tickets (shop orders, admin-created tickets)
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    # Fall back to mira_tickets
    if not ticket:
        ticket = await db.mira_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})

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
async def get_tickets_by_queue(queue_name: str, status: str = "open", limit: int = 50):
    """Get tickets in a specific concierge queue from service_desk_tickets."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    # Map queue names to pillar filters
    QUEUE_PILLAR_MAP = {
        "INBOX":    None,  # all pillars
        "CARE":     "care",
        "DINE":     "dine",
        "GO":       "go",
        "PLAY":     "play",
        "LEARN":    "learn",
        "SHOP":     "shop",
        "CELEBRATE":"celebrate",
        "SERVICES": "services",
        "EMERGENCY":"emergency",
        "FAREWELL": "farewell",
        "ADOPT":    "adopt",
        "PAPERWORK":"paperwork",
    }

    query: dict = {}
    pillar = QUEUE_PILLAR_MAP.get(queue_name.upper())
    if pillar:
        query["pillar"] = pillar
    if status and status != "all":
        query["status"] = {"$in": [status, "open", "in_progress"]}

    cursor = db.service_desk_tickets.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit)

    tickets = await cursor.to_list(length=limit)
    # Normalize fields
    for t in tickets:
        t.pop("_id", None)
        if not t.get("intent_primary") and t.get("type"):
            t["intent_primary"] = t["type"]

    return {"tickets": tickets, "queue": queue_name, "total": len(tickets)}


@service_desk_router.get("/tickets")
async def get_all_service_desk_tickets(
    status: str = "all",
    limit: int = 200,
    pillar: str = None,
    urgency: str = None,
):
    """Admin: get all service desk tickets. Used by DoggyServiceDesk admin panel."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    query: dict = {
        # Exclude Pet Wrapped auto-generated tickets — admin only sees real booking requests
        "ticket_id": {"$not": {"$regex": "^(wrapped-|annual-|birthday-)", "$options": "i"}},
    }
    if status and status != "all":
        query["status"] = status
    if pillar:
        query["pillar"] = pillar
    if urgency:
        query["urgency"] = urgency

    cursor = db.service_desk_tickets.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit)

    tickets = await cursor.to_list(length=limit)
    for t in tickets:
        t.pop("_id", None)
        if not t.get("intent_primary") and t.get("type"):
            t["intent_primary"] = t["type"]
        # Map to DoggyServiceDesk expected shape
        if not t.get("subject") and t.get("intent_primary"):
            intent = t["intent_primary"].replace("_"," ").title()
            pet = t.get("pet_name","")
            t["subject"] = f"{intent} for {pet}" if pet else intent
        if not t.get("member"):
            t["member"] = {
                "name":  t.get("pet_name") or t.get("parent_id",""),
                "email": t.get("parent_id") if "@" in (t.get("parent_id") or "") else None,
            }
        if not t.get("pet_info") and t.get("pet_id"):
            t["pet_info"] = {"id": t["pet_id"], "name": t.get("pet_name","")}

    return {"tickets": tickets, "total": len(tickets)}


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
    
    # ── Write to ALL collections for full compatibility ─────────────────────
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
            "$push": {"messages": concierge_message},  # write to BOTH messages AND thread
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
    # ── CANONICAL: service_desk_tickets ── write to BOTH thread AND messages
    result = await db.service_desk_tickets.update_many(
        {"$or": [{"ticket_id": ticket_id}, {"id": ticket_id}]},
        {
            "$push": {
                "thread": concierge_message,    # for /my-requests member view
                "messages": {**concierge_message, "from_thread": True},  # for admin DoggyServiceDesk view
            },
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

    # ── WhatsApp notification to member on concierge reply ─────────────────
    try:
        ticket_doc = await db.service_desk_tickets.find_one(
            {"$or": [{"ticket_id": ticket_id}, {"id": ticket_id}]},
            {"_id": 0, "member": 1, "pet_name": 1, "pet_id": 1, "pillar": 1}
        )
        member_phone = None
        member_first = "there"
        pet_display  = "your dog"
        if ticket_doc:
            member_phone  = ticket_doc.get("member", {}).get("phone") or ticket_doc.get("user_phone")
            member_name   = ticket_doc.get("member", {}).get("first_name") or (ticket_doc.get("member", {}).get("name") or "").split()[0]
            member_first  = member_name or "there"
            pet_display   = ticket_doc.get("pet_name") or "your dog"
        if member_phone:
            from whatsapp_notifications import send_whatsapp_message
            wa_msg = (
                f"Hi {member_first} 🐾 Mira here from The Doggy Company.\n\n"
                f"Your Concierge has a message about {pet_display}:\n\n"
                f"{message[:300]}\n\n"
                f"Reply here or view full thread: thedoggycompany.com/my-requests"
            )
            await send_whatsapp_message(member_phone, wa_msg, log_context="concierge_reply")
            logger.info(f"[SERVICE_DESK] WhatsApp sent to {member_phone[:6]}*** for ticket {ticket_id}")
    except Exception as wa_err:
        logger.warning(f"[SERVICE_DESK] WhatsApp notification failed: {wa_err}")
    
    # ═══════════════════════════════════════════════════════════════════
    # SEND EMAIL NOTIFICATION (Resend → woof@thedoggycompany.com sender)
    # Uses ticket_doc already fetched above for WhatsApp — just add email
    # ═══════════════════════════════════════════════════════════════════
    try:
        # Fetch full member contact from ticket (email not in first fetch)
        full_ticket = await db.service_desk_tickets.find_one(
            {"$or": [{"ticket_id": ticket_id}, {"id": ticket_id}]},
            {"_id": 0, "member": 1, "user_email": 1, "user_name": 1, "pet_name": 1}
        )
        if full_ticket:
            member_email = full_ticket.get("member", {}).get("email") or full_ticket.get("user_email")
            member_name  = full_ticket.get("member", {}).get("name") or full_ticket.get("user_name") or "Pet Parent"
            pet_name_e   = full_ticket.get("pet_name", "")

            if member_email:
                import resend, os
                resend.api_key = os.environ.get("RESEND_API_KEY")
                sender_email   = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.com")
                APP_URL        = os.environ.get("FRONTEND_URL", "https://thedoggycompany.com")

                if resend.api_key:
                    pet_line = f" about {pet_name_e}" if pet_name_e else ""
                    resend.Emails.send({
                        "from": f"The Doggy Company <{sender_email}>",
                        "to": member_email,
                        "reply_to": f"ticket+{ticket_id}@replies.thedoggycompany.com",
                        "subject": f"Re: {pet_name_e + ' — ' if pet_name_e else ''}Concierge Update [{ticket_id}]",
                        "html": f"""<!DOCTYPE html>
<html>
<head><style>body{{font-family:'Segoe UI',sans-serif;background:#F5F0E8;margin:0;padding:20px}}.wrap{{max-width:580px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}}.hdr{{background:#0F0F0F;padding:22px 24px}}.hdr p{{color:rgba(245,240,232,.55);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px}}.hdr h2{{color:#F5F0E8;margin:0;font-size:18px}}.body{{padding:24px}}.msg{{background:#F9F6F1;border-left:4px solid #40916C;padding:14px 16px;border-radius:6px;margin:16px 0;white-space:pre-wrap;line-height:1.6}}.btn{{display:inline-block;background:#40916C;color:#fff;padding:11px 24px;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;margin-top:18px}}.ftr{{background:#1a1a1a;padding:14px 24px;text-align:center}}.ftr p{{color:#666;font-size:11px;margin:0}}</style></head>
<body><div class="wrap">
  <div class="hdr"><p>The Doggy Company · Concierge®</p><h2>🐾 Message{pet_line}</h2></div>
  <div class="body">
    <p style="color:#333">Hi {member_name.split()[0] if member_name else 'there'},</p>
    <p style="color:#555"><strong>{concierge_name}</strong> from our Concierge team has replied:</p>
    <div class="msg">{message.replace('<','&lt;').replace('>','&gt;')}</div>
    <a href="{APP_URL}/my-requests" class="btn">View full thread →</a>
    <p style="color:#999;font-size:11px;margin-top:16px">Reply to this email or WhatsApp us to continue the conversation.</p>
  </div>
  <div class="ftr"><p>The Doggy Company Concierge® · woof@thedoggycompany.com</p></div>
</div></body></html>""",
                        "headers": {"X-Ticket-ID": ticket_id}
                    })
                    logger.info(f"[SERVICE_DESK] Email sent to {member_email[:6]}*** for ticket {ticket_id}")
    except Exception as email_err:
        logger.warning(f"[SERVICE_DESK] Email notification failed: {email_err}")
            
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


async def create_enriched_ticket(
    db,
    parent_id: str,
    pet_id: Optional[str],
    pillar: str,
    intent_primary: str,
    channel: str,
    service_name: str,
    member_message: str,
    urgency: str = "normal",
    metadata: dict = None,
):
    """
    Creates a service desk ticket enriched with Mira's briefing.

    DROP-IN REPLACEMENT for the existing ticket creation logic in:
    POST /api/service_desk/attach_or_create_ticket

    Parameters:
        db              — MongoDB database instance
        parent_id       — user ID or email
        pet_id          — pet ID (ObjectId string)
        pillar          — pillar name (care, dine, celebrate etc.)
        intent_primary  — intent type (service_booking, product_inquiry etc.)
        channel         — source channel (care_pillar_page, mira_os etc.)
        service_name    — human-readable service name ("Allergy-Safe Diet Planning")
        member_message  — what the member actually requested
        urgency         — low / normal / high / emergency
        metadata        — any extra data (product_id, service_id etc.)

    Returns:
        dict with ticket_id and status
    """
    now = datetime.utcnow()

    # ── Fetch pet data ─────────────────────────────────────────────────
    pet = None
    if pet_id:
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
        except Exception:
            pet = await db.pets.find_one({"id": pet_id})

    # ── Generate Mira briefing ─────────────────────────────────────────
    mira_briefing = None
    if pet:
        mira_briefing = generate_mira_briefing(
            pet=pet,
            service_name=service_name,
            pillar=pillar,
            intent=intent_primary,
        )

    # ── Build ticket subject (fixes "Request received") ────────────────
    pet_name = pet.get("name") if pet else None
    if pet_name:
        subject = f"{service_name} for {pet_name}"
    else:
        subject = service_name

    # ── Build thread ───────────────────────────────────────────────────
    thread = []

    # 1. Mira briefing — first in thread, visible only to Concierge
    if mira_briefing:
        thread.append({
            "sender":          "mira",
            "text":            mira_briefing,
            "timestamp":       now.isoformat(),
            "visible_to":      "concierge_only",  # parent cannot see this
            "message_type":    "briefing",
        })

    # 2. Member's request — what they actually asked for
    thread.append({
        "sender":       "member",
        "text":         member_message,
        "timestamp":    now.isoformat(),
        "visible_to":   "all",
        "message_type": "request",
    })

    # ── Build ticket ───────────────────────────────────────────────────
    ticket = {
        "ticket_id":       f"TDC-{int(now.timestamp())}",
        "parent_id":       parent_id,
        "pet_id":          str(pet_id) if pet_id else None,
        "pet_name":        pet_name,
        "pet_breed":       normalise_breed(pet.get("breed")) if pet else "indie",
        "pillar":          pillar,
        "intent_primary":  intent_primary,
        "channel":         channel,
        "subject":         subject,          # ← fixes "Request received"
        "status":          "open",
        "urgency":         urgency,
        "thread":          thread,
        "metadata":        metadata or {},
        "created_at":      now.isoformat(),
        "updated_at":      now.isoformat(),
        "mira_briefing":   mira_briefing,    # also stored top-level for easy access
        "soul_score":      pet.get("overall_score") or pet.get("soul_score") or 0 if pet else 0,
    }

    # ── Emergency escalation ───────────────────────────────────────────
    if pillar == "emergency" or urgency == "emergency":
        ticket["status"] = "urgent"
        ticket["urgency"] = "emergency"

    # ── Save to DB ─────────────────────────────────────────────────────
    result = await db.service_desk_tickets.insert_one(ticket)
    ticket_id = ticket["ticket_id"]

    # ── Notify admin (bell notification) ──────────────────────────────
    await db.admin_notifications.insert_one({
        "type":       "new_ticket",
        "ticket_id":  ticket_id,
        "subject":    subject,
        "pillar":     pillar,
        "urgency":    urgency,
        "pet_name":   pet_name,
        "parent_id":  parent_id,
        "read":       False,
        "created_at": now.isoformat(),
    })

    # ── Member notification (their inbox) ─────────────────────────────
    await db.member_notifications.insert_one({
        "type":         "ticket_created",
        "ticket_id":    ticket_id,
        "parent_id":    parent_id,
        "subject":      subject,
        "message":      f"Your request for {service_name} has been received. Concierge® will be in touch shortly.",
        "pillar":       pillar,
        "read":         False,
        "created_at":   now.isoformat(),
    })

    return {
        "ticket_id":  ticket_id,
        "subject":    subject,
        "status":     "created",
        "pet_name":   pet_name,
        "has_briefing": mira_briefing is not None,
    }


# ── FastAPI route — drop-in replacement ───────────────────────────────
"""
REPLACE your existing POST /api/service_desk/attach_or_create_ticket
with this route in service_desk_routes.py:

@router.post("/attach_or_create_ticket")
async def attach_or_create_ticket(
    request: TicketRequest,
    authorization: str = Header(None),
    background_tasks: BackgroundTasks = None,
):
    user = await get_user_from_token(authorization)

    result = await create_enriched_ticket(
        db=db,
        parent_id=user.get("id") or user.get("email"),
        pet_id=request.pet_id,
        pillar=request.pillar,
        intent_primary=request.intent_primary,
        channel=request.channel,
        service_name=request.initial_message.get("text", request.pillar.title() + " Request"),
        member_message=request.initial_message.get("text", "Service requested via " + request.channel),
        urgency=request.urgency or "normal",
        metadata=request.metadata or {},
    )

    # Send WhatsApp confirmation to member (background)
    if background_tasks:
        background_tasks.add_task(
            send_whatsapp_confirmation,
            user.get("phone") or user.get("whatsapp"),
            result["subject"],
            result["pet_name"],
        )

    return result
"""


# ── WhatsApp confirmation template ────────────────────────────────────
async def send_whatsapp_confirmation(phone: str, service_name: str, pet_name: str):
    """
    Sends a WhatsApp confirmation to the member when their ticket is created.
    Uses existing /api/whatsapp/send endpoint.
    """
    if not phone:
        return

    pet_str = f"for {pet_name}" if pet_name else ""
    message = (
        f"✦ *The Doggy Company*\n\n"
        f"Your request for *{service_name}* {pet_str} has been received.\n\n"
        f"Our Concierge® team will be in touch within a few hours to arrange everything.\n\n"
        f"You can track this request in *My Requests* on the app.\n\n"
        f"_Mira is the Brain · Concierge® is the Hands_ 🐾"
    )

    # Fire to existing WhatsApp endpoint
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "http://localhost:8000/api/whatsapp/send",
                json={"to": phone, "message": message},
                timeout=10,
            )
    except Exception:
        pass  # WhatsApp failure should never break ticket creation


