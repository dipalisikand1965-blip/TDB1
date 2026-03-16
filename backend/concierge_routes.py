"""
Concierge Command Center API
============================
Unified queue for all actionable items across the platform.

"The Command Center is not a dashboard. It is the concierge's desk.
Everything opens into it, nothing pulls you away from it."
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from timestamp_utils import get_utc_timestamp
from bson import ObjectId
import logging
import os

# Import ticket intelligence features
from ticket_intelligence import (
    analyze_sentiment,
    send_ticket_acknowledgment,
    enrich_ticket_with_intelligence,
    send_nps_survey,
    record_nps_response,
    set_intelligence_db
)

# Import push notification for ticket updates
try:
    from push_notification_routes import notify_ticket_update
    PUSH_AVAILABLE = True
except ImportError:
    PUSH_AVAILABLE = False
    async def notify_ticket_update(*args, **kwargs):
        return {"success": False, "reason": "push_not_available"}

# Import Trait Graph service for MOJO updates on service completion
# Per MOJO Bible Part 7 §4: "When tasks complete: update traits with high confidence"
try:
    from trait_graph_service import on_service_completed
    TRAIT_GRAPH_AVAILABLE = True
except ImportError:
    TRAIT_GRAPH_AVAILABLE = False
    async def on_service_completed(*args, **kwargs):
        return {"success": False, "reason": "trait_graph_not_available"}

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/concierge", tags=["concierge"])

# Database reference
_db = None

def set_concierge_db(db):
    global _db
    _db = db
    # Also set db for intelligence module
    set_intelligence_db(db)

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ============== PRIORITY CALCULATION ==============

PRIORITY_WEIGHTS = {
    # Source type weights
    "emergency": 100,
    "health_alert": 80,
    "travel": 60,
    "care": 50,
    "dining": 40,
    "stay": 40,
    "order": 30,
    "inbox": 25,
    "general": 20,
    
    # Time weights (hours old)
    "time_24h": 20,
    "time_48h": 30,
    "time_72h": 50,
    
    # Member tier weights
    "lifetime": 25,
    "annual": 15,
    "monthly": 10,
    
    # Status weights
    "escalated": 50,
    "sla_breach": 60,
    "unclaimed": 10
}

SLA_HOURS = {
    "urgent": 2,
    "high": 4,
    "medium": 24,
    "low": 48
}

# Auto-assignment configuration
AGENT_SKILLS = {
    # Maps pillars to capable agents (will be stored in DB later)
    "default": ["aditya", "concierge_team"]
}

def calculate_priority_score(item: Dict) -> int:
    """Calculate priority score for queue sorting."""
    score = 0
    
    # Base score by source/type
    source = item.get("source_type", "general")
    action_type = item.get("action_type", "")
    
    if source == "emergency" or "emergency" in action_type:
        score += PRIORITY_WEIGHTS["emergency"]
    elif source == "health_alert" or "health" in action_type:
        score += PRIORITY_WEIGHTS["health_alert"]
    elif "travel" in action_type:
        score += PRIORITY_WEIGHTS["travel"]
    elif "care" in action_type or "grooming" in action_type:
        score += PRIORITY_WEIGHTS["care"]
    elif "dining" in action_type or "dine" in source:
        score += PRIORITY_WEIGHTS["dining"]
    elif "stay" in action_type or "hotel" in action_type:
        score += PRIORITY_WEIGHTS["stay"]
    elif source == "order":
        score += PRIORITY_WEIGHTS["order"]
    elif source == "inbox":
        score += PRIORITY_WEIGHTS["inbox"]
    else:
        score += PRIORITY_WEIGHTS["general"]
    
    # Time-based urgency
    created_at = item.get("created_at")
    if created_at:
        try:
            if isinstance(created_at, str):
                created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            else:
                created = created_at
            
            hours_old = (datetime.now(timezone.utc) - created).total_seconds() / 3600
            
            if hours_old > 72:
                score += PRIORITY_WEIGHTS["time_72h"]
            elif hours_old > 48:
                score += PRIORITY_WEIGHTS["time_48h"]
            elif hours_old > 24:
                score += PRIORITY_WEIGHTS["time_24h"]
        except:
            pass
    
    # Member tier bonus
    member = item.get("member") or {}
    member_tier = member.get("membership_tier", "free") if member else "free"
    if member_tier == "lifetime":
        score += PRIORITY_WEIGHTS["lifetime"]
    elif member_tier == "annual":
        score += PRIORITY_WEIGHTS["annual"]
    elif member_tier == "monthly":
        score += PRIORITY_WEIGHTS["monthly"]
    
    # Status modifiers
    if item.get("escalated"):
        score += PRIORITY_WEIGHTS["escalated"]
    if item.get("sla_breached"):
        score += PRIORITY_WEIGHTS["sla_breach"]
    if not item.get("assigned_to"):
        score += PRIORITY_WEIGHTS["unclaimed"]
    
    return score

def get_priority_bucket(score: int) -> str:
    """Convert score to priority bucket."""
    if score >= 80:
        return "urgent"
    elif score >= 50:
        return "high"
    elif score >= 30:
        return "medium"
    else:
        return "low"

def check_sla_breach(item: Dict) -> bool:
    """Check if item has breached SLA."""
    created_at = item.get("created_at")
    priority = item.get("priority", "medium")
    status = item.get("status", "pending")
    
    if status in ["resolved", "closed"]:
        return False
    
    if not created_at:
        return False
    
    try:
        if isinstance(created_at, str):
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        else:
            created = created_at
        
        sla_hours = SLA_HOURS.get(priority, 24)
        deadline = created + timedelta(hours=sla_hours)
        
        return datetime.now(timezone.utc) > deadline
    except:
        return False


# ============== MODELS ==============

class ClaimRequest(BaseModel):
    agent_id: str
    agent_name: str

# ResolveRequest is defined later with enhanced NPS survey support

class AddNoteRequest(BaseModel):
    note: str
    is_internal: bool = True
    agent_id: str
    agent_name: str


class ConciergeExperienceRequest(BaseModel):
    """Model for elevated concierge experience requests from pillar cards."""
    pillar: str  # travel, stay, care, enjoy, learn, dine, celebrate, etc.
    experience_type: str
    experience_title: str
    message: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None  # Deprecated, use user_whatsapp
    user_whatsapp: Optional[str] = None
    pet_name: Optional[str] = None
    pet_selection: Optional[str] = None  # 'all' or specific pet id
    source: Optional[str] = "concierge_experience_card"


# ============== CONCIERGE EXPERIENCE REQUEST ENDPOINT ==============

@router.post("/experience-request")
async def create_experience_request(request: ConciergeExperienceRequest):
    """
    Create a concierge experience request from pillar cards.
    This creates a conversation starter, not a booking.
    
    UNIFIED FLOW: Every request creates Notification → Ticket → Inbox
    """
    db = get_db()
    import uuid
    from timestamp_utils import get_utc_timestamp
    
    request_id = f"conc-{uuid.uuid4().hex[:8]}"
    ticket_id = f"EXP-{uuid.uuid4().hex[:8]}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = get_utc_timestamp()
    
    user_name = request.user_name or "Guest"
    pet_name = request.pet_name or "Pet"
    pillar_title = request.pillar.capitalize()
    
    # Create concierge request record
    request_doc = {
        "id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": "experience_request",
        "pillar": request.pillar,
        "experience_type": request.experience_type,
        "experience_title": request.experience_title,
        "message": request.message,
        "user_name": user_name,
        "user_email": request.user_email,
        "user_whatsapp": request.user_whatsapp or request.user_phone,
        "pet_name": pet_name,
        "pet_selection": request.pet_selection,
        "source": request.source,
        "status": "new",
        "priority": "normal",
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True,
        "timeline": [
            {
                "status": "new",
                "timestamp": now_iso,
                "note": f"Request submitted via Concierge Experience Card - {pillar_title} Pillar"
            }
        ]
    }
    
    await db.concierge_requests.insert_one(request_doc)
    
    # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": f"concierge_{request.pillar}",
        "pillar": request.pillar,
        "title": f"Concierge Request: {request.experience_title} - {pet_name}",
        "message": f"{user_name} is interested in {request.experience_title}. Message: {request.message[:100]}...",
        "read": False,
        "status": "unread",
        "urgency": "medium",
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": user_name,
            "email": request.user_email,
            "phone": request.user_whatsapp or request.user_phone
        },
        "pet": {
            "name": pet_name
        },
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now_iso,
        "read_at": None
    })
    logger.info(f"[UNIFIED FLOW] Concierge notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (MANDATORY) ====================
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": "concierge_inquiry",
        "source": "concierge_card",
        "source_id": request_id,
        "pillar": request.pillar,
        "category": "concierge",
        "subcategory": request.experience_type,
        "subject": f"Concierge Request: {request.experience_title}",
        "description": request.message,
        "original_request": f"[{request.pillar.upper()}] {request.experience_title}: {request.message[:200]}",
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "member": {
            "name": user_name,
            "email": request.user_email,
            "phone": request.user_whatsapp or request.user_phone
        },
        "pet": {
            "name": pet_name
        },
        "concierge_request_id": request_id,
        "created_at": now_iso,
        "updated_at": now_iso,
        "tags": [request.pillar, "concierge", request.experience_type, "unified-flow"],
        "unified_flow_processed": True,
        "audit_trail": [
            {
                "action": "created",
                "timestamp": now_iso,
                "performed_by": "system",
                "details": f"Created from {pillar_title} concierge experience card"
            }
        ]
    }
    
    # Insert into BOTH ticket collections for unified visibility
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Concierge ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (MANDATORY) ====================
    inbox_entry = {
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "request_type": "concierge",
        "pillar": request.pillar,
        "category": request.experience_type,
        "status": "new",
        "urgency": "medium",
        "customer_name": user_name,
        "customer_email": request.user_email,
        "customer_phone": request.user_whatsapp or request.user_phone,
        "member": {
            "name": user_name,
            "email": request.user_email,
            "phone": request.user_whatsapp or request.user_phone
        },
        "pet": {
            "name": pet_name
        },
        "preview": f"{request.experience_title} - {pet_name}",
        "message": request.message,
        "tags": [request.pillar, "concierge", request.experience_type],
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True
    }
    
    await db.channel_intakes.insert_one({k: v for k, v in inbox_entry.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Concierge inbox created: {inbox_id}")
    
    # ==================== STEP 4: MEMBER NOTIFICATION (MANDATORY) ====================
    # User must see confirmation in their notification bell
    if request.user_email:
        try:
            member_notification_id = f"MNOTIF-{uuid.uuid4().hex[:8].upper()}"
            member_notification = {
                "id": member_notification_id,
                "type": "experience_request_received",
                "title": f"Request Received: {request.experience_title}",
                "message": f"Your {pillar_title} request for {pet_name} has been sent to Concierge®. We'll get back to you soon!",
                "pet_name": pet_name,
                "user_email": request.user_email.lower(),
                "ticket_id": ticket_id,
                "request_id": request_id,
                "pillar": request.pillar,
                "read": False,
                "created_at": now_iso,
                "data": {
                    "thread_url": f"/mira-demo?tab=services&thread={ticket_id}",
                    "experience_title": request.experience_title
                }
            }
            await db.member_notifications.insert_one(member_notification)
            logger.info(f"[UNIFIED FLOW] Member notification created: {member_notification_id}")
        except Exception as notif_error:
            logger.error(f"[UNIFIED FLOW] Failed to create member notification: {notif_error}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: Concierge {request_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id}) → MemberNotif")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "message": "Your request has been received. Our concierge will reach out within 24 hours."
    }


# ============== CONCIERGE® EXPERIENCE REQUEST MANAGEMENT ==============

# ============== MIRA RECOMMENDATION REQUEST (NEW - from FAB) ==============

class MiraRecommendation(BaseModel):
    """Single recommendation from Mira."""
    title: str
    description: Optional[str] = None
    type: str = "product"
    why_right: Optional[str] = None

class MiraRecommendationRequest(BaseModel):
    """Request model for Mira's concierge recommendations."""
    type: str  # "mira_recommendation" or "mira_bundle"
    pet_id: Optional[str] = None
    pet_name: Optional[str] = "your pet"
    user_email: Optional[str] = None  # For member notification
    pillar: Optional[str] = "general"  # Pillar context
    recommendation: Optional[MiraRecommendation] = None  # Single recommendation
    recommendations: Optional[List[MiraRecommendation]] = None  # Bundle of recommendations
    source: str = "mira_fab"
    priority: str = "normal"

@router.post("/mira-request")
async def create_mira_concierge_request(request: MiraRecommendationRequest):
    """
    Create a concierge request from Mira's recommendations.
    
    MIRA OS DOCTRINE:
    - Mira recommends, Concierge delivers
    - No catalog matching needed - Concierge sources exactly what Mira suggested
    """
    db = get_db()
    import uuid
    from timestamp_utils import get_utc_timestamp
    
    request_id = f"MIRA-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-MIRA-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    now_iso = get_utc_timestamp()
    
    # Combine single recommendation or bundle
    all_recs = []
    if request.recommendation:
        all_recs.append(request.recommendation.dict())
    if request.recommendations:
        all_recs.extend([r.dict() for r in request.recommendations])
    
    if not all_recs:
        return {"success": False, "error": "No recommendations provided"}
    
    # Build description from recommendations
    rec_descriptions = []
    for rec in all_recs:
        desc = f"• {rec['title']}"
        if rec.get('why_right'):
            desc += f" ({rec['why_right']})"
        rec_descriptions.append(desc)
    
    full_description = f"Mira's picks for {request.pet_name}:\n" + "\n".join(rec_descriptions)
    
    # Create the request document
    request_doc = {
        "id": request_id,
        "ticket_id": ticket_id,
        "type": request.type,
        "source": request.source,
        "pet_id": request.pet_id,
        "pet_name": request.pet_name,
        "recommendations": all_recs,
        "description": full_description,
        "status": "new",
        "priority": request.priority,
        "created_at": now_iso,
        "updated_at": now_iso,
        "mira_sourced": True,  # Flag that this came from Mira's intelligence
        "timeline": [
            {
                "status": "new",
                "timestamp": now_iso,
                "note": f"Request created from Mira FAB - {len(all_recs)} recommendation(s)"
            }
        ]
    }
    
    await db.concierge_requests.insert_one({k: v for k, v in request_doc.items() if k != "_id"})
    
    # Also create a ticket for visibility
    ticket_doc = {
        "id": ticket_id,
        "request_id": request_id,
        "type": "mira_recommendation",
        "title": f"Mira's Picks for {request.pet_name}",
        "description": full_description,
        "status": "open",
        "priority": request.priority,
        "pet_name": request.pet_name,
        "pet_id": request.pet_id,
        "source": "mira_fab",
        "mira_sourced": True,
        "recommendations": all_recs,
        "created_at": now_iso,
        "updated_at": now_iso,
        "tags": ["mira", "concierge", request.type]
    }
    
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    
    logger.info(f"[MIRA CONCIERGE] Created request {request_id} with {len(all_recs)} recommendations for {request.pet_name}")
    
    # ═══════════════════════════════════════════════════════════════════════
    # CREATE MEMBER NOTIFICATION - So user sees it in their notification bell
    # ═══════════════════════════════════════════════════════════════════════
    try:
        member_notification_id = f"MNOTIF-{uuid.uuid4().hex[:8].upper()}"
        user_email = request.user_email.lower() if request.user_email else None
        
        if user_email:
            member_notification = {
                "id": member_notification_id,
                "type": "mira_request_received",
                "title": f"Request Received: {request.pet_name}",
                "message": f"Your Mira picks ({len(all_recs)} item(s)) for {request.pet_name} have been sent to Concierge®. We'll get back to you soon!",
                "pet_name": request.pet_name,
                "pet_id": request.pet_id,
                "user_email": user_email,
                "ticket_id": ticket_id,
                "request_id": request_id,
                "pillar": request.pillar or "general",
                "read": False,
                "created_at": now_iso,
                "data": {
                    "thread_url": f"/mira-demo?tab=services&thread={ticket_id}",
                    "items_count": len(all_recs)
                }
            }
            await db.member_notifications.insert_one(member_notification)
            logger.info(f"[MIRA CONCIERGE] Created member notification: {member_notification_id} for {request.pet_name}")
        else:
            logger.warning(f"[MIRA CONCIERGE] No user_email provided, skipping member notification")
    except Exception as notif_error:
        logger.error(f"[MIRA CONCIERGE] Failed to create member notification: {notif_error}")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "recommendations_count": len(all_recs),
        "message": f"We'll source exactly what Mira recommended for {request.pet_name}"
    }


class ConciergeGeneralRequest(BaseModel):
    """Model for general Concierge® requests from modal forms."""
    pillar: str
    experience_id: Optional[str] = None
    experience_name: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    preferred_contact: Optional[str] = "whatsapp"
    user_id: Optional[str] = None
    source: Optional[str] = "website"


class NutritionPathRequest(BaseModel):
    """Request model for Guided Nutrition Path hand-to-concierge."""
    petId: Optional[str] = None
    petName: Optional[str] = "your pet"
    pathId: Optional[str] = None
    pathTitle: Optional[str] = None
    selections: Optional[dict] = None


