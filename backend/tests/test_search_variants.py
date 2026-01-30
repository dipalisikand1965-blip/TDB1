"""
Test Search and Product Variants functionality
Tests for: Search API, Typeahead API, Product Detail with Options
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://furryhealth-app.preview.emergentagent.com').rstrip('/')


class TestSearchAPI:
    """Test search functionality for breed names and products"""
    
    def test_search_pug_returns_products(self):
        """Search for 'pug' should return Pug products from unified_products"""
        response = requests.get(f"{BASE_URL}/api/search?q=pug")
        assert response.status_code == 200
        
        data = response.json()
        assert "hits" in data or "products" in data
        
        products = data.get("hits") or data.get("products", [])
        assert len(products) > 0, "Search for 'pug' should return at least one product"
        
        # Verify at least one product has 'pug' in the name
        pug_products = [p for p in products if 'pug' in p.get('name', '').lower()]
        assert len(pug_products) > 0, "At least one product should have 'pug' in the name"
        print(f"✅ Found {len(pug_products)} Pug products")
    
    def test_search_beagle_returns_products(self):
        """Search for 'beagle' should return Beagle products"""
        response = requests.get(f"{BASE_URL}/api/search?q=beagle")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("hits") or data.get("products", [])
        assert len(products) > 0, "Search for 'beagle' should return at least one product"
        
        beagle_products = [p for p in products if 'beagle' in p.get('name', '').lower()]
        assert len(beagle_products) > 0, "At least one product should have 'beagle' in the name"
        print(f"✅ Found {len(beagle_products)} Beagle products")
    
    def test_search_shih_tzu_returns_products(self):
        """Search for 'shih tzu' should return Shih Tzu products"""
        response = requests.get(f"{BASE_URL}/api/search?q=shih%20tzu")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("hits") or data.get("products", [])
        assert len(products) > 0, "Search for 'shih tzu' should return at least one product"
        
        shih_tzu_products = [p for p in products if 'shih' in p.get('name', '').lower()]
        assert len(shih_tzu_products) > 0, "At least one product should have 'shih' in the name"
        print(f"✅ Found {len(shih_tzu_products)} Shih Tzu products")
    
    def test_search_returns_product_with_options(self):
        """Search should return products with options/variants data"""
        response = requests.get(f"{BASE_URL}/api/search?q=pug")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("hits") or data.get("products", [])
        
        # Find a product with options
        products_with_options = [p for p in products if p.get('options') and len(p.get('options', [])) > 0]
        assert len(products_with_options) > 0, "At least one product should have options"
        
        product = products_with_options[0]
        assert "options" in product
        assert len(product["options"]) > 0
        print(f"✅ Product '{product.get('name')}' has {len(product['options'])} options")


class TestTypeaheadAPI:
    """Test typeahead/autocomplete search functionality"""
    
    def test_typeahead_pug_returns_suggestions(self):
        """Typeahead for 'pug' should return product suggestions with images"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=pug")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        
        products = data["products"]
        assert len(products) > 0, "Typeahead for 'pug' should return at least one product"
        
        # Verify products have required fields
        for product in products:
            assert "id" in product, "Product should have 'id' field"
            assert "name" in product, "Product should have 'name' field"
        
        # Check if at least one product has an image
        products_with_images = [p for p in products if p.get('image') or p.get('image_url')]
        assert len(products_with_images) > 0, "At least one product should have an image"
        print(f"✅ Typeahead returned {len(products)} products, {len(products_with_images)} with images")
    
    def test_typeahead_returns_price(self):
        """Typeahead should return products with price information"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=pug")
        assert response.status_code == 200
        
        data = response.json()
        products = data["products"]
        
        # Check if products have price
        products_with_price = [p for p in products if p.get('price') or p.get('pricing')]
        assert len(products_with_price) > 0, "At least one product should have price"
        print(f"✅ {len(products_with_price)} products have price information")
    
    def test_typeahead_minimum_query_length(self):
        """Typeahead should require minimum 2 characters"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=p")
        # Should return 422 (validation error) for query less than 2 chars
        assert response.status_code == 422
        print("✅ Typeahead correctly rejects queries less than 2 characters")


