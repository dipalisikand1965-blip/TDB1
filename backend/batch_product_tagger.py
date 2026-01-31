"""
Batch AI Product Tagging Script
Tags all products with base_tags using GPT-4o
Runs in background, saves progress incrementally
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM_PROMPT = """You are a Product Intelligence Tagger for a pet (dog) e-commerce company.

LOCKED TAXONOMY v1.0 - Tag ONLY these values:

interaction_type (SINGLE, REQUIRED): consumable, play, wearable, care, document, containment
usage_frequency (SINGLE, REQUIRED): one_time, occasional, daily
mess_level (SINGLE, required for consumables): low, medium, high
benefits (MULTI, only if EXPLICIT): digestion, dental_health, skin_coat, joint_support, immunity, weight_management, urinary_health, cognitive_support, calming, training_support, boredom_relief, anxiety_relief, mental_stimulation
format (MULTI): dry, soft, liquid, chew, baked, frozen, powder
diet_type (MULTI): grain_free, gluten_free, vegetarian, single_protein, limited_ingredient
protein_source (MULTI): chicken, lamb, beef, fish, egg, peanut, dairy, none
life_stage (MULTI, default to adult): puppy, adult, senior, all_stages
breed_size (MULTI): toy, small, medium, large, giant
price_tier (SINGLE): budget (<₹300), mid (₹300-₹1000), premium (>₹1000)
purchase_pattern (SINGLE): impulse, replenishment, celebration
category_primary (SINGLE, REQUIRED): food, treats, cakes, toys, grooming, accessories, supplements, services
category_secondary (SINGLE): biscuit, soft_chew, hard_chew, training_treat, celebration_treat, birthday_cake, mini_cake, fresh_food, wet_food, dry_food, topper, squeaky_toy, plush_toy, puzzle_toy, chew_toy, travel_accessory, grooming_tool, collar, leash, harness

RULES:
- Travel crates/carriers → interaction_type: containment
- Squeaky toys → category_secondary: squeaky_toy
- Cakes → usage_frequency: one_time, mess_level: high
- Fresh meals → category_secondary: fresh_food, mess_level: high
- Default life_stage to adult unless explicitly stated

Return ONLY valid JSON (no markdown):
{"interaction_type":"...","benefits":[],"usage_frequency":"...","mess_level":"...","format":[],"diet_type":[],"protein_source":[],"life_stage":[],"breed_size":[],"price_tier":"...","purchase_pattern":"...","category_primary":"...","category_secondary":"..."}"""

async def tag_single_product(product: dict, api_key: str) -> dict:
    """Tag a single product"""
    chat = LlmChat(
        api_key=api_key,
        session_id=f"batch-{product.get('id', 'unknown')[:20]}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    # Determine price tier from price
    price = product.get('price') or product.get('minPrice') or 0
    if price < 300:
        price_hint = "budget"
    elif price < 1000:
        price_hint = "mid"
    else:
        price_hint = "premium"
    
    product_info = f"""Product: {product.get('name')}
Description: {(product.get('description') or 'N/A')[:300]}
Category: {product.get('category') or 'N/A'}
Price: ₹{price} (suggest: {price_hint})
Ingredients: {(product.get('ingredients') or 'N/A')[:200]}

Return JSON only."""

    try:
        response = await chat.send_message(UserMessage(text=product_info))
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()
        
        base_tags = json.loads(clean)
        return {"success": True, "base_tags": base_tags}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def main():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'test_database')
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get all products without base_tags
    all_products = await db.products.find(
        {"base_tags": {"$exists": False}},
        {"_id": 1, "id": 1, "name": 1, "description": 1, "category": 1, "price": 1, "minPrice": 1, "ingredients": 1}
    ).to_list(1000)
    
    total = len(all_products)
    print(f"Starting batch tagging of {total} products...")
    print(f"Start time: {datetime.now(timezone.utc).isoformat()}")
    
    success_count = 0
    error_count = 0
    batch_size = 10
    
    for i in range(0, total, batch_size):
        batch = all_products[i:i+batch_size]
        print(f"\nProcessing batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size} ({i+1}-{min(i+batch_size, total)}/{total})")
        
        for product in batch:
            product_id = product.get('id') or str(product.get('_id'))
            name = product.get('name', 'Unknown')[:40]
            
            result = await tag_single_product(product, api_key)
            
            if result["success"]:
                # Update product with base_tags
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"base_tags": result["base_tags"]}}
                )
                success_count += 1
                print(f"  ✓ {name}")
            else:
                error_count += 1
                print(f"  ✗ {name}: {result['error'][:50]}")
            
            # Small delay to avoid rate limits
            await asyncio.sleep(0.3)
        
        # Progress update
        print(f"  Progress: {success_count}/{total} tagged, {error_count} errors")
    
    print(f"\n{'='*60}")
    print(f"BATCH TAGGING COMPLETE")
    print(f"{'='*60}")
    print(f"Total: {total}")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    print(f"End time: {datetime.now(timezone.utc).isoformat()}")
    
    # Save summary
    summary = {
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "total": total,
        "success": success_count,
        "errors": error_count
    }
    with open('/tmp/batch_tagging_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
