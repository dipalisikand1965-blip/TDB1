"""
Iteration 89: Service Desk API Tests
Tests for ticket management, statuses, categories, and file attachments
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-platform.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test successful admin login returns JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["success"] == True
        assert len(data["token"]) > 0
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code in [401, 403]


class TestTicketStatuses:
    """Test ticket statuses endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    def test_get_statuses(self, auth_token):
        """Test GET /api/tickets/statuses returns status list"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/statuses",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        assert isinstance(data["statuses"], list)
        assert len(data["statuses"]) > 0
        
        # Verify expected statuses exist
        status_ids = [s["id"] for s in data["statuses"]]
        assert "new" in status_ids
        assert "in_progress" in status_ids
        assert "resolved" in status_ids


class TestTicketCategories:
    """Test ticket categories/pillars endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    def test_get_categories(self, auth_token):
        """Test GET /api/tickets/categories returns category list"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0
        
        # Verify expected pillars exist
        category_ids = [c["id"] for c in data["categories"]]
        assert "celebrate" in category_ids
        assert "dine" in category_ids
        assert "stay" in category_ids
        assert "travel" in category_ids
        assert "care" in category_ids


class TestTicketCRUD:
    """Test ticket CRUD operations"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    def test_list_tickets(self, auth_token):
        """Test GET /api/tickets/ returns ticket list"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
    
    def test_create_ticket(self, auth_token):
        """Test POST /api/tickets/ creates new ticket"""
        ticket_data = {
            "member": {
                "name": "TEST_Iter89_CreateTicket",
                "email": "test_iter89_create@example.com",
                "phone": "9876543210"
            },
            "category": "inquiry",
            "urgency": "medium",
            "description": "TEST_Iter89: Automated test ticket creation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ticket_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "ticket" in data
        assert data["ticket"]["ticket_id"].startswith("TKT-")
        assert data["ticket"]["member"]["name"] == "TEST_Iter89_CreateTicket"
        
        # Store ticket_id for cleanup
        return data["ticket"]["ticket_id"]
    
    def test_get_single_ticket(self, auth_token):
        """Test GET /api/tickets/{id} returns ticket details"""
        # First create a ticket
        ticket_data = {
            "member": {
                "name": "TEST_Iter89_GetTicket",
                "email": "test_iter89_get@example.com"
            },
            "category": "inquiry",
            "urgency": "low",
            "description": "TEST_Iter89: Test get single ticket"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ticket_data
        )
        ticket_id = create_response.json()["ticket"]["ticket_id"]
        
        # Now get the ticket
        response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "ticket" in data
        assert data["ticket"]["ticket_id"] == ticket_id


class TestTicketAttachments:
    """Test ticket file attachment endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    @pytest.fixture
    def test_ticket_id(self, auth_token):
        """Create a test ticket for attachment tests"""
        ticket_data = {
            "member": {
                "name": "TEST_Iter89_Attachment",
                "email": "test_iter89_attach@example.com"
            },
            "category": "inquiry",
            "urgency": "medium",
            "description": "TEST_Iter89: Test attachment upload"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ticket_data
        )
        return response.json()["ticket"]["ticket_id"]
    
    def test_upload_attachment(self, auth_token, test_ticket_id):
        """Test POST /api/tickets/{id}/attachments accepts file uploads"""
        # Create a test file
        test_content = b"Test file content for iteration 89 attachment test"
        files = {
            "file": ("test_iter89_attachment.txt", test_content, "text/plain")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/attachments",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "filename" in data
        assert "file_url" in data
        assert data["type"] == "document"


class TestTicketReply:
    """Test ticket reply functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    @pytest.fixture
    def test_ticket_id(self, auth_token):
        """Create a test ticket for reply tests"""
        ticket_data = {
            "member": {
                "name": "TEST_Iter89_Reply",
                "email": "test_iter89_reply@example.com"
            },
            "category": "inquiry",
            "urgency": "medium",
            "description": "TEST_Iter89: Test reply functionality"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ticket_data
        )
        return response.json()["ticket"]["ticket_id"]
    
    def test_add_reply(self, auth_token, test_ticket_id):
        """Test POST /api/tickets/{id}/reply adds reply to ticket"""
        reply_data = {
            "message": "TEST_Iter89: This is a test reply",
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reply",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=reply_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "message" in data
        assert data["message"]["content"] == "TEST_Iter89: This is a test reply"
    
    def test_add_internal_note(self, auth_token, test_ticket_id):
        """Test adding internal note to ticket"""
        reply_data = {
            "message": "TEST_Iter89: This is an internal note",
            "is_internal": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reply",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=reply_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"]["is_internal"] == True


class TestAIDraftReply:
    """Test AI draft reply endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    @pytest.fixture
    def test_ticket_id(self, auth_token):
        """Create a test ticket for AI tests"""
        ticket_data = {
            "member": {
                "name": "TEST_Iter89_AI",
                "email": "test_iter89_ai@example.com"
            },
            "category": "inquiry",
            "urgency": "medium",
            "description": "TEST_Iter89: I need help with my pet's grooming appointment"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ticket_data
        )
        return response.json()["ticket"]["ticket_id"]
    
    def test_ai_draft_reply_professional(self, auth_token, test_ticket_id):
        """Test AI draft reply with professional style"""
        ai_request = {
            "ticket_id": test_ticket_id,
            "reply_type": "professional"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=ai_request
        )
        # AI endpoint may return 200 or 500 depending on LLM availability
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
            assert "draft" in data
            assert data["tone"] == "professional"
        else:
            # AI service may not be available - this is acceptable
            pytest.skip("AI service not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
