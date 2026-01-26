"""
Concierge® Order Queue System
=============================
Intelligent order routing, task assignment, and execution tracking.
The brain behind The Doggy Company's service delivery.

Features:
- Auto-routing based on pillar/service type
- Pet profile-aware task creation
- Vendor/Staff assignment
- Timeline management
- Status tracking with notifications
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)

# Router
order_queue_router = APIRouter(prefix="/api/concierge", tags=["Concierge® Order Queue"])

# Database reference (set by server.py)
db = None

def set_order_queue_db(database):
    global db
    db = database


# ============== ENUMS & MODELS ==============

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_CUSTOMER = "awaiting_customer"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"

class TaskType(str, Enum):
    SERVICE_DELIVERY = "service_delivery"
    PRODUCT_FULFILMENT = "product_fulfilment"
    CONSULTATION = "consultation"
    COORDINATION = "coordination"
    FOLLOW_UP = "follow_up"


class CreateOrderRequest(BaseModel):
    """Request to create a new Concierge® order"""
    customer_id: str
    pet_id: Optional[str] = None
    items: List[Dict[str, Any]]  # [{product_id, quantity, variant, notes}]
    pillar: str
    service_date: Optional[str] = None
    service_time: Optional[str] = None
    delivery_address: Optional[Dict[str, str]] = None
    special_instructions: Optional[str] = None
    source: str = "website"  # website, service_desk, phone, whatsapp
    ticket_id: Optional[str] = None  # Link to service desk ticket


class AssignTaskRequest(BaseModel):
    """Assign a task to staff/vendor"""
    order_id: str
    assignee_id: str
    assignee_type: str  # staff, vendor, partner
    estimated_duration: Optional[int] = None  # minutes
    notes: Optional[str] = None


# ============== ROUTING RULES ==============

PILLAR_ROUTING = {
    "celebrate": {
        "default_assignee_type": "vendor",
        "requires_scheduling": True,
        "lead_time_days": 3,
        "task_types": ["coordination", "service_delivery"],
        "auto_create_tasks": [
            {"type": "coordination", "title": "Confirm celebration details", "offset_days": -2},
            {"type": "service_delivery", "title": "Execute celebration", "offset_days": 0},
            {"type": "follow_up", "title": "Collect feedback & photos", "offset_days": 1},
        ]
    },
    "dine": {
        "default_assignee_type": "kitchen",
        "requires_scheduling": True,
        "lead_time_days": 1,
        "task_types": ["product_fulfilment", "service_delivery"],
        "auto_create_tasks": [
            {"type": "product_fulfilment", "title": "Prepare meal/order", "offset_days": 0},
            {"type": "service_delivery", "title": "Delivery", "offset_days": 0},
        ]
    },
    "stay": {
        "default_assignee_type": "facility",
        "requires_scheduling": True,
        "lead_time_days": 2,
        "task_types": ["coordination", "service_delivery"],
        "auto_create_tasks": [
            {"type": "coordination", "title": "Confirm boarding details", "offset_days": -1},
            {"type": "service_delivery", "title": "Check-in", "offset_days": 0},
            {"type": "follow_up", "title": "Daily update", "offset_days": 1},
        ]
    },
    "travel": {
        "default_assignee_type": "concierge",
        "requires_scheduling": True,
        "lead_time_days": 7,
        "task_types": ["consultation", "coordination"],
        "auto_create_tasks": [
            {"type": "consultation", "title": "Travel planning consultation", "offset_days": -5},
            {"type": "coordination", "title": "Documentation & bookings", "offset_days": -3},
            {"type": "follow_up", "title": "Pre-travel check", "offset_days": -1},
        ]
    },
    "care": {
        "default_assignee_type": "groomer",
        "requires_scheduling": True,
        "lead_time_days": 1,
        "task_types": ["service_delivery"],
        "auto_create_tasks": [
            {"type": "service_delivery", "title": "Grooming/Care service", "offset_days": 0},
        ]
    },
    "enjoy": {
        "default_assignee_type": "activity_coordinator",
        "requires_scheduling": True,
        "lead_time_days": 2,
        "task_types": ["coordination", "service_delivery"],
        "auto_create_tasks": [
            {"type": "coordination", "title": "Activity coordination", "offset_days": -1},
            {"type": "service_delivery", "title": "Activity execution", "offset_days": 0},
        ]
    },
    "fit": {
        "default_assignee_type": "trainer",
        "requires_scheduling": True,
        "lead_time_days": 2,
        "task_types": ["consultation", "service_delivery"],
        "auto_create_tasks": [
            {"type": "consultation", "title": "Fitness assessment", "offset_days": 0},
            {"type": "service_delivery", "title": "Training session", "offset_days": 0},
        ]
    },
    "learn": {
        "default_assignee_type": "trainer",
        "requires_scheduling": True,
        "lead_time_days": 3,
        "task_types": ["consultation", "service_delivery"],
        "auto_create_tasks": [
            {"type": "consultation", "title": "Behaviour assessment", "offset_days": 0},
            {"type": "service_delivery", "title": "Training session", "offset_days": 0},
        ]
    },
    "paperwork": {
        "default_assignee_type": "concierge",
        "requires_scheduling": False,
        "lead_time_days": 0,
        "task_types": ["coordination"],
        "auto_create_tasks": [
            {"type": "coordination", "title": "Document processing", "offset_days": 0},
            {"type": "follow_up", "title": "Status update", "offset_days": 3},
        ]
    },
    "advisory": {
        "default_assignee_type": "consultant",
        "requires_scheduling": True,
        "lead_time_days": 1,
        "task_types": ["consultation"],
        "auto_create_tasks": [
            {"type": "consultation", "title": "Advisory consultation", "offset_days": 0},
            {"type": "follow_up", "title": "Follow-up recommendations", "offset_days": 2},
        ]
    },
    "emergency": {
        "default_assignee_type": "emergency_team",
        "requires_scheduling": False,
        "lead_time_days": 0,
        "priority": "urgent",
        "task_types": ["service_delivery"],
        "auto_create_tasks": [
            {"type": "service_delivery", "title": "Emergency response", "offset_days": 0},
        ]
    },
    "farewell": {
        "default_assignee_type": "memorial_coordinator",
        "requires_scheduling": True,
        "lead_time_days": 1,
        "task_types": ["coordination", "service_delivery"],
        "auto_create_tasks": [
            {"type": "coordination", "title": "Memorial coordination", "offset_days": 0},
            {"type": "service_delivery", "title": "Service execution", "offset_days": 0},
            {"type": "follow_up", "title": "Grief support check-in", "offset_days": 7},
        ]
    },
    "adopt": {
        "default_assignee_type": "adoption_counsellor",
        "requires_scheduling": True,
        "lead_time_days": 0,
        "task_types": ["consultation", "coordination"],
        "auto_create_tasks": [
            {"type": "consultation", "title": "Adoption counselling", "offset_days": 0},
            {"type": "coordination", "title": "Adoption processing", "offset_days": 1},
            {"type": "follow_up", "title": "Post-adoption check", "offset_days": 7},
        ]
    },
    "shop": {
        "default_assignee_type": "fulfilment",
        "requires_scheduling": False,
        "lead_time_days": 0,
        "task_types": ["product_fulfilment"],
        "auto_create_tasks": [
            {"type": "product_fulfilment", "title": "Order fulfilment", "offset_days": 0},
        ]
    },
}


# ============== HELPER FUNCTIONS ==============

def generate_order_id():
    """Generate unique order ID"""
    now = datetime.now(timezone.utc)
    return f"ORD-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"


def generate_task_id():
    """Generate unique task ID"""
    return f"TSK-{str(uuid.uuid4())[:8].upper()}"


def calculate_priority(pillar: str, service_date: Optional[str], pet_profile: Optional[dict]) -> str:
    """Calculate task priority based on various factors"""
    # Emergency pillar is always urgent
    if pillar == "emergency":
        return TaskPriority.URGENT
    
    # Check if service date is soon
    if service_date:
        try:
            from dateutil import parser
            service_dt = parser.parse(service_date)
            days_until = (service_dt.date() - datetime.now(timezone.utc).date()).days
            if days_until <= 1:
                return TaskPriority.HIGH
            elif days_until <= 3:
                return TaskPriority.NORMAL
        except:
            pass
    
    # Check pet profile for special needs
    if pet_profile:
        age_category = pet_profile.get("age_category")
        if age_category in ["puppy", "senior"]:
            return TaskPriority.HIGH
        
        health_conditions = pet_profile.get("health_conditions", [])
        if health_conditions:
            return TaskPriority.HIGH
    
    return TaskPriority.NORMAL


async def get_pet_profile(pet_id: str) -> Optional[dict]:
    """Fetch pet profile with calculated attributes"""
    if not pet_id or not db:
        return None
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        return None
    
    # Calculate age category
    age_category = "adult"
    if pet.get("birth_date"):
        try:
            from dateutil import parser
            birth = parser.parse(pet["birth_date"])
            age_months = (datetime.now(timezone.utc) - birth.replace(tzinfo=timezone.utc)).days / 30
            if age_months < 12:
                age_category = "puppy"
            elif age_months > 84:
                age_category = "senior"
        except:
            pass
    
    # Calculate size category
    size_category = "medium"
    weight = pet.get("weight")
    if weight:
        if weight < 10:
            size_category = "small"
        elif weight < 25:
            size_category = "medium"
        elif weight < 45:
            size_category = "large"
        else:
            size_category = "giant"
    
    pet["age_category"] = age_category
    pet["size_category"] = size_category
    pet["health_conditions"] = pet.get("preferences", {}).get("health_conditions", [])
    pet["allergies"] = pet.get("preferences", {}).get("allergies", [])
    
    return pet


async def create_auto_tasks(order: dict, routing: dict, service_date: datetime) -> List[dict]:
    """Create automatic tasks based on routing rules"""
    tasks = []
    
    for task_template in routing.get("auto_create_tasks", []):
        offset_days = task_template.get("offset_days", 0)
        task_date = service_date + timedelta(days=offset_days)
        
        task = {
            "task_id": generate_task_id(),
            "order_id": order["order_id"],
            "type": task_template["type"],
            "title": task_template["title"],
            "status": "pending",
            "priority": order.get("priority", TaskPriority.NORMAL),
            "scheduled_date": task_date.isoformat(),
            "assignee_type": routing.get("default_assignee_type"),
            "assignee_id": None,
            "pet_id": order.get("pet_id"),
            "customer_id": order.get("customer_id"),
            "pillar": order.get("pillar"),
            "notes": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        tasks.append(task)
    
    return tasks


# ============== API ENDPOINTS ==============

@order_queue_router.post("/orders")
async def create_concierge_order(request: CreateOrderRequest):
    """Create a new Concierge® order with smart routing"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get routing rules for pillar
    routing = PILLAR_ROUTING.get(request.pillar, PILLAR_ROUTING["shop"])
    
    # Get pet profile if provided
    pet_profile = None
    if request.pet_id:
        pet_profile = await get_pet_profile(request.pet_id)
    
    # Calculate service date
    service_date = datetime.now(timezone.utc)
    if request.service_date:
        try:
            from dateutil import parser
            service_date = parser.parse(request.service_date)
            if service_date.tzinfo is None:
                service_date = service_date.replace(tzinfo=timezone.utc)
        except:
            pass
    
    # Calculate priority
    priority = calculate_priority(request.pillar, request.service_date, pet_profile)
    if routing.get("priority"):
        priority = routing["priority"]
    
    # Create order document
    order = {
        "order_id": generate_order_id(),
        "customer_id": request.customer_id,
        "pet_id": request.pet_id,
        "pet_profile": pet_profile,
        "items": request.items,
        "pillar": request.pillar,
        "status": OrderStatus.PENDING,
        "priority": priority,
        "service_date": service_date.isoformat(),
        "service_time": request.service_time,
        "delivery_address": request.delivery_address,
        "special_instructions": request.special_instructions,
        "source": request.source,
        "ticket_id": request.ticket_id,
        "routing": {
            "assignee_type": routing.get("default_assignee_type"),
            "requires_scheduling": routing.get("requires_scheduling"),
            "lead_time_days": routing.get("lead_time_days"),
        },
        "assignee": None,
        "timeline": [],
        "notes": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Create automatic tasks
    tasks = await create_auto_tasks(order, routing, service_date)
    order["tasks"] = [t["task_id"] for t in tasks]
    
    # Save to database
    await db.concierge_orders.insert_one(order)
    for task in tasks:
        await db.concierge_tasks.insert_one(task)
    
    # Add timeline entry
    await db.concierge_orders.update_one(
        {"order_id": order["order_id"]},
        {"$push": {"timeline": {
            "event": "order_created",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Order created via {request.source}",
            "tasks_created": len(tasks)
        }}}
    )
    
    # Link to service desk ticket if provided
    if request.ticket_id:
        await db.tickets.update_one(
            {"ticket_id": request.ticket_id},
            {"$set": {
                "concierge_order_id": order["order_id"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {
        "success": True,
        "order_id": order["order_id"],
        "status": order["status"],
        "priority": priority,
        "tasks_created": len(tasks),
        "routing": order["routing"]
    }


@order_queue_router.get("/orders")
async def get_concierge_orders(
    status: Optional[str] = None,
    pillar: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get Concierge® orders with filtering"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if status:
        query["status"] = status
    if pillar:
        query["pillar"] = pillar
    if priority:
        query["priority"] = priority
    if assignee_id:
        query["assignee.id"] = assignee_id
    
    orders = await db.concierge_orders.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.concierge_orders.count_documents(query)
    
    # Get summary stats
    stats = {
        "pending": await db.concierge_orders.count_documents({"status": "pending"}),
        "in_progress": await db.concierge_orders.count_documents({"status": "in_progress"}),
        "completed_today": await db.concierge_orders.count_documents({
            "status": "completed",
            "updated_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0).isoformat()}
        }),
        "urgent": await db.concierge_orders.count_documents({"priority": "urgent", "status": {"$nin": ["completed", "cancelled"]}}),
    }
    
    return {
        "orders": orders,
        "total": total,
        "stats": stats
    }


@order_queue_router.get("/orders/{order_id}")
async def get_order_details(order_id: str):
    """Get detailed order information including tasks"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    order = await db.concierge_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get associated tasks
    tasks = await db.concierge_tasks.find(
        {"order_id": order_id}, {"_id": 0}
    ).to_list(50)
    
    # Get linked ticket if any
    ticket = None
    if order.get("ticket_id"):
        ticket = await db.tickets.find_one(
            {"ticket_id": order["ticket_id"]}, 
            {"_id": 0, "ticket_id": 1, "subject": 1, "status": 1}
        )
    
    return {
        "order": order,
        "tasks": tasks,
        "linked_ticket": ticket
    }


@order_queue_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, notes: Optional[str] = None):
    """Update order status with timeline tracking"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    order = await db.concierge_orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order
    update = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    timeline_entry = {
        "event": f"status_changed_to_{status}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "previous_status": order.get("status"),
        "notes": notes
    }
    
    await db.concierge_orders.update_one(
        {"order_id": order_id},
        {
            "$set": update,
            "$push": {"timeline": timeline_entry}
        }
    )
    
    return {"success": True, "order_id": order_id, "status": status}


@order_queue_router.post("/orders/{order_id}/assign")
async def assign_order(order_id: str, request: AssignTaskRequest):
    """Assign order to staff/vendor"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    order = await db.concierge_orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    assignee = {
        "id": request.assignee_id,
        "type": request.assignee_type,
        "assigned_at": datetime.now(timezone.utc).isoformat(),
        "estimated_duration": request.estimated_duration
    }
    
    await db.concierge_orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "assignee": assignee,
                "status": OrderStatus.ASSIGNED,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"timeline": {
                "event": "order_assigned",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "assignee_id": request.assignee_id,
                "assignee_type": request.assignee_type,
                "notes": request.notes
            }}
        }
    )
    
    # Update related tasks
    await db.concierge_tasks.update_many(
        {"order_id": order_id, "assignee_id": None},
        {"$set": {
            "assignee_id": request.assignee_id,
            "assignee_type": request.assignee_type,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "order_id": order_id, "assignee": assignee}


@order_queue_router.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    task_type: Optional[str] = None,
    pillar: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50
):
    """Get Concierge® tasks for the task board"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if status:
        query["status"] = status
    if assignee_id:
        query["assignee_id"] = assignee_id
    if task_type:
        query["type"] = task_type
    if pillar:
        query["pillar"] = pillar
    if date:
        # Match tasks scheduled for specific date
        query["scheduled_date"] = {"$regex": f"^{date}"}
    
    tasks = await db.concierge_tasks.find(
        query, {"_id": 0}
    ).sort([("priority", -1), ("scheduled_date", 1)]).limit(limit).to_list(limit)
    
    # Get counts by status
    status_counts = {}
    for s in ["pending", "in_progress", "completed"]:
        status_counts[s] = await db.concierge_tasks.count_documents({"status": s})
    
    return {
        "tasks": tasks,
        "total": len(tasks),
        "by_status": status_counts
    }


@order_queue_router.put("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str, notes: Optional[str] = None):
    """Update task status"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    task = await db.concierge_tasks.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status == "completed":
        update["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.concierge_tasks.update_one(
        {"task_id": task_id},
        {
            "$set": update,
            "$push": {"notes": {
                "text": notes or f"Status changed to {status}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }}
        }
    )
    
    # Check if all tasks for order are complete
    order_id = task.get("order_id")
    if order_id and status == "completed":
        pending_tasks = await db.concierge_tasks.count_documents({
            "order_id": order_id,
            "status": {"$ne": "completed"}
        })
        
        if pending_tasks == 0:
            # All tasks complete - update order status
            await db.concierge_orders.update_one(
                {"order_id": order_id},
                {
                    "$set": {"status": OrderStatus.COMPLETED, "updated_at": datetime.now(timezone.utc).isoformat()},
                    "$push": {"timeline": {
                        "event": "all_tasks_completed",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }}
                }
            )
    
    return {"success": True, "task_id": task_id, "status": status}


@order_queue_router.get("/dashboard")
async def get_concierge_dashboard():
    """Get Concierge® dashboard summary"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Orders summary
    orders_summary = {
        "total_pending": await db.concierge_orders.count_documents({"status": "pending"}),
        "total_in_progress": await db.concierge_orders.count_documents({"status": "in_progress"}),
        "completed_today": await db.concierge_orders.count_documents({
            "status": "completed",
            "updated_at": {"$gte": today_start.isoformat()}
        }),
        "urgent_pending": await db.concierge_orders.count_documents({
            "priority": "urgent",
            "status": {"$nin": ["completed", "cancelled"]}
        }),
    }
    
    # Tasks summary
    tasks_summary = {
        "pending": await db.concierge_tasks.count_documents({"status": "pending"}),
        "in_progress": await db.concierge_tasks.count_documents({"status": "in_progress"}),
        "due_today": await db.concierge_tasks.count_documents({
            "scheduled_date": {"$regex": f"^{today_start.strftime('%Y-%m-%d')}"},
            "status": {"$ne": "completed"}
        }),
        "overdue": await db.concierge_tasks.count_documents({
            "scheduled_date": {"$lt": today_start.isoformat()},
            "status": {"$ne": "completed"}
        }),
    }
    
    # By pillar
    pillar_pipeline = [
        {"$match": {"status": {"$nin": ["completed", "cancelled"]}}},
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_pillar = await db.concierge_orders.aggregate(pillar_pipeline).to_list(20)
    
    # Recent orders
    recent_orders = await db.concierge_orders.find(
        {}, {"_id": 0, "order_id": 1, "pillar": 1, "status": 1, "priority": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "orders": orders_summary,
        "tasks": tasks_summary,
        "by_pillar": {p["_id"]: p["count"] for p in by_pillar if p["_id"]},
        "recent_orders": recent_orders
    }


@order_queue_router.post("/from-ticket/{ticket_id}")
async def create_order_from_ticket(ticket_id: str):
    """Create a Concierge® order from a service desk ticket"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get ticket
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        # Try service_desk_tickets collection
        ticket = await db.service_desk_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Extract customer info
    member = ticket.get("member", {})
    customer_id = member.get("id") or member.get("email") or "unknown"
    
    # Determine pillar from ticket
    pillar = ticket.get("pillar") or ticket.get("category") or "shop"
    
    # Create order request
    order_request = CreateOrderRequest(
        customer_id=customer_id,
        pet_id=ticket.get("pet_id"),
        items=[{
            "type": "service_request",
            "description": ticket.get("subject", "Service request from ticket"),
            "ticket_reference": ticket_id
        }],
        pillar=pillar,
        source="service_desk",
        ticket_id=ticket_id,
        special_instructions=ticket.get("description", "")
    )
    
    # Create the order
    result = await create_concierge_order(order_request)
    
    # Update ticket with order reference
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "concierge_order_id": result["order_id"],
            "status": "in_progress",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return result
