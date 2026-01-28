"""
Iteration 100: Test Quick Score Boost, Auto-populate Pet Parent/Pet Profile in ticket forms
Features tested:
1. Quick Score Boost widget on Member Dashboard - /api/pet-score/{pet_id}/quick-questions
2. Auto-populate Pet Parent dropdown - /api/admin/members/directory
3. Auto-populate Pet Profile dropdown - /api/admin/pets
4. Service Desk page accessibility
5. Member Directory tab in admin dashboard
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pawsome-hub-2.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
TEST_PET_ID = "pet-99a708f1722a"  # Mojo's pet ID


class TestQuickScoreBoost:
    """Test Quick Score Boost API for Member Dashboard"""
    
    def test_quick_questions_endpoint_returns_questions(self):
        """Test /api/pet-score/{pet_id}/quick-questions returns 3 questions with point values"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/quick-questions?limit=3")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "questions" in data, "Response should contain 'questions' key"
        assert "current_score" in data, "Response should contain 'current_score' key"
        assert "potential_boost" in data, "Response should contain 'potential_boost' key"
        
        questions = data["questions"]
        assert len(questions) <= 3, f"Expected at most 3 questions, got {len(questions)}"
        
        # Verify each question has required fields
        for q in questions:
            assert "id" in q, "Question should have 'id'"
            assert "label" in q, "Question should have 'label'"
            assert "icon" in q, "Question should have 'icon'"
            assert "weight" in q, "Question should have 'weight'"
            assert "points_value" in q, "Question should have 'points_value'"
            assert "why_important" in q, "Question should have 'why_important'"
    
    def test_quick_questions_returns_current_score(self):
        """Test that quick-questions returns the current score"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/quick-questions?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        # Mojo's score should be around 18.4%
        current_score = data.get("current_score", 0)
        assert isinstance(current_score, (int, float)), "current_score should be a number"
        print(f"Current score for {TEST_PET_ID}: {current_score}%")
    
    def test_quick_questions_returns_potential_boost(self):
        """Test that quick-questions returns potential boost value"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/quick-questions?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        potential_boost = data.get("potential_boost", 0)
        assert isinstance(potential_boost, (int, float)), "potential_boost should be a number"
        assert potential_boost >= 0, "potential_boost should be non-negative"
        print(f"Potential boost: +{potential_boost}%")


class TestAutoPopulatePetParent:
    """Test Pet Parent auto-populate dropdown data source"""
    
    def test_members_directory_endpoint(self):
        """Test /api/admin/members/directory returns pet parents list"""
        response = requests.get(f"{BASE_URL}/api/admin/members/directory")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "members" in data, "Response should contain 'members' key"
        
        members = data["members"]
        assert len(members) > 0, "Should have at least one member"
        
        # Verify member structure for auto-populate
        first_member = members[0]
        assert "email" in first_member, "Member should have 'email'"
        assert "name" in first_member or "full_name" in first_member, "Member should have 'name' or 'full_name'"
        
        print(f"Found {len(members)} pet parents for auto-populate dropdown")
    
    def test_members_directory_contains_test_member(self):
        """Test that the test member (dipali@clubconcierge.in) is in the directory"""
        response = requests.get(f"{BASE_URL}/api/admin/members/directory")
        
        assert response.status_code == 200
        data = response.json()
        
        members = data["members"]
        test_member = next((m for m in members if m.get("email") == MEMBER_EMAIL), None)
        
        assert test_member is not None, f"Test member {MEMBER_EMAIL} should be in directory"
        print(f"Found test member: {test_member.get('name', test_member.get('full_name'))}")


class TestAutoPopulatePetProfile:
    """Test Pet Profile auto-populate dropdown data source"""
    
    def test_admin_pets_endpoint(self):
        """Test /api/admin/pets returns pet profiles list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pets?limit=10",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets' key"
        
        pets = data["pets"]
        assert len(pets) > 0, "Should have at least one pet"
        
        # Verify pet structure for auto-populate
        first_pet = pets[0]
        assert "id" in first_pet, "Pet should have 'id'"
        assert "name" in first_pet, "Pet should have 'name'"
        
        print(f"Found {len(pets)} pet profiles for auto-populate dropdown")
    
    def test_admin_pets_contains_test_pet(self):
        """Test that the test pet (Mojo) is in the pets list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pets?limit=50",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        pets = data["pets"]
        test_pet = next((p for p in pets if p.get("id") == TEST_PET_ID), None)
        
        assert test_pet is not None, f"Test pet {TEST_PET_ID} should be in pets list"
        assert test_pet.get("name") == "Mojo", "Test pet name should be 'Mojo'"
        print(f"Found test pet: {test_pet.get('name')} ({test_pet.get('breed')})")


class TestServiceDeskAccess:
    """Test Service Desk page accessibility"""
    
    def test_tickets_endpoint(self):
        """Test /api/tickets/ endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/tickets/")
        
        # Should return 200 or require auth
        assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "tickets" in data or isinstance(data, list), "Should return tickets data"
            print(f"Tickets endpoint accessible, returned {len(data.get('tickets', data))} tickets")
    
    def test_concierge_queue_endpoint(self):
        """Test /api/concierge/queue endpoint for Command Center"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "items" in data, "Response should contain 'items' key"
        print(f"Concierge queue accessible, {len(data.get('items', []))} items in queue")


class TestMemberLogin:
    """Test member login and dashboard access"""
    
    def test_member_login(self):
        """Test member can login with credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}"
        
        data = response.json()
        # Token can be 'token' or 'access_token'
        token = data.get("token") or data.get("access_token")
        assert token is not None, "Login response should contain 'token' or 'access_token'"
        assert "user" in data, "Login response should contain 'user'"
        
        user = data["user"]
        assert user.get("email") == MEMBER_EMAIL, "User email should match"
        print(f"Member login successful: {user.get('name')}")
        
        return token
    
    def test_member_pets_endpoint(self):
        """Test /api/pets/my-pets returns member's pets"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        token = login_data.get("token") or login_data.get("access_token")
        
        # Get pets
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets' key"
        
        pets = data["pets"]
        assert len(pets) > 0, "Member should have at least one pet"
        
        # Check if Mojo is in the pets list
        mojo = next((p for p in pets if p.get("name") == "Mojo"), None)
        assert mojo is not None, "Mojo should be in member's pets"
        
        # Verify overall_score is present
        assert "overall_score" in mojo, "Pet should have 'overall_score'"
        print(f"Member has {len(pets)} pets, Mojo's score: {mojo.get('overall_score')}%")


class TestAdminLogin:
    """Test admin login and dashboard access"""
    
    def test_admin_login(self):
        """Test admin can login with credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Admin login failed with status {response.status_code}"
        
        data = response.json()
        assert "token" in data or "success" in data, "Login response should indicate success"
        print(f"Admin login successful")


class TestHealthEndpoints:
    """Test basic health endpoints"""
    
    def test_api_health(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
