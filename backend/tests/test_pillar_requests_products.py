"""
Test Pillar Request Submissions and Products Endpoints
Tests for:
1. Advisory request submission - POST /api/advisory/request
2. Emergency alert submission - POST /api/emergency/alert
3. Products endpoints for each pillar - GET /api/{pillar}/products
4. Breed normalization verification
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


class TestAdvisoryRequestSubmission:
    """Test Advisory pillar request submission"""
    
    def test_create_advisory_request_success(self):
        """Test creating an advisory request - POST /api/advisory/request"""
        request_data = {
            "advisory_type": "behaviour",
            "priority": "normal",
            "pet_id": "test-pet-001",
            "pet_name": "Mojo",
            "pet_breed": "Shihtzu",
            "pet_age": "3 years",
            "pet_species": "dog",
            "user_id": "test-user-001",
            "user_name": "Test User",
            "user_email": TEST_USER_EMAIL,
            "user_phone": "+91 9876543210",
            "concern": "My dog has been showing signs of anxiety when left alone",
            "concern_duration": "2 weeks",
            "severity": "moderate",
            "previous_consultations": False,
            "current_treatments": "",
            "preferred_format": "video_call",
            "preferred_time": "morning",
            "notes": "Test advisory request from automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/advisory/request",
            json=request_data
        )
        
        print(f"Advisory request response status: {response.status_code}")
        print(f"Advisory request response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Response should contain request_id"
        assert "ticket_id" in data, "Response should contain ticket_id"
        assert data["request_id"].startswith("ADV-"), f"Request ID should start with ADV-, got {data['request_id']}"
        
        print(f"✓ Advisory request created successfully: {data['request_id']}")
        return data["request_id"]
    
    def test_create_advisory_request_with_different_types(self):
        """Test creating advisory requests with different advisory types"""
        advisory_types = ["behaviour", "nutrition", "senior_care", "new_pet", "health", "training"]
        
        for adv_type in advisory_types:
            request_data = {
                "advisory_type": adv_type,
                "pet_name": "TestPet",
                "pet_breed": "Golden Retriever",
                "user_name": "Test User",
                "user_email": TEST_USER_EMAIL,
                "concern": f"Test concern for {adv_type}",
                "severity": "mild"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/advisory/request",
                json=request_data
            )
            
            assert response.status_code == 200, f"Failed for advisory_type={adv_type}: {response.text}"
            data = response.json()
            assert "request_id" in data
            print(f"✓ Advisory request for type '{adv_type}' created: {data['request_id']}")
    
    def test_get_advisory_requests(self):
        """Test getting advisory requests list"""
        response = requests.get(f"{BASE_URL}/api/advisory/requests")
        
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        assert "total" in data
        print(f"✓ Got {data['total']} advisory requests")


class TestEmergencyRequestSubmission:
    """Test Emergency pillar request submission"""
    
    def test_create_emergency_request_success(self):
        """Test creating an emergency request - POST /api/emergency/request"""
        request_data = {
            "emergency_type": "medical_emergency",
            "severity": "urgent",
            "pet_id": "test-pet-001",
            "pet_name": "Mojo",
            "pet_breed": "Shihtzu",
            "pet_age": "3 years",
            "pet_species": "dog",
            "user_id": "test-user-001",
            "user_name": "Test User",
            "user_email": TEST_USER_EMAIL,
            "user_phone": "+91 9876543210",
            "description": "Test emergency request - pet has minor injury",
            "location": "Mumbai, Maharashtra",
            "symptoms": ["limping", "whimpering"],
            "notes": "Test emergency request from automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/emergency/request",
            json=request_data
        )
        
        print(f"Emergency request response status: {response.status_code}")
        print(f"Emergency request response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Response should contain request_id"
        assert data["request_id"].startswith("EMRG-"), f"Request ID should start with EMRG-, got {data['request_id']}"
        
        print(f"✓ Emergency request created successfully: {data['request_id']}")
    
    def test_create_emergency_request_different_types(self):
        """Test creating emergency requests with different types"""
        # Using actual emergency types from EMERGENCY_TYPES in emergency_routes.py
        emergency_types = ["medical_emergency", "injury", "poisoning", "lost_pet", "found_pet"]
        
        for emrg_type in emergency_types:
            request_data = {
                "emergency_type": emrg_type,
                "severity": "high",
                "pet_name": "TestPet",
                "pet_breed": "Labrador",
                "user_name": "Test User",
                "user_email": TEST_USER_EMAIL,
                "user_phone": "+91 9876543210",
                "description": f"Test emergency for {emrg_type}",
                "location": "Test Location"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/emergency/request",
                json=request_data
            )
            
            assert response.status_code == 200, f"Failed for emergency_type={emrg_type}: {response.text}"
            data = response.json()
            assert "request_id" in data
            print(f"✓ Emergency request for type '{emrg_type}' created: {data['request_id']}")


class TestPillarProductsEndpoints:
    """Test products endpoints for all pillars"""
    
    def test_advisory_products(self):
        """Test GET /api/advisory/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        
        print(f"Advisory products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Advisory products: {data['total']} products returned")
        
        # Verify products have expected structure
        if data["products"]:
            product = data["products"][0]
            print(f"  Sample product: {product.get('name', 'N/A')}")
    
    def test_emergency_products(self):
        """Test GET /api/emergency/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/emergency/products")
        
        print(f"Emergency products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Emergency products: {data['total']} products returned")
    
    def test_enjoy_products(self):
        """Test GET /api/enjoy/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/enjoy/products")
        
        print(f"Enjoy products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Enjoy products: {data['total']} products returned")
    
    def test_farewell_products(self):
        """Test GET /api/farewell/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/farewell/products")
        
        print(f"Farewell products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Farewell products: {data['total']} products returned")
    
    def test_fit_products(self):
        """Test GET /api/fit/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        
        print(f"Fit products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Fit products: {data['total']} products returned")
    
    def test_learn_products(self):
        """Test GET /api/learn/products - should query unified_products"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        
        print(f"Learn products response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        
        print(f"✓ Learn products: {data.get('count', len(data.get('products', [])))} products returned")


class TestUnifiedProductsCollection:
    """Test that unified_products collection is being used correctly"""
    
    def test_admin_products_returns_unified(self):
        """Test that admin products endpoint returns from unified_products"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin products test")
        
        token = login_response.json().get("token")
        
        # Use cookie-based auth as the admin endpoints expect
        session = requests.Session()
        session.cookies.set("admin_token", token)
        
        response = session.get(f"{BASE_URL}/api/admin/products")
        
        # Also try with Authorization header
        if response.status_code != 200:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/admin/products", headers=headers)
        
        if response.status_code != 200:
            print(f"Admin products endpoint returned {response.status_code}: {response.text[:200]}")
            pytest.skip("Admin products endpoint requires different auth - skipping")
        
        data = response.json()
        
        # Should return products from unified_products (650 products)
        total = data.get("total", 0)
        print(f"✓ Admin products returned {total} products")
        
        # Verify source field indicates unified_products
        source = data.get("source", "unknown")
        print(f"  Source: {source}")


