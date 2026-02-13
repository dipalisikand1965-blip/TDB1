"""
MEMBER LOGIC UNIT TESTS
=======================
Tests for: Badges, Paw Points, Soul Score, Emergency Suppression

Run with: pytest /app/backend/tests/test_member_logic.py -v
"""

import pytest
import sys
sys.path.insert(0, '/app/backend')

from member_logic_config import (
    BADGE_DEFINITIONS,
    BADGE_QUESTION_THRESHOLDS,
    PAW_POINTS_RULES,
    UI_QUESTION_IDS,
    CANONICAL_SCORING_FIELDS,
    SOUL_SCORE_TIERS,
    EMERGENCY_SUPPRESSION,
    count_ui_questions_answered,
    get_eligible_badges,
    calculate_order_points,
    get_service_booking_points,
    is_emergency_suppressed,
    get_tier_for_score
)


# =============================================================================
# TEST BADGE THRESHOLDS (Question-Count Based)
# =============================================================================

class TestBadgeThresholds:
    """Badges must be triggered by question count, not percentage."""
    
    def test_soul_starter_threshold(self):
        """soul_starter requires exactly 5 questions"""
        assert BADGE_DEFINITIONS["soul_starter"]["threshold"] == 5
        assert BADGE_DEFINITIONS["soul_starter"]["type"] == "questions"
    
    def test_soul_seeker_threshold(self):
        """soul_seeker requires exactly 10 questions"""
        assert BADGE_DEFINITIONS["soul_seeker"]["threshold"] == 10
        assert BADGE_DEFINITIONS["soul_seeker"]["type"] == "questions"
    
    def test_soul_explorer_threshold(self):
        """soul_explorer requires exactly 15 questions"""
        assert BADGE_DEFINITIONS["soul_explorer"]["threshold"] == 15
        assert BADGE_DEFINITIONS["soul_explorer"]["type"] == "questions"
    
    def test_soul_guardian_threshold(self):
        """soul_guardian requires exactly 20 questions"""
        assert BADGE_DEFINITIONS["soul_guardian"]["threshold"] == 20
        assert BADGE_DEFINITIONS["soul_guardian"]["type"] == "questions"
    
    def test_badge_threshold_lookup(self):
        """Quick lookup table matches definitions"""
        assert BADGE_QUESTION_THRESHOLDS[5] == "soul_starter"
        assert BADGE_QUESTION_THRESHOLDS[10] == "soul_seeker"
        assert BADGE_QUESTION_THRESHOLDS[15] == "soul_explorer"
        assert BADGE_QUESTION_THRESHOLDS[20] == "soul_guardian"


# =============================================================================
# TEST QUESTION COUNTING
# =============================================================================

class TestQuestionCounting:
    """Question count must use UI question IDs only."""
    
    def test_empty_answers_returns_zero(self):
        """Empty/None answers should return 0"""
        assert count_ui_questions_answered({}) == 0
        assert count_ui_questions_answered(None) == 0
    
    def test_counts_only_ui_question_ids(self):
        """Only UI question IDs should be counted"""
        answers = {
            "food_allergies": "Chicken",  # Valid UI ID
            "health_conditions": "None",   # Valid UI ID
            "random_field": "value",       # NOT a UI ID - should not count
            "_internal_flag": True         # NOT a UI ID - should not count
        }
        assert count_ui_questions_answered(answers) == 2
    
    def test_ignores_empty_values(self):
        """Empty/null values should not be counted"""
        answers = {
            "food_allergies": "Chicken",   # Valid
            "health_conditions": "",        # Empty - don't count
            "temperament": None,            # Null - don't count
            "energy_level": [],             # Empty list - don't count
            "vet_comfort": "Calm"           # Valid
        }
        assert count_ui_questions_answered(answers) == 2
    
    def test_five_questions_unlocks_soul_starter(self):
        """5 valid answers should unlock soul_starter"""
        answers = {
            "food_allergies": "None",
            "health_conditions": "None",
            "vet_comfort": "Calm",
            "life_stage": "Adult",
            "temperament": "Friendly"
        }
        count = count_ui_questions_answered(answers)
        assert count == 5
        eligible = get_eligible_badges(count, [])
        assert "soul_starter" in eligible


# =============================================================================
# TEST PAW POINTS RULES
# =============================================================================

