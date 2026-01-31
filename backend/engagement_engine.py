"""
Engagement Engine - Phase 1 Features
- Pet Milestones Timeline
- Shareable Pet Cards
- Pet Parent Streaks
- Pull-to-refresh data sync

All features have full admin configurability and trigger unified flow
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/engagement", tags=["Engagement"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

async def initialize_engagement_data():
    """Auto-seed engagement data if collections are empty"""
    if db is None:
        logger.warning("Cannot initialize engagement data - database not set")
        return
    
    try:
        timestamp = datetime.now(timezone.utc)
        
        # Check and seed transformation stories
        stories_count = await db.transformation_stories.count_documents({})
        if stories_count == 0:
            logger.info("Seeding transformation stories...")
            stories = [
                {
                    "id": str(ObjectId()),
                    "pet_name": "Bruno", "breed": "Labrador", "owner_name": "Priya M.",
                    "before_image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
                    "after_image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
                    "achievement": "Lost 4kg in 10 weeks",
                    "testimonial": "The trainers understood Bruno perfectly!",
                    "program": "Weight Journey Partner®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
                },
                {
                    "id": str(ObjectId()),
                    "pet_name": "Coco", "breed": "Beagle", "owner_name": "Rahul S.",
                    "before_image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop",
                    "after_image": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop",
                    "achievement": "From couch potato to agility star",
                    "testimonial": "Coco won her first agility ribbon!",
                    "program": "Active Lifestyle Curator®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
                },
                {
                    "id": str(ObjectId()),
                    "pet_name": "Max", "breed": "Golden Retriever", "owner_name": "Anita K.",
                    "before_image": "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=200&h=200&fit=crop",
                    "after_image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=200&h=200&fit=crop",
                    "achievement": "Senior mobility restored",
                    "testimonial": "At 11, Max is moving like a puppy again!",
                    "program": "Senior Wellness Companion®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
                },
                {
                    "id": str(ObjectId()),
                    "pet_name": "Luna", "breed": "German Shepherd", "owner_name": "Vikram P.",
                    "before_image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&h=200&fit=crop",
                    "after_image": "https://images.unsplash.com/photo-1568572933382-74d440642117?w=200&h=200&fit=crop",
                    "achievement": "Anxiety reduced, confidence gained",
                    "testimonial": "Luna was always nervous. Training gave her confidence.",
                    "program": "Wellness Architect®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
                }
            ]
            await db.transformation_stories.insert_many(stories)
            logger.info(f"✓ Seeded {len(stories)} transformation stories")
        else:
            logger.info(f"✓ Transformation stories exist: {stories_count}")
        
        # Check and seed quick win tips
        tips_count = await db.quick_win_tips.count_documents({})
        if tips_count == 0:
            logger.info("Seeding quick win tips...")
            tips = [
                {"id": str(ObjectId()), "tip": "15-minute morning walks boost metabolism by 20%", "action": "Set reminder", "emoji": "🌅", "category": "weight", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Swimming burns 3x more calories than walking", "action": "Book session", "emoji": "🏊", "category": "weight", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Splitting meals into 3 portions aids digestion", "action": "View guide", "emoji": "🍽️", "category": "weight", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Short 5-min training sessions work best for puppies", "action": "View tips", "emoji": "🎯", "category": "puppy", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Socialization before 16 weeks shapes lifelong behavior", "action": "Find groups", "emoji": "🐕", "category": "puppy", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Gentle stretching maintains joint flexibility", "action": "View exercises", "emoji": "🧘", "category": "senior", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Raised food bowls reduce neck strain", "action": "Shop bowls", "emoji": "🥣", "category": "senior", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Interactive play strengthens your bond", "action": "Shop toys", "emoji": "💕", "category": "general", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "Consistent meal times regulate energy levels", "action": "Set schedule", "emoji": "⏰", "category": "general", "pillar": "fit", "is_active": True, "created_at": timestamp},
                {"id": str(ObjectId()), "tip": "A calm environment reduces anxiety", "action": "Learn more", "emoji": "🏡", "category": "general", "pillar": "fit", "is_active": True, "created_at": timestamp},
            ]
            await db.quick_win_tips.insert_many(tips)
            logger.info(f"✓ Seeded {len(tips)} quick win tips")
        else:
            logger.info(f"✓ Quick win tips exist: {tips_count}")
            
    except Exception as e:
        logger.error(f"Failed to initialize engagement data: {e}")

# ==================== MODELS ====================

class MilestoneType(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    auto_detect: bool = True  # Auto-create based on activity
    points_reward: int = 50
    is_active: bool = True
    category: str = "general"  # general, health, social, achievement

class PetMilestone(BaseModel):
    pet_id: str
    milestone_type: str
    title: str
    description: Optional[str] = None
    date: str
    photo_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    is_celebrated: bool = False
    points_awarded: int = 0

class ShareableCardTemplate(BaseModel):
    id: str
    name: str
    preview_url: str
    background_gradient: str  # e.g., "from-purple-600 to-pink-500"
    text_color: str = "white"
    show_stats: bool = True
    show_qr: bool = True
    is_active: bool = True
    category: str = "general"  # general, birthday, achievement, milestone

class StreakConfig(BaseModel):
    min_actions_per_day: int = 1
    streak_rewards: List[Dict[str, Any]]  # [{days: 7, points: 100, badge: "Weekly Warrior"}]
    reset_hour: int = 0  # Hour in UTC when streak resets if not met

# ==================== DEFAULT CONFIGURATIONS ====================

DEFAULT_MILESTONE_TYPES = [
    {"id": "first_profile", "name": "Profile Created", "icon": "🎉", "description": "Welcome to the family!", "category": "achievement", "points_reward": 100},
    {"id": "first_order", "name": "First Order", "icon": "🛒", "description": "Made their first purchase", "category": "achievement", "points_reward": 150},
    {"id": "birthday", "name": "Birthday", "icon": "🎂", "description": "Another year of happiness!", "category": "general", "points_reward": 200},
    {"id": "gotcha_day", "name": "Gotcha Day", "icon": "💝", "description": "Anniversary of joining the family", "category": "general", "points_reward": 200},
    {"id": "first_grooming", "name": "First Grooming", "icon": "✂️", "description": "Looking fabulous!", "category": "general", "points_reward": 75},
    {"id": "first_vet_visit", "name": "First Vet Visit", "icon": "🩺", "description": "Health check complete", "category": "health", "points_reward": 100},
    {"id": "vaccination", "name": "Vaccination", "icon": "💉", "description": "Staying protected!", "category": "health", "points_reward": 100},
    {"id": "first_playdate", "name": "First Playdate", "icon": "🐕", "description": "Made a new friend!", "category": "social", "points_reward": 75},
    {"id": "first_travel", "name": "First Trip", "icon": "✈️", "description": "Adventure awaits!", "category": "general", "points_reward": 150},
    {"id": "soul_50", "name": "Soul Explorer", "icon": "🧭", "description": "Reached 50% Pet Soul", "category": "achievement", "points_reward": 250},
    {"id": "soul_100", "name": "Soul Master", "icon": "⭐", "description": "Achieved 100% Pet Soul!", "category": "achievement", "points_reward": 500},
    {"id": "1_year_member", "name": "1 Year Member", "icon": "🏆", "description": "One year with us!", "category": "achievement", "points_reward": 500},
    {"id": "custom", "name": "Custom Milestone", "icon": "📌", "description": "A special moment", "category": "general", "points_reward": 50},
]

DEFAULT_CARD_TEMPLATES = [
    {"id": "classic", "name": "Classic Purple", "preview_url": "/templates/classic.png", "background_gradient": "from-purple-600 via-indigo-600 to-purple-700", "text_color": "white", "show_stats": True, "show_qr": True, "category": "general"},
    {"id": "sunset", "name": "Sunset Glow", "preview_url": "/templates/sunset.png", "background_gradient": "from-orange-500 via-pink-500 to-purple-600", "text_color": "white", "show_stats": True, "show_qr": True, "category": "general"},
    {"id": "ocean", "name": "Ocean Breeze", "preview_url": "/templates/ocean.png", "background_gradient": "from-cyan-500 via-blue-500 to-indigo-600", "text_color": "white", "show_stats": True, "show_qr": True, "category": "general"},
    {"id": "birthday", "name": "Birthday Bash", "preview_url": "/templates/birthday.png", "background_gradient": "from-pink-500 via-rose-500 to-red-500", "text_color": "white", "show_stats": False, "show_qr": False, "category": "birthday"},
    {"id": "achievement", "name": "Golden Achievement", "preview_url": "/templates/achievement.png", "background_gradient": "from-amber-500 via-yellow-500 to-orange-500", "text_color": "white", "show_stats": True, "show_qr": False, "category": "achievement"},
    {"id": "minimal", "name": "Clean Minimal", "preview_url": "/templates/minimal.png", "background_gradient": "from-gray-100 to-gray-200", "text_color": "gray-900", "show_stats": True, "show_qr": True, "category": "general"},
]

DEFAULT_STREAK_CONFIG = {
    "min_actions_per_day": 1,
    "streak_rewards": [
        {"days": 3, "points": 50, "badge": "Getting Started", "icon": "🌱"},
        {"days": 7, "points": 150, "badge": "Weekly Warrior", "icon": "⚔️"},
        {"days": 14, "points": 300, "badge": "Dedicated Parent", "icon": "💪"},
        {"days": 30, "points": 750, "badge": "Monthly Champion", "icon": "🏆"},
        {"days": 60, "points": 1500, "badge": "Pet Parent Pro", "icon": "👑"},
        {"days": 100, "points": 3000, "badge": "Legendary Parent", "icon": "🌟"},
    ],
    "reset_hour": 0,
    "qualifying_actions": ["order", "pet_update", "mira_chat", "service_booking", "review", "photo_upload"]
}

# ==================== ADMIN CONFIG ENDPOINTS ====================

@router.get("/admin/milestone-types")
async def get_milestone_types():
    """Get all milestone types (admin configurable)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    config = await db.app_settings.find_one({"key": "milestone_types"}, {"_id": 0})
    if not config:
        # Initialize with defaults
        await db.app_settings.insert_one({
            "key": "milestone_types",
            "value": DEFAULT_MILESTONE_TYPES,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return DEFAULT_MILESTONE_TYPES
    return config.get("value", DEFAULT_MILESTONE_TYPES)

@router.put("/admin/milestone-types")
async def update_milestone_types(types: List[Dict[str, Any]]):
    """Update milestone types (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await db.app_settings.update_one(
        {"key": "milestone_types"},
        {"$set": {"value": types, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "success", "message": "Milestone types updated"}

@router.get("/admin/card-templates")
async def get_card_templates():
    """Get all shareable card templates (admin configurable)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    config = await db.app_settings.find_one({"key": "card_templates"}, {"_id": 0})
    if not config:
        await db.app_settings.insert_one({
            "key": "card_templates",
            "value": DEFAULT_CARD_TEMPLATES,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return DEFAULT_CARD_TEMPLATES
    return config.get("value", DEFAULT_CARD_TEMPLATES)

@router.put("/admin/card-templates")
async def update_card_templates(templates: List[Dict[str, Any]]):
    """Update card templates (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await db.app_settings.update_one(
        {"key": "card_templates"},
        {"$set": {"value": templates, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "success", "message": "Card templates updated"}

@router.get("/admin/streak-config")
async def get_streak_config():
    """Get streak configuration (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    config = await db.app_settings.find_one({"key": "streak_config"}, {"_id": 0})
    if not config:
        await db.app_settings.insert_one({
            "key": "streak_config",
            "value": DEFAULT_STREAK_CONFIG,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return DEFAULT_STREAK_CONFIG
    return config.get("value", DEFAULT_STREAK_CONFIG)

@router.put("/admin/streak-config")
async def update_streak_config(config: Dict[str, Any]):
    """Update streak configuration (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await db.app_settings.update_one(
        {"key": "streak_config"},
        {"$set": {"value": config, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "success", "message": "Streak config updated"}

# ==================== PET MILESTONES ENDPOINTS ====================

@router.get("/milestones/{pet_id}")
async def get_pet_milestones(pet_id: str):
    """Get all milestones for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    milestones = await db.pet_milestones.find(
        {"pet_id": pet_id},
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    return milestones

@router.post("/milestones")
async def create_milestone(milestone: PetMilestone):
    """Create a new milestone for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get milestone type config for points
    config = await db.app_settings.find_one({"key": "milestone_types"}, {"_id": 0})
    types = config.get("value", DEFAULT_MILESTONE_TYPES) if config else DEFAULT_MILESTONE_TYPES
    
    milestone_type_config = next((t for t in types if t["id"] == milestone.milestone_type), None)
    points = milestone_type_config.get("points_reward", 50) if milestone_type_config else 50
    
    milestone_doc = {
        "id": str(ObjectId()),
        "pet_id": milestone.pet_id,
        "milestone_type": milestone.milestone_type,
        "title": milestone.title,
        "description": milestone.description,
        "date": milestone.date,
        "photo_url": milestone.photo_url,
        "metadata": milestone.metadata or {},
        "is_celebrated": False,
        "points_awarded": points,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pet_milestones.insert_one(milestone_doc)
    
    # Award points to user
    pet = await db.pets.find_one({"id": milestone.pet_id})
    if pet and pet.get("user_id"):
        await db.users.update_one(
            {"id": pet["user_id"]},
            {"$inc": {"loyalty_points": points}}
        )
    
    # Trigger notification via unified flow
    try:
        from central_signal_flow import create_signal
        await create_signal(
            pillar="engagement",
            action_type="milestone_achieved",
            title=f"🎉 {milestone.title}",
            description=f"Pet milestone achieved! +{points} Paw Points awarded.",
            pet_name=pet.get("name") if pet else None,
            pet_id=milestone.pet_id,
            urgency="low",
            source="engagement_engine",
            extra_data={
                "milestone_type": milestone.milestone_type,
                "points": points,
                "icon": milestone_type_config.get("icon", "🎉") if milestone_type_config else "🎉"
            }
        )
    except Exception as e:
        logger.warning(f"Could not trigger unified flow for milestone: {e}")
    
    return {"status": "success", "milestone": {**milestone_doc, "_id": None}, "points_awarded": points}

@router.delete("/milestones/{milestone_id}")
async def delete_milestone(milestone_id: str):
    """Delete a milestone"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await db.pet_milestones.delete_one({"id": milestone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    return {"status": "success", "message": "Milestone deleted"}

# ==================== AUTO-MILESTONE DETECTION ====================

@router.post("/milestones/auto-detect/{pet_id}")
async def auto_detect_milestones(pet_id: str):
    """Auto-detect and create milestones based on pet activity"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    existing = await db.pet_milestones.find({"pet_id": pet_id}, {"milestone_type": 1}).to_list(100)
    existing_types = {m["milestone_type"] for m in existing}
    
    new_milestones = []
    today = datetime.now(timezone.utc).isoformat()
    
    # Check for profile creation
    if "first_profile" not in existing_types:
        new_milestones.append({
            "pet_id": pet_id,
            "milestone_type": "first_profile",
            "title": f"{pet.get('name', 'Pet')} joined the family!",
            "date": pet.get("created_at", today),
        })
    
    # Check for soul score milestones
    score = pet.get("overall_score", 0)
    if score >= 50 and "soul_50" not in existing_types:
        new_milestones.append({
            "pet_id": pet_id,
            "milestone_type": "soul_50",
            "title": f"{pet.get('name', 'Pet')} is a Soul Explorer!",
            "date": today,
        })
    if score >= 100 and "soul_100" not in existing_types:
        new_milestones.append({
            "pet_id": pet_id,
            "milestone_type": "soul_100",
            "title": f"{pet.get('name', 'Pet')} achieved Soul Master!",
            "date": today,
        })
    
    # Check for first order
    if "first_order" not in existing_types:
        order = await db.orders.find_one({"pet_id": pet_id})
        if order:
            new_milestones.append({
                "pet_id": pet_id,
                "milestone_type": "first_order",
                "title": f"First order for {pet.get('name', 'Pet')}!",
                "date": order.get("created_at", today),
            })
    
    # Create all detected milestones
    for m in new_milestones:
        await create_milestone(PetMilestone(**m))
    
    return {"status": "success", "milestones_created": len(new_milestones), "milestones": new_milestones}

# ==================== SHAREABLE CARD ENDPOINTS ====================

@router.get("/card/{pet_id}")
async def get_shareable_card_data(pet_id: str, template_id: str = "classic"):
    """Get data for generating a shareable pet card"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Get template
    templates_config = await db.app_settings.find_one({"key": "card_templates"}, {"_id": 0})
    templates = templates_config.get("value", DEFAULT_CARD_TEMPLATES) if templates_config else DEFAULT_CARD_TEMPLATES
    template = next((t for t in templates if t["id"] == template_id), templates[0])
    
    # Get milestones count
    milestones_count = await db.pet_milestones.count_documents({"pet_id": pet_id})
    
    # Get user for additional stats
    user = None
    if pet.get("user_id"):
        user = await db.users.find_one({"id": pet["user_id"]}, {"_id": 0, "loyalty_points": 1, "name": 1})
    
    return {
        "pet": {
            "name": pet.get("name"),
            "breed": pet.get("breed"),
            "species": pet.get("species", "dog"),
            "photo_url": pet.get("photo_url"),
            "pet_pass_number": pet.get("pet_pass_number"),
            "overall_score": pet.get("overall_score", 0),
            "birth_date": pet.get("birth_date"),
            "gotcha_date": pet.get("gotcha_date"),
        },
        "stats": {
            "milestones": milestones_count,
            "paw_points": user.get("loyalty_points", 0) if user else 0,
            "soul_score": pet.get("overall_score", 0),
        },
        "template": template,
        "share_url": f"https://thedoggycompany.in/pet/{pet_id}/card"
    }

# ==================== STREAK ENDPOINTS ====================

@router.get("/streak/{user_id}")
async def get_user_streak(user_id: str):
    """Get user's current streak status"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    streak_data = await db.user_streaks.find_one({"user_id": user_id}, {"_id": 0})
    
    if not streak_data:
        streak_data = {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "last_action_date": None,
            "total_actions": 0,
            "streak_history": []
        }
        await db.user_streaks.insert_one(streak_data)
    
    # Get streak config for rewards
    config = await db.app_settings.find_one({"key": "streak_config"}, {"_id": 0})
    streak_config = config.get("value", DEFAULT_STREAK_CONFIG) if config else DEFAULT_STREAK_CONFIG
    
    # Calculate next reward
    current = streak_data.get("current_streak", 0)
    next_reward = None
    for reward in streak_config.get("streak_rewards", []):
        if reward["days"] > current:
            next_reward = reward
            break
    
    return {
        **streak_data,
        "next_reward": next_reward,
        "days_until_next_reward": next_reward["days"] - current if next_reward else None
    }

@router.post("/streak/{user_id}/action")
async def record_streak_action(user_id: str, action_type: str):
    """Record an action that counts towards streak"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get streak config
    config = await db.app_settings.find_one({"key": "streak_config"}, {"_id": 0})
    streak_config = config.get("value", DEFAULT_STREAK_CONFIG) if config else DEFAULT_STREAK_CONFIG
    
    # Check if action qualifies
    if action_type not in streak_config.get("qualifying_actions", []):
        return {"status": "ignored", "message": "Action does not qualify for streak"}
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    streak_data = await db.user_streaks.find_one({"user_id": user_id})
    
    if not streak_data:
        streak_data = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_action_date": today,
            "total_actions": 1,
            "streak_history": [{"date": today, "action": action_type}]
        }
        await db.user_streaks.insert_one(streak_data)
    else:
        last_action = streak_data.get("last_action_date")
        yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
        
        if last_action == today:
            # Already recorded today
            await db.user_streaks.update_one(
                {"user_id": user_id},
                {"$inc": {"total_actions": 1}}
            )
        elif last_action == yesterday:
            # Continue streak
            new_streak = streak_data.get("current_streak", 0) + 1
            longest = max(new_streak, streak_data.get("longest_streak", 0))
            
            await db.user_streaks.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "current_streak": new_streak,
                        "longest_streak": longest,
                        "last_action_date": today
                    },
                    "$inc": {"total_actions": 1},
                    "$push": {"streak_history": {"date": today, "action": action_type}}
                }
            )
            
            # Check for streak rewards
            for reward in streak_config.get("streak_rewards", []):
                if reward["days"] == new_streak:
                    # Award points
                    await db.users.update_one(
                        {"id": user_id},
                        {"$inc": {"loyalty_points": reward["points"]}}
                    )
                    # Trigger notification
                    try:
                        from central_signal_flow import create_signal
                        user = await db.users.find_one({"id": user_id}, {"name": 1, "email": 1})
                        await create_signal(
                            pillar="engagement",
                            action_type="streak_reward",
                            title=f"🔥 {reward['badge']} Achieved!",
                            description=f"{new_streak} day streak! +{reward['points']} Paw Points earned.",
                            customer_name=user.get("name") if user else None,
                            customer_email=user.get("email") if user else None,
                            urgency="low",
                            source="engagement_engine",
                            extra_data={
                                "streak_days": new_streak,
                                "badge": reward["badge"],
                                "points": reward["points"],
                                "icon": reward.get("icon", "🔥")
                            }
                        )
                    except Exception as e:
                        logger.warning(f"Could not trigger unified flow for streak: {e}")
                    break
        else:
            # Streak broken, start new
            await db.user_streaks.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "current_streak": 1,
                        "last_action_date": today
                    },
                    "$inc": {"total_actions": 1},
                    "$push": {"streak_history": {"date": today, "action": action_type, "streak_reset": True}}
                }
            )
    
    # Get updated data
    updated = await db.user_streaks.find_one({"user_id": user_id}, {"_id": 0})
    return {"status": "success", "streak": updated}

# ==================== PULL-TO-REFRESH DATA SYNC ====================

@router.get("/sync/{user_id}")
async def sync_user_data(user_id: str):
    """Get all essential data for pull-to-refresh sync"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get user
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get pets
    pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(20)
    
    # Get recent orders (last 5)
    orders = await db.orders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get streak
    streak = await db.user_streaks.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get unread notifications count
    notif_count = await db.notifications.count_documents({
        "user_id": user_id,
        "read": False
    })
    
    # Get active tickets count
    tickets_count = await db.service_desk_tickets.count_documents({
        "user_id": user_id,
        "status": {"$nin": ["resolved", "closed"]}
    })
    
    return {
        "user": user,
        "pets": pets,
        "recent_orders": orders,
        "streak": streak,
        "unread_notifications": notif_count,
        "active_tickets": tickets_count,
        "synced_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== TRANSFORMATION STORIES ====================

class TransformationStory(BaseModel):
    pet_name: str
    breed: str
    owner_name: str
    before_image: str
    after_image: str
    achievement: str
    testimonial: str
    program: str
    rating: int = 5
    pillar: str = "fit"
    is_active: bool = True

@router.get("/transformations")
async def get_transformation_stories(pillar: str = "fit", active_only: bool = True):
    """Get transformation stories for a pillar"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {"pillar": pillar}
    if active_only:
        query["is_active"] = True
    
    stories = await db.transformation_stories.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"stories": stories, "count": len(stories)}

