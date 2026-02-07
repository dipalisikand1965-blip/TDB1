"""
Mira Remember Command - Pet Memory System
Allows users to store and recall pet-specific memories
"/remember Buddy is scared of thunder"
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/memory", tags=["mira-memory"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggyconcierge")

def get_db():
    """Get database connection"""
    if not MONGO_URL:
        return None
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# Memory categories
MEMORY_CATEGORIES = [
    "fear",           # "scared of thunder"
    "preference",     # "loves peanut butter"
    "health",         # "has chicken allergy"
    "routine",        # "walks at 7am"
    "behavior",       # "gets anxious when alone"
    "food",           # "favorite treat is banana"
    "social",         # "loves playing with other dogs"
    "general"         # catch-all
]

class MemoryRequest(BaseModel):
    pet_id: str
    memory_text: str
    category: Optional[str] = "general"
    source: str = "user"  # user, mira, concierge

class MemoryResponse(BaseModel):
    memory_id: str
    pet_id: str
    memory_text: str
    category: str
    created_at: str
    source: str

class PetMemories(BaseModel):
    pet_id: str
    memories: List[dict]
    count: int

def classify_memory(text: str) -> str:
    """Auto-classify memory based on keywords"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["scared", "afraid", "fear", "thunder", "firework", "noise", "anxious"]):
        return "fear"
    elif any(word in text_lower for word in ["loves", "favorite", "enjoys", "likes", "prefers"]):
        return "preference"
    elif any(word in text_lower for word in ["allergy", "allergic", "sensitive", "condition", "medication", "health"]):
        return "health"
    elif any(word in text_lower for word in ["morning", "evening", "routine", "daily", "every day", "walk", "feed"]):
        return "routine"
    elif any(word in text_lower for word in ["behavior", "does", "always", "never", "tends to"]):
        return "behavior"
    elif any(word in text_lower for word in ["food", "treat", "eat", "snack", "meal"]):
        return "food"
    elif any(word in text_lower for word in ["play", "friend", "dog", "cat", "people", "social"]):
        return "social"
    else:
        return "general"

@router.post("/remember", response_model=MemoryResponse)
async def remember(request: MemoryRequest):
    """
    Store a new memory for a pet
    Usage: "/remember Buddy is scared of thunder"
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Auto-classify if not provided
        category = request.category
        if category == "general":
            category = classify_memory(request.memory_text)
        
        memory_id = f"mem-{int(datetime.now().timestamp() * 1000)}"
        
        memory_doc = {
            "memory_id": memory_id,
            "pet_id": request.pet_id,
            "memory_text": request.memory_text,
            "category": category,
            "source": request.source,
            "created_at": now,
            "updated_at": now,
            "active": True
        }
        
        await db.pet_memories.insert_one(memory_doc)
        
        # Also update the pet's profile with this memory summary
        await db.pets.update_one(
            {"id": request.pet_id},
            {
                "$push": {
                    "memories": {
                        "text": request.memory_text,
                        "category": category,
                        "date": now
                    }
                },
                "$set": {"updated_at": now}
            }
        )
        
        logger.info(f"[MEMORY] Stored memory for pet {request.pet_id}: {request.memory_text[:50]}...")
        
        return MemoryResponse(
            memory_id=memory_id,
            pet_id=request.pet_id,
            memory_text=request.memory_text,
            category=category,
            created_at=now,
            source=request.source
        )
        
    except Exception as e:
        logger.error(f"[MEMORY] Failed to store memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pet/{pet_id}", response_model=PetMemories)
async def get_pet_memories(pet_id: str, category: Optional[str] = None, limit: int = 50):
    """
    Get all memories for a pet
    Optionally filter by category
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        query = {"pet_id": pet_id, "active": True}
        if category:
            query["category"] = category
        
        cursor = db.pet_memories.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit)
        
        memories = await cursor.to_list(length=limit)
        
        return PetMemories(
            pet_id=pet_id,
            memories=memories,
            count=len(memories)
        )
        
    except Exception as e:
        logger.error(f"[MEMORY] Failed to get memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pet/{pet_id}/context")
async def get_memory_context(pet_id: str):
    """
    Get a summarized context string of all memories for LLM prompt injection
    """
    db = get_db()
    if db is None:
        return {"context": "", "count": 0}
    
    try:
        cursor = db.pet_memories.find(
            {"pet_id": pet_id, "active": True},
            {"_id": 0, "memory_text": 1, "category": 1}
        ).sort("created_at", -1).limit(20)
        
        memories = await cursor.to_list(length=20)
        
        if not memories:
            return {"context": "", "count": 0}
        
        # Group by category
        by_category = {}
        for m in memories:
            cat = m.get("category", "general")
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(m["memory_text"])
        
        # Build context string
        context_parts = []
        for cat, items in by_category.items():
            context_parts.append(f"[{cat.upper()}]: {'; '.join(items)}")
        
        context = "\n".join(context_parts)
        
        return {
            "context": context,
            "count": len(memories),
            "categories": list(by_category.keys())
        }
        
    except Exception as e:
        logger.error(f"[MEMORY] Failed to get context: {e}")
        return {"context": "", "count": 0}

@router.delete("/pet/{pet_id}/{memory_id}")
async def forget_memory(pet_id: str, memory_id: str):
    """
    Soft-delete a memory (set active=False)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        result = await db.pet_memories.update_one(
            {"memory_id": memory_id, "pet_id": pet_id},
            {"$set": {"active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        return {"status": "forgotten", "memory_id": memory_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[MEMORY] Failed to delete memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for Mira to use when generating responses
async def get_memories_for_prompt(pet_id: str) -> str:
    """
    Get memories formatted for injection into Mira's LLM prompt
    """
    db = get_db()
    if db is None:
        return ""
    
    try:
        cursor = db.pet_memories.find(
            {"pet_id": pet_id, "active": True},
            {"_id": 0, "memory_text": 1}
        ).sort("created_at", -1).limit(10)
        
        memories = await cursor.to_list(length=10)
        
        if not memories:
            return ""
        
        memory_texts = [m["memory_text"] for m in memories]
        return "REMEMBERED ABOUT THIS PET:\n- " + "\n- ".join(memory_texts)
        
    except Exception:
        return ""
