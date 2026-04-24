"""
sitevault_weekly_summary_email.py — Monday 9 AM IST weekly vault summary.

Spec (matches ScaleBoard + IAmBecause pattern):

Subject: 📊 TDC Safety Vault Weekly Summary — Week NN
Body:
  Daily backups: 7/7 successful ✅
  Weekly full archive: 1/1 successful ✅
  Monthly frozen snapshot: exists (April) ✅
  Gold Masters retained: N (oldest: DD MMM YYYY)
  Total Drive storage: X.X GB
  Next monthly frozen: DD MMM YYYY
  All green. Your data is safe.

Recipients: dipali@clubconcierge.in + sysadmin@clubconcierge.in
Fires Monday 9 AM IST (stays distinct from the daily 8 AM status email).
"""

import os
import logging
import calendar
from datetime import datetime, timezone, timedelta
import pytz

logger = logging.getLogger(__name__)

DEFAULT_TO = "dipali@clubconcierge.in"
DEFAULT_CC = "sysadmin@clubconcierge.in"
FROM_EMAIL = os.environ.get("SITEVAULT_FROM_EMAIL", "concierge@thedoggycompany.com")


async def _compute_weekly_stats():
    """Aggregate the last 7 daily runs + the last weekly + gold-master retention."""
    from server import db

    now_utc = datetime.now(timezone.utc)
    seven_days_ago = now_utc - timedelta(days=7)

    # Daily runs — count success vs failure in last 7 days
    daily_success = await db.sitevault_runs.count_documents({
        "type": "daily",
        "status": "success",
        "started_at": {"$gte": seven_days_ago.isoformat()},
    })
    daily_expected = 7  # one per day

    # Weekly full archive runs in the last 7 days
    weekly_success = await db.sitevault_runs.count_documents({
        "type": "weekly",
        "status": "success",
        "started_at": {"$gte": seven_days_ago.isoformat()},
    })
    weekly_expected = 1

    # Monthly frozen — check if a "monthly" or "gold_master" run exists in current month
    ist = pytz.timezone("Asia/Kolkata")
    now_ist = datetime.now(ist)
    month_start = now_ist.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_exists = await db.sitevault_runs.find_one({
        "type": {"$in": ["monthly", "gold_master"]},
        "started_at": {"$gte": month_start.astimezone(timezone.utc).isoformat()},
    })

    # Gold Masters — count all pinned/gold runs + find oldest
    gold_master_cursor = db.sitevault_runs.find(
        {"gold_master": True},
        {"_id": 0, "started_at": 1, "run_id": 1},
        sort=[("started_at", 1)],  # oldest first
    )
    gold_masters = await gold_master_cursor.to_list(length=200)
    gold_count = len(gold_masters)
    oldest_gm_date = None
    if gold_masters:
        try:
            dt = datetime.fromisoformat(gold_masters[0]["started_at"].replace("Z", "+00:00"))
            oldest_gm_date = dt.astimezone(ist).strftime("%d %b %Y")
        except Exception:
            oldest_gm_date = gold_masters[0].get("started_at", "?")

    # Total Drive storage — sum of bytes_uploaded across all runs
    pipeline = [
        {"$group": {"_id": None, "total_bytes": {"$sum": {"$ifNull": ["$bytes_uploaded", 0]}}}}
    ]
    total_bytes = 0
    async for row in db.sitevault_runs.aggregate(pipeline):
        total_bytes = row.get("total_bytes", 0)

    total_gb = round(total_bytes / 1024 / 1024 / 1024, 2)

    # Next monthly frozen — 1st of next month
    if now_ist.month == 12:
        next_month = now_ist.replace(year=now_ist.year + 1, month=1, day=1)
    else:
        next_month = now_ist.replace(month=now_ist.month + 1, day=1)
    next_monthly_date = next_month.strftime("%d %b %Y")

    return {
        "week_num": now_ist.isocalendar()[1],
        "daily_success": daily_success,
        "daily_expected": daily_expected,
        "weekly_success": weekly_success,
        "weekly_expected": weekly_expected,
        "monthly_exists": bool(monthly_exists),
        "month_name": calendar.month_name[now_ist.month],
        "gold_count": gold_count,
        "oldest_gm_date": oldest_gm_date or "—",
        "total_gb": total_gb,
        "next_monthly_date": next_monthly_date,
    }


