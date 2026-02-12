"""
Test What Mira Knows API - Tests for /api/mira/memory/pet/{pet_id}/what-mira-knows endpoint
This tests the expanded panel data that shows Soul/Breed/Memory sections
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"

class TestWhatMiraKnowsAPI:
    """Tests for the What Mira Knows API endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Authenticate
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code == 200:
            data = login_response.json()
            # Token field is 'access_token' not 'token'
            self.token = data.get('access_token')
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
        else:
            pytest.skip("Authentication failed")
    
    def test_authentication_works(self):
        """Test that login is working"""
        assert hasattr(self, 'token'), "Token should be retrieved from login"
        assert self.token is not None, "Token should not be None"
        print(f"✓ Authentication successful, token received")
    
    def test_get_user_pets(self):
        """Test that we can get user pets"""
        response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        pets = data.get('pets', [])
        print(f"✓ Got {len(pets)} pets for user")
        assert len(pets) > 0, "User should have at least one pet"
        
        # Look for Mystique (Shihtzu)
        mystique = None
        for pet in pets:
            if pet.get('name', '').lower() == 'mystique':
                mystique = pet
                break
        
        if mystique:
            print(f"✓ Found Mystique: {mystique.get('id')}, breed: {mystique.get('breed')}")
        else:
            print(f"  Available pets: {[p.get('name') for p in pets]}")
        
        return pets
    
    def test_what_mira_knows_api_returns_200(self):
        """Test that API returns 200 for valid pet"""
        # Use Mystique pet ID
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ What Mira Knows API returns 200 for pet {pet_id}")
    
    def test_what_mira_knows_returns_soul_knowledge(self):
        """Test that API returns soul_knowledge array"""
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'soul_knowledge' in data, "Response should contain soul_knowledge"
        assert isinstance(data['soul_knowledge'], list), "soul_knowledge should be a list"
        print(f"✓ soul_knowledge contains {len(data['soul_knowledge'])} items")
        
        if len(data['soul_knowledge']) > 0:
            item = data['soul_knowledge'][0]
            print(f"  First soul item: {item.get('text', 'N/A')}")
    
    def test_what_mira_knows_returns_breed_knowledge(self):
        """Test that API returns breed_knowledge array - CRITICAL FOR THIS FEATURE"""
        pet_id = "pet-3661ae55d2e2"  # Mystique the Shihtzu
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'breed_knowledge' in data, "Response should contain breed_knowledge"
        assert isinstance(data['breed_knowledge'], list), "breed_knowledge should be a list"
        
        print(f"✓ breed_knowledge for Mystique (Shihtzu): {len(data['breed_knowledge'])} items")
        
        # Verify we have breed knowledge items
        assert len(data['breed_knowledge']) > 0, "Shihtzu should have breed knowledge"
        
        # Print breed knowledge details
        for item in data['breed_knowledge']:
            print(f"  Breed item: {item.get('text', 'N/A')}")
    
    def test_what_mira_knows_returns_memory_knowledge(self):
        """Test that API returns memory_knowledge array"""
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'memory_knowledge' in data, "Response should contain memory_knowledge"
        assert isinstance(data['memory_knowledge'], list), "memory_knowledge should be a list"
        print(f"✓ memory_knowledge contains {len(data['memory_knowledge'])} items")
    
    def test_what_mira_knows_returns_overall_score(self):
        """Test that API returns overall_score"""
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'overall_score' in data, "Response should contain overall_score"
        assert isinstance(data['overall_score'], (int, float)), "overall_score should be numeric"
        print(f"✓ overall_score: {data['overall_score']}")
    
    def test_what_mira_knows_returns_pet_breed(self):
        """Test that API returns pet_breed field"""
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'pet_breed' in data, "Response should contain pet_breed"
        assert data['pet_breed'] == "Shihtzu", f"Expected Shihtzu, got {data['pet_breed']}"
        print(f"✓ pet_breed: {data['pet_breed']}")
    
    def test_mystique_full_response_structure(self):
        """Test complete response structure for Mystique (Shihtzu)"""
        pet_id = "pet-3661ae55d2e2"
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify all required fields
        required_fields = ['pet_id', 'pet_name', 'pet_breed', 'overall_score', 
                          'soul_knowledge', 'breed_knowledge', 'memory_knowledge']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ Full What Mira Knows response for Mystique:")
        print(f"  - Pet Name: {data['pet_name']}")
        print(f"  - Pet Breed: {data['pet_breed']}")
        print(f"  - Overall Score: {data['overall_score']}%")
        print(f"  - Soul Knowledge: {len(data['soul_knowledge'])} items")
        print(f"  - Breed Knowledge: {len(data['breed_knowledge'])} items")
        print(f"  - Memory Knowledge: {len(data['memory_knowledge'])} items")
        
        # Verify breed knowledge has breed-specific traits for Shihtzu
        breed_texts = [item.get('text', '') for item in data['breed_knowledge']]
        assert any('Shihtzu' in text or 'Shih' in text for text in breed_texts), \
            "Breed knowledge should mention Shihtzu"
        print("✓ Breed knowledge contains Shihtzu-specific information")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