@router.post("/nutrition-path")
async def submit_nutrition_path(request: NutritionPathRequest):
    """
    Submit a guided nutrition path to the Concierge.
    Follows the unified service flow: intake → admin notification → ticket → channel intake.
    Returns: { success, message, intakeId }
    """
    db = get_db()
    import uuid

    intake_id = f"NUTR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    path_title = request.pathTitle or (request.pathId or "Nutrition Path").replace("_", " ").title()
    pet_name = request.petName or "your pet"
    subject = f"Nutrition Path — {path_title} for {pet_name}"

    intake_doc = {
        "id": intake_id, "ticket_id": ticket_id, "type": "nutrition_path",
        "pet_id": request.petId, "pet_name": pet_name,
        "path_id": request.pathId, "path_title": path_title,
        "selections": request.selections, "source": "guided_nutrition_paths",
        "status": "new", "created_at": now_iso
    }
    await db.concierge_intakes.insert_one({k: v for k, v in intake_doc.items() if k != "_id"})

    await db.admin_notifications.insert_one({
        "id": notification_id, "type": "nutrition_path", "pillar": "dine",
        "title": f"Nutrition Path: {path_title} — {pet_name}",
        "message": f"Guided nutrition path completed for {pet_name}. Path: {path_title}.",
        "read": False, "status": "unread", "urgency": "medium",
        "ticket_id": ticket_id, "inbox_id": inbox_id, "intake_id": intake_id,
        "pet": {"name": pet_name}, "link": f"/agent-portal?tab=service_desk&ticket={ticket_id}",
        "created_at": now_iso, "read_at": None
    })

    ticket_doc = {
        "id": ticket_id, "ticket_id": ticket_id, "notification_id": notification_id,
        "inbox_id": inbox_id, "intake_id": intake_id, "type": "concierge_inquiry",
        "source": "guided_nutrition_paths", "source_id": intake_id,
        "pillar": "dine", "category": "nutrition", "subcategory": request.pathId or "general",
        "subject": subject, "description": f"Nutrition path completed: {path_title}",
        "status": "new", "priority": 3, "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "path_id": request.pathId, "selections": request.selections,
        "created_at": now_iso, "updated_at": now_iso,
        "tags": ["dine", "nutrition_path", request.pathId or "general"],
        "unified_flow_processed": True,
        "audit_trail": [{"action": "created", "timestamp": now_iso, "performed_by": "system",
                         "details": f"Created from Guided Nutrition Paths — {path_title}"}]
    }
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})

    await db.channel_intakes.insert_one({k: v for k, v in {
        "id": inbox_id, "ticket_id": ticket_id, "intake_id": intake_id,
        "channel": "web", "request_type": "nutrition_path", "pillar": "dine",
        "category": request.pathId or "general", "status": "new", "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "preview": subject, "created_at": now_iso, "updated_at": now_iso,
    }.items() if k != "_id"})

    logger.info(f"[UNIFIED FLOW] Nutrition path complete: {intake_id} | ticket: {ticket_id} | pet: {pet_name} | path: {request.pathId}")

    return {
        "success": True,
        "message": f"{path_title} sent to your Concierge. They'll reach out within 48 hours.",
        "intakeId": intake_id
    }



    petId: Optional[str] = None
    petName: Optional[str] = "your pet"
    serviceType: Optional[str] = "general"
    celebrationDate: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = "concierge_intake_modal"


class DiningIntakeRequest(BaseModel):
    """Request model for Dine Concierge® intake form."""
    petId: Optional[str] = None
    petName: Optional[str] = "your pet"
    occasion: Optional[str] = "general"
    date: Optional[str] = None
    notes: Optional[str] = None
    allergies: Optional[str] = None


@router.post("/dining-intake")
async def create_dining_concierge_intake(request: DiningIntakeRequest):
    """
    Submit a dining concierge intake from the /dine page modal.
    Goes through the full unified service flow:
    User Request → Service Desk Ticket → Admin Notification → Channel Intake
    Returns: { success, message, intakeId }
    """
    db = get_db()
    import uuid

    intake_id = f"DINT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    occasion_label = (request.occasion or "general").replace("_", " ").title()
    pet_name = request.petName or "your pet"
    subject = f"Dine Intake — {occasion_label} for {pet_name}"
    description = request.notes or "No additional notes provided."
    date_note = f"Date: {request.date}" if request.date else "Date: Not confirmed yet"

    intake_doc = {
        "id": intake_id, "ticket_id": ticket_id, "type": "dining_concierge_intake",
        "pet_id": request.petId, "pet_name": pet_name,
        "occasion": request.occasion, "occasion_label": occasion_label,
        "dining_date": request.date, "notes": request.notes,
        "allergies": request.allergies, "source": "dine_intake_modal",
        "status": "new", "unified_flow_processed": True, "created_at": now_iso
    }
    await db.concierge_intakes.insert_one({k: v for k, v in intake_doc.items() if k != "_id"})

    await db.admin_notifications.insert_one({
        "id": notification_id, "type": "concierge_dine", "pillar": "dine",
        "title": f"Dine Intake: {occasion_label} — {pet_name}",
        "message": f"New dining intake for {pet_name}. {date_note}. Notes: {(request.notes or 'None')[:120]}",
        "read": False, "status": "unread", "urgency": "medium",
        "ticket_id": ticket_id, "inbox_id": inbox_id, "intake_id": intake_id,
        "pet": {"name": pet_name}, "link": f"/agent-portal?tab=service_desk&ticket={ticket_id}",
        "created_at": now_iso, "read_at": None
    })

    ticket_doc = {
        "id": ticket_id, "ticket_id": ticket_id, "notification_id": notification_id,
        "inbox_id": inbox_id, "intake_id": intake_id, "type": "concierge_inquiry",
        "source": "dine_intake_modal", "source_id": intake_id,
        "pillar": "dine", "category": "concierge", "subcategory": request.occasion or "general",
        "subject": subject, "description": f"{date_note}\n{description}",
        "original_request": f"[DINE] {occasion_label} for {pet_name}: {date_note}",
        "status": "new", "priority": 3, "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "dining_date": request.date, "allergies": request.allergies, "notes": request.notes,
        "created_at": now_iso, "updated_at": now_iso,
        "tags": ["dine", "concierge_intake", request.occasion or "general", "unified-flow"],
        "unified_flow_processed": True,
        "audit_trail": [{"action": "created", "timestamp": now_iso, "performed_by": "system",
                         "details": f"Created from Dine Concierge® intake modal — {occasion_label}"}]
    }
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})

    await db.channel_intakes.insert_one({k: v for k, v in {
        "id": inbox_id, "ticket_id": ticket_id, "notification_id": notification_id,
        "intake_id": intake_id, "channel": "web", "request_type": "dining_concierge_intake",
        "pillar": "dine", "category": request.occasion or "general",
        "status": "new", "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "preview": subject, "message": f"{date_note}. {description}",
        "tags": ["dine", "concierge_intake"], "created_at": now_iso, "updated_at": now_iso,
        "unified_flow_processed": True
    }.items() if k != "_id"})

    logger.info(f"[UNIFIED FLOW] Dine intake complete: {intake_id} | ticket: {ticket_id} | pet: {pet_name} | occasion: {request.occasion}")

    return {
        "success": True,
        "message": "Your Concierge has everything they need. Expect a message within 48 hours.",
        "intakeId": intake_id
    }



class ConciergeIntakeRequest(BaseModel):
    """Request model for Celebrate Concierge® intake form (3-question modal)."""
    petId: Optional[str] = None
    petName: Optional[str] = "your pet"
    serviceType: Optional[str] = "general"
    celebrationDate: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = "concierge_intake_modal"


@router.post("/intake")
async def create_concierge_intake(request: ConciergeIntakeRequest):
    """
    Submit a concierge intake from the 3-question modal on /celebrate-soul.
    Goes through the full unified service flow:
    User Request → Service Desk Ticket → Admin Notification → Channel Intake
    Returns: { success, message, intakeId }
    """
    db = get_db()
    import uuid

    intake_id = f"INT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    service_label = (request.serviceType or 'general').replace('_', ' ').title()
    pet_name = request.petName or 'your pet'
    subject = f"Celebrate Intake — {service_label} for {pet_name}"
    description = request.notes or f"No additional notes provided."
    date_note = f"Date: {request.celebrationDate}" if request.celebrationDate else "Date: Not confirmed yet"

    # ── 1. INTAKE RECORD ────────────────────────────────────────────────────────
    intake_doc = {
        "id": intake_id,
        "ticket_id": ticket_id,
        "type": "concierge_intake",
        "pet_id": request.petId,
        "pet_name": pet_name,
        "service_type": request.serviceType,
        "service_label": service_label,
        "celebration_date": request.celebrationDate,
        "notes": request.notes,
        "source": request.source,
        "status": "new",
        "unified_flow_processed": True,
        "created_at": now_iso
    }
    await db.concierge_intakes.insert_one({k: v for k, v in intake_doc.items() if k != "_id"})

    # ── 2. ADMIN NOTIFICATION ───────────────────────────────────────────────────
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": "concierge_celebrate",
        "pillar": "celebrate",
        "title": f"Celebrate Intake: {service_label} — {pet_name}",
        "message": f"New celebration intake for {pet_name}. {date_note}. Notes: {(request.notes or 'None')[:120]}",
        "read": False,
        "status": "unread",
        "urgency": "medium",
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "intake_id": intake_id,
        "pet": {"name": pet_name},
        "link": f"/agent-portal?tab=service_desk&ticket={ticket_id}",
        "created_at": now_iso,
        "read_at": None
    })

    # ── 3. SERVICE DESK TICKET (unified visibility) ─────────────────────────────
    ticket_doc = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "intake_id": intake_id,
        "type": "concierge_inquiry",
        "source": "celebrate_intake_modal",
        "source_id": intake_id,
        "pillar": "celebrate",
        "category": "concierge",
        "subcategory": request.serviceType or "general",
        "subject": subject,
        "description": f"{date_note}\n{description}",
        "original_request": f"[CELEBRATE] {service_label} for {pet_name}: {date_note}",
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "celebration_date": request.celebrationDate,
        "notes": request.notes,
        "created_at": now_iso,
        "updated_at": now_iso,
        "tags": ["celebrate", "concierge_intake", request.serviceType or "general", "unified-flow"],
        "unified_flow_processed": True,
        "audit_trail": [
            {
                "action": "created",
                "timestamp": now_iso,
                "performed_by": "system",
                "details": f"Created from Celebrate Concierge® intake modal — {service_label}"
            }
        ]
    }
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})

    # ── 4. CHANNEL INTAKE (unified inbox) ───────────────────────────────────────
    await db.channel_intakes.insert_one({k: v for k, v in {
        "id": inbox_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "intake_id": intake_id,
        "channel": "web",
        "request_type": "concierge_intake",
        "pillar": "celebrate",
        "category": request.serviceType or "general",
        "status": "new",
        "urgency": "medium",
        "pet": {"name": pet_name, "id": request.petId},
        "preview": subject,
        "message": f"{date_note}. {description}",
        "tags": ["celebrate", "concierge_intake"],
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True
    }.items() if k != "_id"})

    logger.info(f"[UNIFIED FLOW] Celebrate intake complete: {intake_id} | ticket: {ticket_id} | pet: {pet_name} | service: {request.serviceType}")

    return {
        "success": True,
        "message": "Your Concierge has everything they need. Expect a message within 48 hours.",
        "intakeId": intake_id
    }


@router.post("/request")
async def create_general_concierge_request(request: ConciergeGeneralRequest):
    """Create a general Concierge® request from the modal form."""
    db = get_db()
    import uuid
    
    request_id = f"conc-{uuid.uuid4().hex[:8]}"
    ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)
    
    logger.info(f"[UNIFIED FLOW] Processing Concierge request: {request_id} for pillar: {request.pillar}")
    
    # 1. Create concierge request record
    request_doc = {
        "id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": "general_inquiry",
        "pillar": request.pillar,
        "experience_id": request.experience_id,
        "experience_name": request.experience_name,
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "message": request.message,
        "preferred_contact": request.preferred_contact,
        "user_id": request.user_id,
        "source": request.source,
        "status": "new",
        "unified_flow_processed": True,
        "created_at": now,
        "updated_at": now,
        "timeline": [
            {
                "status": "new",
                "timestamp": now.isoformat(),
                "note": f"Request submitted via {request.source}"
            }
        ]
    }
    
    await db.concierge_requests.insert_one(request_doc)
    logger.info(f"[UNIFIED FLOW] STEP 0: Concierge request created: {request_id}")
    
    # ==================== STEP 1: NOTIFICATION (ALWAYS FIRST) ====================
    notification_doc = {
        "id": notification_id,
        "type": "concierge_request",
        "pillar": request.pillar,
        "title": f"New Concierge® Request: {request.pillar.capitalize()}",
        "message": f"{request.name} submitted a Concierge® request for {request.experience_name or request.pillar}",
        "priority": "normal",
        "urgency": "medium",
        "status": "unread",
        "ticket_id": ticket_id,
        "concierge_request_id": request_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": request.name,
            "email": request.email,
            "phone": request.phone
        },
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now,
        "read_at": None,
        "action_url": f"/admin/concierge?request={request_id}"
    }
    
    await db.admin_notifications.insert_one(notification_doc)
    logger.info(f"[UNIFIED FLOW] STEP 1 COMPLETE: Notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (ALWAYS SECOND) ====================
    service_desk_doc = {
        "ticket_id": ticket_id,
        "id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "concierge_request_id": request_id,
        
        "category": request.pillar,
        "sub_category": "concierge_request",
        "pillar": request.pillar,
        
        "subject": f"Concierge® Request: {request.experience_name or request.pillar.capitalize()}",
        "description": request.message or f"Concierge® inquiry for {request.pillar} pillar",
        "original_request": request.message,
        
        "member": {
            "name": request.name,
            "email": request.email,
            "phone": request.phone
        },
        
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "source": "concierge_card",
        "channel": "web",
        
        "assigned_to": None,
        "tags": ["concierge", request.pillar, "unified-flow"],
        
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "request_received",
            "content": request.message or f"Concierge® inquiry for {request.pillar}",
            "sender": "customer",
            "sender_name": request.name,
            "channel": "web",
            "timestamp": now.isoformat(),
            "is_internal": False
        }],
        
        "internal_notes": "",
        "attachments": [],
        
        "created_at": now,
        "updated_at": now,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
        
        "audit_trail": [
            {
                "action": "created",
                "timestamp": now.isoformat(),
                "performed_by": "system",
                "details": f"Created from {request.pillar} Concierge® card via Unified Flow"
            }
        ]
    }
    
    await db.service_desk_tickets.insert_one(service_desk_doc)
    logger.info(f"[UNIFIED FLOW] STEP 2 COMPLETE: Service Desk ticket created: {ticket_id}")
    
    # Also insert into legacy tickets collection for backward compatibility
    await db.tickets.insert_one({
        **service_desk_doc,
        "type": "concierge_request"
    })
    
    # ==================== STEP 3: UNIFIED INBOX (ALWAYS THIRD) ====================
    inbox_doc = {
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        
        "channel": "web",
        "request_type": "concierge_request",
        "pillar": request.pillar,
        "category": request.pillar,
        
        "status": "new",
        "urgency": "medium",
        
        "customer_name": request.name,
        "customer_email": request.email,
        "customer_phone": request.phone,
        "member": {
            "name": request.name,
            "email": request.email,
            "phone": request.phone
        },
        
        "preview": (request.message or f"Concierge® inquiry for {request.pillar}")[:200],
        "message": request.message or f"Concierge® inquiry for {request.pillar}",
        "full_content": request.message,
        
        "metadata": {
            "experience_id": request.experience_id,
            "experience_name": request.experience_name,
            "source": request.source,
            "preferred_contact": request.preferred_contact
        },
        
        "tags": ["concierge", request.pillar],
        
        "created_at": now,
        "updated_at": now,
        "processed_at": None,
        "archived_at": None
    }
    
    await db.channel_intakes.insert_one(inbox_doc)
    logger.info(f"[UNIFIED FLOW] STEP 3 COMPLETE: Unified Inbox entry created: {inbox_id}")
    
    # ==================== STEP 4: MEMBER NOTIFICATION (MANDATORY) ====================
    # User must see confirmation in their notification bell
    if request.email:
        try:
            member_notification_id = f"MNOTIF-{uuid.uuid4().hex[:8].upper()}"
            member_notification = {
                "id": member_notification_id,
                "type": "concierge_request_received",
                "title": f"Request Received: {request.experience_name or request.pillar.capitalize()}",
                "message": f"Your {request.pillar.capitalize()} request has been sent to Concierge®. We'll get back to you soon!",
                "user_email": request.email.lower(),
                "ticket_id": ticket_id,
                "request_id": request_id,
                "pillar": request.pillar,
                "read": False,
                "created_at": now.isoformat(),
                "data": {
                    "thread_url": f"/mira-demo?tab=services&thread={ticket_id}",
                    "experience_name": request.experience_name
                }
            }
            await db.member_notifications.insert_one(member_notification)
            logger.info(f"[UNIFIED FLOW] STEP 4 COMPLETE: Member notification created: {member_notification_id}")
        except Exception as notif_error:
            logger.error(f"[UNIFIED FLOW] Failed to create member notification: {notif_error}")
    
    # ==================== STEP 5: CONTEXTUAL (already done - concierge_requests) ====================
    logger.info(f"[UNIFIED FLOW] COMPLETE: {request_id} | Flow: Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id}) → MemberNotif → Context(concierge_requests)")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "message": "Request received. We'll be in touch soon!"
    }



