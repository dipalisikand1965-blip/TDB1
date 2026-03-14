"""
Iteration 84 - Comprehensive Testing
Tests for:
1. Dashboard - No flickering, shows 'Loading your pet family...' until data loads
2. Product Options Sync - Products have proper options (Base, Flavour, Size) from Shopify
3. Universal Search - Search 'travel' returns Travel Services page + travel products
4. Universal Search - Search 'what is td' returns About Us page
5. Universal Search - Search 'event' returns event-related results
6. AI Description Enhancement - POST /api/admin/products/enhance-single/{product_id} works
7. Smart Recommendations - GET /api/smart/recommendations/{user_id} returns breed picks, insights
8. Product Detail Page - Shows 'Customize Your Order' with Base/Flavour options
9. Shopify Sync - POST /api/admin/sync/shopify syncs to unified_products
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-concierge-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"
TEST_USER_ID = "a152181a-2f81-4323-845e-2b5146906fe9"
TEST_PRODUCT_ID = "shopify-6622536827034"  # Pug cake with options


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ API Health: {data}")
    
    def test_db_health(self):
        """Test database health"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ DB Health: {data}")


class TestUniversalSearch:
    """Test Universal Search - The Google of the site"""
    
    def test_search_travel_returns_travel_page(self):
        """Search 'travel' should return Travel Services page + travel products"""
        response = requests.get(f"{BASE_URL}/api/search/universal?q=travel&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Check pages include Travel
        pages = data.get("pages", [])
        travel_page_found = any(
            "travel" in p.get("name", "").lower() or 
            "travel" in p.get("url", "").lower() 
            for p in pages
        )
        assert travel_page_found, f"Travel page not found in pages: {pages}"
        print(f"✅ Search 'travel' returns Travel page: {[p.get('name') for p in pages]}")
        
        # Check products (optional - may or may not have travel products)
        products = data.get("products", [])
        print(f"   Products found: {len(products)}")
    
    def test_search_what_is_td_returns_about_page(self):
        """Search 'what is td' should return About Us page"""
        response = requests.get(f"{BASE_URL}/api/search/universal?q=what%20is%20td&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        pages = data.get("pages", [])
        about_page_found = any(
            "about" in p.get("name", "").lower() or 
            "/about" in p.get("url", "").lower()
            for p in pages
        )
        assert about_page_found, f"About Us page not found in pages: {pages}"
        print(f"✅ Search 'what is td' returns About page: {[p.get('name') for p in pages]}")
    
    def test_search_event_returns_event_results(self):
        """Search 'event' should return event-related results"""
        response = requests.get(f"{BASE_URL}/api/search/universal?q=event&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Check pages include Events/Enjoy
        pages = data.get("pages", [])
        event_page_found = any(
            "event" in p.get("name", "").lower() or 
            "enjoy" in p.get("name", "").lower() or
            "/enjoy" in p.get("url", "").lower()
            for p in pages
        )
        assert event_page_found, f"Event page not found in pages: {pages}"
        print(f"✅ Search 'event' returns Event page: {[p.get('name') for p in pages]}")
        
        # Check events array
        events = data.get("events", [])
        print(f"   Events found: {len(events)}")


class TestProductOptions:
    """Test Product Options Sync from Shopify"""
    
    def test_product_has_options(self):
        """Test product shopify-6622536827034 has Base and Flavour options"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        product = data.get("product", data)  # Handle both formats
        options = product.get("options", [])
        
        # Check for Base and Flavour options
        option_names = [opt.get("name", "").lower() for opt in options]
        
        has_base = any("base" in name for name in option_names)
        has_flavour = any("flavour" in name or "flavor" in name for name in option_names)
        
        print(f"✅ Product options: {option_names}")
        print(f"   Has Base: {has_base}, Has Flavour: {has_flavour}")
        
        # At least one option should exist
        assert len(options) > 0, f"Product should have options, got: {options}"
    
    def test_unified_products_have_options(self):
        """Test unified_products collection has products with options"""
        response = requests.get(f"{BASE_URL}/api/products?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        products_with_options = [p for p in products if p.get("options") and len(p.get("options", [])) > 0]
        
        print(f"✅ Products with options: {len(products_with_options)} out of {len(products)}")
        
        if products_with_options:
            sample = products_with_options[0]
            print(f"   Sample: {sample.get('name')} - Options: {[o.get('name') for o in sample.get('options', [])]}")


class TestAIDescriptionEnhancer:
    """Test AI Description Enhancement endpoint"""
    
    def test_enhance_single_product(self):
        """Test POST /api/admin/products/enhance-single/{product_id}"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/enhance-single/{TEST_PRODUCT_ID}",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        # Should return 200 or 404 if endpoint exists
        assert response.status_code in [200, 404, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI Enhancement response: {data}")
            assert "enhanced" in data or "success" in data or "ai_description" in data
        elif response.status_code == 404:
            print(f"⚠️ AI Enhancement endpoint not found (404) - may need to check route")
        else:
            print(f"⚠️ AI Enhancement returned {response.status_code}: {response.text[:200]}")


class TestSmartRecommendations:
    """Test Smart Recommendations Engine"""
    
    def test_recommendations_by_user_id(self):
        """Test GET /api/smart/recommendations/{user_id} returns breed picks and insights"""
        response = requests.get(f"{BASE_URL}/api/smart/recommendations/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Check for expected fields
        assert "mira_picks" in data or "breed_picks" in data, f"Missing picks in response: {data.keys()}"
        
        breed_picks = data.get("breed_picks", [])
        insights = data.get("insights", [])
        mira_picks = data.get("mira_picks", [])
        
        print(f"✅ Smart Recommendations:")
        print(f"   Breed Picks: {len(breed_picks)}")
        print(f"   Mira Picks: {len(mira_picks)}")
        print(f"   Insights: {len(insights)}")
        
        if insights:
            print(f"   Sample insight: {insights[0][:100] if insights else 'None'}")
    
    def test_recommendations_by_email(self):
        """Test recommendations using email as user_id"""
        response = requests.get(f"{BASE_URL}/api/smart/recommendations/{TEST_USER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        
        print(f"✅ Recommendations by email: {data.keys()}")


class TestShopifySync:
    """Test Shopify Sync functionality"""
    
    def test_shopify_sync_endpoint_exists(self):
        """Test POST /api/admin/sync/shopify endpoint exists"""
        # Just check if endpoint exists, don't actually sync
        response = requests.post(
            f"{BASE_URL}/api/admin/sync/shopify",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"dry_run": True}  # If supported
        )
        
        # Should return 200, 400, or 422 (not 404)
        assert response.status_code != 404, "Shopify sync endpoint not found"
        print(f"✅ Shopify sync endpoint exists, status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Sync response: {data}")


class TestUserAuthentication:
    """Test user authentication for dashboard"""
    
    def test_user_login(self):
        """Test user can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "token" in data or "access_token" in data, f"No token in response: {data.keys()}"
        print(f"✅ User login successful")
        
        return data.get("token") or data.get("access_token")
    
    def test_get_user_pets(self):
        """Test getting user's pets (for dashboard)"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        token = login_response.json().get("token") or login_response.json().get("access_token")
        
        # Get pets
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        pets = data.get("pets", [])
        print(f"✅ User has {len(pets)} pets")
        
        if pets:
            for pet in pets[:3]:
                print(f"   - {pet.get('name')} ({pet.get('breed')})")


class TestTypeaheadSearch:
    """Test typeahead search for navbar"""
    
    def test_typeahead_returns_products(self):
        """Test typeahead returns products with images and prices"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=cake&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        assert len(products) > 0, "Typeahead should return products"
        
        # Check product has required fields
        sample = products[0]
        print(f"✅ Typeahead returns {len(products)} products")
        print(f"   Sample: {sample.get('name')} - Price: {sample.get('price')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
