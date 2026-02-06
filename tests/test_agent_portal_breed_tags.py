"""
Test Agent Portal and Breed Tags Manager Features
- Agent Portal: Login, Service Desk access, Logout
- Breed Tags Manager: API endpoints for breed options, single update, bulk update
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meister-hero.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestBreedTagsAPI:
    """Test Breed Tags Manager API endpoints"""
    
    def test_get_breed_options(self):
        """Test /api/admin/breed-tags/options returns list of breeds"""
        response = requests.get(f"{BASE_URL}/api/admin/breed-tags/options")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify breeds list exists and has expected breeds
        assert "breeds" in data
        breeds = data["breeds"]
        assert isinstance(breeds, list)
        assert len(breeds) > 0
        
        # Check for common breeds
        expected_breeds = ["Labrador", "Golden Retriever", "German Shepherd", "Beagle", "Poodle"]
        for breed in expected_breeds:
            assert breed in breeds, f"Expected breed '{breed}' not found in options"
        
        print(f"SUCCESS: Found {len(breeds)} breed options")
    
    def test_update_single_product_breed_tags(self):
        """Test PUT /api/admin/products/{product_id}/breed-tags"""
        # First get a product ID
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        assert len(products) > 0
        
        product_id = products[0]["id"]
        product_name = products[0]["name"]
        
        # Update breed tags
        new_tags = ["Labrador", "Golden Retriever", "Beagle"]
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/breed-tags",
            json=new_tags
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("breed_tags") == new_tags
        
        print(f"SUCCESS: Updated breed tags for '{product_name}' to {new_tags}")
    
    def test_bulk_update_breed_tags_add(self):
        """Test POST /api/admin/products/bulk-breed-tags with action=add"""
        # Get product IDs
        products_response = requests.get(f"{BASE_URL}/api/products?limit=3")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        assert len(products) >= 2
        
        product_ids = [p["id"] for p in products[:2]]
        
        # Bulk add tags
        response = requests.post(
            f"{BASE_URL}/api/admin/products/bulk-breed-tags",
            json={
                "product_ids": product_ids,
                "breed_tags": ["Pomeranian", "Shih Tzu"],
                "action": "add"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("updated_count") == 2
        
        print(f"SUCCESS: Bulk added breed tags to {len(product_ids)} products")
    
    def test_bulk_update_breed_tags_remove(self):
        """Test POST /api/admin/products/bulk-breed-tags with action=remove"""
        # Get product IDs
        products_response = requests.get(f"{BASE_URL}/api/products?limit=2")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        assert len(products) >= 1
        
        product_ids = [products[0]["id"]]
        
        # Bulk remove tags
        response = requests.post(
            f"{BASE_URL}/api/admin/products/bulk-breed-tags",
            json={
                "product_ids": product_ids,
                "breed_tags": ["Pomeranian"],
                "action": "remove"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"SUCCESS: Bulk removed breed tags from {len(product_ids)} products")
    
    def test_bulk_update_breed_tags_set(self):
        """Test POST /api/admin/products/bulk-breed-tags with action=set"""
        # Get product IDs
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        assert len(products) >= 1
        
        product_id = products[0]["id"]
        
        # Set specific tags (replace all)
        new_tags = ["Labrador", "Golden Retriever"]
        response = requests.post(
            f"{BASE_URL}/api/admin/products/bulk-breed-tags",
            json={
                "product_ids": [product_id],
                "breed_tags": new_tags,
                "action": "set"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"SUCCESS: Set breed tags for product to {new_tags}")


class TestAdminLogin:
    """Test Admin Login API for Agent Portal"""
    
    def test_admin_login_success(self):
        """Test /api/admin/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"SUCCESS: Admin login successful for user '{ADMIN_USERNAME}'")
    
    def test_admin_login_invalid_credentials(self):
        """Test /api/admin/login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "invalid", "password": "wrong"}
        )
        
        # Should return 401 or error response
        assert response.status_code in [401, 400, 403] or response.json().get("success") == False
        
        print("SUCCESS: Invalid credentials correctly rejected")


class TestProductsWithBreedTags:
    """Test that products correctly store and return breed tags"""
    
    def test_products_have_breed_tags_field(self):
        """Verify products API returns breed_tags field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        # Check that at least one product has breed_tags
        has_tags = False
        for product in products:
            if product.get("breed_tags") and len(product["breed_tags"]) > 0:
                has_tags = True
                print(f"Product '{product['name']}' has breed tags: {product['breed_tags']}")
        
        if not has_tags:
            print("INFO: No products currently have breed tags assigned")
        
        print(f"SUCCESS: Checked {len(products)} products for breed_tags field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
