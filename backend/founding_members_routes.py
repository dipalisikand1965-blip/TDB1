"""
Founding Members Routes — TDB → TDC Founding Member Import & Admin
──────────────────────────────────────────────────────────────────
Imports the 44,097 TDB legacy customers from /tmp/tdb_import/customers_export.csv
into MongoDB collection `founding_members`, with city-based 10-day stagger
auto-assigned for the May 15 launch email campaign.

Build sequence (per instruction doc Apr 29 v3):
1. Phase 1 — base import (this file): contact + spend + city + token + send-date
2. Phase 1.5 — enrichment (separate script): pet_name, pet_birthday, allergens
   from Matrixify orders export

Endpoints:
  POST   /api/admin/founding-members/import-dry-run   — sample, no DB write
  POST   /api/admin/founding-members/import           — real insert (idempotent)
  GET    /api/admin/founding-members                  — paginated list + filters
  GET    /api/admin/founding-members/stats            — counts by status/city/tier
  GET    /api/admin/founding-members/{token}          — single record
  PATCH  /api/admin/founding-members/{token}          — inline edit
"""

import os
import re
import csv
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from admin_routes import verify_admin

logger = logging.getLogger(__name__)
founding_members_router = APIRouter(tags=["Founding Members"])

# Database reference (set from server.py)
db: AsyncIOMotorDatabase = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════

CUSTOMERS_CSV = os.environ.get(
    "FOUNDING_MEMBERS_CSV",
    "/tmp/tdb_import/customers_export.csv",
)

# Soft-launch May 14 — 10 named/criteria-matched records get the email one day early
SOFT_LAUNCH_NAMES = {
    # (first_name_lower, last_name_starts_with) → reason
    ("balaji", "c"): "highest_spender",
    ("navya", ""): "tester_cult_gym",
    ("shirley", ""): "tester_six_dogs",
    ("shreesha", ""): "six_dogs_merged",
}

# Cities that get top-2-spender soft-launch slots
SOFT_LAUNCH_TOP_CITIES = ["Mumbai", "Bangalore"]

# 10-day city stagger plan (from /tmp/tdb_import/audit.py)
CITY_STAGGER = {
    # Date → list of cities sent that day
    "2026-05-15": ["Mumbai"],
    "2026-05-16": ["Bangalore"],
    "2026-05-17": ["Delhi"],
    "2026-05-18": ["Chennai", "Hyderabad"],
    "2026-05-19": ["Pune", "Kolkata"],
    "2026-05-20": ["Ahmedabad", "Jaipur", "Kochi", "Goa"],
    "2026-05-21": ["Coimbatore", "Mysore", "Mangalore", "Lucknow", "Chandigarh"],
    "2026-05-22": ["Indore", "Bhopal", "Nagpur", "Visakhapatnam", "Thiruvananthapuram"],
    # 23 = other named cities, 24 = no city / unreachable
}
CITY_TO_DATE = {
    city: date for date, cities in CITY_STAGGER.items() for city in cities
}
DATE_OTHER = "2026-05-23"
DATE_NO_CITY = "2026-05-24"
DATE_SOFT_LAUNCH = "2026-05-14"

# Free-until anniversary: 1 year
FREE_UNTIL = "2027-05-15"

