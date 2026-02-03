"""
Pet Soul Score Logic - Server-Side Configuration
=================================================
The SINGLE SOURCE OF TRUTH for Pet Soul Score calculation.

This module defines:
1. Weighted question configuration for all 27 questions
2. Score calculation algorithm
3. Tier thresholds and benefits
4. The /pet/{id}/score_state API endpoint

Core Principles (from User Doctrine):
- Pet Soul Score measures PROFILE COMPLETENESS and CARE CONTEXT
- It is NOT a reward/discount system - that's Paw Rewards
- Score unlocks PERSONALIZATION, not monetary benefits
- All calculations happen SERVER-SIDE only
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Create router
pet_score_router = APIRouter(prefix="/pet-score", tags=["Pet Score"])

# Database reference (set by main server)
db = None

def set_pet_score_db(database):
    global db
    db = database


# ==================== WEIGHTED QUESTION CONFIGURATION ====================
# Total points: 100 (distributed across all questions based on importance)

PET_SCORE_RULES = {
    # ============ SAFETY & HEALTH (35 points total) ============
    # These are critical for personalized recommendations
    "food_allergies": {
        "weight": 10,
        "category": "safety",
        "label": "Food Allergies",
        "icon": "🍖",
        "why_important": "Critical for safe product recommendations",
        "tier_required": None,  # Required for all tiers
    },
    "health_conditions": {
        "weight": 8,
        "category": "safety",
        "label": "Health Conditions",
        "icon": "💊",
        "why_important": "Ensures appropriate service recommendations",
        "tier_required": None,
    },
    "vet_comfort": {
        "weight": 5,
        "category": "safety",
        "label": "Vet Comfort Level",
        "icon": "🏥",
        "why_important": "Helps prepare for care appointments",
        "tier_required": None,
    },
    "life_stage": {
        "weight": 5,
        "category": "safety",
        "label": "Life Stage",
        "icon": "📅",
        "why_important": "Age-appropriate recommendations",
        "tier_required": None,
    },
    "grooming_tolerance": {
        "weight": 4,
        "category": "safety",
        "label": "Grooming Tolerance",
        "icon": "✂️",
        "why_important": "Better grooming experiences",
        "tier_required": None,
    },
    "noise_sensitivity": {
        "weight": 3,
        "category": "safety",
        "label": "Noise Sensitivity",
        "icon": "🔊",
        "why_important": "Important for stay & travel planning",
        "tier_required": "soul_seeker",
    },
    
    # ============ PERSONALITY & TEMPERAMENT (25 points total) ============
    # Essential for understanding the pet's character
    "temperament": {
        "weight": 8,
        "category": "personality",
        "label": "Basic Temperament",
        "icon": "🎭",
        "why_important": "Core personality understanding",
        "tier_required": None,
    },
    "energy_level": {
        "weight": 6,
        "category": "personality",
        "label": "Energy Level",
        "icon": "⚡",
        "why_important": "Activity and product matching",
        "tier_required": None,
    },
    "social_with_dogs": {
        "weight": 4,
        "category": "personality",
        "label": "Social with Dogs",
        "icon": "🐕",
        "why_important": "Important for daycare and play dates",
        "tier_required": "soul_seeker",
    },
    "social_with_people": {
        "weight": 4,
        "category": "personality",
        "label": "Social with People",
        "icon": "👥",
        "why_important": "Service provider preparation",
        "tier_required": "soul_seeker",
    },
    "behavior_issues": {
        "weight": 3,
        "category": "personality",
        "label": "Behavior Issues",
        "icon": "⚠️",
        "why_important": "Helps match with right trainers",
        "tier_required": "soul_seeker",
    },
    
    # ============ LIFESTYLE & PREFERENCES (20 points total) ============
    # Helps personalize services
    "alone_time_comfort": {
        "weight": 5,
        "category": "lifestyle",
        "label": "Alone Time Comfort",
        "icon": "🏠",
        "why_important": "Stay and boarding planning",
        "tier_required": None,
    },
    "car_comfort": {
        "weight": 4,
        "category": "lifestyle",
        "label": "Car Ride Comfort",
        "icon": "🚗",
        "why_important": "Travel service planning",
        "tier_required": "soul_seeker",
    },
    "travel_readiness": {
        "weight": 3,
        "category": "lifestyle",
        "label": "Travel Readiness",
        "icon": "✈️",
        "why_important": "Adventure planning",
        "tier_required": "soul_explorer",
    },
    "favorite_spot": {
        "weight": 2,
        "category": "lifestyle",
        "label": "Favorite Spot",
        "icon": "🛋️",
        "why_important": "Comfort understanding",
        "tier_required": "soul_explorer",
    },
    "morning_routine": {
        "weight": 2,
        "category": "lifestyle",
        "label": "Morning Routine",
        "icon": "🌅",
        "why_important": "Scheduling optimization",
        "tier_required": "soul_explorer",
    },
    "exercise_needs": {
        "weight": 2,
        "category": "lifestyle",
        "label": "Exercise Needs",
        "icon": "🏃",
        "why_important": "Activity planning",
        "tier_required": "soul_seeker",
    },
    "feeding_times": {
        "weight": 2,
        "category": "lifestyle",
        "label": "Feeding Schedule",
        "icon": "🕐",
        "why_important": "Stay planning",
        "tier_required": "soul_explorer",
    },
    
    # ============ FOOD & NUTRITION (10 points total) ============
    "favorite_protein": {
        "weight": 3,
        "category": "nutrition",
        "label": "Favorite Protein",
        "icon": "🥩",
        "why_important": "Food personalization",
        "tier_required": None,
    },
    "food_motivation": {
        "weight": 3,
        "category": "nutrition",
        "label": "Food Motivation",
        "icon": "🎯",
        "why_important": "Training approach",
        "tier_required": "soul_seeker",
    },
    "treat_preference": {
        "weight": 2,
        "category": "nutrition",
        "label": "Treat Preference",
        "icon": "🦴",
        "why_important": "Treat selection",
        "tier_required": "soul_seeker",
    },
    
    # ============ TRAINING & DEVELOPMENT (5 points total) ============
    "training_level": {
        "weight": 3,
        "category": "training",
        "label": "Training Level",
        "icon": "🎓",
        "why_important": "Service matching",
        "tier_required": None,
    },
    "motivation_type": {
        "weight": 2,
        "category": "training",
        "label": "Training Motivation",
        "icon": "🏆",
        "why_important": "Training effectiveness",
        "tier_required": "soul_seeker",
    },
    
    # ============ RELATIONSHIPS (5 points total) ============
    "primary_bond": {
        "weight": 2,
        "category": "relationships",
        "label": "Primary Bond",
        "icon": "❤️",
        "why_important": "Family understanding",
        "tier_required": "soul_explorer",
    },
    "other_pets": {
        "weight": 2,
        "category": "relationships",
        "label": "Other Pets",
        "icon": "🐾",
        "why_important": "Household dynamics",
        "tier_required": "soul_explorer",
    },
    "kids_at_home": {
        "weight": 1,
        "category": "relationships",
        "label": "Kids at Home",
        "icon": "👶",
        "why_important": "Safety considerations",
        "tier_required": "soul_explorer",
    },
    
    # ============ BONUS: TOYS & ENRICHMENT ============
    "favorite_toy_type": {
        "weight": 0,  # Bonus question, doesn't count toward 100
        "category": "enrichment",
        "label": "Favorite Toys",
        "icon": "🎾",
        "why_important": "Gift and play recommendations",
        "tier_required": "soul_explorer",
    },
}


# ==================== TIER CONFIGURATION ====================
# Tiers based on completion percentage

SCORE_TIERS = {
    "newcomer": {
        "min_score": 0,
        "max_score": 24,
        "name": "Newcomer",
        "emoji": "🌱",
        "color": "gray",
        "benefits": [
            "Basic Mira AI assistance",
            "Product browsing",
        ],
        "unlock_message": "Just getting started!"
    },
    "soul_seeker": {
        "min_score": 25,
        "max_score": 49,
        "name": "Soul Seeker",
        "emoji": "🔍",
        "color": "blue",
        "benefits": [
            "Personalized product suggestions",
            "Basic health reminders",
            "Mira remembers preferences"
        ],
        "unlock_message": "Now I'm getting to know your pet!"
    },
    "soul_explorer": {
        "min_score": 50,
        "max_score": 74,
        "name": "Soul Explorer",
        "emoji": "🗺️",
        "color": "purple",
        "benefits": [
            "Smart safety alerts during checkout",
            "Pillar-specific recommendations",
            "Priority Mira responses",
            "Personalized celebration reminders"
        ],
        "unlock_message": "We understand your pet's world!"
    },
    "soul_master": {
        "min_score": 75,
        "max_score": 100,
        "name": "Soul Master",
        "emoji": "✨",
        "color": "gold",
        "benefits": [
            "AI-powered care insights",
            "Proactive health recommendations",
            "VIP concierge experience",
            "Cross-pillar intelligence",
            "Predictive needs suggestions"
        ],
        "unlock_message": "You've unlocked the deepest level of pet understanding!"
    }
}


# ==================== CATEGORY CONFIGURATION ====================

SCORE_CATEGORIES = {
    "safety": {
        "name": "Safety & Health",
        "icon": "🛡️",
        "color": "red",
        "max_points": 35,
        "description": "Critical information for keeping your pet safe"
    },
    "personality": {
        "name": "Personality",
        "icon": "🎭",
        "color": "purple",
        "max_points": 25,
        "description": "Understanding their unique character"
    },
    "lifestyle": {
        "name": "Lifestyle",
        "icon": "🏠",
        "color": "blue",
        "max_points": 20,
        "description": "Daily routines and preferences"
    },
    "nutrition": {
        "name": "Nutrition",
        "icon": "🍖",
        "color": "orange",
        "max_points": 10,
        "description": "Food preferences and needs"
    },
    "training": {
        "name": "Training",
        "icon": "🎓",
        "color": "green",
        "max_points": 5,
        "description": "Learning style and capabilities"
    },
    "relationships": {
        "name": "Relationships",
        "icon": "❤️",
        "color": "pink",
        "max_points": 5,
        "description": "Family and social connections"
    },
}


# ==================== SCORE CALCULATION ====================

def calculate_pet_soul_score(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate the Pet Soul Score from answers.
    
    Returns:
        {
            "total_score": float (0-100),
            "category_scores": {category: {score, max, percentage}},
            "answered_count": int,
            "total_questions": int,
            "tier": tier_info,
            "next_tier": next_tier_info or None,
            "missing_high_impact": [question_ids],
            "completion_by_category": {category: percentage}
        }
    """
    # Alias mapping: old question IDs -> new question IDs
    QUESTION_ALIASES = {
        'general_nature': 'temperament',
        'describe_3_words': 'temperament',
        'stranger_reaction': 'social_with_people',
        'handling_comfort': 'touch_sensitivity',
        'loud_sounds': 'noise_sensitivity',
        'play_style': 'exercise_preferences',
        'favorite_activity': 'exercise_preferences',
        'fetch_interest': 'toy_preferences',
        'preferred_treats': 'favorite_treats',
        'water_comfort': 'swimming_ability',
        'leash_behavior': 'leash_manners',
        'dob': 'life_stage',
        'birth_date': 'life_stage',
        'age': 'life_stage',
    }
    
    # Normalize answers by applying aliases
    normalized_answers = {}
    for key, value in answers.items():
        # Skip if empty
        if not value or value in ['', [], None, 'Unknown']:
            continue
        
        # Use alias if exists, otherwise use original key
        normalized_key = QUESTION_ALIASES.get(key, key)
        
        # If key already has a value, don't overwrite with alias
        if normalized_key not in normalized_answers:
            normalized_answers[normalized_key] = value
        
        # Also keep original key if it's in the scoring rules
        if key in PET_SCORE_RULES:
            normalized_answers[key] = value
    
    total_earned = 0
    total_possible = 0
    category_earned = {cat: 0 for cat in SCORE_CATEGORIES}
    category_possible = {cat: 0 for cat in SCORE_CATEGORIES}
    answered_questions = []
    missing_high_impact = []
    
    for question_id, config in PET_SCORE_RULES.items():
        weight = config["weight"]
        category = config["category"]
        
        # Skip bonus questions (weight = 0) from total
        if weight == 0:
            continue
            
        total_possible += weight
        category_possible[category] = category_possible.get(category, 0) + weight
        
        # Check if answered (using normalized answers)
        answer = normalized_answers.get(question_id)
        is_answered = answer is not None and answer != "" and answer != []
        
        if is_answered:
            total_earned += weight
            category_earned[category] = category_earned.get(category, 0) + weight
            answered_questions.append(question_id)
        else:
            # Track high-impact missing questions (weight >= 5)
            if weight >= 5:
                missing_high_impact.append({
                    "id": question_id,
                    "label": config["label"],
                    "icon": config["icon"],
                    "weight": weight,
                    "why_important": config["why_important"],
                    "category": category
                })
    
    # Calculate percentage score
    total_score = round((total_earned / total_possible) * 100, 1) if total_possible > 0 else 0
    
    # Calculate category scores
    category_scores = {}
    for cat, earned in category_earned.items():
        possible = category_possible.get(cat, 0)
        percentage = round((earned / possible) * 100, 1) if possible > 0 else 0
        category_scores[cat] = {
            "earned": earned,
            "possible": possible,
            "percentage": percentage,
            "name": SCORE_CATEGORIES.get(cat, {}).get("name", cat),
            "icon": SCORE_CATEGORIES.get(cat, {}).get("icon", "📊"),
            "color": SCORE_CATEGORIES.get(cat, {}).get("color", "gray")
        }
    
    # Determine current tier
    current_tier = None
    current_tier_key = None
    for tier_key, tier_info in SCORE_TIERS.items():
        if tier_info["min_score"] <= total_score <= tier_info["max_score"]:
            current_tier = tier_info
            current_tier_key = tier_key
            break
    
    # Determine next tier
    next_tier = None
    next_tier_key = None
    tier_order = ["newcomer", "soul_seeker", "soul_explorer", "soul_master"]
    if current_tier_key:
        current_idx = tier_order.index(current_tier_key)
        if current_idx < len(tier_order) - 1:
            next_tier_key = tier_order[current_idx + 1]
            next_tier = SCORE_TIERS[next_tier_key]
    
    # Sort missing high impact by weight
    missing_high_impact.sort(key=lambda x: x["weight"], reverse=True)
    
    return {
        "total_score": total_score,
        "total_earned": total_earned,
        "total_possible": total_possible,
        "category_scores": category_scores,
        "answered_count": len(answered_questions),
        "total_questions": len([q for q, c in PET_SCORE_RULES.items() if c["weight"] > 0]),
        "tier": {
            "key": current_tier_key,
            **current_tier
        } if current_tier else None,
        "next_tier": {
            "key": next_tier_key,
            "points_needed": next_tier["min_score"] - total_score if next_tier else 0,
            **next_tier
        } if next_tier else None,
        "missing_high_impact": missing_high_impact[:5],  # Top 5 most impactful
    }


