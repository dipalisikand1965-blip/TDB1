"""
STEP 11 — Final consolidated report
"""
import json
import sys, os
from datetime import datetime, timezone
sys.path.insert(0, '/app/backend')
from pymongo import MongoClient

PROD_URL = open('/app/backend/.env').read().split('PRODUCTION_MONGO_URL=')[1].split('\n')[0].strip()
db = MongoClient(PROD_URL)['pet-os-live-test_database']

snap = json.load(open('/app/data/tdb_import/_step9_10_results.json'))

# Pull 5 random samples from each
import random
random.seed(43)

pp_count = db.pet_parents.count_documents({})
ts_count = db.tdb_pets_staging.count_documents({})
pets_count = db.pets.count_documents({})

# Sample 5 random pet_parents
pp_ids = list(db.pet_parents.find({}, {'_id':1}).limit(50000))
sample_pp_ids = random.sample(pp_ids, 5)
samples_pp = list(db.pet_parents.find({'_id': {'$in':[i['_id'] for i in sample_pp_ids]}}))

# Sample 5 random tdb_pets_staging
ts_ids = list(db.tdb_pets_staging.find({}, {'_id':1}))
sample_ts_ids = random.sample(ts_ids, 5)
samples_ts = list(db.tdb_pets_staging.find({'_id': {'$in':[i['_id'] for i in sample_ts_ids]}}))

# Send-date stats
sd_pipeline = list(db.pet_parents.aggregate([
    {'$match': {'assigned_send_date': {'$ne': None}}},
    {'$group': {'_id': '$assigned_send_date', 'n': {'$sum': 1}}},
    {'$sort': {'_id': 1}}
]))

# Soft launch list
soft = list(db.pet_parents.find({'soft_launch': True},
    {'first_name':1,'last_name':1,'email':1,'city':1,'total_spent_inr':1,
     'whatsapp_only':1,'assigned_send_date':1}).sort('total_spent_inr', -1))

# Indexes
pp_idx = list(db.pet_parents.list_indexes())
ts_idx = list(db.tdb_pets_staging.list_indexes())

# Untouched
untouched = db.pet_parents.count_documents({'assigned_send_date': None})
linked = db.pet_parents.count_documents({'pets_staging_ids.0': {'$exists': True}})

def _ser(o):
    if isinstance(o, datetime): return o.isoformat()
    return str(o)

print("=" * 78)
print("STEP 11 — FINAL CONSOLIDATED REPORT")
print("=" * 78)
print(f"\nGenerated: {datetime.now(timezone.utc).isoformat()}\n")

print("✅ STEP 0 — Connection verified")
print(f"   - PRODUCTION_MONGO_URL: confirmed")
print(f"   - Database: pet-os-live-test_database")
print(f"   - pets count before: 47")
print(f"   - pet_parents count before: 0")
print(f"   - tdb_pets_staging count before: 0")

print(f"\n✅ STEP 1 — Pre-import backup")
print(f"   - Run ID: 20260430-061835")
print(f"   - Drive folder: Daily-DB-Snapshots")
print(f"   - File: mongo-pet-soul-ranking-pet-os-live-test_database-20260430-061835.archive.gz")
print(f"   - Drive ID: 1tNoxod5wHgXS_EFMEyjBS_cV_F8Vbjci")
print(f"   - File size: 143,792,258 bytes (143.8 MB)")

print(f"\n✅ STEP 4 — Imports complete")
print(f"   - pet_parents: {pp_count:,} inserted (target 40,025)")
print(f"   - tdb_pets_staging: {ts_count:,} inserted (target 26,650)")
print(f"   - pets (untouched): {pets_count} (target 47)")
print(f"   - parents with linked pets: {linked:,}")

print(f"\n✅ STEP 5 — Send dates assigned")
print(f"   - Eligible for wave 1: {sum(s['n'] for s in sd_pipeline) - 10:,}")
print(f"   - First send: 2026-05-15")
print(f"   - Last send: 2026-05-21")
print(f"   - Peak day load: 2,000")
print(f"   - Untouched cohort (no email or never_ordered): {untouched:,}")

