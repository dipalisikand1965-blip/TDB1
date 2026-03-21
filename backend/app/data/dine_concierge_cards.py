# /app/backend/app/data/dine_concierge_cards.py
"""
Dine Concierge Card Library - 10 cards total
5 Concierge Products (bespoke deliverables) + 5 Concierge Services (arrangements)

All cards create tickets. Questions are asked inside the ticket thread.
Card selection uses persona-based scoring (same as Celebrate).
"""

from typing import Dict, List, Any, Optional

# =============================================================================
# DINE CONCIERGE PRODUCTS (5)
# =============================================================================

DINE_CONCIERGE_PRODUCTS = [
    {
        "id": "dine_weekly_meal_plan",
        "type": "concierge_product",
        "name": "Weekly Meal Plan for {pet_name}",
        "icon": "utensils",
        "description": "A 7-day feeding plan built around {pet_name}'s tummy, energy, and routine.",
        "why_concierge": "This is personalised planning, not a catalogue item.",
        "cta_text": "Create plan",
        # Card-specific why phrases based on traits
        "why_phrases": {
            "sensitive_tummy": "Gentle meals safe for sensitive tummies",
            "picky": "Rotates flavors to keep picky eaters engaged",
            "foodie": "Variety-packed plan for food lovers",
            "senior": "Nutrient-balanced meals for senior wellness",
            "weight_management": "Portioned plan for healthy weight goals",
            "anxious": "Predictable meals for routine-loving pets",
            "default": "Customized 7-day feeding plan"
        },
        "default_questions": [
            {
                "id": "goal",
                "question": "What's the main goal right now?",
                "type": "choice",
                "options": ["Weight management", "Tummy comfort", "More energy", "Picky eating", "General health"]
            },
            {
                "id": "current_diet",
                "question": "What is {pet_name} currently eating most days?",
                "type": "choice",
                "options": ["Kibble", "Fresh meals", "Home-cooked", "Mixed (kibble + fresh)", "Not sure"]
            },
            {
                "id": "food_rules",
                "question": "Any food rules or allergies I should filter for?",
                "type": "text"
            },
            {
                "id": "schedule",
                "question": "How many meals per day, and roughly what times?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "foodie": 0.9,
            "weight_management": 0.95,
            "senior": 0.8,
            "sensitive_tummy": 0.85,
            "picky": 0.9,
            "health_conscious": 0.8,
            "anxious": 0.5,
            "playful": 0.6,
            "elegant": 0.6
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_food_switch_assistant",
        "type": "concierge_product",
        "name": "Food Switch Assistant Plan",
        "icon": "refresh-cw",
        "description": "A gentle 7-10 day transition plan with what to watch for, tailored to {pet_name}.",
        "why_concierge": "Switches can trigger tummy/skin reactions; we tailor it safely.",
        "cta_text": "Start transition",
        "why_phrases": {
            "sensitive_tummy": "Gentle transition for sensitive tummies",
            "itchy": "Careful switch to avoid skin flare-ups",
            "picky": "Gradual intro to keep picky eaters comfortable",
            "anxious": "Slow pace to avoid stress-related tummy issues",
            "default": "Safe, guided food transition"
        },
        "default_questions": [
            {
                "id": "switch_from_to",
                "question": "What are you switching from, and what are you switching to?",
                "type": "text"
            },
            {
                "id": "why_switch",
                "question": "What's prompting the switch?",
                "type": "choice",
                "options": ["Itch/skin", "Loose stools", "Bored of food", "Vet advice", "Availability/price", "Other"]
            },
            {
                "id": "sensitivity",
                "question": "Does {pet_name} usually have a sensitive tummy?",
                "type": "choice",
                "options": ["Yes", "Sometimes", "No", "Not sure"]
            },
            {
                "id": "pace",
                "question": "Do you want a gentle pace or standard pace?",
                "type": "choice",
                "options": ["Gentle (10 days)", "Standard (7 days)"]
            }
        ],
        "persona_affinity": {
            "sensitive_tummy": 0.95,
            "itchy": 0.85,
            "picky": 0.8,
            "anxious": 0.6,
            "foodie": 0.7,
            "senior": 0.75,
            "health_conscious": 0.7
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_allergy_safe_blueprint",
        "type": "concierge_product",
        "name": "Allergy-Safe Diet Blueprint",
        "icon": "shield",
        "description": "A safe shortlist + elimination-style plan to identify what suits {pet_name}.",
        "why_concierge": "Requires careful filtering and a structured plan - not generic advice.",
        "cta_text": "Create blueprint",
        "why_phrases": {
            "sensitive_tummy": "Filters ingredients based on food rules",
            "itchy": "Eliminates common skin irritants",
            "allergy_prone": "Safe-food shortlist for allergies",
            "anxious": "Structured plan to reduce stress",
            "default": "Elimination-style safe diet plan"
        },
        "default_questions": [
            {
                "id": "symptoms",
                "question": "What reaction are you seeing most?",
                "type": "choice",
                "options": ["Itching/skin", "Ear issues", "Loose stools", "Vomiting", "Low appetite", "Other"]
            },
            {
                "id": "suspects",
                "question": "Any suspected ingredients (chicken, dairy, grain, etc.)?",
                "type": "text"
            },
            {
                "id": "known_diagnosis",
                "question": "Has a vet confirmed any allergy or put {pet_name} on a specific diet?",
                "type": "choice",
                "options": ["Yes", "No", "Not sure"]
            },
            {
                "id": "protein_pref",
                "question": "Any proteins you prefer or want to avoid?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "sensitive_tummy": 0.95,
            "itchy": 0.95,
            "allergy_prone": 1.0,
            "anxious": 0.5,
            "senior": 0.7,
            "health_conscious": 0.8
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_fresh_subscription_setup",
        "type": "concierge_product",
        "name": "Fresh Meal Subscription Setup for {pet_name}",
        "icon": "package",
        "description": "We set up recurring fresh meals aligned to {pet_name}'s feeding times and needs.",
        "why_concierge": "This needs coordination, portion logic, and schedule alignment.",
        "cta_text": "Set up delivery",
        "why_phrases": {
            "foodie": "Fresh variety keeps food lovers excited",
            "picky": "Curated options for selective eaters",
            "sensitive_tummy": "Gentle recipes delivered regularly",
            "senior": "Senior-friendly portions and timing",
            "default": "Recurring fresh meals, coordinated"
        },
        "default_questions": [
            {
                "id": "cadence",
                "question": "How often should deliveries arrive?",
                "type": "choice",
                "options": ["Weekly", "Every 2 weeks", "Monthly (bulk)", "Not sure - recommend"]
            },
            {
                "id": "meals_per_day",
                "question": "How many meals per day do you want to serve?",
                "type": "choice",
                "options": ["1", "2", "3", "Not sure"]
            },
            {
                "id": "storage",
                "question": "Do you have freezer space for meal packs?",
                "type": "choice",
                "options": ["Yes", "Limited", "No"]
            },
            {
                "id": "food_rules",
                "question": "Any allergies or ingredients to avoid?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "foodie": 0.95,
            "health_conscious": 0.9,
            "busy_household": 0.85,
            "senior": 0.7,
            "sensitive_tummy": 0.75,
            "pampered": 0.8,
            "elegant": 0.75
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_dining_out_kit",
        "type": "concierge_product",
        "name": "Dining-Out Kit Curated for {pet_name}",
        "icon": "briefcase",
        "description": "A tailored kit + checklist so dining out with {pet_name} is calm and easy.",
        "why_concierge": "We match kit choices to size, temperament, and outing style.",
        "cta_text": "Curate kit",
        "why_phrases": {
            "anxious": "Calming essentials for nervous outings",
            "social": "Perfect gear for social butterflies",
            "playful": "Fun kit for energetic dining companions",
            "new_pet_parent": "Starter kit for first-time diners",
            "default": "Everything you need for dining out"
        },
        "default_questions": [
            {
                "id": "public_comfort",
                "question": "How is {pet_name} in public places?",
                "type": "choice",
                "options": ["Very calm", "Mostly okay", "Gets anxious", "Gets overexcited", "Not sure"]
            },
            {
                "id": "size",
                "question": "What size is {pet_name}?",
                "type": "choice",
                "options": ["Small", "Medium", "Large"]
            },
            {
                "id": "chewer",
                "question": "Is {pet_name} a heavy chewer?",
                "type": "choice",
                "options": ["Yes", "Sometimes", "No"]
            },
            {
                "id": "food_rules",
                "question": "Any food rules/allergies for treats we include?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "social": 0.9,
            "anxious": 0.85,
            "active": 0.8,
            "new_pet_parent": 0.9,
            "playful": 0.75,
            "elegant": 0.7,
            "calm": 0.6
        },
        "allergy_safe": True,
    },
]

# =============================================================================
# DINE CONCIERGE SERVICES (5)
# =============================================================================

DINE_CONCIERGE_SERVICES = [
    {
        "id": "dine_reserve_pet_friendly_table",
        "type": "concierge_service",
        "name": "Reserve a Pet-Friendly Table",
        "icon": "map-pin",
        "description": "We reserve the right table and brief the venue so {pet_name} is comfortable.",
        "why_concierge": "Requires coordination, table placement, and staff briefing.",
        "cta_text": "Request reservation",
        "why_phrases": {
            "anxious": "Quiet corner + staff briefed for nervous pets",
            "elegant": "Premium table with VIP treatment",
            "social": "Lively spot great for social pets",
            "senior": "Accessible seating for senior comfort",
            "default": "Table + venue briefed for pets"
        },
        "default_questions": [
            {
                "id": "city_area",
                "question": "Which city/area should we book in?",
                "type": "text"
            },
            {
                "id": "date_time",
                "question": "What date and time?",
                "type": "text"
            },
            {
                "id": "party_size",
                "question": "How many humans and how many pets?",
                "type": "text"
            },
            {
                "id": "vibe",
                "question": "Do you want a quiet corner or a lively table?",
                "type": "choice",
                "options": ["Quiet corner", "Lively", "Either"]
            }
        ],
        "persona_affinity": {
            # Broad fit - different reasons for different personas
            "elegant": 0.9,
            "anxious": 0.9,  # Quiet corner + staff briefing
            "small": 0.85,   # Space + placement
            "social": 0.85,
            "calm": 0.8,
            "pampered": 0.85,
            "playful": 0.7,
            "senior": 0.8
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_pet_buddy_meetup_coordination",
        "type": "concierge_service",
        "name": "Pet Buddy Meetup Coordination",
        "icon": "users",
        "description": "We help coordinate a safe, well-matched meetup around your outing plan.",
        "why_concierge": "Matching temperament + timing + rules needs human judgement.",
        "cta_text": "Request meetup",
        "why_phrases": {
            "social": "Perfect match for social butterflies",
            "playful": "Fun playdate with energy-matched buddies",
            "anxious": "Calm, low-key intro for nervous pets",
            "default": "Safe, well-matched pet meetup"
        },
        "default_questions": [
            {
                "id": "venue_time",
                "question": "Where and when is the meetup?",
                "type": "text"
            },
            {
                "id": "temperament",
                "question": "How is {pet_name} with other dogs?",
                "type": "choice",
                "options": ["Very social", "Selective", "Not comfortable", "Not sure"]
            },
            {
                "id": "match_pref",
                "question": "Preferred match?",
                "type": "choice",
                "options": ["Similar size", "Similar energy", "Either"]
            },
            {
                "id": "no_nos",
                "question": "Any no-nos we should avoid (puppies, intact males, etc.)?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "social": 0.95,
            "playful": 0.9,
            "young": 0.85,
            "active": 0.85,
            "energetic": 0.8,
            "anxious": 0.3,  # Low - don't show unless explicitly social
            "elegant": 0.4
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_private_chef_experience",
        "type": "concierge_service",
        "name": "Private Chef Experience (Human + Pet)",
        "icon": "chef-hat",
        "description": "A curated chef experience with pet-safe courses and human pairing.",
        "why_concierge": "Menu design + chef coordination + venue constraints require concierge execution.",
        "cta_text": "Book experience",
        "why_phrases": {
            "pampered": "Luxe dining for pampered palates",
            "foodie": "Gourmet experience for food lovers",
            "elegant": "Refined menu for sophisticated taste",
            "sensitive_tummy": "Chef-crafted meals for sensitive tummies",
            "default": "Private dining for you and your pet"
        },
        "default_questions": [
            {
                "id": "location",
                "question": "At home or at a private venue? Which city/area?",
                "type": "text"
            },
            {
                "id": "counts",
                "question": "How many humans and pets?",
                "type": "text"
            },
            {
                "id": "diet_rules",
                "question": "Any dietary rules for humans and for {pet_name}?",
                "type": "text"
            },
            {
                "id": "occasion_budget",
                "question": "Is this for an occasion, and what budget range should we work within?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "elegant": 0.95,
            "pampered": 0.95,
            "celebration": 0.9,
            "premium": 0.95,
            "foodie": 0.8,
            "social": 0.6,
            "anxious": 0.4
        },
        "allergy_safe": True,
    },

    {
        "id": "dine_wont_eat_rapid_fix",
        "type": "concierge_service",
        "name": "My Dog Won't Eat (Rapid Fix)",
        "icon": "alert-circle",
        "description": "Quick triage + a practical plan. If there are red flags, we escalate immediately.",
        "why_concierge": "Needs triage logic and safe escalation pathways.",
        "cta_text": "Get help now",
        "why_phrases": {
            "picky": "Solutions for stubborn eaters",
            "anxious": "Stress-related appetite fix",
            "senior": "Senior appetite support",
            "sensitive_tummy": "Tummy-friendly reintroduction plan",
            "default": "Quick triage + practical plan"
        },
        "default_questions": [
            {
                "id": "since_when",
                "question": "Since when has {pet_name} not been eating normally?",
                "type": "text"
            },
            {
                "id": "red_flags",
                "question": "Any vomiting, diarrhoea, lethargy, blood, or signs of pain?",
                "type": "choice",
                "options": ["Yes", "No", "Not sure"]
            },
            {
                "id": "drinking",
                "question": "Is {pet_name} drinking water?",
                "type": "choice",
                "options": ["Yes", "No", "Not sure"]
            },
            {
                "id": "last_food_change",
                "question": "Any recent change in food, treats, routine, travel, or stress?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "picky": 0.95,
            "anxious": 0.9,
            "senior": 0.85,
            "sensitive_tummy": 0.85,
            "health_concerns": 0.9
        },
        "allergy_safe": True,
        "escalation_config": {
            "trigger_field": "red_flags",
            "trigger_values": ["Yes"],
            "also_trigger_if": {"drinking": "No"},
            "escalate_to": "emergency",
            "escalation_message": "This may be urgent - Mira is escalating to ensure {pet_name} gets help quickly."
        }
    },

    {
        "id": "dine_nutrition_consult_booking",
        "type": "concierge_service",
        "name": "Nutrition Consult Booking (Expert)",
        "icon": "stethoscope",
        "description": "We book a nutrition consult and prep the right summary so you get clear outcomes.",
        "why_concierge": "Booking + prep + follow-up plan needs coordination.",
        "cta_text": "Book consult",
        "why_phrases": {
            "health_conscious": "Expert-led health optimization",
            "allergy_prone": "Allergy-focused consultation",
            "senior": "Senior nutrition guidance",
            "sensitive_tummy": "Gut health specialist consult",
            "weight_management": "Weight management program",
            "default": "Expert nutrition consultation"
        },
        "default_questions": [
            {
                "id": "goal",
                "question": "What do you want to solve or improve?",
                "type": "choice",
                "options": ["Weight", "Allergies/itch", "Tummy issues", "Picky eating", "Senior care", "General health"]
            },
            {
                "id": "current_diet",
                "question": "What is {pet_name} currently eating (meals + treats)?",
                "type": "text"
            },
            {
                "id": "history",
                "question": "Any medical history or known allergies we should share with the expert?",
                "type": "text"
            },
            {
                "id": "time_window",
                "question": "Preferred time window for the consult?",
                "type": "text"
            }
        ],
        "persona_affinity": {
            "health_conscious": 0.9,
            "allergy_prone": 0.85,
            "senior": 0.85,
            "sensitive_tummy": 0.8,
            "weight_management": 0.8,
            "picky": 0.75,
            "anxious": 0.6
        },
        "allergy_safe": True,
    },
]

# =============================================================================
# DINE MICRO-QUESTIONS (for thin profiles)
# =============================================================================

DINE_MICRO_QUESTIONS = [
    {
        "id": "dine_eating_speed",
        "question": "Is {pet_name} a fast eater or slow grazer?",
        "options": ["Fast eater", "Slow grazer", "Depends on the food"],
        "maps_to_trait": "eating_style",
        "priority": 1
    },
    {
        "id": "dine_tummy_sensitivity",
        "question": "Does {pet_name} have a sensitive tummy or iron stomach?",
        "options": ["Sensitive tummy", "Iron stomach", "Somewhere in between"],
        "maps_to_trait": "tummy_type",
        "priority": 2
    },
    {
        "id": "dine_cafe_comfort",
        "question": "Is {pet_name} calm in cafes or easily overwhelmed?",
        "options": ["Very calm", "Gets overwhelmed", "Haven't tried yet"],
        "maps_to_trait": "public_comfort",
        "priority": 3
    },
    {
        "id": "dine_food_motivation",
        "question": "How food-motivated is {pet_name}?",
        "options": ["Lives for food", "Normal appetite", "Picky eater"],
        "maps_to_trait": "food_motivation",
        "priority": 4
    }
]

# =============================================================================
# SCORING AND SELECTION LOGIC (mirrors Celebrate)
# =============================================================================

def score_card_for_pet(
    card: Dict,
    soul_traits: List[str],
    breed: str,
    size: str,
    age_band: str,
    event_context: Optional[Dict] = None
) -> int:
    """
    Score a card's relevance for a specific pet.
    Returns 0-100.
    """
    base_score = 50
    affinity = card.get("persona_affinity", {})
    
    # Trait matching (primary scoring)
    trait_bonus = 0
    for trait in soul_traits:
        trait_lower = trait.lower().replace(" ", "_")
        if trait_lower in affinity:
            trait_bonus += int(affinity[trait_lower] * 30)
    
    # Cap trait bonus
    trait_bonus = min(trait_bonus, 40)
    
    # Size matching
    size_bonus = 0
    size_lower = (size or "").lower()
    if size_lower == "small" and "small" in affinity:
        size_bonus = int(affinity["small"] * 10)
    elif size_lower == "large" and "large" in affinity:
        size_bonus = int(affinity.get("large", 0.5) * 10)
    
    # Senior bonus
    senior_bonus = 0
    if age_band and ("senior" in age_band.lower() or "old" in age_band.lower()):
        if "senior" in affinity:
            senior_bonus = int(affinity["senior"] * 15)
    
    # Context bonus (if eating issues exist)
    context_bonus = 0
    if event_context:
        if event_context.get("has_eating_issues"):
            if card["id"] == "dine_wont_eat_rapid_fix":
                context_bonus = 30
        if event_context.get("has_allergies"):
            if card["id"] == "dine_allergy_safe_blueprint":
                context_bonus = 25
    
    total = base_score + trait_bonus + size_bonus + senior_bonus + context_bonus
    return min(100, max(0, total))


def get_breed_default_traits(breed: str, size: str) -> List[str]:
    """
    Get default traits based on breed when soul traits are thin.
    """
    breed_lower = (breed or "").lower()
    
    # Food-motivated breeds
    foodie_breeds = ["labrador", "golden retriever", "beagle", "pug", "basset"]
    if any(b in breed_lower for b in foodie_breeds):
        return ["foodie", "energetic", "social"]
    
    # Sensitive tummy breeds
    sensitive_breeds = ["french bulldog", "frenchie", "bulldog", "boxer", "german shepherd"]
    if any(b in breed_lower for b in sensitive_breeds):
        return ["sensitive_tummy", "health_conscious"]
    
    # Small elegant breeds
    elegant_breeds = ["shih tzu", "maltese", "pomeranian", "yorkie", "cavalier", "bichon"]
    if any(b in breed_lower for b in elegant_breeds):
        return ["elegant", "pampered", "small"]
    
    # Anxious-prone breeds
    anxious_breeds = ["chihuahua", "greyhound", "whippet", "italian greyhound"]
    if any(b in breed_lower for b in anxious_breeds):
        return ["anxious", "warms_up_slowly", "calm"]
    
    # Size-based defaults
    if size == "small":
        return ["pampered", "calm", "small"]
    elif size == "large":
        return ["social", "playful", "foodie"]
    
    return ["friendly", "social"]


def derive_traits_from_profile(pet_data: Dict[str, Any]) -> List[str]:
    """
    Derive personality traits from multiple sources in pet profile.
    Checks: soul_traits > doggy_soul_answers > personality > temperament
    """
    derived = []
    
    # 1. Direct soul_traits (highest priority)
    if pet_data.get("soul_traits"):
        derived.extend(pet_data["soul_traits"])
    
    # 2. Check doggy_soul_answers
    doggy_soul = pet_data.get("doggy_soul_answers") or {} or {}
    
    # Food motivation
    food_motivation = doggy_soul.get("food_motivation", "").lower()
    if food_motivation in ["high", "very", "extreme", "lives for food"]:
        derived.append("foodie")
    elif food_motivation in ["low", "picky"]:
        derived.append("picky")
    
    # Tummy sensitivity
    tummy = doggy_soul.get("tummy_sensitivity", "").lower()
    if tummy in ["sensitive", "very sensitive"]:
        derived.append("sensitive_tummy")
    
    # Travel anxiety (indicates general anxiety)
    travel_anxiety = doggy_soul.get("travel_anxiety", "").lower()
    if travel_anxiety in ["high", "severe", "moderate", "mild"]:
        derived.append("anxious")
    
    # 3. Check personality object (common in older pet records)
    personality = pet_data.get("personality", {}) or {}
    if isinstance(personality, dict):
        # Check temperament inside personality
        temperament = personality.get("temperament", "").lower()
        if temperament:
            if "friendly" in temperament or "playful" in temperament:
                derived.append("playful")
                derived.append("social")
            elif "calm" in temperament or "gentle" in temperament:
                derived.append("calm")
        
        # Check anxiety indicators
        anxiety = personality.get("separation_anxiety", "").lower()
        noise = personality.get("noise_sensitivity", "").lower()
        if "high" in anxiety or "severe" in anxiety or "moderate" in anxiety:
            derived.append("anxious")
        if "nervous" in noise:
            derived.append("anxious")
        
        # Check behavior with dogs
        dog_behavior = personality.get("behavior_with_dogs", "").lower()
        if "playful" in dog_behavior or "friendly" in dog_behavior:
            derived.append("social")
            derived.append("playful")
        
        # Check anxiety triggers
        if personality.get("anxiety_triggers"):
            derived.append("anxious")
    
    # 4. Direct temperament field
    temperament_direct = pet_data.get("temperament", "").lower() if pet_data.get("temperament") else ""
    if temperament_direct:
        if any(t in temperament_direct for t in ["anxious", "nervous", "shy"]):
            derived.append("anxious")
        elif any(t in temperament_direct for t in ["playful", "energetic", "active"]):
            derived.append("playful")
            derived.append("social")
        elif any(t in temperament_direct for t in ["calm", "gentle", "relaxed"]):
            derived.append("calm")
    
    # 5. Check soul data
    soul = pet_data.get("soul", {}) or {}
    if soul.get("love_language", "").lower() in ["velcro", "clingy"]:
        derived.append("pampered")
    
    # 6. Age check for senior classification
    age = pet_data.get("age")
    if age and isinstance(age, (int, float)) and age >= 8:
        derived.append("senior")
    
    return list(set(derived))


def generate_why_explanation(card: Dict, pet_name: str, soul_traits: List[str] = None, user_location: Dict = None) -> str:
    """
    Generate a personalized "why this card" explanation.
    Uses card-specific why_phrases if available, otherwise falls back to generic.
    Now includes location awareness for local recommendations.
    """
    matched = card.get("_matched_traits", [])
    actual_traits = soul_traits or []
    all_traits = list(set(matched + actual_traits))
    
    # Get city for location-aware messaging
    city = user_location.get("city") if user_location else None
    
    # Check for card-specific why_phrases
    why_phrases = card.get("why_phrases", {})
    
    if why_phrases:
        # Try to find a matching trait in the card's why_phrases
        for trait in all_traits:
            trait_lower = trait.lower().replace(" ", "_")
            if trait_lower in why_phrases:
                explanation = why_phrases[trait_lower]
                # Add location context if available and relevant
                if city and card.get("type") == "service":
                    if "near" not in explanation.lower() and "local" not in explanation.lower():
                        explanation = f"{explanation} (available in {city})"
                return explanation
        
        # Return default phrase for this card
        default_phrase = why_phrases.get("default", f"Handpicked for {pet_name}")
        if city and card.get("type") == "service":
            default_phrase = f"{default_phrase} — serving {city}"
        return default_phrase
    
    # Legacy fallback - generic trait explanations
    trait_explanations = {
        "sensitive_tummy": "sensitive tummy",
        "allergy_prone": "dietary sensitivities",
        "itchy": "skin sensitivities",
        "picky": "selective palate",
        "anxious": "calm-and-comfortable style",
        "foodie": "love of food",
        "senior": "senior needs",
        "social": "social nature",
        "playful": "playful energy",
        "elegant": "refined taste",
        "pampered": "pampered lifestyle",
    }
    
    for trait in all_traits:
        trait_lower = trait.lower().replace(" ", "_")
        if trait_lower in trait_explanations:
            explanation = f"Designed for {pet_name}'s {trait_explanations[trait_lower]}"
            if city and card.get("type") == "service":
                explanation = f"{explanation} — in {city}"
            return explanation
    
    if city:
        return f"Curated for {pet_name} in {city}"
    return f"Curated for {pet_name}"


def select_concierge_cards(
    pet_data: Dict,
    products_count: int = 3,
    services_count: int = 2,
    event_context: Optional[Dict] = None
) -> Dict:
    """
    Select the best concierge cards for this pet.
    Returns dict with concierge_products and concierge_services.
    Now supports location-aware personalization.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    soul_traits = pet_data.get("soul_traits", []) or []
    breed = pet_data.get("breed", "") or ""
    size = pet_data.get("size", "medium") or "medium"
    age_band = pet_data.get("age_band", "") or ""
    pet_name = pet_data.get("name", "your pet")
    user_location = pet_data.get("user_location")  # 🌍 Location for personalization
    
    # Derive traits from multiple sources
    derived_traits = derive_traits_from_profile(pet_data)
    all_traits = list(set(soul_traits + derived_traits))
    
    city = user_location.get("city") if user_location else None
    logger.info(f"[DINE CURATE] Pet: {pet_name}, City: {city}, Soul traits: {soul_traits}, Derived: {derived_traits}")
    
    # If profile is thin, add breed defaults
    if len(all_traits) < 2:
        all_traits = list(all_traits) + get_breed_default_traits(breed, size)
    
    soul_traits = all_traits
    
    # Score all products
    scored_products = []
    for card in DINE_CONCIERGE_PRODUCTS:
        score = score_card_for_pet(card, soul_traits, breed, size, age_band, event_context)
        card_copy = {**card}
        card_copy["_score"] = score
        card_copy["_matched_traits"] = [t for t in soul_traits if t.lower() in str(card.get("persona_affinity", {})).lower()]
        
        # Personalize text
        card_copy["name"] = card["name"].replace("{pet_name}", pet_name)
        card_copy["description"] = card["description"].replace("{pet_name}", pet_name)
        card_copy["cta_text"] = card["cta_text"].replace("{pet_name}", pet_name)
        
        scored_products.append(card_copy)
    
    # Score all services
    scored_services = []
    for card in DINE_CONCIERGE_SERVICES:
        score = score_card_for_pet(card, soul_traits, breed, size, age_band, event_context)
        card_copy = {**card}
        card_copy["_score"] = score
        card_copy["_matched_traits"] = [t for t in soul_traits if t.lower() in str(card.get("persona_affinity", {})).lower()]
        
        # Personalize text
        card_copy["name"] = card["name"].replace("{pet_name}", pet_name)
        card_copy["description"] = card["description"].replace("{pet_name}", pet_name)
        card_copy["cta_text"] = card["cta_text"].replace("{pet_name}", pet_name)
        
        # Personalize questions
        if "default_questions" in card_copy:
            for q in card_copy["default_questions"]:
                q["question"] = q["question"].replace("{pet_name}", pet_name)
        
        scored_services.append(card_copy)
    
    # Sort by score
    scored_products.sort(key=lambda x: x["_score"], reverse=True)
    scored_services.sort(key=lambda x: x["_score"], reverse=True)
    
    # Select with minimums (2-3 products + 1-2 services = 3-5 total)
    min_products = 2
    min_services = 1
    
    selected_products = scored_products[:max(products_count, min_products)]
    selected_services = scored_services[:max(services_count, min_services)]
    
    # Generate why explanations with location awareness
    for card in selected_products + selected_services:
        card["why_for_pet"] = generate_why_explanation(card, pet_name, soul_traits, user_location)
    
    return {
        "concierge_products": selected_products,
        "concierge_services": selected_services
    }


def get_micro_question(pet_data: Dict, answered_questions: List[str] = None) -> Optional[Dict]:
    """
    Get a micro-question for pets with thin profiles.
    """
    answered = answered_questions or []
    soul_traits = pet_data.get("soul_traits", []) or []
    pet_name = pet_data.get("name", "your pet")
    
    # If profile has enough traits, no question needed
    if len(soul_traits) >= 3:
        return None
    
    # Find unanswered question
    for q in DINE_MICRO_QUESTIONS:
        if q["id"] not in answered:
            return {
                "id": q["id"],
                "question": q["question"].replace("{pet_name}", pet_name),
                "options": q["options"],
                "maps_to": q["maps_to_trait"]
            }
    
    return None


def get_dine_curated_set(pet_data: Dict, event_context: Optional[Dict] = None) -> Dict:
    """
    Get the complete curated set for Dine pillar.
    Returns: concierge_products, concierge_services, question_card
    """
    answered_questions = pet_data.get("answered_questions", []) or []
    
    # Select cards
    cards = select_concierge_cards(pet_data, event_context=event_context)
    
    # Get micro-question if needed
    question_card = get_micro_question(pet_data, answered_questions)
    
    return {
        "concierge_products": cards["concierge_products"],
        "concierge_services": cards["concierge_services"],
        "question_card": question_card
    }
