"""
HARDCODED Product Options & Variants Seeder
============================================
This script permanently adds product options (Base, Flavour, Size) and variants
for The Doggy Bakery products. This data is HARDCODED to prevent loss on redeploy.

Run via: POST /api/admin/hardcode-product-options
Or via: python scripts/hardcode_product_options.py

Last Updated: Jan 27, 2025
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

# =====================================================
# HARDCODED PRODUCT OPTIONS DATA
# This data is manually defined and will NOT change
# =====================================================

# Standard cake bases
CAKE_BASES = [
    {"name": "Oat", "price_modifier": 0},
    {"name": "Ragi", "price_modifier": 0},
    {"name": "Wheat Free (Oat + Ragi)", "price_modifier": 50},
]

# Standard cake flavours  
CAKE_FLAVOURS = [
    {"name": "Chicken", "price_modifier": 0},
    {"name": "Chicken Liver", "price_modifier": 0},
    {"name": "Mutton", "price_modifier": 100},
    {"name": "Lamb", "price_modifier": 100},
    {"name": "Fish", "price_modifier": 50},
    {"name": "Peanut Butter", "price_modifier": 0},
    {"name": "Banana", "price_modifier": 0},
    {"name": "Carrot", "price_modifier": 0},
]

# Cake sizes with prices
CAKE_SIZES = [
    {"name": "Mini (4 inch)", "price": 599, "serves": "1-2 pets"},
    {"name": "Regular (6 inch)", "price": 899, "serves": "3-5 pets"},
    {"name": "Large (8 inch)", "price": 1299, "serves": "6-10 pets"},
    {"name": "XL (10 inch)", "price": 1699, "serves": "10+ pets"},
]

# =====================================================
# PRODUCTS TO UPDATE WITH OPTIONS
# These products will get Base + Flavour + Size options
# =====================================================

CAKE_PRODUCTS_WITH_FULL_OPTIONS = [
    # Main cakes
    "Doggo Cake",
    "Ms.Doggo Cake", 
    "Original Pawsome",
    "Kawaii Woofy Cake",
    "Rainbow Pupcake",
    "Pupcake Delight",
    "Birthday Bark Cake",
    "Celebration Cake",
    "Party Pup Cake",
    "Premium Paw Cake",
    "Luxury Dog Cake",
    "Designer Dog Cake",
    "Custom Dog Cake",
    "Honey Pie",
    "Bone Appetit",
    "Show Me the Boney",
    # Add more cake names here as needed
]

# Products with just Size options (treats, biscuits)
TREAT_PRODUCTS_WITH_SIZE = [
    "Pupcorn",
    "Dog Biscuits",
    "Training Treats",
    "Dental Chews",
    "Jerky Strips",
]

# Products with Flavour only
PRODUCTS_WITH_FLAVOUR_ONLY = [
    "Pup Ice Cream",
    "Frozen Yogurt Bites",
    "Smoothie Mix",
]


def generate_cake_options():
    """Generate standard options structure for cake products"""
    return [
        {
            "name": "Base",
            "position": 1,
            "values": [b["name"] for b in CAKE_BASES]
        },
        {
            "name": "Flavour", 
            "position": 2,
            "values": [f["name"] for f in CAKE_FLAVOURS]
        },
        {
            "name": "Size",
            "position": 3,
            "values": [s["name"] for s in CAKE_SIZES]
        }
    ]


def generate_cake_variants(base_price=899):
    """Generate variant combinations for a cake product"""
    variants = []
    variant_id = 1
    
    for size in CAKE_SIZES:
        for base in CAKE_BASES:
            for flavour in CAKE_FLAVOURS:
                # Calculate price: size price + modifiers
                price = size["price"] + base["price_modifier"] + flavour["price_modifier"]
                
                variant = {
                    "id": variant_id,
                    "title": f"{size['name']} / {base['name']} / {flavour['name']}",
                    "price": str(price),
                    "compare_at_price": str(int(price * 1.2)) if variant_id % 3 == 0 else None,  # Some variants on sale
                    "option1": size["name"],
                    "option2": base["name"],
                    "option3": flavour["name"],
                    "available": True,
                    "inventory_quantity": 100,
                    "sku": f"CAKE-{variant_id:04d}"
                }
                variants.append(variant)
                variant_id += 1
    
    return variants


def generate_size_only_options():
    """Generate options for products with size only"""
    return [
        {
            "name": "Size",
            "position": 1,
            "values": ["Small (100g)", "Medium (250g)", "Large (500g)"]
        }
    ]


def generate_size_only_variants(base_price=299):
    """Generate variants for size-only products"""
    sizes = [
        {"name": "Small (100g)", "multiplier": 1.0},
        {"name": "Medium (250g)", "multiplier": 2.0},
        {"name": "Large (500g)", "multiplier": 3.5},
    ]
    
    variants = []
    for i, size in enumerate(sizes, 1):
        price = int(base_price * size["multiplier"])
        variants.append({
            "id": i,
            "title": size["name"],
            "price": str(price),
            "option1": size["name"],
            "available": True,
            "inventory_quantity": 50,
            "sku": f"TREAT-{i:04d}"
        })
    
    return variants


def generate_flavour_only_options():
    """Generate options for flavour-only products"""
    return [
        {
            "name": "Flavour",
            "position": 1,
            "values": ["Chicken", "Peanut Butter", "Banana", "Mixed Berry", "Mango"]
        }
    ]


def generate_flavour_only_variants(base_price=199):
    """Generate variants for flavour-only products"""
    flavours = ["Chicken", "Peanut Butter", "Banana", "Mixed Berry", "Mango"]
    
    variants = []
    for i, flavour in enumerate(flavours, 1):
        variants.append({
            "id": i,
            "title": flavour,
            "price": str(base_price),
            "option1": flavour,
            "available": True,
            "inventory_quantity": 30,
            "sku": f"FLAV-{i:04d}"
        })
    
    return variants


async def hardcode_product_options(db):
    """
    Main function to hardcode product options into the database.
    This will NOT be overwritten by Shopify sync.
    """
    results = {
        "cakes_updated": 0,
        "treats_updated": 0,
        "flavour_only_updated": 0,
        "not_found": [],
        "errors": []
    }
    
    now = datetime.now(timezone.utc).isoformat()
    
    # ========== UPDATE CAKE PRODUCTS ==========
    logger.info("Updating cake products with full options...")
    
    cake_options = generate_cake_options()
    
    for cake_name in CAKE_PRODUCTS_WITH_FULL_OPTIONS:
        try:
            # Find product by name (case-insensitive partial match)
            product = await db.products.find_one({
                "name": {"$regex": f"^{cake_name}$", "$options": "i"}
            })
            
            if not product:
                # Try partial match
                product = await db.products.find_one({
                    "name": {"$regex": cake_name, "$options": "i"}
                })
            
            if product:
                base_price = product.get("price", 899)
                if isinstance(base_price, str):
                    base_price = int(float(base_price))
                
                variants = generate_cake_variants(base_price)
                
                update_doc = {
                    "$set": {
                        "options": cake_options,
                        "variants": variants,
                        "has_variants": True,
                        "hardcoded_options": True,  # Flag to prevent Shopify overwrite
                        "options_updated_at": now,
                        "updated_at": now
                    }
                }
                
                await db.products.update_one({"_id": product["_id"]}, update_doc)
                results["cakes_updated"] += 1
                logger.info(f"Updated: {product['name']} with {len(variants)} variants")
            else:
                results["not_found"].append(cake_name)
                
        except Exception as e:
            results["errors"].append(f"{cake_name}: {str(e)}")
            logger.error(f"Error updating {cake_name}: {e}")
    
    # ========== UPDATE TREAT PRODUCTS ==========
    logger.info("Updating treat products with size options...")
    
    size_options = generate_size_only_options()
    size_variants = generate_size_only_variants()
    
    for treat_name in TREAT_PRODUCTS_WITH_SIZE:
        try:
            product = await db.products.find_one({
                "name": {"$regex": treat_name, "$options": "i"}
            })
            
            if product:
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {
                        "$set": {
                            "options": size_options,
                            "variants": size_variants,
                            "has_variants": True,
                            "hardcoded_options": True,
                            "options_updated_at": now,
                            "updated_at": now
                        }
                    }
                )
                results["treats_updated"] += 1
                
        except Exception as e:
            results["errors"].append(f"{treat_name}: {str(e)}")
    
    # ========== UPDATE FLAVOUR-ONLY PRODUCTS ==========
    logger.info("Updating flavour-only products...")
    
    flavour_options = generate_flavour_only_options()
    flavour_variants = generate_flavour_only_variants()
    
    for product_name in PRODUCTS_WITH_FLAVOUR_ONLY:
        try:
            product = await db.products.find_one({
                "name": {"$regex": product_name, "$options": "i"}
            })
            
            if product:
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {
                        "$set": {
                            "options": flavour_options,
                            "variants": flavour_variants,
                            "has_variants": True,
                            "hardcoded_options": True,
                            "options_updated_at": now,
                            "updated_at": now
                        }
                    }
                )
                results["flavour_only_updated"] += 1
                
        except Exception as e:
            results["errors"].append(f"{product_name}: {str(e)}")
    
    # ========== BULK UPDATE: All products without options ==========
    # Find products that look like cakes but have no options
    logger.info("Bulk updating remaining cake-like products...")
    
    cake_keywords = ["cake", "Cake", "pupcake", "Pupcake", "birthday", "Birthday", "party", "Party", "celebration"]
    
    for keyword in cake_keywords:
        cursor = db.products.find({
            "name": {"$regex": keyword, "$options": "i"},
            "$or": [
                {"options": {"$exists": False}},
                {"options": {"$size": 0}},
                {"has_variants": {"$ne": True}}
            ],
            "hardcoded_options": {"$ne": True}  # Don't re-update already hardcoded
        })
        
        products = await cursor.to_list(length=500)
        
        for product in products:
            try:
                base_price = product.get("price", 899)
                if isinstance(base_price, str):
                    try:
                        base_price = int(float(base_price))
                    except:
                        base_price = 899
                
                variants = generate_cake_variants(base_price)
                
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {
                        "$set": {
                            "options": cake_options,
                            "variants": variants,
                            "has_variants": True,
                            "hardcoded_options": True,
                            "options_updated_at": now,
                            "updated_at": now
                        }
                    }
                )
                results["cakes_updated"] += 1
                
            except Exception as e:
                logger.error(f"Error bulk updating {product.get('name')}: {e}")
    
    logger.info(f"Hardcode complete: {results}")
    return results


# CLI entry point
if __name__ == "__main__":
    import motor.motor_asyncio
    from dotenv import load_dotenv
    
    load_dotenv()
    
    MONGO_URL = os.environ.get("MONGO_URL")
    DB_NAME = os.environ.get("DB_NAME", "doggy_company")
    
    async def main():
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("Starting hardcoded product options update...")
        results = await hardcode_product_options(db)
        print(f"\nResults: {results}")
        
        client.close()
    
    asyncio.run(main())
