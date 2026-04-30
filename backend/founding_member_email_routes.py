"""
Founding Member Email Test + Orchestrator Routes
─────────────────────────────────────────────────
  POST /api/admin/founding-emails/preview/{token}     — render only (no send)
  POST /api/admin/founding-emails/test-send           — single test send to override email
                                                        (used by Dipali for phone-approval QA)

Orchestrator endpoints (built next, after Dipali approves the test email):
  POST /api/admin/founding-emails/run-wave             — send today's batch (manual trigger)
  GET  /api/admin/founding-emails/wave-status          — live progress
  POST /api/admin/founding-emails/pause                — emergency stop
"""
from __future__ import annotations
import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Header, HTTPException, Body
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

import resend

from founding_member_email_templates import build_email, BRAND_FROM_NAME, BRAND_FROM_EMAIL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/founding-emails", tags=["founding-emails"])

_RESEND_KEY = os.environ.get("RESEND_API_KEY")
if _RESEND_KEY:
    resend.api_key = _RESEND_KEY


# ── DB connection (shared with admin viewer) ─────────────────────────
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


async def _load_parent_with_pet(token: str) -> Dict[str, Any]:
    db = _get_db()
    parent = await db.pet_parents.find_one({"invite_token": token, "is_deleted": {"$ne": True}})
    if not parent:
        raise HTTPException(404, f"No parent with token {token}")
    primary_pet = None
    staging_ids = parent.get("pets_staging_ids") or []
    if staging_ids:
        primary_pet = await db.tdb_pets_staging.find_one(
            {"staging_id": {"$in": staging_ids}, "is_deleted": {"$ne": True},
             "is_rainbow_bridge": {"$ne": True}}
        )
    parent.pop("_id", None)
    if primary_pet:
        primary_pet.pop("_id", None)
    return {"parent": parent, "primary_pet": primary_pet}


# ── 1. Preview (render only — no send) ───────────────────────────────
@router.post("/preview/{token}")
async def preview(token: str, x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret")):
    _require_admin(x_admin_secret)
    bundle = await _load_parent_with_pet(token)
    rendered = build_email(bundle["parent"], bundle.get("primary_pet"))
    return {
        "ok": True,
        "tier": rendered["tier"],
        "subject": rendered["subject"],
        "preheader": rendered["preheader"],
        "to": rendered["to"],
        "to_name": rendered["to_name"],
        "html_length": len(rendered["html"]),
        "text": rendered["text"],
        "html": rendered["html"],
    }


# ── 2. Test send to an override address (for Dipali's phone QA) ──────
class TestSendBody(BaseModel):
    token: str               # founding-member token to use as data source
    to: str                  # override recipient (e.g. dipali@clubconcierge.in)
    cc: Optional[List[str]] = None


@router.post("/test-send")
async def test_send(
    body: TestSendBody,
    x_admin_secret: Optional[str] = Header(None, alias="x-admin-secret"),
):
    _require_admin(x_admin_secret)
    if not _RESEND_KEY:
        raise HTTPException(500, "RESEND_API_KEY not configured")
    bundle = await _load_parent_with_pet(body.token)
    rendered = build_email(bundle["parent"], bundle.get("primary_pet"))

    payload = {
        "from": f"{BRAND_FROM_NAME} <{BRAND_FROM_EMAIL}>",
        "to": [body.to],
        "subject": f"[TEST · {rendered['tier']}] " + rendered["subject"],
        "html": rendered["html"],
        "text": rendered["text"],
        "headers": {
            "X-Founding-Test": "true",
            "X-Founding-Tier": rendered["tier"],
        },
        "reply_to": "hello@thedoggycompany.com",
    }
    if body.cc:
        payload["cc"] = body.cc

    try:
        resp = resend.Emails.send(payload)
    except Exception as e:
        logger.exception("[founding-emails][test] send failed")
        raise HTTPException(500, f"Resend error: {e}")

    return {
        "ok": True,
        "tier": rendered["tier"],
        "subject": rendered["subject"],
        "to": body.to,
        "resend_id": resp.get("id") if isinstance(resp, dict) else str(resp),
        "preview_token": body.token,
        "source_parent": {
            "first_name": bundle["parent"].get("first_name"),
            "primary_pet": (bundle.get("primary_pet") or {}).get("name") or bundle["parent"].get("primary_pet_name"),
            "intelligence_tier": bundle["parent"].get("intelligence_tier"),
        },
    }
