"""
PWA Push Notifications Backend
Handles Web Push subscriptions, sending notifications, and Soul Whisper delivery

Features:
- VAPID key generation and management
- Push subscription storage
- Soul Whisper personalized notifications
- Batch notification sending
"""

import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from pywebpush import webpush, WebPushException
from py_vapid import Vapid

logger = logging.getLogger(__name__)

# Router
push_router = APIRouter(prefix="/api/push", tags=["Push Notifications"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== VAPID KEYS ====================

# VAPID keys for Web Push - will be auto-generated if not present
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {
    "sub": "mailto:woof@thedoggycompany.in"
}

async def get_or_create_vapid_keys() -> Dict[str, str]:
    """Get VAPID keys from env or database, or generate new ones"""
    global VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY
    
    # If we have keys in environment, use them
    if VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY:
        return {"public_key": VAPID_PUBLIC_KEY, "private_key": VAPID_PRIVATE_KEY}
    
    # Try to get from database
    if db is not None:
        keys_doc = await db.settings.find_one({"type": "vapid_keys"})
        if keys_doc:
            VAPID_PRIVATE_KEY = keys_doc.get("private_key", "")
            VAPID_PUBLIC_KEY = keys_doc.get("public_key", "")
            return {"public_key": VAPID_PUBLIC_KEY, "private_key": VAPID_PRIVATE_KEY}
    
    # Generate new keys using py_vapid
    logger.info("Generating new VAPID keys...")
    from cryptography.hazmat.primitives import serialization
    import base64
    
    vapid = Vapid()
    vapid.generate_keys()
    
    # Get private key in PEM format for pywebpush
    VAPID_PRIVATE_KEY = vapid.private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    # Get public key in uncompressed point format and convert to URL-safe base64
    public_key_bytes = vapid.public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    VAPID_PUBLIC_KEY = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')
    
    # Store in database for persistence
    if db is not None:
        await db.settings.update_one(
            {"type": "vapid_keys"},
            {"$set": {
                "type": "vapid_keys",
                "private_key": VAPID_PRIVATE_KEY,
                "public_key": VAPID_PUBLIC_KEY,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        logger.info("VAPID keys generated and stored in database")
    
    return {"public_key": VAPID_PUBLIC_KEY, "private_key": VAPID_PRIVATE_KEY}


# ==================== MODELS ====================

class PushSubscription(BaseModel):
    """Web Push subscription data"""
    endpoint: str
    keys: Dict[str, str]  # p256dh, auth
    expiration_time: Optional[int] = None


class SubscribeRequest(BaseModel):
    """Request to subscribe to push notifications"""
    subscription: PushSubscription
    user_id: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None  # soul_whisper, order_updates, etc.


class SendNotificationRequest(BaseModel):
    """Request to send a push notification"""
    user_id: Optional[str] = None  # Target specific user
    title: str
    body: str
    icon: Optional[str] = "/logo-new.png"
    badge: Optional[str] = "/logo-new.png"
    tag: Optional[str] = None  # For notification grouping
    data: Optional[Dict[str, Any]] = None  # Custom data for click handling
    actions: Optional[List[Dict[str, str]]] = None  # Notification actions
    require_interaction: Optional[bool] = False
    silent: Optional[bool] = False


class SoulWhisperMessage(BaseModel):
    """Soul Whisper notification message"""
    pet_name: str
    message: str
    tip_type: str = "general"  # general, health, activity, mood, nutrition
    action_url: Optional[str] = None


# ==================== SUBSCRIPTION MANAGEMENT ====================

@push_router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Get the public VAPID key for client-side subscription"""
    keys = await get_or_create_vapid_keys()
    return {"public_key": keys["public_key"]}


@push_router.post("/subscribe")
async def subscribe_to_push(request: SubscribeRequest):
    """Subscribe a user to push notifications"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    subscription_data = {
        "endpoint": request.subscription.endpoint,
        "keys": request.subscription.keys,
        "expiration_time": request.subscription.expiration_time,
        "user_id": request.user_id,
        "preferences": request.preferences or {
            "soul_whisper": True,
            "order_updates": True,
            "concierge_updates": True,
            "promotions": False
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    
    # Upsert subscription (update if endpoint exists, insert if new)
    result = await db.push_subscriptions.update_one(
        {"endpoint": request.subscription.endpoint},
        {"$set": subscription_data},
        upsert=True
    )
    
    logger.info(f"Push subscription {'updated' if result.matched_count else 'created'} for user: {request.user_id}")
    
    return {
        "success": True,
        "message": "Subscribed to push notifications",
        "subscription_id": str(result.upserted_id) if result.upserted_id else None
    }


@push_router.post("/unsubscribe")
async def unsubscribe_from_push(subscription: PushSubscription):
    """Unsubscribe from push notifications"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await db.push_subscriptions.update_one(
        {"endpoint": subscription.endpoint},
        {"$set": {"active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": "Unsubscribed from push notifications",
        "modified": result.modified_count > 0
    }


@push_router.put("/preferences/{user_id}")
async def update_push_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update push notification preferences for a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await db.push_subscriptions.update_many(
        {"user_id": user_id, "active": True},
        {"$set": {"preferences": preferences, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": "Preferences updated",
        "updated_subscriptions": result.modified_count
    }


# ==================== SENDING NOTIFICATIONS ====================

async def send_push_notification(
    subscription_info: Dict,
    title: str,
    body: str,
    icon: str = "/logo-new.png",
    badge: str = "/logo-new.png",
    tag: Optional[str] = None,
    data: Optional[Dict] = None,
    actions: Optional[List[Dict]] = None,
    require_interaction: bool = False,
    silent: bool = False
) -> Dict[str, Any]:
    """Send a push notification to a single subscription"""
    
    keys = await get_or_create_vapid_keys()
    
    notification_payload = {
        "title": title,
        "body": body,
        "icon": icon,
        "badge": badge,
        "timestamp": datetime.now(timezone.utc).timestamp() * 1000,
        "requireInteraction": require_interaction,
        "silent": silent
    }
    
    if tag:
        notification_payload["tag"] = tag
    if data:
        notification_payload["data"] = data
    if actions:
        notification_payload["actions"] = actions
    
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(notification_payload),
            vapid_private_key=keys["private_key"],
            vapid_claims=VAPID_CLAIMS
        )
        return {"success": True, "endpoint": subscription_info.get("endpoint", "")[:50]}
    except WebPushException as e:
        logger.error(f"Push notification failed: {e}")
        # If subscription is invalid, mark it as inactive
        if e.response and e.response.status_code in [404, 410]:
            if db is not None:
                await db.push_subscriptions.update_one(
                    {"endpoint": subscription_info.get("endpoint")},
                    {"$set": {"active": False, "error": "Subscription expired or invalid"}}
                )
        return {"success": False, "error": str(e), "endpoint": subscription_info.get("endpoint", "")[:50]}


@push_router.post("/send")
async def send_notification(request: SendNotificationRequest, background_tasks: BackgroundTasks):
    """Send a push notification to a user or all subscribers"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Build query
    query = {"active": True}
    if request.user_id:
        query["user_id"] = request.user_id
    
    subscriptions = await db.push_subscriptions.find(query).to_list(1000)
    
    if not subscriptions:
        return {"success": False, "message": "No active subscriptions found", "sent": 0}
    
    results = []
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": sub["keys"]
        }
        
        result = await send_push_notification(
            subscription_info=subscription_info,
            title=request.title,
            body=request.body,
            icon=request.icon,
            badge=request.badge,
            tag=request.tag,
            data=request.data,
            actions=request.actions,
            require_interaction=request.require_interaction,
            silent=request.silent
        )
        results.append(result)
    
    # Log notification
    await db.push_notification_logs.insert_one({
        "title": request.title,
        "body": request.body,
        "user_id": request.user_id,
        "sent_to": len(subscriptions),
        "successful": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success")),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    successful = sum(1 for r in results if r.get("success"))
    return {
        "success": successful > 0,
        "message": f"Notification sent to {successful}/{len(subscriptions)} subscribers",
        "sent": successful,
        "failed": len(subscriptions) - successful
    }


# ==================== SOUL WHISPER ====================

SOUL_WHISPER_TEMPLATES = {
    "general": [
        "💜 {pet_name} says hi! Time for a quick cuddle break?",
        "🐾 Gentle reminder: {pet_name} loves your attention",
        "✨ {pet_name}'s soul tip: A short walk can brighten both your days"
    ],
    "health": [
        "💊 {pet_name}'s wellness check: Has water bowl been refreshed today?",
        "🩺 Quick health tip for {pet_name}: Check those ears and paws!",
        "💧 Hydration reminder for {pet_name} - fresh water is love!"
    ],
    "activity": [
        "🎾 {pet_name} might be ready for some playtime!",
        "🏃 Energy check: {pet_name} could use a good run today",
        "🎯 Mental stimulation idea: Try a puzzle toy with {pet_name}"
    ],
    "mood": [
        "😊 {pet_name} senses your mood - take a moment together",
        "🌈 {pet_name}'s mood booster: Extra belly rubs recommended!",
        "💆 Calm moment: {pet_name} might enjoy some quiet time with you"
    ],
    "nutrition": [
        "🍎 Healthy treat idea for {pet_name}: A small piece of apple (no seeds)!",
        "🥕 Snack time? {pet_name} might love a carrot today",
        "🍗 Meal check: Is {pet_name}'s diet balanced this week?"
    ]
}

import random

async def generate_soul_whisper(pet_data: Dict) -> SoulWhisperMessage:
    """Generate a personalized Soul Whisper message based on pet data"""
    pet_name = pet_data.get("name", "Your pet")
    
    # Analyze pet's soul data to determine message type
    soul_answers = pet_data.get("doggy_soul_answers", {})
    overall_score = pet_data.get("overall_score", 50)
    
    # Determine tip type based on pet's profile
    tip_type = "general"
    
    # If pet has low activity score, suggest activity
    if soul_answers.get("activity_level") in ["low", "sedentary"]:
        tip_type = "activity"
    # If pet has health concerns, focus on health
    elif soul_answers.get("health_concerns") or pet_data.get("health_conditions"):
        tip_type = "health"
    # If anxious personality, focus on mood
    elif soul_answers.get("personality_traits", {}).get("anxiety", 0) > 5:
        tip_type = "mood"
    # Random otherwise
    else:
        tip_type = random.choice(["general", "activity", "mood", "nutrition"])
    
    templates = SOUL_WHISPER_TEMPLATES.get(tip_type, SOUL_WHISPER_TEMPLATES["general"])
    message_template = random.choice(templates)
    message = message_template.format(pet_name=pet_name)
    
    return SoulWhisperMessage(
        pet_name=pet_name,
        message=message,
        tip_type=tip_type,
        action_url=f"/pet/{pet_data.get('_id', '')}" if pet_data.get('_id') else "/pets"
    )


@push_router.post("/soul-whisper/send/{user_id}")
async def send_soul_whisper(user_id: str, background_tasks: BackgroundTasks):
    """Send a Soul Whisper notification to a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get user's pets
    pets = await db.pets.find({"owner_id": user_id}).to_list(10)
    
    if not pets:
        return {"success": False, "message": "No pets found for user"}
    
    # Generate and send Soul Whisper for primary pet
    primary_pet = pets[0]
    whisper = await generate_soul_whisper(primary_pet)
    
    # Check if user has Soul Whisper enabled
    subscriptions = await db.push_subscriptions.find({
        "user_id": user_id,
        "active": True,
        "preferences.soul_whisper": True
    }).to_list(10)
    
    if not subscriptions:
        return {"success": False, "message": "No active subscriptions with Soul Whisper enabled"}
    
    results = []
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": sub["keys"]
        }
        
        result = await send_push_notification(
            subscription_info=subscription_info,
            title=f"Soul Whisper™ 💜 {whisper.pet_name}",
            body=whisper.message,
            icon="/logo-new.png",
            badge="/logo-new.png",
            tag="soul-whisper",
            data={
                "type": "soul_whisper",
                "tip_type": whisper.tip_type,
                "pet_name": whisper.pet_name,
                "url": whisper.action_url
            },
            require_interaction=False
        )
        results.append(result)
    
    successful = sum(1 for r in results if r.get("success"))
    
    # Log Soul Whisper
    await db.soul_whisper_logs.insert_one({
        "user_id": user_id,
        "pet_name": whisper.pet_name,
        "message": whisper.message,
        "tip_type": whisper.tip_type,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "successful": successful > 0
    })
    
    return {
        "success": successful > 0,
        "message": f"Soul Whisper sent: {whisper.message}",
        "whisper": {
            "pet_name": whisper.pet_name,
            "message": whisper.message,
            "tip_type": whisper.tip_type
        }
    }


@push_router.get("/soul-whisper/preview/{user_id}")
async def preview_soul_whisper(user_id: str):
    """Preview what a Soul Whisper would look like for a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get user's primary pet
    pet = await db.pets.find_one({"owner_id": user_id})
    
    if not pet:
        return {"success": False, "message": "No pets found for user"}
    
    whisper = await generate_soul_whisper(pet)
    
    return {
        "success": True,
        "preview": {
            "title": f"Soul Whisper™ 💜 {whisper.pet_name}",
            "body": whisper.message,
            "tip_type": whisper.tip_type,
            "action_url": whisper.action_url
        }
    }


# ==================== STATS & MANAGEMENT ====================

@push_router.get("/stats")
async def get_push_stats():
    """Get push notification statistics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    total_subscriptions = await db.push_subscriptions.count_documents({})
    active_subscriptions = await db.push_subscriptions.count_documents({"active": True})
    
    # Get recent notifications
    recent_logs = await db.push_notification_logs.find({}).sort("timestamp", -1).limit(10).to_list(10)
    
    # Get Soul Whisper stats
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    soul_whispers_today = await db.soul_whisper_logs.count_documents({
        "sent_at": {"$gte": today.isoformat()}
    })
    
    return {
        "subscriptions": {
            "total": total_subscriptions,
            "active": active_subscriptions,
            "inactive": total_subscriptions - active_subscriptions
        },
        "soul_whispers": {
            "sent_today": soul_whispers_today
        },
        "recent_notifications": [
            {k: v for k, v in log.items() if k != "_id"} 
            for log in recent_logs
        ]
    }


@push_router.get("/subscriptions/{user_id}")
async def get_user_subscriptions(user_id: str):
    """Get push subscriptions for a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user_id},
        {"_id": 0, "endpoint": 1, "active": 1, "preferences": 1, "created_at": 1}
    ).to_list(10)
    
    return {
        "user_id": user_id,
        "subscriptions": subscriptions,
        "count": len(subscriptions)
    }
