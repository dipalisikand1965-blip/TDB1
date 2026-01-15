import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Force localhost for check
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "test_database" 

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    products = await db.products.count_documents({})
    orders = await db.orders.count_documents({})
    users = await db.users.count_documents({})
    
    print(f"Products: {products}")
    print(f"Orders: {orders}")
    print(f"Users: {users}")

if __name__ == "__main__":
    asyncio.run(check_db())
