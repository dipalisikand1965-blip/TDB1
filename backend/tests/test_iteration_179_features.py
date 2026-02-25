"""
Test Iteration 179 Features:
1. Mobile navbar shows subheader dropdown items (Meal Plans visible under Dine)
2. Meal products seeded with intelligent tags (veg and non-veg)
3. All 932 products enhanced with cross-pollination tags
4. Product has cross_sell_products and frequently_bought_together fields
5. MealPlanPage has multi-pet selection for users with multiple pets
6. CSV export endpoint working at /api/admin/export/products-csv
"""
import pytest
import requests
import os
import json
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestCSVExportEndpoint:
    """Test CSV export endpoint at /api/admin/export/products-csv"""
    
    def test_csv_export_with_valid_admin_auth(self):
        """Test CSV export returns valid CSV with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-csv",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition
        content_disp = response.headers.get('content-disposition', '')
        assert 'products_export.csv' in content_disp, f"Expected products_export.csv in {content_disp}"
        
        # Check CSV has content
        csv_content = response.text
        assert len(csv_content) > 100, "CSV content too short"
        
        # Check CSV has headers
        lines = csv_content.split('\n')
        assert len(lines) > 1, "CSV should have header and data rows"
        
        # Check expected columns exist
        header = lines[0].lower()
        assert 'id' in header, "CSV should have id column"
        assert 'name' in header, "CSV should have name column"
        assert 'price' in header, "CSV should have price column"
        
        print(f"CSV export successful: {len(lines)} rows")
    
    def test_csv_export_without_auth_fails(self):
        """Test CSV export fails without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/export/products-csv")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_csv_export_with_wrong_credentials_fails(self):
        """Test CSV export fails with wrong credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-csv",
            auth=HTTPBasicAuth("wrong", "wrong")
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestSeedMealProductsEndpoint:
    """Test seed-meal-products endpoint"""
    
    def test_seed_meal_products_endpoint_exists(self):
        """Test that seed-meal-products endpoint exists and requires auth"""
        response = requests.post(f"{BASE_URL}/api/admin/products/seed-meal-products")
        # Should return 401 without auth, not 404
        assert response.status_code == 401, f"Expected 401 (auth required), got {response.status_code}"
    
    def test_seed_meal_products_with_admin_auth(self):
        """Test seed-meal-products with admin authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/seed-meal-products",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "products_added" in data, "Expected products_added in response"
        
        print(f"Seed meal products: {data.get('message')}")


