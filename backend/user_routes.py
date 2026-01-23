"""
User & Pet Routes for The Doggy Company
Handles user profiles, pet profiles, and celebrations
"""

import os
import logging
import uuid
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
user_router = APIRouter(prefix="/api", tags=["Users & Pets"])

# Database reference
db: AsyncIOMotorDatabase = None

# Auth dependency - will be injected
get_current_user = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


async def generate_pet_pass_number() -> str:
    """
    Generate a unique Pet Pass Number for a pet.
    Format: TDC-XXXXXX (6 alphanumeric characters)
    """
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        pet_pass = f"TDC-{code}"
        existing = await db.pets.find_one({"pet_pass_number": pet_pass})
        if not existing:
            return pet_pass


def set_auth_dependencies(get_user_func):
    global get_current_user
    get_current_user = get_user_func


# ==================== CONSTANTS ====================

DOG_PERSONAS = [
    {"id": "adventurer", "name": "The Adventurer", "description": "Loves outdoor activities, hiking, and exploring"},
    {"id": "socialite", "name": "The Socialite", "description": "A social butterfly who loves meeting other dogs"},
    {"id": "couch_potato", "name": "The Couch Potato", "description": "Prefers lounging and relaxing at home"},
    {"id": "foodie", "name": "The Foodie", "description": "Lives for treats and mealtimes"},
    {"id": "athlete", "name": "The Athlete", "description": "High energy, loves running and playing"},
    {"id": "guardian", "name": "The Guardian", "description": "Protective and loyal to their family"},
    {"id": "entertainer", "name": "The Entertainer", "description": "Always doing funny things to get attention"},
    {"id": "scholar", "name": "The Scholar", "description": "Quick learner who loves training"},
]

CELEBRATION_OCCASIONS = [
    {"id": "birthday", "name": "Birthday", "emoji": "🎂", "message_template": "It's {pet_name}'s birthday!"},
    {"id": "gotcha_day", "name": "Gotcha Day", "emoji": "🏠", "message_template": "{pet_name}'s adoption anniversary!"},
    {"id": "graduation", "name": "Training Graduation", "emoji": "🎓", "message_template": "{pet_name} graduated training!"},
    {"id": "first_walk", "name": "First Walk Anniversary", "emoji": "🚶", "message_template": "{pet_name}'s first walk anniversary!"},
    {"id": "best_friend_day", "name": "Best Friend Day", "emoji": "💕", "message_template": "Celebrating {pet_name}, our best friend!"},
    {"id": "halloween", "name": "Halloween", "emoji": "🎃", "message_template": "Spooky celebration for {pet_name}!"},
    {"id": "christmas", "name": "Christmas", "emoji": "🎄", "message_template": "Merry Christmas, {pet_name}!"},
    {"id": "diwali", "name": "Diwali", "emoji": "🪔", "message_template": "Happy Diwali to {pet_name}!"},
    {"id": "custom", "name": "Custom Celebration", "emoji": "🎉", "message_template": "Celebrating {pet_name}!"},
]


# ==================== MODELS ====================

class PetSoulProfile(BaseModel):
    persona: Optional[str] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    friendliness: Optional[int] = Field(None, ge=1, le=5)
    quirks: Optional[List[str]] = []
    favorite_activities: Optional[List[str]] = []


class PetPreferences(BaseModel):
    dietary_restrictions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    favorite_flavors: Optional[List[str]] = []
    preferred_treat_size: Optional[str] = None
    feeding_schedule: Optional[str] = None


class PetCelebration(BaseModel):
    occasion: str
    date: str
    is_recurring: bool = True
    custom_name: Optional[str] = None
    notes: Optional[str] = None


class PetProfileCreate(BaseModel):
    name: str
    species: str = "dog"
    breed: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None
    owner_name: str
    owner_email: str
    owner_phone: Optional[str] = None
    city: Optional[str] = None
    soul: Optional[PetSoulProfile] = None
    preferences: Optional[PetPreferences] = None
    celebrations: Optional[List[PetCelebration]] = []


class PetProfileUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    city: Optional[str] = None
    soul: Optional[PetSoulProfile] = None
    preferences: Optional[PetPreferences] = None
    celebrations: Optional[List[PetCelebration]] = None


# ==================== PETS ROUTES ====================

@user_router.get("/pets/personas")
async def get_pet_personas():
    """Get all available dog persona types"""
    return {"personas": DOG_PERSONAS}


@user_router.get("/pets/occasions")
async def get_celebration_occasions():
    """Get all available celebration occasions"""
    return {"occasions": CELEBRATION_OCCASIONS}


