"""
Scheduled Automations — Pet Life OS
====================================
Handles:
 d) WhatsApp Daily Digest     — 8 AM IST every morning
 e) Birthday Reminders        — 7 days before + day of birthday
 f) Medication Reminders      — Daily at 9 AM IST per user preference

All send via Gupshup WhatsApp API (primary) + Resend email (secondary).
"""

import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta, date
from typing import Optional
import httpx
import motor.motor_asyncio

logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────────
GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"
GUPSHUP_API_KEY = os.environ.get("GUPSHUP_API_KEY")
GUPSHUP_SOURCE  = os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER")
GUPSHUP_APP     = os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany")
RESEND_API_KEY  = os.environ.get("RESEND_API_KEY")
BASE_URL        = os.environ.get("REACT_APP_BACKEND_URL", "https://pet-soul-ranking.preview.emergentagent.com")

_db = None
_mongo_client = None


def set_automation_db(database):
    global _db
    _db = database


def get_automation_db():
    global _db, _mongo_client
    if _db is not None:
        return _db
    # Fallback: connect directly
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "pet_platform")
    if not mongo_url:
        return None
    try:
        _mongo_client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
        _db = _mongo_client[db_name]
        return _db
    except Exception as e:
        logger.error(f"[AUTOMATION] Could not connect to MongoDB: {e}")
        return None


