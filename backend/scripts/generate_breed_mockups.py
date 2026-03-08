"""
Breed Product Mockup Generator Script
======================================
Generates product mockups for ALL breeds and ALL product types.
33 breeds × 12 products = 396 mockups

Run this script once to generate all mockups and seed products.
"""

import asyncio
import os
import json
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# BREED DATA (33 breeds)
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
    {"key": "samoyed", "name": "Samoyed", "short": "Samoyed"},
    {"key": "pomeranian", "name": "Pomeranian", "short": "Pomeranian"},
    {"key": "indian_spitz", "name": "Indian Spitz", "short": "Indian Spitz"},
    {"key": "akita", "name": "Akita", "short": "Akita"},
    {"key": "shih_tzu", "name": "Shih Tzu", "short": "Shih Tzu"},
    {"key": "lhasa_apso", "name": "Lhasa Apso", "short": "Lhasa Apso"},
    {"key": "poodle", "name": "Poodle", "short": "Poodle"},
    {"key": "maltese", "name": "Maltese", "short": "Maltese"},
    {"key": "bichon_frise", "name": "Bichon Frise", "short": "Bichon Frise"},
    {"key": "pug", "name": "Pug", "short": "Pug"},
    {"key": "french_bulldog", "name": "French Bulldog", "short": "French Bulldog"},
    {"key": "english_bulldog", "name": "English Bulldog", "short": "English Bulldog"},
    {"key": "beagle", "name": "Beagle", "short": "Beagle"},
    {"key": "dachshund", "name": "Dachshund", "short": "Dachshund"},
    {"key": "chihuahua", "name": "Chihuahua", "short": "Chihuahua"},
    {"key": "shiba_inu", "name": "Shiba Inu", "short": "Shiba Inu"},
    {"key": "corgi", "name": "Corgi", "short": "Corgi"},
    {"key": "border_collie", "name": "Border Collie", "short": "Border Collie"},
    {"key": "dalmatian", "name": "Dalmatian", "short": "Dalmatian"},
    {"key": "jack_russell", "name": "Jack Russell Terrier", "short": "Jack Russell"},
    {"key": "indie", "name": "Indian Pariah Dog", "short": "Indie"},
]

# ═══════════════════════════════════════════════════════════════════════════
# PRODUCT TYPES (12 types)
# ═══════════════════════════════════════════════════════════════════════════

