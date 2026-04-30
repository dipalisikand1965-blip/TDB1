"""
STEP 2 — DRY RUN
Loads both CSVs, picks 5 random rows from each, transforms through the exact
schema-mapping spec (incl. pet-name cleanup), and prints the post-transform
JSON exactly as it would be inserted into MongoDB.
NO DATABASE WRITES.
"""
import pandas as pd
import json
import re
import math
import secrets
from datetime import datetime, timezone, date

# ── Pet-name cleanup (Flag 3, approved by Dipali) ──────────────────
PREFIX_NOISE = re.compile(
    r'^(happy|hdb|h\s*bd|h\s*bday|b\'?day|birthday|bday|h\s*\d+|hd\s+|hbd|hb\s+)\b',
    re.IGNORECASE,
)
FALSE_POSITIVES = {
    'milk', 'chicken', 'mutton', 'fish', 'cake', 'treat',
    'you', 'make', 'have', 'wheat', 'gluten', 'peanut', 'butter',
}
EXTRACT_STRIP_WORDS = {
    'happy','hdb','hd','hbd','h','bd','bday','birthda','birthday',"b'day","b'days",
    'birth','day','days','happiest','wishing','wish','anniversary','turning','turned',
    'turns','turn','yay','yayy','yayyy','celebrating','celebrate','celebrates',
    'l','z','i','a','b','c','to','for','is','an','the','and','with','from','of','on',
    'kids','months','month','old','years','year','yr','yrs','st','nd','rd','th',
    'name','names','dog','doggy','pet','pets','puppy','puppies','baby','babies','breed',
    'mr','mrs','ms','sir','madam',
}
BREED_STRIP_WORDS = {
    'beagle','labrador','lab','golden','retriever','shih','tzu','husky','poodle','pug',
    'rottweiler','german','shepherd','maltese','pomeranian','spitz','dachshund','lhasa',
    'apso','cocker','spaniel','indie','mongrel','mixed','mix','choclate','chocolate',
    'border','collie',
}
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
        if wl in EXTRACT_STRIP_WORDS or wl in BREED_STRIP_WORDS or wl in FALSE_POSITIVES:
            continue
        if NUMERIC.match(w) or NUMBER_SUFFIX.match(w): continue
        if len(w) < 2: continue
        cleaned.append(w)
    if not cleaned: return None
    if len(cleaned) == 1:
        return cleaned[0].capitalize()
    final = ' '.join(w.capitalize() for w in cleaned)
    if final.lower() in FALSE_POSITIVES or len(final) < 2: return None
    return final


# ── Generic helpers ───────────────────────────────────────────────
def _none(v):
    """Coerces NaN, '', 'nan', 'NaN', 'None' → None"""
    if v is None: return None
    if isinstance(v, float) and math.isnan(v): return None
    s = str(v).strip()
    if not s or s.lower() in ('nan', 'none', 'null'): return None
    return s

def _str(v):
    s = _none(v)
    if s is None: return None
    # If pandas read a numeric column as float and the value ends in '.0', strip it
    if s.endswith('.0') and s.replace('.', '').replace('-', '').isdigit():
        s = s[:-2]
    # Strip embedded '.0' after Indian-style 6-digit pincodes inside addresses
    s = re.sub(r'\b(\d{6})\.0\b', r'\1', s)
    return s

def _strip_apostrophe(v):
    """Shopify exports prefix string IDs with ' to force-string in Excel.
    Also strip trailing '.0' from phone/pincode read as floats by pandas."""
    s = _none(v)
    if s is None: return None
    s = s.lstrip("'")
    if s.endswith('.0'):
        s = s[:-2]
    return s

def _bool(v):
    """Handles 'True'/'False' string AND real bools AND 0/1."""
    if v is None: return False
    if isinstance(v, bool): return v
    if isinstance(v, (int, float)):
        if isinstance(v, float) and math.isnan(v): return False
        return bool(v)
    return str(v).strip().lower() == 'true'

def _int(v):
    s = _none(v)
    if s is None: return None
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None

def _float(v):
    s = _none(v)
    if s is None: return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None

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
        # Try ISO date
        if 'T' in s or ' ' in s:
            return datetime.fromisoformat(s.replace('Z', '+00:00').replace(' ', 'T'))
        return datetime.fromisoformat(s)
    except (ValueError, TypeError):
        try:
            return datetime.strptime(s, '%Y-%m-%d')
        except Exception:
            return None

def _json_obj(v):
    s = _none(v)
    if s is None: return None
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


# ── Transform functions ───────────────────────────────────────────
NOW = datetime.now(timezone.utc)
BATCH_ID = "tdb_founding_2026_05"
FREE_UNTIL = datetime(2027, 5, 15, tzinfo=timezone.utc)


