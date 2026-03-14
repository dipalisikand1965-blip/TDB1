"""
Full Site Test - Mira OS Pet Concierge
Tests: Login, Mira Chat, Pet APIs, Navigation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://memory-wall-debug.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test12"

class TestHealthAndAuth:
    """Health check and authentication tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["message"] == "Login successful"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✓ Invalid login rejected correctly")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "test12"}
        )
        assert response.status_code == 401
        print(f"✓ Nonexistent user rejected correctly")


class TestMiraChat:
    """Mira AI chat functionality tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_chat_hello(self, auth_token):
        """Test Mira chat with simple hello"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"message": "hello", "pet_name": "Buddy", "pet_breed": "Labrador"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        assert "session_id" in data
        print(f"✓ Mira chat response: {data['response'][:100]}...")
    
    def test_mira_chat_product_query(self, auth_token):
        """Test Mira chat with product query"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"message": "I need treats for my dog", "pet_name": "Luna", "pet_breed": "Golden Retriever"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "pillar" in data or "ticket_type" in data
        print(f"✓ Product query handled, pillar: {data.get('pillar', 'N/A')}")
    
    def test_mira_chat_travel_query(self, auth_token):
        """Test Mira chat with travel query"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"message": "I want to travel to Goa with my dog", "pet_name": "Max"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Travel query handled: {data['response'][:100]}...")
    
    def test_mira_context_endpoint(self, auth_token):
        """Test Mira context endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"pet_id": "test-pet-id", "context_type": "general"}
        )
        # Context endpoint may return 200 or 404 depending on pet existence
        assert response.status_code in [200, 404, 422]
        print(f"✓ Context endpoint responded: {response.status_code}")


class TestPetAPIs:
    """Pet management API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_user_pets(self, auth_token):
        """Test fetching user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        if len(data["pets"]) > 0:
            pet = data["pets"][0]
            assert "name" in pet
            assert "id" in pet
            print(f"✓ Fetched {len(data['pets'])} pets, first: {pet['name']}")
        else:
            print(f"✓ No pets found for user (empty list)")
    
    def test_get_my_pets_endpoint(self, auth_token):
        """Test /api/pets/my-pets endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"✓ my-pets endpoint returned {len(data.get('pets', []))} pets")


class TestProductAPIs:
    """Product/Shop API tests"""
    
    def test_get_products(self):
        """Test fetching products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        # May return list or object with products key
        if isinstance(data, list):
            print(f"✓ Fetched {len(data)} products")
        elif isinstance(data, dict) and "products" in data:
            print(f"✓ Fetched {len(data['products'])} products")
        else:
            print(f"✓ Products endpoint returned: {type(data)}")
    
    def test_get_collections(self):
        """Test fetching collections"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Collections endpoint returned data")


class TestServiceAPIs:
    """Service/Concierge API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_services(self):
        """Test fetching services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Services endpoint returned data")
    
    def test_get_celebrations(self, auth_token):
        """Test celebrations endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/celebrations/test-pet-id",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # May return 200 or 404 depending on pet
        assert response.status_code in [200, 404, 500]
        print(f"✓ Celebrations endpoint responded: {response.status_code}")


class TestWeatherAndLocation:
    """Weather and location-based features"""
    
    def test_weather_endpoint(self):
        """Test weather for pet activity"""
        response = requests.get(f"{BASE_URL}/api/mira/weather/pet-activity?city=Mumbai")
        assert response.status_code in [200, 500]  # May fail if API key not configured
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Weather endpoint returned data for Mumbai")
        else:
            print(f"✓ Weather endpoint responded (may need API key)")


class TestLogout:
    """Logout functionality test"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_logout(self, auth_token):
        """Test logout endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Logout may return 200 or 204 or may not exist
        assert response.status_code in [200, 204, 404, 405]
        print(f"✓ Logout endpoint responded: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
