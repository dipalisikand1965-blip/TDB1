"""
Test Suite for Extracted Routes - Backend Refactoring Verification
Tests: Loyalty Routes, Discount Routes, and Abandoned Cart Routes
These routes were extracted from the monolithic server.py into separate files.
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test user
TEST_USER_EMAIL = "dipali@clubconcierge.in"


class TestLoyaltyRoutes:
    """Tests for loyalty_routes.py - Paw Rewards loyalty program"""
    
    def test_get_loyalty_balance_existing_user(self):
        """GET /api/loyalty/balance - Get loyalty balance for existing user"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": TEST_USER_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "points" in data, "Response should contain 'points'"
        assert "total_earned" in data, "Response should contain 'total_earned'"
        assert "total_redeemed" in data, "Response should contain 'total_redeemed'"
        assert "tier" in data, "Response should contain 'tier'"
        assert "multiplier" in data, "Response should contain 'multiplier'"
        assert "redemption_value" in data, "Response should contain 'redemption_value'"
        
        # Verify data types
        assert isinstance(data["points"], (int, float)), "points should be numeric"
        assert isinstance(data["multiplier"], (int, float)), "multiplier should be numeric"
        print(f"✓ Loyalty balance for {TEST_USER_EMAIL}: {data['points']} points, tier: {data['tier']}")
    
    def test_get_loyalty_balance_nonexistent_user(self):
        """GET /api/loyalty/balance - Get loyalty balance for non-existent user (should return defaults)"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Non-existent user should get default values
        assert data["points"] == 0, "Non-existent user should have 0 points"
        assert data["tier"] == "free", "Non-existent user should have 'free' tier"
        assert data["multiplier"] == 1.0, "Non-existent user should have 1.0 multiplier"
        print("✓ Non-existent user returns default loyalty values")
    
    def test_get_loyalty_history(self):
        """GET /api/loyalty/history - Get loyalty transaction history"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/history",
            params={"user_id": TEST_USER_EMAIL, "limit": 10}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "transactions" in data, "Response should contain 'transactions'"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        print(f"✓ Loyalty history returned {len(data['transactions'])} transactions")


