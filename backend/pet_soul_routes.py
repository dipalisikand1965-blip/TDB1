"""
Pet Soul Routes - The World's Most Accurate Personalized Soul of a Dog
=======================================================================
A comprehensive pet profile system with:
- 8 Core Folders (Identity, Family, Rhythm, Home, Travel, Taste, Training, Long Horizon)
- Progressive questioning (one at a time)
- Profile score calculation
- AI-ready insights layer
- Auto-population from pillar reservations
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

# Setup logger
logger = logging.getLogger(__name__)

# Create routers
pet_soul_router = APIRouter(prefix="/pet-soul", tags=["Pet Soul"])
pet_soul_admin_router = APIRouter(prefix="/pet-soul", tags=["Pet Soul Admin"])

# Database reference (set by main server)
db = None

def set_pet_soul_db(database):
    global db
    db = database

# ==================== DATA MODELS ====================

# Question Bank - 8 Folders with weighted questions
DOGGY_SOUL_QUESTIONS = {
    "identity_temperament": {
        "name": "Identity & Temperament",
        "icon": "🎭",
        "description": "Who your dog is at their core",
        "questions": [
            {"id": "describe_3_words", "question": "How would you describe your dog in three words?", "type": "text", "weight": 3},
            {"id": "general_nature", "question": "Is your dog generally:", "type": "select", "options": ["Calm", "Curious", "Playful", "Shy", "Guarded", "Fearful", "Highly energetic"], "weight": 4},
            {"id": "stranger_reaction", "question": "How does your dog usually react to strangers?", "type": "select", "options": ["Friendly", "Cautious", "Indifferent", "Nervous", "Protective"], "weight": 3},
            {"id": "social_with_people", "question": "How comfortable is your dog with new people?", "type": "select", "options": ["Very social - loves everyone", "Friendly after warming up", "Selective - only certain people", "Shy with most people", "Anxious around strangers"], "weight": 4, "canonical_id": "social_with_people"},
            {"id": "loud_sounds", "question": "How does your dog react to loud sounds (thunder, fireworks, traffic)?", "type": "select", "options": ["Completely fine", "Mildly anxious", "Very anxious", "Needs comfort"], "weight": 4},
            {"id": "social_preference", "question": "Does your dog prefer:", "type": "select", "options": ["Being around people", "Being around other dogs", "Being mostly with you", "Being mostly independent"], "weight": 3},
            {"id": "handling_comfort", "question": "Is your dog comfortable being handled (paws, ears, mouth)?", "type": "select", "options": ["Very comfortable", "Sometimes uncomfortable", "Highly sensitive"], "weight": 3},
            {"id": "life_stage", "question": "What life stage is your dog in?", "type": "select", "options": ["Puppy (0-1 year)", "Young adult (1-3 years)", "Adult (3-7 years)", "Senior (7+ years)"], "weight": 5, "canonical_id": "life_stage"},
        ]
    },
    "family_pack": {
        "name": "Family & Pack",
        "icon": "👨‍👩‍👧‍👦",
        "description": "Their social world and relationships",
        "questions": [
            {"id": "lives_with", "question": "Does your dog live with:", "type": "multi_select", "options": ["Adults only", "Children", "Other dogs", "Other pets (cats, birds, etc.)"], "weight": 3},
            {"id": "kids_at_home", "question": "Are there children in your household?", "type": "select", "options": ["Yes, young children (0-5)", "Yes, older children (6-12)", "Yes, teenagers", "No children"], "weight": 3, "canonical_id": "kids_at_home"},
            {"id": "other_pets", "question": "Do you have other pets at home?", "type": "select", "options": ["Yes, other dogs", "Yes, cats", "Yes, other animals", "Multiple pets", "No other pets"], "weight": 3, "canonical_id": "other_pets"},
            {"id": "behavior_with_dogs", "question": "How does your dog behave with other dogs?", "type": "select", "options": ["Loves all dogs", "Selective friends", "Nervous", "Reactive"], "weight": 4},
            {"id": "most_attached_to", "question": "Who is your dog most attached to in the family?", "type": "select", "options": ["Me", "Partner", "Children", "Everyone equally"], "weight": 2},
            {"id": "attention_seeking", "question": "Does your dog like being the centre of attention?", "type": "select", "options": ["Yes", "Sometimes", "No"], "weight": 2},
        ]
    },
    "rhythm_routine": {
        "name": "Rhythm & Routine",
        "icon": "⏰",
        "description": "Daily life patterns and habits",
        "questions": [
            {"id": "morning_routine", "question": "What does your dog's morning typically look like?", "type": "select", "options": ["Early riser, ready to go", "Slow starter, needs time to wake", "Excited for breakfast first", "Morning walk is priority"], "weight": 4, "canonical_id": "morning_routine"},
            {"id": "feeding_times", "question": "When do you typically feed your dog?", "type": "select", "options": ["Once a day", "Twice a day (morning & evening)", "Three times a day", "Free feeding / grazing"], "weight": 4, "canonical_id": "feeding_times"},
            {"id": "exercise_needs", "question": "How much daily exercise does your dog need?", "type": "select", "options": ["Light (15-30 mins)", "Moderate (30-60 mins)", "Active (1-2 hours)", "Very active (2+ hours)"], "weight": 4, "canonical_id": "exercise_needs"},
            {"id": "walks_per_day", "question": "How many walks does your dog need per day?", "type": "select", "options": ["1", "2", "3+"], "weight": 3},
            {"id": "energetic_time", "question": "What time of day is your dog most energetic?", "type": "select", "options": ["Morning", "Afternoon", "Evening", "Night"], "weight": 2},
            {"id": "sleep_location", "question": "Where does your dog usually sleep?", "type": "select", "options": ["Your bed", "Their own bed", "Crate", "Sofa / floor"], "weight": 2},
            {"id": "alone_comfort", "question": "Is your dog used to being left alone?", "type": "select", "options": ["Yes, comfortably", "Sometimes anxious", "Not at all"], "weight": 4},
            {"id": "separation_anxiety", "question": "Does your dog have separation anxiety?", "type": "select", "options": ["No", "Mild", "Moderate", "Severe"], "weight": 5},
        ]
    },
    "home_comforts": {
        "name": "Home Comforts",
        "icon": "🏠",
        "description": "What makes them feel safe and happy",
        "questions": [
            {"id": "favorite_spot", "question": "Where is your dog's favorite spot at home?", "type": "select", "options": ["On the couch/sofa", "Their own bed", "Sunny window spot", "Near family members", "Under furniture", "Outdoors/garden"], "weight": 3, "canonical_id": "favorite_spot"},
            {"id": "favorite_item", "question": "Does your dog have a favourite item?", "type": "select", "options": ["Toy", "Blanket", "Bed", "None"], "weight": 2},
            {"id": "space_preference", "question": "Does your dog prefer:", "type": "select", "options": ["Quiet spaces", "Busy spaces", "Outdoor time", "Indoor time"], "weight": 3},
            {"id": "crate_trained", "question": "Is your dog crate-trained?", "type": "select", "options": ["Yes", "No", "In training"], "weight": 4},
            {"id": "car_rides", "question": "Does your dog like car rides?", "type": "select", "options": ["Loves them", "Neutral", "Anxious", "Gets motion sickness"], "weight": 4},
        ]
    },
    "travel_style": {
        "name": "Travel Style",
        "icon": "✈️",
        "description": "How they explore the world with you",
        "questions": [
            {"id": "usual_travel", "question": "How does your dog usually travel?", "type": "select", "options": ["Car", "Train", "Flight (occasionally)", "Never travels"], "weight": 3},
            {"id": "hotel_experience", "question": "Has your dog ever stayed in a hotel before?", "type": "select", "options": ["Yes, loved it", "Yes, but was anxious", "No"], "weight": 3},
            {"id": "stay_preference", "question": "What kind of stay suits your dog best?", "type": "select", "options": ["Quiet, nature hotel", "Pet-friendly resort", "City hotel", "Homestay / villa"], "weight": 3},
            {"id": "travel_social", "question": "During stays, does your dog prefer:", "type": "select", "options": ["Private spaces", "Social pet areas"], "weight": 2},
        ]
    },
    "taste_treat": {
        "name": "Taste & Treat World",
        "icon": "🍖",
        "description": "Food personality and preferences",
        "questions": [
            {"id": "food_motivation", "question": "How food-motivated is your dog?", "type": "select", "options": ["Very - will do anything for food", "Moderately food motivated", "Somewhat interested", "Not very food motivated"], "weight": 3, "canonical_id": "food_motivation"},
            {"id": "favorite_protein", "question": "What is your dog's favorite protein?", "type": "select", "options": ["Chicken", "Beef", "Lamb", "Fish", "Pork", "Vegetarian/Plant-based", "No preference"], "weight": 3, "canonical_id": "favorite_protein"},
            {"id": "treat_preference", "question": "What type of treats does your dog prefer?", "type": "select", "options": ["Soft/chewy treats", "Crunchy treats", "Freeze-dried", "Fresh/real meat", "Dental chews", "Fruits/vegetables"], "weight": 3, "canonical_id": "treat_preference"},
            {"id": "diet_type", "question": "Is your dog's diet:", "type": "select", "options": ["Vegetarian", "Non-vegetarian", "Mixed"], "weight": 4},
            {"id": "food_allergies", "question": "Does your dog have any food allergies?", "type": "multi_select", "options": ["No", "Chicken", "Beef", "Grains", "Dairy", "Other"], "weight": 5},
            {"id": "favorite_treats", "question": "What treats does your dog love most?", "type": "multi_select", "options": ["Biscuits", "Jerky", "Cakes", "Homemade food", "Fresh fruits"], "weight": 3},
            {"id": "sensitive_stomach", "question": "Does your dog have a sensitive stomach?", "type": "select", "options": ["Yes", "No", "Sometimes"], "weight": 4},
        ]
    },
    "training_behaviour": {
        "name": "Training & Behaviour",
        "icon": "🎓",
        "description": "How they learn and respond",
        "questions": [
            {"id": "training_level", "question": "Is your dog trained?", "type": "select", "options": ["Fully trained", "Partially trained", "Not trained"], "weight": 3},
            {"id": "motivation_type", "question": "What motivates your dog during training?", "type": "select", "options": ["Treats/food", "Praise and attention", "Toys/play", "A mix of everything"], "weight": 3, "canonical_id": "motivation_type"},
            {"id": "behavior_issues", "question": "Does your dog have any behavioral issues?", "type": "multi_select", "options": ["None", "Excessive barking", "Jumping on people", "Pulling on leash", "Resource guarding", "Aggression", "Fear-based issues", "Destructive behavior"], "weight": 4, "canonical_id": "behavior_issues"},
            {"id": "training_response", "question": "How does your dog respond best to training?", "type": "select", "options": ["Treats", "Praise", "Toys", "Play"], "weight": 3},
            {"id": "leash_behavior", "question": "Does your dog pull on the leash?", "type": "select", "options": ["Always", "Sometimes", "Rarely"], "weight": 2},
            {"id": "barking", "question": "Does your dog bark often?", "type": "select", "options": ["Yes", "Occasionally", "Rarely"], "weight": 2},
        ]
    },
    "long_horizon": {
        "name": "Long Horizon (Health)",
        "icon": "🌅",
        "description": "Health, vet comfort, grooming and dreams",
        "questions": [
            {"id": "health_conditions", "question": "Does your dog have any health conditions?", "type": "multi_select", "options": ["None", "Arthritis", "Diabetes", "Heart condition", "Skin allergies", "Hip dysplasia", "Eye problems", "Other chronic condition"], "weight": 5, "canonical_id": "health_conditions"},
            {"id": "vet_comfort", "question": "How comfortable is your dog at the vet?", "type": "select", "options": ["Very comfortable - no issues", "Slightly nervous but manageable", "Anxious - needs extra handling", "Very stressed - requires sedation"], "weight": 5, "canonical_id": "vet_comfort"},
            {"id": "grooming_tolerance", "question": "How does your dog handle grooming?", "type": "select", "options": ["Loves it", "Tolerates it well", "Gets anxious", "Very difficult"], "weight": 4, "canonical_id": "grooming_tolerance"},
            {"id": "main_wish", "question": "What do you want most for your dog?", "type": "multi_select", "options": ["Good health", "More training", "More travel experiences", "More social time with other dogs"], "weight": 2},
            {"id": "help_needed", "question": "Would you like help with:", "type": "multi_select", "options": ["Behaviour training", "Travel planning", "Grooming routines", "Diet planning"], "weight": 2},
            {"id": "dream_life", "question": "In one sentence, what kind of life do you want your dog to have?", "type": "text", "weight": 3},
            {"id": "celebration_preferences", "question": "Which celebrations would you like to celebrate with your pet?", "type": "multi_select", "options": ["Birthday", "Gotcha Day (Adoption Anniversary)", "Diwali", "Holi", "Christmas", "New Year", "Valentine's Day", "Raksha Bandhan", "Independence Day", "Easter", "Eid"], "weight": 3},
        ]
    }
}

# All folder keys
FOLDER_KEYS = list(DOGGY_SOUL_QUESTIONS.keys())

# ==================== HELPER FUNCTIONS ====================

def calculate_folder_score(answers: Dict, folder_key: str) -> float:
    """Calculate completion score for a folder (0-100)"""
    folder = DOGGY_SOUL_QUESTIONS.get(folder_key, {})
    questions = folder.get("questions", [])
    
    if not questions:
        return 0
    
    total_weight = sum(q["weight"] for q in questions)
    answered_weight = 0
    
    for q in questions:
        if q["id"] in answers and answers[q["id"]] is not None and answers[q["id"]] != "":
            answered_weight += q["weight"]
    
    return round((answered_weight / total_weight) * 100, 1) if total_weight > 0 else 0


def calculate_overall_score(answers: Dict) -> float:
    """
    Calculate overall Doggy Soul score (0-100) using weighted 8 Golden Pillars.
    Uses pet_soul_config.py for canonical scoring weights.
    """
    try:
        from pet_soul_config import calculate_score_state
        score_state = calculate_score_state(answers)
        return score_state.get("score_percent", 0)
    except ImportError:
        # Fallback to simple average if config not available
        folder_scores = []
        for folder_key in FOLDER_KEYS:
            score = calculate_folder_score(answers, folder_key)
            folder_scores.append(score)
        return round(sum(folder_scores) / len(folder_scores), 1) if folder_scores else 0


def get_next_question(answers: Dict) -> Optional[Dict]:
    """Get the next unanswered question to ask"""
    for folder_key in FOLDER_KEYS:
        folder = DOGGY_SOUL_QUESTIONS[folder_key]
        for q in folder["questions"]:
            if q["id"] not in answers or answers[q["id"]] is None or answers[q["id"]] == "":
                return {
                    "folder": folder_key,
                    "folder_name": folder["name"],
                    "folder_icon": folder["icon"],
                    **q
                }
    return None


def generate_insights(pet_data: Dict) -> Dict:
    """Generate AI-readable insights from pet profile"""
    answers = pet_data.get("doggy_soul_answers", {})
    identity = pet_data.get("identity", {})
    
    insights = {
        "overall_summary": "",
        "folder_summaries": {},
        "key_flags": {
            "has_allergies": False,
            "allergy_list": [],
            "anxiety_level": "none",
            "is_reactive": False,
            "is_crate_trained": False,
            "has_motion_sickness": False,
            "has_sensitive_stomach": False,
            "separation_anxiety": "none",
            "is_trained": False,
        },
        "recommendations": [],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Extract key flags from answers
    if "food_allergies" in answers:
        allergies = answers["food_allergies"]
        if isinstance(allergies, list):
            allergies = [a for a in allergies if a != "No"]
        elif allergies and allergies != "No":
            allergies = [allergies]
        else:
            allergies = []
        if allergies:
            insights["key_flags"]["has_allergies"] = True
            insights["key_flags"]["allergy_list"] = allergies
    
    if "separation_anxiety" in answers:
        insights["key_flags"]["separation_anxiety"] = answers["separation_anxiety"].lower()
        if answers["separation_anxiety"] in ["Moderate", "Severe"]:
            insights["key_flags"]["anxiety_level"] = "high"
        elif answers["separation_anxiety"] == "Mild":
            insights["key_flags"]["anxiety_level"] = "mild"
    
    if "behavior_with_dogs" in answers and answers["behavior_with_dogs"] == "Reactive":
        insights["key_flags"]["is_reactive"] = True
    
    if "crate_trained" in answers:
        insights["key_flags"]["is_crate_trained"] = answers["crate_trained"] == "Yes"
    
    if "car_rides" in answers and answers["car_rides"] == "Gets motion sickness":
        insights["key_flags"]["has_motion_sickness"] = True
    
    if "sensitive_stomach" in answers and answers["sensitive_stomach"] in ["Yes", "Sometimes"]:
        insights["key_flags"]["has_sensitive_stomach"] = True
    
    if "training_level" in answers:
        insights["key_flags"]["is_trained"] = answers["training_level"] == "Fully trained"
    
    # Generate overall summary
    name = identity.get("name", "This pet")
    breed = identity.get("breed", "dog")
    nature = answers.get("general_nature", "")
    
    summary_parts = [f"{name} is a {breed}"]
    if nature:
        summary_parts.append(f"who is generally {nature.lower()}")
    if insights["key_flags"]["has_allergies"]:
        summary_parts.append(f"with allergies to {', '.join(insights['key_flags']['allergy_list'])}")
    
    insights["overall_summary"] = " ".join(summary_parts) + "."
    
    # Generate folder summaries
    for folder_key, folder_data in DOGGY_SOUL_QUESTIONS.items():
        folder_answers = {q["id"]: answers.get(q["id"]) for q in folder_data["questions"] if q["id"] in answers}
        if folder_answers:
            summary_items = [f"{k}: {v}" for k, v in folder_answers.items() if v]
            insights["folder_summaries"][folder_key] = "; ".join(summary_items[:3])  # First 3 for brevity
    
    # Generate recommendations
    if insights["key_flags"]["anxiety_level"] in ["mild", "high"]:
        insights["recommendations"].append("Consider calming treats and quieter stay options")
    if not insights["key_flags"]["is_crate_trained"]:
        insights["recommendations"].append("May need crate training before flights")
    if insights["key_flags"]["has_allergies"]:
        insights["recommendations"].append(f"Avoid products containing {', '.join(insights['key_flags']['allergy_list'])}")
    
    return insights


# ==================== PYDANTIC MODELS ====================

class IdentityData(BaseModel):
    """Essential identity fields (Layer 1)"""
    name: str = Field(..., description="Pet's name")
    breed: Optional[str] = None
    birth_date: Optional[str] = None  # YYYY-MM-DD
    gotcha_date: Optional[str] = None  # YYYY-MM-DD
    weight: Optional[float] = None  # kg
    weight_unit: str = Field(default="kg")
    size: Optional[str] = None  # S, M, L, XL
    gender: Optional[str] = None  # male, female
    is_neutered: Optional[bool] = None
    photo_url: Optional[str] = None


class MedicalReminder(BaseModel):
    """Medical reminder settings"""
    last_vaccination_date: Optional[str] = None
    vaccination_reminder_enabled: bool = False
    reminder_channel: str = Field(default="both")  # whatsapp, email, both
    deworming_date: Optional[str] = None
    tick_flea_date: Optional[str] = None
    annual_checkup_date: Optional[str] = None
    custom_reminders: List[Dict] = Field(default_factory=list)


class CelebrationDay(BaseModel):
    """Celebration dates"""
    occasion: str  # birthday, gotcha_day, etc.
    date: str  # MM-DD or YYYY-MM-DD
    is_recurring: bool = True
    custom_name: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# P1 DATA MODELS - MOJO Bible Compliance (Feb 2026)
# ═══════════════════════════════════════════════════════════════════════════

class WeightEntry(BaseModel):
    """Single weight measurement entry for timeline"""
    weight: float  # in kg
    unit: str = Field(default="kg")
    recorded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = Field(default="manual")  # manual, vet_visit, auto
    notes: Optional[str] = None
    is_target: bool = False  # If this is a target weight


class TrainingProgressNote(BaseModel):
    """Training progress note entry"""
    skill: str  # e.g., "sit", "stay", "leash walking", "potty training"
    status: str = Field(default="in_progress")  # not_started, in_progress, mastered
    started_at: Optional[str] = None
    mastered_at: Optional[str] = None
    notes: Optional[str] = None
    trainer: Optional[str] = None  # "self", "professional", trainer name
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EnvironmentProfile(BaseModel):
    """Pet's living environment and climate context (for seasonal risks)"""
    city: Optional[str] = None
    climate_zone: Optional[str] = None  # tropical, subtropical, temperate, arid
    housing_type: Optional[str] = None  # apartment, house_with_yard, villa
    has_ac: bool = False
    outdoor_access: Optional[str] = None  # none, balcony, yard, large_garden
    seasonal_risks: List[str] = Field(default_factory=list)  # monsoon_risks, summer_heat, etc.
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DoggyAnswer(BaseModel):
    """A single answer to a Doggy Soul question"""
    question_id: str
    folder: str
    answer: Any  # Can be string, list, or boolean
    source: str = Field(default="direct")  # direct, pillar_dine, pillar_stay, mira
    captured_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PetSoulProfile(BaseModel):
    """Complete Pet Soul profile"""
    id: str = Field(default_factory=lambda: f"pet-{uuid.uuid4().hex[:12]}")
    owner_id: Optional[str] = None
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    
    # Layer 1: Essential Identity
    identity: IdentityData
    
    # Medical & Celebrations
    medical: Optional[MedicalReminder] = None
    celebrations: List[CelebrationDay] = Field(default_factory=list)
    
    # Layer 2: Doggy Soul Answers
    doggy_soul_answers: Dict[str, Any] = Field(default_factory=dict)
    
    # Scores
    overall_score: float = Field(default=0)
    folder_scores: Dict[str, float] = Field(default_factory=dict)
    
    # AI Insights
    insights: Dict = Field(default_factory=dict)
    
    # Pillar History - snapshots from each pillar interaction
    pillar_history: List[Dict] = Field(default_factory=list)
    
    # Soul Moments - auto-captured milestones
    soul_moments: List[Dict] = Field(default_factory=list)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # P1 FIELDS - MOJO Bible Compliance (Feb 2026)
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Weight History Timeline - Track weight over time
    weight_history: List[Dict] = Field(default_factory=list)
    target_weight: Optional[float] = None
    
    # Training History & Progress Notes
    training_history: List[Dict] = Field(default_factory=list)
    training_summary: Optional[str] = None  # AI-generated summary
    
    # Environment & Climate Profile
    environment: Optional[Dict] = None
    
    # Notification preferences
    whatsapp_reminders: bool = True
    email_reminders: bool = True
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = Field(default="direct")


