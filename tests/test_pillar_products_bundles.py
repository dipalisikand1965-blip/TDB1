"""
Test Pillar Products and Bundles - Enjoy, FIT, Dine
Tests that products and bundles are properly seeded and returned by APIs
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petlifeos-2.preview.emergentagent.com')


class TestEnjoyPillar:
    """Tests for Enjoy pillar products and bundles"""
    
    def test_enjoy_products_endpoint(self):
        """Test /api/enjoy/products returns products"""
        response = requests.get(f"{BASE_URL}/api/enjoy/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0, "Enjoy products should be seeded"
        print(f"✅ Enjoy products: {len(data['products'])} products found")
        
    def test_enjoy_products_have_required_fields(self):
        """Test enjoy products have required fields"""
        response = requests.get(f"{BASE_URL}/api/enjoy/products")
        data = response.json()
        products = data.get("products", [])
        
        for product in products[:3]:  # Check first 3
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            assert "category" in product, "Product should have category"
            print(f"  - {product['name']}: ₹{product['price']}")
        print(f"✅ Enjoy products have required fields")
        
    def test_enjoy_bundles_endpoint(self):
        """Test /api/enjoy/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/enjoy/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0, "Enjoy bundles should be seeded"
        print(f"✅ Enjoy bundles: {len(data['bundles'])} bundles found")
        
    def test_enjoy_bundles_have_required_fields(self):
        """Test enjoy bundles have required fields"""
        response = requests.get(f"{BASE_URL}/api/enjoy/bundles")
        data = response.json()
        bundles = data.get("bundles", [])
        
        for bundle in bundles[:3]:  # Check first 3
            assert "id" in bundle, "Bundle should have id"
            assert "name" in bundle, "Bundle should have name"
            assert "price" in bundle, "Bundle should have price"
            assert "is_active" in bundle, "Bundle should have is_active"
            print(f"  - {bundle['name']}: ₹{bundle['price']} (active: {bundle['is_active']})")
        print(f"✅ Enjoy bundles have required fields")


class TestFitPillar:
    """Tests for FIT pillar products and bundles"""
    
    def test_fit_products_endpoint(self):
        """Test /api/fit/products returns products"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0, "FIT products should be seeded"
        print(f"✅ FIT products: {len(data['products'])} products found")
        
    def test_fit_products_have_required_fields(self):
        """Test FIT products have required fields"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        data = response.json()
        products = data.get("products", [])
        
        for product in products[:3]:  # Check first 3
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            assert "category" in product, "Product should have category"
            print(f"  - {product['name']}: ₹{product['price']}")
        print(f"✅ FIT products have required fields")
        
    def test_fit_bundles_endpoint(self):
        """Test /api/fit/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/fit/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0, "FIT bundles should be seeded"
        print(f"✅ FIT bundles: {len(data['bundles'])} bundles found")
        
    def test_fit_bundles_have_is_active(self):
        """Test FIT bundles have is_active field set to true"""
        response = requests.get(f"{BASE_URL}/api/fit/bundles")
        data = response.json()
        bundles = data.get("bundles", [])
        
        for bundle in bundles:
            assert bundle.get("is_active") == True, f"Bundle {bundle.get('name')} should be active"
            print(f"  - {bundle['name']}: ₹{bundle['price']} (active: {bundle['is_active']})")
        print(f"✅ All FIT bundles are active")


class TestDinePillar:
    """Tests for Dine pillar products and bundles"""
    
    def test_dine_products_endpoint(self):
        """Test /api/dine/products returns products"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0, "Dine products should be seeded"
        print(f"✅ Dine products: {len(data['products'])} products found")
        
    def test_dine_products_have_required_fields(self):
        """Test Dine products have required fields"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        data = response.json()
        products = data.get("products", [])
        
        for product in products[:3]:  # Check first 3
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            print(f"  - {product['name']}: ₹{product['price']}")
        print(f"✅ Dine products have required fields")
        
    def test_dine_bundles_endpoint(self):
        """Test /api/dine/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0, "Dine bundles should be seeded"
        print(f"✅ Dine bundles: {len(data['bundles'])} bundles found")
        
    def test_dine_bundles_have_required_fields(self):
        """Test Dine bundles have required fields"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        data = response.json()
        bundles = data.get("bundles", [])
        
        for bundle in bundles[:3]:  # Check first 3
            assert "id" in bundle, "Bundle should have id"
            assert "name" in bundle, "Bundle should have name"
            assert "bundle_price" in bundle or "price" in bundle, "Bundle should have price"
            print(f"  - {bundle['name']}: ₹{bundle.get('bundle_price', bundle.get('price'))}")
        print(f"✅ Dine bundles have required fields")


class TestNavigation:
    """Tests for pillar navigation links"""
    
    def test_enjoy_page_accessible(self):
        """Test Enjoy page is accessible"""
        response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        print(f"✅ Enjoy experiences endpoint accessible")
        
    def test_fit_page_accessible(self):
        """Test FIT page is accessible"""
        response = requests.get(f"{BASE_URL}/api/fit/plans")
        assert response.status_code == 200
        print(f"✅ FIT plans endpoint accessible")
        
    def test_dine_page_accessible(self):
        """Test Dine page is accessible"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        print(f"✅ Dine restaurants endpoint accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
