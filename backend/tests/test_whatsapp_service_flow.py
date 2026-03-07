"""
Test WhatsApp Service Command Flow
===================================
Tests that WhatsApp button clicks create service desk tickets BEFORE opening WhatsApp.
Components tested: ConciergeButton, FloatingContactButton, ConciergePanel, InlineConciergeCard, MiraUniversalBar
"""

import pytest
import requests
import os
import json

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_AUTH = ("aditya", "lola4304")


class TestServiceRequestAPI:
    """Tests for /api/service-requests endpoint"""
    
    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✅ Health check passed")
    
    def test_service_request_concierge_button(self):
        """Test service request from ConciergeButton WhatsApp click"""
        payload = {
            "type": "whatsapp_intent",
            "pillar": "celebrate",
            "source": "concierge_button_whatsapp",
            "customer": {
                "name": "TEST_ConciergeButton User",
                "email": "test_cb@test.com",
                "phone": "+919876543210",
                "user_id": "test-user-cb"
            },
            "details": {
                "message": "[WhatsApp Intent] User clicked WhatsApp button from ConciergeButton",
                "pet_name": "TestPet",
                "pet_id": "pet-123",
                "channel": "whatsapp",
                "source_component": "ConciergeButton"
            },
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/service-requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        print(f"✅ ConciergeButton ticket created: {data.get('ticket_id')}")
        
        return data.get("ticket_id"), data.get("notification_id")
    
    def test_service_request_floating_contact(self):
        """Test service request from FloatingContactButton WhatsApp click"""
        payload = {
            "type": "whatsapp_intent",
            "pillar": "general",
            "source": "floating_contact_button",
            "customer": {
                "name": "TEST_FloatingContact User",
                "email": "test_fc@test.com",
                "phone": "+919876543211"
            },
            "details": {
                "message": "[WhatsApp Intent] User clicked WhatsApp from FloatingContactButton",
                "channel": "whatsapp",
                "source_component": "FloatingContactButton"
            },
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/service-requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        print(f"✅ FloatingContactButton ticket created: {data.get('ticket_id')}")
        
        return data.get("ticket_id")
    
    def test_service_request_concierge_panel(self):
        """Test service request from ConciergePanel WhatsApp click"""
        payload = {
            "type": "whatsapp_intent",
            "pillar": "learn",
            "source": "concierge_panel",
            "customer": {
                "name": "TEST_ConciergePanel User",
                "email": "test_cp@test.com",
                "phone": "+919876543212",
                "user_id": "test-user-cp"
            },
            "details": {
                "message": "[WhatsApp Intent] User clicked WhatsApp from ConciergePanel",
                "pet_name": "Buddy",
                "channel": "whatsapp",
                "source_component": "ConciergePanel"
            },
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/service-requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        print(f"✅ ConciergePanel ticket created: {data.get('ticket_id')}")
        
        return data.get("ticket_id")
    
    def test_service_request_inline_concierge(self):
        """Test service request from InlineConciergeCard WhatsApp click"""
        payload = {
            "type": "whatsapp_intent",
            "pillar": "mira_chat",
            "source": "inline_concierge_card",
            "customer": {
                "name": "TEST_InlineConcierge User",
                "email": "test_ic@test.com",
                "phone": "+919876543213",
                "user_id": "test-user-ic"
            },
            "details": {
                "message": "[WhatsApp Intent] User clicked WhatsApp from InlineConciergeCard",
                "pet_name": "Max",
                "channel": "whatsapp",
                "source_component": "InlineConciergeCard"
            },
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/service-requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        print(f"✅ InlineConciergeCard ticket created: {data.get('ticket_id')}")
        
        return data.get("ticket_id")
    
    def test_service_request_mira_universal_bar(self):
        """Test service request from MiraUniversalBar Connect with Concierge click"""
        payload = {
            "type": "whatsapp_intent",
            "pillar": "care",
            "source": "mira_universal_bar",
            "customer": {
                "name": "TEST_UniversalBar User",
                "email": "test_ub@test.com",
                "phone": ""
            },
            "details": {
                "message": "[WhatsApp Intent] User clicked Connect with Concierge from Universal Search Bar",
                "pet_name": "Meister",
                "channel": "whatsapp",
                "source_component": "MiraUniversalBar"
            },
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/service-requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        print(f"✅ MiraUniversalBar ticket created: {data.get('ticket_id')}")
        
        return data.get("ticket_id")


class TestAdminNotifications:
    """Tests to verify tickets appear in admin notifications"""
    
    def test_admin_can_see_whatsapp_tickets(self):
        """Verify admin can see whatsapp_intent tickets in notifications"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications?unread=true&limit=20",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200
        
        data = response.json()
        notifications = data.get("notifications", [])
        
        # Filter for whatsapp_intent type
        whatsapp_notifications = [n for n in notifications if n.get("type") == "whatsapp_intent"]
        
        assert len(whatsapp_notifications) > 0, "No whatsapp_intent notifications found"
        print(f"✅ Found {len(whatsapp_notifications)} whatsapp_intent notifications in admin")
        
        # Check for different source components
        source_components = set()
        for n in whatsapp_notifications:
            sc = n.get("details", {}).get("source_component")
            if sc:
                source_components.add(sc)
        
        print(f"✅ Source components found: {source_components}")
        
        return whatsapp_notifications
    
    def test_notification_has_correct_fields(self):
        """Verify notification has all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications?unread=true&limit=5",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200
        
        data = response.json()
        notifications = data.get("notifications", [])
        
        # Get first whatsapp_intent notification
        whatsapp_notif = None
        for n in notifications:
            if n.get("type") == "whatsapp_intent":
                whatsapp_notif = n
                break
        
        if not whatsapp_notif:
            pytest.skip("No whatsapp_intent notification found")
        
        # Verify required fields
        assert "id" in whatsapp_notif
        assert "type" in whatsapp_notif
        assert "pillar" in whatsapp_notif
        assert "title" in whatsapp_notif
        assert "message" in whatsapp_notif
        assert "ticket_id" in whatsapp_notif
        assert "customer" in whatsapp_notif
        assert "details" in whatsapp_notif
        assert "link" in whatsapp_notif
        assert "created_at" in whatsapp_notif
        
        # Verify details has required fields
        details = whatsapp_notif.get("details", {})
        assert "message" in details
        assert "channel" in details
        assert details.get("channel") == "whatsapp"
        assert "source_component" in details
        
        print(f"✅ Notification {whatsapp_notif['id']} has all required fields")


class TestAdminVerification:
    """Verify admin authentication works"""
    
    def test_admin_verify(self):
        """Test admin verify endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/verify", auth=ADMIN_AUTH)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("valid") == True
        assert data.get("username") == "aditya"
        print(f"✅ Admin authentication verified")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
