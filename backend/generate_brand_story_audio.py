"""
Generate Brand Story Voiceover Audio Files
Uses ElevenLabs TTS to create audio files for the Brand Story video clips
"""

import os
import asyncio
from pathlib import Path

# Brand Story clips with voiceover text
BRAND_STORY_CLIPS = [
    {
        "id": 1,
        "filename": "01_voice.mp3",
        "text": "Look into their eyes... You already know."
    },
    {
        "id": 2,
        "filename": "02_voice.mp3",
        "text": "They're not just pets. They're family."
    },
    {
        "id": 3,
        "filename": "03_voice.mp3",
        "text": "Every wag. Every purr. Every moment matters."
    },
    {
        "id": 4,
        "filename": "04_voice.mp3",
        "text": "That's why we built Pet Soul. To nurture what matters most."
    },
]

# Warm, emotional voice for the Brand Story
BRAND_STORY_VOICE_ID = os.environ.get("BRAND_STORY_VOICE_ID", "pFZP5JQG7iQjIQuC4Bku")  # Lily - warm, storytelling voice

def generate_audio():
    """Generate audio files for brand story clips"""
    from elevenlabs import ElevenLabs
    from elevenlabs.types import VoiceSettings
    
    ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
    if not ELEVENLABS_API_KEY:
        print("ERROR: ELEVENLABS_API_KEY not set")
        return
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    # Output directory
    output_dir = Path("/app/frontend/public/audio/brand_story")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Voice settings for emotional, warm narration
    voice_settings = VoiceSettings(
        stability=0.65,  # Slightly lower for more emotion
        similarity_boost=0.75,
        style=0.4,  # More expressive
        use_speaker_boost=True
    )
    
    for clip in BRAND_STORY_CLIPS:
        print(f"Generating audio for clip {clip['id']}: {clip['text'][:30]}...")
        
        try:
            audio_generator = client.text_to_speech.convert(
                text=clip['text'],
                voice_id=BRAND_STORY_VOICE_ID,
                model_id="eleven_multilingual_v2",
                voice_settings=voice_settings
            )
            
            # Collect audio data
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            
            # Save to file
            output_path = output_dir / clip['filename']
            with open(output_path, 'wb') as f:
                f.write(audio_data)
            
            print(f"  ✓ Saved: {output_path} ({len(audio_data)} bytes)")
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print("\nDone! Audio files saved to:", output_dir)

if __name__ == "__main__":
    generate_audio()
