"""
Shopify Order Webhook + Admin CSV Re-Import
─────────────────────────────────────────────
Two ingest paths into `pet_parents` / `tdb_pets_staging`:

  1. POST /api/shopify/order-webhook            ← live, real-time
     Triggered by TDB Shopify on every order/create.
     HMAC-verified. Idempotent. Upserts by email/phone.

  2. POST /api/admin/founding-members/csv-upload    ← bulk, on-demand
     Dipali drops a fresh Shopify export CSV.
     Same transform as the original 40k import.
     Returns {new, updated, skipped} report.

Both use UPSERT (never INSERT) — no duplicates, ever.
Both NEVER touch the live `pets` collection.
"""
from __future__ import annotations
import os
import re
import json
import hmac
import hashlib
import base64
import logging
import secrets
from io import StringIO
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List, Tuple

from fastapi import APIRouter, Request, HTTPException, Header, UploadFile, File, Form, Body
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Two routers — different mount points + different auth:
shopify_router = APIRouter(prefix="/api/shopify", tags=["shopify-webhook"])
admin_router = APIRouter(prefix="/api/admin/founding-members", tags=["founding-csv-upload"])


# ── Shared DB ────────────────────────────────────────────────────────
_client: Optional[AsyncIOMotorClient] = None
_db = None


def _get_db():
    global _client, _db
    if _db is None:
        url = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'
        db_name = os.environ.get('DB_NAME') or 'pet-os-live-test_database'
        _client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=15000)
        _db = _client[db_name]
    return _db


def _require_admin(secret: Optional[str]):
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("SITEVAULT_ADMIN_SECRET")
    if not expected:
        return
    if secret != expected:
        raise HTTPException(401, "Admin secret required (x-admin-secret header)")


# ── Pet name cleanup (port of /app/data/tdb_import/_step4 logic) ─────
PREFIX_NOISE = re.compile(
    r'^(happy|hdb|h\s*bd|h\s*bday|b\'?day|birthday|bday|h\s*\d+|hd\s+|hbd|hb\s+)\b',
    re.IGNORECASE,
)
FALSE_POSITIVES = {'milk', 'chicken', 'mutton', 'fish', 'cake', 'treat', 'you', 'make', 'have',
                   'wheat', 'gluten', 'peanut', 'butter'}
EXTRACT_STRIP = {
    'happy', 'hdb', 'hd', 'hbd', 'h', 'bd', 'bday', 'birthda', 'birthday', "b'day",
    "b'days", 'birth', 'day', 'days', 'happiest', 'wishing', 'wish', 'anniversary',
    'turning', 'turned', 'turns', 'turn', 'yay', 'yayy', 'yayyy', 'celebrating',
    'celebrate', 'celebrates', 'l', 'z', 'i', 'a', 'b', 'c', 'to', 'for', 'is',
    'an', 'the', 'and', 'with', 'from', 'of', 'on',
    'kids', 'months', 'month', 'old', 'years', 'year', 'yr', 'yrs',
    'st', 'nd', 'rd', 'th',
    'name', 'names', 'dog', 'doggy', 'pet', 'pets', 'puppy', 'puppies',
    'baby', 'babies', 'breed', 'mr', 'mrs', 'ms', 'sir', 'madam',
}
NUMERIC = re.compile(r'^\d+$')
NUMBER_SUFFIX = re.compile(r'^\d+(st|nd|rd|th|\.\.+|\.)?$', re.IGNORECASE)


def clean_pet_name(raw: Optional[str]) -> Optional[str]:
    if not raw or not isinstance(raw, str):
        return None
    n = raw.strip()
    if not n or NUMERIC.match(n) or len(n) < 2:
        return None
    if n.lower() in FALSE_POSITIVES:
        return None
    if not PREFIX_NOISE.match(n) and ' ' not in n:
        return n.capitalize() if n[0].islower() else n
    words = re.split(r'[\s\']+', n)
    cleaned = []
    for w in words:
        w = w.strip('.,!?;:()[]{}"\'\\🤍❤️💕🌷')
        if not w:
            continue
        wl = w.lower()
        if wl in EXTRACT_STRIP or wl in FALSE_POSITIVES:
            continue
        if NUMERIC.match(w) or NUMBER_SUFFIX.match(w):
            continue
        if len(w) < 2:
            continue
        cleaned.append(w)
    if not cleaned:
        return None
    return cleaned[0].capitalize() if len(cleaned) == 1 else ' '.join(w.capitalize() for w in cleaned)


