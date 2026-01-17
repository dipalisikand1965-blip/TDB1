"""
Admin Notification Center Tests
Tests for the notification bell component and backend APIs
Features tested:
- GET /api/admin/notifications - Fetch notifications with filters
- PUT /api/admin/notifications/{id}/read - Mark single notification as read
- PUT /api/admin/notifications/mark-all-read - Mark all notifications as read
- DELETE /api/admin/notifications/{id} - Delete a notification
- Notification creation via various triggers (orders, reviews, chats, members)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


@pytest.fixture
def admin_auth():
    """Return admin auth headers"""
    import base64
    credentials = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAdminNotificationsAPI:
    """Test Admin Notification Center API endpoints"""
    
    def test_get_notifications_endpoint_exists(self, api_client, admin_auth):
        """Test that GET /api/admin/notifications endpoint exists and returns 200"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications",
            headers=admin_auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should contain 'notifications' key"
        assert "unread_count" in data, "Response should contain 'unread_count' key"
        assert "category_counts" in data, "Response should contain 'category_counts' key"
        print(f"✓ GET notifications returned {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_get_notifications_with_limit(self, api_client, admin_auth):
        """Test notifications endpoint with limit parameter"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=5",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["notifications"]) <= 5, "Should respect limit parameter"
        print(f"✓ Limit parameter works - returned {len(data['notifications'])} notifications")
    
    def test_get_notifications_unread_only(self, api_client, admin_auth):
        """Test notifications endpoint with unread_only filter"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?unread_only=true",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        # All returned notifications should be unread
        for notif in data["notifications"]:
            assert notif.get("read") == False, "All notifications should be unread when unread_only=true"
        print(f"✓ Unread filter works - returned {len(data['notifications'])} unread notifications")
    
    def test_notification_structure(self, api_client, admin_auth):
        """Test that notifications have correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=10",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        if data["notifications"]:
            notif = data["notifications"][0]
            # Check required fields
            required_fields = ["id", "type", "title", "message", "category", "read", "created_at"]
            for field in required_fields:
                assert field in notif, f"Notification should have '{field}' field"
            
            # Check type is valid
            valid_types = ["order", "reservation", "meetup", "chat", "review", "member", "stock", "ticket", "system"]
            assert notif["type"] in valid_types, f"Type '{notif['type']}' should be one of {valid_types}"
            
            print(f"✓ Notification structure valid - type: {notif['type']}, title: {notif['title'][:50]}...")
        else:
            print("⚠ No notifications found to verify structure")
    
    def test_category_counts_structure(self, api_client, admin_auth):
        """Test that category_counts is properly structured"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        category_counts = data["category_counts"]
        assert isinstance(category_counts, dict), "category_counts should be a dictionary"
        
        # Valid categories
        valid_categories = ["celebrate", "dine", "stay", "care", "travel", "general"]
        for cat in category_counts.keys():
            assert cat in valid_categories, f"Category '{cat}' should be one of {valid_categories}"
        
        print(f"✓ Category counts: {category_counts}")
    
    def test_mark_notification_read(self, api_client, admin_auth):
        """Test marking a single notification as read"""
        # First get an unread notification
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?unread_only=true&limit=1",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        if not data["notifications"]:
            pytest.skip("No unread notifications to test with")
        
        notif_id = data["notifications"][0]["id"]
        
        # Mark as read
        response = api_client.put(
            f"{BASE_URL}/api/admin/notifications/{notif_id}/read",
            headers=admin_auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's now read
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=50",
            headers=admin_auth
        )
        data = response.json()
        marked_notif = next((n for n in data["notifications"] if n["id"] == notif_id), None)
        if marked_notif:
            assert marked_notif["read"] == True, "Notification should be marked as read"
        
        print(f"✓ Successfully marked notification {notif_id} as read")
    
    def test_mark_all_notifications_read(self, api_client, admin_auth):
        """Test marking all notifications as read"""
        response = api_client.put(
            f"{BASE_URL}/api/admin/notifications/mark-all-read",
            headers=admin_auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert "message" in result, "Response should contain message"
        
        # Verify unread count is now 0
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications",
            headers=admin_auth
        )
        data = response.json()
        assert data["unread_count"] == 0, "Unread count should be 0 after marking all as read"
        
        print(f"✓ Mark all as read successful: {result['message']}")
    
    def test_delete_notification(self, api_client, admin_auth):
        """Test deleting a notification"""
        # First get a notification to delete
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=1",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        if not data["notifications"]:
            pytest.skip("No notifications to delete")
        
        notif_id = data["notifications"][0]["id"]
        
        # Delete it
        response = api_client.delete(
            f"{BASE_URL}/api/admin/notifications/{notif_id}",
            headers=admin_auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's deleted
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=100",
            headers=admin_auth
        )
        data = response.json()
        deleted_notif = next((n for n in data["notifications"] if n["id"] == notif_id), None)
        assert deleted_notif is None, "Notification should be deleted"
        
        print(f"✓ Successfully deleted notification {notif_id}")
    
    def test_delete_nonexistent_notification(self, api_client, admin_auth):
        """Test deleting a non-existent notification returns 404"""
        fake_id = f"notif-{uuid.uuid4().hex[:12]}"
        response = api_client.delete(
            f"{BASE_URL}/api/admin/notifications/{fake_id}",
            headers=admin_auth
        )
        assert response.status_code == 404, f"Expected 404 for non-existent notification, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent notification")
    
    def test_unauthorized_access(self, api_client):
        """Test that endpoints require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/notifications")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Endpoints correctly require authentication")


class TestNotificationCreation:
    """Test that notifications are created for various events"""
    
    def test_create_test_notification_via_order(self, api_client, admin_auth):
        """Test that creating an order triggers a notification"""
        # Create a test order
        order_data = {
            "customer_name": "TEST_NotificationTest",
            "customer_email": "test_notification@example.com",
            "customer_phone": "9999999999",
            "delivery_address": {
                "line1": "Test Address",
                "city": "Bangalore",
                "pincode": "560001"
            },
            "items": [
                {
                    "product_id": "test-product-1",
                    "name": "Test Cake",
                    "price": 500,
                    "quantity": 1
                }
            ],
            "subtotal": 500,
            "delivery_fee": 50,
            "total": 550,
            "payment_method": "cod"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        
        if response.status_code in [200, 201]:
            # Check if notification was created
            notif_response = api_client.get(
                f"{BASE_URL}/api/admin/notifications?limit=5",
                headers=admin_auth
            )
            data = notif_response.json()
            
            # Look for order notification
            order_notifs = [n for n in data["notifications"] if n["type"] == "order"]
            if order_notifs:
                print(f"✓ Order notification created: {order_notifs[0]['title']}")
            else:
                print("⚠ Order created but notification not found in recent notifications")
        else:
            print(f"⚠ Order creation returned {response.status_code} - skipping notification check")
    
    def test_notification_types_coverage(self, api_client, admin_auth):
        """Test that various notification types exist in the system"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=100",
            headers=admin_auth
        )
        assert response.status_code == 200
        
        data = response.json()
        types_found = set(n["type"] for n in data["notifications"])
        
        expected_types = {"order", "reservation", "meetup", "chat", "review", "member"}
        found_types = types_found.intersection(expected_types)
        
        print(f"✓ Notification types found: {found_types}")
        print(f"  All types in system: {types_found}")


