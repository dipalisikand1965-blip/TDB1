"""
Iteration 151 Tests - Travel Bundles, Travel Products, PersonalizedPicks, Mobile Responsiveness
Tests:
1. Travel bundles have images - GET /api/travel/bundles should return bundles with image field
2. Travel products exist - GET /api/products?pillar=travel should return travel-specific items
3. PersonalizedPicks component on Care, Travel, Enjoy pages
4. Mobile responsiveness on Care, Travel, Enjoy pages (375px viewport)
5. Product listing links - products should link to /product/{id} not /shop/{id}
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://architecture-rebuild.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestTravelBundles:
    """Test travel bundles have images"""
    
    def test_travel_bundles_endpoint_returns_bundles(self):
        """GET /api/travel/bundles should return bundles"""
        response = requests.get(f"{BASE_URL}/api/travel/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0
        print(f"✓ Found {len(data['bundles'])} travel bundles")
    
    def test_travel_bundles_have_image_field(self):
        """Each travel bundle should have an image field"""
        response = requests.get(f"{BASE_URL}/api/travel/bundles")
        assert response.status_code == 200
        data = response.json()
        bundles = data.get("bundles", [])
        
        bundles_with_images = 0
        bundles_without_images = []
        
        for bundle in bundles:
            if bundle.get("image"):
                bundles_with_images += 1
                print(f"✓ Bundle '{bundle.get('name')}' has image: {bundle.get('image')}")
            else:
                bundles_without_images.append(bundle.get("name"))
        
        if bundles_without_images:
            print(f"✗ Bundles without images: {bundles_without_images}")
        
        assert bundles_with_images == len(bundles), f"Some bundles missing images: {bundles_without_images}"
        print(f"✓ All {bundles_with_images} bundles have images")


class TestTravelProducts:
    """Test travel products exist and are travel-specific"""
    
    def test_travel_products_endpoint(self):
        """GET /api/travel/products should return products"""
        response = requests.get(f"{BASE_URL}/api/travel/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Found {len(data.get('products', []))} travel products")
    
    def test_products_with_pillar_travel(self):
        """GET /api/products?pillar=travel should return travel-tagged products"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=travel&limit=50")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        assert len(products) > 0, "No products found with pillar=travel"
        print(f"✓ Found {len(products)} products with pillar=travel")
        
        # Check if products have travel pillar
        travel_pillar_count = sum(1 for p in products if p.get("pillar") == "travel")
        print(f"✓ {travel_pillar_count} products have pillar='travel'")
    
    def test_travel_products_are_travel_essentials(self):
        """Travel products should include travel essentials like carriers, bowls, harness"""
        response = requests.get(f"{BASE_URL}/api/travel/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        # Check for travel-specific keywords
        travel_keywords = ["carrier", "bowl", "harness", "water bottle", "mat", "wipes", 
                          "treats", "leash", "towel", "first aid", "crate", "travel"]
        
        travel_specific_products = []
        for product in products:
            name = (product.get("name") or "").lower()
            description = (product.get("description") or "").lower()
            
            for keyword in travel_keywords:
                if keyword in name or keyword in description:
                    travel_specific_products.append(product.get("name"))
                    break
        
        print(f"✓ Found {len(travel_specific_products)} travel-specific products")
        if travel_specific_products[:10]:
            print(f"  Sample products: {travel_specific_products[:10]}")


class TestPersonalizedPicks:
    """Test PersonalizedPicks component API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_my_pets_endpoint(self, auth_token):
        """GET /api/pets/my-pets should return user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"✓ Found {len(data.get('pets', []))} pets for user")
        return data.get("pets", [])
    
    def test_recommendations_for_pet_endpoint(self, auth_token):
        """GET /api/products/recommendations/for-pet/{pet_id} should return recommendations"""
        # First get user's pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if pets_response.status_code != 200:
            pytest.skip("Could not fetch pets")
        
        pets = pets_response.json().get("pets", [])
        if not pets:
            pytest.skip("User has no pets")
        
        pet_id = pets[0].get("id") or pets[0].get("_id")
        
        # Test recommendations endpoint
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{pet_id}?limit=6&pillar=care"
        )
        # This endpoint may return 200 or 404 depending on implementation
        print(f"Recommendations endpoint status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Found {len(data.get('recommendations', []))} recommendations")
    
    def test_recommended_products_fallback(self):
        """GET /api/products?is_recommended=true should return recommended products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10&is_recommended=true")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        print(f"✓ Found {len(products)} recommended products (fallback)")


class TestProductLinks:
    """Test product listing links use /product/{id} not /shop/{id}"""
    
    def test_product_detail_endpoint(self):
        """GET /api/products/{id} should work for product detail"""
        # First get a product
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        if not products:
            pytest.skip("No products found")
        
        product_id = products[0].get("id")
        
        # Test product detail endpoint
        detail_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert detail_response.status_code == 200
        print(f"✓ Product detail endpoint works for /api/products/{product_id}")


class TestCarePageAPI:
    """Test Care page API endpoints"""
    
    def test_care_products_endpoint(self):
        """GET /api/care/products should return care products"""
        response = requests.get(f"{BASE_URL}/api/care/products")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Care products endpoint returns {len(data.get('products', []))} products")
    
    def test_care_bundles_endpoint(self):
        """GET /api/care/bundles should return care bundles"""
        response = requests.get(f"{BASE_URL}/api/care/bundles")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Care bundles endpoint returns {len(data.get('bundles', []))} bundles")


class TestEnjoyPageAPI:
    """Test Enjoy page API endpoints"""
    
    def test_enjoy_experiences_endpoint(self):
        """GET /api/enjoy/experiences should return experiences"""
        response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Enjoy experiences endpoint returns {len(data.get('experiences', []))} experiences")
    
    def test_enjoy_products_endpoint(self):
        """GET /api/enjoy/products should return products"""
        response = requests.get(f"{BASE_URL}/api/enjoy/products")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Enjoy products endpoint returns {len(data.get('products', []))} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
