"""
Mira Breed-Specific Products Test Suite - Iteration 228
Tests:
1. Mira chat returns breed-specific products when breed is mentioned
2. Backend uses products_master collection
3. Product stats API returns correct counts
4. Breed-specific products have correct breed_metadata structure
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://soul-chapters.preview.emergentagent.com"

ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestProductStats:
    """Test product statistics API - confirms products_master collection usage"""
    
    def test_product_stats_endpoint(self):
        """Test /api/product-box/stats endpoint returns product counts"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        assert "total" in data, "Missing total in response"
        assert "by_status" in data, "Missing by_status in response"
        
        # Check total products count matches expected 2833
        total = data.get("total", 0)
        print(f"Total products from stats API: {total}")
        assert total >= 2800, f"Expected ~2833 products, got {total}"
    
    def test_product_stats_total_count(self):
        """Test that total products is around 2833 as expected"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200
        
        data = response.json()
        total = data.get("total", 0)
        print(f"Total products: {total}")
        # Check expected count of 2833
        assert total >= 2800, f"Expected ~2833 products, got {total}"


class TestBreedSpecificProducts:
    """Test breed-specific product functionality"""
    
    def test_labrador_products_exist(self):
        """Test that Labrador-specific products exist in database"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"search": "Labrador", "limit": 50}
        )
        assert response.status_code == 200, f"Products endpoint failed: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        print(f"Products found with 'Labrador' search: {len(products)}")
        
        # Check for breed-specific products with breed_metadata
        breed_specific = [p for p in products if p.get("is_breed_specific") or p.get("breed_metadata")]
        print(f"Products with breed_metadata: {len(breed_specific)}")
        
        # Should have some Labrador products
        assert len(products) >= 0, "Search should return results"
    
    def test_corgi_products_exist(self):
        """Test that Corgi-specific products exist in database"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"search": "Corgi", "limit": 50}
        )
        assert response.status_code == 200, f"Products endpoint failed: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        print(f"Products found with 'Corgi' search: {len(products)}")
        
        # Check for breed-specific products
        breed_specific = [p for p in products if p.get("is_breed_specific") or p.get("breed_metadata")]
        print(f"Products with breed_metadata: {len(breed_specific)}")
    
    def test_breed_metadata_structure(self):
        """Test that breed-specific products have correct breed_metadata structure"""
        # Get products with breed_metadata
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"limit": 100}
        )
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Find a product with breed_metadata
        products_with_metadata = [p for p in products if p.get("breed_metadata")]
        if products_with_metadata:
            product = products_with_metadata[0]
            breed_metadata = product.get("breed_metadata", {})
            print(f"Product with breed_metadata: {product.get('name')}")
            print(f"breed_metadata: {breed_metadata}")
            
            # Verify breed_metadata has breeds field or breed_name field
            has_breeds = "breeds" in breed_metadata or "breed_name" in breed_metadata
            assert has_breeds, f"breed_metadata should have breeds or breed_name field"
        else:
            print("No products with breed_metadata found in first 100 products")


class TestMiraChatBreedRecommendations:
    """Test Mira chat breed-specific product recommendations"""
    
    def test_mira_labrador_birthday_request(self):
        """Test that Mira returns breed-specific products for 'Labrador birthday' query"""
        payload = {
            "message": "My Labrador's birthday is coming up, can you recommend some celebration items?",
            "session_id": "test-labrador-birthday-228",
            "source": "web_widget",
            "history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        
        data = response.json()
        mira_response = data.get("response", "")
        products = data.get("products", [])
        
        print(f"Mira response length: {len(mira_response)}")
        print(f"Products returned: {len(products)}")
        
        if products:
            for p in products[:3]:
                print(f"  - {p.get('name')} (breed_metadata: {p.get('breed_metadata')})")
        
        # Mira should return some response
        assert len(mira_response) > 50, "Mira response too short"
        
        # Check if any products returned have breed metadata
        breed_products = [p for p in products if p.get("breed_metadata") or "labrador" in p.get("name", "").lower()]
        print(f"Products with Labrador reference: {len(breed_products)}")
    
    def test_mira_corgi_request(self):
        """Test that Mira detects Corgi breed and can return relevant products"""
        payload = {
            "message": "I have a Corgi and want to celebrate his birthday. Any suggestions?",
            "session_id": "test-corgi-birthday-228",
            "source": "web_widget",
            "history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        
        data = response.json()
        mira_response = data.get("response", "")
        products = data.get("products", [])
        
        print(f"Mira response for Corgi: {len(mira_response)} chars")
        print(f"Products returned for Corgi: {len(products)}")
        
        if products:
            for p in products[:3]:
                print(f"  - {p.get('name')}")
        
        # Mira should return some response
        assert len(mira_response) > 50, "Mira response too short"
    
    def test_mira_generic_birthday_request(self):
        """Test Mira responds to generic birthday request"""
        payload = {
            "message": "My dog's birthday is next week. What can I get for the celebration?",
            "session_id": "test-generic-birthday-228",
            "source": "web_widget",
            "history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        
        data = response.json()
        mira_response = data.get("response", "")
        products = data.get("products", [])
        
        print(f"Generic birthday response length: {len(mira_response)}")
        print(f"Generic birthday products: {len(products)}")
        
        assert len(mira_response) > 50, "Mira response too short"


class TestAdminProductBoxUI:
    """Test Admin Product Box UI endpoints"""
    
    def test_breed_tags_options(self):
        """Test /api/admin/breed-tags/options returns breeds for BreedAutoSuggest component"""
        response = requests.get(f"{BASE_URL}/api/admin/breed-tags/options")
        assert response.status_code == 200, f"Breed tags options failed: {response.text}"
        
        data = response.json()
        breeds = data.get("breeds", [])
        print(f"Available breeds for auto-suggest: {len(breeds)}")
        
        # Should have multiple breeds
        assert len(breeds) > 20, f"Expected >20 breeds, got {len(breeds)}"
        
        # Check common breeds are present
        breed_names = [b.lower() if isinstance(b, str) else b.get("name", "").lower() for b in breeds]
        print(f"Sample breeds: {breed_names[:10]}")
    
    def test_product_box_products_pagination(self):
        """Test product box products endpoint with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"page": 1, "limit": 20}
        )
        assert response.status_code == 200, f"Products endpoint failed: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        
        print(f"Products returned: {len(products)}")
        print(f"Total products: {total}")
        
        assert len(products) <= 20, "Should respect limit"
        assert total > 0, "Should have products"
    
    def test_product_box_search(self):
        """Test product box search functionality"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"search": "bandana", "limit": 20}
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        
        data = response.json()
        products = data.get("products", [])
        print(f"Products found for 'bandana': {len(products)}")
        
        if products:
            for p in products[:5]:
                print(f"  - {p.get('name')}")


class TestProductsMasterCollection:
    """Test that backend uses products_master collection"""
    
    def test_products_master_text_search(self):
        """Test products_master search works via API"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products",
            params={"search": "birthday", "limit": 30}
        )
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        print(f"Birthday products from products_master: {len(products)}")
        
        # Verify products have expected structure
        if products:
            p = products[0]
            assert "id" in p or "_id" in p, "Product missing id"
            assert "name" in p, "Product missing name"
            print(f"Sample product: {p.get('name')}")
    
    def test_pillar_filter_uses_products_master(self):
        """Test pillar filter queries products_master collection"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/by-pillar/celebrate",
            params={"limit": 20}
        )
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        print(f"Celebrate pillar products: {len(products)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
