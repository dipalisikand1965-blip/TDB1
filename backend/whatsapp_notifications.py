"""
WhatsApp Notification Service — The Doggy Company
Sends HSM template messages via Gupshup when WHATSAPP_TEMPLATES_APPROVED=true,
falls back to free-form session messages otherwise.

Approved templates (8):
  tdc_welcome_member1      → membership_activated
  tdc_pawrent_welcome1     → welcome_new_user
  tdc_medication_reminder  → medication_reminder (new)
  tdc_birthday_today       → pet_birthday_today
  tdc_daily_digest         → daily_digest (new)
  tdc_order_confirmed      → order_confirmed
  tdc_concierge_request    → concierge_message
  orderconfirmation        → payment_received / order_confirmed fallback
"""

import os
import json
import httpx
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# ── Gupshup endpoint ──────────────────────────────────────────────────────────
GUPSHUP_MSG_URL      = "https://api.gupshup.io/wa/api/v1/msg"
GUPSHUP_TEMPLATE_URL = "https://api.gupshup.io/wa/api/v1/template/msg"  # HSM endpoint


# ── Config helpers ────────────────────────────────────────────────────────────

def get_gupshup_config() -> Dict[str, str]:
    return {
        "api_key":       os.environ.get("GUPSHUP_API_KEY", ""),
        "app_name":      os.environ.get("GUPSHUP_APP_NAME", "TheDoggyCompany"),
        "source_number": (
            os.environ.get("GUPSHUP_SOURCE_NUMBER")
            or os.environ.get("WHATSAPP_NUMBER", "919663185747")
        ),
    }


def is_gupshup_configured() -> bool:
    return bool(get_gupshup_config()["api_key"])


def templates_approved() -> bool:
    return os.environ.get("WHATSAPP_TEMPLATES_APPROVED", "false").lower() == "true"


def get_template(env_key: str, fallback: str = "") -> str:
    """Read template name from env, e.g. get_template('TEMPLATE_BIRTHDAY_TODAY')"""
    return os.environ.get(env_key, fallback)


def format_phone_number(phone: str) -> str:
    """Strip non-digits, prepend India country code if needed."""
    if not phone:
        return ""
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) == 10:
        phone = "91" + phone
    return phone


# ── Core send functions ───────────────────────────────────────────────────────

