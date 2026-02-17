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
# QUICK REPLIES BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def build_quick_replies(
    mode: str,
    context: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Build quick reply chips based on mode and context.
    
    Rules:
    - 3-6 chips max
    - Each chip has: id, label, payload_text, intent_type
    - intent_type: continue | refine | execute
    - No generic chips - must be grounded in mode + context
    """
    context = context or {}
    pet_name = context.get("pet_name", "your pet")
    place_type = context.get("place_type")
    topic = context.get("topic")
    
    quick_replies = []
    
    if mode == "clarify":
        # Clarification chips
        clarify_reason = context.get("clarify_reason", "need_location")
        
        if clarify_reason == "need_location":
            quick_replies = [
                {"id": "qr_use_location", "label": "Use my current location", "payload_text": "Use my current location", "intent_type": "continue"},
                {"id": "qr_choose_area", "label": "Choose an area", "payload_text": "Let me specify the area", "intent_type": "continue"},
                {"id": "qr_different_city", "label": "Different city", "payload_text": "Search in a different city", "intent_type": "continue"}
            ]
        elif clarify_reason == "need_location_consent":
            quick_replies = [
                {"id": "qr_allow_location", "label": "Allow location access", "payload_text": "Allow location access", "intent_type": "continue"},
                {"id": "qr_type_location", "label": "I'll type the location", "payload_text": "I'll type the location instead", "intent_type": "continue"}
            ]
    
    elif mode == "places":
        # Places result chips
        quick_replies = [
            {"id": "qr_call_place", "label": "Call this place", "payload_text": "Call the first place", "intent_type": "execute"},
            {"id": "qr_directions", "label": "Get directions", "payload_text": "Get directions to the first place", "intent_type": "execute"},
            {"id": "qr_more_options", "label": "Show more options", "payload_text": "Show me more options", "intent_type": "refine"},
            {"id": "qr_different_area", "label": "Try different area", "payload_text": "Search in a different area", "intent_type": "refine"}
        ]
        
        if place_type == "vet":
            quick_replies.insert(2, {"id": "qr_emergency", "label": "Emergency vets only", "payload_text": "Show only emergency vets", "intent_type": "refine"})
    
    elif mode == "learn":
        # Learning/YouTube chips
        quick_replies = [
            {"id": "qr_watch_video", "label": "Watch first video", "payload_text": "I'll watch the first video", "intent_type": "execute"},
            {"id": "qr_more_videos", "label": "More videos", "payload_text": "Show me more videos on this topic", "intent_type": "refine"},
            {"id": "qr_different_topic", "label": "Different topic", "payload_text": "I want to learn something else", "intent_type": "refine"}
        ]
        
        if topic:
            quick_replies.append({"id": "qr_advanced", "label": f"Advanced {topic}", "payload_text": f"Show advanced {topic} videos", "intent_type": "refine"})
    
    elif mode == "ticket":
        # Ticket/booking chips
        quick_replies = [
            {"id": "qr_book_now", "label": "Book now", "payload_text": "Yes, please book this for me", "intent_type": "execute"},
            {"id": "qr_more_details", "label": "Tell me more", "payload_text": "Tell me more details first", "intent_type": "continue"},
            {"id": "qr_different_time", "label": "Different time", "payload_text": "I need a different time", "intent_type": "refine"},
            {"id": "qr_concierge", "label": "Talk to Concierge", "payload_text": "Connect me with Concierge", "intent_type": "execute"}
        ]
    
    elif mode == "handoff":
        # Handoff chips (bespoke/specialist)
        quick_replies = [
            {"id": "qr_connect_concierge", "label": "Yes, connect me", "payload_text": "Yes, connect me with Concierge", "intent_type": "execute"},
            {"id": "qr_more_info", "label": "Tell me more first", "payload_text": "Tell me more about this first", "intent_type": "continue"},
            {"id": "qr_not_now", "label": "Not right now", "payload_text": "Not right now, thanks", "intent_type": "refine"}
        ]
    
    else:  # mode == "answer"
        # Default answer chips - contextual follow-ups
        quick_replies = [
            {"id": "qr_tell_more", "label": "Tell me more", "payload_text": "Tell me more about this", "intent_type": "continue"},
            {"id": "qr_find_place", "label": "Find a place", "payload_text": f"Help me find a place for {pet_name}", "intent_type": "refine"},
            {"id": "qr_book_service", "label": "Book a service", "payload_text": f"I want to book a service for {pet_name}", "intent_type": "execute"}
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
                {"id": "chip_use_location", "label": "Use my current location", "payload_text": "Use my current location"},
                {"id": "chip_type_area", "label": "Let me type the area", "payload_text": "Let me type the area"}
            ]
        })
        
        if place_type == "cafe":
            questions.append({
                "id": "cq_vibe",
                "question": "What kind of vibe?",
                "chips": [
                    {"id": "chip_quiet", "label": "Quiet", "payload_text": "Quiet cafe"},
                    {"id": "chip_social", "label": "Social", "payload_text": "Social cafe"},
                    {"id": "chip_outdoor", "label": "Outdoor", "payload_text": "Outdoor seating"}
                ]
            })
    
    elif clarify_reason == "need_location_consent":
        questions.append({
            "id": "cq_consent",
            "question": "I need your location to find places nearby. Allow access?",
            "chips": [
                {"id": "chip_allow", "label": "Allow location", "payload_text": "Allow location access"},
                {"id": "chip_type_instead", "label": "I'll type it", "payload_text": "I'll type the location instead"}
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
    """
    context = context or {}
    
    # Build quick replies
    quick_replies = build_quick_replies(mode, context)
    
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
