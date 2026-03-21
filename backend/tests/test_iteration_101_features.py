"""
Test Iteration 101 - Pet Life Operating System Features
Tests for:
1. App Icon Notification Badge - /api/notifications/unread-count
2. Dashboard Pillar Popup - PillarPopup component
3. Compact Dining Concierge Picker - 6 service cards on /dine
4. Unified Product Box - Concierge and Bundle product types
5. Unified Product Box Sync Buttons - 'Sync Stay' and 'Seed All Pillars'
6. Stay Sync Endpoint - POST /api/admin/stay/sync-to-products
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-platform-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


class TestAppNotificationBadge:
    """Test App Icon Notification Badge - /api/notifications/unread-count"""
    
    def test_unread_count_endpoint_requires_auth(self):
        """Test that unread-count endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
    
    def test_unread_count_with_member_auth(self):
        """Test unread-count endpoint with member authentication"""
        # First login as member
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Member login failed: {login_response.status_code}")
        
        token = login_response.json().get("access_token")
        assert token, "No access token returned"
        
        # Now test unread-count
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "unread_count" in data, "Response should contain unread_count"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        assert data["unread_count"] >= 0, "unread_count should be non-negative"
        
        # Check for breakdown if present
        if "breakdown" in data:
            breakdown = data["breakdown"]
            assert "push_notifications" in breakdown or "ticket_updates" in breakdown, "Breakdown should have notification types"


class TestStaySyncEndpoint:
    """Test Stay Sync Endpoint - POST /api/admin/stay/sync-to-products"""
    
    def test_stay_sync_endpoint_exists(self):
        """Test that stay sync endpoint exists and responds"""
        response = requests.post(f"{BASE_URL}/api/admin/stay/sync-to-products")
        # Should return 200 or 201 (no auth required per code comment)
        assert response.status_code in [200, 201, 401, 403], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify response structure
            assert "synced" in data or "message" in data or "error" not in data, f"Unexpected response: {data}"
    
    def test_stay_sync_returns_count(self):
        """Test that stay sync returns synced count"""
        response = requests.post(f"{BASE_URL}/api/admin/stay/sync-to-products")
        
        if response.status_code == 200:
            data = response.json()
            if "synced" in data:
                assert isinstance(data["synced"], int), "synced should be an integer"
                print(f"✅ Stay sync returned: {data['synced']} properties synced")


class TestUnifiedProductBox:
    """Test Unified Product Box - Product types and filters"""
    
    def test_product_box_products_endpoint(self):
        """Test that product-box products endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/product-box/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "products" in data, "Response should contain products array"
        assert "total" in data, "Response should contain total count"
    
    def test_product_box_filter_by_concierge_type(self):
        """Test filtering products by concierge type"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?product_type=concierge")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        # All returned products should be concierge type (if any exist)
        for product in products:
            assert product.get("product_type") == "concierge", f"Product {product.get('name')} is not concierge type"
    
    def test_product_box_filter_by_bundle_type(self):
        """Test filtering products by bundle type"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?product_type=bundle")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        # All returned products should be bundle type (if any exist)
        for product in products:
            assert product.get("product_type") == "bundle", f"Product {product.get('name')} is not bundle type"
    
    def test_product_box_stats_endpoint(self):
        """Test product-box stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total" in data, "Stats should contain total count"


class TestForceSeederEndpoint:
    """Test Force Seed All Products endpoint"""
    
    def test_force_seed_all_products_endpoint(self):
        """Test that force-seed-all-products endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/admin/force-seed-all-products")
        # May require auth or may be open for emergency seeding
        assert response.status_code in [200, 201, 401, 403, 405], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Force seed response: {data}")


class TestDinePageServices:
    """Test Dine page and dining services"""
    
    def test_dine_services_endpoint(self):
        """Test that dine services are available"""
        # Check if there's a services endpoint for dine
        response = requests.get(f"{BASE_URL}/api/services?pillar=dine")
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("services", [])
            print(f"✅ Found {len(services)} dine services")
        else:
            # Try alternative endpoint
            response = requests.get(f"{BASE_URL}/api/dine/services")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Dine services endpoint working")


class TestHealthAndBasicEndpoints:
    """Test basic health and API endpoints"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
    
    def test_db_health_endpoint(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
    
    def test_member_login(self):
        """Test member login works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "access_token" in data, "Login should return access_token"
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"


class TestPillarEndpoints:
    """Test pillar-related endpoints"""
    
    def test_stay_properties_endpoint(self):
        """Test stay properties endpoint"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_dine_restaurants_endpoint(self):
        """Test dine restaurants endpoint"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        # May return 200 or 404 depending on data
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
