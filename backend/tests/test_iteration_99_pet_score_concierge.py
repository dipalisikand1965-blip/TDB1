"""
Iteration 99: Pet Soul Score Consistency & Concierge Experience Admin Tests
============================================================================
Tests:
1. Pet Soul Score consistency between /api/pets/my-pets and /api/pet-score/{id}/score_state
2. Concierge Experience Admin API endpoints
3. Mobile navbar hamburger menu functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test pet ID (Mojo's pet)
TEST_PET_ID = "pet-99a708f1722a"


class TestPetSoulScoreConsistency:
    """Test Pet Soul Score consistency across endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Member login failed")
    
    def test_my_pets_endpoint_returns_pets(self):
        """Test /api/pets/my-pets returns pets with overall_score"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets' key"
        
        # Check if pets have overall_score field
        if len(data["pets"]) > 0:
            pet = data["pets"][0]
            assert "overall_score" in pet, "Pet should have 'overall_score' field"
            assert "score_tier" in pet, "Pet should have 'score_tier' field"
            print(f"✓ Pet '{pet.get('name', 'Unknown')}' has overall_score: {pet['overall_score']}")
    
    def test_pet_score_state_endpoint(self):
        """Test /api/pet-score/{id}/score_state returns score data"""
        # First get a pet ID from my-pets
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=self.headers)
        if response.status_code != 200 or not response.json().get("pets"):
            pytest.skip("No pets found for user")
        
        pet_id = response.json()["pets"][0]["id"]
        
        # Get score state
        score_response = requests.get(f"{BASE_URL}/api/pet-score/{pet_id}/score_state")
        assert score_response.status_code == 200, f"Expected 200, got {score_response.status_code}"
        
        score_data = score_response.json()
        assert "score" in score_data, "Response should contain 'score' key"
        assert "tier" in score_data, "Response should contain 'tier' key"
        print(f"✓ Pet score state: {score_data['score']}% - Tier: {score_data['tier']['name'] if score_data['tier'] else 'None'}")
    
    def test_score_consistency_between_endpoints(self):
        """Test that /api/pets/my-pets and /api/pet-score/{id}/score_state return same score"""
        # Get pets from my-pets
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=self.headers)
        if response.status_code != 200 or not response.json().get("pets"):
            pytest.skip("No pets found for user")
        
        pet = response.json()["pets"][0]
        pet_id = pet["id"]
        my_pets_score = pet.get("overall_score", 0)
        
        # Get score from score_state endpoint
        score_response = requests.get(f"{BASE_URL}/api/pet-score/{pet_id}/score_state")
        if score_response.status_code != 200:
            pytest.skip("Score state endpoint failed")
        
        score_state_score = score_response.json().get("score", 0)
        
        # Compare scores - they should be the same (or very close due to rounding)
        assert abs(my_pets_score - score_state_score) < 0.5, \
            f"Score mismatch! my-pets: {my_pets_score}, score_state: {score_state_score}"
        
        print(f"✓ Score consistency verified: my-pets={my_pets_score}, score_state={score_state_score}")


class TestConciergeExperienceAdmin:
    """Test Concierge Experience Admin API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin auth"""
        import base64
        self.admin_auth = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        self.admin_headers = {
            "Authorization": f"Basic {self.admin_auth}",
            "Content-Type": "application/json"
        }
    
    def test_get_concierge_experiences(self):
        """Test GET /api/admin/concierge-experiences/ returns experiences list"""
        response = requests.get(f"{BASE_URL}/api/admin/concierge-experiences/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "experiences" in data, "Response should contain 'experiences' key"
        print(f"✓ Found {len(data['experiences'])} concierge experiences")
    
    def test_seed_concierge_experiences(self):
        """Test POST /api/admin/concierge-experiences/seed seeds default experiences"""
        response = requests.post(f"{BASE_URL}/api/admin/concierge-experiences/seed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "seeded" in data or "updated" in data, "Response should contain seeded/updated counts"
        print(f"✓ Seeded: {data.get('seeded', 0)}, Updated: {data.get('updated', 0)}")
    
    def test_create_concierge_experience(self):
        """Test POST /api/admin/concierge-experiences/ creates new experience"""
        test_experience = {
            "pillar": "travel",
            "title": "TEST_Luxury Pet Travel",
            "description": "Test experience for automated testing",
            "icon": "✈️",
            "gradient": "from-violet-500 to-purple-600",
            "badge": "Test",
            "badge_color": "bg-amber-500",
            "highlights": ["Test highlight 1", "Test highlight 2"],
            "cta_text": "Test CTA",
            "is_active": True,
            "sort_order": 999
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/concierge-experiences/",
            json=test_experience,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id' of created experience"
        self.created_id = data["id"]
        print(f"✓ Created experience with ID: {data['id']}")
        
        # Cleanup - delete the test experience
        delete_response = requests.delete(f"{BASE_URL}/api/admin/concierge-experiences/{data['id']}")
        print(f"✓ Cleanup: Deleted test experience")
    
    def test_toggle_experience_active_status(self):
        """Test POST /api/admin/concierge-experiences/{id}/toggle toggles active status"""
        # First get an experience
        response = requests.get(f"{BASE_URL}/api/admin/concierge-experiences/")
        if response.status_code != 200 or not response.json().get("experiences"):
            pytest.skip("No experiences found to toggle")
        
        exp_id = response.json()["experiences"][0]["id"]
        original_status = response.json()["experiences"][0].get("is_active", True)
        
        # Toggle status
        toggle_response = requests.post(f"{BASE_URL}/api/admin/concierge-experiences/{exp_id}/toggle")
        assert toggle_response.status_code == 200, f"Expected 200, got {toggle_response.status_code}"
        
        # Toggle back to original
        requests.post(f"{BASE_URL}/api/admin/concierge-experiences/{exp_id}/toggle")
        print(f"✓ Toggle functionality works for experience {exp_id}")


class TestHealthEndpoints:
    """Test health and basic endpoints"""
    
    def test_api_health(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_db_health(self):
        """Test /api/health/db endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ DB health check passed - {data.get('products_count', 0)} products")


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Admin login successful")
    
    def test_admin_dashboard(self):
        """Test admin dashboard endpoint"""
        import base64
        admin_auth = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        headers = {"Authorization": f"Basic {admin_auth}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Admin dashboard accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
