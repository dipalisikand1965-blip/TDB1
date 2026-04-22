"""
Mira Structured Engine - Ticket Manager
=======================================
Handles draft ticket creation, updates, and state transitions.

Unified Request Spine:
- Any intent from anywhere → Service Desk ticket
- Draft → Pending Info → Open → Execution
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from .schemas import TicketStatus, can_transition
from .question_registry import (
    get_required_fields,
    get_missing_required_fields,
    is_ticket_complete
)
import logging
import uuid

logger = logging.getLogger(__name__)

# Database reference
_db = None


def set_ticket_db(db):
    """Set database reference"""
    global _db
    _db = db


def generate_ticket_id() -> str:
    """Generate a unique ticket ID"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:6].upper()
    return f"TKT-{timestamp}-{unique}"


async def create_draft_ticket(
    service_type: str,
    pet_id: str,
    pet_name: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    initial_fields: Dict[str, Any] = None,
    pillar: str = "care",
    source: str = "mira_chat"
) -> Dict[str, Any]:
    """
    Create a draft ticket when execution intent is detected.
    
    This is called IMMEDIATELY when Mira detects a booking intent.
    The ticket starts as DRAFT and progresses as info is collected.
    """
    
    if _db is None:
        logger.error("[TICKET] Database not available")
        return {"error": "Database not available"}
    
    ticket_id = generate_ticket_id()
    now = datetime.now(timezone.utc).isoformat()
    
    filled_fields = initial_fields or {}
    missing_fields = get_missing_required_fields(service_type, filled_fields)
    
    # Determine initial status
    if is_ticket_complete(service_type, filled_fields):
        status = TicketStatus.OPEN.value
    elif filled_fields:
        status = TicketStatus.PENDING_INFO.value
    else:
        status = TicketStatus.DRAFT.value
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "service_type": service_type,
        "pillar": pillar,
        "status": status,
        
        # Pet info
        "pet_id": pet_id,
        "pet_name": pet_name,
        
        # User info
        "user_id": user_id,
        "customer_email": user_email,
        
        # Fields
        "filled_fields": filled_fields,
        "missing_fields": missing_fields,
        "required_fields": get_required_fields(service_type),
        
        # Subject for display
        "subject": f"{service_type.replace('_', ' ').title()} for {pet_name}",
        
        # Tracking
        "source": source,
        "created_at": now,
        "updated_at": now,
        "created_via": "mira_structured_engine",
        
        # Conversation reference
        "conversation_turns": [],
    }
    
    try:
        await _db.service_desk_tickets.insert_one(ticket_doc)
        logger.info(f"[TICKET] Created draft: {ticket_id} for {service_type} ({status})")
        # ── Zoho Desk fire-and-forget sync (no-op if ZOHO_ENABLED=false) ─────
        try:
            import zoho_desk_client as _zoho
            _zoho.schedule_push(ticket_id)
        except Exception as _zoho_err:
            logger.warning(f"[ZOHO] Could not schedule sync for {ticket_id}: {_zoho_err}")
        # ────────────────────────────────────────────────────────────────────
        
        # Create notifications
        await _create_ticket_notifications(ticket_doc)
        
        return {
            "ticket_id": ticket_id,
            "status": status,
            "filled_fields": filled_fields,
            "missing_fields": missing_fields,
        }
        
    except Exception as e:
        logger.error(f"[TICKET] Error creating draft: {e}")
        return {"error": str(e)}


async def update_ticket_field(
    ticket_id: str,
    field_name: str,
    field_value: Any
) -> Dict[str, Any]:
    """
    Update a single field on a ticket.
    
    Called when user answers a clarifying question.
    Automatically transitions status if requirements met.
    """
    
    if _db is None:
        return {"error": "Database not available"}
    
    try:
        # Get current ticket
        ticket = await _db.service_desk_tickets.find_one(
            {"ticket_id": ticket_id},
            {"_id": 0}
        )
        
        if not ticket:
            return {"error": "Ticket not found"}
        
        service_type = ticket.get("service_type")
        filled_fields = ticket.get("filled_fields", {})
        
        # Update field
        filled_fields[field_name] = field_value
        
        # Recalculate missing fields
        missing_fields = get_missing_required_fields(service_type, filled_fields)
        
        # Determine new status
        current_status = TicketStatus(ticket.get("status", "draft"))
        
        if is_ticket_complete(service_type, filled_fields):
            new_status = TicketStatus.OPEN
        elif filled_fields:
            new_status = TicketStatus.PENDING_INFO
        else:
            new_status = TicketStatus.DRAFT
        
        # Validate transition
        if current_status != new_status:
            if not can_transition(current_status, new_status):
                logger.warning(f"[TICKET] Invalid transition: {current_status} → {new_status}")
                new_status = current_status
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update ticket
        await _db.service_desk_tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "filled_fields": filled_fields,
                    "missing_fields": missing_fields,
                    "status": new_status.value,
                    "updated_at": now,
                },
                "$push": {
                    "conversation_turns": {
                        "field": field_name,
                        "value": field_value,
                        "timestamp": now,
                    }
                }
            }
        )
        
        logger.info(f"[TICKET] Updated {ticket_id}: {field_name}={field_value}, status={new_status.value}")
        
        # If status changed to OPEN, notify concierge
        if new_status == TicketStatus.OPEN and current_status != TicketStatus.OPEN:
            await _notify_ticket_ready(ticket_id, ticket)
        
        return {
            "ticket_id": ticket_id,
            "status": new_status.value,
            "filled_fields": filled_fields,
            "missing_fields": missing_fields,
            "is_complete": len(missing_fields) == 0,
        }
        
    except Exception as e:
        logger.error(f"[TICKET] Error updating: {e}")
        return {"error": str(e)}


