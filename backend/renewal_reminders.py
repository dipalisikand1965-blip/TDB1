"""
Pet Pass Renewal Reminder System
Sends automated email reminders for Pet Pass expiration:
- Trial: 7 days before expiry
- Annual: 30 days, 15 days, 3 days before expiry
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

# Get Resend for email
def get_resend():
    try:
        import resend
        api_key = os.environ.get("RESEND_API_KEY")
        if api_key:
            resend.api_key = api_key
            return resend
    except Exception:
        pass
    return None

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BUSINESS_NAME = "The Doggy Company"


async def send_renewal_reminder_email(user: dict, days_until_expiry: int, pet_names: list) -> bool:
    """Send a Pet Pass renewal reminder email"""
    resend_client = get_resend()
    if not resend_client:
        logger.warning("Resend not configured - cannot send renewal reminder")
        return False
    
    try:
        user_name = user.get("name", "Pet Parent")
        user_email = user.get("email")
        membership_tier = user.get("membership_tier", "curious_pup")
        
        if not user_email:
            return False
        
        # Determine if trial or annual
        is_trial = membership_tier in ["curious_pup", "free", "pending"] or user.get("membership_type") == "trial"
        plan_name = "Pet Pass Trial" if is_trial else "Pet Pass Foundation"
        
        # Pet names string
        pets_str = ", ".join(pet_names) if pet_names else "your pet"
        
        # Urgency based on days
        if days_until_expiry <= 3:
            urgency_text = "⚠️ URGENT"
            subject = f"⚠️ {user_name}, your Pet Pass expires in {days_until_expiry} days!"
            urgency_color = "#dc2626"
        elif days_until_expiry <= 7:
            urgency_text = "📣 Important"
            subject = f"📣 {user_name}, your Pet Pass expires soon!"
            urgency_color = "#f59e0b"
        else:
            urgency_text = "💜 Reminder"
            subject = f"💜 {user_name}, renew your Pet Pass before it expires"
            urgency_color = "#7c3aed"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                .header {{ background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .urgency-badge {{ display: inline-block; background: {urgency_color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }}
                .footer {{ background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
                .pet-names {{ background: #faf5ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🐾 Pet Pass Renewal</h1>
                    <p style="margin: 10px 0 0;">Don't let the concierge connection end</p>
                </div>
                <div class="content">
                    <div class="urgency-badge">{urgency_text}</div>
                    
                    <h2>Hi {user_name},</h2>
                    
                    <p>Your <strong>{plan_name}</strong> expires in <strong>{days_until_expiry} days</strong>.</p>
                    
                    <div class="pet-names">
                        <p style="margin: 0;"><strong>🐕 Active Pet Pass(es) for:</strong></p>
                        <p style="margin: 5px 0 0; color: #7c3aed; font-size: 18px;">{pets_str}</p>
                    </div>
                    
                    <p>When your Pet Pass expires:</p>
                    <ul>
                        <li>Mira AI concierge access will be limited</li>
                        <li>All 14 life pillars will be locked</li>
                        <li>Pet Soul profile will be view-only</li>
                        <li>Priority support will be unavailable</li>
                    </ul>
                    
                    <p><strong>Don't lose the concierge relationship you've built!</strong></p>
                    
                    <p>Your pet's memories, preferences, and care history are safe with us. Renew to keep the full Pet Pass experience.</p>
                    
                    <a href="https://thedoggycompany.in/membership" class="cta-button">
                        Renew Pet Pass Now →
                    </a>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        Questions? Reply to this email or chat with Mira anytime.
                    </p>
                </div>
                <div class="footer">
                    <p>🐾 {BUSINESS_NAME}</p>
                    <p style="font-size: 12px;">Pet Pass is a personal concierge relationship — not a subscription.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend_client.Emails.send({
            "from": SENDER_EMAIL,
            "to": user_email,
            "subject": subject,
            "html": html_content
        })
        
        logger.info(f"Sent renewal reminder to {user_email} - {days_until_expiry} days until expiry")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send renewal reminder to {user.get('email')}: {e}")
        return False


async def check_and_send_renewal_reminders():
    """
    Check all active memberships and send renewal reminders as needed.
    Should be called by a scheduled job (e.g., daily cron).
    
    Reminder schedule:
    - Trial (1 month): 7 days before
    - Annual: 30 days, 15 days, 3 days before
    """
    if db is None:
        logger.error("Database not configured for renewal reminders")
        return {"error": "Database not configured"}
    
    now = datetime.now(timezone.utc)
    results = {
        "checked": 0,
        "reminders_sent": 0,
        "errors": 0,
        "details": []
    }
    
    # Find users with active memberships that are expiring
    users = await db.users.find({
        "membership_expires": {"$exists": True, "$ne": None}
    }, {"_id": 0}).to_list(None)
    
    results["checked"] = len(users)
    
    for user in users:
        try:
            expires_str = user.get("membership_expires")
            if not expires_str:
                continue
            
            expires = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
            days_until = (expires - now).days
            
            # Skip if already expired or too far in future
            if days_until < 0 or days_until > 30:
                continue
            
            # Determine if trial or annual based on tier/type
            is_trial = user.get("membership_type") == "trial" or user.get("membership_tier") in ["curious_pup", "free"]
            
            # Check if we should send reminder based on days
            should_remind = False
            if is_trial:
                # Trial: remind at 7 days
                should_remind = days_until == 7
            else:
                # Annual: remind at 30, 15, 3 days
                should_remind = days_until in [30, 15, 3]
            
            if not should_remind:
                continue
            
            # Check if we already sent a reminder for this period
            reminder_key = f"renewal_reminder_{days_until}d"
            last_reminder = user.get("last_renewal_reminder", {})
            if last_reminder.get(reminder_key):
                # Already sent this reminder
                continue
            
            # Get user's pets
            pet_ids = user.get("pet_ids", [])
            pets = []
            if pet_ids:
                pets = await db.pets.find({"id": {"$in": pet_ids}}, {"_id": 0, "name": 1}).to_list(100)
            pet_names = [p.get("name", "Unknown") for p in pets]
            
            # Send reminder
            success = await send_renewal_reminder_email(user, days_until, pet_names)
            
            if success:
                results["reminders_sent"] += 1
                results["details"].append({
                    "email": user.get("email"),
                    "days_until": days_until,
                    "status": "sent"
                })
                
                # Mark reminder as sent
                await db.users.update_one(
                    {"email": user.get("email")},
                    {"$set": {f"last_renewal_reminder.{reminder_key}": now.isoformat()}}
                )
            else:
                results["errors"] += 1
                
        except Exception as e:
            logger.error(f"Error processing renewal for {user.get('email')}: {e}")
            results["errors"] += 1
    
    logger.info(f"Renewal reminder check complete: {results}")
    return results


async def get_expiring_memberships(days: int = 30):
    """Get list of memberships expiring within specified days"""
    if db is None:
        return []
    
    now = datetime.now(timezone.utc)
    
    users = await db.users.find({
        "membership_expires": {"$exists": True, "$ne": None}
    }, {"_id": 0}).to_list(None)
    
    expiring = []
    for user in users:
        try:
            expires_str = user.get("membership_expires")
            if not expires_str:
                continue
            
            expires = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
            days_until = (expires - now).days
            
            if 0 <= days_until <= days:
                expiring.append({
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "tier": user.get("membership_tier"),
                    "expires": expires_str,
                    "days_until": days_until
                })
        except Exception:
            continue
    
    return sorted(expiring, key=lambda x: x["days_until"])
