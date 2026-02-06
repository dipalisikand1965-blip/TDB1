"""
Universal Ticketing System / Service Desk
Handles all concierge requests across multiple channels
"""

from fastapi import APIRouter, HTTPException, Query, Form, UploadFile, File, Depends, Header, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import os
import secrets
import asyncio
import jwt
import logging
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets", tags=["tickets"], redirect_slashes=False)

# Security - Bearer Token only (no HTTP Basic to avoid browser popup)
security_bearer = HTTPBearer(auto_error=False)

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Admin credentials verification - Bearer Token only
async def verify_token(
    bearer_creds: HTTPAuthorizationCredentials = Depends(security_bearer)
):
    """Verify admin credentials for ticket operations - Bearer Token from JWT login"""
    from server import ADMIN_USERNAME, ADMIN_PASSWORD, _admin_credentials_cache, SECRET_KEY, ALGORITHM
    
    # Check Bearer Token (from JWT login)
    if bearer_creds and bearer_creds.credentials:
        try:
            payload = jwt.decode(bearer_creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            role = payload.get("role")
            if username and role == "admin":
                return username
        except jwt.PyJWTError:
            pass
    
    # No valid token - return None but don't require auth for all endpoints
    return None

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
BUSINESS_EMAIL = os.environ.get("REACT_APP_BUSINESS_EMAIL", "woof@thedoggycompany.in")

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

class AttachmentInfo(BaseModel):
    filename: str
    file_url: str
    type: str = "document"
    size: Optional[int] = None

class TicketReply(BaseModel):
    message: str
    is_internal: bool = False
    channel: Optional[str] = None
    attachments: Optional[List[AttachmentInfo]] = []

class MemberNote(BaseModel):
    note: str
    category: str = "general"

class TicketReminder(BaseModel):
    title: str
    description: Optional[str] = None
    due_at: str  # ISO datetime string
    reminder_type: str = "follow_up"  # follow_up, call_back, task, deadline
    priority: str = "medium"  # low, medium, high

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
    """Convert MongoDB ticket to JSON-serializable format with SLA status"""
    if not ticket:
        return None
    # Handle _id conversion
    if "_id" in ticket:
        ticket.pop("_id")
    # Ensure ticket_id exists (some old tickets may have 'id' instead)
    if not ticket.get("ticket_id") and ticket.get("id"):
        ticket["ticket_id"] = ticket["id"]
    # Ensure messages is always an array
    if ticket.get("messages") is None:
        ticket["messages"] = []
    # Add reply_count for frontend display
    ticket["reply_count"] = len(ticket.get("messages", []))
    # Ensure member is always an object with proper name fallback
    if ticket.get("member") is None:
        ticket["member"] = {
            "name": ticket.get("customer_name") or "Unknown",
            "email": ticket.get("customer_email"),
            "phone": ticket.get("customer_phone"),
        }
    else:
        # Fix: If member exists but has generic name, try to get from customer_name
        member = ticket.get("member", {})
        if member.get("name") in [None, "", "Website Visitor", "Unknown"]:
            if ticket.get("customer_name"):
                ticket["member"]["name"] = ticket.get("customer_name")
            elif ticket.get("customer_email"):
                # Use email prefix as fallback name
                email = ticket.get("customer_email")
                ticket["member"]["name"] = email.split("@")[0].title()
        # Also update email/phone if missing in member but present at root
        if not member.get("email") and ticket.get("customer_email"):
            ticket["member"]["email"] = ticket.get("customer_email")
        if not member.get("phone") and ticket.get("customer_phone"):
            ticket["member"]["phone"] = ticket.get("customer_phone")
    
    # Calculate SLA status if sla_due_at exists
    if ticket.get("sla_due_at"):
        try:
            now = datetime.now(timezone.utc)
            sla_due = datetime.fromisoformat(ticket["sla_due_at"].replace("Z", "+00:00"))
            time_remaining = sla_due - now
            
            ticket["sla_status"] = {
                "due_at": ticket["sla_due_at"],
                "is_breached": time_remaining.total_seconds() < 0,
                "seconds_remaining": int(time_remaining.total_seconds()),
                "hours_remaining": round(time_remaining.total_seconds() / 3600, 1),
                "status": "breached" if time_remaining.total_seconds() < 0 else (
                    "critical" if time_remaining.total_seconds() < 3600 else (
                        "warning" if time_remaining.total_seconds() < 7200 else "ok"
                    )
                )
            }
        except Exception:
            ticket["sla_status"] = None
    else:
        # Calculate SLA for tickets without sla_due_at (legacy tickets)
        urgency = ticket.get("urgency", "medium")
        sla_hours_map = {"low": 48, "medium": 24, "high": 8, "critical": 2, "urgent": 4}
        sla_hours = sla_hours_map.get(urgency, 24)
        
        if ticket.get("created_at"):
            try:
                created = datetime.fromisoformat(ticket["created_at"].replace("Z", "+00:00"))
                sla_due = created + timedelta(hours=sla_hours)
                now = datetime.now(timezone.utc)
                time_remaining = sla_due - now
                
                ticket["sla_due_at"] = sla_due.isoformat()
                ticket["sla_status"] = {
                    "due_at": sla_due.isoformat(),
                    "is_breached": time_remaining.total_seconds() < 0,
                    "seconds_remaining": int(time_remaining.total_seconds()),
                    "hours_remaining": round(time_remaining.total_seconds() / 3600, 1),
                    "status": "breached" if time_remaining.total_seconds() < 0 else (
                        "critical" if time_remaining.total_seconds() < 3600 else (
                            "warning" if time_remaining.total_seconds() < 7200 else "ok"
                        )
                    )
                }
            except Exception:
                ticket["sla_status"] = None
    
    # Count pending reminders
    reminders = ticket.get("reminders", [])
    pending_reminders = [r for r in reminders if r.get("status") != "completed"]
    ticket["pending_reminders_count"] = len(pending_reminders)
    
    return ticket

# ============== TICKET ROUTES ==============

@router.get("/categories")
async def get_categories():
    """Get all ticket categories (pillars) including custom ones"""
    db = get_db()
    
    # Default pillars with is_default flag
    default_categories = []
    for cat in TICKET_CATEGORIES:
        default_categories.append({**cat, "is_default": True})
    
    # Get custom categories from service_desk_settings (unified storage)
    settings = await db.service_desk_settings.find_one({"type": "categories"})
    custom_cats = settings.get("categories", []) if settings else []
    
    # Also check legacy ticket_categories collection
    cursor = db.ticket_categories.find({})
    legacy_cats = await cursor.to_list(length=100)
    for cat in legacy_cats:
        cat["id"] = cat.get("id") or str(cat.pop("_id"))
        if "_id" in cat:
            del cat["_id"]
        cat["isCustom"] = True
        cat["is_default"] = False
        custom_cats.append(cat)
    
    return {"categories": default_categories + custom_cats}

@router.post("/categories")
async def add_custom_category_new(data: Dict[str, Any]):
    """Add a custom ticket category/pillar"""
    db = get_db()
    
    category_id = data.get("id", "").lower().replace(" ", "_")
    name = data.get("name", "")
    emoji = data.get("emoji", "📁")
    
    if not category_id or not name:
        raise HTTPException(status_code=400, detail="id and name are required")
    
    await db.service_desk_settings.update_one(
        {"type": "categories"},
        {"$addToSet": {"categories": {"id": category_id, "name": name, "emoji": emoji, "is_default": False}}},
        upsert=True
    )
    
    return {"success": True, "category_id": category_id}

@router.post("/categories/custom")
async def add_custom_category(category: Dict[str, Any]):
    """Add a custom category (legacy endpoint)"""
    db = get_db()
    
    category_doc = {
        "id": category.get("id"),
        "name": category.get("name"),
        "icon": category.get("icon", "📁"),
        "emoji": category.get("emoji", category.get("icon", "📁")),
        "description": category.get("description", ""),
        "isCustom": True,
        "is_default": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ticket_categories.insert_one(category_doc)
    
    return {"success": True, "category": category_doc}

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a custom category"""
    db = get_db()
    
    # Don't allow deleting default categories
    default_ids = [c["id"] for c in TICKET_CATEGORIES]
    if category_id in default_ids:
        raise HTTPException(status_code=400, detail="Cannot delete default category")
    
    # Try to delete from service_desk_settings
    await db.service_desk_settings.update_one(
        {"type": "categories"},
        {"$pull": {"categories": {"id": category_id}}}
    )
    
    # Also try legacy collection
    await db.ticket_categories.delete_one({"id": category_id})
    
    return {"success": True}

@router.delete("/categories/custom/{category_id}")
async def delete_custom_category_legacy(category_id: str):
    """Delete a custom category (legacy endpoint)"""
    return await delete_category(category_id)

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
    """Get all ticket statuses including custom ones"""
    db = get_db()
    
    # Default statuses with is_default flag
    default_statuses = []
    for status in TICKET_STATUSES:
        default_statuses.append({**status, "label": status.get("name", status.get("label")), "is_default": True})
    
    # Get custom statuses from service_desk_settings
    settings = await db.service_desk_settings.find_one({"type": "statuses"})
    custom_statuses = settings.get("statuses", []) if settings else []
    
    return {"statuses": default_statuses + custom_statuses}

@router.post("/statuses")
async def add_custom_status(data: Dict[str, Any]):
    """Add a custom ticket status"""
    db = get_db()
    
    status_id = data.get("id", "").lower().replace(" ", "_")
    label = data.get("label", data.get("name", ""))
    color = data.get("color", "gray")
    
    if not status_id or not label:
        raise HTTPException(status_code=400, detail="id and label are required")
    
    # Add to custom statuses in service_desk_settings
    await db.service_desk_settings.update_one(
        {"type": "statuses"},
        {"$addToSet": {"statuses": {"id": status_id, "label": label, "name": label, "color": color, "is_default": False}}},
        upsert=True
    )
    
    return {"success": True, "status_id": status_id}

@router.delete("/statuses/{status_id}")
async def delete_custom_status(status_id: str):
    """Delete a custom ticket status"""
    db = get_db()
    
    # Don't allow deleting default statuses
    default_ids = [s["id"] for s in TICKET_STATUSES]
    if status_id in default_ids:
        raise HTTPException(status_code=400, detail="Cannot delete default status")
    
    await db.service_desk_settings.update_one(
        {"type": "statuses"},
        {"$pull": {"statuses": {"id": status_id}}}
    )
    
    return {"success": True}

@router.get("/urgency-levels")
async def get_urgency_levels():
    """Get all urgency levels"""
    return {"urgency_levels": URGENCY_LEVELS}

def calculate_sla_due_at(urgency: str) -> str:
    """Calculate SLA due datetime based on urgency level"""
    from datetime import timedelta
    sla_hours_map = {"low": 48, "medium": 24, "high": 8, "critical": 2, "urgent": 4}
    hours = sla_hours_map.get(urgency, 24)
    due_at = datetime.now(timezone.utc) + timedelta(hours=hours)
    return due_at.isoformat()

@router.post("/")
async def create_ticket(ticket: TicketCreate):
    """Create a new ticket with SLA tracking"""
    db = get_db()
    
    ticket_id = await generate_ticket_id()
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate SLA due time based on urgency
    sla_due_at = calculate_sla_due_at(ticket.urgency)
    
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
        "reminders": [],  # NEW: Reminder/task list
        "sla_due_at": sla_due_at,  # NEW: SLA deadline
        "sla_breached": False,  # NEW: SLA breach flag
        "created_at": now,
        "updated_at": now,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
    }
    
    result = await db.tickets.insert_one(ticket_doc)
    ticket_doc["id"] = str(result.inserted_id)
    del ticket_doc["_id"]
    
    # Smart Auto-Assignment based on category/pillar expertise
    await smart_auto_assign(db, ticket_doc)
    
    # Send auto-acknowledge email to customer
    await send_ticket_notification(ticket_doc, "created")
    
    return {"success": True, "ticket": ticket_doc}


async def smart_auto_assign(db, ticket: dict) -> Optional[str]:
    """
    Smart Auto-Assignment based on agent expertise and availability.
    
    Factors considered:
    1. Agent's pillar/category expertise
    2. Current workload (active tickets)
    3. Agent availability status
    4. Round-robin among qualified agents
    
    Returns the assigned agent name or None
    """
    try:
        category = ticket.get("category") or ticket.get("pillar")
        if not category:
            return None
        
        # Check if auto-assignment is enabled
        settings = await db.service_desk_settings.find_one({"type": "auto_assignment"})
        if not settings or not settings.get("enabled", False):
            return None
        
        # Get agents with expertise in this category
        expertise_map = settings.get("expertise_map", {})
        qualified_agents = expertise_map.get(category, [])
        
        if not qualified_agents:
            # Fallback to any available agent
            all_agents = settings.get("all_agents", [])
            qualified_agents = all_agents
        
        if not qualified_agents:
            return None
        
        # Get current workload for each agent
        agent_workloads = {}
        for agent in qualified_agents:
            count = await db.tickets.count_documents({
                "assigned_to": agent,
                "status": {"$nin": ["resolved", "closed"]}
            })
            agent_workloads[agent] = count
        
        # Find agent with lowest workload
        assigned_agent = min(agent_workloads, key=agent_workloads.get)
        
        # Update ticket with assignment
        await db.tickets.update_one(
            {"ticket_id": ticket["ticket_id"]},
            {
                "$set": {
                    "assigned_to": assigned_agent,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                },
                "$push": {
                    "messages": {
                        "id": str(uuid.uuid4()),
                        "type": "system",
                        "content": f"Auto-assigned to {assigned_agent} based on {category} expertise",
                        "sender": "system",
                        "sender_name": "System",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "is_internal": True
                    }
                }
            }
        )
        
        logger.info(f"Ticket {ticket['ticket_id']} auto-assigned to {assigned_agent} (category: {category})")
        return assigned_agent
        
    except Exception as e:
        logger.error(f"Smart auto-assignment failed: {e}")
        return None

@router.get("")
@router.get("/")
async def list_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    member_email: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    sort_by: str = "updated_at",
    sort_order: str = "desc"
):
    """List tickets with filters - reads from both tickets and service_desk_tickets collections. Sorted by updated_at (most recent activity) by default."""
    db = get_db()
    
    query = {}
    
    if status:
        if status == "open":
            query["status"] = {"$nin": ["resolved", "closed"]}
        else:
            query["status"] = status
    
    if category:
        query["$or"] = [{"category": category}, {"pillar": category}]
    
    if urgency:
        query["$or"] = query.get("$or", []) if "$or" not in query else query["$or"]
        if "$or" not in query:
            query["urgency"] = urgency
    
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    if source:
        query["source"] = source
    
    if member_email:
        query["member.email"] = member_email
    
    if search:
        search_conditions = [
            {"ticket_id": {"$regex": search, "$options": "i"}},
            {"member.name": {"$regex": search, "$options": "i"}},
            {"member.email": {"$regex": search, "$options": "i"}},
            {"member.phone": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"subject": {"$regex": search, "$options": "i"}},
        ]
        if "$or" in query:
            # Combine with existing $or conditions
            query = {"$and": [query, {"$or": search_conditions}]}
        else:
            query["$or"] = search_conditions
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    # Fetch from BOTH collections and merge
    all_tickets = []
    
    # Fetch more from each collection to ensure we get all recent tickets
    fetch_limit = max(limit * 3, 100)
    
    # 1. From tickets collection (legacy)
    try:
        cursor1 = db.tickets.find(query).sort(sort_by, sort_direction).skip(offset).limit(fetch_limit)
        tickets1 = await cursor1.to_list(length=fetch_limit)
        for t in tickets1:
            t["source_collection"] = "tickets"
        all_tickets.extend(tickets1)
    except Exception as e:
        logger.warning(f"Error fetching from tickets collection: {e}")
    
    # 2. From service_desk_tickets collection (new auto-created tickets)
    # Skip tickets without valid ticket_ids (conversational_entry noise)
    try:
        sdt_query = {**query, "ticket_id": {"$exists": True, "$ne": None, "$nin": ["", None]}}
        cursor2 = db.service_desk_tickets.find(sdt_query).sort(sort_by, sort_direction).skip(offset).limit(fetch_limit)
        tickets2 = await cursor2.to_list(length=fetch_limit)
        
        for t in tickets2:
            t["source_collection"] = "service_desk_tickets"
        
        # Add only if not duplicate (by ticket_id)
        existing_ids = {t.get("ticket_id") for t in all_tickets}
        for t in tickets2:
            if t.get("ticket_id") and t.get("ticket_id") not in existing_ids:
                all_tickets.append(t)
    except Exception as e:
        logger.warning(f"Error fetching from service_desk_tickets collection: {e}")
    
    # Sort combined results - handle datetime vs string comparison properly
    def get_sort_key(x):
        val = x.get(sort_by, "")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc) if sort_order == "desc" else datetime.max.replace(tzinfo=timezone.utc)
        if isinstance(val, datetime):
            if val.tzinfo is None:
                val = val.replace(tzinfo=timezone.utc)
            return val
        if isinstance(val, str):
            try:
                from dateutil.parser import parse
                parsed = parse(val)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed
            except:
                return datetime.min.replace(tzinfo=timezone.utc) if sort_order == "desc" else datetime.max.replace(tzinfo=timezone.utc)
        return datetime.min.replace(tzinfo=timezone.utc) if sort_order == "desc" else datetime.max.replace(tzinfo=timezone.utc)
    
    all_tickets.sort(key=get_sort_key, reverse=(sort_order == "desc"))
    
    # Apply limit
    all_tickets = all_tickets[:limit]
    
    # Get total count from both collections
    total1 = await db.tickets.count_documents(query) if query else 0
    total2 = await db.service_desk_tickets.count_documents(query) if query else 0
    total = total1 + total2
    
    return {
        "tickets": [serialize_ticket(t) for t in all_tickets],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/member/{member_email}/all")
async def get_member_all_tickets(
    member_email: str,
    limit: int = Query(50, le=200)
):
    """
    Get ALL tickets for a member from all sources:
    - tickets collection (Service Desk)
    - service_desk_tickets collection (Mira AI concierge actions)
    """
    db = get_db()
    all_tickets = []
    
    # 1. Get from tickets collection (old tickets)
    query1 = {"member.email": member_email}
    cursor1 = db.tickets.find(query1).sort("created_at", -1).limit(limit)
    old_tickets = await cursor1.to_list(length=limit)
    for t in old_tickets:
        serialized = serialize_ticket(t)
        if serialized:
            serialized["source_collection"] = "tickets"
            all_tickets.append(serialized)
    
    # 2. Get from service_desk_tickets collection (Mira concierge actions)
    query2 = {"member.email": member_email}
    cursor2 = db.service_desk_tickets.find(query2, {"_id": 0}).sort("created_at", -1).limit(limit)
    mira_tickets = await cursor2.to_list(length=limit)
    for t in mira_tickets:
        t["source_collection"] = "service_desk_tickets"
        all_tickets.append(t)
    
    # 3. Get from mira_tickets if they have service desk references
    query3 = {"member_email": member_email, "requires_concierge_action": True}
    cursor3 = db.mira_tickets.find(query3, {"_id": 0}).sort("created_at", -1).limit(limit)
    mira_conv_tickets = await cursor3.to_list(length=limit)
    for t in mira_conv_tickets:
        # Only add if not already present from service_desk_tickets
        if t.get("service_desk_ticket_id"):
            if not any(x.get("ticket_id") == t.get("service_desk_ticket_id") for x in all_tickets):
                t["source_collection"] = "mira_tickets"
                all_tickets.append(t)
    
    # Sort combined by created_at - handle datetime vs string
    def sort_by_created(x):
        val = x.get("created_at", "")
        if val is None:
            return ""
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val)
    
    all_tickets.sort(key=sort_by_created, reverse=True)
    
    return {
        "tickets": all_tickets[:limit],
        "total": len(all_tickets),
        "member_email": member_email
    }

@router.get("/stats")
async def get_ticket_stats():
    """Get ticket statistics for dashboard - includes both tickets and service_desk_tickets"""
    db = get_db()
    
    # Helper to count from both collections
    async def count_both(query):
        count1 = await db.tickets.count_documents(query)
        count2 = await db.service_desk_tickets.count_documents(query)
        return count1 + count2
    
    # Count by status
    status_counts = {}
    for status in TICKET_STATUSES:
        count = await count_both({"status": status["id"]})
        status_counts[status["id"]] = count
    
    # Count open tickets
    open_count = await count_both({"status": {"$nin": ["resolved", "closed"]}})
    
    # Count by category (also check pillar field for service_desk_tickets)
    category_counts = {}
    for cat in TICKET_CATEGORIES:
        count1 = await db.tickets.count_documents({"category": cat["id"]})
        count2 = await db.service_desk_tickets.count_documents({"$or": [{"category": cat["id"]}, {"pillar": cat["id"]}]})
        category_counts[cat["id"]] = count1 + count2
    
    # Count by urgency (open tickets only)
    urgency_counts = {}
    for urg in URGENCY_LEVELS:
        query = {"urgency": urg["id"], "status": {"$nin": ["resolved", "closed"]}}
        count = await count_both(query)
        urgency_counts[urg["id"]] = count
    
    # Tickets by concierge - aggregate from both collections
    pipeline = [
        {"$match": {"assigned_to": {"$ne": None}}},
        {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cursor1 = db.tickets.aggregate(pipeline)
    cursor2 = db.service_desk_tickets.aggregate(pipeline)
    
    assignees1 = await cursor1.to_list(length=100)
    assignees2 = await cursor2.to_list(length=100)
    
    # Merge assignee counts
    assignee_map = {}
    for a in assignees1 + assignees2:
        if a["_id"]:
            assignee_map[a["_id"]] = assignee_map.get(a["_id"], 0) + a["count"]
    
    tickets_by_assignee = [{"_id": k, "count": v} for k, v in sorted(assignee_map.items(), key=lambda x: -x[1])]
    
    # Recent tickets (last 24 hours)
    from datetime import timedelta
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_count = await count_both({"created_at": {"$gte": yesterday}})
    
    # Overdue tickets
    now = datetime.now(timezone.utc).isoformat()
    overdue_count = await count_both({
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

# ============ Canned Responses / Templates ============
# NOTE: These routes MUST be defined BEFORE /{ticket_id} to avoid route conflicts

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


# ==================== TEMPLATES (must be before /{ticket_id}) ====================

class TemplateCreate(BaseModel):
    name: str
    type: str = "email"  # email or sms
    subject: Optional[str] = None
    content: str
    trigger: str = "manual"  # manual, new_ticket, status_change
    trigger_status: Optional[str] = None

@router.get("/templates")
async def get_templates():
    """Get all ticket response templates"""
    db = get_db()
    
    templates = await db.ticket_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@router.post("/templates")
async def create_template(template: TemplateCreate):
    """Create a new response template"""
    db = get_db()
    
    template_doc = {
        "id": f"tpl-{uuid.uuid4().hex[:8]}",
        **template.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ticket_templates.insert_one(template_doc)
    
    return {"success": True, "template": {k: v for k, v in template_doc.items() if k != "_id"}}

@router.put("/templates/{template_id}")
async def update_template(template_id: str, template: TemplateCreate):
    """Update a response template"""
    db = get_db()
    
    result = await db.ticket_templates.update_one(
        {"id": template_id},
        {"$set": {
            **template.dict(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"success": True}

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a response template"""
    db = get_db()
    
    result = await db.ticket_templates.delete_one({"id": template_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"success": True}


# ==================== BULK ACTIONS (must be before /{ticket_id}) ====================

class BulkStatusRequest(BaseModel):
    ticket_ids: List[str]
    status: str

class BulkAssignRequest(BaseModel):
    ticket_ids: List[str]
    agent_id: str

@router.post("/bulk/status")
async def bulk_update_status(request: BulkStatusRequest):
    """Bulk update status for multiple tickets"""
    db = get_db()
    
    results = {"updated": 0, "failed": 0}
    now = datetime.now(timezone.utc).isoformat()
    
    for ticket_id in request.ticket_ids:
        try:
            result = await db.tickets.update_one(
                {"ticket_id": ticket_id},
                {"$set": {"status": request.status, "updated_at": now}}
            )
            if result.matched_count == 0:
                result = await db.service_desk_tickets.update_one(
                    {"ticket_id": ticket_id},
                    {"$set": {"status": request.status, "updated_at": now}}
                )
            
            if result.modified_count > 0:
                results["updated"] += 1
            else:
                results["failed"] += 1
        except Exception as e:
            logger.error(f"Bulk status update error for {ticket_id}: {e}")
            results["failed"] += 1
    
    return {"success": True, **results}

@router.post("/bulk/assign")
async def bulk_assign_tickets(request: BulkAssignRequest):
    """Bulk assign multiple tickets to an agent"""
    db = get_db()
    
    results = {"updated": 0, "failed": 0}
    now = datetime.now(timezone.utc).isoformat()
    
    for ticket_id in request.ticket_ids:
        try:
            result = await db.tickets.update_one(
                {"ticket_id": ticket_id},
                {"$set": {"assigned_to": request.agent_id, "updated_at": now}}
            )
            if result.matched_count == 0:
                result = await db.service_desk_tickets.update_one(
                    {"ticket_id": ticket_id},
                    {"$set": {"assigned_to": request.agent_id, "updated_at": now}}
                )
            
            if result.modified_count > 0:
                results["updated"] += 1
            else:
                results["failed"] += 1
        except Exception as e:
            logger.error(f"Bulk assign error for {ticket_id}: {e}")
            results["failed"] += 1
    
    return {"success": True, **results}


# ==================== AUTOMATION SETTINGS ====================

@router.get("/settings/automation")
async def get_automation_settings():
    """Get automation settings for tickets"""
    db = get_db()
    
    settings = await db.ticket_settings.find_one({"type": "automation"}, {"_id": 0})
    
    if not settings:
        settings = {
            "type": "automation",
            "auto_acknowledge": True,
            "auto_acknowledge_template": "",
            "status_triggers": {}
        }
    
    return settings

@router.post("/settings/automation")
async def save_automation_settings(settings: dict):
    """Save automation settings for tickets"""
    db = get_db()
    
    await db.ticket_settings.update_one(
        {"type": "automation"},
        {"$set": {**settings, "type": "automation", "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True}


# ==================== AGENT COLLISION DETECTION ====================

@router.post("/{ticket_id}/viewing")
async def report_ticket_viewing(ticket_id: str, data: dict = Body(...)):
    """Report that an agent is viewing a ticket"""
    db = get_db()
    
    agent = data.get('agent', 'Unknown')
    now = datetime.now(timezone.utc)
    
    # Update or insert the viewing record
    await db.ticket_viewers.update_one(
        {"ticket_id": ticket_id, "agent": agent},
        {"$set": {"last_seen": now.isoformat()}},
        upsert=True
    )
    
    return {"success": True}

@router.get("/{ticket_id}/viewers")
async def get_ticket_viewers(ticket_id: str):
    """Get list of agents currently viewing a ticket"""
    db = get_db()
    
    # Get viewers who were active in the last 60 seconds
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
    
    viewers = await db.ticket_viewers.find(
        {"ticket_id": ticket_id, "last_seen": {"$gte": cutoff}},
        {"_id": 0, "agent": 1}
    ).to_list(10)
    
    return {"viewers": [v["agent"] for v in viewers]}


# ==================== SMART AUTO-ASSIGNMENT SETTINGS ====================

class AutoAssignmentSettings(BaseModel):
    """Settings for smart auto-assignment"""
    enabled: bool = False
    expertise_map: Dict[str, List[str]] = {}  # category -> list of agent names
    all_agents: List[str] = []  # fallback list of all agents


@router.get("/settings/auto-assignment")
async def get_auto_assignment_settings():
    """Get auto-assignment configuration"""
    db = get_db()
    
    settings = await db.service_desk_settings.find_one({"type": "auto_assignment"})
    
    if not settings:
        # Return default settings with pillar names
        return {
            "enabled": False,
            "expertise_map": {
                "celebrate": [],
                "dine": [],
                "stay": [],
                "travel": [],
                "care": [],
                "enjoy": [],
                "fit": [],
                "learn": [],
                "paperwork": [],
                "advisory": [],
                "emergency": [],
                "farewell": [],
                "adopt": [],
                "shop": []
            },
            "all_agents": []
        }
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.post("/settings/auto-assignment")
async def update_auto_assignment_settings(settings: AutoAssignmentSettings):
    """Update auto-assignment configuration"""
    db = get_db()
    
    settings_doc = settings.dict()
    settings_doc["type"] = "auto_assignment"
    settings_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.service_desk_settings.update_one(
        {"type": "auto_assignment"},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"success": True, "message": "Auto-assignment settings updated"}


@router.post("/settings/auto-assignment/agent")
async def add_agent_expertise(agent_name: str = Body(...), pillars: List[str] = Body(...)):
    """Add or update an agent's pillar expertise"""
    db = get_db()
    
    # Get current settings
    settings = await db.service_desk_settings.find_one({"type": "auto_assignment"})
    
    if not settings:
        settings = {
            "type": "auto_assignment",
            "enabled": True,
            "expertise_map": {},
            "all_agents": []
        }
    
    expertise_map = settings.get("expertise_map", {})
    all_agents = settings.get("all_agents", [])
    
    # Add agent to all_agents if not present
    if agent_name not in all_agents:
        all_agents.append(agent_name)
    
    # Add agent to each pillar's expertise list
    for pillar in pillars:
        if pillar not in expertise_map:
            expertise_map[pillar] = []
        if agent_name not in expertise_map[pillar]:
            expertise_map[pillar].append(agent_name)
    
    # Update settings
    await db.service_desk_settings.update_one(
        {"type": "auto_assignment"},
        {
            "$set": {
                "expertise_map": expertise_map,
                "all_agents": all_agents,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "agent": agent_name,
        "pillars": pillars,
        "message": f"Agent {agent_name} added with expertise in {', '.join(pillars)}"
    }


# ==================== SLA BREACH ALERTS ====================

class SLAAlertSettings(BaseModel):
    """Settings for SLA breach alerts"""
    enabled: bool = True
    warning_threshold_minutes: int = 60  # Alert when X minutes before breach
    breach_escalation: bool = True  # Auto-escalate on breach
    notification_channels: List[str] = ["email", "browser"]  # email, browser, whatsapp


@router.get("/settings/sla-alerts")
async def get_sla_alert_settings():
    """Get SLA alert configuration"""
    db = get_db()
    
    settings = await db.service_desk_settings.find_one({"type": "sla_alerts"})
    
    if not settings:
        return {
            "enabled": True,
            "warning_threshold_minutes": 60,
            "breach_escalation": True,
            "notification_channels": ["email", "browser"]
        }
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@router.post("/settings/sla-alerts")
async def update_sla_alert_settings(settings: SLAAlertSettings):
    """Update SLA alert configuration"""
    db = get_db()
    
    settings_doc = settings.dict()
    settings_doc["type"] = "sla_alerts"
    settings_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.service_desk_settings.update_one(
        {"type": "sla_alerts"},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"success": True, "message": "SLA alert settings updated"}


@router.get("/sla-at-risk")
async def get_sla_at_risk_tickets():
    """
    Get tickets that are at risk of SLA breach.
    Returns tickets within warning threshold of their SLA deadline.
    """
    db = get_db()
    
    # Get SLA settings
    settings = await db.service_desk_settings.find_one({"type": "sla_alerts"})
    warning_minutes = settings.get("warning_threshold_minutes", 60) if settings else 60
    
    now = datetime.now(timezone.utc)
    warning_time = now + timedelta(minutes=warning_minutes)
    
    # Find open tickets with SLA due within warning threshold
    cursor = db.tickets.find({
        "status": {"$nin": ["resolved", "closed"]},
        "sla_due_at": {
            "$ne": None,
            "$lte": warning_time.isoformat()
        },
        "sla_breached": {"$ne": True}
    }).sort("sla_due_at", 1)
    
    at_risk_tickets = await cursor.to_list(length=50)
    
    result = []
    for ticket in at_risk_tickets:
        ticket.pop("_id", None)
        
        # Calculate time remaining
        if ticket.get("sla_due_at"):
            try:
                due_at = datetime.fromisoformat(ticket["sla_due_at"].replace("Z", "+00:00"))
                remaining = due_at - now
                ticket["minutes_remaining"] = int(remaining.total_seconds() / 60)
                ticket["is_breached"] = remaining.total_seconds() <= 0
            except:
                ticket["minutes_remaining"] = None
                ticket["is_breached"] = False
        
        result.append(ticket)
    
    return {
        "at_risk_count": len(result),
        "tickets": result
    }


@router.post("/check-sla-breaches")
async def check_and_handle_sla_breaches():
    """
    Check for SLA breaches and handle them according to settings.
    This can be called by a scheduler or manually.
    """
    db = get_db()
    
    now = datetime.now(timezone.utc)
    
    # Find breached tickets
    cursor = db.tickets.find({
        "status": {"$nin": ["resolved", "closed"]},
        "sla_due_at": {
            "$ne": None,
            "$lt": now.isoformat()
        },
        "sla_breached": {"$ne": True}
    })
    
    breached_tickets = await cursor.to_list(length=100)
    
    # Get SLA settings
    settings = await db.service_desk_settings.find_one({"type": "sla_alerts"})
    should_escalate = settings.get("breach_escalation", True) if settings else True
    
    breached_count = 0
    escalated_count = 0
    
    for ticket in breached_tickets:
        ticket_id = ticket.get("ticket_id")
        
        # Mark as breached
        update_doc = {
            "$set": {
                "sla_breached": True,
                "sla_breached_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            "$push": {
                "messages": {
                    "id": str(uuid.uuid4()),
                    "type": "system",
                    "content": "⚠️ SLA BREACH: This ticket has exceeded its SLA deadline",
                    "sender": "system",
                    "sender_name": "SLA Monitor",
                    "timestamp": now.isoformat(),
                    "is_internal": True
                }
            }
        }
        
        # Auto-escalate if enabled
        if should_escalate and ticket.get("urgency") != "critical":
            update_doc["$set"]["urgency"] = "critical"
            update_doc["$set"]["status"] = "escalated"
            escalated_count += 1
        
        await db.tickets.update_one({"ticket_id": ticket_id}, update_doc)
        breached_count += 1
        
        logger.warning(f"SLA breach detected: {ticket_id}")
    
    return {
        "checked_at": now.isoformat(),
        "breached_count": breached_count,
        "escalated_count": escalated_count,
        "message": f"Found {breached_count} SLA breaches, escalated {escalated_count}"
    }


# ==================== CUSTOMER SATISFACTION (CSAT) ====================

class CSATRequest(BaseModel):
    rating: int  # 1-5
    feedback: Optional[str] = None

@router.post("/{ticket_id}/csat")
async def submit_csat(ticket_id: str, data: CSATRequest):
    """Submit customer satisfaction rating for a ticket"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    csat_record = {
        "ticket_id": ticket_id,
        "rating": data.rating,
        "feedback": data.feedback,
        "created_at": now
    }
    
    # Store CSAT record
    await db.ticket_csat.insert_one(csat_record)
    
    # Update ticket with CSAT score
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"csat_rating": data.rating, "csat_feedback": data.feedback, "csat_at": now}}
    )
    
    return {"success": True, "rating": data.rating}

@router.get("/analytics/csat")
async def get_csat_analytics():
    """Get CSAT analytics summary"""
    db = get_db()
    
    # Get all CSAT records
    pipeline = [
        {"$group": {
            "_id": None,
            "total_responses": {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
            "ratings": {"$push": "$rating"}
        }}
    ]
    
    result = await db.ticket_csat.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "total_responses": 0,
            "avg_rating": 0,
            "nps_score": 0,
            "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        }
    
    data = result[0]
    ratings = data.get("ratings", [])
    
    # Calculate distribution
    distribution = {str(i): ratings.count(i) for i in range(1, 6)}
    
    # Calculate NPS-style score (promoters - detractors)
    promoters = sum(1 for r in ratings if r >= 4)
    detractors = sum(1 for r in ratings if r <= 2)
    nps_score = ((promoters - detractors) / len(ratings) * 100) if ratings else 0
    
    return {
        "total_responses": data.get("total_responses", 0),
        "avg_rating": round(data.get("avg_rating", 0), 2),
        "nps_score": round(nps_score, 1),
        "distribution": distribution
    }


# ============== ANALYTICS ENDPOINT (must be before /{ticket_id}) ==============

@router.get("/analytics")
async def get_ticket_analytics():
    """Get analytics summary for service desk dashboard"""
    db = get_db()
    from datetime import timedelta
    
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Count from both collections
        async def count_both(query):
            count1 = await db.tickets.count_documents(query)
            count2 = await db.service_desk_tickets.count_documents(query)
            return count1 + count2
        
        # Basic counts
        total_tickets = await count_both({})
        open_tickets = await count_both({"status": {"$in": ["new", "open", "pending", "in_progress"]}})
        resolved_tickets = await count_both({"status": {"$in": ["resolved", "closed", "completed"]}})
        
        # Time-based counts
        today_tickets = await count_both({"created_at": {"$gte": today_start.isoformat()}})
        week_tickets = await count_both({"created_at": {"$gte": week_start.isoformat()}})
        
        # By category/pillar
        category_counts = {}
        categories = ["celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", "learn", "shop", "emergency"]
        for cat in categories:
            count = await count_both({"$or": [{"category": cat}, {"pillar": cat}]})
            if count > 0:
                category_counts[cat] = count
        
        # By priority
        priority_counts = {}
        for priority in ["critical", "high", "medium", "low"]:
            count = await count_both({"urgency": priority})
            if count > 0:
                priority_counts[priority] = count
        
        # Average resolution time (rough calculation)
        resolved_pipeline = [
            {"$match": {"status": "resolved", "resolved_at": {"$ne": None}, "created_at": {"$ne": None}}},
            {"$project": {
                "resolution_time": {"$subtract": [{"$toDate": "$resolved_at"}, {"$toDate": "$created_at"}]}
            }},
            {"$group": {"_id": None, "avg_time": {"$avg": "$resolution_time"}}}
        ]
        
        avg_resolution = None
        try:
            cursor = db.tickets.aggregate(resolved_pipeline)
            result = await cursor.to_list(1)
            if result and result[0].get("avg_time"):
                avg_resolution = round(result[0]["avg_time"] / (1000 * 60 * 60), 1)  # Convert to hours
        except:
            pass
        
        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_tickets": resolved_tickets,
            "today_tickets": today_tickets,
            "week_tickets": week_tickets,
            "by_category": category_counts,
            "by_priority": priority_counts,
            "avg_resolution_hours": avg_resolution,
            "resolution_rate": round((resolved_tickets / total_tickets * 100) if total_tickets > 0 else 0, 1)
        }
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return {
            "total_tickets": 0,
            "open_tickets": 0,
            "resolved_tickets": 0,
            "today_tickets": 0,
            "week_tickets": 0,
            "by_category": {},
            "by_priority": {},
            "avg_resolution_hours": None,
            "resolution_rate": 0
        }


# ============== SINGLE TICKET ROUTES ==============

@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get a single ticket by ID - searches both tickets and service_desk_tickets"""
    db = get_db()
    
    # First try tickets collection
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    # If not found, try service_desk_tickets collection
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        try:
            ticket = await db.service_desk_tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"ticket": serialize_ticket(ticket)}

@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: str, update: TicketUpdate, username: str = Depends(verify_token)):
    """Update a ticket - works with both collections"""
    db = get_db()
    
    # Try tickets collection first
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    # Try service_desk_tickets if not found
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        try:
            ticket = await db.service_desk_tickets.find_one({"_id": ObjectId(ticket_id)})
            collection = db.service_desk_tickets
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
    
    await collection.update_one(
        {"_id": ticket["_id"]},
        update_op
    )
    
    updated = await collection.find_one({"_id": ticket["_id"]})
    updated_serialized = serialize_ticket(updated)
    
    # Send email notification if resolved
    if was_resolved:
        # Need to re-fetch to get the full ticket with resolution note
        await send_ticket_notification(updated_serialized, "resolved")
    
    return {"success": True, "ticket": updated_serialized}

@router.post("/{ticket_id}/reply")
async def add_reply(ticket_id: str, reply: TicketReply):
    """Add a reply/message to a ticket - works with both collections"""
    db = get_db()
    
    # Try tickets collection first
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        except:
            pass
    
    # Try service_desk_tickets if not found
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        try:
            ticket = await db.service_desk_tickets.find_one({"_id": ObjectId(ticket_id)})
            collection = db.service_desk_tickets
        except:
            raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Build attachments list
    attachment_list = []
    if reply.attachments:
        for att in reply.attachments:
            attachment_list.append({
                "filename": att.filename,
                "file_url": att.file_url,
                "type": att.type,
                "size": att.size,
                "uploaded_at": now
            })
    
    message = {
        "id": str(uuid.uuid4()),
        "type": "internal_note" if reply.is_internal else "reply",
        "content": reply.message,
        "sender": "concierge",
        "channel": reply.channel or "internal",
        "timestamp": now,
        "is_internal": reply.is_internal,
        "attachments": attachment_list
    }
    
    update_doc = {"updated_at": now}
    
    if not ticket.get("first_response_at") and not reply.is_internal:
        update_doc["first_response_at"] = now
    
    await collection.update_one(
        {"_id": ticket["_id"]},
        {
            "$push": {"messages": message},
            "$set": update_doc
        }
    )
    
    return {"success": True, "message": message}


# ============== MESSAGING ENDPOINT ==============

class MessagingSendRequest(BaseModel):
    ticket_id: str
    message: str
    channel: str  # email, whatsapp, internal
    is_internal: bool = False

@router.post("/messaging/send")
async def send_message_via_channel(request: MessagingSendRequest):
    """Send a message via email, WhatsApp, or internal channel"""
    db = get_db()
    
    # Find the ticket
    ticket = await db.tickets.find_one({"ticket_id": request.ticket_id})
    if not ticket:
        try:
            ticket = await db.tickets.find_one({"_id": ObjectId(request.ticket_id)})
        except:
            raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.now(timezone.utc).isoformat()
    member = ticket.get("member", {})
    
    # Create message record
    message_record = {
        "id": str(uuid.uuid4()),
        "type": "reply",
        "content": request.message,
        "sender": "concierge",
        "channel": request.channel,
        "timestamp": now,
        "is_internal": request.is_internal
    }
    
    result = {"success": True, "channel": request.channel, "message": message_record}
    
    # Send via appropriate channel
    if request.channel == "email":
        member_email = member.get("email")
        if member_email:
            # Send email via Resend
            resend_client = get_resend()
            if resend_client:
                try:
                    resend_client.Emails.send({
                        "from": SENDER_EMAIL,
                        "to": member_email,
                        "subject": f"Re: Ticket {ticket.get('ticket_id')} - The Doggy Company",
                        "html": f"""
                            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); padding: 20px; border-radius: 16px 16px 0 0;">
                                    <h2 style="color: white; margin: 0;">🐾 The Doggy Company</h2>
                                </div>
                                <div style="padding: 24px; background: #f8f4f0; border-radius: 0 0 16px 16px;">
                                    <p>Hi {member.get('name', 'there')}!</p>
                                    <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                        {request.message.replace(chr(10), '<br>')}
                                    </div>
                                    <p style="color: #666; font-size: 14px;">
                                        Reference: {ticket.get('ticket_id')}<br>
                                        Best regards,<br>
                                        The Doggy Company Concierge Team
                                    </p>
                                </div>
                            </div>
                        """
                    })
                    message_record["email_sent"] = True
                    result["email_sent"] = True
                except Exception as e:
                    print(f"Error sending email: {e}")
                    result["email_error"] = str(e)
            else:
                result["email_error"] = "Email service not configured"
        else:
            result["email_error"] = "No email address for member"
    
    elif request.channel == "whatsapp":
        member_phone = member.get("whatsapp") or member.get("phone")
        if member_phone:
            # Clean phone number
            clean_phone = member_phone.replace("+", "").replace(" ", "").replace("-", "")
            if not clean_phone.startswith("91") and len(clean_phone) == 10:
                clean_phone = "91" + clean_phone
            
            # Generate WhatsApp URL for manual sending
            encoded_message = request.message.replace("\n", "%0A").replace(" ", "%20")
            whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}"
            
            message_record["whatsapp_url"] = whatsapp_url
            result["whatsapp_url"] = whatsapp_url
            result["whatsapp_phone"] = clean_phone
        else:
            result["whatsapp_error"] = "No WhatsApp/phone number for member"
    
    # Update ticket with the message
    update_doc = {"updated_at": now}
    if not ticket.get("first_response_at") and not request.is_internal:
        update_doc["first_response_at"] = now
    
    await db.tickets.update_one(
        {"_id": ticket["_id"]},
        {
            "$push": {"messages": message_record},
            "$set": update_doc
        }
    )
    
    return result


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

@router.post("/{ticket_id}/lock")
async def toggle_ticket_lock(ticket_id: str, data: dict = None):
    """Lock or unlock a ticket to prevent customer replies"""
    db = get_db()
    
    if not data:
        data = {}
    
    is_locked = data.get("is_locked", True)
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"is_locked": is_locked, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        try:
            result = await db.tickets.update_one(
                {"_id": ObjectId(ticket_id)},
                {"$set": {"is_locked": is_locked, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        except:
            pass
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True, "is_locked": is_locked}

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

@router.post("/{ticket_id}/follow")
async def follow_ticket(ticket_id: str):
    """Follow a ticket for notifications"""
    db = get_db()
    
    # Add to followers list
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$addToSet": {"followers": "admin"}}  # In real app, use actual user id
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True, "message": "Now following this ticket"}

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
    With Pet Soul personalization - no generic pet language
    """
    db = get_db()
    
    # Search both collections like get_ticket does
    ticket = await db.tickets.find_one({"ticket_id": request.ticket_id})
    
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": request.ticket_id})
    
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket not found: {request.ticket_id}")
    
    # Build context from ticket
    member = ticket.get("member") or {}
    messages = ticket.get("messages", [])
    
    # ========== PET SOUL INTEGRATION ==========
    # Load Pet Soul data for personalization
    pet_soul_context = {}
    pet_info = ticket.get("pet") or {}
    pet_name = pet_info.get("name") if pet_info else None
    
    if pet_name or member.get("email"):
        # Try to find pet by name or owner email
        pet_query = {}
        if pet_info.get("id"):
            pet_query = {"id": pet_info.get("id")}
        elif pet_name:
            pet_query = {"name": pet_name}
        elif member.get("email"):
            pet_query = {"owner_email": member.get("email")}
        
        if pet_query:
            pet_doc = await db.pets.find_one(pet_query, {"_id": 0})
            if pet_doc:
                # Extract Pet Soul data
                pet_soul_context = {
                    "name": pet_doc.get("name"),
                    "breed": pet_doc.get("breed") or pet_doc.get("identity", {}).get("breed"),
                    "age": pet_doc.get("age") or pet_doc.get("birth_date"),
                    "gender": pet_doc.get("gender") or pet_doc.get("identity", {}).get("gender"),
                    "preferences": {
                        "favorite_treats": pet_doc.get("preferences", {}).get("favorite_treats", []),
                        "allergies": pet_doc.get("preferences", {}).get("allergies", []),
                    },
                    "personality": {
                        "anxiety_triggers": pet_doc.get("personality", {}).get("anxiety_triggers", []),
                        "handling_comfort": pet_doc.get("doggy_soul_answers", {}).get("handling_comfort"),
                    },
                    "recent_activity": ticket.get("category", "inquiry")
                }
                # Clean up empty values
                pet_soul_context = {k: v for k, v in pet_soul_context.items() if v}
    
    # Get conversation history
    conversation = "\n".join([
        f"[{m.get('sender', 'unknown').upper()}] {m.get('content', '')[:500]}"
        for m in messages[-5:]  # Last 5 messages
    ])
    
    # Define tone based on reply_type
    tone_instructions = {
        "professional": "professional, courteous, and efficient",
        "friendly": "warm and personable while remaining professional",
        "empathetic": "deeply empathetic, understanding, and supportive",
        "concise": "brief, to-the-point, and efficient",
        "formal": "formal and business-appropriate",
        "shorter": "concise version of the draft - reduce length by 50%",
        "more_empathetic": "more caring and understanding version",
        "remove_fluff": "stripped of unnecessary pleasantries, just the essential information"
    }
    
    tone = tone_instructions.get(request.reply_type, tone_instructions["professional"])
    
    # Build Pet Soul context string
    pet_context_str = ""
    if pet_soul_context:
        pet_context_str = f"""
PET SOUL DATA (Use this for genuine personalization):
- Pet Name: {pet_soul_context.get('name', 'Unknown')}
- Breed: {pet_soul_context.get('breed', 'Not specified')}
- Age/DOB: {pet_soul_context.get('age', 'Not specified')}
- Gender: {pet_soul_context.get('gender', 'Not specified')}"""
        
        if pet_soul_context.get('preferences', {}).get('favorite_treats'):
            pet_context_str += f"\n- Favorite Treats: {', '.join(pet_soul_context['preferences']['favorite_treats'])}"
        if pet_soul_context.get('preferences', {}).get('allergies'):
            pet_context_str += f"\n- Allergies: {', '.join(pet_soul_context['preferences']['allergies'])}"
        if pet_soul_context.get('personality', {}).get('anxiety_triggers'):
            pet_context_str += f"\n- Anxiety Triggers: {', '.join(pet_soul_context['personality']['anxiety_triggers'])}"
        if pet_soul_context.get('personality', {}).get('handling_comfort'):
            pet_context_str += f"\n- Handling Comfort: {pet_soul_context['personality']['handling_comfort']}"
    
    # Build the prompt - NO GENERIC PET LANGUAGE
    system_prompt = f"""You are a professional pet concierge at The Doggy Company (TDC).
Your role is to draft exceptional, genuinely personalized customer service replies.

CRITICAL RULES - LANGUAGE:
1. NEVER use generic pet phrases like:
   - "fur baby" / "furbaby"
   - "pawsome" / "paw-fect"
   - "woof" / "bark-tastic"
   - "four-legged friend"
   - "furry companion"
   
2. Reference the pet by name naturally (1-2 times max)
3. Use known preferences subtly and naturally
4. Be warm but professional - not cutesy
5. No invented personality traits - only use what's in Pet Soul data

MEMBER CONTEXT:
- Name: {member.get('name', 'Valued Member')}
- Email: {member.get('email', '')}
{pet_context_str if pet_context_str else f"- Pet: {pet_name or 'their pet'}"}

TICKET CONTEXT:
- Category: {ticket.get('category', 'general')}
- Sub-category: {ticket.get('sub_category', '')}
- Urgency: {ticket.get('urgency', 'medium')}
- Status: {ticket.get('status', 'open')}

TONE FOR THIS REPLY: {tone}

TICKET DESCRIPTION:
{ticket.get('description', 'No description provided')[:1000]}

CONVERSATION HISTORY:
{conversation if conversation else 'No previous messages'}

{f"ADDITIONAL CONTEXT FROM ADMIN: {request.additional_context}" if request.additional_context else ""}

Generate a reply that:
1. Addresses their specific concern directly
2. Uses Pet Soul data for subtle, natural personalization (NOT generic language)
3. Provides clear next steps or solutions
4. Ends with a professional sign-off
5. Is ready to send (no placeholders like [X] or [your name])

Reply (message body only, no subject line):"""

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
        
        return {
            "success": True,
            "draft": response,
            "tone": request.reply_type,
            "ticket_id": request.ticket_id,
            # Return Pet Soul context for transparency
            "pet_soul_used": pet_soul_context if pet_soul_context else None,
            "personalization_data": {
                "pet_name": pet_soul_context.get("name") if pet_soul_context else pet_name,
                "breed": pet_soul_context.get("breed") if pet_soul_context else None,
                "preferences_used": bool(pet_soul_context.get("preferences")),
                "recent_activity": ticket.get("category")
            }
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



# ============== ATTACHMENT UPLOAD ==============

@router.post("/{ticket_id}/attachments")
async def upload_ticket_attachment(
    ticket_id: str,
    file: UploadFile = File(...)
):
    """Upload an attachment to a ticket"""
    db = get_db()
    
    # Verify ticket exists - check both collections
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # More permissive file type validation - allow common types + fallback for octet-stream
    allowed_types = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
        'video/webm', 'video/mp4', 'video/quicktime',
        'application/octet-stream'  # Allow generic binary for browser compatibility
    ]
    
    # Get content type - be permissive
    content_type = file.content_type or 'application/octet-stream'
    
    # If content_type is octet-stream, try to infer from filename
    if content_type == 'application/octet-stream' and file.filename:
        ext = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        ext_to_mime = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 
            'gif': 'image/gif', 'webp': 'image/webp',
            'pdf': 'application/pdf', 'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain', 'csv': 'text/csv',
            'webm': 'audio/webm', 'mp3': 'audio/mpeg', 'wav': 'audio/wav',
            'ogg': 'audio/ogg', 'm4a': 'audio/mp4', 'aac': 'audio/aac',
            'mp4': 'video/mp4', 'mov': 'video/quicktime'
        }
        if ext in ext_to_mime:
            content_type = ext_to_mime[ext]
    
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {content_type} not allowed. Allowed: images, documents, audio, video")
    
    # Check file size (max 10MB)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Create uploads directory
    upload_dir = f"uploads/tickets/{ticket_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = f"{upload_dir}/{unique_filename}"
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Determine file type category using our inferred content_type
    file_type = 'document'
    if content_type.startswith('image/'):
        file_type = 'image'
    elif content_type.startswith('audio/'):
        file_type = 'voice'
    elif content_type.startswith('video/'):
        file_type = 'video'
    
    # Update ticket with attachment info - use the correct collection
    attachment_info = {
        "filename": file.filename,
        "stored_filename": unique_filename,
        "path": file_path,
        "file_url": f"/api/tickets/{ticket_id}/files/{unique_filename}",
        "content_type": content_type,
        "type": file_type,
        "size": len(file_content),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"attachments": attachment_info},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {
        "success": True,
        "filename": file.filename,
        "path": file_path,
        "file_url": attachment_info["file_url"],
        "url": attachment_info["file_url"],
        "type": file_type,
        "size": len(file_content)
    }


@router.get("/{ticket_id}/attachments")
async def get_ticket_attachments(ticket_id: str):
    """Get all attachments for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"attachments": 1})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"attachments": ticket.get("attachments", [])}


@router.delete("/{ticket_id}/attachments/{filename}")
async def delete_ticket_attachment(ticket_id: str, filename: str):
    """Delete an attachment from a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Find and remove attachment
    attachments = ticket.get("attachments", [])
    updated_attachments = [a for a in attachments if a.get("stored_filename") != filename and a.get("filename") != filename]
    
    if len(updated_attachments) == len(attachments):
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Delete file from disk
    for a in attachments:
        if a.get("stored_filename") == filename or a.get("filename") == filename:
            try:
                os.remove(a.get("path", f"uploads/tickets/{ticket_id}/{filename}"))
            except:
                pass
            break
    
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "attachments": updated_attachments,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Attachment deleted"}


@router.get("/{ticket_id}/files/{filename}")
async def serve_ticket_file(ticket_id: str, filename: str):
    """Serve a ticket attachment file"""
    from fastapi.responses import FileResponse
    
    file_path = f"uploads/tickets/{ticket_id}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    content_type = "application/octet-stream"
    if filename.endswith(('.jpg', '.jpeg')):
        content_type = "image/jpeg"
    elif filename.endswith('.png'):
        content_type = "image/png"
    elif filename.endswith('.gif'):
        content_type = "image/gif"
    elif filename.endswith('.webp'):
        content_type = "image/webp"
    elif filename.endswith('.pdf'):
        content_type = "application/pdf"
    elif filename.endswith('.webm'):
        content_type = "audio/webm"
    elif filename.endswith('.mp3'):
        content_type = "audio/mpeg"
    elif filename.endswith('.wav'):
        content_type = "audio/wav"
    
    return FileResponse(file_path, media_type=content_type)



# ==================== TIME ENTRIES ====================

@router.get("/{ticket_id}/time-entries")
async def get_time_entries(ticket_id: str):
    """Get all time entries for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    entries = ticket.get("time_entries", [])
    total_minutes = sum(e.get("duration_minutes", 0) for e in entries)
    
    return {
        "entries": entries,
        "total_entries": len(entries),
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 2)
    }

@router.post("/{ticket_id}/time-entries")
async def add_time_entry(ticket_id: str, entry: dict):
    """Add a time entry to a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    time_entry = {
        "id": f"TE-{uuid.uuid4().hex[:8].upper()}",
        "duration_minutes": entry.get("duration_minutes", 15),
        "description": entry.get("description", ""),
        "entry_type": entry.get("entry_type", "work"),
        "agent": entry.get("agent", "Unknown"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"time_entries": time_entry},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Also add to audit trail
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {
                "audit_trail": {
                    "type": "time_entry",
                    "action": f"Added {time_entry['duration_minutes']} minutes of {time_entry['entry_type']}",
                    "agent": time_entry['agent'],
                    "timestamp": time_entry['created_at']
                }
            }
        }
    )
    
    return {"success": True, "time_entry": time_entry}


# ==================== REMINDERS & TASKS ====================

@router.get("/{ticket_id}/reminders")
async def get_ticket_reminders(ticket_id: str):
    """Get all reminders/tasks for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    reminders = ticket.get("reminders", [])
    
    # Sort by due date (soonest first)
    reminders.sort(key=lambda x: x.get("due_at", ""))
    
    # Check for overdue reminders
    now = datetime.now(timezone.utc).isoformat()
    for reminder in reminders:
        reminder["is_overdue"] = reminder.get("due_at", "") < now and reminder.get("status") != "completed"
    
    return {"reminders": reminders, "total": len(reminders)}


@router.post("/{ticket_id}/reminders")
async def create_ticket_reminder(ticket_id: str, reminder: TicketReminder):
    """Create a new reminder/task for a ticket"""
    db = get_db()
    
    # Find ticket in either collection
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    reminder_doc = {
        "id": str(uuid.uuid4()),
        "title": reminder.title,
        "description": reminder.description,
        "due_at": reminder.due_at,
        "reminder_type": reminder.reminder_type,
        "priority": reminder.priority,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    # Add to ticket's reminders array
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"reminders": reminder_doc},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "reminder": reminder_doc}


@router.patch("/{ticket_id}/reminders/{reminder_id}")
async def update_ticket_reminder(ticket_id: str, reminder_id: str, updates: dict):
    """Update a reminder (mark complete, snooze, edit)"""
    db = get_db()
    
    # Find ticket in either collection
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    reminders = ticket.get("reminders", [])
    updated = False
    
    for i, rem in enumerate(reminders):
        if rem.get("id") == reminder_id:
            # Apply updates
            if updates.get("status") == "completed":
                reminders[i]["status"] = "completed"
                reminders[i]["completed_at"] = datetime.now(timezone.utc).isoformat()
            if updates.get("due_at"):
                reminders[i]["due_at"] = updates["due_at"]
            if updates.get("title"):
                reminders[i]["title"] = updates["title"]
            if updates.get("description"):
                reminders[i]["description"] = updates["description"]
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "reminders": reminders,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True}


