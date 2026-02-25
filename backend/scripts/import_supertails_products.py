"""
Supertails Product Import Script
================================
Imports curated products from Supertails.com into the products collection.
This script creates 20 quality products across dine, care, and shop pillars.
"""

import asyncio
import secrets
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Product data scraped/curated from Supertails.com
SUPERTAILS_PRODUCTS = [
    # === DOG FOOD (Dine Pillar) ===
    {
        "name": "Henlo Chicken & Vegetable Baked Dry Food",
        "description": "Premium baked dry food for adult dogs made with 100% human-grade ingredients. Contains real chicken and vegetables for optimal nutrition and taste.",
        "price": 2179.0,
        "mrp": 2499.0,
        "category": "food",
        "subcategory": "dry-food",
        "brand": "Henlo",
        "pillar": "dine",
        "tags": ["grain-free", "human-grade", "baked", "premium"],
        "image_url": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
        "life_stage": "adult",
        "size_suitability": ["medium", "large"],
        "is_pan_india": True,
        "weight_grams": 2000
    },
    {
        "name": "Pedigree Chicken & Vegetables Adult Dry Food",
        "description": "Complete and balanced nutrition for adult dogs. Made with real chicken and vegetables to support healthy digestion, skin, and coat.",
        "price": 3315.0,
        "mrp": 3600.0,
        "category": "food",
        "subcategory": "dry-food",
        "brand": "Pedigree",
        "pillar": "dine",
        "tags": ["balanced", "chicken", "vegetables", "digestive-health"],
        "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",
        "life_stage": "adult",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 3000
    },
    {
        "name": "Royal Canin Maxi Puppy Dry Food",
        "description": "Tailored nutrition for large breed puppies (26-44kg adult weight) up to 15 months. Supports digestive health and natural defenses.",
        "price": 1000.0,
        "mrp": 1150.0,
        "category": "food",
        "subcategory": "puppy-food",
        "brand": "Royal Canin",
        "pillar": "dine",
        "tags": ["puppy", "large-breed", "immune-support", "premium"],
        "image_url": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
        "life_stage": "puppy",
        "size_suitability": ["large", "giant"],
        "is_pan_india": True,
        "weight_grams": 1000
    },
    {
        "name": "Farmina N&D Chicken & Pomegranate Adult Dog Food",
        "description": "Ancestral Grain Selection formula with chicken and pomegranate for medium to maxi breed adults. High protein, natural ingredients.",
        "price": 7993.0,
        "mrp": 8999.0,
        "category": "food",
        "subcategory": "premium-food",
        "brand": "Farmina",
        "pillar": "dine",
        "tags": ["ancestral-grain", "high-protein", "pomegranate", "natural"],
        "image_url": "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400",
        "life_stage": "adult",
        "size_suitability": ["medium", "large"],
        "is_pan_india": True,
        "weight_grams": 12000
    },
    {
        "name": "Drools Optimum Performance Adult Dry Food",
        "description": "High-performance dog food for active adult dogs. Enhanced with omega fatty acids for healthy skin and shiny coat.",
        "price": 2852.0,
        "mrp": 3200.0,
        "category": "food",
        "subcategory": "dry-food",
        "brand": "Drools",
        "pillar": "dine",
        "tags": ["performance", "omega", "active-dogs", "coat-health"],
        "image_url": "https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=400",
        "life_stage": "adult",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 12000
    },
    {
        "name": "Kennel Kitchen Supreme Cuts in Gravy Variety Pack",
        "description": "Delicious wet food variety pack with premium cuts in gravy. Perfect for all life stages, 12 pouches included.",
        "price": 1596.0,
        "mrp": 1800.0,
        "category": "food",
        "subcategory": "wet-food",
        "brand": "Kennel Kitchen",
        "pillar": "dine",
        "tags": ["wet-food", "gravy", "variety-pack", "all-ages"],
        "image_url": "https://images.unsplash.com/photo-1568702846914-96b305d2uj01?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 1200
    },
    {
        "name": "Bark Out Loud Salmon & Turkey Adult Dry Food",
        "description": "Premium salmon and turkey recipe for adult dogs. Rich in omega-3 for healthy skin and coat. No artificial preservatives.",
        "price": 1472.0,
        "mrp": 1699.0,
        "category": "food",
        "subcategory": "premium-food",
        "brand": "Bark Out Loud",
        "pillar": "dine",
        "tags": ["salmon", "turkey", "omega-3", "no-preservatives"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "life_stage": "adult",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 3000
    },
    # === DOG TREATS (Shop Pillar) ===
    {
        "name": "JerHigh Chicken Jerky Dog Treats",
        "description": "Delicious chicken jerky strips made from real chicken. High in protein, perfect for training rewards or anytime snacking.",
        "price": 299.0,
        "mrp": 350.0,
        "category": "treats",
        "subcategory": "jerky-treats",
        "brand": "JerHigh",
        "pillar": "shop",
        "tags": ["jerky", "chicken", "training", "high-protein"],
        "image_url": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 70
    },
    {
        "name": "Pedigree DentaStix Daily Oral Care",
        "description": "Clinically proven to reduce tartar and plaque buildup. Give daily for fresher breath and cleaner teeth.",
        "price": 449.0,
        "mrp": 520.0,
        "category": "treats",
        "subcategory": "dental-treats",
        "brand": "Pedigree",
        "pillar": "shop",
        "tags": ["dental", "oral-care", "tartar-control", "daily"],
        "image_url": "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400",
        "life_stage": "adult",
        "size_suitability": ["medium", "large"],
        "is_pan_india": True,
        "weight_grams": 180
    },
    {
        "name": "Chip Chops Chicken Tenders Snacks",
        "description": "Premium chicken tenders made with real chicken breast. Soft texture, highly palatable for picky eaters.",
        "price": 359.0,
        "mrp": 420.0,
        "category": "treats",
        "subcategory": "jerky-treats",
        "brand": "Chip Chops",
        "pillar": "shop",
        "tags": ["chicken", "tenders", "soft", "picky-eaters"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 70
    },
    {
        "name": "Gnawlers Calcium Chicken Sticks",
        "description": "Calcium-enriched chicken sticks for strong bones and teeth. Long-lasting chew that keeps dogs entertained.",
        "price": 199.0,
        "mrp": 250.0,
        "category": "treats",
        "subcategory": "bones-chews",
        "brand": "Gnawlers",
        "pillar": "shop",
        "tags": ["calcium", "bones", "chew", "dental-health"],
        "image_url": "https://images.unsplash.com/photo-1601758124096-1fd661873b21?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 100
    },
    {
        "name": "Himalaya Healthy Dog Biscuits with Chicken",
        "description": "Crunchy biscuits made with real chicken and herbs. Supports digestive health and provides essential nutrients.",
        "price": 175.0,
        "mrp": 199.0,
        "category": "treats",
        "subcategory": "biscuits-cookies",
        "brand": "Himalaya",
        "pillar": "shop",
        "tags": ["biscuits", "chicken", "herbs", "digestive-health"],
        "image_url": "https://images.unsplash.com/photo-1601758177266-bc599de87707?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 400
    },
    {
        "name": "Drools Absolute Calcium Bone Jar",
        "description": "Delicious calcium-enriched mini bones for strong teeth and bones. Great for puppies and adult dogs.",
        "price": 399.0,
        "mrp": 450.0,
        "category": "treats",
        "subcategory": "bones-chews",
        "brand": "Drools",
        "pillar": "shop",
        "tags": ["calcium", "mini-bones", "jar", "puppy-safe"],
        "image_url": "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 300
    },
    # === GROOMING & CARE (Care Pillar) ===
    {
        "name": "Wahl Premium Pet Shampoo - Oatmeal Formula",
        "description": "Gentle oatmeal shampoo that soothes dry, itchy skin. pH balanced for dogs, leaves coat soft and shiny.",
        "price": 649.0,
        "mrp": 750.0,
        "category": "grooming",
        "subcategory": "shampoo",
        "brand": "Wahl",
        "pillar": "care",
        "tags": ["shampoo", "oatmeal", "sensitive-skin", "ph-balanced"],
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 500
    },
    {
        "name": "Furlicks Hip & Joint Supplement Licks",
        "description": "Delicious supplement licks with glucosamine and chondroitin. Supports joint mobility and reduces stiffness.",
        "price": 799.0,
        "mrp": 899.0,
        "category": "supplements",
        "subcategory": "joint-care",
        "brand": "Furlicks",
        "pillar": "care",
        "tags": ["joint-health", "glucosamine", "senior", "mobility"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "life_stage": "adult",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 180
    },
    {
        "name": "Beaphar Tick & Flea Spot-On Treatment",
        "description": "Effective spot-on treatment that protects against ticks and fleas for up to 4 weeks. Easy to apply.",
        "price": 549.0,
        "mrp": 650.0,
        "category": "health",
        "subcategory": "tick-flea",
        "brand": "Beaphar",
        "pillar": "care",
        "tags": ["tick", "flea", "spot-on", "protection"],
        "image_url": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 30
    },
    {
        "name": "Pet Head Paw Butter Moisturizing Balm",
        "description": "Intensive paw care balm that soothes and protects cracked paws. Made with shea butter and oatmeal.",
        "price": 449.0,
        "mrp": 520.0,
        "category": "grooming",
        "subcategory": "paw-care",
        "brand": "Pet Head",
        "pillar": "care",
        "tags": ["paw-care", "moisturizing", "balm", "cracked-paws"],
        "image_url": "https://images.unsplash.com/photo-1583511655826-05700442b4dd?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 59
    },
    # === ACCESSORIES (Shop Pillar) ===
    {
        "name": "Skatrs Stainless Steel Anti-Skid Bowl",
        "description": "Premium stainless steel bowl with anti-skid rubber base. Easy to clean, durable, and hygienic.",
        "price": 399.0,
        "mrp": 450.0,
        "category": "bowls",
        "subcategory": "steel-bowls",
        "brand": "Skatrs",
        "pillar": "dine",
        "tags": ["bowl", "steel", "anti-skid", "durable"],
        "image_url": "https://images.unsplash.com/photo-1601758174493-6d3f7e3a6e46?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 350
    },
    {
        "name": "Fluffys Slow Feeder Puzzle Bowl",
        "description": "Interactive slow feeder that promotes healthy eating habits. Prevents bloating and aids digestion.",
        "price": 599.0,
        "mrp": 699.0,
        "category": "bowls",
        "subcategory": "slow-feeders",
        "brand": "Fluffys",
        "pillar": "dine",
        "tags": ["slow-feeder", "puzzle", "anti-bloat", "interactive"],
        "image_url": "https://images.unsplash.com/photo-1541599468348-e96984315921?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 400
    },
    {
        "name": "Kong Classic Dog Toy - Red",
        "description": "World's best dog toy! Durable rubber toy that can be stuffed with treats. Great for mental stimulation.",
        "price": 899.0,
        "mrp": 999.0,
        "category": "toys",
        "subcategory": "chew-toys",
        "brand": "Kong",
        "pillar": "shop",
        "tags": ["toy", "kong", "durable", "treat-dispensing"],
        "image_url": "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400",
        "life_stage": "all-ages",
        "size_suitability": ["all"],
        "is_pan_india": True,
        "weight_grams": 200
    }
]


async def import_products():
    """Import products into the database"""
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {mongo_url}/{db_name}")
    print(f"Importing {len(SUPERTAILS_PRODUCTS)} products from Supertails...")
    
    imported_count = 0
    skipped_count = 0
    
    for product_data in SUPERTAILS_PRODUCTS:
        # Generate unique ID
        product_id = f"supertails-{secrets.token_hex(6)}"
        
        # Check if a product with same name already exists
        existing = await db.products.find_one({"name": product_data["name"]})
        if existing:
            print(f"  ⏭️  Skipped (exists): {product_data['name']}")
            skipped_count += 1
            continue
        
        # Build the full product document
        product = {
            "id": product_id,
            "name": product_data["name"],
            "description": product_data["description"],
            "price": product_data["price"],
            "originalPrice": product_data["mrp"],
            "mrp": product_data["mrp"],
            "image": product_data["image_url"],
            "image_url": product_data["image_url"],
            "category": product_data["category"],
            "subcategory": product_data.get("subcategory", ""),
            "brand": product_data["brand"],
            "pillar": product_data["pillar"],
            "pillars": [product_data["pillar"], "shop"],
            "tags": product_data["tags"],
            "is_pan_india_shippable": product_data.get("is_pan_india", True),
            "in_stock": True,
            "stock_quantity": 50,
            "is_active": True,
            "available": True,
            
            # Life stage and size
            "life_stage": product_data.get("life_stage", "all-ages"),
            "size_suitability": product_data.get("size_suitability", ["all"]),
            
            # Source tracking
            "external_source": "supertails",
            "source_url": "https://supertails.com",
            
            # Shipping
            "shipping_weight": product_data.get("weight_grams", 500),
            "weight_grams": product_data.get("weight_grams", 500),
            
            # Mira visibility
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": True,
                "knowledge_confidence": "high"
            },
            
            # Pet safety
            "pet_safety": {
                "species": "dog",
                "life_stages": [product_data.get("life_stage", "all")],
                "size_suitability": product_data.get("size_suitability", ["all"]),
                "is_validated": True,
                "risk_level": "safe"
            },
            
            # Pricing info
            "pricing": {
                "base_price": product_data["price"],
                "compare_at_price": product_data["mrp"],
                "currency": "INR",
                "gst_rate": 18
            },
            
            # Visibility
            "visibility": {
                "status": "active",
                "visible_on_site": True,
                "searchable": True
            },
            
            # Timestamps
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "imported_from": "supertails_scraper"
        }
        
        # Insert into database
        await db.products.insert_one(product)
        print(f"  ✅ Imported: {product_data['name']} (₹{product_data['price']})")
        imported_count += 1
    
    print(f"\n{'='*50}")
    print(f"Import Complete!")
    print(f"  ✅ Imported: {imported_count}")
    print(f"  ⏭️  Skipped: {skipped_count}")
    print(f"  📦 Total products now: {await db.products.count_documents({})}")
    
    client.close()
    return imported_count


if __name__ == "__main__":
    asyncio.run(import_products())
