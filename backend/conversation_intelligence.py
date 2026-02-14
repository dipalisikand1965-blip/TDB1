"""
Conversation Intelligence - The Brain of Mira's Understanding
=============================================================
This module handles:
1. Pronoun Resolution - "book that one" → actual product/service
2. Follow-up Context - "what about cheaper ones?" → remembers context
3. Reference Resolution - "the first one", "the second option" → specific item
4. Multi-Intent Detection - "book grooming AND order treats" → multiple intents
5. Implicit Intent Detection - "he's scratching" → skin issue → vet needed

MIRA IS THE SOUL. This is how she truly understands.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# PRONOUN PATTERNS - What users say when referring to previous items
# ═══════════════════════════════════════════════════════════════════════════════

PRONOUN_PATTERNS = {
    # Direct pronouns
    "that one": {"type": "specific", "index": -1},  # Usually last shown/discussed
    "this one": {"type": "specific", "index": 0},   # First or current
    "it": {"type": "specific", "index": -1},
    "that": {"type": "specific", "index": -1},
    "this": {"type": "specific", "index": 0},
    
    # Ordinal references
    "the first one": {"type": "ordinal", "index": 0},
    "first one": {"type": "ordinal", "index": 0},
    "the first": {"type": "ordinal", "index": 0},
    "the second one": {"type": "ordinal", "index": 1},
    "second one": {"type": "ordinal", "index": 1},
    "the second": {"type": "ordinal", "index": 1},
    "the third one": {"type": "ordinal", "index": 2},
    "third one": {"type": "ordinal", "index": 2},
    "the third": {"type": "ordinal", "index": 2},
    "the last one": {"type": "ordinal", "index": -1},
    "last one": {"type": "ordinal", "index": -1},
    "the last": {"type": "ordinal", "index": -1},
    
    # Positional
    "top one": {"type": "ordinal", "index": 0},
    "bottom one": {"type": "ordinal", "index": -1},
    
    # Action-based (when booking/ordering)
    "book that": {"type": "specific", "index": -1, "action": "book"},
    "order that": {"type": "specific", "index": -1, "action": "order"},
    "get that": {"type": "specific", "index": -1, "action": "order"},
    "buy that": {"type": "specific", "index": -1, "action": "order"},
    "i want that": {"type": "specific", "index": -1, "action": "select"},
    "i'll take that": {"type": "specific", "index": -1, "action": "select"},
    "let's go with that": {"type": "specific", "index": -1, "action": "select"},
    "yes that one": {"type": "specific", "index": -1, "action": "confirm"},
    "yes please": {"type": "confirm_last", "index": -1},
}


# ═══════════════════════════════════════════════════════════════════════════════
# FOLLOW-UP PATTERNS - When user wants to refine previous search
# ═══════════════════════════════════════════════════════════════════════════════

FOLLOW_UP_PATTERNS = {
    # Price refinement
    "cheaper": {"type": "price_filter", "direction": "lower"},
    "less expensive": {"type": "price_filter", "direction": "lower"},
    "budget": {"type": "price_filter", "direction": "lower"},
    "affordable": {"type": "price_filter", "direction": "lower"},
    "cheaper ones": {"type": "price_filter", "direction": "lower"},
    "cheaper options": {"type": "price_filter", "direction": "lower"},
    "more affordable": {"type": "price_filter", "direction": "lower"},
    "more expensive": {"type": "price_filter", "direction": "higher"},
    "premium": {"type": "price_filter", "direction": "higher"},
    "high end": {"type": "price_filter", "direction": "higher"},
    "luxury": {"type": "price_filter", "direction": "higher"},
    
    # Quantity refinement
    "more options": {"type": "quantity", "action": "expand"},
    "show me more": {"type": "quantity", "action": "expand"},
    "more like these": {"type": "quantity", "action": "similar"},
    "similar ones": {"type": "quantity", "action": "similar"},
    "like these": {"type": "quantity", "action": "similar"},
    "anything else": {"type": "quantity", "action": "expand"},
    "other options": {"type": "quantity", "action": "expand"},
    "what else": {"type": "quantity", "action": "expand"},
    "any others": {"type": "quantity", "action": "expand"},
    
    # Category refinement
    "what about": {"type": "topic_shift", "action": "clarify"},
    "how about": {"type": "topic_shift", "action": "clarify"},
    "instead of": {"type": "replacement", "action": "replace"},
    "rather than": {"type": "replacement", "action": "replace"},
    
    # Filter refinement
    "but with": {"type": "add_filter", "action": "filter"},
    "only the ones": {"type": "add_filter", "action": "filter"},
    "just the": {"type": "add_filter", "action": "filter"},
    "without": {"type": "exclude_filter", "action": "filter"},
    "no": {"type": "exclude_filter", "action": "filter"},  # "no chicken"
    
    # Size refinement
    "smaller": {"type": "size_filter", "direction": "smaller"},
    "bigger": {"type": "size_filter", "direction": "larger"},
    "larger": {"type": "size_filter", "direction": "larger"},
    
    # Ingredient/detail questions (follow-ups to meal plans, recipes, etc.)
    "can i include": {"type": "detail_question", "action": "clarify"},
    "can i add": {"type": "detail_question", "action": "clarify"},
    "can i use": {"type": "detail_question", "action": "clarify"},
    "what about adding": {"type": "detail_question", "action": "clarify"},
    "should i include": {"type": "detail_question", "action": "clarify"},
    "is it okay to": {"type": "detail_question", "action": "clarify"},
    "can he have": {"type": "detail_question", "action": "clarify"},
    "can she have": {"type": "detail_question", "action": "clarify"},
    "what if": {"type": "detail_question", "action": "clarify"},
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXT CONTINUITY INDICATORS
# ═══════════════════════════════════════════════════════════════════════════════

CONTEXT_CONTINUITY_WORDS = [
    "also", "and", "too", "as well", "additionally",
    "what about", "how about", "any", "something",
    "that", "this", "these", "those", "them",
    "one", "ones", "option", "options",
]


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-INTENT DETECTION - Handle "X AND Y" queries
# ═══════════════════════════════════════════════════════════════════════════════

MULTI_INTENT_CONNECTORS = [
    " and ", " also ", " plus ", " & ", " as well as ",
    ", and ", ", also ", " both ", " along with ",
]

def detect_multi_intent(user_input: str) -> Dict[str, Any]:
    """
    Detect if user is asking for multiple things at once.
    
    Examples:
    - "Book grooming AND order treats" → [grooming, treats]
    - "I need a vet and also a groomer" → [vet, groomer]
    - "Show me food and toys" → [food, toys]
    
    Returns:
        {
            "is_multi_intent": True,
            "intents": ["grooming", "treats"],
            "original_query": "...",
            "split_queries": ["book grooming", "order treats"]
        }
    """
    if not user_input:
        return {"is_multi_intent": False}
    
    input_lower = user_input.lower().strip()
    
    # Check for multi-intent connectors
    for connector in MULTI_INTENT_CONNECTORS:
        if connector in input_lower:
            parts = input_lower.split(connector)
            if len(parts) >= 2:
                # Clean up parts
                split_queries = [p.strip() for p in parts if p.strip()]
                
                if len(split_queries) >= 2:
                    # Detect intent for each part
                    intents = []
                    for query in split_queries:
                        intent = detect_implicit_intent(query)
                        if intent.get("detected"):
                            intents.append(intent)
                        else:
                            intents.append({"query": query, "pillar": "general"})
                    
                    logger.info(f"[MULTI-INTENT] Detected {len(split_queries)} intents: {[i.get('pillar', i.get('query', '')) for i in intents]}")
                    
                    return {
                        "is_multi_intent": True,
                        "connector": connector.strip(),
                        "intents": intents,
                        "original_query": user_input,
                        "split_queries": split_queries,
                        "count": len(split_queries)
                    }
    
    return {"is_multi_intent": False}


# ═══════════════════════════════════════════════════════════════════════════════
# IMPLICIT INTENT DETECTION - Understand hidden meanings
# ═══════════════════════════════════════════════════════════════════════════════

# Symptom → Pillar/Intent mapping
IMPLICIT_INTENT_PATTERNS = {
    # Health symptoms → Care pillar
    "scratching": {"pillar": "care", "intent": "skin_issue", "urgency": "medium", "suggest": "vet_dermatology"},
    "itching": {"pillar": "care", "intent": "skin_issue", "urgency": "medium", "suggest": "vet_dermatology"},
    "not eating": {"pillar": "care", "intent": "appetite_loss", "urgency": "high", "suggest": "vet_checkup"},
    "won't eat": {"pillar": "care", "intent": "appetite_loss", "urgency": "high", "suggest": "vet_checkup"},
    "refusing food": {"pillar": "care", "intent": "appetite_loss", "urgency": "high", "suggest": "vet_checkup"},
    "vomiting": {"pillar": "emergency", "intent": "digestive_issue", "urgency": "critical", "suggest": "emergency_vet"},
    "throwing up": {"pillar": "emergency", "intent": "digestive_issue", "urgency": "critical", "suggest": "emergency_vet"},
    "diarrhea": {"pillar": "care", "intent": "digestive_issue", "urgency": "high", "suggest": "vet_checkup"},
    "loose stool": {"pillar": "care", "intent": "digestive_issue", "urgency": "medium", "suggest": "vet_checkup"},
    "limping": {"pillar": "emergency", "intent": "injury", "urgency": "high", "suggest": "emergency_vet"},
    "can't walk": {"pillar": "emergency", "intent": "injury", "urgency": "critical", "suggest": "emergency_vet"},
    "bleeding": {"pillar": "emergency", "intent": "injury", "urgency": "critical", "suggest": "emergency_vet"},
    "lethargic": {"pillar": "care", "intent": "general_illness", "urgency": "high", "suggest": "vet_checkup"},
    "not playing": {"pillar": "care", "intent": "behavior_change", "urgency": "medium", "suggest": "vet_checkup"},
    "seems sad": {"pillar": "care", "intent": "behavior_change", "urgency": "medium", "suggest": "behavior_consult"},
    "acting weird": {"pillar": "care", "intent": "behavior_change", "urgency": "medium", "suggest": "vet_checkup"},
    "coughing": {"pillar": "care", "intent": "respiratory", "urgency": "medium", "suggest": "vet_checkup"},
    "sneezing": {"pillar": "care", "intent": "respiratory", "urgency": "low", "suggest": "vet_checkup"},
    "breathing hard": {"pillar": "emergency", "intent": "respiratory", "urgency": "critical", "suggest": "emergency_vet"},
    "eye discharge": {"pillar": "care", "intent": "eye_issue", "urgency": "medium", "suggest": "vet_ophthalmology"},
    "red eyes": {"pillar": "care", "intent": "eye_issue", "urgency": "medium", "suggest": "vet_ophthalmology"},
    "ear smell": {"pillar": "care", "intent": "ear_infection", "urgency": "medium", "suggest": "vet_checkup"},
    "shaking head": {"pillar": "care", "intent": "ear_infection", "urgency": "medium", "suggest": "vet_checkup"},
    "losing fur": {"pillar": "care", "intent": "skin_issue", "urgency": "medium", "suggest": "vet_dermatology"},
    "bald patches": {"pillar": "care", "intent": "skin_issue", "urgency": "medium", "suggest": "vet_dermatology"},
    "drinking a lot": {"pillar": "care", "intent": "metabolic_issue", "urgency": "medium", "suggest": "vet_checkup"},
    "peeing a lot": {"pillar": "care", "intent": "urinary_issue", "urgency": "medium", "suggest": "vet_checkup"},
    
    # Behavior → Learn pillar
    "biting": {"pillar": "learn", "intent": "behavior_training", "urgency": "medium", "suggest": "trainer"},
    "barking too much": {"pillar": "learn", "intent": "behavior_training", "urgency": "low", "suggest": "trainer"},
    "aggressive": {"pillar": "learn", "intent": "behavior_training", "urgency": "high", "suggest": "behavior_specialist"},
    "not listening": {"pillar": "learn", "intent": "obedience", "urgency": "low", "suggest": "trainer"},
    "pulling on leash": {"pillar": "learn", "intent": "leash_training", "urgency": "low", "suggest": "trainer"},
    "jumping on people": {"pillar": "learn", "intent": "behavior_training", "urgency": "low", "suggest": "trainer"},
    "separation anxiety": {"pillar": "learn", "intent": "anxiety", "urgency": "medium", "suggest": "behavior_specialist"},
    "scared of": {"pillar": "learn", "intent": "fear", "urgency": "medium", "suggest": "behavior_specialist"},
    
    # Life events → Various pillars
    "going on vacation": {"pillar": "stay", "intent": "boarding", "urgency": "low", "suggest": "boarding_service"},
    "traveling": {"pillar": "travel", "intent": "travel_planning", "urgency": "low", "suggest": "travel_service"},
    "moving": {"pillar": "travel", "intent": "relocation", "urgency": "medium", "suggest": "pet_relocation"},
    "having a baby": {"pillar": "learn", "intent": "baby_prep", "urgency": "medium", "suggest": "behavior_specialist"},
    "new pet": {"pillar": "learn", "intent": "introduction", "urgency": "medium", "suggest": "trainer"},
    "birthday": {"pillar": "celebrate", "intent": "celebration", "urgency": "low", "suggest": "party_planning"},
    "anniversary": {"pillar": "celebrate", "intent": "celebration", "urgency": "low", "suggest": "party_planning"},
    "passed away": {"pillar": "farewell", "intent": "grief", "urgency": "high", "suggest": "memorial_service"},
    "rainbow bridge": {"pillar": "farewell", "intent": "grief", "urgency": "high", "suggest": "memorial_service"},
    "lost my": {"pillar": "farewell", "intent": "grief", "urgency": "high", "suggest": "grief_support"},
    
    # Daily care → Various pillars
    "getting fat": {"pillar": "fit", "intent": "weight_management", "urgency": "medium", "suggest": "diet_plan"},
    "overweight": {"pillar": "fit", "intent": "weight_management", "urgency": "medium", "suggest": "vet_nutrition"},
    "needs exercise": {"pillar": "fit", "intent": "fitness", "urgency": "low", "suggest": "dog_walker"},
    "too much energy": {"pillar": "fit", "intent": "fitness", "urgency": "low", "suggest": "daycare"},
    "bored": {"pillar": "enjoy", "intent": "enrichment", "urgency": "low", "suggest": "toys_activities"},
}

def detect_implicit_intent(user_input: str) -> Dict[str, Any]:
    """
    Detect implicit intent from user's description of symptoms/situations.
    
    Instead of user saying "I need a vet", they might say "he's scratching a lot"
    and Mira should understand this means skin issue → vet needed.
    
    Returns:
        {
            "detected": True,
            "pattern": "scratching",
            "pillar": "care",
            "intent": "skin_issue",
            "urgency": "medium",
            "suggest": "vet_dermatology",
            "response_hint": "It sounds like there might be a skin issue..."
        }
    """
    if not user_input:
        return {"detected": False}
    
    input_lower = user_input.lower().strip()
    
    # Check each implicit pattern
    for pattern, info in IMPLICIT_INTENT_PATTERNS.items():
        if pattern in input_lower:
            result = {
                "detected": True,
                "pattern": pattern,
                "pillar": info["pillar"],
                "intent": info["intent"],
                "urgency": info["urgency"],
                "suggest": info["suggest"],
            }
            
            # Generate response hint based on urgency
            if info["urgency"] == "critical":
                result["response_hint"] = f"This sounds urgent! Please seek immediate veterinary care."
            elif info["urgency"] == "high":
                result["response_hint"] = f"I'd recommend seeing a vet soon about this."
            elif info["urgency"] == "medium":
                result["response_hint"] = f"This is worth getting checked out."
            else:
                result["response_hint"] = f"I can help you with this."
            
            logger.info(f"[IMPLICIT] Detected '{pattern}' → {info['pillar']}/{info['intent']} (urgency: {info['urgency']})")
            
            return result
    
    return {"detected": False}


def detect_pronoun_reference(
    user_input: str,
    last_shown_items: List[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Detect if user is referring to a previously shown item.
    
    Returns:
        {
            "detected": True,
            "pattern": "that one",
            "index": 0,
            "resolved_item": {...},  # The actual product/service
            "action": "book"  # Optional action intent
        }
    """
    if not user_input:
        return None
    
    input_lower = user_input.lower().strip()
    
    # Check each pronoun pattern
    for pattern, info in PRONOUN_PATTERNS.items():
        if pattern in input_lower:
            result = {
                "detected": True,
                "pattern": pattern,
                "type": info["type"],
                "index": info["index"],
                "action": info.get("action")
            }
            
            # Resolve to actual item if we have context
            if last_shown_items and len(last_shown_items) > 0:
                idx = info["index"]
                if idx < 0:
                    idx = len(last_shown_items) + idx
                
                if 0 <= idx < len(last_shown_items):
                    result["resolved_item"] = last_shown_items[idx]
                    result["resolved_name"] = last_shown_items[idx].get("name", "item")
                    logger.info(f"[PRONOUN] Resolved '{pattern}' to: {result['resolved_name']}")
            
            return result
    
    return None


