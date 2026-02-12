"""
Test What Mira Knows API - Tests for /api/mira/memory/pet/{pet_id}/what-mira-knows endpoint
This tests the expanded panel data that shows Soul/Breed/Memory sections
"""
import pytest
import requests
import os
import json

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
            self.token = data.get('token')
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            # Get user pets to find Mystique (Shihtzu)
            self.pets = data.get('user', {}).get('pets', [])
        else:
            pytest.skip("Authentication failed")
    
    def test_authentication_works(self):
        """Test that login is working"""
        assert hasattr(self, 'token'), "Token should be retrieved from login"
        assert self.token is not None, "Token should not be None"
        print(f"✓ Authentication successful, token received")
    
    def test_get_user_pets(self):
        """Test that we can get user pets"""
        response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        print(f"✓ Got {len(data)} pets for user")
        assert len(data) > 0, "User should have at least one pet"
        
        # Look for Mystique (Shihtzu)
        mystique = None
        for pet in data:
            if pet.get('name', '').lower() == 'mystique' or 'mystique' in pet.get('name', '').lower():
                mystique = pet
                break
        
        if mystique:
            print(f"✓ Found Mystique: {mystique.get('id')}, breed: {mystique.get('breed')}")
        else:
            print(f"  Available pets: {[p.get('name') for p in data]}")
        
        return data
    
    def test_what_mira_knows_api_returns_200(self):
        """Test that API returns 200 for valid pet"""
        # First get user pets
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found for user")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ What Mira Knows API returns 200 for pet {pet_id}")
    
    def test_what_mira_knows_returns_soul_knowledge(self):
        """Test that API returns soul_knowledge array"""
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        
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
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        pet_name = pet.get('name')
        pet_breed = pet.get('breed')
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'breed_knowledge' in data, "Response should contain breed_knowledge"
        assert isinstance(data['breed_knowledge'], list), "breed_knowledge should be a list"
        
        print(f"✓ breed_knowledge for {pet_name} ({pet_breed}): {len(data['breed_knowledge'])} items")
        
        # If pet has a breed, breed_knowledge should have items
        if pet_breed and len(pet_breed) > 0:
            for item in data['breed_knowledge']:
                print(f"  Breed item: {item.get('text', 'N/A')}")
    
    def test_what_mira_knows_returns_memory_knowledge(self):
        """Test that API returns memory_knowledge array"""
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'memory_knowledge' in data, "Response should contain memory_knowledge"
        assert isinstance(data['memory_knowledge'], list), "memory_knowledge should be a list"
        print(f"✓ memory_knowledge contains {len(data['memory_knowledge'])} items")
    
    def test_what_mira_knows_returns_overall_score(self):
        """Test that API returns overall_score"""
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'overall_score' in data, "Response should contain overall_score"
        assert isinstance(data['overall_score'], (int, float)), "overall_score should be numeric"
        print(f"✓ overall_score: {data['overall_score']}")
    
    def test_what_mira_knows_returns_pet_breed(self):
        """Test that API returns pet_breed field"""
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pet = pets_response.json()[0]
        pet_id = pet.get('id')
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200
        
        data = response.json()
        assert 'pet_breed' in data, "Response should contain pet_breed"
        print(f"✓ pet_breed: {data['pet_breed']}")
    
    def test_mystique_pet_breed_knowledge(self):
        """Test specifically for Mystique (Shihtzu) breed knowledge"""
        pets_response = self.session.get(f"{BASE_URL}/api/pet-parents/me/pets")
        if pets_response.status_code != 200 or not pets_response.json():
            pytest.skip("No pets found")
        
        pets = pets_response.json()
        
        # Try to find Mystique or any Shihtzu
        mystique = None
        shihtzu_pet = None
        for pet in pets:
            name = pet.get('name', '').lower()
            breed = pet.get('breed', '').lower()
            if 'mystique' in name:
                mystique = pet
                break
            if 'shihtzu' in breed or 'shih tzu' in breed:
                shihtzu_pet = pet
        
        test_pet = mystique or shihtzu_pet or pets[0]
        pet_id = test_pet.get('id')
        pet_name = test_pet.get('name')
        pet_breed = test_pet.get('breed')
        
        print(f"Testing pet: {pet_name} ({pet_breed}) - ID: {pet_id}")
        
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{pet_id}/what-mira-knows")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify structure
        assert 'soul_knowledge' in data
        assert 'breed_knowledge' in data
        assert 'memory_knowledge' in data
        assert 'overall_score' in data
        assert 'pet_name' in data
        assert 'pet_breed' in data
        
        print(f"✓ Full What Mira Knows response for {pet_name}:")
        print(f"  - Pet Name: {data['pet_name']}")
        print(f"  - Pet Breed: {data['pet_breed']}")
        print(f"  - Overall Score: {data['overall_score']}%")
        print(f"  - Soul Knowledge: {len(data['soul_knowledge'])} items")
        print(f"  - Breed Knowledge: {len(data['breed_knowledge'])} items")
        print(f"  - Memory Knowledge: {len(data['memory_knowledge'])} items")
        
        # Print breed knowledge details if available
        if data['breed_knowledge']:
            print("  - Breed Knowledge Details:")
            for item in data['breed_knowledge'][:3]:
                print(f"    * {item.get('icon', '')} {item.get('text', 'N/A')}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
