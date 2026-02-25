#!/usr/bin/env python3
"""
MIRA OS Concierge Logic - Phase B5
Determines Concierge CTA prominence based on context signals.

Key Principle:
- Concierge is ALWAYS available (always_on mode)
- Prominence shifts based on:
  - MANDATORY: safety, complexity, time pressure, ambiguity
  - EXPERIENCE: coordination value, pick complexity
  - QUIET: straightforward self-serve scenarios

Output Contract:
{
    "mode": "always_on",
    "cta_prominence": "primary" | "secondary" | "quiet",
    "reason": "multi_step" | "safety_override" | "tight_timeline" | etc,
    "cta": "Have Concierge® coordinate"
}
"""

from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
import re
import logging

logger = logging.getLogger(__name__)


# ============== CONSTANTS ==============

class CTAProminence(str, Enum):
    PRIMARY = "primary"      # Featured, main CTA
    SECONDARY = "secondary"  # Supporting, visible but not headline
    QUIET = "quiet"          # Always-on icon/button, not prominent


class ConciergeReason(str, Enum):
    # Mandatory reasons (system must take over)
    SAFETY_OVERRIDE = "safety_override"
    MULTI_STEP = "multi_step"
    TIGHT_TIMELINE = "tight_timeline"
    LOW_CONFIDENCE = "low_confidence"
    
    # Experience reasons (coordination creates magic)
    COORDINATION_VALUE = "coordination_value"
    PICK_COMPLEXITY = "pick_complexity"
    
    # Default
    ALWAYS_AVAILABLE = "always_available"


# Time pressure keywords
TIME_PRESSURE_PATTERNS = [
    r"\btoday\b",
    r"\btomorrow\b",
    r"\btonight\b",
    r"\bthis\s+week(end)?\b",
    r"\bnext\s+week\b",
    r"\burgent(ly)?\b",
    r"\basap\b",
    r"\bimmediately\b",
    r"\bright\s+now\b",
    r"\bas\s+soon\s+as\b",
    r"\bemergency\b",
    r"\blast\s+minute\b",
    r"\bin\s+\d+\s+(hour|day|minute)s?\b",
]

# Pillars with high coordination value
COORDINATION_PILLARS = {"celebrate", "travel", "stay"}

# Pick types that indicate coordination (not just guides)
COORDINATION_PICK_TYPES = {"booking", "concierge", "product"}

# Confidence threshold for ambiguity detection
CONFIDENCE_THRESHOLD = 0.65


@dataclass
class ClassificationContext:
    """Context from classification pipeline for concierge decision."""
    primary_pillar: str
    safety_level: str = "normal"  # "normal", "caution", "emergency"
    confidence: float = 0.0
    service_verticals: List[str] = field(default_factory=list)
    canonical_tags: List[str] = field(default_factory=list)
    intent: Optional[str] = None  # "buy", "book", "learn", "ask"
    original_message: str = ""


@dataclass
class TopPickContext:
    """Context from the top-ranked pick for concierge decision."""
    pick_id: str = ""
    pick_type: str = ""  # "guide", "booking", "product", "concierge"
    pillar: str = ""
    concierge_complexity: str = "low"  # "low", "medium", "high"
    service_vertical: Optional[str] = None
    has_booking_fields: bool = False
    has_doc_requirements: bool = False


@dataclass
class ConciergeDecision:
    """The output of concierge logic - what to show to the user."""
    mode: str = "always_on"  # Always this value
    cta_prominence: str = CTAProminence.QUIET.value
    reason: str = ConciergeReason.ALWAYS_AVAILABLE.value
    cta: str = "Concierge® can help"
    suppress_commerce: bool = False
    additional_context: Dict[str, Any] = field(default_factory=dict)


# ============== CTA TEXT TEMPLATES ==============

CTA_TEMPLATES = {
    ConciergeReason.SAFETY_OVERRIDE: "I'm connecting you to emergency steps now",
    ConciergeReason.MULTI_STEP: "Have Concierge® coordinate everything",
    ConciergeReason.TIGHT_TIMELINE: "Let Concierge® handle the timing",
    ConciergeReason.LOW_CONFIDENCE: "Let me clarify and help you",
    ConciergeReason.COORDINATION_VALUE: "Want Concierge® to coordinate this?",
    ConciergeReason.PICK_COMPLEXITY: "Concierge® can handle this end-to-end",
    ConciergeReason.ALWAYS_AVAILABLE: "Concierge® can help",
}

CTA_TEMPLATES_BY_PILLAR = {
    "celebrate": "Tell me date + city + preferences; I'll handle everything",
    "travel": "Share your travel dates; I'll coordinate docs + transport",
    "stay": "Let me find the perfect match for {pet_name}'s personality",
    "care": "Want me to coordinate slots + home visit?",
    "emergency": "I'm connecting you to emergency steps + nearest vet now",
}


