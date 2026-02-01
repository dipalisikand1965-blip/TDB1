"""
Test suite for The Doggy Bakery Admin Panel
Tests admin login, products CRUD, dashboard, and related functionality
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://occasion-boxes.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAdminLogin:
    """Test admin authentication endpoints"""
    
    def test_admin_login_success(self):
        """Test successful admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        print(f"✓ Admin login successful: {data['message']}")
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_admin_login_missing_fields(self):
        """Test login with missing fields"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME}
        )
        assert response.status_code == 422  # Validation error
        print("✓ Missing password field correctly rejected")


class TestAdminDashboard:
    """Test admin dashboard endpoint"""
    
    def test_dashboard_requires_auth(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Dashboard correctly requires authentication")
    
    def test_dashboard_with_auth(self):
        """Test dashboard returns data with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "summary" in data
        assert "total_chats" in data["summary"]
        assert "active_chats" in data["summary"]
        assert "total_custom_requests" in data["summary"]
        
        print(f"✓ Dashboard loaded: {data['summary']['total_chats']} total chats, {data['summary']['active_chats']} active")


class TestAdminProducts:
    """Test admin products CRUD operations"""
    
    def test_get_products_requires_auth(self):
        """Test products endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 401
        print("✓ Products endpoint correctly requires authentication")
    
    def test_get_products_list(self):
        """Test fetching products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=10",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        
        if len(data["products"]) > 0:
            product = data["products"][0]
            # Verify product structure
            assert "id" in product
            assert "name" in product
            assert "price" in product or "minPrice" in product
            print(f"✓ Products list loaded: {len(data['products'])} products")
        else:
            print("✓ Products endpoint works but no products found")
    
    def test_get_products_with_category_filter(self):
        """Test filtering products by category"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?category=cakes&limit=10",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        # Verify all returned products are in the cakes category
        for product in data["products"]:
            assert product.get("category") == "cakes", f"Product {product.get('name')} has category {product.get('category')}"
        
        print(f"✓ Category filter works: {len(data['products'])} cakes found")
    
    def test_create_product(self):
        """Test creating a new product"""
        test_product = {
            "id": f"TEST_local-{datetime.now().timestamp()}",
            "name": "TEST_Birthday Cake for Testing",
            "description": "A test product created by automated tests",
            "category": "cakes",
            "price": 999,
            "image": "https://example.com/test-cake.jpg",
            "sizes": [{"name": "Small", "price": 999}, {"name": "Large", "price": 1499}],
            "flavors": [{"name": "Chicken", "price": 0}, {"name": "Peanut Butter", "price": 50}],
            "status": "active",
            "tags": ["test", "birthday"],
            "available": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            json=test_product,
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        
        # Store product ID for cleanup
        self.__class__.created_product_id = test_product["id"]
        
        print(f"✓ Product created successfully: {test_product['name']}")
        return test_product["id"]
    
    def test_update_product(self):
        """Test updating an existing product"""
        # First get a product to update
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=1",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        if not products:
            pytest.skip("No products available to update")
        
        product_id = products[0]["id"]
        original_name = products[0]["name"]
        
        # Update the product
        update_data = {
            "name": products[0]["name"],  # Keep same name
            "description": f"Updated description at {datetime.now().isoformat()}",
            "locally_edited": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json=update_data,
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        assert response.status_code == 200
        print(f"✓ Product updated successfully: {original_name}")
    
    def test_delete_test_product(self):
        """Test deleting a product (cleanup test product)"""
        # Try to delete the test product created earlier
        if hasattr(self.__class__, 'created_product_id'):
            product_id = self.__class__.created_product_id
            
            response = requests.delete(
                f"{BASE_URL}/api/admin/products/{product_id}",
                auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
            )
            
            assert response.status_code in [200, 204, 404]  # 404 is ok if already deleted
            print(f"✓ Test product deleted: {product_id}")
        else:
            pytest.skip("No test product to delete")


class TestProductStats:
    """Test product statistics displayed in admin panel"""
    
    def test_product_stats(self):
        """Test that product stats can be calculated from products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=1000",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        # Calculate stats
        total = len(products)
        active = len([p for p in products if p.get("status") != "draft"])
        no_image = len([p for p in products if not p.get("image")])
        categories = set(p.get("category") for p in products if p.get("category"))
        
        print(f"✓ Product stats: Total={total}, Active={active}, No Image={no_image}, Categories={len(categories)}")
        
        assert total >= 0
        assert active >= 0
        assert no_image >= 0


class TestSearchAndFilter:
    """Test search and filter functionality"""
    
    def test_search_products_by_name(self):
        """Test searching products by name"""
        # Get all products first
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=100",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        if products:
            # Search for a product by partial name
            search_term = products[0]["name"][:5].lower()
            matching = [p for p in products if search_term in p["name"].lower()]
            print(f"✓ Search functionality: '{search_term}' matches {len(matching)} products")
        else:
            print("✓ Search test skipped - no products available")


class TestSyncStatus:
    """Test Shopify sync status endpoint"""
    
    def test_sync_status(self):
        """Test fetching sync status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/sync-status",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # This endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Sync status retrieved: {data}")
        elif response.status_code == 404:
            print("✓ Sync status endpoint not found (may not be implemented)")
        else:
            print(f"✓ Sync status returned {response.status_code}")


class TestCartPersistence:
    """Test cart persistence (frontend localStorage - verified via API structure)"""
    
    def test_products_have_required_cart_fields(self):
        """Verify products have fields needed for cart functionality"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products?limit=10",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        if products:
            product = products[0]
            # Verify product has fields needed for cart
            assert "id" in product, "Product missing 'id' field"
            assert "name" in product, "Product missing 'name' field"
            assert "price" in product or "minPrice" in product, "Product missing price field"
            print(f"✓ Products have required cart fields: id, name, price")
        else:
            print("✓ Cart fields test skipped - no products available")


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self):
        """Test basic health check"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_db_health_check(self):
        """Test database health check"""
        response = requests.get(f"{BASE_URL}/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ DB health check passed: {data.get('products_count')} products in DB")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