def detect_follow_up_intent(
    user_input: str,
    conversation_history: List[Dict[str, str]] = None,
    last_search_context: Dict[str, Any] = None
) -> Optional[Dict[str, Any]]:
    """
    Detect if user is making a follow-up query that depends on previous context.
    
    Returns:
        {
            "is_follow_up": True,
            "type": "price_filter",
            "direction": "lower",
            "original_context": {...}  # What we were searching for
        }
    """
    if not user_input:
        return None
    
    input_lower = user_input.lower().strip()
    
    # Check for follow-up patterns
    for pattern, info in FOLLOW_UP_PATTERNS.items():
        if pattern in input_lower:
            result = {
                "is_follow_up": True,
                "pattern": pattern,
                "type": info["type"],
                "action": info.get("action"),
                "direction": info.get("direction")
            }
            
            # Attach original search context if available
            if last_search_context:
                result["original_context"] = last_search_context
                logger.info(f"[FOLLOW-UP] Detected '{pattern}' - preserving context: {last_search_context.get('query', 'unknown')}")
            
            return result
    
    # Also detect short queries that rely on context
    # E.g., just "any cheaper?" or "more?" when we just showed products
    if len(input_lower.split()) <= 3:
        has_continuity_word = any(word in input_lower for word in CONTEXT_CONTINUITY_WORDS)
        if has_continuity_word and last_search_context:
            return {
                "is_follow_up": True,
                "pattern": "implicit_continuation",
                "type": "continuation",
                "action": "refine",
                "original_context": last_search_context
            }
    
    return None