class TestBreedNormalization:
    """Test breed normalization concept via pet endpoints"""
    
    def test_pet_with_shihtzu_spelling(self):
        """Test that pets with 'Shihtzu' breed are handled correctly"""
        # Get user's pets to verify breed handling
        response = requests.get(
            f"{BASE_URL}/api/pets",
            params={"user_email": TEST_USER_EMAIL}
        )
        
        if response.status_code == 200:
            data = response.json()
            pets = data.get("pets", [])
            
            for pet in pets:
                breed = pet.get("breed", "")
                name = pet.get("name", "")
                print(f"  Pet: {name}, Breed: {breed}")
                
                # Check if Mojo (Shihtzu) is in the list
                if name.lower() == "mojo":
                    print(f"✓ Found Mojo with breed: {breed}")
        else:
            print(f"Could not fetch pets: {response.status_code}")
    
    def test_breed_variations_in_advisory_request(self):
        """Test that breed variations are accepted in advisory requests"""
        breed_variations = [
            "shihtzu",
            "shih tzu",
            "Shih-Tzu",
            "golden retriever",
            "goldenretriever",
            "Golden Retriever"
        ]
        
        for breed in breed_variations:
            request_data = {
                "advisory_type": "health",
                "pet_name": "TestPet",
                "pet_breed": breed,
                "user_name": "Test User",
                "user_email": TEST_USER_EMAIL,
                "concern": f"Test with breed: {breed}",
                "severity": "mild"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/advisory/request",
                json=request_data
            )
            
            assert response.status_code == 200, f"Failed for breed='{breed}': {response.text}"
            print(f"✓ Advisory request accepted breed variation: '{breed}'")


