"""
Seed More Celebrate Bundles
Adds 6 new bundles to the celebrate_bundles collection

Created: March 12, 2026
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "thedoggycompany")

# New Celebrate Bundles - Diverse price points & occasions
NEW_CELEBRATE_BUNDLES = [
    {
        "name": "First Birthday Special",
        "slug": "first-birthday-special",
        "pillar": "celebrate",
        "description": "Make their first birthday unforgettable! A complete package with age-appropriate treats, a special '1' cake topper, and keepsake photo props.",
        "short_description": "Everything for baby's first bark-day!",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
        "price": 1299,
        "original_price": 1599,
        "discount_percent": 19,
        "items": [
            {"name": "Mini Pupcake (Peanut Butter)", "quantity": 1},
            {"name": "First Birthday Bandana", "quantity": 1},
            {"name": "Number '1' Cake Topper", "quantity": 1},
            {"name": "Photo Props Set", "quantity": 1},
            {"name": "Puppy-Safe Cookie Pack", "quantity": 1}
        ],
        "tags": ["first-birthday", "puppy", "milestone", "photo-worthy"],
        "badge": "Perfect for Puppies",
        "badge_color": "pink",
        "is_featured": True,
        "is_active": True,
        "sort_order": 3,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Premium Bark-day Bash",
        "slug": "premium-bark-day-bash",
        "pillar": "celebrate",
        "description": "Go all out with our premium celebration! Includes a 2-tier custom cake, gourmet treats, premium party decorations, and matching pet-parent accessories.",
        "short_description": "The ultimate luxury celebration experience",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
        "price": 2999,
        "original_price": 3799,
        "discount_percent": 21,
        "items": [
            {"name": "2-Tier Custom Cake", "quantity": 1},
            {"name": "Gourmet Treat Assortment (12 pcs)", "quantity": 1},
            {"name": "Premium Party Decoration Kit", "quantity": 1},
            {"name": "Birthday Crown & Bow Tie Set", "quantity": 1},
            {"name": "Pet-Parent Matching T-Shirt", "quantity": 1},
            {"name": "Photo Frame (Personalized)", "quantity": 1}
        ],
        "tags": ["premium", "luxury", "birthday", "gift"],
        "badge": "Bestseller",
        "badge_color": "gold",
        "is_featured": True,
        "is_active": True,
        "sort_order": 4,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Pawty Essentials",
        "slug": "pawty-essentials",
        "pillar": "celebrate",
        "description": "Budget-friendly celebration starter pack! Perfect for intimate celebrations with your fur baby. Includes essentials for a memorable day.",
        "short_description": "Simple celebration, big memories",
        "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop",
        "price": 799,
        "original_price": 999,
        "discount_percent": 20,
        "items": [
            {"name": "Mini Celebration Cake", "quantity": 1},
            {"name": "Birthday Bandana", "quantity": 1},
            {"name": "Treat Pack (6 pcs)", "quantity": 1},
            {"name": "Birthday Card", "quantity": 1}
        ],
        "tags": ["budget", "essentials", "birthday", "starter"],
        "badge": "Value Pick",
        "badge_color": "green",
        "is_featured": True,
        "is_active": True,
        "sort_order": 5,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Senior Celebration",
        "slug": "senior-celebration",
        "pillar": "celebrate",
        "description": "Celebrate your wise old friend with age-appropriate, gentle treats and a dignified celebration setup. Sugar-free, soft-textured options included.",
        "short_description": "Honoring years of unconditional love",
        "image": "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=400&fit=crop",
        "price": 1499,
        "original_price": 1899,
        "discount_percent": 21,
        "items": [
            {"name": "Sugar-Free Celebration Cake", "quantity": 1},
            {"name": "Soft-Baked Treats (8 pcs)", "quantity": 1},
            {"name": "Cozy Birthday Blanket", "quantity": 1},
            {"name": "Golden Years Crown", "quantity": 1},
            {"name": "Memory Photo Book (DIY)", "quantity": 1}
        ],
        "tags": ["senior", "gentle", "sugar-free", "milestone"],
        "badge": "Senior Friendly",
        "badge_color": "purple",
        "is_featured": True,
        "is_active": True,
        "sort_order": 6,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Adoption Anniversary",
        "slug": "adoption-anniversary",
        "pillar": "celebrate",
        "description": "Celebrate the day your life changed forever! Special 'Gotcha Day' themed bundle with adoption anniversary certificate and rescue-themed goodies.",
        "short_description": "Celebrating forever homes",
        "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop",
        "price": 1199,
        "original_price": 1499,
        "discount_percent": 20,
        "items": [
            {"name": "Gotcha Day Cake", "quantity": 1},
            {"name": "Rescue Hero Bandana", "quantity": 1},
            {"name": "Adoption Certificate Frame", "quantity": 1},
            {"name": "Special Treat Box", "quantity": 1},
            {"name": "Photo Props (Adoption Theme)", "quantity": 1}
        ],
        "tags": ["adoption", "rescue", "gotcha-day", "anniversary"],
        "badge": "Rescue Heroes",
        "badge_color": "blue",
        "is_featured": True,
        "is_active": True,
        "sort_order": 7,
        "created_at": datetime.utcnow()
    },
    {
        "name": "New Puppy Welcome",
        "slug": "new-puppy-welcome",
        "pillar": "celebrate",
        "description": "Welcome your new family member in style! Perfect for introducing your puppy to their forever home with treats, toys, and celebration essentials.",
        "short_description": "First day, first celebration!",
        "image": "https://images.unsplash.com/photo-1592754862816-1a21a4ea2281?w=600&h=400&fit=crop",
        "price": 1099,
        "original_price": 1399,
        "discount_percent": 21,
        "items": [
            {"name": "Welcome Home Pupcake", "quantity": 1},
            {"name": "First Day Bandana", "quantity": 1},
            {"name": "Puppy-Safe Soft Toy", "quantity": 1},
            {"name": "Teething Treats (6 pcs)", "quantity": 1},
            {"name": "Welcome Card & Certificate", "quantity": 1}
        ],
        "tags": ["puppy", "welcome", "new-pet", "adoption"],
        "badge": "New Arrivals",
        "badge_color": "cyan",
        "is_featured": True,
        "is_active": True,
        "sort_order": 8,
        "created_at": datetime.utcnow()
    }
]


async def seed_bundles():
    """Add new bundles to the celebrate_bundles collection"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🎂 Adding new Celebrate Bundles...")
    
    # Check existing bundles
    existing = await db.celebrate_bundles.count_documents({})
    print(f"   Current bundles: {existing}")
    
    # Insert new bundles (avoid duplicates by checking slug)
    added = 0
    for bundle in NEW_CELEBRATE_BUNDLES:
        existing_bundle = await db.celebrate_bundles.find_one({"slug": bundle["slug"]})
        if not existing_bundle:
            await db.celebrate_bundles.insert_one(bundle)
            print(f"   ✅ Added: {bundle['name']}")
            added += 1
        else:
            print(f"   ⏭️ Skipped (exists): {bundle['name']}")
    
    # Final count
    final_count = await db.celebrate_bundles.count_documents({})
    print(f"\n🎉 Total bundles now: {final_count} (+{added} new)")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_bundles())
