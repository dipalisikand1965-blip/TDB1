"""
Auto-Assignment & SLA Rules Engine for Service Desk
Handles automatic ticket routing, SLA tracking, and escalations
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import asyncio

router = APIRouter(prefix="/api/tickets/sla", tags=["ticket-sla"])

# Get MongoDB connection
def get_db():
    from server import db
    return db

# Get Resend
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
BUSINESS_EMAIL = os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggybakery.in")

# ============== MODELS ==============

class SLARule(BaseModel):
    name: str
    category: Optional[str] = None  # Apply to specific category or all
    urgency: Optional[str] = None   # Apply to specific urgency or all
    response_time_hours: int = 24   # First response SLA
    resolution_time_hours: int = 48 # Resolution SLA
    auto_escalate: bool = True
    escalate_after_hours: int = 4   # Hours before deadline to escalate
    enabled: bool = True

class AssignmentRule(BaseModel):
    name: str
    category: Optional[str] = None  # Match category
    urgency: Optional[str] = None   # Match urgency
    source: Optional[str] = None    # Match source (email, whatsapp, etc)
    assign_to: str                  # Concierge ID to assign to
    priority: int = 0               # Higher priority rules evaluated first
    enabled: bool = True
    max_open_tickets: Optional[int] = None  # Don't assign if concierge has more than X open tickets

class EscalationRule(BaseModel):
    name: str
    trigger: str  # sla_breach, no_response, high_urgency_unassigned
    trigger_after_hours: int = 4
    action: str  # escalate_status, reassign, notify
    notify_emails: List[str] = []
    enabled: bool = True

class ConciergeAvailability(BaseModel):
    concierge_id: str
    available: bool = True
    max_tickets: int = 20
    categories: List[str] = []  # Specializations
    shift_start: Optional[str] = None  # HH:MM format
    shift_end: Optional[str] = None

# ============== DEFAULT SLA CONFIGS ==============

DEFAULT_SLA_BY_URGENCY = {
    "critical": {"response_hours": 1, "resolution_hours": 4},
    "high": {"response_hours": 4, "resolution_hours": 24},
    "medium": {"response_hours": 12, "resolution_hours": 48},
    "low": {"response_hours": 24, "resolution_hours": 72}
}

DEFAULT_ASSIGNMENT_RULES = [
    {
        "name": "Emergency to Senior",
        "category": "emergency",
        "assign_to": "aditya",
        "priority": 100,
        "enabled": True
    },
    {
        "name": "VIP/Exclusive to Senior",
        "category": "exclusive",
        "assign_to": "aditya",
        "priority": 90,
        "enabled": True
    },
    {
        "name": "Dine Round Robin",
        "category": "dine",
        "assign_to": "round_robin",
        "priority": 50,
        "enabled": True
    }
]

# ============== HELPER FUNCTIONS ==============

async def calculate_sla_deadline(ticket: dict) -> datetime:
    """Calculate SLA deadline based on ticket urgency and category"""
    db = get_db()
    
    urgency = ticket.get("urgency", "medium")
    category = ticket.get("category", "shop")
    
    # Check for custom SLA rule
    sla_rule = await db.sla_rules.find_one({
        "$or": [
            {"category": category, "urgency": urgency, "enabled": True},
            {"category": category, "urgency": None, "enabled": True},
            {"category": None, "urgency": urgency, "enabled": True}
        ]
    }, sort=[("category", -1), ("urgency", -1)])  # More specific rules first
    
    if sla_rule:
        resolution_hours = sla_rule.get("resolution_time_hours", 48)
    else:
        resolution_hours = DEFAULT_SLA_BY_URGENCY.get(urgency, {}).get("resolution_hours", 48)
    
    created_at = datetime.fromisoformat(ticket.get("created_at", datetime.now(timezone.utc).isoformat()).replace('Z', '+00:00'))
    
    # Skip weekends for business hours calculation (simplified)
    deadline = created_at + timedelta(hours=resolution_hours)
    
    return deadline

async def get_next_assignee(ticket: dict) -> Optional[str]:
    """Determine the best concierge to assign a ticket to"""
    db = get_db()
    
    category = ticket.get("category", "")
    urgency = ticket.get("urgency", "medium")
    source = ticket.get("source", "")
    
    # Find matching assignment rules
    rules = await db.assignment_rules.find({"enabled": True}).sort("priority", -1).to_list(100)
    
    # Add defaults if no custom rules
    if not rules:
        rules = DEFAULT_ASSIGNMENT_RULES
    
    for rule in rules:
        # Check if rule matches
        cat_match = rule.get("category") is None or rule.get("category") == category
        urg_match = rule.get("urgency") is None or rule.get("urgency") == urgency
        src_match = rule.get("source") is None or rule.get("source") == source
        
        if cat_match and urg_match and src_match:
            assign_to = rule.get("assign_to")
            
            if assign_to == "round_robin":
                # Get concierge with least open tickets
                return await get_least_busy_concierge(category)
            
            # Check concierge availability
            availability = await db.concierge_availability.find_one({"concierge_id": assign_to})
            if availability:
                if not availability.get("available", True):
                    continue
                
                max_tickets = availability.get("max_tickets", 20)
                open_count = await db.tickets.count_documents({
                    "assigned_to": assign_to,
                    "status": {"$nin": ["resolved", "closed"]}
                })
                
                if open_count >= max_tickets:
                    continue
            
            return assign_to
    
    # Fallback: round robin
    return await get_least_busy_concierge()

async def get_least_busy_concierge(category: Optional[str] = None) -> Optional[str]:
    """Get the concierge with the least open tickets"""
    db = get_db()
    
    # Get all available concierges
    concierges = await db.concierges.find({}).to_list(100)
    
    if not concierges:
        concierges = [
            {"id": "aditya", "name": "Aditya"},
            {"id": "concierge1", "name": "Concierge 1"}
        ]
    
    min_tickets = float('inf')
    best_concierge = None
    
    for concierge in concierges:
        concierge_id = concierge.get("id") or str(concierge.get("_id"))
        
        # Check availability
        availability = await db.concierge_availability.find_one({"concierge_id": concierge_id})
        if availability and not availability.get("available", True):
            continue
        
        # Check category specialization if specified
        if category and availability:
            specializations = availability.get("categories", [])
            if specializations and category not in specializations:
                continue
        
        # Count open tickets
        count = await db.tickets.count_documents({
            "assigned_to": concierge_id,
            "status": {"$nin": ["resolved", "closed"]}
        })
        
        if count < min_tickets:
            min_tickets = count
            best_concierge = concierge_id
    
    return best_concierge

# ============== AUTO-ASSIGNMENT ==============

@router.post("/auto-assign/{ticket_id}")
async def auto_assign_ticket(ticket_id: str):
    """Automatically assign a ticket based on rules"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.get("assigned_to"):
        return {"success": False, "message": "Ticket already assigned", "assigned_to": ticket["assigned_to"]}
    
    assignee = await get_next_assignee(ticket)
    
    if assignee:
        now = datetime.now(timezone.utc).isoformat()
        
        await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": {
                "assigned_to": assignee,
                "updated_at": now,
                "status": "in_progress" if ticket.get("status") == "new" else ticket.get("status")
            }}
        )
        
        # Log assignment
        await db.ticket_audit_log.insert_one({
            "ticket_id": ticket_id,
            "action": "auto_assigned",
            "details": {"assigned_to": assignee},
            "timestamp": now
        })
        
        return {"success": True, "assigned_to": assignee}
    
    return {"success": False, "message": "No available concierge found"}

