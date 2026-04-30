"""
Founding Member Activation — Public API
────────────────────────────────────────
Public (token-protected) endpoints for the /founding-member/:token landing page.

  GET  /api/public/founding-member/{token}             — fetch parent + pet card
  POST /api/public/founding-member/{token}/soul-tease  — save 3-question answers
  POST /api/public/founding-member/{token}/activate    — claim profile, migrate
                                                         tdb_pets_staging → live `pets`,
                                                         mark activation_status='activated'

Tier-aware copy logic (used by both this API and the email orchestrator):
  COMPLETE: "[PetName]'s birthday is [Month] — we remembered. 🌷"
  HIGH:     "We remembered [PetName]. 🐾"
  MINIMAL:  "From The Doggy Bakery to The Doggy Company — your founding place. 🌷"
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public/founding-member", tags=["founding-member-activation"])


# ── DB connection (shared with admin viewer — uses MONGO_URL on production) ─
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


MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _greeting_line(parent: Dict[str, Any], primary_pet: Optional[Dict[str, Any]]) -> str:
    """Tier-aware welcome line."""
    tier = (parent.get("intelligence_tier") or "MINIMAL").upper()
    pet_name = (primary_pet or {}).get("name") or parent.get("primary_pet_name")
    bday_m = (primary_pet or {}).get("birthday_month") or parent.get("pet_birthday_month")
    if tier == "COMPLETE" and pet_name and bday_m:
        try:
            mname = MONTHS[int(bday_m) - 1]
        except Exception:
            mname = ""
        if mname:
            return f"{pet_name}'s birthday is {mname} — we remembered. 🌷"
        return f"We remembered {pet_name}. 🐾"
    if tier in ("HIGH", "MEDIUM") and pet_name:
        return f"We remembered {pet_name}. 🐾"
    if pet_name:
        return f"We remembered {pet_name}. 🐾"
    return "From The Doggy Bakery to The Doggy Company — your founding place. 🌷"


def _scrub(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Strip ObjectIds and serialize datetimes."""
    if not doc:
        return doc
    out = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, list):
            out[k] = [_scrub(x) if isinstance(x, dict) else x for x in v]
        elif isinstance(v, dict):
            out[k] = _scrub(v)
        else:
            out[k] = v
    return out


# ────────────────────────────────────────────────────────────────────
# 1. Fetch profile by token (used to render the activation page)
# ────────────────────────────────────────────────────────────────────
@router.get("/{token}")
async def get_by_token(token: str):
    if not token or len(token) < 8:
        raise HTTPException(404, "Invalid token")
    db = _get_db()
    parent = await db.pet_parents.find_one({"invite_token": token, "is_deleted": {"$ne": True}})
    if not parent:
        raise HTTPException(404, "We couldn't find your founding link. Drop us a note at hello@thedoggycompany.com.")

    parent_clean = _scrub(parent)

    # Fetch linked staging pets
    staging_ids = parent.get("pets_staging_ids") or []
    pets: List[Dict[str, Any]] = []
    if staging_ids:
        async for p in db.tdb_pets_staging.find(
            {"staging_id": {"$in": staging_ids}, "is_deleted": {"$ne": True}}
        ):
            pets.append(_scrub(p))

    primary_pet = pets[0] if pets else None

    # Mark "opened" on first fetch (analytics)
    if not parent.get("invite_opened_at"):
        try:
            await db.pet_parents.update_one(
                {"invite_token": token},
                {"$set": {"invite_opened_at": datetime.now(timezone.utc).isoformat()}},
            )
        except Exception as e:
            logger.warning(f"[founding] could not set invite_opened_at: {e}")

    # Memory wall: derive from products_ordered + cake history (no order-line PII)
    memory_wall = _build_memory_wall(parent_clean)

    return {
        "ok": True,
        "token": token,
        "parent": {
            "first_name": parent_clean.get("first_name"),
            "last_name": parent_clean.get("last_name"),
            "city": parent_clean.get("city"),
            "intelligence_tier": parent_clean.get("intelligence_tier", "MINIMAL"),
            "soft_launch": bool(parent_clean.get("soft_launch")),
            "loyalty_tier": parent_clean.get("loyalty_tier"),
            "total_orders": parent_clean.get("total_orders") or 0,
            "total_cakes": parent_clean.get("total_cakes") or 0,
            "total_spent_inr": parent_clean.get("total_spent_inr") or 0,
            "first_order_date": parent_clean.get("first_order_date"),
            "last_order_date": parent_clean.get("last_order_date"),
            "years_with_tdb": parent_clean.get("years_with_tdb") or 0,
            "favourite_protein": parent_clean.get("favourite_protein"),
            "last_cake_flavour": parent_clean.get("last_cake_flavour"),
            "membership_offer": parent_clean.get("membership_offer"),
            "free_until": parent_clean.get("free_until"),
            "founding_discount_forever": bool(parent_clean.get("founding_discount_forever")),
            "activation_status": parent_clean.get("activation_status") or "imported_pending_invite",
            "activated_at": parent_clean.get("activated_at"),
        },
        "pets": pets,
        "primary_pet": primary_pet,
        "greeting_line": _greeting_line(parent_clean, primary_pet),
        "memory_wall": memory_wall,
    }


