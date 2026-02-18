"""
Conversation Contract - Phase 5: Deterministic UI Rendering
============================================================
Bible Section 10.0: Conversational Rules Contract

PRINCIPLE: Chat output must be deterministic. UI must never infer behavior from free text.

The conversation_contract is returned on EVERY chat response and controls:
- mode: answer | clarify | places | learn | ticket | handoff
- quick_replies: 3-6 chips with payload_text
- actions: create_ticket CTAs via spine
- places_query/places_results
- youtube_query/youtube_results
- spine: { ticket_id }

DETERMINISTIC RENDER RULES (Frontend must follow exactly):
- mode="answer" → render assistant_text + quick_replies only
- mode="clarify" → render ONLY assistant_text + quick_replies, NO places/youtube/products
- mode="places" → render assistant_text + places_results + quick_replies
- mode="learn" → render assistant_text + youtube_results + quick_replies
- mode="ticket" or mode="handoff" → render assistant_text + CTA actions only

NEVER show "popular/featured" filler when mode is not catalogue/answer.
"""

import re
import logging
from typing import Optional, Dict, List, Any, Literal
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT TYPES
# ═══════════════════════════════════════════════════════════════════════════════

ContractMode = Literal["answer", "clarify", "places", "learn", "ticket", "handoff"]
ChipIntentType = Literal["continue", "refine", "execute"]


# ═══════════════════════════════════════════════════════════════════════════════
# INTENT DETECTION (Deterministic)
# ═══════════════════════════════════════════════════════════════════════════════

# Places-related keywords
PLACES_INTENT_KEYWORDS = [
    "find", "search", "locate", "where", "near", "nearby", "closest",
    "vet", "veterinary", "clinic", "hospital", "groomer", "grooming",
    "park", "dog park", "pet cafe", "cafe", "restaurant", "pet store",
    "boarding", "daycare", "kennel", "trainer", "training center",
    "shelter", "rescue", "photographer", "spa", "hotel", "stay"
]

PLACES_INTENT_PATTERNS = [
    r"find\s+(a|me|us)?\s*(vet|groomer|park|cafe|store|boarding|trainer|shelter|hotel)",
    r"(vet|groomer|park|cafe|store|boarding|trainer|shelter|hotel)\s+(near|in|around|at)\s+",
    r"(pet|dog)\s+(friendly|cafe|park|restaurant|store|groomer|spa|boarding)",
    r"(where|find|look|search)\s+(for|a|the)?\s*(vet|groomer|park|cafe)",
    r"(nearby|near me|around here|close by)\s*(vet|groomer|park|cafe|store)?",
    r"(vet|groomer|clinic|hospital|park)\s+(recommendations?|options?|suggestions?)"
]

# Learn/training-related keywords
LEARN_INTENT_KEYWORDS = [
    "how to", "teach", "train", "training", "learn", "show me",
    "tutorial", "guide", "steps", "tips", "help with", "stop",
    "recall", "leash", "potty", "crate", "barking", "biting",
    "jumping", "pulling", "aggressive", "anxious", "fear"
]

LEARN_INTENT_PATTERNS = [
    r"how\s+(to|do|can)\s+(i|we)?\s*(teach|train|stop|help|get)",
    r"(teach|train)\s+(my|the)?\s*(dog|puppy|pet)\s+(to)?",
    r"(stop|prevent|reduce|fix)\s+(my|the)?\s*(dog|puppy)\s+(from)?",
    r"(training|tips?|guide|tutorial)\s+(for|on|about)\s+",
    r"(help|advice|guidance)\s+(with|for|on)\s+(training|behavior|issues?)",
    r"(leash|crate|potty|recall|obedience)\s+training"
]

# Near-me keywords (user implies proximity)
NEAR_ME_KEYWORDS = [
    "near me", "nearby", "around here", "close by", "closest",
    "in my area", "around me", "my location", "near my place"
]

# Location-explicit patterns
LOCATION_PATTERNS = [
    r"\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",  # "in Mumbai", "in New York"
    r"\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",  # "at Koramangala"
    r"\b([A-Z][a-z]+(?:(?:nagar|puram|wadi|pur|ganj|guda|pally|abad|bad|garh|ket|pet|ola|pore|khet|pura|peta)))\b",  # Indian location suffixes
    r"\b([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)\s+(area|locality|neighborhood|district|region)\b"
]


