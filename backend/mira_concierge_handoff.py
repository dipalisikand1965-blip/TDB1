"""
Mira Concierge Handoff - Structured Task Creation
Summarize conversation → Confirm with user → Send to Concierge
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/concierge", tags=["mira-concierge"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggyconcierge")

def get_db():
    """Get database connection"""
    if not MONGO_URL:
        return None
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

class ConversationMessage(BaseModel):
    role: str  # user, assistant
    content: str

class HandoffRequest(BaseModel):
    session_id: str
    pet_id: str
    pet_name: str
    pet_breed: Optional[str] = None
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    member_email: Optional[str] = None
    member_phone: Optional[str] = None
    conversation_history: List[ConversationMessage]
    category: str  # boarding, grooming, travel, health, celebration, general
    urgency: str = "normal"  # low, normal, high, urgent

class HandoffSummary(BaseModel):
    summary: str
    key_requirements: List[str]
    pet_context: str
    recommended_action: str
    category: str
    urgency: str

class HandoffConfirmation(BaseModel):
    ticket_id: str
    summary: HandoffSummary
    status: str
    estimated_response: str
    whatsapp_link: Optional[str] = None

class ConciergeTask(BaseModel):
    ticket_id: str
    session_id: str
    pet_id: str
    pet_name: str
    pet_breed: Optional[str]
    member_id: Optional[str]
    member_name: Optional[str]
    member_email: Optional[str]
    member_phone: Optional[str]
    summary: str
    key_requirements: List[str]
    pet_context: str
    recommended_action: str
    category: str
    urgency: str
    conversation_history: List[dict]
    status: str
    created_at: str
    assigned_to: Optional[str] = None

def summarize_conversation(messages: List[ConversationMessage], pet_name: str, pet_breed: str) -> HandoffSummary:
    """
    Create a structured summary from conversation history
    """
    # Extract user messages
    user_messages = [m.content for m in messages if m.role == "user"]
    
    # Identify category from conversation
    all_text = " ".join(user_messages).lower()
    
    category = "general"
    if any(word in all_text for word in ["watch", "away", "boarding", "sitter", "care for"]):
        category = "boarding"
    elif any(word in all_text for word in ["groom", "haircut", "bath", "trim", "nail"]):
        category = "grooming"
    elif any(word in all_text for word in ["travel", "trip", "vacation", "flight", "road"]):
        category = "travel"
    elif any(word in all_text for word in ["birthday", "celebrate", "party", "anniversary"]):
        category = "celebration"
    elif any(word in all_text for word in ["sick", "vet", "health", "pain", "worried"]):
        category = "health"
    
    # Determine urgency
    urgency = "normal"
    if any(word in all_text for word in ["urgent", "emergency", "asap", "immediately", "today"]):
        urgency = "high"
    elif any(word in all_text for word in ["blood", "not eating", "collapse", "breathing"]):
        urgency = "urgent"
    
    # Build summary
    if len(user_messages) > 0:
        main_request = user_messages[0]
    else:
        main_request = "General inquiry"
    
    # Extract key requirements from conversation
    key_requirements = []
    for msg in user_messages:
        if len(msg) > 10:
            key_requirements.append(msg[:100] + "..." if len(msg) > 100 else msg)
    
    # Pet context
    pet_context = f"{pet_name} is a {pet_breed}." if pet_breed else f"Pet: {pet_name}"
    
    # Build summary text
    summary_text = f"Member needs help with {category} for {pet_name}. "
    if category == "boarding":
        summary_text += "Looking for trusted care while away."
    elif category == "grooming":
        summary_text += "Seeking grooming services."
    elif category == "travel":
        summary_text += "Planning travel with pet."
    elif category == "celebration":
        summary_text += "Planning a celebration or special occasion."
    elif category == "health":
        summary_text += "Has health-related concerns."
    
    # Recommended action
    action_map = {
        "boarding": "Find trusted local pet sitters or boarding facilities matching pet's needs",
        "grooming": "Schedule grooming appointment with a qualified groomer",
        "travel": "Coordinate travel arrangements including pet-friendly accommodations",
        "celebration": "Plan and coordinate celebration details",
        "health": "Recommend appropriate vet consultation",
        "general": "Understand needs and provide personalized assistance"
    }
    
    return HandoffSummary(
        summary=summary_text,
        key_requirements=key_requirements[:5],  # Max 5 requirements
        pet_context=pet_context,
        recommended_action=action_map.get(category, action_map["general"]),
        category=category,
        urgency=urgency
    )

@router.post("/summarize", response_model=HandoffSummary)
async def create_summary(request: HandoffRequest):
    """
    Step 1: Create a summary of the conversation for user confirmation
    """
    try:
        summary = summarize_conversation(
            request.conversation_history,
            request.pet_name,
            request.pet_breed
        )
        
        # Override with request values if provided
        if request.category != "general":
            summary.category = request.category
        if request.urgency != "normal":
            summary.urgency = request.urgency
        
        logger.info(f"[HANDOFF] Created summary for {request.pet_name}: {summary.category}")
        
        return summary
        
    except Exception as e:
        logger.error(f"[HANDOFF] Summary creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm", response_model=HandoffConfirmation)
async def confirm_and_send(request: HandoffRequest):
    """
    Step 2: User confirms → Create ticket and send to Concierge
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Create summary
        summary = summarize_conversation(
            request.conversation_history,
            request.pet_name,
            request.pet_breed
        )
        
        # Override with request values
        if request.category and request.category != "general":
            summary.category = request.category
        if request.urgency and request.urgency != "normal":
            summary.urgency = request.urgency
        
        # Generate ticket ID
        ticket_id = f"CNC-{int(datetime.now().timestamp())}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Create concierge task document
        task_doc = {
            "ticket_id": ticket_id,
            "session_id": request.session_id,
            "pet_id": request.pet_id,
            "pet_name": request.pet_name,
            "pet_breed": request.pet_breed,
            "member_id": request.member_id,
            "member_name": request.member_name,
            "member_email": request.member_email,
            "member_phone": request.member_phone,
            "summary": summary.summary,
            "key_requirements": summary.key_requirements,
            "pet_context": summary.pet_context,
            "recommended_action": summary.recommended_action,
            "category": summary.category,
            "urgency": summary.urgency,
            "conversation_history": [m.dict() for m in request.conversation_history],
            "status": "open",
            "source": "mira_handoff",
            "created_at": now,
            "updated_at": now,
            "assigned_to": None,
            "resolution": None
        }
        
        # Save to database
        await db.concierge_tasks.insert_one(task_doc)
        
        # Also create a notification for the concierge team
        notification_doc = {
            "type": "new_task",
            "ticket_id": ticket_id,
            "category": summary.category,
            "urgency": summary.urgency,
            "pet_name": request.pet_name,
            "summary": summary.summary[:100],
            "created_at": now,
            "read": False
        }
        await db.concierge_notifications.insert_one(notification_doc)
        
        # Determine estimated response time
        response_times = {
            "urgent": "Within 30 minutes",
            "high": "Within 1-2 hours",
            "normal": "Within 4-6 hours",
            "low": "Within 24 hours"
        }
        estimated_response = response_times.get(summary.urgency, "Within 4-6 hours")
        
        # WhatsApp link for immediate contact
        whatsapp_number = "919876543210"  # Replace with actual number
        whatsapp_message = f"Hi! I need help with {summary.category} for {request.pet_name}. Ticket: {ticket_id}"
        whatsapp_link = f"https://wa.me/{whatsapp_number}?text={whatsapp_message.replace(' ', '%20')}"
        
        logger.info(f"[HANDOFF] Ticket created: {ticket_id} for {request.pet_name}")
        
        return HandoffConfirmation(
            ticket_id=ticket_id,
            summary=summary,
            status="sent_to_concierge",
            estimated_response=estimated_response,
            whatsapp_link=whatsapp_link
        )
        
    except Exception as e:
        logger.error(f"[HANDOFF] Confirmation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/task/{ticket_id}")
