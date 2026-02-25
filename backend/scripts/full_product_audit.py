"""
Full System Product Audit & Sync Script
Ensures all pillar products are properly populated across the system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggy_company")

# Default pricing for properties without prices
DEFAULT_PRICES = {
    "stay": {
        "budget": 2500,
        "mid": 5000,
        "premium": 12000,
        "luxury": 25000
    },
    "travel": {
        "cab": 1500,
        "train": 3000,
        "flight": 15000,
        "relocation": 50000
    },
    "care": {
        "grooming": 800,
        "walks": 500,
        "training": 2000,
        "vet": 1000
    }
}

async def sync_stay_to_products(db):
    """Sync stay properties to main products collection"""
    print("\n=== SYNCING STAY PROPERTIES ===")
    
    properties = await db.stay_properties.find({}).to_list(length=500)
    print(f"Found {len(properties)} stay properties")
    
    synced = 0
    for prop in properties:
        # Determine price tier
        prop_type = (prop.get('property_type', '') or '').lower()
        if 'luxury' in prop_type or 'palace' in prop.get('name', '').lower():
            price = DEFAULT_PRICES['stay']['luxury']
        elif 'premium' in prop_type or 'resort' in prop_type:
            price = DEFAULT_PRICES['stay']['premium']
        elif 'budget' in prop_type or 'hostel' in prop_type:
            price = DEFAULT_PRICES['stay']['budget']
        else:
            price = DEFAULT_PRICES['stay']['mid']
        
        # Update property with price
        await db.stay_properties.update_one(
            {"_id": prop["_id"]},
            {"$set": {"price_per_night": prop.get('price_per_night') or price}}
        )
        
        # Create product entry
        product_id = f"stay-{str(prop.get('_id'))}"
        product = {
            "id": product_id,
            "title": prop.get('name', 'Pet-Friendly Stay'),
            "description": prop.get('description', f"Pet-friendly accommodation in {prop.get('city', 'India')}"),
            "price": prop.get('price_per_night') or price,
            "category": "stay",
            "pillar": "stay",
            "image": prop.get('images', [None])[0] if prop.get('images') else prop.get('image'),
            "tags": ["Stay", "Pet-Friendly", prop.get('city', ''), prop.get('property_type', '')],
            "city": prop.get('city'),
            "property_type": prop.get('property_type'),
            "amenities": prop.get('amenities', []),
            "pet_policy": prop.get('pet_policy', {}),
            "in_stock": True,
            "source": "stay_properties",
            "source_id": str(prop.get('_id')),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert to products
        await db.products.update_one(
            {"id": product_id},
            {"$set": product},
            upsert=True
        )
        synced += 1
        print(f"  ✓ {prop.get('name')[:40]}... - ₹{price}/night")
    
    print(f"Synced {synced} stay properties to products")
    return synced

async def sync_boarding_to_products(db):
    """Sync boarding facilities to products"""
    print("\n=== SYNCING BOARDING FACILITIES ===")
    
    # Check if we have boarding data, if not seed some
    boarding = await db.stay_boarding_facilities.find({}).to_list(length=100)
    
    if len(boarding) == 0:
        print("No boarding facilities found, seeding defaults...")
        default_boarding = [
            {
                "name": "Pawsome Pet Resort",
                "city": "Bangalore",
                "type": "premium_boarding",
                "price_per_night": 1500,
                "description": "Premium pet boarding with 24/7 care, webcam access, and daily updates",
                "amenities": ["AC Rooms", "Webcam", "Playtime", "Grooming", "Vet on Call"],
                "capacity": 50
            },
            {
                "name": "Happy Tails Boarding",
                "city": "Mumbai",
                "type": "standard_boarding",
                "price_per_night": 800,
                "description": "Comfortable boarding facility with loving care and daily walks",
                "amenities": ["Daily Walks", "Playtime", "Photo Updates"],
                "capacity": 30
            },
            {
                "name": "Pet Paradise Delhi",
                "city": "Delhi NCR",
                "type": "premium_boarding",
                "price_per_night": 1200,
                "description": "Luxury pet boarding with individual suites and personalized care",
                "amenities": ["Individual Suites", "Pool", "Grooming", "Training"],
                "capacity": 40
            }
        ]
        
        for b in default_boarding:
            b["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.stay_boarding_facilities.insert_one(b)
        
        boarding = default_boarding
        print(f"Seeded {len(boarding)} boarding facilities")
    
    synced = 0
    for facility in boarding:
        product_id = f"boarding-{str(facility.get('_id', facility.get('name', '').replace(' ', '-').lower()))}"
        product = {
            "id": product_id,
            "title": facility.get('name'),
            "description": facility.get('description'),
            "price": facility.get('price_per_night', 1000),
            "category": "boarding",
            "pillar": "stay",
            "tags": ["Boarding", "Pet Care", facility.get('city', ''), facility.get('type', '')],
            "city": facility.get('city'),
            "amenities": facility.get('amenities', []),
            "in_stock": True,
            "source": "stay_boarding_facilities",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.products.update_one(
            {"id": product_id},
            {"$set": product},
            upsert=True
        )
        synced += 1
        print(f"  ✓ {facility.get('name')}")
    
    return synced

async def sync_travel_products(db):
    """Ensure travel products exist"""
    print("\n=== SYNCING TRAVEL PRODUCTS ===")
    
    travel_products = await db.products.find({"pillar": "travel"}).to_list(length=100)
    
    if len(travel_products) < 5:
        print("Adding travel service products...")
        travel_services = [
            {
                "id": "travel-cab-service",
                "title": "Pet-Friendly Cab Service",
                "description": "Safe and comfortable cab rides for you and your pet. AC vehicles with pet-friendly drivers.",
                "price": 1500,
                "category": "travel",
                "pillar": "travel",
                "tags": ["Travel", "Cab", "Pet Transport", "City Travel"],
                "travel_type": "cab"
            },
            {
                "id": "travel-train-assist",
                "title": "Train Travel Assistance",
                "description": "Complete assistance for train travel with pets. Documentation, booking, and station support.",
                "price": 3000,
                "category": "travel",
                "pillar": "travel",
                "tags": ["Travel", "Train", "Pet Transport", "Intercity"],
                "travel_type": "train"
            },
            {
                "id": "travel-flight-domestic",
                "title": "Domestic Flight Coordination",
                "description": "Full support for flying with your pet. Health certificates, airline coordination, and crate training.",
                "price": 15000,
                "category": "travel",
                "pillar": "travel",
                "tags": ["Travel", "Flight", "Pet Transport", "Domestic"],
                "travel_type": "flight"
            },
            {
                "id": "travel-relocation",
                "title": "Pet Relocation Service",
                "description": "Premium door-to-door pet relocation. International and domestic moves with complete care.",
                "price": 50000,
                "category": "travel",
                "pillar": "travel",
                "tags": ["Travel", "Relocation", "Premium", "International"],
                "travel_type": "relocation"
            },
            {
                "id": "travel-pet-taxi",
                "title": "Pet Taxi - City Rides",
                "description": "On-demand pet taxi for vet visits, grooming appointments, or playdates.",
                "price": 500,
                "category": "travel",
                "pillar": "travel",
                "tags": ["Travel", "Taxi", "City", "On-Demand"],
                "travel_type": "taxi"
            }
        ]
        
        for product in travel_services:
            product["in_stock"] = True
            product["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.update_one(
                {"id": product["id"]},
                {"$set": product},
                upsert=True
            )
            print(f"  ✓ {product['title']}")
        
        return len(travel_services)
    else:
        print(f"Found {len(travel_products)} travel products")
        return 0

async def sync_care_products(db):
    """Ensure care products exist"""
    print("\n=== SYNCING CARE PRODUCTS ===")
    
    care_products = await db.products.find({"pillar": "care"}).to_list(length=100)
    
    if len(care_products) < 5:
        print("Adding care service products...")
        care_services = [
            {
                "id": "care-full-grooming",
                "title": "Full Grooming Package",
                "description": "Complete grooming: bath, haircut, nail trim, ear cleaning, and anal gland expression.",
                "price": 1500,
                "category": "grooming",
                "pillar": "care",
                "tags": ["Care", "Grooming", "Full Service", "Spa"]
            },
            {
                "id": "care-bath-basic",
                "title": "Bath & Brush",
                "description": "Refreshing bath with shampoo, conditioner, blow dry, and brushing.",
                "price": 600,
                "category": "grooming",
                "pillar": "care",
                "tags": ["Care", "Grooming", "Bath", "Basic"]
            },
            {
                "id": "care-daily-walk",
                "title": "Daily Dog Walking",
                "description": "30-minute daily walks with photo updates and GPS tracking.",
                "price": 500,
                "category": "walks",
                "pillar": "care",
                "tags": ["Care", "Walks", "Daily", "Exercise"]
            },
            {
                "id": "care-pet-sitting",
                "title": "Pet Sitting (8 hours)",
                "description": "Professional pet sitting at your home. Feeding, playtime, and companionship.",
                "price": 1200,
                "category": "sitting",
                "pillar": "care",
                "tags": ["Care", "Sitting", "Home Visit", "Day Care"]
            },
            {
                "id": "care-basic-training",
                "title": "Basic Obedience Training",
                "description": "5-session package covering sit, stay, come, leash manners, and house training.",
                "price": 5000,
                "category": "training",
                "pillar": "care",
                "tags": ["Care", "Training", "Obedience", "Puppy"]
            },
            {
                "id": "care-vet-consultation",
                "title": "Vet Consultation Booking",
                "description": "Book vet appointments with our network of trusted veterinarians.",
                "price": 300,
                "category": "vet",
                "pillar": "care",
                "tags": ["Care", "Vet", "Health", "Consultation"]
            }
        ]
        
        for product in care_services:
            product["in_stock"] = True
            product["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.update_one(
                {"id": product["id"]},
                {"$set": product},
                upsert=True
            )
            print(f"  ✓ {product['title']}")
        
        return len(care_services)
    else:
        print(f"Found {len(care_products)} care products")
        return 0

async def sync_fit_products(db):
    """Ensure fit products exist"""
    print("\n=== SYNCING FIT PRODUCTS ===")
    
    fit_products = await db.products.find({"pillar": "fit"}).to_list(length=100)
    
    if len(fit_products) < 3:
        print("Adding fit service products...")
        fit_services = [
            {
                "id": "fit-nutrition-consult",
                "title": "Nutrition Consultation",
                "description": "Personalized diet plan from certified pet nutritionists based on your pet's needs.",
                "price": 1500,
                "category": "nutrition",
                "pillar": "fit",
                "tags": ["Fit", "Nutrition", "Diet", "Health"]
            },
            {
                "id": "fit-weight-program",
                "title": "Weight Management Program",
                "description": "8-week program with custom diet, exercise plan, and weekly check-ins.",
                "price": 5000,
                "category": "fitness",
                "pillar": "fit",
                "tags": ["Fit", "Weight Loss", "Exercise", "Program"]
            },
            {
                "id": "fit-swimming-session",
                "title": "Hydrotherapy / Swimming",
                "description": "Low-impact exercise in our heated pool. Great for joint health and rehabilitation.",
                "price": 800,
                "category": "exercise",
                "pillar": "fit",
                "tags": ["Fit", "Swimming", "Hydrotherapy", "Exercise"]
            },
            {
                "id": "fit-agility-class",
                "title": "Agility Training Class",
                "description": "Fun obstacle course training to boost fitness and mental stimulation.",
                "price": 1000,
                "category": "exercise",
                "pillar": "fit",
                "tags": ["Fit", "Agility", "Training", "Fun"]
            }
        ]
        
        for product in fit_services:
            product["in_stock"] = True
            product["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.update_one(
                {"id": product["id"]},
                {"$set": product},
                upsert=True
            )
            print(f"  ✓ {product['title']}")
        
        return len(fit_services)
    else:
        print(f"Found {len(fit_products)} fit products")
        return 0

async def add_missing_tags(db):
    """Add missing tags to products"""
    print("\n=== ADDING MISSING TAGS ===")
    
    products_without_tags = await db.products.find({
        "$or": [
            {"tags": {"$exists": False}},
            {"tags": []},
            {"tags": None}
        ]
    }).to_list(length=1000)
    
    print(f"Found {len(products_without_tags)} products without tags")
    
    updated = 0
    for product in products_without_tags:
        title = product.get('title', '')
        category = product.get('category', '')
        pillar = product.get('pillar', category)
        
        tags = [pillar.title() if pillar else 'General']
        
        # Add category tag
        if category:
            tags.append(category.title().replace('-', ' '))
        
        # Add keyword-based tags
        title_lower = title.lower()
        if 'birthday' in title_lower:
            tags.append('Birthday')
        if 'cake' in title_lower:
            tags.append('Cakes')
        if 'treat' in title_lower:
            tags.append('Treats')
        if 'premium' in title_lower or 'luxury' in title_lower:
            tags.append('Premium')
        
        await db.products.update_one(
            {"_id": product["_id"]},
            {"$set": {"tags": tags}}
        )
        updated += 1
    
    print(f"Updated {updated} products with tags")
    return updated

async def verify_product_counts(db):
    """Final verification of product counts"""
    print("\n" + "="*60)
    print("FINAL PRODUCT AUDIT")
    print("="*60)
    
    # Count by pillar
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    pillar_counts = await db.products.aggregate(pipeline).to_list(length=100)
    
    print("\nProducts by Pillar:")
    for item in pillar_counts:
        pillar = item['_id'] or 'no-pillar'
        print(f"  {pillar}: {item['count']}")
    
    # Count by category
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    category_counts = await db.products.aggregate(pipeline).to_list(length=100)
    
    print("\nProducts by Category (top 15):")
    for item in category_counts[:15]:
        cat = item['_id'] or 'no-category'
        print(f"  {cat}: {item['count']}")
    
    # Total count
    total = await db.products.count_documents({})
    print(f"\nTOTAL PRODUCTS: {total}")
    
    return total

async def main():
    """Run full audit and sync"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("="*60)
    print("FULL PRODUCT AUDIT & SYNC")
    print("="*60)
    
    stats = {
        "stay_synced": await sync_stay_to_products(db),
        "boarding_synced": await sync_boarding_to_products(db),
        "travel_added": await sync_travel_products(db),
        "care_added": await sync_care_products(db),
        "fit_added": await sync_fit_products(db),
        "tags_fixed": await add_missing_tags(db)
    }
    
    total = await verify_product_counts(db)
    stats["total_products"] = total
    
    print("\n" + "="*60)
    print("SYNC COMPLETE!")
    print("="*60)
    print(f"Stay properties synced: {stats['stay_synced']}")
    print(f"Boarding facilities synced: {stats['boarding_synced']}")
    print(f"Travel products added: {stats['travel_added']}")
    print(f"Care products added: {stats['care_added']}")
    print(f"Fit products added: {stats['fit_added']}")
    print(f"Products with tags fixed: {stats['tags_fixed']}")
    print(f"Total products now: {stats['total_products']}")
    
    client.close()
    return stats

if __name__ == "__main__":
    asyncio.run(main())