# ==================== API ROUTES ====================

@pet_soul_router.get("/questions")
async def get_question_bank():
    """Get the complete Doggy Soul question bank"""
    return {
        "folders": DOGGY_SOUL_QUESTIONS,
        "folder_order": FOLDER_KEYS,
        "total_questions": sum(len(f["questions"]) for f in DOGGY_SOUL_QUESTIONS.values())
    }


@pet_soul_router.get("/questions/{folder_key}")
async def get_folder_questions(folder_key: str):
    """Get questions for a specific folder"""
    if folder_key not in DOGGY_SOUL_QUESTIONS:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder = DOGGY_SOUL_QUESTIONS[folder_key]
    return {
        "folder_key": folder_key,
        "name": folder["name"],
        "icon": folder["icon"],
        "description": folder["description"],
        "questions": folder["questions"]
    }


@pet_soul_router.get("/profile/{pet_id}")
async def get_pet_soul_profile(pet_id: str):
    """Get complete Pet Soul profile"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Calculate scores
    answers = pet.get("doggy_soul_answers", {})
    folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(answers)
    
    return {
        "pet": pet,
        "scores": {
            "overall": overall_score,
            "folders": folder_scores
        },
        "next_question": get_next_question(answers),
        "insights": pet.get("insights", generate_insights(pet))
    }


@pet_soul_router.get("/profile/{pet_id}/progress")
async def get_profile_progress(pet_id: str):
    """Get profile completion progress"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1, "identity": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    answers = pet.get("doggy_soul_answers", {})
    folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
    
    # Build folder progress with icons
    folder_progress = []
    for fk in FOLDER_KEYS:
        folder = DOGGY_SOUL_QUESTIONS[fk]
        folder_progress.append({
            "key": fk,
            "name": folder["name"],
            "icon": folder["icon"],
            "score": folder_scores[fk],
            "questions_total": len(folder["questions"]),
            "questions_answered": sum(1 for q in folder["questions"] if q["id"] in answers and answers[q["id"]])
        })
    
    return {
        "overall_score": calculate_overall_score(answers),
        "folders": folder_progress,
        "next_question": get_next_question(answers),
        "total_answered": sum(1 for a in answers.values() if a),
        "total_questions": sum(len(f["questions"]) for f in DOGGY_SOUL_QUESTIONS.values())
    }


