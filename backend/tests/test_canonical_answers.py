"""
Tests for Canonical Answer System
=================================

Run with: pytest tests/test_canonical_answers.py -v
"""

import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from canonical_answers import (
    canonicalize_answers,
    get_scoring_answers,
    get_mira_context,
    calculate_soul_score,
    is_empty_value,
    validate_answer,
    get_question_weight,
    CANONICAL_SCORING_FIELDS,
    NON_SCORING_FIELDS,
    UI_TO_CANONICAL_MAP,
)


class TestWeightTotal:
    """Verify weights sum to exactly 100"""
    
    def test_scoring_weights_sum_to_100(self):
        """CRITICAL: Total weight must be exactly 100"""
        total = sum(f["weight"] for f in CANONICAL_SCORING_FIELDS.values())
        assert total == 100, f"Scoring weights must sum to 100, got {total}"
    
    def test_scoring_field_count(self):
        """Verify we have exactly 26 scoring fields"""
        assert len(CANONICAL_SCORING_FIELDS) == 26, f"Expected 26 scoring fields, got {len(CANONICAL_SCORING_FIELDS)}"


class TestCanonicalize:
    """Test the canonicalize_answers function"""
    
    def test_direct_canonical_fields_pass_through(self):
        """Direct canonical field names should pass through unchanged"""
        raw = {
            "food_allergies": "chicken",
            "temperament": "friendly",
            "energy_level": "high"
        }
        result = canonicalize_answers(raw)
        
        assert result["food_allergies"] == "chicken"
        assert result["temperament"] == "friendly"
        assert result["energy_level"] == "high"
    
    def test_ui_fields_map_to_canonical(self):
        """UI field names should map to canonical scoring fields"""
        raw = {
            "general_nature": "calm",  # → temperament
            "stranger_reaction": "friendly",  # → social_with_people
            "car_rides": "loves it",  # → car_comfort
            "loud_sounds": "anxious",  # → noise_sensitivity
        }
        result = canonicalize_answers(raw)
        
        assert result["temperament"] == "calm"
        assert result["social_with_people"] == "friendly"
        assert result["car_comfort"] == "loves it"
        assert result["noise_sensitivity"] == "anxious"
    
    def test_first_value_wins_for_aliases(self):
        """When multiple UI fields map to same canonical, first wins"""
        raw = {
            "general_nature": "calm",
            "describe_3_words": "happy, playful, loyal",  # Also maps to temperament
        }
        result = canonicalize_answers(raw)
        
        # First value should win
        assert result["temperament"] == "calm"
        # But describe_3_words should still be in non-scoring
        assert result.get("describe_3_words") == "happy, playful, loyal"
    
    def test_non_scoring_fields_preserved(self):
        """Non-scoring fields should be preserved for Mira context"""
        raw = {
            "travel_anxiety": "Severe",
            "dream_life": "Happy life with lots of walks",
            "describe_3_words": "Loyal, loving, playful"
        }
        result = canonicalize_answers(raw)
        
        assert result["travel_anxiety"] == "Severe"
        assert result["dream_life"] == "Happy life with lots of walks"
        assert result["describe_3_words"] == "Loyal, loving, playful"
    
    def test_empty_values_ignored(self):
        """Empty values should be ignored"""
        raw = {
            "temperament": "",
            "energy_level": None,
            "food_allergies": "Unknown",
            "health_conditions": [],
            "vet_comfort": "Good"
        }
        result = canonicalize_answers(raw)
        
        assert "temperament" not in result or is_empty_value(result.get("temperament"))
        assert "energy_level" not in result or is_empty_value(result.get("energy_level"))
        assert result["vet_comfort"] == "Good"
    
    def test_preferences_fill_gaps(self):
        """Preferences should fill gaps in answers"""
        raw = {}
        preferences = {
            "treat_texture": "soft",
            "activity_level": "high",
            "allergies": "beef"
        }
        result = canonicalize_answers(raw, preferences=preferences)
        
        assert result["treat_preference"] == "soft"
        assert result["exercise_needs"] == "high"
        assert result["food_allergies"] == "beef"
    
    def test_soul_fills_temperament(self):
        """Soul persona should fill temperament if empty"""
        raw = {}
        soul = {"persona": "adventurer"}
        result = canonicalize_answers(raw, soul=soul)
        
        assert result["temperament"] == "adventurer"
    
    def test_lives_with_splits_correctly(self):
        """lives_with should populate both other_pets and kids_at_home"""
        raw = {"lives_with": "Adults, children, and a cat"}
        result = canonicalize_answers(raw)
        
        # Should detect both
        assert "other_pets" in result  # cat mentioned
        assert "kids_at_home" in result  # children mentioned
    
    def test_meta_present(self):
        """Result should contain _meta with mapping info"""
        raw = {"temperament": "friendly"}
        result = canonicalize_answers(raw)
        
        assert "_meta" in result
        assert "canonicalized_at" in result["_meta"]
        assert "scoring_fields_count" in result["_meta"]


