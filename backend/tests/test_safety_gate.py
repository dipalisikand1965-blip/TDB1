"""
Unit tests for B3 Safety Gate
"""

import pytest
import sys
sys.path.insert(0, '/app/backend')

from safety_gate import SafetyGate, apply_safety_gate, classify_with_safety


class TestSafetyGate:
    """Test suite for safety gate."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup gate for each test."""
        self.gate = SafetyGate()
    
    # ==================== EMERGENCY TESTS ====================
    
    def test_ate_chocolate_emergency(self):
        """'ate chocolate' MUST trigger emergency override."""
        result = classify_with_safety("my dog ate chocolate")
        assert result["safety_level"] == "emergency"
        assert result["safety_override"]["is_active"] == True
        assert result["safety_override"]["level"] == "emergency"
        assert result["safety_override"]["suppress_products"] == True
        assert result["safety_override"]["suppress_shop"] == True
        assert result["safety_override"]["ui_theme"] == "emergency-red"
        assert result["safety_override"]["emergency_vet_cta"] is not None
        assert result["safety_override"]["first_aid_steps"] is not None
    
    def test_not_breathing_emergency(self):
        """'not breathing' MUST trigger emergency."""
        result = classify_with_safety("not breathing")
        assert result["safety_level"] == "emergency"
        assert result["safety_override"]["ui_theme"] == "emergency-red"
    
    def test_blue_tongue_emergency(self):
        """'blue tongue' MUST trigger emergency."""
        result = classify_with_safety("blue tongue")
        assert result["safety_level"] == "emergency"
    
    def test_collapsed_emergency(self):
        """'collapsed' MUST trigger emergency."""
        result = classify_with_safety("collapsed suddenly")
        assert result["safety_level"] == "emergency"
    
    def test_seizure_emergency(self):
        """'seizure' MUST trigger emergency."""
        result = classify_with_safety("having a seizure")
        assert result["safety_level"] == "emergency"
    
    def test_emergency_suppresses_products(self):
        """Emergency MUST suppress all products."""
        result = classify_with_safety("ate chocolate")
        override = result["safety_override"]
        assert "product" not in override["allowed_pick_types"]
    
    def test_emergency_allows_only_emergency_picks(self):
        """Emergency MUST allow only emergency + concierge picks."""
        result = classify_with_safety("ate chocolate")
        override = result["safety_override"]
        assert set(override["allowed_pick_types"]) == {"emergency", "concierge"}
    
    # ==================== CAUTION TESTS ====================
    
    def test_vomiting_caution(self):
        """'vomiting' MUST trigger caution."""
        result = classify_with_safety("vomiting twice since morning")
        assert result["safety_level"] == "caution"
        assert result["safety_override"]["ui_theme"] == "caution-yellow"
    
    def test_diarrhea_caution(self):
        """'diarrhea' MUST trigger caution."""
        result = classify_with_safety("my dog has diarrhea")
        assert result["safety_level"] == "caution"
    
    def test_lethargy_caution(self):
        """'lethargy' MUST trigger caution."""
        result = classify_with_safety("dog is very tired and lethargic")
        assert result["safety_level"] == "caution"
    
    def test_caution_suppresses_shop(self):
        """Caution MUST suppress shop pushes."""
        result = classify_with_safety("vomiting")
        override = result["safety_override"]
        assert override["suppress_shop"] == True
        assert override["suppress_products"] == True
    
    def test_caution_allows_education(self):
        """Caution MUST allow education (guides)."""
        result = classify_with_safety("vomiting")
        override = result["safety_override"]
        assert "guide" in override["allowed_pick_types"]
    
    def test_caution_allows_vet_booking(self):
        """Caution MUST allow vet booking."""
        result = classify_with_safety("vomiting")
        override = result["safety_override"]
        assert "booking" in override["allowed_pick_types"]
        assert override["suppress_bookings"] == False
    
    def test_caution_has_message(self):
        """Caution MUST have caution message."""
        result = classify_with_safety("vomiting")
        override = result["safety_override"]
        assert override["show_caution_banner"] == True
        assert override["caution_message"] is not None
        assert len(override["caution_message"]) > 0
    
    # ==================== NORMAL TESTS ====================
    
    def test_grooming_normal(self):
        """'grooming' should NOT trigger override."""
        result = classify_with_safety("looking for grooming")
        assert result["safety_level"] == "normal"
        assert result["safety_override"]["is_active"] == False
        assert result["safety_override"]["ui_theme"] == "normal"
    
    def test_normal_allows_all(self):
        """Normal MUST allow all pick types."""
        result = classify_with_safety("looking for grooming")
        override = result["safety_override"]
        assert "product" in override["allowed_pick_types"]
        assert "booking" in override["allowed_pick_types"]
        assert "guide" in override["allowed_pick_types"]
    
    # ==================== FIRST AID TESTS ====================
    
    def test_poison_has_specific_first_aid(self):
        """Poison emergency MUST have specific first aid steps."""
        result = classify_with_safety("ate chocolate")
        steps = result["safety_override"]["first_aid_steps"]
        assert steps is not None
        assert "vomiting" in steps[0].lower()  # First step mentions vomiting
    
    def test_choking_has_specific_first_aid(self):
        """Choking emergency MUST have specific first aid steps."""
        result = classify_with_safety("choking")
        steps = result["safety_override"]["first_aid_steps"]
        assert steps is not None
        assert "object" in steps[0].lower() or "remove" in steps[0].lower()
    
    def test_heatstroke_has_specific_first_aid(self):
        """Heatstroke MUST have specific first aid steps."""
        result = classify_with_safety("heatstroke")
        steps = result["safety_override"]["first_aid_steps"]
        assert steps is not None
        assert "cool" in steps[0].lower() or "shade" in steps[0].lower()


class TestPickFiltering:
    """Test pick filtering based on safety override."""
    
    def test_filter_emergency_picks(self):
        """Emergency should filter out non-emergency picks."""
        gate = SafetyGate()
        
        picks = [
            {"pick_type": "product", "title": "Treats"},
            {"pick_type": "emergency", "title": "ER Vet"},
            {"pick_type": "guide", "title": "Guide"},
            {"pick_type": "concierge", "title": "Concierge", "safety_level": "emergency"},
        ]
        
        override = {
            "is_active": True,
            "level": "emergency",
            "allowed_pick_types": ["emergency", "concierge"]
        }
        
        filtered = gate.filter_picks(picks, override)
        
        # Should only have emergency + emergency concierge
        assert len(filtered) == 2
        assert all(p["pick_type"] in ["emergency", "concierge"] for p in filtered)
    
    def test_filter_caution_picks(self):
        """Caution should filter out products."""
        gate = SafetyGate()
        
        picks = [
            {"pick_type": "product", "title": "Treats"},
            {"pick_type": "guide", "title": "Guide"},
            {"pick_type": "booking", "title": "Vet"},
        ]
        
        override = {
            "is_active": True,
            "level": "caution",
            "allowed_pick_types": ["guide", "booking", "checklist", "concierge"]
        }
        
        filtered = gate.filter_picks(picks, override)
        
        # Should have guide + booking, but not product
        assert len(filtered) == 2
        assert not any(p["pick_type"] == "product" for p in filtered)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
