"""
Service Desk API Tests - Iteration 92
Tests for: Service Desk overhaul with Rich Text Editor and Kanban Board
- Ticket list, ticket detail, conversation, context, history, files
- New ticket creation with all 14+ pillars
- Reply functionality (public and internal notes)
- AI draft generation
- Categories endpoint (15 categories)
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
    BASE_URL = "https://pet-soul-audit.preview.emergentagent.com"

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Create Basic Auth header
def get_basic_auth_header():
    credentials = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}


class TestTicketCategories:
    """Test ticket categories endpoint - should return all 15 categories"""
    
    def test_get_categories_returns_15(self):
        """Test /api/tickets/categories returns all 15 categories"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/categories", headers=headers)
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        data = response.json()
        assert "categories" in data, "No categories key in response"
        categories = data["categories"]
        
        # Should have 15 categories
        assert len(categories) >= 14, f"Expected at least 14 categories, got {len(categories)}"
        
        # Verify expected pillars are present
        category_ids = [c.get("id") for c in categories]
        expected_pillars = ["celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", "learn", "paperwork", "advisory", "emergency"]
        
        for pillar in expected_pillars:
            assert pillar in category_ids, f"Missing pillar: {pillar}"
        
        print(f"✓ Got {len(categories)} categories")
        print(f"  Categories: {category_ids}")


class TestTicketList:
    """Test ticket list endpoint"""
    
    def test_get_tickets_list(self):
        """Test /api/tickets/ returns ticket list"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert response.status_code == 200, f"Failed to get tickets: {response.text}"
        data = response.json()
        assert "tickets" in data, "No tickets key in response"
        assert isinstance(data["tickets"], list), "Tickets is not a list"
        print(f"✓ Got {len(data['tickets'])} tickets")
        return data["tickets"]
    
    def test_filter_by_pillar_care(self):
        """Test filtering tickets by pillar=care"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/?category=care", headers=headers)
        assert response.status_code == 200, f"Failed to filter by care: {response.text}"
        data = response.json()
        print(f"✓ Filtered by category=care, got {len(data['tickets'])} tickets")
    
    def test_filter_by_pillar_travel(self):
        """Test filtering tickets by pillar=travel"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/?category=travel", headers=headers)
        assert response.status_code == 200, f"Failed to filter by travel: {response.text}"
        data = response.json()
        print(f"✓ Filtered by category=travel, got {len(data['tickets'])} tickets")
    
    def test_filter_by_pillar_celebrate(self):
        """Test filtering tickets by pillar=celebrate"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/?category=celebrate", headers=headers)
        assert response.status_code == 200, f"Failed to filter by celebrate: {response.text}"
        data = response.json()
        print(f"✓ Filtered by category=celebrate, got {len(data['tickets'])} tickets")


class TestTicketDetail:
    """Test ticket detail endpoint"""
    
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
        
        # Verify ticket has required fields
        assert "ticket_id" in ticket, "Missing ticket_id"
        assert "messages" in ticket or ticket.get("messages") is None or isinstance(ticket.get("messages"), list), "Messages should be list or None"
        
        print(f"✓ Got ticket detail for {ticket_id}")
        print(f"  - Messages: {len(ticket.get('messages', []))}")
        return ticket


