"""
Update Farewell & Adopt Services with AI Images - Uses dotenv for correct DB
"""
from dotenv import load_dotenv
load_dotenv()

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

# Image mappings by service name (to match existing services)
FAREWELL_IMAGE_MAP = {
    "End-of-Life Planning": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/898419cc1ff09f1c489ffa371a99f90aeedff568ea9f13a51bf3897875bb723f.png",
    "Euthanasia Coordination": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/552c3bd3b05f178cb545fd9bf41fbfdc48bf1e789431f268520aea4c10ae398d.png",
    "Cremation & Burial": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/52d9f350f3cc349eaa44856bedfc05d04dedd7fea51e00a17ee293a5afc8fb76.png",
    "Memorial & Remembrance": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/def6c38cccfa25db89987eeac44ceb850b3076b921ea8db51736b9bcac9e11b3.png",
    "Grief Support Resources": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/41233dc79f796ea26596c08ac80f0ac840def8761a595e88b58704e625ca45fa.png",
    "Dignified Cremation": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/98439e6c3d17bd249cc00f8731bb084f7949183d85a288a11bf4f7d2c2c04bec.png",
    "Memorial Service": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/9fb52c19934bc5cc250a7aeee23dc46ada1edeaf1b6ddea737f6400c76299ae1.png",
    "Pet Loss Support": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/9f401377cc996dfeb20233ac7c493fa6e63b4ba26537e1e7e6618afde38c0779.png"
}

ADOPT_IMAGE_MAP = {
    "Ethical Adoption Discovery": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/76293a75091ad8a3357cf32a837e8dd710746b80b7fafe8c369d5cf39f5ea21a.png",
    "Breed Suitability Advisory": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/0a5e63eb6c4c1196d09e6512fe20bc214e8e3a847838cea53c906c863a6dbb90.png",
    "Adoption Readiness Planning": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/e57f4942ca8fff2756dea22584750c8aab27133f4f60a8de68a0c20edc8366a9.png",
    "Home Preparation Guidance": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/acf943568f9b630541cfc845f745737fdcf262ae9d0e3ccb18b4a5f60b0726a6.png",
    "First 30 Days Support": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/b62be8266b3f89ca6a21585767d53ff76338e9b578764c5227201dd2c8a4b634.png",
    "Home Readiness Check": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/acf943568f9b630541cfc845f745737fdcf262ae9d0e3ccb18b4a5f60b0726a6.png",
    "Pet Matching Service": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/0a5e63eb6c4c1196d09e6512fe20bc214e8e3a847838cea53c906c863a6dbb90.png",
    "Adoption Counseling": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/e57f4942ca8fff2756dea22584750c8aab27133f4f60a8de68a0c20edc8366a9.png",
    "Foster-to-Adopt Program": "https://static.prod-images.emergentagent.com/jobs/d38f34a3-0c42-40aa-96c7-9cfd33000154/images/0913153ad8ab688faf50c56758c0b50c84e473704aaa79bcd975b27fe42075fd.png"
}

async def update_service_images():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    
    print(f"Connecting to database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    now = datetime.now(timezone.utc).isoformat()
    
    updated = 0
    
    # Update Farewell services
    print("\n=== Updating Farewell Services ===")
    for name, image_url in FAREWELL_IMAGE_MAP.items():
        result = await db.services_master.update_many(
            {"pillar": "farewell", "name": name},
            {"$set": {"image": image_url, "updated_at": now}}
        )
        if result.modified_count > 0:
            print(f"  ✅ Updated: {name}")
            updated += result.modified_count
        else:
            print(f"  ⚠️ Not found: {name}")
    
    # Update Adopt services
    print("\n=== Updating Adopt Services ===")
    for name, image_url in ADOPT_IMAGE_MAP.items():
        result = await db.services_master.update_many(
            {"pillar": "adopt", "name": name},
            {"$set": {"image": image_url, "updated_at": now}}
        )
        if result.modified_count > 0:
            print(f"  ✅ Updated: {name}")
            updated += result.modified_count
        else:
            print(f"  ⚠️ Not found: {name}")
    
    print(f"\n🎉 Total updated: {updated}")
    
    # Verify
    print("\n📋 Verification:")
    for pillar in ["farewell", "adopt"]:
        services = await db.services_master.find({"pillar": pillar}, {"_id": 0, "name": 1, "image": 1}).to_list(10)
        print(f"\n{pillar.upper()}:")
        for s in services[:5]:
            img = "✅" if "d38f34a3" in s.get("image", "") else "❌"
            print(f"  {img} {s.get('name')}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(update_service_images())
