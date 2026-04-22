"""
Zoho Desk API Client — Two-Way Sync for Pet Life OS
=====================================================

Single source of truth for ALL Zoho Desk HTTP plumbing:
- OAuth access-token lifecycle (auto-refresh with 5-min buffer + asyncio lock)
- Ticket CRUD (create, fetch, update)
- Comment CRUD (add public/private comments)
- Contact lookup/create

DC-aware (.com / .in / .eu) — all URLs derived from ZOHO_DC env var.
Fully async (httpx.AsyncClient) — never blocks the FastAPI event loop.

Do NOT re-implement OAuth logic anywhere else. Always import from this module.

─────────────────────────────────────────────────────────────────────
ENV VARS REQUIRED (in /app/backend/.env):
   ZOHO_ENABLED         # "true" to activate sync. "false" → all calls no-op
   ZOHO_DC              # "com" | "in" | "eu"
   ZOHO_CLIENT_ID       # from api-console.zoho.{DC}/ → Self Client
   ZOHO_CLIENT_SECRET   # ditto
   ZOHO_REFRESH_TOKEN   # generated with scope Desk.tickets.ALL,Desk.basic.READ,Desk.contacts.READ
   ZOHO_ORG_ID          # Setup → Developer Space → API → ZSC Key
   ZOHO_DEPARTMENT_ID   # Setup → General → Departments → (URL contains ID)
   ZOHO_WEBHOOK_TOKEN   # shared secret, passed as ?token=... on webhook URL
─────────────────────────────────────────────────────────────────────

COLLECTIONS TOUCHED:
   zoho_token_cache     # {type, token, expires_at} — 1 doc
   zoho_sync_log        # every push attempt (audit)
   zoho_webhook_events  # every inbound webhook payload (audit)
"""
import os
import asyncio
import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

import httpx

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# MODULE STATE
# ─────────────────────────────────────────────────────────────────────
_db = None
_refresh_lock = asyncio.Lock()

def set_db(database):
    """Injected by server.py on startup."""
    global _db
    _db = database


# ─────────────────────────────────────────────────────────────────────
# CONFIG HELPERS
# ─────────────────────────────────────────────────────────────────────
def is_enabled() -> bool:
    """Master kill-switch. Flip ZOHO_ENABLED=true when creds are ready."""
    return os.environ.get("ZOHO_ENABLED", "false").lower() == "true"


def is_configured() -> bool:
    """All 6 creds present?"""
    required = [
        "ZOHO_DC", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET",
        "ZOHO_REFRESH_TOKEN", "ZOHO_ORG_ID", "ZOHO_DEPARTMENT_ID",
    ]
    return all(os.environ.get(k) for k in required)


def config_status() -> Dict[str, Any]:
    """Non-secret diagnostic snapshot."""
    return {
        "enabled": is_enabled(),
        "configured": is_configured(),
        "dc": os.environ.get("ZOHO_DC", "(unset)"),
        "org_id": os.environ.get("ZOHO_ORG_ID", "(unset)"),
        "department_id": os.environ.get("ZOHO_DEPARTMENT_ID", "(unset)"),
        "has_client_id": bool(os.environ.get("ZOHO_CLIENT_ID")),
        "has_client_secret": bool(os.environ.get("ZOHO_CLIENT_SECRET")),
        "has_refresh_token": bool(os.environ.get("ZOHO_REFRESH_TOKEN")),
        "has_webhook_token": bool(os.environ.get("ZOHO_WEBHOOK_TOKEN")),
    }


def _dc() -> str:
    return os.environ.get("ZOHO_DC", "in").strip().lower()


def accounts_base() -> str:
    """OAuth token endpoint base."""
    return f"https://accounts.zoho.{_dc()}"


def api_base() -> str:
    """Zoho Desk REST API base."""
    return f"https://desk.zoho.{_dc()}/api/v1"


