"""
Pet Soul Score Configuration
===========================
This module defines the weighted scoring system for Pet Soul.
ALIGNED WITH canonical_answers.py - Single Source of Truth

Total Points: 100
Total Questions: 26 (matching CANONICAL_SCORING_FIELDS)

Scoring Philosophy:
- Health and safety questions weighted higher
- Core identity questions establish baseline
- All questions contribute only ONCE when first answered
- Score never decreases
"""

# Question weights by pillar (total: 100 points)
# ALIGNED WITH CANONICAL_SCORING_FIELDS from canonical_answers.py
PET_SOUL_QUESTIONS = {
    # Safety & Health (36 points, 6 questions)
    "safety_health": {
        "name": "Safety & Health",
        "icon": "🩺",
        "total_points": 36,
        "questions": {
            "food_allergies": {"label": "Food Allergies", "points": 10, "required_level": "core"},
            "health_conditions": {"label": "Health Conditions", "points": 8, "required_level": "core"},
            "vet_comfort": {"label": "Vet Comfort", "points": 5, "required_level": "important"},
            "life_stage": {"label": "Life Stage", "points": 5, "required_level": "core"},
            "grooming_tolerance": {"label": "Grooming Tolerance", "points": 4, "required_level": "important"},
            "noise_sensitivity": {"label": "Noise Sensitivity", "points": 4, "required_level": "important"}
        }
    },
    
    # Personality & Temperament (25 points, 5 questions)
    "personality_temperament": {
        "name": "Personality & Temperament",
        "icon": "🧬",
        "total_points": 25,
        "questions": {
            "temperament": {"label": "Temperament", "points": 8, "required_level": "core"},
            "energy_level": {"label": "Energy Level", "points": 6, "required_level": "core"},
            "social_with_dogs": {"label": "Social with Dogs", "points": 4, "required_level": "important"},
            "social_with_people": {"label": "Social with People", "points": 4, "required_level": "important"},
            "behavior_issues": {"label": "Behavior Issues", "points": 3, "required_level": "important"}
        }
    },
    
    # Lifestyle & Preferences (20 points, 7 questions)
    "lifestyle_preferences": {
        "name": "Lifestyle & Preferences",
        "icon": "🏠",
        "total_points": 20,
        "questions": {
            "alone_time_comfort": {"label": "Alone Time Comfort", "points": 5, "required_level": "important"},
            "car_comfort": {"label": "Car Comfort", "points": 4, "required_level": "important"},
            "travel_readiness": {"label": "Travel Readiness", "points": 3, "required_level": "important"},
            "favorite_spot": {"label": "Favorite Spot", "points": 2, "required_level": "advanced"},
            "morning_routine": {"label": "Morning Routine", "points": 2, "required_level": "advanced"},
            "exercise_needs": {"label": "Exercise Needs", "points": 2, "required_level": "important"},
            "feeding_times": {"label": "Feeding Times", "points": 2, "required_level": "core"}
        }
    },
    
    # Nutrition (9 points, 3 questions)
    "nutrition": {
        "name": "Nutrition",
        "icon": "🍖",
        "total_points": 9,
        "questions": {
            "favorite_protein": {"label": "Favorite Protein", "points": 3, "required_level": "important"},
            "food_motivation": {"label": "Food Motivation", "points": 3, "required_level": "important"},
            "treat_preference": {"label": "Treat Preference", "points": 3, "required_level": "advanced"}
        }
    },
    
    # Training (5 points, 2 questions)
    "training": {
        "name": "Training",
        "icon": "🎓",
        "total_points": 5,
        "questions": {
            "training_level": {"label": "Training Level", "points": 3, "required_level": "important"},
            "motivation_type": {"label": "Motivation Type", "points": 2, "required_level": "important"}
        }
    },
    
    # Relationships (5 points, 3 questions)
    "relationships": {
        "name": "Relationships",
        "icon": "👨‍👩‍👧‍👦",
        "total_points": 5,
        "questions": {
            "primary_bond": {"label": "Primary Bond", "points": 2, "required_level": "important"},
            "other_pets": {"label": "Other Pets", "points": 2, "required_level": "important"},
            "kids_at_home": {"label": "Kids at Home", "points": 1, "required_level": "important"}
        }
    }
}

