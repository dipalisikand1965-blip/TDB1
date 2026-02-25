"""
Mira Care Plan Intelligence
===========================
Mira KNOWS what the pet needs. She doesn't ask - she TELLS.

This module calculates proactive care recommendations based on:
- Pet's soul data (temperament, allergies, preferences)
- Pet's history (last_grooming, last_vet_visit, etc.)
- Time-based rules (grooming every 6 weeks, vet every 12 months)
- Soul-driven matching (anxious pets get gentle handlers)
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import os

# Router
care_plan_router = APIRouter(prefix="/api/mira", tags=["Mira Care Plan"])

# Get database
def get_db():
    from server import db
    return db


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CareRecommendation(BaseModel):
    id: str
    type: str  # grooming, vet_clinic_booking, boarding_daycare, etc.
    title: str
    reason: str  # Soul-driven explanation
    urgency: str  # urgent, recommended, upcoming, optional
    icon: str
    gradient: str
    action_label: str
    action_type: str  # book_service, schedule, learn_more
    metadata: dict = {}


class MiraCarePlan(BaseModel):
    pet_id: str
    pet_name: str
    pet_photo: Optional[str]
    pet_breed: Optional[str]
    soul_score: int
    soul_summary: str  # "Mira knows Bruno is cautious, allergic to fish..."
    recommendations: List[CareRecommendation]
    last_updated: str


# ═══════════════════════════════════════════════════════════════════════════════
# CARE INTELLIGENCE RULES
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_days_since(date_str: Optional[str]) -> Optional[int]:
    """Calculate days since a given date string."""
    if not date_str:
        return None
    try:
        if isinstance(date_str, datetime):
            date = date_str
        else:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return (datetime.now() - date.replace(tzinfo=None)).days
    except Exception:
        return None


def get_temperament_traits(pet: dict) -> List[str]:
    """Extract temperament traits from pet's soul data."""
    traits = []
    soul = pet.get('soul', {}) or {}
    
    # Check various soul fields for temperament info
    temperament = soul.get('temperament', '')
    if temperament:
        traits.append(temperament.lower())
    
    # Check personality traits
    personality = soul.get('personality', []) or []
    if isinstance(personality, list):
        traits.extend([p.lower() for p in personality])
    
    # Check behavior notes
    behavior = soul.get('behavior', '') or pet.get('behavior_notes', '')
    if behavior:
        if 'anxious' in behavior.lower() or 'nervous' in behavior.lower():
            traits.append('anxious')
        if 'cautious' in behavior.lower() or 'shy' in behavior.lower():
            traits.append('cautious')
        if 'friendly' in behavior.lower() or 'social' in behavior.lower():
            traits.append('friendly')
    
    # Check doggy soul answers if available
    doggy_soul = pet.get('doggy_soul', {}) or {}
    stranger_reaction = doggy_soul.get('stranger_reaction', '')
    if stranger_reaction:
        if 'hide' in stranger_reaction.lower() or 'bark' in stranger_reaction.lower():
            traits.append('cautious')
        elif 'friendly' in stranger_reaction.lower():
            traits.append('friendly')
    
    return list(set(traits))


def get_allergies(pet: dict) -> List[str]:
    """Extract allergies from pet's soul data."""
    allergies = []
    
    # Direct allergies field
    pet_allergies = pet.get('allergies', []) or []
    if isinstance(pet_allergies, list):
        allergies.extend(pet_allergies)
    elif isinstance(pet_allergies, str) and pet_allergies:
        allergies.append(pet_allergies)
    
    # Soul allergies
    soul = pet.get('soul', {}) or {}
    soul_allergies = soul.get('allergies', []) or []
    if isinstance(soul_allergies, list):
        allergies.extend(soul_allergies)
    
    # Doggy soul dietary restrictions
    doggy_soul = pet.get('doggy_soul', {}) or {}
    dietary = doggy_soul.get('dietary_restrictions', []) or []
    if isinstance(dietary, list):
        allergies.extend(dietary)
    
    return list(set([a.lower() for a in allergies if a]))


