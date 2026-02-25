"""
Seed Dine Essentials - Feeding Tools & Supplements

This script seeds feeding tools and supplements (non-medical) products
into the dine_bundles collection with proper categorization.
"""

import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pet_concierge")

# Feeding Tools Products
FEEDING_TOOLS = [
    {
        "id": "dine-feeding-slowbowl",
        "name": "Slow Feeder Anti-Gulp Bowl",
        "description": "Maze-design bowl to slow down eating and improve digestion. Reduces bloat risk and promotes healthy eating habits.",
        "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
        "bundle_price": 599,
        "original_price": 799,
        "category": "feeding_tools",
        "items": ["Slow Feeder Bowl (Large)", "Non-slip Base", "Food Guide"],
        "for_occasion": "daily",
        "discount_percent": 25,
        "featured": True,
        "active": True,
        "tags": ["feeding", "bowl", "slow-feeder", "digestion", "essential"]
    },
    {
        "id": "dine-feeding-elevated",
        "name": "Elevated Feeding Station",
        "description": "Ergonomic raised feeding stand with stainless steel bowls. Perfect height reduces neck strain and aids digestion.",
        "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
        "bundle_price": 1299,
        "original_price": 1699,
        "category": "feeding_tools",
        "items": ["Adjustable Stand", "2x Stainless Steel Bowls", "Anti-slip Mat"],
        "for_occasion": "daily",
        "discount_percent": 24,
        "featured": True,
        "active": True,
        "tags": ["feeding", "elevated", "ergonomic", "senior-friendly", "essential"]
    },
    {
        "id": "dine-feeding-automatic",
        "name": "Smart Auto Feeder Pro",
        "description": "Programmable automatic feeder with portion control. Schedule up to 6 meals daily. App-controlled with voice recording.",
        "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800",
        "bundle_price": 3999,
        "original_price": 4999,
        "category": "feeding_tools",
        "items": ["Smart Feeder Unit", "Power Adapter", "App Access", "Voice Recorder Module"],
        "for_occasion": "daily",
        "discount_percent": 20,
        "featured": True,
        "active": True,
        "tags": ["feeding", "automatic", "smart", "app-controlled", "travel-friendly"]
    },
    {
        "id": "dine-feeding-travel",
        "name": "Travel Feeding Kit",
        "description": "Compact portable feeding set for on-the-go meals. Collapsible bowls, treat pouch, and water bottle in one bag.",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "bundle_price": 899,
        "original_price": 1199,
        "category": "feeding_tools",
        "items": ["2x Collapsible Silicone Bowls", "Treat Pouch", "Portable Water Bottle", "Carrier Bag"],
        "for_occasion": "travel",
        "discount_percent": 25,
        "featured": False,
        "active": True,
        "tags": ["feeding", "travel", "portable", "outdoor", "essential"]
    },
    {
        "id": "dine-feeding-puzzle",
        "name": "Interactive Puzzle Feeder Set",
        "description": "Mental stimulation during mealtime! 3 difficulty levels to challenge and engage your pet while eating.",
        "image": "https://images.unsplash.com/photo-1601758260892-a62c486ace68?w=800",
        "bundle_price": 1199,
        "original_price": 1499,
        "category": "feeding_tools",
        "items": ["Level 1 Puzzle Bowl", "Level 2 Puzzle Mat", "Level 3 Treat Dispenser"],
        "for_occasion": "enrichment",
        "discount_percent": 20,
        "featured": False,
        "active": True,
        "tags": ["feeding", "puzzle", "mental-stimulation", "enrichment", "interactive"]
    },
    {
        "id": "dine-feeding-splashproof",
        "name": "No-Spill Water Station",
        "description": "Anti-splash water bowl with floating disk technology. Keeps floor dry and water fresh all day.",
        "image": "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=800",
        "bundle_price": 799,
        "original_price": 999,
        "category": "feeding_tools",
        "items": ["No-Spill Bowl", "Floating Disk", "Silicone Mat", "Cleaning Brush"],
        "for_occasion": "daily",
        "discount_percent": 20,
        "featured": False,
        "active": True,
        "tags": ["feeding", "water", "no-spill", "clean", "essential"]
    }
]

