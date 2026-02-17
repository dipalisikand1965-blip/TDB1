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
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", "doggy_company_verify"),
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
            else:
                # Create new ticket from WhatsApp message
                ticket_id = f"WA-{uuid.uuid4().hex[:8].upper()}"
                new_ticket = {
                    "ticket_id": ticket_id,
                    "type": "whatsapp_inquiry",
                    "source": "whatsapp",
                    "provider": "gupshup",
                    "status": "new",
                    "priority": "medium",
                    "member": {
                        "name": sender_name,
                        "phone": from_number,
                        "whatsapp": from_number
                    },
                    "subject": content[:100] if content else "WhatsApp Inquiry",
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
                    }],
                    "created_at": now,
                    "updated_at": now
                }
                
                await db.tickets.insert_one(new_ticket)
                logger.info(f"[GUPSHUP] Created new ticket {ticket_id}")
            
            # Send real-time notification to admin
            try:
                await notification_manager.broadcast_to_group("concierge_admins", {
                    "type": "whatsapp_message",
                    "ticket_id": ticket.get("ticket_id") if ticket else ticket_id,
                    "from": from_number,
                    "sender_name": sender_name,
                    "message": content[:200],
                    "timestamp": now
                })
            except Exception as notif_err:
                logger.warning(f"[GUPSHUP] Notification failed: {notif_err}")
                
    except Exception as e:
        logger.error(f"[GUPSHUP] Processing error: {e}")
        raise


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
            # Create new ticket from WhatsApp message
            new_ticket_id = f"WA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
            
            new_ticket = {
                "ticket_id": new_ticket_id,
                "source": "whatsapp",
                "channel": "whatsapp",
                "category": "inquiry",
                "status": "new",
                "urgency": "medium",
                "subject": f"WhatsApp: {content[:50]}..." if len(content) > 50 else f"WhatsApp: {content}",
                "description": content,
                "member": {
                    "name": sender_name,
                    "phone": from_number,
                    "whatsapp": from_number
                },
                "messages": [{
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
                }],
                "created_at": now,
                "updated_at": now
            }
            
            if media_info:
                new_ticket["messages"][0]["media"] = media_info
            
            await db.tickets.insert_one(new_ticket)
            
            # Emit real-time notification for new ticket
            await notification_manager.emit_new_ticket({
                "ticket_id": new_ticket_id,
                "subject": new_ticket["subject"],
                "member": new_ticket["member"],
                "channel": "whatsapp",
                "status": "new"
            })
            
            logger.info(f"Created new ticket from WhatsApp: {new_ticket_id}")
        
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
            
            if response.status_code != 200 or result.get("status") == "error":
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
                "5": "Set callback URL in Gupshup: https://thedoggycompany.in/api/whatsapp/webhook"
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
        "response": "I'd love to help you order something special! 🛍️\n\n👉 Visit our shop: https://thedoggycompany.in/shop\n\nOr tell me what you're looking for - treats, food, toys? I'll find the perfect match for your pup! 🐕"
    },
    "grooming": {
        "patterns": ["groom", "grooming", "bath", "haircut", "spa"],
        "response": "Time for a spa day! ✂️🛁\n\nI can help you book grooming at our partner salons. Just tell me:\n1️⃣ Your pet's name\n2️⃣ Preferred date\n3️⃣ Your location\n\nOr book directly: https://thedoggycompany.in/care?type=grooming"
    },
    "vet": {
        "patterns": ["vet", "doctor", "vaccine", "vaccination", "health", "sick", "medicine"],
        "response": "Your pet's health is our priority! 💊\n\nFor vet appointments:\n👉 https://thedoggycompany.in/care?type=vet\n\n🚨 For emergencies, call our 24/7 helpline!\n\nWhat's going on with your furry friend? I'm here to help! 🐾"
    },
    "birthday": {
        "patterns": ["birthday", "party", "cake", "celebration", "celebrate"],
        "response": "Aww, someone has a birthday coming up! 🎂🎉\n\nWe have:\n🎂 Custom pet cakes\n🎈 Party supplies\n🎁 Birthday boxes\n\nCheck them out: https://thedoggycompany.in/celebrate\n\nWhen's the big day? I'll help you plan the pawfect party! 🐕"
    },
    "stay": {
        "patterns": ["boarding", "stay", "daycare", "hotel", "travel", "vacation"],
        "response": "Planning to travel or need pet care? 🏨\n\nWe offer:\n🏠 Boarding & daycare\n✈️ Pet-friendly travel help\n🐕 Dog walking\n\nExplore options: https://thedoggycompany.in/stay\n\nTell me more about what you need!"
    },
    "membership": {
        "patterns": ["member", "membership", "pass", "join", "pet pass", "soul"],
        "response": "Great question! 🌟\n\nThe Pet Pass gives you:\n✨ Access to all 14 life pillars\n💎 Paw Points rewards\n🎁 Exclusive offers\n📱 Personal concierge (that's me!)\n\nJoin here: https://thedoggycompany.in/pet-soul-onboard\n\nWant me to explain more?"
    },
    "help": {
        "patterns": ["help", "support", "issue", "problem", "complaint"],
        "response": "I'm here to help! 💜\n\nYou can:\n📞 Call us: +91 96631 85747\n💬 Chat right here\n📧 Email: hello@thedoggycompany.in\n\nWhat's on your mind? I'll do my best to solve it! 🐾"
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

Just tell me what you need! Or visit: https://thedoggycompany.in

What would you like help with today? 🐕"""


async def get_mira_whatsapp_response(message_text: str, user_name: str = "friend") -> str:
    """
    Generate Mira's intelligent response for WhatsApp messages.
    Uses word-boundary pattern matching for common queries.
    """
    import re
    message_lower = message_text.lower().strip()
    
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
                    return response
            else:
                if pattern in message_lower:
                    response = data["response"]
                    if user_name and user_name != "WhatsApp User":
                        response = response.replace("Hey there!", f"Hey {user_name}!")
                    return response
    
    # Default response
    return MIRA_DEFAULT_RESPONSE


@router.post("/mira-reply")
async def send_mira_reply(to: str, message: str):
    """
    Send Mira's AI response via WhatsApp.
    Called after processing an incoming message.
    """
    if not is_whatsapp_configured():
        logger.warning("WhatsApp not configured - Mira reply skipped")
        return {"success": False, "reason": "WhatsApp not configured"}
    
    config = get_whatsapp_config()
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": "text",
                "text": {
                    "preview_url": True,
                    "body": message
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
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Mira WhatsApp reply sent to {to[:6]}...")
                return {"success": True, "message_id": result.get("messages", [{}])[0].get("id")}
            else:
                logger.error(f"Mira WhatsApp reply failed: {response.text}")
                return {"success": False, "error": response.text}
                
    except Exception as e:
        logger.error(f"Mira WhatsApp reply error: {e}")
        return {"success": False, "error": str(e)}


# Update process_incoming_message to send Mira's reply
async def send_auto_mira_reply(from_number: str, incoming_message: str, sender_name: str):
    """Automatically send Mira's AI response to incoming WhatsApp messages"""
    try:
        # Get Mira's response
        mira_response = await get_mira_whatsapp_response(incoming_message, sender_name)
        
        # Send via WhatsApp if configured
        if is_whatsapp_configured():
            await send_mira_reply(from_number, mira_response)
            logger.info(f"Mira auto-replied to {from_number[:6]}...")
        else:
            logger.info(f"Mira response ready (WhatsApp not configured): {mira_response[:50]}...")
            
    except Exception as e:
        logger.error(f"Error sending Mira auto-reply: {e}")
