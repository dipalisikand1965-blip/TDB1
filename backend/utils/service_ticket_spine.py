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
    
    # === PET (REQUIRED for pet-scoped features) ===
    pet_ids: List[str] = None,
    pet_names: List[str] = None,
    pet_id: str = None,             # SINGULAR - Primary pet for this ticket
    pet_name: str = None,           # SINGULAR - Primary pet name
    pet_context: Dict[str, Any] = None,  # Full pet data for soul intelligence
    
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
    
    PET CONTEXT REQUIREMENT:
    - pet_id and pet_name are REQUIRED for pet-scoped notifications
    - If not provided, will attempt auto-resolution from user's pets
    - If user has multiple pets and none specified, ticket flagged with needs_pet_selection
    
    Returns:
        {
            "success": True,
            "ticket_id": "TCK-2026-000001",
            "action": "created" | "attached",
            "ticket": {...full ticket document...},
            "needs_pet_selection": bool  # True if pet context missing and user has multiple pets
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
    # STEP 1.5: Derive member.id and parent_id from member.email
    # This ensures consistent ownership across icon-state and services/inbox
    # ═══════════════════════════════════════════════════════════════════════════
    
    derived_member_id = member_id  # Use provided if available
    derived_parent_id = None       # Legacy field for back-compat
    
    if member_email and not derived_member_id:
        # Lookup user by email to get their ID
        user_record = await db.users.find_one(
            {"email": member_email},
            {"_id": 0, "id": 1, "user_id": 1}
        )
        if user_record:
            derived_member_id = user_record.get("id") or user_record.get("user_id")
            derived_parent_id = derived_member_id  # Legacy parent_id = member.id
            logger.debug(f"[TICKET-SPINE] Derived member.id={derived_member_id} from email={member_email}")
    
    # If member_id was provided but parent_id wasn't derived, use member_id
    if derived_member_id and not derived_parent_id:
        derived_parent_id = derived_member_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1.6: RESOLVE PET CONTEXT (CRITICAL for pet-scoped notifications)
    # Rule: If user is in a pet context, pet_id and pet_name are MANDATORY
    # ═══════════════════════════════════════════════════════════════════════════
    
    resolved_pet_id = pet_id
    resolved_pet_name = pet_name
    resolved_pet_context = pet_context
    needs_pet_selection = False
    
    # Try to resolve from pet_ids/pet_names arrays if singular not provided
    if not resolved_pet_id and pet_ids and len(pet_ids) > 0:
        resolved_pet_id = pet_ids[0]
    if not resolved_pet_name and pet_names and len(pet_names) > 0:
        resolved_pet_name = pet_names[0]
    
    # Try to resolve from pet_context dict
    if not resolved_pet_id and pet_context:
        resolved_pet_id = pet_context.get("id") or pet_context.get("pet_id")
    if not resolved_pet_name and pet_context:
        resolved_pet_name = pet_context.get("name") or pet_context.get("pet_name")
    
    # If pet context still missing, attempt auto-resolution from user's pets
    if member_email and (not resolved_pet_id or not resolved_pet_name):
        user_pets = await db.pets.find(
            {"owner_email": member_email.lower()},
            {"_id": 0, "id": 1, "name": 1, "breed": 1}
        ).to_list(length=10)
        
        if len(user_pets) == 1:
            # User has exactly one pet - auto-attach
            resolved_pet_id = resolved_pet_id or user_pets[0].get("id")
            resolved_pet_name = resolved_pet_name or user_pets[0].get("name")
            if not resolved_pet_context:
                resolved_pet_context = user_pets[0]
            logger.info(f"[TICKET-SPINE] Auto-attached single pet: {resolved_pet_name} ({resolved_pet_id})")
        elif len(user_pets) > 1 and not resolved_pet_id:
            # User has multiple pets and none specified - flag for selection
            needs_pet_selection = True
            logger.warning(f"[TICKET-SPINE] Pet context missing for multi-pet user: {member_email} - needs_pet_selection=True")
        elif len(user_pets) == 0:
            # User has no pets - this is unusual but allowed
            logger.warning(f"[TICKET-SPINE] User {member_email} has no pets - proceeding without pet context")
    
    # Log if pet context is missing (for debugging)
    if not resolved_pet_id or not resolved_pet_name:
        logger.warning(f"[TICKET-SPINE] [SPINE-PET-CONTEXT-MISSING] ticket={ticket_id} pet_id={resolved_pet_id} pet_name={resolved_pet_name}")
    
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
        
        # === MEMBER (Canonical ownership) ===
        "member": {
            "email": member_email,
            "name": member_name,
            "id": derived_member_id,  # Derived from email lookup
        },
        
        # === LEGACY BACK-COMPAT ===
        "parent_id": derived_parent_id,  # For services/inbox backward compatibility
        
        # === PET (REQUIRED for per-pet filtering) ===
        "pet_id": resolved_pet_id,           # SINGULAR - Primary pet for this ticket
        "pet_name": resolved_pet_name,       # SINGULAR - Primary pet name
        "pet_context": resolved_pet_context, # Full pet data for personalization
        "pet_ids": pet_ids or ([resolved_pet_id] if resolved_pet_id else []),
        "pet_names": pet_names or ([resolved_pet_name] if resolved_pet_name else []),
        "needs_pet_selection": needs_pet_selection,  # True if pet must be selected
        
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
        
        # ═══════════════════════════════════════════════════════════════════════════
        # UNIFORM SERVICE FLOW: service_desk_tickets (for admin service desk)
        # ═══════════════════════════════════════════════════════════════════════════
        try:
            await db.service_desk_tickets.insert_one({
                "id": ticket_id,
                "ticket_id": ticket_id,
                "type": intent_type,
                "category": pillar,
                "sub_category": category,
                "subject": intent[:200] if intent else "",
                "description": intent,
                "status": "open",
                "priority": "high" if urgency == "critical" else ("medium" if urgency == "high" else "normal"),
                "urgency": urgency,
                "channel": channel,
                "pillar": pillar,
                "source": source_route,
                "customer_name": member_name,
                "customer_email": member_email,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "pet_ids": pet_ids or [],
                "pet_names": pet_names or [],
                "created_at": now_iso,
                "updated_at": now_iso,
                "assigned_to": None,
            })
            logger.info(f"[TICKET-SPINE] Created service_desk_ticket {ticket_id}")
        except Exception as e:
            logger.error(f"[TICKET-SPINE] Failed to create service_desk_ticket: {e}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # UNIFORM SERVICE FLOW: pillar_requests (for pillar analytics)
        # ═══════════════════════════════════════════════════════════════════════════
        try:
            import uuid as uuid_module
            await db.pillar_requests.insert_one({
                "id": f"PR-{uuid_module.uuid4().hex[:8].upper()}",
                "ticket_id": ticket_id,
                "pillar": pillar,
                "type": intent_type,
                "category": category,
                "user_email": member_email,
                "customer_name": member_name,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "pet_ids": pet_ids or [],
                "status": "pending",
                "source": source_route,
                "channel": channel,
                "created_at": now_iso
            })
            logger.info(f"[TICKET-SPINE] Created pillar_request for {pillar}")
        except Exception as e:
            logger.error(f"[TICKET-SPINE] Failed to create pillar_request: {e}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # UNIFORM SERVICE FLOW: channel_intakes (for unified inbox)
        # ═══════════════════════════════════════════════════════════════════════════
        try:
            import uuid as uuid_module
            await db.channel_intakes.insert_one({
                "id": f"CI-{uuid_module.uuid4().hex[:8].upper()}",
                "ticket_id": ticket_id,
                "thread_id": thread_id,
                "channel": channel,
                "request_type": intent_type,
                "pillar": pillar,
                "category": category,
                "status": "new",
                "urgency": urgency,
                "customer_name": member_name,
                "customer_email": member_email,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "preview": intent[:200] if intent else "",
                "message": intent,
                "source": source_route,
                "created_at": now_iso,
                "updated_at": now_iso
            })
            logger.info(f"[TICKET-SPINE] Created channel_intake for {channel}")
        except Exception as e:
            logger.error(f"[TICKET-SPINE] Failed to create channel_intake: {e}")
    
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
            "pet_id": ticket_doc.get("pet_id"),
            "pet_name": ticket_doc.get("pet_name"),
        },
        "needs_pet_selection": needs_pet_selection,
        "message": "Which pet is this for?" if needs_pet_selection else None
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
    """
    Queue member notification for new ticket.
    
    RULE: Every notification MUST have:
    - ticket_id (REQUIRED - No ticket = no notification)
    - pet_id (REQUIRED - For per-pet filtering)
    - user_email (REQUIRED - For ownership)
    - read (REQUIRED - For badge state)
    """
    try:
        import uuid
        
        member_email = ticket.get("member", {}).get("email")
        ticket_id = ticket.get("ticket_id")
        pet_id = ticket.get("pet_id")
        pet_name = ticket.get("pet_name")
        
        if not member_email or not ticket_id:
            logger.warning(f"[TICKET-SPINE] Cannot create notification - missing email or ticket_id")
            return
        
        now = datetime.now(timezone.utc)
        
        await db.member_notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_email": member_email.lower(),
            "ticket_id": ticket_id,              # REQUIRED - Two-way guarantee
            "pet_id": pet_id,                    # REQUIRED - For per-pet filtering
            "pet_name": pet_name,                # For display
            "type": "ticket_created",
            "title": f"Request opened • {ticket_id}",
            "message": ticket.get("intent", "")[:100],
            "body": ticket.get("intent", "")[:100],
            "pillar": ticket.get("pillar"),
            "read": False,                       # REQUIRED - For badge state
            "created_at": now.isoformat(),
            "data": {
                "ticket_id": ticket_id,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "thread_url": f"/mira-demo?tab=services&ticket={ticket_id}"
            }
        })
        
        # Update ticket to mark member notified
        await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": {"member_notified": True, "member_notified_at": now.isoformat()}}
        )
        await db.mira_tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": {"member_notified": True, "member_notified_at": now.isoformat()}}
        )
        
        logger.info(f"[TICKET-SPINE] Queued member notification for {ticket_id} (pet={pet_name})")
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
