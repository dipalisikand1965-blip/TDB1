"""
Trigger AI image generation for all 35 newly inserted care products.
Runs them in batches of 5 to avoid rate limits.
"""
import asyncio
import os
import sys
sys.path.insert(0, '/app/backend')

# Load .env before importing any modules that need env vars
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME   = os.environ.get('DB_NAME', 'thedoggycompany')
API_URL   = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

PRODUCT_IDS = [
    "breed-american_bully-grooming_kit-61905cf3",
    "breed-chow_chow-grooming_kit-ff61ce5b",
    "breed-english_bulldog-grooming_kit-1fff0ecd",
    "breed-irish_setter-grooming_kit-ff1f0e2e",
    "breed-italian_greyhound-grooming_kit-c6a0054b",
    "breed-schnoodle-grooming_kit-6abdc3f8",
    "breed-scottish_terrier-grooming_kit-ae781eb0",
    "breed-st_bernard-grooming_kit-0ee12672",
    "soul-breed-akita-pet_towel",
    "soul-breed-akita-pet_robe",
    "soul-breed-akita-grooming_apron",
    "soul-breed-australian_shepherd-pet_towel",
    "soul-breed-australian_shepherd-pet_robe",
    "soul-breed-australian_shepherd-grooming_apron",
    "soul-breed-bernese_mountain_dog-pet_towel",
    "soul-breed-bernese_mountain_dog-pet_robe",
    "soul-breed-bernese_mountain_dog-grooming_apron",
    "soul-breed-corgi-pet_towel",
    "soul-breed-corgi-pet_robe",
    "soul-breed-corgi-grooming_apron",
    "soul-breed-saint_bernard-pet_towel",
    "soul-breed-saint_bernard-pet_robe",
    "soul-breed-saint_bernard-grooming_apron",
    "soul-breed-samoyed-pet_towel",
    "soul-breed-samoyed-pet_robe",
    "soul-breed-samoyed-grooming_apron",
    "soul-breed-shiba_inu-pet_towel",
    "soul-breed-shiba_inu-pet_robe",
    "soul-breed-shiba_inu-grooming_apron",
    "soul-breed-spitz-pet_towel",
    "soul-breed-spitz-pet_robe",
    "soul-breed-spitz-grooming_apron",
    "soul-breed-weimaraner-pet_towel",
    "soul-breed-weimaraner-pet_robe",
    "soul-breed-weimaraner-grooming_apron",
]

async def generate_image_for_product(product_id, client, db):
    """Generate AI image directly using the ai_image_service logic."""
    from ai_image_service import generate_ai_image, get_product_image_prompt
    
    product = await db.products_master.find_one({"id": product_id})
    if not product:
        print(f"  NOT FOUND: {product_id}")
        return False
    
    name = product.get("name", "")
    prompt = get_product_image_prompt(product)
    print(f"  Generating image for: {name}")
    print(f"    Prompt: {prompt[:80]}...")
    
    try:
        url = await generate_ai_image(prompt)
        if url:
            await db.products_master.update_one(
                {"id": product_id},
                {"$set": {
                    "image_url": url,
                    "image": url,
                    "images": [url],
                    "primary_image": url,
                    "ai_image_generated": True,
                    "ai_generated_image": True,
                    "image_updated_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }}
            )
            print(f"    SUCCESS: {url[:60]}...")
            return True
        else:
            print(f"    FAILED: No URL returned")
            return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    success = 0
    failed = 0
    batch_size = 4  # Run 4 at a time
    
    for i in range(0, len(PRODUCT_IDS), batch_size):
        batch = PRODUCT_IDS[i:i+batch_size]
        print(f"\n--- Batch {i//batch_size + 1} ({len(batch)} products) ---")
        results = await asyncio.gather(*[generate_image_for_product(pid, client, db) for pid in batch])
        success += sum(1 for r in results if r)
        failed += sum(1 for r in results if not r)
        if i + batch_size < len(PRODUCT_IDS):
            print("  Pausing 3s between batches...")
            await asyncio.sleep(3)
    
    print(f"\n=== DONE: {success} succeeded, {failed} failed ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
