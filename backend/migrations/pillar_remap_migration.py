"""
Full Pillar Remapping Migration
Run: python3 /app/backend/migrations/pillar_remap_migration.py
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime, timezone

load_dotenv('/app/backend/.env')
client = MongoClient(os.environ.get('MONGO_URL'))
db = client[os.environ.get('DB_NAME', 'pet_soul_db')]

MAPPING = {
    'advisory': 'paperwork',
    'fit':      'play',
    'enjoy':    'play',
    'stay':     'go',
    'travel':   'go',
    'feed':     'dine',
    'groom':    'care',
    'insure':   'paperwork',
}

# Bundle → pillar assignments
BUNDLE_PILLAR_MAP = {
    'Complete Grooming Kit':          'care',
    'Daily Walks Essentials':         'go',
    'Training Starter Pack':          'learn',
    'Wellness & Health Pack':         'care',
    'New Pawrent Starter Kit':        'paperwork',
    'Dental Care Bundle':             'care',
    'Spa Day Experience':             'care',
    'Senior Pet Care Kit':            'care',
    'Cab Travel Kit':                 'go',
    'Train Travel Kit':               'go',
    'Flight Ready Kit - Small Dogs':  'go',
    'Flight Ready Kit - Medium Dogs': 'go',
    'Relocation Comfort Pack':        'go',
}

COLLECTIONS_TO_REMAP = [
    'products_master', 'services_master', 'product_bundles', 'unified_products',
    'breed_products', 'care_bundles', 'celebrate_bundles', 'enjoy_bundles',
    'fit_bundles', 'stay_bundles', 'travel_bundles', 'products',
]

GRAND_TOTAL = 0

# ── STEP 1: Pillar remapping ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 1: PILLAR REMAPPING ACROSS ALL COLLECTIONS")
print("="*60)

for col_name in COLLECTIONS_TO_REMAP:
    col = db[col_name]
    col_total = 0
    for old_pillar, new_pillar in MAPPING.items():
        # Update top-level 'pillar' field
        r = col.update_many({'pillar': old_pillar}, {'$set': {'pillar': new_pillar}})
        if r.modified_count:
            print(f"  [{col_name}] '{old_pillar}' → '{new_pillar}': {r.modified_count} docs")
            col_total += r.modified_count

        # Update 'pillars' array field (multi-pillar products)
        if col_name in ('products_master', 'unified_products', 'products'):
            # Use aggregation pipeline to replace all occurrences in array
            try:
                r2 = col.update_many(
                    {'pillars': old_pillar},
                    [{'$set': {'pillars': {
                        '$map': {
                            'input': '$pillars',
                            'in': {'$cond': [{'$eq': ['$$this', old_pillar]}, new_pillar, '$$this']}
                        }
                    }}}]
                )
                if r2.modified_count:
                    print(f"  [{col_name}] pillars[] '{old_pillar}' → '{new_pillar}': {r2.modified_count} docs")
                    col_total += r2.modified_count
            except Exception as e:
                print(f"  [{col_name}] pillars[] update error: {e}")

    if col_total == 0:
        print(f"  [{col_name}] no changes needed")
    else:
        print(f"  [{col_name}] SUBTOTAL: {col_total}")
        GRAND_TOTAL += col_total

print(f"\n→ STEP 1 TOTAL UPDATED: {GRAND_TOTAL}")

# ── STEP 2: Import 895 breed products into products_master ───────────────────
print("\n" + "="*60)
print("STEP 2: IMPORT BREED PRODUCTS INTO products_master")
print("="*60)

master_ids = set(str(p['_id']) for p in db.products_master.find({}, {'_id': 1}))
master_names = set(p.get('name', '') for p in db.products_master.find({}, {'name': 1, '_id': 0}) if p.get('name'))

to_insert = []
for bp in db.breed_products.find({}):
    if str(bp['_id']) in master_ids:
        continue
    if bp.get('name', '') in master_names:
        continue
    # Remap pillar
    pillar = bp.get('pillar', '')
    pillar = MAPPING.get(pillar, pillar)
    new_doc = {k: v for k, v in bp.items() if k != '_id'}
    new_doc['pillar'] = pillar
    new_doc['is_active'] = True
    new_doc['active'] = True
    new_doc['visibility'] = {'status': 'active'}
    new_doc['product_type'] = new_doc.get('product_type', 'breed_pick')
    new_doc['source'] = 'breed_products_import'
    new_doc['imported_at'] = datetime.now(timezone.utc)
    to_insert.append(new_doc)

if to_insert:
    result = db.products_master.insert_many(to_insert, ordered=False)
    step2_count = len(result.inserted_ids)
    print(f"→ STEP 2 TOTAL INSERTED: {step2_count} breed products")
else:
    step2_count = 0
    print("→ STEP 2: nothing to import (all breed products already in master)")

# ── STEP 3: Set is_active: true on missing ───────────────────────────────────
print("\n" + "="*60)
print("STEP 3: SET is_active ON MISSING PRODUCTS")
print("="*60)

r3 = db.products_master.update_many(
    {'is_active': {'$exists': False}},
    {'$set': {'is_active': True, 'active': True}}
)
print(f"→ STEP 3 UPDATED: {r3.modified_count} products (is_active was missing)")

# ── STEP 4: Set visibility.status: "active" on missing ──────────────────────
print("\n" + "="*60)
print("STEP 4: SET visibility.status ON MISSING PRODUCTS")
print("="*60)

r4 = db.products_master.update_many(
    {'visibility.status': {'$exists': False}},
    {'$set': {'visibility': {'status': 'active'}}}
)
print(f"→ STEP 4 UPDATED: {r4.modified_count} products (visibility.status was missing)")

# ── STEP 5: Fix 13 bundles with no pillar ────────────────────────────────────
print("\n" + "="*60)
print("STEP 5: FIX BUNDLES WITH NO PILLAR")
print("="*60)

bundle_update_count = 0
for bundle_name, pillar in BUNDLE_PILLAR_MAP.items():
    r5 = db.product_bundles.update_one(
        {'name': bundle_name, '$or': [{'pillar': {'$exists': False}}, {'pillar': None}, {'pillar': ''}]},
        {'$set': {'pillar': pillar}}
    )
    if r5.modified_count:
        print(f"  '{bundle_name}' → '{pillar}'")
        bundle_update_count += 1
print(f"→ STEP 5 UPDATED: {bundle_update_count} bundles")

# ── POST-MIGRATION VERIFICATION ──────────────────────────────────────────────
print("\n" + "="*60)
print("POST-MIGRATION VERIFICATION")
print("="*60)

CORRECT = {'celebrate','dine','go','care','play','learn','paperwork','emergency','farewell','adopt','shop','services'}
OLD_NAMES = set(MAPPING.keys())

for col_name in COLLECTIONS_TO_REMAP:
    col = db[col_name]
    remaining = {old: col.count_documents({'pillar': old}) for old in OLD_NAMES}
    remaining = {k: v for k, v in remaining.items() if v > 0}
    if remaining:
        print(f"  ⚠️  [{col_name}] OLD PILLARS STILL PRESENT: {remaining}")
    else:
        print(f"  ✓  [{col_name}] clean")

# Summary
print("\n" + "="*60)
print("MIGRATION SUMMARY")
print("="*60)
print(f"  Step 1 - Pillar remapping:        {GRAND_TOTAL} docs updated")
print(f"  Step 2 - Breed products imported: {step2_count}")
print(f"  Step 3 - is_active set:           {r3.modified_count}")
print(f"  Step 4 - visibility.status set:   {r4.modified_count}")
print(f"  Step 5 - Bundles pillar fixed:    {bundle_update_count}")
TOTAL = GRAND_TOTAL + step2_count + r3.modified_count + r4.modified_count + bundle_update_count
print(f"\n  GRAND TOTAL CHANGES: {TOTAL}")
