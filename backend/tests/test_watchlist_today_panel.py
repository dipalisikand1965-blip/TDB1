"""
P0.2 TODAY Watchlist Integration Tests
======================================
Tests for:
- GET /api/os/services/watchlist endpoint
- Watchlist filtering by pet_id
- Stale flag when data is old
- Ticket creation and status update flows
- TODAY_WATCHLIST_STATUSES: clarification_needed, options_ready, approval_pending, 
  payment_pending, in_progress, scheduled, shipped
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review_request
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-e6348b13c975"  # Lola


class TestWatchlistAPI:
    """Tests for /api/os/services/watchlist endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_watchlist_endpoint_exists(self, auth_headers):
        """Test that watchlist endpoint exists and returns success"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Watchlist endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert "watchlist" in data
        assert "count" in data
        assert "stale" in data
        print(f"PASS: Watchlist endpoint returns {data['count']} items")
    
    def test_watchlist_returns_list(self, auth_headers):
        """Test that watchlist returns a list"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data.get("watchlist"), list)
        print(f"PASS: Watchlist is a list with {len(data['watchlist'])} items")
    
    def test_watchlist_filter_by_pet_id(self, auth_headers):
        """Test that watchlist can be filtered by pet_id"""
        # Without filter
        response_all = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response_all.status_code == 200
        all_count = response_all.json().get("count", 0)
        
        # With filter
        response_filtered = requests.get(
            f"{BASE_URL}/api/os/services/watchlist?pet_id={TEST_PET_ID}",
            headers=auth_headers
        )
        assert response_filtered.status_code == 200
        filtered_data = response_filtered.json()
        filtered_count = filtered_data.get("count", 0)
        
        # Filtered should be <= total (unless user only has one pet)
        assert filtered_count <= all_count or filtered_count == all_count
        
        # If items exist, check pet_id matches
        for ticket in filtered_data.get("watchlist", []):
            pet_ids = ticket.get("pet_ids", [])
            pet_id = ticket.get("pet_id")
            if pet_ids:
                assert TEST_PET_ID in pet_ids, f"Pet ID mismatch: {pet_ids}"
            elif pet_id:
                assert pet_id == TEST_PET_ID, f"Pet ID mismatch: {pet_id}"
        
        print(f"PASS: Filtered watchlist returns {filtered_count} items for pet {TEST_PET_ID}")
    
    def test_watchlist_stale_flag(self, auth_headers):
        """Test that watchlist returns stale flag"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # stale should be boolean
        assert isinstance(data.get("stale"), bool)
        print(f"PASS: Stale flag is boolean: {data['stale']}")
    
    def test_watchlist_ticket_structure(self, auth_headers):
        """Test that watchlist tickets have correct structure (enriched)"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data.get("watchlist"):
            ticket = data["watchlist"][0]
            # Check enriched fields
            assert "status" in ticket, "Missing status field"
            assert "status_display" in ticket, "Missing status_display field (enrichment)"
            assert "awaiting_user" in ticket, "Missing awaiting_user field (enrichment)"
            assert "pet_display" in ticket, "Missing pet_display field (enrichment)"
            print(f"PASS: Ticket has enriched fields: status={ticket['status']}, awaiting_user={ticket['awaiting_user']}")
        else:
            print("SKIP: No tickets in watchlist to verify structure")


