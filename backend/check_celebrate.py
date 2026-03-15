import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]
    no_cat = await db.products_master.count_documents({"pillar": "celebrate", "$or": [{"category": {"$exists": False}}, {"category": None}, {"category": ""}]})
    total = await db.products_master.count_documents({"pillar": "celebrate"})
    print(f"celebrate products without category: {no_cat} / {total}")
asyncio.run(main())
