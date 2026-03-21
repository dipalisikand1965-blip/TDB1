"""
Soul Intelligence Service - Mira OS Core

This service is responsible for:
1. Extracting unanswered Soul questions
2. Suggesting questions based on conversation context
3. Storing answers and converting to trait graph
4. Managing confidence scores

DOCTRINE: Mira is a Memory System First. Conversation Second.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# SOUL QUESTION CATEGORIES - Maps to Intelligence Domains
# ═══════════════════════════════════════════════════════════════════════════════

SOUL_QUESTIONS = {
    # Identity & Core
    "identity": [
        {"id": "breed", "question": "What breed is {pet_name}?", "field": "breed", "priority": 1},
        {"id": "birth_date", "question": "When is {pet_name}'s birthday?", "field": "birth_date", "priority": 1},
        {"id": "gender", "question": "Is {pet_name} male or female?", "field": "gender", "priority": 1},
        {"id": "weight", "question": "How much does {pet_name} weigh?", "field": "weight", "priority": 2},
        {"id": "size", "question": "What size is {pet_name}? (small, medium, large)", "field": "size", "priority": 2},
    ],
    
    # Temperament & Personality
    "temperament": [
        {"id": "energy_level", "question": "What's {pet_name}'s energy level?", "field": "energy_level", "priority": 1,
         "options": ["Low energy", "Moderate energy", "High energy", "Very high energy"]},
        {"id": "temperament", "question": "How would you describe {pet_name}'s temperament?", "field": "temperament", "priority": 1},
        {"id": "describe_3_words", "question": "Describe {pet_name} in 3 words", "field": "describe_3_words", "priority": 2},
        {"id": "general_nature", "question": "What's {pet_name}'s general nature?", "field": "general_nature", "priority": 2},
    ],
    
    # Social Behavior
    "social": [
        {"id": "behavior_with_dogs", "question": "How does {pet_name} behave around other dogs?", "field": "behavior_with_dogs", "priority": 1,
         "options": ["Loves all dogs", "Selective with dogs", "Avoids other dogs", "Reactive/aggressive"]},
        {"id": "behavior_with_humans", "question": "How does {pet_name} behave with humans?", "field": "behavior_with_humans", "priority": 2},
        {"id": "stranger_reaction", "question": "How does {pet_name} react to strangers?", "field": "stranger_reaction", "priority": 2,
         "options": ["Very friendly", "Cautious then warms up", "Shy/nervous", "Barks/reactive"]},
    ],
    
    # Emotional Profile
    "emotional": [
        {"id": "separation_anxiety", "question": "Does {pet_name} have separation anxiety?", "field": "separation_anxiety", "priority": 1,
         "options": ["None", "Mild", "Moderate", "Severe"]},
        {"id": "anxiety_triggers", "question": "What triggers anxiety in {pet_name}?", "field": "anxiety_triggers", "priority": 2},
        {"id": "loud_sounds", "question": "How does {pet_name} react to loud sounds (fireworks, thunder)?", "field": "loud_sounds", "priority": 2,
         "options": ["Not bothered", "Slightly nervous", "Very anxious", "Panics"]},
    ],
    
    # Food & Diet
    "food": [
        {"id": "food_allergies", "question": "Does {pet_name} have any food allergies?", "field": "food_allergies", "priority": 1},
        {"id": "favorite_treats", "question": "What are {pet_name}'s favorite treats?", "field": "favorite_treats", "priority": 2},
        {"id": "food_motivation", "question": "How food motivated is {pet_name}?", "field": "food_motivation", "priority": 2,
         "options": ["Not food motivated", "Moderately food motivated", "Very food motivated"]},
        {"id": "diet_type", "question": "What type of diet is {pet_name} on?", "field": "diet_type", "priority": 3,
         "options": ["Kibble", "Wet food", "Home-cooked", "Raw", "Mixed"]},
    ],
    
    # Care & Handling
    "care": [
        {"id": "handling_comfort", "question": "How comfortable is {pet_name} with being handled?", "field": "handling_comfort", "priority": 1,
         "options": ["Very comfortable", "Comfortable", "Tolerates it", "Uncomfortable", "Resistant"]},
        {"id": "grooming_style", "question": "What grooming style does {pet_name} prefer?", "field": "grooming_style", "priority": 2},
        {"id": "vet_comfort", "question": "How comfortable is {pet_name} at the vet?", "field": "vet_comfort", "priority": 2,
         "options": ["Very comfortable", "Comfortable", "Nervous", "Very anxious"]},
    ],
    
    # Health
    "health": [
        {"id": "health_conditions", "question": "Does {pet_name} have any health conditions?", "field": "health_conditions", "priority": 1},
        {"id": "medications", "question": "Is {pet_name} on any medications?", "field": "medications", "priority": 2},
        {"id": "life_stage", "question": "What life stage is {pet_name} in?", "field": "life_stage", "priority": 1,
         "options": ["Puppy", "Young adult", "Adult", "Senior"]},
    ],
    
    # Lifestyle
    "lifestyle": [
        {"id": "lives_with", "question": "Who does {pet_name} live with?", "field": "lives_with", "priority": 2},
        {"id": "sleep_location", "question": "Where does {pet_name} sleep?", "field": "sleep_location", "priority": 3},
        {"id": "alone_comfort", "question": "How long can {pet_name} be left alone comfortably?", "field": "alone_comfort", "priority": 2},
        {"id": "walks_per_day", "question": "How many walks does {pet_name} get per day?", "field": "walks_per_day", "priority": 3},
    ],
    
    # Travel
    "travel": [
        {"id": "car_rides", "question": "How does {pet_name} handle car rides?", "field": "car_rides", "priority": 2,
         "options": ["Loves them", "Tolerates them", "Gets anxious", "Gets carsick"]},
        {"id": "crate_trained", "question": "Is {pet_name} crate trained?", "field": "crate_trained", "priority": 2,
         "options": ["Yes, loves the crate", "Yes, but doesn't love it", "No", "Working on it"]},
        {"id": "hotel_experience", "question": "Has {pet_name} stayed at a hotel or boarding before?", "field": "hotel_experience", "priority": 3},
    ],
    
    # Training
    "training": [
        {"id": "training_level", "question": "What's {pet_name}'s training level?", "field": "training_level", "priority": 2,
         "options": ["Untrained", "Basic commands", "Well trained", "Advanced training"]},
        {"id": "learning_style", "question": "What's {pet_name}'s learning style?", "field": "learning_style", "priority": 3},
    ],
}

# Pillar to Soul category mapping
PILLAR_TO_CATEGORIES = {
    "celebrate": ["food", "temperament", "health"],
    "dine": ["food", "health"],
    "stay": ["emotional", "travel", "social"],
    "travel": ["travel", "emotional", "health"],
    "care": ["care", "health", "emotional"],
    "enjoy": ["social", "temperament", "lifestyle"],
    "learn": ["training", "temperament", "emotional"],
    "fit": ["lifestyle", "health", "temperament"],
    "emergency": ["health", "emotional"],
    "farewell": ["emotional"],
    "adopt": ["temperament", "social", "lifestyle"],
    "advisory": ["health", "lifestyle"],
    "paperwork": ["health"],
    "shop": ["food", "temperament"],
}


def get_unanswered_soul_questions(pet: Dict, limit: int = 5) -> List[Dict]:
    """
    Get a list of unanswered Soul questions for a pet.
    Returns questions sorted by priority.
    """
    if not pet:
        return []
    
    pet_name = pet.get("name", "your pet")
    doggy_soul = pet.get("doggy_soul_answers") or {}
    soul_data = pet.get("soul", {})
    
    # Combine all possible answer sources
    all_answers = {**doggy_soul, **soul_data}
    
    unanswered = []
    
    for category, questions in SOUL_QUESTIONS.items():
        for q in questions:
            field = q["id"]
            # Check if answer exists and is not empty
            answer = all_answers.get(field) or pet.get(field)
            if not answer or answer == "" or answer == [] or answer == {}:
                unanswered.append({
                    "id": q["id"],
                    "category": category,
                    "question": q["question"].format(pet_name=pet_name),
                    "field": q["field"],
                    "priority": q.get("priority", 3),
                    "options": q.get("options", [])
                })
    
    # Sort by priority (1 = highest)
    unanswered.sort(key=lambda x: x["priority"])
    
    return unanswered[:limit]


def get_relevant_unanswered_questions(pet: Dict, pillar: str = None, topic: str = None, limit: int = 3) -> List[Dict]:
    """
    Get unanswered questions relevant to the current conversation context.
    Uses pillar and topic to prioritize questions.
    """
    all_unanswered = get_unanswered_soul_questions(pet, limit=50)
    
    if not all_unanswered:
        return []
    
    # Get relevant categories for this pillar
    relevant_categories = PILLAR_TO_CATEGORIES.get(pillar, [])
    
    # Score each question by relevance
    scored = []
    for q in all_unanswered:
        score = q["priority"]  # Base score (lower = better)
        
        # Boost if category matches pillar
        if q["category"] in relevant_categories:
            score -= 2
        
        # Boost if topic keywords match
        if topic:
            topic_lower = topic.lower()
            question_lower = q["question"].lower()
            if any(word in question_lower for word in topic_lower.split()):
                score -= 1
        
        scored.append((score, q))
    
    # Sort by score and return top N
    scored.sort(key=lambda x: x[0])
    
    return [q for _, q in scored[:limit]]


def get_soul_completion_score(pet: Dict, conversation_memories: List[Dict] = None) -> Dict:
    """
    Calculate the Soul completion score based on answered questions.
    Now aggregates from ALL data sources:
    - doggy_soul_answers (form data)
    - soul (deep soul data)
    - preferences (user preferences)
    - insights (computed insights)
    - conversation_memories (learned from chat)
    
    Returns detailed breakdown by category.
    """
    if not pet:
        return {"total_score": 0, "categories": {}, "data_sources": {}}
    
    # Aggregate all data sources
    doggy_soul = pet.get("doggy_soul_answers") or {}
    soul_data = pet.get("soul", {})  # Deep soul data (persona, love_language, etc.)
    preferences = pet.get("preferences", {})
    insights = pet.get("insights", {})
    
    # Combine all sources
    all_answers = {
        **doggy_soul, 
        **soul_data, 
        **preferences,
        **pet  # Top-level fields like breed, weight, birth_date
    }
    
    # Track data sources for transparency
    data_sources = {
        "soul_form": len([k for k in doggy_soul.keys() if doggy_soul.get(k)]),
        "soul_deep": len([k for k in soul_data.keys() if soul_data.get(k)]),
        "preferences": len([k for k in preferences.keys() if preferences.get(k)]),
        "conversation": len(conversation_memories) if conversation_memories else 0
    }
    
    category_scores = {}
    total_questions = 0
    total_answered = 0
    
    for category, questions in SOUL_QUESTIONS.items():
        answered = 0
        total = len(questions)
        
        for q in questions:
            field = q["id"]
            answer = all_answers.get(field)
            if answer and answer != "" and answer != [] and answer != {}:
                answered += 1
        
        category_scores[category] = {
            "answered": answered,
            "total": total,
            "percentage": round((answered / total) * 100, 1) if total > 0 else 0
        }
        
        total_questions += total
        total_answered += answered
    
    # Bonus for conversation learnings (up to 10% extra)
    conversation_bonus = min(10, (data_sources["conversation"] * 2)) if conversation_memories else 0
    
    base_score = round((total_answered / total_questions) * 100, 1) if total_questions > 0 else 0
    overall_score = min(100, base_score + conversation_bonus)
    
    return {
        "total_score": overall_score,
        "base_score": base_score,
        "conversation_bonus": conversation_bonus,
        "answered": total_answered,
        "total": total_questions,
        "categories": category_scores,
        "data_sources": data_sources,
        "total_data_points": sum(data_sources.values())
    }


def convert_answer_to_trait(field: str, answer: Any, source: str = "soul_form") -> Dict:
    """
    Convert a Soul answer to a structured trait with confidence.
    """
    confidence_map = {
        "soul_form": 100,
        "explicit_chat": 90,
        "repeated_mention": 95,
        "single_mention": 70,
        "inferred": 50,
        "breed_default": 30
    }
    
    return {
        "field": field,
        "value": answer,
        "confidence": confidence_map.get(source, 50),
        "source": source,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": 1
    }


def extract_traits_from_message(message: str, pet_name: str) -> List[Dict]:
    """
    Extract potential traits from a user message.
    Returns list of trait candidates for storage.
    """
    traits = []
    message_lower = message.lower()
    
    # Preference patterns
    preference_patterns = [
        (r"loves? (\w+)", "preference", "favorite"),
        (r"hates? (\w+)", "preference", "dislike"),
        (r"scared of (\w+)", "anxiety_trigger", "fear"),
        (r"allergic to (\w+)", "allergy", "health"),
        (r"can't eat (\w+)", "dietary_restriction", "health"),
    ]
    
    # Behavior patterns
    if "anxious" in message_lower or "nervous" in message_lower:
        traits.append({
            "type": "behavior_observation",
            "category": "emotional",
            "raw_text": message,
            "confidence": 70
        })
    
    if "friendly" in message_lower:
        traits.append({
            "type": "temperament_observation", 
            "category": "social",
            "raw_text": message,
            "confidence": 70
        })
    
    return traits


async def store_soul_answer(db, pet_id: str, field: str, answer: Any, source: str = "chat") -> bool:
    """
    Store a Soul answer and update the pet's intelligence profile.
    """
    try:
        trait = convert_answer_to_trait(field, answer, source)
        
        # Update doggy_soul_answers
        update_result = await db.pets.update_one(
            {"id": pet_id},
            {
                "$set": {
                    f"doggy_soul_answers.{field}": answer,
                    f"soul_traits.{field}": trait
                }
            }
        )
        
        # Log the update
        await db.soul_update_log.insert_one({
            "pet_id": pet_id,
            "field": field,
            "value": answer,
            "source": source,
            "timestamp": datetime.now(timezone.utc),
            "trait": trait
        })
        
        logger.info(f"[SOUL] Stored answer for {pet_id}: {field} = {answer}")
        return True
        
    except Exception as e:
        logger.error(f"[SOUL] Error storing answer: {e}")
        return False


def suggest_question_for_context(pet: Dict, pillar: str, user_message: str) -> Optional[Dict]:
    """
    Suggest ONE unanswered question that naturally fits the conversation context.
    Returns None if no relevant question found.
    """
    relevant_questions = get_relevant_unanswered_questions(pet, pillar, user_message, limit=1)
    
    if relevant_questions:
        q = relevant_questions[0]
        return {
            "question": q["question"],
            "field": q["field"],
            "options": q.get("options", []),
            "natural_phrasing": generate_natural_question(q, pillar)
        }
    
    return None


def generate_natural_question(question_data: Dict, pillar: str) -> str:
    """
    Generate a natural-sounding version of the question for conversation.
    """
    base_question = question_data["question"]
    category = question_data.get("category", "general")
    
    # Add pillar-specific context
    context_intros = {
        "celebrate": "To make sure everything is perfect for the celebration, ",
        "dine": "To recommend the best food options, ",
        "stay": "To find the ideal boarding experience, ",
        "travel": "To plan a comfortable trip, ",
        "care": "To ensure the best care, ",
        "enjoy": "To find activities they'll love, ",
        "learn": "To tailor the training approach, ",
    }
    
    intro = context_intros.get(pillar, "To personalize my recommendations, ")
    return f"{intro}I'd love to know: {base_question}"
