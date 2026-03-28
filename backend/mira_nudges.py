"""
Mira Nudges Engine - Proactive AI reminders and notifications
- Vaccination reminders
- Grooming reminders
- Birthday/Gotcha day reminders
- Health check reminders
- Reorder suggestions

All nudges integrate with:
- Push Notifications (browser)
- Admin notifications
- Service desk tickets
- Unified inbox
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nudges", tags=["Mira Nudges"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

# ==================== MODELS ====================

class NudgeType(BaseModel):
    id: str
    name: str
    icon: str
    template: str  # Template message with {pet_name}, {days}, etc.
    trigger_type: str  # date_based, frequency_based, event_based
    trigger_config: Dict[str, Any]  # days_before, interval_days, etc.
    pillar: str  # Which service pillar this relates to
    priority: str = "normal"  # low, normal, high, urgent
    is_active: bool = True
    push_enabled: bool = True
    whatsapp_enabled: bool = True

class NudgeSchedule(BaseModel):
    pet_id: str
    user_id: str
    nudge_type: str
    scheduled_for: str  # ISO date
    status: str = "pending"  # pending, sent, dismissed, completed
    metadata: Optional[Dict[str, Any]] = None

# ==================== DEFAULT NUDGE TYPES ====================

DEFAULT_NUDGE_TYPES = [
    {
        "id": "vaccination_reminder",
        "name": "Vaccination Due",
        "icon": "💉",
        "template": "🐾 {pet_name}'s vaccination is due in {days} days! Book a vet appointment to keep them protected.",
        "trigger_type": "date_based",
        "trigger_config": {"days_before": [7, 3, 1], "date_field": "next_vaccination_date"},
        "pillar": "care",
        "priority": "high",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "grooming_reminder",
        "name": "Grooming Time",
        "icon": "✂️",
        "template": "✨ Time for {pet_name}'s grooming session! It's been {days} days since their last appointment.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 30, "date_field": "last_grooming_date"},
        "pillar": "care",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "birthday_reminder",
        "name": "Birthday Coming",
        "icon": "🎂",
        "template": "🎉 {pet_name}'s birthday is in {days} days! Plan something special at /celebrate",
        "trigger_type": "date_based",
        "trigger_config": {"days_before": [14, 7, 3, 1], "date_field": "birth_date", "annual": True},
        "pillar": "celebrate",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "gotcha_day_reminder",
        "name": "Gotcha Day Coming",
        "icon": "💝",
        "template": "💖 {pet_name}'s gotcha day anniversary is in {days} days! Celebrate this special bond!",
        "trigger_type": "date_based",
        "trigger_config": {"days_before": [7, 3, 1], "date_field": "gotcha_date", "annual": True},
        "pillar": "celebrate",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "health_checkup",
        "name": "Health Checkup Due",
        "icon": "🩺",
        "template": "🏥 {pet_name} is due for a health checkup! Regular vet visits help catch issues early.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 180, "date_field": "last_vet_visit"},
        "pillar": "care",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "dental_checkup",
        "name": "Dental Care Reminder",
        "icon": "🦷",
        "template": "🦷 {pet_name}'s dental health matters! Schedule a dental checkup.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 365, "date_field": "last_dental_date"},
        "pillar": "care",
        "priority": "low",
        "push_enabled": True,
        "whatsapp_enabled": False,
        "is_active": True
    },
    {
        "id": "flea_tick_prevention",
        "name": "Flea & Tick Prevention",
        "icon": "🐛",
        "template": "🛡️ Time for {pet_name}'s flea & tick prevention! Keep those pests away.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 30, "date_field": "last_flea_treatment"},
        "pillar": "care",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "food_reorder",
        "name": "Food Reorder",
        "icon": "🍖",
        "template": "🛒 Running low on {pet_name}'s food? Reorder now and get 10% off!",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 25, "date_field": "last_food_order"},
        "pillar": "shop",
        "priority": "low",
        "push_enabled": True,
        "whatsapp_enabled": False,
        "is_active": True
    },
    {
        "id": "insurance_renewal",
        "name": "Insurance Renewal",
        "icon": "🛡️",
        "template": "📋 {pet_name}'s insurance is up for renewal in {days} days. Review your coverage!",
        "trigger_type": "date_based",
        "trigger_config": {"days_before": [30, 14, 7], "date_field": "insurance_expiry"},
        "pillar": "paperwork",
        "priority": "high",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "license_renewal",
        "name": "License Renewal",
        "icon": "📄",
        "template": "📋 {pet_name}'s license expires in {days} days. Time to renew!",
        "trigger_type": "date_based",
        "trigger_config": {"days_before": [30, 14, 7], "date_field": "license_expiry"},
        "pillar": "paperwork",
        "priority": "high",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "weight_check",
        "name": "Weight Check",
        "icon": "⚖️",
        "template": "📊 Time to weigh {pet_name}! Regular weight monitoring helps track their health.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 30, "date_field": "last_weight_date"},
        "pillar": "fit",
        "priority": "low",
        "push_enabled": True,
        "whatsapp_enabled": False,
        "is_active": True
    },
    {
        "id": "training_followup",
        "name": "Training Follow-up",
        "icon": "🎓",
        "template": "📚 Keep up with {pet_name}'s training! Practice makes perfect.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 7, "date_field": "last_training_session"},
        "pillar": "learn",
        "priority": "low",
        "push_enabled": True,
        "whatsapp_enabled": False,
        "is_active": True
    },
    {
        "id": "soul_incomplete",
        "name": "Complete Pet Soul",
        "icon": "✨",
        "template": "🌟 {pet_name}'s Pet Soul™ is {score}% complete! Answer a few questions to unlock personalized recommendations.",
        "trigger_type": "event_based",
        "trigger_config": {"condition": "soul_score_below", "threshold": 75},
        "pillar": "advisory",
        "priority": "normal",
        "push_enabled": True,
        "whatsapp_enabled": True,
        "is_active": True
    },
    {
        "id": "activity_reminder",
        "name": "Activity Reminder",
        "icon": "🏃",
        "template": "🎾 {pet_name} needs their daily exercise! Time for a walk or play session.",
        "trigger_type": "frequency_based",
        "trigger_config": {"interval_days": 1, "time_of_day": "evening"},
        "pillar": "enjoy",
        "priority": "low",
        "push_enabled": True,
        "whatsapp_enabled": False,
        "is_active": True
    }
]

# ==================== ADMIN CONFIG ENDPOINTS ====================

@router.get("/admin/types")
async def get_nudge_types():
    """Get all nudge types (admin configurable)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    config = await db.app_settings.find_one({"key": "nudge_types"}, {"_id": 0})
    if not config:
        # Initialize with defaults
        await db.app_settings.insert_one({
            "key": "nudge_types",
            "value": DEFAULT_NUDGE_TYPES,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return DEFAULT_NUDGE_TYPES
    return config.get("value", DEFAULT_NUDGE_TYPES)

@router.put("/admin/types")
async def update_nudge_types(types: List[Dict[str, Any]]):
    """Update nudge types (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await db.app_settings.update_one(
        {"key": "nudge_types"},
        {"$set": {"value": types, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "success", "message": "Nudge types updated"}

# ==================== NUDGE GENERATION ====================

@router.post("/generate/{pet_id}")
async def generate_nudges_for_pet(pet_id: str, background_tasks: BackgroundTasks):
    """Generate all applicable nudges for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    user = await db.users.find_one({"id": pet.get("user_id")}) if pet.get("user_id") else None
    
    # Get nudge types
    config = await db.app_settings.find_one({"key": "nudge_types"}, {"_id": 0})
    nudge_types = config.get("value", DEFAULT_NUDGE_TYPES) if config else DEFAULT_NUDGE_TYPES
    
    generated_nudges = []
    today = datetime.now(timezone.utc).date()
    
    for nudge_type in nudge_types:
        if not nudge_type.get("is_active", True):
            continue
        
        trigger_type = nudge_type.get("trigger_type")
        trigger_config = nudge_type.get("trigger_config", {})
        
        should_nudge = False
        days_until = 0
        
        if trigger_type == "date_based":
            date_field = trigger_config.get("date_field")
            days_before_list = trigger_config.get("days_before", [7, 3, 1])
            is_annual = trigger_config.get("annual", False)
            
            if date_field and pet.get(date_field):
                try:
                    target_date = datetime.fromisoformat(pet[date_field].replace('Z', '+00:00')).date()
                    
                    if is_annual:
                        # For annual events (birthday), use this year's date
                        target_date = target_date.replace(year=today.year)
                        if target_date < today:
                            target_date = target_date.replace(year=today.year + 1)
                    
                    days_until = (target_date - today).days
                    should_nudge = days_until in days_before_list
                except:
                    pass
        
        elif trigger_type == "frequency_based":
            date_field = trigger_config.get("date_field")
            interval_days = trigger_config.get("interval_days", 30)
            
            if date_field:
                last_date = pet.get(date_field) or pet.get("health", {}).get(date_field)
                if last_date:
                    try:
                        last = datetime.fromisoformat(last_date.replace('Z', '+00:00')).date()
                        days_since = (today - last).days
                        should_nudge = days_since >= interval_days
                        days_until = days_since - interval_days
                    except:
                        pass
                else:
                    # No record, might need this service
                    should_nudge = True
                    days_until = 0
        
        elif trigger_type == "event_based":
            condition = trigger_config.get("condition")
            if condition == "soul_score_below":
                threshold = trigger_config.get("threshold", 75)
                score = pet.get("overall_score", 0)
                should_nudge = score < threshold
        
        if should_nudge:
            # Check if we already have a pending nudge of this type
            existing = await db.nudge_schedules.find_one({
                "pet_id": pet_id,
                "nudge_type": nudge_type["id"],
                "status": "pending"
            })
            
            if not existing:
                # Create the nudge
                message = nudge_type["template"].format(
                    pet_name=pet.get("name", "Your pet"),
                    days=abs(days_until),
                    score=pet.get("overall_score", 0)
                )
                
                nudge_doc = {
                    "id": str(ObjectId()),
                    "pet_id": pet_id,
                    "user_id": pet.get("user_id"),
                    "nudge_type": nudge_type["id"],
                    "message": message,
                    "pillar": nudge_type.get("pillar", "general"),
                    "priority": nudge_type.get("priority", "normal"),
                    "scheduled_for": datetime.now(timezone.utc).isoformat(),
                    "status": "pending",
                    "push_enabled": nudge_type.get("push_enabled", True),
                    "whatsapp_enabled": nudge_type.get("whatsapp_enabled", False),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.nudge_schedules.insert_one(nudge_doc)
                generated_nudges.append(nudge_doc)
                
                # Trigger notification via unified flow
                try:
                    from central_signal_flow import create_signal
                    await create_signal(
                        pillar=nudge_type.get("pillar", "care"),
                        action_type="mira_nudge",
                        title=f"{nudge_type['icon']} {nudge_type['name']}",
                        description=message,
                        pet_name=pet.get("name"),
                        pet_id=pet_id,
                        customer_name=user.get("name") if user else None,
                        customer_email=user.get("email") if user else None,
                        urgency="low" if nudge_type.get("priority") == "low" else "normal",
                        source="mira_nudges",
                        extra_data={
                            "nudge_type": nudge_type["id"],
                            "push_enabled": nudge_type.get("push_enabled", True),
                            "pillar": nudge_type.get("pillar")
                        }
                    )
                except Exception as e:
                    logger.warning(f"Could not trigger unified flow for nudge: {e}")
    
    return {
        "status": "success",
        "pet_id": pet_id,
        "nudges_generated": len(generated_nudges),
        "nudges": [{k: v for k, v in n.items() if k != "_id"} for n in generated_nudges]
    }

@router.get("/pending/{user_id}")
async def get_pending_nudges(user_id: str):
    """Get all pending nudges for a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    nudges = await db.nudge_schedules.find(
        {"user_id": user_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return nudges

@router.post("/dismiss/{nudge_id}")
async def dismiss_nudge(nudge_id: str):
    """Dismiss a nudge"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await db.nudge_schedules.update_one(
        {"id": nudge_id},
        {"$set": {"status": "dismissed", "dismissed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nudge not found")
    
    return {"status": "success", "message": "Nudge dismissed"}

@router.post("/complete/{nudge_id}")
async def complete_nudge(nudge_id: str):
    """Mark a nudge as completed (action taken)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await db.nudge_schedules.update_one(
        {"id": nudge_id},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nudge not found")
    
    return {"status": "success", "message": "Nudge completed"}

# ==================== BATCH PROCESSING ====================

@router.post("/process-all")
async def process_all_pets():
    """Process nudges for all pets (scheduled job)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pets = await db.pets.find({}, {"id": 1}).to_list(1000)
    processed = 0
    total_nudges = 0
    
    for pet in pets:
        try:
            # Generate nudges for each pet
            result = await generate_nudges_for_pet(pet["id"], BackgroundTasks())
            total_nudges += result.get("nudges_generated", 0)
            processed += 1
        except Exception as e:
            logger.warning(f"Error processing nudges for pet {pet['id']}: {e}")
    
    return {
        "status": "success",
        "pets_processed": processed,
        "total_nudges_generated": total_nudges
    }



@router.post("/process-overdue")
async def process_overdue_nudges():
    """
    Admin endpoint: expire stale nudges (>3 days overdue).
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    from datetime import datetime, timezone, timedelta

    now = datetime.now(timezone.utc)
    stale_cutoff = (now - timedelta(days=3)).isoformat()
    recent_cutoff = now.isoformat()

    expired_result = await db.nudge_schedules.update_many(
        {"status": "pending", "scheduled_for": {"$lt": stale_cutoff}},
        {"$set": {"status": "expired", "expired_at": now.isoformat()}}
    )

    fresh_pending = await db.nudge_schedules.count_documents({
        "status": "pending",
        "scheduled_for": {"$lt": recent_cutoff, "$gte": stale_cutoff}
    })

    return {
        "status": "success",
        "expired": expired_result.modified_count,
        "fresh_pending": fresh_pending,
        "message": f"Expired {expired_result.modified_count} stale nudges. {fresh_pending} fresh nudges remain pending."
    }