def _build_memory_wall(parent: Dict[str, Any]) -> List[Dict[str, str]]:
    """Build poetic memory wall entries from aggregated order history."""
    items: List[Dict[str, str]] = []
    first = parent.get("first_order_date")
    if first:
        try:
            d = datetime.fromisoformat(str(first).replace("Z", ""))
            items.append({
                "icon": "🌱",
                "label": "First order",
                "value": d.strftime("%b %Y"),
            })
        except Exception:
            pass
    cakes = parent.get("total_cakes") or 0
    if cakes:
        items.append({
            "icon": "🎂",
            "label": "Cakes baked together",
            "value": str(cakes),
        })
    orders = parent.get("total_orders") or 0
    if orders:
        items.append({
            "icon": "📦",
            "label": "Times you came home",
            "value": str(orders),
        })
    fav = parent.get("favourite_protein")
    if fav:
        items.append({
            "icon": "🌾",
            "label": "Favourite protein",
            "value": fav.replace("_", " ").title(),
        })
    last = parent.get("last_cake_flavour")
    if last:
        items.append({
            "icon": "✨",
            "label": "Last cake we made",
            "value": last,
        })
    yrs = parent.get("years_with_tdb")
    if yrs:
        items.append({
            "icon": "💛",
            "label": "Years with us",
            "value": f"{yrs:.1f}",
        })
    return items


# ────────────────────────────────────────────────────────────────────
# 2. Save soul-tease answers (3 questions)
# ────────────────────────────────────────────────────────────────────
class SoulTeaseAnswers(BaseModel):
    one_word: Optional[str] = Field(None, max_length=80)
    favourite_thing: Optional[str] = Field(None, max_length=300)
    promise: Optional[str] = Field(None, max_length=300)


@router.post("/{token}/soul-tease")
async def save_soul_tease(token: str, answers: SoulTeaseAnswers):
    db = _get_db()
    parent = await db.pet_parents.find_one({"invite_token": token, "is_deleted": {"$ne": True}})
    if not parent:
        raise HTTPException(404, "Token not found")
    payload = {
        "soul_tease": answers.dict(exclude_none=True),
        "soul_tease_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pet_parents.update_one({"invite_token": token}, {"$set": payload})
    return {"ok": True, "saved": payload}


# ────────────────────────────────────────────────────────────────────
# 3. Activate: migrate staging pets → live `pets`, mark activated
# ────────────────────────────────────────────────────────────────────
class ActivateBody(BaseModel):
    confirmed_pet_names: Optional[List[str]] = None  # parent confirms which pets to migrate
    email_for_account: Optional[str] = None
    contact_consent: bool = False


@router.post("/{token}/activate")
async def activate(token: str, body: ActivateBody):
    db = _get_db()
    parent = await db.pet_parents.find_one({"invite_token": token, "is_deleted": {"$ne": True}})
    if not parent:
        raise HTTPException(404, "Token not found")

    if parent.get("activation_status") == "activated":
        return {
            "ok": True,
            "already_activated": True,
            "activated_at": parent.get("activated_at"),
            "pets_live_ids": parent.get("pets_live_ids") or [],
        }

    # Pull staging pets
    staging_ids = parent.get("pets_staging_ids") or []
    confirmed = set(body.confirmed_pet_names or [])
    new_live_ids: List[str] = []

    if staging_ids:
        async for sp in db.tdb_pets_staging.find({
            "staging_id": {"$in": staging_ids},
            "is_deleted": {"$ne": True},
            "is_rainbow_bridge": {"$ne": True},   # never migrate Rainbow Bridge pets
        }):
            # If parent specified pets, only migrate those
            if confirmed and sp.get("name") not in confirmed:
                continue
            # Build a live pet doc
            live_pet = {
                "name": sp.get("name"),
                "breed": sp.get("breed"),
                "birthday_year": sp.get("birthday_year"),
                "birthday_month": sp.get("birthday_month"),
                "birthday_day": sp.get("birthday_day"),
                "life_stage": sp.get("life_stage"),
                "proteins_known": sp.get("proteins_known") or [],
                "allergens_known": sp.get("allergens_known") or [],
                "owner_email": (body.email_for_account or parent.get("email") or "").strip().lower() or None,
                "owner_phone": parent.get("phone"),
                "owner_first_name": parent.get("first_name"),
                "source": "tdb_founding_activation",
                "founding_member": True,
                "migrated_from_staging_id": sp.get("staging_id"),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                res = await db.pets.insert_one(live_pet)
                new_id = str(res.inserted_id)
                new_live_ids.append(new_id)
                # Update staging row
                await db.tdb_pets_staging.update_one(
                    {"staging_id": sp.get("staging_id")},
                    {"$set": {
                        "migration_status": "migrated",
                        "migrated_to_pet_id": new_id,
                        "migration_date": datetime.now(timezone.utc).isoformat(),
                    }},
                )
            except Exception as e:
                logger.error(f"[activate] failed to migrate staging pet {sp.get('staging_id')}: {e}")

    update = {
        "activation_status": "activated",
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "pets_live_ids": new_live_ids,
    }
    if body.email_for_account:
        update["account_email"] = body.email_for_account.strip().lower()
    if body.contact_consent:
        update["contact_consent_at"] = datetime.now(timezone.utc).isoformat()

    await db.pet_parents.update_one({"invite_token": token}, {"$set": update})

    return {
        "ok": True,
        "activated_at": update["activated_at"],
        "pets_live_ids": new_live_ids,
        "pets_migrated": len(new_live_ids),
    }


# Health-check / debug
@router.get("/_meta/health")
async def meta_health():
    db = _get_db()
    return {
        "ok": True,
        "pet_parents": await db.pet_parents.count_documents({}),
        "with_token": await db.pet_parents.count_documents({"invite_token": {"$ne": None}}),
        "activated": await db.pet_parents.count_documents({"activation_status": "activated"}),
    }
