"""
Generate Brand Story Video Clips with Sora 2
The Doggy Company - "Every Pet Has a Soul"
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# Initialize video generator
video_gen = OpenAIVideoGeneration(api_key=os.environ.get('EMERGENT_LLM_KEY'))

# Define video clips to generate
CLIPS = [
    {
        "name": "01_soulful_eyes",
        "prompt": """
Extreme close-up of a golden retriever's warm brown eyes, slowly blinking with deep emotion.
Soft golden morning light illuminating the fur around the eyes.
The eyes convey unconditional love, trust, and a gentle soul.
Cinematic shallow depth of field, film grain, intimate documentary style.
Camera very slowly pushes in. Ethereal, emotional, heartwarming mood.
""",
        "duration": 5
    },
    {
        "name": "02_the_bond",
        "prompt": """
Intimate moment: A person gently pressing their forehead against their dog's forehead.
Both have eyes closed, peaceful smiles. Golden hour lighting through a window.
The dog is a friendly labrador with soft cream fur.
Gentle camera movement, shallow depth of field, warm color grading.
Pure love and connection between human and pet. Emotional, tender, cinematic.
""",
        "duration": 5
    },
    {
        "name": "03_soul_orb",
        "prompt": """
Abstract visualization: A glowing ethereal orb of soft purple and pink light,
pulsing gently like a heartbeat in a dark space.
Tiny golden particles floating around it like stardust.
The orb represents a pet's soul - warm, alive, precious.
Smooth camera orbit around the orb. Magical, otherworldly, beautiful.
High-end VFX aesthetic, cinematic lighting.
""",
        "duration": 4
    },
    {
        "name": "04_pure_joy",
        "prompt": """
Slow motion: A happy golden retriever running through a sunlit meadow,
ears flopping, tongue out, pure joy in every movement.
Golden hour backlighting creating a magical halo effect around the fur.
Shallow depth of field, dreamy bokeh in background.
The dog looks directly at camera with the happiest expression.
Cinematic, uplifting, celebrates the joy of pets.
""",
        "duration": 5
    },
    {
        "name": "05_family_moment",
        "prompt": """
A family sitting together on a cozy couch - parents and child with their dog in the middle.
Everyone is laughing as the dog gives kisses.
Warm living room lighting, comfortable home setting.
The dog is clearly the heart of the family.
Natural, authentic, documentary style but beautifully lit.
Captures the essence of "pets are family."
""",
        "duration": 5
    },
    {
        "name": "06_final_connection",
        "prompt": """
Final shot: Owner and dog walking together at sunset on a beach or path.
Shot from behind, silhouettes against golden sky.
The dog looks up at the owner, owner looks down at dog - connection.
Wide shot transitioning to medium shot.
Epic, emotional finale. Beautiful natural lighting.
Represents the journey together, loyalty, unconditional love.
""",
        "duration": 5
    }
]

def generate_clip(clip_info):
    """Generate a single video clip"""
    print(f"\n🎬 Generating: {clip_info['name']}")
    print(f"📝 Prompt: {clip_info['prompt'][:80]}...")
    
    try:
        video_bytes = video_gen.text_to_video(
            prompt=clip_info['prompt'].strip(),
            model="sora-2",
            size="1792x1024",  # Cinematic widescreen (supported size)
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
            print(f"❌ Failed to generate: {clip_info['name']}")
            return False
    except Exception as e:
        print(f"❌ Error generating {clip_info['name']}: {e}")
        return False

def main():
    print("=" * 60)
    print("THE DOGGY COMPANY - BRAND STORY VIDEO GENERATION")
    print("=" * 60)
    
    # Check which clip to generate (can pass index as argument)
    if len(sys.argv) > 1:
        clip_index = int(sys.argv[1])
        if 0 <= clip_index < len(CLIPS):
            generate_clip(CLIPS[clip_index])
        else:
            print(f"Invalid clip index. Choose 0-{len(CLIPS)-1}")
    else:
        # Generate first clip by default
        print("\n📋 Available clips to generate:")
        for i, clip in enumerate(CLIPS):
            print(f"  {i}: {clip['name']} ({clip['duration']}s)")
        
        print("\n🎥 Generating first clip (Soulful Eyes)...")
        generate_clip(CLIPS[0])

if __name__ == "__main__":
    main()