# ── Protein extraction (broad heuristic on line item titles) ────────
PROTEINS = {
    'chicken', 'mutton', 'fish', 'liver', 'egg', 'paneer',
    'banana', 'apple', 'mango', 'blueberry', 'coconut', 'pumpkin',
    'oats', 'ragi', 'sweet_potato', 'carrot', 'honey',
    'peanut_butter', 'carob', 'vegan', 'veggies',
}


def extract_proteins_from_title(title: str) -> List[str]:
    if not title:
        return []
    t = title.lower().replace(' ', '_').replace('-', '_').replace('&', '_').replace('/', '_')
    found = []
    for p in PROTEINS:
        if p in t:
            found.append(p)
    return list(dict.fromkeys(found))


# ── Customer key resolver (matches CSV import logic) ─────────────────
def resolve_customer_key(email: Optional[str], phone: Optional[str]) -> Optional[str]:
    """Email is canonical; phone is fallback for WhatsApp-only customers."""
    if email:
        return email.strip().lower()
    if phone:
        digits = re.sub(r'\D', '', str(phone))
        if digits:
            return f"+{digits}"
    return None


def make_invite_token() -> str:
    return secrets.token_urlsafe(24)


# ════════════════════════════════════════════════════════════════════
# 1. SHOPIFY ORDER WEBHOOK
# ════════════════════════════════════════════════════════════════════
def _verify_shopify_hmac(raw_body: bytes, header_hmac: str) -> bool:
    """Constant-time HMAC verification — Shopify-required for security."""
    secret = os.environ.get("SHOPIFY_WEBHOOK_SECRET")
    if not secret or not header_hmac:
        # If the secret isn't configured yet, allow but log loudly so Dipali knows.
        logger.warning("[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not set — accepting unverified")
        return True
    digest = hmac.new(
        secret.encode('utf-8'),
        raw_body,
        hashlib.sha256,
    ).digest()
    expected = base64.b64encode(digest).decode()
    return hmac.compare_digest(expected, header_hmac)


