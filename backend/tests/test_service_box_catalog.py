"""
Test Service Box Admin and Service Catalog APIs
Tests CRUD operations for services, stats, filtering, and price calculator
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test service ID for CRUD operations
TEST_SERVICE_ID = f"TEST-SVC-{uuid.uuid4().hex[:8].upper()}"


class TestServiceBoxStats:
    """Test Service Box stats endpoint"""
    
    def test_stats_endpoint_returns_totals(self):
        """Stats endpoint should return total, active, bookable counts"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        assert "total" in data, "Missing 'total' in stats"
        assert "active" in data, "Missing 'active' in stats"
        assert "bookable" in data, "Missing 'bookable' in stats"
        assert "free" in data, "Missing 'free' in stats"
        assert "by_pillar" in data, "Missing 'by_pillar' in stats"
        
        # Verify counts are integers
        assert isinstance(data["total"], int), "total should be integer"
        assert isinstance(data["active"], int), "active should be integer"
        assert data["total"] >= 0, "total should be non-negative"
        print(f"✓ Stats: total={data['total']}, active={data['active']}, bookable={data['bookable']}")


class TestServiceBoxListServices:
    """Test Service Box list services with filters"""
    
    def test_list_services_basic(self):
        """List services without filters"""
        response = requests.get(f"{BASE_URL}/api/service-box/services")
        assert response.status_code == 200, f"List services failed: {response.text}"
        
        data = response.json()
        assert "services" in data, "Missing 'services' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "pillars" in data, "Missing 'pillars' in response"
        assert isinstance(data["services"], list), "services should be a list"
        print(f"✓ Listed {len(data['services'])} services, total={data['total']}")
    
    def test_list_services_filter_by_pillar_care(self):
        """Filter services by pillar=care"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=care")
        assert response.status_code == 200, f"Filter by pillar failed: {response.text}"
        
        data = response.json()
        services = data.get("services", [])
        
        # All returned services should be care pillar
        for svc in services:
            assert svc.get("pillar") == "care", f"Service {svc.get('id')} has wrong pillar: {svc.get('pillar')}"
        
        print(f"✓ Filtered by pillar=care: {len(services)} services")
    
    def test_list_services_filter_by_pillar_travel(self):
        """Filter services by pillar=travel"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=travel")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        for svc in services:
            assert svc.get("pillar") == "travel", f"Service {svc.get('id')} has wrong pillar"
        
        print(f"✓ Filtered by pillar=travel: {len(services)} services")
    
    def test_list_services_filter_by_bookable(self):
        """Filter services by is_bookable=true"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?is_bookable=true")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        for svc in services:
            assert svc.get("is_bookable") == True, f"Service {svc.get('id')} should be bookable"
        
        print(f"✓ Filtered by is_bookable=true: {len(services)} services")
    
    def test_list_services_filter_by_active(self):
        """Filter services by is_active=true"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?is_active=true")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        for svc in services:
            # is_active can be True or not set (defaults to active)
            assert svc.get("is_active") != False, f"Service {svc.get('id')} should be active"
        
        print(f"✓ Filtered by is_active=true: {len(services)} services")


