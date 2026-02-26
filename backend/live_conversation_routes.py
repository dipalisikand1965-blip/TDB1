"""
Live Conversation Threads - Real-time Service Desk Thread System
================================================================

When a user starts ANY conversation with Mira, a thread is silently created in the background.
Every message (user + Mira) flows into this thread in real-time.
The Concierge/Admin can see ALL active conversations and jump in when needed.

Flow:
User Request → Service Desk Thread → Admin Notification → Member Notification → Pillar Request → Tickets → Channel Intakes

Collections:
- live_conversation_threads: Stores all conversation threads
- admin_notifications: Notifies admin of new conversations

API Endpoints:
- POST /api/live_threads/start - Start a new thread (called on first message)
- POST /api/live_threads/append - Append message to thread
- GET /api/live_threads/active - Get all active threads (admin)
- GET /api/live_threads/{thread_id} - Get thread details
- POST /api/live_threads/{thread_id}/reply - Concierge reply to thread
- POST /api/live_threads/{thread_id}/close - Close thread
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPBasicCredentials, HTTPBasic
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging
import os
import jwt

logger = logging.getLogger(__name__)

# Router
live_threads_router = APIRouter(prefix="/api/live_threads", tags=["live-threads"])

security = HTTPBasic(auto_error=False)
security_bearer = HTTPBearer(auto_error=False)

# Database reference
_db = None

def set_live_threads_db(db):
    global _db
    _db = db
    logger.info("Live Conversation Threads DB initialized")

def get_db():
    if _db is None:
        from server import db
        return db
    return _db

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"

# Admin credentials from env
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aditya")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "lola4304")

def verify_admin(credentials: HTTPBasicCredentials):
    """Verify admin credentials"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return True


# ============================================
# MODELS
# ============================================

class StartThreadRequest(BaseModel):
    """Request to start a new conversation thread"""
    session_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    initial_message: str
    source: str = "mira_demo"  # mira_demo, mira_os, widget, etc.
    pillar: Optional[str] = "general"
    user_city: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None


class AppendMessageRequest(BaseModel):
    """Request to append a message to thread"""
    thread_id: str
    sender: str  # "user" or "mira" or "concierge"
    content: str
    metadata: Optional[Dict[str, Any]] = None  # For chips_offered, products_shown, etc.


class ConciergeReplyRequest(BaseModel):
    """Request for concierge to reply to thread"""
    message: str
    agent_name: Optional[str] = "Concierge"
    notify_user: bool = True


class ThreadResponse(BaseModel):
    """Response model for thread"""
    thread_id: str
    status: str
    created_at: str
    is_new: bool = True


# ============================================
# HELPER FUNCTIONS
# ============================================

