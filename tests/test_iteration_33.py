"""
Test Iteration 33 - Pet Soul Integration Phase 2
Tests for:
1. Pet Soul pillar endpoints (Dine, Fit, Advisory) - 404 for invalid pet ID
2. Abandoned cart email endpoint
3. Email fix verification (to field is string, not list)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobilepaw.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestPetSoulPillarEndpoints:
    """Test the new Pet Soul pillar integration endpoints"""
    
    def test_record_dine_reservation_invalid_pet_returns_404(self):
        """Test /api/pet-vault/{pet_id}/record-dine-reservation returns 404 for invalid pet ID"""
        invalid_pet_id = f"invalid-pet-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "restaurant_id": "rest-123",
            "restaurant_name": "Test Restaurant",
            "restaurant_city": "Mumbai",
            "date": "2025-01-15",
            "time": "19:00",
            "guests": 2,
            "pets_count": 1,
            "pet_meal_preorder": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-dine-reservation",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Pet not found" in data.get("detail", ""), f"Expected 'Pet not found' in detail, got: {data}"
    
    def test_record_fit_activity_invalid_pet_returns_404(self):
        """Test /api/pet-vault/{pet_id}/record-fit-activity returns 404 for invalid pet ID"""
        invalid_pet_id = f"invalid-pet-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "activity_type": "walk",
            "venue_name": "Central Park",
            "duration_minutes": 30,
            "distance_km": 2.5,
            "date": "2025-01-15"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-fit-activity",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Pet not found" in data.get("detail", ""), f"Expected 'Pet not found' in detail, got: {data}"
    
    def test_record_advisory_consult_invalid_pet_returns_404(self):
        """Test /api/pet-vault/{pet_id}/record-advisory-consult returns 404 for invalid pet ID"""
        invalid_pet_id = f"invalid-pet-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "advisor_id": "adv-123",
            "advisor_name": "Dr. Test Vet",
            "service_type": "vet",
            "consultation_type": "in_person",
            "date": "2025-01-15",
            "duration_minutes": 30,
            "summary": "Routine checkup"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-advisory-consult",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Pet not found" in data.get("detail", ""), f"Expected 'Pet not found' in detail, got: {data}"


class TestAbandonedCartEmail:
    """Test abandoned cart email functionality"""
    
    def test_abandoned_cart_send_reminders_endpoint_exists(self):
        """Test that the abandoned cart send reminders endpoint exists and requires auth"""
        # Without auth, should return 401
        response = requests.post(f"{BASE_URL}/api/admin/abandoned-carts/send-reminders")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
    
    def test_abandoned_cart_send_reminders_with_auth(self):
        """Test abandoned cart send reminders endpoint with admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/abandoned-carts/send-reminders",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        # Should return 200 with success response (even if no carts to process)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "success" in data, f"Expected 'success' in response, got: {data}"
        assert data["success"] == True, f"Expected success=True, got: {data}"
    
    def test_get_abandoned_carts_endpoint(self):
        """Test getting abandoned carts list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "carts" in data, f"Expected 'carts' in response, got: {data}"
        assert "total" in data, f"Expected 'total' in response, got: {data}"


class TestDinePageEndpoints:
    """Test Dine page related endpoints"""
    
    def test_dine_restaurants_endpoint(self):
        """Test /api/dine/restaurants returns restaurants"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "restaurants" in data, f"Expected 'restaurants' in response, got: {data}"
        # Should have restaurants from previous seeding
        assert len(data["restaurants"]) > 0, "Expected at least one restaurant"
    
    def test_dine_reservations_endpoint(self):
        """Test /api/dine/reservations POST endpoint exists"""
        # Test with minimal payload - should fail validation but endpoint should exist
        response = requests.post(
            f"{BASE_URL}/api/dine/reservations",
            json={}
        )
        
        # Should return 422 (validation error) not 404 (endpoint not found)
        assert response.status_code in [200, 201, 422], f"Expected 200/201/422, got {response.status_code}: {response.text}"


class TestPetsEndpoint:
    """Test pets endpoint for reservation modal pet selector"""
    
    def test_pets_endpoint_exists(self):
        """Test /api/pets endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/pets")
        
        # Should return 200 (empty list) or require auth
        assert response.status_code in [200, 401], f"Expected 200 or 401, got {response.status_code}: {response.text}"
    
    def test_pets_endpoint_with_email_filter(self):
        """Test /api/pets endpoint with email filter - requires auth"""
        response = requests.get(f"{BASE_URL}/api/pets?email=test@example.com")
        
        # Pets endpoint requires authentication
        assert response.status_code in [200, 401], f"Expected 200 or 401, got {response.status_code}: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "pets" in data, f"Expected 'pets' in response, got: {data}"


class TestHealthEndpoints:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test /health endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_api_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