def generate_soul_summary(pet: dict, traits: List[str], allergies: List[str]) -> str:
    """Generate a Mira-style summary of what she knows about the pet."""
    name = pet.get('name', 'your pet')
    breed = pet.get('breed', '')
    
    parts = [f"Mira knows {name}"]
    
    if traits:
        trait_text = ', '.join(traits[:2])
        parts.append(f"is {trait_text}")
    
    if allergies:
        allergy_text = ', '.join(allergies[:2])
        parts.append(f"allergic to {allergy_text}")
    
    if breed:
        parts.append(f"and is a beautiful {breed}")
    
    return ' '.join(parts) + '.'


# ═══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATION GENERATORS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_grooming_recommendation(pet: dict, traits: List[str], care_history: dict) -> Optional[CareRecommendation]:
    """Generate grooming recommendation based on pet's needs."""
    name = pet.get('name', 'your pet')
    breed = pet.get('breed', '')
    
    last_grooming = care_history.get('last_grooming')
    days_since = calculate_days_since(last_grooming)
    
    # Determine urgency and reason
    is_anxious = any(t in traits for t in ['anxious', 'cautious', 'nervous', 'shy'])
    is_long_coat = breed and any(b in breed.lower() for b in ['shih tzu', 'maltese', 'poodle', 'golden', 'cocker', 'afghan', 'yorkshire', 'lhasa'])
    
    # Calculate recommendation
    if days_since is not None:
        if days_since > 56:  # 8+ weeks
            urgency = 'urgent'
            title = f"{name}'s coat needs attention"
            reason = f"Last groomed {days_since} days ago."
        elif days_since > 42:  # 6+ weeks
            urgency = 'recommended'
            title = f"Time for {name}'s grooming session"
            reason = f"It's been {days_since} days since the last groom."
        elif days_since > 28 and is_long_coat:  # 4+ weeks for long coats
            urgency = 'recommended'
            title = f"{name}'s coat could use some love"
            reason = f"Long-coated breeds like {breed}s benefit from regular grooming."
        else:
            return None  # No recommendation needed
    else:
        # No history - suggest first grooming
        urgency = 'recommended'
        title = f"Let's pamper {name}"
        reason = "Regular grooming keeps your pet healthy and happy."
    
    # Add temperament-specific note
    if is_anxious:
        reason += f" Because {name} can be cautious, I'll match gentle, patient groomers."
    
    return CareRecommendation(
        id='grooming_rec',
        type='grooming',
        title=title,
        reason=reason,
        urgency=urgency,
        icon='Scissors',
        gradient='from-pink-500 to-rose-600',
        action_label=f"Book {name}'s Groom",
        action_type='book_service',
        metadata={
            'service_type': 'grooming',
            'days_since_last': days_since,
            'gentle_handler_needed': is_anxious
        }
    )


def generate_vet_recommendation(pet: dict, traits: List[str], care_history: dict) -> Optional[CareRecommendation]:
    """Generate vet checkup recommendation based on pet's needs."""
    name = pet.get('name', 'your pet')
    age = pet.get('age', '')
    
    last_vet = care_history.get('last_vet_visit')
    days_since = calculate_days_since(last_vet)
    
    # Senior pets need more frequent checkups
    is_senior = False
    if age:
        try:
            age_num = int(''.join(filter(str.isdigit, str(age))))
            is_senior = age_num >= 7
        except Exception:
            pass
    
    # Calculate recommendation
    if days_since is not None:
        if days_since > 365:  # Over a year
            urgency = 'urgent' if is_senior else 'recommended'
            title = f"{name}'s annual checkup is overdue"
            reason = f"Last vet visit was {days_since // 30} months ago."
        elif days_since > 300 and is_senior:  # 10+ months for seniors
            urgency = 'recommended'
            title = f"Time to schedule {name}'s checkup"
            reason = "Senior pets benefit from more frequent health monitoring."
        elif days_since > 330:  # 11 months - upcoming reminder
            urgency = 'upcoming'
            title = f"{name}'s annual checkup is coming up"
            reason = "Proactive health checks catch issues early."
        else:
            return None
    else:
        # No history
        urgency = 'recommended'
        title = f"Schedule {name}'s wellness check"
        reason = "Regular vet visits keep your pet in top shape."
    
    is_anxious = any(t in traits for t in ['anxious', 'cautious', 'nervous'])
    if is_anxious:
        reason += " I can recommend vets experienced with nervous pets."
    
    return CareRecommendation(
        id='vet_rec',
        type='vet_clinic_booking',
        title=title,
        reason=reason,
        urgency=urgency,
        icon='Stethoscope',
        gradient='from-blue-500 to-indigo-600',
        action_label=f"Schedule {name}'s Checkup",
        action_type='book_service',
        metadata={
            'service_type': 'vet_clinic_booking',
            'days_since_last': days_since,
            'is_senior': is_senior,
            'anxiety_support_needed': is_anxious
        }
    )


