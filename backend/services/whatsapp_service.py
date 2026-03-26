"""
WhatsApp Service — The Doggy Company
=====================================
Central notification dispatcher for all WhatsApp messages via Gupshup.

Features:
- Template-first approach (switches automatically when WHATSAPP_TEMPLATES_APPROVED=true)
- Freeform session message fallback until templates are approved
- Idempotency via MongoDB whatsapp_logs (never sends duplicate for same event)
- Logs every send attempt (success/fail) for audit

Templates (submit to Gupshup for approval):
  tdc_welcome_member        — new user signup
  tdc_order_confirmed       — Razorpay payment success
  tdc_concierge_request     — ticket created via attach_or_create_ticket
  tdc_daily_digest          — daily 8am cron
  tdc_birthday_reminder     — 7 days before birthday
  tdc_birthday_today        — day of birthday
  tdc_medication_reminder   — daily if medication in vault
  tdc_pawrent_welcome       — new pet added + age < 6 months
"""

import os
import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"

def _templates_approved() -> bool:
    """Read WHATSAPP_TEMPLATES_APPROVED at call time (not import time) so env changes take effect after restart."""
    return os.environ.get("WHATSAPP_TEMPLATES_APPROVED", "false").lower() == "true"

def get_gupshup_config() -> Dict[str, str]:
    return {
        "api_key":       os.environ.get("GUPSHUP_API_KEY", ""),
        "app_name":      os.environ.get("GUPSHUP_APP_NAME", "TheDoggyCompany"),
        "source_number": os.environ.get("GUPSHUP_SOURCE_NUMBER", "918971702582"),
    }

def is_configured() -> bool:
    return bool(get_gupshup_config()["api_key"])

def clean_phone(phone: str) -> str:
    """Normalize phone to E.164 without + (e.g. 919739908844)"""
    if not phone:
        return ""
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    return digits

# ── Database helper ─────────────────────────────────────────────────────────────
def _get_db():
    try:
        from server import db
        return db
    except Exception:
        return None

# ── Idempotency ─────────────────────────────────────────────────────────────────
async def _already_sent(idempotency_key: str) -> bool:
    """Return True if this event was already sent successfully."""
    db = _get_db()
    if db is None:
        return False
    try:
        existing = await db.whatsapp_logs.find_one(
            {"idempotency_key": idempotency_key, "success": True}
        )
        return existing is not None
    except Exception:
        return False

async def _log(
    idempotency_key: str,
    template: str,
    phone: str,
    message: str,
    result: Dict[str, Any]
) -> None:
    db = _get_db()
    if db is None:
        return
    try:
        await db.whatsapp_logs.update_one(
            {"idempotency_key": idempotency_key},
            {"$set": {
                "idempotency_key": idempotency_key,
                "template":        template,
                "phone":           phone,
                "message_preview": message[:120],
                "success":         result.get("success", False),
                "message_id":      result.get("message_id"),
                "error":           result.get("error"),
                "sent_at":         datetime.now(timezone.utc).isoformat(),
                "templates_mode":  TEMPLATES_APPROVED,
            }},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"[WA] Log error: {e}")

