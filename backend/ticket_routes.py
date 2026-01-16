"""
Universal Ticketing System / Service Desk
Handles all concierge requests across multiple channels
"""

from fastapi import APIRouter, HTTPException, Query, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# ============== MODELS ==============

class MemberDetails(BaseModel):
    name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    membership_type: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "India"

class TicketCreate(BaseModel):
    member: MemberDetails
    category: str
    sub_category: Optional[str] = None
    urgency: str = "medium"
    deadline: Optional[str] = None
    description: str
    source: str = "internal"
    source_reference: Optional[str] = None
    attachments: Optional[List[str]] = []

class TicketUpdate(BaseModel):
    member: Optional[MemberDetails] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    urgency: Optional[str] = None
    deadline: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    estimated_resolution_time: Optional[str] = None
    resolution_note: Optional[str] = None
    internal_notes: Optional[str] = None
    tags: Optional[List[str]] = None

class TicketReply(BaseModel):
    message: str
    is_internal: bool = False
    channel: Optional[str] = None

class MemberNote(BaseModel):
    note: str
    category: str = "general"

class IntegrationConfig(BaseModel):
    provider: str
    config: Dict[str, Any]
    enabled: bool = False

# ============== CONSTANTS ==============

TICKET_CATEGORIES = [
    {"id": "celebrate", "name": "Celebrate", "icon": "🎂", "description": "Birthday cakes, celebrations"},
    {"id": "dine", "name": "Dine", "icon": "🍽️", "description": "Restaurant reservations, dining"},
    {"id": "travel", "name": "Travel", "icon": "✈️", "description": "Pet travel assistance"},
    {"id": "stay", "name": "Stay", "icon": "🏨", "description": "Pet-friendly accommodations"},
    {"id": "enjoy", "name": "Enjoy", "icon": "🎉", "description": "Events & experiences"},
    {"id": "club", "name": "Club", "icon": "👑", "description": "Membership & club services"},
    {"id": "care", "name": "Care", "icon": "💊", "description": "Pet health & wellness"},
    {"id": "shop", "name": "Shop Assist", "icon": "🛒", "description": "Product inquiries & orders"},
    {"id": "work", "name": "Work", "icon": "💼", "description": "Pet at work services"},
    {"id": "fit", "name": "Fit", "icon": "🏃", "description": "Pet fitness & activities"},
    {"id": "exclusive", "name": "Exclusive", "icon": "⭐", "description": "VIP & exclusive requests"},
    {"id": "emergency", "name": "Emergency", "icon": "🚨", "description": "Urgent pet emergencies"},
    {"id": "advisory", "name": "Advisory", "icon": "📋", "description": "Pet advice & consultation"},
    {"id": "paperwork", "name": "Paperwork", "icon": "📄", "description": "Documents & certifications"},
    {"id": "referrals", "name": "Referrals", "icon": "🤝", "description": "Partner referrals"},
]

TICKET_STATUSES = [
    {"id": "new", "name": "New", "color": "blue"},
    {"id": "in_progress", "name": "In Progress", "color": "yellow"},
    {"id": "waiting_on_member", "name": "Waiting on Member", "color": "orange"},
    {"id": "escalated", "name": "Escalated", "color": "red"},
    {"id": "resolved", "name": "Resolved", "color": "green"},
    {"id": "closed", "name": "Closed", "color": "gray"},
]

URGENCY_LEVELS = [
    {"id": "low", "name": "Low", "color": "gray", "sla_hours": 48},
    {"id": "medium", "name": "Medium", "color": "blue", "sla_hours": 24},
    {"id": "high", "name": "High", "color": "orange", "sla_hours": 8},
    {"id": "critical", "name": "Critical", "color": "red", "sla_hours": 2},
]

# ============== HELPER FUNCTIONS ==============

async def generate_ticket_id():
    """Generate a unique ticket ID like TKT-20240116-001"""
    db = get_db()
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
    return f"TKT-{today}-{str(count + 1).zfill(3)}"

def serialize_ticket(ticket: dict) -> dict:
    """Convert MongoDB ticket to JSON-serializable format"""
    if not ticket:
        return None
    ticket["id"] = str(ticket.pop("_id"))
    return ticket

# ============== TICKET ROUTES ==============

