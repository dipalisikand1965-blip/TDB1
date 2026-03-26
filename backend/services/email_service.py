"""
Email Service — The Doggy Company
===================================
Transactional email via Resend for all key lifecycle events.

Templates:
  welcome          — New user signup
  order_confirmed  — Razorpay payment success
  concierge_request — Ticket created
  birthday_reminder — 7 days before birthday
  soul_complete     — Pet soul profile 100% complete

Brand:
  Background: #FDF6EE (cream)
  Header:     #1A0A2E (dark purple)
  Accent:     #D4A840 (gold)
  Text:       #2C1810 (warm dark)
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = "welcome@thedoggycompany.com"
SITE_URL = "https://thedoggycompany.com"


def _get_resend():
    try:
        import resend
        if RESEND_API_KEY:
            resend.api_key = RESEND_API_KEY
            return resend
    except ImportError:
        pass
    return None


def _get_db():
    try:
        from server import db
        return db
    except Exception:
        return None


async def _log_email(idempotency_key: str, template: str, to: str, result: Dict[str, Any]):
    db = _get_db()
    if db is None:
        return
    try:
        await db.email_logs.update_one(
            {"idempotency_key": idempotency_key},
            {"$set": {
                "idempotency_key": idempotency_key,
                "template": template,
                "to": to,
                "success": result.get("success", False),
                "email_id": result.get("email_id"),
                "error": result.get("error"),
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"[EMAIL] Log error: {e}")


async def _already_sent(idempotency_key: str) -> bool:
    db = _get_db()
    if db is None:
        return False
    try:
        existing = await db.email_logs.find_one(
            {"idempotency_key": idempotency_key, "success": True}
        )
        return existing is not None
    except Exception:
        return False


async def _send(
    to: str,
    subject: str,
    html: str,
    idempotency_key: str,
    template: str,
    from_email: str = None,
    reply_to: str = None
) -> Dict[str, Any]:
    if not to:
        return {"success": False, "reason": "No email"}
    if not RESEND_API_KEY:
        logger.warning("[EMAIL] RESEND_API_KEY not set")
        return {"success": False, "reason": "Resend not configured"}

    if await _already_sent(idempotency_key):
        logger.info(f"[EMAIL] Skipping duplicate: {idempotency_key}")
        return {"success": True, "skipped": True}

    resend = _get_resend()
    if not resend:
        return {"success": False, "reason": "Resend import failed"}

    sender = from_email or f"The Doggy Company <{FROM_EMAIL}>"
    payload = {
        "from": sender,
        "to": to,
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        result = resend.Emails.send(payload)
        email_id = result.get("id") if isinstance(result, dict) else str(result)
        logger.info(f"[EMAIL-{template.upper()}] ✅ Sent to {to} | ID: {email_id}")
        r = {"success": True, "email_id": email_id}
        await _log_email(idempotency_key, template, to, r)
        return r
    except Exception as e:
        logger.error(f"[EMAIL-{template.upper()}] ❌ {to}: {e}")
        r = {"success": False, "error": str(e)}
        await _log_email(idempotency_key, template, to, r)
        return r


# ══════════════════════════════════════════════════════════════════════════════
# SHARED HEADER / FOOTER
# ══════════════════════════════════════════════════════════════════════════════

_HEADER = """
<div style="background:#1A0A2E;padding:32px 40px 24px;text-align:center;border-radius:12px 12px 0 0;">
  <div style="display:inline-block;border:2px solid #D4A840;border-radius:50px;padding:4px 20px;margin-bottom:12px;">
    <span style="color:#D4A840;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Doggy Company</span>
  </div>
  <div style="color:#ffffff;font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:1px;">Pet Concierge®</div>
