"""
LEARN Intent Bridge - Conversation to LEARN Contextual Refresh
==============================================================

This module bridges the gap between chat conversations and the LEARN OS layer.
When a user discusses a topic in chat, LEARN should surface relevant content.

Flow:
1. User asks about "tick prevention" in chat
2. Intent is extracted and stored in `user_learn_intents` collection
3. Next LEARN visit: "Tick/Flea Protocol" guide appears prominently with
   "Based on your recent chat" badge

The bridge works by:
- Storing recent intents with topic mapping
- Boosting LEARN content that matches recent intents (+15 score)
- Showing a visual indicator when content is contextually relevant

Intent TTL: 48 hours (intents expire after this period)
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)

# Intent to LEARN topic mapping
# Maps conversation intents/keywords to LEARN topic IDs
INTENT_TO_LEARN_TOPIC = {
    # Health & Emergency
    "tick": "health",
    "flea": "health",
    "vaccination": "health",
    "vaccine": "health",
    "vet": "health",
    "health check": "health",
    "sick": "health",
    "vomit": "health",
    "diarrhea": "health",
    "allergy": "health",
    "emergency": "emergency",
    "poison": "emergency",
    "injury": "emergency",
    "accident": "emergency",
    
    # Grooming
    "grooming": "grooming",
    "groom": "grooming",
    "bath": "grooming",
    "haircut": "grooming",
    "nail": "grooming",
    "brush": "grooming",
    "coat": "grooming",
    "shedding": "grooming",
    "matting": "grooming",
    "ear cleaning": "grooming",
    
    # Food & Nutrition
    "food": "food",
    "diet": "food",
    "nutrition": "food",
    "feeding": "food",
    "kibble": "food",
    "treats": "food",
    "meal": "food",
    "weight": "food",
    
    # Behaviour & Training
    "training": "behaviour",
    "trainer": "behaviour",
    "barking": "behaviour",
    "biting": "behaviour",
    "jumping": "behaviour",
    "leash": "behaviour",
    "pulling": "behaviour",
    "recall": "behaviour",
    "command": "behaviour",
    "obedience": "behaviour",
    "anxiety": "behaviour",
    "fear": "behaviour",
    "aggressive": "behaviour",
    "reactive": "behaviour",
    "socialization": "behaviour",
    
    # Travel
    "travel": "travel",
    "trip": "travel",
    "flight": "travel",
    "road trip": "travel",
    "car": "travel",
    "vacation": "travel",
    "relocate": "travel",
    
    # Boarding & Stay
    "boarding": "boarding",
    "daycare": "boarding",
    "hotel": "boarding",
    "sitter": "boarding",
    "pet sitting": "boarding",
    "home boarding": "boarding",
    
    # Puppies
    "puppy": "puppies",
    "teething": "puppies",
    "potty training": "puppies",
    "house training": "puppies",
    "crate training": "puppies",
    
    # Senior
    "senior": "senior",
    "old dog": "senior",
    "arthritis": "senior",
    "joint": "senior",
    "mobility": "senior",
    
    # Seasonal
    "monsoon": "seasonal",
    "summer": "seasonal",
    "winter": "seasonal",
    "fireworks": "seasonal",
    "diwali": "seasonal",
    "holi": "seasonal",
    "heat": "seasonal",
    "cold": "seasonal",
}

# Keywords that indicate strong intent (higher confidence)
STRONG_INTENT_KEYWORDS = [
    "how to", "how do i", "what should i", "help with",
    "tips for", "guide for", "advice on", "tell me about",
    "teach me", "show me", "explain", "learn about"
]

# Intent score boost for LEARN content matching recent chat
INTENT_BOOST_SCORE = 15

# Intent TTL in hours
INTENT_TTL_HOURS = 48


def extract_learn_topics_from_message(message: str) -> List[Dict[str, Any]]:
    """
    Extract LEARN-relevant topics from a user message.
    
    Returns list of topics with confidence scores:
    [
        {"topic": "grooming", "confidence": 0.9, "keyword": "grooming"},
        {"topic": "health", "confidence": 0.7, "keyword": "vet"}
    ]
    """
    message_lower = message.lower()
    found_topics = []
    seen_topics = set()
    
    # Check for strong intent indicators
    has_strong_intent = any(kw in message_lower for kw in STRONG_INTENT_KEYWORDS)
    base_confidence = 0.8 if has_strong_intent else 0.5
    
    # Extract topics from keywords
    for keyword, topic in INTENT_TO_LEARN_TOPIC.items():
        if keyword in message_lower:
            if topic not in seen_topics:
                confidence = base_confidence
                
                # Boost confidence for exact word matches
                if re.search(rf'\b{re.escape(keyword)}\b', message_lower):
                    confidence = min(confidence + 0.15, 0.95)
                
                found_topics.append({
                    "topic": topic,
                    "confidence": confidence,
                    "keyword": keyword
                })
                seen_topics.add(topic)
    
    # Sort by confidence (descending)
    found_topics.sort(key=lambda x: -x["confidence"])
    
    return found_topics


async def store_user_intent(
    db,
    user_id: str,
    pet_id: str,
    topics: List[Dict[str, Any]],
    source_message: str = None
) -> bool:
    """
    Store user's LEARN-relevant intents in database.
    
    Intents are stored with TTL and used to personalize LEARN content.
    """
    if db is None or not user_id or not topics:
        logger.warning(f"[LEARN BRIDGE] store_user_intent early return: db={db is None}, user_id={user_id}, topics={len(topics) if topics else 0}")
        return False
    
    try:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=INTENT_TTL_HOURS)
        
        for topic_data in topics[:3]:  # Store max 3 topics per message
            intent_doc = {
                "user_id": user_id,
                "pet_id": pet_id,
                "topic": topic_data["topic"],
                "confidence": topic_data["confidence"],
                "keyword": topic_data.get("keyword"),
                "source_message": source_message[:200] if source_message else None,
                "created_at": now,
                "expires_at": expires_at
            }
            
            logger.info(f"[LEARN BRIDGE] Attempting upsert for topic '{topic_data['topic']}'")
            
            # Upsert - update if same user/pet/topic exists recently
            result = await db.user_learn_intents.update_one(
                {
                    "user_id": user_id,
                    "pet_id": pet_id,
                    "topic": topic_data["topic"],
                    "created_at": {"$gte": now - timedelta(hours=4)}  # Merge if within 4 hours
                },
                {
                    "$set": intent_doc,
                    "$setOnInsert": {"first_seen": now}
                },
                upsert=True
            )
            logger.info(f"[LEARN BRIDGE] Upsert result: matched={result.matched_count}, modified={result.modified_count}, upserted_id={result.upserted_id}")
        
        logger.info(f"[LEARN BRIDGE] Stored {len(topics)} intent(s) for user {user_id}, pet {pet_id}: {[t['topic'] for t in topics]}")
        return True
        
    except Exception as e:
        logger.error(f"[LEARN BRIDGE] Failed to store intent: {e}")
        return False


async def get_recent_user_intents(
    db,
    user_id: str,
    pet_id: str = None,
    hours: int = INTENT_TTL_HOURS
) -> List[Dict[str, Any]]:
    """
    Get user's recent LEARN-relevant intents.
    
    Returns list of topics with confidence, ordered by recency.
    """
    if db is None or not user_id:
        return []
    
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=hours)
        
        query = {
            "user_id": user_id,
            "created_at": {"$gte": cutoff}
        }
        
        if pet_id:
            query["pet_id"] = pet_id
        
        intents = await db.user_learn_intents.find(
            query,
            {"_id": 0, "topic": 1, "confidence": 1, "keyword": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(10)
        
        # Dedupe by topic, keeping most recent
        seen = set()
        unique_intents = []
        for intent in intents:
            if intent["topic"] not in seen:
                seen.add(intent["topic"])
                unique_intents.append(intent)
        
        return unique_intents
        
    except Exception as e:
        logger.error(f"[LEARN BRIDGE] Failed to get intents: {e}")
        return []


def calculate_intent_boost(
    item: Dict,
    recent_intents: List[Dict]
) -> tuple:
    """
    Calculate score boost for a LEARN item based on recent chat intents.
    
    Returns: (boost_score, matched_intent)
    
    If the item's topic matches a recent intent:
    - Apply INTENT_BOOST_SCORE
    - Mark as "contextually relevant" for UI badge
    """
    if not recent_intents:
        return 0, None
    
    item_topic = (item.get("topic") or "").lower()
    item_tags = item.get("tags") or []
    
    for intent in recent_intents:
        intent_topic = intent["topic"]
        
        # Direct topic match
        if item_topic == intent_topic:
            return INTENT_BOOST_SCORE, intent
        
        # Tag match (secondary)
        if intent_topic in item_tags:
            return INTENT_BOOST_SCORE // 2, intent
    
    return 0, None


async def cleanup_expired_intents(db):
    """
    Clean up expired intents from the database.
    Should be called periodically (e.g., daily cron).
    """
    if db is None:
        return 0
    
    try:
        now = datetime.now(timezone.utc)
        result = await db.user_learn_intents.delete_many({
            "expires_at": {"$lt": now}
        })
        
        if result.deleted_count > 0:
            logger.info(f"[LEARN BRIDGE] Cleaned up {result.deleted_count} expired intents")
        
        return result.deleted_count
        
    except Exception as e:
        logger.error(f"[LEARN BRIDGE] Failed to cleanup intents: {e}")
        return 0


# ============================================
# INTEGRATION HOOK FOR CHAT
# ============================================

async def process_chat_for_learn_intents(
    db,
    user_id: str,
    pet_id: str,
    user_message: str,
    pillar: str = None
) -> Dict[str, Any]:
    """
    Process a chat message and extract LEARN-relevant intents.
    
    This should be called from mira_routes.py after each user message.
    
    Returns:
    {
        "topics_found": ["grooming", "health"],
        "stored": True/False
    }
    """
    # Extract topics from message
    topics = extract_learn_topics_from_message(user_message)
    
    # Also consider pillar context
    if pillar and pillar.lower() in INTENT_TO_LEARN_TOPIC.values():
        pillar_topic = pillar.lower()
        if not any(t["topic"] == pillar_topic for t in topics):
            topics.append({
                "topic": pillar_topic,
                "confidence": 0.6,
                "keyword": f"pillar:{pillar}"
            })
    
    # Store if we found any topics
    if topics:
        stored = await store_user_intent(db, user_id, pet_id, topics, user_message)
        return {
            "topics_found": [t["topic"] for t in topics],
            "stored": stored
        }
    
    return {
        "topics_found": [],
        "stored": False
    }
