# /app/backend/app/data/fresh_meals_concierge_cards.py
"""
Fresh Meals Concierge Card Library - 4 cards total
Curated picks for the Fresh Meals page (/dine/meals)

PRINCIPLES:
1. Concierge-first: These create tickets, not cart items
2. Allergy-aware: Cards respect pet's avoid list
3. Persona-based: Scoring based on pet traits
4. Intent capture: Questions asked in ticket thread

Card Types:
- 2 Concierge Products (meal plans, transitions)
- 2 Concierge Services (consultations, arrangements)
"""

from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# FRESH MEALS CONCIERGE PRODUCTS (2)
# =============================================================================

FRESH_MEALS_PRODUCTS = [
    {
        "id": "fresh_custom_meal_plan",
        "type": "concierge_product",
        "name": "Custom Fresh Meal Plan for {pet_name}",
        "icon": "utensils",
        "image": "fresh_meal_bowl",
        "description": "A personalized fresh food plan built around {pet_name}'s health goals, allergies, and taste preferences.",
        "why_concierge": "Every pet is unique — we design plans that fit their body, not generic portions.",
        "cta_text": "Design my plan",
        "badge": None,
        "why_phrases": {
            "sensitive_tummy": "Gentle ingredients for sensitive digestion",
            "picky": "Flavor rotation to keep picky eaters excited",
            "foodie": "Gourmet variety for adventurous palates",
            "senior": "Nutrient-dense meals for senior vitality",
            "weight_management": "Calorie-controlled portions for healthy weight",
            "allergic": "100% allergen-free ingredients only",
            "itchy": "Anti-inflammatory proteins for skin health",
            "default": "Fresh meals tailored to {pet_name}'s needs"
        },
        "default_questions": [
            {
                "id": "health_goal",
                "question": "What's the main health goal for {pet_name}?",
                "type": "choice",
                "options": ["Weight management", "Digestive health", "Skin & coat", "Energy boost", "Senior wellness", "General nutrition"]
            },
            {
                "id": "protein_preference",
                "question": "Any protein preferences? (We'll avoid allergens automatically)",
                "type": "choice",
                "options": ["Fish-based", "Chicken-free", "Red meat", "Variety/rotation", "Vegetarian mix", "No preference"]
            },
            {
                "id": "meal_frequency",
                "question": "How many meals does {pet_name} have per day?",
                "type": "choice",
                "options": ["1 meal", "2 meals", "3 meals", "Free feeding"]
            },
            {
                "id": "budget_range",
                "question": "What's your monthly budget range for fresh meals?",
                "type": "choice",
                "options": ["Under ₹3000", "₹3000-5000", "₹5000-8000", "₹8000+", "Flexible"]
            }
        ],
        "persona_affinity": {
            "foodie": 0.95,
            "weight_management": 0.9,
            "senior": 0.85,
            "sensitive_tummy": 0.9,
            "picky": 0.85,
            "health_conscious": 0.9,
            "allergic": 0.95,
            "itchy": 0.9,
            "anxious": 0.6,
            "playful": 0.7,
            "elegant": 0.75
        },
        "allergy_safe": True,
        "respects_avoid_list": True
    },
    {
        "id": "fresh_transition_guide",
        "type": "concierge_product",
        "name": "Fresh Food Transition for {pet_name}",
        "icon": "arrow-right-circle",
        "image": "transition_bowls",
        "description": "A safe 7-10 day plan to switch {pet_name} from kibble to fresh meals without tummy upset.",
        "why_concierge": "Rushing food changes causes digestive issues — we pace it based on {pet_name}'s sensitivity.",
        "cta_text": "Start transition",
        "badge": "Popular",
        "why_phrases": {
            "sensitive_tummy": "Extra-gentle transition for sensitive stomachs",
            "anxious": "Gradual change to maintain routine comfort",
            "picky": "Slow introduction to build acceptance",
            "senior": "Careful pacing for older digestive systems",
            "default": "Safe, gradual switch to fresh meals"
        },
        "default_questions": [
            {
                "id": "current_food",
                "question": "What is {pet_name} currently eating?",
                "type": "choice",
                "options": ["Dry kibble", "Wet food", "Home-cooked", "Mixed diet", "Another fresh brand"]
            },
            {
                "id": "tummy_history",
                "question": "Has {pet_name} had tummy issues with food changes before?",
                "type": "choice",
                "options": ["Yes, often", "Sometimes", "Rarely", "Never tried switching", "Not sure"]
            },
            {
                "id": "timeline",
                "question": "When do you want to complete the transition?",
                "type": "choice",
                "options": ["ASAP (7 days)", "Comfortable pace (10-14 days)", "Very gradual (3 weeks)", "No rush"]
            }
        ],
        "persona_affinity": {
            "sensitive_tummy": 0.95,
            "anxious": 0.8,
            "picky": 0.75,
            "senior": 0.85,
            "health_conscious": 0.7,
            "weight_management": 0.6,
            "foodie": 0.5,
            "playful": 0.5,
            "elegant": 0.5
        },
        "allergy_safe": True,
        "respects_avoid_list": True
    }
]

