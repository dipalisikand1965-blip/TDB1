#!/usr/bin/env python3
"""
MIRA OS Scoring Logic Tests - Phase B4
Tests for scoring_logic.py
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scoring_logic import (
    score_pick,
    rank_picks,
    is_brachycephalic,
    get_travel_warning,
    render_reason_template,
    can_use_enhanced_reason,
    check_species_constraint,
    check_age_stage_constraint,
    check_health_flag_constraint,
    calculate_profile_boosts,
    apply_cross_pillar_boosts,
    generate_warnings,
    get_related_paperwork_picks,
    create_test_classification,
    create_test_profile,
    ClassificationResult,
    PetProfile,
    TRAVEL_TO_PAPERWORK_BOOST,
    SPECIES_MISMATCH_PENALTY,
)


# ============== FIXTURES ==============

@pytest.fixture
def travel_air_guide_pick():
    """Enhanced travel_air_guide pick with all new patterns."""
    return {
        "pick_id": "travel_air_guide",
        "pillar": "travel",
        "pick_type": "guide",
        "canonical_tags": ["air_travel"],
        "base_score": 85,
        "title": "Flying with Your Pet",
        "cta": "Read Guide",
        "reason_template": "A clear guide to flying with {pet_name} — airlines, crates, prep, and what to expect.",
        "reason_template_enhanced": "Flying with a {breed} like {pet_name} needs a little extra prep. Here's the complete guide.",
        "constraints": {
            "species": ["dog", "cat"],
            "age_stages": ["puppy", "adult", "senior"],
            "exclude_health_flags": [],
            "enhanced_reason_requires": ["breed"],
            "if_brachycephalic": "show_warning"
        },
        "warning_type": "air_travel_brachy",
        "doc_requirements": ["fit_to_fly", "vaccination_records", "microchip_certificate"],
        "temporal_triggers": {"travel_date": True},
        "concierge_complexity": "low",
        "safety_level": "normal"
    }


@pytest.fixture
def travel_airport_transfer_pick():
    """Enhanced travel_airport_transfer pick with booking qualifiers."""
    return {
        "pick_id": "travel_airport_transfer",
        "pillar": "travel",
        "pick_type": "booking",
        "canonical_tags": ["airport_transfer"],
        "base_score": 85,
        "title": "Airport Transfer",
        "cta": "Book Transfer",
        "reason_template": "Pet-safe airport transport for {pet_name} — calm handling, comfort stops if needed.",
        "reason_template_enhanced": "I'll arrange airport transport for {pet_name} from {city}, with the right crate guidance and timing.",
        "constraints": {
            "species": ["dog", "cat"],
            "age_stages": ["puppy", "adult", "senior"],
            "exclude_health_flags": [],
            "required_booking_fields": ["city", "airport", "transfer_date", "pickup_or_drop"],
            "optional_booking_fields": ["flight_number", "pet_weight", "crate_size", "pickup_time"],
            "enhanced_reason_requires": ["city"]
        },
        "service_vertical": "transport",
        "service_modes": ["pickup_drop"],
        "temporal_triggers": {"travel_date": True},
        "concierge_complexity": "medium",
        "safety_level": "normal"
    }


@pytest.fixture
def paperwork_fit_to_fly_pick():
    """Paperwork pick for Travel->Paperwork boost testing."""
    return {
        "pick_id": "paperwork_fit_to_fly",
        "pillar": "paperwork",
        "pick_type": "guide",
        "canonical_tags": ["fit_to_fly_letters"],
        "base_score": 80,
        "title": "Fit-to-Fly Letter",
        "cta": "Get Letter",
        "reason_template": "Planning to fly with {pet_name}? Here's how to get the required fit-to-fly certificate.",
        "constraints": {"species": ["dog", "cat"]},
        "concierge_complexity": "medium",
        "safety_level": "normal"
    }


@pytest.fixture
def cake_order_pick():
    """Celebrate pick with allergy exclusion."""
    return {
        "pick_id": "celebrate_cake_order",
        "pillar": "celebrate",
        "pick_type": "product",
        "canonical_tags": ["cakes"],
        "base_score": 80,
        "title": "Order Pet-Safe Cake",
        "cta": "Order Now",
        "reason_template": "A delicious, pet-safe cake for {pet_name}'s special day.",
        "constraints": {
            "species": ["dog", "cat"],
            "exclude_health_flags": ["allergies"]
        },
        "concierge_complexity": "low",
        "safety_level": "normal"
    }


@pytest.fixture
def labrador_profile():
    """Standard dog profile - Labrador."""
    return create_test_profile(
        pet_name="Max",
        species="dog",
        breed="Labrador Retriever",
        age_stage="adult",
        city="Mumbai"
    )


@pytest.fixture
def pug_profile():
    """Brachycephalic dog profile - Pug."""
    return create_test_profile(
        pet_name="Pugsley",
        species="dog",
        breed="Pug",
        age_stage="adult",
        city="Delhi"
    )


@pytest.fixture
def allergic_dog_profile():
    """Dog with allergies."""
    return create_test_profile(
        pet_name="Sneezy",
        species="dog",
        breed="Beagle",
        age_stage="adult",
        allergies=["chicken", "wheat"]
    )


@pytest.fixture
def travel_classification():
    """Travel-related classification."""
    return create_test_classification(
        primary_pillar="travel",
        tags=["air_travel", "fit_to_fly"],
        intent="book"
    )


# ============== BRACHYCEPHALIC DETECTION TESTS ==============

class TestBrachycephalicDetection:
    """Tests for brachycephalic breed detection."""
    
    def test_pug_is_brachycephalic(self):
        assert is_brachycephalic("Pug") is True
        assert is_brachycephalic("pug") is True
        assert is_brachycephalic("PUG") is True
    
    def test_french_bulldog_is_brachycephalic(self):
        assert is_brachycephalic("French Bulldog") is True
    
    def test_persian_cat_is_brachycephalic(self):
        assert is_brachycephalic("Persian") is True
    
    def test_labrador_not_brachycephalic(self):
        assert is_brachycephalic("Labrador Retriever") is False
    
    def test_golden_retriever_not_brachycephalic(self):
        assert is_brachycephalic("Golden Retriever") is False


# ============== TRAVEL -> PAPERWORK BOOST TESTS ==============

class TestTravelPaperworkBoost:
    """Tests for the Travel -> Paperwork cross-pillar boost rule."""
    
    def test_paperwork_pick_boosted_with_travel_classification(
        self, paperwork_fit_to_fly_pick, travel_classification, labrador_profile
    ):
        """Paperwork picks should get boosted when travel intent is detected."""
        scored = score_pick(paperwork_fit_to_fly_pick, travel_classification, labrador_profile)
        
        assert "travel_paperwork_link" in scored.boosts
        assert scored.boosts["travel_paperwork_link"] == TRAVEL_TO_PAPERWORK_BOOST
        assert scored.final_score > scored.base_score
    
    def test_non_paperwork_pick_not_boosted(
        self, travel_air_guide_pick, travel_classification, labrador_profile
    ):
        """Non-paperwork picks should not get the travel->paperwork boost."""
        scored = score_pick(travel_air_guide_pick, travel_classification, labrador_profile)
        
        assert "travel_paperwork_link" not in scored.boosts
    
    def test_paperwork_not_boosted_without_travel_intent(
        self, paperwork_fit_to_fly_pick, labrador_profile
    ):
        """Paperwork picks should not get boosted without travel intent."""
        care_classification = create_test_classification(
            primary_pillar="care",
            tags=["grooming"],
            intent="book"
        )
        scored = score_pick(paperwork_fit_to_fly_pick, care_classification, labrador_profile)
        
        assert "travel_paperwork_link" not in scored.boosts


# ============== BRACHYCEPHALIC WARNING TESTS ==============

class TestBrachycephalicWarnings:
    """Tests for brachycephalic warning generation."""
    
    def test_pug_gets_air_travel_warning(
        self, travel_air_guide_pick, travel_classification, pug_profile
    ):
        """Pugs should get a warning for air travel picks."""
        scored = score_pick(travel_air_guide_pick, travel_classification, pug_profile)
        
        assert len(scored.warnings) > 0
        assert "brachycephalic" in scored.warnings[0].lower()
        assert "Pug" in scored.warnings[0]
    
    def test_labrador_no_air_travel_warning(
        self, travel_air_guide_pick, travel_classification, labrador_profile
    ):
        """Non-brachycephalic dogs should not get air travel warnings."""
        scored = score_pick(travel_air_guide_pick, travel_classification, labrador_profile)
        
        assert len(scored.warnings) == 0
    
    def test_warning_type_used_correctly(
        self, travel_air_guide_pick, travel_classification, pug_profile
    ):
        """The warning_type field should be used to look up the warning message."""
        scored = score_pick(travel_air_guide_pick, travel_classification, pug_profile)
        
        # Warning should mention airline restrictions
        assert "airline" in scored.warnings[0].lower()


# ============== DOC REQUIREMENTS TESTS ==============

class TestDocRequirements:
    """Tests for doc_requirements field handling."""
    
    def test_doc_requirements_preserved_in_scored_pick(
        self, travel_air_guide_pick, travel_classification, labrador_profile
    ):
        """doc_requirements should be preserved in the scored pick."""
        scored = score_pick(travel_air_guide_pick, travel_classification, labrador_profile)
        
        assert scored.doc_requirements == ["fit_to_fly", "vaccination_records", "microchip_certificate"]
    
    def test_pick_without_doc_requirements(
        self, paperwork_fit_to_fly_pick, travel_classification, labrador_profile
    ):
        """Picks without doc_requirements should have empty list."""
        scored = score_pick(paperwork_fit_to_fly_pick, travel_classification, labrador_profile)
        
        assert scored.doc_requirements == []


# ============== BOOKING FIELDS TESTS ==============

class TestBookingFields:
    """Tests for required/optional booking fields handling."""
    
    def test_required_booking_fields_extracted(
        self, travel_airport_transfer_pick, travel_classification, labrador_profile
    ):
        """Required booking fields should be extracted to the scored pick."""
        scored = score_pick(travel_airport_transfer_pick, travel_classification, labrador_profile)
        
        assert "required" in scored.booking_fields
        assert "city" in scored.booking_fields["required"]
        assert "airport" in scored.booking_fields["required"]
        assert "transfer_date" in scored.booking_fields["required"]
        assert "pickup_or_drop" in scored.booking_fields["required"]
    
    def test_optional_booking_fields_extracted(
        self, travel_airport_transfer_pick, travel_classification, labrador_profile
    ):
        """Optional booking fields should be extracted to the scored pick."""
        scored = score_pick(travel_airport_transfer_pick, travel_classification, labrador_profile)
        
        assert "optional" in scored.booking_fields
        assert "flight_number" in scored.booking_fields["optional"]
        assert "pet_weight" in scored.booking_fields["optional"]
        assert "crate_size" in scored.booking_fields["optional"]


# ============== REASON TEMPLATE TESTS ==============

class TestReasonTemplates:
    """Tests for degrade-safe reason template handling."""
    
    def test_enhanced_reason_used_when_breed_available(
        self, travel_air_guide_pick, travel_classification, labrador_profile
    ):
        """Enhanced reason should be used when required fields (breed) are available."""
        scored = score_pick(travel_air_guide_pick, travel_classification, labrador_profile)
        
        # Enhanced reason mentions breed
        assert "Labrador Retriever" in scored.reason
    
    def test_basic_reason_used_when_breed_missing(
        self, travel_air_guide_pick, travel_classification
    ):
        """Basic reason should be used when required fields are missing."""
        profile_no_breed = create_test_profile(pet_name="Max")
        scored = score_pick(travel_air_guide_pick, travel_classification, profile_no_breed)
        
        # Basic reason doesn't mention breed
        assert "Labrador" not in scored.reason
        assert "Max" in scored.reason
    
    def test_city_required_for_transfer_enhanced_reason(
        self, travel_airport_transfer_pick, travel_classification, labrador_profile
    ):
        """Airport transfer enhanced reason requires city."""
        scored = score_pick(travel_airport_transfer_pick, travel_classification, labrador_profile)
        
        # Enhanced reason mentions city
        assert "Mumbai" in scored.reason


# ============== CONCIERGE COMPLEXITY TESTS ==============

class TestConciergeComplexity:
    """Tests for concierge complexity handling."""
    
    def test_guide_has_low_complexity(
        self, travel_air_guide_pick, travel_classification, labrador_profile
    ):
        """Guide picks should have low concierge complexity."""
        scored = score_pick(travel_air_guide_pick, travel_classification, labrador_profile)
        
        assert scored.concierge_complexity == "low"
    
    def test_booking_has_medium_complexity(
        self, travel_airport_transfer_pick, travel_classification, labrador_profile
    ):
        """Booking picks should have medium concierge complexity."""
        scored = score_pick(travel_airport_transfer_pick, travel_classification, labrador_profile)
        
        assert scored.concierge_complexity == "medium"


# ============== HEALTH FLAG EXCLUSION TESTS ==============

class TestHealthFlagExclusion:
    """Tests for health flag (allergy) exclusion."""
    
    def test_cake_excluded_for_allergic_dog(
        self, cake_order_pick, allergic_dog_profile
    ):
        """Cake picks should be excluded for dogs with allergies."""
        classification = create_test_classification(
            primary_pillar="celebrate",
            tags=["cakes", "birthday"]
        )
        scored = score_pick(cake_order_pick, classification, allergic_dog_profile)
        
        assert "health_flag_violation" in scored.penalties
        assert scored.final_score < 0
    
    def test_cake_included_for_non_allergic_dog(
        self, cake_order_pick, labrador_profile
    ):
        """Cake picks should be included for dogs without allergies."""
        classification = create_test_classification(
            primary_pillar="celebrate",
            tags=["cakes", "birthday"]
        )
        scored = score_pick(cake_order_pick, classification, labrador_profile)
        
        assert "health_flag_violation" not in scored.penalties
        assert scored.final_score > 0


# ============== SPECIES CONSTRAINT TESTS ==============

class TestSpeciesConstraints:
    """Tests for species constraint handling."""
    
    def test_dog_pick_excluded_for_cat(self, travel_air_guide_pick, travel_classification):
        """Dog-only picks should work for cats too (travel allows both)."""
        cat_profile = create_test_profile(species="cat", pet_name="Whiskers")
        scored = score_pick(travel_air_guide_pick, travel_classification, cat_profile)
        
        # Travel pick allows both dog and cat
        assert "species_mismatch" not in scored.penalties
    
    def test_bird_excluded_from_dog_cat_pick(self, travel_air_guide_pick, travel_classification):
        """Picks for dog/cat should exclude birds."""
        bird_profile = create_test_profile(species="bird", pet_name="Tweety")
        scored = score_pick(travel_air_guide_pick, travel_classification, bird_profile)
        
        assert "species_mismatch" in scored.penalties
        assert scored.final_score < 0


# ============== RANK PICKS TESTS ==============

class TestRankPicks:
    """Tests for the rank_picks function."""
    
    def test_picks_sorted_by_score_descending(
        self, travel_air_guide_pick, travel_airport_transfer_pick, 
        paperwork_fit_to_fly_pick, travel_classification, labrador_profile
    ):
        """Picks should be sorted by final score descending."""
        picks = [travel_air_guide_pick, travel_airport_transfer_pick, paperwork_fit_to_fly_pick]
        ranked = rank_picks(picks, travel_classification, labrador_profile, max_results=10)
        
        scores = [p.final_score for p in ranked]
        assert scores == sorted(scores, reverse=True)
    
    def test_max_results_respected(
        self, travel_air_guide_pick, travel_airport_transfer_pick, 
        paperwork_fit_to_fly_pick, travel_classification, labrador_profile
    ):
        """Only max_results picks should be returned."""
        picks = [travel_air_guide_pick, travel_airport_transfer_pick, paperwork_fit_to_fly_pick]
        ranked = rank_picks(picks, travel_classification, labrador_profile, max_results=2)
        
        assert len(ranked) <= 2
    
    def test_filtered_picks_excluded_by_default(
        self, travel_air_guide_pick, travel_classification
    ):
        """Picks with negative scores should be excluded by default."""
        bird_profile = create_test_profile(species="bird", pet_name="Tweety")
        picks = [travel_air_guide_pick]
        ranked = rank_picks(picks, travel_classification, bird_profile)
        
        assert len(ranked) == 0


# ============== INTEGRATION TESTS ==============

class TestIntegration:
    """Integration tests simulating real scenarios."""
    
    def test_travel_query_boosts_paperwork(
        self, travel_air_guide_pick, paperwork_fit_to_fly_pick, 
        travel_classification, labrador_profile
    ):
        """Travel query should boost paperwork picks to appear together."""
        picks = [travel_air_guide_pick, paperwork_fit_to_fly_pick]
        ranked = rank_picks(picks, travel_classification, labrador_profile)
        
        # Both should appear
        pick_ids = [p.pick_id for p in ranked]
        assert "travel_air_guide" in pick_ids
        assert "paperwork_fit_to_fly" in pick_ids
    
    def test_pug_air_travel_complete_scenario(
        self, travel_air_guide_pick, travel_classification, pug_profile
    ):
        """Complete scenario: Pug owner asking about air travel."""
        scored = score_pick(travel_air_guide_pick, travel_classification, pug_profile)
        
        # Should use enhanced reason (breed available)
        assert "Pug" in scored.reason
        
        # Should have brachycephalic warning
        assert len(scored.warnings) > 0
        
        # Should have doc requirements
        assert "fit_to_fly" in scored.doc_requirements
        
        # Should have low concierge complexity (guide)
        assert scored.concierge_complexity == "low"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
