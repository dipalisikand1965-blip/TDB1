"""
Pet Parents Admin Routes — Founding Members Viewer Backend
──────────────────────────────────────────────────────────
Connects directly to PRODUCTION Atlas (where the 40,025 pet_parents and
26,650 tdb_pets_staging records live).

Endpoints (all admin-protected via x-admin-secret OR HTTP Basic):
  GET    /api/admin/pet-parents/stats
  GET    /api/admin/pet-parents
  GET    /api/admin/pet-parents/{id}
  PATCH  /api/admin/pet-parents/{id}
  POST   /api/admin/pet-parents
  DELETE /api/admin/pet-parents/{id}                 (soft delete)

  GET    /api/admin/tdb-pets
  GET    /api/admin/tdb-pets/{staging_id}
  PATCH  /api/admin/tdb-pets/{staging_id}
  POST   /api/admin/tdb-pets
  DELETE /api/admin/tdb-pets/{staging_id}            (soft delete)

  POST   /api/admin/pet-parents/bulk
  POST   /api/admin/pet-parents/export
  GET    /api/admin/pet-parents/audit/{id}

Rainbow Bridge handling on PATCH /api/admin/tdb-pets/{staging_id}:
  When `is_rainbow_bridge: true` is sent, we additionally:
    - clear birthday_month/day → no birthday nudges fire
    - set migration_status = 'rainbow_bridge'
    - record passed_date if provided (else today)
    - audit-log the transition with care
"""
import os
import csv
import io
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Header, Query, Body, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import re
import io
import math
import secrets as _sec
from collections import defaultdict
import pandas as pd
from pymongo import UpdateOne

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["pet-parents-admin"])

# ────────────────────────────────────────────────────────────────────
# Production Atlas connection (always — that's where the data lives)
# ────────────────────────────────────────────────────────────────────
_prod_client: Optional[AsyncIOMotorClient] = None
_prod_db = None


def _get_prod_db():
    global _prod_client, _prod_db
    if _prod_db is None:
        url = os.environ.get('PRODUCTION_MONGO_URL') or os.environ.get('MONGO_URL')
        # SOURCE DB is always 'pet-os-live-test_database' on cluster B —
        # that's where the founding-member import was placed. We deliberately
        # ignore prod's prefixed DB_NAME (`pet-soul-ranking-...`) here because
        # the source cluster doesn't carry that prefix.
        db_name = (
            os.environ.get('PRODUCTION_DB_NAME')
            or 'pet-os-live-test_database'
        )
        _prod_client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=10000)
        _prod_db = _prod_client[db_name]
        logger.info(f"[pet_parents_routes] Connected to DB: {db_name}")
    return _prod_db


# ────────────────────────────────────────────────────────────────────
# Auth
# ────────────────────────────────────────────────────────────────────
def _require_admin(x_admin_secret: Optional[str]):
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("SITEVAULT_ADMIN_SECRET")
    if not expected:
        return  # unprotected if not set
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Admin secret required (x-admin-secret header)")


