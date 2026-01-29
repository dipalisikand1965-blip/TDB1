"""
UNIFIED SIGNAL FLOW - CENTRAL ENFORCEMENT
==========================================

This module provides a SINGLE function that ALL action endpoints MUST call.
It creates:
1. Notification in admin_notifications
2. Ticket in service_desk_tickets
3. Entry in channel_intakes (unified inbox)

RULE: Desktop = Mobile = PWA = Any Device
Every squeak on the site goes through this.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference
_db: AsyncIOMotorDatabase = None


def init_central_flow(database: AsyncIOMotorDatabase):
    """Initialize with database connection - call from server.py startup"""
    global _db
    _db = database
    logger.info("[CENTRAL FLOW] ✓ Initialized - Ready to process all signals")


def get_timestamp() -> str:
    """Consistent timestamp format for proper sorting"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'


async def create_signal(
    pillar: str,
    action_type: str,
    title: str,
    description: str,
    customer_name: str = None,
    customer_email: str = None,
    customer_phone: str = None,
    pet_name: str = None,
    pet_breed: str = None,
    pet_id: str = None,
    urgency: str = "medium",
    source: str = "web",
    linked_id: str = None,
    extra_data: dict = None
) -> Dict[str, str]:
    """
    CREATE THE COMPLETE UNIFIED SIGNAL FLOW
    
    This function creates ALL THREE required entries:
    1. admin_notifications - For the bell icon
    2. service_desk_tickets - For the service desk
    3. channel_intakes - For the unified inbox
    
    Args:
        pillar: The pillar name (travel, care, fit, enjoy, etc.)
        action_type: Type of action (request, booking, rsvp, etc.)
        title: Human-readable title for the notification
        description: Full description of the request
        customer_name: Customer's name
        customer_email: Customer's email
        customer_phone: Customer's phone
        pet_name: Pet's name
        pet_breed: Pet's breed
        pet_id: Pet's ID if known
        urgency: low, medium, high, critical
        source: web, mobile, pwa, mira, pulse, whatsapp
        linked_id: The original request ID (e.g., TRV-123, CARE-456)
        extra_data: Any additional data to store
    
    Returns:
        {
            "notification_id": "NOTIF-XXXXXXXX",
            "ticket_id": "TKT-XXXX-XXXXXXXX", 
            "inbox_id": "INBOX-XXXXXXXX"
        }
    """
    if _db is None:
        logger.error("[CENTRAL FLOW] ✗ Database not initialized!")
        raise RuntimeError("Central flow not initialized - call init_central_flow first")
    
    now = get_timestamp()
    
    # Generate IDs
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = linked_id or f"TKT-{pillar.upper()[:4]}-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    # Build member info
    member = {
        "name": customer_name or "Website Visitor",
        "email": customer_email,
        "phone": customer_phone
    }
    
    # Build pet info
    pet = None
    if pet_name or pet_id:
        pet = {
            "id": pet_id,
            "name": pet_name,
            "breed": pet_breed
        }
    
    # ==================== 1. NOTIFICATION ====================
    notification_doc = {
        "id": notification_id,
        "type": f"{pillar}_{action_type}",
        "pillar": pillar,
        "title": title,
        "message": description[:200] + "..." if len(description) > 200 else description,
        "read": False,
        "status": "unread",
        "urgency": urgency,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": member,
        "pet": pet,
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "source": source,
        "created_at": now,
        "read_at": None
    }
    
    await _db.admin_notifications.insert_one(notification_doc)
    logger.info(f"[CENTRAL FLOW] ✓ Notification: {notification_id}")
    
    # ==================== 2. SERVICE DESK TICKET ====================
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": action_type,
        "category": pillar,
        "pillar": pillar,
        "subject": title,
        "description": description,
        "status": "new",
        "priority": "high" if urgency in ["high", "critical"] else "normal",
        "urgency": urgency,
        "channel": source,
        "member": member,
        "pet": pet,
        "source_reference": linked_id,
        "metadata": extra_data or {},
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "signal_created",
            "content": description[:500],
            "sender": "system",
            "channel": source,
            "timestamp": now,
            "is_internal": False
        }],
        "created_at": now,
        "updated_at": now,
        "unified_flow": True
    }
    
    await _db.service_desk_tickets.insert_one(ticket_doc)
    logger.info(f"[CENTRAL FLOW] ✓ Ticket: {ticket_id}")
    
    # ==================== 3. UNIFIED INBOX ====================
    inbox_doc = {
        "id": inbox_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "request_id": linked_id or ticket_id,
        "channel": source,
        "pillar": pillar,
        "category": pillar,
        "request_type": action_type,
        "status": "new",
        "urgency": urgency,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "member": member,
        "pet": pet,
        "preview": title,
        "message": description[:300],
        "full_content": description,
        "metadata": extra_data or {},
        "tags": [pillar, action_type],
        "created_at": now,
        "updated_at": now,
        "unified_flow": True
    }
    
    await _db.channel_intakes.insert_one(inbox_doc)
    logger.info(f"[CENTRAL FLOW] ✓ Inbox: {inbox_id}")
    
    logger.info(f"[CENTRAL FLOW] COMPLETE: {pillar}/{action_type} | N:{notification_id} → T:{ticket_id} → I:{inbox_id}")
    
    return {
        "notification_id": notification_id,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id
    }