@user_router.post("/pets")
async def create_pet_profile(pet: PetProfileCreate):
    """Create a new pet profile"""
    pet_id = f"pet-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    pet_data = {
        "id": pet_id,
        **pet.model_dump(),
        "achievements": [],
        "order_history": [],
        "created_at": now,
        "updated_at": now
    }

    # Auto-add birthday and gotcha day to celebrations if dates provided
    celebrations = list(pet.celebrations) if pet.celebrations else []

    if pet.birth_date and not any(c.occasion == "birthday" for c in celebrations):
        celebrations.append(PetCelebration(
            occasion="birthday",
            date=pet.birth_date,
            is_recurring=True
        ))

    if pet.gotcha_date and not any(c.occasion == "gotcha_day" for c in celebrations):
        celebrations.append(PetCelebration(
            occasion="gotcha_day",
            date=pet.gotcha_date,
            is_recurring=True
        ))

    pet_data["celebrations"] = [c.model_dump() for c in celebrations]

    await db.pets.insert_one(pet_data)
    pet_data.pop("_id", None)

    logger.info(f"Created pet profile: {pet_id} - {pet.name}")
    return {"message": "Pet profile created", "pet": pet_data}


@user_router.get("/pets/{pet_id}")
async def get_pet_profile(pet_id: str):
    """Get a specific pet profile"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@user_router.put("/pets/{pet_id}")
async def update_pet_profile(pet_id: str, updates: PetProfileUpdate):
    """Update a pet profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Handle nested objects properly
    if "soul" in update_data and update_data["soul"]:
        update_data["soul"] = updates.soul.model_dump()
    if "preferences" in update_data and update_data["preferences"]:
        update_data["preferences"] = updates.preferences.model_dump()
    if "celebrations" in update_data and update_data["celebrations"]:
        update_data["celebrations"] = [c.model_dump() for c in updates.celebrations]

    await db.pets.update_one({"id": pet_id}, {"$set": update_data})

    updated_pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    return {"message": "Pet profile updated", "pet": updated_pet}


@user_router.delete("/pets/{pet_id}")
async def delete_pet_profile(pet_id: str):
    """Delete a pet profile"""
    result = await db.pets.delete_one({"id": pet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"message": "Pet profile deleted"}


# ==================== CELEBRATION ROUTES ====================

@user_router.post("/pets/{pet_id}/celebrations")
async def add_pet_celebration(pet_id: str, celebration: PetCelebration):
    """Add a celebration date to a pet's profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    celebrations = pet.get("celebrations", [])
    celebrations.append(celebration.model_dump())

    await db.pets.update_one(
        {"id": pet_id},
        {
            "$set": {
                "celebrations": celebrations,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    return {"message": "Celebration added", "celebrations": celebrations}


@user_router.delete("/pets/{pet_id}/celebrations/{occasion}")
async def remove_pet_celebration(pet_id: str, occasion: str):
    """Remove a celebration from a pet's profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    celebrations = [c for c in pet.get("celebrations", []) if c.get("occasion") != occasion]

    await db.pets.update_one(
        {"id": pet_id},
        {
            "$set": {
                "celebrations": celebrations,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    return {"message": "Celebration removed", "celebrations": celebrations}


@user_router.get("/pets/{pet_id}/upcoming-celebrations")
async def get_upcoming_celebrations(pet_id: str, days: int = 30):
    """Get upcoming celebrations for a specific pet"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    today = datetime.now(timezone.utc).date()
    upcoming = []

    for celebration in pet.get("celebrations", []):
        try:
            date_str = celebration.get("date", "")
            if not date_str:
                continue

            # Parse the date (handle various formats)
            if "T" in date_str:
                date_str = date_str.split("T")[0]

            parts = date_str.split("-")
            month, day = int(parts[1]), int(parts[2])

            # Calculate this year's celebration date
            this_year_date = today.replace(month=month, day=day)

            # If it's passed this year and recurring, check next year
            if this_year_date < today and celebration.get("is_recurring", True):
                this_year_date = this_year_date.replace(year=today.year + 1)

            days_until = (this_year_date - today).days

            if 0 <= days_until <= days:
                upcoming.append({
                    "pet_id": pet_id,
                    "pet_name": pet.get("name"),
                    "pet_photo": pet.get("photo_url"),
                    "owner_name": pet.get("owner_name"),
                    "owner_email": pet.get("owner_email"),
                    "occasion": celebration.get("occasion"),
                    "custom_name": celebration.get("custom_name"),
                    "date": this_year_date.isoformat(),
                    "days_until": days_until,
                    "is_recurring": celebration.get("is_recurring", True)
                })
        except Exception as e:
            logger.warning(f"Error processing celebration for pet {pet_id}: {e}")
            continue

    return {"upcoming": sorted(upcoming, key=lambda x: x["days_until"])}


@user_router.post("/pets/{pet_id}/achievements")
async def add_pet_achievement(pet_id: str, achievement: dict):
    """Add an achievement to a pet's profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    achievement["earned_at"] = datetime.now(timezone.utc).isoformat()
    achievement["id"] = f"ach-{uuid.uuid4().hex[:8]}"

    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"achievements": achievement},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )

    return {"message": "Achievement added", "achievement": achievement}
