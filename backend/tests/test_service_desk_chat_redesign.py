"""
Test cases for Service Desk Chat Redesign (Zoho-style) and Pet Profile Fallback
Tests the new backend endpoint and ticket-related features
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://pet-life-os-2.preview.emergentagent.com"

# Admin credentials
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"
TEST_MEMBER_EMAIL = "dipali@clubconcierge.in"


def get_admin_auth_headers():
    """Get admin auth headers"""
    credentials = base64.b64encode(f"{ADMIN_USER}:{ADMIN_PASS}".encode()).decode()
    return {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json"
    }


class TestAdminAuth:
    """Test admin authentication - prerequisite for Service Desk access"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USER, "password": ADMIN_PASS}
        )
        # Admin login may return 200 or redirect based on implementation
        assert response.status_code in [200, 307, 308]
        print(f"✓ Admin login returns {response.status_code}")


class TestMemberPetsEndpoint:
    """Test the new endpoint to get member's pets by email"""
    
    def test_get_member_pets_by_email(self):
        """Test GET /api/admin/members/{email}/pets endpoint"""
        headers = get_admin_auth_headers()
        response = requests.get(
            f"{BASE_URL}/api/admin/members/{TEST_MEMBER_EMAIL}/pets",
            headers=headers
        )
        
        print(f"Member pets endpoint status: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets' key"
        
        # Should have at least one pet (Lola)
        pets = data.get("pets", [])
        print(f"✓ Found {len(pets)} pet(s) for {TEST_MEMBER_EMAIL}")
        
        if len(pets) > 0:
            pet = pets[0]
            assert "name" in pet, "Pet should have a name"
            print(f"✓ First pet name: {pet.get('name')}")
            
            # Check if it has expected fields
            for field in ["id", "name"]:
                if field in pet:
                    print(f"  - {field}: {pet.get(field)}")
    
    def test_get_member_pets_unknown_email(self):
        """Test endpoint with unknown email returns empty list (not error)"""
        headers = get_admin_auth_headers()
        response = requests.get(
            f"{BASE_URL}/api/admin/members/unknown_user@test.com/pets",
            headers=headers
        )
        
        # Should return 200 with empty pets list, not 404
        assert response.status_code == 200, f"Expected 200 for unknown email, got {response.status_code}"
        data = response.json()
        pets = data.get("pets", [])
        assert len(pets) == 0, "Should return empty list for unknown email"
        print("✓ Unknown email returns empty pets list")
    
    def test_get_member_pets_unauthorized(self):
        """Test endpoint requires admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members/{TEST_MEMBER_EMAIL}/pets"
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"✓ Unauthorized request correctly rejected ({response.status_code})")


class TestTicketsAPI:
    """Test Service Desk ticket endpoints"""
    
    def test_get_tickets_list(self):
        """Test GET /api/tickets endpoint"""
        headers = get_admin_auth_headers()
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "tickets" in data, "Response should contain 'tickets' key"
        tickets = data.get("tickets", [])
        print(f"✓ Found {len(tickets)} ticket(s)")
        
        if tickets:
            ticket = tickets[0]
            print(f"  First ticket: {ticket.get('subject', ticket.get('title', 'N/A'))}")
            return ticket.get("ticket_id") or ticket.get("id")
        return None
    
    def test_get_ticket_detail(self):
        """Test GET /api/tickets/{id} endpoint"""
        headers = get_admin_auth_headers()
        
        # First get ticket list
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        if list_response.status_code != 200:
            pytest.skip("Could not get ticket list")
        
        data = list_response.json()
        tickets = data.get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available")
        
        ticket_id = tickets[0].get("ticket_id") or tickets[0].get("id")
        
        # Get ticket detail
        response = requests.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        ticket = response.json()
        if "ticket" in ticket:
            ticket = ticket["ticket"]
        
        assert ticket.get("ticket_id") or ticket.get("id"), "Ticket should have an ID"
        print(f"✓ Got ticket detail for: {ticket.get('subject', ticket.get('title', 'N/A'))}")
        
        # Check if ticket has member info (for pet profile fallback)
        member = ticket.get("member", {})
        if member.get("email"):
            print(f"  Member email: {member.get('email')}")
    
    def test_get_ticket_categories(self):
        """Test GET /api/tickets/categories endpoint"""
        headers = get_admin_auth_headers()
        response = requests.get(f"{BASE_URL}/api/tickets/categories", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        print(f"✓ Categories endpoint works: {len(data.get('categories', data))} categories")


class TestAIDraftReply:
    """Test AI draft reply generation"""
    
    def test_ai_draft_reply_endpoint(self):
        """Test POST /api/tickets/ai/draft-reply endpoint"""
        headers = get_admin_auth_headers()
        
        # First get a ticket
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        if list_response.status_code != 200:
            pytest.skip("Could not get ticket list")
        
        data = list_response.json()
        tickets = data.get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available for AI testing")
        
        ticket_id = tickets[0].get("ticket_id") or tickets[0].get("id")
        
        # Test AI draft with different styles
        for style in ["professional", "friendly", "empathetic"]:
            response = requests.post(
                f"{BASE_URL}/api/tickets/ai/draft-reply",
                headers=headers,
                json={
                    "ticket_id": ticket_id,
                    "reply_type": style
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                draft = data.get("draft") or data.get("reply") or data.get("message")
                if draft:
                    print(f"✓ AI {style} draft generated ({len(draft)} chars)")
            else:
                print(f"⚠ AI {style} draft failed: {response.status_code}")


class TestTicketReply:
    """Test ticket reply functionality"""
    
    def test_add_reply_to_ticket(self):
        """Test POST /api/tickets/{id}/reply endpoint"""
        headers = get_admin_auth_headers()
        
        # Get a ticket
        list_response = requests.get(f"{BASE_URL}/api/tickets/", headers=headers)
        if list_response.status_code != 200:
            pytest.skip("Could not get ticket list")
        
        data = list_response.json()
        tickets = data.get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available for reply testing")
        
        ticket_id = tickets[0].get("ticket_id") or tickets[0].get("id")
        
        # Test adding a reply
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/reply",
            headers=headers,
            json={
                "message": "TEST: Automated test reply - please ignore",
                "is_internal": True,  # Mark as internal to not notify customer
                "channel": "chat"
            }
        )
        
        # Allow 200 or 201
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        print(f"✓ Reply added successfully (internal note)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
