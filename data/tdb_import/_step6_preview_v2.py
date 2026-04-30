"""
STEP 6 — REFINED soft launch preview (still NO writes)
- Skip Shreesha (Dipali WhatsApps personally)
- Keep Ronan, flag him as whatsapp_only=True
- Expand to 10 by adding next 4 highest COMPLETE-tier with email
"""
import json
from datetime import datetime, timezone
from pymongo import MongoClient

PROD_URL = open('/app/backend/.env').read().split('PRODUCTION_MONGO_URL=')[1].split('\n')[0].strip()
db = MongoClient(PROD_URL)['pet-os-live-test_database']

candidates = []
seen_ids = set()

def add(d, reason):
    if d['_id'] in seen_ids:
        # append reason
        for c in candidates:
            if c['_id'] == d['_id']:
                c['reason'] += f", {reason}"
                return
    seen_ids.add(d['_id'])
    candidates.append({
        '_id': d['_id'],
        'email': d.get('email'),
        'phone': d.get('phone'),
        'first_name': d.get('first_name'),
        'last_name': d.get('last_name'),
        'city': d.get('city'),
        'total_spent_inr': d.get('total_spent_inr'),
        'intelligence_tier': d.get('intelligence_tier'),
        'loyalty_tier': d.get('loyalty_tier'),
        'reason': reason,
        'whatsapp_only': not bool(d.get('email')),  # phone-only = whatsapp_only
    })

# Original 5 rules (per brief)
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE'}).sort('total_spent_inr', -1).limit(1):
    add(d, 'top_complete_overall')
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE', 'city': 'Mumbai'}).sort('total_spent_inr', -1).limit(3):
    add(d, 'top_complete_mumbai')
for d in db.pet_parents.find({'intelligence_tier': 'COMPLETE', 'city': 'Bangalore'}).sort('total_spent_inr', -1).limit(3):
    add(d, 'top_complete_bangalore')
for d in db.pet_parents.find({'loyalty_tier': 'VIP'}).sort('total_spent_inr', -1).limit(2):
    add(d, 'top_vip')

current = len(candidates)
print(f"After original 5 rules: {current} unique records")

# Top up to 10 with next-highest COMPLETE-tier WITH email
need = 10 - current
print(f"Need {need} more — pulling next-highest COMPLETE-tier with email...")
for d in db.pet_parents.find({
    'intelligence_tier': 'COMPLETE',
    'has_email': True,
    '_id': {'$nin': list(seen_ids)},
}).sort('total_spent_inr', -1).limit(need):
    add(d, 'next_top_complete_with_email')

print(f"\nFinal soft-launch list — {len(candidates)} records:\n")
for i, c in enumerate(candidates, 1):
    em = c['email'] or '(no email)'
    wa = ' [WHATSAPP-ONLY]' if c['whatsapp_only'] else ''
    print(f"  {i:>2}. {c['first_name'] or '':<15s} {(c['last_name'] or '')[:15]:<15s}  "
          f"{(c['city'] or '—'):<15s}  ₹{c['total_spent_inr'] or 0:>10,.0f}  "
          f"{em[:40]:<40s}{wa}  reason={c['reason']}")

# Save the IDs for application after Dipali approval
with open('/app/data/tdb_import/_step6_candidates.json', 'w') as f:
    json.dump([{'_id': str(c['_id']), 'whatsapp_only': c['whatsapp_only'], 'email': c['email'], 'name': f"{c['first_name']} {c['last_name']}", 'reason': c['reason']} for c in candidates], f, indent=2)
print(f"\n💾 Saved {len(candidates)} _ids to _step6_candidates.json")
print("\n🛑 PREVIEW ONLY — no soft_launch=true written yet. Awaiting Dipali ✅.")
