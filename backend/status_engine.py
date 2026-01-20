"""
Generic Status Engine for The Doggy Company
Supports multiple pillars: Celebrate, Dine, Stay, Travel, Care
Each pillar has its own status flow and notification templates
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Security
security = HTTPBasic()
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

# Create router
status_router = APIRouter(prefix="/api/status-engine", tags=["Status Engine"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class StatusConfig(BaseModel):
    """Individual status configuration"""
    value: str
    label: str
    emoji: str = ""
    color: str = "gray"
    notify_customer: bool = True
    notify_admin: bool = False
    order: int = 0

class NotificationTemplate(BaseModel):
    """Notification template for a status"""
    whatsapp_message: str
    email_subject: str
    email_body: str

class StatusFlowConfig(BaseModel):
    """Complete status flow for a pillar"""
    pillar: str  # celebrate, dine, stay, travel, care
    name: str  # Display name
    description: str = ""
    statuses: List[StatusConfig]
    notification_templates: Dict[str, NotificationTemplate] = {}

class UpdateStatusRequest(BaseModel):
    """Request to update order/booking status"""
    new_status: str
    notes: Optional[str] = None
    send_notification: bool = True


# ==================== DEFAULT STATUS FLOWS ====================

DEFAULT_STATUS_FLOWS = {
    "celebrate": {
        "pillar": "celebrate",
        "name": "Celebrate",
        "description": "Cakes, treats, and celebration products",
        "statuses": [
            {"value": "pending", "label": "Pending", "emoji": "⏳", "color": "gray", "notify_customer": False, "order": 0},
            {"value": "confirmed", "label": "Confirmed", "emoji": "✅", "color": "blue", "notify_customer": True, "order": 1},
            {"value": "baking", "label": "Baking", "emoji": "🍰", "color": "orange", "notify_customer": True, "order": 2},
            {"value": "personalised", "label": "Personalised", "emoji": "✨", "color": "pink", "notify_customer": True, "order": 3},
            {"value": "packed", "label": "Packed with Love", "emoji": "💜", "color": "purple", "notify_customer": True, "order": 4},
            {"value": "out_for_delivery", "label": "Out for Delivery", "emoji": "🚗", "color": "indigo", "notify_customer": True, "order": 5},
            {"value": "delivered", "label": "Delivered & Celebrated", "emoji": "🎉", "color": "green", "notify_customer": True, "order": 6},
            {"value": "cancelled", "label": "Cancelled", "emoji": "❌", "color": "red", "notify_customer": True, "order": 99},
        ],
        "notification_templates": {
            "confirmed": {
                "whatsapp_message": "✅ Great news! Your order #{order_id} is confirmed. We're getting ready to create something special for {pet_name}! 🐾",
                "email_subject": "✅ Order Confirmed - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nGreat news! Your order #{order_id} is confirmed.\n\nWe're getting ready to create something special for {pet_name}!\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "baking": {
                "whatsapp_message": "🍰 Your order is now baking! The kitchen is filled with the aroma of fresh treats for {pet_name}. 🐾",
                "email_subject": "🍰 Baking in Progress - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nYour order #{order_id} is now baking!\n\nThe kitchen is filled with the aroma of fresh treats for {pet_name}.\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "personalised": {
                "whatsapp_message": "✨ We're adding the personal touches to {pet_name}'s order! Making it extra special just for them. 🎀",
                "email_subject": "✨ Personal Touches Being Added - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nWe're adding the personal touches to {pet_name}'s order!\n\nMaking it extra special just for them.\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "packed": {
                "whatsapp_message": "💜 Packed with love! {pet_name}'s goodies are all boxed up and ready to make their journey to you. 📦",
                "email_subject": "💜 Packed with Love - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nPacked with love! {pet_name}'s goodies are all boxed up and ready to make their journey to you.\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "out_for_delivery": {
                "whatsapp_message": "🚗 On the way! Your order is out for delivery. {pet_name} will be celebrating soon! 🎉",
                "email_subject": "🚗 Out for Delivery - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nYour order #{order_id} is out for delivery!\n\n{pet_name} will be celebrating soon!\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "delivered": {
                "whatsapp_message": "🎉 Delivered & Celebrated! We hope {pet_name} loves their treats! Share their joy with us on Instagram @thedoggycompany 📸",
                "email_subject": "🎉 Delivered & Celebrated - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nYour order #{order_id} has been delivered!\n\nWe hope {pet_name} loves their treats!\n\nShare their joy with us on Instagram @thedoggycompany 📸\n\nWith love,\nThe Doggy Company Team 🐕"
            },
            "cancelled": {
                "whatsapp_message": "❌ Your order #{order_id} has been cancelled. If you have questions, please contact us. We hope to serve {pet_name} again soon! 🐾",
                "email_subject": "❌ Order Cancelled - #{order_id}",
                "email_body": "Hi {customer_name}!\n\nYour order #{order_id} has been cancelled.\n\nIf you have any questions, please don't hesitate to contact us.\n\nWe hope to serve {pet_name} again soon!\n\nWith love,\nThe Doggy Company Team 🐕"
            }
        }
    },
    "dine": {
        "pillar": "dine",
        "name": "Dine",
        "description": "Pet-friendly restaurant reservations",
        "statuses": [
            {"value": "pending", "label": "Pending", "emoji": "⏳", "color": "gray", "notify_customer": False, "order": 0},
            {"value": "confirmed", "label": "Reservation Confirmed", "emoji": "✅", "color": "blue", "notify_customer": True, "order": 1},
            {"value": "reminder", "label": "Reminder Sent", "emoji": "🔔", "color": "yellow", "notify_customer": True, "order": 2},
            {"value": "checked_in", "label": "Checked In", "emoji": "🍽️", "color": "green", "notify_customer": False, "order": 3},
            {"value": "completed", "label": "Dined & Delighted", "emoji": "⭐", "color": "purple", "notify_customer": True, "order": 4},
            {"value": "no_show", "label": "No Show", "emoji": "😢", "color": "red", "notify_customer": False, "order": 98},
            {"value": "cancelled", "label": "Cancelled", "emoji": "❌", "color": "red", "notify_customer": True, "order": 99},
        ],
        "notification_templates": {
            "confirmed": {
                "whatsapp_message": "✅ Your reservation is confirmed!\n\n📍 {venue_name}\n📅 {booking_date} at {booking_time}\n👤 Party of {party_size} + 🐕 {pet_name}\n\nSee you soon!",
                "email_subject": "✅ Reservation Confirmed - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nYour reservation is confirmed!\n\n📍 {venue_name}\n📅 {booking_date} at {booking_time}\n👤 Party of {party_size} + 🐕 {pet_name}\n\nWe look forward to hosting you and {pet_name}!\n\nWith love,\nThe Doggy Company Team"
            },
            "reminder": {
                "whatsapp_message": "🔔 Reminder: Your dining reservation is tomorrow!\n\n📍 {venue_name}\n📅 {booking_date} at {booking_time}\n🐕 {pet_name} is excited!\n\nSee you there! 🎉",
                "email_subject": "🔔 Reminder: Dining Tomorrow - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nJust a friendly reminder about your reservation tomorrow!\n\n📍 {venue_name}\n📅 {booking_date} at {booking_time}\n\n{pet_name} is excited to dine with you!\n\nWith love,\nThe Doggy Company Team"
            },
            "completed": {
                "whatsapp_message": "⭐ Thank you for dining with us! We hope you and {pet_name} had a wonderful time at {venue_name}. 🐾\n\nWe'd love to hear your feedback!",
                "email_subject": "⭐ Thank You for Dining - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nThank you for dining at {venue_name}!\n\nWe hope you and {pet_name} had a wonderful time.\n\nWe'd love to hear your feedback - your review helps other pet parents find great places!\n\nWith love,\nThe Doggy Company Team"
            }
        }
    },
    "stay": {
        "pillar": "stay",
        "name": "Stay",
        "description": "Pet-friendly hotel and boarding bookings",
        "statuses": [
            {"value": "pending", "label": "Pending", "emoji": "⏳", "color": "gray", "notify_customer": False, "order": 0},
            {"value": "confirmed", "label": "Booking Confirmed", "emoji": "✅", "color": "blue", "notify_customer": True, "order": 1},
            {"value": "reminder", "label": "Check-in Reminder", "emoji": "🔔", "color": "yellow", "notify_customer": True, "order": 2},
            {"value": "checked_in", "label": "Checked In", "emoji": "🏨", "color": "green", "notify_customer": True, "order": 3},
            {"value": "staying", "label": "Currently Staying", "emoji": "🛏️", "color": "purple", "notify_customer": False, "order": 4},
            {"value": "checked_out", "label": "Checked Out", "emoji": "👋", "color": "teal", "notify_customer": True, "order": 5},
            {"value": "cancelled", "label": "Cancelled", "emoji": "❌", "color": "red", "notify_customer": True, "order": 99},
        ],
        "notification_templates": {
            "confirmed": {
                "whatsapp_message": "✅ Booking confirmed!\n\n🏨 {venue_name}\n📅 {check_in_date} → {check_out_date}\n🐕 {pet_name}\n\nWe're excited to host you!",
                "email_subject": "✅ Booking Confirmed - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nYour booking is confirmed!\n\n🏨 {venue_name}\n📅 Check-in: {check_in_date}\n📅 Check-out: {check_out_date}\n🐕 Guest: {pet_name}\n\nWe're excited to host you!\n\nWith love,\nThe Doggy Company Team"
            },
            "checked_in": {
                "whatsapp_message": "🏨 Welcome! You're all checked in at {venue_name}. {pet_name} is going to love it here! 🐾",
                "email_subject": "🏨 Checked In - Welcome to {venue_name}",
                "email_body": "Hi {customer_name}!\n\nWelcome! You're all checked in at {venue_name}.\n\n{pet_name} is going to love it here!\n\nEnjoy your stay!\n\nWith love,\nThe Doggy Company Team"
            },
            "checked_out": {
                "whatsapp_message": "👋 Thank you for staying with us! We hope you and {pet_name} had a pawsome time at {venue_name}. ⭐\n\nSafe travels!",
                "email_subject": "👋 Thank You for Staying - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nThank you for staying at {venue_name}!\n\nWe hope you and {pet_name} had a pawsome time.\n\nSafe travels and see you again soon!\n\nWith love,\nThe Doggy Company Team"
            }
        }
    },
    "travel": {
        "pillar": "travel",
        "name": "Travel",
        "description": "Pet travel bookings - flights, trains, cabs",
        "statuses": [
            {"value": "pending", "label": "Pending", "emoji": "⏳", "color": "gray", "notify_customer": False, "order": 0},
            {"value": "confirmed", "label": "Travel Confirmed", "emoji": "✅", "color": "blue", "notify_customer": True, "order": 1},
            {"value": "documents_ready", "label": "Documents Ready", "emoji": "📄", "color": "teal", "notify_customer": True, "order": 2},
            {"value": "reminder", "label": "Travel Reminder", "emoji": "🔔", "color": "yellow", "notify_customer": True, "order": 3},
            {"value": "in_transit", "label": "In Transit", "emoji": "✈️", "color": "indigo", "notify_customer": True, "order": 4},
            {"value": "arrived", "label": "Arrived Safely", "emoji": "🎉", "color": "green", "notify_customer": True, "order": 5},
            {"value": "cancelled", "label": "Cancelled", "emoji": "❌", "color": "red", "notify_customer": True, "order": 99},
        ],
        "notification_templates": {
            "confirmed": {
                "whatsapp_message": "✅ Travel booking confirmed!\n\n✈️ {travel_type}: {travel_details}\n📅 {travel_date}\n🐕 Traveler: {pet_name}\n\nBon voyage! 🌍",
                "email_subject": "✅ Travel Confirmed - {travel_type}",
                "email_body": "Hi {customer_name}!\n\nYour travel booking is confirmed!\n\n✈️ {travel_type}: {travel_details}\n📅 {travel_date}\n🐕 Traveler: {pet_name}\n\nBon voyage!\n\nWith love,\nThe Doggy Company Team"
            },
            "in_transit": {
                "whatsapp_message": "✈️ {pet_name} is on the move! Your journey has begun. We'll update you when they arrive safely. 🐾",
                "email_subject": "✈️ Journey Started - {pet_name}",
                "email_body": "Hi {customer_name}!\n\n{pet_name} is on the move!\n\nWe'll keep you updated and let you know when they arrive safely.\n\nWith love,\nThe Doggy Company Team"
            },
            "arrived": {
                "whatsapp_message": "🎉 {pet_name} has arrived safely! Thank you for traveling with The Doggy Company. 🐕✨",
                "email_subject": "🎉 Arrived Safely - {pet_name}",
                "email_body": "Hi {customer_name}!\n\nGreat news! {pet_name} has arrived safely!\n\nThank you for traveling with The Doggy Company.\n\nWith love,\nThe Doggy Company Team"
            }
        }
    },
    "care": {
        "pillar": "care",
        "name": "Care",
        "description": "Grooming, vet visits, and wellness bookings",
        "statuses": [
            {"value": "pending", "label": "Pending", "emoji": "⏳", "color": "gray", "notify_customer": False, "order": 0},
            {"value": "confirmed", "label": "Appointment Confirmed", "emoji": "✅", "color": "blue", "notify_customer": True, "order": 1},
            {"value": "reminder", "label": "Appointment Reminder", "emoji": "🔔", "color": "yellow", "notify_customer": True, "order": 2},
            {"value": "checked_in", "label": "Checked In", "emoji": "🏥", "color": "teal", "notify_customer": False, "order": 3},
            {"value": "in_session", "label": "In Session", "emoji": "✂️", "color": "purple", "notify_customer": False, "order": 4},
            {"value": "ready_pickup", "label": "Ready for Pickup", "emoji": "🐕", "color": "green", "notify_customer": True, "order": 5},
            {"value": "completed", "label": "Completed", "emoji": "⭐", "color": "green", "notify_customer": True, "order": 6},
            {"value": "cancelled", "label": "Cancelled", "emoji": "❌", "color": "red", "notify_customer": True, "order": 99},
        ],
        "notification_templates": {
            "confirmed": {
                "whatsapp_message": "✅ Appointment confirmed!\n\n🏥 {venue_name}\n📅 {appointment_date} at {appointment_time}\n🐕 {pet_name} - {service_type}\n\nSee you soon!",
                "email_subject": "✅ Appointment Confirmed - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nYour appointment is confirmed!\n\n🏥 {venue_name}\n📅 {appointment_date} at {appointment_time}\n🐕 {pet_name} - {service_type}\n\nWe look forward to caring for {pet_name}!\n\nWith love,\nThe Doggy Company Team"
            },
            "reminder": {
                "whatsapp_message": "🔔 Reminder: {pet_name}'s {service_type} appointment is tomorrow!\n\n🏥 {venue_name}\n📅 {appointment_date} at {appointment_time}\n\nSee you there! 🐾",
                "email_subject": "🔔 Appointment Reminder - Tomorrow",
                "email_body": "Hi {customer_name}!\n\nJust a friendly reminder about {pet_name}'s appointment tomorrow!\n\n🏥 {venue_name}\n📅 {appointment_date} at {appointment_time}\n📋 Service: {service_type}\n\nWith love,\nThe Doggy Company Team"
            },
            "ready_pickup": {
                "whatsapp_message": "🐕 {pet_name} is ready for pickup! Looking fabulous after their {service_type} at {venue_name}. ✨",
                "email_subject": "🐕 {pet_name} is Ready for Pickup!",
                "email_body": "Hi {customer_name}!\n\n{pet_name} is ready for pickup!\n\nLooking fabulous after their {service_type} at {venue_name}.\n\nCan't wait for you to see them!\n\nWith love,\nThe Doggy Company Team"
            },
            "completed": {
                "whatsapp_message": "⭐ Thank you for visiting {venue_name}! We hope {pet_name} enjoyed their {service_type}. 🐾\n\nWe'd love to hear your feedback!",
                "email_subject": "⭐ Thank You - {venue_name}",
                "email_body": "Hi {customer_name}!\n\nThank you for visiting {venue_name}!\n\nWe hope {pet_name} enjoyed their {service_type}.\n\nWe'd love your feedback!\n\nWith love,\nThe Doggy Company Team"
            }
        }
    }
}


# ==================== API ENDPOINTS ====================

@status_router.get("/flows")
async def get_all_status_flows(username: str = Depends(verify_admin)):
    """Get all status flows from database or defaults"""
    flows = await db.status_flows.find({}, {"_id": 0}).to_list(100)
    
    # If no flows in DB, return defaults
    if not flows:
        return {"flows": list(DEFAULT_STATUS_FLOWS.values()), "source": "defaults"}
    
    return {"flows": flows, "source": "database"}


@status_router.get("/flows/{pillar}")
async def get_status_flow(pillar: str, username: str = Depends(verify_admin)):
    """Get status flow for a specific pillar"""
    flow = await db.status_flows.find_one({"pillar": pillar}, {"_id": 0})
    
    if not flow:
        # Return default if exists
        if pillar in DEFAULT_STATUS_FLOWS:
            return {"flow": DEFAULT_STATUS_FLOWS[pillar], "source": "defaults"}
        raise HTTPException(status_code=404, detail=f"Status flow not found for pillar: {pillar}")
    
    return {"flow": flow, "source": "database"}


@status_router.post("/flows")
async def create_or_update_status_flow(flow: StatusFlowConfig, username: str = Depends(verify_admin)):
    """Create or update a status flow for a pillar"""
    flow_data = flow.model_dump()
    flow_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    flow_data["updated_by"] = username
    
    await db.status_flows.update_one(
        {"pillar": flow.pillar},
        {"$set": flow_data},
        upsert=True
    )
    
    return {"message": f"Status flow for {flow.pillar} saved", "flow": flow_data}


@status_router.post("/flows/init-defaults")
async def initialize_default_flows(username: str = Depends(verify_admin)):
    """Initialize all default status flows in database"""
    initialized = []
    for pillar, flow_data in DEFAULT_STATUS_FLOWS.items():
        existing = await db.status_flows.find_one({"pillar": pillar})
        if not existing:
            flow_data["created_at"] = datetime.now(timezone.utc).isoformat()
            flow_data["created_by"] = username
            await db.status_flows.insert_one(flow_data)
            initialized.append(pillar)
    
    return {"message": "Default flows initialized", "initialized": initialized}


@status_router.get("/statuses/{pillar}")
async def get_pillar_statuses(pillar: str):
    """Public endpoint to get statuses for a pillar (for frontend)"""
    flow = await db.status_flows.find_one({"pillar": pillar}, {"_id": 0})
    
    if not flow and pillar in DEFAULT_STATUS_FLOWS:
        flow = DEFAULT_STATUS_FLOWS[pillar]
    
    if not flow:
        raise HTTPException(status_code=404, detail=f"Pillar not found: {pillar}")
    
    return {
        "pillar": pillar,
        "name": flow.get("name", pillar.title()),
        "statuses": flow.get("statuses", [])
    }


# ==================== STATUS UPDATE & NOTIFICATIONS ====================

async def get_notification_template(pillar: str, status: str) -> Optional[Dict]:
    """Get notification template for pillar/status"""
    flow = await db.status_flows.find_one({"pillar": pillar}, {"_id": 0})
    
    if not flow and pillar in DEFAULT_STATUS_FLOWS:
        flow = DEFAULT_STATUS_FLOWS[pillar]
    
    if not flow:
        return None
    
    templates = flow.get("notification_templates", {})
    return templates.get(status)


async def get_status_config(pillar: str, status: str) -> Optional[Dict]:
    """Get status configuration for pillar/status"""
    flow = await db.status_flows.find_one({"pillar": pillar}, {"_id": 0})
    
    if not flow and pillar in DEFAULT_STATUS_FLOWS:
        flow = DEFAULT_STATUS_FLOWS[pillar]
    
    if not flow:
        return None
    
    statuses = flow.get("statuses", [])
    return next((s for s in statuses if s["value"] == status), None)


def format_template(template: str, data: Dict) -> str:
    """Format template string with data, handling missing keys gracefully"""
    try:
        # Replace placeholders with data
        result = template
        for key, value in data.items():
            result = result.replace(f"{{{key}}}", str(value) if value else "")
        return result
    except Exception as e:
        logger.error(f"Template formatting error: {e}")
        return template


async def send_notification(
    pillar: str,
    status: str,
    customer: Dict,
    order_data: Dict,
    pet_data: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Send notification for status change
    Returns dict with whatsapp_link and email_sent status
    """
    result = {"whatsapp_link": None, "email_sent": False, "notification_sent": False}
    
    # Get status config
    status_config = await get_status_config(pillar, status)
    if not status_config or not status_config.get("notify_customer", False):
        logger.info(f"Notification disabled for {pillar}/{status}")
        return result
    
    # Get template
    template = await get_notification_template(pillar, status)
    if not template:
        logger.warning(f"No template found for {pillar}/{status}")
        return result
    
    # Prepare data for template
    template_data = {
        "order_id": order_data.get("orderId") or order_data.get("id", ""),
        "customer_name": customer.get("name") or customer.get("parentName", ""),
        "pet_name": pet_data.get("name", "your pet") if pet_data else order_data.get("pet", {}).get("name", "your pet"),
        # Booking specific
        "venue_name": order_data.get("venue_name", ""),
        "booking_date": order_data.get("booking_date", ""),
        "booking_time": order_data.get("booking_time", ""),
        "check_in_date": order_data.get("check_in_date", ""),
        "check_out_date": order_data.get("check_out_date", ""),
        "party_size": order_data.get("party_size", ""),
        "travel_type": order_data.get("travel_type", ""),
        "travel_details": order_data.get("travel_details", ""),
        "travel_date": order_data.get("travel_date", ""),
        "appointment_date": order_data.get("appointment_date", ""),
        "appointment_time": order_data.get("appointment_time", ""),
        "service_type": order_data.get("service_type", ""),
    }
    
    # Generate WhatsApp link
    phone = customer.get("phone", "").replace("+", "").replace(" ", "").replace("-", "")
    if phone:
        if not phone.startswith("91"):
            phone = f"91{phone}"
        
        whatsapp_message = format_template(template.get("whatsapp_message", ""), template_data)
        encoded_message = __import__('urllib.parse', fromlist=['quote']).quote(whatsapp_message)
        result["whatsapp_link"] = f"https://wa.me/{phone}?text={encoded_message}"
        result["notification_sent"] = True
    
    # Send email if available
    email = customer.get("email")
    if email and RESEND_API_KEY:
        try:
            email_subject = format_template(template.get("email_subject", "Order Update"), template_data)
            email_body = format_template(template.get("email_body", ""), template_data)
            
            # Get status emoji and label for email
            emoji = status_config.get("emoji", "📦")
            label = status_config.get("label", status.replace("_", " ").title())
            
            # Create beautiful HTML email
            email_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">{emoji} {label}</h1>
                </div>
                <div style="padding: 30px; background: #fdf4ff; border-radius: 0 0 12px 12px;">
                    <div style="white-space: pre-line; font-size: 16px; line-height: 1.6; color: #333;">
                        {email_body}
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>The Doggy Company - Pet Life Operating System</p>
                </div>
            </div>
            """
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": email,
                "subject": email_subject,
                "html": email_html
            })
            result["email_sent"] = True
            result["notification_sent"] = True
            logger.info(f"Email sent to {email} for {pillar}/{status}")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
    
    return result


@status_router.post("/update/{pillar}/{record_id}")
async def update_status(
    pillar: str,
    record_id: str,
    request: UpdateStatusRequest,
    username: str = Depends(verify_admin)
):
    """
    Update status of an order/booking and send notifications
    Works for any pillar: celebrate (orders), dine/stay/travel/care (bookings)
    """
    # Determine collection based on pillar
    collection_map = {
        "celebrate": "orders",
        "dine": "bookings",
        "stay": "bookings",
        "travel": "bookings",
        "care": "bookings"
    }
    collection_name = collection_map.get(pillar, "orders")
    collection = db[collection_name]
    
    # Find the record
    record = await collection.find_one(
        {"$or": [{"id": record_id}, {"orderId": record_id}]},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    old_status = record.get("status")
    new_status = request.new_status
    
    # Update record
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        f"status_{new_status}_at": datetime.now(timezone.utc).isoformat(),
    }
    if request.notes:
        update_data["status_notes"] = request.notes
    
    await collection.update_one(
        {"$or": [{"id": record_id}, {"orderId": record_id}]},
        {"$set": update_data}
    )
    
    # Log status change
    await db.status_change_logs.insert_one({
        "pillar": pillar,
        "record_id": record_id,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": username,
        "notes": request.notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send notification if enabled
    notification_result = {"notification_sent": False}
    if request.send_notification:
        customer = record.get("customer", {})
        pet = record.get("pet")
        notification_result = await send_notification(
            pillar=pillar,
            status=new_status,
            customer=customer,
            order_data=record,
            pet_data=pet
        )
    
    # Check if this is a completion status and schedule feedback
    feedback_result = {"scheduled": False}
    try:
        from feedback_engine import schedule_feedback, get_feedback_config
        feedback_config = await get_feedback_config(pillar)
        if feedback_config and feedback_config.get("completion_status") == new_status:
            customer = record.get("customer", {})
            pet = record.get("pet")
            feedback_result = await schedule_feedback(
                pillar=pillar,
                record_id=record_id,
                customer=customer,
                order_data=record,
                pet_data=pet
            )
            logger.info(f"Feedback scheduled for {pillar}/{record_id}: {feedback_result}")
    except Exception as e:
        logger.error(f"Failed to schedule feedback: {e}")
    
    return {
        "message": f"Status updated to {new_status}",
        "old_status": old_status,
        "new_status": new_status,
        "notification": notification_result,
        "feedback": feedback_result
    }


@status_router.get("/logs/{pillar}/{record_id}")
async def get_status_logs(pillar: str, record_id: str, username: str = Depends(verify_admin)):
    """Get status change history for a record"""
    logs = await db.status_change_logs.find(
        {"pillar": pillar, "record_id": record_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    return {"logs": logs, "count": len(logs)}