# ─────────────────────────────────────────────────────────────────────────────
# PERSONALIZED PICKS REQUEST - From Mira's Picks Panel
# ─────────────────────────────────────────────────────────────────────────────

class PicksRequestPayload(BaseModel):
    """Request payload for picks from PersonalizedPicksPanel."""
    pet_name: str
    pet_id: Optional[str] = None
    user_email: Optional[str] = None
    selected_items: List[Dict[str, Any]]
    additional_notes: Optional[str] = ""
    timestamp: Optional[str] = None


@router.post("/picks-request")
async def create_picks_request(payload: PicksRequestPayload):
    """
    Create a Concierge® request from Personalized Picks Panel.
    This is called when user confirms their picks selection in Mira.
    
    FLOW: Creates full service desk ticket + channel intake entry
    following the unified signal flow for admin visibility.
    """
    db = get_db()
    import uuid
    
    # Import central signal flow for unified ticket creation
    from central_signal_flow import create_signal
    
    request_id = f"picks-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    # Build item summaries for the request
    item_summaries = []
    item_names = []
    for item in payload.selected_items:
        item_summaries.append({
            "name": item.get("name"),
            "id": item.get("id"),
            "type": item.get("pick_type", "unknown"),
            "pillar": item.get("pillar"),
            "price": item.get("price"),
            "category": item.get("category")
        })
        item_names.append(item.get("name", "Unknown item"))
    
    # Create the picks request document
    picks_doc = {
        "id": request_id,
        "type": "personalized_picks",
        "pet_name": payload.pet_name,
        "items_count": len(payload.selected_items),
        "items": item_summaries,
        "additional_notes": payload.additional_notes,
        "source": "mira_picks_panel",
        "status": "new",
        "created_at": now,
        "updated_at": now,
        "timeline": [
            {
                "status": "new",
                "timestamp": now.isoformat(),
                "note": f"Picks request submitted for {payload.pet_name} ({len(payload.selected_items)} items)"
            }
        ]
    }
    
    # Insert into picks requests collection
    await db.concierge_picks_requests.insert_one(picks_doc)
    logger.info(f"[PICKS REQUEST] Created picks request {request_id} for {payload.pet_name} with {len(payload.selected_items)} items")
    
    # ═══════════════════════════════════════════════════════════════════════
    # UNIFIED SIGNAL FLOW - Create Service Desk Ticket + Channel Intake
    # This is the CRITICAL part that makes picks visible in admin dashboard
    # ═══════════════════════════════════════════════════════════════════════
    
    # Determine pillar from first item or default to 'picks'
    primary_pillar = payload.selected_items[0].get("pillar", "picks") if payload.selected_items else "picks"
    
    # Build detailed description with all items
    description_lines = [f"**Picks Request for {payload.pet_name}**", ""]
    description_lines.append("**Selected Items:**")
    
    for idx, item in enumerate(payload.selected_items, 1):
        item_name = item.get("name") or item.get("title", "Unknown item")
        item_price = item.get("price") or item.get("display_price", "")
        item_type = item.get("pick_type") or item.get("type", "item")
        item_pillar = item.get("pillar", "")
        
        # Build item line
        item_line = f"{idx}. **{item_name}**"
        if item_price:
            item_line += f" - {item_price}"
        if item_type:
            item_line += f" ({item_type})"
        description_lines.append(item_line)
        
        # Add category/pillar if available
        if item.get("category"):
            description_lines.append(f"   Category: {item.get('category')}")
    
    description_lines.append("")
    
    if payload.additional_notes:
        description_lines.append(f"**Additional Notes:**")
        description_lines.append(payload.additional_notes)
    
    description = "\n".join(description_lines)
    
    # Also create a short summary for title
    item_names = [item.get("name") or item.get("title", "Item") for item in payload.selected_items]
    items_summary = ", ".join(item_names[:3])
    if len(item_names) > 3:
        items_summary += f" (+{len(item_names) - 3} more)"
    
    try:
        signal_result = await create_signal(
            pillar=primary_pillar,
            action_type="picks_request",
            title=f"Picks Request for {payload.pet_name}",
            description=description,
            pet_name=payload.pet_name,
            urgency="medium",
            source="mira_picks_panel",
            linked_id=request_id,
            extra_data={
                "items": item_summaries,
                "items_count": len(payload.selected_items),
                "additional_notes": payload.additional_notes
            }
        )
        
        ticket_id = signal_result.get("ticket_id", request_id)
        logger.info(f"[PICKS REQUEST] Created unified signal: ticket={ticket_id}, inbox={signal_result.get('inbox_id')}")
        
        # Update picks doc with ticket reference
        await db.concierge_picks_requests.update_one(
            {"id": request_id},
            {"$set": {"ticket_id": ticket_id}}
        )
        
        # ═══════════════════════════════════════════════════════════════════════
        # CREATE MEMBER NOTIFICATION - So user sees it in their notification bell
        # This is the missing piece! User should be notified their request was received.
        # ═══════════════════════════════════════════════════════════════════════
        try:
            member_notification_id = f"MNOTIF-{uuid.uuid4().hex[:8].upper()}"
            user_email = payload.user_email.lower() if payload.user_email else None
            
            if user_email:
                # Build detailed items list for the notification
                items_detail_list = []
                for idx, item in enumerate(payload.selected_items[:5], 1):  # Max 5 items in preview
                    item_name = item.get("name") or item.get("title", "Unknown item")
                    item_price = item.get("price") or item.get("display_price", "")
                    item_type = item.get("pick_type") or item.get("type", "item")
                    
                    # Clean up the item name (remove emoji prefixes if present)
                    if item_name and len(item_name) > 2 and item_name[0] in "🎂🎈📸🦴🎉🍰🎁✨":
                        item_name = item_name[2:].strip()
                    
                    items_detail_list.append({
                        "name": item_name,
                        "price": str(item_price) if item_price else None,
                        "type": item_type
                    })
                
                # Build readable message with item names
                items_names_list = [i.get("name") for i in items_detail_list]
                if len(payload.selected_items) > 5:
                    items_text = ", ".join(items_names_list) + f" (+{len(payload.selected_items) - 5} more)"
                else:
                    items_text = ", ".join(items_names_list)
                
                member_notification = {
                    "id": member_notification_id,
                    "type": "picks_request_received",
                    "title": f"Request Received: {payload.pet_name}",
                    "message": f"Your picks for {payload.pet_name} have been sent to Concierge®:\n{items_text}\n\nWe'll get back to you soon!",
                    "pet_name": payload.pet_name,
                    "pet_id": payload.pet_id,
                    "user_email": user_email,
                    "ticket_id": ticket_id,
                    "request_id": request_id,
                    "pillar": primary_pillar,
                    "read": False,
                    "created_at": now.isoformat(),
                    "data": {
                        "thread_id": signal_result.get("thread_id"),
                        "thread_url": f"/mira-demo?tab=services&thread={ticket_id}",
                        "items_count": len(payload.selected_items),
                        "items": items_detail_list,  # Full item details
                        "additional_notes": payload.additional_notes
                    }
                }
                await db.member_notifications.insert_one(member_notification)
                logger.info(f"[PICKS REQUEST] Created member notification: {member_notification_id} for {payload.pet_name} with {len(items_detail_list)} items")
            else:
                logger.warning(f"[PICKS REQUEST] No user_email provided, skipping member notification")
        except Exception as notif_error:
            logger.error(f"[PICKS REQUEST] Failed to create member notification: {notif_error}")
        
    except Exception as e:
        logger.error(f"[PICKS REQUEST] Failed to create unified signal: {e}")
        ticket_id = request_id
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "items_count": len(payload.selected_items),
        "message": f"Your {len(payload.selected_items)} picks for {payload.pet_name} have been sent to your Concierge®!"
    }


@router.get("/requests")
async def get_concierge_requests(
    pillar: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    """Get all Concierge® experience requests for the admin dashboard.
    Merges data from service_requests, service_desk_tickets, and concierge_requests collections.
    """
    db = get_db()
    
    query = {"status": {"$nin": ["resolved", "closed", "completed"]}}
    if pillar:
        query["pillar"] = pillar
    if status:
        query["status"] = status
    
    all_requests = []
    
    # 1. Service Requests (new universal flow)
    sr_requests = await db.service_requests.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    for r in sr_requests:
        r["id"] = r.get("request_id", str(r.get("_id", "")))
        r["request_id"] = r.get("request_id", r["id"])
        r["source_type"] = "service_request"
        r.pop("_id", None)
        all_requests.append(r)
    
    # 2. Service Desk Tickets
    sdt_requests = await db.service_desk_tickets.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    for r in sdt_requests:
        r["id"] = r.get("ticket_id", str(r.get("_id", "")))
        r["request_id"] = r.get("ticket_id", r["id"])
        r["source_type"] = "service_desk"
        r.pop("_id", None)
        all_requests.append(r)
    
    # 3. Legacy Concierge Requests
    cr_requests = await db.concierge_requests.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    for r in cr_requests:
        r["id"] = r.get("id", str(r.get("_id", "")))
        r["request_id"] = r.get("request_id", r["id"])
        r["source_type"] = "concierge_request"
        r.pop("_id", None)
        all_requests.append(r)
    
    # Sort by created_at descending (handle both datetime and string)
    def get_sort_key(x):
        created = x.get("created_at", "")
        if isinstance(created, str):
            return created
        elif hasattr(created, 'isoformat'):
            return created.isoformat()
        return ""
    
    all_requests.sort(key=get_sort_key, reverse=True)
    
    # Limit to requested amount
    all_requests = all_requests[:limit]
    
    return {"requests": all_requests, "total": len(all_requests)}


@router.get("/stats")
async def get_concierge_stats():
    """Get Concierge® request statistics for the dashboard from all collections."""
    db = get_db()
    
    # Debug: check if db is connected
    if db is None:
        return {"error": "Database not connected", "db_status": "None"}
    
    # Debug: Log what we're doing
    import logging
    logging.info(f"[STATS DEBUG] db object: {type(db)}")
    
    # Count from all relevant collections
    try:
        service_requests = await db.service_requests.count_documents({"status": {"$nin": ["resolved", "closed", "completed"]}})
    except Exception as e:
        service_requests = 0
        logging.error(f"[STATS DEBUG] service_requests error: {e}")
    
    try:
        service_desk = await db.service_desk_tickets.count_documents({"status": {"$nin": ["resolved", "closed"]}})
    except Exception as e:
        service_desk = 0
        logging.error(f"[STATS DEBUG] service_desk error: {e}")
    
    try:
        concierge = await db.concierge_requests.count_documents({"status": {"$nin": ["resolved", "closed"]}})
    except Exception as e:
        concierge = 0
        logging.error(f"[STATS DEBUG] concierge error: {e}")
    
    total_active = service_requests + service_desk + concierge
    
    logging.info(f"[STATS DEBUG] Counts: sr={service_requests}, sd={service_desk}, cr={concierge}")
    
    # Return early with debug info
    return {
        "total_active": total_active,
        "total_resolved": 0,
        "total_urgent": 0,
        "total_pinned": 0,
        "by_category": {},
        "by_priority": {},
        "by_entity_type": {
            "service_requests": service_requests,
            "service_desk_tickets": service_desk,
            "concierge_requests": concierge
        },
        "debug": f"db_type={type(db).__name__}"
    }


@router.put("/requests/{request_id}")
async def update_concierge_request_status(
    request_id: str,
    status: str = Query(..., description="New status: new, contacted, in_progress, completed, archived"),
    note: Optional[str] = Query(None, description="Optional note for the timeline")
):
    """Update a Concierge® request status."""
    db = get_db()
    
    request = await db.concierge_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    now = datetime.now(timezone.utc)
    
    timeline = request.get("timeline", [])
    timeline.append({
        "status": status,
        "timestamp": now.isoformat(),
        "note": note or f"Status changed to {status}"
    })
    
    await db.concierge_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": status,
            "timeline": timeline,
            "updated_at": now
        }}
    )
    
    return {"message": "Request updated", "status": status}


# ============== QUEUE ENDPOINT ==============

