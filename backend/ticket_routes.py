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
import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Get Resend for email notifications
def get_resend():
    try:
        import resend
        api_key = os.environ.get("RESEND_API_KEY")
        if api_key:
            resend.api_key = api_key
            return resend
    except:
        pass
    return None

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BUSINESS_EMAIL = os.environ.get("REACT_APP_BUSINESS_EMAIL", "woof@thedoggybakery.in")

async def send_ticket_notification(ticket: dict, notification_type: str = "created"):
    """Send email notification for ticket events"""
    resend_client = get_resend()
    if not resend_client:
        return False
    
    try:
        member = ticket.get("member", {})
        member_email = member.get("email")
        
        if notification_type == "created":
            # Send confirmation to member
            if member_email:
                resend_client.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": member_email,
                    "subject": f"Ticket {ticket['ticket_id']} - We've received your request",
                    "html": f"""
                        <h2>Thank you for contacting The Doggy Company!</h2>
                        <p>We've received your request and our concierge team will get back to you soon.</p>
                        <p><strong>Ticket ID:</strong> {ticket['ticket_id']}</p>
                        <p><strong>Category:</strong> {ticket.get('category', 'General')}</p>
                        <p><strong>Your Request:</strong></p>
                        <p style="background:#f5f5f5;padding:15px;border-radius:8px;">{ticket.get('description', '')}</p>
                        <p>We'll keep you updated on the progress.</p>
                        <p>Best regards,<br>The Doggy Company Concierge Team</p>
                    """
                })
            
            # Notify concierge team
            resend_client.Emails.send({
                "from": SENDER_EMAIL,
                "to": BUSINESS_EMAIL,
                "subject": f"🎫 New Ticket: {ticket['ticket_id']} - {ticket.get('category', 'General').upper()}",
                "html": f"""
                    <h2>New Service Desk Ticket</h2>
                    <p><strong>Ticket ID:</strong> {ticket['ticket_id']}</p>
                    <p><strong>Category:</strong> {ticket.get('category', 'General')}</p>
                    <p><strong>Urgency:</strong> {ticket.get('urgency', 'medium').upper()}</p>
                    <p><strong>Member:</strong> {member.get('name', 'Unknown')}</p>
                    <p><strong>Phone:</strong> {member.get('phone', 'N/A')}</p>
                    <p><strong>Email:</strong> {member.get('email', 'N/A')}</p>
                    <p><strong>City:</strong> {member.get('city', 'N/A')}</p>
                    <hr>
                    <p><strong>Request:</strong></p>
                    <p style="background:#fff3cd;padding:15px;border-radius:8px;">{ticket.get('description', '')}</p>
                    <p><a href="https://thedoggycompany.in/admin">View in Service Desk →</a></p>
                """
            })
        
        elif notification_type == "resolved":
            if member_email:
                resend_client.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": member_email,
                    "subject": f"Ticket {ticket['ticket_id']} - Resolved ✓",
                    "html": f"""
                        <h2>Your request has been resolved!</h2>
                        <p><strong>Ticket ID:</strong> {ticket['ticket_id']}</p>
                        <p><strong>Resolution:</strong></p>
                        <p style="background:#d4edda;padding:15px;border-radius:8px;">{ticket.get('resolution_note', 'Your request has been completed.')}</p>
                        <p>Thank you for choosing The Doggy Company!</p>
                        <p>Best regards,<br>The Doggy Company Concierge Team</p>
                    """
                })
        
        return True
    except Exception as e:
        print(f"Error sending ticket notification: {e}")
        return False

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
    
    # Send email notifications
    await send_ticket_notification(ticket_doc, "created")
    
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

# ============== INTEGRATION CONFIG ROUTES (must be before /{ticket_id}) ==============

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

# ============== CONCIERGE ROUTES (must be before /{ticket_id}) ==============

