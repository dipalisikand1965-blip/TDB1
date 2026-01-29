"""
UNIFIED FLOW ENFORCER - SYSTEM-WIDE MANDATORY ENFORCEMENT
==========================================================

This module provides INESCAPABLE enforcement of the unified signal flow.
NO action endpoint can return success without creating:
  1. Notification
  2. Service Desk Ticket  
  3. Unified Inbox Entry

ARCHITECTURE:
- FastAPI Middleware intercepts ALL responses
- Action endpoints are registered and monitored
- Any action response missing IDs is BLOCKED
- Works identically on Desktop, Mobile, PWA, API calls

RULE: Desktop = Mobile = PWA = Any Device
"""

import os
import re
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Set
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Database reference - set during app startup
_db: AsyncIOMotorDatabase = None

# Action endpoints that MUST trigger unified flow
# Format: (method, path_pattern)
ACTION_ENDPOINTS: List[tuple] = [
    ("POST", r"/api/care/request"),
    ("POST", r"/api/travel/request"),
    ("POST", r"/api/fit/request"),
    ("POST", r"/api/enjoy/rsvp"),
    ("POST", r"/api/stay/booking"),
    ("POST", r"/api/stay/request"),
    ("POST", r"/api/dine/reservations"),
    ("POST", r"/api/dine/visits"),
    ("POST", r"/api/dine/meetup-request"),
    ("POST", r"/api/services/unified-book"),
    ("POST", r"/api/services/book"),
    ("POST", r"/api/concierge/request"),
    ("POST", r"/api/concierge/experience-request"),
    ("POST", r"/api/mira/chat"),  # Creates tickets on actionable intents
    ("POST", r"/api/adopt/interest"),
    ("POST", r"/api/adopt/application"),
    ("POST", r"/api/emergency/request"),
    ("POST", r"/api/farewell/request"),
    ("POST", r"/api/advisory/request"),
    ("POST", r"/api/learn/enrollment"),
    ("POST", r"/api/paperwork/request"),
]

# Required fields in response for unified flow
REQUIRED_UNIFIED_FIELDS = {"ticket_id", "notification_id", "inbox_id"}

# Endpoints exempt from unified flow (read-only, auth, etc.)
EXEMPT_PATTERNS = [
    r"/api/auth/",
    r"/api/admin/",
    r"/api/products",
    r"/api/search/",
    r"/api/pets/",
    r"/api/user/",
    r"/api/health",
    r"/api/cart/",
    r"/api/checkout/",
    r"/api/orders/",
    r"/api/mira/voice",  # Voice transcription only
    r"/api/mira/speak",  # TTS only
]


def init_enforcer(database: AsyncIOMotorDatabase):
    """Initialize the enforcer with database connection"""
    global _db
    _db = database
    logger.info("[UNIFIED ENFORCER] ✓ Initialized - ALL action endpoints will be monitored")
    logger.info(f"[UNIFIED ENFORCER] Monitoring {len(ACTION_ENDPOINTS)} action endpoints")


def is_action_endpoint(method: str, path: str) -> bool:
    """Check if this request is an action endpoint that requires unified flow"""
    # Check exemptions first
    for pattern in EXEMPT_PATTERNS:
        if re.match(pattern, path):
            return False
    
    # Check if it's a registered action endpoint
    for endpoint_method, endpoint_pattern in ACTION_ENDPOINTS:
        if method == endpoint_method and re.match(endpoint_pattern, path):
            return True
    
    return False