def generate_boarding_recommendation(pet: dict, traits: List[str], care_history: dict) -> Optional[CareRecommendation]:
    """Generate boarding/daycare recommendation if relevant."""
    name = pet.get('name', 'your pet')
    
    # Check if pet has used boarding before
    last_boarding = care_history.get('last_boarding')
    has_boarding_history = last_boarding is not None
    
    is_social = any(t in traits for t in ['friendly', 'social', 'playful'])
    is_anxious = any(t in traits for t in ['anxious', 'cautious', 'nervous'])
    
    # Only recommend if pet is social or has history
    if not has_boarding_history and not is_social:
        return None
    
    if is_social:
        title = f"{name} might enjoy daycare socialization"
        reason = f"Social pets like {name} thrive with regular playmates."
        urgency = 'optional'
    elif has_boarding_history:
        title = f"Planning a trip? {name}'s care is covered"
        reason = "Your trusted boarding facility is a tap away."
        urgency = 'optional'
    else:
        return None
    
    if is_anxious:
        reason += " I'll match calm, low-stress environments for sensitive pets."
    
    return CareRecommendation(
        id='boarding_rec',
        type='boarding_daycare',
        title=title,
        reason=reason,
        urgency=urgency,
        icon='Building2',
        gradient='from-emerald-500 to-teal-600',
        action_label=f"Find Care for {name}",
        action_type='book_service',
        metadata={
            'service_type': 'boarding_daycare',
            'social_pet': is_social,
            'calm_environment_needed': is_anxious
        }
    )


def generate_behavior_recommendation(pet: dict, traits: List[str], care_history: dict) -> Optional[CareRecommendation]:
    """Generate behavior/anxiety support recommendation if pet shows signs."""
    name = pet.get('name', 'your pet')
    
    is_anxious = any(t in traits for t in ['anxious', 'cautious', 'nervous', 'fearful', 'reactive'])
    
    if not is_anxious:
        return None
    
    return CareRecommendation(
        id='behavior_rec',
        type='behavior_anxiety_support',
        title=f"Support for {name}'s anxiety",
        reason=f"Mira noticed {name} can be cautious. Gentle behavior support can help build confidence.",
        urgency='optional',
        icon='Heart',
        gradient='from-purple-500 to-violet-600',
        action_label=f"Get Support for {name}",
        action_type='book_service',
        metadata={
            'service_type': 'behavior_anxiety_support',
            'traits': [t for t in traits if t in ['anxious', 'cautious', 'nervous', 'fearful']]
        }
    )