@router.get("/queue")
async def get_command_center_queue(
    source: Optional[str] = None,  # mira, order, inbox, health, membership, voice_order, autoship, stay, dine, travel, care, all
    priority: Optional[str] = None,  # urgent, high, medium, low
    status: Optional[str] = None,  # pending, claimed, in_progress
    assigned_to: Optional[str] = None,
    pillar: Optional[str] = None,  # celebrate, dine, stay, travel, care, shop, club, enjoy, fit, advisory, paperwork, emergency
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0
):
    """
    Get unified command center queue from ALL sources.
    Merges: service_desk_tickets, tickets, orders, unified_inbox, health alerts,
            memberships, voice_orders, autoship, stay_bookings, dine_reservations,
            travel_requests, care_appointments
    """
    db = get_db()
    all_items = []
    
    # 1. Mira AI Action Requests (service_desk_tickets)
    if source in [None, "all", "mira"]:
        mira_query = {"status": {"$nin": ["resolved", "closed"]}}
        if status:
            mira_query["status"] = status
        if assigned_to:
            mira_query["assigned_to"] = assigned_to
        
        cursor = db.service_desk_tickets.find(mira_query, {"_id": 0}).limit(limit)
        async for item in cursor:
            item["source_type"] = "mira"
            item["source_label"] = "Mira Request"
            item["source_icon"] = "🤖"
            # Normalize member info from customer fields if member not set
            if not item.get("member"):
                item["member"] = {
                    "name": item.get("customer_name"),
                    "email": item.get("customer_email"),
                    "phone": item.get("customer_phone")
                }
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 2. Service Desk Tickets (tickets)
    if source in [None, "all", "tickets"]:
        ticket_query = {"status": {"$nin": ["resolved", "closed"]}}
        if status:
            ticket_query["status"] = status
        if assigned_to:
            ticket_query["assigned_to"] = assigned_to
        
        cursor = db.tickets.find(ticket_query, {"_id": 0}).limit(limit)
        async for item in cursor:
            item["source_type"] = "ticket"
            item["source_label"] = "Service Desk"
            item["source_icon"] = "🎫"
            
            # Normalize member info - ensure member object exists and has name
            existing_member = item.get("member") or {}
            if not existing_member.get("name"):
                # Try to get member info from various sources
                member_name = (
                    existing_member.get("name") or
                    item.get("customer_name") or
                    "Customer"
                )
                member_email = (
                    existing_member.get("email") or
                    item.get("customer_email")
                )
                member_phone = (
                    existing_member.get("phone") or
                    item.get("customer_phone")
                )
                item["member"] = {
                    "name": member_name,
                    "email": member_email,
                    "phone": member_phone
                }
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 3. Orders (pending fulfillment)
    if source in [None, "all", "order"]:
        order_query = {"status": {"$in": ["pending", "processing", "paid"]}}
        
        cursor = db.orders.find(order_query, {"_id": 0}).limit(limit)
        async for item in cursor:
            # Transform order to queue item format
            item["ticket_id"] = f"ORD-{item.get('order_id', item.get('orderId', item.get('id', 'N/A')))}"
            item["source_type"] = "order"
            item["source_label"] = "Order"
            item["source_icon"] = "📦"
            item["original_request"] = f"Order #{item.get('orderId', item.get('order_id', 'N/A'))} - ₹{item.get('total', 0)}"
            item["action_type"] = "order_fulfillment"
            
            # Map order customer to member format - handle parentName field from checkout
            customer = item.get("customer", {})
            if customer:
                item["member"] = {
                    "name": customer.get("parentName") or customer.get("name") or "Customer",
                    "email": customer.get("email"),
                    "phone": customer.get("phone") or customer.get("whatsappNumber")
                }
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 4. Unified Inbox (unread messages)
    if source in [None, "all", "inbox"]:
        inbox_query = {"unread": True}
        
        cursor = db.unified_inbox.find(inbox_query, {"_id": 0}).limit(limit)
        async for item in cursor:
            if not item.get("ticket_id"):
                item["ticket_id"] = f"MSG-{item.get('id', 'N/A')}"
            item["source_type"] = "inbox"
            item["source_label"] = f"Inbox ({item.get('channel', 'message')})"
            item["source_icon"] = "📥"
            item["original_request"] = item.get("message", item.get("content", "New message"))
            item["action_type"] = "inbox_message"
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 5. Health Alerts (overdue vaccines, appointments)
    if source in [None, "all", "health"]:
        # Check pet_vaccines for overdue
        now = get_utc_timestamp()
        vaccine_query = {
            "next_due_date": {"$lt": now},
            "status": {"$ne": "completed"}
        }
        
        cursor = db.pet_vaccines.find(vaccine_query, {"_id": 0}).limit(50)
        async for item in cursor:
            # Get pet info
            pet = await db.pets.find_one({"id": item.get("pet_id")}, {"_id": 0})
            
            item["ticket_id"] = f"HEALTH-{item.get('id', item.get('pet_id', 'N/A'))}"
            item["source_type"] = "health_alert"
            item["source_label"] = "Health Alert"
            item["source_icon"] = "💉"
            item["original_request"] = f"{item.get('vaccine_name', 'Vaccine')} overdue for {pet.get('name', 'Pet') if pet else 'Pet'}"
            item["action_type"] = "health_reminder"
            item["status"] = "pending"
            
            if pet:
                item["pets"] = [{"id": pet.get("id"), "name": pet.get("name"), "breed": pet.get("breed")}]
                # Get member info from pet
                member_id = pet.get("member_id") or pet.get("owner_id")
                if member_id:
                    member = await db.users.find_one({"id": member_id}, {"_id": 0, "password": 0})
                    if member:
                        item["member"] = {
                            "id": member.get("id"),
                            "name": member.get("name"),
                            "email": member.get("email")
                        }
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = True  # Health alerts are always urgent
            all_items.append(item)
    
    # 6. Upcoming Celebrations (birthdays in next 3 days)
    if source in [None, "all", "celebration"]:
        today = datetime.now()
        upcoming_dates = []
        for i in range(4):
            d = today + timedelta(days=i)
            upcoming_dates.append(f"{d.month:02d}-{d.day:02d}")
        
        # Find pets with birthdays
        cursor = db.pets.find({}, {"_id": 0})
        async for pet in cursor:
            birth_date = pet.get("birth_date")
            if birth_date:
                try:
                    if isinstance(birth_date, str):
                        bd = datetime.fromisoformat(birth_date.replace("Z", "+00:00"))
                    else:
                        bd = birth_date
                    
                    bd_str = f"{bd.month:02d}-{bd.day:02d}"
                    if bd_str in upcoming_dates:
                        days_until = upcoming_dates.index(bd_str)
                        
                        item = {
                            "ticket_id": f"BDAY-{pet.get('id', 'N/A')}",
                            "source_type": "celebration",
                            "source_label": "Birthday",
                            "source_icon": "🎂",
                            "original_request": f"{pet.get('name', 'Pet')}'s birthday {'TODAY!' if days_until == 0 else f'in {days_until} days'}",
                            "action_type": "birthday_reminder",
                            "status": "pending",
                            "created_at": get_utc_timestamp(),
                            "pets": [{"id": pet.get("id"), "name": pet.get("name"), "breed": pet.get("breed")}],
                            "days_until": days_until
                        }
                        
                        item["priority_score"] = 35 + (10 * (3 - days_until))  # Closer = higher priority
                        item["priority_bucket"] = "medium" if days_until > 1 else "high"
                        item["sla_breached"] = False
                        all_items.append(item)
                except:
                    pass
    
    # 7. Membership Purchases/Renewals
    if source in [None, "all", "membership"]:
        # Get recent membership purchases (last 30 days that need follow-up)
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        membership_query = {
            "created_at": {"$gte": thirty_days_ago},
            "status": {"$in": ["pending", "active", "expiring_soon"]}
        }
        
        cursor = db.memberships.find(membership_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"MEM-{item.get('id', item.get('membership_id', 'N/A'))}"
            item["source_type"] = "membership"
            item["source_label"] = "Membership"
            item["source_icon"] = "👑"
            item["original_request"] = f"Membership: {item.get('plan_name', 'Plan')} - {item.get('status', 'pending')}"
            item["action_type"] = "membership_followup"
            item["pillar"] = "club"
            
            # Get member info
            user = await db.users.find_one({"email": item.get("email")}, {"_id": 0, "password": 0})
            if user:
                item["member"] = {
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "phone": user.get("phone")
                }
            
            item["priority_score"] = 35 if item.get("status") == "expiring_soon" else 25
            item["priority_bucket"] = "medium" if item.get("status") == "expiring_soon" else "low"
            item["sla_breached"] = False
            all_items.append(item)
    
    # 8. Voice Orders (from Mira voice ordering)
    if source in [None, "all", "voice_order"]:
        voice_query = {
            "type": "voice_order",
            "status": {"$nin": ["completed", "cancelled"]}
        }
        
        cursor = db.voice_orders.find(voice_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"VOICE-{item.get('id', item.get('order_id', 'N/A'))}"
            item["source_type"] = "voice_order"
            item["source_label"] = "Voice Order"
            item["source_icon"] = "🎤"
            item["original_request"] = f"Voice Order: {item.get('transcript', item.get('items_summary', 'Voice command'))}"
            item["action_type"] = "voice_order_processing"
            item["pillar"] = "shop"
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 9. Autoship Subscriptions (renewals, failures, updates)
    if source in [None, "all", "autoship"]:
        autoship_query = {
            "$or": [
                {"status": "renewal_due"},
                {"status": "payment_failed"},
                {"needs_attention": True}
            ]
        }
        
        cursor = db.autoship.find(autoship_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"AUTO-{item.get('id', item.get('subscription_id', 'N/A'))}"
            item["source_type"] = "autoship"
            item["source_label"] = "Autoship"
            item["source_icon"] = "🔄"
            item["original_request"] = f"Autoship: {item.get('product_name', 'Subscription')} - {item.get('status', 'pending')}"
            item["action_type"] = "autoship_management"
            item["pillar"] = "shop"
            
            item["priority_score"] = 55 if item.get("status") == "payment_failed" else 30
            item["priority_bucket"] = "high" if item.get("status") == "payment_failed" else "medium"
            item["sla_breached"] = item.get("status") == "payment_failed"
            all_items.append(item)
    
    # 10. Stay Bookings (boarding, daycare)
    if source in [None, "all", "stay"]:
        stay_query = {"status": {"$in": ["pending", "confirmed", "check_in_today", "checked_in"]}}
        
        cursor = db.stay_bookings.find(stay_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"STAY-{item.get('id', item.get('booking_id', 'N/A'))}"
            item["source_type"] = "stay_booking"
            item["source_label"] = "Stay Booking"
            item["source_icon"] = "🏨"
            item["original_request"] = f"Stay: {item.get('facility_name', 'Boarding')} - {item.get('status', 'pending')}"
            item["action_type"] = "stay_booking"
            item["pillar"] = "stay"
            
            item["priority_score"] = 45 if item.get("status") == "check_in_today" else 30
            item["priority_bucket"] = "high" if item.get("status") == "check_in_today" else "medium"
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 11. Dine Reservations
    if source in [None, "all", "dine"]:
        dine_query = {"status": {"$in": ["pending", "confirmed", "today"]}}
        
        cursor = db.dine_reservations.find(dine_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"DINE-{item.get('id', item.get('reservation_id', 'N/A'))}"
            item["source_type"] = "dine_reservation"
            item["source_label"] = "Dine Reservation"
            item["source_icon"] = "🍽️"
            item["original_request"] = f"Dine: {item.get('restaurant_name', 'Restaurant')} - {item.get('date', 'Date TBD')}"
            item["action_type"] = "dine_reservation"
            item["pillar"] = "dine"
            
            item["priority_score"] = 45 if item.get("status") == "today" else 30
            item["priority_bucket"] = "high" if item.get("status") == "today" else "medium"
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 12. Travel Requests
    if source in [None, "all", "travel"]:
        travel_query = {"status": {"$in": ["pending", "in_progress", "confirmed"]}}
        
        cursor = db.travel_requests.find(travel_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"TRAVEL-{item.get('id', item.get('request_id', 'N/A'))}"
            item["source_type"] = "travel_request"
            item["source_label"] = "Travel Request"
            item["source_icon"] = "✈️"
            item["original_request"] = f"Travel: {item.get('destination', 'Destination TBD')} - {item.get('dates', 'Dates TBD')}"
            item["action_type"] = "travel_request"
            item["pillar"] = "travel"
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # 13. Care Appointments (vet, grooming)
    if source in [None, "all", "care"]:
        care_query = {"status": {"$in": ["pending", "scheduled", "confirmed"]}}
        
        cursor = db.care_appointments.find(care_query, {"_id": 0}).limit(50)
        async for item in cursor:
            item["ticket_id"] = f"CARE-{item.get('id', item.get('appointment_id', 'N/A'))}"
            item["source_type"] = "care_appointment"
            item["source_label"] = "Care Appointment"
            item["source_icon"] = "🏥"
            item["original_request"] = f"Care: {item.get('service_type', 'Appointment')} - {item.get('date', 'Date TBD')}"
            item["action_type"] = "care_appointment"
            item["pillar"] = "care"
            
            item["priority_score"] = calculate_priority_score(item)
            item["priority_bucket"] = get_priority_bucket(item["priority_score"])
            item["sla_breached"] = check_sla_breach(item)
            all_items.append(item)
    
    # Apply pillar filter (if provided)
    if pillar:
        all_items = [item for item in all_items if item.get("pillar") == pillar or item.get("category") == pillar]
    
    # Apply priority filter
    if priority:
        all_items = [item for item in all_items if item.get("priority_bucket") == priority]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        filtered_items = []
        for item in all_items:
            member = item.get("member") or {}
            customer = item.get("customer") or {}
            pets = item.get("pets") or []
            member_name = member.get("name", "") if member else ""
            member_email = member.get("email", "") if member else ""
            customer_name = customer.get("name") or customer.get("parentName") or item.get("customer_name") or ""
            customer_email = customer.get("email") or item.get("customer_email") or ""
            customer_phone = customer.get("phone") or item.get("customer_phone") or ""
            
            # Get pet pass numbers if available
            pet_pass_numbers = " ".join([p.get("pet_pass_number", "") for p in pets if p.get("pet_pass_number")])
            pet_names = " ".join([p.get("name", "") for p in pets])
            
            # Search across all relevant fields including Pet Pass Number
            searchable_text = " ".join([
                str(item.get("original_request", "")),
                str(member_name),
                str(member_email),
                str(customer_name),
                str(customer_email),
                str(customer_phone),
                str(item.get("ticket_id", "")),
                str(item.get("title", "")),
                str(item.get("description", "")),
                str(item.get("pet_pass_number", "")),
                str(pet_pass_numbers),
                str(pet_names)
            ]).lower()
            
            if search_lower in searchable_text:
                filtered_items.append(item)
        all_items = filtered_items
    
    # Sort by priority score (descending)
    all_items.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
    
    # Calculate attention strip stats
    attention_stats = {
        "sla_breaching": len([i for i in all_items if i.get("sla_breached")]),
        "high_unclaimed": len([i for i in all_items if i.get("priority_bucket") in ["urgent", "high"] and not i.get("assigned_to")]),
        "health_overdue": len([i for i in all_items if i.get("source_type") == "health_alert"]),
        "birthdays_upcoming": len([i for i in all_items if i.get("source_type") == "celebration"])
    }
    
    # Bucket counts
    bucket_counts = {
        "urgent": len([i for i in all_items if i.get("priority_bucket") == "urgent"]),
        "high": len([i for i in all_items if i.get("priority_bucket") == "high"]),
        "medium": len([i for i in all_items if i.get("priority_bucket") == "medium"]),
        "low": len([i for i in all_items if i.get("priority_bucket") == "low"])
    }
    
    # Paginate
    total = len(all_items)
    all_items = all_items[offset:offset + limit]
    
    return {
        "items": all_items,
        "total": total,
        "attention": attention_stats,
        "buckets": bucket_counts,
        "filters": {
            "source": source,
            "priority": priority,
            "status": status,
            "search": search
        }
    }


# ============== ITEM DETAIL WITH MIRA INTELLIGENCE ==============

@router.get("/item/{ticket_id}")
async def get_item_detail(ticket_id: str):
    """
    Get full detail for a queue item including Mira's intelligence.
    Returns: member snapshot, request, AI research, timeline
    """
    db = get_db()
    
    # Find the item from various collections
    item = None
    source_collection = None
    
    # Check service_desk_tickets
    item = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if item:
        source_collection = "service_desk_tickets"
    
    # Check tickets
    if not item:
        item = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
        if item:
            source_collection = "tickets"
    
    # Check orders - handle both ORD-{uuid} and ORD-ORD-{date} patterns
    if not item and ticket_id.startswith("ORD-"):
        # Try multiple patterns
        search_id = ticket_id.replace("ORD-", "", 1)  # Remove first ORD- prefix
        
        # Search by id field, order_id field, or reconstructed order_id
        item = await db.orders.find_one(
            {"$or": [
                {"id": search_id},
                {"order_id": search_id},
                {"id": ticket_id.replace("ORD-", "", 1)},
                {"order_id": ticket_id.replace("ORD-", "", 1)}
            ]}, 
            {"_id": 0}
        )
        if item:
            source_collection = "orders"
            item["ticket_id"] = ticket_id
            # Transform order to standard item format
            if not item.get("original_request"):
                item["original_request"] = f"Order #{item.get('order_id', item.get('id', 'N/A'))} - ₹{item.get('total', 0)}"
            if item.get("customer") and not item.get("member"):
                item["member"] = {
                    "name": item["customer"].get("name"),
                    "email": item["customer"].get("email"),
                    "phone": item["customer"].get("phone")
                }
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get member email - handle all possible field locations
    member_data = item.get("member") or {}
    member_email = member_data.get("email") if member_data else None
    if not member_email and item.get("customer"):
        member_email = item["customer"].get("email")
    if not member_email:
        # Also check direct customer_email field (for service_desk_tickets)
        member_email = item.get("customer_email")
    
    # ============== A. MEMBER & PET SNAPSHOT ==============
    member_snapshot = None
    pets_snapshot = []
    
    if member_email:
        # Get full member profile
        member = await db.users.find_one({"email": member_email}, {"_id": 0, "password": 0})
        if member:
            member_snapshot = {
                "id": member.get("id"),
                "name": member.get("name"),
                "email": member.get("email"),
                "phone": member.get("phone"),
                "membership_tier": member.get("membership_tier", "free"),
                "pet_pass_number": member.get("pet_pass_number"),
                "joined_at": member.get("created_at")
            }
            
            # Get pets
            pet_ids = member.get("pets", [])
            if pet_ids:
                cursor = db.pets.find({"id": {"$in": pet_ids}}, {"_id": 0})
                async for pet in cursor:
                    pets_snapshot.append({
                        "id": pet.get("id"),
                        "pet_pass_number": pet.get("pet_pass_number"),
                        "name": pet.get("name"),
                        "breed": pet.get("breed") or pet.get("identity", {}).get("breed"),
                        "species": pet.get("species", "dog"),
                        "age": pet.get("age") or pet.get("identity", {}).get("age"),
                        "gender": pet.get("gender"),
                        "weight": pet.get("weight") or pet.get("identity", {}).get("weight"),
                        "allergies": pet.get("allergies") or pet.get("preferences", {}).get("allergies", []),
                        "photo_url": pet.get("photo_url")
                    })
    
    # ============== C. MIRA'S INTELLIGENCE ==============
    mira_intelligence = {
        "past_orders": [],
        "past_tickets": [],
        "memories": [],
        "pet_soul_insights": [],
        "suggested_products": [],
        "auto_draft": None
    }
    
    if member_email:
        # Past orders
        order_cursor = db.orders.find(
            {"customer.email": member_email},
            {"_id": 0}
        ).sort("created_at", -1).limit(10)
        async for order in order_cursor:
            mira_intelligence["past_orders"].append({
                "order_id": order.get("order_id", order.get("id")),
                "date": order.get("created_at"),
                "total": order.get("total"),
                "items": order.get("items", [])[:3],  # First 3 items
                "status": order.get("status")
            })
        
        # Past tickets
        ticket_cursor = db.tickets.find(
            {"member.email": member_email},
            {"_id": 0}
        ).sort("created_at", -1).limit(10)
        async for ticket in ticket_cursor:
            mira_intelligence["past_tickets"].append({
                "ticket_id": ticket.get("ticket_id"),
                "category": ticket.get("category"),
                "description": ticket.get("description", "")[:100],
                "status": ticket.get("status"),
                "created_at": ticket.get("created_at"),
                "resolution": ticket.get("resolution_summary")
            })
        
        # Relationship memories
        memory_cursor = db.mira_memories.find(
            {"member_id": member_email, "is_active": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(10)
        async for memory in memory_cursor:
            mira_intelligence["memories"].append({
                "type": memory.get("memory_type"),
                "content": memory.get("content"),
                "pet_name": memory.get("pet_name"),
                "created_at": memory.get("created_at")
            })
        
        # Pet Soul insights
        for pet in pets_snapshot:
            pet_full = await db.pets.find_one({"id": pet["id"]}, {"_id": 0})
            if pet_full:
                soul = pet_full.get("soul", {}) or pet_full.get("doggy_soul_answers", {})
                if soul:
                    mira_intelligence["pet_soul_insights"].append({
                        "pet_name": pet["name"],
                        "persona": soul.get("persona"),
                        "love_language": soul.get("love_language"),
                        "favorite_flavors": pet_full.get("preferences", {}).get("favorite_flavors", []),
                        "favorite_treats": pet_full.get("preferences", {}).get("favorite_treats", []),
                        "activity_level": pet_full.get("preferences", {}).get("activity_level")
                    })
    
    # ============== TIMELINE ==============
    timeline = item.get("audit_trail", [])
    if not timeline:
        timeline = [{
            "action": "created",
            "timestamp": item.get("created_at"),
            "performed_by": "system"
        }]
    
    return {
        "item": item,
        "source_collection": source_collection,
        "member_snapshot": member_snapshot,
        "pets_snapshot": pets_snapshot,
        "mira_intelligence": mira_intelligence,
        "timeline": timeline
    }


# ============== ACTIONS ==============

@router.post("/item/{ticket_id}/claim")
async def claim_item(ticket_id: str, request: ClaimRequest):
    """Claim a queue item for the concierge."""
    db = get_db()
    now = get_utc_timestamp()
    
    # First, get the ticket to find member email
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    collection = db.service_desk_tickets
    
    if not ticket:
        ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
        collection = db.tickets
    
    # Try to update in service_desk_tickets
    result = await db.service_desk_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "assigned_to": request.agent_id,
                "assigned_name": request.agent_name,
                "assigned_at": now,
                "status": "claimed",
                "updated_at": now
            },
            "$push": {
                "audit_trail": {
                    "action": "claimed",
                    "timestamp": now,
                    "performed_by": request.agent_name,
                    "agent_id": request.agent_id
                }
            }
        }
    )
    
    if result.modified_count == 0:
        # Try tickets collection
        result = await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "assigned_to": request.agent_id,
                    "assigned_name": request.agent_name,
                    "assigned_at": now,
                    "status": "claimed",
                    "updated_at": now
                },
                "$push": {
                    "audit_trail": {
                        "action": "claimed",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "agent_id": request.agent_id
                    }
                }
            }
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Send push notification for assignment
    push_result = None
    member_email = ticket.get("member_email") or ticket.get("customer", {}).get("email") if ticket else None
    if member_email:
        try:
            push_result = await notify_ticket_update(
                ticket_id=ticket_id,
                user_email=member_email,
                update_type="assignment",
                details={"agent_name": request.agent_name}
            )
            logger.info(f"Push notification sent for ticket assignment {ticket_id}: {push_result}")
        except Exception as e:
            logger.warning(f"Failed to send push notification: {e}")
    
    return {"success": True, "message": f"Claimed by {request.agent_name}", "push_notification": push_result}


@router.post("/item/{ticket_id}/unclaim")
async def unclaim_item(ticket_id: str, request: ClaimRequest):
    """Release a claimed item back to the queue."""
    db = get_db()
    now = get_utc_timestamp()
    
    for collection in [db.service_desk_tickets, db.tickets]:
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "assigned_to": None,
                    "assigned_name": None,
                    "assigned_at": None,
                    "status": "pending",
                    "updated_at": now
                },
                "$push": {
                    "audit_trail": {
                        "action": "unclaimed",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "agent_id": request.agent_id
                    }
                }
            }
        )
        if result.modified_count > 0:
            return {"success": True, "message": "Released back to queue"}
    
    raise HTTPException(status_code=404, detail="Item not found")


