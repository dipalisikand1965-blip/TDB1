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
    extra_data: Dict = None,
    member_id: str = None,
    pet_id: str = None,
    pet_name: str = None
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
    
    # Check if this message makes the session "important" (never delete)
    important_intents = ["purchase", "booking", "order", "buy", "book_appointment", "schedule"]
    is_important = (
        intent and any(imp in intent.lower() for imp in important_intents)
    ) or (
        execution_type and execution_type in ["complete_purchase", "confirm_booking", "place_order"]
    )
    
    try:
        update_doc = {
            "$push": {"messages": message},
            "$set": {"updated_at": now}
        }
        
        # Mark as important if needed
        if is_important:
            update_doc["$set"]["retention_status"] = "important"
            update_doc["$set"]["important_reason"] = f"Contains {intent or execution_type}"
            update_doc["$set"]["has_purchase"] = True if "purchase" in str(intent).lower() or "order" in str(intent).lower() else None
            update_doc["$set"]["has_booking"] = True if "book" in str(intent).lower() else None
        
        result = await db.mira_sessions.update_one(
            {"session_id": session_id},
            update_doc
        )
        
        if result.modified_count == 0:
            # Session doesn't exist, create it with member and pet info
            logger.warning(f"[SESSION] Session {session_id} not found, creating new")
            new_session = {
                "session_id": session_id,
                "member_id": member_id or "demo",
                "pet_id": pet_id,
                "pet_name": pet_name,
                "messages": [message],
                "status": "active",
                "created_at": now,
                "updated_at": now,
                "preview": content[:50] if content else "New conversation"
            }
            await db.mira_sessions.insert_one(new_session)
        
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


async def update_conversation_state(session_id: str, state: Dict) -> bool:
    """
    Update the full conversation state for multi-turn flow continuity.
    
    State structure:
    {
        "original_intent": str,     # What user originally asked (e.g., "meal_plan")
        "awaiting_response": str,   # What we're waiting for (e.g., "dietary_needs")
        "pending_action": str,      # Next action to take when user responds
        "context_data": dict        # Any additional context needed
    }
    """
    db = get_db()
    if db is None:
        logger.warning("[CONV STATE] Database not available")
        return False
    
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        result = await db.mira_sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "conversation_state": state,
                    "updated_at": now
                }
            },
            upsert=True
        )
        logger.info(f"[CONV STATE] Updated state for {session_id}: intent={state.get('original_intent')}, awaiting={state.get('awaiting_response')}")
        return True
    except Exception as e:
        logger.error(f"[CONV STATE] Failed to update: {e}")
        return False


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


# ============== MULTI-SESSION MANAGEMENT ==============

