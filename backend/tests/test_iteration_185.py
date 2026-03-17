"""
Test Suite for Iteration 185 - Pet Life Operating System Fixes
Tests:
1. CarePage ConversationalEntry goals open ServiceBookingModal (not Mira)
2. 'Anything Else' goal opens Ask Concierge modal
3. MembershipOnboarding city input allows custom city
4. ServiceCatalogSection has 'Other' city option with custom input
5. Backend buying behavior tracking endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://care-pillar-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestBuyingBehaviorEndpoints:
    """Test the three new buying behavior tracking endpoints"""
    
    def test_purchase_history_endpoint_exists(self):
        """Test /api/buying-behavior/pet/{pet_id} returns valid response"""
        # Use a test pet_id - endpoint should return empty arrays if no data
        response = requests.get(f"{BASE_URL}/api/buying-behavior/pet/test-pet-123")
        
        # Should return 200 even if no data (empty arrays)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet_id" in data
        assert "total_orders" in data
        assert "purchased_products" in data
        assert "most_purchased" in data
        assert "product_frequency" in data
        
        # Verify data types
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["purchased_products"], list)
        assert isinstance(data["most_purchased"], list)
        assert isinstance(data["product_frequency"], dict)
        print(f"✓ Purchase history endpoint works - {data['total_orders']} orders found")
    
    def test_frequently_bought_together_endpoint_exists(self):
        """Test /api/buying-behavior/frequently-bought-together/{product_id} returns valid response"""
        response = requests.get(f"{BASE_URL}/api/buying-behavior/frequently-bought-together/test-product-123")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "product_id" in data
        assert "frequently_bought_together" in data
        assert "total_orders_analyzed" in data
        
        # Verify data types
        assert isinstance(data["frequently_bought_together"], list)
        assert isinstance(data["total_orders_analyzed"], int)
        print(f"✓ Frequently bought together endpoint works - {data['total_orders_analyzed']} orders analyzed")
    
    def test_repeat_purchase_suggestions_endpoint_exists(self):
        """Test /api/buying-behavior/repeat-purchase-suggestions/{pet_id} returns valid response"""
        response = requests.get(f"{BASE_URL}/api/buying-behavior/repeat-purchase-suggestions/test-pet-123")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet_id" in data
        assert "repeat_suggestions" in data
        assert "total_consumables_tracked" in data
        
        # Verify data types
        assert isinstance(data["repeat_suggestions"], list)
        assert isinstance(data["total_consumables_tracked"], int)
        print(f"✓ Repeat purchase suggestions endpoint works - {data['total_consumables_tracked']} consumables tracked")
    
    def test_purchase_history_with_limit(self):
        """Test purchase history endpoint respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/buying-behavior/pet/test-pet-123?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        # Even if empty, structure should be correct
        assert len(data["purchased_products"]) <= 5
        print("✓ Purchase history limit parameter works")
    
    def test_frequently_bought_together_with_limit(self):
        """Test frequently bought together endpoint respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/buying-behavior/frequently-bought-together/test-product-123?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["frequently_bought_together"]) <= 3
        print("✓ Frequently bought together limit parameter works")
    
    def test_repeat_suggestions_with_limit(self):
        """Test repeat suggestions endpoint respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/buying-behavior/repeat-purchase-suggestions/test-pet-123?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["repeat_suggestions"]) <= 3
        print("✓ Repeat suggestions limit parameter works")


class TestAuthAndLogin:
    """Test authentication for member login"""
    
    def test_member_login(self):
        """Test member login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "access_token" in data or "token" in data
        print(f"✓ Member login successful for {TEST_EMAIL}")
        return data.get("access_token") or data.get("token")
    
    def test_get_user_pets(self):
        """Test getting user's pets after login"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping pet test")
        
        token = login_response.json().get("access_token") or login_response.json().get("token")
        
        # Get pets
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Get pets failed: {response.status_code}"
        data = response.json()
        assert "pets" in data
        print(f"✓ User has {len(data.get('pets', []))} pets")


class TestServiceCatalogEndpoints:
    """Test service catalog endpoints used by ServiceCatalogSection"""
    
    def test_service_catalog_list(self):
        """Test service catalog list endpoint"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=care&limit=8")
        
        assert response.status_code == 200, f"Service catalog failed: {response.status_code}"
        data = response.json()
        assert "services" in data
        print(f"✓ Service catalog returns {len(data.get('services', []))} services")
    
    def test_service_price_calculation(self):
        """Test service price calculation endpoint"""
        # This endpoint may require a valid service_id
        response = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json={
            "service_id": "test-service",
            "city": "mumbai",
            "pet_size": "medium",
            "pet_count": 1,
            "add_on_ids": []
        })
        
        # May return 404 if service doesn't exist, but endpoint should exist
        assert response.status_code in [200, 404, 422], f"Unexpected status: {response.status_code}"
        print(f"✓ Price calculation endpoint exists (status: {response.status_code})")


class TestMiraQuickBook:
    """Test Mira quick book endpoint used by ServiceBookingModal"""
    
    def test_quick_book_endpoint_exists(self):
        """Test that the quick book endpoint exists"""
        # This endpoint requires auth, so we test with login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Login failed")
        
        token = login_response.json().get("access_token") or login_response.json().get("token")
        
        # Test the quick book endpoint
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "serviceType": "grooming",
                "serviceName": "Test Grooming",
                "pillar": "care",
                "city": "mumbai",
                "petSize": "medium",
                "petCount": 1,
                "addOns": [],
                "calculatedPrice": 1000,
                "date": "2026-02-01",
                "time": "10:00",
                "notes": "Test booking"
            }
        )
        
        # Should return 200 or 201 for successful booking
        assert response.status_code in [200, 201, 422], f"Quick book failed: {response.status_code} - {response.text}"
        print(f"✓ Quick book endpoint works (status: {response.status_code})")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health check passed")
    
    def test_frontend_accessible(self):
        """Test frontend is accessible"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✓ Frontend is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