</div>
<div style="height:3px;background:linear-gradient(90deg,#1A0A2E,#D4A840,#1A0A2E);"></div>
"""

_FOOTER = f"""
<div style="background:#1A0A2E;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="color:#D4A840;font-family:Georgia,serif;font-size:12px;margin:0 0 8px;">✦ The world's first Pet Life OS</p>
  <p style="color:#9D8BA3;font-size:11px;margin:0 0 12px;">Built in memory of Mystique · 2024</p>
  <div style="margin:12px 0;">
    <a href="{SITE_URL}" style="color:#D4A840;text-decoration:none;font-size:11px;margin:0 12px;">thedoggycompany.com</a>
    <span style="color:#4A3558;">|</span>
    <a href="{SITE_URL}/unsubscribe" style="color:#9D8BA3;text-decoration:none;font-size:11px;margin:0 12px;">Unsubscribe</a>
    <span style="color:#4A3558;">|</span>
    <a href="{SITE_URL}/privacy" style="color:#9D8BA3;text-decoration:none;font-size:11px;margin:0 12px;">Privacy Policy</a>
  </div>
</div>
"""

def _btn(label: str, url: str) -> str:
    return f"""
    <div style="text-align:center;margin:24px 0;">
      <a href="{url}" style="background:#1A0A2E;color:#D4A840;font-family:Georgia,serif;font-size:14px;font-weight:700;letter-spacing:1px;padding:14px 36px;border-radius:50px;text-decoration:none;border:2px solid #D4A840;display:inline-block;">{label}</a>
    </div>"""

def _divider() -> str:
    return '<div style="height:1px;background:#E8D9B0;margin:24px 0;"></div>'

def _wrap(body: str) -> str:
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF6EE;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,10,46,0.12);">
{_HEADER}
<div style="background:#FDF6EE;padding:40px;">
{body}
</div>
{_FOOTER}
</div>
</body></html>"""


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL 1 — WELCOME (signup)
# ══════════════════════════════════════════════════════════════════════════════