class TestGetScoringAnswers:
    """Test extraction of only scoring fields"""
    
    def test_only_scoring_fields_returned(self):
        """Should only return canonical scoring fields"""
        canonical = {
            "temperament": "friendly",
            "travel_anxiety": "mild",  # Non-scoring
            "dream_life": "happy",  # Non-scoring
            "food_allergies": "none",
            "_meta": {}
        }
        result = get_scoring_answers(canonical)
        
        assert "temperament" in result
        assert "food_allergies" in result
        assert "travel_anxiety" not in result
        assert "dream_life" not in result
        assert "_meta" not in result


class TestGetMiraContext:
    """Test extraction for Mira Soul-First context"""
    
    def test_includes_both_scoring_and_non_scoring(self):
        """Mira context should include all relevant fields"""
        canonical = {
            "temperament": "friendly",
            "travel_anxiety": "severe",  # Non-scoring but Mira-relevant
            "food_allergies": "chicken",
        }
        result = get_mira_context(canonical)
        
        assert "temperament" in result
        assert "travel_anxiety" in result
        assert "food_allergies" in result


class TestCalculateSoulScore:
    """Test score calculation"""
    
    def test_empty_answers_zero_score(self):
        """Empty answers should give 0 score"""
        result = calculate_soul_score({})
        assert result["total_score"] == 0
        assert result["answered_count"] == 0
    
    def test_full_answers_hundred_score(self):
        """All answered should give 100 score"""
        # Create answers for all 26 scoring fields
        full_answers = {field: f"value_{i}" for i, field in enumerate(CANONICAL_SCORING_FIELDS.keys())}
        result = calculate_soul_score(full_answers)
        
        assert result["total_score"] == 100.0
        assert result["answered_count"] == 26
        assert result["tier"]["key"] == "soul_master"
    
    def test_partial_score_calculation(self):
        """Partial answers should give proportional score"""
        # Only answer the top 3 highest weight questions
        partial = {
            "food_allergies": "none",  # 10 points
            "health_conditions": "healthy",  # 8 points
            "temperament": "friendly"  # 8 points
        }
        result = calculate_soul_score(partial)
        
        # Should be 26% (26/100)
        assert result["total_score"] == 26.0
        assert result["answered_count"] == 3
    
    def test_tier_assignment(self):
        """Correct tier should be assigned based on score"""
        # 0-24 = newcomer
        result = calculate_soul_score({"food_allergies": "none"})  # 10%
        assert result["tier"]["key"] == "newcomer"
        
        # 25-49 = soul_seeker
        answers = {
            "food_allergies": "none",  # 10
            "health_conditions": "healthy",  # 8
            "temperament": "friendly",  # 8
        }
        result = calculate_soul_score(answers)  # 26%
        assert result["tier"]["key"] == "soul_seeker"
    
    def test_ui_field_names_work(self):
        """UI field names should be canonicalized before scoring"""
        # Use UI field names
        ui_answers = {
            "general_nature": "calm",  # → temperament (8 points)
            "stranger_reaction": "friendly",  # → social_with_people (4 points)
        }
        result = calculate_soul_score(ui_answers)
        
        assert result["total_score"] == 12.0  # 12/100
        assert result["answered_count"] == 2


class TestValidation:
    """Test validation helpers"""
    
    def test_is_empty_value(self):
        """Test empty value detection"""
        assert is_empty_value(None) == True
        assert is_empty_value("") == True
        assert is_empty_value("Unknown") == True
        assert is_empty_value([]) == True
        assert is_empty_value("valid") == False
        assert is_empty_value(["item"]) == False
    
    def test_validate_answer_known_field(self):
        """Known fields should validate"""
        valid, msg = validate_answer("temperament", "friendly")
        assert valid == True
    
    def test_validate_answer_empty(self):
        """Empty values should fail validation"""
        valid, msg = validate_answer("temperament", "")
        assert valid == False
    
    def test_get_question_weight(self):
        """Should return correct weight"""
        assert get_question_weight("food_allergies") == 10
        assert get_question_weight("temperament") == 8
        assert get_question_weight("travel_anxiety") == 0  # Non-scoring
        
        # UI field should map to canonical weight
        assert get_question_weight("general_nature") == 8  # Maps to temperament


class TestUIToCanonicalMapping:
    """Test the UI to canonical mapping is complete"""
    
    def test_all_ui_fields_map_to_valid_canonical(self):
        """All UI fields should map to valid canonical or non-scoring fields"""
        for ui_field, canonical_field in UI_TO_CANONICAL_MAP.items():
            # Either maps to scoring field or should be ignored
            valid = (
                canonical_field in CANONICAL_SCORING_FIELDS or
                canonical_field in NON_SCORING_FIELDS or
                canonical_field.startswith("_")  # Internal fields
            )
            assert valid, f"UI field {ui_field} maps to unknown canonical field {canonical_field}"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
