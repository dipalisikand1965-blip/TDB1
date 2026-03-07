"""
WhatsApp Notification Service for The Doggy Company
Sends automated WhatsApp messages via Gupshup for key events
"""

import os
import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Gupshup Configuration
GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"

def get_gupshup_config():
    """Get Gupshup configuration from environment"""
    return {
        "api_key": os.environ.get("GUPSHUP_API_KEY"),
        "app_name": os.environ.get("GUPSHUP_APP_NAME", "TheDoggyCompany"),
        "source_number": os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER", "919663185747")
    }

def is_gupshup_configured():
    """Check if Gupshup is properly configured"""
    config = get_gupshup_config()
    return bool(config["api_key"])

def format_phone_number(phone: str) -> str:
    """Format phone number for WhatsApp (remove +, spaces, ensure country code)"""
    if not phone:
        return ""
    # Remove all non-digit characters
    phone = ''.join(filter(str.isdigit, str(phone)))
    # Add India country code if not present (10 digit number)
    if len(phone) == 10:
        phone = "91" + phone
    return phone

async def send_whatsapp_message(
    to: str,
    message: str,
    log_context: str = "general"
) -> Dict[str, Any]:
    """
    Send a WhatsApp message via Gupshup API
    
    Args:
        to: Recipient phone number (with or without country code)
        message: Message text to send
        log_context: Context for logging (e.g., "membership", "booking")
    
    Returns:
        Dict with success status and message_id or error
    """
    if not is_gupshup_configured():
        logger.warning(f"[WHATSAPP-{log_context.upper()}] Gupshup not configured - message not sent")
        return {"success": False, "reason": "Gupshup not configured"}
    
    config = get_gupshup_config()
    formatted_phone = format_phone_number(to)
    
    if not formatted_phone or len(formatted_phone) < 10:
        logger.warning(f"[WHATSAPP-{log_context.upper()}] Invalid phone number: {to}")
        return {"success": False, "reason": "Invalid phone number"}
    
    try:
        import json
        
        payload = {
            "channel": "whatsapp",
            "source": config["source_number"],
            "destination": formatted_phone,
            "message": json.dumps({
                "type": "text",
                "text": message
            }),
            "src.name": config["app_name"]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload,
                timeout=10
            )
            
            result = response.json()
            result_status = str(result.get("status", "")).strip().lower()
            http_code = response.status_code
            
            # Gupshup returns HTTP 202 (Accepted) and status: "submitted" on success
            if http_code in [200, 202] and result_status in ["submitted", "success"]:
                logger.info(f"[WHATSAPP-{log_context.upper()}] ✅ Message sent to {formatted_phone[:6]}*** | ID: {result.get('messageId')}")
                return {
                    "success": True,
                    "message_id": result.get("messageId"),
                    "status": result_status,
                    "to": formatted_phone
                }
            else:
                logger.error(f"[WHATSAPP-{log_context.upper()}] ❌ Failed - HTTP: {http_code}, Status: '{result_status}', Response: {result}")
                return {
                    "success": False,
                    "error": result.get("message", "Unknown error"),
                    "gupshup_status": result_status,
                    "http_code": http_code
                }
                
    except Exception as e:
        logger.error(f"[WHATSAPP-{log_context.upper()}] Error: {e}")
        return {"success": False, "error": str(e)}


# ============== NOTIFICATION TEMPLATES ==============

class WhatsAppNotifications:
    """Pre-defined notification templates for key events"""
    
    @staticmethod
    async def membership_activated(
        phone: str,
        user_name: str,
        tier: str,
        expires_at: str
    ) -> Dict[str, Any]:
        """Send membership activation notification"""
        tier_emoji = {"free": "🐾", "essential": "⭐", "premium": "👑"}.get(tier.lower(), "🐾")
        tier_display = tier.title()
        
        message = f"""🎉 Welcome to Pet Pass, {user_name}!

{tier_emoji} Your *{tier_display}* membership is now active!

What you get:
✅ Pet Soul™ Profile for unlimited pets
✅ Access to all 14 life pillars
✅ Mira AI Concierge® assistance
{"✅ Full Mira OS experience" if tier.lower() != "free" else ""}
{"✅ Priority concierge support" if tier.lower() == "premium" else ""}

{"Your membership is valid until " + expires_at[:10] if tier.lower() != "free" else ""}

Start your journey: thedoggycompany.com/my-pets

Questions? Just reply here! 💜

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "membership")
    
    @staticmethod
    async def payment_received(
        phone: str,
        user_name: str,
        amount: float,
        plan_name: str,
        order_id: str
    ) -> Dict[str, Any]:
        """Send payment confirmation notification"""
        message = f"""✅ Payment Received!

Hi {user_name},

We've received your payment of *₹{amount:,.0f}* for *{plan_name}*.

🧾 Order ID: {order_id}

