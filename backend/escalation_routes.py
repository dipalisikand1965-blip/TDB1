"""
Escalation Rules Engine for Service Desk
Auto-escalates tickets based on time, priority, and SLA breaches
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import asyncio

router = APIRouter(prefix="/api/escalation", tags=["Escalation"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# Default escalation rules
DEFAULT_ESCALATION_RULES = [
    {
        "id": "unassigned_1h",
        "name": "Unassigned > 1 hour",
        "description": "Escalate unassigned tickets after 1 hour",
        "trigger": {
            "type": "unassigned_time",
            "hours": 1
        },
        "action": {
            "type": "assign_to_role",
            "target_role": "senior_agent",
            "notify": True
        },
        "priority_filter": ["high", "critical"],
        "enabled": True,
        "is_system": True
    },
    {
        "id": "unassigned_2h",
        "name": "Unassigned > 2 hours",
        "description": "Escalate to manager if still unassigned after 2 hours",
        "trigger": {
            "type": "unassigned_time",
            "hours": 2
        },
        "action": {
            "type": "assign_to_role",
            "target_role": "manager",
            "notify": True
        },
        "priority_filter": ["high", "critical"],
        "enabled": True,
        "is_system": True
    },
    {
        "id": "critical_immediate",
        "name": "Critical → Manager",
        "description": "Critical tickets go directly to manager",
        "trigger": {
            "type": "priority",
            "priority": "critical"
        },
        "action": {
            "type": "assign_to_role",
            "target_role": "manager",
            "notify": True
        },
        "priority_filter": ["critical"],
        "enabled": True,
        "is_system": True
    },
    {
        "id": "sla_breach_15min",
        "name": "SLA Breach Warning",
        "description": "Notify when ticket is 15 minutes from SLA breach",
        "trigger": {
            "type": "sla_warning",
            "minutes_before_breach": 15
        },
        "action": {
            "type": "notify_role",
            "target_role": "senior_agent",
            "notify": True
        },
        "priority_filter": None,
        "enabled": True,
        "is_system": True
    },
    {
        "id": "sla_breached",
        "name": "SLA Breached → Manager",
        "description": "Escalate to manager when SLA is breached",
        "trigger": {
            "type": "sla_breach"
        },
        "action": {
            "type": "escalate_to_role",
            "target_role": "manager",
            "notify": True
        },
        "priority_filter": None,
        "enabled": True,
        "is_system": True
    },
    {
        "id": "no_response_4h",
        "name": "No Response > 4 hours",
        "description": "Escalate if customer hasn't received response in 4 hours",
        "trigger": {
            "type": "no_response_time",
            "hours": 4
        },
        "action": {
            "type": "escalate_to_role",
            "target_role": "senior_agent",
            "notify": True
        },
        "priority_filter": ["medium", "high", "critical"],
        "enabled": True,
        "is_system": True
    }
]

# Role escalation path (lower level → higher level)
ESCALATION_PATH = {
    "agent": "senior_agent",
    "senior_agent": "manager",
    "manager": "super_admin",
    "super_admin": "super_admin"  # Can't escalate further
}

# Pydantic models
class EscalationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    trigger: dict
    action: dict
    priority_filter: Optional[List[str]] = None
    enabled: bool = True

class EscalationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[dict] = None
    action: Optional[dict] = None
    priority_filter: Optional[List[str]] = None
    enabled: Optional[bool] = None

# Seed default rules
@router.post("/seed-defaults")
async def seed_default_rules():
    """Seed default escalation rules"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    seeded = 0
    for rule in DEFAULT_ESCALATION_RULES:
        existing = await db.escalation_rules.find_one({"id": rule["id"]})
        if not existing:
            rule["created_at"] = datetime.now(timezone.utc).isoformat()
            rule["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.escalation_rules.insert_one(rule)
            seeded += 1
    
    return {"message": f"Seeded {seeded} default rules", "total": len(DEFAULT_ESCALATION_RULES)}

# Get all rules
@router.get("")
async def get_escalation_rules():
    """Get all escalation rules"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    rules = await db.escalation_rules.find({}, {"_id": 0}).to_list(100)
    
    # Seed defaults if none exist
    if not rules:
        await seed_default_rules()
        rules = await db.escalation_rules.find({}, {"_id": 0}).to_list(100)
    
    return {"rules": rules}

# Create custom rule
@router.post("")
async def create_escalation_rule(rule: EscalationRuleCreate):
    """Create a new escalation rule"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    rule_id = rule.name.lower().replace(" ", "_")
    
    existing = await db.escalation_rules.find_one({"id": rule_id})
    if existing:
        raise HTTPException(status_code=400, detail="Rule with this name already exists")
    
    rule_doc = {
        "id": rule_id,
        "name": rule.name,
        "description": rule.description,
        "trigger": rule.trigger,
        "action": rule.action,
        "priority_filter": rule.priority_filter,
        "enabled": rule.enabled,
        "is_system": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.escalation_rules.insert_one(rule_doc)
    
    return {"message": "Rule created", "rule_id": rule_id}

# Update rule
@router.patch("/{rule_id}")
async def update_escalation_rule(rule_id: str, rule: EscalationRuleUpdate):
    """Update an escalation rule"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    existing = await db.escalation_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if rule.name is not None:
        update_data["name"] = rule.name
    if rule.description is not None:
        update_data["description"] = rule.description
    if rule.trigger is not None:
        update_data["trigger"] = rule.trigger
    if rule.action is not None:
        update_data["action"] = rule.action
    if rule.priority_filter is not None:
        update_data["priority_filter"] = rule.priority_filter
    if rule.enabled is not None:
        update_data["enabled"] = rule.enabled
    
    await db.escalation_rules.update_one({"id": rule_id}, {"$set": update_data})
    
    return {"message": "Rule updated"}

# Toggle rule enabled/disabled
@router.post("/{rule_id}/toggle")
async def toggle_escalation_rule(rule_id: str):
    """Toggle rule enabled/disabled"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    existing = await db.escalation_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    new_status = not existing.get("enabled", True)
    await db.escalation_rules.update_one(
        {"id": rule_id}, 
        {"$set": {"enabled": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Rule {'enabled' if new_status else 'disabled'}", "enabled": new_status}

# Delete rule
@router.delete("/{rule_id}")
async def delete_escalation_rule(rule_id: str):
    """Delete a custom escalation rule"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    existing = await db.escalation_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    if existing.get("is_system"):
        raise HTTPException(status_code=400, detail="Cannot delete system rules")
    
    await db.escalation_rules.delete_one({"id": rule_id})
    
    return {"message": "Rule deleted"}

# Get escalation history for a ticket
@router.get("/history/{ticket_id}")
async def get_escalation_history(ticket_id: str):
    """Get escalation history for a ticket"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    history = await db.escalation_history.find(
        {"ticket_id": ticket_id},
        {"_id": 0}
    ).sort("escalated_at", -1).to_list(50)
    
    return {"history": history}

# Manual escalation
@router.post("/escalate/{ticket_id}")
async def manual_escalate(ticket_id: str, reason: str = "Manual escalation"):
    """Manually escalate a ticket to the next level"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Get ticket
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get current assignee's role
    current_assignee = ticket.get("assigned_to")
    current_role = "agent"  # default
    
    if current_assignee:
        assignee = await db.admin_users.find_one({"username": current_assignee})
        if assignee:
            current_role = assignee.get("role", "agent")
    
    # Get next role in escalation path
    next_role = ESCALATION_PATH.get(current_role, "manager")
    
    # Find someone with the next role
    next_assignee = await db.admin_users.find_one({"role": next_role, "is_active": True})
    
    if next_assignee:
        # Update ticket
        await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "assigned_to": next_assignee.get("username"),
                    "escalation_level": (ticket.get("escalation_level", 0) + 1),
                    "last_escalated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Log escalation
        await db.escalation_history.insert_one({
            "ticket_id": ticket_id,
            "from_assignee": current_assignee,
            "from_role": current_role,
            "to_assignee": next_assignee.get("username"),
            "to_role": next_role,
            "reason": reason,
            "escalated_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "message": f"Ticket escalated to {next_assignee.get('name', next_assignee.get('username'))}",
            "new_assignee": next_assignee.get("username"),
            "new_role": next_role
        }
    else:
        raise HTTPException(status_code=400, detail=f"No available {next_role} to escalate to")

# Run escalation check (called by background task)
async def run_escalation_check():
    """Check all tickets against escalation rules and escalate as needed"""
    if db is None:
        return {"error": "Database not connected"}
    
    # Get enabled rules
    rules = await db.escalation_rules.find({"enabled": True}).to_list(100)
    
    if not rules:
        # Seed defaults if empty
        for rule in DEFAULT_ESCALATION_RULES:
            await db.escalation_rules.update_one(
                {"id": rule["id"]},
                {"$set": rule},
                upsert=True
            )
        rules = DEFAULT_ESCALATION_RULES
    
    escalated_count = 0
    now = datetime.now(timezone.utc)
    
    for rule in rules:
        if not rule.get("enabled", True):
            continue
        
        trigger = rule.get("trigger", {})
        trigger_type = trigger.get("type")
        action = rule.get("action", {})
        priority_filter = rule.get("priority_filter")
        
        # Build query based on trigger type
        query = {"status": {"$nin": ["resolved", "closed", "spam"]}}
        
        # Apply priority filter if set
        if priority_filter:
            query["urgency"] = {"$in": priority_filter}
        
        tickets_to_escalate = []
        
        if trigger_type == "unassigned_time":
            hours = trigger.get("hours", 1)
            cutoff = now - timedelta(hours=hours)
            query["assigned_to"] = {"$in": [None, "", "unassigned"]}
            query["created_at"] = {"$lt": cutoff.isoformat()}
            tickets_to_escalate = await db.tickets.find(query).to_list(100)
        
        elif trigger_type == "priority":
            target_priority = trigger.get("priority")
            query["urgency"] = target_priority
            query["escalation_level"] = {"$in": [None, 0]}
            tickets_to_escalate = await db.tickets.find(query).to_list(100)
        
        elif trigger_type == "sla_breach":
            query["sla_breached"] = True
            query["escalation_level"] = {"$lt": 2}  # Not already heavily escalated
            tickets_to_escalate = await db.tickets.find(query).to_list(100)
        
        elif trigger_type == "no_response_time":
            hours = trigger.get("hours", 4)
            cutoff = now - timedelta(hours=hours)
            query["last_agent_response"] = {"$exists": False}
            query["created_at"] = {"$lt": cutoff.isoformat()}
            tickets_to_escalate = await db.tickets.find(query).to_list(100)
        
        # Process escalations
        for ticket in tickets_to_escalate:
            ticket_id = ticket.get("ticket_id")
            
            # Check if already escalated by this rule recently (within 1 hour)
            recent_escalation = await db.escalation_history.find_one({
                "ticket_id": ticket_id,
                "rule_id": rule.get("id"),
                "escalated_at": {"$gt": (now - timedelta(hours=1)).isoformat()}
            })
            
            if recent_escalation:
                continue  # Skip - already escalated by this rule recently
            
            # Perform escalation
            target_role = action.get("target_role", "senior_agent")
            
            # Find someone with the target role
            target_user = await db.admin_users.find_one({"role": target_role, "is_active": True})
            
            if target_user:
                await db.tickets.update_one(
                    {"ticket_id": ticket_id},
                    {
                        "$set": {
                            "assigned_to": target_user.get("username"),
                            "escalation_level": (ticket.get("escalation_level", 0) + 1),
                            "last_escalated_at": now.isoformat(),
                            "updated_at": now.isoformat()
                        }
                    }
                )
                
                # Log escalation
                await db.escalation_history.insert_one({
                    "ticket_id": ticket_id,
                    "rule_id": rule.get("id"),
                    "rule_name": rule.get("name"),
                    "from_assignee": ticket.get("assigned_to"),
                    "to_assignee": target_user.get("username"),
                    "to_role": target_role,
                    "reason": rule.get("description"),
                    "escalated_at": now.isoformat()
                })
                
                escalated_count += 1
    
    return {"escalated": escalated_count, "rules_checked": len(rules)}

# Endpoint to manually trigger escalation check
@router.post("/run-check")
async def trigger_escalation_check():
    """Manually trigger escalation check"""
    result = await run_escalation_check()
    return result
