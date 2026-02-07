"""
MIRA SESSION PERSISTENCE
========================
The memory that never forgets.

Every conversation is saved. Every turn is tracked.
Session survives refresh, close, come back tomorrow - Mira remembers.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/session", tags=["mira-session"])

# Database reference
_db = None

def set_session_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ============== MODELS ==============

class SessionMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[str] = None
    intent: Optional[str] = None
    execution_type: Optional[str] = None
    products: Optional[List[Dict]] = None
    step_id: Optional[str] = None

class CreateSessionRequest(BaseModel):
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    member_id: Optional[str] = None
    member_email: Optional[str] = None
    pillar: Optional[str] = None
    source: str = "mira-demo"

class AddMessageRequest(BaseModel):
    session_id: str
    message: SessionMessage

class SessionResponse(BaseModel):
    session_id: str
    messages: List[Dict]
    pet_context: Dict
    created_at: str
    updated_at: str
    status: str


# ============== CORE FUNCTIONS ==============

def generate_session_id() -> str:
    """Generate a unique, persistent session ID"""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:8]
    return f"mira-{today}-{unique}"


async def create_session(
    pet_id: str = None,
    pet_name: str = None,
    pet_breed: str = None,
    member_id: str = None,
    member_email: str = None,
    pillar: str = None,
    source: str = "mira-demo"
) -> str:
    """Create a new Mira session and store in database"""
    db = get_db()
    if db is None:
        logger.error("Database not available")
        return generate_session_id()  # Fallback to non-persistent
    
    session_id = generate_session_id()
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "session_id": session_id,
        "pet_id": pet_id,
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "member_id": member_id,
        "member_email": member_email,
        "pillar": pillar,
        "source": source,
        "messages": [],
        "conversation_state": {
            "current_intent": None,
            "clarification_step": 0,
            "products_shown": False,
            "concierge_engaged": False,
            "completed_steps": []
        },
        "context_summary": None,  # LLM-generated summary of conversation
        "extracted_memories": [],
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
    
    try:
        await db.mira_sessions.insert_one(session_doc)
        logger.info(f"[SESSION] Created new session: {session_id}")
        return session_id
    except Exception as e:
        logger.error(f"[SESSION] Failed to create session: {e}")
        return session_id


async def get_session(session_id: str) -> Optional[Dict]:
    """Get a session by ID"""
    db = get_db()
    if db is None:
        return None
    
    try:
        session = await db.mira_sessions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        return session
    except Exception as e:
        logger.error(f"[SESSION] Failed to get session {session_id}: {e}")
        return None


async def add_message_to_session(
    session_id: str,
    role: str,
    content: str,
    intent: str = None,
    execution_type: str = None,
    products: List[Dict] = None,
    step_id: str = None,
    extra_data: Dict = None
) -> bool:
    """Add a message to an existing session"""
    db = get_db()
    if db is None:
        return False
    
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "role": role,
        "content": content,
        "timestamp": now,
        "intent": intent,
        "execution_type": execution_type,
        "products": products,
        "step_id": step_id
    }
    
    if extra_data:
        message.update(extra_data)
    
    try:
        result = await db.mira_sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": now}
            }
        )
        
        if result.modified_count == 0:
            # Session doesn't exist, create it
            logger.warning(f"[SESSION] Session {session_id} not found, creating new")
            await db.mira_sessions.insert_one({
                "session_id": session_id,
                "messages": [message],
                "status": "active",
                "created_at": now,
                "updated_at": now
            })
        
        logger.info(f"[SESSION] Added {role} message to {session_id}")
        return True
    except Exception as e:
        logger.error(f"[SESSION] Failed to add message: {e}")
        return False


async def update_session_state(
    session_id: str,
    current_intent: str = None,
    clarification_step: int = None,
    products_shown: bool = None,
    concierge_engaged: bool = None,
    completed_step: str = None
) -> bool:
    """Update the conversation state of a session"""
    db = get_db()
    if db is None:
        return False
    
    now = datetime.now(timezone.utc).isoformat()
    update_doc = {"updated_at": now}
    
    if current_intent is not None:
        update_doc["conversation_state.current_intent"] = current_intent
    if clarification_step is not None:
        update_doc["conversation_state.clarification_step"] = clarification_step
    if products_shown is not None:
        update_doc["conversation_state.products_shown"] = products_shown
    if concierge_engaged is not None:
        update_doc["conversation_state.concierge_engaged"] = concierge_engaged
    
    try:
        update_ops = {"$set": update_doc}
        if completed_step:
            update_ops["$addToSet"] = {"conversation_state.completed_steps": completed_step}
        
        await db.mira_sessions.update_one(
            {"session_id": session_id},
            update_ops
        )
        return True
    except Exception as e:
        logger.error(f"[SESSION] Failed to update state: {e}")
        return False


async def get_session_messages(session_id: str, limit: int = 20) -> List[Dict]:
    """Get messages from a session for LLM context"""
    session = await get_session(session_id)
    if not session:
        return []
    
    messages = session.get("messages", [])
    # Return last N messages
    return messages[-limit:] if len(messages) > limit else messages


async def get_full_session_context(session_id: str) -> Dict:
    """Get full session context for LLM, including state and memories"""
    db = get_db()
    session = await get_session(session_id)
    
    if not session:
        return {
            "messages": [],
            "state": {},
            "memories": [],
            "pet_context": {}
        }
    
    # Get pet context if available
    pet_context = {}
    if session.get("pet_id"):
        try:
            pet = await db.pets.find_one(
                {"id": session["pet_id"]},
                {"_id": 0, "name": 1, "breed": 1, "age": 1, "doggy_soul_answers": 1}
            )
            if pet:
                pet_context = pet
        except:
            pass
    
    # Get relevant memories
    memories = []
    if session.get("member_id") or session.get("member_email"):
        try:
            member_query = {"member_id": session.get("member_id")} if session.get("member_id") else {"member_id": session.get("member_email")}
            cursor = db.mira_memories.find(
                member_query,
                {"_id": 0}
            ).sort("created_at", -1).limit(10)
            memories = await cursor.to_list(length=10)
        except:
            pass
    
    return {
        "messages": session.get("messages", []),
        "state": session.get("conversation_state", {}),
        "memories": memories,
        "pet_context": pet_context,
        "context_summary": session.get("context_summary")
    }


# ============== API ROUTES ==============

@router.post("/create")
async def api_create_session(request: CreateSessionRequest):
    """Create a new Mira session"""
    session_id = await create_session(
        pet_id=request.pet_id,
        pet_name=request.pet_name,
        pet_breed=request.pet_breed,
        member_id=request.member_id,
        member_email=request.member_email,
        pillar=request.pillar,
        source=request.source
    )
    
    return {
        "session_id": session_id,
        "status": "created",
        "message": "Session created successfully"
    }


@router.get("/{session_id}")
async def api_get_session(session_id: str):
    """Get a session by ID"""
    session = await get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.get("/{session_id}/messages")
async def api_get_messages(session_id: str, limit: int = 20):
    """Get messages from a session"""
    messages = await get_session_messages(session_id, limit)
    return {"session_id": session_id, "messages": messages, "count": len(messages)}


@router.get("/{session_id}/context")
async def api_get_context(session_id: str):
    """Get full session context for LLM"""
    context = await get_full_session_context(session_id)
    return context


@router.post("/{session_id}/message")
async def api_add_message(session_id: str, request: AddMessageRequest):
    """Add a message to a session"""
    success = await add_message_to_session(
        session_id=session_id,
        role=request.message.role,
        content=request.message.content,
        intent=request.message.intent,
        execution_type=request.message.execution_type,
        products=request.message.products,
        step_id=request.message.step_id
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add message")
    
    return {"status": "added", "session_id": session_id}


@router.post("/{session_id}/close")
async def api_close_session(session_id: str):
    """Mark a session as closed"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.mira_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "closed", "closed_at": now, "updated_at": now}}
    )
    
    return {"status": "closed", "session_id": session_id}
