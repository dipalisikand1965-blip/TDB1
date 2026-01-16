"""
Test Product Features - Display Tags, Personalization Conditional, Calendar Disabled, Bundle Selectors
Tests for The Doggy Company product enhancements
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pawticket.preview.emergentagent.com')
ADMIN_AUTH = ('aditya', 'doggy2026')

# Test product IDs
CAKE_PRODUCT_ID = "shopify-8634045595802"  # Kawaii Woofy Cake
TOY_PRODUCT_ID = "shopify-8642355429530"   # Puppuccino Toy
HAMPER_PRODUCT_ID = "shopify-7222825058458"  # Dog Birthday Cake Hamper w/ Toy
PRODUCT_WITH_TAGS = "shopify-8661308375194"  # Googly Ghoul Dognuts


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
        
        print(f"✅ Tag options API returned {len(tags)} tags")
    
    def test_update_product_display_tags(self):
        """PUT /api/admin/products/{product_id}/display-tags - should update product display tags"""
        test_tags = ["best-seller", "limited"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{CAKE_PRODUCT_ID}/display-tags",
            auth=ADMIN_AUTH,
            json=test_tags
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("tags") == test_tags, f"Tags should match: expected {test_tags}, got {data.get('tags')}"
        
        # Verify tags were persisted by fetching product
        product_response = requests.get(f"{BASE_URL}/api/products/{CAKE_PRODUCT_ID}")
        assert product_response.status_code == 200
        
        product = product_response.json()
        assert product.get("display_tags") == test_tags, "Tags should be persisted on product"
        
        print(f"✅ Display tags updated successfully: {test_tags}")
    
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
        # First set some tags
        requests.put(
            f"{BASE_URL}/api/admin/products/{CAKE_PRODUCT_ID}/display-tags",
            auth=ADMIN_AUTH,
            json=["popular"]
        )
        
        # Then clear them
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{CAKE_PRODUCT_ID}/display-tags",
            auth=ADMIN_AUTH,
            json=[]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("tags") == [], "Tags should be empty"
        
        print("✅ Display tags cleared successfully")


class TestProductCategories:
    """Test product category data for personalization conditional logic"""
    
    def test_cake_product_has_correct_category(self):
        """Cake products should have category 'cakes'"""
        response = requests.get(f"{BASE_URL}/api/products/{CAKE_PRODUCT_ID}")
        assert response.status_code == 200
        
        product = response.json()
        assert product.get("category") == "cakes", f"Expected 'cakes', got {product.get('category')}"
        print(f"✅ Cake product '{product.get('name')}' has category: {product.get('category')}")
    
    def test_toy_product_has_correct_category(self):
        """Toy products should have category 'accessories'"""
        response = requests.get(f"{BASE_URL}/api/products/{TOY_PRODUCT_ID}")
        assert response.status_code == 200
        
        product = response.json()
        assert product.get("category") == "accessories", f"Expected 'accessories', got {product.get('category')}"
        print(f"✅ Toy product '{product.get('name')}' has category: {product.get('category')}")
    
    def test_hamper_product_has_correct_category(self):
        """Hamper products should have category 'hampers'"""
        response = requests.get(f"{BASE_URL}/api/products/{HAMPER_PRODUCT_ID}")
        assert response.status_code == 200
        
        product = response.json()
        assert product.get("category") == "hampers", f"Expected 'hampers', got {product.get('category')}"
        print(f"✅ Hamper product '{product.get('name')}' has category: {product.get('category')}")


class TestProductWithDisplayTags:
    """Test products with display_tags field"""
    
    def test_product_with_display_tags_returns_tags(self):
        """Products with display_tags should return them in API response"""
        response = requests.get(f"{BASE_URL}/api/products/{PRODUCT_WITH_TAGS}")
        assert response.status_code == 200
        
        product = response.json()
        display_tags = product.get("display_tags", [])
        
        assert isinstance(display_tags, list), "display_tags should be a list"
        assert len(display_tags) > 0, f"Product {PRODUCT_WITH_TAGS} should have display_tags"
        
        print(f"✅ Product '{product.get('name')}' has display_tags: {display_tags}")
    
    def test_products_list_includes_display_tags(self):
        """Products list API should include display_tags field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Find products with display_tags
        products_with_tags = [p for p in products if p.get("display_tags")]
        
        print(f"✅ Found {len(products_with_tags)} products with display_tags out of {len(products)}")


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
        print(f"✅ Accessories API returned {len(products)} products, {len(toys)} are toys")


class TestAdminProductEndpoints:
    """Test admin product management endpoints"""
    
    def test_get_admin_product_details(self):
        """GET /api/admin/products/{product_id} - should return full product details"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products/{CAKE_PRODUCT_ID}",
            auth=ADMIN_AUTH
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        product = data.get("product", {})
        
        assert product.get("id") == CAKE_PRODUCT_ID, "Product ID should match"
        assert "name" in product, "Product should have name"
        assert "category" in product, "Product should have category"
        
        print(f"✅ Admin product details returned for '{product.get('name')}'")
    
    def test_update_bundle_config(self):
        """PUT /api/admin/products/{product_id}/bundle-config - should update bundle configuration"""
        bundle_config = {
            "bundle_type": "hamper",
            "bundle_includes": {
                "cake_selection": True,
                "toy_selection": True,
                "treat_selection": False
            }
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{HAMPER_PRODUCT_ID}/bundle-config",
            auth=ADMIN_AUTH,
            json=bundle_config
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        print(f"✅ Bundle config updated successfully")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup test data after tests complete"""
    yield
    # Reset display tags on test products
    try:
        requests.put(
            f"{BASE_URL}/api/admin/products/{CAKE_PRODUCT_ID}/display-tags",
            auth=ADMIN_AUTH,
            json=[]
        )
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
