import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]
    
    print("=== products_master by pillar ===")
    pipeline = [{"$group": {"_id": "$pillar", "count": {"$sum": 1}}}]
    cursor = db.products_master.aggregate(pipeline)
    results = await cursor.to_list(length=50)
    for r in sorted(results, key=lambda x: x['count'], reverse=True):
        print(f"  {r['_id']}: {r['count']}")
    
    print("\n=== Legacy product collections ===")
    colls = await db.list_collection_names()
    for c in sorted(colls):
        if 'product' in c.lower() and c != 'products_master':
            cnt = await db[c].count_documents({})
            if cnt > 0:
                print(f"  {c}: {cnt}")

    print("\n=== bundles by pillar ===")
    pipeline2 = [{"$group": {"_id": "$pillar", "count": {"$sum": 1}}}]
    cursor2 = db.bundles.aggregate(pipeline2)
    results2 = await cursor2.to_list(length=50)
    for r in sorted(results2, key=lambda x: x['count'], reverse=True):
        print(f"  {r['_id']}: {r['count']}")

    print("\n=== services_master by pillar ===")
    pipeline3 = [{"$group": {"_id": "$pillar", "count": {"$sum": 1}}}]
    cursor3 = db.services_master.aggregate(pipeline3)
    results3 = await cursor3.to_list(length=50)
    for r in sorted(results3, key=lambda x: x['count'], reverse=True):
        print(f"  {r['_id']}: {r['count']}")

asyncio.run(main())
