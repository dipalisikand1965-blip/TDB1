"""
MIRA OS P0 Features - Intelligence Score & Versioned Storage Tests
===================================================================
Tests for newly implemented P0 items:
1. Intelligence Score calculation and breakdown
2. Versioned Storage for traits with confidence evolution
3. Behavioral shifts detection
4. Soul data migration to versioned storage

DOCTRINE COMPLIANCE:
- All answers stored permanently
- Answers versioned over time
- Confidence scoring on all traits
- Behavioral shift detection
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_PET_ID = "pet-99a708f1722a"  # Mojo - existing test pet


class TestIntelligenceScore:
    """Test Intelligence Score endpoints - TRUE measure of how well Mira knows a pet"""
    
    def test_get_intelligence_score(self):
        """GET /api/mira/intelligence-score/{pet_id} - Returns total_score, tier, breakdown, suggestions"""
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-score/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "total_score" in data, "Response missing total_score"
        assert isinstance(data["total_score"], (int, float)), f"total_score should be numeric, got {type(data['total_score'])}"
        assert 0 <= data["total_score"] <= 100, f"total_score should be 0-100, got {data['total_score']}"
        
        # Verify tier information
        assert "tier" in data, "Response missing tier"
        valid_tiers = ["curious_pup", "growing_bond", "trusted_guardian", "deep_connection", "soulmate"]
        assert data["tier"] in valid_tiers, f"Invalid tier: {data['tier']}"
        
        # Verify tier_info
        if "tier_info" in data:
            assert "label" in data["tier_info"], "tier_info missing label"
            assert "description" in data["tier_info"], "tier_info missing description"
            assert "emoji" in data["tier_info"], "tier_info missing emoji"
        
        # Verify breakdown - shows how score is calculated
        assert "breakdown" in data, "Response missing breakdown"
        breakdown = data["breakdown"]
        expected_breakdown_keys = ["base_soul", "conversation_learning", "confidence_depth", "recency_bonus"]
        for key in expected_breakdown_keys:
            assert key in breakdown, f"breakdown missing {key}"
        
        # Verify suggestions
        assert "suggestions" in data, "Response missing suggestions"
        assert isinstance(data["suggestions"], list), "suggestions should be a list"
        
        print(f"Intelligence Score Test PASSED:")
        print(f"  - Total Score: {data['total_score']}")
        print(f"  - Tier: {data['tier']}")
        print(f"  - Breakdown: base_soul={breakdown.get('base_soul')}, learning={breakdown.get('conversation_learning')}, depth={breakdown.get('confidence_depth')}, recency={breakdown.get('recency_bonus')}")
        print(f"  - Suggestions count: {len(data['suggestions'])}")
    
    def test_get_intelligence_score_nonexistent_pet(self):
        """Intelligence score for non-existent pet should return 0 score"""
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-score/nonexistent-pet-12345")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("total_score") == 0 or "error" in data, "Non-existent pet should return 0 score or error"
        print(f"Non-existent pet intelligence score: {data.get('total_score', 'error')}")
    
    def test_intelligence_breakdown(self):
        """GET /api/mira/intelligence-breakdown/{pet_id} - Returns domain breakdown"""
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-breakdown/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify pet info
        assert "pet_id" in data, "Response missing pet_id"
        
        # Verify domain completeness
        if "domain_completeness" in data:
            assert isinstance(data["domain_completeness"], (int, float)), "domain_completeness should be numeric"
        
        # Verify domains breakdown
        assert "domains" in data, "Response missing domains"
        domains = data["domains"]
        
        # Check expected domains exist
        expected_domains = [
            "temperament", "emotional_profile", "sensitivities", "social_patterns",
            "behavioural_triggers", "food_preferences", "energy_rhythms", 
            "stress_signals", "comfort_environments", "routine_dependencies",
            "bonding_style", "training_response", "health_predispositions"
        ]
        
        for domain in expected_domains:
            assert domain in domains, f"Missing domain: {domain}"
            domain_data = domains[domain]
            assert "score" in domain_data, f"Domain {domain} missing score"
            assert "known" in domain_data, f"Domain {domain} missing known"
            assert "missing" in domain_data, f"Domain {domain} missing missing"
        
        print(f"Intelligence Breakdown Test PASSED:")
        print(f"  - Pet ID: {data.get('pet_id')}")
        print(f"  - Domain completeness: {data.get('domain_completeness')}%")
        print(f"  - Domains tested: {len(domains)}")
    
    def test_intelligence_breakdown_nonexistent_pet(self):
        """Intelligence breakdown for non-existent pet"""
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-breakdown/nonexistent-pet-12345")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Non-existent pet should return error"
        print(f"Non-existent pet breakdown error: {data.get('error')}")


class TestVersionedStorageTrait:
    """Test Versioned Storage - Trait endpoints with confidence evolution"""
    
    def test_store_trait_new(self):
        """POST /api/mira/versioned/store-trait - Store new trait"""
        # Create unique trait to avoid conflicts
        unique_trait = f"TEST_trait_{uuid.uuid4().hex[:8]}"
        
        params = {
            "pet_id": TEST_PET_ID,
            "trait_type": "temperament",
            "trait_value": unique_trait,
            "confidence": 70,
            "evidence_text": "Testing trait storage from pytest",
            "source": "test"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert data.get("trait_type") == "temperament", f"trait_type mismatch"
        assert data.get("trait_value") == unique_trait, f"trait_value mismatch"
        assert data.get("confidence") == 70, f"Expected confidence 70, got {data.get('confidence')}"
        assert data.get("mention_count") == 1, f"Expected mention_count 1 for new trait"
        assert data.get("is_new") == True, f"Expected is_new=True for new trait"
        
        print(f"Store New Trait Test PASSED:")
        print(f"  - Trait: {data.get('trait_type')}:{data.get('trait_value')}")
        print(f"  - Confidence: {data.get('confidence')}%")
        print(f"  - Is new: {data.get('is_new')}")
        
        return unique_trait  # Return for use in other tests
    
    def test_store_trait_confidence_evolution(self):
        """Repeated stores should increase confidence - DOCTRINE COMPLIANCE"""
        # Create a known trait value
        trait_value = f"TEST_confidence_evolution_{uuid.uuid4().hex[:6]}"
        
        # First store - should be new with initial confidence
        params1 = {
            "pet_id": TEST_PET_ID,
            "trait_type": "behavior",
            "trait_value": trait_value,
            "confidence": 70,
            "evidence_text": "First observation",
            "source": "test"
        }
        
        response1 = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params1)
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1.get("success") == True
        assert data1.get("is_new") == True
        initial_confidence = data1.get("confidence")
        print(f"Initial store - Confidence: {initial_confidence}, Mentions: {data1.get('mention_count')}")
        
        # Second store - same trait, should increase confidence
        params2 = {
            "pet_id": TEST_PET_ID,
            "trait_type": "behavior",
            "trait_value": trait_value,
            "confidence": 70,  # Same initial confidence
            "evidence_text": "Second observation",
            "source": "test"
        }
        
        response2 = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params2)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("success") == True
        assert data2.get("is_new") == False, "Should not be new on second store"
        
        # Verify confidence increased
        second_confidence = data2.get("confidence")
        assert second_confidence > initial_confidence, f"Confidence should increase: {initial_confidence} -> {second_confidence}"
        assert data2.get("mention_count") == 2, f"Mention count should be 2, got {data2.get('mention_count')}"
        
        print(f"Confidence Evolution Test PASSED:")
        print(f"  - Initial confidence: {initial_confidence}%")
        print(f"  - After 2nd store: {second_confidence}%")
        print(f"  - Confidence boost: +{second_confidence - initial_confidence}%")
        print(f"  - Mention count: {data2.get('mention_count')}")
        
        # Third store - confidence should increase further
        response3 = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params2)
        assert response3.status_code == 200
        data3 = response3.json()
        third_confidence = data3.get("confidence")
        assert third_confidence > second_confidence, f"Confidence should increase further"
        assert data3.get("mention_count") == 3
        
        print(f"  - After 3rd store: {third_confidence}% (mentions: {data3.get('mention_count')})")


class TestVersionedStorageAllTraits:
    """Test all traits retrieval with confidence threshold"""
    
    def test_get_all_traits(self):
        """GET /api/mira/versioned/all-traits/{pet_id} - Returns all traits above confidence threshold"""
        response = requests.get(f"{BASE_URL}/api/mira/versioned/all-traits/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet_id" in data, "Response missing pet_id"
        assert data["pet_id"] == TEST_PET_ID
        assert "traits" in data, "Response missing traits"
        assert isinstance(data["traits"], list), "traits should be a list"
        
        # Verify trait structure if traits exist
        if data["traits"]:
            trait = data["traits"][0]
            expected_fields = ["trait_type", "trait_value", "confidence"]
            for field in expected_fields:
                assert field in trait, f"Trait missing {field}"
        
        print(f"Get All Traits Test PASSED:")
        print(f"  - Pet ID: {data['pet_id']}")
        print(f"  - Total traits: {len(data['traits'])}")
        if data["traits"]:
            print(f"  - Sample trait: {data['traits'][0].get('trait_type')}:{data['traits'][0].get('trait_value')} ({data['traits'][0].get('confidence')}%)")
    
    def test_get_all_traits_with_min_confidence(self):
        """Test min_confidence query parameter"""
        # Get traits with default threshold
        response_default = requests.get(f"{BASE_URL}/api/mira/versioned/all-traits/{TEST_PET_ID}")
        data_default = response_default.json()
        
        # Get traits with high confidence threshold
        response_high = requests.get(f"{BASE_URL}/api/mira/versioned/all-traits/{TEST_PET_ID}?min_confidence=80")
        assert response_high.status_code == 200
        data_high = response_high.json()
        
        # High confidence filter should return same or fewer traits
        assert len(data_high["traits"]) <= len(data_default["traits"]), \
            f"Higher confidence threshold should filter traits: default={len(data_default['traits'])}, high={len(data_high['traits'])}"
        
        # Verify all returned traits meet threshold
        for trait in data_high["traits"]:
            assert trait.get("confidence", 0) >= 80, f"Trait below threshold: {trait}"
        
        print(f"Min Confidence Filter Test PASSED:")
        print(f"  - Default threshold (50): {len(data_default['traits'])} traits")
        print(f"  - High threshold (80): {len(data_high['traits'])} traits")


class TestBehavioralShifts:
    """Test behavioral shifts detection - DOCTRINE: detect significant changes over time"""
    
    def test_get_behavioral_shifts(self):
        """GET /api/mira/versioned/behavioral-shifts/{pet_id} - Returns detected behavioral shifts"""
        response = requests.get(f"{BASE_URL}/api/mira/versioned/behavioral-shifts/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet_id" in data, "Response missing pet_id"
        assert data["pet_id"] == TEST_PET_ID
        assert "shifts" in data, "Response missing shifts"
        assert isinstance(data["shifts"], list), "shifts should be a list"
        
        # Verify shift structure if any exist
        if data["shifts"]:
            shift = data["shifts"][0]
            assert "significance" in shift, "Shift missing significance field"
        
        print(f"Behavioral Shifts Test PASSED:")
        print(f"  - Pet ID: {data['pet_id']}")
        print(f"  - Detected shifts: {len(data['shifts'])}")
        if data["shifts"]:
            for shift in data["shifts"][:3]:
                print(f"  - Shift: {shift.get('field', shift.get('trait_type'))} ({shift.get('significance')})")
    
    def test_behavioral_shifts_nonexistent_pet(self):
        """Behavioral shifts for non-existent pet should return empty shifts"""
        response = requests.get(f"{BASE_URL}/api/mira/versioned/behavioral-shifts/nonexistent-pet-xyz")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["pet_id"] == "nonexistent-pet-xyz"
        assert "shifts" in data
        # Should return empty shifts array, not error
        assert isinstance(data["shifts"], list)
        print(f"Non-existent pet behavioral shifts: {len(data['shifts'])} shifts (expected 0 or empty)")


class TestVersionedMigration:
    """Test soul data migration to versioned storage"""
    
    def test_migrate_pet_data(self):
        """POST /api/mira/versioned/migrate/{pet_id} - Migrates existing soul data to versioned storage"""
        response = requests.post(f"{BASE_URL}/api/mira/versioned/migrate/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Should either succeed with migration count or indicate already migrated
        if data.get("success"):
            assert "pet_id" in data, "Response missing pet_id"
            assert "fields_migrated" in data, "Response missing fields_migrated"
            assert isinstance(data["fields_migrated"], int), "fields_migrated should be int"
            print(f"Migration Test PASSED:")
            print(f"  - Pet ID: {data['pet_id']}")
            print(f"  - Fields migrated: {data['fields_migrated']}")
        else:
            # Migration might have already been done
            print(f"Migration response: {data}")
            assert "error" in data or data.get("fields_migrated") == 0, "Unexpected migration response"
    
    def test_migrate_nonexistent_pet(self):
        """Migration for non-existent pet should fail gracefully"""
        response = requests.post(f"{BASE_URL}/api/mira/versioned/migrate/nonexistent-pet-abc123")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == False, "Migration for non-existent pet should fail"
        assert "error" in data, "Should return error message"
        print(f"Non-existent pet migration error: {data.get('error')}")


class TestEdgeCasesAndValidation:
    """Test edge cases and input validation"""
    
    def test_store_trait_missing_params(self):
        """Store trait with missing required parameters"""
        # Missing trait_value
        params = {
            "pet_id": TEST_PET_ID,
            "trait_type": "temperament"
            # Missing trait_value
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params)
        # Should return 422 (validation error) or handle gracefully
        assert response.status_code in [200, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # If 200, should indicate failure
            assert data.get("success") == False or "error" in data
        
        print(f"Missing params validation: Status {response.status_code}")
    
    def test_confidence_bounds(self):
        """Test confidence value edge cases"""
        trait_value = f"TEST_confidence_bounds_{uuid.uuid4().hex[:6]}"
        
        # Test with confidence = 0
        params_low = {
            "pet_id": TEST_PET_ID,
            "trait_type": "test_bounds",
            "trait_value": trait_value + "_low",
            "confidence": 0
        }
        response_low = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params_low)
        assert response_low.status_code == 200
        
        # Test with confidence = 100
        params_high = {
            "pet_id": TEST_PET_ID,
            "trait_type": "test_bounds",
            "trait_value": trait_value + "_high",
            "confidence": 100
        }
        response_high = requests.post(f"{BASE_URL}/api/mira/versioned/store-trait", params=params_high)
        assert response_high.status_code == 200
        
        print(f"Confidence bounds test: low={response_low.status_code}, high={response_high.status_code}")


# Cleanup test data after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_traits():
    """Cleanup TEST_ prefixed traits after test session"""
    yield
    # Note: Cleanup could be added here if needed
    # For now, TEST_ prefixed data is left for inspection


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
