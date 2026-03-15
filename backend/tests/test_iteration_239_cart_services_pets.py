"""
Test Suite for Iteration 239 - Cart API, Service Whispers, Auth, Pet Personalization
Tests the P0 fixes:
1. Cart API endpoints (GET/POST/DELETE)
2. Service whispers (mira_whisper field)
3. User authentication (login returns token)
4. Pet personalization (/api/pets/my-pets with auth)
5. Service detail page (/api/service-box/services/{id})
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://doggy-production-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "testuser@test.com"
TEST_USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ API health check passed: {response.json()}")


class TestAuthentication:
    """Test user authentication endpoints"""
    
    def test_login_success(self):
        """Test login with valid credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response missing access_token"
        assert "user" in data, "Response missing user object"
        assert data["user"]["email"] == TEST_USER_EMAIL, "User email mismatch"
        assert len(data["access_token"]) > 0, "Token is empty"
        
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
        print(f"  - Token type: {data.get('token_type', 'N/A')}")
        print(f"  - User name: {data['user'].get('name', 'N/A')}")
        print(f"  - Membership tier: {data['user'].get('membership_tier', 'N/A')}")
        
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid login correctly rejected with 401")
    
    def test_get_current_user(self):
        """Test /api/auth/me returns user info when authenticated"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get user failed: {response.status_code}"
        
        data = response.json()
        assert "user" in data, "Response missing user object"
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ Get current user successful: {data['user'].get('name', TEST_USER_EMAIL)}")


class TestPetPersonalization:
    """Test pet personalization - /api/pets/my-pets endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_my_pets_without_auth(self):
        """Test /api/pets/my-pets without auth returns empty or 401"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets")
        # Should either return 401 or empty list
        assert response.status_code in [200, 401], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Without auth, should return empty pets
            pets = data.get("pets", [])
            print(f"✓ Without auth, /api/pets/my-pets returns {len(pets)} pets")
        else:
            print("✓ Without auth, /api/pets/my-pets returns 401 (expected)")
    
    def test_my_pets_with_auth(self, auth_token):
        """Test /api/pets/my-pets with auth returns user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get pets failed: {response.status_code} - {response.text}"
        
        data = response.json()
        pets = data.get("pets", [])
        
        print(f"✓ With auth, /api/pets/my-pets returns {len(pets)} pets")
        
        if len(pets) > 0:
            pet = pets[0]
            print(f"  - First pet: {pet.get('name', 'N/A')} ({pet.get('breed', 'N/A')})")
            # Verify pet has expected fields
            assert "name" in pet or "id" in pet, "Pet missing basic fields"
        
        return pets


