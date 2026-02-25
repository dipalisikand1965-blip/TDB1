#!/usr/bin/env python3
"""
Generate authentic Indian family testimonial videos using Sora 2
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# Video output directory
OUTPUT_DIR = "/app/frontend/public/videos/testimonials"

# Testimonial video prompts - authentic Indian families with their dogs
TESTIMONIAL_PROMPTS = [
    {
        "id": "sharma_family",
        "prompt": """Warm, intimate close-up shot of an Indian woman in her 30s with warm brown skin, 
        wearing a comfortable salwar kameez, sitting on a cozy sofa with her golden retriever. 
        She's gently petting the dog while it rests its head on her lap. 
        Soft natural lighting from a window, warm home interior with Indian decor. 
        The woman has a gentle, loving smile as she looks at her dog. 
        Cinematic quality, shallow depth of field, emotional and heartwarming. 
        The dog occasionally looks up at her with soulful eyes.""",
        "filename": "sharma_testimonial.mp4",
        "duration": 4
    },
    {
        "id": "rahul_max",
        "prompt": """A young Indian man in his late 20s with short black hair, wearing casual clothes,
        playing with his energetic beagle in a sunny Indian home balcony garden.
        The man is laughing as the dog jumps around excitedly.
        Potted plants and city skyline visible in background.
        Golden hour lighting, warm and joyful atmosphere.
        Authentic Indian urban home setting with modern furniture.
        The bond between man and dog is evident, playful energy.""",
        "filename": "rahul_testimonial.mp4",
        "duration": 4
    },
    {
        "id": "kapoor_family",
        "prompt": """An Indian family - parents and a young child - celebrating their Labrador's birthday.
        The dog wears a cute birthday bandana. A small dog-friendly cake on the table.
        Traditional yet modern Indian living room with warm lighting.
        The child is hugging the dog while parents watch with loving smiles.
        Festive, heartwarming atmosphere with subtle Indian decor elements.
        Cinematic quality, capturing pure joy and family love for their pet.""",
        "filename": "kapoor_testimonial.mp4",
        "duration": 4
    }
]

def generate_video(prompt_data):
    """Generate a single testimonial video"""
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    
    output_path = os.path.join(OUTPUT_DIR, prompt_data["filename"])
    
    print(f"🎬 Generating video: {prompt_data['id']}")
    print(f"   Prompt: {prompt_data['prompt'][:100]}...")
    
    try:
        video_bytes = video_gen.text_to_video(
            prompt=prompt_data["prompt"],
            model="sora-2",
            size="1280x720",
            duration=prompt_data.get("duration", 5),
            max_wait_time=600
        )
        
        if video_bytes:
            video_gen.save_video(video_bytes, output_path)
            print(f"✅ Saved: {output_path}")
            return output_path
        else:
            print(f"❌ Failed to generate: {prompt_data['id']}")
            return None
    except Exception as e:
        print(f"❌ Error generating {prompt_data['id']}: {str(e)}")
        return None

def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 60)
    print("🐕 Generating Indian Family Testimonial Videos")
    print("=" * 60)
    
    results = []
    for prompt_data in TESTIMONIAL_PROMPTS:
        result = generate_video(prompt_data)
        results.append({
            "id": prompt_data["id"],
            "success": result is not None,
            "path": result
        })
        print("-" * 40)
    
    print("\n" + "=" * 60)
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    for r in results:
        status = "✅" if r["success"] else "❌"
        print(f"{status} {r['id']}: {r['path'] or 'FAILED'}")

if __name__ == "__main__":
    main()
