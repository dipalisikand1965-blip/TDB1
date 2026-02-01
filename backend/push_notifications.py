"""
Push Notification Service for PWA
Handles push subscriptions and sends notifications for:
- Ticket updates (when agent updates a ticket)
- New ticket creation
- Booking confirmations
- Service desk updates
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import json
import os

# pywebpush for sending push notifications
try:
    from pywebpush import webpush, WebPushException
    PUSH_AVAILABLE = True
except ImportError:
    PUSH_AVAILABLE = False
    print("[Push] pywebpush not installed - push notifications disabled")

router = APIRouter(prefix="/api/push", tags=["push"])

# MongoDB connection - will be set from server.py
db = None

def set_db(database):
    global db
    db = database

# VAPID keys for push notifications
# In production, these should be environment variables
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS = {
    "sub": "mailto:woof@thedoggycompany.in"
}

# Models
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
    user_id: Optional[str] = None
    user_email: Optional[str] = None

class PushMessage(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/"
    icon: Optional[str] = "/logo-new.png"
    tag: Optional[str] = None
    badge_count: Optional[int] = None
    actions: Optional[List[dict]] = None
    require_interaction: Optional[bool] = False

class TicketUpdateNotification(BaseModel):
    ticket_id: str
    update_type: str  # 'status_change', 'agent_reply', 'assignment', 'resolution'
    message: Optional[str] = None

# Get VAPID public key for frontend
@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Return VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        return {"public_key": None, "enabled": False}
    return {"public_key": VAPID_PUBLIC_KEY, "enabled": True}

# Subscribe to push notifications
@router.post("/subscribe")
async def subscribe_to_push(subscription: PushSubscription):
    """Store push subscription for a user"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Check if subscription already exists
    existing = await db.push_subscriptions.find_one({
        "endpoint": subscription.endpoint
    })
    
    if existing:
        # Update existing subscription
        await db.push_subscriptions.update_one(
            {"endpoint": subscription.endpoint},
            {"$set": {
                "keys": subscription.keys,
                "user_id": subscription.user_id,
                "user_email": subscription.user_email,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return {"message": "Subscription updated", "subscription_id": str(existing["_id"])}
    
    # Create new subscription
    doc = {
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "user_id": subscription.user_id,
        "user_email": subscription.user_email,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "active": True
    }
    
    result = await db.push_subscriptions.insert_one(doc)
    return {"message": "Subscribed to push notifications", "subscription_id": str(result.inserted_id)}

# Unsubscribe from push notifications
@router.post("/unsubscribe")
async def unsubscribe_from_push(endpoint: str):
    """Remove push subscription"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    result = await db.push_subscriptions.delete_one({"endpoint": endpoint})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Unsubscribed from push notifications"}

# Send push notification to a specific user
async def send_push_to_user(user_id: str, message: PushMessage):
    """Send push notification to all subscriptions of a user"""
    if not PUSH_AVAILABLE or not VAPID_PRIVATE_KEY:
        print(f"[Push] Push not available - would send: {message.title}")
        return {"sent": 0, "failed": 0, "reason": "push_not_configured"}
    
    if not db:
        return {"sent": 0, "failed": 0, "reason": "no_database"}
    
    # Find all subscriptions for this user
    subscriptions = await db.push_subscriptions.find({
        "user_id": user_id,
        "active": True
    }).to_list(100)
    
    if not subscriptions:
        return {"sent": 0, "failed": 0, "reason": "no_subscriptions"}
    
    sent = 0
    failed = 0
    
    notification_payload = {
        "title": message.title,
        "body": message.body,
        "icon": message.icon,
        "badge": "/logo-new.png",
        "tag": message.tag,
        "data": {
            "url": message.url,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "requireInteraction": message.require_interaction,
        "actions": message.actions or []
    }
    
    if message.badge_count is not None:
        notification_payload["badgeCount"] = message.badge_count
    
    for sub in subscriptions:
        try:
            subscription_info = {
                "endpoint": sub["endpoint"],
                "keys": sub["keys"]
            }
            
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            sent += 1
        except WebPushException as e:
            print(f"[Push] Failed to send: {e}")
            failed += 1
            
            # If subscription is invalid, mark it as inactive
            if e.response and e.response.status_code in [404, 410]:
                await db.push_subscriptions.update_one(
                    {"_id": sub["_id"]},
                    {"$set": {"active": False}}
                )
        except Exception as e:
            print(f"[Push] Error sending push: {e}")
            failed += 1
    
    return {"sent": sent, "failed": failed}

# Send push notification to user by email
async def send_push_to_email(email: str, message: PushMessage):
    """Send push notification to all subscriptions of a user by email"""
    if not PUSH_AVAILABLE or not VAPID_PRIVATE_KEY:
        print(f"[Push] Push not available - would send: {message.title}")
        return {"sent": 0, "failed": 0, "reason": "push_not_configured"}
    
    if not db:
        return {"sent": 0, "failed": 0, "reason": "no_database"}
    
    # Find all subscriptions for this email
    subscriptions = await db.push_subscriptions.find({
        "user_email": email,
        "active": True
    }).to_list(100)
    
    if not subscriptions:
        return {"sent": 0, "failed": 0, "reason": "no_subscriptions"}
    
    sent = 0
    failed = 0
    
    notification_payload = {
        "title": message.title,
        "body": message.body,
        "icon": message.icon,
        "badge": "/logo-new.png",
        "tag": message.tag,
        "data": {
            "url": message.url,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "requireInteraction": message.require_interaction,
        "actions": message.actions or []
    }
    
    if message.badge_count is not None:
        notification_payload["badgeCount"] = message.badge_count
    
    for sub in subscriptions:
        try:
            subscription_info = {
                "endpoint": sub["endpoint"],
                "keys": sub["keys"]
            }
            
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            sent += 1
        except WebPushException as e:
            print(f"[Push] Failed to send: {e}")
            failed += 1
            
            # If subscription is invalid, mark it as inactive
            if e.response and e.response.status_code in [404, 410]:
                await db.push_subscriptions.update_one(
                    {"_id": sub["_id"]},
                    {"$set": {"active": False}}
                )
        except Exception as e:
            print(f"[Push] Error sending push: {e}")
            failed += 1
    
    return {"sent": sent, "failed": failed}

# Notify user of ticket update
async def notify_ticket_update(ticket_id: str, user_email: str, update_type: str, details: dict = None):
    """Send push notification when a ticket is updated"""
    
    titles = {
        "status_change": "Ticket Status Updated",
        "agent_reply": "New Reply on Your Request",
        "assignment": "Agent Assigned to Your Request",
        "resolution": "Request Resolved",
        "new_ticket": "Request Received",
        "booking_confirmed": "Booking Confirmed"
    }
    
    bodies = {
        "status_change": f"Your request #{ticket_id[:8]} status has been updated to {details.get('new_status', 'updated')}",
        "agent_reply": f"An agent has replied to your request #{ticket_id[:8]}",
        "assignment": f"An agent is now handling your request #{ticket_id[:8]}",
        "resolution": f"Your request #{ticket_id[:8]} has been resolved",
        "new_ticket": f"We've received your request #{ticket_id[:8]}. We'll get back to you soon!",
        "booking_confirmed": f"Your booking #{ticket_id[:8]} has been confirmed"
    }
    
    message = PushMessage(
        title=titles.get(update_type, "Ticket Update"),
        body=bodies.get(update_type, f"Update on request #{ticket_id[:8]}"),
        url=f"/my-tickets?id={ticket_id}",
        tag=f"ticket-{ticket_id}",
        require_interaction=update_type in ["agent_reply", "resolution"]
    )
    
    return await send_push_to_email(user_email, message)

# API endpoint for manual push (admin use)
@router.post("/send")
async def send_push_notification(user_email: str, message: PushMessage):
    """Admin endpoint to send push notification to a user"""
    result = await send_push_to_email(user_email, message)
    return result

# API endpoint to notify ticket update
@router.post("/notify-ticket")
async def api_notify_ticket_update(notification: TicketUpdateNotification, user_email: str):
    """API endpoint to trigger ticket update notification"""
    result = await notify_ticket_update(
        ticket_id=notification.ticket_id,
        user_email=user_email,
        update_type=notification.update_type,
        details={"message": notification.message} if notification.message else {}
    )
    return result

# Get user's push subscriptions (for debugging/management)
@router.get("/subscriptions/{user_email}")
async def get_user_subscriptions(user_email: str):
    """Get all push subscriptions for a user"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    subscriptions = await db.push_subscriptions.find({
        "user_email": user_email
    }).to_list(100)
    
    return {
        "subscriptions": [
            {
                "id": str(sub["_id"]),
                "endpoint": sub["endpoint"][:50] + "...",
                "active": sub.get("active", True),
                "created_at": sub.get("created_at", "").isoformat() if sub.get("created_at") else None
            }
            for sub in subscriptions
        ]
    }
