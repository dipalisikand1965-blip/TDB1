"""
Proactive Notification Engine
=============================
Sends timely, intelligent notifications to pet parents:
- Vaccination reminders (3 days before due)
- Order updates (status changes)
- Ticket updates (from Mira conversations)
- Pet birthdays and gotcha days
- Soul Whisper daily tips

This runs as a background task or can be triggered via API.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

# ==================== NOTIFICATION TYPES ====================

NOTIFICATION_TEMPLATES = {
    "vaccination_reminder": {
        "title": "💉 Vaccination Reminder",
        "body_template": "{pet_name}'s {vaccine_name} is due in {days} days. Book a vet visit now!",
        "icon": "/icons/health.png",
        "action_url": "/care",
        "tag": "vaccination",
        "priority": "high"
    },
    "ticket_update": {
        "title": "📋 Request Update",
        "body_template": "Your {pillar} request #{ticket_id} is now {status}",
        "icon": "/logo-new.png",
        "action_url": "/dashboard?tab=requests",
        "tag": "ticket",
        "priority": "medium"
    },
    "order_shipped": {
        "title": "📦 Order Shipped!",
        "body_template": "Great news! Your order #{order_id} is on its way to you.",
        "icon": "/icons/package.png",
        "action_url": "/dashboard?tab=orders",
        "tag": "order",
        "priority": "medium"
    },
    "order_delivered": {
        "title": "🎉 Order Delivered!",
        "body_template": "Your order #{order_id} has been delivered. Enjoy!",
        "icon": "/icons/package.png",
        "action_url": "/dashboard?tab=orders",
        "tag": "order",
        "priority": "low"
    },
    "birthday_reminder": {
        "title": "🎂 Birthday Coming Up!",
        "body_template": "{pet_name}'s birthday is in {days} days! Plan something special?",
        "icon": "/icons/celebrate.png",
        "action_url": "/celebrate",
        "tag": "birthday",
        "priority": "low"
    },
    "gotcha_day": {
        "title": "🐾 Gotcha Day Reminder!",
        "body_template": "{pet_name}'s gotcha day is in {days} days! Celebrate the adoption anniversary!",
        "icon": "/icons/celebrate.png",
        "action_url": "/celebrate",
        "tag": "gotcha",
        "priority": "low"
    },
    "concierge_response": {
        "title": "💬 Concierge Update",
        "body_template": "Our concierge responded to your {pillar} request. Check now!",
        "icon": "/logo-new.png",
        "action_url": "/dashboard?tab=requests",
        "tag": "concierge",
        "priority": "high"
    },
    "mira_insight": {
        "title": "✨ Mira's Insight",
        "body_template": "{message}",
        "icon": "/logo-new.png",
        "action_url": "/dashboard",
        "tag": "mira",
        "priority": "low"
    }
}

# ==================== CHECK FUNCTIONS ====================

async def check_vaccination_reminders() -> List[Dict]:
    """Check for pets with upcoming vaccinations and create reminders"""
    if db is None:
        return []
    
    notifications = []
    today = datetime.now(timezone.utc)
    reminder_window = today + timedelta(days=7)  # Check 7 days ahead
    
    # Find pets with vaccination due dates
    pets = await db.pets.find({
        "health.vaccinations": {"$exists": True}
    }, {"_id": 0}).to_list(1000)
    
    for pet in pets:
        owner_email = pet.get("owner_email") or pet.get("user_email")
        if not owner_email:
            continue
        
        vaccinations = pet.get("health", {}).get("vaccinations", [])
        for vax in vaccinations:
            if isinstance(vax, dict):
                next_due = vax.get("next_due") or vax.get("due_date")
                if next_due:
                    try:
                        if isinstance(next_due, str):
                            due_date = datetime.fromisoformat(next_due.replace('Z', '+00:00'))
                        else:
                            due_date = next_due
                        
                        # Check if due within reminder window
                        days_until = (due_date - today).days
                        if 0 < days_until <= 7:
                            notifications.append({
                                "type": "vaccination_reminder",
                                "user_email": owner_email,
                                "data": {
                                    "pet_name": pet.get("name", "Your pet"),
                                    "vaccine_name": vax.get("name", "vaccination"),
                                    "days": days_until,
                                    "due_date": due_date.isoformat()
                                },
                                "priority": "high" if days_until <= 3 else "medium"
                            })
                    except Exception as e:
                        logger.warning(f"Error parsing vaccination date: {e}")
    
    return notifications


async def check_birthday_reminders() -> List[Dict]:
    """Check for upcoming pet birthdays and gotcha days"""
    if db is None:
        return []
    
    notifications = []
    today = datetime.now(timezone.utc)
    
    # Find pets with birthdays or gotcha days
    pets = await db.pets.find({
        "$or": [
            {"birthday": {"$exists": True}},
            {"identity.birthday": {"$exists": True}},
            {"date_of_birth": {"$exists": True}},
            {"birth_date": {"$exists": True}},
            {"gotcha_date": {"$exists": True}}
        ]
    }, {"_id": 0}).to_list(1000)
    
    for pet in pets:
        owner_email = pet.get("owner_email") or pet.get("user_email")
        if not owner_email:
            continue
        
        # Check birthday
        birthday = pet.get("birthday") or pet.get("identity") or {}.get("birthday") or pet.get("date_of_birth") or pet.get("birth_date")
        if birthday:
            try:
                if isinstance(birthday, str):
                    birth_date = datetime.fromisoformat(birthday.replace('Z', '+00:00'))
                else:
                    birth_date = birthday
                
                # Calculate this year's birthday
                this_year_bday = birth_date.replace(year=today.year)
                if this_year_bday < today:
                    this_year_bday = this_year_bday.replace(year=today.year + 1)
                
                days_until = (this_year_bday - today).days
                # Send reminder 7 days before AND 1 day before
                if days_until in [7, 1] or (0 < days_until <= 7):
                    notifications.append({
                        "type": "birthday_reminder",
                        "user_email": owner_email,
                        "data": {
                            "pet_name": pet.get("name", "Your pet"),
                            "days": days_until,
                            "birthday": this_year_bday.isoformat()
                        },
                        "priority": "high" if days_until <= 1 else ("medium" if days_until <= 3 else "low")
                    })
            except Exception as e:
                logger.warning(f"Error parsing birthday: {e}")
        
        # Check gotcha day
        gotcha_date = pet.get("gotcha_date")
        if gotcha_date and gotcha_date.strip():
            try:
                if isinstance(gotcha_date, str):
                    gotcha = datetime.fromisoformat(gotcha_date.replace('Z', '+00:00'))
                else:
                    gotcha = gotcha_date
                
                # Calculate this year's gotcha day
                this_year_gotcha = gotcha.replace(year=today.year)
                if this_year_gotcha < today:
                    this_year_gotcha = this_year_gotcha.replace(year=today.year + 1)
                
                days_until = (this_year_gotcha - today).days
                # Send reminder 7 days before AND 1 day before
                if days_until in [7, 1] or (0 < days_until <= 7):
                    notifications.append({
                        "type": "gotcha_day_reminder",
                        "user_email": owner_email,
                        "data": {
                            "pet_name": pet.get("name", "Your pet"),
                            "days": days_until,
                            "gotcha_date": this_year_gotcha.isoformat(),
                            "years_together": today.year - gotcha.year
                        },
                        "priority": "high" if days_until <= 1 else ("medium" if days_until <= 3 else "low")
                    })
            except Exception as e:
                logger.warning(f"Error parsing gotcha date: {e}")
    
    return notifications


async def check_ticket_updates() -> List[Dict]:
    """Check for ticket status changes that need notifications"""
    if db is None:
        return []
    
    notifications = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)  # Check last hour
    
    # Find recently updated tickets
    tickets = await db.mira_tickets.find({
        "updated_at": {"$gte": cutoff.isoformat()},
        "notification_sent": {"$ne": True},
        "ticket_type": {"$in": ["concierge", "emergency"]}
    }, {"_id": 0}).to_list(100)
    
    for ticket in tickets:
        user_email = ticket.get("member", {}).get("email")
        if not user_email:
            continue
        
        # Only notify on significant status changes
        status = ticket.get("status", "")
        if status in ["acknowledged", "confirmed", "completed", "resolved", "in_progress"]:
            pillar = ticket.get("pillar", "General")
            pillar_display = pillar.replace("_", " ").title()
            
            notifications.append({
                "type": "ticket_update",
                "user_email": user_email,
                "data": {
                    "ticket_id": ticket.get("ticket_id"),
                    "pillar": pillar_display,
                    "status": status.replace("_", " ").title()
                },
                "priority": "high" if status in ["confirmed", "resolved"] else "medium",
                "ticket_id": ticket.get("ticket_id")
            })
    
    # Also check service desk tickets
    service_tickets = await db.service_desk_tickets.find({
        "updated_at": {"$gte": cutoff.isoformat()},
        "notification_sent": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    
    for ticket in service_tickets:
        user_email = ticket.get("member", {}).get("email")
        if not user_email:
            continue
        
        status = ticket.get("status", "")
        if status in ["assigned", "contacted", "completed"]:
            notifications.append({
                "type": "concierge_response",
                "user_email": user_email,
                "data": {
                    "ticket_id": ticket.get("ticket_id"),
                    "pillar": ticket.get("pillar", "General").replace("_", " ").title()
                },
                "priority": "high",
                "ticket_id": ticket.get("ticket_id")
            })
    
    return notifications


# ==================== SEND NOTIFICATIONS ====================

async def send_proactive_notification(
    user_email: str,
    notification_type: str,
    data: Dict,
    priority: str = "medium"
) -> Dict:
    """Send a proactive push notification to a user"""
    if db is None:
        return {"success": False, "error": "Database not configured"}
    
    template = NOTIFICATION_TEMPLATES.get(notification_type)
    if not template:
        return {"success": False, "error": f"Unknown notification type: {notification_type}"}
    
    # Get user's push subscriptions
    subscriptions = await db.push_subscriptions.find({
        "user_email": user_email,
        "active": True
    }, {"_id": 0}).to_list(10)
    
    if not subscriptions:
        logger.debug(f"No push subscriptions for {user_email}")
        return {"success": False, "error": "No active subscriptions", "user_email": user_email}
    
    # Format notification
    title = template["title"]
    body = template["body_template"].format(**data)
    
    # Import send function
    from push_notification_routes import send_push_notification
    
    results = []
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.get("endpoint"),
            "keys": sub.get("keys")
        }
        
        result = await send_push_notification(
            subscription_info=subscription_info,
            title=title,
            body=body,
            icon=template.get("icon", "/logo-new.png"),
            tag=template.get("tag", notification_type),
            data={
                "url": template.get("action_url", "/dashboard"),
                "type": notification_type,
                **data
            },
            require_interaction=priority == "high"
        )
        results.append(result)
    
    # Log notification
    await db.push_notification_logs.insert_one({
        "user_email": user_email,
        "notification_type": notification_type,
        "title": title,
        "body": body,
        "data": data,
        "priority": priority,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "results": results
    })
    
    successful = sum(1 for r in results if r.get("success"))
    return {
        "success": successful > 0,
        "sent": successful,
        "total": len(results),
        "user_email": user_email
    }


async def run_proactive_notification_check() -> Dict:
    """Run all proactive notification checks and send notifications"""
    if db is None:
        return {"success": False, "error": "Database not configured"}
    
    results = {
        "vaccination_reminders": [],
        "birthday_reminders": [],
        "ticket_updates": [],
        "total_sent": 0,
        "total_failed": 0
    }
    
    # Check vaccination reminders
    vax_notifications = await check_vaccination_reminders()
    for notif in vax_notifications:
        # Dedupe - check if we already sent this today
        existing = await db.push_notification_logs.find_one({
            "user_email": notif["user_email"],
            "notification_type": "vaccination_reminder",
            "data.pet_name": notif["data"]["pet_name"],
            "data.vaccine_name": notif["data"]["vaccine_name"],
            "sent_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}
        })
        
        if not existing:
            result = await send_proactive_notification(
                user_email=notif["user_email"],
                notification_type=notif["type"],
                data=notif["data"],
                priority=notif["priority"]
            )
            results["vaccination_reminders"].append(result)
            if result.get("success"):
                results["total_sent"] += 1
            else:
                results["total_failed"] += 1
    
    # Check birthday reminders
    bday_notifications = await check_birthday_reminders()
    for notif in bday_notifications:
        existing = await db.push_notification_logs.find_one({
            "user_email": notif["user_email"],
            "notification_type": "birthday_reminder",
            "data.pet_name": notif["data"]["pet_name"],
            "sent_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}
        })
        
        if not existing:
            result = await send_proactive_notification(
                user_email=notif["user_email"],
                notification_type=notif["type"],
                data=notif["data"],
                priority=notif["priority"]
            )
            results["birthday_reminders"].append(result)
            if result.get("success"):
                results["total_sent"] += 1
            else:
                results["total_failed"] += 1
    
    # Check ticket updates
    ticket_notifications = await check_ticket_updates()
    for notif in ticket_notifications:
        result = await send_proactive_notification(
            user_email=notif["user_email"],
            notification_type=notif["type"],
            data=notif["data"],
            priority=notif["priority"]
        )
        results["ticket_updates"].append(result)
        
        # Mark ticket as notified
        if result.get("success") and notif.get("ticket_id"):
            await db.mira_tickets.update_one(
                {"ticket_id": notif["ticket_id"]},
                {"$set": {"notification_sent": True}}
            )
            await db.service_desk_tickets.update_one(
                {"ticket_id": notif["ticket_id"]},
                {"$set": {"notification_sent": True}}
            )
        
        if result.get("success"):
            results["total_sent"] += 1
        else:
            results["total_failed"] += 1
    
    results["checked_at"] = datetime.now(timezone.utc).isoformat()
    return results


# ==================== API ENDPOINTS ====================

from fastapi import APIRouter

proactive_router = APIRouter(prefix="/api/notifications", tags=["Proactive Notifications"])

@proactive_router.post("/check")
async def trigger_notification_check():
    """Manually trigger proactive notification check"""
    results = await run_proactive_notification_check()
    return results


@proactive_router.post("/send-test")
async def send_test_notification(user_email: str, notification_type: str = "mira_insight"):
    """Send a test notification to a user"""
    data = {
        "message": "This is a test notification from Mira! 🐾"
    }
    
    if notification_type == "vaccination_reminder":
        data = {"pet_name": "Test Pet", "vaccine_name": "Rabies", "days": 3}
    elif notification_type == "birthday_reminder":
        data = {"pet_name": "Test Pet", "days": 5}
    elif notification_type == "ticket_update":
        data = {"ticket_id": "TEST-001", "pillar": "Care", "status": "Confirmed"}
    
    result = await send_proactive_notification(
        user_email=user_email,
        notification_type=notification_type,
        data=data,
        priority="medium"
    )
    return result


@proactive_router.get("/history/{user_email}")
async def get_notification_history(user_email: str, limit: int = 20):
    """Get notification history for a user"""
    if db is None:
        return {"notifications": [], "error": "Database not configured"}
    
    notifications = await db.push_notification_logs.find(
        {"user_email": user_email},
        {"_id": 0}
    ).sort("sent_at", -1).limit(limit).to_list(limit)
    
    return {
        "notifications": notifications,
        "count": len(notifications)
    }