@pet_soul_router.get("/profile/{pet_id}/quick-questions")
async def get_quick_questions(
    pet_id: str,
    limit: int = Query(default=3, le=5),
    context: Optional[str] = Query(default=None, description="Context for priority: 'celebrate', 'dine', 'learn', etc.")
):
    """
    Get the next N unanswered questions for quick prompts in Mira.
    MAX 3 per session by default to prevent overwhelming the user.
    When context=celebrate: Prioritizes celebration_preferences + taste_treat folder first.
    """
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    answers = pet.get("doggy_soul_answers", {})
    pet_name = pet.get("name", "your pet")
    
    # Collect all unanswered questions with their folder info
    unanswered = []
    for folder_key in FOLDER_KEYS:
        folder = DOGGY_SOUL_QUESTIONS[folder_key]
        for q in folder["questions"]:
            if q["id"] not in answers or answers[q["id"]] is None or answers[q["id"]] == "":
                unanswered.append({
                    "question_id": q["id"],
                    "question": q["question"].replace("your dog", pet_name),
                    "type": q["type"],
                    "options": q.get("options", []),
                    "weight": q.get("weight", 1),
                    "folder": folder_key,
                    "folder_name": folder["name"],
                    "folder_icon": folder["icon"]
                })
    
    # ── Celebrate context: bubble up celebration_preferences + taste_treat ──
    if context == "celebrate":
        CELEBRATE_PRIORITY_FOLDERS = ["taste_treat"]
        CELEBRATE_PRIORITY_IDS = ["celebration_preferences", "favorite_protein", "treat_preference", "toy_preference", "motivation_type"]
        
        def celebrate_sort_key(q):
            # 1 = highest priority (celebration_preferences first)
            if q["question_id"] in CELEBRATE_PRIORITY_IDS[:2]:
                return 0
            if q["folder"] in CELEBRATE_PRIORITY_FOLDERS or q["question_id"] in CELEBRATE_PRIORITY_IDS:
                return 1
            return 2 + (100 - q.get("weight", 1))  # descending weight after priorities
        
        unanswered.sort(key=celebrate_sort_key)
    else:
        # Default: sort by weight (highest first) to prioritize impactful questions
        unanswered.sort(key=lambda x: x["weight"], reverse=True)
    
    # Ensure diversity: pick from different folders when possible
    selected = []
    folders_used = set()
    
    # First pass: one from each folder (respects the priority sort)
    for q in unanswered:
        if q["folder"] not in folders_used and len(selected) < limit:
            selected.append(q)
            folders_used.add(q["folder"])
    
    # Second pass: fill remaining with highest weight questions
    for q in unanswered:
        if len(selected) >= limit:
            break
        if q not in selected:
            selected.append(q)
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "questions": selected[:limit],
        "total_unanswered": len(unanswered),
        "current_score": calculate_overall_score(answers)
    }


