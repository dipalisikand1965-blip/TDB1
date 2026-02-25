"""
Generate BRIGHTER Brand Story Videos with improved prompts
"""
import os
import sys
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

video_gen = OpenAIVideoGeneration(api_key=os.environ.get('EMERGENT_LLM_KEY'))

# IMPROVED prompts - brighter, more visible
BRIGHT_CLIPS = [
    {
        "name": "01_eyes_bright",
        "prompt": """
BRIGHT, WELL-LIT extreme close-up of a golden retriever's warm brown eyes.
Bright natural daylight, soft diffused lighting.
The eyes are the main focus, sharp and detailed.
Warm golden tones, high contrast, professional photography style.
Camera slowly zooms in. Heartwarming, emotional, crystal clear quality.
NO dark shadows, BRIGHT and vibrant.
""",
        "duration": 4
    },
    {
        "name": "02_bond_bright", 
        "prompt": """
BRIGHT, SUNNY scene: A smiling woman hugging her happy golden retriever outdoors.
Bright daylight, blue sky visible, green grass.
Both looking at camera with joy, dog's tongue out happily.
Warm, saturated colors, high contrast, lifestyle photography.
Slow motion, shallow depth of field with bright bokeh.
BRIGHT and cheerful mood, NO dark tones.
""",
        "duration": 4
    },
    {
        "name": "03_joy_bright",
        "prompt": """
BRIGHT slow motion: Golden retriever running happily in a sunny park.
Bright midday sun, vivid green grass, blue sky.
Dog's fur glowing golden in sunlight, ears flopping, pure joy.
High saturation, vibrant colors, professional sports camera quality.
The dog looks directly at camera while running, big happy smile.
BRIGHT, cheerful, uplifting energy.
""",
        "duration": 4
    },
    {
        "name": "04_family_bright",
        "prompt": """
BRIGHT family scene: Parents and child playing with their fluffy white dog in backyard.
Sunny day, bright green lawn, white picket fence visible.
Everyone laughing, dog jumping excitedly.
Warm, golden hour lighting but still BRIGHT and visible.
Natural, candid family moment, high quality video.
BRIGHT, happy, warm family vibes.
""",
        "duration": 4
    }
]

def generate_clip(clip_info):
    print(f"\n🎬 Generating BRIGHT: {clip_info['name']}")
    try:
        video_bytes = video_gen.text_to_video(
            prompt=clip_info['prompt'].strip(),
            model="sora-2",
            size="1280x720",
            duration=clip_info['duration'],
            max_wait_time=600
        )
        if video_bytes:
            output_path = f"/app/frontend/public/videos/brand_story/{clip_info['name']}.mp4"
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            video_gen.save_video(video_bytes, output_path)
            print(f"✅ Saved: {output_path}")
            return True
        else:
            print(f"❌ Failed")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    clip_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    if 0 <= clip_idx < len(BRIGHT_CLIPS):
        generate_clip(BRIGHT_CLIPS[clip_idx])
    else:
        print("Usage: python generate_bright_videos.py [0-3]")