# ── Core sender ─────────────────────────────────────────────────────────────────
async def _send_freeform(phone: str, message: str, context: str = "general") -> Dict[str, Any]:
    """Send a freeform (session) message via Gupshup."""
    if not is_configured():
        return {"success": False, "reason": "Gupshup not configured"}

    cfg = get_gupshup_config()
    cleaned = clean_phone(phone)
    if len(cleaned) < 10:
        return {"success": False, "reason": "Invalid phone"}

    import json
    payload = {
        "channel":    "whatsapp",
        "source":     cfg["source_number"],
        "destination": cleaned,
        "message":    json.dumps({"type": "text", "text": message}),
        "src.name":   cfg["app_name"],
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                GUPSHUP_API_URL,
                headers={"apikey": cfg["api_key"], "Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )
        result = resp.json()
        status = str(result.get("status", "")).strip().lower()
        ok = resp.status_code in (200, 202) and status in ("submitted", "success")
        if ok:
            logger.info(f"[WA-{context.upper()}] ✅ Sent to {cleaned[:6]}*** | ID: {result.get('messageId')}")
            return {"success": True, "message_id": result.get("messageId"), "status": status}
        else:
            logger.error(f"[WA-{context.upper()}] ❌ HTTP {resp.status_code} | {result}")
            return {"success": False, "error": result.get("message", "Unknown"), "http_code": resp.status_code}
    except Exception as e:
        logger.error(f"[WA-{context.upper()}] Exception: {e}")
        return {"success": False, "error": str(e)}


async def _send_template(phone: str, template_name: str, params: List[str]) -> Dict[str, Any]:
    """Send an approved template message via Gupshup."""
    if not is_configured():
        return {"success": False, "reason": "Gupshup not configured"}

    cfg = get_gupshup_config()
    cleaned = clean_phone(phone)
    if len(cleaned) < 10:
        return {"success": False, "reason": "Invalid phone"}

    import json
    msg = json.dumps({
        "type": "template",
        "template": {
            "id": template_name,
            "params": params,
        }
    })
    payload = {
        "channel":    "whatsapp",
        "source":     cfg["source_number"],
        "destination": cleaned,
        "message":    msg,
        "src.name":   cfg["app_name"],
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                GUPSHUP_API_URL,
                headers={"apikey": cfg["api_key"], "Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )
        result = resp.json()
        status = str(result.get("status", "")).strip().lower()
        ok = resp.status_code in (200, 202) and status in ("submitted", "success")
        if ok:
            return {"success": True, "message_id": result.get("messageId"), "template": template_name}
        else:
            logger.error(f"[WA-TEMPLATE] ❌ {template_name} to {cleaned[:6]}*** | HTTP {resp.status_code} | {result}")
            return {"success": False, "error": result.get("message", "Unknown")}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def send_whatsapp(
    phone: str,
    template_name: str,
    template_params: List[str],
    fallback_message: str,
    idempotency_key: str,
    context: str = "general"
) -> Dict[str, Any]:
    """
    Master send function. Tries template if TEMPLATES_APPROVED=true,
    falls back to freeform session message. Idempotent per idempotency_key.
    """
    if await _already_sent(idempotency_key):
        logger.info(f"[WA] Skipping duplicate: {idempotency_key}")
        return {"success": True, "skipped": True, "reason": "already_sent"}

    if _templates_approved():
        result = await _send_template(phone, template_name, template_params)
        if result.get("success"):
            await _log(idempotency_key, template_name, phone, fallback_message, result)
            return result
        # template failed — fall through to freeform
        logger.warning(f"[WA] Template failed, falling back to freeform: {result.get('error')}")

    result = await _send_freeform(phone, fallback_message, context)
    await _log(idempotency_key, f"freeform:{template_name}", phone, fallback_message, result)
    return result

# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API — One function per template
# ══════════════════════════════════════════════════════════════════════════════

async def send_welcome_member(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """tdc_welcome_member — fires on new user signup"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or user.get("full_name") or "there"
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    breed = pet.get("breed", "Dog") if pet else "Dog"

    fallback = f"""✦ Welcome to The Doggy Company, {name}!

You just did something most people never do — you decided that {pet_name} deserves to be truly *known*.

Start {pet_name}'s Soul Profile:
👉 thedoggycompany.com/my-pets

Mira — your personal pet AI — is ready. The more she knows, the more magical this becomes.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_welcome_member",
        template_params=[name, pet_name],
        fallback_message=fallback,
        idempotency_key=f"welcome_member:{user.get('id') or user.get('email')}",
        context="welcome"
    )


async def send_order_confirmed(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]],
    order: Dict[str, Any]
) -> Dict[str, Any]:
    """tdc_order_confirmed — fires on Razorpay payment success"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    order_id = order.get("orderId") or order.get("id") or order.get("razorpay_order_id", "")
    amount = order.get("total") or order.get("amount", 0)
    items_summary = order.get("items_summary") or order.get("plan_name") or "your order"

    fallback = f"""✦ Order Confirmed for {pet_name}!

Hi {name},

Your order has been confirmed.

📦 Order: {order_id}
🛍️ Items: {items_summary}
💰 Total: ₹{amount:,.0f}

We'll notify you when it's on its way.

Questions? Just reply here.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_order_confirmed",
        template_params=[name, pet_name, str(order_id), str(items_summary), f"₹{amount:,.0f}"],
        fallback_message=fallback,
        idempotency_key=f"order_confirmed:{order_id}",
        context="order"
    )


async def send_concierge_request(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]],
    ticket: Dict[str, Any]
) -> Dict[str, Any]:
    """tdc_concierge_request — fires when attach_or_create_ticket creates a new ticket"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    ticket_id = ticket.get("ticket_id") or ticket.get("id", "")
    subject = ticket.get("subject") or ticket.get("intent_primary") or "your request"
    pillar = ticket.get("pillar", "services").title()

    fallback = f"""✦ Your Concierge® has your request, {name}

