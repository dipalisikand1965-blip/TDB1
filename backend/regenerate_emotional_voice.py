#!/usr/bin/env python3
"""
Regenerate brand story voiceovers with MORE emotion using ElevenLabs
"""
import os
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ELEVENLABS_API_KEY = "2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc"
AUDIO_DIR = "/app/frontend/public/videos/brand_story/audio"

# More emotional voice - Charlotte is very expressive
EMOTIONAL_VOICE = "XB0fDUnXU5powFXDhCwa"  # Charlotte - emotional, warm

# More emotional scripts with pauses for impact
EMOTIONAL_SCRIPTS = [
    {
        "filename": "01_eyes_bright.mp3",
        "script": "Look into their eyes... and you already know.",
        "emotion": "tender, loving, like speaking to a dear friend"
    },
    {
        "filename": "02_bond_bright.mp3",
        "script": "They're not just pets... they're family. They're your heart walking outside your body.",
        "emotion": "deeply emotional, voice slightly trembling with love"
    },
    {
        "filename": "03_joy_bright.mp3",
        "script": "Every tail wag... every happy moment... we help you cherish them all.",
        "emotion": "warm, joyful, building to emotional crescendo"
    },
    {
        "filename": "04_family_bright.mp3", 
        "script": "The Doggy Company... because every pet has a soul.",
        "emotion": "powerful, inspiring, full of conviction"
    }
]

def generate_emotional_voice(script, output_path):
    """Generate highly emotional voiceover"""
    print(f"🎤 Generating emotional voice: {script[:50]}...")
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    # High emotion settings
    voice_settings = VoiceSettings(
        stability=0.35,        # Lower stability = more expressive
        similarity_boost=0.85,
        style=0.8,             # High style = more dramatic
        use_speaker_boost=True
    )
    
    try:
        audio_generator = client.text_to_speech.convert(
            text=script,
            voice_id=EMOTIONAL_VOICE,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        with open(output_path, "wb") as f:
            f.write(audio_data)
        
        print(f"✅ Generated: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🎬 Regenerating Brand Story with EMOTIONAL Voice")
    print("=" * 60)
    
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    for clip in EMOTIONAL_SCRIPTS:
        output_path = os.path.join(AUDIO_DIR, clip["filename"])
        
        print(f"\n📹 Processing: {clip['filename']}")
        print(f"   Emotion: {clip['emotion']}")
        
        if generate_emotional_voice(clip["script"], output_path):
            print(f"✅ Done: {clip['filename']}")
        else:
            print(f"❌ Failed: {clip['filename']}")
    
    print("\n" + "=" * 60)
    print("✅ EMOTIONAL VOICEOVERS COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
