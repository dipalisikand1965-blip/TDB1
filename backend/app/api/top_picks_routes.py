"""
Top Picks API - Personalized picks for each pet across all pillars
"Mira is the Brain, Concierge® is the Hands"

This endpoint powers the "Top Picks for [Pet]" panel that shows
intelligent, pet-aware recommendations across all pillars.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/mira", tags=["top-picks"])

# Module-level database reference
db: AsyncIOMotorDatabase = None

def set_top_picks_db(database: AsyncIOMotorDatabase):
    """Set the database reference for top picks routes."""
    global db
    db = database
    logger.info("Top Picks routes initialized with database")

# Pillars to include in Top Picks (excluding Adopt & Farewell)
INCLUDED_PILLARS = [
    {"id": "celebrate", "name": "Celebrate", "emoji": "🎂", "color": "#EC4899"},
    {"id": "dine", "name": "Dine", "emoji": "🍽️", "color": "#F97316"},
    {"id": "care", "name": "Care", "emoji": "🛁", "color": "#8B5CF6"},
    {"id": "stay", "name": "Stay", "emoji": "🏨", "color": "#3B82F6"},
    {"id": "travel", "name": "Travel", "emoji": "✈️", "color": "#06B6D4"},
    {"id": "learn", "name": "Learn", "emoji": "📚", "color": "#10B981"},
    {"id": "fit", "name": "Fit", "emoji": "🏋️", "color": "#EF4444"},
    {"id": "enjoy", "name": "Enjoy", "emoji": "🎉", "color": "#F59E0B"},
    {"id": "advisory", "name": "Advisory", "emoji": "💬", "color": "#6366F1"},
    {"id": "paperwork", "name": "Paperwork", "emoji": "📋", "color": "#64748B"},
    {"id": "shop", "name": "Shop", "emoji": "🛒", "color": "#EC4899"},
]

# Safety blocked ingredients/items
BLOCKED_ITEMS = ["xylitol", "chocolate", "grapes", "raisins", "onion", "garlic", "macadamia"]

# Seasonal events configuration
SEASONAL_EVENTS = {
    "valentine": {"months": [2], "days": (1, 14), "categories": ["treats", "bandana", "gift", "hamper"], "boost": 30},
    "diwali": {"months": [10, 11], "days": (15, 15), "categories": ["calming", "safety", "festive", "treats"], "boost": 25},
    "christmas": {"months": [12], "days": (1, 31), "categories": ["gift", "hamper", "festive", "treats"], "boost": 30},
    "monsoon": {"months": [6, 7, 8, 9], "days": (1, 31), "categories": ["raincoat", "paw-care", "grooming"], "boost": 20},
    "summer": {"months": [4, 5, 6], "days": (1, 31), "categories": ["cooling", "hydration", "pool", "outdoor"], "boost": 15},
}

def get_current_season() -> dict:
    """Get current seasonal event if any."""
    now = datetime.now()
    month = now.month
    day = now.day
    
    for event_name, config in SEASONAL_EVENTS.items():
        if month in config["months"]:
            day_start, day_end = config["days"]
            if day_start <= day <= day_end or day_end == 31:  # Full month
                return {"event": event_name, "categories": config["categories"], "boost": config["boost"]}
    
    return None

def is_pet_birthday_near(pet: dict) -> dict:
    """Check if pet's birthday is within 14 days."""
    dob = pet.get("date_of_birth") or pet.get("birthday")
    if not dob:
        return None
    
    try:
        bday = datetime.fromisoformat(str(dob).replace('Z', '+00:00'))
        now = datetime.now()
        this_year_bday = bday.replace(year=now.year)
        days_until = (this_year_bday - now).days
        
        if -7 <= days_until <= 14:
            return {"days_until": days_until, "boost": 40 if days_until <= 7 else 25}
    except:
        pass
    
    return None

def get_smart_badges(product: dict, pet: dict, pillar: str, purchase_history: list = None) -> list:
    """Generate smart badges for a product."""
    badges = []
    season = get_current_season()
    birthday_info = is_pet_birthday_near(pet)
    category = (product.get("category") or "").lower()
    name = (product.get("name") or "").lower()
    
    # Trending badge (based on score or popularity)
    if product.get("popularity_score", 0) > 70 or product.get("score", 0) > 80:
        badges.append("trending")
    
    # New badge (created in last 30 days)
    created_at = product.get("created_at")
    if created_at:
        try:
            created = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
            if (datetime.now() - created).days < 30:
                badges.append("new")
        except:
            pass
    
    # Reorder badge (previously purchased)
    if purchase_history and product.get("id") in purchase_history:
        badges.append("reorder")
    
    # Birthday badge
    if birthday_info and pillar in ["celebrate", "shop"]:
        if any(kw in category or kw in name for kw in ["birthday", "cake", "party", "celebration", "gift"]):
            badges.append("birthday")
    
    # Seasonal badge
    if season:
        if any(cat in category or cat in name for cat in season["categories"]):
            badges.append("seasonal")
    
    return badges


