"""
UNIFIED SIGNAL FLOW - HARD SYSTEM RULE
======================================

CRITICAL: This module is the ONLY entry point for ALL signals in the system.
Every signal - no matter how small - MUST flow through this module.

The flow is FIXED and NON-NEGOTIABLE:
1. NOTIFICATION (logged) → 2. SERVICE DESK (ticket) → 3. UNIFIED INBOX → 4. Contextual Views

There is NO SUCH THING as a silent signal.
If it occurs, it is routed.
If it is not routed, it does not exist.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Literal
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

# ==================== SIGNAL TYPES ====================

SignalSource = Literal[
    "mira", "pulse", "web_form", "chat", "whatsapp", "email", 
    "phone", "voice", "system", "admin", "cron", "api"
]

SignalCategory = Literal[
    "celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", 
    "learn", "paperwork", "advisory", "emergency", "farewell", "adopt", 
    "shop", "general", "support", "feedback"
]

# ==================== THE UNIFIED SIGNAL PROCESSOR ====================

async def process_signal(
    # REQUIRED - Every signal MUST have these
    signal_type: str,                    # e.g., "concierge_request", "order", "inquiry", "chat", "booking"
    category: SignalCategory,            # Which pillar/category
    source: SignalSource,                # Where did this signal come from
    description: str,                    # What is this signal about
    
    # MEMBER INFO - At least one identifier
    member_email: Optional[str] = None,
    member_name: Optional[str] = None,
    member_phone: Optional[str] = None,
    member_id: Optional[str] = None,
    
    # PET INFO - Optional
    pet_name: Optional[str] = None,
    pet_id: Optional[str] = None,
    
    # SIGNAL METADATA
    urgency: str = "medium",             # low, medium, high, critical
    raw_data: Dict[str, Any] = None,     # Original data from the source
    linked_entity_type: Optional[str] = None,  # e.g., "reservation", "order", "booking"
    linked_entity_id: Optional[str] = None,    # ID of the linked entity
    
    # ROUTING
    assigned_to: Optional[str] = None,   # Initial assignment
    tags: list = None
) -> Dict[str, str]:
    """
    THE UNIVERSAL SIGNAL PROCESSOR
    
    This function is the SINGLE POINT OF ENTRY for ALL signals.
    It guarantees the flow: Notification → Service Desk → Unified Inbox → Contextual
    
    Returns:
        {
            "notification_id": "...",
            "ticket_id": "...",
            "inbox_id": "...",
            "signal_id": "..."
        }
    """
    
    if db is None:
        raise Exception("Database not initialized for unified signal flow")
    
    now = datetime.now(timezone.utc).isoformat()
    signal_id = f"SIG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Build member info
    member_info = {
        "name": member_name or "Unknown",
        "email": member_email,
        "phone": member_phone,
        "id": member_id
    }
    
    # Build pet info
    pet_info = {
        "name": pet_name,
        "id": pet_id
    } if pet_name or pet_id else None
    
    tags = tags or []
    tags.extend(["signal", category, source])
    
    logger.info(f"[UNIFIED SIGNAL] Processing signal: {signal_id} | Type: {signal_type} | Category: {category} | Source: {source}")
    
    # ==================== STEP 1: NOTIFICATION (ALWAYS FIRST) ====================
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    
    notification_doc = {
        "id": notification_id,
        "signal_id": signal_id,
        "type": f"{category}_{signal_type}",
        "title": f"New {signal_type.replace('_', ' ').title()} - {category.title()}",
        "message": description[:200] + "..." if len(description) > 200 else description,
        "category": category,
        "source": source,
        "urgency": urgency,
        "member": member_info,
        "pet": pet_info,
        "status": "unread",
        "link": f"/admin?tab=servicedesk&signal={signal_id}",
        "created_at": now,
        "read_at": None
    }
    
    await db.admin_notifications.insert_one(notification_doc)
    logger.info(f"[UNIFIED SIGNAL] STEP 1 COMPLETE: Notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (ALWAYS SECOND) ====================
    ticket_count = await db.service_desk_tickets.count_documents({
        "ticket_id": {"$regex": f"^TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}"}
    })
    ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(ticket_count + 1).zfill(4)}"
    
    service_desk_doc = {
        "ticket_id": ticket_id,
        "signal_id": signal_id,
        "notification_id": notification_id,
        "category": category,
        "sub_category": signal_type,
        "urgency": urgency,
        "priority": 1 if urgency == "critical" else (2 if urgency == "high" else (3 if urgency == "medium" else 4)),
        "status": "new",
        "source": source,
        "source_reference": linked_entity_id,
        
        "member": member_info,
        "pet": pet_info,
        
        "description": description,
        "linked_entity_type": linked_entity_type,
        "linked_entity_id": linked_entity_id,
        
        "assigned_to": assigned_to,
        "tags": list(set(tags)),
        
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "signal_received",
            "content": f"Signal received from {source}: {description[:500]}",
            "sender": "system",
            "sender_name": "Unified Signal Flow",
            "channel": source,
            "timestamp": now,
            "is_internal": False
        }],
        
        "internal_notes": "",
        "attachments": [],
        
        "created_at": now,
        "updated_at": now,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
        
        "sla_due_at": None,
        "auto_created": True,
        "auto_created_from": f"{source}_{signal_type}"
    }
    
    await db.service_desk_tickets.insert_one(service_desk_doc)
    logger.info(f"[UNIFIED SIGNAL] STEP 2 COMPLETE: Service Desk ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (ALWAYS THIRD) ====================
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    inbox_doc = {
        "id": inbox_id,
        "signal_id": signal_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        
        "channel": source,
        "category": category,
        "signal_type": signal_type,
        
        "member": member_info,
        "pet": pet_info,
        
        "preview": description[:300] + "..." if len(description) > 300 else description,
        "full_content": description,
        
        "urgency": urgency,
        "status": "new",
        
        "linked_entity_type": linked_entity_type,
        "linked_entity_id": linked_entity_id,
        
        "tags": list(set(tags)),
        
        "created_at": now,
        "updated_at": now,
        "processed_at": None,
        "archived_at": None,
        
        "raw_data": raw_data or {}
    }
    
    await db.channel_intakes.insert_one(inbox_doc)
    logger.info(f"[UNIFIED SIGNAL] STEP 3 COMPLETE: Unified Inbox entry created: {inbox_id}")
    
    # ==================== STEP 4: CONTEXTUAL ROUTING (PILLAR-SPECIFIC) ====================
    # This step creates entries in pillar-specific collections if needed
    
    if category == "enjoy" and signal_type == "concierge_request":
        await db.enjoy_requests.update_one(
            {"id": linked_entity_id},
            {"$set": {
                "signal_id": signal_id,
                "ticket_id": ticket_id,
                "inbox_id": inbox_id,
                "notification_id": notification_id,
                "unified_flow_processed": True,
                "unified_flow_at": now
            }},
            upsert=False
        )
        logger.info(f"[UNIFIED SIGNAL] STEP 4: Linked to Enjoy request: {linked_entity_id}")
    
    elif category == "care" and signal_type in ["concierge_request", "appointment"]:
        await db.care_requests.update_one(
            {"id": linked_entity_id},
            {"$set": {
                "signal_id": signal_id,
                "ticket_id": ticket_id,
                "inbox_id": inbox_id,
                "notification_id": notification_id,
                "unified_flow_processed": True,
                "unified_flow_at": now
            }},
            upsert=False
        )
        logger.info(f"[UNIFIED SIGNAL] STEP 4: Linked to Care request: {linked_entity_id}")
    
    # Add more pillar-specific routing as needed...
    
    logger.info(f"[UNIFIED SIGNAL] COMPLETE: Signal {signal_id} fully processed")
    logger.info(f"[UNIFIED SIGNAL] Flow: Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
    
    return {
        "signal_id": signal_id,
        "notification_id": notification_id,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "category": category,
        "source": source
    }


# ==================== CONVENIENCE WRAPPERS ====================

async def signal_from_mira(
    message: str,
    category: SignalCategory,
    member_email: str = None,
    member_name: str = None,
    pet_name: str = None,
    chat_id: str = None,
    urgency: str = "medium"
) -> Dict[str, str]:
    """Process a signal from Mira AI chat"""
    return await process_signal(
        signal_type="mira_chat",
        category=category,
        source="mira",
        description=f"Mira AI Chat: {message}",
        member_email=member_email,
        member_name=member_name,
        pet_name=pet_name,
        urgency=urgency,
        linked_entity_type="mira_chat",
        linked_entity_id=chat_id,
        tags=["mira", "chat", "ai"]
    )


async def signal_from_pulse(
    voice_transcript: str,
    category: SignalCategory,
    member_email: str = None,
    member_name: str = None,
    pet_name: str = None,
    session_id: str = None,
    urgency: str = "medium"
) -> Dict[str, str]:
    """Process a signal from Pulse voice assistant"""
    return await process_signal(
        signal_type="voice_command",
        category=category,
        source="pulse",
        description=f"Voice Command: {voice_transcript}",
        member_email=member_email,
        member_name=member_name,
        pet_name=pet_name,
        urgency=urgency,
        linked_entity_type="pulse_session",
        linked_entity_id=session_id,
        tags=["pulse", "voice", "command"]
    )


async def signal_from_concierge_request(
    pillar: SignalCategory,
    request_type: str,
    description: str,
    member_email: str = None,
    member_name: str = None,
    member_phone: str = None,
    pet_name: str = None,
    request_id: str = None,
    urgency: str = "medium",
    raw_data: Dict = None
) -> Dict[str, str]:
    """Process a signal from Ask Concierge / pillar request forms"""
    return await process_signal(
        signal_type="concierge_request",
        category=pillar,
        source="web_form",
        description=f"{pillar.title()} Concierge Request: {request_type}\n\n{description}",
        member_email=member_email,
        member_name=member_name,
        member_phone=member_phone,
        pet_name=pet_name,
        urgency=urgency,
        linked_entity_type=f"{pillar}_request",
        linked_entity_id=request_id,
        raw_data=raw_data,
        tags=["concierge", pillar, request_type.lower().replace(" ", "-")]
    )


async def signal_from_order(
    category: SignalCategory,
    order_id: str,
    order_type: str,
    description: str,
    member_email: str = None,
    member_name: str = None,
    member_phone: str = None,
    urgency: str = "high",
    raw_data: Dict = None
) -> Dict[str, str]:
    """Process a signal from an order (cake, dine, shop, etc.)"""
    return await process_signal(
        signal_type="order",
        category=category,
        source="web_form",
        description=f"New {order_type} Order #{order_id}\n\n{description}",
        member_email=member_email,
        member_name=member_name,
        member_phone=member_phone,
        urgency=urgency,
        linked_entity_type="order",
        linked_entity_id=order_id,
        raw_data=raw_data,
        tags=["order", category, order_type.lower().replace(" ", "-")]
    )


async def signal_from_booking(
    category: SignalCategory,
    booking_id: str,
    booking_type: str,
    description: str,
    member_email: str = None,
    member_name: str = None,
    member_phone: str = None,
    pet_name: str = None,
    urgency: str = "high",
    raw_data: Dict = None
) -> Dict[str, str]:
    """Process a signal from a booking (stay, travel, dine reservation, etc.)"""
    return await process_signal(
        signal_type="booking",
        category=category,
        source="web_form",
        description=f"New {booking_type} Booking #{booking_id}\n\n{description}",
        member_email=member_email,
        member_name=member_name,
        member_phone=member_phone,
        pet_name=pet_name,
        urgency=urgency,
        linked_entity_type="booking",
        linked_entity_id=booking_id,
        raw_data=raw_data,
        tags=["booking", category, booking_type.lower().replace(" ", "-")]
    )
