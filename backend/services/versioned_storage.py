"""
Versioned Storage Service - MIRA OS CORE
=========================================

DOCTRINE COMPLIANCE:
- All answers stored permanently
- Answers versioned over time
- Answers editable but never overwritten
- Confidence scoring on all traits
- Behavioral shift detection

Collections:
- soul_answers_versioned: Temporal versioning for soul data
- pet_traits: Derived traits with confidence evolution
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class VersionedStorage:
    """
    Manages versioned storage for pet intelligence data.
    All data is versioned - nothing is ever overwritten.
    """
    
    def __init__(self, db):
        self.db = db
    
    async def store_soul_answer(
        self,
        pet_id: str,
        field: str,
        value: Any,
        source: str = "conversation",
        confidence: int = 70,
        evidence: List[str] = None
    ) -> Dict:
        """
        Store a soul answer with versioning.
        
        Sources: soul_form (100%), conversation (70-90%), inferred (50-70%)
        """
        try:
            # Get current version for this field
            current = await self.db.soul_answers_versioned.find_one(
                {"pet_id": pet_id, "field": field, "superseded_at": None},
                {"_id": 0, "version": 1, "value": 1, "confidence": 1}
            )
            
            new_version = 1
            if current:
                new_version = current.get("version", 0) + 1
                
                # Check for contradiction
                if current.get("value") != value:
                    contradiction = {
                        "pet_id": pet_id,
                        "field": field,
                        "old_value": current.get("value"),
                        "new_value": value,
                        "old_confidence": current.get("confidence"),
                        "new_confidence": confidence,
                        "detected_at": datetime.now(timezone.utc),
                        "resolved": False
                    }
                    await self.db.trait_contradictions.insert_one(contradiction)
                    logger.info(f"[VERSIONED] Contradiction detected for {pet_id}/{field}: {current.get('value')} -> {value}")
                
                # Supersede old version
                await self.db.soul_answers_versioned.update_one(
                    {"pet_id": pet_id, "field": field, "superseded_at": None},
                    {"$set": {"superseded_at": datetime.now(timezone.utc)}}
                )
            
            # Create new version
            new_entry = {
                "pet_id": pet_id,
                "field": field,
                "value": value,
                "version": new_version,
                "confidence": confidence,
                "source": source,
                "evidence": evidence or [f"Recorded from {source}"],
                "created_at": datetime.now(timezone.utc),
                "superseded_at": None
            }
            
            await self.db.soul_answers_versioned.insert_one(new_entry)
            logger.info(f"[VERSIONED] Stored {field}={value} for {pet_id} (v{new_version}, confidence={confidence}%)")
            
            return {
                "success": True,
                "field": field,
                "version": new_version,
                "confidence": confidence,
                "is_update": new_version > 1
            }
            
        except Exception as e:
            logger.error(f"[VERSIONED] Error storing soul answer: {e}")
            return {"success": False, "error": str(e)}
    
    async def store_trait(
        self,
        pet_id: str,
        trait_type: str,
        trait_value: str,
        confidence: int = 70,
        evidence_text: str = None,
        source: str = "conversation"
    ) -> Dict:
        """
        Store or update a derived trait with confidence evolution.
        
        Traits represent inferred intelligence - not explicit answers.
        Confidence increases with repeated observations.
        """
        try:
            # Find existing trait
            existing = await self.db.pet_traits.find_one(
                {"pet_id": pet_id, "trait_type": trait_type, "trait_value": trait_value},
                {"_id": 1, "confidence": 1, "mention_count": 1, "evidence": 1}
            )
            
            if existing:
                # Boost confidence with each mention
                new_confidence = min(95, existing.get("confidence", 70) + 5)
                new_count = existing.get("mention_count", 1) + 1
                
                evidence_list = existing.get("evidence", [])
                if evidence_text:
                    evidence_list.append({
                        "source": source,
                        "text": evidence_text[:200],
                        "date": datetime.now(timezone.utc)
                    })
                
                await self.db.pet_traits.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "confidence": new_confidence,
                            "mention_count": new_count,
                            "last_observed": datetime.now(timezone.utc),
                            "evidence": evidence_list[-5:]  # Keep last 5
                        }
                    }
                )
                
                logger.info(f"[TRAIT] Updated {trait_type}:{trait_value} for {pet_id} (confidence: {new_confidence}%, mentions: {new_count})")
                
                return {
                    "success": True,
                    "trait_type": trait_type,
                    "trait_value": trait_value,
                    "confidence": new_confidence,
                    "mention_count": new_count,
                    "is_new": False
                }
            else:
                # Create new trait
                new_trait = {
                    "pet_id": pet_id,
                    "trait_type": trait_type,
                    "trait_value": trait_value,
                    "confidence": confidence,
                    "mention_count": 1,
                    "first_observed": datetime.now(timezone.utc),
                    "last_observed": datetime.now(timezone.utc),
                    "evidence": [{
                        "source": source,
                        "text": evidence_text[:200] if evidence_text else "First observation",
                        "date": datetime.now(timezone.utc)
                    }],
                    "contradictions": []
                }
                
                await self.db.pet_traits.insert_one(new_trait)
                logger.info(f"[TRAIT] Created {trait_type}:{trait_value} for {pet_id} (confidence: {confidence}%)")
                
                return {
                    "success": True,
                    "trait_type": trait_type,
                    "trait_value": trait_value,
                    "confidence": confidence,
                    "mention_count": 1,
                    "is_new": True
                }
                
        except Exception as e:
            logger.error(f"[TRAIT] Error storing trait: {e}")
            return {"success": False, "error": str(e)}
    
    async def detect_behavioral_shifts(self, pet_id: str) -> List[Dict]:
        """
        Detect significant behavioral changes over time.
        
        Example: "was social, now avoids dogs"
        """
        try:
            shifts = []
            
            # Get all contradictions for this pet
            contradictions = await self.db.trait_contradictions.find(
                {"pet_id": pet_id, "resolved": False},
                {"_id": 0}
            ).to_list(50)
            
            for c in contradictions:
                # Check if this is a significant shift
                if c.get("new_confidence", 0) >= 70:
                    shifts.append({
                        "field": c["field"],
                        "from_value": c["old_value"],
                        "to_value": c["new_value"],
                        "detected_at": c["detected_at"],
                        "significance": "behavioral_shift"
                    })
            
            # Also check traits for declining confidence
            declining_traits = await self.db.pet_traits.find(
                {
                    "pet_id": pet_id,
                    "last_observed": {"$lt": datetime.now(timezone.utc) - timedelta(days=30)},
                    "confidence": {"$gte": 70}
                },
                {"_id": 0, "trait_type": 1, "trait_value": 1, "last_observed": 1}
            ).to_list(20)
            
            for trait in declining_traits:
                shifts.append({
                    "trait_type": trait["trait_type"],
                    "trait_value": trait["trait_value"],
                    "last_observed": trait["last_observed"],
                    "significance": "stale_data"
                })
            
            return shifts
            
        except Exception as e:
            logger.error(f"[SHIFT] Error detecting shifts: {e}")
            return []
    
    async def get_version_history(self, pet_id: str, field: str) -> List[Dict]:
        """Get the complete version history for a soul field."""
        try:
            history = await self.db.soul_answers_versioned.find(
                {"pet_id": pet_id, "field": field},
                {"_id": 0}
            ).sort("version", -1).to_list(10)
            
            return history
            
        except Exception as e:
            logger.error(f"[HISTORY] Error getting history: {e}")
            return []
    
    async def get_all_traits(self, pet_id: str, min_confidence: int = 50) -> List[Dict]:
        """Get all traits for a pet above minimum confidence threshold."""
        try:
            traits = await self.db.pet_traits.find(
                {"pet_id": pet_id, "confidence": {"$gte": min_confidence}},
                {"_id": 0}
            ).sort("confidence", -1).to_list(100)
            
            return traits
            
        except Exception as e:
            logger.error(f"[TRAITS] Error getting traits: {e}")
            return []


async def migrate_existing_soul_data(db, pet_id: str) -> Dict:
    """
    Migrate existing soul data to versioned storage.
    Should be run once per pet.
    """
    try:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            return {"success": False, "error": "Pet not found"}
        
        storage = VersionedStorage(db)
        migrated = 0
        
        # Migrate doggy_soul_answers
        soul_answers = pet.get("doggy_soul_answers") or {}
        for field, value in soul_answers.items():
            if value:  # Only migrate non-empty values
                await storage.store_soul_answer(
                    pet_id=pet_id,
                    field=field,
                    value=value,
                    source="soul_form",
                    confidence=100,  # Form answers are 100% confident
                    evidence=["Migrated from Soul form"]
                )
                migrated += 1
        
        # Migrate soul dict if exists
        soul_data = pet.get("soul") or {}
        for field, value in soul_data.items():
            if value:
                await storage.store_soul_answer(
                    pet_id=pet_id,
                    field=f"soul.{field}",
                    value=value,
                    source="soul_form",
                    confidence=100,
                    evidence=["Migrated from Soul profile"]
                )
                migrated += 1
        
        # Migrate preferences
        prefs = pet.get("preferences") or {}
        for field, value in prefs.items():
            if value:
                await storage.store_soul_answer(
                    pet_id=pet_id,
                    field=f"preferences.{field}",
                    value=value,
                    source="preferences_form",
                    confidence=95,
                    evidence=["Migrated from preferences"]
                )
                migrated += 1
        
        logger.info(f"[MIGRATE] Migrated {migrated} fields for {pet_id}")
        
        return {
            "success": True,
            "pet_id": pet_id,
            "fields_migrated": migrated
        }
        
    except Exception as e:
        logger.error(f"[MIGRATE] Error migrating: {e}")
        return {"success": False, "error": str(e)}


# Indexes for optimal performance
VERSIONED_STORAGE_INDEXES = [
    # soul_answers_versioned
    ("soul_answers_versioned", [("pet_id", 1), ("field", 1), ("superseded_at", 1)]),
    ("soul_answers_versioned", [("pet_id", 1), ("created_at", -1)]),
    
    # pet_traits
    ("pet_traits", [("pet_id", 1), ("trait_type", 1), ("trait_value", 1)]),
    ("pet_traits", [("pet_id", 1), ("confidence", -1)]),
    
    # trait_contradictions
    ("trait_contradictions", [("pet_id", 1), ("resolved", 1)]),
]