@router.post("/auto-assign-all")
async def auto_assign_all_unassigned():
    """Assign all unassigned tickets"""
    db = get_db()
    
    unassigned = await db.tickets.find({
        "assigned_to": None,
        "status": {"$nin": ["resolved", "closed"]}
    }).to_list(100)
    
    assigned_count = 0
    results = []
    
    for ticket in unassigned:
        ticket_id = ticket.get("ticket_id")
        assignee = await get_next_assignee(ticket)
        
        if assignee:
            now = datetime.now(timezone.utc).isoformat()
            
            await db.tickets.update_one(
                {"ticket_id": ticket_id},
                {"$set": {
                    "assigned_to": assignee,
                    "updated_at": now,
                    "status": "in_progress" if ticket.get("status") == "new" else ticket.get("status")
                }}
            )
            
            assigned_count += 1
            results.append({"ticket_id": ticket_id, "assigned_to": assignee})
    
    return {
        "success": True,
        "total_unassigned": len(unassigned),
        "assigned_count": assigned_count,
        "assignments": results
    }

# ============== SLA TRACKING ==============

@router.post("/set-sla/{ticket_id}")
async def set_ticket_sla(ticket_id: str):
    """Calculate and set SLA deadline for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    deadline = await calculate_sla_deadline(ticket)
    
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"sla_due_at": deadline.isoformat()}}
    )
    
    return {"success": True, "sla_due_at": deadline.isoformat()}

@router.get("/breached")
async def get_sla_breached_tickets():
    """Get all tickets that have breached their SLA"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    breached = await db.tickets.find({
        "sla_due_at": {"$lt": now},
        "status": {"$nin": ["resolved", "closed"]}
    }).to_list(100)
    
    for ticket in breached:
        ticket["id"] = str(ticket.pop("_id"))
    
    return {"breached_tickets": breached, "total": len(breached)}

