"""
Service Ticket Spine - Centralized Ticket Creation/Attachment
=============================================================
SINGLE ENTRY POINT for the uniform service flow.

ALL ticket creation/attachment across EVERY intake MUST flow through:
User Intent (anywhere incl Search) → User Request → Service Desk Ticket → 
Admin Notification → Member Notification → Pillar Request → Tickets → Channel Intakes

NO route should generate ticket_id directly. This helper is the ONLY allowed way.

CANONICAL FORMAT: TCK-YYYY-NNNNNN (e.g., TCK-2026-000001)
- No fallback to 'id'
- No parallel formats
- Reject/repair anything else
"""

import re
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Literal
from enum import Enum

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# CANONICAL TICKET ID FORMAT
# ═══════════════════════════════════════════════════════════════════════════════
CANONICAL_TICKET_ID_PATTERN = re.compile(r'^TCK-\d{4}-\d{6}$')


def is_valid_ticket_id(ticket_id: Optional[str]) -> bool:
    """Validate ticket_id matches canonical format TCK-YYYY-NNNNNN."""
    if not ticket_id:
        return False
    return bool(CANONICAL_TICKET_ID_PATTERN.match(ticket_id))


async def generate_ticket_id(db) -> str:
    """
    Generate a new canonical ticket ID using atomic counter.
    Format: TCK-YYYY-NNNNNN
    """
    year = datetime.now(timezone.utc).year
    
    counter_doc = await db.ticket_counters.find_one_and_update(
        {"_id": f"ticket_counter_{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    
    seq = counter_doc.get("seq", 1)
    ticket_id = f"TCK-{year}-{seq:06d}"
    
    logger.info(f"[TICKET-SPINE] Generated canonical ticket_id: {ticket_id}")
    return ticket_id


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS FOR TYPE SAFETY
# ═══════════════════════════════════════════════════════════════════════════════

class Channel(str, Enum):
    """Intake channel - where the request originated."""
    WEB = "web"
    APP = "app"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    ADMIN = "admin"
    SYSTEM = "system"


class CreatedBy(str, Enum):
    """Who created the ticket."""
    MIRA = "mira"
    CONCIERGE = "concierge"
    ADMIN = "admin"
    SYSTEM = "system"
    MEMBER = "member"


class Pillar(str, Enum):
    """Service pillar classification."""
    CARE = "care"
    CELEBRATE = "celebrate"
    DINE = "dine"
    STAY = "stay"
    TRAVEL = "travel"
    ENJOY = "enjoy"
    FIT = "fit"
    LEARN = "learn"
    PAPERWORK = "paperwork"
    EMERGENCY = "emergency"
    GENERAL = "general"


# Terminal statuses - ticket is done
TERMINAL_STATUSES = ["resolved", "closed", "completed", "cancelled", "archived"]


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN HELPER: create_or_attach_service_ticket
# ═══════════════════════════════════════════════════════════════════════════════

async def create_or_attach_service_ticket(
    db,
    # === INTENT ===
    intent: str,                    # What the user wants (e.g., "book grooming", "order food")
    intent_type: str = "request",   # request | inquiry | complaint | emergency
    
    # === USER/MEMBER ===
    member_email: str = None,
    member_name: str = None,
    member_id: str = None,
    
    # === PET ===
    pet_ids: List[str] = None,
    pet_names: List[str] = None,
    
    # === CLASSIFICATION ===
    pillar: str = "general",        # Pillar enum value
    category: str = None,           # Sub-category within pillar
    
    # === SOURCE TRACKING (for audits) ===
    source_route: str = None,       # Which route called this (e.g., "services_routes.py")
    channel: str = "web",           # Channel enum value
    created_by: str = "member",     # CreatedBy enum value
    
    # === ATTACH TO EXISTING (idempotent) ===
    parent_ticket_id: str = None,   # If provided, attach to this ticket instead of creating new
    thread_id: str = None,          # Related conversation/thread ID
    
    # === PAYLOAD ===
    payload: Dict[str, Any] = None, # Additional data specific to the request
    
    # === OPTIONS ===
    urgency: str = "normal",        # normal | high | critical
    notify_admin: bool = True,      # Send admin notification
    notify_member: bool = True,     # Send member notification
) -> Dict[str, Any]:
    """
    SINGLE ENTRY POINT for ALL ticket creation/attachment.
    
    This enforces the uniform service flow:
    User Intent → User Request → Service Desk Ticket → Admin Notification → 
    Member Notification → Pillar Request → Tickets → Channel Intakes
    
    IDEMPOTENT BEHAVIOR:
    - If parent_ticket_id is valid canonical ID → attach to existing ticket
    - If parent_ticket_id is invalid/missing → create new ticket with canonical ID
    
    Returns:
        {
            "success": True,
            "ticket_id": "TCK-2026-000001",
            "action": "created" | "attached",
            "ticket": {...full ticket document...}
        }
    """
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1: Determine CREATE vs ATTACH
    # ═══════════════════════════════════════════════════════════════════════════
    
    action = "created"
    ticket_id = None
    existing_ticket = None
    
    # Check if we should attach to existing ticket
    if parent_ticket_id:
        if is_valid_ticket_id(parent_ticket_id):
            # Valid canonical ID - try to find existing ticket
            existing_ticket = await db.tickets.find_one(
                {"ticket_id": parent_ticket_id},
                {"_id": 0}
            )
            
            if existing_ticket:
                # Check if ticket is still open (not terminal)
                status = (existing_ticket.get("status") or "").lower()
                if status not in TERMINAL_STATUSES:
                    ticket_id = parent_ticket_id
                    action = "attached"
                    logger.info(f"[TICKET-SPINE] Attaching to existing ticket: {ticket_id}")
                else:
                    logger.info(f"[TICKET-SPINE] Parent ticket {parent_ticket_id} is {status}, creating new")
            else:
                # Check mira_tickets as fallback
                existing_ticket = await db.mira_tickets.find_one(
                    {"ticket_id": parent_ticket_id},
                    {"_id": 0}
                )
                if existing_ticket:
                    status = (existing_ticket.get("status") or "").lower()
                    if status not in TERMINAL_STATUSES:
                        ticket_id = parent_ticket_id
                        action = "attached"
                        logger.info(f"[TICKET-SPINE] Attaching to existing mira_ticket: {ticket_id}")
        else:
            # Invalid format - log warning and create new
            logger.warning(f"[TICKET-SPINE] Invalid parent_ticket_id format: {parent_ticket_id} - creating new")
    
    # Generate new canonical ID if not attaching
    if not ticket_id:
        ticket_id = await generate_ticket_id(db)
        action = "created"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 2: Build ticket document
    # ═══════════════════════════════════════════════════════════════════════════
    
    ticket_doc = {
        # === IDENTITY (Canonical) ===
        "ticket_id": ticket_id,
        "short_id": ticket_id.split("-")[-1] if ticket_id else None,
        
        # === CLASSIFICATION ===
        "pillar": pillar,
        "category": category,
        "intent": intent,
        "intent_type": intent_type,
        
        # === MEMBER ===
        "member": {
            "email": member_email,
            "name": member_name,
            "id": member_id,
        },
        
        # === PET ===
        "pet_ids": pet_ids or [],
        "pet_names": pet_names or [],
        
        # === STATUS ===
        "status": "placed",
        "urgency": urgency,
        
        # === SOURCE TRACKING (for audits) ===
        "source": {
            "route": source_route,
            "channel": channel,
            "created_by": created_by,
        },
        
        # === RELATIONSHIPS ===
        "thread_id": thread_id,
        "parent_ticket_id": parent_ticket_id if action == "attached" else None,
        
        # === PAYLOAD ===
        "payload": payload or {},
        
        # === TIMESTAMPS ===
        "created_at": now_iso,
        "updated_at": now_iso,
        
        # === NOTIFICATIONS ===
        "admin_notified": False,
        "member_notified": False,
        
        # === AUDIT TRAIL ===
        "history": [{
            "action": action,
            "timestamp": now_iso,
            "by": created_by,
            "channel": channel,
            "note": f"Ticket {action} via {source_route or 'unknown'}"
        }]
    }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3: Save to database
    # ═══════════════════════════════════════════════════════════════════════════
    
    if action == "created":
        # Insert new ticket into BOTH collections for compatibility
        # Let MongoDB generate _id automatically
        ticket_doc_copy = {k: v for k, v in ticket_doc.items() if k != "_id"}
        await db.tickets.insert_one(ticket_doc_copy.copy())
        
        # Also insert into mira_tickets for services tab visibility
        await db.mira_tickets.insert_one({
            **ticket_doc_copy,
            "user_email": member_email,
            "customer_email": member_email,
        })
        
        logger.info(f"[TICKET-SPINE] Created ticket {ticket_id} in tickets + mira_tickets")
    
    elif action == "attached":
        # Update existing ticket with new activity
        update_doc = {
            "$set": {
                "updated_at": now_iso,
            },
            "$push": {
                "history": {
                    "action": "activity_attached",
                    "timestamp": now_iso,
                    "by": created_by,
                    "channel": channel,
                    "intent": intent,
                    "note": f"New activity attached via {source_route or 'unknown'}"
                }
            }
        }
        
        # Update in both collections
        await db.tickets.update_one({"ticket_id": ticket_id}, update_doc)
        await db.mira_tickets.update_one({"ticket_id": ticket_id}, update_doc)
        
        logger.info(f"[TICKET-SPINE] Attached activity to ticket {ticket_id}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 4: Trigger notifications (async, non-blocking)
    # ═══════════════════════════════════════════════════════════════════════════
    
    if action == "created":
        if notify_admin:
            # Queue admin notification
            await _queue_admin_notification(db, ticket_doc)
        
        if notify_member:
            # Queue member notification
            await _queue_member_notification(db, ticket_doc)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 5: Return result
    # ═══════════════════════════════════════════════════════════════════════════
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "action": action,
        "ticket": {
            "ticket_id": ticket_doc["ticket_id"],
            "status": ticket_doc["status"],
            "pillar": ticket_doc["pillar"],
            "intent": ticket_doc["intent"],
            "created_at": ticket_doc["created_at"],
            "source": ticket_doc["source"],
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

async def _queue_admin_notification(db, ticket: Dict) -> None:
    """Queue admin notification for new ticket."""
    try:
        await db.admin_notifications.insert_one({
            "type": "new_ticket",
            "ticket_id": ticket["ticket_id"],
            "pillar": ticket["pillar"],
            "intent": ticket["intent"],
            "member_email": ticket["member"]["email"],
            "pet_names": ticket["pet_names"],
            "urgency": ticket["urgency"],
            "created_at": ticket["created_at"],
            "status": "pending",
        })
        
        # Update ticket to mark admin notified
        await db.tickets.update_one(
            {"ticket_id": ticket["ticket_id"]},
            {"$set": {"admin_notified": True, "admin_notified_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"[TICKET-SPINE] Queued admin notification for {ticket['ticket_id']}")
    except Exception as e:
        logger.error(f"[TICKET-SPINE] Failed to queue admin notification: {e}")


async def _queue_member_notification(db, ticket: Dict) -> None:
    """Queue member notification for new ticket."""
    try:
        await db.member_notifications.insert_one({
            "type": "ticket_created",
            "ticket_id": ticket["ticket_id"],
            "pillar": ticket["pillar"],
            "intent": ticket["intent"],
            "member_email": ticket["member"]["email"],
            "created_at": ticket["created_at"],
            "status": "pending",
        })
        
        # Update ticket to mark member notified
        await db.tickets.update_one(
            {"ticket_id": ticket["ticket_id"]},
            {"$set": {"member_notified": True, "member_notified_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"[TICKET-SPINE] Queued member notification for {ticket['ticket_id']}")
    except Exception as e:
        logger.error(f"[TICKET-SPINE] Failed to queue member notification: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def get_ticket_by_id(db, ticket_id: str) -> Optional[Dict]:
    """
    Get ticket by canonical ID from unified view.
    Checks both db.tickets and db.mira_tickets.
    """
    if not is_valid_ticket_id(ticket_id):
        return None
    
    # Check tickets first
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if ticket:
        ticket["_source"] = "tickets"
        return ticket
    
    # Fallback to mira_tickets
    ticket = await db.mira_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if ticket:
        ticket["_source"] = "mira_tickets"
        return ticket
    
    return None


async def update_ticket_status(
    db,
    ticket_id: str,
    new_status: str,
    updated_by: str = "system",
    note: str = None
) -> Dict:
    """
    Update ticket status with audit trail.
    """
    if not is_valid_ticket_id(ticket_id):
        return {"success": False, "error": "Invalid ticket_id format"}
    
    now_iso = datetime.now(timezone.utc).isoformat()
    
    update_doc = {
        "$set": {
            "status": new_status,
            "updated_at": now_iso,
        },
        "$push": {
            "history": {
                "action": "status_change",
                "timestamp": now_iso,
                "by": updated_by,
                "from_status": None,  # Will be filled by pre-hook if needed
                "to_status": new_status,
                "note": note or f"Status changed to {new_status}"
            }
        }
    }
    
    # Update in both collections
    result1 = await db.tickets.update_one({"ticket_id": ticket_id}, update_doc)
    result2 = await db.mira_tickets.update_one({"ticket_id": ticket_id}, update_doc)
    
    if result1.modified_count > 0 or result2.modified_count > 0:
        logger.info(f"[TICKET-SPINE] Updated ticket {ticket_id} status to {new_status}")
        return {"success": True, "ticket_id": ticket_id, "new_status": new_status}
    
    return {"success": False, "error": "Ticket not found"}


async def find_related_ticket(
    db,
    member_email: str,
    pillar: str = None,
    pet_ids: List[str] = None,
    intent: str = None,
    max_age_hours: int = 24
) -> Optional[str]:
    """
    Find an existing open ticket that this request should attach to.
    Used for idempotent ticket creation.
    
    Returns canonical ticket_id if found, None otherwise.
    """
    from datetime import timedelta
    
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
    
    query = {
        "member.email": member_email,
        "status": {"$nin": TERMINAL_STATUSES},
        "created_at": {"$gte": cutoff},
    }
    
    if pillar:
        query["pillar"] = pillar
    
    if pet_ids:
        query["pet_ids"] = {"$in": pet_ids}
    
    # Find most recent matching ticket
    ticket = await db.tickets.find_one(
        query,
        {"ticket_id": 1},
        sort=[("created_at", -1)]
    )
    
    if ticket and is_valid_ticket_id(ticket.get("ticket_id")):
        return ticket["ticket_id"]
    
    return None
