"""
mira_memory_routes.py — Persistent cross-pillar, cross-session Mira conversation memory.

Stores conversation history in MongoDB `mira_conversations` collection per user + pet.
Every Mira widget open fetches the last 10 messages as context for Claude.

Schema:
  mira_conversations: {
    user_email: str,
    pet_id: str,
    pet_name: str,
    messages: [{ role, content, pillar, timestamp, intent_tags }],
    preferences: [str],        // e.g. "Mojo doesn't like baths"
    service_interests: [str],  // e.g. "grooming", "birthday cake"
    concierge_requests: [{ label, pillar, status, created_at }],
    last_updated: datetime
  }
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt

mira_memory_router = APIRouter()
# Backwards compat alias for existing server.py import
router = mira_memory_router

# Module-level DB reference (injected via set_memory_routes_db)
_db = None

def set_memory_routes_db(database):
    """Called by server.py after DB is connected."""
    global _db
    _db = database


def _get_db():
    return _db
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key")


def _get_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[str]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub") or payload.get("email")
    except Exception:
        return None


# ── Pydantic models ─────────────────────────────────────────────────────────
class MiraMessage(BaseModel):
    role: str           # "user" | "assistant"
    content: str
    pillar: Optional[str] = None
    intent_tags: Optional[List[str]] = None


class SaveMessageRequest(BaseModel):
    pet_id: str
    pet_name: Optional[str] = None
    messages: List[MiraMessage]
    preferences: Optional[List[str]] = None
    service_interest: Optional[str] = None


class ConciergeRequestLog(BaseModel):
    pet_id: str
    label: str
    pillar: Optional[str] = None
    status: str = "pending"


# ── Endpoints ─────────────────────────────────────────────────────────────
@mira_memory_router.get("/api/mira/memory/{pet_id}")
async def get_mira_memory(
    pet_id: str,
    limit: int = 20,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Fetch last N messages + preferences for context seeding."""
    from server import app as _app
    _injected = _get_db()
    db = _injected if _injected is not None else getattr(getattr(_app, 'state', None), 'db', None)
    if db is None:
        return {"messages": [], "preferences": [], "service_interests": [], "concierge_requests": []}

    doc = await db.mira_conversations.find_one({"pet_id": pet_id}, {"_id": 0})
    if not doc:
        return {"messages": [], "preferences": [], "service_interests": [], "concierge_requests": []}

    messages = doc.get("messages", [])
    return {
        "messages": messages[-limit:],
        "preferences": doc.get("preferences", []),
        "service_interests": doc.get("service_interests", []),
        "concierge_requests": doc.get("concierge_requests", [])[-5:],
    }


@mira_memory_router.post("/api/mira/memory/save")
async def save_mira_messages(
    body: SaveMessageRequest,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Append new messages to the pet's conversation history (capped at 100)."""
    from server import app as _app
    _injected = _get_db()
    db = _injected if _injected is not None else getattr(getattr(_app, 'state', None), 'db', None)
    if db is None:
        return {"ok": True, "stored": 0}

    now = datetime.now(timezone.utc)
    new_messages = [
        {
            "role": m.role,
            "content": m.content,
            "pillar": m.pillar,
            "intent_tags": m.intent_tags or [],
            "timestamp": now.isoformat(),
        }
        for m in body.messages
    ]

    update_ops = {
        "$push": {
            "messages": {
                "$each": new_messages,
                "$slice": -100,
            }
        },
        "$set": {
            "pet_name": body.pet_name,
            "last_updated": now.isoformat(),
        },
    }

    if body.preferences:
        update_ops["$addToSet"] = {"preferences": {"$each": body.preferences}}
    if body.service_interest:
        update_ops.setdefault("$addToSet", {})
        update_ops["$addToSet"]["service_interests"] = body.service_interest

    await db.mira_conversations.update_one(
        {"pet_id": body.pet_id},
        {**update_ops, "$setOnInsert": {"user_email": user_email, "pet_id": body.pet_id}},
        upsert=True,
    )
    return {"ok": True, "stored": len(new_messages)}


@mira_memory_router.post("/api/mira/memory/log-concierge-request")
async def log_concierge_request(
    body: ConciergeRequestLog,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Log a Concierge request so Mira can reference it in future conversations."""
    from server import app as _app
    _injected = _get_db()
    db = _injected if _injected is not None else getattr(getattr(_app, 'state', None), 'db', None)
    if db is None:
        return {"ok": True}

    now = datetime.now(timezone.utc)
    entry = {"label": body.label, "pillar": body.pillar, "status": body.status, "created_at": now.isoformat()}
    await db.mira_conversations.update_one(
        {"pet_id": body.pet_id},
        {
            "$push": {"concierge_requests": {"$each": [entry], "$slice": -20}},
            "$set": {"last_updated": now.isoformat()},
            "$setOnInsert": {"user_email": user_email, "pet_id": body.pet_id},
        },
        upsert=True,
    )
    return {"ok": True}


@mira_memory_router.delete("/api/mira/memory/{pet_id}")
async def clear_mira_memory(
    pet_id: str,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Clear conversation history for a pet."""
    from server import app as _app
    _injected = _get_db()
    db = _injected if _injected is not None else getattr(getattr(_app, 'state', None), 'db', None)
    if db is None:
        return {"ok": True}

    await db.mira_conversations.update_one(
        {"pet_id": pet_id},
        {"$set": {"messages": [], "last_updated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}
