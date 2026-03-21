"""
Intelligence Depth Score Calculator - MIRA OS CORE
===================================================

DOCTRINE: Soul Score Must Be Real Intelligence Depth

The score must reflect:
- Completeness of knowledge
- Behavioural understanding depth
- Predictive accuracy
- Observation richness
- NOT just form completion

Formula:
Intelligence Score = (
    Base Soul Score (40%) +
    Conversation Learning Score (30%) +
    Confidence Depth Score (20%) +
    Recency Bonus (10%)
)

Tiers:
- 0-20: Curious Pup - Just getting to know each other
- 21-40: Growing Bond - Building understanding
- 41-60: Trusted Guardian - Solid knowledge base
- 61-80: Deep Connection - Rich behavioral model
- 81-100: Soulmate - Complete cognitive model
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

# Intelligence tier definitions
INTELLIGENCE_TIERS = {
    "curious_pup": {"min": 0, "max": 20, "label": "Curious Pup", "description": "Just getting to know each other", "emoji": "🐕"},
    "growing_bond": {"min": 21, "max": 40, "label": "Growing Bond", "description": "Building understanding", "emoji": "🐾"},
    "trusted_guardian": {"min": 41, "max": 60, "label": "Trusted Guardian", "description": "Solid knowledge base", "emoji": "🛡️"},
    "deep_connection": {"min": 61, "max": 80, "label": "Deep Connection", "description": "Rich behavioral model", "emoji": "💜"},
    "soulmate": {"min": 81, "max": 100, "label": "Soulmate", "description": "Complete cognitive model", "emoji": "✨"}
}

# Soul question weights by category
SOUL_QUESTION_WEIGHTS = {
    # Core Identity (essential)
    "name": 3, "breed": 3, "birth_date": 3, "weight": 2, "gender": 2,
    
    # Health (critical for safety)
    "health_conditions": 5, "food_allergies": 5, "medications": 4,
    "last_vet_visit": 3, "vaccination_status": 4,
    
    # Behavior (key for personalization)
    "temperament": 4, "energy_level": 4, "anxiety_triggers": 5,
    "separation_anxiety": 4, "behavior_with_dogs": 3, "behavior_with_strangers": 3,
    
    # Preferences (improves recommendations)
    "favorite_treats": 3, "favorite_toys": 2, "favorite_activities": 3,
    "sleep_preferences": 2, "play_style": 2,
    
    # Lifestyle (context)
    "daily_routine": 3, "exercise_frequency": 3, "diet_type": 3,
    "feeding_schedule": 2, "walk_preferences": 2,
    
    # Environment
    "living_situation": 2, "household_members": 2, "other_pets": 2,
}

MAX_BASE_SCORE = sum(SOUL_QUESTION_WEIGHTS.values())


async def calculate_intelligence_score(db, pet_id: str) -> Dict:
    """
    Calculate comprehensive intelligence depth score.
    
    This is the TRUE measure of how well Mira knows a pet.
    """
    try:
        # Get pet data
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            return {"total_score": 0, "tier": "curious_pup", "error": "Pet not found"}
        
        # ═══════════════════════════════════════════════════════════════════════
        # CRITICAL: Conversation memories exist in TWO places (do not remove either!)
        # 1. conversation_memories COLLECTION - structured extraction pipeline
        # 2. pet.conversation_memories ARRAY - inline storage from chat endpoint
        # Both must be checked for accurate intelligence scoring.
        # Fix date: Feb 12, 2026 | Issue: Score was too low, missing inline data
        # ═══════════════════════════════════════════════════════════════════════
        memories = await db.conversation_memories.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(100)
        
        # Fallback: Also check inline conversation_memories in pet document
        inline_memories = pet.get("conversation_memories", [])
        if inline_memories and len(inline_memories) > len(memories):
            # Convert inline format to match expected format
            for m in inline_memories:
                memories.append({
                    "category": m.get("topic", "general"),
                    "signal_type": "conversation",
                    "value": m.get("summary", ""),
                    "created_at": m.get("created_at"),
                    "confidence": 70
                })
        
        # Get versioned traits
        traits = await db.pet_traits.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(100)
        
        # Get versioned soul answers
        versioned_answers = await db.soul_answers_versioned.find(
            {"pet_id": pet_id, "superseded_at": None},
            {"_id": 0}
        ).to_list(100)
        
        # ═══════════════════════════════════════════════════════════════
        # COMPONENT 1: Base Soul Score (40 points max)
        # ═══════════════════════════════════════════════════════════════
        
        soul_answers = pet.get("doggy_soul_answers") or {}
        soul_data = pet.get("soul", {})
        preferences = pet.get("preferences", {})
        
        # Combine all known data
        all_known = {**soul_answers, **soul_data, **preferences}
        
        # Also include versioned answers
        for va in versioned_answers:
            field = va.get("field", "")
            if field and va.get("value"):
                all_known[field] = va.get("value")
        
        # Calculate weighted score
        earned_weight = 0
        answered_fields = []
        for field, weight in SOUL_QUESTION_WEIGHTS.items():
            # Check various locations for this field
            value = all_known.get(field) or pet.get(field)
            
            if value and str(value).strip() and str(value).lower() not in ['none', 'unknown', 'n/a']:
                earned_weight += weight
                answered_fields.append(field)
        
        base_score = (earned_weight / MAX_BASE_SCORE) * 40
        
        # ═══════════════════════════════════════════════════════════════
        # COMPONENT 2: Conversation Learning Score (30 points max)
        # ═══════════════════════════════════════════════════════════════
        
        # Count meaningful signals extracted
        signal_count = len(memories)
        
        # Get unique categories
        unique_categories = set()
        for m in memories:
            cat = m.get("category")
            if cat:
                unique_categories.add(cat)
        
        # Base signal score (0.5 points per signal, max 20)
        signal_score = min(20, signal_count * 0.5)
        
        # Category variety bonus (2 points per unique category, max 10)
        variety_bonus = min(10, len(unique_categories) * 2)
        
        learning_score = signal_score + variety_bonus
        
        # ═══════════════════════════════════════════════════════════════
        # COMPONENT 3: Confidence Depth Score (20 points max)
        # ═══════════════════════════════════════════════════════════════
        
        if traits:
            # Average confidence across all traits
            avg_confidence = sum(t.get("confidence", 0) for t in traits) / len(traits)
            
            # High-confidence traits bonus (confidence >= 85)
            high_confidence_count = len([t for t in traits if t.get("confidence", 0) >= 85])
            
            # Base confidence score
            confidence_base = (avg_confidence / 100) * 12
            
            # High confidence bonus (2 points per, max 8)
            confidence_bonus = min(8, high_confidence_count * 2)
            
            depth_score = confidence_base + confidence_bonus
        else:
            depth_score = 0
        
        # ═══════════════════════════════════════════════════════════════
        # COMPONENT 4: Recency Bonus (10 points max)
        # ═══════════════════════════════════════════════════════════════
        
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        
        # Count recent learnings (last 7 days)
        recent_memories = [
            m for m in memories 
            if m.get("timestamp") and 
            (m.get("timestamp") if isinstance(m.get("timestamp"), datetime) 
             else datetime.fromisoformat(str(m.get("timestamp")).replace('Z', '+00:00'))) > week_ago
        ]
        
        recency_score = min(10, len(recent_memories) * 1)
        
        # ═══════════════════════════════════════════════════════════════
        # FINAL CALCULATION
        # ═══════════════════════════════════════════════════════════════
        
        total_score = round(base_score + learning_score + depth_score + recency_score)
        total_score = min(100, max(0, total_score))
        
        # Determine tier
        tier_key = "curious_pup"
        for key, tier in INTELLIGENCE_TIERS.items():
            if tier["min"] <= total_score <= tier["max"]:
                tier_key = key
                break
        
        tier = INTELLIGENCE_TIERS[tier_key]
        
        # Calculate next tier threshold
        next_tier_at = None
        for key, t in INTELLIGENCE_TIERS.items():
            if t["min"] > total_score:
                next_tier_at = t["min"]
                break
        
        # Generate suggestions
        suggestions = _generate_improvement_suggestions(
            all_known, 
            len(memories), 
            len(traits),
            SOUL_QUESTION_WEIGHTS
        )
        
        result = {
            "total_score": total_score,
            "tier": tier_key,
            "tier_info": {
                "label": tier["label"],
                "description": tier["description"],
                "emoji": tier["emoji"]
            },
            "breakdown": {
                "base_soul": round(base_score, 1),
                "conversation_learning": round(learning_score, 1),
                "confidence_depth": round(depth_score, 1),
                "recency_bonus": round(recency_score, 1)
            },
            "stats": {
                "soul_questions_answered": len(answered_fields),
                "soul_questions_total": len(SOUL_QUESTION_WEIGHTS),
                "conversation_signals": signal_count,
                "unique_categories": len(unique_categories),
                "traits_discovered": len(traits),
                "high_confidence_traits": len([t for t in traits if t.get("confidence", 0) >= 85]),
                "recent_learnings_7d": len(recent_memories)
            },
            "next_tier_at": next_tier_at,
            "suggestions": suggestions[:3]  # Top 3 suggestions
        }
        
        logger.info(f"[INTELLIGENCE] {pet.get('name', 'Pet')}: {total_score}% ({tier['label']})")
        
        return result
        
    except Exception as e:
        logger.error(f"[INTELLIGENCE] Error calculating score: {e}")
        return {
            "total_score": 0,
            "tier": "curious_pup",
            "error": str(e)
        }


def _generate_improvement_suggestions(
    known_data: Dict,
    memory_count: int,
    trait_count: int,
    question_weights: Dict
) -> List[str]:
    """Generate personalized suggestions for improving intelligence score."""
    
    suggestions = []
    
    # Find highest-weight unanswered questions
    unanswered = []
    for field, weight in question_weights.items():
        value = known_data.get(field)
        if not value or str(value).strip() == "" or str(value).lower() in ['none', 'unknown', 'n/a']:
            unanswered.append((field, weight))
    
    # Sort by weight descending
    unanswered.sort(key=lambda x: x[1], reverse=True)
    
    # Suggest top unanswered questions
    if unanswered:
        top_field = unanswered[0][0]
        field_readable = top_field.replace("_", " ").title()
        suggestions.append(f"Answer the '{field_readable}' question in Soul profile (+{unanswered[0][1]} points)")
    
    # Suggest more conversation if low on memories
    if memory_count < 10:
        suggestions.append("Chat more with Mira about your pet's daily life and habits")
    
    # Suggest trait discovery
    if trait_count < 5:
        suggestions.append("Share specific behaviors and preferences in conversation")
    
    # Suggest recent interaction
    if memory_count > 0:
        suggestions.append("Regular conversations help Mira learn new things about your pet")
    
    return suggestions


async def get_intelligence_breakdown(db, pet_id: str) -> Dict:
    """
    Get detailed intelligence breakdown by category.
    
    Shows what Mira knows in each intelligence domain.
    """
    try:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            return {"error": "Pet not found"}
        
        # Get all memories
        memories = await db.conversation_memories.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(100)
        
        # Get all traits
        traits = await db.pet_traits.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(100)
        
        # Build domain breakdown
        domains = {
            "temperament": {"score": 0, "known": [], "missing": []},
            "emotional_profile": {"score": 0, "known": [], "missing": []},
            "sensitivities": {"score": 0, "known": [], "missing": []},
            "social_patterns": {"score": 0, "known": [], "missing": []},
            "behavioural_triggers": {"score": 0, "known": [], "missing": []},
            "food_preferences": {"score": 0, "known": [], "missing": []},
            "energy_rhythms": {"score": 0, "known": [], "missing": []},
            "stress_signals": {"score": 0, "known": [], "missing": []},
            "comfort_environments": {"score": 0, "known": [], "missing": []},
            "routine_dependencies": {"score": 0, "known": [], "missing": []},
            "bonding_style": {"score": 0, "known": [], "missing": []},
            "training_response": {"score": 0, "known": [], "missing": []},
            "health_predispositions": {"score": 0, "known": [], "missing": []}
        }
        
        # Map soul answers to domains
        soul = pet.get("doggy_soul_answers") or {}
        
        # Temperament
        if soul.get("temperament") or soul.get("describe_3_words"):
            domains["temperament"]["known"].append(soul.get("temperament") or soul.get("describe_3_words"))
            domains["temperament"]["score"] = 80
        
        # Emotional profile
        if soul.get("separation_anxiety"):
            domains["emotional_profile"]["known"].append(f"Separation anxiety: {soul.get('separation_anxiety')}")
            domains["emotional_profile"]["score"] += 40
        
        # Sensitivities
        if soul.get("food_allergies"):
            domains["sensitivities"]["known"].append(f"Allergies: {soul.get('food_allergies')}")
            domains["sensitivities"]["score"] += 50
        if soul.get("health_conditions"):
            domains["sensitivities"]["known"].append(f"Health: {soul.get('health_conditions')}")
            domains["sensitivities"]["score"] += 30
        
        # Social patterns
        if soul.get("behavior_with_dogs"):
            domains["social_patterns"]["known"].append(f"With dogs: {soul.get('behavior_with_dogs')}")
            domains["social_patterns"]["score"] += 40
        if soul.get("behavior_with_strangers"):
            domains["social_patterns"]["known"].append(f"With strangers: {soul.get('behavior_with_strangers')}")
            domains["social_patterns"]["score"] += 40
        
        # Food preferences
        if soul.get("favorite_treats"):
            domains["food_preferences"]["known"].append(f"Favorites: {soul.get('favorite_treats')}")
            domains["food_preferences"]["score"] += 40
        if soul.get("diet_type"):
            domains["food_preferences"]["known"].append(f"Diet: {soul.get('diet_type')}")
            domains["food_preferences"]["score"] += 30
        
        # Energy rhythms
        if soul.get("energy_level"):
            domains["energy_rhythms"]["known"].append(f"Energy: {soul.get('energy_level')}")
            domains["energy_rhythms"]["score"] += 50
        
        # Add from conversation memories
        for m in memories:
            category = m.get("category", "")
            value = m.get("value", "")
            
            if category == "behavior" and "anxiety" in m.get("signal_type", ""):
                domains["behavioural_triggers"]["known"].append(value)
                domains["behavioural_triggers"]["score"] = min(100, domains["behavioural_triggers"]["score"] + 20)
            
            if category == "food_preference":
                domains["food_preferences"]["known"].append(value)
                domains["food_preferences"]["score"] = min(100, domains["food_preferences"]["score"] + 15)
            
            if category == "routine":
                domains["routine_dependencies"]["known"].append(value)
                domains["routine_dependencies"]["score"] = min(100, domains["routine_dependencies"]["score"] + 20)
        
        # Add from traits
        for t in traits:
            trait_type = t.get("trait_type", "")
            trait_value = t.get("trait_value", "")
            confidence = t.get("confidence", 0)
            
            if "anxiety" in trait_type or "stress" in trait_type:
                domains["stress_signals"]["known"].append(f"{trait_value} ({confidence}%)")
                domains["stress_signals"]["score"] = min(100, domains["stress_signals"]["score"] + 25)
            
            if "temperament" in trait_type:
                domains["temperament"]["known"].append(f"{trait_value} ({confidence}%)")
                domains["temperament"]["score"] = min(100, domains["temperament"]["score"] + 20)
        
        # Calculate overall domain completeness
        total_domain_score = sum(d["score"] for d in domains.values())
        max_possible = len(domains) * 100
        domain_completeness = round((total_domain_score / max_possible) * 100)
        
        return {
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "domain_completeness": domain_completeness,
            "domains": domains
        }
        
    except Exception as e:
        logger.error(f"[BREAKDOWN] Error: {e}")
        return {"error": str(e)}
