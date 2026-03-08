"""
Complete Breed Product Mockup Generator
========================================
Generates AI-powered product mockup images for ALL breeds and ALL product types.
33 breeds × 12 products = 396 mockups

This script:
1. Seeds all breed products to database (if not already seeded)
2. Generates mockup images using OpenAI GPT Image 1
3. Uploads images to cloud storage
4. Updates database with mockup URLs

Run: python generate_all_mockups.py [--generate] [--limit N]
"""

import asyncio
import os
import sys
import base64
import logging
import argparse
from datetime import datetime
from typing import Optional, List, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# BREED DATA (33 breeds - matching breedIllustrations.js)
# ═══════════════════════════════════════════════════════════════════════════

BREEDS = [
    {"key": "labrador", "name": "Labrador Retriever", "short": "Labrador"},
    {"key": "golden_retriever", "name": "Golden Retriever", "short": "Golden Retriever"},
    {"key": "cocker_spaniel", "name": "Cocker Spaniel", "short": "Cocker Spaniel"},
    {"key": "irish_setter", "name": "Irish Setter", "short": "Irish Setter"},
    {"key": "german_shepherd", "name": "German Shepherd", "short": "German Shepherd"},
    {"key": "rottweiler", "name": "Rottweiler", "short": "Rottweiler"},
    {"key": "doberman", "name": "Doberman Pinscher", "short": "Doberman"},
    {"key": "boxer", "name": "Boxer", "short": "Boxer"},
    {"key": "st_bernard", "name": "St Bernard", "short": "St Bernard"},
    {"key": "great_dane", "name": "Great Dane", "short": "Great Dane"},
    {"key": "american_bully", "name": "American Bully", "short": "American Bully"},
    {"key": "husky", "name": "Siberian Husky", "short": "Husky"},
    {"key": "pomeranian", "name": "Pomeranian", "short": "Pomeranian"},
    {"key": "chow_chow", "name": "Chow Chow", "short": "Chow Chow"},
    {"key": "border_collie", "name": "Border Collie", "short": "Border Collie"},
    {"key": "beagle", "name": "Beagle", "short": "Beagle"},
    {"key": "dachshund", "name": "Dachshund", "short": "Dachshund"},
    {"key": "italian_greyhound", "name": "Italian Greyhound", "short": "Italian Greyhound"},
    {"key": "dalmatian", "name": "Dalmatian", "short": "Dalmatian"},
    {"key": "jack_russell", "name": "Jack Russell Terrier", "short": "Jack Russell"},
    {"key": "yorkshire", "name": "Yorkshire Terrier", "short": "Yorkshire"},
    {"key": "scottish_terrier", "name": "Scottish Terrier", "short": "Scottish Terrier"},
    {"key": "pug", "name": "Pug", "short": "Pug"},
    {"key": "shih_tzu", "name": "Shih Tzu", "short": "Shih Tzu"},
    {"key": "chihuahua", "name": "Chihuahua", "short": "Chihuahua"},
    {"key": "maltese", "name": "Maltese", "short": "Maltese"},
    {"key": "lhasa_apso", "name": "Lhasa Apso", "short": "Lhasa Apso"},
    {"key": "cavalier", "name": "Cavalier King Charles Spaniel", "short": "Cavalier"},
    {"key": "french_bulldog", "name": "French Bulldog", "short": "French Bulldog"},
    {"key": "bulldog", "name": "English Bulldog", "short": "English Bulldog"},
    {"key": "poodle", "name": "Poodle", "short": "Poodle"},
    {"key": "schnoodle", "name": "Schnoodle", "short": "Schnoodle"},
    {"key": "indie", "name": "Indian Pariah Dog", "short": "Indie"},
]

# ═══════════════════════════════════════════════════════════════════════════
# PRODUCT TYPES - NO CAKES (use real Doggy Bakery cakes instead)
# Prompts DO NOT include any pet name - just the breed illustration
# Names are added as UI overlay "Personalize with your pet's name"
# ═══════════════════════════════════════════════════════════════════════════

