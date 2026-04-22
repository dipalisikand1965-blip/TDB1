"""
Unified Communication Backbone for The Doggy Company
=====================================================

This module handles multi-channel messaging between members and concierge:
- In-app messaging
- Email (future: via Resend/SendGrid)
- WhatsApp (future: via WhatsApp Business API)

Key concepts:
- Every conversation is a "ticket" with a unique ID
- Each message tracks its channel (in_app, email, whatsapp)
- Replies auto-detect and use the same channel
- All channels funnel into one unified inbox for agents
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, timezone
from enum import Enum
import logging
import uuid
import os

from utils.ticket_id_generator import generate_ticket_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

# Database reference (set by server.py)
db = None

def set_db(database):
    global db
    db = database


# ============== ENUMS & MODELS ==============

class Channel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"


class MessageSender(str, Enum):
    MEMBER = "member"
    CONCIERGE = "concierge"
    SYSTEM = "system"


class NewMessage(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    channel: Channel = Channel.IN_APP
    attachments: List[str] = []


class ConciergeSendMessage(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    channel: Optional[Channel] = None  # None = auto-detect from last customer message
    is_internal: bool = False  # Internal notes not sent to customer
    attachments: List[str] = []


# ============== HELPER FUNCTIONS ==============

def generate_conversation_id() -> str:
    """Generate a unique conversation ID (legacy - for conversation collection only)"""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"CONV-{today}-{short_uuid}"


async def generate_conversation_ticket_id(db) -> str:
    """Generate canonical ticket_id for conversation's service desk entry"""
    return await generate_ticket_id(db)


def generate_message_id() -> str:
    """Generate a unique message ID"""
    return f"MSG-{uuid.uuid4().hex[:8].upper()}"


async def get_member_info(email: str) -> dict:
    """Get member profile info"""
    if db is None:
        return {"name": "Guest", "email": email, "phone": None}
    
    user = await db.users.find_one({"email": email})
    if user:
        return {
            "name": user.get("name") or user.get("first_name", "Guest"),
            "email": email,
            "phone": user.get("phone") or user.get("mobile"),
            "avatar": user.get("avatar")
        }
    return {"name": "Guest", "email": email, "phone": None}


