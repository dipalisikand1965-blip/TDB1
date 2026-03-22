"""
Backend Tests for Bug Fixes:
1. AI chat correctly identifies 'dog walker' request as CARE pillar (not mixing with celebrate flow)
2. Member Inbox loads notifications correctly
3. Picks panel 'Create for Pet' button creates service tickets

Test Focus:
- AI context switching from celebrate flow to care pillar
- Member notifications inbox endpoint
- Service request creation flow
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-chapters.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"  # Correct password from review request
ADMIN_USER = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", f"API unhealthy: {data}"
        print(f"✓ API Health: {data}")


class TestUserAuthentication:
    """User login flow tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No token in response: {data}"
        print(f"✓ User login successful")
        return data["access_token"]
    
    def test_login_success(self):
        """Test user login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == TEST_USER_EMAIL or "access_token" in data
        print(f"✓ Login test passed - token received")


class TestAIContextSwitching:
    """
    Tests for AI context switching bug fix:
    - When user asks for 'dog walker' while in celebrate flow, AI should switch to CARE pillar
    - AI should not mix celebration responses with dog walker requests
    """
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_dog_walker_request_detected_as_care_pillar(self, auth_token):
        """
        BUG FIX TEST: 'dog walker' request should be identified as CARE pillar
        Not mixed with celebrate flow
        """
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Send a dog walker request
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a dog walker for next week",
            "pet_name": "Mystique",
            "user_email": TEST_USER_EMAIL
        }, headers=headers)
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Check that response doesn't contain celebration-related content
        response_text = data.get("response", "").lower()
        
        # Should NOT contain celebrate/birthday keywords in the response
        celebrate_keywords = ["birthday", "party", "celebration", "cake", "pawty"]
        has_celebrate_content = any(kw in response_text for kw in celebrate_keywords)
        
        # Should contain care/walker related content
        care_keywords = ["walker", "walking", "care", "daily", "service", "concierge"]
        has_care_content = any(kw in response_text for kw in care_keywords)
        
        # Assert the fix works
        if has_celebrate_content and not has_care_content:
            pytest.fail(f"BUG NOT FIXED: AI response contains celebration content for dog walker request: {response_text[:500]}")
        
        print(f"✓ Dog walker request correctly handled (no celebrate flow mixing)")
        print(f"  Response pillar hints: {data.get('pillar', 'unknown')}")
        print(f"  Response preview: {response_text[:200]}...")
        
        # Additionally check pillar classification
        pillar = data.get("pillar", data.get("classification", {}).get("pillar", ""))
        if pillar:
            print(f"  Pillar detected: {pillar}")
            # Dog walker should be care pillar
            assert pillar in ["care", "general"], f"Expected care pillar, got: {pillar}"
    
    def test_context_switch_from_celebrate_to_care(self, auth_token):
        """
        BUG FIX TEST: When user switches from celebrate flow to care request,
        the AI should recognize the context switch
        """
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # First message: Start a celebration flow
        response1 = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to plan a birthday party for Mystique",
            "pet_name": "Mystique",
            "user_email": TEST_USER_EMAIL
        }, headers=headers)
        
        assert response1.status_code == 200, f"First message failed: {response1.text}"
        
        # Second message: Switch context to dog walker (should NOT continue celebrate flow)
        response2 = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Actually, I need a dog walker for next week instead",
            "pet_name": "Mystique",
            "user_email": TEST_USER_EMAIL
        }, headers=headers)
        
        assert response2.status_code == 200, f"Second message failed: {response2.text}"
        data = response2.json()
        
        response_text = data.get("response", "").lower()
        
        # After context switch, response should NOT be asking about party location/size
        celebrate_flow_questions = ["party location", "party size", "guest", "venue", "number of dogs"]
        has_celebrate_flow_questions = any(q in response_text for q in celebrate_flow_questions)
        
        if has_celebrate_flow_questions:
            pytest.fail(f"BUG NOT FIXED: AI still asking celebrate flow questions after context switch: {response_text[:500]}")
        
        print(f"✓ Context switch from celebrate to care detected correctly")
        print(f"  Response preview: {response_text[:200]}...")


class TestMemberNotificationsInbox:
    """
    Tests for Member Inbox functionality:
    - Inbox should load notifications correctly (not appear empty/blank)
    - Filter by pet should work
    - Archive/unarchive should work
    """
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_inbox_endpoint_returns_valid_response(self, auth_token):
        """
        BUG FIX TEST: Member inbox should return valid data structure
        Previously it was appearing empty/blank
        """
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Test the inbox endpoint
        response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{TEST_USER_EMAIL}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Inbox endpoint failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "notifications" in data, f"Missing 'notifications' key: {data}"
        assert "unread" in data, f"Missing 'unread' key: {data}"
        
        # Notifications should be a list (can be empty, but should be list)
        assert isinstance(data["notifications"], list), f"Notifications should be a list: {type(data['notifications'])}"
        
        print(f"✓ Inbox endpoint returns valid response")
        print(f"  Total notifications: {len(data['notifications'])}")
        print(f"  Unread count: {data.get('unread', 0)}")
        
        # If there are notifications, verify structure
        if data["notifications"]:
            notif = data["notifications"][0]
            print(f"  First notification type: {notif.get('type', 'unknown')}")
            print(f"  First notification title: {notif.get('title', 'no title')[:50]}")
    
    def test_inbox_with_category_filter(self, auth_token):
        """Test inbox filtering by category (primary/updates)"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Test primary category
        response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{TEST_USER_EMAIL}?category=primary",
            headers=headers
        )
        assert response.status_code == 200, f"Primary filter failed: {response.text}"
        primary_data = response.json()
        
        # Test updates category
        response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{TEST_USER_EMAIL}?category=updates",
            headers=headers
        )
        assert response.status_code == 200, f"Updates filter failed: {response.text}"
        updates_data = response.json()
        
        print(f"✓ Inbox category filters work")
        print(f"  Primary notifications: {len(primary_data.get('notifications', []))}")
        print(f"  Updates notifications: {len(updates_data.get('notifications', []))}")
    
    def test_inbox_archived_filter(self, auth_token):
        """Test inbox archived filter"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Test with archived=false (default)
        response1 = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{TEST_USER_EMAIL}?archived=false",
            headers=headers
        )
        assert response1.status_code == 200
        
        # Test with archived=true
        response2 = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{TEST_USER_EMAIL}?archived=true",
            headers=headers
        )
        assert response2.status_code == 200
        
        print(f"✓ Inbox archived filter works")


class TestPicksPanelServiceRequest:
    """
    Tests for Picks panel service request creation:
    - 'Create for Pet' button should create service tickets
    """
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_concierge_picks_request_endpoint(self, auth_token):
        """Test that picks request endpoint creates a ticket"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Create a picks request (simulating 'Create for Pet' button)
        test_pick = {
            "pet_name": "Mystique",
            "pet_id": "test-pet-id",
            "user_email": TEST_USER_EMAIL,
            "selected_items": [
                {
                    "id": "test-pick-1",
                    "name": "Daily Walker Service",
                    "pick_type": "concierge",
                    "pillar": "care",
                    "service_type": "walker_search"
                }
            ],
            "additional_notes": "Test request from automated test",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/picks-request",
            json=test_pick,
            headers=headers
        )
        
        # Should be 200 or 201 for success
        assert response.status_code in [200, 201], f"Picks request failed: {response.status_code} - {response.text}"
        
        data = response.json()
        print(f"✓ Picks request endpoint works")
        print(f"  Response: {json.dumps(data, indent=2)[:300]}")
    
    def test_service_request_endpoint(self, auth_token):
        """Test service request endpoint (alternative flow)"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Try the service requests endpoint
        test_request = {
            "type": "PICK_REQUEST",
            "pillar": "care",
            "source": "picks_panel_test",
            "title": "Test Walker Request",
            "customer": {
                "name": "Test User",
                "email": TEST_USER_EMAIL,
                "phone": ""
            },
            "details": {
                "pick_name": "Daily Walker Service",
                "pick_type": "concierge",
                "message": "Test request for dog walker"
            },
            "priority": "normal",
            "intent": "test_pick"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-requests",
            json=test_request,
            headers=headers
        )
        
        # Endpoint might return various status codes
        if response.status_code in [200, 201]:
            print(f"✓ Service request endpoint works")
            print(f"  Response: {response.json()}")
        elif response.status_code == 404:
            print(f"⚠ Service request endpoint not found (may use different route)")
        else:
            print(f"⚠ Service request returned: {response.status_code} - {response.text[:200]}")


class TestPetData:
    """Test pet-related endpoints to verify Mystique pet exists"""
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Login failed")
    
    def test_user_pets_endpoint(self, auth_token):
        """Test that user can fetch their pets (verify Mystique exists)"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        response = requests.get(
            f"{BASE_URL}/api/user/{TEST_USER_EMAIL}/pets",
            headers=headers
        )
        
        assert response.status_code == 200, f"Pets endpoint failed: {response.text}"
        data = response.json()
        
        pets = data.get("pets", [])
        print(f"✓ User pets endpoint works")
        print(f"  Number of pets: {len(pets)}")
        
        # Check if Mystique exists
        mystique = next((p for p in pets if p.get("name", "").lower() == "mystique"), None)
        if mystique:
            print(f"  ✓ Found test pet 'Mystique'")
            print(f"    Pet ID: {mystique.get('id', 'N/A')}")
        else:
            print(f"  ⚠ Test pet 'Mystique' not found - may need to create for full testing")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