@router.get("/categories")
async def get_categories():
    """Get all ticket categories (pillars) including custom ones"""
    db = get_db()
    
    # Get custom categories from database
    cursor = db.ticket_categories.find({})
    custom_cats = await cursor.to_list(length=100)
    
    # Combine default and custom
    all_categories = list(TICKET_CATEGORIES)
    for cat in custom_cats:
        cat["id"] = cat.get("id") or str(cat.pop("_id"))
        if "_id" in cat:
            del cat["_id"]
        cat["isCustom"] = True
        all_categories.append(cat)
    
    return {"categories": all_categories}

@router.post("/categories/custom")
async def add_custom_category(category: Dict[str, Any]):
    """Add a custom category"""
    db = get_db()
    
    category_doc = {
        "id": category.get("id"),
        "name": category.get("name"),
        "icon": category.get("icon", "📁"),
        "description": category.get("description", ""),
        "isCustom": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ticket_categories.insert_one(category_doc)
    
    return {"success": True, "category": category_doc}

@router.delete("/categories/custom/{category_id}")
async def delete_custom_category(category_id: str):
    """Delete a custom category"""
    db = get_db()
    
    result = await db.ticket_categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"success": True}

@router.post("/categories/sub")
async def add_sub_category(sub_category: Dict[str, Any]):
    """Add a sub-category"""
    db = get_db()
    
    sub_cat_doc = {
        "id": sub_category.get("id"),
        "name": sub_category.get("name"),
        "parent_id": sub_category.get("parentId"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ticket_sub_categories.insert_one(sub_cat_doc)
    
    return {"success": True, "sub_category": sub_cat_doc}

@router.get("/categories/{category_id}/sub")
async def get_sub_categories(category_id: str):
    """Get sub-categories for a category"""
    db = get_db()
    
    cursor = db.ticket_sub_categories.find({"parent_id": category_id})
    sub_cats = await cursor.to_list(length=100)
    
    for sc in sub_cats:
        sc["id"] = str(sc.pop("_id"))
    
    return {"sub_categories": sub_cats}

@router.get("/statuses")
async def get_statuses():
    """Get all ticket statuses"""
    return {"statuses": TICKET_STATUSES}

@router.get("/urgency-levels")
async def get_urgency_levels():
    """Get all urgency levels"""
    return {"urgency_levels": URGENCY_LEVELS}

@router.post("/")
async def create_ticket(ticket: TicketCreate):
    """Create a new ticket"""
    db = get_db()
    
    ticket_id = await generate_ticket_id()
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "member": ticket.member.dict(),
        "category": ticket.category,
        "sub_category": ticket.sub_category,
        "urgency": ticket.urgency,
        "deadline": ticket.deadline,
        "description": ticket.description,
        "source": ticket.source,
        "source_reference": ticket.source_reference,
        "attachments": ticket.attachments or [],
        "assigned_to": None,
        "status": "new",
        "priority": 3,
        "estimated_resolution_time": None,
        "actual_resolution_time": None,
        "resolution_note": None,
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": ticket.description,
            "sender": "member",
            "sender_name": ticket.member.name,
            "channel": ticket.source,
            "timestamp": now,
            "is_internal": False
        }],
        "internal_notes": "",
        "tags": [],
        "created_at": now,
        "updated_at": now,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
    }
    
    result = await db.tickets.insert_one(ticket_doc)
    ticket_doc["id"] = str(result.inserted_id)
    del ticket_doc["_id"]
    
    return {"success": True, "ticket": ticket_doc}