async def send_welcome_email(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    email = user.get("email", "")
    if not email:
        return {"success": False, "reason": "No email"}

    name = user.get("name") or "there"
    first = name.split()[0] if name and name != "there" else name
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    breed = pet.get("breed", "Dog") if pet else "Dog"
    member_id = user.get("id", "")[:8].upper() if user.get("id") else "NEW"
    tier = (user.get("membership_tier") or "free").replace("_", " ").title()

    body = f"""
    <p style="color:#2C1810;font-size:16px;font-style:italic;text-align:center;margin:0 0 24px;">Welcome, {first}. 🌷</p>
    <p style="color:#2C1810;font-size:15px;line-height:1.8;margin:0 0 16px;">You just did something most people never do.</p>
    <p style="color:#2C1810;font-size:15px;line-height:1.8;margin:0 0 16px;">You decided that <strong>{pet_name}</strong> deserves to be truly known.</p>
    <p style="color:#9D8BA3;font-size:15px;line-height:1.8;font-style:italic;margin:0 0 24px;">Not just fed. Not just walked.<br>Known.</p>
    {_divider()}
    <p style="color:#1A0A2E;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 16px;">What happens next</p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 16px;">Mira — your personal pet AI — is ready to learn everything about <strong>{pet_name}</strong>.</p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 24px;">The more she knows, the more magical this becomes.</p>
    {_btn(f"Start {pet_name}'s Soul Profile →", f"{SITE_URL}/my-pets")}
    {_divider()}
    <p style="color:#1A0A2E;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 16px;">Your first three steps</p>
    <div style="margin:0 0 12px;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;"><strong>🐾 Complete {pet_name}'s Soul Profile</strong></p>
      <p style="color:#9D8BA3;font-size:13px;margin:0 0 4px;">Mira learns who {pet_name} truly is · Takes about 10 minutes</p>
      <a href="{SITE_URL}/my-pets" style="color:#D4A840;font-size:12px;">Start Soul Profile →</a>
    </div>
    <div style="margin:12px 0;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;"><strong>🎩 Meet your Concierge®</strong></p>
      <p style="color:#9D8BA3;font-size:13px;margin:0 0 4px;">Everything arranged. Always personal.</p>
      <a href="{SITE_URL}/services" style="color:#D4A840;font-size:12px;">Explore your pillars →</a>
    </div>
    <div style="margin:12px 0 24px;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;"><strong>✦ Ask Mira anything</strong></p>
      <p style="color:#9D8BA3;font-size:13px;margin:0 0 4px;">She already knows {pet_name}'s breed. Tell her more.</p>
      <a href="{SITE_URL}/mira-os" style="color:#D4A840;font-size:12px;">Open Mira →</a>
    </div>
    {_divider()}
    <div style="background:#1A0A2E;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
      <p style="color:#D4A840;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your Membership</p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">Member: <strong style="color:#fff;">{first}</strong></p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">Pet: <strong style="color:#fff;">{pet_name} · {breed}</strong></p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">Member ID: <strong style="color:#D4A840;">{member_id}</strong></p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">Tier: <strong style="color:#fff;">{tier}</strong></p>
    </div>
    {_btn("View your Pet Life Pass →", f"{SITE_URL}/membership")}
    {_divider()}
    <p style="color:#9D8BA3;font-size:13px;font-style:italic;text-align:center;line-height:1.8;">
      "Every recommendation, every service, every product —<br>personalised to {pet_name}'s soul."<br>
      <strong style="color:#D4A840;">— Mira</strong>
    </p>
    """

    return await _send(
        to=email,
        subject=f"✦ Welcome to The Doggy Company, {first}",
        html=_wrap(body),
        idempotency_key=f"welcome_email:{user.get('id') or email}",
        template="welcome"
    )


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL 2 — ORDER CONFIRMED
# ══════════════════════════════════════════════════════════════════════════════

async def send_order_confirmed_email(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]],
    order: Dict[str, Any]
) -> Dict[str, Any]:
    email = user.get("email", "")
    if not email:
        return {"success": False, "reason": "No email"}

    name = user.get("name") or "there"
    first = name.split()[0] if name and name != "there" else name
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    breed = pet.get("breed", "Dog") if pet else "Dog"
    order_id = order.get("orderId") or order.get("id") or order.get("razorpay_order_id", "")
    amount = float(order.get("total") or order.get("amount", 0))
    order_date = order.get("order_date") or datetime.now(timezone.utc).strftime("%d %b %Y")
    items = order.get("items") or []
    items_summary = order.get("items_summary") or order.get("plan_name") or "your order"

    # Financial breakdown
    subtotal = float(order.get("subtotal") or amount / 1.18)
    gst_rate = float(order.get("gst_rate") or 18)
    gst_amount = float(order.get("gst_amount") or (amount - subtotal))
    shipping = float(order.get("shipping") or 0)
    total_paid = float(order.get("total_paid") or amount)
    invoice_url = order.get("invoice_pdf_url") or f"{SITE_URL}/orders/{order_id}/invoice"
    tracking_url = order.get("order_tracking_url") or f"{SITE_URL}/orders/{order_id}"

    # Build items rows
    if items:
        items_html = ""
        for item in items:
            n = item.get("item_name") or item.get("name") or item.get("product_name", "Item")
            desc = item.get("item_description") or item.get("description") or ""
            price = float(item.get("item_price") or item.get("price") or 0)
            items_html += f"""
            <div style="padding:12px 0;border-bottom:1px solid #E8D9B0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="flex:1;">
                  <div style="color:#2C1810;font-size:14px;font-weight:600;margin-bottom:2px;">{n}</div>
                  {f'<div style="color:#9D8BA3;font-size:12px;">{desc}</div>' if desc else ''}
                </div>
                <div style="color:#1A0A2E;font-size:14px;font-weight:700;margin-left:16px;">₹{price:,.0f}</div>
              </div>
            </div>"""
    else:
        items_html = f"""
        <div style="padding:12px 0;border-bottom:1px solid #E8D9B0;">
          <div style="display:flex;justify-content:space-between;">
            <div style="color:#2C1810;font-size:14px;font-weight:600;">{items_summary}</div>
            <div style="color:#1A0A2E;font-size:14px;font-weight:700;">₹{subtotal:,.0f}</div>
          </div>
        </div>"""

    body = f"""
    <p style="color:#2C1810;font-size:20px;font-weight:700;text-align:center;font-family:Georgia,serif;margin:0 0 8px;">Order Confirmed! 🎉</p>
    <p style="color:#9D8BA3;font-size:14px;text-align:center;margin:0 0 24px;">Everything is in hand, {first}. Your Concierge® is on it.</p>
    {_divider()}
    <p style="color:#1A0A2E;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 12px;">Order Summary</p>
    <div style="background:#1A0A2E;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><p style="color:#9D8BA3;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">Order ID</p><p style="color:#D4A840;font-size:13px;font-weight:700;margin:0;">{order_id}</p></div>
        <div><p style="color:#9D8BA3;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">For</p><p style="color:#fff;font-size:13px;font-weight:600;margin:0;">{pet_name} · {breed}</p></div>
        <div><p style="color:#9D8BA3;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">Date</p><p style="color:#fff;font-size:13px;margin:0;">{order_date}</p></div>
        <div><p style="color:#9D8BA3;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">Status</p><p style="color:#22C55E;font-size:13px;font-weight:700;margin:0;">Payment via Razorpay ✓</p></div>
      </div>
    </div>
    {_divider()}
    <p style="color:#1A0A2E;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 12px;">What you ordered</p>
    {items_html}
    {_divider()}
    <p style="color:#1A0A2E;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 12px;">Invoice</p>
    <div style="margin:0 0 24px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#6B7280;font-size:13px;">Subtotal</span><span style="color:#2C1810;font-size:13px;">₹{subtotal:,.0f}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#6B7280;font-size:13px;">GST ({gst_rate:.0f}%)</span><span style="color:#2C1810;font-size:13px;">₹{gst_amount:,.0f}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#6B7280;font-size:13px;">Shipping</span><span style="color:#2C1810;font-size:13px;">{f'₹{shipping:,.0f}' if shipping else 'Free'}</span></div>
      <div style="height:1px;background:#D4A840;margin:8px 0;"></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#1A0A2E;font-size:15px;font-weight:700;">Total Paid</span><span style="color:#D4A840;font-size:16px;font-weight:700;">₹{total_paid:,.0f}</span></div>
    </div>
    {_btn("Download Invoice PDF →", invoice_url)}
    {_divider()}
    <p style="color:#1A0A2E;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 12px;">What happens next</p>
    <div style="margin:0 0 8px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:20px;">🎩</span>
      <div><p style="color:#2C1810;font-size:13px;font-weight:600;margin:0 0 2px;">Your Concierge® will confirm delivery details within 24 hours</p></div>
    </div>
    <div style="margin:0 0 8px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:20px;">📦</span>
      <div><p style="color:#2C1810;font-size:13px;font-weight:600;margin:0 0 2px;">Freshly prepared for {pet_name}</p></div>
    </div>
    <div style="margin:0 0 24px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:20px;">🚚</span>
      <div><p style="color:#2C1810;font-size:13px;font-weight:600;margin:0 0 2px;">Delivered with love</p></div>
    </div>
    {_btn("Track your order →", tracking_url)}
    <div style="text-align:center;margin:8px 0 24px;">
      <a href="{SITE_URL}/concierge" style="color:#D4A840;text-decoration:none;font-size:13px;margin:0 12px;">Contact Concierge® →</a>
      <a href="{SITE_URL}/my-orders" style="color:#6B7280;text-decoration:none;font-size:13px;margin:0 12px;">View My Orders →</a>
    </div>
    {_divider()}
    <p style="color:#9D8BA3;font-size:13px;font-style:italic;text-align:center;line-height:1.8;">
      "This was made for {pet_name}.<br>Every detail checked by Mira."<br>
      <strong style="color:#D4A840;">— The Doggy Company Concierge®</strong>
    </p>
    """

    return await _send(
        to=email,
        subject=f"✦ Order confirmed for {pet_name} · #{order_id}",
        html=_wrap(body),
        idempotency_key=f"order_email:{order_id}",
        template="order_confirmed",
        from_email=f"The Doggy Company Orders <orders@thedoggycompany.com>",
        reply_to="concierge@thedoggycompany.com"
    )


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL 3 — CONCIERGE REQUEST
# ══════════════════════════════════════════════════════════════════════════════