@pet_soul_router.get("/profile/{pet_id}/8-pillars")
async def get_8_pillars_summary(pet_id: str):
    """
    Get the 8 Golden Pillars summary for a pet.
    Returns weighted scores aligned with pet_soul_config.py scoring system.
    """
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    answers = pet.get("doggy_soul_answers", {})
    pet_name = pet.get("name", "your pet")
    
    try:
        from pet_soul_config import calculate_score_state, get_pillar_summary, PET_SOUL_TIERS
        
        score_state = calculate_score_state(answers)
        pillar_summary = get_pillar_summary(answers)
        
        return {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "overall_score": score_state["score_percent"],
            "tier": {
                "key": score_state["tier_key"],
                "name": score_state["tier_name"],
                "emoji": score_state["tier_emoji"],
                "description": score_state["tier_description"]
            },
            "next_tier": {
                "key": score_state["next_tier_key"],
                "name": score_state["next_tier_name"],
                "at_percent": score_state["next_tier_at"],
                "percent_to_go": score_state["percent_to_next"]
            },
            "pillars": pillar_summary,
            "pillar_completion": score_state["pillar_completion"],
            "sections": score_state["sections"],
            "missing_high_impact": score_state["missing_top_5"],
            "stats": {
                "total_questions": score_state["total_questions"],
                "answered": score_state["answered_count"],
                "total_points": score_state["total_points"],
                "earned_points": score_state["earned_points"]
            },
            "tiers_available": list(PET_SOUL_TIERS.keys())
        }
    except ImportError:
        # Fallback to basic calculation
        folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
        overall_score = calculate_overall_score(answers)
        
        return {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "overall_score": overall_score,
            "pillars": [
                {"pillar_key": fk, "name": DOGGY_SOUL_QUESTIONS[fk]["name"], 
                 "icon": DOGGY_SOUL_QUESTIONS[fk]["icon"], "percent": folder_scores[fk]}
                for fk in FOLDER_KEYS
            ],
            "note": "Using legacy scoring - pet_soul_config not available"
        }



