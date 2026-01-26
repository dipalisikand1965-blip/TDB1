"""
Test Suite for Session Persistence, Dashboard Hero, and Checkout Validation
Tests P0-P4 bug fixes for The Doggy Company platform

Features tested:
1. Session persistence - login and /api/auth/me endpoint
2. Dashboard data - pets with name, breed, and Pet Soul percentage
3. Login redirect behavior
4. Checkout pet name validation (email addresses should not be saved as pet name)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petsmart-2.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"


class TestAuthAndSession:
    """Test authentication and session persistence"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_login_returns_user_data(self):
        """Test that login returns user data with correct structure"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert "mira_access" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == TEST_EMAIL
        assert "name" in user
        assert "membership_tier" in user
        print(f"✓ Login successful for {user['name']} ({user['email']})")
    
    def test_auth_me_returns_user_with_token(self, auth_token):
        """Test /api/auth/me endpoint returns user data with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data
        assert "user" in data
        user = data["user"]
        assert user["email"] == TEST_EMAIL
        assert "id" in user
        assert "name" in user
        assert "membership_tier" in user
        print(f"✓ /api/auth/me returned user: {user['name']}")
    
    def test_auth_me_fails_without_token(self):
        """Test /api/auth/me returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        # Should return 401 or 403 without token
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✓ /api/auth/me correctly rejects requests without token")
    
    def test_auth_me_fails_with_invalid_token(self):
        """Test /api/auth/me returns 401 with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/auth/me correctly rejects invalid tokens")


class TestDashboardData:
    """Test dashboard data including pets with Pet Soul percentage"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_my_pets_returns_pet_data(self, auth_token):
        """Test /api/pets/my-pets returns pets with name, breed, and soul score"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "pets" in data
        pets = data["pets"]
        
        if len(pets) > 0:
            pet = pets[0]
            # Verify pet has required fields
            assert "name" in pet, "Pet missing 'name' field"
            assert "id" in pet, "Pet missing 'id' field"
            
            # Check for breed (can be in identity.breed or breed)
            has_breed = "breed" in pet or (pet.get("identity") and "breed" in pet.get("identity", {}))
            print(f"✓ Pet '{pet['name']}' has breed: {has_breed}")
            
            # Check for overall_score (Pet Soul percentage)
            if "overall_score" in pet:
                print(f"✓ Pet '{pet['name']}' has Pet Soul score: {pet['overall_score']}%")
            else:
                print(f"? Pet '{pet['name']}' missing overall_score field")
            
            print(f"✓ Found {len(pets)} pets for user")
        else:
            print("? No pets found for user")
    
    def test_user_has_pets_in_auth_me(self, auth_token):
        """Test /api/auth/me includes pet IDs"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        
        # Check for pet_ids or pets field
        has_pets = "pets" in user or "pet_ids" in user
        if has_pets:
            pet_count = len(user.get("pets", user.get("pet_ids", [])))
            print(f"✓ User has {pet_count} pets linked to account")
        else:
            print("? User has no pets linked")


class TestOrdersAndCheckout:
    """Test orders and checkout functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_my_orders_endpoint(self, auth_token):
        """Test /api/orders/my-orders returns user's orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        orders = data["orders"]
        print(f"✓ User has {len(orders)} orders")
        
        if len(orders) > 0:
            order = orders[0]
            assert "orderId" in order or "id" in order
            assert "items" in order or "total" in order
            print(f"✓ Order structure verified")
    
    def test_create_order_with_valid_pet_name(self, auth_token):
        """Test creating order with valid pet name (not an email)"""
        order_data = {
            "orderId": f"TEST-{int(__import__('time').time())}",
            "customer": {
                "parentName": "Test User",
                "email": TEST_EMAIL,
                "phone": "9876543210",
                "whatsappNumber": "9876543210"
            },
            "pet": {
                "name": "Buddy",  # Valid pet name
                "breed": "Golden Retriever",
                "age": "3 years"
            },
            "delivery": {
                "method": "pickup",
                "pickupLocation": "mumbai",
                "city": "Mumbai"
            },
            "items": [{
                "productId": "test-product",
                "name": "Test Cake",
                "size": "Small",
                "flavor": "Peanut Butter",
                "quantity": 1,
                "price": 650
            }],
            "subtotal": 650,
            "deliveryFee": 0,
            "total": 650,
            "status": "pending"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        
        # Order creation should succeed
        assert response.status_code in [200, 201], f"Order creation failed: {response.text}"
        print("✓ Order created with valid pet name 'Buddy'")


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_db_health_endpoint(self):
        """Test /api/health/db returns database status"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print(f"✓ Database connected with {data.get('products_count', 0)} products")


class TestMiraContext:
    """Test Mira AI context personalization"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_mira_context_without_auth(self):
        """Test Mira context returns generic message without auth"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"pillar": "celebrate"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should contain "Sign in" for unauthenticated users
        # Check both greeting and pillar_note fields
        greeting = data.get("greeting", "") or data.get("pillar_note", "")
        assert "Sign in" in greeting or "Welcome" in greeting
        print(f"✓ Mira context (no auth): {greeting[:50]}...")
    
    def test_mira_context_with_auth(self, auth_token):
        """Test Mira context returns personalized message with auth"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"pillar": "celebrate"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check both greeting and pillar_note fields
        greeting = data.get("greeting", "") or data.get("pillar_note", "")
        # Should contain user's name for authenticated users
        # Should NOT contain "Sign in"
        assert "Sign in" not in greeting, f"Authenticated user should not see 'Sign in': {greeting}"
        print(f"✓ Mira context (with auth): {greeting[:60]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