@router.get("/concierges")
async def get_concierges():
    """Get list of concierges for assignment"""
    db = get_db()
    
    cursor = db.concierges.find({})
    concierges = await cursor.to_list(length=100)
    
    if not concierges:
        concierges = [
            {"id": "aditya", "name": "Aditya", "email": "aditya@thedoggycompany.in", "role": "admin"},
            {"id": "concierge1", "name": "Concierge 1", "email": "concierge1@thedoggycompany.in", "role": "junior"},
        ]
    else:
        for c in concierges:
            c["id"] = str(c.pop("_id"))
    
    return {"concierges": concierges}

# Alias endpoint for agents
@router.get("/agents")
async def get_agents():
    """Get list of agents (alias for concierges)"""
    return await get_concierges()

@router.post("/agents")
async def add_agent(
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form("junior")
):
    """Add a new agent"""
    return await add_concierge(name=name, email=email, role=role)

@router.put("/agents/{agent_id}")
async def update_agent(
    agent_id: str,
    role: Optional[str] = None,
    name: Optional[str] = None,
    email: Optional[str] = None
):
    """Update agent role or details"""
    db = get_db()
    
    update_doc = {}
    if role:
        update_doc["role"] = role
    if name:
        update_doc["name"] = name
    if email:
        update_doc["email"] = email
    
    if not update_doc:
        return {"success": False, "message": "No fields to update"}
    
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    try:
        result = await db.concierges.update_one(
            {"_id": ObjectId(agent_id)},
            {"$set": update_doc}
        )
    except:
        # Try by concierge_id string
        result = await db.concierges.update_one(
            {"concierge_id": agent_id},
            {"$set": update_doc}
        )
    
    return {"success": True, "message": "Agent updated"}

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

# ============== SINGLE TICKET ROUTES ==============

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
    
    # Track if status changed to resolved
    was_resolved = False
    old_status = ticket.get("status")
    old_assignee = ticket.get("assigned_to")
    
    # Prepare audit entries
    audit_entries = []
    now = datetime.now(timezone.utc).isoformat()
    
    # Handle status changes
    if "status" in update_doc:
        if update_doc["status"] == "resolved":
            update_doc["resolved_at"] = now
            if not update_doc.get("resolution_note") and not ticket.get("resolution_note"):
                raise HTTPException(
                    status_code=400, 
                    detail="Resolution note is required when marking as resolved"
                )
            was_resolved = True
        
        if update_doc["status"] == "closed":
            update_doc["closed_at"] = now
        
        # Add status change to audit trail
        if update_doc["status"] != old_status:
            audit_entries.append({
                "type": "status_change",
                "action": f"Status changed from {old_status} to {update_doc['status']}",
                "old_value": old_status,
                "new_value": update_doc["status"],
                "user": username,
                "timestamp": now
            })
    
    # Track assignment changes
    if "assigned_to" in update_doc and update_doc["assigned_to"] != old_assignee:
        audit_entries.append({
            "type": "assignment",
            "action": f"Assigned to {update_doc['assigned_to']}",
            "old_value": old_assignee,
            "new_value": update_doc["assigned_to"],
            "user": username,
            "timestamp": now
        })
    
    # Build update operation
    update_op = {"$set": update_doc}
    if audit_entries:
        update_op["$push"] = {"audit_trail": {"$each": audit_entries}}
    
    await db.tickets.update_one(
        {"_id": ticket["_id"]},
        update_op
    )
    
    updated = await db.tickets.find_one({"_id": ticket["_id"]})
    updated_serialized = serialize_ticket(updated)
    
    # Send email notification if resolved
    if was_resolved:
        # Need to re-fetch to get the full ticket with resolution note
        await send_ticket_notification(updated_serialized, "resolved")
    
    return {"success": True, "ticket": updated_serialized}

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


# ============ Manual Ticket Creation for All Pillars ============

