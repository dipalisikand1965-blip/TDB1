"""
Expanded Breed-Specific Product Generator
==========================================
Adds:
1. More breeds (15 additional popular breeds)
2. More product categories (6 new types)
Total: 35 breeds × 14 product types = 490 products
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets

# Extended breeds list (15 NEW breeds to add to existing 20)
NEW_BREEDS = [
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

# ALL breeds (existing 20 + new 15)
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
] + NEW_BREEDS

# NEW product templates (6 additional categories)
NEW_PRODUCT_TEMPLATES = [
    {
        "type": "bed",
        "name_template": "{breed} Comfort Bed",
        "description_template": "Luxurious comfort bed designed specifically for {breed} dogs. Features orthopedic support, removable washable cover, and non-slip bottom. Perfect size for your {breed}'s comfort.",
        "category": "beds",
        "subcategory": "comfort-beds",
        "base_price": 1499.0,
        "mrp": 1999.0,
        "pillars": ["shop", "stay"],
        "primary_pillar": "stay",
        "tags_extra": ["bed", "comfort", "orthopedic", "washable", "sleep"],
        "image_url": "https://images.unsplash.com/photo-1733344023270-1c5f5ef6e850?w=400",
        "occasions": ["new_puppy", "senior_comfort"]
    },
    {
        "type": "elevated_feeder",
        "name_template": "{breed} Elevated Feeder Set",
        "description_template": "Ergonomic elevated feeder designed for {breed}'s height. Includes 2 stainless steel bowls. Reduces neck strain and aids digestion. Anti-slip feet for stability.",
        "category": "accessories",
        "subcategory": "feeders",
        "base_price": 1299.0,
        "mrp": 1699.0,
        "pillars": ["shop", "dine"],
        "primary_pillar": "dine",
        "tags_extra": ["feeder", "elevated", "stainless-steel", "ergonomic", "digestion"],
        "image_url": "https://images.unsplash.com/photo-1695023267130-c5bcdfd151d5?w=400",
        "occasions": ["new_puppy"]
    },
    {
        "type": "training_kit",
        "name_template": "{breed} Training Starter Kit",
        "description_template": "Complete training kit tailored for {breed} temperament. Includes clicker, treat pouch, training treats, and {breed}-specific training guide. Perfect for puppies and adult dogs.",
        "category": "training",
        "subcategory": "training-kits",
        "base_price": 999.0,
        "mrp": 1299.0,
        "pillars": ["shop", "learn"],
        "primary_pillar": "learn",
        "tags_extra": ["training", "clicker", "treats", "guide", "behavior"],
        "image_url": "https://images.unsplash.com/photo-1761660304474-d921d4d3f49d?w=400",
        "occasions": ["new_puppy", "training"]
    },
    {
        "type": "grooming_kit",
        "name_template": "{breed} Grooming Essentials Kit",
        "description_template": "Complete grooming kit curated for {breed} coat type. Includes breed-appropriate brush, comb, nail clipper, and ear cleaner. Keep your {breed} looking their best!",
        "category": "grooming",
        "subcategory": "grooming-kits",
        "base_price": 1199.0,
        "mrp": 1499.0,
        "pillars": ["shop", "care"],
        "primary_pillar": "care",
        "tags_extra": ["grooming", "brush", "nail-care", "coat", "hygiene"],
        "image_url": "https://images.unsplash.com/photo-1727510190155-51abda425a82?w=400",
        "occasions": []
    },
    {
        "type": "dental_kit",
        "name_template": "{breed} Dental Care Kit",
        "description_template": "Complete dental care kit for {breed} oral health. Includes toothbrush, enzymatic toothpaste, dental chews, and breath freshener. Prevent tartar buildup and keep those teeth sparkling!",
        "category": "care",
        "subcategory": "dental-care",
        "base_price": 799.0,
        "mrp": 999.0,
        "pillars": ["shop", "care"],
        "primary_pillar": "care",
        "tags_extra": ["dental", "toothbrush", "toothpaste", "oral-health", "fresh-breath"],
        "image_url": "https://images.unsplash.com/photo-1747577672081-991640ad50ce?w=400",
        "occasions": []
    },
    {
        "type": "walking_set",
        "name_template": "{breed} Walking Adventure Set",
        "description_template": "Premium walking set designed for {breed} adventures. Includes padded harness, retractable leash, poop bag holder, and collapsible water bowl. Everything for the perfect walk!",
        "category": "accessories",
        "subcategory": "walking-sets",
        "base_price": 1599.0,
        "mrp": 1999.0,
        "pillars": ["shop", "travel", "fit"],
        "primary_pillar": "travel",
        "tags_extra": ["walking", "harness", "leash", "outdoor", "adventure"],
        "image_url": "https://images.unsplash.com/photo-1759336118263-595935e7f4d8?w=400",
        "occasions": ["travel"]
    }
]

# Size mapping for breed-appropriate sizes
SIZE_MAP = {
    "XS": ["XS", "S"],
    "S": ["S", "M"],
    "M": ["M", "L"],
    "L": ["L", "XL"],
    "XL": ["XL"]
}


async def generate_expanded_products():
    """Generate new categories for all breeds + all products for new breeds"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"\n{'='*60}")
    print("Expanded Breed-Specific Product Generator")
    print(f"{'='*60}")
    print(f"New breeds to add: {len(NEW_BREEDS)}")
    print(f"New product templates: {len(NEW_PRODUCT_TEMPLATES)}")
    print(f"Total breeds: {len(ALL_BREEDS)}")
    print(f"{'='*60}\n")
    
    created = 0
    skipped = 0
    
    # PART 1: Add NEW product categories for ALL breeds (existing + new)
    print("\n--- Adding new product categories for ALL breeds ---")
    for breed in ALL_BREEDS:
        breed_name = breed["name"]
        
        for template in NEW_PRODUCT_TEMPLATES:
            product_name = template["name_template"].format(breed=breed_name)
            
            # Check if exists
            existing = await db.products_master.find_one({"name": product_name})
            if existing:
                skipped += 1
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            product_id = f"breed-{breed['icon']}-{template['type']}-{secrets.token_hex(4)}"
            
            doc = create_product_doc(breed, template, product_name, product_id, now)
            await db.products_master.insert_one(doc)
            created += 1
        
        print(f"  Added new categories for {breed_name}")
    
    # PART 2: Add EXISTING 8 product types for NEW breeds only
    print("\n--- Adding existing product types for NEW breeds ---")
    EXISTING_TEMPLATES = [
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
            "image_url": "https://images.unsplash.com/photo-1636910825294-0d989167aeb9?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1637847445530-7618f46e0022?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1628443603787-a1b4f4a2d555?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1676512416925-fe8c5496eaef?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1682969651476-6fb48aba8b03?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1673057912717-711c4a111ab5?w=400",
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
            "image_url": "https://images.unsplash.com/photo-1759990639053-80b6c7acb10b?w=400",
            "occasions": ["birthday", "new_puppy"]
        }
    ]
    
    for breed in NEW_BREEDS:
        breed_name = breed["name"]
        
        for template in EXISTING_TEMPLATES:
            product_name = template["name_template"].format(breed=breed_name)
            
            existing = await db.products_master.find_one({"name": product_name})
            if existing:
                skipped += 1
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            product_id = f"breed-{breed['icon']}-{template['type']}-{secrets.token_hex(4)}"
            
            doc = create_product_doc(breed, template, product_name, product_id, now)
            await db.products_master.insert_one(doc)
            created += 1
        
        print(f"  Added all products for NEW breed: {breed_name}")
    
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
    
    # Sample by breed
    print(f"\nSample breed counts:")
    for breed in ALL_BREEDS[:5]:
        count = await db.products_master.count_documents({
            "breed_metadata.breeds": breed["name"]
        })
        print(f"  {breed['name']}: {count} products")
    
    client.close()
    return created


def create_product_doc(breed, template, product_name, product_id, now):
    """Create a comprehensive product document"""
    breed_name = breed["name"]
    
    return {
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
                "size_options": SIZE_MAP.get(breed["size"], ["all"]),
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
            "size_suitability": SIZE_MAP.get(breed["size"], ["all"]),
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
        "source": "breed_generator_v2",
        "is_personalized": True,
        "is_breed_specific": True,
        
        # Timestamps
        "created_at": now,
        "updated_at": now
    }


if __name__ == "__main__":
    asyncio.run(generate_expanded_products())
