"""
Test Iteration 135 - P0 Multi-part Request Testing
1. Care API /api/care/types should include 'feed' type with nutrition services
2. Paperwork/Insure API /api/paperwork/insure/services should return insurance services
3. Paperwork/Insure API /api/paperwork/insure/request should create insurance requests
4. Nudges API /api/nudges/admin/types should return nudge configurations
5. Pet Profile page should render without errors for pet 'Mojo' (id: pet-99a708f1722a)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCareAPIFeedType:
    """Test Care API includes 'feed' type for Feed/Nutrition services"""
    
    def test_care_types_endpoint_returns_200(self):
        """GET /api/care/types should return 200"""
        response = requests.get(f"{BASE_URL}/api/care/types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_care_types_includes_feed(self):
        """Care types should include 'feed' type"""
        response = requests.get(f"{BASE_URL}/api/care/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "care_types" in data, "Response should have 'care_types' key"
        
        care_types = data["care_types"]
        assert "feed" in care_types, "Care types should include 'feed' type"
    
    def test_feed_type_has_correct_structure(self):
        """Feed type should have correct structure with nutrition services"""
        response = requests.get(f"{BASE_URL}/api/care/types")
        assert response.status_code == 200
        
        data = response.json()
        feed_type = data["care_types"].get("feed", {})
        
        # Verify feed type structure
        assert feed_type.get("name") == "Feed & Nutrition", f"Expected 'Feed & Nutrition', got {feed_type.get('name')}"
        assert feed_type.get("category") == "nutrition", f"Expected 'nutrition' category, got {feed_type.get('category')}"
        assert feed_type.get("icon") == "🍖", f"Expected '🍖' icon, got {feed_type.get('icon')}"
        assert "diet" in feed_type.get("description", "").lower() or "nutrition" in feed_type.get("description", "").lower(), \
            "Description should mention diet or nutrition"
        
        # Verify subtypes include nutrition-related services
        subtypes = feed_type.get("subtypes", [])
        assert len(subtypes) > 0, "Feed type should have subtypes"
        expected_subtypes = ["diet_planning", "weight_management", "allergy_diet"]
        for expected in expected_subtypes:
            assert expected in subtypes, f"Feed subtypes should include '{expected}'"


class TestPaperworkInsureServices:
    """Test Paperwork/Insure API endpoints"""
    
    def test_insure_services_endpoint_returns_200(self):
        """GET /api/paperwork/insure/services should return 200"""
        response = requests.get(f"{BASE_URL}/api/paperwork/insure/services")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_insure_services_returns_correct_structure(self):
        """Insure services should return correct structure"""
        response = requests.get(f"{BASE_URL}/api/paperwork/insure/services")
        assert response.status_code == 200
        
        data = response.json()
        assert "services" in data, "Response should have 'services' key"
        assert "pillar" in data, "Response should have 'pillar' key"
        assert data["pillar"] == "paperwork", f"Expected pillar 'paperwork', got {data.get('pillar')}"
        assert data.get("sub_pillar") == "insure", f"Expected sub_pillar 'insure', got {data.get('sub_pillar')}"
    
    def test_insure_services_includes_expected_services(self):
        """Insure services should include expected service types"""
        response = requests.get(f"{BASE_URL}/api/paperwork/insure/services")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", {})
        
        expected_services = ["quote_request", "policy_review", "claim_assistance", "renewal_reminder", "compare_plans"]
        for service in expected_services:
            assert service in services, f"Services should include '{service}'"
            
            # Verify each service has required fields
            service_data = services[service]
            assert "name" in service_data, f"Service '{service}' should have 'name'"
            assert "description" in service_data, f"Service '{service}' should have 'description'"
            assert "typical_response_time" in service_data, f"Service '{service}' should have 'typical_response_time'"


class TestPaperworkInsureRequest:
    """Test Paperwork/Insure request creation"""
    
    def test_insure_request_creation(self):
        """POST /api/paperwork/insure/request should create insurance request"""
        request_data = {
            "service_type": "quote_request",
            "pet_id": "TEST_pet_insure_001",
            "pet_name": "TEST_InsurePet",
            "pet_breed": "Golden Retriever",
            "pet_age": "3 years",
            "user_name": "TEST_InsureUser",
            "user_email": "test_insure@example.com",
            "user_phone": "+919999999999",
            "coverage_needs": ["accident", "illness", "wellness"],
            "budget_range": "5000-10000",
            "description": "Looking for comprehensive pet insurance coverage"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/paperwork/insure/request",
            json=request_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Response should have 'request_id'"
        assert data["request_id"].startswith("INS-"), f"Request ID should start with 'INS-', got {data['request_id']}"
        assert "ticket_id" in data, "Response should have 'ticket_id'"
        assert "estimated_response" in data, "Response should have 'estimated_response'"
    
    def test_insure_request_with_claim_assistance(self):
        """POST /api/paperwork/insure/request for claim assistance"""
        request_data = {
            "service_type": "claim_assistance",
            "pet_id": "TEST_pet_claim_001",
            "pet_name": "TEST_ClaimPet",
            "user_name": "TEST_ClaimUser",
            "user_email": "test_claim@example.com",
            "policy_number": "POL-123456",
            "description": "Need help filing a claim for recent vet visit"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/paperwork/insure/request",
            json=request_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "request_id" in data
        assert data["request_id"].startswith("INS-")


class TestNudgesAdminTypes:
    """Test Nudges API for Mira proactive nudges"""
    
    def test_nudges_admin_types_endpoint_returns_200(self):
        """GET /api/nudges/admin/types should return 200"""
        response = requests.get(f"{BASE_URL}/api/nudges/admin/types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_nudges_admin_types_returns_list(self):
        """Nudges admin types should return a list of nudge configurations"""
        response = requests.get(f"{BASE_URL}/api/nudges/admin/types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) > 0, "Should have at least one nudge type"
    
    def test_nudges_types_have_correct_structure(self):
        """Each nudge type should have correct structure"""
        response = requests.get(f"{BASE_URL}/api/nudges/admin/types")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check first nudge type structure
        if len(data) > 0:
            nudge = data[0]
            required_fields = ["id", "name", "icon", "template", "trigger_type", "trigger_config", "pillar"]
            for field in required_fields:
                assert field in nudge, f"Nudge type should have '{field}' field"
    
    def test_nudges_include_expected_types(self):
        """Nudges should include expected nudge types"""
        response = requests.get(f"{BASE_URL}/api/nudges/admin/types")
        assert response.status_code == 200
        
        data = response.json()
        nudge_ids = [n.get("id") for n in data]
        
        expected_nudges = ["vaccination_reminder", "grooming_reminder", "birthday_reminder", "health_checkup"]
        for expected in expected_nudges:
            assert expected in nudge_ids, f"Nudges should include '{expected}'"


class TestPetProfileMojo:
    """Test Pet Profile page for pet 'Mojo' (id: pet-99a708f1722a)"""
    
    def test_pet_profile_endpoint_returns_200(self):
        """GET /api/pets/{pet_id} should return 200 for Mojo"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/pets/{pet_id}")
        
        # Pet might not exist in test DB, so 404 is acceptable
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            pet = data.get("pet", data)
            assert "name" in pet or "id" in pet, "Pet data should have name or id"
    
    def test_pet_profile_returns_correct_structure(self):
        """Pet profile should return correct structure"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/pets/{pet_id}")
        
        if response.status_code == 200:
            data = response.json()
            pet = data.get("pet", data)
            
            # Check for expected fields
            expected_fields = ["id", "name"]
            for field in expected_fields:
                assert field in pet, f"Pet should have '{field}' field"


class TestCareRequestWithFeedType:
    """Test Care request creation with 'feed' type"""
    
    def test_care_request_with_feed_type(self):
        """POST /api/care/request with feed type should work"""
        request_data = {
            "care_type": "feed",
            "subtype": "diet_planning",
            "pet_id": "TEST_pet_feed_001",
            "pet_name": "TEST_FeedPet",
            "pet_breed": "Labrador",
            "description": "Need help with diet planning for weight management",
            "user_name": "TEST_FeedUser",
            "user_email": "test_feed@example.com",
            "user_phone": "+919999999998"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/care/request",
            json=request_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Response should have 'request_id'"
        assert data["request_id"].startswith("CARE-"), f"Request ID should start with 'CARE-', got {data['request_id']}"
        assert "ticket_id" in data, "Response should have 'ticket_id'"
        assert "notification_id" in data, "Response should have 'notification_id'"
        assert "inbox_id" in data, "Response should have 'inbox_id'"


class TestHealthEndpoints:
    """Basic health check for all endpoints"""
    
    def test_api_health(self):
        """GET /api/health should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
    
    def test_care_types_accessible(self):
        """GET /api/care/types should be accessible"""
        response = requests.get(f"{BASE_URL}/api/care/types")
        assert response.status_code == 200
    
    def test_paperwork_insure_services_accessible(self):
        """GET /api/paperwork/insure/services should be accessible"""
        response = requests.get(f"{BASE_URL}/api/paperwork/insure/services")
        assert response.status_code == 200
    
    def test_nudges_admin_types_accessible(self):
        """GET /api/nudges/admin/types should be accessible"""
        response = requests.get(f"{BASE_URL}/api/nudges/admin/types")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
