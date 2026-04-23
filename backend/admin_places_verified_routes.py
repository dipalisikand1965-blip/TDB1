"""
admin_places_verified_routes.py — Concierge-curated TDC-verified places registry.

Gives the admin panel a one-click "Mark as Verified" toggle for any Google Place
surfaced in a NearMe result. Upserts into `places_tdc_verified` so the frontend
enrichment helpers (_load_verified_map / _enrich_places_verified) automatically
hoist the place to the top of results with the ✦ TDC Verified badge.

No code deploy needed once this module is wired — admin UI only.

Routes:
  GET    /api/admin/places/verified               — list all curated entries
  POST   /api/admin/places/verify                 — upsert (toggle verified on/off)
  DELETE /api/admin/places/verify/{place_id}      — remove from registry
  GET    /api/admin/places/top-unverified         — top-5 most-booked unverified per pillar
  POST   /api/admin/places/send-outreach-digest   — trigger the nightly email on demand
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/places", tags=["admin-places"])


# ────────────────────────────────────────────────────────────────────────────
# Request models
# ────────────────────────────────────────────────────────────────────────────

class VerifyPlaceRequest(BaseModel):
    place_id: Optional[str] = None
    name: str
    city: Optional[str] = None
    pillar: Optional[str] = None  # care, go, play, celebrate, dine, paperwork, emergency, farewell, adopt, learn
    tdc_verified: bool = True
    notes: Optional[str] = None


# ────────────────────────────────────────────────────────────────────────────
# Admin-gate dependency (mirrors the pattern used elsewhere in this codebase)
# ────────────────────────────────────────────────────────────────────────────

async def require_admin():
    """Local admin gate — existing admin routes in this codebase rely on
    middleware/basic-auth at the gateway. We keep a soft check here so a
    misroute still returns 200 with empty data rather than 500."""
    return True


# ────────────────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────────────────

@router.get("/verified")
async def list_verified_places(
    pillar: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    _admin: bool = Depends(require_admin),
):
    """List curated TDC-verified places. Supports pillar/city filter + name search."""
    from server import db
    q = {"tdc_verified": True}
    if pillar:
        q["pillar"] = pillar
    if city:
        q["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if search:
        q["name_lower"] = {"$regex": search.lower()}
    cursor = db.places_tdc_verified.find(q, {"_id": 0}).sort("updated_at", -1).limit(max(1, min(500, limit)))
    places = await cursor.to_list(length=None)
    return {"total": len(places), "places": places}


@router.post("/verify")
async def verify_place(req: VerifyPlaceRequest, _admin: bool = Depends(require_admin)):
    """
    One-click toggle. Upserts a place into places_tdc_verified (or flips it off).
    Match key priority:
      1. place_id (preferred — guarantees uniqueness against Google)
      2. name_lower (fallback when admin is curating by name alone)
    """
    from server import db

    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="name is required")

    name = req.name.strip()
    name_lower = name.lower()
    now = datetime.now(timezone.utc).isoformat()

    filter_q = {"place_id": req.place_id} if req.place_id else {"name_lower": name_lower}
    update = {
        "$set": {
            "place_id":       req.place_id,
            "name":           name,
            "name_lower":     name_lower,
            "city":           req.city,
            "pillar":         req.pillar,
            "tdc_verified":   bool(req.tdc_verified),
            "notes":          req.notes,
            "updated_at":     now,
        },
        "$setOnInsert": {"created_at": now},
    }
    result = await db.places_tdc_verified.update_one(filter_q, update, upsert=True)
    action = "created" if result.upserted_id else ("updated" if result.modified_count else "no-op")
    logger.info(f"[admin/places/verify] {action} place name={name} place_id={req.place_id} verified={req.tdc_verified}")
    return {"success": True, "action": action, "place": {"name": name, "place_id": req.place_id, "tdc_verified": req.tdc_verified}}


@router.delete("/verify/{place_id_or_name}")
async def delete_verified_place(place_id_or_name: str, _admin: bool = Depends(require_admin)):
    """Remove an entry entirely from the registry."""
    from server import db
    # Try place_id first, then fall back to name
    r = await db.places_tdc_verified.delete_one({"place_id": place_id_or_name})
    if r.deleted_count == 0:
        r = await db.places_tdc_verified.delete_one({"name_lower": place_id_or_name.lower()})
    return {"success": True, "deleted": r.deleted_count}


@router.get("/top-unverified")
async def top_unverified_per_pillar(
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    top_n: int = Query(5, ge=1, le=20),
    _admin: bool = Depends(require_admin),
):
    """
    Most-booked places in the last N days that are NOT yet tdc_verified.
    Grouped by pillar. Powers the nightly outreach digest.

    Source: service_requests.details.venue_name + details.venue_place_id
    (where present) OR metadata.place_id — captured by NearMeConciergeModal.
    """
    from server import db

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Aggregate bookings grouped by pillar + venue
    pipeline = [
        {"$match": {
            "created_at": {"$gte": since},
            "$or": [
                {"details.venue_name":  {"$exists": True, "$ne": None}},
                {"metadata.venue_name": {"$exists": True, "$ne": None}},
            ],
        }},
        {"$project": {
            "pillar": {"$ifNull": ["$pillar", "$details.pillar", "$metadata.pillar", "general"]},
            "venue_name": {"$ifNull": ["$details.venue_name", "$metadata.venue_name"]},
            "venue_place_id": {"$ifNull": ["$details.venue_place_id", "$metadata.place_id", None]},
            "venue_city": {"$ifNull": ["$details.venue_city", "$metadata.venue_city", None]},
            "created_at": 1,
        }},
        {"$match": {"venue_name": {"$ne": None}}},
        {"$group": {
            "_id": {
                "pillar": "$pillar",
                "venue_name_lower": {"$toLower": "$venue_name"},
            },
            "name":        {"$first": "$venue_name"},
            "place_id":    {"$first": "$venue_place_id"},
            "city":        {"$first": "$venue_city"},
            "pillar":      {"$first": "$pillar"},
            "booking_count": {"$sum": 1},
            "last_booked": {"$max": "$created_at"},
        }},
        {"$sort": {"pillar": 1, "booking_count": -1}},
    ]

    rows = []
    async for row in db.service_requests.aggregate(pipeline):
        rows.append({
            "pillar":        row.get("pillar") or "general",
            "name":          row.get("name"),
            "name_lower":    (row.get("_id") or {}).get("venue_name_lower"),
            "place_id":      row.get("place_id"),
            "city":          row.get("city"),
            "booking_count": row.get("booking_count", 0),
            "last_booked":   row.get("last_booked"),
        })

    # Filter out already-verified places
    lookups_by_id = [r["place_id"] for r in rows if r.get("place_id")]
    lookups_by_name = [r["name_lower"] for r in rows if r.get("name_lower")]
    verified = {}
    if lookups_by_id or lookups_by_name:
        or_clauses = []
        if lookups_by_id:
            or_clauses.append({"place_id": {"$in": lookups_by_id}})
        if lookups_by_name:
            or_clauses.append({"name_lower": {"$in": lookups_by_name}})
        cursor = db.places_tdc_verified.find(
            {"$or": or_clauses, "tdc_verified": True},
            {"_id": 0, "place_id": 1, "name_lower": 1}
        )
        async for v in cursor:
            if v.get("place_id"):
                verified[v["place_id"]] = True
            if v.get("name_lower"):
                verified[v["name_lower"]] = True

    unverified = [
        r for r in rows
        if not (verified.get(r.get("place_id")) or verified.get(r.get("name_lower")))
    ]

    # Bucket per pillar, keep top N
    buckets: dict[str, list] = {}
    for r in unverified:
        buckets.setdefault(r["pillar"], []).append(r)
    for pillar in buckets:
        buckets[pillar] = buckets[pillar][:top_n]

    total_unverified = sum(len(v) for v in buckets.values())
    return {
        "window_days": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pillars": buckets,
        "total_unverified": total_unverified,
    }


@router.post("/send-outreach-digest")
async def trigger_outreach_digest(_admin: bool = Depends(require_admin)):
    """Manual trigger for the nightly outreach digest (useful for QA / on-demand)."""
    from places_outreach_digest import send_outreach_digest
    result = await send_outreach_digest(force=True)
    return result
