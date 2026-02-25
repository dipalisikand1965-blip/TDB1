"""
Clone Feeding Mats & Mugs for All Breeds
=========================================
Creates breed-specific feeding mats and mugs using the same 
style/format as existing products on thedoggycompany.in

Existing products use Shopify CDN images. We'll use generic 
Unsplash images for new breeds since we can't generate breed-specific
illustrations automatically.
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets

# All 35 breeds with their configurations
ALL_BREEDS = [
    {"name": "Labrador", "short": "Lab", "size": "L", "icon": "lab"},
    {"name": "Golden Retriever", "short": "Goldie", "size": "L", "icon": "golden"},
    {"name": "Indie", "short": "Indie", "size": "M", "icon": "indie"},
    {"name": "German Shepherd", "short": "GSD", "size": "L", "icon": "gsd"},
    {"name": "Beagle", "short": "Beagle", "size": "S", "icon": "beagle"},
    {"name": "Pug", "short": "Pug", "size": "XS", "icon": "pug"},
    {"name": "Shih Tzu", "short": "Shih Tzu", "size": "XS", "icon": "shihtzu"},
    {"name": "Pomeranian", "short": "Pom", "size": "XS", "icon": "pom"},
    {"name": "Husky", "short": "Husky", "size": "L", "icon": "husky"},
    {"name": "Rottweiler", "short": "Rottie", "size": "XL", "icon": "rottie"},
    {"name": "Dachshund", "short": "Dachshund", "size": "S", "icon": "dachshund"},
    {"name": "Cocker Spaniel", "short": "Cocker", "size": "M", "icon": "cocker"},
    {"name": "French Bulldog", "short": "Frenchie", "size": "S", "icon": "frenchie"},
    {"name": "Boxer", "short": "Boxer", "size": "L", "icon": "boxer"},
    {"name": "Great Dane", "short": "Dane", "size": "XL", "icon": "dane"},
    {"name": "Doberman", "short": "Dobie", "size": "L", "icon": "dobie"},
    {"name": "Maltese", "short": "Maltese", "size": "XS", "icon": "maltese"},
    {"name": "Yorkshire Terrier", "short": "Yorkie", "size": "XS", "icon": "yorkie"},
    {"name": "Lhasa Apso", "short": "Lhasa", "size": "S", "icon": "lhasa"},
    {"name": "Chihuahua", "short": "Chi", "size": "XS", "icon": "chi"},
    {"name": "Spitz", "short": "Spitz", "size": "M", "icon": "spitz"},
    {"name": "Saint Bernard", "short": "Saint", "size": "XL", "icon": "saintbernard"},
    {"name": "Shiba Inu", "short": "Shiba", "size": "M", "icon": "shiba"},
    {"name": "Border Collie", "short": "Border", "size": "M", "icon": "bordercollie"},
    {"name": "Akita", "short": "Akita", "size": "L", "icon": "akita"},
    {"name": "Dalmatian", "short": "Dalmatian", "size": "L", "icon": "dalmatian"},
    {"name": "Bulldog", "short": "Bulldog", "size": "M", "icon": "bulldog"},
    {"name": "Poodle", "short": "Poodle", "size": "M", "icon": "poodle"},
    {"name": "Australian Shepherd", "short": "Aussie", "size": "M", "icon": "aussie"},
    {"name": "Cavalier King Charles", "short": "Cavalier", "size": "S", "icon": "cavalier"},
    {"name": "Bernese Mountain Dog", "short": "Bernese", "size": "XL", "icon": "bernese"},
    {"name": "Samoyed", "short": "Sammy", "size": "L", "icon": "samoyed"},
    {"name": "Corgi", "short": "Corgi", "size": "S", "icon": "corgi"},
    {"name": "Jack Russell", "short": "JRT", "size": "S", "icon": "jackrussell"},
    {"name": "Weimaraner", "short": "Weim", "size": "L", "icon": "weimaraner"}
]

# Generic images for new products (Unsplash)
FEEDING_MAT_IMAGE = "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400"
COFFEE_MUG_IMAGE = "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400"

# Product templates matching existing TDC style
PRODUCT_TEMPLATES = [
    {
        "type": "feeding_mat",
        "name_template": "{breed} Feeding Mat",
        "description_template": "Adorable {breed} illustrated feeding mat to make meal time special! Features cute {breed} artwork on high-quality, waterproof material. Easy to clean, non-slip backing. Perfect gift for {breed} parents! Size: 18\" x 12\"",
        "category": "accessories",
        "subcategory": "feeding-mats",
        "base_price": 350.0,
        "mrp": 450.0,
        "pillars": ["shop", "dine"],
        "primary_pillar": "shop",
        "tags_extra": ["feeding-mat", "mealtime", "waterproof", "non-slip", "illustrated"],
        "image_url": FEEDING_MAT_IMAGE,
        "occasions": ["new_puppy", "gotcha_day"]
    },
    {
        "type": "coffee_mug",
        "name_template": "{breed} Coffee Mug",
        "description_template": "Start your morning right with this beautiful {breed} illustrated coffee mug! Features adorable {breed} artwork wrapped around a quality ceramic mug. Microwave and dishwasher safe. 11oz capacity. Perfect for proud {breed} parents!",
        "category": "accessories",
        "subcategory": "mugs",
        "base_price": 350.0,
        "mrp": 450.0,
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags_extra": ["mug", "coffee", "ceramic", "pet-parent", "illustrated", "gift"],
        "image_url": COFFEE_MUG_IMAGE,
        "occasions": ["birthday", "gotcha_day", "holiday"]
    }
]

SIZE_MAP = {
    "XS": ["XS", "S"],
    "S": ["S", "M"],
    "M": ["M", "L"],
    "L": ["L", "XL"],
    "XL": ["XL"]
}


async def clone_mats_and_mugs():
    """Create feeding mats and coffee mugs for all breeds"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"\n{'='*60}")
    print("Clone Feeding Mats & Mugs for All Breeds")
    print(f"{'='*60}")
    print(f"Breeds: {len(ALL_BREEDS)}")
    print(f"Product types: {len(PRODUCT_TEMPLATES)}")
    print(f"Max products to create: {len(ALL_BREEDS) * len(PRODUCT_TEMPLATES)}")
    print(f"{'='*60}\n")
    
    created = 0
    skipped = 0
    
    for breed in ALL_BREEDS:
        breed_name = breed["name"]
        
        for template in PRODUCT_TEMPLATES:
            product_name = template["name_template"].format(breed=breed_name)
            
            # Check if exists (case-insensitive)
            existing = await db.products_master.find_one({
                "name": {"$regex": f"^{breed_name}.*{template['type'].replace('_', ' ').title()}$", "$options": "i"}
            })
            if existing:
                skipped += 1
                continue
            
            # Also check exact name
            existing_exact = await db.products_master.find_one({"name": product_name})
            if existing_exact:
                skipped += 1
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            product_id = f"tdc-{breed['icon']}-{template['type']}-{secrets.token_hex(4)}"
            
            doc = {
                "id": product_id,
                "name": product_name,
                "product_name": product_name,
                "display_name": product_name,
                "description": template["description_template"].format(breed=breed_name),
                "short_description": f"Beautiful {breed_name} illustrated {template['type'].replace('_', ' ')}. Perfect for {breed_name} lovers!",
                "sku": f"TDC-{breed['icon'].upper()}-{template['type'].upper()[:3]}-{secrets.token_hex(3).upper()}",
                
                # Pricing - matching TDC prices
                "price": template["base_price"],
                "mrp": template["mrp"],
                "base_price": template["base_price"],
                "pricing": {
                    "base_price": template["base_price"],
                    "mrp": template["mrp"],
                    "selling_price": template["base_price"],
                    "cost_price": template["base_price"] * 0.4,
                    "gst_rate": 18,
                    "currency": "INR"
                },
                
                # Categorization
                "category": template["category"],
                "subcategory": template["subcategory"],
                "product_type": "physical",
                "brand": "The Doggy Company",
                
                # Pillar mapping
                "primary_pillar": template["primary_pillar"],
                "pillars": template["pillars"],
                
                # Tags
                "tags": [
                    breed_name.lower().replace(" ", "-"),
                    breed["short"].lower(),
                    "personalized",
                    "breed-specific",
                    template["type"].replace("_", "-"),
                    "tdc-original"
                ] + template["tags_extra"],
                
                # Breed metadata
                "breed_metadata": {
                    "breeds": [breed_name],
                    "breed_specific": True,
                    "breed_name": breed_name,
                    "breed_icon": breed["icon"]
                },
                "breed_tags": [breed_name],
                
                # Media
                "image_url": template["image_url"],
                "images": [template["image_url"]],
                "thumbnail": template["image_url"],
                
                # Suitability
                "suitability": {
                    "pet_filters": {
                        "species": ["dog"],
                        "life_stages": ["all"],
                        "size_options": SIZE_MAP.get(breed["size"], ["all"]),
                        "breed_applicability": "selected",
                        "applicable_breeds": [breed_name]
                    }
                },
                
                # Occasions
                "occasions": template.get("occasions", []),
                
                # Mira visibility
                "mira_visibility": {
                    "can_reference": True,
                    "can_suggest_proactively": True
                },
                "mira_hint": f"This adorable {breed_name} {template['type'].replace('_', ' ')} makes a perfect gift for any {breed_name} lover! Great for birthdays, gotcha days, or just because.",
                
                # Inventory
                "in_stock": True,
                "inventory": {
                    "inventory_status": "in_stock",
                    "track_inventory": True,
                    "stock_quantity": 50,
                    "low_stock_threshold": 5
                },
                
                # Fulfillment
                "is_pan_india": True,
                "shipping": {
                    "delivery_type": "ship",
                    "is_pan_india": True
                },
                
                # Visibility
                "visibility": {
                    "status": "active",
                    "visible_on_site": True
                },
                "status": "active",
                
                # Source tracking
                "source": "tdc_clone",
                "is_personalized": True,
                "is_breed_specific": True,
                
                # Timestamps
                "created_at": now,
                "updated_at": now
            }
            
            await db.products_master.insert_one(doc)
            created += 1
        
        print(f"  Processed {breed_name}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Clone Complete!")
    print(f"  Created:  {created}")
    print(f"  Skipped (already exist): {skipped}")
    print(f"{'='*60}\n")
    
    # Verify
    total = await db.products_master.count_documents({})
    mats = await db.products_master.count_documents({"subcategory": "feeding-mats", "is_breed_specific": True})
    mugs = await db.products_master.count_documents({"subcategory": "mugs", "is_breed_specific": True})
    
    print(f"Total products in master: {total}")
    print(f"Breed-specific feeding mats: {mats}")
    print(f"Breed-specific mugs: {mugs}")
    
    # Sample products
    print(f"\nSample new products:")
    samples = await db.products_master.find({"source": "tdc_clone"}).limit(6).to_list(6)
    for p in samples:
        print(f"  - {p['name']} | ₹{p.get('price')}")
    
    client.close()
    return created


if __name__ == "__main__":
    asyncio.run(clone_mats_and_mugs())
