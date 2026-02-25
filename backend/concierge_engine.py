"""
Concierge Notes Engine for The Doggy Company
Internal notes for customers and pets - visible across all pillars
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

# Security
security = HTTPBasic()
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

# Create router
concierge_router = APIRouter(prefix="/api/concierge", tags=["Concierge Notes"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class NoteCreate(BaseModel):
    """Create a new concierge note"""
    content: str
    category: str = "general"  # general, dietary, delivery, preference, allergy, medical, vip, alert
    priority: str = "normal"  # low, normal, high, urgent
    pillar: Optional[str] = None  # If specific to a pillar, else global
    is_pinned: bool = False

class NoteUpdate(BaseModel):
    """Update an existing note"""
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_resolved: Optional[bool] = None


# ==================== NOTE CATEGORIES ====================

NOTE_CATEGORIES = {
    "general": {"label": "General", "emoji": "📝", "color": "gray"},
    "dietary": {"label": "Dietary", "emoji": "🍖", "color": "orange"},
    "allergy": {"label": "Allergy/Medical", "emoji": "⚠️", "color": "red"},
    "delivery": {"label": "Delivery Preference", "emoji": "🚗", "color": "blue"},
    "preference": {"label": "Preference", "emoji": "⭐", "color": "yellow"},
    "vip": {"label": "VIP Treatment", "emoji": "👑", "color": "purple"},
    "alert": {"label": "Alert", "emoji": "🚨", "color": "red"},
    "celebration": {"label": "Celebration", "emoji": "🎉", "color": "pink"},
    "feedback": {"label": "Customer Feedback", "emoji": "💬", "color": "teal"},
}

NOTE_PRIORITIES = {
    "low": {"label": "Low", "color": "gray"},
    "normal": {"label": "Normal", "color": "blue"},
    "high": {"label": "High", "color": "orange"},
    "urgent": {"label": "Urgent", "color": "red"},
}


# ==================== CORE FUNCTIONS ====================

async def add_note(
    entity_type: str,  # "pet" or "customer"
    entity_id: str,
    content: str,
    category: str = "general",
    priority: str = "normal",
    pillar: Optional[str] = None,
    is_pinned: bool = False,
    created_by: str = "admin"
) -> Dict[str, Any]:
    """Add a concierge note to a pet or customer"""
    
    note = {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "content": content,
        "category": category,
        "priority": priority,
        "pillar": pillar,  # None means global (visible in all pillars)
        "is_pinned": is_pinned,
        "is_resolved": False,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    result = await db.concierge_notes.insert_one(note)
    note["id"] = str(result.inserted_id)
    if "_id" in note:
        del note["_id"]
    
    # Also update the entity with a flag for quick filtering
    collection = db.pets if entity_type == "pet" else db.users
    await collection.update_one(
        {"_id": ObjectId(entity_id)} if ObjectId.is_valid(entity_id) else {"id": entity_id},
        {"$set": {"has_concierge_notes": True}}
    )
    
    logger.info(f"Concierge note added for {entity_type}/{entity_id}")
    return note


async def get_notes(
    entity_type: str,
    entity_id: str,
    pillar: Optional[str] = None,
    include_resolved: bool = False
) -> List[Dict]:
    """Get all notes for a pet or customer"""
    
    query = {
        "entity_type": entity_type,
        "entity_id": entity_id
    }
    
    if not include_resolved:
        query["is_resolved"] = {"$ne": True}
    
    # Filter by pillar (include global notes + pillar-specific)
    if pillar:
        query["$or"] = [
            {"pillar": None},
            {"pillar": pillar}
        ]
    
    notes = await db.concierge_notes.find(query).sort([
        ("is_pinned", -1),
        ("priority", -1),
        ("created_at", -1)
    ]).to_list(100)
    
    # Convert ObjectId to string
    for note in notes:
        note["id"] = str(note.pop("_id"))
    
    return notes


async def get_alerts_for_order(order_data: Dict) -> List[Dict]:
    """Get relevant concierge alerts for an order"""
    alerts = []
    
    # Get customer ID
    customer = order_data.get("customer", {})
    user_id = order_data.get("user_id") or customer.get("user_id")
    
    # Get pet ID
    pet = order_data.get("pet", {})
    pet_id = pet.get("id") or pet.get("pet_id")
    
    # Get high-priority notes for customer
    if user_id:
        customer_notes = await db.concierge_notes.find({
            "entity_type": "customer",
            "entity_id": user_id,
            "is_resolved": {"$ne": True},
            "$or": [
                {"priority": {"$in": ["high", "urgent"]}},
                {"category": {"$in": ["allergy", "alert", "vip"]}},
                {"is_pinned": True}
            ]
        }).to_list(10)
        
        for note in customer_notes:
            note["id"] = str(note.pop("_id"))
            note["source"] = "customer"
            alerts.append(note)
    
    # Get high-priority notes for pet
    if pet_id:
        pet_notes = await db.concierge_notes.find({
            "entity_type": "pet",
            "entity_id": pet_id,
            "is_resolved": {"$ne": True},
            "$or": [
                {"priority": {"$in": ["high", "urgent"]}},
                {"category": {"$in": ["allergy", "alert", "dietary"]}},
                {"is_pinned": True}
            ]
        }).to_list(10)
        
        for note in pet_notes:
            note["id"] = str(note.pop("_id"))
            note["source"] = "pet"
            alerts.append(note)
    
    return alerts


# ==================== API ENDPOINTS ====================

@concierge_router.get("/categories")
async def get_categories():
    """Get all note categories"""
    return {
        "categories": NOTE_CATEGORIES,
        "priorities": NOTE_PRIORITIES
    }


@concierge_router.get("/pet/{pet_id}")
async def get_pet_notes(
    pet_id: str,
    pillar: Optional[str] = Query(None),
    include_resolved: bool = Query(False),
    username: str = Depends(verify_admin)
):
    """Get all concierge notes for a pet"""
    notes = await get_notes("pet", pet_id, pillar, include_resolved)
    return {"notes": notes, "count": len(notes)}


@concierge_router.post("/pet/{pet_id}")
async def add_pet_note(
    pet_id: str,
    note: NoteCreate,
    username: str = Depends(verify_admin)
):
    """Add a concierge note to a pet"""
    result = await add_note(
        entity_type="pet",
        entity_id=pet_id,
        content=note.content,
        category=note.category,
        priority=note.priority,
        pillar=note.pillar,
        is_pinned=note.is_pinned,
        created_by=username
    )
    return result


@concierge_router.get("/customer/{customer_id}")
async def get_customer_notes(
    customer_id: str,
    pillar: Optional[str] = Query(None),
    include_resolved: bool = Query(False),
    username: str = Depends(verify_admin)
):
    """Get all concierge notes for a customer"""
    notes = await get_notes("customer", customer_id, pillar, include_resolved)
    return {"notes": notes, "count": len(notes)}


@concierge_router.post("/customer/{customer_id}")
async def add_customer_note(
    customer_id: str,
    note: NoteCreate,
    username: str = Depends(verify_admin)
):
    """Add a concierge note to a customer"""
    result = await add_note(
        entity_type="customer",
        entity_id=customer_id,
        content=note.content,
        category=note.category,
        priority=note.priority,
        pillar=note.pillar,
        is_pinned=note.is_pinned,
        created_by=username
    )
    return result


@concierge_router.put("/note/{note_id}")
async def update_note(
    note_id: str,
    update: NoteUpdate,
    username: str = Depends(verify_admin)
):
    """Update a concierge note"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = username
    
    result = await db.concierge_notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note updated", "note_id": note_id}


