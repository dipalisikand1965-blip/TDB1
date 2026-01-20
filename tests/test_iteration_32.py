"""
Test Suite for Iteration 32 - Service Desk, Collections, and Dine fixes
Tests:
1. Service Desk route at /admin/service-desk
2. Collections API returns correct product_count
3. Dine page shows restaurants and products
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCollectionsAPI:
    """Test collections endpoint returns correct product_count"""
    
    def test_collections_endpoint_returns_data(self):
        """Test /api/collections returns collections"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code == 200
        data = response.json()
        assert "collections" in data
        assert len(data["collections"]) > 0
        print(f"✅ Found {len(data['collections'])} collections")
    
    def test_collections_have_product_count(self):
        """Test each collection has product_count calculated from product_ids"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code == 200
        data = response.json()
        
        collections_with_products = 0
        for col in data["collections"]:
            assert "product_count" in col, f"Collection {col.get('name')} missing product_count"
            product_ids = col.get("product_ids", [])
            expected_count = len(product_ids)
            actual_count = col.get("product_count", 0)
            
            # Verify product_count matches length of product_ids
            assert actual_count == expected_count, \
                f"Collection {col.get('name')}: product_count={actual_count} but product_ids has {expected_count} items"
            
            if actual_count > 0:
                collections_with_products += 1
                print(f"✅ Collection '{col.get('name')}': product_count={actual_count}")
        
        print(f"✅ {collections_with_products} collections have products")
        assert collections_with_products > 0, "At least one collection should have products"
    
    def test_cakes_collection_has_products(self):
        """Test cakes collection specifically has products"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code == 200
        data = response.json()
        
        cakes_collection = next((c for c in data["collections"] if c.get("id") == "cakes"), None)
        assert cakes_collection is not None, "Cakes collection not found"
        assert cakes_collection.get("product_count", 0) > 0, "Cakes collection should have products"
        print(f"✅ Cakes collection has {cakes_collection.get('product_count')} products")


class TestDineAPI:
    """Test Dine page APIs - restaurants, bundles, products"""
    
    def test_dine_restaurants_endpoint(self):
        """Test /api/dine/restaurants returns restaurants"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        assert len(data["restaurants"]) > 0
        print(f"✅ Found {len(data['restaurants'])} restaurants")
    
    def test_dine_restaurants_have_required_fields(self):
        """Test restaurants have required fields"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "name", "city"]
        for restaurant in data["restaurants"][:5]:  # Check first 5
            for field in required_fields:
                assert field in restaurant, f"Restaurant missing field: {field}"
        print("✅ Restaurants have required fields")
    
    def test_dine_bundles_endpoint(self):
        """Test /api/dine/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0
        print(f"✅ Found {len(data['bundles'])} dine bundles")
    
    def test_dine_products_endpoint(self):
        """Test /api/dine/products returns products"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print(f"✅ Found {len(data['products'])} dine products")
    
    def test_dine_products_have_required_fields(self):
        """Test dine products have required fields"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "name", "price"]
        for product in data["products"][:5]:  # Check first 5
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
        print("✅ Dine products have required fields")


class TestAdminLogin:
    """Test admin login for Service Desk"""
    
    def test_admin_login_endpoint(self):
        """Test /api/admin/login works with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"}
        )
        assert response.status_code == 200
        data = response.json()
        # API returns success: true and message
        assert data.get("success") == True or "token" in data
        print("✅ Admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Test /api/admin/login rejects invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401
        print("✅ Admin login correctly rejects invalid credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