# =============================================================================
# FRESH MEALS CONCIERGE SERVICES (2)
# =============================================================================

FRESH_MEALS_SERVICES = [
    {
        "id": "fresh_nutrition_consult",
        "type": "concierge_service",
        "name": "Fresh Nutrition Consultation",
        "icon": "stethoscope",
        "image": "nutrition_consult",
        "description": "A 15-min call with our pet nutritionist to design the perfect fresh meal approach for {pet_name}.",
        "why_concierge": "Complex needs (allergies, conditions, multi-pet) benefit from expert guidance.",
        "cta_text": "Book consultation",
        "badge": "Expert",
        "why_phrases": {
            "allergic": "Expert guidance for allergy management",
            "itchy": "Specialist advice for skin-food connection",
            "sensitive_tummy": "Professional help for digestive concerns",
            "senior": "Age-appropriate nutrition expertise",
            "weight_management": "Professional portion guidance",
            "default": "Expert nutrition advice for {pet_name}"
        },
        "default_questions": [
            {
                "id": "main_concern",
                "question": "What's your main concern about {pet_name}'s diet?",
                "type": "text"
            },
            {
                "id": "vet_recommendations",
                "question": "Has your vet made any specific dietary recommendations?",
                "type": "choice",
                "options": ["Yes, I have specifics", "General advice only", "No vet input yet", "Conflicting advice"]
            },
            {
                "id": "preferred_time",
                "question": "When's a good time for a 15-min call?",
                "type": "choice",
                "options": ["Morning (9am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-8pm)", "Weekend only"]
            }
        ],
        "persona_affinity": {
            "allergic": 0.95,
            "itchy": 0.9,
            "sensitive_tummy": 0.9,
            "senior": 0.85,
            "health_conscious": 0.8,
            "weight_management": 0.75,
            "anxious": 0.6,
            "foodie": 0.5,
            "picky": 0.6,
            "playful": 0.4,
            "elegant": 0.5
        },
        "allergy_safe": True,
        "location_aware": False
    },
    {
        "id": "fresh_kitchen_tour",
        "type": "concierge_service",
        "name": "Kitchen Partner Introduction",
        "icon": "building",
        "image": "kitchen_tour",
        "description": "We'll connect you with a vetted fresh meal kitchen near you that matches {pet_name}'s needs.",
        "why_concierge": "We vet kitchens for hygiene, ingredients, and allergy protocols — you just meet them.",
        "cta_text": "Find my kitchen",
        "badge": "Local",
        "why_phrases": {
            "allergic": "Kitchens with strict allergy protocols",
            "foodie": "Gourmet kitchens for discerning palates",
            "health_conscious": "Certified, transparent ingredient sourcing",
            "default": "Vetted fresh meal kitchens in your area"
        },
        "default_questions": [
            {
                "id": "location",
                "question": "What area/pincode should we search?",
                "type": "text"
            },
            {
                "id": "delivery_preference",
                "question": "Do you prefer pickup or delivery?",
                "type": "choice",
                "options": ["Delivery only", "Pickup is fine", "Either works"]
            },
            {
                "id": "priority",
                "question": "What's most important in a kitchen partner?",
                "type": "choice",
                "options": ["Allergy safety", "Ingredient quality", "Price", "Delivery flexibility", "Variety of recipes"]
            }
        ],
        "persona_affinity": {
            "foodie": 0.85,
            "allergic": 0.9,
            "health_conscious": 0.8,
            "elegant": 0.7,
            "pampered": 0.75,
            "sensitive_tummy": 0.7,
            "default": 0.5
        },
        "allergy_safe": True,
        "location_aware": True
    }
]

# =============================================================================
# ALL CARDS COMBINED
# =============================================================================

ALL_FRESH_MEALS_CARDS = FRESH_MEALS_PRODUCTS + FRESH_MEALS_SERVICES

# =============================================================================
# SCORING & SELECTION FUNCTIONS
# =============================================================================

