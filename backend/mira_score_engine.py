"""
mira_score_engine.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mira Product Score Engine — powered by Claude Sonnet 4.6

Every product, service, bundle in the DB gets scored (0-100) + a
personalised "Why Mira picked this" reason for each pet.

Scoring covers ALL entity types:
  • products_master  (all pillars)
  • services_master  (all pillars)
  • bundles          (all pillars)

Architecture:
  • POST /api/mira/score-for-pet      → trigger full scoring (background)
  • GET  /api/mira/scores/{pet_id}    → fetch pre-computed scores
  • GET  /api/mira/top-picks/{pet_id} → top-N scored items (optionally filtered by pillar + type)
  • POST /api/mira/score-context      → score only items for a specific pillar + context (fast)

Claude Sonnet 4.6 scores 20 items per batch with structured JSON output.
Results stored in `mira_product_scores` collection.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
import os
import json
import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Global semaphore — only 1 scoring job at a time, yields to other requests ──
_scoring_semaphore = asyncio.Semaphore(1)
_scoring_active_pet: Optional[str] = None  # track which pet is currently scoring

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-6"
BATCH_SIZE = 20          # products per Claude call
SCORE_TTL_HOURS = 24     # re-score after 24h if soul data changes

mira_score_router = APIRouter(prefix="/api/mira", tags=["mira-score-engine"])

# DB reference set by server.py
_db = None

def set_database(db):
    global _db
    _db = db


# ── Pydantic models ───────────────────────────────────────────────────────────

class ScoreForPetRequest(BaseModel):
    pet_id: str
    pillar: Optional[str] = None          # if provided, score only this pillar
    entity_types: Optional[List[str]] = None  # ["product","service","bundle"] default=all

class ScoreContextRequest(BaseModel):
    pet_id: str
    pillar: str
    category: Optional[str] = None
    limit: Optional[int] = 60


# ── Pet soul profile builder ──────────────────────────────────────────────────

def _extract_pet_profile(pet: dict) -> dict:
    """Flatten all soul data into a simple dict for Claude context."""
    soul = pet.get("doggy_soul_answers") or {}
    health = pet.get("health_data") or pet.get("health") or {}
    insights = pet.get("insights") or {}

    allergies = set()
    for src in [
        soul.get("food_allergies"),
        pet.get("allergies"),
        pet.get("allergy1"), pet.get("allergy2"),
        health.get("allergies"),
        insights.get("key_flags", {}).get("allergy_list"),
    ]:
        if not src:
            continue
        arr = src if isinstance(src, list) else [x.strip() for x in str(src).replace(";", ",").split(",")]
        allergies.update(a.lower().strip() for a in arr if a)

    loves = set()
    for src in [
        soul.get("favorite_protein"),
        soul.get("favorite_treats"),
    ]:
        if not src:
            continue
        loves.add(src.lower().strip() if isinstance(src, str) else str(src).lower().strip())
    for f in pet.get("learned_facts") or []:
        if f.get("type") in ("loves", "likes"):
            loves.add((f.get("value") or "").lower().strip())

    health_condition = (
        health.get("chronic_conditions")
        or health.get("conditions")
        or pet.get("healthCondition")
    )
    if isinstance(health_condition, list):
        health_condition = health_condition[0] if health_condition else None

    return {
        "name": pet.get("name", "Dog"),
        "breed": pet.get("breed", "Mixed"),
        "age_years": pet.get("age_years"),
        "weight_kg": pet.get("weight_kg"),
        "allergies": sorted(allergies),
        "loves": sorted(loves),
        "health_condition": health_condition,
        "nutrition_goal": soul.get("nutrition_goal"),
        "soul_score": pet.get("soul_score"),
    }


# ── Claude scoring logic ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Mira, The Doggy Company's AI soul advisor.
Your job: score how well each product/service/bundle matches a specific pet's profile.

Return ONLY a valid JSON array — no markdown, no explanation, no trailing commas.
Each element: {"id": "...", "score": <0-100>, "reason": "<max 15 words, personalised to pet name>"}

Scoring rules:
- 90-100: Perfect match (safe, loved ingredient, health-appropriate, breed-relevant)
- 70-89: Good match (mostly safe, one minor mismatch)
- 50-69: Neutral (nothing wrong but not specifically suited)
- 20-49: Weak (has minor concern for this pet)
- 0-19: Exclude (contains known allergen OR conflicts with health condition)

Rules:
• If a product contains ANY of the pet's known allergens → score 0-10
• If product explicitly says "{allergen}-free" for pet's allergen → bonus +15
• Products matching pet's loves → score ≥ 85
• Treatment-safe products for pets with health conditions → score ≥ 80
• Services are scored on relevance to current pet profile (breed/age/health)
• Bundles scored on combined item relevance
• Keep reasons under 15 words, use pet's name, be warm not clinical"""


