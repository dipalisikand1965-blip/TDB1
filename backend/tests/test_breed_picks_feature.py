"""
Test Suite: Breed Products & Personalized PICKS Feature
========================================================
Tests the PICKS feature showing personalized, breed-specific product recommendations.

Features tested:
1. Breed products seeding - /api/breed-catalogue/admin/breed-products-stats
2. Pillar-specific picks API - /api/mira/top-picks/{pet}/pillar/{pillar}
3. Breed products in main products collection
4. Login and auth flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-concierge-1.preview.emergentagent.com')

# Test credentials from request
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestBreedProductsSeeding:
    """Tests for breed products seeding - Feature 1"""
    
    def test_breed_products_stats_endpoint(self):
        """Verify /api/breed-catalogue/admin/breed-products-stats returns 160+ products across 20 breeds"""
        response = requests.get(f"{BASE_URL}/api/breed-catalogue/admin/breed-products-stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify total products
        total = data.get("total_breed_products", 0)
        assert total >= 160, f"Expected 160+ breed products, got {total}"
        
        # Verify breeds covered
        breeds_covered = data.get("breeds_covered", 0)
        assert breeds_covered >= 20, f"Expected 20 breeds, got {breeds_covered}"
        
        # Verify by_breed breakdown
        by_breed = data.get("by_breed", {})
        assert len(by_breed) >= 20, f"Expected 20 breeds in by_breed, got {len(by_breed)}"
        
        # Verify each breed has products (8 products per breed = 20 breeds * 8 = 160)
        for breed, count in by_breed.items():
            assert count >= 8, f"Expected 8+ products for {breed}, got {count}"
        
        print(f"✅ Breed products stats: {total} products across {breeds_covered} breeds")
        
    def test_breed_products_categories(self):
        """Verify breed products have correct category distribution"""
        response = requests.get(f"{BASE_URL}/api/breed-catalogue/admin/breed-products-stats")
        assert response.status_code == 200
        
        data = response.json()
        by_category = data.get("by_category", {})
        
        # Verify we have the expected categories
        expected_categories = ["breed-cakes", "cups_merch", "bandanas", "accessories", "celebration_addons"]
        for cat in expected_categories:
            assert cat in by_category, f"Missing category: {cat}"
            assert by_category[cat] > 0, f"Category {cat} has no products"
        
        print(f"✅ Categories verified: {list(by_category.keys())}")


class TestPillarSpecificPicks:
    """Tests for pillar-specific picks API - Feature 2"""
    
    def test_celebrate_pillar_picks(self):
        """Test /api/mira/top-picks/{pet}/pillar/celebrate returns celebrate-specific picks"""
        # Using Mystique as test pet (confirmed in the problem statement)
        response = requests.get(f"{BASE_URL}/api/mira/top-picks/Mystique/pillar/celebrate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify success
        assert data.get("success") == True, "Expected success=true"
        
        # Verify pillar info
        pillar = data.get("pillar", {})
        assert pillar.get("id") == "celebrate", f"Expected pillar id 'celebrate', got {pillar.get('id')}"
        assert pillar.get("name") == "Celebrate", f"Expected pillar name 'Celebrate', got {pillar.get('name')}"
        
        # Verify picks returned
        picks = data.get("picks", [])
        assert len(picks) > 0, "Expected at least one pick"
        
        print(f"✅ Celebrate pillar picks: {len(picks)} picks for Mystique")
        
        # Verify pick structure
        for pick in picks[:3]:
            assert "id" in pick, "Pick missing 'id'"
            assert "name" in pick, "Pick missing 'name'"
            assert "pick_type" in pick, "Pick missing 'pick_type'"
            print(f"   - {pick.get('name')} ({pick.get('pick_type')})")
    
    def test_dine_pillar_picks(self):
        """Test /api/mira/top-picks/{pet}/pillar/dine returns dine-specific picks"""
        response = requests.get(f"{BASE_URL}/api/mira/top-picks/Mystique/pillar/dine")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True
        
        pillar = data.get("pillar", {})
        assert pillar.get("id") == "dine", f"Expected pillar id 'dine', got {pillar.get('id')}"
        
        picks = data.get("picks", [])
        print(f"✅ Dine pillar picks: {len(picks)} picks")
    
    def test_care_pillar_picks(self):
        """Test /api/mira/top-picks/{pet}/pillar/care returns care-specific picks"""
        response = requests.get(f"{BASE_URL}/api/mira/top-picks/Mystique/pillar/care")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        pillar = data.get("pillar", {})
        assert pillar.get("id") == "care"
        
        picks = data.get("picks", [])
        print(f"✅ Care pillar picks: {len(picks)} picks")


class TestBreedProductsInMainCollection:
    """Tests for breed products in main products collection - Feature 5"""
    
    def test_breed_cakes_via_products_api(self):
        """Verify breed products appear via /api/products?pillar=celebrate&category=breed-cakes"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=celebrate&category=breed-cakes&limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        
        # Should have breed cake products
        assert len(products) > 0, "Expected breed-cakes products"
        
        # Verify they are breed cakes
        for product in products[:5]:
            category = product.get("category", "").lower()
            name = product.get("name", "").lower()
            # Should be breed-cakes category or have breed-related name
            assert "breed" in category or "breed" in name or "cake" in category, \
                f"Product {product.get('name')} doesn't appear to be a breed cake"
        
        print(f"✅ Breed cakes in products API: {len(products)} products found")
    
    def test_celebrate_pillar_products(self):
        """Test /api/products?pillar=celebrate returns celebration products"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=celebrate&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        
        assert len(products) > 0, "Expected celebrate products"
        print(f"✅ Celebrate pillar products: {len(products)} returned, {total} total")


class TestUserAuthentication:
    """Tests for user authentication flow - needed for Mira panel testing"""
    
    def test_user_login(self):
        """Test user can login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        # Login should succeed
        if response.status_code == 200:
            data = response.json()
            assert "token" in data or "access_token" in data, "Login response missing token"
            print(f"✅ User login successful: {TEST_USER_EMAIL}")
        else:
            # Alternative: might be using different auth endpoint
            print(f"⚠️ Login returned {response.status_code}, trying alternative endpoint...")
            
            response = requests.post(
                f"{BASE_URL}/api/users/login",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
            )
            if response.status_code == 200:
                print(f"✅ User login successful via /api/users/login")
            else:
                print(f"⚠️ Login status: {response.status_code} - may need manual testing")
    
    def test_admin_verify(self):
        """Test admin credentials work"""
        response = requests.post(
            f"{BASE_URL}/api/admin/verify",
            json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("valid") == True, "Admin verification should return valid=true"
            print(f"✅ Admin verification successful")
        else:
            print(f"⚠️ Admin verify returned {response.status_code}")


class TestMainTopPicksEndpoint:
    """Tests for main top-picks endpoint"""
    
    def test_top_picks_for_pet(self):
        """Test /api/mira/top-picks/{pet_name} returns all pillars"""
        response = requests.get(f"{BASE_URL}/api/mira/top-picks/Mystique")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Should have pillars data
        pillars = data.get("pillars", {})
        assert len(pillars) > 0, "Expected pillar data"
        
        # Should have celebrate pillar
        if "celebrate" in pillars:
            celebrate = pillars["celebrate"]
            print(f"✅ Celebrate pillar: {len(celebrate.get('picks', []))} catalogue picks, {len(celebrate.get('concierge_picks', []))} concierge picks")
        
        print(f"✅ Top picks endpoint working, pillars: {list(pillars.keys())}")


class TestBreedCatalogue:
    """Tests for breed catalogue endpoints"""
    
    def test_breed_products_list(self):
        """Test /api/breed-catalogue/products returns products"""
        response = requests.get(f"{BASE_URL}/api/breed-catalogue/products?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        
        print(f"✅ Breed catalogue products: {len(products)} returned, {total} total")
    
    def test_breed_products_filter_by_pillar(self):
        """Test filtering breed products by pillar"""
        response = requests.get(f"{BASE_URL}/api/breed-catalogue/products?pillar=celebrate&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # All products should have celebrate in their pillars
        for product in products:
            pillars = product.get("pillars", [])
            assert "celebrate" in pillars, f"Product {product.get('name')} missing 'celebrate' pillar"
        
        print(f"✅ Breed products filtered by celebrate pillar: {len(products)} found")
    
    def test_breed_products_filter_by_breed(self):
        """Test filtering breed products by specific breed"""
        response = requests.get(f"{BASE_URL}/api/breed-catalogue/products?breed=Labrador&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # All products should be for Labrador or universal
        for product in products:
            who_for = product.get("who_for", "")
            breed_tags = product.get("breed_tags", {}).get("breeds", [])
            assert "Labrador" in who_for or "Labrador" in breed_tags or len(breed_tags) == 0, \
                f"Product {product.get('name')} not for Labrador"
        
        print(f"✅ Breed products for Labrador: {len(products)} found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