@router.post("/transformations")
async def create_transformation_story(story: TransformationStory):
    """Admin: Create transformation story"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    story_dict = story.dict()
    story_dict["created_at"] = datetime.now(timezone.utc)
    story_dict["id"] = str(ObjectId())
    
    await db.transformation_stories.insert_one(story_dict)
    return {"id": story_dict["id"], "message": "Story created"}

# ==================== QUICK WIN TIPS ====================

class QuickWinTip(BaseModel):
    tip: str
    action: str
    emoji: str
    category: str
    pillar: str = "fit"
    breed_specific: Optional[str] = None
    is_active: bool = True

@router.get("/tips")
async def get_quick_win_tips(pillar: str = "fit", category: str = None):
    """Get quick win tips"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {"pillar": pillar, "is_active": True}
    if category:
        query["category"] = category
    
    tips = await db.quick_win_tips.find(query, {"_id": 0}).to_list(100)
    return {"tips": tips, "count": len(tips)}

@router.post("/tips")
async def create_quick_win_tip(tip: QuickWinTip):
    """Admin: Create quick win tip"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    tip_dict = tip.dict()
    tip_dict["created_at"] = datetime.now(timezone.utc)
    tip_dict["id"] = str(ObjectId())
    
    await db.quick_win_tips.insert_one(tip_dict)
    return {"id": tip_dict["id"], "message": "Tip created"}

# ==================== GOAL INTERACTIONS (UNIVERSAL FLOW) ====================

class GoalInteraction(BaseModel):
    goal_id: str
    goal_label: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    pillar: str = "fit"
    message: Optional[str] = None

@router.post("/goal-interaction")
async def record_goal_interaction(interaction: GoalInteraction):
    """
    Record fitness goal click - triggers Universal Signal Flow:
    1. Notification
    2. Service Desk Ticket
    3. Unified Inbox Entry
    4. Pet Soul Update
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    timestamp = datetime.now(timezone.utc)
    
    # 1. Create Notification
    notification = {
        "user_id": interaction.user_id,
        "type": "goal_interest",
        "title": f"Fitness Goal: {interaction.goal_label}",
        "message": interaction.message or f"Interested in {interaction.goal_label}",
        "pillar": interaction.pillar,
        "read": False,
        "created_at": timestamp
    }
    await db.notifications.insert_one(notification)
    
    # 2. Create Service Desk Ticket
    ticket = {
        "ticket_type": "fitness_goal_interest",
        "source": "conversational_entry",
        "pillar": interaction.pillar,
        "user_id": interaction.user_id,
        "pet_id": interaction.pet_id,
        "pet_name": interaction.pet_name,
        "status": "new",
        "priority": "normal",
        "data": {
            "goal_id": interaction.goal_id,
            "goal_label": interaction.goal_label,
            "message": interaction.message
        },
        "created_at": timestamp
    }
    ticket_result = await db.service_desk_tickets.insert_one(ticket)
    
    # 3. Create Unified Inbox Entry
    inbox_entry = {
        "type": "goal_interest",
        "source": "engagement",
        "pillar": interaction.pillar,
        "user_id": interaction.user_id,
        "pet_id": interaction.pet_id,
        "ticket_id": str(ticket_result.inserted_id),
        "summary": f"{interaction.pet_name or 'User'} interested in {interaction.goal_label}",
        "status": "unread",
        "created_at": timestamp
    }
    await db.unified_inbox.insert_one(inbox_entry)
    
    # 4. Update Pet Soul
    if interaction.pet_id:
        try:
            pet_query = {"_id": ObjectId(interaction.pet_id)} if ObjectId.is_valid(interaction.pet_id) else {"id": interaction.pet_id}
            await db.pets.update_one(
                pet_query,
                {
                    "$push": {
                        "soul.fitness_interests": {
                            "goal": interaction.goal_label,
                            "timestamp": timestamp
                        }
                    },
                    "$set": {
                        "soul.last_interaction": timestamp,
                        f"soul.pillar_engagement.{interaction.pillar}": timestamp
                    },
                    "$inc": {"soul.total_interactions": 1}
                }
            )
        except Exception as e:
            logger.warning(f"Failed to update pet soul: {e}")
    
    return {
        "message": "Goal interaction recorded",
        "ticket_id": str(ticket_result.inserted_id),
        "notification_sent": True,
        "pet_soul_updated": bool(interaction.pet_id)
    }

