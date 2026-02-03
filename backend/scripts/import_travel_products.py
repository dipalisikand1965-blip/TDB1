"""
Travel Products Import Script - Based on Supertails Data
=========================================================
Creates travel products for TDC pillars with proper Mira search tags.
Products are assigned to: Travel, Stay, Dine pillars.
"""

import asyncio
import secrets
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Travel products based on Supertails catalog
TRAVEL_PRODUCTS = [
    # === CARRIERS & CRATES (Travel Pillar) ===
    {
        "name": "Savic Trotter 1 IATA Approved Carrier (Small)",
        "description": "IATA approved travel carrier for small dogs and cats. Perfect for airline cabin travel. Secure locking system with ventilation on all sides. Dimensions: 19x12x12 inches.",
        "price": 1906.0,
        "mrp": 2350.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "Savic",
        "pillar": "travel",
        "tags": ["carrier", "iata-approved", "airline", "small-pets", "flight", "travel", "ventilated", "cabin-approved"],
        "size_variant": "Small (19x12x12in)",
        "weight_grams": 1500
    },
    {
        "name": "Savic Trotter 2 IATA Approved Carrier (Medium)",
        "description": "IATA approved travel carrier for medium dogs and cats. Ideal for airline cabin travel. Secure doors with ventilation. Dimensions: 22x13x15 inches.",
        "price": 2601.0,
        "mrp": 3450.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "Savic",
        "pillar": "travel",
        "tags": ["carrier", "iata-approved", "airline", "medium-pets", "flight", "travel", "ventilated"],
        "size_variant": "Medium (22x13x15in)",
        "weight_grams": 2000
    },
    {
        "name": "Savic Trotter 3 IATA Approved Carrier (Large)",
        "description": "IATA approved travel carrier for larger dogs and cats. Perfect for airline cargo travel. Heavy-duty construction with secure locking. Dimensions: 24x15x16 inches.",
        "price": 3686.0,
        "mrp": 4600.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "Savic",
        "pillar": "travel",
        "tags": ["carrier", "iata-approved", "airline", "large-pets", "flight", "travel", "cargo"],
        "size_variant": "Large (24x15x16in)",
        "weight_grams": 2500
    },
    {
        "name": "Trixie Capri 3 IATA Approved Open Top Carrier",
        "description": "Premium IATA approved carrier with convenient open-top design for easy pet access. Dark grey color. Perfect for vet visits and short travels. Dimensions: 24x15x16 inches.",
        "price": 4456.0,
        "mrp": 5500.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "Trixie",
        "pillar": "travel",
        "tags": ["carrier", "iata-approved", "open-top", "vet-visits", "travel", "premium", "trixie"],
        "size_variant": "24x15x16in",
        "weight_grams": 2200
    },
    {
        "name": "M-Pets Trek XL IATA Approved Travel Carrier",
        "description": "Extra-large IATA approved carrier for big dogs. Premium build quality with excellent ventilation. Ideal for international pet relocation. Heavy-duty wheels included.",
        "price": 24570.0,
        "mrp": 27300.0,
        "category": "carriers",
        "subcategory": "airline-carriers",
        "brand": "M-Pets",
        "pillar": "travel",
        "tags": ["carrier", "iata-approved", "xl", "large-dogs", "international", "relocation", "wheels", "premium"],
        "size_variant": "XL",
        "weight_grams": 8000
    },
    {
        "name": "Savic Andes 5 Premium Pet Carrier (Ivory)",
        "description": "Premium large carrier in elegant ivory color. Spacious interior with multiple ventilation points. Ideal for medium to large dogs. Dimensions: 32x22x23 inches.",
        "price": 12600.0,
        "mrp": 18000.0,
        "category": "carriers",
        "subcategory": "premium-carriers",
        "brand": "Savic",
        "pillar": "travel",
        "tags": ["carrier", "premium", "large", "ivory", "spacious", "ventilated", "savic"],
        "size_variant": "32x22x23in",
        "weight_grams": 5000
    },
    {
        "name": "Savic Andes 6 Premium Pet Carrier (Ivory)",
        "description": "Extra-large premium carrier in elegant ivory. The largest in the Andes series. Perfect for giant breeds or multi-pet transport. Dimensions: 36x24x27 inches.",
        "price": 24000.0,
        "mrp": 24000.0,
        "category": "carriers",
        "subcategory": "premium-carriers",
        "brand": "Savic",
        "pillar": "travel",
        "tags": ["carrier", "premium", "extra-large", "giant-breeds", "multi-pet", "ivory", "savic"],
        "size_variant": "36x24x27in",
        "weight_grams": 7000
    },
    # === CRATES & KENNELS (Stay/Travel Pillar) ===
    {
        "name": "Trixie Home Kennel with Two Doors",
        "description": "Versatile home kennel that doubles as travel crate. Two-door design for easy access. Foldable for storage. Available in multiple sizes. Safe space for your pet at home or on the go.",
        "price": 8999.0,
        "mrp": 8999.0,
        "category": "crates",
        "subcategory": "home-kennels",
        "brand": "Trixie",
        "pillar": "stay",
        "secondary_pillars": ["travel"],
        "tags": ["kennel", "crate", "two-doors", "foldable", "home", "travel", "safe-space", "trixie"],
        "size_variant": "S/L available",
        "weight_grams": 8000
    },
    {
        "name": "M-Pets Voyager Wire Crate with 2 Doors",
        "description": "Professional-grade wire crate with dual-door access. Perfect for home training and travel. Includes removable tray for easy cleaning. Folds flat for storage.",
        "price": 6556.0,
        "mrp": 7450.0,
        "category": "crates",
        "subcategory": "wire-crates",
        "brand": "M-Pets",
        "pillar": "stay",
        "secondary_pillars": ["travel"],
        "tags": ["crate", "wire", "two-doors", "training", "foldable", "removable-tray", "m-pets"],
        "size_variant": "Small",
        "weight_grams": 6000
    },
    # === CAR TRAVEL (Travel Pillar) ===
    {
        "name": "Wahl Cargo Seat Cover for Pets",
        "description": "Premium cargo area seat cover to protect your car from pet hair, dirt, and scratches. Waterproof backing, machine washable. Universal fit for most SUVs and hatchbacks. Dimensions: 59x55 inches.",
        "price": 1898.0,
        "mrp": 2109.0,
        "category": "car-accessories",
        "subcategory": "seat-covers",
        "brand": "Wahl",
        "pillar": "travel",
        "tags": ["car", "seat-cover", "cargo", "waterproof", "washable", "suv", "protection", "wahl"],
        "size_variant": "59x55in",
        "weight_grams": 1200
    },
    # === COOLING & COMFORT (Stay/Travel Pillar) ===
    {
        "name": "M-Pets Frozen Cooling Mat (L/M)",
        "description": "Pressure-activated cooling mat that keeps pets cool without electricity or refrigeration. Perfect for hot summer days, travel, and post-exercise cooldown. Self-cooling gel technology.",
        "price": 2420.0,
        "mrp": 2750.0,
        "category": "mats",
        "subcategory": "cooling-mats",
        "brand": "M-Pets",
        "pillar": "stay",
        "secondary_pillars": ["travel", "care"],
        "tags": ["cooling", "mat", "summer", "self-cooling", "gel", "portable", "travel", "heat-relief"],
        "size_variant": "L/M",
        "weight_grams": 1500
    },
    {
        "name": "Trixie Jasira Cuddly Sack (Black/Beige)",
        "description": "Cozy cuddly sack that provides a safe, warm hideaway for small dogs and cats. Reversible design in black and beige. Perfect for travel or home use. Dimensions: 17x11x10 inches.",
        "price": 1786.0,
        "mrp": 2550.0,
        "category": "beds",
        "subcategory": "travel-beds",
        "brand": "Trixie",
        "pillar": "stay",
        "secondary_pillars": ["travel"],
        "tags": ["cuddly", "sack", "hideaway", "cozy", "reversible", "portable", "small-pets", "trixie"],
        "size_variant": "17x11x10in",
        "weight_grams": 500
    },
    # === PORTABLE FEEDING (Dine/Travel Pillar) ===
    {
        "name": "Portable Silicone Travel Bowl Set",
        "description": "Collapsible silicone bowls that fold flat for easy storage. Set of 2 (food + water). Includes carabiner clip for bags. BPA-free, dishwasher safe. Essential for hikes, walks, and travel.",
        "price": 449.0,
        "mrp": 599.0,
        "category": "bowls",
        "subcategory": "travel-bowls",
        "brand": "TDC Essentials",
        "pillar": "dine",
        "secondary_pillars": ["travel"],
        "tags": ["bowl", "collapsible", "silicone", "portable", "set", "hiking", "travel", "bpa-free"],
        "size_variant": "Set of 2",
        "weight_grams": 150
    },
    {
        "name": "Portable Pet Water Bottle with Bowl",
        "description": "2-in-1 water bottle with built-in drinking bowl. One-hand operation, leak-proof design. 500ml capacity. Perfect for walks, hikes, and road trips.",
        "price": 599.0,
        "mrp": 749.0,
        "category": "bowls",
        "subcategory": "water-bottles",
        "brand": "TDC Essentials",
        "pillar": "dine",
        "secondary_pillars": ["travel"],
        "tags": ["water-bottle", "bowl", "portable", "leak-proof", "walks", "hiking", "travel", "500ml"],
        "size_variant": "500ml",
        "weight_grams": 200
    },
    # === TRAVEL ACCESSORIES (Travel Pillar) ===
    {
        "name": "Pet Travel First Aid Kit",
        "description": "Compact first aid kit designed for pet emergencies. Includes bandages, antiseptic wipes, tweezers, emergency blanket, and instruction guide. Essential for road trips and outdoor adventures.",
        "price": 1299.0,
        "mrp": 1499.0,
        "category": "travel-accessories",
        "subcategory": "safety",
        "brand": "TDC Care",
        "pillar": "travel",
        "secondary_pillars": ["care"],
        "tags": ["first-aid", "emergency", "kit", "safety", "road-trip", "outdoor", "bandages", "essential"],
        "size_variant": "Compact",
        "weight_grams": 300
    },
    {
        "name": "Reflective Safety Travel Harness",
        "description": "High-visibility reflective harness with padded chest plate. Car seatbelt compatible. Ideal for evening walks and car travel. Adjustable straps for perfect fit.",
        "price": 899.0,
        "mrp": 1099.0,
        "category": "harnesses",
        "subcategory": "safety-harnesses",
        "brand": "TDC Travel",
        "pillar": "travel",
        "tags": ["harness", "reflective", "safety", "car", "seatbelt", "evening-walks", "adjustable", "padded"],
        "size_variant": "S/M/L",
        "weight_grams": 250
    },
    {
        "name": "Pet Passport & Document Holder",
        "description": "Organized document holder for all pet travel paperwork. Holds vaccination records, health certificates, insurance, and ID. Water-resistant material. Perfect for international travel.",
        "price": 549.0,
        "mrp": 699.0,
        "category": "travel-accessories",
        "subcategory": "organizers",
        "brand": "TDC Travel",
        "pillar": "travel",
        "secondary_pillars": ["paperwork"],
        "tags": ["passport", "documents", "holder", "organizer", "vaccination", "international", "water-resistant"],
        "size_variant": "Standard",
        "weight_grams": 100
    },
    {
        "name": "Car Window Mesh Barrier",
        "description": "Breathable mesh barrier for car windows. Allows fresh air while preventing pets from jumping out. Easy magnetic installation. Set of 2 for front or rear windows.",
        "price": 799.0,
        "mrp": 999.0,
        "category": "car-accessories",
        "subcategory": "safety",
        "brand": "TDC Travel",
        "pillar": "travel",
        "tags": ["car", "window", "mesh", "barrier", "safety", "ventilation", "magnetic", "set"],
        "size_variant": "Set of 2",
        "weight_grams": 400
    },
    {
        "name": "Portable Pet Playpen (Foldable)",
        "description": "Pop-up playpen for indoor or outdoor use. Breathable mesh sides with zippered door. Folds flat for travel. Perfect for hotels, camping, or visiting friends.",
        "price": 1899.0,
        "mrp": 2299.0,
        "category": "playpens",
        "subcategory": "portable",
        "brand": "TDC Travel",
        "pillar": "stay",
        "secondary_pillars": ["travel"],
        "tags": ["playpen", "portable", "foldable", "mesh", "indoor", "outdoor", "camping", "hotel"],
        "size_variant": "Medium",
        "weight_grams": 1500
    }
]


