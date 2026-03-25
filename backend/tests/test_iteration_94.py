"""
Iteration 94 Tests: Admin Product Editor, Mira Memories, Celebrate Products
Tests for:
1. Admin Celebrate Products tab shows all 319+ products
2. Add Product modal displays new fields (bases, fresh_delivery_cities, life_stage, occasion, dietary)
3. Edit Product populates existing Shopify product options
4. Save Product API accepts new fields
5. Mira Memories on Pet Profile for unauthenticated users
6. Mira Memories on Pet Profile for authenticated users
7. /api/mira/memory/pet/{pet_id} endpoint
8. Mira AI chat responds to cake queries
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-mobile-parity.preview.emergentagent.com')


class TestCelebrateProducts:
    """Test Celebrate Products Admin API"""
    
    def test_get_all_products(self):
        """Test that products endpoint returns 319+ products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1000")
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        print(f"Total products: {len(products)}")
        assert len(products) >= 300, f"Expected 300+ products, got {len(products)}"
    
    def test_celebrate_admin_products(self):
        """Test celebrate admin products endpoint"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        print(f"Celebrate products: {len(products)}")
        # Should have some celebrate products
        assert isinstance(products, list)
    
    def test_create_product_with_new_fields(self):
        """Test creating a product with new fields (bases, fresh_delivery_cities, life_stage, occasion, dietary)"""
        payload = {
            "name": "TEST_Birthday Cake Iteration 94",
            "description": "Test cake for iteration 94 testing",
            "price": 599,
            "category": "cakes",
            "bases": ["Oats", "Ragi"],
            "flavors": ["Chicken", "Peanut Butter"],
            "fresh_delivery_cities": ["Bangalore", "Mumbai", "Delhi NCR"],
            "life_stage": "all-ages",
            "occasion": "birthday",
            "dietary": "grain-free"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/admin/products", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        product_id = data["id"]
        print(f"Created product: {product_id}")
        
        # Verify the product was created with new fields
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products")
        assert response.status_code == 200
        products = response.json().get('products', [])
        
        created_product = None
        for p in products:
            if p.get('id') == product_id:
                created_product = p
                break
        
        assert created_product is not None, "Created product not found"
        assert created_product.get('bases') == ["Oats", "Ragi"]
        assert created_product.get('fresh_delivery_cities') == ["Bangalore", "Mumbai", "Delhi NCR"]
        assert created_product.get('life_stage') == "all-ages"
        assert created_product.get('occasion') == "birthday"
        assert created_product.get('dietary') == "grain-free"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/celebrate/admin/products/{product_id}")
    
    def test_update_product_with_new_fields(self):
        """Test updating a product with new fields"""
        # First create a product
        create_payload = {
            "name": "TEST_Update Product Iteration 94",
            "description": "Test product for update testing",
            "price": 499,
            "category": "cakes"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/admin/products", json=create_payload)
        assert response.status_code == 200
        product_id = response.json()["id"]
        
        # Update with new fields
        update_payload = {
            "name": "TEST_Update Product Iteration 94 Updated",
            "description": "Updated test product",
            "price": 699,
            "category": "cakes",
            "bases": ["Wheat", "Oats"],
            "flavors": ["Banana", "Chicken"],
            "fresh_delivery_cities": ["Pune", "Hyderabad"],
            "life_stage": "adult",
            "occasion": "gotcha-day",
            "dietary": "low-fat"
        }
        
        response = requests.put(f"{BASE_URL}/api/celebrate/admin/products/{product_id}", json=update_payload)
        assert response.status_code == 200
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products")
        products = response.json().get('products', [])
        
        updated_product = None
        for p in products:
            if p.get('id') == product_id:
                updated_product = p
                break
        
        assert updated_product is not None
        assert updated_product.get('price') == 699
        assert updated_product.get('bases') == ["Wheat", "Oats"]
        assert updated_product.get('life_stage') == "adult"
        assert updated_product.get('occasion') == "gotcha-day"
        assert updated_product.get('dietary') == "low-fat"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/celebrate/admin/products/{product_id}")
    
    def test_product_with_shopify_options(self):
        """Test that products with Shopify options have flavours extracted"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        products = response.json().get('products', [])
        
        # Find a product with options
        product_with_options = None
        for p in products:
            if p.get('options') and len(p.get('options', [])) > 0:
                product_with_options = p
                break
        
        if product_with_options:
            print(f"Product with options: {product_with_options.get('name')}")
            print(f"Options: {product_with_options.get('options')}")
            assert 'options' in product_with_options
            assert isinstance(product_with_options['options'], list)


class TestMiraMemories:
    """Test Mira Memories API"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Member authentication failed")
    
    def test_mira_memory_unauthenticated(self):
        """Test that Mira memory endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/mira/memory/pet/pet-99a708f1722a")
        assert response.status_code == 401
        data = response.json()
        assert "Authentication required" in data.get("detail", "")
    
    def test_mira_memory_authenticated(self, member_token):
        """Test Mira memory endpoint with authentication"""
        headers = {"Authorization": f"Bearer {member_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/pet-99a708f1722a",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "total_memories" in data
        assert "by_type" in data
        
        print(f"Pet: {data.get('pet_name')}")
        print(f"Total memories: {data.get('total_memories')}")
        
        # Check memory types
        by_type = data.get('by_type', {})
        for memory_type, type_data in by_type.items():
            print(f"  {memory_type}: {type_data.get('count', 0)} memories")
            assert "name" in type_data
            assert "memories" in type_data
            assert "count" in type_data
    
    def test_mira_memory_grouped_by_type(self, member_token):
        """Test that memories are grouped by type (Events, Health, Shopping, General)"""
        headers = {"Authorization": f"Bearer {member_token}"}
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/pet-99a708f1722a",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        by_type = data.get('by_type', {})
        
        # Check expected memory types exist
        expected_types = ['event', 'health', 'shopping', 'general']
        for expected_type in expected_types:
            if expected_type in by_type:
                type_data = by_type[expected_type]
                assert 'name' in type_data
                assert 'memories' in type_data
                print(f"Found {expected_type} type with {type_data.get('count', 0)} memories")


class TestMiraAIChat:
    """Test Mira AI Chat about cakes"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Member authentication failed")
    
    def test_mira_chat_about_cakes(self, member_token):
        """Test that Mira AI responds to cake queries"""
        headers = {
            "Authorization": f"Bearer {member_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "message": "What birthday cakes do you have for dogs?",
            "pet_id": "pet-99a708f1722a"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "response" in data
        assert "session_id" in data
        
        # Check that response mentions cakes or celebrate
        response_text = data.get("response", "").lower()
        print(f"Mira response: {data.get('response')[:200]}...")
        
        # Response should be relevant to cakes/celebrate
        assert any(word in response_text for word in ['cake', 'birthday', 'celebrate', 'treat', 'dog']), \
            "Response should be relevant to cake query"


class TestCelebrateStats:
    """Test Celebrate Stats API"""
    
    def test_celebrate_stats(self):
        """Test celebrate stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/celebrate/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check stats structure
        assert "total_products" in data
        assert "total_bundles" in data
        assert "total_partners" in data
        
        print(f"Celebrate stats: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
