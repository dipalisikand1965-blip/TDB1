"""
Pet Soul Score Configuration
===========================
This module defines the weighted scoring system for Pet Soul.

Total Points: 100
Total Questions: 27

Scoring Philosophy:
- Health and safety questions weighted higher
- Core identity questions establish baseline
- All questions contribute only ONCE when first answered
- Score never decreases
"""

# Question weights by pillar (total: 100 points)
PET_SOUL_QUESTIONS = {
    # Identity & Temperament (10 points, 2 questions)
    "identity_temperament": {
        "name": "Identity & Temperament",
        "icon": "🧬",
        "total_points": 10,
        "questions": {
            "temperament": {"label": "Temperament", "points": 5, "required_level": "core"},
            "energy_level": {"label": "Energy Level", "points": 5, "required_level": "core"}
        }
    },
    
    # Family & Pack (15 points, 5 questions)
    "family_pack": {
        "name": "Family & Pack",
        "icon": "👨‍👩‍👧‍👦",
        "total_points": 15,
        "questions": {
            "social_with_dogs": {"label": "Social with Dogs", "points": 3, "required_level": "important"},
            "social_with_people": {"label": "Social with People", "points": 3, "required_level": "important"},
            "primary_bond": {"label": "Most Attached To", "points": 3, "required_level": "important"},
            "other_pets": {"label": "Other Pets", "points": 3, "required_level": "important"},
            "kids_at_home": {"label": "Kids at Home", "points": 3, "required_level": "important"}
        }
    },
    
    # Rhythm & Routine (12 points, 3 questions)
    "rhythm_routine": {
        "name": "Rhythm & Routine",
        "icon": "⏰",
        "total_points": 12,
        "questions": {
            "morning_routine": {"label": "Morning Routine", "points": 4, "required_level": "important"},
            "feeding_times": {"label": "Feeding Schedule", "points": 4, "required_level": "core"},
            "exercise_needs": {"label": "Exercise Needs", "points": 4, "required_level": "important"}
        }
    },
    
    # Home Comforts (14 points, 4 questions)
    "home_comforts": {
        "name": "Home Comforts",
        "icon": "🏡",
        "total_points": 14,
        "questions": {
            "favorite_spot": {"label": "Favorite Spot", "points": 3, "required_level": "advanced"},
            "alone_time_comfort": {"label": "Alone Time", "points": 4, "required_level": "important"},
            "noise_sensitivity": {"label": "Noise Sensitivity", "points": 4, "required_level": "important"},
            "favorite_toy_type": {"label": "Favorite Toys", "points": 3, "required_level": "advanced"}
        }
    },
    
    # Travel Style (8 points, 2 questions)
    "travel_style": {
        "name": "Travel Style",
        "icon": "🚗",
        "total_points": 8,
        "questions": {
            "car_comfort": {"label": "Car Rides", "points": 4, "required_level": "important"},
            "travel_readiness": {"label": "Travel Readiness", "points": 4, "required_level": "important"}
        }
    },
    
    # Taste & Treat (14 points, 4 questions)
    "taste_treat": {
        "name": "Taste & Treat",
        "icon": "🍽",
        "total_points": 14,
        "questions": {
            "food_motivation": {"label": "Food Motivation", "points": 3, "required_level": "important"},
            "favorite_protein": {"label": "Favorite Protein", "points": 3, "required_level": "important"},
            "treat_preference": {"label": "Treat Preference", "points": 3, "required_level": "advanced"},
            "food_allergies": {"label": "Food Allergies", "points": 5, "required_level": "core"}  # Safety - weighted higher
        }
    },
    
    # Training & Behaviour (12 points, 3 questions)
    "training_behaviour": {
        "name": "Training & Behaviour",
        "icon": "🎓",
        "total_points": 12,
        "questions": {
            "training_level": {"label": "Training Level", "points": 4, "required_level": "important"},
            "motivation_type": {"label": "Training Motivation", "points": 4, "required_level": "important"},
            "behavior_issues": {"label": "Behavior Issues", "points": 4, "required_level": "important"}
        }
    },
    
    # Long Horizon - Health (15 points, 4 questions)
    "long_horizon": {
        "name": "Long Horizon (Health)",
        "icon": "🩺",
        "total_points": 15,
        "questions": {
            "health_conditions": {"label": "Health Conditions", "points": 5, "required_level": "core"},  # Safety - weighted higher
            "vet_comfort": {"label": "Vet Comfort", "points": 4, "required_level": "important"},
            "grooming_tolerance": {"label": "Grooming Tolerance", "points": 3, "required_level": "important"},
            "life_stage": {"label": "Life Stage", "points": 3, "required_level": "core"}
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