async def _score_batch(
    session_id: str,
    pet_profile: dict,
    items: List[dict],
) -> List[dict]:
    """Send one batch to Claude and return scored items."""
    if not items:
        return []

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    pet_str = json.dumps(pet_profile, ensure_ascii=False)
    items_str = json.dumps([
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "description": (p.get("description") or "")[:80],
            "category": p.get("category") or p.get("product_type") or p.get("entity_type"),
            "sub_category": p.get("sub_category"),
            "allergy_free": p.get("allergy_free") or p.get("tags") or "",
            "mira_tag": p.get("mira_tag") or "",
            "pillar": p.get("pillar"),
        }
        for p in items
    ], ensure_ascii=False)

    prompt = f"""Pet Profile:
{pet_str}

Score these {len(items)} items:
{items_str}"""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        # Parse JSON from response
        text = response.strip()
        # Handle markdown code blocks if present
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        scored = json.loads(text)
        return scored if isinstance(scored, list) else []
    except Exception as e:
        print(f"[MiraScoreEngine] Claude batch error: {e}")
        # Return neutral scores on error
        return [{"id": p.get("id"), "score": 50, "reason": "Mira is still learning about this"} for p in items]


async def _run_full_scoring(pet_id: str, pillar: Optional[str], entity_types: Optional[List[str]]):
    """Background task: score ALL items for a pet and persist to DB.
    Uses semaphore to prevent multiple concurrent scoring jobs blocking the event loop."""
    global _scoring_active_pet

    # If semaphore is locked (another job running), skip this one
    if _scoring_semaphore.locked():
        print(f"[MiraScoreEngine] Skipping scoring for pet={pet_id} — another job is running for {_scoring_active_pet}")
        return

    async with _scoring_semaphore:
        _scoring_active_pet = pet_id

        # ── Cooldown: skip if scored within the last 60 minutes ──────────────
        from datetime import datetime, timezone, timedelta
        recent = await _db.mira_product_scores.find_one(
            {"pet_id": pet_id},
            sort=[("scored_at", -1)]
        )
        if recent:
            scored_at = recent.get("scored_at")
            if isinstance(scored_at, str):
                try:
                    scored_at = datetime.fromisoformat(scored_at.replace("Z",""))
                    scored_at = scored_at.replace(tzinfo=timezone.utc) if scored_at.tzinfo is None else scored_at
                except Exception:
                    scored_at = None
            if scored_at and (datetime.now(timezone.utc) - scored_at) < timedelta(hours=24):
                print(f"[MiraScoreEngine] Skipping scoring for pet={pet_id} — scored <24hr ago")
                return

        print(f"[MiraScoreEngine] Starting scoring for pet={pet_id} pillar={pillar}")

        # Fetch pet
        pet = await _db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            # Try ObjectId-based lookup
            pet = await _db.pets.find_one({"_id": pet_id}, {"_id": 0})
        if not pet:
            print(f"[MiraScoreEngine] Pet {pet_id} not found")
            return

        pet_profile = _extract_pet_profile(pet)

        # Determine which entity types to score
        types = entity_types or ["product", "service", "bundle"]

        # Fetch all items
        all_items = []

        if "product" in types:
            q = {"pillar": pillar} if pillar else {}
            cursor = _db.products_master.find(q, {"_id": 0})
            products = await cursor.to_list(length=2000)

            # Breed pre-filter — only score breed-relevant products (huge speed gain)
            pet_breed = (pet.get("breed") or "").lower().strip()
            def _breed_ok(p):
                targets = [b.lower() for b in (p.get("breed_targets") or [])]
                if not targets:
                    return True  # universal product
                if "all" in targets or "all_breeds" in targets:
                    return True
                return any(pet_breed in t or t in pet_breed for t in targets)

            before = len(products)
            products = [p for p in products if _breed_ok(p)]
            print(f"[MiraScoreEngine] Breed pre-filter ({pet_breed}): {before} → {len(products)} products")

            for p in products:
                p["entity_type"] = "product"
            all_items.extend(products)

        if "service" in types:
            q = {"is_active": {"$ne": False}}
            if pillar:
                q["pillar"] = pillar
            cursor = _db.services_master.find(q, {"_id": 0})
            services = await cursor.to_list(length=1000)
            for s in services:
                s["entity_type"] = "service"
                s["product_type"] = "service"
            all_items.extend(services)

        if "bundle" in types:
            q = {"pillar": pillar} if pillar else {}
            cursor = _db.bundles.find(q, {"_id": 0})
            bundles = await cursor.to_list(length=200)
            for b in bundles:
                b["entity_type"] = "bundle"
            all_items.extend(bundles)

        if not all_items:
            print("[MiraScoreEngine] No items found for scoring")
            return

        print(f"[MiraScoreEngine] Scoring {len(all_items)} items for {pet_profile['name']}")

        # Batch and score — yield to event loop between batches so API calls get through
        batches = [all_items[i:i+BATCH_SIZE] for i in range(0, len(all_items), BATCH_SIZE)]
        scored_at = datetime.now(timezone.utc).isoformat()
        session_id = f"mira-score-{pet_id}-{uuid.uuid4().hex[:8]}"

        # Process batches ONE at a time with generous yielding to prevent event loop starvation
        all_scores = []
        for i, batch in enumerate(batches):
            result = await _score_batch(f"{session_id}-b{i}", pet_profile, batch)
            all_scores.extend(result)
            # Yield generously (0.5s) so API requests get served between batches
            await asyncio.sleep(0.5)

        # Build lookup from scored results
        score_map = {s["id"]: s for s in all_scores if s.get("id")}

        # Persist to mira_product_scores
        ops = []
        for item in all_items:
            item_id = item.get("id")
            if not item_id:
                continue
            sc = score_map.get(item_id, {})
            score_doc = {
                "pet_id": pet_id,
                "entity_id": item_id,
                "entity_type": item.get("entity_type", "product"),
                "entity_name": item.get("name"),
                "pillar": item.get("pillar"),
                "score": sc.get("score", 50),
                "mira_reason": sc.get("reason", ""),
                "scored_at": scored_at,
                "pet_name": pet_profile["name"],
            }
            ops.append(score_doc)

        if ops:
            # Upsert all scores
            await _db.mira_product_scores.delete_many({"pet_id": pet_id, **({"pillar": pillar} if pillar else {})})
            await _db.mira_product_scores.insert_many(ops, ordered=False)
            # ── Update last_mira_scored_at so early-exit check works ─────────
            await _db.pets.update_one(
                {"id": pet_id},
                {"$set": {"last_mira_scored_at": datetime.now(timezone.utc).isoformat()}}
            )
            print(f"[MiraScoreEngine] Saved {len(ops)} scores for {pet_profile['name']}")


