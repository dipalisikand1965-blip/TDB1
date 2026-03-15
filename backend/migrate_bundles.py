"""
Migration Script: Consolidate all pillar-specific bundle collections into main 'bundles' collection
This ensures BundlesManager shows ALL bundles from all pillars

PILLAR-SPECIFIC COLLECTIONS TO MERGE:
adopt_bundles, advisory_bundles, care_bundles, celebrate_bundles, dine_bundles,
emergency_bundles, enjoy_bundles, farewell_bundles, fit_bundles, learn_bundles,
paperwork_bundles, stay_bundles, travel_bundles
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

PILLAR_BUNDLE_COLLECTIONS = {
    'adopt_bundles': 'adopt',
    'advisory_bundles': 'advisory',
    'care_bundles': 'care',
    'celebrate_bundles': 'celebrate',
    'dine_bundles': 'dine',
    'emergency_bundles': 'emergency',
    'enjoy_bundles': 'enjoy',
    'farewell_bundles': 'farewell',
    'fit_bundles': 'fit',
    'learn_bundles': 'learn',
    'paperwork_bundles': 'paperwork',
    'stay_bundles': 'stay',
    'travel_bundles': 'travel',
    'product_bundles': None,  # Has pillar field
}

async def main():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'doggy_company')]

    print("=== Bundle Collections Migration ===\n")

    # Load existing bundle IDs
    print("Loading existing bundles IDs...")
    existing_ids = set()
    existing_names_by_pillar = {}
    async for doc in db.bundles.find({}, {"_id": 0, "id": 1, "name": 1, "pillar": 1}):
        if doc.get("id"):
            existing_ids.add(doc["id"])
        pillar = doc.get("pillar", "")
        name = (doc.get("name") or "").lower().strip()
        if pillar:
            if pillar not in existing_names_by_pillar:
                existing_names_by_pillar[pillar] = set()
            existing_names_by_pillar[pillar].add(name)
    print(f"  Found {len(existing_ids)} existing bundles in main 'bundles' collection\n")

    colls = await db.list_collection_names()
    total_migrated = 0
    total_skipped = 0

    for collection_name, pillar_override in PILLAR_BUNDLE_COLLECTIONS.items():
        if collection_name not in colls:
            print(f"  SKIP {collection_name}: doesn't exist")
            continue

        count = await db[collection_name].count_documents({})
        if count == 0:
            print(f"  SKIP {collection_name}: empty")
            continue

        print(f"\nProcessing {collection_name} ({count}) -> pillar={pillar_override or 'from doc'}")
        migrated = 0
        skipped = 0

        async for doc in db[collection_name].find({}):
            doc.pop("_id", None)

            pillar = pillar_override or doc.get("pillar", "")
            if not pillar:
                skipped += 1
                continue

            # Generate ID
            doc_id = doc.get("id") or str(uuid.uuid4())

            if doc_id in existing_ids:
                skipped += 1
                continue

            doc_name = (doc.get("name") or "").lower().strip()
            if doc_name and pillar in existing_names_by_pillar:
                if doc_name in existing_names_by_pillar[pillar]:
                    skipped += 1
                    continue

            # Normalize to bundles schema
            original_price = float(doc.get("original_price") or doc.get("price") or 0)
            bundle_price = float(doc.get("bundle_price") or doc.get("discounted_price") or doc.get("price") or original_price)
            discount = round((1 - bundle_price / original_price) * 100) if original_price > 0 else 0

            normalized = {
                "id": doc_id,
                "pillar": pillar,
                "name": doc.get("name", ""),
                "description": doc.get("description", ""),
                "items": doc.get("items") or [],
                "original_price": original_price,
                "bundle_price": bundle_price,
                "discount": discount,
                "icon": doc.get("icon") or doc.get("emoji") or "📦",
                "image_url": doc.get("image_url") or doc.get("image") or "",
                "popular": doc.get("popular", False),
                "active": doc.get("active", True),
                "source": f"migrated_from_{collection_name}",
                "created_at": doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            await db.bundles.insert_one(normalized)
            normalized.pop("_id", None)

            existing_ids.add(doc_id)
            if pillar not in existing_names_by_pillar:
                existing_names_by_pillar[pillar] = set()
            existing_names_by_pillar[pillar].add(doc_name)

            migrated += 1

        print(f"  Migrated: {migrated}, Skipped: {skipped}")
        total_migrated += migrated
        total_skipped += skipped

    print(f"\n=== Migration Complete ===")
    print(f"Total migrated: {total_migrated}, Skipped: {total_skipped}")

    final_count = await db.bundles.count_documents({})
    print(f"bundles collection final count: {final_count}")
    pipeline = [{"$group": {"_id": "$pillar", "count": {"$sum": 1}}}]
    cursor = db.bundles.aggregate(pipeline)
    results = await cursor.to_list(length=50)
    print("By pillar:")
    for r in sorted(results, key=lambda x: x['count'], reverse=True):
        print(f"  {r['_id']}: {r['count']}")

asyncio.run(main())
