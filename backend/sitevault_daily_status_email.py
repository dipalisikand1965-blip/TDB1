"""
sitevault_daily_status_email.py — Daily "Safety Vault status" email.

A 1-line peace-of-mind email sent daily at 8 AM IST to confirm that the
Google Drive Fort Knox backup ran successfully overnight. If the last run
failed or is too old, the email shouts in red.

Recipients: dipali@clubconcierge.in + sysadmin@clubconcierge.in (CC).

Wired from server.py scheduler. Same hardening pattern as the outreach
digest: misfire_grace_time=3600, startup catch-up, Mongo last-sent marker.
"""

import os
import logging
from datetime import datetime, timezone
import pytz

logger = logging.getLogger(__name__)

DEFAULT_TO = "dipali@clubconcierge.in"
DEFAULT_CC = "sysadmin@clubconcierge.in"
FROM_EMAIL = os.environ.get("SITEVAULT_FROM_EMAIL", "concierge@thedoggycompany.com")

# A backup is considered "fresh" if the last success is within this many hours
FRESH_THRESHOLD_HOURS = int(os.environ.get("SITEVAULT_FRESH_HOURS", "30"))


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

async def _last_run_snapshot():
    """Return the most-recent SiteVault run summary or None."""
    try:
        from server import db
        doc = await db.sitevault_runs.find_one(
            {},
            {"_id": 0},
            sort=[("started_at", -1)],
        )
        return doc
    except Exception as e:
        logger.warning(f"[sitevault_email] could not read sitevault_runs: {e}")
        return None


def _hours_since(iso_str) -> float:
    """Return hours since the given ISO timestamp, or a large number if unparseable."""
    try:
        if not iso_str:
            return 9999.0
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        return round(delta.total_seconds() / 3600, 1)
    except Exception:
        return 9999.0


def _render_html(run: dict | None) -> tuple[str, str]:
    """Return (subject, html) for the daily status email."""
    ist = pytz.timezone("Asia/Kolkata")
    now_ist = datetime.now(ist).strftime("%Y-%m-%d %H:%M IST")

    if not run:
        subject = "🔴 TDC Safety Vault — NO BACKUPS FOUND"
        html = f"""
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;padding:24px;">
          <h2 style="color:#DC2626;margin:0 0 12px 0;">🔴 Safety Vault: no backup records</h2>
          <p>No SiteVault runs found in the database. This is a <b>critical</b> signal —
          Google Drive backups may not be running at all.</p>
          <p style="color:#6B7280;font-size:12px;">Generated {now_ist}</p>
        </div>
        """
        return subject, html

    status = run.get("status", "unknown")
    started = run.get("started_at")
    completed = run.get("completed_at")
    files = run.get("files_uploaded") or len(run.get("uploads", []))
    bytes_up = run.get("bytes_uploaded") or sum(u.get("size_bytes", 0) for u in run.get("uploads", []))
    mb = round(bytes_up / 1024 / 1024, 1)
    hours_old = _hours_since(completed or started)
    fresh = hours_old <= FRESH_THRESHOLD_HOURS and status == "success"

    icon = "🟢" if fresh else ("🟡" if status == "success" else "🔴")
    headline = "Backup healthy" if fresh else (
        f"Backup {status}" if status != "success" else "Backup stale"
    )

    subject = f"{icon} TDC Safety Vault — {headline} ({files} files · {mb} MB)"

    # Single-line confirmation with details below
    accent = "#059669" if fresh else ("#D97706" if status == "success" else "#DC2626")
    bg = "#ECFDF5" if fresh else ("#FFFBEB" if status == "success" else "#FEF2F2")

    # Friendly relative time
    if hours_old < 1:
        time_ago = f"{int(hours_old * 60)} min ago"
    elif hours_old < 48:
        time_ago = f"{hours_old}h ago"
    else:
        time_ago = f"{round(hours_old / 24, 1)} days ago"

    html = f"""
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;padding:24px;background:#FAFAFA;">
      <div style="background:{bg};border-left:4px solid {accent};padding:16px 20px;border-radius:6px;">
        <div style="font-size:22px;font-weight:700;color:{accent};margin:0 0 6px 0;">
          {icon} Safety Vault — {headline}
        </div>
        <div style="font-size:14px;color:#374151;line-height:1.55;">
          Last backup <b>{time_ago}</b> · <b>{files}</b> files · <b>{mb} MB</b> · status: <b>{status}</b>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:13px;color:#4B5563;">
        <tr><td style="padding:4px 0;">Run ID</td><td align="right"><code>{run.get('run_id','?')}</code></td></tr>
        <tr><td style="padding:4px 0;">Type</td><td align="right">{run.get('type','daily')}</td></tr>
        <tr><td style="padding:4px 0;">Started</td><td align="right">{started or '?'}</td></tr>
        <tr><td style="padding:4px 0;">Completed</td><td align="right">{completed or '?'}</td></tr>
        <tr><td style="padding:4px 0;">Errors</td><td align="right">{run.get('error_count', 0)}</td></tr>
      </table>

      <div style="margin-top:18px;font-size:12px;color:#9CA3AF;">
        Auto-generated by <code>sitevault_daily_status_email.py</code> — daily 8 AM IST.<br>
        Check all runs: <a href="https://thedoggycompany.com/admin" style="color:#6366F1;">Admin → Guide &amp; Backup</a>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#9CA3AF;">Generated {now_ist}</div>
    </div>
    """
    return subject, html