@pet_soul_router.post("/answer")
async def save_soul_answer_simple(request: Request):
    """
    Simple endpoint to save a soul question answer.
    Used by SoulQuestionPrompts in the chat area.
    
    Body: { pet_id, question_id, answer }
    """
    from bson import ObjectId
    
    try:
        body = await request.json()
        pet_id = body.get("pet_id")
        question_id = body.get("question_id")
        answer = body.get("answer")
        
        if not pet_id or not question_id or not answer:
            raise HTTPException(status_code=400, detail="Missing pet_id, question_id, or answer")
        
        # Try to find pet by id field first, then by _id
        pet = await db.pets.find_one({"id": pet_id})
        if not pet:
            pet = await db.pets.find_one({"id": {"$regex": pet_id, "$options": "i"}})
        if not pet:
            try:
                pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
            except:
                pass
        
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Use the pet's actual _id for updates
        pet_filter = {"_id": pet["_id"]} if "_id" in pet else {"id": pet_id}
        
        # Update the answer
        update_data = {
            f"doggy_soul_answers.{question_id}": answer,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.pets.update_one(pet_filter, {"$set": update_data})
        
        # Recalculate scores
        pet = await db.pets.find_one(pet_filter, {"_id": 0})
        answers = pet.get("doggy_soul_answers", {})
        folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
        overall_score = calculate_overall_score(answers)
        
        # Update scores
        await db.pets.update_one(pet_filter, {"$set": {
            "overall_score": overall_score,
            "folder_scores": folder_scores
        }})
        
        return {
            "success": True,
            "message": f"Answer saved for {pet.get('name', 'pet')}",
            "scores": {
                "overall": overall_score,
                "folders": folder_scores
            },
            "paw_points_earned": 10  # Gamification reward
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SOUL_ANSWER] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pet_soul_router.post("/profile/{pet_id}/answer")
async def save_answer(pet_id: str, answer: DoggyAnswer):
    """Save a single answer and update scores"""
    from bson import ObjectId
    
    # Try to find pet by id field first, then by _id
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Use the pet's actual _id for updates
    pet_filter = {"_id": pet["_id"]} if "_id" in pet else {"id": pet_id}
    
    # Update the answer
    update_data = {
        f"doggy_soul_answers.{answer.question_id}": answer.answer,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(pet_filter, {"$set": update_data})
    
    # Recalculate scores and insights
    pet = await db.pets.find_one(pet_filter, {"_id": 0})
    answers = pet.get("doggy_soul_answers", {})
    folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(answers)
    insights = generate_insights(pet)
    
    # Update scores and insights
    await db.pets.update_one(pet_filter, {"$set": {
        "overall_score": overall_score,
        "folder_scores": folder_scores,
        "insights": insights
    }})
    
    return {
        "success": True,
        "scores": {
            "overall": overall_score,
            "folders": folder_scores
        },
        "next_question": get_next_question(answers),
        "insights_updated": True
    }


@pet_soul_router.post("/profile/{pet_id}/answers/bulk")
async def save_bulk_answers(pet_id: str, answers: Dict[str, Any]):
    """Save multiple answers at once with optional source tracking"""
    from bson import ObjectId
    
    # Try to find pet by id field first, then by _id
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        # Try ObjectId lookup
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Merge with existing answers (handle None case)
    existing_answers = pet.get("doggy_soul_answers") or {}
    existing_meta = pet.get("doggy_soul_meta") or {}
    
    # Check for source in request (default to "direct" for modal edits)
    source = answers.pop("_source", "direct")
    confidence = answers.pop("_confidence", 100 if source == "direct" else 85)
    
    # Track NEW answers only (for paw points - no re-award on edits)
    new_answer_count = 0
    meta_updates = {}
    
    for key, value in answers.items():
        if key not in existing_answers or existing_answers.get(key) in [None, "", []]:
            if value is not None and value != "" and value != []:
                new_answer_count += 1
        
        # Update metadata for this answer
        meta_updates[key] = {
            "source": source,
            "confidence": confidence,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    existing_answers.update(answers)
    existing_meta.update(meta_updates)
    
    # Calculate new scores
    folder_scores = {fk: calculate_folder_score(existing_answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(existing_answers)
    
    # Update pet with proper identity structure
    pet["doggy_soul_answers"] = existing_answers
    insights = generate_insights(pet)
    
    # Use the pet's actual _id for update (works regardless of how pet was found)
    pet_filter = {"_id": pet["_id"]} if "_id" in pet else {"id": pet_id}
    await db.pets.update_one(pet_filter, {"$set": {
        "doggy_soul_answers": existing_answers,
        "doggy_soul_meta": existing_meta,
        "overall_score": overall_score,
        "folder_scores": folder_scores,
        "insights": insights,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    # Award Paw Points for NEW soul questions (10 points each)
    if new_answer_count > 0:
        try:
            owner_email = pet.get("owner_email")
            if owner_email:
                from member_logic_config import PAW_POINTS_RULES
                points_per_question = PAW_POINTS_RULES["soul_question_answered"]["points"]
                total_points = new_answer_count * points_per_question
                
                user = await db.users.find_one({"email": owner_email})
                if user:
                    current_balance = user.get("loyalty_points", 0)
                    new_balance = current_balance + total_points
                    lifetime = user.get("lifetime_points_earned", current_balance)
                    
                    # LEDGER FIRST
                    await db.paw_points_ledger.insert_one({
                        "user_email": owner_email,
                        "amount": total_points,
                        "balance_after": new_balance,
                        "reason": f"Soul questions answered: {new_answer_count} x {points_per_question} pts",
                        "source": "soul",
                        "reference_id": pet_id,
                        "created_at": datetime.now(timezone.utc)
                    })
                    
                    # THEN UPDATE BALANCE
                    await db.users.update_one(
                        {"email": owner_email},
                        {"$set": {
                            "loyalty_points": new_balance,
                            "lifetime_points_earned": lifetime + total_points
                        }}
                    )
                    logger.info(f"Awarded {total_points} paw points to {owner_email} for {new_answer_count} new soul questions")
        except Exception as e:
            logger.error(f"Failed to award soul question points: {e}")
    
    # Auto-create ticket for Command Center
    try:
        from ticket_auto_creation import on_pet_soul_updated
        # Get owner info
        owner = await db.users.find_one({"email": pet.get("owner_email")}, {"_id": 0, "password": 0})
        await on_pet_soul_updated(pet, owner or {}, answers)
    except Exception as e:
        logger.error(f"Auto-ticket for Pet Soul update failed: {e}")
    
    return {
        "success": True,
        "answers_saved": len(answers),
        "new_answers": new_answer_count,
        "points_earned": new_answer_count * 10 if new_answer_count > 0 else 0,
        "scores": {
            "overall": overall_score,
            "folders": folder_scores
        }
    }


@pet_soul_router.post("/profile/{pet_id}/identity")
async def update_identity(pet_id: str, identity: IdentityData):
    """Update essential identity fields"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Calculate age if birth_date provided
    identity_dict = identity.model_dump()
    if identity.birth_date:
        try:
            birth = datetime.strptime(identity.birth_date, "%Y-%m-%d")
            today = datetime.now()
            age_days = (today - birth).days
            identity_dict["age_years"] = age_days // 365
            identity_dict["age_months"] = (age_days % 365) // 30
        except:
            pass
    
    # Auto-suggest size based on weight and breed
    if identity.weight and not identity.size:
        weight = identity.weight
        if weight < 5:
            identity_dict["size"] = "S"
        elif weight < 15:
            identity_dict["size"] = "M"
        elif weight < 30:
            identity_dict["size"] = "L"
        else:
            identity_dict["size"] = "XL"
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "identity": identity_dict,
        "name": identity.name,  # Keep top-level name for compatibility
        "breed": identity.breed,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"success": True, "identity": identity_dict}


@pet_soul_router.post("/profile/{pet_id}/medical")
async def update_medical(pet_id: str, medical: MedicalReminder):
    """Update medical reminder settings"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "medical": medical.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"success": True}


@pet_soul_router.post("/profile/{pet_id}/celebrations")
async def update_celebrations(pet_id: str, celebrations: List[CelebrationDay]):
    """Update celebration dates"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    celebrations_data = [c.model_dump() for c in celebrations]
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "celebrations": celebrations_data,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"success": True, "celebrations": celebrations_data}


@pet_soul_router.post("/profile/{pet_id}/pillar-capture")
async def capture_from_pillar(pet_id: str, pillar_data: Dict):
    """Capture data from a pillar interaction and save to profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pillar = pillar_data.get("pillar", "unknown")
    captured_fields = pillar_data.get("fields", {})
    
    # Map pillar fields to Doggy Soul questions
    field_mappings = {
        "allergies": "food_allergies",
        "food_allergies": "food_allergies",
        "crate_trained": "crate_trained",
        "is_crate_trained": "crate_trained",
        "anxiety_level": "separation_anxiety",
        "sensitive_stomach": "sensitive_stomach",
        "diet_type": "diet_type",
        "travel_preference": "stay_preference",
    }
    
    # Update doggy soul answers
    existing_answers = pet.get("doggy_soul_answers", {})
    updates_made = []
    
    for field_key, value in captured_fields.items():
        mapped_key = field_mappings.get(field_key, field_key)
        if mapped_key and value:
            existing_answers[mapped_key] = value
            updates_made.append(mapped_key)
    
    # Create pillar history snapshot
    snapshot = {
        "pillar": pillar,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "fields_captured": updates_made,
        "request_id": pillar_data.get("request_id"),
        "request_type": pillar_data.get("request_type")
    }
    
    pillar_history = pet.get("pillar_history", [])
    pillar_history.append(snapshot)
    
    # Recalculate scores
    folder_scores = {fk: calculate_folder_score(existing_answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(existing_answers)
    
    # Update pet
    pet["doggy_soul_answers"] = existing_answers
    insights = generate_insights(pet)
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "doggy_soul_answers": existing_answers,
        "pillar_history": pillar_history,
        "overall_score": overall_score,
        "folder_scores": folder_scores,
        "insights": insights,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {
        "success": True,
        "fields_updated": updates_made,
        "new_score": overall_score
    }


@pet_soul_router.get("/profile/{pet_id}/for-pillar/{pillar}")
async def get_profile_for_pillar(pet_id: str, pillar: str):
    """Get profile data needed for a specific pillar, with missing field indicators"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    identity = pet.get("identity", {})
    answers = pet.get("doggy_soul_answers", {})
    
    # Fields needed per pillar
    pillar_fields = {
        "dine": ["food_allergies", "sensitive_stomach", "diet_type", "favorite_treats"],
        "stay": ["crate_trained", "separation_anxiety", "stay_preference", "travel_social", "behavior_with_dogs"],
        "travel": ["crate_trained", "car_rides", "usual_travel", "hotel_experience", "separation_anxiety"],
        "care": ["handling_comfort", "training_level", "loud_sounds"],
        "celebrate": ["favorite_treats", "attention_seeking"]
    }
    
    needed_fields = pillar_fields.get(pillar, [])
    
    # Check which fields we have and which are missing
    profile_data = {
        "identity": identity,
        "known_fields": {},
        "missing_fields": []
    }
    
    for field in needed_fields:
        if field in answers and answers[field]:
            profile_data["known_fields"][field] = answers[field]
        else:
            # Find the question for this field
            for folder_key, folder in DOGGY_SOUL_QUESTIONS.items():
                for q in folder["questions"]:
                    if q["id"] == field:
                        profile_data["missing_fields"].append({
                            "field": field,
                            "question": q["question"],
                            "type": q["type"],
                            "options": q.get("options")
                        })
                        break
    
    profile_data["insights"] = pet.get("insights", {})
    
    return profile_data


# ==================== ADMIN ROUTES ====================

@pet_soul_admin_router.get("/pets")
async def admin_list_pets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    min_score: Optional[float] = None
):
    """Admin: List all pets with search and filtering"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"identity.name": {"$regex": search, "$options": "i"}},
            {"breed": {"$regex": search, "$options": "i"}},
            {"owner_email": {"$regex": search, "$options": "i"}}
        ]
    
    if min_score is not None:
        query["overall_score"] = {"$gte": min_score}
    
    pets = await db.pets.find(query, {"_id": 0}).skip(skip).limit(limit).sort("updated_at", -1).to_list(limit)
    total = await db.pets.count_documents(query)
    
    # Add computed scores if missing
    for pet in pets:
        if "overall_score" not in pet:
            answers = pet.get("doggy_soul_answers", {})
            pet["overall_score"] = calculate_overall_score(answers)
    
    return {"pets": pets, "total": total, "skip": skip, "limit": limit}


@pet_soul_admin_router.get("/questions")
async def admin_get_questions():
    """Admin: Get all questions with stats"""
    # Get answer counts per question
    pipeline = [
        {"$project": {"doggy_soul_answers": 1}},
        {"$match": {"doggy_soul_answers": {"$exists": True}}}
    ]
    
    all_pets = await db.pets.find({"doggy_soul_answers": {"$exists": True}}, {"doggy_soul_answers": 1}).to_list(10000)
    
    question_stats = {}
    for pet in all_pets:
        for qid, answer in pet.get("doggy_soul_answers", {}).items():
            if answer:
                question_stats[qid] = question_stats.get(qid, 0) + 1
    
    return {
        "question_bank": DOGGY_SOUL_QUESTIONS,
        "answer_counts": question_stats,
        "total_pets": len(all_pets)
    }


@pet_soul_admin_router.get("/insights-summary")
async def admin_insights_summary():
    """Admin: Get aggregated insights across all pets"""
    pets = await db.pets.find({"insights": {"$exists": True}}, {"insights": 1}).to_list(10000)
    
    summary = {
        "total_with_insights": len(pets),
        "allergies": {},
        "anxiety_levels": {"none": 0, "mild": 0, "high": 0},
        "crate_trained": {"yes": 0, "no": 0, "unknown": 0},
        "reactive_dogs": 0
    }
    
    for pet in pets:
        flags = pet.get("insights", {}).get("key_flags", {})
        
        # Count allergies
        for allergy in flags.get("allergy_list", []):
            summary["allergies"][allergy] = summary["allergies"].get(allergy, 0) + 1
        
        # Count anxiety levels
        anxiety = flags.get("anxiety_level", "none")
        if anxiety in summary["anxiety_levels"]:
            summary["anxiety_levels"][anxiety] += 1
        
        # Count crate trained
        if flags.get("is_crate_trained"):
            summary["crate_trained"]["yes"] += 1
        elif flags.get("is_crate_trained") is False:
            summary["crate_trained"]["no"] += 1
        else:
            summary["crate_trained"]["unknown"] += 1
        
        # Count reactive
        if flags.get("is_reactive"):
            summary["reactive_dogs"] += 1
    
    return summary


# ============================================
# AUTO-LEARNING ENGINE
# ============================================

async def learn_from_order(db, order_data: dict):
    """
    Auto-learn pet preferences from orders.
    Called after order creation to update Pet Soul profile.
    """
    try:
        pet_info = order_data.get("pet", {})
        pet_name = pet_info.get("name")
        customer_email = order_data.get("customer", {}).get("email")
        
        if not pet_name and not customer_email:
            return {"learned": False, "reason": "No pet or customer info"}
        
        # Find the pet in database
        query = {}
        if pet_name:
            query["name"] = {"$regex": f"^{pet_name}$", "$options": "i"}
        
        pet = await db.pets.find_one(query)
        
        if not pet:
            # Try finding by owner email
            if customer_email:
                pet = await db.pets.find_one({"owner_email": customer_email})
        
        if not pet:
            return {"learned": False, "reason": "Pet not found in database"}
        
        pet_id = pet.get("id")
        learned_items = []
        
        # Extract learnings from order items
        items = order_data.get("items", [])
        updates = {}
        
        for item in items:
            item_name = (item.get("name") or "").lower()
            category = (item.get("category") or "").lower()
            tags = [t.lower() for t in item.get("tags", [])]
            custom_details = item.get("customDetails", {})
            
            # Learn treat preferences
            if "treat" in item_name or "treat" in category or "treats" in tags:
                if "favorite_treats" not in updates:
                    updates["favorite_treats"] = []
                updates["favorite_treats"].append(item.get("name"))
                learned_items.append(f"Favorite treat: {item.get('name')}")
            
            # Learn cake preferences (for birthdays/celebrations)
            if "cake" in item_name or "cake" in category:
                updates["loves_celebrations"] = True
                
                # Extract flavor preferences from cake name
                if "peanut" in item_name:
                    updates["taste_peanut_butter"] = True
                if "banana" in item_name:
                    updates["taste_banana"] = True
                if "carrot" in item_name:
                    updates["taste_carrot"] = True
                    
                learned_items.append(f"Celebration item ordered: {item.get('name')}")
            
            # Learn dietary info from custom details
            if custom_details.get("allergies"):
                allergies = custom_details["allergies"]
                if isinstance(allergies, str):
                    allergies = [a.strip() for a in allergies.split(",")]
                updates["food_allergies"] = allergies
                learned_items.append(f"Allergies noted: {allergies}")
            
            # Learn from product tags
            if "grain-free" in tags:
                updates["prefers_grain_free"] = True
                learned_items.append("Prefers grain-free products")
            
            if "veg" in tags or "vegetarian" in tags:
                updates["diet_type"] = "vegetarian"
                learned_items.append("Vegetarian diet")
        
        if not updates:
            return {"learned": False, "reason": "No learnable info in order", "pet_id": pet_id}
        
        # Update Pet Soul answers
        existing_answers = pet.get("doggy_soul_answers", {})
        
        # Merge favorite treats
        if "favorite_treats" in updates:
            existing_treats = existing_answers.get("favorite_treats", [])
            if isinstance(existing_treats, str):
                existing_treats = [existing_treats]
            new_treats = list(set(existing_treats + updates["favorite_treats"]))
            updates["favorite_treats"] = new_treats[:5]  # Keep top 5
        
        # Merge allergies
        if "food_allergies" in updates:
            existing_allergies = existing_answers.get("food_allergies", [])
            if isinstance(existing_allergies, str):
                existing_allergies = [existing_allergies]
            new_allergies = list(set(existing_allergies + updates["food_allergies"]))
            updates["food_allergies"] = new_allergies
        
        # Prepare the update
        soul_updates = {f"doggy_soul_answers.{k}": v for k, v in updates.items()}
        soul_updates["doggy_soul_answers.last_auto_updated"] = datetime.now(timezone.utc).isoformat()
        soul_updates["doggy_soul_answers.auto_learned_from"] = order_data.get("orderId", "order")
        
        # Update the pet
        await db.pets.update_one(
            {"id": pet_id},
            {"$set": soul_updates}
        )
        
        # Add to pillar_interactions
        await db.pets.update_one(
            {"id": pet_id},
            {"$push": {
                "pillar_interactions": {
                    "pillar": "celebrate",
                    "type": "order",
                    "order_id": order_data.get("orderId"),
                    "items": [item.get("name") for item in items],
                    "total": order_data.get("total"),
                    "learned": updates,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }}
        )
        
        return {
            "learned": True,
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "updates": updates,
            "learned_items": learned_items
        }
        
    except Exception as e:
        logger.error(f"Auto-learn from order failed: {e}", exc_info=True)
        return {"learned": False, "error": str(e)}


# ============================================
# CELEBRATIONS CALENDAR API
# ============================================

# 2026 Indian Festival Dates
FESTIVAL_DATES_2026 = {
    "Diwali": "2026-10-20",
    "Holi": "2026-03-17",
    "Christmas": "2026-12-25",
    "New Year": "2026-01-01",
    "Valentine's Day": "2026-02-14",
    "Raksha Bandhan": "2026-08-12",
    "Ganesh Chaturthi": "2026-09-08",
    "Navratri": "2026-10-01",
    "Dussehra": "2026-10-10",
    "Eid": "2026-06-28",
    "Easter": "2026-04-05",
    "Independence Day": "2026-08-15"
}

@pet_soul_admin_router.get("/celebrations-calendar")
async def get_celebrations_calendar(
    days_ahead: int = Query(90, ge=1, le=365),
    include_festivals: bool = True
):
    """
    Get upcoming pet celebrations calendar for admin dashboard.
    Shows birthdays, gotcha days, and selected festival celebrations.
    """
    from datetime import timedelta
    
    today = datetime.now()
    end_date = today + timedelta(days=days_ahead)
    
    upcoming = []
    
    # Get all pets with their celebrations and birth dates
    pets = await db.pets.find(
        {},
        {
            "_id": 0, 
            "id": 1,
            "name": 1, 
            "birth_date": 1,
            "identity.birth_date": 1,
            "gotcha_date": 1,
            "identity.gotcha_date": 1,
            "breed": 1,
            "identity.breed": 1,
            "celebrations": 1,
            "doggy_soul_answers.celebration_preferences": 1,
            "owner_name": 1,
            "owner_email": 1,
            "owner_phone": 1
        }
    ).to_list(10000)
    
    for pet in pets:
        pet_name = pet.get("name") or pet.get("identity", {}).get("name", "Unknown")
        pet_id = pet.get("id")
        breed = pet.get("breed") or pet.get("identity", {}).get("breed", "")
        owner = {
            "name": pet.get("owner_name"),
            "email": pet.get("owner_email"),
            "phone": pet.get("owner_phone")
        }
        
        # Check birthday
        birth_date_str = pet.get("birth_date") or pet.get("identity", {}).get("birth_date")
        if birth_date_str:
            try:
                # Handle different date formats
                if len(birth_date_str) == 5:  # MM-DD format
                    this_year_bday = datetime.strptime(f"{today.year}-{birth_date_str}", "%Y-%m-%d")
                else:
                    bday = datetime.strptime(birth_date_str[:10], "%Y-%m-%d")
                    this_year_bday = bday.replace(year=today.year)
                
                # If birthday has passed this year, check next year
                if this_year_bday < today:
                    this_year_bday = this_year_bday.replace(year=today.year + 1)
                
                if today <= this_year_bday <= end_date:
                    # Calculate age
                    if len(birth_date_str) > 5:
                        birth_year = int(birth_date_str[:4])
                        age = this_year_bday.year - birth_year
                    else:
                        age = None
                    
                    upcoming.append({
                        "type": "birthday",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "breed": breed,
                        "date": this_year_bday.strftime("%Y-%m-%d"),
                        "days_until": (this_year_bday - today).days,
                        "age": age,
                        "icon": "🎂",
                        "owner": owner,
                        "suggestion": f"Birthday cake for {pet_name}" + (f" turning {age}!" if age else "!")
                    })
            except:
                pass
        
        # Check gotcha day (adoption anniversary)
        gotcha_date_str = pet.get("gotcha_date") or pet.get("identity", {}).get("gotcha_date")
        if gotcha_date_str:
            try:
                if len(gotcha_date_str) == 5:
                    this_year_gotcha = datetime.strptime(f"{today.year}-{gotcha_date_str}", "%Y-%m-%d")
                else:
                    gotcha = datetime.strptime(gotcha_date_str[:10], "%Y-%m-%d")
                    this_year_gotcha = gotcha.replace(year=today.year)
                
                if this_year_gotcha < today:
                    this_year_gotcha = this_year_gotcha.replace(year=today.year + 1)
                
                if today <= this_year_gotcha <= end_date:
                    years = this_year_gotcha.year - int(gotcha_date_str[:4]) if len(gotcha_date_str) > 5 else None
                    upcoming.append({
                        "type": "gotcha_day",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "breed": breed,
                        "date": this_year_gotcha.strftime("%Y-%m-%d"),
                        "days_until": (this_year_gotcha - today).days,
                        "years": years,
                        "icon": "🏠",
                        "owner": owner,
                        "suggestion": f"{pet_name}'s adoption anniversary" + (f" - {years} year{'s' if years != 1 else ''} home!" if years else "!")
                    })
            except:
                pass
        
        # Check custom celebrations from Pet Soul answers
        celebration_prefs = pet.get("doggy_soul_answers", {}).get("celebration_preferences", [])
        custom_celebrations = pet.get("celebrations", [])
        
        # Add festival celebrations based on preferences
        if include_festivals and celebration_prefs:
            for festival in celebration_prefs:
                festival_date_str = FESTIVAL_DATES_2026.get(festival)
                if festival_date_str:
                    try:
                        festival_date = datetime.strptime(festival_date_str, "%Y-%m-%d")
                        if today <= festival_date <= end_date:
                            upcoming.append({
                                "type": "festival",
                                "festival": festival,
                                "pet_id": pet_id,
                                "pet_name": pet_name,
                                "breed": breed,
                                "date": festival_date_str,
                                "days_until": (festival_date - today).days,
                                "icon": "🎉",
                                "owner": owner,
                                "suggestion": f"{festival} celebration treat for {pet_name}"
                            })
                    except:
                        pass
    
    # Sort by date
    upcoming.sort(key=lambda x: x.get("date", "9999-99-99"))
    
    # Group by date for calendar view
    calendar_view = {}
    for event in upcoming:
        date = event["date"]
        if date not in calendar_view:
            calendar_view[date] = []
        calendar_view[date].append(event)
    
    return {
        "upcoming_events": upcoming[:100],  # Limit to 100 events
        "calendar_view": calendar_view,
        "total_events": len(upcoming),
        "date_range": {
            "start": today.strftime("%Y-%m-%d"),
            "end": end_date.strftime("%Y-%m-%d"),
            "days": days_ahead
        },
        "festival_dates": FESTIVAL_DATES_2026 if include_festivals else {}
    }


@pet_soul_admin_router.get("/products-by-breed/{breed}")
async def get_products_by_breed(breed: str, limit: int = Query(10, ge=1, le=50)):
    """
    Get products tagged with a specific breed.
    Used for breed-specific recommendations on checkout.
    """
    # Search products with breed in name, tags, or description
    breed_lower = breed.lower()
    
    products = await db.products_master.find({
        "$or": [
            {"name": {"$regex": breed, "$options": "i"}},
            {"tags": {"$regex": breed, "$options": "i"}},
            {"breed_tags": {"$regex": breed, "$options": "i"}},
            {"description": {"$regex": breed, "$options": "i"}}
        ]
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    return {
        "breed": breed,
        "products": products,
        "count": len(products)
    }


# ============================================
# PUBLIC BREED PRODUCTS API
# ============================================

@pet_soul_router.get("/breed-products/{breed}")
async def get_breed_products(breed: str, limit: int = Query(6, ge=1, le=20)):
    """
    Public API: Get products recommended for a specific breed.
    Used on checkout page for breed-specific recommendations.
    """
    breed_lower = breed.lower()
    
    # Search products with breed in name, tags, or breed_tags
    products = await db.products_master.find({
        "$or": [
            {"name": {"$regex": breed, "$options": "i"}},
            {"tags": {"$regex": breed, "$options": "i"}},
            {"breed_tags": {"$regex": breed, "$options": "i"}},
            {"category": {"$regex": breed, "$options": "i"}}
        ]
    }, {
        "_id": 0,
        "id": 1,
        "name": 1,
        "price": 1,
        "image": 1,
        "images": 1,
        "category": 1,
        "tags": 1,
        "breed_tags": 1
    }).limit(limit).to_list(limit)
    
    return {
        "breed": breed,
        "products": products,
        "count": len(products),
        "message": f"Perfect for {breed}s!" if products else None
    }


# ═══════════════════════════════════════════════════════════════════════════
# P1 ENDPOINTS - MOJO Bible Compliance (Feb 2026)
# Weight History, Training Progress, Environment/Climate
# ═══════════════════════════════════════════════════════════════════════════

@pet_soul_router.get("/profile/{pet_id}/weight-history")
async def get_weight_history(pet_id: str):
    """Get pet's weight history timeline"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "weight_history": 1, "identity": 1, "target_weight": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    history = pet.get("weight_history", [])
    current_weight = pet.get("identity", {}).get("weight")
    target_weight = pet.get("target_weight")
    
    # Calculate trend if we have enough data
    trend = None
    if len(history) >= 2:
        recent = history[-1].get("weight", 0)
        previous = history[-2].get("weight", 0)
        if recent > previous:
            trend = "gaining"
        elif recent < previous:
            trend = "losing"
        else:
            trend = "stable"
    
    return {
        "pet_id": pet_id,
        "current_weight": current_weight,
        "target_weight": target_weight,
        "history": history,
        "trend": trend,
        "total_entries": len(history)
    }


@pet_soul_router.post("/profile/{pet_id}/weight-history")
async def add_weight_entry(pet_id: str, entry: WeightEntry):
    """Add a new weight entry to the timeline"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    entry_dict = entry.model_dump()
    
    # Also update current weight in identity
    update_data = {
        "$push": {"weight_history": entry_dict},
        "$set": {
            "identity.weight": entry.weight,
            "identity.weight_unit": entry.unit,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    # If this is a target weight entry, update target
    if entry.is_target:
        update_data["$set"]["target_weight"] = entry.weight
    
    await db.pets.update_one({"id": pet_id}, update_data)
    
    return {"success": True, "entry": entry_dict}


@pet_soul_router.get("/profile/{pet_id}/training-history")
async def get_training_history(pet_id: str):
    """Get pet's training progress and history"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "training_history": 1, "training_summary": 1, "identity": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    history = pet.get("training_history", [])
    
    # Calculate stats
    mastered = [h for h in history if h.get("status") == "mastered"]
    in_progress = [h for h in history if h.get("status") == "in_progress"]
    not_started = [h for h in history if h.get("status") == "not_started"]
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("identity", {}).get("name", "Pet"),
        "history": history,
        "summary": pet.get("training_summary"),
        "stats": {
            "mastered": len(mastered),
            "in_progress": len(in_progress),
            "not_started": len(not_started),
            "total": len(history)
        },
        "mastered_skills": [h.get("skill") for h in mastered],
        "current_focus": [h.get("skill") for h in in_progress]
    }


@pet_soul_router.post("/profile/{pet_id}/training-history")
async def add_training_progress(pet_id: str, note: TrainingProgressNote):
    """Add or update training progress for a skill"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    history = pet.get("training_history", [])
    note_dict = note.model_dump()
    
    # Check if skill already exists, update it
    existing_index = next((i for i, h in enumerate(history) if h.get("skill") == note.skill), None)
    
    if existing_index is not None:
        # Update existing entry
        history[existing_index] = note_dict
    else:
        # Add new entry
        if not note.started_at:
            note_dict["started_at"] = datetime.now(timezone.utc).isoformat()
        history.append(note_dict)
    
    # If mastered, set mastered_at
    if note.status == "mastered" and not note_dict.get("mastered_at"):
        note_dict["mastered_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "training_history": history,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"success": True, "skill": note.skill, "status": note.status}


@pet_soul_router.get("/profile/{pet_id}/environment")
async def get_environment_profile(pet_id: str):
    """Get pet's environment and climate profile"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "environment": 1, "identity": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    environment = pet.get("environment", {})
    breed = pet.get("identity", {}).get("breed", "")
    
    # Get breed-specific climate info from breed_knowledge
    from breed_knowledge import get_breed_knowledge
    breed_data = get_breed_knowledge(breed)
    climate_suitability = breed_data.get("climate_suitability", {}) if breed_data else {}
    
    return {
        "pet_id": pet_id,
        "environment": environment,
        "breed_climate_info": climate_suitability,
        "seasonal_risks": environment.get("seasonal_risks", [])
    }


@pet_soul_router.post("/profile/{pet_id}/environment")
async def update_environment_profile(pet_id: str, environment: EnvironmentProfile):
    """Update pet's environment and climate profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    env_dict = environment.model_dump()
    
    # Auto-calculate seasonal risks based on city/climate
    seasonal_risks = []
    climate_zone = environment.climate_zone or ""
    
    if climate_zone in ["tropical", "subtropical"]:
        seasonal_risks.extend(["monsoon_flooding", "high_humidity_skin_issues", "mosquito_diseases"])
    if climate_zone in ["tropical", "arid"]:
        seasonal_risks.extend(["summer_heat_stroke", "paw_burns_hot_pavement", "dehydration"])
    if not environment.has_ac and climate_zone in ["tropical", "subtropical", "arid"]:
        seasonal_risks.append("heat_stress_no_ac")
    
    env_dict["seasonal_risks"] = list(set(seasonal_risks))
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "environment": env_dict,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"success": True, "environment": env_dict, "seasonal_risks": env_dict["seasonal_risks"]}