async def send_concierge_request_email(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]],
    ticket: Dict[str, Any]
) -> Dict[str, Any]:
    email = user.get("email", "")
    if not email:
        return {"success": False, "reason": "No email"}

    name = user.get("name") or "there"
    first = name.split()[0] if name and name != "there" else name
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    ticket_id = ticket.get("ticket_id") or ticket.get("id", "")
    subject_line = ticket.get("subject") or "your request"
    pillar = (ticket.get("pillar") or "services").title()

    body = f"""
    <p style="color:#2C1810;font-size:16px;text-align:center;margin:0 0 24px;">
      ✦ Your Concierge® has your request
    </p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 16px;">Hi {first},</p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 24px;">
      We've received your request for <strong>{pet_name}</strong>. Our Concierge® team is on it.
    </p>
    <div style="background:#1A0A2E;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
      <p style="color:#D4A840;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Request Details</p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">🎟️ Reference: <strong style="color:#fff;">{ticket_id}</strong></p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">📋 Category: <strong style="color:#fff;">{pillar}</strong></p>
      <p style="color:#E8D9B0;font-size:13px;margin:4px 0;">📝 Subject: <strong style="color:#fff;">{subject_line}</strong></p>
    </div>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 16px;">
      Our Concierge® team will be in touch within 24 hours with a personalised plan.
    </p>
    <p style="color:#2C1810;font-size:13px;line-height:1.8;margin:0 0 24px;">
      Simply reply to this email to add more details — your reference number will be tracked automatically.
    </p>
    {_btn("View your request →", f"{SITE_URL}/my-pets")}
    {_divider()}
    <p style="color:#9D8BA3;font-size:12px;text-align:center;font-style:italic;">
      Your reference number: <strong style="color:#D4A840;">{ticket_id}</strong>
    </p>
    """

    return await _send(
        to=email,
        subject=f"✦ Your Concierge® has your request · {ticket_id}",
        html=_wrap(body),
        idempotency_key=f"concierge_email:{ticket_id}",
        template="concierge_request"
    )


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL 4 — BIRTHDAY REMINDER
# ══════════════════════════════════════════════════════════════════════════════

