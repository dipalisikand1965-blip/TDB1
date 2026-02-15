"""
Golden Standard Real-Time Concierge Communication System
=========================================================

Features:
1. Real-time message sync (WebSockets)
2. Message delivery states (Sending → Sent → Delivered → Read)
3. Retry mechanism with visual feedback
4. Offline queue support
5. Guaranteed message ordering
6. Typing indicators
7. Read receipts (✓✓)
8. Unread badge count
9. Connection status indicator
10. Sound/visual notifications

Two flows:
- User → Admin → User (user-initiated)
- Admin → User → Admin (admin-initiated)
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import logging
import uuid
import json
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/concierge/realtime", tags=["Concierge Realtime"])

# Database reference
db = None

def set_realtime_db(database):
    """Set database reference"""
    global db
    db = database
    logger.info("Real-time concierge routes initialized")


# =============================================================================
# ENUMS & MODELS
# =============================================================================

class MessageStatus(str, Enum):
    SENDING = "sending"      # Client is sending
    SENT = "sent"            # Server received
    DELIVERED = "delivered"  # Recipient's client received
    READ = "read"            # Recipient opened/viewed
    FAILED = "failed"        # Send failed


class MessageSource(str, Enum):
    USER = "user"
    SERVICE_DESK = "service_desk"
    SYSTEM = "system"


class SendMessageRequest(BaseModel):
    """Request to send a message"""
    thread_id: str
    content: str
    temp_id: Optional[str] = None  # Client-side temporary ID for optimistic updates
    attachments: Optional[List[Dict[str, Any]]] = None


class MarkReadRequest(BaseModel):
    """Mark messages as read"""
    thread_id: str
    message_ids: List[str]


class TypingIndicatorRequest(BaseModel):
    """Typing indicator update"""
    thread_id: str
    is_typing: bool


class AdminInitiateRequest(BaseModel):
    """Admin initiates a new conversation with a user"""
    user_id: str
    pet_id: Optional[str] = None
    subject: str
    initial_message: str


# =============================================================================
# CONNECTION MANAGER - WebSocket connections for real-time updates
# =============================================================================

class ConnectionManager:
    """Manages WebSocket connections for users and admins"""
    
    def __init__(self):
        # user_id -> List[WebSocket] (user can have multiple tabs)
        self.user_connections: Dict[str, List[WebSocket]] = {}
        # Admin connections (service desk staff)
        self.admin_connections: List[WebSocket] = []
        # Track who's typing: thread_id -> Set[user_id/admin_id]
        self.typing_users: Dict[str, Set[str]] = {}
        # Track online users for connection status
        self.online_users: Set[str] = set()
        self.online_admins: int = 0
    
    async def connect_user(self, websocket: WebSocket, user_id: str):
        """Connect a user WebSocket"""
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
        self.online_users.add(user_id)
        logger.info(f"[WS] User {user_id} connected. Total connections: {len(self.user_connections.get(user_id, []))}")
    
    async def connect_admin(self, websocket: WebSocket):
        """Connect an admin WebSocket"""
        await websocket.accept()
        self.admin_connections.append(websocket)
        self.online_admins += 1
        logger.info(f"[WS] Admin connected. Total admins: {self.online_admins}")
    
    def disconnect_user(self, websocket: WebSocket, user_id: str):
        """Disconnect a user WebSocket"""
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                self.online_users.discard(user_id)
        logger.info(f"[WS] User {user_id} disconnected")
    
    def disconnect_admin(self, websocket: WebSocket):
        """Disconnect an admin WebSocket"""
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
            self.online_admins = max(0, self.online_admins - 1)
        logger.info(f"[WS] Admin disconnected. Remaining: {self.online_admins}")
    
    async def send_to_user(self, user_id: str, message: dict) -> bool:
        """Send message to a specific user (all their connections)"""
        if user_id not in self.user_connections:
            return False
        
        sent = False
        dead_connections = []
        for ws in self.user_connections[user_id]:
            try:
                await ws.send_json(message)
                sent = True
            except Exception as e:
                logger.warning(f"[WS] Failed to send to user {user_id}: {e}")
                dead_connections.append(ws)
        
        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect_user(ws, user_id)
        
        return sent
    
    async def broadcast_to_admins(self, message: dict):
        """Broadcast message to all admin connections"""
        dead_connections = []
        for ws in self.admin_connections:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"[WS] Failed to send to admin: {e}")
                dead_connections.append(ws)
        
        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect_admin(ws)
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is online"""
        return user_id in self.online_users
    
    def is_any_admin_online(self) -> bool:
        """Check if any admin is online"""
        return self.online_admins > 0
    
    def set_typing(self, thread_id: str, sender_id: str, is_typing: bool):
        """Update typing status"""
        if thread_id not in self.typing_users:
            self.typing_users[thread_id] = set()
        
        if is_typing:
            self.typing_users[thread_id].add(sender_id)
        else:
            self.typing_users[thread_id].discard(sender_id)
    
    def get_typing_users(self, thread_id: str) -> Set[str]:
        """Get users currently typing in a thread"""
        return self.typing_users.get(thread_id, set())


