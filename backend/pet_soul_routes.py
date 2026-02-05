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

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

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
            {"id": "loud_sounds", "question": "How does your dog react to loud sounds (thunder, fireworks, traffic)?", "type": "select", "options": ["Completely fine", "Mildly anxious", "Very anxious", "Needs comfort"], "weight": 4},
            {"id": "social_preference", "question": "Does your dog prefer:", "type": "select", "options": ["Being around people", "Being around other dogs", "Being mostly with you", "Being mostly independent"], "weight": 3},
            {"id": "handling_comfort", "question": "Is your dog comfortable being handled (paws, ears, mouth)?", "type": "select", "options": ["Very comfortable", "Sometimes uncomfortable", "Highly sensitive"], "weight": 3},
        ]
    },
    "family_pack": {
        "name": "Family & Pack",
        "icon": "👨‍👩‍👧‍👦",
        "description": "Their social world and relationships",
        "questions": [
            {"id": "lives_with", "question": "Does your dog live with:", "type": "multi_select", "options": ["Adults only", "Children", "Other dogs", "Other pets (cats, birds, etc.)"], "weight": 3},
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
            {"id": "training_response", "question": "How does your dog respond best to training?", "type": "select", "options": ["Treats", "Praise", "Toys", "Play"], "weight": 3},
            {"id": "leash_behavior", "question": "Does your dog pull on the leash?", "type": "select", "options": ["Always", "Sometimes", "Rarely"], "weight": 2},
            {"id": "barking", "question": "Does your dog bark often?", "type": "select", "options": ["Yes", "Occasionally", "Rarely"], "weight": 2},
        ]
    },
    "long_horizon": {
        "name": "Long Horizon",
        "icon": "🌅",
        "description": "Your dreams and hopes for them",
        "questions": [
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
    """Calculate overall Doggy Soul score (0-100)"""
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


@pet_soul_router.post("/profile/{pet_id}/answer")
async def save_answer(pet_id: str, answer: DoggyAnswer):
    """Save a single answer and update scores"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Update the answer
    update_data = {
        f"doggy_soul_answers.{answer.question_id}": answer.answer,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one({"id": pet_id}, {"$set": update_data})
    
    # Recalculate scores and insights
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    answers = pet.get("doggy_soul_answers", {})
    folder_scores = {fk: calculate_folder_score(answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(answers)
    insights = generate_insights(pet)
    
    # Update scores and insights
    await db.pets.update_one({"id": pet_id}, {"$set": {
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
    """Save multiple answers at once"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Merge with existing answers
    existing_answers = pet.get("doggy_soul_answers", {})
    existing_answers.update(answers)
    
    # Calculate new scores
    folder_scores = {fk: calculate_folder_score(existing_answers, fk) for fk in FOLDER_KEYS}
    overall_score = calculate_overall_score(existing_answers)
    
    # Update pet with proper identity structure
    pet["doggy_soul_answers"] = existing_answers
    insights = generate_insights(pet)
    
    await db.pets.update_one({"id": pet_id}, {"$set": {
        "doggy_soul_answers": existing_answers,
        "overall_score": overall_score,
        "folder_scores": folder_scores,
        "insights": insights,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
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