@router.get("/at-risk")
async def get_at_risk_tickets(hours_threshold: int = 4):
    """Get tickets that are at risk of breaching SLA"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    threshold = (now + timedelta(hours=hours_threshold)).isoformat()
    
    at_risk = await db.tickets.find({
        "sla_due_at": {"$lt": threshold, "$gt": now.isoformat()},
        "status": {"$nin": ["resolved", "closed"]}
    }).to_list(100)
    
    for ticket in at_risk:
        ticket["id"] = str(ticket.pop("_id"))
        # Calculate time remaining
        due = datetime.fromisoformat(ticket["sla_due_at"].replace('Z', '+00:00'))
        remaining = due - now
        ticket["hours_remaining"] = round(remaining.total_seconds() / 3600, 1)
    
    return {"at_risk_tickets": at_risk, "total": len(at_risk)}

# ============== ESCALATION ENGINE ==============

@router.post("/check-escalations")
async def check_and_escalate(background_tasks: BackgroundTasks):
    """Check all tickets and escalate as needed"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    escalated_count = 0
    notifications_sent = 0
    
    # Get escalation rules
    rules = await db.escalation_rules.find({"enabled": True}).to_list(50)
    
    if not rules:
        # Default rules
        rules = [
            {
                "trigger": "sla_breach",
                "action": "escalate_status",
                "notify_emails": [BUSINESS_EMAIL]
            },
            {
                "trigger": "no_response",
                "trigger_after_hours": 2,
                "action": "notify",
                "notify_emails": [BUSINESS_EMAIL]
            },
            {
                "trigger": "high_urgency_unassigned",
                "trigger_after_hours": 0.5,
                "action": "notify",
                "notify_emails": [BUSINESS_EMAIL]
            }
        ]
    
    results = []
    
    for rule in rules:
        trigger = rule.get("trigger")
        
        if trigger == "sla_breach":
            # Find breached tickets not yet escalated
            breached = await db.tickets.find({
                "sla_due_at": {"$lt": now.isoformat()},
                "status": {"$nin": ["resolved", "closed", "escalated"]}
            }).to_list(50)
            
            for ticket in breached:
                ticket_id = ticket.get("ticket_id")
                
                if rule.get("action") == "escalate_status":
                    await db.tickets.update_one(
                        {"ticket_id": ticket_id},
                        {"$set": {"status": "escalated", "updated_at": now.isoformat()}}
                    )
                    escalated_count += 1
                
                # Send notification
                if rule.get("notify_emails"):
                    await send_escalation_notification(
                        ticket, 
                        "SLA Breached", 
                        rule.get("notify_emails")
                    )
                    notifications_sent += 1
                
                results.append({
                    "ticket_id": ticket_id,
                    "reason": "sla_breach",
                    "action_taken": rule.get("action")
                })
        
        elif trigger == "no_response":
            # Find tickets with no first response after X hours
            threshold_hours = rule.get("trigger_after_hours", 2)
            threshold_time = (now - timedelta(hours=threshold_hours)).isoformat()
            
            no_response = await db.tickets.find({
                "created_at": {"$lt": threshold_time},
                "first_response_at": None,
                "status": {"$nin": ["resolved", "closed"]}
            }).to_list(50)
            
            for ticket in no_response:
                ticket_id = ticket.get("ticket_id")
                
                # Check if we already notified recently
                recent_notification = await db.escalation_log.find_one({
                    "ticket_id": ticket_id,
                    "reason": "no_response",
                    "timestamp": {"$gt": (now - timedelta(hours=1)).isoformat()}
                })
                
                if not recent_notification:
                    if rule.get("notify_emails"):
                        await send_escalation_notification(
                            ticket,
                            f"No Response for {threshold_hours}+ hours",
                            rule.get("notify_emails")
                        )
                        notifications_sent += 1
                    
                    # Log escalation
                    await db.escalation_log.insert_one({
                        "ticket_id": ticket_id,
                        "reason": "no_response",
                        "action": "notify",
                        "timestamp": now.isoformat()
                    })
                    
                    results.append({
                        "ticket_id": ticket_id,
                        "reason": "no_response",
                        "action_taken": "notify"
                    })
        
        elif trigger == "high_urgency_unassigned":
            # Find high/critical urgency tickets that are unassigned
            threshold_hours = rule.get("trigger_after_hours", 0.5)
            threshold_time = (now - timedelta(hours=threshold_hours)).isoformat()
            
            unassigned_urgent = await db.tickets.find({
                "urgency": {"$in": ["high", "critical"]},
                "assigned_to": None,
                "created_at": {"$lt": threshold_time},
                "status": {"$nin": ["resolved", "closed"]}
            }).to_list(50)
            
            for ticket in unassigned_urgent:
                ticket_id = ticket.get("ticket_id")
                
                recent_notification = await db.escalation_log.find_one({
                    "ticket_id": ticket_id,
                    "reason": "high_urgency_unassigned",
                    "timestamp": {"$gt": (now - timedelta(minutes=30)).isoformat()}
                })
                
                if not recent_notification:
                    if rule.get("notify_emails"):
                        await send_escalation_notification(
                            ticket,
                            f"High/Critical Urgency - Unassigned!",
                            rule.get("notify_emails")
                        )
                        notifications_sent += 1
                    
                    await db.escalation_log.insert_one({
                        "ticket_id": ticket_id,
                        "reason": "high_urgency_unassigned",
                        "action": "notify",
                        "timestamp": now.isoformat()
                    })
                    
                    results.append({
                        "ticket_id": ticket_id,
                        "reason": "high_urgency_unassigned",
                        "action_taken": "notify"
                    })
    
    return {
        "success": True,
        "escalated_count": escalated_count,
        "notifications_sent": notifications_sent,
        "details": results
    }

