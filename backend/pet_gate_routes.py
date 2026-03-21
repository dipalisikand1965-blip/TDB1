"""
Pet-First Gating & WhatsApp Soul Drip Routes
=============================================
Implements the doctrine: "No member without a pet"

Features:
1. Pet requirement enforcement for key actions
2. Weekly WhatsApp Soul Drip system
3. Soul completeness tracking
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import logging
import os

logger = logging.getLogger(__name__)

# Routers
pet_gate_router = APIRouter(prefix="/api/pet-gate", tags=["Pet Gate"])
soul_drip_router = APIRouter(prefix="/api/soul-drip", tags=["Soul Drip"])

# Database reference
_db = None

def set_pet_gate_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# =============================================================================
# PET-FIRST GATING
# =============================================================================

class PetGateCheck(BaseModel):
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    action: str  # checkout, mira_chat, booking, etc.


@pet_gate_router.post("/check")
async def check_pet_requirement(request: PetGateCheck):
    """
    Check if user has at least one pet registered.
    Returns gate status and appropriate messaging.
    
    THE DOCTRINE: No member without a pet.
    """
    db = get_db()
    
    if not request.user_email and not request.user_id:
        return {
            "has_pet": False,
            "gate_open": False,
            "message": "Please sign in to continue",
            "action_required": "login",
            "cta": {
                "text": "Sign In",
                "route": "/login"
            }
        }
    
    # Check for pets
    query = {}
    if request.user_email:
        query["owner_email"] = request.user_email
    if request.user_id:
        query["owner_id"] = request.user_id
    
    pets = await db.pets.find(query, {"_id": 0, "id": 1, "name": 1}).to_list(10)
    
    if not pets:
        # Action-specific messaging
        messages = {
            "checkout": {
                "title": "Add Your Pet First",
                "message": "Before you checkout, let's get to know your furry friend! This helps us personalize your experience.",
                "benefit": "We'll remember their preferences, allergies, and favorites for future orders."
            },
            "mira_chat": {
                "title": "Who Are We Helping Today?",
                "message": "I'm Mira, your personal pet concierge. But first, I need to know who I'm helping!",
                "benefit": "Once I know your pet, I'll remember everything about them forever."
            },
            "booking": {
                "title": "Let's Meet Your Pet",
                "message": "To make the perfect booking, I need to know about your pet first.",
                "benefit": "This ensures we match them with the right services and accommodations."
            },
            "default": {
                "title": "Start Your Pet's Journey",
                "message": "Add your pet to unlock the full Doggy Company experience.",
                "benefit": "Personalized recommendations, health tracking, and so much more."
            }
        }
        
        msg = messages.get(request.action, messages["default"])
        
        return {
            "has_pet": False,
            "gate_open": False,
            "title": msg["title"],
            "message": msg["message"],
            "benefit": msg["benefit"],
            "action_required": "add_pet",
            "cta": {
                "text": "Add Your Pet",
                "route": "/pets/add"
            }
        }
    
    # User has pet(s) - gate is open
    return {
        "has_pet": True,
        "gate_open": True,
        "pets": pets,
        "pet_count": len(pets),
        "message": None
    }


@pet_gate_router.get("/status/{user_email}")
async def get_pet_gate_status(user_email: str):
    """Get pet gate status for a user"""
    db = get_db()
    
    pets = await db.pets.find(
        {"owner_email": user_email},
        {"_id": 0, "id": 1, "name": 1, "breed": 1, "photo_url": 1}
    ).to_list(10)
    
    return {
        "has_pet": len(pets) > 0,
        "gate_open": len(pets) > 0,
        "pets": pets,
        "pet_count": len(pets)
    }


# =============================================================================
# WHATSAPP SOUL DRIP
# =============================================================================

class DripQuestionResponse(BaseModel):
    pet_id: str
    question_id: str
    field: str
    response: str
    phone_number: Optional[str] = None


@soul_drip_router.get("/next-question/{pet_id}")
async def get_next_drip_question(pet_id: str):
    """
    Get the next appropriate question for the weekly soul drip.
    Returns None if soul is complete or recently asked.
    """
    try:
        from soul_intelligence import get_next_drip_question as get_next_q
        question = await get_next_q(pet_id)
        return {"question": question, "soul_complete": question is None}
    except Exception as e:
        logger.error(f"Error getting drip question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@soul_drip_router.post("/respond")
async def record_drip_response(response: DripQuestionResponse):
    """Record a response from the weekly drip and update Pet Soul"""
    try:
        from soul_intelligence import record_drip_response as record_response
        await record_response(
            response.pet_id,
            response.field,
            response.response,
            response.question_id
        )
        return {"success": True, "message": "Response recorded and Pet Soul updated"}
    except Exception as e:
        logger.error(f"Error recording drip response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@soul_drip_router.get("/completeness/{pet_id}")
async def get_soul_completeness(pet_id: str):
    """Get the completeness analysis of a Pet Soul"""
    db = get_db()
    
    try:
        from soul_intelligence import calculate_soul_completeness, get_known_fields
        
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        completeness = calculate_soul_completeness(pet)
        known = get_known_fields(pet)
        
        return {
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "completeness": completeness,
            "known_fields_count": len(known),
            "known_fields": list(known.keys())
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="Soul intelligence module not available")


@soul_drip_router.get("/pending")
async def get_pending_drip_messages():
    """
    Get all pets that should receive a drip message this week.
    Used by the WhatsApp sender job.
    """
    db = get_db()
    
    try:
        from soul_intelligence import get_next_drip_question as get_next_q, calculate_soul_completeness
        
        # Get all pets with active owners
        pets = await db.pets.find(
            {"owner_email": {"$exists": True}},
            {"_id": 0, "id": 1, "name": 1, "owner_email": 1, "owner_phone": 1}
        ).to_list(1000)
        
        pending = []
        
        for pet in pets:
            # Check if we've sent a drip this week
            last_drip = await db.soul_drip_history.find_one(
                {"pet_id": pet["id"]},
                sort=[("asked_at", -1)]
            )
            
            if last_drip:
                last_asked = datetime.fromisoformat(
                    last_drip.get("asked_at", "2000-01-01").replace("Z", "+00:00")
                )
                if last_asked > datetime.now(timezone.utc) - timedelta(days=7):
                    continue  # Skip - already sent this week
            
            # Get next question
            question = await get_next_q(pet["id"])
            if question:
                pending.append({
                    "pet_id": pet["id"],
                    "pet_name": pet["name"],
                    "owner_email": pet.get("owner_email"),
                    "owner_phone": pet.get("owner_phone"),
                    "question": question
                })
        
        return {
            "pending_count": len(pending),
            "pending": pending
        }
    except Exception as e:
        logger.error(f"Error getting pending drips: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@soul_drip_router.post("/send-whatsapp/{pet_id}")
async def trigger_whatsapp_drip(pet_id: str):
    """
    Manually trigger a WhatsApp drip message for a pet.
    Returns the message that would be sent (for testing).
    """
    db = get_db()
    
    try:
        from soul_intelligence import get_next_drip_question as get_next_q
        
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        question = await get_next_q(pet_id)
        if not question:
            return {
                "sent": False,
                "reason": "Soul is complete or recently asked",
                "pet_name": pet.get("name")
            }
        
        # Format WhatsApp message
        message = f"Hi! Quick question about {pet.get('name')}:\n\n{question['question']}"
        
        if question.get("options"):
            message += "\n\nReply with:"
            for i, opt in enumerate(question["options"], 1):
                message += f"\n{i}. {opt}"
        
        # Record that we sent this
        await db.soul_drip_history.insert_one({
            "pet_id": pet_id,
            "question_id": question["question_id"],
            "field": question["field"],
            "asked_at": datetime.now(timezone.utc).isoformat(),
            "channel": "whatsapp",
            "status": "sent"
        })
        
        # Here you would integrate with WhatsApp Business API
        # For now, return the message that would be sent
        
        return {
            "sent": True,
            "pet_name": pet.get("name"),
            "question": question,
            "whatsapp_message": message,
            "note": "WhatsApp Business API integration pending"
        }
        
    except Exception as e:
        logger.error(f"Error sending WhatsApp drip: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# INTELLIGENT COMMERCE FILTERING
# =============================================================================

class JourneyAnswerRequest(BaseModel):
    pet_id: str
    question_type: str  # e.g., "grooming_preference", "car_comfort"
    answer: str
    source: str = "journey_page"  # Track where the answer came from


@soul_drip_router.post("/journey-answer")
async def save_journey_answer(request: JourneyAnswerRequest):
    """
    Save an answer from the Pet Soul Journey "Gentle Next Step" questions.
    These answers go directly into the Pet Soul.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Map question types to soul fields
    question_field_map = {
        "grooming_preference": "grooming_style",
        "car_comfort": "car_rides",
        "food_texture": "texture_preference",
        "activity_level": "energetic_time",
        "social_preference": "social_preference",
        "sleep_location": "sleep_location",
        "treat_frequency": "treat_frequency",
        "vet_comfort": "vet_comfort"
    }
    
    field = question_field_map.get(request.question_type, request.question_type)
    
    try:
        from soul_intelligence import save_soul_enrichment
        
        # Save the answer to Pet Soul
        await save_soul_enrichment(request.pet_id, [{
            "field": field,
            "value": request.answer,
            "confidence": "high",
            "source": request.source
        }])
        
        # Also record in drip history for tracking
        await db.soul_drip_history.insert_one({
            "pet_id": request.pet_id,
            "question_id": f"journey_{request.question_type}",
            "field": field,
            "response": request.answer,
            "asked_at": now,
            "answered_at": now,
            "channel": "journey_page"
        })
        
        return {
            "success": True,
            "message": "Answer saved to Pet Soul",
            "field_updated": field
        }
        
    except Exception as e:
        logger.error(f"Error saving journey answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pet_gate_router.get("/pillar-preferences/{pet_id}")
async def get_pillar_preferences(pet_id: str):
    """
    Get all Pet Soul data organized by pillar.
    This powers the pillar-wise preferences view.
    """
    db = get_db()
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Pet")
    soul_answers = pet.get("doggy_soul_answers") or {}
    preferences = pet.get("preferences", {})
    celebrations = pet.get("celebrations", [])
    vault = pet.get("vault", {})
    pillar_interactions = pet.get("pillar_interactions", [])
    
    # Organize data by pillar
    pillars = {
        "identity_temperament": {
            "name": "Identity & Temperament",
            "icon": "🎭",
            "data": {
                "describe_3_words": soul_answers.get("describe_3_words"),
                "general_nature": soul_answers.get("general_nature"),
                "stranger_reaction": soul_answers.get("stranger_reaction"),
                "loud_sounds": soul_answers.get("loud_sounds"),
                "personality_tag": pet.get("soul", {}).get("personality_tag") if pet.get("soul") else None,
            }
        },
        "family_pack": {
            "name": "Family & Pack",
            "icon": "👨‍👩‍👧‍👦",
            "data": {
                "lives_with": soul_answers.get("lives_with"),
                "behavior_with_dogs": soul_answers.get("behavior_with_dogs"),
                "most_attached_to": soul_answers.get("most_attached_to"),
                "attention_seeking": soul_answers.get("attention_seeking"),
                "owner_name": pet.get("owner_name"),
                "owner_phone": pet.get("owner_phone"),
                "owner_email": pet.get("owner_email"),
            }
        },
        "rhythm_routine": {
            "name": "Rhythm & Routine",
            "icon": "⏰",
            "data": {
                "walks_per_day": soul_answers.get("walks_per_day"),
                "energetic_time": soul_answers.get("energetic_time"),
                "sleep_location": soul_answers.get("sleep_location"),
                "alone_comfort": soul_answers.get("alone_comfort"),
                "separation_anxiety": soul_answers.get("separation_anxiety"),
            }
        },
        "home_comforts": {
            "name": "Home Comforts",
            "icon": "🏠",
            "data": {
                "favorite_item": soul_answers.get("favorite_item"),
                "space_preference": soul_answers.get("space_preference"),
                "crate_trained": soul_answers.get("crate_trained"),
                "grooming_style": soul_answers.get("grooming_style"),
            }
        },
        "travel_style": {
            "name": "Travel Style",
            "icon": "✈️",
            "data": {
                "car_rides": soul_answers.get("car_rides"),
                "usual_travel": soul_answers.get("usual_travel"),
                "hotel_experience": soul_answers.get("hotel_experience"),
                "travel_anxiety": soul_answers.get("travel_anxiety"),
            }
        },
        "taste_treat": {
            "name": "Taste & Treat",
            "icon": "🍖",
            "data": {
                "favorite_treats": soul_answers.get("favorite_treats") or preferences.get("favorite_flavors"),
                "food_allergies": soul_answers.get("food_allergies") or preferences.get("allergies"),
                "texture_preference": preferences.get("texture_preference"),
                "treat_size": preferences.get("treat_size"),
                "prefers_grain_free": soul_answers.get("prefers_grain_free"),
                "diet_type": soul_answers.get("diet_type"),
            }
        },
        "training_behaviour": {
            "name": "Training & Behaviour",
            "icon": "🎓",
            "data": {
                "training_level": soul_answers.get("training_level"),
                "handling_comfort": soul_answers.get("handling_comfort"),
                "leash_behavior": soul_answers.get("leash_behavior"),
            }
        },
        "long_horizon": {
            "name": "Long Horizon",
            "icon": "🌅",
            "data": {
                "vaccinations": len(vault.get("vaccines", [])),
                "medications": len(vault.get("medications", [])),
                "vet_visits": len(vault.get("vet_visits", [])),
                "celebrations": celebrations,
                "birth_date": pet.get("birth_date"),
                "gotcha_date": pet.get("gotcha_date"),
            }
        }
    }
    
    # Clean up None values and calculate completeness per pillar
    for pillar_key, pillar_data in pillars.items():
        filled_count = sum(1 for v in pillar_data["data"].values() if v is not None and v != "" and v != [])
        total_count = len(pillar_data["data"])
        pillar_data["filled"] = filled_count
        pillar_data["total"] = total_count
        pillar_data["percentage"] = round((filled_count / total_count * 100) if total_count > 0 else 0)
        # Remove None values for cleaner response
        pillar_data["data"] = {k: v for k, v in pillar_data["data"].items() if v is not None and v != "" and v != []}
    
    # Get learning history
    learning_history = await db.soul_drip_history.find(
        {"pet_id": pet_id},
        {"_id": 0}
    ).sort("answered_at", -1).limit(20).to_list(20)
    
    # Get Mira conversation count for this pet
    mira_conversations = await db.mira_tickets.count_documents({
        "pet_id": pet_id
    })
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "breed": pet.get("breed"),
        "overall_score": pet.get("overall_score", 0),
        "folder_scores": pet.get("folder_scores", {}),
        "pillars": pillars,
        "learning_history": learning_history,
        "mira_conversations": mira_conversations,
        "pillar_interactions": pillar_interactions
    }


