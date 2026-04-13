"""
meal_box_routes.py
Mira Meal Box — backend routes for The Doggy Company®
Endpoints:
  GET  /api/mira/meal-box-products      → curate slots from DB; fill gaps with Mira Imagines (never empty)
  POST /api/concierge/meal-box          → submit box request → service desk ticket
"""

import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

meal_box_router = APIRouter()

# ── Slot definitions ────────────────────────────────────────────────────────
SLOT_CONFIG = [
    {
        "key": "morning",
        "label": "Morning Meal",
        "category": "Daily Meals",
        "sub_category": "Morning Meal",
        "emoji": "🌅",
        "fallback_name": "Personalised Morning Bowl",
        "fallback_desc": "A balanced morning meal tailored to your dog's protein preference and health needs.",
    },
    {
        "key": "evening",
        "label": "Evening Meal",
        "category": "Daily Meals",
        "sub_category": "Evening Meal",
        "emoji": "🌙",
        "fallback_name": "Personalised Evening Dinner",
        "fallback_desc": "A light, digestible evening meal formulated for your dog's stage and health.",
    },
    {
        "key": "treat",
        "label": "Daily Treat",
        "category": "Treats & Rewards",
        "sub_category": None,
        "emoji": "🦴",
        "fallback_name": "Personalised Daily Treat",
        "fallback_desc": "A safe, allergy-checked treat your dog will love as a daily reward.",
    },
    {
        "key": "supplement",
        "label": "Daily Supplement",
        "category": "Supplements",
        "sub_category": None,
        "emoji": "💊",
        "fallback_name": "Vet-Checked Daily Supplement",
        "fallback_desc": "A treatment-safe supplement supporting your dog's overall health and wellbeing.",
    },
    {
        "key": "health",
        "label": "Health Support",
        "category": "Supplements",
        "sub_category": "Immunity & Treatment",
        "emoji": "❤️",
        "fallback_name": "Health Support Formula",
        "fallback_desc": "A condition-specific supplement formulated for dogs on treatment or with chronic conditions.",
    },
]


def _allergy_safe(product: dict, allergies: list) -> bool:
    """Return True if product doesn't contain any of the pet's allergens."""
    if not allergies:
        return True
    name = (product.get("name", "") + " " + product.get("description", "")).lower()
    tags = " ".join(product.get("tags", [])).lower() + " " + " ".join(product.get("ingredients", [])).lower()
    combined = name + " " + tags
    for allergen in allergies:
        a = allergen.strip().lower()
        if a and a not in ("no", "none", "none_confirmed", "no_allergies", "na", "n/a") and a in combined:
            return False
    return True


def _product_to_slot_item(product: dict, is_pick: bool = False, mira_reason: str = "") -> dict:
    return {
        "id": product.get("id", ""),
        "name": product.get("name", ""),
        "description": product.get("description", ""),
        "price": product.get("price", 0),
        "image": product.get("image") or product.get("image_url") or "",
        "category": product.get("category", ""),
        "sub_category": product.get("sub_category", ""),
        "is_mira_pick": is_pick,
        "is_mira_imagines": False,
        "mira_reason": mira_reason,
        "tags": product.get("tags", []),
    }


def _imagines_item(slot: dict, pet_name: str, fav_protein: str, health_condition: str) -> dict:
    """Generate a Mira Imagines item — saved to products_master as a placeholder."""
    prot = fav_protein.capitalize() if fav_protein else "Premium"
    health_note = f", safe for {health_condition}" if health_condition and health_condition.lower() not in ("none", "none_confirmed", "") else ""
    names = {
        "morning": f"{prot} Morning Bowl for {pet_name}",
        "evening": f"{prot} Evening Dinner for {pet_name}",
        "treat": f"{prot} Daily Treats for {pet_name}",
        "supplement": f"Vet-Checked Daily Supplement for {pet_name}",
        "health": f"Treatment-Safe Health Formula for {pet_name}",
    }
    descs = {
        "morning": f"A {prot.lower()}-forward morning meal{health_note}. Curated by Mira for {pet_name}.",
        "evening": f"A light {prot.lower()}-based evening meal{health_note}. Balanced for {pet_name}'s stage.",
        "treat": f"{prot} treats — allergy-safe and loved by {pet_name}.",
        "supplement": f"Vet-checked supplement{health_note}. Treatment-safe and right for {pet_name}.",
        "health": f"Health support formula{health_note}. Designed to support {pet_name} during treatment.",
    }
    return {
        "id": f"mira-imagines-{slot['key']}-{pet_name.lower().replace(' ','-')}",
        "name": names.get(slot["key"], slot["fallback_name"]),
        "description": descs.get(slot["key"], slot["fallback_desc"]),
        "price": 0,
        "image": "",
        "category": slot["category"],
        "sub_category": slot.get("sub_category") or "",
        "is_mira_pick": True,
        "is_mira_imagines": True,
        "mira_reason": f"Curated by Mira — not yet in catalog. Your concierge will source this for {pet_name}.",
        "tags": [fav_protein.lower(), "mira-imagines"],
    }


