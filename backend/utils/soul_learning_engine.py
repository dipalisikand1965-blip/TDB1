"""
Soul Learning Engine
====================
The intelligence layer that makes Mira learn from every interaction.

THREE LANES OF PET INTELLIGENCE:
1. Conversation Context (ephemeral, per chat turn)
2. Saved Pet Intelligence (durable Soul + Enrichments)
3. Execution History (tickets/orders/events → enrichments)

THE GOLDEN RULE: "The longer a pet lives with us, the less their parent has to explain."

Created: Feb 19, 2026
Based on: PET_OS_BEHAVIOR_BIBLE.md Section 4 (Insights)
"""

import re
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Database reference (set by mira_routes on startup)
_db = None

def set_learning_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# =============================================================================
# SECTION 1: WHAT MUST BE RECALLED AUTOMATICALLY (every turn)
# =============================================================================

MUST_RECALL_FIELDS = {
    "health": [
        "allergies", "sensitivities", "medical_conditions", "food_allergies",
        "dietary_restrictions", "sensitive_stomach"
    ],
    "triggers": [
        "dislikes", "anxiety_triggers", "noise_sensitivity", "grooming_triggers"
    ],
    "routines": [
        "walk_time", "feeding_time", "exercise_needs", "grooming_preference"
    ],
    "temperament": [
        "temperament", "general_nature", "energy_level", "separation_anxiety",
        "behavior_with_dogs", "behavior_with_humans", "stranger_reaction"
    ],
    "identity": [
        "name", "breed", "age", "weight", "gender", "birthday"
    ],
    "preferences": [
        "favorite_treats", "favorite_flavors", "diet_type", "activity_level"
    ]
}


def get_fields_to_recall(pet_soul: Dict, intent: str = None) -> Dict[str, Any]:
    """
    Get all fields that MUST be recalled for a given pet, optionally filtered by intent.
    
    Returns dict with:
    - memory_used: list of field names used
    - memory_values: dict of field -> value
    """
    if not pet_soul:
        return {"memory_used": [], "memory_values": {}}
    
    memory_used = []
    memory_values = {}
    
    # Intent-specific priority fields
    intent_priority = {
        "health": ["allergies", "sensitivities", "medical_conditions", "food_allergies"],
        "food": ["allergies", "food_allergies", "dislikes", "favorite_treats", "favorite_flavors", "diet_type"],
        "grooming": ["grooming_preference", "handling_sensitivity", "grooming_triggers", "anxiety_triggers"],
        "travel": ["travel_style", "crate_trained", "anxiety_triggers", "stay_preference", "hotel_experience"],
        "care": ["temperament", "separation_anxiety", "energy_level", "behavior_with_dogs"],
        "celebrate": ["birthday", "gotcha_date", "favorites", "personality_tag"],
    }
    
    # Collect from all categories
    for category, fields in MUST_RECALL_FIELDS.items():
        for field in fields:
            value = _get_nested_value(pet_soul, field)
            if value and value not in [[], {}, "", None, "Unknown", "Not specified"]:
                memory_used.append(field)
                memory_values[field] = value
    
    # Also check doggy_soul_answers
    dsa = pet_soul.get("doggy_soul_answers") or {}
    if dsa:
        for field, value in dsa.items():
            if value and field not in memory_values and value not in [[], {}, "", None]:
                memory_used.append(f"doggy_soul.{field}")
                memory_values[field] = value
    
    # Check soul_enrichments
    enrichments = pet_soul.get("soul_enrichments", {})
    if enrichments:
        for field, value in enrichments.items():
            if value and isinstance(value, dict) and value.get("value"):
                memory_used.append(f"enrichment.{field}")
                memory_values[f"enrichment_{field}"] = value.get("value")
    
    return {
        "memory_used": memory_used,
        "memory_values": memory_values
    }


