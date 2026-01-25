"""
Test suite for Travel, Advisory, and Stay form submission APIs
Tests the form endpoints that were reported as broken in user's bug list
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTravelAPI:
    """Travel request API tests"""
    
    def test_travel_request_cab(self):
        """Test cab travel request submission"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "cab",
            "pet_id": "pet-99a708f1722a",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "pickup_location": "Test Pickup Address",
            "pickup_city": "Bangalore",
            "drop_location": "Test Drop Address",
            "drop_city": "Delhi",
            "travel_date": "2026-02-15",
            "travel_time": "10:00",
            "user_email": "test@example.com",
            "user_name": "Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "request_id" in data
        assert data["request_id"].startswith("TRV-")
        assert data.get("status") == "submitted"
        print(f"✅ Travel cab request created: {data['request_id']}")
    
    def test_travel_request_flight(self):
        """Test flight travel request submission"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "flight",
            "pet_id": "pet-99a708f1722a",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "pickup_location": "Bangalore Airport",
            "pickup_city": "Bangalore",
            "drop_location": "Delhi Airport",
            "drop_city": "Delhi",
            "travel_date": "2026-02-20",
            "travel_time": "14:00",
            "user_email": "test@example.com",
            "user_name": "Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "request_id" in data
        print(f"✅ Travel flight request created: {data['request_id']}")


class TestAdvisoryAPI:
    """Advisory consultation request API tests"""
    
    def test_advisory_request_behaviour(self):
        """Test behaviour advisory request submission"""
        response = requests.post(f"{BASE_URL}/api/advisory/request", json={
            "advisory_type": "behaviour",
            "pet_id": "pet-99a708f1722a",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "pet_species": "dog",
            "concern": "Test concern for behavior consultation",
            "severity": "moderate",
            "preferred_format": "video_call",
            "user_email": "test@example.com",
            "user_name": "Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data or "ticket_id" in data
        assert "message" in data
        print(f"✅ Advisory behaviour request created: {data.get('request_id', data.get('ticket_id'))}")
    
    def test_advisory_request_nutrition(self):
        """Test nutrition advisory request submission"""
        response = requests.post(f"{BASE_URL}/api/advisory/request", json={
            "advisory_type": "nutrition",
            "pet_id": "pet-99a708f1722a",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "pet_species": "dog",
            "concern": "Diet recommendations for senior dog",
            "severity": "low",
            "preferred_format": "phone_call",
            "user_email": "test@example.com",
            "user_name": "Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data or "ticket_id" in data
        print(f"✅ Advisory nutrition request created")


class TestStayAPI:
    """Stay booking request API tests"""
    
    def test_get_stay_properties(self):
        """Test fetching stay properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        assert len(data["properties"]) > 0
        print(f"✅ Found {len(data['properties'])} stay properties")
        return data["properties"][0]["id"] if data["properties"] else None
    
    def test_stay_booking_request(self):
        """Test stay booking request submission"""
        # First get a valid property ID
        props_response = requests.get(f"{BASE_URL}/api/stay/properties?limit=1")
        assert props_response.status_code == 200
        props_data = props_response.json()
        
        if not props_data.get("properties"):
            pytest.skip("No properties available for testing")
        
        property_id = props_data["properties"][0]["id"]
        
        # Submit booking request
        response = requests.post(f"{BASE_URL}/api/stay/booking-request", json={
            "property_id": property_id,
            "guest_name": "Test User",
            "guest_email": "test@example.com",
            "guest_phone": "9876543210",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "check_in_date": "2026-02-15",
            "check_out_date": "2026-02-17",
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "booking_id" in data
        assert data["booking_id"].startswith("stay-bk-")
        print(f"✅ Stay booking request created: {data['booking_id']}")
    
    def test_stay_booking_invalid_property(self):
        """Test stay booking with invalid property ID"""
        response = requests.post(f"{BASE_URL}/api/stay/booking-request", json={
            "property_id": "invalid-property-id",
            "guest_name": "Test User",
            "guest_email": "test@example.com",
            "guest_phone": "9876543210",
            "pet_name": "Mojo",
            "pet_breed": "Indie",
            "check_in_date": "2026-02-15",
            "check_out_date": "2026-02-17",
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 1
        })
        
        # Should return 404 for invalid property
        assert response.status_code in [404, 400]
        print(f"✅ Invalid property correctly rejected with status {response.status_code}")


class TestPetSoulScoreAPI:
    """Pet Soul Score API tests"""
    
    def test_get_pet_score(self):
        """Test fetching pet soul score"""
        response = requests.get(f"{BASE_URL}/api/pets/pet-99a708f1722a/score")
        
        # May require auth, so accept 401 as valid response
        if response.status_code == 401:
            pytest.skip("Authentication required for pet score")
        
        assert response.status_code == 200
        data = response.json()
        assert "score" in data or "overall_score" in data
        print(f"✅ Pet score retrieved")


class TestHealthAPI:
    """Health check API tests"""
    
    def test_health_check(self):
        """Test basic health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed")
    
    def test_db_health(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"✅ DB health check passed: {data.get('status')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
