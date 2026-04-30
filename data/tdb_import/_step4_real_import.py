"""
STEP 4 — REAL IMPORT TO PRODUCTION ATLAS
Inserts 40,025 pet_parents + 26,650 tdb_pets_staging documents.
Verifies pets count = 47 BEFORE and AFTER.
Links pets to parents via pets_staging_ids array.
"""
import os
import sys
import json
import re
import math
import secrets
import time
from datetime import datetime, timezone, date
from collections import defaultdict
import pandas as pd
from pymongo import MongoClient, UpdateOne, InsertOne
from pymongo.errors import BulkWriteError

# Load env
PROD_URL = None
with open('/app/backend/.env') as f:
    for line in f:
        if line.startswith('PRODUCTION_MONGO_URL='):
            PROD_URL = line.split('=', 1)[1].strip()
            break
assert PROD_URL, "PRODUCTION_MONGO_URL not found"

# ── Cleanup helpers (same as dry run) ────────────────────────────
PREFIX_NOISE = re.compile(
    r'^(happy|hdb|h\s*bd|h\s*bday|b\'?day|birthday|bday|h\s*\d+|hd\s+|hbd|hb\s+)\b',
    re.IGNORECASE,
)
FALSE_POSITIVES = {'milk','chicken','mutton','fish','cake','treat','you','make','have','wheat','gluten','peanut','butter'}
EXTRACT_STRIP_WORDS = {
    'happy','hdb','hd','hbd','h','bd','bday','birthda','birthday',"b'day","b'days",
    'birth','day','days','happiest','wishing','wish','anniversary','turning','turned',
    'turns','turn','yay','yayy','yayyy','celebrating','celebrate','celebrates',
    'l','z','i','a','b','c','to','for','is','an','the','and','with','from','of','on',
    'kids','months','month','old','years','year','yr','yrs','st','nd','rd','th',
    'name','names','dog','doggy','pet','pets','puppy','puppies','baby','babies','breed',
    'mr','mrs','ms','sir','madam',
}
BREED_STRIP_WORDS = {'beagle','labrador','lab','golden','retriever','shih','tzu','husky','poodle','pug','rottweiler','german','shepherd','maltese','pomeranian','spitz','dachshund','lhasa','apso','cocker','spaniel','indie','mongrel','mixed','mix','choclate','chocolate','border','collie'}
NUMERIC = re.compile(r'^\d+$')
NUMBER_SUFFIX = re.compile(r'^\d+(st|nd|rd|th|\.\.+|\.)?$', re.IGNORECASE)

def clean_pet_name(raw):
    if not raw or not isinstance(raw, str): return None
    n = raw.strip()
    if not n or NUMERIC.match(n) or len(n) < 2: return None
    if n.lower() in FALSE_POSITIVES: return None
    if not PREFIX_NOISE.match(n) and ' ' not in n:
        return n
    words = re.split(r'[\s\']+', n)
    cleaned = []
    for w in words:
        w = w.strip('.,!?;:()[]{}"\'\\🤍❤️💕🌷')
        if not w: continue
        wl = w.lower()
        if wl in EXTRACT_STRIP_WORDS or wl in BREED_STRIP_WORDS or wl in FALSE_POSITIVES: continue
        if NUMERIC.match(w) or NUMBER_SUFFIX.match(w): continue
        if len(w) < 2: continue
        cleaned.append(w)
    if not cleaned: return None
    if len(cleaned) == 1:
        return cleaned[0].capitalize()
    final = ' '.join(w.capitalize() for w in cleaned)
    if final.lower() in FALSE_POSITIVES or len(final) < 2: return None
    return final

def _none(v):
    if v is None: return None
    if isinstance(v, float) and math.isnan(v): return None
    s = str(v).strip()
    if not s or s.lower() in ('nan','none','null'): return None
    return s

def _str(v):
    s = _none(v)
    if s is None: return None
    if s.endswith('.0') and s.replace('.','').replace('-','').isdigit():
        s = s[:-2]
    s = re.sub(r'\b(\d{6})\.0\b', r'\1', s)
    return s

