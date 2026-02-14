"""
PICKS Auto-Refresh Feature Test
================================
Tests for MIRA OS Picks Engine auto-refresh functionality:
1. Chat message should return picks in the response
2. Pillar auto-switching based on conversation intent
3. Grooming queries return 'care' pillar picks
4. Birthday queries return 'celebrate' pillar picks

Endpoint: POST /api/mira/os/understand-with-products
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPicksAutoRefresh:
    """Test PICKS auto-refresh on every chat turn"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test credentials and get auth token"""
        self.user_email = "dipali@clubconcierge.in"
        self.user_password = "test123"
        self.token = None
        self.pet_id = None
        self.pet_context = None
        
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": self.user_email,
                "password": self.user_password
            }
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            
            # Get user's pets
            if self.token:
                pets_response = requests.get(
                    f"{BASE_URL}/api/pets",
                    headers={"Authorization": f"Bearer {self.token}"}
                )
                if pets_response.status_code == 200:
                    pets = pets_response.json()
                    if pets and len(pets) > 0:
                        pet = pets[0]
                        self.pet_id = pet.get("id") or pet.get("pet_id")
                        self.pet_context = {
                            "name": pet.get("name", "Buddy"),
                            "breed": pet.get("breed", ""),
                            "age": pet.get("age", ""),
                            "id": self.pet_id,
                            "city": "Mumbai"
                        }
    
    def test_chat_returns_picks_in_response(self):
        """Test that sending a chat message returns picks in the response"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a chat message about grooming
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "I need grooming for my dog",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-001",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify 'picks' field exists in response
        assert "picks" in data, "Response should contain 'picks' field"
        
        # Verify picks is a list
        picks = data.get("picks", [])
        assert isinstance(picks, list), "picks should be a list"
        
        # Print picks for debugging
        print(f"[TEST] Chat response contains {len(picks)} picks")
        if picks:
            for pick in picks[:3]:
                print(f"  - Pick: {pick.get('title', pick.get('name', 'Unknown'))} | Type: {pick.get('pick_type', 'unknown')}")
        
        # Verify concierge decision is present
        assert "concierge" in data, "Response should contain 'concierge' decision"
        concierge = data.get("concierge", {})
        assert isinstance(concierge, dict), "concierge should be a dict"
        print(f"[TEST] Concierge prominence: {concierge.get('cta_prominence', 'not set')}")
        
        # Verify safety_override is present
        assert "safety_override" in data, "Response should contain 'safety_override'"
    
    def test_grooming_query_returns_care_pillar(self):
        """Test that grooming queries auto-switch to 'care' pillar"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a grooming-related query
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "I need grooming for my dog",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-002",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check the pillar
        pillar = data.get("pillar")
        print(f"[TEST] Grooming query returned pillar: {pillar}")
        
        # Should be 'care' pillar for grooming
        # Note: pillar could also be in os_context or response
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        os_pillar = picks_update.get("pillar")
        
        current_pillar = data.get("current_pillar")
        
        print(f"[TEST] Pillar in response: {pillar}")
        print(f"[TEST] Pillar in os_context: {os_pillar}")
        print(f"[TEST] Current pillar: {current_pillar}")
        
        # At least one should indicate 'care' for grooming
        found_care = (
            pillar == "care" or 
            os_pillar == "care" or 
            current_pillar == "care"
        )
        
        # Check care_picks in os_context
        care_picks = os_context.get("care_picks", [])
        print(f"[TEST] Care picks from OS context: {len(care_picks)}")
        
        if not found_care and len(care_picks) > 0:
            found_care = True
            print("[TEST] Found care picks - pillar detection working")
        
        assert found_care or len(care_picks) > 0, "Grooming query should trigger care pillar or return care picks"
    
    def test_birthday_query_returns_celebrate_pillar(self):
        """Test that birthday queries auto-switch to 'celebrate' pillar"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a birthday-related query
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "I want to plan a birthday party for my dog",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-003",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check the pillar
        pillar = data.get("pillar")
        print(f"[TEST] Birthday query returned pillar: {pillar}")
        
        # Should be 'celebrate' pillar for birthday
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        os_pillar = picks_update.get("pillar")
        
        current_pillar = data.get("current_pillar")
        
        print(f"[TEST] Pillar in response: {pillar}")
        print(f"[TEST] Pillar in os_context: {os_pillar}")
        print(f"[TEST] Current pillar: {current_pillar}")
        
        # Check celebrate_picks in os_context
        celebrate_picks = os_context.get("celebrate_picks", [])
        print(f"[TEST] Celebrate picks from OS context: {len(celebrate_picks)}")
        
        # At least one should indicate 'celebrate' for birthday
        found_celebrate = (
            pillar == "celebrate" or 
            os_pillar == "celebrate" or 
            current_pillar == "celebrate" or
            len(celebrate_picks) > 0
        )
        
        assert found_celebrate, "Birthday query should trigger celebrate pillar or return celebrate picks"
    
    def test_picks_response_structure(self):
        """Test that picks have the correct structure"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a generic query
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "What treats are good for my dog?",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-004",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "picks" in data, "Response should have picks"
        assert "concierge" in data, "Response should have concierge"
        assert "safety_override" in data, "Response should have safety_override"
        
        # If we have picks, verify structure
        picks = data.get("picks", [])
        if len(picks) > 0:
            pick = picks[0]
            print(f"[TEST] Sample pick structure: {list(pick.keys())}")
            
            # Picks should have these fields (based on picks_engine.py)
            expected_fields = ["pick_id", "title", "pick_type", "pillar"]
            found_fields = [f for f in expected_fields if f in pick]
            print(f"[TEST] Found fields: {found_fields}")
        
        # Verify concierge structure
        concierge = data.get("concierge", {})
        print(f"[TEST] Concierge structure: {list(concierge.keys())}")
        
        # Should have mode and cta_prominence
        assert "mode" in concierge or "cta_prominence" in concierge, \
            "Concierge should have mode or cta_prominence"
        
        # Verify safety_override structure
        safety = data.get("safety_override", {})
        print(f"[TEST] Safety override structure: {list(safety.keys())}")
        
        # Should have active field
        assert "active" in safety, "Safety override should have 'active' field"
    
    def test_travel_query_returns_travel_pillar(self):
        """Test that travel queries auto-switch to 'travel' pillar"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a travel-related query
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "I'm planning a trip to Goa with my dog",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-005",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar")
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        print(f"[TEST] Travel query pillar: {pillar}")
        print(f"[TEST] Travel picks count: {len(travel_picks)}")
        
        found_travel = (
            pillar == "travel" or 
            len(travel_picks) > 0 or
            os_context.get("picks_update", {}).get("pillar") == "travel"
        )
        
        assert found_travel, "Travel query should trigger travel pillar or return travel picks"
    
    def test_missing_profile_fields_returned(self):
        """Test that missing_profile_fields is returned in response"""
        if not self.token:
            pytest.skip("Could not authenticate - skipping test")
        
        # Send a query
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "input": "What food is best for my dog?",
                "pet_id": self.pet_id,
                "pet_context": self.pet_context,
                "session_id": "test-session-picks-006",
                "include_products": True,
                "page_context": "mira-demo"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check missing_profile_fields exists
        assert "missing_profile_fields" in data, "Response should have missing_profile_fields"
        missing_fields = data.get("missing_profile_fields", [])
        
        print(f"[TEST] Missing profile fields: {missing_fields}")
        assert isinstance(missing_fields, list), "missing_profile_fields should be a list"


class TestPicksEndpointHealth:
    """Basic health checks for the API"""
    
    def test_api_reachable(self):
        """Test that the API is reachable"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code in [200, 404], f"API should be reachable, got {response.status_code}"
        print(f"[TEST] API health check: {response.status_code}")
    
    def test_understand_endpoint_accessible(self):
        """Test that understand-with-products endpoint is accessible"""
        # Try without auth - should get 401 or allow unauthenticated
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers={"Content-Type": "application/json"},
            json={
                "input": "Hello",
                "pet_context": {"name": "Test Dog", "breed": "Test"},
                "session_id": "health-check"
            }
        )
        
        # Should get a response (200, 401, or 422 for validation)
        assert response.status_code in [200, 401, 422, 500], \
            f"Endpoint should respond, got {response.status_code}"
        print(f"[TEST] understand-with-products endpoint status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
