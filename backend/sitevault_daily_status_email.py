"""
sitevault_daily_status_email.py — Daily SiteVault status email (success + failure).

Spec (matches ScaleBoard + IAmBecause pattern):

SUCCESS email:
  Subject: ✅ TDC Safety Vault Backup Complete — 24 Apr 2026
  Body: completion time, file, size, docs count, duration, location,
        "All systems healthy. No action needed."

FAILURE email:
  Subject: 🔴 URGENT: TDC Safety Vault Backup FAILED — 24 Apr 2026
  Body: failure time, error, failing step, last successful backup,
        recommended action, manual backup instructions
  + WhatsApp alert to ADMIN_WHATSAPP_NUMBER via Gupshup

Recipients: dipali@clubconcierge.in + sysadmin@clubconcierge.in
Runs daily 8 AM IST. Hardened with misfire_grace_time + startup catch-up.
"""

import os
import logging
from datetime import datetime, timezone
import pytz

logger = logging.getLogger(__name__)

DEFAULT_TO = "dipali@clubconcierge.in"
DEFAULT_CC = "sysadmin@clubconcierge.in"
FROM_EMAIL = os.environ.get("SITEVAULT_FROM_EMAIL", "concierge@thedoggycompany.com")

# A backup is considered "fresh" if last success is within this many hours
FRESH_THRESHOLD_HOURS = int(os.environ.get("SITEVAULT_FRESH_HOURS", "30"))


# ────────────────────────────────────────────────────────────────────────────
# Snapshot helpers
# ────────────────────────────────────────────────────────────────────────────

async def _last_run_snapshot():
    """Most-recent SiteVault run, or None."""
    try:
        from server import db
        return await db.sitevault_runs.find_one({}, {"_id": 0}, sort=[("started_at", -1)])
    except Exception as e:
        logger.warning(f"[sitevault_email] could not read sitevault_runs: {e}")
        return None


async def _last_successful_run():
    """Most-recent SUCCESS run, or None — used for failure-email context."""
    try:
        from server import db
        return await db.sitevault_runs.find_one(
            {"status": "success"}, {"_id": 0}, sort=[("started_at", -1)]
        )
    except Exception:
        return None


async def _docs_count_today() -> int:
    """Count documents in the primary Mongo DB (for 'Documents: 57,438' line)."""
    try:
        from server import db
        total = 0
        names = await db.list_collection_names()
        # Keep it quick — only count the top business collections
        key_cols = [
            "pet_parents", "pets", "service_requests", "products_master",
            "services_master", "orders", "member_notifications", "mira_chats",
        ]
        for name in names:
            if name.startswith("system.") or name.startswith("sitevault_"):
                continue
            if name in key_cols or True:
                try:
                    total += await db[name].estimated_document_count()
                except Exception:
                    pass
        return total
    except Exception as e:
        logger.warning(f"[sitevault_email] doc count failed: {e}")
        return 0


def _fmt_ist(iso_str: str | None) -> str:
    if not iso_str:
        return "?"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        ist = dt.astimezone(pytz.timezone("Asia/Kolkata"))
        return ist.strftime("%H:%M IST")
    except Exception:
        return iso_str


def _fmt_ist_date(iso_str: str | None) -> str:
    if not iso_str:
        return "?"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        ist = dt.astimezone(pytz.timezone("Asia/Kolkata"))
        return ist.strftime("%d %b %Y")
    except Exception:
        return iso_str


def _duration_s(run: dict) -> int:
    try:
        s = datetime.fromisoformat(run["started_at"].replace("Z", "+00:00"))
        c = datetime.fromisoformat(run["completed_at"].replace("Z", "+00:00"))
        return max(0, int((c - s).total_seconds()))
    except Exception:
        return 0


def _total_mb(run: dict) -> float:
    b = run.get("bytes_uploaded") or sum(u.get("size_bytes", 0) for u in run.get("uploads", []))
    return round(b / 1024 / 1024, 1)


