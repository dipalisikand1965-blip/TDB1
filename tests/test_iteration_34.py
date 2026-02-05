"""
Test Iteration 34 - Pet Soul Integration Phase 2 - FitPage and AdvisoryPage
Tests for:
1. FitPage submits fitness request and writes to Pet Soul via /api/pet-vault/{pet_id}/record-fit-activity
2. AdvisoryPage submits advisory request and writes to Pet Soul via /api/pet-vault/{pet_id}/record-advisory-consult
3. Backend endpoint /api/pet-vault/{pet_id}/record-fit-activity returns 404 for invalid pet
4. Backend endpoint /api/pet-vault/{pet_id}/record-advisory-consult returns 404 for invalid pet
5. Fit and Advisory request endpoints work correctly
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://filter-fix-phase.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestPetSoulFitEndpoint:
    """Test the Pet Soul Fit activity recording endpoint"""
    
    def test_record_fit_activity_invalid_pet_returns_404(self):
        """Test /api/pet-vault/{pet_id}/record-fit-activity returns 404 for invalid pet ID"""
        invalid_pet_id = f"invalid-pet-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "activity_type": "assessment",
            "venue_name": "The Doggy Company - Fit",
            "duration_minutes": None,
            "distance_km": None,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "notes": "Goals: weight_loss, endurance. Activity level: moderate",
            "booking_id": f"fit-req-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-fit-activity",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Pet not found" in data.get("detail", ""), f"Expected 'Pet not found' in detail, got: {data}"
    
    def test_record_fit_activity_valid_payload_structure(self):
        """Test that the endpoint accepts the correct payload structure (even if pet doesn't exist)"""
        invalid_pet_id = f"test-pet-{uuid.uuid4().hex[:8]}"
        
        # This is the exact payload structure sent from FitPage.jsx
        payload = {
            "activity_type": "exercise_plan",
            "venue_name": "The Doggy Company - Fit",
            "venue_id": None,
            "duration_minutes": None,
            "distance_km": None,
            "date": "2025-01-15",
            "notes": "Goals: weight_loss, muscle_building. Activity level: active",
            "booking_id": "fit-req-abc123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-fit-activity",
            json=payload
        )
        
        # Should return 404 (pet not found), not 422 (validation error)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestPetSoulAdvisoryEndpoint:
    """Test the Pet Soul Advisory consultation recording endpoint"""
    
    def test_record_advisory_consult_invalid_pet_returns_404(self):
        """Test /api/pet-vault/{pet_id}/record-advisory-consult returns 404 for invalid pet ID"""
        invalid_pet_id = f"invalid-pet-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "advisor_id": "tdc-advisory",
            "advisor_name": "The Doggy Company Advisory",
            "service_type": "behaviour",
            "consultation_type": "video_call",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "duration_minutes": None,
            "summary": "Concern about pet behavior during walks",
            "recommendations": [],
            "follow_up_date": None,
            "booking_id": f"adv-req-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-advisory-consult",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Pet not found" in data.get("detail", ""), f"Expected 'Pet not found' in detail, got: {data}"
    
    def test_record_advisory_consult_valid_payload_structure(self):
        """Test that the endpoint accepts the correct payload structure (even if pet doesn't exist)"""
        invalid_pet_id = f"test-pet-{uuid.uuid4().hex[:8]}"
        
        # This is the exact payload structure sent from AdvisoryPage.jsx
        payload = {
            "advisor_id": "tdc-advisory",
            "advisor_name": "The Doggy Company Advisory",
            "service_type": "nutrition",
            "consultation_type": "phone_call",
            "date": "2025-01-15",
            "duration_minutes": None,
            "summary": "Need help with pet nutrition planning for weight management",
            "recommendations": [],
            "follow_up_date": None,
            "booking_id": "adv-req-xyz789"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{invalid_pet_id}/record-advisory-consult",
            json=payload
        )
        
        # Should return 404 (pet not found), not 422 (validation error)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestFitPageEndpoints:
    """Test Fit page related endpoints"""
    
    def test_fit_plans_endpoint(self):
        """Test /api/fit/plans returns fitness plans"""
        response = requests.get(f"{BASE_URL}/api/fit/plans")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "plans" in data, f"Expected 'plans' in response, got: {data}"
    
    def test_fit_products_endpoint(self):
        """Test /api/fit/products returns fitness products"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products" in data, f"Expected 'products' in response, got: {data}"
    
    def test_fit_bundles_endpoint(self):
        """Test /api/fit/bundles returns fitness bundles"""
        response = requests.get(f"{BASE_URL}/api/fit/bundles")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "bundles" in data, f"Expected 'bundles' in response, got: {data}"
    
    def test_fit_request_endpoint_works(self):
        """Test /api/fit/request POST endpoint accepts requests"""
        payload = {
            "fit_type": "assessment",
            "current_activity_level": "moderate",
            "fitness_goals": ["weight_loss"],
            "pet_id": "test-pet",
            "pet_name": "Test Dog"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/fit/request",
            json=payload
        )
        
        # Endpoint accepts requests (creates ticket)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "request_id" in data, f"Expected 'request_id' in response, got: {data}"
        assert "ticket_id" in data, f"Expected 'ticket_id' in response, got: {data}"


class TestAdvisoryPageEndpoints:
    """Test Advisory page related endpoints"""
    
    def test_advisory_advisors_endpoint(self):
        """Test /api/advisory/advisors returns advisors"""
        response = requests.get(f"{BASE_URL}/api/advisory/advisors")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "advisors" in data, f"Expected 'advisors' in response, got: {data}"
    
    def test_advisory_products_endpoint(self):
        """Test /api/advisory/products returns advisory products"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products" in data, f"Expected 'products' in response, got: {data}"
    
    def test_advisory_bundles_endpoint(self):
        """Test /api/advisory/bundles returns advisory bundles"""
        response = requests.get(f"{BASE_URL}/api/advisory/bundles")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "bundles" in data, f"Expected 'bundles' in response, got: {data}"
    
    def test_advisory_request_endpoint_works(self):
        """Test /api/advisory/request POST endpoint accepts requests"""
        payload = {
            "advisory_type": "behaviour",
            "concern": "Test concern",
            "severity": "moderate",
            "pet_id": "test-pet",
            "pet_name": "Test Dog"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/advisory/request",
            json=payload
        )
        
        # Endpoint accepts requests (creates ticket)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "request_id" in data, f"Expected 'request_id' in response, got: {data}"
        assert "ticket_id" in data, f"Expected 'ticket_id' in response, got: {data}"


class TestMyPetsEndpoint:
    """Test my-pets endpoint used by FitPage and AdvisoryPage"""
    
    def test_my_pets_endpoint_requires_auth(self):
        """Test /api/pets/my-pets requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets")
        
        # Should require auth
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


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
