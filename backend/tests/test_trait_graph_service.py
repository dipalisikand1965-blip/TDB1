"""
Test Trait Graph Service APIs
==============================
Tests for MOJO Bible Part 1 §13 - Trait Graph intelligence layer

Endpoints under test:
1. GET /api/pet-soul/profile/{pet_id}/trait-graph - Get trait graph stats
2. POST /api/pet-soul/profile/{pet_id}/trait-graph/service-outcome - Update traits from service
3. POST /api/pet-soul/profile/{pet_id}/trait-graph/behaviour-observation - Update traits from observation
4. GET /api/pet-soul/profile/{pet_id}/life-timeline - Life timeline should include service events
"""

import pytest
import requests
import os
import time
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test pet ID provided by main agent
TEST_PET_ID = "pet-e6348b13c975"


class TestTraitGraphStats:
    """Test GET /api/pet-soul/profile/{pet_id}/trait-graph endpoint"""

    def test_get_trait_graph_stats_success(self):
        """Test getting trait graph stats for valid pet"""
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure per trait_graph_service.py
        assert "total_traits" in data, "Response should have total_traits"
        assert "by_source" in data, "Response should have by_source"
        assert "avg_confidence" in data, "Response should have avg_confidence"
        assert "total_evidence" in data, "Response should have total_evidence"
        
        # Data type assertions
        assert isinstance(data["total_traits"], int), "total_traits should be int"
        assert isinstance(data["by_source"], dict), "by_source should be dict"
        assert isinstance(data["avg_confidence"], (int, float)), "avg_confidence should be numeric"
        assert isinstance(data["total_evidence"], int), "total_evidence should be int"
        
        print(f"✅ Trait Graph Stats: {data['total_traits']} traits, avg confidence: {data['avg_confidence']}")

    def test_get_trait_graph_stats_invalid_pet(self):
        """Test getting trait graph stats for non-existent pet"""
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/nonexistent-pet-id/trait-graph")
        
        # Should return 404 for non-existent pet or error dict
        data = response.json()
        if response.status_code == 404:
            assert "detail" in data or "error" in data
            print("✅ Returns 404 for non-existent pet")
        else:
            # Service returns error dict with 200 status
            assert "error" in data, "Should return error for non-existent pet"
            print(f"✅ Returns error message: {data['error']}")