async def send_birthday_reminder_email(
    user: Dict[str, Any],
    pet: Dict[str, Any],
    days_until: int = 7
) -> Dict[str, Any]:
    email = user.get("email", "")
    if not email:
        return {"success": False, "reason": "No email"}

    name = user.get("name") or "there"
    first = name.split()[0] if name and name != "there" else name
    pet_name = pet.get("name", "your pet")
    today_key = datetime.now(timezone.utc).strftime("%Y%m%d")

    body = f"""
    <p style="color:#2C1810;font-size:16px;text-align:center;margin:0 0 24px;">
      🎂 {pet_name}'s birthday is in {days_until} days!
    </p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 16px;">Hi {first},</p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 24px;">
      The countdown has begun! <strong>{pet_name}'s</strong> big day is in just {days_until} days.
    </p>
    {_divider()}
    <p style="color:#1A0A2E;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 16px;">Make it unforgettable</p>
    <div style="margin:0 0 12px;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;">🎂 <strong>Custom Birthday Cake</strong></p>
      <p style="color:#9D8BA3;font-size:12px;margin:0;">Personalised to {pet_name}'s breed and taste</p>
    </div>
    <div style="margin:12px 0;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;">🎁 <strong>Celebration Hamper</strong></p>
      <p style="color:#9D8BA3;font-size:12px;margin:0;">Curated gifts chosen by Mira for {pet_name}</p>
    </div>
    <div style="margin:12px 0;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;">📸 <strong>Pawty Photoshoot</strong></p>
      <p style="color:#9D8BA3;font-size:12px;margin:0;">Professional photos to remember the day</p>
    </div>
    <div style="margin:12px 0 24px;">
      <p style="color:#2C1810;font-size:14px;margin:0 0 4px;">🎪 <strong>Concierge® Party Planning</strong></p>
      <p style="color:#9D8BA3;font-size:12px;margin:0;">We'll arrange everything, you just show up</p>
    </div>
    {_btn(f"Plan {pet_name}'s celebration →", f"{SITE_URL}/celebrate")}
    {_divider()}
    <p style="color:#9D8BA3;font-size:12px;text-align:center;">Don't wait — the best options book fast!</p>
    """

    return await _send(
        to=email,
        subject=f"🎂 {pet_name}'s birthday is in {days_until} days",
        html=_wrap(body),
        idempotency_key=f"birthday_email:{pet.get('id', pet_name)}:{today_key}",
        template="birthday_reminder"
    )