# Global connection manager
manager = ConnectionManager()


# =============================================================================
# WEBSOCKET ENDPOINTS
# =============================================================================

@router.websocket("/ws/user/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for user connections.
    Handles: new messages, typing indicators, read receipts, connection status
    """
    await manager.connect_user(websocket, user_id)
    
    try:
        # Send connection confirmation with current status
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "admin_online": manager.is_any_admin_online(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify admins that user came online
        await manager.broadcast_to_admins({
            "type": "user_online",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            await handle_user_message(websocket, user_id, data)
            
    except WebSocketDisconnect:
        manager.disconnect_user(websocket, user_id)
        # Notify admins that user went offline
        await manager.broadcast_to_admins({
            "type": "user_offline",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"[WS] User WebSocket error: {e}")
        manager.disconnect_user(websocket, user_id)


@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for admin (service desk) connections.
    """
    await manager.connect_admin(websocket)
    
    try:
        # Send connection confirmation with online users
        await websocket.send_json({
            "type": "connected",
            "role": "admin",
            "online_users": list(manager.online_users),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify all connected users that admin is online
        for user_id in manager.online_users:
            await manager.send_to_user(user_id, {
                "type": "admin_online",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        while True:
            data = await websocket.receive_json()
            await handle_admin_message(websocket, data)
            
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
        # Notify users if no admin online
        if not manager.is_any_admin_online():
            for user_id in manager.online_users:
                await manager.send_to_user(user_id, {
                    "type": "admin_offline",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    except Exception as e:
        logger.error(f"[WS] Admin WebSocket error: {e}")
        manager.disconnect_admin(websocket)


async def handle_user_message(websocket: WebSocket, user_id: str, data: dict):
    """Handle incoming messages from user WebSocket"""
    msg_type = data.get("type")
    
    if msg_type == "ping":
        # Keep-alive ping
        await websocket.send_json({"type": "pong"})
    
    elif msg_type == "typing":
        # User is typing
        thread_id = data.get("thread_id")
        is_typing = data.get("is_typing", False)
        manager.set_typing(thread_id, user_id, is_typing)
        
        # Notify admins
        await manager.broadcast_to_admins({
            "type": "typing_indicator",
            "thread_id": thread_id,
            "user_id": user_id,
            "is_typing": is_typing
        })
    
    elif msg_type == "mark_read":
        # User read messages
        thread_id = data.get("thread_id")
        message_ids = data.get("message_ids", [])
        await mark_messages_read(thread_id, message_ids, "user", user_id)
        
        # Notify admins
        await manager.broadcast_to_admins({
            "type": "messages_read",
            "thread_id": thread_id,
            "message_ids": message_ids,
            "read_by": user_id
        })
    
    elif msg_type == "send_message":
        # User sending a message
        await process_user_message(user_id, data)


async def handle_admin_message(websocket: WebSocket, data: dict):
    """Handle incoming messages from admin WebSocket"""
    msg_type = data.get("type")
    
    if msg_type == "ping":
        await websocket.send_json({"type": "pong"})
    
    elif msg_type == "typing":
        thread_id = data.get("thread_id")
        is_typing = data.get("is_typing", False)
        manager.set_typing(thread_id, "admin", is_typing)
        
        # Get the thread to find the user
        thread = await db.concierge_threads.find_one({"id": thread_id})
        if thread:
            await manager.send_to_user(thread["user_id"], {
                "type": "typing_indicator",
                "thread_id": thread_id,
                "sender": "service_desk",
                "is_typing": is_typing
            })
    
    elif msg_type == "mark_read":
        thread_id = data.get("thread_id")
        message_ids = data.get("message_ids", [])
        await mark_messages_read(thread_id, message_ids, "admin", "service_desk")
        
        # Notify user
        thread = await db.concierge_threads.find_one({"id": thread_id})
        if thread:
            await manager.send_to_user(thread["user_id"], {
                "type": "messages_read",
                "thread_id": thread_id,
                "message_ids": message_ids,
                "read_by": "service_desk"
            })
    
    elif msg_type == "send_message":
        await process_admin_message(data)
    
    elif msg_type == "initiate_conversation":
        await initiate_admin_conversation(data)


# =============================================================================
# MESSAGE PROCESSING
# =============================================================================

async def process_user_message(user_id: str, data: dict):
    """Process and store a user's message, notify admin"""
    if db is None:
        return
    
    thread_id = data.get("thread_id")
    content = data.get("content")
    temp_id = data.get("temp_id")  # Client's temporary ID
    
    if not thread_id or not content:
        return
    
    now = datetime.now(timezone.utc).isoformat()
    message_id = str(uuid.uuid4())
    
    # Create message document
    message_doc = {
        "id": message_id,
        "thread_id": thread_id,
        "sender": "user",
        "source": MessageSource.USER.value,
        "content": content,
        "timestamp": now,
        "status": MessageStatus.SENT.value,  # Server received it
        "delivered_at": None,
        "read_at": None,
        "temp_id": temp_id
    }
    
    try:
        # Store in database
        await db.concierge_messages.insert_one(message_doc)
        
        # Update thread
        await db.concierge_threads.update_one(
            {"id": thread_id},
            {
                "$set": {
                    "last_message_preview": content[:100],
                    "last_message_at": now,
                    "status": "awaiting_concierge",
                    "updated_at": now
                },
                "$inc": {"message_count": 1}
            }
        )
        
        # Confirm to user (replace temp message)
        await manager.send_to_user(user_id, {
            "type": "message_confirmed",
            "temp_id": temp_id,
            "message": {
                "id": message_id,
                "thread_id": thread_id,
                "sender": "user",
                "content": content,
                "timestamp": now,
                "status": MessageStatus.SENT.value
            }
        })
        
        # Get thread info for admin notification
        thread = await db.concierge_threads.find_one({"id": thread_id})
        
        # Notify admins
        await manager.broadcast_to_admins({
            "type": "new_message",
            "thread_id": thread_id,
            "message": {
                "id": message_id,
                "sender": "user",
                "content": content,
                "timestamp": now,
                "user_id": user_id,
                "pet_name": thread.get("pet_name") if thread else None
            }
        })
        
        # If admin is online, mark as delivered
        if manager.is_any_admin_online():
            await update_message_status(message_id, MessageStatus.DELIVERED)
            await manager.send_to_user(user_id, {
                "type": "message_status_update",
                "message_id": message_id,
                "status": MessageStatus.DELIVERED.value
            })
        
        # Clear typing indicator
        manager.set_typing(thread_id, user_id, False)
        
    except Exception as e:
        logger.error(f"[MSG] Error processing user message: {e}")
        # Notify user of failure
        await manager.send_to_user(user_id, {
            "type": "message_failed",
            "temp_id": temp_id,
            "error": str(e)
        })


async def process_admin_message(data: dict):
    """Process and store an admin's reply, notify user"""
    if db is None:
        return
    
    thread_id = data.get("thread_id")
    content = data.get("content")
    status_chip = data.get("status_chip")
    
    if not thread_id or not content:
        return
    
    now = datetime.now(timezone.utc).isoformat()
    message_id = str(uuid.uuid4())
    
    # Get thread to find user
    thread = await db.concierge_threads.find_one({"id": thread_id})
    if not thread:
        logger.error(f"[MSG] Thread {thread_id} not found")
        return
    
    user_id = thread.get("user_id")
    pet_name = thread.get("pet_name", "your pet")
    
    # Create message document
    message_doc = {
        "id": message_id,
        "thread_id": thread_id,
        "sender": "concierge",
        "source": MessageSource.SERVICE_DESK.value,
        "content": content,
        "timestamp": now,
        "status": MessageStatus.SENT.value,
        "status_chip": status_chip,
        "delivered_at": None,
        "read_at": None
    }
    
    try:
        # Store in database
        await db.concierge_messages.insert_one(message_doc)
        
        # Update thread
        await db.concierge_threads.update_one(
            {"id": thread_id},
            {
                "$set": {
                    "last_message_preview": content[:100],
                    "last_message_at": now,
                    "status": "awaiting_user",
                    "updated_at": now
                },
                "$inc": {"message_count": 1, "unread_count": 1}
            }
        )
        
        # Notify user via WebSocket
        user_notified = await manager.send_to_user(user_id, {
            "type": "new_message",
            "thread_id": thread_id,
            "message": {
                "id": message_id,
                "sender": "concierge",
                "content": content,
                "timestamp": now,
                "status_chip": status_chip
            },
            "play_sound": True  # Signal to play notification sound
        })
        
        # Update status based on delivery
        if user_notified:
            await update_message_status(message_id, MessageStatus.DELIVERED)
        else:
            # User not connected - send push notification (Feature 11)
            await send_push_to_user(user_id, {
                "title": f"Concierge® - {pet_name}",
                "body": content[:100] + ("..." if len(content) > 100 else ""),
                "tag": f"concierge-{thread_id}",
                "data": {
                    "type": "concierge_message",
                    "thread_id": thread_id,
                    "user_id": user_id
                }
            })
        
        # Confirm to admins
        await manager.broadcast_to_admins({
            "type": "message_sent",
            "thread_id": thread_id,
            "message_id": message_id,
            "delivered": user_notified
        })
        
        # Clear typing indicator
        manager.set_typing(thread_id, "admin", False)
        
    except Exception as e:
        logger.error(f"[MSG] Error processing admin message: {e}")


async def initiate_admin_conversation(data: dict):
    """Admin starts a new conversation with a user"""
    if db is None:
        return
    
    user_id = data.get("user_id")
    pet_id = data.get("pet_id")
    subject = data.get("subject", "Hello from Concierge")
    initial_message = data.get("initial_message")
    
    if not user_id or not initial_message:
        logger.error("[INITIATE] Missing user_id or initial_message")
        return
    
    now = datetime.now(timezone.utc).isoformat()
    thread_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    
    # Get pet name if pet_id provided
    pet_name = "Your pet"
    if pet_id:
        pet = await db.pets.find_one({"id": pet_id})
        if pet:
            pet_name = pet.get("name", "Your pet")
    else:
        # Try to get user's first pet
        pet = await db.pets.find_one({"user_id": user_id})
        if pet:
            pet_id = pet.get("id")
            pet_name = pet.get("name", "Your pet")
    
    try:
        # Create thread
        thread_doc = {
            "id": thread_id,
            "user_id": user_id,
            "pet_id": pet_id,
            "pet_name": pet_name,
            "title": subject,
            "status": "awaiting_user",
            "source": "service_desk_initiated",
            "last_message_preview": initial_message[:100],
            "last_message_at": now,
            "message_count": 1,
            "unread_count": 1,
            "created_at": now,
            "updated_at": now
        }
        await db.concierge_threads.insert_one(thread_doc)
        
        # Create first message
        message_doc = {
            "id": message_id,
            "thread_id": thread_id,
            "sender": "concierge",
            "source": MessageSource.SERVICE_DESK.value,
            "content": initial_message,
            "timestamp": now,
            "status": MessageStatus.SENT.value,
            "delivered_at": None,
            "read_at": None
        }
        await db.concierge_messages.insert_one(message_doc)
        
        # Notify user
        user_notified = await manager.send_to_user(user_id, {
            "type": "new_conversation",
            "thread": {
                "id": thread_id,
                "title": subject,
                "pet_name": pet_name,
                "status": "awaiting_user"
            },
            "message": {
                "id": message_id,
                "sender": "concierge",
                "content": initial_message,
                "timestamp": now
            },
            "play_sound": True
        })
        
        # Update delivery status
        if user_notified:
            await update_message_status(message_id, MessageStatus.DELIVERED)
        
        # Confirm to admins
        await manager.broadcast_to_admins({
            "type": "conversation_initiated",
            "thread_id": thread_id,
            "user_id": user_id,
            "delivered": user_notified
        })
        
        logger.info(f"[INITIATE] Admin initiated conversation {thread_id} with user {user_id}")
        
    except Exception as e:
        logger.error(f"[INITIATE] Error: {e}")


# =============================================================================
# STATUS UPDATES
# =============================================================================

async def update_message_status(message_id: str, status: MessageStatus):
    """Update a message's delivery status"""
    if db is None:
        return
    
    now = datetime.now(timezone.utc).isoformat()
    update_fields = {"status": status.value}
    
    if status == MessageStatus.DELIVERED:
        update_fields["delivered_at"] = now
    elif status == MessageStatus.READ:
        update_fields["read_at"] = now
    
    await db.concierge_messages.update_one(
        {"id": message_id},
        {"$set": update_fields}
    )


async def mark_messages_read(thread_id: str, message_ids: List[str], reader_type: str, reader_id: str):
    """Mark messages as read and update thread unread count"""
    if db is None:
        return
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update message statuses
    if message_ids:
        await db.concierge_messages.update_many(
            {"id": {"$in": message_ids}},
            {"$set": {"status": MessageStatus.READ.value, "read_at": now}}
        )
    
    # Reset unread count on thread
    if reader_type == "user":
        await db.concierge_threads.update_one(
            {"id": thread_id},
            {"$set": {"unread_count": 0}}
        )


# =============================================================================
# REST API ENDPOINTS (Fallback for non-WebSocket clients)
# =============================================================================

@router.post("/send")
async def send_message_rest(
    request: SendMessageRequest,
    user_id: str = Query(..., description="Sender's user ID")
):
    """
    REST endpoint to send a message (fallback when WebSocket unavailable).
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    await process_user_message(user_id, {
        "thread_id": request.thread_id,
        "content": request.content,
        "temp_id": request.temp_id
    })
    
    return {"success": True, "message": "Message sent"}


@router.post("/admin/reply")
async def admin_reply_rest(
    thread_id: str = Query(...),
    content: str = Query(...),
    status_chip: Optional[str] = Query(None)
):
    """
    REST endpoint for admin reply (fallback).
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    await process_admin_message({
        "thread_id": thread_id,
        "content": content,
        "status_chip": status_chip
    })
    
    return {"success": True, "message": "Reply sent"}


@router.post("/admin/initiate")
async def admin_initiate_rest(request: AdminInitiateRequest):
    """
    REST endpoint for admin to initiate a new conversation.
    This creates a new thread and sends the first message to the user.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    await initiate_admin_conversation({
        "user_id": request.user_id,
        "pet_id": request.pet_id,
        "subject": request.subject,
        "initial_message": request.initial_message
    })
    
    return {"success": True, "message": "Conversation initiated"}


@router.post("/mark-read")
async def mark_read_rest(request: MarkReadRequest, user_id: str = Query(...)):
    """
    REST endpoint to mark messages as read.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    await mark_messages_read(request.thread_id, request.message_ids, "user", user_id)
    
    return {"success": True, "messages_read": len(request.message_ids)}


@router.get("/thread/{thread_id}/messages")
async def get_messages_with_status(
    thread_id: str,
    user_id: str = Query(...),
    limit: int = Query(50)
):
    """
    Get messages for a thread with full status information.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Verify user owns this thread
    thread = await db.concierge_threads.find_one({"id": thread_id, "user_id": user_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    messages = []
    cursor = db.concierge_messages.find({"thread_id": thread_id}).sort("timestamp", 1).limit(limit)
    
    async for msg in cursor:
        messages.append({
            "id": msg.get("id"),
            "sender": msg.get("sender"),
            "source": msg.get("source"),
            "content": msg.get("content"),
            "timestamp": msg.get("timestamp"),
            "status": msg.get("status", MessageStatus.SENT.value),
            "delivered_at": msg.get("delivered_at"),
            "read_at": msg.get("read_at"),
            "status_chip": msg.get("status_chip")
        })
    
    return {
        "success": True,
        "thread_id": thread_id,
        "messages": messages,
        "total": len(messages)
    }


@router.get("/unread-count")
async def get_unread_count(user_id: str = Query(...)):
    """
    Get total unread message count across all threads for a user.
    Used for the concierge badge indicator.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total_unread": {"$sum": "$unread_count"}}}
    ]
    
    result = await db.concierge_threads.aggregate(pipeline).to_list(1)
    total_unread = result[0]["total_unread"] if result else 0
    
    return {
        "success": True,
        "user_id": user_id,
        "unread_count": total_unread
    }


@router.get("/connection-status")
async def get_connection_status(user_id: str = Query(None)):
    """
    Get real-time connection status.
    - For users: Whether admin is online
    - For admins: List of online users
    """
    return {
        "success": True,
        "admin_online": manager.is_any_admin_online(),
        "online_admin_count": manager.online_admins,
        "online_user_count": len(manager.online_users),
        "user_online": manager.is_user_online(user_id) if user_id else None
    }


@router.get("/admin/users")
async def get_users_for_initiation(search: str = Query(None), limit: int = Query(20)):
    """
    Get list of users that admin can initiate conversation with.
    Used for the "New Conversation" feature in admin panel.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = []
    cursor = db.users.find(query).limit(limit)
    
    async for user in cursor:
        # Get user's pets
        pets = []
        pets_cursor = db.pets.find({"user_id": user.get("id")})
        async for pet in pets_cursor:
            pets.append({
                "id": pet.get("id"),
                "name": pet.get("name"),
                "photo_url": pet.get("photo_url")
            })
        
        users.append({
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "is_online": manager.is_user_online(user.get("id")),
            "pets": pets
        })
    
    return {
        "success": True,
        "users": users,
        "total": len(users)
    }



# =============================================================================
# MESSAGE SEARCH (Feature 13)
# =============================================================================

@router.get("/search")
async def search_messages(
    user_id: str = Query(..., description="User ID to search messages for"),
    q: str = Query(..., min_length=1, description="Search query"),
    thread_id: Optional[str] = Query(None, description="Optional thread ID to limit search"),
    limit: int = Query(20, le=50)
):
    """
    Search messages for a user across all threads or within a specific thread.
    Returns messages matching the search query with thread context.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Build search query
    search_filter = {
        "content": {"$regex": q, "$options": "i"}
    }
    
    # Get user's thread IDs
    user_threads = await db.concierge_threads.find(
        {"user_id": user_id},
        {"id": 1}
    ).to_list(100)
    
    user_thread_ids = [t["id"] for t in user_threads]
    
    if not user_thread_ids:
        return {"success": True, "results": [], "total": 0, "query": q}
    
    if thread_id:
        # Verify user owns this thread
        if thread_id not in user_thread_ids:
            raise HTTPException(status_code=403, detail="Thread not found")
        search_filter["thread_id"] = thread_id
    else:
        search_filter["thread_id"] = {"$in": user_thread_ids}
    
    # Search messages
    cursor = db.concierge_messages.find(search_filter).sort("timestamp", -1).limit(limit)
    
    results = []
    thread_cache = {}
    
    async for msg in cursor:
        thread_id = msg.get("thread_id")
        
        # Get thread info (cached)
        if thread_id not in thread_cache:
            thread = await db.concierge_threads.find_one({"id": thread_id})
            thread_cache[thread_id] = thread
        
        thread_info = thread_cache.get(thread_id, {})
        
        results.append({
            "id": msg.get("id"),
            "thread_id": thread_id,
            "thread_title": thread_info.get("title", "Conversation"),
            "pet_name": thread_info.get("pet_name"),
            "sender": msg.get("sender"),
            "content": msg.get("content"),
            "timestamp": msg.get("timestamp"),
            "highlight_start": msg.get("content", "").lower().find(q.lower()),
            "highlight_length": len(q)
        })
    
    return {
        "success": True,
        "results": results,
        "total": len(results),
        "query": q
    }


@router.get("/admin/search")
async def admin_search_messages(
    q: str = Query(..., min_length=1, description="Search query"),
    user_id: Optional[str] = Query(None, description="Optional user ID to filter"),
    limit: int = Query(30, le=100)
):
    """
    Admin endpoint to search all concierge messages.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    search_filter = {
        "content": {"$regex": q, "$options": "i"}
    }
    
    if user_id:
        # Get threads for this user
        user_threads = await db.concierge_threads.find(
            {"user_id": user_id},
            {"id": 1}
        ).to_list(100)
        thread_ids = [t["id"] for t in user_threads]
        search_filter["thread_id"] = {"$in": thread_ids}
    
    cursor = db.concierge_messages.find(search_filter).sort("timestamp", -1).limit(limit)
    
    results = []
    thread_cache = {}
    
    async for msg in cursor:
        thread_id = msg.get("thread_id")
        
        if thread_id not in thread_cache:
            thread = await db.concierge_threads.find_one({"id": thread_id})
            thread_cache[thread_id] = thread
        
        thread_info = thread_cache.get(thread_id, {})
        
        results.append({
            "id": msg.get("id"),
            "thread_id": thread_id,
            "thread_title": thread_info.get("title"),
            "user_name": thread_info.get("user_name"),
            "pet_name": thread_info.get("pet_name"),
            "sender": msg.get("sender"),
            "content": msg.get("content"),
            "timestamp": msg.get("timestamp")
        })
    
    return {
        "success": True,
        "results": results,
        "total": len(results),
        "query": q
    }
