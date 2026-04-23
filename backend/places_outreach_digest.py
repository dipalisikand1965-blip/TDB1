"""
places_outreach_digest.py — Nightly "Top 5 most-booked unverified places per pillar" email.

Sent to Dipali + the concierge team at 8 AM IST daily. Turns the TDC-verified
registry into a structured B2B outreach pipeline: the concierge team sees
exactly which places to call today.

Wired from server.py scheduler. Resend API used (same pattern as
architecture_weekly_email.py).

Tunables:
  - DIGEST_RECIPIENTS    : comma-sep emails via env OUTREACH_DIGEST_RECIPIENTS
  - DIGEST_WINDOW_DAYS   : lookback window (default 14)
  - DIGEST_TOP_N         : top N per pillar (default 5)
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_RECIPIENTS = "dipali@clubconcierge.in"
DIGEST_WINDOW_DAYS = int(os.environ.get("OUTREACH_DIGEST_WINDOW_DAYS", "14"))
DIGEST_TOP_N = int(os.environ.get("OUTREACH_DIGEST_TOP_N", "5"))
FROM_EMAIL = os.environ.get("OUTREACH_FROM_EMAIL", "concierge@thedoggycompany.com")

PILLAR_LABELS = {
    "care": "🩺 Care",
    "go": "✈️ Go",
    "play": "🎾 Play",
    "learn": "🎓 Learn",
    "dine": "🍽️ Dine",
    "celebrate": "🎂 Celebrate",
    "paperwork": "📋 Paperwork",
    "emergency": "🚨 Emergency",
    "farewell": "🕊️ Farewell",
    "adopt": "🐾 Adopt",
    "general": "General",
}


async def _compute_digest():
    """Returns the same shape as /api/admin/places/top-unverified."""
    from admin_places_verified_routes import top_unverified_per_pillar
    # Call the route function directly (bypasses FastAPI dependency injection)
    return await top_unverified_per_pillar(days=DIGEST_WINDOW_DAYS, top_n=DIGEST_TOP_N, _admin=True)


def _render_html(digest: dict) -> str:
    generated = digest.get("generated_at", "")
    total = digest.get("total_unverified", 0)
    window_days = digest.get("window_days", DIGEST_WINDOW_DAYS)
    pillars = digest.get("pillars") or {}

    if not pillars:
        body_rows = "<p style='color:#64748B;font-size:14px'>No unverified places booked in the last "+str(window_days)+" days. Everyone is verified — or nobody booked a NearMe venue. ✨</p>"
    else:
        body_rows = ""
        for pillar_key in sorted(pillars.keys()):
            items = pillars[pillar_key]
            if not items:
                continue
            label = PILLAR_LABELS.get(pillar_key, pillar_key.title())
            body_rows += f"""
              <tr><td colspan="4" style="padding:16px 0 6px;font-size:14px;font-weight:700;color:#0F172A;border-top:1px solid #E2E8F0">{label}</td></tr>
              <tr><td style='font-size:11px;color:#64748B;padding:4px 10px 4px 0'>Place</td>
                  <td style='font-size:11px;color:#64748B;padding:4px 10px'>City</td>
                  <td style='font-size:11px;color:#64748B;padding:4px 10px;text-align:right'>Bookings</td>
                  <td style='font-size:11px;color:#64748B;padding:4px 0'>Last booked</td></tr>
            """
            for r in items:
                name = (r.get("name") or "—").replace("<", "&lt;")
                city = (r.get("city") or "—").replace("<", "&lt;")
                count = r.get("booking_count", 0)
                last = (r.get("last_booked") or "")[:10]
                body_rows += f"""
                  <tr>
                    <td style='font-size:13px;color:#1E293B;padding:6px 10px 6px 0;border-bottom:1px solid #F1F5F9'>{name}</td>
                    <td style='font-size:13px;color:#475569;padding:6px 10px;border-bottom:1px solid #F1F5F9'>{city}</td>
                    <td style='font-size:13px;font-weight:700;color:#047857;padding:6px 10px;text-align:right;border-bottom:1px solid #F1F5F9'>{count}</td>
                    <td style='font-size:12px;color:#64748B;padding:6px 0;border-bottom:1px solid #F1F5F9'>{last}</td>
                  </tr>
                """

    html = f"""
    <!doctype html>
    <html><body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:32px 24px;background:#fff">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#047857;text-transform:uppercase;margin-bottom:6px">
          ✦ TDC Concierge — Outreach Pipeline
        </div>
        <div style="font-size:24px;font-weight:800;color:#0F172A;margin-bottom:4px">
          Top-booked places to verify
        </div>
        <div style="font-size:13px;color:#64748B;margin-bottom:20px">
          Last {window_days} days · {total} unverified places booked · Generated {generated[:16].replace("T"," ")}
        </div>
        <div style="font-size:13px;color:#475569;background:#ECFDF5;border-left:3px solid #047857;padding:10px 14px;border-radius:4px;margin-bottom:18px">
          Each place below is a B2B partnership opportunity. Call them, get a verbal confirmation, and mark them verified in the admin panel → they instantly surface first in every pillar's NearMe results with the ✦ TDC Verified badge.
        </div>
        <table style="width:100%;border-collapse:collapse">
          {body_rows}
        </table>
        <div style="font-size:11px;color:#94A3B8;margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;line-height:1.6">
          Auto-generated by <code>places_outreach_digest.py</code> — daily 8 AM IST.<br>
          Verify from Admin → Places → "Mark as Verified" (one-click upsert into <code>places_tdc_verified</code>).
        </div>
      </div>
    </body></html>
    """
    return html


async def send_outreach_digest(force: bool = False):
    """Compute the digest and email it. Returns a dict with result metadata."""
    try:
        digest = await _compute_digest()
    except Exception as e:
        logger.error(f"[outreach_digest] compute failed: {e}")
        return {"success": False, "error": f"compute failed: {e}"}

    if not force and not (digest.get("pillars") or {}):
        logger.info("[outreach_digest] nothing to send — no unverified bookings in window")
        return {"success": True, "skipped": "empty"}

    recipients_env = os.environ.get("OUTREACH_DIGEST_RECIPIENTS") or DEFAULT_RECIPIENTS
    recipients = [e.strip() for e in recipients_env.split(",") if e.strip()]

    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        logger.warning("[outreach_digest] RESEND_API_KEY not set — digest NOT sent")
        return {"success": False, "error": "RESEND_API_KEY not configured", "digest_preview": digest}

    try:
        import resend
        resend.api_key = resend_key
        html = _render_html(digest)
        subject = f"✦ TDC Outreach: {digest.get('total_unverified',0)} unverified places to call today"
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": recipients,
            "subject": subject,
            "html": html,
        })
        logger.info(f"[outreach_digest] sent to {recipients} — resend_id={getattr(result, 'id', None) or (result.get('id') if isinstance(result, dict) else None)}")
        return {"success": True, "recipients": recipients, "total_unverified": digest.get("total_unverified", 0)}
    except Exception as e:
        logger.error(f"[outreach_digest] send failed: {e}")
        return {"success": False, "error": str(e)}


# ────────────────────────────────────────────────────────────────────────────
# APScheduler integration — called once from server.py start-up
# ────────────────────────────────────────────────────────────────────────────

def schedule_outreach_digest(scheduler):
    """
    Schedule the digest for 8 AM IST daily.
    IST = UTC+5:30 → cron should use UTC 02:30 OR timezone-aware 08:00 IST.
    """
    import pytz
    try:
        scheduler.add_job(
            send_outreach_digest,
            trigger="cron",
            hour=8, minute=0,
            timezone=pytz.timezone("Asia/Kolkata"),
            id="places_outreach_digest",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        logger.info("[outreach_digest] scheduled daily at 8:00 AM IST")
    except Exception as e:
        logger.error(f"[outreach_digest] schedule failed: {e}")
