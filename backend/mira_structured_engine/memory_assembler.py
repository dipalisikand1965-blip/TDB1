"""
Mira Structured Engine - Memory Assembler
=========================================
Builds the complete context for every LLM call.

Loads:
- Pet profile + soul
- Open tickets
- Recent signals (orders, browsing)
- Conversation history
- UI context
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

# Database reference (set by server.py)
_db = None


def set_memory_db(db):
    """Set database reference"""
    global _db
    _db = db


async def assemble_pet_memory(
    pet_context: Dict[str, Any],
    user_id: Optional[str] = None,
    include_tickets: bool = True,
    include_signals: bool = True,
    max_recent_orders: int = 5,
    max_conversation_turns: int = 10
) -> Dict[str, Any]:
    """
    Assemble complete pet memory for LLM context.
    
    Returns structured context, not raw dumps.
    """
    
    pet_id = pet_context.get("id")
    pet_name = pet_context.get("name", "your pet")
    
    memory = {
        "pet_profile": format_pet_profile(pet_context),
        "pet_soul": format_pet_soul(pet_context),
        "open_tickets": [],
        "recent_signals": [],
        "known_preferences": {},
    }
    
    if _db is None:
        logger.warning("[MEMORY] Database not available")
        return memory
    
    # Load open tickets
    if include_tickets and pet_id:
        memory["open_tickets"] = await get_open_tickets(pet_id, user_id)
    
    # Load recent signals
    if include_signals and (pet_id or user_id):
        memory["recent_signals"] = await get_recent_signals(pet_id, user_id, max_recent_orders)
    
    # Load learned preferences from mira_memories
    if pet_id:
        memory["known_preferences"] = await get_learned_preferences(pet_id)
    
    return memory


def format_pet_profile(pet_context: Dict[str, Any]) -> str:
    """Format basic pet profile for LLM context"""
    
    name = pet_context.get("name", "Pet")
    breed = pet_context.get("breed", "Unknown breed")
    species = pet_context.get("species", "dog")
    weight = pet_context.get("weight_kg")
    age = pet_context.get("age_years")
    birthday = pet_context.get("birthday")
    
    lines = [
        f"**{name}** - {breed}",
        f"Species: {species}",
    ]
    
    if weight:
        lines.append(f"Weight: {weight}kg")
    if age:
        lines.append(f"Age: {age} years")
    if birthday:
        lines.append(f"Birthday: {birthday}")
    
    # Allergies (CRITICAL - safety gate)
    allergies = pet_context.get("allergies", [])
    if allergies:
        lines.append(f"⚠️ ALLERGIES: {', '.join(allergies)}")
    
    # Health conditions
    health = pet_context.get("health_conditions", [])
    if health:
        lines.append(f"Health notes: {', '.join(health)}")
    
    return "\n".join(lines)


def format_pet_soul(pet_context: Dict[str, Any]) -> str:
    """Format soul/personality data for LLM context"""
    
    name = pet_context.get("name", "Pet")
    soul = pet_context.get("soul") or {}
    
    lines = [f"**{name}'s Soul Profile:**"]
    
    # Temperament
    temperament = pet_context.get("temperament") or soul.get("temperament")
    if temperament:
        lines.append(f"- Temperament: {temperament}")
    
    # Energy
    energy = pet_context.get("energy_level") or soul.get("energy_level")
    if energy:
        lines.append(f"- Energy level: {energy}")
    
    # Food motivation
    food_motivation = pet_context.get("food_motivation") or soul.get("food_motivation")
    if food_motivation:
        lines.append(f"- Food motivation: {food_motivation}")
    
    # Anxiety
    anxiety = pet_context.get("separation_anxiety") or soul.get("separation_anxiety")
    if anxiety:
        lines.append(f"- Separation anxiety: {anxiety}")
    
    # Loud sounds
    loud_sounds = pet_context.get("loud_sounds_reaction") or soul.get("loud_sounds")
    if loud_sounds:
        lines.append(f"- Reaction to loud sounds: {loud_sounds}")
    
    # Strangers
    strangers = pet_context.get("stranger_reaction") or soul.get("stranger_reaction")
    if strangers:
        lines.append(f"- With strangers: {strangers}")
    
    # Handling
    handling = pet_context.get("handling_comfort") or soul.get("handling_comfort")
    if handling:
        lines.append(f"- Handling comfort: {handling}")
    
    # Other dogs
    with_dogs = pet_context.get("behavior_with_dogs") or soul.get("behavior_with_dogs")
    if with_dogs:
        lines.append(f"- With other dogs: {with_dogs}")
    
    # Grooming preference (important for service routing)
    grooming_pref = pet_context.get("grooming_preference") or soul.get("grooming_preference")
    if grooming_pref:
        lines.append(f"- Grooming preference: {grooming_pref}")
    
    # Favorite treats
    treats = pet_context.get("favorite_treats", [])
    if treats:
        lines.append(f"- Favorite treats: {', '.join(treats)}")
    
    if len(lines) == 1:
        lines.append("- (No soul data yet - learning from interactions)")
    
    return "\n".join(lines)


async def get_open_tickets(pet_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get open/in-progress tickets for this pet"""
    
    if _db is None:
        return []
    
    try:
        query = {
            "status": {"$in": ["draft", "pending_info", "open", "in_progress", "awaiting_approval"]},
            "$or": [{"pet_id": pet_id}]
        }
        
        if user_id:
            query["$or"].append({"user_id": user_id})
            query["$or"].append({"customer_email": user_id})
        
        cursor = _db.service_desk_tickets.find(
            query,
            {"_id": 0, "ticket_id": 1, "service_type": 1, "status": 1, "subject": 1, "created_at": 1, "filled_fields": 1}
        ).sort("created_at", -1).limit(5)
        
        tickets = await cursor.to_list(5)
        
        # Format for context
        formatted = []
        for t in tickets:
            formatted.append({
                "ticket_id": t.get("ticket_id"),
                "service": t.get("service_type", "unknown").replace("_", " "),
                "status": t.get("status"),
                "summary": t.get("subject", "Service request"),
                "created": t.get("created_at"),
            })
        
        return formatted
        
    except Exception as e:
        logger.error(f"[MEMORY] Error loading tickets: {e}")
        return []


