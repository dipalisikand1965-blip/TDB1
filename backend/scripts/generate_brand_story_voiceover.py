"""
Script to generate voiceover audio files for The Doggy Company Brand Story
Uses ElevenLabs TTS with Mira's voice

Clips match the existing videos:
- 01_eyes_bright.mp4 → "Look into their eyes... You already know."
- 02_bond_bright.mp4 → "They're not just pets. They're family."
- 03_joy_bright.mp4 → "Every tail wag, every happy moment... We help you cherish them all."
- 04_family_bright.mp4 → "The Doggy Company. Every Pet Has a Soul."
"""

import os
import sys
import base64
import requests
import time

# Configuration
API_BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://play-breed-tips.preview.emergentagent.com")
OUTPUT_DIR = "/app/frontend/public/videos/brand_story/audio"

# Voiceover scripts for each clip (matching BRAND_STORY_CLIPS in Home.jsx)
VOICEOVER_SCRIPTS = [
    {
        "filename": "01_eyes_bright.mp3",
        "text": "Look into their eyes. You already know.",
        "duration_hint": "4s"
    },
    {
        "filename": "02_bond_bright.mp3",
        "text": "They're not just pets. They're family.",
        "duration_hint": "4s"
    },
    {
        "filename": "03_joy_bright.mp3",
        "text": "Every tail wag, every happy moment. We help you cherish them all.",
        "duration_hint": "4s"
    },
    {
        "filename": "04_family_bright.mp3",
        "text": "The Doggy Company. Every Pet Has a Soul.",
        "duration_hint": "4s"
    }
]

def generate_voiceover(text: str, filename: str) -> bool:
    """Generate voiceover using ElevenLabs TTS endpoint"""
    print(f"\n🎤 Generating: {filename}")
    print(f"   Text: \"{text}\"")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/tts/generate",
            json={
                "text": text,
                "stability": 0.65,  # Slightly lower for more natural variation
                "similarity_boost": 0.80  # Higher for consistent voice
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"   ❌ API Error: {response.status_code} - {response.text[:200]}")
            return False
        
        data = response.json()
        audio_b64 = data.get("audio_base64")
        
        if not audio_b64:
            print(f"   ❌ No audio data in response")
            return False
        
        # Decode and save
        audio_bytes = base64.b64decode(audio_b64)
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        with open(output_path, "wb") as f:
            f.write(audio_bytes)
        
        file_size = len(audio_bytes)
        print(f"   ✅ Saved: {output_path} ({file_size:,} bytes)")
        return True
        
    except requests.exceptions.Timeout:
        print(f"   ❌ Request timed out")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False


def main():
    print("=" * 60)
    print("🐕 The Doggy Company - Brand Story Voiceover Generator")
    print("=" * 60)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    
    # Check TTS config
    print(f"\n🔧 Checking TTS configuration...")
    try:
        config_resp = requests.get(f"{API_BASE_URL}/api/tts/config", timeout=10)
        config = config_resp.json()
        if config.get("configured"):
            print(f"   ✅ ElevenLabs configured - Voice: {config.get('default_voice_id')}")
        else:
            print(f"   ⚠️ ElevenLabs not configured")
            return 1
    except Exception as e:
        print(f"   ❌ Could not check config: {e}")
        return 1
    
    # Generate voiceovers
    print(f"\n🎙️ Generating {len(VOICEOVER_SCRIPTS)} voiceovers...")
    
    success_count = 0
    for i, script in enumerate(VOICEOVER_SCRIPTS, 1):
        print(f"\n[{i}/{len(VOICEOVER_SCRIPTS)}]", end="")
        
        if generate_voiceover(script["text"], script["filename"]):
            success_count += 1
        
        # Small delay between requests to avoid rate limiting
        if i < len(VOICEOVER_SCRIPTS):
            time.sleep(1)
    
    # Summary
    print("\n" + "=" * 60)
    print(f"✅ Generated: {success_count}/{len(VOICEOVER_SCRIPTS)} voiceovers")
    
    if success_count == len(VOICEOVER_SCRIPTS):
        print("🎉 All voiceovers generated successfully!")
        print("\n📝 Next steps:")
        print("   1. Update Home.jsx BrandStoryModal to play audio with video")
        print("   2. Sync audio playback with video clips")
        return 0
    else:
        print(f"⚠️ {len(VOICEOVER_SCRIPTS) - success_count} voiceovers failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
