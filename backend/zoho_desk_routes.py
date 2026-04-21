"""
Zoho Desk Two-Way Sync — HTTP Routes
======================================

Public endpoints:
  GET  /api/zoho/health             # config snapshot (no secrets)
  POST /api/zoho/test-connection    # live ping — fetches org info via live creds
  POST /api/zoho/sync-ticket/{id}   # manually push 1 ticket (admin op)
  POST /api/zoho/bulk-sync          # push all unsynced tickets (admin op)
  POST /api/zoho/webhook            # inbound webhook receiver (Zoho → us)
  GET  /api/zoho/webhook-events     # audit log (admin op)

Inbound webhook flow:
  Zoho agent replies → Zoho POSTs here → we update local ticket
  → we send the reply to the customer via WhatsApp (Gupshup) + email.

Security model:
  Webhook URL requires ?token=<ZOHO_WEBHOOK_TOKEN> as a shared-secret query param.
  Admin ops (sync-ticket, bulk-sync, webhook-events) require header `X-Admin-Secret`
  matching ADMIN_PASSWORD env, OR should be proxied behind an admin-only gateway.
"""
import os
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException, Request, Query, Header, BackgroundTasks
from pydantic import BaseModel

import zoho_desk_client as zoho

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/zoho", tags=["zoho-desk"])

_db = None


def set_db(database):
    global _db
    _db = database
    zoho.set_db(database)


# ─────────────────────────────────────────────────────────────────────
# ADMIN GUARD
# ─────────────────────────────────────────────────────────────────────
def _require_admin(x_admin_secret: Optional[str]):
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("ZOHO_ADMIN_SECRET")
    if not expected:
        # Fallback for internal testing — log a warning
        logger.warning("[ZOHO] No ADMIN_PASSWORD set — admin endpoint unprotected")
        return
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Admin secret required")


def _require_webhook_token(token: Optional[str]):
    expected = os.environ.get("ZOHO_WEBHOOK_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Webhook receiver not configured — set ZOHO_WEBHOOK_TOKEN env",
        )
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid webhook token")


# ─────────────────────────────────────────────────────────────────────
# 1. HEALTH / CONFIG
# ─────────────────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    """Non-authenticated config snapshot. Safe to expose."""
    status = zoho.config_status()
    status["ok"] = status["enabled"] and status["configured"]
    return status


@router.post("/test-connection")
async def test_connection(x_admin_secret: Optional[str] = Header(None)):
    """
    Live credential test. Hits Zoho Desk /organizations endpoint
    with a fresh token. Returns org name + dc on success.
    """
    _require_admin(x_admin_secret)
    if not zoho.is_configured():
        raise HTTPException(status_code=400, detail="Zoho not configured")
    try:
        data = await zoho.get_organizations()
        orgs = data.get("data", []) if isinstance(data, dict) else []
        return {
            "success": True,
            "dc": zoho._dc(),
            "api_base": zoho.api_base(),
            "organizations_count": len(orgs),
            "first_org_name": orgs[0].get("companyName") if orgs else None,
        }
    except Exception as e:
        logger.exception("[ZOHO] test-connection failed")
        raise HTTPException(status_code=502, detail=f"Zoho API call failed: {str(e)[:300]}")