def get_next_recommended_question(answers: Dict[str, Any], current_tier: str = None) -> Optional[Dict]:
    """
    Get the next recommended question to answer based on:
    1. Highest weight unanswered questions first
    2. Questions appropriate for current tier
    """
    unanswered = []
    
    for question_id, config in PET_SCORE_RULES.items():
        answer = answers.get(question_id)
        is_answered = answer is not None and answer != "" and answer != []
        
        if not is_answered and config["weight"] > 0:
            # Check tier requirement
            tier_required = config.get("tier_required")
            tier_order = [None, "soul_seeker", "soul_explorer", "soul_master"]
            
            # Always allow questions with no tier requirement
            if tier_required is None or current_tier is None:
                unanswered.append({
                    "id": question_id,
                    **config
                })
            elif current_tier in tier_order:
                current_idx = tier_order.index(current_tier) if current_tier in tier_order else 0
                required_idx = tier_order.index(tier_required) if tier_required in tier_order else 0
                if current_idx >= required_idx:
                    unanswered.append({
                        "id": question_id,
                        **config
                    })
    
    # Sort by weight (highest first)
    unanswered.sort(key=lambda x: x["weight"], reverse=True)
    
    return unanswered[0] if unanswered else None


# ==================== API ENDPOINTS ====================

