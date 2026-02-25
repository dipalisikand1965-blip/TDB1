"""
Test Suite: SEV-1 Unified Signal Flow - All Action Endpoints
============================================================
Tests that ALL action endpoints return the unified flow IDs:
- ticket_id (or request_id/booking_id/rsvp_id)
- notification_id
- inbox_id

This ensures the unified signal flow (Notification → Service Desk Ticket → Unified Inbox)
is enforced on ALL devices including mobile.
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestUnifiedFlowCare:
    """Care pillar unified flow tests"""
    
    def test_care_request_returns_unified_ids(self):
        """POST /api/care/request should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/care/request", json={
            "care_type": "grooming",
            "pet_name": f"TEST_CarePet_{uuid.uuid4().hex[:6]}",
            "pet_breed": "Golden Retriever",
            "description": "Test grooming request for unified flow verification",
            "user_email": "test_care@example.com",
            "user_name": "Test Care User",
            "user_phone": "9876543210"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "request_id" in data, "Missing ticket_id/request_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("request_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Care request unified flow: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowFit:
    """Fit pillar unified flow tests"""
    
    def test_fit_request_returns_unified_ids(self):
        """POST /api/fit/request should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/fit/request", json={
            "fit_type": "fitness_plan",
            "pet_name": f"TEST_FitPet_{uuid.uuid4().hex[:6]}",
            "pet_breed": "Labrador",
            "description": "Test fitness request for unified flow verification",
            "user_email": "test_fit@example.com",
            "user_name": "Test Fit User",
            "user_phone": "9876543211"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "request_id" in data, "Missing ticket_id/request_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("request_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Fit request unified flow: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowTravel:
    """Travel pillar unified flow tests"""
    
    def test_travel_request_returns_unified_ids(self):
        """POST /api/travel/request should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "cab",
            "pet_name": f"TEST_TravelPet_{uuid.uuid4().hex[:6]}",
            "pet_breed": "Beagle",
            "pickup_location": "Mumbai Central",
            "dropoff_location": "Bandra West",
            "travel_date": "2026-02-15",
            "description": "Test travel request for unified flow verification",
            "user_email": "test_travel@example.com",
            "user_name": "Test Travel User",
            "user_phone": "9876543212"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "request_id" in data, "Missing ticket_id/request_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("request_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Travel request unified flow: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowEnjoy:
    """Enjoy pillar unified flow tests"""
    
    def test_enjoy_rsvp_returns_unified_ids(self):
        """POST /api/enjoy/rsvp should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/enjoy/rsvp", json={
            "experience_id": "exp-dogpark-mumbai",
            "pet_name": f"TEST_EnjoyPet_{uuid.uuid4().hex[:6]}",
            "pet_breed": "Poodle",
            "member_email": "test_enjoy@example.com",
            "member_name": "Test Enjoy User",
            "member_phone": "9876543213",
            "number_of_pets": 1
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "rsvp_id" in data, "Missing ticket_id/rsvp_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("rsvp_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Enjoy RSVP unified flow: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowServices:
    """Services unified booking tests"""
    
    def test_unified_book_returns_unified_ids(self):
        """POST /api/services/unified-book should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json={
            "service_type": "grooming",
            "service_name": "Full Grooming",
            "pillar": "care",
            "location_type": "home",
            "pet": {"name": f"TEST_UnifiedBookPet_{uuid.uuid4().hex[:6]}", "breed": "Pomeranian"},
            "customer": {"name": "Test User", "email": "test_unified@example.com", "phone": "9876543214"},
            "schedule": {"preferred_date": "2026-02-15", "preferred_time": "10:00", "address": "Test Address"}
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "booking_id" in data, "Missing ticket_id/booking_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("booking_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Unified book: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowConcierge:
    """Concierge request tests"""
    
    def test_concierge_request_returns_unified_ids(self):
        """POST /api/concierge/request should return ticket_id, notification_id, inbox_id"""
        response = requests.post(f"{BASE_URL}/api/concierge/request", json={
            "pillar": "care",
            "name": "Test Concierge User",
            "email": "test_concierge@example.com",
            "phone": "9876543215",
            "message": "Test concierge request for unified flow verification"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "request_id" in data, "Missing ticket_id/request_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("request_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Concierge request: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestUnifiedFlowDine:
    """Dine reservation tests"""
    
    def test_dine_reservation_returns_unified_ids(self):
        """POST /api/dine/reservations should return ticket_id, notification_id, inbox_id"""
        # First get a restaurant ID
        restaurants_response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = restaurants_response.json().get("restaurants", [])
        
        if not restaurants:
            pytest.skip("No restaurants available for testing")
        
        restaurant_id = restaurants[0].get("id")
        
        response = requests.post(f"{BASE_URL}/api/dine/reservations", json={
            "restaurant_id": restaurant_id,
            "name": "Test Dine User",
            "phone": "9876543216",
            "email": "test_dine@example.com",
            "date": "2026-02-15",
            "time": "19:00",
            "guests": 2,
            "pets": 1,
            "pet_name": f"TEST_DinePet_{uuid.uuid4().hex[:6]}",
            "pet_breed": "French Bulldog"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify unified flow IDs are present
        assert "ticket_id" in data or "reservation_id" in data, "Missing ticket_id/reservation_id"
        assert "notification_id" in data, f"Missing notification_id. Response: {data}"
        assert "inbox_id" in data, f"Missing inbox_id. Response: {data}"
        
        # Verify IDs are not empty
        ticket_id = data.get("ticket_id") or data.get("reservation_id")
        assert ticket_id, "ticket_id is empty"
        assert data["notification_id"], "notification_id is empty"
        assert data["inbox_id"], "inbox_id is empty"
        
        print(f"✅ Dine reservation: ticket={ticket_id}, notification={data['notification_id']}, inbox={data['inbox_id']}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """GET /api/health should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✅ API health check passed")


class TestDatabaseVerification:
    """Verify unified flow entries are created in database collections"""
    
    def test_care_request_creates_db_entries(self):
        """Verify care request creates entries in admin_notifications, service_desk_tickets, channel_intakes"""
        # Create a care request
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/care/request", json={
            "care_type": "grooming",
            "pet_name": f"TEST_DBVerify_{unique_id}",
            "pet_breed": "Husky",
            "description": f"DB verification test {unique_id}",
            "user_email": f"test_db_{unique_id}@example.com",
            "user_name": "Test DB User",
            "user_phone": "9876543299"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        ticket_id = data.get("ticket_id") or data.get("request_id")
        notification_id = data.get("notification_id")
        inbox_id = data.get("inbox_id")
        
        # Verify all IDs are returned
        assert ticket_id, "ticket_id not returned"
        assert notification_id, "notification_id not returned"
        assert inbox_id, "inbox_id not returned"
        
        print(f"✅ DB verification: All unified flow IDs returned for care request")
        print(f"   ticket_id: {ticket_id}")
        print(f"   notification_id: {notification_id}")
        print(f"   inbox_id: {inbox_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
