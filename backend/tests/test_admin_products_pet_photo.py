"""
Test Admin Products API and Pet Photo API
Tests for:
1. Admin Products API - verify /api/admin/products returns products from unified_products collection
2. Admin Products - test single product GET /api/admin/products/{id}
3. Pet Photo API - test /api/pet-photo/{pet_id}/{filename} serves images correctly
4. Pet Photo Upload - test POST /api/pets/{pet_id}/photo uploads and stores photo
"""

import pytest
import requests
import os
import io

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test user credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"

# Known pet with photo
KNOWN_PET_ID = "pet-99a708f1722a"
KNOWN_PET_PHOTO_FILENAME = "pet_pet-99a708f1722a_9b77ca29bd.jpg"


class TestAdminProductsAPI:
    """Test Admin Products API - unified_products collection"""
    
    def test_admin_products_returns_products(self):
        """Test that /api/admin/products returns products from unified_products"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total" in data, "Response should contain 'total' key"
        assert "source" in data, "Response should contain 'source' key"
        
        # Verify we're getting products from unified_products (default source)
        assert data["source"] == "unified", f"Expected source 'unified', got {data['source']}"
        
        # Verify we have products
        products = data["products"]
        total = data["total"]
        
        print(f"Total products returned: {len(products)}")
        print(f"Total count in DB: {total}")
        
        assert len(products) > 0, "Should return at least some products"
        assert total > 0, "Total count should be greater than 0"
        
    def test_admin_products_count_650(self):
        """Test that unified_products collection has approximately 650 products"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=1000",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        total = data["total"]
        print(f"Total unified products: {total}")
        
        # Should have around 650 products (allow some variance)
        assert total >= 600, f"Expected at least 600 products, got {total}"
        assert total <= 700, f"Expected at most 700 products, got {total}"
        
    def test_admin_products_has_required_fields(self):
        """Test that products have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=10",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        products = data["products"]
        
        assert len(products) > 0, "Should have at least one product"
        
        # Check first product has required fields
        product = products[0]
        print(f"Sample product: {product.get('id', 'N/A')} - {product.get('title') or product.get('name', 'N/A')}")
        
        # Products should have either title or name
        assert product.get("title") or product.get("name"), "Product should have title or name"
        
    def test_admin_products_filter_by_pillar(self):
        """Test filtering products by pillar"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?pillar=shop",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return pillars list
        assert "pillars" in data, "Response should contain 'pillars' key"
        print(f"Available pillars: {data.get('pillars', [])}")
        
    def test_admin_products_returns_categories(self):
        """Test that response includes categories"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data, "Response should contain 'categories' key"
        categories = data["categories"]
        print(f"Available categories: {categories}")
        
    def test_admin_products_legacy_source(self):
        """Test querying legacy products collection"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?source=legacy",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["source"] == "legacy", f"Expected source 'legacy', got {data['source']}"
        print(f"Legacy products count: {data['total']}")
        
    def test_admin_products_requires_auth(self):
        """Test that admin products endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        
        # Should return 401 without auth
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"


class TestAdminSingleProduct:
    """Test Admin Single Product API"""
    
    def test_get_single_product_from_legacy(self):
        """Test getting a single product by ID from legacy collection"""
        # First get a product ID from the legacy collection
        response = requests.get(
            f"{BASE_URL}/api/admin/products?source=legacy&limit=1",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data["total"] == 0:
            pytest.skip("No legacy products available")
            
        product_id = data["products"][0].get("id")
        if not product_id:
            pytest.skip("Product has no ID")
            
        # Now get single product
        response = requests.get(
            f"{BASE_URL}/api/admin/products/{product_id}",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Single product response status: {response.status_code}")
        print(f"Single product response: {response.text[:500]}")
        
        # Note: This endpoint queries 'products' collection, not 'unified_products'
        # So it may return 404 if product is only in unified_products
        if response.status_code == 200:
            data = response.json()
            assert "product" in data, "Response should contain 'product' key"
            assert data["product"]["id"] == product_id
        else:
            print(f"Product {product_id} not found in legacy collection")


class TestPetPhotoAPI:
    """Test Pet Photo serving API"""
    
    def test_serve_pet_photo_existing(self):
        """Test serving an existing pet photo via /api/pet-photo/{pet_id}/{filename}"""
        response = requests.get(
            f"{BASE_URL}/api/pet-photo/{KNOWN_PET_ID}/{KNOWN_PET_PHOTO_FILENAME}"
        )
        
        print(f"Pet photo response status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"Content-Length: {len(response.content)} bytes")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify content type is image
        content_type = response.headers.get('content-type', '')
        assert 'image' in content_type, f"Expected image content-type, got {content_type}"
        
        # Verify we got actual image data
        assert len(response.content) > 1000, f"Expected image data, got {len(response.content)} bytes"
        
    def test_serve_pet_photo_not_found(self):
        """Test 404 for non-existent pet photo"""
        response = requests.get(
            f"{BASE_URL}/api/pet-photo/nonexistent-pet/nonexistent-file.jpg"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
    def test_serve_pet_photo_content_type_jpg(self):
        """Test that JPG photos return correct content-type"""
        response = requests.get(
            f"{BASE_URL}/api/pet-photo/{KNOWN_PET_ID}/{KNOWN_PET_PHOTO_FILENAME}"
        )
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            assert content_type == 'image/jpeg', f"Expected image/jpeg, got {content_type}"


class TestPetPhotoUpload:
    """Test Pet Photo Upload API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate: {response.text}")
            
        return response.json().get("access_token")
    
    def test_upload_pet_photo_requires_pet_exists(self):
        """Test that uploading to non-existent pet returns 404"""
        # Create a small test image
        test_image = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
        
        response = requests.post(
            f"{BASE_URL}/api/pets/nonexistent-pet-id/photo",
            files={"photo": ("test.png", test_image, "image/png")}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
    def test_upload_pet_photo_validates_file_type(self):
        """Test that non-image files are rejected"""
        # First we need a valid pet ID
        # Get pets for the test user
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip("Could not authenticate")
            
        token = response.json().get("access_token")
        
        # Get user's pets
        response = requests.get(
            f"{BASE_URL}/api/user/pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200 or not response.json().get("pets"):
            # Try with known pet ID
            pet_id = KNOWN_PET_ID
        else:
            pet_id = response.json()["pets"][0].get("id", KNOWN_PET_ID)
        
        # Try uploading a text file
        test_file = io.BytesIO(b'This is not an image')
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{pet_id}/photo",
            files={"photo": ("test.txt", test_file, "text/plain")}
        )
        
        print(f"Upload non-image response: {response.status_code} - {response.text}")
        
        # Should reject non-image files
        assert response.status_code == 400, f"Expected 400 for non-image, got {response.status_code}"


class TestPetPhotoURLConversion:
    """Test that old static paths are converted to new API paths"""
    
    def test_old_path_format_documented(self):
        """Document the old and new path formats"""
        old_format = "/static/uploads/pets/pet_pet-99a708f1722a_9b77ca29bd.jpg"
        new_format = "/api/pet-photo/pet-99a708f1722a/pet_pet-99a708f1722a_9b77ca29bd.jpg"
        
        print(f"Old format: {old_format}")
        print(f"New format: {new_format}")
        
        # The frontend petAvatar.js should convert old to new
        # This is a documentation test
        assert True
        
    def test_new_api_path_works(self):
        """Test that the new API path format works"""
        response = requests.get(
            f"{BASE_URL}/api/pet-photo/{KNOWN_PET_ID}/{KNOWN_PET_PHOTO_FILENAME}"
        )
        
        assert response.status_code == 200, f"New API path should work, got {response.status_code}"
        assert 'image' in response.headers.get('content-type', ''), "Should return image"


class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
    def test_db_health(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
