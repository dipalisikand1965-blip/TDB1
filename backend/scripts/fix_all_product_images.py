"""
FIX ALL DUPLICATE IMAGES - Comprehensive Product Image Regeneration
GOLDEN RULE: Products = Realistic photography

This script finds and fixes ALL products with duplicate/bad images across:
- products
- products_master  
- unified_products

Run: cd /app/backend && set -a && source .env && set +a && python3 scripts/fix_all_product_images.py
"""

import asyncio
import os
import sys
import base64
import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# Pattern for bad/duplicate images
BAD_IMAGE_PATTERNS = [
    'static.prod-images.emergentagent.com/jobs',
    'images.unsplash.com'
]


def get_product_image_prompt(product: dict) -> str:
    """Generate a realistic product photography prompt - GOLDEN RULE"""
    name = (product.get("name") or "Product").lower()
    pillar = (product.get("pillar") or "pet").lower()
    
    base_style = "professional product photography, clean white background, studio lighting, high quality, realistic, commercial photography style"
    
    # Pillar-specific prompts
    if pillar == "celebrate" or "cake" in name or "birthday" in name or "party" in name:
        return f"Professional product photo of {name}, decorated dog birthday item, festive colors, {base_style}"
    
    if pillar == "dine" or "food" in name or "bowl" in name or "treat" in name or "feeder" in name:
        return f"Professional product photo of {name}, premium pet food accessory, {base_style}"
    
    if pillar == "care" or "grooming" in name or "brush" in name or "shampoo" in name:
        return f"Professional product photo of {name}, pet grooming product, {base_style}"
    
    if pillar == "stay" or "bed" in name or "crate" in name or "blanket" in name:
        return f"Professional product photo of {name}, cozy pet comfort item, {base_style}"
    
    if pillar == "travel" or "carrier" in name or "harness" in name or "leash" in name:
        return f"Professional product photo of {name}, pet travel gear, {base_style}"
    
    if pillar == "fit" or "toy" in name or "ball" in name or "exercise" in name:
        return f"Professional product photo of {name}, pet activity toy, {base_style}"
    
    if pillar == "enjoy" or "puzzle" in name or "chew" in name:
        return f"Professional product photo of {name}, dog enrichment toy, {base_style}"
    
    if pillar == "emergency" or "first aid" in name or "kit" in name:
        return f"Professional product photo of {name}, pet emergency supplies, {base_style}"
    
    if pillar == "adopt" or "starter" in name or "puppy" in name:
        return f"Professional product photo of {name}, new pet essentials, {base_style}"
    
    if pillar == "shop" or "collar" in name or "tag" in name:
        return f"Professional product photo of {name}, premium pet accessory, {base_style}"
    
    # Default
    return f"Professional product photo of {name}, premium pet product, {base_style}"


async def generate_product_image(prompt: str) -> str:
    """Generate a realistic product image using AI"""
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
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
        public_id = f"doggy/products/fixed/{timestamp}"
        
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
        logger.error(f"Image generation failed: {str(e)}")
        return None


async def fix_all_product_images(batch_size: int = 50, delay: float = 2.0):
    """Find and fix ALL products with duplicate/bad images"""
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "pet-os-live-test_database")]
    
    # Build query for bad images
    bad_image_query = {
        "$or": []
    }
    for pattern in BAD_IMAGE_PATTERNS:
        bad_image_query["$or"].extend([
            {"image": {"$regex": pattern}},
            {"image_url": {"$regex": pattern}}
        ])
    
    collections_to_fix = ["products", "products_master", "unified_products"]
    
    total_fixed = 0
    total_failed = 0
    
    for coll_name in collections_to_fix:
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing {coll_name}...")
        
        try:
            products = await db[coll_name].find(bad_image_query).to_list(1000)
            logger.info(f"Found {len(products)} products with bad images in {coll_name}")
            
            for idx, product in enumerate(products):
                prod_id = product.get("id")
                prod_name = product.get("name", "Unknown")
                
                logger.info(f"[{idx+1}/{len(products)}] Processing: {prod_name[:40]}")
                
                try:
                    prompt = get_product_image_prompt(product)
                    new_url = await generate_product_image(prompt)
                    
                    if new_url:
                        # Update in database
                        await db[coll_name].update_one(
                            {"id": prod_id},
                            {
                                "$set": {
                                    "image_url": new_url,
                                    "image": new_url,
                                    "ai_generated_image": True,
                                    "image_fixed_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        logger.info(f"  ✅ Fixed: {prod_name[:30]}")
                        total_fixed += 1
                    else:
                        logger.warning(f"  ❌ Failed to generate: {prod_name[:30]}")
                        total_failed += 1
                        
                except Exception as e:
                    logger.error(f"  ❌ Error: {str(e)}")
                    total_failed += 1
                
                # Rate limiting
                await asyncio.sleep(delay)
                
                # Progress checkpoint
                if (idx + 1) % batch_size == 0:
                    logger.info(f"\n📊 Progress: {idx+1}/{len(products)} in {coll_name}")
                    logger.info(f"   Total fixed: {total_fixed}, failed: {total_failed}")
        
        except Exception as e:
            logger.error(f"Error processing {coll_name}: {str(e)}")
    
    client.close()
    
    logger.info(f"\n{'='*60}")
    logger.info(f"COMPLETE!")
    logger.info(f"Total fixed: {total_fixed}")
    logger.info(f"Total failed: {total_failed}")
    
    return {"fixed": total_fixed, "failed": total_failed}


if __name__ == "__main__":
    # Parse command line args
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    delay = float(sys.argv[2]) if len(sys.argv) > 2 else 2.5
    
    logger.info(f"Starting comprehensive image fix...")
    logger.info(f"Batch size: {batch_size}, Delay: {delay}s")
    
    asyncio.run(fix_all_product_images(batch_size=batch_size, delay=delay))
