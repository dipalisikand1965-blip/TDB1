"""
Mira AI Enhancements - Backend API Tests
=========================================
Tests for new Mira features:
1. Quick prompts endpoint - pillar-specific prompts
2. Research Mode - factual queries with keywords
3. New session endpoint - start fresh conversation
4. History endpoint - past conversations
5. Voice input support (frontend only - tested via UI)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-os-redesign.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"


class TestMiraQuickPrompts:
    """Test pillar-specific quick prompts endpoint"""
    
    def test_travel_quick_prompts(self):
        """Test quick prompts for travel pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/travel")
        assert response.status_code == 200
        data = response.json()
        
        assert "pillar" in data
        assert data["pillar"] == "travel"
        assert "pillar_name" in data
        assert "prompts" in data
        
        prompts = data["prompts"]
        assert len(prompts) >= 3
        
        # Verify travel-specific prompts
        prompt_labels = [p["label"] for p in prompts]
        assert "Book a Cab" in prompt_labels
        assert "Flight Help" in prompt_labels
        assert "Travel Documents" in prompt_labels
        
        print(f"✓ Travel quick prompts: {prompt_labels}")
    
    def test_care_quick_prompts(self):
        """Test quick prompts for care pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/care")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        prompts = data["prompts"]
        
        # Verify care-specific prompts
        prompt_labels = [p["label"] for p in prompts]
        assert "Book Grooming" in prompt_labels
        assert "Vet Visit" in prompt_labels
        assert "Pet Sitting" in prompt_labels
        
        print(f"✓ Care quick prompts: {prompt_labels}")
    
    def test_stay_quick_prompts(self):
        """Test quick prompts for stay pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/stay")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "stay"
        prompts = data["prompts"]
        
        prompt_labels = [p["label"] for p in prompts]
        assert "Find Hotel" in prompt_labels
        assert "Book Boarding" in prompt_labels
        
        print(f"✓ Stay quick prompts: {prompt_labels}")
    
    def test_dine_quick_prompts(self):
        """Test quick prompts for dine pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/dine")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "dine"
        prompts = data["prompts"]
        
        prompt_labels = [p["label"] for p in prompts]
        assert "Find Restaurant" in prompt_labels
        
        print(f"✓ Dine quick prompts: {prompt_labels}")
    
    def test_emergency_quick_prompts(self):
        """Test quick prompts for emergency pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/emergency")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "emergency"
        prompts = data["prompts"]
        
        prompt_labels = [p["label"] for p in prompts]
        assert "Emergency Vet" in prompt_labels
        assert "Lost Pet" in prompt_labels
        
        print(f"✓ Emergency quick prompts: {prompt_labels}")
    
    def test_advisory_fallback_prompts(self):
        """Test quick prompts for unknown pillar falls back to advisory"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/unknown_pillar")
        assert response.status_code == 200
        data = response.json()
        
        # Should return advisory prompts as fallback
        assert "prompts" in data
        prompts = data["prompts"]
        assert len(prompts) >= 1
        
        print(f"✓ Unknown pillar falls back to advisory prompts")


class TestMiraNewSession:
    """Test new session endpoint"""
    
    def test_create_new_session_unauthenticated(self):
        """Test creating new session without auth"""
        response = requests.post(f"{BASE_URL}/api/mira/session/new")
        assert response.status_code == 200
        data = response.json()
        
        assert "session_id" in data
        assert data["session_id"].startswith("mira-")
        assert "created_at" in data
        assert "message" in data
        
        print(f"✓ New session created (unauthenticated): {data['session_id'][:30]}...")
    
    def test_create_new_session_authenticated(self):
        """Test creating new session with auth"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        
        # Create new session
        response = requests.post(
            f"{BASE_URL}/api/mira/session/new",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "session_id" in data
        assert "user" in data
        assert data["user"] is not None
        assert data["user"]["email"] == TEST_EMAIL
        
        print(f"✓ New session created (authenticated): {data['session_id'][:30]}...")


class TestMiraHistory:
    """Test chat history endpoint"""
    
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
    
    def test_history_unauthenticated(self):
        """Test history endpoint without auth returns empty"""
        response = requests.get(f"{BASE_URL}/api/mira/history")
        assert response.status_code == 200
        data = response.json()
        
        assert "sessions" in data
        assert data["sessions"] == []
        assert "message" in data
        assert "Sign in" in data["message"]
        
        print(f"✓ History endpoint returns sign-in prompt for unauthenticated users")
    
    def test_history_authenticated(self, auth_token):
        """Test history endpoint with auth"""
        response = requests.get(
            f"{BASE_URL}/api/mira/history?limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "sessions" in data
        # Sessions may be empty if no previous chats
        if data["sessions"]:
            session = data["sessions"][0]
            assert "session_id" in session
            assert "ticket_id" in session
            assert "pillar" in session
            assert "created_at" in session
            print(f"✓ History returned {len(data['sessions'])} sessions")
        else:
            print(f"✓ History endpoint works (no previous sessions)")


class TestMiraResearchMode:
    """Test Research Mode for factual queries"""
    
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
    
    def test_research_mode_permit_query(self, auth_token):
        """Test research mode activates for permit queries"""
        session_id = f"test-research-permit-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "What permits do I need to take my dog to Jim Corbett National Park?",
                "session_id": session_id,
                "source": "full_page"
            },
            timeout=60  # Research mode may take longer
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert "research_mode" in data
        # Research mode should be True for permit queries
        assert data["research_mode"] == True
        
        print(f"✓ Research mode activated for permit query: research_mode={data['research_mode']}")
    
    def test_research_mode_rules_query(self, auth_token):
        """Test research mode activates for rules queries"""
        session_id = f"test-research-rules-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "What are the rules for taking pets on Indian Railways trains?",
                "session_id": session_id,
                "source": "full_page"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert "research_mode" in data
        assert data["research_mode"] == True
        
        print(f"✓ Research mode activated for rules query: research_mode={data['research_mode']}")
    
    def test_research_mode_regulations_query(self, auth_token):
        """Test research mode activates for regulations queries"""
        session_id = f"test-research-regs-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "What are the airline regulations for flying with a pet in India?",
                "session_id": session_id,
                "source": "full_page"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert "research_mode" in data
        assert data["research_mode"] == True
        
        print(f"✓ Research mode activated for regulations query: research_mode={data['research_mode']}")
    
    def test_non_research_query(self, auth_token):
        """Test research mode does NOT activate for simple queries"""
        session_id = f"test-non-research-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I want to book a grooming session for my dog",
                "session_id": session_id,
                "source": "full_page"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        # Research mode should be False for simple booking queries
        research_mode = data.get("research_mode", False)
        assert research_mode == False
        
        print(f"✓ Research mode NOT activated for simple query: research_mode={research_mode}")


class TestMiraChatQuickPromptsInResponse:
    """Test that chat response includes quick prompts"""
    
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
    
    def test_chat_returns_quick_prompts(self, auth_token):
        """Test that chat response includes pillar-specific quick prompts"""
        session_id = f"test-prompts-response-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need to book a cab for my pet",
                "session_id": session_id,
                "source": "full_page",
                "current_pillar": "travel"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "quick_prompts" in data
        prompts = data["quick_prompts"]
        assert len(prompts) >= 1
        
        # Verify prompts have correct structure
        for prompt in prompts:
            assert "label" in prompt
            assert "message" in prompt
        
        print(f"✓ Chat response includes {len(prompts)} quick prompts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