def extract_context_from_history(
    conversation_history: List[Dict[str, str]],
    max_lookback: int = 5
) -> Dict[str, Any]:
    """
    Extract relevant context from conversation history.
    
    Returns search context including:
    - Last pillar discussed
    - Last products/services shown
    - Key entities mentioned (city, budget, dates)
    - Current topic
    """
    context = {
        "pillar": None,
        "query": None,
        "entities": {},
        "last_products": [],
        "last_services": [],
        "city": None,
        "budget": None,
        "dates": None,
    }
    
    if not conversation_history:
        return context
    
    # Look at recent history (reverse order - most recent first)
    recent = conversation_history[-max_lookback:] if len(conversation_history) > max_lookback else conversation_history
    
    for msg in reversed(recent):
        content = msg.get("content", "").lower()
        role = msg.get("role", "")
        
        # Extract entities from user messages
        if role == "user":
            # City detection
            city_patterns = [
                r"in\s+(\w+(?:\s+\w+)?)",  # "in Bangalore"
                r"near\s+(\w+(?:\s+\w+)?)",  # "near Koramangala"
                r"around\s+(\w+(?:\s+\w+)?)",  # "around Mumbai"
            ]
            for pattern in city_patterns:
                match = re.search(pattern, content)
                if match and not context["city"]:
                    context["city"] = match.group(1).title()
            
            # Budget detection
            budget_patterns = [
                r"under\s+(\d+)",
                r"below\s+(\d+)",
                r"budget\s+(\d+)",
                r"max\s+(\d+)",
                r"₹\s*(\d+)",
                r"rs\.?\s*(\d+)",
            ]
            for pattern in budget_patterns:
                match = re.search(pattern, content)
                if match and not context["budget"]:
                    context["budget"] = int(match.group(1))
            
            # Store the query that led to products
            if not context["query"]:
                context["query"] = msg.get("content", "")
    
    return context