# ==================== SOCIAL PROOF STATS ====================

@router.get("/stats/{pillar}")
async def get_social_proof_stats(pillar: str = "fit"):
    """Get social proof stats for a pillar"""
    if db is None:
        return {
            "journeys_started": 847,
            "weekly_bookings": 12,
            "satisfaction_rate": 98,
            "pillar": pillar
        }
    
    stats = await db.social_proof_stats.find_one({"pillar": pillar}, {"_id": 0})
    
    if not stats:
        return {
            "journeys_started": 847,
            "weekly_bookings": 12,
            "satisfaction_rate": 98,
            "pillar": pillar
        }
    
    return stats

@router.put("/stats/{pillar}")
async def update_social_proof_stats(pillar: str, stats: Dict[str, Any]):
    """Admin: Update social proof stats"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    stats["pillar"] = pillar
    stats["updated_at"] = datetime.now(timezone.utc)
    
    await db.social_proof_stats.update_one(
        {"pillar": pillar},
        {"$set": stats},
        upsert=True
    )
    
    return {"message": "Stats updated"}

# ==================== SEED DEFAULTS ====================

@router.post("/seed-engagement-data")
async def seed_engagement_defaults():
    """Admin: Seed default transformation stories and tips"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    timestamp = datetime.now(timezone.utc)
    
    # Default stories
    stories = [
        {
            "id": str(ObjectId()),
            "pet_name": "Bruno", "breed": "Labrador", "owner_name": "Priya M.",
            "before_image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
            "after_image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
            "achievement": "Lost 4kg in 10 weeks",
            "testimonial": "The trainers understood Bruno perfectly!",
            "program": "Weight Journey Partner®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
        },
        {
            "id": str(ObjectId()),
            "pet_name": "Coco", "breed": "Beagle", "owner_name": "Rahul S.",
            "before_image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop",
            "after_image": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop",
            "achievement": "From couch potato to agility star",
            "testimonial": "Coco won her first agility ribbon!",
            "program": "Active Lifestyle Curator®", "rating": 5, "pillar": "fit", "is_active": True, "created_at": timestamp
        }
    ]
    
    # Default tips
    tips = [
        {"id": str(ObjectId()), "tip": "15-minute morning walks boost metabolism by 20%", "action": "Set reminder", "emoji": "🌅", "category": "weight", "pillar": "fit", "is_active": True, "created_at": timestamp},
        {"id": str(ObjectId()), "tip": "Swimming burns 3x more calories than walking", "action": "Book session", "emoji": "🏊", "category": "weight", "pillar": "fit", "is_active": True, "created_at": timestamp},
        {"id": str(ObjectId()), "tip": "Interactive play strengthens your bond", "action": "Shop toys", "emoji": "💕", "category": "general", "pillar": "fit", "is_active": True, "created_at": timestamp},
    ]
    
    for story in stories:
        await db.transformation_stories.update_one(
            {"pet_name": story["pet_name"], "pillar": story["pillar"]},
            {"$setOnInsert": story}, upsert=True
        )
    
    for tip in tips:
        await db.quick_win_tips.update_one(
            {"tip": tip["tip"]},
            {"$setOnInsert": tip}, upsert=True
        )
    
    return {"message": "Seeded", "stories": len(stories), "tips": len(tips)}