@pet_score_router.get("/{pet_id}/score_state")
async def get_pet_score_state(pet_id: str):
    """
    Get the complete score state for a pet.
    This is the SINGLE SOURCE OF TRUTH for all Pet Soul Score data.
    
    Frontend should call this endpoint and use the returned data directly.
    Never calculate scores client-side.
    """
    # Fetch pet from database
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Get answers
    answers = pet.get("doggy_soul_answers", {})
    
    # Calculate score
    score_data = calculate_pet_soul_score(answers)
    
    # Get next recommended question
    current_tier_key = score_data["tier"]["key"] if score_data["tier"] else None
    next_question = get_next_recommended_question(answers, current_tier_key)
    
    # Build response
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name", "Unknown"),
        "score": score_data["total_score"],
        "score_earned": score_data["total_earned"],
        "score_possible": score_data["total_possible"],
        "tier": score_data["tier"],
        "next_tier": score_data["next_tier"],
        "categories": score_data["category_scores"],
        "stats": {
            "answered": score_data["answered_count"],
            "total": score_data["total_questions"],
            "completion_percentage": round((score_data["answered_count"] / score_data["total_questions"]) * 100, 1) if score_data["total_questions"] > 0 else 0
        },
        "recommendations": {
            "next_question": next_question,
            "high_impact_missing": score_data["missing_high_impact"]
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@pet_score_router.get("/config")
async def get_score_config():
    """
    Get the complete scoring configuration.
    Useful for building admin dashboards or debugging.
    """
    return {
        "questions": PET_SCORE_RULES,
        "tiers": SCORE_TIERS,
        "categories": SCORE_CATEGORIES,
        "total_questions": len([q for q, c in PET_SCORE_RULES.items() if c["weight"] > 0]),
        "max_score": sum(c["weight"] for c in PET_SCORE_RULES.values())
    }


@pet_score_router.get("/tiers")
async def get_score_tiers():
    """Get all tier definitions with benefits"""
    return {
        "tiers": SCORE_TIERS,
        "tier_order": ["newcomer", "soul_seeker", "soul_explorer", "soul_master"]
    }


@pet_score_router.post("/{pet_id}/recalculate")
async def recalculate_pet_score(pet_id: str):
    """
    Recalculate and update the stored score for a pet.
    Call this after bulk answer updates.
    """
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    answers = pet.get("doggy_soul_answers", {})
    score_data = calculate_pet_soul_score(answers)
    
    # Update stored score
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "overall_score": score_data["total_score"],
            "score_tier": score_data["tier"]["key"] if score_data["tier"] else "newcomer",
            "category_scores": {
                cat: data["percentage"] 
                for cat, data in score_data["category_scores"].items()
            },
            "score_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "pet_id": pet_id,
        "new_score": score_data["total_score"],
        "tier": score_data["tier"]["key"] if score_data["tier"] else "newcomer"
    }


@pet_score_router.get("/{pet_id}/quick-questions")
async def get_quick_questions(pet_id: str, limit: int = 5):
    """
    Get a list of quick, high-impact questions to boost the score.
    Perfect for inline question widgets.
    """
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    answers = pet.get("doggy_soul_answers", {})
    score_data = calculate_pet_soul_score(answers)
    
    # Get unanswered questions sorted by weight
    current_tier = score_data["tier"]["key"] if score_data["tier"] else None
    quick_questions = []
    
    for question_id, config in PET_SCORE_RULES.items():
        answer = answers.get(question_id)
        is_answered = answer is not None and answer != "" and answer != []
        
        if not is_answered and config["weight"] >= 3:  # Focus on impactful questions
            quick_questions.append({
                "id": question_id,
                "label": config["label"],
                "icon": config["icon"],
                "weight": config["weight"],
                "category": config["category"],
                "why_important": config["why_important"],
                "points_value": f"+{config['weight']}pts"
            })
    
    # Sort by weight and take top N
    quick_questions.sort(key=lambda x: x["weight"], reverse=True)
    
    return {
        "questions": quick_questions[:limit],
        "current_score": score_data["total_score"],
        "potential_boost": sum(q["weight"] for q in quick_questions[:limit])
    }
