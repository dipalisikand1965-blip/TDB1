"""
Icon State API - Unified counts for navigation icons
=====================================================
Single endpoint that powers the icon state system.
Enforces the uniform service flow by querying the canonical Service Desk ticket spine.

CANONICAL SOURCES:
- Service Desk Tickets: db.tickets (primary) + db.mira_tickets (services tab)
- Concierge Threads: db.mira_conversations (linked to tickets via ticket_id)
- Picks: db.picks_catalogue (recommendations freshness)
- Pet Profile: db.pets (insights + learned facts)

UNIFIED VIEW:
Since tickets can exist in both db.tickets and db.mira_tickets, we query both
and dedupe by ticket_id to prevent double counting.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
import logging
import os
import jwt
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/os/icon-state", tags=["icon-state"])

# ============================================
# CANONICAL TICKET_ID VALIDATION
# ============================================
# Strict format: TCK-YYYY-NNNNNN (e.g., TCK-2026-000001)
# This prevents badge inflation from duplicate/invalid tickets
CANONICAL_TICKET_ID_PATTERN = re.compile(r'^TCK-\d{4}-\d{6}$')

def is_valid_ticket_id(ticket_id: str) -> bool:
    """
    Validate ticket_id matches canonical format.
    Only tickets with valid IDs are counted for icon states.
    """
    if not ticket_id:
        return False
    return bool(CANONICAL_TICKET_ID_PATTERN.match(ticket_id))

# Database connection (will be set from server.py)
_db = None

def set_database(database):
    """Set the database instance from server.py"""
    global _db
    _db = database
    logger.info("[ICON-STATE] Database connection set")

def get_db():
    """Get the database instance"""
    return _db

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"

# ============================================
# STATUS DEFINITIONS (Canonical)
# ============================================

# Terminal statuses - ticket is done
TERMINAL_STATUSES = ["resolved", "closed", "completed", "cancelled", "archived"]

# Statuses that require user action
AWAITING_USER_STATUSES = [
    "awaiting_approval",
    "awaiting_confirmation", 
    "awaiting_user_action",
    "pending_approval",
    "quote_ready",
    "options_ready"
]

# High urgency levels
HIGH_URGENCY = ["critical", "high", "urgent"]


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_user_from_token(authorization: Optional[str] = None) -> Optional[Dict]:
    """Extract user info from JWT token."""
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub") or payload.get("email")
        user_id = payload.get("user_id")
        
        if not user_email:
            return None
        
        db = get_db()
        if db is None:
            return None
            
        user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
        if user:
            user["user_id"] = user_id or user.get("id")
            user["email"] = user_email
        return user
    except Exception as e:
        logger.warning(f"[ICON-STATE] Token decode error: {e}")
        return None


async def get_unified_tickets(db, user_email: str, pet_ids: List[str] = None) -> tuple[List[Dict], Dict]:
    """
    Query both ticket collections and return unified, deduplicated list.
    This is the SINGLE SOURCE OF TRUTH for Service Desk state.
    
    STRICT RULES (Uniform Service Flow):
    1. Only tickets with canonical ticket_id (TCK-YYYY-NNNNNN) are counted
    2. db.tickets is PRIMARY, db.mira_tickets is SECONDARY
    3. Deduplication by ticket_id - first occurrence wins
    4. Invalid tickets are logged for upstream fix
    
    Returns:
        (valid_tickets, stats) where stats contains counts of valid/invalid/duplicate
    """
    all_tickets = []
    seen_ticket_ids = set()
    
    # Stats for debugging and validation
    stats = {
        "valid_from_tickets": 0,
        "valid_from_mira_tickets": 0,
        "invalid_ticket_id": [],  # Tickets without valid canonical ID
        "duplicates_skipped": 0,
    }
    
    # Build query filter for user's tickets
    base_query = {
        "$or": [
            {"member.email": user_email},
            {"user_email": user_email},
            {"customer_email": user_email}
        ]
    }
    
    # Add pet filter if provided
    # IMPORTANT: Also include tickets with NO pet_id (legacy or missing data)
    # These should still be counted for the user
    if pet_ids:
        base_query["$and"] = [
            {"$or": [
                {"pet_ids": {"$in": pet_ids}},
                {"pet.id": {"$in": pet_ids}},
                {"pet_id": {"$in": pet_ids}},
                # Include tickets with no pet association (legacy)
                {"pet_id": {"$exists": False}},
                {"pet_id": None},
                {"pet_id": ""},
                {"pet_ids": {"$size": 0}}
            ]}
        ]
    
    # Query 1: db.tickets (PRIMARY collection - concierge requests, admin-created)
    try:
        tickets_cursor = db.tickets.find(base_query, {"_id": 0}).sort("updated_at", -1).limit(200)
        async for ticket in tickets_cursor:
            ticket_id = ticket.get("ticket_id")  # STRICT: Only ticket_id, no fallback to "id"
            
            # Validate canonical format
            if not is_valid_ticket_id(ticket_id):
                # Log invalid for upstream fix
                stats["invalid_ticket_id"].append({
                    "source": "tickets",
                    "raw_id": ticket_id or ticket.get("id"),
                    "status": ticket.get("status"),
                    "created_at": ticket.get("created_at")
                })
                logger.warning(f"[ICON-STATE] Invalid ticket_id in db.tickets: {ticket_id or ticket.get('id')}")
                continue
            
            # Dedupe check
            if ticket_id in seen_ticket_ids:
                stats["duplicates_skipped"] += 1
                continue
            
            seen_ticket_ids.add(ticket_id)
            ticket["_source"] = "tickets"
            all_tickets.append(ticket)
            stats["valid_from_tickets"] += 1
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying db.tickets: {e}")
    
    # Query 2: db.mira_tickets (SECONDARY - services tab requests)
    try:
        mira_cursor = db.mira_tickets.find(base_query, {"_id": 0}).sort("updated_at", -1).limit(200)
        async for ticket in mira_cursor:
            ticket_id = ticket.get("ticket_id")  # STRICT: Only ticket_id, no fallback
            
            # Validate canonical format
            if not is_valid_ticket_id(ticket_id):
                stats["invalid_ticket_id"].append({
                    "source": "mira_tickets",
                    "raw_id": ticket_id or ticket.get("id"),
                    "status": ticket.get("status"),
                    "created_at": ticket.get("created_at")
                })
                logger.warning(f"[ICON-STATE] Invalid ticket_id in db.mira_tickets: {ticket_id or ticket.get('id')}")
                continue
            
            # Dedupe check - but MERGE key fields if duplicate
            if ticket_id in seen_ticket_ids:
                stats["duplicates_skipped"] += 1
                logger.info(f"[SPINE-DEBUG] Duplicate found: {ticket_id}, checking for merge")
                # ═══════════════════════════════════════════════════════════════════════
                # SPINE-SYNC: Merge important flags from mira_tickets into existing ticket
                # This handles the case where concierge replies update mira_tickets
                # but the ticket was first found in db.tickets
                # ═══════════════════════════════════════════════════════════════════════
                mira_has_unread = ticket.get("has_unread_concierge_reply")
                mira_awaiting = ticket.get("awaiting_user")
                
                if mira_has_unread or mira_awaiting:
                    logger.info(f"[SPINE-SYNC] Merging flags for {ticket_id}: has_unread={mira_has_unread}, awaiting={mira_awaiting}")
                
                for existing_ticket in all_tickets:
                    if existing_ticket.get("ticket_id") == ticket_id:
                        # Merge unread/awaiting flags (prefer True over False/None)
                        if mira_has_unread:
                            existing_ticket["has_unread_concierge_reply"] = True
                            logger.info(f"[SPINE-SYNC] Set has_unread_concierge_reply=True for {ticket_id}")
                        if mira_awaiting:
                            existing_ticket["awaiting_user"] = True
                        # Merge messages if mira_tickets has more
                        mira_msgs = ticket.get("messages") or []
                        existing_msgs = existing_ticket.get("messages") or []
                        if len(mira_msgs) > len(existing_msgs):
                            existing_ticket["messages"] = mira_msgs
                        # Prefer more recent status
                        if ticket.get("status") == "waiting_on_member":
                            existing_ticket["status"] = "waiting_on_member"
                        break
                continue
            
            seen_ticket_ids.add(ticket_id)
            ticket["_source"] = "mira_tickets"
            all_tickets.append(ticket)
            stats["valid_from_mira_tickets"] += 1
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying db.mira_tickets: {e}")
    
    return all_tickets, stats


# ============================================
# COUNT FUNCTIONS
# ============================================

# Store ticket stats for debug info (set during main endpoint call)
_ticket_stats = {}

async def get_services_counts(db, user_email: str, pet_ids: List[str] = None) -> Dict:
    """
    SERVICES tab counts from unified Service Desk tickets.
    
    Returns:
    - active_tickets: All non-terminal tickets (with valid canonical ticket_id)
    - awaiting_you: Tickets requiring user action
    """
    global _ticket_stats
    tickets, stats = await get_unified_tickets(db, user_email, pet_ids)
    _ticket_stats = stats  # Store for debug endpoint
    
    active_tickets = 0
    awaiting_you = 0
    
    for ticket in tickets:
        status = (ticket.get("status") or "").lower()
        
        # Skip terminal statuses
        if status in TERMINAL_STATUSES:
            continue
        
        active_tickets += 1
        
        # Check if awaiting user action - either by status OR by explicit flag
        if status in AWAITING_USER_STATUSES:
            awaiting_you += 1
        elif ticket.get("has_unread_concierge_reply") or ticket.get("awaiting_user"):
            # Explicit flag set by concierge reply
            awaiting_you += 1
    
    return {
        "active_tickets": active_tickets,
        "awaiting_you": awaiting_you,
        "_query": {
            "terminal_statuses": TERMINAL_STATUSES,
            "awaiting_statuses": AWAITING_USER_STATUSES
        },
        "_validation": {
            "valid_from_tickets": stats["valid_from_tickets"],
            "valid_from_mira_tickets": stats["valid_from_mira_tickets"],
            "invalid_count": len(stats["invalid_ticket_id"]),
            "duplicates_skipped": stats["duplicates_skipped"]
        }
    }


async def get_today_counts(db, user_email: str, pet_ids: List[str] = None) -> Dict:
    """
    TODAY tab counts - urgency and SLA from unified Service Desk tickets.
    
    Returns:
    - urgent: High urgency tickets not closed
    - due_today: SLA due today
    - upcoming: SLA due within 7 days
    """
    tickets, stats = await get_unified_tickets(db, user_email, pet_ids)
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)
    
    urgent = 0
    due_today = 0
    upcoming = 0
    
    for ticket in tickets:
        status = (ticket.get("status") or "").lower()
        
        # Skip terminal statuses
        if status in TERMINAL_STATUSES:
            continue
        
        # Check urgency
        urgency = (ticket.get("urgency") or ticket.get("priority") or "").lower()
        if urgency in HIGH_URGENCY:
            urgent += 1
        
        # Check SLA due date
        sla_due = ticket.get("sla_due_at") or ticket.get("due_date")
        if sla_due:
            try:
                if isinstance(sla_due, str):
                    due_dt = datetime.fromisoformat(sla_due.replace('Z', '+00:00'))
                else:
                    due_dt = sla_due
                
                if today_start <= due_dt < today_end:
                    due_today += 1
                elif today_end <= due_dt < week_end:
                    upcoming += 1
            except (ValueError, TypeError):
                pass
    
    return {
        "urgent": urgent,
        "due_today": due_today,
        "upcoming": upcoming,
        "_query": {
            "high_urgency": HIGH_URGENCY,
            "today_range": [today_start.isoformat(), today_end.isoformat()],
            "week_range": [today_end.isoformat(), week_end.isoformat()]
        }
    }


async def get_concierge_counts(db, user_email: str, pet_ids: List[str] = None) -> Dict:
    """
    CONCIERGE tab counts - thread state linked to tickets.
    
    Concierge is a CHANNEL attached to tickets, not a separate workflow.
    We count:
    - unread_replies: Concierge messages user hasn't seen (from ticket-linked threads OR ticket flags)
    - open_threads: Active conversation threads
    """
    unread_replies = 0
    open_threads = 0
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SOURCE 1: Check ticket flags directly (has_unread_concierge_reply)
    # This is the primary source set by concierge_reply_to_ticket endpoint
    # ═══════════════════════════════════════════════════════════════════════════
    try:
        tickets, _ = await get_unified_tickets(db, user_email, pet_ids)
        for ticket in tickets:
            status = (ticket.get("status") or "").lower()
            if status in TERMINAL_STATUSES:
                continue
            
            # Check for unread concierge reply flag
            if ticket.get("has_unread_concierge_reply"):
                unread_replies += 1
            
            # Count as open thread if has messages
            if ticket.get("messages") and len(ticket.get("messages", [])) > 0:
                open_threads += 1
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error checking ticket flags: {e}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SOURCE 2: Query mira_conversations (threads linked to tickets)
    # Legacy/supplementary source
    # ═══════════════════════════════════════════════════════════════════════════
    try:
        query = {
            "$or": [
                {"parent_id": user_email},
                {"user_email": user_email},
                {"member.email": user_email}
            ]
        }
        
        if pet_ids:
            query["pet_id"] = {"$in": pet_ids}
        
        cursor = db.mira_conversations.find(query, {"_id": 0}).sort("updated_at", -1).limit(100)
        
        async for thread in cursor:
            status = (thread.get("status") or "").lower()
            
            # Count open threads (not resolved/closed) - add to existing count
            if status not in ["resolved", "closed"]:
                # Only count if not already counted from tickets
                thread_ticket_id = thread.get("ticket_id")
                if not thread_ticket_id:
                    open_threads += 1
            
            # Count unread concierge replies from conversation array
            conversation = thread.get("conversation") or []
            last_user_view = thread.get("last_user_view_at")
            
            for msg in conversation:
                sender = (msg.get("sender") or "").lower()
                if sender in ["concierge", "admin"]:
                    msg_time = msg.get("timestamp")
                    if msg_time and last_user_view:
                        try:
                            msg_dt = datetime.fromisoformat(msg_time.replace('Z', '+00:00'))
                            view_dt = datetime.fromisoformat(last_user_view.replace('Z', '+00:00'))
                            if msg_dt > view_dt:
                                unread_replies += 1
                        except (ValueError, TypeError):
                            pass
                    elif msg_time and not last_user_view:
                        # Never viewed = all concierge messages are unread
                        unread_replies += 1
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying mira_conversations: {e}")
    
    return {
        "unread_replies": unread_replies,
        "open_threads": open_threads,
        "_query": {
            "thread_collection": "mira_conversations + ticket flags",
            "note": "Threads linked to Service Desk tickets"
        }
    }


async def get_picks_counts(db, user_email: str, pet_ids: List[str] = None) -> Dict:
    """
    PICKS tab counts - recommendation freshness.
    
    Picks is a SUGGESTION LAYER. When user acts on a pick, it routes to Service Desk.
    We only count freshness here, not a separate workflow.
    
    Returns:
    - new_picks_since_last_view: New picks user hasn't seen
    - material_change: (Phase 5) Significant updates to picks
    """
    new_picks = 0
    material_change = 0
    
    # Get user's last picks view timestamp
    try:
        user = await db.users.find_one({"email": user_email}, {"last_picks_view_at": 1})
        last_view = user.get("last_picks_view_at") if user else None
        
        # Count new picks since last view
        if last_view:
            query = {
                "active": {"$ne": False},
                "created_at": {"$gt": last_view}
            }
            new_picks = await db.picks_catalogue.count_documents(query)
        else:
            # Never viewed - count recent picks (last 7 days)
            week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            query = {
                "active": {"$ne": False},
                "created_at": {"$gt": week_ago}
            }
            new_picks = await db.picks_catalogue.count_documents(query)
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying picks: {e}")
    
    # TODO Phase 5: material_change logic
    # material_change counts picks where price/availability changed significantly
    
    return {
        "new_picks_since_last_view": new_picks,
        "material_change": material_change,
        "_query": {
            "picks_collection": "picks_catalogue",
            "note": "Suggestion layer - actions route to Service Desk"
        }
    }


async def get_learn_counts(db, pet_ids: List[str] = None) -> Dict:
    """
    LEARN tab counts - insights from pet profile + available content.
    
    Returns:
    - pending_insights: AI-extracted facts pending review
    - learned_facts: Confirmed facts count
    - has_content: Whether personalized content exists for this pet
    - timely_content: Content matching recent chat intents
    """
    pending_insights = 0
    learned_facts = 0
    has_content = 0
    timely_content = 0
    
    if not pet_ids:
        return {
            "pending_insights": 0,
            "learned_facts": 0,
            "has_content": 0,
            "timely_content": 0,
            "_query": {"note": "No pet_ids provided"}
        }
    
    try:
        for pet_id in pet_ids:
            pet = await db.pets.find_one(
                {"id": pet_id},
                {"conversation_insights": 1, "learned_facts": 1, "breed": 1, "age": 1}
            )
            
            if pet:
                # Count pending insights
                insights = pet.get("conversation_insights") or []
                for insight in insights:
                    if insight.get("status") == "pending_review":
                        pending_insights += 1
                
                # Count learned facts
                facts = pet.get("learned_facts") or []
                learned_facts += len(facts)
                
                # Check for breed-specific content
                breed = pet.get("breed", "").lower()
                if breed:
                    content_count = await db.learn_content.count_documents({
                        "$or": [
                            {"tags": {"$regex": breed, "$options": "i"}},
                            {"title": {"$regex": breed, "$options": "i"}}
                        ]
                    })
                    if content_count > 0:
                        has_content = 1
        
        # Check for timely content (from recent chat intents)
        if pet_ids:
            # Get user's recent intents (48hr window)
            from datetime import datetime, timezone, timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
            
            intent_docs = await db.user_learn_intents.find({
                "pet_id": {"$in": pet_ids},
                "createdAt": {"$gte": cutoff}
            }).to_list(length=10)
            
            if intent_docs:
                timely_content = sum(len(doc.get("intents", [])) for doc in intent_docs)
                if timely_content > 0:
                    has_content = 1  # Ensure LEARN shows ON when there's timely content
                    
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying pet insights: {e}")
    
    return {
        "pending_insights": pending_insights,
        "learned_facts": learned_facts,
        "has_content": has_content,
        "timely_content": timely_content,
        "_query": {
            "source": "pets.conversation_insights + pets.learned_facts + learn_content + user_learn_intents"
        }
    }


async def get_mojo_counts(db, pet_ids: List[str] = None) -> Dict:
    """
    MOJO (pet profile) counts.
    
    Returns:
    - critical_fields_missing: Count of critical profile fields not filled
    - soul_score: Pet's overall completeness score
    """
    critical_missing = 0
    soul_score = 0
    critical_fields_list = []
    
    # Define critical fields for a complete pet profile
    CRITICAL_FIELDS = [
        "name", "breed", "date_of_birth", "weight_kg", "gender",
        "vaccination_status", "photo_url"
    ]
    
    if not pet_ids:
        return {
            "critical_fields_missing": 0,
            "soul_score": 0,
            "missing_fields": [],
            "_query": {"note": "No pet_ids provided"}
        }
    
    try:
        for pet_id in pet_ids:
            pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
            
            if pet:
                # Check critical fields
                for field in CRITICAL_FIELDS:
                    value = pet.get(field)
                    if not value or value == "" or value == []:
                        critical_missing += 1
                        critical_fields_list.append(field)
                
                # Get soul score
                soul_score = pet.get("overall_score") or pet.get("doggy_soul_score") or 0
    except Exception as e:
        logger.warning(f"[ICON-STATE] Error querying pet profile: {e}")
    
    return {
        "critical_fields_missing": critical_missing,
        "soul_score": soul_score,
        "missing_fields": list(set(critical_fields_list)),
        "_query": {
            "critical_fields": CRITICAL_FIELDS
        }
    }


# ============================================
# ICON STATE COMPUTATION
# ============================================

def compute_icon_state(tab: str, counts: Dict, is_active: bool = False) -> str:
    """
    Compute icon state (OFF/ON/PULSE) based on counts.
    
    Rules:
    - OFF: No activity (all counts are 0)
    - ON: Has activity but nothing urgent
    - PULSE: Needs immediate attention (override prevents pulse if tab is active)
    
    Active tab override: If tab is currently active, never PULSE (user is already there)
    """
    # Active tab override
    if is_active:
        # Still show ON if there's activity, but never PULSE
        total = sum(v for k, v in counts.items() if isinstance(v, int) and not k.startswith("_"))
        return "ON" if total > 0 else "OFF"
    
    # Tab-specific PULSE rules
    if tab == "services":
        if counts.get("awaiting_you", 0) > 0:
            return "PULSE"
        elif counts.get("active_tickets", 0) > 0:
            return "ON"
        return "OFF"
    
    elif tab == "today":
        if counts.get("urgent", 0) > 0 or counts.get("due_today", 0) > 0:
            return "PULSE"
        elif counts.get("upcoming", 0) > 0:
            return "ON"
        return "OFF"
    
    elif tab == "concierge":
        if counts.get("unread_replies", 0) > 0:
            return "PULSE"
        elif counts.get("open_threads", 0) > 0:
            return "ON"
        return "OFF"
    
    elif tab == "picks":
        if counts.get("new_picks_since_last_view", 0) > 0:
            return "PULSE"
        elif counts.get("material_change", 0) > 0:
            return "ON"
        return "OFF"
    
    elif tab == "learn":
        if counts.get("pending_insights", 0) > 0:
            return "PULSE"
        elif counts.get("learned_facts", 0) > 0:
            return "ON"
        return "OFF"
    
    elif tab == "mojo":
        if counts.get("critical_fields_missing", 0) > 0:
            return "PULSE"
        elif counts.get("soul_score", 0) > 50:
            return "ON"
        return "OFF"
    
    return "OFF"


def get_badge_value(tab: str, counts: Dict) -> Optional[int]:
    """
    Get badge value for each tab.
    Badge shows the most important count that needs attention.
    """
    if tab == "services":
        return counts.get("awaiting_you", 0) or None
    elif tab == "today":
        return (counts.get("urgent", 0) + counts.get("due_today", 0)) or None
    elif tab == "concierge":
        return counts.get("unread_replies", 0) or None
    elif tab == "picks":
        return counts.get("new_picks_since_last_view", 0) or None
    elif tab == "learn":
        return counts.get("pending_insights", 0) or None
    elif tab == "mojo":
        return counts.get("critical_fields_missing", 0) or None
    return None


# ============================================
# MAIN ENDPOINT
# ============================================

@router.get("")
async def get_icon_state(
    pet_id: Optional[str] = Query(None, description="Filter by pet ID"),
    active_tab: Optional[str] = Query(None, description="Currently active tab (prevents PULSE)"),
    authorization: Optional[str] = Header(None)
):
    """
    Get icon state for all navigation tabs.
    
    Single endpoint that returns:
    - counts: Raw counts for each tab
    - states: Computed states (OFF/ON/PULSE)
    - badges: Badge values for each tab
    - debug: Query filters used (for Debug Drawer)
    
    Query params:
    - pet_id: Optional pet filter
    - active_tab: Currently active tab (overrides PULSE to prevent pulsing on active tab)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_email = user.get("email")
    pet_ids = [pet_id] if pet_id else None
    
    # If no specific pet, get all user's pets
    if not pet_ids:
        try:
            pets_cursor = db.pets.find(
                {"owner_email": user_email},
                {"id": 1}
            )
            user_pets = await pets_cursor.to_list(20)
            pet_ids = [p.get("id") for p in user_pets if p.get("id")]
        except Exception as e:
            logger.warning(f"[ICON-STATE] Error fetching user pets: {e}")
            pet_ids = []
    
    # Gather all counts
    services_counts = await get_services_counts(db, user_email, pet_ids)
    today_counts = await get_today_counts(db, user_email, pet_ids)
    concierge_counts = await get_concierge_counts(db, user_email, pet_ids)
    picks_counts = await get_picks_counts(db, user_email, pet_ids)
    learn_counts = await get_learn_counts(db, pet_ids)
    mojo_counts = await get_mojo_counts(db, pet_ids)
    
    # Compute states (with active tab override)
    states = {
        "services": compute_icon_state("services", services_counts, active_tab == "services"),
        "today": compute_icon_state("today", today_counts, active_tab == "today"),
        "concierge": compute_icon_state("concierge", concierge_counts, active_tab == "concierge"),
        "picks": compute_icon_state("picks", picks_counts, active_tab == "picks"),
        "learn": compute_icon_state("learn", learn_counts, active_tab == "learn"),
        "mojo": compute_icon_state("mojo", mojo_counts, active_tab == "mojo"),
    }
    
    # Get badge values
    badges = {
        "services": get_badge_value("services", services_counts),
        "today": get_badge_value("today", today_counts),
        "concierge": get_badge_value("concierge", concierge_counts),
        "picks": get_badge_value("picks", picks_counts),
        "learn": get_badge_value("learn", learn_counts),
        "mojo": get_badge_value("mojo", mojo_counts),
    }
    
    return {
        "success": True,
        "user_email": user_email,
        "pet_ids": pet_ids,
        "active_tab": active_tab,
        
        # Raw counts for each tab
        "counts": {
            "services": services_counts,
            "today": today_counts,
            "concierge": concierge_counts,
            "picks": picks_counts,
            "learn": learn_counts,
            "mojo": mojo_counts,
        },
        
        # Computed states
        "states": states,
        
        # Badge values (null if 0)
        "badges": badges,
        
        # Debug info
        "debug": {
            "unified_ticket_sources": ["db.tickets", "db.mira_tickets"],
            "deduplication": "by canonical ticket_id (TCK-YYYY-NNNNNN), first occurrence wins",
            "canonical_ticket_id_format": "^TCK-\\d{4}-\\d{6}$",
            "terminal_statuses": TERMINAL_STATUSES,
            "awaiting_user_statuses": AWAITING_USER_STATUSES,
            "high_urgency": HIGH_URGENCY,
            "validation": services_counts.get("_validation", {}),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


@router.post("/mark-viewed/{tab}")
async def mark_tab_viewed(
    tab: str,
    authorization: Optional[str] = Header(None)
):
    """
    Mark a tab as viewed (clears 'new' badges).
    Used when user opens PICKS tab to clear new_picks_since_last_view.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_email = user.get("email")
    now = datetime.now(timezone.utc).isoformat()
    
    if tab == "picks":
        await db.users.update_one(
            {"email": user_email},
            {"$set": {"last_picks_view_at": now}}
        )
        return {"success": True, "tab": tab, "marked_at": now}
    
    elif tab == "concierge":
        # Mark all threads as viewed
        await db.mira_conversations.update_many(
            {"$or": [{"parent_id": user_email}, {"user_email": user_email}]},
            {"$set": {"last_user_view_at": now}}
        )
        return {"success": True, "tab": tab, "marked_at": now}
    
    return {"success": True, "tab": tab, "note": "No action needed for this tab"}