def build_enhanced_query(
    original_query: str,
    follow_up_context: Dict[str, Any],
    previous_context: Dict[str, Any]
) -> str:
    """
    Build an enhanced query that combines follow-up intent with original context.
    
    E.g., "cheaper ones" + context of "birthday cakes" → "cheaper birthday cakes"
    """
    if not follow_up_context or not follow_up_context.get("is_follow_up"):
        return original_query
    
    original_search = previous_context.get("query", "")
    follow_up_type = follow_up_context.get("type", "")
    direction = follow_up_context.get("direction", "")
    
    # Build enhanced query based on follow-up type
    if follow_up_type == "price_filter":
        if direction == "lower":
            return f"cheaper {original_search}"
        elif direction == "higher":
            return f"premium {original_search}"
    
    elif follow_up_type == "quantity":
        return f"more {original_search}"
    
    elif follow_up_type == "size_filter":
        return f"{direction} {original_search}"
    
    # Default: return enhanced with original context
    return f"{original_query} {original_search}".strip()


def resolve_conversation_references(
    user_input: str,
    conversation_history: List[Dict[str, str]] = None,
    last_shown_items: List[Dict[str, Any]] = None,
    last_search_context: Dict[str, Any] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    MAIN FUNCTION: Resolve all references in user input.
    
    Returns:
        (enhanced_query, resolution_info)
        
    resolution_info contains:
        - pronoun_resolved: True if we resolved a pronoun
        - follow_up_detected: True if this is a follow-up query
        - resolved_item: The specific item if pronoun resolved
        - enhanced_query: The query with context filled in
    """
    resolution_info = {
        "pronoun_resolved": False,
        "follow_up_detected": False,
        "resolved_item": None,
        "original_input": user_input,
        "context_used": False
    }
    
    enhanced_query = user_input
    
    # 1. Check for pronoun references ("that one", "the first one")
    pronoun_result = detect_pronoun_reference(user_input, last_shown_items)
    if pronoun_result and pronoun_result.get("detected"):
        resolution_info["pronoun_resolved"] = True
        resolution_info["resolved_item"] = pronoun_result.get("resolved_item")
        resolution_info["pronoun_action"] = pronoun_result.get("action")
        resolution_info["pronoun_pattern"] = pronoun_result.get("pattern")
        
        # If we resolved to a specific item, include its name in the query
        if resolution_info["resolved_item"]:
            item_name = resolution_info["resolved_item"].get("name", "")
            enhanced_query = user_input.replace(
                pronoun_result["pattern"], 
                f"'{item_name}'"
            )
            resolution_info["context_used"] = True
            logger.info(f"[INTELLIGENCE] Pronoun resolved: '{pronoun_result['pattern']}' → '{item_name}'")
    
    # 2. Check for follow-up context ("cheaper ones", "show me more")
    previous_context = extract_context_from_history(conversation_history)
    if last_search_context:
        previous_context.update(last_search_context)
    
    follow_up_result = detect_follow_up_intent(
        user_input, 
        conversation_history, 
        previous_context
    )
    
    if follow_up_result and follow_up_result.get("is_follow_up"):
        resolution_info["follow_up_detected"] = True
        resolution_info["follow_up_type"] = follow_up_result.get("type")
        resolution_info["follow_up_action"] = follow_up_result.get("action")
        resolution_info["original_context"] = previous_context
        
        # Build enhanced query with context
        enhanced_query = build_enhanced_query(
            enhanced_query,
            follow_up_result,
            previous_context
        )
        resolution_info["context_used"] = True
        logger.info(f"[INTELLIGENCE] Follow-up detected: {follow_up_result['type']} - enhanced to: '{enhanced_query}'")
    
    resolution_info["enhanced_query"] = enhanced_query
    
    return enhanced_query, resolution_info


# ═══════════════════════════════════════════════════════════════════════════════
# TIP CARD GENERATION - For advisory content
# ═══════════════════════════════════════════════════════════════════════════════

def should_generate_tip_card(
    user_input: str,
    intent: str,
    conversation_history: List[Dict[str, str]] = None
) -> Tuple[bool, str]:
    """
    Determine if we should generate a tip card instead of showing products.
    
    Returns:
        (should_generate, tip_card_type)
    
    IMPORTANT: Product/shopping queries should NOT generate tip cards.
    The tip card type should be determined primarily by the CURRENT user input,
    not by conversation history (to prevent leash being categorized as meal_plan).
    """
    input_lower = user_input.lower()
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # PRODUCT QUERIES - NEVER generate tip cards for shopping/product intents
    # These are direct product requests, not advice-seeking
    # ═══════════════════════════════════════════════════════════════════════════════
    product_keywords = [
        "leash", "collar", "harness", "toy", "toys", "bowl", "bed", "crate",
        "carrier", "cage", "kennel", "clothes", "jacket", "sweater", "bandana",
        "brush", "comb", "nail clipper", "shampoo", "conditioner", "wipes",
        "poop bags", "treat pouch", "food bowl", "water bowl", "feeder",
        "tag", "id tag", "microchip", "gps", "tracker", "camera", "monitor",
        "gate", "fence", "ramp", "stairs", "mat", "pad", "blanket",
        "buy", "purchase", "order", "get me", "find me", "show me", "looking for",
        "where can i get", "where to buy", "recommend a", "suggest a", "best"
    ]
    
    # If current input is clearly a product query, skip tip card
    if any(kw in input_lower for kw in product_keywords):
        logger.debug(f"[TIP_CARD] Skipping tip card for product query: {input_lower[:50]}")
        return False, None
    
    # Check conversation history for context (but ONLY for advisory topics)
    history_text = " ".join([
        msg.get("content", "").lower() 
        for msg in (conversation_history or [])[-5:]
    ])
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # TIP CARD DETECTION - Prioritize CURRENT input over history
    # Only use history to detect CONTINUATION of advisory topics
    # ═══════════════════════════════════════════════════════════════════════════════
    
    # Meal plan / Diet advisory - MUST be in CURRENT input
    meal_keywords_strict = [
        "meal plan", "diet plan", "nutrition plan", "food plan", "feeding schedule",
        "what to feed", "what should i feed", "home cooked", "homemade food",
        "raw diet", "healthy food", "healthy meal", "how much to feed"
    ]
    if any(kw in input_lower for kw in meal_keywords_strict):
        return True, "meal_plan"
    
    # Allow broader meal keywords only if continuing a meal plan conversation
    meal_continuation_keywords = [
        "eggs", "chicken", "carrots", "vegetables", "protein", "proteins",
        "breakfast", "lunch", "dinner", "snack", "portion", "ingredients"
    ]
    meal_context_keywords = ["meal", "diet", "feeding", "food plan", "nutrition"]
    is_meal_context = any(kw in history_text for kw in meal_context_keywords)
    if is_meal_context and any(kw in input_lower for kw in meal_continuation_keywords):
        return True, "meal_plan"
    
    # Travel tips
    travel_keywords = [
        "packing list", "what to pack", "travel checklist", "travel tips",
        "prepare for trip", "tips for traveling", "how to travel with"
    ]
    if any(kw in full_context for kw in travel_keywords):
        return True, "travel_tips"
    
    # Health advice
    health_keywords = [
        "health tips", "preventive care", "keep healthy", "wellness tips",
        "care routine", "daily care", "health advice", "allergies", "allergy",
        "what to avoid", "dangerous", "toxic", "household items"
    ]
    if any(kw in full_context for kw in health_keywords):
        return True, "health_advice"
    
    # Training tips - expanded keywords
    training_keywords = [
        "training tips", "how to train", "teach him", "teach her",
        "behavior tips", "stop barking", "stop biting", "potty training",
        "how do i teach", "teach to sit", "teach to stay", "teach to come",
        "obedience", "basic commands", "leash training", "crate training",
        "barking at strangers", "aggressive", "jumping on people"
    ]
    if any(kw in full_context for kw in training_keywords):
        return True, "training_tips"
    
    # Calming / Anxiety tips - CHECK BEFORE festival (more specific)
    calming_keywords = [
        "calming", "calm", "soothe", "anxiety", "anxious", "scared", "stress",
        "nervous", "thunder", "loud noise", "afraid", "panic", "trembling",
        "calming space", "safe space", "comfort", "comfort zone"
    ]
    if any(kw in full_context for kw in calming_keywords):
        return True, "calming_tips"
    
    # Festival/Event safety tips
    festival_keywords = [
        "diwali", "holi", "christmas", "new year", "festival", "fireworks",
        "crackers", "loud noise", "safely include", "safe celebration",
        "pet safe", "keep safe during"
    ]
    if any(kw in full_context for kw in festival_keywords):
        return True, "festival_safety"
    
    # Celebration/Gotcha day tips
    celebration_keywords = [
        "gotcha day", "gotcha", "adoption day", "how to celebrate",
        "what is gotcha", "celebrate adoption", "anniversary with pet"
    ]
    if any(kw in full_context for kw in celebration_keywords):
        return True, "celebration_tips"
    
    # New pet / Adoption / Preparation tips - EXPANDED
    adoption_keywords = [
        "just adopted", "new puppy", "new pet", "first time pet parent",
        "what do i need to know", "new dog owner", "just got a dog",
        "first time with", "puppy care", "kitten care",
        "before the dog arrives", "before bringing home", "set up at home",
        "prepare for", "getting ready for", "what do we need", "checklist",
        "things to buy", "essentials for", "must-have", "prepare home"
    ]
    if any(kw in full_context for kw in adoption_keywords):
        return True, "new_pet_guide"
    
    # Privacy / Safety / Security tips
    privacy_safety_keywords = [
        "privacy", "sharing photos", "share photos", "photographer",
        "social media", "posting online", "public photos", "consent",
        "security", "location", "personal details", "watermark",
        "stranger danger", "safe to share", "should i share"
    ]
    if any(kw in full_context for kw in privacy_safety_keywords):
        return True, "safety_tips"
    
    # Sleeping / Home tips
    home_keywords = [
        "where should", "sleep", "sleeping arrangement", "bed", "crate",
        "separation anxiety", "home alone", "leaving alone"
    ]
    if any(kw in full_context for kw in home_keywords):
        return True, "home_tips"
    
    # Grooming tips
    grooming_keywords = [
        "groom", "grooming", "bath", "bathing", "brush", "brushing",
        "nail trim", "nail cutting", "ear clean", "coat care", "shedding",
        "how often to bathe", "how to brush"
    ]
    if any(kw in full_context for kw in grooming_keywords):
        return True, "grooming_routine"
    
    # Exercise / Activity tips
    exercise_keywords = [
        "exercise", "how much exercise", "daily walk", "activity",
        "physical activity", "play time", "outdoor activities",
        "how much should", "how often should"
    ]
    if any(kw in full_context for kw in exercise_keywords):
        return True, "exercise_routine"
    
    # Bonding / Quality time tips
    bonding_keywords = [
        "bonding", "bond with", "quality time", "spend time",
        "connection", "ritual", "daily ritual", "routine with"
    ]
    if any(kw in full_context for kw in bonding_keywords):
        return True, "bonding_ritual"
    
    return False, None


def generate_tip_card_structure(
    tip_type: str,
    pet_context: Dict[str, Any],
    user_query: str
) -> Dict[str, Any]:
    """
    Generate the structure for a tip card based on type.
    """
    pet_name = pet_context.get("name", "your pet")
    breed = pet_context.get("breed", "")
    
    tip_cards = {
        "meal_plan": {
            "type": "meal_plan",
            "title": f"{pet_name}'s Meal Plan",
            "icon": "🍽️",
            "color": "amber",
            "sections": ["breakfast", "lunch", "dinner", "snacks", "avoid"],
            "cta_text": "Send to Concierge® for formal plan",
            "cta_action": "send_meal_plan_to_concierge"
        },
        "travel_tips": {
            "type": "travel_tips",
            "title": f"Travel Checklist for {pet_name}",
            "icon": "✈️",
            "color": "blue",
            "sections": ["documents", "essentials", "comfort", "safety"],
            "cta_text": "Book travel assistance",
            "cta_action": "book_travel_concierge"
        },
        "health_advice": {
            "type": "health_advice",
            "title": f"{pet_name}'s Health Tips",
            "icon": "💊",
            "color": "green",
            "sections": ["daily_care", "warning_signs", "preventive", "schedule"],
            "cta_text": "Schedule vet checkup",
            "cta_action": "book_vet_appointment"
        },
        "training_tips": {
            "type": "training_tips",
            "title": f"Training Guide for {pet_name}",
            "icon": "🎓",
            "color": "purple",
            "sections": ["basics", "tips", "mistakes_to_avoid", "progress"],
            "cta_text": "Find a trainer",
            "cta_action": "find_trainer"
        },
        "festival_safety": {
            "type": "festival_safety",
            "title": f"Festival Safety for {pet_name}",
            "icon": "🎆",
            "color": "orange",
            "sections": ["preparation", "during_event", "calming_tips", "emergency"],
            "cta_text": "Get anxiety products",
            "cta_action": "shop_anxiety_products"
        },
        "celebration_tips": {
            "type": "celebration_tips",
            "title": f"Celebrating {pet_name}'s Special Day",
            "icon": "🎉",
            "color": "pink",
            "sections": ["ideas", "activities", "treats", "memories"],
            "cta_text": "Shop celebration items",
            "cta_action": "shop_celebration"
        },
        "new_pet_guide": {
            "type": "new_pet_guide",
            "title": f"Welcome {pet_name}! Your First Week Guide",
            "icon": "🐾",
            "color": "teal",
            "sections": ["essentials", "first_vet_visit", "house_training", "bonding"],
            "cta_text": "Shop puppy essentials",
            "cta_action": "shop_puppy_essentials"
        },
        "home_tips": {
            "type": "home_tips",
            "title": f"Home Comfort for {pet_name}",
            "icon": "🏠",
            "color": "indigo",
            "sections": ["sleeping", "safe_space", "routine", "comfort_items"],
            "cta_text": "Shop comfort items",
            "cta_action": "shop_comfort"
        }
    }
    
    return tip_cards.get(tip_type, {
        "type": "general",
        "title": f"Tips for {pet_name}",
        "icon": "💡",
        "color": "yellow",
        "sections": ["recommendations"],
        "cta_text": "Ask Concierge®",
        "cta_action": "send_to_concierge"
    })
