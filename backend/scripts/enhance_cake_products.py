"""
Cake Product Enhancement Script
================================
Enhances cake products with:
- Fresh delivery cities (Bangalore, Mumbai, Delhi NCR)
- Comprehensive tagging (life stage, occasion, dietary, protein, etc.)
- Better descriptions and titles
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME') or 'test_database'

# Cities where fresh cakes are available
FRESH_CAKE_CITIES = ['bangalore', 'bengaluru', 'mumbai', 'delhi', 'gurgaon', 'gurugram', 'noida', 'delhi ncr']

# Tag categories for cakes
TAG_SCHEMA = {
    "life_stage_tags": [
        "Puppy Friendly",
        "Adult Dog",
        "Senior Dog",
        "All Ages"
    ],
    "occasion_tags": [
        "Birthday",
        "Gotcha Day",
        "Adoption Anniversary",
        "Puppy Milestone",
        "Senior Milestone",
        "Recovery / Get Well",
        "Just Because",
        "Valentine's Day",
        "Diwali",
        "Christmas",
        "New Year"
    ],
    "dietary_tags": [
        "Grain-Free",
        "Gluten-Free",
        "Low Sugar",
        "No Added Sugar",
        "Sensitive Stomach",
        "Weight Watch",
        "Limited Ingredient",
        "Vet-Friendly"
    ],
    "protein_tags": [
        "Chicken",
        "Lamb",
        "Fish",
        "Egg",
        "Peanut Butter",
        "No Meat"
    ],
    "ingredient_tags": [
        "Carrot",
        "Apple",
        "Oats",
        "Pumpkin",
        "Banana",
        "Coconut",
        "Cheeku",
        "Mango",
        "Ragi",
        "Blueberry",
        "Strawberry",
        "Sweet Potato"
    ],
    "size_suitability_tags": [
        "Small Breed Friendly",
        "Medium Breed Friendly",
        "Large Breed Friendly",
        "All Breed Friendly"
    ],
    "texture_tags": [
        "Soft Texture",
        "Semi-Soft",
        "Easy to Chew",
        "Layered Cake",
        "Single Tier",
        "Smash Cake"
    ],
    "customisation_tags": [
        "Custom Name",
        "Custom Age",
        "Photo Cake",
        "Message Plaque",
        "Giftable",
        "Party-Ready"
    ],
    "storage_tags": [
        "Fresh Cake",
        "Refrigerated",
        "Consume Within 24 Hours",
        "Consume Within 48 Hours",
        "Party Day Only",
        "Shelf Stable"
    ],
    "vibe_tags": [
        "Celebration Classic",
        "Wholesome",
        "Indulgent",
        "Gentle",
        "Comfort",
        "Premium"
    ]
}

# Sample cake enhancements - real data should come from TDB
CAKE_ENHANCEMENTS = {
    "Kawaii Woofy Cake": {
        "enhanced_title": "Kawaii Woofy Birthday Cake",
        "enhanced_description": "An adorable Japanese-inspired birthday cake that'll make your pup feel extra special. Made with wholesome, dog-safe ingredients and decorated with cute kawaii elements. Perfect for Instagram-worthy celebrations!",
        "life_stage_tags": ["Adult Dog", "All Ages"],
        "occasion_tags": ["Birthday", "Just Because"],
        "dietary_tags": ["No Added Sugar"],
        "size_suitability_tags": ["All Breed Friendly"],
        "texture_tags": ["Soft Texture", "Single Tier"],
        "customisation_tags": ["Custom Name", "Giftable", "Party-Ready"],
        "storage_tags": ["Fresh Cake", "Refrigerated", "Consume Within 48 Hours"],
        "vibe_tags": ["Celebration Classic", "Wholesome"],
        "fresh_delivery_cities": ["bangalore", "mumbai", "delhi ncr"],
        "is_pan_india": False
    },
    "Tailored Peanut Butter Cake": {
        "enhanced_title": "Peanut Butter Delight Dog Cake",
        "enhanced_description": "A rich, creamy peanut butter cake that dogs absolutely adore. Made with natural peanut butter (xylitol-free), whole wheat flour, and a touch of honey. Ships pan-India in our special cold packaging.",
        "life_stage_tags": ["Adult Dog", "All Ages"],
        "occasion_tags": ["Birthday", "Gotcha Day", "Just Because"],
        "protein_tags": ["Peanut Butter"],
        "dietary_tags": ["No Added Sugar", "Vet-Friendly"],
        "size_suitability_tags": ["All Breed Friendly"],
        "texture_tags": ["Soft Texture"],
        "customisation_tags": ["Custom Name", "Custom Age", "Giftable"],
        "storage_tags": ["Shelf Stable", "Consume Within 48 Hours"],
        "vibe_tags": ["Indulgent", "Wholesome"],
        "is_pan_india": True
    },
    "Chicken Delight Doggo Cake": {
        "enhanced_title": "Chicken Delight Savoury Dog Cake",
        "enhanced_description": "A protein-packed savoury cake made with real shredded chicken, carrots, and oats. Perfect for dogs who prefer savoury over sweet. A hearty celebration meal they'll love!",
        "life_stage_tags": ["Adult Dog", "Senior Dog"],
        "occasion_tags": ["Birthday", "Recovery / Get Well"],
        "protein_tags": ["Chicken"],
        "ingredient_tags": ["Carrot", "Oats"],
        "dietary_tags": ["Grain-Free", "Vet-Friendly"],
        "size_suitability_tags": ["All Breed Friendly"],
        "texture_tags": ["Soft Texture", "Easy to Chew"],
        "customisation_tags": ["Custom Name", "Party-Ready"],
        "storage_tags": ["Fresh Cake", "Refrigerated", "Consume Within 24 Hours"],
        "vibe_tags": ["Wholesome", "Comfort"],
        "fresh_delivery_cities": ["bangalore", "mumbai", "delhi ncr"],
        "is_pan_india": False
    }
}


async def enhance_cake_products():
    """Enhance cake products with comprehensive tags and availability data."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🎂 Starting Cake Product Enhancement...")
    print(f"Database: {DB_NAME}")
    
    # Get all cake products
    cake_categories = ['cakes', 'breed-cakes', 'mini-cakes', 'pupcakes', 'dognuts']
    cakes = await db.products.find({
        '$or': [
            {'category': {'$in': cake_categories}},
            {'parent_category': 'celebrations'}
        ]
    }).to_list(200)
    
    print(f"\n📦 Found {len(cakes)} cake/celebration products")
    
    enhanced_count = 0
    for cake in cakes:
        name = cake.get('name', '')
        
        # Check if we have specific enhancements for this cake
        enhancement = CAKE_ENHANCEMENTS.get(name, {})
        
        # Build update document
        update = {
            "enhanced_at": datetime.now(timezone.utc).isoformat(),
            "pillar": "celebrate",
            "product_type": "cake" if 'cake' in cake.get('category', '').lower() else "treat"
        }
        
        # Add fresh delivery cities based on current is_pan_india_shippable
        if not cake.get('is_pan_india_shippable', False):
            update["fresh_delivery_cities"] = enhancement.get("fresh_delivery_cities", ["bangalore", "mumbai", "delhi ncr"])
            update["is_fresh_only"] = True
        else:
            update["fresh_delivery_cities"] = []
            update["is_fresh_only"] = False
        
        # Add default tags if not already present
        if not cake.get('life_stage_tags'):
            update["life_stage_tags"] = enhancement.get("life_stage_tags", ["All Ages"])
        
        if not cake.get('occasion_tags'):
            update["occasion_tags"] = enhancement.get("occasion_tags", ["Birthday", "Just Because"])
        
        if not cake.get('size_suitability_tags'):
            update["size_suitability_tags"] = enhancement.get("size_suitability_tags", ["All Breed Friendly"])
        
        if not cake.get('texture_tags'):
            update["texture_tags"] = enhancement.get("texture_tags", ["Soft Texture"])
        
        if not cake.get('storage_tags'):
            is_fresh = not cake.get('is_pan_india_shippable', False)
            update["storage_tags"] = enhancement.get("storage_tags", 
                ["Fresh Cake", "Refrigerated", "Consume Within 48 Hours"] if is_fresh 
                else ["Shelf Stable"])
        
        # Add enhanced title/description if available
        if enhancement.get("enhanced_title"):
            update["enhanced_title"] = enhancement["enhanced_title"]
        if enhancement.get("enhanced_description"):
            update["enhanced_description"] = enhancement["enhanced_description"]
        
        # Apply specific enhancements if available
        for tag_type in ['dietary_tags', 'protein_tags', 'ingredient_tags', 'customisation_tags', 'vibe_tags']:
            if enhancement.get(tag_type):
                update[tag_type] = enhancement[tag_type]
        
        # Update the product
        await db.products.update_one(
            {"_id": cake["_id"]},
            {"$set": update}
        )
        enhanced_count += 1
        print(f"  ✓ Enhanced: {name[:50]}")
    
    # Save tag schema to config
    await db.config.update_one(
        {"type": "cake_tag_schema"},
        {"$set": {
            "type": "cake_tag_schema",
            "schema": TAG_SCHEMA,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    print(f"\n✅ Enhanced {enhanced_count} products")
    print(f"✅ Saved tag schema to config collection")
    
    client.close()


async def main():
    await enhance_cake_products()


if __name__ == "__main__":
    asyncio.run(main())
