"""
MIRA OS Classification Pipeline - Phase B2
seed_version: 1.0.0

Pipeline Order:
1. Synonym match → canonical tags
2. Safety gate (emergency override)
3. Intent detection (buy vs book vs learn)
4. Pillar resolution
5. LLM fallback only if confidence < 0.6 OR no tags found

Never invents a new pillar - locked set only.
"""

import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# Locked 13 pillars - NEVER add new ones
LOCKED_PILLARS = [
    "care", "dine", "stay", "travel", "enjoy", "fit", "learn",
    "celebrate", "adopt", "advisory", "paperwork", "emergency", "farewell"
]

# Intent keywords - PRIORITY ORDERED
# Buy is checked BEFORE book to avoid false positives on "looking for"
INTENT_KEYWORDS = {
    "emergency": ["emergency", "urgent", "help now", "immediately", "asap", "can't breathe", "ate poison", "bleeding", "collapsed", "seizure", "choking"],
    "buy": ["buy", "purchase", "order", "shop", "shopping", "get me a", "where to buy", "recommend product", "best product", "which brand", "add to cart", "checkout", "delivery", "deliver", "price", "cost", "how much", "looking for a cake", "looking for cake", "need a cake", "need cake", "want a cake", "want cake", "looking for a treat", "looking for treat", "looking for food", "looking for toy"],
    "book": ["book", "booking", "schedule", "arrange", "set up", "appointment", "reserve", "want to book", "can you book", "help me book", "coordinate", "organise", "organize", "book a baker", "custom cake", "schedule delivery", "plan party", "book grooming", "book vet", "book trainer", "book walker", "book boarding", "book daycare", "book sitter"],
    "learn": ["how to", "guide", "tips", "advice", "tell me about", "what is", "explain", "teach", "learn", "understand", "education", "information", "video", "watch", "why does", "when should"],
    "plan": ["plan", "planning", "prepare", "get ready", "checklist", "list"],
    "track": ["track", "tracking", "monitor", "check", "status", "progress", "history"],
}

# Generic phrases that should NOT trigger book intent by themselves
GENERIC_PHRASES_NOT_BOOK = ["looking for", "need a", "find me", "get me", "want a"]


@dataclass
class ClassificationResult:
    """Output schema for classification pipeline."""
    primary_pillar: str
    canonical_tags: List[str]
    service_verticals: List[str]
    service_types: List[str]
    intent: str  # learn | buy | book | plan | track | emergency | unknown
    confidence: float  # 0-1
    safety_level: str  # normal | caution | emergency
    matched_synonyms: List[Dict[str, Any]]  # For audit/debug
    missing_profile_fields: List[str]  # So Picks can adapt
    
    def to_dict(self) -> Dict:
        return asdict(self)


