"""
Seed Adopt Services with AI-Generated Contextual Images
Creates/updates services in services_master collection
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

# Adopt services with AI-generated contextual images
ADOPT_SERVICES = [
    {
        "id": "SVC-ADOPT-VET-REG",
        "name": "Vet Registration Help",
        "pillar": "adopt",
        "description": "We'll help you find and register with a trusted veterinarian near you. First health check and vaccination schedule included.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/0a5e63eb6c4c1196d09e6512fe20bc214e8e3a847838cea53c906c863a6dbb90.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": True,
        "base_price": 0,
        "includes": ["Vet finder", "First appointment booking", "Vaccination schedule", "Health records setup"],
        "category": "vet_services"
    },
    {
        "id": "SVC-ADOPT-TRAINING",
        "name": "Training Session Booking",
        "pillar": "adopt",
        "description": "Connect with certified positive-reinforcement trainers. First session includes assessment and personalized training plan.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/b62be8266b3f89ca6a21585767d53ff76338e9b578764c5227201dd2c8a4b634.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 1500,
        "includes": ["Trainer matching", "Assessment session", "Training plan", "Follow-up support"],
        "category": "training"
    },
    {
        "id": "SVC-ADOPT-GROOMING",
        "name": "First Grooming Session",
        "pillar": "adopt",
        "description": "Book your new dog's first professional grooming session with gentle, patient groomers experienced with rescue dogs.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/fbf703adce5fedee0267fb0792687ae257f00d18da29b7d44cecc14a2d44cbba.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 800,
        "includes": ["Bath & dry", "Nail trim", "Ear cleaning", "Brush out", "Gentle handling"],
        "category": "grooming"
    },
    {
        "id": "SVC-ADOPT-SUPPLIES",
        "name": "Supplies Shopping Help",
        "pillar": "adopt",
        "description": "Our concierge will help you choose the right supplies based on your dog's size, age, and needs. Personalized shopping list included.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/76293a75091ad8a3357cf32a837e8dd710746b80b7fafe8c369d5cf39f5ea21a.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": True,
        "base_price": 0,
        "includes": ["Personalized list", "Size recommendations", "Brand suggestions", "Budget options"],
        "category": "shopping"
    },
    {
        "id": "SVC-ADOPT-NUTRITION",
        "name": "Nutrition & Food Advice",
        "pillar": "adopt",
        "description": "Get personalized food and nutrition recommendations based on your dog's breed, age, size, and any health considerations.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/e57f4942ca8fff2756dea22584750c8aab27133f4f60a8de68a0c20edc8366a9.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": True,
        "base_price": 0,
        "includes": ["Diet assessment", "Food recommendations", "Portion guidelines", "Transition plan"],
        "category": "nutrition"
    },
    {
        "id": "SVC-ADOPT-SETTLING",
        "name": "Settling-in Support",
        "pillar": "adopt",
        "description": "Get a customized 3-3-3 settling plan for your new dog. Includes daily check-ins and behavior guidance during the first weeks.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/acf943568f9b630541cfc845f745737fdcf262ae9d0e3ccb18b4a5f60b0726a6.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": False,
        "base_price": 999,
        "includes": ["3-3-3 plan", "Daily check-ins", "Behavior guidance", "Issue troubleshooting"],
        "category": "support"
    },
    {
        "id": "SVC-ADOPT-TRAVEL",
        "name": "Travel Assistance",
        "pillar": "adopt",
        "description": "If your new pet is coming from another city, we'll arrange safe, comfortable transport with experienced pet handlers.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/7eab4452f144512e2e04b6e3e0ebc43b3c2c7ae8d1242fa59b6a0f825e3354bd.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": False,
        "base_price": 3000,
        "includes": ["Route planning", "Pet carrier", "Trained handler", "Updates during journey", "Delivery coordination"],
        "category": "transport"
    },
    {
        "id": "SVC-ADOPT-STARTER-KIT",
        "name": "Starter Kit Assembly",
        "pillar": "adopt",
        "description": "We'll assemble a complete starter kit tailored to your dog's size and needs. Delivered before your dog arrives home.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/0913153ad8ab688faf50c56758c0b50c84e473704aaa79bcd975b27fe42075fd.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 2999,
        "includes": ["Bowls & feeding", "Bed & blanket", "Collar & leash", "Toys & treats", "Grooming basics"],
        "category": "supplies"
    }
]


async def seed_adopt_services():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "thedoggycompany")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    now = datetime.now(timezone.utc).isoformat()
    
    created = 0
    updated = 0
    
    for service in ADOPT_SERVICES:
        service_data = {
            **service,
            "is_active": True,
            "pillar_name": "Adopt",
            "pillar_icon": "🏠",
            "updated_at": now
        }
        
        # Check if exists
        existing = await db.services_master.find_one({"id": service["id"]})
        
        if existing:
            # Update
            result = await db.services_master.update_one(
                {"id": service["id"]},
                {"$set": service_data}
            )
            if result.modified_count > 0:
                print(f"✅ Updated: {service['name']}")
                updated += 1
            else:
                print(f"⏭️ No change: {service['name']}")
        else:
            # Create
            service_data["created_at"] = now
            await db.services_master.insert_one(service_data)
            print(f"✅ Created: {service['name']}")
            created += 1
    
    print(f"\n🎉 Done! Created: {created}, Updated: {updated}")
    
    # Verify
    adopt_count = await db.services_master.count_documents({"pillar": "adopt"})
    print(f"📋 Total adopt services in services_master: {adopt_count}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_adopt_services())