@meal_box_router.get("/mira/meal-box-products")
async def get_meal_box_products(
    pet_id: str,
    allergies: str = "",
    fav_protein: str = "",
    health_condition: str = "",
    pet_name: str = "",
    breed: str = "",
):
    """
    Curate 5 meal-box slots from the products DB.
    Falls back to Mira Imagines items (never empty).
    Any Mira Imagines items are persisted to products_master so they appear in the admin Product Box.
    """
    from server import db  # import here to avoid circular import

    allergy_list = [a.strip().lower() for a in allergies.split(",") if a.strip()] if allergies else []
    prot = fav_protein.strip()
    cond = health_condition.strip()
    breed_clean = breed.strip()
    if cond.lower() in ("none", "none_confirmed", "[]", ""):
        cond = ""

    # Fetch all dine food products — use 1000 to avoid cutting off Morning/Evening Meal sub-categories
    food_cats = ["Daily Meals", "Treats & Rewards", "Supplements", "Frozen & Fresh", "Homemade & Recipes"]
    cursor = db.products_master.find(
        {"pillar": "dine", "category": {"$in": food_cats}, "active": True},
        {"_id": 0},
    )
    all_food = await cursor.to_list(1000)

    # Filter allergy-safe products
    safe_products = [p for p in all_food if _allergy_safe(p, allergy_list)]

    # Normalise pet protein preference for matching
    prot_norm = prot.lower() if prot else ""

    # Try to get Mira scores for this pet to sort picks by score
    mira_scores = {}
    try:
        score_cursor = db.mira_product_scores.find(
            {"pet_id": pet_id, "pillar": "dine"},
            {"_id": 0, "entity_id": 1, "score": 1, "mira_reason": 1},
        )
        score_docs = await score_cursor.to_list(500)
        mira_scores = {d["entity_id"]: d for d in score_docs}
    except Exception:
        pass

    def best_in(category, sub_category=None, exclude_ids=None):
        """Return candidates sorted: pet protein preference → breed match → Mira score."""
        exclude_ids = exclude_ids or set()

        def _score(p):
            # 1. PET FIRST — does this product match the pet's favourite protein?
            searchable = " ".join([
                p.get("name", ""),
                p.get("description", ""),
                " ".join(p.get("tags", [])),
                " ".join(p.get("ingredients", [])),
            ]).lower()
            protein_match = 1 if (prot_norm and prot_norm in searchable) else 0

            # 2. BREED SECOND — normalise to lowercase+underscores for comparison
            breed_norm = breed_clean.lower().replace(" ", "_") if breed_clean else ""
            tags_norm = [b.lower().replace(" ", "_") for b in (p.get("breed_tags") or [])]
            if tags_norm:
                # Breed-specific product: promote on match, penalise on mismatch
                breed_score = 1 if (breed_norm and breed_norm in tags_norm) else -1
            else:
                breed_score = 0  # Universal product — always neutral

            # 3. MIRA SCORE THIRD
            mira = mira_scores.get(p["id"], {}).get("score", 0)
            return (-protein_match, -breed_score, -mira)

        # Exclude persisted Mira Imagines placeholders — they should only appear as real fallbacks
        candidates = [
            p for p in safe_products
            if p.get("category") == category
            and not p.get("is_mira_imagines")
            and p["id"] not in exclude_ids
            and (sub_category is None or p.get("sub_category") == sub_category)
        ]
        candidates.sort(key=_score)
        if not candidates:
            # Relax sub-category constraint (still exclude Mira Imagines placeholders)
            candidates = [
                p for p in safe_products
                if p.get("category") == category
                and not p.get("is_mira_imagines")
                and p["id"] not in exclude_ids
            ]
            candidates.sort(key=_score)
        if not candidates:
            # Final fallback — universal products (no breed restriction, any food category)
            candidates = [
                p for p in safe_products
                if not p.get("breed_tags")
                and not p.get("is_mira_imagines")
                and p["id"] not in exclude_ids
            ]
            candidates.sort(key=_score)
        return candidates

    result_slots = []
    used_ids = set()

    for slot_cfg in SLOT_CONFIG:
        candidates = best_in(slot_cfg["category"], slot_cfg.get("sub_category"), used_ids)
        if candidates:
            pick = candidates[0]
            used_ids.add(pick["id"])
            reason = mira_scores.get(pick["id"], {}).get("mira_reason", "")
            if not reason and prot:
                reason = f"Matches {pet_name or 'your dog'}'s {prot.lower()} preference"
            alts = candidates[1:4]
            slot_result = {
                "key": slot_cfg["key"],
                "label": slot_cfg["label"],
                "emoji": slot_cfg["emoji"],
                "pick": _product_to_slot_item(pick, is_pick=True, mira_reason=reason),
                "alternatives": [_product_to_slot_item(a) for a in alts],
            }
        else:
            # Mira Imagines fallback — never empty
            imagines = _imagines_item(slot_cfg, pet_name or "your dog", prot, cond)
            # Persist to products_master so it shows in the admin Product Box
            try:
                existing = await db.products_master.find_one({"id": imagines["id"]}, {"_id": 0, "id": 1})
                if not existing:
                    await db.products_master.insert_one({
                        **imagines,
                        "pillar": "dine",
                        "type": "product",
                        "active": True,
                        "is_mira_imagines": True,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                    logger.info(f"[MEAL BOX] Persisted Mira Imagines product: {imagines['id']}")
            except Exception as e:
                logger.warning(f"[MEAL BOX] Failed to persist Mira Imagines: {e}")

            slot_result = {
                "key": slot_cfg["key"],
                "label": slot_cfg["label"],
                "emoji": slot_cfg["emoji"],
                "pick": imagines,
                "alternatives": [],
            }

        result_slots.append(slot_result)

    # Build teaser description dynamically
    parts = []
    if prot:
        parts.append(f"{prot.capitalize()}-forward")
    if allergy_list:
        clean = [a for a in allergy_list if a not in ("no", "none", "none_confirmed")]
        if clean:
            parts.append(", ".join(f"{a}-free" for a in clean[:2]))
    if cond:
        parts.append(f"safe for their {cond.lower().split('-')[0].strip()}")
    teaser_desc = (", ".join(parts) + ".") if parts else "Balanced and nutritious for your dog."

    return {
        "slots": result_slots,
        "teaser_desc": teaser_desc,
        "pet_name": pet_name,
        "has_scores": bool(mira_scores),
    }


# ── Meal Box submission ──────────────────────────────────────────────────────
class MealBoxRequest(BaseModel):
    pet_id: str
    pet_name: str
    meals_per_day: int  # 1 or 2
    delivery_frequency: str  # "weekly" | "fortnightly" | "monthly"
    allergies_confirmed: bool
    slots: list
    user_email: Optional[str] = None
    user_name: Optional[str] = None


@meal_box_router.post("/concierge/meal-box")
async def submit_meal_box(payload: MealBoxRequest):
    """Submit a meal box request → creates service desk ticket → returns ticket number."""
    from server import db

    ticket_id = f"MEAL-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
    now = datetime.now(timezone.utc).isoformat()

    # Build slot summary for the ticket
    slot_lines = []
    for slot in payload.slots:
        pick = slot.get("pick", {})
        slot_lines.append(f"  • {slot.get('label','Slot')}: {pick.get('name','TBD')}")
    slot_summary = "\n".join(slot_lines)

    description = f"""🐾 Mira Meal Box Request — {payload.pet_name}

Meals per day: {payload.meals_per_day}
Delivery frequency: {payload.delivery_frequency.title()}
Allergies confirmed by owner: {'Yes' if payload.allergies_confirmed else 'No'}

Curated slots:
{slot_summary}

Customer: {payload.user_name or 'Unknown'} ({payload.user_email or 'No email'})
"""

    ticket = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "type": "meal_box",
        "category": "dine",
        "sub_category": "meal_box",
        "subject": f"Mira Meal Box — {payload.pet_name}",
        "description": description,
        "status": "open",
        "priority": "normal",
        "channel": "web",
        "pillar": "dine",
        "pet_id": payload.pet_id,
        "pet_name": payload.pet_name,
        "meals_per_day": payload.meals_per_day,
        "delivery_frequency": payload.delivery_frequency,
        "allergies_confirmed": payload.allergies_confirmed,
        "slots": payload.slots,
        "user_email": payload.user_email,
        "user_name": payload.user_name,
        "created_at": now,
        "updated_at": now,
        "assigned_to": None,
        "activity_log": [
            {"action": "created", "timestamp": now, "details": f"Meal Box submitted for {payload.pet_name}"}
        ],
    }

    await db.service_desk_tickets.insert_one(ticket)
    logger.info(f"[MEAL BOX] Ticket created: {ticket_id} for pet {payload.pet_name}")

    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": f"Meal Box confirmed for {payload.pet_name}! Your concierge will be in touch within 24 hours.",
    }