@router.post("/seed-pillar-tips")
async def seed_all_pillar_tips(force_refresh: bool = False):
    """
    Seed tips for ALL pillars with pillar-specific content.
    Set force_refresh=true to delete and reseed all tips.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    timestamp = datetime.now(timezone.utc)
    
    # COMPREHENSIVE PILLAR-SPECIFIC TIPS
    all_tips = [
        # ========== FIT PILLAR ==========
        {"tip": "15-minute morning walks boost metabolism by 20%", "action": "Set reminder", "emoji": "🌅", "category": "weight", "pillar": "fit", "action_type": "link", "action_url": "/fit"},
        {"tip": "Swimming burns 3x more calories than walking", "action": "Book session", "emoji": "🏊", "category": "weight", "pillar": "fit", "action_type": "navigate", "action_url": "/fit?type=swimming"},
        {"tip": "Splitting meals into 3 portions aids digestion", "action": "View guide", "emoji": "🍽️", "category": "weight", "pillar": "fit", "action_type": "checklist", "checklist_id": "fit"},
        {"tip": "Short 5-min training sessions work best for puppies", "action": "View tips", "emoji": "🎯", "category": "puppy", "pillar": "fit"},
        {"tip": "Socialization before 16 weeks shapes lifelong behavior", "action": "Find groups", "emoji": "🐕", "category": "puppy", "pillar": "fit"},
        {"tip": "Gentle stretching maintains joint flexibility", "action": "View exercises", "emoji": "🧘", "category": "senior", "pillar": "fit"},
        {"tip": "Raised food bowls reduce neck strain in seniors", "action": "Shop bowls", "emoji": "🥣", "category": "senior", "pillar": "fit", "action_type": "navigate", "action_url": "/shop?category=senior"},
        
        # ========== STAY PILLAR ==========
        {"tip": "Book pet-friendly stays 2 weeks ahead for best rates", "action": "Search stays", "emoji": "🏨", "category": "general", "pillar": "stay", "action_type": "navigate", "action_url": "/stay"},
        {"tip": "Pack familiar bedding to help your pet feel at home", "action": "View checklist", "emoji": "🛏️", "category": "general", "pillar": "stay", "action_type": "checklist", "checklist_id": "stay"},
        {"tip": "Request ground floor rooms for easier outdoor access", "action": "View tips", "emoji": "🚪", "category": "general", "pillar": "stay", "action_type": "checklist", "checklist_id": "stay"},
        {"tip": "Check the property's pet policy before booking", "action": "View checklist", "emoji": "📋", "category": "general", "pillar": "stay", "action_type": "checklist", "checklist_id": "stay"},
        {"tip": "Bring your pet's favorite blanket to reduce anxiety", "action": "Shop travel items", "emoji": "🧸", "category": "general", "pillar": "stay", "action_type": "navigate", "action_url": "/shop?category=travel"},
        {"tip": "Ask about nearby vet clinics when booking", "action": "Find vets", "emoji": "🏥", "category": "general", "pillar": "stay", "action_type": "navigate", "action_url": "/care?type=vet"},
        {"tip": "Bring waterproof mats for hotel room floors", "action": "Shop mats", "emoji": "💧", "category": "general", "pillar": "stay", "action_type": "navigate", "action_url": "/shop?category=travel"},
        {"tip": "Pack portable food and water bowls", "action": "Shop accessories", "emoji": "🥣", "category": "general", "pillar": "stay", "action_type": "navigate", "action_url": "/shop?category=travel"},
        
        # ========== TRAVEL PILLAR ==========
        {"tip": "Book cargo-approved crates 3 weeks before flights", "action": "Shop crates", "emoji": "✈️", "category": "general", "pillar": "travel", "action_type": "navigate", "action_url": "/shop?category=crates"},
        {"tip": "Stop every 2 hours for walks on road trips", "action": "Plan route", "emoji": "🚗", "category": "general", "pillar": "travel", "action_type": "checklist", "checklist_id": "travel"},
        {"tip": "Carry health certificates for interstate travel", "action": "Get docs", "emoji": "📄", "category": "general", "pillar": "travel", "action_type": "navigate", "action_url": "/care?type=vet"},
        {"tip": "Microchip your pet before any long journey", "action": "Find clinic", "emoji": "💉", "category": "general", "pillar": "travel", "action_type": "navigate", "action_url": "/care?type=vet"},
        {"tip": "Keep water accessible during travel", "action": "Shop bottles", "emoji": "💧", "category": "general", "pillar": "travel", "action_type": "navigate", "action_url": "/shop?category=travel"},
        {"tip": "Avoid feeding 4 hours before flights", "action": "View guide", "emoji": "🍽️", "category": "general", "pillar": "travel", "action_type": "checklist", "checklist_id": "travel"},
        {"tip": "Practice crate training weeks before travel", "action": "View tips", "emoji": "📦", "category": "general", "pillar": "travel"},
        
        # ========== CARE PILLAR ==========
        {"tip": "Regular grooming prevents skin issues", "action": "Book grooming", "emoji": "✨", "category": "general", "pillar": "care", "action_type": "navigate", "action_url": "/care?type=grooming"},
        {"tip": "Dental chews reduce tartar by up to 70%", "action": "Shop dental", "emoji": "🦷", "category": "general", "pillar": "care", "action_type": "navigate", "action_url": "/shop?category=dental"},
        {"tip": "Nail trimming every 3 weeks prevents pain", "action": "Book session", "emoji": "✂️", "category": "general", "pillar": "care", "action_type": "navigate", "action_url": "/care?type=grooming"},
        {"tip": "Brush teeth 3x weekly for optimal health", "action": "Shop brushes", "emoji": "🪥", "category": "general", "pillar": "care", "action_type": "navigate", "action_url": "/shop?category=dental"},
        {"tip": "Check ears weekly for signs of infection", "action": "View guide", "emoji": "👂", "category": "general", "pillar": "care", "action_type": "checklist", "checklist_id": "care"},
        {"tip": "Seasonal flea prevention is essential", "action": "Shop meds", "emoji": "🐛", "category": "general", "pillar": "care", "action_type": "navigate", "action_url": "/shop?category=flea"},
        
        # ========== CELEBRATE PILLAR ==========
        {"tip": "Pet-safe cakes use peanut butter, not chocolate", "action": "Shop cakes", "emoji": "🎂", "category": "general", "pillar": "celebrate", "action_type": "navigate", "action_url": "/celebrate/cakes"},
        {"tip": "Plan party activities around your pet's energy", "action": "Get ideas", "emoji": "🎈", "category": "general", "pillar": "celebrate", "action_type": "checklist", "checklist_id": "celebrate"},
        {"tip": "Keep celebration noises at pet-friendly levels", "action": "View guide", "emoji": "🔊", "category": "general", "pillar": "celebrate"},
        {"tip": "Take photos in natural light for best results", "action": "Book shoot", "emoji": "📸", "category": "general", "pillar": "celebrate", "action_type": "navigate", "action_url": "/celebrate?type=photoshoot"},
        {"tip": "Include only pet-safe decorations", "action": "Shop decor", "emoji": "🎉", "category": "general", "pillar": "celebrate", "action_type": "navigate", "action_url": "/shop?category=party"},
        {"tip": "Consider a 'gotcha day' celebration too", "action": "Plan event", "emoji": "💝", "category": "general", "pillar": "celebrate"},
        
        # ========== DINE PILLAR ==========
        {"tip": "Call restaurants ahead to confirm pet policy", "action": "View list", "emoji": "📞", "category": "general", "pillar": "dine", "action_type": "navigate", "action_url": "/dine"},
        {"tip": "Bring a portable water bowl for dining out", "action": "Shop bowls", "emoji": "🥣", "category": "general", "pillar": "dine", "action_type": "navigate", "action_url": "/shop?category=travel"},
        {"tip": "Choose outdoor seating for relaxed pet dining", "action": "Find spots", "emoji": "☀️", "category": "general", "pillar": "dine", "action_type": "navigate", "action_url": "/dine?filter=outdoor"},
        {"tip": "Pack treats to reward calm behavior", "action": "Shop treats", "emoji": "🦴", "category": "general", "pillar": "dine", "action_type": "navigate", "action_url": "/shop?category=treats"},
        {"tip": "Visit during off-peak hours for quieter experience", "action": "Plan visit", "emoji": "🕐", "category": "general", "pillar": "dine"},
        {"tip": "Practice restaurant etiquette at home first", "action": "View tips", "emoji": "🎓", "category": "general", "pillar": "dine"},
        
        # ========== ENJOY PILLAR ==========
        {"tip": "Dog parks are best visited during cooler hours", "action": "Find parks", "emoji": "🌳", "category": "general", "pillar": "enjoy", "action_type": "navigate", "action_url": "/enjoy?type=parks"},
        {"tip": "Playdates with similar energy dogs work best", "action": "Find buddies", "emoji": "🐕", "category": "general", "pillar": "enjoy"},
        {"tip": "Swimming is excellent low-impact exercise", "action": "Find pools", "emoji": "🏊", "category": "general", "pillar": "enjoy", "action_type": "navigate", "action_url": "/enjoy?type=swimming"},
        {"tip": "Check event reviews from other pet parents", "action": "View events", "emoji": "⭐", "category": "general", "pillar": "enjoy", "action_type": "navigate", "action_url": "/enjoy"},
        {"tip": "Bring poop bags to every outdoor activity", "action": "Shop bags", "emoji": "🧹", "category": "general", "pillar": "enjoy", "action_type": "navigate", "action_url": "/shop?category=waste"},
        {"tip": "Keep your pet on leash until familiar with area", "action": "View tips", "emoji": "🦮", "category": "general", "pillar": "enjoy"},
        
        # ========== LEARN PILLAR ==========
        {"tip": "Positive reinforcement creates lasting habits", "action": "View guide", "emoji": "🌟", "category": "general", "pillar": "learn", "action_type": "checklist", "checklist_id": "learn"},
        {"tip": "Short training sessions beat long ones", "action": "Start course", "emoji": "⏱️", "category": "general", "pillar": "learn", "action_type": "navigate", "action_url": "/learn"},
        {"tip": "Consistency across family members is key", "action": "Get tips", "emoji": "👨‍👩‍👧", "category": "general", "pillar": "learn"},
        {"tip": "Reward timing matters - within 2 seconds!", "action": "Learn more", "emoji": "⚡", "category": "general", "pillar": "learn"},
        {"tip": "End training on a positive note always", "action": "View tips", "emoji": "✅", "category": "general", "pillar": "learn"},
        {"tip": "Mental stimulation prevents boredom behaviors", "action": "Shop puzzles", "emoji": "🧩", "category": "general", "pillar": "learn", "action_type": "navigate", "action_url": "/shop?category=toys"},
    ]
    
    if force_refresh:
        # Delete all existing tips
        result = await db.quick_win_tips.delete_many({})
        logger.info(f"Deleted {result.deleted_count} existing tips for refresh")
    
    seeded_count = 0
    for tip_data in all_tips:
        tip = {
            "id": str(ObjectId()),
            "tip": tip_data["tip"],
            "action": tip_data["action"],
            "emoji": tip_data.get("emoji", "💡"),
            "category": tip_data.get("category", "general"),
            "pillar": tip_data["pillar"],
            "action_type": tip_data.get("action_type"),
            "action_url": tip_data.get("action_url"),
            "checklist_id": tip_data.get("checklist_id"),
            "is_active": True,
            "created_at": timestamp
        }
        
        # Upsert - update if exists, insert if not
        result = await db.quick_win_tips.update_one(
            {"tip": tip["tip"], "pillar": tip["pillar"]},
            {"$setOnInsert": tip},
            upsert=True
        )
        if result.upserted_id:
            seeded_count += 1
    
    # Count tips per pillar
    pillar_counts = {}
    for pillar in ["fit", "stay", "travel", "care", "celebrate", "dine", "enjoy", "learn"]:
        count = await db.quick_win_tips.count_documents({"pillar": pillar})
        pillar_counts[pillar] = count
    
    return {
        "message": f"Seeded {seeded_count} new tips",
        "total_new": seeded_count,
        "pillar_counts": pillar_counts
    }


@router.post("/tips/csv-upload")
async def upload_tips_from_csv(
    pillar: str,
    csv_content: str
):
    """
    Upload tips from CSV content.
    CSV format: tip,action,emoji,category,action_type,action_url
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    import csv
    from io import StringIO
    
    timestamp = datetime.now(timezone.utc)
    reader = csv.DictReader(StringIO(csv_content))
    
    seeded = 0
    errors = []
    
    for row in reader:
        try:
            tip = {
                "id": str(ObjectId()),
                "tip": row.get("tip", "").strip(),
                "action": row.get("action", "View").strip(),
                "emoji": row.get("emoji", "💡").strip(),
                "category": row.get("category", "general").strip(),
                "pillar": pillar,
                "action_type": row.get("action_type", "").strip() or None,
                "action_url": row.get("action_url", "").strip() or None,
                "is_active": True,
                "created_at": timestamp
            }
            
            if not tip["tip"]:
                continue
            
            await db.quick_win_tips.update_one(
                {"tip": tip["tip"], "pillar": pillar},
                {"$set": tip},
                upsert=True
            )
            seeded += 1
        except Exception as e:
            errors.append(f"Row error: {str(e)}")
    
    return {"seeded": seeded, "errors": errors if errors else None}