@router.post("/item/{ticket_id}/add-note")
async def add_note(ticket_id: str, request: AddNoteRequest):
    """Add a note to a queue item."""
    db = get_db()
    now = get_utc_timestamp()
    
    note = {
        "content": request.note,
        "is_internal": request.is_internal,
        "added_by": request.agent_name,
        "agent_id": request.agent_id,
        "added_at": now
    }
    
    for collection in [db.service_desk_tickets, db.tickets]:
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {
                    "concierge_notes": note,
                    "audit_trail": {
                        "action": "note_added",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "details": "Internal note" if request.is_internal else "Member note"
                    }
                },
                "$set": {"updated_at": now}
            }
        )
        if result.modified_count > 0:
            return {"success": True, "note": note}
    
    raise HTTPException(status_code=404, detail="Item not found")


class ResolveRequest(BaseModel):
    agent_name: str
    agent_id: Optional[str] = None
    resolution_notes: str
    internal_notes: Optional[str] = None
    send_via: str = "email"  # email, whatsapp, mira
    send_nps_survey: bool = True  # Send NPS survey after resolution


@router.post("/item/{ticket_id}/resolve")
async def resolve_item(ticket_id: str, request: ResolveRequest):
    """
    Resolve a queue item. MUST communicate to member.
    Optionally sends NPS (Net Pawmoter Score) survey.
    """
    db = get_db()
    now = get_utc_timestamp()
    
    # Find the item first to get member info
    item = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    collection = db.service_desk_tickets
    
    if not item:
        item = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
        collection = db.tickets
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update the item
    update_data = {
        "status": "resolved",
        "resolved_at": now,
        "resolved_by": request.agent_name,
        "resolution_summary": request.resolution_notes,
        "updated_at": now
    }
    
    if request.internal_notes:
        update_data["internal_resolution_notes"] = request.internal_notes
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": update_data,
            "$push": {
                "audit_trail": {
                    "action": "resolved",
                    "timestamp": now,
                    "performed_by": request.agent_name,
                    "agent_id": request.agent_id,
                    "send_via": request.send_via,
                    "resolution": request.resolution_notes
                }
            }
        }
    )
    
    # Send notification to member
    member_email = item.get("member", {}).get("email")
    member_name = item.get("member", {}).get("name")
    notification_sent = False
    nps_sent = False
    
    if member_email and request.send_via == "email":
        # Send email
        try:
            from communication_engine import send_email
            await send_email(
                to_email=member_email,
                subject=f"Update on your request - {ticket_id}",
                body=request.resolution_notes
            )
            notification_sent = True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
    
    elif request.send_via == "mira":
        # Add to Mira conversation thread
        mira_session = item.get("mira_session_id")
        if mira_session:
            await db.mira_tickets.update_one(
                {"mira_session_id": mira_session},
                {
                    "$push": {
                        "messages": {
                            "type": "concierge_resolution",
                            "content": request.resolution_notes,
                            "sender": "concierge",
                            "agent_name": request.agent_name,
                            "timestamp": now
                        }
                    }
                }
            )
            notification_sent = True
    
    # Send NPS survey if requested and member email exists
    if request.send_nps_survey and member_email:
        try:
            nps_sent = await send_nps_survey(
                member_email=member_email,
                member_name=member_name or "Pet Parent",
                ticket_id=ticket_id,
                resolved_by=request.agent_name
            )
            logger.info(f"NPS survey sent for ticket {ticket_id}: {nps_sent}")
        except Exception as e:
            logger.warning(f"Failed to send NPS survey: {e}")
    
    # Send push notification for resolution
    push_result = None
    if member_email:
        try:
            push_result = await notify_ticket_update(
                ticket_id=ticket_id,
                user_email=member_email,
                update_type="resolution",
                details={"agent_name": request.agent_name}
            )
            logger.info(f"Push notification sent for ticket resolution {ticket_id}: {push_result}")
        except Exception as e:
            logger.warning(f"Failed to send push notification: {e}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TRAIT GRAPH UPDATE - Per MOJO Bible Part 7 §4
    # "When tasks complete: update traits with high confidence"
    # ═══════════════════════════════════════════════════════════════════════════
    trait_graph_result = None
    if TRAIT_GRAPH_AVAILABLE and item.get("pet_id"):
        try:
            trait_graph_result = await on_service_completed(db, {
                "pet_id": item.get("pet_id"),
                "type": item.get("type", item.get("pillar", "general")),
                "outcome": {
                    "resolution": request.resolution_notes,
                    "resolved_by": request.agent_name,
                    "resolved_at": now,
                },
                "notes": request.resolution_notes,
            })
            if trait_graph_result.get("success"):
                logger.info(f"[TRAIT-GRAPH] ✅ MOJO updated from ticket resolution: {ticket_id}")
            else:
                logger.warning(f"[TRAIT-GRAPH] Could not update MOJO: {trait_graph_result}")
        except Exception as e:
            logger.warning(f"[TRAIT-GRAPH] Error updating MOJO from ticket: {e}")
    
    return {
        "success": True,
        "message": "Resolved and member notified",
        "notification_sent": notification_sent,
        "send_via": request.send_via,
        "nps_survey_sent": nps_sent,
        "push_notification": push_result,
        "mojo_updated": trait_graph_result.get("success") if trait_graph_result else False
    }


@router.post("/item/{ticket_id}/escalate")
async def escalate_item(ticket_id: str, request: AddNoteRequest):
    """Escalate priority of an item."""
    db = get_db()
    now = get_utc_timestamp()
    
    for collection in [db.service_desk_tickets, db.tickets]:
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "priority": "high",
                    "escalated": True,
                    "escalated_at": now,
                    "escalated_by": request.agent_name,
                    "escalation_reason": request.note,
                    "updated_at": now
                },
                "$push": {
                    "audit_trail": {
                        "action": "escalated",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "reason": request.note
                    }
                }
            }
        )
        if result.modified_count > 0:
            return {"success": True, "message": "Escalated to high priority"}
    
    raise HTTPException(status_code=404, detail="Item not found")


# ============== NPS (NET PAWMOTER SCORE) ==============

class NPSResponseRequest(BaseModel):
    score: int  # 0-10
    feedback: Optional[str] = None
    allow_publish: bool = False  # Allow review to be published