# ============== DETECTION FUNCTIONS ==============

def detect_time_pressure(message: str) -> bool:
    """Detect if message contains time pressure keywords."""
    message_lower = message.lower()
    for pattern in TIME_PRESSURE_PATTERNS:
        if re.search(pattern, message_lower):
            return True
    return False


def detect_multi_step(
    classification: ClassificationContext,
    top_pick: Optional[TopPickContext] = None
) -> bool:
    """
    Detect if request requires multi-step coordination.
    True when:
    - Multiple service verticals involved (>= 2)
    - Booking + product + logistics/paperwork combined
    """
    # Multiple service verticals
    if len(classification.service_verticals) >= 2:
        return True
    
    # Check if pick has multiple coordination needs
    if top_pick:
        coordination_signals = 0
        if top_pick.has_booking_fields:
            coordination_signals += 1
        if top_pick.has_doc_requirements:
            coordination_signals += 1
        if top_pick.service_vertical:
            coordination_signals += 1
        if top_pick.pick_type in COORDINATION_PICK_TYPES:
            coordination_signals += 1
        
        if coordination_signals >= 3:
            return True
    
    return False


def detect_coordination_value(
    classification: ClassificationContext,
    top_pick: Optional[TopPickContext] = None
) -> bool:
    """
    Detect if this is a coordination-heavy pillar with actual coordination needs.
    Celebrate/Travel/Stay qualify ONLY when it involves coordination (not just guides).
    """
    # Must be a coordination pillar
    if classification.primary_pillar not in COORDINATION_PILLARS:
        return False
    
    # Must NOT be just asking for a guide
    if classification.intent == "learn":
        return False
    
    # If we have a pick, check if it's a coordination type
    if top_pick:
        if top_pick.pick_type not in COORDINATION_PICK_TYPES:
            return False
        # Check for actual coordination signals
        if top_pick.has_booking_fields or top_pick.has_doc_requirements:
            return True
    
    # If intent is book or buy in coordination pillar, assume coordination value
    if classification.intent in ["book", "buy"]:
        return True
    
    return False


def detect_pick_complexity(
    top_pick: Optional[TopPickContext],
    other_conditions_met: bool = False
) -> bool:
    """
    Detect if top pick indicates high complexity.
    - High complexity = always PRIMARY
    - Medium complexity + other conditions = PRIMARY
    """
    if not top_pick:
        return False
    
    if top_pick.concierge_complexity == "high":
        return True
    
    if top_pick.concierge_complexity == "medium" and other_conditions_met:
        return True
    
    return False


def is_straightforward_selfserve(
    classification: ClassificationContext,
    top_pick: Optional[TopPickContext] = None
) -> bool:
    """
    Detect if request is straightforward self-serve.
    True when:
    - User asked for a guide
    - Single service, no time pressure
    - High confidence
    """
    # Must be high confidence
    if classification.confidence < CONFIDENCE_THRESHOLD:
        return False
    
    # Learn intent is self-serve
    if classification.intent == "learn":
        return True
    
    # Guide pick type is self-serve
    if top_pick and top_pick.pick_type == "guide":
        # Unless it has complex coordination needs
        if top_pick.has_booking_fields or top_pick.has_doc_requirements:
            return False
        return True
    
    # Single service vertical with no time pressure
    if len(classification.service_verticals) <= 1:
        if not detect_time_pressure(classification.original_message):
            return True
    
    return False


# ============== MAIN DECISION FUNCTION ==============