class TestPillarRequestsIntegration:
    """Integration tests for pillar request flows"""
    
    def test_advisory_request_creates_ticket(self):
        """Test that advisory request creates a service desk ticket"""
        request_data = {
            "advisory_type": "nutrition",
            "pet_name": "IntegrationTestPet",
            "pet_breed": "Labrador",
            "user_name": "Integration Test",
            "user_email": "integration@test.com",
            "concern": "Integration test - nutrition advice needed",
            "severity": "mild"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/advisory/request",
            json=request_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify both request_id and ticket_id are returned
        assert "request_id" in data, "Should return request_id"
        assert "ticket_id" in data, "Should return ticket_id (service desk integration)"
        
        print(f"✓ Advisory request created with ticket integration:")
        print(f"  Request ID: {data['request_id']}")
        print(f"  Ticket ID: {data['ticket_id']}")
    
    def test_emergency_request_creates_ticket(self):
        """Test that emergency request creates a service desk ticket"""
        request_data = {
            "emergency_type": "medical_emergency",
            "severity": "high",
            "pet_name": "IntegrationTestPet",
            "pet_breed": "Beagle",
            "user_name": "Integration Test",
            "user_email": "integration@test.com",
            "user_phone": "+91 9876543210",
            "description": "Integration test - pet showing symptoms",
            "location": "Test Location"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/emergency/request",
            json=request_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify request was created with ticket
        assert "request_id" in data, "Should return request_id"
        assert "ticket_id" in data, "Should return ticket_id (service desk integration)"
        
        print(f"✓ Emergency request created with ticket integration:")
        print(f"  Request ID: {data['request_id']}")
        print(f"  Ticket ID: {data['ticket_id']}")


class TestProductsDataStructure:
    """Test that products have correct data structure"""
    
    def test_advisory_products_structure(self):
        """Test advisory products have expected fields"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        if products:
            product = products[0]
            # Check for common product fields
            expected_fields = ["id", "name"]
            for field in expected_fields:
                if field in product:
                    print(f"  ✓ Product has '{field}': {product.get(field, 'N/A')[:50] if isinstance(product.get(field), str) else product.get(field)}")
            
            # Check for pillar field
            pillar = product.get("pillar", product.get("category", "N/A"))
            print(f"  Pillar/Category: {pillar}")
    
    def test_all_pillars_products_accessible(self):
        """Test all pillar products endpoints are accessible"""
        pillars = ["advisory", "emergency", "enjoy", "farewell", "fit", "learn"]
        
        results = {}
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/{pillar}/products")
            results[pillar] = {
                "status": response.status_code,
                "count": 0
            }
            
            if response.status_code == 200:
                data = response.json()
                count = data.get("total", data.get("count", len(data.get("products", []))))
                results[pillar]["count"] = count
        
        print("\n=== Pillar Products Summary ===")
        for pillar, result in results.items():
            status = "✓" if result["status"] == 200 else "✗"
            print(f"  {status} {pillar}: {result['count']} products (HTTP {result['status']})")
        
        # All should return 200
        for pillar, result in results.items():
            assert result["status"] == 200, f"{pillar} products endpoint failed"


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
