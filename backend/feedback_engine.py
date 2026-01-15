"""
Post-Completion Feedback Loop Engine for The Doggy Company
Automatically sends feedback requests after order/booking completion
Works across all pillars: Celebrate, Dine, Stay, Travel, Care
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import resend
import asyncio

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
feedback_router = APIRouter(prefix="/api/feedback-engine", tags=["Feedback Engine"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class FeedbackConfig(BaseModel):
    """Feedback configuration for a pillar"""
    pillar: str
    completion_status: str  # Status that triggers feedback
    feedback_delay_hours: float = 3.0  # Hours after completion to send feedback
    enabled: bool = True
    whatsapp_template: str
    email_subject: str
    email_template: str
    review_link: str = ""
    upsell_message: str = ""
    upsell_products: List[str] = []


# ==================== DEFAULT FEEDBACK CONFIGS ====================

SITE_URL = os.environ.get("SITE_URL", "https://thedoggycompany.in")

DEFAULT_FEEDBACK_CONFIGS = {
    "celebrate": {
        "pillar": "celebrate",
        "completion_status": "delivered",
        "feedback_delay_hours": 3.0,
        "enabled": True,
        "whatsapp_template": """🎉 Hi {customer_name}!

We hope {pet_name} absolutely loved their goodies from The Doggy Company! 🐾

We'd love to hear how the celebration went! Your feedback helps us make every pet's day even more special.

⭐ Leave a quick review: {review_link}

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "email_subject": "🎉 How did {pet_name} enjoy their treats?",
        "email_template": """Hi {customer_name}!

We hope {pet_name} absolutely loved their goodies!

Your order #{order_id} was delivered, and we'd love to know how the celebration went.

⭐ Leave a quick review and help other pet parents discover us!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "review_link": f"{SITE_URL}/review/{{order_id}}",
        "upsell_message": "🔄 Loved it? Set up Autoship and never run out of {pet_name}'s favorites!",
        "upsell_products": ["autoship"]
    },
    "dine": {
        "pillar": "dine",
        "completion_status": "completed",
        "feedback_delay_hours": 2.0,
        "enabled": True,
        "whatsapp_template": """🍽️ Hi {customer_name}!

Thank you for dining at {venue_name} with {pet_name}! 🐾

We hope you both had a wonderful time. Your feedback helps us curate the best pet-friendly dining experiences!

⭐ Rate your experience: {review_link}

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "email_subject": "🍽️ How was your dining experience?",
        "email_template": """Hi {customer_name}!

Thank you for dining at {venue_name} with {pet_name}!

We hope you both had a wonderful experience. Your review helps other pet parents find great pet-friendly restaurants.

⭐ Share your experience!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "review_link": f"{SITE_URL}/review/dine/{{booking_id}}",
        "upsell_message": "🏨 Planning a getaway? Check out our pet-friendly stays!",
        "upsell_products": ["stays"]
    },
    "stay": {
        "pillar": "stay",
        "completion_status": "checked_out",
        "feedback_delay_hours": 4.0,
        "enabled": True,
        "whatsapp_template": """🏨 Hi {customer_name}!

We hope you and {pet_name} had a pawsome stay at {venue_name}! 🐾

Your feedback helps us find the best pet-friendly accommodations for our community.

⭐ Rate your stay: {review_link}

{upsell_message}

Safe travels!
The Doggy Company Team 🐕""",
        "email_subject": "🏨 How was {pet_name}'s stay?",
        "email_template": """Hi {customer_name}!

We hope you and {pet_name} had a wonderful stay at {venue_name}!

Your review helps other pet parents find great pet-friendly hotels and stays.

