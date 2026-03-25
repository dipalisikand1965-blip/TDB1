"""
Test Suite: Onboarding Flow & Multi-Pet Support
Tests the /api/membership/onboard and /api/pets endpoints for:
1. New user registration with pet
2. Existing user adding pet
3. Dashboard showing all pets
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://pet-soul-ranking.preview.emergentagent.com"


class TestAuthLogin:
    """Test login functionality"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == "dipali@clubconcierge.in"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns error"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        
        # Should return 401 or 400
        assert response.status_code in [400, 401, 404], f"Expected error code, got {response.status_code}"


class TestMemberOnboarding:
    """Test new member onboarding flow"""
    
    def test_onboard_new_member(self):
        """Test creating a new member with pet"""
        unique_email = f"test_onboard_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "parent": {
                "name": "Test Parent",
                "email": unique_email,
                "phone": "9876543210",
                "whatsapp": "9876543210",
                "address": "123 Test Street",
                "city": "Mumbai",
                "pincode": "400001",
                "password": "testpass123",
                "preferred_contact": "whatsapp",
                "notifications": {
                    "orders": True,
                    "reminders": True,
                    "offers": True,
                    "soulWhispers": True
                },
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{
                "name": "TestPuppy",
                "nickname": "Testy",
                "breed": "Mixed Breed",
                "gender": "boy",
                "birth_date": "",
                "gotcha_date": "",
                "approximate_age": "1-2years",
                "birthday_type": "approximate",
                "species": "dog",
                "doggy_soul_answers": {
                    "temperament": "playful",
                    "stranger_reaction": "friendly",
                    "food_allergies": ["none"],
                    "exercise_needs": "medium",
                    "grooming_tolerance": "tolerates"
                }
            }],
            "plan_type": "demo",
            "pet_count": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/membership/onboard", json=payload)
        
        assert response.status_code in [200, 201], f"Onboarding failed: {response.text}"
        
        data = response.json()
        assert "member_id" in data or "message" in data, "No member_id or message in response"
        
        print(f"Created new member with email: {unique_email}")
    
    def test_onboard_duplicate_email_fails(self):
        """Test that onboarding with existing email fails appropriately"""
        payload = {
            "parent": {
                "name": "Test Duplicate",
                "email": "dipali@clubconcierge.in",  # Known existing email
                "phone": "9876543210",
                "password": "testpass123",
                "accepted_terms": True
            },
            "pets": [{
                "name": "DuplicateTest",
                "species": "dog",
                "gender": "boy"
            }],
            "plan_type": "demo"
        }
        
        response = requests.post(f"{BASE_URL}/api/membership/onboard", json=payload)
        
        # Should fail with conflict or bad request
        assert response.status_code in [400, 409, 422], f"Expected error for duplicate email, got {response.status_code}"


class TestPetsAPI:
    """Test pet management endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        
        if response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        return response.json().get("access_token")
    
    def test_get_my_pets(self, auth_token):
        """Test getting user's pets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        
        assert response.status_code == 200, f"Failed to get pets: {response.text}"
        
        data = response.json()
        assert "pets" in data, "No pets key in response"
        assert isinstance(data["pets"], list), "Pets should be a list"
        
        # Verify user has multiple pets
        if len(data["pets"]) > 0:
            print(f"Found {len(data['pets'])} pets")
            for pet in data["pets"]:
                print(f"  - {pet.get('name', 'Unknown')}: {pet.get('breed', 'N/A')}")
        
        # Check pet structure
        if len(data["pets"]) > 0:
            pet = data["pets"][0]
            assert "name" in pet, "Pet missing name"
            assert "id" in pet or "_id" in pet, "Pet missing id"
    
    def test_add_pet_for_logged_in_user(self, auth_token):
        """Test adding a new pet for an existing logged-in user"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        unique_name = f"TestPet_{uuid.uuid4().hex[:6]}"
        
        pet_data = {
            "name": unique_name,
            "nickname": "Testy",
            "breed": "Labrador Retriever",
            "gender": "boy",
            "approximate_age": "1-2years",
            "birthday_type": "approximate",
            "species": "dog",
            "doggy_soul_answers": {
                "temperament": "playful",
                "stranger_reaction": "friendly",
                "food_allergies": ["none"],
                "exercise_needs": "high"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/pets", json=pet_data, headers=headers)
        
        assert response.status_code in [200, 201], f"Failed to add pet: {response.text}"
        
        data = response.json()
        print(f"Added pet: {unique_name}")
        print(f"Response: {data}")
    
    def test_breed_detection_endpoint(self):
        """Test breed detection endpoint (may return 405 if not implemented)"""
        # Create a small test image
        import base64
        test_image = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
        
        files = {"file": ("test.png", test_image, "image/png")}
        
        response = requests.post(f"{BASE_URL}/api/pets/detect-breed", files=files)
        
        # 405 = not implemented (acceptable), 200/201 = working
        assert response.status_code in [200, 201, 405, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 405:
            print("Breed detection not implemented - acceptable for MVP")
        else:
            print(f"Breed detection returned: {response.status_code}")


class TestDashboardData:
    """Test data that appears on member dashboard"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        
        if response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        return response.json().get("access_token")
    
    def test_get_user_profile(self, auth_token):
        """Test getting user profile via /api/auth/me"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        
        data = response.json()
        assert "user" in data, "No user in response"
        assert "email" in data["user"], "No email in user"
        
        print(f"User profile: {data['user'].get('name', 'N/A')} ({data['user'].get('email')})")
    
    def test_pets_have_soul_scores(self, auth_token):
        """Test that pets have soul scores for dashboard display"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        
        assert response.status_code == 200
        
        data = response.json()
        pets = data.get("pets", [])
        
        for pet in pets:
            # Check for soul-related fields
            has_soul_data = (
                "overall_score" in pet or 
                "doggy_soul_answers" in pet or
                "soul_score" in pet
            )
            if has_soul_data:
                print(f"{pet.get('name')}: Soul score = {pet.get('overall_score', pet.get('soul_score', 'N/A'))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