PRODUCT_TYPES = [
    # NOTE: CAKES EXCLUDED - Use real Doggy Bakery cakes instead
    # {
    #     "type": "cake",
    #     ...
    # },
    {
        "type": "bandana",
        "name_template": "{breed} Bandana",
        "pillar": "celebrate",
        "price": 399,
        "prompt": """A premium white cotton pet bandana laid flat on a clean white background.
The bandana features a beautiful soulful watercolor illustration of a {breed_full} dog face PRINTED DIRECTLY ON the fabric center.
The watercolor illustration style is soft, emotional, and artistic - warm earth tones, gentle soulful expression.
NO TEXT on the bandana - just the beautiful dog portrait illustration.
Professional product photography, soft fabric texture clearly visible, premium quality.
The illustration appears as part of the fabric, professionally screen-printed.""",
    },
    {
        "type": "mug",
        "name_template": "{breed} Lover Mug",
        "pillar": "celebrate",
        "price": 499,
        "prompt": """A premium white ceramic coffee mug photographed on a clean white background with soft shadows.
The mug features a beautiful soulful watercolor illustration of a {breed_full} dog face PRINTED ON its curved surface.
The illustration wraps naturally around the mug's surface as if professionally sublimated onto the ceramic.
NO TEXT on the mug - just the beautiful watercolor dog portrait.
The watercolor style is soft, emotional, artistic with warm earth tones.
Professional product photography, the illustration looks like it's part of the mug.""",
    },
    {
        "type": "keychain",
        "name_template": "{breed} Keychain",
        "pillar": "celebrate",
        "price": 299,
        "prompt": """A premium silver metal keychain with a circular pendant photographed on a clean white background.
The pendant features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on its surface.
NO TEXT or name on the keychain - just the beautiful dog portrait illustration.
The watercolor style is soft and emotional, visible on the metal surface as a miniature art piece.
Professional product photography, shiny metal surface, premium gift quality.""",
    },
    {
        "type": "frame",
        "name_template": "{breed} Portrait Frame",
        "pillar": "celebrate",
        "price": 799,
        "prompt": """An elegant white or natural wood photo frame photographed against a clean background.
Inside the frame is a beautiful soulful watercolor portrait illustration of a {breed_full} dog.
Warm colors, gentle soulful expression, artistic quality like commissioned pet portrait art.
NO TEXT in the frame - just the beautiful watercolor portrait.
Professional product photography, premium home decor item.""",
    },
    {
        "type": "welcome_mat",
        "name_template": "{breed} Welcome Mat",
        "pillar": "stay",
        "price": 1199,
        "prompt": """A premium coir doormat photographed from above on a clean floor surface.
The mat features a beautiful soulful watercolor illustration of a {breed_full} dog face PRINTED IN the center.
Below the illustration is the word 'WELCOME' in elegant dark lettering.
The watercolor style is soft and artistic, printed onto natural coir fibers.
Professional product photography, warm inviting feel.""",
    },
    {
        "type": "bowl",
        "name_template": "{breed} Food Bowl",
        "pillar": "dine",
        "price": 599,
        "prompt": """A premium ceramic pet food bowl photographed from above on a clean white background.
The bowl interior bottom features a beautiful soulful watercolor illustration of a {breed_full} dog face.
NO TEXT on the bowl - just the beautiful watercolor dog portrait visible inside.
The watercolor style is soft and emotional with warm earth tones.
Professional product photography, premium pet dining accessory.""",
    },
    {
        "type": "tote_bag",
        "name_template": "{breed} Tote Bag",
        "pillar": "celebrate",
        "price": 699,
        "prompt": """A premium natural cotton canvas tote bag photographed flat on a clean white background.
The bag features a large, beautiful soulful watercolor illustration of a {breed_full} dog PRINTED ON the center.
NO TEXT on the bag - just the beautiful watercolor dog portrait.
The watercolor style is soft, emotional, artistic with warm earth tones.
Professional product photography, fabric texture visible, dog parent gift item.""",
    },
    {
        "type": "treat_jar",
        "name_template": "{breed} Treat Jar",
        "pillar": "dine",
        "price": 649,
        "prompt": """A premium glass treat jar with wooden lid photographed on a clean background.
The jar features a beautiful soulful watercolor illustration of a {breed_full} dog face PRINTED ON the glass.
The word 'TREATS' appears in elegant lettering below the illustration.
The watercolor style is soft and artistic, visible on the glass surface.
Professional product photography, premium pet storage accessory.""",
    },
    {
        "type": "blanket",
        "name_template": "{breed} Cozy Blanket",
        "pillar": "stay",
        "price": 999,
        "prompt": """A premium soft fleece blanket draped elegantly, photographed on a clean background.
The blanket features a large, beautiful soulful watercolor illustration of a {breed_full} dog PRINTED ON the fabric center.
NO TEXT on the blanket - just the beautiful watercolor dog portrait.
The watercolor style is warm, emotional, artistic with soft earth tones.
Soft cozy fleece texture clearly visible.
Professional product photography, premium pet comfort item.""",
    },
    {
        "type": "collar_tag",
        "name_template": "{breed} ID Tag",
        "pillar": "care",
        "price": 349,
        "prompt": """A premium silver metal pet ID tag in bone shape photographed on a clean white background.
The tag features a small soulful watercolor illustration of a {breed_full} dog silhouette ENGRAVED on its surface.
NO TEXT on the tag - just the beautiful breed silhouette.
Shiny polished metal surface with the artwork as focal point.
Professional product photography, premium pet accessory.""",
    },
    {
        "type": "party_hat",
        "name_template": "{breed} Party Hat",
        "pillar": "celebrate",
        "price": 199,
        "prompt": """A festive dog birthday party hat cone photographed on a clean white background.
The party hat features a beautiful soulful watercolor illustration of a {breed_full} dog face PRINTED ON the fabric.
Elegant purple and gold design accents, elastic chin strap visible.
NO TEXT on the hat - just the beautiful watercolor illustration.
Professional product photography, celebration theme, premium quality.""",
    },
]