class ServiceRequest(BaseModel):
    """Model for creating service request tickets (Travel, Care, etc.)"""
    event_type: str  # travel_booking, care_appointment, grooming_appointment, etc.
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    
    # Pet details
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    pet_age: Optional[str] = None
    pet_weight_kg: Optional[float] = None
    
    # Service specific fields
    service_type: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    
    # Travel specific
    origin_city: Optional[str] = None
    destination_city: Optional[str] = None
    travel_date: Optional[str] = None
    return_date: Optional[str] = None
    travel_type: Optional[str] = None  # Domestic, International
    
    # Care specific
    is_emergency: Optional[bool] = False
    symptoms: Optional[str] = None
    concerns: Optional[str] = None
    
    # General
    special_requirements: Optional[str] = None
    notes: Optional[str] = None

@router.post("/service-request")
async def create_service_request(request: ServiceRequest):
    """
    Create a service request ticket for any pillar (Travel, Care, Grooming, etc.)
    This endpoint can be called from frontend forms or external integrations.
    """
    from ticket_auto_create import create_ticket_from_event
    db = get_db()
    
    # Generate a unique request ID
    request_id = f"{request.event_type.split('_')[0]}-req-{uuid.uuid4().hex[:12]}"
    
    # Build event data based on event type
    event_data = {
        "booking_id" if "booking" in request.event_type else "appointment_id": request_id,
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "city": request.city,
        "pet_name": request.pet_name,
        "pet_breed": request.pet_breed,
        "pet_age": request.pet_age,
        "pet_weight_kg": request.pet_weight_kg,
        "service_type": request.service_type,
        "preferred_date": request.preferred_date,
        "preferred_time": request.preferred_time,
        "notes": request.notes,
        "special_requirements": request.special_requirements,
    }
    
    # Add travel-specific fields
    if request.event_type == "travel_booking":
        event_data.update({
            "origin_city": request.origin_city,
            "destination_city": request.destination_city,
            "travel_date": request.travel_date,
            "return_date": request.return_date,
            "travel_type": request.travel_type or "Domestic",
        })
    
    # Add care-specific fields
    if request.event_type in ["care_appointment", "grooming_appointment"]:
        event_data.update({
            "is_emergency": request.is_emergency,
            "symptoms": request.symptoms,
            "concerns": request.concerns,
            "location_preference": request.city,
        })
    
    try:
        ticket_id = await create_ticket_from_event(db, request.event_type, event_data)
        
        # Also create an admin notification
        await db.admin_notifications.insert_one({
            "type": request.event_type,
            "title": f"New {request.event_type.replace('_', ' ').title()} from {request.name}",
            "message": f"Service request received. Pet: {request.pet_name or 'N/A'}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "link": f"/admin/service-desk?ticket={ticket_id}"
        })
        
        return {
            "success": True, 
            "request_id": request_id,
            "ticket_id": ticket_id,
            "message": "Your request has been received! Our concierge will contact you shortly."
        }
    except Exception as e:
        print(f"Error creating service request: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create service request: {str(e)}")

@router.post("/bulk/assign")
async def bulk_assign_tickets(data: dict):
    """Bulk assign multiple tickets to a concierge"""
    db = get_db()
    
    ticket_ids = data.get("ticket_ids", [])
    assignee = data.get("assignee")
    
    if not ticket_ids or not assignee:
        raise HTTPException(status_code=400, detail="ticket_ids and assignee are required")
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_many(
        {"ticket_id": {"$in": ticket_ids}},
        {"$set": {"assigned_to": assignee, "updated_at": now}}
    )
    
    return {
        "success": True,
        "modified_count": result.modified_count,
        "message": f"{result.modified_count} tickets assigned to {assignee}"
    }

