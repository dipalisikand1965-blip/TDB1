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
    },
    # NEW: Fashion & Accessories
    "fashion_wearables": {
        "keywords": ["collar", "bandana", "bow", "harness", "leash", "dress", "costume", "jacket", "sweater", "hoodie", "raincoat", "boots", "wearable"],
        "tags": ["fashion", "wearable", "collar", "bandana", "harness", "outfit"]
    },
    "dining_cafe": {
        "keywords": ["dine", "cafe", "restaurant", "outing", "meal", "food", "fresh-meal", "bowl", "feeder"],
        "tags": ["dining", "cafe", "meal", "bowl", "feeder"]
    },
    "home_decor": {
        "keywords": ["magnet", "coaster", "frame", "poster", "decor", "home", "fridge", "mug", "gift"],
        "tags": ["home", "decor", "gift", "accessory"]
    },
    "safety_id": {
        "keywords": ["id tag", "name tag", "engrav", "microchip", "gps", "tracker", "safety", "lost", "found"],
        "tags": ["safety", "id", "tag", "tracking"]
    },
    "fresh_food": {
        "keywords": ["fresh", "meal", "chicken", "veggies", "lamb", "fish", "rice", "homemade", "cooked"],
        "tags": ["fresh-food", "meal", "homemade", "natural"]
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
    Main function to tag all products, services, experiences, bundles in the database.
    """
    # Connect to MongoDB
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "thedoggycompany")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 60)
    print("AI SEMANTIC TAGGING - Starting...")
    print("=" * 60)
    
    # ═══════════════════════════════════════════════════════════
    # TAG PRODUCTS
    # ═══════════════════════════════════════════════════════════
    products = await db.products_master.find({}).to_list(3000)
    print(f"\n[PRODUCTS] Found {len(products)} products to analyze")
    
    updated_count = 0
    for product in products:
        product_id = product.get("id") or str(product.get("_id"))
        product_name = product.get("name", "Unknown")
        existing_tags = product.get("tags", [])
        
        new_tags, matched_intents = analyze_product_for_intents(product)
        
        if not new_tags:
            continue
        
        all_tags = list(set([t.lower() for t in existing_tags] + [t.lower() for t in new_tags]))
        
        result = await db.products_master.update_one(
            {"id": product_id} if product.get("id") else {"_id": product["_id"]},
            {"$set": {"semantic_tags": new_tags, "semantic_intents": matched_intents, "tags": all_tags}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
    
    print(f"[PRODUCTS] Tagged: {updated_count}")
    
    # ═══════════════════════════════════════════════════════════
    # TAG SERVICES
    # ═══════════════════════════════════════════════════════════
    services = await db.services.find({}).to_list(3000)
    print(f"\n[SERVICES] Found {len(services)} services to analyze")
    
    service_updated = 0
    for service in services:
        new_tags, matched_intents = analyze_product_for_intents(service)
        
        if new_tags:
            await db.services.update_one(
                {"_id": service["_id"]},
                {"$set": {"semantic_tags": new_tags, "semantic_intents": matched_intents}}
            )
            service_updated += 1
    
    print(f"[SERVICES] Tagged: {service_updated}")
    
    # ═══════════════════════════════════════════════════════════
    # TAG EXPERIENCES
    # ═══════════════════════════════════════════════════════════
    experiences = await db.enjoy_experiences.find({}).to_list(100)
    print(f"\n[EXPERIENCES] Found {len(experiences)} experiences to analyze")
    
    exp_updated = 0
    for exp in experiences:
        new_tags, matched_intents = analyze_product_for_intents(exp)
        
        if new_tags:
            await db.enjoy_experiences.update_one(
                {"_id": exp["_id"]},
                {"$set": {"semantic_tags": new_tags, "semantic_intents": matched_intents}}
            )
            exp_updated += 1
    
    print(f"[EXPERIENCES] Tagged: {exp_updated}")
    
    # ═══════════════════════════════════════════════════════════
    # TAG BUNDLES
    # ═══════════════════════════════════════════════════════════
    bundles = await db.care_bundles.find({}).to_list(100)
    print(f"\n[BUNDLES] Found {len(bundles)} bundles to analyze")
    
    bundle_updated = 0
    for bundle in bundles:
        new_tags, matched_intents = analyze_product_for_intents(bundle)
        
        if new_tags:
            await db.care_bundles.update_one(
                {"_id": bundle["_id"]},
                {"$set": {"semantic_tags": new_tags, "semantic_intents": matched_intents}}
            )
            bundle_updated += 1
    
    print(f"[BUNDLES] Tagged: {bundle_updated}")
    
    # ═══════════════════════════════════════════════════════════
    # TAG RESTAURANTS (pet-friendly dining)
    # ═══════════════════════════════════════════════════════════
    restaurants = await db.restaurants.find({}).to_list(500)
    print(f"\n[RESTAURANTS] Found {len(restaurants)} restaurants")
    
    rest_updated = 0
    for rest in restaurants:
        # All restaurants get travel/adventure tags
        await db.restaurants.update_one(
            {"_id": rest["_id"]},
            {"$set": {
                "semantic_tags": ["pet-friendly", "dining", "outdoor", "travel"],
                "semantic_intents": ["travel_adventure"],
                "verified": rest.get("verified", False)
            }}
        )
        rest_updated += 1
    
    print(f"[RESTAURANTS] Tagged: {rest_updated}")
    
    # ═══════════════════════════════════════════════════════════
    # TAG PET-FRIENDLY STAYS
    # ═══════════════════════════════════════════════════════════
    stays = await db.pet_friendly_stays.find({}).to_list(500)
    print(f"\n[STAYS] Found {len(stays)} pet-friendly stays")
    
    stays_updated = 0
    for stay in stays:
        await db.pet_friendly_stays.update_one(
            {"_id": stay["_id"]},
            {"$set": {
                "semantic_tags": ["pet-friendly", "accommodation", "travel", "vacation"],
                "semantic_intents": ["travel_adventure"],
                "verified": stay.get("verified", False)
            }}
        )
        stays_updated += 1
    
    print(f"[STAYS] Tagged: {stays_updated}")
    
    print("\n" + "=" * 60)
    print("AI SEMANTIC TAGGING COMPLETE!")
    print("=" * 60)
    client.close()


if __name__ == "__main__":
    asyncio.run(tag_all_products())