class TestLoyaltyAdminRoutes:
    """Tests for loyalty admin routes - requires authentication"""
    
    def test_get_loyalty_stats_with_auth(self):
        """GET /api/admin/loyalty/stats - Get loyalty program statistics (admin auth required)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/loyalty/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "total_points_in_circulation" in data, "Response should contain 'total_points_in_circulation'"
        assert "total_points_ever_earned" in data, "Response should contain 'total_points_ever_earned'"
        assert "potential_liability" in data, "Response should contain 'potential_liability'"
        assert "users_with_points" in data, "Response should contain 'users_with_points'"
        assert "top_users" in data, "Response should contain 'top_users'"
        assert "recent_transactions" in data, "Response should contain 'recent_transactions'"
        assert "config" in data, "Response should contain 'config'"
        
        print(f"✓ Loyalty stats: {data['total_points_in_circulation']} points in circulation, {data['users_with_points']} users with points")
    
    def test_get_loyalty_stats_without_auth(self):
        """GET /api/admin/loyalty/stats - Should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/loyalty/stats")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Loyalty stats correctly requires authentication")
    
    def test_get_loyalty_stats_wrong_auth(self):
        """GET /api/admin/loyalty/stats - Should fail with wrong credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/loyalty/stats",
            auth=("wrong_user", "wrong_pass")
        )
        assert response.status_code == 401, f"Expected 401 with wrong auth, got {response.status_code}"
        print("✓ Loyalty stats correctly rejects wrong credentials")


class TestDiscountRoutes:
    """Tests for discount_routes.py - Promo codes and discount management"""
    
    def test_get_all_discount_codes_with_auth(self):
        """GET /api/admin/discount-codes - Get all discount codes (admin auth required)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/discount-codes",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "codes" in data, "Response should contain 'codes'"
        assert "total" in data, "Response should contain 'total'"
        assert "active" in data, "Response should contain 'active'"
        assert "total_uses" in data, "Response should contain 'total_uses'"
        
        assert isinstance(data["codes"], list), "codes should be a list"
        print(f"✓ Discount codes: {data['total']} total, {data['active']} active, {data['total_uses']} total uses")
    
    def test_get_discount_codes_without_auth(self):
        """GET /api/admin/discount-codes - Should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Discount codes correctly requires authentication")
    
    def test_create_and_delete_discount_code(self):
        """POST /api/admin/discount-codes - Create a new discount code, then delete it"""
        test_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        
        # Create discount code
        create_response = requests.post(
            f"{BASE_URL}/api/admin/discount-codes",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={
                "code": test_code,
                "type": "percentage",
                "value": 15,
                "min_order": 500,
                "description": "Test discount code - auto cleanup"
            }
        )
        assert create_response.status_code == 200, f"Expected 200, got {create_response.status_code}: {create_response.text}"
        
        create_data = create_response.json()
        assert "code" in create_data, "Response should contain 'code'"
        assert create_data["code"]["code"] == test_code, "Created code should match"
        print(f"✓ Created discount code: {test_code}")
        
        # Delete the test code
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/discount-codes/{test_code}",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert delete_response.status_code == 200, f"Expected 200 on delete, got {delete_response.status_code}: {delete_response.text}"
        print(f"✓ Deleted discount code: {test_code}")


class TestCartRoutes:
    """Tests for cart_routes.py - Abandoned cart tracking and recovery"""
    
    def test_save_cart_snapshot(self):
        """POST /api/cart/snapshot - Save a cart snapshot"""
        test_session_id = f"test_session_{uuid.uuid4().hex[:12]}"
        
        response = requests.post(
            f"{BASE_URL}/api/cart/snapshot",
            json={
                "session_id": test_session_id,
                "items": [
                    {
                        "product_id": "prod-test-001",
                        "name": "Test Dog Treat",
                        "quantity": 2,
                        "price": 299.0
                    },
                    {
                        "product_id": "prod-test-002",
                        "name": "Test Dog Toy",
                        "quantity": 1,
                        "price": 499.0
                    }
                ],
                "subtotal": 1097.0
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "id" in data, "Response should contain 'id'"
        print(f"✓ Cart snapshot saved: {data['id']}")
        
        return test_session_id
    
    def test_capture_cart_email(self):
        """POST /api/cart/capture-email - Capture email for abandoned cart"""
        test_session_id = f"test_session_{uuid.uuid4().hex[:12]}"
        test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/cart/capture-email",
            params={
                "session_id": test_session_id,
                "email": test_email,
                "name": "Test User"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert data["email"] == test_email, "Captured email should match"
        print(f"✓ Cart email captured: {test_email}")
    
    def test_convert_cart(self):
        """POST /api/cart/convert/{session_id} - Mark cart as converted"""
        test_session_id = f"test_session_{uuid.uuid4().hex[:12]}"
        test_order_id = f"order_{uuid.uuid4().hex[:8]}"
        
        # First create a cart snapshot
        requests.post(
            f"{BASE_URL}/api/cart/snapshot",
            json={
                "session_id": test_session_id,
                "items": [{"product_id": "test", "name": "Test", "quantity": 1, "price": 100}],
                "subtotal": 100.0
            }
        )
        
        # Then convert it
        response = requests.post(
            f"{BASE_URL}/api/cart/convert/{test_session_id}",
            params={"order_id": test_order_id}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Cart converted to order: {test_order_id}")


class TestCartAdminRoutes:
    """Tests for cart admin routes - requires authentication"""
    
    def test_get_abandoned_carts_with_auth(self):
        """GET /api/admin/abandoned-carts - Get all abandoned carts (admin auth required)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "carts" in data, "Response should contain 'carts'"
        assert "total" in data, "Response should contain 'total'"
        assert "stats" in data, "Response should contain 'stats'"
        
        stats = data["stats"]
        assert "active" in stats, "Stats should contain 'active'"
        assert "converted" in stats, "Stats should contain 'converted'"
        assert "potential_revenue" in stats, "Stats should contain 'potential_revenue'"
        
        print(f"✓ Abandoned carts: {data['total']} total, {stats['active']} active, {stats['converted']} converted")
    
    def test_get_abandoned_carts_without_auth(self):
        """GET /api/admin/abandoned-carts - Should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/abandoned-carts")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Abandoned carts correctly requires authentication")
    
    def test_get_cart_reminders_log(self):
        """GET /api/admin/abandoned-carts/reminders - Get log of sent reminders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts/reminders",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reminders" in data, "Response should contain 'reminders'"
        assert "total" in data, "Response should contain 'total'"
        assert isinstance(data["reminders"], list), "reminders should be a list"
        
        print(f"✓ Cart reminders log: {data['total']} total reminders sent")
    
    def test_trigger_cart_check(self):
        """POST /api/admin/abandoned-carts/trigger-check - Manually trigger abandoned cart check"""
        response = requests.post(
            f"{BASE_URL}/api/admin/abandoned-carts/trigger-check",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "reminders_sent" in data, "Response should contain 'reminders_sent'"
        assert "timestamp" in data, "Response should contain 'timestamp'"
        
        print(f"✓ Cart check triggered: {data['reminders_sent']} reminders sent")
    
    def test_trigger_cart_check_without_auth(self):
        """POST /api/admin/abandoned-carts/trigger-check - Should fail without auth"""
        response = requests.post(f"{BASE_URL}/api/admin/abandoned-carts/trigger-check")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Cart check trigger correctly requires authentication")


class TestRouteIntegration:
    """Integration tests to verify routes work together after extraction"""
    
    def test_full_cart_flow(self):
        """Test complete cart flow: snapshot -> email capture -> convert"""
        test_session_id = f"integration_test_{uuid.uuid4().hex[:12]}"
        test_email = f"integration_{uuid.uuid4().hex[:6]}@test.com"
        test_order_id = f"order_int_{uuid.uuid4().hex[:8]}"
        
        # Step 1: Save cart snapshot
        snapshot_response = requests.post(
            f"{BASE_URL}/api/cart/snapshot",
            json={
                "session_id": test_session_id,
                "items": [
                    {"product_id": "int-prod-001", "name": "Integration Test Product", "quantity": 3, "price": 199.0}
                ],
                "subtotal": 597.0
            }
        )
        assert snapshot_response.status_code == 200, f"Snapshot failed: {snapshot_response.text}"
        print("  Step 1: Cart snapshot saved ✓")
        
        # Step 2: Capture email
        email_response = requests.post(
            f"{BASE_URL}/api/cart/capture-email",
            params={"session_id": test_session_id, "email": test_email, "name": "Integration Tester"}
        )
        assert email_response.status_code == 200, f"Email capture failed: {email_response.text}"
        print("  Step 2: Email captured ✓")
        
        # Step 3: Verify cart appears in admin list
        admin_response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert admin_response.status_code == 200, f"Admin list failed: {admin_response.text}"
        
        carts = admin_response.json()["carts"]
        found_cart = any(c.get("session_id") == test_session_id for c in carts)
        assert found_cart, "Created cart should appear in admin list"
        print("  Step 3: Cart visible in admin ✓")
        
        # Step 4: Convert cart
        convert_response = requests.post(
            f"{BASE_URL}/api/cart/convert/{test_session_id}",
            params={"order_id": test_order_id}
        )
        assert convert_response.status_code == 200, f"Convert failed: {convert_response.text}"
        print("  Step 4: Cart converted ✓")
        
        print("✓ Full cart flow integration test passed")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