# ────────────────────────────────────────────────────────────────────────────
# Send
# ────────────────────────────────────────────────────────────────────────────

async def send_sitevault_daily_status():
    """Compute + email the latest SiteVault run status. Returns result metadata."""
    run = await _last_run_snapshot()
    subject, html = _render_html(run)

    to_env = os.environ.get("SITEVAULT_STATUS_TO") or DEFAULT_TO
    cc_env = os.environ.get("SITEVAULT_STATUS_CC") or DEFAULT_CC
    to_list = [e.strip() for e in to_env.split(",") if e.strip()]
    cc_list = [e.strip() for e in cc_env.split(",") if e.strip()]

    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        logger.warning("[sitevault_email] RESEND_API_KEY not set — status email NOT sent")
        return {"success": False, "error": "RESEND_API_KEY not configured"}

    try:
        import resend
        resend.api_key = resend_key
        payload = {
            "from": FROM_EMAIL,
            "to": to_list,
            "subject": subject,
            "html": html,
        }
        if cc_list:
            payload["cc"] = cc_list
        result = resend.Emails.send(payload)
        rid = getattr(result, "id", None) or (result.get("id") if isinstance(result, dict) else None)
        logger.info(f"[sitevault_email] sent to={to_list} cc={cc_list} resend_id={rid}")
        return {"success": True, "to": to_list, "cc": cc_list, "subject": subject, "resend_id": rid}
    except Exception as e:
        logger.error(f"[sitevault_email] send failed: {e}")
        return {"success": False, "error": str(e)}


# ────────────────────────────────────────────────────────────────────────────
# Last-sent marker (prevents double-sends on restarts)
# ────────────────────────────────────────────────────────────────────────────

async def _mark_sent_today():
    try:
        from server import db
        ist = pytz.timezone("Asia/Kolkata")
        today = datetime.now(ist).strftime("%Y-%m-%d")
        await db.sitevault_status_email_log.update_one(
            {"_id": "last_sent"},
            {"$set": {"date_ist": today, "sent_at_utc": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
    except Exception as e:
        logger.warning(f"[sitevault_email] could not persist last-sent marker: {e}")


async def _was_sent_today() -> bool:
    try:
        from server import db
        ist = pytz.timezone("Asia/Kolkata")
        today = datetime.now(ist).strftime("%Y-%m-%d")
        rec = await db.sitevault_status_email_log.find_one(
            {"_id": "last_sent"}, {"_id": 0, "date_ist": 1}
        )
        return bool(rec and rec.get("date_ist") == today)
    except Exception as e:
        logger.warning(f"[sitevault_email] could not read last-sent marker: {e}")
        return False


async def send_sitevault_daily_status_tracked():
    """Scheduler wrapper that records send so catch-up won't re-fire."""
    result = await send_sitevault_daily_status()
    if result.get("success"):
        await _mark_sent_today()
    return result


async def _startup_catchup():
    """
    If server boots between 8 AM and 11 PM IST and today's status wasn't sent,
    fire immediately. Prevents missed daily emails on mid-morning redeploys.
    """
    try:
        ist = pytz.timezone("Asia/Kolkata")
        now_ist = datetime.now(ist)
        if now_ist.hour < 8 or now_ist.hour >= 23:
            return
        if await _was_sent_today():
            logger.info("[sitevault_email] catch-up skipped — already sent today")
            return
        logger.info(f"[sitevault_email] catch-up firing at {now_ist.strftime('%H:%M')} IST — missed 8 AM slot")
        result = await send_sitevault_daily_status()
        if result.get("success"):
            await _mark_sent_today()
    except Exception as e:
        logger.error(f"[sitevault_email] catch-up failed: {e}")


# ────────────────────────────────────────────────────────────────────────────
# APScheduler integration
# ────────────────────────────────────────────────────────────────────────────

def schedule_sitevault_daily_status(scheduler):
    """Schedule the daily status email for 8 AM IST."""
    try:
        scheduler.add_job(
            send_sitevault_daily_status_tracked,
            trigger="cron",
            hour=8, minute=0,
            timezone=pytz.timezone("Asia/Kolkata"),
            id="sitevault_daily_status_email",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=3600,
        )
        logger.info("[sitevault_email] scheduled daily at 8:00 AM IST (grace=3600s)")

        import asyncio
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(_startup_catchup())
            logger.info("[sitevault_email] startup catch-up task queued")
        except Exception as e:
            logger.warning(f"[sitevault_email] could not queue catch-up: {e}")
    except Exception as e:
        logger.error(f"[sitevault_email] schedule failed: {e}")