We've received your request for *{pet_name}*.

🎟️ Reference: {ticket_id}
📋 Category: {pillar} — {subject}

Our Concierge® team will be in touch within 24 hours.

Reply here anytime to add more details.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_concierge_request",
        template_params=[name, pet_name, str(ticket_id), pillar],
        fallback_message=fallback,
        idempotency_key=f"concierge_request:{ticket_id}",
        context="concierge"
    )


async def send_daily_digest(
    user: Dict[str, Any],
    pet: Optional[Dict[str, Any]],
    tip: str = ""
) -> Dict[str, Any]:
    """tdc_daily_digest — fires at 8am daily cron"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    today = datetime.now(timezone.utc).strftime("%d %b %Y")

    fallback = f"""☀️ Good morning, {name}!

Today's brief for *{pet_name}* — {today}

{tip or "Keep {pet_name} happy and healthy today."}

Open Mira for personalised recommendations:
👉 thedoggycompany.com/my-pets

— The Doggy Company 🐕"""

    # Daily digest uses date-based idempotency (one per user per day)
    today_key = datetime.now(timezone.utc).strftime("%Y%m%d")
    user_id = user.get("id") or user.get("email", "unknown")

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_daily_digest",
        template_params=[name, pet_name, today, tip[:100] if tip else "Have a great day!"],
        fallback_message=fallback,
        idempotency_key=f"daily_digest:{user_id}:{today_key}",
        context="digest"
    )


async def send_birthday_reminder(
    user: Dict[str, Any],
    pet: Dict[str, Any],
    days_until: int = 7
) -> Dict[str, Any]:
    """tdc_birthday_reminder — fires 7 days before birthday"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet")
    today_key = datetime.now(timezone.utc).strftime("%Y%m%d")

    fallback = f"""🎂 {pet_name}'s birthday is in {days_until} days!

Hi {name},

Make it unforgettable with The Doggy Company:

🎂 Custom birthday cake
🎁 Celebration hamper
📸 Pawty photoshoot
🎪 Party planning by Concierge®

Start planning:
👉 thedoggycompany.com/celebrate

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_birthday_reminder",
        template_params=[name, pet_name, str(days_until)],
        fallback_message=fallback,
        idempotency_key=f"birthday_reminder:{pet.get('id', pet_name)}:{today_key}",
        context="birthday"
    )


async def send_birthday_today(
    user: Dict[str, Any],
    pet: Dict[str, Any]
) -> Dict[str, Any]:
    """tdc_birthday_today — fires on the day of the birthday"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet")
    today_key = datetime.now(timezone.utc).strftime("%Y%m%d")

    fallback = f"""🎉 Happy Birthday, {pet_name}!

Dear {name},

Today is *{pet_name}'s* special day! We hope it's filled with love, treats, and tail wags. 🐾

Celebrate with us:
👉 thedoggycompany.com/celebrate

From all of us at The Doggy Company — wishing {pet_name} the happiest birthday! 🎂

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_birthday_today",
        template_params=[name, pet_name],
        fallback_message=fallback,
        idempotency_key=f"birthday_today:{pet.get('id', pet_name)}:{today_key}",
        context="birthday"
    )


async def send_medication_reminder(
    user: Dict[str, Any],
    pet: Dict[str, Any],
    medication: Dict[str, Any]
) -> Dict[str, Any]:
    """tdc_medication_reminder — fires daily if medication in vault"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your pet")
    med_name = medication.get("name") or medication.get("medication_name", "medication")
    dosage = medication.get("dosage") or medication.get("dose", "")
    today_key = datetime.now(timezone.utc).strftime("%Y%m%d")

    fallback = f"""💊 Medication Reminder for {pet_name}

Hi {name},

Don't forget *{pet_name}'s* medication today:

💊 {med_name}{f' — {dosage}' if dosage else ''}

Log it in the Health Vault:
👉 thedoggycompany.com/care

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_medication_reminder",
        template_params=[name, pet_name, med_name, dosage or "as prescribed"],
        fallback_message=fallback,
        idempotency_key=f"med_reminder:{pet.get('id', pet_name)}:{med_name}:{today_key}",
        context="medication"
    )


async def send_pawrent_welcome(
    user: Dict[str, Any],
    pet: Dict[str, Any]
) -> Dict[str, Any]:
    """tdc_pawrent_welcome — fires when new pet added AND age < 6 months"""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"
    pet_name = pet.get("name", "your puppy")
    breed = pet.get("breed", "puppy")

    fallback = f"""🐾 Welcome to the family, {pet_name}!