@router.get("/list/by-member/{member_id}")
async def api_list_sessions_by_member(member_id: str, limit: int = 20, skip: int = 0):
    """
    List all sessions for a member (user) - for "Past Chats" feature.
    Returns sessions grouped by date with preview of first message.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Find sessions for this member, sorted by most recent first
        cursor = db.mira_sessions.find(
            {"$or": [{"member_id": member_id}, {"member_email": member_id}]},
            {"_id": 0, "session_id": 1, "pet_id": 1, "pet_name": 1, "pet_breed": 1,
             "created_at": 1, "updated_at": 1, "status": 1, "messages": {"$slice": 1}}
        ).sort("updated_at", -1).skip(skip).limit(limit)
        
        sessions = await cursor.to_list(length=limit)
        
        # Format for frontend
        formatted = []
        for s in sessions:
            first_message = s.get("messages", [{}])[0] if s.get("messages") else {}
            formatted.append({
                "session_id": s.get("session_id"),
                "pet_id": s.get("pet_id"),
                "pet_name": s.get("pet_name", "Unknown Pet"),
                "pet_breed": s.get("pet_breed", ""),
                "created_at": s.get("created_at"),
                "updated_at": s.get("updated_at"),
                "status": s.get("status", "active"),
                "preview": first_message.get("content", "")[:100] if first_message else "Empty conversation"
            })
        
        # Get total count
        total = await db.mira_sessions.count_documents(
            {"$or": [{"member_id": member_id}, {"member_email": member_id}]}
        )
        
        return {
            "sessions": formatted,
            "total": total,
            "has_more": total > skip + limit
        }
    except Exception as e:
        logger.error(f"[SESSION] Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list/by-pet/{pet_id}")
async def api_list_sessions_by_pet(pet_id: str, limit: int = 10, skip: int = 0):
    """
    List all sessions for a specific pet - for Multi-Pet feature.
    Returns sessions for this pet only.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        cursor = db.mira_sessions.find(
            {"pet_id": pet_id},
            {"_id": 0, "session_id": 1, "pet_name": 1, "pet_breed": 1,
             "created_at": 1, "updated_at": 1, "status": 1, "messages": {"$slice": 1}}
        ).sort("updated_at", -1).skip(skip).limit(limit)
        
        sessions = await cursor.to_list(length=limit)
        
        formatted = []
        for s in sessions:
            first_message = s.get("messages", [{}])[0] if s.get("messages") else {}
            formatted.append({
                "session_id": s.get("session_id"),
                "pet_name": s.get("pet_name", "Unknown Pet"),
                "pet_breed": s.get("pet_breed", ""),
                "created_at": s.get("created_at"),
                "updated_at": s.get("updated_at"),
                "status": s.get("status", "active"),
                "preview": first_message.get("content", "")[:100] if first_message else "Empty conversation"
            })
        
        total = await db.mira_sessions.count_documents({"pet_id": pet_id})
        
        return {
            "sessions": formatted,
            "total": total,
            "pet_id": pet_id,
            "has_more": total > skip + limit
        }
    except Exception as e:
        logger.error(f"[SESSION] Failed to list pet sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest/by-pet/{pet_id}")
async def api_get_latest_session_by_pet(pet_id: str):
    """
    Get the most recent active session for a pet.
    Used when switching pets - load their latest conversation.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Find most recent active session for this pet
        session = await db.mira_sessions.find_one(
            {"pet_id": pet_id, "status": "active"},
            {"_id": 0},
            sort=[("updated_at", -1)]
        )
        
        if not session:
            return {"session": None, "message": "No active session for this pet"}
        
        return {
            "session": session,
            "session_id": session.get("session_id"),
            "message_count": len(session.get("messages", []))
        }
    except Exception as e:
        logger.error(f"[SESSION] Failed to get latest pet session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/switch-pet")
async def api_switch_pet(pet_id: str, pet_name: str, pet_breed: str = None, 
                         member_id: str = None, member_email: str = None):
    """
    Switch to a different pet - either loads their latest session or creates new one.
    This is the main endpoint for multi-pet support.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # First, try to find an active session for this pet
        existing = await db.mira_sessions.find_one(
            {"pet_id": pet_id, "status": "active"},
            {"_id": 0},
            sort=[("updated_at", -1)]
        )
        
        if existing:
            # Return existing session
            return {
                "session_id": existing.get("session_id"),
                "is_new": False,
                "message_count": len(existing.get("messages", [])),
                "pet_name": existing.get("pet_name", pet_name),
                "messages": existing.get("messages", [])
            }
        
        # No existing session - create new one
        session_id = await create_session(
            pet_id=pet_id,
            pet_name=pet_name,
            pet_breed=pet_breed,
            member_id=member_id,
            member_email=member_email,
            source="pet-switch"
        )
        
        return {
            "session_id": session_id,
            "is_new": True,
            "message_count": 0,
            "pet_name": pet_name,
            "messages": []
        }
    except Exception as e:
        logger.error(f"[SESSION] Failed to switch pet: {e}")
        raise HTTPException(status_code=500, detail=str(e))
