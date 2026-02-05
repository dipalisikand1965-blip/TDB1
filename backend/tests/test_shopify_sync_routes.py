"""
Test Shopify Sync Routes - Backend Refactoring Verification
Tests the newly extracted shopify_sync_routes.py endpoints

Endpoints tested:
- GET /api/admin/sync-status - Get Shopify sync status and logs
- GET /api/admin/untitled-products - Get products with missing titles
- POST /api/admin/sync-products - Trigger manual Shopify sync (admin auth)
- POST /api/admin/cleanup-mock-products - Remove non-Shopify products (admin auth)
- POST /api/cron/sync-products?secret=midnight-sync-tdb-2025 - Cron endpoint for scheduled sync

Also verifies existing routes still work:
- GET /api/admin/abandoned-carts - Cart routes
- GET /api/loyalty/balance - Loyalty routes
- GET /api/admin/discount-codes - Discount routes
- GET /api/faqs - Public FAQs endpoint
"""

import pytest
import requests
import os
import time

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://product-master-3.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
CRON_SECRET = "midnight-sync-tdb-2025"


class TestShopifySyncRoutes:
    """Test Shopify Sync Routes (shopify_sync_routes.py)"""
    
    def test_sync_status_requires_auth(self):
        """Test that sync-status endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/sync-status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/sync-status correctly requires authentication")
    
    def test_sync_status_with_auth(self):
        """Test GET /api/admin/sync-status with valid admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/sync-status",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "total_products" in data, "Response should contain total_products"
        assert "shopify_products" in data, "Response should contain shopify_products"
        assert "local_products" in data, "Response should contain local_products"
        assert "recent_logs" in data, "Response should contain recent_logs"
        
        print(f"✓ GET /api/admin/sync-status - Total products: {data['total_products']}, Shopify: {data['shopify_products']}")
    
    def test_untitled_products_requires_auth(self):
        """Test that untitled-products endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/untitled-products")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/untitled-products correctly requires authentication")
    
    def test_untitled_products_with_auth(self):
        """Test GET /api/admin/untitled-products with valid admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/untitled-products",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "count" in data, "Response should contain count"
        assert "products" in data, "Response should contain products"
        
        print(f"✓ GET /api/admin/untitled-products - Found {data['count']} untitled products")
    
    def test_sync_products_requires_auth(self):
        """Test that sync-products endpoint requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/sync-products")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/sync-products correctly requires authentication")
    
    def test_sync_products_with_auth(self):
        """Test POST /api/admin/sync-products with valid admin credentials
        Note: This makes actual calls to Shopify, may take a few seconds
        """
        response = requests.post(
            f"{BASE_URL}/api/admin/sync-products",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            timeout=60  # Allow longer timeout for Shopify API calls
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "synced" in data, "Response should contain synced count"
        
        print(f"✓ POST /api/admin/sync-products - Synced {data.get('synced', 0)} products")
    
    def test_cleanup_mock_products_requires_auth(self):
        """Test that cleanup-mock-products endpoint requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/cleanup-mock-products")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/cleanup-mock-products correctly requires authentication")
    
    def test_cleanup_mock_products_with_auth(self):
        """Test POST /api/admin/cleanup-mock-products with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/cleanup-mock-products",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "deleted" in data, "Response should contain deleted count"
        assert "remaining" in data, "Response should contain remaining count"
        
        print(f"✓ POST /api/admin/cleanup-mock-products - Deleted {data.get('deleted', 0)}, Remaining {data.get('remaining', 0)}")
    
    def test_cron_sync_invalid_secret(self):
        """Test that cron sync endpoint rejects invalid secret"""
        response = requests.post(f"{BASE_URL}/api/cron/sync-products?secret=wrong-secret")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/cron/sync-products correctly rejects invalid secret")
    
    def test_cron_sync_valid_secret(self):
        """Test POST /api/cron/sync-products with valid secret
        Note: This makes actual calls to Shopify, may take a few seconds
        """
        response = requests.post(
            f"{BASE_URL}/api/cron/sync-products?secret={CRON_SECRET}",
            timeout=60  # Allow longer timeout for Shopify API calls
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "synced" in data, "Response should contain synced count"
        
        print(f"✓ POST /api/cron/sync-products - Synced {data.get('synced', 0)} products, New: {data.get('new_products', 0)}")


class TestExistingCartRoutes:
    """Verify existing cart routes still work after refactoring"""
    
    def test_abandoned_carts_requires_auth(self):
        """Test that abandoned-carts endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/abandoned-carts")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/abandoned-carts correctly requires authentication")
    
    def test_abandoned_carts_with_auth(self):
        """Test GET /api/admin/abandoned-carts with valid admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "carts" in data, "Response should contain carts"
        assert "total" in data, "Response should contain total"
        assert "stats" in data, "Response should contain stats"
        
        print(f"✓ GET /api/admin/abandoned-carts - Total: {data['total']}, Active: {data['stats'].get('active', 0)}")


class TestExistingLoyaltyRoutes:
    """Verify existing loyalty routes still work after refactoring"""
    
    def test_loyalty_balance_public(self):
        """Test GET /api/loyalty/balance - public endpoint"""
        # Test with a known user email
        response = requests.get(f"{BASE_URL}/api/loyalty/balance?user_id=dipali@clubconcierge.in")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "points" in data, "Response should contain points"
        assert "tier" in data, "Response should contain tier"
        assert "multiplier" in data, "Response should contain multiplier"
        
        print(f"✓ GET /api/loyalty/balance - Points: {data['points']}, Tier: {data['tier']}")
    
    def test_loyalty_balance_unknown_user(self):
        """Test GET /api/loyalty/balance with unknown user returns defaults"""
        response = requests.get(f"{BASE_URL}/api/loyalty/balance?user_id=unknown@test.com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["points"] == 0, "Unknown user should have 0 points"
        assert data["tier"] == "free", "Unknown user should have free tier"
        
        print("✓ GET /api/loyalty/balance - Unknown user returns defaults correctly")
    
    def test_loyalty_stats_requires_auth(self):
        """Test that loyalty stats endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/loyalty/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/loyalty/stats correctly requires authentication")
    
    def test_loyalty_stats_with_auth(self):
        """Test GET /api/admin/loyalty/stats with valid admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/loyalty/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_points_in_circulation" in data, "Response should contain total_points_in_circulation"
        assert "users_with_points" in data, "Response should contain users_with_points"
        
        print(f"✓ GET /api/admin/loyalty/stats - Points in circulation: {data['total_points_in_circulation']}")


class TestExistingDiscountRoutes:
    """Verify existing discount routes still work after refactoring"""
    
    def test_discount_codes_requires_auth(self):
        """Test that discount-codes endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/discount-codes correctly requires authentication")
    
    def test_discount_codes_with_auth(self):
        """Test GET /api/admin/discount-codes with valid admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/discount-codes",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "codes" in data, "Response should contain codes"
        assert "total" in data, "Response should contain total"
        assert "active" in data, "Response should contain active count"
        
        print(f"✓ GET /api/admin/discount-codes - Total: {data['total']}, Active: {data['active']}")


class TestPublicEndpoints:
    """Verify public endpoints still work after refactoring"""
    
    def test_faqs_public(self):
        """Test GET /api/faqs - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/faqs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # FAQs returns an object with faqs list and categories
        assert "faqs" in data, "Response should contain faqs"
        assert isinstance(data["faqs"], list), "FAQs should be a list"
        
        print(f"✓ GET /api/faqs - Returned {len(data['faqs'])} FAQs")
    
    def test_health_endpoint(self):
        """Test GET /api/health - health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        print("✓ GET /api/health - Backend is healthy")
    
    def test_products_public(self):
        """Test GET /api/products - public products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain products"
        
        print(f"✓ GET /api/products - Returned {len(data.get('products', []))} products")


class TestAdminAuthenticationConsistency:
    """Verify admin authentication is consistent across all extracted routes"""
    
    def test_wrong_credentials_rejected(self):
        """Test that wrong credentials are rejected across all admin endpoints"""
        endpoints = [
            "/api/admin/sync-status",
            "/api/admin/untitled-products",
            "/api/admin/abandoned-carts",
            "/api/admin/loyalty/stats",
            "/api/admin/discount-codes"
        ]
        
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                auth=("wrong_user", "wrong_pass")
            )
            assert response.status_code == 401, f"Expected 401 for {endpoint}, got {response.status_code}"
        
        print(f"✓ All {len(endpoints)} admin endpoints correctly reject wrong credentials")
    
    def test_correct_credentials_accepted(self):
        """Test that correct credentials are accepted across all admin endpoints"""
        endpoints = [
            "/api/admin/sync-status",
            "/api/admin/untitled-products",
            "/api/admin/abandoned-carts",
            "/api/admin/loyalty/stats",
            "/api/admin/discount-codes"
        ]
        
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
            )
            assert response.status_code == 200, f"Expected 200 for {endpoint}, got {response.status_code}: {response.text}"
        
        print(f"✓ All {len(endpoints)} admin endpoints accept correct credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
