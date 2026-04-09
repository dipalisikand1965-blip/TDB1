"""
WhatsApp Business API Integration for Service Desk
Ready for WhatsApp Cloud API - just add keys to .env

Required .env variables (add when ready):
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
"""

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
import logging
from datetime import datetime, timezone
import uuid
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# Import canonical ticket spine helper (SINGLE ENTRY POINT for all tickets)
from utils.spine_helper import handoff_to_spine


# WhatsApp Cloud API Configuration
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"

# Gupshup API Configuration
GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"


def get_whatsapp_config():
    """Get WhatsApp configuration from environment"""
    return {
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID"),
        "access_token": os.environ.get("WHATSAPP_ACCESS_TOKEN"),
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", "tdc_webhook_verify_2025"),
        "business_account_id": os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID")
    }


def get_gupshup_config():
    """Get Gupshup configuration from environment"""
    return {
        "api_key": os.environ.get("GUPSHUP_API_KEY"),
        "app_name": os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany"),
        "source_number": os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER")
    }


def is_whatsapp_configured():
    """Check if WhatsApp is properly configured (Meta or Gupshup)"""
    meta_config = get_whatsapp_config()
    gupshup_config = get_gupshup_config()
    return bool(
        (meta_config["phone_number_id"] and meta_config["access_token"]) or
        gupshup_config["api_key"]
    )


def is_gupshup_configured():
    """Check if Gupshup is configured"""
    config = get_gupshup_config()
    return bool(config["api_key"])


# Pydantic Models
class WhatsAppMessage(BaseModel):
    """Outgoing WhatsApp message"""
    to: str  # Phone number with country code (e.g., "919876543210")
    message: str
    template_name: Optional[str] = None  # For template messages
    template_params: Optional[List[str]] = None


class WhatsAppMediaMessage(BaseModel):
    """WhatsApp message with media"""
    to: str
    media_type: str  # image, document, audio, video
    media_url: str
    caption: Optional[str] = None


class IncomingWhatsAppMessage(BaseModel):
    """Webhook payload for incoming WhatsApp messages"""
    from_number: str
    message_id: str
    timestamp: str
    message_type: str  # text, image, document, audio, video, location, contacts
    text: Optional[str] = None
    media_id: Optional[str] = None
    media_mime_type: Optional[str] = None
    caption: Optional[str] = None


