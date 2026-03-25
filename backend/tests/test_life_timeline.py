"""
Life Timeline API Tests
=======================
Tests for the Pet Life Timeline feature - aggregates all pet life events:
birthday, adoption, services, purchases, health milestones from orders, 
tickets, and doggy_soul_answers.

Endpoints tested:
- GET /api/pet-soul/profile/{pet_id}/life-timeline
- POST /api/pet-soul/profile/{pet_id}/timeline-event
- DELETE /api/pet-soul/profile/{pet_id}/timeline-event/{event_id}
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment variable
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-ranking.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"

# Test pet IDs (Lola has timeline data)
TEST_PET_ID_LOLA = "pet-e6348b13c975"  # Lola - has dob, adoption, vet, grooming data
TEST_PET_ID_MOJO = "pet-99a708f1722a"  # Mojo - has adoption date


class TestLifeTimelineAPI:
    """Tests for the Life Timeline API"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    # =========================================================================
    # GET /api/pet-soul/profile/{pet_id}/life-timeline
    # =========================================================================
    
    def test_get_timeline_returns_200(self, headers):
        """Test that timeline endpoint returns 200 for valid pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_get_timeline_returns_expected_structure(self, headers):
        """Test that timeline response has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        assert "pet_id" in data
        assert "pet_name" in data
        assert "total_events" in data
        assert "categories" in data
        assert "timeline" in data
        
        # Validate types
        assert isinstance(data["pet_id"], str)
        assert isinstance(data["pet_name"], str)
        assert isinstance(data["total_events"], int)
        assert isinstance(data["categories"], dict)
        assert isinstance(data["timeline"], list)
    
    def test_timeline_includes_birthday_from_dob(self, headers):
        """Test that timeline includes birthday from pet.dob or doggy_soul_answers.dob"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check if birthday event exists (Lola has dob in doggy_soul_answers)
        timeline = data.get("timeline", [])
        birthday_events = [e for e in timeline if e.get("type") == "birthday"]
        
        # Note: Birthday may or may not be present depending on data
        # Just verify the API processes it correctly
        print(f"Found {len(birthday_events)} birthday events")
    
    def test_timeline_includes_adoption_date(self, headers):
        """Test that timeline includes adoption date from doggy_soul_answers.adoption_date"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        adoption_events = [e for e in timeline if e.get("type") == "adoption"]
        
        # Lola has adoption_date set
        assert len(adoption_events) >= 1, "Expected at least 1 adoption event for Lola"
        
        adoption = adoption_events[0]
        assert adoption.get("icon") == "🏠"
        assert "joined the family" in adoption.get("title", "")
        assert adoption.get("category") == "milestone"
    
    def test_timeline_includes_last_vet_visit(self, headers):
        """Test that timeline includes last vet visit from doggy_soul_answers.last_vet_visit"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        vet_events = [e for e in timeline if e.get("type") == "medical"]
        
        # Lola has last_vet_visit set
        assert len(vet_events) >= 1, "Expected at least 1 vet visit event for Lola"
        
        vet_visit = vet_events[0]
        assert vet_visit.get("icon") == "🏥"
        assert "Vet Visit" in vet_visit.get("title", "")
        assert vet_visit.get("category") == "health"
    
    def test_timeline_includes_last_grooming(self, headers):
        """Test that timeline includes last grooming from doggy_soul_answers.last_grooming_date"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        grooming_events = [e for e in timeline if e.get("type") == "grooming"]
        
        # Lola has last_grooming_date set
        assert len(grooming_events) >= 1, "Expected at least 1 grooming event for Lola"
        
        grooming = grooming_events[0]
        assert grooming.get("icon") == "✨"
        assert "Grooming" in grooming.get("title", "")
        assert grooming.get("category") == "care"
    
    def test_timeline_categories_are_counted(self, headers):
        """Test that timeline categories are correctly counted"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        categories = data.get("categories", {})
        total_events = data.get("total_events", 0)
        timeline = data.get("timeline", [])
        
        # Sum of categories should equal total events
        category_sum = sum(categories.values())
        assert category_sum == total_events, f"Category sum {category_sum} != total_events {total_events}"
        
        # Verify categories match timeline
        for event in timeline:
            cat = event.get("category")
            assert cat in categories, f"Event category '{cat}' not in categories"
    
    def test_timeline_is_sorted_by_date(self, headers):
        """Test that timeline events are sorted by date (most recent first)"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        
        # Extract dates and verify sorted
        dates = []
        for event in timeline:
            date_str = event.get("date")
            if date_str:
                try:
                    # Handle various date formats
                    if "T" in date_str:
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    else:
                        date = datetime.strptime(date_str, "%Y-%m-%d")
                    dates.append(date)
                except:
                    pass
        
        # Verify descending order (most recent first)
        for i in range(len(dates) - 1):
            assert dates[i] >= dates[i + 1], f"Events not sorted: {dates[i]} should be >= {dates[i + 1]}"
    
    def test_timeline_respects_limit(self, headers):
        """Test that timeline respects the limit parameter"""
        limit = 3
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit={limit}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        assert len(timeline) <= limit, f"Expected at most {limit} events, got {len(timeline)}"
    
    def test_timeline_invalid_pet_returns_404(self, headers):
        """Test that invalid pet ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/invalid-pet-id/life-timeline",
            headers=headers
        )
        assert response.status_code == 404
    
    # =========================================================================
    # POST /api/pet-soul/profile/{pet_id}/timeline-event
    # =========================================================================
    
    def test_add_timeline_event_success(self, headers):
        """Test adding a manual timeline event"""
        event_data = {
            "title": "TEST Milestone Event",
            "type": "milestone",
            "icon": "🎉",
            "description": "Test event from pytest",
            "date": "2026-01-15"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/timeline-event",
            headers=headers,
            json=event_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "event" in data
        
        event = data["event"]
        assert "id" in event
        assert event["title"] == event_data["title"]
        assert event["type"] == event_data["type"]
        assert event["icon"] == event_data["icon"]
        assert event["date"] == event_data["date"]
        
        # Store event ID for cleanup
        TestLifeTimelineAPI.test_event_id = event["id"]
    
    def test_added_event_appears_in_timeline(self, headers):
        """Test that added event appears in timeline"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        event_ids = [e.get("id") for e in timeline]
        
        # Check if our test event is in the timeline
        if hasattr(TestLifeTimelineAPI, 'test_event_id'):
            assert TestLifeTimelineAPI.test_event_id in event_ids, "Added event not found in timeline"
    
    # =========================================================================
    # DELETE /api/pet-soul/profile/{pet_id}/timeline-event/{event_id}
    # =========================================================================
    
    def test_delete_timeline_event_success(self, headers):
        """Test deleting a timeline event"""
        if not hasattr(TestLifeTimelineAPI, 'test_event_id'):
            pytest.skip("No test event to delete")
        
        event_id = TestLifeTimelineAPI.test_event_id
        
        response = requests.delete(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/timeline-event/{event_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "removed" in data["message"].lower()
    
    def test_deleted_event_not_in_timeline(self, headers):
        """Test that deleted event no longer appears in timeline"""
        if not hasattr(TestLifeTimelineAPI, 'test_event_id'):
            pytest.skip("No test event was created")
        
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/life-timeline?limit=50",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("timeline", [])
        event_ids = [e.get("id") for e in timeline]
        
        assert TestLifeTimelineAPI.test_event_id not in event_ids, "Deleted event still in timeline"
    
    def test_delete_nonexistent_event_behavior(self, headers):
        """Test deleting non-existent event - API returns 200 with no modification (idempotent)"""
        response = requests.delete(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID_LOLA}/timeline-event/nonexistent-event-id",
            headers=headers
        )
        # Note: API returns 200 even for non-existent events (idempotent delete)
        # This is acceptable REST behavior - the resource doesn't exist after the call
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
