"""
Test cases for Service Desk Lock and Delete functionality
Tests the new POST /{ticket_id}/lock and DELETE /{ticket_id} endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTicketLockDelete:
    """Test Lock and Delete functionality for Service Desk tickets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.base_url = BASE_URL
        self.headers = {"Content-Type": "application/json"}
        
    def test_create_ticket_for_testing(self):
        """Create a test ticket to use for lock/delete tests"""
        # Create a test ticket
        ticket_data = {
            "member": {
                "name": "TEST_Lock_Delete_User",
                "email": f"test_lock_delete_{uuid.uuid4().hex[:8]}@example.com",
                "phone": "9876543210"
            },
            "category": "inquiry",
            "urgency": "medium",
            "description": "TEST ticket for lock/delete functionality testing"
        }
        
        response = requests.post(
            f"{self.base_url}/api/tickets/",
            json=ticket_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "ticket" in data
        assert "ticket_id" in data["ticket"]
        
        # Store ticket_id for other tests
        self.test_ticket_id = data["ticket"]["ticket_id"]
        print(f"Created test ticket: {self.test_ticket_id}")
        return self.test_ticket_id
    
    def test_lock_ticket(self):
        """Test POST /{ticket_id}/lock - Lock a ticket"""
        # First create a ticket
        ticket_id = self.test_create_ticket_for_testing()
        
        # Lock the ticket
        lock_data = {"is_locked": True}
        response = requests.post(
            f"{self.base_url}/api/tickets/{ticket_id}/lock",
            json=lock_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to lock ticket: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("is_locked") == True
        print(f"Successfully locked ticket: {ticket_id}")
        
        # Verify ticket is locked by fetching it
        get_response = requests.get(f"{self.base_url}/api/tickets/{ticket_id}")
        if get_response.status_code == 200:
            ticket_data = get_response.json()
            if "ticket" in ticket_data:
                assert ticket_data["ticket"].get("is_locked") == True
                print(f"Verified ticket {ticket_id} is locked")
        
        return ticket_id
    
    def test_unlock_ticket(self):
        """Test POST /{ticket_id}/lock - Unlock a ticket"""
        # First create and lock a ticket
        ticket_id = self.test_lock_ticket()
        
        # Unlock the ticket
        unlock_data = {"is_locked": False}
        response = requests.post(
            f"{self.base_url}/api/tickets/{ticket_id}/lock",
            json=unlock_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to unlock ticket: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("is_locked") == False
        print(f"Successfully unlocked ticket: {ticket_id}")
        
        return ticket_id
    
    def test_delete_ticket(self):
        """Test DELETE /{ticket_id} - Delete a ticket"""
        # First create a ticket
        ticket_id = self.test_create_ticket_for_testing()
        
        # Delete the ticket
        response = requests.delete(
            f"{self.base_url}/api/tickets/{ticket_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to delete ticket: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"Successfully deleted ticket: {ticket_id}")
        
        # Verify ticket is deleted by trying to fetch it
        get_response = requests.get(f"{self.base_url}/api/tickets/{ticket_id}")
        # Should return 404 or empty
        if get_response.status_code == 200:
            ticket_data = get_response.json()
            # If ticket is returned, it should be empty or not found
            if "ticket" in ticket_data:
                assert ticket_data["ticket"] is None, "Ticket should be deleted"
        else:
            assert get_response.status_code == 404, "Deleted ticket should return 404"
        
        print(f"Verified ticket {ticket_id} is deleted")
    
    def test_lock_nonexistent_ticket(self):
        """Test locking a non-existent ticket returns 404"""
        fake_ticket_id = f"TKT-FAKE-{uuid.uuid4().hex[:8]}"
        
        lock_data = {"is_locked": True}
        response = requests.post(
            f"{self.base_url}/api/tickets/{fake_ticket_id}/lock",
            json=lock_data,
            headers=self.headers
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent ticket, got {response.status_code}"
        print(f"Correctly returned 404 for non-existent ticket: {fake_ticket_id}")
    
    def test_delete_nonexistent_ticket(self):
        """Test deleting a non-existent ticket returns 404"""
        fake_ticket_id = f"TKT-FAKE-{uuid.uuid4().hex[:8]}"
        
        response = requests.delete(
            f"{self.base_url}/api/tickets/{fake_ticket_id}",
            headers=self.headers
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent ticket, got {response.status_code}"
        print(f"Correctly returned 404 for non-existent ticket: {fake_ticket_id}")


class TestTicketListEndpoint:
    """Test the tickets list endpoint"""
    
    def test_list_tickets(self):
        """Test GET /api/tickets/ - List all tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets/")
        
        assert response.status_code == 200, f"Failed to list tickets: {response.text}"
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
        print(f"Successfully listed {len(data['tickets'])} tickets")


class TestMemberDashboardAPIs:
    """Test APIs used by Member Dashboard"""
    
    def test_auth_login(self):
        """Test member login endpoint"""
        login_data = {
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data
        )
        
        # Login should work
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, "Login should return a token"
        print(f"Login successful for {login_data['email']}")
        return data.get("token") or data.get("access_token")
    
    def test_my_pets_endpoint(self):
        """Test GET /api/pets/my-pets endpoint"""
        # First login to get token
        token = self.test_auth_login()
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get pets: {response.text}"
        data = response.json()
        assert "pets" in data
        print(f"Successfully retrieved {len(data.get('pets', []))} pets")
    
    def test_my_orders_endpoint(self):
        """Test GET /api/orders/my-orders endpoint"""
        # First login to get token
        token = self.test_auth_login()
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        data = response.json()
        assert "orders" in data
        print(f"Successfully retrieved {len(data.get('orders', []))} orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
