"""
integrations_health_routes.py — Critical Integrations Health Panel.

Single endpoint that aggregates the live status of every external integration
TDC depends on. Designed to catch silent kill-switches (e.g. ZOHO_ENABLED=false)
in 2 seconds at a glance.

GET /api/admin/integrations-health
  → { integrations: [...], generated_at, all_healthy: bool }

Each integration returns:
  {
    id: 'zoho',
    name: 'Zoho Desk',
    status: 'green' | 'amber' | 'red',
    enabled: bool,
    configured: bool,
    summary: 'Active · last push 2 min ago',
    last_activity: '2026-04-27T03:13:22Z' | null,
    detail: { ... freeform per integration ... }
  }
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ────────────────────────────────────────────────────────────────────────────

def _hours_since(iso_str) -> Optional[float]:
    if not iso_str:
        return None
    try:
        if isinstance(iso_str, datetime):
            dt = iso_str if iso_str.tzinfo else iso_str.replace(tzinfo=timezone.utc)
        else:
            dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        return round((datetime.now(timezone.utc) - dt).total_seconds() / 3600, 2)
    except Exception:
        return None


def _ago_label(hours: Optional[float]) -> str:
    if hours is None:
        return "no activity yet"
    if hours < 1 / 60:
        return "just now"
    if hours < 1:
        return f"{int(hours * 60)} min ago"
    if hours < 24:
        return f"{round(hours, 1)}h ago"
    return f"{round(hours / 24, 1)}d ago"


def _status_from_age(hours: Optional[float], green_thresh_h: float, amber_thresh_h: float) -> str:
    if hours is None:
        return "amber"
    if hours <= green_thresh_h:
        return "green"
    if hours <= amber_thresh_h:
        return "amber"
    return "red"


# ────────────────────────────────────────────────────────────────────────────
# Per-integration probes
# ────────────────────────────────────────────────────────────────────────────

async def _probe_zoho(db) -> dict:
    enabled = os.environ.get("ZOHO_ENABLED", "false").lower() == "true"
    configured = all(os.environ.get(k) for k in [
        "ZOHO_DC", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET",
        "ZOHO_REFRESH_TOKEN", "ZOHO_ORG_ID", "ZOHO_DEPARTMENT_ID",
    ])
    last = None
    error_count_24h = 0
    try:
        last_doc = await db.zoho_sync_log.find_one(
            {"status": "success"}, sort=[("timestamp", -1)]
        )
        if last_doc:
            last = last_doc.get("timestamp")
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        error_count_24h = await db.zoho_sync_log.count_documents({
            "status": {"$ne": "success"},
            "timestamp": {"$gte": cutoff},
        })
    except Exception as e:
        logger.warning(f"[health/zoho] {e}")

    hours = _hours_since(last)
    if not enabled:
        status = "red"
        summary = "❌ DISABLED — flip ZOHO_ENABLED=true on production secrets"
    elif not configured:
        status = "red"
        summary = "Missing one or more credentials in env"
    else:
        status = _status_from_age(hours, 6, 48)
        summary = f"Active · last push {_ago_label(hours)}"
        if error_count_24h:
            status = "amber" if status == "green" else status
            summary += f" · {error_count_24h} errors in 24h"

    return {
        "id": "zoho",
        "name": "Zoho Desk",
        "category": "Service Desk",
        "status": status,
        "enabled": enabled,
        "configured": configured,
        "summary": summary,
        "last_activity": last,
        "detail": {
            "dc": os.environ.get("ZOHO_DC", "(unset)"),
            "department_id": os.environ.get("ZOHO_DEPARTMENT_ID", "(unset)"),
            "errors_24h": error_count_24h,
        },
    }


async def _probe_resend(db) -> dict:
    enabled = bool(os.environ.get("RESEND_API_KEY"))
    last = None
    try:
        last_doc = await db.email_log.find_one(
            {"status": {"$in": ["sent", "delivered", "success"]}},
            sort=[("sent_at", -1), ("created_at", -1)],
        )
        if last_doc:
            last = last_doc.get("sent_at") or last_doc.get("created_at")
        if not last:
            # Fallback: outreach digest log
            od = await db.outreach_digest_log.find_one({"_id": "last_sent"})
            if od:
                last = od.get("sent_at_utc")
    except Exception as e:
        logger.warning(f"[health/resend] {e}")

    hours = _hours_since(last)
    status = "red" if not enabled else _status_from_age(hours, 30, 72)
    if not enabled:
        summary = "❌ RESEND_API_KEY not set"
    else:
        summary = f"Active · last email {_ago_label(hours)}"

    return {
        "id": "resend",
        "name": "Resend (Email)",
        "category": "Email",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {},
    }


async def _probe_cloudinary(db) -> dict:
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    enabled = bool(cloud_name and api_key)
    last = None
    try:
        # Pick any collection that records uploads
        for col, ts_field in [
            ("cloudinary_uploads", "uploaded_at"),
            ("media_uploads", "created_at"),
            ("photos", "uploaded_at"),
        ]:
            try:
                doc = await db[col].find_one({}, sort=[(ts_field, -1)])
                if doc and (doc.get(ts_field) or doc.get("created_at")):
                    last = doc.get(ts_field) or doc.get("created_at")
                    break
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"[health/cloudinary] {e}")

    hours = _hours_since(last)
    if not enabled:
        status, summary = "red", "❌ Not configured"
    elif hours is None:
        # No upload log yet — still healthy if configured
        status, summary = "green", "Configured (no recent upload tracked)"
    else:
        status = _status_from_age(hours, 168, 720)  # 7 days green, 30 days amber
        summary = f"Configured · last upload {_ago_label(hours)}"

    return {
        "id": "cloudinary",
        "name": "Cloudinary",
        "category": "File Storage",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {"cloud_name": cloud_name or "(unset)"},
    }


async def _probe_razorpay(db) -> dict:
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    enabled = bool(key_id and key_secret)
    last = None
    try:
        last_order = await db.orders.find_one(
            {"payment_status": {"$in": ["paid", "captured", "completed"]}},
            sort=[("created_at", -1)],
        )
        if last_order:
            last = last_order.get("created_at")
    except Exception as e:
        logger.warning(f"[health/razorpay] {e}")

    hours = _hours_since(last)
    if not enabled:
        status, summary = "red", "❌ Not configured"
    else:
        status = _status_from_age(hours, 168, 720) if hours is not None else "green"
        summary = f"Active · last order {_ago_label(hours)}" if hours is not None else "Active (no orders yet)"

    return {
        "id": "razorpay",
        "name": "Razorpay",
        "category": "Payments",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {"mode": "test" if (key_id or "").startswith("rzp_test_") else "live"},
    }


async def _probe_gupshup(db) -> dict:
    api_key = os.environ.get("GUPSHUP_API_KEY")
    src = os.environ.get("WHATSAPP_NUMBER")
    enabled = bool(api_key and src)
    last = None
    try:
        for col, ts_field in [
            ("whatsapp_log", "sent_at"),
            ("whatsapp_messages", "created_at"),
            ("messaging_log", "timestamp"),
        ]:
            try:
                doc = await db[col].find_one(
                    {"channel": "whatsapp"} if col == "messaging_log" else {},
                    sort=[(ts_field, -1)],
                )
                if doc and (doc.get(ts_field) or doc.get("created_at")):
                    last = doc.get(ts_field) or doc.get("created_at")
                    break
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"[health/gupshup] {e}")

    hours = _hours_since(last)
    if not enabled:
        status, summary = "red", "❌ Not configured"
    elif hours is None:
        status, summary = "green", "Configured (no recent send tracked)"
    else:
        status = _status_from_age(hours, 24, 168)
        summary = f"Active · last WhatsApp {_ago_label(hours)}"

    return {
        "id": "gupshup",
        "name": "Gupshup (WhatsApp)",
        "category": "Messaging",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {"sender": src or "(unset)"},
    }


async def _probe_sitevault(db) -> dict:
    enabled = os.environ.get("SITEVAULT_ENABLED", "false").lower() == "true"
    last = None
    last_size = 0
    last_status = None
    try:
        doc = await db.sitevault_runs.find_one(
            {"status": "success"}, sort=[("started_at", -1)]
        )
        if doc:
            last = doc.get("completed_at") or doc.get("started_at")
            last_size = doc.get("bytes_uploaded", 0)
            last_status = doc.get("status")
    except Exception as e:
        logger.warning(f"[health/sitevault] {e}")

    hours = _hours_since(last)
    if not enabled:
        status, summary = "red", "❌ SITEVAULT_ENABLED=false"
    elif hours is None:
        status, summary = "red", "No backups recorded"
    else:
        status = _status_from_age(hours, 30, 50)
        mb = round(last_size / 1024 / 1024, 1) if last_size else 0
        summary = f"Last backup {_ago_label(hours)} · {mb} MB"

    return {
        "id": "sitevault",
        "name": "SiteVault (Google Drive)",
        "category": "Backups",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {"last_status": last_status or "(none)"},
    }


async def _probe_google_places(db) -> dict:
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY") or os.environ.get("GOOGLE_MAPS_API_KEY")
    enabled = bool(api_key)
    last = None
    try:
        # places_tdc_verified records imply working Places fetches
        doc = await db.places_tdc_verified.find_one({}, sort=[("updated_at", -1)])
        if doc:
            last = doc.get("updated_at") or doc.get("created_at")
    except Exception as e:
        logger.warning(f"[health/places] {e}")

    hours = _hours_since(last)
    if not enabled:
        status, summary = "red", "❌ API key not set"
    elif hours is None:
        status, summary = "amber", "Configured (no place lookups tracked)"
    else:
        status = _status_from_age(hours, 168, 720)
        summary = f"Active · last verified-place update {_ago_label(hours)}"

    return {
        "id": "google_places",
        "name": "Google Places API",
        "category": "Maps",
        "status": status,
        "enabled": enabled,
        "configured": enabled,
        "summary": summary,
        "last_activity": last,
        "detail": {},
    }


async def _probe_atlas(db) -> dict:
    """MongoDB Atlas hot standby — expected to be off until migration done."""
    atlas_url = os.environ.get("MONGO_ATLAS_URL") or os.environ.get("ATLAS_MONGO_URL")
    enabled = bool(atlas_url)
    last = None
    try:
        doc = await db.sitevault_runs.find_one(
            {"type": "atlas_sync", "status": "success"},
            sort=[("started_at", -1)],
        )
        if doc:
            last = doc.get("completed_at") or doc.get("started_at")
    except Exception:
        pass

    if not enabled:
        return {
            "id": "atlas",
            "name": "MongoDB Atlas (hot standby)",
            "category": "Backups",
            "status": "amber",
            "enabled": False,
            "configured": False,
            "summary": "Not configured (expected — migration not done yet)",
            "last_activity": last,
            "detail": {"note": "Weekend-project rail. Free tier sign-up takes 30 min."},
        }
    hours = _hours_since(last)
    return {
        "id": "atlas",
        "name": "MongoDB Atlas (hot standby)",
        "category": "Backups",
        "status": _status_from_age(hours, 30, 50),
        "enabled": True,
        "configured": True,
        "summary": f"Active · last sync {_ago_label(hours)}",
        "last_activity": last,
        "detail": {},
    }


async def _probe_uptime_robot(db) -> dict:
    """We can't directly query UptimeRobot, but we infer from pod-wake patterns."""
    # If sitevault_status_email_log was sent today, pod was awake at 8 AM IST → keepalive working
    last_email = None
    try:
        doc = await db.sitevault_status_email_log.find_one({"_id": "last_sent"})
        if doc:
            last_email = doc.get("sent_at_utc")
    except Exception:
        pass

    hours = _hours_since(last_email)
    if hours is None:
        status, summary = "amber", "Not yet inferable — set up at https://uptimerobot.com pinging /api/sitevault/health"
    else:
        # If status email fired in last 30h, keepalive (or scheduler) is working
        status = _status_from_age(hours, 30, 50)
        summary = f"Pod awake · last status email {_ago_label(hours)}"

    return {
        "id": "uptime_robot",
        "name": "UptimeRobot Keepalive",
        "category": "Monitoring",
        "status": status,
        "enabled": hours is not None,
        "configured": True,
        "summary": summary,
        "last_activity": last_email,
        "detail": {
            "url_to_ping": "https://thedoggycompany.com/api/sitevault/health",
            "recommended_interval": "5 minutes",
        },
    }


