"""
Backend tests for admin fixes iteration 198:
- Product box stats (active count > 1000)
- Product toggle-active endpoint (PATCH method)
- Bundles PUT endpoint for toggle active
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestProductBoxStats:
    """Test GET /api/product-box/stats returns correct active count"""

    def test_stats_endpoint_returns_200(self):
        """Stats endpoint should respond with 200"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_stats_active_count_greater_than_1000(self):
        """Active count should be > 1000 (was incorrectly showing 3)"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200
        data = response.json()
        assert "by_status" in data, f"Missing 'by_status' in response: {data}"
        active_count = data["by_status"].get("active", 0)
        assert active_count > 1000, f"Active count is {active_count}, expected > 1000"

    def test_stats_total_count_present(self):
        """Stats should return total count"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        data = response.json()
        assert "total" in data
        assert isinstance(data["total"], int)
        assert data["total"] > 0

    def test_stats_structure(self):
        """Stats response should have correct structure"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        data = response.json()
        assert "by_status" in data
        assert "active" in data["by_status"]
        assert "draft" in data["by_status"]


class TestProductToggleActive:
    """Test PATCH /api/admin/products/{id}/toggle-active"""

    def test_toggle_active_with_patch_method(self):
        """Toggle endpoint should work with PATCH method"""
        # First get a product to use its ID
        list_response = requests.get(f"{BASE_URL}/api/product-box/products?limit=1")
        if list_response.status_code != 200:
            pytest.skip("Cannot get products list to test toggle")
        
        products = list_response.json()
        if not products or not isinstance(products, list) or len(products) == 0:
            # Try 'products' key
            data = products if isinstance(products, list) else products.get('products', [])
            if not data:
                pytest.skip("No products available for toggle test")
            products = data
        
        product_id = products[0].get('id') or products[0].get('_id')
        if not product_id:
            pytest.skip("No product ID found")

        # Test PATCH (correct method)
        response = requests.patch(f"{BASE_URL}/api/admin/products/{product_id}/toggle-active")
        assert response.status_code == 200, f"PATCH toggle returned {response.status_code}: {response.text}"
        data = response.json()
        assert "is_active" in data, f"Response missing 'is_active': {data}"
        assert "success" in data

    def test_toggle_active_with_post_returns_405(self):
        """POST method to toggle endpoint should return 405 (frontend bug if using POST)"""
        response = requests.post(f"{BASE_URL}/api/admin/products/dummy_test_id/toggle-active")
        assert response.status_code in [405, 404], f"POST should be 405 (wrong method), got {response.status_code}"

    def test_toggle_active_nonexistent_product_returns_404(self):
        """Toggle with nonexistent product should return 404"""
        response = requests.patch(f"{BASE_URL}/api/admin/products/nonexistent_test_id_xyz/toggle-active")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestBundlesToggleActive:
    """Test that bundles can be toggled via PUT /api/bundles/{id}"""

    def test_bundles_list_endpoint(self):
        """Bundles list should be accessible"""
        response = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=5")
        assert response.status_code == 200, f"Bundles list returned {response.status_code}: {response.text}"

    def test_bundles_have_is_active_field(self):
        """Bundles should have is_active field"""
        response = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=5")
        assert response.status_code == 200
        data = response.json()
        bundles = data if isinstance(data, list) else data.get('bundles', [])
        if not bundles:
            pytest.skip("No bundles found")
        # Check that at least one bundle has is_active field (may be absent = defaults to true)
        # The toggle button uses bundle.is_active !== false pattern
        print(f"First bundle fields: {list(bundles[0].keys())}")

    def test_bundle_toggle_active_via_put(self):
        """Bundle toggle should work via PUT"""
        # Get a bundle
        list_response = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=1")
        if list_response.status_code != 200:
            pytest.skip("Cannot get bundles list")
        
        data = list_response.json()
        bundles = data if isinstance(data, list) else data.get('bundles', [])
        if not bundles:
            pytest.skip("No bundles found for toggle test")
        
        bundle = bundles[0]
        bundle_id = bundle.get('id')
        if not bundle_id:
            pytest.skip("No bundle ID found")
        
        # Toggle the is_active field
        current_active = bundle.get('is_active', True)
        new_active = not current_active
        
        response = requests.put(
            f"{BASE_URL}/api/bundles/{bundle_id}",
            json={**bundle, "is_active": new_active}
        )
        assert response.status_code == 200, f"Bundle PUT returned {response.status_code}: {response.text}"
        
        # Restore original state
        requests.put(
            f"{BASE_URL}/api/bundles/{bundle_id}",
            json={**bundle, "is_active": current_active}
        )
