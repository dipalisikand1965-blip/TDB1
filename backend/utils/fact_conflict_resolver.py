"""
Fact Conflict Resolver - Safety-First Conflict Detection & Resolution
======================================================================
When health/allergy conflicts with loves/preferences on the same entity:
- Default = health wins
- Preference is suppressed everywhere except inside the conflict resolver UI

CONFLICT STATES:
- pending_resolution: Conflict detected, awaiting user decision
- resolved_health_wins: User confirmed health takes priority
- resolved_preference_wins: User explicitly allowed preference despite health
- auto_resolved_safety: System auto-resolved using safety rule (health wins)
"""

import re
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# Categories that indicate health/safety concerns
HEALTH_CATEGORIES = {"health", "allergy", "medical", "sensitivity", "restriction"}

# Categories that indicate preferences
PREFERENCE_CATEGORIES = {"loves", "preferences", "likes", "favorites"}

# Common entity extraction patterns
ENTITY_PATTERNS = [
    r"allergic to (\w+)",
    r"allergy to (\w+)",
    r"sensitive to (\w+)",
    r"can't eat (\w+)",
    r"loves? (\w+)",
    r"(\w+) treats?",
    r"(\w+) food",
]


def extract_entity(content: str) -> Optional[str]:
    """Extract the main entity from insight content."""
    if not content:
        return None
    
    content_lower = content.lower().strip()
    
    # Direct entity extraction
    for pattern in ENTITY_PATTERNS:
        match = re.search(pattern, content_lower)
        if match:
            entity = match.group(1)
            # Filter out common non-entities
            if entity not in {"the", "a", "an", "her", "his", "their", "my", "to", "be"}:
                return entity
    
    # Fallback: use the whole content as entity if short enough
    if len(content_lower) < 30:
        # Clean common prefixes
        for prefix in ["loves ", "allergic to ", "sensitive to ", "prefers "]:
            if content_lower.startswith(prefix):
                return content_lower[len(prefix):].strip()
        return content_lower
    
    return None


def is_health_category(category: str) -> bool:
    """Check if category indicates health/safety concern."""
    return (category or "").lower() in HEALTH_CATEGORIES


def is_preference_category(category: str) -> bool:
    """Check if category indicates preference."""
    return (category or "").lower() in PREFERENCE_CATEGORIES


