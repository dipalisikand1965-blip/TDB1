"""
Test suite for Orders and Autoship Routes
Tests the newly extracted orders_routes.py and autoship_routes.py
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://concierge-flow-fix.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_products_endpoint(self):
        """Test products endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Products endpoint working: {len(data['products'])} products")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@example.com", "password": "wrongpassword"}
        )
        assert response.status_code in [401, 404]
        print("✓ Invalid login correctly rejected")


class TestOrdersRoutes:
    """Tests for orders_routes.py endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_my_orders_authenticated(self, auth_token):
        """Test GET /api/orders/my-orders with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)
        print(f"✓ GET /api/orders/my-orders: {len(data['orders'])} orders found")
    
    def test_get_my_orders_unauthenticated(self):
        """Test GET /api/orders/my-orders without auth"""
        response = requests.get(f"{BASE_URL}/api/orders/my-orders")
        assert response.status_code == 401
        print("✓ GET /api/orders/my-orders correctly requires auth")
    
    def test_create_order(self):
        """Test POST /api/orders - create new order"""
        order_id = f"TEST-ORD-{uuid.uuid4().hex[:8].upper()}"
        order_data = {
            "orderId": order_id,
            "customer": {
                "parentName": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "items": [
                {
                    "name": "Test Cake",
                    "quantity": 1,
                    "price": 999,
                    "category": "cakes"
                }
            ],
            "delivery": {
                "method": "delivery",
                "city": "Bangalore",
                "address": "Test Address",
                "pincode": "560001",
                "date": "2026-01-30"
            },
            "total": 999,
            "status": "pending"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["orderId"] == order_id
        assert "id" in data
        print(f"✓ POST /api/orders: Order {order_id} created")
        return data["id"]
    
    def test_get_order_by_id(self):
        """Test GET /api/orders/{order_id}"""
        # First create an order
        order_id = f"TEST-GET-{uuid.uuid4().hex[:8].upper()}"
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "orderId": order_id,
                "customer": {"email": "test@example.com"},
                "items": [{"name": "Test", "quantity": 1, "price": 100}],
                "total": 100
            }
        )
        assert create_response.status_code == 200
        internal_id = create_response.json()["id"]
        
        # Get by orderId
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["orderId"] == order_id
        print(f"✓ GET /api/orders/{order_id}: Order retrieved")
        
        # Get by internal id
        response2 = requests.get(f"{BASE_URL}/api/orders/{internal_id}")
        assert response2.status_code == 200
        print(f"✓ GET /api/orders/{internal_id}: Order retrieved by internal ID")
    
    def test_get_order_not_found(self):
        """Test GET /api/orders/{order_id} with non-existent ID"""
        response = requests.get(f"{BASE_URL}/api/orders/non-existent-order-id")
        assert response.status_code == 404
        print("✓ GET /api/orders/non-existent: Correctly returns 404")


class TestAutoshipRoutes:
    """Tests for autoship_routes.py endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_my_subscriptions_authenticated(self, auth_token):
        """Test GET /api/autoship/my-subscriptions with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/autoship/my-subscriptions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscriptions" in data
        assert isinstance(data["subscriptions"], list)
        print(f"✓ GET /api/autoship/my-subscriptions: {len(data['subscriptions'])} subscriptions found")
    
    def test_get_my_subscriptions_unauthenticated(self):
        """Test GET /api/autoship/my-subscriptions without auth"""
        response = requests.get(f"{BASE_URL}/api/autoship/my-subscriptions")
        assert response.status_code == 401
        print("✓ GET /api/autoship/my-subscriptions correctly requires auth")
    
    def test_create_autoship_product_not_found(self, auth_token):
        """Test POST /api/autoship/create with non-existent product"""
        response = requests.post(
            f"{BASE_URL}/api/autoship/create",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": "non-existent-product",
                "frequency": 4
            }
        )
        assert response.status_code == 404
        print("✓ POST /api/autoship/create: Correctly returns 404 for non-existent product")
    
    def test_pause_subscription_not_found(self, auth_token):
        """Test PUT /api/autoship/{id}/pause with non-existent subscription"""
        response = requests.put(
            f"{BASE_URL}/api/autoship/non-existent-sub/pause",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("✓ PUT /api/autoship/{id}/pause: Correctly returns 404 for non-existent subscription")
    
    def test_resume_subscription_not_found(self, auth_token):
        """Test PUT /api/autoship/{id}/resume with non-existent subscription"""
        response = requests.put(
            f"{BASE_URL}/api/autoship/non-existent-sub/resume",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("✓ PUT /api/autoship/{id}/resume: Correctly returns 404 for non-existent subscription")


class TestAutoshipAdminRoutes:
    """Tests for autoship admin routes"""
    
    def test_get_all_subscriptions_admin(self):
        """Test GET /api/admin/autoship with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/autoship",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscriptions" in data
        assert "stats" in data
        print(f"✓ GET /api/admin/autoship: {len(data['subscriptions'])} subscriptions, stats: {data['stats']}")
    
    def test_get_all_subscriptions_unauthorized(self):
        """Test GET /api/admin/autoship without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/autoship")
        assert response.status_code == 401
        print("✓ GET /api/admin/autoship correctly requires admin auth")
    
    def test_get_autoship_stats_admin(self):
        """Test GET /api/admin/autoship/stats with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/autoship/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
        assert "paused" in data
        assert "cancelled" in data
        assert "total" in data
        assert "upcoming_shipments_7d" in data
        print(f"✓ GET /api/admin/autoship/stats: {data}")
    
    def test_get_autoship_stats_unauthorized(self):
        """Test GET /api/admin/autoship/stats without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/autoship/stats")
        assert response.status_code == 401
        print("✓ GET /api/admin/autoship/stats correctly requires admin auth")


class TestPreviouslyRefactoredRoutes:
    """Tests for previously refactored routes (cart, loyalty, discount, shopify sync)"""
    
    def test_cart_abandoned_carts_admin(self):
        """Test GET /api/admin/abandoned-carts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "carts" in data
        assert "stats" in data
        print(f"✓ GET /api/admin/abandoned-carts: {data['total']} carts, stats: {data['stats']}")
    
    def test_loyalty_balance(self):
        """Test GET /api/loyalty/balance"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": TEST_USER_EMAIL}
        )
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "tier" in data
        print(f"✓ GET /api/loyalty/balance: {data['points']} points, tier: {data['tier']}")
    
    def test_loyalty_stats_admin(self):
        """Test GET /api/admin/loyalty/stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/loyalty/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        # Response contains config, top_users, recent_transactions, etc.
        assert "config" in data or "total_members" in data or "top_users" in data
        print(f"✓ GET /api/admin/loyalty/stats: Retrieved loyalty stats")
    
    def test_discount_codes_admin(self):
        """Test GET /api/admin/discount-codes"""
        response = requests.get(
            f"{BASE_URL}/api/admin/discount-codes",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "codes" in data or isinstance(data, list)
        print(f"✓ GET /api/admin/discount-codes: Retrieved discount codes")
    
    def test_sync_status_admin(self):
        """Test GET /api/admin/sync-status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/sync-status",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_products" in data
        print(f"✓ GET /api/admin/sync-status: {data['total_products']} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
