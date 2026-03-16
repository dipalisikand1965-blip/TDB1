"""Check dine bundles and unified products for DM-XXX seeded products"""
import asyncio
import motor.motor_asyncio


async def check_dine_collections():
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
    
    # Check dine_bundles collection
    dine_bundle_count = await db.dine_bundles.count_documents({})
    print(f"dine_bundles count: {dine_bundle_count}")
    async for p in db.dine_bundles.find({}).limit(5):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:40]
        img = (p.get("image_url") or p.get("image", ""))[:80]
        primary = p.get("primary_pillar", "N/A")
        cat = p.get("category", "N/A")
        print(f"  SKU:{sku} | {name} | primary:{primary} | cat:{cat} | img:{img}")
    
    print()
    # Check unified_products 
    up_count = await db.unified_products.count_documents({})
    print(f"unified_products count: {up_count}")
    
    # Check for DM-XXX in all collections
    print("\nSearching for DM-XXX in key collections:")
    for coll_name in ["dine_bundles", "unified_products", "products", "celebrate_products", "fit_products", "farewell_products"]:
        try:
            coll = db[coll_name]
            count = await coll.count_documents({"sku": {"$regex": "^DM-"}})
            if count > 0:
                print(f"  '{coll_name}': {count} DM-XXX products")
                async for p in coll.find({"sku": {"$regex": "^DM-"}}).limit(3):
                    sku = p.get("sku", "N/A")
                    name = p.get("name", "N/A")[:40]
                    img = (p.get("image_url") or p.get("image", ""))[:80]
                    print(f"    SKU:{sku} | {name} | img:{img}")
            else:
                print(f"  '{coll_name}': 0 DM-XXX products")
        except Exception as e:
            print(f"  '{coll_name}': error - {e}")
    
    # Check how dine page gets its products - look at dine_requests / what fills dine page
    print("\nSample products_master with primary_pillar=dine and food-like names:")
    async for p in db.products_master.find({
        "primary_pillar": "dine"
    }).limit(20):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:45]
        img = (p.get("image_url") or p.get("image", ""))[:80]
        cat = p.get("category", "N/A")
        print(f"  SKU:{sku} | {name} | cat:{cat} | img:{img}")
    
    # Check for toy images in dine-tagged products (broader check)
    toy_dine_count = await db.products_master.count_documents({
        "primary_pillar": "dine",
        "image_url": {"$regex": "static.prod-images.emergentagent.com/jobs/"}
    })
    print(f"\nDine products (primary_pillar=dine) still with static.prod-images/jobs URLs: {toy_dine_count}")
    
    # Also check 'pillars' array for dine
    pillars_dine_count = await db.products_master.count_documents({
        "pillars": "dine"
    })
    print(f"Products with 'dine' in pillars array: {pillars_dine_count}")
    
    # Check pillar=dine (singular field)
    pillar_dine_count = await db.products_master.count_documents({
        "pillar": "dine"
    })
    print(f"Products with pillar='dine' (singular): {pillar_dine_count}")
    
    client.close()


asyncio.run(check_dine_collections())
