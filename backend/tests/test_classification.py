"""
Unit tests for B2 Classification Pipeline
"""

import pytest
import sys
sys.path.insert(0, '/app/backend')

from classification_pipeline import ClassificationPipeline, classify_message, LOCKED_PILLARS


class TestClassificationPipeline:
    """Test suite for classification pipeline."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup pipeline for each test."""
        self.pipeline = ClassificationPipeline()
    
    # ==================== CARE TESTS ====================
    
    def test_grooming(self):
        """Test grooming classification."""
        result = self.pipeline.classify("looking for grooming for mojo")
        assert result.primary_pillar == "care"
        assert "grooming" in result.canonical_tags
        assert result.safety_level == "normal"
        assert result.intent == "book"
    
    def test_single_word_groomer(self):
        """Test single word 'groomer'."""
        result = self.pipeline.classify("groomer")
        assert result.primary_pillar == "care"
        assert result.safety_level == "normal"
    
    def test_vet_appointment(self):
        """Test vet appointment."""
        result = self.pipeline.classify("book vet appointment")
        assert result.primary_pillar == "care"
        assert result.intent == "book"
    
    def test_vomiting_caution(self):
        """Test vomiting triggers caution."""
        result = self.pipeline.classify("my dog is vomiting")
        assert result.primary_pillar == "care"
        assert result.safety_level == "caution"
    
    def test_diarrhea_caution(self):
        """Test diarrhea triggers caution."""
        result = self.pipeline.classify("dog has diarrhea")
        assert result.primary_pillar == "care"
        assert result.safety_level == "caution"
    
    # ==================== DINE TESTS ====================
    
    def test_treats(self):
        """Test treats classification."""
        result = self.pipeline.classify("buy treats for my dog")
        assert result.primary_pillar == "dine"
        assert "treats" in result.canonical_tags
        assert result.intent == "buy"
    
    def test_puppy_food(self):
        """Test puppy nutrition."""
        result = self.pipeline.classify("puppy food recommendation")
        assert result.primary_pillar == "dine"
    
    # ==================== STAY TESTS ====================
    
    def test_boarding(self):
        """Test boarding classification."""
        result = self.pipeline.classify("boarding")
        assert result.primary_pillar == "stay"
        assert "kennel" in result.canonical_tags
    
    def test_daycare(self):
        """Test daycare classification."""
        result = self.pipeline.classify("daycare near me")
        assert result.primary_pillar == "stay"
        assert result.intent == "book"
    
    # ==================== CELEBRATE TESTS ====================
    
    def test_cake(self):
        """Test cake classification."""
        result = self.pipeline.classify("looking for a cake for mojo")
        assert result.primary_pillar == "celebrate"
        assert "cakes" in result.canonical_tags
    
    def test_birthday(self):
        """Test birthday classification."""
        result = self.pipeline.classify("birthday party for dog")
        assert result.primary_pillar == "celebrate"
        assert "birthday" in result.canonical_tags
    
    # ==================== EMERGENCY TESTS (CRITICAL) ====================
    
    def test_ate_chocolate(self):
        """Test chocolate poisoning - MUST be emergency."""
        result = self.pipeline.classify("my dog ate chocolate")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
        assert result.intent == "emergency"
        assert "poison_ingestion" in result.canonical_tags
    
    def test_cant_breathe(self):
        """Test breathing distress - MUST be emergency."""
        result = self.pipeline.classify("dog can't breathe")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
    
    def test_seizure(self):
        """Test seizure - MUST be emergency."""
        result = self.pipeline.classify("my dog is having a seizure")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
    
    def test_collapsed(self):
        """Test collapse - MUST be emergency."""
        result = self.pipeline.classify("collapsed suddenly")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
    
    def test_bleeding(self):
        """Test severe bleeding - MUST be emergency."""
        result = self.pipeline.classify("bleeding won't stop")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
    
    def test_emergency_word(self):
        """Test single word 'emergency'."""
        result = self.pipeline.classify("emergency")
        assert result.primary_pillar == "emergency"
        assert result.safety_level == "emergency"
    
    # ==================== PILLAR LOCK TESTS ====================
    
    def test_never_invents_pillar(self):
        """Test that pipeline never invents new pillars."""
        # Random nonsense should fall back to advisory, not create new pillar
        result = self.pipeline.classify("xyzzy foobar random text")
        assert result.primary_pillar in LOCKED_PILLARS
    
    def test_all_pillars_locked(self):
        """Test that LOCKED_PILLARS is exactly 13."""
        assert len(LOCKED_PILLARS) == 13
        assert "health" not in LOCKED_PILLARS
        assert "shop" not in LOCKED_PILLARS
        assert "services" not in LOCKED_PILLARS
    
    # ==================== CONFIDENCE TESTS ====================
    
    def test_high_confidence_emergency(self):
        """Emergency matches should have high confidence."""
        result = self.pipeline.classify("ate chocolate")
        assert result.confidence >= 0.9
    
    def test_confidence_range(self):
        """Confidence should be 0-1."""
        result = self.pipeline.classify("something random")
        assert 0 <= result.confidence <= 1
    
    # ==================== INTENT TESTS ====================
    
    def test_book_intent(self):
        """Test booking intent detection."""
        result = self.pipeline.classify("book grooming appointment")
        assert result.intent == "book"
    
    def test_buy_intent(self):
        """Test buy intent detection."""
        result = self.pipeline.classify("buy dog food")
        assert result.intent == "buy"
    
    def test_learn_intent(self):
        """Test learn intent detection."""
        result = self.pipeline.classify("how to train puppy")
        assert result.intent == "learn"
    
    # ==================== SERVICE VERTICAL TESTS ====================
    
    def test_grooming_service_vertical(self):
        """Test grooming populates service vertical."""
        result = self.pipeline.classify("book grooming")
        assert "grooming" in result.service_verticals
    
    # ==================== HINGLISH TESTS ====================
    
    def test_hinglish_vet(self):
        """Test Hinglish: vet appointment book karna hai."""
        result = self.pipeline.classify("vet appointment book karna hai")
        assert result.primary_pillar == "care"
        assert result.intent == "book"


class TestClassifyMessageFunction:
    """Test the convenience function."""
    
    def test_returns_dict(self):
        """Test that classify_message returns a dict."""
        result = classify_message("grooming for my dog")
        assert isinstance(result, dict)
        assert "primary_pillar" in result
        assert "canonical_tags" in result
        assert "safety_level" in result
    
    def test_with_pet_id(self):
        """Test with pet_id parameter."""
        result = classify_message("grooming", pet_id="pet_123")
        assert isinstance(result, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