async def import_travel_products():
    """Import travel products into the database"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {mongo_url}/{db_name}")
    print(f"Importing {len(TRAVEL_PRODUCTS)} travel products...")
    print("=" * 60)
    
    imported_count = 0
    skipped_count = 0
    
    for product_data in TRAVEL_PRODUCTS:
        product_id = f"travel-{secrets.token_hex(6)}"
        
        # Check if exists
        existing = await db.unified_products.find_one({"name": product_data["name"]})
        if existing:
            print(f"  ⏭️  Skipped: {product_data['name'][:40]}...")
            skipped_count += 1
            continue
        
        # Build pillars list
        pillars = [product_data["pillar"]]
        if "secondary_pillars" in product_data:
            pillars.extend(product_data["secondary_pillars"])
        pillars = list(set(pillars))  # Remove duplicates
        
        # Build the full product document
        product = {
            "id": product_id,
            "name": product_data["name"],
            "title": product_data["name"],  # For frontend compatibility
            "description": product_data["description"],
            "price": product_data["price"],
            "originalPrice": product_data["mrp"],
            "mrp": product_data["mrp"],
            "compare_at_price": product_data["mrp"],
            "image": f"https://images.unsplash.com/photo-{1548199973 + imported_count}-03cce0bbc87b?w=400",
            "image_url": f"https://images.unsplash.com/photo-{1548199973 + imported_count}-03cce0bbc87b?w=400",
            "category": product_data["category"],
            "subcategory": product_data.get("subcategory", ""),
            "brand": product_data["brand"],
            "vendor": product_data["brand"],
            
            # Pillar assignments - CRITICAL for Mira
            "pillar": product_data["pillar"],
            "pillars": pillars,
            "primary_pillar": product_data["pillar"],
            
            # Tags for search
            "tags": product_data["tags"],
            
            # Product flags
            "product_type": "physical",
            "is_pan_india_shippable": True,
            "in_stock": True,
            "stock_quantity": 25,
            "is_active": True,
            "available": True,
            
            # Size/variant info
            "size_variant": product_data.get("size_variant", ""),
            "variants": [{"title": product_data.get("size_variant", "Standard"), "price": product_data["price"]}],
            
            # Life stage and size - travel products suit all
            "life_stage": "all-ages",
            "size_suitability": ["small", "medium", "large"],
            
            # Source tracking
            "external_source": "supertails_travel",
            "imported_from": "travel_products_script",
            
            # Shipping
            "shipping_weight": product_data.get("weight_grams", 1000),
            "weight_grams": product_data.get("weight_grams", 1000),
            
            # Mira visibility - CRITICAL for AI recommendations
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": True,
                "knowledge_confidence": "high",
                "suggestion_contexts": pillars + ["travel-planning", "vacation", "road-trip", "flight", "pet-relocation"]
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
                "featured": product_data["price"] > 5000  # Feature premium items
            },
            
            # Timestamps
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "synced_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into unified_products (Product Box)
        await db.unified_products.insert_one(product)
        
        # Also insert into products collection for Shop page
        product_copy = product.copy()
        product_copy.pop("_id", None)
        await db.products.insert_one(product_copy)
        
        print(f"  ✅ {product_data['pillar'].upper():6} | {product_data['name'][:35]}... | ₹{product_data['price']}")
        imported_count += 1
    
    print()
    print("=" * 60)
    print(f"✅ Import Complete!")
    print(f"   Imported: {imported_count}")
    print(f"   Skipped:  {skipped_count}")
    print()
    print("Products by Primary Pillar:")
    for pillar in ["travel", "stay", "dine", "care"]:
        count = await db.unified_products.count_documents({
            "pillar": pillar, 
            "imported_from": "travel_products_script"
        })
        if count > 0:
            print(f"   • {pillar.upper()}: {count}")
    
    print()
    print("Mira Search Tags Added:")
    print("   carrier, iata-approved, airline, flight, travel, car,")
    print("   seat-cover, cooling, mat, crate, kennel, portable,")
    print("   first-aid, harness, safety, documents, playpen")
    
    client.close()
    return imported_count


if __name__ == "__main__":
    asyncio.run(import_travel_products())
