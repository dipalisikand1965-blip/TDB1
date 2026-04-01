"""
mira_memory_routes.py — Persistent cross-pillar, cross-session Mira conversation memory.

Two collections:
  mira_conversations: Running chat history per pet (capped at 100 messages)
  mira_memories:      Structured memory events (health, milestone, grief, etc.)
                      with follow-up scheduling and resolution tracking.

mira_memories schema:
  {
    pet_id:             str,
    user_id:            str (email),
    memory_type:        "health" | "milestone" | "grief" | "behaviour" | "nutrition",
    content:            str  — what the user said,
    mira_response:      str  — what Mira replied,
    follow_up:          bool — whether a follow-up check-in should be sent,
    follow_up_message:  str  — the check-in message to surface,
    follow_up_shown:    bool — True once surfaced to user,
    resolved:           bool — True when user signals all is well,
    resolved_at:        datetime | None,
    created_at:         str (ISO),
  }
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from bson import ObjectId
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


def _serialize_memory(doc: dict) -> dict:
    """Convert MongoDB doc to JSON-safe dict (ObjectId → str)."""
    out = {k: v for k, v in doc.items() if k != "_id"}
    if "_id" in doc:
        out["_id"] = str(doc["_id"])
    return out


def _get_db_from_app():
    from server import app as _app
    injected = _get_db()
    return injected if injected is not None else getattr(getattr(_app, "state", None), "db", None)


# ── Pydantic models ─────────────────────────────────────────────────────────

class MiraMessage(BaseModel):
    role: str           # "user" | "assistant"
    content: str
    pillar: Optional[str] = None
    intent_tags: Optional[List[str]] = None


class SaveMessageRequest(BaseModel):
    pet_id: str
    pet_name: Optional[str] = None
    messages: Optional[List[MiraMessage]] = None
    preferences: Optional[List[str]] = None
    service_interest: Optional[str] = None
    # Memory event fields (present when memory_type is set)
    memory_type: Optional[str] = None      # "health" | "milestone" | "grief" | "behaviour" | "nutrition"
    content: Optional[str] = None          # user's message text
    mira_response: Optional[str] = None    # Mira's reply text
    follow_up: Optional[bool] = False
    follow_up_message: Optional[str] = None
    created_at: Optional[str] = None


class ConciergeRequestLog(BaseModel):
    pet_id: str
    label: str
    pillar: Optional[str] = None
    status: str = "pending"


# ── GET /api/mira/memory/{pet_id} ───────────────────────────────────────────

@mira_memory_router.get("/api/mira/memory/{pet_id}")
async def get_mira_memory(
    pet_id: str,
    limit: int = 20,
    follow_up: bool = False,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """
    - follow_up=false (default): returns conversation history from mira_conversations
    - follow_up=true: returns pending follow-up memories from mira_memories
    """
    db = _get_db_from_app()
    if db is None:
        return {"messages": [], "preferences": [], "service_interests": [],
                "concierge_requests": [], "memories": []}

    # ── FOLLOW-UP mode: return pending check-ins from mira_memories ──────────
    if follow_up:
        query = {
            "pet_id": pet_id,
            "follow_up": True,
            "follow_up_shown": False,
            "resolved": False,
        }
        memories = await db.mira_memories.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        return {"memories": [_serialize_memory(m) for m in memories]}

    # ── DEFAULT mode: return conversation messages ───────────────────────────
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


# ── POST /api/mira/memory/save ───────────────────────────────────────────────

@mira_memory_router.post("/api/mira/memory/save")
async def save_mira_messages(
    body: SaveMessageRequest,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """
    Dual-mode save:
    - If body.memory_type is set → save structured memory event to mira_memories
    - Otherwise → append conversation messages to mira_conversations (capped at 100)
    """
    db = _get_db_from_app()
    if db is None:
        return {"ok": True, "stored": 0}

    now = datetime.now(timezone.utc)

    # ── MEMORY EVENT: save to mira_memories ──────────────────────────────────
    if body.memory_type:
        memory_doc = {
            "pet_id": body.pet_id,
            "user_id": user_email or "unknown",
            "memory_type": body.memory_type,
            "content": body.content or "",
            "mira_response": body.mira_response or "",
            "follow_up": body.follow_up or False,
            "follow_up_message": body.follow_up_message or "",
            "follow_up_shown": False,
            "resolved": False,
            "resolved_at": None,
            "created_at": body.created_at or now.isoformat(),
            "saved_at": now.isoformat(),
        }
        result = await db.mira_memories.insert_one(memory_doc)
        return {"ok": True, "memory_id": str(result.inserted_id), "memory_type": body.memory_type}

    # ── CONVERSATION MESSAGES: save to mira_conversations ────────────────────
    if not body.messages:
        return {"ok": True, "stored": 0}

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


# ── PATCH /api/mira/memory/{memory_id}/shown ────────────────────────────────

@mira_memory_router.patch("/api/mira/memory/{memory_id}/shown")
async def mark_memory_shown(
    memory_id: str,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Mark a follow-up memory as shown so it isn't surfaced again."""
    db = _get_db_from_app()
    if db is None:
        return {"ok": True}
    try:
        await db.mira_memories.update_one(
            {"_id": ObjectId(memory_id)},
            {"$set": {"follow_up_shown": True, "shown_at": datetime.now(timezone.utc).isoformat()}},
        )
    except Exception:
        pass
    return {"ok": True, "status": "shown"}


# ── PATCH /api/mira/memory/{memory_id}/resolved ─────────────────────────────

@mira_memory_router.patch("/api/mira/memory/{memory_id}/resolved")
async def resolve_memory(
    memory_id: str,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Mark a memory as resolved when user signals all is well."""
    db = _get_db_from_app()
    if db is None:
        return {"ok": True}
    try:
        await db.mira_memories.update_one(
            {"_id": ObjectId(memory_id)},
            {"$set": {
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
                "follow_up_shown": True,
            }},
        )
    except Exception:
        pass
    return {"ok": True, "status": "resolved"}


# ── POST /api/mira/memory/log-concierge-request ──────────────────────────────

@mira_memory_router.post("/api/mira/memory/log-concierge-request")
async def log_concierge_request(
    body: ConciergeRequestLog,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Log a Concierge request so Mira can reference it in future conversations."""
    db = _get_db_from_app()
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


# ── DELETE /api/mira/memory/{pet_id} ────────────────────────────────────────

@mira_memory_router.delete("/api/mira/memory/{pet_id}")
async def clear_mira_memory(
    pet_id: str,
    user_email: Optional[str] = Depends(_get_user_email),
):
    """Clear conversation history for a pet."""
    db = _get_db_from_app()
    if db is None:
        return {"ok": True}

    await db.mira_conversations.update_one(
        {"pet_id": pet_id},
        {"$set": {"messages": [], "last_updated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}