@router.delete("/{ticket_id}/reminders/{reminder_id}")
async def delete_ticket_reminder(ticket_id: str, reminder_id: str):
    """Delete a reminder from a ticket"""
    db = get_db()
    
    # Find ticket in either collection
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    collection = db.tickets
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
        collection = db.service_desk_tickets
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    await collection.update_one(
        {"ticket_id": ticket_id},
        {
            "$pull": {"reminders": {"id": reminder_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True}


# ==================== AI TICKET SUMMARY ====================

@router.post("/ai/summary/{ticket_id}")
async def generate_ai_summary(ticket_id: str, config: dict):
    """Generate AI summary for a ticket's conversations"""
    db = get_db()
    
    # Search both collections like get_ticket does
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get messages based on config
    messages = ticket.get("messages", [])
    num_conversations = config.get("num_conversations", 30)
    include_incoming = config.get("include_incoming", True)
    include_outgoing = config.get("include_outgoing", True)
    include_internal = config.get("include_internal", False)
    
    # Filter messages
    filtered_messages = []
    for msg in messages[-num_conversations:]:
        sender = msg.get("sender", "")
        is_internal = msg.get("is_internal", False)
        
        if is_internal and not include_internal:
            continue
        if sender == "member" and not include_incoming:
            continue
        if sender in ["agent", "system"] and not include_outgoing:
            continue
        
        filtered_messages.append(msg)
    
    if not filtered_messages:
        return {"summary": "No messages found to summarize based on the selected filters."}
    
    # Build conversation text for AI
    conversation_text = ""
    for msg in filtered_messages:
        sender_label = "Customer" if msg.get("sender") == "member" else "Agent" if msg.get("sender") == "agent" else "System"
        if msg.get("is_internal"):
            sender_label = "Internal Note"
        content = msg.get("content", msg.get("message", ""))
        conversation_text += f"{sender_label}: {content}\n\n"
    
    # Try to use AI for summary
    try:
        from emergentintegrations.llm.chat import chat, Message
        
        prompt = f"""Summarize this customer support conversation concisely. Focus on:
1. The main issue or request
2. Key actions taken
3. Current status/outcome
4. Any pending items

Conversation:
{conversation_text}

Provide a clear, bullet-point summary."""
        
        response = await chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="gpt-4o",
            messages=[Message(role="user", content=prompt)]
        )
        
        return {"summary": response.content}
    except Exception as e:
        # Fallback to basic summary
        logger.error(f"AI summary error: {str(e)}")
        basic_summary = f"""📊 Ticket Summary (Last {len(filtered_messages)} messages)

• Customer: {ticket.get('member', {}).get('name', 'Unknown')}
• Category: {ticket.get('category', 'N/A')}
• Status: {ticket.get('status', 'N/A')}
• Total Messages: {len(messages)}
• First Contact: {messages[0].get('timestamp', 'N/A') if messages else 'N/A'}
• Latest Update: {messages[-1].get('timestamp', 'N/A') if messages else 'N/A'}

Messages included: {len(filtered_messages)} (incoming: {sum(1 for m in filtered_messages if m.get('sender') == 'member')}, outgoing: {sum(1 for m in filtered_messages if m.get('sender') != 'member')})"""
        
        return {"summary": basic_summary}




# ============== EMAIL WEBHOOK FOR INBOUND REPLIES ==============

class InboundEmailWebhook(BaseModel):
    """Webhook payload for inbound email replies"""
    from_email: str
    from_name: Optional[str] = None
    subject: str
    text_body: Optional[str] = None
    html_body: Optional[str] = None
    to_email: str
    # For ticket matching
    ticket_id: Optional[str] = None  # If embedded in subject/headers
    in_reply_to: Optional[str] = None  # Email Message-ID being replied to
    references: Optional[List[str]] = None  # Thread references


@router.post("/webhook/email-reply")
async def handle_email_reply_webhook(email: InboundEmailWebhook):
    """
    Webhook to receive inbound email replies and append to ticket timeline.
    Can be connected to email providers like Resend, SendGrid, Mailgun, etc.
    
    Matching Logic:
    1. Check if ticket_id is in subject line (e.g., "[Ticket #TKT-123]")
    2. Check the to_email for ticket routing (e.g., ticket-123@support.thedoggycompany.in)
    3. Search by customer email to find their open tickets
    """
    db = get_db()
    # Use module-level logger
    
    ticket = None
    collection = db.tickets
    
    # Method 1: Extract ticket ID from subject
    import re
    ticket_pattern = r'\[(?:Ticket|TKT|CARE|STAY|DINE|TRV)[#\s-]*([A-Za-z0-9-]+)\]'
    subject_match = re.search(ticket_pattern, email.subject, re.IGNORECASE)
    
    if subject_match:
        potential_id = subject_match.group(1)
        ticket = await db.tickets.find_one({"ticket_id": {"$regex": potential_id, "$options": "i"}})
        if not ticket:
            ticket = await db.service_desk_tickets.find_one({"ticket_id": {"$regex": potential_id, "$options": "i"}})
            if ticket:
                collection = db.service_desk_tickets
    
    # Method 2: Check explicit ticket_id in payload
    if not ticket and email.ticket_id:
        ticket = await db.tickets.find_one({"ticket_id": email.ticket_id})
        if not ticket:
            ticket = await db.service_desk_tickets.find_one({"ticket_id": email.ticket_id})
            if ticket:
                collection = db.service_desk_tickets
    
    # Method 3: Match by customer email (find most recent open ticket)
    if not ticket:
        ticket = await db.tickets.find_one(
            {
                "member.email": {"$regex": f"^{re.escape(email.from_email)}$", "$options": "i"},
                "status": {"$nin": ["closed", "resolved"]}
            },
            sort=[("created_at", -1)]
        )
        if not ticket:
            ticket = await db.service_desk_tickets.find_one(
                {
                    "member.email": {"$regex": f"^{re.escape(email.from_email)}$", "$options": "i"},
                    "status": {"$nin": ["closed", "resolved"]}
                },
                sort=[("created_at", -1)]
            )
            if ticket:
                collection = db.service_desk_tickets
    
    # If still no ticket, create a new one
    if not ticket:
        logger.info(f"No matching ticket found for email from {email.from_email}, creating new ticket")
        new_ticket_id = f"EMAIL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        ticket = {
            "ticket_id": new_ticket_id,
            "source": "email",
            "channel": "email",
            "category": "inquiry",
            "status": "new",
            "urgency": "medium",
            "subject": email.subject,
            "description": email.text_body or email.html_body or email.subject,
            "member": {
                "name": email.from_name or email.from_email.split('@')[0],
                "email": email.from_email
            },
            "messages": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tickets.insert_one(ticket)
        collection = db.tickets
        logger.info(f"Created new ticket {new_ticket_id} for email from {email.from_email}")
    
    # Add the email as a message to the ticket timeline
    now = datetime.now(timezone.utc).isoformat()
    message_content = email.text_body or email.html_body or "(No message body)"
    
    message = {
        "id": str(uuid.uuid4()),
        "type": "customer_reply",
        "content": message_content,
        "sender": "member",
        "sender_name": email.from_name or email.from_email,
        "channel": "email",
        "direction": "incoming",
        "timestamp": now,
        "is_internal": False,
        "metadata": {
            "from_email": email.from_email,
            "subject": email.subject,
            "via": "email_webhook"
        }
    }
    
    # Update ticket
    await collection.update_one(
        {"_id": ticket["_id"]},
        {
            "$push": {"messages": message},
            "$set": {
                "updated_at": now,
                "status": "in_progress" if ticket.get("status") == "waiting_on_member" else ticket.get("status")
            }
        }
    )
    
    logger.info(f"Added email reply to ticket {ticket.get('ticket_id')} from {email.from_email}")
    


# ==================== SMART AUTO-ASSIGNMENT ====================

# Agent expertise mapping (can be configured via admin)
AGENT_EXPERTISE = {
    "aditya": ["celebrate", "shop", "dine", "travel"],
    "dipali": ["care", "fit", "groom", "stay"],
    "support": ["advisory", "paperwork", "emergency", "farewell"]
}

async def auto_assign_ticket(ticket_doc: dict) -> Optional[str]:
    """Auto-assign ticket to best agent based on pillar expertise"""
    db = get_db()
    
    category = ticket_doc.get("category", "").lower()
    
    # Find agent with expertise in this pillar
    best_agent = None
    for agent, pillars in AGENT_EXPERTISE.items():
        if category in pillars:
            # Check agent's current workload
            open_tickets = await db.tickets.count_documents({
                "assigned_to": agent,
                "status": {"$nin": ["resolved", "closed"]}
            })
            
            if best_agent is None or open_tickets < best_agent[1]:
                best_agent = (agent, open_tickets)
    
    return best_agent[0] if best_agent else None


# ==================== SLA BREACH MONITORING ====================

@router.get("/sla/breached")
async def get_breached_tickets():
    """Get all tickets that have breached their SLA"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Find tickets where SLA is breached or about to breach (within 1 hour)
    one_hour_from_now = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    
    breached = await db.tickets.find({
        "status": {"$nin": ["resolved", "closed"]},
        "sla_due_at": {"$lte": now}
    }, {"_id": 0}).to_list(100)
    
    approaching = await db.tickets.find({
        "status": {"$nin": ["resolved", "closed"]},
        "sla_due_at": {"$gt": now, "$lte": one_hour_from_now}
    }, {"_id": 0}).to_list(100)
    
    return {
        "breached": breached,
        "approaching_breach": approaching,
        "breached_count": len(breached),
        "approaching_count": len(approaching)
    }

@router.post("/sla/escalate-breached")
async def escalate_breached_tickets():
    """Auto-escalate all breached SLA tickets"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_many(
        {
            "status": {"$nin": ["resolved", "closed", "escalated"]},
            "sla_due_at": {"$lte": now},
            "sla_breached": {"$ne": True}
        },
        {
            "$set": {
                "status": "escalated",
                "sla_breached": True,
                "updated_at": now
            },
            "$push": {
                "messages": {
                    "id": str(uuid.uuid4()),
                    "type": "system",
                    "content": "⚠️ Ticket auto-escalated due to SLA breach",
                    "sender": "system",
                    "timestamp": now,
                    "is_internal": True
                }
            }
        }
    )
    
    return {"escalated": result.modified_count}


# ==================== TICKET MERGING ====================

class MergeTicketsRequest(BaseModel):
    primary_ticket_id: str
    secondary_ticket_ids: List[str]

@router.post("/merge")
async def merge_tickets(request: MergeTicketsRequest):
    """Merge multiple tickets into one primary ticket"""
    db = get_db()
    
    # Get primary ticket
    primary = await db.tickets.find_one({"ticket_id": request.primary_ticket_id})
    if not primary:
        raise HTTPException(status_code=404, detail="Primary ticket not found")
    
    now = datetime.now(timezone.utc).isoformat()
    merged_messages = []
    merged_attachments = []
    
    for secondary_id in request.secondary_ticket_ids:
        secondary = await db.tickets.find_one({"ticket_id": secondary_id})
        if secondary:
            # Copy messages with source reference
            for msg in secondary.get("messages", []):
                msg["merged_from"] = secondary_id
                merged_messages.append(msg)
            
            # Copy attachments
            merged_attachments.extend(secondary.get("attachments", []))
            
            # Mark secondary ticket as merged
            await db.tickets.update_one(
                {"ticket_id": secondary_id},
                {
                    "$set": {
                        "status": "closed",
                        "merged_into": request.primary_ticket_id,
                        "closed_at": now,
                        "updated_at": now
                    }
                }
            )
    
    # Update primary ticket with merged content
    await db.tickets.update_one(
        {"ticket_id": request.primary_ticket_id},
        {
            "$push": {
                "messages": {
                    "$each": merged_messages
                },
                "attachments": {
                    "$each": merged_attachments
                }
            },
            "$set": {
                "updated_at": now,
                "merged_tickets": request.secondary_ticket_ids
            }
        }
    )
    
    return {
        "success": True,
        "primary_ticket": request.primary_ticket_id,
        "merged_count": len(request.secondary_ticket_ids)
    }


# ==================== TICKET TAGS ====================

@router.post("/{ticket_id}/tags")
async def add_ticket_tags(ticket_id: str, tags: List[str] = Body(...)):
    """Add tags to a ticket"""
    db = get_db()
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$addToSet": {"tags": {"$each": tags}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True, "added_tags": tags}

@router.delete("/{ticket_id}/tags/{tag}")
async def remove_ticket_tag(ticket_id: str, tag: str):
    """Remove a tag from a ticket"""
    db = get_db()
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$pull": {"tags": tag},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "removed_tag": tag}

@router.get("/tags/all")
async def get_all_tags():
    """Get all unique tags used across tickets"""
    db = get_db()
    
    tags = await db.tickets.distinct("tags")
    return {"tags": [t for t in tags if t]}


# ==================== FOLLOW-UP REMINDERS ====================

class ReminderCreate(BaseModel):
    due_at: str
    note: str
    assigned_to: Optional[str] = None

@router.post("/{ticket_id}/reminders")
async def add_reminder(ticket_id: str, reminder: ReminderCreate):
    """Add a follow-up reminder to a ticket"""
    db = get_db()
    
    reminder_doc = {
        "id": str(uuid.uuid4()),
        "due_at": reminder.due_at,
        "note": reminder.note,
        "assigned_to": reminder.assigned_to,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed": False
    }
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"reminders": reminder_doc},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True, "reminder": reminder_doc}