async def get_task(ticket_id: str):
    """
    Get task details by ticket ID
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        task = await db.concierge_tasks.find_one(
            {"ticket_id": ticket_id},
            {"_id": 0}
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[HANDOFF] Failed to get task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/open")
async def get_open_tasks(category: str = None, urgency: str = None, limit: int = 50):
    """
    Get all open concierge tasks (for dashboard)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        query = {"status": "open"}
        if category:
            query["category"] = category
        if urgency:
            query["urgency"] = urgency
        
        # Sort by urgency then created_at
        urgency_order = {"urgent": 0, "high": 1, "normal": 2, "low": 3}
        
        cursor = db.concierge_tasks.find(
            query,
            {"_id": 0, "conversation_history": 0}  # Exclude large fields
        ).sort("created_at", -1).limit(limit)
        
        tasks = await cursor.to_list(length=limit)
        
        # Sort by urgency
        tasks.sort(key=lambda t: urgency_order.get(t.get("urgency", "normal"), 2))
        
        return {
            "tasks": tasks,
            "count": len(tasks)
        }
        
    except Exception as e:
        logger.error(f"[HANDOFF] Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/task/{ticket_id}/status")
async def update_task_status(ticket_id: str, status: str, resolution: str = None):
    """
    Update task status (for concierge to mark complete)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    valid_statuses = ["open", "in_progress", "waiting_customer", "resolved", "closed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        update_doc = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if resolution:
            update_doc["resolution"] = resolution
        
        result = await db.concierge_tasks.update_one(
            {"ticket_id": ticket_id},
            {"$set": update_doc}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"ticket_id": ticket_id, "status": status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[HANDOFF] Failed to update task: {e}")
        raise HTTPException(status_code=500, detail=str(e))