# City normaliser (mirrors /tmp/tdb_import/audit.py)
CITY_MAP_RAW = {
    'bangalore': ['bangalore', 'bengaluru', 'blr', 'banglore', 'bangaluru', 'banglaore', 'bengalore', 'bengluru', 'bnglr', 'bengalore.', 'bengaluru rural', 'bangalore rural'],
    'mumbai': ['mumbai', 'bombay', 'mum', 'mumbai metro', 'borivali', 'borivali west', 'borivali east', 'andheri', 'andheri west', 'andheri east', 'bandra', 'bandra west', 'bandra east', 'goregaon', 'goregaon west', 'goregaon east', 'mulund', 'mulund west', 'mulund east', 'kandivali', 'kandivali west', 'malad', 'malad west', 'powai', 'chembur', 'lower parel', 'parel', 'worli', 'colaba', 'mahim', 'dadar', 'matunga', 'sion', 'kurla', 'ghatkopar', 'vikhroli', 'bhandup', 'thane', 'thane west', 'thane east', 'navi mumbai', 'vashi', 'nerul', 'kharghar', 'panvel', 'belapur', 'airoli', 'ghansoli', 'kopar khairane', 'navi-mumbai', 'navimumbai'],
    'delhi': ['delhi', 'new delhi', 'newdelhi', 'south delhi', 'north delhi', 'east delhi', 'west delhi', 'central delhi', 'old delhi', 'delhi ncr', 'gurgaon', 'gurugram', 'gurgoan', 'noida', 'noida extension', 'greater noida', 'ghaziabad', 'faridabad'],
    'chennai': ['chennai', 'madras', 'chennaii', 'chenai', 'chennai metro'],
    'hyderabad': ['hyderabad', 'secunderabad', 'hyd', 'hydrabad', 'hyderbad', 'hyderebad'],
    'pune': ['pune', 'puna', 'pimpri', 'pimpri chinchwad', 'pimpri-chinchwad', 'chinchwad'],
    'kolkata': ['kolkata', 'calcutta', 'kolkatta', 'salt lake'],
    'ahmedabad': ['ahmedabad', 'amdavad', 'ahmadabad'],
    'jaipur': ['jaipur'],
    'kochi': ['kochi', 'cochin', 'ernakulam'],
    'coimbatore': ['coimbatore', 'kovai'],
    'lucknow': ['lucknow'],
    'chandigarh': ['chandigarh', 'mohali', 'panchkula'],
    'indore': ['indore'],
    'bhopal': ['bhopal'],
    'nagpur': ['nagpur'],
    'goa': ['goa', 'panaji', 'panjim', 'margao', 'mapusa', 'porvorim'],
    'mysore': ['mysore', 'mysuru'],
    'mangalore': ['mangalore', 'mangaluru'],
    'visakhapatnam': ['visakhapatnam', 'vizag'],
    'thiruvananthapuram': ['thiruvananthapuram', 'trivandrum'],
}
CITY_LOOKUP = {
    v.lower().strip(): canonical.title()
    for canonical, variants in CITY_MAP_RAW.items()
    for v in variants
}


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