def is_safe_for_pet(product: dict, pet_allergies: list, pet_health_flags: list) -> bool:
    """Check if a product is safe for this specific pet."""
    # Get product ingredients/tags
    product_name = (product.get("name") or "").lower()
    product_desc = (product.get("description") or product.get("short_description") or "").lower()
    diet_tags = product.get("diet_tags") or []
    
    # Check global blocked items
    for blocked in BLOCKED_ITEMS:
        if blocked in product_name or blocked in product_desc:
            return False
    
    # Check pet-specific allergies
    for allergy in pet_allergies:
        allergy_lower = allergy.lower()
        # Skip if allergy is in product name/description (strict filter)
        if allergy_lower in product_name:
            return False
        # Check diet tags
        if allergy_lower in [t.lower() for t in diet_tags]:
            return False
    
    return True


def build_why_reason(product: dict, pet: dict, pillar: str) -> str:
    """Generate a personalized 'why this pick' reason."""
    pet_name = pet.get("name", "your pet")
    pet_breed = pet.get("breed", "")
    
    breed_tags = product.get("breed_tags") or []
    occasion_tags = product.get("occasion_tags") or []
    
    # Breed-specific match
    if pet_breed and pet_breed.lower() in [t.lower() for t in breed_tags]:
        return f"Perfect for {pet_breed}s like {pet_name}"
    
    # Occasion match
    if pillar == "celebrate" and "birthday" in occasion_tags:
        return f"🎂 Great for {pet_name}'s special day!"
    
    # Generic pillar-based reasons
    reasons = {
        "celebrate": f"Curated celebration pick for {pet_name}",
        "dine": f"Tasty & safe for {pet_name}'s diet",
        "care": f"Helps keep {pet_name} healthy & happy",
        "stay": f"Comfort essentials for {pet_name}",
        "travel": f"Travel-ready for adventures with {pet_name}",
        "learn": f"Training support for {pet_name}",
        "fit": f"Keeps {pet_name} active & fit",
        "enjoy": f"Fun times for {pet_name}",
        "advisory": f"Expert guidance for {pet_name}'s wellbeing",
        "paperwork": f"Stay organized for {pet_name}",
        "shop": f"Top pick for {pet_name}",
    }
    
    return reasons.get(pillar, f"Recommended for {pet_name}")