def detect_conflict(
    new_fact: Dict[str, Any],
    existing_facts: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Detect if a new fact conflicts with any existing confirmed facts.
    
    Returns conflict info if found, None otherwise.
    """
    new_category = (new_fact.get("category") or "").lower()
    new_content = (new_fact.get("content") or "").lower()
    new_entity = extract_entity(new_content)
    
    if not new_entity:
        return None
    
    for existing in existing_facts:
        existing_category = (existing.get("category") or "").lower()
        existing_content = (existing.get("content") or "").lower()
        existing_entity = extract_entity(existing_content)
        
        if not existing_entity:
            continue
        
        # Check if entities match
        if new_entity != existing_entity:
            continue
        
        # Check for health vs preference conflict
        new_is_health = is_health_category(new_category)
        new_is_pref = is_preference_category(new_category)
        existing_is_health = is_health_category(existing_category)
        existing_is_pref = is_preference_category(existing_category)
        
        # Conflict: one is health, one is preference, same entity
        if (new_is_health and existing_is_pref) or (new_is_pref and existing_is_health):
            health_fact = new_fact if new_is_health else existing
            pref_fact = existing if new_is_health else new_fact
            
            return {
                "detected": True,
                "entity": new_entity,
                "health_fact": {
                    "id": health_fact.get("id"),
                    "category": health_fact.get("category"),
                    "content": health_fact.get("content"),
                },
                "preference_fact": {
                    "id": pref_fact.get("id"),
                    "category": pref_fact.get("category"),
                    "content": pref_fact.get("content"),
                },
                "conflict_type": "health_vs_preference",
                "recommended_action": "health_wins",
                "safety_note": f"Until you confirm, I'll avoid {new_entity} to stay on the safe side.",
            }
    
    return None


def get_active_conflicts(
    conversation_insights: List[Dict[str, Any]],
    learned_facts: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Find all unresolved conflicts in a pet's facts.
    """
    conflicts = []
    seen_entities = set()
    
    # Combine all facts
    all_facts = []
    for fact in learned_facts:
        all_facts.append({**fact, "source": "learned"})
    for insight in conversation_insights:
        if insight.get("status") == "confirmed":
            all_facts.append({**insight, "source": "insight"})
    
    # Group by entity
    entity_facts = {}
    for fact in all_facts:
        entity = extract_entity(fact.get("content", ""))
        if entity:
            if entity not in entity_facts:
                entity_facts[entity] = []
            entity_facts[entity].append(fact)
    
    # Find conflicts
    for entity, facts in entity_facts.items():
        if entity in seen_entities:
            continue
            
        health_facts = [f for f in facts if is_health_category(f.get("category", ""))]
        pref_facts = [f for f in facts if is_preference_category(f.get("category", ""))]
        
        if health_facts and pref_facts:
            # Check if already resolved
            resolved = any(
                f.get("conflict_status") in ["resolved_health_wins", "resolved_preference_wins"]
                for f in health_facts + pref_facts
            )
            
            if not resolved:
                conflicts.append({
                    "entity": entity,
                    "health_fact": health_facts[0],
                    "preference_fact": pref_facts[0],
                    "conflict_type": "health_vs_preference",
                    "status": "pending_resolution",
                })
                seen_entities.add(entity)
    
    return conflicts


async def resolve_conflict(
    db,
    pet_id: str,
    entity: str,
    resolution: str,  # "health_wins" | "preference_wins" | "not_sure"
    resolved_by: str = "user"
) -> Dict[str, Any]:
    """
    Resolve a conflict between health and preference facts.
    
    resolution options:
    - health_wins: Health/allergy is true, preference is suppressed
    - preference_wins: User explicitly allows preference despite health
    - not_sure: Keep safety default (health wins) but mark as uncertain
    """
    now = datetime.now(timezone.utc).isoformat()
    
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        return {"success": False, "error": "Pet not found"}
    
    learned_facts = pet.get("learned_facts", [])
    conversation_insights = pet.get("conversation_insights", [])
    
    # Find facts related to this entity
    entity_lower = entity.lower()
    
    def matches_entity(fact):
        content = (fact.get("content") or "").lower()
        return entity_lower in content or extract_entity(content) == entity_lower
    
    # Update learned_facts
    for i, fact in enumerate(learned_facts):
        if matches_entity(fact):
            if resolution == "health_wins":
                if is_health_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "resolved_health_wins"
                    learned_facts[i]["is_active"] = True
                elif is_preference_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "resolved_health_wins"
                    learned_facts[i]["is_active"] = False  # Suppressed
                    learned_facts[i]["suppressed_reason"] = "health_restriction"
            elif resolution == "preference_wins":
                if is_health_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "resolved_preference_wins"
                    learned_facts[i]["is_active"] = False
                elif is_preference_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "resolved_preference_wins"
                    learned_facts[i]["is_active"] = True
            else:  # not_sure - default to health wins
                if is_health_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "auto_resolved_safety"
                    learned_facts[i]["is_active"] = True
                elif is_preference_category(fact.get("category", "")):
                    learned_facts[i]["conflict_status"] = "auto_resolved_safety"
                    learned_facts[i]["is_active"] = False
                    learned_facts[i]["suppressed_reason"] = "health_restriction_uncertain"
            
            learned_facts[i]["conflict_resolved_at"] = now
            learned_facts[i]["conflict_resolved_by"] = resolved_by
    
    # Update conversation_insights similarly
    for i, insight in enumerate(conversation_insights):
        if insight.get("status") == "confirmed" and matches_entity(insight):
            if resolution == "health_wins":
                if is_health_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "resolved_health_wins"
                    conversation_insights[i]["is_active"] = True
                elif is_preference_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "resolved_health_wins"
                    conversation_insights[i]["is_active"] = False
                    conversation_insights[i]["suppressed_reason"] = "health_restriction"
            elif resolution == "preference_wins":
                if is_health_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "resolved_preference_wins"
                    conversation_insights[i]["is_active"] = False
                elif is_preference_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "resolved_preference_wins"
                    conversation_insights[i]["is_active"] = True
            else:
                if is_health_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "auto_resolved_safety"
                    conversation_insights[i]["is_active"] = True
                elif is_preference_category(insight.get("category", "")):
                    conversation_insights[i]["conflict_status"] = "auto_resolved_safety"
                    conversation_insights[i]["is_active"] = False
                    conversation_insights[i]["suppressed_reason"] = "health_restriction_uncertain"
            
            conversation_insights[i]["conflict_resolved_at"] = now
            conversation_insights[i]["conflict_resolved_by"] = resolved_by
    
    # Save updates
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$set": {
                "learned_facts": learned_facts,
                "conversation_insights": conversation_insights,
                "facts_conflict_resolved_at": now
            }
        }
    )
    
    resolution_message = {
        "health_wins": f"Resolved: {entity} is treated as off-limits for safety.",
        "preference_wins": f"Resolved: {entity} preference is allowed.",
        "not_sure": f"For safety, {entity} will be avoided until you're sure."
    }
    
    logger.info(f"[CONFLICT-RESOLVER] Resolved {entity} conflict for pet {pet_id}: {resolution}")
    
    return {
        "success": True,
        "entity": entity,
        "resolution": resolution,
        "message": resolution_message.get(resolution, "Conflict resolved."),
        "resolved_at": now
    }


