"""
Iteration 148: Testing Travel Page WhatsApp Button, Login Streak Recording, and Mobile Responsiveness
Features to test:
1. Travel page WhatsApp button - data-testid='whatsapp-ask-concierge-btn' and wa.me link
2. Login streak recording - logging in should increment user's streak counter
3. Streak API endpoint - GET /api/engagement/streak/{user_id} should return current streak
4. Travel page mobile responsiveness
5. MiraPicksCarousel on Travel page (when user logged in with selected pets)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")


class TestLoginStreakRecording:
    """Test login streak recording functionality"""
    
    def test_login_returns_success_and_user_data(self):
        """Test that login endpoint works and returns user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify login response structure
        assert "access_token" in data, "Missing access_token in login response"
        assert "user" in data, "Missing user in login response"
        assert "id" in data["user"], "Missing user id in login response"
        
        print(f"✅ Login successful for user: {data['user'].get('email')}")
        print(f"   User ID: {data['user']['id']}")
        return data
    
    def test_streak_endpoint_returns_streak_data(self):
        """Test GET /api/engagement/streak/{user_id} returns streak data"""
        # First login to get user_id
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        user_id = login_response.json()["user"]["id"]
        token = login_response.json()["access_token"]
        
        # Now check streak endpoint
        streak_response = requests.get(
            f"{BASE_URL}/api/engagement/streak/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert streak_response.status_code == 200, f"Streak endpoint failed: {streak_response.text}"
        
        streak_data = streak_response.json()
        print(f"✅ Streak endpoint returned data: {streak_data}")
        
        # Verify streak data structure
        assert "current_streak" in streak_data, "Missing current_streak in response"
        assert "longest_streak" in streak_data, "Missing longest_streak in response"
        
        # After login, streak should be at least 1
        assert streak_data["current_streak"] >= 1, f"Expected streak >= 1, got {streak_data['current_streak']}"
        print(f"   Current streak: {streak_data['current_streak']} days")
        print(f"   Longest streak: {streak_data['longest_streak']} days")
        
        return streak_data
    
    def test_login_increments_streak(self):
        """Test that logging in records a streak action"""
        # Login first time
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        user_id = login_response.json()["user"]["id"]
        token = login_response.json()["access_token"]
        
        # Check streak after login
        streak_response = requests.get(
            f"{BASE_URL}/api/engagement/streak/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert streak_response.status_code == 200
        streak_data = streak_response.json()
        
        # Streak should be at least 1 after login
        assert streak_data["current_streak"] >= 1, f"Streak should be >= 1 after login, got {streak_data['current_streak']}"
        print(f"✅ Login streak recording verified - current streak: {streak_data['current_streak']}")


class TestStreakAPI:
    """Test streak API endpoints"""
    
    def test_streak_config_endpoint(self):
        """Test GET /api/engagement/admin/streak-config returns config"""
        response = requests.get(f"{BASE_URL}/api/engagement/admin/streak-config")
        assert response.status_code == 200, f"Streak config endpoint failed: {response.text}"
        
        config = response.json()
        print(f"✅ Streak config endpoint returned: {config}")
        
        # Verify config structure
        assert "qualifying_actions" in config, "Missing qualifying_actions in config"
        assert "login" in config["qualifying_actions"], "'login' should be in qualifying_actions"
        print(f"   Qualifying actions: {config['qualifying_actions']}")
    
    def test_record_streak_action_endpoint(self):
        """Test POST /api/engagement/streak/{user_id}/action endpoint"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        user_id = login_response.json()["user"]["id"]
        token = login_response.json()["access_token"]
        
        # Record a streak action (action_type is a query parameter)
        record_response = requests.post(
            f"{BASE_URL}/api/engagement/streak/{user_id}/action?action_type=mira_chat",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should return 200 or 201
        assert record_response.status_code in [200, 201], f"Record streak failed: {record_response.text}"
        print(f"✅ Record streak action endpoint works: {record_response.json()}")


class TestTravelPageAPI:
    """Test Travel page related APIs"""
    
    def test_travel_products_endpoint(self):
        """Test GET /api/travel/products returns products"""
        response = requests.get(f"{BASE_URL}/api/travel/products")
        assert response.status_code == 200, f"Travel products endpoint failed: {response.text}"
        
        data = response.json()
        assert "products" in data, "Missing products in response"
        print(f"✅ Travel products endpoint returned {len(data.get('products', []))} products")
    
    def test_travel_bundles_endpoint(self):
        """Test GET /api/travel/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/travel/bundles")
        assert response.status_code == 200, f"Travel bundles endpoint failed: {response.text}"
        
        data = response.json()
        assert "bundles" in data, "Missing bundles in response"
        print(f"✅ Travel bundles endpoint returned {len(data.get('bundles', []))} bundles")
    
    def test_user_pets_endpoint(self):
        """Test GET /api/pets/my-pets returns user's pets"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get user's pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pets_response.status_code == 200, f"My pets endpoint failed: {pets_response.text}"
        
        data = pets_response.json()
        assert "pets" in data, "Missing pets in response"
        print(f"✅ User pets endpoint returned {len(data.get('pets', []))} pets")
        
        if data.get('pets'):
            for pet in data['pets'][:3]:
                print(f"   - {pet.get('name')} ({pet.get('breed', 'Unknown breed')})")


class TestTravelRequestAPI:
    """Test Travel request creation API"""
    
    def test_create_travel_request(self):
        """Test POST /api/travel/request creates a travel request"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        user = login_response.json()["user"]
        
        # Create travel request
        travel_request = {
            "travel_type": "cab",
            "pets": [{"id": "test", "name": "Test Pet", "breed": "Labrador"}],
            "pet_count": 1,
            "is_multi_pet": False,
            "pickup_location": "Mumbai",
            "pickup_city": "Mumbai",
            "drop_location": "Pune",
            "drop_city": "Pune",
            "travel_date": "2026-02-15",
            "travel_time": "10:00",
            "special_requirements": "Test request from iteration 148",
            "user_email": user["email"],
            "user_name": user.get("name", "Test User")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/travel/request",
            json=travel_request,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should return 200 or 201
        assert response.status_code in [200, 201], f"Travel request failed: {response.text}"
        
        data = response.json()
        print(f"✅ Travel request created successfully")
        print(f"   Request ID: {data.get('request_id') or data.get('ticket_id')}")
        
        # Verify unified flow IDs
        assert data.get('request_id') or data.get('ticket_id'), "Missing request_id or ticket_id"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
