"""
MIRA OS Picks Scoring Function - Phase B4
seed_version: 1.0.0

Scores and ranks picks based on:
1. Safety gates (emergency/caution filtering)
2. Intent gates (buy/book/learn filtering)
3. Tag match relevance
4. Profile completeness penalty + micro-question generation
5. Diversity rerank (booking/product + guide + optional concierge)
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@dataclass
class ScoredPick:
    """A pick with its computed score and ranking info."""
    pick_id: str
    pillar: str
    pick_type: str
    title: str
    cta: str
    reason: str  # Interpolated reason_template
    
    # Scoring
    base_score: float
    tag_match_score: float
    profile_penalty: float
    recency_bonus: float
    final_score: float
    
    # Metadata
    matched_tags: List[str]
    missing_fields: List[str]
    micro_questions: List[str]
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PicksResult:
    """Result of picks scoring and ranking."""
    picks: List[ScoredPick]
    total_candidates: int
    filtered_by_safety: int
    filtered_by_intent: int
    diversity_applied: bool
    micro_questions: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "picks": [p.to_dict() for p in self.picks],
            "total_candidates": self.total_candidates,
            "filtered_by_safety": self.filtered_by_safety,
            "filtered_by_intent": self.filtered_by_intent,
            "diversity_applied": self.diversity_applied,
            "micro_questions": self.micro_questions
        }


class PicksScorer:
    """
    B4 Picks Scoring Function.
    
    Scoring formula:
    final_score = (base_score * tag_match_multiplier) - profile_penalty + recency_bonus
    
    Where:
    - base_score: From picks_catalogue (0-100)
    - tag_match_multiplier: 1.0 + (0.1 * num_matching_tags)
    - profile_penalty: 5 points per missing required field
    - recency_bonus: Up to 10 points based on last_service_date
    """
    
    def __init__(self, db=None):
        if db is None:
            client = MongoClient(MONGO_URL)
            self.db = client[DB_NAME]
        else:
            self.db = db
    
    def score_and_rank(
        self,
        classification: Dict,
        pet_profile: Optional[Dict] = None,
        max_picks: int = 5
    ) -> PicksResult:
        """
        Score and rank picks based on classification and pet profile.
        
        Args:
            classification: Output from classify_with_safety()
            pet_profile: Pet data for personalization
            max_picks: Maximum picks to return
        
        Returns:
            PicksResult with ranked picks
        """
        if pet_profile is None:
            pet_profile = {}
        
        safety_override = classification.get("safety_override", {})
        canonical_tags = classification.get("canonical_tags", [])
        intent = classification.get("intent", "unknown")
        pillar = classification.get("primary_pillar", "advisory")
        
        # Step 1: Get candidate picks from catalogue
        candidates = self._get_candidates(pillar, canonical_tags)
        total_candidates = len(candidates)
        
        # Step 2: Apply safety gate filter
        filtered_safety, safety_filtered_count = self._filter_by_safety(
            candidates, safety_override
        )
        
        # Step 3: Apply intent gate filter
        filtered_intent, intent_filtered_count = self._filter_by_intent(
            filtered_safety, intent, safety_override
        )
        
        # Step 4: Score remaining picks
        scored = []
        all_micro_questions = []
        
        for pick in filtered_intent:
            scored_pick, micro_qs = self._score_pick(
                pick, canonical_tags, pet_profile
            )
            scored.append(scored_pick)
            all_micro_questions.extend(micro_qs)
        
        # Step 5: Sort by final_score descending
        scored.sort(key=lambda p: p.final_score, reverse=True)
        
        # Step 6: Apply diversity rerank
        diverse_picks, diversity_applied = self._apply_diversity(
            scored, intent, max_picks
        )
        
        # Dedupe micro questions
        unique_questions = list(dict.fromkeys(all_micro_questions))[:3]
        
        return PicksResult(
            picks=diverse_picks,
            total_candidates=total_candidates,
            filtered_by_safety=safety_filtered_count,
            filtered_by_intent=intent_filtered_count,
            diversity_applied=diversity_applied,
            micro_questions=unique_questions
        )
    
    def _get_candidates(self, pillar: str, canonical_tags: List[str]) -> List[Dict]:
        """Get candidate picks matching pillar or tags."""
        # Query picks that match pillar OR have matching tags
        query = {
            "active": {"$ne": False},
            "$or": [
                {"pillar": pillar},
                {"canonical_tags": {"$in": canonical_tags}}
            ]
        }
        
        candidates = list(self.db.picks_catalogue.find(query))
        return candidates
    
    def _filter_by_safety(
        self, picks: List[Dict], safety_override: Dict
    ) -> Tuple[List[Dict], int]:
        """Filter picks by safety gate."""
        if not safety_override.get("is_active"):
            return picks, 0
        
        level = safety_override.get("level", "normal")
        allowed_types = set(safety_override.get("allowed_pick_types", []))
        
        filtered = []
        removed = 0
        
        for pick in picks:
            pick_type = pick.get("pick_type", "")
            pick_safety = pick.get("safety_level", "normal")
            
            # Emergency: only emergency picks + emergency concierge
            if level == "emergency":
                if pick_type == "emergency":
                    filtered.append(pick)
                elif pick_type == "concierge" and pick_safety == "emergency":
                    filtered.append(pick)
                else:
                    removed += 1
            
            # Caution: no products
            elif level == "caution":
                if pick_type in allowed_types:
                    filtered.append(pick)
                else:
                    removed += 1
            
            # Normal: all allowed
            else:
                filtered.append(pick)
        
        return filtered, removed
    
    def _filter_by_intent(
        self, picks: List[Dict], intent: str, safety_override: Dict
    ) -> Tuple[List[Dict], int]:
        """Filter picks by intent (prioritize matching types)."""
        # Don't filter by intent for emergency/caution
        if safety_override.get("level") in ["emergency", "caution"]:
            return picks, 0
        
        # Intent to pick_type mapping
        intent_type_map = {
            "buy": ["product"],
            "book": ["booking"],
            "learn": ["guide", "checklist"],
            "plan": ["checklist", "guide", "concierge"],
            "track": ["guide"],
            "emergency": ["emergency"],
        }
        
        preferred_types = intent_type_map.get(intent, [])
        
        if not preferred_types:
            # Unknown intent: don't filter, just return all
            return picks, 0
        
        # Split into preferred and others
        preferred = []
        others = []
        
        for pick in picks:
            pick_type = pick.get("pick_type", "")
            if pick_type in preferred_types:
                preferred.append(pick)
            else:
                others.append(pick)
        
        # Return preferred first, then others (don't remove, just deprioritize)
        # Boost preferred picks by adding to front
        return preferred + others, 0
    
    def _score_pick(
        self, pick: Dict, canonical_tags: List[str], pet_profile: Dict
    ) -> Tuple[ScoredPick, List[str]]:
        """Score a single pick."""
        pick_tags = pick.get("canonical_tags", [])
        required_fields = pick.get("constraints", {}).get("required_profile_fields", [])
        reason_template = pick.get("reason_template", "")
        
        # Calculate tag match score
        matching_tags = [t for t in pick_tags if t in canonical_tags]
        tag_match_multiplier = 1.0 + (0.15 * len(matching_tags))
        tag_match_score = min(tag_match_multiplier, 1.5)  # Cap at 1.5x
        
        # Calculate profile penalty
        missing_fields = []
        profile_penalty = 0
        micro_questions = []
        
        for field in required_fields:
            if not pet_profile.get(field):
                missing_fields.append(field)
                profile_penalty += 5
                # Generate micro question
                micro_q = self._generate_micro_question(field)
                if micro_q:
                    micro_questions.append(micro_q)
        
        # Calculate recency bonus
        recency_bonus = 0
        last_service = pet_profile.get("last_service_date")
        if last_service and pick.get("pick_type") == "booking":
            # Bonus for services that might be due
            # (simplified - real implementation would check service type)
            recency_bonus = 5
        
        # Calculate final score
        base_score = pick.get("base_score", 50)
        final_score = (base_score * tag_match_score) - profile_penalty + recency_bonus
        final_score = max(0, min(100, final_score))  # Clamp to 0-100
        
        # Interpolate reason template
        reason = self._interpolate_reason(reason_template, pet_profile)
        
        return ScoredPick(
            pick_id=pick.get("pick_id", ""),
            pillar=pick.get("pillar", ""),
            pick_type=pick.get("pick_type", ""),
            title=pick.get("title", ""),
            cta=pick.get("cta", ""),
            reason=reason,
            base_score=base_score,
            tag_match_score=round(tag_match_score, 2),
            profile_penalty=profile_penalty,
            recency_bonus=recency_bonus,
            final_score=round(final_score, 2),
            matched_tags=matching_tags,
            missing_fields=missing_fields,
            micro_questions=micro_questions
        ), micro_questions
    
    def _generate_micro_question(self, field: str) -> Optional[str]:
        """Generate a micro question for a missing profile field."""
        questions = {
            "breed": "What breed is your pet?",
            "coat_type": "What type of coat does your pet have? (short, long, curly, double)",
            "weight": "How much does your pet weigh?",
            "age_stage": "Is your pet a puppy, adult, or senior?",
            "city": "What city are you located in?",
            "allergies": "Does your pet have any known allergies?",
            "dob": "When is your pet's birthday?",
            "last_vaccination_date": "When was your pet's last vaccination?",
            "energy_level": "Would you describe your pet as low, medium, or high energy?",
            "temperament": "How would you describe your pet's temperament?",
        }
        return questions.get(field)
    
    def _interpolate_reason(self, template: str, pet_profile: Dict) -> str:
        """Interpolate pet data into reason template."""
        if not template:
            return ""
        
        # Default values for missing fields
        defaults = {
            "pet_name": "your pet",
            "breed": "your pet's breed",
            "coat_type": "their coat",
            "age_stage": "their life stage",
            "city": "your area",
            "allergies": "any sensitivities",
            "age": "their age",
            "dob": "their birthday",
            "energy_level": "their energy level",
            "temperament": "their temperament",
        }
        
        result = template
        for key, default in defaults.items():
            placeholder = "{" + key + "}"
            value = pet_profile.get(key, default)
            if value and placeholder in result:
                result = result.replace(placeholder, str(value))
        
        return result
    
    def _apply_diversity(
        self, picks: List[ScoredPick], intent: str, max_picks: int
    ) -> Tuple[List[ScoredPick], bool]:
        """
        Apply diversity rerank to ensure variety.
        
        Rules:
        - Include at least one actionable pick (booking/product based on intent)
        - Include at least one educational pick (guide)
        - Include concierge if complexity warrants it
        - Don't repeat same pick_type too many times
        """
        if len(picks) <= max_picks:
            return picks, False
        
        # Buckets
        action_picks = []  # booking, product
        education_picks = []  # guide, checklist
        concierge_picks = []  # concierge
        emergency_picks = []  # emergency
        
        for pick in picks:
            pt = pick.pick_type
            if pt in ["booking", "product"]:
                action_picks.append(pick)
            elif pt in ["guide", "checklist"]:
                education_picks.append(pick)
            elif pt == "concierge":
                concierge_picks.append(pick)
            elif pt == "emergency":
                emergency_picks.append(pick)
        
        # Build diverse result
        result = []
        
        # Emergency picks first (if any)
        if emergency_picks:
            result.extend(emergency_picks[:2])
        
        # Add action picks based on intent
        if intent == "buy" and action_picks:
            # Prioritize products
            products = [p for p in action_picks if p.pick_type == "product"]
            bookings = [p for p in action_picks if p.pick_type == "booking"]
            result.extend(products[:2])
            result.extend(bookings[:1])
        elif intent == "book" and action_picks:
            # Prioritize bookings
            bookings = [p for p in action_picks if p.pick_type == "booking"]
            products = [p for p in action_picks if p.pick_type == "product"]
            result.extend(bookings[:2])
            result.extend(products[:1])
        else:
            result.extend(action_picks[:2])
        
        # Add education picks
        result.extend(education_picks[:2])
        
        # Add one concierge if we have room and complexity warrants
        if concierge_picks and len(result) < max_picks:
            result.append(concierge_picks[0])
        
        # Sort by final_score again
        result.sort(key=lambda p: p.final_score, reverse=True)
        
        # Trim to max
        result = result[:max_picks]
        
        return result, True


def score_picks(
    classification: Dict,
    pet_profile: Optional[Dict] = None,
    max_picks: int = 5
) -> Dict:
    """
    Convenience function to score and rank picks.
    
    Args:
        classification: Output from classify_with_safety()
        pet_profile: Pet data for personalization
        max_picks: Maximum picks to return
    
    Returns:
        PicksResult as dict
    """
    scorer = PicksScorer()
    result = scorer.score_and_rank(classification, pet_profile, max_picks)
    return result.to_dict()


def get_picks_for_message(
    message: str,
    pet_profile: Optional[Dict] = None,
    max_picks: int = 5
) -> Dict:
    """
    Full pipeline: classify message + score picks.
    
    Args:
        message: User message
        pet_profile: Pet data
        max_picks: Maximum picks
    
    Returns:
        Dict with classification + picks
    """
    from safety_gate import classify_with_safety
    
    classification = classify_with_safety(message)
    picks_result = score_picks(classification, pet_profile, max_picks)
    
    return {
        "classification": classification,
        "picks": picks_result
    }


# For testing
if __name__ == "__main__":
    import json
    
    print("=" * 60)
    print("B4 PICKS SCORING TEST")
    print("=" * 60)
    
    # Test pet profile
    mojo_profile = {
        "pet_name": "Mojo",
        "breed": "Golden Retriever",
        "coat_type": "long",
        "age_stage": "adult",
        "city": "Mumbai"
    }
    
    test_cases = [
        ("looking for grooming for mojo", mojo_profile),
        ("looking for a cake for mojo", mojo_profile),
        ("my dog ate chocolate", {}),
        ("vomiting twice", mojo_profile),
    ]
    
    for message, profile in test_cases:
        print(f"\n>>> INPUT: \"{message}\"")
        print(f"    PROFILE: {profile.get('pet_name', 'None')}")
        
        result = get_picks_for_message(message, profile, max_picks=3)
        
        classification = result["classification"]
        picks = result["picks"]
        
        print(f"    PILLAR: {classification['primary_pillar']}")
        print(f"    INTENT: {classification['intent']}")
        print(f"    SAFETY: {classification['safety_level']}")
        print(f"    TOTAL CANDIDATES: {picks['total_candidates']}")
        print(f"    FILTERED BY SAFETY: {picks['filtered_by_safety']}")
        print(f"    DIVERSITY APPLIED: {picks['diversity_applied']}")
        
        print("    TOP PICKS:")
        for i, pick in enumerate(picks["picks"][:3], 1):
            print(f"      {i}. [{pick['pick_type']}] {pick['title']} (score: {pick['final_score']})")
            if pick.get("missing_fields"):
                print(f"         Missing: {pick['missing_fields']}")
        
        if picks.get("micro_questions"):
            print(f"    MICRO QUESTIONS: {picks['micro_questions'][:2]}")
