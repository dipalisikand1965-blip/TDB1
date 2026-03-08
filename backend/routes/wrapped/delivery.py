"""
Pet Wrapped - Delivery System
Triggers Welcome Wrapped via: In-App Modal, WhatsApp, Email
All 3 simultaneously after Soul Profile completion
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from bson import ObjectId
import os
import asyncio

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped Delivery"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db_name = os.environ.get("DB_NAME") or "test_database"
db = client[db_name]

# Gupshup WhatsApp
GUPSHUP_API_KEY = os.environ.get("GUPSHUP_API_KEY", "")
GUPSHUP_APP_NAME = os.environ.get("GUPSHUP_APP_NAME", "TheDoggyCompany")
GUPSHUP_SOURCE = os.environ.get("GUPSHUP_SOURCE_NUMBER", "")

# Resend Email
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")


@router.post("/trigger-welcome/{pet_id}")
async def trigger_welcome_wrapped(pet_id: str, background_tasks: BackgroundTasks):
    """
    Trigger Welcome Wrapped delivery after Soul Profile completion.
    Sends via ALL 3 channels simultaneously:
    1. Returns data for In-App Modal (immediate)
    2. Sends WhatsApp message (background)
    3. Sends Email with embedded card (background)
    """
    # Find pet - try multiple ID formats
    pet = None
    
    # First try by 'id' field (for pets with pet-XXXX format)
    if pet_id.startswith("pet-"):
        pet = db.pets.find_one({"id": pet_id})
    
    # If not found, try by _id as ObjectId
    if not pet:
        try:
            pet = db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    
    # If still not found, try by _id as string
    if not pet:
        pet = db.pets.find_one({"_id": pet_id})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Your Pet")
    breed = pet.get("breed", "Beloved Companion")
    soul_score = pet.get("soul_score", 0)
    
    # Get owner details
    owner_id = pet.get("owner_id") or pet.get("user_id")
    owner_email = pet.get("owner_email")
    owner_phone = pet.get("owner_phone")
    parent_name = "Pet Parent"
    
    if owner_id:
        try:
            user = db.users.find_one({"_id": ObjectId(owner_id)})
            if user:
                parent_name = user.get("name", user.get("first_name", "Pet Parent"))
                owner_email = owner_email or user.get("email")
                owner_phone = owner_phone or user.get("phone")
        except:
            user = db.users.find_one({"_id": owner_id})
            if user:
                parent_name = user.get("name", "Pet Parent")
                owner_email = owner_email or user.get("email")
                owner_phone = owner_phone or user.get("phone")
    
    # Generate welcome message
    if soul_score >= 80:
        message = f"You know {pet_name} deeply. That's rare and beautiful."
    elif soul_score >= 60:
        message = f"You're building something special with {pet_name}."
    else:
        message = f"The journey of knowing {pet_name} has begun."
    
    # Build share URL
    share_url = f"https://thedoggycompany.com/api/wrapped/welcome-card/{pet_id}"
    viewer_url = f"https://thedoggycompany.com/wrapped/{pet_id}"
    
    # Schedule background tasks for WhatsApp and Email
    if owner_phone:
        background_tasks.add_task(send_whatsapp_wrapped, pet_id, pet_name, soul_score, owner_phone, share_url)
    
    if owner_email:
        background_tasks.add_task(send_email_wrapped, pet_id, pet_name, breed, soul_score, owner_email, parent_name, message, share_url)
    
    # =========================================
    # UNIVERSAL SERVICE FLOW INTEGRATION
    # =========================================
    
    # 1. Create Service Desk Ticket (for tracking)
    ticket_id = f"wrapped-{pet_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    service_ticket = {
        "ticket_id": ticket_id,
        "type": "pet_wrapped",
        "subtype": "welcome_wrapped",
        "status": "completed",
        "priority": "low",
        "pet_id": pet_id,
        "pet_name": pet_name,
        "user_email": owner_email,
        "title": f"Welcome Wrapped sent for {pet_name}",
        "description": f"Soul Profile completed ({soul_score}%). Welcome Wrapped delivered via modal" + 
                      (", WhatsApp" if owner_phone else "") + 
                      (", email" if owner_email else "") + ".",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "auto_generated": True
    }
    db.service_desk_tickets.insert_one(service_ticket)
    
    # 2. Create Admin Notification
    admin_notif = {
        "type": "pet_wrapped",
        "title": f"🎁 Pet Wrapped sent to {parent_name}",
        "message": f"{pet_name}'s Welcome Wrapped delivered (Soul Score: {soul_score}%)",
        "pet_id": pet_id,
        "pet_name": pet_name,
        "user_email": owner_email,
        "priority": "info",
        "read": False,
        "created_at": datetime.now(timezone.utc),
        "metadata": {
            "soul_score": soul_score,
            "channels": {
                "modal": True,
                "whatsapp": bool(owner_phone),
                "email": bool(owner_email)
            }
        }
    }
    db.admin_notifications.insert_one(admin_notif)
    
    # 3. Create Member Inbox Notification
    member_notif = {
        "user_email": owner_email,
        "type": "pet_wrapped",
        "category": "celebration",
        "title": f"🎉 {pet_name}'s Soul Profile is Complete!",
        "message": f"You've unlocked {pet_name}'s Welcome Wrapped with a Soul Score of {soul_score}%.",
        "action_url": f"/pet-home?pet={pet_id}",
        "action_label": "View Pet Wrapped",
        "read": False,
        "created_at": datetime.now(timezone.utc),
        "metadata": {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "soul_score": soul_score,
            "share_url": share_url
        }
    }
    db.member_notifications.insert_one(member_notif)
    
    # Log the delivery
    db.wrapped_deliveries.insert_one({
        "pet_id": pet_id,
        "pet_name": pet_name,
        "soul_score": soul_score,
        "owner_email": owner_email,
        "owner_phone": owner_phone,
        "channels": {
            "modal": True,
            "whatsapp": bool(owner_phone),
            "email": bool(owner_email)
        },
        "triggered_at": datetime.now(timezone.utc)
    })
    
    # Return data for In-App Modal (immediate response)
    return {
        "success": True,
        "pet_id": pet_id,
        "pet_name": pet_name,
        "breed": breed,
        "soul_score": soul_score,
        "parent_name": parent_name,
        "message": message,
        "share_url": share_url,
        "viewer_url": viewer_url,
        "card_url": f"/api/wrapped/welcome-card/{pet_id}",
        "delivery": {
            "modal": "showing now",
            "whatsapp": "sending" if owner_phone else "no phone",
            "email": "sending" if owner_email else "no email"
        }
    }


async def send_whatsapp_wrapped(pet_id: str, pet_name: str, soul_score: float, phone: str, share_url: str):
    """Send Welcome Wrapped via WhatsApp (Gupshup)"""
    import requests
    
    if not GUPSHUP_API_KEY or not GUPSHUP_SOURCE:
        print(f"WhatsApp not configured, skipping for {pet_name}")
        return
    
    # Clean phone number
    phone = phone.replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+91" + phone if not phone.startswith("91") else "+" + phone
    
    message = f"""🎉 *{pet_name}'s Soul Profile is Complete!*

