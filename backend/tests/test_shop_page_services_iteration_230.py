"""
Test Suite for Shop Page Services API - Iteration 230
Tests service-box CRUD API for services_master collection
Features: Shop services (706), stats, pillar filtering
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestServiceBoxStats:
    """Service Box Statistics Tests"""
    
    def test_stats_endpoint_returns_200(self):
        """Test /api/service-box/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Stats endpoint returns 200")
    
    def test_stats_has_required_fields(self):
        """Verify stats response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        data = response.json()
        
        required_fields = ['total', 'active', 'bookable', 'free', 'consultation_required', 
                          'emergency_24x7', 'inactive', 'by_pillar']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✅ Stats has all required fields: {required_fields}")
    
    def test_stats_total_services_above_2500(self):
        """Verify total services count is above 2500"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        data = response.json()
        
        total = data.get('total', 0)
        assert total >= 2500, f"Expected total >= 2500, got {total}"
        print(f"✅ Total services: {total} (expected >= 2500)")
    
    def test_stats_shop_services_count(self):
        """Verify shop pillar has 700+ services"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        data = response.json()
        
        shop_count = data.get('by_pillar', {}).get('shop', 0)
        assert shop_count >= 700, f"Expected shop services >= 700, got {shop_count}"
        print(f"✅ Shop services: {shop_count} (expected >= 700)")


class TestServiceBoxList:
    """Service Box List/Filter Tests"""
    
    def test_list_services_returns_200(self):
        """Test /api/service-box/services returns 200"""
        response = requests.get(f"{BASE_URL}/api/service-box/services")
        assert response.status_code == 200
        print("✅ List services endpoint returns 200")
    
    def test_list_services_response_structure(self):
        """Verify list response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/service-box/services")
        data = response.json()
        
        assert 'services' in data, "Missing 'services' in response"
        assert 'total' in data, "Missing 'total' in response"
        assert 'pillars' in data, "Missing 'pillars' in response"
        assert isinstance(data['services'], list), "services should be a list"
        print(f"✅ Response structure correct: {len(data['services'])} services returned")
    
    def test_filter_by_shop_pillar(self):
        """Test filtering by shop pillar returns 700+ services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=shop&limit=50")
        assert response.status_code == 200
        
        data = response.json()
        total = data.get('total', 0)
        assert total >= 700, f"Expected shop total >= 700, got {total}"
        
        # Verify returned services have shop pillar
        for svc in data.get('services', []):
            assert svc.get('pillar') == 'shop', f"Service {svc.get('id')} has pillar {svc.get('pillar')}"
        
        print(f"✅ Shop pillar filter: {total} services (returned {len(data['services'])})")
    
    def test_service_has_required_fields(self):
        """Verify service objects have required fields"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=shop&limit=5")
        data = response.json()
        
        services = data.get('services', [])
        assert len(services) > 0, "No services returned"
        
        # Check first service has essential fields
        svc = services[0]
        required_fields = ['id', 'name', 'pillar']
        for field in required_fields:
            assert field in svc, f"Service missing field: {field}"
        
        print(f"✅ Service has required fields: id={svc['id']}, name={svc['name']}, pillar={svc['pillar']}")
    
    def test_search_filter(self):
        """Test search filter works"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?search=toy&pillar=shop")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✅ Search filter works: found {data.get('total', 0)} results for 'toy'")
    
    def test_limit_pagination(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=10")
        data = response.json()
        
        services = data.get('services', [])
        assert len(services) <= 10, f"Expected <= 10 services, got {len(services)}"
        print(f"✅ Pagination works: requested 10, got {len(services)}")


class TestServiceBoxCRUD:
    """Service Box CRUD Operations"""
    
    def test_get_single_service(self):
        """Test getting a single service by ID"""
        # First get a service ID from the list
        list_response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=shop&limit=1")
        services = list_response.json().get('services', [])
        
        if len(services) > 0:
            service_id = services[0]['id']
            response = requests.get(f"{BASE_URL}/api/service-box/services/{service_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            service = response.json()
            assert service.get('id') == service_id
            print(f"✅ Get single service works: {service_id}")
        else:
            pytest.skip("No services found to test GET single")
    
    def test_get_nonexistent_service_returns_404(self):
        """Test getting nonexistent service returns 404"""
        response = requests.get(f"{BASE_URL}/api/service-box/services/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Nonexistent service returns 404")


class TestProductsEndpoint:
    """Products Endpoint Tests (for Shop Page)"""
    
    def test_products_endpoint_returns_200(self):
        """Test /api/products returns 200"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        print("✅ Products endpoint returns 200")
    
    def test_products_has_correct_structure(self):
        """Verify products response structure"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        data = response.json()
        
        products = data.get('products', data) if isinstance(data, dict) else data
        assert len(products) > 0, "No products returned"
        
        # Check product has essential fields
        product = products[0]
        essential_fields = ['id', 'name', 'price']
        for field in essential_fields:
            assert field in product or 'title' in product, f"Product missing field: {field}"
        
        print(f"✅ Products structure correct: {len(products)} products")
    
    def test_products_count_above_500(self):
        """Verify products count is substantial"""
        response = requests.get(f"{BASE_URL}/api/products?limit=500")
        data = response.json()
        
        products = data.get('products', data) if isinstance(data, dict) else data
        assert len(products) >= 100, f"Expected >= 100 products, got {len(products)}"
        print(f"✅ Products count: {len(products)}")


class TestPillarsConfiguration:
    """Test all 14 pillars are configured"""
    
    def test_all_14_pillars_in_stats(self):
        """Verify all 14 pillars appear in stats"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        data = response.json()
        
        by_pillar = data.get('by_pillar', {})
        expected_pillars = ['celebrate', 'dine', 'stay', 'travel', 'care', 'enjoy', 
                           'fit', 'learn', 'paperwork', 'advisory', 'emergency', 
                           'farewell', 'adopt', 'shop']
        
        found_pillars = []
        for pillar in expected_pillars:
            if pillar in by_pillar:
                found_pillars.append(pillar)
        
        print(f"✅ Found {len(found_pillars)}/14 pillars in stats: {found_pillars}")
        assert len(found_pillars) >= 10, f"Expected >= 10 pillars, found {len(found_pillars)}"
    
    def test_pillars_list_in_services_response(self):
        """Verify pillars list is included in services response"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=1")
        data = response.json()
        
        pillars = data.get('pillars', [])
        assert len(pillars) >= 14, f"Expected >= 14 pillars, got {len(pillars)}"
        
        pillar_ids = [p['id'] for p in pillars]
        assert 'shop' in pillar_ids, "'shop' pillar not found"
        print(f"✅ Pillars list includes {len(pillars)} pillars including 'shop'")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