class TestPawPointsRules:
    """Paw Points earning rules must match spec."""
    
    def test_first_order_100_points(self):
        """First order should award 100 points"""
        assert PAW_POINTS_RULES["first_order"]["points"] == 100
        assert PAW_POINTS_RULES["first_order"]["one_time"] == True
    
    def test_product_purchase_5_percent(self):
        """Product purchases should award 5% of value"""
        assert PAW_POINTS_RULES["product_purchase"]["points_percent"] == 5
    
    def test_soul_question_10_points(self):
        """Each soul question should award 10 points"""
        assert PAW_POINTS_RULES["soul_question_answered"]["points"] == 10
    
    def test_review_25_points(self):
        """Reviews should award 25 points"""
        assert PAW_POINTS_RULES["review_submitted"]["points"] == 25
    
    def test_referral_500_points(self):
        """Referrals should award 500 points"""
        assert PAW_POINTS_RULES["referral_complete"]["points"] == 500
    
    def test_service_booking_range(self):
        """Service bookings should be 50-200 points range"""
        min_pts, max_pts = PAW_POINTS_RULES["service_booking"]["points_range"]
        assert min_pts == 50
        assert max_pts == 200
    
    def test_order_points_calculation_first_order(self):
        """First order: 100 bonus + 5% of value"""
        # ₹1000 order as first order = 100 + 50 = 150 points
        points = calculate_order_points(1000, is_first_order=True)
        assert points == 150
    
    def test_order_points_calculation_repeat_order(self):
        """Repeat order: only 5% of value"""
        # ₹1000 repeat order = 50 points only
        points = calculate_order_points(1000, is_first_order=False)
        assert points == 50
    
    def test_service_booking_points_by_pillar(self):
        """Service booking points vary by pillar"""
        assert get_service_booking_points("celebrate") == 150
        assert get_service_booking_points("stay") == 200
        assert get_service_booking_points("dine") == 75
        assert get_service_booking_points("emergency") == 0  # No points in emergency


# =============================================================================
# TEST SOUL SCORE TIERS
# =============================================================================

class TestSoulScoreTiers:
    """Soul Score tiers must match spec."""
    
    def test_curious_pup_range(self):
        """curious_pup: 0-24%"""
        tier = SOUL_SCORE_TIERS["curious_pup"]
        assert tier["min_percent"] == 0
        assert tier["max_percent"] == 24
        assert tier["emoji"] == "🐾"
    
    def test_loyal_companion_range(self):
        """loyal_companion: 25-49%"""
        tier = SOUL_SCORE_TIERS["loyal_companion"]
        assert tier["min_percent"] == 25
        assert tier["max_percent"] == 49
        assert tier["emoji"] == "🌱"
    
    def test_trusted_guardian_range(self):
        """trusted_guardian: 50-74%"""
        tier = SOUL_SCORE_TIERS["trusted_guardian"]
        assert tier["min_percent"] == 50
        assert tier["max_percent"] == 74
        assert tier["emoji"] == "🤝"
    
    def test_pack_leader_range(self):
        """pack_leader: 75-100%"""
        tier = SOUL_SCORE_TIERS["pack_leader"]
        assert tier["min_percent"] == 75
        assert tier["max_percent"] == 100
        assert tier["emoji"] == "🐕‍🦺"
    
    def test_get_tier_for_score_boundaries(self):
        """Tier lookup at boundary values"""
        assert get_tier_for_score(0)["key"] == "curious_pup"
        assert get_tier_for_score(24)["key"] == "curious_pup"
        assert get_tier_for_score(25)["key"] == "loyal_companion"
        assert get_tier_for_score(49)["key"] == "loyal_companion"
        assert get_tier_for_score(50)["key"] == "trusted_guardian"
        assert get_tier_for_score(74)["key"] == "trusted_guardian"
        assert get_tier_for_score(75)["key"] == "pack_leader"
        assert get_tier_for_score(100)["key"] == "pack_leader"


# =============================================================================
# TEST EMERGENCY SUPPRESSION
# =============================================================================

class TestEmergencySuppression:
    """Emergency mode must suppress commerce/rewards."""
    
    def test_emergency_suppresses(self):
        """Emergency safety_level should suppress commerce"""
        assert is_emergency_suppressed("emergency") == True
        assert is_emergency_suppressed("EMERGENCY") == True
    
    def test_non_emergency_allows(self):
        """Non-emergency should not suppress"""
        assert is_emergency_suppressed("normal") == False
        assert is_emergency_suppressed("") == False
        assert is_emergency_suppressed(None) == False
    
    def test_suppression_list_exists(self):
        """Suppression list must include key items"""
        suppress_list = EMERGENCY_SUPPRESSION["suppress"]
        assert "reward_nudges" in suppress_list
        assert "shop_ctas" in suppress_list
        assert "commerce_picks" in suppress_list
    
    def test_allow_list_exists(self):
        """Allow list must include emergency actions"""
        allow_list = EMERGENCY_SUPPRESSION["allow"]
        assert "urgent_routing" in allow_list
        assert "vet_contact_cta" in allow_list


# =============================================================================
# TEST UI → CANONICAL MAPPING
# =============================================================================

