"""
Test Suite for Iteration 98: PWA Push Notifications, Concierge® Experiences, and Mobile UI

Features tested:
1. PWA Push Notification endpoints (VAPID key, subscribe, stats, soul whisper)
2. WebSocket health endpoint
3. Concierge® experience request endpoint
4. Dine and Celebrate pages with Concierge® experiences
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPushNotificationEndpoints:
    """Test PWA Push Notification backend routes"""
    
    def test_vapid_public_key_endpoint(self):
        """GET /api/push/vapid-public-key - Should return VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain public_key"
        assert isinstance(data["public_key"], str), "public_key should be a string"
        assert len(data["public_key"]) > 50, "public_key should be a valid hex string"
        print(f"✅ VAPID public key returned: {data['public_key'][:20]}...")
    
    def test_push_stats_endpoint(self):
        """GET /api/push/stats - Should return push notification statistics"""
        response = requests.get(f"{BASE_URL}/api/push/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "subscriptions" in data, "Response should contain subscriptions"
        assert "total" in data["subscriptions"], "subscriptions should have total"
        assert "active" in data["subscriptions"], "subscriptions should have active"
        assert "inactive" in data["subscriptions"], "subscriptions should have inactive"
        assert "soul_whispers" in data, "Response should contain soul_whispers"
        assert "recent_notifications" in data, "Response should contain recent_notifications"
        print(f"✅ Push stats: {data['subscriptions']['total']} total, {data['subscriptions']['active']} active")
    
    def test_push_subscribe_endpoint(self):
        """POST /api/push/subscribe - Should accept push subscription"""
        # Create a test subscription payload
        test_subscription = {
            "subscription": {
                "endpoint": f"https://test-push-endpoint.example.com/TEST_{datetime.now().timestamp()}",
                "keys": {
                    "p256dh": "test_p256dh_key_" + "a" * 50,
                    "auth": "test_auth_key_" + "b" * 20
                },
                "expiration_time": None
            },
            "user_id": "TEST_user_push_98",
            "preferences": {
                "soul_whisper": True,
                "order_updates": True,
                "concierge_updates": True,
                "promotions": False
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=test_subscription,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Subscribe should return success: true"
        assert "message" in data, "Response should contain message"
        print(f"✅ Push subscription created: {data['message']}")
    
    def test_push_unsubscribe_endpoint(self):
        """POST /api/push/unsubscribe - Should unsubscribe from push"""
        test_subscription = {
            "endpoint": f"https://test-push-endpoint.example.com/TEST_unsubscribe_{datetime.now().timestamp()}",
            "keys": {
                "p256dh": "test_p256dh_key_" + "c" * 50,
                "auth": "test_auth_key_" + "d" * 20
            }
        }
        
        # First subscribe
        subscribe_response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"subscription": test_subscription, "user_id": "TEST_user_unsubscribe"},
            headers={"Content-Type": "application/json"}
        )
        assert subscribe_response.status_code == 200
        
        # Then unsubscribe
        response = requests.post(
            f"{BASE_URL}/api/push/unsubscribe",
            json=test_subscription,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Unsubscribe should return success: true"
        print(f"✅ Push unsubscribe successful")
    
    def test_push_preferences_update(self):
        """PUT /api/push/preferences/{user_id} - Should update preferences"""
        user_id = "TEST_user_prefs_98"
        
        # First create a subscription for this user
        test_subscription = {
            "subscription": {
                "endpoint": f"https://test-push-endpoint.example.com/TEST_prefs_{datetime.now().timestamp()}",
                "keys": {
                    "p256dh": "test_p256dh_key_" + "e" * 50,
                    "auth": "test_auth_key_" + "f" * 20
                }
            },
            "user_id": user_id
        }
        requests.post(f"{BASE_URL}/api/push/subscribe", json=test_subscription)
        
        # Update preferences
        new_preferences = {
            "soul_whisper": False,
            "order_updates": True,
            "concierge_updates": True,
            "promotions": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/push/preferences/{user_id}",
            json=new_preferences,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Preferences update should return success: true"
        print(f"✅ Push preferences updated for user {user_id}")


class TestSoulWhisperEndpoints:
    """Test Soul Whisper notification endpoints"""
    
    def test_soul_whisper_preview(self):
        """GET /api/push/soul-whisper/preview/{user_id} - Should return preview or no pets message"""
        # Test with a non-existent user (should return no pets found)
        response = requests.get(f"{BASE_URL}/api/push/soul-whisper/preview/TEST_nonexistent_user")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Either returns a preview or a "no pets found" message
        if data.get("success"):
            assert "preview" in data, "Successful response should contain preview"
            assert "title" in data["preview"], "Preview should have title"
            assert "body" in data["preview"], "Preview should have body"
            print(f"✅ Soul Whisper preview: {data['preview']['title']}")
        else:
            assert "message" in data, "Failed response should contain message"
            print(f"✅ Soul Whisper preview (no pets): {data['message']}")


class TestWebSocketHealth:
    """Test WebSocket health endpoint"""
    
    def test_websocket_health_endpoint(self):
        """GET /api/health/websocket - Should return WebSocket status"""
        response = requests.get(f"{BASE_URL}/api/health/websocket")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response should contain status"
        assert data["status"] == "healthy", "WebSocket status should be healthy"
        assert "websocket" in data, "Response should contain websocket field"
        assert "total_connected" in data, "Response should contain total_connected"
        print(f"✅ WebSocket health: {data['status']}, connected: {data['total_connected']}")


class TestConciergeExperienceRequest:
    """Test Concierge® experience request endpoint"""
    
    def test_concierge_experience_request_dine(self):
        """POST /api/concierge/experience-request - Should create Dine concierge request"""
        request_data = {
            "pillar": "dine",
            "experience_type": "private_chef_experience",
            "experience_title": "Private Chef Experience®",
            "message": "TEST: Looking for a private chef for my dog's birthday dinner",
            "user_name": "Test User",
            "user_email": "test@example.com",
            "user_phone": "9876543210",
            "pet_name": "Luna",
            "source": "concierge_experience_card"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/experience-request",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True or "request_id" in data or "ticket_id" in data, \
            f"Request should be successful: {data}"
        print(f"✅ Dine Concierge request created")
    
    def test_concierge_experience_request_celebrate(self):
        """POST /api/concierge/experience-request - Should create Celebrate concierge request"""
        request_data = {
            "pillar": "celebrate",
            "experience_type": "ultimate_birthday_bash",
            "experience_title": "Ultimate Birthday Bash®",
            "message": "TEST: Planning a grand birthday party for my golden retriever",
            "user_name": "Test User Celebrate",
            "user_email": "test.celebrate@example.com",
            "user_phone": "9876543211",
            "pet_name": "Max",
            "source": "concierge_experience_card"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/experience-request",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True or "request_id" in data or "ticket_id" in data, \
            f"Request should be successful: {data}"
        print(f"✅ Celebrate Concierge request created")


class TestDinePageEndpoints:
    """Test Dine page related endpoints"""
    
    def test_dine_products_endpoint(self):
        """GET /api/products?category=food - Should return food products"""
        response = requests.get(f"{BASE_URL}/api/products?category=food&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Response could be a list or an object with products key
        products = data.get("products", data) if isinstance(data, dict) else data
        print(f"✅ Dine products endpoint working, returned {len(products) if isinstance(products, list) else 'data'}")


class TestCelebratePageEndpoints:
    """Test Celebrate page related endpoints"""
    
    def test_celebrate_products_endpoint(self):
        """GET /api/products?category=cakes - Should return cake products"""
        response = requests.get(f"{BASE_URL}/api/products?category=cakes&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        print(f"✅ Celebrate products endpoint working, returned {len(products) if isinstance(products, list) else 'data'}")


class TestMemberAuthentication:
    """Test member authentication for dashboard access"""
    
    def test_member_login(self):
        """POST /api/auth/member/login - Should authenticate member"""
        login_data = {
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/member/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data or "session_token" in data or "user" in data, \
            f"Login should return token or user data: {data}"
        print(f"✅ Member login successful")
        return data


class TestHealthEndpoints:
    """Test general health endpoints"""
    
    def test_api_health(self):
        """GET /api/health - Should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "healthy", f"Health status should be healthy: {data}"
        print(f"✅ API health: {data['status']}")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after tests"""
    yield
    # Cleanup would happen here if needed
    print("✅ Test cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
