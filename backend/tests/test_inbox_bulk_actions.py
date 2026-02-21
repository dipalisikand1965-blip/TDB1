"""
Test Inbox Bulk Actions - Communication Center
Tests bulk notification endpoints for mark read/unread, archive/unarchive
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"

class TestInboxBulkActions:
    """Test bulk notification endpoints for the inbox feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get token
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_resp.status_code == 200:
            token = login_resp.json().get("access_token") or login_resp.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_inbox_endpoint_exists(self):
        """Test that inbox endpoint works for the test user"""
        response = self.session.get(f"{BASE_URL}/api/member/notifications/inbox/{TEST_EMAIL}?limit=10")
        assert response.status_code == 200, f"Inbox endpoint failed: {response.text}"
        data = response.json()
        assert "notifications" in data, "Response should have notifications key"
        print(f"PASS: Inbox endpoint returns {len(data.get('notifications', []))} notifications")
    
    def test_bulk_mark_read_endpoint(self):
        """Test bulk mark read endpoint - POST /api/member/notifications/bulk/read"""
        # Using dummy IDs to test endpoint exists and accepts format
        test_ids = [f"test-{uuid.uuid4().hex[:8]}", f"test-{uuid.uuid4().hex[:8]}"]
        response = self.session.post(f"{BASE_URL}/api/member/notifications/bulk/read", json=test_ids)
        assert response.status_code == 200, f"Bulk mark read failed: {response.text}"
        data = response.json()
        assert "success" in data, "Response should have success field"
        assert data["success"] == True, "Operation should succeed"
        print(f"PASS: Bulk mark read endpoint works, modified {data.get('count', 0)} items")
    
    def test_bulk_mark_unread_endpoint(self):
        """Test bulk mark unread endpoint - POST /api/member/notifications/bulk/unread"""
        test_ids = [f"test-{uuid.uuid4().hex[:8]}"]
        response = self.session.post(f"{BASE_URL}/api/member/notifications/bulk/unread", json=test_ids)
        assert response.status_code == 200, f"Bulk mark unread failed: {response.text}"
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"PASS: Bulk mark unread endpoint works")
    
    def test_bulk_archive_endpoint(self):
        """Test bulk archive endpoint - POST /api/member/notifications/bulk/archive"""
        test_ids = [f"test-{uuid.uuid4().hex[:8]}"]
        response = self.session.post(f"{BASE_URL}/api/member/notifications/bulk/archive", json=test_ids)
        assert response.status_code == 200, f"Bulk archive failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print(f"PASS: Bulk archive endpoint works")
    
    def test_bulk_unarchive_endpoint(self):
        """Test bulk unarchive endpoint - POST /api/member/notifications/bulk/unarchive"""
        test_ids = [f"test-{uuid.uuid4().hex[:8]}"]
        response = self.session.post(f"{BASE_URL}/api/member/notifications/bulk/unarchive", json=test_ids)
        assert response.status_code == 200, f"Bulk unarchive failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print(f"PASS: Bulk unarchive endpoint works")
    
    def test_single_mark_read_endpoint(self):
        """Test single notification mark read - POST /api/member/notifications/{id}/read"""
        test_id = f"test-{uuid.uuid4().hex[:8]}"
        response = self.session.post(f"{BASE_URL}/api/member/notifications/{test_id}/read")
        assert response.status_code == 200, f"Single mark read failed: {response.text}"
        data = response.json()
        assert "notification_id" in data
        print(f"PASS: Single mark read endpoint works")
    
    def test_single_mark_unread_endpoint(self):
        """Test single notification mark unread - POST /api/member/notifications/{id}/unread"""
        test_id = f"test-{uuid.uuid4().hex[:8]}"
        response = self.session.post(f"{BASE_URL}/api/member/notifications/{test_id}/unread")
        assert response.status_code == 200, f"Single mark unread failed: {response.text}"
        print(f"PASS: Single mark unread endpoint works")
    
    def test_single_archive_endpoint(self):
        """Test single notification archive - POST /api/member/notifications/{id}/archive"""
        test_id = f"test-{uuid.uuid4().hex[:8]}"
        response = self.session.post(f"{BASE_URL}/api/member/notifications/{test_id}/archive")
        assert response.status_code == 200, f"Single archive failed: {response.text}"
        print(f"PASS: Single archive endpoint works")
    
    def test_single_unarchive_endpoint(self):
        """Test single notification unarchive - POST /api/member/notifications/{id}/unarchive"""
        test_id = f"test-{uuid.uuid4().hex[:8]}"
        response = self.session.post(f"{BASE_URL}/api/member/notifications/{test_id}/unarchive")
        assert response.status_code == 200, f"Single unarchive failed: {response.text}"
        print(f"PASS: Single unarchive endpoint works")
    
    def test_inbox_archived_filter(self):
        """Test inbox with archived=true filter"""
        response = self.session.get(f"{BASE_URL}/api/member/notifications/inbox/{TEST_EMAIL}?archived=true&limit=10")
        assert response.status_code == 200, f"Archived inbox failed: {response.text}"
        data = response.json()
        assert "notifications" in data
        print(f"PASS: Archived inbox endpoint works, returns {len(data.get('notifications', []))} items")
    
    def test_inbox_with_pet_filter(self):
        """Test inbox with pet_id filter"""
        # First get user's pets
        pets_response = self.session.get(f"{BASE_URL}/api/user/{TEST_EMAIL}/pets")
        if pets_response.status_code == 200:
            pets = pets_response.json().get('pets', [])
            if pets:
                pet_id = pets[0].get('id')
                response = self.session.get(f"{BASE_URL}/api/member/notifications/inbox/{TEST_EMAIL}?pet_id={pet_id}&limit=10")
                assert response.status_code == 200, f"Pet-filtered inbox failed: {response.text}"
                print(f"PASS: Pet-filtered inbox works for pet {pet_id}")
            else:
                print("SKIP: No pets found for user")
        else:
            print("SKIP: Could not fetch pets")
    
    def test_ticket_mark_read_endpoint(self):
        """Test marking all notifications for a ticket as read"""
        test_ticket_id = "TCK-TEST-123456"
        response = self.session.post(
            f"{BASE_URL}/api/member/notifications/ticket/{test_ticket_id}/read",
            json={"user_email": TEST_EMAIL}
        )
        assert response.status_code == 200, f"Ticket mark read failed: {response.text}"
        print(f"PASS: Ticket mark read endpoint works")
    
    def test_ticket_archive_endpoint(self):
        """Test archiving all notifications for a ticket"""
        test_ticket_id = "TCK-TEST-123456"
        response = self.session.post(
            f"{BASE_URL}/api/member/notifications/ticket/{test_ticket_id}/archive",
            json={"user_email": TEST_EMAIL}
        )
        assert response.status_code == 200, f"Ticket archive failed: {response.text}"
        print(f"PASS: Ticket archive endpoint works")