# ─────────────────────────────────────────────────────────────────────
# OAUTH TOKEN LIFECYCLE
# ─────────────────────────────────────────────────────────────────────
async def get_access_token(force_refresh: bool = False) -> str:
    """
    Return a valid access token. Refreshes automatically:
      - If cached token is missing
      - If cached token expires within 5 minutes
      - If force_refresh=True (e.g. after an INVALID_OAUTHTOKEN error)

    Thread/coroutine-safe via _refresh_lock (prevents thundering herd).
    """
    if not is_configured():
        raise RuntimeError("Zoho not configured — check ZOHO_* env vars")

    async with _refresh_lock:
        now = datetime.now(timezone.utc)

        if not force_refresh and _db is not None:
            cached = await _db.zoho_token_cache.find_one(
                {"type": "access_token"}, {"_id": 0}
            )
            if cached and cached.get("expires_at"):
                expires_at = cached["expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                # 5-min safety buffer
                if (expires_at - now).total_seconds() > 300:
                    return cached["token"]

        # Need fresh token
        logger.info("[ZOHO] Refreshing access token from refresh_token")
        new_token, expires_in = await _call_refresh_endpoint()

        if _db is not None:
            await _db.zoho_token_cache.update_one(
                {"type": "access_token"},
                {"$set": {
                    "type": "access_token",
                    "token": new_token,
                    "expires_at": now + timedelta(seconds=expires_in - 60),
                    "refreshed_at": now.isoformat(),
                }},
                upsert=True,
            )
        return new_token


async def _call_refresh_endpoint() -> tuple[str, int]:
    """POST refresh_token → get new access_token. Returns (token, expires_in_seconds)."""
    url = f"{accounts_base()}/oauth/v2/token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": os.environ["ZOHO_REFRESH_TOKEN"],
        "client_id": os.environ["ZOHO_CLIENT_ID"],
        "client_secret": os.environ["ZOHO_CLIENT_SECRET"],
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, data=data)

    if resp.status_code != 200:
        logger.error(f"[ZOHO] Refresh failed {resp.status_code}: {resp.text}")
        raise RuntimeError(f"Zoho refresh_token exchange failed: {resp.text}")

    payload = resp.json()
    if "access_token" not in payload:
        logger.error(f"[ZOHO] Refresh response missing access_token: {payload}")
        raise RuntimeError(f"Zoho refresh response bad: {payload}")

    return payload["access_token"], int(payload.get("expires_in", 3600))


async def _auth_headers() -> Dict[str, str]:
    token = await get_access_token()
    return {
        "Authorization": f"Zoho-oauthtoken {token}",
        "orgId": os.environ["ZOHO_ORG_ID"],
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────────────────────────────
# CORE HTTP WRAPPER (auto-retry once on token expiry)
# ─────────────────────────────────────────────────────────────────────
async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    """
    Makes a Zoho Desk API call. Handles INVALID_OAUTHTOKEN by refreshing once
    and retrying. All other errors bubble up to caller.
    """
    url = f"{api_base()}{path}"

    async def _do():
        headers = await _auth_headers()
        # Merge caller-supplied headers if any
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))
        async with httpx.AsyncClient(timeout=30.0) as client:
            return await client.request(method, url, headers=headers, **kwargs)

    resp = await _do()
    if resp.status_code == 401:
        body = resp.text or ""
        if "INVALID_OAUTHTOKEN" in body.upper() or "AUTHENTICATION_FAILURE" in body.upper():
            logger.warning("[ZOHO] Access token rejected — forcing refresh")
            await get_access_token(force_refresh=True)
            resp = await _do()
    return resp


# ─────────────────────────────────────────────────────────────────────
# PUBLIC API — TICKET + COMMENT + CONTACT OPERATIONS
# ─────────────────────────────────────────────────────────────────────
async def get_organizations() -> Dict[str, Any]:
    """Sanity check — fetches org info. Good as a 'ping' for credentials."""
    resp = await _request("GET", "/organizations")
    resp.raise_for_status()
    return resp.json()


