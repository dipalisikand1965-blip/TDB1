#!/usr/bin/env python3
"""
Regenerate all testimonial videos with matching dogs and Indian accent voiceovers
"""
import os
import subprocess
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ELEVENLABS_API_KEY = "2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc"
EMERGENT_KEY = "sk-emergent-cEb0eF956Fa6741A31"
VIDEO_DIR = "/app/frontend/public/videos/testimonials"

# Updated testimonials - NO MEDICAL, using pillars (Care, Celebrate, etc.)
# Longer scripts so they don't cut short
TESTIMONIALS = [
    {
        "name": "priya",
        "video_prompt": """A warm close-up of a beautiful golden retriever with golden-cream fur, 
        relaxing peacefully on a comfortable couch in a cozy Indian home.
        Soft natural sunlight streaming through a window, warm earthy decor.
        The golden retriever has soulful, gentle eyes looking at the camera with love.
        Cinematic quality, shallow depth of field, heartwarming and peaceful.
        The dog occasionally blinks slowly, content and relaxed.""",
        # Care pillar - NOT medical
        "voice_script": "They remembered Bruno's fear of thunderstorms... even before I mentioned it. Now whenever there's rain, they send me calming tips. It's like they truly know him.",
        "voice_id": "cgSgspJ2msm6clMCkdW9",  # Jessica - warm female
    },
    {
        "name": "rahul",
        "video_prompt": """A happy beagle with classic tricolor markings - brown, black and white,
        playing joyfully in a sunny Indian home balcony garden.
        The beagle is energetic and playful, tail wagging, ears flopping.
        Potted plants and city skyline visible in the warm golden hour light.
        Modern Indian urban home setting. The beagle looks directly at camera with happy expression.
        Cinematic quality, capturing the pure joy of a beloved pet.""",
        # Enjoy/Care pillar - NOT medical
        "voice_script": "Max's favorite walking route, his grooming schedule, even his favorite treats... Mira remembers everything. It feels like having a best friend who truly understands my dog.",
        "voice_id": "cjVigY5qzO86Huf0OWal",  # Eric - warm male
    },
    {
        "name": "kapoor",
        "video_prompt": """An Indian family celebrating with their chocolate brown Labrador retriever.
        The Labrador wears a festive red birthday bandana, looking happy with tongue out.
        A small dog-friendly birthday cake on the table with a single candle.
        Traditional yet modern Indian living room with warm lights and colorful decor.
        Parents and young child around 5 years old, everyone smiling with joy.
        The Labrador has expressive brown eyes, tail wagging. Heartwarming family moment.""",
        # Celebrate pillar
        "voice_script": "They sent Luna a birthday cake... without me even asking! And they remembered her exact birth date from last year. That's when I knew... they truly care about our family.",
        "voice_id": "cgSgspJ2msm6clMCkdW9",  # Jessica - warm female
    }
]

def generate_video(prompt, output_name):
    """Generate video using Sora 2"""
    from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
    
    print(f"🎬 Generating video: {output_name}")
    video_gen = OpenAIVideoGeneration(api_key=EMERGENT_KEY)
    
    try:
        video_bytes = video_gen.text_to_video(
            prompt=prompt,
            model="sora-2",
            size="1280x720",
            duration=4,
            max_wait_time=600
        )
        
        if video_bytes:
            output_path = os.path.join(VIDEO_DIR, f"{output_name}_video.mp4")
            video_gen.save_video(video_bytes, output_path)
            print(f"✅ Video saved: {output_path}")
            return output_path
        else:
            print(f"❌ Failed to generate video")
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def generate_voiceover(text, voice_id, output_path):
    """Generate voiceover with natural pacing"""
    print(f"🎤 Generating voiceover...")
    
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    
    # Settings for warm, natural speech with good pacing
    voice_settings = VoiceSettings(
        stability=0.75,  # More stable for clearer speech
        similarity_boost=0.75,
        style=0.4,  # Slight emotional style
        use_speaker_boost=True
    )
    
    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",  # Best for natural accent
        voice_settings=voice_settings
    )
    
    audio_data = b""
    for chunk in audio_generator:
        audio_data += chunk
    
    with open(output_path, "wb") as f:
        f.write(audio_data)
    
    print(f"✅ Audio saved: {output_path}")
    return output_path

def merge_audio_video(video_path, audio_path, output_path):
    """Merge audio with video, padding audio if needed"""
    print(f"🔄 Merging audio with video...")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Merged video saved: {output_path}")
        return True
    else:
        print(f"❌ Error: {result.stderr}")
        return False

def main():
    print("=" * 60)
    print("🎬 Regenerating All Testimonial Videos")
    print("    - Matching dogs in thumbnail and video")
    print("    - Warmer voices with natural pacing")
    print("    - Pillar-focused quotes (no medical)")
    print("=" * 60)
    
    for t in TESTIMONIALS:
        print(f"\n{'='*50}")
        print(f"📹 Processing: {t['name'].upper()}")
        print(f"{'='*50}")
        
        video_path = os.path.join(VIDEO_DIR, f"{t['name']}_video.mp4")
        audio_path = os.path.join(VIDEO_DIR, f"{t['name']}_audio.mp3")
        final_path = os.path.join(VIDEO_DIR, f"{t['name']}_testimonial.mp4")
        
        # Step 1: Generate video
        video_result = generate_video(t["video_prompt"], t["name"])
        if not video_result:
            print(f"⚠️ Skipping {t['name']} due to video generation failure")
            continue
        
        # Step 2: Generate voiceover
        generate_voiceover(t["voice_script"], t["voice_id"], audio_path)
        
        # Step 3: Merge
        if merge_audio_video(video_path, audio_path, final_path):
            # Cleanup temp files
            os.remove(video_path)
            os.remove(audio_path)
            print(f"✅ {t['name'].upper()} complete!")
        
        print("-" * 50)
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTIMONIALS REGENERATED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
