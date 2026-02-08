"""
AI-Powered Product Tagging Script
Uses AI to analyze product names and descriptions to assign semantic intent tags.
This ensures E032 Semantic Product Search works correctly.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Semantic intent tags mapping
SEMANTIC_INTENT_TAGS = {
    "calm_anxiety": {
        "keywords": ["calm", "anxiety", "stress", "relax", "soothing", "nervous", "thunder", "firework", "noise"],
        "tags": ["calming", "anti-anxiety", "relaxing", "soothing", "stress-relief"]
    },
    "skin_coat": {
        "keywords": ["skin", "coat", "fur", "shampoo", "conditioner", "grooming", "moistur", "itch", "scratch", "shed", "bath"],
        "tags": ["skin", "coat", "fur", "moisturizing", "anti-itch", "grooming"]
    },
    "digestion_gut": {
        "keywords": ["digest", "stomach", "tummy", "probiotic", "gut", "sensitive", "fiber"],
        "tags": ["digestive", "probiotic", "gut-health", "sensitive"]
    },
    "joint_mobility": {
        "keywords": ["joint", "hip", "mobility", "senior", "glucosamine", "arthritis", "movement", "flex"],
        "tags": ["joint", "mobility", "senior", "glucosamine", "hip"]
    },
    "dental_oral": {
        "keywords": ["dental", "teeth", "tooth", "breath", "oral", "chew", "tartar", "plaque", "gum"],
        "tags": ["dental", "teeth", "oral", "breath"]
    },
    "training_behavior": {
        "keywords": ["train", "reward", "treat", "small", "bite", "behavior", "obedience"],
        "tags": ["training", "reward", "small-bites"]
    },
    "travel_adventure": {
        "keywords": ["travel", "portable", "outdoor", "carrier", "adventure", "trip", "car"],
        "tags": ["travel", "portable", "outdoor"]
    },
    "birthday_celebration": {
        "keywords": ["birthday", "cake", "celebration", "party", "special", "gift", "box", "pupcake"],
        "tags": ["birthday", "celebration", "party", "special", "gift"]
    },
    "puppy_essentials": {
        "keywords": ["puppy", "starter", "essential", "beginner", "new", "young"],
        "tags": ["puppy", "starter", "essential", "beginner"]
    },
    "senior_care": {
        "keywords": ["senior", "old", "aging", "mature", "gentle", "elder"],
        "tags": ["senior", "aging", "mature", "gentle"]
    },
    "weight_fitness": {
        "keywords": ["diet", "weight", "low-calorie", "lite", "light", "healthy", "fitness", "slim"],
        "tags": ["low-calorie", "diet", "fitness", "weight-management"]
    },
    "play_enrichment": {
        "keywords": ["toy", "play", "puzzle", "interactive", "enrichment", "fun", "ball", "rope", "squeaky"],
        "tags": ["toy", "interactive", "puzzle", "enrichment"]
    },
    "everyday_treats": {
        "keywords": ["treat", "snack", "biscuit", "cookie", "jerky", "chew"],
        "tags": ["everyday", "treats", "snacks"]
    }
}


def analyze_product_for_intents(product):
    """
    Analyze a product's name and description to determine which semantic intents it matches.
    Returns a list of tags to add.
    """
    name = (product.get("name", "") or "").lower()
    description = (product.get("description", "") or "").lower()
    category = (product.get("category", "") or "").lower()
    existing_tags = [t.lower() for t in product.get("tags", [])]
    
    text = f"{name} {description} {category} {' '.join(existing_tags)}"
    
    matched_tags = set()
    matched_intents = []
    
    for intent_name, intent_config in SEMANTIC_INTENT_TAGS.items():
        for keyword in intent_config["keywords"]:
            if keyword in text:
                matched_tags.update(intent_config["tags"])
                if intent_name not in matched_intents:
                    matched_intents.append(intent_name)
                break
    
    return list(matched_tags), matched_intents


async def tag_all_products():
    """
    Main function to tag all products in the database.
    """
    # Connect to MongoDB
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "thedoggycompany")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 60)
    print("AI Product Tagging - Starting...")
    print("=" * 60)
    
    # Get all products from products_master collection
    products = await db.products_master.find({}).to_list(1000)
    print(f"Found {len(products)} products to analyze")
    
    updated_count = 0
    skipped_count = 0
    
    for product in products:
        product_id = product.get("id") or str(product.get("_id"))
        product_name = product.get("name", "Unknown")
        existing_tags = product.get("tags", [])
        
        # Analyze product
        new_tags, matched_intents = analyze_product_for_intents(product)
        
        if not new_tags:
            skipped_count += 1
            continue
        
        # Merge with existing tags (avoid duplicates)
        all_tags = list(set([t.lower() for t in existing_tags] + [t.lower() for t in new_tags]))
        
        # Store semantic_intents for better matching
        update_data = {
            "semantic_tags": new_tags,
            "semantic_intents": matched_intents,
            "tags": all_tags
        }
        
        # Update in database
        result = await db.products_master.update_one(
            {"id": product_id} if product.get("id") else {"_id": product["_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"  ✓ {product_name[:40]:<40} → Intents: {matched_intents}")
        else:
            skipped_count += 1
    
    print("=" * 60)
    print(f"COMPLETE: {updated_count} products tagged, {skipped_count} skipped")
    print("=" * 60)
    
    # Also update care_bundles
    bundles = await db.care_bundles.find({}).to_list(100)
    print(f"\nTagging {len(bundles)} bundles...")
    
    for bundle in bundles:
        bundle_name = bundle.get("name", "Unknown")
        new_tags, matched_intents = analyze_product_for_intents(bundle)
        
        if new_tags:
            await db.care_bundles.update_one(
                {"_id": bundle["_id"]},
                {"$set": {"semantic_tags": new_tags, "semantic_intents": matched_intents}}
            )
            print(f"  ✓ Bundle: {bundle_name[:40]:<40} → {matched_intents}")
    
    print("\nAI Product Tagging Complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(tag_all_products())
