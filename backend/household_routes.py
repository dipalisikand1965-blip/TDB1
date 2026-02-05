"""
Multi-Pet Household Routes for The Doggy Company
Handles household info, pet additions, and family recommendations
"""

import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
household_router = APIRouter(prefix="/api", tags=["Household"])

# Database reference
db: AsyncIOMotorDatabase = None

# Dependencies
_generate_pet_pass_number_func = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_dependencies(generate_pet_pass_number_func):
    """Inject dependencies from server.py"""
    global _generate_pet_pass_number_func
    _generate_pet_pass_number_func = generate_pet_pass_number_func


def calculate_pet_soul_score(pet: dict) -> int:
    """Calculate Pet Soul completeness score"""
    soul_answers = pet.get("doggy_soul_answers", {})
    if not soul_answers:
        return 0
    
    # Count filled fields
    filled = sum(1 for v in soul_answers.values() if v and v not in ['', [], None, 'Unknown'])
    total_possible = 24  # Expected total fields across 8 pillars
    
    return min(100, int((filled / total_possible) * 100))


@household_router.get("/household/{user_email}")
async def get_household_info(user_email: str):
    """Get multi-pet household information and special features"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pets = await db.pets.find({"owner_email": user_email}).to_list(length=20)
    
    # Calculate household benefits
    pet_count = len(pets)
    is_multi_pet = pet_count > 1
    
    # Multi-pet household benefits
    benefits = {
        "family_discount": 10 if is_multi_pet else 0,  # 10% discount on orders
        "shared_delivery": is_multi_pet,  # Combine shipments
        "bulk_pricing": pet_count >= 3,  # Bulk pricing for 3+ pets
        "family_events": is_multi_pet,  # Group birthday celebrations
    }
    
    # Calculate shared preferences (what all pets have in common)
    shared_allergies = set()
    
    for pet in pets:
        soul = pet.get("doggy_soul_answers", {})
        allergies = soul.get("food_allergies", [])
        if isinstance(allergies, list):
            if shared_allergies:
                shared_allergies = shared_allergies.intersection(set(allergies))
            else:
                shared_allergies = set(allergies)
    
    return {
        "household": {
            "owner_name": user.get("name"),
            "owner_email": user_email,
            "pet_count": pet_count,
            "is_multi_pet": is_multi_pet
        },
        "pets": [{
            "id": pet.get("id"),
            "name": pet.get("name"),
            "breed": pet.get("breed"),
            "species": pet.get("species"),
            "soul_score": calculate_pet_soul_score(pet)
        } for pet in pets],
        "benefits": benefits,
        "shared_restrictions": list(shared_allergies) if shared_allergies else [],
        "recommendations": {
            "shared_treats": is_multi_pet,  # Recommend treats all pets can have
            "family_pack": pet_count >= 2,  # Family-sized portions
            "group_grooming": pet_count >= 2  # Group grooming discounts
        }
    }


@household_router.post("/household/{user_email}/add-pet")
async def add_pet_to_household(user_email: str, pet_data: dict):
    """Add a new pet to an existing household"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pet_id = str(uuid.uuid4())
    
    # Generate pet pass number
    pet_pass_number = None
    if _generate_pet_pass_number_func:
        pet_pass_number = await _generate_pet_pass_number_func()
    
    pet_doc = {
        "id": pet_id,
        "pet_pass_number": pet_pass_number,
        "name": pet_data.get("name"),
        "breed": pet_data.get("breed"),
        "species": pet_data.get("species", "dog"),
        "gender": pet_data.get("gender"),
        "date_of_birth": pet_data.get("birth_date"),
        "gotcha_day": pet_data.get("gotcha_date"),
        "weight": pet_data.get("weight"),
        "weight_unit": pet_data.get("weight_unit", "kg"),
        "is_neutered": pet_data.get("is_neutered", False),
        "owner_email": user_email,
        "owner_name": user.get("name"),
        "owner_id": user.get("id"),
        "doggy_soul_answers": {},
        "soul_enrichments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.insert_one(pet_doc)
    
    # Update user's pet_ids
    pet_ids = user.get("pet_ids", [])
    pet_ids.append(pet_id)
    await db.users.update_one(
        {"email": user_email},
        {"$set": {"pet_ids": pet_ids}}
    )
    
    # Calculate additional membership fee (if applicable)
    membership_type = user.get("membership_type", "annual")
    additional_fee = 2499 if membership_type == "annual" else 249
    
    logger.info(f"Added pet {pet_data.get('name')} to household {user_email}")
    
    return {
        "success": True,
        "pet_id": pet_id,
        "pet_name": pet_data.get("name"),
        "household_pet_count": len(pet_ids),
        "additional_membership_fee": additional_fee,
        "message": f"{pet_data.get('name')} added to your family! Additional membership fee: ₹{additional_fee}/{'year' if membership_type == 'annual' else 'month'}"
    }


@household_router.get("/household/{user_email}/recommendations")
async def get_household_recommendations(user_email: str):
    """Get product recommendations suitable for entire household (respecting all allergies)"""
    pets = await db.pets.find({"owner_email": user_email}).to_list(length=20)
    
    if not pets:
        raise HTTPException(status_code=404, detail="No pets found for this household")
    
    # Collect all allergies across all pets
    all_allergies = set()
    for pet in pets:
        soul = pet.get("doggy_soul_answers", {})
        allergies = soul.get("food_allergies", [])
        if isinstance(allergies, list):
            for a in allergies:
                if a and a.lower() not in ['no', 'none', 'other']:
                    all_allergies.add(a.lower())
    
    # Find products safe for all pets
    query = {}
    if all_allergies:
        # Exclude products containing any allergen using $nor with individual regex checks
        nor_conditions = []
        for allergen in all_allergies:
            nor_conditions.append({"name": {"$regex": allergen, "$options": "i"}})
            nor_conditions.append({"description": {"$regex": allergen, "$options": "i"}})
            nor_conditions.append({"ingredients": {"$regex": allergen, "$options": "i"}})
        query["$nor"] = nor_conditions
    
    # Get safe products
    safe_products = await db.products_master.find(query).limit(20).to_list(length=20)
    
    return {
        "household_allergies": list(all_allergies),
        "pet_count": len(pets),
        "pets": [{"name": p.get("name"), "id": p.get("id")} for p in pets],
        "safe_for_all_products": [{
            "id": str(p.get("_id", p.get("id", ""))),
            "name": p.get("name") or p.get("title", "Untitled"),
            "price": p.get("price", 0),
            "image": p.get("image_url") or (p.get("images", [{}])[0].get("src") if p.get("images") else None)
        } for p in safe_products],
        "message": f"Found {len(safe_products)} products safe for all {len(pets)} pets in your household"
    }