# ── API Routes ────────────────────────────────────────────────────────────────

@mira_score_router.post("/batch-score-all-pets")
async def batch_score_all_pets(background_tasks: BackgroundTasks, pillar: Optional[str] = None):
    """Trigger background scoring for ALL pets in the DB."""
    async def _batch():
        if _db is None:
            return
        pets = await _db.pets.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(200)
        print(f"[BatchScore] Starting batch for {len(pets)} pets pillar={pillar}")
        for pet in pets:
            pet_id = pet.get("id")
            if not pet_id:
                continue
            pillars_to_score = [pillar] if pillar else ["dine", "celebrate", "care", "go", "fit", "adopt"]
            for p in pillars_to_score:
                try:
                    await _run_full_scoring(pet_id, p, None)
                except Exception as e:
                    print(f"[BatchScore] Error pet={pet_id} pillar={p}: {e}")
        print("[BatchScore] Batch complete")
    background_tasks.add_task(_batch)
    return {"status": "batch_started", "message": "Scoring all pets in background. Check logs for progress."}


@mira_score_router.post("/score-for-pet")
async def score_for_pet(req: ScoreForPetRequest, background_tasks: BackgroundTasks):
    """Trigger background scoring for a pet. Returns instantly if already scored recently."""
    if _db is None:
        return {"status": "db_not_ready"}

    # ── EARLY EXIT — return in 5ms if already scored within 6 hours ──────────
    try:
        pet = await _db.pets.find_one({"id": req.pet_id}, {"_id": 0, "overall_score": 1, "last_mira_scored_at": 1})
        if pet:
            overall = pet.get("overall_score", 0) or 0
            last_scored = pet.get("last_mira_scored_at")
            if overall > 0 and last_scored:
                from datetime import datetime, timezone as tz
                try:
                    last_dt = datetime.fromisoformat(str(last_scored).replace("Z", "+00:00"))
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=tz.utc)
                    hours_since = (datetime.now(tz.utc) - last_dt).total_seconds() / 3600
                    if hours_since < 24:
                        return {
                            "status":         "already_scored",
                            "score":          overall,
                            "cached":         True,
                            "next_in_hours":  round(24 - hours_since, 1),
                            "message":        "Mira already has fresh scores for this pet.",
                        }
                except Exception:
                    pass  # If date parse fails, proceed with scoring
            elif overall > 0:
                # Has score but no timestamp — still skip if score is good
                return {
                    "status":  "already_scored",
                    "score":   overall,
                    "cached":  True,
                    "message": "Mira already has scores for this pet.",
                }
    except Exception:
        pass  # If check fails, proceed with scoring (safe fallback)

    # ── Proceed with scoring (new pet or stale scores) ─────────────────────────
    background_tasks.add_task(
        _run_full_scoring, req.pet_id, req.pillar, req.entity_types
    )
    return {
        "status": "scoring_started",
        "pet_id": req.pet_id,
        "pillar": req.pillar,
        "message": "Mira is personalising your picks. Check back in ~30 seconds.",
    }


