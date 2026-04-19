"""
WhatsApp Business API Integration for Service Desk
Ready for WhatsApp Cloud API - just add keys to .env

Required .env variables (add when ready):
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
"""

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
import logging
import re
from datetime import datetime, timezone
import uuid
import json

from condition_map import get_conditions_for_pet, build_condition_rule
from mira_soul import MIRA_CORE_SOUL
from mira_score_engine import has_wrong_breed_for_pet

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# Import canonical ticket spine helper (SINGLE ENTRY POINT for all tickets)
from utils.spine_helper import handoff_to_spine

# Keep strong references to background tasks to prevent GC cancellation
_bg_tasks: set = set()

# ── LLM Circuit Breaker ──────────────────────────────────────────────────────
# If GPT-4o is returning 502s, skip LLM entirely for 5 minutes so users never
# wait 3+ minutes for a pattern-matched response.
import time as _time
_llm_circuit: dict = {
    "failures": 0,
    "last_fail_at": 0.0,
    "open_until": 0.0,   # Circuit open (skip LLM) until this epoch second
}
_LLM_FAIL_THRESHOLD = 2   # Open circuit after 2 consecutive failures
_LLM_COOLDOWN_SEC  = 300  # Stay open for 5 minutes, then try again


# WhatsApp Cloud API Configuration
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"

# Gupshup API Configuration
GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"


def get_whatsapp_config():
    """Get WhatsApp configuration from environment"""
    return {
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID"),
        "access_token": os.environ.get("WHATSAPP_ACCESS_TOKEN"),
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", "tdc_webhook_verify_2025"),
        "business_account_id": os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID")
    }


from difflib import SequenceMatcher

def _fuzzy_pet_match(text: str, pet_names: list) -> str | None:
    """
    Returns the best matching pet name from the list, or None.
    Handles typos: "Bdmash" → "Badmash", "sultan" → "Sultan".
    Uses difflib similarity (>0.6 threshold).
    """
    if not text or not pet_names:
        return None
    text_clean = text.lower().strip()
    # Strip noise words so "my dog badmash" → "badmash"
    for noise in ("my", "dog", "pet", "him", "her", "the", "a", "is", "it"):
        text_clean = text_clean.replace(f" {noise} ", " ").strip()
        if text_clean.startswith(noise + " "):
            text_clean = text_clean[len(noise):].strip()

    best_pet, best_ratio = None, 0.6  # minimum threshold
    for pet in pet_names:
        pet_lower = pet.lower()
        # Exact / substring match first
        if pet_lower == text_clean or pet_lower in text_clean or text_clean in pet_lower:
            return pet
        # Fuzzy via difflib
        ratio = SequenceMatcher(None, text_clean, pet_lower).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_pet = pet
    return best_pet


def _is_pet_switch_only(text: str, pet_name: str) -> bool:
    """
    Returns True if the message is ONLY switching pet context with no other request.
    e.g. "oh its about Mystique", "actually Badmash", "what about Sultan?"
    Prevents these from triggering catalog searches → Amazon fallbacks.
    Only fires when the pet name is explicitly present in the text.
    """
    if not text or not pet_name:
        return False
    # Pet name must actually appear in the message (not just fuzzy-matched elsewhere)
    if pet_name.lower() not in text.lower():
        return False
    # Short message only (≤10 words)
    if len(text.split()) > 10:
        return False
    # Strip the pet name and common switch filler words
    cleaned = re.sub(r'\b' + re.escape(pet_name) + r'\b', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(
        r'\b(oh|its|it\'s|about|what|switching|switch|to|for|hi|hey|actually|now|the|this|is|a|no|yes|yep|ok|okay)\b',
        '', cleaned, flags=re.IGNORECASE
    )
    cleaned = re.sub(r'[^a-z0-9]', ' ', cleaned.lower()).strip()
    # If ≤1 meaningful word remains, it's a pure switch
    remaining_words = [w for w in cleaned.split() if len(w) > 2]
    return len(remaining_words) == 0


async def _wa_get_history(db, phone_10: str, limit: int = 6) -> list:
    """Fetch last N conversation turns for a WhatsApp number from MongoDB."""
    if not phone_10:
        return []
    try:
        doc = await db.wa_conversation_history.find_one({"phone": phone_10}, {"_id": 0, "turns": 1})
        if doc and doc.get("turns"):
            return doc["turns"][-limit:]
    except Exception:
        pass
    return []


async def _wa_save_history(db, phone_10: str, user_msg: str, bot_reply: str):
    """Append a conversation turn to the phone's history in MongoDB. Keeps last 20 turns."""
    if not phone_10:
        return
    try:
        turn = {
            "user": user_msg[:500],
            "bot": bot_reply[:1000],
            "ts": datetime.now(timezone.utc).isoformat()
        }
        await db.wa_conversation_history.update_one(
            {"phone": phone_10},
            {
                "$push": {"turns": {"$each": [turn], "$slice": -20}},
                "$set": {"updated_at": turn["ts"]}
            },
            upsert=True
        )
    except Exception:
        pass
_WA_PILLAR_KEYWORDS: list[tuple[str, list[str]]] = [
    ("celebrate", ["cake", "birthday", "bday", "b-day", "celebration", "celebrate", "party",
                   "anniversary", "gift", "doggo cake", "pupcake", "pup cake", "pawty"]),
    ("dine",      ["treat", "food", "meal", "kibble", "snack", "biscuit", "chew", "dental",
                   "nutrition", "diet", "feeding", "hungry", "eat", "eating", "hungry",
                   "fresh meal", "home cook", "raw food", "vegetarian", "vegan food"]),
    ("care",      ["groom", "grooming", "bath", "bathe", "bathing", "spa", "trim", "nail",
                   "brush", "haircut", "shampoo", "clean", "wellness", "massage",
                   "dental clean", "ear clean", "pedicure"]),
    ("emergency", ["emergency", "urgent", "pain", "injury", "hurt", "bleed", "blood",
                   "poison", "toxic", "vomit", "accident", "sick", "dying", "critical",
                   "collapsed", "unconscious", "seizure", "fit"]),
    ("vet",       ["vet", "doctor", "vaccination", "vaccine", "deworming", "deworm",
                   "health check", "checkup", "check up", "consultation", "medicine",
                   "prescription", "clinic", "hospital", "spay", "neuter", "surgery"]),
    ("play",      ["daycare", "day care", "play", "playdate", "play date", "park",
                   "exercise", "run", "walk", "toy", "ball", "frisbee", "agility",
                   "dog park", "playtime", "socialise", "socialize"]),
    ("go",        ["stay", "board", "boarding", "hotel", "resort", "hostel", "lodge",
                   "travel", "trip", "vacation", "holiday", "road trip", "flight",
                   "airport", "transit", "pet sitter", "sitter", "overnight"]),
    ("learn",     ["training", "train", "trainer", "obedience", "behavior", "behaviour",
                   "class", "lesson", "puppy class", "socialisation", "socialization",
                   "command", "sit", "stay", "leash"]),
    ("services",  ["service", "appointment", "book", "booking", "schedule", "slot",
                   "concierge", "request", "inquiry", "enquiry"]),
    ("shop",      ["shop", "buy", "order", "purchase", "product", "item", "cart",
                   "delivery", "shipping", "price", "cost", "discount", "offer"]),
    ("paperwork", ["passport", "certificate", "noc", "document", "paperwork",
                   "registration", "license", "licence", "permit", "import", "export",
                   "microchip", "id card"]),
]

def _is_wa_state_fresh(state: dict, max_minutes: int = 30) -> bool:
    """Returns True if wa_pet_state.updated_at is within max_minutes ago."""
    ts = state.get("updated_at")
    if not ts:
        return False
    try:
        dt = datetime.fromisoformat(ts) if isinstance(ts, str) else ts
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).total_seconds() / 60 <= max_minutes
    except Exception:
        return False


def _detect_pillar_from_wa_message(text: str) -> str | None:
    """
    Detect the most likely pillar from a WhatsApp message's keywords.
    Returns the pillar string (e.g. "celebrate") or None if ambiguous/undetected.
    Uses the first match in priority order (celebrate > dine > care > emergency…).
    """
    if not text:
        return None
    lower = text.lower()
    for pillar, keywords in _WA_PILLAR_KEYWORDS:
        if any(kw in lower for kw in keywords):
            return pillar
    return None


    """Get Gupshup configuration from environment"""
    return {
        "api_key": os.environ.get("GUPSHUP_API_KEY"),
        "app_name": os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany"),
        "source_number": os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER")
    }


def get_gupshup_config():
    """Get Gupshup configuration from environment"""
    return {
        "api_key": os.environ.get("GUPSHUP_API_KEY"),
        "app_name": os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany"),
        "source_number": os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER")
    }


def is_whatsapp_configured():
    """Check if WhatsApp is properly configured (Meta or Gupshup)"""
    meta_config = get_whatsapp_config()
    gupshup_config = get_gupshup_config()
    return bool(
        (meta_config["phone_number_id"] and meta_config["access_token"]) or
        gupshup_config["api_key"]
    )


def is_gupshup_configured():
    """Check if Gupshup is configured"""
    config = get_gupshup_config()
    return bool(config["api_key"])


# Pydantic Models
class WhatsAppMessage(BaseModel):
    """Outgoing WhatsApp message"""
    to: str  # Phone number with country code (e.g., "919876543210")
    message: str
    template_name: Optional[str] = None  # For template messages
    template_params: Optional[List[str]] = None


class WhatsAppMediaMessage(BaseModel):
    """WhatsApp message with media"""
    to: str
    media_type: str  # image, document, audio, video
    media_url: str
    caption: Optional[str] = None


class IncomingWhatsAppMessage(BaseModel):
    """Webhook payload for incoming WhatsApp messages"""
    from_number: str
    message_id: str
    timestamp: str
    message_type: str  # text, image, document, audio, video, location, contacts
    text: Optional[str] = None
    media_id: Optional[str] = None
    media_mime_type: Optional[str] = None
    caption: Optional[str] = None


