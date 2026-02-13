"""
Canonical Answer System for Pet Soul
=====================================

This module provides the single source of truth for:
1. Mapping UI question IDs (35) to canonical scoring field IDs (26)
2. Normalizing and canonicalizing answers on save/read/score
3. Handling non-scoring fields (saved but not scored)

ARCHITECTURE:
- UI writes raw answers via any field name
- canonicalize_answers() normalizes to canonical field names
- Scoring reads only canonical fields
- Mira Soul-First reads only canonical fields
- Non-scoring fields are preserved for Mira context

USAGE:
    from canonical_answers import canonicalize_answers, CANONICAL_FIELDS
    
    # On save
    canonical = canonicalize_answers(raw_answers)
    
    # On read/score
    canonical = canonicalize_answers(pet.doggy_soul_answers)
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

# ============================================================================
# CANONICAL SCORING FIELDS (26 fields, weights sum to exactly 100)
# ============================================================================
# These are the ONLY fields that affect the Soul Score
# Total weight: 100 (normalized from original 98)

CANONICAL_SCORING_FIELDS = {
    # SAFETY & HEALTH (36 points)
    "food_allergies": {"weight": 10, "category": "safety"},
    "health_conditions": {"weight": 8, "category": "safety"},
    "vet_comfort": {"weight": 5, "category": "safety"},
    "life_stage": {"weight": 5, "category": "safety"},
    "grooming_tolerance": {"weight": 4, "category": "safety"},
    "noise_sensitivity": {"weight": 4, "category": "safety"},  # +1 (was 3)
    
    # PERSONALITY & TEMPERAMENT (25 points)
    "temperament": {"weight": 8, "category": "personality"},
    "energy_level": {"weight": 6, "category": "personality"},
    "social_with_dogs": {"weight": 4, "category": "personality"},
    "social_with_people": {"weight": 4, "category": "personality"},
    "behavior_issues": {"weight": 3, "category": "personality"},
    
    # LIFESTYLE & PREFERENCES (20 points)
    "alone_time_comfort": {"weight": 5, "category": "lifestyle"},
    "car_comfort": {"weight": 4, "category": "lifestyle"},
    "travel_readiness": {"weight": 3, "category": "lifestyle"},
    "favorite_spot": {"weight": 2, "category": "lifestyle"},
    "morning_routine": {"weight": 2, "category": "lifestyle"},
    "exercise_needs": {"weight": 2, "category": "lifestyle"},
    "feeding_times": {"weight": 2, "category": "lifestyle"},
    
    # NUTRITION (9 points)
    "favorite_protein": {"weight": 3, "category": "nutrition"},
    "food_motivation": {"weight": 3, "category": "nutrition"},
    "treat_preference": {"weight": 3, "category": "nutrition"},  # +1 (was 2)
    
    # TRAINING (5 points)
    "training_level": {"weight": 3, "category": "training"},
    "motivation_type": {"weight": 2, "category": "training"},
    
    # RELATIONSHIPS (5 points)
    "primary_bond": {"weight": 2, "category": "relationships"},
    "other_pets": {"weight": 2, "category": "relationships"},
    "kids_at_home": {"weight": 1, "category": "relationships"},
}

# Verify weights sum to exactly 100
_TOTAL_WEIGHT = sum(f["weight"] for f in CANONICAL_SCORING_FIELDS.values())
assert _TOTAL_WEIGHT == 100, f"Scoring weights must sum to 100, got {_TOTAL_WEIGHT}"

# ============================================================================
# NON-SCORING FIELDS (saved for Mira context, don't affect score)
# ============================================================================

NON_SCORING_FIELDS = {
    # Travel anxiety - important for Mira but not scored
    "travel_anxiety": {"category": "travel", "mira_relevant": True},
    "hotel_experience": {"category": "travel", "mira_relevant": True},
    "stay_preference": {"category": "travel", "mira_relevant": True},
    "travel_social": {"category": "travel", "mira_relevant": True},
    "usual_travel": {"category": "travel", "mira_relevant": True},
    
    # Detailed personality traits
    "describe_3_words": {"category": "personality", "mira_relevant": True},
    "social_preference": {"category": "personality", "mira_relevant": True},
    "handling_comfort": {"category": "personality", "mira_relevant": True},
    "attention_seeking": {"category": "personality", "mira_relevant": True},
    
    # Routine details
    "sleep_location": {"category": "routine", "mira_relevant": True},
    "energetic_time": {"category": "routine", "mira_relevant": True},
    "walks_per_day": {"category": "routine", "mira_relevant": True},
    
    # Home & comfort
    "favorite_item": {"category": "comfort", "mira_relevant": True},
    "space_preference": {"category": "comfort", "mira_relevant": True},
    "crate_trained": {"category": "comfort", "mira_relevant": True},
    
    # Family details
    "lives_with": {"category": "family", "mira_relevant": True},
    "most_attached_to": {"category": "family", "mira_relevant": True},
    
    # Long horizon / dreams
    "main_wish": {"category": "dreams", "mira_relevant": True},
    "help_needed": {"category": "dreams", "mira_relevant": True},
    "dream_life": {"category": "dreams", "mira_relevant": True},
    "celebration_preferences": {"category": "dreams", "mira_relevant": True},
    
    # Training details
    "training_response": {"category": "training", "mira_relevant": True},
    "leash_behavior": {"category": "training", "mira_relevant": True},
    "barking": {"category": "training", "mira_relevant": True},
    
    # Food details
    "diet_type": {"category": "nutrition", "mira_relevant": True},
    "favorite_treats": {"category": "nutrition", "mira_relevant": True},
    "sensitive_stomach": {"category": "nutrition", "mira_relevant": True},
    
    # Misc
    "favorite_toy_type": {"category": "enrichment", "mira_relevant": True},
    "general_nature": {"category": "personality", "mira_relevant": True},
    "stranger_reaction": {"category": "personality", "mira_relevant": True},
    "loud_sounds": {"category": "safety", "mira_relevant": True},
    "behavior_with_dogs": {"category": "personality", "mira_relevant": True},
    "separation_anxiety": {"category": "lifestyle", "mira_relevant": True},
    "alone_comfort": {"category": "lifestyle", "mira_relevant": True},
    "car_rides": {"category": "travel", "mira_relevant": True},
}

# ============================================================================
# UI → CANONICAL FIELD MAPPING
# ============================================================================
# Maps UI question IDs (35) to canonical scoring field IDs (26)
# Multiple UI fields can map to one canonical field

UI_TO_CANONICAL_MAP = {
    # ─────────────────────────────────────────────────────────────
    # TEMPERAMENT / PERSONALITY
    # ─────────────────────────────────────────────────────────────
    "general_nature": "temperament",
    "describe_3_words": "temperament",  # Also saved as non-scoring
    "nature": "temperament",
    
    # ─────────────────────────────────────────────────────────────
    # SOCIAL BEHAVIOR
    # ─────────────────────────────────────────────────────────────
    "stranger_reaction": "social_with_people",
    "behavior_with_strangers": "social_with_people",
    "behavior_with_dogs": "social_with_dogs",
    "dog_friendly": "social_with_dogs",
    
    # ─────────────────────────────────────────────────────────────
    # COMFORT & HANDLING
    # ─────────────────────────────────────────────────────────────
    "handling_comfort": "grooming_tolerance",
    "grooming_comfort": "grooming_tolerance",
    "touch_sensitivity": "grooming_tolerance",
    
    # ─────────────────────────────────────────────────────────────
    # SOUNDS & ANXIETY
    # ─────────────────────────────────────────────────────────────
    "loud_sounds": "noise_sensitivity",
    "sound_sensitivity": "noise_sensitivity",
    "thunder_anxiety": "noise_sensitivity",
    
    # ─────────────────────────────────────────────────────────────
    # ALONE TIME / SEPARATION
    # ─────────────────────────────────────────────────────────────
    "separation_anxiety": "alone_time_comfort",
    "alone_comfort": "alone_time_comfort",
    "home_alone": "alone_time_comfort",
    
    # ─────────────────────────────────────────────────────────────
    # EXERCISE & ACTIVITY
    # ─────────────────────────────────────────────────────────────
    "play_style": "exercise_needs",
    "favorite_activity": "exercise_needs",
    "activity_level": "exercise_needs",
    "walks_per_day": "exercise_needs",  # Also saved as non-scoring
    "exercise_preferences": "exercise_needs",
    
    # ─────────────────────────────────────────────────────────────
    # TRAVEL
    # ─────────────────────────────────────────────────────────────
    "car_rides": "car_comfort",
    "car_anxiety": "car_comfort",
    "travel_comfort": "travel_readiness",
    "usual_travel": "travel_readiness",  # Also saved as non-scoring
    
    # ─────────────────────────────────────────────────────────────
    # FOOD & TREATS
    # ─────────────────────────────────────────────────────────────
    "preferred_treats": "treat_preference",
    "treat_texture": "treat_preference",
    "favorite_treats": "treat_preference",  # Also saved as non-scoring
    "favorite_flavors": "favorite_protein",
    
    # ─────────────────────────────────────────────────────────────
    # ROUTINE
    # ─────────────────────────────────────────────────────────────
    "energetic_time": "morning_routine",  # Also saved as non-scoring
    "space_preference": "favorite_spot",  # Also saved as non-scoring
    
    # ─────────────────────────────────────────────────────────────
    # LIFE STAGE
    # ─────────────────────────────────────────────────────────────
    "dob": "life_stage",
    "birth_date": "life_stage",
    "age": "life_stage",
    "age_years": "life_stage",
    
    # ─────────────────────────────────────────────────────────────
    # TRAINING
    # ─────────────────────────────────────────────────────────────
    "training_status": "training_level",
    "obedience_level": "training_level",
    "training_response": "motivation_type",  # Also saved as non-scoring
    
    # ─────────────────────────────────────────────────────────────
    # RELATIONSHIPS
    # ─────────────────────────────────────────────────────────────
    "most_attached_to": "primary_bond",  # Also saved as non-scoring
    "lives_with": "other_pets",  # Also saved as non-scoring (contains kids info too)
    
    # ─────────────────────────────────────────────────────────────
    # OTHER
    # ─────────────────────────────────────────────────────────────
    "vet_anxiety": "vet_comfort",
    "vet_behavior": "vet_comfort",
    "water_comfort": "swimming_ability",  # Maps to non-existent, will be ignored
    "leash_manners": "behavior_issues",  # Contributes to behavior_issues
}


def is_empty_value(value: Any) -> bool:
    """Check if a value should be considered empty/unanswered."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() in ['', 'Unknown', 'Not set', 'N/A']:
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def canonicalize_answers(
    raw_answers: Dict[str, Any],
    preferences: Optional[Dict[str, Any]] = None,
    soul: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Canonicalize raw answers to standard field names.
    
    This function:
    1. Maps UI field names to canonical scoring field names
    2. Preserves non-scoring fields for Mira context
    3. Pulls additional data from preferences and soul objects
    4. Returns a clean dict with both canonical and non-scoring fields
    
    Args:
        raw_answers: The doggy_soul_answers dict from the pet
        preferences: Optional pet.preferences dict
        soul: Optional pet.soul dict
        
    Returns:
        Dict with:
        - All canonical scoring fields (mapped from UI)
        - All non-scoring fields (preserved for Mira)
        - _meta: metadata about the canonicalization
    """
    preferences = preferences or {}
    soul = soul or {}
    
    canonical = {}
    non_scoring = {}
    mapping_log = []
    
    # Step 1: Process each raw answer
    for ui_field, value in raw_answers.items():
        if is_empty_value(value):
            continue
            
        # Check if it maps to a canonical scoring field
        if ui_field in UI_TO_CANONICAL_MAP:
            canonical_field = UI_TO_CANONICAL_MAP[ui_field]
            if canonical_field in CANONICAL_SCORING_FIELDS:
                # Only set if not already set (first value wins)
                if canonical_field not in canonical:
                    canonical[canonical_field] = value
                    mapping_log.append(f"{ui_field} → {canonical_field}")
        
        # Check if it's a direct canonical scoring field
        elif ui_field in CANONICAL_SCORING_FIELDS:
            if ui_field not in canonical:
                canonical[ui_field] = value
                mapping_log.append(f"{ui_field} (direct)")
        
        # Always preserve in non-scoring if defined there
        if ui_field in NON_SCORING_FIELDS:
            non_scoring[ui_field] = value
        
        # Also preserve raw field if not in either map (future-proofing)
        elif ui_field not in CANONICAL_SCORING_FIELDS and ui_field not in UI_TO_CANONICAL_MAP:
            non_scoring[ui_field] = value
    
    # Step 2: Pull from preferences (fill gaps)
    if preferences:
        # Treat texture → treat_preference
        if preferences.get('treat_texture') and 'treat_preference' not in canonical:
            canonical['treat_preference'] = preferences['treat_texture']
            mapping_log.append("preferences.treat_texture → treat_preference")
        
        # Activity level → exercise_needs
        if preferences.get('activity_level') and 'exercise_needs' not in canonical:
            canonical['exercise_needs'] = preferences['activity_level']
            mapping_log.append("preferences.activity_level → exercise_needs")
        
        # Favorite flavors → favorite_protein
        if preferences.get('favorite_flavors') and 'favorite_protein' not in canonical:
            flavors = preferences['favorite_flavors']
            if isinstance(flavors, list) and flavors:
                canonical['favorite_protein'] = flavors[0]
            elif isinstance(flavors, str):
                canonical['favorite_protein'] = flavors
            mapping_log.append("preferences.favorite_flavors → favorite_protein")
        
        # Allergies from preferences
        if preferences.get('allergies') and 'food_allergies' not in canonical:
            canonical['food_allergies'] = preferences['allergies']
            mapping_log.append("preferences.allergies → food_allergies")
    
    # Step 3: Pull from soul object
    if soul:
        # Persona → temperament (if not set)
        if soul.get('persona') and 'temperament' not in canonical:
            canonical['temperament'] = soul['persona']
            mapping_log.append("soul.persona → temperament")
    
    # Step 4: Special handling for 'lives_with' → both other_pets and kids_at_home
    lives_with = raw_answers.get('lives_with') or non_scoring.get('lives_with')
    if lives_with:
        lives_with_str = lives_with if isinstance(lives_with, str) else ', '.join(lives_with) if isinstance(lives_with, list) else str(lives_with)
        lives_with_lower = lives_with_str.lower()
        
        # other_pets
        if 'other_pets' not in canonical:
            if any(x in lives_with_lower for x in ['dog', 'cat', 'pet', 'bird', 'animal']):
                canonical['other_pets'] = lives_with
                mapping_log.append("lives_with → other_pets")
        
        # kids_at_home
        if 'kids_at_home' not in canonical:
            if any(x in lives_with_lower for x in ['child', 'kid', 'children', 'baby', 'toddler']):
                canonical['kids_at_home'] = "Yes"
                mapping_log.append("lives_with → kids_at_home")
    
    # Build result with metadata
    result = {
        **canonical,  # All canonical scoring fields
        **non_scoring,  # All non-scoring fields (for Mira)
        "_meta": {
            "canonicalized_at": datetime.utcnow().isoformat(),
            "scoring_fields_count": len(canonical),
            "non_scoring_fields_count": len(non_scoring),
            "mapping_log": mapping_log,
        }
    }
    
    return result


def get_scoring_answers(canonical_answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract only the canonical scoring fields from a canonicalized answer dict.
    
    Use this for score calculation.
    """
    return {
        k: v for k, v in canonical_answers.items()
        if k in CANONICAL_SCORING_FIELDS and not is_empty_value(v)
    }


def get_mira_context(canonical_answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract all fields relevant for Mira's Soul-First context.
    
    Includes both scoring and non-scoring fields.
    """
    result = {}
    
    # Add all scoring fields
    for k, v in canonical_answers.items():
        if k in CANONICAL_SCORING_FIELDS and not is_empty_value(v):
            result[k] = v
    
    # Add all non-scoring fields that are Mira-relevant
    for k, v in canonical_answers.items():
        if k in NON_SCORING_FIELDS and NON_SCORING_FIELDS[k].get('mira_relevant') and not is_empty_value(v):
            result[k] = v
    
    return result


def calculate_soul_score(canonical_answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate Soul Score from canonicalized answers.
    
    Returns:
        {
            "total_score": 0-100,
            "answered_count": int,
            "total_questions": 26,
            "category_scores": {...},
            "missing_high_impact": [...],
            "tier": {...}
        }
    """
    scoring = get_scoring_answers(canonical_answers)
    
    # Calculate total and per-category scores
    total_earned = 0
    total_possible = 100  # Fixed at 100
    category_scores = {}
    missing_high_impact = []
    
    for field, config in CANONICAL_SCORING_FIELDS.items():
        weight = config["weight"]
        category = config["category"]
        
        # Initialize category if needed
        if category not in category_scores:
            category_scores[category] = {"earned": 0, "possible": 0, "fields": []}
        
        category_scores[category]["possible"] += weight
        
        if field in scoring:
            total_earned += weight
            category_scores[category]["earned"] += weight
            category_scores[category]["fields"].append({"field": field, "answered": True})
        else:
            if weight >= 5:  # High impact threshold
                missing_high_impact.append(field)
            category_scores[category]["fields"].append({"field": field, "answered": False})
    
    # Calculate percentages
    total_score = (total_earned / total_possible) * 100
    
    for cat in category_scores:
        possible = category_scores[cat]["possible"]
        earned = category_scores[cat]["earned"]
        category_scores[cat]["percentage"] = (earned / possible * 100) if possible > 0 else 0
    
    # Determine tier
    tier = get_tier(total_score)
    
    return {
        "total_score": round(total_score, 1),
        "answered_count": len(scoring),
        "total_questions": len(CANONICAL_SCORING_FIELDS),
        "category_scores": category_scores,
        "missing_high_impact": missing_high_impact,
        "tier": tier,
    }


def get_tier(score: float) -> Dict[str, Any]:
    """Get tier info based on score percentage."""
    TIERS = [
        {"key": "newcomer", "name": "Newcomer", "emoji": "🐾", "min": 0, "max": 24, "color": "gray"},
        {"key": "soul_seeker", "name": "Soul Seeker", "emoji": "🌱", "min": 25, "max": 49, "color": "green"},
        {"key": "soul_explorer", "name": "Soul Explorer", "emoji": "🌟", "min": 50, "max": 74, "color": "blue"},
        {"key": "soul_master", "name": "Soul Master", "emoji": "👑", "min": 75, "max": 100, "color": "gold"},
    ]
    
    for tier in TIERS:
        if tier["min"] <= score <= tier["max"]:
            return tier
    
    return TIERS[0]  # Default to newcomer


# ============================================================================
# EXPORT ALL CANONICAL FIELD NAMES
# ============================================================================

CANONICAL_FIELDS = list(CANONICAL_SCORING_FIELDS.keys())
ALL_FIELDS = CANONICAL_FIELDS + list(NON_SCORING_FIELDS.keys())


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_answer(field: str, value: Any) -> Tuple[bool, str]:
    """
    Validate that an answer is acceptable for a field.
    
    Returns:
        (is_valid, error_message)
    """
    if is_empty_value(value):
        return False, "Value is empty"
    
    # Check if field exists in any mapping
    canonical_field = UI_TO_CANONICAL_MAP.get(field, field)
    
    if canonical_field not in CANONICAL_SCORING_FIELDS and field not in NON_SCORING_FIELDS:
        # Unknown field - still accept it but warn
        return True, f"Unknown field '{field}' - will be saved as non-scoring"
    
    return True, ""


def get_question_weight(field: str) -> int:
    """Get the weight of a field (0 if non-scoring)."""
    canonical = UI_TO_CANONICAL_MAP.get(field, field)
    if canonical in CANONICAL_SCORING_FIELDS:
        return CANONICAL_SCORING_FIELDS[canonical]["weight"]
    return 0