async def get_recent_signals(
    pet_id: Optional[str],
    user_id: Optional[str],
    max_orders: int = 5
) -> List[Dict[str, Any]]:
    """Get recent orders, browsing signals for context"""
    
    if _db is None:
        return []
    
    signals = []
    
    try:
        # Recent orders
        if user_id:
            orders_cursor = _db.orders.find(
                {"$or": [{"user_id": user_id}, {"customer_email": user_id}]},
                {"_id": 0, "order_id": 1, "items": 1, "created_at": 1, "status": 1}
            ).sort("created_at", -1).limit(max_orders)
            
            orders = await orders_cursor.to_list(max_orders)
            
            for o in orders:
                items = o.get("items", [])
                item_names = [i.get("name", "Item") for i in items[:3]]
                signals.append({
                    "type": "order",
                    "summary": f"Ordered: {', '.join(item_names)}",
                    "date": o.get("created_at"),
                })
        
        # Recent service completions
        if pet_id:
            completed_cursor = _db.service_desk_tickets.find(
                {"pet_id": pet_id, "status": "resolved"},
                {"_id": 0, "service_type": 1, "completed_at": 1, "subject": 1}
            ).sort("completed_at", -1).limit(3)
            
            completed = await completed_cursor.to_list(3)
            
            for c in completed:
                signals.append({
                    "type": "service_completed",
                    "summary": f"Completed: {c.get('service_type', 'service').replace('_', ' ')}",
                    "date": c.get("completed_at"),
                })
        
    except Exception as e:
        logger.error(f"[MEMORY] Error loading signals: {e}")
    
    return signals


async def get_learned_preferences(pet_id: str) -> Dict[str, Any]:
    """Get learned preferences from mira_memories"""
    
    if _db is None:
        return {}
    
    try:
        # Get recent memories for this pet
        cursor = _db.mira_memories.find(
            {"pet_id": pet_id},
            {"_id": 0, "memory_type": 1, "content": 1, "confidence": 1}
        ).sort("created_at", -1).limit(20)
        
        memories = await cursor.to_list(20)
        
        preferences = {}
        for m in memories:
            mem_type = m.get("memory_type", "general")
            content = m.get("content", "")
            confidence = m.get("confidence", 0.5)
            
            if confidence > 0.6:  # Only high-confidence memories
                if mem_type not in preferences:
                    preferences[mem_type] = []
                preferences[mem_type].append(content)
        
        return preferences
        
    except Exception as e:
        logger.error(f"[MEMORY] Error loading preferences: {e}")
        return {}


def build_llm_context_block(memory: Dict[str, Any], ui_context: Dict[str, Any] = None) -> str:
    """
    Build the context block to inject into LLM system prompt.
    
    This is what makes Mira "know" the pet.
    """
    
    sections = []
    
    # Pet profile
    sections.append("═══ PET CONTEXT ═══")
    sections.append(memory.get("pet_profile", "No pet data"))
    
    # Soul
    sections.append("\n═══ PET SOUL ═══")
    sections.append(memory.get("pet_soul", "No soul data"))
    
    # Open tickets (if any)
    open_tickets = memory.get("open_tickets", [])
    if open_tickets:
        sections.append("\n═══ OPEN REQUESTS ═══")
        for t in open_tickets:
            sections.append(f"- [{t['status']}] {t['summary']} (#{t['ticket_id']})")
    
    # Recent signals
    signals = memory.get("recent_signals", [])
    if signals:
        sections.append("\n═══ RECENT ACTIVITY ═══")
        for s in signals[:3]:  # Cap at 3
            sections.append(f"- {s['summary']}")
    
    # Learned preferences
    prefs = memory.get("known_preferences", {})
    if prefs:
        sections.append("\n═══ LEARNED PREFERENCES ═══")
        for ptype, items in prefs.items():
            sections.append(f"- {ptype}: {', '.join(items[:3])}")
    
    # UI context
    if ui_context:
        sections.append("\n═══ CURRENT UI STATE ═══")
        sections.append(f"- Active tab: {ui_context.get('active_tab', 'chat')}")
        if ui_context.get("active_pillar"):
            sections.append(f"- Active pillar: {ui_context['active_pillar']}")
        if ui_context.get("draft_ticket_id"):
            sections.append(f"- Draft ticket: {ui_context['draft_ticket_id']}")
    
    return "\n".join(sections)