@router.get("/")
async def list_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """List tickets with filters"""
    db = get_db()
    
    query = {}
    
    if status:
        if status == "open":
            query["status"] = {"$nin": ["resolved", "closed"]}
        else:
            query["status"] = status
    
    if category:
        query["category"] = category
    
    if urgency:
        query["urgency"] = urgency
    
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    if source:
        query["source"] = source
    
    if search:
        query["$or"] = [
            {"ticket_id": {"$regex": search, "$options": "i"}},
            {"member.name": {"$regex": search, "$options": "i"}},
            {"member.email": {"$regex": search, "$options": "i"}},
            {"member.phone": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    cursor = db.tickets.find(query).sort(sort_by, sort_direction).skip(offset).limit(limit)
    tickets = await cursor.to_list(length=limit)
    
    total = await db.tickets.count_documents(query)
    
    return {
        "tickets": [serialize_ticket(t) for t in tickets],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/stats")
async def get_ticket_stats():
    """Get ticket statistics for dashboard"""
    db = get_db()
    
    # Count by status
    status_counts = {}
    for status in TICKET_STATUSES:
        count = await db.tickets.count_documents({"status": status["id"]})
        status_counts[status["id"]] = count
    
    # Count open tickets
    open_count = await db.tickets.count_documents({"status": {"$nin": ["resolved", "closed"]}})
    
    # Count by category
    category_counts = {}
    for cat in TICKET_CATEGORIES:
        count = await db.tickets.count_documents({"category": cat["id"]})
        category_counts[cat["id"]] = count
    
    # Count by urgency (open tickets only)
    urgency_counts = {}
    for urg in URGENCY_LEVELS:
        count = await db.tickets.count_documents({
            "urgency": urg["id"],
            "status": {"$nin": ["resolved", "closed"]}
        })
        urgency_counts[urg["id"]] = count
    
    # Tickets by concierge
    pipeline = [
        {"$match": {"assigned_to": {"$ne": None}}},
        {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cursor = db.tickets.aggregate(pipeline)
    tickets_by_assignee = await cursor.to_list(length=100)
    
    # Recent tickets (last 24 hours)
    from datetime import timedelta
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_count = await db.tickets.count_documents({"created_at": {"$gte": yesterday}})
    
    # Overdue tickets
    now = datetime.now(timezone.utc).isoformat()
    overdue_count = await db.tickets.count_documents({
        "deadline": {"$lt": now, "$ne": None},
        "status": {"$nin": ["resolved", "closed"]}
    })
    
    return {
        "total_open": open_count,
        "by_status": status_counts,
        "by_category": category_counts,
        "by_urgency": urgency_counts,
        "by_assignee": tickets_by_assignee,
        "recent_24h": recent_count,
        "overdue": overdue_count
    }

@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get a single ticket by ID"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"ticket": serialize_ticket(ticket)}

@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: str, update: TicketUpdate):
    """Update a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    update_data = update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        if value is not None:
            if key == "member":
                update_doc["member"] = value
            else:
                update_doc[key] = value
    
    # Handle status changes
    if "status" in update_doc:
        now = datetime.now(timezone.utc).isoformat()
        
        if update_doc["status"] == "resolved":
            update_doc["resolved_at"] = now
            if not update_doc.get("resolution_note") and not ticket.get("resolution_note"):
                raise HTTPException(
                    status_code=400, 
                    detail="Resolution note is required when marking as resolved"
                )
        
        if update_doc["status"] == "closed":
            update_doc["closed_at"] = now
    
    await db.tickets.update_one(
        {"_id": ticket["_id"]},
        {"$set": update_doc}
    )
    
    updated = await db.tickets.find_one({"_id": ticket["_id"]})
    
    return {"success": True, "ticket": serialize_ticket(updated)}

@router.post("/{ticket_id}/reply")
async def add_reply(ticket_id: str, reply: TicketReply):
    """Add a reply/message to a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "id": str(uuid.uuid4()),
        "type": "internal_note" if reply.is_internal else "reply",
        "content": reply.message,
        "sender": "concierge",
        "channel": reply.channel or "internal",
        "timestamp": now,
        "is_internal": reply.is_internal
    }
    
    update_doc = {"updated_at": now}
    
    if not ticket.get("first_response_at") and not reply.is_internal:
        update_doc["first_response_at"] = now
    
    await db.tickets.update_one(
        {"_id": ticket["_id"]},
        {
            "$push": {"messages": message},
            "$set": update_doc
        }
    )
    
    return {"success": True, "message": message}

@router.post("/{ticket_id}/assign")
async def assign_ticket(ticket_id: str, assignee: str = Form(...)):
    """Assign a ticket to a concierge"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.tickets.update_one(
        {"_id": ticket["_id"]},
        {"$set": {
            "assigned_to": assignee,
            "updated_at": now,
            "status": "in_progress" if ticket.get("status") == "new" else ticket.get("status")
        }}
    )
    
    return {"success": True, "assigned_to": assignee}

@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: str):
    """Delete a ticket"""
    db = get_db()
    
    result = await db.tickets.delete_one({"ticket_id": ticket_id})
    if result.deleted_count == 0:
        try:
            result = await db.tickets.delete_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True}

# ============== MEMBER CRM ROUTES ==============

@router.get("/members/{identifier}/notes")
async def get_member_notes(identifier: str):
    """Get all notes for a member"""
    db = get_db()
    
    cursor = db.member_notes.find({
        "$or": [
            {"member_email": identifier},
            {"member_phone": identifier}
        ]
    }).sort("created_at", -1)
    notes = await cursor.to_list(length=100)
    
    for note in notes:
        note["id"] = str(note.pop("_id"))
    
    return {"notes": notes}

@router.post("/members/{identifier}/notes")
async def add_member_note(identifier: str, note: MemberNote):
    """Add a note to a member's profile"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    note_doc = {
        "member_email": identifier if "@" in identifier else None,
        "member_phone": identifier if "@" not in identifier else None,
        "note": note.note,
        "category": note.category,
        "created_at": now,
        "created_by": "admin"
    }
    
    result = await db.member_notes.insert_one(note_doc)
    note_doc["id"] = str(result.inserted_id)
    del note_doc["_id"]
    
    return {"success": True, "note": note_doc}

@router.get("/members/{identifier}/history")
async def get_member_ticket_history(identifier: str):
    """Get ticket history for a member"""
    db = get_db()
    
    cursor = db.tickets.find({
        "$or": [
            {"member.email": identifier},
            {"member.phone": identifier},
            {"member.whatsapp": identifier}
        ]
    }).sort("created_at", -1).limit(50)
    tickets = await cursor.to_list(length=50)
    
    return {"tickets": [serialize_ticket(t) for t in tickets]}

# ============== INTEGRATION CONFIG ROUTES ==============

@router.get("/integrations")
async def get_integrations():
    """Get all integration configurations"""
    db = get_db()
    
    cursor = db.ticket_integrations.find({})
    configs = await cursor.to_list(length=100)
    
    for config in configs:
        config["id"] = str(config.pop("_id"))
        if "config" in config:
            for key in ["password", "api_key", "secret", "token"]:
                if key in config["config"]:
                    config["config"][key] = "********"
    
    return {"integrations": configs}

@router.post("/integrations")
async def save_integration(integration: IntegrationConfig):
    """Save or update an integration configuration"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    existing = await db.ticket_integrations.find_one({"provider": integration.provider})
    
    if existing:
        await db.ticket_integrations.update_one(
            {"provider": integration.provider},
            {"$set": {
                "config": integration.config,
                "enabled": integration.enabled,
                "updated_at": now
            }}
        )
    else:
        await db.ticket_integrations.insert_one({
            "provider": integration.provider,
            "config": integration.config,
            "enabled": integration.enabled,
            "created_at": now,
            "updated_at": now
        })
    
    return {"success": True}

@router.delete("/integrations/{provider}")
async def delete_integration(provider: str):
    """Delete an integration configuration"""
    db = get_db()
    
    result = await db.ticket_integrations.delete_one({"provider": provider})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return {"success": True}

# ============== CONCIERGE ROUTES ==============

@router.get("/concierges")
async def get_concierges():
    """Get list of concierges for assignment"""
    db = get_db()
    
    cursor = db.concierges.find({})
    concierges = await cursor.to_list(length=100)
    
    if not concierges:
        concierges = [
            {"id": "aditya", "name": "Aditya", "email": "aditya@thedoggycompany.in", "role": "senior"},
            {"id": "concierge1", "name": "Concierge 1", "email": "concierge1@thedoggycompany.in", "role": "junior"},
        ]
    else:
        for c in concierges:
            c["id"] = str(c.pop("_id"))
    
    return {"concierges": concierges}

@router.post("/concierges")
async def add_concierge(
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form("junior")
):
    """Add a new concierge"""
    db = get_db()
    
    concierge_doc = {
        "name": name,
        "email": email,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.concierges.insert_one(concierge_doc)
    concierge_doc["id"] = str(result.inserted_id)
    del concierge_doc["_id"]
    
    return {"success": True, "concierge": concierge_doc}