# ────────────────────────────────────────────────────────────────────────────
# Aggregator
# ────────────────────────────────────────────────────────────────────────────

@router.get("/integrations-health")
async def integrations_health():
    """Live health of all external integrations."""
    from server import db

    probes = [
        _probe_zoho,
        _probe_resend,
        _probe_cloudinary,
        _probe_razorpay,
        _probe_gupshup,
        _probe_sitevault,
        _probe_google_places,
        _probe_atlas,
        _probe_uptime_robot,
    ]

    integrations = []
    for probe in probes:
        try:
            result = await probe(db)
        except Exception as e:
            logger.exception(f"[health] probe {probe.__name__} crashed: {e}")
            result = {
                "id": probe.__name__.replace("_probe_", ""),
                "name": probe.__name__,
                "category": "Unknown",
                "status": "amber",
                "summary": f"Probe error: {str(e)[:120]}",
                "enabled": False,
                "configured": False,
                "last_activity": None,
                "detail": {},
            }
        integrations.append(result)

    counts = {
        "green": sum(1 for i in integrations if i["status"] == "green"),
        "amber": sum(1 for i in integrations if i["status"] == "amber"),
        "red":   sum(1 for i in integrations if i["status"] == "red"),
    }
    all_healthy = counts["red"] == 0

    return {
        "integrations": integrations,
        "counts": counts,
        "all_healthy": all_healthy,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ────────────────────────────────────────────────────────────────────────────
# Multi-pet name detector (Shirley bug — Apr 27 2026)
# Finds pets whose `name` field contains commas/semicolons/" and " — i.e.
# users who typed multiple dog names into one pet record.
# ────────────────────────────────────────────────────────────────────────────

@router.get("/find-multi-name-pets")
async def find_multi_name_pets(secret: str = "", limit: int = 200):
    """Return all pets whose name field appears to contain MULTIPLE dog names."""
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("ADMIN_SECRET")
    if not expected or secret != expected:
        raise HTTPException(status_code=401, detail="Admin secret required (?secret=...)")

    from server import db
    import re

    # Match commas, semicolons, " and " (case-insensitive), " & ", or "/"
    bad_pattern = re.compile(r"[,;/&]| and ", re.IGNORECASE)

    affected_pets = []
    affected_owners = {}  # owner_email → list of pet docs

    try:
        cursor = db.pets.find(
            {"name": {"$regex": "[,;/&]| and ", "$options": "i"}},
            {"_id": 0, "id": 1, "pet_id": 1, "name": 1, "breed": 1, "owner_email": 1, "user_email": 1, "created_at": 1},
        ).limit(limit)
        async for p in cursor:
            owner = p.get("owner_email") or p.get("user_email") or "(unknown)"
            entry = {
                "pet_id": p.get("id") or p.get("pet_id"),
                "name": p.get("name"),
                "breed": p.get("breed"),
                "owner_email": owner,
                "created_at": p.get("created_at"),
                "names_detected": [s.strip() for s in bad_pattern.split(p.get("name", "")) if s.strip()],
            }
            affected_pets.append(entry)
            affected_owners.setdefault(owner, []).append(entry)
    except Exception as e:
        logger.exception(f"[find-multi-name-pets] {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "total_affected_pets": len(affected_pets),
        "total_affected_owners": len(affected_owners),
        "by_owner": affected_owners,
        "all_affected": affected_pets,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