# Tier thresholds (based on score_percent)
PET_SOUL_TIERS = {
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


def get_tier_for_score(score_percent: int) -> dict:
    """Get the tier info for a given score percentage"""
    for tier_key, tier in PET_SOUL_TIERS.items():
        if tier["min_percent"] <= score_percent <= tier["max_percent"]:
            return {
                "tier_key": tier_key,
                "tier_name": tier["name"],
                "tier_emoji": tier["emoji"],
                "tier_description": tier["description"]
            }
    return {
        "tier_key": "curious_pup",
        "tier_name": "Curious Pup",
        "tier_emoji": "🐾",
        "tier_description": "Early understanding"
    }


def get_next_tier_info(score_percent: int) -> dict:
    """Get info about the next tier and how far away it is"""
    current_tier = get_tier_for_score(score_percent)
    
    tier_order = ["curious_pup", "loyal_companion", "trusted_guardian", "pack_leader"]
    current_idx = tier_order.index(current_tier["tier_key"])
    
    if current_idx >= len(tier_order) - 1:
        return {
            "next_tier_key": None,
            "next_tier_name": None,
            "points_to_next": 0,
            "percent_to_next": 0
        }
    
    next_tier_key = tier_order[current_idx + 1]
    next_tier = PET_SOUL_TIERS[next_tier_key]
    
    return {
        "next_tier_key": next_tier_key,
        "next_tier_name": next_tier["name"],
        "percent_to_next": next_tier["min_percent"] - score_percent,
        "next_tier_at": next_tier["min_percent"]
    }


def calculate_score_state(pet_answers: dict) -> dict:
    """
    Calculate the complete score state for a pet.
    
    Args:
        pet_answers: dict of question_id -> answer value
    
    Returns:
        Complete score_state object with all required fields
    """
    total_points = 0
    earned_points = 0
    total_questions = 0
    answered_count = 0
    section_states = {}
    missing_questions = []
    
    for pillar_key, pillar_data in PET_SOUL_QUESTIONS.items():
        section_total = 0
        section_earned = 0
        section_answered = 0
        section_questions = len(pillar_data["questions"])
        
        for q_id, q_data in pillar_data["questions"].items():
            points = q_data["points"]
            total_points += points
            section_total += points
            total_questions += 1
            
            # Check if question is answered (not empty, not None, not "Unknown")
            answer = pet_answers.get(q_id)
            is_answered = answer and answer not in ['', None, 'Unknown', [], 'unknown']
            
            if is_answered:
                earned_points += points
                section_earned += points
                answered_count += 1
                section_answered += 1
            else:
                missing_questions.append({
                    "question_id": q_id,
                    "label": q_data["label"],
                    "points": points,
                    "pillar": pillar_key,
                    "required_level": q_data["required_level"]
                })
        
        # Calculate section percentage
        section_percent = round((section_earned / section_total) * 100) if section_total > 0 else 0
        
        section_states[pillar_key] = {
            "name": pillar_data["name"],
            "icon": pillar_data["icon"],
            "total_points": section_total,
            "earned_points": section_earned,
            "total_questions": section_questions,
            "answered_count": section_answered,
            "percent": section_percent
        }
    
    # Calculate overall score
    score_percent = round((earned_points / total_points) * 100) if total_points > 0 else 0
    
    # Get tier info
    tier_info = get_tier_for_score(score_percent)
    next_tier_info = get_next_tier_info(score_percent)
    
    # Sort missing questions by points (highest first) and get top 5
    missing_questions.sort(key=lambda x: (-x["points"], x["required_level"] != "core"))
    missing_top_5 = missing_questions[:5]
    
    return {
        "total_points": total_points,
        "earned_points": earned_points,
        "total_questions": total_questions,
        "answered_count": answered_count,
        "score_percent": score_percent,
        "tier_key": tier_info["tier_key"],
        "tier_name": tier_info["tier_name"],
        "tier_emoji": tier_info["tier_emoji"],
        "tier_description": tier_info["tier_description"],
        "next_tier_key": next_tier_info["next_tier_key"],
        "next_tier_name": next_tier_info["next_tier_name"],
        "next_tier_at": next_tier_info.get("next_tier_at"),
        "percent_to_next": next_tier_info["percent_to_next"],
        "sections": section_states,
        "missing_top_5": missing_top_5
    }