async def send_escalation_notification(ticket: dict, reason: str, emails: List[str]):
    """Send escalation notification email and create admin notification"""
    db = get_db()
    resend_client = get_resend()
    
    member = ticket.get("member", {})
    ticket_id = ticket.get("ticket_id")
    
    # Create admin notification (bell icon)
    try:
        await db.admin_notifications.insert_one({
            "type": "sla_escalation",
            "title": f"🚨 ESCALATION: {ticket_id} - {reason}",
            "message": f"Ticket from {member.get('name', 'Unknown')} requires immediate attention. Category: {ticket.get('category', 'N/A')}, Urgency: {ticket.get('urgency', 'N/A').upper()}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
            "urgency": "critical"
        })
    except Exception as e:
        print(f"Failed to create escalation admin notification: {e}")
    
    # Send email notification
    if resend_client:
        try:
            resend_client.Emails.send({
                "from": SENDER_EMAIL,
                "to": emails,
                "subject": f"🚨 ESCALATION: {ticket_id} - {reason}",
                "html": f"""
                    <div style="border-left: 4px solid #ef4444; padding-left: 15px; font-family: Arial, sans-serif;">
                        <h2 style="color: #ef4444;">⚠️ Ticket Escalation Alert</h2>
                        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <p style="margin:0;"><strong>Ticket ID:</strong> {ticket_id}</p>
                            <p style="margin:5px 0;"><strong>Reason:</strong> {reason}</p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e7eb;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr><td style="padding:5px 0;"><strong>Member:</strong></td><td>{member.get('name', 'Unknown')}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Email:</strong></td><td>{member.get('email', 'N/A')}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Phone:</strong></td><td>{member.get('phone', 'N/A')}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Category:</strong></td><td>{ticket.get('category', 'N/A')}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Urgency:</strong></td><td style="color:{'#ef4444' if ticket.get('urgency') in ['critical', 'high'] else '#f59e0b'};font-weight:bold;">{ticket.get('urgency', 'N/A').upper()}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Assigned To:</strong></td><td>{ticket.get('assigned_to') or '⚠️ UNASSIGNED'}</td></tr>
                            <tr><td style="padding:5px 0;"><strong>Status:</strong></td><td>{ticket.get('status', 'unknown')}</td></tr>
                        </table>
                        <hr style="border: none; border-top: 1px solid #e5e7eb;">
                        <p><strong>Description:</strong></p>
                        <p style="background:#fff3cd;padding:15px;border-radius:8px;">{ticket.get('description', '')[:500]}...</p>
                        <p style="margin-top:20px;"><a href="https://thedoggycompany.in/admin" style="background:#9333ea;color:white;padding:12px 24px;border-radius:5px;text-decoration:none;font-weight:bold;">Open Service Desk →</a></p>
                    </div>
                """
            })
        except Exception as e:
            print(f"Failed to send escalation email: {e}")