@router.patch("/{ticket_id}/reminders/{reminder_id}")
async def complete_reminder(ticket_id: str, reminder_id: str):
    """Mark a reminder as completed"""
    db = get_db()
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id, "reminders.id": reminder_id},
        {
            "$set": {
                "reminders.$.completed": True,
                "reminders.$.completed_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True}

@router.get("/reminders/due")
async def get_due_reminders():
    """Get all reminders that are due"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Find tickets with due reminders
    tickets = await db.tickets.find({
        "reminders": {
            "$elemMatch": {
                "due_at": {"$lte": now},
                "completed": False
            }
        }
    }, {"_id": 0, "ticket_id": 1, "subject": 1, "reminders": 1}).to_list(100)
    
    due_reminders = []
    for ticket in tickets:
        for reminder in ticket.get("reminders", []):
            if not reminder.get("completed") and reminder.get("due_at", "") <= now:
                due_reminders.append({
                    "ticket_id": ticket["ticket_id"],
                    "subject": ticket.get("subject", ""),
                    **reminder
                })
    
    return {"reminders": due_reminders, "count": len(due_reminders)}


# ==================== AGENT PERFORMANCE DASHBOARD ====================

@router.get("/analytics/agent-performance")
async def get_agent_performance(days: int = 30):
    """Get agent performance metrics"""
    db = get_db()
    
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get all agents
    agents = await db.tickets.distinct("assigned_to")
    agents = [a for a in agents if a]
    
    performance = {}
    for agent in agents:
        # Tickets assigned
        assigned = await db.tickets.count_documents({
            "assigned_to": agent,
            "created_at": {"$gte": cutoff}
        })
        
        # Tickets resolved
        resolved = await db.tickets.count_documents({
            "assigned_to": agent,
            "status": "resolved",
            "resolved_at": {"$gte": cutoff}
        })
        
        # Average resolution time (for resolved tickets)
        pipeline = [
            {
                "$match": {
                    "assigned_to": agent,
                    "status": "resolved",
                    "resolved_at": {"$gte": cutoff},
                    "first_response_at": {"$ne": None}
                }
            },
            {
                "$project": {
                    "response_time": {
                        "$subtract": [
                            {"$dateFromString": {"dateString": "$first_response_at"}},
                            {"$dateFromString": {"dateString": "$created_at"}}
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_response_time_ms": {"$avg": "$response_time"}
                }
            }
        ]
        
        response_time_result = await db.tickets.aggregate(pipeline).to_list(1)
        avg_response_mins = 0
        if response_time_result:
            avg_response_mins = round(response_time_result[0].get("avg_response_time_ms", 0) / 60000, 1)
        
        # CSAT score for agent
        csat_pipeline = [
            {"$match": {"assigned_to": agent}},
            {"$match": {"csat_rating": {"$exists": True}}},
            {"$group": {"_id": None, "avg_csat": {"$avg": "$csat_rating"}, "count": {"$sum": 1}}}
        ]
        csat_result = await db.tickets.aggregate(csat_pipeline).to_list(1)
        avg_csat = round(csat_result[0].get("avg_csat", 0), 2) if csat_result else 0
        csat_count = csat_result[0].get("count", 0) if csat_result else 0
        
        performance[agent] = {
            "tickets_assigned": assigned,
            "tickets_resolved": resolved,
            "resolution_rate": round(resolved / assigned * 100, 1) if assigned > 0 else 0,
            "avg_response_time_mins": avg_response_mins,
            "avg_csat": avg_csat,
            "csat_responses": csat_count
        }
    
    # Overall stats
    total_assigned = sum(p["tickets_assigned"] for p in performance.values())
    total_resolved = sum(p["tickets_resolved"] for p in performance.values())
    
    return {
        "period_days": days,
        "agents": performance,
        "summary": {
            "total_assigned": total_assigned,
            "total_resolved": total_resolved,
            "overall_resolution_rate": round(total_resolved / total_assigned * 100, 1) if total_assigned > 0 else 0
        }
    }


# ==================== VOICE ORDER PROCESSING ====================

class VoiceOrderRequest(BaseModel):
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    order_type: str  # "product", "service", "booking"
    items: List[dict]  # [{"name": "...", "quantity": 1, "pillar": "..."}]
    delivery_address: Optional[str] = None
    special_instructions: Optional[str] = None
    member_email: str
    member_name: str
    source: str = "voice_mira"

@router.post("/voice-order")
async def process_voice_order(order: VoiceOrderRequest):
    """Process a voice order from Mira and create appropriate tickets/orders"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create a ticket for the voice order
    ticket_id = await generate_ticket_id()
    
    # Build order description
    items_desc = "\n".join([
        f"• {item.get('name', 'Unknown')} x{item.get('quantity', 1)}"
        for item in order.items
    ])
    
    description = f"""🎤 Voice Order via Mira

**Order Type:** {order.order_type.title()}
**Pet:** {order.pet_name or 'Not specified'}

**Items:**
{items_desc}

**Delivery:** {order.delivery_address or 'Not specified'}
**Special Instructions:** {order.special_instructions or 'None'}
"""
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "member": {
            "name": order.member_name,
            "email": order.member_email
        },
        "category": order.items[0].get("pillar", "shop") if order.items else "shop",
        "sub_category": "voice_order",
        "urgency": "medium",
        "description": description,
        "source": "voice_mira",
        "status": "new",
        "priority": 2,
        "tags": ["voice-order", "mira"],
        "voice_order_data": {
            "order_type": order.order_type,
            "items": order.items,
            "pet_id": order.pet_id,
            "pet_name": order.pet_name,
            "delivery_address": order.delivery_address,
            "special_instructions": order.special_instructions
        },
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "voice_order",
            "content": description,
            "sender": "member",
            "sender_name": order.member_name,
            "channel": "voice_mira",
            "timestamp": now,
            "is_internal": False
        }],
        "sla_due_at": calculate_sla_due_at("medium"),
        "created_at": now,
        "updated_at": now
    }
    
    await db.tickets.insert_one(ticket_doc)
    del ticket_doc["_id"]
    
    # Also create a concierge order for tracking
    concierge_order = {
        "id": f"VO-{uuid.uuid4().hex[:8].upper()}",
        "ticket_id": ticket_id,
        "type": order.order_type,
        "items": order.items,
        "member_email": order.member_email,
        "member_name": order.member_name,
        "pet_name": order.pet_name,
        "status": "pending",
        "source": "voice_mira",
        "created_at": now
    }
    
    await db.concierge_orders.insert_one(concierge_order)
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "order_id": concierge_order["id"],
        "message": f"Voice order received and ticket {ticket_id} created"
    }


