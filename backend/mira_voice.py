"""
Mira Voice Output - ElevenLabs TTS with OpenAI Backup
Gives Mira a warm, British-accented voice
"""

import os
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/voice", tags=["mira-voice"])

# ElevenLabs Configuration
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# British female voices (warm, friendly):
# - "pFZP5JQG7iQjIQuC4Bku" - Lily (British, warm, narration)
# - "Xb7hH8MSUJpSbSDYk0k2" - Alice (British, confident, news)
# - "5TRppDPuxBF23owe37hG" - Articulate British Female
# - "ptBd2v6mebIps3ZQEXD7" - Adela (Neutral British Female)
VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"  # Lily - British, warm, narration style (closest to Eloise)

# OpenAI TTS Configuration (backup)
OPENAI_API_KEY = os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = VOICE_ID
    stability: float = 0.5
    similarity_boost: float = 0.8
    style: float = 0.5
    speed: float = 1.0
    use_openai_backup: bool = False  # Set to True to force OpenAI TTS

class TTSResponse(BaseModel):
    audio_base64: str
    text: str
    voice_id: str
    format: str = "mp3"
    provider: str = "elevenlabs"

def get_eleven_client():
    """Get ElevenLabs client"""
    if not ELEVENLABS_API_KEY:
        return None
    try:
        from elevenlabs import ElevenLabs
        return ElevenLabs(api_key=ELEVENLABS_API_KEY)
    except Exception as e:
        logger.warning(f"[VOICE] ElevenLabs client init failed: {e}")
        return None

async def generate_with_openai(text: str) -> Optional[bytes]:
    """Generate speech using OpenAI TTS as backup"""
    if not OPENAI_API_KEY:
        return None
    
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": "nova",  # Nova has a warm, friendly tone
                    "response_format": "mp3"
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.content
            else:
                logger.warning(f"[VOICE] OpenAI TTS failed: {response.status_code}")
                return None
                
    except Exception as e:
        logger.warning(f"[VOICE] OpenAI TTS error: {e}")
        return None

@router.post("/speak", response_model=TTSResponse)
async def generate_speech(request: TTSRequest):
    """
    Convert text to speech using ElevenLabs (primary) or OpenAI (backup)
    Returns audio as base64 encoded MP3
    """
    provider = "elevenlabs"
    audio_data = None
    
    # Try ElevenLabs first (unless OpenAI backup is forced)
    if not request.use_openai_backup:
        try:
            client = get_eleven_client()
            if client:
                from elevenlabs import VoiceSettings
                
                # Voice settings for warm, conversational British tone
                voice_settings = VoiceSettings(
                    stability=request.stability,
                    similarity_boost=request.similarity_boost,
                    style=request.style,
                    use_speaker_boost=True
                )
                
                # Generate audio with ElevenLabs
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
                    
                logger.info(f"[VOICE] ElevenLabs generated speech for {len(request.text)} chars")
                
        except Exception as e:
            logger.warning(f"[VOICE] ElevenLabs failed, trying OpenAI backup: {e}")
            audio_data = None
    
    # Fallback to OpenAI TTS
    if audio_data is None:
        logger.info("[VOICE] Using OpenAI TTS backup")
        audio_data = await generate_with_openai(request.text)
        provider = "openai"
        
        if audio_data is None:
            raise HTTPException(status_code=500, detail="Both ElevenLabs and OpenAI TTS failed")
    
    # Convert to base64
    audio_b64 = base64.b64encode(audio_data).decode('utf-8')
    
    return TTSResponse(
        audio_base64=audio_b64,
        text=request.text,
        voice_id=request.voice_id or VOICE_ID,
        format="mp3",
        provider=provider
    )

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