print(f"\n✅ STEP 6 — Soft launch flagged ({len(soft)} records)")
for i, s in enumerate(soft, 1):
    em = s.get('email') or '(no email)'
    wa = ' [whatsapp_only]' if s.get('whatsapp_only') else ''
    sd = s.get('assigned_send_date')
    sd_s = sd.strftime('%Y-%m-%d') if hasattr(sd, 'strftime') else str(sd)[:10]
    print(f"   {i:>2}. {(s.get('first_name') or '')+' '+(s.get('last_name') or ''):<35s}  "
          f"{(s.get('city') or '—'):<12s} ₹{s.get('total_spent_inr') or 0:>10,.0f}  "
          f"{em[:38]:<38s}  send={sd_s}{wa}")

print(f"\n✅ STEP 7 — Indexes created ({len(pp_idx)} on pet_parents, {len(ts_idx)} on tdb_pets_staging)")
print(f"\n   db.pet_parents.getIndexes():")
for ix in pp_idx:
    opts = {k:v for k,v in ix.items() if k not in ('name','key','v','ns')}
    print(f"      {ix['name']:<48s}  keys={dict(ix['key'])}  opts={opts}")
print(f"\n   db.tdb_pets_staging.getIndexes():")
for ix in ts_idx:
    opts = {k:v for k,v in ix.items() if k not in ('name','key','v','ns')}
    print(f"      {ix['name']:<48s}  keys={dict(ix['key'])}  opts={opts}")

print(f"\n✅ STEP 8 — Post-import backup")
print(f"   - Run ID: 20260430-073644 (success after retry)")
print(f"   - Drive ID: 15cx_YDNqqL4MwxV9shGL_JKwNAlIm5Q8")
print(f"   - File: mongo-...20260430-073644.archive.gz")
print(f"   - Size: 143,792,615 bytes (143.8 MB)")

print(f"\n✅ STEP 9 — Gold Master pinned")
print(f"   - Label: {snap['gold_master']['label']}")
print(f"   - Pinned File ID: {snap['gold_master']['file_id']}")
print(f"   - Folder: Weekly-Gold-Masters")
print(f"   - URL: {snap['gold_master']['url']}")

print(f"\n✅ STEP 10 — Frozen Snapshot archived (forever-retention)")
print(f"   - Folder: Monthly-Frozen-Snapshots/{snap['frozen']['folder_name']}/")
print(f"   - File ID: {snap['frozen']['file_id']}")
print(f"   - File present: ✅ verified by list_files()")
print(f"   - Folder URL: {snap['frozen']['parent_url']}")

print(f"\n✅ Sample records (5 random per collection)\n")

print("   pet_parents samples:\n")
for d in samples_pp:
    d.pop('_id', None)
    s = {k: d.get(k) for k in [
        'customer_key','email','phone','first_name','last_name','city','state','pincode',
        'pet_names','primary_pet_name','pet_birthday_month','pet_birthday_day',
        'total_orders','total_spent_inr','customer_status','intelligence_tier','loyalty_tier',
        'is_tdb_founding_member','soft_launch','whatsapp_only','assigned_send_date',
        'activation_status','invite_token']}
    print(json.dumps(s, indent=2, default=_ser))
    print()

print("   tdb_pets_staging samples:\n")
for d in samples_ts:
    d.pop('_id', None)
    s = {k: d.get(k) for k in [
        'staging_id','parent_customer_key','parent_email','name','name_raw','breed',
        'birthday_month','birthday_day','birthday_year','age_now','life_stage',
        'proteins_known','allergens_known','migration_status','import_batch_id']}
    print(json.dumps(s, indent=2, default=_ser))
    print()

print("=" * 78)
print("END OF STEP 11 REPORT")
print("=" * 78)