@router.post("/nps/respond")
async def submit_nps_response(
    ticket_id: str,
    token: str,
    request: NPSResponseRequest
):
    """Submit NPS survey response."""
    result = await record_nps_response(
        ticket_id=ticket_id,
        survey_token=token,
        score=request.score,
        feedback=request.feedback,
        allow_publish=request.allow_publish
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to record response"))
    
    return result


@router.get("/nps/stats")
async def get_nps_stats(days: int = 30):
    """Get NPS statistics for reporting."""
    db = get_db()
    
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get completed surveys
    surveys = await db.nps_surveys.find({
        "status": "completed",
        "responded_at": {"$gte": from_date}
    }).to_list(1000)
    
    if not surveys:
        return {
            "total_responses": 0,
            "nps_score": None,
            "promoters": 0,
            "passives": 0,
            "detractors": 0,
            "average_score": None
        }
    
    promoters = sum(1 for s in surveys if s.get("score", 0) >= 9)
    passives = sum(1 for s in surveys if 7 <= s.get("score", 0) <= 8)
    detractors = sum(1 for s in surveys if s.get("score", 0) <= 6)
    
    total = len(surveys)
    nps_score = ((promoters - detractors) / total) * 100 if total > 0 else 0
    average_score = sum(s.get("score", 0) for s in surveys) / total if total > 0 else 0
    
    return {
        "total_responses": total,
        "nps_score": round(nps_score, 1),
        "promoters": promoters,
        "promoters_percent": round((promoters / total) * 100, 1) if total > 0 else 0,
        "passives": passives,
        "passives_percent": round((passives / total) * 100, 1) if total > 0 else 0,
        "detractors": detractors,
        "detractors_percent": round((detractors / total) * 100, 1) if total > 0 else 0,
        "average_score": round(average_score, 1),
        "period_days": days
    }


@router.get("/nps/testimonials")
async def get_nps_testimonials(limit: int = 10):
    """Get approved NPS testimonials for display on product pages."""
    db = get_db()
    
    # Get completed surveys with high scores (9-10 = promoters) and allow_publish = true
    testimonials = await db.nps_surveys.find({
        "status": "completed",
        "score": {"$gte": 9},  # Only promoters
        "allow_publish": True,  # Only those who opted in
        "feedback": {"$exists": True, "$ne": None, "$ne": ""}  # Must have feedback
    }, {"_id": 0}).sort("responded_at", -1).limit(limit).to_list(limit)
    
    # Format testimonials for display
    formatted = []
    for t in testimonials:
        formatted.append({
            "id": t.get("id") or t.get("ticket_id"),
            "score": t.get("score"),
            "feedback": t.get("feedback"),
            "member_name": t.get("member_name", "Happy Customer"),
            "pet_name": t.get("pet_name"),
            "responded_at": t.get("responded_at"),
            "pillar": t.get("pillar")
        })
    
    return {"testimonials": formatted, "count": len(formatted)}


@router.get("/nps/responses")
async def get_nps_responses(limit: int = 100, skip: int = 0):
    """Get all NPS responses with full details for admin view."""
    db = get_db()
    
    # Get all completed surveys with full details
    surveys = await db.nps_surveys.find(
        {"status": "completed"},
        {"_id": 0}
    ).sort("responded_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.nps_surveys.count_documents({"status": "completed"})
    
    responses = []
    for s in surveys:
        responses.append({
            "id": s.get("id") or s.get("ticket_id"),
            "ticket_id": s.get("ticket_id"),
            "score": s.get("score"),
            "feedback": s.get("feedback"),
            "customer_name": s.get("member_name", "Anonymous"),
            "email": s.get("member_email"),
            "pet_name": s.get("pet_name"),
            "product_name": s.get("product_name"),
            "product_id": s.get("product_id"),
            "pillar": s.get("pillar"),
            "allow_publish": s.get("allow_publish", False),
            "created_at": s.get("responded_at") or s.get("created_at")
        })
    
    return {"responses": responses, "total": total}


@router.get("/nps/by-product")
async def get_nps_by_product():
    """Get NPS scores grouped by product for admin dashboard."""
    db = get_db()
    
    # Aggregate NPS by product
    pipeline = [
        {"$match": {"status": "completed", "product_id": {"$exists": True, "$ne": None}}},
        {"$group": {
            "_id": "$product_id",
            "product_name": {"$first": "$product_name"},
            "avg_score": {"$avg": "$score"},
            "responses_count": {"$sum": 1},
            "promoters": {"$sum": {"$cond": [{"$gte": ["$score", 9]}, 1, 0]}},
            "passives": {"$sum": {"$cond": [{"$and": [{"$gte": ["$score", 7]}, {"$lt": ["$score", 9]}]}, 1, 0]}},
            "detractors": {"$sum": {"$cond": [{"$lt": ["$score", 7]}, 1, 0]}},
            "latest_feedback": {"$last": "$feedback"}
        }},
        {"$sort": {"responses_count": -1}}
    ]
    
    products = await db.nps_surveys.aggregate(pipeline).to_list(100)
    
    # Enrich with product images if available
    enriched = []
    for p in products:
        product_id = p.get("_id")
        product_info = await db.products_master.find_one({"id": product_id}, {"_id": 0, "images": 1, "name": 1})
        
        nps_score = None
        if p.get("responses_count", 0) > 0:
            total = p["responses_count"]
            nps_score = round(((p["promoters"] - p["detractors"]) / total) * 100, 1)
        
        enriched.append({
            "product_id": product_id,
            "name": p.get("product_name") or (product_info.get("name") if product_info else "Unknown"),
            "image_url": (product_info.get("images", [None])[0] if product_info else None),
            "avg_score": round(p.get("avg_score", 0), 1),
            "nps_score": nps_score,
            "responses_count": p.get("responses_count", 0),
            "promoters": p.get("promoters", 0),
            "passives": p.get("passives", 0),
            "detractors": p.get("detractors", 0),
            "latest_feedback": p.get("latest_feedback")
        })
    
    return {"products": enriched}


# ============== TICKET MERGE ==============

class MergeTicketsRequest(BaseModel):
    primary_ticket_id: str  # The ticket that will remain
    secondary_ticket_ids: List[str]  # Tickets to merge into primary
    agent_name: str
    merge_reason: Optional[str] = None


@router.post("/tickets/merge")
async def merge_tickets(request: MergeTicketsRequest):
    """
    Merge multiple tickets from the same member into one.
    Secondary tickets are marked as merged and closed.
    All history is preserved on the primary ticket.
    """
    db = get_db()
    now = get_utc_timestamp()
    
    # Find primary ticket
    primary = await db.service_desk_tickets.find_one({"ticket_id": request.primary_ticket_id})
    if not primary:
        primary = await db.tickets.find_one({"ticket_id": request.primary_ticket_id})
    
    if not primary:
        raise HTTPException(status_code=404, detail=f"Primary ticket {request.primary_ticket_id} not found")
    
    merged_count = 0
    merged_tickets = []
    
    for secondary_id in request.secondary_ticket_ids:
        # Find secondary ticket
        secondary = await db.service_desk_tickets.find_one({"ticket_id": secondary_id})
        collection = db.service_desk_tickets
        if not secondary:
            secondary = await db.tickets.find_one({"ticket_id": secondary_id})
            collection = db.tickets
        
        if not secondary:
            continue  # Skip if not found
        
        # Collect data to merge
        merge_data = {
            "merged_from": secondary_id,
            "merged_at": now,
            "original_request": secondary.get("original_request"),
            "description": secondary.get("description"),
            "subject": secondary.get("subject"),
            "notes": secondary.get("concierge_notes", []),
            "communications": secondary.get("communications", []),
            "timeline": secondary.get("timeline", []),
            "audit_trail": secondary.get("audit_trail", [])
        }
        
        # Update primary ticket
        await db.service_desk_tickets.update_one(
            {"ticket_id": request.primary_ticket_id},
            {
                "$push": {
                    "merged_tickets": merge_data,
                    "audit_trail": {
                        "action": "ticket_merged",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "merged_ticket_id": secondary_id,
                        "reason": request.merge_reason
                    }
                },
                "$set": {"updated_at": now}
            },
            upsert=False
        )
        
        # Also try tickets collection
        await db.tickets.update_one(
            {"ticket_id": request.primary_ticket_id},
            {
                "$push": {
                    "merged_tickets": merge_data,
                    "audit_trail": {
                        "action": "ticket_merged",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "merged_ticket_id": secondary_id,
                        "reason": request.merge_reason
                    }
                },
                "$set": {"updated_at": now}
            },
            upsert=False
        )
        
        # Close secondary ticket
        await collection.update_one(
            {"ticket_id": secondary_id},
            {
                "$set": {
                    "status": "merged",
                    "merged_into": request.primary_ticket_id,
                    "merged_at": now,
                    "merged_by": request.agent_name,
                    "updated_at": now
                },
                "$push": {
                    "audit_trail": {
                        "action": "merged_into",
                        "timestamp": now,
                        "performed_by": request.agent_name,
                        "primary_ticket_id": request.primary_ticket_id
                    }
                }
            }
        )
        
        merged_count += 1
        merged_tickets.append(secondary_id)
    
    return {
        "success": True,
        "primary_ticket_id": request.primary_ticket_id,
        "merged_count": merged_count,
        "merged_tickets": merged_tickets,
        "message": f"Merged {merged_count} ticket(s) into {request.primary_ticket_id}"
    }


@router.get("/tickets/mergeable/{member_email}")
async def get_mergeable_tickets(member_email: str):
    """Get all open tickets for a member that could be merged."""
    db = get_db()
    
    # Find all open tickets for this member
    service_tickets = await db.service_desk_tickets.find({
        "$or": [
            {"member.email": member_email},
            {"customer_email": member_email}
        ],
        "status": {"$nin": ["resolved", "closed", "merged"]}
    }, {"_id": 0}).to_list(50)
    
    regular_tickets = await db.tickets.find({
        "$or": [
            {"member.email": member_email},
            {"customer.email": member_email}
        ],
        "status": {"$nin": ["resolved", "closed", "merged"]}
    }, {"_id": 0}).to_list(50)
    
    all_tickets = service_tickets + regular_tickets
    
    return {
        "member_email": member_email,
        "mergeable_count": len(all_tickets),
        "tickets": all_tickets
    }


# ============== SENTIMENT ANALYSIS ENDPOINT ==============

@router.post("/analyze-sentiment")
async def analyze_text_sentiment(text: str):
    """Analyze sentiment of text (for testing/preview)."""
    result = await analyze_sentiment(text)
    return result


# ============== GENERATE AI DRAFT ==============

@router.post("/item/{ticket_id}/generate-draft")
async def generate_ai_draft(ticket_id: str):
    """
    Generate AI-assisted draft response based on member history.
    """
    db = get_db()
    
    # Get full item detail
    detail = await get_item_detail(ticket_id)
    
    if not detail:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item = detail["item"]
    member = detail.get("member_snapshot", {})
    pets = detail.get("pets_snapshot", [])
    intelligence = detail.get("mira_intelligence", {})
    
    # Build context for LLM
    context_parts = []
    
    # Member info
    if member:
        context_parts.append(f"Member: {member.get('name', 'Customer')} ({member.get('membership_tier', 'free')} tier)")
    
    # Pets info
    if pets:
        pet_info = []
        for pet in pets:
            allergies = ", ".join(pet.get("allergies", [])) or "None"
            pet_info.append(f"- {pet['name']} ({pet.get('breed', 'Unknown breed')}), Weight: {pet.get('weight', 'Unknown')}, Allergies: {allergies}")
        context_parts.append(f"Pets:\n" + "\n".join(pet_info))
    
    # Past orders (extract sizes, preferences)
    if intelligence.get("past_orders"):
        order_summary = []
        for order in intelligence["past_orders"][:5]:
            items_str = ", ".join([f"{i.get('name', 'Item')}" for i in order.get("items", [])[:2]])
            order_summary.append(f"- {order.get('date', 'N/A')}: {items_str}")
        if order_summary:
            context_parts.append(f"Recent Orders:\n" + "\n".join(order_summary))
    
    # Memories
    if intelligence.get("memories"):
        memory_str = "\n".join([f"- {m['content']}" for m in intelligence["memories"][:5]])
        context_parts.append(f"What we remember:\n{memory_str}")
    
    # Current request
    context_parts.append(f"Current Request: {item.get('original_request', 'No details')}")
    
    # Generate draft using LLM
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return {"draft": None, "error": "LLM not configured"}
        
        system_prompt = """You are a concierge assistant helping draft responses for The Doggy Company.
        
Write a warm, helpful response that:
1. Acknowledges the customer by name
2. References relevant past purchases or known preferences
3. Provides specific, actionable help
4. Uses the pet's name when relevant
5. Is concise (2-3 paragraphs max)

Do NOT include:
- Generic greetings like "Dear Valued Customer"
- Overly formal language
- Placeholders like [NAME] - use actual names
- Pricing unless specifically asked"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"draft-{ticket_id}-{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-4o-mini")
        
        context = "\n\n".join(context_parts)
        prompt = f"Based on this context, draft a helpful response:\n\n{context}"
        
        draft = await chat.send_message(UserMessage(text=prompt))
        
        # Store the draft
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "auto_draft": {
                        "content": draft,
                        "generated_at": get_utc_timestamp(),
                        "context_used": context[:500]
                    }
                }
            }
        )
        
        return {
            "draft": draft,
            "context_summary": context[:1000]
        }
        
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        return {"draft": None, "error": str(e)}


# ============== PHASE 2: SLA & AUTO-ASSIGNMENT ==============

def calculate_sla_status(item: Dict) -> Dict:
    """Calculate SLA status with countdown timer info."""
    priority = item.get("priority", "medium")
    # Handle various priority formats
    if isinstance(priority, int):
        priority_map = {1: "urgent", 2: "high", 3: "medium", 4: "low"}
        priority = priority_map.get(priority, "medium")
    elif isinstance(priority, str):
        priority = priority.lower()
    else:
        priority = "medium"
    
    sla_hours = SLA_HOURS.get(priority, 24)
    
    created_at = item.get("created_at")
    if not created_at:
        return {"status": "unknown", "remaining_seconds": 0, "breached": False}
    
    try:
        if isinstance(created_at, str):
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        else:
            created = created_at
        
        deadline = created + timedelta(hours=sla_hours)
        now = datetime.now(timezone.utc)
        remaining = (deadline - now).total_seconds()
        
        return {
            "status": "breached" if remaining < 0 else "warning" if remaining < 3600 else "ok",
            "remaining_seconds": max(0, remaining),
            "remaining_formatted": format_time_remaining(remaining),
            "deadline": deadline.isoformat(),
            "sla_hours": sla_hours,
            "breached": remaining < 0,
            "breach_by_seconds": abs(remaining) if remaining < 0 else 0
        }
    except Exception as e:
        logger.error(f"SLA calculation error: {e}")
        return {"status": "unknown", "remaining_seconds": 0, "breached": False}


def format_time_remaining(seconds: float) -> str:
    """Format remaining seconds into human-readable string."""
    if seconds < 0:
        abs_seconds = abs(seconds)
        if abs_seconds < 3600:
            return f"⚠️ {int(abs_seconds // 60)}m overdue"
        elif abs_seconds < 86400:
            return f"⚠️ {int(abs_seconds // 3600)}h {int((abs_seconds % 3600) // 60)}m overdue"
        else:
            return f"⚠️ {int(abs_seconds // 86400)}d overdue"
    
    if seconds < 3600:
        return f"⏱️ {int(seconds // 60)}m remaining"
    elif seconds < 86400:
        return f"⏱️ {int(seconds // 3600)}h {int((seconds % 3600) // 60)}m remaining"
    else:
        return f"⏱️ {int(seconds // 86400)}d {int((seconds % 86400) // 3600)}h remaining"


@router.get("/sla-status/{ticket_id}")
async def get_ticket_sla_status(ticket_id: str):
    """Get real-time SLA status for a specific ticket."""
    db = get_db()
    
    # Find ticket in various collections
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return calculate_sla_status(ticket)


@router.get("/sla-breaches")
async def get_sla_breaches(limit: int = 50):
    """Get all tickets that have breached or are about to breach SLA."""
    db = get_db()
    now = datetime.now(timezone.utc)
    
    breaches = []
    warnings = []
    
    # Check service_desk_tickets
    tickets = await db.service_desk_tickets.find(
        {"status": {"$nin": ["resolved", "closed"]}},
        {"_id": 0}
    ).to_list(500)
    
    for ticket in tickets:
        sla = calculate_sla_status(ticket)
        ticket["sla"] = sla
        
        if sla["breached"]:
            breaches.append(ticket)
        elif sla["status"] == "warning":
            warnings.append(ticket)
    
    # Check regular tickets
    regular_tickets = await db.tickets.find(
        {"status": {"$nin": ["resolved", "closed"]}},
        {"_id": 0}
    ).to_list(500)
    
    for ticket in regular_tickets:
        sla = calculate_sla_status(ticket)
        ticket["sla"] = sla
        
        if sla["breached"]:
            breaches.append(ticket)
        elif sla["status"] == "warning":
            warnings.append(ticket)
    
    # Sort by severity
    breaches.sort(key=lambda x: x["sla"].get("breach_by_seconds", 0), reverse=True)
    warnings.sort(key=lambda x: x["sla"].get("remaining_seconds", 0))
    
    return {
        "breaches": breaches[:limit],
        "breaches_count": len(breaches),
        "warnings": warnings[:limit],
        "warnings_count": len(warnings),
        "total_at_risk": len(breaches) + len(warnings)
    }


# ============== AUTO-ASSIGNMENT ==============

class AutoAssignmentRule(BaseModel):
    pillar: Optional[str] = None
    priority: Optional[str] = None
    assign_to: str
    is_active: bool = True


@router.get("/agents")
async def get_available_agents():
    """Get list of available agents for assignment."""
    db = get_db()
    
    # Get agents from agents collection (primary) and admin_users (fallback)
    agents = await db.agents.find(
        {"is_active": True},
        {"_id": 0, "username": 1, "name": 1, "email": 1}
    ).to_list(100)
    
    # Also include admin users
    admin_users = await db.admin_users.find(
        {"is_active": True},
        {"_id": 0, "name": 1, "email": 1, "role": 1}
    ).to_list(100)
    
    # Add admin users with username derived from email
    for admin in admin_users:
        admin["username"] = admin.get("email", "").split("@")[0] if admin.get("email") else admin.get("name", "admin")
        agents.append(admin)
    
    # Get workload for each agent
    for agent in agents:
        assigned_count = await db.service_desk_tickets.count_documents({
            "assigned_to": agent["username"],
            "status": {"$nin": ["resolved", "closed"]}
        })
        agent["active_tickets"] = assigned_count
    
    return {"agents": agents}


@router.post("/auto-assign/{ticket_id}")
async def auto_assign_ticket(ticket_id: str):
    """Auto-assign ticket based on rules (load-balanced)."""
    db = get_db()
    
    # Get ticket
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.get("assigned_to"):
        return {"message": "Ticket already assigned", "assigned_to": ticket["assigned_to"]}
    
    # Get agents with workload
    agents_response = await get_available_agents()
    agents = agents_response["agents"]
    
    if not agents:
        return {"message": "No agents available", "assigned_to": None}
    
    # Load-balanced assignment: pick agent with least active tickets
    agents.sort(key=lambda x: x.get("active_tickets", 0))
    selected_agent = agents[0]["username"]
    
    # Assign the ticket
    await db.service_desk_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "assigned_to": selected_agent,
                "assigned_at": get_utc_timestamp(),
                "auto_assigned": True
            },
            "$push": {
                "timeline": {
                    "action": "auto_assigned",
                    "by": "system",
                    "to": selected_agent,
                    "at": get_utc_timestamp()
                }
            }
        }
    )
    
    return {
        "success": True,
        "assigned_to": selected_agent,
        "reason": "load_balanced"
    }


@router.post("/bulk-auto-assign")
async def bulk_auto_assign(max_tickets: int = 10):
    """Auto-assign multiple unassigned tickets."""
    db = get_db()
    
    # Get unassigned tickets
    unassigned = await db.service_desk_tickets.find(
        {
            "assigned_to": {"$exists": False},
            "status": {"$nin": ["resolved", "closed"]}
        },
        {"ticket_id": 1, "_id": 0}
    ).limit(max_tickets).to_list(max_tickets)
    
    results = []
    for ticket in unassigned:
        result = await auto_assign_ticket(ticket["ticket_id"])
        results.append({"ticket_id": ticket["ticket_id"], **result})
    
    return {
        "assigned_count": len([r for r in results if r.get("success")]),
        "results": results
    }


# ============== REPORTING & ANALYTICS ==============

@router.get("/reports/overview")
async def get_command_center_overview():
    """Get overview statistics for the command center."""
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    # Service desk tickets stats
    total_tickets = await db.service_desk_tickets.count_documents({})
    open_tickets = await db.service_desk_tickets.count_documents({
        "status": {"$nin": ["resolved", "closed"]}
    })
    resolved_today = await db.service_desk_tickets.count_documents({
        "status": "resolved",
        "resolved_at": {"$gte": today_start.isoformat()}
    })
    
    # SLA stats
    sla_data = await get_sla_breaches(limit=1000)
    
    # Agent performance - get from agents collection
    agents = await db.agents.find({"is_active": True}, {"username": 1, "_id": 0}).to_list(100)
    # Also include admin users
    admin_users = await db.admin_users.find({"is_active": True}, {"email": 1, "_id": 0}).to_list(100)
    for admin in admin_users:
        agents.append({"username": admin.get("email", "").split("@")[0]})
    
    agent_stats = []
    
    for agent in agents:
        username = agent["username"]
        assigned = await db.service_desk_tickets.count_documents({
            "assigned_to": username,
            "status": {"$nin": ["resolved", "closed"]}
        })
        resolved_by_agent = await db.service_desk_tickets.count_documents({
            "resolved_by": username,
            "resolved_at": {"$gte": week_start.isoformat()}
        })
        agent_stats.append({
            "username": username,
            "active_tickets": assigned,
            "resolved_this_week": resolved_by_agent
        })
    
    # Average response time (approximate)
    resolved_tickets = await db.service_desk_tickets.find(
        {"status": "resolved", "resolved_at": {"$exists": True}},
        {"created_at": 1, "resolved_at": 1, "_id": 0}
    ).limit(100).to_list(100)
    
    avg_resolution_hours = 0
    if resolved_tickets:
        total_hours = 0
        count = 0
        for t in resolved_tickets:
            try:
                created = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                resolved = datetime.fromisoformat(t["resolved_at"].replace("Z", "+00:00"))
                total_hours += (resolved - created).total_seconds() / 3600
                count += 1
            except:
                pass
        if count > 0:
            avg_resolution_hours = total_hours / count
    
    return {
        "overview": {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_today": resolved_today,
            "sla_breaches": sla_data["breaches_count"],
            "sla_warnings": sla_data["warnings_count"]
        },
        "performance": {
            "avg_resolution_hours": round(avg_resolution_hours, 1),
            "agent_stats": agent_stats
        },
        "generated_at": now.isoformat()
    }


@router.get("/reports/daily")
async def get_daily_report(days: int = 7):
    """Get daily ticket statistics."""
    db = get_db()
    now = datetime.now(timezone.utc)
    
    daily_stats = []
    for i in range(days):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        created = await db.service_desk_tickets.count_documents({
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        resolved = await db.service_desk_tickets.count_documents({
            "resolved_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        daily_stats.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "day": day_start.strftime("%a"),
            "created": created,
            "resolved": resolved
        })
    
    daily_stats.reverse()
    
    return {"daily_stats": daily_stats}


# ============== OMNI-CHANNEL REPLIES ==============

class OmniChannelReply(BaseModel):
    ticket_id: str
    message: str
    channel: str  # "email", "whatsapp", "mira"
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None


@router.post("/reply/email")
async def send_email_reply(
    ticket_id: str,
    message: str,
    recipient_email: str,
    subject: Optional[str] = None
):
    """Send email reply to customer via Resend."""
    db = get_db()
    
    # Get ticket for context
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get member info for personalization
    member = ticket.get("member", {}) or {}
    member_name = member.get("name", "there")
    
    # Prepare email
    try:
        import resend
        api_key = os.environ.get("RESEND_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Email not configured")
        
        resend.api_key = api_key
        
        email_subject = subject or f"Re: Your Request #{ticket_id}"
        
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🐕 The Doggy Company</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
                <p style="color: #374151; font-size: 16px;">Hi {member_name},</p>
                <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">{message}</div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">Reference: #{ticket_id}</p>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    🐾 The Doggy Company | woof@thedoggycompany.com
                </p>
            </div>
        </div>
        """
        
        response = resend.Emails.send({
            "from": "THEDOGGYCOMPANY <woof@thedoggycompany.com>",
            "to": [recipient_email],
            "subject": email_subject,
            "html": html_content
        })
        
        # Log the communication
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {
                    "communications": {
                        "channel": "email",
                        "to": recipient_email,
                        "subject": email_subject,
                        "message": message,
                        "sent_at": get_utc_timestamp(),
                        "status": "sent",
                        "email_id": response.get("id") if isinstance(response, dict) else str(response)
                    }
                }
            }
        )
        
        return {
            "success": True,
            "channel": "email",
            "recipient": recipient_email,
            "message": "Email sent successfully"
        }
        
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")


