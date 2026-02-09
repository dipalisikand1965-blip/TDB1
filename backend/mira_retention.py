"""
MIRA CHAT RETENTION SYSTEM
==========================
Golden Standard Implementation:
- Hot: Last 30 days - Full messages
- Warm: 30-90 days - Compressed
- Cold: 90+ days - Summary only
- Delete: After 1 year

Keeps forever:
- Pet preferences & insights learned
- Concierge tickets
- Key decisions (purchases, bookings)
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

# ============== CONFIGURATION ==============

RETENTION_CONFIG = {
    "hot_days": 30,           # Full messages, instant access
    "warm_days": 90,          # Compressed, fast access
    "cold_days": 365,         # Summary only
    "delete_after_days": 730, # 2 years
    "max_messages_to_summarize": 50,
    "keep_last_n_full": 10,   # Always keep last 10 conversations full
}

# What to ALWAYS keep (never delete)
ALWAYS_KEEP = [
    "pet_preferences",
    "allergies",
    "health_records",
    "purchases",
    "bookings",
    "concierge_tickets",
    "user_preferences",
    "key_decisions",
]


# ============== SUMMARIZATION ==============

async def summarize_conversation(messages: List[Dict], pet_name: str = "pet") -> Dict:
    """
    Create an AI summary of a conversation.
    Extracts key intents, decisions, and learnings.
    """
    if not messages:
        return {"summary": "Empty conversation", "intents": [], "learnings": []}
    
    # Extract key information without AI (fast path)
    intents = []
    learnings = []
    key_topics = []
    products_discussed = []
    services_discussed = []
    
    for msg in messages:
        # Track intents
        if msg.get("intent"):
            intents.append(msg["intent"])
        
        # Track products
        if msg.get("products"):
            for p in msg["products"]:
                products_discussed.append(p.get("name", "Unknown product"))
        
        # Track services
        if msg.get("services"):
            for s in msg["services"]:
                services_discussed.append(s.get("name", "Unknown service"))
        
        # Track execution types (what Mira actually did)
        exec_type = msg.get("execution_type")
        if exec_type and exec_type not in ["clarify", "acknowledge"]:
            key_topics.append(exec_type)
    
    # Create summary
    user_messages = [m["content"] for m in messages if m.get("role") == "user"]
    first_user_msg = user_messages[0] if user_messages else "Unknown topic"
    
    # Deduplicate
    unique_intents = list(set(intents))
    unique_topics = list(set(key_topics))
    unique_products = list(set(products_discussed))[:5]  # Max 5
    
    summary = {
        "summary": f"Conversation about: {first_user_msg[:100]}",
        "message_count": len(messages),
        "intents": unique_intents[:5],
        "topics": unique_topics[:5],
        "products_discussed": unique_products,
        "services_discussed": list(set(services_discussed))[:5],
        "pet_name": pet_name,
        "first_message": first_user_msg[:200],
        "last_message": user_messages[-1][:200] if user_messages else "",
    }
    
    return summary


async def create_ai_summary(messages: List[Dict], pet_name: str, db) -> str:
    """
    Use AI to create a human-readable summary.
    Only called for important conversations.
    """
    try:
        # Build conversation text
        conv_text = ""
        for msg in messages[-20:]:  # Last 20 messages
            role = "User" if msg.get("role") == "user" else "Mira"
            content = msg.get("content", "")[:200]
            conv_text += f"{role}: {content}\n"
        
        # Use Emergent LLM for summarization
        from emergentintegrations.llm.chat import chat, UserMessage
        
        summary_prompt = f"""Summarize this pet care conversation in 2-3 sentences. 
Focus on: what the user wanted, what was discussed, any decisions made.
Pet name: {pet_name}

Conversation:
{conv_text}

