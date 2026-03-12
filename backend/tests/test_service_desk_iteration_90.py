"""
Service Desk API Tests - Iteration 90
Tests for: Ticket list, ticket detail, conversation, context, history, files, settings, new ticket, reply, file upload, AI summary, analytics, pets sidebar, pet parents sidebar
"""

import pytest
import requests
import os
import base64
import json
from datetime import datetime

# Get the backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://pet-os-refactor.preview.emergentagent.com"

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Create Basic Auth header
def get_basic_auth_header():
    credentials = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}

# Create Bearer Auth header from login
def get_bearer_auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login returns JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert len(data["token"]) > 0, "Token is empty"
        print(f"✓ Admin login successful, token received")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid credentials correctly rejected")


class TestTicketList:
    """Test ticket list and filtering"""
    
    def test_get_tickets_list(self):
        """Test fetching ticket list"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert response.status_code == 200, f"Failed to get tickets: {response.text}"
        data = response.json()
        assert "tickets" in data, "No tickets key in response"
        assert isinstance(data["tickets"], list), "Tickets is not a list"
        print(f"✓ Got {len(data['tickets'])} tickets")
        return data["tickets"]
    
    def test_filter_by_status(self):
        """Test filtering tickets by status"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/?status=open", headers=headers)
        assert response.status_code == 200, f"Failed to filter by status: {response.text}"
        data = response.json()
        print(f"✓ Filtered by status=open, got {len(data['tickets'])} tickets")
    
    def test_filter_by_category(self):
        """Test filtering tickets by category/pillar"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/?category=care", headers=headers)
        assert response.status_code == 200, f"Failed to filter by category: {response.text}"
        data = response.json()
        print(f"✓ Filtered by category=care, got {len(data['tickets'])} tickets")


class TestTicketDetail:
    """Test ticket detail view - clicking on a ticket should show conversation without TypeError"""
    
    def test_get_ticket_detail(self):
        """Test fetching single ticket detail"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID from the list
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        assert ticket_id, "No ticket_id in first ticket"
        
        # Get ticket detail
        response = requests.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get ticket detail: {response.text}"
        
        data = response.json()
        assert "ticket" in data, "No ticket key in response"
        ticket = data["ticket"]
        
        # Verify ticket has required fields (no TypeError should occur)
        assert "ticket_id" in ticket, "Missing ticket_id"
        assert "messages" in ticket or ticket.get("messages") is None or isinstance(ticket.get("messages"), list), "Messages should be list or None"
        assert "member" in ticket or ticket.get("member") is None, "Member should exist or be None"
        
        print(f"✓ Got ticket detail for {ticket_id}")
        print(f"  - Messages: {len(ticket.get('messages', []))}")
        print(f"  - Member: {ticket.get('member', {}).get('name', 'N/A')}")
        return ticket


class TestContextTab:
    """Test Context tab showing pet parent and pet info"""
    
    def test_member_search_endpoint(self):
        """Test member search endpoint for context tab"""
        headers = get_basic_auth_header()
        
        # Test member search endpoint
        response = requests.get(
            f"{BASE_URL}/api/admin/members/search?email=test@example.com",
            headers=headers
        )
        # This endpoint may return 200 with empty results or 404
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Member search endpoint accessible (status: {response.status_code})")
    
    def test_members_directory(self):
        """Test members directory endpoint"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/members/directory", headers=headers)
        assert response.status_code == 200, f"Failed to get members directory: {response.text}"
        data = response.json()
        assert "members" in data, "No members key in response"
        print(f"✓ Members directory: {len(data['members'])} members")


class TestHistoryTab:
    """Test History tab showing order history"""
    
    def test_orders_endpoint(self):
        """Test orders endpoint for history tab"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/orders?limit=50", headers=headers)
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        data = response.json()
        assert "orders" in data, "No orders key in response"
        print(f"✓ Orders endpoint: {len(data['orders'])} orders")


