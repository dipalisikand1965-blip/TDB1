"""
Test onboarding-related API endpoints for the pet-home-hub app.
Tests the critical flow: /api/membership/onboard -> /api/auth/login -> /api/pets endpoints

Run with: pytest /app/backend/tests/test_onboarding_apis.py -v
"""
import pytest
import requests
import os
import uuid
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://architecture-rebuild.preview.emergentagent.com')


class TestOnboardingFlow:
    """Tests for the complete onboarding flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Generate unique test data for each test"""
        self.unique_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.test_email = f"test_{self.unique_id}@example.com"
        self.test_password = "testpass123"
        self.pet_name = f"TestPet_{self.unique_id[:4]}"
    
    def test_01_health_check(self):
        """Test that the API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_02_membership_onboard_creates_user_and_pet(self):
        """Test POST /api/membership/onboard - creates user and pet"""
        payload = {
            "parent": {
                "name": "Test User",
                "email": self.test_email,
                "phone": "9876543210",
                "whatsapp": "9876543210",
                "address": "Test Address 123",
                "city": "Bangalore",
                "pincode": "560001",
                "password": self.test_password,
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
                "name": self.pet_name,
                "nickname": "Testy",
                "breed": "Mixed / Indie",
                "gender": "boy",
                "birthday_type": "approximate",
                "approximate_age": "1-2years",
                "species": "dog",
                "doggy_soul_answers": {
                    "temperament": "playful",
                    "exercise_needs": "medium"
                }
            }],
            "plan_type": "demo",
            "pet_count": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Onboard response status: {response.status_code}")
        print(f"Onboard response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=true"
        assert "user_id" in data, "Expected user_id in response"
        assert "pet_ids" in data, "Expected pet_ids in response"
        assert len(data["pet_ids"]) == 1, "Expected one pet created"
        
        print(f"✓ Onboarding successful: user_id={data['user_id']}, pet_id={data['pet_ids'][0]}")
    
    def test_03_login_after_onboard(self):
        """Test POST /api/auth/login - login with created user"""
        # First create the user
        onboard_payload = {
            "parent": {
                "name": "Login Test User",
                "email": self.test_email,
                "phone": "9876543210",
                "address": "Test",
                "city": "Test",
                "pincode": "123456",
                "password": self.test_password,
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{
                "name": self.pet_name,
                "breed": "Mixed",
                "gender": "girl"
            }],
            "plan_type": "demo"
        }
        
        onboard_response = requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=onboard_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert onboard_response.status_code == 200, f"Onboard failed: {onboard_response.text}"
        
        # Now login
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Login response status: {login_response.status_code}")
        print(f"Login response: {login_response.json()}")
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        assert "access_token" in data, "Expected access_token"
        assert "user" in data, "Expected user object"
        assert data["user"]["email"] == self.test_email, "Email mismatch"
        
        print(f"✓ Login successful: token received, user={data['user']['email']}")
        
        return data["access_token"]
    
    def test_04_duplicate_email_rejected(self):
        """Test that duplicate email is rejected with proper error"""
        # First create a user
        onboard_payload = {
            "parent": {
                "name": "First User",
                "email": self.test_email,
                "phone": "9876543210",
                "address": "Test",
                "city": "Test",
                "pincode": "123456",
                "password": self.test_password,
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{"name": "Pet1", "breed": "Mixed", "gender": "boy"}],
            "plan_type": "demo"
        }
        
        first_response = requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=onboard_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert first_response.status_code == 200, "First registration should succeed"
        
        # Try to create another user with same email
        duplicate_payload = {
            "parent": {
                "name": "Duplicate User",
                "email": self.test_email,  # Same email
                "phone": "9999999999",
                "address": "Different",
                "city": "Different",
                "pincode": "654321",
                "password": "differentpass",
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{"name": "Pet2", "breed": "Other", "gender": "girl"}],
            "plan_type": "demo"
        }
        
        duplicate_response = requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=duplicate_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Duplicate response status: {duplicate_response.status_code}")
        print(f"Duplicate response: {duplicate_response.json()}")
        
        # Should be rejected with 400 or 409
        assert duplicate_response.status_code in [400, 409, 422], \
            f"Expected 400/409/422 for duplicate, got {duplicate_response.status_code}"
        
        data = duplicate_response.json()
        assert "already registered" in str(data).lower() or "already exists" in str(data).lower(), \
            f"Expected duplicate error message, got: {data}"
        
        print(f"✓ Duplicate email correctly rejected: {data}")
    
    def test_05_get_my_pets_after_onboard(self):
        """Test GET /api/pets/my-pets - returns user's pets"""
        # Create user and login
        onboard_payload = {
            "parent": {
                "name": "Pet Test User",
                "email": self.test_email,
                "phone": "9876543210",
                "address": "Test",
                "city": "Test",
                "pincode": "123456",
                "password": self.test_password,
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{
                "name": self.pet_name,
                "breed": "Golden Retriever",
                "gender": "boy",
                "doggy_soul_answers": {"temperament": "friendly"}
            }],
            "plan_type": "demo"
        }
        
        requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=onboard_payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password},
            headers={"Content-Type": "application/json"}
        )
        
        token = login_response.json().get("access_token")
        assert token, "No token received"
        
        # Get pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Pets response status: {pets_response.status_code}")
        print(f"Pets response: {pets_response.json()}")
        
        assert pets_response.status_code == 200, f"Get pets failed: {pets_response.text}"
        
        data = pets_response.json()
        # API returns {pets: [...]} format
        pets = data.get("pets", data) if isinstance(data, dict) else data
        
        assert len(pets) >= 1, "Expected at least one pet"
        assert pets[0]["name"] == self.pet_name, "Pet name mismatch"
        
        print(f"✓ My pets returned: {len(pets)} pet(s), first pet: {pets[0]['name']}")
    
    def test_06_add_pet_for_existing_user(self):
        """Test POST /api/pets - add another pet for logged in user"""
        # First create user via onboard
        onboard_payload = {
            "parent": {
                "name": "Add Pet Test",
                "email": self.test_email,
                "phone": "9876543210",
                "address": "Test",
                "city": "Test",
                "pincode": "123456",
                "password": self.test_password,
                "accepted_terms": True,
                "accepted_privacy": True
            },
            "pets": [{"name": "FirstPet", "breed": "Mixed", "gender": "boy"}],
            "plan_type": "demo"
        }
        
        requests.post(
            f"{BASE_URL}/api/membership/onboard",
            json=onboard_payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password},
            headers={"Content-Type": "application/json"}
        )
        
        token = login_response.json().get("access_token")
        
        # Add another pet
        new_pet_payload = {
            "name": "SecondPet",
            "breed": "Labrador",
            "gender": "girl",
            "doggy_soul_answers": {"temperament": "playful"}
        }
        
        add_pet_response = requests.post(
            f"{BASE_URL}/api/pets",
            json=new_pet_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Add pet response status: {add_pet_response.status_code}")
        print(f"Add pet response: {add_pet_response.json()}")
        
        assert add_pet_response.status_code in [200, 201], f"Add pet failed: {add_pet_response.text}"
        
        # Verify two pets now
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        data = pets_response.json()
        pets = data.get("pets", data) if isinstance(data, dict) else data
        
        assert len(pets) == 2, f"Expected 2 pets, got {len(pets)}"
        pet_names = [p["name"] for p in pets]
        assert "FirstPet" in pet_names, "First pet missing"
        assert "SecondPet" in pet_names, "Second pet missing"
        
        print(f"✓ Successfully added second pet. Total pets: {len(pets)}")


class TestExistingUser:
    """Tests with existing known user: dipali@clubconcierge.in"""
    
    def test_existing_user_login(self):
        """Test login with known credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "dipali@clubconcierge.in",
                "password": "test123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Existing user login status: {response.status_code}")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "dipali@clubconcierge.in"
        
        print(f"✓ Existing user login successful: {data['user']['name']}")
    
    def test_existing_user_has_pets(self):
        """Test that existing user has pets"""
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "dipali@clubconcierge.in",
                "password": "test123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        token = login_response.json().get("access_token")
        
        # Get pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert pets_response.status_code == 200
        
        data = pets_response.json()
        pets = data.get("pets", data) if isinstance(data, dict) else data
        
        print(f"✓ Existing user has {len(pets)} pet(s)")
        assert len(pets) >= 1, "Existing user should have at least one pet"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
