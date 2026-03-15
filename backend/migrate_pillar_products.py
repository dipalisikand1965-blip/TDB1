"""
Migration Script: Migrate all pillar-specific product collections to products_master
Run this script ONCE on production to consolidate all products into products_master

IMPORTANT: This script is SAFE to run multiple times (idempotent).
It checks for existing products by their unique id/shopify_id before inserting.
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Map of collection name -> pillar value
PILLAR_COLLECTIONS = {
    'dine_products': 'dine',
    'care_products': 'care',
    'fit_products': 'fit',
    'stay_products': 'stay',
    'travel_products': 'travel',
    'enjoy_products': 'enjoy',
    'learn_products': 'learn',
    'farewell_products': 'farewell',
    'emergency_products': 'emergency',
    'adopt_products': 'adopt',
    'advisory_products': 'advisory',
    'paperwork_products': 'paperwork',
    'celebrate_products': 'celebrate',  # Legacy
    'unified_products': None,  # Already has pillar field
}

async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]

    print("=== Pillar Products Migration ===\n")
    
    # Get all existing products_master IDs for dedup
    print("Loading existing products_master IDs...")
    existing_ids = set()
    existing_names_by_pillar = {}
    async for doc in db.products_master.find({}, {"_id": 0, "id": 1, "shopify_id": 1, "pillar": 1, "name": 1}):
        if doc.get("id"):
            existing_ids.add(doc["id"])
        if doc.get("shopify_id"):
            existing_ids.add(doc["shopify_id"])
        pillar = doc.get("pillar", "")
        name = doc.get("name", "").lower().strip()
        if pillar:
            if pillar not in existing_names_by_pillar:
                existing_names_by_pillar[pillar] = set()
            existing_names_by_pillar[pillar].add(name)
    print(f"  Found {len(existing_ids)} existing products in products_master\n")

    total_migrated = 0
    total_skipped = 0

    colls = await db.list_collection_names()

    for collection_name, pillar_override in PILLAR_COLLECTIONS.items():
        if collection_name not in colls:
            print(f"  SKIP {collection_name}: collection doesn't exist")
            continue
        
        count = await db[collection_name].count_documents({})
        if count == 0:
            print(f"  SKIP {collection_name}: empty collection")
            continue

        print(f"\nProcessing {collection_name} ({count} docs) -> pillar={pillar_override or 'from doc'}")
        
        migrated = 0
        skipped = 0
        
        async for doc in db[collection_name].find({}):
            doc.pop("_id", None)
            
            # Determine pillar
            pillar = pillar_override or doc.get("pillar", "")
            if not pillar:
                skipped += 1
                continue
            
            # Generate/use ID
            doc_id = doc.get("id") or doc.get("shopify_id") or str(uuid.uuid4())
            
            # Check for duplicate by ID
            if doc_id in existing_ids:
                skipped += 1
                continue
            
            # Check for duplicate by name+pillar
            doc_name = (doc.get("name") or "").lower().strip()
            if doc_name and pillar in existing_names_by_pillar:
                if doc_name in existing_names_by_pillar[pillar]:
                    skipped += 1
                    continue
            
            # Normalize to products_master schema
            normalized = {
                "id": doc_id,
                "pillar": pillar,
                "name": doc.get("name", ""),
                "description": doc.get("description", ""),
                "category": (
                    doc.get("category") or
                    doc.get("subcategory") or
                    doc.get("care_type") or
                    doc.get("fit_type") or
                    doc.get("dine_type") or
                    ""
                ),
                "sub_category": doc.get("sub_category") or doc.get("subcategory") or "",
                "price": float(doc.get("price") or 0),
                "compare_price": float(doc.get("compare_price") or 0),
                "image_url": (
                    doc.get("image_url") or
                    doc.get("image") or
                    doc.get("main_image") or
                    ""
                ),
                "active": doc.get("active", True) if doc.get("status") != "draft" else False,
                "is_active": doc.get("active", True),
                "source": f"migrated_from_{collection_name}",
                "tags": doc.get("tags") or [],
                "shopify_id": doc.get("shopify_id") or "",
                "created_at": doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "_migrated": True,
            }
            
            # Keep any extra original fields
            for k, v in doc.items():
                if k not in normalized and k != "_id":
                    normalized[k] = v
            
            await db.products_master.insert_one(normalized)
            normalized.pop("_id", None)
            
            existing_ids.add(doc_id)
            if pillar not in existing_names_by_pillar:
                existing_names_by_pillar[pillar] = set()
            existing_names_by_pillar[pillar].add(doc_name)
            
            migrated += 1
        
        print(f"  Migrated: {migrated}, Skipped (duplicates): {skipped}")
        total_migrated += migrated
        total_skipped += skipped

    print(f"\n=== Migration Complete ===")
    print(f"Total migrated: {total_migrated}")
    print(f"Total skipped: {total_skipped}")

    # Verify
    final_count = await db.products_master.count_documents({})
    pipeline = [{"$group": {"_id": "$pillar", "count": {"$sum": 1}}}]
    cursor = db.products_master.aggregate(pipeline)
    results = await cursor.to_list(length=50)
    print(f"\nproducts_master final count: {final_count}")
    print("By pillar:")
    for r in sorted(results, key=lambda x: x['count'], reverse=True):
        print(f"  {r['_id']}: {r['count']}")


asyncio.run(main())
