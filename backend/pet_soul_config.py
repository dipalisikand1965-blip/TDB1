"""
Pet Soul Score Configuration - UNIFIED 8 GOLDEN PILLARS
========================================================
This module defines the weighted scoring system for Pet Soul.
ALIGNED WITH pet_soul_routes.py DOGGY_SOUL_QUESTIONS - Single Source of Truth

Total Points: 100
Total Questions: 40 (expanded from 26 to cover all 8 pillars)

The 8 Golden Pillars:
1. Identity & Temperament (🎭) - Who your dog is at their core
2. Family & Pack (👨‍👩‍👧‍👦) - Social world and relationships  
3. Rhythm & Routine (⏰) - Daily life patterns
4. Home Comforts (🏠) - Safety and happiness
5. Travel Style (✈️) - Adventure preferences
6. Taste & Treat (🍖) - Food personality
7. Training & Behaviour (🎓) - Learning style
8. Long Horizon (🌅) - Health and dreams

Scoring Philosophy:
- Health and safety questions weighted higher
- Core identity questions establish baseline
- All 8 pillars contribute to total score
- Score reflects how well Mira "knows" the pet
- Score never decreases
"""

# Question weights by pillar (total: 100 points)
# Maps question IDs from pet_soul_routes.py DOGGY_SOUL_QUESTIONS
PET_SOUL_QUESTIONS = {
    # 1. Identity & Temperament (15 points, 5 key questions)
    "identity_temperament": {
        "name": "Identity & Temperament",
        "icon": "🎭",
        "total_points": 15,
        "questions": {
            "general_nature": {"label": "General Nature", "points": 4, "required_level": "core"},
            "temperament": {"label": "Temperament", "points": 3, "required_level": "core"},
            "life_stage": {"label": "Life Stage", "points": 3, "required_level": "core"},
            "loud_sounds": {"label": "Noise Sensitivity", "points": 3, "required_level": "important"},
            "handling_comfort": {"label": "Handling Comfort", "points": 2, "required_level": "important"}
        }
    },
    
    # 2. Family & Pack / Social World (12 points, 5 questions)
    "family_pack": {
        "name": "Family & Pack",
        "icon": "👨‍👩‍👧‍👦",
        "total_points": 12,
        "questions": {
            "lives_with": {"label": "Lives With", "points": 3, "required_level": "core"},
            "kids_at_home": {"label": "Kids at Home", "points": 2, "required_level": "important"},
            "other_pets": {"label": "Other Pets", "points": 2, "required_level": "important"},
            "behavior_with_dogs": {"label": "Social with Dogs", "points": 3, "required_level": "important"},
            "most_attached_to": {"label": "Primary Bond", "points": 2, "required_level": "advanced"}
        }
    },
    
    # 3. Rhythm & Routine (14 points, 6 questions) - CRITICAL FOR DAILY LIFE
    "rhythm_routine": {
        "name": "Rhythm & Routine",
        "icon": "⏰",
        "total_points": 14,
        "questions": {
            "feeding_times": {"label": "Feeding Times", "points": 2, "required_level": "core"},
            "exercise_needs": {"label": "Exercise Needs", "points": 3, "required_level": "core"},
            "walks_per_day": {"label": "Walks Per Day", "points": 2, "required_level": "important"},
            "alone_comfort": {"label": "Alone Time Comfort", "points": 3, "required_level": "important"},
            "separation_anxiety": {"label": "Separation Anxiety", "points": 3, "required_level": "core"},
            "sleep_location": {"label": "Sleep Location", "points": 1, "required_level": "advanced"}
        }
    },
    
    # 4. Home Comforts (8 points, 4 questions)
    "home_comforts": {
        "name": "Home Comforts",
        "icon": "🏠",
        "total_points": 8,
        "questions": {
            "favorite_spot": {"label": "Favorite Spot", "points": 2, "required_level": "advanced"},
            "crate_trained": {"label": "Crate Trained", "points": 2, "required_level": "important"},
            "car_rides": {"label": "Car Comfort", "points": 3, "required_level": "important"},
            "space_preference": {"label": "Space Preference", "points": 1, "required_level": "advanced"}
        }
    },
    
    # 5. Travel Style / Adventure (10 points, 4 questions) - NEW PILLAR
    "travel_style": {
        "name": "Travel Style",
        "icon": "✈️",
        "total_points": 10,
        "questions": {
            "usual_travel": {"label": "Travel Mode", "points": 3, "required_level": "important"},
            "hotel_experience": {"label": "Hotel Experience", "points": 3, "required_level": "important"},
            "stay_preference": {"label": "Stay Preference", "points": 2, "required_level": "advanced"},
            "travel_social": {"label": "Travel Social", "points": 2, "required_level": "advanced"}
        }
    },
    
    # 6. Taste & Treat World (14 points, 5 questions) - NUTRITION CRITICAL
    "taste_treat": {
        "name": "Taste & Treat",
        "icon": "🍖",
        "total_points": 14,
        "questions": {
            "food_allergies": {"label": "Food Allergies", "points": 5, "required_level": "core"},
            "food_motivation": {"label": "Food Motivation", "points": 2, "required_level": "important"},
            "favorite_protein": {"label": "Favorite Protein", "points": 2, "required_level": "important"},
            "treat_preference": {"label": "Treat Preference", "points": 2, "required_level": "advanced"},
            "sensitive_stomach": {"label": "Sensitive Stomach", "points": 3, "required_level": "important"}
        }
    },
    
    # 7. Training & Behaviour (10 points, 4 questions)
    "training_behaviour": {
        "name": "Training & Behaviour",
        "icon": "🎓",
        "total_points": 10,
        "questions": {
            "training_level": {"label": "Training Level", "points": 3, "required_level": "important"},
            "motivation_type": {"label": "Motivation Type", "points": 2, "required_level": "important"},
            "behavior_issues": {"label": "Behavior Issues", "points": 3, "required_level": "important"},
            "leash_behavior": {"label": "Leash Behavior", "points": 2, "required_level": "advanced"}
        }
    },
    
    # 8. Long Horizon / Health (17 points, 6 questions) - HEALTH IS CRITICAL
    "long_horizon": {
        "name": "Long Horizon (Health)",
        "icon": "🌅",
        "total_points": 17,
        "questions": {
            "health_conditions": {"label": "Health Conditions", "points": 5, "required_level": "core"},
            "vet_comfort": {"label": "Vet Comfort", "points": 3, "required_level": "important"},
            "grooming_tolerance": {"label": "Grooming Tolerance", "points": 3, "required_level": "important"},
            "vaccination_status": {"label": "Vaccination Status", "points": 3, "required_level": "core"},
            "main_wish": {"label": "Main Wish", "points": 1, "required_level": "advanced"},
            "celebration_preferences": {"label": "Celebration Preferences", "points": 2, "required_level": "advanced"}
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
        "max_percent": 89,
        "description": "Deep understanding - bespoke concierge experience"
    },
    "soul_master": {
        "name": "Soul Master",
        "emoji": "✨",
        "min_percent": 90,
        "max_percent": 100,
        "description": "Mira knows this pet better than anyone - true soul connection"
    }
}

# Export pillar keys for iteration
PILLAR_KEYS = list(PET_SOUL_QUESTIONS.keys())


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
    
    tier_order = ["curious_pup", "loyal_companion", "trusted_guardian", "pack_leader", "soul_master"]
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
    Calculate the complete score state for a pet based on 8 Golden Pillars.
    
    Args:
        pet_answers: dict of question_id -> answer value (from doggy_soul_answers)
    
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
            is_answered = answer and answer not in ['', None, 'Unknown', [], 'unknown', 'None', 'none']
            
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
                    "pillar_name": pillar_data["name"],
                    "pillar_icon": pillar_data["icon"],
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
    
    # Sort missing questions by points (highest first) and core level priority
    missing_questions.sort(key=lambda x: (-x["points"], x["required_level"] != "core"))
    missing_top_5 = missing_questions[:5]
    
    # Calculate pillar completion for radar chart
    pillar_completion = {
        pillar_key: section_states[pillar_key]["percent"]
        for pillar_key in PILLAR_KEYS
    }
    
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
        "pillar_completion": pillar_completion,
        "missing_top_5": missing_top_5,
        "pillars_count": len(PILLAR_KEYS),
        "pillars": PILLAR_KEYS
    }


def get_pillar_summary(pet_answers: dict) -> list:
    """
    Get a summary of all 8 pillars for display.
    Returns list of pillar summaries sorted by completion.
    """
    summaries = []
    
    for pillar_key, pillar_data in PET_SOUL_QUESTIONS.items():
        total = 0
        earned = 0
        answered = 0
        
        for q_id, q_data in pillar_data["questions"].items():
            total += q_data["points"]
            answer = pet_answers.get(q_id)
            if answer and answer not in ['', None, 'Unknown', [], 'unknown']:
                earned += q_data["points"]
                answered += 1
        
        percent = round((earned / total) * 100) if total > 0 else 0
        
        summaries.append({
            "pillar_key": pillar_key,
            "name": pillar_data["name"],
            "icon": pillar_data["icon"],
            "percent": percent,
            "answered": answered,
            "total_questions": len(pillar_data["questions"]),
            "status": "complete" if percent >= 80 else "partial" if percent >= 40 else "empty"
        })
    
    # Sort by percent (lowest first to prioritize gaps)
    summaries.sort(key=lambda x: x["percent"])
    
    return summaries