def determine_concierge_prominence(
    classification: ClassificationContext,
    top_pick: Optional[TopPickContext] = None,
    pet_name: str = "your pet"
) -> ConciergeDecision:
    """
    Determine Concierge CTA prominence based on all context signals.
    
    Returns a ConciergeDecision with:
    - mode: Always "always_on"
    - cta_prominence: "primary", "secondary", or "quiet"
    - reason: Why this prominence was chosen
    - cta: The CTA text to display
    - suppress_commerce: True if safety override active
    """
    decision = ConciergeDecision()
    
    # ============== MANDATORY PRIMARY CONDITIONS ==============
    
    # 1. Safety override (highest priority)
    if classification.safety_level in ["caution", "emergency"]:
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.SAFETY_OVERRIDE.value
        decision.cta = CTA_TEMPLATES[ConciergeReason.SAFETY_OVERRIDE]
        decision.suppress_commerce = True
        decision.additional_context["safety_level"] = classification.safety_level
        logger.info(f"Concierge PRIMARY: safety_override ({classification.safety_level})")
        return decision
    
    # 2. Low confidence / ambiguity
    if classification.confidence < CONFIDENCE_THRESHOLD:
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.LOW_CONFIDENCE.value
        decision.cta = CTA_TEMPLATES[ConciergeReason.LOW_CONFIDENCE]
        decision.additional_context["confidence"] = classification.confidence
        logger.info(f"Concierge PRIMARY: low_confidence ({classification.confidence})")
        return decision
    
    # 3. Time pressure
    if detect_time_pressure(classification.original_message):
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.TIGHT_TIMELINE.value
        decision.cta = CTA_TEMPLATES[ConciergeReason.TIGHT_TIMELINE]
        logger.info("Concierge PRIMARY: tight_timeline")
        return decision
    
    # 4. Multi-step execution required
    if detect_multi_step(classification, top_pick):
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.MULTI_STEP.value
        decision.cta = CTA_TEMPLATES[ConciergeReason.MULTI_STEP]
        decision.additional_context["service_verticals"] = classification.service_verticals
        logger.info(f"Concierge PRIMARY: multi_step ({len(classification.service_verticals)} verticals)")
        return decision
    
    # ============== EXPERIENCE-LEVEL PRIMARY CONDITIONS ==============
    
    # Track if any secondary conditions are met (for medium complexity boost)
    any_secondary_condition = False
    
    # 5. Coordination value (celebrate/travel/stay with actual coordination)
    if detect_coordination_value(classification, top_pick):
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.COORDINATION_VALUE.value
        # Use pillar-specific CTA if available
        pillar_cta = CTA_TEMPLATES_BY_PILLAR.get(classification.primary_pillar)
        if pillar_cta:
            decision.cta = pillar_cta.replace("{pet_name}", pet_name)
        else:
            decision.cta = CTA_TEMPLATES[ConciergeReason.COORDINATION_VALUE]
        logger.info(f"Concierge PRIMARY: coordination_value ({classification.primary_pillar})")
        return decision
    
    # 6. Pick complexity (high = PRIMARY, medium + conditions = PRIMARY)
    if detect_pick_complexity(top_pick, any_secondary_condition):
        decision.cta_prominence = CTAProminence.PRIMARY.value
        decision.reason = ConciergeReason.PICK_COMPLEXITY.value
        decision.cta = CTA_TEMPLATES[ConciergeReason.PICK_COMPLEXITY]
        if top_pick:
            decision.additional_context["pick_complexity"] = top_pick.concierge_complexity
        logger.info(f"Concierge PRIMARY: pick_complexity ({top_pick.concierge_complexity if top_pick else 'N/A'})")
        return decision
    
    # ============== SECONDARY CONDITIONS ==============
    
    # Coordination pillar but just asking for info
    if classification.primary_pillar in COORDINATION_PILLARS:
        decision.cta_prominence = CTAProminence.SECONDARY.value
        decision.reason = ConciergeReason.COORDINATION_VALUE.value
        pillar_cta = CTA_TEMPLATES_BY_PILLAR.get(classification.primary_pillar)
        if pillar_cta:
            decision.cta = pillar_cta.replace("{pet_name}", pet_name)
        else:
            decision.cta = CTA_TEMPLATES[ConciergeReason.COORDINATION_VALUE]
        logger.info(f"Concierge SECONDARY: coordination pillar ({classification.primary_pillar})")
        return decision
    
    # Medium complexity pick without other triggers
    if top_pick and top_pick.concierge_complexity == "medium":
        decision.cta_prominence = CTAProminence.SECONDARY.value
        decision.reason = ConciergeReason.PICK_COMPLEXITY.value
        decision.cta = "Want me to coordinate this?"
        logger.info("Concierge SECONDARY: medium complexity")
        return decision
    
    # Booking or product pick (has some coordination value)
    if top_pick and top_pick.pick_type in ["booking", "product"]:
        decision.cta_prominence = CTAProminence.SECONDARY.value
        decision.reason = ConciergeReason.ALWAYS_AVAILABLE.value
        decision.cta = "Want Concierge® to handle this?"
        logger.info(f"Concierge SECONDARY: {top_pick.pick_type} pick")
        return decision
    
    # ============== QUIET (DEFAULT) ==============
    
    # Straightforward self-serve scenarios
    decision.cta_prominence = CTAProminence.QUIET.value
    decision.reason = ConciergeReason.ALWAYS_AVAILABLE.value
    decision.cta = CTA_TEMPLATES[ConciergeReason.ALWAYS_AVAILABLE]
    logger.info("Concierge QUIET: straightforward self-serve")
    
    return decision


# ============== HELPER FUNCTIONS ==============

def create_classification_context(
    primary_pillar: str,
    safety_level: str = "normal",
    confidence: float = 0.8,
    service_verticals: List[str] = None,
    canonical_tags: List[str] = None,
    intent: str = None,
    original_message: str = ""
) -> ClassificationContext:
    """Helper to create ClassificationContext for testing."""
    return ClassificationContext(
        primary_pillar=primary_pillar,
        safety_level=safety_level,
        confidence=confidence,
        service_verticals=service_verticals or [],
        canonical_tags=canonical_tags or [],
        intent=intent,
        original_message=original_message
    )