@router.post("/bulk/status")
async def bulk_update_status(data: dict):
    """Bulk update status of multiple tickets"""
    db = get_db()
    
    ticket_ids = data.get("ticket_ids", [])
    new_status = data.get("status")
    resolution_note = data.get("resolution_note")
    
    if not ticket_ids or not new_status:
        raise HTTPException(status_code=400, detail="ticket_ids and status are required")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_doc = {"status": new_status, "updated_at": now}
    
    if new_status == "resolved":
        update_doc["resolved_at"] = now
        if resolution_note:
            update_doc["resolution_note"] = resolution_note
    elif new_status == "closed":
        update_doc["closed_at"] = now
    
    result = await db.tickets.update_many(
        {"ticket_id": {"$in": ticket_ids}},
        {"$set": update_doc}
    )
    
    return {
        "success": True,
        "modified_count": result.modified_count,
        "message": f"{result.modified_count} tickets updated to {new_status}"
    }

@router.delete("/bulk/delete")
async def bulk_delete_tickets(data: dict):
    """Bulk delete multiple tickets"""
    db = get_db()
    
    ticket_ids = data.get("ticket_ids", [])
    
    if not ticket_ids:
        raise HTTPException(status_code=400, detail="ticket_ids is required")
    
    result = await db.tickets.delete_many(
        {"ticket_id": {"$in": ticket_ids}}
    )
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": f"{result.deleted_count} tickets deleted"
    }


# ============ AI-Powered Reply Drafting ============

class AIReplyRequest(BaseModel):
    ticket_id: str
    reply_type: str = "professional"  # professional, friendly, empathetic, quick
    additional_context: Optional[str] = None