async def get_ticket_state(ticket_id: str) -> Optional[Dict[str, Any]]:
    """Get current ticket state for response"""
    
    if _db is None:
        return None
    
    try:
        ticket = await _db.service_desk_tickets.find_one(
            {"ticket_id": ticket_id},
            {"_id": 0, "ticket_id": 1, "status": 1, "service_type": 1, 
             "filled_fields": 1, "missing_fields": 1, "subject": 1, "pet_name": 1}
        )
        
        if not ticket:
            return None
        
        return {
            "ticket_id": ticket.get("ticket_id"),
            "id": ticket.get("ticket_id"),
            "status": ticket.get("status"),
            "service_type": ticket.get("service_type"),
            "filled_fields": ticket.get("filled_fields", {}),
            "missing_fields": ticket.get("missing_fields", []),
            "summary": ticket.get("subject"),
        }
        
    except Exception as e:
        logger.error(f"[TICKET] Error getting state: {e}")
        return None


async def get_or_create_ticket_for_intent(
    service_type: str,
    pet_id: str,
    pet_name: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    existing_ticket_id: Optional[str] = None,
    initial_fields: Dict[str, Any] = None,
    pillar: str = "care"
) -> Dict[str, Any]:
    """
    Get existing draft ticket or create new one.
    
    This handles the case where user already started a request.
    """
    
    # If we have an existing ticket ID, use it
    if existing_ticket_id:
        ticket = await get_ticket_state(existing_ticket_id)
        if ticket:
            return ticket
    
    # Check for existing draft ticket for same pet + service
    if _db is not None:
        try:
            existing = await _db.service_desk_tickets.find_one(
                {
                    "pet_id": pet_id,
                    "service_type": service_type,
                    "status": {"$in": ["draft", "pending_info"]},
                },
                {"_id": 0, "ticket_id": 1}
            )
            
            if existing:
                logger.info(f"[TICKET] Found existing draft: {existing['ticket_id']}")
                return await get_ticket_state(existing["ticket_id"])
                
        except Exception as e:
            logger.error(f"[TICKET] Error checking existing: {e}")
    
    # Create new draft
    return await create_draft_ticket(
        service_type=service_type,
        pet_id=pet_id,
        pet_name=pet_name,
        user_id=user_id,
        user_email=user_email,
        initial_fields=initial_fields,
        pillar=pillar,
    )


async def _create_ticket_notifications(ticket: Dict[str, Any]):
    """Create admin and member notifications for new ticket"""
    
    if _db is None:
        return
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        ticket_id = ticket.get("ticket_id")
        pet_name = ticket.get("pet_name", "Pet")
        service_type = ticket.get("service_type", "service").replace("_", " ").title()
        
        # Admin notification
        admin_notif = {
            "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "type": "new_service_request",
            "ticket_id": ticket_id,
            "title": f"New {service_type} Request",
            "message": f"{service_type} request for {pet_name}",
            "status": ticket.get("status"),
            "created_at": now,
            "read": False,
        }
        await _db.admin_notifications.insert_one(admin_notif)
        
        # Member notification (unified inbox)
        member_notif = {
            "id": f"INBOX-{uuid.uuid4().hex[:8].upper()}",
            "thread_id": ticket_id,
            "ticket_id": ticket_id,
            "user_id": ticket.get("user_id"),
            "customer_email": ticket.get("customer_email"),
            "pet_id": ticket.get("pet_id"),
            "pet_name": pet_name,
            "type": "service_request",
            "subject": ticket.get("subject"),
            "preview": f"Your {service_type.lower()} request has been received. We'll get back to you shortly.",
            "status": "open",
            "unread": True,
            "created_at": now,
            "updated_at": now,
            "messages": [
                {
                    "id": f"MSG-{uuid.uuid4().hex[:8]}",
                    "from": "system",
                    "sender_name": "Mira Concierge",
                    "content": f"Hi! Your {service_type.lower()} request for {pet_name} has been received. Our team will review and get back to you shortly.",
                    "timestamp": now,
                }
            ]
        }
        await _db.unified_inbox.insert_one(member_notif)
        
        logger.info(f"[TICKET] Notifications created for {ticket_id}")
        
    except Exception as e:
        logger.error(f"[TICKET] Error creating notifications: {e}")


async def _notify_ticket_ready(ticket_id: str, ticket: Dict[str, Any]):
    """Notify when ticket transitions to OPEN (ready for execution)"""
    
    if _db is None:
        return
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Update admin notification
        await _db.admin_notifications.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "status": "open",
                    "message": f"Ready for assignment: {ticket.get('subject')}",
                    "updated_at": now,
                }
            }
        )
        
        logger.info(f"[TICKET] Notified ticket ready: {ticket_id}")
        
    except Exception as e:
        logger.error(f"[TICKET] Error notifying ready: {e}")