# ═══════════════════════════════════════════════════════════════════════════
# IMAGE GENERATION
# ═══════════════════════════════════════════════════════════════════════════

async def generate_mockup_image(prompt: str, slug: str) -> Optional[str]:
    """Generate a single mockup image using OpenAI GPT Image 1."""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found in environment")
            return None
        
        logger.info(f"Generating mockup: {slug}")
        
        # Initialize generator
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        # Generate the image
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Convert to base64 data URL for now
            # In production, you'd upload to cloud storage
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            image_url = f"data:image/png;base64,{image_base64}"
            
            logger.info(f"✓ Generated: {slug}")
            return image_url
        
        logger.warning(f"No image generated for: {slug}")
        return None
        
    except Exception as e:
        logger.error(f"Error generating {slug}: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# DATABASE OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════

async def seed_all_breed_products(db) -> int:
    """Seed all 396 breed products into database.
    
    CRITICAL: Uses $setOnInsert for mockup_url to NEVER overwrite existing mockups!
    This was causing $500 worth of mockups to be wiped on every deployment.
    """
    
    products_created = 0
    
    for breed in BREEDS:
        for product_type in PRODUCT_TYPES:
            product_name = product_type["name_template"].format(breed=breed["short"])
            product_id = f"breed-{breed['key']}-{product_type['type']}"
            
            # Build the prompt with breed name
            prompt = product_type["prompt"].format(breed_full=breed["name"])
            
            # Fields that can be safely updated every time
            updatable_fields = {
                "name": product_name,
                "title": product_name,
                "category": f"breed-{product_type['type']}s",
                "pillar": product_type["pillar"],
                "price": product_type["price"],
                "breed": breed["key"],
                "breed_name": breed["name"],
                "product_type": product_type["type"],
                "soul_tier": "soul_made",
                "mockup_prompt": prompt,
                "description": f"Beautiful {product_name} featuring soulful watercolor illustration. Personalize with your pet's name.",
                "tags": ["breed-specific", breed["key"], product_type["type"], "personalized", "soul-made"],
                "in_stock": True,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Fields that should ONLY be set on first insert (never overwrite)
            insert_only_fields = {
                "id": product_id,
                "mockup_url": None,  # Only set to None if product doesn't exist
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Use $set for updates, $setOnInsert for fields we don't want to overwrite
            await db.breed_products.update_one(
                {"id": product_id},
                {
                    "$set": updatable_fields,
                    "$setOnInsert": insert_only_fields
                },
                upsert=True
            )
            products_created += 1
    
    logger.info(f"Seeded {products_created} breed products (mockup_url preserved)")
    return products_created


async def generate_mockups_batch(db, batch_size: int = 2, limit: Optional[int] = None, delay: int = 3) -> Dict:
    """Generate mockup images for products missing them."""
    
    # Find products without mockups
    query = {"mockup_url": None}
    cursor = db.breed_products.find(query)
    
    if limit:
        cursor = cursor.limit(limit)
    
    products = await cursor.to_list(500)
    
    logger.info(f"Found {len(products)} products needing mockups")
    
    generated = 0
    failed = 0
    
    # Process in batches
    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        
        for product in batch:
            try:
                slug = product["id"]
                prompt = product["mockup_prompt"]
                
                mockup_url = await generate_mockup_image(prompt, slug)
                
                if mockup_url:
                    await db.breed_products.update_one(
                        {"id": product["id"]},
                        {"$set": {
                            "mockup_url": mockup_url,
                            "mockup_generated_at": datetime.utcnow().isoformat()
                        }}
                    )
                    generated += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Failed for {product['id']}: {e}")
                failed += 1
        
        # Progress update
        progress = i + len(batch)
        logger.info(f"Progress: {progress}/{len(products)} ({generated} generated, {failed} failed)")
        
        # Delay between batches to avoid rate limits
        if i + batch_size < len(products):
            logger.info(f"Waiting {delay}s before next batch...")
            await asyncio.sleep(delay)
    
    return {"generated": generated, "failed": failed, "total": len(products)}


async def get_mockup_stats(db) -> Dict:
    """Get statistics on mockup generation status."""
    
    total = await db.breed_products.count_documents({})
    with_mockups = await db.breed_products.count_documents({"mockup_url": {"$ne": None}})
    without_mockups = await db.breed_products.count_documents({"mockup_url": None})
    
    # By product type
    pipeline = [
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}, "with_mockups": {"$sum": {"$cond": [{"$ne": ["$mockup_url", None]}, 1, 0]}}}}
    ]
    by_type = await db.breed_products.aggregate(pipeline).to_list(20)
    
    # By breed
    pipeline = [
        {"$group": {"_id": "$breed", "count": {"$sum": 1}, "with_mockups": {"$sum": {"$cond": [{"$ne": ["$mockup_url", None]}, 1, 0]}}}}
    ]
    by_breed = await db.breed_products.aggregate(pipeline).to_list(40)
    
    return {
        "total_products": total,
        "with_mockups": with_mockups,
        "without_mockups": without_mockups,
        "completion_percentage": round((with_mockups / total * 100) if total > 0 else 0, 1),
        "by_product_type": {item["_id"]: {"total": item["count"], "with_mockups": item["with_mockups"]} for item in by_type},
        "by_breed": {item["_id"]: {"total": item["count"], "with_mockups": item["with_mockups"]} for item in by_breed}
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

async def main(args):
    """Main entry point."""
    
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.error("MONGO_URL not set in environment")
        sys.exit(1)
    
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("\n" + "=" * 70)
    print("BREED PRODUCT MOCKUP GENERATOR")
    print("=" * 70)
    print(f"Database: {db_name}")
    print(f"Breeds: {len(BREEDS)}")
    print(f"Product Types: {len(PRODUCT_TYPES)}")
    print(f"Total Products: {len(BREEDS) * len(PRODUCT_TYPES)}")
    print("=" * 70)
    
    # Step 1: Always seed products first
    print("\n[1/3] Seeding breed products...")
    count = await seed_all_breed_products(db)
    print(f"    ✓ {count} products in database")
    
    # Step 2: Show current stats
    print("\n[2/3] Current mockup status:")
    stats = await get_mockup_stats(db)
    print(f"    Total: {stats['total_products']}")
    print(f"    With mockups: {stats['with_mockups']}")
    print(f"    Pending: {stats['without_mockups']}")
    print(f"    Completion: {stats['completion_percentage']}%")
    
    # Step 3: Generate mockups if requested
    if args.generate:
        limit = args.limit if hasattr(args, 'limit') and args.limit else None
        print(f"\n[3/3] Generating mockups {'(limit: ' + str(limit) + ')' if limit else '(all pending)'}...")
        print("    This will take a while - each image takes ~30-60 seconds")
        print("    You can stop with Ctrl+C and resume later\n")
        
        result = await generate_mockups_batch(
            db, 
            batch_size=args.batch_size if hasattr(args, 'batch_size') else 2,
            limit=limit,
            delay=args.delay if hasattr(args, 'delay') else 3
        )
        
        print(f"\n    Results:")
        print(f"    ✓ Generated: {result['generated']}")
        print(f"    ✗ Failed: {result['failed']}")
        
        # Final stats
        final_stats = await get_mockup_stats(db)
        print(f"\n    Final completion: {final_stats['completion_percentage']}%")
    else:
        print("\n[3/3] Skipping mockup generation (use --generate to enable)")
    
    print("\n" + "=" * 70)
    print("DONE!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate breed product mockups")
    parser.add_argument("--generate", action="store_true", help="Actually generate mockup images")
    parser.add_argument("--limit", type=int, help="Limit number of mockups to generate")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size for generation")
    parser.add_argument("--delay", type=int, default=3, help="Delay between batches (seconds)")
    
    args = parser.parse_args()
    asyncio.run(main(args))