class ClassificationPipeline:
    """
    MIRA OS Classification Pipeline
    
    Pipeline Order:
    1. Synonym match → canonical tags
    2. Safety gate (emergency override)
    3. Intent detection
    4. Pillar resolution
    5. LLM fallback (if confidence < 0.6 or no tags)
    """
    
    def __init__(self, db=None):
        if db is None:
            client = MongoClient(MONGO_URL)
            self.db = client[DB_NAME]
        else:
            self.db = db
        
        # Cache collections
        self._load_taxonomy()
    
    def _load_taxonomy(self):
        """Load taxonomy from MongoDB into memory for fast lookup."""
        # Load tag synonyms
        self.tag_synonyms = {}
        for syn in self.db.tag_synonyms.find({"deprecated": {"$ne": True}}):
            self.tag_synonyms[syn["synonym"].lower()] = {
                "tag": syn["tag"],
                "pillar": syn["pillar"],
                "confidence": syn.get("confidence", 0.85),
                "protected": syn.get("protected", False)
            }
        
        # Load canonical tags
        self.canonical_tags = {}
        for tag in self.db.canonical_tags.find({"deprecated": {"$ne": True}}):
            self.canonical_tags[tag["tag"]] = {
                "pillar": tag["pillar"],
                "safety_level": tag.get("safety_level", "normal"),
                "is_emergency": tag.get("is_emergency", False),
                "is_caution": tag.get("is_caution", False),
                "priority": tag.get("priority", "medium"),
                "cluster": tag.get("cluster", ""),
                "required_profile_fields": tag.get("constraints", {}).get("required_profile_fields", [])
            }
        
        # Load service vertical synonyms
        self.service_vertical_synonyms = {}
        for syn in self.db.service_vertical_synonyms.find():
            self.service_vertical_synonyms[syn["synonym"].lower()] = {
                "vertical": syn["vertical"],
                "confidence": syn.get("confidence", 0.85)
            }
        
        # Load service type synonyms
        self.service_type_synonyms = {}
        for syn in self.db.service_type_synonyms.find():
            self.service_type_synonyms[syn["synonym"].lower()] = {
                "type": syn["service_type"],
                "confidence": syn.get("confidence", 0.85)
            }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for matching."""
        # Lowercase
        text = text.lower()
        # Remove extra whitespace
        text = " ".join(text.split())
        # Basic cleanup
        text = re.sub(r'[^\w\s\'-]', ' ', text)
        return text.strip()
    
    def _tokenize(self, text: str) -> List[str]:
        """Generate tokens and n-grams for matching."""
        words = text.split()
        tokens = set()
        
        # Single words
        tokens.update(words)
        
        # 2-grams
        for i in range(len(words) - 1):
            tokens.add(f"{words[i]} {words[i+1]}")
        
        # 3-grams
        for i in range(len(words) - 2):
            tokens.add(f"{words[i]} {words[i+1]} {words[i+2]}")
        
        # 4-grams
        for i in range(len(words) - 3):
            tokens.add(f"{words[i]} {words[i+1]} {words[i+2]} {words[i+3]}")
        
        return list(tokens)
    
    def _step1_synonym_match(self, text: str) -> Dict:
        """Step 1: Match synonyms to canonical tags."""
        normalized = self._normalize_text(text)
        tokens = self._tokenize(normalized)
        
        matched_tags = {}
        matched_synonyms = []
        service_verticals = set()
        service_types = set()
        
        # Match tag synonyms
        for token in tokens:
            if token in self.tag_synonyms:
                syn_data = self.tag_synonyms[token]
                tag = syn_data["tag"]
                confidence = syn_data["confidence"]
                
                # Keep highest confidence match per tag
                if tag not in matched_tags or matched_tags[tag]["confidence"] < confidence:
                    matched_tags[tag] = {
                        "tag": tag,
                        "pillar": syn_data["pillar"],
                        "confidence": confidence,
                        "synonym": token,
                        "protected": syn_data["protected"]
                    }
                    
                matched_synonyms.append({
                    "synonym": token,
                    "tag": tag,
                    "pillar": syn_data["pillar"],
                    "confidence": confidence
                })
        
        # Also check if any token IS a canonical tag directly
        for token in tokens:
            if token.replace(" ", "_") in self.canonical_tags:
                tag = token.replace(" ", "_")
                tag_data = self.canonical_tags[tag]
                if tag not in matched_tags:
                    matched_tags[tag] = {
                        "tag": tag,
                        "pillar": tag_data["pillar"],
                        "confidence": 1.0,
                        "synonym": token,
                        "protected": tag_data.get("is_emergency", False)
                    }
        
        # Match service verticals
        for token in tokens:
            if token in self.service_vertical_synonyms:
                service_verticals.add(self.service_vertical_synonyms[token]["vertical"])
        
        # Match service types
        for token in tokens:
            if token in self.service_type_synonyms:
                service_types.add(self.service_type_synonyms[token]["type"])
        
        return {
            "matched_tags": matched_tags,
            "matched_synonyms": matched_synonyms,
            "service_verticals": list(service_verticals),
            "service_types": list(service_types)
        }
    
    def _step2_safety_gate(self, matched_tags: Dict) -> str:
        """Step 2: Safety gate - check for emergency/caution."""
        safety_level = "normal"
        
        for tag, data in matched_tags.items():
            if tag in self.canonical_tags:
                tag_safety = self.canonical_tags[tag].get("safety_level", "normal")
                
                # Emergency overrides everything
                if tag_safety == "emergency":
                    return "emergency"
                
                # Caution upgrades from normal
                if tag_safety == "caution" and safety_level == "normal":
                    safety_level = "caution"
        
        return safety_level
    
    def _step3_intent_detection(self, text: str, safety_level: str) -> str:
        """Step 3: Detect user intent."""
        normalized = self._normalize_text(text)
        
        # Emergency safety level = emergency intent
        if safety_level == "emergency":
            return "emergency"
        
        # Score each intent
        intent_scores = {}
        for intent, keywords in INTENT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in normalized:
                    score += 1
            intent_scores[intent] = score
        
        # Get highest scoring intent
        if max(intent_scores.values()) > 0:
            best_intent = max(intent_scores, key=intent_scores.get)
            return best_intent
        
        return "unknown"
    
    def _step4_pillar_resolution(self, matched_tags: Dict, safety_level: str) -> str:
        """Step 4: Resolve primary pillar from matched tags."""
        # Emergency override
        if safety_level == "emergency":
            return "emergency"
        
        if not matched_tags:
            return "advisory"  # Default fallback
        
        # Count pillar occurrences weighted by confidence
        pillar_scores = {}
        for tag, data in matched_tags.items():
            pillar = data["pillar"]
            confidence = data["confidence"]
            
            if pillar not in pillar_scores:
                pillar_scores[pillar] = 0
            pillar_scores[pillar] += confidence
        
        # Get highest scoring pillar
        if pillar_scores:
            best_pillar = max(pillar_scores, key=pillar_scores.get)
            # Validate against locked pillars
            if best_pillar in LOCKED_PILLARS:
                return best_pillar
        
        return "advisory"  # Default fallback
    
    def _calculate_confidence(self, matched_tags: Dict, matched_synonyms: List) -> float:
        """Calculate overall classification confidence."""
        if not matched_synonyms:
            return 0.0
        
        # Average confidence of matched synonyms
        total_confidence = sum(s["confidence"] for s in matched_synonyms)
        avg_confidence = total_confidence / len(matched_synonyms)
        
        # Boost for multiple matches
        match_count_boost = min(len(matched_synonyms) * 0.05, 0.2)
        
        # Boost for protected (emergency) matches
        protected_boost = 0.1 if any(matched_tags.get(s["tag"], {}).get("protected") for s in matched_synonyms) else 0
        
        confidence = min(avg_confidence + match_count_boost + protected_boost, 1.0)
        return round(confidence, 2)
    
    def _get_missing_profile_fields(self, matched_tags: Dict) -> List[str]:
        """Get required profile fields for personalization."""
        missing_fields = set()
        
        for tag in matched_tags:
            if tag in self.canonical_tags:
                tag_data = self.canonical_tags[tag]
                fields = tag_data.get("required_profile_fields", [])
                missing_fields.update(fields)
        
        return list(missing_fields)
    
    def _step5_llm_fallback(self, text: str, current_result: Dict) -> Dict:
        """Step 5: LLM fallback if confidence < 0.6 or no tags found."""
        # For now, this is a stub - can be enhanced with actual LLM call
        # The key is that we NEVER invent new pillars
        
        if current_result["confidence"] >= 0.6 and current_result["canonical_tags"]:
            return current_result
        
        # Simple keyword-based fallback
        normalized = text.lower()
        
        # Emergency keywords (high priority)
        emergency_words = ["poison", "chocolate", "bleeding", "seizure", "choking", "can't breathe", "collapsed", "unconscious", "emergency", "urgent"]
        if any(word in normalized for word in emergency_words):
            return {
                **current_result,
                "primary_pillar": "emergency",
                "safety_level": "emergency",
                "intent": "emergency",
                "confidence": 0.8
            }
        
        # Pillar keyword hints
        pillar_hints = {
            "care": ["groom", "bath", "vet", "nail", "vaccine", "health", "sick", "doctor"],
            "dine": ["food", "eat", "feed", "diet", "nutrition", "treat", "meal"],
            "stay": ["board", "kennel", "daycare", "sitter", "hotel"],
            "travel": ["travel", "fly", "flight", "airport", "trip", "car", "train"],
            "enjoy": ["play", "park", "toy", "fun", "walk", "cafe"],
            "fit": ["train", "walk", "exercise", "fitness"],
            "learn": ["learn", "teach", "guide", "how to", "class"],
            "celebrate": ["birthday", "party", "cake", "photo", "gift"],
            "adopt": ["adopt", "rescue", "shelter", "new pet"],
            "advisory": ["advice", "recommend", "help", "choose"],
            "paperwork": ["document", "certificate", "record", "insurance"],
            "farewell": ["memorial", "grief", "loss", "goodbye"]
        }
        
        for pillar, hints in pillar_hints.items():
            if any(hint in normalized for hint in hints):
                if current_result["confidence"] < 0.6:
                    current_result["primary_pillar"] = pillar
                    current_result["confidence"] = 0.6
                break
        
        return current_result
    
    def classify(self, message: str, pet_id: str = None, user_id: str = None, message_id: str = None) -> ClassificationResult:
        """
        Main classification entry point.
        
        Args:
            message: User message to classify
            pet_id: Pet ID for context (optional)
            user_id: User ID for logging (optional)
            message_id: Message ID for logging (optional)
        
        Returns:
            ClassificationResult with all fields
        """
        # Generate message_id if not provided
        if not message_id:
            message_id = str(uuid.uuid4())
        
        # Step 1: Synonym match
        step1_result = self._step1_synonym_match(message)
        matched_tags = step1_result["matched_tags"]
        matched_synonyms = step1_result["matched_synonyms"]
        service_verticals = step1_result["service_verticals"]
        service_types = step1_result["service_types"]
        
        # Step 2: Safety gate
        safety_level = self._step2_safety_gate(matched_tags)
        
        # Step 3: Intent detection
        intent = self._step3_intent_detection(message, safety_level)
        
        # Step 4: Pillar resolution
        primary_pillar = self._step4_pillar_resolution(matched_tags, safety_level)
        
        # Calculate confidence
        confidence = self._calculate_confidence(matched_tags, matched_synonyms)
        
        # Get missing profile fields
        missing_profile_fields = self._get_missing_profile_fields(matched_tags)
        
        # Build result
        result = {
            "primary_pillar": primary_pillar,
            "canonical_tags": list(matched_tags.keys()),
            "service_verticals": service_verticals,
            "service_types": service_types,
            "intent": intent,
            "confidence": confidence,
            "safety_level": safety_level,
            "matched_synonyms": matched_synonyms,
            "missing_profile_fields": missing_profile_fields
        }
        
        # Step 5: LLM fallback if needed
        if confidence < 0.6 or not matched_tags:
            result = self._step5_llm_fallback(message, result)
        
        # Validate pillar is in locked set
        if result["primary_pillar"] not in LOCKED_PILLARS:
            result["primary_pillar"] = "advisory"
        
        # Create result object
        classification = ClassificationResult(**result)
        
        # Log to events_log
        self._log_event(
            message_id=message_id,
            pet_id=pet_id,
            user_id=user_id,
            message=message,
            classification=classification
        )
        
        return classification
    
    def _log_event(self, message_id: str, pet_id: str, user_id: str, message: str, classification: ClassificationResult):
        """Log classification event to events_log collection."""
        event = {
            "message_id": message_id,
            "pet_id": pet_id,
            "user_id": user_id,
            "message": message,
            "primary_pillar": classification.primary_pillar,
            "canonical_tags": classification.canonical_tags,
            "service_verticals": classification.service_verticals,
            "service_types": classification.service_types,
            "intent": classification.intent,
            "confidence": classification.confidence,
            "safety_level": classification.safety_level,
            "matched_synonyms": [s["synonym"] for s in classification.matched_synonyms],
            "synonyms_hit": len(classification.matched_synonyms),
            "missing_profile_fields": classification.missing_profile_fields,
            "timestamp": datetime.now(timezone.utc),
            "picks_shown": []  # To be filled by picks engine
        }
        
        try:
            self.db.events_log.insert_one(event)
        except Exception as e:
            print(f"Warning: Failed to log event: {e}")


# Convenience function for direct use
def classify_message(message: str, pet_id: str = None, user_id: str = None, message_id: str = None) -> Dict:
    """
    Classify a message and return the result as a dictionary.
    
    Args:
        message: User message to classify
        pet_id: Pet ID for context
        user_id: User ID for logging
        message_id: Message ID for logging
    
    Returns:
        Dictionary with classification result
    """
    pipeline = ClassificationPipeline()
    result = pipeline.classify(message, pet_id, user_id, message_id)
    return result.to_dict()


# For testing
if __name__ == "__main__":
    import json
    
    pipeline = ClassificationPipeline()
    
    test_messages = [
        "looking for grooming for mojo",
        "looking for a cake for mojo",
        "my dog ate chocolate"
    ]
    
    print("=" * 60)
    print("CLASSIFICATION PIPELINE TEST")
    print("=" * 60)
    
    for msg in test_messages:
        print(f"\n>>> INPUT: \"{msg}\"")
        result = pipeline.classify(msg, pet_id="test_pet", user_id="test_user")
        print(json.dumps(result.to_dict(), indent=2, default=str))
