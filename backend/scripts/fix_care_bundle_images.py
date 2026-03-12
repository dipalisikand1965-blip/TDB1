"""
Fix Care Bundle Images - Replace stock photos with watercolor illustrations
GOLDEN RULE: Bundles = Watercolor Illustrated Compositions
"""

import asyncio
import os
import sys
import logging
import base64
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")


def get_bundle_watercolor_prompt(bundle: dict) -> str:
    """Generate a watercolor illustration prompt for a bundle"""
    name = (bundle.get("name") or "").lower()
    
    base_style = "soft watercolor illustrated composition, warm pastel colors, gentle brushstrokes, elegant arrangement of pet care items, artistic illustration style, whimsical and playful, cream or soft white background"
    
    if "grooming" in name:
        return f"Watercolor illustration composition of pet grooming items: soft brushes, gentle shampoo bottles, fluffy towel, with a happy calm dog silhouette, {base_style}"
    
    if "vet" in name or "clinic" in name:
        return f"Watercolor illustration composition of pet health items: gentle first aid kit, calming treats, soft carrier blanket, with caring veterinary symbols, {base_style}"
    
    if "boarding" in name or "daycare" in name:
        return f"Watercolor illustration composition of pet boarding essentials: cozy bed, favorite toy, comfort blanket, food bowl, {base_style}"
    
    if "puppy" in name or "starter" in name:
        return f"Watercolor illustration composition of puppy starter items: tiny collar, soft toys, training treats, puppy bed, {base_style}"
    
    if "senior" in name or "comfort" in name:
        return f"Watercolor illustration composition of senior dog comfort items: orthopedic bed, gentle supplements, soft blanket, {base_style}"
    
    if "recovery" in name or "support" in name:
        return f"Watercolor illustration composition of pet recovery items: soft cone alternative, healing treats, comfort mat, {base_style}"
    
    if "coat" in name or "shed" in name or "brush" in name:
        return f"Watercolor illustration composition of coat care items: de-shedding tools, conditioning sprays, gentle brushes, {base_style}"
    
    if "hygiene" in name:
        return f"Watercolor illustration composition of pet hygiene items: gentle wipes, dental care, ear cleaner, paw balm, {base_style}"
    
    if "shedding" in name or "double coat" in name:
        return f"Watercolor illustration composition of de-shedding tools: undercoat rake, slicker brush, deshedding shampoo, fur roller, {base_style}"
    
    if "curly" in name or "matting" in name:
        return f"Watercolor illustration composition of curly coat care: detangling spray, wide-tooth comb, conditioning treatment, gentle dematting tool, {base_style}"
    
    if "short coat" in name:
        return f"Watercolor illustration composition of short coat care items: rubber grooming mitt, shine spray, bristle brush, {base_style}"
    
    # Default
    return f"Watercolor illustrated composition of premium pet care bundle items arranged artistically, soft pastel colors, gentle brushstrokes, whimsical pet care collection, {base_style}"


async def generate_ai_image(prompt: str) -> str:
    """Generate an image using Emergent's AI image generation"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        if not EMERGENT_LLM_KEY:
            logger.error("EMERGENT_LLM_KEY not configured")
            return None
        
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=prompt,
            number_of_images=1,
            model="gpt-image-1"
        )
        
        if not images or len(images) == 0:
            return None
        
        # Upload to Cloudinary
        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        public_id = f"doggy/care_bundles/{timestamp}"
        
        result = cloudinary.uploader.upload(
            image_data_url,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
            format="webp",
            quality="auto:good"
        )
        
        return result.get("secure_url")
        
    except Exception as e:
        logger.error(f"AI image generation failed: {str(e)}")
        return None


async def fix_care_bundles():
    """Find and fix Care bundles with stock photos"""
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "pet-os-live-test_database")]
    
    # Find Care bundles with Unsplash stock photos
    query = {
        "bundle_type": "care",
        "$or": [
            {"image": {"$regex": "unsplash", "$options": "i"}},
            {"image_url": {"$regex": "unsplash", "$options": "i"}}
        ]
    }
    
    care_bundles = await db.product_bundles.find(query, {"_id": 0}).to_list(50)
    
    logger.info(f"Found {len(care_bundles)} Care bundles with stock photos")
    
    for idx, bundle in enumerate(care_bundles):
        bundle_id = bundle.get("id")
        bundle_name = bundle.get("name", "Unknown")
        
        logger.info(f"[{idx+1}/{len(care_bundles)}] Processing: {bundle_name}")
        
        try:
            # Generate watercolor prompt and image
            prompt = get_bundle_watercolor_prompt(bundle)
            cloudinary_url = await generate_ai_image(prompt)
            
            if cloudinary_url:
                # Update bundle in database
                await db.product_bundles.update_one(
                    {"id": bundle_id},
                    {
                        "$set": {
                            "image_url": cloudinary_url,
                            "image": cloudinary_url,
                            "watercolor_image": cloudinary_url,
                            "ai_generated_image": True,
                            "image_style": "watercolor",
                            "image_updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                logger.info(f"  ✅ Generated watercolor for: {bundle_name}")
            else:
                logger.warning(f"  ❌ Failed to generate for: {bundle_name}")
                
        except Exception as e:
            logger.error(f"  ❌ Error processing {bundle_name}: {str(e)}")
        
        # Rate limiting delay
        await asyncio.sleep(3)
    
    client.close()
    logger.info("Done fixing Care bundle images!")


if __name__ == "__main__":
    asyncio.run(fix_care_bundles())