@concierge_router.delete("/note/{note_id}")
async def delete_note(note_id: str, username: str = Depends(verify_admin)):
    """Delete a concierge note"""
    result = await db.concierge_notes.delete_one({"_id": ObjectId(note_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted", "note_id": note_id}


@concierge_router.post("/note/{note_id}/resolve")
async def resolve_note(note_id: str, username: str = Depends(verify_admin)):
    """Mark a note as resolved"""
    await db.concierge_notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {
            "is_resolved": True,
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolved_by": username
        }}
    )
    return {"message": "Note resolved", "note_id": note_id}


@concierge_router.post("/note/{note_id}/pin")
async def toggle_pin_note(note_id: str, username: str = Depends(verify_admin)):
    """Toggle pin status of a note"""
    note = await db.concierge_notes.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    new_status = not note.get("is_pinned", False)
    await db.concierge_notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {"is_pinned": new_status}}
    )
    return {"message": f"Note {'pinned' if new_status else 'unpinned'}", "is_pinned": new_status}


@concierge_router.get("/order/{order_id}/alerts")
async def get_order_alerts(order_id: str, username: str = Depends(verify_admin)):
    """Get concierge alerts relevant to an order"""
    # Find the order
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    alerts = await get_alerts_for_order(order)
    return {"alerts": alerts, "count": len(alerts), "order_id": order_id}


@concierge_router.get("/search")
async def search_notes(
    query: str = Query(..., min_length=2),
    entity_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    username: str = Depends(verify_admin)
):
    """Search concierge notes"""
    search_query = {
        "content": {"$regex": query, "$options": "i"}
    }
    
    if entity_type:
        search_query["entity_type"] = entity_type
    if category:
        search_query["category"] = category
    
    notes = await db.concierge_notes.find(search_query).sort("created_at", -1).limit(50).to_list(50)
    
    for note in notes:
        note["id"] = str(note.pop("_id"))
    
    return {"notes": notes, "count": len(notes)}


@concierge_router.get("/stats")
async def get_notes_stats(username: str = Depends(verify_admin)):
    """Get concierge notes statistics"""
    
    # Count by category
    category_pipeline = [
        {"$match": {"is_resolved": {"$ne": True}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    by_category = await db.concierge_notes.aggregate(category_pipeline).to_list(20)
    
    # Count by priority
    priority_pipeline = [
        {"$match": {"is_resolved": {"$ne": True}}},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    by_priority = await db.concierge_notes.aggregate(priority_pipeline).to_list(10)
    
    # Count by entity type
    entity_pipeline = [
        {"$match": {"is_resolved": {"$ne": True}}},
        {"$group": {"_id": "$entity_type", "count": {"$sum": 1}}}
    ]
    by_entity = await db.concierge_notes.aggregate(entity_pipeline).to_list(10)
    
    # Total counts
    total_active = await db.concierge_notes.count_documents({"is_resolved": {"$ne": True}})
    total_resolved = await db.concierge_notes.count_documents({"is_resolved": True})
    total_urgent = await db.concierge_notes.count_documents({
        "is_resolved": {"$ne": True},
        "priority": "urgent"
    })
    total_pinned = await db.concierge_notes.count_documents({
        "is_resolved": {"$ne": True},
        "is_pinned": True
    })
    
    return {
        "total_active": total_active,
        "total_resolved": total_resolved,
        "total_urgent": total_urgent,
        "total_pinned": total_pinned,
        "by_category": {item["_id"]: item["count"] for item in by_category},
        "by_priority": {item["_id"]: item["count"] for item in by_priority},
        "by_entity_type": {item["_id"]: item["count"] for item in by_entity}
    }
