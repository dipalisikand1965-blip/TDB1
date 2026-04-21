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
# HIGH-LEVEL HELPERS — USED BY ROUTES
# ─────────────────────────────────────────────────────────────────────
def _map_local_to_zoho_payload(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """
    Translate an internal `service_desk_tickets` doc → Zoho Desk ticket payload.
    Keep this mapping logic in ONE place.
    """
    member = ticket.get("member") or {}
    user_name = ticket.get("user_name") or member.get("name") or "Pet Parent"
    user_email = ticket.get("user_email") or member.get("email")
    user_phone = ticket.get("user_phone") or member.get("phone")

    # Parse name into last/first (Zoho requires lastName on contact)
    parts = (user_name or "Pet Parent").split(" ", 1)
    first_name = parts[0] if parts else "Pet"
    last_name = parts[1] if len(parts) > 1 else "Parent"

    # Zoho priority mapping
    urgency = (ticket.get("urgency") or ticket.get("priority") or "low").lower()
    priority_map = {
        "emergency": "High",
        "urgent": "High",
        "high": "High",
        "normal": "Medium",
        "medium": "Medium",
        "low": "Low",
    }
    zoho_priority = priority_map.get(urgency, "Medium")

    # Build rich description
    desc_lines = []
    if ticket.get("mira_briefing"):
        desc_lines.append(f"🐾 Mira's Briefing:\n{ticket['mira_briefing']}\n")
    if ticket.get("description"):
        desc_lines.append(f"Description:\n{ticket['description']}\n")
    if ticket.get("pet_name"):
        desc_lines.append(f"Pet: {ticket['pet_name']} ({ticket.get('pet_breed', 'unknown breed')})")
    if ticket.get("pillar"):
        desc_lines.append(f"Pillar: {ticket['pillar']}")
    if ticket.get("channel"):
        desc_lines.append(f"Channel: {ticket['channel']}")
    desc_lines.append(f"Internal Ticket ID: {ticket.get('ticket_id')}")

    return {
        "subject": ticket.get("subject") or "Pet Life OS Request",
        "description": "\n".join(desc_lines),
        "departmentId": os.environ["ZOHO_DEPARTMENT_ID"],
        "contact": {
            "firstName": first_name,
            "lastName": last_name,
            **({"email": user_email} if user_email else {}),
            **({"phone": user_phone} if user_phone else {}),
        },
        "priority": zoho_priority,
        "category": ticket.get("pillar", "General"),
        "channel": "Web",  # Zoho accepts: Email, Phone, Chat, Web, Twitter, Facebook, Forums
        "cf": {},  # custom fields slot — populate later if needed
    }


async def push_ticket_to_zoho(local_ticket_id: str) -> Dict[str, Any]:
    """
    Idempotent: push a service_desk_tickets row to Zoho Desk.
    If already synced (has zoho_ticket_id), skips. Logs every attempt.
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

    if ticket.get("zoho_ticket_id"):
        return {
            "skipped": True,
            "reason": "already_synced",
            "zoho_ticket_id": ticket["zoho_ticket_id"],
        }

    try:
        payload = _map_local_to_zoho_payload(ticket)
        result = await create_ticket(payload)
        zoho_id = result.get("id") or result.get("data", {}).get("id")
        zoho_number = result.get("ticketNumber") or result.get("data", {}).get("ticketNumber")

        await _db.service_desk_tickets.update_one(
            {"ticket_id": local_ticket_id},
            {"$set": {
                "zoho_ticket_id": zoho_id,
                "zoho_ticket_number": zoho_number,
                "zoho_synced_at": now.isoformat(),
                "zoho_sync_error": None,
            }},
        )
        # Audit log
        await _db.zoho_sync_log.insert_one({
            "direction": "push",
            "local_ticket_id": local_ticket_id,
            "zoho_ticket_id": zoho_id,
            "status": "success",
            "timestamp": now.isoformat(),
        })
        logger.info(f"[ZOHO] Pushed {local_ticket_id} → Zoho #{zoho_number} (id={zoho_id})")
        return {"success": True, "zoho_ticket_id": zoho_id, "zoho_ticket_number": zoho_number}

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