# ── Utility: Send WhatsApp via Gupshup ──────────────────────────────────────
async def send_whatsapp(phone: str, message: str) -> dict:
    """Send a text WhatsApp message via Gupshup. Returns result dict."""
    if not GUPSHUP_API_KEY or not GUPSHUP_SOURCE:
        logger.warning("[AUTOMATION] Gupshup not configured, skipping WhatsApp")
        return {"success": False, "error": "Gupshup not configured"}

    import json as _json
    payload = {
        "channel": "whatsapp",
        "source": GUPSHUP_SOURCE,
        "destination": phone,
        "message": _json.dumps({"type": "text", "text": message}),
        "src.name": GUPSHUP_APP,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                GUPSHUP_API_URL,
                headers={"apikey": GUPSHUP_API_KEY, "Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )
            result = resp.json()
            if resp.status_code == 202 or result.get("status") == "submitted":
                return {"success": True, "message_id": result.get("messageId"), "phone": phone}
            logger.error(f"[AUTOMATION] Gupshup error: {result}")
            return {"success": False, "error": str(result)}
    except Exception as e:
        logger.error(f"[AUTOMATION] WhatsApp send error: {e}")
        return {"success": False, "error": str(e)}


# ── Utility: Send Email via Resend ───────────────────────────────────────────
async def send_email(to: str, subject: str, html: str) -> dict:
    """Send an email via Resend."""
    if not RESEND_API_KEY:
        logger.warning("[AUTOMATION] Resend not configured, skipping email")
        return {"success": False, "error": "Resend not configured"}
    import json as _json
    payload = {
        "from": "Mira from The Doggy Company <noreply@thedoggycompany.com>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                content=_json.dumps(payload),
            )
            if resp.status_code in (200, 201, 202):
                return {"success": True, "email_id": resp.json().get("id")}
            logger.error(f"[AUTOMATION] Resend error {resp.status_code}: {resp.text[:200]}")
            return {"success": False, "error": resp.text[:200]}
    except Exception as e:
        logger.error(f"[AUTOMATION] Email send error: {e}")
        return {"success": False, "error": str(e)}


# ── Mira Tip Generator ───────────────────────────────────────────────────────
DAILY_TIPS = [
    ("dental", "🦷 Quick tip for {name}: Brush {pet_name}'s teeth with enzymatic paste today. Dental health directly impacts energy and lifespan."),
    ("hydration", "💧 {pet_name} needs fresh water changed twice daily. Hydration is the foundation of every healthy soul."),
    ("play", "🎾 Schedule 20 mins of active play for {pet_name} today. Their soul score rises with every burst of joy."),
    ("food", "🥣 Did you know? {pet_name}'s coat health starts with their bowl. Omega-3 rich foods make tails wag brighter."),
    ("grooming", "✂️ A quick brush today keeps mats away. {pet_name}'s {coat_type} coat deserves 5 minutes of your care."),
    ("vet", "🏥 Check {pet_name}'s next vaccine date. Prevention is the highest form of love for {pet_name}."),
    ("rest", "😴 Make sure {pet_name} has a cool, quiet spot to rest today. Recovery is where growth happens."),
    ("bonding", "🤍 A 15-minute calm cuddle session today can reduce {pet_name}'s stress hormones by 30%."),
    ("training", "🎓 One new command per week keeps {pet_name}'s mind sharp and your bond stronger."),
    ("sniff", "🌿 Let {pet_name} lead the walk today and sniff freely. It's their newspaper — let them read it fully."),
    ("weight", "⚖️ Feel {pet_name}'s ribs gently today. You should feel them without pressing hard. Weight watch = health watch."),
    ("teeth", "🦷 Dental chews after dinner tonight — {pet_name}'s gums will thank you tomorrow."),
    ("enrichment", "🧩 Hide treats around the house today. Mental enrichment gives {pet_name} a richer, fuller life."),
    ("coat", "🛁 Quick check: Is {pet_name}'s coat glossy? A dull coat often means the diet needs an omega-3 boost."),
]


def get_todays_tip(pet_name: str, coat_type: str = "medium") -> str:
    today_idx = datetime.now(timezone.utc).timetuple().tm_yday % len(DAILY_TIPS)
    _, template = DAILY_TIPS[today_idx]
    return template.format(pet_name=pet_name, coat_type=coat_type, name="")


# ── d) WhatsApp Daily Digest ─────────────────────────────────────────────────
async def send_daily_digest_to_user(user: dict, pets: list) -> dict:
    """Send morning digest to one user."""
    phone = user.get("whatsapp_number") or user.get("phone")
    if not phone:
        return {"skipped": True, "reason": "no phone"}

    primary_pet = pets[0] if pets else None
    pet_name = primary_pet.get("name", "your dog") if primary_pet else "your dog"
    coat_type = "medium"
    if primary_pet:
        breed = (primary_pet.get("breed") or "").lower()
        if any(b in breed for b in ["poodle", "schnauzer", "bichon", "maltese", "shih", "yorkshire"]):
            coat_type = "curly"
        elif any(b in breed for b in ["golden", "husky", "border", "chow", "samoyed"]):
            coat_type = "long"
        elif any(b in breed for b in ["boxer", "bulldog", "lab", "pointer", "dalmatian"]):
            coat_type = "short"

    tip = get_todays_tip(pet_name, coat_type)

    # Collect upcoming reminders
    reminders = []
    db = get_automation_db()
    if db is not None and primary_pet:
        pet_id = primary_pet.get("id") or primary_pet.get("pet_id")
        vault = await db.pet_health_vault.find_one({"pet_id": pet_id}, {"_id": 0, "vaccines": 1, "medications": 1})
        if vault:
            now = datetime.now(timezone.utc)
            for v in (vault.get("vaccines") or []):
                due = v.get("next_due")
                if due:
                    try:
                        due_dt = datetime.fromisoformat(str(due).replace("Z", "+00:00")) if isinstance(due, str) else due
                        if due_dt.tzinfo is None:
                            due_dt = due_dt.replace(tzinfo=timezone.utc)
                        days_left = (due_dt - now).days
                        if 0 <= days_left <= 7:
                            reminders.append(f"💉 {v.get('name','Vaccine')} due in {days_left} day{'s' if days_left != 1 else ''}")
                    except Exception:
                        pass

    # Check birthday
    if primary_pet:
        bday = primary_pet.get("birthday") or primary_pet.get("date_of_birth")
        if bday:
            try:
                bday_dt = datetime.fromisoformat(str(bday).split("T")[0])
                today = datetime.now(timezone.utc)
                this_year_bday = bday_dt.replace(year=today.year)
                days_to_bday = (this_year_bday.date() - today.date()).days
                if days_to_bday == 7:
                    reminders.append(f"🎂 {pet_name}'s birthday is in 7 days! Plan something special →")
                elif days_to_bday == 0:
                    reminders.append(f"🎉 Today is {pet_name}'s birthday! Celebrate →")
            except Exception:
                pass

    reminder_text = ""
    if reminders:
        reminder_text = "\n\n⏰ *Upcoming reminders:*\n" + "\n".join(f"• {r}" for r in reminders)

    message = (
        f"🌅 *Good morning!*\n\n"
        f"Mira here — your personal pet intelligence.\n\n"
        f"*Today's tip for {pet_name}:*\n{tip}"
        f"{reminder_text}\n\n"
        f"Have a beautiful day with {pet_name} 🐾\n"
        f"— *The Doggy Company*"
    )

    result = await send_whatsapp(phone, message)

    if db is not None:
        await db.whatsapp_digest_log.insert_one({
            "user_email": user.get("email"),
            "pet_name": pet_name,
            "sent_at": datetime.now(timezone.utc),
            "success": result.get("success"),
            "message_id": result.get("message_id"),
            "type": "daily_digest",
        })

    return result


async def run_daily_digest():
    """Run the daily digest for all eligible users. Called by scheduler at 8 AM IST."""
    db = get_automation_db()
    if db is None:
        logger.warning("[AUTOMATION] DB not set for daily digest")
        return

    logger.info("[AUTOMATION] Starting daily digest run")
    users = await db.users.find(
        {"whatsapp_opted_in": {"$ne": False}, "is_active": {"$ne": False}},
        {"_id": 0, "email": 1, "whatsapp_number": 1, "phone": 1, "name": 1, "full_name": 1}
    ).to_list(500)

    sent = 0
    failed = 0
    for user in users:
        try:
            pets = await db.pets.find(
                {"owner_email": user["email"]},
                {"_id": 0, "id": 1, "name": 1, "breed": 1, "birthday": 1, "date_of_birth": 1, "health_condition": 1}
            ).to_list(5)
            result = await send_daily_digest_to_user(user, pets)
            if result.get("success"):
                sent += 1
            elif not result.get("skipped"):
                failed += 1
        except Exception as e:
            logger.error(f"[AUTOMATION] Digest error for {user.get('email')}: {e}")
            failed += 1

    logger.info(f"[AUTOMATION] Daily digest complete — sent: {sent}, failed: {failed}, skipped: {len(users)-sent-failed}")
    return {"sent": sent, "failed": failed, "total": len(users)}


# ── e) Birthday Reminders ────────────────────────────────────────────────────
async def run_birthday_reminders():
    """Check all pets for upcoming birthdays and send reminders. Run daily at midnight IST."""
    db = get_automation_db()
    if db is None:
        return

    logger.info("[AUTOMATION] Checking birthday reminders")
    today = datetime.now(timezone.utc).date()
    sent = 0

    pets = await db.pets.find(
        {"birthday": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "name": 1, "breed": 1, "birthday": 1, "date_of_birth": 1, "owner_email": 1}
    ).to_list(2000)

    for pet in pets:
        try:
            bday_raw = pet.get("birthday") or pet.get("date_of_birth")
            if not bday_raw:
                continue
            bday_str = str(bday_raw).split("T")[0]
            bday = date.fromisoformat(bday_str)
            this_year_bday = bday.replace(year=today.year)
            days_left = (this_year_bday - today).days

            owner_email = pet.get("owner_email")
            if not owner_email:
                continue
            owner = await db.users.find_one({"email": owner_email}, {"_id": 0, "whatsapp_number": 1, "phone": 1, "email": 1, "name": 1})
            if not owner:
                continue
            phone = owner.get("whatsapp_number") or owner.get("phone")
            pet_name = pet.get("name", "your dog")

            if days_left == 7:
                # 7-day reminder
                msg = (
                    f"🎂 *{pet_name}'s birthday is in 7 days!*\n\n"
                    f"Mira here — just a heads up so you can make it special.\n\n"
                    f"Plan {pet_name}'s celebration → {BASE_URL}/celebrate\n\n"
                    f"Ideas: custom birthday cake, photo session, special outing, or gift bundle.\n"
                    f"Concierge® can arrange it all for you. 🐾\n\n"
                    f"— *The Doggy Company*"
                )
                subject = f"🎂 {pet_name}'s birthday is in 7 days!"
                email_html = f"""
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
                  <h1 style="color:#1B4332;font-size:22px;">🎂 {pet_name}'s birthday is in 7 days!</h1>
                  <p>Mira here — just a heads up so you can make it extra special.</p>
                  <p><strong>Plan {pet_name}'s celebration:</strong></p>
                  <ul>
                    <li>Custom birthday cake</li>
                    <li>Photo session</li>
                    <li>Special outing</li>
                    <li>Gift bundle from The Doggy Company</li>
                  </ul>
                  <a href="{BASE_URL}/celebrate" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Plan the Celebration →</a>
                  <p style="color:#888;font-size:12px;margin-top:24px;">The Doggy Company · Concierge® · Powered by Mira</p>
                </div>"""

            elif days_left == 0:
                # Birthday day!
                age = today.year - bday.year
                msg = (
                    f"🎉 *Happy Birthday, {pet_name}!* 🎊\n\n"
                    f"Today {pet_name} turns {age}! What a journey it has been.\n\n"
                    f"Make today unforgettable → {BASE_URL}/celebrate\n\n"
                    f"From all of us at The Doggy Company — {pet_name} is loved. 🐾💕\n\n"
                    f"— *Mira & The Doggy Company*"
                )
                subject = f"🎉 Happy Birthday {pet_name}! Today is the day!"
                email_html = f"""
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
                  <h1 style="color:#1B4332;font-size:24px;">🎉 Happy Birthday, {pet_name}!</h1>
                  <p>Today {pet_name} turns {age}! What a beautiful soul.</p>
                  <p>Make today unforgettable with a special experience curated by Concierge®.</p>
                  <a href="{BASE_URL}/celebrate" style="display:inline-block;background:#2D6A4F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Celebrate Today →</a>
                  <p style="color:#888;font-size:12px;margin-top:24px;">With love, The Doggy Company 🐾</p>
                </div>"""
            else:
                continue

            # Check if already sent today
            already_sent = await db.birthday_reminder_log.find_one({
                "pet_id": pet.get("id"), "days_left": days_left,
                "sent_date": today.isoformat()
            })
            if already_sent:
                continue

            # Send WhatsApp via template-aware service
            if phone:
                try:
                    from services.whatsapp_service import send_birthday_reminder as _send_bday_reminder
                    from services.whatsapp_service import send_birthday_today as _send_bday_today
                    _user = {"phone": phone, "name": owner.get("name", ""), "email": owner_email, "id": owner_email}
                    _pet = {"id": pet.get("id", ""), "name": pet_name}
                    if days_left == 7:
                        wa_result = await _send_bday_reminder(_user, _pet, 7)
                    else:
                        wa_result = await _send_bday_today(_user, _pet)
                except Exception:
                    wa_result = await send_whatsapp(phone, msg)
                if wa_result.get("success"):
                    sent += 1

            # Send email
            if owner_email:
                try:
                    from services.email_service import send_birthday_reminder_email as _send_bday_email
                    _user = {"email": owner_email, "name": owner.get("name", ""), "id": owner_email}
                    _pet = {"id": pet.get("id", ""), "name": pet_name}
                    await _send_bday_email(_user, _pet, days_left)
                except Exception:
                    await send_email(owner_email, subject, email_html)

            # Log it
            await db.birthday_reminder_log.insert_one({
                "pet_id": pet.get("id"), "pet_name": pet_name,
                "owner_email": owner_email, "days_left": days_left,
                "sent_date": today.isoformat(), "sent_at": datetime.now(timezone.utc)
            })

        except Exception as e:
            logger.error(f"[AUTOMATION] Birthday reminder error for pet {pet.get('id')}: {e}")

    logger.info(f"[AUTOMATION] Birthday reminders complete — sent: {sent}")
    return {"sent": sent}


# ── f) Medication Reminders ───────────────────────────────────────────────────
async def run_medication_reminders():
    """Send daily medication reminders to users who have active meds in pet vault."""
    db = get_automation_db()
    if db is None:
        return

    logger.info("[AUTOMATION] Checking medication reminders")
    sent = 0

    vaults = await db.pet_health_vault.find(
        {"medications": {"$exists": True, "$not": {"$size": 0}}},
        {"_id": 0, "pet_id": 1, "medications": 1}
    ).to_list(2000)

    for vault in vaults:
        try:
            pet_id = vault.get("pet_id")
            medications = vault.get("medications") or []
            if not medications:
                continue

            pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "owner_email": 1})
            if not pet:
                continue

            owner_email = pet.get("owner_email")
            owner = await db.users.find_one({"email": owner_email}, {"_id": 0, "whatsapp_number": 1, "phone": 1})
            if not owner:
                continue

            phone = owner.get("whatsapp_number") or owner.get("phone")
            if not phone:
                continue

            pet_name = pet.get("name", "your dog")
            med_lines = []
            for m in medications[:5]:
                name = m.get("name") or m.get("medication_name") or "Medication"
                dose = m.get("dosage") or m.get("dose") or ""
                time_note = m.get("time") or m.get("reminder_time") or "as prescribed"
                med_lines.append(f"• {name}{' — '+dose if dose else ''} ({time_note})")

            if not med_lines:
                continue

            # Check if already sent today
            today_str = datetime.now(timezone.utc).date().isoformat()
            already = await db.medication_reminder_log.find_one({"pet_id": pet_id, "sent_date": today_str})
            if already:
                continue

            # Send via template-aware service
            try:
                from services.whatsapp_service import send_medication_reminder as _send_med
                _user = {"phone": phone, "name": owner.get("name", ""), "email": owner_email, "id": owner_email}
                _pet = {"id": pet_id, "name": pet_name}
                _med = medications[0] if medications else {}
                result = await _send_med(_user, _pet, _med)
            except Exception:
                result = await send_whatsapp(phone, msg)
            if result.get("success"):
                sent += 1

            await db.medication_reminder_log.insert_one({
                "pet_id": pet_id, "pet_name": pet_name,
                "owner_email": owner_email, "sent_date": today_str,
                "sent_at": datetime.now(timezone.utc), "medications_count": len(med_lines),
            })

        except Exception as e:
            logger.error(f"[AUTOMATION] Medication reminder error for vault {vault.get('pet_id')}: {e}")

    logger.info(f"[AUTOMATION] Medication reminders complete — sent: {sent}")
    return {"sent": sent}


# ── Scheduler Setup ──────────────────────────────────────────────────────────
def create_scheduler():
    """Create and return an APScheduler AsyncIOScheduler with all jobs."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger

    scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    # d) Daily Digest — 8 AM IST
    scheduler.add_job(
        run_daily_digest,
        trigger=CronTrigger(hour=8, minute=0, timezone="Asia/Kolkata"),
        id="daily_digest",
        name="WhatsApp Daily Digest",
        replace_existing=True,
        max_instances=1,
    )

    # e) Birthday Reminders — 7 AM IST (run before digest)
    scheduler.add_job(
        run_birthday_reminders,
        trigger=CronTrigger(hour=7, minute=0, timezone="Asia/Kolkata"),
        id="birthday_reminders",
        name="Birthday Reminders",
        replace_existing=True,
        max_instances=1,
    )

    # f) Medication Reminders — 9 AM IST
    scheduler.add_job(
        run_medication_reminders,
        trigger=CronTrigger(hour=9, minute=0, timezone="Asia/Kolkata"),
        id="medication_reminders",
        name="Medication Reminders",
        replace_existing=True,
        max_instances=1,
    )

    return scheduler
