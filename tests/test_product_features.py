"""
Test Product Features - Display Tags, Personalization Conditional, Calendar Disabled, Bundle Selectors
Tests for The Doggy Company product enhancements
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petsoultech.preview.emergentagent.com')
ADMIN_AUTH = ('aditya', 'doggy2026')


def get_product_by_id(product_id):
    """Helper to get a product by ID from the products list"""
    response = requests.get(f"{BASE_URL}/api/products?limit=200")
    if response.status_code != 200:
        return None
    products = response.json().get("products", [])
    for p in products:
        if p.get("id") == product_id:
            return p
    return None


def get_product_by_category(category, limit=5):
    """Helper to get products by category"""
    response = requests.get(f"{BASE_URL}/api/products?category={category}&limit={limit}")
    if response.status_code != 200:
        return []
    return response.json().get("products", [])


class TestDisplayTagsAPI:
    """Test admin display tags API endpoints"""
    
    def test_get_tag_options(self):
        """GET /api/admin/products/tag-options - should return list of display tag options"""
        response = requests.get(f"{BASE_URL}/api/admin/products/tag-options", auth=ADMIN_AUTH)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tags" in data, "Response should contain 'tags' key"
        
        tags = data["tags"]
        assert len(tags) > 0, "Should have at least one tag option"
        
        # Verify tag structure
        first_tag = tags[0]
        assert "id" in first_tag, "Tag should have 'id'"
        assert "label" in first_tag, "Tag should have 'label'"
        assert "color" in first_tag, "Tag should have 'color'"
        
        # Verify expected tags exist
        tag_ids = [t["id"] for t in tags]
        expected_tags = ["best-seller", "limited", "selling-fast", "discount", "new-arrival", "staff-pick", "popular"]
        for expected in expected_tags:
            assert expected in tag_ids, f"Expected tag '{expected}' not found"
        
        print(f"✅ Tag options API returned {len(tags)} tags: {tag_ids}")
    
    def test_update_product_display_tags(self):
        """PUT /api/admin/products/{product_id}/display-tags - should update product display tags"""
        # Get a cake product first
        cakes = get_product_by_category("cakes", 1)
        assert len(cakes) > 0, "Should have at least one cake product"
        
        product_id = cakes[0]["id"]
        test_tags = ["best-seller", "limited"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/display-tags",
            auth=ADMIN_AUTH,
            json=test_tags
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("tags") == test_tags, f"Tags should match: expected {test_tags}, got {data.get('tags')}"
        
        # Verify tags were persisted by fetching product from list
        product = get_product_by_id(product_id)
        assert product is not None, f"Product {product_id} should exist"
        assert product.get("display_tags") == test_tags, f"Tags should be persisted: expected {test_tags}, got {product.get('display_tags')}"
        
        print(f"✅ Display tags updated successfully on '{product.get('name')}': {test_tags}")
        
        # Cleanup - clear tags
        requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/display-tags",
            auth=ADMIN_AUTH,
            json=[]
        )
    
    def test_update_display_tags_nonexistent_product(self):
        """PUT /api/admin/products/{product_id}/display-tags - should return 404 for nonexistent product"""
        response = requests.put(
            f"{BASE_URL}/api/admin/products/nonexistent-product-id/display-tags",
            auth=ADMIN_AUTH,
            json=["best-seller"]
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Correctly returns 404 for nonexistent product")
    
    def test_clear_display_tags(self):
        """PUT /api/admin/products/{product_id}/display-tags - should allow clearing tags"""
        # Get a cake product
        cakes = get_product_by_category("cakes", 1)
        assert len(cakes) > 0, "Should have at least one cake product"
        
        product_id = cakes[0]["id"]
        
        # First set some tags
        requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/display-tags",
            auth=ADMIN_AUTH,
            json=["popular"]
        )
        
        # Then clear them
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/display-tags",
            auth=ADMIN_AUTH,
            json=[]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("tags") == [], "Tags should be empty"
        
        print("✅ Display tags cleared successfully")


class TestProductCategories:
    """Test product category data for personalization conditional logic"""
    
    def test_cake_products_have_correct_category(self):
        """Cake products should have category 'cakes'"""
        cakes = get_product_by_category("cakes", 5)
        assert len(cakes) > 0, "Should have cake products"
        
        for cake in cakes:
            assert cake.get("category") == "cakes", f"Product '{cake.get('name')}' should have category 'cakes', got '{cake.get('category')}'"
        
        print(f"✅ {len(cakes)} cake products have correct category 'cakes'")
    
    def test_toy_products_have_correct_category(self):
        """Toy products should have category 'accessories'"""
        accessories = get_product_by_category("accessories", 10)
        assert len(accessories) > 0, "Should have accessory products"
        
        # Find toys specifically
        toys = [p for p in accessories if "toy" in p.get("name", "").lower() or "squeaky" in p.get("name", "").lower()]
        assert len(toys) > 0, "Should have toy products in accessories"
        
        for toy in toys:
            assert toy.get("category") == "accessories", f"Toy '{toy.get('name')}' should have category 'accessories'"
        
        print(f"✅ Found {len(toys)} toy products with category 'accessories'")
    
    def test_hamper_products_have_correct_category(self):
        """Hamper products should have category 'hampers'"""
        hampers = get_product_by_category("hampers", 5)
        assert len(hampers) > 0, "Should have hamper products"
        
        for hamper in hampers:
            assert hamper.get("category") == "hampers", f"Product '{hamper.get('name')}' should have category 'hampers'"
        
        print(f"✅ {len(hampers)} hamper products have correct category 'hampers'")


class TestProductWithDisplayTags:
    """Test products with display_tags field"""
    
    def test_products_list_includes_display_tags(self):
        """Products list API should include display_tags field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Find products with display_tags
        products_with_tags = [p for p in products if p.get("display_tags")]
        
        assert len(products_with_tags) > 0, "Should have at least one product with display_tags"
        
        # Verify structure
        for p in products_with_tags:
            assert isinstance(p.get("display_tags"), list), f"display_tags should be a list for '{p.get('name')}'"
        
        print(f"✅ Found {len(products_with_tags)} products with display_tags out of {len(products)}")
        for p in products_with_tags[:3]:
            print(f"   - {p.get('name')}: {p.get('display_tags')}")


