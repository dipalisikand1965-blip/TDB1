"""Check picks/Mira's selections for toy images"""
import asyncio
import motor.motor_asyncio


async def check_picks():
    with open('/app/backend/.env') as f:
        env_lines = f.read().split('\n')
    mongo_url = next((l.split('=', 1)[1].strip() for l in env_lines if l.startswith('MONGO_URL=')), '')
    db_name = next((l.split('=', 1)[1].strip() for l in env_lines if l.startswith('DB_NAME=')), '')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check total curated picks
    total = await db.curated_picks_cache.count_documents({})
    print(f"Total curated picks in DB: {total}")
    
    # Check mira scores for Mojo
    mojo_scores = await db.mira_product_scores.count_documents({"pet_id": "pet-mojo-7327ad56"})
    print(f"Mira product scores for Mojo: {mojo_scores}")
    
    # Check products referenced by mira scores that have toy images
    if mojo_scores > 0:
        # Get product IDs from scores
        async for score in db.mira_product_scores.find({"pet_id": "pet-mojo-7327ad56", "score": {"$gte": 60}}).limit(10):
            prod_id = score.get("product_id")
            score_val = score.get("score", 0)
            if prod_id:
                # Look up the product
                prod = await db.products_master.find_one({"id": prod_id})
                if prod:
                    img = prod.get("image_url") or prod.get("image", "")
                    is_toy = "4700c8db" in img if img else False
                    print(f"  Score:{score_val} | {prod.get('name','N/A')[:40]} | toy:{is_toy} | img:{img[:60]}")
    
    # Check all products_master with toy images (any remaining)
    toy_count_total = await db.products_master.count_documents({
        "image_url": {"$regex": "4700c8db"}
    })
    print(f"\nTotal products_master with 4700c8db (toy) URLs: {toy_count_total}")
    
    # What about the 'image' field (not image_url)?
    toy_image_field = await db.products_master.count_documents({
        "image": {"$regex": "4700c8db"}
    })
    print(f"Products with 4700c8db in 'image' field: {toy_image_field}")
    
    # What about 'images' array field?
    toy_images_array = await db.products_master.count_documents({
        "images": {"$regex": "4700c8db"}
    })
    print(f"Products with 4700c8db in 'images' array: {toy_images_array}")
    
    client.close()


asyncio.run(check_picks())