def _get_nested_value(data: Dict, field: str) -> Any:
    """Get value from nested dict structure"""
    if field in data:
        return data[field]
    
    # Check nested locations
    for parent in ["health", "preferences", "personality", "identity", "travel", "care", "soul"]:
        nested = data.get(parent, {})
        if isinstance(nested, dict) and field in nested:
            return nested[field]
    
    return None


# =============================================================================
# SECTION 2: AUTO-ENRICHMENT FROM CONVERSATIONS
# =============================================================================

# Patterns for durable facts that SHOULD be saved
ENRICHMENT_SAVE_PATTERNS = {
    "dislikes": {
        "patterns": [
            r"(?:she|he|they) hates? (.+)",
            r"(?:she|he|they) can'?t stand (.+)",
            r"(?:she|he|they) doesn'?t like (.+)",
            r"(?:she|he|they) avoids? (.+)",
            r"doesn'?t like (.+)",
            r"hates (.+)"
        ],
        "field": "dislikes",
        "is_durable": True
    },
    "allergies": {
        "patterns": [
            r"allergic to (.+)",
            r"can'?t eat (.+)",
            r"has (?:a )?(.+) allergy",
            r"sensitive to (.+)"
        ],
        "field": "food_allergies",
        "is_durable": True
    },
    "favorites": {
        "patterns": [
            r"(?:she|he|they) loves? (.+)",
            r"(?:she|he|they) really likes? (.+)",
            r"favorite (?:thing|treat|toy|activity) is (.+)",
            r"goes crazy for (.+)",
            r"always wants (.+)",
            r"(\w+) loves (.+)",  # "Mystique loves swimming"
            r"loves? to (.+)",    # "loves to swim"
            r"enjoys (.+)"        # "enjoys swimming"
        ],
        "field": "favorites",
        "is_durable": True
    },
    "anxiety_triggers": {
        "patterns": [
            r"scared of (.+)",
            r"afraid of (.+)",
            r"anxious (?:about|around|with) (.+)",
            r"freaks out (?:at|with|around) (.+)",
            r"gets nervous (?:about|around|with) (.+)"
        ],
        "field": "anxiety_triggers",
        "is_durable": True
    },
    "health_behavior": {
        "patterns": [
            r"gets car sick",
            r"has motion sickness",
            r"throws up in the car",
            r"gets queasy"
        ],
        "field": "travel_sensitivity",
        "is_durable": True,
        "value": "car_sick"
    },
    "routines": {
        "patterns": [
            r"always (?:walks|eats|sleeps) at (.+)",
            r"(?:we|i) (?:walk|feed) (?:her|him|them) at (.+)",
            r"(?:she|he|they) eats? at (.+)"
        ],
        "field": "routines",
        "is_durable": True
    },
    "diet_preference": {
        "patterns": [
            r"only eats (.+)",
            r"(?:on|follows) a (.+) diet",
            r"(?:she|he) is (.+)-free",
            r"(?:she|he) needs (.+)-free"
        ],
        "field": "diet_type",
        "is_durable": True
    }
}

# Patterns that should NOT be saved (ephemeral/context only)
EPHEMERAL_PATTERNS = [
    r"maybe",
    r"might be",
    r"seems",
    r"today",
    r"right now",
    r"at the moment",
    r"lately",
    r"recently",
    r"I think",
    r"not sure",
    r"tomorrow at",
    r"next week",
    r"on \w+day",  # specific day
]