class TestCartAPI:
    """Test Cart API endpoints - GET/POST/DELETE"""
    
    def test_get_cart_without_session(self):
        """Test GET /api/cart without session_id returns empty cart"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200, f"Get cart failed: {response.status_code}"
        
        data = response.json()
        assert "cart" in data, "Response missing cart object"
        cart = data["cart"]
        assert "items" in cart, "Cart missing items array"
        
        print(f"✓ GET /api/cart without session returns: {data.get('message', 'cart object')}")
    
    def test_get_cart_with_session(self):
        """Test GET /api/cart with session_id"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        response = requests.get(f"{BASE_URL}/api/cart?session_id={session_id}")
        assert response.status_code == 200, f"Get cart failed: {response.status_code}"
        
        data = response.json()
        assert "cart" in data
        print(f"✓ GET /api/cart with session_id returns cart: {len(data['cart'].get('items', []))} items")
    
    def test_add_to_cart(self):
        """Test POST /api/cart/add adds item to cart"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        item = {
            "id": "test-product-001",
            "name": "Test Dog Treat",
            "price": 299,
            "quantity": 1,
            "variant": "small"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/add?session_id={session_id}",
            json=item
        )
        assert response.status_code == 200, f"Add to cart failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "message" in data, "Response missing message"
        assert data.get("items_count", 0) >= 1, "Items count should be at least 1"
        
        print(f"✓ POST /api/cart/add successful: {data.get('message')}")
        print(f"  - Items count: {data.get('items_count')}")
        print(f"  - Subtotal: {data.get('subtotal')}")
        
        return session_id
    
    def test_add_multiple_items_to_cart(self):
        """Test adding multiple items to cart"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        # Add first item
        item1 = {"id": "product-1", "name": "Dog Food", "price": 499, "quantity": 2}
        response1 = requests.post(f"{BASE_URL}/api/cart/add?session_id={session_id}", json=item1)
        assert response1.status_code == 200
        
        # Add second item
        item2 = {"id": "product-2", "name": "Dog Toy", "price": 199, "quantity": 1}
        response2 = requests.post(f"{BASE_URL}/api/cart/add?session_id={session_id}", json=item2)
        assert response2.status_code == 200
        
        data = response2.json()
        assert data.get("items_count") == 2, f"Expected 2 items, got {data.get('items_count')}"
        
        # Verify subtotal calculation
        expected_subtotal = (499 * 2) + (199 * 1)
        assert data.get("subtotal") == expected_subtotal, f"Subtotal mismatch: expected {expected_subtotal}, got {data.get('subtotal')}"
        
        print(f"✓ Multiple items added to cart: {data.get('items_count')} items, subtotal: ₹{data.get('subtotal')}")
        
        return session_id
    
    def test_remove_item_from_cart(self):
        """Test DELETE /api/cart/item removes item from cart"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        # First add an item
        item = {"id": "product-to-remove", "name": "Test Item", "price": 100, "quantity": 1}
        add_response = requests.post(f"{BASE_URL}/api/cart/add?session_id={session_id}", json=item)
        assert add_response.status_code == 200
        
        # Now remove it
        response = requests.delete(
            f"{BASE_URL}/api/cart/item?session_id={session_id}&item_id=product-to-remove"
        )
        assert response.status_code == 200, f"Remove item failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("items_count") == 0, f"Expected 0 items after removal, got {data.get('items_count')}"
        
        print(f"✓ DELETE /api/cart/item successful: {data.get('message')}")
    
    def test_clear_cart(self):
        """Test DELETE /api/cart clears all items"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        # Add items first
        item = {"id": "product-1", "name": "Test Item", "price": 100, "quantity": 1}
        requests.post(f"{BASE_URL}/api/cart/add?session_id={session_id}", json=item)
        
        # Clear cart
        response = requests.delete(f"{BASE_URL}/api/cart?session_id={session_id}")
        assert response.status_code == 200, f"Clear cart failed: {response.status_code}"
        
        data = response.json()
        assert data.get("items_count") == 0, "Cart should be empty after clear"
        assert data.get("subtotal") == 0, "Subtotal should be 0 after clear"
        
        print(f"✓ DELETE /api/cart successful: {data.get('message')}")
    
    def test_cart_not_found_on_remove(self):
        """Test removing item from non-existent cart returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/cart/item?session_id=non-existent-session&item_id=some-item"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Remove from non-existent cart correctly returns 404")


class TestServiceWhispers:
    """Test service endpoints return mira_whisper field"""
    
    def test_list_services_has_whispers(self):
        """Test GET /api/service-box/services returns services with mira_whisper"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=10")
        assert response.status_code == 200, f"Get services failed: {response.status_code}"
        
        data = response.json()
        assert "services" in data, "Response missing services array"
        
        services = data["services"]
        assert len(services) > 0, "No services returned"
        
        # Check if services have mira_whisper field
        services_with_whisper = 0
        services_without_whisper = 0
        
        for service in services[:10]:
            if service.get("mira_whisper"):
                services_with_whisper += 1
            else:
                services_without_whisper += 1
        
        print(f"✓ GET /api/service-box/services returns {len(services)} services")
        print(f"  - With mira_whisper: {services_with_whisper}")
        print(f"  - Without mira_whisper: {services_without_whisper}")
        
        # At least some services should have whispers after the update
        assert services_with_whisper > 0, "No services have mira_whisper field - whispers update may not have run"
        
        # Show sample whisper
        for service in services:
            if service.get("mira_whisper"):
                print(f"  - Sample whisper: '{service['mira_whisper'][:50]}...' for {service.get('name', 'N/A')}")
                break
    
    def test_service_detail_has_whisper(self):
        """Test GET /api/service-box/services/{id} returns service with mira_whisper"""
        # First get a service ID
        list_response = requests.get(f"{BASE_URL}/api/service-box/services?limit=1")
        assert list_response.status_code == 200
        
        services = list_response.json().get("services", [])
        if not services:
            pytest.skip("No services available to test")
        
        service_id = services[0].get("id")
        
        # Get service detail
        response = requests.get(f"{BASE_URL}/api/service-box/services/{service_id}")
        assert response.status_code == 200, f"Get service detail failed: {response.status_code}"
        
        service = response.json()
        assert "id" in service, "Service missing id"
        assert "name" in service, "Service missing name"
        
        print(f"✓ GET /api/service-box/services/{service_id} returns service detail")
        print(f"  - Name: {service.get('name')}")
        print(f"  - Pillar: {service.get('pillar')}")
        print(f"  - Mira whisper: {service.get('mira_whisper', 'N/A')[:50] if service.get('mira_whisper') else 'N/A'}")
        
        return service
    
    def test_service_detail_not_found(self):
        """Test GET /api/service-box/services/{id} returns 404 for non-existent service"""
        response = requests.get(f"{BASE_URL}/api/service-box/services/non-existent-service-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent service correctly returns 404")
    
    def test_services_filter_by_pillar(self):
        """Test filtering services by pillar"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=care&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        # All returned services should be in 'care' pillar
        for service in services:
            assert service.get("pillar") == "care", f"Service {service.get('id')} has wrong pillar: {service.get('pillar')}"
        
        print(f"✓ Filter by pillar=care returns {len(services)} services")


class TestServiceStats:
    """Test service statistics endpoint"""
    
    def test_service_stats(self):
        """Test GET /api/service-box/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        assert response.status_code == 200, f"Get stats failed: {response.status_code}"
        
        data = response.json()
        assert "total" in data, "Stats missing total count"
        
        print(f"✓ GET /api/service-box/stats returns:")
        print(f"  - Total services: {data.get('total')}")
        print(f"  - Active: {data.get('active')}")
        print(f"  - Bookable: {data.get('bookable')}")
        print(f"  - Free: {data.get('free')}")


