"""
Breed-Specific Personalized Products Generator
===============================================
Creates personalized products for popular dog breeds like:
- Shih Tzu Bandana
- Labrador Mug
- Golden Retriever T-Shirt
- Indie Accessories
etc.

These products enhance cross-selling when someone mentions their breed.
Example: "Mojo Indie birthday" -> Show Indie accessories + personalized items
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets

# Popular breeds with their characteristics
BREEDS_CONFIG = [
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
    {"name": "Chihuahua", "short": "Chi", "size": "XS", "icon": "chi"}
]

# Product templates for breed-specific items
PRODUCT_TEMPLATES = [
    {
        "type": "bandana",
        "name_template": "{breed} Pawfect Bandana",
        "description_template": "Exclusive {breed} themed bandana featuring adorable {breed} prints. Perfect for showing off your {breed} pride! Made with soft, breathable cotton. Adjustable snap closure fits most neck sizes.",
        "category": "accessories",
        "subcategory": "bandanas",
        "base_price": 399.0,
        "mrp": 549.0,
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags_extra": ["bandana", "fashion", "breed-specific", "personalized", "photoshoot"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "occasions": ["birthday", "party", "gotcha_day"]
    },
    {
        "type": "mug",
        "name_template": "{breed} Mom/Dad Coffee Mug",
        "description_template": "Start your day with this adorable {breed} themed ceramic mug! Features cute {breed} illustrations with 'Proud {breed} Parent' text. 330ml capacity, microwave and dishwasher safe.",
        "category": "accessories",
        "subcategory": "pet-parent-gifts",
        "base_price": 499.0,
        "mrp": 699.0,
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags_extra": ["mug", "pet-parent", "gift", "ceramic", "personalized"],
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
        "occasions": ["birthday", "gotcha_day", "holiday"]
    },
    {
        "type": "tshirt",
        "name_template": "{breed} Love T-Shirt (Pet)",
        "description_template": "Cute {breed} themed t-shirt for your fur baby! Features '{breed} & Proud' print on soft cotton fabric. Machine washable. Available in multiple sizes.",
        "category": "apparel",
        "subcategory": "t-shirts",
        "base_price": 599.0,
        "mrp": 799.0,
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags_extra": ["t-shirt", "apparel", "breed-themed", "cotton", "fashion"],
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "occasions": ["birthday", "party"]
    },
    {
        "type": "bowl",
        "name_template": "{breed} Personalized Food Bowl",
        "description_template": "Premium ceramic food bowl with {breed} illustration and customizable name plate. Non-slip base, easy to clean. Perfect size for {breed} dogs.",
        "category": "accessories",
        "subcategory": "bowls",
        "base_price": 799.0,
        "mrp": 999.0,
        "pillars": ["shop", "dine"],
        "primary_pillar": "shop",
        "tags_extra": ["bowl", "ceramic", "personalized", "food-bowl", "non-slip"],
        "image_url": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
        "occasions": ["new_puppy", "gotcha_day"]
    },
    {
        "type": "keychain",
        "name_template": "{breed} Charm Keychain",
        "description_template": "Adorable {breed} silhouette keychain in metal finish. Perfect gift for {breed} lovers! Includes key ring and lobster clasp.",
        "category": "accessories",
        "subcategory": "pet-parent-gifts",
        "base_price": 299.0,
        "mrp": 399.0,
        "pillars": ["shop", "celebrate"],
        "primary_pillar": "shop",
        "tags_extra": ["keychain", "gift", "metal", "charm", "pet-parent"],
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        "occasions": ["birthday", "gotcha_day", "holiday"]
    },
    {
        "type": "collar_tag",
        "name_template": "{breed} ID Tag (Bone Shaped)",
        "description_template": "Bone-shaped ID tag with {breed} breed engraving. Made from durable stainless steel. Includes free personalization with pet name and phone number.",
        "category": "accessories",
        "subcategory": "id-tags",
        "base_price": 349.0,
        "mrp": 449.0,
        "pillars": ["shop", "care"],
        "primary_pillar": "shop",
        "tags_extra": ["id-tag", "safety", "engraved", "personalized", "stainless-steel"],
        "image_url": "https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400",
        "occasions": ["new_puppy"]
    },
    {
        "type": "blanket",
        "name_template": "{breed} Snuggle Blanket",
        "description_template": "Cozy fleece blanket with {breed} pattern print. Perfect for snuggling on the couch or adding to their bed. Machine washable. Size: 100x75cm.",
        "category": "beds",
        "subcategory": "blankets",
        "base_price": 899.0,
        "mrp": 1199.0,
        "pillars": ["shop", "stay"],
        "primary_pillar": "stay",
        "tags_extra": ["blanket", "fleece", "cozy", "breed-print", "washable"],
        "image_url": "https://images.unsplash.com/photo-1518882605630-8d28b52a6564?w=400",
        "occasions": ["winter", "new_puppy"]
    },
    {
        "type": "toy",
        "name_template": "{breed} Plush Lookalike Toy",
        "description_template": "Adorable plush toy that looks just like a {breed}! Soft, squeaky, and perfect for cuddling. Great companion toy for your {breed}.",
        "category": "toys",
        "subcategory": "plush-toys",
        "base_price": 699.0,
        "mrp": 899.0,
        "pillars": ["shop", "enjoy"],
        "primary_pillar": "shop",
        "tags_extra": ["toy", "plush", "squeaky", "lookalike", "cuddly"],
        "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400",
        "occasions": ["birthday", "new_puppy"]
    }
]


async def generate_breed_products():
    """Generate breed-specific personalized products"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"\n{'='*60}")
    print("Breed-Specific Product Generator")
    print(f"{'='*60}")
    print(f"Breeds: {len(BREEDS_CONFIG)}")
    print(f"Product templates: {len(PRODUCT_TEMPLATES)}")
    print(f"Max products to create: {len(BREEDS_CONFIG) * len(PRODUCT_TEMPLATES)}")
    print(f"{'='*60}\n")
    
    created = 0
    skipped = 0
    
    for breed in BREEDS_CONFIG:
        breed_name = breed["name"]
        print(f"\nProcessing {breed_name}...")
        
        for template in PRODUCT_TEMPLATES:
            product_name = template["name_template"].format(breed=breed_name)
            
            # Check if exists
            existing = await db.products_master.find_one({"name": product_name})
            if existing:
                skipped += 1
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            product_id = f"breed-{breed['icon']}-{template['type']}-{secrets.token_hex(4)}"
            
            # Determine size suitability based on breed
            size_map = {
                "XS": ["XS", "S"],
                "S": ["S", "M"],
                "M": ["M", "L"],
                "L": ["L", "XL"],
                "XL": ["XL"]
            }
            
            doc = {
                "id": product_id,
                "name": product_name,
                "product_name": product_name,
                "display_name": product_name,
                "description": template["description_template"].format(breed=breed_name),
                "short_description": f"Exclusive {breed_name} themed {template['type']}. Perfect for proud {breed_name} parents!",
                "sku": f"BREED-{breed['icon'].upper()}-{template['type'].upper()}-{secrets.token_hex(3).upper()}",
                
                # Pricing
                "price": template["base_price"],
                "mrp": template["mrp"],
                "base_price": template["base_price"],
                "pricing": {
                    "base_price": template["base_price"],
                    "mrp": template["mrp"],
                    "selling_price": template["base_price"],
                    "cost_price": template["base_price"] * 0.5,
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
                
                # Tags - include breed name for search
                "tags": [
                    breed_name.lower().replace(" ", "-"),
                    breed["short"].lower(),
                    "personalized",
                    "breed-specific",
                    template["type"]
                ] + template["tags_extra"],
                
                # Breed metadata - CRITICAL for cross-population
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
                        "size_options": size_map.get(breed["size"], ["all"]),
                        "breed_applicability": "selected",
                        "applicable_breeds": [breed_name]
                    },
                    "behavior": {
                        "energy_level_match": ["all"],
                        "indoor_suitable": True,
                        "outdoor_suitable": True
                    }
                },
                
                # Pet safety
                "pet_safety": {
                    "life_stages": ["all"],
                    "size_suitability": size_map.get(breed["size"], ["all"]),
                    "is_validated": True
                },
                
                # Occasions
                "occasions": template.get("occasions", ["birthday", "gotcha_day"]),
                
                # Mira visibility - enable proactive suggestions
                "mira_visibility": {
                    "can_reference": True,
                    "can_suggest_proactively": True
                },
                "mira_hint": f"This is a {breed_name}-themed {template['type']}! Perfect gift for {breed_name} lovers. Great for birthdays, gotcha days, or just because they're the best {breed_name} ever!",
                
                # Inventory
                "in_stock": True,
                "inventory": {
                    "inventory_status": "in_stock",
                    "track_inventory": True,
                    "stock_quantity": 30,
                    "low_stock_threshold": 5
                },
                
                # Fulfillment
                "is_pan_india": True,
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
                "source": "breed_generator",
                "is_personalized": True,
                "is_breed_specific": True,
                
                # Timestamps
                "created_at": now,
                "updated_at": now
            }
            
            await db.products_master.insert_one(doc)
            created += 1
        
        print(f"  Created products for {breed_name}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Generation Complete!")
    print(f"  Created:  {created}")
    print(f"  Skipped:  {skipped}")
    print(f"{'='*60}\n")
    
    # Verify
    total = await db.products_master.count_documents({})
    breed_specific = await db.products_master.count_documents({"is_breed_specific": True})
    
    print(f"Total products in master: {total}")
    print(f"Total breed-specific products: {breed_specific}")
    
    # Show sample by breed
    print(f"\nSample by breed:")
    for breed in BREEDS_CONFIG[:5]:
        count = await db.products_master.count_documents({
            "breed_metadata.breeds": breed["name"]
        })
        print(f"  {breed['name']}: {count} products")
    
    client.close()
    return created


if __name__ == "__main__":
    asyncio.run(generate_breed_products())
