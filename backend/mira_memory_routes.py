"""
Mira Memory API Routes
======================
Endpoints for managing relationship memories.

Manual Controls:
- Pet parent can: View memory categories, Edit/correct, Clear specific items
- Concierge can: Flag memory as "critical", Suppress from auto-recall
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import logging

from mira_memory import (
    MiraMemory, 
    MemoryExtractor, 
    MEMORY_TYPES,
    format_memories_for_prompt
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/memory", tags=["mira-memory"])

# Database reference
_db = None

def set_memory_routes_db(db):
    global _db
    _db = db
    from mira_memory import set_memory_db
    set_memory_db(db)

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ============== MODELS ==============

class MemoryCreate(BaseModel):
    content: str
    memory_type: str = "general"  # event, health, shopping, general
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    relevance_tags: List[str] = []
    source: str = "user-stated"  # user-stated, conversation, concierge-noted
    confidence: str = "high"

class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    is_critical: Optional[bool] = None
    suppress_auto_recall: Optional[bool] = None
    relevance_tags: Optional[List[str]] = None

class MemoryBulkAction(BaseModel):
    memory_ids: List[str]
    action: str  # delete, flag_critical, suppress, unsuppress


# ============== PET PARENT ROUTES ==============

@router.get("/me")
async def get_my_memories(
    memory_type: Optional[str] = None,
    pet_id: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Get all memories for the authenticated pet parent.
    Grouped by type for easy viewing.
    """
    from mira_routes import get_user_from_token
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    member_id = user.get("email") or user.get("id")
    
    memories = await MiraMemory.get_all_memories(
        member_id=member_id,
        memory_type=memory_type,
        pet_id=pet_id
    )
    
    # Group by type
    grouped = {mtype: [] for mtype in MEMORY_TYPES.keys()}
    
    for memory in memories:
        mtype = memory.get("memory_type", "general")
        if mtype in grouped:
            grouped[mtype].append(memory)
    
    # Add type metadata
    result = {}
    for mtype, items in grouped.items():
        result[mtype] = {
            "info": MEMORY_TYPES[mtype],
            "memories": items,
            "count": len(items)
        }
    
    return {
        "member_id": member_id,
        "total_memories": len(memories),
        "by_type": result
    }


@router.post("/me")
async def add_my_memory(
    memory: MemoryCreate,
    authorization: Optional[str] = Header(None)
):
    """
    Add a memory manually (pet parent adding their own note).
    """
    from mira_routes import get_user_from_token
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    member_id = user.get("email") or user.get("id")
    
    # Validate memory type
    if memory.memory_type not in MEMORY_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid memory type. Must be one of: {list(MEMORY_TYPES.keys())}")
    
    memory_id = await MiraMemory.store_memory(
        member_id=member_id,
        memory_type=memory.memory_type,
        content=memory.content,
        pet_id=memory.pet_id,
        pet_name=memory.pet_name,
        relevance_tags=memory.relevance_tags,
        source=memory.source,
        confidence=memory.confidence
    )


