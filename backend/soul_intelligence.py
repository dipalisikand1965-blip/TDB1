"""
Pet Soul Intelligence Engine
=============================
The core intelligence layer that powers the Pet Soul system.

This module handles:
1. Known fields detection (never re-ask what we know)
2. Soul enrichment from conversations
3. Behavioral inference from actions
4. Progressive soul building via WhatsApp drip
5. Intelligent commerce filtering

THE GOLDEN RULE: "The longer a pet lives with us, the less their parent has to explain."
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
import logging
import re
import json

logger = logging.getLogger(__name__)

# Database reference
_db = None

def set_soul_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# =============================================================================
# SECTION 1: KNOWN FIELDS DETECTION (NEVER RE-ASK)
# =============================================================================

# Map of all Pet Soul fields to their question equivalents
SOUL_FIELD_MAPPING = {
    # Identity & Temperament
    "name": {"display": "name", "questions": ["what's your dog's name", "pet's name"]},
    "breed": {"display": "breed", "questions": ["what breed", "dog's breed"]},
    "age": {"display": "age", "questions": ["how old", "age"]},
    "weight": {"display": "weight", "questions": ["how much does", "weight"]},
    "size": {"display": "size", "questions": ["what size", "small, medium, large"]},
    "gender": {"display": "gender", "questions": ["male or female", "boy or girl"]},
    "general_nature": {"display": "temperament", "questions": ["calm or energetic", "nature"]},
    "stranger_reaction": {"display": "stranger reaction", "questions": ["react to strangers", "new people"]},
    
    # Health & Allergies
    "allergies": {"display": "allergies", "questions": ["any allergies", "allergic to", "can't eat"]},
    "medical_conditions": {"display": "medical conditions", "questions": ["health issues", "conditions"]},
    "sensitive_stomach": {"display": "stomach sensitivity", "questions": ["sensitive stomach", "digestion"]},
    "dietary_restrictions": {"display": "dietary restrictions", "questions": ["diet restrictions", "can't have"]},
    
    # Personality
    "anxiety_triggers": {"display": "anxiety triggers", "questions": ["scared of", "afraid of", "anxious about"]},
    "behavior_with_dogs": {"display": "behavior with other dogs", "questions": ["other dogs", "dog-friendly"]},
    "behavior_with_humans": {"display": "behavior with people", "questions": ["with people", "strangers"]},
    "separation_anxiety": {"display": "separation anxiety", "questions": ["left alone", "separation"]},
    "loud_sounds": {"display": "sound sensitivity", "questions": ["loud noises", "thunder", "fireworks"]},
    
    # Preferences
    "favorite_treats": {"display": "favorite treats", "questions": ["favorite treat", "likes to eat"]},
    "dislikes": {"display": "dislikes", "questions": ["doesn't like", "hates", "avoids"]},
    "diet_type": {"display": "diet type", "questions": ["vegetarian", "non-veg", "diet"]},
    "food_brand": {"display": "food preference", "questions": ["what food", "which brand"]},
    
    # Travel & Comfort
    "travel_style": {"display": "travel preference", "questions": ["travel by", "car or flight"]},
    "crate_trained": {"display": "crate training", "questions": ["crate trained", "kennel"]},
    "car_rides": {"display": "car comfort", "questions": ["car rides", "motion sickness"]},
    "hotel_experience": {"display": "hotel experience", "questions": ["stayed at hotel", "boarding"]},
    
    # Training
    "training_level": {"display": "training level", "questions": ["trained", "commands"]},
    "leash_behavior": {"display": "leash behavior", "questions": ["pulls on leash", "walking"]},
}


def get_known_fields(pet_soul: Dict) -> Dict[str, Any]:
    """
    Extract all known fields from a Pet Soul profile.
    Returns a dict of field_name -> known_value
    """
    known = {}
    
    if not pet_soul:
        return known
    
    # Direct fields
    for field in ["name", "breed", "age", "weight", "size", "gender"]:
        val = pet_soul.get(field) or pet_soul.get("identity", {}).get(field)
        if val:
            known[field] = val
    
    # Health fields
    health = pet_soul.get("health", {})
    if health.get("allergies"):
        known["allergies"] = health["allergies"]
    if health.get("medical_conditions"):
        known["medical_conditions"] = health["medical_conditions"]
    if health.get("sensitive_stomach"):
        known["sensitive_stomach"] = health["sensitive_stomach"]
    
    # Preferences
    prefs = pet_soul.get("preferences", {})
    if prefs.get("favorite_treats"):
        known["favorite_treats"] = prefs["favorite_treats"]
    if prefs.get("dislikes"):
        known["dislikes"] = prefs["dislikes"]
    if prefs.get("diet_type"):
        known["diet_type"] = prefs["diet_type"]
    
    # Personality
    personality = pet_soul.get("personality", {})
    if personality.get("anxiety_triggers"):
        known["anxiety_triggers"] = personality["anxiety_triggers"]
    if personality.get("behavior_with_dogs"):
        known["behavior_with_dogs"] = personality["behavior_with_dogs"]
    
    # Travel
    travel = pet_soul.get("travel", {})
    if travel.get("preferred_mode"):
        known["travel_style"] = travel["preferred_mode"]
    if travel.get("crate_trained") is not None:
        known["crate_trained"] = travel["crate_trained"]
    
    # Soul answers (raw answers from soul questions)
    soul_answers = pet_soul.get("soul_answers", {}) or pet_soul.get("doggy_soul_answers", {})
    for key, val in soul_answers.items():
        if val and key not in known:
            known[key] = val
    
    # Soul enrichments (learned from conversations)
    enrichments = pet_soul.get("soul_enrichments", {})
    for key, val in enrichments.items():
        if val and key not in known:
            known[key] = val
    
    return known


def format_known_fields_for_prompt(pet_soul: Dict) -> str:
    """
    Format known fields into a section for Mira's system prompt.
    This tells Mira EXACTLY what she already knows and should NOT re-ask.
    """
    known = get_known_fields(pet_soul)
    pet_name = known.get("name", "this pet")
    
    if not known:
        return ""
    
    lines = [
        f"\n🧠 **WHAT I ALREADY KNOW ABOUT {pet_name.upper()}** (DO NOT RE-ASK):\n"
    ]
    
    # Group by category
    identity_fields = ["name", "breed", "age", "weight", "size", "gender"]
    health_fields = ["allergies", "medical_conditions", "sensitive_stomach", "dietary_restrictions"]
    personality_fields = ["anxiety_triggers", "behavior_with_dogs", "separation_anxiety", "general_nature", "stranger_reaction"]
    preference_fields = ["favorite_treats", "dislikes", "diet_type", "food_brand"]
    travel_fields = ["travel_style", "crate_trained", "car_rides", "hotel_experience"]
    training_fields = ["training_level", "leash_behavior"]
    
    def format_value(val):
        if isinstance(val, list):
            return ", ".join(str(v) for v in val) if val else "None specified"
        elif isinstance(val, bool):
            return "Yes" if val else "No"
        return str(val) if val else "Unknown"
    
    # Identity
    identity_known = {k: known[k] for k in identity_fields if k in known}
    if identity_known:
        lines.append("📋 **Identity:**")
        for k, v in identity_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    # Health
    health_known = {k: known[k] for k in health_fields if k in known}
    if health_known:
        lines.append("🏥 **Health:**")
        for k, v in health_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    # Personality
    personality_known = {k: known[k] for k in personality_fields if k in known}
    if personality_known:
        lines.append("🎭 **Personality:**")
        for k, v in personality_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    # Preferences
    pref_known = {k: known[k] for k in preference_fields if k in known}
    if pref_known:
        lines.append("❤️ **Preferences:**")
        for k, v in pref_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    # Travel
    travel_known = {k: known[k] for k in travel_fields if k in known}
    if travel_known:
        lines.append("✈️ **Travel:**")
        for k, v in travel_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    # Training
    training_known = {k: known[k] for k in training_fields if k in known}
    if training_known:
        lines.append("🎓 **Training:**")
        for k, v in training_known.items():
            display = SOUL_FIELD_MAPPING.get(k, {}).get("display", k)
            lines.append(f"  - {display.title()}: {format_value(v)}")
    
    lines.append("\n⚠️ **RULE**: If you need any of the above information, acknowledge you already know it.")
    lines.append("Example: \"I already know {name} is {breed} and weighs {weight}kg, so I'll proceed accordingly.\"")
    lines.append("DO NOT ask: \"What breed is your dog?\" or \"How much does {name} weigh?\"")
    
    return "\n".join(lines)


# =============================================================================
# SECTION 2: ENHANCED SOUL ENRICHMENT FROM CONVERSATIONS
# =============================================================================

# Patterns for extracting information from user messages
ENRICHMENT_PATTERNS = {
    "allergies": {
        "patterns": [
            r"allergic to (.+)",
            r"can't eat (.+)",
            r"has (?:a )?(.+) allergy",
            r"sensitive to (.+)",
            r"reacts badly to (.+)"
        ],
        "field": "allergies",
        "confidence": "high",
        "is_list": True
    },
    "favorite_treats": {
        "patterns": [
            r"loves? (.+?) (?:treats?|food|snacks?)",
            r"favorite (?:treat|food|snack) is (.+)",
            r"goes crazy for (.+)",
            r"(?:only|always) eats? (.+)"
        ],
        "field": "favorite_treats",
        "confidence": "high",
        "is_list": True
    },
    "anxiety_triggers": {
        "patterns": [
            r"scared of (.+)",
            r"afraid of (.+)",
            r"anxious (?:about|around|with) (.+)",
            r"nervous (?:about|around|with) (.+)",
            r"hates (.+)",
            r"freaks out (?:at|with|around) (.+)"
        ],
        "field": "anxiety_triggers",
        "confidence": "high",
        "is_list": True
    },
    "dislikes": {
        "patterns": [
            r"doesn't like (.+)",
            r"hates (.+)",
            r"won't eat (.+)",
            r"refuses (.+)",
            r"avoids (.+)"
        ],
        "field": "dislikes",
        "confidence": "high",
        "is_list": True
    },
    "crate_trained": {
        "patterns": [
            r"(?:is |)crate trained",
            r"comfortable in (?:a |)crate",
            r"sleeps in (?:a |)crate"
        ],
        "field": "crate_trained",
        "confidence": "high",
        "value": True,
        "is_list": False
    },
    "not_crate_trained": {
        "patterns": [
            r"not crate trained",
            r"doesn't like crates?",
            r"never been in (?:a |)crate"
        ],
        "field": "crate_trained",
        "confidence": "high",
        "value": False,
        "is_list": False
    },
    "separation_anxiety": {
        "patterns": [
            r"has separation anxiety",
            r"can't be left alone",
            r"anxious when (?:I |we )leave",
            r"hates being alone"
        ],
        "field": "separation_anxiety",
        "confidence": "high",
        "value": "moderate",
        "is_list": False
    },
    "travel_car": {
        "patterns": [
            r"loves? car rides?",
            r"comfortable in (?:the |)car",
            r"travels well by car"
        ],
        "field": "car_rides",
        "confidence": "high",
        "value": "Loves them",
        "is_list": False
    },
    "car_sickness": {
        "patterns": [
            r"gets car sick",
            r"motion sickness",
            r"vomits in (?:the |)car",
            r"doesn't do well in cars?"
        ],
        "field": "car_rides",
        "confidence": "high",
        "value": "Gets motion sickness",
        "is_list": False
    },
    "weight": {
        "patterns": [
            r"weighs? (\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?)",
            r"(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?) (?:heavy|now|currently)"
        ],
        "field": "weight",
        "confidence": "high",
        "is_list": False,
        "is_numeric": True
    },
    "age_years": {
        "patterns": [
            r"(\d+)\s*(?:years?|yrs?) old",
            r"age (?:is |)(\d+)",
            r"(\d+)\s*(?:years?|yrs?) (?:now|currently)"
        ],
        "field": "age",
        "confidence": "high",
        "is_list": False,
        "suffix": " years"
    },
    "age_months": {
        "patterns": [
            r"(\d+)\s*months? old",
            r"(\d+)\s*months? (?:now|currently)"
        ],
        "field": "age",
        "confidence": "high",
        "is_list": False,
        "suffix": " months"
    }
}


def extract_enrichments_advanced(user_message: str, ai_response: str = None) -> List[Dict]:
    """
    Advanced extraction of Pet Soul enrichments from conversation.
    Uses regex patterns to extract specific values.
    """
    enrichments = []
    message_lower = user_message.lower()
    
    for enrich_key, config in ENRICHMENT_PATTERNS.items():
        patterns = config.get("patterns", [])
        
        for pattern in patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                # Determine value
                if "value" in config:
                    # Fixed value (like True/False)
                    value = config["value"]
                elif match.groups():
                    # Extracted value from regex group
                    value = match.group(1).strip()
                    
                    # Add suffix if specified
                    if config.get("suffix"):
                        value = value + config["suffix"]
                    
                    # Convert to numeric if needed
                    if config.get("is_numeric"):
                        try:
                            value = float(value)
                        except (ValueError, TypeError):
                            pass
                else:
                    # Couldn't extract value
                    continue
                
                # Clean up list values
                if config.get("is_list") and isinstance(value, str):
                    # Split by common delimiters
                    value = [v.strip() for v in re.split(r',|and|&', value) if v.strip()]
                
                enrichment = {
                    "field": config["field"],
                    "value": value,
                    "confidence": config.get("confidence", "medium"),
                    "source": "conversation",
                    "raw_text": user_message,
                    "extracted_at": datetime.now(timezone.utc).isoformat()
                }
                enrichments.append(enrichment)
                break  # Only one match per category
    
    return enrichments


async def save_soul_enrichment(pet_id: str, enrichments: List[Dict], session_id: str = None):
    """
    Save enrichments to Pet Soul.
    Handles both single values and list appends.
    Saves to doggy_soul_answers for consistency.
    Also recalculates the overall_score after saving.
    """
    db = get_db()
    
    if not pet_id or not enrichments:
        return False
    
    for enrichment in enrichments:
        field = enrichment.get("field")
        value = enrichment.get("value")
        is_list = isinstance(value, list)
        
        # Record in enrichment history
        history_record = {
            "field": field,
            "value": value,
            "source": enrichment.get("source", "conversation"),
            "confidence": enrichment.get("confidence", "medium"),
            "learned_at": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "raw_text": enrichment.get("raw_text")
        }
        
        # Update both doggy_soul_answers (primary) and soul_enrichments (legacy)
        if is_list:
            # Append to existing list
            await db.pets.update_one(
                {"id": pet_id},
                {
                    "$addToSet": {
                        f"doggy_soul_answers.{field}": {"$each": value},
                        f"soul_enrichments.{field}": {"$each": value}
                    },
                    "$push": {"enrichment_history": history_record}
                }
            )
        else:
            # Set single value
            await db.pets.update_one(
                {"id": pet_id},
                {
                    "$set": {
                        f"doggy_soul_answers.{field}": value,
                        f"soul_enrichments.{field}": value
                    },
                    "$push": {"enrichment_history": history_record}
                }
            )
        
        logger.info(f"Soul enriched: {pet_id} | {field} = {value}")
    
    # Recalculate overall_score after saving answers
    try:
        from pet_score_logic import calculate_pet_soul_score
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1})
        if pet:
            answers = pet.get("doggy_soul_answers", {})
            score_data = calculate_pet_soul_score(answers)
            await db.pets.update_one(
                {"id": pet_id},
                {"$set": {
                    "overall_score": score_data["total_score"],
                    "score_tier": score_data["tier"]["key"] if score_data.get("tier") else "newcomer",
                    "score_updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            logger.info(f"Soul score recalculated for {pet_id}: {score_data['total_score']}%")
    except Exception as e:
        logger.error(f"Error recalculating soul score: {e}")
    
    return True


# =============================================================================
# SECTION 3: BEHAVIORAL INFERENCE ENGINE
# =============================================================================

async def infer_from_order(pet_id: str, order: Dict):
    """
    Infer Pet Soul data from order behavior.
    """
    inferences = []
    
    items = order.get("items", [])
    
    for item in items:
        product_name = (item.get("name") or "").lower()
        tags = item.get("tags", [])
        category = item.get("category", "").lower()
        
        # Grain-free preference
        if "grain-free" in product_name or "grain free" in tags:
            inferences.append({
                "field": "dietary_preferences",
                "value": "prefers grain-free",
                "confidence": "medium",
                "source": "purchase_behavior"
            })
        
        # Senior diet preference
        if "senior" in product_name or "senior" in tags:
            inferences.append({
                "field": "life_stage",
                "value": "senior",
                "confidence": "medium",
                "source": "purchase_behavior"
            })
        
        # Treat preferences
        if category in ["treats", "snacks"]:
            inferences.append({
                "field": "favorite_treats",
                "value": item.get("name"),
                "confidence": "medium",
                "source": "repeat_purchase"
            })
        
        # Celebration preference
        if category in ["cakes", "celebration"]:
            inferences.append({
                "field": "celebration_preferences",
                "value": "enjoys celebrations",
                "confidence": "medium",
                "source": "purchase_behavior"
            })
    
    # Save inferences
    if inferences and pet_id:
        await save_soul_enrichment(pet_id, inferences)
    
    return inferences


async def infer_from_repeat_purchase(pet_id: str, product_id: str):
    """
    When a product is purchased 3+ times, infer strong preference.
    """
    db = get_db()
    
    # Check purchase count
    count = await db.orders.count_documents({
        "pet_id": pet_id,
        "items.product_id": product_id,
        "status": {"$in": ["completed", "delivered"]}
    })
    
    if count >= 3:
        # Get product details
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            await save_soul_enrichment(pet_id, [{
                "field": "strong_preferences",
                "value": product.get("name"),
                "confidence": "high",
                "source": "repeat_purchase",
                "purchase_count": count
            }])


async def infer_from_return(pet_id: str, product_id: str, return_reason: str):
    """
    Infer dislikes from returns.
    """
    db = get_db()
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        return
    
    reason_lower = return_reason.lower()
    
    if "didn't like" in reason_lower or "refused" in reason_lower:
        await save_soul_enrichment(pet_id, [{
            "field": "dislikes",
            "value": product.get("name"),
            "confidence": "high",
            "source": "return_behavior",
            "reason": return_reason
        }])
    
    if "allergy" in reason_lower or "allergic" in reason_lower:
        # Try to extract the allergen
        ingredients = product.get("ingredients", [])
        await save_soul_enrichment(pet_id, [{
            "field": "possible_allergies",
            "value": ingredients if ingredients else product.get("name"),
            "confidence": "medium",
            "source": "return_behavior",
            "reason": return_reason
        }])


# =============================================================================
# SECTION 4: INTELLIGENT COMMERCE FILTERING
# =============================================================================

def build_exclusion_filters(pet_soul: Dict) -> Dict:
    """
    Build MongoDB query filters to EXCLUDE products based on Pet Soul.
    This ensures pets never see irrelevant products.
    """
    known = get_known_fields(pet_soul)
    exclude_conditions = []
    
    # 1. Allergies - Exclude products with known allergens
    allergies = known.get("allergies", [])
    if allergies:
        for allergen in allergies:
            allergen_lower = allergen.lower()
            exclude_conditions.append({
                "$nor": [
                    {"name": {"$regex": allergen_lower, "$options": "i"}},
                    {"ingredients": {"$regex": allergen_lower, "$options": "i"}},
                    {"tags": allergen_lower}
                ]
            })
    
    # 2. Age-based filtering
    age_str = known.get("age", "")
    if age_str:
        # Parse age
        if "month" in str(age_str).lower():
            months = int(re.search(r"(\d+)", str(age_str)).group(1)) if re.search(r"(\d+)", str(age_str)) else 0
            if months < 12:
                # Puppy - exclude senior products
                exclude_conditions.append({
                    "tags": {"$nin": ["senior", "adult-only"]}
                })
        elif "year" in str(age_str).lower():
            years = int(re.search(r"(\d+)", str(age_str)).group(1)) if re.search(r"(\d+)", str(age_str)) else 0
            if years >= 7:
                # Senior - exclude puppy products
                exclude_conditions.append({
                    "tags": {"$nin": ["puppy", "puppy-only"]}
                })
            elif years < 2:
                # Young - exclude senior products
                exclude_conditions.append({
                    "tags": {"$nin": ["senior", "senior-only"]}
                })
    
    # 3. Size-based filtering
    size = known.get("size", "").lower()
    if size:
        if size in ["xs", "small"]:
            exclude_conditions.append({
                "tags": {"$nin": ["large-breed-only", "giant-breed"]}
            })
        elif size in ["xl", "giant", "large"]:
            exclude_conditions.append({
                "tags": {"$nin": ["small-breed-only", "toy-breed"]}
            })
    
    # 4. Diet type filtering
    diet_type = known.get("diet_type", "").lower()
    if diet_type:
        if diet_type == "vegetarian":
            exclude_conditions.append({
                "tags": {"$nin": ["non-veg", "meat-based", "chicken", "beef", "lamb"]}
            })
    
    # 5. Sensitive stomach filtering
    if known.get("sensitive_stomach") in [True, "Yes", "yes"]:
        exclude_conditions.append({
            "tags": {"$in": ["gentle", "sensitive-stomach", "easy-digest"]}
        })
    
    # 6. Known dislikes
    dislikes = known.get("dislikes", [])
    if dislikes:
        for dislike in dislikes:
            exclude_conditions.append({
                "name": {"$not": {"$regex": dislike, "$options": "i"}}
            })
    
    # Combine all conditions
    if exclude_conditions:
        return {"$and": exclude_conditions}
    
    return {}


def get_positive_filters(pet_soul: Dict) -> Dict:
    """
    Build MongoDB query filters to PRIORITIZE products based on Pet Soul.
    Used for ranking, not exclusion.
    """
    known = get_known_fields(pet_soul)
    boost_conditions = []
    
    # Favorite treats
    favorites = known.get("favorite_treats", [])
    if favorites:
        for fav in favorites:
            boost_conditions.append({
                "name": {"$regex": fav, "$options": "i"}
            })
    
    # Strong preferences (from repeat purchases)
    strong_prefs = known.get("strong_preferences", [])
    if strong_prefs:
        boost_conditions.append({
            "name": {"$in": strong_prefs}
        })
    
    return boost_conditions


# =============================================================================
# SECTION 5: WEEKLY WHATSAPP SOUL DRIP
# =============================================================================

# Questions for the weekly drip, organized by priority and pillar
WEEKLY_DRIP_QUESTIONS = [
    # High priority - essential for service
    {
        "id": "drip_allergies",
        "pillar": "taste_treat",
        "field": "allergies",
        "question": "Does {pet_name} have any food allergies I should know about?",
        "options": ["No allergies", "Yes, please tell me"],
        "priority": 1,
        "follow_up": True
    },
    {
        "id": "drip_anxiety",
        "pillar": "rhythm_routine",
        "field": "separation_anxiety",
        "question": "Does {pet_name} get anxious when left alone for more than 2-3 hours?",
        "options": ["No, they're fine", "Sometimes anxious", "Yes, quite anxious"],
        "priority": 1
    },
    {
        "id": "drip_stranger",
        "pillar": "identity_temperament",
        "field": "stranger_reaction",
        "question": "How does {pet_name} usually react when meeting new people?",
        "options": ["Very friendly", "A bit cautious", "Quite nervous", "Protective"],
        "priority": 2
    },
    {
        "id": "drip_dogs",
        "pillar": "family_pack",
        "field": "behavior_with_dogs",
        "question": "How does {pet_name} behave around other dogs?",
        "options": ["Loves all dogs", "Selective with friends", "Gets nervous", "Can be reactive"],
        "priority": 2
    },
    {
        "id": "drip_crate",
        "pillar": "travel_style",
        "field": "crate_trained",
        "question": "Is {pet_name} comfortable being in a crate or carrier?",
        "options": ["Yes, very comfortable", "Getting used to it", "Not at all"],
        "priority": 2
    },
    {
        "id": "drip_car",
        "pillar": "travel_style",
        "field": "car_rides",
        "question": "How does {pet_name} handle car rides?",
        "options": ["Loves them!", "Does okay", "Gets anxious", "Gets car sick"],
        "priority": 2
    },
    {
        "id": "drip_sounds",
        "pillar": "identity_temperament",
        "field": "loud_sounds",
        "question": "How does {pet_name} react to loud sounds like thunder or fireworks?",
        "options": ["Completely fine", "A bit anxious", "Very anxious", "Needs comfort"],
        "priority": 3
    },
    {
        "id": "drip_favorite_treat",
        "pillar": "taste_treat",
        "field": "favorite_treats",
        "question": "What's {pet_name}'s absolute favorite treat? Something they go crazy for!",
        "options": None,  # Free text
        "priority": 3
    },
    {
        "id": "drip_handling",
        "pillar": "identity_temperament",
        "field": "handling_comfort",
        "question": "Is {pet_name} comfortable being handled - like having their paws, ears, or mouth touched?",
        "options": ["Very comfortable", "Sometimes uncomfortable", "Quite sensitive"],
        "priority": 3
    },
    {
        "id": "drip_alone",
        "pillar": "rhythm_routine",
        "field": "alone_comfort",
        "question": "Is {pet_name} used to being left alone during the day?",
        "options": ["Yes, comfortable", "For short periods", "Not at all"],
        "priority": 3
    }
]


async def get_next_drip_question(pet_id: str) -> Optional[Dict]:
    """
    Get the next appropriate question for the weekly drip.
    Considers what we already know and what's most important to learn.
    """
    db = get_db()
    
    # Get pet with soul data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        return None
    
    pet_name = pet.get("name", "your pet")
    known_fields = get_known_fields(pet)
    
    # Get drip history
    drip_history = await db.soul_drip_history.find(
        {"pet_id": pet_id}
    ).to_list(100)
    
    # Find next question
    for q in sorted(WEEKLY_DRIP_QUESTIONS, key=lambda x: x.get("priority", 99)):
        field = q.get("field")
        
        # Skip if already known
        if field in known_fields:
            continue
        
        # Skip if recently asked (within last month)
        recent = any(
            d.get("field") == field and 
            datetime.fromisoformat(d.get("asked_at", "2000-01-01").replace("Z", "+00:00")) > 
            datetime.now(timezone.utc) - timedelta(days=30)
            for d in drip_history
        )
        if recent:
            continue
        
        # Found a question to ask
        return {
            "question_id": q["id"],
            "field": field,
            "pillar": q["pillar"],
            "question": q["question"].format(pet_name=pet_name),
            "options": q.get("options"),
            "has_follow_up": q.get("follow_up", False)
        }
    
    return None  # Soul is complete!


async def record_drip_response(pet_id: str, field: str, response: str, question_id: str):
    """
    Record a response from the weekly drip and update Pet Soul.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Record in drip history
    await db.soul_drip_history.insert_one({
        "pet_id": pet_id,
        "question_id": question_id,
        "field": field,
        "response": response,
        "asked_at": now,
        "answered_at": now
    })
    
    # Update Pet Soul
    await save_soul_enrichment(pet_id, [{
        "field": field,
        "value": response,
        "confidence": "high",
        "source": "weekly_drip"
    }])
    
    logger.info(f"Drip response recorded: {pet_id} | {field} = {response}")