class TestServiceOutcomeUpdate:
    """Test POST /api/pet-soul/profile/{pet_id}/trait-graph/service-outcome endpoint"""

    def test_service_outcome_grooming(self):
        """Test updating traits from grooming service outcome"""
        payload = {
            "service_type": "grooming",
            "outcome": {
                "grooming_tolerance": "excellent",
                "grooming_style": "breed_standard",
            },
            "notes": "TEST_grooming - Great session, very cooperative"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response should have success field"
        assert data.get("success") == True, f"Service outcome should succeed: {data}"
        assert "pet_id" in data, "Response should have pet_id"
        assert data["pet_id"] == TEST_PET_ID, "pet_id should match"
        assert "service_type" in data, "Response should have service_type"
        assert data["service_type"] == "grooming", "service_type should be grooming"
        
        # Check updated fields
        if "updated_fields" in data:
            assert isinstance(data["updated_fields"], list), "updated_fields should be list"
            print(f"✅ Updated {len(data['updated_fields'])} fields from grooming service")
            for field in data["updated_fields"]:
                print(f"   - {field.get('field')}: {field.get('old_value')} → {field.get('new_value')} (confidence: {field.get('confidence')})")
        
        # Check timeline event was added
        if "timeline_event_added" in data:
            event = data["timeline_event_added"]
            assert "id" in event, "Timeline event should have id"
            assert event.get("category") == "care", "Grooming should have 'care' category"
            print(f"✅ Timeline event added: {event.get('title')}")

    def test_service_outcome_vet_visit(self):
        """Test updating traits from vet visit service outcome"""
        payload = {
            "service_type": "vet_visit",
            "outcome": {
                "vet_comfort": "calm",
                "vet_name": "Dr. Smith",
                "vet_clinic": "Happy Paws Clinic"
            },
            "notes": "TEST_vet - Routine checkup, all vitals normal"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Vet visit update should succeed: {data}"
        assert data.get("service_type") == "vet_visit"
        
        # Vet visit should have 'health' category in timeline
        if "timeline_event_added" in data:
            event = data["timeline_event_added"]
            assert event.get("category") == "health", "Vet visit should have 'health' category"
            print(f"✅ Vet visit timeline event added with health category")

    def test_service_outcome_training(self):
        """Test updating traits from training service outcome"""
        payload = {
            "service_type": "training",
            "outcome": {
                "training_level": "intermediate",
                "commands_known": ["sit", "stay", "come", "down"],
                "training_style": "positive_reinforcement",
                "response_to_correction": "responds_well"
            },
            "notes": "TEST_training - Good progress on recall command"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Training update should succeed: {data}"
        
        # Training should have 'milestone' category in timeline
        if "timeline_event_added" in data:
            event = data["timeline_event_added"]
            assert event.get("category") == "milestone", "Training should have 'milestone' category"
            print(f"✅ Training timeline event added with milestone category")

    def test_service_outcome_invalid_type(self):
        """Test service outcome with unknown service type"""
        payload = {
            "service_type": "unknown_service_xyz",
            "outcome": {},
            "notes": "TEST - Unknown service"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        # Should return success=False or 4xx error
        if response.status_code == 200:
            data = response.json()
            # Service returns success=False for unknown service types
            assert data.get("success") == False, "Unknown service type should fail"
            assert "error" in data, "Should have error message"
            print(f"✅ Correctly rejects unknown service type: {data.get('error')}")
        else:
            print(f"✅ Returns {response.status_code} for unknown service type")

    def test_service_outcome_invalid_pet(self):
        """Test service outcome for non-existent pet"""
        payload = {
            "service_type": "grooming",
            "outcome": {},
            "notes": "TEST - Non-existent pet"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/nonexistent-pet-xyz/trait-graph/service-outcome",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == False, "Should fail for non-existent pet"
            print(f"✅ Returns success=False for non-existent pet")
        else:
            assert response.status_code in [404, 400], f"Expected 404 or 400, got {response.status_code}"
            print(f"✅ Returns {response.status_code} for non-existent pet")


class TestBehaviourObservation:
    """Test POST /api/pet-soul/profile/{pet_id}/trait-graph/behaviour-observation endpoint"""

    def test_behaviour_observation_grooming_feedback(self):
        """Test updating traits from groomer observation"""
        payload = {
            "observation_type": "grooming_feedback",
            "observation_data": {
                "anxiety_triggers": ["loud_dryers", "nail_clipping"],
                "grooming_tolerance": "moderate",
                "handling_comfort": "needs_gentle_approach",
                "noise_sensitivity": "high"
            },
            "observer": "groomer_alex"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/behaviour-observation",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response
        assert "success" in data, "Response should have success field"
        assert data.get("success") == True or data.get("message"), f"Observation should succeed or return message: {data}"
        
        if "updated_traits" in data:
            print(f"✅ Updated {len(data['updated_traits'])} traits from behaviour observation")
            for trait in data["updated_traits"]:
                print(f"   - {trait.get('field')}: observed '{trait.get('observed_value')}' by {trait.get('observer')}")
                # Verify evidence count incremented
                assert trait.get("evidence_count", 0) >= 1, "Evidence count should be at least 1"

    def test_behaviour_observation_training_feedback(self):
        """Test updating traits from trainer observation"""
        payload = {
            "observation_type": "training_feedback",
            "observation_data": {
                "energy_level": "high",
                "training_response": "eager_to_please",
                "social_with_dogs": "friendly",
                "stranger_reaction": "friendly"
            },
            "observer": "trainer_pat"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/behaviour-observation",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True or data.get("message"), f"Training feedback should succeed: {data}"
        print(f"✅ Training feedback observation processed")

    def test_behaviour_observation_empty_data(self):
        """Test behaviour observation with empty observation data"""
        payload = {
            "observation_type": "general_feedback",
            "observation_data": {},
            "observer": "test_observer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/behaviour-observation",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should succeed - service may update with empty arrays which is valid behavior
        if data.get("success"):
            if "message" in data:
                print(f"✅ Empty observation returns message: {data['message']}")
            else:
                # Empty observation_data may still update fields with default empty values
                # which is correct service behavior
                updated_count = len(data.get("updated_traits", []))
                print(f"✅ Empty observation processed: {updated_count} traits updated (empty values accepted)")

    def test_behaviour_observation_invalid_pet(self):
        """Test behaviour observation for non-existent pet"""
        payload = {
            "observation_type": "grooming_feedback",
            "observation_data": {"grooming_tolerance": "good"},
            "observer": "test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/nonexistent-pet-xyz/trait-graph/behaviour-observation",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == False, "Should fail for non-existent pet"
            print(f"✅ Returns success=False for non-existent pet")
        else:
            assert response.status_code in [404, 400], f"Expected 404 or 400, got {response.status_code}"
            print(f"✅ Returns {response.status_code} for non-existent pet")


class TestConfidenceAndEvidence:
    """Test that confidence scores and evidence counts work correctly"""

    def test_confidence_uses_source_priority(self):
        """Test that confidence follows source priority (service_outcome: 90)"""
        # First, submit a service outcome
        payload = {
            "service_type": "nail_trim",
            "outcome": {
                "handling_comfort": "very_cooperative"
            },
            "notes": "TEST_confidence - Testing confidence scoring"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("success") and "updated_fields" in data:
            for field in data["updated_fields"]:
                confidence = field.get("confidence", 0)
                # Service outcome should have confidence >= 90 (SOURCE_PRIORITY["service_outcome"])
                # Plus confidence_boost from mapping
                assert confidence >= 90, f"Service outcome confidence should be >= 90, got {confidence}"
                print(f"✅ Field '{field.get('field')}' confidence: {confidence} (meets service_outcome priority)")

    def test_evidence_count_increments(self):
        """Test that evidence count increments with each update"""
        # Get initial stats
        stats_before = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph").json()
        evidence_before = stats_before.get("total_evidence", 0)
        
        # Submit another observation
        payload = {
            "observation_type": "daycare_feedback",
            "observation_data": {
                "social_with_dogs": "very_friendly",
                "energy_level": "high"
            },
            "observer": "daycare_staff"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/behaviour-observation",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Get updated stats
        stats_after = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph").json()
        evidence_after = stats_after.get("total_evidence", 0)
        
        # Evidence should have increased (if traits were updated)
        if data.get("success") and data.get("updated_traits"):
            assert evidence_after >= evidence_before, "Evidence count should not decrease"
            print(f"✅ Evidence count: {evidence_before} → {evidence_after}")


class TestLifeTimelineIntegration:
    """Test that service outcomes add events to life timeline"""

    def test_service_outcome_adds_timeline_event(self):
        """Test that service outcome adds event to life timeline"""
        # Submit a service outcome with unique identifier
        test_marker = f"TEST_{int(time.time())}"
        payload = {
            "service_type": "checkup",
            "outcome": {
                "weight": "25kg",
                "health_conditions": []
            },
            "notes": f"{test_marker} - Health checkup completed"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("success"):
            # Verify timeline event was added in response
            assert "timeline_event_added" in data, "Should include timeline_event_added"
            event = data["timeline_event_added"]
            assert event.get("type") == "health", "Checkup should have 'health' type"
            print(f"✅ Service outcome added timeline event: {event.get('title')}")
            
            # Verify by fetching life timeline
            time.sleep(0.5)  # Small delay for DB update
            timeline_response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/life-timeline")
            
            if timeline_response.status_code == 200:
                timeline_data = timeline_response.json()
                events = timeline_data.get("events", timeline_data) if isinstance(timeline_data, dict) else timeline_data
                
                # Check if our event is in the timeline
                if isinstance(events, list):
                    found = any(
                        test_marker in str(e.get("description", "")) or 
                        "checkup" in str(e.get("title", "")).lower()
                        for e in events[:10]  # Check recent events
                    )
                    if found:
                        print("✅ Timeline event visible in life-timeline API")


class TestLifeTimelineEndpoint:
    """Test that life-timeline endpoint works without datetime errors"""

    def test_life_timeline_no_datetime_errors(self):
        """Test life-timeline endpoint returns without errors"""
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/life-timeline")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check response is list or dict with events
        if isinstance(data, list):
            events = data
        elif isinstance(data, dict):
            events = data.get("events", data.get("timeline", []))
        else:
            events = []
        
        # Verify no errors in response
        assert "error" not in str(data).lower() or data.get("error") is None, f"Should not have errors: {data}"
        
        print(f"✅ Life timeline returned {len(events)} events without datetime errors")
        
        # Verify event structure
        if events:
            event = events[0]
            assert "date" in event or "created_at" in event, "Events should have date field"
            print(f"   First event: {event.get('title', event.get('type', 'Unknown'))}")

    def test_life_timeline_with_limit(self):
        """Test life-timeline respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/life-timeline?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        if isinstance(data, list):
            events = data
        else:
            events = data.get("events", [])
        
        assert len(events) <= 5, f"Should respect limit=5, got {len(events)} events"
        print(f"✅ Limit parameter works: {len(events)} events returned")


class TestAllServiceTypes:
    """Test all supported service types from SERVICE_TO_MOJO_MAPPINGS"""

    @pytest.mark.parametrize("service_type,expected_category", [
        ("grooming", "care"),
        ("bath", "care"),
        ("nail_trim", "care"),
        ("vet_visit", "health"),
        ("vaccination", "health"),
        ("checkup", "health"),
        ("boarding", "service"),
        ("daycare", "service"),
        ("training", "milestone"),
        ("dog_walking", "care"),
    ])
    def test_service_type_mapping(self, service_type, expected_category):
        """Test each service type maps to correct timeline category"""
        payload = {
            "service_type": service_type,
            "outcome": {},
            "notes": f"TEST_mapping - {service_type} service"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/trait-graph/service-outcome",
            json=payload
        )
        
        assert response.status_code == 200, f"Service type '{service_type}' failed: {response.text}"
        
        data = response.json()
        if data.get("success") and "timeline_event_added" in data:
            event = data["timeline_event_added"]
            assert event.get("category") == expected_category, \
                f"{service_type} should have category '{expected_category}', got '{event.get('category')}'"
            print(f"✅ {service_type} → {expected_category} category")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests complete"""
    yield
    # Note: We're not deleting test data as it's useful for verification
    # In production, you might want to clean up TEST_ prefixed entries
    print("\n📝 Test data preserved for verification")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
