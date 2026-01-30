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
                        from central_signal_flow import trigger_unified_flow
                        await trigger_unified_flow(
                            db=db,
                            action_type="streak_reward",
                            user_id=user_id,
                            data={
                                "streak_days": new_streak,
                                "badge": reward["badge"],
                                "points": reward["points"],
                                "icon": reward.get("icon", "🔥")
                            },
                            source="engagement_engine"
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
