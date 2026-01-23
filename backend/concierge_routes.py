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
from bson import ObjectId
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/concierge", tags=["concierge"])

# Database reference
_db = None

def set_concierge_db(db):
    global _db
    _db = db

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

class ResolveRequest(BaseModel):
    resolution_notes: str  # Member-facing
    internal_notes: Optional[str] = None
    send_via: str = "mira"  # mira, email, whatsapp
    agent_id: str
    agent_name: str

class AddNoteRequest(BaseModel):
    note: str
    is_internal: bool = True
    agent_id: str
    agent_name: str


# ============== QUEUE ENDPOINT ==============

@router.get("/queue")
async def get_command_center_queue(
    source: Optional[str] = None,  # mira, order, inbox, health, all
    priority: Optional[str] = None,  # urgent, high, medium, low
    status: Optional[str] = None,  # pending, claimed, in_progress
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0
):
    """
    Get unified command center queue from all sources.
    Merges: service_desk_tickets, tickets, orders, unified_inbox, health alerts
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
            item["ticket_id"] = f"ORD-{item.get('order_id', item.get('id', 'N/A'))}"
            item["source_type"] = "order"
            item["source_label"] = "Order"
            item["source_icon"] = "📦"
            item["original_request"] = f"Order #{item.get('order_id', 'N/A')} - ₹{item.get('total', 0)}"
            item["action_type"] = "order_fulfillment"
            
            # Map order customer to member format
            if item.get("customer"):
                item["member"] = {
                    "name": item["customer"].get("name"),
                    "email": item["customer"].get("email"),
                    "phone": item["customer"].get("phone")
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
        now = datetime.now(timezone.utc).isoformat()
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
                            "created_at": datetime.now(timezone.utc).isoformat(),
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
    pillar = None  # TODO: Add pillar parameter to function signature
    if pillar:
        all_items = [item for item in all_items if item.get("pillar") == pillar]
    
    # Apply priority filter
    if priority:
        all_items = [item for item in all_items if item.get("priority_bucket") == priority]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        filtered_items = []
        for item in all_items:
            member = item.get("member") or {}
            member_name = member.get("name", "") if member else ""
            member_email = member.get("email", "") if member else ""
            
            if (search_lower in str(item.get("original_request", "")).lower()
                or search_lower in str(member_name).lower()
                or search_lower in str(member_email).lower()
                or search_lower in str(item.get("ticket_id", "")).lower()):
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
    
    # Get member email - handle None values safely
    member_data = item.get("member") or {}
    member_email = member_data.get("email") if member_data else None
    if not member_email and item.get("customer"):
        member_email = item["customer"].get("email")
    
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
    now = datetime.now(timezone.utc).isoformat()
    
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
    
    return {"success": True, "message": f"Claimed by {request.agent_name}"}


@router.post("/item/{ticket_id}/unclaim")
async def unclaim_item(ticket_id: str, request: ClaimRequest):
    """Release a claimed item back to the queue."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
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
    now = datetime.now(timezone.utc).isoformat()
    
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


@router.post("/item/{ticket_id}/resolve")
async def resolve_item(ticket_id: str, request: ResolveRequest):
    """
    Resolve a queue item. MUST communicate to member.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
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
    notification_sent = False
    
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
    
    return {
        "success": True,
        "message": "Resolved and member notified",
        "notification_sent": notification_sent,
        "send_via": request.send_via
    }


@router.post("/item/{ticket_id}/escalate")
async def escalate_item(ticket_id: str, request: AddNoteRequest):
    """Escalate priority of an item."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
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
                        "generated_at": datetime.now(timezone.utc).isoformat(),
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
    
    # Get agents from admin_credentials
    agents = await db.admin_credentials.find(
        {},
        {"_id": 0, "username": 1, "role": 1}
    ).to_list(100)
    
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
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "auto_assigned": True
            },
            "$push": {
                "timeline": {
                    "action": "auto_assigned",
                    "by": "system",
                    "to": selected_agent,
                    "at": datetime.now(timezone.utc).isoformat()
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
    
    # Agent performance
    agents = await db.admin_credentials.find({}, {"username": 1, "_id": 0}).to_list(100)
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
                <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
{message}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">Reference: #{ticket_id}</p>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    🐾 The Doggy Company | woof@thedoggycompany.in
                </p>
            </div>
        </div>
        """
        
        response = resend.Emails.send({
            "from": "The Doggy Company <woof@thedoggycompany.in>",
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
                        "sent_at": datetime.now(timezone.utc).isoformat(),
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
    """Generate WhatsApp click-to-chat link."""
    db = get_db()
    
    # Clean phone number
    phone = recipient_phone.replace(" ", "").replace("-", "").replace("+", "")
    if not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    
    # URL encode the message
    import urllib.parse
    encoded_message = urllib.parse.quote(message)
    
    whatsapp_link = f"https://wa.me/{phone}?text={encoded_message}"
    
    # Log the communication intent
    await db.service_desk_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {
                "communications": {
                    "channel": "whatsapp",
                    "to": recipient_phone,
                    "message": message,
                    "link": whatsapp_link,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "link_generated"
                }
            }
        }
    )
    
    return {
        "success": True,
        "channel": "whatsapp",
        "link": whatsapp_link,
        "phone": phone,
        "message": "Click the link to open WhatsApp"
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
    
    # Sort by created_at
    all_tickets.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
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
        "at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update in appropriate collection
    collection = db.service_desk_tickets if await db.service_desk_tickets.find_one({"ticket_id": ticket_id}) else db.tickets
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"communications": reply_doc},
            "$set": {
                "status": "open",  # Re-open if resolved
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "has_new_reply": True
            }
        }
    )
    
    return {
        "success": True,
        "message": "Reply added successfully"
    }