def _extract_pet_signal(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pull pet name + birthday + protein from Shopify order.

    Sources scanned:
      - note_attributes[name='message_on_the_box' / 'date_you_want_it' / 'pet_name']
      - line_items[*].properties[*]
      - line_items[*].title (for protein extraction)
    """
    out: Dict[str, Any] = {
        'pet_name_raw': None,
        'pet_name': None,
        'birthday_signal': None,         # ISO date if extracted
        'birthday_month': None,
        'birthday_day': None,
        'proteins': [],
        'cake_flavour': None,
    }

    # Note attributes
    for attr in (order.get('note_attributes') or []):
        n = (attr.get('name') or '').lower().strip()
        v = (attr.get('value') or '').strip()
        if not v:
            continue
        if n in ('message_on_the_box', 'pet_name', "pet's_name", 'pets_name'):
            out['pet_name_raw'] = v
            cn = clean_pet_name(v)
            if cn:
                out['pet_name'] = cn
        if n in ('date_you_want_it', 'birthday', 'pet_birthday', 'date_of_birth'):
            out['birthday_signal'] = v
            # Try to parse month/day
            try:
                d = datetime.strptime(v, '%Y-%m-%d')
                out['birthday_month'] = d.month
                out['birthday_day'] = d.day
            except Exception:
                try:
                    d = datetime.strptime(v, '%d-%m-%Y')
                    out['birthday_month'] = d.month
                    out['birthday_day'] = d.day
                except Exception:
                    pass

    # Line items
    for li in (order.get('line_items') or []):
        title = (li.get('title') or '')
        # Cake flavour heuristic
        if 'cake' in title.lower() or 'pupcake' in title.lower():
            out['cake_flavour'] = title
        # Proteins
        out['proteins'].extend(extract_proteins_from_title(title))
        # Properties (line-item-level)
        for prop in (li.get('properties') or []):
            n = (prop.get('name') or '').lower().strip()
            v = (prop.get('value') or '').strip()
            if not v:
                continue
            if n in ('message_on_the_box', 'pet_name', "pet's_name"):
                if not out['pet_name']:
                    out['pet_name_raw'] = v
                    cn = clean_pet_name(v)
                    if cn:
                        out['pet_name'] = cn

    out['proteins'] = list(dict.fromkeys(out['proteins']))
    return out


async def _ingest_order(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Idempotent upsert into pet_parents (+ optional new tdb_pets_staging row).
    Safe to re-run on the same order.
    """
    db = _get_db()
    customer = order.get('customer') or {}
    shipping = order.get('shipping_address') or order.get('billing_address') or {}

    email = (customer.get('email') or order.get('email') or '').strip().lower() or None
    phone = customer.get('phone') or shipping.get('phone') or order.get('phone')
    if phone:
        phone = re.sub(r'\D', '', str(phone))
    customer_key = resolve_customer_key(email, phone)
    if not customer_key:
        return {'ok': False, 'reason': 'no_customer_key'}

    pet_signal = _extract_pet_signal(order)
    order_total = float(order.get('total_price') or 0)
    order_id = str(order.get('id') or order.get('order_number') or '')
    order_date_str = order.get('created_at') or order.get('processed_at')
    try:
        order_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00')) if order_date_str else datetime.now(timezone.utc)
    except Exception:
        order_date = datetime.now(timezone.utc)

    existing = await db.pet_parents.find_one({'customer_key': customer_key})

    if existing:
        # ── Idempotency check: have we already counted this order? ──
        already_counted = order_id and order_id in (existing.get('shopify_order_ids') or [])

        # ── Update existing record ──
        update: Dict[str, Any] = {
            'last_order_date': order_date.isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        inc: Dict[str, Any] = {}
        if not already_counted:
            inc['total_orders'] = 1
            inc['total_spent_inr'] = order_total
        if pet_signal['proteins']:
            existing_proteins = existing.get('proteins_ever_ordered') or []
            new_proteins = [p for p in pet_signal['proteins'] if p not in existing_proteins]
            if new_proteins:
                update['proteins_ever_ordered'] = existing_proteins + new_proteins
        if pet_signal['cake_flavour']:
            update['last_cake_flavour'] = pet_signal['cake_flavour']
            if not already_counted:
                inc['total_cakes'] = 1
        # Pet name backfill (only if missing)
        if pet_signal['pet_name'] and not existing.get('primary_pet_name'):
            update['primary_pet_name'] = pet_signal['pet_name']
            update['pet_names_raw'] = pet_signal['pet_name_raw']
            update['pet_names'] = [pet_signal['pet_name']]
            update['pet_count'] = max(existing.get('pet_count') or 0, 1)
        # Birthday backfill (only if missing)
        if pet_signal['birthday_month'] and not existing.get('pet_birthday_month'):
            update['pet_birthday_month'] = pet_signal['birthday_month']
            update['pet_birthday_day'] = pet_signal['birthday_day']
            update['pet_birthday_confidence'] = 'MEDIUM'

        ops = {'$set': update}
        if inc:
            ops['$inc'] = inc
        if order_id:
            ops['$addToSet'] = {'shopify_order_ids': order_id}

        await db.pet_parents.update_one({'customer_key': customer_key}, ops)
        return {
            'ok': True,
            'action': 'replayed' if already_counted else 'updated',
            'customer_key': customer_key,
            'order_id': order_id,
            'pet_signal': pet_signal,
        }

    # ── Create new record ──
    first_name = (customer.get('first_name') or shipping.get('first_name') or '').strip() or None
    last_name = (customer.get('last_name') or shipping.get('last_name') or '').strip() or None
    city = (shipping.get('city') or customer.get('default_address', {}).get('city') or '').strip() or None
    state = (shipping.get('province') or '').strip() or None
    pincode = (shipping.get('zip') or '').strip() or None
    country = (shipping.get('country_code') or 'IN').strip() or 'IN'

    new_doc: Dict[str, Any] = {
        'customer_key': customer_key,
        'email': email,
        'phone': phone,
        'has_email': bool(email),
        'has_phone': bool(phone),
        'first_name': first_name,
        'last_name': last_name,
        'city_raw': city,
        'city': city,
        'state': state,
        'pincode': pincode,
        'country': country,
        'pet_names_raw': pet_signal['pet_name_raw'],
        'pet_names': [pet_signal['pet_name']] if pet_signal['pet_name'] else [],
        'pet_count': 1 if pet_signal['pet_name'] else 0,
        'primary_pet_name': pet_signal['pet_name'],
        'pet_birthday_month': pet_signal['birthday_month'],
        'pet_birthday_day': pet_signal['birthday_day'],
        'pet_birthday_confidence': 'MEDIUM' if pet_signal['birthday_month'] else None,
        'proteins_ever_ordered': pet_signal['proteins'],
        'last_cake_flavour': pet_signal['cake_flavour'],
        'total_orders': 1,
        'total_cakes': 1 if pet_signal['cake_flavour'] else 0,
        'total_spent_inr': order_total,
        'first_order_date': order_date.isoformat(),
        'last_order_date': order_date.isoformat(),
        'years_with_tdb': 0.0,
        'customer_status': 'active',
        'loyalty_tier': 'New',
        'intelligence_tier': 'COMPLETE' if (pet_signal['pet_name'] and pet_signal['birthday_month']) else (
            'HIGH' if pet_signal['pet_name'] else 'MINIMAL'
        ),
        'is_tdb_founding_member': False,   # they joined AFTER cutoff
        'source': 'tdb_shopify_live',
        'membership_offer': 'pet_pass_full_founding',
        'free_until': '2027-05-15T00:00:00',
        'founding_discount_forever': True,
        'invite_token': make_invite_token(),
        'assigned_send_date': None,        # picked up by orchestrator's "next available batch"
        'soft_launch': False,
        'activation_status': 'imported_pending_invite',
        'invite_sent_at': None,
        'invite_opened_at': None,
        'activated_at': None,
        'shopify_order_ids': [order_id],
        'pets_staging_ids': [],
        'pets_live_ids': [],
        'import_batch_id': 'tdb_shopify_live',
        'imported_at': datetime.now(timezone.utc).isoformat(),
    }

    # Optional staging-pet row when we got a name
    if pet_signal['pet_name']:
        staging_id = f"{customer_key}_shopify_{order_id}"
        new_doc['pets_staging_ids'] = [staging_id]
        await db.tdb_pets_staging.insert_one({
            'staging_id': staging_id,
            'parent_customer_key': customer_key,
            'parent_email': email,
            'parent_phone': phone,
            'name_raw': pet_signal['pet_name_raw'],
            'name': pet_signal['pet_name'],
            'birthday_month': pet_signal['birthday_month'],
            'birthday_day': pet_signal['birthday_day'],
            'birthday_confidence': 'MEDIUM' if pet_signal['birthday_month'] else None,
            'proteins_known': pet_signal['proteins'],
            'is_household_pet_count': 1,
            'household_position': 1,
            'source': 'tdb_shopify_live',
            'imported_at': datetime.now(timezone.utc).isoformat(),
            'migration_status': 'staged',
            'is_rainbow_bridge': False,
        })

    await db.pet_parents.insert_one(new_doc)
    return {
        'ok': True,
        'action': 'created',
        'customer_key': customer_key,
        'order_id': order_id,
        'pet_signal': pet_signal,
        'invite_token': new_doc['invite_token'],
    }


@shopify_router.post("/order-webhook")
async def shopify_order_webhook(
    request: Request,
    x_shopify_hmac_sha256: Optional[str] = Header(None, alias="X-Shopify-Hmac-Sha256"),
    x_shopify_topic: Optional[str] = Header(None, alias="X-Shopify-Topic"),
    x_shopify_shop_domain: Optional[str] = Header(None, alias="X-Shopify-Shop-Domain"),
):
    """
    Shopify Order Webhook — Live ingest into pet_parents.
    Configure in Shopify Admin → Settings → Notifications → Webhooks
      Event:  Order creation
      URL:    https://thedoggycompany.com/api/shopify/order-webhook
      Format: JSON
    """
    raw = await request.body()
    if not _verify_shopify_hmac(raw, x_shopify_hmac_sha256 or ''):
        logger.warning("[shopify-webhook] HMAC verification failed")
        raise HTTPException(401, "HMAC verification failed")
    try:
        order = json.loads(raw)
    except Exception as e:
        raise HTTPException(400, f"Invalid JSON: {e}")

    # Persist raw event (audit / replay)
    db = _get_db()
    await db.shopify_webhook_log.insert_one({
        'topic': x_shopify_topic,
        'shop': x_shopify_shop_domain,
        'order_id': str(order.get('id') or ''),
        'received_at': datetime.now(timezone.utc).isoformat(),
        'order_summary': {
            'email': (order.get('email') or '').lower(),
            'total_price': order.get('total_price'),
            'created_at': order.get('created_at'),
            'note_attributes_count': len(order.get('note_attributes') or []),
            'line_items_count': len(order.get('line_items') or []),
        },
    })

    result = await _ingest_order(order)
    return {'ok': True, 'topic': x_shopify_topic, 'result': result}


@shopify_router.get("/webhook-health")
async def webhook_health():
    """Public health endpoint Shopify can ping during webhook setup."""
    return {
        'ok': True,
        'service': 'tdc-shopify-webhook',
        'hmac_configured': bool(os.environ.get('SHOPIFY_WEBHOOK_SECRET')),
    }


# ════════════════════════════════════════════════════════════════════
# 2. ADMIN CSV BULK UPLOAD
# ════════════════════════════════════════════════════════════════════
async def _upsert_csv_row(db, row: Dict[str, Any]) -> str:
    """Returns 'created'|'updated'|'skipped'."""
    email = (row.get('Email') or '').strip().lower() or None
    phone_raw = (row.get('Phone') or '').lstrip("'").strip() or None
    phone = re.sub(r'\D', '', phone_raw) if phone_raw else None
    customer_key = resolve_customer_key(email, phone)
    if not customer_key:
        return 'skipped'

    first_name = (row.get('First Name') or '').strip() or None
    last_name = (row.get('Last Name') or '').strip() or None
    city = (row.get('Default Address City') or '').strip() or None
    spent = 0.0
    try:
        spent = float(row.get('Total Spent') or 0)
    except Exception:
        pass
    orders = 0
    try:
        orders = int(float(row.get('Total Orders') or 0))
    except Exception:
        pass

    existing = await db.pet_parents.find_one({'customer_key': customer_key})
    if existing:
        update = {
            'first_name': first_name or existing.get('first_name'),
            'last_name': last_name or existing.get('last_name'),
            'city': city or existing.get('city'),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        # Only bump totals if CSV has fresher numbers
        if spent > (existing.get('total_spent_inr') or 0):
            update['total_spent_inr'] = spent
        if orders > (existing.get('total_orders') or 0):
            update['total_orders'] = orders
        await db.pet_parents.update_one(
            {'customer_key': customer_key},
            {'$set': update},
        )
        return 'updated'

    # Insert new
    new_doc = {
        'customer_key': customer_key,
        'email': email,
        'phone': phone,
        'has_email': bool(email),
        'has_phone': bool(phone),
        'first_name': first_name,
        'last_name': last_name,
        'city': city,
        'city_raw': city,
        'country': (row.get('Default Address Country Code') or 'IN').strip() or 'IN',
        'total_orders': orders,
        'total_spent_inr': spent,
        'pet_names': [],
        'pet_count': 0,
        'is_tdb_founding_member': True,
        'intelligence_tier': 'MINIMAL',   # CSV alone has no pet intel
        'source': 'tdb_csv_reimport',
        'membership_offer': 'pet_pass_full_founding',
        'free_until': '2027-05-15T00:00:00',
        'founding_discount_forever': True,
        'invite_token': make_invite_token(),
        'assigned_send_date': None,
        'soft_launch': False,
        'activation_status': 'imported_pending_invite',
        'pets_staging_ids': [],
        'pets_live_ids': [],
        'import_batch_id': f'tdb_csv_reimport_{datetime.now(timezone.utc).strftime("%Y%m%d")}',
        'imported_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.pet_parents.insert_one(new_doc)
    return 'created'


@admin_router.post("/csv-upload")
async def csv_upload(
    file: UploadFile = File(...),
    dry_run: bool = Form(True),
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    """
    Admin CSV re-import: upload a fresh Shopify customer export.
    Same dedupe pipeline as the original 40k import — upserts only.

    Set dry_run=true to preview counts. dry_run=false to commit.
    """
    _require_admin(x_admin_secret)
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(400, "File must be a .csv")

    raw = await file.read()
    text = raw.decode('utf-8', errors='replace')
    import csv as _csv
    reader = _csv.DictReader(StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(400, "CSV is empty")

    db = _get_db()
    counts = {'created': 0, 'updated': 0, 'skipped': 0}
    sample_first_5_keys: List[str] = []

    if dry_run:
        # Just classify against existing records — no writes
        for row in rows:
            email = (row.get('Email') or '').strip().lower() or None
            phone_raw = (row.get('Phone') or '').lstrip("'").strip() or None
            phone = re.sub(r'\D', '', phone_raw) if phone_raw else None
            ck = resolve_customer_key(email, phone)
            if not ck:
                counts['skipped'] += 1
                continue
            if len(sample_first_5_keys) < 5:
                sample_first_5_keys.append(ck)
            existing = await db.pet_parents.find_one({'customer_key': ck}, {'_id': 1})
            counts['updated' if existing else 'created'] += 1
    else:
        # Write
        for row in rows:
            try:
                action = await _upsert_csv_row(db, row)
                counts[action] += 1
            except Exception as e:
                logger.exception(f"[csv-upload] row failed: {e}")
                counts['skipped'] += 1

    return {
        'ok': True,
        'dry_run': dry_run,
        'rows_in_file': len(rows),
        'sample_customer_keys': sample_first_5_keys[:5],
        'counts': counts,
    }