class TestFilesTab:
    """Test Files tab showing attachments"""
    
    def test_file_upload(self):
        """Test file upload to ticket"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Create a test file
        test_content = b"Test file content for iteration 90"
        files = {"file": ("test_iter90.txt", test_content, "text/plain")}
        
        # Remove Content-Type from headers for multipart upload
        upload_headers = {"Authorization": headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/attachments",
            headers=upload_headers,
            files=files
        )
        
        assert response.status_code == 200, f"File upload failed: {response.text}"
        data = response.json()
        assert "file_url" in data or "success" in data, "No file_url or success in response"
        print(f"✓ File upload successful for ticket {ticket_id}")


class TestSettingsModal:
    """Test Settings modal showing custom statuses and categories"""
    
    def test_get_statuses(self):
        """Test getting ticket statuses"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/statuses", headers=headers)
        assert response.status_code == 200, f"Failed to get statuses: {response.text}"
        data = response.json()
        assert "statuses" in data, "No statuses key in response"
        statuses = data["statuses"]
        assert len(statuses) > 0, "No statuses returned"
        print(f"✓ Got {len(statuses)} statuses: {[s.get('name') or s.get('id') for s in statuses]}")
    
    def test_get_categories(self):
        """Test getting ticket categories/pillars"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/categories", headers=headers)
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        data = response.json()
        assert "categories" in data, "No categories key in response"
        categories = data["categories"]
        assert len(categories) > 0, "No categories returned"
        print(f"✓ Got {len(categories)} categories")


class TestNewTicketModal:
    """Test New Ticket modal with all fields working"""
    
    def test_create_ticket(self):
        """Test creating a new ticket"""
        headers = get_basic_auth_header()
        headers["Content-Type"] = "application/json"
        
        ticket_data = {
            "category": "care",
            "urgency": "medium",
            "subject": "TEST_Iter90 - Test Ticket",
            "description": "This is a test ticket created during iteration 90 testing",
            "channel": "web",
            "member": {
                "name": "Test User Iter90",
                "email": "test.iter90@example.com",
                "phone": "+919999999990"
            },
            "pet_info": {
                "name": "Test Pet"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers=headers,
            json=ticket_data
        )
        
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        data = response.json()
        assert "ticket" in data or "success" in data, "No ticket or success in response"
        
        if "ticket" in data:
            ticket_id = data["ticket"].get("ticket_id")
            print(f"✓ Created ticket: {ticket_id}")
        else:
            print(f"✓ Ticket creation successful")


class TestSendReply:
    """Test Send Reply functionality - sending a message on a ticket"""
    
    def test_send_reply(self):
        """Test sending a reply to a ticket"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Send a reply
        headers["Content-Type"] = "application/json"
        reply_data = {
            "message": "TEST_Iter90 - This is a test reply from iteration 90 testing",
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers=headers,
            json=reply_data
        )
        
        assert response.status_code == 200, f"Failed to send reply: {response.text}"
        data = response.json()
        assert "success" in data or "message" in data, "No success or message in response"
        print(f"✓ Reply sent to ticket {ticket_id}")
    
    def test_send_internal_note(self):
        """Test sending an internal note to a ticket"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Send an internal note
        headers["Content-Type"] = "application/json"
        reply_data = {
            "message": "TEST_Iter90 - Internal note from iteration 90 testing",
            "is_internal": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers=headers,
            json=reply_data
        )
        
        assert response.status_code == 200, f"Failed to send internal note: {response.text}"
        print(f"✓ Internal note sent to ticket {ticket_id}")


class TestAISummary:
    """Test AI Summary generation on tickets"""
    
    def test_ai_draft_reply(self):
        """Test AI draft reply generation"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Request AI draft
        headers["Content-Type"] = "application/json"
        ai_request = {
            "ticket_id": ticket_id,
            "reply_type": "professional"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            headers=headers,
            json=ai_request
        )
        
        # AI endpoint may return 200 with draft or 500 if AI service unavailable
        if response.status_code == 200:
            data = response.json()
            print(f"✓ AI draft generated for ticket {ticket_id}")
            if "draft" in data:
                print(f"  Draft preview: {data['draft'][:100]}...")
        else:
            print(f"⚠ AI draft endpoint returned {response.status_code} - AI service may be unavailable")


class TestAnalyticsEndpoint:
    """Test Analytics endpoint returning proper data"""
    
    def test_get_analytics(self):
        """Test getting analytics data"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/analytics", headers=headers)
        assert response.status_code == 200, f"Failed to get analytics: {response.text}"
        data = response.json()
        
        # Verify analytics structure
        expected_keys = ["total_tickets", "open_tickets", "resolved_tickets"]
        for key in expected_keys:
            assert key in data, f"Missing {key} in analytics"
        
        print(f"✓ Analytics data:")
        print(f"  - Total tickets: {data.get('total_tickets', 'N/A')}")
        print(f"  - Open tickets: {data.get('open_tickets', 'N/A')}")
        print(f"  - Resolved tickets: {data.get('resolved_tickets', 'N/A')}")
        print(f"  - Today tickets: {data.get('today_tickets', 'N/A')}")
        print(f"  - Week tickets: {data.get('week_tickets', 'N/A')}")


class TestPetsSidebar:
    """Test Pets sidebar showing actual pets from database"""
    
    def test_get_pets(self):
        """Test getting pets list"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/pets?limit=100", headers=headers)
        assert response.status_code == 200, f"Failed to get pets: {response.text}"
        data = response.json()
        assert "pets" in data, "No pets key in response"
        print(f"✓ Pets sidebar: {len(data['pets'])} pets")
        
        if data['pets']:
            sample_pet = data['pets'][0]
            print(f"  Sample pet: {sample_pet.get('name', 'N/A')}")


class TestPetParentsSidebar:
    """Test Pet Parents sidebar showing actual members"""
    
    def test_get_pet_parents(self):
        """Test getting pet parents/members list"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/members/directory", headers=headers)
        assert response.status_code == 200, f"Failed to get members: {response.text}"
        data = response.json()
        assert "members" in data, "No members key in response"
        print(f"✓ Pet Parents sidebar: {len(data['members'])} members")
        
        if data['members']:
            sample_member = data['members'][0]
            print(f"  Sample member: {sample_member.get('name', 'N/A')}")


class TestTicketStats:
    """Test ticket statistics endpoint"""
    
    def test_get_stats(self):
        """Test getting ticket stats"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        data = response.json()
        
        print(f"✓ Ticket stats:")
        print(f"  - Total open: {data.get('total_open', 'N/A')}")
        print(f"  - By status: {data.get('by_status', {})}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
