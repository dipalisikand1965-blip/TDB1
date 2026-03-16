"""Check database state for dine product fix verification"""
import asyncio
import motor.motor_asyncio


async def check_db():
    with open('/app/backend/.env') as f:
        env_lines = f.read().split('\n')
    
    mongo_url = ''
    db_name = ''
    for line in env_lines:
        if line.startswith('MONGO_URL='):
            mongo_url = line.split('=', 1)[1].strip()
        elif line.startswith('DB_NAME='):
            db_name = line.split('=', 1)[1].strip()
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check for DM-XXX products in products_master
    count = await db.products_master.count_documents({"sku": {"$regex": "^DM-"}})
    print(f"DM-XXX products in products_master: {count}")
    
    # Get first few DM products
    async for p in db.products_master.find({"sku": {"$regex": "^DM-"}}).limit(5):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:40]
        primary = p.get("primary_pillar", "N/A")
        img = (p.get("image_url") or p.get("image", ""))[:80]
        print(f"  SKU:{sku} | {name} | primary_pillar:{primary} | img:{img}")
    
    # Count all dine primary_pillar
    dine_count = await db.products_master.count_documents({"primary_pillar": "dine"})
    print(f"\nProducts with primary_pillar=dine: {dine_count}")
    
    # Show first 5 with primary_pillar=dine
    print("Sample products with primary_pillar=dine:")
    async for p in db.products_master.find({"primary_pillar": "dine"}).limit(5):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:40]
        img = (p.get("image_url") or p.get("image", ""))[:80]
        print(f"  SKU:{sku} | {name} | img:{img}")
    
    # Count products with old toy image URLs (should be 0 after fix)
    toy_url_count = await db.products_master.count_documents({
        "image_url": {"$regex": "static.prod-images.emergentagent.com/jobs/"}
    })
    print(f"\nProducts still with old jobs/ URLs in image_url: {toy_url_count}")
    
    # Count products with cleared image_url (None or empty)
    cleared_count = await db.products_master.count_documents({
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ],
        "primary_pillar": "dine"
    })
    print(f"Dine products with no image_url: {cleared_count}")
    
    # Count TR-XXX, SP-XXX, FF-XXX, HR-XXX
    for prefix in ["TR-", "SP-", "FF-", "HR-"]:
        c = await db.products_master.count_documents({"sku": {"$regex": f"^{prefix}"}})
        print(f"{prefix}XXX products in products_master: {c}")
    
    client.close()


asyncio.run(check_db())