def score_card_for_pet(
    card: Dict,
    soul_traits: List[str],
    breed: str = "",
    size: str = "medium",
    age_band: str = "",
    allergies: List[str] = None
) -> float:
    """
    Score a card based on pet profile.
    Higher score = better match.
    """
    base_score = 0.5
    affinity = card.get("persona_affinity", {})
    
    # Trait matching
    trait_scores = []
    for trait in soul_traits:
        trait_key = trait.lower().replace(" ", "_")
        if trait_key in affinity:
            trait_scores.append(affinity[trait_key])
    
    if trait_scores:
        base_score = sum(trait_scores) / len(trait_scores)
    
    # Allergy boost - if pet has allergies and card is allergy-safe
    if allergies and len(allergies) > 0 and card.get("allergy_safe"):
        base_score += 0.15
    
    # Senior boost for senior-appropriate cards
    if age_band and "senior" in age_band.lower():
        if "senior" in str(affinity):
            base_score += 0.1
    
    return min(base_score, 1.0)


def get_why_phrase(card: Dict, traits: List[str], pet_name: str) -> str:
    """
    Get the most relevant 'why' phrase for this card based on pet traits.
    """
    why_phrases = card.get("why_phrases", {})
    
    # Check each trait for a match
    for trait in traits:
        trait_key = trait.lower().replace(" ", "_")
        if trait_key in why_phrases:
            return why_phrases[trait_key].replace("{pet_name}", pet_name)
    
    # Fall back to default
    default = why_phrases.get("default", card.get("description", ""))
    return default.replace("{pet_name}", pet_name)


def select_fresh_meals_cards(
    pet_data: Dict,
    max_cards: int = 4,
    include_products: bool = True,
    include_services: bool = True
) -> Dict:
    """
    Select the best fresh meals cards for this pet.
    
    Returns:
        {
            "cards": [...],  # Selected cards
            "pet_context": {...}  # Pet info used for selection
        }
    """
    pet_name = pet_data.get("name", "your pet")
    soul_traits = pet_data.get("soul_traits", []) or []
    breed = pet_data.get("breed", "")
    size = pet_data.get("size", "medium")
    age_band = pet_data.get("age_band", "")
    allergies = pet_data.get("allergies", []) or pet_data.get("soul_data", {}).get("allergies", [])
    
    logger.info(f"[FRESH MEALS CURATE] Pet: {pet_name}, Traits: {soul_traits}, Allergies: {allergies}")
    
    # Derive additional traits from allergies
    derived_traits = []
    if allergies and len(allergies) > 0:
        derived_traits.append("allergic")
    if any("skin" in str(a).lower() or "itch" in str(a).lower() for a in allergies):
        derived_traits.append("itchy")
    
    all_traits = list(set(soul_traits + derived_traits))
    
    # Build card pool
    card_pool = []
    if include_products:
        card_pool.extend(FRESH_MEALS_PRODUCTS)
    if include_services:
        card_pool.extend(FRESH_MEALS_SERVICES)
    
    # Score and sort
    scored_cards = []
    for card in card_pool:
        score = score_card_for_pet(card, all_traits, breed, size, age_band, allergies)
        
        card_copy = {**card}
        card_copy["_score"] = score
        card_copy["_matched_traits"] = [t for t in all_traits if t.lower() in str(card.get("persona_affinity", {})).lower()]
        
        # Personalize text
        card_copy["name"] = card["name"].replace("{pet_name}", pet_name)
        card_copy["description"] = card["description"].replace("{pet_name}", pet_name)
        card_copy["cta_text"] = card["cta_text"].replace("{pet_name}", pet_name)
        card_copy["why_concierge"] = card["why_concierge"].replace("{pet_name}", pet_name)
        
        # Get why phrase
        card_copy["why_for_pet"] = get_why_phrase(card, all_traits, pet_name)
        
        # Personalize questions
        if "default_questions" in card_copy:
            for q in card_copy["default_questions"]:
                q["question"] = q["question"].replace("{pet_name}", pet_name)
        
        scored_cards.append(card_copy)
    
    # Sort by score
    scored_cards.sort(key=lambda x: x["_score"], reverse=True)
    
    # Select top cards
    selected = scored_cards[:max_cards]
    
    # Remove internal scoring fields for response
    for card in selected:
        card.pop("_score", None)
        card.pop("_matched_traits", None)
        card.pop("persona_affinity", None)
    
    return {
        "cards": selected,
        "pet_context": {
            "pet_name": pet_name,
            "traits_used": all_traits,
            "has_allergies": len(allergies) > 0,
            "allergies": allergies
        }
    }


def get_fresh_meals_cards_for_api(pet_data: Dict) -> Dict:
    """
    API-friendly wrapper for card selection.
    """
    result = select_fresh_meals_cards(pet_data, max_cards=4)
    
    return {
        "success": True,
        "pillar": "dine",
        "sub_pillar": "fresh_meals",
        "concierge_cards": result["cards"],
        "pet_context": result["pet_context"],
        "total_cards": len(result["cards"])
    }
