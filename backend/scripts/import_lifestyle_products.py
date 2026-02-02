"""
Lifestyle Products Import Script
================================
Creates 20 lifestyle products for The Doggy Company pillars:
- TRAVEL: Leashes, carriers, travel bags
- STAY: Pet-friendly supplies, comfort items
- DINE: Bowls, feeders, dining accessories
- CARE: Grooming tools, shampoos, brushes
- ENJOY: Toys, enrichment items
"""

import asyncio
import secrets
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Lifestyle products for TDC pillars
LIFESTYLE_PRODUCTS = [
    # === TRAVEL PILLAR - Leashes, Carriers, Travel Gear ===
    {
        "name": "Premium Leather Leash - Tan",
        "description": "Handcrafted genuine leather leash with brass hardware. Soft grip handle, 5ft length. Perfect for stylish walks and travel.",
        "price": 1299.0,
        "mrp": 1599.0,
        "category": "leashes",
        "subcategory": "leather-leashes",
        "brand": "TDC Essentials",
        "pillar": "travel",
        "tags": ["leather", "premium", "travel", "walks", "brass-hardware"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "weight_grams": 180
    },
    {
        "name": "Airline Approved Pet Carrier - Navy",
        "description": "TSA-approved soft-sided carrier with mesh ventilation. Fits under airplane seats. Includes removable fleece pad and shoulder strap.",
        "price": 2499.0,
        "mrp": 2999.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "TDC Travel",
        "pillar": "travel",
        "tags": ["carrier", "airline-approved", "travel", "flight", "ventilated"],
        "image_url": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
        "weight_grams": 1200
    },
    {
        "name": "Retractable Leash - 5m Tangle-Free",
        "description": "Premium retractable leash with one-button brake and lock. Ergonomic anti-slip handle. Great for beach walks and park visits.",
        "price": 899.0,
        "mrp": 1199.0,
        "category": "leashes",
        "subcategory": "retractable-leashes",
        "brand": "TDC Essentials",
        "pillar": "travel",
        "tags": ["retractable", "5m", "beach", "park", "tangle-free"],
        "image_url": "https://images.unsplash.com/photo-1601758177266-bc599de87707?w=400",
        "weight_grams": 320
    },
    {
        "name": "Car Seat Belt Harness Kit",
        "description": "Adjustable safety harness with universal seatbelt clip. Crash-tested design keeps your pup secure during car rides.",
        "price": 749.0,
        "mrp": 899.0,
        "category": "travel-accessories",
        "subcategory": "car-safety",
        "brand": "TDC Travel",
        "pillar": "travel",
        "tags": ["car", "seatbelt", "safety", "harness", "road-trip"],
        "image_url": "https://images.unsplash.com/photo-1583511655826-05700442b4dd?w=400",
        "weight_grams": 250
    },
    
    # === STAY PILLAR - Comfort & Stay Essentials ===
    {
        "name": "Portable Travel Bed - Waterproof",
        "description": "Foldable travel bed with waterproof base and plush top. Rolls up with carry strap. Perfect for hotels, stays, and outdoor adventures.",
        "price": 1899.0,
        "mrp": 2299.0,
        "category": "beds",
        "subcategory": "travel-beds",
        "brand": "TDC Stay",
        "pillar": "stay",
        "tags": ["travel-bed", "portable", "waterproof", "foldable", "hotel"],
        "image_url": "https://images.unsplash.com/photo-1541599468348-e96984315921?w=400",
        "weight_grams": 800
    },
    {
        "name": "Cozy Fleece Blanket - Paw Print",
        "description": "Super soft double-sided fleece blanket with cute paw prints. Machine washable, perfect for snuggles at home or during stays.",
        "price": 599.0,
        "mrp": 799.0,
        "category": "bedding",
        "subcategory": "blankets",
        "brand": "TDC Stay",
        "pillar": "stay",
        "tags": ["blanket", "fleece", "cozy", "washable", "paw-print"],
        "image_url": "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
        "weight_grams": 400
    },
    
    # === DINE PILLAR - Bowls & Dining Accessories ===
    {
        "name": "Elevated Double Bowl Stand - Bamboo",
        "description": "Eco-friendly bamboo stand with two stainless steel bowls. Elevated design aids digestion and reduces neck strain. Non-slip feet.",
        "price": 1599.0,
        "mrp": 1899.0,
        "category": "bowls",
        "subcategory": "elevated-bowls",
        "brand": "TDC Dine",
        "pillar": "dine",
        "tags": ["elevated", "bamboo", "eco-friendly", "digestion", "double-bowl"],
        "image_url": "https://images.unsplash.com/photo-1601758174493-6d3f7e3a6e46?w=400",
        "weight_grams": 1200
    },
    {
        "name": "Slow Feeder Puzzle Bowl - Teal",
        "description": "Interactive maze design slows eating by 10x. Prevents bloating, aids digestion. Non-toxic, dishwasher safe.",
        "price": 649.0,
        "mrp": 799.0,
        "category": "bowls",
        "subcategory": "slow-feeders",
        "brand": "TDC Dine",
        "pillar": "dine",
        "tags": ["slow-feeder", "puzzle", "anti-bloat", "interactive", "dishwasher-safe"],
        "image_url": "https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=400",
        "weight_grams": 350
    },
    {
        "name": "Portable Collapsible Water Bowl",
        "description": "Food-grade silicone bowl that collapses flat. Includes carabiner clip for bags. Essential for walks, hikes, and travel.",
        "price": 349.0,
        "mrp": 449.0,
        "category": "bowls",
        "subcategory": "travel-bowls",
        "brand": "TDC Dine",
        "pillar": "dine",
        "tags": ["collapsible", "portable", "silicone", "travel", "hiking"],
        "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",
        "weight_grams": 80
    },
    {
        "name": "Ceramic Artisan Bowl Set - Bone Motif",
        "description": "Handcrafted ceramic bowls with adorable bone pattern. Set of 2 (food + water). Lead-free glaze, microwave safe.",
        "price": 1199.0,
        "mrp": 1499.0,
        "category": "bowls",
        "subcategory": "ceramic-bowls",
        "brand": "TDC Dine",
        "pillar": "dine",
        "tags": ["ceramic", "artisan", "handcrafted", "set", "microwave-safe"],
        "image_url": "https://images.unsplash.com/photo-1568702846914-96b305d2uj01?w=400",
        "weight_grams": 900
    },
    
    # === CARE PILLAR - Grooming Tools & Accessories ===
    {
        "name": "Professional Deshedding Brush",
        "description": "Stainless steel deshedding tool reduces shedding by up to 90%. Ergonomic handle, gentle on skin. For medium to large coats.",
        "price": 849.0,
        "mrp": 999.0,
        "category": "grooming",
        "subcategory": "brushes",
        "brand": "TDC Groom",
        "pillar": "care",
        "tags": ["deshedding", "brush", "professional", "shedding", "coat-care"],
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
        "weight_grams": 180
    },
    {
        "name": "Gentle Oatmeal Shampoo - 500ml",
        "description": "Soothing oatmeal formula for sensitive skin. pH balanced, paraben-free. Leaves coat soft, shiny, and fresh-smelling.",
        "price": 549.0,
        "mrp": 699.0,
        "category": "grooming",
        "subcategory": "shampoo",
        "brand": "TDC Groom",
        "pillar": "care",
        "tags": ["shampoo", "oatmeal", "sensitive-skin", "paraben-free", "gentle"],
        "image_url": "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400",
        "weight_grams": 550
    },
    {
        "name": "Nail Clipper & File Set",
        "description": "Professional-grade nail clipper with safety guard. Includes nail file and quick guide. Stainless steel, non-slip grip.",
        "price": 449.0,
        "mrp": 549.0,
        "category": "grooming",
        "subcategory": "nail-care",
        "brand": "TDC Groom",
        "pillar": "care",
        "tags": ["nail-clipper", "file", "safety-guard", "stainless-steel", "grooming"],
        "image_url": "https://images.unsplash.com/photo-1601758177266-bc599de87707?w=400",
        "weight_grams": 120
    },
    {
        "name": "Paw Balm & Nose Butter Duo",
        "description": "Organic balm set for cracked paws and dry noses. Made with shea butter, coconut oil, and vitamin E. Safe if licked.",
        "price": 699.0,
        "mrp": 849.0,
        "category": "grooming",
        "subcategory": "paw-care",
        "brand": "TDC Groom",
        "pillar": "care",
        "tags": ["paw-balm", "nose-butter", "organic", "moisturizing", "healing"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "weight_grams": 100
    },
    {
        "name": "Ear Cleaning Solution - 120ml",
        "description": "Gentle ear cleaner removes wax and debris. Prevents infections, reduces odor. Vet-recommended formula.",
        "price": 399.0,
        "mrp": 499.0,
        "category": "grooming",
        "subcategory": "ear-care",
        "brand": "TDC Groom",
        "pillar": "care",
        "tags": ["ear-cleaner", "wax-removal", "vet-recommended", "gentle", "hygiene"],
        "image_url": "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400",
        "weight_grams": 140
    },
    
    # === ENJOY PILLAR - Toys & Enrichment ===
    {
        "name": "Indestructible Chew Ball - Orange",
        "description": "Ultra-durable rubber ball for aggressive chewers. Bounces unpredictably for extra fun. Non-toxic, floats in water.",
        "price": 599.0,
        "mrp": 749.0,
        "category": "toys",
        "subcategory": "chew-toys",
        "brand": "TDC Play",
        "pillar": "enjoy",
        "tags": ["ball", "indestructible", "chew", "durable", "floats"],
        "image_url": "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400",
        "weight_grams": 200
    },
    {
        "name": "Rope Tug Toy - Rainbow",
        "description": "Multi-color cotton rope toy for tug-of-war and fetch. Cleans teeth while playing. Machine washable.",
        "price": 349.0,
        "mrp": 449.0,
        "category": "toys",
        "subcategory": "rope-toys",
        "brand": "TDC Play",
        "pillar": "enjoy",
        "tags": ["rope", "tug", "teeth-cleaning", "colorful", "washable"],
        "image_url": "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
        "weight_grams": 150
    },
    {
        "name": "Treat Dispensing Puzzle Toy",
        "description": "Interactive puzzle that dispenses treats as your pup plays. Adjustable difficulty levels. Mental stimulation for smart dogs.",
        "price": 899.0,
        "mrp": 1099.0,
        "category": "toys",
        "subcategory": "puzzle-toys",
        "brand": "TDC Play",
        "pillar": "enjoy",
        "tags": ["puzzle", "treat-dispensing", "interactive", "mental-stimulation", "smart"],
        "image_url": "https://images.unsplash.com/photo-1601758124096-1fd661873b21?w=400",
        "weight_grams": 300
    },
    {
        "name": "Squeaky Plush Avocado Toy",
        "description": "Adorable avocado plushie with built-in squeaker. Soft and cuddly for gentle players. Instagram-worthy cuteness!",
        "price": 449.0,
        "mrp": 549.0,
        "category": "toys",
        "subcategory": "plush-toys",
        "brand": "TDC Play",
        "pillar": "enjoy",
        "tags": ["plush", "squeaky", "cute", "soft", "avocado"],
        "image_url": "https://images.unsplash.com/photo-1583511655826-05700442b4dd?w=400",
        "weight_grams": 100
    },
    {
        "name": "Fetch Ball Launcher - Long Range",
        "description": "Hands-free ball launcher throws up to 15m. Ergonomic handle, includes 2 balls. Perfect for park playtime.",
        "price": 749.0,
        "mrp": 899.0,
        "category": "toys",
        "subcategory": "fetch-toys",
        "brand": "TDC Play",
        "pillar": "enjoy",
        "tags": ["launcher", "fetch", "long-range", "hands-free", "outdoor"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "weight_grams": 280
    }
]


async def import_lifestyle_products():
    """Import lifestyle products into the database"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {mongo_url}/{db_name}")
    print(f"Importing {len(LIFESTYLE_PRODUCTS)} lifestyle products...")
    print()
    
    imported_count = 0
    
    for product_data in LIFESTYLE_PRODUCTS:
        product_id = f"tdc-{secrets.token_hex(6)}"
        
        # Check if exists
        existing = await db.products.find_one({"name": product_data["name"]})
        if existing:
            print(f"  ⏭️  Skipped (exists): {product_data['name']}")
            continue
        
        # Build full product document
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
            "primary_pillar": product_data["pillar"],
            "tags": product_data["tags"],
            "is_pan_india_shippable": True,
            "in_stock": True,
            "stock_quantity": 50,
            "is_active": True,
            "available": True,
            "product_type": "physical",
            
            # Life stage and size - all lifestyle products suit all dogs
            "life_stage": "all-ages",
            "size_suitability": ["small", "medium", "large"],
            
            # Source tracking
            "external_source": "tdc_lifestyle",
            "imported_from": "lifestyle_products_script",
            
            # Shipping
            "shipping_weight": product_data.get("weight_grams", 500),
            "weight_grams": product_data.get("weight_grams", 500),
            
            # Mira visibility - all lifestyle products can be recommended
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": True,
                "knowledge_confidence": "high",
                "suggestion_contexts": [product_data["pillar"], "gift", "essentials"]
            },
            
            # Pet safety
            "pet_safety": {
                "species": "dog",
                "life_stages": ["puppy", "adult", "senior"],
                "size_suitability": ["small", "medium", "large"],
                "is_validated": True,
                "risk_level": "safe"
            },
            
            # Pricing
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
                "searchable": True,
                "featured": False
            },
            
            # Timestamps
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "synced_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into both products and unified_products
        await db.products.insert_one(product)
        
        # Also add to unified_products for product box
        product_copy = product.copy()
        product_copy.pop("_id", None)
        await db.unified_products.update_one(
            {"id": product_id},
            {"$set": product_copy},
            upsert=True
        )
        
        print(f"  ✅ {product_data['pillar'].upper():6} | {product_data['name'][:40]} | ₹{product_data['price']}")
        imported_count += 1
    
    print()
    print("=" * 60)
    print(f"✅ Import Complete! {imported_count} lifestyle products added")
    print()
    print("Products by Pillar:")
    for pillar in ["travel", "stay", "dine", "care", "enjoy"]:
        count = await db.products.count_documents({"pillar": pillar, "imported_from": "lifestyle_products_script"})
        print(f"  • {pillar.upper()}: {count}")
    
    client.close()
    return imported_count


if __name__ == "__main__":
    asyncio.run(import_lifestyle_products())
