"""
Service Ticket Spine Helper - Route Migration Adapter
======================================================
Bible Section 12.0: Uniform Service Flow

NON-NEGOTIABLE: ALL service ticket creation MUST go through this helper.
Any ticket created outside this helper is a SPINE VIOLATION.

Usage:
    from utils.spine_helper import handoff_to_spine
    
    result = await handoff_to_spine(
        db=db,
        route_name="dine_routes.py",
        endpoint="/dine/reservations",
        pillar="dine",
        category="reservation",
        intent="Dine reservation at Restaurant XYZ",
        user={"email": "...", "name": "...", "phone": "..."},
        pet={"id": "...", "name": "...", "breed": "..."},
        payload={...},
        channel="web"
    )
    
    # result = {
    #     "success": True,
    #     "ticket_id": "TCK-2026-000123",
    #     "action": "created" | "attached",
    #     "deep_link": "/services?ticket_id=TCK-2026-000123",
    #     "message": "Ticket created successfully"
    # }
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

# Import the canonical spine
from utils.service_ticket_spine import (
    create_or_attach_service_ticket,
    Pillar,
    Channel,
    CreatedBy,
    TERMINAL_STATUSES
)

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# SPINE VIOLATION DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

SPINE_VIOLATION_LOG = []

def log_spine_violation(source: str, ticket_id: str, details: str = ""):
    """
    Log a spine violation when a ticket is created outside the helper.
    This is a guardrail to prevent regression.
    """
    violation = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "ticket_id": ticket_id,
        "details": details
    }
    SPINE_VIOLATION_LOG.append(violation)
    logger.warning(f"[SPINE-VIOLATION] ticket created outside service_ticket_spine: {source} → {ticket_id} | {details}")
    return violation


def check_for_spine_violation(ticket_id: str) -> bool:
    """
    Check if a ticket ID follows the canonical format TCK-YYYY-NNNNNN.
    Non-canonical IDs are violations.
    """
    import re
    return not bool(re.match(r'^TCK-\d{4}-\d{6}$', ticket_id))


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

PILLAR_MAP = {
    "stay": Pillar.STAY.value,
    "dine": Pillar.DINE.value,
    "celebrate": Pillar.CELEBRATE.value,
    "care": Pillar.CARE.value,
    "enjoy": Pillar.ENJOY.value,
    "fit": Pillar.FIT.value,
    "learn": Pillar.LEARN.value,
    "travel": Pillar.TRAVEL.value,
    "paperwork": Pillar.PAPERWORK.value,
    "emergency": Pillar.EMERGENCY.value,
    "general": Pillar.GENERAL.value,
    # Aliases and non-enum pillars
    "advisory": "advisory",
    "adopt": "adopt",
    "farewell": "farewell",
    "shop": "shop",
    "services": "services",
    "membership": "membership",
    "whatsapp": "whatsapp"
}

CHANNEL_MAP = {
    "web": Channel.WEB.value,
    "whatsapp": Channel.WHATSAPP.value,
    "email": Channel.EMAIL.value,
    "phone": Channel.PHONE.value,
    "chat": Channel.CHAT.value,
    "mira": Channel.MIRA.value,
    "admin": Channel.ADMIN.value,
    "api": Channel.API.value
}


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN HELPER FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

async def handoff_to_spine(
    db,
    route_name: str,
    endpoint: str,
    pillar: str,
    category: str,
    intent: str,
    user: Dict[str, Any] = None,
    pet: Dict[str, Any] = None,
    payload: Dict[str, Any] = None,
    channel: str = "web",
    intent_type: str = "request",
    urgency: str = "normal",
    created_by: str = "member",
    parent_ticket_id: str = None,
    notify_admin: bool = True,
    notify_member: bool = True,
    tags: List[str] = None
) -> Dict[str, Any]:
    """
    Unified helper for ALL route migrations to the service ticket spine.
    
    This function:
    - Calls create_or_attach_service_ticket()
    - Enforces canonical TCK-YYYY-NNNNNN format
    - Attaches source_route, endpoint, channel, created_by, pillar, category
    - Returns a standard response shape for frontend stability
    
    Args:
        db: Database connection
        route_name: Name of the calling route file (e.g., "dine_routes.py")
        endpoint: API endpoint path (e.g., "/dine/reservations")
        pillar: Service pillar (stay, dine, celebrate, care, etc.)
        category: Ticket category (booking, reservation, request, etc.)
        intent: Human-readable description of the request
        user: User info dict {"email": str, "name": str, "phone": str}
        pet: Pet info dict {"id": str, "name": str, "breed": str}
        payload: Additional payload data to attach to ticket
        channel: Source channel (web, whatsapp, email, phone, chat, mira, admin, api)
        intent_type: Type of intent (request, inquiry, complaint, feedback)
        urgency: Urgency level (low, normal, high, critical, emergency)
        created_by: Who created the ticket (member, concierge, system, admin)
        parent_ticket_id: Optional parent ticket ID to attach to
        notify_admin: Whether to send admin notification
        notify_member: Whether to send member notification
        tags: Optional list of tags
    
    Returns:
        {
            "success": bool,
            "ticket_id": str (canonical TCK-YYYY-NNNNNN),
            "action": "created" | "attached",
            "deep_link": str,
            "message": str,
            "error": str (only if success=False)
        }
    """
    user = user or {}
    pet = pet or {}
    payload = payload or {}
    tags = tags or []
    
    # Normalize pillar and channel
    normalized_pillar = PILLAR_MAP.get(pillar.lower(), pillar)
    normalized_channel = CHANNEL_MAP.get(channel.lower(), channel)
    
    # Map created_by
    created_by_map = {
        "member": CreatedBy.MEMBER.value,
        "concierge": CreatedBy.CONCIERGE.value,
        "system": CreatedBy.SYSTEM.value,
        "admin": CreatedBy.ADMIN.value,
        "mira": CreatedBy.MIRA.value
    }
    normalized_created_by = created_by_map.get(created_by.lower(), CreatedBy.MEMBER.value)
    
    # Extract user info
    member_email = user.get("email", "")
    member_name = user.get("name", "")
    member_phone = user.get("phone", "")
    
    # Extract pet info
    pet_ids = []
    pet_names = []
    if pet:
        if pet.get("id"):
            pet_ids.append(pet["id"])
        if pet.get("name"):
            pet_names.append(pet["name"])
    
    # Enhance payload with route metadata
    enhanced_payload = {
        **payload,
        "_spine_metadata": {
            "source_route": route_name,
            "endpoint": endpoint,
            "migrated_via": "handoff_to_spine",
            "migration_timestamp": datetime.now(timezone.utc).isoformat()
        }
    }
    
    # Add user info to payload if not already present
    if member_phone and "phone" not in enhanced_payload:
        enhanced_payload["phone"] = member_phone
    
    try:
        # Call the canonical spine
        result = await create_or_attach_service_ticket(
            db=db,
            intent=intent,
            intent_type=intent_type,
            member_email=member_email,
            member_name=member_name,
            pet_ids=pet_ids,
            pet_names=pet_names,
            pillar=normalized_pillar,
            category=category,
            source_route=route_name,
            channel=normalized_channel,
            created_by=normalized_created_by,
            payload=enhanced_payload,
            urgency=urgency,
            parent_ticket_id=parent_ticket_id,
            notify_admin=notify_admin,
            notify_member=notify_member,
            tags=tags
        )
        
        ticket_id = result.get("ticket_id")
        action = result.get("action", "created")
        
        # Verify canonical format
        if ticket_id and check_for_spine_violation(ticket_id):
            log_spine_violation(route_name, ticket_id, f"Non-canonical ID returned from spine at {endpoint}")
        
        logger.info(f"[SPINE-HELPER] {route_name}:{endpoint} → {ticket_id} ({action}) | pillar={normalized_pillar} category={category}")
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "action": action,
            "deep_link": f"/services?ticket_id={ticket_id}",
            "message": result.get("message", f"Ticket {action} successfully")
        }
        
    except Exception as e:
        logger.error(f"[SPINE-HELPER] FAILED at {route_name}:{endpoint} | Error: {e}")
        return {
            "success": False,
            "ticket_id": None,
            "action": "failed",
            "deep_link": None,
            "message": "Failed to create ticket",
            "error": str(e)
        }


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY WRAPPER - For gradual migration
# ═══════════════════════════════════════════════════════════════════════════════

async def migrate_legacy_ticket_call(
    db,
    legacy_event_type: str,
    legacy_data: Dict[str, Any],
    route_name: str,
    endpoint: str
) -> Dict[str, Any]:
    """
    Wrapper to migrate legacy create_ticket_from_event calls to the spine.
    
    Maps old event types to new pillar/category combinations.
    """
    # Legacy event type to pillar/category mapping
    EVENT_TYPE_MAP = {
        "stay_booking": ("stay", "booking_request"),
        "dine_reservation": ("dine", "reservation"),
        "buddy_visit": ("dine", "buddy_visit"),
        "meetup_request": ("dine", "meetup_request"),
        "celebration_request": ("celebrate", "party_request"),
        "cake_order": ("celebrate", "cake_order"),
        "gift_request": ("celebrate", "gift_request"),
        "grooming_request": ("care", "grooming"),
        "vet_appointment": ("care", "vet_appointment"),
        "training_session": ("fit", "training"),
        "travel_request": ("travel", "travel_booking"),
        "emergency_request": ("emergency", "emergency"),
        "paperwork_request": ("paperwork", "document_request"),
        "membership_signup": ("membership", "signup"),
        "general_inquiry": ("services", "inquiry")
    }
    
    pillar, category = EVENT_TYPE_MAP.get(legacy_event_type, ("services", "general"))
    
    # Extract common fields from legacy data
    user = {
        "email": legacy_data.get("email", legacy_data.get("guest_email", "")),
        "name": legacy_data.get("name", legacy_data.get("guest_name", "")),
        "phone": legacy_data.get("phone", legacy_data.get("guest_phone", ""))
    }
    
    pet = {
        "id": legacy_data.get("pet_id", ""),
        "name": legacy_data.get("pet_name", ""),
        "breed": legacy_data.get("pet_breed", "")
    }
    
    # Build intent from legacy data
    intent = legacy_data.get("description", legacy_data.get("subject", f"{legacy_event_type} request"))
    
    return await handoff_to_spine(
        db=db,
        route_name=route_name,
        endpoint=endpoint,
        pillar=pillar,
        category=category,
        intent=intent,
        user=user,
        pet=pet,
        payload=legacy_data,
        channel=legacy_data.get("channel", "web")
    )


# ═══════════════════════════════════════════════════════════════════════════════
# VIOLATION MONITORING
# ═══════════════════════════════════════════════════════════════════════════════

def get_spine_violations() -> List[Dict[str, Any]]:
    """Get all logged spine violations for debugging."""
    return SPINE_VIOLATION_LOG.copy()


def clear_spine_violations():
    """Clear violation log (for testing)."""
    SPINE_VIOLATION_LOG.clear()


def get_violation_count() -> int:
    """Get count of spine violations."""
    return len(SPINE_VIOLATION_LOG)
