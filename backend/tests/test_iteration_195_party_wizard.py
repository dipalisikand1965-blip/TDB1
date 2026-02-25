"""
Test Iteration 195: Party Planning Wizard & Cross-Pillar Journey Features
Tests:
1. Party Planning Wizard - POST /api/celebrate/party-request
2. Products sorted by newest first - GET /api/products
3. Services sorted by newest first - GET /api/services
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPartyPlanningWizard:
    """Test Party Planning Wizard API endpoints"""
    
    def test_create_party_request_success(self):
        """Test creating a party planning request"""
        payload = {
            "petId": "test-pet-123",
            "petName": "Buddy",
            "petType": "dog",
            "occasion": "birthday",
            "date": "2026-02-15",
            "time": "Afternoon",
            "guestCount": "5-10",
            "venue": "home",
            "budget": "standard",
            "specialRequests": "Peanut butter cake please!",
            "includeGrooming": True,
            "includePhotography": False,
            "includeVenue": False,
            "user_email": "test@example.com",
            "user_name": "Test User"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/party-request", json=payload)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "request_id" in data, "Expected request_id in response"
        assert "ticket_id" in data, "Expected ticket_id in response"
        assert data["request_id"].startswith("PARTY-"), f"Request ID should start with PARTY-, got {data['request_id']}"
        assert data["ticket_id"].startswith("CEL-"), f"Ticket ID should start with CEL-, got {data['ticket_id']}"
        
        print(f"✓ Party request created: {data['request_id']}, ticket: {data['ticket_id']}")
        return data
    
    def test_create_party_request_minimal(self):
        """Test creating a party request with minimal required fields"""
        payload = {
            "petId": "",
            "petName": "Max",
            "petType": "cat",
            "occasion": "gotcha-day",
            "date": "2026-03-01",
            "time": "Morning",
            "guestCount": "1-5",
            "venue": "outdoor",
            "budget": "budget"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/party-request", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "request_id" in data
        
        print(f"✓ Minimal party request created: {data['request_id']}")
    
    def test_get_party_requests(self):
        """Test retrieving party requests"""
        response = requests.get(f"{BASE_URL}/api/celebrate/party-requests")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "requests" in data, "Expected 'requests' key in response"
        assert "total" in data, "Expected 'total' key in response"
        assert isinstance(data["requests"], list), "Requests should be a list"
        
        print(f"✓ Retrieved {data['total']} party requests")
    
    def test_get_party_requests_with_status_filter(self):
        """Test retrieving party requests with status filter"""
        response = requests.get(f"{BASE_URL}/api/celebrate/party-requests?status=pending")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "requests" in data
        
        # All returned requests should have pending status
        for req in data["requests"]:
            assert req.get("status") == "pending", f"Expected status=pending, got {req.get('status')}"
        
        print(f"✓ Retrieved {data['total']} pending party requests")


class TestProductsSortedByNewest:
    """Test that products are sorted by created_at descending (newest first)"""
    
    def test_products_endpoint_returns_data(self):
        """Test GET /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Expected 'products' key in response"
        assert isinstance(data["products"], list), "Products should be a list"
        
        print(f"✓ Products endpoint returned {len(data['products'])} products")
    
    def test_products_pillar_filter(self):
        """Test products filtered by pillar"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=celebrate&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data
        
        print(f"✓ Celebrate pillar products: {len(data['products'])}")
    
    def test_products_include_pawmeter(self):
        """Test that products include pawmeter field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=20")
        
        assert response.status_code == 200
        
        data = response.json()
        products_with_pawmeter = [p for p in data["products"] if p.get("pawmeter")]
        
        print(f"✓ Products with pawmeter: {len(products_with_pawmeter)}/{len(data['products'])}")
        
        # Check pawmeter structure if present
        if products_with_pawmeter:
            pawmeter = products_with_pawmeter[0]["pawmeter"]
            assert "overall" in pawmeter, "Pawmeter should have 'overall' score"
            print(f"  Sample pawmeter: overall={pawmeter.get('overall')}")


class TestServicesSortedByNewest:
    """Test that services are sorted by created_at descending (newest first)"""
    
    def test_services_endpoint_returns_data(self):
        """Test GET /api/services returns services"""
        response = requests.get(f"{BASE_URL}/api/services?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "services" in data, "Expected 'services' key in response"
        assert isinstance(data["services"], list), "Services should be a list"
        
        print(f"✓ Services endpoint returned {len(data['services'])} services")
    
    def test_services_pillar_filter(self):
        """Test services filtered by pillar"""
        response = requests.get(f"{BASE_URL}/api/services?pillar=celebrate&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "services" in data
        
        # All returned services should be from celebrate pillar
        for svc in data["services"]:
            assert svc.get("pillar") == "celebrate", f"Expected pillar=celebrate, got {svc.get('pillar')}"
        
        print(f"✓ Celebrate pillar services: {len(data['services'])}")
    
    def test_services_include_pawmeter(self):
        """Test that services include pawmeter field"""
        response = requests.get(f"{BASE_URL}/api/services?limit=20")
        
        assert response.status_code == 200
        
        data = response.json()
        services_with_pawmeter = [s for s in data["services"] if s.get("pawmeter")]
        
        print(f"✓ Services with pawmeter: {len(services_with_pawmeter)}/{len(data['services'])}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "healthy", f"Expected status=healthy, got {data.get('status')}"
        
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
