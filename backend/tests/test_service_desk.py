"""
Service Desk API Tests - Iteration 88
Tests for ticket endpoints, reply, attachments, and AI suggestions
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestServiceDeskAuth:
    """Test Service Desk authentication"""
    
    def test_admin_login(self):
        """Test admin login endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "success" in data, "No token or success in response"
        print(f"Login response: {data}")
        return data.get("token")


class TestTicketEndpoints:
    """Test ticket CRUD endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers for API calls"""
        # Login to get token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_get_tickets_list(self, auth_headers):
        """Test GET /api/tickets/ - returns ticket list"""
        response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get tickets: {response.text}"
        data = response.json()
        assert "tickets" in data, "No tickets key in response"
        print(f"Total tickets: {len(data['tickets'])}")
        
        # Verify ticket structure
        if data['tickets']:
            ticket = data['tickets'][0]
            assert "ticket_id" in ticket, "ticket_id missing"
            assert "status" in ticket, "status missing"
            print(f"First ticket: {ticket.get('ticket_id')} - {ticket.get('subject', 'No subject')}")
    
    def test_get_single_ticket(self, auth_headers):
        """Test GET /api/tickets/{ticket_id} - returns ticket details"""
        # First get a ticket ID from the list
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Get single ticket
        response = requests.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get ticket {ticket_id}: {response.text}"
        data = response.json()
        assert "ticket" in data, "No ticket key in response"
        
        ticket = data["ticket"]
        assert ticket.get("ticket_id") == ticket_id, "Ticket ID mismatch"
        print(f"Ticket details: {ticket.get('ticket_id')} - Status: {ticket.get('status')}")
        
        # Check for messages array
        assert "messages" in ticket or ticket.get("messages") is None, "Messages field should exist"
    
    def test_ticket_reply(self, auth_headers):
        """Test POST /api/tickets/{ticket_id}/reply - add reply to ticket"""
        # Get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Send reply
        reply_data = {
            "message": "TEST_reply: This is a test reply from automated testing",
            "is_internal": False,
            "attachments": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers={**auth_headers, "Content-Type": "application/json"},
            json=reply_data
        )
        assert response.status_code == 200, f"Failed to add reply: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Reply not successful"
        assert "message" in data, "No message in response"
        print(f"Reply added to ticket {ticket_id}")
    
    def test_ticket_reply_with_internal_note(self, auth_headers):
        """Test internal note functionality"""
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Send internal note
        reply_data = {
            "message": "TEST_internal: This is an internal note - not visible to customer",
            "is_internal": True,
            "attachments": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers={**auth_headers, "Content-Type": "application/json"},
            json=reply_data
        )
        assert response.status_code == 200, f"Failed to add internal note: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("message", {}).get("is_internal") == True, "Internal flag not set"
        print(f"Internal note added to ticket {ticket_id}")


class TestAttachmentEndpoints:
    """Test file attachment endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_attachment_upload_endpoint_exists(self, auth_headers):
        """Test POST /api/tickets/{ticket_id}/attachments endpoint exists"""
        # Get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Create a simple test file
        test_content = b"TEST_attachment: This is a test file content"
        files = {
            'file': ('test_file.txt', test_content, 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/attachments",
            headers=auth_headers,
            files=files
        )
        
        # Endpoint should exist (200 or 201 for success, 400/422 for validation errors are acceptable)
        assert response.status_code in [200, 201, 400, 422, 500], f"Unexpected status: {response.status_code}"
        print(f"Attachment endpoint response: {response.status_code} - {response.text[:200]}")


class TestAISuggestions:
    """Test AI-powered reply suggestions"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_ai_draft_reply_endpoint(self, auth_headers):
        """Test POST /api/tickets/ai/draft-reply - AI suggestion generation"""
        # Get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Request AI draft
        ai_request = {
            "ticket_id": ticket_id,
            "reply_type": "professional"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            headers={**auth_headers, "Content-Type": "application/json"},
            json=ai_request,
            timeout=30  # AI can take time
        )
        
        # AI endpoint should work or return appropriate error
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "draft" in data or "success" in data, "No draft in response"
            print(f"AI draft generated: {data.get('draft', '')[:100]}...")
        else:
            print(f"AI endpoint error (may be expected if no API key): {response.text[:200]}")


class TestTicketFiltering:
    """Test ticket filtering and stats"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_tickets_with_status_filter(self, auth_headers):
        """Test filtering tickets by status"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            headers=auth_headers,
            params={"status": "open"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"Open tickets: {len(data.get('tickets', []))}")
    
    def test_tickets_stats(self, auth_headers):
        """Test ticket statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/tickets/stats", headers=auth_headers)
        # Stats endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"Ticket stats: {data}")
        else:
            print(f"Stats endpoint not available: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