class TestServiceBoxCRUD:
    """Test Service Box CRUD operations"""
    
    def test_create_service(self):
        """Create a new test service"""
        payload = {
            "id": TEST_SERVICE_ID,
            "name": "Test Grooming Service",
            "pillar": "care",
            "description": "Test service for automated testing",
            "is_bookable": True,
            "requires_consultation": False,
            "is_free": False,
            "is_24x7": False,
            "base_price": 500,
            "duration_minutes": 45,
            "city_pricing": {"mumbai": 1.15, "delhi": 1.10, "bangalore": 1.0},
            "pet_size_pricing": {"small": 0.85, "medium": 1.0, "large": 1.3},
            "pet_count_pricing": {"1": 1.0, "2": 1.8, "3": 2.5},
            "deposit_percentage": 20,
            "payment_timing": "configurable",
            "available_cities": ["mumbai", "delhi", "bangalore"],
            "includes": ["Bath", "Brush", "Nail trim"],
            "add_ons": [
                {"id": "ADDON-TEST-1", "name": "Test Add-on", "price": 100}
            ],
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-box/services",
            json=payload
        )
        assert response.status_code == 200, f"Create service failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Create should return success=true"
        assert "service_id" in data, "Missing service_id in response"
        assert "service" in data, "Missing service in response"
        
        # Verify created service data
        created = data["service"]
        assert created["name"] == payload["name"], "Name mismatch"
        assert created["pillar"] == payload["pillar"], "Pillar mismatch"
        assert created["base_price"] == payload["base_price"], "Base price mismatch"
        
        print(f"✓ Created service: {data['service_id']}")
    
    def test_get_service(self):
        """Get the created test service"""
        response = requests.get(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        assert response.status_code == 200, f"Get service failed: {response.text}"
        
        data = response.json()
        assert data.get("id") == TEST_SERVICE_ID, "Service ID mismatch"
        assert data.get("name") == "Test Grooming Service", "Name mismatch"
        assert data.get("pillar") == "care", "Pillar mismatch"
        assert data.get("base_price") == 500, "Base price mismatch"
        
        print(f"✓ Retrieved service: {data['id']}")
    
    def test_update_service(self):
        """Update the test service"""
        payload = {
            "name": "Updated Test Grooming Service",
            "pillar": "care",
            "description": "Updated description for testing",
            "is_bookable": True,
            "requires_consultation": False,
            "is_free": False,
            "is_24x7": False,
            "base_price": 600,  # Updated price
            "duration_minutes": 60,  # Updated duration
            "city_pricing": {"mumbai": 1.20, "delhi": 1.10, "bangalore": 1.0},
            "pet_size_pricing": {"small": 0.85, "medium": 1.0, "large": 1.3},
            "pet_count_pricing": {"1": 1.0, "2": 1.8, "3": 2.5},
            "deposit_percentage": 25,
            "payment_timing": "configurable",
            "available_cities": ["mumbai", "delhi", "bangalore", "pune"],
            "includes": ["Bath", "Brush", "Nail trim", "Ear cleaning"],
            "add_ons": [
                {"id": "ADDON-TEST-1", "name": "Test Add-on", "price": 150}
            ],
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}",
            json=payload
        )
        assert response.status_code == 200, f"Update service failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Update should return success=true"
        
        # Verify update by fetching
        get_response = requests.get(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        assert get_response.status_code == 200
        
        updated = get_response.json()
        assert updated["name"] == "Updated Test Grooming Service", "Name not updated"
        assert updated["base_price"] == 600, "Base price not updated"
        assert updated["duration_minutes"] == 60, "Duration not updated"
        
        print(f"✓ Updated service: {TEST_SERVICE_ID}")
    
    def test_toggle_service_inactive(self):
        """Toggle service to inactive"""
        response = requests.post(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}/toggle")
        assert response.status_code == 200, f"Toggle service failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Toggle should return success=true"
        assert "is_active" in data, "Missing is_active in response"
        
        # Verify toggle by fetching
        get_response = requests.get(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        assert get_response.status_code == 200
        
        service = get_response.json()
        assert service["is_active"] == data["is_active"], "Toggle state mismatch"
        
        print(f"✓ Toggled service to is_active={data['is_active']}")
    
    def test_toggle_service_active(self):
        """Toggle service back to active"""
        response = requests.post(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}/toggle")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Toggled service to is_active={data['is_active']}")
    
    def test_delete_archive_service(self):
        """Delete (archive) the test service"""
        response = requests.delete(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        assert response.status_code == 200, f"Delete service failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Delete should return success=true"
        
        # Verify service is archived (is_active=false)
        get_response = requests.get(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        assert get_response.status_code == 200
        
        service = get_response.json()
        assert service["is_active"] == False, "Service should be archived (is_active=false)"
        
        print(f"✓ Archived service: {TEST_SERVICE_ID}")


class TestServiceCatalogPublic:
    """Test public Service Catalog endpoints"""
    
    def test_list_services_care_pillar(self):
        """List services for care pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=care")
        assert response.status_code == 200, f"List care services failed: {response.text}"
        
        data = response.json()
        assert "services" in data, "Missing 'services' in response"
        assert "count" in data, "Missing 'count' in response"
        
        services = data["services"]
        assert len(services) > 0, "Should have care services"
        
        # All services should be care pillar and active
        for svc in services:
            assert svc.get("pillar") == "care", f"Service {svc.get('id')} has wrong pillar"
        
        print(f"✓ Care pillar services: {len(services)}")
    
    def test_get_single_service(self):
        """Get a single service by ID"""
        # First get list to find a service ID
        list_response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=care&limit=1")
        assert list_response.status_code == 200
        
        services = list_response.json().get("services", [])
        if not services:
            pytest.skip("No care services available")
        
        service_id = services[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/service-catalog/services/{service_id}")
        assert response.status_code == 200, f"Get service failed: {response.text}"
        
        data = response.json()
        assert data.get("id") == service_id, "Service ID mismatch"
        assert "name" in data, "Missing name"
        assert "pillar" in data, "Missing pillar"
        
        print(f"✓ Retrieved service: {service_id}")


class TestPriceCalculator:
    """Test price calculator with modifiers"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a bookable service for price testing"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=care&limit=10")
        if response.status_code == 200:
            services = response.json().get("services", [])
            # Find a service with base_price and city_pricing
            for svc in services:
                if svc.get("base_price") and svc.get("city_pricing"):
                    self.test_service = svc
                    return
            # Fallback to first service with base_price
            for svc in services:
                if svc.get("base_price"):
                    self.test_service = svc
                    return
        self.test_service = None
    
    def test_calculate_price_basic(self):
        """Calculate price with default options"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "bangalore",
            "pet_count": 1,
            "pet_size": "medium",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        assert "service_id" in data, "Missing service_id"
        assert "base_price" in data, "Missing base_price"
        assert "total" in data, "Missing total"
        assert "modifiers" in data, "Missing modifiers"
        assert "currency" in data, "Missing currency"
        
        assert data["currency"] == "INR", "Currency should be INR"
        assert data["base_price"] == self.test_service["base_price"], "Base price mismatch"
        
        print(f"✓ Basic price calculation: base={data['base_price']}, total={data['total']}")
    
    def test_calculate_price_city_modifier_mumbai(self):
        """Calculate price with Mumbai city modifier (1.15x)"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        city_pricing = self.test_service.get("city_pricing", {})
        mumbai_modifier = city_pricing.get("mumbai", 1.0)
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "mumbai",
            "pet_count": 1,
            "pet_size": "medium",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        modifiers = data.get("modifiers", {})
        
        assert "city" in modifiers, "Missing city modifier"
        assert modifiers["city"]["value"] == "mumbai", "City value mismatch"
        assert modifiers["city"]["multiplier"] == mumbai_modifier, f"Mumbai modifier should be {mumbai_modifier}"
        
        print(f"✓ Mumbai city modifier: {modifiers['city']['multiplier']}x")
    
    def test_calculate_price_pet_size_large(self):
        """Calculate price with large pet size modifier (1.3x)"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        size_pricing = self.test_service.get("pet_size_pricing", {})
        large_modifier = size_pricing.get("large", 1.0)
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "bangalore",
            "pet_count": 1,
            "pet_size": "large",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        modifiers = data.get("modifiers", {})
        
        assert "pet_size" in modifiers, "Missing pet_size modifier"
        assert modifiers["pet_size"]["value"] == "large", "Pet size value mismatch"
        assert modifiers["pet_size"]["multiplier"] == large_modifier, f"Large modifier should be {large_modifier}"
        
        print(f"✓ Large pet size modifier: {modifiers['pet_size']['multiplier']}x")
    
    def test_calculate_price_pet_count_2(self):
        """Calculate price with 2 pets modifier (1.8x)"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        count_pricing = self.test_service.get("pet_count_pricing", {})
        two_pets_modifier = count_pricing.get("2", 1.8)  # Default 1.8 if not set
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "bangalore",
            "pet_count": 2,
            "pet_size": "medium",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        modifiers = data.get("modifiers", {})
        
        assert "pet_count" in modifiers, "Missing pet_count modifier"
        assert modifiers["pet_count"]["value"] == 2, "Pet count value mismatch"
        
        print(f"✓ 2 pets modifier: {modifiers['pet_count']['multiplier']}x")
    
    def test_calculate_price_with_addons(self):
        """Calculate price with add-ons"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        add_ons = self.test_service.get("add_ons", [])
        if not add_ons:
            pytest.skip("Service has no add-ons")
        
        addon_ids = [addon["id"] for addon in add_ons[:2]]  # Select first 2 add-ons
        expected_addon_total = sum(addon.get("price", 0) for addon in add_ons[:2])
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "bangalore",
            "pet_count": 1,
            "pet_size": "medium",
            "add_on_ids": addon_ids
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        
        assert "add_ons" in data, "Missing add_ons in response"
        assert "add_ons_total" in data, "Missing add_ons_total"
        assert data["add_ons_total"] == expected_addon_total, f"Add-ons total mismatch: expected {expected_addon_total}, got {data['add_ons_total']}"
        
        # Total should include add-ons
        assert data["total"] >= data["subtotal"] + data["add_ons_total"], "Total should include add-ons"
        
        print(f"✓ Add-ons total: ₹{data['add_ons_total']}, Final total: ₹{data['total']}")
    
    def test_calculate_price_combined_modifiers(self):
        """Calculate price with all modifiers combined"""
        if not self.test_service:
            pytest.skip("No suitable service for price testing")
        
        base_price = self.test_service.get("base_price", 0)
        city_pricing = self.test_service.get("city_pricing", {})
        size_pricing = self.test_service.get("pet_size_pricing", {})
        count_pricing = self.test_service.get("pet_count_pricing", {})
        
        mumbai_mod = city_pricing.get("mumbai", 1.0)
        large_mod = size_pricing.get("large", 1.0)
        two_pets_mod = count_pricing.get("2", 1.8)
        
        payload = {
            "service_id": self.test_service["id"],
            "city": "mumbai",
            "pet_count": 2,
            "pet_size": "large",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        
        data = response.json()
        
        # Calculate expected price
        expected_subtotal = base_price * mumbai_mod * large_mod * two_pets_mod
        
        # Allow small floating point difference
        assert abs(data["subtotal"] - expected_subtotal) < 1, f"Subtotal mismatch: expected ~{expected_subtotal}, got {data['subtotal']}"
        
        print(f"✓ Combined modifiers: base={base_price}, city={mumbai_mod}x, size={large_mod}x, count={two_pets_mod}x")
        print(f"  Subtotal: ₹{data['subtotal']}, Total: ₹{data['total']}")
    
    def test_calculate_price_invalid_service(self):
        """Calculate price for non-existent service returns 404"""
        payload = {
            "service_id": "INVALID-SERVICE-ID-12345",
            "city": "mumbai",
            "pet_count": 1,
            "pet_size": "medium",
            "add_on_ids": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-catalog/calculate-price",
            json=payload
        )
        assert response.status_code == 404, f"Should return 404 for invalid service, got {response.status_code}"
        
        print("✓ Invalid service returns 404")


class TestServiceBoxExport:
    """Test Service Box export functionality"""
    
    def test_export_services(self):
        """Export all services"""
        response = requests.get(f"{BASE_URL}/api/service-box/export")
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        data = response.json()
        assert "services" in data, "Missing 'services' in export"
        assert "count" in data, "Missing 'count' in export"
        assert "exported_at" in data, "Missing 'exported_at' in export"
        
        assert isinstance(data["services"], list), "services should be a list"
        assert data["count"] == len(data["services"]), "Count mismatch"
        
        print(f"✓ Exported {data['count']} services")


# Cleanup fixture to remove test data after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_service():
    """Cleanup test service after all tests"""
    yield
    # Try to delete the test service
    try:
        requests.delete(f"{BASE_URL}/api/service-box/services/{TEST_SERVICE_ID}")
        print(f"\n✓ Cleaned up test service: {TEST_SERVICE_ID}")
    except:
        pass
