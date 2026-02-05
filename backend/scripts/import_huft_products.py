"""
HUFT (Heads Up For Tails) Product Import Script
================================================
Imports curated non-food, non-vet products from HUFT into products_master collection.
Focus on accessories, toys, apparel, grooming, and travel gear.
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets

# HUFT Products - Non-food, Non-vet categories (curated selection)
HUFT_PRODUCTS = [
    # === TOYS (Shop/Enjoy Pillar) ===
    {
        "name": "HUFT Squeaky Donut Plush Toy",
        "description": "Adorable donut-shaped plush toy with built-in squeaker. Made with safe, non-toxic materials. Perfect for snuggling and gentle play.",
        "price": 449.0,
        "mrp": 599.0,
        "category": "toys",
        "subcategory": "plush-toys",
        "brand": "HUFT",
        "pillars": ["shop", "enjoy"],
        "primary_pillar": "shop",
        "tags": ["squeaky", "plush", "soft", "indoor", "huft", "imported"],
        "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400",
        "life_stages": ["all"],
        "size_suitability": ["S", "M"],
        "chew_strength": "gentle",
        "is_pan_india": True
    },
    {
        "name": "HUFT Rope Ball Tug Toy",
        "description": "Durable cotton rope ball for interactive tug-of-war play. Helps clean teeth while playing. Suitable for medium to power chewers.",
        "price": 349.0,
        "mrp": 449.0,
        "category": "toys",
        "subcategory": "rope-toys",
        "brand": "HUFT",
        "pillars": ["shop", "enjoy"],
        "primary_pillar": "shop",
        "tags": ["rope", "tug", "dental", "interactive", "huft"],
        "image_url": "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
        "life_stages": ["adult", "puppy"],
        "size_suitability": ["M", "L"],
        "chew_strength": "moderate",
        "is_pan_india": True
    },
    {
        "name": "HUFT Treat Dispensing Ball",
        "description": "Interactive puzzle toy that dispenses treats as your dog plays. Keeps pets mentally stimulated and entertained for hours.",
        "price": 599.0,
        "mrp": 749.0,
        "category": "toys",
        "subcategory": "puzzle-toys",
        "brand": "HUFT",
        "pillars": ["shop", "enjoy", "learn"],
        "primary_pillar": "shop",
        "tags": ["puzzle", "treat-dispensing", "mental-stimulation", "huft"],
        "image_url": "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "chew_strength": "moderate",
        "is_pan_india": True
    },
    {
        "name": "HUFT Rubber Bone Chew Toy",
        "description": "Heavy-duty rubber bone for aggressive chewers. Non-toxic, BPA-free. Helps satisfy chewing instincts and promotes dental health.",
        "price": 699.0,
        "mrp": 899.0,
        "category": "toys",
        "subcategory": "chew-toys",
        "brand": "HUFT",
        "pillars": ["shop", "enjoy"],
        "primary_pillar": "shop",
        "tags": ["rubber", "durable", "power-chewer", "dental", "huft"],
        "image_url": "https://images.unsplash.com/photo-1594896505506-1c879e0cd0a5?w=400",
        "life_stages": ["adult"],
        "size_suitability": ["M", "L", "XL"],
        "chew_strength": "power_chewer",
        "is_pan_india": True
    },
    
    # === APPAREL (Shop Pillar) ===
    {
        "name": "HUFT Rainbow Stripe T-Shirt",
        "description": "Colorful cotton t-shirt with rainbow stripes. Soft, breathable fabric. Machine washable. Available in multiple sizes.",
        "price": 599.0,
        "mrp": 799.0,
        "category": "apparel",
        "subcategory": "t-shirts",
        "brand": "HUFT",
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags": ["apparel", "t-shirt", "colorful", "cotton", "huft"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "life_stages": ["all"],
        "size_suitability": ["S", "M", "L"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Winter Hoodie",
        "description": "Cozy fleece-lined hoodie for winter warmth. Features convenient leash hole and kangaroo pocket. Perfect for cold weather walks.",
        "price": 999.0,
        "mrp": 1299.0,
        "category": "apparel",
        "subcategory": "hoodies",
        "brand": "HUFT",
        "pillars": ["shop", "stay"],
        "primary_pillar": "shop",
        "tags": ["hoodie", "winter", "fleece", "warm", "huft"],
        "image_url": "https://images.unsplash.com/photo-1518882605630-8d28b52a6564?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["winter"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Raincoat with Hood",
        "description": "Waterproof raincoat with reflective strips and adjustable hood. Keeps your pet dry during monsoon walks. Easy on/off design.",
        "price": 1199.0,
        "mrp": 1499.0,
        "category": "apparel",
        "subcategory": "rainwear",
        "brand": "HUFT",
        "pillars": ["shop", "travel"],
        "primary_pillar": "shop",
        "tags": ["raincoat", "waterproof", "reflective", "monsoon", "huft"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["monsoon"],
        "is_pan_india": True
    },
    
    # === ACCESSORIES (Shop Pillar) ===
    {
        "name": "HUFT Premium Leather Collar",
        "description": "Handcrafted genuine leather collar with brass hardware. Adjustable fit with D-ring for leash attachment. Classic and durable.",
        "price": 1499.0,
        "mrp": 1899.0,
        "category": "accessories",
        "subcategory": "collars",
        "brand": "HUFT",
        "pillars": ["shop"],
        "primary_pillar": "shop",
        "tags": ["collar", "leather", "premium", "classic", "huft"],
        "image_url": "https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Printed Harness with Lead",
        "description": "Stylish printed harness with matching lead. No-pull design with padded chest plate. Even weight distribution for comfortable walks.",
        "price": 1299.0,
        "mrp": 1699.0,
        "category": "accessories",
        "subcategory": "harnesses",
        "brand": "HUFT",
        "pillars": ["shop", "travel"],
        "primary_pillar": "shop",
        "tags": ["harness", "lead", "no-pull", "padded", "huft"],
        "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Retractable Leash 5M",
        "description": "5-meter retractable leash with ergonomic grip and quick-lock button. Reflective cord for night visibility. Supports up to 30kg.",
        "price": 899.0,
        "mrp": 1199.0,
        "category": "accessories",
        "subcategory": "leashes",
        "brand": "HUFT",
        "pillars": ["shop", "travel"],
        "primary_pillar": "shop",
        "tags": ["leash", "retractable", "reflective", "huft"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "life_stages": ["all"],
        "size_suitability": ["S", "M", "L"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Bandana Set (Pack of 3)",
        "description": "Trendy bandana set with 3 different prints. Adjustable snap closure. Perfect for adding style to everyday walks or special occasions.",
        "price": 499.0,
        "mrp": 699.0,
        "category": "accessories",
        "subcategory": "bandanas",
        "brand": "HUFT",
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags": ["bandana", "fashion", "stylish", "pack", "huft"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["party", "birthday"],
        "is_pan_india": True
    },
    
    # === GROOMING (Care Pillar) ===
    {
        "name": "HUFT Gentle Slicker Brush",
        "description": "Professional-grade slicker brush with self-cleaning feature. Removes tangles and loose fur gently. Suitable for all coat types.",
        "price": 699.0,
        "mrp": 899.0,
        "category": "grooming",
        "subcategory": "brushes",
        "brand": "HUFT",
        "pillars": ["shop", "care"],
        "primary_pillar": "care",
        "tags": ["brush", "grooming", "slicker", "self-cleaning", "huft"],
        "image_url": "https://images.unsplash.com/photo-1581888227599-779811939961?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "coat_types": ["all"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Natural Oatmeal Shampoo",
        "description": "Gentle oatmeal-based shampoo for sensitive skin. Contains natural ingredients like aloe vera and vitamin E. pH balanced formula.",
        "price": 549.0,
        "mrp": 699.0,
        "category": "grooming",
        "subcategory": "shampoos",
        "brand": "HUFT",
        "pillars": ["shop", "care"],
        "primary_pillar": "care",
        "tags": ["shampoo", "oatmeal", "natural", "sensitive-skin", "huft"],
        "image_url": "https://images.unsplash.com/photo-1594896505506-1c879e0cd0a5?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Pet Nail Clipper with Guard",
        "description": "Professional nail clipper with safety guard to prevent over-cutting. Ergonomic non-slip grip. Includes free nail file.",
        "price": 399.0,
        "mrp": 549.0,
        "category": "grooming",
        "subcategory": "nail-care",
        "brand": "HUFT",
        "pillars": ["shop", "care"],
        "primary_pillar": "care",
        "tags": ["nail-clipper", "grooming", "safety", "huft"],
        "image_url": "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "is_pan_india": True
    },
    
    # === TRAVEL GEAR (Travel Pillar) ===
    {
        "name": "HUFT Travel Carrier Bag",
        "description": "Airline-approved pet carrier with mesh ventilation. Padded shoulder strap and multiple pockets. Comfortable and secure for short trips.",
        "price": 2499.0,
        "mrp": 2999.0,
        "category": "travel-gear",
        "subcategory": "carriers",
        "brand": "HUFT",
        "pillars": ["travel", "shop"],
        "primary_pillar": "travel",
        "tags": ["carrier", "travel", "airline-approved", "portable", "huft"],
        "image_url": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400",
        "life_stages": ["all"],
        "size_suitability": ["XS", "S"],
        "occasions": ["travel"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Car Safety Harness",
        "description": "Adjustable car safety harness with universal seat belt attachment. Crash-tested for safety. Allows comfortable sitting while secured.",
        "price": 1199.0,
        "mrp": 1499.0,
        "category": "travel-gear",
        "subcategory": "car-accessories",
        "brand": "HUFT",
        "pillars": ["travel", "shop"],
        "primary_pillar": "travel",
        "tags": ["car", "safety", "harness", "crash-tested", "huft"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["travel"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Collapsible Travel Bowl Set",
        "description": "Set of 2 collapsible silicone bowls for food and water. Compact, lightweight, and easy to clean. Includes carabiner clip.",
        "price": 449.0,
        "mrp": 599.0,
        "category": "travel-gear",
        "subcategory": "bowls",
        "brand": "HUFT",
        "pillars": ["travel", "dine", "shop"],
        "primary_pillar": "travel",
        "tags": ["bowl", "collapsible", "travel", "portable", "huft"],
        "image_url": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["travel"],
        "is_pan_india": True
    },
    
    # === BEDS & COMFORT (Stay Pillar) ===
    {
        "name": "HUFT Orthopedic Memory Foam Bed",
        "description": "Premium orthopedic bed with memory foam for joint support. Removable, washable cover. Ideal for senior dogs and large breeds.",
        "price": 3999.0,
        "mrp": 4999.0,
        "category": "beds",
        "subcategory": "orthopedic",
        "brand": "HUFT",
        "pillars": ["stay", "shop"],
        "primary_pillar": "stay",
        "tags": ["bed", "orthopedic", "memory-foam", "senior", "huft"],
        "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400",
        "life_stages": ["adult", "senior"],
        "size_suitability": ["L", "XL"],
        "occasions": ["senior_comfort"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Donut Calming Bed",
        "description": "Round calming bed with raised rim for security. Ultra-soft faux fur. Helps reduce anxiety and promotes restful sleep.",
        "price": 1999.0,
        "mrp": 2499.0,
        "category": "beds",
        "subcategory": "calming-beds",
        "brand": "HUFT",
        "pillars": ["stay", "shop"],
        "primary_pillar": "stay",
        "tags": ["bed", "calming", "anxiety-relief", "soft", "huft"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "life_stages": ["all"],
        "size_suitability": ["S", "M", "L"],
        "is_pan_india": True
    },
    {
        "name": "HUFT Cooling Mat Summer Edition",
        "description": "Pressure-activated cooling mat for hot summer days. No electricity or water needed. Safe gel technology provides instant relief.",
        "price": 1499.0,
        "mrp": 1899.0,
        "category": "beds",
        "subcategory": "cooling",
        "brand": "HUFT",
        "pillars": ["stay", "shop"],
        "primary_pillar": "stay",
        "tags": ["cooling", "mat", "summer", "temperature", "huft"],
        "image_url": "https://images.unsplash.com/photo-1518882605630-8d28b52a6564?w=400",
        "life_stages": ["all"],
        "size_suitability": ["all"],
        "occasions": ["summer"],
        "is_pan_india": True
    }
]


async def import_huft_products():
    """Import HUFT products to products_master collection"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"\n{'='*60}")
    print("HUFT Product Import Script")
    print(f"{'='*60}")
    
    imported = 0
    skipped = 0
    
    for product in HUFT_PRODUCTS:
        # Check if product already exists
        existing = await db.products_master.find_one({"name": product["name"]})
        if existing:
            print(f"  [SKIP] {product['name']} - already exists")
            skipped += 1
            continue
        
        # Create comprehensive product document
        now = datetime.now(timezone.utc).isoformat()
        product_id = f"huft-{secrets.token_hex(6)}"
        
        doc = {
            "id": product_id,
            "name": product["name"],
            "product_name": product["name"],
            "display_name": product["name"],
            "description": product["description"],
            "short_description": product["description"][:140] if len(product["description"]) > 140 else product["description"],
            "long_description": product["description"],
            "sku": f"HUFT-{secrets.token_hex(4).upper()}",
            
            # Pricing
            "price": product["price"],
            "mrp": product["mrp"],
            "base_price": product["price"],
            "pricing": {
                "base_price": product["price"],
                "mrp": product["mrp"],
                "selling_price": product["price"],
                "cost_price": product["price"] * 0.6,
                "gst_rate": 18,
                "currency": "INR"
            },
            
            # Categorization
            "category": product["category"],
            "subcategory": product.get("subcategory", ""),
            "product_type": "physical",
            "brand": product["brand"],
            
            # Pillar mapping
            "primary_pillar": product.get("primary_pillar", product["pillars"][0] if product.get("pillars") else "shop"),
            "pillars": product.get("pillars", ["shop"]),
            "tags": product["tags"],
            
            # Media
            "image_url": product["image_url"],
            "images": [product["image_url"]],
            "thumbnail": product["image_url"],
            
            # Suitability
            "suitability": {
                "pet_filters": {
                    "species": ["dog"],
                    "life_stages": product.get("life_stages", ["all"]),
                    "size_options": product.get("size_suitability", ["all"]),
                    "breed_applicability": "all"
                },
                "behavior": {
                    "energy_level_match": ["all"],
                    "chew_strength": product.get("chew_strength"),
                    "indoor_suitable": True,
                    "outdoor_suitable": True
                },
                "physical_traits": {
                    "coat_type_match": product.get("coat_types", []),
                    "brachycephalic_friendly": True,
                    "senior_friendly": "senior" in product.get("life_stages", []) or "all" in product.get("life_stages", [])
                }
            },
            
            # Pet safety
            "pet_safety": {
                "life_stages": product.get("life_stages", ["all"]),
                "size_suitability": product.get("size_suitability", ["all"]),
                "is_validated": True
            },
            
            # Occasions
            "occasions": product.get("occasions", []),
            
            # Mira visibility
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": True
            },
            "mira_hint": f"This {product['category']} from HUFT is perfect for dogs who love quality accessories. Great for {', '.join(product.get('occasions', ['everyday use']))}.",
            
            # Inventory
            "in_stock": True,
            "inventory": {
                "inventory_status": "in_stock",
                "track_inventory": True,
                "stock_quantity": 50,
                "low_stock_threshold": 5
            },
            
            # Fulfillment
            "is_pan_india": product.get("is_pan_india", True),
            "shipping": {
                "delivery_type": "ship",
                "is_pan_india": True,
                "available_cities": ["pan_india"]
            },
            
            # Visibility
            "visibility": {
                "status": "active",
                "visible_on_site": True
            },
            "status": "active",
            
            # Source tracking
            "source": "huft_import",
            "external_source": "huft",
            
            # Timestamps
            "created_at": now,
            "updated_at": now
        }
        
        await db.products_master.insert_one(doc)
        print(f"  [ADD] {product['name']} -> {product['primary_pillar']}")
        imported += 1
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Import Complete!")
    print(f"  Imported: {imported}")
    print(f"  Skipped:  {skipped}")
    print(f"{'='*60}\n")
    
    # Verify
    total = await db.products_master.count_documents({})
    huft_count = await db.products_master.count_documents({"brand": "HUFT"})
    print(f"Total products in master: {total}")
    print(f"Total HUFT products: {huft_count}")
    
    client.close()
    return imported


if __name__ == "__main__":
    asyncio.run(import_huft_products())
