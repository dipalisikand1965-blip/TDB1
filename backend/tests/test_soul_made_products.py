"""
Test Suite for Soul Made Products Feature
Tests:
1. Breed-specific products API (/api/mockups/breed-products)
2. Main products API excludes breed products (/api/products)
3. Pet data returns correct breed for each pet
4. Shih Tzu mockups are generated
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-places.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"

# Breed names that should be excluded from main products
BREED_NAMES = [
    'German Shepherd', 'Labrador', 'Beagle', 'Shih Tzu', 'Indie', 'Pug', 
    'Golden Retriever', 'Rottweiler', 'Poodle', 'Chihuahua', 'Bulldog', 
    'Doberman', 'Great Dane', 'Husky', 'Pomeranian', 'Maltese', 'French Bulldog'
]

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API calls"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"


class TestBreedProducts:
    """Test breed-specific products API"""
    
    def test_indie_breed_products(self):
        """Test Indie breed products are available"""
        response = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&limit=20")
        assert response.status_code == 200
        data = response.json()
        
        # Should have products
        assert data.get("count", 0) > 0, "No Indie products found"
        
        # All products should be for Indie breed
        products = data.get("products", [])
        for p in products:
            assert p.get("breed") == "indie", f"Product {p.get('name')} has wrong breed"
    
    def test_shih_tzu_breed_products(self):
        """Test Shih Tzu breed products are available"""
        response = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=shih_tzu&limit=20")
        assert response.status_code == 200
        data = response.json()
        
        # Should have products
        assert data.get("count", 0) > 0, "No Shih Tzu products found"
        
        # All products should be for Shih Tzu breed
        products = data.get("products", [])
        for p in products:
            assert p.get("breed") == "shih_tzu", f"Product {p.get('name')} has wrong breed"
    
    def test_shih_tzu_mockups_generated(self):
        """Test Shih Tzu products have mockup images"""
        response = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=shih_tzu&limit=20")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        products_with_mockups = [p for p in products if p.get("mockup_url")]
        
        # Most products should have mockups
        assert len(products_with_mockups) > 0, "No Shih Tzu mockups found"
        print(f"✓ {len(products_with_mockups)}/{len(products)} Shih Tzu products have mockups")
    
    def test_indie_mockups_generated(self):
        """Test Indie products have mockup images"""
        response = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&limit=20")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        products_with_mockups = [p for p in products if p.get("mockup_url")]
        
        # Most products should have mockups
        assert len(products_with_mockups) > 0, "No Indie mockups found"
        print(f"✓ {len(products_with_mockups)}/{len(products)} Indie products have mockups")
    
    def test_pillar_filter(self):
        """Test pillar filter for breed products"""
        response = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&pillar=celebrate&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Check filter was applied
        assert data.get("filters", {}).get("pillar") == "celebrate"


class TestMainProductsBreedExclusion:
    """Test that main products API excludes breed-specific Soul Made products"""
    
    def test_no_breed_products_in_main_api(self):
        """Test /api/products doesn't include breed-specific products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        breed_products_found = []
        
        for p in products:
            name = (p.get("name") or p.get("title") or "").lower()
            # Check for breed name followed by · or :
            for breed in BREED_NAMES:
                breed_lower = breed.lower()
                if breed_lower in name and ('·' in name or ':' in name):
                    # This is a breed-specific product
                    breed_products_found.append(p.get("name") or p.get("title"))
                    break
        
        # Assert no breed products found
        assert len(breed_products_found) == 0, f"Found {len(breed_products_found)} breed products: {breed_products_found[:5]}"
        print("✓ Breed exclusion filter is working - no Soul Made products in main API")
    
    def test_products_have_valid_data(self):
        """Test products in main API have valid structure"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        assert len(products) > 0, "No products returned"
        
        # Check product structure
        for p in products:
            assert p.get("id") or p.get("shopify_id"), "Product missing ID"
            assert p.get("name") or p.get("title"), "Product missing name"


class TestUserPets:
    """Test user's pets API returns correct breed information"""
    
    def test_user_pets_api(self, auth_token):
        """Test /api/pets/my-pets returns user's pets with correct breeds"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        pets = data.get("pets", data if isinstance(data, list) else [])
        assert len(pets) >= 2, "Expected at least 2 pets for test user"
        
        # Check for Mojo (Indie) and Mystique (Shih Tzu)
        pet_breeds = {p.get("name"): p.get("breed") for p in pets}
        
        assert "Mojo" in pet_breeds, "Mojo not found in pets"
        assert pet_breeds.get("Mojo") == "Indie", f"Mojo has wrong breed: {pet_breeds.get('Mojo')}"
        
        assert "Mystique" in pet_breeds, "Mystique not found in pets"
        assert pet_breeds.get("Mystique") == "Shih Tzu", f"Mystique has wrong breed: {pet_breeds.get('Mystique')}"
        
        print("✓ User pets have correct breeds: Mojo (Indie), Mystique (Shih Tzu)")
    
    def test_pets_have_ids(self, auth_token):
        """Test pets have valid IDs"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        pets = data.get("pets", data if isinstance(data, list) else [])
        for pet in pets:
            assert pet.get("id"), f"Pet {pet.get('name')} missing ID"


class TestMockupStatistics:
    """Test mockup generation statistics"""
    
    def test_mockup_stats_endpoint(self):
        """Test mockup statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/mockups/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check for by_breed or completion_percentage (stats structure)
        assert "by_breed" in data or "completion_percentage" in data, "Stats missing expected fields"
        
        completion = data.get("completion_percentage", 0)
        print(f"✓ Mockup stats: {completion}% completion")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
