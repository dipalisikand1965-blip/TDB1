"""
Test Unified Signal Flow - CRITICAL SYSTEM REQUIREMENT
=======================================================
All signals must flow through: Notification → Service Desk → Unified Inbox → Contextual Views

This test verifies that POST /api/concierge/request creates entries in:
1. admin_notifications collection
2. service_desk_tickets collection
3. channel_intakes collection (unified inbox)

All entries should have matching cross-reference IDs.
"""

import pytest
import requests
import os
import time
import uuid
from datetime import datetime
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestUnifiedSignalFlow:
    """Test the unified signal flow for concierge requests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_email = f"test_unified_{uuid.uuid4().hex[:6]}@test.com"
        self.test_name = f"Test User {uuid.uuid4().hex[:4]}"
        self.test_phone = "9876543210"
        self.test_pillar = "enjoy"
        self.test_message = f"Test unified flow request - {datetime.now().isoformat()}"
        self.auth = HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        
    def test_01_concierge_request_creates_all_entries(self):
        """
        CRITICAL TEST: POST /api/concierge/request should create entries in:
        1. admin_notifications
        2. service_desk_tickets
        3. channel_intakes (unified inbox)
        """
        # Create a concierge request
        payload = {
            "pillar": self.test_pillar,
            "experience_id": "test-exp-001",
            "experience_name": "Test Experience",
            "name": self.test_name,
            "email": self.test_email,
            "phone": self.test_phone,
            "message": self.test_message,
            "preferred_contact": "whatsapp",
            "source": "test_unified_flow"
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        
        # Verify response
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"\n✅ Concierge request created successfully")
        print(f"   Response: {data}")
        
        # Verify all IDs are returned
        assert data.get("success") == True, "Response should indicate success"
        assert "request_id" in data, "Response should contain request_id"
        assert "ticket_id" in data, "Response should contain ticket_id"
        assert "notification_id" in data, "Response should contain notification_id"
        assert "inbox_id" in data, "Response should contain inbox_id"
        
        print(f"\n📋 IDs returned:")
        print(f"   request_id: {data.get('request_id')}")
        print(f"   ticket_id: {data.get('ticket_id')}")
        print(f"   notification_id: {data.get('notification_id')}")
        print(f"   inbox_id: {data.get('inbox_id')}")
        
    def test_02_notification_created_in_admin_notifications(self):
        """Verify notification was created in admin_notifications collection"""
        # First create a request to get the IDs
        payload = {
            "pillar": "enjoy",
            "experience_name": "Notification Test",
            "name": f"Notif Test {uuid.uuid4().hex[:4]}",
            "email": f"notif_test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "9876543211",
            "message": "Testing notification creation",
            "source": "test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        assert create_response.status_code == 200
        
        data = create_response.json()
        notification_id = data.get("notification_id")
        
        # Now check admin notifications endpoint (requires auth)
        response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=self.auth)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        notifications_data = response.json()
        notifications = notifications_data.get("notifications", [])
        
        # Find our notification
        found_notification = None
        for notif in notifications:
            if notif.get("id") == notification_id:
                found_notification = notif
                break
        
        assert found_notification is not None, f"Notification {notification_id} not found in admin_notifications"
        
        print(f"\n✅ Notification found in admin_notifications:")
        print(f"   ID: {found_notification.get('id')}")
        print(f"   Type: {found_notification.get('type')}")
        print(f"   Title: {found_notification.get('title')}")
        print(f"   Status: {found_notification.get('status')}")
        
        # Verify notification has correct cross-references
        assert found_notification.get("ticket_id") == data.get("ticket_id"), "Notification should reference ticket_id"
        assert found_notification.get("inbox_id") == data.get("inbox_id"), "Notification should reference inbox_id"
        
    def test_03_ticket_created_in_service_desk(self):
        """Verify ticket was created in service_desk_tickets collection"""
        # Create a request
        payload = {
            "pillar": "care",
            "experience_name": "Service Desk Test",
            "name": f"SD Test {uuid.uuid4().hex[:4]}",
            "email": f"sd_test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "9876543212",
            "message": "Testing service desk ticket creation",
            "source": "test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        assert create_response.status_code == 200
        
        data = create_response.json()
        ticket_id = data.get("ticket_id")
        
        # Check tickets endpoint
        response = requests.get(f"{BASE_URL}/api/tickets")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        tickets_data = response.json()
        tickets = tickets_data.get("tickets", [])
        
        # Find our ticket
        found_ticket = None
        for ticket in tickets:
            if ticket.get("ticket_id") == ticket_id:
                found_ticket = ticket
                break
        
        assert found_ticket is not None, f"Ticket {ticket_id} not found in service_desk_tickets"
        
        print(f"\n✅ Ticket found in service_desk_tickets:")
        print(f"   ticket_id: {found_ticket.get('ticket_id')}")
        print(f"   category: {found_ticket.get('category')}")
        print(f"   status: {found_ticket.get('status')}")
        print(f"   subject: {found_ticket.get('subject')}")
        
        # Verify ticket has correct cross-references
        assert found_ticket.get("notification_id") == data.get("notification_id"), "Ticket should reference notification_id"
        assert found_ticket.get("inbox_id") == data.get("inbox_id"), "Ticket should reference inbox_id"
        
    def test_04_entry_created_in_channel_intakes(self):
        """Verify entry was created in channel_intakes (unified inbox) collection"""
        # Create a request
        payload = {
            "pillar": "travel",
            "experience_name": "Inbox Test",
            "name": f"Inbox Test {uuid.uuid4().hex[:4]}",
            "email": f"inbox_test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "9876543213",
            "message": "Testing unified inbox entry creation",
            "source": "test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        assert create_response.status_code == 200
        
        data = create_response.json()
        inbox_id = data.get("inbox_id")
        
        # Check channel intakes endpoint
        response = requests.get(f"{BASE_URL}/api/channels/intakes")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        intakes_data = response.json()
        intakes = intakes_data.get("intakes", [])
        
        # Find our inbox entry
        found_intake = None
        for intake in intakes:
            if intake.get("id") == inbox_id:
                found_intake = intake
                break
        
        assert found_intake is not None, f"Inbox entry {inbox_id} not found in channel_intakes"
        
        print(f"\n✅ Entry found in channel_intakes (unified inbox):")
        print(f"   id: {found_intake.get('id')}")
        print(f"   channel: {found_intake.get('channel')}")
        print(f"   status: {found_intake.get('status')}")
        print(f"   pillar: {found_intake.get('pillar')}")
        
        # Verify inbox entry has correct cross-references
        assert found_intake.get("ticket_id") == data.get("ticket_id"), "Inbox entry should reference ticket_id"
        assert found_intake.get("notification_id") == data.get("notification_id"), "Inbox entry should reference notification_id"
        
    def test_05_all_ids_match_across_collections(self):
        """
        CRITICAL: Verify all IDs match across all 3 collections
        This ensures the unified flow is working correctly
        """
        # Create a request
        unique_marker = uuid.uuid4().hex[:8]
        payload = {
            "pillar": "enjoy",
            "experience_name": f"Cross-Reference Test {unique_marker}",
            "name": f"XRef Test {unique_marker}",
            "email": f"xref_test_{unique_marker}@test.com",
            "phone": "9876543214",
            "message": f"Testing cross-reference matching - {unique_marker}",
            "source": "test_xref"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        assert create_response.status_code == 200
        
        data = create_response.json()
        
        request_id = data.get("request_id")
        ticket_id = data.get("ticket_id")
        notification_id = data.get("notification_id")
        inbox_id = data.get("inbox_id")
        
        print(f"\n📋 Testing cross-references for:")
        print(f"   request_id: {request_id}")
        print(f"   ticket_id: {ticket_id}")
        print(f"   notification_id: {notification_id}")
        print(f"   inbox_id: {inbox_id}")
        
        # Get notification (requires auth)
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=self.auth)
        assert notif_response.status_code == 200, f"Notifications endpoint failed: {notif_response.text}"
        notifications = notif_response.json().get("notifications", [])
        notification = next((n for n in notifications if n.get("id") == notification_id), None)
        
        # Get ticket
        ticket_response = requests.get(f"{BASE_URL}/api/tickets")
        assert ticket_response.status_code == 200
        tickets = ticket_response.json().get("tickets", [])
        ticket = next((t for t in tickets if t.get("ticket_id") == ticket_id), None)
        
        # Get inbox entry
        inbox_response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert inbox_response.status_code == 200
        intakes = inbox_response.json().get("intakes", [])
        inbox_entry = next((i for i in intakes if i.get("id") == inbox_id), None)
        
        # Verify all entries exist
        assert notification is not None, f"Notification {notification_id} not found"
        assert ticket is not None, f"Ticket {ticket_id} not found"
        assert inbox_entry is not None, f"Inbox entry {inbox_id} not found"
        
        print(f"\n✅ All entries found in their respective collections")
        
        # Verify cross-references in notification
        print(f"\n📌 Notification cross-references:")
        print(f"   notification.ticket_id: {notification.get('ticket_id')} (expected: {ticket_id})")
        print(f"   notification.inbox_id: {notification.get('inbox_id')} (expected: {inbox_id})")
        assert notification.get("ticket_id") == ticket_id, "Notification ticket_id mismatch"
        assert notification.get("inbox_id") == inbox_id, "Notification inbox_id mismatch"
        
        # Verify cross-references in ticket
        print(f"\n📌 Ticket cross-references:")
        print(f"   ticket.notification_id: {ticket.get('notification_id')} (expected: {notification_id})")
        print(f"   ticket.inbox_id: {ticket.get('inbox_id')} (expected: {inbox_id})")
        assert ticket.get("notification_id") == notification_id, "Ticket notification_id mismatch"
        assert ticket.get("inbox_id") == inbox_id, "Ticket inbox_id mismatch"
        
        # Verify cross-references in inbox entry
        print(f"\n📌 Inbox entry cross-references:")
        print(f"   inbox.ticket_id: {inbox_entry.get('ticket_id')} (expected: {ticket_id})")
        print(f"   inbox.notification_id: {inbox_entry.get('notification_id')} (expected: {notification_id})")
        assert inbox_entry.get("ticket_id") == ticket_id, "Inbox ticket_id mismatch"
        assert inbox_entry.get("notification_id") == notification_id, "Inbox notification_id mismatch"
        
        print(f"\n✅ ALL CROSS-REFERENCES MATCH - Unified flow is working correctly!")
        
    def test_06_enjoy_pillar_request_flows_correctly(self):
        """
        Specific test for ENJOY pillar requests (the original bug report)
        'Ask Concierge' requests for Enjoy pillar should appear in all 3 places
        """
        payload = {
            "pillar": "enjoy",
            "experience_id": "enjoy-exp-001",
            "experience_name": "Pet Meetup Event",
            "name": "Enjoy Test User",
            "email": f"enjoy_test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "9876543215",
            "message": "I want to book a pet meetup event for my dog",
            "preferred_contact": "whatsapp",
            "source": "ask_concierge"
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        print(f"\n🎾 ENJOY Pillar Request Test:")
        print(f"   request_id: {data.get('request_id')}")
        print(f"   ticket_id: {data.get('ticket_id')}")
        print(f"   notification_id: {data.get('notification_id')}")
        print(f"   inbox_id: {data.get('inbox_id')}")
        
        # Verify all IDs are present
        assert data.get("request_id") is not None, "Missing request_id"
        assert data.get("ticket_id") is not None, "Missing ticket_id"
        assert data.get("notification_id") is not None, "Missing notification_id"
        assert data.get("inbox_id") is not None, "Missing inbox_id"
        
        # Verify entries exist in all collections (with auth for notifications)
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=self.auth)
        assert notif_response.status_code == 200, f"Notifications endpoint failed: {notif_response.text}"
        notifications = notif_response.json().get("notifications", [])
        notification = next((n for n in notifications if n.get("id") == data.get("notification_id")), None)
        assert notification is not None, "Enjoy request notification not found"
        
        ticket_response = requests.get(f"{BASE_URL}/api/tickets")
        assert ticket_response.status_code == 200
        tickets = ticket_response.json().get("tickets", [])
        ticket = next((t for t in tickets if t.get("ticket_id") == data.get("ticket_id")), None)
        assert ticket is not None, "Enjoy request ticket not found"
        
        inbox_response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert inbox_response.status_code == 200
        intakes = inbox_response.json().get("intakes", [])
        inbox_entry = next((i for i in intakes if i.get("id") == data.get("inbox_id")), None)
        assert inbox_entry is not None, "Enjoy request inbox entry not found"
        
        print(f"\n✅ ENJOY pillar request correctly appears in:")
        print(f"   ✓ admin_notifications")
        print(f"   ✓ service_desk_tickets")
        print(f"   ✓ channel_intakes (unified inbox)")


class TestEndpointsExist:
    """Verify all required endpoints exist and return data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth"""
        self.auth = HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_admin_notifications_endpoint(self):
        """GET /api/admin/notifications should return notifications"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=self.auth)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should contain 'notifications' key"
        print(f"\n✅ GET /api/admin/notifications - {len(data.get('notifications', []))} notifications found")
        
    def test_tickets_endpoint(self):
        """GET /api/tickets should return tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tickets" in data, "Response should contain 'tickets' key"
        print(f"\n✅ GET /api/tickets - {len(data.get('tickets', []))} tickets found")
        
    def test_channel_intakes_endpoint(self):
        """GET /api/channels/intakes should return inbox entries"""
        response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "intakes" in data, "Response should contain 'intakes' key"
        print(f"\n✅ GET /api/channels/intakes - {len(data.get('intakes', []))} intakes found")
        
    def test_concierge_request_endpoint(self):
        """POST /api/concierge/request should accept requests"""
        payload = {
            "pillar": "general",
            "name": "Endpoint Test",
            "email": f"endpoint_test_{uuid.uuid4().hex[:6]}@test.com",
            "message": "Testing endpoint availability"
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge/request", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print(f"\n✅ POST /api/concierge/request - Endpoint working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
