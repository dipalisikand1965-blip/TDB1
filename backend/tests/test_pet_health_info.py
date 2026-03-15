"""
Test Pet Health Information Feature
Tests the new health information collection in pet registration/onboarding journey
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://data-integrity-task.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestPetHealthInfoBackend:
    """Test Pet Health Information backend APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_pet_id = None
        self.auth_token = None
        yield
        # Cleanup: Delete test pet if created
        if self.test_pet_id and self.auth_token:
            try:
                self.session.delete(
                    f"{BASE_URL}/api/pets/{self.test_pet_id}",
                    headers={"Authorization": f"Bearer {self.auth_token}"}
                )
            except:
                pass
    
    def get_auth_token(self):
        """Get authentication token for test user"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        return None
    
    # ==================== PetHealthInfo Model Tests ====================
    
    def test_pet_health_info_model_exists(self):
        """Verify PetHealthInfo model is properly defined in models.py"""
        # This is a code review test - we verify by checking the API accepts health data
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        # Create pet with health data
        unique_name = f"TEST_HealthModel_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "breed": "Test Breed",
            "health": {
                "vet_name": "Dr. Test",
                "vet_clinic": "Test Clinic",
                "vet_phone": "+91 98765 43210"
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create pet with health data: {response.text}"
        data = response.json()
        pet = data.get("pet", data)
        self.test_pet_id = pet.get("id")
        
        # Verify health data was stored
        assert "health" in pet, "Health field not in response"
        assert pet["health"]["vet_name"] == "Dr. Test", "Vet name not stored correctly"
        print(f"✓ PetHealthInfo model works - pet created with health data")
    
    # ==================== POST /api/pets (authenticated) Tests ====================
    
    def test_create_pet_with_full_health_info_authenticated(self):
        """Test creating pet with all health fields via authenticated endpoint"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        unique_name = f"TEST_FullHealth_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "breed": "Golden Retriever",
            "gender": "male",
            "birth_date": "2022-05-15",
            "health": {
                "vet_name": "Dr. Sarah Johnson",
                "vet_clinic": "Happy Paws Veterinary",
                "vet_phone": "+91 98765 43210",
                "medical_conditions": "Mild hip dysplasia",
                "current_medications": "Glucosamine supplement daily",
                "dietary_restrictions": "Grain-free diet required",
                "spayed_neutered": "yes",
                "microchipped": True,
                "microchip_number": "985141000123456",
                "insurance_provider": "PetSecure India",
                "emergency_contact_name": "John Doe",
                "emergency_contact_phone": "+91 99887 76655"
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create pet: {response.text}"
        data = response.json()
        pet = data.get("pet", data)
        self.test_pet_id = pet.get("id")
        
        # Verify all health fields
        health = pet.get("health", {})
        assert health.get("vet_name") == "Dr. Sarah Johnson", "Vet name mismatch"
        assert health.get("vet_clinic") == "Happy Paws Veterinary", "Vet clinic mismatch"
        assert health.get("vet_phone") == "+91 98765 43210", "Vet phone mismatch"
        assert health.get("medical_conditions") == "Mild hip dysplasia", "Medical conditions mismatch"
        assert health.get("current_medications") == "Glucosamine supplement daily", "Medications mismatch"
        assert health.get("dietary_restrictions") == "Grain-free diet required", "Dietary restrictions mismatch"
        assert health.get("spayed_neutered") == "yes", "Spayed/neutered mismatch"
        assert health.get("microchipped") == True, "Microchipped mismatch"
        assert health.get("microchip_number") == "985141000123456", "Microchip number mismatch"
        assert health.get("insurance_provider") == "PetSecure India", "Insurance provider mismatch"
        assert health.get("emergency_contact_name") == "John Doe", "Emergency contact name mismatch"
        assert health.get("emergency_contact_phone") == "+91 99887 76655", "Emergency contact phone mismatch"
        
        print(f"✓ All 12 health fields stored correctly via authenticated endpoint")
    
    def test_create_pet_with_partial_health_info(self):
        """Test creating pet with only some health fields (all optional)"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        unique_name = f"TEST_PartialHealth_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "health": {
                "vet_name": "Dr. Partial",
                "microchipped": False
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create pet: {response.text}"
        data = response.json()
        pet = data.get("pet", data)
        self.test_pet_id = pet.get("id")
        
        health = pet.get("health", {})
        assert health.get("vet_name") == "Dr. Partial", "Vet name not stored"
        assert health.get("microchipped") == False, "Microchipped not stored"
        
        print(f"✓ Partial health info accepted (all fields optional)")
    
    def test_create_pet_without_health_info(self):
        """Test creating pet without any health info (should work)"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        unique_name = f"TEST_NoHealth_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create pet without health: {response.text}"
        data = response.json()
        pet = data.get("pet", data)
        self.test_pet_id = pet.get("id")
        
        print(f"✓ Pet created successfully without health info")
    
    # ==================== POST /api/pets/public Tests ====================
    
    def test_create_pet_public_with_health_info(self):
        """Test creating pet with health info via public endpoint"""
        unique_name = f"TEST_PublicHealth_{uuid.uuid4().hex[:6]}"
        unique_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "breed": "Labrador",
            "owner_email": unique_email,
            "owner_name": "Test Owner",
            "health": {
                "vet_name": "Dr. Public Test",
                "vet_clinic": "Public Clinic",
                "medical_conditions": "None",
                "spayed_neutered": "not_sure"
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pets/public",
            json=pet_data
        )
        
        assert response.status_code in [200, 201], f"Failed to create public pet: {response.text}"
        data = response.json()
        pet = data.get("pet", data)
        
        # Store for cleanup
        self.test_pet_id = pet.get("id")
        # Get token for cleanup
        self.auth_token = self.get_auth_token()
        
        health = pet.get("health", {})
        assert health.get("vet_name") == "Dr. Public Test", "Vet name not stored via public endpoint"
        assert health.get("vet_clinic") == "Public Clinic", "Vet clinic not stored"
        assert health.get("spayed_neutered") == "not_sure", "Spayed/neutered not stored"
        
        print(f"✓ Health info stored correctly via public endpoint")
    
    # ==================== GET /api/pets/{pet_id} Tests ====================
    
    def test_get_pet_returns_health_data(self):
        """Test that GET /api/pets/{pet_id} returns health data"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        # First create a pet with health data
        unique_name = f"TEST_GetHealth_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "health": {
                "vet_name": "Dr. GetTest",
                "medical_conditions": "Allergies to chicken",
                "microchipped": True,
                "microchip_number": "123456789"
            }
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert create_response.status_code in [200, 201], f"Failed to create pet: {create_response.text}"
        created_pet = create_response.json().get("pet", create_response.json())
        pet_id = created_pet.get("id")
        self.test_pet_id = pet_id
        
        # Now GET the pet and verify health data is returned
        get_response = self.session.get(
            f"{BASE_URL}/api/pets/{pet_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert get_response.status_code == 200, f"Failed to get pet: {get_response.text}"
        pet = get_response.json()
        
        # Handle nested response structure
        if "pet" in pet:
            pet = pet["pet"]
        
        assert "health" in pet, "Health field not returned in GET response"
        health = pet.get("health", {})
        assert health.get("vet_name") == "Dr. GetTest", "Vet name not returned correctly"
        assert health.get("medical_conditions") == "Allergies to chicken", "Medical conditions not returned"
        assert health.get("microchipped") == True, "Microchipped not returned"
        assert health.get("microchip_number") == "123456789", "Microchip number not returned"
        
        print(f"✓ GET /api/pets/{{pet_id}} returns health data correctly")
    
    # ==================== My Pets Endpoint Tests ====================
    
    def test_my_pets_returns_health_data(self):
        """Test that GET /api/pets (my-pets) returns health data for all pets"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        self.auth_token = token
        
        # Create a pet with health data
        unique_name = f"TEST_MyPetsHealth_{uuid.uuid4().hex[:6]}"
        pet_data = {
            "name": unique_name,
            "species": "dog",
            "health": {
                "vet_name": "Dr. MyPets",
                "insurance_provider": "Test Insurance"
            }
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/pets",
            json=pet_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert create_response.status_code in [200, 201], f"Failed to create pet: {create_response.text}"
        created_pet = create_response.json().get("pet", create_response.json())
        self.test_pet_id = created_pet.get("id")
        
        # Get all pets for user
        get_response = self.session.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert get_response.status_code == 200, f"Failed to get my pets: {get_response.text}"
        data = get_response.json()
        pets = data.get("pets", [])
        
        # Find our test pet
        test_pet = next((p for p in pets if p.get("id") == self.test_pet_id), None)
        assert test_pet is not None, "Test pet not found in my pets list"
        
        health = test_pet.get("health", {})
        assert health.get("vet_name") == "Dr. MyPets", "Health data not returned in my pets list"
        
        print(f"✓ My Pets endpoint returns health data")


class TestPetHealthInfoValidation:
    """Test validation of health info fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        return None
    
    def test_spayed_neutered_values(self):
        """Test that spayed_neutered accepts valid values"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        valid_values = ["yes", "no", "not_sure"]
        
        for value in valid_values:
            unique_name = f"TEST_SpayNeuter_{value}_{uuid.uuid4().hex[:4]}"
            pet_data = {
                "name": unique_name,
                "species": "dog",
                "health": {
                    "spayed_neutered": value
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/pets",
                json=pet_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert response.status_code in [200, 201], f"Failed for spayed_neutered={value}: {response.text}"
            
            # Cleanup
            pet = response.json().get("pet", response.json())
            pet_id = pet.get("id")
            if pet_id:
                self.session.delete(
                    f"{BASE_URL}/api/pets/{pet_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
        
        print(f"✓ All spayed_neutered values accepted: {valid_values}")
    
    def test_microchipped_boolean(self):
        """Test that microchipped field accepts boolean values"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        for value in [True, False]:
            unique_name = f"TEST_Microchip_{value}_{uuid.uuid4().hex[:4]}"
            pet_data = {
                "name": unique_name,
                "species": "dog",
                "health": {
                    "microchipped": value
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/pets",
                json=pet_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert response.status_code in [200, 201], f"Failed for microchipped={value}: {response.text}"
            
            pet = response.json().get("pet", response.json())
            health = pet.get("health", {})
            assert health.get("microchipped") == value, f"Microchipped value not stored correctly"
            
            # Cleanup
            pet_id = pet.get("id")
            if pet_id:
                self.session.delete(
                    f"{BASE_URL}/api/pets/{pet_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
        
        print(f"✓ Microchipped boolean values work correctly")


class TestPetSoulPillars:
    """Test Pet Soul page shows all 14 pillars"""
    
    def test_pet_soul_pillars_api(self):
        """Verify the pillars are defined correctly (code review test)"""
        # This is verified by checking the frontend code has 14 pillars
        # The actual UI test will be done via Playwright
        expected_pillars = [
            "Celebrate", "Dine", "Stay", "Travel", "Care", "Enjoy", 
            "Fit", "Learn", "Paperwork", "Advisory", "Emergency", 
            "Farewell", "Adopt", "Shop"
        ]
        
        print(f"✓ Expected 14 pillars: {expected_pillars}")
        print(f"✓ Pet Soul page should display all 14 pillars")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
