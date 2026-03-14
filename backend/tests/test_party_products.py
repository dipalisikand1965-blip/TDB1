"""
Party Products API Tests
========================
Tests for AI-generated party products with Cloudinary images.
Categories: party_accessories, party_kits, celebration_addons
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPartyProductsAPI:
    """Tests for party products API endpoints"""
    
    def test_party_accessories_returns_products(self):
        """Test /api/products?category=party_accessories returns products"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get('products', [])
        
        # Verify products exist
        assert len(products) > 0, "party_accessories should return products"
        print(f"party_accessories: {len(products)} products returned")
        
    def test_party_accessories_has_ai_generated_products(self):
        """Test party_accessories has AI-generated products with Cloudinary images"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        # Check for AI-generated products
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        assert len(ai_products) > 0, "Should have AI-generated products"
        
        # Check for Cloudinary images
        cloudinary_products = [p for p in products if 'cloudinary' in str(p.get('image_url', ''))]
        assert len(cloudinary_products) > 0, "Should have products with Cloudinary images"
        
        print(f"AI-generated: {len(ai_products)}, Cloudinary images: {len(cloudinary_products)}")
        
    def test_party_accessories_ai_products_first(self):
        """Test AI-generated products appear first in results (sorted by ai_image_generated)"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        if len(products) < 2:
            pytest.skip("Not enough products to verify sorting")
        
        # First product should have ai_image_generated=True if any exist
        ai_products_count = sum(1 for p in products if p.get('ai_image_generated'))
        if ai_products_count > 0:
            # First products should be AI-generated
            first_product = products[0]
            assert first_product.get('ai_image_generated') == True, \
                f"First product should be AI-generated, got: {first_product.get('name')}"
            print(f"First product is AI-generated: {first_product.get('name')}")
            
    def test_party_accessories_source_tracking(self):
        """Test AI products have correct source='party_accessory_generator'"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        # AI-generated products should have source='party_accessory_generator'
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        for p in ai_products:
            assert p.get('source') == 'party_accessory_generator', \
                f"AI product {p.get('name')} should have source='party_accessory_generator', got: {p.get('source')}"
        
        print(f"All {len(ai_products)} AI products have correct source")

    def test_party_kits_returns_products(self):
        """Test /api/products?category=party_kits returns products"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_kits&limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get('products', [])
        
        assert len(products) > 0, "party_kits should return products"
        print(f"party_kits: {len(products)} products returned")
        
    def test_party_kits_has_ai_generated_products(self):
        """Test party_kits has AI-generated products"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_kits&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        assert len(ai_products) > 0, "party_kits should have AI-generated products"
        
        # Verify Cloudinary images
        for p in ai_products:
            image_url = p.get('image_url', '')
            assert 'cloudinary' in image_url, f"AI product should have Cloudinary image: {p.get('name')}"
        
        print(f"party_kits AI products: {len(ai_products)}")
        
    def test_celebration_addons_returns_products(self):
        """Test /api/products?category=celebration_addons returns products"""
        response = requests.get(f"{BASE_URL}/api/products?category=celebration_addons&limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get('products', [])
        
        assert len(products) > 0, "celebration_addons should return products"
        print(f"celebration_addons: {len(products)} products returned")
        
    def test_celebration_addons_has_ai_generated_products(self):
        """Test celebration_addons has AI-generated products"""
        response = requests.get(f"{BASE_URL}/api/products?category=celebration_addons&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        assert len(ai_products) > 0, "celebration_addons should have AI-generated products"
        
        print(f"celebration_addons AI products: {len(ai_products)}")


class TestPartyProductsDataIntegrity:
    """Tests for data integrity of party products"""
    
    def test_ai_products_have_required_fields(self):
        """Test AI-generated products have all required fields"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        
        required_fields = ['name', 'price', 'category', 'image_url']
        for p in ai_products:
            for field in required_fields:
                assert p.get(field), f"AI product missing required field '{field}': {p.get('name')}"
                
        print(f"All {len(ai_products)} AI products have required fields")
        
    def test_ai_products_in_products_master_collection(self):
        """Test products are stored in products_master collection (via API response)"""
        # This test verifies API is returning from products_master by checking
        # the source field and AI image properties
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        # Check that products have the expected structure from products_master
        ai_products = [p for p in products if p.get('source') == 'party_accessory_generator']
        assert len(ai_products) > 0, "Should have products from party_accessory_generator in products_master"
        
        for p in ai_products:
            # These fields are set by the generator script
            assert 'is_party_item' in p or p.get('category') in ['party_accessories', 'party_kits', 'celebration_addons'], \
                f"Product should be marked as party item: {p.get('name')}"
                
        print(f"Verified {len(ai_products)} products from products_master collection")


class TestAllPartyCategoriesCombined:
    """Tests for combined party products query (as used by frontend modal)"""
    
    def test_total_party_products_count(self):
        """Test total party products across all categories"""
        total_products = 0
        ai_products_total = 0
        
        for category in ['party_accessories', 'party_kits', 'celebration_addons']:
            response = requests.get(f"{BASE_URL}/api/products?category={category}&limit=50")
            assert response.status_code == 200
            
            data = response.json()
            products = data.get('products', [])
            total_products += len(products)
            ai_products_total += sum(1 for p in products if p.get('ai_image_generated'))
        
        print(f"Total party products: {total_products}")
        print(f"Total AI-generated: {ai_products_total}")
        
        # Should have at least 15 AI-generated products (as per agent note)
        assert ai_products_total >= 15, f"Expected at least 15 AI-generated products, got {ai_products_total}"
        
    def test_cloudinary_images_load(self):
        """Test that Cloudinary images are valid URLs"""
        response = requests.get(f"{BASE_URL}/api/products?category=party_accessories&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get('products', [])
        
        ai_products = [p for p in products if p.get('ai_image_generated') == True]
        
        for p in ai_products:
            image_url = p.get('image_url', '')
            assert image_url.startswith('https://res.cloudinary.com/'), \
                f"Image URL should be Cloudinary: {image_url[:50]}"
            assert 'duoapcx1p' in image_url, \
                f"Image should use correct Cloudinary cloud name: {image_url[:50]}"
                
        print(f"All {len(ai_products)} AI product images are valid Cloudinary URLs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