def _primary_file(run: dict) -> str:
    """Pick the MongoDB archive as the 'primary' file for the subject line."""
    for u in run.get("uploads", []):
        if "mongo" in (u.get("name") or "").lower():
            return u["name"]
    ups = run.get("uploads") or []
    return ups[0]["name"] if ups else "—"


# ────────────────────────────────────────────────────────────────────────────
# HTML renderers
# ────────────────────────────────────────────────────────────────────────────

def _render_success(run: dict, docs_count: int) -> tuple[str, str]:
    ist = pytz.timezone("Asia/Kolkata")
    date_label = datetime.now(ist).strftime("%d %b %Y")
    completed_ist = _fmt_ist(run.get("completed_at"))
    files = run.get("files_uploaded") or len(run.get("uploads", []))
    mb = _total_mb(run)
    duration = _duration_s(run)
    primary = _primary_file(run)

    subject = f"✅ TDC Safety Vault Backup Complete — {date_label}"

    uploads_rows = "".join(
        f"<tr><td style='padding:4px 0;color:#4B5563;'>• {u['name']}</td>"
        f"<td align='right' style='color:#6B7280;'>{round((u.get('size_bytes',0))/1024/1024,1)} MB</td></tr>"
        for u in (run.get("uploads") or [])
    )

    html = f"""
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;padding:28px;background:#FAFAFA;color:#111827;">
      <div style="background:#ECFDF5;border-left:4px solid #059669;padding:18px 22px;border-radius:8px;">
        <div style="font-size:22px;font-weight:700;color:#065F46;margin:0 0 6px 0;">
          ✅ TDC Safety Vault Backup Complete
        </div>
        <div style="font-size:14px;color:#065F46;">{date_label} · Google Drive → <b>TDC SiteVault</b></div>
      </div>

      <p style="font-size:15px;line-height:1.7;margin:20px 0 8px 0;">
        Backup completed successfully at <b>{completed_ist}</b>.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-top:6px;">
        <tr><td style="padding:6px 0;width:40%;color:#6B7280;">Primary file</td><td><code>{primary}</code></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Total size</td><td><b>{mb} MB</b></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Files uploaded</td><td><b>{files}</b></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Documents (Mongo)</td><td><b>{docs_count:,}</b></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Duration</td><td><b>{duration} seconds</b></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Location</td><td>Google Drive → Daily-DB-Snapshots</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Run ID</td><td><code>{run.get('run_id','?')}</code></td></tr>
      </table>

      <div style="margin-top:22px;padding:14px 16px;background:#F3F4F6;border-radius:6px;font-size:13px;color:#4B5563;">
        <b>Files in this backup:</b>
        <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:12px;">
          {uploads_rows}
        </table>
      </div>

      <p style="margin:24px 0 8px 0;font-size:15px;color:#065F46;">
        <b>All systems healthy. No action needed.</b>
      </p>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px 0;">
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">
        Auto-generated by <code>sitevault_daily_status_email.py</code> — daily 8 AM IST.<br>
        View all runs: <a href="https://thedoggycompany.com/admin" style="color:#6366F1;">Admin → Guide &amp; Backup</a>
      </p>
    </div>
    """
    return subject, html


