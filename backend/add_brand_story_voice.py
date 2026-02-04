#!/usr/bin/env python3
"""
Add voiceover to brand story video using Indian accent
"""
import os
import subprocess
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ELEVENLABS_API_KEY = "2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc"
VIDEO_DIR = "/app/frontend/public/videos/brand_story"

# Indian female voice for emotional narration
INDIAN_FEMALE_VOICE = "6ZZR4JY6rOriLSDtV54M"  # Sreeja

# Scripts for each clip (synced with 4 second clips)
CLIPS = [
    {
        "video": "01_eyes_bright.mp4",
        "script": "Look into their eyes...",
        "duration": 4
    },
    {
        "video": "02_bond_bright.mp4", 
        "script": "You already know... they're family.",
        "duration": 4
    },
    {
        "video": "03_joy_bright.mp4",
        "script": "Every pet has a soul. We nurture it.",
        "duration": 4
    },
    {
        "video": "04_family_bright.mp4",
        "script": "The Doggy Company. Every pet has a soul.",
        "duration": 4
    }
]

def generate_voiceover(text, output_path):
    """Generate voiceover with Indian accent"""
    print(f"🎤 Generating: {text}")
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    voice_settings = VoiceSettings(
        stability=0.70,
        similarity_boost=0.80,
        style=0.4,
        use_speaker_boost=True
    )
    
    try:
        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id=INDIAN_FEMALE_VOICE,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        with open(output_path, "wb") as f:
            f.write(audio_data)
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def merge_audio_video(video_path, audio_path, output_path):
    """Merge audio with video"""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

def main():
    print("=" * 60)
    print("🎬 Adding Indian Voiceover to Brand Story Clips")
    print("=" * 60)
    
    for clip in CLIPS:
        video_path = os.path.join(VIDEO_DIR, clip["video"])
        audio_path = os.path.join(VIDEO_DIR, f"{clip['video'].replace('.mp4', '_audio.mp3')}")
        temp_path = os.path.join(VIDEO_DIR, f"{clip['video'].replace('.mp4', '_temp.mp4')}")
        
        if not os.path.exists(video_path):
            print(f"⚠️ Video not found: {video_path}")
            continue
        
        print(f"\n📹 Processing: {clip['video']}")
        
        # Generate voiceover
        if generate_voiceover(clip["script"], audio_path):
            # Merge
            if merge_audio_video(video_path, audio_path, temp_path):
                os.remove(video_path)
                os.rename(temp_path, video_path)
                os.remove(audio_path)
                print(f"✅ Done: {clip['video']}")
            else:
                print(f"❌ Merge failed")
        
    print("\n✅ BRAND STORY VOICEOVERS COMPLETE!")

if __name__ == "__main__":
    main()