class TestIntegrationFlow:
    """Test complete integration flow - login, get pets, use cart"""
    
    def test_authenticated_cart_flow(self):
        """Test cart operations with authenticated user"""
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        user_id = login_response.json()["user"]["id"]
        
        session_id = f"auth-session-{uuid.uuid4().hex[:8]}"
        
        # Add item to cart with user_id
        item = {"id": "auth-product", "name": "Premium Dog Food", "price": 599, "quantity": 1}
        add_response = requests.post(
            f"{BASE_URL}/api/cart/add?session_id={session_id}&user_id={user_id}",
            json=item
        )
        assert add_response.status_code == 200
        
        # Get cart with user_id
        get_response = requests.get(
            f"{BASE_URL}/api/cart?session_id={session_id}&user_id={user_id}"
        )
        assert get_response.status_code == 200
        
        cart = get_response.json().get("cart", {})
        print(f"✓ Authenticated cart flow successful")
        print(f"  - User: {TEST_USER_EMAIL}")
        print(f"  - Cart items: {len(cart.get('items', []))}")
        print(f"  - Subtotal: ₹{cart.get('subtotal', 0)}")
        
        # Cleanup - clear cart
        requests.delete(f"{BASE_URL}/api/cart?session_id={session_id}&user_id={user_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
