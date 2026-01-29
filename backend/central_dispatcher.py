"""
CENTRAL ACTION DISPATCHER - MANDATORY UNIFIED FLOW
===================================================

SEV-1 SYSTEM RULE: This module is the ONLY way to create actions in the system.
NO pillar is allowed to bypass this dispatcher.

For EVERY action, signal, request, booking, order, or inference:
1. NOTIFICATION fires (logged; visible or silent)
2. SERVICE DESK ticket is created
3. UNIFIED INBOX entry is created
4. THEN pillar views can update

If any one is missing, the system is BROKEN.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Literal, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    """Initialize database reference - called from server.py startup"""
    global db
    db = database
    logger.info("[CENTRAL DISPATCHER] Database initialized")

# ==================== ACTION TYPES ====================

ActionSource = Literal[
    "mira", "pulse", "search", "web_form", "chat", "whatsapp", "email", 
    "phone", "voice", "system", "admin", "cron", "api", "mobile_app"
]

ActionPillar = Literal[
    "celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", 
    "learn", "paperwork", "advisory", "emergency", "farewell", "adopt", 
    "shop", "general", "support", "feedback", "search"
]

# ==================== THE CENTRAL ACTION DISPATCHER ====================

async def dispatch_action(
    # REQUIRED - Every action MUST have these
    action_type: str,                    # e.g., "booking", "concierge_request", "order", "search_query"
    pillar: ActionPillar,                # Which pillar/category
    source: ActionSource,                # Where did this action come from
    title: str,                          # Short title for notification/ticket
    description: str,                    # Full description of the action
    
    # MEMBER INFO - At least one identifier required
    member_email: Optional[str] = None,
    member_name: Optional[str] = None,
    member_phone: Optional[str] = None,
    member_id: Optional[str] = None,
    
    # PET INFO - Optional but recommended
    pet_name: Optional[str] = None,
    pet_id: Optional[str] = None,
    pet_breed: Optional[str] = None,
    
    # ACTION METADATA
    urgency: str = "medium",             # low, medium, high, critical
    priority: int = 3,                   # 1=urgent, 2=high, 3=normal, 4=low
    raw_data: Dict[str, Any] = None,     # Original data from the source
    linked_entity_type: Optional[str] = None,  # e.g., "reservation", "order", "booking"
    linked_entity_id: Optional[str] = None,    # ID of the linked entity
    
    # ROUTING
    assigned_to: Optional[str] = None,
    tags: List[str] = None
) -> Dict[str, str]:
    """
    THE CENTRAL ACTION DISPATCHER
    
    This function is the SINGLE POINT OF ENTRY for ALL actions.
    NO pillar can bypass this. It guarantees:
    
    1. NOTIFICATION is ALWAYS created
    2. SERVICE DESK ticket is ALWAYS created
    3. UNIFIED INBOX entry is ALWAYS created
    
    Returns:
        {
            "action_id": "...",
            "notification_id": "...",
            "ticket_id": "...",
            "inbox_id": "...",
            "success": True
        }
    
    GUARDS:
    - If notification fails → entire action fails (atomic)
    - If ticket fails → entire action fails (atomic)
    - If inbox fails → entire action fails (atomic)
    """
    
    if db is None:
        raise Exception("[CENTRAL DISPATCHER] FATAL: Database not initialized")
    
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Generate IDs
    action_id = f"ACT-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    # Build member info
    member = {
        "name": member_name or "Unknown",
        "email": member_email,
        "phone": member_phone,
        "id": member_id
    }
    
    # Build pet info
    pet = None
    if pet_name or pet_id:
        pet = {
            "name": pet_name,
            "id": pet_id,
            "breed": pet_breed
        }
    
    # Build tags
    tags = tags or []
    tags.extend(["unified-flow", pillar, action_type, source])
    tags = list(set(tags))  # Dedupe
    
    logger.info(f"[CENTRAL DISPATCHER] Processing action: {action_id}")
    logger.info(f"[CENTRAL DISPATCHER] Pillar: {pillar} | Type: {action_type} | Source: {source}")
    
    try:
        # ==================== STEP 1: NOTIFICATION (ALWAYS FIRST) ====================
        notification_doc = {
            "id": notification_id,
            "action_id": action_id,
            "type": f"{pillar}_{action_type}",
            "pillar": pillar,
            "title": title,
            "message": description[:200] + "..." if len(description) > 200 else description,
            "read": False,  # IMPORTANT: Use 'read' field for API compatibility
            "status": "unread",
            "urgency": urgency,
            "priority": priority,
            "source": source,
            "ticket_id": ticket_id,
            "inbox_id": inbox_id,
            "customer": member,
            "pet": pet,
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
            "created_at": now_iso,
            "read_at": None,
            "tags": tags
        }
        
        await db.admin_notifications.insert_one(notification_doc)
        logger.info(f"[CENTRAL DISPATCHER] ✅ STEP 1 COMPLETE: Notification {notification_id}")
        
        # ==================== STEP 2: SERVICE DESK TICKET (ALWAYS SECOND) ====================
        ticket_doc = {
            "ticket_id": ticket_id,
            "id": ticket_id,
            "action_id": action_id,
            "notification_id": notification_id,
            "inbox_id": inbox_id,
            
            "pillar": pillar,
            "category": action_type,
            "sub_category": action_type,
            
            "subject": title,
            "description": description,
            
            "member": member,
            "pet": pet,
            
            "status": "new",
            "priority": priority,
            "urgency": urgency,
            "source": source,
            "source_reference": linked_entity_id,
            
            "linked_entity_type": linked_entity_type,
            "linked_entity_id": linked_entity_id,
            
            "assigned_to": assigned_to,
            "tags": tags,
            
            "messages": [{
                "id": str(uuid.uuid4()),
                "type": "action_created",
                "content": f"Action created from {source}: {title}",
                "sender": "system",
                "sender_name": "Central Dispatcher",
                "channel": source,
                "timestamp": now_iso,
                "is_internal": False
            }],
            
            "internal_notes": "",
            "attachments": [],
            "metadata": raw_data or {},
            
            "created_at": now_iso,
            "updated_at": now_iso,
            "first_response_at": None,
            "resolved_at": None,
            "closed_at": None,
            
            "unified_flow_processed": True,
            "dispatcher_version": "v1.0"
        }
        
        # Insert into BOTH collections for compatibility
        await db.service_desk_tickets.insert_one(ticket_doc)
        await db.tickets.insert_one({**ticket_doc, "type": action_type})
        logger.info(f"[CENTRAL DISPATCHER] ✅ STEP 2 COMPLETE: Ticket {ticket_id}")
        
        # ==================== STEP 3: UNIFIED INBOX (ALWAYS THIRD) ====================
        inbox_doc = {
            "id": inbox_id,
            "action_id": action_id,
            "ticket_id": ticket_id,
            "notification_id": notification_id,
            
            "channel": source,
            "pillar": pillar,
            "category": action_type,
            "request_type": action_type,
            
            "member": member,
            "customer_name": member.get("name"),
            "customer_email": member.get("email"),
            "customer_phone": member.get("phone"),
            "pet": pet,
            
            "preview": description[:300] + "..." if len(description) > 300 else description,
            "message": description,
            "full_content": description,
            
            "urgency": urgency,
            "status": "new",
            
            "linked_entity_type": linked_entity_type,
            "linked_entity_id": linked_entity_id,
            
            "tags": tags,
            "metadata": raw_data or {},
            
            "created_at": now_iso,
            "updated_at": now_iso,
            "processed_at": None,
            "archived_at": None,
            
            "unified_flow_processed": True
        }
        
        await db.channel_intakes.insert_one(inbox_doc)
        logger.info(f"[CENTRAL DISPATCHER] ✅ STEP 3 COMPLETE: Inbox {inbox_id}")
        
        # ==================== SUCCESS ====================
        logger.info(f"[CENTRAL DISPATCHER] ✅ ACTION COMPLETE: {action_id}")
        logger.info(f"[CENTRAL DISPATCHER] Flow: Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
        
        return {
            "success": True,
            "action_id": action_id,
            "notification_id": notification_id,
            "ticket_id": ticket_id,
            "inbox_id": inbox_id,
            "pillar": pillar,
            "source": source
        }
        
    except Exception as e:
        # ==================== ATOMIC FAILURE - ROLL BACK ====================
        logger.error(f"[CENTRAL DISPATCHER] ❌ FATAL ERROR: {e}")
        logger.error(f"[CENTRAL DISPATCHER] Rolling back action {action_id}")
        
        # Try to clean up any partial inserts
        try:
            await db.admin_notifications.delete_one({"id": notification_id})
            await db.service_desk_tickets.delete_one({"ticket_id": ticket_id})
            await db.tickets.delete_one({"ticket_id": ticket_id})
            await db.channel_intakes.delete_one({"id": inbox_id})
        except:
            pass
        
        raise Exception(f"[CENTRAL DISPATCHER] Action failed: {e}")


# ==================== CONVENIENCE WRAPPERS FOR COMMON ACTIONS ====================

async def dispatch_concierge_request(
    pillar: ActionPillar,
    member_name: str,
    member_email: str = None,
    member_phone: str = None,
    pet_name: str = None,
    message: str = "",
    source: ActionSource = "web_form",
    experience_name: str = None,
    raw_data: Dict = None
) -> Dict[str, str]:
    """Dispatch an Ask Concierge request from ANY pillar"""
    title = f"Concierge Request: {pillar.title()}"
    if experience_name:
        title = f"Concierge Request: {experience_name}"
    
    return await dispatch_action(
        action_type="concierge_request",
        pillar=pillar,
        source=source,
        title=title,
        description=message or f"Concierge inquiry for {pillar}",
        member_name=member_name,
        member_email=member_email,
        member_phone=member_phone,
        pet_name=pet_name,
        urgency="medium",
        priority=3,
        raw_data=raw_data,
        tags=["concierge", pillar]
    )


async def dispatch_booking(
    pillar: ActionPillar,
    booking_type: str,
    member_name: str,
    member_email: str = None,
    member_phone: str = None,
    pet_name: str = None,
    description: str = "",
    booking_id: str = None,
    source: ActionSource = "web_form",
    urgency: str = "high",
    raw_data: Dict = None
) -> Dict[str, str]:
    """Dispatch a booking from ANY pillar (cab, stay, travel, care, etc.)"""
    return await dispatch_action(
        action_type="booking",
        pillar=pillar,
        source=source,
        title=f"New {booking_type} Booking",
        description=description or f"{booking_type} booking request",
        member_name=member_name,
        member_email=member_email,
        member_phone=member_phone,
        pet_name=pet_name,
        urgency=urgency,
        priority=2,
        linked_entity_type="booking",
        linked_entity_id=booking_id,
        raw_data=raw_data,
        tags=["booking", pillar, booking_type.lower().replace(" ", "-")]
    )


async def dispatch_order(
    pillar: ActionPillar,
    order_type: str,
    order_id: str,
    member_name: str,
    member_email: str = None,
    member_phone: str = None,
    pet_name: str = None,
    description: str = "",
    source: ActionSource = "web_form",
    raw_data: Dict = None
) -> Dict[str, str]:
    """Dispatch an order from ANY pillar"""
    return await dispatch_action(
        action_type="order",
        pillar=pillar,
        source=source,
        title=f"New {order_type} Order #{order_id}",
        description=description or f"{order_type} order",
        member_name=member_name,
        member_email=member_email,
        member_phone=member_phone,
        pet_name=pet_name,
        urgency="high",
        priority=2,
        linked_entity_type="order",
        linked_entity_id=order_id,
        raw_data=raw_data,
        tags=["order", pillar, order_type.lower().replace(" ", "-")]
    )


async def dispatch_search_query(
    query: str,
    member_name: str = None,
    member_email: str = None,
    member_id: str = None,
    pet_name: str = None,
    current_pillar: str = None,
    source: ActionSource = "search"
) -> Dict[str, str]:
    """
    Dispatch a search query - YES, search creates tickets!
    Search is an intent capture surface, not just a product search.
    """
    return await dispatch_action(
        action_type="search_query",
        pillar=current_pillar or "search",
        source=source,
        title=f"Search: {query[:50]}",
        description=f"User searched for: {query}",
        member_name=member_name or "Guest",
        member_email=member_email,
        member_id=member_id,
        pet_name=pet_name,
        urgency="low",
        priority=4,
        raw_data={"query": query, "pillar_context": current_pillar},
        tags=["search", "intent"]
    )


async def dispatch_mira_action(
    action_type: str,
    pillar: ActionPillar,
    message: str,
    member_name: str = None,
    member_email: str = None,
    pet_name: str = None,
    session_id: str = None,
    is_affirmative: bool = False,
    source: ActionSource = "mira"
) -> Dict[str, str]:
    """Dispatch an action from Mira AI conversation"""
    title = f"Mira Request: {action_type.replace('_', ' ').title()}"
    if is_affirmative:
        title = f"Mira Confirmed: {action_type.replace('_', ' ').title()}"
    
    return await dispatch_action(
        action_type=f"mira_{action_type}",
        pillar=pillar,
        source=source,
        title=title,
        description=message,
        member_name=member_name,
        member_email=member_email,
        pet_name=pet_name,
        urgency="high" if is_affirmative else "medium",
        priority=2 if is_affirmative else 3,
        linked_entity_type="mira_session",
        linked_entity_id=session_id,
        raw_data={"session_id": session_id, "is_affirmative": is_affirmative},
        tags=["mira", "ai", pillar]
    )


# ==================== GUARD FUNCTIONS ====================

async def verify_action_integrity(ticket_id: str) -> Dict[str, bool]:
    """
    GUARD: Verify that an action has all required entries.
    If any is missing, auto-create it.
    """
    if db is None:
        return {"error": "Database not initialized"}
    
    results = {
        "ticket_exists": False,
        "notification_exists": False,
        "inbox_exists": False,
        "all_valid": False
    }
    
    # Check ticket
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
    results["ticket_exists"] = ticket is not None
    
    if ticket:
        notification_id = ticket.get("notification_id")
        inbox_id = ticket.get("inbox_id")
        
        # Check notification
        if notification_id:
            notification = await db.admin_notifications.find_one({"id": notification_id})
            results["notification_exists"] = notification is not None
        
        # Check inbox
        if inbox_id:
            inbox = await db.channel_intakes.find_one({"id": inbox_id})
            results["inbox_exists"] = inbox is not None
    
    results["all_valid"] = all([
        results["ticket_exists"],
        results["notification_exists"],
        results["inbox_exists"]
    ])
    
    # AUTO-FIX: If ticket exists but notification/inbox missing, create them
    if results["ticket_exists"] and not results["all_valid"]:
        logger.warning(f"[CENTRAL DISPATCHER] ⚠️ INTEGRITY VIOLATION: Ticket {ticket_id} missing entries")
        
        now_iso = datetime.now(timezone.utc).isoformat()
        
        if not results["notification_exists"]:
            notification_id = f"NOTIF-AUTOFIX-{uuid.uuid4().hex[:8].upper()}"
            await db.admin_notifications.insert_one({
                "id": notification_id,
                "type": f"{ticket.get('pillar', 'general')}_autofix",
                "pillar": ticket.get("pillar", "general"),
                "title": ticket.get("subject", "Auto-fixed notification"),
                "message": "This notification was auto-created to fix integrity violation",
                "read": False,
                "status": "unread",
                "ticket_id": ticket_id,
                "created_at": now_iso,
                "auto_fixed": True
            })
            await db.service_desk_tickets.update_one(
                {"ticket_id": ticket_id},
                {"$set": {"notification_id": notification_id}}
            )
            logger.info(f"[CENTRAL DISPATCHER] Auto-created notification {notification_id}")
        
        if not results["inbox_exists"]:
            inbox_id = f"INBOX-AUTOFIX-{uuid.uuid4().hex[:8].upper()}"
            await db.channel_intakes.insert_one({
                "id": inbox_id,
                "ticket_id": ticket_id,
                "pillar": ticket.get("pillar", "general"),
                "category": ticket.get("category", "autofix"),
                "preview": ticket.get("description", "Auto-fixed inbox entry")[:200],
                "status": "new",
                "created_at": now_iso,
                "auto_fixed": True
            })
            await db.service_desk_tickets.update_one(
                {"ticket_id": ticket_id},
                {"$set": {"inbox_id": inbox_id}}
            )
            logger.info(f"[CENTRAL DISPATCHER] Auto-created inbox entry {inbox_id}")
    
    return results


async def scan_and_fix_integrity_violations(limit: int = 100) -> Dict[str, int]:
    """
    GUARD: Scan all tickets and fix any integrity violations.
    Run this periodically to ensure system consistency.
    """
    if db is None:
        return {"error": "Database not initialized"}
    
    stats = {
        "scanned": 0,
        "valid": 0,
        "fixed": 0,
        "errors": 0
    }
    
    tickets = await db.service_desk_tickets.find({}).limit(limit).to_list(limit)
    
    for ticket in tickets:
        stats["scanned"] += 1
        try:
            result = await verify_action_integrity(ticket["ticket_id"])
            if result.get("all_valid"):
                stats["valid"] += 1
            else:
                stats["fixed"] += 1
        except Exception as e:
            stats["errors"] += 1
            logger.error(f"[CENTRAL DISPATCHER] Error fixing ticket {ticket.get('ticket_id')}: {e}")
    
    logger.info(f"[CENTRAL DISPATCHER] Integrity scan complete: {stats}")
    return stats