def _strip_apostrophe(v):
    s = _none(v)
    if s is None: return None
    s = s.lstrip("'")
    if s.endswith('.0'): s = s[:-2]
    return s

def _bool(v):
    if v is None: return False
    if isinstance(v, bool): return v
    if isinstance(v, (int, float)):
        if isinstance(v, float) and math.isnan(v): return False
        return bool(v)
    return str(v).strip().lower() == 'true'

def _int(v):
    s = _none(v)
    if s is None: return None
    try: return int(float(s))
    except: return None

def _float(v):
    s = _none(v)
    if s is None: return None
    try: return float(s)
    except: return None

def _split_array(v, sep="; "):
    s = _none(v)
    if s is None: return []
    return [x.strip() for x in s.split(sep) if x.strip()]

def _email(v):
    s = _none(v)
    if s is None: return None
    s = s.lower().strip()
    return s if '@' in s else None

def _date(v):
    s = _none(v)
    if s is None: return None
    try:
        if 'T' in s or ' ' in s:
            return datetime.fromisoformat(s.replace('Z', '+00:00').replace(' ', 'T'))
        return datetime.fromisoformat(s)
    except:
        try: return datetime.strptime(s, '%Y-%m-%d')
        except: return None

def _json_obj(v):
    s = _none(v)
    if s is None: return None
    try: return json.loads(s)
    except: return None

NOW = datetime.now(timezone.utc)
BATCH_ID = "tdb_founding_2026_05"
FREE_UNTIL = datetime(2027, 5, 15, tzinfo=timezone.utc)

def transform_parent(row):
    raw_pet_names = _split_array(row.get('pet_names'), sep="; ")
    cleaned_pet_names = []
    for raw in raw_pet_names:
        c = clean_pet_name(raw)
        if c: cleaned_pet_names.append(c)
    cleaned_pet_names = list(dict.fromkeys(cleaned_pet_names))
    primary = _str(row.get('primary_pet_name'))
    primary_clean = clean_pet_name(primary) if primary else None
    if not primary_clean and cleaned_pet_names:
        primary_clean = cleaned_pet_names[0]
    return {
        'customer_key': _strip_apostrophe(row.get('customer_key')),
        'email': _email(row.get('email')),
        'phone': _strip_apostrophe(row.get('phone')),
        'has_email': _bool(row.get('has_email')),
        'has_phone': _bool(row.get('has_phone')),
        'first_name': _str(row.get('first_name')),
        'last_name': _str(row.get('last_name')),
        'address_line_1': _str(row.get('address_line_1')),
        'address_line_2': _str(row.get('address_line_2')),
        'city_raw': _str(row.get('city_raw')),
        'city': _str(row.get('city')),
        'state': _str(row.get('state')),
        'pincode': _str(row.get('pincode')),
        'country': _str(row.get('country')),
        'full_address': _str(row.get('full_address')),
        'address_quality': _str(row.get('address_quality')),
        'pet_names_raw': _str(row.get('pet_names')),
        'pet_names': cleaned_pet_names,
        'pet_count': _int(row.get('pet_count')) or 0,
        'primary_pet_name': primary_clean,
        'primary_breed': _str(row.get('breed')),
        'pet_birthday_year': _int(row.get('pet_birthday_year')),
        'pet_birthday_month': _int(row.get('pet_birthday_month')),
        'pet_birthday_day': _int(row.get('pet_birthday_day')),
        'pet_birthday_confidence': _str(row.get('pet_birthday_confidence')),
        'pet_age_reported': _float(row.get('pet_age_reported')),
        'pet_age_now': _float(row.get('pet_age_now')),
        'pet_life_stage': _str(row.get('pet_life_stage')),
        'proteins_ever_ordered': _split_array(row.get('proteins_ever_ordered')),
        'proteins_never_tried': _split_array(row.get('proteins_never_tried')),
        'favourite_protein': _str(row.get('favourite_protein')),
        'products_ordered': _split_array(row.get('products_ordered')),
        'allergens': _split_array(row.get('allergens')),
        'last_cake_flavour': _str(row.get('last_cake_flavour')),
        'total_orders': _int(row.get('total_orders')) or 0,
        'total_cakes': _int(row.get('total_cakes')) or 0,
        'total_spent_inr': _float(row.get('total_spent_inr')) or 0.0,
        'avg_order_value_inr': _float(row.get('avg_order_value_inr')),
        'avg_items_per_order': _float(row.get('avg_items_per_order')),
        'addon_rate': _float(row.get('addon_rate')),
        'first_order_date': _date(row.get('first_order_date')),
        'last_order_date': _date(row.get('last_order_date')),
        'years_with_tdb': _float(row.get('years_with_tdb')),
        'days_since_last_order': _int(row.get('days_since_last_order')),
        'avg_days_between_orders': _float(row.get('avg_days_between_orders')),
        'predicted_next_order_date': _date(row.get('predicted_next_order_date')),
        'overdue': _bool(row.get('overdue_flag')),
        'customer_status': _str(row.get('status')),
        'churn_risk': _str(row.get('churn_risk')),
        'loyalty_tier': _str(row.get('loyalty_tier')),
        'occasion_counts': _json_obj(row.get('occasion_counts')),
        'occasion_segment': _str(row.get('occasion_segment')),
        'birthday_orders': _int(row.get('birthday_orders')) or 0,
        'diwali_orders': _int(row.get('diwali_orders')) or 0,
        'christmas_orders': _int(row.get('christmas_orders')) or 0,
        'valentine_orders': _int(row.get('valentine_orders')) or 0,
        'halloween_orders': _int(row.get('halloween_orders')) or 0,
        'rakhi_orders': _int(row.get('rakhi_orders')) or 0,
        'anniversary_orders': _int(row.get('anniversary_orders')) or 0,
        'gotcha_day_orders': _int(row.get('gotcha_day_orders')) or 0,
        'email_marketing_status': _str(row.get('email_marketing_status')),
        'sms_marketing_status': _str(row.get('sms_marketing_status')),
        'intelligence_tier': _str(row.get('intelligence_tier')),
        'source': _str(row.get('source')),
        'is_tdb_founding_member': True,
        'membership_offer': 'pet_pass_full_founding',
        'free_until': FREE_UNTIL,
        'founding_discount_forever': True,
        'invite_token': secrets.token_urlsafe(24),
        'assigned_send_date': None,
        'soft_launch': False,
        'activation_status': 'imported_pending_invite',
        'invite_sent_at': None,
        'invite_opened_at': None,
        'invite_clicked_at': None,
        'activated_at': None,
        'mira_introduction_state': None,
        'pets_staging_ids': [],
        'pets_live_ids': [],
        'import_batch_id': BATCH_ID,
        'imported_at': NOW,
    }

