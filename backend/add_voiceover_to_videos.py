#!/usr/bin/env python3
"""
Add voiceover to testimonial videos using ElevenLabs TTS
"""
import os
import subprocess
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc")
VIDEO_DIR = "/app/frontend/public/videos/testimonials"

# Testimonial scripts - emotional, warm narration
TESTIMONIALS = [
    {
        "video": "sharma_testimonial.mp4",
        "output": "sharma_with_voice.mp4",
        "script": "They remembered Bruno's fear of thunderstorms... before I even mentioned it.",
        "voice_id": "EXAVITQu4vr4xnSDxMaL"  # Sarah - warm female voice
    },
    {
        "video": "rahul_testimonial.mp4",
        "output": "rahul_with_voice.mp4",
        "script": "When Max got sick at 2am... Mira already had his full health history ready.",
        "voice_id": "pNInz6obpgDQGcFmaJgB"  # Adam - male voice
    },
    {
        "video": "kapoor_testimonial.mp4",
        "output": "kapoor_with_voice.mp4",
        "script": "They sent Luna a birthday cake... without me even asking. That's when I knew... they truly care.",
        "voice_id": "EXAVITQu4vr4xnSDxMaL"  # Sarah - warm female voice
    }
]

def generate_voiceover(text, voice_id, output_path):
    """Generate voiceover audio using ElevenLabs"""
    print(f"🎤 Generating voiceover: {text[:50]}...")
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    voice_settings = VoiceSettings(
        stability=0.7,
        similarity_boost=0.8,
        style=0.5,
        use_speaker_boost=True
    )
    
    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        voice_settings=voice_settings
    )
    
    # Collect audio data
    audio_data = b""
    for chunk in audio_generator:
        audio_data += chunk
    
    # Save audio file
    with open(output_path, "wb") as f:
        f.write(audio_data)
    
    print(f"✅ Audio saved: {output_path}")
    return output_path

def merge_audio_video(video_path, audio_path, output_path):
    """Merge audio with video using ffmpeg"""
    print(f"🎬 Merging audio with video...")
    
    # Use ffmpeg to merge audio and video
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
    
    if result.returncode == 0:
        print(f"✅ Video with voice saved: {output_path}")
        return True
    else:
        print(f"❌ Error merging: {result.stderr}")
        return False

def main():
    print("=" * 60)
    print("🎬 Adding Voiceover to Testimonial Videos")
    print("=" * 60)
    
    for testimonial in TESTIMONIALS:
        video_path = os.path.join(VIDEO_DIR, testimonial["video"])
        output_path = os.path.join(VIDEO_DIR, testimonial["output"])
        audio_path = os.path.join(VIDEO_DIR, f"{testimonial['video'].replace('.mp4', '_audio.mp3')}")
        
        print(f"\n📹 Processing: {testimonial['video']}")
        
        # Step 1: Generate voiceover
        generate_voiceover(testimonial["script"], testimonial["voice_id"], audio_path)
        
        # Step 2: Merge with video
        if merge_audio_video(video_path, audio_path, output_path):
            # Step 3: Replace original with voiced version
            os.rename(output_path, video_path)
            os.remove(audio_path)
            print(f"✅ Replaced original with voiced version")
        
        print("-" * 40)
    
    print("\n✅ All videos processed!")

if __name__ == "__main__":
    main()