# ============== RULES MANAGEMENT ==============

@router.get("/rules/assignment")
async def get_assignment_rules():
    """Get all assignment rules"""
    db = get_db()
    
    rules = await db.assignment_rules.find({}).sort("priority", -1).to_list(100)
    
    for rule in rules:
        rule["id"] = str(rule.pop("_id"))
    
    if not rules:
        rules = DEFAULT_ASSIGNMENT_RULES
    
    return {"rules": rules}

@router.post("/rules/assignment")
async def save_assignment_rule(rule: AssignmentRule):
    """Create or update an assignment rule"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    rule_doc = rule.dict()
    rule_doc["updated_at"] = now
    
    # Check if exists
    existing = await db.assignment_rules.find_one({"name": rule.name})
    
    if existing:
        await db.assignment_rules.update_one(
            {"name": rule.name},
            {"$set": rule_doc}
        )
    else:
        rule_doc["created_at"] = now
        await db.assignment_rules.insert_one(rule_doc)
    
    return {"success": True}

@router.delete("/rules/assignment/{rule_name}")
async def delete_assignment_rule(rule_name: str):
    """Delete an assignment rule"""
    db = get_db()
    
    result = await db.assignment_rules.delete_one({"name": rule_name})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return {"success": True}

@router.get("/rules/sla")
async def get_sla_rules():
    """Get all SLA rules"""
    db = get_db()
    
    rules = await db.sla_rules.find({}).to_list(100)
    
    for rule in rules:
        rule["id"] = str(rule.pop("_id"))
    
    # Include defaults
    default_rules = [
        {"urgency": k, **v, "is_default": True}
        for k, v in DEFAULT_SLA_BY_URGENCY.items()
    ]
    
    return {"rules": rules, "defaults": default_rules}

@router.post("/rules/sla")
async def save_sla_rule(rule: SLARule):
    """Create or update an SLA rule"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    rule_doc = rule.dict()
    rule_doc["updated_at"] = now
    
    existing = await db.sla_rules.find_one({"name": rule.name})
    
    if existing:
        await db.sla_rules.update_one({"name": rule.name}, {"$set": rule_doc})
    else:
        rule_doc["created_at"] = now
        await db.sla_rules.insert_one(rule_doc)
    
    return {"success": True}

@router.get("/rules/escalation")
async def get_escalation_rules():
    """Get all escalation rules"""
    db = get_db()
    
    rules = await db.escalation_rules.find({}).to_list(100)
    
    for rule in rules:
        rule["id"] = str(rule.pop("_id"))
    
    return {"rules": rules}

@router.post("/rules/escalation")
async def save_escalation_rule(rule: EscalationRule):
    """Create or update an escalation rule"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    rule_doc = rule.dict()
    rule_doc["updated_at"] = now
    
    existing = await db.escalation_rules.find_one({"name": rule.name})
    
    if existing:
        await db.escalation_rules.update_one({"name": rule.name}, {"$set": rule_doc})
    else:
        rule_doc["created_at"] = now
        await db.escalation_rules.insert_one(rule_doc)
    
    return {"success": True}

# ============== CONCIERGE AVAILABILITY ==============

@router.get("/concierges/availability")
async def get_all_availability():
    """Get availability status of all concierges"""
    db = get_db()
    
    # Get concierges
    concierges = await db.concierges.find({}).to_list(100)
    
    if not concierges:
        concierges = [
            {"id": "aditya", "name": "Aditya"},
            {"id": "concierge1", "name": "Concierge 1"}
        ]
    
    result = []
    
    for c in concierges:
        concierge_id = c.get("id") or str(c.get("_id", ""))
        
        # Get availability config
        availability = await db.concierge_availability.find_one({"concierge_id": concierge_id})
        
        # Get ticket counts
        open_tickets = await db.tickets.count_documents({
            "assigned_to": concierge_id,
            "status": {"$nin": ["resolved", "closed"]}
        })
        
        result.append({
            "concierge_id": concierge_id,
            "name": c.get("name", concierge_id),
            "available": availability.get("available", True) if availability else True,
            "max_tickets": availability.get("max_tickets", 20) if availability else 20,
            "current_tickets": open_tickets,
            "categories": availability.get("categories", []) if availability else [],
            "shift_start": availability.get("shift_start") if availability else None,
            "shift_end": availability.get("shift_end") if availability else None
        })
    
    return {"concierges": result}

@router.post("/concierges/availability")
async def set_availability(availability: ConciergeAvailability):
    """Set availability for a concierge"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.concierge_availability.update_one(
        {"concierge_id": availability.concierge_id},
        {"$set": {
            **availability.dict(),
            "updated_at": now
        }},
        upsert=True
    )
    
    return {"success": True}