async def send_via_channel(
    channel: Channel,
    to_email: str,
    to_phone: str,
    message: str,
    conversation_id: str,
    member_name: str
) -> bool:
    """
    Send message through the appropriate channel.
    Returns True if sent successfully.
    """
    if channel == Channel.IN_APP:
        # In-app: Create member notification
        try:
            notif = {
                "id": f"MNOTIF-{uuid.uuid4().hex[:8].upper()}",
                "user_email": to_email,
                "type": "concierge_reply",
                "title": "💬 New message from Concierge",
                "message": message[:150] + ("..." if len(message) > 150 else ""),
                "conversation_id": conversation_id,
                "link": "/member?tab=requests",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.member_notifications.insert_one(notif)
            logger.info(f"In-app notification created for {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to create in-app notification: {e}")
            return False
    
    elif channel == Channel.EMAIL:
        # Email: Send via Resend (placeholder for now)
        try:
            import resend
            api_key = os.environ.get("RESEND_API_KEY")
            if not api_key:
                logger.warning("RESEND_API_KEY not set, email not sent")
                return False
            
            resend.api_key = api_key
            resend.Emails.send({
                "from": "THEDOGGYCOMPANY <woof@thedoggycompany.com>",
                "to": to_email,
                "subject": f"Re: Your request (#{conversation_id[-8:]})",
                "html": f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <p>Hi {member_name},</p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            {message.replace(chr(10), '<br>')}
                        </div>
                        <p>Reply to this email to continue the conversation.</p>
                        <p>— The Doggy Company Concierge Team</p>
                    </div>
                """,
                "reply_to": f"support+{conversation_id}@thedoggycompany.com"
            })
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    elif channel == Channel.WHATSAPP:
        # WhatsApp: Placeholder for WhatsApp Business API
        # TODO: Integrate with WhatsApp Business API or Twilio
        logger.info(f"WhatsApp message would be sent to {to_phone}: {message[:50]}...")
        return False  # Not implemented yet
    
    return False


# ============== ENDPOINTS ==============

@router.post("/start")
async def start_conversation(
    email: str = Query(..., description="Member's email"),
    subject: str = Query(None, description="Optional subject/topic"),
    related_to: str = Query(None, description="Related ticket/order ID")
):
    """
    Start a new conversation (or return existing open one).
    This creates a unified ticket that can receive messages from any channel.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check for existing open conversation
    existing = await db.conversations.find_one({
        "member_email": email,
        "status": {"$in": ["open", "pending", "in_progress"]},
        "related_to": related_to
    })
    
    if existing:
        return {
            "conversation_id": existing.get("conversation_id"),
            "status": existing.get("status"),
            "is_new": False
        }
    
    # Get member info
    member = await get_member_info(email)
    
    # Create new conversation
    conversation_id = generate_conversation_id()
    
    conversation = {
        "conversation_id": conversation_id,
        "member_email": email,
        "member_name": member.get("name"),
        "member_phone": member.get("phone"),
        "subject": subject or "General Inquiry",
        "related_to": related_to,
        "status": "open",
        "priority": "normal",
        "preferred_channel": Channel.IN_APP.value,
        "last_channel": Channel.IN_APP.value,
        "created_at": now,
        "updated_at": now,
        "last_member_message_at": None,
        "last_concierge_message_at": None,
        "has_unread_member_message": False,
        "has_unread_concierge_message": False,
        "messages": [],
        "tags": [],
        "assigned_to": None
    }
    
    await db.conversations.insert_one(conversation)
    
    # Also create in service_desk_tickets for compatibility
    # Use CANONICAL ticket_id format (TCK-YYYY-NNNNNN)
    canonical_ticket_id = await generate_conversation_ticket_id(db)
    ticket = {
        "ticket_id": canonical_ticket_id,  # Canonical format
        "conversation_id": conversation_id,  # Link to conversation
        "subject": subject or "General Inquiry",
        "description": subject or "New conversation started",
        "member_email": email,
        "member_name": member.get("name"),
        "member_phone": member.get("phone"),
        "source": "in_app",
        "status": "new",
        "priority": 2,
        "created_at": now,
        "updated_at": now,
        "has_new_member_message": False,
        "messages": []
    }
    await db.service_desk_tickets.insert_one(ticket)
    # ── Zoho Desk fire-and-forget sync (no-op if ZOHO_ENABLED=false) ─────
    try:
        import zoho_desk_client as _zoho
        _zoho.schedule_push(conversation_id)
    except Exception as _zoho_err:
        logger.warning(f"[ZOHO] Could not schedule sync for {conversation_id}: {_zoho_err}")
    # ────────────────────────────────────────────────────────────────────
    
    logger.info(f"New conversation {conversation_id} created for {email}")
    
    return {
        "conversation_id": conversation_id,
        "status": "open",
        "is_new": True
    }


@router.post("/{conversation_id}/message")
async def send_member_message(
    conversation_id: str,
    message: NewMessage,
    email: str = Query(..., description="Member's email for verification"),
    background_tasks: BackgroundTasks = None
):
    """
    Member sends a message in a conversation.
    Tracks the channel used for auto-reply detection.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Find conversation
    conv = await db.conversations.find_one({
        "conversation_id": conversation_id,
        "member_email": email
    })
    
    # Also check service_desk_tickets for compatibility
    ticket = await db.service_desk_tickets.find_one({
        "$or": [
            {"conversation_id": conversation_id, "member_email": email},
            {"ticket_id": conversation_id, "member_email": email},
            {"ticket_id": conversation_id, "member.email": email},
            {"ticket_id": conversation_id, "customer_email": email}
        ]
    })
    
    if not conv and not ticket:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create message
    msg = {
        "id": generate_message_id(),
        "sender": MessageSender.MEMBER.value,
        "sender_email": email,
        "content": message.content,
        "channel": message.channel.value,
        "attachments": message.attachments,
        "timestamp": now,
        "is_internal": False,
        "read_by_concierge": False
    }
    
    # Update conversation
    if conv:
        await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {"messages": msg},
                "$set": {
                    "updated_at": now,
                    "last_member_message_at": now,
                    "last_channel": message.channel.value,
                    "has_unread_member_message": True,
                    "status": "pending" if conv.get("status") == "resolved" else conv.get("status")
                }
            }
        )
    
    # Update service_desk_tickets for compatibility
    if ticket:
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket.get("ticket_id")},
            {
                "$push": {"messages": msg},
                "$set": {
                    "updated_at": now,
                    "has_new_member_message": True,
                    "last_member_message_at": now,
                    "status": "in_progress"
                }
            }
        )
    
    # Create admin notification
    member = await get_member_info(email)
    channel_icon = {"in_app": "📱", "email": "📧", "whatsapp": "💬"}.get(message.channel.value, "💬")
    
    admin_notif = {
        "id": str(uuid.uuid4()),
        "type": "new_message",
        "title": f"{channel_icon} {member.get('name', 'Member')}: New message",
        "message": message.content[:100] + ("..." if len(message.content) > 100 else ""),
        "conversation_id": conversation_id,
        "ticket_id": ticket.get("ticket_id") if ticket else conversation_id,
        "link_to": f"/dashboard?tab=service-desk&ticket={ticket.get('ticket_id') if ticket else conversation_id}",
        "channel": message.channel.value,
        "severity": "high",
        "created_at": now,
        "read": False,
        "metadata": {
            "member_email": email,
            "member_name": member.get("name"),
            "channel": message.channel.value
        }
    }
    await db.admin_notifications.insert_one(admin_notif)
    
    logger.info(f"Message from {email} via {message.channel.value} in conversation {conversation_id}")
    
    return {
        "success": True,
        "message_id": msg["id"],
        "conversation_id": conversation_id,
        "channel": message.channel.value
    }


@router.post("/{conversation_id}/reply")
async def send_concierge_reply(
    conversation_id: str,
    reply: ConciergeSendMessage,
    agent_email: str = Query(None, description="Agent's email"),
    background_tasks: BackgroundTasks = None
):
    """
    Concierge sends a reply in a conversation.
    Auto-detects channel from last customer message if not specified.
    Sends notification via the appropriate channel.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Find conversation
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    ticket = await db.service_desk_tickets.find_one({
        "$or": [
            {"conversation_id": conversation_id},
            {"ticket_id": conversation_id}
        ]
    })
    
    if not conv and not ticket:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Determine channel - use specified or auto-detect from last customer message
    target_channel = reply.channel
    if not target_channel:
        # Auto-detect from conversation's last channel
        if conv:
            target_channel = Channel(conv.get("last_channel", "in_app"))
        elif ticket:
            # Check last member message
            messages = ticket.get("messages", [])
            member_msgs = [m for m in messages if m.get("sender") == "member"]
            if member_msgs:
                target_channel = Channel(member_msgs[-1].get("channel", "in_app"))
            else:
                target_channel = Channel.IN_APP
        else:
            target_channel = Channel.IN_APP
    
    # Create message
    msg = {
        "id": generate_message_id(),
        "sender": MessageSender.CONCIERGE.value,
        "sender_email": agent_email,
        "content": reply.content,
        "channel": target_channel.value,
        "attachments": reply.attachments,
        "timestamp": now,
        "is_internal": reply.is_internal,
        "read_by_member": False
    }
    
    # Get member info
    member_email = None
    member_name = "Guest"
    member_phone = None
    
    if conv:
        member_email = conv.get("member_email")
        member_name = conv.get("member_name", "Guest")
        member_phone = conv.get("member_phone")
    elif ticket:
        member_email = ticket.get("member_email") or ticket.get("customer_email") or ticket.get("member", {}).get("email")
        member_name = ticket.get("member_name") or ticket.get("member", {}).get("name", "Guest")
        member_phone = ticket.get("member_phone") or ticket.get("member", {}).get("phone")
    
    # Update conversation
    if conv:
        await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {"messages": msg},
                "$set": {
                    "updated_at": now,
                    "last_concierge_message_at": now,
                    "has_unread_member_message": False,
                    "has_unread_concierge_message": not reply.is_internal,
                    "status": "waiting_on_member" if not reply.is_internal else conv.get("status")
                }
            }
        )
    
    # Update service_desk_tickets for compatibility
    if ticket:
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket.get("ticket_id")},
            {
                "$push": {"messages": msg},
                "$set": {
                    "updated_at": now,
                    "has_new_member_message": False,
                    "status": "waiting_on_member" if not reply.is_internal else ticket.get("status")
                }
            }
        )
    
    # Send notification via channel (if not internal)
    channel_sent = False
    if not reply.is_internal and member_email:
        channel_sent = await send_via_channel(
            channel=target_channel,
            to_email=member_email,
            to_phone=member_phone,
            message=reply.content,
            conversation_id=conversation_id,
            member_name=member_name
        )
    
    logger.info(f"Concierge reply via {target_channel.value} in conversation {conversation_id}")
    
    return {
        "success": True,
        "message_id": msg["id"],
        "conversation_id": conversation_id,
        "channel": target_channel.value,
        "channel_notification_sent": channel_sent
    }


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    email: str = Query(None, description="Member's email for verification (optional for agents)")
):
    """
    Get full conversation with all messages.
    Members only see non-internal messages.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Try conversations collection first
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    
    # Also check service_desk_tickets
    ticket = None
    if not conv:
        ticket = await db.service_desk_tickets.find_one({
            "$or": [
                {"conversation_id": conversation_id},
                {"ticket_id": conversation_id}
            ]
        })
    
    if not conv and not ticket:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    source = conv or ticket
    
    # Filter messages for members (hide internal notes)
    messages = source.get("messages", [])
    is_member = email and email == source.get("member_email")
    
    if is_member:
        messages = [m for m in messages if not m.get("is_internal", False)]
    
    # Format messages for response
    formatted_messages = []
    for m in messages:
        formatted_messages.append({
            "id": m.get("id"),
            "sender": "you" if m.get("sender") == "member" and is_member else m.get("sender"),
            "content": m.get("content"),
            "channel": m.get("channel", "in_app"),
            "timestamp": m.get("timestamp"),
            "attachments": m.get("attachments", []),
            "is_internal": m.get("is_internal", False) if not is_member else None
        })
    
    return {
        "conversation_id": conversation_id,
        "subject": source.get("subject"),
        "status": source.get("status"),
        "member_name": source.get("member_name") or source.get("member", {}).get("name"),
        "member_email": source.get("member_email") or source.get("member", {}).get("email"),
        "preferred_channel": source.get("preferred_channel") or source.get("last_channel", "in_app"),
        "created_at": source.get("created_at"),
        "updated_at": source.get("updated_at"),
        "messages": formatted_messages,
        "message_count": len(formatted_messages)
    }


@router.get("")
async def list_conversations(
    email: str = Query(None, description="Filter by member email"),
    status: str = Query(None, description="Filter by status"),
    has_unread: bool = Query(None, description="Only show with unread messages"),
    channel: str = Query(None, description="Filter by last channel"),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    """
    List conversations (for agents in Service Desk).
    Supports filtering and pagination.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    
    if email:
        query["member_email"] = email
    if status:
        query["status"] = status
    if has_unread is True:
        query["has_unread_member_message"] = True
    if channel:
        query["last_channel"] = channel
    
    # Get from conversations
    convs = await db.conversations.find(query).sort("updated_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Also get from service_desk_tickets with conversation_id
    tickets_query = {**query}
    if "member_email" in query:
        tickets_query["$or"] = [
            {"member_email": query["member_email"]},
            {"customer_email": query["member_email"]}
        ]
        del tickets_query["member_email"]
    
    if has_unread is True:
        tickets_query["has_new_member_message"] = True
        if "has_unread_member_message" in tickets_query:
            del tickets_query["has_unread_member_message"]
    
    tickets = await db.service_desk_tickets.find(tickets_query).sort("updated_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Merge and dedupe
    seen_ids = set()
    results = []
    
    for c in convs:
        cid = c.get("conversation_id")
        if cid not in seen_ids:
            seen_ids.add(cid)
            c.pop("_id", None)
            c.pop("messages", None)  # Don't return all messages in list view
            results.append(c)
    
    for t in tickets:
        tid = t.get("conversation_id") or t.get("ticket_id")
        if tid not in seen_ids:
            seen_ids.add(tid)
            t.pop("_id", None)
            t.pop("messages", None)
            results.append({
                "conversation_id": tid,
                "subject": t.get("subject"),
                "member_email": t.get("member_email") or t.get("customer_email"),
                "member_name": t.get("member_name") or t.get("member", {}).get("name"),
                "status": t.get("status"),
                "last_channel": t.get("last_channel", "in_app"),
                "has_unread_member_message": t.get("has_new_member_message", False),
                "created_at": t.get("created_at"),
                "updated_at": t.get("updated_at")
            })
    
    # Sort by updated_at
    results.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    return {
        "conversations": results[:limit],
        "total": len(results),
        "limit": limit,
        "offset": offset
    }