async def create_ticket(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a ticket in Zoho Desk.
    Required fields in payload: subject, departmentId, contact{lastName,email?,phone?}
    Optional: description, priority, status, phone, email
    """
    resp = await _request("POST", "/tickets", json=payload)
    if resp.status_code not in (200, 201):
        logger.error(f"[ZOHO] create_ticket failed {resp.status_code}: {resp.text}")
        resp.raise_for_status()
    return resp.json()


async def get_ticket(zoho_ticket_id: str) -> Dict[str, Any]:
    resp = await _request("GET", f"/tickets/{zoho_ticket_id}")
    resp.raise_for_status()
    return resp.json()


async def update_ticket(zoho_ticket_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
    resp = await _request("PATCH", f"/tickets/{zoho_ticket_id}", json=patch)
    if resp.status_code not in (200, 204):
        logger.error(f"[ZOHO] update_ticket failed {resp.status_code}: {resp.text}")
        resp.raise_for_status()
    return resp.json() if resp.content else {"id": zoho_ticket_id}


async def add_comment(
    zoho_ticket_id: str,
    content: str,
    is_public: bool = True,
    content_type: str = "plainText",
) -> Dict[str, Any]:
    """
    Add a comment (reply) to a ticket.
    is_public=True means customer sees it. False = internal agent note.
    """
    body = {
        "isPublic": is_public,
        "contentType": content_type,
        "content": content,
    }
    resp = await _request("POST", f"/tickets/{zoho_ticket_id}/comments", json=body)
    if resp.status_code not in (200, 201):
        logger.error(f"[ZOHO] add_comment failed {resp.status_code}: {resp.text}")
        resp.raise_for_status()
    return resp.json()


async def list_comments(zoho_ticket_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    resp = await _request(
        "GET",
        f"/tickets/{zoho_ticket_id}/comments",
        params={"from": 0, "limit": limit},
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


# ─────────────────────────────────────────────────────────────────────
# CONTACT UPSERT — link every ticket to a real person (not "Website Visitor")
# ─────────────────────────────────────────────────────────────────────
async def search_contact_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Return the first Zoho contact matching this email, or None."""
    if not email:
        return None
    try:
        resp = await _request("GET", "/contacts/search", params={"email": email, "limit": 1})
        if resp.status_code == 204:
            return None
        if resp.status_code != 200:
            return None
        data = resp.json().get("data", [])
        return data[0] if data else None
    except Exception as e:
        logger.warning(f"[ZOHO] search_contact_by_email failed: {e}")
        return None


async def create_or_update_contact(contact_payload: Dict[str, Any]) -> Optional[str]:
    """
    Upsert a Zoho contact by email. Returns contactId or None on failure.

    Expected payload keys: lastName (required by Zoho), firstName, email, phone,
    description, customFields
    """
    email = contact_payload.get("email")
    existing = await search_contact_by_email(email) if email else None

    try:
        if existing:
            contact_id = existing.get("id")
            # Patch existing — only send fields that changed / are richer
            patch_body = {k: v for k, v in contact_payload.items() if v is not None}
            resp = await _request("PATCH", f"/contacts/{contact_id}", json=patch_body)
            if resp.status_code in (200, 204):
                return contact_id
            logger.warning(f"[ZOHO] Contact patch {contact_id} failed {resp.status_code}: {resp.text[:200]}")
            return contact_id  # Still return it; patch failure is non-fatal
        # Create new
        resp = await _request("POST", "/contacts", json=contact_payload)
        if resp.status_code in (200, 201):
            return resp.json().get("id")
        logger.error(f"[ZOHO] create contact failed {resp.status_code}: {resp.text[:300]}")
        return None
    except Exception as e:
        logger.error(f"[ZOHO] create_or_update_contact failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────
# HIGH-LEVEL HELPERS — USED BY ROUTES
# ─────────────────────────────────────────────────────────────────────
def _safe_get(d: Dict[str, Any], *keys, default=None):
    """Get the first non-None value from multiple possible keys in a dict."""
    if not isinstance(d, dict):
        return default
    for k in keys:
        v = d.get(k)
        if v not in (None, "", [], {}):
            return v
    return default


def _fmt_list(items, separator=", ", max_items=5) -> str:
    """Compact human-readable list formatter."""
    if not items:
        return ""
    if isinstance(items, str):
        return items
    if not isinstance(items, list):
        return str(items)
    strs = []
    for i in items[:max_items]:
        if isinstance(i, dict):
            strs.append(i.get("name") or i.get("condition") or i.get("allergen") or str(i))
        else:
            strs.append(str(i))
    out = separator.join(s for s in strs if s)
    if len(items) > max_items:
        out += f" (+{len(items) - max_items} more)"
    return out


async def _enrich_ticket_context(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pull member + pet profile context from Mongo for a ticket.
    Returns a merged dict with keys: member, pet, pets (all pets owned),
    plus normalized parent_name, parent_email, parent_phone, parent_city.

    Never raises — returns at least {} on errors.

    Looks in BOTH `users` (primary auth/member collection) and `members`
    (legacy) to find the parent. Also always queries pets by owner_email
    if available, regardless of member resolution.
    """
    out: Dict[str, Any] = {"member": None, "pet": None, "pets": []}
    if _db is None:
        return out

    try:
        # Extract lookup keys from the ticket
        email = (
            _safe_get(ticket, "user_email", "member_email", "parent_email", "email")
            or _safe_get(ticket.get("member") or {}, "email")
            or _safe_get(ticket.get("customer") or {}, "email")
        )
        phone = (
            _safe_get(ticket, "user_phone", "member_phone", "parent_phone", "phone")
            or _safe_get(ticket.get("member") or {}, "phone", "whatsapp_phone")
            or _safe_get(ticket.get("customer") or {}, "phone", "whatsappNumber")
        )
        pet_id = _safe_get(ticket, "pet_id") or _safe_get(ticket.get("pet") or {}, "id", "pet_id")
        pet_name = _safe_get(ticket, "pet_name") or _safe_get(ticket.get("pet") or {}, "name")
        parent_id = _safe_get(ticket, "parent_id", "member_id", "user_id")

        # Member lookup: try `users` (primary) then `members` (legacy) by email + id
        member = None
        projection = {"_id": 0, "password_hash": 0, "hashed_password": 0, "password": 0}
        for coll_name in ("users", "members"):
            if member:
                break
            coll = _db[coll_name]
            if email:
                member = await coll.find_one({"email": email}, projection)
            if not member and parent_id:
                member = await coll.find_one(
                    {"$or": [{"id": parent_id}, {"user_id": parent_id}, {"member_id": parent_id}]},
                    projection,
                )
        out["member"] = member

        # Pet lookup: always query pets by owner_email if we have one,
        # independent of member resolution (some old tickets have email but no user row)
        pet = None
        all_pets: List[Dict[str, Any]] = []
        if pet_id:
            pet = await _db.pets.find_one({"id": pet_id}, {"_id": 0})
            if not pet:
                pet = await _db.pets.find_one({"pet_id": pet_id}, {"_id": 0})

        lookup_email = email or (member or {}).get("email")
        if lookup_email:
            cursor = _db.pets.find(
                {"owner_email": lookup_email},
                {
                    "_id": 0,
                    # Strip heavy sub-docs we don't need for context
                    "conversation_memories": 0,
                    "conversation_insights": 0,
                    "doggy_soul_answers": 0,
                    "enrichment_history": 0,
                    "folder_scores": 0,
                    "category_scores": 0,
                },
            )
            async for p in cursor:
                all_pets.append(p)

        if not pet and all_pets:
            # Match by name if ticket specifies pet_name; else first
            if pet_name:
                for p in all_pets:
                    if (p.get("name") or "").strip().lower() == pet_name.strip().lower():
                        pet = p
                        break
            if not pet:
                pet = all_pets[0]

        out["pet"] = pet
        out["pets"] = all_pets or ([pet] if pet else [])
        out["parent_email"] = email or (member or {}).get("email")
        out["parent_phone"] = (
            phone
            or (member or {}).get("phone")
            or (member or {}).get("whatsapp")
            or (member or {}).get("whatsapp_phone")
        )
        out["parent_name"] = (member or {}).get("name") or ticket.get("user_name") or ticket.get("parent_name")
        out["parent_city"] = (
            (member or {}).get("city")
            or (member or {}).get("location")
            or (pet or {}).get("city")
        )
    except Exception as e:
        logger.warning(f"[ZOHO] _enrich_ticket_context failed: {e}")
    return out


def _build_rich_description(ticket: Dict[str, Any], ctx: Dict[str, Any]) -> str:
    """
    Construct a structured text description for Zoho Desk. Uses Unicode box
    drawing + emoji — renders beautifully as plain text in the Zoho UI.

    Sections:
      1. Pet Intelligence (if pet context available)
      2. Health flags (allergies + conditions)
      3. Soul profile (archetype)
      4. Member / Contact info
      5. Request details (subject, channel, pillar, urgency)
      6. Internal references (ticket_id + admin deep-link)
    """
    lines: List[str] = []
    pet = ctx.get("pet") or {}
    member = ctx.get("member") or {}

    # ── Header / Mira briefing ──────────────────────────────────────
    if ticket.get("mira_briefing"):
        lines.append(str(ticket["mira_briefing"]).strip())
        lines.append("")
    elif ticket.get("description"):
        lines.append(str(ticket["description"]).strip())
        lines.append("")

    # ── Pet intelligence panel ──────────────────────────────────────
    pet_name = pet.get("name") or ticket.get("pet_name")
    if pet_name or pet:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("  🐾 PET PROFILE")
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        if pet_name:
            breed = pet.get("breed") or ticket.get("pet_breed", "")
            age = pet.get("age") or pet.get("age_years")
            gender = pet.get("gender")
            bits = [pet_name]
            if breed: bits.append(breed)
            if age: bits.append(f"{age} yrs")
            if gender: bits.append(gender)
            lines.append(f"🐕 {'  •  '.join(str(b) for b in bits if b)}")
        if pet.get("birthday"):
            lines.append(f"🎂 Birthday: {pet['birthday']}")
        if pet.get("city"):
            lines.append(f"🏙️  City: {pet['city']}")

        # Soul archetype
        soul = pet.get("soul_archetype") or {}
        if isinstance(soul, dict) and soul:
            arch_name = soul.get("archetype_name") or soul.get("primary_archetype")
            arch_emoji = soul.get("archetype_emoji", "")
            arch_desc = soul.get("archetype_description", "")
            if arch_name:
                lines.append(f"🧬 Soul: {arch_emoji} {arch_name}")
                if arch_desc:
                    lines.append(f"    {str(arch_desc)[:140]}")

        # Health flags
        allergies = pet.get("allergies") or []
        conditions = pet.get("health_conditions") or pet.get("health_flags") or []
        if allergies:
            lines.append(f"⚠️  Allergies: {_fmt_list(allergies)}")
        if conditions:
            lines.append(f"💊 Conditions: {_fmt_list(conditions)}")

        # Food / diet
        diet = pet.get("food_preferences") or pet.get("diet") or {}
        if isinstance(diet, dict) and diet:
            current_food = diet.get("current_food") or diet.get("preference")
            if current_food:
                lines.append(f"🥘 Diet: {current_food}")
        elif isinstance(diet, str) and diet:
            lines.append(f"🥘 Diet: {diet}")

        # Vet / vaccinations
        vax = pet.get("vaccinations") or pet.get("health_data", {}).get("vaccinations") if isinstance(pet.get("health_data"), dict) else None
        if vax:
            if isinstance(vax, dict):
                status = vax.get("status") or vax.get("up_to_date")
                if status:
                    lines.append(f"💉 Vaccines: {status}")
            elif isinstance(vax, list) and vax:
                lines.append(f"💉 Vaccines: {len(vax)} on file")

        lines.append("")

    # ── Member panel ────────────────────────────────────────────────
    if member or ctx.get("parent_name") or ctx.get("parent_email"):
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("  👤 MEMBER")
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        name = ctx.get("parent_name") or "Pet Parent"
        email = ctx.get("parent_email") or ""
        phone = ctx.get("parent_phone") or ""
        bits = [name]
        if email: bits.append(email)
        if phone: bits.append(phone)
        lines.append(f"👤 {'  •  '.join(str(b) for b in bits if b)}")
        if member.get("membership_tier"):
            lines.append(f"💎 Tier: {member['membership_tier']}")
        if member.get("created_at"):
            since = str(member["created_at"])[:10]
            lines.append(f"📅 Member since: {since}")
        # Show pet count if multiple
        pets_list = ctx.get("pets") or []
        if len(pets_list) > 1:
            pet_names = [p.get("name") for p in pets_list if p.get("name")]
            lines.append(f"🐾 Pets in household ({len(pets_list)}): {_fmt_list(pet_names, max_items=6)}")
        lines.append("")

    # ── Request metadata ────────────────────────────────────────────
    channel = ticket.get("channel") or ticket.get("source")
    pillar = ticket.get("pillar")
    urgency = ticket.get("urgency") or ticket.get("priority")
    intent = ticket.get("intent") or ticket.get("intent_type")
    if any([channel, pillar, urgency, intent]):
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("  📋 REQUEST")
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        if pillar: lines.append(f"Pillar:   {pillar}")
        if intent: lines.append(f"Intent:   {intent}")
        if channel: lines.append(f"Channel:  {channel}")
        if urgency: lines.append(f"Urgency:  {urgency}")
        lines.append("")

    # ── Footer / references ─────────────────────────────────────────
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    tid = ticket.get("ticket_id", "?")
    lines.append(f"🔗 Internal Ticket ID: {tid}")
    admin_base = os.environ.get("ADMIN_PUBLIC_URL") or "https://thedoggycompany.com/admin"
    lines.append(f"🔗 Open in Pet OS admin: {admin_base.rstrip('/')}/service-desk/{tid}")

    return "\n".join(lines).strip()


def _build_zoho_custom_fields(ticket: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map enriched context to Zoho Desk custom field API names.

    NOTE: These API names are Zoho-specific — they must exist in Zoho Setup →
    Customization → Layouts & Fields → Tickets. If a field doesn't exist,
    Zoho silently ignores it (no error). So this is safe to always populate.

    User can create these fields in Zoho UI later; field names are prefixed
    with `cf_` per Zoho convention.
    """
    pet = ctx.get("pet") or {}
    member = ctx.get("member") or {}
    soul = pet.get("soul_archetype") or {} if isinstance(pet.get("soul_archetype"), dict) else {}
    allergies = pet.get("allergies") or []
    conditions = pet.get("health_conditions") or pet.get("health_flags") or []

    cf = {
        "cf_pet_name": pet.get("name") or ticket.get("pet_name") or "",
        "cf_pet_breed": pet.get("breed") or ticket.get("pet_breed") or "",
        "cf_pet_age": str(pet.get("age") or pet.get("age_years") or ""),
        "cf_pet_city": pet.get("city") or ctx.get("parent_city") or "",
        "cf_soul_archetype": soul.get("archetype_name") or soul.get("primary_archetype") or "",
        "cf_allergies": _fmt_list(allergies, max_items=10) or "",
        "cf_health_conditions": _fmt_list(conditions, max_items=10) or "",
        "cf_membership_tier": member.get("membership_tier") or "",
        "cf_internal_ticket_id": ticket.get("ticket_id") or "",
        "cf_pillar": ticket.get("pillar") or "",
    }
    # Strip empty values — Zoho is happier without them
    return {k: v for k, v in cf.items() if v not in (None, "", [])}


def _map_local_to_zoho_payload(ticket: Dict[str, Any], ctx: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Translate an internal `service_desk_tickets` doc → Zoho Desk ticket payload.
    Keep this mapping logic in ONE place.

    If `ctx` (enriched context) is not provided, falls back to ticket-only data
    for backwards compatibility.
    """
    ctx = ctx or {}
    member = ctx.get("member") or ticket.get("member") or {}
    user_name = ctx.get("parent_name") or ticket.get("user_name") or member.get("name") or "Pet Parent"
    user_email = ctx.get("parent_email") or ticket.get("user_email") or member.get("email")
    user_phone = ctx.get("parent_phone") or ticket.get("user_phone") or member.get("phone")

    # Parse name into last/first (Zoho requires lastName on contact)
    parts = (user_name or "Pet Parent").strip().split(" ", 1)
    first_name = parts[0] if parts else "Pet"
    last_name = parts[1] if len(parts) > 1 else "Parent"

    # Zoho priority mapping
    urgency = (ticket.get("urgency") or ticket.get("priority") or "low").lower()
    priority_map = {
        "emergency": "High", "urgent": "High", "high": "High",
        "normal": "Medium", "medium": "Medium", "low": "Low",
    }
    zoho_priority = priority_map.get(str(urgency), "Medium")

    description = _build_rich_description(ticket, ctx) if ctx else ticket.get("description", "")
    custom_fields = _build_zoho_custom_fields(ticket, ctx) if ctx else {}

    return {
        "subject": ticket.get("subject") or "Pet Life OS Request",
        "description": description,
        "departmentId": os.environ["ZOHO_DEPARTMENT_ID"],
        "contact": {
            "firstName": first_name,
            "lastName": last_name,
            **({"email": user_email} if user_email else {}),
            **({"phone": user_phone} if user_phone else {}),
        },
        "priority": zoho_priority,
        "category": ticket.get("pillar", "General"),
        "channel": "Web",
        "cf": custom_fields,
    }


async def push_ticket_to_zoho(local_ticket_id: str, force: bool = False) -> Dict[str, Any]:
    """
    Idempotent: push a service_desk_tickets row to Zoho Desk.
    If already synced (has zoho_ticket_id) and not force, skips. Logs every attempt.

    - Enriches ticket with member + pet profile from Mongo before push
    - Upserts Zoho contact by email (so tickets link to real people, not "Website Visitor")
    - Populates custom fields + rich structured description

    If `force=True`, PATCHes the existing Zoho ticket instead of creating a new one
    (used by /api/zoho/re-push for upgrading already-synced tickets with richer data).
    """
    if not is_enabled():
        return {"skipped": True, "reason": "ZOHO_ENABLED=false"}
    if _db is None:
        return {"skipped": True, "reason": "db not initialised"}

    now = datetime.now(timezone.utc)
    ticket = await _db.service_desk_tickets.find_one(
        {"ticket_id": local_ticket_id}, {"_id": 0}
    )
    if not ticket:
        return {"skipped": True, "reason": f"ticket {local_ticket_id} not found"}

    already_synced_zoho_id = ticket.get("zoho_ticket_id")
    if already_synced_zoho_id and not force:
        return {
            "skipped": True,
            "reason": "already_synced",
            "zoho_ticket_id": already_synced_zoho_id,
        }

    try:
        # Enrich with member + pet context
        ctx = await _enrich_ticket_context(ticket)
        payload = _map_local_to_zoho_payload(ticket, ctx)

        # Upsert Zoho contact record (pet parent becomes a first-class contact)
        contact_id = None
        if ctx.get("parent_email"):
            contact_payload = {
                "firstName": payload["contact"].get("firstName", "Pet"),
                "lastName": payload["contact"].get("lastName", "Parent"),
                "email": ctx["parent_email"],
            }
            if ctx.get("parent_phone"):
                contact_payload["phone"] = ctx["parent_phone"]
            if ctx.get("parent_city"):
                contact_payload["city"] = ctx["parent_city"]
            contact_id = await create_or_update_contact(contact_payload)
            if contact_id:
                # Prefer contactId over embedded contact object
                payload["contactId"] = contact_id
                payload.pop("contact", None)

        # Either create new or patch existing
        if already_synced_zoho_id and force:
            # Update in place — strip fields Zoho doesn't allow on PATCH
            patch_body = {k: v for k, v in payload.items() if k in ("subject", "description", "priority", "category", "cf", "contactId")}
            result = await update_ticket(already_synced_zoho_id, patch_body)
            zoho_id = already_synced_zoho_id
            zoho_number = (result.get("ticketNumber") if isinstance(result, dict) else None)
            action = "updated"
        else:
            result = await create_ticket(payload)
            zoho_id = result.get("id") or result.get("data", {}).get("id")
            zoho_number = result.get("ticketNumber") or result.get("data", {}).get("ticketNumber")
            action = "created"

        await _db.service_desk_tickets.update_one(
            {"ticket_id": local_ticket_id},
            {"$set": {
                "zoho_ticket_id": zoho_id,
                "zoho_ticket_number": zoho_number,
                "zoho_contact_id": contact_id,
                "zoho_synced_at": now.isoformat(),
                "zoho_sync_error": None,
                "zoho_enriched": True,
            }},
        )
        await _db.zoho_sync_log.insert_one({
            "direction": "push",
            "action": action,
            "local_ticket_id": local_ticket_id,
            "zoho_ticket_id": zoho_id,
            "zoho_contact_id": contact_id,
            "status": "success",
            "timestamp": now.isoformat(),
        })
        logger.info(f"[ZOHO] {action.title()} {local_ticket_id} → Zoho #{zoho_number} (id={zoho_id}, contact={contact_id})")
        return {
            "success": True,
            "action": action,
            "zoho_ticket_id": zoho_id,
            "zoho_ticket_number": zoho_number,
            "zoho_contact_id": contact_id,
        }

    except Exception as e:
        err = str(e)[:500]
        logger.error(f"[ZOHO] Push failed for {local_ticket_id}: {err}")
        await _db.service_desk_tickets.update_one(
            {"ticket_id": local_ticket_id},
            {"$set": {"zoho_sync_error": err, "zoho_synced_at": None}},
        )
        await _db.zoho_sync_log.insert_one({
            "direction": "push",
            "local_ticket_id": local_ticket_id,
            "status": "error",
            "error": err,
            "timestamp": now.isoformat(),
        })
        return {"success": False, "error": err}


async def push_comment_to_zoho(
    local_ticket_id: str,
    content: str,
    is_public: bool = True,
) -> Dict[str, Any]:
    """When a local admin/Mira replies, mirror that to Zoho as a comment."""
    if not is_enabled() or _db is None:
        return {"skipped": True}
    ticket = await _db.service_desk_tickets.find_one(
        {"ticket_id": local_ticket_id}, {"_id": 0, "zoho_ticket_id": 1}
    )
    if not ticket or not ticket.get("zoho_ticket_id"):
        return {"skipped": True, "reason": "not_synced_to_zoho"}

    try:
        result = await add_comment(ticket["zoho_ticket_id"], content, is_public=is_public)
        return {"success": True, "comment": result}
    except Exception as e:
        logger.error(f"[ZOHO] push_comment_to_zoho failed: {e}")
        return {"success": False, "error": str(e)[:300]}


async def fire_and_forget_push(local_ticket_id: str):
    """Background wrapper — never raises, never blocks caller."""
    if not is_enabled():
        return
    try:
        await push_ticket_to_zoho(local_ticket_id)
    except Exception as e:
        logger.error(f"[ZOHO] Background push crashed for {local_ticket_id}: {e}")


def schedule_push(local_ticket_id: str):
    """
    Sync wrapper — schedules a fire-and-forget Zoho push without blocking
    the caller. Safe to call from any ticket-creation site after
    `await db.service_desk_tickets.insert_one(...)`.

    - No-op if ZOHO_ENABLED is false
    - No-op if no event loop is running
    - Never raises: logs warnings and continues
    """
    try:
        if not is_enabled():
            return
        import asyncio as _asyncio
        try:
            loop = _asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            loop.create_task(fire_and_forget_push(local_ticket_id))
        else:
            # Fallback: run in a new event loop (rare — e.g. sync code path)
            _asyncio.run(fire_and_forget_push(local_ticket_id))
    except Exception as e:
        logger.warning(f"[ZOHO] schedule_push failed for {local_ticket_id}: {e}")
