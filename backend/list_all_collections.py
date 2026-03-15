import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]
    
    print("=== ALL collections with counts ===")
    colls = await db.list_collection_names()
    for c in sorted(colls):
        cnt = await db[c].count_documents({})
        if cnt > 0:
            print(f"  {c}: {cnt}")

asyncio.run(main())