def create_top_pick_context(
    pick_id: str = "",
    pick_type: str = "guide",
    pillar: str = "",
    concierge_complexity: str = "low",
    service_vertical: str = None,
    has_booking_fields: bool = False,
    has_doc_requirements: bool = False
) -> TopPickContext:
    """Helper to create TopPickContext for testing."""
    return TopPickContext(
        pick_id=pick_id,
        pick_type=pick_type,
        pillar=pillar,
        concierge_complexity=concierge_complexity,
        service_vertical=service_vertical,
        has_booking_fields=has_booking_fields,
        has_doc_requirements=has_doc_requirements
    )


# ============== MAIN TEST ==============

if __name__ == "__main__":
    print("=" * 60)
    print("MIRA OS Concierge Logic - Phase B5")
    print("=" * 60)
    
    # Test 1: Safety override (emergency)
    print("\n--- Test 1: Emergency Safety Override ---")
    ctx = create_classification_context(
        primary_pillar="emergency",
        safety_level="emergency",
        confidence=0.95,
        original_message="my dog ate chocolate"
    )
    decision = determine_concierge_prominence(ctx)
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    print(f"Suppress Commerce: {decision.suppress_commerce}")
    assert decision.cta_prominence == "primary"
    assert decision.reason == "safety_override"
    
    # Test 2: Time pressure
    print("\n--- Test 2: Time Pressure (today/urgent) ---")
    ctx = create_classification_context(
        primary_pillar="care",
        confidence=0.85,
        original_message="I need grooming for my dog today please"
    )
    decision = determine_concierge_prominence(ctx)
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "primary"
    assert decision.reason == "tight_timeline"
    
    # Test 3: Low confidence
    print("\n--- Test 3: Low Confidence (ambiguity) ---")
    ctx = create_classification_context(
        primary_pillar="dine",
        confidence=0.45,
        original_message="something for my dog"
    )
    decision = determine_concierge_prominence(ctx)
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "primary"
    assert decision.reason == "low_confidence"
    
    # Test 4: Coordination value (celebrate with booking)
    print("\n--- Test 4: Coordination Value (celebrate + booking) ---")
    ctx = create_classification_context(
        primary_pillar="celebrate",
        confidence=0.85,
        intent="book",
        original_message="I want to plan a birthday party for Mojo"
    )
    pick = create_top_pick_context(
        pick_id="celebrate_birthday",
        pick_type="booking",
        pillar="celebrate",
        concierge_complexity="medium",
        has_booking_fields=True
    )
    decision = determine_concierge_prominence(ctx, pick, pet_name="Mojo")
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "primary"
    assert decision.reason == "coordination_value"
    
    # Test 5: Simple guide (quiet)
    print("\n--- Test 5: Simple Guide Request (quiet) ---")
    ctx = create_classification_context(
        primary_pillar="learn",
        confidence=0.90,
        intent="learn",
        original_message="how do I potty train my puppy"
    )
    pick = create_top_pick_context(
        pick_id="learn_potty_training",
        pick_type="guide",
        pillar="learn",
        concierge_complexity="low"
    )
    decision = determine_concierge_prominence(ctx, pick)
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "quiet"
    
    # Test 6: Grooming booking (secondary)
    print("\n--- Test 6: Grooming Booking (secondary) ---")
    ctx = create_classification_context(
        primary_pillar="care",
        confidence=0.88,
        intent="book",
        service_verticals=["grooming"],
        original_message="looking for grooming for Mojo"
    )
    pick = create_top_pick_context(
        pick_id="care_grooming_book",
        pick_type="booking",
        pillar="care",
        concierge_complexity="low",
        service_vertical="grooming"
    )
    decision = determine_concierge_prominence(ctx, pick, pet_name="Mojo")
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "secondary"
    
    # Test 7: High complexity pick
    print("\n--- Test 7: High Complexity Pick (primary) ---")
    ctx = create_classification_context(
        primary_pillar="advisory",
        confidence=0.80,
        intent="ask",
        original_message="I need help planning everything for my new puppy"
    )
    pick = create_top_pick_context(
        pick_id="advisory_concierge",
        pick_type="concierge",
        pillar="advisory",
        concierge_complexity="high"
    )
    decision = determine_concierge_prominence(ctx, pick)
    print(f"Prominence: {decision.cta_prominence}")
    print(f"Reason: {decision.reason}")
    print(f"CTA: {decision.cta}")
    assert decision.cta_prominence == "primary"
    assert decision.reason == "pick_complexity"
    
    print("\n" + "=" * 60)
    print("All Concierge Logic Tests Passed!")
    print("=" * 60)
