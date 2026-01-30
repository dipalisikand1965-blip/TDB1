"""
Voice Quick Actions Engine
Process voice commands and execute booking/ordering actions
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import logging
import os
import json
import tempfile
import re

router = APIRouter(prefix="/api/voice-actions", tags=["voice-actions"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

def get_db():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

logger = logging.getLogger(__name__)

# Try to import OpenAI for Whisper and GPT
try:
    from emergentintegrations.llm.openai import chat, transcribe_audio
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI integration not available for voice actions")

# Action patterns for intent detection
ACTION_PATTERNS = {
    "book_grooming": {
        "patterns": [
            r"book.*groom", r"schedule.*groom", r"grooming.*appointment",
            r"haircut.*dog", r"bath.*pet", r"groom.*tomorrow", r"groom.*next"
        ],
        "service_type": "grooming",
        "pillar": "care",
        "response_template": "I'll help you book a grooming session{for_pet}{on_date}."
    },
    "book_vet": {
        "patterns": [
            r"book.*vet", r"schedule.*vet", r"vet.*appointment", r"vet.*visit",
            r"doctor.*appointment", r"checkup", r"health.*check"
        ],
        "service_type": "vet_coordination",
        "pillar": "care",
        "response_template": "I'll help you schedule a vet appointment{for_pet}{on_date}."
    },
    "book_walk": {
        "patterns": [
            r"book.*walk", r"schedule.*walk", r"dog.*walk", r"find.*walker",
            r"need.*walker", r"walking.*service"
        ],
        "service_type": "walks",
        "pillar": "care",
        "response_template": "I'll find a dog walker{for_pet}{on_date}."
    },
    "book_training": {
        "patterns": [
            r"book.*train", r"schedule.*train", r"training.*session",
            r"obedience.*class", r"puppy.*class", r"behavior.*help"
        ],
        "service_type": "training",
        "pillar": "care",
        "response_template": "I'll help you book a training session{for_pet}."
    },
    "order_food": {
        "patterns": [
            r"order.*food", r"buy.*food", r"need.*food", r"reorder.*food",
            r"dog.*food", r"pet.*food", r"more.*kibble", r"treats"
        ],
        "service_type": "order",
        "pillar": "dine",
        "response_template": "I'll help you order pet food. What type would you like?"
    },
    "plan_celebration": {
        "patterns": [
            r"plan.*birthday", r"birthday.*party", r"celebrate.*birthday",
            r"gotcha.*day", r"celebration", r"party.*dog"
        ],
        "service_type": "celebration",
        "pillar": "celebrate",
        "response_template": "I'll help you plan a celebration{for_pet}! When is the special day?"
    },
    "check_vaccinations": {
        "patterns": [
            r"vaccination", r"vaccine", r"shots.*due", r"immunization",
            r"when.*vaccine", r"next.*shot"
        ],
        "service_type": "health_check",
        "pillar": "care",
        "response_template": "Let me check the vaccination schedule{for_pet}."
    },
    "nutrition_advice": {
        "patterns": [
            r"nutrition", r"diet.*advice", r"food.*recommend", r"what.*feed",
            r"healthy.*food", r"weight.*advice", r"meal.*plan"
        ],
        "service_type": "nutrition",
        "pillar": "care",
        "response_template": "I can provide nutrition recommendations{for_pet}."
    },
    "book_stay": {
        "patterns": [
            r"book.*hotel", r"pet.*hotel", r"boarding", r"book.*stay",
            r"where.*stay", r"vacation.*pet", r"travel.*with"
        ],
        "service_type": "booking",
        "pillar": "stay",
        "response_template": "I'll help you find pet-friendly accommodation{on_date}."
    },
    "emergency": {
        "patterns": [
            r"emergency", r"urgent.*help", r"sick.*dog", r"injured",
            r"need.*vet.*now", r"help.*pet"
        ],
        "service_type": "emergency",
        "pillar": "care",
        "response_template": "I understand this is urgent. Let me connect you with emergency services immediately."
    }
}

# Date extraction patterns
DATE_PATTERNS = {
    "today": timedelta(days=0),
    "tomorrow": timedelta(days=1),
    "day after tomorrow": timedelta(days=2),
    "next week": timedelta(days=7),
    "this weekend": None,  # Special handling
    "monday": None,
    "tuesday": None,
    "wednesday": None,
    "thursday": None,
    "friday": None,
    "saturday": None,
    "sunday": None,
}


def detect_intent(text: str) -> Dict[str, Any]:
    """Detect action intent from text"""
    text_lower = text.lower()
    
    for action_name, config in ACTION_PATTERNS.items():
        for pattern in config["patterns"]:
            if re.search(pattern, text_lower):
                return {
                    "action": action_name,
                    "service_type": config["service_type"],
                    "pillar": config["pillar"],
                    "confidence": 0.85,
                    "response_template": config["response_template"]
                }
    
    return {
        "action": "general_query",
        "service_type": None,
        "pillar": None,
        "confidence": 0.5,
        "response_template": "I understand you need help. Let me assist you."
    }


def extract_date(text: str) -> Optional[datetime]:
    """Extract date from text"""
    text_lower = text.lower()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check for specific patterns
    if "today" in text_lower:
        return today
    elif "tomorrow" in text_lower:
        return today + timedelta(days=1)
    elif "day after tomorrow" in text_lower:
        return today + timedelta(days=2)
    elif "next week" in text_lower:
        return today + timedelta(days=7)
    elif "this weekend" in text_lower:
        # Find next Saturday
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        return today + timedelta(days=days_until_saturday)
    
    # Check for day names
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(days):
        if day in text_lower:
            current_day = today.weekday()
            days_ahead = i - current_day
            if days_ahead <= 0:
                days_ahead += 7
            return today + timedelta(days=days_ahead)
    
    return None


def extract_pet_name(text: str, user_pets: list) -> Optional[str]:
    """Extract pet name from text if mentioned"""
    text_lower = text.lower()
    
    for pet in user_pets:
        pet_name = pet.get("name", "").lower()
        if pet_name and pet_name in text_lower:
            return pet.get("name")
    
    return None


@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """Transcribe voice audio to text"""
    if not OPENAI_AVAILABLE:
        raise HTTPException(status_code=503, detail="Voice transcription service not available")
    
    # Validate file type
    allowed_types = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"]
    file_ext = audio.filename.split(".")[-1].lower() if audio.filename else ""
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio format. Supported: {', '.join(allowed_types)}"
        )
    
    # Read audio content
    content = await audio.read()
    
    if len(content) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="Audio file too large. Maximum 25MB.")
    
    # Save to temp file and transcribe
    try:
        with tempfile.NamedTemporaryFile(suffix=f".{file_ext}", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Use emergentintegrations transcribe
        transcription = await transcribe_audio(
            audio_file_path=tmp_path,
            model="whisper-1"
        )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return {
            "text": transcription,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/process")
async def process_voice_command(
    text: str,
    user_id: Optional[str] = None,
    pet_id: Optional[str] = None
):
    """
    Process a voice command text and determine action
    Returns structured action data for frontend to execute
    """
    db = get_db()
    
    # Get user's pets if user_id provided
    user_pets = []
    if user_id:
        user_pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    
    # Detect intent
    intent = detect_intent(text)
    
    # Extract date if mentioned
    extracted_date = extract_date(text)
    
    # Extract pet name if mentioned
    mentioned_pet = extract_pet_name(text, user_pets)
    
    # Build response
    response_parts = {
        "for_pet": f" for {mentioned_pet}" if mentioned_pet else "",
        "on_date": f" on {extracted_date.strftime('%A, %B %d')}" if extracted_date else ""
    }
    
    response_text = intent["response_template"].format(**response_parts)
    
    # Build action payload
    action_payload = {
        "action": intent["action"],
        "service_type": intent["service_type"],
        "pillar": intent["pillar"],
        "confidence": intent["confidence"],
        "extracted_data": {
            "date": extracted_date.isoformat() if extracted_date else None,
            "pet_name": mentioned_pet,
            "pet_id": pet_id or (user_pets[0]["id"] if user_pets and not mentioned_pet else None),
            "original_text": text
        },
        "response_text": response_text,
        "suggested_actions": []
    }
    
    # Add suggested follow-up actions based on intent
    if intent["action"] == "book_grooming":
        action_payload["suggested_actions"] = [
            {"label": "Book Now", "action": "navigate", "target": f"/care?type=grooming&pet={action_payload['extracted_data']['pet_id'] or ''}"},
            {"label": "View Prices", "action": "navigate", "target": "/care?type=grooming#products"},
            {"label": "Talk to Concierge", "action": "open_chat", "message": f"I want to book grooming{response_parts['for_pet']}{response_parts['on_date']}"}
        ]
    elif intent["action"] == "book_vet":
        action_payload["suggested_actions"] = [
            {"label": "Find Vet", "action": "navigate", "target": "/care?type=vet_coordination"},
            {"label": "Schedule Visit", "action": "open_chat", "message": f"Help me schedule a vet visit{response_parts['for_pet']}"},
        ]
    elif intent["action"] == "order_food":
        action_payload["suggested_actions"] = [
            {"label": "Shop Food", "action": "navigate", "target": "/dine"},
            {"label": "Reorder Last", "action": "navigate", "target": "/orders?reorder=true"},
            {"label": "Get Recommendations", "action": "open_chat", "message": "What food do you recommend for my pet?"}
        ]
    elif intent["action"] == "plan_celebration":
        action_payload["suggested_actions"] = [
            {"label": "Plan Party", "action": "navigate", "target": f"/celebrate?pet={action_payload['extracted_data']['pet_id'] or ''}"},
            {"label": "Order Cake", "action": "navigate", "target": "/celebrate/cakes"},
            {"label": "Browse Ideas", "action": "open_chat", "message": "Give me birthday party ideas for my dog"}
        ]
    elif intent["action"] == "emergency":
        action_payload["suggested_actions"] = [
            {"label": "🚨 Emergency Vet", "action": "navigate", "target": "/care?type=emergency", "urgent": True},
            {"label": "Call Helpline", "action": "call", "target": "+919876543210"},
        ]
        action_payload["is_urgent"] = True
    else:
        action_payload["suggested_actions"] = [
            {"label": "Continue Chat", "action": "open_chat", "message": text}
        ]
    
    # Log the voice action for analytics
    try:
        await db.voice_actions_log.insert_one({
            "user_id": user_id,
            "text": text,
            "intent": intent["action"],
            "confidence": intent["confidence"],
            "extracted_date": extracted_date.isoformat() if extracted_date else None,
            "pet_name": mentioned_pet,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except:
        pass  # Non-critical
    
    return action_payload


@router.get("/suggestions")
async def get_voice_suggestions(pet_id: Optional[str] = None):
    """Get contextual voice command suggestions"""
    db = get_db()
    
    suggestions = [
        {"phrase": "Book grooming for tomorrow", "icon": "✂️", "category": "care"},
        {"phrase": "Schedule a vet appointment", "icon": "🏥", "category": "care"},
        {"phrase": "Order more dog food", "icon": "🍖", "category": "dine"},
        {"phrase": "Find a dog walker for this weekend", "icon": "🐕", "category": "care"},
        {"phrase": "Plan a birthday celebration", "icon": "🎂", "category": "celebrate"},
        {"phrase": "Check vaccination schedule", "icon": "💉", "category": "care"},
        {"phrase": "Book a training session", "icon": "🎓", "category": "care"},
        {"phrase": "Get nutrition advice", "icon": "🥗", "category": "care"},
    ]
    
    # Add pet-specific suggestions if pet_id provided
    if pet_id:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if pet:
            pet_name = pet.get("name", "my pet")
            suggestions = [
                {"phrase": f"Book grooming for {pet_name}", "icon": "✂️", "category": "care"},
                {"phrase": f"Schedule vet visit for {pet_name}", "icon": "🏥", "category": "care"},
                {"phrase": f"Order food for {pet_name}", "icon": "🍖", "category": "dine"},
                {"phrase": f"Find walker for {pet_name}", "icon": "🐕", "category": "care"},
            ] + suggestions[4:]  # Keep generic suggestions too
    
    return {"suggestions": suggestions}
