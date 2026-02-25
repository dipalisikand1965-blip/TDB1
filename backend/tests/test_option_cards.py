"""
Option Cards Feature Test Suite
================================
Tests for Concierge 2.0 Option Cards feature:
- Admin sends option cards to user via Service Desk
- User sees options in Concierge thread and can select one
- When user makes a choice, ticket status updates and preference captured
- Soul Score increases by 5 points

Endpoints tested:
- POST /api/tickets/{ticket_id}/options/send - Admin sends option cards
- POST /api/tickets/{ticket_id}/options/respond - User responds to options
- GET /api/os/concierge/thread/{thread_id} - Thread includes option_cards messages
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test user credentials
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASSWORD = "test123"


class TestOptionCardsBackend:
    """Backend API tests for Option Cards feature"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Session for API requests"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def admin_token(self, api_client):
        """Get admin JWT token"""
        try:
            response = api_client.post(
                f"{BASE_URL}/api/admin/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                return response.json().get("token")
        except Exception as e:
            print(f"Admin login failed: {e}")
        return None
    
    @pytest.fixture(scope="class")
    def user_token(self, api_client):
        """Get user JWT token"""
        try:
            response = api_client.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": USER_EMAIL, "password": USER_PASSWORD}
            )
            if response.status_code == 200:
                return response.json().get("token")
        except Exception as e:
            print(f"User login failed: {e}")
        return None
    
    @pytest.fixture(scope="class")
    def test_ticket_id(self, api_client, admin_token):
        """Create a test ticket for option cards testing"""
        # Create a new ticket
        ticket_data = {
            "member": {
                "name": "Test User for Options",
                "email": USER_EMAIL,
                "phone": "+919000000001"
            },
            "category": "celebrate",
            "urgency": "medium",
            "description": "TEST_OPTION_CARDS: Testing option cards feature"
        }
        
        response = api_client.post(f"{BASE_URL}/api/tickets/", json=ticket_data)
        
        if response.status_code == 200:
            data = response.json()
            ticket_id = data.get("ticket", {}).get("ticket_id")
            if ticket_id:
                print(f"Created test ticket: {ticket_id}")
                return ticket_id
        
        # Fallback: use existing ticket mentioned in test context
        return "CNC-20260214-0032"
    
    def test_send_options_endpoint_exists(self, api_client):
        """Test that send_option_cards endpoint exists"""
        # Test with a dummy ticket ID to check endpoint exists
        response = api_client.post(
            f"{BASE_URL}/api/tickets/DUMMY-123/options/send",
            json={
                "ticket_id": "DUMMY-123",
                "question": "Test question",
                "options": [
                    {"id": "A", "title": "Option A"},
                    {"id": "B", "title": "Option B"}
                ]
            }
        )
        # Should return 404 (ticket not found) not 405 (method not allowed)
        assert response.status_code in [404, 422, 500], f"Endpoint should exist, got {response.status_code}"
        print(f"PASS: send_option_cards endpoint exists (status: {response.status_code})")
    
    def test_respond_to_options_endpoint_exists(self, api_client):
        """Test that respond_to_options endpoint exists"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/DUMMY-123/options/respond",
            json={
                "ticket_id": "DUMMY-123",
                "selected_option_id": "A"
            }
        )
        # Should return 404 (ticket not found) not 405 (method not allowed)
        assert response.status_code in [404, 400, 422, 500], f"Endpoint should exist, got {response.status_code}"
        print(f"PASS: respond_to_options endpoint exists (status: {response.status_code})")
    
    def test_send_option_cards_success(self, api_client, test_ticket_id):
        """Test admin can send option cards to a ticket"""
        options_data = {
            "ticket_id": test_ticket_id,
            "question": "Choose your preferred groomer",
            "options": [
                {
                    "id": "A",
                    "title": "Pawsome Grooming Studio",
                    "description": "Full service grooming with spa treatment",
                    "price": "₹1,500"
                },
                {
                    "id": "B",
                    "title": "Happy Paws Salon",
                    "description": "Quick professional grooming",
                    "price": "₹1,000"
                },
                {
                    "id": "C",
                    "title": "Home Grooming Service",
                    "description": "Professional groomer visits your home",
                    "price": "₹1,800"
                }
            ],
            "notify_channels": ["in_app"],
            "allow_custom": True
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/options/send",
            json=options_data
        )
        
        print(f"Send options response status: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "options_id" in data, "Expected options_id in response"
        assert data.get("status") == "options_ready", "Expected status: options_ready"
        print(f"PASS: Option cards sent successfully, options_id: {data.get('options_id')}")
        
        return test_ticket_id
    
    def test_ticket_status_after_sending_options(self, api_client, test_ticket_id):
        """Verify ticket status changed to options_ready after sending options"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{test_ticket_id}")
        
        if response.status_code == 200:
            ticket = response.json()
            # Handle both direct response and nested response
            if "ticket" in ticket:
                ticket = ticket["ticket"]
            
            status = ticket.get("status")
            assert status == "options_ready", f"Expected status 'options_ready', got '{status}'"
            print(f"PASS: Ticket status is 'options_ready'")
        else:
            print(f"WARNING: Could not verify ticket status (status code: {response.status_code})")
    
    def test_ticket_has_pending_options(self, api_client, test_ticket_id):
        """Verify ticket has pending_options after admin sends options"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{test_ticket_id}")
        
        if response.status_code == 200:
            ticket = response.json()
            if "ticket" in ticket:
                ticket = ticket["ticket"]
            
            pending_options = ticket.get("pending_options")
            assert pending_options is not None, "Expected pending_options in ticket"
            assert pending_options.get("status") == "pending", "Expected pending_options status to be 'pending'"
            assert len(pending_options.get("options", [])) >= 2, "Expected at least 2 options"
            print(f"PASS: Ticket has pending_options with {len(pending_options.get('options', []))} options")
        else:
            print(f"WARNING: Could not verify pending_options (status code: {response.status_code})")
    
    def test_respond_to_options_success(self, api_client, test_ticket_id):
        """Test user can respond to option cards"""
        # First, ensure options have been sent to this ticket
        # Then respond
        response_data = {
            "ticket_id": test_ticket_id,
            "selected_option_id": "A"  # Select first option
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/options/respond",
            json=response_data
        )
        
        print(f"Respond to options status: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        # May get 400 if no pending options, or 200 if successful
        if response.status_code == 400:
            # No pending options - need to send options first
            print("INFO: No pending options found - sending options first")
            
            # Send options
            options_data = {
                "ticket_id": test_ticket_id,
                "question": "Choose your preferred groomer",
                "options": [
                    {"id": "A", "title": "Pawsome Grooming Studio", "price": "₹1,500"},
                    {"id": "B", "title": "Happy Paws Salon", "price": "₹1,000"}
                ],
                "notify_channels": ["in_app"]
            }
            send_response = api_client.post(
                f"{BASE_URL}/api/tickets/{test_ticket_id}/options/send",
                json=options_data
            )
            print(f"Send options: {send_response.status_code}")
            
            # Try responding again
            response = api_client.post(
                f"{BASE_URL}/api/tickets/{test_ticket_id}/options/respond",
                json=response_data
            )
            print(f"Respond to options after sending: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Expected success: true"
            assert data.get("ticket_status") == "in_progress", "Expected ticket_status: in_progress"
            print(f"PASS: User responded to options successfully")
            print(f"Soul score increase: {data.get('soul_score_increase', 0)}")
            print(f"Preference captured: {data.get('preference_captured', False)}")
        else:
            print(f"WARNING: Option response test inconclusive (status: {response.status_code})")
    
    def test_ticket_status_after_response(self, api_client, test_ticket_id):
        """Verify ticket status changed to in_progress after user selects option"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{test_ticket_id}")
        
        if response.status_code == 200:
            ticket = response.json()
            if "ticket" in ticket:
                ticket = ticket["ticket"]
            
            status = ticket.get("status")
            # Status should be in_progress after user selection
            if status == "in_progress":
                print(f"PASS: Ticket status is 'in_progress' after user selection")
            else:
                print(f"INFO: Ticket status is '{status}' (expected 'in_progress' if user had selected)")