def get_safe_tags(
    learned_facts: List[Dict[str, Any]],
    conversation_insights: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Get tags that are safe to display, with health priority.
    
    Rules:
    - Health/allergy tags always render
    - Preference/loves tags are suppressed if they conflict with health
    - Suppressed tags include a reason
    """
    safe_tags = []
    suppressed_tags = []
    
    # Combine all confirmed facts
    all_facts = list(learned_facts)
    if conversation_insights:
        for insight in conversation_insights:
            if insight.get("status") == "confirmed":
                all_facts.append(insight)
    
    # Group by entity
    entity_health = {}  # entity -> health fact exists
    
    # First pass: identify health restrictions
    for fact in all_facts:
        if is_health_category(fact.get("category", "")):
            entity = extract_entity(fact.get("content", ""))
            if entity:
                entity_health[entity] = True
    
    # Second pass: build safe tags
    for fact in all_facts:
        category = fact.get("category", "")
        content = fact.get("content", "")
        entity = extract_entity(content)
        
        # Check if explicitly marked inactive
        if fact.get("is_active") is False:
            suppressed_tags.append({
                "content": content,
                "category": category,
                "suppressed": True,
                "reason": fact.get("suppressed_reason", "conflict_resolution")
            })
            continue
        
        # Health tags always show
        if is_health_category(category):
            safe_tags.append({
                "content": content,
                "category": category,
                "is_health": True,
                "suppressed": False
            })
            continue
        
        # Preference tags: check for health conflict
        if is_preference_category(category) and entity and entity in entity_health:
            # Check if user explicitly resolved in favor of preference
            if fact.get("conflict_status") == "resolved_preference_wins":
                safe_tags.append({
                    "content": content,
                    "category": category,
                    "is_health": False,
                    "suppressed": False,
                    "note": "User allowed despite health restriction"
                })
            else:
                suppressed_tags.append({
                    "content": content,
                    "category": category,
                    "suppressed": True,
                    "reason": f"health_restriction_{entity}",
                    "tooltip": f"Hidden because there's a health restriction for {entity}. Safety takes priority unless you change it in MOJO."
                })
            continue
        
        # No conflict - show normally
        safe_tags.append({
            "content": content,
            "category": category,
            "is_health": False,
            "suppressed": False
        })
    
    return {
        "visible_tags": safe_tags,
        "suppressed_tags": suppressed_tags,
        "has_conflicts": len(suppressed_tags) > 0
    }