def normalize_city(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    cleaned = re.sub(r'[^a-z\s-]', '', raw.lower().strip())
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned:
        return None
    if cleaned in CITY_LOOKUP:
        return CITY_LOOKUP[cleaned]
    first_word = cleaned.split(' ')[0]
    if first_word in CITY_LOOKUP:
        return CITY_LOOKUP[first_word]
    return raw.strip().title() if len(raw.strip()) > 1 else None


def clean_phone(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    digits = re.sub(r'[^0-9]', '', str(raw))
    if len(digits) == 10:
        return '91' + digits
    if len(digits) == 12 and digits.startswith('91'):
        return digits
    if len(digits) == 11 and digits.startswith('0'):
        return '91' + digits[1:]
    return digits if len(digits) >= 10 else None


def clean_email(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    e = raw.strip().lower()
    if '@' not in e or '.' not in e.split('@')[-1]:
        return None
    return e


def assign_send_date(city: Optional[str], reachable_email: bool) -> str:
    """
    Returns the YYYY-MM-DD string the launch email should go out on.
    Mumbai → 5/15, Bangalore → 5/16, ... unreachable → 5/24.
    """
    if not reachable_email:
        return DATE_NO_CITY
    if city and city in CITY_TO_DATE:
        return CITY_TO_DATE[city]
    if city:
        return DATE_OTHER
    return DATE_NO_CITY


def parse_csv_records() -> List[Dict[str, Any]]:
    """Reads the customers CSV and returns a list of normalised records."""
    if not os.path.exists(CUSTOMERS_CSV):
        raise HTTPException(
            status_code=400,
            detail=f"customers_export.csv not found at {CUSTOMERS_CSV}",
        )
    records = []
    with open(CUSTOMERS_CSV, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            cid = (row.get('Customer ID') or '').lstrip("'").strip()
            if not cid:
                continue
            email = clean_email(row.get('Email'))
            phone = clean_phone(row.get('Phone') or row.get('Default Address Phone'))
            city_raw = (row.get('Default Address City') or '').strip()
            city = normalize_city(city_raw)
            try:
                spent = float((row.get('Total Spent') or '0').replace(',', ''))
            except (ValueError, AttributeError):
                spent = 0.0
            try:
                orders = int(row.get('Total Orders') or 0)
            except (ValueError, TypeError):
                orders = 0
            accepts_email = (row.get('Accepts Email Marketing') or '').lower() == 'yes'
            accepts_sms = (row.get('Accepts SMS Marketing') or '').lower() == 'yes'
            first_name = (row.get('First Name') or '').strip()
            last_name = (row.get('Last Name') or '').strip()

            records.append({
                'shopify_customer_id': cid,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'city': city,
                'city_raw': city_raw,
                'state': (row.get('Default Address Province Code') or '').strip(),
                'zip': (row.get('Default Address Zip') or '').strip(),
                'address1': (row.get('Default Address Address1') or '').strip(),
                'total_spent_inr': spent,
                'orders_count': orders,
                'accepts_email_marketing': accepts_email,
                'accepts_sms_marketing': accepts_sms,
                'tags': (row.get('Tags') or '').strip(),
                'reachable': {
                    'email': bool(email),
                    'whatsapp': bool(phone),
                },
            })
    return records


def pick_soft_launch_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Returns the records that should be flagged soft_launch=true:
      - 4 named individuals (Balaji C., Navya, Shirley, Shreesha)
      - Top-2 spenders from Mumbai
      - Top-2 spenders from Bangalore
    Total ≈ 8 (some overlap may shrink to 6-8). Per instructions doc Apr 29 v3.
    """
    soft_launch = {}  # key=email or shopify_id → record

    # Named matches
    for rec in records:
        fn = (rec['first_name'] or '').lower().strip()
        ln = (rec['last_name'] or '').lower().strip()
        for (target_fn, target_ln_prefix), reason in SOFT_LAUNCH_NAMES.items():
            if fn == target_fn and (
                not target_ln_prefix or ln.startswith(target_ln_prefix)
            ):
                key = rec['email'] or rec['shopify_customer_id']
                if key not in soft_launch:
                    soft_launch[key] = {**rec, '_soft_launch_reason': reason}

    # Top-2 spenders per soft-launch city
    for city in SOFT_LAUNCH_TOP_CITIES:
        in_city = sorted(
            [r for r in records if r['city'] == city and r['reachable']['email']],
            key=lambda r: -r['total_spent_inr'],
        )
        for r in in_city[:2]:
            key = r['email'] or r['shopify_customer_id']
            if key not in soft_launch:
                soft_launch[key] = {**r, '_soft_launch_reason': f'top_spender_{city.lower()}'}

    return list(soft_launch.values())


def build_founding_member_doc(rec: Dict[str, Any], soft_launch_keys: set) -> Dict[str, Any]:
    """Builds the MongoDB doc for one founding-member record."""
    key = rec['email'] or rec['shopify_customer_id']
    is_soft = key in soft_launch_keys
    send_date = (
        DATE_SOFT_LAUNCH if is_soft
        else assign_send_date(rec['city'], rec['reachable']['email'])
    )
    return {
        # identity
        'shopify_customer_id': rec['shopify_customer_id'],
        'email': rec['email'],
        'phone': rec['phone'],
        'first_name': rec['first_name'],
        'last_name': rec['last_name'],
        # location
        'city': rec['city'],
        'city_raw': rec['city_raw'],
        'state': rec['state'],
        'zip': rec['zip'],
        'address1': rec['address1'],
        # commerce
        'total_spent_inr': rec['total_spent_inr'],
        'orders_count': rec['orders_count'],
        'accepts_email_marketing': rec['accepts_email_marketing'],
        'accepts_sms_marketing': rec['accepts_sms_marketing'],
        'tags': rec['tags'],
        'reachable': rec['reachable'],
        # enrichment slots (filled by Phase 1.5 matrixify enrichment)
        'pet_name': None,
        'pet_birthday': None,  # {month, day}
        'pet_age_signal': None,
        'known_allergens': [],
        'top_product': None,
        'first_order_date': None,
        'last_order_date': None,
        # founding-member tier (from instructions doc Apr 29 v3)
        'tier': 'founding_member',
        'membership': 'pet_pass_full',
        'free_until': FREE_UNTIL,
        'founding_discount_forever': True,
        'source': 'tdb_founding_member',
        # campaign state
        'soft_launch': is_soft,
        'assigned_send_date': send_date,
        'status': 'imported_pending_invite',
        'activated_user_id': None,
        # email/whatsapp lifecycle (filled later)
        'email_sent_at': None,
        'email_resend_id': None,
        'email_opened_at': None,
        'email_clicked_at': None,
        'whatsapp_sent_at': None,
        # audit
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════

class ImportRequest(BaseModel):
    confirm: bool = Field(default=False, description="Must be true to actually write to DB")
    csv_path: Optional[str] = None


class FoundingMemberPatch(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    pet_name: Optional[str] = None
    pet_birthday: Optional[Dict[str, int]] = None
    known_allergens: Optional[List[str]] = None
    assigned_send_date: Optional[str] = None
    soft_launch: Optional[bool] = None
    status: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@founding_members_router.post("/api/admin/founding-members/import-dry-run")
async def dry_run(_admin: bool = Depends(verify_admin)):
    """
    Reads customers_export.csv, simulates the import, returns counts +
    a sample of 30 records (10 VIP / 10 mid / 10 standard) + soft-launch list.
    NO DATABASE WRITES.
    """
    records = parse_csv_records()
    soft_launch_recs = pick_soft_launch_records(records)
    soft_launch_keys = {
        (r['email'] or r['shopify_customer_id']) for r in soft_launch_recs
    }

    docs = [build_founding_member_doc(r, soft_launch_keys) for r in records]

    # Stats
    total = len(docs)
    n_email = sum(1 for d in docs if d['reachable']['email'])
    n_phone = sum(1 for d in docs if d['reachable']['whatsapp'])
    n_both = sum(1 for d in docs if d['reachable']['email'] and d['reachable']['whatsapp'])
    n_neither = sum(1 for d in docs if not d['reachable']['email'] and not d['reachable']['whatsapp'])

    vips = [d for d in docs if d['total_spent_inr'] >= 20000]
    mid = [d for d in docs if 5000 <= d['total_spent_inr'] < 20000]
    std = [d for d in docs if d['total_spent_inr'] < 5000]

    # City counts
    from collections import Counter
    city_counts = Counter(d['city'] for d in docs if d['city'])
    top_cities = city_counts.most_common(15)

    # Send-date stagger preview
    date_counts = Counter(d['assigned_send_date'] for d in docs)

    # Sort each tier by spend desc for sample
    vips_sample = sorted(vips, key=lambda d: -d['total_spent_inr'])[:10]
    mid_sample = sorted(mid, key=lambda d: -d['total_spent_inr'])[:10]
    std_sample = sorted(std, key=lambda d: -d['total_spent_inr'])[:10]

    def _strip(d):
        # Only return human-friendly fields for the preview
        return {
            'first_name': d['first_name'],
            'last_name': d['last_name'],
            'email': d['email'],
            'phone': d['phone'],
            'city': d['city'],
            'total_spent_inr': d['total_spent_inr'],
            'orders_count': d['orders_count'],
            'reachable': d['reachable'],
            'soft_launch': d['soft_launch'],
            'assigned_send_date': d['assigned_send_date'],
            'tier': d['tier'],
            'free_until': d['free_until'],
        }

    return {
        'dry_run': True,
        'csv_path': CUSTOMERS_CSV,
        'total_records': total,
        'reachability': {
            'email': n_email,
            'whatsapp': n_phone,
            'both': n_both,
            'unreachable': n_neither,
        },
        'tier_counts': {
            'diamond_vip_20k_plus': len(vips),
            'gold_5k_to_20k': len(mid),
            'standard_under_5k': len(std),
        },
        'top_cities': [
            {'city': c, 'count': n} for c, n in top_cities
        ],
        'send_date_stagger': [
            {'date': dt, 'count': n}
            for dt, n in sorted(date_counts.items())
        ],
        'soft_launch': {
            'count': len(soft_launch_recs),
            'records': [
                {
                    'first_name': r['first_name'],
                    'last_name': r['last_name'],
                    'email': r['email'],
                    'city': r['city'],
                    'total_spent_inr': r['total_spent_inr'],
                    'reason': r.get('_soft_launch_reason'),
                }
                for r in soft_launch_recs
            ],
        },
        'samples': {
            'diamond_vip': [_strip(d) for d in vips_sample],
            'gold_mid': [_strip(d) for d in mid_sample],
            'standard': [_strip(d) for d in std_sample],
        },
    }


@founding_members_router.post("/api/admin/founding-members/import")
async def real_import(
    body: ImportRequest = Body(...),
    _admin: bool = Depends(verify_admin),
):
    """
    Real import. Idempotent — upserts on email (falls back to shopify_customer_id).
    Generates invite_token only on insert (preserves it on re-runs).
    """
    if not body.confirm:
        raise HTTPException(
            status_code=400,
            detail="Set confirm=true to actually write to DB. Run import-dry-run first.",
        )

    global CUSTOMERS_CSV
    if body.csv_path:
        CUSTOMERS_CSV = body.csv_path

    records = parse_csv_records()
    soft_launch_recs = pick_soft_launch_records(records)
    soft_launch_keys = {
        (r['email'] or r['shopify_customer_id']) for r in soft_launch_recs
    }

    inserted = 0
    updated = 0
    skipped = 0

    # Ensure indexes (idempotent)
    await db.founding_members.create_index("email", sparse=True)
    await db.founding_members.create_index("invite_token", unique=True, sparse=True)
    await db.founding_members.create_index("shopify_customer_id", unique=True, sparse=True)
    await db.founding_members.create_index("assigned_send_date")
    await db.founding_members.create_index("status")
    await db.founding_members.create_index("city")
    await db.founding_members.create_index("total_spent_inr")
    await db.founding_members.create_index("soft_launch")

    now = datetime.now(timezone.utc).isoformat()

    for rec in records:
        if not rec['shopify_customer_id']:
            skipped += 1
            continue
        doc = build_founding_member_doc(rec, soft_launch_keys)

        # Upsert key: email if present, else shopify_customer_id
        if doc['email']:
            filter_q = {'email': doc['email']}
        else:
            filter_q = {'shopify_customer_id': doc['shopify_customer_id']}

        # $setOnInsert: invite_token + created_at — preserved across re-runs
        # $set: everything else — refreshed each run
        on_insert = {
            'invite_token': secrets.token_urlsafe(24),
            'created_at': now,
        }
        set_fields = {k: v for k, v in doc.items() if k not in ('invite_token', 'created_at')}
        set_fields['updated_at'] = now

        result = await db.founding_members.update_one(
            filter_q,
            {'$setOnInsert': on_insert, '$set': set_fields},
            upsert=True,
        )
        if result.upserted_id:
            inserted += 1
        elif result.matched_count:
            updated += 1

    # Persist run metadata
    await db.founding_member_import_runs.insert_one({
        'run_at': now,
        'csv_path': CUSTOMERS_CSV,
        'total_csv_rows': len(records),
        'inserted': inserted,
        'updated': updated,
        'skipped': skipped,
        'soft_launch_count': len(soft_launch_recs),
    })

    return {
        'success': True,
        'csv_path': CUSTOMERS_CSV,
        'total_csv_rows': len(records),
        'inserted': inserted,
        'updated': updated,
        'skipped': skipped,
        'soft_launch_count': len(soft_launch_recs),
        'run_at': now,
    }


@founding_members_router.get("/api/admin/founding-members")
async def list_founding_members(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    city: Optional[str] = None,
    tier: Optional[str] = None,
    status: Optional[str] = None,
    soft_launch: Optional[bool] = None,
    has_email: Optional[bool] = None,
    has_phone: Optional[bool] = None,
    spend_min: Optional[float] = None,
    assigned_send_date: Optional[str] = None,
    sort_by: str = Query('total_spent_inr', regex='^(total_spent_inr|orders_count|first_name|created_at|assigned_send_date)$'),
    sort_dir: int = Query(-1, ge=-1, le=1),
    _admin: bool = Depends(verify_admin),
):
    q: Dict[str, Any] = {}
    if search:
        rx = re.escape(search.strip())
        q['$or'] = [
            {'first_name': {'$regex': rx, '$options': 'i'}},
            {'last_name': {'$regex': rx, '$options': 'i'}},
            {'email': {'$regex': rx, '$options': 'i'}},
            {'phone': {'$regex': rx, '$options': 'i'}},
            {'pet_name': {'$regex': rx, '$options': 'i'}},
        ]
    if city:
        q['city'] = city
    if tier:
        q['tier'] = tier
    if status:
        q['status'] = status
    if soft_launch is not None:
        q['soft_launch'] = soft_launch
    if has_email is True:
        q['email'] = {'$ne': None}
    elif has_email is False:
        q['email'] = None
    if has_phone is True:
        q['phone'] = {'$ne': None}
    elif has_phone is False:
        q['phone'] = None
    if spend_min is not None:
        q['total_spent_inr'] = {'$gte': spend_min}
    if assigned_send_date:
        q['assigned_send_date'] = assigned_send_date

    total = await db.founding_members.count_documents(q)
    cursor = (
        db.founding_members
        .find(q, {'_id': 0})
        .sort(sort_by, sort_dir if sort_dir != 0 else -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = await cursor.to_list(page_size)
    return {
        'total': total,
        'page': page,
        'page_size': page_size,
        'items': items,
    }


@founding_members_router.get("/api/admin/founding-members/stats")
async def stats(_admin: bool = Depends(verify_admin)):
    total = await db.founding_members.count_documents({})
    if total == 0:
        return {'total': 0, 'imported': False}

    pipeline_status = [{'$group': {'_id': '$status', 'n': {'$sum': 1}}}]
    pipeline_city = [
        {'$match': {'city': {'$ne': None}}},
        {'$group': {'_id': '$city', 'n': {'$sum': 1}}},
        {'$sort': {'n': -1}},
        {'$limit': 15},
    ]
    pipeline_send_date = [
        {'$group': {'_id': '$assigned_send_date', 'n': {'$sum': 1}}},
        {'$sort': {'_id': 1}},
    ]

    by_status = {d['_id']: d['n'] async for d in db.founding_members.aggregate(pipeline_status)}
    by_city = [{'city': d['_id'], 'count': d['n']} async for d in db.founding_members.aggregate(pipeline_city)]
    by_send_date = [{'date': d['_id'], 'count': d['n']} async for d in db.founding_members.aggregate(pipeline_send_date)]

    soft_launch_count = await db.founding_members.count_documents({'soft_launch': True})
    n_email = await db.founding_members.count_documents({'email': {'$ne': None}})
    n_phone = await db.founding_members.count_documents({'phone': {'$ne': None}})
    n_pet_name = await db.founding_members.count_documents({'pet_name': {'$ne': None}})
    n_birthday = await db.founding_members.count_documents({'pet_birthday': {'$ne': None}})
    n_allergens = await db.founding_members.count_documents({'known_allergens.0': {'$exists': True}})
    n_vip = await db.founding_members.count_documents({'total_spent_inr': {'$gte': 20000}})

    last_run = await db.founding_member_import_runs.find_one(
        {}, {'_id': 0}, sort=[('run_at', -1)]
    )

    return {
        'imported': True,
        'total': total,
        'reachable': {'email': n_email, 'whatsapp': n_phone},
        'enriched': {
            'pet_name': n_pet_name,
            'pet_birthday': n_birthday,
            'known_allergens': n_allergens,
        },
        'soft_launch_count': soft_launch_count,
        'vip_20k_plus': n_vip,
        'by_status': by_status,
        'by_city_top15': by_city,
        'by_send_date': by_send_date,
        'last_import_run': last_run,
    }


@founding_members_router.get("/api/admin/founding-members/{token}")
async def get_one(token: str, _admin: bool = Depends(verify_admin)):
    doc = await db.founding_members.find_one({'invite_token': token}, {'_id': 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Founding member not found")
    return doc


@founding_members_router.patch("/api/admin/founding-members/{token}")
async def patch_one(
    token: str,
    patch: FoundingMemberPatch,
    _admin: bool = Depends(verify_admin),
):
    updates = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.founding_members.update_one(
        {'invite_token': token},
        {'$set': updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Founding member not found")
    doc = await db.founding_members.find_one({'invite_token': token}, {'_id': 0})
    return doc