@router.post("/ai/draft-reply")
async def ai_draft_reply(request: AIReplyRequest):
    """
    Generate AI-powered reply draft for a ticket using GPT
    """
    db = get_db()
    
    # Get the ticket
    ticket = await db.tickets.find_one({"ticket_id": request.ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Build context from ticket
    member = ticket.get("member", {})
    messages = ticket.get("messages", [])
    
    # Get conversation history
    conversation = "\n".join([
        f"[{m.get('sender', 'unknown').upper()}] {m.get('content', '')[:500]}"
        for m in messages[-5:]  # Last 5 messages
    ])
    
    # Define tone based on reply_type
    tone_instructions = {
        "professional": "professional, courteous, and business-appropriate",
        "friendly": "warm, friendly, and personable while remaining professional",
        "empathetic": "deeply empathetic, understanding, and supportive",
        "quick": "brief, to-the-point, and efficient"
    }
    
    tone = tone_instructions.get(request.reply_type, tone_instructions["professional"])
    
    # Build the prompt
    system_prompt = f"""You are a world-class pet concierge at The Doggy Company (TDB), India's premier pet lifestyle brand.
Your role is to draft exceptional customer service replies that make members feel valued and cared for.

BRAND VOICE:
- Warm, premium, and caring
- We call pet parents "Pet Parents" and their pets by name when known
- We use terms like "fur baby", "pawsome", "woof" naturally
- We are the "Pet Life Operating System" - we handle everything for their pets

MEMBER CONTEXT:
- Name: {member.get('name', 'Valued Member')}
- Pet Name: {ticket.get('pet', {}).get('name', 'their pet')}
- Category: {ticket.get('category', 'general')}
- Urgency: {ticket.get('urgency', 'medium')}
- Status: {ticket.get('status', 'open')}

TONE FOR THIS REPLY: {tone}

TICKET DESCRIPTION:
{ticket.get('description', 'No description provided')[:1000]}

CONVERSATION HISTORY:
{conversation if conversation else 'No previous messages'}

{f"ADDITIONAL CONTEXT: {request.additional_context}" if request.additional_context else ""}

Generate a reply that:
1. Addresses their specific concern
2. Shows genuine care for them and their pet
3. Provides clear next steps or solutions
4. Ends with a warm sign-off
5. Is ready to send (no placeholders)

Reply (do not include subject line, just the message body):"""

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"reply-draft-{request.ticket_id}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text="Generate the reply now.")
        response = await chat.send_message(user_message)
        
        # Also generate a shorter version
        quick_chat = LlmChat(
            api_key=api_key,
            session_id=f"reply-quick-{request.ticket_id}",
            system_message=f"Based on this customer service context, generate a very brief 1-2 sentence acknowledgment reply. Be warm but extremely concise.\n\nContext: {ticket.get('description', '')[:300]}"
        ).with_model("openai", "gpt-4o")
        
        quick_response = await quick_chat.send_message(UserMessage(text="Generate brief reply."))
        
        return {
            "success": True,
            "draft": response,
            "quick_draft": quick_response,
            "tone": request.reply_type,
            "ticket_id": request.ticket_id
        }
        
    except Exception as e:
        print(f"AI draft reply error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate AI reply: {str(e)}")

@router.post("/ai/summarize")
async def ai_summarize_ticket(ticket_id: str):
    """
    Generate AI summary of a ticket's conversation
    """
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    messages = ticket.get("messages", [])
    conversation = "\n".join([
        f"[{m.get('sender', 'unknown')}] {m.get('content', '')}"
        for m in messages
    ])
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"summarize-{ticket_id}",
            system_message="You are a helpful assistant that summarizes customer service tickets. Be concise and highlight key points, issues, and actions taken."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Summarize this ticket in 2-3 bullet points:

TICKET: {ticket.get('description', '')[:500]}

CONVERSATION:
{conversation[:2000]}

Summary:"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "success": True,
            "summary": response,
            "ticket_id": ticket_id
        }
        
    except Exception as e:
        print(f"AI summarize error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to summarize: {str(e)}")

@router.post("/ai/suggest-actions")
async def ai_suggest_actions(ticket_id: str):
    """
    AI suggests next best actions for a ticket
    """
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"actions-{ticket_id}",
            system_message="You are a customer service expert. Suggest 3-5 specific next actions for handling this ticket effectively. Be actionable and specific."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Based on this ticket, suggest the next best actions:

Category: {ticket.get('category', 'general')}
Urgency: {ticket.get('urgency', 'medium')}
Status: {ticket.get('status', 'open')}
Description: {ticket.get('description', '')[:500]}

Suggest 3-5 specific next actions (return as JSON array of strings):"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Try to parse as JSON, fallback to text
        import json
        try:
            actions = json.loads(response)
        except:
            actions = [response]
        
        return {
            "success": True,
            "suggested_actions": actions,
            "ticket_id": ticket_id
        }
        
    except Exception as e:
        print(f"AI suggest actions error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to suggest actions: {str(e)}")


# ============ Canned Responses / Templates ============

DEFAULT_CANNED_RESPONSES = [
    {
        "id": "greeting",
        "name": "Warm Greeting",
        "category": "general",
        "content": "Hello! 🐾 Thank you for reaching out to The Doggy Company. I'm here to help make your pet's life pawsome! How can I assist you today?"
    },
    {
        "id": "acknowledge",
        "name": "Acknowledge Request",
        "category": "general", 
        "content": "Thank you for your message! I've received your request and will look into this right away. You can expect an update within the next few hours."
    },
    {
        "id": "booking-confirm",
        "name": "Booking Confirmation",
        "category": "booking",
        "content": "Great news! 🎉 Your booking has been confirmed. Here are the details:\n\n[BOOKING_DETAILS]\n\nIf you have any questions or need to make changes, just let me know!"
    },
    {
        "id": "follow-up",
        "name": "Follow Up",
        "category": "general",
        "content": "Hi! I wanted to follow up on your recent inquiry. Is there anything else I can help you with? We're always here to make your pet's experience special! 💜"
    },
    {
        "id": "resolution",
        "name": "Issue Resolved",
        "category": "resolution",
        "content": "I'm happy to let you know that your concern has been resolved! 🎊\n\n[RESOLUTION_DETAILS]\n\nThank you for your patience. Please don't hesitate to reach out if you need anything else!"
    },
    {
        "id": "apology",
        "name": "Sincere Apology",
        "category": "service-recovery",
        "content": "I sincerely apologize for the inconvenience caused. This is not the experience we want for you and your fur baby. Let me make this right for you.\n\n[ACTION_TAKEN]\n\nAs a gesture of our commitment, [COMPENSATION]."
    },
    {
        "id": "callback",
        "name": "Callback Scheduled",
        "category": "general",
        "content": "I've scheduled a callback for you at [TIME]. Our concierge team will reach out to discuss this in detail. If the timing doesn't work, just let me know!"
    },
    {
        "id": "celebration",
        "name": "Birthday/Celebration",
        "category": "celebrate",
        "content": "How exciting! 🎂🎈 We can't wait to help celebrate [PET_NAME]'s special day! Our team will create a magical experience. Let me share the details..."
    }
]

@router.get("/canned-responses")
async def get_canned_responses():
    """Get all canned responses (default + custom)"""
    db = get_db()
    
    # Get custom responses
    custom = await db.canned_responses.find({}).to_list(100)
    
    all_responses = DEFAULT_CANNED_RESPONSES.copy()
    for resp in custom:
        del resp['_id']
        all_responses.append(resp)
    
    return {"responses": all_responses}

@router.post("/canned-responses")
async def create_canned_response(data: dict):
    """Create a custom canned response"""
    db = get_db()
    
    response_id = data.get('id') or f"custom-{uuid.uuid4().hex[:8]}"
    
    response_doc = {
        "id": response_id,
        "name": data.get('name', 'Custom Response'),
        "category": data.get('category', 'general'),
        "content": data.get('content', ''),
        "is_custom": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.canned_responses.insert_one(response_doc)
    del response_doc['_id']
    
    return {"success": True, "response": response_doc}

@router.delete("/canned-responses/{response_id}")
async def delete_canned_response(response_id: str):
    """Delete a custom canned response"""
    db = get_db()
    
    # Don't allow deleting defaults
    if any(r['id'] == response_id for r in DEFAULT_CANNED_RESPONSES):
        raise HTTPException(status_code=400, detail="Cannot delete default responses")
    
    result = await db.canned_responses.delete_one({"id": response_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ============ Ticket Merge ============

@router.post("/merge")
async def merge_tickets(data: dict):
    """Merge multiple tickets into one primary ticket"""
    db = get_db()
    
    primary_id = data.get('primary_ticket_id')
    merge_ids = data.get('merge_ticket_ids', [])
    
    if not primary_id or not merge_ids:
        raise HTTPException(status_code=400, detail="primary_ticket_id and merge_ticket_ids are required")
    
    # Get primary ticket
    primary = await db.tickets.find_one({"ticket_id": primary_id})
    if not primary:
        raise HTTPException(status_code=404, detail="Primary ticket not found")
    
    # Get tickets to merge
    to_merge = await db.tickets.find({"ticket_id": {"$in": merge_ids}}).to_list(100)
    
    # Combine messages from all tickets
    all_messages = primary.get("messages", [])
    merged_descriptions = [primary.get("description", "")]
    
    for ticket in to_merge:
        # Add merge note
        all_messages.append({
            "id": str(uuid.uuid4()),
            "type": "system",
            "content": f"📎 Merged from ticket {ticket.get('ticket_id')}: {ticket.get('description', '')[:200]}",
            "sender": "system",
            "sender_name": "System",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_internal": True
        })
        
        # Add all messages from merged ticket
        for msg in ticket.get("messages", []):
            msg["merged_from"] = ticket.get("ticket_id")
            all_messages.append(msg)
        
        merged_descriptions.append(f"[From {ticket.get('ticket_id')}]: {ticket.get('description', '')}")
    
    # Sort messages by timestamp
    all_messages.sort(key=lambda x: x.get("timestamp", ""))
    
    # Update primary ticket
    now = datetime.now(timezone.utc).isoformat()
    await db.tickets.update_one(
        {"ticket_id": primary_id},
        {
            "$set": {
                "messages": all_messages,
                "merged_tickets": merge_ids,
                "updated_at": now
            },
            "$push": {
                "audit_trail": {
                    "action": "tickets_merged",
                    "merged_ids": merge_ids,
                    "timestamp": now,
                    "performed_by": "admin"
                }
            }
        }
    )
    
    # Mark merged tickets as closed with reference
    await db.tickets.update_many(
        {"ticket_id": {"$in": merge_ids}},
        {
            "$set": {
                "status": "closed",
                "merged_into": primary_id,
                "closed_at": now,
                "updated_at": now
            }
        }
    )
    
    return {
        "success": True,
        "primary_ticket_id": primary_id,
        "merged_count": len(to_merge),
        "message": f"Successfully merged {len(to_merge)} tickets into {primary_id}"
    }

# ============ Customer Satisfaction Survey ============

@router.post("/{ticket_id}/satisfaction")
async def submit_satisfaction(ticket_id: str, data: dict):
    """Submit customer satisfaction rating for a resolved ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    rating = data.get('rating')  # 1-5 stars
    feedback = data.get('feedback', '')
    
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    now = datetime.now(timezone.utc).isoformat()
    
    satisfaction_data = {
        "rating": rating,
        "feedback": feedback,
        "submitted_at": now
    }
    
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "satisfaction": satisfaction_data,
                "updated_at": now
            },
            "$push": {
                "audit_trail": {
                    "action": "satisfaction_submitted",
                    "rating": rating,
                    "timestamp": now
                }
            }
        }
    )
    
    # Also store in a separate collection for analytics
    await db.satisfaction_surveys.insert_one({
        "ticket_id": ticket_id,
        "member_email": ticket.get("member", {}).get("email"),
        "category": ticket.get("category"),
        "assigned_to": ticket.get("assigned_to"),
        **satisfaction_data
    })
    
    return {"success": True, "message": "Thank you for your feedback!"}

@router.get("/satisfaction/stats")
async def get_satisfaction_stats():
    """Get satisfaction survey statistics"""
    db = get_db()
    
    pipeline = [
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
            "five_star": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}},
            "four_star": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
            "three_star": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
            "two_star": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
            "one_star": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}}
        }}
    ]
    
    result = await db.satisfaction_surveys.aggregate(pipeline).to_list(1)
    
    if result:
        stats = result[0]
        del stats['_id']
        stats['avg_rating'] = round(stats.get('avg_rating', 0), 2)
    else:
        stats = {"total": 0, "avg_rating": 0}
    
    return stats

# ============ Audit Trail ============

@router.post("/{ticket_id}/audit")
async def add_audit_entry(ticket_id: str, data: dict):
    """Add an audit trail entry to a ticket"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    audit_entry = {
        "action": data.get('action', 'update'),
        "details": data.get('details', {}),
        "performed_by": data.get('performed_by', 'system'),
        "timestamp": now
    }
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"audit_trail": audit_entry},
            "$set": {"updated_at": now}
        }
    )
    
    return {"success": result.modified_count > 0}