# ─────────────────────────────────────────────────────────────────────
# 2. MANUAL PUSH — one ticket
# ─────────────────────────────────────────────────────────────────────
@router.post("/sync-ticket/{local_ticket_id}")
async def sync_one_ticket(
    local_ticket_id: str,
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    result = await zoho.push_ticket_to_zoho(local_ticket_id)
    if result.get("success"):
        return result
    if result.get("skipped"):
        return result
    raise HTTPException(status_code=502, detail=result.get("error", "Unknown sync error"))


# ─────────────────────────────────────────────────────────────────────
# 3. BULK PUSH — backfill all un-synced tickets
# ─────────────────────────────────────────────────────────────────────
@router.post("/bulk-sync")
async def bulk_sync(
    background_tasks: BackgroundTasks,
    limit: int = Query(50, ge=1, le=500),
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    if _db is None:
        raise HTTPException(status_code=500, detail="DB not initialized")

    cursor = _db.service_desk_tickets.find(
        {"zoho_ticket_id": {"$exists": False}},
        {"ticket_id": 1, "_id": 0},
    ).limit(limit)

    ticket_ids = [doc["ticket_id"] async for doc in cursor if doc.get("ticket_id")]

    for tid in ticket_ids:
        background_tasks.add_task(zoho.fire_and_forget_push, tid)

    return {
        "queued": len(ticket_ids),
        "ticket_ids": ticket_ids,
        "message": "Queued as background tasks. Poll /api/zoho/sync-log for status.",
    }


# ─────────────────────────────────────────────────────────────────────
# 4. SYNC LOG (audit)
# ─────────────────────────────────────────────────────────────────────
@router.get("/sync-log")
async def sync_log(
    limit: int = Query(50, ge=1, le=500),
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    if _db is None:
        return {"logs": []}
    cursor = _db.zoho_sync_log.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    return {"logs": [doc async for doc in cursor]}


@router.get("/webhook-events")
async def list_webhook_events(
    limit: int = Query(50, ge=1, le=500),
    x_admin_secret: Optional[str] = Header(None),
):
    _require_admin(x_admin_secret)
    if _db is None:
        return {"events": []}
    cursor = _db.zoho_webhook_events.find({}, {"_id": 0}).sort("received_at", -1).limit(limit)
    return {"events": [doc async for doc in cursor]}


# ─────────────────────────────────────────────────────────────────────
# 5. INBOUND WEBHOOK — Zoho → us
# ─────────────────────────────────────────────────────────────────────
@router.post("/webhook")
async def zoho_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    token: Optional[str] = Query(None),
):
    """
    Receives Zoho Desk webhook events (agent replies, status changes, etc.)
    and mirrors them back to:
      1. The local service_desk_tickets document
      2. The customer via WhatsApp (Gupshup) for agent comments
      3. The local ticket conversation trail

    We ALWAYS return 200 within 5s — processing happens in background.
    """
    _require_webhook_token(token)

    try:
        body = await request.json()
    except Exception:
        body = {"_raw": (await request.body()).decode("utf-8", errors="ignore")[:5000]}

    if _db is not None:
        await _db.zoho_webhook_events.insert_one({
            "received_at": datetime.now(timezone.utc).isoformat(),
            "headers": dict(request.headers),
            "payload": body,
        })

    background_tasks.add_task(_process_webhook_event, body)
    return {"ok": True, "received": True}


async def _process_webhook_event(body: Dict[str, Any]):
    """
    Event-type detection is tolerant — Zoho's webhook payload varies by
    event. We look at 'payload' / 'eventType' / 'module' to route.
    """
    try:
        event_type = (
            body.get("eventType")
            or body.get("event")
            or body.get("action")
            or ""
        ).lower()

        # Zoho wraps ticket/comment data in different keys depending on event
        data = body.get("payload") or body.get("data") or body
        if isinstance(data, list) and data:
            data = data[0]

        zoho_ticket_id = (
            data.get("ticketId")
            or data.get("id")
            or (data.get("ticket") or {}).get("id")
            or body.get("ticketId")
        )
        if not zoho_ticket_id:
            logger.warning(f"[ZOHO-WEBHOOK] No ticket id in payload: keys={list(body.keys())}")
            return

        local = await _db.service_desk_tickets.find_one(
            {"zoho_ticket_id": str(zoho_ticket_id)},
            {"_id": 0},
        )
        if not local:
            logger.warning(f"[ZOHO-WEBHOOK] No local ticket for Zoho id {zoho_ticket_id}")
            return

        # Comment-add events → forward to user
        if "comment" in event_type or data.get("content"):
            await _handle_comment_event(local, data)
        elif "status" in event_type or data.get("status"):
            await _handle_status_event(local, data)
        else:
            # Fallback: just log
            logger.info(f"[ZOHO-WEBHOOK] Unhandled event type '{event_type}' for {zoho_ticket_id}")

    except Exception as e:
        logger.exception(f"[ZOHO-WEBHOOK] Processing crashed: {e}")


async def _handle_comment_event(local: Dict[str, Any], data: Dict[str, Any]):
    """Zoho agent added a comment → forward to user via WhatsApp + email."""
    content = data.get("content") or data.get("comment") or ""
    is_public = data.get("isPublic", True)
    author = (data.get("author") or {}).get("name") or "Concierge"

    if not content or not is_public:
        logger.info("[ZOHO-WEBHOOK] Private or empty comment — not forwarding")
        return

    now = datetime.now(timezone.utc)
    local_ticket_id = local.get("ticket_id")

    # 1. Append to local conversation trail
    await _db.service_desk_tickets.update_one(
        {"ticket_id": local_ticket_id},
        {
            "$push": {
                "conversation": {
                    "sender": "agent",
                    "source": "zoho_desk",
                    "author_name": author,
                    "text": content,
                    "timestamp": now.isoformat(),
                },
                "activity_log": {
                    "action": "zoho_agent_reply",
                    "timestamp": now.isoformat(),
                    "details": f"{author}: {content[:120]}",
                },
            },
            "$set": {"updated_at": now.isoformat()},
        },
    )
    # Mirror into mira_conversations too (keeps WhatsApp & admin in sync)
    await _db.mira_conversations.update_one(
        {"ticket_id": local_ticket_id},
        {
            "$push": {
                "conversation": {
                    "sender": "agent",
                    "source": "zoho_desk",
                    "text": content,
                    "timestamp": now.isoformat(),
                }
            },
            "$set": {"updated_at": now.isoformat()},
        },
    )

    # 2. Forward to user via WhatsApp if phone present
    phone = local.get("user_phone") or (local.get("member") or {}).get("phone")
    if phone:
        try:
            await _send_whatsapp_reply(phone, author, content, local_ticket_id)
        except Exception as e:
            logger.error(f"[ZOHO-WEBHOOK] WhatsApp forward failed: {e}")

    # 3. Email (optional — if Resend configured in user_tickets_routes)
    email = local.get("user_email") or (local.get("member") or {}).get("email")
    if email:
        try:
            from user_tickets_routes import send_ticket_update_email
            await send_ticket_update_email(
                to_email=email,
                customer_name=(local.get("user_name") or "Pet Parent"),
                ticket_id=local_ticket_id,
                message=content,
                subject_line=f"Reply from {author} — Pet Life OS",
            )
        except Exception as e:
            logger.error(f"[ZOHO-WEBHOOK] Email forward failed: {e}")


async def _handle_status_event(local: Dict[str, Any], data: Dict[str, Any]):
    """Zoho status change → reflect in local ticket."""
    new_status = data.get("status") or data.get("newStatus")
    if not new_status:
        return
    now = datetime.now(timezone.utc)

    # Normalize Zoho statuses → local statuses
    status_map = {
        "open": "open",
        "on hold": "pending",
        "escalated": "escalated",
        "closed": "resolved",
        "resolved": "resolved",
    }
    local_status = status_map.get(new_status.lower(), new_status.lower())

    await _db.service_desk_tickets.update_one(
        {"ticket_id": local["ticket_id"]},
        {
            "$set": {"status": local_status, "updated_at": now.isoformat()},
            "$push": {
                "activity_log": {
                    "action": "zoho_status_change",
                    "timestamp": now.isoformat(),
                    "details": f"Status → {new_status}",
                }
            },
        },
    )


# ─────────────────────────────────────────────────────────────────────
# WHATSAPP FORWARD HELPER
# ─────────────────────────────────────────────────────────────────────
async def _send_whatsapp_reply(phone: str, author: str, content: str, ticket_id: str):
    """
    Uses existing Gupshup config. Keeps message short to respect session-window
    rules (user must have messaged us in last 24h, otherwise we'd need a template).
    """
    import httpx
    import json as _json

    api_key = os.environ.get("GUPSHUP_API_KEY")
    if not api_key:
        logger.info("[ZOHO-WEBHOOK] Gupshup not configured — skipping WhatsApp forward")
        return

    source = os.environ.get("GUPSHUP_SOURCE_NUMBER") or os.environ.get("WHATSAPP_NUMBER")
    app_name = os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany")

    message_text = f"🐾 *{author}* from Pet Life OS:\n\n{content}\n\n_Ref: #{ticket_id[-6:]}_"

    # Normalize phone — Gupshup wants digits only (with country code)
    dest = "".join(ch for ch in phone if ch.isdigit())
    if len(dest) == 10:
        dest = "91" + dest  # India default

    payload = {
        "channel": "whatsapp",
        "source": source,
        "destination": dest,
        "message": _json.dumps({"type": "text", "text": message_text}),
        "src.name": app_name,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.gupshup.io/wa/api/v1/msg",
            headers={
                "apikey": api_key,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data=payload,
        )
    logger.info(f"[ZOHO-WEBHOOK] Gupshup forward {resp.status_code}: {resp.text[:200]}")


# ─────────────────────────────────────────────────────────────────────
# OUTBOUND COMMENT (local reply → Zoho)
# ─────────────────────────────────────────────────────────────────────
class AddCommentRequest(BaseModel):
    ticket_id: str
    content: str
    is_public: bool = True


@router.post("/add-comment")
async def add_comment_to_zoho(
    req: AddCommentRequest,
    x_admin_secret: Optional[str] = Header(None),
):
    """When a local agent replies via admin UI → mirror to Zoho as a comment."""
    _require_admin(x_admin_secret)
    result = await zoho.push_comment_to_zoho(
        local_ticket_id=req.ticket_id,
        content=req.content,
        is_public=req.is_public,
    )
    if result.get("success") or result.get("skipped"):
        return result
    raise HTTPException(status_code=502, detail=result.get("error", "Comment push failed"))
