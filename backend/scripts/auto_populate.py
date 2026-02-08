"""
Auto-Populate Script for Deployment
Runs automatically on deployment to ensure:
1. AI semantic tagging is applied to all products/services
2. Essential seed data is present
3. Collections and configurations are initialized

This script should be run as part of the deployment process.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient


# ═══════════════════════════════════════════════════════════
# SEMANTIC INTENT TAGS (same as tag_products_with_ai.py)
# ═══════════════════════════════════════════════════════════
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
    },
    "boarding_stay": {
        "keywords": ["boarding", "kennel", "daycare", "overnight", "suite", "stay", "pet hotel"],
        "tags": ["boarding", "daycare", "stay", "overnight"]
    },
    "emergency_care": {
        "keywords": ["emergency", "urgent", "poison", "hotline", "transport", "rescue", "24/7"],
        "tags": ["emergency", "urgent", "rescue", "safety"]
    },
    "memorial_farewell": {
        "keywords": ["memorial", "urn", "keepsake", "paw print", "cremation", "farewell", "rainbow bridge", "remembrance"],
        "tags": ["memorial", "farewell", "remembrance", "keepsake"]
    },
    "documentation_legal": {
        "keywords": ["registration", "license", "documentation", "certificate", "kci", "microchip", "insurance", "record"],
        "tags": ["documentation", "legal", "registration", "certificate"]
    },
    "consultation_advice": {
        "keywords": ["consultation", "counseling", "advice", "adoption", "behavior", "nutrition"],
        "tags": ["consultation", "advice", "counseling"]
    },
    "swimming_spa": {
        "keywords": ["swim", "pool", "spa", "hydrotherapy", "water", "aqua"],
        "tags": ["swimming", "spa", "hydrotherapy", "wellness"]
    }
}


def analyze_for_semantic_intents(item):
    """Analyze item for semantic intents based on keywords."""
    name = (item.get("name", "") or "").lower()
    description = (item.get("description", "") or "").lower()
    category = (item.get("category", "") or "").lower()
    existing_tags = [t.lower() for t in item.get("tags", [])]
    
    text = f"{name} {description} {category} {' '.join(existing_tags)}"
    
    matched_intents = []
    
    for intent_name, intent_config in SEMANTIC_INTENT_TAGS.items():
        for keyword in intent_config["keywords"]:
            if keyword in text:
                matched_intents.append(intent_name)
                break
    
    return matched_intents


async def run_ai_semantic_tagging(db):
    """Run AI semantic tagging on all collections."""
    results = {
        "products": 0,
        "services": 0,
        "experiences": 0,
        "bundles": 0,
        "restaurants": 0,
        "stays": 0
    }
    
    print("\n[AI TAGGING] Starting semantic tagging...")
    
    # Tag Products
    products = await db.products_master.find({}).to_list(5000)
    for product in products:
        intents = analyze_for_semantic_intents(product)
        if intents:
            await db.products_master.update_one(
                {"_id": product["_id"]},
                {"$set": {"semantic_intents": intents}}
            )
            results["products"] += 1
    print(f"  [PRODUCTS] Tagged: {results['products']}")
    
    # Tag Services
    services = await db.services.find({}).to_list(5000)
    for service in services:
        intents = analyze_for_semantic_intents(service)
        if intents:
            await db.services.update_one(
                {"_id": service["_id"]},
                {"$set": {"semantic_intents": intents}}
            )
            results["services"] += 1
    print(f"  [SERVICES] Tagged: {results['services']}")
    
    # Tag Experiences
    experiences = await db.enjoy_experiences.find({}).to_list(100)
    for exp in experiences:
        intents = analyze_for_semantic_intents(exp)
        if intents:
            await db.enjoy_experiences.update_one(
                {"_id": exp["_id"]},
                {"$set": {"semantic_intents": intents}}
            )
            results["experiences"] += 1
    print(f"  [EXPERIENCES] Tagged: {results['experiences']}")
    
    # Tag Bundles
    bundles = await db.care_bundles.find({}).to_list(100)
    for bundle in bundles:
        intents = analyze_for_semantic_intents(bundle)
        if intents:
            await db.care_bundles.update_one(
                {"_id": bundle["_id"]},
                {"$set": {"semantic_intents": intents}}
            )
            results["bundles"] += 1
    print(f"  [BUNDLES] Tagged: {results['bundles']}")
    
    # Tag Restaurants
    restaurants = await db.restaurants.find({}).to_list(500)
    for rest in restaurants:
        await db.restaurants.update_one(
            {"_id": rest["_id"]},
            {"$set": {"semantic_intents": ["travel_adventure", "dining_cafe"]}}
        )
        results["restaurants"] += 1
    print(f"  [RESTAURANTS] Tagged: {results['restaurants']}")
    
    # Tag Stays
    stays = await db.pet_friendly_stays.find({}).to_list(500)
    for stay in stays:
        await db.pet_friendly_stays.update_one(
            {"_id": stay["_id"]},
            {"$set": {"semantic_intents": ["travel_adventure", "boarding_stay"]}}
        )
        results["stays"] += 1
    print(f"  [STAYS] Tagged: {results['stays']}")
    
    return results


async def ensure_app_settings(db):
    """Ensure app_settings collection has default values."""
    settings = await db.app_settings.find_one({"key": "global"})
    if not settings:
        await db.app_settings.insert_one({
            "key": "global",
            "ai_tagging_enabled": True,
            "last_ai_tagging": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        print("[APP SETTINGS] Created default settings")
    return True


async def record_deployment(db, results):
    """Record this deployment run."""
    await db.deployment_logs.insert_one({
        "type": "auto_populate",
        "timestamp": datetime.now(timezone.utc),
        "results": results,
        "status": "success"
    })
    print("[DEPLOYMENT LOG] Recorded deployment run")


async def main():
    """Main entry point for auto-populate script."""
    print("=" * 60)
    print("AUTO-POPULATE SCRIPT - DEPLOYMENT")
    print(f"Started at: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "thedoggycompany")
    
    print(f"\n[DB] Connecting to {db_name}...")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    all_results = {}
    
    try:
        # 1. Ensure app settings
        await ensure_app_settings(db)
        
        # 2. Run AI semantic tagging
        tagging_results = await run_ai_semantic_tagging(db)
        all_results["ai_tagging"] = tagging_results
        
        # 3. Update last tagging timestamp
        await db.app_settings.update_one(
            {"key": "global"},
            {"$set": {
                "last_ai_tagging": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # 4. Record deployment
        await record_deployment(db, all_results)
        
        total_tagged = sum(tagging_results.values())
        print("\n" + "=" * 60)
        print(f"AUTO-POPULATE COMPLETE! Total items tagged: {total_tagged}")
        print("=" * 60)
        
        return {"success": True, "results": all_results}
        
    except Exception as e:
        print(f"\n[ERROR] Auto-populate failed: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        client.close()


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result.get("success") else 1)
