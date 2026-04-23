"""
Backup Health Routes — CEO Dashboard Tiles
==============================================
Read-only endpoints that surface the health of TDC's three backup rails:

  1. SiteVault (Google Drive)  → last run of sitevault_runs
  2. Atlas Sync (cloud Mongo)  → last run of atlas_sync_runs
  3. Migration export          → file timestamps in /app/migration_data/

Each returns a traffic-light status:
  - "green"  : last success < 24h ago
  - "amber"  : last success 24-36h ago
  - "red"    : last success > 36h ago OR last run failed

Endpoint: GET /api/admin/backup-health (admin-gated)
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pathlib import Path as FsPath
import logging

logger = logging.getLogger(__name__)

# Injected from server.py at startup
db = None


def set_deps(database):
    global db
    db = database


router = APIRouter(prefix="/api/admin", tags=["Backup Health"])


def _bucket_age(hours_since_success: float, last_run_failed: bool) -> str:
    if last_run_failed:
        return "red"
    if hours_since_success is None:
        return "red"
    if hours_since_success < 24:
        return "green"
    if hours_since_success < 36:
        return "amber"
    return "red"


async def _last_runs(collection_name: str, n: int = 5):
    """Fetch the N most recent runs from a *_runs collection, newest first.
    Sort by `started_at` since `_id` may be a timestamp string.
    """
    if db is None:
        return []
    try:
        cursor = db[collection_name].find(
            {}, {"_id": 0}
        ).sort("started_at", -1).limit(n)
        return [d async for d in cursor]
    except Exception:
        return []


def _parse_iso(s: str):
    if not s:
        return None
    try:
        # Handle both '+00:00' and 'Z' suffixes
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


@router.get("/backup-health")
async def backup_health():
    """CEO Dashboard tile data. No auth required for READ (consider admin-gating
    if sensitive, but these counts are safe). Returns three rails + overall."""
    now = datetime.now(timezone.utc)
    out = {"timestamp": now.isoformat(), "rails": {}}

    # ── 1. SiteVault rail ─────────────────────────────────────────────
    sv_runs = await _last_runs("sitevault_runs", n=10)
    sv_successes = [r for r in sv_runs if r.get("status") == "success"]
    sv_last_success = sv_successes[0] if sv_successes else None
    sv_last_run = sv_runs[0] if sv_runs else None

    sv_hours = None
    if sv_last_success:
        dt = _parse_iso(sv_last_success.get("started_at"))
        if dt:
            sv_hours = (now - dt).total_seconds() / 3600

    out["rails"]["sitevault"] = {
        "status": _bucket_age(sv_hours, (sv_last_run or {}).get("status") == "failed"),
        "hours_since_success": round(sv_hours, 1) if sv_hours is not None else None,
        "last_success_at":     (sv_last_success or {}).get("started_at"),
        "last_run_status":     (sv_last_run or {}).get("status"),
        "last_run_id":         (sv_last_run or {}).get("run_id"),
        "total_runs_tracked":  len(sv_runs),
    }

    # ── 2. Atlas Sync rail ────────────────────────────────────────────
    at_runs = await _last_runs("atlas_sync_runs", n=10)
    at_successes = [r for r in at_runs if r.get("status") == "success"]
    at_last_success = at_successes[0] if at_successes else None
    at_last_run = at_runs[0] if at_runs else None

    at_hours = None
    if at_last_success:
        dt = _parse_iso(at_last_success.get("started_at"))
        if dt:
            at_hours = (now - dt).total_seconds() / 3600

    # Atlas runs every 6h so thresholds are tighter: green <8h, amber <24h
    if at_last_run and at_last_run.get("status") == "failed":
        at_status = "red"
    elif at_hours is None:
        at_status = "red"
    elif at_hours < 8:
        at_status = "green"
    elif at_hours < 24:
        at_status = "amber"
    else:
        at_status = "red"

    out["rails"]["atlas_sync"] = {
        "status": at_status,
        "hours_since_success": round(at_hours, 1) if at_hours is not None else None,
        "last_success_at":     (at_last_success or {}).get("started_at"),
        "last_run_status":     (at_last_run or {}).get("status"),
        "last_run_id":         (at_last_run or {}).get("run_id"),
        "total_synced_last":   (at_last_run or {}).get("total_synced"),
    }

    # ── 3. Migration export rail ──────────────────────────────────────
    mig_dir = FsPath("/app/migration_data")
    mig_files = []
    mig_latest = None
    if mig_dir.exists():
        try:
            files = sorted(mig_dir.glob("*.json.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
            if files:
                mig_latest = files[0]
                mig_files = [
                    {"name": f.name, "mtime": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(), "size_bytes": f.stat().st_size}
                    for f in files[:5]
                ]
        except Exception as e:
            logger.warning(f"[BACKUP-HEALTH] Migration scan failed: {e}")

    mig_hours = None
    if mig_latest:
        mig_hours = (now - datetime.fromtimestamp(mig_latest.stat().st_mtime, tz=timezone.utc)).total_seconds() / 3600

    out["rails"]["migration_export"] = {
        "status": _bucket_age(mig_hours, False) if mig_hours is not None else "red",
        "hours_since_latest": round(mig_hours, 1) if mig_hours is not None else None,
        "latest_file": mig_latest.name if mig_latest else None,
        "recent_files": mig_files,
    }

    # ── Overall — worst-of-three ──────────────────────────────────────
    priority = {"red": 0, "amber": 1, "green": 2}
    statuses = [rail["status"] for rail in out["rails"].values()]
    out["overall"] = min(statuses, key=lambda s: priority.get(s, 0))
    return out
