"""
SiteVault HTTP Routes
=======================
  GET  /api/sitevault/health          — config + quota snapshot
  POST /api/sitevault/test-connection — live Drive ping (admin)
  POST /api/sitevault/run-daily-now   — trigger a daily backup now (admin)
  POST /api/sitevault/run-weekly-now  — trigger a weekly backup now (admin)
  POST /api/sitevault/cleanup-now     — run retention cleaner now (admin)
  GET  /api/sitevault/runs            — list recent backup runs
  GET  /api/sitevault/list/{folder}   — list files in a sub-folder
  POST /api/sitevault/pin-gold-master/{file_id} — pin forever (admin)
"""
import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, BackgroundTasks, Query

import sitevault_drive_client as drive
import sitevault_backup_jobs as jobs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sitevault", tags=["sitevault"])

_db = None


def set_db(database):
    global _db
    _db = database
    jobs.set_db(database)


def _require_admin(x_admin_secret: Optional[str]):
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("SITEVAULT_ADMIN_SECRET")
    if not expected:
        logger.warning("[SITEVAULT] No ADMIN_PASSWORD — admin endpoint unprotected")
        return
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Admin secret required")


# ─────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    status = drive.config_status()
    status["ok"] = status["enabled"] and status["configured"]
    # Try quota if configured
    if status["configured"]:
        try:
            status["quota"] = drive.storage_quota()
        except Exception as e:
            status["quota_error"] = str(e)[:200]
    return status


@router.post("/test-connection")
async def test_connection(x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if not drive.is_configured():
        raise HTTPException(status_code=400, detail="SiteVault not configured")
    try:
        # Force a token refresh + folder tree ensure
        folders = drive.ensure_folder_tree()
        quota = drive.storage_quota()
        return {
            "success": True,
            "email": quota.get("email"),
            "folder_tree": folders,
            "quota_gb_used": round(quota.get("usage_bytes", 0) / 1024**3, 2),
            "quota_gb_limit": round(quota["limit_bytes"] / 1024**3, 2) if quota.get("limit_bytes") else None,
        }
    except Exception as e:
        logger.exception("[SITEVAULT] test-connection failed")
        raise HTTPException(status_code=502, detail=str(e)[:400])


# ─────────────────────────────────────────────────────────────────────
# MANUAL TRIGGERS
# ─────────────────────────────────────────────────────────────────────
@router.post("/run-daily-now")
async def run_daily_now(
    background_tasks: BackgroundTasks,
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="Set SITEVAULT_ENABLED=true first")
    background_tasks.add_task(_safe_daily)
    return {"started": True, "type": "daily", "note": "Poll /api/sitevault/runs for status"}


@router.post("/run-weekly-now")
async def run_weekly_now(
    background_tasks: BackgroundTasks,
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="Set SITEVAULT_ENABLED=true first")
    background_tasks.add_task(_safe_weekly)
    return {"started": True, "type": "weekly", "note": "This may take 30+ minutes if Cloudinary full backup is on"}


@router.post("/send-status-email-now")
async def send_status_email_now(x_admin_secret: Optional[str] = Header(None)):
    """Manually fire the daily SiteVault status email (for QA / on-demand)."""
    _require_admin(x_admin_secret)
    from sitevault_daily_status_email import send_sitevault_daily_status
    return await send_sitevault_daily_status()


@router.post("/send-weekly-summary-now")
async def send_weekly_summary_now(x_admin_secret: Optional[str] = Header(None)):
    """Manually fire the Monday weekly summary email (for QA / on-demand)."""
    _require_admin(x_admin_secret)
    from sitevault_weekly_summary_email import send_weekly_summary
    return await send_weekly_summary()


@router.post("/cleanup-now")
async def cleanup_now(x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="Set SITEVAULT_ENABLED=true first")
    try:
        return jobs.run_retention_cleaner()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)[:400])


async def _safe_daily():
    try:
        await jobs.run_daily_backup()
    except Exception as e:
        logger.exception(f"[SITEVAULT] daily backup crashed: {e}")


async def _safe_weekly():
    try:
        await jobs.run_weekly_backup()
    except Exception as e:
        logger.exception(f"[SITEVAULT] weekly backup crashed: {e}")


# ─────────────────────────────────────────────────────────────────────
# AUDIT
# ─────────────────────────────────────────────────────────────────────
@router.get("/runs")
async def list_runs(limit: int = Query(20, ge=1, le=100),
                    x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if _db is None:
        return {"runs": []}
    cursor = _db.sitevault_runs.find({}, {"_id": 0}).sort("started_at", -1).limit(limit)
    return {"runs": [doc async for doc in cursor]}


@router.get("/list/{folder_name}")
async def list_folder(folder_name: str,
                      limit: int = Query(100, ge=1, le=2000),
                      x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if folder_name not in drive.SUBFOLDERS:
        raise HTTPException(status_code=400, detail=f"folder must be one of {drive.SUBFOLDERS}")
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="SiteVault disabled")
    fid = drive.ensure_subfolder(folder_name)
    return {"folder": folder_name, "folder_id": fid,
            "files": drive.list_files(fid, limit=limit)}


@router.post("/pin-gold-master/{file_id}")
async def pin_gold(file_id: str, x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="SiteVault disabled")
    try:
        drive.pin_gold_master(file_id)
        return {"success": True, "file_id": file_id, "status": "pinned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)[:300])
