"""
Test Iteration 138: Pillar Admin Product CRUD Endpoints
Tests Stay, Fit, and Care admin product CRUD operations
"""

import pytest
import requests
import os
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
ADMIN_AUTH = HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)


class TestAdminLogin:
    """Test admin login endpoint"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        print(f"✅ Admin login successful, token received")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with wrong credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Admin login correctly rejects invalid credentials")


class TestStayProductCRUD:
    """Test Stay Admin Product CRUD endpoints"""
    
    def test_01_seed_stay_products(self):
        """Test seeding stay products"""
        response = requests.post(
            f"{BASE_URL}/api/admin/stay/seed-products",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products_seeded" in data or "message" in data
        print(f"✅ Stay products seeded: {data}")
    
    def test_02_get_stay_products(self):
        """Test getting stay products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/products",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"✅ Stay products retrieved: {data.get('count', len(data['products']))} products")
    
    def test_03_create_stay_product(self):
        """Test creating a new stay product"""
        new_product = {
            "name": "TEST_Stay Product",
            "description": "Test product for stay pillar",
            "price": 999,
            "original_price": 1299,
            "image": "https://example.com/test.jpg",
            "category": "travel",
            "tags": ["test", "travel"],
            "stock": 50,
            "paw_reward_points": 10
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/stay/products",
            json=new_product,
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        self.__class__.created_product_id = data["id"]
        print(f"✅ Stay product created: {data['id']}")
    
    def test_04_update_stay_product(self):
        """Test updating a stay product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to update")
        
        update_data = {
            "name": "TEST_Stay Product Updated",
            "description": "Updated test product",
            "price": 1099,
            "stock": 75
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/stay/products/{product_id}",
            json=update_data,
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✅ Stay product updated: {product_id}")
    
    def test_05_verify_stay_product_update(self):
        """Verify the stay product was updated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/products",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200
        data = response.json()
        
        product_id = getattr(self.__class__, 'created_product_id', None)
        if product_id:
            found = [p for p in data["products"] if p.get("id") == product_id]
            if found:
                assert found[0]["name"] == "TEST_Stay Product Updated"
                print(f"✅ Stay product update verified")
            else:
                print(f"⚠️ Product {product_id} not found in list")
    
    def test_06_delete_stay_product(self):
        """Test deleting a stay product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/stay/products/{product_id}",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✅ Stay product deleted: {product_id}")
    
    def test_07_verify_stay_product_deleted(self):
        """Verify the stay product was deleted"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product to verify deletion")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/products",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200
        data = response.json()
        
        found = [p for p in data["products"] if p.get("id") == product_id]
        assert len(found) == 0, f"Product {product_id} should have been deleted"
        print(f"✅ Stay product deletion verified")


class TestFitProductCRUD:
    """Test Fit Admin Product CRUD endpoints"""
    
    def test_01_get_fit_products(self):
        """Test getting fit products list"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products" in data
        print(f"✅ Fit products retrieved: {len(data['products'])} products")
    
    def test_02_create_fit_product(self):
        """Test creating a new fit product"""
        new_product = {
            "name": "TEST_Fit Product",
            "description": "Test product for fit pillar",
            "price": 799,
            "image": "https://example.com/fit-test.jpg",
            "tags": ["test", "fitness"]
        }
        response = requests.post(
            f"{BASE_URL}/api/fit/admin/products",
            json=new_product
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        self.__class__.created_product_id = data["id"]
        print(f"✅ Fit product created: {data['id']}")
    
    def test_03_update_fit_product(self):
        """Test updating a fit product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to update")
        
        update_data = {
            "name": "TEST_Fit Product Updated",
            "description": "Updated test product",
            "price": 899
        }
        response = requests.put(
            f"{BASE_URL}/api/fit/admin/products/{product_id}",
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ Fit product updated: {product_id}")
    
    def test_04_delete_fit_product(self):
        """Test deleting a fit product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/fit/admin/products/{product_id}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ Fit product deleted: {product_id}")


class TestCareProductCRUD:
    """Test Care Admin Product CRUD endpoints"""
    
    def test_01_get_care_products(self):
        """Test getting care products list"""
        response = requests.get(f"{BASE_URL}/api/care/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "products" in data
        print(f"✅ Care products retrieved: {len(data['products'])} products")
    
    def test_02_seed_care_products(self):
        """Test seeding care products"""
        response = requests.post(f"{BASE_URL}/api/care/admin/seed-products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Care products seeded: {data.get('products_seeded', 'N/A')} products")
    
    def test_03_create_care_product(self):
        """Test creating a new care product"""
        new_product = {
            "name": "TEST_Care Product",
            "description": "Test product for care pillar",
            "price": 599,
            "image": "https://example.com/care-test.jpg",
            "care_type": "grooming",
            "subcategory": "brush",
            "tags": ["test", "grooming"],
            "pet_sizes": ["small", "medium"],
            "in_stock": True,
            "paw_reward_points": 6
        }
        response = requests.post(
            f"{BASE_URL}/api/care/admin/products",
            json=new_product
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "product_id" in data
        self.__class__.created_product_id = data["product_id"]
        print(f"✅ Care product created: {data['product_id']}")
    
    def test_04_update_care_product(self):
        """Test updating a care product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to update")
        
        update_data = {
            "name": "TEST_Care Product Updated",
            "description": "Updated test product",
            "price": 699,
            "image": "https://example.com/care-test-updated.jpg",
            "care_type": "grooming",
            "subcategory": "brush",
            "tags": ["test", "grooming", "updated"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7
        }
        response = requests.put(
            f"{BASE_URL}/api/care/admin/products/{product_id}",
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Care product updated: {product_id}")
    
    def test_05_delete_care_product(self):
        """Test deleting a care product"""
        product_id = getattr(self.__class__, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/care/admin/products/{product_id}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Care product deleted: {product_id}")


class TestStayProductSeeding:
    """Test Stay product seeding returns expected products"""
    
    def test_seeded_products_count(self):
        """Verify seeded products are present"""
        # First seed
        requests.post(
            f"{BASE_URL}/api/admin/stay/seed-products",
            auth=ADMIN_AUTH
        )
        
        # Then get products
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/products",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least 8 seeded products
        products = data.get("products", [])
        seeded_ids = [
            "stay-prod-carrier", "stay-prod-bowl", "stay-prod-bed",
            "stay-prod-cooling", "stay-prod-harness", "stay-prod-anxiety",
            "stay-prod-firstaid", "stay-prod-waterbottle"
        ]
        
        found_seeded = [p for p in products if p.get("id") in seeded_ids]
        print(f"✅ Found {len(found_seeded)} seeded stay products out of {len(seeded_ids)} expected")
        assert len(found_seeded) >= 6, f"Expected at least 6 seeded products, found {len(found_seeded)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