PRODUCT_TYPES = [
    {
        "type": "cake",
        "name_template": "{breed} Birthday Cake",
        "pillar": "celebrate",
        "price": 899,
        "prompt": "A beautiful artisan dog birthday cake on an elegant cake stand. The cake features a soulful watercolor illustration of a {breed_full} dog as an edible cake topper. The cake is decorated with dog-safe cream frosting, paw print designs, and has 'Happy Birthday' written in purple icing. Professional food photography, celebration theme, warm lighting.",
        "customizations": ["pet_name", "age", "message"]
    },
    {
        "type": "keychain",
        "name_template": "{breed} Keychain",
        "pillar": "celebrate",
        "price": 299,
        "prompt": "A premium silver metal keychain with a circular pendant photographed on clean white background. The pendant features a beautiful soulful watercolor illustration of a {breed_full} dog face. The watercolor style is soft, emotional, artistic - not cartoonish. Professional product photography, shiny metal surface. High-end pet accessory.",
        "customizations": ["pet_name"]
    },
    {
        "type": "photo_frame",
        "name_template": "{breed} Photo Frame",
        "pillar": "celebrate",
        "price": 799,
        "prompt": "An elegant white wood photo frame photographed on a clean wall. The frame contains a soulful watercolor portrait illustration of a {breed_full} dog - warm colors, gentle expression, artistic style. Below the portrait is space for a pet name in elegant script. Professional product photography, premium home decor item.",
        "customizations": ["pet_name", "custom_quote"]
    },
    {
        "type": "party_hat",
        "name_template": "{breed} Party Hat",
        "pillar": "celebrate",
        "price": 199,
        "prompt": "A festive dog party hat cone photographed on clean white background. The hat features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on the fabric. Colorful but elegant design with purple and gold accents. Professional product photography, celebration theme.",
        "customizations": ["pet_name"]
    },
    {
        "type": "bandana",
        "name_template": "{breed} Bandana",
        "pillar": "celebrate",
        "price": 399,
        "prompt": "A premium white cotton pet bandana laid flat on clean white background. The bandana features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on the fabric. The watercolor style is soft, emotional, artistic. Professional product photography, soft fabric texture visible. High-end pet accessory.",
        "customizations": ["pet_name", "size", "custom_saying"]
    },
    {
        "type": "mug",
        "name_template": "{breed} Lover Mug",
        "pillar": "celebrate",
        "price": 499,
        "prompt": "A premium white ceramic coffee mug photographed on clean white background. The mug features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on its side. The watercolor style is soft, emotional, artistic - not cartoonish. Professional product photography with soft shadows. The illustration wraps naturally around the mug surface.",
        "customizations": ["pet_name", "custom_text"]
    },
    {
        "type": "mat",
        "name_template": "{breed} Welcome Mat",
        "pillar": "stay",
        "price": 1199,
        "prompt": "A premium coir doormat photographed from above on clean floor. The mat features a beautiful soulful watercolor illustration of a {breed_full} dog face in the center. Below the illustration is the word 'WELCOME' in elegant black lettering. The watercolor style is soft, emotional, not cartoonish. Professional product photography.",
        "customizations": ["pet_name", "custom_text"]
    },
    {
        "type": "bowl",
        "name_template": "{breed} Food Bowl",
        "pillar": "dine",
        "price": 599,
        "prompt": "A premium stainless steel pet food bowl photographed from above on clean white background. The bowl features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on the inside bottom. The watercolor style is soft and emotional, not cartoonish. Professional product photography.",
        "customizations": ["pet_name"]
    },
    {
        "type": "collar",
        "name_template": "{breed} Collar Tag",
        "pillar": "care",
        "price": 349,
        "prompt": "A premium leather dog collar with a beautiful metal ID tag photographed on clean background. The tag features a small soulful watercolor illustration of a {breed_full} dog silhouette. Space for pet name engraving. Professional product photography, high-quality pet accessory, elegant design.",
        "customizations": ["pet_name", "phone_number"]
    },
    {
        "type": "toy",
        "name_template": "{breed} Plush Toy",
        "pillar": "celebrate",
        "price": 499,
        "prompt": "A premium soft plush toy dog photographed on clean white background. The plush toy is designed to look like a {breed_full} dog in a cute, cuddly style while maintaining the soulful watercolor aesthetic - soft colors, gentle expression. Professional product photography, premium quality stuffed animal.",
        "customizations": []
    },
    {
        "type": "treat_jar",
        "name_template": "{breed} Treat Jar",
        "pillar": "dine",
        "price": 649,
        "prompt": "A premium glass treat jar with wooden lid photographed on clean background. The jar features a beautiful soulful watercolor illustration of a {breed_full} dog face printed on the glass. Text reads 'TREATS' in elegant lettering. Professional product photography, premium pet storage accessory.",
        "customizations": ["pet_name"]
    },
    {
        "type": "blanket",
        "name_template": "{breed} Cozy Blanket",
        "pillar": "stay",
        "price": 999,
        "prompt": "A premium soft fleece blanket draped elegantly, photographed on clean background. The blanket features a large, beautiful soulful watercolor illustration of a {breed_full} dog printed on the fabric. Soft, cozy texture visible. The watercolor style is warm and emotional. Professional product photography.",
        "customizations": ["pet_name", "size"]
    },
]

# ═══════════════════════════════════════════════════════════════════════════
# CUSTOMIZATION OPTIONS
# ═══════════════════════════════════════════════════════════════════════════