# ============== RESEND INBOUND EMAIL WEBHOOK ==============

class ResendInboundEmail(BaseModel):
    """
    Resend email.received webhook payload format
    See: https://resend.com/docs/dashboard/receiving/introduction
    """
    type: str = "email.received"
    created_at: Optional[str] = None
    data: Optional[dict] = None
    # Direct fields (alternative format)
    from_: Optional[str] = Field(None, alias="from")
    to: Optional[List[str]] = None
    subject: Optional[str] = None
    text: Optional[str] = None
    html: Optional[str] = None


@router.post("/webhook/resend-inbound")
async def handle_resend_inbound_webhook(request: Request):
    """
    Handle Resend inbound email webhook (email.received event).
    
    Setup in Resend Dashboard:
    1. Go to Webhooks > Add Webhook
    2. Enter endpoint URL: https://your-domain/api/tickets/webhook/resend-inbound
    3. Select event: email.received
    4. Save and copy the webhook signing secret to .env as RESEND_WEBHOOK_SECRET
    
    Your receiving email address will be: anything@[your-resend-domain].resend.app
    Or configure a custom domain in Resend Dashboard.
    """
    try:
        body = await request.json()
        logger.info(f"Resend webhook received: {body.get('type', 'unknown')}")
        
        # Handle email.received event
        if body.get("type") == "email.received":
            data = body.get("data", {})
            
            # Extract email details from Resend format
            from_email = data.get("from", "")
            from_name = None
            
            # Parse "Name <email@domain.com>" format
            if "<" in from_email and ">" in from_email:
                import re
                match = re.match(r'(.+?)\s*<(.+?)>', from_email)
                if match:
                    from_name = match.group(1).strip().strip('"')
                    from_email = match.group(2).strip()
            
            # Build standard webhook payload
            email_payload = InboundEmailWebhook(
                from_email=from_email,
                from_name=from_name,
                subject=data.get("subject", "(No Subject)"),
                text_body=data.get("text"),
                html_body=data.get("html"),
                to_email=data.get("to", [""])[0] if isinstance(data.get("to"), list) else data.get("to", "")
            )
            
            # Process using existing handler
            return await handle_email_reply_webhook(email_payload)
        
        # Handle other event types (delivery status, etc.)
        logger.info(f"Unhandled Resend event type: {body.get('type')}")
        return {"status": "ok", "type": body.get("type")}
        
    except Exception as e:
        logger.error(f"Resend webhook error: {e}")
        return {"status": "error", "message": str(e)}

