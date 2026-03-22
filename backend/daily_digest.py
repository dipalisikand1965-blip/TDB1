"""
daily_digest.py — The Doggy Company Morning Brief
Sends a beautiful daily digest email to Aditya at 8am IST.
Run via cron: 30 2 * * * cd /app/backend && python3 daily_digest.py
Or trigger manually: POST /api/admin/send-digest
"""
import os
import asyncio
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME",   "pet-os-live-test_database")

DIGEST_TO      = os.environ.get("DIGEST_EMAIL_TO",   "aditya@thedoggycompany.com")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL   = os.environ.get("SENDER_EMAIL",    "woof@thedoggycompany.com")


def get_db():
    client = MongoClient(MONGO_URL)
    return client, client[DB_NAME]


def build_digest_html(stats: dict, top_tickets: list, today_str: str) -> str:
    urgency_color = {"emergency": "#EF4444", "high": "#F59E0B", "medium": "#8B5CF6", "low": "#6B7280"}
    pillar_emoji  = {
        "care": "✂️", "dine": "🍖", "go": "✈️", "play": "🎾", "learn": "📚",
        "shop": "🛍️", "services": "🔧", "paperwork": "📋", "emergency": "🚨",
        "adopt": "🐾", "farewell": "🌷", "celebrate": "🎂", "platform": "🏠",
    }

    ticket_rows = ""
    for t in top_tickets[:8]:
        pillar = t.get("pillar","platform")
        emoji  = pillar_emoji.get(pillar, "📌")
        pet    = t.get("pet_name") or t.get("metadata", {}).get("pet_name", "Unknown")
        subj   = t.get("subject") or t.get("intent_primary","Request")
        urg    = t.get("urgency","low")
        col    = urgency_color.get(urg, "#6B7280")
        ts     = t.get("created_at","")
        if hasattr(ts, "strftime"):
            ts = ts.strftime("%H:%M")
        elif isinstance(ts, str):
            ts = ts[11:16] if len(ts) > 16 else ts
        ticket_rows += f"""
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #1E293B;font-size:13px;">{emoji} {pillar.title()}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #1E293B;font-size:13px;">{pet}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #1E293B;font-size:13px;max-width:220px;">{subj}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #1E293B;font-size:12px;">
            <span style="background:{col}22;color:{col};padding:2px 8px;border-radius:12px;font-weight:700;">{urg.upper()}</span>
          </td>
          <td style="padding:8px 4px;border-bottom:1px solid #1E293B;font-size:12px;color:#64748B;">{ts}</td>
        </tr>"""

    pillar_breakdown = ""
    for pillar, count in sorted(stats.get("by_pillar",{}).items(), key=lambda x:-x[1]):
        emoji = pillar_emoji.get(pillar, "📌")
        bar_w = min(int(count / max(stats.get("new_tickets",1),1) * 100), 100)
        pillar_breakdown += f"""
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="width:70px;font-size:12px;color:#94A3B8;">{emoji} {pillar.title()}</span>
          <div style="flex:1;height:8px;background:#1E293B;border-radius:4px;">
            <div style="width:{bar_w}%;height:8px;background:linear-gradient(90deg,#9333EA,#EC4899);border-radius:4px;"></div>
          </div>
          <span style="font-size:12px;color:#E2E8F0;font-weight:700;min-width:20px;">{count}</span>
        </div>"""

    urgent_alert = ""
    if stats.get("urgent",0) > 0:
        urgent_alert = f"""
        <div style="background:#EF444422;border:1px solid #EF4444;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#EF4444;font-weight:700;margin:0;">🚨 {stats['urgent']} URGENT ticket(s) require immediate attention</p>
        </div>"""

    tickets_table = (
        f'<table style="width:100%;border-collapse:collapse;">'
        f'<thead><tr style="border-bottom:2px solid #334155;">'
        f'<th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">Pillar</th>'
        f'<th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">Pet</th>'
        f'<th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">Request</th>'
        f'<th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">Priority</th>'
        f'<th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">Time</th>'
        f'</tr></thead><tbody style="color:#E2E8F0;">{ticket_rows}</tbody></table>'
        if top_tickets else '<p style="color:#64748B;font-size:13px;">No new tickets today.</p>'
    )

    kpi_row = "".join([
        f'<div style="background:#1E293B;border:1px solid #334155;border-radius:16px;padding:20px;text-align:center;">'
        f'<p style="color:{c};font-size:28px;font-weight:800;margin:0;">{stats.get(k,0)}</p>'
        f'<p style="color:#64748B;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">{label}</p>'
        f'</div>'
        for k, label, c in [
            ("new_tickets","New Tickets","#9333EA"),
            ("urgent","Urgent","#EF4444"),
            ("active_members","Active Members","#10B981"),
            ("new_members_today","New Today","#3B82F6"),
        ]
    ])

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px;">
    <p style="color:#9333EA;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">THE DOGGY COMPANY</p>
    <h1 style="color:#F8FAFC;font-size:28px;font-weight:800;margin:0 0 4px;">Good Morning, Aditya ☀️</h1>
    <p style="color:#64748B;font-size:14px;margin:0;">Daily Concierge Brief — {today_str}</p>
  </div>

  {urgent_alert}

  <!-- KPI Row -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
    {kpi_row}
  </div>

  <!-- Pillar Breakdown -->
  <div style="background:#1E293B;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:24px;">
    <h2 style="color:#F8FAFC;font-size:16px;font-weight:700;margin:0 0 16px;">Pillar Activity</h2>
    {pillar_breakdown or '<p style="color:#64748B;font-size:13px;">No activity yet today.</p>'}
  </div>

  <!-- Top Tickets -->
  <div style="background:#1E293B;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:24px;">
    <h2 style="color:#F8FAFC;font-size:16px;font-weight:700;margin:0 0 16px;">Today's Tickets</h2>
    {tickets_table}
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:24px;">
    <a href="https://custom-merch-hub-23.preview.emergentagent.com/admin"
       style="display:inline-block;background:linear-gradient(135deg,#9333EA,#EC4899);color:#fff;font-weight:700;font-size:14px;padding:14px 40px;border-radius:50px;text-decoration:none;">
      Open Admin Inbox →
    </a>
  </div>

  <!-- Footer -->
  <p style="text-align:center;color:#334155;font-size:11px;">
    Mira OS · The Doggy Company · Auto-sent at 8am IST
  </p>