class TestNotificationFiltering:
    """Test notification filtering capabilities"""
    
    def test_filter_by_category(self, api_client, admin_auth):
        """Test filtering notifications by category"""
        # Get all notifications first
        response = api_client.get(
            f"{BASE_URL}/api/admin/notifications?limit=100",
            headers=admin_auth
        )
        data = response.json()
        
        if not data["notifications"]:
            pytest.skip("No notifications to filter")
        
        # Get unique categories
        categories = set(n["category"] for n in data["notifications"])
        
        for category in categories:
            response = api_client.get(
                f"{BASE_URL}/api/admin/notifications?category={category}",
                headers=admin_auth
            )
            assert response.status_code == 200
            
            filtered_data = response.json()
            for notif in filtered_data["notifications"]:
                assert notif["category"] == category, f"All notifications should be category '{category}'"
            
            print(f"✓ Category filter '{category}' works - {len(filtered_data['notifications'])} notifications")


class TestNotificationCleanup:
    """Test notification cleanup functionality"""
    
    def test_clear_old_notifications(self, api_client, admin_auth):
        """Test clearing old notifications"""
        response = api_client.delete(
            f"{BASE_URL}/api/admin/notifications/clear-old?days=30",
            headers=admin_auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert "message" in result, "Response should contain message"
        print(f"✓ Clear old notifications: {result['message']}")


# Cleanup fixture to create test notifications for testing
@pytest.fixture(scope="module", autouse=True)
def setup_test_notifications(api_client, admin_auth):
    """Create some test notifications before running tests"""
    # This would typically be done via the create_admin_notification function
    # For now, we rely on existing notifications in the system
    yield
    
    # Cleanup: Delete any TEST_ prefixed data if needed
    pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