# ============== WEBHOOK ENDPOINTS ==============

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    """
    WhatsApp webhook verification endpoint.
    Meta sends a GET request to verify the webhook URL.
    """
    config = get_whatsapp_config()
    
    if hub_mode == "subscribe" and hub_verify_token == config["verify_token"]:
        logger.info("WhatsApp webhook verified successfully")
        return int(hub_challenge)
    
    logger.warning(f"WhatsApp webhook verification failed. Token: {hub_verify_token}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_whatsapp_webhook(request: Request):
    """
    Receive incoming WhatsApp messages and status updates.
    Returns 200 INSTANTLY — dedup + processing all happen in background task.
    Cloudflare/Gupshup never timeout waiting for this endpoint.
    """
    import asyncio
    try:
        body = await request.json()

        # ============== GUPSHUP FORMAT ==============
        if "payload" in body and body.get("type") in ["message", "message-event"]:
            # Spawn background task FIRST, return 200 immediately
            # Keep a strong reference so it isn't GC-cancelled before completion
            _task = asyncio.create_task(process_gupshup_webhook(body))
            _bg_tasks.add(_task)
            _task.add_done_callback(_bg_tasks.discard)
            return {"status": "ok"}
        
        # ============== META CLOUD API FORMAT ==============
        if "entry" in body:
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    if "messages" in value:
                        for message in value.get("messages", []):
                            asyncio.create_task(process_incoming_message(message, value.get("contacts", [])))
                    if "statuses" in value:
                        for status in value.get("statuses", []):
                            await process_status_update(status)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        return {"status": "error", "message": str(e)}


async def process_gupshup_webhook(body: dict):
    """
    Process Gupshup webhook payload.
    
    Gupshup message format:
    {
        "app": "DoggyCompany",
        "timestamp": 1234567890,
        "version": 2,
        "type": "message",
        "payload": {
            "id": "message_id",
            "source": "919876543210",
            "type": "text",
            "payload": {
                "text": "Hello"
            },
            "sender": {
                "phone": "919876543210",
                "name": "John Doe"
            }
        }
    }
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    from realtime_notifications import notification_manager
    
    try:
        payload = body.get("payload", {})
        msg_type = body.get("type", "")
        
        # Handle message events (delivered, read, etc.)
        if msg_type == "message-event":
            event_type = payload.get("type", "")
            logger.info(f"[GUPSHUP] Message event: {event_type}")
            return
        
        # Handle incoming messages
        if msg_type == "message":
            from_number = payload.get("source", "") or payload.get("sender", {}).get("phone", "")
            sender_name = payload.get("sender", {}).get("name", "WhatsApp User")
            message_id = payload.get("id", str(uuid.uuid4()))
            message_type = payload.get("type", "text")
            
            # Connect to database first (shared for both dedup + processing)
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "test_database")
            client = AsyncIOMotorClient(mongo_url)
            db_bg = client[db_name]

            # ── Deduplication (now safely inside background task) ──────────────
            if message_id:
                try:
                    existing = await db_bg.wa_processed_msgs.find_one({"msg_id": message_id})
                    if existing:
                        print(f"[MIRA-WA-DEBUG] Duplicate msg_id={message_id} — skipping", flush=True)
                        client.close()
                        return
                    await db_bg.wa_processed_msgs.insert_one({
                        "msg_id": message_id,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    # Create TTL index once (will no-op if already exists)
                    try:
                        await db_bg.wa_processed_msgs.create_index(
                            "created_at", expireAfterSeconds=600, background=True
                        )
                    except Exception:
                        pass
                except Exception:
                    pass  # Dedup failure is non-critical — continue processing

            # Extract content based on message type
            content = ""
            inner_payload = payload.get("payload", {})
            
            if message_type == "text":
                content = inner_payload.get("text", "")
            elif message_type == "image":
                content = inner_payload.get("caption", "[Image received]")
            elif message_type == "document":
                content = inner_payload.get("caption", "[Document received]")
            elif message_type == "audio":
                content = "[Voice message received]"
            elif message_type == "video":
                content = inner_payload.get("caption", "[Video received]")
            elif message_type == "location":
                lat = inner_payload.get("latitude", "")
                lon = inner_payload.get("longitude", "")
                content = f"📍 Location: {lat}, {lon}"
            else:
                content = f"[{message_type} message]"
            
            logger.info(f"[GUPSHUP] Message from {from_number}: {content[:100]}")
            db = db_bg  # Use the connection already established for dedup
            
            # Find or create conversation/ticket
            ticket = await db.tickets.find_one({
                "$or": [
                    {"member.phone": {"$regex": from_number[-10:]}},
                    {"member.whatsapp": from_number}
                ],
                "status": {"$nin": ["closed", "resolved"]}
            }, sort=[("created_at", -1)])
            
            now = datetime.now(timezone.utc).isoformat()
            
            if ticket:
                # Add message to existing ticket
                new_message = {
                    "id": str(uuid.uuid4()),
                    "type": "customer_reply",
                    "content": content,
                    "sender": "member",
                    "sender_name": sender_name,
                    "channel": "whatsapp",
                    "direction": "incoming",
                    "timestamp": now,
                    "is_internal": False,
                    "metadata": {
                        "whatsapp_message_id": message_id,
                        "phone": from_number,
                        "message_type": message_type,
                        "provider": "gupshup"
                    }
                }
                
                await db.tickets.update_one(
                    {"_id": ticket["_id"]},
                    {
                        "$push": {"messages": new_message},
                        "$set": {"updated_at": now, "last_message_at": now}
                    }
                )
                
                logger.info(f"[GUPSHUP] Added message to ticket {ticket.get('ticket_id')}")

                # ── ALSO update service_desk_tickets (Concierge® inbox) ──────
                # ── Fix A: Smart ticket routing ────────────────────────────────
                # If the user is answering a multi-pet disambiguation question,
                # route to a pet-specific ticket instead of any open ticket.
                _phone_10_wa = "".join(filter(str.isdigit, str(from_number)))[-10:]
                _wa_state = await db.wa_pet_state.find_one({"phone": _phone_10_wa})
                _resolved_pet = None

                # Detect pillar from message content upfront (used in both branches below)
                _detected_pillar = _detect_pillar_from_wa_message(content)

                if _wa_state and _wa_state.get("awaiting_pet_selection"):
                    if not _is_wa_state_fresh(_wa_state):
                        # Stale awaiting state — delete it, fall through to fresh picker
                        await db.wa_pet_state.delete_one({"phone": _phone_10_wa})
                        _wa_state = None
                        print(f"[MIRA-WA-DEBUG] Deleted stale awaiting_pet_selection for {_phone_10_wa}", flush=True)
                    else:
                        # Fresh — try to resolve pet name from message (text or number)
                        _wa_users = await db.users.find(
                            {"$or": [
                                {"phone": {"$regex": _phone_10_wa + "$"}},
                                {"whatsapp": {"$regex": _phone_10_wa + "$"}},
                            ]},
                            {"_id": 0, "email": 1}
                        ).to_list(10)
                        _wa_all_emails = list({u.get("email") for u in _wa_users if u.get("email")})
                        if _wa_all_emails:
                            _wa_pets = await db.pets.find(
                                {"owner_email": {"$in": _wa_all_emails}},
                                {"_id": 0, "name": 1}
                            ).to_list(30)
                            _wa_pet_names = [p["name"] for p in _wa_pets if p.get("name")]
                            _resolved_pet = _fuzzy_pet_match(content, _wa_pet_names)
                            if _resolved_pet:
                                logger.info(f"[GUPSHUP] Fix A: Disambiguation reply '{content}' → resolved pet '{_resolved_pet}'")

                if _resolved_pet:
                    # Look for an existing open ticket for THIS specific pet
                    sd_ticket = await db.service_desk_tickets.find_one(
                        {
                            "$or": [
                                {"member.phone": {"$regex": _phone_10_wa + "$"}},
                                {"user_phone": {"$regex": _phone_10_wa + "$"}},
                            ],
                            "pet_name": _resolved_pet,
                            "status": {"$nin": ["closed", "resolved"]},
                        },
                        sort=[("updated_at", -1)],
                    )
                    # If no pet-specific ticket exists, fall through to create a new one (sd_ticket=None)
                    if not sd_ticket:
                        logger.info(f"[GUPSHUP] Fix A: No existing ticket for '{_resolved_pet}' — will create fresh one")
                else:
                    # ── Pillar-aware dedup lookup ──────────────────────────────────────────
                    # Detect pillar from message content. If detected, only match tickets
                    # for the SAME pillar. If undetected, create a NEW ticket (safer than
                    # merging into a wrong-topic thread).
                    _detected_pillar = _detect_pillar_from_wa_message(content)
                    if _detected_pillar:
                        sd_ticket = await db.service_desk_tickets.find_one(
                            {
                                "$or": [
                                    {"member.phone": {"$regex": from_number[-10:]}},
                                    {"user_phone": {"$regex": from_number[-10:]}},
                                ],
                                "pillar": _detected_pillar,
                                "status": {"$nin": ["closed", "resolved"]},
                            },
                            sort=[("updated_at", -1)],
                        )
                        logger.info(
                            f"[GUPSHUP] Pillar-aware dedup: detected='{_detected_pillar}' "
                            f"→ {'attached to ' + sd_ticket.get('ticket_id','?') if sd_ticket else 'no match — will create new ticket'}"
                        )
                    else:
                        # No pillar detected — force new ticket so we never merge into wrong thread
                        sd_ticket = None
                        logger.info("[GUPSHUP] No pillar detected from WA message — creating fresh ticket")
                wa_msg = {
                    "id": str(uuid.uuid4()),
                    "sender": "member",
                    "sender_name": sender_name,
                    "text": content,
                    "channel": "whatsapp",
                    "timestamp": now,
                    "source": "whatsapp_inbound",
                    "direction": "incoming",
                }
                if sd_ticket:
                    await db.service_desk_tickets.update_one(
                        {"_id": sd_ticket["_id"]},
                        {
                            "$push": {"conversation": wa_msg},
                            "$set": {
                                "updated_at": now,
                                "has_unread_member_reply": True,
                                "last_member_reply_at": now,
                            },
                        },
                    )
                    sd_ticket_id = sd_ticket.get("ticket_id") or sd_ticket.get("id")
                    member_label = sd_ticket.get("member", {}).get("name") or sender_name
                    pet_label    = sd_ticket.get("pet_name", "")
                    await db.admin_notifications.insert_one({
                        "type": "whatsapp_reply",
                        "title": f"💬 WhatsApp reply from {member_label}",
                        "message": f"{sender_name} replied on ticket {sd_ticket_id}{(' for ' + pet_label) if pet_label else ''}: \"{content[:120]}\"",
                        "ticket_id": sd_ticket_id,
                        "read": False,
                        "created_at": now,
                        "metadata": {"from_phone": from_number, "text_preview": content[:200]},
                    })
                    logger.info(f"[GUPSHUP] ✅ service_desk_ticket {sd_ticket_id} updated with WA reply")
                else:
                    # No matching service_desk_ticket — create one so admin can see this conversation
                    # Look up the registered member by phone for enrichment
                    phone_10 = ''.join(filter(str.isdigit, str(from_number)))[-10:]
                    found_user = await db.users.find_one(
                        {"$or": [{"phone": {"$regex": phone_10}}, {"whatsapp": {"$regex": phone_10}}]},
                        {"_id": 0, "email": 1, "name": 1, "parent_name": 1, "phone": 1}
                    )
                    enrich_email = found_user.get("email") if found_user else None
                    enrich_name = (found_user.get("name") or found_user.get("parent_name") or sender_name) if found_user else sender_name
                    enrich_pets = []
                    if enrich_email:
                        enrich_pets = await db.pets.find(
                            {"owner_email": enrich_email},
                            {"_id": 0, "id": 1, "name": 1, "breed": 1, "allergies": 1, "fav_food": 1, "city": 1}
                        ).to_list(3)
                    first_pet = enrich_pets[0] if enrich_pets else None
                    
                    allergy_parts = []
                    if first_pet:
                        raw = first_pet.get("allergies", "")
                        allergy_parts = raw if isinstance(raw, list) else [a.strip() for a in str(raw).split(",") if a.strip()]
                    
                    legacy_tid = ticket.get("ticket_id") or str(uuid.uuid4())[:8].upper()
                    new_sd = {
                        "id": legacy_tid,
                        "ticket_id": legacy_tid,
                        "type": "whatsapp_inquiry",
                        "category": _detected_pillar or "support",
                        "subject": f"WhatsApp {'(' + _detected_pillar.title() + ') ' if _detected_pillar else ''}Inquiry: {content[:80]}",
                        "description": content,
                        "status": "open",
                        "priority": "normal",
                        "channel": "whatsapp",
                        "source": "whatsapp",
                        "pillar": _detected_pillar or "support",
                        "member": {
                            "name": enrich_name,
                            "email": enrich_email,
                            "phone": from_number,
                            "whatsapp": from_number,
                        },
                        "user_phone": from_number,
                        "user_name": enrich_name,
                        "user_email": enrich_email,
                        "pet_name": first_pet.get("name") if first_pet else None,
                        "pet_names": [p.get("name") for p in enrich_pets if p.get("name")],
                        "allergy_alert": f"No {', '.join(allergy_parts)} in ANY product" if allergy_parts else None,
                        "mira_briefing": (
                            f"🔴 ALLERGY ALERT: No {', '.join(allergy_parts)} in ANY product\nPlease confirm via WhatsApp within 2 hours." if allergy_parts else None
                        ),
                        "conversation": [wa_msg],
                        "has_unread_member_reply": True,
                        "last_member_reply_at": now,
                        "created_at": now,
                        "updated_at": now,
                        "assigned_to": None,
                    }
                    await db.service_desk_tickets.insert_one(new_sd)
                    new_sd.pop("_id", None)
                    # ── Admin bell notification for new WhatsApp ticket ──────────
                    _wa_ticket_id = new_sd.get("ticket_id") or new_sd.get("id")
                    await db.admin_notifications.insert_one({
                        "id":        f"notif-{uuid.uuid4().hex[:12]}",
                        "type":      "whatsapp_new",
                        "title":     f"💬 New WhatsApp — {enrich_name}",
                        "message":   content[:120] + ("…" if len(content) > 120 else ""),
                        "ticket_id": _wa_ticket_id,
                        "pillar":    _detected_pillar or "support",
                        "category":  _detected_pillar or "support",
                        "link_to":   f"/admin?tab=servicedesk&ticket={_wa_ticket_id}",
                        "read":      False,
                        "created_at": now,
                        "metadata":  {"from_phone": from_number, "text_preview": content[:200]},
                    })
                    logger.info(f"[GUPSHUP] ✅ Created new service_desk_ticket {legacy_tid} for existing legacy ticket")
            else:
                # ═══════════════════════════════════════════════════════════════════════════
                # HANDOFF TO SPINE - Create new ticket from WhatsApp message (Gupshup)
                # MIGRATED to handoff_to_spine() per Bible Section 12.0.
                # ═══════════════════════════════════════════════════════════════════════════
                
                # ── Step 1: Look up the registered member by phone number ─────────────────
                phone_digits = ''.join(filter(str.isdigit, str(from_number)))
                phone_10 = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
                
                found_user = await db.users.find_one(
                    {"$or": [
                        {"phone": {"$regex": phone_10}},
                        {"whatsapp": {"$regex": phone_10}},
                    ]},
                    {"_id": 0, "email": 1, "name": 1, "parent_name": 1, "phone": 1, "whatsapp": 1}
                )
                
                member_email = None
                member_name = sender_name
                found_pets = []
                first_pet = None
                
                if found_user:
                    member_email = found_user.get("email")
                    member_name = found_user.get("name") or found_user.get("parent_name") or sender_name
                    # Get their pets
                    found_pets = await db.pets.find(
                        {"owner_email": member_email},
                        {"_id": 0, "id": 1, "name": 1, "breed": 1, "allergies": 1, "fav_food": 1, "city": 1}
                    ).to_list(5)
                    # Detect pet name from message before defaulting to first pet
                    message_lower = content.lower() if content else ""
                    first_pet = None
                    for pet in found_pets:
                        pet_name_lower = (pet.get("name") or "").lower()
                        if pet_name_lower and pet_name_lower in message_lower:
                            first_pet = pet
                            logger.info(f"[GUPSHUP] Pet name '{pet.get('name')}' detected in message — using as active pet")
                            break
                    if not first_pet:
                        if len(found_pets) == 1:
                            # Single-pet household — auto-assign, no disambiguation needed
                            first_pet = found_pets[0]
                        # Multi-pet household with no pet named in message → leave as None
                        # get_mira_ai_response will fire the "which dog?" disambiguation question
                    logger.info(f"[GUPSHUP] Matched member {member_email} with {len(found_pets)} pet(s) | active_pet={first_pet.get('name') if first_pet else None}")
                else:
                    logger.info(f"[GUPSHUP] No registered member found for {phone_10} — creating anonymous ticket")
                
                intent = f"WhatsApp Inquiry: {content[:100]}" if content else "WhatsApp Inquiry"
                
                spine_result = await handoff_to_spine(
                    db=db,
                    route_name="whatsapp_routes.py",
                    endpoint="/whatsapp/webhook (gupshup)",
                    pillar="support",
                    category="whatsapp_inquiry",
                    intent=intent,
                    user={
                        "email": member_email,
                        "name": member_name,
                        "phone": from_number
                    },
                    pet={"id": first_pet.get("id"), "name": first_pet.get("name"), "breed": first_pet.get("breed")} if first_pet else None,
                    payload={
                        "provider": "gupshup",
                        "message_type": message_type,
                        "original_message": content,
                        "whatsapp_message_id": message_id,
                        "messages": [{
                            "id": str(uuid.uuid4()),
                            "type": "initial_message",
                            "content": content,
                            "sender": "member",
                            "sender_name": sender_name,
                            "channel": "whatsapp",
                            "direction": "incoming",
                            "timestamp": now,
                            "is_internal": False
                        }]
                    },
                    channel="whatsapp",
                    urgency="normal",
                    created_by="member",
                    notify_admin=True,
                    notify_member=False,  # No email for WhatsApp users
                    tags=["whatsapp", "gupshup", "inquiry"]
                )
                
                ticket_id = spine_result.get("ticket_id", f"WA-{uuid.uuid4().hex[:8].upper()}")
                logger.info(f"[SPINE-MIGRATED] whatsapp_routes.py (gupshup) → {ticket_id} | pillar=support category=whatsapp_inquiry")
                
                # ── Step 2: Enrich the service_desk_ticket with full member/pet/conversation ──
                # The spine creates a minimal record; we patch it to match the Admin UI schema
                try:
                    allergy_parts = []
                    if first_pet:
                        raw_allergy = first_pet.get("allergies", "")
                        if isinstance(raw_allergy, list):
                            allergy_parts = [a for a in raw_allergy if a]
                        elif raw_allergy:
                            allergy_parts = [a.strip() for a in str(raw_allergy).split(",") if a.strip()]
                    
                    allergy_alert = (
                        f"No {', '.join(allergy_parts)} in ANY product" if allergy_parts else None
                    )
                    
                    pet_names_list = [p.get("name") for p in found_pets if p.get("name")]
                    
                    enrichment = {
                        "member": {
                            "name": member_name,
                            "email": member_email,
                            "phone": from_number,
                            "whatsapp": from_number,
                        },
                        "user_phone": from_number,
                        "user_name": member_name,
                        "user_email": member_email,
                        "source": "whatsapp",
                        "channel": "whatsapp",
                        "pet_name": first_pet.get("name") if first_pet else None,
                        "pet_names": pet_names_list,
                        "pet_profile": {
                            "name": first_pet.get("name"),
                            "breed": first_pet.get("breed"),
                            "allergies": allergy_parts,
                            "fav_food": first_pet.get("fav_food", []),
                            "city": first_pet.get("city"),
                        } if first_pet else None,
                        "allergy_alert": allergy_alert,
                        "mira_briefing": (
                            f"🔴 ALLERGY ALERT: No {', '.join(allergy_parts)} in ANY product\n"
                            f"Please confirm via WhatsApp within 2 hours." if allergy_alert else None
                        ),
                        "conversation": [{
                            "id": str(uuid.uuid4()),
                            "sender": "member",
                            "sender_name": sender_name,
                            "text": content,
                            "channel": "whatsapp",
                            "timestamp": now,
                            "direction": "incoming",
                            "source": "whatsapp_inbound",
                        }],
                        "has_unread_member_reply": True,
                        "last_member_reply_at": now,
                    }
                    await db.service_desk_tickets.update_one(
                        {"ticket_id": ticket_id}, {"$set": enrichment}
                    )
                    # Also patch the tickets collection so follow-up messages can find it by phone
                    await db.tickets.update_one(
                        {"ticket_id": ticket_id},
                        {"$set": {
                            "member.phone": from_number,
                            "member.whatsapp": from_number,
                            "member.name": member_name,
                            "member.email": member_email,
                        }}
                    )
                    logger.info(f"[GUPSHUP] ✅ service_desk_ticket {ticket_id} enriched with member/pet/conversation")
                except Exception as enrich_err:
                    logger.error(f"[GUPSHUP] service_desk_ticket enrichment failed: {enrich_err}")
            
            # Send real-time notification to admin
            try:
                resolved_ticket_id = ticket.get("ticket_id") if ticket else ticket_id
                await notification_manager.emit_new_ticket({
                    "type": "whatsapp_message",
                    "ticket_id": resolved_ticket_id,
                    "from": from_number,
                    "sender_name": sender_name,
                    "message": content[:200],
                    "channel": "whatsapp",
                    "timestamp": now
                })
            except Exception as notif_err:
                logger.warning(f"[GUPSHUP] Notification failed: {notif_err}")
            
            # ── Mira full AI response ──────────────────────────────────────────────
            # Send real Mira intelligence back to the WhatsApp user immediately
            try:
                logger.info(f"[GUPSHUP] Calling send_auto_mira_reply for {from_number[:6]}*** | msg={content[:60]}")
                await send_auto_mira_reply(from_number, content, sender_name)
            except Exception as ack_err:
                logger.warning(f"[GUPSHUP] Mira reply failed (non-critical): {ack_err}")
                
    except Exception as e:
        logger.error(f"[GUPSHUP] Processing error: {e}")
        raise


async def send_mira_ack(from_number: str, user_message: str, sender_name: str, db) -> None:
    """
    Send Mira's warm auto-acknowledgement back to the WhatsApp user.
    Personalised with pet name if the user is a registered member.
    Non-blocking — failures are logged but do not affect ticket creation.
    """
    try:
        # Look up the member + pet for personalisation
        phone_10 = ''.join(filter(str.isdigit, str(from_number)))[-10:]
        found_user = await db.users.find_one(
            {"$or": [{"phone": {"$regex": phone_10}}, {"whatsapp": {"$regex": phone_10}}]},
            {"_id": 0, "name": 1, "parent_name": 1, "email": 1}
        )
        member_name = (found_user.get("name") or found_user.get("parent_name") or sender_name) if found_user else sender_name
        
        pet_name = None
        if found_user and found_user.get("email"):
            first_pet = await db.pets.find_one(
                {"owner_email": found_user["email"]},
                {"_id": 0, "name": 1}
            )
            pet_name = first_pet.get("name") if first_pet else None
        
        # Build a friendly, personalised ack
        first_name = member_name.split()[0] if member_name else "there"
        
        if pet_name:
            ack = (
                f"Hi {first_name}! I'm Mira, {pet_name}'s Concierge® 🐾\n\n"
                f"Got your message! Our Concierge team will review it and get back to you shortly.\n\n"
                f"Is there anything specific about {pet_name} I can help you with right now?"
            )
        else:
            ack = (
                f"Hi {first_name}! I'm Mira from The Doggy Company 🐾\n\n"
                f"Got your message! Our Concierge team will review it and get back to you shortly.\n\n"
                f"Can I help you with anything else in the meantime?"
            )
        
        result = await send_mira_reply(from_number, ack)
        if result.get("success"):
            logger.info(f"[MIRA-ACK] ✅ Sent ack to {phone_10[:6]}*** | pet={pet_name}")
        else:
            logger.warning(f"[MIRA-ACK] Failed: {result.get('error')}")
    except Exception as e:
        logger.error(f"[MIRA-ACK] Error: {e}")


async def process_incoming_message(message: dict, contacts: list):
    """Process incoming WhatsApp message with Mira AI response (Meta Cloud API format)"""
    from motor.motor_asyncio import AsyncIOMotorClient
    from realtime_notifications import notification_manager
    
    try:
        # Extract message details
        from_number = message.get("from", "")
        message_id = message.get("id", "")
        message_type = message.get("type", "text")
        
        # Get sender name from contacts
        sender_name = "WhatsApp User"
        for contact in contacts:
            if contact.get("wa_id") == from_number:
                sender_name = contact.get("profile", {}).get("name", sender_name)
                break
        
        # Extract message content based on type
        content = ""
        media_info = None
        
        if message_type == "text":
            content = message.get("text", {}).get("body", "")
        elif message_type in ["image", "document", "audio", "video"]:
            media = message.get(message_type, {})
            content = media.get("caption", f"[{message_type.upper()}]")
            media_info = {
                "type": message_type,
                "media_id": media.get("id"),
                "mime_type": media.get("mime_type")
            }
        elif message_type == "location":
            loc = message.get("location", {})
            content = f"📍 Location: {loc.get('latitude')}, {loc.get('longitude')}"
        elif message_type == "contacts":
            content = "[Contact shared]"
        
        # Connect to database
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Find existing open ticket for this phone number
        ticket = await db.tickets.find_one({
            "$or": [
                {"member.phone": {"$regex": from_number[-10:]}},
                {"member.whatsapp": from_number}
            ],
            "status": {"$nin": ["closed", "resolved"]}
        }, sort=[("created_at", -1)])
        
        now = datetime.now(timezone.utc).isoformat()
        
        if ticket:
            # Add message to existing ticket
            new_message = {
                "id": str(uuid.uuid4()),
                "type": "customer_reply",
                "content": content,
                "sender": "member",
                "sender_name": sender_name,
                "channel": "whatsapp",
                "direction": "incoming",
                "timestamp": now,
                "is_internal": False,
                "metadata": {
                    "whatsapp_message_id": message_id,
                    "phone": from_number,
                    "message_type": message_type
                }
            }
            
            if media_info:
                new_message["media"] = media_info
            
            await db.tickets.update_one(
                {"_id": ticket["_id"]},
                {
                    "$push": {"messages": new_message},
                    "$set": {
                        "updated_at": now,
                        "status": "in_progress" if ticket.get("status") == "waiting_on_member" else ticket.get("status")
                    }
                }
            )
            
            # Emit real-time notification
            await notification_manager.emit_new_message(
                ticket.get("ticket_id"),
                new_message,
                "whatsapp"
            )
            
            logger.info(f"Added WhatsApp message to ticket: {ticket.get('ticket_id')}")
            
        else:
            # ═══════════════════════════════════════════════════════════════════════════
            # HANDOFF TO SPINE - Create new ticket from WhatsApp message (Meta Cloud API)
            # MIGRATED to handoff_to_spine() per Bible Section 12.0.
            # ═══════════════════════════════════════════════════════════════════════════
            intent = f"WhatsApp: {content[:50]}..." if len(content) > 50 else f"WhatsApp: {content}"
            
            initial_message = {
                "id": str(uuid.uuid4()),
                "type": "initial",
                "content": content,
                "sender": "member",
                "sender_name": sender_name,
                "channel": "whatsapp",
                "direction": "incoming",
                "timestamp": now,
                "is_internal": False,
                "metadata": {
                    "whatsapp_message_id": message_id,
                    "phone": from_number,
                    "message_type": message_type
                }
            }
            
            if media_info:
                initial_message["media"] = media_info
            
            spine_result = await handoff_to_spine(
                db=db,
                route_name="whatsapp_routes.py",
                endpoint="/whatsapp/webhook (meta)",
                pillar="support",
                category="whatsapp_inquiry",
                intent=intent,
                user={
                    "email": None,
                    "name": sender_name,
                    "phone": from_number
                },
                pet=None,
                payload={
                    "provider": "meta_cloud_api",
                    "message_type": message_type,
                    "original_message": content,
                    "whatsapp_message_id": message_id,
                    "messages": [initial_message]
                },
                channel="whatsapp",
                urgency="normal",
                created_by="member",
                notify_admin=True,
                notify_member=False,  # No email for WhatsApp users
                tags=["whatsapp", "meta", "inquiry"]
            )
            
            new_ticket_id = spine_result.get("ticket_id", f"WA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
            
            # Emit real-time notification for new ticket
            await notification_manager.emit_new_ticket({
                "ticket_id": new_ticket_id,
                "subject": intent,
                "member": {
                    "name": sender_name,
                    "phone": from_number,
                    "whatsapp": from_number
                },
                "channel": "whatsapp",
                "status": "new"
            })
            
            logger.info(f"[SPINE-MIGRATED] whatsapp_routes.py (meta) → {new_ticket_id} | pillar=support category=whatsapp_inquiry")
        
        # 🐕‍🦺 Send Mira's auto-reply
        await send_auto_mira_reply(from_number, content, sender_name)
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error processing WhatsApp message: {e}")
        raise


async def process_status_update(status: dict):
    """Process WhatsApp message status updates (sent, delivered, read)"""
    logger.info(f"WhatsApp status update: {status.get('status')} for {status.get('id')}")
    # Could update message delivery status in database if needed


# ============== SENDING ENDPOINTS ==============

@router.post("/send")
async def send_whatsapp_message(message: WhatsAppMessage):
    """
    Send a WhatsApp message to a customer.
    Requires WhatsApp Business API credentials.
    """
    if not is_whatsapp_configured():
        raise HTTPException(
            status_code=503,
            detail="WhatsApp is not configured. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env"
        )
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Send text message
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": message.to,
                "type": "text",
                "text": {
                    "preview_url": True,
                    "body": message.message
                }
            }
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"WhatsApp API error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            logger.info(f"WhatsApp message sent: {result}")
            
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "to": message.to
            }
            
    except httpx.HTTPError as e:
        logger.error(f"WhatsApp HTTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-template")
async def send_template_message(message: WhatsAppMessage):
    """
    Send a WhatsApp template message.
    Templates must be pre-approved in Meta Business Manager.
    """
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    if not message.template_name:
        raise HTTPException(status_code=400, detail="template_name is required")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Build template components
            components = []
            if message.template_params:
                components.append({
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in message.template_params]
                })
            
            payload = {
                "messaging_product": "whatsapp",
                "to": message.to,
                "type": "template",
                "template": {
                    "name": message.template_name,
                    "language": {"code": "en"},
                    "components": components
                }
            }
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "template": message.template_name
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-media")
async def send_media_message(message: WhatsAppMediaMessage):
    """Send a media message (image, document, audio, video)"""
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "messaging_product": "whatsapp",
                "to": message.to,
                "type": message.media_type,
                message.media_type: {
                    "link": message.media_url
                }
            }
            
            if message.caption and message.media_type in ["image", "video", "document"]:
                payload[message.media_type]["caption"] = message.caption
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id")
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== GUPSHUP ENDPOINTS ==============

@router.post("/gupshup/send")
async def send_gupshup_message(message: WhatsAppMessage):
    """
    Send a WhatsApp message via Gupshup API.
    Use this endpoint if you're using Gupshup as your WhatsApp provider.
    """
    if not is_gupshup_configured():
        raise HTTPException(status_code=503, detail="Gupshup not configured. Add GUPSHUP_API_KEY to .env")
    
    config = get_gupshup_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Gupshup API payload
            payload = {
                "channel": "whatsapp",
                "source": config["source_number"],
                "destination": message.to,
                "message": json.dumps({
                    "type": "text",
                    "text": message.message
                }),
                "src.name": config["app_name"]
            }
            
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload
            )
            
            result = response.json()
            
            if response.status_code not in [200, 202] or result.get("status") not in ["success", "submitted"]:
                logger.error(f"Gupshup API error: {result}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=result.get("message", "Gupshup API error")
                )
            
            logger.info(f"[GUPSHUP] Message sent: {result}")
            
            return {
                "success": True,
                "message_id": result.get("messageId"),
                "to": message.to,
                "provider": "gupshup"
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Gupshup HTTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gupshup/send-template")
async def send_gupshup_template(
    to: str,
    template_id: str,
    params: List[str] = []
):
    """
    Send a template message via Gupshup.
    Templates must be pre-approved in Gupshup dashboard.
    """
    if not is_gupshup_configured():
        raise HTTPException(status_code=503, detail="Gupshup not configured")
    
    config = get_gupshup_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Build template message
            template_message = {
                "id": template_id,
                "params": params
            }
            
            payload = {
                "channel": "whatsapp",
                "source": config["source_number"],
                "destination": to,
                "template": json.dumps(template_message),
                "src.name": config["app_name"]
            }
            
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload
            )
            
            result = response.json()
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=result)
            
            return {
                "success": True,
                "message_id": result.get("messageId"),
                "provider": "gupshup"
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== STATUS & CONFIGURATION ==============

@router.get("/status")
async def get_whatsapp_status():
    """Check WhatsApp integration status (Meta and Gupshup)"""
    meta_configured = bool(get_whatsapp_config()["phone_number_id"] and get_whatsapp_config()["access_token"])
    gupshup_configured = is_gupshup_configured()
    meta_config = get_whatsapp_config()
    gupshup_config = get_gupshup_config()
    
    return {
        "configured": meta_configured or gupshup_configured,
        "providers": {
            "meta_cloud_api": {
                "configured": meta_configured,
                "phone_number_id": meta_config["phone_number_id"][:6] + "..." if meta_config["phone_number_id"] else None,
            },
            "gupshup": {
                "configured": gupshup_configured,
                "app_name": gupshup_config["app_name"],
                "source_number": gupshup_config["source_number"]
            }
        },
        "webhook_verify_token": meta_config["verify_token"],
        "webhook_url": "/api/whatsapp/webhook",
        "setup_instructions": {
            "gupshup": {
                "1": "Go to Gupshup Dashboard (gupshup.io)",
                "2": "Create WhatsApp Business API App",
                "3": "Get your API Key from Settings",
                "4": "Add to .env: GUPSHUP_API_KEY=your_key",
                "5": "Set callback URL in Gupshup: https://thedoggycompany.com/api/whatsapp/webhook"
            },
            "meta_cloud_api": {
                "1": "Go to Meta Business Suite > WhatsApp Manager",
                "2": "Get Phone Number ID and Access Token",
                "3": "Add to .env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN"
            }
        } if not (meta_configured or gupshup_configured) else None
    }


@router.get("/templates")
async def list_message_templates():
    """List available WhatsApp message templates"""
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{WHATSAPP_API_URL}/{config['business_account_id']}/message_templates",
                headers={"Authorization": f"Bearer {config['access_token']}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============== MIRA AI FOR WHATSAPP ==============

# Mira's personality and command patterns for WhatsApp
MIRA_WHATSAPP_PATTERNS = {
    "greeting": {
        "patterns": ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
        "response": "Hey there! 🐾 I'm Mira, your pet concierge from The Doggy Company! How can I help you and your furry friend today?\n\nYou can ask me about:\n🛒 Products & treats\n📅 Bookings (grooming, vet, daycare)\n🎂 Birthday celebrations\n❓ Any pet questions!"
    },
    "order": {
        "patterns": ["order", "buy", "treats", "food", "shop", "product"],
        "response": "I'd love to help you order something special! 🛍️\n\n👉 Visit our shop: https://thedoggycompany.com/shop\n\nOr tell me what you're looking for - treats, food, toys? I'll find the perfect match for your pup! 🐕"
    },
    "grooming": {
        "patterns": ["groom", "grooming", "bath", "haircut", "spa"],
        "response": "Time for a spa day! ✂️🛁\n\nI can help you book grooming at our partner salons. Just tell me:\n1️⃣ Your pet's name\n2️⃣ Preferred date\n3️⃣ Your location\n\nOr book directly: https://thedoggycompany.com/care?type=grooming"
    },
    "vet": {
        "patterns": ["vet", "doctor", "vaccine", "vaccination", "health", "sick", "medicine"],
        "response": "Your pet's health is our priority! 💊\n\nFor vet appointments:\n👉 https://thedoggycompany.com/care?type=vet\n\n🚨 For emergencies, call our 24/7 helpline!\n\nWhat's going on with your furry friend? I'm here to help! 🐾"
    },
    "birthday": {
        "patterns": ["birthday", "party", "cake", "celebration", "celebrate"],
        "response": "Aww, someone has a birthday coming up! 🎂🎉\n\nWe have:\n🎂 Custom pet cakes\n🎈 Party supplies\n🎁 Birthday boxes\n\nCheck them out: https://thedoggycompany.com/celebrate\n\nWhen's the big day? I'll help you plan the pawfect party! 🐕"
    },
    "stay": {
        "patterns": ["boarding", "stay", "daycare", "hotel", "travel", "vacation"],
        "response": "Planning to travel or need pet care? 🏨\n\nWe offer:\n🏠 Boarding & daycare\n✈️ Pet-friendly travel help\n🐕 Dog walking\n\nExplore options: https://thedoggycompany.com/stay\n\nTell me more about what you need!"
    },
    "membership": {
        "patterns": ["member", "membership", "pass", "join", "pet pass", "soul"],
        "response": "Great question! 🌟\n\nThe Pet Pass gives you:\n✨ Access to all 14 life pillars\n💎 Paw Points rewards\n🎁 Exclusive offers\n📱 Personal concierge (that's me!)\n\nJoin here: https://thedoggycompany.com/pet-soul-onboard\n\nWant me to explain more?"
    },
    "help": {
        "patterns": ["help", "support", "issue", "problem", "complaint"],
        "response": "I'm here to help! 💜\n\nYou can:\n📞 Call us: +91 96631 85747\n💬 Chat right here\n📧 Email: hello@thedoggycompany.com\n\nWhat's on your mind? I'll do my best to solve it! 🐾"
    },
    "thanks": {
        "patterns": ["thank", "thanks", "awesome", "great", "perfect"],
        "response": "You're so welcome! 💕 Taking care of pets is what I love most!\n\nAnything else I can help with? I'm always here! 🐕‍🦺"
    },
    "bye": {
        "patterns": ["bye", "goodbye", "see you", "later"],
        "response": "Bye for now! 👋 Give your furry friend a belly rub from me! 🐾\n\nI'm available 24/7 - just message anytime! 💜"
    }
}

MIRA_DEFAULT_RESPONSE = """Hi there! 🐾 I'm Mira from The Doggy Company!

I can help you with:
🛒 Order treats & products
✂️ Book grooming
💊 Vet appointments
🎂 Birthday celebrations
🏨 Boarding & daycare

💡 Tip: Start your message with your dog's name — e.g. 'Mystique needs grooming help' — and I'll focus on them.

Just tell me what you need! Or visit: https://thedoggycompany.com

What would you like help with today? 🐕"""


def _build_amazon_query(raw_query: str, pet_names: list = None) -> str:
    """Mirror of MiraSearchPage.jsx buildAmazonQuery — strips pet names + filler for clean Amazon search."""
    import re
    q = raw_query or ""
    # Strip known pet names
    known_names = ['mojo','mahi','meister','mercury','bruno','buddy','coco','mystique',
                   'chang','mynx','miracle','mars','moon','mia','magica','maya','max','loco','badmash','sultan']
    if pet_names:
        known_names += [n.lower() for n in pet_names if n]
    for name in known_names:
        q = re.sub(r'\b' + re.escape(name) + r'\b', ' ', q, flags=re.IGNORECASE)
    # Strip conversational filler
    q = re.sub(r'\b(i want|i need|find me|get me|show me|looking for|can you find|please|'
               r'help me find|what about|is there|do you have|do you sell|where can i get|'
               r'where can i find|wants?|needs?|loves?|would like|my dog|my pet|my pup|'
               r'my puppy|for my|for him|for her|for them|a good|the best|some|any|'
               r'book|groomer|grooming|near me|nearby|suggest|recommend)\b', ' ', q, flags=re.IGNORECASE)
    q = re.sub(r'\b(a|an|the|for|of|with|in|on|at|to|and|or|but|my|your|his|her|their|our)\b', ' ', q, flags=re.IGNORECASE)
    q = re.sub(r'\s{2,}', ' ', q).strip()
    return q or raw_query


def _detect_near_me(text: str) -> bool:
    """Detect if user wants nearby services / locations."""
    import re
    patterns = [r'\bnear\s+me\b', r'\bnearby\b', r'\bnear\s+by\b', r'\bclose\s+to\s+me\b',
                r'\bin\s+(mumbai|delhi|bangalore|bengaluru|pune|chennai|hyderabad|kolkata|'
                r'gurgaon|noida|jaipur|ahmedabad|surat|lucknow|chandigarh|indore)\b',
                r'\baround\s+me\b', r'\bfind.*near\b', r'\blocal\b', r'\bmy\s+city\b',
                r'\bmy\s+area\b', r'\bwhere.*find\b']
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in patterns)


async def get_mira_ai_response(message_text: str, user_name: str = "friend", user_phone: str = None) -> str:
    """
    Mira WhatsApp Intelligence — same brain as Mira Search.
    
    Pipeline:
      1. Load full pet soul profile (allergies, breed, energy, favorites)
      2. Run semantic search → real products + prices from TDC catalog
      3. Apply allergen filtering in system prompt
      4. Amazon affiliate fallback if 0 catalog results
      5. NearMe → Google Maps link
      6. Always: Concierge CTA
      7. Ticket + admin notification handled by webhook (handoff_to_spine)
    """
    import os, re
    from motor.motor_asyncio import AsyncIOMotorClient

    AFFILIATE_TAG  = os.environ.get("AMAZON_AFFILIATE_TAG", "thedoggyco-21")
    EMERGENT_KEY   = os.environ.get("EMERGENT_LLM_KEY", "")
    mongo_url      = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name        = os.environ.get("DB_NAME", "test_database")

    _client = AsyncIOMotorClient(mongo_url)
    db = _client[db_name]

    # ── 1. Load full soul profile ─────────────────────────────────────────────
    context_parts        = []
    all_pet_names        = []
    all_allergies        = []
    all_conditions       = []   # ← health conditions across all pets
    all_favorites        = []
    pet_city             = None
    user_email           = None
    active_pet_archetype = None   # ← set later if pet profile found
    ticket_pet_name      = None   # ← set if open ticket with pet lock
    member_name          = None   # ← set if registered member found
    _wa_pet_breed        = ""     # ← active pet's breed for product breed filtering

    if db is not None and user_phone:
        try:
            phone_clean = ''.join(filter(str.isdigit, str(user_phone)))
            if len(phone_clean) == 12 and phone_clean.startswith('91'):
                phone_clean = phone_clean[2:]

            # Always use last 10 digits for ticket lookup (tickets store phone_10 without leading 0)
            phone_10 = phone_clean[-10:]

            # ── 0. wa_pet_state: user's EXPLICIT pet selection — checked FIRST, wins over everything ──
            # This mirrors the widget's pet-chip selector. Once a user picks Mojo, all messages
            # stay on Mojo until the session expires (30 min idle) or they pick a new pet.
            _wa_active_pet = None
            _wa_pre = None
            try:
                _wa_pre = await db.wa_pet_state.find_one({"phone": phone_10})
                if _wa_pre and _wa_pre.get("active_pet") and not _wa_pre.get("awaiting_pet_selection"):
                    _ts = _wa_pre.get("updated_at")
                    _age_ok = False  # SAFE DEFAULT: expired unless proven fresh
                    if _ts:
                        try:
                            _dt = datetime.fromisoformat(_ts) if isinstance(_ts, str) else _ts
                            if _dt.tzinfo is None:
                                _dt = _dt.replace(tzinfo=timezone.utc)
                            _age_min = (datetime.now(timezone.utc) - _dt).total_seconds() / 60
                            _age_ok = _age_min <= 30
                            if not _age_ok:
                                # Auto-clear the stale record
                                await db.wa_pet_state.delete_one({"phone": phone_10})
                                print(f"[MIRA-WA-DEBUG] Cleared stale wa_pet_state for {phone_10} (age={_age_min:.1f}min)", flush=True)
                        except Exception:
                            _age_ok = False  # Parse error → treat as expired
                    else:
                        # No timestamp → definitely stale, delete it
                        await db.wa_pet_state.delete_one({"phone": phone_10})
                        print(f"[MIRA-WA-DEBUG] Cleared no-timestamp wa_pet_state for {phone_10}", flush=True)
                    if _age_ok:
                        _wa_active_pet = _wa_pre["active_pet"]
                        print(f"[MIRA-WA-DEBUG] wa_pet_state VALID: active_pet='{_wa_active_pet}'", flush=True)
                        logger.info(f"[MIRA-AI] wa_pet_state → active pet '{_wa_active_pet}' (user's explicit selection)")
            except Exception:
                pass

            # ── 1a. Check open ticket → but wa_pet_state.active_pet always wins ──
            ticket_pet_name = _wa_active_pet  # Pre-seed from explicit user selection if available
            open_ticket = await db.service_desk_tickets.find_one(
                {
                    "$or": [
                        {"user_phone": {"$regex": phone_10}},
                        {"member.phone": {"$regex": phone_10}},
                        {"member.whatsapp": {"$regex": phone_10}},
                    ],
                    "status": {"$nin": ["closed", "resolved"]},
                },
                sort=[("updated_at", -1)],
            )
            if open_ticket and not _wa_active_pet:
                # Only use ticket's pet lock if the user hasn't explicitly chosen one this session
                ticket_pet_name = open_ticket.get("pet_name")
                if ticket_pet_name:
                    logger.info(f"[MIRA-AI] Ongoing ticket → pet '{ticket_pet_name}' (no wa_pet_state override)")

            # ── Smart user lookup: normalize phone variants to avoid test-account collision ──
            # phone_10 = last 10 digits (e.g. "9739908844").
            # Stored phones may include leading 0 ("09739908844") or country code ("919739908844").
            # Fetch all regex candidates, then score: prefer users whose stored phone
            # is LONGER than 10 digits (has a prefix → real formatted number, not a bare 10-digit test entry).
            _user_candidates = await db.users.find(
                {"$or": [
                    {"phone": {"$regex": phone_10 + "$"}},    # end-anchored: 9739908844 or 09739908844
                    {"whatsapp": {"$regex": phone_10 + "$"}},
                    {"phone": user_phone}, {"whatsapp": user_phone},
                ]},
                {"_id": 1, "email": 1, "name": 1, "parent_name": 1, "membership": 1, "city": 1, "phone": 1, "whatsapp": 1}
            ).to_list(10)

            def _phone_score(u):
                """Score users for phone match quality.
                Priority: exact 10-digit match (100) > prefixed match by length > no match (0).
                Exact 10-digit match wins because the WhatsApp number IS the bare 10-digit number.
                """
                for fld in ("phone", "whatsapp"):
                    stored = "".join(filter(str.isdigit, str(u.get(fld) or "")))
                    if stored == phone_10:          # e.g. "9739908844" — exact match, highest
                        return 100
                    if stored.endswith(phone_10) and len(stored) > len(phone_10):
                        return len(stored)          # e.g. "09739908844" → score 11
                return 0

            if _user_candidates:
                _user_candidates.sort(key=_phone_score, reverse=True)
            user = _user_candidates[0] if _user_candidates else None

            if user:
                user_email = user.get("email")
                user_name  = user.get("name") or user.get("parent_name") or user_name
                pet_city   = user.get("city")

                membership = user.get("membership", {})
                if membership.get("tier"):
                    context_parts.append(f"Member tier: {membership['tier']}")

                # ── 1b. Detect/switch active pet using fuzzy match — always runs ──
                # Uses _fuzzy_pet_match so "Mystique" matches even if message says "what about Mystique?"
                # Critically: runs even when ticket_pet_name is set — allows mid-conversation pet switching.
                # Also checks the open ticket's owner email so admin/linked accounts find cross-account pets.
                _ticket_email = (open_ticket.get("user_email") or "") if open_ticket else ""
                _all_candidate_emails = list({u.get("email") for u in _user_candidates if u.get("email")})
                _pet_lookup_emails = list(set(filter(None, _all_candidate_emails + [_ticket_email])))
                _quick_pets = await db.pets.find(
                    {"owner_email": {"$in": _pet_lookup_emails}} if _pet_lookup_emails else {},
                    {"_id": 0, "name": 1}
                ).to_list(20)
                _quick_pet_names = [p["name"] for p in _quick_pets if p.get("name")]
                _msg_pet = _fuzzy_pet_match(message_text, _quick_pet_names)
                if _msg_pet:
                    if not ticket_pet_name:
                        # No lock yet — set it from the message
                        ticket_pet_name = _msg_pet
                        logger.info(f"[MIRA-AI] Pet '{_msg_pet}' detected in message (fuzzy) → locked as active pet")
                    elif _msg_pet.lower() != ticket_pet_name.lower():
                        # Different pet name detected — user is switching context ("What about Mystique?")
                        logger.info(f"[MIRA-AI] Pet switch: '{ticket_pet_name}' → '{_msg_pet}' (fuzzy match in message)")
                        ticket_pet_name = _msg_pet
                        # Persist switch so subsequent messages stay on the new pet
                        if phone_10:
                            try:
                                await db.wa_pet_state.update_one(
                                    {"phone": phone_10},
                                    {"$set": {
                                        "phone": phone_10,
                                        "active_pet": ticket_pet_name,
                                        "updated_at": datetime.now(timezone.utc).isoformat(),
                                        "awaiting_pet_selection": False,
                                    }},
                                    upsert=True
                                )
                            except Exception:
                                pass

                    # ── Early return: pure pet-switch with no other request ────────────
                    # e.g. "oh its about Mystique" / "actually Badmash" / "what about Sultan?"
                    # Skip catalog search entirely — prevents Amazon fallback for switch messages
                    # BUT: do NOT fire if user is answering the "which dog?" disambiguation question
                    _is_answering_disambig = bool(
                        (_wa_pre and _wa_pre.get("awaiting_pet_selection")) or
                        (open_ticket and open_ticket.get("wa_awaiting_pet_selection") if open_ticket else False)
                    )
                    if not _is_answering_disambig and _is_pet_switch_only(message_text, _msg_pet):
                        _switch_reply = (
                            f"Got it! Focusing on {_msg_pet} now. 🐾 "
                            f"What would you like to explore for them?"
                        )
                        await _wa_save_history(db, phone_10, message_text, _switch_reply)
                        logger.info(f"[MIRA-AI] Pure pet-switch detected → early return for '{_msg_pet}'")
                        return _switch_reply

                # ── Multi-account linking ────────────────────────────────────────
                # A user may have registered with two emails (e.g. work + personal).
                # Find all accounts with the same name and collect pets from ALL of them.
                # Cast the widest net: include ALL user accounts that matched this phone number.
                # This handles split accounts (e.g. dipali@clubconcierge.in vs dipali.sikand1965@gmail.com
                # both matching 9739908844) so pets registered under either email are always found.
                all_owner_emails = list({u.get("email") for u in _user_candidates if u.get("email")})
                if not all_owner_emails:
                    all_owner_emails = [user_email]
                print(f"[MIRA-DEBUG] all_owner_emails={all_owner_emails}", flush=True)
                logger.info(f"[MIRA-AI] Pet lookup across {len(all_owner_emails)} account(s): {all_owner_emails}")

                # Full soul profile for each pet — across ALL linked accounts
                pets = await db.pets.find(
                    {"owner_email": {"$in": all_owner_emails}},
                    {"_id": 0, "name": 1, "breed": 1, "date_of_birth": 1,
                     "allergies": 1, "health_conditions": 1, "doggy_soul_answers": 1,
                     "favorite_foods": 1, "weight": 1, "life_stage": 1, "city": 1,
                     "archetype": 1}
                ).to_list(20)

                if pets:
                    # ── 1b. Pin the conversation pet to the front ─────────────────
                    # If ticket told us which pet this conversation is about, sort it first.
                    if ticket_pet_name:
                        pets.sort(
                            key=lambda p: 0 if p.get("name", "").lower() == ticket_pet_name.lower() else 1
                        )

                    pet_lines = []
                    active_pet_archetype = None   # ← archetype of the dog being discussed
                    for idx, p in enumerate(pets):
                        name   = p.get("name", "Unknown")
                        breed  = p.get("breed", "Unknown breed")
                        stage  = p.get("life_stage", "")
                        weight = p.get("weight")
                        all_pet_names.append(name)
                        if p.get("city") and not pet_city:
                            pet_city = p["city"]

                        # Allergies
                        raw_allergies = p.get("allergies") or []
                        if isinstance(raw_allergies, str):
                            raw_allergies = [a.strip() for a in raw_allergies.split(",") if a.strip()]
                        soul = p.get("doggy_soul_answers", {})
                        soul_allergies = soul.get("food_allergies", "")
                        # soul_allergies may be a list OR a string
                        if isinstance(soul_allergies, list):
                            raw_allergies += [a.strip() for a in soul_allergies if a.strip()]
                        elif soul_allergies and str(soul_allergies).lower() not in ("none", "no", ""):
                            raw_allergies += [a.strip() for a in str(soul_allergies).split(",") if a.strip()]
                        pet_allergies = list({a.lower() for a in raw_allergies if str(a).lower() not in ("none", "")})
                        if pet_allergies:
                            all_allergies += pet_allergies

                        # Health conditions
                        pet_conditions = get_conditions_for_pet(p)
                        if pet_conditions:
                            all_conditions += pet_conditions

                        # Favorites — captured per-pet so we can scope to active dog later
                        favs = p.get("favorite_foods") or soul.get("treat_preference", "")
                        pet_fav_list = []
                        if favs:
                            pet_fav_list = favs if isinstance(favs, list) else [f.strip() for f in favs.split(",") if f.strip()]
                            all_favorites += pet_fav_list

                        # ── Archetype — capture from active pet only ─────────────────
                        is_active_pet = (idx == 0) or (
                            ticket_pet_name and name.lower() == ticket_pet_name.lower()
                        )
                        if is_active_pet and not active_pet_archetype:
                            # Capture breed for product breed filtering (first / active pet only)
                            if not _wa_pet_breed:
                                _wa_pet_breed = p.get("breed", "")
                            # primary_archetype at top level (written by infer_archetype.py), fall back to archetype/soul_answers
                            arch_raw = p.get("primary_archetype") or p.get("archetype") or soul.get("primary_archetype") or ""
                            if isinstance(arch_raw, dict):
                                active_pet_archetype = arch_raw.get("primary_archetype", "")
                            else:
                                active_pet_archetype = str(arch_raw) if arch_raw else ""

                        # Build pet summary line
                        line = f"{name} ({breed}"
                        if stage: line += f", {stage}"
                        if weight: line += f", {weight}kg"
                        line += ")"
                        if pet_allergies:
                            line += f" — ALLERGIC TO: {', '.join(pet_allergies)}"
                        if pet_fav_list:
                            line += f" | Favourites: {', '.join(pet_fav_list)}"
                        # Energy / personality from soul answers
                        energy = soul.get("energy_level", "")
                        if energy: line += f" | Energy: {energy}"
                        # Mark the active conversation pet
                        if idx == 0 and ticket_pet_name and name.lower() == ticket_pet_name.lower():
                            line += " ← ACTIVE (this conversation is about this dog)"
                        pet_lines.append(line)

                    # ── 1c. Only expose the active pet to GPT when conversation is ongoing ───
                    # If we know which pet this conversation is about, hide all other pets
                    # so GPT cannot mention them (fixes Sultan/Badmash confusion).
                    if ticket_pet_name:
                        active_lines = [l for l in pet_lines if ticket_pet_name.lower() in l.lower()]
                        active_line  = active_lines[0] if active_lines else pet_lines[0]
                        context_parts.append(f"Dog in this conversation: {active_line}")
                        context_parts.append(
                            f"RULE: This conversation is ONLY about {ticket_pet_name}. "
                            f"Never name or reference any other dog."
                        )
                        # Scope favorites to the ACTIVE pet only (prevent cross-dog contamination)
                        active_pet_favs = [
                            f for f in all_favorites
                            if any(f.lower() in l.lower() for l in active_lines)
                        ]
                        # Fallback: extract favorites directly from active_line
                        if not active_pet_favs and "Favourites:" in active_line:
                            fav_section = active_line.split("Favourites:")[-1].split("|")[0].strip()
                            active_pet_favs = [f.strip() for f in fav_section.split(",") if f.strip()]
                        if active_pet_favs:
                            context_parts.append(f"{ticket_pet_name}'s favourites: {', '.join(active_pet_favs)}")
                    else:
                        context_parts.append(f"Dogs: {' | '.join(pet_lines)}")
                        if all_favorites:
                            context_parts.append(f"Favorite treats across all dogs: {', '.join(set(all_favorites))}")

                # Recent tickets — only include when NO active pet lock (avoid leaking other pet names)
                if not ticket_pet_name:
                    recent_tickets = await db.service_desk_tickets.find(
                        {"$or": [{"member.email": user_email}, {"member.phone": {"$regex": phone_clean}}]},
                        {"_id": 0, "subject": 1, "description": 1, "status": 1, "pillar": 1}
                    ).sort("created_at", -1).limit(2).to_list(2)

                    if recent_tickets:
                        t_lines = [f"{t.get('subject', t.get('pillar',''))[:40]} ({t.get('status','open')})" for t in recent_tickets]
                        context_parts.append(f"Recent requests: {'; '.join(t_lines)}")

        except Exception as ctx_err:
            logger.warning(f"[MIRA-AI] Context fetch error: {ctx_err}")

    # ── 1d. Fallback pet lookup via ticket email (when user not matched by phone) ──
    # This fires when the user's DB record has no phone stored, so _user_candidates=[].
    # We recover by looking up pets via the open ticket's user_email.
    if not all_pet_names and db is not None:
        _fallback_email = None
        if open_ticket:
            _fallback_email = (
                open_ticket.get("user_email") or
                (open_ticket.get("member") or {}).get("email")
            )
        if _fallback_email:
            try:
                _fb_pets = await db.pets.find(
                    {"owner_email": _fallback_email},
                    {"_id": 0, "name": 1}
                ).to_list(20)
                all_pet_names = [p.get("name") for p in _fb_pets if p.get("name")]
                if not user_email:
                    user_email = _fallback_email
                print(f"[MIRA-WA-DEBUG] Fallback: {len(all_pet_names)} pets via ticket email={_fallback_email}: {all_pet_names}", flush=True)
                # Also auto-save phone to user record so future lookups work
                if phone_10 and _fallback_email:
                    try:
                        await db.users.update_one(
                            {"email": _fallback_email},
                            {"$set": {"phone": phone_10, "whatsapp": str(user_phone)}}
                        )
                        print(f"[MIRA-WA-DEBUG] Auto-saved phone={phone_10} to user {_fallback_email}", flush=True)
                    except Exception:
                        pass
            except Exception as _fb_err:
                print(f"[MIRA-WA-DEBUG] Fallback pet lookup failed: {_fb_err}", flush=True)

    # ── 2. Detect near-me intent ──────────────────────────────────────────────
    is_near_me = _detect_near_me(message_text)

    # ── 2a. Stale ticket guard — if ticket pet no longer exists, ignore it ────
    if ticket_pet_name and all_pet_names:
        if ticket_pet_name.lower() not in [n.lower() for n in all_pet_names]:
            logger.info(f"[MIRA-AI] Stale ticket pet '{ticket_pet_name}' not in user's pets {all_pet_names} — ignoring lock")
            ticket_pet_name = None

    # ── 2b. Multi-pet disambiguation — ask which dog before doing anything ────
    # Only triggers when: user has 2+ pets AND no pet name in message AND no open ticket
    first_name = (user_name or "friend").split()[0]

    # ── 2b-i. Check if we already ASKED "which dog?" on the previous message ──
    # Uses wa_pet_state (phone-keyed) so state is saved even when no ticket exists yet.
    wa_state = None
    if db is not None and phone_10:
        try:
            wa_state = await db.wa_pet_state.find_one({"phone": phone_10})
            # Clear stale state older than 30 minutes
            if wa_state:
                state_ts = wa_state.get("updated_at")
                if state_ts:
                    try:
                        state_dt = datetime.fromisoformat(state_ts) if isinstance(state_ts, str) else state_ts
                        if state_dt.tzinfo is None:
                            state_dt = state_dt.replace(tzinfo=timezone.utc)
                        age_min = (datetime.now(timezone.utc) - state_dt).total_seconds() / 60
                        if age_min > 30:
                            await db.wa_pet_state.delete_one({"phone": phone_10})
                            wa_state = None
                    except Exception:
                        # Bad timestamp → clear it
                        await db.wa_pet_state.delete_one({"phone": phone_10})
                        wa_state = None
                else:
                    # No timestamp → definitely stale, clear it
                    await db.wa_pet_state.delete_one({"phone": phone_10})
                    wa_state = None
        except Exception as e:
            logger.warning(f"[MIRA-AI] wa_pet_state fetch error: {e}")

    awaiting_selection = (
        (wa_state and wa_state.get("awaiting_pet_selection")) or
        (open_ticket and open_ticket.get("wa_awaiting_pet_selection"))
    )

    if awaiting_selection and len(all_pet_names) > 1:
        # Handle numeric reply (user types "1" or "2" from the widget-style numbered list)
        _num_match = None
        _stripped = message_text.strip()
        if _stripped.isdigit():
            _idx = int(_stripped) - 1
            if 0 <= _idx < len(all_pet_names):
                _num_match = all_pet_names[_idx]
        matched = _num_match or _fuzzy_pet_match(message_text, all_pet_names)
        if matched:
            ticket_pet_name = matched
            original_msg = (
                (wa_state.get("original_message") if wa_state else None) or
                (open_ticket.get("wa_original_message") if open_ticket else None) or
                message_text
            )
            logger.info(f"[MIRA-AI] Pet selection resolved: '{message_text}' → '{matched}' | original: '{original_msg[:60]}'")
            # ── Fix B: Ticket routing — don't contaminate the existing ticket ──
            # If resolved pet ≠ open ticket's pet (e.g. Mojo ≠ Sultan),
            # leave Sultan's ticket clean and create/find a fresh Mojo ticket.
            try:
                if db is not None and phone_10:
                    # Save the resolved pet as the active selection so future messages stay locked
                    await db.wa_pet_state.update_one(
                        {"phone": phone_10},
                        {"$set": {
                            "phone": phone_10,
                            "active_pet": matched,
                            "awaiting_pet_selection": False,
                            "original_message": None,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }},
                        upsert=True,
                    )
                    _wa_active_pet = matched  # keep in-memory state in sync

                if open_ticket:
                    existing_ticket_pet = (open_ticket.get("pet_name") or "").strip()
                    same_pet = (not existing_ticket_pet) or (existing_ticket_pet.lower() == matched.lower())

                    if same_pet:
                        # Same pet or no pet locked — update ticket normally
                        await db.service_desk_tickets.update_one(
                            {"_id": open_ticket["_id"]},
                            {"$set": {"pet_name": matched,
                                      "wa_awaiting_pet_selection": False,
                                      "wa_original_message": None}}
                        )
                        logger.info(f"[MIRA-AI] Fix B: Updated existing ticket for '{matched}' (same pet)")
                    else:
                        # Different pet — leave existing ticket untouched ─────────────────
                        # Find or create a fresh ticket for the resolved pet
                        # Also clear the awaiting flag on the OLD ticket so it stops hijacking
                        await db.service_desk_tickets.update_one(
                            {"_id": open_ticket["_id"]},
                            {"$set": {"wa_awaiting_pet_selection": False, "wa_original_message": None}}
                        )
                        logger.info(f"[MIRA-AI] Fix B: Resolved pet '{matched}' ≠ ticket pet '{existing_ticket_pet}' — routing to clean ticket")
                        mojo_ticket = await db.service_desk_tickets.find_one(
                            {
                                "$or": [
                                    {"user_phone": {"$regex": phone_10 + "$"}},
                                    {"member.phone": {"$regex": phone_10 + "$"}},
                                ],
                                "pet_name": matched,
                                "status": {"$nin": ["closed", "resolved"]},
                            },
                            sort=[("created_at", -1)],
                        )
                        if not mojo_ticket:
                            # Create a brand-new service_desk_ticket for the resolved pet
                            now_iso = datetime.now(timezone.utc).isoformat()
                            new_tid = f"WA-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
                            # Get pet allergies for the briefing card
                            pet_doc = await db.pets.find_one(
                                {"name": matched, "owner_email": user_email},
                                {"_id": 0, "name": 1, "breed": 1, "allergies": 1}
                            ) if user_email else None
                            allergies = pet_doc.get("allergies", []) if pet_doc else []
                            if isinstance(allergies, str):
                                allergies = [a.strip() for a in allergies.split(",") if a.strip()]
                            allergy_brief = (f"🔴 ALLERGY ALERT: No {', '.join(allergies)} in ANY product"
                                            if allergies else None)
                            new_sd = {
                                "id": new_tid,
                                "ticket_id": new_tid,
                                "type": "whatsapp_inquiry",
                                "category": "support",
                                "subject": f"WhatsApp: {matched} — {original_msg[:60]}",
                                "description": original_msg,
                                "status": "open",
                                "priority": "normal",
                                "channel": "whatsapp",
                                "source": "whatsapp",
                                "pillar": "support",
                                "pet_name": matched,
                                "member": {
                                    "name": user_name,
                                    "phone": str(user_phone),
                                    "whatsapp": str(user_phone),
                                },
                                "user_phone": str(user_phone),
                                "user_name": user_name,
                                "user_email": user_email,
                                "allergy_alert": allergy_brief,
                                "mira_briefing": allergy_brief,
                                "conversation": [],
                                "has_unread_member_reply": True,
                                "created_at": now_iso,
                                "updated_at": now_iso,
                                "assigned_to": None,
                            }
                            await db.service_desk_tickets.insert_one(new_sd)
                            mojo_ticket = new_sd
                            logger.info(f"[MIRA-AI] Fix B: Created fresh ticket {new_tid} for '{matched}'")
                        # Redirect get_mira_ai_response to use the correct ticket going forward
                        open_ticket = mojo_ticket

            except Exception as fix_b_err:
                logger.warning(f"[MIRA-AI] Fix B ticket routing error: {fix_b_err}")
            message_text = original_msg  # answer the ORIGINAL question about the matched pet
        else:
            # Real question but no pet selected yet — re-show picker with their question as context
            first_name = (user_name or "there").split()[0]
            lines = [f"I'd love to help! 🐾 Which of your dogs are we focusing on today?"]
            for i, name in enumerate(all_pet_names[:5], 1):
                lines.append(f"{i}. {name}")
            if len(all_pet_names) > 5:
                lines.append(f"...and {len(all_pet_names) - 5} more")
            lines.append("\nJust reply with their name (or number) and I'll answer your question for them!")
            return "\n".join(lines)

    # ── 2b-ii. Widget-style pet picker — ask FIRST if no explicit selection this session ──
    # Fires whenever the user has multiple pets and hasn't explicitly chosen one via wa_pet_state.
    # ONE-LINE FIX: Nullify any ticket-inherited pet so stale tickets can NEVER bypass the picker.
    if not _wa_active_pet and len(all_pet_names) > 1:
        ticket_pet_name = None  # user must confirm their dog — ticket context is irrelevant
        shown = all_pet_names[:4]
        if len(all_pet_names) > 4:
            pet_list = ", ".join(shown[:-1]) + f", {shown[-1]} (or {len(all_pet_names) - 4} more)"
        else:
            pet_list = ", ".join(shown[:-1]) + " or " + shown[-1]
        logger.info(f"[MIRA-AI] Multi-pet disambiguation → asking which dog ({pet_list})")
        # Save state to phone-keyed collection (works even before any ticket is created)
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            if db is not None and phone_10:
                await db.wa_pet_state.update_one(
                    {"phone": phone_10},
                    {"$set": {
                        "phone": phone_10,
                        "awaiting_pet_selection": True,
                        "original_message": message_text,
                        "updated_at": now_iso,
                    }},
                    upsert=True,
                )
            # Also mark open ticket if one exists (backward-compat)
            if open_ticket:
                await db.service_desk_tickets.update_one(
                    {"_id": open_ticket["_id"]},
                    {"$set": {"wa_awaiting_pet_selection": True,
                              "wa_original_message": message_text}}
                )
        except Exception as e:
            logger.warning(f"[MIRA-AI] Failed to save pet disambiguation state: {e}")

        # Widget-style numbered pet list
        lines = [f"Hey {first_name}! 🐾 Which of your dogs are we focusing on today?"]
        for i, name in enumerate(all_pet_names[:5], 1):
            lines.append(f"{i}. {name}")
        lines.append("\nJust reply with their name (or number) and I'll pick up right where we left off!")
        return "\n".join(lines)

    # ── 3. Semantic search → real TDC products ────────────────────────────────
    catalog_block  = ""
    amazon_url     = ""
    near_me_block  = ""
    found_products = []
    found_services = []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "http://localhost:8001/api/mira/semantic-search",
                json={"query": message_text, "limit": 4,
                      "pet_allergies": all_allergies if all_allergies else None}
            )
            if resp.status_code == 200:
                data = resp.json()
                found_products = data.get("products", [])[:4]
                found_services = data.get("services", [])[:2]
    except Exception as search_err:
        logger.warning(f"[MIRA-AI] Semantic search failed: {search_err}")

    # ── 3b. Broad fallback — direct DB query with pillar filter ──────────────
    # When semantic search returns 0 (intent not recognised), find closest real
    # products by filtering to the likely pillar. Avoids food/dental contamination.
    closest_products = []
    if not found_products:
        try:
            msg_lower = message_text.lower()
            # Detect likely pillar from query keywords
            if any(w in msg_lower for w in ['birthday', 'outfit', 'costume', 'dress', 'bandana',
                                             'clothes', 'cape', 'hat', 'party', 'cake', 'celebrate']):
                fallback_pillars = ["celebrate", "shop"]
            elif any(w in msg_lower for w in ['groom', 'shampoo', 'brush', 'trim', 'bath']):
                fallback_pillars = ["care", "shop"]
            elif any(w in msg_lower for w in ['toy', 'ball', 'rope', 'fetch', 'puzzle', 'chew']):
                fallback_pillars = ["play", "shop"]
            elif any(w in msg_lower for w in ['leash', 'harness', 'collar', 'lead', 'walk']):
                fallback_pillars = ["go", "shop"]
            else:
                fallback_pillars = ["shop"]

            # Extract meaningful keywords (skip stop words + known pet names)
            stop = {'what', 'for', 'the', 'can', 'have', 'need', 'want', 'looking',
                    'find', 'get', 'give', 'some', 'any', 'him', 'her', 'my', 'our'}
            skip_names = {n.lower() for n in all_pet_names}
            kws = [w for w in msg_lower.split() if len(w) > 3
                   and w not in stop and w not in skip_names]
            kw_regex = "|".join(kws[:3]) if kws else "accessories"

            fallback_cursor = db.products_master.find(
                {
                    "pillar": {"$in": fallback_pillars},
                    "is_active": True,
                    "$or": [
                        {"name": {"$regex": kw_regex, "$options": "i"}},
                        {"tags": {"$regex": kw_regex, "$options": "i"}},
                    ]
                },
                {"_id": 0, "id": 1, "name": 1, "original_price": 1, "price": 1,
                 "pillar": 1, "cloudinary_url": 1, "image_url": 1}
            ).limit(2)
            closest_products = await fallback_cursor.to_list(2)
            # ── Breed safety filter on fallback results ───────────────────────
            closest_products = [p for p in closest_products if not has_wrong_breed_for_pet(p, _wa_pet_breed)]
            if closest_products:
                logger.info(f"[MIRA-AI] Pillar fallback ({fallback_pillars}) → {len(closest_products)} product(s)")
        except Exception as fb_err:
            logger.warning(f"[MIRA-AI] Broad fallback error: {fb_err}")

    # Build catalog block from real products
    if found_products:
        # ── Breed safety filter: never recommend a wrong-breed product ────────
        before_breed = len(found_products)
        found_products = [p for p in found_products if not has_wrong_breed_for_pet(p, _wa_pet_breed)]
        if len(found_products) < before_breed:
            logger.info(f"[MIRA-AI] Breed filter ({_wa_pet_breed}): {before_breed} → {len(found_products)} products")

        prod_lines = []
        for p in found_products:
            price = p.get("original_price") or p.get("price", 0)
            pillar = p.get("pillar", "")
            name   = p.get("name", "")
            link   = f"thedoggycompany.com/{pillar}" if pillar else "thedoggycompany.com"
            prod_lines.append(f"- {name} — ₹{int(price) if price else 'POA'} → {link}")
        catalog_block = "FROM OUR CATALOG:\n" + "\n".join(prod_lines)

    if found_services:
        svc_lines = [f"- {s.get('name','')} ({s.get('pillar','')})" for s in found_services]
        if catalog_block:
            catalog_block += "\n\nSERVICES:\n" + "\n".join(svc_lines)
        else:
            catalog_block = "SERVICES:\n" + "\n".join(svc_lines)

    # Amazon fallback — always build it (shown if 0 TDC results OR appended)
    clean_q    = _build_amazon_query(message_text, all_pet_names)
    amazon_url = f"https://www.amazon.in/s?k=dog+{clean_q.replace(' ', '+')}&tag={AFFILIATE_TAG}"

    # NearMe block
    if is_near_me:
        city_q     = pet_city or "near me"
        groom_q    = message_text.lower()
        if "groom" in groom_q:      maps_q = f"dog groomer in {city_q}"
        elif "vet" in groom_q:      maps_q = f"dog vet clinic in {city_q}"
        elif "train" in groom_q:    maps_q = f"dog training in {city_q}"
        elif "board" in groom_q or "stay" in groom_q: maps_q = f"dog boarding in {city_q}"
        elif "walker" in groom_q or "walk" in groom_q: maps_q = f"dog walker in {city_q}"
        else:                       maps_q = f"dog service in {city_q}"
        maps_url   = f"https://maps.google.com/search?q={maps_q.replace(' ', '+')}"
        near_me_block = f"\n\n📍 Find nearby:\n{maps_url}"

    # ── 4. Build system prompt with full intelligence ─────────────────────────
    context_block = ""
    if context_parts:
        context_block = "\n\nMEMBER PROFILE:\n" + "\n".join(f"• {c}" for c in context_parts)

    allergen_rule = ""
    if all_allergies:
        allergen_rule = f"\n\n🚨 ALLERGEN ALERT: NEVER recommend products containing {', '.join(set(all_allergies))}. This is non-negotiable."

    condition_rule = build_condition_rule(list(set(all_conditions)))

    catalog_instruction = ""
    if catalog_block:
        catalog_instruction = f"\n\n{catalog_block}\n\nIMPORTANT: When recommending products, use ONLY the real names and prices above. Do NOT invent product names."
    else:
        # ── Mira Imagines protocol — 0 exact results ─────────────────────────
        active_pet_desc = ticket_pet_name or (all_pet_names[0] if all_pet_names else "this dog")
        closest_block = ""
        if closest_products:
            closest_lines = []
            for p in closest_products:
                price  = p.get("original_price") or p.get("price", 0)
                pillar = p.get("pillar", "shop")
                closest_lines.append(
                    f"- {p.get('name', '')} — ₹{int(price) if price else 'POA'} → thedoggycompany.com/{pillar}"
                )
            closest_block = (
                "\n\nCLOSEST REAL PRODUCTS (related, not exact — present as 'Meanwhile — these are perfect:'):\n"
                + "\n".join(closest_lines)
            )
        else:
            # ── True catalog miss — BOTH found_products AND closest_products are
            # empty after allergen + breed filters.  Skip the LLM entirely;
            # send a reliable, clean Amazon affiliate fallback directly. ────────
            _fb_name      = ticket_pet_name or (all_pet_names[0] if all_pet_names else "your dog")
            _fb_clean_q   = _build_amazon_query(message_text, all_pet_names)
            _fb_amazon    = (
                f"https://www.amazon.in/s?k=dog+{_fb_clean_q.replace(' ', '+')}"
                f"&tag={AFFILIATE_TAG}"
            )
            logger.info(f"[MIRA-AI] True catalog miss → Amazon fallback ({_fb_clean_q!r})")
            _amazon_reply = (
                f"I don't have that in our catalogue right now 🙏\n\n"
                f"But I found some options for {_fb_name} on Amazon:\n\n"
                f"🛒 {_fb_amazon}\n\n"
                f"All purchases support The Doggy Company 🐾\n\n"
                f"Want something custom instead? Reply and our Concierge will arrange it:\n"
                f"thedoggycompany.com/my-requests"
            )
            await _wa_save_history(db, phone_10, message_text, _amazon_reply)
            return _amazon_reply
        catalog_instruction = (
            f"\n\nNo exact TDC catalog match found for this query."
            f"\n\nMIRA IMAGINES PROTOCOL — follow this EXACTLY:"
            f"\n1. Acknowledge honestly: say you don't have [the specific item] in the catalog yet — warm, not apologetic."
            f"\n2. Write ONE '✦ Mira Imagines:' line — describe the ideal product specifically for {active_pet_desc}."
            f"   Make it visual and breed/personality specific. Example: 'A birthday bandana + party hat combo for an energetic Indie like Mojo'"
            f"\n3. If closest real products are listed below, present them naturally as 'Meanwhile — these are perfect:'"
            f"{closest_block}"
            f"\n4. Include Amazon fallback: 🛒 {amazon_url}"
            f"\n5. End with Concierge CTA: 'Your Concierge can source it → thedoggycompany.com/my-requests 🐾'"
            f"\n\nDO NOT invent product names, prices, or links. Only use the real closest products listed above if any."
        )

    near_me_instruction = f"\n\nNEARME DETECTED: Include this Google Maps link in your response:{near_me_block}" if is_near_me else ""

    # ── Active-pet lock injected at top of system prompt ─────────────────────
    active_pet_lock = ""
    if ticket_pet_name:
        active_pet_lock = (
            f"\n\n🔒 ACTIVE PET LOCK: This conversation is ONLY about {ticket_pet_name}. "
            f"You must ONLY use the name '{ticket_pet_name}' in your response. "
            f"Never mention, reference, or address any other dog. Not even once."
        )

    # ── Archetype tone block — same dict as widget/mira_routes.py ───────────
    ARCHETYPE_TONES = {
        'social_butterfly':     ("🦋 SOCIAL BUTTERFLY", "Be cheerful, celebratory and high-energy. Frame everything as a shared adventure with their social, people-loving dog."),
        'wild_explorer':        ("🌿 WILD EXPLORER",    "Be bold, adventurous and outdoorsy. Talk about trails, discoveries, freedom. Products are gear for the next adventure."),
        'velcro_baby':          ("🫂 VELCRO BABY",      "Be warm, cosy and attachment-led. Emphasise togetherness, comfort, bonding. Avoid anything that sounds like separation."),
        'drama_queen':          ("🎭 DRAMA QUEEN",      "Be empathetic and extra reassuring. Validate every sensitivity. Speak gently, offer comfort, never overwhelm."),
        'lone_wolf':            ("🌑 LONE WOLF",        "Be calm, minimal and non-pushy. Give space. Fewer options, not more. Frame independence and self-reliance as a strength."),
        'foodie':               ("🍖 FOODIE",           "Be flavour-forward and sensory. Every recommendation has taste, texture, smell. Food is the love language here."),
        'gentle_soul':          ("🌸 GENTLE SOUL",      "Be soft, unhurried and warm. Never overwhelming. Frame products as gentle, trusted choices. Speak like a kind, patient friend."),
        'guardian':             ("🛡️ GUARDIAN",         "Be loyal, grounded and trust-building. Speak with quiet authority. Frame products as reliable, time-tested, worthy of their devotion."),
        'playful_spirit':       ("🎉 PLAYFUL SPIRIT",   "Be fun, light and joyful. This dog lives for play. Frame everything as the next great adventure. Keep energy infectious."),
        'curious_mind':         ("🔍 CURIOUS MIND",     "Be interesting, intelligent and stimulating. Offer variety and enrichment. Frame products as discoveries and mental challenges."),
        # Legacy keys — kept for backward compatibility
        'snack_led_negotiator': ("🍖 SNACK NEGOTIATOR", "Be foodie, tempting and treat-led. Use sensory language — smell, taste, texture. Frame everything through reward and flavour."),
        'snack_negotiator':     ("🍖 SNACK NEGOTIATOR", "Be foodie, tempting and treat-led. Use sensory language — smell, taste, texture. Frame everything through reward and flavour."),
        'brave_worrier':        ("💛 BRAVE WORRIER",    "Be reassuring, calm and anxiety-aware. Lead with safety and comfort. Avoid overwhelming choices. Use gentle, slow language."),
        'quiet_watcher':        ("🌙 QUIET WATCHER",    "Be thoughtful, gentle and unhurried. Avoid hype. Speak softly. Frame products as calm, considered choices."),
        'gentle_aristocrat':    ("👑 GENTLE ARISTOCRAT","Be refined, elegant and discerning. Use premium language. Frame everything as curated, exclusive, worthy of royalty."),
        'royal':                ("👑 ROYAL",            "Be refined, elegant and discerning. Use premium language. Frame everything as curated, exclusive, worthy of royalty."),
        'athlete':              ("⚡ ATHLETE",          "Be energetic, performance-led and sporty. Talk about stamina, agility, peak performance. Products are training essentials."),
    }
    archetype_tone_block = ""
    if active_pet_archetype and active_pet_archetype in ARCHETYPE_TONES:
        label, instruction = ARCHETYPE_TONES[active_pet_archetype]
        archetype_tone_block = (
            f"\n\n🎭 MIRA TONE FOR THIS DOG — {label}:\n"
            f"{instruction}\n"
            f"Adapt your entire response to match this dog's soul. Speak TO the parent OF this specific dog."
        )
        logger.info(f"[MIRA-AI] Archetype tone injected: {label}")

    # ── Build unified system prompt: shared soul + WhatsApp surface rules ────
    from mira_soul import MIRA_SOUL_CHARTER

    # ── Inject MongoDB-backed conversation history (survives redeploys) ───────
    wa_history = await _wa_get_history(db, phone_10, limit=6)
    history_block = ""
    if wa_history:
        history_lines = []
        for turn in wa_history:
            history_lines.append(f"User: {turn['user']}")
            history_lines.append(f"Mira: {turn['bot'][:300]}")
        history_block = (
            "\n\nRECENT CONVERSATION HISTORY — read carefully to avoid repeating questions:\n"
            + "\n".join(history_lines)
            + "\n(Do NOT ask questions already answered above.)"
        )

    system_prompt = MIRA_SOUL_CHARTER + MIRA_CORE_SOUL + f"""{active_pet_lock}{archetype_tone_block}{history_block}

═══════════════════════════════════════════════════════
📱 WHATSAPP SURFACE RULES (format only — soul rules above govern)
═══════════════════════════════════════════════════════

TONE FOR THIS CHANNEL:
- Warm — like a brilliant friend who genuinely KNOWS this dog, not a customer service bot
- Reference the pet's actual personality, breed, favourite treats naturally in every message
- WhatsApp format: conversational, no markdown headers, short paragraphs
- 4-6 sentences max, then one warm follow-up question
- Feel like a relationship, not a transaction

BANNED WORDS — never use:
paw-sitively, pawsome, fur-ever, furry friends, tummy, pup-tastic, pawfect, furbaby, pooch,
woof, arf, belly rubs, tail wagging, cuddles, absolutely, certainly, of course, happy to help

PRODUCT RULES:
- Every recommendation MUST include: exact product name + ₹price + link
- Use ONLY real names and prices from the catalog below — never invent them
- Format: "Product Name — ₹X → link"
- ✦ Why line: must use the dog's actual name + a real reason (allergen, breed, favourite)

SPECIES RULE:
- User has DOGS. Rabbit/cat/squirrel/fish in their message = a toy shape or product type, NOT their pet.
- "Baby rabbit toy" → they want a rabbit-SHAPED dog toy. Recommend dog toys.

RAINBOW BRIDGE RULE (WhatsApp):
- If a pet has passed (rainbow_bridge: true), use gentle past tense: "I remember how [Pet] loved..."
- NEVER recommend products for a departed pet as if they're still alive.{allergen_rule}{condition_rule}{catalog_instruction}{near_me_instruction}{context_block}

RESPONSE STYLE — guidelines (NOT a rigid template):
- Open with the pet's name and something real you know about them — never a generic greeting
- Weave in their personality, breed quirks, favourite ingredients naturally — like you've known this dog for years
- Product recommendations feel like personal picks, not a menu
- ✦ Why line is written like you're talking to a friend, not filling a form
- Close with ONE warm, specific question that shows you genuinely care about this particular dog's experience
- The concierge link goes at the end: "Need help? Your Concierge is here → thedoggycompany.com/my-requests 🐾"
- Format guide (flexible): short paragraphs, conversational, no markdown headers, 4-6 sentences before the question
- IF NO CATALOG MATCH: "I don't have [specific item] in our catalog yet — but Mira imagines the perfect [thing] for [pet]! 🎨" then closest real products or Amazon link

Website: thedoggycompany.com | Concierge: +91 8971702582"""

    # ── 5. Call GPT (circuit breaker: skip LLM if it's been failing, use patterns) ──
    _now = _time.time()
    _circuit_open = _llm_circuit["open_until"] > _now

    if _circuit_open:
        logger.warning(f"[MIRA-AI] LLM circuit OPEN (too many 502s) — going straight to patterns")
    else:
        try:
            import asyncio as _asyncio
            import concurrent.futures as _cf
            from emergentintegrations.llm.openai import LlmChat, UserMessage
            import uuid as uuid_mod

            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"wa-{user_phone or uuid_mod.uuid4().hex[:8]}-{ticket_pet_name.lower() if ticket_pet_name else 'all'}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")

            _user_msg = f"{user_name} says: {message_text}"

            # Run in a thread so the event loop stays free and asyncio.wait_for CAN fire
            def _sync_llm():
                import asyncio as _al
                loop = _al.new_event_loop()
                try:
                    return loop.run_until_complete(
                        chat.send_message(UserMessage(text=_user_msg))
                    )
                finally:
                    loop.close()

            _loop = _asyncio.get_event_loop()
            _future = _loop.run_in_executor(None, _sync_llm)

            # Now wait_for CAN cancel this after 25s (thread keeps running but we move on)
            response = await _asyncio.wait_for(_future, timeout=25.0)

            if response:
                # LLM succeeded — reset circuit breaker
                _llm_circuit["failures"] = 0
                _llm_circuit["open_until"] = 0.0
                n_products = len(found_products)
                n_services = len(found_services)
                logger.info(f"[MIRA-AI] ✅ Response for {(user_phone or '')[:6]}*** | "
                           f"products={n_products} services={n_services} "
                           f"allergies={len(all_allergies)} nearme={is_near_me}")
                await _wa_save_history(db, phone_10, message_text, response)
                return response

        except _asyncio.TimeoutError:
            _llm_circuit["failures"] += 1
            if _llm_circuit["failures"] >= _LLM_FAIL_THRESHOLD:
                _llm_circuit["open_until"] = _time.time() + _LLM_COOLDOWN_SEC
                logger.warning(f"[MIRA-AI] LLM circuit OPENED (timeout x{_llm_circuit['failures']}) — patterns for {_LLM_COOLDOWN_SEC}s")
            else:
                logger.warning(f"[MIRA-AI] GPT-4o timed out (>25s), attempt {_llm_circuit['failures']} — falling back to patterns")

        except Exception as ai_err:
            _llm_circuit["failures"] += 1
            if _llm_circuit["failures"] >= _LLM_FAIL_THRESHOLD:
                _llm_circuit["open_until"] = _time.time() + _LLM_COOLDOWN_SEC
                logger.warning(f"[MIRA-AI] LLM circuit OPENED after {_llm_circuit['failures']} failures — patterns for {_LLM_COOLDOWN_SEC}s")
            else:
                logger.warning(f"[MIRA-AI] AI failed (attempt {_llm_circuit['failures']}), falling back to patterns: {ai_err}")

    # ── 6. Fallback to pattern matching ──────────────────────────────────────
    return await get_mira_whatsapp_response(message_text, user_name)


async def get_mira_whatsapp_response(message_text: str, user_name: str = "friend") -> str:
    """
    Generate Mira's intelligent response for WhatsApp messages.
    Uses word-boundary pattern matching for common queries.
    Includes NearMe Google Maps link when location intent detected.
    """
    import re
    message_lower = message_text.lower().strip()

    # NearMe detection — inject Maps link into response
    is_near_me = _detect_near_me(message_text)

    # Check each pattern category (order matters - check more specific patterns first)
    pattern_order = ["membership", "order", "grooming", "vet", "birthday", "stay", "help", "thanks", "bye", "greeting"]
    
    for category in pattern_order:
        if category not in MIRA_WHATSAPP_PATTERNS:
            continue
        data = MIRA_WHATSAPP_PATTERNS[category]
        for pattern in data["patterns"]:
            # Use word boundary for short patterns like 'hi', 'bye' to avoid false matches
            if len(pattern) <= 3:
                if re.search(r'\b' + re.escape(pattern) + r'\b', message_lower):
                    response = data["response"]
                    if user_name and user_name != "WhatsApp User":
                        response = response.replace("Hey there!", f"Hey {user_name}!")
                    if is_near_me:
                        # Map category to service type
                        svc_map = {
                            "grooming": "dog+groomer", "vet": "dog+vet+clinic",
                            "stay": "dog+boarding", "order": "dog+store"
                        }
                        svc_q = svc_map.get(category, "dog+service")
                        maps_url = f"https://maps.google.com/search?q={svc_q}+near+me"
                        response += f"\n\n📍 Find nearby:\n{maps_url}"
                    return response
            else:
                if pattern in message_lower:
                    response = data["response"]
                    if user_name and user_name != "WhatsApp User":
                        response = response.replace("Hey there!", f"Hey {user_name}!")
                    if is_near_me:
                        svc_map = {
                            "grooming": "dog+groomer", "vet": "dog+vet+clinic",
                            "stay": "dog+boarding", "order": "dog+store"
                        }
                        svc_q = svc_map.get(category, "dog+service")
                        maps_url = f"https://maps.google.com/search?q={svc_q}+near+me"
                        response += f"\n\n📍 Find nearby:\n{maps_url}"
                    return response

    # Default response — add NearMe if detected
    response = MIRA_DEFAULT_RESPONSE
    if is_near_me:
        maps_url = "https://maps.google.com/search?q=dog+service+near+me"
        response += f"\n\n📍 Find services nearby:\n{maps_url}"
    return response


@router.post("/mira-reply")
async def send_mira_reply(to: str, message: str):
    """
    Send Mira's AI response via WhatsApp using Gupshup API.
    Called after processing an incoming message.
    """
    if not is_gupshup_configured():
        logger.warning("Gupshup not configured - Mira reply skipped")
        return {"success": False, "reason": "Gupshup not configured"}
    
    config = get_gupshup_config()
    
    try:
        import json
        
        # Format phone number
        phone = ''.join(filter(str.isdigit, str(to)))
        if len(phone) == 10:
            phone = '91' + phone
        
        payload = {
            "channel": "whatsapp",
            "source": config["source_number"],
            "destination": phone,
            "message": json.dumps({
                "type": "text",
                "text": message
            }),
            "src.name": config["app_name"]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload,
                timeout=10
            )
            
            result = response.json()
            
            if response.status_code in [200, 202] and result.get("status") in ["submitted", "success"]:
                logger.info(f"[MIRA-WHATSAPP] Reply sent to {phone[:6]}*** | ID: {result.get('messageId')}")
                return {"success": True, "message_id": result.get("messageId")}
            else:
                logger.error(f"[MIRA-WHATSAPP] Reply failed: {result}")
                return {"success": False, "error": result.get("message", "Unknown error")}
                
    except Exception as e:
        logger.error(f"[MIRA-WHATSAPP] Reply error: {e}")
        return {"success": False, "error": str(e)}


# Update process_incoming_message to send Mira's reply
async def send_auto_mira_reply(from_number: str, incoming_message: str, sender_name: str):
    """Automatically send Mira's AI response to incoming WhatsApp messages"""
    try:
        # Get Mira's AI response (with fallback to patterns)
        logger.info(f"[MIRA-AI] Generating response for {from_number[:6]}*** → '{incoming_message[:60]}'")
        mira_response = await get_mira_ai_response(incoming_message, sender_name, from_number)
        logger.info(f"[MIRA-AI] Response generated ({len(mira_response)} chars): '{mira_response[:80]}'")
        
        # Send via Gupshup WhatsApp API
        if is_gupshup_configured():
            result = await send_mira_reply(from_number, mira_response)
            if result.get("success"):
                logger.info(f"[MIRA-AI] ✅ Auto-replied to {from_number[:6]}*** | ID: {result.get('message_id')}")
            else:
                logger.warning(f"[MIRA-AI] ❌ Auto-reply failed: {result.get('error')} | Response was: '{mira_response[:100]}'")
        else:
            logger.warning(f"[MIRA-AI] Gupshup not configured — response NOT sent: '{mira_response[:100]}'")
            
    except Exception as e:
        logger.error(f"[MIRA-AI] Error sending auto-reply: {e}", exc_info=True)



# ==================== TEST NOTIFICATION ENDPOINT ====================

class TestNotificationRequest(BaseModel):
    phone: str
    notification_type: str  # welcome, payment, membership, booking, birthday
    # Optional fields based on type
    user_name: str = "Test User"
    amount: Optional[float] = None
    plan_name: Optional[str] = None
    order_id: Optional[str] = None
    tier: Optional[str] = None
    expires_at: Optional[str] = None
    pet_name: Optional[str] = None
    service_name: Optional[str] = None
    booking_date: Optional[str] = None


@router.post("/test-notification")
async def test_whatsapp_notification(request: TestNotificationRequest):
    """
    Test endpoint to manually trigger WhatsApp notifications
    Only for testing - requires authentication in production
    """
    from whatsapp_notifications import WhatsAppNotifications
    
    try:
        result = None
        
        if request.notification_type == "welcome":
            result = await WhatsAppNotifications.welcome_new_user(
                phone=request.phone,
                user_name=request.user_name
            )
        
        elif request.notification_type == "payment":
            result = await WhatsAppNotifications.payment_received(
                phone=request.phone,
                user_name=request.user_name,
                amount=request.amount or 2499,
                plan_name=request.plan_name or "Essential",
                order_id=request.order_id or "TEST-ORDER-123"
            )
        
        elif request.notification_type == "membership":
            result = await WhatsAppNotifications.membership_activated(
                phone=request.phone,
                user_name=request.user_name,
                tier=request.tier or "essential",
                expires_at=request.expires_at or "2027-03-07T00:00:00"
            )
        
        elif request.notification_type == "booking":
            result = await WhatsAppNotifications.service_booked(
                phone=request.phone,
                user_name=request.user_name,
                pet_name=request.pet_name or "Buddy",
                service_name=request.service_name or "Grooming Session",
                booking_date=request.booking_date or "March 15, 2026"
            )
        
        elif request.notification_type == "birthday":
            result = await WhatsAppNotifications.pet_birthday_reminder(
                phone=request.phone,
                user_name=request.user_name,
                pet_name=request.pet_name or "Buddy",
                birthday_date=request.booking_date or "March 15",
                days_until=7
            )
        
        else:
            return {"success": False, "error": f"Unknown notification type: {request.notification_type}"}
        
        return {
            "success": result.get("success", False) if result else False,
            "notification_type": request.notification_type,
            "phone": request.phone[:6] + "***",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Test notification error: {e}")
        return {"success": False, "error": str(e)}



# ══════════════════════════════════════════════════════════════════════════════
# DEBUG: Simulate WhatsApp response WITHOUT sending — use from production admin
# Hit: GET /api/whatsapp/debug-response?phone=919876543210&message=treats
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/debug-response")
async def debug_whatsapp_response(
    phone: str = "919876543210",
    message: str = "What's a good treat for my dog",
    sender_name: str = "Test"
):
    """
    Simulate the full WhatsApp AI response flow without actually sending anything.
    Use this from production to diagnose why WhatsApp is only showing 🐾.
    Example: /api/whatsapp/debug-response?phone=REAL_PHONE&message=treats
    """
    try:
        response_text = await get_mira_ai_response(message, sender_name, phone)
        gupshup_ok    = is_gupshup_configured()
        config        = get_gupshup_config()
        return {
            "input":            {"phone": phone[:6] + "***", "message": message, "sender": sender_name},
            "response_length":  len(response_text),
            "response_preview": response_text[:300],
            "full_response":    response_text,
            "gupshup_configured": gupshup_ok,
            "gupshup_source":   config.get("source_number", "NOT SET"),
            "gupshup_app":      config.get("app_name", "NOT SET"),
            "api_key_set":      bool(config.get("api_key")),
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
