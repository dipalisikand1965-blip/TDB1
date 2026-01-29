"""
Test Suite: Unified Signal Flow - Mobile Viewport Testing
=========================================================
Tests the unified flow (Notification → Service Desk Ticket → Unified Inbox)
for Care, Fit, Travel, and Enjoy pillars.

All endpoints should return: ticket_id, notification_id, inbox_id
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


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """GET /api/health should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✅ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
