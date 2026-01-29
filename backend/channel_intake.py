"""
Multi-Channel Intake Engine for The Doggy Company
Unified request handler for all channels: Web, Chat, WhatsApp, Email, Phone, Voice

This engine ensures identical backend workflow regardless of the input channel.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Literal
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from dotenv import load_dotenv
import tempfile
import json

load_dotenv()

logger = logging.getLogger(__name__)

# ==================== CONFIG ====================

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Create router
channel_router = APIRouter(prefix="/api/channels", tags=["Multi-Channel Intake"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

ChannelType = Literal["web", "chat", "whatsapp", "email", "phone", "voice"]
RequestType = Literal["order", "inquiry", "booking", "appointment", "feedback", "support"]

class ChannelRequest(BaseModel):
    """Unified request from any channel"""
    channel: ChannelType
    request_type: RequestType = "inquiry"
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    pet_name: Optional[str] = None
    message: str
    raw_data: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class VoiceTranscription(BaseModel):
    """Voice transcription result"""
    text: str
    confidence: Optional[float] = None
    language: Optional[str] = None
    duration_seconds: Optional[float] = None
    segments: Optional[List[Dict]] = None

class IntakeResponse(BaseModel):
    """Standard response for all channel intakes"""
    success: bool
    request_id: str
    channel: str
    message: str
    extracted_data: Dict[str, Any] = {}
    next_steps: List[str] = []


# ==================== VOICE TRANSCRIPTION ====================

async def transcribe_voice(audio_content: bytes, filename: str) -> VoiceTranscription:
    """Transcribe voice audio using OpenAI Whisper"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Voice transcription not configured")
    
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        # Initialize Whisper
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Get file extension
        file_ext = filename.split('.')[-1].lower() if filename else 'webm'
        
        # Save content to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_ext}") as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name
        
        # Transcribe with verbose output for segments
        with open(tmp_path, "rb") as audio:
            response = await stt.transcribe(
                file=audio,
                model="whisper-1",
                response_format="verbose_json",
                language="en",
                prompt="This is a customer placing an order for dog treats, cakes, or services at The Doggy Company pet store."
            )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Handle response - could be string or object
        if isinstance(response, str):
            text = response
            language = 'en'
            duration = None
            segments = None
        else:
            text = getattr(response, 'text', str(response))
            language = getattr(response, 'language', 'en')
            duration = getattr(response, 'duration', None)
            raw_segments = getattr(response, 'segments', [])
            if raw_segments:
                segments = []
                for s in raw_segments:
                    # Handle both dict and object formats
                    if isinstance(s, dict):
                        segments.append({"start": s.get('start'), "end": s.get('end'), "text": s.get('text')})
                    else:
                        segments.append({"start": getattr(s, 'start', None), "end": getattr(s, 'end', None), "text": getattr(s, 'text', '')})
            else:
                segments = None
        
        transcription = VoiceTranscription(
            text=text,
            language=language,
            duration_seconds=duration,
            segments=segments
        )
        
        logger.info(f"Voice transcribed: {len(transcription.text)} chars")
        return transcription
        
    except Exception as e:
        logger.error(f"Voice transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# ==================== ORDER EXTRACTION ====================

async def extract_order_details(text: str) -> Dict[str, Any]:
    """Extract order details from transcribed text using AI"""
    if not EMERGENT_LLM_KEY:
        return {"raw_text": text, "parsed": False}
    
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        import uuid
        
        extraction_prompt = f"""
        Extract order details from this customer voice message. Return a JSON object with:
        - customer_name: string or null
        - pet_name: string or null
        - pet_type: string (dog/cat) or null
        - items: array of {{name: string, quantity: number, notes: string}}
        - delivery_preference: "pickup" or "delivery" or null
        - city: string or null
        - special_instructions: string or null
        - is_custom_cake: boolean
        - urgency: "normal" or "urgent" or null
        
        Customer message: "{text}"
        
        Return ONLY valid JSON, no explanation.
        """
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message="You are an order extraction assistant. Extract structured data from customer messages and return only valid JSON."
        )
        
        response = await chat.send_message(UserMessage(text=extraction_prompt))
        
        # Parse JSON response
        try:
            # Clean up response - remove markdown code blocks if present
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            extracted = json.loads(json_str.strip())
            extracted["parsed"] = True
            return extracted
        except json.JSONDecodeError:
            return {"raw_text": text, "parsed": False, "ai_response": response}
            
    except Exception as e:
        logger.error(f"Order extraction failed: {e}")
        return {"raw_text": text, "parsed": False, "error": str(e)}