@pet_gate_router.get("/filter-products/{pet_id}")
async def get_filtered_products(pet_id: str, product_ids: List[str] = None, limit: int = 50):
    """
    Filter products based on Pet Soul - excluding harmful/irrelevant items.
    The doctrine: "Respect means never showing puppy treats to a senior dog."
    """
    db = get_db()
    
    try:
        from soul_intelligence import build_exclusion_filters, get_positive_filters
        
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Build exclusion filters
        exclusions = build_exclusion_filters(pet)
        
        # Base query
        query = {"status": "active"}
        
        # Add product_ids filter if provided
        if product_ids:
            query["id"] = {"$in": product_ids}
        
        # Apply exclusions
        if exclusions:
            query = {"$and": [query, exclusions]}
        
        # Fetch products
        products = await db.products_master.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        # Get boost conditions for sorting
        boosts = get_positive_filters(pet)
        
        return {
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "products": products,
            "filtered_count": len(products),
            "exclusions_applied": bool(exclusions),
            "boost_conditions": len(boosts) if boosts else 0
        }
        
    except ImportError:
        # Fallback - no filtering
        products = await db.products_master.find(
            {"status": "active"},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "pet_id": pet_id,
            "products": products,
            "filtered_count": len(products),
            "exclusions_applied": False
        }
