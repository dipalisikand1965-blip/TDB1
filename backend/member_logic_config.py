"""
MEMBER LOGIC CONFIG - Single Source of Truth
=============================================
Last Updated: Feb 13, 2026

This file defines the canonical rules for:
1. Badges (Achievements)
2. Paw Points (Currency)
3. Soul Score (Profile Completeness)
4. Rewards & Emergency Suppression

ALL implementations MUST reference these constants.
"""

from typing import Dict, List, Set
from datetime import datetime, timezone


# =============================================================================
# 1. BADGES (Achievements) - Question-Count Based
# =============================================================================
# Badges are triggered by NUMBER of Soul questions answered (not % score)
# Count = non-empty fields in pets.doggy_soul_answers that are UI question IDs

BADGE_DEFINITIONS = {
    "soul_starter": {
        "name": "Soul Starter",
        "description": "Answered 5 Soul questions",
        "emoji": "🌱",
        "type": "questions",
        "threshold": 5,
        "points_reward": 50
    },
    "soul_seeker": {
        "name": "Soul Seeker", 
        "description": "Answered 10 Soul questions",
        "emoji": "🔍",
        "type": "questions",
        "threshold": 10,
        "points_reward": 100
    },
    "soul_explorer": {
        "name": "Soul Explorer",
        "description": "Answered 15 Soul questions",
        "emoji": "🌟",
        "type": "questions",
        "threshold": 15,
        "points_reward": 250
    },
    "soul_guardian": {
        "name": "Soul Guardian",
        "description": "Answered 20 Soul questions",
        "emoji": "🛡️",
        "type": "questions",
        "threshold": 20,
        "points_reward": 500
    },
    "photo_uploaded": {
        "name": "Picture Paw-fect",
        "description": "Uploaded a pet photo",
        "emoji": "📸",
        "type": "photo",
        "threshold": 1,
        "points_reward": 50
    },
    "multi_pet": {
        "name": "Pack Parent",
        "description": "Registered 2+ pets",
        "emoji": "🐕‍🦺",
        "type": "pets",
        "threshold": 2,
        "points_reward": 200
    },
    "first_order": {
        "name": "First Paw-chase",
        "description": "Placed first order",
        "emoji": "🛒",
        "type": "orders",
        "threshold": 1,
        "points_reward": 100
    },
    "celebration_planned": {
        "name": "Party Planner",
        "description": "Booked a celebration",
        "emoji": "🎉",
        "type": "celebration",
        "threshold": 1,
        "points_reward": 150
    }
}

# Badge thresholds for quick lookup
BADGE_QUESTION_THRESHOLDS = {
    5: "soul_starter",
    10: "soul_seeker",
    15: "soul_explorer",
    20: "soul_guardian"
}


# =============================================================================
# 2. PAW POINTS - Earning Rules (Ledger First → Then Balance)
# =============================================================================
# Points must ALWAYS write to paw_points_ledger first, then update:
# - users.loyalty_points
# - users.lifetime_points_earned

PAW_POINTS_RULES = {
    "first_order": {
        "points": 100,
        "description": "First order placed",
        "source": "order",
        "one_time": True
    },
    "product_purchase": {
        "points_percent": 5,  # 5% of order value
        "description": "5% of purchase value",
        "source": "order",
        "one_time": False,
        "rounding": "floor"  # Round down to nearest integer
    },
    "soul_question_answered": {
        "points": 10,
        "description": "Per newly answered Soul question",
        "source": "soul",
        "one_time": False,  # Per question, but no re-award on edits
        "note": "Only awarded for new answers, not edits to existing answers"
    },
    "review_submitted": {
        "points": 25,
        "description": "Review submitted",
        "source": "review",
        "one_time": False  # Per review
    },
    "referral_complete": {
        "points": 500,
        "description": "Referral completed (friend's first order)",
        "source": "referral",
        "one_time": False  # Per referral
    },
    "service_booking": {
        "points_range": (50, 200),
        "description": "Service booking (varies by pillar)",
        "source": "service",
        "pillar_points": {
            "celebrate": 150,
            "dine": 75,
            "stay": 200,
            "travel": 100,
            "care": 100,
            "fit": 75,
            "enjoy": 50,
            "learn": 50,
            "paperwork": 50,
            "advisory": 100,
            "emergency": 0,  # No points in emergency
            "farewell": 100,
            "adopt": 150,
            "shop": 0  # Shop is purchase-based
        }
    }
}


# =============================================================================
# 3. SOUL SCORE - Profile Completeness (26-Field Weighted Set)
# =============================================================================
# Soul Score is calculated from 26 canonical scoring fields ONLY
# Extra UI questions are "memory-only" and don't affect score

SOUL_SCORE_TIERS = {
    "curious_pup": {
        "name": "Curious Pup",
        "emoji": "🐾",
        "min_percent": 0,
        "max_percent": 24,
        "description": "Early understanding - just getting to know each other"
    },
    "loyal_companion": {
        "name": "Loyal Companion",
        "emoji": "🌱", 
        "min_percent": 25,
        "max_percent": 49,
        "description": "Core context built - we understand the basics"
    },
    "trusted_guardian": {
        "name": "Trusted Guardian",
        "emoji": "🤝",
        "min_percent": 50,
        "max_percent": 74,
        "description": "Concierge-ready - personalized care unlocked"
    },
    "pack_leader": {
        "name": "Pack Leader",
        "emoji": "🐕‍🦺",
        "min_percent": 75,
        "max_percent": 100,
        "description": "Deep understanding - bespoke concierge experience"
    }
}


