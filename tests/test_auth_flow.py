"""
Test suite for Customer Authentication Flow
Tests: Registration, Login, Auth Persistence (/api/auth/me), Protected Routes
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://unified-signal-1.preview.emergentagent.com').rstrip('/')

# Test user credentials - unique per test run
TEST_EMAIL = f"test_auth_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User Auth"
TEST_PHONE = "9876543210"

# Existing test user from development
EXISTING_TEST_EMAIL = "e1testuser50663@example.com"
EXISTING_TEST_PASSWORD = "testpass123"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")
    
    def test_db_health(self):
        """Test database connectivity"""
        response = requests.get(f"{BASE_URL}/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ DB health check passed: {data}")


class TestCustomerRegistration:
    """Customer Registration flow tests"""
    
    def test_register_new_user(self):
        """Test registering a new user with name/email/phone/password"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "phone": TEST_PHONE
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        # Should succeed with 200
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert "user_id" in data
        assert data["message"] == "Registration successful"
        print(f"✓ User registration successful: {data}")
        
        return data["user_id"]
    
    def test_register_duplicate_email(self):
        """Test that duplicate email registration fails"""
        # First register
        payload = {
            "email": f"dup_test_{uuid.uuid4().hex[:8]}@example.com",
            "password": TEST_PASSWORD,
            "name": "Duplicate Test",
            "phone": "1234567890"
        }
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Try to register again with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response2.status_code == 400
        data = response2.json()
        assert "already registered" in data.get("detail", "").lower()
        print(f"✓ Duplicate email correctly rejected: {data}")


class TestCustomerLogin:
    """Customer Login flow tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_user(self):
        """Ensure test user exists before login tests"""
        # Try to register, ignore if already exists
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "phone": TEST_PHONE
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    
    def test_login_success(self):
        """Test login with valid credentials"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"].get("name") == TEST_NAME
        assert "membership_tier" in data["user"]
        
        # Token should be a non-empty string
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        print(f"✓ Login successful, token received: {data['access_token'][:20]}...")
        return data["access_token"]
    
    def test_login_invalid_email(self):
        """Test login with non-existent email"""
        payload = {
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✓ Invalid email correctly rejected: {data}")
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        payload = {
            "email": TEST_EMAIL,
            "password": "wrongpassword123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✓ Wrong password correctly rejected: {data}")


class TestAuthPersistence:
    """Auth Persistence tests - /api/auth/me endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get a valid auth token"""
        # Ensure user exists
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "phone": TEST_PHONE
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        return login_response.json()["access_token"]
    
    def test_auth_me_with_valid_token(self, auth_token):
        """Test /api/auth/me returns user data with valid Bearer token"""
        headers = {
            "Authorization": f"Bearer {auth_token}"
        }
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Missing user in response"
        user = data["user"]
        
        assert user["email"] == TEST_EMAIL
        assert user.get("name") == TEST_NAME
        assert "membership_tier" in user
        
        # Password hash should NOT be in response
        assert "password_hash" not in user, "Password hash should not be exposed"
        
        # Should have mira_access info
        assert "mira_access" in data
        
        print(f"✓ Auth/me returned user data: {user['email']}, tier: {user.get('membership_tier')}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me fails without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401
        print(f"✓ Auth/me correctly rejected without token")
    
    def test_auth_me_with_invalid_token(self):
        """Test /api/auth/me fails with invalid token"""
        headers = {
            "Authorization": "Bearer invalid_token_12345"
        }
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 401
        print(f"✓ Auth/me correctly rejected invalid token")


class TestExistingTestUser:
    """Test with the existing test user from development"""
    
    def test_login_existing_user(self):
        """Test login with existing test user"""
        payload = {
            "email": EXISTING_TEST_EMAIL,
            "password": EXISTING_TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        # This user may or may not exist
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert data["user"]["email"] == EXISTING_TEST_EMAIL
            print(f"✓ Existing test user login successful")
            return data["access_token"]
        else:
            print(f"⚠ Existing test user not found (may need to be created)")
            pytest.skip("Existing test user not found")


class TestProductEndpoints:
    """Test product listing endpoints"""
    
    def test_get_products(self):
        """Test product listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        
        # Should have products from Shopify sync
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            print(f"✓ Products endpoint returned {len(data['products'])} products")
        else:
            print("⚠ No products found in database")
    
    def test_get_products_by_category(self):
        """Test product filtering by category"""
        response = requests.get(f"{BASE_URL}/api/products?category=cakes")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        print(f"✓ Category filter returned {len(data['products'])} cakes")


class TestProtectedRoutes:
    """Test protected route behavior"""
    
    @pytest.fixture
    def auth_token(self):
        """Get a valid auth token"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "phone": TEST_PHONE
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        return None
    
    def test_my_orders_without_auth(self):
        """Test /api/orders/my-orders requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders/my-orders")
        
        # Should require auth
        assert response.status_code == 401
        print(f"✓ My orders correctly requires authentication")
    
    def test_my_orders_with_auth(self, auth_token):
        """Test /api/orders/my-orders with valid token"""
        if not auth_token:
            pytest.skip("Could not get auth token")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/my-orders", headers=headers)
        
        # Should succeed (even if empty)
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ My orders returned {len(data['orders'])} orders")
    
    def test_my_pets_without_auth(self):
        """Test /api/pets/my-pets requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets")
        
        # Should require auth
        assert response.status_code == 401
        print(f"✓ My pets correctly requires authentication")
    
    def test_my_pets_with_auth(self, auth_token):
        """Test /api/pets/my-pets with valid token"""
        if not auth_token:
            pytest.skip("Could not get auth token")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        
        # Should succeed (even if empty)
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"✓ My pets returned {len(data['pets'])} pets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