def transform_parent(row: dict) -> dict:
    """Maps one row of tdb_enriched_customers.csv → pet_parents document."""
    # Clean pet_names array
    raw_pet_names = _split_array(row.get('pet_names'), sep="; ")
    cleaned_pet_names = []
    for raw in raw_pet_names:
        cleaned = clean_pet_name(raw)
        if cleaned:
            cleaned_pet_names.append(cleaned)
    # Dedupe in-order
    cleaned_pet_names = list(dict.fromkeys(cleaned_pet_names))

    # primary_pet_name follows the same rule
    primary = _str(row.get('primary_pet_name'))
    primary_clean = clean_pet_name(primary) if primary else None
    if not primary_clean and cleaned_pet_names:
        primary_clean = cleaned_pet_names[0]

    return {
        # Identity
        'customer_key': _strip_apostrophe(row.get('customer_key')),
        'email': _email(row.get('email')),
        'phone': _strip_apostrophe(row.get('phone')),
        'has_email': _bool(row.get('has_email')),
        'has_phone': _bool(row.get('has_phone')),
        'first_name': _str(row.get('first_name')),
        'last_name': _str(row.get('last_name')),

        # Address
        'address_line_1': _str(row.get('address_line_1')),
        'address_line_2': _str(row.get('address_line_2')),
        'city_raw': _str(row.get('city_raw')),
        'city': _str(row.get('city')),
        'state': _str(row.get('state')),
        'pincode': _str(row.get('pincode')),  # STRING, not int
        'country': _str(row.get('country')),
        'full_address': _str(row.get('full_address')),
        'address_quality': _str(row.get('address_quality')),

        # Pet snapshot (denormalised on parent)
        'pet_names_raw': _str(row.get('pet_names')),       # original "; "-string preserved
        'pet_names': cleaned_pet_names,                    # cleaned array
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

        # Food intelligence
        'proteins_ever_ordered': _split_array(row.get('proteins_ever_ordered')),
        'proteins_never_tried': _split_array(row.get('proteins_never_tried')),
        'favourite_protein': _str(row.get('favourite_protein')),
        'products_ordered': _split_array(row.get('products_ordered')),
        'allergens': _split_array(row.get('allergens')),
        'last_cake_flavour': _str(row.get('last_cake_flavour')),

        # Order metrics
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

        # Status / tier / risk
        'customer_status': _str(row.get('status')),
        'churn_risk': _str(row.get('churn_risk')),
        'loyalty_tier': _str(row.get('loyalty_tier')),

        # Occasions
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

        # Marketing flags
        'email_marketing_status': _str(row.get('email_marketing_status')),
        'sms_marketing_status': _str(row.get('sms_marketing_status')),
        'intelligence_tier': _str(row.get('intelligence_tier')),

        # Source
        'source': _str(row.get('source')),

        # ── Server-side fields (NOT in CSV) ──
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


def transform_pet(row: dict) -> dict:
    """Maps one row of tdb_pets_staging.csv → tdb_pets_staging document."""
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

        # Server-side
        'imported_at': NOW,
        'migration_status': 'staged',
        'migrated_to_pet_id': None,
        'migration_date': None,
        'import_batch_id': BATCH_ID,
    }


# ── JSON encoder for datetimes ────────────────────────────────────
class IsoEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        return super().default(o)


# ── Run dry transform on 5 random rows of each CSV ───────────────
print("=" * 78)
print("STEP 2 — DRY RUN (5 random rows × 2 CSVs)")
print("=" * 78)

parents_df = pd.read_csv(
    '/app/data/tdb_import/tdb_enriched_customers.csv',
    low_memory=False,
    dtype={
        'customer_key': str, 'phone': str, 'pincode': str,
        'shopify_customer_id': str, 'pet_birthday_year': 'Int64',
        'pet_birthday_month': 'Int64', 'pet_birthday_day': 'Int64',
    }
)
pets_df = pd.read_csv(
    '/app/data/tdb_import/tdb_pets_staging.csv',
    low_memory=False,
    dtype={
        'parent_customer_key': str, 'parent_phone': str,
        'birthday_year': 'Int64', 'birthday_month': 'Int64', 'birthday_day': 'Int64',
    }
)

# Use a fixed random seed so Dipali can re-verify if needed
parents_sample = parents_df.sample(5, random_state=1505).to_dict('records')
pets_sample = pets_df.sample(5, random_state=1505).to_dict('records')

print(f"\n📊 CSV row counts loaded:")
print(f"   tdb_enriched_customers.csv → {len(parents_df):,} rows (target 40,025)")
print(f"   tdb_pets_staging.csv       → {len(pets_df):,} rows (target 26,650)")
assert len(parents_df) == 40025, f"Expected 40025, got {len(parents_df)}"
assert len(pets_df) == 26650, f"Expected 26650, got {len(pets_df)}"
print("   ✅ Row counts match brief exactly")

print("\n" + "=" * 78)
print("⭐ pet_parents — 5 SAMPLE TRANSFORMED RECORDS")
print("=" * 78)
for i, r in enumerate(parents_sample, 1):
    doc = transform_parent(r)
    print(f"\n--- Record {i} ---")
    print(json.dumps(doc, indent=2, cls=IsoEncoder, ensure_ascii=False))

print("\n" + "=" * 78)
print("⭐ tdb_pets_staging — 5 SAMPLE TRANSFORMED RECORDS")
print("=" * 78)
for i, r in enumerate(pets_sample, 1):
    doc = transform_pet(r)
    print(f"\n--- Record {i} ---")
    print(json.dumps(doc, indent=2, cls=IsoEncoder, ensure_ascii=False))

print("\n" + "=" * 78)
print("✅ DRY RUN COMPLETE — No database writes performed.")
print("   Source CSVs untouched. Awaiting Dipali's ✅ before STEP 3.")
print("=" * 78)
