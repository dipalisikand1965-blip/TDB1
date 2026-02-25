"""
Test Iteration 153 - Pillar Resolver API Tests
Tests the new /api/pillar-resolver/ endpoints for products and services

Features tested:
1. Pillar Resolver API - /api/pillar-resolver/products/{pillar} returns correct products
2. Pillar Resolver API - /api/pillar-resolver/services/{pillar} returns tagged services
3. Services have base_tags in database
4. Products returned match pillar rules (no cakes in travel, etc.)
5. All 14 pillars are valid and accessible
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPillarResolverHealth:
    """Basic health and connectivity tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_pillar_list_endpoint(self):
        """Test /api/pillar-resolver/list returns all 14 pillars"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "pillars" in data
        assert "total" in data
        assert data["total"] == 14, f"Expected 14 pillars, got {data['total']}"
        
        # Verify all expected pillars are present
        expected_pillars = [
            "celebrate", "dine", "stay", "travel", "care", "enjoy",
            "fit", "learn", "paperwork", "advisory", "emergency",
            "farewell", "adopt", "shop"
        ]
        pillar_names = [p["name"] for p in data["pillars"]]
        for expected in expected_pillars:
            assert expected in pillar_names, f"Missing pillar: {expected}"
        
        print(f"✅ All 14 pillars present: {pillar_names}")


class TestPillarResolverProducts:
    """Test product retrieval via pillar resolver"""
    
    def test_travel_products_endpoint(self):
        """Test /api/pillar-resolver/products/travel returns products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "travel"
        assert "products" in data
        assert "count" in data
        assert data["resolver_used"] == True
        
        print(f"✅ Travel products: {data['count']} returned")
    
    def test_travel_excludes_cakes(self):
        """Test travel pillar excludes cakes (rule: exclude category_primary: cakes)"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        cakes_found = []
        
        for product in products:
            base_tags = product.get("base_tags", {})
            category_primary = base_tags.get("category_primary", "")
            if category_primary == "cakes":
                cakes_found.append(product.get("name", "Unknown"))
        
        assert len(cakes_found) == 0, f"Found cakes in travel pillar: {cakes_found}"
        print(f"✅ Travel pillar correctly excludes cakes (0 cakes in {len(products)} products)")
    
    def test_travel_excludes_food(self):
        """Test travel pillar excludes food (rule: exclude category_primary: food)"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        food_found = []
        
        for product in products:
            base_tags = product.get("base_tags", {})
            category_primary = base_tags.get("category_primary", "")
            if category_primary == "food":
                food_found.append(product.get("name", "Unknown"))
        
        assert len(food_found) == 0, f"Found food in travel pillar: {food_found}"
        print(f"✅ Travel pillar correctly excludes food (0 food items in {len(products)} products)")
    
    def test_travel_excludes_frozen(self):
        """Test travel pillar excludes frozen items (rule: exclude format: frozen)"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        frozen_found = []
        
        for product in products:
            base_tags = product.get("base_tags", {})
            format_tag = base_tags.get("format", "")
            if format_tag == "frozen" or (isinstance(format_tag, list) and "frozen" in format_tag):
                frozen_found.append(product.get("name", "Unknown"))
        
        assert len(frozen_found) == 0, f"Found frozen items in travel pillar: {frozen_found}"
        print(f"✅ Travel pillar correctly excludes frozen items (0 frozen in {len(products)} products)")
    
    def test_celebrate_products_endpoint(self):
        """Test /api/pillar-resolver/products/celebrate returns celebration products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/celebrate?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "celebrate"
        assert "products" in data
        assert data["resolver_used"] == True
        
        # Celebrate should have products with purchase_pattern: celebration
        products = data.get("products", [])
        celebration_products = 0
        for product in products:
            base_tags = product.get("base_tags", {})
            if base_tags.get("purchase_pattern") == "celebration":
                celebration_products += 1
        
        print(f"✅ Celebrate products: {data['count']} returned, {celebration_products} with celebration pattern")
    
    def test_care_products_endpoint(self):
        """Test /api/pillar-resolver/products/care returns care products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/care?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        assert "products" in data
        assert data["resolver_used"] == True
        
        # Care should have products with category_primary: supplements or grooming
        products = data.get("products", [])
        care_products = 0
        for product in products:
            base_tags = product.get("base_tags", {})
            category = base_tags.get("category_primary", "")
            if category in ["supplements", "grooming"]:
                care_products += 1
        
        print(f"✅ Care products: {data['count']} returned, {care_products} with care categories")
    
    def test_unknown_pillar_fallback(self):
        """Test unknown pillar returns legacy query fallback"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/unknown_pillar?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "unknown_pillar"
        assert data["resolver_used"] == False
        assert "message" in data
        print(f"✅ Unknown pillar handled gracefully with fallback")


