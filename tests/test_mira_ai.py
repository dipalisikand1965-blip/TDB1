"""
Mira AI Concierge System - Backend API Tests
=============================================
Tests for:
- Mira chat endpoint with ticket creation
- Pillar detection (travel, stay, care, etc.)
- Pet Soul data integration
- Mira context endpoint for pillar pages
- Ticket storage in mira_tickets collection
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dogparty-products.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"
TEST_PET_NAME = "Mojo"


class TestMiraHealth:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_mira_pillars_endpoint(self):
        """Test Mira pillars configuration endpoint"""
        response = requests.get(f"{BASE_URL}/api/mira/pillars")
        assert response.status_code == 200
        data = response.json()
        assert "pillars" in data
        pillars = data["pillars"]
        # Verify key pillars exist
        assert "travel" in pillars
        assert "stay" in pillars
        assert "care" in pillars
        assert "emergency" in pillars
        print(f"✓ Mira pillars endpoint returned {len(pillars)} pillars")


class TestMiraAuthentication:
    """Test authentication for Mira endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["access_token"]


class TestMiraChat:
    """Test Mira chat endpoint with ticket creation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_chat_creates_ticket(self, auth_token):
        """Test that Mira chat creates a ticket automatically"""
        session_id = f"test-session-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need to book a cab for my dog",
                "session_id": session_id,
                "source": "web_widget",
                "current_pillar": None
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "response" in data
        assert "session_id" in data
        assert "ticket_id" in data
        assert data["session_id"] == session_id
        
        # Verify ticket was created
        assert data["ticket_id"] is not None
        print(f"✓ Mira chat created ticket: {data['ticket_id']}")
        
        return data
    
    def test_mira_detects_travel_pillar(self, auth_token):
        """Test that Mira detects travel pillar from cab booking request"""
        session_id = f"test-travel-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need to arrange a cab for my pet to the vet",
                "session_id": session_id,
                "source": "full_page"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify pillar detection
        assert "pillar" in data
        assert data["pillar"] == "travel"
        print(f"✓ Mira correctly detected travel pillar")
    
    def test_mira_detects_emergency_pillar(self, auth_token):
        """Test that Mira detects emergency pillar"""
        session_id = f"test-emergency-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "My dog is injured and bleeding, I need help immediately!",
                "session_id": session_id,
                "source": "full_page"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify emergency detection
        assert "pillar" in data
        assert data["pillar"] == "emergency"
        assert data.get("is_emergency") == True
        print(f"✓ Mira correctly detected emergency pillar")
    
    def test_mira_chat_without_auth(self):
        """Test Mira chat works without authentication (guest mode)"""
        session_id = f"test-guest-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello, I want to know about pet-friendly restaurants",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        print(f"✓ Mira chat works for guest users")


class TestMiraContext:
    """Test Mira context endpoint for pillar pages"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_context_travel_pillar(self, auth_token):
        """Test Mira context for travel pillar page"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"current_pillar": "travel"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify context structure
        assert "user" in data
        assert "pets" in data
        assert "pillar_note" in data
        
        # If user has pets, verify pet data
        if data["pets"]:
            print(f"✓ Mira context returned {len(data['pets'])} pets")
        
        # Verify pillar note is personalized
        if data["pillar_note"]:
            assert "travel" in data["pillar_note"].lower() or "transport" in data["pillar_note"].lower()
            print(f"✓ Mira context has personalized travel note")
    
    def test_mira_context_without_auth(self):
        """Test Mira context for non-logged users"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"current_pillar": "travel"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return sign-in prompt
        assert "pillar_note" in data
        assert data["user"] is None
        print(f"✓ Mira context returns sign-in prompt for guests")


class TestMiraTickets:
    """Test Mira ticket storage and retrieval"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_tickets_list(self):
        """Test listing Mira tickets"""
        response = requests.get(f"{BASE_URL}/api/mira/tickets")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "tickets" in data
        assert "total" in data
        print(f"✓ Mira tickets endpoint returned {data['total']} tickets")
    
    def test_mira_session_retrieval(self, auth_token):
        """Test retrieving a Mira session"""
        # First create a session
        session_id = f"test-retrieve-{int(time.time())}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I want to book grooming for my pet",
                "session_id": session_id,
                "source": "full_page"
            }
        )
        
        assert create_response.status_code == 200
        
        # Now retrieve the session
        get_response = requests.get(f"{BASE_URL}/api/mira/session/{session_id}")
        
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert "session_id" in data
        assert "ticket" in data
        assert data["session_id"] == session_id
        
        # Verify ticket structure
        ticket = data["ticket"]
        assert "ticket_id" in ticket
        assert "pillar" in ticket
        assert "messages" in ticket
        print(f"✓ Mira session retrieval works - ticket: {ticket['ticket_id']}")


class TestMiraStats:
    """Test Mira statistics endpoint"""
    
    def test_mira_stats(self):
        """Test Mira conversation statistics"""
        response = requests.get(f"{BASE_URL}/api/mira/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_conversations" in data
        assert "by_type" in data
        assert "by_pillar" in data
        
        # Verify type breakdown
        by_type = data["by_type"]
        assert "advisory" in by_type
        assert "concierge" in by_type
        assert "emergency" in by_type
        
        print(f"✓ Mira stats: {data['total_conversations']} total conversations")


class TestMiraPetSoulIntegration:
    """Test Mira's integration with Pet Soul data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_uses_pet_soul_data(self, auth_token):
        """Test that Mira uses Pet Soul data for personalization"""
        session_id = f"test-petsoul-{int(time.time())}"
        
        # First get context to see if user has pets
        context_response = requests.post(
            f"{BASE_URL}/api/mira/context",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"current_pillar": None}
        )
        
        assert context_response.status_code == 200
        context = context_response.json()
        
        # If user has pets, test personalization
        if context.get("pets") and len(context["pets"]) > 0:
            pet = context["pets"][0]
            pet_name = pet.get("name")
            
            # Send chat with pet context
            chat_response = requests.post(
                f"{BASE_URL}/api/mira/chat",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "message": "I need help with my pet",
                    "session_id": session_id,
                    "source": "full_page",
                    "selected_pet_id": pet.get("id")
                }
            )
            
            assert chat_response.status_code == 200
            data = chat_response.json()
            
            # Verify pet context is returned
            if data.get("selected_pet"):
                print(f"✓ Mira uses Pet Soul data - selected pet: {data['selected_pet']}")
            else:
                print(f"✓ Mira chat works with pet selection")
        else:
            print("⚠ No pets found for user - skipping Pet Soul integration test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