def transform_pet(row):
    raw_name = _str(row.get('name'))
    cleaned_name = clean_pet_name(raw_name) if raw_name else None
    return {
        'staging_id': _str(row.get('staging_id')),
        'parent_customer_key': _strip_apostrophe(row.get('parent_customer_key')),
        'parent_email': _email(row.get('parent_email')),
        'parent_phone': _strip_apostrophe(row.get('parent_phone')),
        'name_raw': raw_name,
        'name': cleaned_name,
        'breed': _str(row.get('breed')),
        'birthday_year': _int(row.get('birthday_year')),
        'birthday_month': _int(row.get('birthday_month')),
        'birthday_day': _int(row.get('birthday_day')),
        'birthday_confidence': _str(row.get('birthday_confidence')),
        'age_reported': _float(row.get('age_reported')),
        'age_now': _float(row.get('age_now')),
        'life_stage': _str(row.get('life_stage')),
        'proteins_known': _split_array(row.get('proteins_known')),
        'allergens_known': _split_array(row.get('allergens_known')),
        'is_household_pet_count': _int(row.get('is_household_pet_count')) or 1,
        'household_position': _int(row.get('household_position')) or 1,
        'source': _str(row.get('source')),
        'imported_at': NOW,
        'migration_status': 'staged',
        'migrated_to_pet_id': None,
        'migration_date': None,
        'import_batch_id': BATCH_ID,
    }

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════
def log(msg):
    ts = datetime.now(timezone.utc).strftime('%H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

print("=" * 78)
print("STEP 4 — REAL IMPORT TO PRODUCTION ATLAS")
print("=" * 78)

# Connect
log("Connecting to production Atlas...")
client = MongoClient(PROD_URL, serverSelectionTimeoutMS=15000)
db = client['pet-os-live-test_database']
log(f"   Connected. DB: {db.name}, Mongo {client.server_info()['version']}")

# ── PRE-INSERT GATE: pets count must be 47 ────────────────────────
log("Pre-insert pets count check...")
pets_before = db.pets.count_documents({})
log(f"   db.pets.countDocuments() = {pets_before}")
assert pets_before == 47, f"⛔ PETS COUNT IS NOT 47 BEFORE INSERT (got {pets_before}). ABORTING."
log("   ✅ pets = 47 before insert — safe to proceed")

# Pre-state of new collections
pp_before = db.pet_parents.count_documents({})
ts_before = db.tdb_pets_staging.count_documents({})
log(f"   db.pet_parents = {pp_before}, db.tdb_pets_staging = {ts_before}")
if pp_before > 0 or ts_before > 0:
    print(f"⚠️  WARNING: target collections are not empty (pp={pp_before}, ts={ts_before}).")
    print("    Aborting to avoid duplicates. Drop them manually if you want a fresh import.")
    sys.exit(1)

# ── Load CSVs ─────────────────────────────────────────────────────
log("Loading tdb_enriched_customers.csv...")
parents_df = pd.read_csv(
    '/app/data/tdb_import/tdb_enriched_customers.csv',
    low_memory=False,
    dtype={'customer_key': str, 'phone': str, 'pincode': str,
           'shopify_customer_id': str, 'pet_birthday_year': 'Int64',
           'pet_birthday_month': 'Int64', 'pet_birthday_day': 'Int64'}
)
assert len(parents_df) == 40025, f"Expected 40025, got {len(parents_df)}"
log(f"   Loaded {len(parents_df):,} parent rows")

log("Loading tdb_pets_staging.csv...")
pets_df = pd.read_csv(
    '/app/data/tdb_import/tdb_pets_staging.csv',
    low_memory=False,
    dtype={'parent_customer_key': str, 'parent_phone': str,
           'birthday_year': 'Int64', 'birthday_month': 'Int64', 'birthday_day': 'Int64'}
)
assert len(pets_df) == 26650, f"Expected 26650, got {len(pets_df)}"
log(f"   Loaded {len(pets_df):,} pet rows")

# ── Transform all rows in memory ──────────────────────────────────
log("Transforming all 40,025 parent rows...")
parent_docs = [transform_parent(r) for r in parents_df.to_dict('records')]
log(f"   Transformed {len(parent_docs):,} parent docs")

log("Transforming all 26,650 pet rows...")
pet_docs = [transform_pet(r) for r in pets_df.to_dict('records')]
log(f"   Transformed {len(pet_docs):,} pet docs")

# Sanity: invite_tokens unique
tokens = {d['invite_token'] for d in parent_docs}
assert len(tokens) == len(parent_docs), f"DUPLICATE invite_tokens! {len(parent_docs)-len(tokens)} dups"
log(f"   ✅ All {len(tokens):,} invite_tokens are unique")

# ── Insert pet_parents in batches of 500 ─────────────────────────
BATCH_SIZE = 500
log(f"Inserting pet_parents in batches of {BATCH_SIZE}, ordered=False...")
t0 = time.time()
total_pp = 0
errors_pp = []
for i in range(0, len(parent_docs), BATCH_SIZE):
    batch = parent_docs[i:i+BATCH_SIZE]
    try:
        result = db.pet_parents.insert_many(batch, ordered=False)
        total_pp += len(result.inserted_ids)
    except BulkWriteError as bwe:
        ok = bwe.details.get('nInserted', 0)
        total_pp += ok
        for err in bwe.details.get('writeErrors', []):
            errors_pp.append({'index': err.get('index'), 'code': err.get('code'),
                              'msg': err.get('errmsg', '')[:120]})
    if (i // BATCH_SIZE + 1) % 10 == 0:
        log(f"   inserted {total_pp:,}/{len(parent_docs):,} parent docs ({time.time()-t0:.1f}s)")

log(f"   ✅ pet_parents insert complete: {total_pp:,} inserted, {len(errors_pp)} errors in {time.time()-t0:.1f}s")
if errors_pp:
    log(f"   First 3 errors: {errors_pp[:3]}")

# ── Insert tdb_pets_staging in batches of 500 ────────────────────
log(f"Inserting tdb_pets_staging in batches of {BATCH_SIZE}, ordered=False...")
t0 = time.time()
total_ts = 0
errors_ts = []
for i in range(0, len(pet_docs), BATCH_SIZE):
    batch = pet_docs[i:i+BATCH_SIZE]
    try:
        result = db.tdb_pets_staging.insert_many(batch, ordered=False)
        total_ts += len(result.inserted_ids)
    except BulkWriteError as bwe:
        ok = bwe.details.get('nInserted', 0)
        total_ts += ok
        for err in bwe.details.get('writeErrors', []):
            errors_ts.append({'index': err.get('index'), 'code': err.get('code'),
                              'msg': err.get('errmsg', '')[:120]})
    if (i // BATCH_SIZE + 1) % 10 == 0:
        log(f"   inserted {total_ts:,}/{len(pet_docs):,} pet docs ({time.time()-t0:.1f}s)")

log(f"   ✅ tdb_pets_staging insert complete: {total_ts:,} inserted, {len(errors_ts)} errors in {time.time()-t0:.1f}s")
if errors_ts:
    log(f"   First 3 errors: {errors_ts[:3]}")

# ── POST-INSERT GATE: pets count MUST still be 47 ────────────────
log("POST-INSERT pets count check...")
pets_after = db.pets.count_documents({})
log(f"   db.pets.countDocuments() = {pets_after}")
assert pets_after == 47, f"⛔ PETS COUNT CHANGED! Expected 47, got {pets_after}. CRITICAL — investigate immediately."
log("   ✅ pets = 47 after insert (UNCHANGED — live collection safe)")

# ── Final counts ──────────────────────────────────────────────────
pp_count = db.pet_parents.count_documents({})
ts_count = db.tdb_pets_staging.count_documents({})
log(f"   db.pet_parents       = {pp_count:,}  (target 40,025)")
log(f"   db.tdb_pets_staging  = {ts_count:,}  (target 26,650)")
log(f"   db.pets              = {pets_after}  (target 47, UNCHANGED)")

# ── Linkage: $push staging_ids to parents ────────────────────────
log("Building parent → pet linkage map...")
parent_to_pets = defaultdict(list)
for pet in pet_docs:
    parent_to_pets[pet['parent_customer_key']].append(pet['staging_id'])
log(f"   {len(parent_to_pets):,} parents have at least 1 pet staged")

log("Bulk linking pets_staging_ids on parents...")
t0 = time.time()
ops = []
for parent_key, staging_ids in parent_to_pets.items():
    ops.append(UpdateOne({'customer_key': parent_key},
                         {'$set': {'pets_staging_ids': staging_ids}}))
# Bulk write in chunks of 1000
linked = 0
for i in range(0, len(ops), 1000):
    chunk = ops[i:i+1000]
    res = db.pet_parents.bulk_write(chunk, ordered=False)
    linked += res.modified_count
log(f"   ✅ Linked {linked:,} parents in {time.time()-t0:.1f}s")

# Verify linkage
linked_count = db.pet_parents.count_documents({'pets_staging_ids.0': {'$exists': True}})
log(f"   Parents with non-empty pets_staging_ids: {linked_count:,}")

# ── DONE ──────────────────────────────────────────────────────────
log("")
log("=" * 78)
log("STEP 4 COMPLETE")
log("=" * 78)
print(json.dumps({
    'pets_before': pets_before,
    'pets_after': pets_after,
    'pet_parents_inserted': total_pp,
    'pet_parents_errors': len(errors_pp),
    'tdb_pets_staging_inserted': total_ts,
    'tdb_pets_staging_errors': len(errors_ts),
    'parents_linked': linked_count,
    'parents_with_at_least_one_pet': len(parent_to_pets),
}, indent=2))
