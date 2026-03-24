"""
Test Go Pillar - Iteration 200
Tests:
1. Service desk attach_or_create_ticket endpoint with pillar=go
2. Go service booking flows (8 services)
3. Guided Go Paths ticket creation
4. PetFriendlyStays booking flow
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://concierge-wiring.preview.emergentagent.com')

class TestGoServiceDesk:
    """Test service desk ticket creation for Go pillar"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_pet_id = f"test_pet_{uuid.uuid4().hex[:8]}"
        self.test_parent_id = f"test_parent_{uuid.uuid4().hex[:8]}"
    
    def test_health_check(self):
        """Test API health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_service_desk_attach_or_create_ticket_endpoint_exists(self):
        """Test that service desk endpoint exists and accepts POST"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "test_endpoint_check",
                "channel": "pytest_go_pillar_200"
            }
        )
        # Should return 200 or 201 (created)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "ticket_id" in data or "id" in data or "success" in data
        print("✓ Service desk endpoint exists and accepts POST")
    
    def test_go_flight_booking_creates_ticket(self):
        """Test Flight Coordination booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Flight Coordination"],
                "channel": "go_service_flight",
                "initial_message": {
                    "sender": "parent",
                    "text": "I need help booking a flight for my dog Mojo"
                }
            }
        )
        assert response.status_code in [200, 201], f"Flight booking failed: {response.text}"
        print("✓ Flight Coordination booking creates ticket")
    
    def test_go_road_trip_booking_creates_ticket(self):
        """Test Road & Train Travel booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Road & Train Travel"],
                "channel": "go_service_road_trip",
                "initial_message": {
                    "sender": "parent",
                    "text": "Planning a road trip with my dog"
                }
            }
        )
        assert response.status_code in [200, 201], f"Road trip booking failed: {response.text}"
        print("✓ Road & Train Travel booking creates ticket")
    
    def test_go_boarding_booking_creates_ticket(self):
        """Test Boarding & Daycare booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Boarding & Daycare"],
                "channel": "go_service_boarding",
                "initial_message": {
                    "sender": "parent",
                    "text": "Need boarding for my dog while I travel"
                }
            }
        )
        assert response.status_code in [200, 201], f"Boarding booking failed: {response.text}"
        print("✓ Boarding & Daycare booking creates ticket")
    
    def test_go_sitting_booking_creates_ticket(self):
        """Test Pet Sitting booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Pet Sitting"],
                "channel": "go_service_sitting",
                "initial_message": {
                    "sender": "parent",
                    "text": "Need a pet sitter at home"
                }
            }
        )
        assert response.status_code in [200, 201], f"Pet sitting booking failed: {response.text}"
        print("✓ Pet Sitting booking creates ticket")
    
    def test_go_relocation_booking_creates_ticket(self):
        """Test Relocation booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Relocation"],
                "channel": "go_service_relocation",
                "initial_message": {
                    "sender": "parent",
                    "text": "Moving to a new city with my dog"
                }
            }
        )
        assert response.status_code in [200, 201], f"Relocation booking failed: {response.text}"
        print("✓ Relocation booking creates ticket")
    
    def test_go_taxi_booking_creates_ticket(self):
        """Test Pet Taxi booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Pet Taxi"],
                "channel": "go_service_taxi",
                "initial_message": {
                    "sender": "parent",
                    "text": "Need a pet taxi for vet visit"
                }
            }
        )
        assert response.status_code in [200, 201], f"Pet taxi booking failed: {response.text}"
        print("✓ Pet Taxi booking creates ticket")
    
    def test_go_travel_planning_booking_creates_ticket(self):
        """Test Travel Planning booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "service_booking",
                "intent_secondary": ["Travel Planning"],
                "channel": "go_service_travel_planning",
                "initial_message": {
                    "sender": "parent",
                    "text": "Need help planning a trip with my dog"
                }
            }
        )
        assert response.status_code in [200, 201], f"Travel planning booking failed: {response.text}"
        print("✓ Travel Planning booking creates ticket")
    
    def test_go_emergency_travel_creates_urgent_ticket(self):
        """Test Emergency Travel creates urgent service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "emergency_alert",
                "intent_secondary": ["Emergency Travel"],
                "urgency": "emergency",
                "channel": "go_service_emergency",
                "initial_message": {
                    "sender": "parent",
                    "text": "URGENT: Lost pet at airport, need immediate help"
                }
            }
        )
        assert response.status_code in [200, 201], f"Emergency travel booking failed: {response.text}"
        print("✓ Emergency Travel creates urgent ticket")
    
    def test_guided_go_path_creates_ticket(self):
        """Test Guided Go Path completion creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "guided_path_request",
                "intent_secondary": ["First Flight Path"],
                "channel": "go_guided_path_submit",
                "initial_message": {
                    "sender": "parent",
                    "text": "Completed First Flight Path for Mojo"
                },
                "metadata": {
                    "path_id": "first_flight",
                    "path_title": "First Flight Path",
                    "pet_breed": "Indie",
                    "pet_allergies": "chicken",
                    "selections": {
                        "1": ["Health Certificate", "Vaccination Records"],
                        "2": "Cabin — under seat",
                        "3": "Yes — very anxious",
                        "4": "Both"
                    }
                }
            }
        )
        assert response.status_code in [200, 201], f"Guided path ticket failed: {response.text}"
        print("✓ Guided Go Path creates ticket with selections metadata")
    
    def test_pet_friendly_stays_booking_creates_ticket(self):
        """Test PetFriendlyStays booking creates service desk ticket"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.test_parent_id,
                "pet_id": self.test_pet_id,
                "pillar": "go",
                "intent_primary": "nearme_booking",
                "intent_secondary": ["Taj Cidade De Goa Heritage"],
                "channel": "go_pet_friendly_stays",
                "initial_message": {
                    "sender": "parent",
                    "text": "Please book Taj Cidade De Goa Heritage for my dog Mojo"
                },
                "metadata": {
                    "place_name": "Taj Cidade De Goa Heritage",
                    "place_address": "Dona Paula, Vainguinim Beach, Panaji, Goa",
                    "place_id": "ChIJtest123"
                }
            }
        )
        assert response.status_code in [200, 201], f"Pet friendly stays booking failed: {response.text}"
        print("✓ PetFriendlyStays booking creates ticket")
    
    def test_pets_endpoint_returns_pet_data(self):
        """Test that pets endpoint returns pet data for logged in user"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "dipali@clubconcierge.in",
                "password": "test123"
            }
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("token")
        
        # Get pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pets_response.status_code == 200, f"Get pets failed: {pets_response.text}"
        data = pets_response.json()
        
        # Check for Mojo
        pets = data.get("pets", [])
        assert len(pets) > 0, "No pets found"
        
        mojo = next((p for p in pets if p.get("name") == "Mojo"), None)
        assert mojo is not None, "Mojo not found in pets"
        assert mojo.get("breed") == "Indie", f"Expected breed 'Indie', got {mojo.get('breed')}"
        assert mojo.get("city") == "Goa", f"Expected city 'Goa', got {mojo.get('city')}"
        
        print(f"✓ Pets endpoint returns Mojo with breed={mojo.get('breed')}, city={mojo.get('city')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
