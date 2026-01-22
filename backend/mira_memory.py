"""
Mira Relationship Memory System
================================
"Store forever. Surface selectively."

This is NOT chat memory. This is RELATIONSHIP memory.
- Mira never forgets unless explicitly told to
- But she chooses when to recall and when to stay silent
- Old information remains available but only surfaces when contextually relevant

Memory Types:
- 🗓️ Events: Identity-level memories (birthdays, trips, milestones) - resurface when relevant
- 🏥 Health: Longitudinal, never auto-delete - surface for symptoms, care booking, preventive nudges
- 🛒 Shopping: Weighted by recency - old preferences don't disappear, just lower priority
- 💬 General: Life context - surface only if relevant to current conversation
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
import logging
import re
import uuid

logger = logging.getLogger(__name__)

# Memory type definitions with surfacing rules
MEMORY_TYPES = {
    "event": {
        "name": "Events & Milestones",
        "icon": "🗓️",
        "description": "Birthdays, trips, adoption days, milestones",
        "surfacing_rule": "Surface when temporally relevant (approaching dates, anniversaries)",
        "decay": False,  # Never decay - identity-level
        "examples": ["Planning trip to Goa", "Luna's birthday is March 15", "Adopted Mojo 2 years ago"]
    },
    "health": {
        "name": "Health & Medical",
        "icon": "🏥",
        "description": "Symptoms, conditions, vet visits, medications",
        "surfacing_rule": "Surface when related symptoms appear, booking care, or preventive nudges due",
        "decay": False,  # Never decay - longitudinal health history
        "examples": ["Mojo has skin allergies", "Luna's vet checkup was last month", "Mystique on joint supplements"]
    },
    "shopping": {
        "name": "Shopping & Preferences",
        "icon": "🛒",
        "description": "Product interests, brand preferences, purchase patterns",
        "surfacing_rule": "Weight by recency - old preferences lower priority unless contradicted",
        "decay": "recency_weighted",  # Older = lower priority, but never deleted
        "examples": ["Looking for grain-free treats", "Prefers organic food", "Interested in travel carriers"]
    },
    "general": {
        "name": "Life Context",
        "icon": "💬",
        "description": "Living situation, lifestyle, family changes",
        "surfacing_rule": "Surface only if relevant to current topic",
        "decay": False,
        "examples": ["Moved to a new apartment", "Working from home now", "Has a new baby"]
    }
}

# Keywords for memory type detection
MEMORY_KEYWORDS = {
    "event": [
        "birthday", "anniversary", "trip", "travel", "vacation", "pawcation",
        "planning to", "going to", "next month", "next week", "this weekend",
        "adopted", "gotcha day", "celebration", "party", "milestone", "first"
    ],
    "health": [
        "vet", "doctor", "checkup", "vaccine", "vaccination", "medication",
        "medicine", "allergy", "allergic", "sick", "ill", "symptom", "pain",
        "limp", "vomit", "diarrhea", "skin", "itch", "scratch", "surgery",
        "operation", "injury", "injured", "condition", "diagnosis", "treatment"
    ],
    "shopping": [
        "buy", "purchase", "looking for", "interested in", "want to get",
        "prefer", "like", "love", "favorite", "brand", "product", "food",
        "treat", "toy", "bed", "carrier", "leash", "collar", "bowl"
    ],
    "general": [
        "moved", "moving", "new house", "new apartment", "new home",
        "work from home", "office", "baby", "child", "kids", "family",
        "schedule", "routine", "lifestyle", "busy", "traveling often"
    ]
}

# Relevance tags for smart surfacing
RELEVANCE_TAGS = {
    "temporal": ["upcoming", "past", "recurring", "annual", "monthly"],
    "health_related": ["symptom", "prevention", "treatment", "chronic", "acute"],
    "purchase_intent": ["researching", "ready_to_buy", "comparing", "interested"],
    "life_change": ["relocation", "family_change", "lifestyle_change", "schedule_change"]
}

# Database reference
_db = None

def set_memory_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


class MiraMemory:
    """Core memory operations"""
    
    @staticmethod
    async def store_memory(
        member_id: str,
        memory_type: str,
        content: str,
        pet_id: Optional[str] = None,
        pet_name: Optional[str] = None,
        context: Optional[str] = None,
        relevance_tags: List[str] = None,
        source: str = "conversation",
        confidence: str = "high",
        session_id: Optional[str] = None
    ) -> str:
        """
        Store a new memory. Memories are never auto-deleted.
        
        Args:
            member_id: The pet parent's ID or email
            memory_type: event, health, shopping, or general
            content: The actual memory content
            pet_id: Optional pet ID if memory is pet-specific
            pet_name: Optional pet name for display
            context: The conversation context where this was learned
            relevance_tags: Tags for smart surfacing
            source: conversation, user-stated, inferred, concierge-noted
            confidence: high, medium, low
            session_id: The Mira session where this was captured
        
        Returns:
            The memory ID
        """
        db = get_db()
        
        memory_id = f"mem-{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        memory_doc = {
            "memory_id": memory_id,
            "member_id": member_id,
            "pet_id": pet_id,
            "pet_name": pet_name,
            "memory_type": memory_type,
            "content": content,
            "context": context,
            "relevance_tags": relevance_tags or [],
            "source": source,
            "confidence": confidence,
            "session_id": session_id,
            
            # Tracking
            "created_at": now,
            "updated_at": now,
            "last_surfaced_at": None,
            "surface_count": 0,
            
            # Control flags
            "is_critical": False,  # Can be flagged by concierge
            "suppress_auto_recall": False,  # Concierge can suppress
            "is_active": True,  # Can be "soft deleted" by user
            "superseded_by": None,  # If new info overrides this
            
            # Recency weight for shopping memories (1.0 = most recent)
            "recency_weight": 1.0
        }
        
        await db.mira_memories.insert_one(memory_doc)
        logger.info(f"Memory stored: {memory_id} | Type: {memory_type} | Member: {member_id}")
        
        return memory_id
    
    @staticmethod
    async def get_relevant_memories(
        member_id: str,
        current_context: str,
        pet_id: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict]:
        """
        Retrieve contextually relevant memories for surfacing.
        This is the "surface selectively" part.
        
        Args:
            member_id: The pet parent's ID or email
            current_context: Current conversation/topic context
            pet_id: Optional pet ID to filter pet-specific memories
            limit: Maximum memories to return
        
        Returns:
            List of relevant memories with relevance scores
        """
        db = get_db()
        
        # Build query
        query = {
            "member_id": member_id,
            "is_active": True,
            "suppress_auto_recall": {"$ne": True}
        }
        
        # Get all memories for this member
        memories = await db.mira_memories.find(query, {"_id": 0}).to_list(100)
        
        if not memories:
            return []
        
        # Score each memory for relevance
        scored_memories = []
        context_lower = current_context.lower()
        
        for memory in memories:
            score = 0
            reasons = []
            
            # 1. Content relevance - does the memory relate to current topic?
            content_lower = memory.get("content", "").lower()
            memory_type = memory.get("memory_type", "general")
            
            # Check keyword overlap
            for keyword in MEMORY_KEYWORDS.get(memory_type, []):
                if keyword in context_lower and keyword in content_lower:
                    score += 2
                    reasons.append(f"keyword_match:{keyword}")
            
            # 2. Pet-specific bonus
            if pet_id and memory.get("pet_id") == pet_id:
                score += 3
                reasons.append("pet_specific")
            elif memory.get("pet_name") and memory.get("pet_name").lower() in context_lower:
                score += 2
                reasons.append("pet_mentioned")
            
            # 3. Memory type relevance to context
            if memory_type == "health" and any(kw in context_lower for kw in ["vet", "sick", "health", "medicine", "allergy"]):
                score += 3
                reasons.append("health_context")
            elif memory_type == "event" and any(kw in context_lower for kw in ["trip", "travel", "birthday", "celebrate"]):
                score += 3
                reasons.append("event_context")
            elif memory_type == "shopping" and any(kw in context_lower for kw in ["buy", "treat", "food", "product", "recommend"]):
                score += 2
                reasons.append("shopping_context")
            
            # 4. Critical memories always surface
            if memory.get("is_critical"):
                score += 5
                reasons.append("critical_flag")
            
            # 5. Recency weight for shopping memories
            if memory_type == "shopping":
                recency = memory.get("recency_weight", 1.0)
                score = score * recency
                reasons.append(f"recency_weight:{recency}")
            
            # 6. Temporal relevance for events
            if memory_type == "event":
                # Check if memory mentions upcoming dates
                if any(word in content_lower for word in ["next week", "next month", "this weekend", "tomorrow"]):
                    score += 2
                    reasons.append("temporal_upcoming")
            
            # Only include if score > 0
            if score > 0:
                scored_memories.append({
                    **memory,
                    "relevance_score": score,
                    "relevance_reasons": reasons
                })
        
        # Sort by score and return top results
        scored_memories.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return scored_memories[:limit]
    
    @staticmethod
    async def surface_memory(memory_id: str) -> bool:
        """
        Mark a memory as surfaced (used in conversation).
        Tracks when and how often memories are recalled.
        """
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        result = await db.mira_memories.update_one(
            {"memory_id": memory_id},
            {
                "$set": {"last_surfaced_at": now},
                "$inc": {"surface_count": 1}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def update_recency_weights(member_id: str):
        """
        Update recency weights for shopping memories.
        Called periodically to decay older shopping preferences.
        """
        db = get_db()
        
        # Get all shopping memories for this member
        memories = await db.mira_memories.find({
            "member_id": member_id,
            "memory_type": "shopping",
            "is_active": True
        }).to_list(100)
        
        if not memories:
            return
        
        # Sort by created_at
        memories.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Assign weights: most recent = 1.0, older = decreasing
        for i, memory in enumerate(memories):
            # Decay factor: 0.9^i (0.9, 0.81, 0.729, etc.)
            weight = max(0.3, 0.9 ** i)  # Minimum weight 0.3
            
            await db.mira_memories.update_one(
                {"memory_id": memory.get("memory_id")},
                {"$set": {"recency_weight": weight}}
            )
    
    @staticmethod
    async def get_all_memories(
        member_id: str,
        memory_type: Optional[str] = None,
        pet_id: Optional[str] = None,
        include_inactive: bool = False
    ) -> List[Dict]:
        """
        Get all memories for a member (for admin view).
        """
        db = get_db()
        
        query = {"member_id": member_id}
        
        if memory_type:
            query["memory_type"] = memory_type
        if pet_id:
            query["pet_id"] = pet_id
        if not include_inactive:
            query["is_active"] = True
        
        memories = await db.mira_memories.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
        
        return memories
    
    @staticmethod
    async def update_memory(
        memory_id: str,
        updates: Dict[str, Any],
        updated_by: str = "system"
    ) -> bool:
        """
        Update a memory (for corrections, flags, etc.)
        """
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Add audit info
        updates["updated_at"] = now
        updates["last_updated_by"] = updated_by
        
        result = await db.mira_memories.update_one(
            {"memory_id": memory_id},
            {"$set": updates}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def soft_delete_memory(memory_id: str, deleted_by: str = "user") -> bool:
        """
        Soft delete a memory (set is_active = False).
        The memory is never truly deleted unless explicitly purged.
        """
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        result = await db.mira_memories.update_one(
            {"memory_id": memory_id},
            {
                "$set": {
                    "is_active": False,
                    "deactivated_at": now,
                    "deactivated_by": deleted_by
                }
            }
        )
        
        logger.info(f"Memory soft-deleted: {memory_id} by {deleted_by}")
        return result.modified_count > 0
    
    @staticmethod
    async def supersede_memory(old_memory_id: str, new_memory_id: str) -> bool:
        """
        Mark an old memory as superseded by a new one.
        Used when new information overrides old (but doesn't delete it).
        """
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        result = await db.mira_memories.update_one(
            {"memory_id": old_memory_id},
            {
                "$set": {
                    "superseded_by": new_memory_id,
                    "superseded_at": now
                }
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def flag_as_critical(memory_id: str, flagged_by: str = "concierge") -> bool:
        """
        Flag a memory as critical (always surfaces).
        """
        return await MiraMemory.update_memory(
            memory_id,
            {"is_critical": True, "flagged_critical_by": flagged_by},
            flagged_by
        )
    
    @staticmethod
    async def suppress_recall(memory_id: str, suppressed_by: str = "concierge") -> bool:
        """
        Suppress a memory from auto-recall.
        """
        return await MiraMemory.update_memory(
            memory_id,
            {"suppress_auto_recall": True, "suppressed_by": suppressed_by},
            suppressed_by
        )


class MemoryExtractor:
    """Extract memories from conversations"""
    
    @staticmethod
    def detect_memory_type(text: str) -> Optional[str]:
        """Detect which type of memory this text represents"""
        text_lower = text.lower()
        
        scores = {mtype: 0 for mtype in MEMORY_KEYWORDS.keys()}
        
        for mtype, keywords in MEMORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[mtype] += 1
        
        # Get highest scoring type
        best_type = max(scores, key=scores.get)
        
        if scores[best_type] > 0:
            return best_type
        
        return None
    
    @staticmethod
    def extract_relevance_tags(text: str, memory_type: str) -> List[str]:
        """Extract relevance tags from memory content"""
        tags = []
        text_lower = text.lower()
        
        # Temporal tags
        if any(word in text_lower for word in ["next", "upcoming", "soon", "tomorrow", "this week"]):
            tags.append("temporal:upcoming")
        if any(word in text_lower for word in ["last", "ago", "yesterday", "previous"]):
            tags.append("temporal:past")
        if any(word in text_lower for word in ["every", "annual", "yearly", "monthly", "weekly"]):
            tags.append("temporal:recurring")
        
        # Health tags
        if memory_type == "health":
            if any(word in text_lower for word in ["allergy", "allergic", "sensitive"]):
                tags.append("health:allergy")
            if any(word in text_lower for word in ["chronic", "ongoing", "long-term"]):
                tags.append("health:chronic")
            if any(word in text_lower for word in ["vaccine", "vaccination", "shot"]):
                tags.append("health:vaccine")
        
        # Shopping tags
        if memory_type == "shopping":
            if any(word in text_lower for word in ["looking for", "want", "need", "interested"]):
                tags.append("purchase:researching")
            if any(word in text_lower for word in ["buy", "order", "get"]):
                tags.append("purchase:ready")
            if any(word in text_lower for word in ["prefer", "like", "love", "favorite"]):
                tags.append("preference:stated")
        
        return tags
    
    @staticmethod
    async def extract_memories_from_conversation(
        user_message: str,
        ai_response: str,
        member_id: str,
        pet_id: Optional[str] = None,
        pet_name: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Extract memorable information from a conversation turn.
        Returns list of memories to potentially store.
        """
        memories = []
        
        # Patterns for memory extraction
        patterns = {
            "event": [
                r"(?:planning|going|traveling|trip)\s+(?:to|for)\s+(.+?)(?:\.|,|$)",
                r"(?:birthday|anniversary|adoption day|gotcha day)\s+(?:is|on)\s+(.+?)(?:\.|,|$)",
                r"(?:next week|next month|this weekend)\s+(?:we're|I'm|going)\s+(.+?)(?:\.|,|$)",
            ],
            "health": [
                r"(?:allergic to|has allergy|sensitive to)\s+(.+?)(?:\.|,|$)",
                r"(?:taking|on)\s+(?:medication|medicine)\s+(?:for)?\s*(.+?)(?:\.|,|$)",
                r"(?:vet|doctor)\s+(?:said|mentioned|diagnosed)\s+(.+?)(?:\.|,|$)",
            ],
            "shopping": [
                r"(?:looking for|want to buy|interested in)\s+(.+?)(?:\.|,|$)",
                r"(?:prefers?|loves?|likes?)\s+(.+?)(?:treats?|food|products?)(?:\.|,|$)",
            ],
            "general": [
                r"(?:moved|moving)\s+to\s+(.+?)(?:\.|,|$)",
                r"(?:work from home|working remotely)",
                r"(?:new baby|expecting|pregnant)",
            ]
        }
        
        text_to_analyze = user_message  # Focus on what user says, not AI
        
        for memory_type, type_patterns in patterns.items():
            for pattern in type_patterns:
                matches = re.findall(pattern, text_to_analyze, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        content = match[0] if match else ""
                    else:
                        content = match
                    
                    if content and len(content) > 3:
                        memories.append({
                            "memory_type": memory_type,
                            "content": content.strip(),
                            "context": user_message[:200],
                            "relevance_tags": MemoryExtractor.extract_relevance_tags(content, memory_type),
                            "source": "conversation",
                            "confidence": "medium"
                        })
        
        # Also check for explicit statements that should be remembered
        explicit_patterns = [
            (r"(?:remember|note|important)[:.]?\s*(.+?)(?:\.|$)", "general", "high"),
            (r"(?:always|never)\s+(?:give|feed|use)\s+(.+?)(?:\.|$)", "health", "high"),
        ]
        
        for pattern, mtype, confidence in explicit_patterns:
            matches = re.findall(pattern, user_message, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    memories.append({
                        "memory_type": mtype,
                        "content": match.strip(),
                        "context": user_message[:200],
                        "relevance_tags": ["user_stated"],
                        "source": "user-stated",
                        "confidence": confidence
                    })
        
        return memories


def format_memories_for_prompt(memories: List[Dict]) -> str:
    """
    Format memories for inclusion in Mira's system prompt.
    This is how memories are "surfaced" in conversation.
    """
    if not memories:
        return ""
    
    sections = {
        "event": [],
        "health": [],
        "shopping": [],
        "general": []
    }
    
    for memory in memories:
        mtype = memory.get("memory_type", "general")
        content = memory.get("content", "")
        pet_name = memory.get("pet_name", "")
        
        if pet_name:
            entry = f"- {pet_name}: {content}"
        else:
            entry = f"- {content}"
        
        if memory.get("is_critical"):
            entry = f"⚠️ {entry} [CRITICAL]"
        
        sections.get(mtype, sections["general"]).append(entry)
    
    output = "\n\n🧠 **RELATIONSHIP MEMORY** (Things you remember about this family):\n"
    
    type_info = MEMORY_TYPES
    
    for mtype, entries in sections.items():
        if entries:
            icon = type_info[mtype]["icon"]
            name = type_info[mtype]["name"]
            output += f"\n{icon} **{name}**:\n"
            output += "\n".join(entries) + "\n"
    
    output += "\n*Use these memories naturally in conversation. Don't force them — surface only when relevant.*"
    
    return output
