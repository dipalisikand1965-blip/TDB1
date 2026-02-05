"""
Breed-Specific Celebration Products Generator
==============================================
Creates celebration products for all breeds:
- Birthday Cake (Custom breed cake)
- Party Hat
- Birthday Bandana Set
- Celebration Box
- Gotcha Day Kit
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets

# All 35 breeds
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

# Celebration product templates
CELEBRATION_TEMPLATES = [
    {
        "type": "birthday_cake",
        "name_template": "{breed} Custom Birthday Cake",
        "description_template": "Adorable {breed}-shaped birthday cake made with dog-safe ingredients! Features {breed} face design with edible decorations. Perfect centerpiece for your {breed}'s birthday celebration. Serves 4-6 dogs.",
        "category": "celebration",
        "subcategory": "birthday-cakes",
        "base_price": 899.0,
        "mrp": 1199.0,
        "pillars": ["celebrate", "dine"],
        "primary_pillar": "celebrate",
        "tags_extra": ["birthday", "cake", "custom", "dog-safe", "celebration", "party"],
        "image_url": "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400",
        "occasions": ["birthday"]
    },
    {
        "type": "party_hat",
        "name_template": "{breed} Birthday Party Hat",
        "description_template": "Festive party hat designed for {breed} head shape! Adjustable elastic strap for comfortable fit. Features '{breed} Birthday Star' print with colorful pom-pom. Reusable for many celebrations!",
        "category": "accessories",
        "subcategory": "party-accessories",
        "base_price": 299.0,
        "mrp": 399.0,
        "pillars": ["celebrate", "shop"],
        "primary_pillar": "celebrate",
        "tags_extra": ["party-hat", "birthday", "festive", "adjustable", "celebration"],
        "image_url": "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=400",
        "occasions": ["birthday", "party", "gotcha_day"]
    },
    {
        "type": "birthday_bandana",
        "name_template": "{breed} Birthday Bandana",
        "description_template": "Special birthday edition bandana for your {breed}! Features 'Birthday {breed}' text with balloon and cake prints. Soft cotton fabric with adjustable snap closure. Makes your pup the star of the party!",
        "category": "accessories",
        "subcategory": "bandanas",
        "base_price": 349.0,
        "mrp": 449.0,
        "pillars": ["celebrate", "shop"],
        "primary_pillar": "celebrate",
        "tags_extra": ["bandana", "birthday", "festive", "cotton", "photoshoot"],
        "image_url": "https://images.unsplash.com/photo-1636910825294-0d989167aeb9?w=400",
        "occasions": ["birthday", "party"]
    },
    {
        "type": "celebration_box",
        "name_template": "{breed} Birthday Celebration Box",
        "description_template": "Complete birthday party kit for your {breed}! Includes: party hat, birthday bandana, 2 squeaky toys, treat pouch, and photo props. Everything you need for an unforgettable {breed} birthday bash!",
        "category": "celebration",
        "subcategory": "party-kits",
        "base_price": 1499.0,
        "mrp": 1999.0,
        "pillars": ["celebrate"],
        "primary_pillar": "celebrate",
        "tags_extra": ["party-kit", "birthday", "complete-set", "gift", "celebration"],
        "image_url": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=400",
        "occasions": ["birthday"]
    },
    {
        "type": "gotcha_day",
        "name_template": "{breed} Gotcha Day Kit",
        "description_template": "Celebrate your {breed}'s adoption anniversary! Kit includes: commemorative bandana, 'Gotcha Day' photo frame, special treat bag, and celebration card. Perfect way to honor the day your {breed} joined your family!",
        "category": "celebration",
        "subcategory": "gotcha-day",
        "base_price": 799.0,
        "mrp": 999.0,
        "pillars": ["celebrate"],
        "primary_pillar": "celebrate",
        "tags_extra": ["gotcha-day", "adoption", "anniversary", "gift", "commemoration"],
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "occasions": ["gotcha_day", "adoption_anniversary"]
    }
]

SIZE_MAP = {
    "XS": ["XS", "S"],
    "S": ["S", "M"],
    "M": ["M", "L"],
    "L": ["L", "XL"],
    "XL": ["XL"]
}


async def generate_celebration_products():
    """Generate celebration products for all breeds"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"\n{'='*60}")
    print("Breed-Specific Celebration Products Generator")
    print(f"{'='*60}")
    print(f"Breeds: {len(ALL_BREEDS)}")
    print(f"Celebration templates: {len(CELEBRATION_TEMPLATES)}")
    print(f"Products to create: {len(ALL_BREEDS) * len(CELEBRATION_TEMPLATES)}")
    print(f"{'='*60}\n")
    
    created = 0
    skipped = 0
    
    for breed in ALL_BREEDS:
        breed_name = breed["name"]
        
        for template in CELEBRATION_TEMPLATES:
            product_name = template["name_template"].format(breed=breed_name)
            
            # Check if exists
            existing = await db.products_master.find_one({"name": product_name})
            if existing:
                skipped += 1
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            product_id = f"celebrate-{breed['icon']}-{template['type']}-{secrets.token_hex(4)}"
            
            doc = {
                "id": product_id,
                "name": product_name,
                "product_name": product_name,
                "display_name": product_name,
                "description": template["description_template"].format(breed=breed_name),
                "short_description": f"Special {template['type'].replace('_', ' ')} for your {breed_name}! Perfect for celebrations.",
                "sku": f"CELEB-{breed['icon'].upper()}-{template['type'].upper()[:4]}-{secrets.token_hex(3).upper()}",
                
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
                
                # Pillar mapping - CELEBRATE is primary!
                "primary_pillar": template["primary_pillar"],
                "pillars": template["pillars"],
                
                # Tags
                "tags": [
                    breed_name.lower().replace(" ", "-"),
                    breed["short"].lower(),
                    "personalized",
                    "breed-specific",
                    "celebration",
                    template["type"].replace("_", "-")
                ] + template["tags_extra"],
                
                # Breed metadata - CRITICAL for Mira picks
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
                
                # Occasions - CRITICAL for Mira birthday picks
                "occasions": template.get("occasions", ["birthday"]),
                
                # Mira visibility - HIGH PRIORITY for proactive suggestions
                "mira_visibility": {
                    "can_reference": True,
                    "can_suggest_proactively": True
                },
                "mira_hint": f"Perfect for {breed_name} celebrations! This {template['type'].replace('_', ' ')} is specially designed for {breed_name} dogs. Great for birthdays, gotcha days, and special occasions!",
                
                # Inventory
                "in_stock": True,
                "inventory": {
                    "inventory_status": "in_stock",
                    "track_inventory": True,
                    "stock_quantity": 25,
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
                "source": "celebration_generator",
                "is_personalized": True,
                "is_breed_specific": True,
                "is_celebration_item": True,
                
                # Timestamps
                "created_at": now,
                "updated_at": now
            }
            
            await db.products_master.insert_one(doc)
            created += 1
        
        print(f"  Created celebration products for {breed_name}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Generation Complete!")
    print(f"  Created:  {created}")
    print(f"  Skipped:  {skipped}")
    print(f"{'='*60}\n")
    
    # Verify
    total = await db.products_master.count_documents({})
    celebration = await db.products_master.count_documents({"is_celebration_item": True})
    celebrate_pillar = await db.products_master.count_documents({"primary_pillar": "celebrate"})
    
    print(f"Total products in master: {total}")
    print(f"Celebration items: {celebration}")
    print(f"Celebrate pillar products: {celebrate_pillar}")
    
    # Sample Indie products
    print(f"\nIndie celebration products:")
    indie_products = await db.products_master.find({
        "breed_metadata.breed_name": "Indie",
        "primary_pillar": "celebrate"
    }).to_list(10)
    for p in indie_products:
        print(f"  - {p['name']} | ₹{p.get('price')}")
    
    client.close()
    return created


if __name__ == "__main__":
    asyncio.run(generate_celebration_products())