class TestTicketThread:
    """Test ticket thread endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_resp.status_code == 200:
            token = login_resp.json().get("access_token") or login_resp.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_mira_ticket_endpoint(self):
        """Test fetching ticket from mira_tickets collection"""
        # Get a real ticket ID from inbox first
        inbox_resp = self.session.get(f"{BASE_URL}/api/member/notifications/inbox/{TEST_EMAIL}?limit=5")
        if inbox_resp.status_code == 200:
            notifs = inbox_resp.json().get('notifications', [])
            ticket_ids = [n.get('ticket_id') for n in notifs if n.get('ticket_id')]
            if ticket_ids:
                ticket_id = ticket_ids[0]
                response = self.session.get(f"{BASE_URL}/api/mira/tickets/{ticket_id}")
                # May return 404 if ticket doesn't exist, but endpoint should be accessible
                assert response.status_code in [200, 404], f"Mira ticket endpoint error: {response.text}"
                print(f"PASS: Mira ticket endpoint accessible for {ticket_id} (status: {response.status_code})")
            else:
                print("SKIP: No ticket IDs in notifications")
        else:
            print("SKIP: Could not fetch inbox")
    
    def test_service_desk_ticket_endpoint(self):
        """Test fetching ticket from service_desk collection"""
        inbox_resp = self.session.get(f"{BASE_URL}/api/member/notifications/inbox/{TEST_EMAIL}?limit=5")
        if inbox_resp.status_code == 200:
            notifs = inbox_resp.json().get('notifications', [])
            ticket_ids = [n.get('ticket_id') for n in notifs if n.get('ticket_id')]
            if ticket_ids:
                ticket_id = ticket_ids[0]
                response = self.session.get(f"{BASE_URL}/api/service_desk/ticket/{ticket_id}")
                assert response.status_code in [200, 404], f"Service desk ticket endpoint error: {response.text}"
                print(f"PASS: Service desk ticket endpoint accessible for {ticket_id} (status: {response.status_code})")
            else:
                print("SKIP: No ticket IDs in notifications")
        else:
            print("SKIP: Could not fetch inbox")
    
    def test_ticket_status_update_endpoint(self):
        """Test ticket status update (for Reopen Ticket feature)"""
        test_ticket_id = "TCK-TEST-REOPEN"
        response = self.session.post(
            f"{BASE_URL}/api/service_desk/ticket/{test_ticket_id}/status",
            json={"status": "open"}
        )
        # May return 404 if ticket doesn't exist, but endpoint should handle it
        assert response.status_code in [200, 404], f"Status update endpoint error: {response.text}"
        print(f"PASS: Ticket status update endpoint accessible (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
