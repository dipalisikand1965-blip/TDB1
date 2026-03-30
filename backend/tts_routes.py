"""
tts_routes.py - Text-to-Speech routes using ElevenLabs

Features:
- Natural Indian female voice for Mira
- Pronunciation fix for "Mira" -> "Meera" (mee-rah)
- Emoji handling (removes/converts emojis to avoid robotic pronunciation)
- Streaming support for faster response
"""

import os
import re
import io
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

logger = logging.getLogger(__name__)

tts_router = APIRouter(prefix="/tts", tags=["tts"])

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# Voice IDs - using Eloise (premade ElevenLabs voice) — confirmed working AZnzlk1XvdvUeBnXmlld
MIRA_VOICE_ID = os.environ.get("MIRA_VOICE_ID", "AZnzlk1XvdvUeBnXmlld")  # Elise — replaces retired Eloise (AZnzlk1XvdvUeBnXmlld)

# E024: Voice Personality Profiles — all using Eloise for consistent Mira voice
VOICE_PERSONALITIES = {
    "default": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",  # Eloise
        "name": "Mira (Default)",
        "description": "Warm and engaging",
        "stability": 0.5,
        "similarity_boost": 0.75
    },
    "celebration": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Joyful)",
        "description": "Excited and celebratory tone for birthdays and milestones",
        "stability": 0.5,
        "similarity_boost": 0.8
    },
    "health": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Caring)",
        "description": "Calm and reassuring voice for health reminders",
        "stability": 0.85,
        "similarity_boost": 0.7
    },
    "comfort": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Gentle)",
        "description": "Soft and empathetic voice for emotional moments",
        "stability": 0.9,
        "similarity_boost": 0.65
    },
    "urgent": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Alert)",
        "description": "Clear and attention-grabbing for urgent matters",
        "stability": 0.6,
        "similarity_boost": 0.85
    },
    "adventure": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Adventurous)",
        "description": "Upbeat and encouraging for travel and exploration",
        "stability": 0.55,
        "similarity_boost": 0.8
    },
    "caring": {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Mira (Professional)",
        "description": "Warm and professional for grooming and care",
        "stability": 0.75,
        "similarity_boost": 0.75
    },
    "informative": {
        "voice_id": "XB0fDUnXU5powFXDhCwa",  # Charlotte - British
        "name": "Mira (Knowledgeable)",
        "description": "Helpful and clear for food and nutrition guidance",
        "stability": 0.8,
        "similarity_boost": 0.7
    }
}

# Emoji to word mapping for natural speech
EMOJI_REPLACEMENTS = {
    "🐾": " paw print ",
    "🐕": " dog ",
    "🐶": " puppy ",
    "🎂": " birthday cake ",
    "🎉": " celebration ",
    "🎁": " gift ",
    "❤️": " love ",
    "💜": " heart ",
    "💝": " love ",
    "✨": "",
    "🌟": "",
    "⭐": "",
    "😊": "",
    "😍": "",
    "🥳": "",
    "👋": "",
    "💪": "",
    "🏆": "",
    "🔥": "",
    "💯": "",
    "🙌": "",
    "👏": "",
    "🎊": "",
    "🍰": " cake ",
    "🦴": " bone ",
    "💊": " medicine ",
    "🏥": " hospital ",
    "🚗": " car ",
    "✈️": " plane ",
    "🏠": " home ",
    "📱": " phone ",
    "💬": "",
    "📦": " package ",
    "🛒": " cart ",
    "💰": " money ",
}

# Pronunciation fixes
PRONUNCIATION_FIXES = {
    r'\bMira\b': 'Meera',  # Mira -> Meera
    r'\bTDB\b': 'T D B',   # TDB -> T D B (spell out)
    r'\bPawsome\b': 'Paw-some',  # Better pronunciation
    r'\bpup\b': 'pup',     # Keep as is
    r'₹': ' rupees ',      # Currency
    r'\bSr\.': 'Senior',   # Abbreviations
    r'\bJr\.': 'Junior',
    r'®': '',              # Remove registered trademark symbol
    r'™': '',              # Remove trademark symbol
    r'©': '',              # Remove copyright symbol
    r'Concierge®': 'Concierge',  # Remove ® from brand names
    r'Elevated Concierge®': 'Elevated Concierge',
}


def clean_text_for_speech(text: str) -> str:
    """
    Clean text for natural speech synthesis:
    - Remove/replace emojis
    - Fix pronunciations
    - Handle special characters
    """
    # Replace known emojis with words or remove them
    for emoji, replacement in EMOJI_REPLACEMENTS.items():
        text = text.replace(emoji, replacement)
    
    # Remove any remaining emojis (using unicode ranges)
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub('', text)
    
    # Apply pronunciation fixes
    for pattern, replacement in PRONUNCIATION_FIXES.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    personality: Optional[str] = None  # E024: Voice personality (default, celebration, health, comfort, urgent)
    stability: float = 0.7
    similarity_boost: float = 0.75


class TTSResponse(BaseModel):
    audio_base64: str
    text_spoken: str
    voice_id: str
    personality: Optional[str] = None