# ============== WEBHOOK ENDPOINTS ==============

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    """
    WhatsApp webhook verification endpoint.
    Meta sends a GET request to verify the webhook URL.
    """
    config = get_whatsapp_config()
    
    if hub_mode == "subscribe" and hub_verify_token == config["verify_token"]:
        logger.info("WhatsApp webhook verified successfully")
        return int(hub_challenge)
    
    logger.warning(f"WhatsApp webhook verification failed. Token: {hub_verify_token}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_whatsapp_webhook(request: Request):
    """
    Receive incoming WhatsApp messages and status updates.
    Supports both Meta Cloud API and Gupshup webhook formats.
    """
    try:
        body = await request.json()
        logger.info(f"Received WhatsApp webhook: {json.dumps(body, indent=2)[:500]}")
        
        # ============== GUPSHUP FORMAT ==============
        # Gupshup sends: {"app": "App", "timestamp": ..., "type": "message", "payload": {...}}
        if "payload" in body and body.get("type") in ["message", "message-event"]:
            await process_gupshup_webhook(body)
            return {"status": "ok"}
        
        # ============== META CLOUD API FORMAT ==============
        # Meta sends: {"entry": [{"changes": [{"value": {"messages": [...]}}]}]}
        if "entry" in body:
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    
                    # Handle incoming messages
                    if "messages" in value:
                        for message in value.get("messages", []):
                            await process_incoming_message(message, value.get("contacts", []))
                    
                    # Handle status updates (sent, delivered, read)
                    if "statuses" in value:
                        for status in value.get("statuses", []):
                            await process_status_update(status)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        # Always return 200 to acknowledge receipt
        return {"status": "error", "message": str(e)}


async def process_gupshup_webhook(body: dict):
    """
    Process Gupshup webhook payload.
    
    Gupshup message format:
    {
        "app": "DoggyCompany",
        "timestamp": 1234567890,
        "version": 2,
        "type": "message",
        "payload": {
            "id": "message_id",
            "source": "919876543210",
            "type": "text",
            "payload": {
                "text": "Hello"
            },
            "sender": {
                "phone": "919876543210",
                "name": "John Doe"
            }
        }
    }
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    from realtime_notifications import notification_manager
    
    try:
        payload = body.get("payload", {})
        msg_type = body.get("type", "")
        
        # Handle message events (delivered, read, etc.)
        if msg_type == "message-event":
            event_type = payload.get("type", "")
            logger.info(f"[GUPSHUP] Message event: {event_type}")
            return
        
        # Handle incoming messages
        if msg_type == "message":
            from_number = payload.get("source", "") or payload.get("sender", {}).get("phone", "")
            sender_name = payload.get("sender", {}).get("name", "WhatsApp User")
            message_id = payload.get("id", str(uuid.uuid4()))
            message_type = payload.get("type", "text")
            
            # Extract content based on message type
            content = ""
            inner_payload = payload.get("payload", {})
            
            if message_type == "text":
                content = inner_payload.get("text", "")
            elif message_type == "image":
                content = inner_payload.get("caption", "[Image received]")
            elif message_type == "document":
                content = inner_payload.get("caption", "[Document received]")
            elif message_type == "audio":
                content = "[Voice message received]"
            elif message_type == "video":
                content = inner_payload.get("caption", "[Video received]")
            elif message_type == "location":
                lat = inner_payload.get("latitude", "")
                lon = inner_payload.get("longitude", "")
                content = f"📍 Location: {lat}, {lon}"
            else:
                content = f"[{message_type} message]"
            
            logger.info(f"[GUPSHUP] Message from {from_number}: {content[:100]}")
            
            # Connect to database
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "test_database")
            client = AsyncIOMotorClient(mongo_url)
            db = client[db_name]
            
            # Find or create conversation/ticket
            ticket = await db.tickets.find_one({
                "$or": [
                    {"member.phone": {"$regex": from_number[-10:]}},
                    {"member.whatsapp": from_number}
                ],
                "status": {"$nin": ["closed", "resolved"]}
            }, sort=[("created_at", -1)])
            
            now = datetime.now(timezone.utc).isoformat()
            
            if ticket:
                # Add message to existing ticket
                new_message = {
                    "id": str(uuid.uuid4()),
                    "type": "customer_reply",
                    "content": content,
                    "sender": "member",
                    "sender_name": sender_name,
                    "channel": "whatsapp",
                    "direction": "incoming",
                    "timestamp": now,
                    "is_internal": False,
                    "metadata": {
                        "whatsapp_message_id": message_id,
                        "phone": from_number,
                        "message_type": message_type,
                        "provider": "gupshup"
                    }
                }
                
                await db.tickets.update_one(
                    {"_id": ticket["_id"]},
                    {
                        "$push": {"messages": new_message},
                        "$set": {"updated_at": now, "last_message_at": now}
                    }
                )
                
                logger.info(f"[GUPSHUP] Added message to ticket {ticket.get('ticket_id')}")

                # ── ALSO update service_desk_tickets (Concierge® inbox) ──────
                sd_ticket = await db.service_desk_tickets.find_one(
                    {
                        "$or": [
                            {"member.phone": {"$regex": from_number[-10:]}},
                            {"user_phone": {"$regex": from_number[-10:]}},
                        ],
                        "status": {"$nin": ["closed", "resolved"]},
                    },
                    sort=[("updated_at", -1)],
                )
                wa_msg = {
                    "id": str(uuid.uuid4()),
                    "sender": "member",
                    "sender_name": sender_name,
                    "text": content,
                    "channel": "whatsapp",
                    "timestamp": now,
                    "source": "whatsapp_inbound",
                    "direction": "incoming",
                }
                if sd_ticket:
                    await db.service_desk_tickets.update_one(
                        {"_id": sd_ticket["_id"]},
                        {
                            "$push": {"conversation": wa_msg},
                            "$set": {
                                "updated_at": now,
                                "has_unread_member_reply": True,
                                "last_member_reply_at": now,
                            },
                        },
                    )
                    sd_ticket_id = sd_ticket.get("ticket_id") or sd_ticket.get("id")
                    member_label = sd_ticket.get("member", {}).get("name") or sender_name
                    pet_label    = sd_ticket.get("pet_name", "")
                    await db.admin_notifications.insert_one({
                        "type": "whatsapp_reply",
                        "title": f"💬 WhatsApp reply from {member_label}",
                        "message": f"{sender_name} replied on ticket {sd_ticket_id}{(' for ' + pet_label) if pet_label else ''}: \"{content[:120]}\"",
                        "ticket_id": sd_ticket_id,
                        "read": False,
                        "created_at": now,
                        "metadata": {"from_phone": from_number, "text_preview": content[:200]},
                    })
                    logger.info(f"[GUPSHUP] ✅ service_desk_ticket {sd_ticket_id} updated with WA reply")
                else:
                    # No matching service_desk_ticket — create one so admin can see this conversation
                    # Look up the registered member by phone for enrichment
                    phone_10 = ''.join(filter(str.isdigit, str(from_number)))[-10:]
                    found_user = await db.users.find_one(
                        {"$or": [{"phone": {"$regex": phone_10}}, {"whatsapp": {"$regex": phone_10}}]},
                        {"_id": 0, "email": 1, "name": 1, "parent_name": 1, "phone": 1}
                    )
                    enrich_email = found_user.get("email") if found_user else None
                    enrich_name = (found_user.get("name") or found_user.get("parent_name") or sender_name) if found_user else sender_name
                    enrich_pets = []
                    if enrich_email:
                        enrich_pets = await db.pets.find(
                            {"owner_email": enrich_email},
                            {"_id": 0, "id": 1, "name": 1, "breed": 1, "allergies": 1, "fav_food": 1, "city": 1}
                        ).to_list(3)
                    first_pet = enrich_pets[0] if enrich_pets else None
                    
                    allergy_parts = []
                    if first_pet:
                        raw = first_pet.get("allergies", "")
                        allergy_parts = raw if isinstance(raw, list) else [a.strip() for a in str(raw).split(",") if a.strip()]
                    
                    legacy_tid = ticket.get("ticket_id") or str(uuid.uuid4())[:8].upper()
                    new_sd = {
                        "id": legacy_tid,
                        "ticket_id": legacy_tid,
                        "type": "whatsapp_inquiry",
                        "category": "support",
                        "subject": f"WhatsApp Inquiry: {content[:80]}",
                        "description": content,
                        "status": "open",
                        "priority": "normal",
                        "channel": "whatsapp",
                        "source": "whatsapp",
                        "pillar": "support",
                        "member": {
                            "name": enrich_name,
                            "email": enrich_email,
                            "phone": from_number,
                            "whatsapp": from_number,
                        },
                        "user_phone": from_number,
                        "user_name": enrich_name,
                        "user_email": enrich_email,
                        "pet_name": first_pet.get("name") if first_pet else None,
                        "pet_names": [p.get("name") for p in enrich_pets if p.get("name")],
                        "allergy_alert": f"No {', '.join(allergy_parts)} in ANY product" if allergy_parts else None,
                        "mira_briefing": (
                            f"🔴 ALLERGY ALERT: No {', '.join(allergy_parts)} in ANY product\nPlease confirm via WhatsApp within 2 hours." if allergy_parts else None
                        ),
                        "conversation": [wa_msg],
                        "has_unread_member_reply": True,
                        "last_member_reply_at": now,
                        "created_at": now,
                        "updated_at": now,
                        "assigned_to": None,
                    }
                    await db.service_desk_tickets.insert_one(new_sd)
                    logger.info(f"[GUPSHUP] ✅ Created new service_desk_ticket {legacy_tid} for existing legacy ticket")
            else:
                # ═══════════════════════════════════════════════════════════════════════════
                # HANDOFF TO SPINE - Create new ticket from WhatsApp message (Gupshup)
                # MIGRATED to handoff_to_spine() per Bible Section 12.0.
                # ═══════════════════════════════════════════════════════════════════════════
                
                # ── Step 1: Look up the registered member by phone number ─────────────────
                phone_digits = ''.join(filter(str.isdigit, str(from_number)))
                phone_10 = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
                
                found_user = await db.users.find_one(
                    {"$or": [
                        {"phone": {"$regex": phone_10}},
                        {"whatsapp": {"$regex": phone_10}},
                    ]},
                    {"_id": 0, "email": 1, "name": 1, "parent_name": 1, "phone": 1, "whatsapp": 1}
                )
                
                member_email = None
                member_name = sender_name
                found_pets = []
                first_pet = None
                
                if found_user:
                    member_email = found_user.get("email")
                    member_name = found_user.get("name") or found_user.get("parent_name") or sender_name
                    # Get their pets
                    found_pets = await db.pets.find(
                        {"owner_email": member_email},
                        {"_id": 0, "id": 1, "name": 1, "breed": 1, "allergies": 1, "fav_food": 1, "city": 1}
                    ).to_list(5)
                    first_pet = found_pets[0] if found_pets else None
                    logger.info(f"[GUPSHUP] Matched member {member_email} with {len(found_pets)} pet(s)")
                else:
                    logger.info(f"[GUPSHUP] No registered member found for {phone_10} — creating anonymous ticket")
                
                intent = f"WhatsApp Inquiry: {content[:100]}" if content else "WhatsApp Inquiry"
                
                spine_result = await handoff_to_spine(
                    db=db,
                    route_name="whatsapp_routes.py",
                    endpoint="/whatsapp/webhook (gupshup)",
                    pillar="support",
                    category="whatsapp_inquiry",
                    intent=intent,
                    user={
                        "email": member_email,
                        "name": member_name,
                        "phone": from_number
                    },
                    pet={"id": first_pet.get("id"), "name": first_pet.get("name"), "breed": first_pet.get("breed")} if first_pet else None,
                    payload={
                        "provider": "gupshup",
                        "message_type": message_type,
                        "original_message": content,
                        "whatsapp_message_id": message_id,
                        "messages": [{
                            "id": str(uuid.uuid4()),
                            "type": "initial_message",
                            "content": content,
                            "sender": "member",
                            "sender_name": sender_name,
                            "channel": "whatsapp",
                            "direction": "incoming",
                            "timestamp": now,
                            "is_internal": False
                        }]
                    },
                    channel="whatsapp",
                    urgency="normal",
                    created_by="member",
                    notify_admin=True,
                    notify_member=False,  # No email for WhatsApp users
                    tags=["whatsapp", "gupshup", "inquiry"]
                )
                
                ticket_id = spine_result.get("ticket_id", f"WA-{uuid.uuid4().hex[:8].upper()}")
                logger.info(f"[SPINE-MIGRATED] whatsapp_routes.py (gupshup) → {ticket_id} | pillar=support category=whatsapp_inquiry")
                
                # ── Step 2: Enrich the service_desk_ticket with full member/pet/conversation ──
                # The spine creates a minimal record; we patch it to match the Admin UI schema
                try:
                    allergy_parts = []
                    if first_pet:
                        raw_allergy = first_pet.get("allergies", "")
                        if isinstance(raw_allergy, list):
                            allergy_parts = [a for a in raw_allergy if a]
                        elif raw_allergy:
                            allergy_parts = [a.strip() for a in str(raw_allergy).split(",") if a.strip()]
                    
                    allergy_alert = (
                        f"No {', '.join(allergy_parts)} in ANY product" if allergy_parts else None
                    )
                    
                    pet_names_list = [p.get("name") for p in found_pets if p.get("name")]
                    
                    enrichment = {
                        "member": {
                            "name": member_name,
                            "email": member_email,
                            "phone": from_number,
                            "whatsapp": from_number,
                        },
                        "user_phone": from_number,
                        "user_name": member_name,
                        "user_email": member_email,
                        "source": "whatsapp",
                        "channel": "whatsapp",
                        "pet_name": first_pet.get("name") if first_pet else None,
                        "pet_names": pet_names_list,
                        "pet_profile": {
                            "name": first_pet.get("name"),
                            "breed": first_pet.get("breed"),
                            "allergies": allergy_parts,
                            "fav_food": first_pet.get("fav_food", []),
                            "city": first_pet.get("city"),
                        } if first_pet else None,
                        "allergy_alert": allergy_alert,
                        "mira_briefing": (
                            f"🔴 ALLERGY ALERT: No {', '.join(allergy_parts)} in ANY product\n"
                            f"Please confirm via WhatsApp within 2 hours." if allergy_alert else None
                        ),
                        "conversation": [{
                            "id": str(uuid.uuid4()),
                            "sender": "member",
                            "sender_name": sender_name,
                            "text": content,
                            "channel": "whatsapp",
                            "timestamp": now,
                            "direction": "incoming",
                            "source": "whatsapp_inbound",
                        }],
                        "has_unread_member_reply": True,
                        "last_member_reply_at": now,
                    }
                    await db.service_desk_tickets.update_one(
                        {"ticket_id": ticket_id}, {"$set": enrichment}
                    )
                    # Also patch the tickets collection so follow-up messages can find it by phone
                    await db.tickets.update_one(
                        {"ticket_id": ticket_id},
                        {"$set": {
                            "member.phone": from_number,
                            "member.whatsapp": from_number,
                            "member.name": member_name,
                            "member.email": member_email,
                        }}
                    )
                    logger.info(f"[GUPSHUP] ✅ service_desk_ticket {ticket_id} enriched with member/pet/conversation")
                except Exception as enrich_err:
                    logger.error(f"[GUPSHUP] service_desk_ticket enrichment failed: {enrich_err}")
            
            # Send real-time notification to admin
            try:
                resolved_ticket_id = ticket.get("ticket_id") if ticket else ticket_id
                await notification_manager.emit_new_ticket({
                    "type": "whatsapp_message",
                    "ticket_id": resolved_ticket_id,
                    "from": from_number,
                    "sender_name": sender_name,
                    "message": content[:200],
                    "channel": "whatsapp",
                    "timestamp": now
                })
            except Exception as notif_err:
                logger.warning(f"[GUPSHUP] Notification failed: {notif_err}")
            
            # ── Mira full AI response ──────────────────────────────────────────────
            # Send real Mira intelligence back to the WhatsApp user immediately
            try:
                await send_auto_mira_reply(from_number, content, sender_name)
            except Exception as ack_err:
                logger.warning(f"[GUPSHUP] Mira reply failed (non-critical): {ack_err}")
                
    except Exception as e:
        logger.error(f"[GUPSHUP] Processing error: {e}")
        raise


async def send_mira_ack(from_number: str, user_message: str, sender_name: str, db) -> None:
    """
    Send Mira's warm auto-acknowledgement back to the WhatsApp user.
    Personalised with pet name if the user is a registered member.
    Non-blocking — failures are logged but do not affect ticket creation.
    """
    try:
        # Look up the member + pet for personalisation
        phone_10 = ''.join(filter(str.isdigit, str(from_number)))[-10:]
        found_user = await db.users.find_one(
            {"$or": [{"phone": {"$regex": phone_10}}, {"whatsapp": {"$regex": phone_10}}]},
            {"_id": 0, "name": 1, "parent_name": 1, "email": 1}
        )
        member_name = (found_user.get("name") or found_user.get("parent_name") or sender_name) if found_user else sender_name
        
        pet_name = None
        if found_user and found_user.get("email"):
            first_pet = await db.pets.find_one(
                {"owner_email": found_user["email"]},
                {"_id": 0, "name": 1}
            )
            pet_name = first_pet.get("name") if first_pet else None
        
        # Build a friendly, personalised ack
        first_name = member_name.split()[0] if member_name else "there"
        
        if pet_name:
            ack = (
                f"Hi {first_name}! I'm Mira, {pet_name}'s Concierge® 🐾\n\n"
                f"Got your message! Our Concierge team will review it and get back to you shortly.\n\n"
                f"Is there anything specific about {pet_name} I can help you with right now?"
            )
        else:
            ack = (
                f"Hi {first_name}! I'm Mira from The Doggy Company 🐾\n\n"
                f"Got your message! Our Concierge team will review it and get back to you shortly.\n\n"
                f"Can I help you with anything else in the meantime?"
            )
        
        result = await send_mira_reply(from_number, ack)
        if result.get("success"):
            logger.info(f"[MIRA-ACK] ✅ Sent ack to {phone_10[:6]}*** | pet={pet_name}")
        else:
            logger.warning(f"[MIRA-ACK] Failed: {result.get('error')}")
    except Exception as e:
        logger.error(f"[MIRA-ACK] Error: {e}")


async def process_incoming_message(message: dict, contacts: list):
    """Process incoming WhatsApp message with Mira AI response (Meta Cloud API format)"""
    from motor.motor_asyncio import AsyncIOMotorClient
    from realtime_notifications import notification_manager
    
    try:
        # Extract message details
        from_number = message.get("from", "")
        message_id = message.get("id", "")
        message_type = message.get("type", "text")
        
        # Get sender name from contacts
        sender_name = "WhatsApp User"
        for contact in contacts:
            if contact.get("wa_id") == from_number:
                sender_name = contact.get("profile", {}).get("name", sender_name)
                break
        
        # Extract message content based on type
        content = ""
        media_info = None
        
        if message_type == "text":
            content = message.get("text", {}).get("body", "")
        elif message_type in ["image", "document", "audio", "video"]:
            media = message.get(message_type, {})
            content = media.get("caption", f"[{message_type.upper()}]")
            media_info = {
                "type": message_type,
                "media_id": media.get("id"),
                "mime_type": media.get("mime_type")
            }
        elif message_type == "location":
            loc = message.get("location", {})
            content = f"📍 Location: {loc.get('latitude')}, {loc.get('longitude')}"
        elif message_type == "contacts":
            content = "[Contact shared]"
        
        # Connect to database
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Find existing open ticket for this phone number
        ticket = await db.tickets.find_one({
            "$or": [
                {"member.phone": {"$regex": from_number[-10:]}},
                {"member.whatsapp": from_number}
            ],
            "status": {"$nin": ["closed", "resolved"]}
        }, sort=[("created_at", -1)])
        
        now = datetime.now(timezone.utc).isoformat()
        
        if ticket:
            # Add message to existing ticket
            new_message = {
                "id": str(uuid.uuid4()),
                "type": "customer_reply",
                "content": content,
                "sender": "member",
                "sender_name": sender_name,
                "channel": "whatsapp",
                "direction": "incoming",
                "timestamp": now,
                "is_internal": False,
                "metadata": {
                    "whatsapp_message_id": message_id,
                    "phone": from_number,
                    "message_type": message_type
                }
            }
            
            if media_info:
                new_message["media"] = media_info
            
            await db.tickets.update_one(
                {"_id": ticket["_id"]},
                {
                    "$push": {"messages": new_message},
                    "$set": {
                        "updated_at": now,
                        "status": "in_progress" if ticket.get("status") == "waiting_on_member" else ticket.get("status")
                    }
                }
            )
            
            # Emit real-time notification
            await notification_manager.emit_new_message(
                ticket.get("ticket_id"),
                new_message,
                "whatsapp"
            )
            
            logger.info(f"Added WhatsApp message to ticket: {ticket.get('ticket_id')}")
            
        else:
            # ═══════════════════════════════════════════════════════════════════════════
            # HANDOFF TO SPINE - Create new ticket from WhatsApp message (Meta Cloud API)
            # MIGRATED to handoff_to_spine() per Bible Section 12.0.
            # ═══════════════════════════════════════════════════════════════════════════
            intent = f"WhatsApp: {content[:50]}..." if len(content) > 50 else f"WhatsApp: {content}"
            
            initial_message = {
                "id": str(uuid.uuid4()),
                "type": "initial",
                "content": content,
                "sender": "member",
                "sender_name": sender_name,
                "channel": "whatsapp",
                "direction": "incoming",
                "timestamp": now,
                "is_internal": False,
                "metadata": {
                    "whatsapp_message_id": message_id,
                    "phone": from_number,
                    "message_type": message_type
                }
            }
            
            if media_info:
                initial_message["media"] = media_info
            
            spine_result = await handoff_to_spine(
                db=db,
                route_name="whatsapp_routes.py",
                endpoint="/whatsapp/webhook (meta)",
                pillar="support",
                category="whatsapp_inquiry",
                intent=intent,
                user={
                    "email": None,
                    "name": sender_name,
                    "phone": from_number
                },
                pet=None,
                payload={
                    "provider": "meta_cloud_api",
                    "message_type": message_type,
                    "original_message": content,
                    "whatsapp_message_id": message_id,
                    "messages": [initial_message]
                },
                channel="whatsapp",
                urgency="normal",
                created_by="member",
                notify_admin=True,
                notify_member=False,  # No email for WhatsApp users
                tags=["whatsapp", "meta", "inquiry"]
            )
            
            new_ticket_id = spine_result.get("ticket_id", f"WA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
            
            # Emit real-time notification for new ticket
            await notification_manager.emit_new_ticket({
                "ticket_id": new_ticket_id,
                "subject": intent,
                "member": {
                    "name": sender_name,
                    "phone": from_number,
                    "whatsapp": from_number
                },
                "channel": "whatsapp",
                "status": "new"
            })
            
            logger.info(f"[SPINE-MIGRATED] whatsapp_routes.py (meta) → {new_ticket_id} | pillar=support category=whatsapp_inquiry")
        
        # 🐕‍🦺 Send Mira's auto-reply
        await send_auto_mira_reply(from_number, content, sender_name)
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error processing WhatsApp message: {e}")
        raise


async def process_status_update(status: dict):
    """Process WhatsApp message status updates (sent, delivered, read)"""
    logger.info(f"WhatsApp status update: {status.get('status')} for {status.get('id')}")
    # Could update message delivery status in database if needed


# ============== SENDING ENDPOINTS ==============

@router.post("/send")
async def send_whatsapp_message(message: WhatsAppMessage):
    """
    Send a WhatsApp message to a customer.
    Requires WhatsApp Business API credentials.
    """
    if not is_whatsapp_configured():
        raise HTTPException(
            status_code=503,
            detail="WhatsApp is not configured. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env"
        )
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Send text message
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": message.to,
                "type": "text",
                "text": {
                    "preview_url": True,
                    "body": message.message
                }
            }
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"WhatsApp API error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            logger.info(f"WhatsApp message sent: {result}")
            
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "to": message.to
            }
            
    except httpx.HTTPError as e:
        logger.error(f"WhatsApp HTTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-template")
async def send_template_message(message: WhatsAppMessage):
    """
    Send a WhatsApp template message.
    Templates must be pre-approved in Meta Business Manager.
    """
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    if not message.template_name:
        raise HTTPException(status_code=400, detail="template_name is required")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Build template components
            components = []
            if message.template_params:
                components.append({
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in message.template_params]
                })
            
            payload = {
                "messaging_product": "whatsapp",
                "to": message.to,
                "type": "template",
                "template": {
                    "name": message.template_name,
                    "language": {"code": "en"},
                    "components": components
                }
            }
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "template": message.template_name
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-media")
async def send_media_message(message: WhatsAppMediaMessage):
    """Send a media message (image, document, audio, video)"""
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "messaging_product": "whatsapp",
                "to": message.to,
                "type": message.media_type,
                message.media_type: {
                    "link": message.media_url
                }
            }
            
            if message.caption and message.media_type in ["image", "video", "document"]:
                payload[message.media_type]["caption"] = message.caption
            
            response = await client.post(
                f"{WHATSAPP_API_URL}/{config['phone_number_id']}/messages",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id")
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== GUPSHUP ENDPOINTS ==============

@router.post("/gupshup/send")
async def send_gupshup_message(message: WhatsAppMessage):
    """
    Send a WhatsApp message via Gupshup API.
    Use this endpoint if you're using Gupshup as your WhatsApp provider.
    """
    if not is_gupshup_configured():
        raise HTTPException(status_code=503, detail="Gupshup not configured. Add GUPSHUP_API_KEY to .env")
    
    config = get_gupshup_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Gupshup API payload
            payload = {
                "channel": "whatsapp",
                "source": config["source_number"],
                "destination": message.to,
                "message": json.dumps({
                    "type": "text",
                    "text": message.message
                }),
                "src.name": config["app_name"]
            }
            
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload
            )
            
            result = response.json()
            
            if response.status_code not in [200, 202] or result.get("status") not in ["success", "submitted"]:
                logger.error(f"Gupshup API error: {result}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=result.get("message", "Gupshup API error")
                )
            
            logger.info(f"[GUPSHUP] Message sent: {result}")
            
            return {
                "success": True,
                "message_id": result.get("messageId"),
                "to": message.to,
                "provider": "gupshup"
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Gupshup HTTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gupshup/send-template")
async def send_gupshup_template(
    to: str,
    template_id: str,
    params: List[str] = []
):
    """
    Send a template message via Gupshup.
    Templates must be pre-approved in Gupshup dashboard.
    """
    if not is_gupshup_configured():
        raise HTTPException(status_code=503, detail="Gupshup not configured")
    
    config = get_gupshup_config()
    
    try:
        async with httpx.AsyncClient() as client:
            # Build template message
            template_message = {
                "id": template_id,
                "params": params
            }
            
            payload = {
                "channel": "whatsapp",
                "source": config["source_number"],
                "destination": to,
                "template": json.dumps(template_message),
                "src.name": config["app_name"]
            }
            
            response = await client.post(
                GUPSHUP_API_URL,
                headers={
                    "apikey": config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data=payload
            )
            
            result = response.json()
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=result)
            
            return {
                "success": True,
                "message_id": result.get("messageId"),
                "provider": "gupshup"
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== STATUS & CONFIGURATION ==============

@router.get("/status")
async def get_whatsapp_status():
    """Check WhatsApp integration status (Meta and Gupshup)"""
    meta_configured = bool(get_whatsapp_config()["phone_number_id"] and get_whatsapp_config()["access_token"])
    gupshup_configured = is_gupshup_configured()
    meta_config = get_whatsapp_config()
    gupshup_config = get_gupshup_config()
    
    return {
        "configured": meta_configured or gupshup_configured,
        "providers": {
            "meta_cloud_api": {
                "configured": meta_configured,
                "phone_number_id": meta_config["phone_number_id"][:6] + "..." if meta_config["phone_number_id"] else None,
            },
            "gupshup": {
                "configured": gupshup_configured,
                "app_name": gupshup_config["app_name"],
                "source_number": gupshup_config["source_number"]
            }
        },
        "webhook_verify_token": meta_config["verify_token"],
        "webhook_url": "/api/whatsapp/webhook",
        "setup_instructions": {
            "gupshup": {
                "1": "Go to Gupshup Dashboard (gupshup.io)",
                "2": "Create WhatsApp Business API App",
                "3": "Get your API Key from Settings",
                "4": "Add to .env: GUPSHUP_API_KEY=your_key",
                "5": "Set callback URL in Gupshup: https://thedoggycompany.com/api/whatsapp/webhook"
            },
            "meta_cloud_api": {
                "1": "Go to Meta Business Suite > WhatsApp Manager",
                "2": "Get Phone Number ID and Access Token",
                "3": "Add to .env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN"
            }
        } if not (meta_configured or gupshup_configured) else None
    }


@router.get("/templates")
async def list_message_templates():
    """List available WhatsApp message templates"""
    if not is_whatsapp_configured():
        raise HTTPException(status_code=503, detail="WhatsApp not configured")
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{WHATSAPP_API_URL}/{config['business_account_id']}/message_templates",
                headers={"Authorization": f"Bearer {config['access_token']}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============== MIRA AI FOR WHATSAPP ==============

# Mira's personality and command patterns for WhatsApp
MIRA_WHATSAPP_PATTERNS = {
    "greeting": {
        "patterns": ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
        "response": "Hey there! 🐾 I'm Mira, your pet concierge from The Doggy Company! How can I help you and your furry friend today?\n\nYou can ask me about:\n🛒 Products & treats\n📅 Bookings (grooming, vet, daycare)\n🎂 Birthday celebrations\n❓ Any pet questions!"
    },
    "order": {
        "patterns": ["order", "buy", "treats", "food", "shop", "product"],
        "response": "I'd love to help you order something special! 🛍️\n\n👉 Visit our shop: https://thedoggycompany.com/shop\n\nOr tell me what you're looking for - treats, food, toys? I'll find the perfect match for your pup! 🐕"
    },
    "grooming": {
        "patterns": ["groom", "grooming", "bath", "haircut", "spa"],
        "response": "Time for a spa day! ✂️🛁\n\nI can help you book grooming at our partner salons. Just tell me:\n1️⃣ Your pet's name\n2️⃣ Preferred date\n3️⃣ Your location\n\nOr book directly: https://thedoggycompany.com/care?type=grooming"
    },
    "vet": {
        "patterns": ["vet", "doctor", "vaccine", "vaccination", "health", "sick", "medicine"],
        "response": "Your pet's health is our priority! 💊\n\nFor vet appointments:\n👉 https://thedoggycompany.com/care?type=vet\n\n🚨 For emergencies, call our 24/7 helpline!\n\nWhat's going on with your furry friend? I'm here to help! 🐾"
    },
    "birthday": {
        "patterns": ["birthday", "party", "cake", "celebration", "celebrate"],
        "response": "Aww, someone has a birthday coming up! 🎂🎉\n\nWe have:\n🎂 Custom pet cakes\n🎈 Party supplies\n🎁 Birthday boxes\n\nCheck them out: https://thedoggycompany.com/celebrate\n\nWhen's the big day? I'll help you plan the pawfect party! 🐕"
    },
    "stay": {
        "patterns": ["boarding", "stay", "daycare", "hotel", "travel", "vacation"],
        "response": "Planning to travel or need pet care? 🏨\n\nWe offer:\n🏠 Boarding & daycare\n✈️ Pet-friendly travel help\n🐕 Dog walking\n\nExplore options: https://thedoggycompany.com/stay\n\nTell me more about what you need!"
    },
    "membership": {
        "patterns": ["member", "membership", "pass", "join", "pet pass", "soul"],
        "response": "Great question! 🌟\n\nThe Pet Pass gives you:\n✨ Access to all 14 life pillars\n💎 Paw Points rewards\n🎁 Exclusive offers\n📱 Personal concierge (that's me!)\n\nJoin here: https://thedoggycompany.com/pet-soul-onboard\n\nWant me to explain more?"
    },
    "help": {
        "patterns": ["help", "support", "issue", "problem", "complaint"],
        "response": "I'm here to help! 💜\n\nYou can:\n📞 Call us: +91 96631 85747\n💬 Chat right here\n📧 Email: hello@thedoggycompany.com\n\nWhat's on your mind? I'll do my best to solve it! 🐾"
    },
    "thanks": {
        "patterns": ["thank", "thanks", "awesome", "great", "perfect"],
        "response": "You're so welcome! 💕 Taking care of pets is what I love most!\n\nAnything else I can help with? I'm always here! 🐕‍🦺"
    },
    "bye": {
        "patterns": ["bye", "goodbye", "see you", "later"],
        "response": "Bye for now! 👋 Give your furry friend a belly rub from me! 🐾\n\nI'm available 24/7 - just message anytime! 💜"
    }
}

MIRA_DEFAULT_RESPONSE = """Hi there! 🐾 I'm Mira from The Doggy Company!

I can help you with:
🛒 Order treats & products
✂️ Book grooming
💊 Vet appointments
🎂 Birthday celebrations
🏨 Boarding & daycare

Just tell me what you need! Or visit: https://thedoggycompany.com

What would you like help with today? 🐕"""


def _build_amazon_query(raw_query: str, pet_names: list = None) -> str:
    """Mirror of MiraSearchPage.jsx buildAmazonQuery — strips pet names + filler for clean Amazon search."""
    import re
    q = raw_query or ""
    # Strip known pet names
    known_names = ['mojo','mahi','meister','mercury','bruno','buddy','coco','mystique',
                   'chang','mynx','miracle','mars','moon','mia','magica','maya','max','loco','badmash','sultan']
    if pet_names:
        known_names += [n.lower() for n in pet_names if n]
    for name in known_names:
        q = re.sub(r'\b' + re.escape(name) + r'\b', ' ', q, flags=re.IGNORECASE)
    # Strip conversational filler
    q = re.sub(r'\b(i want|i need|find me|get me|show me|looking for|can you find|please|'
               r'help me find|what about|is there|do you have|do you sell|where can i get|'
               r'where can i find|wants?|needs?|loves?|would like|my dog|my pet|my pup|'
               r'my puppy|for my|for him|for her|for them|a good|the best|some|any|'
               r'book|groomer|grooming|near me|nearby|suggest|recommend)\b', ' ', q, flags=re.IGNORECASE)
    q = re.sub(r'\b(a|an|the|for|of|with|in|on|at|to|and|or|but|my|your|his|her|their|our)\b', ' ', q, flags=re.IGNORECASE)
    q = re.sub(r'\s{2,}', ' ', q).strip()
    return q or raw_query


def _detect_near_me(text: str) -> bool:
    """Detect if user wants nearby services / locations."""
    import re
    patterns = [r'\bnear\s+me\b', r'\bnearby\b', r'\bnear\s+by\b', r'\bclose\s+to\s+me\b',
                r'\bin\s+(mumbai|delhi|bangalore|bengaluru|pune|chennai|hyderabad|kolkata|'
                r'gurgaon|noida|jaipur|ahmedabad|surat|lucknow|chandigarh|indore)\b',
                r'\baround\s+me\b', r'\bfind.*near\b', r'\blocal\b', r'\bmy\s+city\b',
                r'\bmy\s+area\b', r'\bwhere.*find\b']
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in patterns)


async def get_mira_ai_response(message_text: str, user_name: str = "friend", user_phone: str = None) -> str:
    """
    Mira WhatsApp Intelligence — same brain as Mira Search.
    
    Pipeline:
      1. Load full pet soul profile (allergies, breed, energy, favorites)
      2. Run semantic search → real products + prices from TDC catalog
      3. Apply allergen filtering in system prompt
      4. Amazon affiliate fallback if 0 catalog results
      5. NearMe → Google Maps link
      6. Always: Concierge CTA
      7. Ticket + admin notification handled by webhook (handoff_to_spine)
    """
    import os, re
    from motor.motor_asyncio import AsyncIOMotorClient

    AFFILIATE_TAG  = os.environ.get("AMAZON_AFFILIATE_TAG", "thedoggyco-21")
    EMERGENT_KEY   = os.environ.get("EMERGENT_LLM_KEY", "")
    mongo_url      = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name        = os.environ.get("DB_NAME", "test_database")

    _client = AsyncIOMotorClient(mongo_url)
    db = _client[db_name]

    # ── 1. Load full soul profile ─────────────────────────────────────────────
    context_parts  = []
    all_pet_names  = []
    all_allergies  = []
    all_favorites  = []
    pet_city       = None
    user_email     = None

    if db is not None and user_phone:
        try:
            phone_clean = ''.join(filter(str.isdigit, str(user_phone)))
            if len(phone_clean) == 12 and phone_clean.startswith('91'):
                phone_clean = phone_clean[2:]

            # ── 1a. Check open ticket first → which pet is this conversation about? ──
            # This is the fix for multi-pet confusion: Mira picks the pet from the
            # ONGOING ticket, not a random first pet from the DB.
            ticket_pet_name = None
            # Always use last 10 digits for ticket lookup (tickets store phone_10 without leading 0)
            phone_10 = phone_clean[-10:]
            open_ticket = await db.service_desk_tickets.find_one(
                {
                    "$or": [
                        {"user_phone": {"$regex": phone_10}},
                        {"member.phone": {"$regex": phone_10}},
                        {"member.whatsapp": {"$regex": phone_10}},
                    ],
                    "status": {"$nin": ["closed", "resolved"]},
                },
                sort=[("updated_at", -1)],
            )
            if open_ticket:
                ticket_pet_name = open_ticket.get("pet_name")
                if ticket_pet_name:
                    logger.info(f"[MIRA-AI] Ongoing ticket → active pet locked to: {ticket_pet_name}")

            user = await db.users.find_one({
                "$or": [
                    {"phone": {"$regex": phone_clean}},
                    {"whatsapp": {"$regex": phone_clean}},
                    {"phone": user_phone}, {"whatsapp": user_phone}
                ]
            }, {"_id": 0, "email": 1, "name": 1, "parent_name": 1, "membership": 1, "city": 1})

            if user:
                user_email = user.get("email")
                user_name  = user.get("name") or user.get("parent_name") or user_name
                pet_city   = user.get("city")

                membership = user.get("membership", {})
                if membership.get("tier"):
                    context_parts.append(f"Member tier: {membership['tier']}")

                # Full soul profile for each pet
                pets = await db.pets.find(
                    {"owner_email": user_email},
                    {"_id": 0, "name": 1, "breed": 1, "date_of_birth": 1,
                     "allergies": 1, "health_conditions": 1, "doggy_soul_answers": 1,
                     "favorite_foods": 1, "weight": 1, "life_stage": 1, "city": 1}
                ).to_list(5)

                if pets:
                    # ── 1b. Pin the conversation pet to the front ─────────────────
                    # If ticket told us which pet this conversation is about, sort it first.
                    if ticket_pet_name:
                        pets.sort(
                            key=lambda p: 0 if p.get("name", "").lower() == ticket_pet_name.lower() else 1
                        )

                    pet_lines = []
                    for idx, p in enumerate(pets):
                        name   = p.get("name", "Unknown")
                        breed  = p.get("breed", "Unknown breed")
                        stage  = p.get("life_stage", "")
                        weight = p.get("weight")
                        all_pet_names.append(name)
                        if p.get("city") and not pet_city:
                            pet_city = p["city"]

                        # Allergies
                        raw_allergies = p.get("allergies") or []
                        if isinstance(raw_allergies, str):
                            raw_allergies = [a.strip() for a in raw_allergies.split(",") if a.strip()]
                        soul = p.get("doggy_soul_answers", {})
                        soul_allergies = soul.get("food_allergies", "")
                        # soul_allergies may be a list OR a string
                        if isinstance(soul_allergies, list):
                            raw_allergies += [a.strip() for a in soul_allergies if a.strip()]
                        elif soul_allergies and str(soul_allergies).lower() not in ("none", "no", ""):
                            raw_allergies += [a.strip() for a in str(soul_allergies).split(",") if a.strip()]
                        pet_allergies = list({a.lower() for a in raw_allergies if str(a).lower() not in ("none", "")})
                        if pet_allergies:
                            all_allergies += pet_allergies

                        # Favorites
                        favs = p.get("favorite_foods") or soul.get("treat_preference", "")
                        if favs:
                            fav_list = favs if isinstance(favs, list) else [f.strip() for f in favs.split(",")]
                            all_favorites += fav_list

                        # Build pet summary line
                        line = f"{name} ({breed}"
                        if stage: line += f", {stage}"
                        if weight: line += f", {weight}kg"
                        line += ")"
                        if pet_allergies:
                            line += f" — ALLERGIC TO: {', '.join(pet_allergies)}"
                        # Energy / personality from soul answers
                        energy = soul.get("energy_level", "")
                        if energy: line += f" | Energy: {energy}"
                        # Mark the active conversation pet
                        if idx == 0 and ticket_pet_name and name.lower() == ticket_pet_name.lower():
                            line += " ← ACTIVE (this conversation is about this dog)"
                        pet_lines.append(line)

                    # ── 1c. Only expose the active pet to GPT when conversation is ongoing ───
                    # If we know which pet this conversation is about, hide all other pets
                    # so GPT cannot mention them (fixes Sultan/Badmash confusion).
                    if ticket_pet_name:
                        active_lines = [l for l in pet_lines if ticket_pet_name.lower() in l.lower()]
                        context_parts.append(f"Dog in this conversation: {active_lines[0] if active_lines else pet_lines[0]}")
                        context_parts.append(
                            f"RULE: This conversation is ONLY about {ticket_pet_name}. "
                            f"Never name or reference any other dog."
                        )
                    else:
                        context_parts.append(f"Dogs: {' | '.join(pet_lines)}")

                    if all_allergies:
                        context_parts.append(f"ALLERGEN BLOCK — NEVER recommend: {', '.join(set(all_allergies))}")
                    if all_favorites:
                        context_parts.append(f"Favorite treats: {', '.join(set(all_favorites))}")

                # Recent tickets — only include when NO active pet lock (avoid leaking other pet names)
                if not ticket_pet_name:
                    recent_tickets = await db.service_desk_tickets.find(
                        {"$or": [{"member.email": user_email}, {"member.phone": {"$regex": phone_clean}}]},
                        {"_id": 0, "subject": 1, "description": 1, "status": 1, "pillar": 1}
                    ).sort("created_at", -1).limit(2).to_list(2)

                    if recent_tickets:
                        t_lines = [f"{t.get('subject', t.get('pillar',''))[:40]} ({t.get('status','open')})" for t in recent_tickets]
                        context_parts.append(f"Recent requests: {'; '.join(t_lines)}")

        except Exception as ctx_err:
            logger.warning(f"[MIRA-AI] Context fetch error: {ctx_err}")

    # ── 2. Detect near-me intent ──────────────────────────────────────────────
    is_near_me = _detect_near_me(message_text)

    # ── 3. Semantic search → real TDC products ────────────────────────────────
    catalog_block  = ""
    amazon_url     = ""
    near_me_block  = ""
    found_products = []
    found_services = []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "http://localhost:8001/api/mira/semantic-search",
                json={"query": message_text, "limit": 4,
                      "pet_allergies": all_allergies if all_allergies else None}
            )
            if resp.status_code == 200:
                data = resp.json()
                found_products = data.get("products", [])[:4]
                found_services = data.get("services", [])[:2]
    except Exception as search_err:
        logger.warning(f"[MIRA-AI] Semantic search failed: {search_err}")

    # Build catalog block from real products
    if found_products:
        prod_lines = []
        for p in found_products:
            price = p.get("original_price") or p.get("price", 0)
            pillar = p.get("pillar", "")
            name   = p.get("name", "")
            link   = f"thedoggycompany.com/{pillar}" if pillar else "thedoggycompany.com"
            prod_lines.append(f"- {name} — ₹{int(price) if price else 'POA'} → {link}")
        catalog_block = "FROM OUR CATALOG:\n" + "\n".join(prod_lines)

    if found_services:
        svc_lines = [f"- {s.get('name','')} ({s.get('pillar','')})" for s in found_services]
        if catalog_block:
            catalog_block += "\n\nSERVICES:\n" + "\n".join(svc_lines)
        else:
            catalog_block = "SERVICES:\n" + "\n".join(svc_lines)

    # Amazon fallback — always build it (shown if 0 TDC results OR appended)
    clean_q    = _build_amazon_query(message_text, all_pet_names)
    amazon_url = f"https://www.amazon.in/s?k=dog+{clean_q.replace(' ', '+')}&tag={AFFILIATE_TAG}"

    # NearMe block
    if is_near_me:
        city_q     = pet_city or "near me"
        groom_q    = message_text.lower()
        if "groom" in groom_q:      maps_q = f"dog groomer in {city_q}"
        elif "vet" in groom_q:      maps_q = f"dog vet clinic in {city_q}"
        elif "train" in groom_q:    maps_q = f"dog training in {city_q}"
        elif "board" in groom_q or "stay" in groom_q: maps_q = f"dog boarding in {city_q}"
        elif "walker" in groom_q or "walk" in groom_q: maps_q = f"dog walker in {city_q}"
        else:                       maps_q = f"dog service in {city_q}"
        maps_url   = f"https://maps.google.com/search?q={maps_q.replace(' ', '+')}"
        near_me_block = f"\n\n📍 Find nearby:\n{maps_url}"

    # ── 4. Build system prompt with full intelligence ─────────────────────────
    context_block = ""
    if context_parts:
        context_block = "\n\nMEMBER PROFILE:\n" + "\n".join(f"• {c}" for c in context_parts)

    allergen_rule = ""
    if all_allergies:
        allergen_rule = f"\n\n🚨 ALLERGEN ALERT: NEVER recommend products containing {', '.join(set(all_allergies))}. This is non-negotiable."

    catalog_instruction = ""
    if catalog_block:
        catalog_instruction = f"\n\n{catalog_block}\n\nIMPORTANT: When recommending products, use ONLY the real names and prices above. Do NOT invent product names."
    else:
        catalog_instruction = f"\n\nNo exact TDC matches found. Guide them to explore:\n🛒 {amazon_url}\nOr ask Concierge to source it."

    near_me_instruction = f"\n\nNEARME DETECTED: Include this Google Maps link in your response:{near_me_block}" if is_near_me else ""

    # ── Active-pet lock injected at top of system prompt ─────────────────────
    active_pet_lock = ""
    if ticket_pet_name:
        active_pet_lock = (
            f"\n\n🔒 ACTIVE PET LOCK: This conversation is ONLY about {ticket_pet_name}. "
            f"You must ONLY use the name '{ticket_pet_name}' in your response. "
            f"Never mention, reference, or address any other dog. Not even once."
        )

    system_prompt = f"""You are Mira, the AI concierge at The Doggy Company — India's first Pet Life OS.{active_pet_lock}

TONE:
- Intelligent, knowledgeable friend — not a greeting card
- Direct and useful. Skip the fluff.
- Use the dog's name naturally, not performatively
- Max 150 words total. Every word must earn its place.

BANNED WORDS — never use these:
paw-sitively, pawsome, fur-ever, furry friends, tummy, pup-tastic, pawfect, furbaby, pooch, woof, arf, belly rubs, tail wagging, cuddles

PRODUCT RULES:
- Every recommendation MUST include: exact product name + ₹price + link
- Use ONLY real names and prices from the catalog below — never invent them
- If no catalog match: give Amazon fallback link, don't pretend you have stock
- Format: "Product Name — ₹X → link"

SPECIES RULE:
- User has DOGS. Rabbit/cat/squirrel/fish in their message = a toy shape or product type, NOT their pet.
- If they say "baby rabbit toy" → they want a rabbit-SHAPED dog toy. Recommend dog toys.
- NEVER suggest going elsewhere for rabbits. Just find the dog toy equivalent.{allergen_rule}{catalog_instruction}{near_me_instruction}{context_block}

RESPONSE STRUCTURE — follow this format exactly:

Hey [Parent name]! 🐾

For [Dog's name] today:
- [Product Name] — ₹[price]
  [link e.g. thedoggycompany.com/dine]
  ✦ Why: [max 10 words — use dog's actual name + real allergy/breed/favourite reason]

(add up to 3 products for the SAME dog — one "For [name] today:" block only, never two)

[If NearMe detected: include Google Maps link]

Need help? Your Concierge is here →
thedoggycompany.com/my-requests 🐾

RULES FOR ✦ Why line:
- Must use the dog's actual name (e.g. "Mojo", "Badmash")
- Must reference a real reason: favourite ingredient, blocked allergen, breed trait, life stage
- Max 10 words. No filler. Examples:
  ✦ Why: Salmon (Mojo's favourite), no chicken or beef
  ✦ Why: Perfect for high-energy Indie dogs
  ✦ Why: Gentle on Badmash's Newfoundland joints
  ✦ Why: No beef — safe for Mojo

Website: thedoggycompany.com | Concierge: +91 8971702582"""

    # ── 5. Call GPT ───────────────────────────────────────────────────────────
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        import uuid as uuid_mod

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            # Scope session to the specific pet when known — prevents cross-pet contamination
            session_id=f"wa-{user_phone or uuid_mod.uuid4().hex[:8]}-{ticket_pet_name.lower() if ticket_pet_name else 'all'}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o-mini")

        response = await chat.send_message(UserMessage(text=f"{user_name} says: {message_text}"))

        if response:
            n_products = len(found_products)
            n_services = len(found_services)
            logger.info(f"[MIRA-AI] ✅ Response for {(user_phone or '')[:6]}*** | "
                       f"products={n_products} services={n_services} "
                       f"allergies={len(all_allergies)} nearme={is_near_me}")
            return response

    except Exception as ai_err:
        logger.warning(f"[MIRA-AI] AI failed, falling back to patterns: {ai_err}")

    # ── 6. Fallback to pattern matching ──────────────────────────────────────
    return await get_mira_whatsapp_response(message_text, user_name)


async def get_mira_whatsapp_response(message_text: str, user_name: str = "friend") -> str:
    """
    Generate Mira's intelligent response for WhatsApp messages.
    Uses word-boundary pattern matching for common queries.
    Includes NearMe Google Maps link when location intent detected.
    """
    import re
    message_lower = message_text.lower().strip()

    # NearMe detection — inject Maps link into response
    is_near_me = _detect_near_me(message_text)

    # Check each pattern category (order matters - check more specific patterns first)
    pattern_order = ["membership", "order", "grooming", "vet", "birthday", "stay", "help", "thanks", "bye", "greeting"]
    
    for category in pattern_order:
        if category not in MIRA_WHATSAPP_PATTERNS:
            continue
        data = MIRA_WHATSAPP_PATTERNS[category]
        for pattern in data["patterns"]:
            # Use word boundary for short patterns like 'hi', 'bye' to avoid false matches
            if len(pattern) <= 3:
                if re.search(r'\b' + re.escape(pattern) + r'\b', message_lower):
                    response = data["response"]
                    if user_name and user_name != "WhatsApp User":
                        response = response.replace("Hey there!", f"Hey {user_name}!")
                    if is_near_me:
                        # Map category to service type
                        svc_map = {
                            "grooming": "dog+groomer", "vet": "dog+vet+clinic",
                            "stay": "dog+boarding", "order": "dog+store"
                        }
                        svc_q = svc_map.get(category, "dog+service")
                        maps_url = f"https://maps.google.com/search?q={svc_q}+near+me"
                        response += f"\n\n📍 Find nearby:\n{maps_url}"
                    return response
            else:
                if pattern in message_lower:
                    response = data["response"]
                    if user_name and user_name != "WhatsApp User":
                        response = response.replace("Hey there!", f"Hey {user_name}!")
                    if is_near_me:
                        svc_map = {
                            "grooming": "dog+groomer", "vet": "dog+vet+clinic",
                            "stay": "dog+boarding", "order": "dog+store"
                        }
                        svc_q = svc_map.get(category, "dog+service")
                        maps_url = f"https://maps.google.com/search?q={svc_q}+near+me"
                        response += f"\n\n📍 Find nearby:\n{maps_url}"
                    return response

    # Default response — add NearMe if detected
    response = MIRA_DEFAULT_RESPONSE
    if is_near_me:
        maps_url = "https://maps.google.com/search?q=dog+service+near+me"
        response += f"\n\n📍 Find services nearby:\n{maps_url}"
    return response


@router.post("/mira-reply")
async def send_mira_reply(to: str, message: str):
    """
    Send Mira's AI response via WhatsApp using Gupshup API.
    Called after processing an incoming message.
    """
    if not is_gupshup_configured():
        logger.warning("Gupshup not configured - Mira reply skipped")
        return {"success": False, "reason": "Gupshup not configured"}
    
    config = get_gupshup_config()
    
    try:
        import json
        
        # Format phone number
        phone = ''.join(filter(str.isdigit, str(to)))
        if len(phone) == 10:
            phone = '91' + phone
        
        payload = {
            "channel": "whatsapp",
            "source": config["source_number"],
            "destination": phone,
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
            
            if response.status_code in [200, 202] and result.get("status") in ["submitted", "success"]:
                logger.info(f"[MIRA-WHATSAPP] Reply sent to {phone[:6]}*** | ID: {result.get('messageId')}")
                return {"success": True, "message_id": result.get("messageId")}
            else:
                logger.error(f"[MIRA-WHATSAPP] Reply failed: {result}")
                return {"success": False, "error": result.get("message", "Unknown error")}
                
    except Exception as e:
        logger.error(f"[MIRA-WHATSAPP] Reply error: {e}")
        return {"success": False, "error": str(e)}


# Update process_incoming_message to send Mira's reply
async def send_auto_mira_reply(from_number: str, incoming_message: str, sender_name: str):
    """Automatically send Mira's AI response to incoming WhatsApp messages"""
    try:
        # Get Mira's AI response (with fallback to patterns)
        mira_response = await get_mira_ai_response(incoming_message, sender_name, from_number)
        
        # Send via Gupshup WhatsApp API
        if is_gupshup_configured():
            result = await send_mira_reply(from_number, mira_response)
            if result.get("success"):
                logger.info(f"[MIRA-AI] Auto-replied to {from_number[:6]}***")
            else:
                logger.warning(f"[MIRA-AI] Auto-reply failed: {result.get('error')}")
        else:
            logger.info(f"[MIRA-AI] Response ready (Gupshup not configured): {mira_response[:50]}...")
            
    except Exception as e:
        logger.error(f"[MIRA-AI] Error sending auto-reply: {e}")



# ==================== TEST NOTIFICATION ENDPOINT ====================

class TestNotificationRequest(BaseModel):
    phone: str
    notification_type: str  # welcome, payment, membership, booking, birthday
    # Optional fields based on type
    user_name: str = "Test User"
    amount: Optional[float] = None
    plan_name: Optional[str] = None
    order_id: Optional[str] = None
    tier: Optional[str] = None
    expires_at: Optional[str] = None
    pet_name: Optional[str] = None
    service_name: Optional[str] = None
    booking_date: Optional[str] = None


@router.post("/test-notification")
async def test_whatsapp_notification(request: TestNotificationRequest):
    """
    Test endpoint to manually trigger WhatsApp notifications
    Only for testing - requires authentication in production
    """
    from whatsapp_notifications import WhatsAppNotifications
    
    try:
        result = None
        
        if request.notification_type == "welcome":
            result = await WhatsAppNotifications.welcome_new_user(
                phone=request.phone,
                user_name=request.user_name
            )
        
        elif request.notification_type == "payment":
            result = await WhatsAppNotifications.payment_received(
                phone=request.phone,
                user_name=request.user_name,
                amount=request.amount or 2499,
                plan_name=request.plan_name or "Essential",
                order_id=request.order_id or "TEST-ORDER-123"
            )
        
        elif request.notification_type == "membership":
            result = await WhatsAppNotifications.membership_activated(
                phone=request.phone,
                user_name=request.user_name,
                tier=request.tier or "essential",
                expires_at=request.expires_at or "2027-03-07T00:00:00"
            )
        
        elif request.notification_type == "booking":
            result = await WhatsAppNotifications.service_booked(
                phone=request.phone,
                user_name=request.user_name,
                pet_name=request.pet_name or "Buddy",
                service_name=request.service_name or "Grooming Session",
                booking_date=request.booking_date or "March 15, 2026"
            )
        
        elif request.notification_type == "birthday":
            result = await WhatsAppNotifications.pet_birthday_reminder(
                phone=request.phone,
                user_name=request.user_name,
                pet_name=request.pet_name or "Buddy",
                birthday_date=request.booking_date or "March 15",
                days_until=7
            )
        
        else:
            return {"success": False, "error": f"Unknown notification type: {request.notification_type}"}
        
        return {
            "success": result.get("success", False) if result else False,
            "notification_type": request.notification_type,
            "phone": request.phone[:6] + "***",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Test notification error: {e}")
        return {"success": False, "error": str(e)}
