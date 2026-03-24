"""
Test Care Pillar - Iteration 199
Tests for:
1. POST /api/service_desk/attach_or_create_ticket endpoint with pet_id, pet_breed, pillar=care
2. Care page data loading
3. Service booking flows wiring
4. Guided Care Paths wiring
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestCarePillarBackend:
    """Backend API tests for Care pillar"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("access_token")
            self.user = data.get("user", {})
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            # Get first pet
            pets_response = self.session.get(f"{BASE_URL}/api/pets")
            if pets_response.status_code == 200:
                pets = pets_response.json()
                if isinstance(pets, list) and len(pets) > 0:
                    self.pet = pets[0]
                elif isinstance(pets, dict) and pets.get("pets"):
                    self.pet = pets["pets"][0]
                else:
                    self.pet = None
            else:
                self.pet = None
        else:
            self.token = None
            self.user = {}
            self.pet = None
    
    def test_health_check(self):
        """Test API health check"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("PASS: Health check endpoint working")
    
    def test_service_desk_attach_or_create_ticket_endpoint_exists(self):
        """Test that service desk endpoint exists and accepts requests"""
        # Minimal payload to test endpoint exists
        payload = {
            "pet_id": "test_pet_id",
            "pillar": "care",
            "intent_primary": "test_intent",
            "channel": "test_channel"
        }
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        print(f"PASS: Service desk endpoint exists, status: {response.status_code}")
    
    def test_care_service_booking_creates_ticket(self):
        """Test that care service booking creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        pet_breed = self.pet.get("breed", "Indie")
        allergies = self.pet.get("allergies", [])
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "pet_breed": pet_breed,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "parent_email": self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_grooming",
            "subject": f"Grooming Request for {pet_name}",
            "initial_message": {
                "text": f"Grooming for {pet_name}: Mode=Home visit, Format=Full groom, Services=Bath, Brush",
                "sender": "member"
            },
            "metadata": {
                "service_id": "grooming",
                "service_name": "Grooming",
                "pet_allergies": ", ".join(allergies) if allergies else "none recorded",
                "flow_selections": {
                    "mode": "Home visit",
                    "format": "Full groom",
                    "services": ["Bath", "Brush"]
                }
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create ticket: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "ticket_id" in data or "id" in data, "Response should contain ticket_id or id"
        print(f"PASS: Care service booking created ticket: {data.get('ticket_id') or data.get('id')}")
    
    def test_care_vet_flow_creates_ticket(self):
        """Test that vet flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        pet_breed = self.pet.get("breed", "Indie")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "pet_breed": pet_breed,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_vet",
            "subject": f"Vet Visit Request for {pet_name}",
            "initial_message": {
                "text": f"Vet visit for {pet_name}: Reason=Wellness check, Type=Home visit, Urgency=Normal",
                "sender": "member"
            },
            "metadata": {
                "service_id": "vet",
                "service_name": "Vet Visit",
                "pet_breed": pet_breed,
                "flow_selections": {
                    "reason": "Wellness check",
                    "preference": "Home visit",
                    "urgency": "Normal"
                }
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create ticket: {response.status_code}"
        print("PASS: Vet flow created ticket successfully")
    
    def test_care_emergency_flow_creates_urgent_ticket(self):
        """Test that emergency flow creates an urgent ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "emergency_alert",
            "urgency": "emergency",
            "channel": "care_service_flow_emergency",
            "subject": f"EMERGENCY for {pet_name}",
            "initial_message": {
                "text": f"EMERGENCY for {pet_name}: Sudden illness, Location: Home",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create emergency ticket: {response.status_code}"
        print("PASS: Emergency flow created urgent ticket successfully")
    
    def test_guided_care_path_creates_ticket(self):
        """Test that guided care path submission creates a ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        pet_breed = self.pet.get("breed", "Indie")
        allergies = self.pet.get("allergies", [])
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "pet_breed": pet_breed,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "guided_path_request",
            "channel": "care_guided_path_submit",
            "subject": f"Guided Plan: Grooming Path for {pet_name}",
            "initial_message": {
                "text": f"Please arrange the \"Grooming Path\" programme for {pet_name}.",
                "sender": "member"
            },
            "metadata": {
                "path_id": "grooming",
                "path_title": "Grooming Path",
                "pet_breed": pet_breed,
                "pet_allergies": ", ".join(allergies) if allergies else "none",
                "selections": {
                    "step1": ["Home visit"],
                    "step2": "Every 4 weeks",
                    "step3": ["Coat-matched shampoo", "Daily brush"]
                }
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create guided path ticket: {response.status_code}"
        print("PASS: Guided care path created ticket successfully")
    
    def test_care_boarding_flow_creates_ticket(self):
        """Test that boarding flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_boarding",
            "subject": f"Boarding Request for {pet_name}",
            "initial_message": {
                "text": f"Boarding for {pet_name}: Type=Overnight, Dates=Flexible",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create boarding ticket: {response.status_code}"
        print("PASS: Boarding flow created ticket successfully")
    
    def test_care_sitting_flow_creates_ticket(self):
        """Test that pet sitting flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_sitting",
            "subject": f"Pet Sitting Request for {pet_name}",
            "initial_message": {
                "text": f"Pet sitting for {pet_name}: Type=Day visit",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create sitting ticket: {response.status_code}"
        print("PASS: Pet sitting flow created ticket successfully")
    
    def test_care_behaviour_flow_creates_ticket(self):
        """Test that behaviour flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_behaviour",
            "subject": f"Behaviour Support Request for {pet_name}",
            "initial_message": {
                "text": f"Behaviour support for {pet_name}: Concern=Anxiety",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create behaviour ticket: {response.status_code}"
        print("PASS: Behaviour flow created ticket successfully")
    
    def test_care_senior_flow_creates_ticket(self):
        """Test that senior care flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_senior",
            "subject": f"Senior Care Request for {pet_name}",
            "initial_message": {
                "text": f"Senior/special care for {pet_name}: Need=Joint support",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create senior care ticket: {response.status_code}"
        print("PASS: Senior care flow created ticket successfully")
    
    def test_care_nutrition_flow_creates_ticket(self):
        """Test that nutrition flow creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "service_booking",
            "channel": "care_service_flow_nutrition",
            "subject": f"Nutrition Consult Request for {pet_name}",
            "initial_message": {
                "text": f"Nutrition consult for {pet_name}: Reason=Weight management",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create nutrition ticket: {response.status_code}"
        print("PASS: Nutrition flow created ticket successfully")
    
    def test_care_nearme_booking_creates_ticket(self):
        """Test that NearMe booking creates a service desk ticket"""
        if not self.pet:
            pytest.skip("No pet available for testing")
        
        pet_id = self.pet.get("id") or self.pet.get("_id")
        pet_name = self.pet.get("name", "Test Pet")
        
        payload = {
            "pet_id": pet_id,
            "pet_name": pet_name,
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pillar": "care",
            "intent_primary": "nearme_booking",
            "channel": "care_nearme",
            "subject": f"NearMe Booking: Test Groomer for {pet_name}",
            "initial_message": {
                "text": f"Please contact Test Groomer and arrange a visit for {pet_name}.",
                "sender": "member"
            },
            "metadata": {
                "place_name": "Test Groomer",
                "place_address": "123 Test Street, Mumbai",
                "place_id": "test_place_id"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert response.status_code in [200, 201], f"Failed to create nearme ticket: {response.status_code}"
        print("PASS: NearMe booking created ticket successfully")
    
    def test_pets_endpoint_returns_pet_data(self):
        """Test that pets endpoint returns pet data with required fields"""
        response = self.session.get(f"{BASE_URL}/api/pets")
        assert response.status_code == 200, f"Failed to get pets: {response.status_code}"
        
        data = response.json()
        pets = data if isinstance(data, list) else data.get("pets", [])
        
        if len(pets) > 0:
            pet = pets[0]
            # Check for required fields
            assert "name" in pet, "Pet should have name"
            print(f"PASS: Pet data returned with name: {pet.get('name')}")
            
            # Check for breed
            if "breed" in pet:
                print(f"  - Breed: {pet.get('breed')}")
            
            # Check for soul score
            if "overall_score" in pet or "soul_score" in pet:
                score = pet.get("overall_score") or pet.get("soul_score")
                print(f"  - Soul score: {score}")
        else:
            print("INFO: No pets found for user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