@router.post("/reply/whatsapp")
async def send_whatsapp_reply(
    ticket_id: str,
    message: str,
    recipient_phone: str
):
    """Send WhatsApp reply to customer via Gupshup API."""
    db = get_db()
    
    # Clean phone number
    phone = recipient_phone.replace(" ", "").replace("-", "").replace("+", "")
    if not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    
    # Check if Gupshup is configured
    gupshup_api_key = os.environ.get("GUPSHUP_API_KEY")
    gupshup_app_name = os.environ.get("GUPSHUP_APP_NAME", "DoggyCompany")
    gupshup_source = os.environ.get("GUPSHUP_SOURCE_NUMBER", "919663185747")
    
    sent_via_api = False
    whatsapp_link = None
    api_response = None
    
    if gupshup_api_key:
        # Send via Gupshup API
        try:
            import httpx
            import json
            
            async with httpx.AsyncClient() as client:
                payload = {
                    "channel": "whatsapp",
                    "source": gupshup_source,
                    "destination": phone,
                    "message": json.dumps({
                        "type": "text",
                        "text": message
                    }),
                    "src.name": gupshup_app_name
                }
                
                response = await client.post(
                    "https://api.gupshup.io/wa/api/v1/msg",
                    headers={
                        "apikey": gupshup_api_key,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data=payload
                )
                
                result = response.json()
                
                if response.status_code == 200 and result.get("status") != "error":
                    sent_via_api = True
                    api_response = result
                    logger.info(f"[GUPSHUP] WhatsApp sent to {phone}: {result}")
                else:
                    logger.error(f"[GUPSHUP] API error: {result}")
                    
        except Exception as e:
            logger.error(f"[GUPSHUP] Send failed: {e}")
    
    # Fallback: Generate click-to-chat link if API fails
    if not sent_via_api:
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        whatsapp_link = f"https://wa.me/{phone}?text={encoded_message}"
    
    # Log the communication
    comm_log = {
        "channel": "whatsapp",
        "to": recipient_phone,
        "message": message,
        "sent_at": get_utc_timestamp(),
        "status": "sent" if sent_via_api else "link_generated",
        "sent_via": "gupshup_api" if sent_via_api else "manual_link"
    }
    
    if api_response:
        comm_log["message_id"] = api_response.get("messageId")
    if whatsapp_link:
        comm_log["link"] = whatsapp_link
    
    await db.service_desk_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$push": {"communications": comm_log}}
    )
    
    # Also update regular tickets collection
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$push": {"communications": comm_log}}
    )
    
    if sent_via_api:
        return {
            "success": True,
            "channel": "whatsapp",
            "phone": phone,
            "message": "WhatsApp sent via Gupshup",
            "sent_via": "gupshup_api",
            "message_id": api_response.get("messageId") if api_response else None
        }
    else:
        return {
            "success": True,
            "channel": "whatsapp",
            "link": whatsapp_link,
            "phone": phone,
            "message": "Click the link to open WhatsApp (API fallback)",
            "sent_via": "manual_link"
        }


# ============== SELF-SERVICE PORTAL ==============

@router.get("/member/tickets")
async def get_member_tickets(email: str):
    """Get all tickets for a member (self-service portal)."""
    db = get_db()
    
    # Search across collections
    service_tickets = await db.service_desk_tickets.find(
        {"$or": [
            {"member.email": email},
            {"member_email": email},
            {"customer.email": email}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    regular_tickets = await db.tickets.find(
        {"$or": [
            {"customer.email": email},
            {"member_email": email}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add SLA info to each ticket
    all_tickets = []
    for ticket in service_tickets:
        ticket["source"] = "service_desk"
        ticket["sla"] = calculate_sla_status(ticket)
        all_tickets.append(ticket)
    
    for ticket in regular_tickets:
        ticket["source"] = "regular"
        ticket["sla"] = calculate_sla_status(ticket)
        all_tickets.append(ticket)
    
    # Sort by created_at - handle datetime vs string
    def sort_by_created(x):
        val = x.get("created_at", "")
        if val is None:
            return ""
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val)
    
    all_tickets.sort(key=sort_by_created, reverse=True)
    
    # Stats
    open_count = len([t for t in all_tickets if t.get("status") not in ["resolved", "closed"]])
    resolved_count = len([t for t in all_tickets if t.get("status") in ["resolved", "closed"]])
    
    return {
        "tickets": all_tickets,
        "stats": {
            "total": len(all_tickets),
            "open": open_count,
            "resolved": resolved_count
        }
    }


@router.get("/member/ticket/{ticket_id}")
async def get_member_ticket_detail(ticket_id: str, email: str):
    """Get ticket detail for a member (with email verification)."""
    db = get_db()
    
    # Find ticket
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify ownership
    ticket_email = (
        ticket.get("member", {}).get("email") or 
        ticket.get("member_email") or 
        ticket.get("customer", {}).get("email")
    )
    
    if ticket_email != email:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    
    # Add SLA info
    ticket["sla"] = calculate_sla_status(ticket)
    
    # Get communications (filter internal notes)
    communications = ticket.get("communications", [])
    public_comms = [c for c in communications if not c.get("internal")]
    ticket["communications"] = public_comms
    
    return ticket


class MemberTicketReply(BaseModel):
    message: str


@router.post("/member/ticket/{ticket_id}/reply")
async def member_reply_to_ticket(ticket_id: str, email: str, reply: MemberTicketReply):
    """Allow member to add a reply to their ticket."""
    db = get_db()
    
    # Verify ownership first
    ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket_email = (
        ticket.get("member", {}).get("email") or 
        ticket.get("member_email") or 
        ticket.get("customer", {}).get("email")
    )
    
    if ticket_email != email:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Add reply
    reply_doc = {
        "type": "member_reply",
        "message": reply.message,
        "from": email,
        "at": get_utc_timestamp()
    }
    
    # Update in appropriate collection
    collection = db.service_desk_tickets if await db.service_desk_tickets.find_one({"ticket_id": ticket_id}) else db.tickets
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"communications": reply_doc},
            "$set": {
                "status": "open",  # Re-open if resolved
                "updated_at": get_utc_timestamp(),
                "has_new_reply": True
            }
        }
    )
    
    return {
        "success": True,
        "message": "Reply added successfully"
    }


# ============== MANUAL ASSIGNMENT ==============

class ManualAssignRequest(BaseModel):
    agent_username: str
    reason: Optional[str] = None


@router.post("/item/{ticket_id}/manual-assign")
async def manual_assign_ticket(ticket_id: str, request: ManualAssignRequest):
    """Manually assign ticket to a specific agent."""
    db = get_db()
    
    # Verify agent exists in agents collection or admin_users
    agent = await db.agents.find_one({"username": request.agent_username}, {"_id": 0})
    if not agent:
        # Check admin_users by email prefix
        agent = await db.admin_users.find_one(
            {"$or": [
                {"email": {"$regex": f"^{request.agent_username}@", "$options": "i"}},
                {"name": {"$regex": f"^{request.agent_username}$", "$options": "i"}}
            ]},
            {"_id": 0}
        )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Find ticket in various collections
    for collection_name in ["service_desk_tickets", "tickets"]:
        collection = getattr(db, collection_name)
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "assigned_to": request.agent_username,
                    "assigned_at": get_utc_timestamp(),
                    "manual_assigned": True
                },
                "$push": {
                    "timeline": {
                        "action": "manual_assigned",
                        "by": "admin",
                        "to": request.agent_username,
                        "reason": request.reason,
                        "at": get_utc_timestamp()
                    }
                }
            }
        )
        if result.modified_count > 0:
            return {
                "success": True,
                "assigned_to": request.agent_username,
                "reason": "manual_assignment"
            }
    
    raise HTTPException(status_code=404, detail="Ticket not found")


# ============== TICKET CRUD OPERATIONS ==============

class CreateTicketRequest(BaseModel):
    category: str = "general"
    pillar: Optional[str] = None
    urgency: str = "medium"
    subject: str
    description: str
    member_email: Optional[str] = None
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    pet_name: Optional[str] = None
    assigned_to: Optional[str] = None
    source: str = "internal"
    send_acknowledgment: bool = True  # Send auto-acknowledgment email


@router.post("/ticket/create")
async def create_ticket(request: CreateTicketRequest):
    """Create a new ticket manually with sentiment analysis and auto-acknowledgment."""
    db = get_db()
    
    # Generate ticket ID
    import uuid
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
    # Build ticket document
    ticket = {
        "ticket_id": ticket_id,
        "category": request.category,
        "pillar": request.pillar or request.category,
        "urgency": request.urgency,
        "status": "open",
        "subject": request.subject,
        "original_request": request.description,
        "description": request.description,
        "source": request.source,
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp(),
        "assigned_to": request.assigned_to,
        "member": {
            "name": request.member_name,
            "email": request.member_email,
            "phone": request.member_phone
        } if request.member_email else None,
        "pet": {"name": request.pet_name} if request.pet_name else None,
        "timeline": [{
            "action": "created",
            "by": "admin",
            "at": get_utc_timestamp()
        }],
        "communications": []
    }
    
    # Enrich ticket with AI intelligence (sentiment analysis)
    try:
        ticket = await enrich_ticket_with_intelligence(ticket)
        logger.info(f"Ticket {ticket_id} enriched with sentiment: {ticket.get('sentiment', {}).get('sentiment', 'unknown')}")
    except Exception as e:
        logger.warning(f"Failed to enrich ticket with intelligence: {e}")
    
    await db.service_desk_tickets.insert_one(ticket)
    
    # Send auto-acknowledgment email if member email provided
    acknowledgment_sent = False
    if request.send_acknowledgment and request.member_email:
        try:
            acknowledgment_sent = await send_ticket_acknowledgment(
                member_email=request.member_email,
                member_name=request.member_name or "Pet Parent",
                ticket_id=ticket_id,
                subject=request.subject,
                pillar=request.pillar or request.category
            )
        except Exception as e:
            logger.warning(f"Failed to send acknowledgment email: {e}")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "ticket": {k: v for k, v in ticket.items() if k != "_id"},
        "sentiment": ticket.get("sentiment"),
        "acknowledgment_sent": acknowledgment_sent
    }


class UpdateTicketRequest(BaseModel):
    category: Optional[str] = None
    pillar: Optional[str] = None
    urgency: Optional[str] = None
    status: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None


@router.put("/ticket/{ticket_id}")
async def update_ticket(ticket_id: str, request: UpdateTicketRequest):
    """Update an existing ticket."""
    db = get_db()
    
    update_data = {}
    if request.category:
        update_data["category"] = request.category
    if request.pillar:
        update_data["pillar"] = request.pillar
    if request.urgency:
        update_data["urgency"] = request.urgency
    if request.status:
        update_data["status"] = request.status
    if request.subject:
        update_data["subject"] = request.subject
    if request.description:
        update_data["description"] = request.description
        update_data["original_request"] = request.description
    if request.assigned_to:
        update_data["assigned_to"] = request.assigned_to
    
    update_data["updated_at"] = get_utc_timestamp()
    
    # Try both collections
    for collection_name in ["service_desk_tickets", "tickets"]:
        collection = getattr(db, collection_name)
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": update_data,
                "$push": {
                    "timeline": {
                        "action": "updated",
                        "by": "admin",
                        "changes": list(update_data.keys()),
                        "at": get_utc_timestamp()
                    }
                }
            }
        )
        if result.modified_count > 0:
            return {"success": True, "ticket_id": ticket_id, "updated_fields": list(update_data.keys())}
    
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.delete("/ticket/{ticket_id}")
async def delete_ticket(ticket_id: str, permanent: bool = False):
    """Delete or archive a ticket."""
    db = get_db()
    
    for collection_name in ["service_desk_tickets", "tickets"]:
        collection = getattr(db, collection_name)
        
        if permanent:
            result = await collection.delete_one({"ticket_id": ticket_id})
            if result.deleted_count > 0:
                return {"success": True, "action": "deleted", "ticket_id": ticket_id}
        else:
            # Soft delete (archive)
            result = await collection.update_one(
                {"ticket_id": ticket_id},
                {
                    "$set": {
                        "status": "archived",
                        "archived_at": get_utc_timestamp()
                    }
                }
            )
            if result.modified_count > 0:
                return {"success": True, "action": "archived", "ticket_id": ticket_id}
    
    raise HTTPException(status_code=404, detail="Ticket not found")


# ============== CSV EXPORT ==============

@router.get("/export/csv")
async def export_queue_to_csv(
    source: Optional[str] = None,
    priority: Optional[str] = None,
    pillar: Optional[str] = None,
    status: Optional[str] = None
):
    """Export command center queue to CSV format."""
    db = get_db()
    
    # Get queue data using existing function
    queue_data = await get_command_center_queue(
        source=source,
        priority=priority,
        pillar=pillar,
        status=status,
        limit=500
    )
    
    items = queue_data.get("items", [])
    
    # Build CSV
    import io
    import csv
    
    output = io.StringIO()
    fieldnames = [
        "ticket_id", "source_type", "source_label", "pillar", "priority_bucket",
        "status", "original_request", "member_name", "member_email", "member_phone",
        "assigned_to", "created_at", "sla_breached"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for item in items:
        member = item.get("member") or {}
        row = {
            "ticket_id": item.get("ticket_id", ""),
            "source_type": item.get("source_type", ""),
            "source_label": item.get("source_label", ""),
            "pillar": item.get("pillar", item.get("category", "")),
            "priority_bucket": item.get("priority_bucket", ""),
            "status": item.get("status", ""),
            "original_request": (item.get("original_request", "") or "")[:200],
            "member_name": member.get("name", ""),
            "member_email": member.get("email", ""),
            "member_phone": member.get("phone", ""),
            "assigned_to": item.get("assigned_to", ""),
            "created_at": item.get("created_at", ""),
            "sla_breached": "Yes" if item.get("sla_breached") else "No"
        }
        writer.writerow(row)
    
    csv_content = output.getvalue()
    
    from fastapi.responses import Response
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=command_center_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


# ============== QUICK ACTIONS ==============

class QuickActionRequest(BaseModel):
    action: str  # claim, unclaim, change_status, change_priority, escalate
    agent_id: Optional[str] = None
    new_status: Optional[str] = None
    new_priority: Optional[str] = None
    note: Optional[str] = None


@router.post("/item/{ticket_id}/quick-action")
async def ticket_quick_action(ticket_id: str, request: QuickActionRequest):
    """Perform quick action on ticket without opening detail view."""
    db = get_db()
    
    update_data = {"updated_at": get_utc_timestamp()}
    timeline_entry = {
        "action": request.action,
        "at": get_utc_timestamp()
    }
    
    if request.action == "claim":
        if not request.agent_id:
            raise HTTPException(status_code=400, detail="agent_id required for claim")
        update_data["assigned_to"] = request.agent_id
        update_data["status"] = "claimed"
        timeline_entry["by"] = request.agent_id
        
    elif request.action == "unclaim":
        update_data["assigned_to"] = None
        update_data["status"] = "open"
        timeline_entry["by"] = request.agent_id or "system"
        
    elif request.action == "change_status":
        if not request.new_status:
            raise HTTPException(status_code=400, detail="new_status required")
        update_data["status"] = request.new_status
        timeline_entry["new_status"] = request.new_status
        
    elif request.action == "change_priority":
        if not request.new_priority:
            raise HTTPException(status_code=400, detail="new_priority required")
        update_data["priority"] = request.new_priority
        update_data["urgency"] = request.new_priority
        timeline_entry["new_priority"] = request.new_priority
        
    elif request.action == "escalate":
        update_data["priority"] = "urgent"
        update_data["urgency"] = "critical"
        update_data["escalated"] = True
        update_data["escalated_at"] = get_utc_timestamp()
        timeline_entry["escalated"] = True
        if request.note:
            timeline_entry["reason"] = request.note
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
    
    # Try both collections
    for collection_name in ["service_desk_tickets", "tickets"]:
        collection = getattr(db, collection_name)
        result = await collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": update_data,
                "$push": {"timeline": timeline_entry}
            }
        )
        if result.modified_count > 0:
            return {
                "success": True,
                "ticket_id": ticket_id,
                "action": request.action,
                "changes": update_data
            }
    
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/bulk-action")
async def bulk_ticket_action(
    ticket_ids: List[str],
    action: str,
    agent_id: Optional[str] = None,
    new_status: Optional[str] = None,
    new_priority: Optional[str] = None
):
    """Perform bulk action on multiple tickets."""
    results = []
    
    for ticket_id in ticket_ids:
        try:
            request = QuickActionRequest(
                action=action,
                agent_id=agent_id,
                new_status=new_status,
                new_priority=new_priority
            )
            result = await ticket_quick_action(ticket_id, request)
            results.append({"ticket_id": ticket_id, "success": True})
        except Exception as e:
            results.append({"ticket_id": ticket_id, "success": False, "error": str(e)})
    
    return {
        "total": len(ticket_ids),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results
    }


# ============== PILLAR STATS ==============

@router.get("/pillar-stats")
async def get_pillar_stats():
    """Get ticket counts by pillar for filtering."""
    db = get_db()
    
    pillar_counts = {
        "celebrate": 0, "dine": 0, "stay": 0, "travel": 0,
        "care": 0, "shop": 0, "club": 0, "enjoy": 0,
        "fit": 0, "advisory": 0, "paperwork": 0, "emergency": 0,
        "mira": 0, "general": 0
    }
    
    # Count from service_desk_tickets
    pipeline = [
        {"$match": {"status": {"$nin": ["resolved", "closed", "archived"]}}},
        {"$group": {"_id": {"$ifNull": ["$pillar", "$category"]}, "count": {"$sum": 1}}}
    ]
    
    async for doc in db.service_desk_tickets.aggregate(pipeline):
        pillar = doc["_id"] or "general"
        if pillar in pillar_counts:
            pillar_counts[pillar] += doc["count"]
        else:
            pillar_counts["general"] += doc["count"]
    
    # Count from tickets
    async for doc in db.tickets.aggregate(pipeline):
        pillar = doc["_id"] or "general"
        if pillar in pillar_counts:
            pillar_counts[pillar] += doc["count"]
        else:
            pillar_counts["general"] += doc["count"]
    
    return {
        "pillars": pillar_counts,
        "total": sum(pillar_counts.values())
    }