def _render_failure(run: dict | None, last_success: dict | None) -> tuple[str, str]:
    ist = pytz.timezone("Asia/Kolkata")
    date_label = datetime.now(ist).strftime("%d %b %Y")
    failed_at_ist = _fmt_ist((run or {}).get("started_at") or (run or {}).get("completed_at"))
    status = (run or {}).get("status", "unknown")

    errors = (run or {}).get("errors") or []

    # Determine the REAL reason for the failure-email
    # Case A: last run actually failed/crashed (status != success)
    # Case B: last run was success but is too old (stale) — pod was sleeping
    if errors:
        error_text = errors[0]
        if isinstance(error_text, dict):
            error_text = error_text.get("message") or str(error_text)
        failing_step = (run or {}).get("failing_step") or (
            errors[0].get("step") if isinstance(errors[0], dict) else "unknown"
        )
    elif status == "success" and run:
        # Stale-success case — backup is old, not failed
        hours_old = _hours_since((run or {}).get("completed_at") or (run or {}).get("started_at"))
        error_text = (
            f"Last backup is {hours_old:.0f}h old (older than {FRESH_THRESHOLD_HOURS}h freshness threshold). "
            f"Most likely cause: the server pod went to sleep overnight and missed the 3 AM IST cron. "
            f"The backup itself succeeded — it just hasn't been re-run in over a day."
        )
        failing_step = "scheduler — pod sleep / missed cron slot"
    elif not run:
        error_text = "No SiteVault runs found in the database."
        failing_step = "no records"
    else:
        error_text = f"Last run status: {status}"
        failing_step = (run or {}).get("failing_step") or "unknown"

    last_success_date = _fmt_ist_date((last_success or {}).get("completed_at"))
    last_success_mb = _total_mb(last_success) if last_success else 0

    # Recommended action — simple heuristic
    recommendation = "Run a manual backup from Admin → Guide & Backup → Run Backup Now."
    err_lower = str(error_text).lower()
    if "pod" in err_lower or "sleep" in err_lower or "missed the" in err_lower:
        recommendation = (
            "The preview pod went to sleep and missed the 3 AM IST slot. Hit "
            "Admin → Guide & Backup → Run Backup Now to backfill, then verify "
            "tomorrow's 8 AM email shows green. Long-term fix: deploy backend "
            "to a 24/7 host (AWS App Runner / EC2)."
        )
    elif "quota" in err_lower or "storage" in err_lower:
        recommendation = "Google Drive storage may be full. Free up space in the shared drive or increase quota."
    elif "credential" in err_lower or "auth" in err_lower or "401" in err_lower or "403" in err_lower:
        recommendation = "Service-account credentials may have expired. Check SITEVAULT_SA file and Drive sharing."
    elif "network" in err_lower or "timeout" in err_lower or "connection" in err_lower:
        recommendation = "Transient network error. Retry the backup manually — likely resolves on next run."

    subject = f"🔴 URGENT: TDC Safety Vault Backup FAILED — {date_label}"

    html = f"""
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;padding:28px;background:#FAFAFA;color:#111827;">
      <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:18px 22px;border-radius:8px;">
        <div style="font-size:22px;font-weight:700;color:#991B1B;margin:0 0 6px 0;">
          🔴 URGENT: TDC Safety Vault Backup FAILED
        </div>
        <div style="font-size:14px;color:#991B1B;">{date_label}</div>
      </div>

      <p style="font-size:15px;line-height:1.7;margin:20px 0 8px 0;">
        Backup <b>FAILED</b> at <b>{failed_at_ist}</b>.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-top:6px;">
        <tr><td style="padding:6px 0;width:40%;color:#6B7280;">Error</td><td><code style="color:#991B1B;">{error_text}</code></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Failing step</td><td><code>{failing_step}</code></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Last successful backup</td><td>{last_success_date} ({last_success_mb} MB)</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Run ID</td><td><code>{(run or {}).get('run_id','—')}</code></td></tr>
      </table>

      <div style="margin-top:22px;padding:16px 18px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;font-size:14px;color:#78350F;">
        <b>RECOMMENDED ACTION:</b> {recommendation}<br><br>
        <b>Manual backup:</b> Login → Admin → Guide &amp; Backup → Run Backup Now
      </div>

      <p style="margin:22px 0 8px 0;font-size:14px;color:#991B1B;">
        This needs immediate attention. Contact Emergent support if the error persists.
      </p>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px 0;">
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">
        Auto-generated by <code>sitevault_daily_status_email.py</code> — daily 8 AM IST.<br>
        WhatsApp alert also dispatched to the admin number.
      </p>
    </div>
    """
    return subject, html