# ==================== JOURNEY RECOMMENDATIONS ====================
# Pet Soul-aware, Cross-pillar journey recommendations

class JourneyRecommendationRequest(BaseModel):
    pet_id: str
    pillar: str
    pet_allergies: List[str] = []
    pet_size: Optional[str] = None
    pet_age: Optional[str] = None
    pet_breed: Optional[str] = None

@router.post("/recommendations/journey")
async def get_journey_recommendations(request: JourneyRecommendationRequest):
    """
    Get personalized recommendations for a pet based on:
    - Current pillar context
    - Pet's allergies (filter out unsafe products)
    - Pet's size, age, breed
    - Cross-pillar journey opportunities
    """
    recommendations = []
    
    # Build allergy filter
    allergy_filter = {}
    if request.pet_allergies:
        # Exclude products containing allergens
        allergy_keywords = [a.lower() for a in request.pet_allergies if a and a.lower() not in ['no', 'none', 'na']]
        if allergy_keywords:
            allergy_filter = {
                "$and": [
                    {"ingredients": {"$not": {"$regex": kw, "$options": "i"}}}
                    for kw in allergy_keywords[:5]  # Limit to 5 allergens
                ]
            }
    
    # Get products from current pillar
    pillar_query = {"pillar": request.pillar, "is_active": {"$ne": False}}
    if allergy_filter:
        pillar_query.update(allergy_filter)
    
    pillar_products = await db.products.find(
        pillar_query,
        {"_id": 0, "id": 1, "name": 1, "title": 1, "price": 1, "image": 1, "pillar": 1, "type": 1}
    ).limit(4).to_list(4)
    
    for p in pillar_products:
        recommendations.append({
            "id": p.get("id"),
            "name": p.get("name") or p.get("title"),
            "price": p.get("price"),
            "image": p.get("image"),
            "pillar": p.get("pillar", request.pillar),
            "type": "product"
        })
    
    # Get cross-pillar recommendations
    cross_pillar_map = {
        "celebrate": ["shop", "dine", "enjoy"],
        "stay": ["travel", "shop", "dine"],
        "travel": ["stay", "shop", "care"],
        "care": ["shop", "fit", "dine"],
        "dine": ["enjoy", "shop", "celebrate"],
        "enjoy": ["dine", "shop", "fit"],
        "fit": ["shop", "care", "dine"],
        "learn": ["shop", "fit", "care"],
        "shop": ["fit", "care", "celebrate"]
    }
    
    cross_pillars = cross_pillar_map.get(request.pillar, ["shop"])
    for cross_pillar in cross_pillars[:2]:
        cross_query = {"pillar": cross_pillar, "is_active": {"$ne": False}}
        if allergy_filter:
            cross_query.update(allergy_filter)
        
        cross_products = await db.products.find(
            cross_query,
            {"_id": 0, "id": 1, "name": 1, "title": 1, "price": 1, "image": 1, "pillar": 1}
        ).limit(2).to_list(2)
        
        for p in cross_products:
            recommendations.append({
                "id": p.get("id"),
                "name": p.get("name") or p.get("title"),
                "price": p.get("price"),
                "image": p.get("image"),
                "pillar": p.get("pillar", cross_pillar),
                "type": "product",
                "cross_sell": True
            })
    
    # Get services from current pillar
    services = await db.services.find(
        {"pillar": request.pillar, "is_active": {"$ne": False}},
        {"_id": 0, "id": 1, "name": 1, "title": 1, "price": 1, "image": 1, "pillar": 1}
    ).limit(2).to_list(2)
    
    for s in services:
        recommendations.append({
            "id": s.get("id"),
            "name": s.get("name") or s.get("title"),
            "price": s.get("price"),
            "image": s.get("image"),
            "pillar": s.get("pillar", request.pillar),
            "type": "service"
        })
    
    return {
        "recommendations": recommendations[:8],  # Max 8 recommendations
        "pet_id": request.pet_id,
        "pillar": request.pillar,
        "filtered_allergies": request.pet_allergies
    }

@router.post("/journey-intent")
async def record_journey_intent(
    journey_id: str,
    pet_id: Optional[str] = None,
    pet_name: Optional[str] = None,
    pillars: List[str] = []
):
    """Record when a user starts a journey - creates ticket for follow-up"""
    from ticket_auto_creation import auto_create_ticket
    
    timestamp = datetime.now(timezone.utc).isoformat()
    
    intent = {
        "id": str(ObjectId()),
        "journey_id": journey_id,
        "pet_id": pet_id,
        "pet_name": pet_name,
        "pillars": pillars,
        "status": "started",
        "created_at": timestamp
    }
    
    await db.journey_intents.insert_one(intent)
    
    # Create ticket for concierge follow-up
    try:
        await auto_create_ticket(
            source="journey_intent",
            pillar=pillars[0] if pillars else "general",
            title=f"Journey Started: {journey_id} for {pet_name or 'Pet'}",
            description=f"User started a cross-pillar journey: {journey_id}. Pillars involved: {', '.join(pillars)}",
            urgency="medium"
        )
    except Exception as e:
        logger.debug(f"Ticket creation for journey: {e}")
    
    return {"status": "recorded", "intent_id": intent["id"]}