async def get_pillar_picks(
    db: AsyncIOMotorDatabase,
    pillar: str,
    pet: dict,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """Get top picks for a specific pillar, filtered by pet parameters."""
    
    pet_allergies = pet.get("preferences", {}).get("allergies") or []
    pet_size = pet.get("weight_kg", 15)  # Default medium
    pet_breed = pet.get("breed", "")
    pet_age = pet.get("age_years") or 3  # Default adult
    pet_health_flags = pet.get("health_vault", {}).get("conditions") or []
    
    # Determine size category
    if pet_size < 10:
        size_cat = "small"
    elif pet_size < 25:
        size_cat = "medium"
    else:
        size_cat = "large"
    
    # Determine life stage
    if pet_age and pet_age < 1:
        life_stage = "puppy"
    elif pet_age and pet_age > 7:
        life_stage = "senior"
    else:
        life_stage = "adult"
    
    picks = []
    
    # Query products for this pillar
    query = {
        "$or": [
            {"pillar": pillar},
            {"primary_pillar": pillar},
            {"pillars": pillar}
        ],
        "in_stock": True,
        "visibility.status": "active"
    }
    
    cursor = db.unified_products.find(query, {"_id": 0}).limit(20)
    products = await cursor.to_list(length=20)
    
    # Also get services for this pillar
    service_cursor = db.services.find({"pillar": pillar}, {"_id": 0}).limit(10)
    services = await service_cursor.to_list(length=10)
    
    # Filter and score products
    for product in products:
        if not is_safe_for_pet(product, pet_allergies, pet_health_flags):
            continue
        
        # Calculate relevance score
        score = 50  # Base score
        
        # Boost for breed match
        breed_tags = product.get("breed_tags") or []
        if pet_breed and pet_breed.lower() in [t.lower() for t in breed_tags]:
            score += 30
        if "all_breeds" in breed_tags:
            score += 10
        
        # Boost for size match
        size_tags = product.get("size_tags") or []
        if size_cat in [t.lower() for t in size_tags] or "all_sizes" in size_tags:
            score += 15
        
        # Boost for life stage match
        lifestage_tags = product.get("lifestage_tags") or []
        if life_stage in [t.lower() for t in lifestage_tags]:
            score += 15
        
        # Seasonal boost
        season = get_current_season()
        if season:
            category = (product.get("category") or "").lower()
            name = (product.get("name") or "").lower()
            if any(cat in category or cat in name for cat in season["categories"]):
                score += season["boost"]
        
        # Birthday boost
        birthday_info = is_pet_birthday_near(pet)
        if birthday_info and pillar == "celebrate":
            score += birthday_info["boost"]
        
        # Get smart badges
        badges = get_smart_badges(product, pet, pillar)
        
        picks.append({
            "id": product.get("id") or product.get("shopify_id"),
            "name": product.get("name"),
            "price": product.get("price") or product.get("base_price"),
            "image": product.get("image") or product.get("thumbnail"),
            "type": "product",
            "pick_type": "catalogue",
            "why_reason": build_why_reason(product, pet, pillar),
            "score": score,
            "category": product.get("category"),
            "badges": badges,
            "created_at": product.get("created_at"),
        })
    
    # Add services
    for service in services:
        badges = get_smart_badges(service, pet, pillar)
        picks.append({
            "id": service.get("id") or service.get("service_id"),
            "name": service.get("name"),
            "price": service.get("price") or service.get("base_price"),
            "image": service.get("image") or service.get("icon"),
            "type": "service",
            "pick_type": "catalogue",
            "why_reason": build_why_reason(service, pet, pillar),
            "score": 60,
            "category": service.get("category"),
            "badges": badges,
        })
    
    # Sort by score and limit
    picks.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    # If no picks, add a Concierge Suggestion Card
    if len(picks) == 0:
        picks.append({
            "id": f"concierge-{pillar}",
            "name": f"Custom {pillar.title()} Solution",
            "price": None,
            "image": None,
            "type": "concierge_suggestion",
            "pick_type": "concierge",
            "why_reason": f"Our Concierge® will source the perfect {pillar} solution for {pet.get('name', 'your pet')}",
            "score": 100,
            "specs": [
                f"Tailored for {pet_breed or 'your dog'}",
                f"Size: {size_cat}",
                f"Life stage: {life_stage}",
                "Safety-verified sourcing"
            ]
        })
    
    return picks[:limit]


@router.get("/top-picks/{pet_id}")
async def get_top_picks(pet_id: str):
    """
    Get personalized top picks for a specific pet across all pillars.
    
    Returns picks filtered by:
    - Pet's allergies
    - Pet's size
    - Pet's breed
    - Pet's age/life stage
    - Pet's health conditions
    """
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get pet data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        # Try by name for backwards compatibility
        pet = await db.pets.find_one({"name": {"$regex": pet_id, "$options": "i"}}, {"_id": 0})
    
    if not pet:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    # Build pet intelligence summary
    pet_allergies = pet.get("preferences", {}).get("allergies") or []
    pet_size = pet.get("weight_kg")
    pet_breed = pet.get("breed", "Unknown")
    
    size_label = "Unknown"
    if pet_size:
        if pet_size < 10:
            size_label = "Small"
        elif pet_size < 25:
            size_label = "Medium"
        else:
            size_label = "Large"
    
    # Get seasonal and birthday context
    season = get_current_season()
    birthday_info = is_pet_birthday_near(pet)
    
    pet_intelligence = {
        "name": pet.get("name"),
        "breed": pet_breed,
        "size": size_label,
        "weight_kg": pet_size,
        "allergies": pet_allergies,
        "soul_score": pet.get("overall_score", 0),
        "photo_url": pet.get("photo_url"),
        "birthday_near": birthday_info is not None,
        "days_to_birthday": birthday_info.get("days_until") if birthday_info else None,
    }
    
    # Get picks for each pillar
    pillar_picks = {}
    for pillar_info in INCLUDED_PILLARS:
        pillar_id = pillar_info["id"]
        picks = await get_pillar_picks(db, pillar_id, pet, limit=4)
        
        pillar_picks[pillar_id] = {
            "pillar": pillar_info,
            "picks": picks,
            "total_picks": len(picks),
        }
    
    # Calculate total picks
    total_picks = sum(p["total_picks"] for p in pillar_picks.values())
    
    return {
        "success": True,
        "pet": pet_intelligence,
        "pillars": pillar_picks,
        "total_picks": total_picks,
        "generated_at": datetime.utcnow().isoformat(),
        "filters_applied": {
            "allergies": pet_allergies,
            "size": size_label,
            "breed": pet_breed,
        },
        "context": {
            "season": season,
            "birthday_near": birthday_info,
        }
    }


@router.get("/top-picks/{pet_id}/pillar/{pillar}")
async def get_pillar_top_picks(
    pet_id: str,
    pillar: str,
    limit: int = 8
):
    """Get more picks for a specific pillar."""
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        pet = await db.pets.find_one({"name": {"$regex": pet_id, "$options": "i"}}, {"_id": 0})
    
    if not pet:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    picks = await get_pillar_picks(db, pillar, pet, limit=limit)
    
    pillar_info = next((p for p in INCLUDED_PILLARS if p["id"] == pillar), None)
    
    return {
        "success": True,
        "pillar": pillar_info,
        "picks": picks,
        "pet_name": pet.get("name"),
    }
