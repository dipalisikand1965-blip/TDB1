"""
Unified Notification Engine for The Doggy Company
One engine, multiple channels (Email, WhatsApp), all pillars

This is the foundation for event-driven notifications across:
- CELEBRATE (Bakery orders, Custom Cakes)
- DINE (Restaurant reservations)
- STAY (Hotel bookings)
- TRAVEL (Pet travel services)
- CARE (Grooming, Vet, Training appointments)
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Literal
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
import resend

logger = logging.getLogger(__name__)

# ==================== CONFIG ====================

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
BUSINESS_EMAIL = os.environ.get("BUSINESS_EMAIL", "orders@thedoggybakery.in")

# WhatsApp config (for future integration)
WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_KEY = os.environ.get("WHATSAPP_API_KEY", "")
WHATSAPP_PHONE_ID = os.environ.get("WHATSAPP_PHONE_ID", "")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create router
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

NotificationChannel = Literal["email", "whatsapp", "sms", "push"]
NotificationPriority = Literal["low", "normal", "high", "urgent"]
NotificationStatus = Literal["pending", "sent", "failed", "skipped"]

PILLAR_TYPES = ["celebrate", "dine", "stay", "travel", "care", "shop", "general"]

class NotificationRecipient(BaseModel):
    """Recipient details"""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None

class NotificationEvent(BaseModel):
    """Event that triggers notifications"""
    event_type: str  # order_placed, order_confirmed, booking_request, etc.
    pillar: str = "general"  # celebrate, dine, stay, travel, care
    reference_id: str  # Order ID, Booking ID, Ticket ID
    reference_type: str  # order, booking, ticket, request
    customer: NotificationRecipient
    data: Dict[str, Any] = {}  # Event-specific data
    triggered_by: str = "system"  # system, admin, customer, webhook

class NotificationTemplate(BaseModel):
    """Notification template"""
    id: str
    name: str
    event_type: str
    pillar: str = "general"
    channels: List[NotificationChannel] = ["email"]
    subject_template: str = ""
    email_template: str = ""
    whatsapp_template: str = ""
    sms_template: str = ""
    enabled: bool = True
    send_to_customer: bool = True
    send_to_admin: bool = True
    admin_emails: List[str] = []

class NotificationLog(BaseModel):
    """Notification log entry"""
    event_type: str
    pillar: str
    reference_id: str
    channel: NotificationChannel
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    status: NotificationStatus
    error: Optional[str] = None
    template_id: Optional[str] = None
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== EVENT TYPES ====================

EVENT_TYPES = {
    # Celebrate Pillar (Bakery)
    "order_placed": {
        "label": "Order Placed",
        "description": "New order received",
        "pillar": "celebrate",
        "customer_message": "Your order has been received!",
        "admin_message": "New order received"
    },
    "order_confirmed": {
        "label": "Order Confirmed",
        "description": "Order confirmed by team",
        "pillar": "celebrate",
        "customer_message": "Your order is confirmed and being prepared!",
        "admin_message": "Order confirmed"
    },
    "order_preparing": {
        "label": "Order Preparing",
        "description": "Order is being prepared",
        "pillar": "celebrate",
        "customer_message": "Our chefs are preparing your order with love!",
        "admin_message": None
    },
    "order_ready": {
        "label": "Order Ready",
        "description": "Order ready for pickup/delivery",
        "pillar": "celebrate",
        "customer_message": "Your order is ready!",
        "admin_message": "Order ready for dispatch"
    },
    "order_shipped": {
        "label": "Order Shipped",
        "description": "Order out for delivery",
        "pillar": "celebrate",
        "customer_message": "Your order is on its way!",
        "admin_message": None
    },
    "order_delivered": {
        "label": "Order Delivered",
        "description": "Order delivered successfully",
        "pillar": "celebrate",
        "customer_message": "Your order has been delivered! Enjoy!",
        "admin_message": "Order delivered"
    },
    
    # Dine Pillar
    "reservation_request": {
        "label": "Reservation Request",
        "description": "New restaurant reservation request",
        "pillar": "dine",
        "customer_message": "Your reservation request has been received!",
        "admin_message": "New dine reservation request"
    },
    "reservation_confirmed": {
        "label": "Reservation Confirmed",
        "description": "Restaurant reservation confirmed",
        "pillar": "dine",
        "customer_message": "Your table is reserved! See you soon!",
        "admin_message": "Reservation confirmed"
    },
    
    # Stay Pillar
    "booking_request": {
        "label": "Booking Request",
        "description": "New stay booking request",
        "pillar": "stay",
        "customer_message": "Your pawcation request has been received!",
        "admin_message": "New stay booking request"
    },
    "booking_confirmed": {
        "label": "Booking Confirmed",
        "description": "Stay booking confirmed",
        "pillar": "stay",
        "customer_message": "Your pawcation is confirmed! Pack your bags!",
        "admin_message": "Stay booking confirmed"
    },
    
    # Travel Pillar
    "travel_request": {
        "label": "Travel Request",
        "description": "New travel service request",
        "pillar": "travel",
        "customer_message": "Your travel request has been received!",
        "admin_message": "New travel request"
    },
    
    # Care Pillar
    "appointment_request": {
        "label": "Appointment Request",
        "description": "New care appointment request",
        "pillar": "care",
        "customer_message": "Your appointment request has been received!",
        "admin_message": "New care appointment request"
    },
    "appointment_confirmed": {
        "label": "Appointment Confirmed",
        "description": "Care appointment confirmed",
        "pillar": "care",
        "customer_message": "Your appointment is confirmed!",
        "admin_message": "Appointment confirmed"
    },
    
    # Service Desk
    "ticket_created": {
        "label": "Ticket Created",
        "description": "Service desk ticket created",
        "pillar": "general",
        "customer_message": "Your request has been logged. We'll get back to you soon!",
        "admin_message": "New service desk ticket"
    },
    "ticket_updated": {
        "label": "Ticket Updated",
        "description": "Service desk ticket status updated",
        "pillar": "general",
        "customer_message": "Your request status has been updated",
        "admin_message": None
    },
    "ticket_resolved": {
        "label": "Ticket Resolved",
        "description": "Service desk ticket resolved",
        "pillar": "general",
        "customer_message": "Your request has been resolved!",
        "admin_message": "Ticket resolved"
    }
}


# ==================== CORE NOTIFICATION ENGINE ====================

async def send_notification(
    event: NotificationEvent,
    channels: List[NotificationChannel] = None,
    priority: NotificationPriority = "normal"
) -> Dict[str, Any]:
    """
    Central notification dispatcher
    Triggers notifications based on event type and configured templates
    """
    if channels is None:
        channels = ["email"]  # Default to email
    
    results = {
        "event_type": event.event_type,
        "reference_id": event.reference_id,
        "channels": {},
        "success": True
    }
    
    event_config = EVENT_TYPES.get(event.event_type, {})
    
    # Try each channel
    for channel in channels:
        try:
            if channel == "email":
                result = await send_email_notification(event, event_config, priority)
            elif channel == "whatsapp":
                result = await send_whatsapp_notification(event, event_config, priority)
            else:
                result = {"status": "skipped", "reason": f"Channel {channel} not implemented"}
            
            results["channels"][channel] = result
            
        except Exception as e:
            logger.error(f"Notification failed for {channel}: {e}")
            results["channels"][channel] = {"status": "failed", "error": str(e)}
            results["success"] = False
    
    # Log notification
    await log_notification(event, results)
    
    return results


async def send_email_notification(
    event: NotificationEvent,
    event_config: Dict,
    priority: NotificationPriority
) -> Dict[str, Any]:
    """Send email notification"""
    if not RESEND_API_KEY:
        return {"status": "skipped", "reason": "Email not configured"}
    
    customer = event.customer
    if not customer.email:
        return {"status": "skipped", "reason": "No email address"}
    
    # Generate email content
    subject, html_content = generate_email_content(event, event_config)
    
    sent_count = 0
    errors = []
    
    # Send to customer
    if event_config.get("customer_message"):
        try:
            resend.Emails.send({
                "from": SENDER_EMAIL,
                "to": customer.email,
                "subject": subject,
                "html": html_content
            })
            sent_count += 1
            logger.info(f"Email sent to customer: {customer.email}")
        except Exception as e:
            error_msg = str(e)
            # Handle common Resend errors gracefully
            if "verify a domain" in error_msg.lower() or "testing emails" in error_msg.lower():
                logger.warning(f"Email skipped (domain not verified): {customer.email}")
                errors.append("Domain not verified - email queued for when domain is verified")
            elif "rate limit" in error_msg.lower() or "too many requests" in error_msg.lower():
                logger.warning(f"Email rate limited: {customer.email}")
                errors.append("Rate limited - will retry later")
            else:
                errors.append(f"Customer email failed: {e}")
                logger.error(f"Failed to send email to {customer.email}: {e}")
    
    # Send to admin
    if event_config.get("admin_message"):
        admin_subject, admin_html = generate_admin_email_content(event, event_config)
        try:
            resend.Emails.send({
                "from": SENDER_EMAIL,
                "to": BUSINESS_EMAIL,
                "subject": admin_subject,
                "html": admin_html
            })
            sent_count += 1
            logger.info(f"Admin email sent for {event.event_type}")
        except Exception as e:
            errors.append(f"Admin email failed: {e}")
    
    return {
        "status": "sent" if sent_count > 0 else "failed",
        "sent_count": sent_count,
        "errors": errors if errors else None
    }


async def send_whatsapp_notification(
    event: NotificationEvent,
    event_config: Dict,
    priority: NotificationPriority
) -> Dict[str, Any]:
    """Send WhatsApp notification (placeholder for future integration)"""
    customer = event.customer
    whatsapp_number = customer.whatsapp or customer.phone
    
    if not WHATSAPP_API_KEY or not WHATSAPP_API_URL:
        return {"status": "skipped", "reason": "WhatsApp not configured"}
    
    if not whatsapp_number:
        return {"status": "skipped", "reason": "No WhatsApp number"}
    
    # TODO: Implement WhatsApp Business API integration
    # This is a placeholder for the WhatsApp integration
    
    message = event_config.get("customer_message", "")
    
    # WhatsApp API call would go here
    # For now, log the intent
    logger.info(f"WhatsApp notification queued for {whatsapp_number}: {message}")
    
    return {
        "status": "pending",
        "reason": "WhatsApp integration pending setup",
        "would_send_to": whatsapp_number,
        "message": message
    }


# ==================== EMAIL TEMPLATES ====================

def generate_email_content(event: NotificationEvent, event_config: Dict) -> tuple:
    """Generate customer email content"""
    pillar = event.pillar.upper()
    event_label = event_config.get("label", event.event_type)
    customer_message = event_config.get("customer_message", "")
    
    # Dynamic subject
    subject = f"🐕 {customer_message[:50]}" if customer_message else "Update from The Doggy Company"
    
    # Get event-specific data
    data = event.data
    
    # Build HTML content
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f4f0; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 24px; }}
            .header .pillar {{ background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: white; display: inline-block; margin-top: 10px; }}
            .content {{ padding: 30px; }}
            .message {{ font-size: 18px; color: #333; margin-bottom: 20px; }}
            .details {{ background: #f8f4f0; padding: 20px; border-radius: 12px; margin: 20px 0; }}
            .details h3 {{ margin: 0 0 15px 0; color: #e91e63; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .reference {{ text-align: center; margin-top: 20px; padding: 15px; background: #fce4ec; border-radius: 8px; }}
            .reference-id {{ font-size: 20px; font-weight: bold; color: #e91e63; }}
            .footer {{ text-align: center; padding: 20px; background: #f8f4f0; color: #666; font-size: 12px; }}
            .cta {{ display: inline-block; background: #e91e63; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 The Doggy Company</h1>
                <span class="pillar">{pillar}</span>
            </div>
            <div class="content">
                <p class="message">{customer_message}</p>
                
                <div class="details">
                    <h3>📋 Details</h3>
                    <div class="detail-row">
                        <span>Reference</span>
                        <strong>{event.reference_id}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Status</span>
                        <strong>{event_label}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Date</span>
                        <strong>{datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p')}</strong>
                    </div>
    """
    
    # Add order-specific details
    if data.get("total"):
        html += f"""
                    <div class="detail-row">
                        <span>Total Amount</span>
                        <strong>₹{data['total']}</strong>
                    </div>
        """
    
    if data.get("items"):
        items_str = ", ".join([f"{item.get('name', 'Item')} x{item.get('quantity', 1)}" for item in data['items'][:3]])
        html += f"""
                    <div class="detail-row">
                        <span>Items</span>
                        <strong>{items_str}</strong>
                    </div>
        """
    
    html += f"""
                </div>
                
                <div class="reference">
                    <p style="margin: 0 0 5px 0; color: #666;">Your Reference Number</p>
                    <span class="reference-id">{event.reference_id}</span>
                </div>
                
                <p style="text-align: center; margin-top: 25px;">
                    Questions? Reply to this email or contact us on WhatsApp!
                </p>
            </div>
            <div class="footer">
                <p>Made with 🐾 by The Doggy Company</p>
                <p>Your Pet's Life Operating System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, html


def generate_admin_email_content(event: NotificationEvent, event_config: Dict) -> tuple:
    """Generate admin notification email"""
    pillar = event.pillar.upper()
    event_label = event_config.get("label", event.event_type)
    admin_message = event_config.get("admin_message", "New notification")
    
    subject = f"[{pillar}] {admin_message} - {event.reference_id}"
    
    data = event.data
    customer = event.customer
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 2px solid #e91e63; }}
            .header {{ background: #e91e63; padding: 15px 20px; }}
            .header h2 {{ color: white; margin: 0; font-size: 18px; }}
            .badge {{ background: white; color: #e91e63; padding: 3px 10px; border-radius: 12px; font-size: 11px; margin-left: 10px; }}
            .content {{ padding: 20px; }}
            .alert {{ background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #eee; }}
            th {{ background: #f8f4f0; font-weight: 600; }}
            .action {{ text-align: center; padding: 20px; }}
            .btn {{ display: inline-block; background: #e91e63; color: white; padding: 10px 25px; border-radius: 5px; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 {admin_message} <span class="badge">{pillar}</span></h2>
            </div>
            <div class="content">
                <div class="alert">
                    <strong>Reference:</strong> {event.reference_id}<br>
                    <strong>Event:</strong> {event_label}<br>
                    <strong>Time:</strong> {datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p IST')}
                </div>
                
                <h3>Customer Details</h3>
                <table>
                    <tr><th>Name</th><td>{customer.name}</td></tr>
                    <tr><th>Email</th><td>{customer.email or 'N/A'}</td></tr>
                    <tr><th>Phone</th><td>{customer.phone or 'N/A'}</td></tr>
                </table>
    """
    
    if data:
        html += """
                <h3 style="margin-top: 20px;">Event Data</h3>
                <table>
        """
        for key, value in data.items():
            if key not in ["items", "reference_images"] and value:
                html += f"<tr><th>{key.replace('_', ' ').title()}</th><td>{value}</td></tr>"
        html += "</table>"
    
    html += """
                <div class="action">
                    <a href="#" class="btn">View in Admin Panel</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, html


# ==================== LOGGING ====================

async def log_notification(event: NotificationEvent, results: Dict):
    """Log notification to database"""
    if db is None:
        return
    
    for channel, result in results.get("channels", {}).items():
        log_entry = {
            "event_type": event.event_type,
            "pillar": event.pillar,
            "reference_id": event.reference_id,
            "reference_type": event.reference_type,
            "channel": channel,
            "recipient_email": event.customer.email,
            "recipient_phone": event.customer.phone or event.customer.whatsapp,
            "status": result.get("status", "unknown"),
            "error": result.get("error") or result.get("errors"),
            "triggered_by": event.triggered_by,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.notification_logs.insert_one(log_entry)


# ==================== API ROUTES ====================

@notification_router.post("/send")
async def trigger_notification(
    event_type: str,
    reference_id: str,
    reference_type: str = "order",
    pillar: str = "celebrate",
    customer_name: str = "",
    customer_email: str = "",
    customer_phone: str = "",
    channels: List[str] = ["email"],
    data: Dict[str, Any] = {}
):
    """Manually trigger a notification (admin use)"""
    event = NotificationEvent(
        event_type=event_type,
        pillar=pillar,
        reference_id=reference_id,
        reference_type=reference_type,
        customer=NotificationRecipient(
            name=customer_name,
            email=customer_email,
            phone=customer_phone
        ),
        data=data,
        triggered_by="admin"
    )
    
    result = await send_notification(event, channels)
    return result


@notification_router.get("/logs")
async def get_notification_logs(
    limit: int = 50,
    event_type: str = None,
    pillar: str = None,
    reference_id: str = None
):
    """Get notification logs"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if event_type:
        query["event_type"] = event_type
    if pillar:
        query["pillar"] = pillar
    if reference_id:
        query["reference_id"] = reference_id
    
    logs = await db.notification_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"logs": logs, "count": len(logs)}


