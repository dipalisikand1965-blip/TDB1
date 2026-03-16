"""Check all collections for DM-XXX products and dine-related image data"""
import asyncio
import motor.motor_asyncio


async def check_db_full():
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
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"All collections: {sorted(collections)}")
    print()
    
    # Search for DM-XXX SKUs in ALL collections
    for coll_name in sorted(collections):
        coll = db[coll_name]
        try:
            count = await coll.count_documents({"sku": {"$regex": "^DM-"}})
            if count > 0:
                print(f"Collection '{coll_name}' has {count} DM-XXX products")
                async for p in coll.find({"sku": {"$regex": "^DM-"}}).limit(3):
                    sku = p.get("sku", "N/A")
                    name = p.get("name", "N/A")[:40]
                    img = (p.get("image_url") or p.get("image", ""))[:80]
                    print(f"  SKU:{sku} | {name} | img:{img}")
        except Exception:
            pass
    
    print()
    # Check in products_master for the specific old job URL from toy images (4700c8db)
    toy_count = await db.products_master.count_documents({
        "image_url": {"$regex": "4700c8db"}
    })
    print(f"products_master with toy job URL (4700c8db): {toy_count}")
    
    # Check in products_master for any dine-related products with the old 4700c8db URL
    dine_toy = await db.products_master.count_documents({
        "primary_pillar": "dine",
        "image_url": {"$regex": "4700c8db"}
    })
    print(f"Dine products with toy URL (4700c8db): {dine_toy}")
    
    # Total products in products_master with old job URLs (any job)
    # Check overall count
    total_pm = await db.products_master.count_documents({})
    print(f"\nTotal products_master documents: {total_pm}")
    
    # Check for products with 'Salmon' or 'Sweet Potato' or 'Morning Bowl'
    food_count = await db.products_master.count_documents({
        "name": {"$regex": "Salmon|Sweet Potato|Morning Bowl|Daily Meal", "$options": "i"}
    })
    print(f"Products with food keywords (Salmon, Sweet Potato, etc): {food_count}")
    
    if food_count > 0:
        async for p in db.products_master.find({
            "name": {"$regex": "Salmon|Sweet Potato|Morning Bowl", "$options": "i"}
        }).limit(5):
            sku = p.get("sku", "N/A")
            name = p.get("name", "N/A")[:40]
            primary = p.get("primary_pillar", "N/A")
            img = (p.get("image_url") or p.get("image", ""))[:80]
            print(f"  SKU:{sku} | {name} | primary:{primary} | img:{img}")
    
    client.close()


asyncio.run(check_db_full())
