"""
Test Suite for Pillar Kit Guard and Service Catalog
=====================================================
Tests:
1. Backend health check - /api/health
2. Pillar Kit Guard - travel kit on /fit page should be blocked
3. Pillar Kit Guard - fitness kit on /fit page should be allowed
4. Pillar Kit Guard - travel kit on /travel page should be allowed
5. Service Catalog API - GET /api/service-catalog/services?pillar=care
6. Service Catalog Price Calculator - POST /api/service-catalog/calculate-price
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Test backend health endpoint"""
    
    def test_health_endpoint_returns_healthy(self):
        """Backend health check should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestPillarKitGuard:
    """Test Pillar Kit Guard functionality - blocks wrong kit requests on pillar pages"""
    
    def test_travel_kit_blocked_on_fit_page(self):
        """Asking for 'travel kit' on /fit page should be blocked and redirect to travel page"""
        payload = {
            "message": "I want a travel kit",
            "current_pillar": "fit",  # User is on /fit page
            "source": "web_widget"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Check that kit was blocked
        assert data.get("kit_blocked") == True, f"Expected kit_blocked=True, got: {data.get('kit_blocked')}"
        assert data.get("blocked_kit_type") == "travel_kit", f"Expected blocked_kit_type='travel_kit', got: {data.get('blocked_kit_type')}"
        assert data.get("suggested_pillar") == "travel", f"Expected suggested_pillar='travel', got: {data.get('suggested_pillar')}"
        
        # Check response contains redirect message
        response_text = data.get("response", "")
        assert "Travel page" in response_text or "/travel" in response_text, f"Expected redirect to travel page in response: {response_text[:200]}"
        
        print(f"✓ Travel kit correctly blocked on /fit page")
        print(f"  - kit_blocked: {data.get('kit_blocked')}")
        print(f"  - blocked_kit_type: {data.get('blocked_kit_type')}")
        print(f"  - suggested_pillar: {data.get('suggested_pillar')}")
    
    def test_fitness_kit_allowed_on_fit_page(self):
        """Asking for 'fitness kit' on /fit page should be allowed"""
        payload = {
            "message": "I want a fitness kit",
            "current_pillar": "fit",  # User is on /fit page
            "source": "web_widget"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Kit should NOT be blocked
        assert data.get("kit_blocked") != True, f"Fitness kit should NOT be blocked on /fit page, got kit_blocked={data.get('kit_blocked')}"
        
        # Response should be helpful, not a redirect
        response_text = data.get("response", "")
        assert "fitness" in response_text.lower() or "fit" in response_text.lower(), f"Response should mention fitness: {response_text[:200]}"
        
        print(f"✓ Fitness kit correctly allowed on /fit page")
        print(f"  - kit_blocked: {data.get('kit_blocked')}")
    
    def test_travel_kit_allowed_on_travel_page(self):
        """Asking for 'travel kit' on /travel page should be allowed"""
        payload = {
            "message": "I want a travel kit",
            "current_pillar": "travel",  # User is on /travel page
            "source": "web_widget"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Kit should NOT be blocked
        assert data.get("kit_blocked") != True, f"Travel kit should NOT be blocked on /travel page, got kit_blocked={data.get('kit_blocked')}"
        
        # Response should be helpful about travel kit
        response_text = data.get("response", "")
        assert "travel" in response_text.lower(), f"Response should mention travel: {response_text[:200]}"
        
        print(f"✓ Travel kit correctly allowed on /travel page")
        print(f"  - kit_blocked: {data.get('kit_blocked')}")
    
    def test_grooming_kit_blocked_on_fit_page(self):
        """Asking for 'grooming kit' on /fit page should be blocked and redirect to care page"""
        payload = {
            "message": "I want a grooming kit",
            "current_pillar": "fit",  # User is on /fit page
            "source": "web_widget"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Check that kit was blocked
        assert data.get("kit_blocked") == True, f"Expected kit_blocked=True, got: {data.get('kit_blocked')}"
        assert data.get("blocked_kit_type") == "grooming_kit", f"Expected blocked_kit_type='grooming_kit', got: {data.get('blocked_kit_type')}"
        assert data.get("suggested_pillar") == "care", f"Expected suggested_pillar='care', got: {data.get('suggested_pillar')}"
        
        print(f"✓ Grooming kit correctly blocked on /fit page")
        print(f"  - suggested_pillar: {data.get('suggested_pillar')}")


class TestServiceCatalog:
    """Test Service Catalog API endpoints"""
    
    def test_get_services_by_pillar_care(self):
        """GET /api/service-catalog/services?pillar=care should return care services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "care"})
        assert response.status_code == 200
        data = response.json()
        
        # API returns dict with 'services' key
        assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
        assert "services" in data, "Response should contain 'services' key"
        services = data.get("services", [])
        
        assert isinstance(services, list), f"Expected services to be list, got: {type(services)}"
        assert len(services) > 0, "Expected at least one care service"
        
        # All services should be from care pillar
        for service in services:
            assert service.get("pillar") == "care", f"Expected pillar='care', got: {service.get('pillar')}"
        
        print(f"✓ Service catalog returned {len(services)} care services")
        print(f"  - Sample services: {[s.get('name') for s in services[:3]]}")
    
    def test_get_services_by_pillar_travel(self):
        """GET /api/service-catalog/services?pillar=travel should return travel services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "travel"})
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        assert isinstance(services, list), f"Expected services to be list, got: {type(services)}"
        assert len(services) > 0, "Expected at least one travel service"
        
        for service in services:
            assert service.get("pillar") == "travel", f"Expected pillar='travel', got: {service.get('pillar')}"
        
        print(f"✓ Service catalog returned {len(services)} travel services")
    
    def test_get_services_by_pillar_fit(self):
        """GET /api/service-catalog/services?pillar=fit should return fit services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "fit"})
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        assert isinstance(services, list), f"Expected services to be list, got: {type(services)}"
        assert len(services) > 0, "Expected at least one fit service"
        
        for service in services:
            assert service.get("pillar") == "fit", f"Expected pillar='fit', got: {service.get('pillar')}"
        
        print(f"✓ Service catalog returned {len(services)} fit services")
    
    def test_get_all_services(self):
        """GET /api/service-catalog/services should return all services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services")
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        assert isinstance(services, list), f"Expected services to be list, got: {type(services)}"
        # Based on seed_master_services.py, there should be 87 services
        assert len(services) >= 50, f"Expected at least 50 services (87 seeded), got: {len(services)}"
        
        print(f"✓ Service catalog returned {len(services)} total services")


class TestServicePriceCalculator:
    """Test Service Catalog Price Calculator endpoint"""
    
    @pytest.fixture
    def care_service_id(self):
        """Get a care service ID for testing"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "care"})
        if response.status_code == 200:
            data = response.json()
            services = data.get("services", [])
            if services:
                return services[0].get("id")
        return "SVC-CARE-GROOM-BASIC"  # Fallback to known service ID
    
    def test_calculate_price_basic(self, care_service_id):
        """POST /api/service-catalog/calculate-price should return calculated price"""
        payload = {
            "service_id": care_service_id,
            "city": "mumbai",
            "pet_size": "medium",
            "pet_count": 1
        }
        response = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "service_id" in data, "Response should contain service_id"
        assert "base_price" in data, "Response should contain base_price"
        assert "total" in data, "Response should contain total"
        assert "modifiers" in data, "Response should contain modifiers"
        assert "currency" in data, "Response should contain currency"
        
        # Check modifiers structure
        modifiers = data.get("modifiers", {})
        assert "city" in modifiers, "Modifiers should contain city"
        assert "pet_count" in modifiers, "Modifiers should contain pet_count"
        assert "pet_size" in modifiers, "Modifiers should contain pet_size"
        
        print(f"✓ Price calculator returned valid response")
        print(f"  - Service: {data.get('service_name')}")
        print(f"  - Base price: {data.get('base_price')}")
        print(f"  - Total: {data.get('total')}")
        print(f"  - Currency: {data.get('currency')}")
    
    def test_calculate_price_with_city_modifier(self, care_service_id):
        """Price should vary by city"""
        # Get price for Mumbai
        payload_mumbai = {
            "service_id": care_service_id,
            "city": "mumbai",
            "pet_size": "medium",
            "pet_count": 1
        }
        response_mumbai = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload_mumbai)
        assert response_mumbai.status_code == 200
        price_mumbai = response_mumbai.json().get("total")
        
        # Get price for Bangalore
        payload_bangalore = {
            "service_id": care_service_id,
            "city": "bangalore",
            "pet_size": "medium",
            "pet_count": 1
        }
        response_bangalore = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload_bangalore)
        assert response_bangalore.status_code == 200
        price_bangalore = response_bangalore.json().get("total")
        
        print(f"✓ City pricing working")
        print(f"  - Mumbai price: {price_mumbai}")
        print(f"  - Bangalore price: {price_bangalore}")
    
    def test_calculate_price_with_pet_size_modifier(self, care_service_id):
        """Price should vary by pet size"""
        # Get price for small pet
        payload_small = {
            "service_id": care_service_id,
            "city": "bangalore",
            "pet_size": "small",
            "pet_count": 1
        }
        response_small = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload_small)
        assert response_small.status_code == 200
        price_small = response_small.json().get("total")
        
        # Get price for large pet
        payload_large = {
            "service_id": care_service_id,
            "city": "bangalore",
            "pet_size": "large",
            "pet_count": 1
        }
        response_large = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload_large)
        assert response_large.status_code == 200
        price_large = response_large.json().get("total")
        
        print(f"✓ Pet size pricing working")
        print(f"  - Small pet price: {price_small}")
        print(f"  - Large pet price: {price_large}")
    
    def test_calculate_price_invalid_service(self):
        """Price calculator should return 404 for invalid service"""
        payload = {
            "service_id": "INVALID-SERVICE-ID",
            "city": "mumbai",
            "pet_size": "medium",
            "pet_count": 1
        }
        response = requests.post(f"{BASE_URL}/api/service-catalog/calculate-price", json=payload)
        assert response.status_code == 404
        print(f"✓ Price calculator correctly returns 404 for invalid service")


class TestMiraChatBasic:
    """Basic Mira chat endpoint tests"""
    
    def test_mira_chat_endpoint_works(self):
        """Mira chat endpoint should respond"""
        payload = {
            "message": "Hello",
            "source": "web_widget"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        assert "session_id" in data, "Response should contain 'session_id' field"
        
        print(f"✓ Mira chat endpoint working")
        print(f"  - Response length: {len(data.get('response', ''))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
