"""
Test suite for Enhanced Autoship System feature
Tests:
1. Autoship settings API endpoints
2. Default discount tiers (10%/15%/30%)
3. Product-specific overrides
"""

import pytest
import requests
import os
from base64 import b64encode

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"

def get_auth_headers():
    """Get Basic Auth headers for admin endpoints"""
    credentials = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
    encoded = b64encode(credentials.encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json"
    }

class TestAutoshipSettings:
    """Test autoship settings API endpoints"""
    
    def test_get_autoship_settings(self):
        """Test GET /api/admin/pricing/autoship/settings returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pricing/autoship/settings",
            headers=get_auth_headers()
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "default_tiers" in data, "Response should contain default_tiers"
        assert "product_overrides" in data, "Response should contain product_overrides"
        assert "stats" in data, "Response should contain stats"
        
        # Verify default tiers structure
        tiers = data["default_tiers"]
        assert len(tiers) == 3, f"Expected 3 default tiers, got {len(tiers)}"
        
        # Verify tier names
        tier_names = [t["tier_name"] for t in tiers]
        assert "first" in tier_names, "Should have 'first' tier"
        assert "second_to_fourth" in tier_names, "Should have 'second_to_fourth' tier"
        assert "fifth_plus" in tier_names, "Should have 'fifth_plus' tier"
        
        print(f"✓ Autoship settings returned successfully with {len(tiers)} tiers")
        print(f"  Tiers: {tier_names}")
        print(f"  Stats: {data['stats']}")
    
    def test_default_discount_tiers_values(self):
        """Test that default discount tiers have correct values (10%/15%/30%)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pricing/autoship/settings",
            headers=get_auth_headers()
        )
        
        assert response.status_code == 200
        data = response.json()
        tiers = data["default_tiers"]
        
        # Create a dict for easy lookup
        tier_dict = {t["tier_name"]: t for t in tiers}
        
        # Verify 1st order = 10%
        first_tier = tier_dict.get("first")
        assert first_tier is not None, "First tier should exist"
        assert first_tier["discount_percent"] == 10, f"1st order should be 10%, got {first_tier['discount_percent']}%"
        assert first_tier["min_order"] == 1, "First tier min_order should be 1"
        assert first_tier["max_order"] == 1, "First tier max_order should be 1"
        
        # Verify 2nd-4th orders = 15%
        second_tier = tier_dict.get("second_to_fourth")
        assert second_tier is not None, "Second tier should exist"
        assert second_tier["discount_percent"] == 15, f"2nd-4th orders should be 15%, got {second_tier['discount_percent']}%"
        assert second_tier["min_order"] == 2, "Second tier min_order should be 2"
        assert second_tier["max_order"] == 4, "Second tier max_order should be 4"
        
        # Verify 5th+ orders = 30%
        fifth_tier = tier_dict.get("fifth_plus")
        assert fifth_tier is not None, "Fifth tier should exist"
        assert fifth_tier["discount_percent"] == 30, f"5th+ orders should be 30%, got {fifth_tier['discount_percent']}%"
        assert fifth_tier["min_order"] == 5, "Fifth tier min_order should be 5"
        
        print("✓ Default discount tiers verified:")
        print(f"  1st Order: {first_tier['discount_percent']}% off")
        print(f"  2nd-4th Orders: {second_tier['discount_percent']}% off")
        print(f"  5th+ Orders: {fifth_tier['discount_percent']}% off")


class TestAutoshipProducts:
    """Test autoship products API endpoint"""
    
    def test_get_products_for_autoship(self):
        """Test GET /api/admin/pricing/autoship/products returns products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pricing/autoship/products",
            headers=get_auth_headers()
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain products"
        
        products = data["products"]
        print(f"✓ Autoship products endpoint returned {len(products)} products")
        
        # Check product structure if products exist
        if len(products) > 0:
            sample = products[0]
            assert "id" in sample, "Product should have id"
            assert "name" in sample, "Product should have name"
            print(f"  Sample product: {sample.get('name', 'N/A')}")


class TestAutoshipTiersUpdate:
    """Test updating autoship tiers"""
    
    def test_update_autoship_tiers(self):
        """Test PUT /api/admin/pricing/autoship/tiers updates tiers"""
        # First get current tiers
        get_response = requests.get(
            f"{BASE_URL}/api/admin/pricing/autoship/settings",
            headers=get_auth_headers()
        )
        assert get_response.status_code == 200
        original_tiers = get_response.json()["default_tiers"]
        
        # Update tiers with same values (to not break anything)
        update_payload = [
            {"tier_name": "first", "min_order": 1, "max_order": 1, "discount_percent": 10},
            {"tier_name": "second_to_fourth", "min_order": 2, "max_order": 4, "discount_percent": 15},
            {"tier_name": "fifth_plus", "min_order": 5, "max_order": None, "discount_percent": 30}
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/pricing/autoship/tiers",
            headers=get_auth_headers(),
            json=update_payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Update should return success=True"
        
        print("✓ Autoship tiers update endpoint working")


class TestPricingHubStats:
    """Test pricing hub stats endpoint"""
    
    def test_get_pricing_stats(self):
        """Test GET /api/admin/pricing/stats returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pricing/stats",
            headers=get_auth_headers()
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify stats structure
        assert "total_products" in data, "Should have total_products"
        assert "priced_products" in data, "Should have priced_products"
        assert "avg_margin" in data, "Should have avg_margin"
        assert "avg_gst" in data, "Should have avg_gst"
        assert "shipping_rules" in data, "Should have shipping_rules"
        
        print(f"✓ Pricing stats returned:")
        print(f"  Total Products: {data['total_products']}")
        print(f"  Priced Products: {data['priced_products']}")
        print(f"  Avg Margin: {data['avg_margin']}%")
        print(f"  Avg GST: {data['avg_gst']}%")


class TestAdminLogin:
    """Test admin login endpoint"""
    
    def test_admin_login_success(self):
        """Test POST /api/admin/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Admin login successful with valid credentials")
    
    def test_admin_login_invalid(self):
        """Test POST /api/admin/login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login correctly rejects invalid credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