Hi {name},

Congratulations on your new puppy! *{pet_name}* ({breed}) has just begun the most important journey of their life — and we're here for every step.

What to do first:
🩺 Add health records to the Vault
🍖 Set up Mira's food plan
📅 Book your first vet visit via Concierge®

👉 thedoggycompany.com/care

With love for the tiniest paws,
— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_pawrent_welcome",
        template_params=[name, pet_name, breed],
        fallback_message=fallback,
        idempotency_key=f"pawrent_welcome:{pet.get('id', pet_name)}",
        context="pawrent"
    )



# ── Trial Lifecycle WhatsApp Notifications ─────────────────────────────────

async def send_trial_ending_5days(user: Dict[str, Any]) -> Dict[str, Any]:
    """tdc_trial_ending_5days — Day 25: 5 days left warning."""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"

    fallback = f"""✦ Hi {name}, your free trial ends in 5 days.

After that, your access will switch to read-only mode.

Upgrade now to keep all features:
👉 thedoggycompany.com/upgrade

Your pet's data, soul profile, and history are always safe with us — no matter what.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_trial_ending_5days",
        template_params=[name],
        fallback_message=fallback,
        idempotency_key=f"trial_ending_5days:{user.get('id') or user.get('email')}",
        context="trial"
    )


async def send_trial_expired(user: Dict[str, Any]) -> Dict[str, Any]:
    """tdc_trial_expired — Day 30: trial has ended, now read-only."""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"

    fallback = f"""✦ Hi {name}, your 30-day free trial has ended.

Your account is now in read-only mode. You can still browse and view your pet's data, but booking and purchasing require an active plan.

Upgrade to unlock everything:
👉 thedoggycompany.com/upgrade

All your data is safe and waiting for you.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_trial_expired",
        template_params=[name],
        fallback_message=fallback,
        idempotency_key=f"trial_expired:{user.get('id') or user.get('email')}",
        context="trial"
    )


async def send_grace_period_warning(user: Dict[str, Any]) -> Dict[str, Any]:
    """tdc_grace_period_warning — Day 37: account will be paused in 7 days."""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"

    fallback = f"""⚠️ Hi {name}, your account will be paused in 7 days.

After that, you'll need to upgrade to access your pet's dashboard.

Don't worry — your pet's data, soul profile, and all memories are safe. We never delete anything.

Upgrade now to avoid interruption:
👉 thedoggycompany.com/upgrade

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_grace_period_warning",
        template_params=[name],
        fallback_message=fallback,
        idempotency_key=f"grace_period_warning:{user.get('id') or user.get('email')}",
        context="trial"
    )


async def send_account_paused(user: Dict[str, Any]) -> Dict[str, Any]:
    """tdc_account_paused — Day 44: account is now paused."""
    phone = user.get("phone") or user.get("mobile") or user.get("whatsapp", "")
    if not phone:
        return {"success": False, "reason": "No phone"}

    name = user.get("name") or "there"

    fallback = f"""🔒 Hi {name}, your account has been paused.

Your pet's complete soul profile, health vault, and all memories are preserved — safe and waiting for you.

To reactivate, simply choose a plan:
👉 thedoggycompany.com/upgrade

We're here whenever you're ready.

— The Doggy Company 🐕"""

    return await send_whatsapp(
        phone=phone,
        template_name="tdc_account_paused",
        template_params=[name],
        fallback_message=fallback,
        idempotency_key=f"account_paused:{user.get('id') or user.get('email')}",
        context="trial"
    )