# ────────────────────────────────────────────────────────────────────────────
# WhatsApp failure alert (Gupshup freeform)
# ────────────────────────────────────────────────────────────────────────────

async def _send_whatsapp_failure_alert(run: dict | None, last_success: dict | None):
    """Fire a WhatsApp alert to ADMIN_WHATSAPP_NUMBER on backup failure."""
    admin_phone = os.environ.get("ADMIN_WHATSAPP_NUMBER")
    if not admin_phone:
        logger.warning("[sitevault_email] ADMIN_WHATSAPP_NUMBER not set — skipping WhatsApp alert")
        return

    ist = pytz.timezone("Asia/Kolkata")
    date_label = datetime.now(ist).strftime("%d %b %Y")
    status = (run or {}).get("status", "unknown")
    errors = (run or {}).get("errors") or []
    err = errors[0] if errors else status
    if isinstance(err, dict):
        err = err.get("message") or str(err)
    last_ok = _fmt_ist_date((last_success or {}).get("completed_at"))

    msg = (
        f"🔴 URGENT: TDC Safety Vault backup FAILED on {date_label}.\n"
        f"Error: {str(err)[:160]}\n"
        f"Last success: {last_ok}\n"
        f"Action: Login → Admin → Guide & Backup → Run Backup Now."
    )
    try:
        from services.whatsapp_service import send_whatsapp
        idem = f"sitevault_fail_{(run or {}).get('run_id','unknown')}"
        result = await send_whatsapp(
            phone=admin_phone,
            template_name="backup_failure_alert",  # fallback to freeform if no template
            template_params=[date_label, str(err)[:100]],
            fallback_message=msg,
            idempotency_key=idem,
            context="sitevault_failure",
        )
        logger.info(f"[sitevault_email] WhatsApp alert result: {result}")
    except Exception as e:
        logger.error(f"[sitevault_email] WhatsApp alert failed: {e}")


# ────────────────────────────────────────────────────────────────────────────
# Main send
# ────────────────────────────────────────────────────────────────────────────

async def send_sitevault_daily_status():
    """Compute + email the latest SiteVault run status. Returns result metadata."""
    run = await _last_run_snapshot()
    last_success = await _last_successful_run()

    if not run:
        # Treat "no runs at all" as failure
        subject, html = _render_failure(None, None)
        is_failure = True
    else:
        # Treat as success if status==success AND within the fresh window
        hours_old = _hours_since(run.get("completed_at") or run.get("started_at"))
        is_success = run.get("status") == "success" and hours_old <= FRESH_THRESHOLD_HOURS
        if is_success:
            docs = await _docs_count_today()
            subject, html = _render_success(run, docs)
            is_failure = False
        else:
            subject, html = _render_failure(run, last_success)
            is_failure = True

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
        logger.info(f"[sitevault_email] sent to={to_list} cc={cc_list} resend_id={rid} failure={is_failure}")

        # WhatsApp blast on failure
        if is_failure:
            await _send_whatsapp_failure_alert(run, last_success)

        return {"success": True, "is_failure_email": is_failure, "to": to_list, "cc": cc_list, "subject": subject, "resend_id": rid}
    except Exception as e:
        logger.error(f"[sitevault_email] send failed: {e}")
        return {"success": False, "error": str(e)}


def _hours_since(iso_str) -> float:
    try:
        if not iso_str:
            return 9999.0
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return round((datetime.now(timezone.utc) - dt).total_seconds() / 3600, 1)
    except Exception:
        return 9999.0


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
    """If server boots between 8 AM and 11 PM IST and today's status wasn't sent, fire it."""
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
# APScheduler
# ────────────────────────────────────────────────────────────────────────────

def schedule_sitevault_daily_status(scheduler):
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