def detect_places_intent(message: str) -> Dict[str, Any]:
    """
    Detect if message has places/location search intent.
    
    Returns:
        {
            "has_intent": bool,
            "place_type": str or None,
            "has_location": bool,
            "location": str or None,
            "has_near_me": bool,
            "confidence": float
        }
    """
    message_lower = message.lower()
    
    # Check for places intent
    has_places_intent = False
    place_type = None
    confidence = 0.0
    
    # Check keywords
    keyword_matches = sum(1 for kw in PLACES_INTENT_KEYWORDS if kw in message_lower)
    if keyword_matches >= 1:
        has_places_intent = True
        confidence = min(0.3 + (keyword_matches * 0.1), 0.7)
    
    # Check patterns (stronger signal)
    for pattern in PLACES_INTENT_PATTERNS:
        if re.search(pattern, message_lower, re.IGNORECASE):
            has_places_intent = True
            confidence = max(confidence, 0.8)
            break
    
    # Detect place type
    place_type_map = {
        "vet": ["vet", "veterinary", "clinic", "hospital", "doctor"],
        "groomer": ["groomer", "grooming", "spa", "salon"],
        "park": ["park", "dog park", "off-leash"],
        "cafe": ["cafe", "pet cafe", "dog cafe", "cat cafe", "restaurant"],
        "store": ["store", "pet store", "shop", "petshop"],
        "boarding": ["boarding", "daycare", "kennel", "hostel"],
        "trainer": ["trainer", "training center", "obedience"],
        "shelter": ["shelter", "rescue", "adoption"],
        "hotel": ["hotel", "stay", "resort", "lodge"]
    }
    
    for ptype, keywords in place_type_map.items():
        if any(kw in message_lower for kw in keywords):
            place_type = ptype
            break
    
    # Check for location
    has_location = False
    location = None
    
    for pattern in LOCATION_PATTERNS:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            has_location = True
            location = match.group(1) if match.groups() else match.group(0)
            break
    
    # Check for near-me keywords
    has_near_me = any(kw in message_lower for kw in NEAR_ME_KEYWORDS)
    
    return {
        "has_intent": has_places_intent,
        "place_type": place_type,
        "has_location": has_location,
        "location": location,
        "has_near_me": has_near_me,
        "confidence": confidence
    }


def detect_learn_intent(message: str) -> Dict[str, Any]:
    """
    Detect if message has learning/training intent (YouTube).
    
    Returns:
        {
            "has_intent": bool,
            "topic": str or None,
            "confidence": float
        }
    """
    message_lower = message.lower()
    
    has_learn_intent = False
    topic = None
    confidence = 0.0
    
    # Check keywords
    keyword_matches = sum(1 for kw in LEARN_INTENT_KEYWORDS if kw in message_lower)
    if keyword_matches >= 1:
        has_learn_intent = True
        confidence = min(0.3 + (keyword_matches * 0.1), 0.7)
    
    # Check patterns (stronger signal)
    for pattern in LEARN_INTENT_PATTERNS:
        if re.search(pattern, message_lower, re.IGNORECASE):
            has_learn_intent = True
            confidence = max(confidence, 0.85)
            break
    
    # Extract topic
    topic_keywords = {
        "leash pulling": ["leash", "pulling", "walks", "heel"],
        "potty training": ["potty", "house training", "pee", "poop", "toilet"],
        "crate training": ["crate", "crate training", "kennel"],
        "recall": ["recall", "come", "come back", "return"],
        "barking": ["bark", "barking", "howl", "noise"],
        "biting": ["bite", "biting", "nipping", "mouthy"],
        "jumping": ["jump", "jumping", "leap"],
        "anxiety": ["anxiety", "anxious", "scared", "fear", "nervous"],
        "aggression": ["aggressive", "aggression", "reactive"],
        "socialization": ["socialize", "socialization", "other dogs", "people"]
    }
    
    for t, keywords in topic_keywords.items():
        if any(kw in message_lower for kw in keywords):
            topic = t
            break
    
    # Fallback: extract topic from message
    if not topic and has_learn_intent:
        # Try to extract from common patterns
        match = re.search(r"(teach|train|stop|help\s+with)\s+(?:my\s+)?(?:dog\s+)?(?:to\s+)?(.+?)(?:\?|$)", message_lower)
        if match:
            topic = match.group(2).strip()[:50]  # Limit length
    
    return {
        "has_intent": has_learn_intent,
        "topic": topic,
        "confidence": confidence
    }