@router.get("/pet/{pet_id}")
async def get_pet_memories(
    pet_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get all memories for a specific pet - for display on pet profile page.
    Returns memories grouped by type with formatted display.
    """
    from mira_routes import get_user_from_token
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    member_id = user.get("email") or user.get("id")
    db = get_db()
    
    # Get pet info
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "breed": 1})
    
    # Get memories for this pet
    query = {
        "member_id": member_id,
        "is_active": {"$ne": False},
        "$or": [
            {"pet_id": pet_id},
            {"pet_name": pet.get("name") if pet else None}
        ]
    }
    
    memories = await db.mira_memories.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Group by type
    grouped = {mtype: [] for mtype in MEMORY_TYPES.keys()}
    for memory in memories:
        mtype = memory.get("memory_type", "general")
        if mtype in grouped:
            # Format for display
            grouped[mtype].append({
                "id": memory.get("memory_id"),
                "content": memory.get("content"),
                "source": memory.get("source"),
                "confidence": memory.get("confidence"),
                "created_at": memory.get("created_at"),
                "is_critical": memory.get("is_critical", False),
                "relevance_tags": memory.get("relevance_tags", [])
            })
    
    # Build response with type info
    result = {}
    for mtype, items in grouped.items():
        if items:  # Only include types with memories
            result[mtype] = {
                "name": MEMORY_TYPES[mtype]["name"],
                "icon": MEMORY_TYPES[mtype]["icon"],
                "memories": items,
                "count": len(items)
            }
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name") if pet else None,
        "total_memories": len(memories),
        "by_type": result,
        "memory_types": MEMORY_TYPES
    }
    
    return {
        "success": True,
        "memory_id": memory_id,
        "message": "Memory stored successfully"
    }


@router.put("/me/{memory_id}")
async def update_my_memory(
    memory_id: str,
    updates: MemoryUpdate,
    authorization: Optional[str] = Header(None)
):
    """
    Update a memory (pet parent correcting their own memory).
    """
    from mira_routes import get_user_from_token
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    member_id = user.get("email") or user.get("id")
    
    # Verify ownership
    db = get_db()
    memory = await db.mira_memories.find_one({"memory_id": memory_id, "member_id": member_id})
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found or access denied")
    
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    
    success = await MiraMemory.update_memory(
        memory_id=memory_id,
        updates=update_dict,
        updated_by="pet_parent"
    )
    
    return {"success": success, "memory_id": memory_id}


@router.delete("/me/{memory_id}")
async def delete_my_memory(
    memory_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Delete a memory (soft delete - mark as inactive).
    """
    from mira_routes import get_user_from_token
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    member_id = user.get("email") or user.get("id")
    
    # Verify ownership
    db = get_db()
    memory = await db.mira_memories.find_one({"memory_id": memory_id, "member_id": member_id})
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found or access denied")
    
    success = await MiraMemory.soft_delete_memory(memory_id, deleted_by="pet_parent")
    
    return {"success": success, "memory_id": memory_id, "message": "Memory cleared"}


# ============== ADMIN/CONCIERGE ROUTES ==============

@router.get("/admin/member/{member_id}")
async def admin_get_member_memories(
    member_id: str,
    memory_type: Optional[str] = None,
    include_inactive: bool = False
):
    """
    Admin view: Get all memories for a specific member.
    """
    memories = await MiraMemory.get_all_memories(
        member_id=member_id,
        memory_type=memory_type,
        include_inactive=include_inactive
    )
    
    # Group by type with metadata
    grouped = {}
    for mtype in MEMORY_TYPES.keys():
        type_memories = [m for m in memories if m.get("memory_type") == mtype]
        grouped[mtype] = {
            "info": MEMORY_TYPES[mtype],
            "memories": type_memories,
            "count": len(type_memories),
            "critical_count": len([m for m in type_memories if m.get("is_critical")]),
            "suppressed_count": len([m for m in type_memories if m.get("suppress_auto_recall")])
        }
    
    return {
        "member_id": member_id,
        "total_memories": len(memories),
        "by_type": grouped
    }


@router.post("/admin/member/{member_id}")
async def admin_add_member_memory(
    member_id: str,
    memory: MemoryCreate
):
    """
    Admin: Add a memory note for a member (concierge-noted).
    """
    memory_id = await MiraMemory.store_memory(
        member_id=member_id,
        memory_type=memory.memory_type,
        content=memory.content,
        pet_id=memory.pet_id,
        pet_name=memory.pet_name,
        relevance_tags=memory.relevance_tags,
        source="concierge-noted",
        confidence=memory.confidence
    )
    
    return {
        "success": True,
        "memory_id": memory_id,
        "message": "Memory added by concierge"
    }


@router.put("/admin/{memory_id}/flag-critical")
async def admin_flag_critical(memory_id: str):
    """
    Admin: Flag a memory as critical (always surfaces).
    """
    success = await MiraMemory.flag_as_critical(memory_id, flagged_by="concierge")
    
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    return {"success": True, "memory_id": memory_id, "message": "Memory flagged as critical"}


@router.put("/admin/{memory_id}/suppress")
async def admin_suppress_memory(memory_id: str):
    """
    Admin: Suppress a memory from auto-recall.
    """
    success = await MiraMemory.suppress_recall(memory_id, suppressed_by="concierge")
    
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    return {"success": True, "memory_id": memory_id, "message": "Memory suppressed from auto-recall"}


@router.put("/admin/{memory_id}/unsuppress")
async def admin_unsuppress_memory(memory_id: str):
    """
    Admin: Re-enable auto-recall for a suppressed memory.
    """
    success = await MiraMemory.update_memory(
        memory_id=memory_id,
        updates={"suppress_auto_recall": False},
        updated_by="concierge"
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    return {"success": True, "memory_id": memory_id, "message": "Memory unsuppressed"}


@router.post("/admin/bulk")
async def admin_bulk_action(action: MemoryBulkAction):
    """
    Admin: Perform bulk actions on memories.
    """
    results = []
    
    for memory_id in action.memory_ids:
        try:
            if action.action == "delete":
                success = await MiraMemory.soft_delete_memory(memory_id, deleted_by="concierge")
            elif action.action == "flag_critical":
                success = await MiraMemory.flag_as_critical(memory_id, flagged_by="concierge")
            elif action.action == "suppress":
                success = await MiraMemory.suppress_recall(memory_id, suppressed_by="concierge")
            elif action.action == "unsuppress":
                success = await MiraMemory.update_memory(memory_id, {"suppress_auto_recall": False}, "concierge")
            else:
                success = False
            
            results.append({"memory_id": memory_id, "success": success})
        except Exception as e:
            results.append({"memory_id": memory_id, "success": False, "error": str(e)})
    
    return {
        "action": action.action,
        "total": len(action.memory_ids),
        "successful": len([r for r in results if r.get("success")]),
        "results": results
    }


# ============== INTERNAL ROUTES (used by Mira AI) ==============

@router.get("/internal/relevant")
async def get_relevant_memories_internal(
    member_id: str,
    context: str,
    pet_id: Optional[str] = None,
    limit: int = 5
):
    """
    Internal: Get contextually relevant memories for Mira to surface.
    Called by the Mira chat endpoint.
    """
    memories = await MiraMemory.get_relevant_memories(
        member_id=member_id,
        current_context=context,
        pet_id=pet_id,
        limit=limit
    )
    
    # Mark as surfaced
    for memory in memories:
        await MiraMemory.surface_memory(memory.get("memory_id"))
    
    return {
        "memories": memories,
        "formatted_prompt": format_memories_for_prompt(memories)
    }


@router.post("/internal/extract")
async def extract_memories_internal(
    user_message: str,
    ai_response: str,
    member_id: str,
    pet_id: Optional[str] = None,
    pet_name: Optional[str] = None,
    session_id: Optional[str] = None
):
    """
    Internal: Extract and store memories from a conversation turn.
    Called after each Mira chat response.
    """
    extracted = await MemoryExtractor.extract_memories_from_conversation(
        user_message=user_message,
        ai_response=ai_response,
        member_id=member_id,
        pet_id=pet_id,
        pet_name=pet_name,
        session_id=session_id
    )
    
    stored_ids = []
    for memory in extracted:
        memory_id = await MiraMemory.store_memory(
            member_id=member_id,
            memory_type=memory["memory_type"],
            content=memory["content"],
            pet_id=pet_id,
            pet_name=pet_name,
            context=memory.get("context"),
            relevance_tags=memory.get("relevance_tags", []),
            source=memory.get("source", "conversation"),
            confidence=memory.get("confidence", "medium"),
            session_id=session_id
        )
        stored_ids.append(memory_id)
    
    return {
        "extracted_count": len(extracted),
        "stored_ids": stored_ids,
        "memories": extracted
    }


# ============== STATS ==============

@router.get("/stats")
async def get_memory_stats():
    """
    Get overall memory statistics.
    """
    db = get_db()
    
    total = await db.mira_memories.count_documents({"is_active": True})
    
    by_type = {}
    for mtype in MEMORY_TYPES.keys():
        by_type[mtype] = await db.mira_memories.count_documents({
            "memory_type": mtype,
            "is_active": True
        })
    
    critical = await db.mira_memories.count_documents({"is_critical": True, "is_active": True})
    suppressed = await db.mira_memories.count_documents({"suppress_auto_recall": True, "is_active": True})
    
    # Members with memories
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$member_id"}},
        {"$count": "total"}
    ]
    result = await db.mira_memories.aggregate(pipeline).to_list(1)
    members_with_memories = result[0]["total"] if result else 0
    
    return {
        "total_memories": total,
        "by_type": by_type,
        "critical_memories": critical,
        "suppressed_memories": suppressed,
        "members_with_memories": members_with_memories,
        "memory_types": MEMORY_TYPES
    }
