#!/usr/bin/env python3
"""
MIRA OS Concierge Logic Tests - Phase B5
Tests for concierge_logic.py
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from concierge_logic import (
    determine_concierge_prominence,
    detect_time_pressure,
    detect_multi_step,
    detect_coordination_value,
    detect_pick_complexity,
    is_straightforward_selfserve,
    create_classification_context,
    create_top_pick_context,
    ClassificationContext,
    TopPickContext,
    ConciergeDecision,
    CTAProminence,
    ConciergeReason,
    CONFIDENCE_THRESHOLD,
)


# ============== TIME PRESSURE DETECTION TESTS ==============

class TestTimePressureDetection:
    """Tests for time pressure keyword detection."""
    
    def test_today_detected(self):
        assert detect_time_pressure("I need grooming today") is True
        assert detect_time_pressure("Can you help me today?") is True
    
    def test_tomorrow_detected(self):
        assert detect_time_pressure("Need a vet tomorrow") is True
    
    def test_urgent_detected(self):
        assert detect_time_pressure("This is urgent") is True
        assert detect_time_pressure("Urgently need help") is True
    
    def test_asap_detected(self):
        assert detect_time_pressure("Book asap please") is True
    
    def test_this_weekend_detected(self):
        assert detect_time_pressure("Can we do this weekend?") is True
        assert detect_time_pressure("Planning for this week") is True
    
    def test_in_hours_detected(self):
        assert detect_time_pressure("Need in 2 hours") is True
        assert detect_time_pressure("Within 24 hours") is True
    
    def test_no_time_pressure(self):
        assert detect_time_pressure("Looking for grooming options") is False
        assert detect_time_pressure("What food is best?") is False
        assert detect_time_pressure("Help me plan") is False


# ============== MULTI-STEP DETECTION TESTS ==============

class TestMultiStepDetection:
    """Tests for multi-step coordination detection."""
    
    def test_multiple_service_verticals(self):
        ctx = create_classification_context(
            primary_pillar="travel",
            service_verticals=["transport", "boarding"]
        )
        assert detect_multi_step(ctx) is True
    
    def test_single_service_vertical(self):
        ctx = create_classification_context(
            primary_pillar="care",
            service_verticals=["grooming"]
        )
        assert detect_multi_step(ctx) is False
    
    def test_pick_with_multiple_coordination_signals(self):
        ctx = create_classification_context(
            primary_pillar="travel",
            service_verticals=["transport"]
        )
        pick = create_top_pick_context(
            pick_type="booking",
            service_vertical="transport",
            has_booking_fields=True,
            has_doc_requirements=True
        )
        assert detect_multi_step(ctx, pick) is True


# ============== COORDINATION VALUE DETECTION TESTS ==============

class TestCoordinationValueDetection:
    """Tests for coordination value detection."""
    
    def test_celebrate_with_booking_intent(self):
        ctx = create_classification_context(
            primary_pillar="celebrate",
            intent="book"
        )
        pick = create_top_pick_context(pick_type="booking")
        assert detect_coordination_value(ctx, pick) is True
    
    def test_travel_with_buy_intent(self):
        ctx = create_classification_context(
            primary_pillar="travel",
            intent="buy"
        )
        assert detect_coordination_value(ctx) is True
    
    def test_celebrate_with_learn_intent(self):
        """Celebrate + learn intent = no coordination value (just asking for info)."""
        ctx = create_classification_context(
            primary_pillar="celebrate",
            intent="learn"
        )
        assert detect_coordination_value(ctx) is False
    
    def test_care_pillar_no_coordination_value(self):
        """Care is not a coordination pillar."""
        ctx = create_classification_context(
            primary_pillar="care",
            intent="book"
        )
        assert detect_coordination_value(ctx) is False
    
    def test_travel_with_guide_pick(self):
        """Travel with guide pick = no coordination value."""
        ctx = create_classification_context(
            primary_pillar="travel",
            intent="learn"
        )
        pick = create_top_pick_context(pick_type="guide")
        assert detect_coordination_value(ctx, pick) is False


# ============== PICK COMPLEXITY DETECTION TESTS ==============

class TestPickComplexityDetection:
    """Tests for pick complexity detection."""
    
    def test_high_complexity_always_detected(self):
        pick = create_top_pick_context(concierge_complexity="high")
        assert detect_pick_complexity(pick) is True
    
    def test_medium_complexity_with_other_conditions(self):
        pick = create_top_pick_context(concierge_complexity="medium")
        assert detect_pick_complexity(pick, other_conditions_met=True) is True
    
    def test_medium_complexity_alone(self):
        pick = create_top_pick_context(concierge_complexity="medium")
        assert detect_pick_complexity(pick, other_conditions_met=False) is False
    
    def test_low_complexity(self):
        pick = create_top_pick_context(concierge_complexity="low")
        assert detect_pick_complexity(pick) is False


# ============== MANDATORY PRIMARY CONDITIONS TESTS ==============

class TestMandatoryPrimaryConditions:
    """Tests for mandatory PRIMARY concierge prominence."""
    
    def test_emergency_safety_override(self):
        """Emergency = PRIMARY + suppress commerce."""
        ctx = create_classification_context(
            primary_pillar="emergency",
            safety_level="emergency",
            confidence=0.95
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "safety_override"
        assert decision.suppress_commerce is True
    
    def test_caution_safety_override(self):
        """Caution = PRIMARY + suppress commerce."""
        ctx = create_classification_context(
            primary_pillar="care",
            safety_level="caution",
            confidence=0.80,
            original_message="my dog is vomiting"
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "safety_override"
        assert decision.suppress_commerce is True
    
    def test_low_confidence_primary(self):
        """Low confidence = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="dine",
            confidence=0.45,
            original_message="something for my dog"
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "low_confidence"
    
    def test_time_pressure_primary(self):
        """Time pressure = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="care",
            confidence=0.85,
            original_message="need grooming today please"
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "tight_timeline"
    
    def test_multi_step_primary(self):
        """Multi-step = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="travel",
            confidence=0.85,
            service_verticals=["transport", "boarding", "vet_care"]
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "multi_step"