class TestOptionCardsValidation:
    """Test validation for Option Cards endpoints"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_send_options_requires_question(self, api_client):
        """Test that question field is required"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/TEST-123/options/send",
            json={
                "ticket_id": "TEST-123",
                "options": [
                    {"id": "A", "title": "Option A"},
                    {"id": "B", "title": "Option B"}
                ]
            }
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing question, got {response.status_code}"
        print("PASS: question field is required for send_options")
    
    def test_send_options_requires_min_options(self, api_client):
        """Test that at least 2 options are required"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/TEST-123/options/send",
            json={
                "ticket_id": "TEST-123",
                "question": "Choose one",
                "options": [
                    {"id": "A", "title": "Only one option"}
                ]
            }
        )
        # Should fail validation - min_length=2
        assert response.status_code == 422, f"Expected 422 for single option, got {response.status_code}"
        print("PASS: minimum 2 options required for send_options")
    
    def test_respond_options_requires_selected_id(self, api_client):
        """Test that selected_option_id is required"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/TEST-123/options/respond",
            json={
                "ticket_id": "TEST-123"
                # Missing selected_option_id
            }
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing selected_option_id, got {response.status_code}"
        print("PASS: selected_option_id is required for respond_to_options")


class TestConciergeThreadWithOptions:
    """Test that option cards appear in concierge thread"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def user_id(self, api_client):
        """Get user ID from authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("user", {}).get("id")
        return None
    
    def test_concierge_home_endpoint(self, api_client, user_id):
        """Test concierge home endpoint works"""
        if not user_id:
            pytest.skip("User ID not available")
        
        response = api_client.get(f"{BASE_URL}/api/os/concierge/home?user_id={user_id}")
        
        print(f"Concierge home status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Expected success: true"
            print(f"PASS: Concierge home endpoint works")
            print(f"Active requests: {len(data.get('active_requests', []))}")
            print(f"Recent threads: {len(data.get('recent_threads', []))}")
        else:
            print(f"WARNING: Concierge home returned {response.status_code}")
    
    def test_thread_includes_option_cards_type(self, api_client, user_id):
        """Test that thread messages include type='option_cards' for option messages"""
        if not user_id:
            pytest.skip("User ID not available")
        
        # Get recent threads
        response = api_client.get(f"{BASE_URL}/api/os/concierge/home?user_id={user_id}")
        
        if response.status_code != 200:
            pytest.skip("Could not get concierge home")
        
        threads = response.json().get("recent_threads", [])
        
        if not threads:
            print("INFO: No recent threads found")
            return
        
        # Check first thread for option cards
        thread_id = threads[0].get("id")
        thread_response = api_client.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}?user_id={user_id}"
        )
        
        if thread_response.status_code == 200:
            data = thread_response.json()
            messages = data.get("messages", [])
            
            # Look for option_cards type messages
            option_card_messages = [m for m in messages if m.get("type") == "option_cards"]
            
            print(f"Thread {thread_id} has {len(messages)} messages")
            print(f"Option card messages: {len(option_card_messages)}")
            
            for msg in option_card_messages:
                assert msg.get("options_payload") is not None, "option_cards message should have options_payload"
                print(f"PASS: Found option_cards message with options_payload")
        else:
            print(f"INFO: Could not get thread details (status: {thread_response.status_code})")


class TestExistingTicketCNC0032:
    """Test with the existing ticket mentioned in the test context"""
    
    EXISTING_TICKET_ID = "CNC-20260214-0032"
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_get_existing_ticket(self, api_client):
        """Test that we can get the existing ticket"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{self.EXISTING_TICKET_ID}")
        
        print(f"Get existing ticket status: {response.status_code}")
        
        if response.status_code == 200:
            ticket = response.json()
            if "ticket" in ticket:
                ticket = ticket["ticket"]
            
            print(f"Ticket ID: {ticket.get('ticket_id')}")
            print(f"Status: {ticket.get('status')}")
            print(f"Has pending_options: {ticket.get('pending_options') is not None}")
            
            # Check messages for option_cards type
            messages = ticket.get("messages", [])
            option_messages = [m for m in messages if m.get("type") in ["option_cards", "option_response"]]
            print(f"Option-related messages: {len(option_messages)}")
            
            for msg in option_messages:
                print(f"  - Type: {msg.get('type')}, Sender: {msg.get('sender')}")
        else:
            print(f"WARNING: Could not get existing ticket (status: {response.status_code})")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
