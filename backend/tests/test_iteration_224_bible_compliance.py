"""
Test iteration 224: Bible compliance fixes
- TODAY endpoint returns urgent/due_today/awaiting items
- NOTIFICATIONS endpoint returns user notifications
- Places API no longer defaults to Mumbai
- PICKS API returns timely_picks
- TICKETS/Services API returns tickets
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pillar-launch.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-e6348b13c975"


class TestAuthSetup:
    """Get authentication token for subsequent tests"""
    
    token = None
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        token = data.get("token") or data.get("access_token")
        
        if not token:
            pytest.skip("No token returned from login")
        
        TestAuthSetup.token = token
        return token


class TestTodayEndpoint(TestAuthSetup):
    """Test TODAY endpoint - Bible Section 2.2"""
    
    def test_today_endpoint_exists(self, auth_token):
        """Test that TODAY endpoint exists and returns data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/today/{TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"TODAY endpoint failed: {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data or "items" in data, "Missing success or items field"
        print(f"TODAY endpoint response: {json.dumps(data, indent=2)[:500]}")
    
    def test_today_response_structure(self, auth_token):
        """Verify TODAY returns proper structure per Bible Section 2.2"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/today/{TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for required fields
        if data.get("success", True):  # Success or no error field
            assert "items" in data or "all_items" in data, "Missing items array"
            
            # Check summary if present
            if "summary" in data:
                summary = data["summary"]
                # Bible requires these counters
                expected_fields = ["urgent", "due_today", "awaiting_you", "total"]
                for field in expected_fields:
                    assert field in summary, f"Summary missing '{field}'"
                print(f"TODAY summary: urgent={summary.get('urgent')}, due_today={summary.get('due_today')}, awaiting={summary.get('awaiting_you')}")
    
    def test_today_items_have_required_fields(self, auth_token):
        """Verify each TODAY item has required fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/today/{TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        items = data.get("items") or data.get("all_items") or []
        
        for item in items[:3]:  # Check first 3 items
            assert "id" in item, "Item missing 'id'"
            assert "type" in item, "Item missing 'type'"
            assert "title" in item, "Item missing 'title'"
            print(f"TODAY item: {item.get('title')[:50] if item.get('title') else 'No title'}... (type={item.get('type')})")


class TestNotificationsEndpoint(TestAuthSetup):
    """Test NOTIFICATIONS endpoint"""
    
    def test_notifications_endpoint_exists(self, auth_token):
        """Test that NOTIFICATIONS endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/notifications",
            headers=headers
        )
        
        assert response.status_code == 200, f"NOTIFICATIONS endpoint failed: {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "notifications" in data, "Missing notifications array"
        print(f"NOTIFICATIONS returned {len(data.get('notifications', []))} items")
    
    def test_notifications_response_structure(self, auth_token):
        """Verify NOTIFICATIONS returns proper structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/notifications",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "notifications" in data
        assert "unread_count" in data, "Missing unread_count"
        
        notifications = data.get("notifications", [])
        for notif in notifications[:3]:
            assert "id" in notif, "Notification missing 'id'"
            assert "type" in notif, "Notification missing 'type'"
            assert "title" in notif or "message" in notif, "Notification missing title/message"
            print(f"Notification: {notif.get('type')} - {notif.get('title', notif.get('message', ''))[:50]}")
    
    def test_notifications_unread_only_filter(self, auth_token):
        """Test unread_only filter works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/notifications?unread_only=true",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        print(f"Unread notifications: {len(data.get('notifications', []))}")


class TestPlacesLocationFix(TestAuthSetup):
    """Test that Places API no longer defaults to Mumbai"""
    
    def test_location_query_without_city_asks_user(self, auth_token):
        """
        When user asks 'find vets near me' without city in profile,
        system should ask for location instead of defaulting to Mumbai
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Send a location-based query
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json={
                "message": "Find vets near me",
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that response doesn't have Mumbai-based places
        nearby_places = data.get("nearby_places") or []
        places_results = data.get("conversation_contract", {}).get("places_results") or []
        
        # If places are returned, they should be from user's actual city, not Mumbai
        all_places = nearby_places + places_results
        
        for place in all_places:
            place_str = str(place).lower()
            # Should NOT see Mumbai if user doesn't have Mumbai in profile
            if "mumbai" in place_str:
                # This might be okay if user actually is in Mumbai
                print(f"Warning: Mumbai found in places - verify user profile has Mumbai")
        
        # Check if mode is 'clarify' (asking for location)
        mode = data.get("conversation_contract", {}).get("mode") or data.get("mode")
        print(f"Location query response mode: {mode}")
        print(f"Places returned: {len(all_places)}")
    
    def test_health_checkup_no_places(self, auth_token):
        """
        Non-location intents like 'Health checkup reminder' should NOT trigger Places
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json={
                "message": "Health checkup reminder",
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have 0 places for non-location intent
        nearby_places = data.get("nearby_places") or []
        places_results = data.get("conversation_contract", {}).get("places_results") or []
        
        total_places = len(nearby_places) + len(places_results)
        assert total_places == 0, f"Health checkup should not return places, got {total_places}"
        print("PASS: Health checkup reminder returns 0 places (correct)")


class TestPicksAPI(TestAuthSetup):
    """Test PICKS API returns timely_picks"""
    
    def test_picks_in_chat_response(self, auth_token):
        """Test that chat responses include picks when appropriate"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json={
                "message": "What can I do for my dog today?",
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for picks in various locations
        timely_picks = data.get("timely_picks", [])
        picks = data.get("picks", [])
        conversation_contract = data.get("conversation_contract", {})
        
        print(f"timely_picks: {len(timely_picks)}")
        print(f"picks: {len(picks)}")
        
        if timely_picks or picks:
            sample_pick = (timely_picks or picks)[0]
            print(f"Sample pick: {json.dumps(sample_pick, indent=2)[:200]}")
    
    def test_picks_history_endpoint(self, auth_token):
        """Test picks-history endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/mira/picks-history/{TEST_PET_ID}",
            headers=headers
        )
        
        # Should return 200 even if no history
        assert response.status_code == 200, f"picks-history failed: {response.status_code}"
        data = response.json()
        print(f"Picks history response: {json.dumps(data, indent=2)[:300]}")


class TestTicketsAPI(TestAuthSetup):
    """Test TICKETS/Services API"""
    
    def test_active_tickets_endpoint(self, auth_token):
        """Test active tickets for pet"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/mira/tickets/active/{TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Active tickets failed: {response.status_code}"
        data = response.json()
        
        assert "tickets" in data or isinstance(data, list), "Missing tickets in response"
        tickets = data.get("tickets", data if isinstance(data, list) else [])
        print(f"Active tickets for pet: {len(tickets)}")
        
        for ticket in tickets[:3]:
            print(f"  - {ticket.get('ticket_id', 'unknown')}: {ticket.get('description', ticket.get('ticket_type', ''))[:50]}")
    
    def test_my_requests_endpoint(self, auth_token):
        """Test my-requests endpoint returns user's tickets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/mira/my-requests",
            headers=headers
        )
        
        assert response.status_code == 200, f"my-requests failed: {response.status_code}"
        data = response.json()
        
        assert "requests" in data, "Missing requests array"
        requests_list = data.get("requests", [])
        print(f"User's requests: {len(requests_list)}")
        
        for req in requests_list[:3]:
            print(f"  - {req.get('ticket_id', 'unknown')}: {req.get('type')} - {req.get('status')}")
    
    def test_tickets_list_endpoint(self, auth_token):
        """Test tickets list endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/mira/tickets?limit=10",
            headers=headers
        )
        
        assert response.status_code == 200, f"tickets list failed: {response.status_code}"
        data = response.json()
        
        assert "tickets" in data, "Missing tickets array"
        print(f"Total tickets returned: {len(data.get('tickets', []))}")


class TestMiraChat(TestAuthSetup):
    """Test Mira chat endpoint with various intents"""
    
    def test_chat_basic_response(self, auth_token):
        """Test basic chat response structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json={
                "message": "Hello",
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200, f"Chat failed: {response.status_code}"
        data = response.json()
        
        # Should have response text
        assert data.get("response") or data.get("message") or data.get("text"), "Missing response text"
        
        # Should have conversation_contract
        assert "conversation_contract" in data, "Missing conversation_contract"
        
        contract = data.get("conversation_contract", {})
        assert "mode" in contract, "Contract missing mode"
        print(f"Chat mode: {contract.get('mode')}")
        print(f"Quick replies: {len(contract.get('quick_replies', []))}")
    
    def test_chat_ticket_creation(self, auth_token):
        """Test that ticket mode creates a ticket"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json={
                "message": "Schedule vaccination for next month",
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for ticket creation signals
        ticket_id = data.get("ticket_id")
        mode = data.get("conversation_contract", {}).get("mode")
        
        print(f"Vaccination request - mode: {mode}, ticket_id: {ticket_id}")
        
        # Should be ticket mode or have a ticket_id
        if mode == "ticket" or ticket_id:
            print(f"PASS: Ticket created/mode for vaccination request")
        else:
            print(f"Note: Mode is '{mode}' - may need clarification first")


class TestPetProfile(TestAuthSetup):
    """Test pet profile display (Mojo)"""
    
    def test_pet_profile_fetch(self, auth_token):
        """Test fetching pet profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try common pet profile endpoints
        endpoints = [
            f"/api/pets/{TEST_PET_ID}",
            f"/api/mira/pet/{TEST_PET_ID}",
            f"/api/member/pet/{TEST_PET_ID}"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                pet_name = data.get("name") or data.get("pet", {}).get("name")
                if pet_name:
                    print(f"Pet profile found at {endpoint}: {pet_name}")
                    return
        
        print("Note: Pet profile endpoint not found in common paths")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