⭐ Share your experience!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "review_link": f"{SITE_URL}/review/stay/{{booking_id}}",
        "upsell_message": "🎂 {pet_name}'s birthday coming up? Celebrate with our special cakes!",
        "upsell_products": ["birthday-cakes"]
    },
    "travel": {
        "pillar": "travel",
        "completion_status": "arrived",
        "feedback_delay_hours": 2.0,
        "enabled": True,
        "whatsapp_template": """✈️ Hi {customer_name}!

We hope {pet_name} had a safe and comfortable journey! 🐾

Your feedback helps us improve pet travel experiences for everyone.

⭐ Rate your travel experience: {review_link}

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "email_subject": "✈️ How was {pet_name}'s journey?",
        "email_template": """Hi {customer_name}!

We hope {pet_name} had a safe and comfortable journey!

Your review helps other pet parents plan stress-free travels with their furry friends.

⭐ Share your experience!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "review_link": f"{SITE_URL}/review/travel/{{booking_id}}",
        "upsell_message": "🏨 Need a pet-friendly stay at your destination? We've got you covered!",
        "upsell_products": ["stays"]
    },
    "care": {
        "pillar": "care",
        "completion_status": "completed",
        "feedback_delay_hours": 1.0,
        "enabled": True,
        "whatsapp_template": """✂️ Hi {customer_name}!

We hope {pet_name} is looking and feeling fabulous after their {service_type}! 🐾

Your feedback helps us maintain the highest care standards.

⭐ Rate your experience: {review_link}

📸 Share {pet_name}'s glow-up on Instagram and tag @thedoggycompany!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "email_subject": "✂️ How does {pet_name} look?",
        "email_template": """Hi {customer_name}!

We hope {pet_name} is looking and feeling fabulous after their {service_type}!

Your review helps other pet parents find great groomers and care providers.

⭐ Share your experience!

📸 Don't forget to share {pet_name}'s glow-up photos!

{upsell_message}

With love,
The Doggy Company Team 🐕""",
        "review_link": f"{SITE_URL}/review/care/{{booking_id}}",
        "upsell_message": "🔄 Set up regular grooming appointments to keep {pet_name} looking their best!",
        "upsell_products": ["grooming-subscription"]
    }
}


# ==================== HELPER FUNCTIONS ====================

def format_template(template: str, data: Dict) -> str:
    """Format template string with data, handling missing keys gracefully"""
    try:
        result = template
        for key, value in data.items():
            result = result.replace(f"{{{key}}}", str(value) if value else "")
        return result
    except Exception as e:
        logger.error(f"Template formatting error: {e}")
        return template


async def get_feedback_config(pillar: str) -> Optional[Dict]:
    """Get feedback configuration for a pillar"""
    config = await db.feedback_configs.find_one({"pillar": pillar}, {"_id": 0})
    
    if not config and pillar in DEFAULT_FEEDBACK_CONFIGS:
        config = DEFAULT_FEEDBACK_CONFIGS[pillar]
    
    return config


# ==================== CORE FEEDBACK FUNCTIONS ====================

async def schedule_feedback(
    pillar: str,
    record_id: str,
    customer: Dict,
    order_data: Dict,
    pet_data: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Schedule a feedback request to be sent after the configured delay.
    Called when an order/booking reaches completion status.
    """
    config = await get_feedback_config(pillar)
    
    if not config or not config.get("enabled", True):
        logger.info(f"Feedback disabled for pillar: {pillar}")
        return {"scheduled": False, "reason": "disabled"}
    
    # Check if feedback already scheduled/sent for this record
    existing = await db.feedback_requests.find_one({
        "pillar": pillar,
        "record_id": record_id
    })
    
    if existing:
        logger.info(f"Feedback already scheduled for {pillar}/{record_id}")
        return {"scheduled": False, "reason": "already_scheduled", "existing_id": str(existing.get("_id"))}
    
    # Calculate send time
    delay_hours = config.get("feedback_delay_hours", 3.0)
    send_at = datetime.now(timezone.utc) + timedelta(hours=delay_hours)
    
    # Prepare template data
    template_data = {
        "order_id": order_data.get("orderId") or order_data.get("id", ""),
        "booking_id": order_data.get("id") or order_data.get("booking_id", ""),
        "customer_name": customer.get("name") or customer.get("parentName", "there"),
        "pet_name": pet_data.get("name", "your pet") if pet_data else order_data.get("pet", {}).get("name", "your pet"),
        "venue_name": order_data.get("venue_name", ""),
        "service_type": order_data.get("service_type", "grooming"),
        "review_link": format_template(config.get("review_link", ""), {
            "order_id": order_data.get("orderId") or order_data.get("id", ""),
            "booking_id": order_data.get("id") or order_data.get("booking_id", "")
        }),
        "upsell_message": config.get("upsell_message", "")
    }
    
    # Format upsell message with pet name
    template_data["upsell_message"] = format_template(template_data["upsell_message"], template_data)
    
    # Create feedback request record
    feedback_request = {
        "pillar": pillar,
        "record_id": record_id,
        "customer": {
            "name": customer.get("name") or customer.get("parentName"),
            "phone": customer.get("phone"),
            "email": customer.get("email")
        },
        "pet_name": template_data["pet_name"],
        "template_data": template_data,
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "send_at": send_at.isoformat(),
        "status": "scheduled",  # scheduled, sent, failed, cancelled
        "whatsapp_sent": False,
        "email_sent": False,
        "response_received": False
    }
    
    result = await db.feedback_requests.insert_one(feedback_request)
    
    logger.info(f"Feedback scheduled for {pillar}/{record_id}, send at: {send_at}")
    
    return {
        "scheduled": True,
        "feedback_id": str(result.inserted_id),
        "send_at": send_at.isoformat(),
        "delay_hours": delay_hours
    }


async def send_feedback_request(feedback_id: str) -> Dict[str, Any]:
    """Send a scheduled feedback request"""
    from bson import ObjectId
    
    feedback = await db.feedback_requests.find_one({"_id": ObjectId(feedback_id)})
    
    if not feedback:
        return {"success": False, "error": "Feedback request not found"}
    
    if feedback.get("status") == "sent":
        return {"success": False, "error": "Already sent"}
    
    pillar = feedback.get("pillar")
    config = await get_feedback_config(pillar)
    
    if not config:
        return {"success": False, "error": "Config not found"}
    
    customer = feedback.get("customer", {})
    template_data = feedback.get("template_data", {})
    
    result = {"whatsapp_link": None, "email_sent": False}
    
    # Generate WhatsApp link
    phone = customer.get("phone", "").replace("+", "").replace(" ", "").replace("-", "")
    if phone:
        if not phone.startswith("91"):
            phone = f"91{phone}"
        
        whatsapp_message = format_template(config.get("whatsapp_template", ""), template_data)
        encoded_message = __import__('urllib.parse', fromlist=['quote']).quote(whatsapp_message)
        result["whatsapp_link"] = f"https://wa.me/{phone}?text={encoded_message}"
    
    # Send email
    email = customer.get("email")
    if email and RESEND_API_KEY:
        try:
            email_subject = format_template(config.get("email_subject", "How was your experience?"), template_data)
            email_body = format_template(config.get("email_template", ""), template_data)
            
            email_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">We'd Love Your Feedback! ⭐</h1>
                </div>
                <div style="padding: 30px; background: #fdf4ff; border-radius: 0 0 12px 12px;">
                    <div style="white-space: pre-line; font-size: 16px; line-height: 1.6; color: #333;">
                        {email_body}
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="{template_data.get('review_link', '#')}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Leave a Review ⭐
                        </a>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>The Doggy Company - Pet Life Operating System</p>
                </div>
            </div>
            """
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": [email],
                "subject": email_subject,
                "html": email_html
            })
            result["email_sent"] = True
            logger.info(f"Feedback email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send feedback email: {e}")
    
    # Update feedback request status
    await db.feedback_requests.update_one(
        {"_id": ObjectId(feedback_id)},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "whatsapp_link": result["whatsapp_link"],
            "email_sent": result["email_sent"]
        }}
    )
    
    result["success"] = True
    return result


async def process_pending_feedback():
    """Process all pending feedback requests that are due"""
    now = datetime.now(timezone.utc)
    
    pending = await db.feedback_requests.find({
        "status": "scheduled",
        "send_at": {"$lte": now.isoformat()}
    }).to_list(100)
    
    results = []
    for feedback in pending:
        feedback_id = str(feedback.get("_id"))
        result = await send_feedback_request(feedback_id)
        results.append({
            "feedback_id": feedback_id,
            "pillar": feedback.get("pillar"),
            "record_id": feedback.get("record_id"),
            **result
        })
    
    return results


# ==================== API ENDPOINTS ====================

@feedback_router.get("/configs")
async def get_all_feedback_configs(username: str = Depends(verify_admin)):
    """Get all feedback configurations"""
    configs = await db.feedback_configs.find({}, {"_id": 0}).to_list(100)
    
    if not configs:
        return {"configs": list(DEFAULT_FEEDBACK_CONFIGS.values()), "source": "defaults"}
    
    return {"configs": configs, "source": "database"}


@feedback_router.get("/configs/{pillar}")
async def get_pillar_feedback_config(pillar: str, username: str = Depends(verify_admin)):
    """Get feedback configuration for a specific pillar"""
    config = await get_feedback_config(pillar)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Config not found for pillar: {pillar}")
    
    return {"config": config}


@feedback_router.post("/configs")
async def save_feedback_config(config: FeedbackConfig, username: str = Depends(verify_admin)):
    """Create or update feedback configuration for a pillar"""
    config_data = config.model_dump()
    config_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    config_data["updated_by"] = username
    
    await db.feedback_configs.update_one(
        {"pillar": config.pillar},
        {"$set": config_data},
        upsert=True
    )
    
    return {"message": f"Feedback config for {config.pillar} saved", "config": config_data}


@feedback_router.post("/configs/init-defaults")
async def initialize_default_configs(username: str = Depends(verify_admin)):
    """Initialize all default feedback configs in database"""
    initialized = []
    for pillar, config_data in DEFAULT_FEEDBACK_CONFIGS.items():
        existing = await db.feedback_configs.find_one({"pillar": pillar})
        if not existing:
            config_data["created_at"] = datetime.now(timezone.utc).isoformat()
            config_data["created_by"] = username
            await db.feedback_configs.insert_one(config_data)
            initialized.append(pillar)
    
    return {"message": "Default feedback configs initialized", "initialized": initialized}


@feedback_router.get("/requests")
async def get_feedback_requests(
    pillar: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    username: str = Depends(verify_admin)
):
    """Get feedback requests with optional filters"""
    query = {}
    if pillar:
        query["pillar"] = pillar
    if status:
        query["status"] = status
    
    requests = await db.feedback_requests.find(query, {"_id": 0}).sort("scheduled_at", -1).limit(limit).to_list(limit)
    
    # Get counts by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.feedback_requests.aggregate(pipeline).to_list(10)
    
    return {
        "requests": requests,
        "count": len(requests),
        "status_summary": {item["_id"]: item["count"] for item in status_counts}
    }


@feedback_router.post("/requests/{record_id}/schedule")
async def manually_schedule_feedback(
    record_id: str,
    pillar: str = "celebrate",
    username: str = Depends(verify_admin)
):
    """Manually schedule feedback for a specific order/booking"""
    # Find the record
    collection_map = {
        "celebrate": "orders",
        "dine": "bookings",
        "stay": "bookings",
        "travel": "bookings",
        "care": "bookings"
    }
    collection = db[collection_map.get(pillar, "orders")]
    
    record = await collection.find_one(
        {"$or": [{"id": record_id}, {"orderId": record_id}]},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    customer = record.get("customer", {})
    pet = record.get("pet")
    
    result = await schedule_feedback(
        pillar=pillar,
        record_id=record_id,
        customer=customer,
        order_data=record,
        pet_data=pet
    )
    
    return result


@feedback_router.post("/requests/{feedback_id}/send")
async def manually_send_feedback(feedback_id: str, username: str = Depends(verify_admin)):
    """Manually send a feedback request immediately"""
    result = await send_feedback_request(feedback_id)
    return result


@feedback_router.post("/requests/{feedback_id}/cancel")
async def cancel_feedback_request(feedback_id: str, username: str = Depends(verify_admin)):
    """Cancel a scheduled feedback request"""
    from bson import ObjectId
    
    result = await db.feedback_requests.update_one(
        {"_id": ObjectId(feedback_id), "status": "scheduled"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancelled_by": username
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Could not cancel - request not found or already processed")
    
    return {"message": "Feedback request cancelled"}


@feedback_router.post("/process-pending")
async def trigger_process_pending(username: str = Depends(verify_admin)):
    """Manually trigger processing of pending feedback requests"""
    results = await process_pending_feedback()
    return {
        "message": f"Processed {len(results)} feedback requests",
        "results": results
    }


@feedback_router.get("/stats")
async def get_feedback_stats(username: str = Depends(verify_admin)):
    """Get feedback statistics"""
    pipeline = [
        {
            "$group": {
                "_id": {
                    "pillar": "$pillar",
                    "status": "$status"
                },
                "count": {"$sum": 1}
            }
        }
    ]
    
    stats = await db.feedback_requests.aggregate(pipeline).to_list(100)
    
    # Organize by pillar
    by_pillar = {}
    for item in stats:
        pillar = item["_id"]["pillar"]
        status = item["_id"]["status"]
        if pillar not in by_pillar:
            by_pillar[pillar] = {}
        by_pillar[pillar][status] = item["count"]
    
    # Get response rate (feedback where customer responded)
    total_sent = await db.feedback_requests.count_documents({"status": "sent"})
    total_responded = await db.feedback_requests.count_documents({"status": "sent", "response_received": True})
    
    return {
        "by_pillar": by_pillar,
        "total_sent": total_sent,
        "total_responded": total_responded,
        "response_rate": (total_responded / total_sent * 100) if total_sent > 0 else 0
    }
