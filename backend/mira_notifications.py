"""
MIRA PUSH NOTIFICATIONS
=======================
Send proactive notifications to users via multiple channels.

Channels:
1. Web Push (Service Worker) - Browser notifications
2. Email - For important alerts
3. In-App - Real-time updates via WebSocket (future)

This module handles notification delivery and tracking.
"""

from fastapi import APIRouter, Depends, Header, BackgroundTasks
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
import logging
import os
import json

logger = logging.getLogger("mira_notifications")

router = APIRouter(prefix="/api/mira/notifications", tags=["mira-notifications"])

# Database reference
_db = None

def set_notifications_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class PushSubscription(BaseModel):
    """Web Push subscription from browser"""
    endpoint: str
    keys: Dict[str, str]  # p256dh and auth keys
    user_email: Optional[str] = None
    pet_ids: Optional[List[str]] = []


class NotificationPreferences(BaseModel):
    """User's notification preferences"""
    email: EmailStr
    push_enabled: bool = True
    email_enabled: bool = True
    vaccination_alerts: bool = True
    birthday_reminders: bool = True
    grooming_reminders: bool = True
    reorder_suggestions: bool = True
    quiet_hours_start: Optional[int] = 22  # 10 PM
    quiet_hours_end: Optional[int] = 8     # 8 AM
    # WhatsApp Automation toggles
    whatsapp_daily_digest: bool = True
    whatsapp_birthday_reminder: bool = True
    whatsapp_medication_reminder: bool = True


class NotificationPayload(BaseModel):
    """Notification to send"""
    title: str
    body: str
    icon: Optional[str] = "/logo192.png"
    badge: Optional[str] = "/badge.png"
    tag: Optional[str] = None  # For grouping
    data: Optional[Dict] = {}  # Custom data
    actions: Optional[List[Dict]] = []  # Action buttons
    urgency: str = "normal"  # normal, high, critical


# ═══════════════════════════════════════════════════════════════════════════════
# SUBSCRIPTION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/subscribe")
async def subscribe_push(subscription: PushSubscription):
    """
    Register a push notification subscription.
    Called when user enables notifications in browser.
    """
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Store subscription
    await db.push_subscriptions.update_one(
        {"endpoint": subscription.endpoint},
        {
            "$set": {
                "endpoint": subscription.endpoint,
                "keys": subscription.keys,
                "user_email": subscription.user_email,
                "pet_ids": subscription.pet_ids or [],
                "created_at": now,
                "updated_at": now,
                "active": True
            }
        },
        upsert=True
    )
    
    logger.info(f"[PUSH] Subscription registered for {subscription.user_email}")
    
    return {
        "success": True,
        "message": "Push notifications enabled! You'll receive alerts from Mira.",
        "subscribed_at": now
    }


