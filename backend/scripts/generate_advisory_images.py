#!/usr/bin/env python3
"""
Generate AI images for Advisory Care Products
Uses GPT Image 1 via emergent integrations and uploads to Cloudinary
"""

import os
import sys
import asyncio
import logging
import base64
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append('/app/backend')

from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# MongoDB
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = 'pet-os-live-test_database'
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Product image prompts by category
CATEGORY_PROMPTS = {
    "food_feeding": "Professional product photo of a premium {product_name} for dogs, clean white studio background, pet food accessories, high quality, no text, centered product, soft shadows",
    "grooming_coat": "Professional product photo of a {product_name} for dog grooming, clean white background, pet grooming salon setting, high quality pet care tool, no text, centered",
    "home_comfort": "Professional product photo of a {product_name} for dogs, cozy home setting, warm lighting, premium pet bedding product, no text, centered, lifestyle shot",
    "behaviour_training": "Professional product photo of a {product_name} for dog training, bright colorful setting, pet enrichment toy, high quality, no text, centered product",
    "travel_outings": "Professional product photo of a {product_name} for pet travel, outdoor adventure context, pet travel gear, high quality, no text, centered",
    "puppy_adoption": "Professional product photo of a {product_name} for puppies, soft pastel colors, cute puppy accessories, high quality, no text, centered",
    "senior_care": "Professional product photo of a {product_name} for senior dogs, comfortable setting, medical-quality pet product, gentle tones, no text, centered",
    "seasonal_climate": "Professional product photo of a {product_name} for dogs, weather protection context, seasonal pet gear, high quality, no text, centered"
}


async def generate_image_with_emergent(prompt: str) -> bytes:
    """Generate image using Emergent's GPT Image integration"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        emergent_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('EMERGENT_MODEL_API_KEY')
        if not emergent_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return None
            
        image_gen = OpenAIImageGeneration(api_key=emergent_key)
        
        # Generate image
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return images[0]
            
    except Exception as e:
        logger.error(f"Error generating image: {e}")
    return None


def upload_bytes_to_cloudinary(image_bytes: bytes, product_id: str) -> str:
    """Upload image bytes to Cloudinary"""
    try:
        # Convert bytes to base64 data URI
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        data_uri = f"data:image/png;base64,{image_base64}"
        
        result = cloudinary.uploader.upload(
            data_uri,
            folder="advisory_products",
            public_id=f"advisory_{product_id}",
            overwrite=True,
            resource_type="image"
        )
        return result.get('secure_url')
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None


async def generate_product_image(product: dict) -> str:
    """Generate AI image for a product and upload to Cloudinary"""
    category = product.get('category', 'default')
    name = product.get('name', 'pet product')
    product_id = product.get('id', 'unknown')
    
    # Build prompt
    prompt_template = CATEGORY_PROMPTS.get(category, CATEGORY_PROMPTS.get('food_feeding'))
    prompt = prompt_template.format(product_name=name)
    
    logger.info(f"Generating image for: {name}")
    
    # Generate
    image_bytes = await generate_image_with_emergent(prompt)
    
    if image_bytes:
        # Upload to Cloudinary
        cloudinary_url = upload_bytes_to_cloudinary(image_bytes, product_id)
        if cloudinary_url:
            logger.info(f"✓ {name} -> {cloudinary_url[:50]}...")
            return cloudinary_url
        else:
            logger.warning(f"✗ Failed to upload {name} to Cloudinary")
    else:
        logger.warning(f"✗ Failed to generate image for {name}")
    
    return None


async def main():
    """Main function to process all advisory products"""
    logger.info("=" * 60)
    logger.info("ADVISORY PRODUCT IMAGE GENERATOR")
    logger.info("=" * 60)
    
    # Get products needing images
    care_categories = [
        "food_feeding", "grooming_coat", "home_comfort", "behaviour_training",
        "travel_outings", "puppy_adoption", "senior_care", "seasonal_climate"
    ]
    
    # Find products without Cloudinary images
    products = list(db.unified_products.find({
        'pillar': 'advisory',
        'category': {'$in': care_categories},
        '$or': [
            {'image_url': {'$not': {'$regex': 'cloudinary'}}},
            {'image_url': {'$exists': False}}
        ]
    }, {'_id': 0}).limit(10))  # Process 10 at a time
    
    logger.info(f"Found {len(products)} products needing images")
    
    if not products:
        logger.info("All products have Cloudinary images!")
        return
    
    success_count = 0
    for product in products:
        cloudinary_url = await generate_product_image(product)
        
        if cloudinary_url:
            # Update database
            db.unified_products.update_one(
                {'id': product['id']},
                {'$set': {
                    'image_url': cloudinary_url,
                    'ai_image_generated': True,
                    'image_updated_at': datetime.utcnow().isoformat()
                }}
            )
            # Also update products_master
            db.products_master.update_one(
                {'id': product['id']},
                {'$set': {
                    'image_url': cloudinary_url,
                    'ai_image_generated': True,
                    'image_updated_at': datetime.utcnow().isoformat()
                }}
            )
            success_count += 1
        
        # Small delay between requests
        await asyncio.sleep(2)
    
    logger.info("=" * 60)
    logger.info(f"COMPLETE: {success_count}/{len(products)} images generated")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