CUSTOMIZATION_OPTIONS = {
    "pet_name": {
        "type": "text",
        "label": "Pet Name",
        "placeholder": "Enter your pet's name",
        "max_length": 20,
        "required": True
    },
    "age": {
        "type": "number",
        "label": "Age",
        "placeholder": "Pet's age",
        "min": 1,
        "max": 25
    },
    "message": {
        "type": "text",
        "label": "Cake Message",
        "placeholder": "Happy Birthday [Name]!",
        "max_length": 50
    },
    "custom_quote": {
        "type": "text",
        "label": "Custom Quote",
        "placeholder": "Forever in our hearts",
        "max_length": 100
    },
    "size": {
        "type": "select",
        "label": "Size",
        "options": [
            {"value": "S", "label": "Small"},
            {"value": "M", "label": "Medium"},
            {"value": "L", "label": "Large"},
            {"value": "XL", "label": "Extra Large"}
        ]
    },
    "custom_saying": {
        "type": "select",
        "label": "Custom Saying",
        "options": [
            {"value": "none", "label": "No text"},
            {"value": "best_dog", "label": "Best Dog Ever"},
            {"value": "fur_baby", "label": "Fur Baby"},
            {"value": "rescue_dog", "label": "Rescue Dog"},
            {"value": "custom", "label": "Custom text..."}
        ]
    },
    "custom_text": {
        "type": "text",
        "label": "Custom Text",
        "placeholder": "Best Dog Mom",
        "max_length": 30
    },
    "phone_number": {
        "type": "text",
        "label": "Phone Number",
        "placeholder": "For ID tag",
        "max_length": 15
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

async def generate_mockup_image(prompt: str, slug: str):
    """Generate a single mockup image using AI."""
    try:
        from emergentintegrations.llm.gemini import GeminiImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return None
        
        image_gen = GeminiImageGeneration(api_key=api_key)
        result = await image_gen.generate_image(
            prompt=prompt,
            model="imagen-3.0-generate-002"
        )
        
        if result and result.get("image_url"):
            logger.info(f"Generated: {slug}")
            return result["image_url"]
        
        return None
    except Exception as e:
        logger.error(f"Error generating {slug}: {e}")
        return None


async def seed_breed_products(db):
    """Seed all 396 breed products (33 breeds × 12 types) into database."""
    
    products_created = 0
    products_data = []
    
    for breed in BREEDS:
        for product_type in PRODUCT_TYPES:
            product_name = product_type["name_template"].format(breed=breed["short"])
            product_id = f"breed-{breed['key']}-{product_type['type']}"
            
            product = {
                "id": product_id,
                "name": product_name,
                "title": product_name,
                "category": f"breed-{product_type['type']}s",
                "pillar": product_type["pillar"],
                "price": product_type["price"],
                "breed": breed["key"],
                "breed_name": breed["name"],
                "product_type": product_type["type"],
                "soul_tier": "soul_made",  # All breed products are Soul Made
                "customizations": product_type["customizations"],
                "customization_options": {
                    k: CUSTOMIZATION_OPTIONS[k] 
                    for k in product_type["customizations"] 
                    if k in CUSTOMIZATION_OPTIONS
                },
                "mockup_prompt": product_type["prompt"].format(breed_full=breed["name"]),
                "mockup_url": None,  # Will be populated by image generation
                "description": f"Beautiful {product_name} featuring soulful watercolor illustration. Personalize with your pet's name.",
                "tags": ["breed-specific", breed["key"], product_type["type"], "personalized", "soul-made"],
                "in_stock": True,
                "created_at": datetime.utcnow().isoformat()
            }
            
            products_data.append(product)
    
    # Insert all products
    for product in products_data:
        await db.breed_products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        products_created += 1
    
    logger.info(f"Seeded {products_created} breed products")
    return products_created


async def generate_all_mockups(db, batch_size=4, delay_between_batches=5):
    """Generate mockup images for all breed products."""
    
    # Get all products without mockups
    products = await db.breed_products.find(
        {"mockup_url": None}
    ).to_list(1000)
    
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
                        {"$set": {"mockup_url": mockup_url}}
                    )
                    generated += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Failed for {product['id']}: {e}")
                failed += 1
        
        # Delay between batches to avoid rate limits
        if i + batch_size < len(products):
            logger.info(f"Processed {i + batch_size}/{len(products)}. Waiting {delay_between_batches}s...")
            await asyncio.sleep(delay_between_batches)
    
    logger.info(f"Generated {generated} mockups, {failed} failed")
    return generated, failed


async def get_stats(db):
    """Get statistics on breed products and mockups."""
    
    total = await db.breed_products.count_documents({})
    with_mockups = await db.breed_products.count_documents({"mockup_url": {"$ne": None}})
    without_mockups = await db.breed_products.count_documents({"mockup_url": None})
    
    # By product type
    pipeline = [
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]
    by_type = await db.breed_products.aggregate(pipeline).to_list(20)
    
    # By breed
    pipeline = [
        {"$group": {"_id": "$breed", "count": {"$sum": 1}}}
    ]
    by_breed = await db.breed_products.aggregate(pipeline).to_list(40)
    
    return {
        "total_products": total,
        "with_mockups": with_mockups,
        "without_mockups": without_mockups,
        "by_product_type": {item["_id"]: item["count"] for item in by_type},
        "by_breed": {item["_id"]: item["count"] for item in by_breed}
    }


async def main():
    """Main entry point."""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client.doggybakery
    
    print("=" * 60)
    print("BREED PRODUCT MOCKUP GENERATOR")
    print("=" * 60)
    print(f"Breeds: {len(BREEDS)}")
    print(f"Product Types: {len(PRODUCT_TYPES)}")
    print(f"Total Products: {len(BREEDS) * len(PRODUCT_TYPES)}")
    print("=" * 60)
    
    # Step 1: Seed products
    print("\n[1/3] Seeding breed products...")
    count = await seed_breed_products(db)
    print(f"    ✓ Seeded {count} products")
    
    # Step 2: Show stats
    print("\n[2/3] Current stats:")
    stats = await get_stats(db)
    print(f"    Total: {stats['total_products']}")
    print(f"    With mockups: {stats['with_mockups']}")
    print(f"    Pending: {stats['without_mockups']}")
    
    # Step 3: Generate mockups (optional - takes time)
    # Uncomment to generate:
    # print("\n[3/3] Generating mockups (this will take a while)...")
    # generated, failed = await generate_all_mockups(db)
    # print(f"    ✓ Generated: {generated}, Failed: {failed}")
    
    print("\n" + "=" * 60)
    print("DONE! Products seeded in 'breed_products' collection")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
