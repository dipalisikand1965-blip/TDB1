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

# Voice IDs - using Elise (Warm, Natural and Engaging) for Mira
MIRA_VOICE_ID = os.environ.get("MIRA_VOICE_ID", "EST9Ui6982FZPSi7gCHi")  # Elise - warm, natural, engaging female voice

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
    stability: float = 0.7
    similarity_boost: float = 0.75


class TTSResponse(BaseModel):
    audio_base64: str
    text_spoken: str
    voice_id: str


@tts_router.post("/generate", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """
    Generate text-to-speech audio using ElevenLabs
    Returns base64-encoded audio
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in environment."
        )
    
    try:
        from elevenlabs import ElevenLabs
        from elevenlabs.types import VoiceSettings
        
        # Initialize client
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        
        # Clean the text for natural speech
        cleaned_text = clean_text_for_speech(request.text)
        
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="Text is empty after cleaning")
        
        # Use Mira's voice or the provided voice_id
        voice_id = request.voice_id or MIRA_VOICE_ID
        
        # Generate audio
        voice_settings = VoiceSettings(
            stability=request.stability,
            similarity_boost=request.similarity_boost,
            style=0.0,
            use_speaker_boost=True
        )
        
        audio_generator = client.text_to_speech.convert(
            text=cleaned_text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",  # Better for Indian accent
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
            voice_id=voice_id
        )
        
    except ImportError:
        raise HTTPException(status_code=503, detail="ElevenLabs library not installed")
    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


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