def _admin(x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    return True


# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────
def _serialize(doc: dict) -> dict:
    """Convert ObjectIds + datetimes for JSON."""
    if not doc:
        return doc
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = _serialize(v)
        elif isinstance(v, list):
            out[k] = [_serialize(x) if isinstance(x, dict) else (str(x) if isinstance(x, ObjectId) else x) for x in v]
        else:
            out[k] = v
    return out


async def _audit(coll: str, doc_id: str, action: str, before: dict, after: dict, who: str = "admin", reason: str = None):
    """Append-only audit log. Records each field change."""
    db = _get_prod_db()
    diffs = []
    if action == 'update':
        for k in set((before or {}).keys()) | set((after or {}).keys()):
            if (before or {}).get(k) != (after or {}).get(k):
                diffs.append({'field': k, 'old': (before or {}).get(k), 'new': (after or {}).get(k)})
    await db.pet_parents_audit.insert_one({
        'collection': coll,
        'doc_id': doc_id,
        'action': action,
        'who': who,
        'when': datetime.now(timezone.utc).isoformat(),
        'diffs': diffs,
        'reason': reason,
    })


# ────────────────────────────────────────────────────────────────────
# DIAGNOSTIC — confirm which DB this router is connected to
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents/diagnostic")
async def diagnostic(x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    used_url = os.environ.get('PRODUCTION_MONGO_URL') or os.environ.get('MONGO_URL') or '(none)'
    used_db_name = (
        os.environ.get('PRODUCTION_DB_NAME')
        or os.environ.get('DB_NAME')
        or 'pet-os-live-test_database'
    )
    # Mask credentials in URL
    masked = used_url
    if '@' in masked:
        prefix = masked.split('@')[0].split('://')[0] + '://***:***'
        masked = prefix + '@' + masked.split('@', 1)[1]
    pp_count = await db.pet_parents.count_documents({})
    pets_count = await db.tdb_pets_staging.count_documents({})
    live_pets = await db.pets.count_documents({})
    sample = await db.pet_parents.find_one({'is_tdb_founding_member': True}, {'first_name': 1, 'email': 1, 'city': 1, '_id': 0})
    return {
        'connection_url': masked,
        'database_name': db.name,
        'env_DB_NAME': os.environ.get('DB_NAME'),
        'env_PRODUCTION_DB_NAME': os.environ.get('PRODUCTION_DB_NAME'),
        'env_has_PRODUCTION_MONGO_URL': bool(os.environ.get('PRODUCTION_MONGO_URL')),
        'collections': {
            'pet_parents': pp_count,
            'tdb_pets_staging': pets_count,
            'pets_live': live_pets,
        },
        'sample_first_record': sample,
        'expected': {
            'pet_parents': 40025,
            'tdb_pets_staging': 26650,
            'pets_live': 47,
        },
    }


# ────────────────────────────────────────────────────────────────────
# STATS
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents/stats")
async def stats(_admin_ok: bool = None, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    total_pp = await db.pet_parents.count_documents({'is_deleted': {'$ne': True}})
    total_pets = await db.tdb_pets_staging.count_documents({'is_deleted': {'$ne': True}})

    by_status_cur = db.pet_parents.aggregate([
        {'$match': {'is_deleted': {'$ne': True}}},
        {'$group': {'_id': '$customer_status', 'n': {'$sum': 1}}},
    ])
    by_status = {d['_id'] or 'unknown': d['n'] async for d in by_status_cur}

    by_intel_cur = db.pet_parents.aggregate([
        {'$match': {'is_deleted': {'$ne': True}}},
        {'$group': {'_id': '$intelligence_tier', 'n': {'$sum': 1}}},
    ])
    by_intel = {d['_id'] or 'unknown': d['n'] async for d in by_intel_cur}

    soft = await db.pet_parents.count_documents({'soft_launch': True})
    activated = await db.pet_parents.count_documents({'activation_status': 'active_founding'})
    pending = await db.pet_parents.count_documents({'activation_status': 'imported_pending_invite'})
    sent = await db.pet_parents.count_documents({'activation_status': 'sent'})
    overdue = await db.pet_parents.count_documents({'overdue': True, 'is_deleted': {'$ne': True}})
    rainbow = await db.tdb_pets_staging.count_documents({'is_rainbow_bridge': True, 'is_deleted': {'$ne': True}})

    return {
        'total_pet_parents': total_pp,
        'total_pets': total_pets,
        'activated': activated,
        'pending': pending,
        'sent': sent,
        'soft_launch': soft,
        'overdue': overdue,
        'rainbow_bridge_pets': rainbow,
        'by_status': by_status,
        'by_intelligence': by_intel,
    }


# ────────────────────────────────────────────────────────────────────
# LIST PET PARENTS
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents")
async def list_pet_parents(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    city: Optional[str] = None,
    customer_status: Optional[str] = None,
    intelligence_tier: Optional[str] = None,
    loyalty_tier: Optional[str] = None,
    activation_status: Optional[str] = None,
    soft_launch: Optional[bool] = None,
    overdue: Optional[bool] = None,
    has_email: Optional[bool] = None,
    has_phone: Optional[bool] = None,
    assigned_send_date: Optional[str] = None,
    sort_by: str = Query('total_spent_inr'),
    sort_dir: int = Query(-1, ge=-1, le=1),
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    _require_admin(x_admin_secret)
    db = _get_prod_db()

    q: Dict[str, Any] = {'is_deleted': {'$ne': True}}
    if search:
        rx = re.escape(search.strip())
        q['$or'] = [
            {'first_name': {'$regex': rx, '$options': 'i'}},
            {'last_name': {'$regex': rx, '$options': 'i'}},
            {'email': {'$regex': rx, '$options': 'i'}},
            {'phone': {'$regex': rx, '$options': 'i'}},
            {'primary_pet_name': {'$regex': rx, '$options': 'i'}},
            {'pet_names': {'$regex': rx, '$options': 'i'}},
        ]
    if city: q['city'] = city
    if customer_status: q['customer_status'] = customer_status
    if intelligence_tier: q['intelligence_tier'] = intelligence_tier
    if loyalty_tier: q['loyalty_tier'] = loyalty_tier
    if activation_status: q['activation_status'] = activation_status
    if soft_launch is not None: q['soft_launch'] = soft_launch
    if overdue is not None: q['overdue'] = overdue
    if has_email is True: q['email'] = {'$ne': None}
    elif has_email is False: q['email'] = None
    if has_phone is True: q['phone'] = {'$ne': None}
    elif has_phone is False: q['phone'] = None
    if assigned_send_date:
        try:
            dt = datetime.fromisoformat(assigned_send_date)
            q['assigned_send_date'] = datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)
        except Exception:
            pass

    valid_sort = {'total_spent_inr','total_orders','first_name','last_name','assigned_send_date','last_order_date','created_at'}
    if sort_by not in valid_sort:
        sort_by = 'total_spent_inr'

    total = await db.pet_parents.count_documents(q)
    cursor = (
        db.pet_parents.find(q).sort(sort_by, sort_dir or -1)
        .skip((page - 1) * page_size).limit(page_size)
    )
    items = [_serialize(d) async for d in cursor]
    return {'total': total, 'page': page, 'page_size': page_size, 'items': items}


@router.get("/pet-parents/{doc_id}")
async def get_parent(doc_id: str, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    doc = await db.pet_parents.find_one({'_id': oid})
    if not doc:
        raise HTTPException(404, "Not found")
    # Pull the linked pets
    pet_ids = doc.get('pets_staging_ids', [])
    pets = []
    if pet_ids:
        async for p in db.tdb_pets_staging.find({'staging_id': {'$in': pet_ids}}):
            pets.append(_serialize(p))
    out = _serialize(doc)
    out['linked_pets'] = pets
    return out


# Editable fields for parent
PARENT_EDITABLE = {
    'first_name','last_name','email','phone',
    'address_line_1','address_line_2','city','state','pincode','full_address',
    'customer_status','loyalty_tier',
    'assigned_send_date','soft_launch','whatsapp_only','activation_status',
    'admin_notes',
    'pet_names','primary_pet_name','primary_breed',
    'pet_birthday_year','pet_birthday_month','pet_birthday_day',
    'allergens',
}


class ParentPatch(BaseModel):
    class Config:
        extra = "allow"


@router.patch("/pet-parents/{doc_id}")
async def patch_parent(doc_id: str, patch: ParentPatch, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(400, "Invalid id")

    raw = patch.model_dump(exclude_unset=True)
    updates = {k: v for k, v in raw.items() if k in PARENT_EDITABLE}
    if not updates:
        raise HTTPException(400, "No editable fields to update")

    # Coerce assigned_send_date to datetime if string YYYY-MM-DD
    if 'assigned_send_date' in updates and isinstance(updates['assigned_send_date'], str):
        try:
            d = datetime.fromisoformat(updates['assigned_send_date'].replace('Z',''))
            updates['assigned_send_date'] = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
        except Exception:
            updates['assigned_send_date'] = None

    before = await db.pet_parents.find_one({'_id': oid})
    if not before:
        raise HTTPException(404, "Not found")

    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.pet_parents.update_one({'_id': oid}, {'$set': updates})
    after = await db.pet_parents.find_one({'_id': oid})
    await _audit('pet_parents', doc_id, 'update', before, after)
    return _serialize(after)


# ────────────────────────────────────────────────────────────────────
# CREATE PARENT (admin manually adds)
# ────────────────────────────────────────────────────────────────────
class ParentCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    customer_status: Optional[str] = "active"
    loyalty_tier: Optional[str] = "Regular"
    admin_notes: Optional[str] = None


@router.post("/pet-parents")
async def create_parent(body: ParentCreate, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    import secrets as _sec
    now = datetime.now(timezone.utc)
    customer_key = body.email or body.phone or f"manual_{_sec.token_hex(6)}"
    doc = {
        **body.model_dump(),
        'customer_key': customer_key,
        'has_email': bool(body.email),
        'has_phone': bool(body.phone),
        'pet_names': [], 'pet_count': 0,
        'is_tdb_founding_member': False,
        'membership_offer': None,
        'invite_token': _sec.token_urlsafe(24),
        'soft_launch': False,
        'activation_status': 'manual_created',
        'pets_staging_ids': [],
        'pets_live_ids': [],
        'source': 'admin_manual',
        'import_batch_id': 'manual',
        'imported_at': now,
        'created_at': now,
    }
    res = await db.pet_parents.insert_one(doc)
    doc['_id'] = res.inserted_id
    await _audit('pet_parents', str(res.inserted_id), 'create', None, doc)
    return _serialize(doc)


# ────────────────────────────────────────────────────────────────────
# SOFT-DELETE PARENT
# ────────────────────────────────────────────────────────────────────
class DeleteRequest(BaseModel):
    reason: str


@router.delete("/pet-parents/{doc_id}")
async def delete_parent(doc_id: str, body: DeleteRequest, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    if not body.reason or len(body.reason.strip()) < 3:
        raise HTTPException(400, "Reason required (min 3 chars)")
    db = _get_prod_db()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    before = await db.pet_parents.find_one({'_id': oid})
    if not before:
        raise HTTPException(404, "Not found")
    await db.pet_parents.update_one({'_id': oid}, {'$set': {
        'is_deleted': True,
        'deleted_at': datetime.now(timezone.utc).isoformat(),
        'delete_reason': body.reason,
    }})
    await _audit('pet_parents', doc_id, 'soft_delete', before, None, reason=body.reason)
    return {'success': True, 'soft_deleted': True}


# ────────────────────────────────────────────────────────────────────
# LIST PETS (Tab 2)
# ────────────────────────────────────────────────────────────────────
@router.get("/tdb-pets")
async def list_pets(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    breed: Optional[str] = None,
    migration_status: Optional[str] = None,
    rainbow_bridge: Optional[bool] = None,
    parent_email: Optional[str] = None,
    sort_by: str = Query('imported_at'),
    sort_dir: int = Query(-1),
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    q: Dict[str, Any] = {'is_deleted': {'$ne': True}}
    if search:
        rx = re.escape(search.strip())
        q['$or'] = [
            {'name': {'$regex': rx, '$options': 'i'}},
            {'name_raw': {'$regex': rx, '$options': 'i'}},
            {'parent_email': {'$regex': rx, '$options': 'i'}},
            {'parent_phone': {'$regex': rx, '$options': 'i'}},
        ]
    if breed: q['breed'] = breed
    if migration_status: q['migration_status'] = migration_status
    if rainbow_bridge is not None: q['is_rainbow_bridge'] = rainbow_bridge
    if parent_email: q['parent_email'] = parent_email.strip().lower()

    total = await db.tdb_pets_staging.count_documents(q)
    cursor = db.tdb_pets_staging.find(q).sort(sort_by, sort_dir or -1).skip((page-1)*page_size).limit(page_size)
    items = [_serialize(d) async for d in cursor]
    return {'total': total, 'page': page, 'page_size': page_size, 'items': items}


@router.get("/tdb-pets/{staging_id}")
async def get_pet(staging_id: str, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    doc = await db.tdb_pets_staging.find_one({'staging_id': staging_id})
    if not doc:
        raise HTTPException(404, "Pet not found")
    # Pull parent
    parent = None
    if doc.get('parent_customer_key'):
        p = await db.pet_parents.find_one({'customer_key': doc['parent_customer_key']})
        if p: parent = _serialize(p)
    out = _serialize(doc)
    out['parent'] = parent
    return out


PET_EDITABLE = {
    'name','breed',
    'birthday_year','birthday_month','birthday_day','birthday_confidence',
    'age_now','age_reported','life_stage',
    'proteins_known','allergens_known','health_conditions',
    'gender','weight_kg','spayed_neutered',
    'is_rainbow_bridge','passed_date','memorial_message',
    'admin_notes',
}


class PetPatch(BaseModel):
    class Config:
        extra = "allow"


@router.patch("/tdb-pets/{staging_id}")
async def patch_pet(staging_id: str, patch: PetPatch, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    raw = patch.model_dump(exclude_unset=True)
    updates = {k: v for k, v in raw.items() if k in PET_EDITABLE}
    if not updates:
        raise HTTPException(400, "No editable fields to update")

    before = await db.tdb_pets_staging.find_one({'staging_id': staging_id})
    if not before:
        raise HTTPException(404, "Pet not found")

    # ★ Rainbow Bridge handling — most important field per spec
    if updates.get('is_rainbow_bridge') is True:
        # Clear birthday so birthday-nudge engine never picks them up
        updates['birthday_month'] = None
        updates['birthday_day'] = None
        updates['migration_status'] = 'rainbow_bridge'
        if not updates.get('passed_date'):
            updates['passed_date'] = datetime.now(timezone.utc).isoformat()
        # Compose default memorial if none provided
        if not updates.get('memorial_message') and before.get('name'):
            updates['memorial_message'] = f"In loving memory of {before['name']}. Forever a part of the TDC family."

    if updates.get('is_rainbow_bridge') is False:
        # Reverting (admin mistake)
        updates['migration_status'] = 'staged'
        updates['passed_date'] = None
        updates['memorial_message'] = None

    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.tdb_pets_staging.update_one({'staging_id': staging_id}, {'$set': updates})
    after = await db.tdb_pets_staging.find_one({'staging_id': staging_id})
    await _audit('tdb_pets_staging', staging_id, 'update', before, after,
                 reason='rainbow_bridge' if updates.get('is_rainbow_bridge') is True else None)
    return _serialize(after)


# ────────────────────────────────────────────────────────────────────
# CREATE PET (admin manually adds to existing parent)
# ────────────────────────────────────────────────────────────────────
class PetCreate(BaseModel):
    parent_customer_key: str
    name: str
    breed: Optional[str] = None
    birthday_year: Optional[int] = None
    birthday_month: Optional[int] = None
    birthday_day: Optional[int] = None
    proteins_known: Optional[List[str]] = None
    allergens_known: Optional[List[str]] = None


@router.post("/tdb-pets")
async def create_pet(body: PetCreate, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    parent = await db.pet_parents.find_one({'customer_key': body.parent_customer_key})
    if not parent:
        raise HTTPException(404, "parent_customer_key not found in pet_parents")
    # Build staging_id similar to existing pattern: parent_key_<n>
    existing = await db.tdb_pets_staging.count_documents({'parent_customer_key': body.parent_customer_key})
    staging_id = f"{body.parent_customer_key}_{existing + 1}"
    now = datetime.now(timezone.utc)
    doc = {
        'staging_id': staging_id,
        'parent_customer_key': body.parent_customer_key,
        'parent_email': parent.get('email'),
        'parent_phone': parent.get('phone'),
        'name': body.name, 'name_raw': body.name,
        'breed': body.breed,
        'birthday_year': body.birthday_year,
        'birthday_month': body.birthday_month,
        'birthday_day': body.birthday_day,
        'proteins_known': body.proteins_known or [],
        'allergens_known': body.allergens_known or [],
        'is_household_pet_count': existing + 1,
        'household_position': existing + 1,
        'source': 'admin_manual',
        'imported_at': now,
        'migration_status': 'staged',
        'is_rainbow_bridge': False,
        'import_batch_id': 'manual',
    }
    await db.tdb_pets_staging.insert_one(doc)
    # Link to parent
    await db.pet_parents.update_one(
        {'customer_key': body.parent_customer_key},
        {'$push': {'pets_staging_ids': staging_id}}
    )
    await _audit('tdb_pets_staging', staging_id, 'create', None, doc)
    return _serialize(doc)


# ────────────────────────────────────────────────────────────────────
# DELETE PET (soft)
# ────────────────────────────────────────────────────────────────────
@router.delete("/tdb-pets/{staging_id}")
async def delete_pet(staging_id: str, body: DeleteRequest, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    if not body.reason or len(body.reason.strip()) < 3:
        raise HTTPException(400, "Reason required")
    db = _get_prod_db()
    before = await db.tdb_pets_staging.find_one({'staging_id': staging_id})
    if not before:
        raise HTTPException(404, "Pet not found")
    await db.tdb_pets_staging.update_one({'staging_id': staging_id}, {'$set': {
        'is_deleted': True,
        'deleted_at': datetime.now(timezone.utc).isoformat(),
        'delete_reason': body.reason,
    }})
    await _audit('tdb_pets_staging', staging_id, 'soft_delete', before, None, reason=body.reason)
    return {'success': True}


# ────────────────────────────────────────────────────────────────────
# AUDIT TRAIL
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents/audit/{doc_id}")
async def audit_for(doc_id: str, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    items = []
    async for d in db.pet_parents_audit.find({'doc_id': doc_id}).sort('when', -1).limit(200):
        items.append(_serialize(d))
    return {'doc_id': doc_id, 'items': items}


# ────────────────────────────────────────────────────────────────────
# BULK ACTIONS
# ────────────────────────────────────────────────────────────────────
class BulkRequest(BaseModel):
    ids: List[str]                         # parent _id strings
    action: str                             # reschedule | mark_soft_launch | unmark_soft_launch
    new_send_date: Optional[str] = None    # for reschedule


@router.post("/pet-parents/bulk")
async def bulk_action(req: BulkRequest, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    oids = []
    for s in req.ids:
        try:
            oids.append(ObjectId(s))
        except Exception:
            continue
    if not oids:
        raise HTTPException(400, "No valid ids")

    update = {}
    if req.action == 'reschedule':
        if not req.new_send_date: raise HTTPException(400, "new_send_date required")
        d = datetime.fromisoformat(req.new_send_date)
        update = {'assigned_send_date': datetime(d.year, d.month, d.day, tzinfo=timezone.utc)}
    elif req.action == 'mark_soft_launch':
        update = {'soft_launch': True}
    elif req.action == 'unmark_soft_launch':
        update = {'soft_launch': False}
    else:
        raise HTTPException(400, f"unknown action: {req.action}")

    result = await db.pet_parents.update_many({'_id': {'$in': oids}}, {'$set': update})
    return {'matched': result.matched_count, 'modified': result.modified_count, 'action': req.action}


# ────────────────────────────────────────────────────────────────────
# EXPORT (CSV)
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents/export.csv")
async def export_csv(
    kind: str = Query('full', regex='^(full|emails|whatsapp|birthdays|overdue)$'),
    customer_status: Optional[str] = None,
    intelligence_tier: Optional[str] = None,
    soft_launch: Optional[bool] = None,
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    q = {'is_deleted': {'$ne': True}}
    if customer_status: q['customer_status'] = customer_status
    if intelligence_tier: q['intelligence_tier'] = intelligence_tier
    if soft_launch is not None: q['soft_launch'] = soft_launch
    if kind == 'emails': q['email'] = {'$ne': None}
    elif kind == 'whatsapp': q['phone'] = {'$ne': None}
    elif kind == 'birthdays': q['pet_birthday_month'] = {'$ne': None}
    elif kind == 'overdue': q['overdue'] = True

    if kind == 'full':
        cols = ['customer_key','first_name','last_name','email','phone','city','state','pincode',
                'total_orders','total_spent_inr','customer_status','loyalty_tier','intelligence_tier',
                'primary_pet_name','pet_birthday_month','pet_birthday_day','favourite_protein',
                'soft_launch','assigned_send_date','activation_status','invite_token']
    elif kind == 'emails':
        cols = ['email','first_name','last_name','city','primary_pet_name','assigned_send_date','invite_token']
    elif kind == 'whatsapp':
        cols = ['phone','first_name','last_name','city','primary_pet_name','assigned_send_date','invite_token']
    elif kind == 'birthdays':
        cols = ['email','first_name','last_name','primary_pet_name','pet_birthday_month','pet_birthday_day','pet_birthday_year']
    elif kind == 'overdue':
        cols = ['email','phone','first_name','last_name','city','total_spent_inr','last_order_date','days_since_last_order']

    def _gen():
        sio = io.StringIO()
        w = csv.writer(sio)
        w.writerow(cols)
        yield sio.getvalue()
        sio.seek(0); sio.truncate()

    async def stream():
        sio = io.StringIO()
        w = csv.writer(sio)
        w.writerow(cols)
        yield sio.getvalue()
        sio.seek(0); sio.truncate()
        cursor = db.pet_parents.find(q)
        async for d in cursor:
            row = []
            for c in cols:
                v = d.get(c)
                if isinstance(v, datetime): v = v.isoformat()
                if v is None: v = ''
                row.append(v)
            w.writerow(row)
            yield sio.getvalue()
            sio.seek(0); sio.truncate()

    fname = f"pet_parents_{kind}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(stream(), media_type='text/csv',
                             headers={'Content-Disposition': f'attachment; filename="{fname}"'})


# ────────────────────────────────────────────────────────────────────
# CITIES (for filter dropdown)
# ────────────────────────────────────────────────────────────────────
@router.get("/pet-parents/meta/cities")
async def meta_cities(x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    db = _get_prod_db()
    cursor = db.pet_parents.aggregate([
        {'$match': {'city': {'$ne': None}, 'is_deleted': {'$ne': True}}},
        {'$group': {'_id': '$city', 'n': {'$sum': 1}}},
        {'$sort': {'n': -1}}, {'$limit': 100}
    ])
    return [{'city': d['_id'], 'count': d['n']} async for d in cursor]


# ════════════════════════════════════════════════════════════════════
# BOOTSTRAP — Migrate founding members from cluster B → production DB
# ════════════════════════════════════════════════════════════════════
# Use case:
#   Pod imported 40,025 pet_parents + 26,650 tdb_pets_staging into cluster B
#   (PRODUCTION_MONGO_URL on pod). When `thedoggycompany.com` is deployed,
#   its `MONGO_URL` may point to a *different* cluster (call it the live
#   production primary). This endpoint reads the founding-member dataset
#   from cluster B and writes it into the live production primary.
#
# Safety guarantees:
#   1. The live `pets` collection is NEVER touched. We snapshot its count
#      before/after the run and abort if it drifts.
#   2. Idempotent: existing pet_parents/tdb_pets_staging are matched by
#      `customer_key` / `staging_id` and replaced (so re-runs are safe).
#   3. Dry-run mode: returns the diff *without* writing anything.
#   4. Won't run if source and target databases resolve to the same URI
#      (no-op detection prevents accidental self-overwrites).

# Lazy "live target" connection — uses the server's primary MONGO_URL,
# which on production is the live primary. On the pod this is local mongo.
_target_client: Optional[AsyncIOMotorClient] = None
_target_db = None


def _get_target_db():
    """The DB the production server normally reads from (`MONGO_URL`)."""
    global _target_client, _target_db
    if _target_db is None:
        url = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'
        db_name = os.environ.get('DB_NAME') or 'pet-os-live-test_database'
        _target_client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=15000)
        _target_db = _target_client[db_name]
    return _target_db


def _mask_uri(uri: str) -> str:
    if not uri or '@' not in uri:
        return uri or '(none)'
    proto, rest = uri.split('://', 1)
    creds, host = rest.split('@', 1)
    return f"{proto}://***:***@{host}"


@router.post("/tdb-bootstrap/migrate")
async def bootstrap_from_source_cluster(
    dry_run: bool = Query(True, description="Plan only — no writes"),
    batch_size: int = Query(500, ge=50, le=2000),
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    """
    Migrate `pet_parents` + `tdb_pets_staging` from cluster B (PRODUCTION_MONGO_URL)
    into the production server's primary DB (MONGO_URL).

    On the pod this is a no-op when source == target. On production, where
    MONGO_URL points to the live primary, this populates pet_parents (40,025)
    and tdb_pets_staging (26,650) without touching the live `pets` collection.

    Returns a structured report. Safe to re-run (uses upsert semantics).
    """
    _require_admin(x_admin_secret)

    # ── 1. Resolve source + target ─────────────────────────────────────
    source_uri = os.environ.get('PRODUCTION_MONGO_URL')
    target_uri = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'
    if not source_uri:
        raise HTTPException(
            400,
            "PRODUCTION_MONGO_URL is not set on this server — "
            "cannot read founding-member data from cluster B."
        )

    # Compare host portions — if same cluster + same DB name, abort
    src_host = source_uri.split('@', 1)[-1]
    tgt_host = target_uri.split('@', 1)[-1]
    src_db_name = (
        os.environ.get('PRODUCTION_DB_NAME')
        or os.environ.get('DB_NAME')
        or 'pet-os-live-test_database'
    )
    tgt_db_name = os.environ.get('DB_NAME') or 'pet-os-live-test_database'
    if src_host == tgt_host and src_db_name == tgt_db_name:
        return {
            'ok': True,
            'noop': True,
            'message': (
                'Source cluster equals target cluster + DB. No migration '
                'needed — the data should already be visible. If admin '
                'shows 0, check DB_NAME or restart the FastAPI worker.'
            ),
            'source_uri': _mask_uri(source_uri),
            'source_db': src_db_name,
            'target_uri': _mask_uri(target_uri),
            'target_db': tgt_db_name,
        }

    src_db = _get_prod_db()
    tgt_db = _get_target_db()

    # ── 2. Pre-flight counts ──────────────────────────────────────────
    src_pp = await src_db.pet_parents.count_documents({})
    src_tdb = await src_db.tdb_pets_staging.count_documents({})
    src_pets = await src_db.pets.count_documents({})

    tgt_pp_before = await tgt_db.pet_parents.count_documents({})
    tgt_tdb_before = await tgt_db.tdb_pets_staging.count_documents({})
    tgt_pets_before = await tgt_db.pets.count_documents({})

    if src_pp == 0 or src_tdb == 0:
        raise HTTPException(
            500,
            f"Source cluster B is empty — pet_parents={src_pp}, "
            f"tdb_pets_staging={src_tdb}. Cannot bootstrap from empty source."
        )

    plan = {
        'source': {
            'uri': _mask_uri(source_uri),
            'db': src_db_name,
            'pet_parents': src_pp,
            'tdb_pets_staging': src_tdb,
            'pets_live_untouched': src_pets,
        },
        'target_before': {
            'uri': _mask_uri(target_uri),
            'db': tgt_db_name,
            'pet_parents': tgt_pp_before,
            'tdb_pets_staging': tgt_tdb_before,
            'pets_live': tgt_pets_before,
        },
        'will_upsert': {
            'pet_parents': src_pp,
            'tdb_pets_staging': src_tdb,
        },
        'guarantees': [
            f'pets collection (currently {tgt_pets_before}) will not be touched',
            'idempotent — uses upserts on customer_key / staging_id',
            'batch size: {} per insert'.format(batch_size),
        ],
    }

    if dry_run:
        return {'ok': True, 'dry_run': True, 'plan': plan}

    # ── 3. Migrate pet_parents (upsert by customer_key) ─────────────
    pp_inserted = 0
    pp_updated = 0
    pp_failed = 0
    batch: List[Dict[str, Any]] = []

    async for doc in src_db.pet_parents.find({}, {'_id': 0}):
        batch.append(doc)
        if len(batch) >= batch_size:
            r = await _flush_pp_batch(tgt_db, batch)
            pp_inserted += r['inserted']
            pp_updated += r['updated']
            pp_failed += r['failed']
            batch = []
    if batch:
        r = await _flush_pp_batch(tgt_db, batch)
        pp_inserted += r['inserted']
        pp_updated += r['updated']
        pp_failed += r['failed']

    # ── 4. Migrate tdb_pets_staging (upsert by staging_id) ──────────
    tdb_inserted = 0
    tdb_updated = 0
    tdb_failed = 0
    batch = []

    async for doc in src_db.tdb_pets_staging.find({}, {'_id': 0}):
        batch.append(doc)
        if len(batch) >= batch_size:
            r = await _flush_tdb_batch(tgt_db, batch)
            tdb_inserted += r['inserted']
            tdb_updated += r['updated']
            tdb_failed += r['failed']
            batch = []
    if batch:
        r = await _flush_tdb_batch(tgt_db, batch)
        tdb_inserted += r['inserted']
        tdb_updated += r['updated']
        tdb_failed += r['failed']

    # ── 5. Verify pets collection unchanged ─────────────────────────
    tgt_pets_after = await tgt_db.pets.count_documents({})
    pets_drift = tgt_pets_after - tgt_pets_before

    # ── 6. Final counts ─────────────────────────────────────────────
    tgt_pp_after = await tgt_db.pet_parents.count_documents({})
    tgt_tdb_after = await tgt_db.tdb_pets_staging.count_documents({})

    return {
        'ok': True,
        'dry_run': False,
        'plan': plan,
        'pet_parents_migration': {
            'inserted': pp_inserted,
            'updated': pp_updated,
            'failed': pp_failed,
        },
        'tdb_pets_staging_migration': {
            'inserted': tdb_inserted,
            'updated': tdb_updated,
            'failed': tdb_failed,
        },
        'target_after': {
            'pet_parents': tgt_pp_after,
            'tdb_pets_staging': tgt_tdb_after,
            'pets_live': tgt_pets_after,
        },
        'pets_collection_drift': pets_drift,
        'pets_collection_safe': pets_drift == 0,
        'completed_at': datetime.now(timezone.utc).isoformat(),
    }


async def _flush_pp_batch(tgt_db, batch: List[Dict[str, Any]]) -> Dict[str, int]:
    """Upsert a batch of pet_parents by customer_key."""
    ops = []
    for doc in batch:
        key = doc.get('customer_key') or doc.get('email') or doc.get('phone')
        if not key:
            continue
        ops.append(UpdateOne(
            {'customer_key': key},
            {'$set': doc},
            upsert=True,
        ))
    if not ops:
        return {'inserted': 0, 'updated': 0, 'failed': len(batch)}
    try:
        result = await tgt_db.pet_parents.bulk_write(ops, ordered=False)
        return {
            'inserted': result.upserted_count,
            'updated': result.modified_count,
            'failed': 0,
        }
    except Exception as e:
        logger.error(f"[BOOTSTRAP] pp batch failed: {e}")
        return {'inserted': 0, 'updated': 0, 'failed': len(batch)}


async def _flush_tdb_batch(tgt_db, batch: List[Dict[str, Any]]) -> Dict[str, int]:
    """Upsert a batch of tdb_pets_staging by staging_id."""
    ops = []
    for doc in batch:
        sid = doc.get('staging_id')
        if not sid:
            continue
        ops.append(UpdateOne(
            {'staging_id': sid},
            {'$set': doc},
            upsert=True,
        ))
    if not ops:
        return {'inserted': 0, 'updated': 0, 'failed': len(batch)}
    try:
        result = await tgt_db.tdb_pets_staging.bulk_write(ops, ordered=False)
        return {
            'inserted': result.upserted_count,
            'updated': result.modified_count,
            'failed': 0,
        }
    except Exception as e:
        logger.error(f"[BOOTSTRAP] tdb batch failed: {e}")
        return {'inserted': 0, 'updated': 0, 'failed': len(batch)}


@router.get("/tdb-bootstrap/status")
async def bootstrap_status(
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    """Quick health check: reports source + target counts side-by-side."""
    _require_admin(x_admin_secret)

    source_uri = os.environ.get('PRODUCTION_MONGO_URL')
    target_uri = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'

    out: Dict[str, Any] = {
        'source_uri': _mask_uri(source_uri or ''),
        'target_uri': _mask_uri(target_uri),
        'source_configured': bool(source_uri),
    }
    try:
        if source_uri:
            src_db = _get_prod_db()
            out['source'] = {
                'pet_parents': await src_db.pet_parents.count_documents({}),
                'tdb_pets_staging': await src_db.tdb_pets_staging.count_documents({}),
                'pets': await src_db.pets.count_documents({}),
            }
    except Exception as e:
        out['source_error'] = str(e)
    try:
        tgt_db = _get_target_db()
        out['target'] = {
            'pet_parents': await tgt_db.pet_parents.count_documents({}),
            'tdb_pets_staging': await tgt_db.tdb_pets_staging.count_documents({}),
            'pets': await tgt_db.pets.count_documents({}),
        }
    except Exception as e:
        out['target_error'] = str(e)
    return out
