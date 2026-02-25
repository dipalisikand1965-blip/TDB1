"""
Test LEARN → TODAY Integration
Tests the smart nudge system that surfaces relevant actions in TODAY panel
based on Learn events (completed/saved items)

Endpoints tested:
- POST /api/os/learn/event - Record learn events
- GET /api/os/learn/today-nudge - Get nudge for TODAY panel
- POST /api/os/learn/today-nudge/dismiss - Dismiss a nudge
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review_request
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-e6348b13c975"
TEST_PET_NAME = "Lola"


class TestLearnTodayIntegration:
    """Tests for LEARN → TODAY nudge integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            # The API returns access_token, not token
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEST: POST /api/os/learn/event - Record learn events
    # ─────────────────────────────────────────────────────────────────────────
    
    def test_record_completed_event(self, auth_headers):
        """Test recording a 'completed' event for a learn item"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "completed",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("event_type") == "completed"
        assert data.get("item_id") == "guide_brushing_coats"
        print(f"✓ Recorded 'completed' event for guide_brushing_coats")
    
    def test_record_saved_event(self, auth_headers):
        """Test recording a 'saved' event for a learn item"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_first_grooming",
                "item_type": "guide",
                "event_type": "saved",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("event_type") == "saved"
        print(f"✓ Recorded 'saved' event for guide_first_grooming")
    
    def test_record_helpful_event(self, auth_headers):
        """Test recording a 'helpful' feedback event"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "helpful",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data.get("event_type") == "helpful"
        print(f"✓ Recorded 'helpful' feedback for guide_brushing_coats")
    
    def test_record_not_helpful_event(self, auth_headers):
        """Test recording a 'not_helpful' feedback event"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_ear_cleaning",
                "item_type": "guide",
                "event_type": "not_helpful",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data.get("event_type") == "not_helpful"
        print(f"✓ Recorded 'not_helpful' feedback for guide_ear_cleaning")
    
    def test_record_event_invalid_type(self, auth_headers):
        """Test recording event with invalid event_type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "invalid_type",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400
        print(f"✓ Invalid event_type correctly rejected with 400")
    
    def test_record_event_requires_auth(self):
        """Test recording event without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "completed",
                "pet_id": TEST_PET_ID
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401
        print(f"✓ Unauthenticated request correctly rejected with 401")
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEST: GET /api/os/learn/today-nudge - Get nudge for TODAY panel
    # ─────────────────────────────────────────────────────────────────────────
    
    def test_get_today_nudge_with_recent_activity(self, auth_headers):
        """Test getting today nudge when there's recent completed activity"""
        # First record a completed event for an item with service mapping
        requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "completed",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        # Give a moment for the event to be recorded
        time.sleep(0.5)
        
        # Now fetch the nudge
        response = requests.get(
            f"{BASE_URL}/api/os/learn/today-nudge",
            params={"pet_id": TEST_PET_ID},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        
        # After completing an item with service mapping, we might get a nudge
        # OR we might get cooldown_active if a nudge was shown recently
        if data.get("nudge"):
            nudge = data["nudge"]
            print(f"✓ Got nudge for item: {nudge.get('learn_item', {}).get('title')}")
            
            # Verify nudge structure
            assert "id" in nudge
            assert "title" in nudge
            assert "context_line" in nudge
            assert "learn_item" in nudge
            assert "primary_cta" in nudge
            assert "secondary_cta" in nudge
            
            # Verify learn_item details
            learn_item = nudge.get("learn_item", {})
            assert "id" in learn_item
            assert "type" in learn_item
            assert "title" in learn_item
            
            # Verify primary CTA (service action)
            primary_cta = nudge.get("primary_cta", {})
            assert "label" in primary_cta
            assert "service_type" in primary_cta
            assert "prefill" in primary_cta
            
            # Verify secondary CTA (ask mira)
            secondary_cta = nudge.get("secondary_cta", {})
            assert "label" in secondary_cta
            assert "action" in secondary_cta
            assert "context" in secondary_cta
            
            print(f"  - Primary CTA: {primary_cta.get('label')}")
            print(f"  - Secondary CTA: {secondary_cta.get('label')}")
        else:
            reason = data.get("reason", "unknown")
            print(f"✓ No nudge returned - reason: {reason}")
            # This is acceptable - cooldown might be active
            assert reason in ["cooldown_active", "no_recent_activity", "no_actionable_items", "no_auth", "no_pet"]
    
    def test_get_today_nudge_no_pet(self, auth_headers):
        """Test getting nudge without pet_id"""
        response = requests.get(
            f"{BASE_URL}/api/os/learn/today-nudge",
            params={"pet_id": ""},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Without pet_id, should return no nudge
        assert data.get("nudge") is None
        print(f"✓ No nudge returned without pet_id - reason: {data.get('reason')}")
    
    def test_get_today_nudge_demo_pet(self, auth_headers):
        """Test getting nudge for demo pet returns no nudge"""
        response = requests.get(
            f"{BASE_URL}/api/os/learn/today-nudge",
            params={"pet_id": "demo-pet"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("nudge") is None
        print(f"✓ No nudge for demo pet - reason: {data.get('reason')}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEST: POST /api/os/learn/today-nudge/dismiss - Dismiss a nudge
    # ─────────────────────────────────────────────────────────────────────────
    
    def test_dismiss_nudge(self, auth_headers):
        """Test dismissing a nudge"""
        nudge_id = f"learn_nudge_guide_brushing_coats_{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/os/learn/today-nudge/dismiss",
            params={
                "nudge_id": nudge_id,
                "item_id": "guide_brushing_coats",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Nudge dismissed successfully")
    
    def test_dismiss_nudge_requires_auth(self):
        """Test dismissing nudge without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/os/learn/today-nudge/dismiss",
            params={
                "nudge_id": "test_nudge",
                "item_id": "guide_brushing_coats",
                "pet_id": TEST_PET_ID
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401
        print(f"✓ Dismiss without auth correctly rejected with 401")
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEST: 7-day cooldown logic
    # ─────────────────────────────────────────────────────────────────────────
    
    def test_cooldown_respects_7_day_rule(self, auth_headers):
        """Test that after showing a nudge, 7-day cooldown is respected"""
        # Record a completed event to trigger nudge
        requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "completed",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        # First call to today-nudge
        response1 = requests.get(
            f"{BASE_URL}/api/os/learn/today-nudge",
            params={"pet_id": TEST_PET_ID},
            headers=auth_headers
        )
        data1 = response1.json()
        
        # If we got a nudge on first call, subsequent calls should return cooldown_active
        if data1.get("nudge"):
            print(f"First call returned nudge for: {data1['nudge'].get('learn_item', {}).get('title')}")
            
            # Second call should respect cooldown
            response2 = requests.get(
                f"{BASE_URL}/api/os/learn/today-nudge",
                params={"pet_id": TEST_PET_ID},
                headers=auth_headers
            )
            data2 = response2.json()
            
            # Should be cooldown_active since we just showed a nudge
            assert data2.get("nudge") is None
            assert data2.get("reason") == "cooldown_active"
            print(f"✓ Second call correctly returns cooldown_active")
        else:
            # Already in cooldown from previous tests
            print(f"✓ Already in cooldown - reason: {data1.get('reason')}")
            assert data1.get("reason") in ["cooldown_active", "no_actionable_items", "no_recent_activity"]


class TestLearnServiceMapping:
    """Test that Learn items correctly map to service types"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            # The API returns access_token, not token
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_grooming_guide_maps_to_grooming_service(self, auth_headers):
        """Test that grooming guides map to grooming service type"""
        # Record completion of grooming guide
        requests.post(
            f"{BASE_URL}/api/os/learn/event",
            params={
                "item_id": "guide_brushing_coats",
                "item_type": "guide",
                "event_type": "completed",
                "pet_id": TEST_PET_ID
            },
            headers=auth_headers
        )
        
        # Get nudge (might be cooldown, that's ok)
        response = requests.get(
            f"{BASE_URL}/api/os/learn/today-nudge",
            params={"pet_id": TEST_PET_ID},
            headers=auth_headers
        )
        data = response.json()
        
        if data.get("nudge"):
            nudge = data["nudge"]
            # Verify it maps to grooming service
            assert nudge["primary_cta"]["service_type"] == "grooming"
            print(f"✓ guide_brushing_coats maps to grooming service")
        else:
            print(f"✓ In cooldown - skipping service type verification")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