@mira_score_router.post("/score-context")
async def score_context(req: ScoreContextRequest):
    """Score only a specific pillar+category context synchronously (fast — < 5s for ~60 items)."""
    if _db is None:
        raise HTTPException(status_code=503, detail="DB not ready")

    pet = await _db.pets.find_one({"id": req.pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet_profile = _extract_pet_profile(pet)

    # Fetch relevant products
    q = {"pillar": req.pillar}
    if req.category:
        q["category"] = req.category
    cursor = _db.products_master.find(q, {"_id": 0})
    items = await cursor.to_list(length=req.limit or 60)
    for p in items:
        p["entity_type"] = "product"

    # Fetch services for this pillar (active only)
    srv_cursor = _db.services_master.find({"pillar": req.pillar, "is_active": {"$ne": False}}, {"_id": 0})
    services = await srv_cursor.to_list(length=20)
    for s in services:
        s["entity_type"] = "service"
        s["product_type"] = "service"
    items.extend(services)

    if not items:
        return {"scores": [], "pet_name": pet_profile["name"]}

    session_id = f"mira-ctx-{req.pet_id}-{uuid.uuid4().hex[:8]}"
    batches = [items[i:i+BATCH_SIZE] for i in range(0, len(items), BATCH_SIZE)]

    all_scores = []
    for batch in batches:
        scored = await _score_batch(session_id, pet_profile, batch)
        all_scores.extend(scored)

    # Persist scores
    scored_at = datetime.now(timezone.utc).isoformat()
    score_map = {s["id"]: s for s in all_scores if s.get("id")}
    ops = []
    for item in items:
        item_id = item.get("id")
        if not item_id:
            continue
        sc = score_map.get(item_id, {})
        ops.append({
            "pet_id": req.pet_id,
            "entity_id": item_id,
            "entity_type": item.get("entity_type", "product"),
            "entity_name": item.get("name"),
            "pillar": req.pillar,
            "category": item.get("category"),
            "score": sc.get("score", 50),
            "mira_reason": sc.get("reason", ""),
            "scored_at": scored_at,
            "pet_name": pet_profile["name"],
        })

    if ops:
        # Upsert for this context
        entity_ids = [o["entity_id"] for o in ops]
        await _db.mira_product_scores.delete_many({"pet_id": req.pet_id, "entity_id": {"$in": entity_ids}})
        await _db.mira_product_scores.insert_many(ops, ordered=False)

    return {
        "scores": sorted(all_scores, key=lambda x: x.get("score", 0), reverse=True),
        "pet_name": pet_profile["name"],
        "scored": len(ops),
    }


@mira_score_router.get("/scores/{pet_id}")
async def get_scores(pet_id: str, pillar: Optional[str] = None, entity_type: Optional[str] = None):
    """Return all pre-computed scores for a pet."""
    if _db is None:
        raise HTTPException(status_code=503, detail="DB not ready")

    q = {"pet_id": pet_id}
    if pillar:
        q["pillar"] = pillar
    if entity_type:
        q["entity_type"] = entity_type

    cursor = _db.mira_product_scores.find(q, {"_id": 0}).sort("score", -1)
    scores = await cursor.to_list(length=500)
    return {"scores": scores, "count": len(scores)}


@mira_score_router.get("/claude-picks/{pet_id}")
async def get_top_picks(
    pet_id: str,
    pillar: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 20,
    min_score: int = 60,
    breed: Optional[str] = None,
):
    """
    Return top picks for a pet using 3-layer approach:
    Layer 1: Breed-specific soul products (breed_products) — always personalised, always fast
    Layer 2: Services for the pillar — bookable via concierge
    Layer 3: AI-scored products from mira_product_scores — fill remaining slots
    """
    if _db is None:
        raise HTTPException(status_code=503, detail="DB not ready")

    results = []
    breed_clean = (breed or "").strip()

    # ── LAYER 1: DISABLED — soul products shown via MiraImaginesBreed component ─
    # Each pillar page already has MiraImaginesBreed which shows breed-specific
    # imagine cards in a separate dedicated section. Don't duplicate them here.
    layer1_limit = 0
    soul_products = []


    # ── LAYER 2: Pillar services ───────────────────────────────────────────────
    # Services that can be booked via concierge for this pillar
    layer2_limit = min(limit // 4, 4)  # Up to 4 services
    if pillar and not entity_type:
        svc_q: dict = {
            "active": {"$ne": False},
            "$or": [{"pillar": pillar}, {"pillars": pillar}],
        }
        svc_cursor = _db.services_master.find(svc_q, {"_id": 0}).limit(layer2_limit)
        services = await svc_cursor.to_list(length=layer2_limit)
        for s in services:
            s["mira_score"]  = s.get("mira_score", 88)
            s["mira_reason"] = f"Service Mira recommends for {breed_clean or 'your pet'} on /{pillar}"
            s["entity_type"] = "service"
            s["product_type"] = "service"
            s["source"]      = "services_master"
            results.append(s)

    # ── LAYER 3: AI-scored products from mira_product_scores ──────────────────
    # Fill remaining slots with traditionally scored products
    remaining = limit - len(results)
    if remaining > 0:
        q = {"pet_id": pet_id, "score": {"$gte": min_score}}
        if pillar:
            q["pillar"] = pillar
        if entity_type:
            q["entity_type"] = entity_type

        score_cursor = _db.mira_product_scores.find(q, {"_id": 0}).sort("score", -1).limit(remaining * 3)
        picks = await score_cursor.to_list(length=remaining * 3)

        products_map, services_map, bundles_map = {}, {}, {}
        product_ids = [p["entity_id"] for p in picks if p.get("entity_type","product") == "product"]
        service_ids = [p["entity_id"] for p in picks if p.get("entity_type") == "service"]
        bundle_ids  = [p["entity_id"] for p in picks if p.get("entity_type") == "bundle"]

        if product_ids:
            async for doc in _db.products_master.find({"id": {"$in": product_ids}}, {"_id": 0}):
                products_map[doc["id"]] = doc
        if service_ids:
            async for doc in _db.services_master.find({"id": {"$in": service_ids}}, {"_id": 0}):
                services_map[doc["id"]] = doc
        if bundle_ids:
            async for doc in _db.bundles.find({"id": {"$in": bundle_ids}}, {"_id": 0}):
                bundles_map[doc["id"]] = doc

        already_ids = {p.get("id") or p.get("_id") for p in results}
        layer3_count = 0
        for pick in picks:
            if layer3_count >= remaining:
                break
            entity_id = pick.get("entity_id")
            etype = pick.get("entity_type", "product")
            full = products_map.get(entity_id) or services_map.get(entity_id) or bundles_map.get(entity_id)
            if full and entity_id not in already_ids:
                full = dict(full)
                full["mira_score"]  = pick.get("score")
                full["mira_reason"] = pick.get("mira_reason")
                full["entity_type"] = etype
                # Ensure product_type is set so frontend SharedProductCard detects service correctly
                if etype == "service":
                    full["product_type"] = "service"
                full["source"]      = "mira_product_scores"
                results.append(full)
                already_ids.add(entity_id)
                layer3_count += 1

    # ── Fallback: if not enough results, fill with breed-neutral top products ──────────
    if len(results) < limit // 2 and pillar:
        # Only trigger re-scoring if no scores exist at all (don't re-trigger if recently scored)
        existing_count = await _db.mira_product_scores.count_documents({"pet_id": pet_id, "pillar": pillar})
        if existing_count == 0:
            import asyncio
            asyncio.create_task(_run_full_scoring(pet_id, pillar, None))
        fb_q: dict = {"$or": [{"pillar": pillar}, {"pillars": pillar}], "active": {"$ne": False}, "price": {"$gt": 0}}
        if breed_clean:
            fb_q["$or"] = [
                {"breed_name": breed_clean}, {"breed_name": {"$in": ["all","All",""]}},
                {"$or": [{"pillar": pillar}, {"pillars": pillar}]},
            ]
        fb_cursor = _db.products_master.find(
            {"$and": [
                {"$or": [{"pillar": pillar}, {"pillars": pillar}]},
                {"active": {"$ne": False}},
                {"price": {"$gt": 0}},
                # ← BREED FILTER: never show wrong breed products in fallback
                {"$or": [
                    {"breed": breed_clean} if breed_clean else {"breed": {"$exists": False}},
                    {"breed": {"$in": ["all", "All", "", None, "none", "None"]}},
                    {"breed": {"$exists": False}},
                ]},
            ]},
            {"_id": 0}
        ).sort([("mira_score", -1)]).limit(limit)
        fallback = await fb_cursor.to_list(length=limit)
        for p in fallback:
            p["mira_reason"] = f"Top {pillar} pick — Mira is personalising scores for you."
            p["is_fallback"]  = True
        return {"picks": fallback, "count": len(fallback), "scoring_pending": True}

    # ── Life-stage filter: HIDE puppy products from adult/senior dogs ──────────
    # Fetch pet age to determine life stage
    pet_doc = await _db.pets.find_one(
        {"$or": [{"id": pet_id}, {"_id": pet_id}]},
        {"_id": 0, "age": 1, "age_years": 1}
    )
    if pet_doc:
        pet_age = float(pet_doc.get("age") or pet_doc.get("age_years") or 0)
        if pet_age >= 1:  # adult or senior → hide puppy products
            import re as re_mod
            def _is_puppy_product(item):
                check_fields = [
                    item.get("name",""), item.get("category",""), item.get("sub_category",""),
                    item.get("mira_tag",""), " ".join(item.get("tags",[]) if isinstance(item.get("tags"), list) else []),
                    " ".join(item.get("life_stages",[]) if isinstance(item.get("life_stages"), list) else []),
                ]
                text = " ".join(check_fields).lower()
                return bool(re_mod.search(r'\bpuppy\b|\bpuppies\b', text))
            results = [r for r in results if not _is_puppy_product(r)]

    return {"picks": results[:limit], "count": len(results[:limit]), "layers": {"soul": len(soul_products), "services": len(results) - len(soul_products) - layer3_count if "layer3_count" in dir() else 0, "scored": layer3_count if "layer3_count" in dir() else 0}}
    if service_ids:
        async for doc in _db.services_master.find({"id": {"$in": service_ids}}, {"_id": 0}):
            services_map[doc["id"]] = doc
    if bundle_ids:
        async for doc in _db.bundles.find({"id": {"$in": bundle_ids}}, {"_id": 0}):
            bundles_map[doc["id"]] = doc

    enriched = []
    for pick in picks:
        entity_id = pick.get("entity_id")
        etype = pick.get("entity_type", "product")
        if etype == "product":
            full = products_map.get(entity_id)
        elif etype == "service":
            full = services_map.get(entity_id)
        elif etype == "bundle":
            full = bundles_map.get(entity_id)
        else:
            full = None
        if full:
            full = dict(full)  # copy to avoid mutating cached map
            full["mira_score"] = pick.get("score")
            full["mira_reason"] = pick.get("mira_reason")
            full["entity_type"] = etype
            enriched.append(full)

    # Breed filter — only for products, when breed is supplied
    if breed and breed.strip():
        breed_lower = breed.lower().strip()
        filtered = []
        for item in enriched:
            if item.get("entity_type") != "product":
                filtered.append(item)
                continue
            targets = [b.lower() for b in (item.get("breed_targets") or [])]
            if not targets:
                filtered.append(item)  # no targets = universal
            elif "all" in targets or "all_breeds" in targets:
                filtered.append(item)
            elif any(breed_lower in t or t in breed_lower for t in targets):
                filtered.append(item)
        enriched = filtered

    # ── Fallback: if no scored picks, return top products for pillar ──────────
    # Critical: filter by pet's BREED and ALLERGIES so first impression feels personal
    if not enriched and pillar:
        # Only trigger scoring if no scores exist at all for this pet+pillar
        existing = await _db.mira_product_scores.count_documents({"pet_id": pet_id, "pillar": pillar})
        if existing == 0:
            import asyncio
            asyncio.create_task(_run_full_scoring(pet_id, pillar, None))

        # Build breed-aware query
        breed_clean = (breed or "").strip()
        breed_filter = {"$or": [
            {"breed": breed_clean} if breed_clean else {"breed": {"$exists": False}},
            {"breed": {"$in": ["all", "All", "", None]}},
            {"breed": {"$exists": False}},
        ]}

        # Build allergen exclusion — never show allergenic products on first impression
        conditions: list = [
            {"$or": [{"pillar": pillar}, {"pillars": pillar}]},
            {"active": {"$ne": False}},
            {"price": {"$gt": 0}},
            breed_filter,
        ]

        # Get pet allergies from DB
        try:
            pet_doc = await _db.pets.find_one({"id": pet_id}, {"_id": 0, "doggy_soul_answers": 1})
            if pet_doc:
                soul = pet_doc.get("doggy_soul_answers") or {} or {}
                allergies = [
                    a.lower() for a in soul.get("food_allergies", [])
                    if a and a.lower() not in ["none", "none known", "no_allergies", ""]
                ]
                ALLERGEN_MAP = {
                    "chicken": ["chicken", "poultry"],
                    "beef":    ["beef", "lamb"],
                    "grain":   ["wheat", "grain", "gluten"],
                    "dairy":   ["milk", "dairy", "cheese"],
                    "fish":    ["fish", "salmon", "tuna"],
                }
                for allergen in allergies:
                    kws = ALLERGEN_MAP.get(allergen, [allergen])
                    for kw in kws:
                        conditions.append({
                            "name": {"$not": {"$regex": kw, "$options": "i"}}
                        })
        except Exception:
            pass

        fallback_cursor = _db.products_master.find(
            {"$and": conditions}, {"_id": 0}
        ).sort([("mira_score", -1), ("name", 1)]).limit(limit)

        fallback = await fallback_cursor.to_list(length=limit)
        pet_breed_label = f" ({breed_clean})" if breed_clean else ""
        for p in fallback:
            p["mira_reason"] = f"Mira is personalising picks for {pet_id.split('-')[2].title() if pet_id else 'your pet'}{pet_breed_label} — best {pillar} picks while she learns more."
            p["is_fallback"] = True
        return {"picks": fallback, "count": len(fallback), "scoring_pending": True}

    return {
        "picks": enriched[:limit],
        "count": len(enriched[:limit]),
        "pet_id": pet_id,
        "pillar": pillar,
    }


@mira_score_router.get("/score-status/{pet_id}")
async def get_score_status(pet_id: str):
    """Check if scores exist for a pet and when they were last computed."""
    if _db is None:
        raise HTTPException(status_code=503, detail="DB not ready")

    latest = await _db.mira_product_scores.find_one(
        {"pet_id": pet_id},
        {"_id": 0, "scored_at": 1, "pet_name": 1},
        sort=[("scored_at", -1)],
    )
    count = await _db.mira_product_scores.count_documents({"pet_id": pet_id})

    return {
        "has_scores": count > 0,
        "count": count,
        "last_scored": latest.get("scored_at") if latest else None,
        "pet_name": latest.get("pet_name") if latest else None,
    }