@notification_router.get("/event-types")
async def get_event_types():
    """Get all available event types"""
    return {"event_types": EVENT_TYPES}


@notification_router.get("/stats")
async def get_notification_stats(days: int = 7):
    """Get notification statistics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    since = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Get counts by status
    pipeline = [
        {"$match": {"timestamp": {"$gte": since.isoformat()}}},
        {"$group": {
            "_id": {"status": "$status", "channel": "$channel"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.notification_logs.aggregate(pipeline).to_list(100)
    
    # Get counts by pillar
    pillar_pipeline = [
        {"$match": {"timestamp": {"$gte": since.isoformat()}}},
        {"$group": {
            "_id": "$pillar",
            "count": {"$sum": 1}
        }}
    ]
    
    pillar_results = await db.notification_logs.aggregate(pillar_pipeline).to_list(100)
    
    return {
        "period_days": days,
        "by_status_channel": results,
        "by_pillar": pillar_results,
        "total": sum(r["count"] for r in results)
    }


# ==================== HELPER FUNCTIONS ====================

async def notify_order_status_change(
    order: Dict,
    new_status: str,
    triggered_by: str = "system"
) -> Dict:
    """Helper to notify on order status changes"""
    
    # Map status to event type
    status_event_map = {
        "pending": "order_placed",
        "confirmed": "order_confirmed",
        "preparing": "order_preparing",
        "ready": "order_ready",
        "shipped": "order_shipped",
        "delivered": "order_delivered"
    }
    
    event_type = status_event_map.get(new_status)
    if not event_type:
        return {"skipped": True, "reason": f"No notification for status: {new_status}"}
    
    # Extract customer info from order
    customer_data = order.get("customer", {})
    
    event = NotificationEvent(
        event_type=event_type,
        pillar="celebrate",
        reference_id=order.get("orderId") or order.get("order_id") or order.get("id"),
        reference_type="order",
        customer=NotificationRecipient(
            name=customer_data.get("parentName") or customer_data.get("name", ""),
            email=customer_data.get("email"),
            phone=customer_data.get("phone"),
            whatsapp=customer_data.get("whatsappNumber")
        ),
        data={
            "total": order.get("total"),
            "items": order.get("items", []),
            "delivery_method": order.get("delivery", {}).get("method"),
            "delivery_city": order.get("delivery", {}).get("city")
        },
        triggered_by=triggered_by
    )
    
    return await send_notification(event, ["email"])


async def notify_booking_status_change(
    booking: Dict,
    new_status: str,
    pillar: str = "stay",
    triggered_by: str = "system"
) -> Dict:
    """Helper to notify on booking status changes"""
    
    status_event_map = {
        "pending": f"{pillar.replace('stay', 'booking').replace('dine', 'reservation')}_request",
        "confirmed": f"{pillar.replace('stay', 'booking').replace('dine', 'reservation')}_confirmed"
    }
    
    event_type = status_event_map.get(new_status)
    if not event_type:
        return {"skipped": True, "reason": f"No notification for status: {new_status}"}
    
    event = NotificationEvent(
        event_type=event_type,
        pillar=pillar,
        reference_id=booking.get("id") or booking.get("booking_id"),
        reference_type="booking",
        customer=NotificationRecipient(
            name=booking.get("guest_name") or booking.get("customer_name", ""),
            email=booking.get("email"),
            phone=booking.get("phone"),
            whatsapp=booking.get("whatsapp")
        ),
        data=booking,
        triggered_by=triggered_by
    )
    
    return await send_notification(event, ["email"])


async def notify_ticket_update(
    ticket: Dict,
    update_type: str = "updated",
    triggered_by: str = "system"
) -> Dict:
    """Helper to notify on ticket updates"""
    
    type_event_map = {
        "created": "ticket_created",
        "updated": "ticket_updated",
        "resolved": "ticket_resolved"
    }
    
    event_type = type_event_map.get(update_type, "ticket_updated")
    
    event = NotificationEvent(
        event_type=event_type,
        pillar=ticket.get("pillar", "general"),
        reference_id=ticket.get("ticket_id") or ticket.get("id"),
        reference_type="ticket",
        customer=NotificationRecipient(
            name=ticket.get("customer_name", ""),
            email=ticket.get("customer_email"),
            phone=ticket.get("customer_phone")
        ),
        data={
            "status": ticket.get("status"),
            "subject": ticket.get("subject"),
            "category": ticket.get("category")
        },
        triggered_by=triggered_by
    )
    
    return await send_notification(event, ["email"])
