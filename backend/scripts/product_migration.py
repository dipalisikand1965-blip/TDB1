"""
Product Architecture Migration Script
=====================================
Consolidates products, adds hierarchy, fixes missing data.

Run with: python scripts/product_migration.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid

load_dotenv('/app/backend/.env')

# ============== CATEGORY HIERARCHY DEFINITION ==============
CATEGORY_HIERARCHY = {
    # Parent Category -> { subcategories with their DB category mappings }
    "celebrations": {
        "name": "Celebrations",
        "emoji": "🎂",
        "subcategories": {
            "cakes": {"name": "Cakes", "db_categories": ["cakes"]},
            "breed-cakes": {"name": "Breed Cakes", "db_categories": ["breed-cakes"]},
            "mini-cakes": {"name": "Mini Cakes", "db_categories": ["mini-cakes"]},
            "hampers": {"name": "Hampers & Gift Boxes", "db_categories": ["hampers"]},
        }
    },
    "treats": {
        "name": "Treats",
        "emoji": "🦴",
        "subcategories": {
            "all-treats": {"name": "Cookies & Biscuits", "db_categories": ["treats"]},
            "desi-treats": {"name": "Desi Treats", "db_categories": ["desi-treats"]},
            "frozen-treats": {"name": "Frozen Treats", "db_categories": ["frozen-treats"]},
            "nut-butters": {"name": "Nut Butters", "db_categories": ["nut-butters"]},
        }
    },
    "pupcakes": {
        "name": "Pupcakes & Dognuts",
        "emoji": "🍩",
        "subcategories": {
            "dognuts": {"name": "Dognuts", "db_categories": ["dognuts"]},
            "pupcakes": {"name": "Pupcakes", "db_categories": ["pupcakes"]},
        }
    },
    "fresh-food": {
        "name": "Fresh Food",
        "emoji": "🍕",
        "subcategories": {
            "fresh-meals": {"name": "Fresh Meals", "db_categories": ["fresh-meals"]},
        }
    },
    "accessories": {
        "name": "Accessories & Toys",
        "emoji": "🎁",
        "subcategories": {
            "accessories": {"name": "Accessories", "db_categories": ["accessories"]},
            "merchandise": {"name": "Merchandise", "db_categories": ["merchandise"]},
            "toys": {"name": "Toys", "db_categories": ["toys"]},
        }
    },
    "cat-corner": {
        "name": "Cat Corner",
        "emoji": "🐱",
        "subcategories": {
            "cat-treats": {"name": "Cat Treats", "db_categories": ["cat-treats"]},
        }
    },
    "gift-cards": {
        "name": "Gift Cards",
        "emoji": "🎁",
        "subcategories": {
            "gift-cards": {"name": "Gift Cards", "db_categories": ["gift-cards"]},
        }
    },
    # Pillar-based categories (services/products)
    "travel": {
        "name": "Travel Essentials",
        "emoji": "✈️",
        "pillar": "travel",
        "subcategories": {
            "travel-gear": {"name": "Travel Gear", "db_categories": ["travel"]},
        }
    },
    "care": {
        "name": "Care & Grooming",
        "emoji": "💊",
        "pillar": "care",
        "subcategories": {
            "care-products": {"name": "Care Products", "db_categories": ["care"]},
        }
    },
    "dine": {
        "name": "Dine Accessories",
        "emoji": "🍽️",
        "pillar": "dine",
        "subcategories": {
            "dine-products": {"name": "Dining Products", "db_categories": ["dine"]},
        }
    },
}

# Build reverse lookup: db_category -> parent_category
def build_category_lookup():
    lookup = {}
    for parent_id, parent_data in CATEGORY_HIERARCHY.items():
        for sub_id, sub_data in parent_data.get("subcategories", {}).items():
            for db_cat in sub_data.get("db_categories", []):
                lookup[db_cat] = {
                    "parent_category": parent_id,
                    "parent_name": parent_data["name"],
                    "parent_emoji": parent_data["emoji"],
                    "subcategory": sub_id,
                    "subcategory_name": sub_data["name"],
                    "pillar": parent_data.get("pillar")
                }
    return lookup

CATEGORY_LOOKUP = build_category_lookup()

# ============== RECATEGORIZATION RULES FOR "OTHER" ==============
def recategorize_other_product(product):
    """Determine correct category for products currently in 'other'"""
    tags = [t.lower() for t in (product.get("tags") or [])]
    name = (product.get("name") or "").lower()
    
    # Rule-based recategorization
    if "pupcakes" in tags or "pupcake" in name:
        return "dognuts"  # Pupcakes go with dognuts
    if "dognuts" in tags or "dognut" in name:
        return "dognuts"
    if "treats" in tags or "treat" in name:
        return "treats"
    if "gift box" in tags or "hamper" in name:
        return "hampers"
    if "toys" in tags or "toy" in name:
        return "accessories"  # Toys under accessories
    if "accessories" in tags:
        return "accessories"
    if "key chain" in tags or "keychain" in name or "fridge" in tags:
        return "merchandise"
    
    # Default: keep as treats if has food-related tags
    if any(t in tags for t in ["valentine's", "christmas", "easter", "birthdays"]):
        return "treats"  # Seasonal treats
    
    return "treats"  # Default fallback

# ============== ADD DEFAULT VARIANTS/SIZES ==============
def ensure_variants_and_sizes(product):
    """Ensure product has at least default variants and sizes"""
    price = product.get("price", 0)
    
    # Add default variant if missing
    if not product.get("variants") or len(product.get("variants", [])) == 0:
        product["variants"] = [{
            "id": str(uuid.uuid4()),
            "title": "Default",
            "price": price,
            "option1": "Standard",
            "option2": None,
            "option3": None,
            "sku": None,
            "available": True
        }]
    
    # Add default size if missing
    if not product.get("sizes") or len(product.get("sizes", [])) == 0:
        product["sizes"] = [{
            "name": "Standard",
            "price": price
        }]
    
    return product

# ============== MAIN MIGRATION ==============
async def run_migration(dry_run=True):
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 70)
    print(f"PRODUCT MIGRATION {'(DRY RUN)' if dry_run else '(LIVE)'}")
    print("=" * 70)
    
    stats = {
        "recategorized": 0,
        "parent_added": 0,
        "variants_fixed": 0,
        "sizes_fixed": 0,
        "total_processed": 0
    }
    
    # Process all products in 'products' collection
    products = await db.products.find({}).to_list(1000)
    print(f"\nProcessing {len(products)} products...")
    
    for product in products:
        original_category = product.get("category", "")
        updates = {}
        
        # 1. Recategorize "other" products
        if original_category == "other":
            new_category = recategorize_other_product(product)
            if new_category != original_category:
                updates["category"] = new_category
                stats["recategorized"] += 1
                if not dry_run:
                    print(f"  📁 '{product.get('name')[:40]}' : other -> {new_category}")
            original_category = new_category  # Use new category for hierarchy lookup
        
        # 2. Add parent_category based on hierarchy
        hierarchy_info = CATEGORY_LOOKUP.get(original_category)
        if hierarchy_info:
            updates["parent_category"] = hierarchy_info["parent_category"]
            updates["parent_category_name"] = hierarchy_info["parent_name"]
            updates["parent_emoji"] = hierarchy_info["parent_emoji"]
            updates["subcategory"] = hierarchy_info["subcategory"]
            updates["subcategory_name"] = hierarchy_info["subcategory_name"]
            if hierarchy_info.get("pillar"):
                updates["pillar"] = hierarchy_info["pillar"]
            stats["parent_added"] += 1
        
        # 3. Ensure variants exist
        if not product.get("variants") or len(product.get("variants", [])) == 0:
            product = ensure_variants_and_sizes(product)
            updates["variants"] = product["variants"]
            stats["variants_fixed"] += 1
        
        # 4. Ensure sizes exist
        if not product.get("sizes") or len(product.get("sizes", [])) == 0:
            product = ensure_variants_and_sizes(product)
            updates["sizes"] = product["sizes"]
            stats["sizes_fixed"] += 1
        
        # 5. Add migration timestamp
        if updates:
            updates["migrated_at"] = datetime.now(timezone.utc).isoformat()
            
            if not dry_run:
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {"$set": updates}
                )
        
        stats["total_processed"] += 1
    
    # Also update unified_products to match
    if not dry_run:
        print("\nSyncing changes to unified_products...")
        for product in products:
            if product.get("id"):
                # Find matching unified product
                unified = await db.unified_products.find_one({"id": product["id"]})
                if unified:
                    sync_fields = ["category", "parent_category", "parent_category_name", 
                                   "parent_emoji", "subcategory", "subcategory_name", 
                                   "variants", "sizes", "pillar"]
                    sync_updates = {k: product.get(k) for k in sync_fields if product.get(k)}
                    if sync_updates:
                        await db.unified_products.update_one(
                            {"id": product["id"]},
                            {"$set": sync_updates}
                        )
    
    # Print summary
    print("\n" + "=" * 70)
    print("MIGRATION SUMMARY")
    print("=" * 70)
    print(f"  Total processed: {stats['total_processed']}")
    print(f"  Recategorized from 'other': {stats['recategorized']}")
    print(f"  Parent category added: {stats['parent_added']}")
    print(f"  Variants fixed: {stats['variants_fixed']}")
    print(f"  Sizes fixed: {stats['sizes_fixed']}")
    
    if dry_run:
        print("\n⚠️  DRY RUN - No changes made. Run with dry_run=False to apply.")
    else:
        print("\n✅ Migration complete!")
    
    # Store hierarchy config in DB for frontend use
    if not dry_run:
        await db.config.update_one(
            {"key": "category_hierarchy"},
            {"$set": {
                "key": "category_hierarchy",
                "hierarchy": CATEGORY_HIERARCHY,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        print("✅ Category hierarchy saved to config collection")
    
    client.close()
    return stats

if __name__ == "__main__":
    import sys
    dry_run = "--live" not in sys.argv
    asyncio.run(run_migration(dry_run=dry_run))
