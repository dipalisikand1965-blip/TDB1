import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "test_database" 

async def check_variants():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    product = await db.products.find_one({"shopify_handle": "doggo-cake"})
    if product:
        print(f"Product: {product.get('name')}")
        print(f"Variants count: {len(product.get('variants', []))}")
        print(f"Options: {product.get('options')}")
        if product.get('variants'):
            print(f"First Variant: {product['variants'][0]}")
    else:
        print("Product not found")

if __name__ == "__main__":
    asyncio.run(check_variants())