Summary:"""
        
        response = await chat(
            api_key="sk-emergent-cEb0eF956Fa6741A31",
            model="gemini-2.0-flash",
            messages=[UserMessage(content=summary_prompt)],
        )
        
        return response.message.content.strip()
        
    except Exception as e:
        logger.warning(f"AI summarization failed: {e}")
        return f"Conversation about {pet_name} with {len(messages)} messages"


# ============== RETENTION ACTIONS ==============

async def archive_old_sessions(db) -> Dict[str, int]:
    """
    Main retention job - runs daily.
    Returns counts of actions taken.
    """
    now = datetime.now(timezone.utc)
    stats = {
        "summarized": 0,
        "compressed": 0,
        "archived": 0,
        "deleted": 0,
        "kept_important": 0,
    }
    
    # Calculate cutoff dates
    hot_cutoff = now - timedelta(days=RETENTION_CONFIG["hot_days"])
    warm_cutoff = now - timedelta(days=RETENTION_CONFIG["warm_days"])
    cold_cutoff = now - timedelta(days=RETENTION_CONFIG["cold_days"])
    delete_cutoff = now - timedelta(days=RETENTION_CONFIG["delete_after_days"])
    
    logger.info(f"Running retention job at {now}")
    logger.info(f"Hot cutoff: {hot_cutoff}, Warm: {warm_cutoff}, Cold: {cold_cutoff}, Delete: {delete_cutoff}")
    
    # 1. DELETE very old sessions (>2 years)
    delete_result = await db.mira_sessions.update_many(
        {
            "updated_at": {"$lt": delete_cutoff.isoformat()},
            "retention_status": {"$ne": "important"},
            "has_purchase": {"$ne": True},
            "has_booking": {"$ne": True},
        },
        {
            "$set": {
                "retention_status": "deleted",
                "messages": [],  # Clear messages but keep metadata
                "deleted_at": now.isoformat(),
            }
        }
    )
    stats["deleted"] = delete_result.modified_count
    
    # 2. ARCHIVE cold sessions (90-365 days) - Keep summary only
    cold_sessions = db.mira_sessions.find({
        "updated_at": {"$lt": warm_cutoff.isoformat(), "$gte": cold_cutoff.isoformat()},
        "retention_status": {"$nin": ["archived", "deleted", "important"]},
    })
    
    async for session in cold_sessions:
        # Create summary before archiving
        messages = session.get("messages", [])
        pet_name = session.get("pet_context", {}).get("pet_name", "pet")
        
        summary = await summarize_conversation(messages, pet_name)
        
        await db.mira_sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {
                    "retention_status": "archived",
                    "summary": summary,
                    "message_count": len(messages),
                    "messages": [],  # Clear full messages
                    "archived_at": now.isoformat(),
                }
            }
        )
        stats["archived"] += 1
    
    # 3. COMPRESS warm sessions (30-90 days) - Keep last 5 messages + summary
    warm_sessions = db.mira_sessions.find({
        "updated_at": {"$lt": hot_cutoff.isoformat(), "$gte": warm_cutoff.isoformat()},
        "retention_status": {"$nin": ["compressed", "archived", "deleted", "important"]},
    })
    
    async for session in warm_sessions:
        messages = session.get("messages", [])
        pet_name = session.get("pet_context", {}).get("pet_name", "pet")
        
        if len(messages) > 5:
            # Keep last 5, summarize the rest
            summary = await summarize_conversation(messages[:-5], pet_name)
            
            await db.mira_sessions.update_one(
                {"_id": session["_id"]},
                {
                    "$set": {
                        "retention_status": "compressed",
                        "summary": summary,
                        "messages": messages[-5:],  # Keep only last 5
                        "original_message_count": len(messages),
                        "compressed_at": now.isoformat(),
                    }
                }
            )
            stats["compressed"] += 1
    
    logger.info(f"Retention job complete: {stats}")
    return stats


async def mark_session_important(db, session_id: str, reason: str) -> bool:
    """
    Mark a session as important - will never be deleted.
    Use for: purchases, bookings, health records, etc.
    """
    result = await db.mira_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "retention_status": "important",
                "important_reason": reason,
                "marked_important_at": datetime.now(timezone.utc).isoformat(),
            }
        }
    )
    return result.modified_count > 0


async def extract_and_save_learnings(db, session_id: str, messages: List[Dict], pet_id: str) -> Dict:
    """
    Extract valuable learnings from a conversation and save to pet profile.
    This data is kept FOREVER.
    """
    learnings = {
        "preferences": [],
        "dislikes": [],
        "health_notes": [],
        "behavioral_notes": [],
    }
    
    # Analyze messages for learnings
    for msg in messages:
        content = msg.get("content", "").lower()
        
        # Detect preferences
        if any(word in content for word in ["loves", "favorite", "prefers", "enjoys", "likes"]):
            learnings["preferences"].append(msg.get("content", "")[:200])
        
        # Detect dislikes
        if any(word in content for word in ["hates", "doesn't like", "allergic", "avoid", "dislikes"]):
            learnings["dislikes"].append(msg.get("content", "")[:200])
        
        # Detect health notes
        if any(word in content for word in ["vet", "medicine", "vaccine", "health", "sick", "allergy"]):
            learnings["health_notes"].append(msg.get("content", "")[:200])
    
    # Save to pet profile if we found anything
    if any(learnings.values()):
        await db.pets.update_one(
            {"_id": ObjectId(pet_id) if ObjectId.is_valid(pet_id) else pet_id},
            {
                "$push": {
                    "mira_learnings": {
                        "session_id": session_id,
                        "learnings": learnings,
                        "extracted_at": datetime.now(timezone.utc).isoformat(),
                    }
                }
            }
        )
    
    return learnings


# ============== QUERY FUNCTIONS ==============

async def get_session_with_retention(db, session_id: str) -> Optional[Dict]:
    """
    Get a session, handling different retention states.
    Returns full messages for hot, partial for warm, summary for cold.
    """
    session = await db.mira_sessions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    status = session.get("retention_status", "hot")
    
    if status == "deleted":
        return {
            "session_id": session_id,
            "status": "deleted",
            "message": "This conversation has been archived and is no longer available.",
            "summary": session.get("summary", {}),
        }
    
    if status == "archived":
        return {
            "session_id": session_id,
            "status": "archived",
            "summary": session.get("summary", {}),
            "message_count": session.get("message_count", 0),
            "messages": [],  # No messages for archived
        }
    
    # Hot or compressed - return what we have
    return session


async def get_conversation_history_smart(
    db, 
    member_id: str, 
    pet_id: str = None,
    limit: int = 10
) -> List[Dict]:
    """
    Get conversation history with smart loading.
    Returns recent full conversations + summaries of older ones.
    """
    query = {"member_id": member_id}
    if pet_id:
        query["pet_context.pet_id"] = pet_id
    
    # Get recent full sessions
    recent = await db.mira_sessions.find(
        {**query, "retention_status": {"$in": ["hot", None, "important"]}},
        {"_id": 0}
    ).sort("updated_at", -1).limit(limit).to_list(limit)
    
    # Get summaries of older sessions
    older = await db.mira_sessions.find(
        {**query, "retention_status": {"$in": ["compressed", "archived"]}},
        {"_id": 0, "messages": 0}  # Exclude messages, just get summary
    ).sort("updated_at", -1).limit(20).to_list(20)
    
    return {
        "recent_conversations": recent,
        "older_summaries": older,
    }


# ============== API ROUTES ==============

from fastapi import APIRouter

retention_router = APIRouter(prefix="/api/mira/retention", tags=["mira-retention"])

@retention_router.post("/run-cleanup")
async def run_retention_cleanup():
    """
    Manually trigger retention cleanup.
    In production, this runs as a daily cron job.
    """
    from server import db
    stats = await archive_old_sessions(db)
    return {"success": True, "stats": stats}


@retention_router.post("/mark-important/{session_id}")
async def mark_important(session_id: str, reason: str = "user_marked"):
    """Mark a session as important - will never be deleted."""
    from server import db
    success = await mark_session_important(db, session_id, reason)
    return {"success": success}


@retention_router.get("/stats")
async def get_retention_stats():
    """Get retention statistics."""
    from server import db
    
    stats = {
        "hot": await db.mira_sessions.count_documents({"retention_status": {"$in": [None, "hot"]}}),
        "compressed": await db.mira_sessions.count_documents({"retention_status": "compressed"}),
        "archived": await db.mira_sessions.count_documents({"retention_status": "archived"}),
        "deleted": await db.mira_sessions.count_documents({"retention_status": "deleted"}),
        "important": await db.mira_sessions.count_documents({"retention_status": "important"}),
    }
    
    return {
        "retention_config": RETENTION_CONFIG,
        "session_counts": stats,
        "total_sessions": sum(stats.values()),
    }


@retention_router.get("/history/{member_id}")
async def get_smart_history(member_id: str, pet_id: str = None, limit: int = 10):
    """Get conversation history with smart loading."""
    from server import db
    return await get_conversation_history_smart(db, member_id, pet_id, limit)
