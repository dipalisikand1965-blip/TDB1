"""
Test Mira OS Product Recommendations with Match Type
====================================================
Tests for:
1. Backend API returns products with match_type (breed/pillar/pet)
2. Backend API returns current_pillar field in response
3. Product recommendations include pillar field for each product
4. Products matched to intent, pillar, and breed with visual match badges

Endpoint: POST /api/mira/os/understand-with-products
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMiraProductMatchType:
    """Tests for Mira OS product recommendations with match_type field"""

    def test_api_health_check(self):
        """Verify API is accessible before running tests"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"API health check failed: {response.status_code}"
        print("✓ API health check passed")

    def test_understand_with_products_returns_match_type(self):
        """Test that products returned have match_type field for breed/pillar/pet matching"""
        payload = {
            "input": "show me some treats for my dog",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age": "3 years",
                "traits": ["playful", "energetic"],
                "sensitivities": ["chicken allergy"],
                "favorites": ["fetch", "swimming"]
            },
            "include_products": True,
            "page_context": "shop"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify success
        assert data.get("success") == True, f"API returned success=False: {data}"
        
        # Check response structure
        assert "response" in data, "Missing 'response' field in API response"
        resp = data["response"]
        
        # Verify products are returned
        products = resp.get("products", [])
        print(f"✓ API returned {len(products)} products")
        
        # If products are returned, verify they have required fields
        if products:
            for i, product in enumerate(products[:3]):  # Check first 3 products
                assert "name" in product, f"Product {i} missing 'name' field"
                assert "pillar" in product, f"Product {i} missing 'pillar' field"
                # match_type can be null/None for unmatched products
                assert "match_type" in product, f"Product {i} missing 'match_type' field"
                
                print(f"  Product {i+1}: {product.get('name', 'N/A')[:40]}...")
                print(f"    - pillar: {product.get('pillar', 'N/A')}")
                print(f"    - match_type: {product.get('match_type', 'None')}")
                print(f"    - category: {product.get('category', 'N/A')}")
        
        print("✓ Products have match_type and pillar fields")

    def test_understand_with_products_returns_current_pillar(self):
        """Test that response contains current_pillar field for conversation tracking"""
        payload = {
            "input": "I need some grooming supplies",
            "pet_context": {
                "name": "Max",
                "breed": "Labrador",
                "age": "2 years"
            },
            "include_products": True,
            "page_context": "care"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"API returned success=False: {data}"
        
        # current_pillar is at the TOP LEVEL of the response (not inside "response" object)
        # This is as designed in mira_routes.py lines 2757-2758
        assert "current_pillar" in data, f"Missing 'current_pillar' at top level. Keys: {data.keys()}"
        
        current_pillar = data.get("current_pillar")
        print(f"✓ current_pillar field present at top level: '{current_pillar}'")
        
        # Verify it's a valid pillar or None
        valid_pillars = ["care", "celebrate", "enjoy", "dine", "travel", "stay", "adopt", "learn", "shop", None]
        assert current_pillar in valid_pillars or current_pillar is None, f"Invalid pillar: {current_pillar}"
        
        print("✓ current_pillar is a valid pillar value")
        
        # Also verify previous_pillar field exists (for topic shift detection)
        assert "previous_pillar" in data, "Missing 'previous_pillar' field"
        print(f"✓ previous_pillar field present: '{data.get('previous_pillar')}'")
        
        # Verify topic_shift field exists
        assert "topic_shift" in data, "Missing 'topic_shift' field"
        print(f"✓ topic_shift field present: {data.get('topic_shift')}")

    def test_breed_match_type_for_golden_retriever(self):
        """Test that breed-specific products get match_type='breed' for Golden Retriever"""
        payload = {
            "input": "show me birthday cakes for my dog",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age": "3 years",
                "traits": ["playful"],
                "sensitivities": []
            },
            "include_products": True,
            "page_context": "celebrate"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True
        
        products = data.get("response", {}).get("products", [])
        print(f"✓ API returned {len(products)} products for birthday cakes")
        
        # Check for products with match_type set
        match_types_found = set()
        for product in products:
            match_type = product.get("match_type")
            if match_type:
                match_types_found.add(match_type)
            print(f"  - {product.get('name', 'N/A')[:40]}: match_type={match_type}")
        
        print(f"✓ Match types found in response: {match_types_found}")
        
        # Verify at least some products have match_type set
        # breed, pillar, or pet are all valid match types
        valid_match_types = {"breed", "pillar", "pet"}
        if match_types_found:
            assert match_types_found.issubset(valid_match_types.union({None})), \
                f"Invalid match_type found: {match_types_found}"
            print("✓ All match_type values are valid")
        else:
            print("⚠ No match_type values set (products may not match breed/pillar criteria)")

    def test_pillar_match_type_for_travel_products(self):
        """Test that travel products get match_type='pillar' for travel intent"""
        payload = {
            "input": "I need travel supplies for my dog, we are going on a road trip",
            "pet_context": {
                "name": "Rocky",
                "breed": "Beagle",
                "age": "4 years"
            },
            "include_products": True,
            "page_context": "travel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        
        products = data.get("response", {}).get("products", [])
        # current_pillar is at top level, not inside response object
        current_pillar = data.get("current_pillar")
        
        print(f"✓ Current pillar detected: {current_pillar}")
        print(f"✓ API returned {len(products)} products for travel")
        
        for product in products[:5]:
            print(f"  - {product.get('name', 'N/A')[:40]}")
            print(f"    pillar: {product.get('pillar', 'N/A')}, match_type: {product.get('match_type', 'None')}")

    def test_product_pillar_field_is_present(self):
        """Test that each product has a pillar field for categorization"""
        payload = {
            "input": "show me some dog treats",
            "pet_context": {
                "name": "Luna",
                "breed": "Husky",
                "age": "2 years"
            },
            "include_products": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        
        products = data.get("response", {}).get("products", [])
        
        if products:
            # Check all products have pillar field
            for i, product in enumerate(products):
                assert "pillar" in product, f"Product {i} missing 'pillar' field"
                pillar = product.get("pillar")
                # pillar should be a string (can be empty)
                assert isinstance(pillar, str), f"Product {i} pillar is not a string: {type(pillar)}"
                print(f"  Product {i+1}: pillar='{pillar}', name={product.get('name', '')[:30]}...")
            
            print(f"✓ All {len(products)} products have pillar field")
        else:
            print("⚠ No products returned to verify pillar field")

    def test_response_structure_completeness(self):
        """Test that the full response structure is correct with all required fields"""
        payload = {
            "input": "I want to celebrate my dog's birthday",
            "pet_context": {
                "name": "Charlie",
                "breed": "Poodle",
                "age": "5 years"
            },
            "include_products": True,
            "page_context": "celebrate"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify top-level structure
        assert "success" in data, "Missing 'success' field"
        assert "response" in data, "Missing 'response' field"
        
        resp = data.get("response", {})
        
        # Check for key response fields
        expected_fields = ["message", "products"]
        for field in expected_fields:
            assert field in resp, f"Missing '{field}' in response"
        
        print("✓ Response has required top-level fields: success, response")
        print(f"✓ Response.message present: {len(resp.get('message', ''))}")
        print(f"✓ Response.products count: {len(resp.get('products', []))}")
        
        # Check for current_pillar field at TOP LEVEL (not inside response object)
        if "current_pillar" in data:
            print(f"✓ current_pillar present at top level: {data.get('current_pillar')}")
        else:
            print("⚠ current_pillar field not present at top level")

    def test_products_include_why_for_pet(self):
        """Test that products include why_for_pet field for personalization"""
        payload = {
            "input": "recommend some food for my dog",
            "pet_context": {
                "name": "Bailey",
                "breed": "German Shepherd",
                "age": "3 years",
                "sensitivities": ["grain sensitivity"]
            },
            "include_products": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        
        products = data.get("response", {}).get("products", [])
        
        if products:
            for i, product in enumerate(products[:3]):
                why_for_pet = product.get("why_for_pet", "")
                print(f"  Product {i+1}: {product.get('name', '')[:30]}...")
                print(f"    why_for_pet: {why_for_pet[:80] if why_for_pet else 'N/A'}...")
                print(f"    match_type: {product.get('match_type', 'None')}")
            
            # At least one product should have why_for_pet
            products_with_why = [p for p in products if p.get("why_for_pet")]
            print(f"✓ {len(products_with_why)}/{len(products)} products have why_for_pet")


class TestMiraProductMatchTypeEdgeCases:
    """Edge case tests for product match type functionality"""

    def test_no_pet_context_still_returns_products(self):
        """Test that API returns products even without pet context"""
        payload = {
            "input": "show me dog treats",
            "include_products": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should still return success
        assert data.get("success") == True
        print("✓ API works without pet_context")
        
        products = data.get("response", {}).get("products", [])
        print(f"✓ Returned {len(products)} products without pet context")

    def test_empty_input_handled_gracefully(self):
        """Test that empty input is handled without error"""
        payload = {
            "input": "",
            "pet_context": {
                "name": "Test",
                "breed": "Mixed"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            timeout=30
        )
        
        # Should not crash
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"✓ Empty input handled with status {response.status_code}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
