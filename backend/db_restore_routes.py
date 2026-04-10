"""
DB Restore Route — TDC Migration Tool
======================================
Reads the pre-exported .json.gz files from /migration_data/ and
bulk-upserts them into the target MongoDB.

Endpoint:  POST /api/admin/db/restore      — starts restore in background, returns immediately
Endpoint:  GET  /api/admin/db/restore-progress — poll this for live status
Endpoint:  GET  /api/admin/db/restore-status   — file availability check

This avoids the 60s Kubernetes proxy timeout on large restores (16,666 docs ~2 min).
"""

import asyncio
import gzip
import json
import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

logger = logging.getLogger(__name__)

restore_router = APIRouter(prefix="/api/admin/db", tags=["db-restore"])

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aditya")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "lola4304")

MIGRATION_DIR = Path(__file__).parent / "migration_data"

COLLECTIONS_CONFIG = [
    # ── Core user & pet data ──────────────────────────────────────────────────
    ("users",                    "users",                    "email"),
    ("pets",                     "pets",                     "id"),
    ("members",                  "members",                  "email"),
    ("memberships",              "memberships",              "id"),
    # ── Products & Services ───────────────────────────────────────────────────
    ("products_master",          "products_master",          "id"),
    ("breed_products",           "breed_products",           "id"),
    ("services_master",          "services_master",          "id"),
    ("service_catalog",          "service_catalog",          "id"),
    ("bundles",                  "bundles",                  "id"),
    ("product_bundles",          "product_bundles",          "id"),
    ("product_soul_tiers",       "product_soul_tiers",       "id"),
    ("unified_products",         "unified_products",         "id"),
    ("topic_products",           "topic_products",           "id"),
    ("collections",              "collections",              "id"),
    ("enhanced_collections",     "enhanced_collections",     "id"),
    ("occasion_box_templates",   "occasion_box_templates",   "id"),
    ("product_pricing",          "product_pricing",          "id"),
    ("products",                 "products",                 "id"),
    # ── Pillar bundles ────────────────────────────────────────────────────────
    ("guided_paths",             "guided_paths",             "id"),
    ("learn_guides",             "learn_guides",             "id"),
    ("care_bundles",             "care_bundles",             "id"),
    ("dine_bundles",             "dine_bundles",             "id"),
    ("celebrate_bundles",        "celebrate_bundles",        "id"),
    ("learn_bundles",            "learn_bundles",            "id"),
    ("advisory_bundles",         "advisory_bundles",         "id"),
    ("paperwork_bundles",        "paperwork_bundles",        "id"),
    ("stay_bundles",             "stay_bundles",             "id"),
    ("travel_bundles",           "travel_bundles",           "id"),
    ("enjoy_bundles",            "enjoy_bundles",            "id"),
    ("emergency_bundles",        "emergency_bundles",        "id"),
    ("adopt_bundles",            "adopt_bundles",            "id"),
    ("fit_bundles",              "fit_bundles",              "id"),
    ("farewell_bundles",         "farewell_bundles",         "id"),
    # ── Mira Intelligence ─────────────────────────────────────────────────────
    ("mira_conversations",       "mira_conversations",       "id"),
    ("mira_memories",            "mira_memories",            "id"),
    ("mira_tickets",             "mira_tickets",             "id"),
    ("mira_sessions",            "mira_sessions",            "id"),
    ("mira_inferences",          "mira_inferences",          "id"),
    ("mira_uploads",             "mira_uploads",             "id"),
    ("mira_product_scores",      "mira_product_scores",      "entity_id"),
    ("mira_signals",             "mira_signals",             "id"),
    ("conversation_memories",    "conversation_memories",    "id"),
    ("nudge_schedules",          "nudge_schedules",          "id"),
    # ── WhatsApp ──────────────────────────────────────────────────────────────
    ("whatsapp_logs",            "whatsapp_logs",            "id"),
    ("whatsapp_digest_log",      "whatsapp_digest_log",      "id"),
    ("live_conversation_threads","live_conversation_threads","id"),
    # ── Tickets & Inbox ───────────────────────────────────────────────────────
    ("service_desk_tickets",     "service_desk_tickets",     "ticket_id"),
    ("tickets",                  "tickets",                  "ticket_id"),
    ("unified_inbox",            "unified_inbox",            "id"),
    ("channel_intakes",          "channel_intakes",          "id"),
    ("service_requests",         "service_requests",         "id"),
    ("pillar_requests",          "pillar_requests",          "id"),
    ("concierge_intakes",        "concierge_intakes",        "id"),
    ("concierge_requests",       "concierge_requests",       "id"),
    ("concierge_picks_requests", "concierge_picks_requests", "id"),
    ("care_requests",            "care_requests",            "id"),
    ("dine_requests",            "dine_requests",            "id"),
    ("celebrate_requests",       "celebrate_requests",       "id"),
    ("enjoy_requests",           "enjoy_requests",           "id"),
    ("shop_requests",            "shop_requests",            "id"),
    ("travel_requests",          "travel_requests",          "id"),
    ("advisory_requests",        "advisory_requests",        "id"),
    ("abandoned_carts",          "abandoned_carts",          "id"),
    ("abandoned_cart_reminders", "abandoned_cart_reminders", "id"),
    # ── Orders & Payments ─────────────────────────────────────────────────────
    ("orders",                   "orders",                   "id"),
    ("birthday_box_orders",      "birthday_box_orders",      "id"),
    ("membership_orders",        "membership_orders",        "id"),
    ("cake_orders",              "cake_orders",              "id"),
    ("custom_orders",            "custom_orders",            "id"),
    ("payment_orders",           "payment_orders",           "id"),
    # ── Notifications & Logs ──────────────────────────────────────────────────
    ("admin_notifications",      "admin_notifications",      "id"),
    ("member_notifications",     "member_notifications",     "id"),
    ("email_logs",               "email_logs",               "idempotency_key"),
    ("events_log",               "events_log",               "message_id"),
    ("communication_log",        "communication_log",        "id"),
    # ── Content & CMS ─────────────────────────────────────────────────────────
    ("blog_posts",               "blog_posts",               "id"),
    ("faqs",                     "faqs",                     "id"),
    ("learn_content",            "learn_content",            "id"),
    ("learn_videos",             "learn_videos",             "id"),
    ("learn_topics",             "learn_topics",             "id"),
    ("learn_trainers",           "learn_trainers",           "id"),
    ("learn_programs",           "learn_programs",           "id"),
    ("learn_events",             "learn_events",             "id"),
    ("learn_cms_content",        "learn_cms_content",        "id"),
    ("paperwork_cms_content",    "paperwork_cms_content",    "id"),
    ("paperwork_cms_categories", "paperwork_cms_categories", "id"),
    ("pillar_cms_content",       "pillar_cms_content",       "id"),
    ("page_content",             "page_content",             "id"),
    ("page_configs",             "page_configs",             "id"),
    ("page_selections",          "page_selections",          "id"),
    ("quick_win_tips",           "quick_win_tips",           "id"),
    # ── Config & Settings ─────────────────────────────────────────────────────
    ("app_settings",             "app_settings",             "id"),
    ("settings",                 "settings",                 "id"),
    ("admin_config",             "admin_config",             "id"),
    ("landing_page_config",      "landing_page_config",      "id"),
    ("pricing_tiers",            "pricing_tiers",            "id"),
    ("shipping_rules",           "shipping_rules",           "id"),
    ("escalation_rules",         "escalation_rules",         "id"),
    ("ticket_templates",         "ticket_templates",         "id"),
    ("ticket_counters",          "ticket_counters",          "id"),
    ("notification_preferences", "notification_preferences", "id"),
    ("agents",                   "agents",                   "id"),
    # ── Partners & Brands ─────────────────────────────────────────────────────
    ("advisory_partners",        "advisory_partners",        "id"),
    ("farewell_partners",        "farewell_partners",        "id"),
    ("emergency_partners",       "emergency_partners",       "id"),
    ("fit_partners",             "fit_partners",             "id"),
    ("celebrate_partners",       "celebrate_partners",       "id"),
    # ── Products by pillar ────────────────────────────────────────────────────
    ("farewell_products",        "farewell_products",        "id"),
    ("celebrate_products",       "celebrate_products",       "id"),
    ("fit_products",             "fit_products",             "id"),
    ("fit_plans",                "fit_plans",                "id"),
    # ── Stay & Dining ─────────────────────────────────────────────────────────
    ("stay_properties",          "stay_properties",          "id"),
    ("pet_friendly_stays",       "pet_friendly_stays",       "id"),
    ("stay_boarding_facilities", "stay_boarding_facilities", "id"),
    ("restaurants",              "restaurants",              "id"),
    ("concierge_experiences",    "concierge_experiences",    "id"),
    ("enjoy_experiences",        "enjoy_experiences",        "id"),
    # ── Celebrate & Events ────────────────────────────────────────────────────
    ("celebration_photos",       "celebration_photos",       "id"),
    ("celebration_reminders",    "celebration_reminders",    "id"),
    ("kit_templates",            "kit_templates",            "id"),
    ("transformation_stories",   "transformation_stories",   "id"),
    # ── Pet Wrapped ───────────────────────────────────────────────────────────
    ("pet_wrapped",              "pet_wrapped",              "id"),
    ("pet_wrapped_memories",     "pet_wrapped_memories",     "id"),
    ("pet_wrapped_welcome",      "pet_wrapped_welcome",      "id"),
    ("wrapped_deliveries",       "wrapped_deliveries",       "id"),
    ("wrapped_shares",           "wrapped_shares",           "id"),
    # ── Adoption & Farewell ───────────────────────────────────────────────────
    ("adoptable_pets",           "adoptable_pets",           "id"),
    ("adopt_shelters",           "adopt_shelters",           "id"),
    ("adoption_events",          "adoption_events",          "id"),
    ("rainbow_bridge_memorials", "rainbow_bridge_memorials", "id"),
    # ── Learn & Content ───────────────────────────────────────────────────────
    ("team_members",             "team_members",             "id"),
    ("testimonials",             "testimonials",             "id"),
    ("featured_dogs",            "featured_dogs",            "id"),
    ("breed_matrix",             "breed_matrix",             "id"),
    ("pet_traits",               "pet_traits",               "id"),
    # ── Member Activity ───────────────────────────────────────────────────────
    ("paw_points_ledger",        "paw_points_ledger",        "id"),
    ("user_streaks",             "user_streaks",             "id"),
    ("pawrent_journey_progress", "pawrent_journey_progress", "id"),
    ("user_learn_intents",       "user_learn_intents",       "id"),
    ("health_reminders",         "health_reminders",         "id"),
    # ── Support & Activity ────────────────────────────────────────────────────
    ("services",                 "services",                 "id"),
    ("dismissed_alerts",         "dismissed_alerts",         "alert_id"),
    ("soul_score_history",       "soul_score_history",       "pet_id"),
    ("ticket_viewers",           "ticket_viewers",           "ticket_id"),
    ("learn_products",           "learn_products",           "id"),
    ("concierge_messages",       "concierge_messages",       "id"),
    ("concierge_threads",        "concierge_threads",        "id"),
    ("custom_cake_designs",      "custom_cake_designs",      "id"),
    ("member_password_resets",   "member_password_resets",   "email"),
    ("learn_requests",           "learn_requests",           "ticket_id"),
]

