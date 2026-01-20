"""
Advisory Pillar API Tests
Tests for the Advisory pillar endpoints including:
- Products, Bundles, Advisors
- Admin stats and settings
- Advisory types and config
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdvisoryPublicEndpoints:
    """Test public Advisory API endpoints"""
    
    def test_advisory_types(self):
        """Test GET /api/advisory/types - Get advisory types"""
        response = requests.get(f"{BASE_URL}/api/advisory/types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "advisory_types" in data
        assert "consultation_formats" in data
        
        # Verify all 6 advisory types exist
        advisory_types = data["advisory_types"]
        expected_types = ["behaviour", "nutrition", "senior_care", "new_pet", "health", "training"]
        for t in expected_types:
            assert t in advisory_types, f"Missing advisory type: {t}"
        
        print(f"✅ Advisory types: {list(advisory_types.keys())}")
        print(f"✅ Consultation formats: {data['consultation_formats']}")
    
    def test_advisory_config(self):
        """Test GET /api/advisory/config - Get advisory config"""
        response = requests.get(f"{BASE_URL}/api/advisory/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "advisory_types" in data
        assert "consultation_formats" in data
        assert "enabled" in data
        
        print(f"✅ Advisory config - Advisor count: {data.get('advisor_count', 0)}, Product count: {data.get('product_count', 0)}")
    
    def test_advisory_products(self):
        """Test GET /api/advisory/products - Get advisory products"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        
        products = data["products"]
        print(f"✅ Advisory products: {len(products)} products found")
        
        # Verify products have required fields
        if products:
            product = products[0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert product.get("category") == "advisory"
            print(f"   Sample product: {product['name']} - ₹{product['price']}")
    
    def test_advisory_bundles(self):
        """Test GET /api/advisory/bundles - Get advisory bundles"""
        response = requests.get(f"{BASE_URL}/api/advisory/bundles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bundles" in data
        assert "total" in data
        
        bundles = data["bundles"]
        print(f"✅ Advisory bundles: {len(bundles)} bundles found")
        
        # Verify bundles have required fields
        if bundles:
            bundle = bundles[0]
            assert "id" in bundle
            assert "name" in bundle
            assert "price" in bundle
            print(f"   Sample bundle: {bundle['name']} - ₹{bundle['price']}")
    
    def test_advisory_advisors(self):
        """Test GET /api/advisory/advisors - Get all advisors"""
        response = requests.get(f"{BASE_URL}/api/advisory/advisors")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "advisors" in data
        assert "total" in data
        
        advisors = data["advisors"]
        print(f"✅ Advisory advisors: {len(advisors)} advisors found")
        
        # Verify advisors have required fields
        if advisors:
            advisor = advisors[0]
            assert "id" in advisor
            assert "name" in advisor
            assert "specialties" in advisor
            print(f"   Sample advisor: {advisor['name']} - Specialties: {advisor.get('specialties', [])}")
    
    def test_advisory_featured_advisors(self):
        """Test GET /api/advisory/advisors?is_featured=true - Get featured advisors"""
        response = requests.get(f"{BASE_URL}/api/advisory/advisors?is_featured=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "advisors" in data
        
        advisors = data["advisors"]
        print(f"✅ Featured advisors: {len(advisors)} featured advisors found")
        
        # Verify all returned advisors are featured
        for advisor in advisors:
            assert advisor.get("is_featured") == True, f"Advisor {advisor['name']} is not featured"


class TestAdvisoryAdminEndpoints:
    """Test admin Advisory API endpoints"""
    
    def test_advisory_admin_stats(self):
        """Test GET /api/advisory/admin/stats - Get advisory statistics"""
        response = requests.get(f"{BASE_URL}/api/advisory/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify stats structure
        assert "total_requests" in data
        assert "pending_requests" in data
        assert "scheduled_requests" in data
        assert "completed_requests" in data
        assert "by_type" in data
        assert "by_severity" in data
        assert "total_partners" in data
        assert "total_products" in data
        assert "total_bundles" in data
        
        print(f"✅ Advisory stats:")
        print(f"   Total requests: {data['total_requests']}")
        print(f"   Pending: {data['pending_requests']}")
        print(f"   Partners: {data['total_partners']}")
        print(f"   Products: {data['total_products']}")
        print(f"   Bundles: {data['total_bundles']}")
    
    def test_advisory_admin_settings(self):
        """Test GET /api/advisory/admin/settings - Get advisory settings"""
        response = requests.get(f"{BASE_URL}/api/advisory/admin/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify settings structure
        assert "paw_rewards" in data
        assert "birthday_perks" in data
        assert "notifications" in data
        assert "service_desk" in data
        assert "consultation_settings" in data
        
        print(f"✅ Advisory settings loaded successfully")
        print(f"   Paw rewards enabled: {data['paw_rewards'].get('enabled')}")
        print(f"   Birthday perks enabled: {data['birthday_perks'].get('enabled')}")
    
    def test_advisory_admin_partners(self):
        """Test GET /api/advisory/admin/partners - Get advisory partners"""
        response = requests.get(f"{BASE_URL}/api/advisory/admin/partners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "partners" in data
        assert "total" in data
        
        print(f"✅ Advisory admin partners: {data['total']} partners")
    
    def test_advisory_requests_list(self):
        """Test GET /api/advisory/requests - Get advisory requests"""
        response = requests.get(f"{BASE_URL}/api/advisory/requests")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "requests" in data
        assert "total" in data
        
        print(f"✅ Advisory requests: {data['total']} requests")


class TestAdvisorySeedData:
    """Test that seed data was properly created"""
    
    def test_seed_data_exists(self):
        """Verify seed data exists for advisory pillar"""
        # Check advisors
        advisors_res = requests.get(f"{BASE_URL}/api/advisory/advisors")
        advisors = advisors_res.json().get("advisors", [])
        
        # Check products
        products_res = requests.get(f"{BASE_URL}/api/advisory/products")
        products = products_res.json().get("products", [])
        
        # Check bundles
        bundles_res = requests.get(f"{BASE_URL}/api/advisory/bundles")
        bundles = bundles_res.json().get("bundles", [])
        
        print(f"✅ Seed data verification:")
        print(f"   Advisors: {len(advisors)} (expected 4)")
        print(f"   Products: {len(products)} (expected 12)")
        print(f"   Bundles: {len(bundles)} (expected 5)")
        
        # Verify minimum expected counts
        assert len(advisors) >= 4, f"Expected at least 4 advisors, got {len(advisors)}"
        assert len(products) >= 12, f"Expected at least 12 products, got {len(products)}"
        assert len(bundles) >= 5, f"Expected at least 5 bundles, got {len(bundles)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