# =============================================================================
# SECTION 6: SOUL COMPLETENESS ANALYSIS
# =============================================================================

def calculate_soul_completeness(pet_soul: Dict) -> Dict:
    """
    Calculate how complete the Pet Soul is and what's missing.
    Used for gamification and priority drip questions.
    """
    known = get_known_fields(pet_soul)
    
    # Essential fields (required for basic service)
    essential_fields = ["name", "breed", "allergies", "separation_anxiety"]
    essential_known = sum(1 for f in essential_fields if f in known)
    
    # Important fields (improve service quality)
    important_fields = [
        "age", "weight", "size", "gender",
        "anxiety_triggers", "behavior_with_dogs",
        "favorite_treats", "crate_trained", "car_rides"
    ]
    important_known = sum(1 for f in important_fields if f in known)
    
    # Nice-to-have fields (personalization)
    nice_fields = [
        "general_nature", "stranger_reaction", "loud_sounds",
        "dislikes", "diet_type", "training_level",
        "hotel_experience", "travel_style"
    ]
    nice_known = sum(1 for f in nice_fields if f in known)
    
    # Calculate scores
    essential_score = (essential_known / len(essential_fields)) * 100
    important_score = (important_known / len(important_fields)) * 100
    nice_score = (nice_known / len(nice_fields)) * 100
    
    # Weighted overall score
    overall = (essential_score * 0.5) + (important_score * 0.35) + (nice_score * 0.15)
    
    # Missing fields by priority
    missing_essential = [f for f in essential_fields if f not in known]
    missing_important = [f for f in important_fields if f not in known]
    missing_nice = [f for f in nice_fields if f not in known]
    
    return {
        "overall_score": round(overall, 1),
        "essential_score": round(essential_score, 1),
        "important_score": round(important_score, 1),
        "nice_score": round(nice_score, 1),
        "fields_known": len(known),
        "fields_total": len(essential_fields) + len(important_fields) + len(nice_fields),
        "missing_essential": missing_essential,
        "missing_important": missing_important,
        "missing_nice": missing_nice,
        "next_priority": missing_essential[0] if missing_essential else (
            missing_important[0] if missing_important else (
                missing_nice[0] if missing_nice else None
            )
        )
    }