# ══════════════════════════════════════════════════════════════════════════════
# EMAIL 5 — SOUL PROFILE COMPLETE
# ══════════════════════════════════════════════════════════════════════════════

async def send_soul_complete_email(
    user: Dict[str, Any],
    pet: Dict[str, Any]
) -> Dict[str, Any]:
    email = user.get("email", "")
    if not email:
        return {"success": False, "reason": "No email"}

    name = user.get("name") or "there"
    first = name.split()[0] if name and name != "there" else name
    pet_name = pet.get("name", "your pet")
    breed = pet.get("breed", "Dog")

    body = f"""
    <p style="color:#2C1810;font-size:16px;text-align:center;margin:0 0 24px;">
      ✦ Mira now knows {pet_name} completely
    </p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 16px;">Hi {first},</p>
    <p style="color:#2C1810;font-size:14px;line-height:1.8;margin:0 0 24px;">
      <strong>{pet_name}'s</strong> Soul Profile is 100% complete. 
      Mira now knows everything — breed quirks, allergies, life stage, favorite things, and more.
    </p>
    {_divider()}
    <p style="color:#1A0A2E;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 16px;">What this unlocks</p>
    <div style="margin:0 0 8px;"><p style="color:#2C1810;font-size:14px;margin:0;">✅ Hyper-personalised product recommendations</p></div>
    <div style="margin:0 0 8px;"><p style="color:#2C1810;font-size:14px;margin:0;">✅ Breed-safe food and treat suggestions</p></div>
    <div style="margin:0 0 8px;"><p style="color:#2C1810;font-size:14px;margin:0;">✅ Life-stage aware health insights</p></div>
    <div style="margin:0 0 24px;"><p style="color:#2C1810;font-size:14px;margin:0;">✅ Mira's full intelligence — for {pet_name}'s whole life</p></div>
    <div style="background:#1A0A2E;border-radius:8px;padding:20px 24px;margin:0 0 24px;text-align:center;">
      <p style="color:#D4A840;font-family:Georgia,serif;font-size:16px;font-style:italic;margin:0;">
        "{pet_name} ({breed}) is now fully known to Mira.<br>Every recommendation from here is personal."
      </p>
      <p style="color:#9D8BA3;font-size:12px;margin:12px 0 0;font-style:normal;">— Mira</p>
    </div>
    {_btn(f"See {pet_name}'s personalised world →", f"{SITE_URL}/my-pets")}
    """

    return await _send(
        to=email,
        subject=f"✦ Mira now knows {pet_name} completely",
        html=_wrap(body),
        idempotency_key=f"soul_complete:{pet.get('id', pet_name)}",
        template="soul_complete"
    )
