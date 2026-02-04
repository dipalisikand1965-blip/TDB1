import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# Emotional video prompt for Pet Soul landing page
prompt = """
Cinematic close-up of a golden retriever's soulful brown eyes, gently blinking, 
with soft golden light reflecting. The dog's eyes convey deep emotion and love.
Dreamy, ethereal atmosphere with soft purple and pink ambient lighting. 
Gentle camera movement pushing slowly into the eyes.
Film grain, shallow depth of field, intimate and emotional mood.
"""

print("🎬 Starting Sora 2 video generation...")
print("📝 Prompt:", prompt[:100], "...")

video_gen = OpenAIVideoGeneration(api_key=os.environ.get('EMERGENT_LLM_KEY'))

video_bytes = video_gen.text_to_video(
    prompt=prompt,
    model="sora-2",
    size="1280x720",
    duration=4,
    max_wait_time=600
)

if video_bytes:
    output_path = "/app/frontend/public/videos/pet-soul-hero.mp4"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    video_gen.save_video(video_bytes, output_path)
    print(f"✅ Video saved to: {output_path}")
else:
    print("❌ Video generation failed")
