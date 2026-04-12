"""
Auto Ticket Creation System
===========================
Creates tickets automatically when events happen across the system.
The Command Center becomes the "all-seeing eye" - every significant action
creates a ticket/notification so concierge knows everything happening.

Events that create tickets:
1. Order placed
2. Pet Soul updated
3. Member profile changed
4. Membership purchased/renewed/cancelled
5. Pet added/updated
6. Health record updated
7. Booking made (stay, dine, travel, care)
8. Voice order received

MIGRATED to use handoff_to_spine() per Bible Section 12.0.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, Any
import uuid

logger = logging.getLogger(__name__)

# Import canonical ticket spine helper (SINGLE ENTRY POINT for all tickets)
from utils.spine_helper import handoff_to_spine

# ── Admin instant WhatsApp alerts ──────────────────────────────────────────────
# Dipali's number gets a WhatsApp for every new order and new ticket
ADMIN_WHATSAPP = os.environ.get("ADMIN_WHATSAPP_NUMBER", "919739908844")

async def _alert_admin(subject: str, member_name: str, member_phone: str = "", ticket_id: str = "") -> None:
    """Send an instant WhatsApp ping to Dipali for every new order / ticket."""
    try:
        from whatsapp_notifications import send_whatsapp_message
        lines = [
            f"🔔 *New: {subject}*",
        ]
        if member_name:
            lines.append(f"👤 {member_name}")
        if member_phone:
            lines.append(f"📞 {member_phone}")
        if ticket_id:
            lines.append(f"🎫 {ticket_id}")
        lines.append("— TDC Service Desk")
        await send_whatsapp_message(ADMIN_WHATSAPP, "\n".join(lines), "admin_alert")
        logger.info(f"[ADMIN ALERT] WhatsApp sent to {ADMIN_WHATSAPP}: {subject}")
    except Exception as e:
        logger.warning(f"[ADMIN ALERT] WhatsApp ping failed (non-critical): {e}")

# Database reference (set by server.py)
db = None

def set_auto_ticket_db(database):
    """Initialize with database reference."""
    global db
    db = database
    logger.info("Auto ticket creation system initialized")


def get_db():
    """Get database reference."""
    if db is None:
        raise RuntimeError("Auto ticket DB not initialized")
    return db


# Ticket ID prefixes by type (kept for logging purposes only)
TICKET_PREFIXES = {
    "order": "ORD-TKT",
    "pet_soul": "SOUL-TKT",
    "profile": "PROF-TKT",
    "membership": "MEM-TKT",
    "pet": "PET-TKT",
    "health": "HEALTH-TKT",
    "stay": "STAY-TKT",
    "dine": "DINE-TKT",
    "travel": "TRAVEL-TKT",
    "care": "CARE-TKT",
    "voice": "VOICE-TKT",
    "general": "GEN-TKT"
}


async def create_auto_ticket(
    event_type: str,
    pillar: str,
    urgency: str,
    subject: str,
    description: str,
    member: Optional[Dict] = None,
    pet: Optional[Dict] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    metadata: Optional[Dict] = None,
    action_required: bool = True
) -> Dict:
    """
    Create an automatic ticket for an event via UNIFORM SERVICE FLOW.
    MIGRATED to handoff_to_spine() per Bible Section 12.0.
    
    Args:
        event_type: Type of event (order, pet_soul, profile, membership, etc.)
        pillar: Service pillar (shop, celebrate, care, etc.)
        urgency: Priority level (low, medium, high, urgent)
        subject: Brief subject line
        description: Full description of the event
        member: Member info dict (name, email, phone)
        pet: Pet info dict (name, breed, etc.)
        reference_id: ID of the related entity (order_id, pet_id, etc.)
        reference_type: Type of reference (order, pet, user, etc.)
        metadata: Additional event-specific data
        action_required: Whether concierge action is needed
        
    Returns:
        Dict with ticket_id and success status
    """
    database = get_db()
    
    # Normalize member data
    member_data = member or {}
    
    # Normalize pet data
    pet_data = None
    if pet:
        if isinstance(pet, str):
            pet_data = {"name": pet}
        else:
            pet_data = {
                "id": pet.get("id"),
                "name": pet.get("name"),
                "breed": pet.get("breed")
            }
    
    # Build intent from subject
    intent = subject
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HANDOFF TO SPINE - Single canonical ticket creation
    # ═══════════════════════════════════════════════════════════════════════════
    spine_result = await handoff_to_spine(
        db=database,
        route_name="ticket_auto_creation.py",
        endpoint=f"/auto/{event_type}",
        pillar=pillar,
        category=event_type,
        intent=intent,
        user={
            "email": member_data.get("email"),
            "name": member_data.get("name"),
            "phone": member_data.get("phone")
        },
        pet=pet_data,
        payload={
            "event_type": event_type,
            "reference_id": reference_id,
            "reference_type": reference_type,
            "auto_created": True,
            "action_required": action_required,
            "original_description": description,
            **(metadata or {})
        },
        channel="system",
        urgency=urgency,
        created_by="system",
        notify_admin=action_required,
        notify_member=False,  # Auto-tickets don't notify members
        tags=[event_type, pillar, "auto-system"]
    )
    
    if not spine_result.get("success"):
        logger.error(f"[AUTO-TICKET] Spine handoff failed for {event_type}: {spine_result.get('error')}")
        return {
            "success": False,
            "error": spine_result.get("error")
        }
    
    ticket_id = spine_result["ticket_id"]
    
    logger.info(f"[SPINE-MIGRATED] ticket_auto_creation.py:/auto/{event_type} → {ticket_id} | pillar={pillar} category={event_type}")

    # ── Instant admin WhatsApp alert for actionable events ──────────────────
    if action_required:
        import asyncio
        asyncio.ensure_future(_alert_admin(
            subject=subject,
            member_name=member_data.get("name") or member_data.get("email") or "",
            member_phone=member_data.get("phone") or "",
            ticket_id=ticket_id
        ))
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "event_type": event_type,
        "deep_link": spine_result.get("deep_link")
    }


# ============== EVENT HANDLERS ==============

async def on_order_placed(order: Dict) -> Dict:
    """Create ticket when order is placed."""
    customer = order.get("customer", {}) or {}
    items = order.get("items", [])
    total = order.get("total", 0)
    
    item_summary = ", ".join([f"{i.get('quantity', 1)}x {i.get('name', 'Item')}" for i in items[:3]])
    if len(items) > 3:
        item_summary += f" +{len(items) - 3} more"
    
    return await create_auto_ticket(
        event_type="order",
        pillar="shop",
        urgency="medium",
        subject=f"New Order #{order.get('order_id', 'N/A')} - ₹{total}",
        description=f"Order placed: {item_summary}\nTotal: ₹{total}\nPayment: {order.get('payment_status', 'pending')}",
        member={
            "name": customer.get("name"),
            "email": customer.get("email"),
            "phone": customer.get("phone")
        },
        reference_id=order.get("order_id") or order.get("id"),
        reference_type="order",
        metadata={
            "order_total": total,
            "items_count": len(items),
            "payment_status": order.get("payment_status")
        },
        action_required=True  # Orders need fulfillment
    )


async def on_pet_soul_updated(pet: Dict, user: Dict, changes: Dict) -> Dict:
    """Create ticket when Pet Soul is updated."""
    change_list = ", ".join(changes.keys()) if changes else "profile data"
    
    return await create_auto_ticket(
        event_type="pet_soul",
        pillar="celebrate",  # Pet Soul falls under celebrate pillar
        urgency="low",
        subject=f"Pet Soul Updated: {pet.get('name', 'Pet')}",
        description=f"Pet parent updated Pet Soul for {pet.get('name')}.\nChanges: {change_list}\nThis enriches our understanding of the pet's personality.",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        pet={
            "name": pet.get("name"),
            "breed": pet.get("breed"),
            "id": pet.get("id")
        },
        reference_id=pet.get("id"),
        reference_type="pet",
        metadata=changes,
        action_required=False  # Info only, no action needed
    )


async def on_member_profile_changed(user: Dict, changes: Dict, changed_by: str = "member") -> Dict:
    """Create ticket when member profile is updated."""
    change_list = ", ".join(changes.keys()) if changes else "profile data"
    
    # Determine urgency based on what changed
    urgency = "low"
    if "email" in changes or "phone" in changes:
        urgency = "medium"  # Contact info changes are important
    if "membership_tier" in changes:
        urgency = "high"  # Membership changes need attention
    
    return await create_auto_ticket(
        event_type="profile",
        pillar="club",
        urgency=urgency,
        subject=f"Profile Updated: {user.get('name', 'Member')}",
        description=f"Member profile updated.\nChanges: {change_list}\nChanged by: {changed_by}",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        reference_id=user.get("email"),
        reference_type="user",
        metadata={"changes": changes, "changed_by": changed_by},
        action_required=urgency == "high"  # Only high priority needs action
    )


async def on_membership_event(event: str, user: Dict, membership: Dict) -> Dict:
    """Create ticket for membership events (purchase, renewal, cancellation)."""
    urgency_map = {
        "purchased": "high",
        "renewed": "medium",
        "upgraded": "high",
        "downgraded": "high",
        "cancelled": "urgent",
        "expiring_soon": "high",
        "expired": "urgent"
    }
    
    action_map = {
        "purchased": True,   # Welcome call
        "renewed": False,    # Info only
        "upgraded": True,    # Thank you + new benefits
        "downgraded": True,  # Understand why + retention
        "cancelled": True,   # Win-back attempt
        "expiring_soon": True,  # Renewal reminder
        "expired": True      # Win-back attempt
    }
    
    return await create_auto_ticket(
        event_type="membership",
        pillar="club",
        urgency=urgency_map.get(event, "medium"),
        subject=f"Membership {event.replace('_', ' ').title()}: {user.get('name', 'Member')}",
        description=f"Membership event: {event}\nPlan: {membership.get('plan_name', 'N/A')}\nEmail: {user.get('email')}",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        reference_id=membership.get("id") or membership.get("membership_id"),
        reference_type="membership",
        metadata={
            "event": event,
            "plan": membership.get("plan_name"),
            "amount": membership.get("amount")
        },
        action_required=action_map.get(event, True)
    )


async def on_pet_added(pet: Dict, user: Dict) -> Dict:
    """Create ticket when new pet is added."""
    return await create_auto_ticket(
        event_type="pet",
        pillar="celebrate",
        urgency="medium",
        subject=f"New Pet Added: {pet.get('name', 'Pet')} 🐾",
        description=f"Welcome {pet.get('name')}!\nBreed: {pet.get('breed', 'Unknown')}\nBirthday: {pet.get('birthday', 'Unknown')}\nParent: {user.get('name')}",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        pet=pet,
        reference_id=pet.get("id"),
        reference_type="pet",
        metadata={
            "breed": pet.get("breed"),
            "birthday": pet.get("birthday"),
            "species": pet.get("species", "dog")
        },
        action_required=True  # Welcome kit / onboarding
    )


async def on_health_record_added(record: Dict, pet: Dict, user: Dict) -> Dict:
    """Create ticket when health record is added."""
    record_type = record.get("type", "health record")
    
    return await create_auto_ticket(
        event_type="health",
        pillar="care",
        urgency="low",
        subject=f"Health Record: {pet.get('name', 'Pet')} - {record_type}",
        description=f"New {record_type} added for {pet.get('name')}.\nDate: {record.get('date', 'Today')}\nDetails: {record.get('notes', 'N/A')}",
        member={
            "name": user.get("name"),
            "email": user.get("email")
        },
        pet=pet,
        reference_id=record.get("id"),
        reference_type="health_record",
        metadata=record,
        action_required=False  # Info only
    )


async def on_booking_made(booking_type: str, booking: Dict, user: Dict, pet: Optional[Dict] = None) -> Dict:
    """Create ticket for any booking (stay, dine, travel, care)."""
    pillar_map = {
        "stay": "stay",
        "boarding": "stay",
        "daycare": "stay",
        "dine": "dine",
        "restaurant": "dine",
        "travel": "travel",
        "care": "care",
        "vet": "care",
        "grooming": "care"
    }
    
    pillar = pillar_map.get(booking_type, "general")
    
    return await create_auto_ticket(
        event_type=pillar,
        pillar=pillar,
        urgency="medium",
        subject=f"{booking_type.title()} Booking: {user.get('name', 'Member')}",
        description=f"New {booking_type} booking.\nDate: {booking.get('date', 'TBD')}\nDetails: {booking.get('notes', booking.get('details', 'N/A'))}",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        pet=pet,
        reference_id=booking.get("id") or booking.get("booking_id"),
        reference_type=f"{booking_type}_booking",
        metadata=booking,
        action_required=True  # Bookings need confirmation
    )


async def on_voice_order_received(voice_order: Dict, user: Dict) -> Dict:
    """Create ticket for voice order from Mira."""
    return await create_auto_ticket(
        event_type="voice",
        pillar="shop",
        urgency="high",  # Voice orders should be handled quickly
        subject=f"Voice Order: {user.get('name', 'Member')}",
        description=f"Voice order received via Mira.\nTranscript: {voice_order.get('transcript', 'N/A')}\nItems: {voice_order.get('items_summary', 'Processing...')}",
        member={
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone")
        },
        reference_id=voice_order.get("id"),
        reference_type="voice_order",
        metadata=voice_order,
        action_required=True  # Needs processing
    )


# ============== CONVENIENCE WRAPPER ==============

async def create_event_ticket(
    event_type: str,
    data: Dict,
    user: Optional[Dict] = None,
    pet: Optional[Dict] = None
) -> Dict:
    """
    Convenience wrapper to create tickets for various events.
    Routes to appropriate handler based on event_type.
    """
    handlers = {
        "order_placed": lambda: on_order_placed(data),
        "pet_soul_updated": lambda: on_pet_soul_updated(data.get("pet", {}), user or {}, data.get("changes", {})),
        "profile_changed": lambda: on_member_profile_changed(user or data, data.get("changes", {})),
        "membership_purchased": lambda: on_membership_event("purchased", user or {}, data),
        "membership_renewed": lambda: on_membership_event("renewed", user or {}, data),
        "membership_cancelled": lambda: on_membership_event("cancelled", user or {}, data),
        "membership_expiring": lambda: on_membership_event("expiring_soon", user or {}, data),
        "pet_added": lambda: on_pet_added(data, user or {}),
        "health_record_added": lambda: on_health_record_added(data, pet or {}, user or {}),
        "booking_made": lambda: on_booking_made(data.get("type", "general"), data, user or {}, pet),
        "voice_order": lambda: on_voice_order_received(data, user or {})
    }
    
    handler = handlers.get(event_type)
    if handler:
        return await handler()
    else:
        # Generic ticket creation
        return await create_auto_ticket(
            event_type="general",
            pillar=data.get("pillar", "general"),
            urgency=data.get("urgency", "medium"),
            subject=data.get("subject", f"Event: {event_type}"),
            description=data.get("description", str(data)),
            member=user,
            pet=pet,
            metadata=data,
            action_required=data.get("action_required", True)
        )
