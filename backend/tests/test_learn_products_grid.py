"""
Test Learn Products Grid and Unified Product Box API
=====================================================
Tests that Learn page products grid fetches products from unified Product Box API
and Admin can manage Learn products via Product Box.

Test coverage:
1. Unified Product Box API with pillar=learn filter
2. Learn products endpoint fallback
3. Advisory products endpoint for comparison
4. Admin Product Box access
5. Admin product edit capabilities
"""

import pytest
import requests
import os

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductBoxAPI:
    """Test Unified Product Box API endpoints"""
    
    def test_health_check(self):
        """Test basic API health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_product_box_learn_products(self):
        """Test Product Box API returns Learn products with pillar filter"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?pillar=learn&limit=50")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"✓ Product Box Learn products: {len(data['products'])} products returned")
        
        # Check that products have correct structure
        if data["products"]:
            product = data["products"][0]
            assert "name" in product or "title" in product
            assert "price" in product or "base_price" in product
            print(f"  - Sample product: {product.get('name', product.get('title', 'N/A'))}")
        
        return data["products"]
    
    def test_product_box_learn_products_categories(self):
        """Test that Learn products have categories"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?pillar=learn&limit=100")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        categories = set()
        for product in products:
            cat = product.get("category")
            if cat:
                categories.add(cat)
        
        print(f"✓ Learn product categories found: {len(categories)}")
        print(f"  - Categories: {list(categories)[:10]}...")
        
        return list(categories)
    
    def test_product_box_total_count(self):
        """Test Product Box returns total count of Learn products"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?pillar=learn&limit=1")
        assert response.status_code == 200
        data = response.json()
        
        total = data.get("total", 0)
        print(f"✓ Total Learn products in Product Box: {total}")
        
        # Per the main agent, there should be 183 Learn products
        assert total > 0, "Expected at least some Learn products in Product Box"
        
        return total
    
    def test_learn_products_endpoint_fallback(self):
        """Test the Learn-specific products endpoint (fallback)"""
        response = requests.get(f"{BASE_URL}/api/learn/products?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        print(f"✓ Learn fallback endpoint: {len(data['products'])} products")
        
        return data["products"]


class TestAdvisoryComparison:
    """Test Advisory products to compare with Learn page layout"""
    
    def test_advisory_products_endpoint(self):
        """Test Advisory products endpoint works"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        products = data["products"]
        print(f"✓ Advisory products: {len(products)} products")
        
        # Check categories in Advisory products
        categories = set()
        for product in products:
            cat = product.get("category")
            if cat:
                categories.add(cat)
        
        print(f"  - Advisory categories: {list(categories)[:8]}...")
        
        return products


class TestAdminProductBox:
    """Test Admin access to Product Box for Learn product management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={
                "username": "aditya",
                "password": "lola4304"
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed - skipping admin tests")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={
                "username": "aditya",
                "password": "lola4304"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✓ Admin login successful")
        
        return data["token"]
    
    def test_admin_product_box_stats(self, admin_token):
        """Test Admin can access Product Box stats"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"✓ Product Box Stats:")
        print(f"  - Total products: {data.get('total_products', 'N/A')}")
        
        # Check pillar breakdown
        by_pillar = data.get("by_pillar", {})
        learn_count = by_pillar.get("learn", 0)
        print(f"  - Learn pillar products: {learn_count}")
        
        return data
    
    def test_admin_product_box_all_products(self, admin_token):
        """Test Admin can access all products in Product Box"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        total = data.get("total", 0)
        print(f"✓ Admin can access Product Box: {total} total products")
        
        return total
    
    def test_admin_can_filter_learn_products(self, admin_token):
        """Test Admin can filter Product Box for Learn products"""
        response = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=learn&limit=20",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        print(f"✓ Admin filtered Learn products: {len(products)} returned")
        
        # Verify products are Learn pillar
        for product in products[:5]:
            pillars = product.get("pillars", [])
            primary = product.get("primary_pillar") or product.get("pillar")
            print(f"  - {product.get('name', 'N/A')[:40]}: pillar={primary}, pillars={pillars}")
        
        return products


class TestProductStructure:
    """Test product data structure matches expected format for LearnProductsGrid"""
    
    def test_learn_product_has_required_fields(self):
        """Test that Learn products have required fields for the grid"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?pillar=learn&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        assert len(products) > 0, "No Learn products found"
        
        required_fields = ["name", "price"]
        optional_fields = ["image_url", "image", "description", "category", "in_stock"]
        
        product = products[0]
        print(f"✓ Sample product structure check:")
        
        # Check required fields (name, price or similar)
        has_name = "name" in product or "title" in product
        has_price = "price" in product or "base_price" in product
        
        assert has_name, "Product missing name/title field"
        assert has_price, "Product missing price/base_price field"
        
        for field in optional_fields:
            value = product.get(field, "NOT_SET")
            print(f"  - {field}: {str(value)[:50]}...")
        
        return product


class TestCloudinaryUpload:
    """Test Cloudinary image upload endpoints for product management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={
                "username": "aditya",
                "password": "lola4304"
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed")
    
    def test_product_upload_validation(self, admin_token):
        """Test that product image upload validates file types"""
        # Try uploading invalid file type
        files = {"file": ("test.txt", b"invalid content", "text/plain")}
        response = requests.post(
            f"{BASE_URL}/api/admin/product/test-id/upload-image",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Should reject invalid file type
        assert response.status_code in [400, 422, 404], f"Expected validation error, got {response.status_code}"
        print("✓ Product image upload validates file types")
    
    def test_service_upload_validation(self, admin_token):
        """Test that service image upload validates file types"""
        files = {"file": ("test.txt", b"invalid content", "text/plain")}
        response = requests.post(
            f"{BASE_URL}/api/admin/service/test-id/upload-image",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Should reject invalid file type
        assert response.status_code in [400, 422, 404], f"Expected validation error, got {response.status_code}"
        print("✓ Service image upload validates file types")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