class TestProductDetailWithOptions:
    """Test product detail API returns options and variants"""
    
    def test_pug_cake_has_options(self):
        """Pug cake product should have Base and Flavour options"""
        response = requests.get(f"{BASE_URL}/api/products/shopify-6622536827034")
        assert response.status_code == 200
        
        data = response.json()
        product = data.get("product") or data
        
        assert "options" in product, "Product should have 'options' field"
        options = product["options"]
        assert len(options) >= 2, "Pug cake should have at least 2 options (Base and Flavour)"
        
        # Verify Base option
        base_option = next((o for o in options if o.get('name') == 'Base'), None)
        assert base_option is not None, "Product should have 'Base' option"
        assert 'Oats' in base_option.get('values', []), "Base option should include 'Oats'"
        assert 'Ragi' in base_option.get('values', []), "Base option should include 'Ragi'"
        
        # Verify Flavour option
        flavour_option = next((o for o in options if o.get('name') == 'Flavour'), None)
        assert flavour_option is not None, "Product should have 'Flavour' option"
        assert len(flavour_option.get('values', [])) >= 8, "Flavour option should have at least 8 values"
        
        print(f"✅ Product has {len(options)} options: {[o.get('name') for o in options]}")
    
    def test_pug_cake_has_variants(self):
        """Pug cake product should have multiple variants"""
        response = requests.get(f"{BASE_URL}/api/products/shopify-6622536827034")
        assert response.status_code == 200
        
        data = response.json()
        product = data.get("product") or data
        
        assert "variants" in product, "Product should have 'variants' field"
        variants = product["variants"]
        assert len(variants) >= 16, "Pug cake should have at least 16 variants (2 bases x 8 flavours)"
        
        # Verify variant structure
        first_variant = variants[0]
        assert "id" in first_variant, "Variant should have 'id'"
        assert "title" in first_variant, "Variant should have 'title'"
        assert "price" in first_variant, "Variant should have 'price'"
        assert "option1" in first_variant, "Variant should have 'option1' (Base)"
        assert "option2" in first_variant, "Variant should have 'option2' (Flavour)"
        
        print(f"✅ Product has {len(variants)} variants")
    
    def test_variant_prices_vary(self):
        """Different variants should have different prices (e.g., Mutton is more expensive)"""
        response = requests.get(f"{BASE_URL}/api/products/shopify-6622536827034")
        assert response.status_code == 200
        
        data = response.json()
        product = data.get("product") or data
        variants = product.get("variants", [])
        
        # Get unique prices
        prices = set(v.get('price') for v in variants if v.get('price'))
        assert len(prices) > 1, "Variants should have different prices"
        
        # Verify Mutton variant is more expensive
        mutton_variants = [v for v in variants if 'Mutton' in v.get('title', '')]
        chicken_variants = [v for v in variants if 'Chicken' in v.get('title', '') and 'Liver' not in v.get('title', '')]
        
        if mutton_variants and chicken_variants:
            mutton_price = mutton_variants[0].get('price', 0)
            chicken_price = chicken_variants[0].get('price', 0)
            assert mutton_price > chicken_price, "Mutton variant should be more expensive than Chicken"
            print(f"✅ Mutton (₹{mutton_price}) is more expensive than Chicken (₹{chicken_price})")


class TestProductsEndpoint:
    """Test products listing endpoint"""
    
    def test_products_list_includes_variants_info(self):
        """Products list should include has_variants or variants info"""
        response = requests.get(f"{BASE_URL}/api/products?limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        assert len(products) > 0, "Should return at least one product"
        
        # Check if products have variant-related fields
        products_with_variants = [p for p in products if p.get('has_variants') or p.get('variants') or p.get('options')]
        print(f"✅ {len(products_with_variants)} out of {len(products)} products have variant info")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
