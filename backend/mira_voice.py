"""
Mira Voice Output - ElevenLabs TTS Integration
Gives Mira a warm, personalized voice using ElevenLabs "Eloise"
"""

import os
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from elevenlabs import ElevenLabs, VoiceSettings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/voice", tags=["mira-voice"])

# ElevenLabs Configuration
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel - warm, friendly female voice (similar to Eloise)

# Alternative voices to try:
# - "EXAVITQu4vr4xnSDxMaL" - Bella (warm)
# - "pNInz6obpgDQGcFmaJgB" - Adam (male)
# - "yoZ06aMxZJJ28mfd3POQ" - Sam (narrative)

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = VOICE_ID
    stability: float = 0.5
    similarity_boost: float = 0.8
    style: float = 0.5
    speed: float = 1.0

class TTSResponse(BaseModel):
    audio_base64: str
    text: str
    voice_id: str
    format: str = "mp3"

def get_eleven_client():
    """Get ElevenLabs client"""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)

@router.post("/speak", response_model=TTSResponse)
async def generate_speech(request: TTSRequest):
    """
    Convert text to speech using ElevenLabs
    Returns audio as base64 encoded MP3
    """
    try:
        client = get_eleven_client()
        
        # Voice settings for warm, conversational tone
        voice_settings = VoiceSettings(
            stability=request.stability,
            similarity_boost=request.similarity_boost,
            style=request.style,
            use_speaker_boost=True
        )
        
        # Generate audio
        audio_generator = client.text_to_speech.convert(
            text=request.text,
            voice_id=request.voice_id or VOICE_ID,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        # Collect audio chunks
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Convert to base64
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        logger.info(f"[VOICE] Generated speech for {len(request.text)} chars")
        
        return TTSResponse(
            audio_base64=audio_b64,
            text=request.text,
            voice_id=request.voice_id or VOICE_ID,
            format="mp3"
        )
        
    except Exception as e:
        logger.error(f"[VOICE] TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice generation failed: {str(e)}")

@router.get("/voices")
async def list_voices():
    """List available ElevenLabs voices"""
    try:
        client = get_eleven_client()
        voices_response = client.voices.get_all()
        
        voices = []
        for voice in voices_response.voices:
            voices.append({
                "voice_id": voice.voice_id,
                "name": voice.name,
                "category": voice.category,
                "description": voice.description
            })
        
        return {"voices": voices, "count": len(voices)}
        
    except Exception as e:
        logger.error(f"[VOICE] Failed to list voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_voice():
    """Quick test of voice output"""
    try:
        client = get_eleven_client()
        
        test_text = "Hello! I'm Mira, your pet life companion. How can I help you and Buddy today?"
        
        audio_generator = client.text_to_speech.convert(
            text=test_text,
            voice_id=VOICE_ID,
            model_id="eleven_multilingual_v2"
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        return {
            "status": "success",
            "message": "Voice test successful",
            "audio_base64": audio_b64,
            "text": test_text
        }
        
    except Exception as e:
        logger.error(f"[VOICE] Test failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