@router.get("/{ticket_id}/audit")
async def get_audit_trail(ticket_id: str):
    """Get full audit trail for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one(
        {"ticket_id": ticket_id},
        {"audit_trail": 1, "messages": 1, "created_at": 1, "status": 1}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Combine audit trail with message history for complete timeline
    timeline = []
    
    # Add creation event
    timeline.append({
        "type": "created",
        "timestamp": ticket.get("created_at"),
        "description": "Ticket created"
    })
    
    # Add audit entries
    for entry in ticket.get("audit_trail", []):
        timeline.append({
            "type": "audit",
            "action": entry.get("action"),
            "timestamp": entry.get("timestamp"),
            "performed_by": entry.get("performed_by"),
            "details": entry.get("details")
        })
    
    # Add message events
    for msg in ticket.get("messages", []):
        timeline.append({
            "type": "message",
            "message_type": msg.get("type"),
            "timestamp": msg.get("timestamp"),
            "sender": msg.get("sender_name") or msg.get("sender"),
            "channel": msg.get("channel"),
            "is_internal": msg.get("is_internal", False)
        })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x.get("timestamp", ""))
    
    return {"ticket_id": ticket_id, "timeline": timeline}

# ============ Enhanced Customer History ============

@router.get("/customer/{identifier}/full-history")
async def get_customer_full_history(identifier: str):
    """Get comprehensive customer history including tickets, orders, bookings"""
    db = get_db()
    
    # Find all tickets for this customer
    tickets = await db.tickets.find({
        "$or": [
            {"member.email": identifier},
            {"member.phone": identifier},
            {"customer_email": identifier},
            {"customer_phone": identifier}
        ]
    }).sort("created_at", -1).to_list(50)
    
    # Find orders
    orders = await db.orders.find({
        "$or": [
            {"email": identifier},
            {"phone": identifier},
            {"customer_email": identifier}
        ]
    }).sort("created_at", -1).to_list(20)
    
    # Find Stay bookings
    stay_bookings = await db.stay_bookings.find({
        "$or": [
            {"guest_email": identifier},
            {"guest_phone": identifier}
        ]
    }).sort("created_at", -1).to_list(20)
    
    # Find Dine reservations
    dine_reservations = await db.dine_reservations.find({
        "$or": [
            {"customer_email": identifier},
            {"customer_phone": identifier}
        ]
    }).sort("created_at", -1).to_list(20)
    
    # Calculate stats
    total_tickets = len(tickets)
    resolved_tickets = len([t for t in tickets if t.get("status") in ["resolved", "closed"]])
    total_orders = len(orders)
    total_bookings = len(stay_bookings) + len(dine_reservations)
    
    # Get satisfaction ratings
    ratings = [t.get("satisfaction", {}).get("rating") for t in tickets if t.get("satisfaction")]
    avg_satisfaction = sum(ratings) / len(ratings) if ratings else None
    
    # Serialize tickets
    serialized_tickets = []
    for t in tickets:
        serialized_tickets.append({
            "ticket_id": t.get("ticket_id"),
            "category": t.get("category"),
            "status": t.get("status"),
            "urgency": t.get("urgency"),
            "created_at": t.get("created_at"),
            "resolved_at": t.get("resolved_at"),
            "description": t.get("description", "")[:200],
            "satisfaction": t.get("satisfaction")
        })
    
    return {
        "identifier": identifier,
        "stats": {
            "total_tickets": total_tickets,
            "resolved_tickets": resolved_tickets,
            "open_tickets": total_tickets - resolved_tickets,
            "total_orders": total_orders,
            "total_bookings": total_bookings,
            "avg_satisfaction": round(avg_satisfaction, 1) if avg_satisfaction else None
        },
        "tickets": serialized_tickets,
        "orders": [{
            "id": o.get("id") or o.get("order_id"),
            "total": o.get("total") or o.get("total_amount"),
            "status": o.get("status"),
            "created_at": o.get("created_at")
        } for o in orders],
        "stay_bookings": [{
            "id": b.get("id") or b.get("booking_id"),
            "property": b.get("property_name"),
            "check_in": b.get("check_in_date"),
            "status": b.get("status"),
            "created_at": b.get("created_at")
        } for b in stay_bookings],
        "dine_reservations": [{
            "id": r.get("id") or r.get("reservation_id"),
            "restaurant": r.get("restaurant_name"),
            "date": r.get("reservation_date"),
            "status": r.get("status"),
            "created_at": r.get("created_at")
        } for r in dine_reservations]
    }