# ============== EVENT STREAM ==============

@router.get("/event-stream")
async def get_event_stream(limit: int = 50):
    """Get real-time event stream of all recent activities."""
    db = get_db()
    
    events = []
    
    # Recent tickets (auto-created and manual)
    recent_tickets = await db.service_desk_tickets.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for t in recent_tickets:
        events.append({
            "id": t.get("ticket_id"),
            "type": "ticket",
            "event_type": t.get("event_type", "ticket"),
            "pillar": t.get("pillar", t.get("category", "general")),
            "title": t.get("subject", t.get("original_request", "")[:50]),
            "description": t.get("original_request", "")[:100],
            "member": t.get("member", {}),
            "pet": t.get("pet", {}),
            "status": t.get("status"),
            "auto_created": t.get("auto_created", False),
            "action_required": t.get("action_required", True),
            "timestamp": t.get("created_at"),
            "source": t.get("source", "manual")
        })
    
    # Recent orders
    recent_orders = await db.orders.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for o in recent_orders:
        customer = o.get("customer", {}) or {}
        events.append({
            "id": o.get("order_id") or o.get("id"),
            "type": "order",
            "event_type": "order_placed",
            "pillar": "shop",
            "title": f"Order #{o.get('order_id', 'N/A')} - ₹{o.get('total', 0)}",
            "description": f"{len(o.get('items', []))} items",
            "member": {"name": customer.get("name"), "email": customer.get("email")},
            "status": o.get("status", "pending"),
            "auto_created": False,
            "action_required": True,
            "timestamp": o.get("created_at"),
            "source": "checkout"
        })
    
    # Recent memberships
    recent_memberships = await db.memberships.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    for m in recent_memberships:
        events.append({
            "id": m.get("id") or m.get("membership_id"),
            "type": "membership",
            "event_type": "membership_" + m.get("status", "created"),
            "pillar": "club",
            "title": f"Membership: {m.get('plan', {}).get('name', 'Plan')}",
            "description": m.get("user_email", ""),
            "member": {"email": m.get("user_email")},
            "status": m.get("status"),
            "auto_created": False,
            "action_required": m.get("status") == "pending",
            "timestamp": m.get("created_at"),
            "source": "membership"
        })
    
    # Sort all events by timestamp
    events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "events": events[:limit],
        "total": len(events)
    }


# ============== COMPREHENSIVE MEMBER PROFILE ==============

@router.get("/member/{email}/full-profile")
async def get_member_full_profile(email: str):
    """Get comprehensive 360° member profile with all data."""
    db = get_db()
    
    # 1. Basic member info
    member = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # 2. All pets with full Pet Soul data
    pets = await db.pets.find({"owner_email": email}, {"_id": 0}).to_list(20)
    
    # Enrich each pet with health records and tickets
    for pet in pets:
        pet_id = pet.get("id")
        
        # Health records for this pet
        pet["health_records"] = await db.pet_health_records.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).sort("date", -1).to_list(50)
        
        # Vaccines
        pet["vaccines"] = await db.pet_vaccines.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(50)
        
        # Tickets specific to this pet
        pet["tickets"] = await db.service_desk_tickets.find(
            {"$or": [
                {"pet.id": pet_id},
                {"pet.name": pet.get("name")},
                {"pets": {"$elemMatch": {"id": pet_id}}}
            ]},
            {"_id": 0, "ticket_id": 1, "subject": 1, "status": 1, "pillar": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(50)
        
        # Pet Soul answers (all responses)
        pet["soul_answers"] = pet.get("doggy_soul_answers", {})
    
    # 3. Membership details
    membership = await db.memberships.find_one(
        {"user_email": email, "status": {"$in": ["active", "pending"]}},
        {"_id": 0}
    )
    
    # Membership history
    membership_history = await db.memberships.find(
        {"user_email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    # 4. Paw Rewards / Loyalty
    loyalty_balance = member.get("loyalty_points", 0)
    loyalty_transactions = await db.loyalty_transactions.find(
        {"user_email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    total_earned = sum([t.get("points", 0) for t in loyalty_transactions if t.get("type") == "earn"])
    total_redeemed = sum([t.get("points", 0) for t in loyalty_transactions if t.get("type") == "redeem"])
    
    # 5. All tickets (across all pets)
    all_tickets = await db.service_desk_tickets.find(
        {"$or": [
            {"member.email": email},
            {"member_email": email},
            {"customer.email": email}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Also get from regular tickets collection
    regular_tickets = await db.tickets.find(
        {"$or": [
            {"customer.email": email},
            {"member_email": email}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    all_tickets.extend(regular_tickets)
    
    # Group tickets by pillar
    tickets_by_pillar = {}
    for t in all_tickets:
        pillar = t.get("pillar", t.get("category", "general"))
        if pillar not in tickets_by_pillar:
            tickets_by_pillar[pillar] = []
        tickets_by_pillar[pillar].append(t)
    
    # Group tickets by pet
    tickets_by_pet = {"unassigned": []}
    for t in all_tickets:
        pet_info = t.get("pet", {})
        pet_name = pet_info.get("name") if pet_info else None
        if pet_name:
            if pet_name not in tickets_by_pet:
                tickets_by_pet[pet_name] = []
            tickets_by_pet[pet_name].append(t)
        else:
            tickets_by_pet["unassigned"].append(t)
    
    # 6. Orders
    orders = await db.orders.find(
        {"customer.email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    total_spent = sum([o.get("total", 0) for o in orders])
    
    # 7. Bookings (stay, dine, travel, care)
    bookings = {
        "stay": await db.stay_bookings.find({"customer_email": email}, {"_id": 0}).to_list(20),
        "dine": await db.dine_reservations.find({"customer_email": email}, {"_id": 0}).to_list(20),
        "travel": await db.travel_requests.find({"customer_email": email}, {"_id": 0}).to_list(20),
        "care": await db.care_appointments.find({"customer_email": email}, {"_id": 0}).to_list(20)
    }
    
    # 8. Mira memories
    memories = await db.mira_memories.find(
        {"member_id": email},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    # 9. Communications history
    communications = []
    for t in all_tickets:
        comms = t.get("communications", [])
        for c in comms:
            c["ticket_id"] = t.get("ticket_id")
            communications.append(c)
    communications.sort(key=lambda x: x.get("at", x.get("sent_at", "")), reverse=True)
    
    # 10. Activity timeline (recent actions)
    activity = []
    
    for t in all_tickets[:20]:
        activity.append({
            "type": "ticket",
            "action": "created",
            "title": t.get("subject", t.get("original_request", "")[:50]),
            "timestamp": t.get("created_at"),
            "pillar": t.get("pillar"),
            "id": t.get("ticket_id")
        })
    
    for o in orders[:10]:
        activity.append({
            "type": "order",
            "action": "placed",
            "title": f"Order #{o.get('order_id')} - ₹{o.get('total', 0)}",
            "timestamp": o.get("created_at"),
            "pillar": "shop",
            "id": o.get("order_id")
        })
    
    activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # 11. Notes (internal)
    notes = await db.member_notes.find(
        {"member_email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "member": member,
        "pets": pets,
        "membership": {
            "current": membership,
            "history": membership_history,
            "membership_number": membership.get("id") if membership else None,
            "plan_name": membership.get("plan", {}).get("name") if membership else "Free",
            "expires_at": membership.get("expires_at") if membership else None,
            "status": membership.get("status") if membership else "free"
        },
        "paw_rewards": {
            "balance": loyalty_balance,
            "total_earned": total_earned,
            "total_redeemed": total_redeemed,
            "transactions": loyalty_transactions[:20]
        },
        "tickets": {
            "all": all_tickets,
            "by_pillar": tickets_by_pillar,
            "by_pet": tickets_by_pet,
            "total": len(all_tickets),
            "open": len([t for t in all_tickets if t.get("status") not in ["resolved", "closed"]])
        },
        "orders": {
            "list": orders,
            "total_count": len(orders),
            "total_spent": total_spent
        },
        "bookings": bookings,
        "memories": memories,
        "communications": communications[:50],
        "activity": activity[:50],
        "notes": notes,
        "stats": {
            "total_pets": len(pets),
            "total_tickets": len(all_tickets),
            "total_orders": len(orders),
            "total_spent": total_spent,
            "member_since": member.get("created_at"),
            "last_activity": activity[0].get("timestamp") if activity else None
        }
    }


# ============== MEMBER NOTES CRUD ==============

class MemberNote(BaseModel):
    content: str
    note_type: str = "general"  # general, follow_up, important, misc


@router.post("/member/{email}/notes")
async def add_member_note(email: str, note: MemberNote, added_by: str = "concierge"):
    """Add a note to member profile."""
    db = get_db()
    
    import uuid
    note_doc = {
        "id": f"NOTE-{uuid.uuid4().hex[:8].upper()}",
        "member_email": email,
        "content": note.content,
        "note_type": note.note_type,
        "added_by": added_by,
        "created_at": get_utc_timestamp()
    }
    
    await db.member_notes.insert_one(note_doc)
    note_doc.pop("_id", None)
    
    return {"success": True, "note": note_doc}


@router.get("/member/{email}/notes")
async def get_member_notes(email: str):
    """Get all notes for a member."""
    db = get_db()
    
    notes = await db.member_notes.find(
        {"member_email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"notes": notes}


@router.delete("/member/{email}/notes/{note_id}")
async def delete_member_note(email: str, note_id: str):
    """Delete a member note."""
    db = get_db()
    
    result = await db.member_notes.delete_one({"id": note_id, "member_email": email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"success": True}


# ============== HEALTH VAULT INTEGRATION ==============

@router.get("/member/{email}/health-vault")
async def get_member_health_vault(email: str):
    """Get complete health vault for all pets of a member."""
    db = get_db()
    
    # Get all pets
    pets = await db.pets.find({"owner_email": email}, {"_id": 0}).to_list(20)
    
    health_data = []
    
    for pet in pets:
        pet_id = pet.get("id")
        pet_name = pet.get("name")
        
        # Health records
        records = await db.pet_health_records.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).sort("date", -1).to_list(100)
        
        # Vaccines
        vaccines = await db.pet_vaccines.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(50)
        
        # Weight history
        weights = await db.pet_weights.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).sort("date", -1).to_list(100)
        
        # Medications
        medications = await db.pet_medications.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).to_list(50)
        
        # Vet visits
        vet_visits = await db.pet_vet_visits.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).sort("date", -1).to_list(50)
        
        health_data.append({
            "pet_id": pet_id,
            "pet_name": pet_name,
            "pet_breed": pet.get("breed"),
            "pet_birthday": pet.get("birthday"),
            "records": records,
            "vaccines": vaccines,
            "weights": weights,
            "medications": medications,
            "vet_visits": vet_visits,
            "current_weight": weights[0].get("weight") if weights else None,
            "next_vaccine_due": None  # Calculate from vaccines
        })
    
    return {"health_vault": health_data}



# ═══════════════════════════════════════════════════════════════════════════════════
# OS CONCIERGE HOME ENDPOINT
# This powers the CONCIERGE tab in the MiraDemoPage OS UI
# Returns status, active requests, and recent threads for the user
# ═══════════════════════════════════════════════════════════════════════════════════

os_router = APIRouter(prefix="/api/os/concierge", tags=["OS Concierge"])

def set_os_concierge_db(db):
    """Set the database reference for OS Concierge endpoints"""
    global _db
    _db = db

@os_router.get("/home")
async def get_concierge_home(
    user_id: str = Query(..., description="User ID or email"),
    pet_id: str = Query("all", description="Pet ID or 'all' for all pets")
):
    """
    Get Concierge home screen data for the OS tab.
    Returns:
    - status: Live/offline status of concierge
    - active_requests: User's active service requests
    - recent_threads: Recent conversation threads
    """
    db = _db
    if db is None:
        return {
            "status": {"is_live": False, "status_text": "Connecting...", "message": "Database not connected"},
            "active_requests": [],
            "recent_threads": []
        }
    
    try:
        # Concierge® is 24/7 - always available for members
        status = {
            "is_live": True,
            "status_text": "Live Now",
            "message": "Your Concierge is ready to help 24/7"
        }
        
        # Build query for user's requests
        user_query = {"$or": [
            {"user_id": user_id},
            {"customer_email": user_id},
            {"created_by": user_id}
        ]}
        
        # Add pet filter if specific pet
        if pet_id and pet_id != "all":
            user_query["pet_id"] = pet_id
        
        # Fetch active requests from service_desk_tickets
        active_requests_cursor = db.service_desk_tickets.find(
            {**user_query, "status": {"$in": ["pending", "open", "in_progress", "awaiting_response"]}},
            {"_id": 0}
        ).sort("created_at", -1).limit(10)
        active_tickets = await active_requests_cursor.to_list(10)
        
        # ALSO fetch from mira_tickets (for Mira-created tickets - Unified Service Flow)
        # Support both user_id formats: email and UUID
        mira_user_query = {"$or": [
            {"user_id": user_id},
            {"user_email": user_id}
        ]}
        
        # If user_id looks like a UUID, also try to find by email from users collection
        if '-' in user_id and len(user_id) > 30:  # Likely a UUID
            user_doc = await db.users.find_one({"id": user_id})
            if user_doc and user_doc.get("email"):
                mira_user_query["$or"].extend([
                    {"user_id": user_doc["email"]},
                    {"user_email": user_doc["email"]}
                ])
        
        if pet_id and pet_id != "all":
            mira_user_query["pet_id"] = pet_id
        
        mira_tickets_cursor = db.mira_tickets.find(
            {**mira_user_query, "status": {"$in": ["placed", "pending", "in_progress", "scheduled", "working"]}},
            {"_id": 0}
        ).sort("created_at", -1).limit(10)
        mira_tickets = await mira_tickets_cursor.to_list(10)
        
        # ALSO fetch from tickets collection (main ticket store)
        main_tickets_query = {"$or": [
            {"member.id": user_id},
            {"member.email": user_id}
        ]}
        if pet_id and pet_id != "all":
            main_tickets_query["pet.id"] = pet_id
        
        main_tickets_cursor = db.tickets.find(
            {**main_tickets_query, "status": {"$in": ["placed", "pending", "in_progress", "scheduled", "working", "acknowledged", "exploring"]}},
            {"_id": 0}
        ).sort("updated_at", -1).limit(10)
        main_tickets = await main_tickets_cursor.to_list(10)
        
        # Combine and dedupe by ticket_id
        all_tickets = active_tickets + mira_tickets + main_tickets
        seen_ids = set()
        unique_tickets = []
        for t in all_tickets:
            tid = t.get("ticket_id") or t.get("id")
            if tid and tid not in seen_ids:
                seen_ids.add(tid)
                unique_tickets.append(t)
        
        # Format active requests for UI
        active_requests = []
        for ticket in unique_tickets[:10]:  # Limit to 10 total
            # Map status to display colors
            status_map = {
                "pending": {"text": "Awaiting Review", "color": "amber"},
                "open": {"text": "In Queue", "color": "blue"},
                "in_progress": {"text": "Working on it", "color": "purple"},
                "awaiting_response": {"text": "Options Ready!", "color": "green"}
            }
            status_info = status_map.get(ticket.get("status", "pending"), {"text": "Pending", "color": "gray"})
            
            active_requests.append({
                "id": ticket.get("ticket_id") or ticket.get("id"),
                "ticket_id": ticket.get("ticket_id") or ticket.get("id"),
                "title": ticket.get("subject") or ticket.get("service_type", "Request").replace("_", " ").title(),
                "pet_name": ticket.get("pet_name") or "your furry friend",
                "pet_id": ticket.get("pet_id"),
                "timestamp": ticket.get("created_at"),
                "status_display": status_info,
                "pillar": ticket.get("pillar") or ticket.get("category"),
                "icon": ticket.get("icon") or "message-circle",
                "has_unread_reply": ticket.get("has_unread_concierge_reply", False)
            })
        
        # Fetch recent threads from unified_inbox
        recent_threads_cursor = db.unified_inbox.find(
            user_query,
            {"_id": 0}
        ).sort("updated_at", -1).limit(5)
        recent_inbox = await recent_threads_cursor.to_list(5)
        
        # Format threads for UI
        recent_threads = []
        for thread in recent_inbox:
            recent_threads.append({
                "id": thread.get("thread_id") or thread.get("id"),
                "title": thread.get("subject") or thread.get("preview", "Conversation")[:50],
                "preview": thread.get("preview") or thread.get("messages", [{}])[-1].get("content", "")[:100] if thread.get("messages") else "",
                "timestamp": thread.get("updated_at") or thread.get("created_at"),
                "unread": thread.get("unread", False),
                "pet_name": thread.get("pet_name"),
                "pet_id": thread.get("pet_id")
            })
        
        logger.info(f"[OS CONCIERGE HOME] user_id={user_id}, pet_id={pet_id}, active={len(active_requests)}, threads={len(recent_threads)}")
        
        return {
            "status": status,
            "active_requests": active_requests,
            "recent_threads": recent_threads
        }
        
    except Exception as e:
        logger.error(f"[OS CONCIERGE HOME] Error: {e}")
        return {
            "status": {"is_live": False, "status_text": "Error", "message": str(e)},
            "active_requests": [],
            "recent_threads": []
        }

