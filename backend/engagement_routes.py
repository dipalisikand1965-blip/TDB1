"""
engagement_routes.py
Admin routes for managing engagement components:
- Transformation Stories
- Quick Win Tips
- Social Proof Stats
- Fitness Goals

All interactions trigger the Universal Signal Flow:
Notification → Service Desk Ticket → Unified Inbox Entry
And update Pet Soul for Mira to learn
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/api/engagement", tags=["Engagement"])

# ==================== MODELS ====================

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

class QuickWinTip(BaseModel):
    tip: str
    action: str
    emoji: str
    category: str  # weight, puppy, senior, general, breed-specific
    breed_specific: Optional[str] = None
    pillar: str = "fit"
    is_active: bool = True

class GoalInteraction(BaseModel):
    goal_id: str
    goal_label: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    pillar: str = "fit"
    message: Optional[str] = None

class SocialProofStats(BaseModel):
    journeys_started: int = 847
    weekly_bookings: int = 12
    satisfaction_rate: int = 98
    pillar: str = "fit"

# ==================== HELPER FUNCTIONS ====================

async def trigger_universal_signal_flow(
    db, 
    signal_type: str, 
    data: Dict[str, Any],
    user_id: str = None,
    pet_id: str = None,
    pillar: str = "fit"
):
    """
    Triggers the mandatory Universal Signal Flow:
    1. Create Notification
    2. Create Service Desk Ticket
    3. Create Unified Inbox Entry
    4. Update Pet Soul (if pet_id provided)
    """
    timestamp = datetime.now(timezone.utc)
    
    # 1. Create Notification
    notification = {
        "user_id": user_id,
        "type": signal_type,
        "title": data.get("title", f"New {signal_type}"),
        "message": data.get("message", ""),
        "pillar": pillar,
        "read": False,
        "created_at": timestamp,
        "metadata": data
    }
    await db.notifications.insert_one(notification)
    
    # 2. Create Service Desk Ticket
    ticket = {
        "ticket_type": signal_type,
        "source": "engagement_component",
        "pillar": pillar,
        "user_id": user_id,
        "pet_id": pet_id,
        "status": "new",
        "priority": "normal",
        "data": data,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    ticket_result = await db.service_desk_tickets.insert_one(ticket)
    
    # 3. Create Unified Inbox Entry
    inbox_entry = {
        "type": signal_type,
        "source": "engagement",
        "pillar": pillar,
        "user_id": user_id,
        "pet_id": pet_id,
        "ticket_id": str(ticket_result.inserted_id),
        "summary": data.get("message", data.get("title", "")),
        "status": "unread",
        "created_at": timestamp,
        "metadata": data
    }
    await db.unified_inbox.insert_one(inbox_entry)
    
    # 4. Update Pet Soul (if pet_id provided)
    if pet_id:
        await update_pet_soul_interaction(db, pet_id, signal_type, data, pillar)
    
    return str(ticket_result.inserted_id)

async def update_pet_soul_interaction(
    db,
    pet_id: str,
    interaction_type: str,
    data: Dict[str, Any],
    pillar: str
):
    """
    Update Pet Soul with new interaction data for Mira to learn
    """
    interaction = {
        "type": interaction_type,
        "pillar": pillar,
        "timestamp": datetime.now(timezone.utc),
        "data": data
    }
    
    # Add to pet's soul interactions
    await db.pets.update_one(
        {"_id": ObjectId(pet_id)} if ObjectId.is_valid(pet_id) else {"id": pet_id},
        {
            "$push": {
                "soul.interactions": {
                    "$each": [interaction],
                    "$slice": -100  # Keep last 100 interactions
                }
            },
            "$set": {
                "soul.last_interaction": datetime.now(timezone.utc),
                f"soul.pillar_engagement.{pillar}": datetime.now(timezone.utc)
            },
            "$inc": {
                "soul.total_interactions": 1,
                f"soul.pillar_counts.{pillar}": 1
            }
        }
    )
    
    # Update pet parent dashboard stats
    pet = await db.pets.find_one(
        {"_id": ObjectId(pet_id)} if ObjectId.is_valid(pet_id) else {"id": pet_id},
        {"owner_id": 1, "user_id": 1}
    )
    if pet:
        owner_id = pet.get("owner_id") or pet.get("user_id")
        if owner_id:
            await db.users.update_one(
                {"_id": ObjectId(owner_id)} if ObjectId.is_valid(owner_id) else {"id": owner_id},
                {
                    "$inc": {"engagement_score": 1},
                    "$set": {"last_engagement": datetime.now(timezone.utc)}
                }
            )

# ==================== TRANSFORMATION STORIES ROUTES ====================

@router.get("/transformations")
async def get_transformation_stories(pillar: str = "fit", active_only: bool = True):
    """Get all transformation stories for a pillar"""
    from server import db
    
    query = {"pillar": pillar}
    if active_only:
        query["is_active"] = True
    
    stories = await db.transformation_stories.find(query).sort("created_at", -1).to_list(50)
    
    # Convert ObjectId to string
    for story in stories:
        story["id"] = str(story.pop("_id"))
    
    return {"stories": stories, "count": len(stories)}

@router.post("/transformations")
async def create_transformation_story(story: TransformationStory):
    """Admin: Create a new transformation story"""
    from server import db
    
    story_dict = story.dict()
    story_dict["created_at"] = datetime.now(timezone.utc)
    story_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.transformation_stories.insert_one(story_dict)
    
    return {"id": str(result.inserted_id), "message": "Transformation story created"}

@router.put("/transformations/{story_id}")
async def update_transformation_story(story_id: str, story: TransformationStory):
    """Admin: Update a transformation story"""
    from server import db
    
    story_dict = story.dict()
    story_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.transformation_stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$set": story_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return {"message": "Story updated"}

@router.delete("/transformations/{story_id}")
async def delete_transformation_story(story_id: str):
    """Admin: Delete a transformation story"""
    from server import db
    
    result = await db.transformation_stories.delete_one({"_id": ObjectId(story_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return {"message": "Story deleted"}

# ==================== QUICK WIN TIPS ROUTES ====================

@router.get("/tips")
async def get_quick_win_tips(pillar: str = "fit", category: str = None, breed: str = None):
    """Get quick win tips, optionally filtered"""
    from server import db
    
    query = {"pillar": pillar, "is_active": True}
    if category:
        query["category"] = category
    if breed:
        query["$or"] = [
            {"breed_specific": breed.lower()},
            {"breed_specific": None},
            {"category": "general"}
        ]
    
    tips = await db.quick_win_tips.find(query).to_list(100)
    
    for tip in tips:
        tip["id"] = str(tip.pop("_id"))
    
    return {"tips": tips, "count": len(tips)}

@router.post("/tips")
async def create_quick_win_tip(tip: QuickWinTip):
    """Admin: Create a new quick win tip"""
    from server import db
    
    tip_dict = tip.dict()
    tip_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.quick_win_tips.insert_one(tip_dict)
    
    return {"id": str(result.inserted_id), "message": "Tip created"}

@router.put("/tips/{tip_id}")
async def update_quick_win_tip(tip_id: str, tip: QuickWinTip):
    """Admin: Update a quick win tip"""
    from server import db
    
    result = await db.quick_win_tips.update_one(
        {"_id": ObjectId(tip_id)},
        {"$set": tip.dict()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    return {"message": "Tip updated"}

@router.delete("/tips/{tip_id}")
async def delete_quick_win_tip(tip_id: str):
    """Admin: Delete a quick win tip"""
    from server import db
    
    result = await db.quick_win_tips.delete_one({"_id": ObjectId(tip_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tip not found")
    
    return {"message": "Tip deleted"}

# ==================== GOAL INTERACTIONS (WITH UNIVERSAL FLOW) ====================

@router.post("/goal-interaction")
async def record_goal_interaction(interaction: GoalInteraction):
    """
    Record when a user clicks a fitness goal
    Triggers Universal Signal Flow + Updates Pet Soul
    """
    from server import db
    
    # Prepare signal data
    signal_data = {
        "title": f"Fitness Goal Interest: {interaction.goal_label}",
        "message": interaction.message or f"User interested in {interaction.goal_label}",
        "goal_id": interaction.goal_id,
        "goal_label": interaction.goal_label,
        "pet_name": interaction.pet_name
    }
    
    # Trigger Universal Signal Flow
    ticket_id = await trigger_universal_signal_flow(
        db=db,
        signal_type="fitness_goal_interest",
        data=signal_data,
        user_id=interaction.user_id,
        pet_id=interaction.pet_id,
        pillar=interaction.pillar
    )
    
    return {
        "message": "Goal interaction recorded",
        "ticket_id": ticket_id,
        "redirect_to": f"/mira?context={interaction.pillar}_{interaction.goal_id}&preset={interaction.message}"
    }

# ==================== SOCIAL PROOF STATS ROUTES ====================

@router.get("/stats/{pillar}")
async def get_social_proof_stats(pillar: str = "fit"):
    """Get social proof stats for a pillar"""
    from server import db
    
    stats = await db.social_proof_stats.find_one({"pillar": pillar})
    
    if not stats:
        # Return defaults
        return {
            "journeys_started": 847,
            "weekly_bookings": 12,
            "satisfaction_rate": 98,
            "pillar": pillar
        }
    
    stats.pop("_id", None)
    return stats

@router.put("/stats/{pillar}")
async def update_social_proof_stats(pillar: str, stats: SocialProofStats):
    """Admin: Update social proof stats"""
    from server import db
    
    await db.social_proof_stats.update_one(
        {"pillar": pillar},
        {"$set": stats.dict()},
        upsert=True
    )
    
    return {"message": "Stats updated"}

# ==================== SEED DEFAULT DATA ====================

@router.post("/seed-defaults")
async def seed_default_engagement_data():
    """Admin: Seed default transformation stories and tips"""
    from server import db
    
    # Default transformation stories
    default_stories = [
        {
            "pet_name": "Bruno",
            "breed": "Labrador",
            "owner_name": "Priya M.",
            "before_image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
            "after_image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
            "achievement": "Lost 4kg in 10 weeks",
            "testimonial": "The trainers understood Bruno perfectly. He actually enjoys his workouts now!",
            "program": "Weight Journey Partner®",
            "rating": 5,
            "pillar": "fit",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "pet_name": "Coco",
            "breed": "Beagle",
            "owner_name": "Rahul S.",
            "before_image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop",
            "after_image": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop",
            "achievement": "From couch potato to agility star",
            "testimonial": "Coco went from sleeping all day to winning her first agility ribbon!",
            "program": "Active Lifestyle Curator®",
            "rating": 5,
            "pillar": "fit",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Default quick win tips
    default_tips = [
        {"tip": "15-minute morning walks boost metabolism by 20%", "action": "Set reminder", "emoji": "🌅", "category": "weight", "pillar": "fit", "is_active": True},
        {"tip": "Swimming burns 3x more calories than walking", "action": "Book session", "emoji": "🏊", "category": "weight", "pillar": "fit", "is_active": True},
        {"tip": "Short 5-min training sessions work best for puppies", "action": "View tips", "emoji": "🎯", "category": "puppy", "pillar": "fit", "is_active": True},
        {"tip": "Gentle stretching maintains joint flexibility", "action": "View exercises", "emoji": "🧘", "category": "senior", "pillar": "fit", "is_active": True},
        {"tip": "Interactive play strengthens your bond", "action": "Shop toys", "emoji": "💕", "category": "general", "pillar": "fit", "is_active": True},
    ]
    
    # Insert if not exists
    for story in default_stories:
        await db.transformation_stories.update_one(
            {"pet_name": story["pet_name"], "pillar": story["pillar"]},
            {"$setOnInsert": story},
            upsert=True
        )
    
    for tip in default_tips:
        tip["created_at"] = datetime.now(timezone.utc)
        await db.quick_win_tips.update_one(
            {"tip": tip["tip"], "pillar": tip["pillar"]},
            {"$setOnInsert": tip},
            upsert=True
        )
    
    return {"message": "Default engagement data seeded", "stories": len(default_stories), "tips": len(default_tips)}
