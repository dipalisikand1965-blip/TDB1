"""
Generate AI images for the 31 new Go products using DALL-E.
These are proper product images (not soul mockups) — use ai_image_service.
"""
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
import os, sys, asyncio
sys.path.insert(0, '/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME   = os.environ.get('DB_NAME')

GO_PRODUCT_IDS = [
    "GO-SAF-001","GO-SAF-002","GO-SAF-003","GO-SAF-004",
    "GO-CAL-001","GO-CAL-002","GO-CAL-003",
    "GO-CAR-001","GO-CAR-002","GO-CAR-003","GO-CAR-004","GO-CAR-005","GO-CAR-006",
    "GO-COM-001","GO-COM-002","GO-COM-003",
    "GO-FED-001","GO-FED-002","GO-FED-003",
    "GO-DOC-001","GO-DOC-002",
    "GO-HLT-001","GO-HLT-002",
    "GO-STY-001","GO-STY-002","GO-STY-003","GO-STY-004",
    "GO-STY-005","GO-STY-006","GO-STY-007","GO-STY-008",
]

async def gen_image(product_id, client, db):
    from ai_image_service import generate_ai_image
    p = await db.products_master.find_one({"id": product_id})
    if not p:
        print(f"  NOT FOUND: {product_id}")
        return False
    name = p.get("name", product_id)
    prompt = p.get("ai_image_prompt") or f"Professional product photo of {name} for dogs, white background, commercial photography"
    print(f"  Generating: {name}")
    try:
        url = await generate_ai_image(prompt)
        if url:
            await db.products_master.update_one(
                {"id": product_id},
                {"$set": {"image_url": url, "image": url, "images": [url],
                          "primary_image": url, "ai_image_generated": True,
                          "image_updated_at": datetime.now(timezone.utc),
                          "updated_at": datetime.now(timezone.utc)}}
            )
            print(f"    ✅ {url[:60]}...")
            return True
        print(f"    ❌ No URL returned")
        return False
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return False

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    ok = fail = 0
    batch_size = 4
    for i in range(0, len(GO_PRODUCT_IDS), batch_size):
        batch = GO_PRODUCT_IDS[i:i+batch_size]
        print(f"\n--- Batch {i//batch_size+1}: {batch} ---")
        results = await asyncio.gather(*[gen_image(pid, client, db) for pid in batch])
        ok   += sum(1 for r in results if r)
        fail += sum(1 for r in results if not r)
        if i + batch_size < len(GO_PRODUCT_IDS):
            await asyncio.sleep(3)
    print(f"\n=== DONE: {ok} ok / {fail} failed ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