# ============== EXPERIENCE-LEVEL PRIMARY CONDITIONS TESTS ==============

class TestExperienceLevelPrimaryConditions:
    """Tests for experience-level PRIMARY concierge prominence."""
    
    def test_coordination_value_celebrate(self):
        """Celebrate with booking = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="celebrate",
            confidence=0.85,
            intent="book",
            original_message="plan birthday party for Mojo"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            has_booking_fields=True
        )
        decision = determine_concierge_prominence(ctx, pick, pet_name="Mojo")
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "coordination_value"
        assert "date + city" in decision.cta.lower()
    
    def test_coordination_value_travel(self):
        """Travel with booking = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="travel",
            confidence=0.85,
            intent="book",
            original_message="book airport transfer"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            has_booking_fields=True
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "coordination_value"
    
    def test_high_complexity_pick_primary(self):
        """High complexity pick = PRIMARY."""
        ctx = create_classification_context(
            primary_pillar="advisory",
            confidence=0.80,
            intent="ask"
        )
        pick = create_top_pick_context(
            pick_type="concierge",
            concierge_complexity="high"
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "pick_complexity"


# ============== SECONDARY CONDITIONS TESTS ==============

class TestSecondaryConditions:
    """Tests for SECONDARY concierge prominence."""
    
    def test_coordination_pillar_learn_intent(self):
        """Coordination pillar + learn intent = SECONDARY."""
        ctx = create_classification_context(
            primary_pillar="celebrate",
            confidence=0.85,
            intent="learn",
            original_message="how to plan a birthday party"
        )
        pick = create_top_pick_context(pick_type="guide")
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "secondary"
    
    def test_medium_complexity_no_triggers(self):
        """Medium complexity without other triggers = SECONDARY."""
        ctx = create_classification_context(
            primary_pillar="care",
            confidence=0.88,
            intent="book"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            concierge_complexity="medium"
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "secondary"
    
    def test_booking_pick_low_complexity(self):
        """Booking pick with low complexity = SECONDARY."""
        ctx = create_classification_context(
            primary_pillar="care",
            confidence=0.88,
            intent="book",
            service_verticals=["grooming"]
        )
        pick = create_top_pick_context(
            pick_type="booking",
            concierge_complexity="low",
            service_vertical="grooming"
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "secondary"


# ============== QUIET CONDITIONS TESTS ==============

class TestQuietConditions:
    """Tests for QUIET concierge prominence."""
    
    def test_simple_guide_request(self):
        """Simple guide request = QUIET."""
        ctx = create_classification_context(
            primary_pillar="learn",
            confidence=0.90,
            intent="learn",
            original_message="how to potty train my puppy"
        )
        pick = create_top_pick_context(
            pick_type="guide",
            concierge_complexity="low"
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "quiet"
        assert decision.reason == "always_available"
    
    def test_high_confidence_info_request(self):
        """High confidence info request = QUIET."""
        ctx = create_classification_context(
            primary_pillar="dine",
            confidence=0.92,
            intent="learn",
            original_message="what foods are toxic to dogs"
        )
        pick = create_top_pick_context(
            pick_type="guide",
            concierge_complexity="low"
        )
        decision = determine_concierge_prominence(ctx, pick)
        
        assert decision.cta_prominence == "quiet"


# ============== ALWAYS-ON MODE TESTS ==============

class TestAlwaysOnMode:
    """Tests that mode is always 'always_on'."""
    
    def test_primary_has_always_on(self):
        ctx = create_classification_context(
            primary_pillar="emergency",
            safety_level="emergency"
        )
        decision = determine_concierge_prominence(ctx)
        assert decision.mode == "always_on"
    
    def test_secondary_has_always_on(self):
        ctx = create_classification_context(
            primary_pillar="care",
            confidence=0.88,
            intent="book"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            concierge_complexity="medium"
        )
        decision = determine_concierge_prominence(ctx, pick)
        assert decision.mode == "always_on"
    
    def test_quiet_has_always_on(self):
        ctx = create_classification_context(
            primary_pillar="learn",
            confidence=0.90,
            intent="learn"
        )
        pick = create_top_pick_context(pick_type="guide")
        decision = determine_concierge_prominence(ctx, pick)
        assert decision.mode == "always_on"


# ============== CTA TEXT TESTS ==============

class TestCTAText:
    """Tests for dynamic CTA text generation."""
    
    def test_safety_cta_mentions_emergency(self):
        ctx = create_classification_context(
            primary_pillar="emergency",
            safety_level="emergency"
        )
        decision = determine_concierge_prominence(ctx)
        assert "emergency" in decision.cta.lower()
    
    def test_celebrate_cta_mentions_date_city(self):
        ctx = create_classification_context(
            primary_pillar="celebrate",
            confidence=0.85,
            intent="book"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            has_booking_fields=True
        )
        decision = determine_concierge_prominence(ctx, pick)
        assert "date" in decision.cta.lower()
    
    def test_travel_cta_mentions_docs(self):
        ctx = create_classification_context(
            primary_pillar="travel",
            confidence=0.85,
            intent="book"
        )
        pick = create_top_pick_context(
            pick_type="booking",
            has_booking_fields=True
        )
        decision = determine_concierge_prominence(ctx, pick)
        assert "docs" in decision.cta.lower() or "transport" in decision.cta.lower()


# ============== INTEGRATION TESTS ==============

class TestIntegration:
    """Integration tests simulating real scenarios."""
    
    def test_grooming_scenario(self):
        """'Looking for grooming for Mojo' -> picks + secondary concierge."""
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
        
        assert decision.cta_prominence == "secondary"
        assert decision.mode == "always_on"
    
    def test_cake_scenario(self):
        """'Looking for a cake for Mojo' with coordination -> primary."""
        ctx = create_classification_context(
            primary_pillar="celebrate",
            confidence=0.85,
            intent="buy",
            original_message="I need a birthday cake for Mojo"
        )
        pick = create_top_pick_context(
            pick_id="celebrate_cake_order",
            pick_type="product",
            pillar="celebrate",
            concierge_complexity="low"
        )
        decision = determine_concierge_prominence(ctx, pick, pet_name="Mojo")
        
        # Celebrate pillar with buy intent = coordination value
        assert decision.cta_prominence in ["primary", "secondary"]
    
    def test_chocolate_emergency_scenario(self):
        """'My dog ate chocolate' -> mandatory primary, suppress commerce."""
        ctx = create_classification_context(
            primary_pillar="emergency",
            safety_level="emergency",
            confidence=0.95,
            original_message="my dog ate chocolate"
        )
        decision = determine_concierge_prominence(ctx)
        
        assert decision.cta_prominence == "primary"
        assert decision.reason == "safety_override"
        assert decision.suppress_commerce is True
        assert "emergency" in decision.cta.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
