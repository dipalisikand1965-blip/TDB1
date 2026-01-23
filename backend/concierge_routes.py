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
    "urgent": 1,
    "high": 4,
    "medium": 24,
    "low": 72
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
    member_tier = item.get("member", {}).get("membership_tier", "free")
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
    
    # Apply priority filter
    if priority:
        all_items = [item for item in all_items if item.get("priority_bucket") == priority]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        all_items = [
            item for item in all_items
            if search_lower in str(item.get("original_request", "")).lower()
            or search_lower in str(item.get("member", {}).get("name", "")).lower()
            or search_lower in str(item.get("member", {}).get("email", "")).lower()
            or search_lower in str(item.get("ticket_id", "")).lower()
        ]
    
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
    
    # Check orders
    if not item and ticket_id.startswith("ORD-"):
        order_id = ticket_id.replace("ORD-", "")
        item = await db.orders.find_one(
            {"$or": [{"order_id": order_id}, {"id": order_id}]}, 
            {"_id": 0}
        )
        if item:
            source_collection = "orders"
            item["ticket_id"] = ticket_id
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get member email
    member_email = item.get("member", {}).get("email")
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
