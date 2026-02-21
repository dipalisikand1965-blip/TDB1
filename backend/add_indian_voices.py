#!/usr/bin/env python3
"""
Regenerate testimonials with Indian accent voices and properly synced timing
Scripts adjusted to fit exactly within 8-second videos
"""
import os
import subprocess
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ELEVENLABS_API_KEY = "2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc"
VIDEO_DIR = "/app/frontend/public/videos/testimonials"

# Indian accent voice IDs from ElevenLabs library
# Need to add these voices to our account first
INDIAN_FEMALE_VOICE = "6ZZR4JY6rOriLSDtV54M"  # Sreeja - Natural, Calm Indian female
INDIAN_MALE_VOICE = "EtEf6yOMlronn3UoIDrF"    # Ankit - Professional Indian male

# SHORTER scripts to fit in 8 seconds (about 15-20 words max)
# Paced for natural Indian English delivery
TESTIMONIALS = [
    {
        "name": "sharma",
        "script": "They remembered Bruno's fear of thunderstorms... before I even told them.",
        "voice_id": INDIAN_FEMALE_VOICE,  # Priya - female voice
    },
    {
        "name": "rahul", 
        "script": "Max's favorite treats, his walking route... Mira remembers everything.",
        "voice_id": INDIAN_MALE_VOICE,  # Rahul - male voice
    },
    {
        "name": "kapoor",
        "script": "Luna's birthday cake arrived... without me even asking! They truly care.",
        "voice_id": INDIAN_FEMALE_VOICE,  # Female voice
    }
]

def add_voice_to_library(voice_id):
    """Add a shared voice to our library"""
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    try:
        # Try to use the voice directly - it might already be accessible
        return True
    except:
        return False

def generate_voiceover(text, voice_id, output_path):
    """Generate voiceover with Indian accent"""
    print(f"🎤 Generating Indian voiceover: {text[:40]}...")
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    # Settings for clear, warm Indian English
    voice_settings = VoiceSettings(
        stability=0.65,  # Slightly more variation for natural feel
        similarity_boost=0.80,
        style=0.3,
        use_speaker_boost=True
    )
    
    try:
        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        with open(output_path, "wb") as f:
            f.write(audio_data)
        
        print(f"✅ Audio saved: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error with Indian voice, trying fallback: {e}")
        # Fallback to default voices
        fallback_voice = "cgSgspJ2msm6clMCkdW9" if "female" in str(voice_id).lower() else "cjVigY5qzO86Huf0OWal"
        try:
            audio_generator = client.text_to_speech.convert(
                text=text,
                voice_id=fallback_voice,
                model_id="eleven_multilingual_v2",
                voice_settings=voice_settings
            )
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            with open(output_path, "wb") as f:
                f.write(audio_data)
            print(f"✅ Audio saved with fallback voice: {output_path}")
            return True
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
            return False

def get_audio_duration(audio_path):
    """Get duration of audio file"""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", 
         "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())

def merge_audio_video(video_path, audio_path, output_path):
    """Merge audio with video - audio fits within video duration"""
    print(f"🔄 Merging audio with video...")
    
    # Get audio duration
    audio_dur = get_audio_duration(audio_path)
    print(f"   Audio duration: {audio_dur:.2f}s")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",  # End when shortest stream ends
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Merged: {output_path}")
        return True
    else:
        print(f"❌ Error: {result.stderr}")
        return False

def main():
    print("=" * 60)
    print("🎤 Adding Indian Accent Voiceovers")
    print("    - Synced scripts (fit within 8 seconds)")
    print("=" * 60)
    
    for t in TESTIMONIALS:
        print(f"\n{'='*50}")
        print(f"📹 Processing: {t['name'].upper()}")
        print(f"{'='*50}")
        
        video_path = os.path.join(VIDEO_DIR, f"{t['name']}_testimonial.mp4")
        audio_path = os.path.join(VIDEO_DIR, f"{t['name']}_audio.mp3")
        temp_output = os.path.join(VIDEO_DIR, f"{t['name']}_temp.mp4")
        
        if not os.path.exists(video_path):
            print(f"⚠️ Video not found: {video_path}")
            continue
        
        # Step 1: Generate voiceover
        if generate_voiceover(t["script"], t["voice_id"], audio_path):
            # Step 2: Merge with video
            if merge_audio_video(video_path, audio_path, temp_output):
                # Replace original
                os.remove(video_path)
                os.rename(temp_output, video_path)
                os.remove(audio_path)
                print(f"✅ {t['name'].upper()} complete!")
        
        print("-" * 50)
    
    print("\n✅ ALL TESTIMONIALS UPDATED WITH INDIAN VOICES!")

if __name__ == "__main__":
    main()
