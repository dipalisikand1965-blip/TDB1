"""
STEP 6 (apply) → STEP 7 (indexes) → STEP 8 (post-import backup setup)
"""
import json
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from bson import ObjectId

PROD_URL = open('/app/backend/.env').read().split('PRODUCTION_MONGO_URL=')[1].split('\n')[0].strip()
db = MongoClient(PROD_URL)['pet-os-live-test_database']

def log(msg):
    ts = datetime.now(timezone.utc).strftime('%H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

print("=" * 78)
print("STEP 6 (APPLY) — Soft launch flags")
print("=" * 78)

cands = json.load(open('/app/data/tdb_import/_step6_candidates.json'))
log(f"Loaded {len(cands)} candidates from preview")

ops = []
SOFT_DATE = datetime(2026, 5, 14, tzinfo=timezone.utc)
for c in cands:
    update = {
        'soft_launch': True,
        'assigned_send_date': SOFT_DATE,
    }
    if c['whatsapp_only']:
        update['whatsapp_only'] = True
    ops.append(UpdateOne({'_id': ObjectId(c['_id'])}, {'$set': update}))

result = db.pet_parents.bulk_write(ops, ordered=False)
log(f"  ✅ Soft launch applied: matched={result.matched_count}, modified={result.modified_count}")

# Verify
soft_count = db.pet_parents.count_documents({'soft_launch': True})
soft_may14 = db.pet_parents.count_documents({'soft_launch': True, 'assigned_send_date': SOFT_DATE})
wa_only = db.pet_parents.count_documents({'whatsapp_only': True, 'soft_launch': True})
log(f"  soft_launch=True            : {soft_count}")
log(f"  soft_launch + 2026-05-14    : {soft_may14}")
log(f"  whatsapp_only (soft launch) : {wa_only}")

# Pets count check (must still be 47)
pets_now = db.pets.count_documents({})
assert pets_now == 47, f"⛔ pets={pets_now}, MUST be 47!"
log(f"  ✅ pets still = 47 after STEP 6 apply")

# ════════════════════════════════════════════════════════════════════
# STEP 7 — INDEXES
# ════════════════════════════════════════════════════════════════════
print()
print("=" * 78)
print("STEP 7 — BUILD INDEXES")
print("=" * 78)

log("Creating indexes on pet_parents...")
pp_indexes = [
    ('customer_key', 1, {'unique': True}),
    ('email', 1, {'sparse': True}),
    ('phone', 1, {'sparse': True}),
    ('invite_token', 1, {'unique': True, 'sparse': True}),
    ('assigned_send_date', 1, {}),
    [('customer_status', 1), ('loyalty_tier', 1), {}],
    ('intelligence_tier', 1, {}),
    ('total_spent_inr', -1, {}),
    [('pet_birthday_month', 1), ('pet_birthday_day', 1), {}],
    ('soft_launch', 1, {}),
    [('city', 1), ('state', 1), {}],
    ('activation_status', 1, {}),
]
for idx in pp_indexes:
    if isinstance(idx[0], tuple) or isinstance(idx, list):
        # Compound
        keys = idx[:-1]
        opts = idx[-1] if isinstance(idx[-1], dict) else {}
        name = db.pet_parents.create_index(list(keys), **opts)
    else:
        keys = [(idx[0], idx[1])]
        opts = idx[2] if len(idx) > 2 else {}
        name = db.pet_parents.create_index(keys, **opts)
    log(f"  ✓ pet_parents {name}")

log("Creating indexes on tdb_pets_staging...")
ts_indexes = [
    ('staging_id', 1, {'unique': True}),
    ('parent_customer_key', 1, {}),
    ('parent_email', 1, {'sparse': True}),
    ('parent_phone', 1, {'sparse': True}),
    ('migration_status', 1, {}),
    ('name', 1, {'sparse': True}),
]
for idx in ts_indexes:
    keys = [(idx[0], idx[1])]
    opts = idx[2] if len(idx) > 2 else {}
    name = db.tdb_pets_staging.create_index(keys, **opts)
    log(f"  ✓ tdb_pets_staging {name}")

# Report all indexes
log("")
log("All pet_parents indexes:")
for idx in db.pet_parents.list_indexes():
    log(f"  {idx['name']}  keys={dict(idx['key'])}  opts={ {k:v for k,v in idx.items() if k not in ('name','key','v','ns')} }")

log("")
log("All tdb_pets_staging indexes:")
for idx in db.tdb_pets_staging.list_indexes():
    log(f"  {idx['name']}  keys={dict(idx['key'])}  opts={ {k:v for k,v in idx.items() if k not in ('name','key','v','ns')} }")

# ════════════════════════════════════════════════════════════════════
# STEP 8 — POST-IMPORT BACKUP (kicks off via API)
# ════════════════════════════════════════════════════════════════════
print()
print("=" * 78)
print("STEP 8 — POST-IMPORT BACKUP (will be triggered next via API)")
print("=" * 78)
log("STEP 7 complete. STEP 8 backup will be triggered by main script via curl.")

# Final pets sanity
pets_final = db.pets.count_documents({})
log(f"  ✅ pets count (final): {pets_final}")
assert pets_final == 47, f"⛔ pets={pets_final}!"
