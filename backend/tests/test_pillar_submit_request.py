"""
Test pillar page Submit Request endpoints
Tests for: Paperwork, Advisory, Care request endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaperworkRequest:
    """Test /api/paperwork/request endpoint"""
    
    def test_paperwork_request_success(self):
        """Test successful paperwork request submission"""
        response = requests.post(
            f"{BASE_URL}/api/paperwork/request",
            json={
                "request_type": "document_assistance",
                "description": "Test request for document organization help",
                "urgency": "normal"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "request_id" in data
        assert data["request_id"].startswith("PAPER-")
        print(f"✅ Paperwork request created: {data['request_id']}")
    
    def test_paperwork_request_with_all_fields(self):
        """Test paperwork request with all optional fields"""
        response = requests.post(
            f"{BASE_URL}/api/paperwork/request",
            json={
                "request_type": "digitization",
                "description": "Need help digitizing old vaccination records",
                "urgency": "high",
                "pet_name": "Test Pet",
                "user_email": "test@example.com",
                "user_name": "Test User"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        print(f"✅ Paperwork request with all fields: {data['request_id']}")


class TestAdvisoryRequest:
    """Test /api/advisory/request endpoint"""
    
    def test_advisory_request_success(self):
        """Test successful advisory request submission"""
        response = requests.post(
            f"{BASE_URL}/api/advisory/request",
            json={
                "advisory_type": "behaviour",
                "concern": "Test concern about pet behavior",
                "severity": "moderate",
                "preferred_format": "video_call"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "request_id" in data
        assert data["request_id"].startswith("ADV-")
        print(f"✅ Advisory request created: {data['request_id']}")
    
    def test_advisory_request_nutrition(self):
        """Test advisory request for nutrition type"""
        response = requests.post(
            f"{BASE_URL}/api/advisory/request",
            json={
                "advisory_type": "nutrition",
                "concern": "Need help with diet planning for senior dog",
                "severity": "mild",
                "preferred_format": "phone_call",
                "pet_name": "Test Pet",
                "pet_breed": "Labrador"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        print(f"✅ Advisory nutrition request: {data['request_id']}")


class TestCareRequest:
    """Test /api/care/request endpoint"""
    
    def test_care_request_requires_pet_info(self):
        """Test that care request requires pet_id and pet_name"""
        response = requests.post(
            f"{BASE_URL}/api/care/request",
            json={
                "care_type": "grooming",
                "description": "Test care request"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should fail validation - requires pet_id and pet_name
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        print("✅ Care request correctly requires pet_id and pet_name")
    
    def test_care_request_with_pet_info(self):
        """Test care request with required pet info"""
        response = requests.post(
            f"{BASE_URL}/api/care/request",
            json={
                "care_type": "grooming",
                "description": "Full grooming session needed",
                "pet_id": "test-pet-123",
                "pet_name": "Test Pet",
                "pet_breed": "Golden Retriever",
                "frequency": "one_time",
                "location_type": "home"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data or "message" in data
        print(f"✅ Care request created successfully")


class TestPillarProducts:
    """Test pillar product endpoints"""
    
    def test_paperwork_products(self):
        """Test paperwork products endpoint"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Paperwork products: {len(data['products'])} items")
    
    def test_paperwork_bundles(self):
        """Test paperwork bundles endpoint"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Paperwork bundles: {len(data['bundles'])} items")
    
    def test_advisory_products(self):
        """Test advisory products endpoint"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Advisory products: {len(data['products'])} items")
    
    def test_advisory_bundles(self):
        """Test advisory bundles endpoint"""
        response = requests.get(f"{BASE_URL}/api/advisory/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Advisory bundles: {len(data['bundles'])} items")
    
    def test_care_products(self):
        """Test care products endpoint"""
        response = requests.get(f"{BASE_URL}/api/care/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Care products: {len(data['products'])} items")
    
    def test_care_bundles(self):
        """Test care bundles endpoint"""
        response = requests.get(f"{BASE_URL}/api/care/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Care bundles: {len(data['bundles'])} items")


class TestPillarCategories:
    """Test pillar category endpoints"""
    
    def test_paperwork_categories(self):
        """Test paperwork categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/paperwork/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Paperwork categories loaded")
    
    def test_advisory_advisors(self):
        """Test advisory advisors endpoint"""
        response = requests.get(f"{BASE_URL}/api/advisory/advisors")
        assert response.status_code == 200
        data = response.json()
        assert "advisors" in data
        print(f"✅ Advisory advisors: {len(data['advisors'])} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