@router.delete("/unsubscribe")
async def unsubscribe_push(endpoint: str):
    """Unsubscribe from push notifications"""
    db = get_db()
    
    result = await db.push_subscriptions.update_one(
        {"endpoint": endpoint},
        {"$set": {"active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "unsubscribed": result.modified_count > 0}


@router.get("/preferences/{user_email}")
async def get_notification_preferences(user_email: str):
    """Get user's notification preferences"""
    db = get_db()
    
    prefs = await db.notification_preferences.find_one(
        {"email": user_email.lower()},
        {"_id": 0}
    )
    
    if not prefs:
        # Return defaults
        return {
            "email": user_email,
            "push_enabled": True,
            "email_enabled": True,
            "vaccination_alerts": True,
            "birthday_reminders": True,
            "grooming_reminders": True,
            "reorder_suggestions": True,
            "quiet_hours_start": 22,
            "quiet_hours_end": 8,
            "whatsapp_daily_digest": True,
            "whatsapp_birthday_reminder": True,
            "whatsapp_medication_reminder": True,
        }
    
    return prefs


@router.post("/preferences")
async def update_notification_preferences(prefs: NotificationPreferences):
    """Update user's notification preferences"""
    db = get_db()
    
    await db.notification_preferences.update_one(
        {"email": prefs.email.lower()},
        {"$set": {**prefs.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "preferences": prefs.dict()}


# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION SENDING
# ═══════════════════════════════════════════════════════════════════════════════

async def send_push_notification(
    user_email: str,
    notification: NotificationPayload,
    db = None
) -> Dict[str, Any]:
    """
    Send a push notification to a user.
    
    Note: Actual Web Push requires VAPID keys and pywebpush library.
    This implementation stores notifications for frontend polling.
    """
    if db is None:
        db = get_db()
    
    now = datetime.now(timezone.utc)
    
    # Check quiet hours
    prefs = await db.notification_preferences.find_one({"email": user_email.lower()})
    if prefs:
        quiet_start = prefs.get("quiet_hours_start", 22)
        quiet_end = prefs.get("quiet_hours_end", 8)
        current_hour = now.hour
        
        # Check if in quiet hours (and not critical)
        if notification.urgency != "critical":
            if quiet_start > quiet_end:  # e.g., 22:00 to 08:00
                if current_hour >= quiet_start or current_hour < quiet_end:
                    logger.info(f"[PUSH] Notification deferred (quiet hours) for {user_email}")
                    # Store for later
                    await db.pending_notifications.insert_one({
                        "user_email": user_email,
                        "notification": notification.dict(),
                        "scheduled_for": now.replace(hour=quiet_end, minute=0).isoformat(),
                        "created_at": now.isoformat()
                    })
                    return {"sent": False, "reason": "quiet_hours", "scheduled": True}
    
    # Store notification for delivery
    notification_doc = {
        "id": f"notif-{now.timestamp()}",
        "user_email": user_email,
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon,
        "tag": notification.tag,
        "data": notification.data,
        "actions": notification.actions,
        "urgency": notification.urgency,
        "read": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=7)).isoformat()
    }
    
    await db.user_notifications.insert_one(notification_doc)
    
    logger.info(f"[PUSH] Notification stored for {user_email}: {notification.title}")
    
    return {
        "sent": True,
        "notification_id": notification_doc["id"],
        "timestamp": now.isoformat()
    }


async def send_proactive_notifications(user_email: str, alerts: List[Dict], db = None):
    """
    Send notifications for proactive alerts.
    Called by a scheduled job or when alerts change.
    """
    if db is None:
        db = get_db()
    
    # Check if user wants notifications
    prefs = await db.notification_preferences.find_one({"email": user_email.lower()})
    if prefs and not prefs.get("push_enabled", True):
        return {"sent": 0, "reason": "notifications_disabled"}
    
    sent_count = 0
    
    for alert in alerts:
        alert_type = alert.get("type")
        
        # Check if user wants this type of alert
        if prefs:
            if alert_type == "vaccination" and not prefs.get("vaccination_alerts", True):
                continue
            if alert_type == "birthday" and not prefs.get("birthday_reminders", True):
                continue
            if alert_type == "grooming" and not prefs.get("grooming_reminders", True):
                continue
            if alert_type == "reorder" and not prefs.get("reorder_suggestions", True):
                continue
        
        # Create notification
        notification = NotificationPayload(
            title=alert.get("title", "Mira Alert"),
            body=alert.get("message", ""),
            tag=f"{alert_type}-{alert.get('pet_id', 'general')}",
            data={
                "alert_id": alert.get("id"),
                "alert_type": alert_type,
                "pet_id": alert.get("pet_id"),
                "cta_action": alert.get("cta_action"),
                "url": f"/mira-demo?alert={alert.get('id')}"
            },
            actions=[
                {"action": "view", "title": "View"},
                {"action": "dismiss", "title": "Dismiss"}
            ],
            urgency="high" if alert.get("urgency") in ["critical", "high"] else "normal"
        )
        
        result = await send_push_notification(user_email, notification, db)
        if result.get("sent"):
            sent_count += 1
    
    return {"sent": sent_count, "total_alerts": len(alerts)}


# ═══════════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/inbox/{user_email}")
async def get_notification_inbox(user_email: str, limit: int = 20, unread_only: bool = False):
    """
    Get user's notification inbox.
    Frontend polls this to show notification badge.
    """
    db = get_db()
    
    query = {"user_email": user_email.lower()}
    if unread_only:
        query["read"] = False
    
    notifications = await db.user_notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    unread_count = await db.user_notifications.count_documents({
        "user_email": user_email.lower(),
        "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(notifications)
    }


@router.post("/mark-read/{notification_id}")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    db = get_db()
    
    result = await db.user_notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": result.modified_count > 0}


@router.post("/mark-all-read/{user_email}")
async def mark_all_notifications_read(user_email: str):
    """Mark all notifications as read"""
    db = get_db()
    
    result = await db.user_notifications.update_many(
        {"user_email": user_email.lower(), "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "marked_read": result.modified_count}


@router.post("/send-test")
async def send_test_notification(user_email: str, title: str = "Test from Mira", body: str = "This is a test notification! 🐾"):
    """Send a test notification (for debugging)"""
    db = get_db()
    
    notification = NotificationPayload(
        title=title,
        body=body,
        tag="test",
        data={"test": True}
    )
    
    result = await send_push_notification(user_email, notification, db)
    
    return result


@router.post("/trigger-alerts/{user_email}")
async def trigger_alert_notifications(user_email: str, background_tasks: BackgroundTasks):
    """
    Manually trigger alert notifications for a user.
    Can be called by a scheduled job.
    """
    from mira_proactive import get_user_proactive_alerts
    
    # Get all alerts for user
    alerts_response = await get_user_proactive_alerts(user_email)
    alerts = alerts_response.get("alerts", [])
    
    if not alerts:
        return {"triggered": False, "reason": "no_alerts"}
    
    db = get_db()
    result = await send_proactive_notifications(user_email, alerts, db)
    
    return {
        "triggered": True,
        "alerts_found": len(alerts),
        "notifications_sent": result.get("sent", 0)
    }
