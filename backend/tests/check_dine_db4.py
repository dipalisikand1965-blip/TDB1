"""Check FF-XXX products and category-based images"""
import asyncio
import motor.motor_asyncio


async def check_ff_products():
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
    
    # Check FF-XXX products
    print("FF-XXX products:")
    async for p in db.products_master.find({"sku": {"$regex": "^FF-"}}).limit(14):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:45]
        primary = p.get("primary_pillar", "N/A")
        cat = p.get("category", "N/A")
        img = (p.get("image_url") or p.get("image", ""))[:80]
        print(f"  SKU:{sku} | {name} | primary:{primary} | cat:{cat} | img:{img}")
    
    # Check products with 'Daily Meals' category
    print("\nProducts with 'Daily Meals' category:")
    dm_count = await db.products_master.count_documents({"category": "Daily Meals"})
    print(f"  Count: {dm_count}")
    async for p in db.products_master.find({"category": "Daily Meals"}).limit(10):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:45]
        primary = p.get("primary_pillar", "N/A")
        img = (p.get("image_url") or p.get("image", ""))[:80]
        print(f"  SKU:{sku} | {name} | primary:{primary} | img:{img}")
    
    # Check for products with category like 'Treats' or 'treats'
    print("\nProducts with treats-related category:")
    treats_count = await db.products_master.count_documents({"category": {"$regex": "treat", "$options": "i"}})
    print(f"  Count: {treats_count}")
    async for p in db.products_master.find({"category": {"$regex": "treat", "$options": "i"}}).limit(5):
        sku = p.get("sku", "N/A")
        name = p.get("name", "N/A")[:45]
        primary = p.get("primary_pillar", "N/A")
        img = (p.get("image_url") or p.get("image", ""))[:80]
        print(f"  SKU:{sku} | {name} | primary:{primary} | img:{img}")
    
    # How does the /dine page source its products? Check dine_routes
    # Count dine product categories 
    print("\nAll unique categories in dine products (primary_pillar=dine):")
    pipeline = [
        {"$match": {"primary_pillar": "dine"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    async for result in db.products_master.aggregate(pipeline):
        print(f"  category: '{result['_id']}' - {result['count']} products")
    
    # Check count of products without any image (cleared by fix)
    no_img_count = await db.products_master.count_documents({
        "primary_pillar": "dine",
        "$or": [
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$exists": False}}
        ]
    })
    print(f"\nDine products with no image_url: {no_img_count}")
    
    client.close()


asyncio.run(check_ff_products())