def extract_enrichments_from_message(
    message: str, 
    pet_name: str = None,
    existing_enrichments: Dict = None
) -> Dict:
    """
    Extract durable facts from user message for soul enrichment.
    
    Returns:
    {
        "new_enrichments_saved": [{"field": ..., "value": ..., "confidence": ...}],
        "not_saved_reason": [{"text": ..., "reason": ...}]
    }
    """
    if not message:
        return {"new_enrichments_saved": [], "not_saved_reason": []}
    
    message_lower = message.lower()
    new_enrichments = []
    not_saved = []
    existing_enrichments = existing_enrichments or {}
    
    # Check if message contains ephemeral markers
    is_ephemeral = any(re.search(p, message_lower) for p in EPHEMERAL_PATTERNS)
    
    for category, config in ENRICHMENT_SAVE_PATTERNS.items():
        for pattern in config["patterns"]:
            matches = re.finditer(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                extracted_value = config.get("value") or match.group(1).strip() if match.lastindex else None
                
                if not extracted_value:
                    continue
                
                # Clean up the extracted value
                extracted_value = _clean_extracted_value(extracted_value)
                
                if not extracted_value:
                    continue
                
                # Check if this should be saved
                if is_ephemeral:
                    not_saved.append({
                        "text": match.group(0),
                        "value": extracted_value,
                        "field": config["field"],
                        "reason": "ephemeral_marker"
                    })
                    continue
                
                # Check if already known
                existing = existing_enrichments.get(config["field"], [])
                if isinstance(existing, list) and extracted_value.lower() in [str(e).lower() for e in existing]:
                    not_saved.append({
                        "text": match.group(0),
                        "value": extracted_value,
                        "field": config["field"],
                        "reason": "already_known"
                    })
                    continue
                
                # This is a new durable fact - save it
                new_enrichments.append({
                    "field": config["field"],
                    "value": extracted_value,
                    "source": "conversation",
                    "source_text": match.group(0),
                    "confidence": 0.85,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    return {
        "new_enrichments_saved": new_enrichments,
        "not_saved_reason": not_saved
    }


def _clean_extracted_value(value: str) -> str:
    """Clean up extracted value to get the core fact"""
    if not value:
        return ""
    
    # Remove common trailing phrases that add context but not the core fact
    value = re.sub(r'\s+(and always|and she|and he|and they|and never|and sometimes|when|because|since|so|which).+$', '', value, flags=re.IGNORECASE)
    # Remove common trailing words
    value = re.sub(r'\s+(very much|a lot|so much|really)$', '', value, flags=re.IGNORECASE)
    # Remove punctuation at end
    value = re.sub(r'[.,!?;:]+$', '', value).strip()
    # Remove articles at start
    value = re.sub(r'^(the|a|an)\s+', '', value, flags=re.IGNORECASE)
    # Limit to reasonable length (max 50 chars for a dislike/trigger)
    if len(value) > 50:
        # Try to find first key noun/phrase
        parts = value.split()
        if len(parts) > 5:
            value = ' '.join(parts[:5])
    
    return value.strip()


async def save_enrichment_to_pet(
    pet_id: str,
    field: str,
    value: Any,
    source: str = "conversation",
    confidence: float = 0.85
) -> bool:
    """
    Save a single enrichment to the pet's soul_enrichments.
    
    Uses append for list fields, overwrite for scalar fields.
    """
    db = get_db()
    if not db:
        logger.error("[SOUL-LEARNING] No database connection")
        return False
    
    try:
        # Determine if this is a list field
        list_fields = ["dislikes", "favorites", "anxiety_triggers", "food_allergies", "routines"]
        
        enrichment_data = {
            "value": value,
            "source": source,
            "confidence": confidence,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if field in list_fields:
            # Append to list (avoid duplicates)
            result = await db.pets.update_one(
                {"id": pet_id},
                {
                    "$addToSet": {f"soul_enrichments.{field}": value},
                    "$set": {f"soul_enrichments.{field}_meta": enrichment_data}
                }
            )
        else:
            # Scalar field - overwrite
            result = await db.pets.update_one(
                {"id": pet_id},
                {"$set": {f"soul_enrichments.{field}": enrichment_data}}
            )
        
        if result.modified_count > 0:
            logger.info(f"[SOUL-LEARNING] Saved enrichment: pet={pet_id}, field={field}, value={value}")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"[SOUL-LEARNING] Error saving enrichment: {e}")
        return False


# =============================================================================
# SECTION 3: TICKET/ORDER MINING FOR ENRICHMENTS
# =============================================================================

async def mine_ticket_for_enrichments(ticket: Dict, pet_id: str) -> List[Dict]:
    """
    Mine a ticket for durable facts that should become enrichments.
    
    Auto-enrich when:
    - User preference is explicit ("only morning walks")
    - Allergy/avoid is explicit ("no chicken treats")
    - Behavior trigger is explicit ("reactive to male dogs")
    - Travel preference is explicit ("prefers villas, not hotels")
    
    Do NOT enrich when:
    - Just scheduling ("tomorrow 6pm grooming")
    - Financial/transactional only
    - Ambiguous ("not sure what she wants")
    """
    enrichments_found = []
    
    if not ticket:
        return enrichments_found
    
    # Fields to check in ticket
    check_fields = [
        "original_request",
        "user_notes", 
        "special_requirements",
        "dietary_requirements",
        "ai_context"
    ]
    
    text_to_mine = []
    for field in check_fields:
        value = ticket.get(field)
        if isinstance(value, str) and value:
            text_to_mine.append(value)
        elif isinstance(value, dict):
            # Extract text from nested dicts
            for k, v in value.items():
                if isinstance(v, str) and v:
                    text_to_mine.append(v)
    
    # Also check messages
    messages = ticket.get("messages", [])
    for msg in messages:
        if msg.get("sender") == "user" and msg.get("content"):
            text_to_mine.append(msg["content"])
    
    # Extract enrichments from combined text
    combined_text = " ".join(text_to_mine)
    result = extract_enrichments_from_message(combined_text)
    
    return result.get("new_enrichments_saved", [])


async def mine_order_patterns_for_enrichments(
    orders: List[Dict], 
    pet_id: str,
    min_repetitions: int = 2
) -> List[Dict]:
    """
    Mine order history for repeated patterns that become enrichments.
    
    Only convert order history into enrichments when:
    - It repeats (2-3 times) OR
    - User explicitly says "she always needs..."
    """
    enrichments = []
    
    if not orders or len(orders) < min_repetitions:
        return enrichments
    
    # Track patterns
    patterns = {
        "product_types": {},
        "brands": {},
        "sizes": {},
        "delivery_areas": {}
    }
    
    for order in orders:
        items = order.get("items", [])
        for item in items:
            # Track product types
            ptype = item.get("product_type") or item.get("category")
            if ptype:
                patterns["product_types"][ptype] = patterns["product_types"].get(ptype, 0) + 1
            
            # Track brands
            brand = item.get("brand")
            if brand:
                patterns["brands"][brand] = patterns["brands"].get(brand, 0) + 1
            
            # Track sizes
            size = item.get("size")
            if size:
                patterns["sizes"][size] = patterns["sizes"].get(size, 0) + 1
        
        # Track delivery areas
        address = order.get("delivery_address", {})
        area = address.get("area") or address.get("locality")
        if area:
            patterns["delivery_areas"][area] = patterns["delivery_areas"].get(area, 0) + 1
    
    # Convert repeated patterns to enrichments
    for pattern_type, counts in patterns.items():
        for value, count in counts.items():
            if count >= min_repetitions:
                enrichments.append({
                    "field": f"preference_{pattern_type}",
                    "value": value,
                    "count": count,
                    "source": "order_history",
                    "confidence": min(0.7 + (count * 0.05), 0.95)
                })
    
    return enrichments


# =============================================================================
# SECTION 4: MEMORY TRACE FOR QA (debug output)
# =============================================================================

def build_memory_trace(
    pet_soul: Dict,
    message: str,
    intent: str = None
) -> Dict:
    """
    Build a QA trace showing what memory was used and what was saved.
    
    Bible Section F requires these EXACT fields:
    - known_fields_used
    - new_enrichments_detected
    - saved_enrichments
    - rejected_enrichments + reason
    
    Returns dict matching Bible spec for QA validation.
    """
    # Get recalled fields
    recall_info = get_fields_to_recall(pet_soul, intent)
    
    # Get extraction results
    existing_enrichments = {}
    if pet_soul:
        existing_enrichments = pet_soul.get("soul_enrichments", {})
        # Also include direct fields as "known"
        for field in ["dislikes", "allergies", "favorites", "anxiety_triggers"]:
            if pet_soul.get(field):
                existing_enrichments[field] = pet_soul[field]
    
    extraction_result = extract_enrichments_from_message(
        message, 
        pet_name=pet_soul.get("name") if pet_soul else None,
        existing_enrichments=existing_enrichments
    )
    
    # Build Bible-compliant trace with exact field names
    return {
        # Bible field: known_fields_used
        "known_fields_used": recall_info["memory_used"],
        
        # Bible field: new_enrichments_detected (all detected, before save decision)
        "new_enrichments_detected": extraction_result["new_enrichments_saved"],
        
        # Bible field: saved_enrichments (what will actually be saved)
        "saved_enrichments": [
            {"field": e.get("field"), "value": e.get("value"), "source": e.get("source")}
            for e in extraction_result["new_enrichments_saved"]
        ],
        
        # Bible field: rejected_enrichments + reason
        "rejected_enrichments": [
            {"field": e.get("field"), "value": e.get("value"), "reason": e.get("reason")}
            for e in extraction_result["not_saved_reason"]
        ],
        
        # Additional context (for debugging, not Bible-required)
        "_memory_values": recall_info["memory_values"],
        "_intent": intent
    }


# =============================================================================
# SECTION 5: NEVER RE-ASK RULE
# =============================================================================

def get_known_facts_prompt(pet_soul: Dict) -> str:
    """
    Generate a prompt section that tells Mira what she already knows.
    This enforces the "never re-ask" rule.
    """
    if not pet_soul:
        return ""
    
    lines = []
    pet_name = pet_soul.get("name", "this pet")
    
    lines.append(f"\n🧠 **WHAT I ALREADY KNOW ABOUT {pet_name.upper()}** (DO NOT RE-ASK):\n")
    
    # Identity
    identity_fields = {
        "name": pet_soul.get("name"),
        "breed": pet_soul.get("breed"),
        "age": pet_soul.get("age"),
        "weight": pet_soul.get("weight"),
        "gender": pet_soul.get("gender"),
        "birthday": pet_soul.get("birthday") or pet_soul.get("birth_date")
    }
    identity_known = {k: v for k, v in identity_fields.items() if v}
    if identity_known:
        lines.append("📋 **Identity:**")
        for k, v in identity_known.items():
            lines.append(f"  - {k.title()}: {v}")
    
    # Health (CRITICAL - never ask about known allergies)
    health_fields = {
        "allergies": pet_soul.get("allergies") or pet_soul.get("food_allergies"),
        "medical_conditions": pet_soul.get("medical_conditions") or pet_soul.get("health_conditions"),
        "sensitivities": pet_soul.get("sensitivities"),
        "dietary_restrictions": pet_soul.get("dietary_restrictions")
    }
    health_known = {k: v for k, v in health_fields.items() if v and v != []}
    if health_known:
        lines.append("🏥 **Health (NEVER ASK AGAIN):**")
        for k, v in health_known.items():
            if isinstance(v, list):
                v = ", ".join(str(x) for x in v)
            lines.append(f"  - {k.replace('_', ' ').title()}: {v}")
    
    # Personality/Triggers
    personality_fields = {
        "temperament": pet_soul.get("temperament") or pet_soul.get("general_nature"),
        "anxiety_triggers": pet_soul.get("anxiety_triggers"),
        "dislikes": pet_soul.get("dislikes"),
        "separation_anxiety": pet_soul.get("separation_anxiety"),
        "noise_sensitivity": pet_soul.get("noise_sensitivity")
    }
    personality_known = {k: v for k, v in personality_fields.items() if v and v != []}
    if personality_known:
        lines.append("🎭 **Personality/Triggers:**")
        for k, v in personality_known.items():
            if isinstance(v, list):
                v = ", ".join(str(x) for x in v)
            lines.append(f"  - {k.replace('_', ' ').title()}: {v}")
    
    # Preferences
    pref_fields = {
        "favorite_treats": pet_soul.get("favorite_treats"),
        "favorite_flavors": pet_soul.get("favorite_flavors"),
        "diet_type": pet_soul.get("diet_type"),
        "activity_level": pet_soul.get("activity_level") or pet_soul.get("energy_level")
    }
    pref_known = {k: v for k, v in pref_fields.items() if v and v != []}
    if pref_known:
        lines.append("❤️ **Preferences:**")
        for k, v in pref_known.items():
            if isinstance(v, list):
                v = ", ".join(str(x) for x in v)
            lines.append(f"  - {k.replace('_', ' ').title()}: {v}")
    
    # Enrichments from conversations
    enrichments = pet_soul.get("soul_enrichments", {})
    if enrichments:
        enrichment_items = []
        for k, v in enrichments.items():
            if isinstance(v, dict) and v.get("value"):
                enrichment_items.append(f"{k}: {v.get('value')}")
            elif isinstance(v, list) and v:
                enrichment_items.append(f"{k}: {', '.join(str(x) for x in v)}")
            elif v and not isinstance(v, dict):
                enrichment_items.append(f"{k}: {v}")
        
        if enrichment_items:
            lines.append("📝 **Learned from our chats:**")
            for item in enrichment_items[:5]:  # Limit to 5
                lines.append(f"  - {item}")
    
    if len(lines) > 1:
        lines.append("")
        lines.append("⚠️ **RULE**: If you already know something above, acknowledge it. Do NOT re-ask.")
        lines.append(f"Example: \"I know {pet_name} is allergic to [X], so I'll make sure to avoid that.\"")
    
    return "\n".join(lines)


# =============================================================================
# SECTION 6: INTENT-BASED RECALL PRIORITIES
# =============================================================================

INTENT_RECALL_PRIORITY = {
    "health": {
        "must_recall": ["allergies", "sensitivities", "medical_conditions", "food_allergies"],
        "may_save": ["health_facts"]
    },
    "food": {
        "must_recall": ["allergies", "food_allergies", "dislikes", "favorite_treats", "favorite_flavors", "diet_type"],
        "may_save": ["favorites", "dislikes"]
    },
    "dine": {
        "must_recall": ["allergies", "food_allergies", "dislikes", "favorite_treats", "diet_type"],
        "may_save": ["dining_locations", "favorites"]
    },
    "grooming": {
        "must_recall": ["grooming_preference", "handling_sensitivity", "anxiety_triggers", "dislikes"],
        "may_save": ["grooming_triggers", "dislikes"]
    },
    "travel": {
        "must_recall": ["travel_style", "crate_trained", "anxiety_triggers", "stay_preference", "hotel_experience"],
        "may_save": ["travel_destinations", "travel_sensitivity"]
    },
    "stay": {
        "must_recall": ["separation_anxiety", "behavior_with_dogs", "crate_trained", "anxiety_triggers"],
        "may_save": ["stay_preference"]
    },
    "care": {
        "must_recall": ["temperament", "separation_anxiety", "energy_level", "behavior_with_dogs", "behavior_with_humans"],
        "may_save": ["routines", "behavior_notes"]
    },
    "celebrate": {
        "must_recall": ["birthday", "gotcha_date", "favorites", "personality_tag", "persona"],
        "may_save": ["celebrations"]
    },
    "enjoy": {
        "must_recall": ["energy_level", "behavior_with_dogs", "anxiety_triggers", "favorites"],
        "may_save": ["event_preferences"]
    },
    "advisory": {
        "must_recall": ["temperament", "energy_level", "medical_conditions", "allergies"],
        "may_save": ["general_preferences"]
    }
}


def get_recall_priority_for_intent(intent: str) -> Dict:
    """Get the recall/save priorities for a specific intent"""
    return INTENT_RECALL_PRIORITY.get(intent, {
        "must_recall": ["name", "breed", "allergies", "temperament"],
        "may_save": []
    })
