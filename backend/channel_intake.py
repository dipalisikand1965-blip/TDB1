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

async def transcribe_voice(audio_file: UploadFile) -> VoiceTranscription:
    """Transcribe voice audio using OpenAI Whisper"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Voice transcription not configured")
    
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        # Initialize Whisper
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.split('.')[-1]}") as tmp:
            content = await audio_file.read()
            tmp.write(content)
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
        
        # Extract transcription data
        transcription = VoiceTranscription(
            text=response.text,
            language=getattr(response, 'language', 'en'),
            duration_seconds=getattr(response, 'duration', None),
            segments=[
                {"start": s.start, "end": s.end, "text": s.text}
                for s in getattr(response, 'segments', [])
            ] if hasattr(response, 'segments') else None
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
        from emergentintegrations.llm.openai import OpenAIChat, OpenAIModels
        
        chat = OpenAIChat(
            api_key=EMERGENT_LLM_KEY,
            model=OpenAIModels.GPT_4O_MINI  # Use smaller model for extraction
        )
        
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
        
        response = await chat.send_message(extraction_prompt)
        
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
            ticket_doc = {
                "ticket_id": ticket_id,
                "title": f"[{request.channel.upper()}] {request.request_type.title()} Request - {customer_name}",
                "description": f"**Channel:** {request.channel}\n**Message:**\n{request.message}\n\n**Extracted Data:** {json.dumps(extracted_data, indent=2) if extracted_data else 'None'}",
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": request.customer_phone,
                "source": f"channel_intake_{request.channel}",
                "source_id": request_id,
                "pillar": detected_pillar,
                "suggested_pillar": detected_pillar,
                "category": "channel_order",
                "status": "open",
                "priority": "normal",
                "assigned_to": None,
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
            await db.service_desk_tickets.insert_one(ticket_doc)
            
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
    
    Accepts audio files: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25MB)
    """
    # Validate file type
    allowed_types = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]
    file_ext = audio.filename.split(".")[-1].lower() if audio.filename else ""
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid audio format. Supported: {', '.join(allowed_types)}"
        )
    
    # Check file size (25MB limit)
    content = await audio.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large. Maximum 25MB.")
    
    # Reset file position for transcription
    await audio.seek(0)
    
    # Transcribe voice
    transcription = await transcribe_voice(audio)
    
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
    
    intakes = await db.channel_intakes.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"intakes": intakes, "count": len(intakes)}


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
    
    total = sum(s["count"] for s in channel_stats)
    
    return {
        "period_days": days,
        "total_intakes": total,
        "by_channel": {s["_id"]: s["count"] for s in channel_stats},
        "by_status": {s["_id"]: s["count"] for s in status_stats},
        "by_type": {s["_id"]: s["count"] for s in type_stats}
    }