# =============================================================================
# 4. UI QUESTIONS → CANONICAL SCORING FIELDS MAPPING
# =============================================================================
# UI can collect 35+ questions, but only 26 affect scoring
# This mapping ensures we don't drift between UI and scoring

# UI Question IDs that count toward badge thresholds
# These are the actual field names stored in pets.doggy_soul_answers
UI_QUESTION_IDS: Set[str] = {
    # Safety & Health (6 questions, 36 points total)
    "food_allergies",
    "health_conditions", 
    "vet_comfort",
    "life_stage",
    "grooming_tolerance",
    "noise_sensitivity",
    
    # Personality & Temperament (5 questions, 25 points total)
    "temperament",
    "energy_level",
    "social_with_dogs",
    "social_with_people",
    "behavior_issues",
    
    # Lifestyle & Preferences (7 questions, 20 points total)
    "alone_time_comfort",
    "car_comfort",
    "travel_readiness",
    "favorite_spot",
    "morning_routine",
    "exercise_needs",
    "sleep_preferences",
    
    # Nutrition (3 questions, 9 points total)
    "feeding_times",
    "favorite_protein",
    "food_motivation",
    
    # Training (2 questions, 5 points total)
    "training_level",
    "motivation_type",
    
    # Relationships (3 questions, 5 points total)
    "primary_bond",
    "other_pets",
    "kids_at_home",
    
    # Additional UI questions (memory-only, don't affect score)
    "treat_preference",
    "favorite_toy",
    "play_style",
    "walking_preference",
    "bath_tolerance",
    "nail_trim_tolerance",
    "ear_cleaning_tolerance",
    "medication_ease",
    "stranger_reaction",
}

# 26 Canonical Scoring Fields (the only ones that affect Soul Score)
CANONICAL_SCORING_FIELDS: Set[str] = {
    "food_allergies", "health_conditions", "vet_comfort", "life_stage",
    "grooming_tolerance", "noise_sensitivity", "temperament", "energy_level",
    "social_with_dogs", "social_with_people", "behavior_issues",
    "alone_time_comfort", "car_comfort", "travel_readiness", "favorite_spot",
    "morning_routine", "exercise_needs", "feeding_times", "favorite_protein",
    "food_motivation", "training_level", "motivation_type", "primary_bond",
    "other_pets", "kids_at_home", "sleep_preferences"
}

# Alias mapping: UI field → Canonical field (for any naming differences)
UI_TO_CANONICAL_ALIAS: Dict[str, str] = {
    # Add aliases here if UI uses different names than canonical
    # Example: "dog_allergies": "food_allergies"
}


# =============================================================================
# 5. EMERGENCY SUPPRESSION RULES
# =============================================================================
# When safety_level = "emergency", suppress commerce/rewards

EMERGENCY_SUPPRESSION = {
    "suppress": [
        "reward_nudges",
        "shop_ctas",
        "commerce_picks",
        "upsell_prompts",
        "discount_offers",
        "product_recommendations"
    ],
    "allow": [
        "urgent_routing",
        "vet_contact_cta",
        "emergency_resources",
        "safety_instructions"
    ],
    "message_templates": {
        "suppress_notice": "This isn't the time for shopping - let's focus on {pet_name}'s safety.",
        "vet_cta": "Contact your vet immediately or call the emergency pet hotline."
    }
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def count_ui_questions_answered(doggy_soul_answers: Dict) -> int:
    """
    Count how many UI questions have been answered.
    Only counts non-empty values for fields in UI_QUESTION_IDS.
    Used for badge threshold checks.
    """
    if not doggy_soul_answers:
        return 0
    
    count = 0
    for field in UI_QUESTION_IDS:
        value = doggy_soul_answers.get(field)
        # Count if value exists and is non-empty
        if value is not None and value != "" and value != []:
            count += 1
    
    return count


def get_eligible_badges(questions_answered: int, credited_badges: List[str]) -> List[str]:
    """
    Get list of badge IDs that should be credited based on questions answered.
    Excludes already credited badges (idempotent).
    """
    eligible = []
    for threshold, badge_id in BADGE_QUESTION_THRESHOLDS.items():
        if questions_answered >= threshold and badge_id not in credited_badges:
            eligible.append(badge_id)
    return eligible


def calculate_order_points(order_value: float, is_first_order: bool) -> int:
    """
    Calculate points earned from an order.
    - First order: 100 points bonus
    - All orders: 5% of value (floored)
    """
    points = 0
    
    if is_first_order:
        points += PAW_POINTS_RULES["first_order"]["points"]
    
    # 5% of order value, rounded down
    percent_points = int(order_value * PAW_POINTS_RULES["product_purchase"]["points_percent"] / 100)
    points += percent_points
    
    return points


def get_service_booking_points(pillar: str) -> int:
    """Get points for a service booking based on pillar."""
    pillar_points = PAW_POINTS_RULES["service_booking"]["pillar_points"]
    return pillar_points.get(pillar.lower(), 50)  # Default 50 if pillar not found


def is_emergency_suppressed(safety_level: str) -> bool:
    """Check if commerce/rewards should be suppressed."""
    if not safety_level:
        return False
    return safety_level.lower() == "emergency"


def get_tier_for_score(score_percent: float) -> Dict:
    """Get the tier info for a given score percentage."""
    for tier_key, tier_info in SOUL_SCORE_TIERS.items():
        if tier_info["min_percent"] <= score_percent <= tier_info["max_percent"]:
            return {
                "key": tier_key,
                "name": tier_info["name"],
                "emoji": tier_info["emoji"],
                "description": tier_info["description"]
            }
    # Default to curious_pup
    return {
        "key": "curious_pup",
        "name": "Curious Pup",
        "emoji": "🐾",
        "description": "Early understanding"
    }