</div>
</body>
</html>"""


def run_digest(dry_run=False):
    client, db = get_db()
    now    = datetime.now(timezone.utc)
    ist    = now + timedelta(hours=5, minutes=30)
    since  = now - timedelta(hours=24)

    today_str = ist.strftime("%A, %d %B %Y")

    # --- Stats ---
    new_tickets    = db.service_desk_tickets.count_documents({"created_at": {"$gte": since}})
    urgent_tickets = db.service_desk_tickets.count_documents({"created_at": {"$gte": since}, "urgency": {"$in": ["emergency", "high"]}})
    active_members = db.users.count_documents({"role": {"$in": ["member", "premium_member"]}, "is_active": {"$ne": False}})
    new_members    = db.users.count_documents({"created_at": {"$gte": since}})

    # Pillar breakdown
    by_pillar = {}
    for t in db.service_desk_tickets.find({"created_at": {"$gte": since}}, {"pillar":1}):
        p = t.get("pillar","platform")
        by_pillar[p] = by_pillar.get(p, 0) + 1

    stats = {
        "new_tickets":      new_tickets,
        "urgent":           urgent_tickets,
        "active_members":   active_members,
        "new_members_today": new_members,
        "by_pillar":        by_pillar,
    }

    # Top tickets (urgent first, then by time)
    top = list(db.service_desk_tickets.find(
        {"created_at": {"$gte": since}},
        {"_id":0,"ticket_id":1,"subject":1,"pillar":1,"urgency":1,"pet_name":1,"intent_primary":1,"created_at":1,"metadata":1}
    ).sort([("urgency",-1),("created_at",-1)]).limit(10))

    html = build_digest_html(stats, top, today_str)
    client.close()

    if dry_run:
        with open("/tmp/digest_preview.html","w") as f:
            f.write(html)
        logger.info(f"Dry run — saved to /tmp/digest_preview.html | stats={stats}")
        return stats

    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured — skipping email send. Set in backend/.env to enable.")
        logger.info(f"Digest stats: {stats}")
        return stats

    # Send via Resend
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        subject = f"☀️ Morning Brief — {new_tickets} tickets, {urgent_tickets} urgent | {today_str}"
        response = resend.Emails.send({
            "from":    f"Mira OS <{SENDER_EMAIL}>",
            "to":      [DIGEST_TO],
            "subject": subject,
            "html":    html,
        })
        logger.info(f"Digest sent via Resend to {DIGEST_TO} | id={response.get('id')} | {new_tickets} tickets")
    except Exception as e:
        logger.error(f"Digest send failed: {e}")

    return stats


if __name__ == "__main__":
    import sys
    dry = "--dry-run" in sys.argv
    result = run_digest(dry_run=dry)
    print(f"\nDigest stats: {result}")
