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

# WhatsApp Cloud API Configuration
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"


def get_whatsapp_config():
    """Get WhatsApp configuration from environment"""
    return {
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID"),
        "access_token": os.environ.get("WHATSAPP_ACCESS_TOKEN"),
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", "doggy_company_verify"),
        "business_account_id": os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID")
    }


def is_whatsapp_configured():
    """Check if WhatsApp is properly configured"""
    config = get_whatsapp_config()
    return bool(config["phone_number_id"] and config["access_token"])


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
    This endpoint processes all incoming WhatsApp communications.
    """
    try:
        body = await request.json()
        logger.info(f"Received WhatsApp webhook: {json.dumps(body, indent=2)[:500]}")
        
        # Extract message data from webhook payload
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


async def process_incoming_message(message: dict, contacts: list):
    """Process incoming WhatsApp message with Mira AI response"""
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


# ============== STATUS & CONFIGURATION ==============

@router.get("/status")
async def get_whatsapp_status():
    """Check WhatsApp integration status"""
    configured = is_whatsapp_configured()
    config = get_whatsapp_config()
    
    return {
        "configured": configured,
        "phone_number_id": config["phone_number_id"][:6] + "..." if config["phone_number_id"] else None,
        "business_account_id": config["business_account_id"][:6] + "..." if config["business_account_id"] else None,
        "webhook_verify_token": config["verify_token"],
        "setup_required": not configured,
        "setup_instructions": {
            "1": "Go to Meta Business Suite > WhatsApp Manager",
            "2": "Create a WhatsApp Business Account if needed",
            "3": "Add a phone number and verify it",
            "4": "Get your Phone Number ID from WhatsApp Manager",
            "5": "Generate a permanent access token",
            "6": "Add to .env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN",
            "7": "Configure webhook URL in Meta Developer Portal"
        } if not configured else None
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