async def generate_thread_id() -> str:
    """Generate unique thread ID"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    unique = uuid.uuid4().hex[:8].upper()
    return f"LT-{timestamp}-{unique}"


async def create_admin_notification(
    thread_id: str,
    user_name: str,
    pet_name: str,
    message_preview: str,
    notification_type: str = "new_conversation"
):
    """Create admin notification for new conversation"""
    db = get_db()
    
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:12]}",
        "type": notification_type,
        "category": "conversation",
        "title": f"New conversation: {user_name or 'Guest'}" + (f" about {pet_name}" if pet_name else ""),
        "message": message_preview[:100] + "..." if len(message_preview) > 100 else message_preview,
        "thread_id": thread_id,
        "user_name": user_name,
        "pet_name": pet_name,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "action_url": f"/admin?tab=service-desk&thread={thread_id}",
        "priority": "normal"
    }
    
    await db.admin_notifications.insert_one(notification)
    logger.info(f"[LIVE_THREADS] Admin notification created for thread: {thread_id}")
    return notification["id"]


async def update_thread_stats(thread_id: str):
    """Update thread statistics"""
    db = get_db()
    
    thread = await db.live_conversation_threads.find_one({"thread_id": thread_id})
    if not thread:
        return
    
    messages = thread.get("messages", [])
    user_messages = [m for m in messages if m.get("sender") == "user"]
    mira_messages = [m for m in messages if m.get("sender") == "mira"]
    concierge_messages = [m for m in messages if m.get("sender") == "concierge"]
    
    stats = {
        "total_messages": len(messages),
        "user_messages": len(user_messages),
        "mira_messages": len(mira_messages),
        "concierge_messages": len(concierge_messages),
        "has_concierge_interaction": len(concierge_messages) > 0,
        "last_activity": datetime.now(timezone.utc).isoformat()
    }
    
    await db.live_conversation_threads.update_one(
        {"thread_id": thread_id},
        {"$set": {"stats": stats, "updated_at": stats["last_activity"]}}
    )


# ============================================
# API ENDPOINTS
# ============================================

@live_threads_router.post("/start", response_model=ThreadResponse)
async def start_thread(request: StartThreadRequest):
    """
    Start a new conversation thread.
    Called when user sends their FIRST message in a session.
    
    Creates thread silently - user doesn't know.
    Admin gets notified via admin_notifications.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Check if thread already exists for this session
    existing = await db.live_conversation_threads.find_one({
        "session_id": request.session_id,
        "status": {"$in": ["active", "pending"]}
    })
    
    if existing:
        # Thread exists - just return it
        return ThreadResponse(
            thread_id=existing["thread_id"],
            status=existing["status"],
            created_at=existing["created_at"],
            is_new=False
        )
    
    # Create new thread
    thread_id = await generate_thread_id()
    
    thread_doc = {
        "thread_id": thread_id,
        "session_id": request.session_id,
        
        # User info
        "user_id": request.user_id,
        "user_email": request.user_email,
        "user_name": request.user_name,
        
        # Pet info
        "pet_id": request.pet_id,
        "pet_name": request.pet_name,
        "pet_breed": request.pet_breed,
        
        # Context
        "source": request.source,
        "pillar": request.pillar or "general",
        "user_city": request.user_city,
        "device_info": request.device_info,
        
        # Status
        "status": "active",  # active, pending_concierge, with_concierge, closed
        "concierge_assigned": None,
        "concierge_joined_at": None,
        
        # Messages array - starts with first message
        "messages": [
            {
                "id": f"msg-{uuid.uuid4().hex[:8]}",
                "sender": "user",
                "content": request.initial_message,
                "timestamp": now.isoformat(),
                "metadata": {}
            }
        ],
        
        # Stats
        "stats": {
            "total_messages": 1,
            "user_messages": 1,
            "mira_messages": 0,
            "concierge_messages": 0,
            "has_concierge_interaction": False,
            "last_activity": now.isoformat()
        },
        
        # Timestamps
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.live_conversation_threads.insert_one(thread_doc)
    
    # Create admin notification
    await create_admin_notification(
        thread_id=thread_id,
        user_name=request.user_name,
        pet_name=request.pet_name,
        message_preview=request.initial_message,
        notification_type="new_conversation"
    )
    
    logger.info(f"[LIVE_THREADS] New thread created: {thread_id} for session: {request.session_id}")
    
    return ThreadResponse(
        thread_id=thread_id,
        status="active",
        created_at=now.isoformat(),
        is_new=True
    )


@live_threads_router.post("/append")
async def append_message(request: AppendMessageRequest):
    """
    Append a message to the thread.
    Called for EVERY message - user, Mira, or Concierge.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Find thread
    thread = await db.live_conversation_threads.find_one({"thread_id": request.thread_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Create message document
    message_doc = {
        "id": f"msg-{uuid.uuid4().hex[:8]}",
        "sender": request.sender,
        "content": request.content,
        "timestamp": now.isoformat(),
        "metadata": request.metadata or {}
    }
    
    # Append to messages array
    await db.live_conversation_threads.update_one(
        {"thread_id": request.thread_id},
        {
            "$push": {"messages": message_doc},
            "$set": {"updated_at": now.isoformat()}
        }
    )
    
    # Update stats
    await update_thread_stats(request.thread_id)
    
    # If concierge is replying for first time, update status
    if request.sender == "concierge":
        await db.live_conversation_threads.update_one(
            {"thread_id": request.thread_id, "concierge_joined_at": None},
            {
                "$set": {
                    "status": "with_concierge",
                    "concierge_joined_at": now.isoformat()
                }
            }
        )
    
    logger.info(f"[LIVE_THREADS] Message appended to {request.thread_id} from {request.sender}")
    
    return {
        "success": True,
        "message_id": message_doc["id"],
        "timestamp": now.isoformat()
    }


@live_threads_router.get("/active")
async def get_active_threads(
    limit: int = Query(50, description="Number of threads to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source: Optional[str] = Query(None, description="Filter by source"),
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Get all active conversation threads.
    Admin only endpoint.
    """
    verify_admin(credentials)
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["active", "pending_concierge", "with_concierge"]}
    
    if source:
        query["source"] = source
    
    # Get threads sorted by last activity
    threads = await db.live_conversation_threads.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).limit(limit).to_list(limit)
    
    # Get counts by status
    status_counts = {}
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    async for doc in db.live_conversation_threads.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]
    
    # Calculate active conversation count
    active_count = await db.live_conversation_threads.count_documents({
        "status": {"$in": ["active", "pending_concierge", "with_concierge"]}
    })
    
    return {
        "threads": threads,
        "total": len(threads),
        "active_count": active_count,
        "status_counts": status_counts
    }