# Supplements (Non-Medical)
SUPPLEMENTS = [
    {
        "id": "dine-supp-multivitamin",
        "name": "Daily Multivitamin Chews",
        "description": "Complete daily nutrition in tasty chicken-flavored chews. Supports overall health, energy, and immune function.",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "bundle_price": 699,
        "original_price": 899,
        "category": "supplements",
        "items": ["90 Chewable Tablets", "Dosage Guide", "Storage Container"],
        "for_occasion": "daily",
        "discount_percent": 22,
        "featured": True,
        "active": True,
        "tags": ["supplements", "vitamins", "daily", "immune", "health"]
    },
    {
        "id": "dine-supp-joint",
        "name": "Joint Health Glucosamine+",
        "description": "Advanced joint support formula with glucosamine, chondroitin, and MSM. Ideal for active and senior dogs.",
        "image": "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800",
        "bundle_price": 1199,
        "original_price": 1499,
        "category": "supplements",
        "items": ["120 Soft Chews", "Joint Care Guide", "Activity Tracker"],
        "for_occasion": "daily",
        "discount_percent": 20,
        "featured": True,
        "active": True,
        "tags": ["supplements", "joint", "glucosamine", "senior", "mobility"]
    },
    {
        "id": "dine-supp-probiotic",
        "name": "Probiotic Digestive Support",
        "description": "6-strain probiotic blend for optimal gut health. Helps with digestion, nutrient absorption, and stool quality.",
        "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
        "bundle_price": 899,
        "original_price": 1199,
        "category": "supplements",
        "items": ["60 Capsules", "Probiotic Guide", "Feeding Schedule"],
        "for_occasion": "daily",
        "discount_percent": 25,
        "featured": True,
        "active": True,
        "tags": ["supplements", "probiotic", "digestion", "gut-health", "daily"]
    },
    {
        "id": "dine-supp-omega",
        "name": "Omega-3 Fish Oil Soft Gels",
        "description": "Premium wild-caught fish oil for coat shine, skin health, and brain function. EPA & DHA rich formula.",
        "image": "https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=800",
        "bundle_price": 799,
        "original_price": 999,
        "category": "supplements",
        "items": ["180 Soft Gels", "Dosage Pump", "Coat Care Tips"],
        "for_occasion": "daily",
        "discount_percent": 20,
        "featured": False,
        "active": True,
        "tags": ["supplements", "omega", "fish-oil", "coat", "skin", "brain"]
    },
    {
        "id": "dine-supp-calming",
        "name": "Calming Stress Relief Chews",
        "description": "Natural calming formula with chamomile, L-theanine, and valerian. Perfect for anxiety, travel, or fireworks.",
        "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
        "bundle_price": 649,
        "original_price": 849,
        "category": "supplements",
        "items": ["90 Calming Chews", "Anxiety Guide", "Soothing Playlist QR"],
        "for_occasion": "stress",
        "discount_percent": 24,
        "featured": False,
        "active": True,
        "tags": ["supplements", "calming", "anxiety", "stress-relief", "natural"]
    },
    {
        "id": "dine-supp-dental",
        "name": "Dental Health Enzyme Powder",
        "description": "Sprinkle-on dental care that fights plaque and freshens breath. No brushing required - just add to food!",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "bundle_price": 549,
        "original_price": 749,
        "category": "supplements",
        "items": ["200g Enzyme Powder", "Measuring Scoop", "Dental Care Guide"],
        "for_occasion": "daily",
        "discount_percent": 27,
        "featured": False,
        "active": True,
        "tags": ["supplements", "dental", "breath", "plaque", "oral-care"]
    }
]

async def seed_dine_essentials():
    """Seed feeding tools and supplements to dine_bundles collection"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc)
    
    all_products = FEEDING_TOOLS + SUPPLEMENTS
    
    print(f"Seeding {len(all_products)} dine essentials products...")
    
    for product in all_products:
        product["created_at"] = now
        product["updated_at"] = now
        product["pillar"] = "dine"
        
        # Upsert the product
        result = await db.dine_bundles.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"  ✓ Created: {product['name']}")
        else:
            print(f"  ↻ Updated: {product['name']}")
    
    # Count totals
    total_feeding = await db.dine_bundles.count_documents({"category": "feeding_tools"})
    total_supplements = await db.dine_bundles.count_documents({"category": "supplements"})
    
    print(f"\n✅ Seeding complete!")
    print(f"   Feeding Tools: {total_feeding}")
    print(f"   Supplements: {total_supplements}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_dine_essentials())
