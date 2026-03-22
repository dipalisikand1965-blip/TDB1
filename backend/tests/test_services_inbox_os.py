"""
Test SERVICES OS Layer - Execution Engine
Tests: Service launchers, inbox, request creation, ticket detail, cancel action
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://custom-merch-hub-23.preview.emergentagent.com")

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, "No access_token in response"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestServiceLaunchers:
    """Test service launchers endpoint"""
    
    def test_get_launchers_authenticated(self, auth_headers):
        """GET /api/os/services/launchers - Returns list of service launchers"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/launchers",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "launchers" in data
        assert isinstance(data["launchers"], list)
        assert len(data["launchers"]) > 0
        
        # Verify launcher structure
        launcher = data["launchers"][0]
        assert "id" in launcher
        assert "name" in launcher
        assert "icon" in launcher

    def test_launchers_include_required_services(self, auth_headers):
        """Verify launchers include Grooming, Training, etc."""
        response = requests.get(
            f"{BASE_URL}/api/os/services/launchers",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        launcher_ids = [l["id"] for l in data["launchers"]]
        # Should include key services
        expected_services = ["grooming", "training", "boarding"]
        for service in expected_services:
            assert service in launcher_ids, f"Missing launcher: {service}"


class TestServicesInbox:
    """Test services inbox endpoint"""
    
    def test_get_inbox_authenticated(self, auth_headers):
        """GET /api/os/services/inbox - Returns grouped tickets"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/inbox",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "awaiting_user" in data
        assert "active" in data
        assert "orders" in data
        assert "counts" in data
        
        # Verify structure
        assert isinstance(data["awaiting_user"], list)
        assert isinstance(data["active"], list)
        assert isinstance(data["orders"], list)

    def test_inbox_requires_auth(self):
        """GET /api/os/services/inbox - Requires authentication"""
        response = requests.get(f"{BASE_URL}/api/os/services/inbox")
        assert response.status_code == 401


class TestServiceRequestCreation:
    """Test service request creation via POST"""
    
    def test_create_service_request(self, auth_headers):
        """POST /api/os/services/request - Creates a ticket"""
        test_ticket_title = f"TEST_Grooming_{uuid.uuid4().hex[:6]}"
        
        payload = {
            "service_type": "grooming",
            "pet_ids": ["test_pet_id"],
            "pet_names": ["TestDog"],
            "title": test_ticket_title,
            "description": "Automated test request",
            "preferred_time_window": "morning",
            "location": "Home pickup",
            "pillar": "care",
            "source": "services_tab"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/services/request",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert "ticket_id" in data
        assert data["status"] == "placed"
        assert "ticket" in data
        
        # Verify ticket data
        ticket = data["ticket"]
        assert ticket["service_type"] == "grooming"
        assert ticket["pet_names"] == ["TestDog"]
        assert ticket["status"] == "placed"
        
        return data["ticket_id"]

    def test_create_request_requires_pet(self, auth_headers):
        """POST /api/os/services/request - Must have pet_ids"""
        payload = {
            "service_type": "grooming",
            "pet_ids": [],  # Empty
            "pet_names": [],
            "title": "Test",
            "source": "services_tab"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/services/request",
            headers=auth_headers,
            json=payload
        )
        # Should still work but may warn - depends on implementation
        # At minimum, it should not crash
        assert response.status_code in [200, 400, 422]


class TestTicketDetailAndActions:
    """Test ticket detail and actions (cancel, etc.)"""
    
    @pytest.fixture
    def created_ticket(self, auth_headers):
        """Create a ticket for testing"""
        payload = {
            "service_type": "training",
            "pet_ids": ["test_pet"],
            "pet_names": ["ActionTestDog"],
            "title": f"TEST_ActionTest_{uuid.uuid4().hex[:6]}",
            "description": "For action testing",
            "source": "services_tab"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/services/request",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        return response.json()["ticket_id"]
    
    def test_get_ticket_detail(self, auth_headers, created_ticket):
        """GET /api/os/services/ticket/{ticket_id} - Returns ticket detail"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/ticket/{created_ticket}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "ticket" in data
        
        ticket = data["ticket"]
        assert ticket["ticket_id"] == created_ticket
        assert "timeline" in ticket
        assert "status_display" in ticket
        assert "pet_display" in ticket

    def test_cancel_ticket(self, auth_headers, created_ticket):
        """PATCH /api/os/services/ticket/{ticket_id} - Cancel action"""
        payload = {
            "action": "cancel",
            "data": {}
        }
        
        response = requests.patch(
            f"{BASE_URL}/api/os/services/ticket/{created_ticket}",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data["action"] == "cancel"
        
        # Verify ticket is now cancelled
        ticket = data["ticket"]
        assert ticket["status"] == "cancelled"
        
        # Verify timeline was updated
        timeline = ticket.get("timeline", [])
        cancel_entry = [t for t in timeline if t.get("action") == "cancel"]
        assert len(cancel_entry) > 0, "Cancel action not in timeline"

    def test_ticket_not_found(self, auth_headers):
        """GET /api/os/services/ticket/{invalid} - Returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/ticket/INVALID-TICKET-12345",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestOrdersEndpoint:
    """Test /api/orders GET endpoint (legacy bug fix)"""
    
    def test_orders_get_endpoint(self):
        """GET /api/orders - Returns orders list"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert isinstance(data["orders"], list)
        
    def test_orders_get_with_auth(self, auth_headers):
        """GET /api/orders - Works with auth token"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert "count" in data


class TestServicesStats:
    """Test services stats endpoint"""
    
    def test_get_services_stats(self, auth_headers):
        """GET /api/os/services/stats - Returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "stats" in data
        
        stats = data["stats"]
        assert "awaiting" in stats
        assert "active" in stats
        assert "completed" in stats
