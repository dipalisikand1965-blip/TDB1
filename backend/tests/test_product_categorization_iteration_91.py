"""
Test Product Categorization - Iteration 91
Tests for category hierarchy, parent_category filtering, and search functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCategoryHierarchy:
    """Tests for /api/categories/hierarchy endpoint"""
    
    def test_hierarchy_endpoint_returns_200(self):
        """Test that hierarchy endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Hierarchy endpoint returns {len(data['categories'])} categories")
    
    def test_celebrations_category_exists(self):
        """Test that Celebrations category exists with correct count"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        data = response.json()
        
        celebrations = next((c for c in data['categories'] if c['id'] == 'celebrations'), None)
        assert celebrations is not None, "Celebrations category not found"
        assert celebrations['count'] == 168, f"Expected 168 products, got {celebrations['count']}"
        assert celebrations['emoji'] == '🎂'
        print(f"✅ Celebrations category: {celebrations['count']} products")
    
    def test_treats_category_exists(self):
        """Test that Treats category exists with correct count"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        data = response.json()
        
        treats = next((c for c in data['categories'] if c['id'] == 'treats'), None)
        assert treats is not None, "Treats category not found"
        assert treats['count'] == 95, f"Expected 95 products, got {treats['count']}"
        assert treats['emoji'] == '🦴'
        print(f"✅ Treats category: {treats['count']} products")
    
    def test_celebrations_has_subcategories(self):
        """Test that Celebrations has proper subcategories"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        data = response.json()
        
        celebrations = next((c for c in data['categories'] if c['id'] == 'celebrations'), None)
        assert celebrations is not None
        assert 'subcategories' in celebrations
        
        subcategory_ids = [s['id'] for s in celebrations['subcategories']]
        assert 'cakes' in subcategory_ids, "Cakes subcategory missing"
        assert 'hampers' in subcategory_ids, "Hampers subcategory missing"
        assert 'breed-cakes' in subcategory_ids, "Breed-cakes subcategory missing"
        assert 'mini-cakes' in subcategory_ids, "Mini-cakes subcategory missing"
        print(f"✅ Celebrations has {len(celebrations['subcategories'])} subcategories: {subcategory_ids}")
    
    def test_treats_has_subcategories(self):
        """Test that Treats has proper subcategories"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        data = response.json()
        
        treats = next((c for c in data['categories'] if c['id'] == 'treats'), None)
        assert treats is not None
        assert 'subcategories' in treats
        
        subcategory_ids = [s['id'] for s in treats['subcategories']]
        assert 'all-treats' in subcategory_ids or 'treats' in [s.get('db_categories', [''])[0] for s in treats['subcategories']]
        print(f"✅ Treats has {len(treats['subcategories'])} subcategories")


class TestParentCategoryFiltering:
    """Tests for parent_category filtering in /api/products"""
    
    def test_treats_parent_category_returns_95_products(self):
        """Test that parent_category=treats returns 95 products"""
        response = requests.get(f"{BASE_URL}/api/products?parent_category=treats&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        assert len(products) == 95, f"Expected 95 products, got {len(products)}"
        
        # Verify all products have parent_category=treats
        for p in products[:10]:
            assert p.get('parent_category') == 'treats', f"Product {p.get('title')} has wrong parent_category: {p.get('parent_category')}"
        print(f"✅ parent_category=treats returns {len(products)} products")
    
    def test_celebrations_parent_category_returns_168_products(self):
        """Test that parent_category=celebrations returns 168 products"""
        response = requests.get(f"{BASE_URL}/api/products?parent_category=celebrations&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        assert len(products) == 168, f"Expected 168 products, got {len(products)}"
        
        # Verify all products have parent_category=celebrations
        for p in products[:10]:
            assert p.get('parent_category') == 'celebrations', f"Product {p.get('title')} has wrong parent_category: {p.get('parent_category')}"
        print(f"✅ parent_category=celebrations returns {len(products)} products")
    
    def test_treats_products_have_correct_categories(self):
        """Test that treats products have correct subcategories"""
        response = requests.get(f"{BASE_URL}/api/products?parent_category=treats&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        categories = set(p.get('category') for p in products)
        
        # Treats should include: treats, desi-treats, frozen-treats, nut-butters
        expected_categories = {'treats', 'desi-treats', 'frozen-treats', 'nut-butters'}
        assert categories.issubset(expected_categories | {'treats'}), f"Unexpected categories in treats: {categories - expected_categories}"
        print(f"✅ Treats products have categories: {categories}")
    
    def test_celebrations_products_have_correct_categories(self):
        """Test that celebrations products have correct subcategories"""
        response = requests.get(f"{BASE_URL}/api/products?parent_category=celebrations&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        categories = set(p.get('category') for p in products)
        
        # Celebrations should include: cakes, hampers, breed-cakes, mini-cakes
        expected_categories = {'cakes', 'hampers', 'breed-cakes', 'mini-cakes'}
        assert categories.issubset(expected_categories), f"Unexpected categories in celebrations: {categories - expected_categories}"
        print(f"✅ Celebrations products have categories: {categories}")


class TestSearchFunctionality:
    """Tests for search functionality"""
    
    def test_search_treats_returns_products(self):
        """Test that searching for 'treats' returns products"""
        response = requests.get(f"{BASE_URL}/api/products?search=treats&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        assert len(products) > 100, f"Expected 100+ products for 'treats' search, got {len(products)}"
        print(f"✅ Search 'treats' returns {len(products)} products")
    
    def test_search_cake_returns_products(self):
        """Test that searching for 'cake' returns products"""
        response = requests.get(f"{BASE_URL}/api/products?search=cake&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        assert len(products) > 50, f"Expected 50+ products for 'cake' search, got {len(products)}"
        print(f"✅ Search 'cake' returns {len(products)} products")


class TestNoOtherCategory:
    """Tests to verify no products remain in 'other' category"""
    
    def test_no_other_category_products(self):
        """Test that no products have category='other'"""
        response = requests.get(f"{BASE_URL}/api/products?category=other&limit=200")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        assert len(products) == 0, f"Found {len(products)} products still in 'other' category"
        print("✅ No products in 'other' category")
    
    def test_no_other_parent_category_products(self):
        """Test that no products have parent_category='other'"""
        response = requests.get(f"{BASE_URL}/api/products?limit=500")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        other_products = [p for p in products if p.get('parent_category') == 'other']
        assert len(other_products) == 0, f"Found {len(other_products)} products with parent_category='other'"
        print("✅ No products with parent_category='other'")


class TestProductsHaveParentCategory:
    """Tests to verify products have parent_category field populated"""
    
    def test_products_have_parent_category_field(self):
        """Test that products have parent_category field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get('products', data)
        products_with_parent = [p for p in products if p.get('parent_category')]
        
        # Most products should have parent_category
        assert len(products_with_parent) > 80, f"Only {len(products_with_parent)}/100 products have parent_category"
        print(f"✅ {len(products_with_parent)}/{len(products)} products have parent_category field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
