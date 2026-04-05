"""
56-Breed Product Audit Script
Checks how many products each breed has across all pillars.
Target: ~94 products per breed across 11 pillars.
Reports breeds below threshold and pillar gaps.
"""

import asyncio
import os
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pet-os-live-test_database")

TARGET_COUNT = 94
LOW_THRESHOLD = 70  # Flag breeds below this

EXPECTED_PILLARS = [
    "celebrate", "dine", "go", "care", "play",
    "learn", "paperwork", "emergency", "farewell", "adopt", "shop"
]

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    bp = db["breed_products"]

    print("=" * 70)
    print("56-BREED PRODUCT AUDIT")
    print("=" * 70)

    # Fetch all non-archived breed products
    cursor = bp.find(
        {"visibility.status": {"$ne": "archived"}, "is_active": {"$ne": False}},
        {"_id": 0, "id": 1, "breed": 1, "pillar": 1, "name": 1}
    )
    all_docs = await cursor.to_list(length=20000)
    print(f"Total active breed_products fetched: {len(all_docs)}\n")

    # Group by breed
    breed_map = defaultdict(list)
    for doc in all_docs:
        breed = doc.get("breed", "unknown")
        breed_map[breed].append(doc)

    breeds_sorted = sorted(breed_map.keys())
    print(f"Total distinct breeds: {len(breeds_sorted)}\n")

    # Audit each breed
    ok_breeds = []
    low_breeds = []
    missing_pillars_report = {}

    for breed in breeds_sorted:
        products = breed_map[breed]
        count = len(products)
        
        # Pillar coverage
        pillars_present = set(p.get("pillar", "") for p in products)
        missing_pillars = [pi for pi in EXPECTED_PILLARS if pi not in pillars_present]

        if count >= TARGET_COUNT and not missing_pillars:
            ok_breeds.append((breed, count))
        elif count < LOW_THRESHOLD:
            low_breeds.append((breed, count, missing_pillars))
            missing_pillars_report[breed] = {"count": count, "missing_pillars": missing_pillars}
        else:
            low_breeds.append((breed, count, missing_pillars))
            missing_pillars_report[breed] = {"count": count, "missing_pillars": missing_pillars}

    # Report
    print(f"{'=' * 70}")
    print(f"HEALTHY BREEDS (>= {TARGET_COUNT} products, all pillars covered): {len(ok_breeds)}")
    print(f"{'=' * 70}")
    for breed, cnt in ok_breeds:
        print(f"  OK  [{cnt:3d}] {breed}")

    print(f"\n{'=' * 70}")
    print(f"BREEDS NEEDING ATTENTION (< {TARGET_COUNT} or missing pillars): {len(low_breeds)}")
    print(f"{'=' * 70}")
    for breed, cnt, missing in sorted(low_breeds, key=lambda x: x[1]):
        flag = "LOW" if cnt < LOW_THRESHOLD else "GAP"
        missing_str = ", ".join(missing) if missing else "none"
        print(f"  {flag} [{cnt:3d}] {breed:<40} | missing pillars: {missing_str}")

    # Pillar summary across all breeds
    print(f"\n{'=' * 70}")
    print("PILLAR COVERAGE SUMMARY (across all breeds)")
    print(f"{'=' * 70}")
    pillar_breed_count = defaultdict(set)
    for doc in all_docs:
        pillar = doc.get("pillar", "unknown")
        breed = doc.get("breed", "unknown")
        pillar_breed_count[pillar].add(breed)
    
    for pillar in sorted(EXPECTED_PILLARS):
        breed_count = len(pillar_breed_count[pillar])
        print(f"  {pillar:<20}: {breed_count} breeds covered")

    # Extra pillars (not in expected list)
    extra_pillars = set(pillar_breed_count.keys()) - set(EXPECTED_PILLARS) - {"", "unknown", None}
    if extra_pillars:
        print(f"\n  Extra pillars found (not in expected list):")
        for p in sorted(extra_pillars):
            print(f"    {p}: {len(pillar_breed_count[p])} breeds")

    print(f"\n{'=' * 70}")
    print("SUMMARY")
    print(f"{'=' * 70}")
    print(f"  Total breeds found:    {len(breeds_sorted)}")
    print(f"  Healthy breeds:        {len(ok_breeds)}")
    print(f"  Needs attention:       {len(low_breeds)}")
    print(f"  Total active products: {len(all_docs)}")
    avg = len(all_docs) / len(breeds_sorted) if breeds_sorted else 0
    print(f"  Average per breed:     {avg:.1f}")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