def detect_ticket_intent(message: str) -> Dict[str, Any]:
    """
    Detect if message requires ticket creation (booking, service request).
    
    Returns:
        {
            "has_intent": bool,
            "service_type": str or None,
            "confidence": float
        }
    """
    message_lower = message.lower()
    
    ticket_keywords = [
        "book", "booking", "schedule", "appointment", "reserve",
        "arrange", "request", "want", "need", "order", "get me"
    ]
    
    service_types = {
        "grooming": ["grooming", "groom", "haircut", "bath", "spa", "nail"],
        "vet": ["vet", "checkup", "vaccination", "vaccine", "health check"],
        "boarding": ["boarding", "daycare", "kennel", "hosteling"],
        "training": ["training session", "trainer", "class"],
        "photoshoot": ["photoshoot", "photography", "photo session"],
        "party": ["party", "birthday", "celebration", "event"],
        "travel": ["travel", "trip", "vacation", "flight", "hotel"]
    }
    
    has_ticket_intent = any(kw in message_lower for kw in ticket_keywords)
    
    # Detect service type
    service_type = None
    for stype, keywords in service_types.items():
        if any(kw in message_lower for kw in keywords):
            service_type = stype
            has_ticket_intent = True
            break
    
    # Time indicators strengthen ticket intent
    time_indicators = ["tomorrow", "today", "next week", "this week", "morning", "afternoon", "evening"]
    if any(ti in message_lower for ti in time_indicators):
        has_ticket_intent = True
    
    return {
        "has_intent": has_ticket_intent,
        "service_type": service_type,
        "confidence": 0.85 if has_ticket_intent and service_type else 0.6 if has_ticket_intent else 0.0
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODE ROUTER (Deterministic)
# ═══════════════════════════════════════════════════════════════════════════════

def determine_contract_mode(
    message: str,
    has_location_permission: bool = False,
    pet_context: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Determine the conversation contract mode based on message intent.
    
    RULES (Bible Section 10.0):
    - Places intent + no location + no near-me → mode="clarify"
    - Places intent + location provided → mode="places"
    - Places intent + near-me + consent → mode="places"
    - Learn/training intent → mode="learn"
    - Ticket/booking intent → mode="ticket"
    - Bespoke/specialist request → mode="handoff"
    - Default → mode="answer"
    
    Returns:
        {
            "mode": ContractMode,
            "detected_intent": str,
            "places_call_allowed": bool,
            "youtube_call_allowed": bool,
            "location_source": str,  # "none" | "user_text" | "consented_geo"
            "clarify_reason": str or None,
            "debug": { ... }
        }
    """
    # Detect intents
    places_intent = detect_places_intent(message)
    learn_intent = detect_learn_intent(message)
    ticket_intent = detect_ticket_intent(message)
    
    # Default values
    mode = "answer"
    detected_intent = "general"
    places_call_allowed = False
    youtube_call_allowed = False
    location_source = "none"
    clarify_reason = None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PRIORITY ORDER: ticket > places > learn > bespoke > answer
    # Ticket intent has highest priority when booking keywords are present
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Check for bespoke/handoff FIRST (highest priority for specialist requests)
    bespoke_keywords = [
        "acupuncturist", "hydrotherapy", "physiotherapy", "rehab",
        "canine therapist", "animal communicator", "holistic", "specialist",
        "custom", "bespoke", "one-of-a-kind"
    ]
    is_bespoke = any(kw in message.lower() for kw in bespoke_keywords)
    
    if is_bespoke:
        # Bespoke/specialist request → handoff
        detected_intent = "bespoke"
        mode = "handoff"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TICKET/BOOKING INTENT - High priority when booking keywords + service type
    # ═══════════════════════════════════════════════════════════════════════════
    elif ticket_intent["has_intent"] and ticket_intent["confidence"] >= 0.85:
        # Strong booking intent (has booking keyword + service type + time indicator)
        detected_intent = f"ticket:{ticket_intent['service_type'] or 'general'}"
        mode = "ticket"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PLACES INTENT LOGIC (Non-negotiable)
    # ═══════════════════════════════════════════════════════════════════════════
    elif places_intent["has_intent"]:
        detected_intent = f"places:{places_intent['place_type'] or 'general'}"
        
        if places_intent["has_location"]:
            # User provided location explicitly → mode="places"
            mode = "places"
            places_call_allowed = True
            location_source = "user_text"
        elif places_intent["has_near_me"] and has_location_permission:
            # User said "near me" AND we have location consent → mode="places"
            mode = "places"
            places_call_allowed = True
            location_source = "consented_geo"
        else:
            # No location, no near-me, or no consent → mode="clarify"
            mode = "clarify"
            places_call_allowed = False
            if places_intent["has_near_me"] and not has_location_permission:
                clarify_reason = "need_location_consent"
            else:
                clarify_reason = "need_location"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEARN INTENT LOGIC
    # ═══════════════════════════════════════════════════════════════════════════
    elif learn_intent["has_intent"] and learn_intent["confidence"] >= 0.7:
        detected_intent = f"learn:{learn_intent['topic'] or 'general'}"
        mode = "learn"
        youtube_call_allowed = True
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LOWER PRIORITY TICKET INTENT (only service type, no strong booking signal)
    # ═══════════════════════════════════════════════════════════════════════════
    elif ticket_intent["has_intent"] and ticket_intent["confidence"] >= 0.6:
        detected_intent = f"ticket:{ticket_intent['service_type'] or 'general'}"
        mode = "ticket"
    
    return {
        "mode": mode,
        "detected_intent": detected_intent,
        "places_call_allowed": places_call_allowed,
        "youtube_call_allowed": youtube_call_allowed,
        "location_source": location_source,
        "clarify_reason": clarify_reason,
        "debug": {
            "places_intent": places_intent,
            "learn_intent": learn_intent,
            "ticket_intent": ticket_intent,
            "has_location_permission": has_location_permission
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CHIP LIBRARY (Section 11.3 of PET_OS_BEHAVIOR_BIBLE.md)
# Pre-built chip sets per pillar and mode
# ═══════════════════════════════════════════════════════════════════════════════

def _build_chip(
    label: str,
    payload_text: str,
    intent_type: str = "continue",
    action: str = "none",
    action_args: dict = None,
    analytics_domain: str = "general",
    requires_consent: bool = False,
    consent_key: str = None
) -> dict:
    """Build a single chip conforming to Section 11.2.3 schema."""
    import uuid
    chip_id = f"QR-{uuid.uuid4().hex[:8].upper()}"
    
    chip = {
        "id": chip_id,
        "label": label,
        "payload_text": payload_text,
        "intent_type": intent_type,
        "action": action,
        "action_args": action_args or {},
        "analytics_tag": f"qr.{analytics_domain}.{intent_type.split('_')[0]}"
    }
    
    if requires_consent:
        chip["safety"] = {
            "requires_consent": True,
            "consent_key": consent_key or "unknown"
        }
    
    return chip


# ═══════════════════════════════════════════════════════════════════════════════
# LOCATION CONSENT CHIPS (Section 11.3.2)
# ═══════════════════════════════════════════════════════════════════════════════

def get_location_consent_chips() -> list:
    """Section 11.3.2A: Near me with no consent."""
    return [
        _build_chip(
            label="Use current location",
            payload_text="Use my current location.",
            intent_type="consent_location",
            action="set_state",
            action_args={"key": "request_geo_permission", "value": True},
            analytics_domain="location",
            requires_consent=True,
            consent_key="geo_location"
        ),
        _build_chip(
            label="Type an area",
            payload_text="I'll type the area.",
            intent_type="location_area",
            analytics_domain="location"
        ),
        _build_chip(
            label="Not now",
            payload_text="Not now.",
            intent_type="cancel",
            analytics_domain="nav"
        )
    ]


def get_places_refine_chips() -> list:
    """Section 11.3.2C: Places refine chips."""
    return [
        _build_chip(label="Open now", payload_text="Show only places open now.", intent_type="scope", analytics_domain="places"),
        _build_chip(label="Top rated", payload_text="Show top rated places.", intent_type="scope", analytics_domain="places"),
        _build_chip(label="Closest", payload_text="Show closest places.", intent_type="scope", analytics_domain="places"),
        _build_chip(label="Change area", payload_text="I want a different area.", intent_type="location_area", analytics_domain="places"),
        _build_chip(label="Open request", payload_text="Open a request for this.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# CELEBRATE PILLAR CHIPS (Section 11.3.4)
# ═══════════════════════════════════════════════════════════════════════════════

def get_celebrate_location_chips() -> list:
    """Section 11.3.4A: Birthday planning location."""
    return [
        _build_chip(label="At home", payload_text="At home.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Pet café", payload_text="At a pet café.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Garden/outdoor", payload_text="In a garden or outdoor space.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Hotel staycation", payload_text="A hotel staycation.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Not sure", payload_text="I'm not sure yet.", intent_type="answer_option", analytics_domain="celebrate")
    ]


def get_celebrate_size_chips() -> list:
    """Section 11.3.4B: Party size."""
    return [
        _build_chip(label="Just us", payload_text="Just us, no other dogs.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Small (under 6)", payload_text="Small, under 6 pups.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Medium (6–12)", payload_text="Medium, 6 to 12 pups.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Big party", payload_text="A big party with lots of dogs.", intent_type="answer_option", analytics_domain="celebrate"),
        _build_chip(label="Not sure", payload_text="I'm not sure yet.", intent_type="answer_option", analytics_domain="celebrate")
    ]


def get_celebrate_execution_chips() -> list:
    """Section 11.3.4C: Celebration execution options."""
    return [
        _build_chip(label="Custom cake", payload_text="I want a custom cake.", intent_type="detail_request", analytics_domain="celebrate"),
        _build_chip(label="Photographer", payload_text="I want a photographer.", intent_type="detail_request", analytics_domain="celebrate"),
        _build_chip(label="Party setup", payload_text="I want party setup help.", intent_type="detail_request", analytics_domain="celebrate"),
        _build_chip(label="Open request", payload_text="Open a request for this.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket"),
        _build_chip(label="View in Services", payload_text="Open Services.", intent_type="open_services", action="open_layer", action_args={"layer": "services"}, analytics_domain="nav")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# CARE PILLAR CHIPS (Section 11.3.5)
# ═══════════════════════════════════════════════════════════════════════════════

def get_care_vet_chips() -> list:
    """Section 11.3.5A: Find a vet."""
    return [
        _build_chip(label="General check-up", payload_text="General check-up.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Emergency vet", payload_text="Emergency vet.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Dermatology", payload_text="Skin or dermatology.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Dental", payload_text="Dental care.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Not sure", payload_text="I'm not sure what I need.", intent_type="answer_option", analytics_domain="care")
    ]


def get_grooming_timing_chips() -> list:
    """Section 11.3.5B: Grooming booking."""
    return [
        _build_chip(label="Tomorrow", payload_text="Tomorrow.", intent_type="time_window", analytics_domain="care"),
        _build_chip(label="This weekend", payload_text="This weekend.", intent_type="time_window", analytics_domain="care"),
        _build_chip(label="Pick a date", payload_text="I'll pick a specific date.", intent_type="time_window", analytics_domain="care"),
        _build_chip(label="Morning", payload_text="Morning slot.", intent_type="time_window", analytics_domain="care"),
        _build_chip(label="Evening", payload_text="Evening slot.", intent_type="time_window", analytics_domain="care")
    ]


def get_boarding_chips() -> list:
    """Section 11.3.5C: Boarding preference."""
    return [
        _build_chip(label="Home boarding", payload_text="Home boarding with a host family.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Kennel", payload_text="A kennel or boarding facility.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Pet sitter", payload_text="A pet sitter at my home.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Day care", payload_text="Day care.", intent_type="answer_option", analytics_domain="care"),
        _build_chip(label="Not sure", payload_text="I'm not sure yet.", intent_type="answer_option", analytics_domain="care")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCY PILLAR CHIPS (Section 11.3.6)
# ═══════════════════════════════════════════════════════════════════════════════

def get_emergency_time_chips() -> list:
    """Section 11.3.6A: Triage-first timing."""
    return [
        _build_chip(label="Under 30 mins", payload_text="Under 30 minutes ago.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="1–3 hours", payload_text="1 to 3 hours ago.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Since yesterday", payload_text="Since yesterday.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Not sure", payload_text="I'm not sure when.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Go to vet now", payload_text="I want to go to the vet now.", intent_type="emergency_go_now", analytics_domain="emergency")
    ]


def get_emergency_what_chips() -> list:
    """Section 11.3.6B: What did they eat?"""
    return [
        _build_chip(label="Chocolate", payload_text="Chocolate.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Medicine", payload_text="Medicine or pills.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Grapes/raisins", payload_text="Grapes or raisins.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Plant", payload_text="A plant.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Not sure", payload_text="I'm not sure what.", intent_type="emergency_triage", analytics_domain="emergency")
    ]


def get_emergency_symptoms_chips() -> list:
    """Section 11.3.6C: Symptoms check."""
    return [
        _build_chip(label="Vomiting", payload_text="Vomiting.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Diarrhoea", payload_text="Diarrhoea.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Lethargic", payload_text="Acting lethargic.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Normal now", payload_text="Acting normal right now.", intent_type="emergency_triage", analytics_domain="emergency"),
        _build_chip(label="Breathing issue", payload_text="Having trouble breathing.", intent_type="emergency_go_now", analytics_domain="emergency")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# TRAVEL PILLAR CHIPS (Section 11.3.7)
# ═══════════════════════════════════════════════════════════════════════════════

def get_travel_type_chips() -> list:
    """Section 11.3.7A: Trip type."""
    return [
        _build_chip(label="Car trip", payload_text="A car trip.", intent_type="answer_option", analytics_domain="travel"),
        _build_chip(label="Flight", payload_text="Flying.", intent_type="answer_option", analytics_domain="travel"),
        _build_chip(label="Train", payload_text="Train travel.", intent_type="answer_option", analytics_domain="travel"),
        _build_chip(label="Staycation", payload_text="A staycation nearby.", intent_type="answer_option", analytics_domain="travel"),
        _build_chip(label="Not sure", payload_text="I'm not sure yet.", intent_type="answer_option", analytics_domain="travel")
    ]


def get_travel_timing_chips() -> list:
    """Section 11.3.7B: When."""
    return [
        _build_chip(label="Today", payload_text="Today.", intent_type="time_window", analytics_domain="travel"),
        _build_chip(label="Tomorrow", payload_text="Tomorrow.", intent_type="time_window", analytics_domain="travel"),
        _build_chip(label="This weekend", payload_text="This weekend.", intent_type="time_window", analytics_domain="travel"),
        _build_chip(label="Pick a date", payload_text="I'll pick a specific date.", intent_type="time_window", analytics_domain="travel"),
        _build_chip(label="Not sure", payload_text="I'm not sure when.", intent_type="time_window", analytics_domain="travel")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# LEARN PILLAR CHIPS (Section 11.3.8)
# ═══════════════════════════════════════════════════════════════════════════════

def get_learn_topic_chips() -> list:
    """Section 11.3.8A: Training topic."""
    return [
        _build_chip(label="Recall", payload_text="Recall training.", intent_type="answer_option", analytics_domain="learn"),
        _build_chip(label="Loose leash", payload_text="Loose leash walking.", intent_type="answer_option", analytics_domain="learn"),
        _build_chip(label="Toilet training", payload_text="Toilet training.", intent_type="answer_option", analytics_domain="learn"),
        _build_chip(label="Barking", payload_text="Stop barking.", intent_type="answer_option", analytics_domain="learn"),
        _build_chip(label="Separation anxiety", payload_text="Separation anxiety.", intent_type="answer_option", analytics_domain="learn")
    ]


def get_learn_action_chips() -> list:
    """Section 11.3.8B: Learn results actions."""
    return [
        _build_chip(label="Show 3 more", payload_text="Show me 3 more.", intent_type="continue_flow", analytics_domain="learn"),
        _build_chip(label="Make a 7-day plan", payload_text="Make this a 7-day plan.", intent_type="detail_request", analytics_domain="learn"),
        _build_chip(label="Save this", payload_text="Save this for later.", intent_type="continue_flow", analytics_domain="learn"),
        _build_chip(label="Ask Concierge", payload_text="Ask Concierge for help.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket"),
        _build_chip(label="Not now", payload_text="Not now.", intent_type="cancel", analytics_domain="nav")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# TICKET/SERVICES CHIPS (Section 11.3.3)
# ═══════════════════════════════════════════════════════════════════════════════

def get_ticket_created_chips() -> list:
    """Section 11.3.3: After a request is opened."""
    return [
        _build_chip(label="View in Services", payload_text="Open Services.", intent_type="open_services", action="open_layer", action_args={"layer": "services"}, analytics_domain="nav"),
        _build_chip(label="Add one detail", payload_text="I want to add one detail.", intent_type="detail_request", analytics_domain="ticket"),
        _build_chip(label="Change timing", payload_text="I want to change the time.", intent_type="detail_request", analytics_domain="ticket"),
        _build_chip(label="Not now", payload_text="Not now.", intent_type="cancel", analytics_domain="nav")
    ]


def get_navigation_chips() -> list:
    """Global utility chips for navigation."""
    return [
        _build_chip(label="View in Services", payload_text="Open Services.", intent_type="open_services", action="open_layer", action_args={"layer": "services"}, analytics_domain="nav"),
        _build_chip(label="See Picks", payload_text="Show Picks.", intent_type="open_picks", action="open_layer", action_args={"layer": "picks"}, analytics_domain="nav"),
        _build_chip(label="Open Today", payload_text="Open Today.", intent_type="open_today", action="open_layer", action_args={"layer": "today"}, analytics_domain="nav"),
        _build_chip(label="Open Learn", payload_text="Open Learn.", intent_type="open_learn", action="open_layer", action_args={"layer": "learn"}, analytics_domain="nav")
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK REPLIES BUILDER (Section 11.2)
# ═══════════════════════════════════════════════════════════════════════════════

def build_quick_replies(
    mode: str,
    context: Dict[str, Any] = None,
    pillar: str = None,
    is_emergency: bool = False,
    triage_stage: str = None,
    ticket_id: str = None
) -> List[Dict[str, Any]]:
    """
    Build quick reply chips based on mode, pillar, and context.
    
    RULES (Section 11.2.7):
    - clarify: 3-6 chips, min 2 meaningful choices + 1 cancel
    - places: 3-6 chips, at least 1 refine + 1 change area
    - learn: 3-6 chips, "Show 3 more", "Make plan", "Ask Concierge"
    - ticket/handoff: 3-6 chips, "Open request", "Add detail", "View in Services"
    """
    context = context or {}
    pet_name = context.get("pet_name", "your pet")
    clarify_reason = context.get("clarify_reason")
    
    quick_replies = []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TICKET CREATED - Always show these chips after ticket creation
    # ═══════════════════════════════════════════════════════════════════════════
    if ticket_id:
        return get_ticket_created_chips()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EMERGENCY MODE - Triage chips take precedence
    # ═══════════════════════════════════════════════════════════════════════════
    if is_emergency:
        if triage_stage == "what":
            return get_emergency_what_chips()
        elif triage_stage == "when":
            return get_emergency_time_chips()
        elif triage_stage == "symptoms":
            return get_emergency_symptoms_chips()
        else:
            return get_emergency_what_chips()  # Default to "what"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CLARIFY MODE - Location consent or pillar-specific clarification
    # ═══════════════════════════════════════════════════════════════════════════
    if mode == "clarify":
        if clarify_reason in ["need_location", "need_location_consent"]:
            return get_location_consent_chips()
        
        # Pillar-specific clarification chips
        if pillar == "celebrate":
            return get_celebrate_location_chips()
        elif pillar == "care":
            service_type = context.get("service_type")
            if service_type == "grooming":
                return get_grooming_timing_chips()
            elif service_type == "vet":
                return get_care_vet_chips()
            elif service_type == "boarding":
                return get_boarding_chips()
            else:
                return get_grooming_timing_chips()  # Default care chips
        elif pillar == "travel":
            return get_travel_type_chips()
        elif pillar == "learn":
            return get_learn_topic_chips()
        else:
            # Default clarify chips
            return [
                _build_chip(label="Tell me more", payload_text="Tell me more about this.", intent_type="detail_request", analytics_domain="general"),
                _build_chip(label="Open request", payload_text="Open a request for this.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket"),
                _build_chip(label="Not now", payload_text="Not now.", intent_type="cancel", analytics_domain="nav")
            ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PLACES MODE - Refine and action chips
    # ═══════════════════════════════════════════════════════════════════════════
    elif mode == "places":
        return get_places_refine_chips()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEARN MODE - Content action chips
    # ═══════════════════════════════════════════════════════════════════════════
    elif mode == "learn":
        return get_learn_action_chips()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TICKET MODE - Execution chips
    # ═══════════════════════════════════════════════════════════════════════════
    elif mode == "ticket":
        if pillar == "celebrate":
            return get_celebrate_execution_chips()
        else:
            return [
                _build_chip(label="Book now", payload_text="Yes, please book this for me.", intent_type="execute", action="create_ticket", analytics_domain="ticket"),
                _build_chip(label="More details", payload_text="Tell me more details first.", intent_type="detail_request", analytics_domain="ticket"),
                _build_chip(label="Different time", payload_text="I need a different time.", intent_type="time_window", analytics_domain="ticket"),
                _build_chip(label="Talk to Concierge", payload_text="Connect me with Concierge.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket"),
                _build_chip(label="Not now", payload_text="Not now.", intent_type="cancel", analytics_domain="nav")
            ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HANDOFF MODE - Concierge connection chips
    # ═══════════════════════════════════════════════════════════════════════════
    elif mode == "handoff":
        return [
            _build_chip(label="Yes, connect me", payload_text="Yes, connect me with Concierge.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket"),
            _build_chip(label="Tell me more", payload_text="Tell me more about this first.", intent_type="detail_request", analytics_domain="general"),
            _build_chip(label="Not right now", payload_text="Not right now, thanks.", intent_type="cancel", analytics_domain="nav")
        ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ANSWER MODE - Contextual follow-ups
    # ═══════════════════════════════════════════════════════════════════════════
    else:  # mode == "answer"
        return [
            _build_chip(label="Tell me more", payload_text="Tell me more about this.", intent_type="continue_flow", analytics_domain="general"),
            _build_chip(label="Find a place", payload_text=f"Help me find a place for {pet_name}.", intent_type="scope", analytics_domain="places"),
            _build_chip(label="Book a service", payload_text=f"I want to book a service for {pet_name}.", intent_type="handoff_concierge", action="create_ticket", analytics_domain="ticket")
        ]
    
    # Ensure max 6 chips
    return quick_replies[:6]


# ═══════════════════════════════════════════════════════════════════════════════
# CLARIFYING QUESTIONS BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def build_clarifying_questions(
    mode: str,
    context: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Build clarifying questions for mode="clarify".
    
    Returns 1-2 questions max with answer chips.
    """
    context = context or {}
    clarify_reason = context.get("clarify_reason")
    place_type = context.get("place_type")
    pet_name = context.get("pet_name", "your pet")
    
    questions = []
    
    if clarify_reason == "need_location":
        questions.append({
            "id": "cq_location",
            "question": "Where should I search?",
            "chips": [
                {"id": "chip_use_location", "label": "Use current location", "payload_text": "Use my current location"},
                {"id": "chip_type_area", "label": "Type an area", "payload_text": "Let me type the area"}
            ]
        })
    
    elif clarify_reason == "need_location_consent":
        # CONSENT GATE: User said "near me" but no location permission yet
        # Single question with 2 chips - "Use current location" is the ONLY trigger for browser geo
        questions.append({
            "id": "cq_consent",
            "question": "Do you want me to use your current location, or tell me the area?",
            "chips": [
                {"id": "chip_use_location", "label": "Use current location", "payload_text": "Use my current location"},
                {"id": "chip_type_area", "label": "Type an area", "payload_text": "Let me type the area"}
            ]
        })
    
    return questions[:2]  # Max 2 questions


# ═══════════════════════════════════════════════════════════════════════════════
# FULL CONTRACT BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def build_conversation_contract(
    mode: str,
    assistant_text: str,
    context: Dict[str, Any] = None,
    places_results: List[Dict[str, Any]] = None,
    youtube_results: List[Dict[str, Any]] = None,
    ticket_id: str = None,
    actions: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build the full conversation_contract object.
    
    This is returned on EVERY chat response.
    Section 11.2 of PET_OS_BEHAVIOR_BIBLE.md defines the contract schema.
    """
    context = context or {}
    pillar = context.get("pillar")
    
    # Build quick replies (Section 11.3 chip library)
    quick_replies = build_quick_replies(
        mode=mode, 
        context=context, 
        pillar=pillar,
        ticket_id=ticket_id
    )
    
    # Build clarifying questions if clarify mode
    clarifying_questions = []
    if mode == "clarify":
        clarifying_questions = build_clarifying_questions(mode, context)
    
    # Build actions
    if actions is None:
        actions = []
        if mode in ["ticket", "handoff"]:
            actions.append({
                "type": "create_ticket",
                "label": "Send to Concierge",
                "payload": {
                    "pillar": context.get("pillar", "care"),
                    "category": "concierge_arranges",
                    "intent": context.get("original_message", "")
                }
            })
    
    # Build places query (if applicable)
    places_query = None
    if context.get("places_call_allowed"):
        places_query = {
            "query": context.get("place_type", ""),
            "location": context.get("location", ""),
            "radius_m": context.get("radius_m", 3000),
            "filters": context.get("place_filters", {})
        }
    
    # Build youtube query (if applicable)
    youtube_query = None
    if context.get("youtube_call_allowed"):
        youtube_query = {
            "query": context.get("topic", ""),
            "filters": context.get("youtube_filters", {})
        }
    
    contract = {
        "mode": mode,
        "assistant_text": assistant_text,
        "quick_replies": quick_replies,
        "clarifying_questions": clarifying_questions,
        "actions": actions,
        "places_query": places_query,
        "places_results": places_results or [],
        "youtube_query": youtube_query,
        "youtube_results": youtube_results or [],
        "spine": {
            "ticket_id": ticket_id
        },
        # Debug info (only shown in debug mode)
        "_debug": {
            "detected_intent": context.get("detected_intent"),
            "places_call_allowed": context.get("places_call_allowed", False),
            "youtube_call_allowed": context.get("youtube_call_allowed", False),
            "location_source": context.get("location_source", "none")
        }
    }
    
    return contract


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT FOR MIRA ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

async def process_conversation_contract(
    message: str,
    pet_context: Dict[str, Any] = None,
    has_location_permission: bool = False,
    db = None
) -> Dict[str, Any]:
    """
    Main entry point for conversation contract processing.
    
    Called from mira_routes.py on every chat response.
    
    Returns:
        {
            "mode_result": { mode router output },
            "contract_context": { context for building contract }
        }
    """
    pet_context = pet_context or {}
    
    # Determine mode
    mode_result = determine_contract_mode(
        message=message,
        has_location_permission=has_location_permission,
        pet_context=pet_context
    )
    
    # Build context for contract
    contract_context = {
        "pet_name": pet_context.get("name", "your pet"),
        "pet_id": pet_context.get("id"),
        "original_message": message,
        "detected_intent": mode_result["detected_intent"],
        "places_call_allowed": mode_result["places_call_allowed"],
        "youtube_call_allowed": mode_result["youtube_call_allowed"],
        "location_source": mode_result["location_source"],
        "clarify_reason": mode_result["clarify_reason"]
    }
    
    # Extract additional context from intent
    if mode_result["mode"] == "places":
        places_intent = mode_result["debug"]["places_intent"]
        contract_context["place_type"] = places_intent.get("place_type")
        contract_context["location"] = places_intent.get("location")
    
    elif mode_result["mode"] == "learn":
        learn_intent = mode_result["debug"]["learn_intent"]
        contract_context["topic"] = learn_intent.get("topic")
    
    elif mode_result["mode"] == "ticket":
        ticket_intent = mode_result["debug"]["ticket_intent"]
        contract_context["service_type"] = ticket_intent.get("service_type")
    
    return {
        "mode_result": mode_result,
        "contract_context": contract_context
    }