def generate_senior_recommendation(pet: dict, traits: List[str], care_history: dict) -> Optional[CareRecommendation]:
    """Generate senior care recommendation for older pets."""
    name = pet.get('name', 'your pet')
    age = pet.get('age', '')
    
    # Check if senior
    is_senior = False
    age_num = 0
    if age:
        try:
            age_num = int(''.join(filter(str.isdigit, str(age))))
            is_senior = age_num >= 7
        except Exception:
            pass
    
    if not is_senior:
        return None
    
    return CareRecommendation(
        id='senior_rec',
        type='senior_special_needs_support',
        title=f"Special care for {name}'s golden years",
        reason=f"At {age_num} years young, {name} deserves extra comfort and attention.",
        urgency='recommended' if age_num >= 10 else 'optional',
        icon='Award',
        gradient='from-amber-500 to-orange-600',
        action_label=f"Senior Care for {name}",
        action_type='book_service',
        metadata={
            'service_type': 'senior_special_needs_support',
            'pet_age': age_num
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN API ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@care_plan_router.get("/care-plan/{pet_id}", response_model=MiraCarePlan)
async def get_mira_care_plan(pet_id: str):
    """
    Get Mira's proactive care plan for a pet.
    
    Mira KNOWS what the pet needs based on:
    - Soul data (temperament, allergies, preferences)
    - Care history (last grooming, last vet visit, etc.)
    - Time-based intelligence (grooming every 6 weeks, etc.)
    """
    db = get_db()
    
    # Get pet data
    from bson import ObjectId
    try:
        pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    except Exception:
        pet = await db.pets.find_one({"id": pet_id})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Extract soul intelligence
    traits = get_temperament_traits(pet)
    allergies = get_allergies(pet)
    soul_summary = generate_soul_summary(pet, traits, allergies)
    
    # Get care history (from pet record or care_history collection)
    care_history = pet.get('care_history', {}) or {}
    
    # Also check for service desk tickets to infer history
    pet_name = pet.get('name', '')
    if pet_name:
        # Check recent grooming tickets
        recent_grooming = await db.service_desk_tickets.find_one(
            {"pet_name": pet_name, "service_type": {"$in": ["grooming", "GROOMING"]}},
            sort=[("created_at", -1)]
        )
        if recent_grooming and not care_history.get('last_grooming'):
            care_history['last_grooming'] = recent_grooming.get('created_at')
        
        # Check recent vet tickets
        recent_vet = await db.service_desk_tickets.find_one(
            {"pet_name": pet_name, "service_type": {"$in": ["vet", "vet_clinic_booking", "VET"]}},
            sort=[("created_at", -1)]
        )
        if recent_vet and not care_history.get('last_vet_visit'):
            care_history['last_vet_visit'] = recent_vet.get('created_at')
    
    # Generate recommendations
    recommendations = []
    
    # 1. Grooming
    grooming_rec = generate_grooming_recommendation(pet, traits, care_history)
    if grooming_rec:
        recommendations.append(grooming_rec)
    
    # 2. Vet checkup
    vet_rec = generate_vet_recommendation(pet, traits, care_history)
    if vet_rec:
        recommendations.append(vet_rec)
    
    # 3. Behavior support (if anxious)
    behavior_rec = generate_behavior_recommendation(pet, traits, care_history)
    if behavior_rec:
        recommendations.append(behavior_rec)
    
    # 4. Senior care (if applicable)
    senior_rec = generate_senior_recommendation(pet, traits, care_history)
    if senior_rec:
        recommendations.append(senior_rec)
    
    # 5. Boarding/daycare (if social or has history)
    boarding_rec = generate_boarding_recommendation(pet, traits, care_history)
    if boarding_rec:
        recommendations.append(boarding_rec)
    
    # Sort by urgency
    urgency_order = {'urgent': 0, 'recommended': 1, 'upcoming': 2, 'optional': 3}
    recommendations.sort(key=lambda r: urgency_order.get(r.urgency, 99))
    
    # Build response
    return MiraCarePlan(
        pet_id=pet_id,
        pet_name=pet.get('name', 'Your Pet'),
        pet_photo=pet.get('photo'),
        pet_breed=pet.get('breed'),
        soul_score=pet.get('soul_score', pet.get('overall_score', 50)),
        soul_summary=soul_summary,
        recommendations=recommendations,
        last_updated=datetime.now().isoformat()
    )


@care_plan_router.get("/care-plan/by-user/{user_id}")
async def get_care_plan_for_user(user_id: str):
    """Get care plan for the first pet of a user."""
    db = get_db()
    
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's first pet
    pet = await db.pets.find_one({"parent_email": user.get('email')})
    if not pet:
        raise HTTPException(status_code=404, detail="No pets found for user")
    
    pet_id = str(pet.get('_id', pet.get('id')))
    return await get_mira_care_plan(pet_id)