def get_iso_timestamp() -> str:
    """Get consistent ISO timestamp with timezone"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'


async def create_unified_flow_entries(
    category: str,
    signal_type: str,
    description: str,
    source: str = "web",
    member_name: str = None,
    member_email: str = None,
    member_phone: str = None,
    pet_name: str = None,
    pet_id: str = None,
    urgency: str = "medium",
    linked_entity_id: str = None,
    raw_data: dict = None
) -> Dict[str, str]:
    """
    CREATE ALL THREE UNIFIED FLOW ENTRIES IN ONE ATOMIC OPERATION.
    This is the ONLY function that should create these entries.
    
    Returns: {"ticket_id": "...", "notification_id": "...", "inbox_id": "..."}
    """
    if _db is None:
        logger.error("[UNIFIED ENFORCER] Database not initialized!")
        raise RuntimeError("Unified flow enforcer not initialized")
    
    now = get_iso_timestamp()
    
    # Generate IDs
    ticket_id = linked_entity_id or f"TKT-{category.upper()[:4]}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    
    member_info = {
        "name": member_name or "Unknown",
        "email": member_email,
        "phone": member_phone
    }
    
    pet_info = {"name": pet_name, "id": pet_id} if pet_name or pet_id else None
    
    # === 1. NOTIFICATION ===
    notification_doc = {
        "id": notification_id,
        "type": f"{category}_{signal_type}",
        "pillar": category,
        "title": f"New {signal_type.replace('_', ' ').title()} - {category.title()}",
        "message": description[:200] if description else f"New {signal_type} request",
        "read": False,
        "status": "unread",
        "urgency": urgency,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": member_info,
        "pet": pet_info,
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now,
        "read_at": None
    }
    
    # === 2. SERVICE DESK TICKET ===
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": signal_type,
        "category": category,
        "pillar": category,
        "subject": f"{signal_type.replace('_', ' ').title()} - {category.title()}",
        "description": description,
        "status": "new",
        "priority": "high" if urgency == "critical" else ("medium" if urgency == "high" else "normal"),
        "urgency": urgency,
        "channel": source,
        "member": member_info,
        "pet": pet_info,
        "source_reference": linked_entity_id,
        "created_at": now,
        "updated_at": now,
        "unified_flow_enforced": True
    }
    
    # === 3. UNIFIED INBOX ===
    inbox_doc = {
        "id": inbox_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "request_id": linked_entity_id or ticket_id,
        "channel": source,
        "pillar": category,
        "category": category,
        "request_type": signal_type,
        "status": "new",
        "urgency": urgency,
        "customer_name": member_name,
        "customer_email": member_email,
        "customer_phone": member_phone,
        "member": member_info,
        "pet": pet_info,
        "preview": description[:100] if description else f"New {signal_type}",
        "message": description,
        "full_content": description,
        "metadata": raw_data or {},
        "tags": [category, signal_type],
        "created_at": now,
        "updated_at": now,
        "unified_flow_enforced": True
    }
    
    # Insert all three atomically
    try:
        await _db.admin_notifications.insert_one(notification_doc)
        await _db.service_desk_tickets.insert_one(ticket_doc)
        await _db.channel_intakes.insert_one(inbox_doc)
        
        logger.info(f"[UNIFIED ENFORCER] ✓ COMPLETE: {category}/{signal_type} → N:{notification_id} T:{ticket_id} I:{inbox_id}")
        
        return {
            "ticket_id": ticket_id,
            "notification_id": notification_id,
            "inbox_id": inbox_id
        }
    except Exception as e:
        logger.error(f"[UNIFIED ENFORCER] ✗ FAILED to create unified flow: {e}")
        raise


def validate_unified_response(response_data: dict) -> tuple[bool, List[str]]:
    """
    Validate that response contains all required unified flow fields.
    Returns: (is_valid, missing_fields)
    """
    if not isinstance(response_data, dict):
        return False, list(REQUIRED_UNIFIED_FIELDS)
    
    # Check for success indicator
    if response_data.get("success") == False:
        # Failed requests don't need unified flow
        return True, []
    
    # Check for error responses
    if "error" in response_data or "detail" in response_data:
        return True, []
    
    missing = []
    for field in REQUIRED_UNIFIED_FIELDS:
        if not response_data.get(field):
            missing.append(field)
    
    return len(missing) == 0, missing


class UnifiedFlowMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces unified flow on ALL action endpoints.
    
    This middleware:
    1. Identifies action endpoints (POST requests that create something)
    2. Intercepts the response
    3. Validates unified flow fields are present
    4. BLOCKS responses that don't have all required fields
    
    RULE: No device gets special treatment. Desktop = Mobile = PWA.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get request info
        method = request.method
        path = request.url.path
        
        # Check if this is an action endpoint
        if not is_action_endpoint(method, path):
            # Not an action endpoint - pass through
            return await call_next(request)
        
        logger.info(f"[UNIFIED ENFORCER] Monitoring: {method} {path}")
        
        # Call the actual endpoint
        response = await call_next(request)
        
        # Only validate successful JSON responses
        if response.status_code != 200:
            return response
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response
        
        # Read and parse response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        try:
            response_data = json.loads(body.decode())
        except json.JSONDecodeError:
            # Not valid JSON - pass through
            return Response(content=body, status_code=response.status_code, headers=dict(response.headers))
        
        # Validate unified flow
        is_valid, missing = validate_unified_response(response_data)
        
        if not is_valid:
            # BLOCK THE RESPONSE - unified flow not complete
            logger.error(f"[UNIFIED ENFORCER] ✗ BLOCKED {path}: Missing {missing}")
            
            # Return error response
            error_response = {
                "success": False,
                "error": "unified_flow_incomplete",
                "message": f"Action failed: System integrity check failed. Missing: {', '.join(missing)}",
                "missing_fields": missing
            }
            return JSONResponse(content=error_response, status_code=500)
        
        logger.info(f"[UNIFIED ENFORCER] ✓ PASSED {path}: All unified flow fields present")
        
        # Return original response
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )


# Export for use in routes
async def enforce_unified_flow(
    category: str,
    signal_type: str,
    description: str,
    **kwargs
) -> Dict[str, str]:
    """
    Convenience function for routes to call.
    Ensures unified flow is created and returns the IDs.
    
    Usage in routes:
        flow_ids = await enforce_unified_flow(
            category="travel",
            signal_type="cab_request",
            description="Cab booking from Mumbai to Pune",
            member_name="John",
            member_email="john@example.com"
        )
        # flow_ids = {"ticket_id": "...", "notification_id": "...", "inbox_id": "..."}
    """
    return await create_unified_flow_entries(
        category=category,
        signal_type=signal_type,
        description=description,
        **kwargs
    )