# E024: Get voice personalities endpoint
@tts_router.get("/personalities")
async def get_voice_personalities():
    """
    Get available voice personalities for different contexts.
    E024 Feature: Voice Personality Selection
    """
    return {
        "success": True,
        "personalities": VOICE_PERSONALITIES,
        "default": "default"
    }


@tts_router.post("/generate", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """
    Generate text-to-speech audio using ElevenLabs (primary) or OpenAI (fallback)
    Returns base64-encoded audio
    Supports E024 voice personalities
    """
    # Clean the text for natural speech
    cleaned_text = clean_text_for_speech(request.text)
    
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Text is empty after cleaning")
    
    # E024: Get voice personality settings
    personality_key = request.personality or "default"
    personality = VOICE_PERSONALITIES.get(personality_key, VOICE_PERSONALITIES["default"])
    
    # Try ElevenLabs first
    if ELEVENLABS_API_KEY:
        try:
            from elevenlabs import ElevenLabs
            from elevenlabs.types import VoiceSettings
            
            # Initialize client
            client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            
            # Use personality settings or override with explicit values
            voice_id = request.voice_id or personality.get("voice_id", MIRA_VOICE_ID)
            stability = request.stability if request.stability != 0.7 else personality.get("stability", 0.7)
            similarity_boost = request.similarity_boost if request.similarity_boost != 0.75 else personality.get("similarity_boost", 0.75)
            
            # Generate audio
            voice_settings = VoiceSettings(
                stability=stability,
                similarity_boost=similarity_boost,
                style=0.0,
                use_speaker_boost=True
            )
            
            audio_generator = client.text_to_speech.convert(
                text=cleaned_text,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",
                voice_settings=voice_settings
            )
            
            # Collect audio data
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            
            # Convert to base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            return TTSResponse(
                audio_base64=audio_b64,
                text_spoken=cleaned_text,
                voice_id=voice_id,
                personality=personality_key
            )
            
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"ElevenLabs TTS failed, trying OpenAI fallback: {error_msg}")
            # Continue to OpenAI fallback
    
    # OpenAI TTS Fallback - Beautiful British-style voice
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
    if EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.openai import OpenAITextToSpeech
            
            tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
            
            # Map personalities to OpenAI voices
            # shimmer = bright, cheerful (like Eloise)
            # nova = energetic, warm
            openai_voice_map = {
                "default": "shimmer",      # Bright, cheerful - like Eloise
                "celebration": "nova",     # Energetic for celebrations
                "health": "shimmer",       # Calm, clear
                "comfort": "shimmer",      # Gentle
                "urgent": "nova",          # Alert
                "adventure": "nova",       # Upbeat
                "caring": "shimmer",       # Professional
                "informative": "shimmer"   # Clear
            }
            
            openai_voice = openai_voice_map.get(personality_key, "shimmer")
            
            # Generate speech with OpenAI - use HD model for quality
            audio_bytes = await tts.generate_speech(
                text=cleaned_text,
                model="tts-1-hd",  # High quality
                voice=openai_voice,
                speed=1.0,
                response_format="mp3"
            )
            
            # Convert to base64
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            logger.info(f"OpenAI TTS generated successfully with voice: {openai_voice}")
            
            return TTSResponse(
                audio_base64=audio_b64,
                text_spoken=cleaned_text,
                voice_id=f"openai-{openai_voice}",
                personality=personality_key
            )
            
        except Exception as e:
            logger.error(f"OpenAI TTS also failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Both TTS providers failed. ElevenLabs quota may be exceeded. Error: {str(e)}")
    
    raise HTTPException(
        status_code=503, 
        detail="No TTS provider available. Please configure ELEVENLABS_API_KEY or EMERGENT_LLM_KEY."
    )


@tts_router.get("/voices")
async def list_voices():
    """List available voices from ElevenLabs"""
    if not ELEVENLABS_API_KEY:
        return {
            "configured": False,
            "message": "ElevenLabs API key not configured",
            "default_voice_id": MIRA_VOICE_ID
        }
    
    try:
        from elevenlabs import ElevenLabs
        
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        voices_response = client.voices.get_all()
        
        voices = []
        for voice in voices_response.voices:
            voices.append({
                "voice_id": voice.voice_id,
                "name": voice.name,
                "category": voice.category,
                "labels": voice.labels
            })
        
        return {
            "configured": True,
            "voices": voices,
            "default_voice_id": MIRA_VOICE_ID
        }
        
    except Exception as e:
        logger.error(f"Failed to list voices: {str(e)}")
        return {
            "configured": True,
            "error": str(e),
            "default_voice_id": MIRA_VOICE_ID
        }


@tts_router.get("/config")
async def get_tts_config():
    """Get TTS configuration status"""
    return {
        "provider": "elevenlabs",
        "configured": bool(ELEVENLABS_API_KEY),
        "default_voice_id": MIRA_VOICE_ID,
        "pronunciation_fixes": list(PRONUNCIATION_FIXES.keys()),
        "features": [
            "Natural Indian female voice",
            "Mira pronounced as Meera",
            "Emoji handling",
            "Multi-language support"
        ]
    }