# ============== STATS & ANALYTICS ==============

@router.get("/stats")
async def get_sla_stats():
    """Get SLA performance statistics"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=7)).isoformat()
    
    try:
        # SLA breach rate - using simple queries instead of $nin in aggregation
        total_with_sla = await db.tickets.count_documents({"sla_due_at": {"$ne": None}})
        breached = await db.tickets.count_documents({
            "sla_due_at": {"$lt": now.isoformat()},
            "resolved_at": None,
            "status": {"$not": {"$in": ["resolved", "closed"]}}
        })
        
        # Average resolution time (last 7 days) - simplified
        resolved_tickets = await db.tickets.find({
            "resolved_at": {"$gte": week_start},
            "created_at": {"$ne": None}
        }, {"created_at": 1, "resolved_at": 1}).to_list(100)
        
        avg_resolution_hours = None
        if resolved_tickets:
            total_hours = 0
            count = 0
            for t in resolved_tickets:
                try:
                    created = datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))
                    resolved = datetime.fromisoformat(t["resolved_at"].replace('Z', '+00:00'))
                    hours = (resolved - created).total_seconds() / 3600
                    total_hours += hours
                    count += 1
                except:
                    pass
            if count > 0:
                avg_resolution_hours = round(total_hours / count, 1)
        
        # First response time (last 7 days) - simplified
        response_tickets = await db.tickets.find({
            "first_response_at": {"$gte": week_start},
            "created_at": {"$ne": None}
        }, {"created_at": 1, "first_response_at": 1}).to_list(100)
        
        avg_response_hours = None
        if response_tickets:
            total_hours = 0
            count = 0
            for t in response_tickets:
                try:
                    created = datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))
                    responded = datetime.fromisoformat(t["first_response_at"].replace('Z', '+00:00'))
                    hours = (responded - created).total_seconds() / 3600
                    total_hours += hours
                    count += 1
                except:
                    pass
            if count > 0:
                avg_response_hours = round(total_hours / count, 1)
        
        # Tickets by concierge - simplified
        assigned_tickets = await db.tickets.find(
            {"assigned_to": {"$ne": None}},
            {"assigned_to": 1, "status": 1, "resolved_at": 1}
        ).to_list(500)
        
        by_concierge_dict = {}
        for t in assigned_tickets:
            assignee = t.get("assigned_to")
            if assignee not in by_concierge_dict:
                by_concierge_dict[assignee] = {"_id": assignee, "total": 0, "open": 0, "resolved_today": 0}
            by_concierge_dict[assignee]["total"] += 1
            if t.get("status") not in ["resolved", "closed"]:
                by_concierge_dict[assignee]["open"] += 1
            if t.get("status") == "resolved" and t.get("resolved_at", "") >= today_start:
                by_concierge_dict[assignee]["resolved_today"] += 1
        
        by_concierge = list(by_concierge_dict.values())
        
        return {
            "sla_breach_rate": round(breached / total_with_sla * 100, 1) if total_with_sla > 0 else 0,
            "current_breached": breached,
            "avg_resolution_hours": avg_resolution_hours,
            "avg_first_response_hours": avg_response_hours,
            "by_concierge": by_concierge
        }
    except Exception as e:
        print(f"Error in SLA stats: {e}")
        return {
            "sla_breach_rate": 0,
            "current_breached": 0,
            "avg_resolution_hours": None,
            "avg_first_response_hours": None,
            "by_concierge": []
        }
