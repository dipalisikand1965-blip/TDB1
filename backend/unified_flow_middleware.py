"""
UNIFIED FLOW MIDDLEWARE - BACKEND ENFORCEMENT LAYER
====================================================

This middleware ensures that ALL action endpoints automatically trigger
the unified signal flow: Notification → Service Desk → Unified Inbox

It decorates route handlers to:
1. Wrap the response with unified flow IDs
2. Log all signals consistently
3. Ensure NO action goes untracked

Usage:
    from unified_flow_middleware import unified_action

    @router.post("/api/care/request")
    @unified_action(category="care", signal_type="request")
    async def create_care_request(request: Request):
        # Your logic here
        return {"success": True, "request_id": "..."}
        # Middleware will add: ticket_id, notification_id, inbox_id
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Callable
from functools import wraps
from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference
_db: AsyncIOMotorDatabase = None

def init_unified_flow_middleware(database: AsyncIOMotorDatabase):
    """Initialize the middleware with database connection"""
    global _db
    _db = database
    logger.info("[UNIFIED FLOW MIDDLEWARE] Initialized with database connection")


async def execute_unified_flow(
    category: str,
    signal_type: str,
    source: str,
    description: str,
    member_email: Optional[str] = None,
    member_name: Optional[str] = None,
    member_phone: Optional[str] = None,
    pet_name: Optional[str] = None,
    pet_id: Optional[str] = None,
    urgency: str = "medium",
    raw_data: Dict[str, Any] = None,
    linked_entity_id: Optional[str] = None
) -> Dict[str, str]:
    """
    Execute the unified signal flow and return the IDs.
    This is the SINGLE function that creates Notification + Ticket + Inbox.
    """
    
    if _db is None:
        logger.error("[UNIFIED FLOW] Database not initialized!")
        # Return placeholder IDs to not break the flow
        fallback_id = uuid.uuid4().hex[:8].upper()
        return {
            "signal_id": f"SIG-{fallback_id}",
            "notification_id": f"NOTIF-{fallback_id}",
            "ticket_id": f"TKT-{fallback_id}",
            "inbox_id": f"INBOX-{fallback_id}"
        }
    
    now = datetime.now(timezone.utc).isoformat()
    signal_id = f"SIG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Build member info
    member_info = {
        "name": member_name or "Unknown",
        "email": member_email,
        "phone": member_phone
    }
    
    # Build pet info
    pet_info = {"name": pet_name, "id": pet_id} if pet_name or pet_id else None
    
    logger.info(f"[UNIFIED FLOW] Processing: {signal_id} | {category}/{signal_type} from {source}")
    
    # === STEP 1: NOTIFICATION ===
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
    
    try:
        await _db.admin_notifications.insert_one(notification_doc)
        logger.info(f"[UNIFIED FLOW] ✓ Notification: {notification_id}")
    except Exception as e:
        logger.error(f"[UNIFIED FLOW] ✗ Notification failed: {e}")
    
    # === STEP 2: SERVICE DESK TICKET ===
    ticket_prefix = category.upper()[:4]
    ticket_date = datetime.now(timezone.utc).strftime('%Y%m%d')
    ticket_id = f"TKT-{ticket_prefix}-{ticket_date}-{uuid.uuid4().hex[:6].upper()}"
    
    service_desk_doc = {
        "ticket_id": ticket_id,
        "signal_id": signal_id,
        "notification_id": notification_id,
        "category": category,
        "sub_category": signal_type,
        "urgency": urgency,
        "priority": 1 if urgency == "critical" else (2 if urgency == "high" else 3),
        "status": "new",
        "source": source,
        "source_reference": linked_entity_id,
        "member": member_info,
        "pet": pet_info,
        "description": description,
        "linked_entity_id": linked_entity_id,
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "signal_received",
            "content": f"Signal received from {source}: {description[:300]}",
            "sender": "system",
            "sender_name": "Unified Flow",
            "channel": source,
            "timestamp": now,
            "is_internal": False
        }],
        "created_at": now,
        "updated_at": now,
        "auto_created": True
    }
    
    try:
        await _db.service_desk_tickets.insert_one(service_desk_doc)
        logger.info(f"[UNIFIED FLOW] ✓ Ticket: {ticket_id}")
    except Exception as e:
        logger.error(f"[UNIFIED FLOW] ✗ Ticket failed: {e}")
    
    # === STEP 3: UNIFIED INBOX ===
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
        "linked_entity_id": linked_entity_id,
        "created_at": now,
        "updated_at": now,
        "raw_data": raw_data or {}
    }
    
    try:
        await _db.channel_intakes.insert_one(inbox_doc)
        logger.info(f"[UNIFIED FLOW] ✓ Inbox: {inbox_id}")
    except Exception as e:
        logger.error(f"[UNIFIED FLOW] ✗ Inbox failed: {e}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: {notification_id} → {ticket_id} → {inbox_id}")
    
    return {
        "signal_id": signal_id,
        "notification_id": notification_id,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id
    }


def unified_action(
    category: str,
    signal_type: str,
    source: str = "web_form",
    description_field: str = None,
    urgency: str = "medium"
):
    """
    Decorator to automatically wrap route handlers with unified flow.
    
    Usage:
        @router.post("/api/care/request")
        @unified_action(category="care", signal_type="request")
        async def create_care_request(data: dict):
            return {"success": True, "request_id": "..."}
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # If result is a dict and success, add unified flow IDs
            if isinstance(result, dict):
                # Extract info from result or kwargs
                member_email = result.get('member_email') or kwargs.get('user_email') or kwargs.get('email')
                member_name = result.get('member_name') or kwargs.get('user_name') or kwargs.get('name')
                member_phone = result.get('member_phone') or kwargs.get('user_phone') or kwargs.get('phone')
                pet_name = result.get('pet_name') or kwargs.get('pet_name')
                pet_id = result.get('pet_id') or kwargs.get('pet_id')
                
                description = result.get('message', '') or result.get('description', '') or f"{category} {signal_type} request"
                if description_field and description_field in result:
                    description = result[description_field]
                
                entity_id = result.get('request_id') or result.get('id') or result.get('booking_id')
                
                # Execute unified flow
                flow_ids = await execute_unified_flow(
                    category=category,
                    signal_type=signal_type,
                    source=source,
                    description=description,
                    member_email=member_email,
                    member_name=member_name,
                    member_phone=member_phone,
                    pet_name=pet_name,
                    pet_id=pet_id,
                    urgency=urgency,
                    raw_data=result,
                    linked_entity_id=entity_id
                )
                
                # Add flow IDs to response
                result.update(flow_ids)
            
            return result
        
        return wrapper
    return decorator


# === STANDALONE FUNCTION FOR DIRECT CALLS ===

async def trigger_unified_flow(
    category: str,
    signal_type: str,
    description: str,
    source: str = "web_form",
    member_email: str = None,
    member_name: str = None,
    member_phone: str = None,
    pet_name: str = None,
    pet_id: str = None,
    urgency: str = "medium",
    raw_data: dict = None,
    linked_entity_id: str = None
) -> Dict[str, str]:
    """
    Standalone function to trigger unified flow from anywhere in the codebase.
    Use this when you can't use the decorator.
    
    Returns:
        {"signal_id": "...", "notification_id": "...", "ticket_id": "...", "inbox_id": "..."}
    """
    return await execute_unified_flow(
        category=category,
        signal_type=signal_type,
        source=source,
        description=description,
        member_email=member_email,
        member_name=member_name,
        member_phone=member_phone,
        pet_name=pet_name,
        pet_id=pet_id,
        urgency=urgency,
        raw_data=raw_data,
        linked_entity_id=linked_entity_id
    )