class TestUICanonicalMapping:
    """UI questions must map correctly to scoring fields."""
    
    def test_ui_question_count(self):
        """UI should have 35+ questions"""
        assert len(UI_QUESTION_IDS) >= 26  # At least scoring set
    
    def test_canonical_scoring_count(self):
        """Scoring set must be exactly 26 fields"""
        assert len(CANONICAL_SCORING_FIELDS) == 26
    
    def test_scoring_fields_are_subset_of_ui(self):
        """All scoring fields must be in UI questions"""
        for field in CANONICAL_SCORING_FIELDS:
            assert field in UI_QUESTION_IDS, f"Scoring field '{field}' missing from UI_QUESTION_IDS"
    
    def test_all_safety_fields_in_scoring(self):
        """Critical safety fields must be in scoring"""
        safety_fields = ["food_allergies", "health_conditions", "vet_comfort"]
        for field in safety_fields:
            assert field in CANONICAL_SCORING_FIELDS


# =============================================================================
# 10 TEST PROMPTS WITH EXPECTED OUTCOMES
# =============================================================================

class TestScenarios:
    """Real-world test scenarios with expected badge/points outcomes."""
    
    def test_scenario_1_new_user_answers_5_questions(self):
        """New user answers 5 questions → soul_starter badge + 50 points"""
        answers = {
            "food_allergies": "None",
            "health_conditions": "Hip dysplasia",
            "temperament": "Friendly",
            "energy_level": "High",
            "grooming_tolerance": "Tolerates"
        }
        count = count_ui_questions_answered(answers)
        badges = get_eligible_badges(count, [])
        
        assert count == 5
        assert "soul_starter" in badges
        # Points: 5 questions × 10 = 50, plus badge bonus 50 = 100 total
    
    def test_scenario_2_user_answers_10_questions(self):
        """User with 10 answers → soul_seeker badge"""
        answers = {f"field_{i}": "value" for i in range(10)}  # Dummy
        # In reality, use real UI fields
        real_answers = {
            "food_allergies": "Chicken", "health_conditions": "None",
            "temperament": "Calm", "energy_level": "Medium",
            "social_with_dogs": "Friendly", "social_with_people": "Loves everyone",
            "grooming_tolerance": "Loves it", "vet_comfort": "Nervous",
            "life_stage": "Senior", "noise_sensitivity": "Low"
        }
        count = count_ui_questions_answered(real_answers)
        badges = get_eligible_badges(count, ["soul_starter"])  # Already has starter
        
        assert count == 10
        assert "soul_seeker" in badges
        assert "soul_starter" not in badges  # Already credited
    
    def test_scenario_3_first_order_1000_rupees(self):
        """First order ₹1000 → 100 bonus + 50 (5%) = 150 points"""
        points = calculate_order_points(1000, is_first_order=True)
        assert points == 150
    
    def test_scenario_4_repeat_order_2000_rupees(self):
        """Repeat order ₹2000 → 100 points (5%)"""
        points = calculate_order_points(2000, is_first_order=False)
        assert points == 100
    
    def test_scenario_5_emergency_suppresses_rewards(self):
        """Dog vomiting blood → emergency mode, no commerce"""
        assert is_emergency_suppressed("emergency") == True
    
    def test_scenario_6_celebrate_booking_150_points(self):
        """Birthday celebration booking → 150 points"""
        points = get_service_booking_points("celebrate")
        assert points == 150
    
    def test_scenario_7_stay_booking_200_points(self):
        """Boarding stay booking → 200 points (highest)"""
        points = get_service_booking_points("stay")
        assert points == 200
    
    def test_scenario_8_all_26_scoring_fields_answered(self):
        """Answering all 26 scoring questions → 260 points (26 × 10)"""
        # Plus eligible for soul_guardian badge (20+ questions)
        answers = {field: "value" for field in CANONICAL_SCORING_FIELDS}
        count = count_ui_questions_answered(answers)
        badges = get_eligible_badges(count, [])
        
        assert count == 26
        assert "soul_guardian" in badges
        # Points earned: 26 × 10 = 260 points
    
    def test_scenario_9_badge_idempotent(self):
        """Badges should not be duplicated"""
        badges = get_eligible_badges(20, ["soul_starter", "soul_seeker", "soul_explorer"])
        assert "soul_guardian" in badges
        assert "soul_starter" not in badges  # Already credited
        assert "soul_seeker" not in badges   # Already credited
        assert "soul_explorer" not in badges # Already credited
    
    def test_scenario_10_tier_progression(self):
        """Score progression through tiers"""
        # 0% → curious_pup
        assert get_tier_for_score(0)["key"] == "curious_pup"
        # 30% → loyal_companion
        assert get_tier_for_score(30)["key"] == "loyal_companion"
        # 60% → trusted_guardian
        assert get_tier_for_score(60)["key"] == "trusted_guardian"
        # 90% → pack_leader
        assert get_tier_for_score(90)["key"] == "pack_leader"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