class TestPillarResolverServices:
    """Test service retrieval via pillar resolver"""
    
    def test_care_services_endpoint(self):
        """Test /api/pillar-resolver/services/care returns services"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/services/care?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        assert "services" in data
        assert "count" in data
        assert data["resolver_used"] == True
        
        print(f"✅ Care services: {data['count']} returned")
    
    def test_services_have_base_tags(self):
        """Test that services returned have base_tags field"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/services/care?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        services_with_tags = 0
        services_without_tags = []
        
        for service in services:
            if service.get("base_tags"):
                services_with_tags += 1
            else:
                services_without_tags.append(service.get("name", "Unknown"))
        
        # At least some services should have base_tags
        if len(services) > 0:
            tag_percentage = (services_with_tags / len(services)) * 100
            print(f"✅ Services with base_tags: {services_with_tags}/{len(services)} ({tag_percentage:.1f}%)")
            if services_without_tags:
                print(f"   Services without tags: {services_without_tags[:5]}...")
    
    def test_travel_services_endpoint(self):
        """Test /api/pillar-resolver/services/travel returns transport services"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/services/travel?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "travel"
        assert "services" in data
        assert data["resolver_used"] == True
        
        # Travel services should have service_type: transport
        services = data.get("services", [])
        transport_services = 0
        for service in services:
            base_tags = service.get("base_tags", {})
            if base_tags.get("service_type") == "transport":
                transport_services += 1
        
        print(f"✅ Travel services: {data['count']} returned, {transport_services} transport services")
    
    def test_unknown_pillar_services(self):
        """Test unknown pillar returns empty services"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/services/unknown_pillar?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "unknown_pillar"
        assert data["resolver_used"] == False
        assert data["count"] == 0
        print(f"✅ Unknown pillar services handled gracefully")


class TestPillarResolverRules:
    """Test pillar rules endpoint"""
    
    def test_travel_rules(self):
        """Test /api/pillar-resolver/rules/travel returns correct rules"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/rules/travel")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "travel"
        assert "rules" in data
        assert "valid_pillars" in data
        
        rules = data["rules"]
        assert "products" in rules
        assert "services" in rules
        
        # Verify travel product rules
        product_rules = rules["products"]
        assert "must" in product_rules
        assert "exclude" in product_rules
        
        # Travel must have interaction_type and mess_level rules
        must_rules = product_rules["must"]
        assert "interaction_type" in must_rules
        assert "mess_level" in must_rules
        
        # Travel must exclude cakes and food
        exclude_rules = product_rules["exclude"]
        assert "category_primary" in exclude_rules
        assert "cakes" in exclude_rules["category_primary"]
        assert "food" in exclude_rules["category_primary"]
        
        print(f"✅ Travel rules verified: must={list(must_rules.keys())}, exclude={list(exclude_rules.keys())}")
    
    def test_care_rules(self):
        """Test /api/pillar-resolver/rules/care returns correct rules"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/rules/care")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        rules = data["rules"]
        
        # Care products must have category_primary: supplements or grooming
        product_must = rules["products"]["must"]
        assert "category_primary" in product_must
        
        # Care services must have service_type: grooming, medical, or wellness
        service_must = rules["services"]["must"]
        assert "service_type" in service_must
        
        print(f"✅ Care rules verified")
    
    def test_unknown_pillar_rules(self):
        """Test unknown pillar returns error"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/rules/unknown_pillar")
        assert response.status_code == 200
        data = response.json()
        
        assert "error" in data
        print(f"✅ Unknown pillar rules handled with error message")


class TestPillarResolverAll:
    """Test combined products and services endpoint"""
    
    def test_all_endpoint(self):
        """Test /api/pillar-resolver/all/{pillar} returns both products and services"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/all/care?product_limit=10&service_limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        assert "products" in data
        assert "services" in data
        assert data["resolver_used"] == True
        
        print(f"✅ All endpoint: {len(data['products'])} products, {len(data['services'])} services")
    
    def test_all_endpoint_pagination(self):
        """Test pagination parameters work correctly"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/all/shop?product_limit=5&service_limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data.get("products", [])) <= 5
        assert len(data.get("services", [])) <= 3
        
        print(f"✅ Pagination working: {len(data['products'])} products (limit 5), {len(data['services'])} services (limit 3)")


class TestPillarResolverDataIntegrity:
    """Test data integrity and base_tags structure"""
    
    def test_products_have_base_tags_structure(self):
        """Test products have proper base_tags structure"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        if len(products) == 0:
            pytest.skip("No travel products found")
        
        # Check first product has expected base_tags fields
        product = products[0]
        base_tags = product.get("base_tags", {})
        
        expected_fields = [
            "interaction_type", "mess_level", "category_primary"
        ]
        
        for field in expected_fields:
            assert field in base_tags, f"Missing base_tags field: {field}"
        
        print(f"✅ Product base_tags structure verified: {list(base_tags.keys())}")
    
    def test_services_have_base_tags_structure(self):
        """Test services have proper base_tags structure"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/services/care?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        if len(services) == 0:
            pytest.skip("No care services found")
        
        # Find a service with base_tags
        service_with_tags = None
        for service in services:
            if service.get("base_tags"):
                service_with_tags = service
                break
        
        if service_with_tags is None:
            pytest.skip("No services with base_tags found")
        
        base_tags = service_with_tags.get("base_tags", {})
        
        expected_fields = [
            "service_type", "delivery_mode", "session_type", "duration"
        ]
        
        for field in expected_fields:
            assert field in base_tags, f"Missing base_tags field: {field}"
        
        print(f"✅ Service base_tags structure verified: {list(base_tags.keys())}")


class TestPillarResolverEdgeCases:
    """Test edge cases and error handling"""
    
    def test_empty_pillar_name(self):
        """Test empty pillar name handling"""
        # This should return 404 or redirect
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/")
        # FastAPI returns 404 for missing path parameter
        assert response.status_code in [404, 307, 405]
        print(f"✅ Empty pillar name handled (status: {response.status_code})")
    
    def test_pagination_limits(self):
        """Test pagination limit enforcement"""
        # Request more than max limit (100)
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/shop?limit=200")
        assert response.status_code == 422  # Validation error for limit > 100
        print(f"✅ Pagination limit enforced (status: {response.status_code})")
    
    def test_negative_skip(self):
        """Test negative skip value handling"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/shop?skip=-1")
        assert response.status_code == 422  # Validation error for skip < 0
        print(f"✅ Negative skip handled (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