class TestBundleProductsAPI:
    """Test bundle/hamper product API for cake and toy selection"""
    
    def test_cakes_api_for_bundle_selection(self):
        """GET /api/products?category=cakes - should return cakes for bundle selection"""
        response = requests.get(f"{BASE_URL}/api/products?category=cakes&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        assert len(products) > 0, "Should have cake products for bundle selection"
        
        # Verify all are cakes
        for p in products[:5]:
            assert p.get("category") == "cakes", f"Product {p.get('name')} should be a cake"
        
        print(f"✅ Cakes API returned {len(products)} products for bundle selection")
    
    def test_accessories_api_for_toy_selection(self):
        """GET /api/products?category=accessories - should return toys for bundle selection"""
        response = requests.get(f"{BASE_URL}/api/products?category=accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        assert len(products) > 0, "Should have accessory products for bundle selection"
        
        # Check for toys
        toys = [p for p in products if "toy" in p.get("name", "").lower() or "squeaky" in p.get("name", "").lower()]
        assert len(toys) > 0, "Should have toy products in accessories"
        
        print(f"✅ Accessories API returned {len(products)} products, {len(toys)} are toys")


class TestAdminProductEndpoints:
    """Test admin product management endpoints"""
    
    def test_get_admin_product_details(self):
        """GET /api/admin/products/{product_id} - should return full product details"""
        # Get a product ID first
        cakes = get_product_by_category("cakes", 1)
        assert len(cakes) > 0, "Should have at least one cake"
        
        product_id = cakes[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/products/{product_id}",
            auth=ADMIN_AUTH
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        product = data.get("product", {})
        
        assert product.get("id") == product_id, "Product ID should match"
        assert "name" in product, "Product should have name"
        assert "category" in product, "Product should have category"
        
        print(f"✅ Admin product details returned for '{product.get('name')}'")
    
    def test_update_bundle_config(self):
        """PUT /api/admin/products/{product_id}/bundle-config - should update bundle configuration"""
        # Get a hamper product
        hampers = get_product_by_category("hampers", 1)
        assert len(hampers) > 0, "Should have at least one hamper"
        
        product_id = hampers[0]["id"]
        
        bundle_config = {
            "bundle_type": "hamper",
            "bundle_includes": {
                "cake_selection": True,
                "toy_selection": True,
                "treat_selection": False
            }
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}/bundle-config",
            auth=ADMIN_AUTH,
            json=bundle_config
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        print(f"✅ Bundle config updated successfully for '{hampers[0].get('name')}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
