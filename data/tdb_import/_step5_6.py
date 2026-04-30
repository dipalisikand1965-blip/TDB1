"""
STEP 5 — Assign send dates (real writes)
STEP 6 — Soft launch flagging (PREVIEW ONLY — pauses for Dipali approval)
"""
import os
import json
from datetime import datetime, timezone, timedelta, date
from pymongo import MongoClient, UpdateOne

PROD_URL = open('/app/backend/.env').read().split('PRODUCTION_MONGO_URL=')[1].split('\n')[0].strip()
db = MongoClient(PROD_URL)['pet-os-live-test_database']

INTEL_RANK = {'COMPLETE': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4, 'MINIMAL': 5}
BATCH_SIZE = 2000
START_DATE = date(2026, 5, 15)

def log(msg):
    ts = datetime.now(timezone.utc).strftime('%H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

print("=" * 78)
print("STEP 5 — ASSIGN SEND DATES")
print("=" * 78)

# Eligible: has_email=True AND customer_status != "never_ordered"
eligible_filter = {
    'has_email': True,
    'customer_status': {'$ne': 'never_ordered'},
}

eligible_count = db.pet_parents.count_documents(eligible_filter)
log(f"Eligible parents (has_email=True AND customer_status != never_ordered): {eligible_count:,}")

# Sort by total_spent_inr desc, then intelligence_tier rank asc (COMPLETE first)
log("Loading eligible parent IDs in priority order (highest spend first)...")
cursor = db.pet_parents.find(
    eligible_filter,
    {'_id': 1, 'total_spent_inr': 1, 'intelligence_tier': 1}
).sort('total_spent_inr', -1)

# Sort by (total_spent_inr desc, intelligence_tier asc) — Mongo can sort on 2 keys but we want the COMPLETE-first within same spend
all_eligible = list(cursor)
log(f"Loaded {len(all_eligible):,} eligible IDs from Atlas")

# Re-sort in Python to handle the dual sort cleanly
all_eligible.sort(key=lambda d: (-d.get('total_spent_inr', 0), INTEL_RANK.get(d.get('intelligence_tier'), 99)))

# Assign date in batches of 2,000 starting May 15
log(f"Assigning send dates: {BATCH_SIZE}/day starting {START_DATE}")
ops = []
day_offset = 0
for i, doc in enumerate(all_eligible):
    if i > 0 and i % BATCH_SIZE == 0:
        day_offset += 1
    send_date = START_DATE + timedelta(days=day_offset)
    send_dt = datetime(send_date.year, send_date.month, send_date.day, tzinfo=timezone.utc)
    ops.append(UpdateOne({'_id': doc['_id']}, {'$set': {'assigned_send_date': send_dt}}))

last_send_date = START_DATE + timedelta(days=day_offset)
log(f"  → wave will run {START_DATE} to {last_send_date}")

# Bulk write in chunks
log("Writing assigned_send_date to all eligible parents...")
written = 0
for j in range(0, len(ops), 1000):
    chunk = ops[j:j+1000]
    res = db.pet_parents.bulk_write(chunk, ordered=False)
    written += res.modified_count
log(f"  ✅ Updated assigned_send_date on {written:,} eligible parents")

# Verify
populated = db.pet_parents.count_documents({'assigned_send_date': {'$ne': None}})
untouched = db.pet_parents.count_documents({'assigned_send_date': None})
peak_pipeline = list(db.pet_parents.aggregate([
    {'$match': {'assigned_send_date': {'$ne': None}}},
    {'$group': {'_id': '$assigned_send_date', 'n': {'$sum': 1}}},
    {'$sort': {'n': -1}},
    {'$limit': 1}
]))
peak = peak_pipeline[0]['n'] if peak_pipeline else 0

# Schedule report (per send date)
schedule = list(db.pet_parents.aggregate([
    {'$match': {'assigned_send_date': {'$ne': None}}},
    {'$group': {'_id': '$assigned_send_date', 'n': {'$sum': 1}}},
    {'$sort': {'_id': 1}}
]))

log("")
log("=" * 78)
log("STEP 5 RESULTS")
log("=" * 78)
log(f"  Total eligible (wave 1)     : {populated:,}")
log(f"  First send date             : {START_DATE}")
log(f"  Last send date              : {last_send_date}")
log(f"  Peak day load (must be ≤2K) : {peak:,}")
log(f"  Untouched (no email or never_ordered): {untouched:,}")
log("")
log("  Per-day breakdown:")
for s in schedule:
    d = s['_id'].strftime('%Y-%m-%d') if hasattr(s['_id'], 'strftime') else str(s['_id'])
    log(f"    {d}: {s['n']:>5,}")

# ════════════════════════════════════════════════════════════════════
# STEP 6 — SOFT LAUNCH FLAGGING (PREVIEW ONLY — NO WRITES)
# ════════════════════════════════════════════════════════════════════
print()
print("=" * 78)
print("STEP 6 — SOFT LAUNCH FLAGGING (PREVIEW — NO DB WRITES)")
print("=" * 78)

candidates = []  # list of dicts with: _id, email, name, city, spend, intel, loyalty, reason

# 1. Top 1 by total_spent where intelligence_tier == COMPLETE
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE'}).sort('total_spent_inr', -1).limit(1):
    candidates.append({**{k: d.get(k) for k in ['_id','email','first_name','last_name','city','total_spent_inr','intelligence_tier','loyalty_tier']}, 'reason': 'top_complete_overall'})

# 2. Top 3 COMPLETE × Mumbai
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE', 'city': 'Mumbai'}).sort('total_spent_inr', -1).limit(3):
    candidates.append({**{k: d.get(k) for k in ['_id','email','first_name','last_name','city','total_spent_inr','intelligence_tier','loyalty_tier']}, 'reason': 'top_complete_mumbai'})

# 3. Top 3 COMPLETE × Bangalore
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE', 'city': 'Bangalore'}).sort('total_spent_inr', -1).limit(3):
    candidates.append({**{k: d.get(k) for k in ['_id','email','first_name','last_name','city','total_spent_inr','intelligence_tier','loyalty_tier']}, 'reason': 'top_complete_bangalore'})

# 4. Top 2 by spend where loyalty_tier == VIP
for d in db.pet_parents.find({'loyalty_tier': 'VIP'}).sort('total_spent_inr', -1).limit(2):
    candidates.append({**{k: d.get(k) for k in ['_id','email','first_name','last_name','city','total_spent_inr','intelligence_tier','loyalty_tier']}, 'reason': 'top_vip'})

# 5. Specific email — Shreesha Hemmige
shreesha = db.pet_parents.find_one({'email': 'shreeshahemmige@gmail.com'})
if shreesha:
    candidates.append({**{k: shreesha.get(k) for k in ['_id','email','first_name','last_name','city','total_spent_inr','intelligence_tier','loyalty_tier']}, 'reason': 'specific_shreesha'})
else:
    print("⚠️  shreeshahemmige@gmail.com NOT FOUND in pet_parents — skipping this match.")

# Dedupe by _id (keep first reason seen)
seen = {}
for c in candidates:
    if c['_id'] not in seen:
        seen[c['_id']] = c
    else:
        seen[c['_id']]['reason'] += f", {c['reason']}"
unique = list(seen.values())

print(f"\nSoft-launch list — {len(unique)} unique records (after dedup):\n")
for i, c in enumerate(unique, 1):
    print(f"  {i:>2}. {c.get('first_name') or '':<15s} {c.get('last_name') or '':<15s}  "
          f"{c.get('city') or '—':<15s}  ₹{c.get('total_spent_inr') or 0:>10,.0f}  "
          f"{c.get('email') or '(no email)':<40s}  "
          f"intel={c.get('intelligence_tier'):<8s} loyalty={c.get('loyalty_tier'):<10s} "
          f"reason={c['reason']}")

print()
print("STEP 6 — PREVIEW ONLY. No DB writes performed.")
print("Awaiting Dipali's ✅ before applying soft_launch=True + assigned_send_date=2026-05-14")
print("=" * 78)

# Save the IDs for the actual update step
with open('/app/data/tdb_import/_step6_candidates.json', 'w') as f:
    json.dump([str(c['_id']) for c in unique], f)
print(f"\n💾 Saved {len(unique)} _ids to /app/data/tdb_import/_step6_candidates.json (will apply on approval)")
