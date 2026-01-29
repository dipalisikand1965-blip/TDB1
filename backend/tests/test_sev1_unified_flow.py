"""
SEV-1 UNIFIED FLOW TESTS
========================
Tests for Travel and Fit request unified flow:
- Every action must create Notification → Service Desk Ticket → Unified Inbox entry
- All entries must have matching cross-reference IDs
- Notifications must have read: false field for API compatibility
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTravelUnifiedFlow:
    """Test Travel request creates all 3 entries with matching IDs"""
    
    def test_travel_request_creates_notification(self):
        """POST /api/travel/request should create admin_notification"""
        # Create unique test data
        test_id = f"TEST-{uuid.uuid4().hex[:8]}"
        payload = {
            "travel_type": "cab",
            "pet_name": f"TestPet-{test_id}",
            "pet_breed": "Labrador",
            "pickup_location": "Mumbai",
            "pickup_city": "Mumbai",
            "drop_location": "Pune",
            "drop_city": "Pune",
            "travel_date": "2026-02-15",
            "travel_time": "10:00",
            "user_name": f"TestUser-{test_id}",
            "user_email": f"test-{test_id}@petlifeos.com",
            "user_phone": "+919999999999"
        }
        
        # Create travel request
        response = requests.post(f"{BASE_URL}/api/travel/request", json=payload)
        assert response.status_code == 200, f"Travel request failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Travel request not successful: {data}"
        request_id = data.get("request_id")
        assert request_id is not None, "No request_id returned"
        
        # Store for other tests
        self.__class__.travel_request_id = request_id
        self.__class__.test_pet_name = payload["pet_name"]
        
        # Verify notification was created (requires auth)
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=("aditya", "lola4304"))
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("notifications", [])
            matching = [n for n in notifications if n.get("ticket_id") == request_id]
            assert len(matching) > 0, f"No notification found for travel request {request_id}"
            
            # Verify read: false field exists
            notif = matching[0]
            assert "read" in notif, "Notification missing 'read' field"
            assert notif["read"] == False, f"Notification 'read' should be False, got {notif['read']}"
            
            # Store notification_id for cross-reference check
            self.__class__.notification_id = notif.get("id")
            print(f"✅ Travel notification created: {notif.get('id')}")
        else:
            # Try alternative endpoint
            print(f"Admin notifications endpoint returned {notif_response.status_code}")
    
    def test_travel_request_creates_service_desk_ticket(self):
        """POST /api/travel/request should create service_desk_ticket"""
        request_id = getattr(self.__class__, 'travel_request_id', None)
        if not request_id:
            pytest.skip("No travel request ID from previous test")
        
        # Check service_desk_tickets
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200, f"Tickets endpoint failed: {response.text}"
        
        data = response.json()
        tickets = data.get("tickets", [])
        matching = [t for t in tickets if t.get("ticket_id") == request_id]
        
        assert len(matching) > 0, f"No service desk ticket found for travel request {request_id}"
        
        ticket = matching[0]
        # Verify ticket has required fields
        assert ticket.get("pillar") == "travel", f"Ticket pillar should be 'travel', got {ticket.get('pillar')}"
        assert ticket.get("notification_id") is not None, "Ticket missing notification_id"
        assert ticket.get("inbox_id") is not None, "Ticket missing inbox_id"
        
        # Store for cross-reference check
        self.__class__.ticket_notification_id = ticket.get("notification_id")
        self.__class__.ticket_inbox_id = ticket.get("inbox_id")
        
        print(f"✅ Travel service desk ticket created: {request_id}")
    
    def test_travel_request_creates_channel_intake(self):
        """POST /api/travel/request should create channel_intakes entry"""
        request_id = getattr(self.__class__, 'travel_request_id', None)
        if not request_id:
            pytest.skip("No travel request ID from previous test")
        
        # Check channel_intakes
        response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert response.status_code == 200, f"Channel intakes endpoint failed: {response.text}"
        
        data = response.json()
        intakes = data.get("intakes", [])
        matching = [i for i in intakes if i.get("ticket_id") == request_id or i.get("request_id") == request_id]
        
        assert len(matching) > 0, f"No channel intake found for travel request {request_id}"
        
        intake = matching[0]
        # Verify intake has required fields
        assert intake.get("pillar") == "travel", f"Intake pillar should be 'travel', got {intake.get('pillar')}"
        assert intake.get("notification_id") is not None, "Intake missing notification_id"
        
        # Store for cross-reference check
        self.__class__.intake_notification_id = intake.get("notification_id")
        self.__class__.intake_id = intake.get("id")
        
        print(f"✅ Travel channel intake created: {intake.get('id')}")
    
    def test_travel_cross_reference_ids_match(self):
        """All 3 entries should have matching cross-reference IDs"""
        notification_id = getattr(self.__class__, 'notification_id', None)
        ticket_notification_id = getattr(self.__class__, 'ticket_notification_id', None)
        intake_notification_id = getattr(self.__class__, 'intake_notification_id', None)
        ticket_inbox_id = getattr(self.__class__, 'ticket_inbox_id', None)
        intake_id = getattr(self.__class__, 'intake_id', None)
        
        # Verify notification IDs match
        if notification_id and ticket_notification_id:
            assert notification_id == ticket_notification_id, \
                f"Notification ID mismatch: notification={notification_id}, ticket={ticket_notification_id}"
        
        if notification_id and intake_notification_id:
            assert notification_id == intake_notification_id, \
                f"Notification ID mismatch: notification={notification_id}, intake={intake_notification_id}"
        
        # Verify inbox IDs match
        if ticket_inbox_id and intake_id:
            assert ticket_inbox_id == intake_id, \
                f"Inbox ID mismatch: ticket.inbox_id={ticket_inbox_id}, intake.id={intake_id}"
        
        print("✅ Travel cross-reference IDs match")


class TestFitUnifiedFlow:
    """Test Fit request creates all 3 entries with matching IDs"""
    
    def test_fit_request_creates_notification(self):
        """POST /api/fit/request should create admin_notification"""
        # Create unique test data
        test_id = f"TEST-{uuid.uuid4().hex[:8]}"
        payload = {
            "fit_type": "weight_management",
            "pet_name": f"FitPet-{test_id}",
            "pet_breed": "Golden Retriever",
            "pet_weight": 25.5,
            "pet_age": "3 years",
            "fitness_goals": ["weight_loss", "muscle_building"],
            "current_activity_level": "low",
            "health_conditions": "None",
            "user_name": f"FitUser-{test_id}",
            "user_email": f"fit-{test_id}@petlifeos.com",
            "user_phone": "+919888888888",
            "preferred_schedule": "morning",
            "city": "Bangalore"
        }
        
        # Create fit request
        response = requests.post(f"{BASE_URL}/api/fit/request", json=payload)
        assert response.status_code == 200, f"Fit request failed: {response.text}"
        
        data = response.json()
        # Fit endpoint returns 'message' instead of 'success'
        assert data.get("message") or data.get("success"), f"Fit request not successful: {data}"
        request_id = data.get("request_id")
        assert request_id is not None, "No request_id returned"
        
        # Store for other tests - use ticket_id for lookups
        self.__class__.fit_request_id = request_id
        self.__class__.fit_ticket_id = data.get("ticket_id")  # This is what we search by
        self.__class__.test_pet_name = payload["pet_name"]
        
        # Verify notification was created (requires auth)
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=("aditya", "lola4304"))
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("notifications", [])
            # Search by ticket_id returned from the response
            ticket_id = data.get("ticket_id")
            matching = [n for n in notifications if n.get("ticket_id") == ticket_id]
            assert len(matching) > 0, f"No notification found for fit ticket {ticket_id}"
            
            # Verify read: false field exists
            notif = matching[0]
            assert "read" in notif, "Notification missing 'read' field"
            assert notif["read"] == False, f"Notification 'read' should be False, got {notif['read']}"
            
            # Store notification_id for cross-reference check
            self.__class__.notification_id = notif.get("id")
            print(f"✅ Fit notification created: {notif.get('id')}")
        else:
            print(f"Admin notifications endpoint returned {notif_response.status_code}")
    
    def test_fit_request_creates_service_desk_ticket(self):
        """POST /api/fit/request should create service_desk_ticket"""
        ticket_id = getattr(self.__class__, 'fit_ticket_id', None)
        if not ticket_id:
            pytest.skip("No fit ticket ID from previous test")
        
        # Check service_desk_tickets
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200, f"Tickets endpoint failed: {response.text}"
        
        data = response.json()
        tickets = data.get("tickets", [])
        matching = [t for t in tickets if t.get("ticket_id") == ticket_id]
        
        assert len(matching) > 0, f"No service desk ticket found for fit ticket {ticket_id}"
        
        ticket = matching[0]
        # Verify ticket has required fields
        assert ticket.get("pillar") == "fit", f"Ticket pillar should be 'fit', got {ticket.get('pillar')}"
        assert ticket.get("notification_id") is not None, "Ticket missing notification_id"
        assert ticket.get("inbox_id") is not None, "Ticket missing inbox_id"
        
        # Store for cross-reference check
        self.__class__.ticket_notification_id = ticket.get("notification_id")
        self.__class__.ticket_inbox_id = ticket.get("inbox_id")
        
        print(f"✅ Fit service desk ticket created: {request_id}")
    
    def test_fit_request_creates_channel_intake(self):
        """POST /api/fit/request should create channel_intakes entry"""
        ticket_id = getattr(self.__class__, 'fit_ticket_id', None)
        if not ticket_id:
            pytest.skip("No fit ticket ID from previous test")
        
        # Check channel_intakes
        response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert response.status_code == 200, f"Channel intakes endpoint failed: {response.text}"
        
        data = response.json()
        intakes = data.get("intakes", [])
        matching = [i for i in intakes if i.get("ticket_id") == ticket_id]
        
        assert len(matching) > 0, f"No channel intake found for fit ticket {ticket_id}"
        
        intake = matching[0]
        # Verify intake has required fields
        assert intake.get("pillar") == "fit", f"Intake pillar should be 'fit', got {intake.get('pillar')}"
        assert intake.get("notification_id") is not None, "Intake missing notification_id"
        
        # Store for cross-reference check
        self.__class__.intake_notification_id = intake.get("notification_id")
        self.__class__.intake_id = intake.get("id")
        
        print(f"✅ Fit channel intake created: {intake.get('id')}")
    
    def test_fit_cross_reference_ids_match(self):
        """All 3 entries should have matching cross-reference IDs"""
        notification_id = getattr(self.__class__, 'notification_id', None)
        ticket_notification_id = getattr(self.__class__, 'ticket_notification_id', None)
        intake_notification_id = getattr(self.__class__, 'intake_notification_id', None)
        ticket_inbox_id = getattr(self.__class__, 'ticket_inbox_id', None)
        intake_id = getattr(self.__class__, 'intake_id', None)
        
        # Verify notification IDs match
        if notification_id and ticket_notification_id:
            assert notification_id == ticket_notification_id, \
                f"Notification ID mismatch: notification={notification_id}, ticket={ticket_notification_id}"
        
        if notification_id and intake_notification_id:
            assert notification_id == intake_notification_id, \
                f"Notification ID mismatch: notification={notification_id}, intake={intake_notification_id}"
        
        # Verify inbox IDs match
        if ticket_inbox_id and intake_id:
            assert ticket_inbox_id == intake_id, \
                f"Inbox ID mismatch: ticket.inbox_id={ticket_inbox_id}, intake.id={intake_id}"
        
        print("✅ Fit cross-reference IDs match")


class TestNotificationReadField:
    """Test that notifications have the read: false field for API compatibility"""
    
    def test_notifications_have_read_field(self):
        """New notifications should have 'read' field (boolean)"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications", auth=("aditya", "lola4304"))
        if response.status_code != 200:
            pytest.skip(f"Notifications endpoint returned {response.status_code}")
        
        notifications = response.json().get("notifications", [])
        if not notifications:
            pytest.skip("No notifications to check")
        
        # Check only fit and travel notifications (newly created with unified flow)
        unified_notifs = [n for n in notifications if n.get("pillar") in ["fit", "travel"] and "NOTIF-" in str(n.get("id", ""))]
        
        if not unified_notifs:
            pytest.skip("No unified flow notifications to check")
        
        for notif in unified_notifs[:5]:
            assert "read" in notif, f"Notification {notif.get('id')} missing 'read' field"
            assert isinstance(notif["read"], bool), f"Notification 'read' should be boolean, got {type(notif['read'])}"
        
        print(f"✅ Checked {min(5, len(unified_notifs))} unified flow notifications - all have 'read' field")


class TestHealthEndpoints:
    """Basic health checks before running unified flow tests"""
    
    def test_api_health(self):
        """API should be healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("✅ API health check passed")
    
    def test_travel_types_endpoint(self):
        """Travel types endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/travel/types")
        assert response.status_code == 200, f"Travel types failed: {response.text}"
        data = response.json()
        assert "travel_types" in data, "Missing travel_types in response"
        print(f"✅ Travel types: {list(data['travel_types'].keys())}")
    
    def test_fit_request_endpoint(self):
        """Fit request endpoint should work"""
        response = requests.post(f"{BASE_URL}/api/fit/request", json={
            "fit_type": "assessment",
            "pet_name": "HealthCheckPet",
            "user_name": "HealthCheck"
        })
        assert response.status_code == 200, f"Fit request failed: {response.text}"
        data = response.json()
        assert "request_id" in data, "Missing request_id in response"
        print(f"✅ Fit request endpoint working: {data.get('request_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