@live_threads_router.get("/{thread_id}")
async def get_thread_details(
    thread_id: str,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Get full thread details including all messages.
    Admin only endpoint.
    """
    verify_admin(credentials)
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    thread = await db.live_conversation_threads.find_one(
        {"thread_id": thread_id},
        {"_id": 0}
    )
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Get user details if user_id exists
    user_details = None
    if thread.get("user_id"):
        user = await db.users.find_one(
            {"id": thread["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        user_details = user
    
    # Get pet details if pet_id exists
    pet_details = None
    if thread.get("pet_id"):
        pet = await db.pets.find_one(
            {"id": thread["pet_id"]},
            {"_id": 0}
        )
        pet_details = pet
    
    return {
        "thread": thread,
        "user_details": user_details,
        "pet_details": pet_details,
        "message_count": len(thread.get("messages", []))
    }


@live_threads_router.post("/{thread_id}/reply")
async def concierge_reply(
    thread_id: str,
    request: ConciergeReplyRequest,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Concierge replies to a thread.
    This allows the admin to "jump in" and respond as human.
    """
    verify_admin(credentials)
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    # Find thread
    thread = await db.live_conversation_threads.find_one({"thread_id": thread_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Create message document
    message_doc = {
        "id": f"msg-{uuid.uuid4().hex[:8]}",
        "sender": "concierge",
        "content": request.message,
        "timestamp": now.isoformat(),
        "metadata": {
            "agent_name": request.agent_name,
            "is_human": True
        }
    }
    
    # Update thread
    update_fields = {
        "updated_at": now.isoformat(),
        "status": "with_concierge"
    }
    
    # Set concierge_assigned if not already set
    if not thread.get("concierge_assigned"):
        update_fields["concierge_assigned"] = request.agent_name
        update_fields["concierge_joined_at"] = now.isoformat()
    
    await db.live_conversation_threads.update_one(
        {"thread_id": thread_id},
        {
            "$push": {"messages": message_doc},
            "$set": update_fields
        }
    )
    
    # Update stats
    await update_thread_stats(thread_id)
    
    # Optionally notify user (via member notification)
    if request.notify_user and thread.get("user_id"):
        user_notif = {
            "id": f"notif-{uuid.uuid4().hex[:12]}",
            "user_id": thread["user_id"],
            "type": "concierge_reply",
            "title": f"Your Concierge® has responded",
            "message": request.message[:100] + "..." if len(request.message) > 100 else request.message,
            "thread_id": thread_id,
            "read": False,
            "created_at": now.isoformat()
        }
        await db.member_notifications.insert_one(user_notif)
    
    logger.info(f"[LIVE_THREADS] Concierge replied to thread: {thread_id}")
    
    return {
        "success": True,
        "message_id": message_doc["id"],
        "timestamp": now.isoformat(),
        "status": "with_concierge"
    }


@live_threads_router.post("/{thread_id}/close")
async def close_thread(
    thread_id: str,
    resolution: Optional[str] = None,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Close a conversation thread.
    """
    verify_admin(credentials)
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    
    result = await db.live_conversation_threads.update_one(
        {"thread_id": thread_id},
        {
            "$set": {
                "status": "closed",
                "closed_at": now.isoformat(),
                "resolution": resolution,
                "updated_at": now.isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    logger.info(f"[LIVE_THREADS] Thread closed: {thread_id}")
    
    return {
        "success": True,
        "thread_id": thread_id,
        "status": "closed"
    }


@live_threads_router.get("/stats/overview")
async def get_threads_overview(
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Get overview statistics for live threads.
    """
    verify_admin(credentials)
    
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total active threads
    active_count = await db.live_conversation_threads.count_documents({
        "status": {"$in": ["active", "pending_concierge", "with_concierge"]}
    })
    
    # Threads needing attention (active without concierge for > 5 min)
    five_min_ago = (now - timedelta(minutes=5)).isoformat()
    needing_attention = await db.live_conversation_threads.count_documents({
        "status": "active",
        "concierge_joined_at": None,
        "created_at": {"$lt": five_min_ago}
    })
    
    # Today's new threads
    today_new = await db.live_conversation_threads.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Total closed today
    today_closed = await db.live_conversation_threads.count_documents({
        "status": "closed",
        "closed_at": {"$gte": today_start.isoformat()}
    })
    
    # Threads by source
    source_pipeline = [
        {"$match": {"status": {"$in": ["active", "pending_concierge", "with_concierge"]}}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    source_counts = {}
    async for doc in db.live_conversation_threads.aggregate(source_pipeline):
        source_counts[doc["_id"] or "unknown"] = doc["count"]
    
    return {
        "active_threads": active_count,
        "needing_attention": needing_attention,
        "today_new": today_new,
        "today_closed": today_closed,
        "by_source": source_counts,
        "timestamp": now.isoformat()
    }


# ============================================
# HELPER: Get or Create Thread for Session
# ============================================

async def get_or_create_thread_for_session(
    session_id: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    pet_id: Optional[str] = None,
    pet_name: Optional[str] = None,
    pet_breed: Optional[str] = None,
    initial_message: str = "",
    source: str = "mira_demo",
    pillar: str = "general",
    user_city: Optional[str] = None
) -> str:
    """
    Helper function to get or create a thread for a session.
    Returns thread_id.
    
    Call this from useChatSubmit flow.
    """
    db = get_db()
    if db is None:
        logger.error("[LIVE_THREADS] Database not available")
        return None
    
    # Check for existing thread
    existing = await db.live_conversation_threads.find_one({
        "session_id": session_id,
        "status": {"$in": ["active", "pending_concierge", "with_concierge"]}
    })
    
    if existing:
        return existing["thread_id"]
    
    # Create new thread
    now = datetime.now(timezone.utc)
    thread_id = await generate_thread_id()
    
    thread_doc = {
        "thread_id": thread_id,
        "session_id": session_id,
        "user_id": user_id,
        "user_email": user_email,
        "user_name": user_name,
        "pet_id": pet_id,
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "source": source,
        "pillar": pillar,
        "user_city": user_city,
        "status": "active",
        "concierge_assigned": None,
        "concierge_joined_at": None,
        "messages": [
            {
                "id": f"msg-{uuid.uuid4().hex[:8]}",
                "sender": "user",
                "content": initial_message,
                "timestamp": now.isoformat(),
                "metadata": {}
            }
        ] if initial_message else [],
        "stats": {
            "total_messages": 1 if initial_message else 0,
            "user_messages": 1 if initial_message else 0,
            "mira_messages": 0,
            "concierge_messages": 0,
            "has_concierge_interaction": False,
            "last_activity": now.isoformat()
        },
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.live_conversation_threads.insert_one(thread_doc)
    
    # Create admin notification
    if initial_message:
        await create_admin_notification(
            thread_id=thread_id,
            user_name=user_name,
            pet_name=pet_name,
            message_preview=initial_message,
            notification_type="new_conversation"
        )
    
    logger.info(f"[LIVE_THREADS] Created thread: {thread_id} for session: {session_id}")
    
    return thread_id


async def append_to_thread(
    thread_id: str,
    sender: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Helper to append message to thread.
    Call this after every Mira response.
    """
    db = get_db()
    if db is None or not thread_id:
        return
    
    now = datetime.now(timezone.utc)
    
    message_doc = {
        "id": f"msg-{uuid.uuid4().hex[:8]}",
        "sender": sender,
        "content": content,
        "timestamp": now.isoformat(),
        "metadata": metadata or {}
    }
    
    await db.live_conversation_threads.update_one(
        {"thread_id": thread_id},
        {
            "$push": {"messages": message_doc},
            "$set": {"updated_at": now.isoformat()}
        }
    )
    
    # Update stats
    await update_thread_stats(thread_id)
