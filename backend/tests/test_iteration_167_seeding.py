"""
Iteration 167 - Seeding Verification Tests
Tests for verifying services and products are properly seeded for all pillars.

Features tested:
1. GET /api/service-catalog/services?pillar=emergency - should return 5 services
2. GET /api/service-catalog/services?pillar=advisory - should return 5 services
3. GET /api/service-catalog/services?pillar=paperwork - should return 6 services
4. GET /api/pillar-resolver/products/adopt - should return 20+ products
5. GET /api/pillar-resolver/products/stay - should return 15+ products
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestServiceCatalogSeeding:
    """Test service catalog seeding for all pillars"""
    
    def test_emergency_services_count(self):
        """Emergency pillar should have 5 services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "emergency"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        services = data.get("services", [])
        
        print(f"Emergency services count: {len(services)}")
        for svc in services:
            print(f"  - {svc.get('id', 'N/A')}: {svc.get('name', 'N/A')}")
        
        assert len(services) >= 5, f"Expected at least 5 emergency services, got {len(services)}"
    
    def test_advisory_services_count(self):
        """Advisory pillar should have 5 services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "advisory"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        services = data.get("services", [])
        
        print(f"Advisory services count: {len(services)}")
        for svc in services:
            print(f"  - {svc.get('id', 'N/A')}: {svc.get('name', 'N/A')}")
        
        assert len(services) >= 5, f"Expected at least 5 advisory services, got {len(services)}"
    
    def test_paperwork_services_count(self):
        """Paperwork pillar should have 6 services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "paperwork"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        services = data.get("services", [])
        
        print(f"Paperwork services count: {len(services)}")
        for svc in services:
            print(f"  - {svc.get('id', 'N/A')}: {svc.get('name', 'N/A')}")
        
        assert len(services) >= 6, f"Expected at least 6 paperwork services, got {len(services)}"
    
    def test_emergency_services_structure(self):
        """Verify emergency services have proper structure"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "emergency"})
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        # Check each service has required fields
        for svc in services:
            assert "id" in svc, f"Service missing 'id': {svc}"
            assert "name" in svc, f"Service missing 'name': {svc}"
            assert "pillar" in svc, f"Service missing 'pillar': {svc}"
            assert svc.get("pillar") == "emergency", f"Service has wrong pillar: {svc.get('pillar')}"
    
    def test_advisory_services_structure(self):
        """Verify advisory services have proper structure"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "advisory"})
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        for svc in services:
            assert "id" in svc, f"Service missing 'id': {svc}"
            assert "name" in svc, f"Service missing 'name': {svc}"
            assert svc.get("pillar") == "advisory", f"Service has wrong pillar: {svc.get('pillar')}"
    
    def test_paperwork_services_structure(self):
        """Verify paperwork services have proper structure"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": "paperwork"})
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        for svc in services:
            assert "id" in svc, f"Service missing 'id': {svc}"
            assert "name" in svc, f"Service missing 'name': {svc}"
            assert svc.get("pillar") == "paperwork", f"Service has wrong pillar: {svc.get('pillar')}"


class TestPillarProductsSeeding:
    """Test pillar products seeding for adopt and stay"""
    
    def test_adopt_products_count(self):
        """Adopt pillar should have 20+ products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/adopt")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"Adopt products count: {len(products)}")
        
        # Print first 10 products for verification
        for i, prod in enumerate(products[:10]):
            print(f"  {i+1}. {prod.get('name', 'N/A')} - {prod.get('category', 'N/A')}")
        
        if len(products) > 10:
            print(f"  ... and {len(products) - 10} more products")
        
        assert len(products) >= 20, f"Expected at least 20 adopt products, got {len(products)}"
    
    def test_stay_products_count(self):
        """Stay pillar should have 15+ products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/stay")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"Stay products count: {len(products)}")
        
        # Print first 10 products for verification
        for i, prod in enumerate(products[:10]):
            print(f"  {i+1}. {prod.get('name', 'N/A')} - {prod.get('category', 'N/A')}")
        
        if len(products) > 10:
            print(f"  ... and {len(products) - 10} more products")
        
        assert len(products) >= 15, f"Expected at least 15 stay products, got {len(products)}"
    
    def test_adopt_products_structure(self):
        """Verify adopt products have proper structure"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/adopt")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check first 5 products have required fields
        for prod in products[:5]:
            assert "name" in prod, f"Product missing 'name': {prod}"
            # Products should have either id or product_id
            assert "id" in prod or "product_id" in prod, f"Product missing 'id': {prod}"
    
    def test_stay_products_structure(self):
        """Verify stay products have proper structure"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/stay")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check first 5 products have required fields
        for prod in products[:5]:
            assert "name" in prod, f"Product missing 'name': {prod}"
            assert "id" in prod or "product_id" in prod, f"Product missing 'id': {prod}"
    
    def test_adopt_products_have_images(self):
        """Verify adopt products have images"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/adopt")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        products_with_images = 0
        for prod in products:
            if prod.get("image") or prod.get("images"):
                products_with_images += 1
        
        print(f"Adopt products with images: {products_with_images}/{len(products)}")
        
        # At least 50% should have images
        assert products_with_images >= len(products) * 0.5, f"Too few products have images: {products_with_images}/{len(products)}"
    
    def test_stay_products_have_images(self):
        """Verify stay products have images"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/stay")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        products_with_images = 0
        for prod in products:
            if prod.get("image") or prod.get("images"):
                products_with_images += 1
        
        print(f"Stay products with images: {products_with_images}/{len(products)}")
        
        # At least 50% should have images
        assert products_with_images >= len(products) * 0.5, f"Too few products have images: {products_with_images}/{len(products)}"


class TestAdoptRouteProducts:
    """Test adopt route products endpoint"""
    
    def test_adopt_route_products(self):
        """Test /api/adopt/products endpoint"""
        response = requests.get(f"{BASE_URL}/api/adopt/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"Adopt route products count: {len(products)}")
        
        # Should have products
        assert len(products) > 0, "Adopt route should return products"


class TestStayRouteProducts:
    """Test stay route products endpoint"""
    
    def test_stay_route_products(self):
        """Test /api/stay/products endpoint"""
        response = requests.get(f"{BASE_URL}/api/stay/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"Stay route products count: {len(products)}")
        
        # Should have products
        assert len(products) > 0, "Stay route should return products"


class TestAllPillarServicesSeeded:
    """Test that all pillars have services seeded"""
    
    @pytest.mark.parametrize("pillar,min_count", [
        ("emergency", 5),
        ("advisory", 5),
        ("paperwork", 6),
        ("celebrate", 5),
        ("dine", 4),
        ("stay", 4),
        ("travel", 5),
        ("care", 8),
        ("enjoy", 4),
        ("fit", 6),
        ("learn", 5),
        ("farewell", 4),
        ("adopt", 4),
        ("shop", 3),
    ])
    def test_pillar_services_seeded(self, pillar, min_count):
        """Test each pillar has minimum expected services"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services", params={"pillar": pillar})
        assert response.status_code == 200, f"Expected 200 for {pillar}, got {response.status_code}"
        
        data = response.json()
        services = data.get("services", [])
        
        print(f"{pillar.upper()} services: {len(services)} (expected >= {min_count})")
        
        assert len(services) >= min_count, f"Expected at least {min_count} {pillar} services, got {len(services)}"


class TestServiceCatalogStats:
    """Test service catalog statistics"""
    
    def test_total_services_count(self):
        """Verify total services count across all pillars"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        total = data.get("total", len(services))
        
        print(f"Total services in catalog: {total}")
        
        # Should have at least 80 services based on master list
        assert total >= 80, f"Expected at least 80 total services, got {total}"
    
    def test_services_by_pillar_distribution(self):
        """Check services distribution by pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        # Count by pillar
        pillar_counts = {}
        for svc in services:
            pillar = svc.get("pillar", "unknown")
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
        
        print("Services by pillar:")
        for pillar, count in sorted(pillar_counts.items()):
            print(f"  {pillar}: {count}")
        
        # Should have services in at least 10 pillars
        assert len(pillar_counts) >= 10, f"Expected services in at least 10 pillars, got {len(pillar_counts)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