async def send_whatsapp_template(
    to: str,
    template_name: str,
    params: List[str],
    log_context: str = "template",
) -> Dict[str, Any]:
    """
    Send an approved HSM template via Gupshup.

    Gupshup template payload:
      POST https://api.gupshup.io/wa/api/v1/template/msg
      headers: apikey, Content-Type: application/x-www-form-urlencoded
      body:
        channel=whatsapp
        source=<src_number>
        destination=<dest>
        src.name=<app_name>
        template={"id":"<template_name>","params":["v1","v2",...]}
    """
    if not is_gupshup_configured():
        logger.warning(f"[WA-{log_context.upper()}] Gupshup not configured")
        return {"success": False, "reason": "not_configured"}

    config = get_gupshup_config()
    formatted_phone = format_phone_number(to)

    if not formatted_phone or len(formatted_phone) < 10:
        logger.warning(f"[WA-{log_context.upper()}] Invalid phone: {to}")
        return {"success": False, "reason": "invalid_phone"}

    payload = {
        "channel":     "whatsapp",
        "source":      config["source_number"],
        "destination": formatted_phone,
        "src.name":    config["app_name"],
        "template":    json.dumps({"id": template_name, "params": params}),
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GUPSHUP_TEMPLATE_URL,
                headers={
                    "apikey":       config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data=payload,
                timeout=10,
            )

        result = response.json()
        status = str(result.get("status", "")).strip().lower()

        if response.status_code in (200, 202) and status in ("submitted", "success"):
            logger.info(
                f"[WA-{log_context.upper()}] ✅ Template '{template_name}' → "
                f"{formatted_phone[:6]}*** | id={result.get('messageId')}"
            )
            return {
                "success":    True,
                "message_id": result.get("messageId"),
                "template":   template_name,
                "to":         formatted_phone,
            }

        logger.error(
            f"[WA-{log_context.upper()}] ❌ Template failed — "
            f"HTTP {response.status_code} | status='{status}' | {result}"
        )
        return {
            "success":       False,
            "error":         result.get("message", "unknown"),
            "gupshup_status": status,
            "http_code":     response.status_code,
        }

    except Exception as exc:
        logger.error(f"[WA-{log_context.upper()}] Exception: {exc}")
        return {"success": False, "error": str(exc)}


async def send_whatsapp_message(
    to: str,
    message: str,
    log_context: str = "general",
) -> Dict[str, Any]:
    """
    Send a free-form session message (24-hour window only).
    Used as fallback when WHATSAPP_TEMPLATES_APPROVED=false.
    """
    if not is_gupshup_configured():
        logger.warning(f"[WA-{log_context.upper()}] Gupshup not configured")
        return {"success": False, "reason": "not_configured"}

    config = get_gupshup_config()
    formatted_phone = format_phone_number(to)

    if not formatted_phone or len(formatted_phone) < 10:
        logger.warning(f"[WA-{log_context.upper()}] Invalid phone: {to}")
        return {"success": False, "reason": "invalid_phone"}

    payload = {
        "channel":     "whatsapp",
        "source":      config["source_number"],
        "destination": formatted_phone,
        "message":     json.dumps({"type": "text", "text": message}),
        "src.name":    config["app_name"],
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GUPSHUP_MSG_URL,
                headers={
                    "apikey":       config["api_key"],
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data=payload,
                timeout=10,
            )

        result = response.json()
        status = str(result.get("status", "")).strip().lower()

        if response.status_code in (200, 202) and status in ("submitted", "success"):
            logger.info(
                f"[WA-{log_context.upper()}] ✅ Text sent → "
                f"{formatted_phone[:6]}*** | id={result.get('messageId')}"
            )
            return {
                "success":    True,
                "message_id": result.get("messageId"),
                "to":         formatted_phone,
            }

        logger.error(
            f"[WA-{log_context.upper()}] ❌ Text failed — "
            f"HTTP {response.status_code} | status='{status}' | {result}"
        )
        return {
            "success":        False,
            "error":          result.get("message", "unknown"),
            "gupshup_status": status,
            "http_code":      response.status_code,
        }

    except Exception as exc:
        logger.error(f"[WA-{log_context.upper()}] Exception: {exc}")
        return {"success": False, "error": str(exc)}


# ── Notification functions (template-first, free-form fallback) ───────────────

class WhatsAppNotifications:
    """
    All 8 approved HSM templates wired up.
    Each function sends the template when WHATSAPP_TEMPLATES_APPROVED=true,
    otherwise falls back to a well-formatted free-form text message.
    """

    # ── 1. Membership activated ──────────────────────────────────────────────
    # Template: tdc_welcome_member1
    # Params:   {{1}}=user_name  {{2}}=tier_display  {{3}}=expires_date
    @staticmethod
    async def membership_activated(
        phone: str,
        user_name: str,
        tier: str,
        expires_at: str,
    ) -> Dict[str, Any]:
        tier_display = tier.title()
        expires_date = expires_at[:10] if expires_at else "Lifetime"

        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_WELCOME_MEMBER", "tdc_welcome_member1"),
                params=[user_name, tier_display, expires_date],
                log_context="membership",
            )

        tier_emoji = {"free": "🐾", "essential": "⭐", "premium": "👑"}.get(tier.lower(), "🐾")
        message = (
            f"🎉 Welcome to Pet Pass, {user_name}!\n\n"
            f"{tier_emoji} Your *{tier_display}* membership is now active.\n\n"
            f"✅ Pet Soul™ Profile\n"
            f"✅ All 14 life pillars\n"
            f"✅ Mira AI Concierge®\n\n"
            f"Valid until: {expires_date}\n\n"
            f"Start here → thedoggycompany.com/my-pets\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "membership")

    # ── 2. Welcome new user ──────────────────────────────────────────────────
    # Template: tdc_pawrent_welcome1
    # Params:   {{1}}=user_name
    @staticmethod
    async def welcome_new_user(
        phone: str,
        user_name: str,
    ) -> Dict[str, Any]:
        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_PAWRENT_WELCOME", "tdc_pawrent_welcome1"),
                params=[user_name],
                log_context="welcome",
            )

        message = (
            f"👋 Welcome to The Doggy Company, {user_name}!\n\n"
            f"We're excited to be part of your pet's journey.\n\n"
            f"🐾 14 life pillars (Care, Dine, Travel & more)\n"
            f"🤖 Mira AI — your 24/7 pet concierge\n"
            f"🎂 Birthday celebrations & treats\n\n"
            f"Create your Pet Soul™ profile:\n"
            f"👉 thedoggycompany.com/pet-soul-onboard\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "welcome")

    # ── 3. Medication reminder ───────────────────────────────────────────────
    # Template: tdc_medication_reminder
    # Params:   {{1}}=pet_name  {{2}}=medication_name  {{3}}=time_str  {{4}}=user_name
    @staticmethod
    async def medication_reminder(
        phone: str,
        user_name: str,
        pet_name: str,
        medication_name: str,
        time_str: str = "now",
    ) -> Dict[str, Any]:
        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_MEDICATION_REMINDER", "tdc_medication_reminder"),
                params=[pet_name, medication_name, time_str, user_name],
                log_context="medication",
            )

        message = (
            f"💊 Medication Reminder\n\n"
            f"Hi {user_name},\n\n"
            f"Time to give *{pet_name}* their *{medication_name}* — {time_str}.\n\n"
            f"Mark as given in the app:\n"
            f"👉 thedoggycompany.com/care\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "medication")

    # ── 4. Birthday today ────────────────────────────────────────────────────
    # Template: tdc_birthday_today
    # Params:   {{1}}=user_name  {{2}}=pet_name
    @staticmethod
    async def pet_birthday_today(
        phone: str,
        user_name: str,
        pet_name: str,
    ) -> Dict[str, Any]:
        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_BIRTHDAY_TODAY", "tdc_birthday_today"),
                params=[user_name, pet_name],
                log_context="birthday",
            )

        message = (
            f"🎂 Happy Birthday, {pet_name}! 🎉\n\n"
            f"Hi {user_name},\n\n"
            f"Today is *{pet_name}'s* big day! 🐾\n\n"
            f"Celebrate with:\n"
            f"🎂 Custom birthday cake\n"
            f"🎁 Celebration hamper\n"
            f"📸 Pawty photoshoot\n\n"
            f"Shop now → thedoggycompany.com/celebrate\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "birthday")

    # Legacy alias kept for backwards compatibility
    @staticmethod
    async def pet_birthday_reminder(
        phone: str,
        user_name: str,
        pet_name: str,
        birthday_date: str,
        days_until: int,
    ) -> Dict[str, Any]:
        """Birthday reminder (days before). Today = use pet_birthday_today instead."""
        if days_until == 0:
            return await WhatsAppNotifications.pet_birthday_today(phone, user_name, pet_name)

        # Reminder (not today) → always free-form (no dedicated template for advance notice)
        days_text = "tomorrow" if days_until == 1 else f"in {days_until} days"
        message = (
            f"🎂 Birthday Alert!\n\n"
            f"Hi {user_name},\n\n"
            f"*{pet_name}'s* birthday is {days_text} ({birthday_date})!\n\n"
            f"Make it special → thedoggycompany.com/celebrate\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "birthday_advance")

    # ── 5. Daily digest ──────────────────────────────────────────────────────
    # Template: tdc_daily_digest
    # Params:   {{1}}=user_name  {{2}}=pet_name  {{3}}=digest_line  {{4}}=date_str
    @staticmethod
    async def daily_digest(
        phone: str,
        user_name: str,
        pet_name: str,
        digest_line: str,
        date_str: Optional[str] = None,
    ) -> Dict[str, Any]:
        date_str = date_str or __import__("datetime").date.today().strftime("%d %b")

        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_DAILY_DIGEST", "tdc_daily_digest"),
                params=[user_name, pet_name, digest_line, date_str],
                log_context="digest",
            )

        message = (
            f"🐾 {pet_name}'s Daily Digest — {date_str}\n\n"
            f"Hi {user_name},\n\n"
            f"{digest_line}\n\n"
            f"See everything → thedoggycompany.com/mira-os\n\n"
            f"— Mira, The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "digest")

    # ── 6. Order confirmed ───────────────────────────────────────────────────
    # Template: tdc_order_confirmed
    # Params:   {{1}}=user_name  {{2}}=order_id  {{3}}=items_summary  {{4}}=total
    @staticmethod
    async def order_confirmed(
        phone: str,
        user_name: str,
        order_id: str,
        items: str,
        total: float,
    ) -> Dict[str, Any]:
        total_str = f"₹{total:,.0f}"

        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_ORDER_CONFIRMED", "tdc_order_confirmed"),
                params=[user_name, order_id, items, total_str],
                log_context="order_confirmed",
            )

        message = (
            f"🛍️ Order Confirmed!\n\n"
            f"Hi {user_name},\n\n"
            f"📦 Order #{order_id}\n"
            f"{items}\n\n"
            f"💰 Total: {total_str}\n\n"
            f"We'll notify you when it ships!\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "order_confirmed")

    # ── 7. Concierge request / message ───────────────────────────────────────
    # Template: tdc_concierge_request
    # Params:   {{1}}=user_name  {{2}}=message_content  {{3}}=from_name
    @staticmethod
    async def concierge_message(
        phone: str,
        user_name: str,
        message_content: str,
        from_name: str = "Concierge Team",
    ) -> Dict[str, Any]:
        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_CONCIERGE_REQUEST", "tdc_concierge_request"),
                params=[user_name, message_content, from_name],
                log_context="concierge",
            )

        message = (
            f"💬 Message from {from_name}\n\n"
            f"Hi {user_name},\n\n"
            f"{message_content}\n\n"
            f"Reply here to continue the conversation.\n\n"
            f"— The Doggy Company Concierge® 🐕"
        )
        return await send_whatsapp_message(phone, message, "concierge")

    # ── 8. Payment received / order confirmation ─────────────────────────────
    # Template: orderconfirmation
    # Params:   {{1}}=user_name  {{2}}=amount  {{3}}=plan_name  {{4}}=order_id
    @staticmethod
    async def payment_received(
        phone: str,
        user_name: str,
        amount: float,
        plan_name: str,
        order_id: str,
    ) -> Dict[str, Any]:
        amount_str = f"₹{amount:,.0f}"

        if templates_approved():
            return await send_whatsapp_template(
                phone,
                get_template("TEMPLATE_ORDER_CONFIRMATION", "orderconfirmation"),
                params=[user_name, amount_str, plan_name, order_id],
                log_context="payment",
            )

        message = (
            f"✅ Payment Received!\n\n"
            f"Hi {user_name},\n\n"
            f"We've received *{amount_str}* for *{plan_name}*.\n\n"
            f"🧾 Order ID: {order_id}\n\n"
            f"Your Pet Pass is now active. Explore all 14 pillars!\n\n"
            f"Thank you for trusting us with your pet's journey 💜\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "payment")

    # ── Preserved non-template functions ─────────────────────────────────────

    @staticmethod
    async def service_booked(
        phone: str,
        user_name: str,
        pet_name: str,
        service_name: str,
        booking_date: str,
        booking_time: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Booking confirmation — free-form (no dedicated template yet)."""
        time_str = f" at {booking_time}" if booking_time else ""
        message = (
            f"📅 Booking Confirmed!\n\n"
            f"Hi {user_name},\n\n"
            f"Your booking for *{pet_name}* is confirmed:\n\n"
            f"🐾 Service: {service_name}\n"
            f"📆 Date: {booking_date}{time_str}\n\n"
            f"Need to reschedule? Just reply here!\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "booking")

    @staticmethod
    async def service_reminder(
        phone: str,
        user_name: str,
        pet_name: str,
        service_name: str,
        booking_date: str,
        booking_time: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Appointment reminder — free-form (use medication_reminder for meds)."""
        time_str = f" at {booking_time}" if booking_time else ""
        message = (
            f"⏰ Reminder: Tomorrow's Appointment\n\n"
            f"Hi {user_name},\n\n"
            f"*{pet_name}'s* {service_name} is tomorrow{time_str}.\n\n"
            f"See you soon! 🐕\n\n"
            f"— The Doggy Company"
        )
        return await send_whatsapp_message(phone, message, "reminder")

    @staticmethod
    async def ticket_update(
        phone: str,
        user_name: str,
        ticket_id: str,
        status: str,
        message_preview: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Service desk ticket status update — free-form."""
        status_emoji = {
            "in_progress":        "🔄",
            "resolved":           "✅",
            "waiting_on_member":  "⏳",
            "closed":             "✔️",
        }.get(status.lower(), "📋")
        preview = f'\n\n"{message_preview[:100]}..."' if message_preview else ""
        message = (
            f"{status_emoji} Ticket Update\n\n"
            f"Hi {user_name},\n\n"
            f"Your request #{ticket_id} has been updated.\n\n"
            f"Status: *{status.replace('_', ' ').title()}*{preview}\n\n"
            f"View: thedoggycompany.com/inbox\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "ticket")

    @staticmethod
    async def order_shipped(
        phone: str,
        user_name: str,
        order_id: str,
        tracking_link: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Order shipped — free-form."""
        tracking = f"\n\n📦 Track: {tracking_link}" if tracking_link else ""
        message = (
            f"🚚 Your Order is on the way!\n\n"
            f"Hi {user_name},\n\n"
            f"Order #{order_id} has been shipped.{tracking}\n\n"
            f"Expected delivery: 2–4 business days\n\n"
            f"Questions? Reply here!\n\n"
            f"— The Doggy Company 🐕"
        )
        return await send_whatsapp_message(phone, message, "shipping")