# ── In-memory restore progress state ─────────────────────────────────────────
_restore_state: dict = {
    "status": "idle",          # idle | running | complete | error
    "started_at": None,
    "finished_at": None,
    "current_collection": None,
    "collections_done": 0,
    "collections_total": len(COLLECTIONS_CONFIG),
    "total_docs": 0,
    "visitor_tickets_patched": 0,
    "collections": {},
    "errors": [],
    "duration_seconds": None,
}


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    ok_user = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    ok_pass = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (ok_user and ok_pass):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return credentials.username


def _clean_doc(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _load_jsonl_gz(path: Path) -> list:
    docs = []
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                docs.append(_clean_doc(json.loads(line)))
            except json.JSONDecodeError:
                pass
    return docs


async def _do_restore(drop_existing: bool = False):
    """
    Background restore task — runs independently of the HTTP request.
    Updates _restore_state so the frontend can poll progress.
    """
    from motor.motor_asyncio import AsyncIOMotorClient

    global _restore_state

    _restore_state.update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "current_collection": None,
        "collections_done": 0,
        "collections_total": len(COLLECTIONS_CONFIG),
        "total_docs": 0,
        "visitor_tickets_patched": 0,
        "pets_archetypes_inferred": 0,
        "collections": {},
        "errors": [],
        "duration_seconds": None,
    })

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name   = os.environ.get("DB_NAME", "pet-os-live-test_database")
    client    = AsyncIOMotorClient(mongo_url)
    db        = client[db_name]
    started   = datetime.now(timezone.utc)

    logger.info(f"[DB-RESTORE] Background restore started | drop={drop_existing}")

    for file_stem, collection_name, upsert_key in COLLECTIONS_CONFIG:
        _restore_state["current_collection"] = collection_name

        gz_path   = MIGRATION_DIR / f"{file_stem}.json.gz"
        json_path = MIGRATION_DIR / f"{file_stem}.json"

        if gz_path.exists():
            path, use_gz = gz_path, True
        elif json_path.exists():
            path, use_gz = json_path, False
        else:
            _restore_state["collections"][collection_name] = {"status": "skipped", "reason": "no file"}
            _restore_state["collections_done"] += 1
            continue

        try:
            if use_gz:
                docs = _load_jsonl_gz(path)
            else:
                docs = []
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                docs.append(_clean_doc(json.loads(line)))
                            except json.JSONDecodeError:
                                pass

            if not docs:
                _restore_state["collections"][collection_name] = {"status": "skipped", "reason": "empty file"}
                _restore_state["collections_done"] += 1
                continue

            collection = db[collection_name]

            if drop_existing:
                await collection.drop()

            inserted = updated = skipped = 0

            for doc in docs:
                key_val = doc.get(upsert_key)
                if key_val is None:
                    try:
                        await collection.insert_one(doc)
                        inserted += 1
                    except Exception:
                        skipped += 1
                    continue

                existing = await collection.find_one({upsert_key: key_val}, {"_id": 1})
                if existing:
                    await collection.update_one({upsert_key: key_val}, {"$set": doc})
                    updated += 1
                else:
                    await collection.insert_one(doc)
                    inserted += 1

            _restore_state["collections"][collection_name] = {
                "status": "ok", "total": len(docs),
                "inserted": inserted, "updated": updated, "skipped": skipped,
            }
            _restore_state["total_docs"] += len(docs)
            logger.info(f"[DB-RESTORE] {collection_name}: {inserted} ins, {updated} upd")

        except Exception as e:
            logger.error(f"[DB-RESTORE] Error on {collection_name}: {e}")
            _restore_state["errors"].append({"collection": collection_name, "error": str(e)})
            _restore_state["collections"][collection_name] = {"status": "error", "error": str(e)}

        _restore_state["collections_done"] += 1

    # ── Auto-backfill Website Visitor tickets ─────────────────────────────────
    _restore_state["current_collection"] = "patching visitor tickets..."
    tickets_fixed = 0
    try:
        cursor = db["service_desk_tickets"].find(
            {"member.name": "Website Visitor", "pet_name": {"$exists": True, "$ne": ""}},
            {"_id": 1, "ticket_id": 1, "pet_name": 1}
        )
        async for ticket in cursor:
            pet = await db["pets"].find_one(
                {"name": {"$regex": f"^{ticket.get('pet_name','')}$", "$options": "i"}},
                {"_id": 0, "owner_email": 1}
            )
            if not pet or not pet.get("owner_email"):
                continue
            owner = await db["users"].find_one(
                {"email": pet["owner_email"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            if not owner or not owner.get("name"):
                continue
            await db["service_desk_tickets"].update_one(
                {"_id": ticket["_id"]},
                {"$set": {
                    "member.name": owner["name"],
                    "member.email": owner.get("email", ""),
                    "customer_name": owner["name"],
                }}
            )
            tickets_fixed += 1
        _restore_state["visitor_tickets_patched"] = tickets_fixed
        logger.info(f"[DB-RESTORE] Visitor-ticket backfill: {tickets_fixed} patched")
    except Exception as bf_err:
        logger.warning(f"[DB-RESTORE] Backfill failed (non-fatal): {bf_err}")

    # ── Auto-run soul archetype inference for all pets ────────────────────────
    pets_inferred = 0
    _restore_state["current_collection"] = "inferring pet archetypes..."
    try:
        from archetype_routes import _infer_archetype
        from datetime import date as _date
        today_str = _date.today().isoformat()
        pets_cursor = await db.pets.find(
            {"doggy_soul_answers": {"$exists": True}},
            {"_id": 1, "name": 1, "doggy_soul_answers": 1}
        ).to_list(None)
        for pet in pets_cursor:
            soul = pet.get("doggy_soul_answers") or {}
            archetype, reason = _infer_archetype(soul)
            await db.pets.update_one(
                {"_id": pet["_id"]},
                {"$set": {
                    "primary_archetype":    archetype,
                    "archetype_reason":     reason,
                    "archetype_inferred_at": today_str,
                }}
            )
            pets_inferred += 1
        _restore_state["pets_archetypes_inferred"] = pets_inferred
        logger.info(f"[DB-RESTORE] Archetype inference: {pets_inferred} pets updated")
    except Exception as arch_err:
        logger.warning(f"[DB-RESTORE] Archetype inference failed (non-fatal): {arch_err}")
        _restore_state["pets_archetypes_inferred"] = 0

    client.close()

    finished = datetime.now(timezone.utc)
    duration = round((finished - started).total_seconds(), 1)

    _restore_state.update({
        "status": "complete" if not _restore_state["errors"] else "complete_with_errors",
        "finished_at": finished.isoformat(),
        "current_collection": None,
        "duration_seconds": duration,
    })
    logger.info(
        f"[DB-RESTORE] Done in {duration}s — {_restore_state['total_docs']} docs, "
        f"{tickets_fixed} tickets patched, "
        f"{_restore_state.get('pets_archetypes_inferred', 0)} pet archetypes inferred"
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@restore_router.get("/restore-status")
async def restore_status():
    """File availability check — no auth needed."""
    status = {}
    for file_stem, collection, _ in COLLECTIONS_CONFIG:
        gz_path   = MIGRATION_DIR / f"{file_stem}.json.gz"
        json_path = MIGRATION_DIR / f"{file_stem}.json"
        if gz_path.exists():
            with gzip.open(gz_path, "rt") as f:
                count = sum(1 for line in f if line.strip())
            status[collection] = {"file": f"{file_stem}.json.gz", "docs": count, "ready": True}
        elif json_path.exists():
            with open(json_path) as f:
                count = sum(1 for line in f if line.strip())
            status[collection] = {"file": f"{file_stem}.json", "docs": count, "ready": True}
        else:
            status[collection] = {"file": None, "docs": 0, "ready": False}

    return {"migration_dir": str(MIGRATION_DIR), "collections": status,
            "total_ready": sum(1 for v in status.values() if v["ready"])}


@restore_router.get("/restore-progress")
async def restore_progress():
    """Poll this endpoint for live restore status. No auth needed."""
    return _restore_state


@restore_router.post("/restore")
async def restore_database(
    background_tasks: BackgroundTasks,
    drop_existing: bool = False,
    admin: str = Depends(verify_admin),
):
    """
    Start the restore in the background and return immediately.
    Poll GET /restore-progress for live status.
    This avoids the 60s Kubernetes proxy timeout on large restores.
    """
    if _restore_state.get("status") == "running":
        return {
            "status": "already_running",
            "message": "Restore already in progress — poll /restore-progress for status.",
            "progress": _restore_state,
        }

    background_tasks.add_task(_do_restore, drop_existing)

    return {
        "status": "started",
        "message": "Restore running in background. Poll /api/admin/db/restore-progress every 2s.",
        "collections_total": len(COLLECTIONS_CONFIG),
    }
