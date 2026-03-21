"""
Memory Service - Mira OS Core

DOCTRINE: Every Interaction Updates Memory
Every conversation must be treated as new data about the pet.

This service handles:
1. Extracting intelligence from conversations
2. Storing observations with confidence scores
3. Temporal versioning of traits
4. Detecting behavioral shifts
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging
import re

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# INTELLIGENCE EXTRACTION PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

EXTRACTION_PATTERNS = {
    # Food & Diet - More precise patterns with word boundaries
    # NOTE: Use {{}} to escape braces for regex quantifiers when using .format()
    "food_preference": [
        (r"(?:he|she|they|{pet_name})\s+(?:loves?|enjoys?|really likes?)\s+(\b\w+(?:\s+\w+)?\b)(?:\s|$|,|\.)", "positive"),
        (r"(?:his|her|their)\s+favorite\s+(?:treat|food|snack)\s+is\s+(\b\w+(?:\s+\w+)?\b)", "positive"),
        (r"(?:he|she|they|{pet_name})\s+(?:hates?|doesn't like|won't eat)\s+(\b\w+\b)", "negative"),
    ],
    
    # Allergies - Capture specific allergens
    "allergy": [
        (r"allergic\s+to\s+(\b[a-zA-Z]+\b)(?:\s+and\s+(\b[a-zA-Z]+\b))?", "allergy"),
        (r"can(?:'t|not)\s+(?:eat|have)\s+(\b[a-zA-Z]+\b)", "restriction"),
        (r"(\b[a-zA-Z]+\b)\s+makes?\s+(?:him|her|them)\s+sick", "reaction"),
    ],
    
    # Behavior - Better trigger capture
    "behavior": [
        (r"(?:gets?|becomes?)\s+(?:very\s+)?(?:anxious|nervous|scared)\s+(?:when|around|during|with|in)\s+(thunderstorms?|fireworks?|strangers?|loud\s+(?:noises?|sounds?)|car\s+rides?|vet\s+visits?|alone|guests?)", "anxiety_trigger"),
        (r"(?:is|has been|seems?)\s+(aggressive|reactive|friendly|calm|shy|nervous|anxious|playful|energetic|lazy)", "temperament"),
        (r"(?:hates|doesn't\s+like)\s+(?:being\s+)?(?:left\s+)?(alone|strangers?|other\s+dogs?|cats?|loud\s+noises?|thunderstorms?)", "dislike"),
    ],
    
    # Health - Specific conditions
    "health": [
        (r"(?:has|diagnosed\s+with|suffers\s+from)\s+(arthritis|diabetes|seizures?|epilepsy|hip\s+dysplasia|heart\s+(?:disease|murmur)|kidney\s+(?:disease|issues?)|cancer|allergies|skin\s+issues?)", "condition"),
        (r"taking\s+(\b\w+\b)\s+(?:medication|medicine|pills|daily)", "medication"),
        (r"(?:been|is)\s+(itching|scratching|limping|vomiting|coughing|sneezing)\s*(?:a lot|lately|recently)?", "symptom"),
    ],
    
    # Routine - Time patterns (escaped braces for quantifiers)
    "routine": [
        (r"walks?\s+(?:at|around)\s+(\d{{1,2}}(?::\d{{2}})?\s*(?:am|pm)?)", "walk_time"),
        (r"eats?\s+(?:at|around)\s+(\d{{1,2}}(?::\d{{2}})?\s*(?:am|pm)?)", "meal_time"),
        (r"sleeps?\s+(?:in|on)\s+(?:the\s+)?(bed|couch|crate|floor|dog\s+bed)", "sleep_location"),
    ],
    
    # Environment
    "environment": [
        (r"live(?:s)?\s+in\s+(?:a\s+|an\s+)?(apartment|house|flat|condo|villa)", "housing"),
        (r"(?:has|have)\s+(?:a\s+)?(yard|garden|backyard|balcony|terrace)", "outdoor_space"),
        (r"live(?:s)?\s+with\s+(kids?|children|other\s+dogs?|cats?|alone|family)", "household"),
    ],
}


class ConversationMemory:
    """
    Manages memory extraction and storage for a single conversation turn.
    """
    
    def __init__(self, pet_id: str, pet_name: str, db):
        self.pet_id = pet_id
        self.pet_name = pet_name
        self.db = db
        self.extracted_signals = []
        self.trait_updates = []
    
    async def process_message(self, message: str, pillar: str = None) -> Dict:
        """
        Process a user message for intelligence extraction.
        Returns extracted signals and suggested updates.
        """
        message_lower = message.lower()
        
        # Extract signals from message
        for category, patterns in EXTRACTION_PATTERNS.items():
            for pattern, signal_type in patterns:
                # Replace pet_name placeholder
                compiled = re.compile(pattern.format(pet_name=self.pet_name.lower()), re.IGNORECASE)
                matches = compiled.findall(message)
                
                for match in matches:
                    signal = {
                        "category": category,
                        "signal_type": signal_type,
                        "value": match if isinstance(match, str) else match[0],
                        "raw_text": message,
                        "confidence": 70,  # Single mention = 70%
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "pillar": pillar
                    }
                    self.extracted_signals.append(signal)
                    logger.info(f"[MEMORY] Extracted signal: {category}/{signal_type} = {match}")
        
        # Extract explicit mentions
        self._extract_explicit_mentions(message_lower)
        
        return {
            "signals_extracted": len(self.extracted_signals),
            "signals": self.extracted_signals
        }
    
    def _extract_explicit_mentions(self, message: str):
        """Extract explicitly stated facts about the pet."""
        
        # Birthday mentions
        birthday_patterns = [
            r"birthday (?:is|was) (?:on )?([\w\s\d,]+)",
            r"born (?:on |in )?([\w\s\d,]+)",
            r"(\d+)(?:st|nd|rd|th)?\s*(?:of\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)",
        ]
        for pattern in birthday_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                self.extracted_signals.append({
                    "category": "identity",
                    "signal_type": "birthday",
                    "value": match.group(0),
                    "confidence": 90,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
        
        # Weight mentions
        weight_match = re.search(r"(?:weighs?|weight is) (\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?|lbs?|pounds?)", message)
        if weight_match:
            self.extracted_signals.append({
                "category": "identity",
                "signal_type": "weight",
                "value": weight_match.group(1),
                "confidence": 90,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Age mentions
        age_match = re.search(r"(?:is |she's |he's |they're )(\d+) (?:years?|months?) old", message)
        if age_match:
            self.extracted_signals.append({
                "category": "identity",
                "signal_type": "age",
                "value": age_match.group(1),
                "confidence": 90,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    async def commit_to_memory(self) -> int:
        """
        Commit extracted signals to the pet's memory.
        Returns number of updates made.
        
        ENHANCED: Also stores to versioned storage for temporal tracking
        """
        if not self.extracted_signals:
            return 0
        
        try:
            updates = 0
            
            # Try to import versioned storage for enhanced memory
            try:
                from services.versioned_storage import VersionedStorage
                versioned_storage = VersionedStorage(self.db)
                has_versioned = True
            except ImportError:
                has_versioned = False
            
            for signal in self.extracted_signals:
                # Create memory entry (original behavior)
                memory_entry = {
                    "pet_id": self.pet_id,
                    "category": signal["category"],
                    "signal_type": signal["signal_type"],
                    "value": signal["value"],
                    "raw_text": signal.get("raw_text", ""),
                    "confidence": signal["confidence"],
                    "source": "conversation",
                    "pillar": signal.get("pillar"),
                    "timestamp": datetime.now(timezone.utc),
                    "processed": False
                }
                
                await self.db.conversation_memories.insert_one(memory_entry)
                updates += 1
                
                # ENHANCED: Store to versioned storage as trait
                if has_versioned:
                    try:
                        await versioned_storage.store_trait(
                            pet_id=self.pet_id,
                            trait_type=f"{signal['category']}_{signal['signal_type']}",
                            trait_value=signal["value"],
                            confidence=signal["confidence"],
                            evidence_text=signal.get("raw_text", ""),
                            source="conversation"
                        )
                    except Exception as vs_err:
                        logger.debug(f"[MEMORY] Versioned storage error (non-critical): {vs_err}")
                
                # If high confidence, update pet profile directly
                if signal["confidence"] >= 85:
                    await self._update_pet_profile(signal)
            
            logger.info(f"[MEMORY] Committed {updates} signals to memory for {self.pet_id}")
            return updates
            
        except Exception as e:
            logger.error(f"[MEMORY] Error committing to memory: {e}")
            return 0
    
    async def _update_pet_profile(self, signal: Dict):
        """Update pet profile with high-confidence signals."""
        category = signal["category"]
        signal_type = signal["signal_type"]
        value = signal["value"]
        
        # Map signal types to profile fields
        field_mapping = {
            ("food_preference", "positive"): "preferences.favorite_treats",
            ("food_preference", "negative"): "preferences.dislikes",
            ("allergy", "allergy"): "doggy_soul_answers.food_allergies",
            ("behavior", "anxiety_trigger"): "doggy_soul_answers.anxiety_triggers",
            ("health", "condition"): "doggy_soul_answers.health_conditions",
            ("environment", "housing"): "environment.housing_type",
        }
        
        field = field_mapping.get((category, signal_type))
        if field:
            try:
                # Use $addToSet for array fields, $set for others
                if "." in field and field.split(".")[1] in ["favorite_treats", "dislikes", "anxiety_triggers", "food_allergies"]:
                    await self.db.pets.update_one(
                        {"id": self.pet_id},
                        {"$addToSet": {field: value}}
                    )
                else:
                    await self.db.pets.update_one(
                        {"id": self.pet_id},
                        {"$set": {field: value}}
                    )
                logger.info(f"[MEMORY] Updated pet profile: {field} = {value}")
            except Exception as e:
                logger.error(f"[MEMORY] Error updating pet profile: {e}")


async def get_pet_context_pack(db, pet_id: str) -> Dict:
    """
    Get the complete Pet Context Pack for reasoning.
    This is retrieved BEFORE every Mira response.
    
    Returns structured intelligence across all layers:
    - Core Identity
    - Soul Intelligence
    - Behavioural Observations
    - Lifestyle Patterns
    - Service History
    - Interaction Intelligence
    - Predictive Signals
    """
    if not pet_id:
        return {}
    
    try:
        # Get base pet data
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            return {}
        
        # Get recent conversation memories
        recent_memories = await db.conversation_memories.find(
            {"pet_id": pet_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(20).to_list(20)
        
        # Get service history
        service_history = await db.orders.find(
            {"pet_id": pet_id},
            {"_id": 0, "service_type": 1, "status": 1, "created_at": 1}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        # Build context pack
        context_pack = {
            "pet_id": pet_id,
            "name": pet.get("name"),
            
            # A. Core Identity (static)
            "core_identity": {
                "breed": pet.get("breed"),
                "birth_date": pet.get("birth_date") or pet.get("birthday"),
                "gender": pet.get("gender"),
                "weight": pet.get("weight"),
                "size": pet.get("size"),
                "species": pet.get("species", "dog"),
            },
            
            # B. Soul Intelligence (deep profile)
            "soul_intelligence": {
                **pet.get("doggy_soul_answers") or {},
                **pet.get("soul", {}),
            },
            
            # C. Behavioural Observations (dynamic)
            "behavioural_observations": [
                m for m in recent_memories 
                if m.get("category") in ["behavior", "emotional"]
            ],
            
            # D. Lifestyle Patterns (temporal)
            "lifestyle_patterns": {
                "routine": pet.get("routine", {}),
                "environment": pet.get("environment", {}),
            },
            
            # E. Service History
            "service_history": service_history,
            
            # F. Interaction Intelligence
            "interaction_intelligence": {
                "recent_topics": list(set([m.get("category") for m in recent_memories])),
                "recurring_concerns": _extract_recurring_concerns(recent_memories),
            },
            
            # G. Predictive Signals
            "predictive_signals": {
                "upcoming_birthday": _check_upcoming_birthday(pet),
                "health_alerts": _extract_health_alerts(pet, recent_memories),
            },
            
            # Unanswered questions for dynamic suggestion
            "unanswered_questions": _get_unanswered_fields(pet),
        }
        
        return context_pack
        
    except Exception as e:
        logger.error(f"[CONTEXT PACK] Error building context pack: {e}")
        return {}


def _extract_recurring_concerns(memories: List[Dict]) -> List[str]:
    """Extract topics that appear multiple times in recent memories."""
    topic_counts = {}
    for m in memories:
        category = m.get("category", "general")
        topic_counts[category] = topic_counts.get(category, 0) + 1
    
    return [topic for topic, count in topic_counts.items() if count >= 2]


def _check_upcoming_birthday(pet: Dict) -> Optional[Dict]:
    """Check if birthday is within 30 days."""
    birthday = pet.get("birth_date") or pet.get("birthday")
    if not birthday:
        return None
    
    try:
        from dateutil.parser import parse as parse_date
        bday = parse_date(str(birthday))
        today = datetime.now()
        
        this_year_bday = bday.replace(year=today.year)
        if this_year_bday.date() < today.date():
            this_year_bday = this_year_bday.replace(year=today.year + 1)
        
        days_until = (this_year_bday.date() - today.date()).days
        
        if days_until <= 30:
            return {
                "date": this_year_bday.strftime("%Y-%m-%d"),
                "days_until": days_until
            }
    except Exception:
        pass
    
    return None


def _extract_health_alerts(pet: Dict, memories: List[Dict]) -> List[Dict]:
    """Extract any health-related alerts."""
    alerts = []
    
    # Check for recent health mentions
    health_memories = [m for m in memories if m.get("category") == "health"]
    if health_memories:
        alerts.append({
            "type": "recent_health_mention",
            "count": len(health_memories)
        })
    
    # Check for known conditions
    conditions = pet.get("doggy_soul_answers") or {}.get("health_conditions")
    if conditions:
        alerts.append({
            "type": "known_conditions",
            "conditions": conditions
        })
    
    return alerts


def _get_unanswered_fields(pet: Dict) -> List[str]:
    """Get list of important unanswered Soul fields."""
    important_fields = [
        "energy_level", "temperament", "food_allergies", "separation_anxiety",
        "handling_comfort", "behavior_with_dogs", "life_stage"
    ]
    
    doggy_soul = pet.get("doggy_soul_answers") or {}
    unanswered = []
    
    for field in important_fields:
        if not doggy_soul.get(field):
            unanswered.append(field)
    
    return unanswered



async def get_relevant_memories_for_context(db, pet_id: str, pillar: str = None, limit: int = 10) -> List[Dict]:
    """
    Get relevant memories for inclusion in LLM context.
    Prioritizes high-confidence signals and recent observations.
    """
    if not pet_id or db is None:
        return []
    
    try:
        # Build query - prioritize by confidence and recency
        query = {"pet_id": pet_id}
        if pillar:
            # Get memories relevant to current pillar
            pillar_categories = {
                "dine": ["food_preference", "allergy", "health"],
                "stay": ["behavior", "routine", "environment"],
                "travel": ["behavior", "routine"],
                "care": ["health", "behavior"],
                "celebrate": ["food_preference", "allergy"],
            }
            relevant_cats = pillar_categories.get(pillar, [])
            if relevant_cats:
                query["category"] = {"$in": relevant_cats}
        
        # Get from conversation_memories collection
        memories = await db.conversation_memories.find(
            query,
            {"_id": 0}
        ).sort([("confidence", -1), ("timestamp", -1)]).limit(limit).to_list(limit)
        
        # Also get from mira_memories for longer-term signals
        mira_mems = await db.mira_memories.find(
            {"pet_id": pet_id, "is_active": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        # Format for LLM context
        formatted = []
        seen_values = set()
        
        for m in memories:
            value = m.get("value", "")
            if value and value not in seen_values:
                formatted.append({
                    "type": f"{m.get('category', 'observation')}/{m.get('signal_type', 'general')}",
                    "value": value,
                    "confidence": m.get("confidence", 50),
                    "source": "conversation"
                })
                seen_values.add(value)
        
        for m in mira_mems:
            content = m.get("content", "")
            if content and content not in seen_values:
                formatted.append({
                    "type": m.get("memory_type", "observation"),
                    "value": content,
                    "confidence": m.get("confidence", 70),
                    "source": "memory"
                })
                seen_values.add(content)
        
        return formatted
        
    except Exception as e:
        logger.error(f"[MEMORY] Error getting relevant memories: {e}")
        return []


def format_memories_for_llm(memories: List[Dict]) -> str:
    """Format memories into a string for LLM context injection."""
    if not memories:
        return ""
    
    lines = ["## Learned from Conversations:"]
    for m in memories:
        conf = m.get("confidence", 50)
        # Ensure confidence is an int for comparison
        try:
            conf = int(conf) if conf else 50
        except (ValueError, TypeError):
            conf = 50
        conf_label = "confirmed" if conf >= 85 else "observed" if conf >= 70 else "mentioned"
        lines.append(f"- {m['type']}: {m['value']} ({conf_label})")
    
    return "\n".join(lines)
