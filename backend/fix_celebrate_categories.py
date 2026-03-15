"""
Fix uncategorized Celebrate products in products_master
Assigns correct category based on keywords in product name
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Keyword -> category mapping (ordered by specificity)
CATEGORY_KEYWORDS = {
    'cake': 'cakes',
    'donut': 'donuts',
    'doughnut': 'donuts',
    'dognut': 'donuts',
    'cupcake': 'cakes',
    'muffin': 'cakes',
    'cookie': 'treats',
    'biscuit': 'treats',
    'treat': 'treats',
    'snack': 'treats',
    'hamper': 'hampers',
    'box': 'hampers',
    'gift': 'gifts',
    'kit': 'gifts',
    'pack': 'gifts',
    'set': 'gifts',
    'toy': 'toys',
    'ball': 'toys',
    'plush': 'toys',
    'bandana': 'accessories',
    'collar': 'accessories',
    'bow': 'accessories',
    'hat': 'accessories',
    'outfit': 'accessories',
    'dress': 'accessories',
    'harness': 'accessories',
    'leash': 'accessories',
    'banner': 'decorations',
    'balloon': 'decorations',
    'decoration': 'decorations',
    'candle': 'decorations',
    'party': 'party',
    'birthday': 'birthday',
}

async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]

    print("=== Fix Uncategorized Celebrate Products ===\n")

    # Find celebrate products without a category
    query = {
        "pillar": "celebrate",
        "$or": [
            {"category": {"$exists": False}},
            {"category": None},
            {"category": ""},
        ]
    }
    
    count = await db.products_master.count_documents(query)
    print(f"Found {count} uncategorized celebrate products\n")

    fixed = 0
    unmatched = 0
    skipped = []

    async for doc in db.products_master.find(query, {"_id": 0, "id": 1, "shopify_id": 1, "name": 1}):
        name_lower = (doc.get("name") or "").lower()
        
        # Find matching category
        matched_category = None
        for keyword, category in CATEGORY_KEYWORDS.items():
            if keyword in name_lower:
                matched_category = category
                break
        
        doc_id = doc.get("id") or doc.get("shopify_id")
        
        if matched_category:
            result = await db.products_master.update_one(
                {"$or": [{"id": doc_id}, {"shopify_id": doc_id}]},
                {"$set": {"category": matched_category}}
            )
            if result.modified_count > 0:
                fixed += 1
                print(f"  ✅ '{doc.get('name')}' -> category: {matched_category}")
        else:
            unmatched += 1
            skipped.append(doc.get('name'))

    print(f"\n=== Complete ===")
    print(f"Fixed: {fixed}")
    print(f"Unmatched (no keyword): {unmatched}")
    
    if skipped:
        print(f"\nProducts with no matching category ({len(skipped)}):")
        for name in skipped[:20]:
            print(f"  - {name}")
        if len(skipped) > 20:
            print(f"  ... and {len(skipped)-20} more")
    
    # Set a default category for remaining unmatched
    if unmatched > 0:
        result = await db.products_master.update_many(
            query,
            {"$set": {"category": "general"}}
        )
        print(f"\nSet 'general' category for {result.modified_count} unmatched products")

asyncio.run(main())
