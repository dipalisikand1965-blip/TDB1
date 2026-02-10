"""
Conversation Intelligence - The Brain of Mira's Understanding
=============================================================
This module handles:
1. Pronoun Resolution - "book that one" → actual product/service
2. Follow-up Context - "what about cheaper ones?" → remembers context
3. Reference Resolution - "the first one", "the second option" → specific item

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
    """
    input_lower = user_input.lower()
    
    # Check conversation history for context
    history_text = " ".join([
        msg.get("content", "").lower() 
        for msg in (conversation_history or [])[-5:]
    ])
    full_context = input_lower + " " + history_text
    
    # Meal plan / Diet advisory
    meal_keywords = [
        "meal plan", "diet", "nutrition", "food plan", "feeding schedule",
        "what to feed", "what should i feed", "home cooked", "homemade food",
        "raw diet", "healthy food", "healthy meal", "protein", "proteins",
        "portion", "how much to feed", "ingredients", "vegetables",
        "breakfast", "lunch", "dinner", "snack", "eggs", "chicken", "carrots"
    ]
    if any(kw in full_context for kw in meal_keywords):
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
        "care routine", "daily care", "health advice"
    ]
    if any(kw in full_context for kw in health_keywords):
        return True, "health_advice"
    
    # Training tips
    training_keywords = [
        "training tips", "how to train", "teach him", "teach her",
        "behavior tips", "stop barking", "stop biting", "potty training"
    ]
    if any(kw in full_context for kw in training_keywords):
        return True, "training_tips"
    
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