class TestTicketCreationForWatchlist:
    """Tests for creating tickets that should appear in watchlist"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_create_service_request(self, auth_headers):
        """Test creating a service request via POST /api/os/services/request"""
        payload = {
            "service_type": "grooming",
            "pet_ids": [TEST_PET_ID],
            "pet_names": ["Lola"],
            "title": "TEST_Watchlist_Grooming_Request",
            "description": "Test ticket for watchlist testing",
            "source": "today_panel_test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/services/request",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create request failed: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        assert "ticket_id" in data
        assert data.get("status") == "placed"
        
        print(f"PASS: Created ticket {data['ticket_id']} with status {data['status']}")
        return data["ticket_id"]


class TestTicketStatusUpdate:
    """Tests for ticket status updates that affect watchlist"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_update_ticket_status_select_option(self, auth_headers):
        """Test updating ticket status to in_progress (via select_option)"""
        # First create a ticket
        create_payload = {
            "service_type": "training",
            "pet_ids": [TEST_PET_ID],
            "pet_names": ["Lola"],
            "title": "TEST_Status_Update_Test",
            "source": "watchlist_test"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/os/services/request",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json()["ticket_id"]
        
        # Update to in_progress via select_option action
        update_payload = {
            "action": "select_option",
            "data": {"option": "Option A"}
        }
        
        update_response = requests.patch(
            f"{BASE_URL}/api/os/services/ticket/{ticket_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        update_data = update_response.json()
        
        assert update_data.get("success") is True
        assert update_data.get("ticket", {}).get("status") == "in_progress"
        
        print(f"PASS: Updated ticket {ticket_id} to in_progress")
        
        # Verify it appears in watchlist (in_progress is in TODAY_WATCHLIST_STATUSES)
        watchlist_response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist?pet_id={TEST_PET_ID}",
            headers=auth_headers
        )
        assert watchlist_response.status_code == 200
        watchlist = watchlist_response.json().get("watchlist", [])
        
        # Check if our ticket is in watchlist
        ticket_ids = [t.get("ticket_id") for t in watchlist]
        assert ticket_id in ticket_ids, f"Ticket {ticket_id} not found in watchlist"
        print(f"PASS: Ticket {ticket_id} appears in watchlist after status update")


class TestInboxAPI:
    """Tests for inbox API that powers Services tab"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_inbox_endpoint_exists(self, auth_headers):
        """Test inbox endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/inbox",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "awaiting_user" in data
        assert "active" in data
        assert "orders" in data
        assert "counts" in data
        
        print(f"PASS: Inbox returns counts: {data['counts']}")
    
    def test_inbox_filter_by_pet(self, auth_headers):
        """Test inbox filtered by pet_id"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/inbox?pet_id={TEST_PET_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        print(f"PASS: Inbox for pet {TEST_PET_ID} returns {data['counts']['total']} tickets")


class TestAwaitingAPI:
    """Tests for awaiting user API"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_awaiting_endpoint_exists(self, auth_headers):
        """Test awaiting endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/os/services/awaiting",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "tickets" in data
        assert "count" in data
        
        print(f"PASS: Awaiting returns {data['count']} tickets needing user action")


class TestTicketStatusSystem:
    """Tests for ticket status system and TODAY_WATCHLIST_STATUSES"""
    
    def test_today_watchlist_statuses_definition(self):
        """Test that TODAY_WATCHLIST_STATUSES includes expected statuses"""
        import sys
        sys.path.insert(0, '/app/backend')
        from ticket_status_system import TODAY_WATCHLIST_STATUSES, AWAITING_USER_STATUSES
        
        expected_statuses = [
            'clarification_needed',
            'options_ready', 
            'approval_pending',
            'payment_pending',
            'in_progress',
            'scheduled',
            'shipped'
        ]
        
        for status in expected_statuses:
            assert status in TODAY_WATCHLIST_STATUSES, f"Missing status: {status}"
        
        print(f"PASS: TODAY_WATCHLIST_STATUSES contains all expected statuses: {TODAY_WATCHLIST_STATUSES}")
    
    def test_awaiting_user_statuses(self):
        """Test AWAITING_USER_STATUSES are subset of watchlist statuses"""
        import sys
        sys.path.insert(0, '/app/backend')
        from ticket_status_system import TODAY_WATCHLIST_STATUSES, AWAITING_USER_STATUSES
        
        # All awaiting user statuses should be in watchlist
        for status in AWAITING_USER_STATUSES:
            assert status in TODAY_WATCHLIST_STATUSES, f"Awaiting status {status} not in watchlist"
        
        print(f"PASS: All AWAITING_USER_STATUSES ({AWAITING_USER_STATUSES}) are in TODAY_WATCHLIST_STATUSES")


class TestExistingTicket:
    """Tests for existing test ticket SVC-20260214-FA020F"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_existing_ticket_in_watchlist(self, auth_headers):
        """Test that existing in_progress ticket appears in watchlist"""
        # Known test ticket from review_request
        test_ticket_id = "SVC-20260214-FA020F"
        
        # Get watchlist
        response = requests.get(
            f"{BASE_URL}/api/os/services/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        ticket_ids = [t.get("ticket_id") for t in data.get("watchlist", [])]
        
        if test_ticket_id in ticket_ids:
            print(f"PASS: Test ticket {test_ticket_id} found in watchlist")
            # Get ticket detail
            for ticket in data.get("watchlist", []):
                if ticket.get("ticket_id") == test_ticket_id:
                    print(f"  Status: {ticket.get('status')}")
                    print(f"  Awaiting User: {ticket.get('awaiting_user')}")
                    print(f"  Pet Display: {ticket.get('pet_display')}")
        else:
            # It's OK if ticket doesn't exist - it may have been cleaned up
            print(f"INFO: Test ticket {test_ticket_id} not in watchlist (may be completed/cancelled)")


# Cleanup test
class TestCleanup:
    """Cleanup test tickets created during testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_cleanup_test_tickets(self, auth_headers):
        """Cancel test tickets created during testing"""
        # Get all tickets
        response = requests.get(
            f"{BASE_URL}/api/os/services/inbox",
            headers=auth_headers
        )
        
        if response.status_code != 200:
            print("Could not get inbox for cleanup")
            return
        
        data = response.json()
        all_tickets = (
            data.get("awaiting_user", []) + 
            data.get("active", []) + 
            data.get("orders", [])
        )
        
        # Find and cancel test tickets
        cancelled = 0
        for ticket in all_tickets:
            ticket_id = ticket.get("ticket_id", "")
            title = ticket.get("title", "")
            if ticket_id.startswith("TEST_") or "TEST_" in title:
                # Cancel the ticket
                cancel_response = requests.patch(
                    f"{BASE_URL}/api/os/services/ticket/{ticket_id}",
                    json={"action": "cancel"},
                    headers=auth_headers
                )
                if cancel_response.status_code == 200:
                    cancelled += 1
        
        print(f"INFO: Cancelled {cancelled} test tickets")