Soul Score: *{int(soul_score)}%*

You've taken the first step to truly knowing {pet_name}. This is beautiful.

📱 *Share {pet_name}'s Soul Profile:*
{share_url}

_Every dog deserves to be truly known._

— Mira, The Doggy Company 🐾"""
    
    try:
        url = "https://api.gupshup.io/wa/api/v1/msg"  # WhatsApp Business API
        headers = {
            "apikey": GUPSHUP_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "channel": "whatsapp",
            "source": GUPSHUP_SOURCE,
            "destination": phone.replace("+", ""),
            "message": message,
            "src.name": GUPSHUP_APP_NAME
        }
        
        response = requests.post(url, headers=headers, data=data, timeout=10)
        print(f"WhatsApp sent to {phone} for {pet_name}: {response.status_code} - {response.text[:100]}")
        
        # Log the send
        db.wrapped_deliveries.update_one(
            {"pet_id": pet_id},
            {"$set": {"whatsapp_sent": True, "whatsapp_sent_at": datetime.now(timezone.utc)}}
        )
    except Exception as e:
        print(f"WhatsApp error for {pet_name}: {e}")


async def send_email_wrapped(pet_id: str, pet_name: str, breed: str, soul_score: float, 
                             email: str, parent_name: str, message: str, share_url: str):
    """Send Welcome Wrapped via Email (Resend) with embedded card"""
    
    if not RESEND_API_KEY:
        print(f"Email not configured, skipping for {pet_name}")
        return
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        # Beautiful HTML email with embedded card
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0618; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0618; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <p style="color: #C9973A; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
                                THE DOGGY COMPANY
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(160deg, #1a0a2e 0%, #120826 100%); border-radius: 24px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 40px 30px; text-align: center;">
                                        <!-- Badge -->
                                        <p style="display: inline-block; background: rgba(201,151,58,0.15); border: 1px solid rgba(201,151,58,0.3); color: #C9973A; font-size: 11px; letter-spacing: 2px; padding: 8px 16px; border-radius: 50px; margin: 0 0 30px 0;">
                                            ✨ SOUL PROFILE COMPLETE
                                        </p>
                                        
                                        <!-- Paw -->
                                        <p style="font-size: 48px; margin: 0 0 20px 0;">🐾</p>
                                        
                                        <!-- Pet Name -->
                                        <h1 style="font-family: Georgia, serif; font-size: 42px; font-weight: normal; color: #F0C060; margin: 0 0 5px 0; font-style: italic;">
                                            {pet_name}
                                        </h1>
                                        <p style="color: #E8A0B0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 30px 0;">
                                            {breed}
                                        </p>
                                        
                                        <!-- Soul Score -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(201,151,58,0.2); border-radius: 16px; margin-bottom: 25px;">
                                            <tr>
                                                <td style="padding: 25px; text-align: center;">
                                                    <p style="color: #7B4DB5; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 10px 0;">
                                                        SOUL SCORE
                                                    </p>
                                                    <p style="font-family: Georgia, serif; font-size: 56px; font-weight: normal; color: #F0C060; margin: 0; line-height: 1;">
                                                        {int(soul_score)}<span style="font-size: 24px; color: #C9973A;">%</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Message -->
                                        <p style="font-family: Georgia, serif; font-size: 18px; font-style: italic; color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 30px 0;">
                                            "{message}"
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <a href="{share_url}" style="display: inline-block; background: #C9973A; color: #120826; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px;">
                                            🐾 Share {pet_name}'s Profile
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding-top: 30px;">
                            <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6; margin: 0;">
                                Every dog deserves to be truly known.<br>
                                <a href="https://thedoggycompany.com" style="color: #C9973A; text-decoration: none;">thedoggycompany.com</a>
                            </p>
                            <p style="color: rgba(255,255,255,0.25); font-size: 11px; margin-top: 20px;">
                                Built in memory of Mystique 💜
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        params = {
            "from": "Mira <woof@thedoggycompany.com>",
            "to": [email],
            "subject": f"🎉 {pet_name}'s Soul Profile is Complete! Soul Score: {int(soul_score)}%",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        print(f"Email sent to {email} for {pet_name}: {response}")
        
        # Log the send
        db.wrapped_deliveries.update_one(
            {"pet_id": pet_id},
            {"$set": {"email_sent": True, "email_sent_at": datetime.now(timezone.utc)}}
        )
    except Exception as e:
        print(f"Email error for {pet_name}: {e}")


@router.get("/delivery-status/{pet_id}")
async def get_delivery_status(pet_id: str):
    """Check the delivery status for a pet's Welcome Wrapped"""
    delivery = db.wrapped_deliveries.find_one({"pet_id": pet_id})
    
    if not delivery:
        return {"found": False, "message": "No delivery triggered for this pet"}
    
    # Remove MongoDB _id
    delivery["_id"] = str(delivery["_id"])
    
    return {
        "found": True,
        "delivery": delivery
    }