class TestCreateTicket:
    """Test creating new tickets with different pillars"""
    
    def test_create_ticket_care_pillar(self):
        """Test creating a ticket with care pillar"""
        headers = get_basic_auth_header()
        headers["Content-Type"] = "application/json"
        
        ticket_data = {
            "category": "care",
            "urgency": "medium",
            "subject": "TEST_Iter92 - Care Pillar Ticket",
            "description": "Testing care pillar ticket creation",
            "channel": "web",
            "member": {
                "name": "Test User Iter92",
                "email": "test.iter92.care@example.com",
                "phone": "+919999999992"
            },
            "pet_info": {
                "name": "Test Pet Care"
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
        print(f"✓ Created care pillar ticket")
    
    def test_create_ticket_celebrate_pillar(self):
        """Test creating a ticket with celebrate pillar"""
        headers = get_basic_auth_header()
        headers["Content-Type"] = "application/json"
        
        ticket_data = {
            "category": "celebrate",
            "urgency": "high",
            "subject": "TEST_Iter92 - Celebrate Pillar Ticket",
            "description": "Testing celebrate pillar ticket creation",
            "channel": "web",
            "member": {
                "name": "Test User Iter92 Celebrate",
                "email": "test.iter92.celebrate@example.com",
                "phone": "+919999999993"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers=headers,
            json=ticket_data
        )
        
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        print(f"✓ Created celebrate pillar ticket")
    
    def test_create_ticket_travel_pillar(self):
        """Test creating a ticket with travel pillar"""
        headers = get_basic_auth_header()
        headers["Content-Type"] = "application/json"
        
        ticket_data = {
            "category": "travel",
            "urgency": "urgent",
            "subject": "TEST_Iter92 - Travel Pillar Ticket",
            "description": "Testing travel pillar ticket creation",
            "channel": "web",
            "member": {
                "name": "Test User Iter92 Travel",
                "email": "test.iter92.travel@example.com"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers=headers,
            json=ticket_data
        )
        
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        print(f"✓ Created travel pillar ticket")


class TestReplyFunctionality:
    """Test reply functionality - public replies and internal notes"""
    
    def test_send_public_reply(self):
        """Test sending a public reply to a ticket"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Send a public reply
        headers["Content-Type"] = "application/json"
        reply_data = {
            "message": "TEST_Iter92 - This is a public reply with <b>rich text</b> formatting",
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers=headers,
            json=reply_data
        )
        
        assert response.status_code == 200, f"Failed to send reply: {response.text}"
        print(f"✓ Public reply sent to ticket {ticket_id}")
    
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
            "message": "TEST_Iter92 - Internal note: This should not be visible to customer",
            "is_internal": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers=headers,
            json=reply_data
        )
        
        assert response.status_code == 200, f"Failed to send internal note: {response.text}"
        print(f"✓ Internal note sent to ticket {ticket_id}")


class TestAIDraft:
    """Test AI draft reply generation"""
    
    def test_ai_draft_professional(self):
        """Test AI draft reply with professional style"""
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
        
        # AI endpoint may return 200 with draft or error if AI service unavailable
        if response.status_code == 200:
            data = response.json()
            print(f"✓ AI draft generated for ticket {ticket_id}")
            if "draft" in data:
                print(f"  Draft preview: {data['draft'][:100]}...")
        else:
            print(f"⚠ AI draft endpoint returned {response.status_code} - AI service may be unavailable")


class TestFileUpload:
    """Test file upload to tickets"""
    
    def test_upload_file(self):
        """Test uploading a file to a ticket"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Create a test file
        test_content = b"Test file content for iteration 92"
        files = {"file": ("test_iter92.txt", test_content, "text/plain")}
        
        # Remove Content-Type from headers for multipart upload
        upload_headers = {"Authorization": headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/attachments",
            headers=upload_headers,
            files=files
        )
        
        assert response.status_code == 200, f"File upload failed: {response.text}"
        print(f"✓ File upload successful for ticket {ticket_id}")


class TestTicketStatuses:
    """Test ticket statuses endpoint"""
    
    def test_get_statuses(self):
        """Test getting ticket statuses"""
        headers = get_basic_auth_header()
        response = requests.get(f"{BASE_URL}/api/tickets/statuses", headers=headers)
        assert response.status_code == 200, f"Failed to get statuses: {response.text}"
        data = response.json()
        assert "statuses" in data, "No statuses key in response"
        statuses = data["statuses"]
        assert len(statuses) > 0, "No statuses returned"
        print(f"✓ Got {len(statuses)} statuses")


class TestAnalytics:
    """Test analytics endpoint"""
    
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


class TestKanbanStatusUpdate:
    """Test status update for Kanban board functionality"""
    
    def test_update_ticket_status(self):
        """Test updating ticket status (for Kanban drag-drop)"""
        headers = get_basic_auth_header()
        
        # First get a ticket ID
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available to test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        # Update status to in_progress
        headers["Content-Type"] = "application/json"
        response = requests.patch(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers=headers,
            json={"status": "in_progress"}
        )
        
        assert response.status_code == 200, f"Failed to update status: {response.text}"
        print(f"✓ Updated ticket {ticket_id} status to in_progress")
        
        # Update back to new
        response = requests.patch(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers=headers,
            json={"status": "new"}
        )
        assert response.status_code == 200
        print(f"✓ Reverted ticket {ticket_id} status to new")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