# ==================== UNIFIED INTAKE PROCESSOR ====================

async def process_intake(request: ChannelRequest) -> IntakeResponse:
    """Process any channel request through unified workflow"""
    import secrets
    
    # Generate unique request ID
    request_id = f"TDC-{request.channel.upper()[:3]}-{secrets.token_hex(4).upper()}"
    
    # Extract order details if it looks like an order
    extracted_data = {}
    if request.request_type == "order" or any(word in request.message.lower() for word in ["order", "cake", "treat", "want", "need", "buy"]):
        extracted_data = await extract_order_details(request.message)
    
    # Create intake record
    intake_record = {
        "request_id": request_id,
        "channel": request.channel,
        "request_type": request.request_type,
        "customer": {
            "name": request.customer_name or extracted_data.get("customer_name"),
            "email": request.customer_email,
            "phone": request.customer_phone,
            "pet_name": request.pet_name or extracted_data.get("pet_name")
        },
        "message": request.message,
        "extracted_data": extracted_data,
        "raw_data": request.raw_data,
        "metadata": request.metadata,
        "status": "pending",
        "pillar": "general",  # Default pillar - can be reassigned by admin
        "assigned_pillar": None,  # For admin assignment
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processed_at": None
    }
    
    # Save to database
    if db is not None:
        await db.channel_intakes.insert_one(intake_record)
        
        # AUTO-CREATE SERVICE DESK TICKET for voice/channel intakes
        try:
            customer_name = request.customer_name or extracted_data.get("customer_name") or "Unknown Customer"
            customer_email = request.customer_email
            
            # Detect potential pillar from message content
            detected_pillar = "general"
            message_lower = request.message.lower()
            if any(word in message_lower for word in ["cake", "treat", "bakery", "birthday", "celebration"]):
                detected_pillar = "celebrate"
            elif any(word in message_lower for word in ["restaurant", "dine", "reservation", "table", "lunch", "dinner"]):
                detected_pillar = "dine"
            elif any(word in message_lower for word in ["stay", "hotel", "resort", "booking", "vacation", "pawcation"]):
                detected_pillar = "stay"
            elif any(word in message_lower for word in ["travel", "flight", "transport", "relocate"]):
                detected_pillar = "travel"
            elif any(word in message_lower for word in ["groom", "vet", "doctor", "training", "spa"]):
                detected_pillar = "care"
            
            # Create ticket
            ticket_id = f"TKT-{secrets.token_hex(4).upper()}"
            notification_id = f"NOTIF-{secrets.token_hex(4).upper()}"
            inbox_id = request_id  # Use request_id as inbox_id
            
            ticket_doc = {
                "ticket_id": ticket_id,
                "notification_id": notification_id,
                "inbox_id": inbox_id,
                "title": f"[{request.channel.upper()}] {request.request_type.title()} Request - {customer_name}",
                "description": f"**Channel:** {request.channel}\n**Message:**\n{request.message}\n\n**Extracted Data:** {json.dumps(extracted_data, indent=2) if extracted_data else 'None'}",
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": request.customer_phone,
                # Add member object for Service Desk display
                "member": {
                    "name": customer_name,
                    "email": customer_email,
                    "phone": request.customer_phone
                },
                # Add pet object if pet name provided
                "pet": {
                    "name": request.pet_name or extracted_data.get("pet_name"),
                    "breed": extracted_data.get("pet_breed")
                } if (request.pet_name or extracted_data.get("pet_name")) else None,
                "source": f"channel_intake_{request.channel}",
                "source_id": request_id,
                "pillar": detected_pillar,
                "suggested_pillar": detected_pillar,
                "category": "channel_order",
                "status": "new",
                "priority": 3,
                "urgency": "medium",
                "assigned_to": None,
                "tags": ["channel-intake", request.channel, detected_pillar],
                "messages": [{
                    "id": f"msg-{secrets.token_hex(4)}",
                    "sender": "system",
                    "channel": "internal",
                    "message": f"Auto-created from {request.channel} intake. Request ID: {request_id}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }],
                "metadata": {
                    "intake_id": request_id,
                    "channel": request.channel,
                    "extracted_data": extracted_data
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            # Insert into BOTH service_desk_tickets and tickets for backward compatibility
            await db.service_desk_tickets.insert_one(ticket_doc)
            await db.tickets.insert_one(ticket_doc)
            
            # Also create admin notification
            await db.admin_notifications.insert_one({
                "id": notification_id,
                "type": f"channel_intake_{request.channel}",
                "title": f"New {request.channel.title()} Order - {customer_name}",
                "message": f"{request.message[:100]}..." if len(request.message) > 100 else request.message,
                "status": "unread",
                "ticket_id": ticket_id,
                "inbox_id": inbox_id,
                "pillar": detected_pillar,
                "urgency": "medium",
                "customer": {
                    "name": customer_name,
                    "email": customer_email,
                    "phone": request.customer_phone
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read_at": None,
                "link": f"/admin?tab=servicedesk&ticket={ticket_id}"
            })
            
            # Update intake with ticket ID
            await db.channel_intakes.update_one(
                {"request_id": request_id},
                {"$set": {"ticket_id": ticket_id, "pillar": detected_pillar}}
            )
            
            logger.info(f"Auto-created ticket {ticket_id} for {request.channel} intake {request_id}, pillar: {detected_pillar}")
            
            # Send notification
            try:
                from notification_engine import send_notification, NotificationEvent, NotificationRecipient
                event = NotificationEvent(
                    event_type="ticket_created",
                    pillar=detected_pillar,
                    reference_id=ticket_id,
                    reference_type="ticket",
                    customer=NotificationRecipient(
                        name=customer_name,
                        email=customer_email,
                        phone=request.customer_phone
                    ),
                    data={
                        "channel": request.channel,
                        "message_preview": request.message[:100] + "..." if len(request.message) > 100 else request.message,
                        "request_id": request_id
                    },
                    triggered_by="system"
                )
                await send_notification(event, ["email"])
                logger.info(f"Notification sent for ticket {ticket_id}")
            except Exception as ne:
                logger.error(f"Failed to send notification for ticket {ticket_id}: {ne}")
                
        except Exception as e:
            logger.error(f"Failed to create ticket for channel intake {request_id}: {e}")
    
    # Determine next steps based on extracted data
    next_steps = []
    if extracted_data.get("parsed"):
        if extracted_data.get("is_custom_cake"):
            next_steps.append("Custom cake request - will be reviewed by our cake designers")
        if extracted_data.get("items"):
            next_steps.append(f"Found {len(extracted_data['items'])} item(s) in your order")
        if extracted_data.get("delivery_preference") == "delivery":
            next_steps.append("Home delivery requested")
        elif extracted_data.get("delivery_preference") == "pickup":
            next_steps.append("Store pickup requested")
    else:
        next_steps.append("Our team will review your request and contact you shortly")
    
    next_steps.append("A service desk ticket has been created for your request")
    
    return IntakeResponse(
        success=True,
        request_id=request_id,
        channel=request.channel,
        message="Your request has been received and is being processed",
        extracted_data=extracted_data,
        next_steps=next_steps
    )


# ==================== API ROUTES ====================

@channel_router.post("/voice/order", response_model=IntakeResponse)
async def voice_order(
    audio: UploadFile = File(...),
    customer_name: Optional[str] = Form(None),
    customer_email: Optional[str] = Form(None),
    customer_phone: Optional[str] = Form(None),
    pet_name: Optional[str] = Form(None)
):
    """
    Process a voice order - transcribe and extract order details
    
    Accepts audio files: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 5MB)
    """
    # Validate file type
    allowed_types = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]
    file_ext = audio.filename.split(".")[-1].lower() if audio.filename else ""
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid audio format. Supported: {', '.join(allowed_types)}"
        )
    
    # Read file content once
    content = await audio.read()
    
    # Check file size (5MB limit for Cloudflare compatibility)
    max_size_mb = 5
    if len(content) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail=f"Audio file too large ({len(content) / (1024*1024):.1f}MB). Maximum {max_size_mb}MB - try a shorter recording (max 30 seconds)."
        )
    
    # Transcribe voice - pass content and filename
    transcription = await transcribe_voice(content, audio.filename)
    
    # Process through unified intake
    request = ChannelRequest(
        channel="voice",
        request_type="order",
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        pet_name=pet_name,
        message=transcription.text,
        raw_data={
            "transcription": transcription.dict(),
            "filename": audio.filename
        },
        metadata={
            "duration_seconds": transcription.duration_seconds,
            "language": transcription.language
        }
    )
    
    return await process_intake(request)


@channel_router.post("/text/order", response_model=IntakeResponse)
async def text_order(
    message: str = Form(...),
    channel: ChannelType = Form("web"),
    customer_name: Optional[str] = Form(None),
    customer_email: Optional[str] = Form(None),
    customer_phone: Optional[str] = Form(None),
    pet_name: Optional[str] = Form(None)
):
    """Process a text-based order from any channel (web, chat, whatsapp, email)"""
    request = ChannelRequest(
        channel=channel,
        request_type="order",
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        pet_name=pet_name,
        message=message
    )
    
    return await process_intake(request)


@channel_router.post("/inquiry", response_model=IntakeResponse)
async def general_inquiry(
    message: str = Form(...),
    channel: ChannelType = Form("web"),
    request_type: RequestType = Form("inquiry"),
    customer_name: Optional[str] = Form(None),
    customer_email: Optional[str] = Form(None),
    customer_phone: Optional[str] = Form(None)
):
    """Process a general inquiry from any channel"""
    request = ChannelRequest(
        channel=channel,
        request_type=request_type,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        message=message
    )
    
    return await process_intake(request)


@channel_router.get("/intakes")
async def get_intakes(
    channel: Optional[str] = None,
    status: Optional[str] = None,
    pillar: Optional[str] = None,
    limit: int = 50
):
    """Get channel intake requests (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if channel:
        query["channel"] = channel
    if status:
        query["status"] = status
    if pillar:
        query["pillar"] = pillar
    
    intakes = await db.channel_intakes.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get pillar counts
    pillar_pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}}
    ]
    pillar_stats = await db.channel_intakes.aggregate(pillar_pipeline).to_list(100)
    
    return {
        "intakes": intakes, 
        "count": len(intakes),
        "by_pillar": {s["_id"]: s["count"] for s in pillar_stats if s["_id"]}
    }


@channel_router.get("/intakes/{request_id}")
async def get_intake(request_id: str):
    """Get a specific intake request"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    intake = await db.channel_intakes.find_one({"request_id": request_id}, {"_id": 0})
    
    if not intake:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return intake


@channel_router.patch("/intakes/{request_id}")
async def update_intake(request_id: str, updates: Dict[str, Any]):
    """Update intake status (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.channel_intakes.update_one(
        {"request_id": request_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "message": "Intake updated"}


@channel_router.patch("/intakes/{request_id}/assign-pillar")
async def assign_intake_to_pillar(request_id: str, pillar: str):
    """Assign a channel intake to a specific pillar (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    valid_pillars = ["celebrate", "dine", "stay", "travel", "care", "shop", "general"]
    if pillar not in valid_pillars:
        raise HTTPException(status_code=400, detail=f"Invalid pillar. Must be one of: {valid_pillars}")
    
    # Update intake
    result = await db.channel_intakes.update_one(
        {"request_id": request_id},
        {"$set": {
            "pillar": pillar,
            "assigned_pillar": pillar,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Also update linked service desk ticket if exists
    intake = await db.channel_intakes.find_one({"request_id": request_id})
    if intake and intake.get("ticket_id"):
        await db.service_desk_tickets.update_one(
            {"ticket_id": intake["ticket_id"]},
            {"$set": {
                "pillar": pillar,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        logger.info(f"Updated ticket {intake['ticket_id']} pillar to {pillar}")
    
    return {"success": True, "message": f"Intake assigned to {pillar} pillar"}


@channel_router.get("/intakes/by-pillar/{pillar}")
async def get_intakes_by_pillar(pillar: str, status: Optional[str] = None, limit: int = 50):
    """Get channel intakes filtered by pillar (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {"pillar": pillar}
    if status:
        query["status"] = status
    
    intakes = await db.channel_intakes.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"intakes": intakes, "count": len(intakes), "pillar": pillar}


@channel_router.get("/stats")
async def get_channel_stats(days: int = 7):
    """Get channel intake statistics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    from datetime import timedelta
    since = datetime.now(timezone.utc) - timedelta(days=days)
    
    # By channel
    channel_pipeline = [
        {"$match": {"created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": "$channel", "count": {"$sum": 1}}}
    ]
    
    # By status
    status_pipeline = [
        {"$match": {"created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    
    # By request type
    type_pipeline = [
        {"$match": {"created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": "$request_type", "count": {"$sum": 1}}}
    ]
    
    channel_stats = await db.channel_intakes.aggregate(channel_pipeline).to_list(100)
    status_stats = await db.channel_intakes.aggregate(status_pipeline).to_list(100)
    type_stats = await db.channel_intakes.aggregate(type_pipeline).to_list(100)
    
    # By pillar
    pillar_pipeline = [
        {"$match": {"created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}}
    ]
    pillar_stats = await db.channel_intakes.aggregate(pillar_pipeline).to_list(100)
    
    total = sum(s["count"] for s in channel_stats)
    
    return {
        "period_days": days,
        "total_intakes": total,
        "by_channel": {s["_id"]: s["count"] for s in channel_stats if s["_id"]},
        "by_status": {s["_id"]: s["count"] for s in status_stats if s["_id"]},
        "by_type": {s["_id"]: s["count"] for s in type_stats if s["_id"]},
        "by_pillar": {s["_id"]: s["count"] for s in pillar_stats if s["_id"]}
    }


@channel_router.get("/intakes/stats")
async def get_intake_stats():
    """Get channel intake statistics for unified inbox dashboard"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Total counts
    total = await db.channel_intakes.count_documents({})
    pending = await db.channel_intakes.count_documents({"status": "pending"})
    processing = await db.channel_intakes.count_documents({"status": "processing"})
    
    # By channel (all time)
    channel_pipeline = [
        {"$group": {"_id": "$channel", "count": {"$sum": 1}}}
    ]
    channel_stats = await db.channel_intakes.aggregate(channel_pipeline).to_list(100)
    
    # By pillar (all time)
    pillar_pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}}
    ]
    pillar_stats = await db.channel_intakes.aggregate(pillar_pipeline).to_list(100)
    
    # Recent (last 24h)
    from datetime import timedelta
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    recent = await db.channel_intakes.count_documents({"created_at": {"$gte": yesterday.isoformat()}})
    
    return {
        "total": total,
        "pending": pending,
        "processing": processing,
        "recent_24h": recent,
        "by_channel": {s["_id"]: s["count"] for s in channel_stats if s["_id"]},
        "by_pillar": {s["_id"]: s["count"] for s in pillar_stats if s["_id"]}
    }


# ==================== WHATSAPP WEBHOOK ====================

class WhatsAppMessage(BaseModel):
    """WhatsApp incoming message"""
    from_number: str = Field(..., alias="from")
    message_body: str = Field(..., alias="body")
    timestamp: Optional[str] = None
    message_id: Optional[str] = None
    message_type: str = "text"  # text, image, voice, location
    media_url: Optional[str] = None
    profile_name: Optional[str] = None
    
    class Config:
        populate_by_name = True

class WhatsAppWebhookPayload(BaseModel):
    """WhatsApp webhook payload structure"""
    entry: Optional[List[Dict]] = None  # For Meta/Facebook API format
    messages: Optional[List[WhatsAppMessage]] = None  # Direct format
    raw: Optional[Dict] = None


@channel_router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    payload: Dict,
    background_tasks: BackgroundTasks
):
    """
    WhatsApp Webhook Handler
    
    Receives incoming WhatsApp messages and syncs to:
    1. Channel Intakes (unified inbox)
    2. Mira conversation thread (for AI responses)
    3. Service Desk ticket (for human concierge action)
    
    Supports both:
    - Direct webhook format (from simple providers)
    - Meta Business Platform format (from Facebook/WhatsApp API)
    """
    logger.info(f"WhatsApp webhook received: {json.dumps(payload)[:500]}")
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    import secrets
    
    # Parse incoming messages based on format
    messages = []
    
    # Handle Meta/Facebook API format
    if "entry" in payload:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                if change.get("field") == "messages":
                    value = change.get("value", {})
                    contacts = {c.get("wa_id"): c for c in value.get("contacts", [])}
                    
                    for msg in value.get("messages", []):
                        contact = contacts.get(msg.get("from"), {})
                        messages.append({
                            "from": msg.get("from"),
                            "body": msg.get("text", {}).get("body", "") if msg.get("type") == "text" else f"[{msg.get('type')} message]",
                            "timestamp": msg.get("timestamp"),
                            "message_id": msg.get("id"),
                            "message_type": msg.get("type", "text"),
                            "media_url": msg.get(msg.get("type"), {}).get("link") if msg.get("type") in ["image", "audio", "video", "document"] else None,
                            "profile_name": contact.get("profile", {}).get("name")
                        })
    
    # Handle direct format
    elif "messages" in payload:
        for msg in payload.get("messages", []):
            messages.append({
                "from": msg.get("from"),
                "body": msg.get("body", ""),
                "timestamp": msg.get("timestamp"),
                "message_id": msg.get("message_id"),
                "message_type": msg.get("message_type", "text"),
                "media_url": msg.get("media_url"),
                "profile_name": msg.get("profile_name")
            })
    
    # Handle single message format
    elif "from" in payload or "phone" in payload:
        messages.append({
            "from": payload.get("from") or payload.get("phone"),
            "body": payload.get("body") or payload.get("message", ""),
            "timestamp": payload.get("timestamp"),
            "message_id": payload.get("message_id") or payload.get("id"),
            "message_type": payload.get("type", "text"),
            "profile_name": payload.get("name") or payload.get("profile_name")
        })
    
    results = []
    
    for msg in messages:
        phone = msg.get("from", "").replace("+", "").strip()
        message_text = msg.get("body", "")
        profile_name = msg.get("profile_name", "")
        
        if not phone or not message_text:
            continue
        
        # Look up member by phone
        member = await db.users.find_one({
            "$or": [
                {"phone": phone},
                {"phone": f"+{phone}"},
                {"phone": {"$regex": phone[-10:]}}
            ]
        })
        
        # Get or create conversation thread
        thread_id = f"WA-{phone[-10:]}"
        existing_thread = await db.whatsapp_threads.find_one({"thread_id": thread_id})
        
        if existing_thread:
            # Append to existing thread
            await db.whatsapp_threads.update_one(
                {"thread_id": thread_id},
                {
                    "$push": {
                        "messages": {
                            "message_id": msg.get("message_id") or secrets.token_hex(4),
                            "from": "customer",
                            "text": message_text,
                            "timestamp": msg.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                            "type": msg.get("message_type", "text")
                        }
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "last_message": message_text[:100],
                        "unread": True
                    }
                }
            )
        else:
            # Create new thread
            await db.whatsapp_threads.insert_one({
                "thread_id": thread_id,
                "phone": phone,
                "profile_name": profile_name,
                "member_email": member.get("email") if member else None,
                "member_name": member.get("name") if member else profile_name,
                "messages": [{
                    "message_id": msg.get("message_id") or secrets.token_hex(4),
                    "from": "customer",
                    "text": message_text,
                    "timestamp": msg.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                    "type": msg.get("message_type", "text")
                }],
                "last_message": message_text[:100],
                "unread": True,
                "status": "open",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Create/update ticket linked to this thread
        ticket_id = f"WA-{secrets.token_hex(4).upper()}"
        
        # Check if there's an open ticket for this phone
        existing_ticket = await db.service_desk_tickets.find_one({
            "$or": [
                {"whatsapp_thread_id": thread_id},
                {"member.phone": phone},
                {"member.phone": f"+{phone}"}
            ],
            "status": {"$nin": ["completed", "closed", "resolved"]}
        })
        
        if existing_ticket:
            # Update existing ticket with new message
            await db.service_desk_tickets.update_one(
                {"ticket_id": existing_ticket["ticket_id"]},
                {
                    "$push": {
                        "conversation_history": {
                            "from": "customer",
                            "channel": "whatsapp",
                            "message": message_text,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "last_activity": "whatsapp_message"
                    }
                }
            )
            ticket_id = existing_ticket["ticket_id"]
            logger.info(f"Updated existing ticket {ticket_id} with WhatsApp message")
        else:
            # Create new service desk ticket
            ticket_doc = {
                "ticket_id": ticket_id,
                "title": f"[WhatsApp] Message from {profile_name or phone}",
                "description": message_text,
                "original_request": message_text,
                "member": {
                    "name": member.get("name") if member else profile_name,
                    "email": member.get("email") if member else None,
                    "phone": phone
                },
                "source": "whatsapp",
                "channel": "whatsapp",
                "whatsapp_thread_id": thread_id,
                "pillar": "general",  # Will be auto-detected or assigned
                "status": "pending",
                "priority": "medium",
                "conversation_history": [{
                    "from": "customer",
                    "channel": "whatsapp",
                    "message": message_text,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Auto-detect pillar
            message_lower = message_text.lower()
            if any(word in message_lower for word in ["cake", "treat", "bakery", "birthday"]):
                ticket_doc["pillar"] = "celebrate"
            elif any(word in message_lower for word in ["restaurant", "dine", "reservation", "table"]):
                ticket_doc["pillar"] = "dine"
            elif any(word in message_lower for word in ["stay", "hotel", "resort", "booking"]):
                ticket_doc["pillar"] = "stay"
            elif any(word in message_lower for word in ["travel", "flight", "transport"]):
                ticket_doc["pillar"] = "travel"
            elif any(word in message_lower for word in ["groom", "vet", "training", "spa"]):
                ticket_doc["pillar"] = "care"
            elif any(word in message_lower for word in ["emergency", "urgent", "sick", "hurt"]):
                ticket_doc["pillar"] = "emergency"
                ticket_doc["priority"] = "high"
            
            await db.service_desk_tickets.insert_one(ticket_doc)
            logger.info(f"Created new ticket {ticket_id} from WhatsApp message")
        
        # Also add to channel_intakes for unified inbox
        intake_id = f"TDC-WAT-{secrets.token_hex(4).upper()}"
        await db.channel_intakes.insert_one({
            "request_id": intake_id,
            "channel": "whatsapp",
            "request_type": "inquiry",
            "customer": {
                "name": member.get("name") if member else profile_name,
                "email": member.get("email") if member else None,
                "phone": phone
            },
            "message": message_text,
            "ticket_id": ticket_id,
            "whatsapp_thread_id": thread_id,
            "pillar": ticket_doc.get("pillar", "general") if not existing_ticket else existing_ticket.get("pillar", "general"),
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        results.append({
            "phone": phone,
            "thread_id": thread_id,
            "ticket_id": ticket_id,
            "is_new_thread": not existing_thread,
            "is_new_ticket": not existing_ticket
        })
    
    return {
        "success": True,
        "messages_processed": len(results),
        "results": results
    }


@channel_router.get("/whatsapp/threads")
async def get_whatsapp_threads(
    status: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 50
):
    """Get WhatsApp conversation threads (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if status:
        query["status"] = status
    if unread_only:
        query["unread"] = True
    
    threads = await db.whatsapp_threads.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit).to_list(limit)
    
    return {"threads": threads, "count": len(threads)}


@channel_router.get("/whatsapp/threads/{thread_id}")
async def get_whatsapp_thread(thread_id: str):
    """Get a specific WhatsApp conversation thread"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    thread = await db.whatsapp_threads.find_one({"thread_id": thread_id}, {"_id": 0})
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Mark as read
    await db.whatsapp_threads.update_one(
        {"thread_id": thread_id},
        {"$set": {"unread": False}}
    )
    
    # Get linked ticket
    ticket = await db.service_desk_tickets.find_one(
        {"whatsapp_thread_id": thread_id},
        {"_id": 0}
    )
    
    return {
        "thread": thread,
        "ticket": ticket
    }


@channel_router.post("/whatsapp/threads/{thread_id}/reply")
async def reply_to_whatsapp_thread(thread_id: str, message: str, send_to_customer: bool = True):
    """Reply to a WhatsApp thread (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    import secrets
    
    thread = await db.whatsapp_threads.find_one({"thread_id": thread_id})
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Add reply to thread
    reply_entry = {
        "message_id": secrets.token_hex(4),
        "from": "concierge",
        "text": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "text"
    }
    
    await db.whatsapp_threads.update_one(
        {"thread_id": thread_id},
        {
            "$push": {"messages": reply_entry},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Also add to linked ticket's conversation history
    await db.service_desk_tickets.update_one(
        {"whatsapp_thread_id": thread_id},
        {
            "$push": {
                "conversation_history": {
                    "from": "concierge",
                    "channel": "whatsapp",
                    "message": message,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "last_activity": "concierge_reply"
            }
        }
    )
    
    # TODO: Integrate with actual WhatsApp Business API to send message
    # For now, we just record the reply
    
    return {
        "success": True,
        "thread_id": thread_id,
        "message": "Reply recorded",
        "note": "WhatsApp Business API integration required to send to customer"
    }
