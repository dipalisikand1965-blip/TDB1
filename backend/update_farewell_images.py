"""
Seed Farewell Services with AI-Generated Contextual Images
Creates/updates services in services_master collection
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

# Farewell services with AI-generated contextual images
FAREWELL_SERVICES = [
    {
        "id": "SVC-FARE-EOL-PLANNING",
        "name": "End-of-Life Planning",
        "pillar": "farewell",
        "description": "Compassionate guidance to help you prepare for your pet's final journey. Our counselors help you understand options, make informed decisions, and plan meaningful goodbyes.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/898419cc1ff09f1c489ffa371a99f90aeedff568ea9f13a51bf3897875bb723f.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": True,
        "base_price": 0,
        "includes": ["Counselor consultation", "Options guidance", "Timeline planning", "Family support"],
        "category": "planning"
    },
    {
        "id": "SVC-FARE-EUTHANASIA",
        "name": "Euthanasia Coordination",
        "pillar": "farewell",
        "description": "Arrange peaceful, dignified in-home or clinic euthanasia with compassionate veterinarians. We handle all coordination so you can focus on being present.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/552c3bd3b05f178cb545fd9bf41fbfdc48bf1e789431f268520aea4c10ae398d.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": False,
        "base_price": 2500,
        "includes": ["Vet coordination", "Home visit option", "Sedation if needed", "Post-care guidance"],
        "category": "euthanasia"
    },
    {
        "id": "SVC-FARE-CREMATION",
        "name": "Cremation & Burial",
        "pillar": "farewell",
        "description": "Dignified cremation services with various memorial options. Choose from private cremation with ashes returned, communal cremation, or pet cemetery burial.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/52d9f350f3cc349eaa44856bedfc05d04dedd7fea51e00a17ee293a5afc8fb76.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 3500,
        "includes": ["Transport pickup", "Cremation service", "Certificate", "Basic urn"],
        "category": "cremation"
    },
    {
        "id": "SVC-FARE-MEMORIAL",
        "name": "Memorial & Remembrance",
        "pillar": "farewell",
        "description": "Beautiful keepsakes and memorial products to honor your pet's memory. Custom paw prints, photo frames, jewelry, garden stones, and more.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/def6c38cccfa25db89987eeac44ceb850b3076b921ea8db51736b9bcac9e11b3.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 999,
        "includes": ["Paw print casting", "Photo frame", "Memory box", "Rainbow Bridge card"],
        "category": "memorial"
    },
    {
        "id": "SVC-FARE-GRIEF-SUPPORT",
        "name": "Grief Support Resources",
        "pillar": "farewell",
        "description": "Professional grief counseling and support resources to help you navigate pet loss. Connect with counselors, support groups, and healing resources.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/41233dc79f796ea26596c08ac80f0ac840def8761a595e88b58704e625ca45fa.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": True,
        "base_price": 0,
        "includes": ["Counselor session", "Support group access", "Resources guide", "Follow-up check-in"],
        "category": "grief_support"
    },
    {
        "id": "SVC-FARE-DIGNIFIED-CREMATION",
        "name": "Dignified Cremation",
        "pillar": "farewell",
        "description": "Premium private cremation with witnessing option. Receive your pet's ashes in a beautiful urn with certificate of cremation.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/98439e6c3d17bd249cc00f8731bb084f7949183d85a288a11bf4f7d2c2c04bec.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 5000,
        "includes": ["Private cremation", "Witnessing option", "Premium urn", "Certificate", "Home delivery"],
        "category": "cremation"
    },
    {
        "id": "SVC-FARE-MEMORIAL-SERVICE",
        "name": "Memorial Service",
        "pillar": "farewell",
        "description": "Organize a beautiful memorial ceremony to celebrate your pet's life. We help plan the event, location, and create a meaningful tribute.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/9fb52c19934bc5cc250a7aeee23dc46ada1edeaf1b6ddea737f6400c76299ae1.png",
        "is_bookable": True,
        "requires_consultation": True,
        "is_free": False,
        "base_price": 7500,
        "includes": ["Event planning", "Venue coordination", "Photo tribute", "Ceremony officiant", "Memory cards"],
        "category": "memorial"
    },
    {
        "id": "SVC-FARE-PET-LOSS-SUPPORT",
        "name": "Pet Loss Support",
        "pillar": "farewell",
        "description": "Join our supportive community of pet parents who understand your loss. Weekly group sessions, one-on-one counseling, and healing workshops.",
        "image": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/9f401377cc996dfeb20233ac7c493fa6e63b4ba26537e1e7e6618afde38c0779.png",
        "is_bookable": True,
        "requires_consultation": False,
        "is_free": False,
        "base_price": 1500,
        "includes": ["Group session access", "Private counseling", "Healing workshop", "Ongoing support"],
        "category": "grief_support"
    }
]


async def seed_farewell_services():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "thedoggycompany")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    now = datetime.now(timezone.utc).isoformat()
    
    created = 0
    updated = 0
    
    for service in FAREWELL_SERVICES:
        service_data = {
            **service,
            "is_active": True,
            "pillar_name": "Farewell",
            "pillar_icon": "🌈",
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
    farewell_count = await db.services_master.count_documents({"pillar": "farewell"})
    print(f"📋 Total farewell services in services_master: {farewell_count}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_farewell_services())