Your Pet Pass is now active. Start exploring all 14 pillars!

Thank you for trusting us with your pet's journey 💜

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "payment")
    
    @staticmethod
    async def service_booked(
        phone: str,
        user_name: str,
        pet_name: str,
        service_name: str,
        booking_date: str,
        booking_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send service booking confirmation"""
        time_str = f" at {booking_time}" if booking_time else ""
        
        message = f"""📅 Booking Confirmed!

Hi {user_name},

Your booking for *{pet_name}* is confirmed:

🐾 Service: {service_name}
📆 Date: {booking_date}{time_str}

We'll send you a reminder before the appointment.

Need to reschedule? Just reply here or call us!

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "booking")
    
    @staticmethod
    async def service_reminder(
        phone: str,
        user_name: str,
        pet_name: str,
        service_name: str,
        booking_date: str,
        booking_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send service reminder (1 day before)"""
        time_str = f" at {booking_time}" if booking_time else ""
        
        message = f"""⏰ Reminder: Tomorrow's Appointment

Hi {user_name},

Just a friendly reminder about *{pet_name}'s* appointment tomorrow:

🐾 Service: {service_name}
📆 Date: {booking_date}{time_str}

See you soon! 🐕

— The Doggy Company"""
        
        return await send_whatsapp_message(phone, message, "reminder")
    
    @staticmethod
    async def pet_birthday_reminder(
        phone: str,
        user_name: str,
        pet_name: str,
        birthday_date: str,
        days_until: int
    ) -> Dict[str, Any]:
        """Send pet birthday reminder"""
        days_text = "tomorrow" if days_until == 1 else f"in {days_until} days"
        
        message = f"""🎂 Birthday Alert!

Hi {user_name},

*{pet_name}'s* birthday is {days_text} ({birthday_date})!

Make it special with:
🎂 Custom birthday cake
🎁 Celebration hamper
📸 Pawty photoshoot

Shop now: thedoggycompany.com/celebrate

Need help planning? Just reply! 💜

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "birthday")
    
    @staticmethod
    async def ticket_update(
        phone: str,
        user_name: str,
        ticket_id: str,
        status: str,
        message_preview: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send ticket status update"""
        status_emoji = {
            "in_progress": "🔄",
            "resolved": "✅",
            "waiting_on_member": "⏳",
            "closed": "✔️"
        }.get(status.lower(), "📋")
        
        preview = f'\n\n"{message_preview[:100]}..."' if message_preview else ""
        
        message = f"""{status_emoji} Ticket Update

Hi {user_name},

Your request #{ticket_id} has been updated.

Status: *{status.replace('_', ' ').title()}*{preview}

View details: thedoggycompany.com/inbox

Reply here if you need anything else!

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "ticket")
    
    @staticmethod
    async def welcome_new_user(
        phone: str,
        user_name: str
    ) -> Dict[str, Any]:
        """Send welcome message to new users"""
        message = f"""👋 Welcome to The Doggy Company!

Hi {user_name},

Thanks for joining us! We're excited to be part of your pet's journey.

What we offer:
🐾 14 life pillars (Care, Dine, Travel, Stay & more)
🤖 Mira AI - Your 24/7 pet concierge
🎂 Birthday celebrations & treats
🏥 Health records & reminders

Start by creating your Pet Soul™ profile:
👉 thedoggycompany.com/pet-soul-onboard

Questions? Just message us here!

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "welcome")
    
    @staticmethod
    async def order_shipped(
        phone: str,
        user_name: str,
        order_id: str,
        tracking_link: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send order shipped notification"""
        tracking = f"\n\n📦 Track here: {tracking_link}" if tracking_link else ""
        
        message = f"""🚚 Your Order is on the way!

Hi {user_name},

Great news! Your order #{order_id} has been shipped.{tracking}

Expected delivery: 2-4 business days

Questions? Reply here!

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "shipping")
    
    @staticmethod
    async def order_confirmed(
        phone: str,
        user_name: str,
        order_id: str,
        items: str,
        total: float
    ) -> Dict[str, Any]:
        """Send order confirmation notification"""
        message = f"""🛍️ Order Confirmed!

Hi {user_name},

Thank you for your order!

📦 Order #{order_id}
{items}

💰 Total: ₹{total:,.0f}

We'll notify you when it's shipped.

Questions? Reply here!

— The Doggy Company 🐕"""
        
        return await send_whatsapp_message(phone, message, "order")
    
    @staticmethod
    async def concierge_message(
        phone: str,
        user_name: str,
        message_content: str,
        from_name: str = "Concierge Team"
    ) -> Dict[str, Any]:
        """Send a direct message from concierge to member"""
        message = f"""💬 Message from {from_name}

Hi {user_name},

{message_content}

Reply here to continue the conversation.

— The Doggy Company Concierge® 🐕"""
        
        return await send_whatsapp_message(phone, message, "concierge")