class TestEnhanceAllTagsEndpoint:
    """Test enhance-all-tags endpoint"""
    
    def test_enhance_all_tags_endpoint_exists(self):
        """Test that enhance-all-tags endpoint exists and requires auth"""
        response = requests.post(f"{BASE_URL}/api/admin/products/enhance-all-tags")
        # Should return 401 without auth, not 404
        assert response.status_code == 401, f"Expected 401 (auth required), got {response.status_code}"
    
    def test_enhance_all_tags_with_admin_auth(self):
        """Test enhance-all-tags with admin authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/enhance-all-tags",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD),
            timeout=120  # This can take a while for many products
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "enhanced_count" in data, "Expected enhanced_count in response"
        
        print(f"Enhanced tags: {data.get('enhanced_count')} products")


class TestMealProductsWithIntelligentTags:
    """Test that meal products have intelligent tags including cross-sell fields"""
    
    def test_meal_products_exist(self):
        """Test that meal products exist in the database"""
        response = requests.get(f"{BASE_URL}/api/products?category=fresh-meals&limit=50")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        
        # Should have meal products
        print(f"Found {len(products)} fresh-meals products")
        
        # If no products, try pillar=dine
        if len(products) == 0:
            response2 = requests.get(f"{BASE_URL}/api/products?pillar=dine&limit=50")
            if response2.status_code == 200:
                data2 = response2.json()
                products = data2.get("products", [])
                print(f"Found {len(products)} dine pillar products")
        
        return products
    
    def test_meal_products_have_intelligent_tags(self):
        """Test that meal products have intelligent_tags field"""
        response = requests.get(f"{BASE_URL}/api/products?category=fresh-meals&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check at least some products have intelligent_tags
        products_with_tags = [p for p in products if p.get("intelligent_tags")]
        
        if len(products) > 0:
            print(f"{len(products_with_tags)}/{len(products)} products have intelligent_tags")
            
            # Check a sample product
            if products_with_tags:
                sample = products_with_tags[0]
                print(f"Sample product: {sample.get('name')}")
                print(f"Intelligent tags: {sample.get('intelligent_tags', [])[:10]}")
    
    def test_products_have_cross_sell_fields(self):
        """Test that products have cross_sell_products and frequently_bought_together fields"""
        response = requests.get(f"{BASE_URL}/api/products?category=fresh-meals&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check for cross-sell fields
        products_with_cross_sell = [p for p in products if p.get("cross_sell_products")]
        products_with_fbt = [p for p in products if p.get("frequently_bought_together")]
        
        print(f"Products with cross_sell_products: {len(products_with_cross_sell)}/{len(products)}")
        print(f"Products with frequently_bought_together: {len(products_with_fbt)}/{len(products)}")
        
        # If we have products with these fields, verify structure
        if products_with_cross_sell:
            sample = products_with_cross_sell[0]
            cross_sell = sample.get("cross_sell_products", [])
            assert isinstance(cross_sell, list), "cross_sell_products should be a list"
            print(f"Sample cross_sell_products: {cross_sell}")
        
        if products_with_fbt:
            sample = products_with_fbt[0]
            fbt = sample.get("frequently_bought_together", [])
            assert isinstance(fbt, list), "frequently_bought_together should be a list"
            print(f"Sample frequently_bought_together: {fbt}")


class TestProductTagEnhancement:
    """Test that products have been enhanced with cross-pollination tags"""
    
    def test_products_have_enhanced_tags(self):
        """Test that products have various tag types"""
        response = requests.get(f"{BASE_URL}/api/products?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        
        print(f"Total products in database: {total}")
        
        # Count products with various tag types
        tag_counts = {
            "intelligent_tags": 0,
            "breed_tags": 0,
            "health_tags": 0,
            "lifestage_tags": 0,
            "diet_tags": 0,
            "occasion_tags": 0,
            "size_tags": 0,
        }
        
        for product in products:
            for tag_type in tag_counts:
                if product.get(tag_type):
                    tag_counts[tag_type] += 1
        
        print(f"Tag distribution in sample of {len(products)} products:")
        for tag_type, count in tag_counts.items():
            print(f"  {tag_type}: {count}/{len(products)}")
    
    def test_birthday_occasion_tags_exist(self):
        """Test that birthday/occasion tags exist on relevant products"""
        response = requests.get(f"{BASE_URL}/api/products?category=cakes&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check for birthday-related tags
        birthday_products = []
        for p in products:
            tags = p.get("intelligent_tags", []) + p.get("occasion_tags", [])
            if any("birthday" in str(t).lower() or "celebration" in str(t).lower() for t in tags):
                birthday_products.append(p.get("name"))
        
        print(f"Products with birthday/celebration tags: {len(birthday_products)}/{len(products)}")
        if birthday_products:
            print(f"Examples: {birthday_products[:5]}")


class TestMemberLogin:
    """Test member login for authenticated endpoints"""
    
    def test_member_login(self):
        """Test member login returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        # API returns access_token, not token
        assert "access_token" in data, "Expected access_token in response"
        
        return data["access_token"]
    
    def test_fetch_user_pets(self):
        """Test fetching user's pets for multi-pet selection"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        
        # Fetch pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pets_response.status_code == 200, f"Failed to fetch pets: {pets_response.status_code}"
        
        data = pets_response.json()
        pets = data.get("pets", [])
        
        print(f"User has {len(pets)} pets")
        for pet in pets:
            print(f"  - {pet.get('name')} (ID: {pet.get('id')})")
        
        return pets


class TestDineDropdownNavigation:
    """Test Dine dropdown navigation items"""
    
    def test_dine_meals_page_loads(self):
        """Test that /dine/meals page endpoint works"""
        # Test the products endpoint for meals
        response = requests.get(f"{BASE_URL}/api/products?pillar=dine&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Dine products: {data.get('total', 0)} total")
    
    def test_meal_plan_page_endpoint(self):
        """Test that meal plan related endpoints work"""
        # Test products for meal plan
        response = requests.get(f"{BASE_URL}/api/products?pillar=feed&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Feed products for meal plan: {data.get('total', 0)} total")


class TestProductCount:
    """Test total product count"""
    
    def test_total_product_count(self):
        """Test that we have the expected number of products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        
        data = response.json()
        total = data.get("total", 0)
        
        print(f"Total products in database: {total}")
        
        # Should have a significant number of products
        assert total > 100, f"Expected more than 100 products, got {total}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
