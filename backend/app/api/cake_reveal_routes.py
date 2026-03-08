"""
Cake Reveal Notification Service
Send notifications via WhatsApp, Email, and In-App Inbox for cake order updates
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import httpx
import asyncio

router = APIRouter(prefix="/api/cake-reveal", tags=["cake-reveal"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'pet-os-live-test_database')

# External service configs
GUPSHUP_API_KEY = os.environ.get('GUPSHUP_API_KEY', '')
GUPSHUP_APP_NAME = os.environ.get('GUPSHUP_APP_NAME', 'TheDoggyCompany')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')

def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CakeRevealStage(BaseModel):
    stage: Literal["creating", "sneak_peek", "ready", "revealed"]
    order_id: str
    pet_name: str
    cake_name: str
    sneak_peek_image: Optional[str] = None
    final_image: Optional[str] = None

class NotificationPreferences(BaseModel):
    whatsapp: bool = True
    email: bool = True
    inbox: bool = True

class CakeOrderUpdate(BaseModel):
    order_id: str
    stage: Literal["creating", "sneak_peek", "ready", "revealed"]
    sneak_peek_image: Optional[str] = None
    final_image: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

NOTIFICATION_TEMPLATES = {
    "creating": {
        "title": "🎨 Magic in Progress!",
        "whatsapp": "Hi {user_name}! 👨‍🍳\n\nOur cake artist has started creating {pet_name}'s special cake! 🎂✨\n\nWe're crafting something magical just for your fur baby. Stay tuned for sneak peeks!\n\n💜 The Doggy Bakery Team",
        "email_subject": "🎨 {pet_name}'s Cake is Being Created!",
        "email_body": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
                <h1 style="color: white; margin: 0;">🎨 Magic in Progress!</h1>
            </div>
            <div style="padding: 30px; background: #fdf4ff;">
                <p style="font-size: 18px;">Hi {user_name}!</p>
                <p>Our talented cake artist has started working on <strong>{pet_name}'s</strong> special cake! 🎂</p>
                <p>We're putting all our love and creativity into making this celebration extra special.</p>
                <div style="background: white; border-radius: 15px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #8b5cf6; font-size: 16px; margin: 0;">🕐 Current Status</p>
                    <p style="font-size: 24px; font-weight: bold; color: #ec4899; margin: 10px 0;">Creating Magic</p>
                    <p style="color: #666;">Sneak peek coming in 24 hours!</p>
                </div>
                <p style="color: #666; font-size: 14px;">Stay tuned for exciting updates! 💜</p>
            </div>
        </div>
        """,
        "inbox": "Our cake artist has started creating {pet_name}'s special cake! 🎨 Stay tuned for sneak peeks!"
    },
    "sneak_peek": {
        "title": "👀 Sneak Peek Alert!",
        "whatsapp": "Psst... {user_name}! 👀\n\nWant a sneak peek of {pet_name}'s cake? 🎂\n\nWe've attached a blurry preview - the full reveal is coming soon! How excited is {pet_name}? 🐕✨\n\n💜 The Doggy Bakery Team",
        "email_subject": "👀 Sneak Peek: {pet_name}'s Cake!",
        "email_body": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
                <h1 style="color: white; margin: 0;">👀 Sneak Peek!</h1>
            </div>
            <div style="padding: 30px; background: #f5f3ff;">
                <p style="font-size: 18px;">Hi {user_name}!</p>
                <p>We couldn't wait to share a little preview of <strong>{pet_name}'s</strong> cake! 🎂</p>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="{sneak_peek_image}" style="max-width: 300px; border-radius: 15px; filter: blur(8px);" alt="Sneak Peek">
                    <p style="color: #8b5cf6; font-style: italic;">Blurry preview - full reveal coming soon!</p>
                </div>
                <div style="background: white; border-radius: 15px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #8b5cf6; font-size: 16px; margin: 0;">🎉 The Big Reveal</p>
                    <p style="font-size: 20px; font-weight: bold; color: #ec4899; margin: 10px 0;">Coming Tomorrow!</p>
                </div>
            </div>
        </div>
        """,
        "inbox": "👀 Sneak peek! We've got a blurry preview of {pet_name}'s cake. The full reveal is coming soon!"
    },
    "ready": {
        "title": "🎁 Your Cake is Ready!",
        "whatsapp": "Exciting news, {user_name}! 🎉\n\n{pet_name}'s cake is READY and looking absolutely pawfect! 🎂✨\n\nIt's being carefully packaged for delivery. Get ready for the big reveal!\n\n🚚 Out for delivery soon!\n\n💜 The Doggy Bakery Team",
        "email_subject": "🎁 {pet_name}'s Cake is Ready for Delivery!",
        "email_body": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
                <h1 style="color: white; margin: 0;">🎁 Ready for Delivery!</h1>
            </div>
            <div style="padding: 30px; background: #f0f9ff;">
                <p style="font-size: 18px;">Hi {user_name}!</p>
                <p><strong>{pet_name}'s</strong> cake is ready and looking absolutely pawfect! 🎂</p>
                <p>Our team is carefully packaging it right now to ensure it arrives in perfect condition.</p>
                <div style="background: white; border-radius: 15px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 40px; margin: 0;">🚚</p>
                    <p style="font-size: 20px; font-weight: bold; color: #3b82f6; margin: 10px 0;">Out for Delivery</p>
                    <p style="color: #666;">The big reveal is almost here!</p>
                </div>
                <p>Get your camera ready for {pet_name}'s reaction! 📸</p>
            </div>
        </div>
        """,
        "inbox": "🎁 {pet_name}'s cake is ready! It's being packaged for delivery. Get your camera ready!"
    },
    "revealed": {
        "title": "🎂 THE BIG REVEAL!",
        "whatsapp": "🎉🎉🎉 IT'S HERE! 🎉🎉🎉\n\n{user_name}, {pet_name}'s cake has arrived! 🎂✨\n\nWe hope this brings so much joy to your fur baby's special day! Don't forget to:\n\n📸 Take lots of photos\n🎥 Capture that first bite\n💜 Share with us!\n\nHappy Celebration! 🥳\n\n💜 The Doggy Bakery Team",
        "email_subject": "🎂 {pet_name}'s Cake Has Arrived - THE BIG REVEAL!",
        "email_body": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ec4899, #f97316, #eab308); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
                <h1 style="color: white; margin: 0;">🎂 THE BIG REVEAL!</h1>
            </div>
            <div style="padding: 30px; background: #fffbeb;">
                <p style="font-size: 18px;">Hi {user_name}!</p>
                <p style="font-size: 24px; text-align: center;">🎉 {pet_name}'s cake has arrived! 🎉</p>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="{final_image}" style="max-width: 400px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" alt="{pet_name}'s Cake">
                </div>
                <div style="background: white; border-radius: 15px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #ec4899; margin-top: 0;">Don't forget to:</h3>
                    <p>📸 Take lots of photos of {pet_name} with the cake</p>
                    <p>🎥 Capture that adorable first bite</p>
                    <p>💜 Share your celebration with us!</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 18px;">Share your celebration album and earn <strong>100 Paw Points!</strong> 🐾</p>
                </div>
            </div>
        </div>
        """,
        "inbox": "🎂 THE BIG REVEAL! {pet_name}'s cake has arrived! We hope it brings so much joy. Share your photos to earn 100 Paw Points!"
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

async def send_whatsapp_notification(phone: str, message: str, image_url: Optional[str] = None):
    """Send WhatsApp notification via Gupshup"""
    if not GUPSHUP_API_KEY or not phone:
        print("[CakeReveal] WhatsApp skipped - missing API key or phone")
        return False
    
    try:
        # Clean phone number
        phone = phone.replace(" ", "").replace("-", "")
        if not phone.startswith("+"):
            phone = "+91" + phone if not phone.startswith("91") else "+" + phone
        
        async with httpx.AsyncClient() as client:
            # Send text message
            payload = {
                "channel": "whatsapp",
                "source": "917834811114",  # Your WhatsApp Business number
                "destination": phone.replace("+", ""),
                "message": message,
                "src.name": GUPSHUP_APP_NAME
            }
            
            response = await client.post(
                "https://api.gupshup.io/sm/api/v1/msg",
                data=payload,
                headers={"apikey": GUPSHUP_API_KEY}
            )
            
            print(f"[CakeReveal] WhatsApp sent to {phone}: {response.status_code}")
            return response.status_code == 200
            
    except Exception as e:
        print(f"[CakeReveal] WhatsApp error: {e}")
        return False


async def send_email_notification(email: str, subject: str, html_body: str):
    """Send email notification via Resend"""
    if not RESEND_API_KEY or not email:
        print("[CakeReveal] Email skipped - missing API key or email")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json={
                    "from": "The Doggy Company <celebrations@thedoggycompany.com>",
                    "to": [email],
                    "subject": subject,
                    "html": html_body
                },
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"[CakeReveal] Email sent to {email}: {response.status_code}")
            return response.status_code in [200, 201]
            
    except Exception as e:
        print(f"[CakeReveal] Email error: {e}")
        return False


async def send_inbox_notification(user_id: str, title: str, message: str, image_url: Optional[str] = None):
    """Save notification to user's inbox"""
    try:
        db = get_db()
        
        notification = {
            "user_id": user_id,
            "type": "cake_reveal",
            "title": title,
            "message": message,
            "image_url": image_url,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.notifications.insert_one(notification)
        print(f"[CakeReveal] Inbox notification saved for user {user_id}")
        return True
        
    except Exception as e:
        print(f"[CakeReveal] Inbox error: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/update-stage")
async def update_cake_reveal_stage(
    update: CakeOrderUpdate,
    background_tasks: BackgroundTasks
):
    """Update cake order stage and send notifications (Admin)"""
    db = get_db()
    
    # Get order details
    order = await db.orders.find_one({"_id": ObjectId(update.order_id)})
    if not order:
        # Try string ID
        order = await db.orders.find_one({"id": update.order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get user details
    user_email = order.get("customer", {}).get("email") or order.get("email")
    user = await db.users.find_one({"email": user_email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found for this order")
    
    # Get pet name from order items
    pet_name = "your fur baby"
    items = order.get("items") or order.get("line_items") or []
    for item in items:
        # Check if item has pet info
        if item.get("pet_name"):
            pet_name = item.get("pet_name")
            break
    
    # If no pet name in order, try to get from user's pets
    if pet_name == "your fur baby":
        pets = await db.pets.find({"owner_id": str(user.get("_id"))}).to_list(1)
        if pets:
            pet_name = pets[0].get("name", pet_name)
    
    # Get cake name
    cake_name = "Birthday Cake"
    for item in items:
        name = (item.get("name") or item.get("title") or "").lower()
        if "cake" in name or "birthday" in name:
            cake_name = item.get("name") or item.get("title")
            break
    
    # Update order with new stage
    await db.orders.update_one(
        {"_id": order.get("_id")},
        {"$set": {
            "cake_reveal_stage": update.stage,
            "cake_reveal_updated_at": datetime.now(timezone.utc),
            "sneak_peek_image": update.sneak_peek_image,
            "final_image": update.final_image
        }}
    )
    
    # Get notification template
    template = NOTIFICATION_TEMPLATES.get(update.stage)
    if not template:
        return {"success": True, "message": "Stage updated, no notifications sent"}
    
    # Prepare template variables
    user_name = user.get("name", "Pet Parent").split()[0]
    template_vars = {
        "user_name": user_name,
        "pet_name": pet_name,
        "cake_name": cake_name,
        "sneak_peek_image": update.sneak_peek_image or "",
        "final_image": update.final_image or ""
    }
    
    # Get user's notification preferences (default all enabled)
    prefs = user.get("notification_preferences", {})
    send_whatsapp = prefs.get("whatsapp", True)
    send_email = prefs.get("email", True)
    send_inbox = prefs.get("inbox", True)
    
    # Send notifications in background
    notifications_sent = []
    
    if send_whatsapp and user.get("phone"):
        whatsapp_msg = template["whatsapp"].format(**template_vars)
        background_tasks.add_task(
            send_whatsapp_notification,
            user.get("phone"),
            whatsapp_msg,
            update.sneak_peek_image or update.final_image
        )
        notifications_sent.append("whatsapp")
    
    if send_email and user.get("email"):
        email_subject = template["email_subject"].format(**template_vars)
        email_body = template["email_body"].format(**template_vars)
        background_tasks.add_task(
            send_email_notification,
            user.get("email"),
            email_subject,
            email_body
        )
        notifications_sent.append("email")
    
    if send_inbox:
        inbox_msg = template["inbox"].format(**template_vars)
        background_tasks.add_task(
            send_inbox_notification,
            str(user.get("_id")),
            template["title"],
            inbox_msg,
            update.sneak_peek_image or update.final_image
        )
        notifications_sent.append("inbox")
    
    # Log the update
    await db.cake_reveal_logs.insert_one({
        "order_id": update.order_id,
        "stage": update.stage,
        "pet_name": pet_name,
        "user_email": user.get("email"),
        "notifications_sent": notifications_sent,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "success": True,
        "message": f"Stage updated to '{update.stage}'",
        "notifications_sent": notifications_sent,
        "pet_name": pet_name
    }


@router.get("/order-status/{order_id}")
async def get_cake_reveal_status(order_id: str):
    """Get current cake reveal status for an order"""
    db = get_db()
    
    order = await db.orders.find_one(
        {"_id": ObjectId(order_id)},
        {"_id": 0, "cake_reveal_stage": 1, "cake_reveal_updated_at": 1, 
         "sneak_peek_image": 1, "final_image": 1}
    )
    
    if not order:
        order = await db.orders.find_one(
            {"id": order_id},
            {"_id": 0, "cake_reveal_stage": 1, "cake_reveal_updated_at": 1,
             "sneak_peek_image": 1, "final_image": 1}
        )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": order_id,
        "stage": order.get("cake_reveal_stage", "creating"),
        "updated_at": order.get("cake_reveal_updated_at"),
        "sneak_peek_image": order.get("sneak_peek_image"),
        "final_image": order.get("final_image")
    }


@router.get("/cake-orders")
async def get_all_cake_orders(limit: int = 50):
    """Get all orders containing cakes (Admin)"""
    db = get_db()
    
    # Find orders with cake items
    orders = await db.orders.find({
        "$or": [
            {"items.name": {"$regex": "cake", "$options": "i"}},
            {"items.title": {"$regex": "cake", "$options": "i"}},
            {"line_items.name": {"$regex": "cake", "$options": "i"}},
            {"line_items.title": {"$regex": "cake", "$options": "i"}}
        ]
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Format response
    result = []
    for order in orders:
        customer = order.get("customer", {})
        items = order.get("items") or order.get("line_items") or []
        
        cake_items = [
            item for item in items
            if "cake" in (item.get("name") or item.get("title") or "").lower()
        ]
        
        result.append({
            "id": str(order.get("_id")),
            "order_number": order.get("order_number", order.get("id", "")),
            "customer_name": customer.get("name", "Unknown"),
            "customer_email": customer.get("email", order.get("email", "")),
            "cake_items": [item.get("name") or item.get("title") for item in cake_items],
            "cake_reveal_stage": order.get("cake_reveal_stage", "creating"),
            "created_at": order.get("created_at"),
            "total": order.get("total", order.get("total_price", 0))
        })
    
    return {"orders": result, "total": len(result)}
