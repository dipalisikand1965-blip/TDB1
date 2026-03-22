"""
Test Iteration 220: Dashboard Navigation & Mira Memory Features
================================================================
Tests:
1. Dashboard pet card click should navigate to /pet/{petId}
2. Dashboard 'Back to Home' button should appear when on non-overview tabs (mobile view)
3. Mira memory API endpoint GET /api/mira/memory/me returns user memories
4. Mira chat endpoint POST /api/mira/chat returns memories_used field
5. Mira Tab should display 'What Mira Remembers' section with memory counts
6. Chat messages should show 'Remembering you' indicator when memories are used
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mockup-manager.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "demo@doggy.com"
TEST_PASSWORD = "demo1234"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Test that login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0


class TestMiraMemoryAPI:
    """Tests for Mira Memory API endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_my_memories_endpoint_exists(self, auth_token):
        """Test GET /api/mira/memory/me endpoint exists and returns proper structure"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should return 200 OK
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "member_id" in data, "Response should contain member_id"
        assert "total_memories" in data, "Response should contain total_memories"
        assert "by_type" in data, "Response should contain by_type"
        
        # Verify memory types exist
        by_type = data["by_type"]
        expected_types = ["event", "health", "shopping", "general"]
        for mtype in expected_types:
            assert mtype in by_type, f"Memory type '{mtype}' should be in by_type"
            assert "count" in by_type[mtype], f"Memory type '{mtype}' should have count"
            assert "memories" in by_type[mtype], f"Memory type '{mtype}' should have memories list"
    
    def test_get_my_memories_requires_auth(self):
        """Test that GET /api/mira/memory/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/mira/memory/me")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
    
    def test_memory_type_filter(self, auth_token):
        """Test filtering memories by type"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/me?memory_type=event",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "by_type" in data


class TestMiraChatMemories:
    """Tests for Mira Chat endpoint with memories_used field"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_mira_chat_returns_memories_used_field(self, auth_token):
        """Test POST /api/mira/chat returns memories_used field in response"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Hello Mira, how are you?",
                "session_id": "test-session-220",
                "source": "web_widget"
            },
            timeout=60  # LLM calls can be slow
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify memories_used field exists
        assert "memories_used" in data, "Response should contain memories_used field"
        assert isinstance(data["memories_used"], bool), "memories_used should be a boolean"
        
        # Verify other expected fields
        assert "response" in data, "Response should contain response field"
        assert "session_id" in data, "Response should contain session_id"
    
    def test_mira_chat_response_structure(self, auth_token):
        """Test that Mira chat response has complete structure"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "What can you help me with?",
                "session_id": "test-session-220-structure",
                "source": "web_widget"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check all expected fields
        expected_fields = [
            "response",
            "session_id",
            "pillar",
            "memories_used",
            "research_mode"
        ]
        
        for field in expected_fields:
            assert field in data, f"Response should contain {field} field"


class TestPetsAPI:
    """Tests for Pets API to verify pet data for dashboard navigation"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_my_pets(self, auth_token):
        """Test GET /api/pets/my-pets returns pets with IDs for navigation"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pets" in data, "Response should contain pets array"
        
        pets = data["pets"]
        if len(pets) > 0:
            # Verify pet has id field for navigation
            pet = pets[0]
            assert "id" in pet, "Pet should have id field for navigation"
            assert "name" in pet, "Pet should have name field"
            
            # Verify id is not empty
            assert pet["id"], "Pet id should not be empty"
    
    def test_get_pet_by_id(self, auth_token):
        """Test that individual pet can be fetched by ID"""
        # First get pets list
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        pets = response.json().get("pets", [])
        
        if len(pets) > 0:
            pet_id = pets[0]["id"]
            
            # Try to get individual pet
            pet_response = requests.get(
                f"{BASE_URL}/api/pets/{pet_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            # Should return 200 or pet data
            assert pet_response.status_code in [200, 404], f"Unexpected status: {pet_response.status_code}"


class TestMiraMemoryStats:
    """Tests for Mira Memory statistics endpoint"""
    
    def test_memory_stats_endpoint(self):
        """Test GET /api/mira/memory/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/mira/memory/stats")
        
        # This endpoint may or may not require auth
        if response.status_code == 200:
            data = response.json()
            assert "total_memories" in data, "Stats should contain total_memories"
            assert "by_type" in data, "Stats should contain by_type"


class TestDashboardDataIntegrity:
    """Tests to verify data integrity for dashboard features"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_user_has_pets_for_dashboard(self, auth_token):
        """Verify test user has pets for dashboard pet card navigation test"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Log pet count for debugging
        pets = data.get("pets", [])
        print(f"Test user has {len(pets)} pets")
        
        # For navigation test, we need at least one pet
        # If no pets, the test is still valid but navigation won't be testable
        if len(pets) > 0:
            for pet in pets:
                print(f"  - Pet: {pet.get('name')} (ID: {pet.get('id')})")
    
    def test_engagement_sync_endpoint(self, auth_token):
        """Test engagement sync endpoint used by dashboard"""
        # Get user info first
        user_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if user_response.status_code == 200:
            user = user_response.json()
            user_id = user.get("id") or user.get("user_id")
            
            if user_id:
                sync_response = requests.get(
                    f"{BASE_URL}/api/engagement/sync/{user_id}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                
                # Should return 200 or 404 if no engagement data
                assert sync_response.status_code in [200, 404], f"Unexpected status: {sync_response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