def _render_html(s: dict) -> tuple[str, str]:
    week_num = s["week_num"]
    subject = f"📊 TDC Safety Vault Weekly Summary — Week {week_num}"

    def _row(label: str, ok: bool, extra: str = ""):
        icon = "✅" if ok else "⚠️"
        color = "#065F46" if ok else "#92400E"
        return (
            f"<tr><td style='padding:8px 0;color:#4B5563;'>{label}</td>"
            f"<td align='right' style='color:{color};font-weight:600;'>{icon} {extra}</td></tr>"
        )

    all_green = (
        s["daily_success"] == s["daily_expected"]
        and s["weekly_success"] == s["weekly_expected"]
        and s["monthly_exists"]
    )
    headline = "All green. Your data is safe." if all_green else "Some rails need attention."
    headline_color = "#065F46" if all_green else "#92400E"

    html = f"""
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;padding:28px;background:#FAFAFA;color:#111827;">
      <div style="background:#EEF2FF;border-left:4px solid #6366F1;padding:18px 22px;border-radius:8px;">
        <div style="font-size:22px;font-weight:700;color:#3730A3;margin:0 0 6px 0;">
          📊 TDC Safety Vault — Weekly Summary
        </div>
        <div style="font-size:14px;color:#3730A3;">Week {week_num} of {datetime.now(pytz.timezone('Asia/Kolkata')).year}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:22px;">
        {_row('Daily backups', s['daily_success'] == s['daily_expected'], f"{s['daily_success']}/{s['daily_expected']} successful")}
        {_row('Weekly full archive', s['weekly_success'] == s['weekly_expected'], f"{s['weekly_success']}/{s['weekly_expected']} successful")}
        {_row(f"Monthly frozen snapshot ({s['month_name']})", s['monthly_exists'], 'exists' if s['monthly_exists'] else 'MISSING')}
        <tr><td style='padding:8px 0;color:#4B5563;'>Gold Masters retained</td>
            <td align='right' style='color:#374151;font-weight:600;'>{s['gold_count']} (oldest: {s['oldest_gm_date']})</td></tr>
        <tr><td style='padding:8px 0;color:#4B5563;'>Total Drive storage</td>
            <td align='right' style='color:#374151;font-weight:600;'>{s['total_gb']} GB</td></tr>
        <tr><td style='padding:8px 0;color:#4B5563;'>Next monthly frozen</td>
            <td align='right' style='color:#374151;font-weight:600;'>{s['next_monthly_date']}</td></tr>
      </table>

      <div style="margin-top:26px;padding:16px 18px;background:{'#ECFDF5' if all_green else '#FFFBEB'};border-radius:8px;font-size:15px;font-weight:600;color:{headline_color};">
        {headline}
      </div>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px 0;">
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">
        Auto-generated by <code>sitevault_weekly_summary_email.py</code> — Mondays 9 AM IST.<br>
        Manage backups: <a href="https://thedoggycompany.com/admin" style="color:#6366F1;">Admin → Guide &amp; Backup</a>
      </p>
    </div>
    """
    return subject, html


async def send_weekly_summary():
    try:
        stats = await _compute_weekly_stats()
    except Exception as e:
        logger.error(f"[sitevault_weekly] compute failed: {e}")
        return {"success": False, "error": f"compute failed: {e}"}

    subject, html = _render_html(stats)

    to_env = os.environ.get("SITEVAULT_WEEKLY_TO") or DEFAULT_TO
    cc_env = os.environ.get("SITEVAULT_WEEKLY_CC") or DEFAULT_CC
    to_list = [e.strip() for e in to_env.split(",") if e.strip()]
    cc_list = [e.strip() for e in cc_env.split(",") if e.strip()]

    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        logger.warning("[sitevault_weekly] RESEND_API_KEY not set — not sending")
        return {"success": False, "error": "RESEND_API_KEY not configured"}

    try:
        import resend
        resend.api_key = resend_key
        payload = {"from": FROM_EMAIL, "to": to_list, "subject": subject, "html": html}
        if cc_list:
            payload["cc"] = cc_list
        result = resend.Emails.send(payload)
        rid = getattr(result, "id", None) or (result.get("id") if isinstance(result, dict) else None)
        logger.info(f"[sitevault_weekly] sent to={to_list} cc={cc_list} resend_id={rid}")
        return {"success": True, "to": to_list, "cc": cc_list, "resend_id": rid, "stats": stats}
    except Exception as e:
        logger.error(f"[sitevault_weekly] send failed: {e}")
        return {"success": False, "error": str(e)}


def schedule_weekly_summary(scheduler):
    """Schedule the weekly summary for Monday 9 AM IST (distinct from 8 AM daily)."""
    try:
        scheduler.add_job(
            send_weekly_summary,
            trigger="cron",
            day_of_week="mon",
            hour=9, minute=0,
            timezone=pytz.timezone("Asia/Kolkata"),
            id="sitevault_weekly_summary_email",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=3600,
        )
        logger.info("[sitevault_weekly] scheduled Monday 9:00 AM IST (grace=3600s)")
    except Exception as e:
        logger.error(f"[sitevault_weekly] schedule failed: {e}")
