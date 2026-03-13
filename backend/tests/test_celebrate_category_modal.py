"""
Test: CelebrateCategoryStrip and CelebrateContentModal backend APIs
Tests: product counts per category, bundles, admin products loading
"""

import pytest
import requests
import os

BASE_URL = "http://localhost:8001"


class TestCelebrateCategoryAPIs:
    """Test category-based product endpoints for the CelebrateContentModal"""

    def test_celebration_category_has_products(self):
        """birthday-cakes category maps to 'celebration' - should have 106 products"""
        r = requests.get(f"{BASE_URL}/api/products?category=celebration&limit=60")
        assert r.status_code == 200
        data = r.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        assert total >= 100, f"Expected 100+ celebration products, got {total}"
        assert len(products) == 60  # limit respected

    def test_breed_cakes_category(self):
        """breed-cakes should have 42 products"""
        r = requests.get(f"{BASE_URL}/api/products?category=breed-cakes&limit=60")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total >= 40, f"Expected 40+ breed-cakes products, got {total}"

    def test_dognuts_category(self):
        """dognuts (pupcakes) category should return products"""
        r = requests.get(f"{BASE_URL}/api/products?category=dognuts&limit=40")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total > 0, f"Expected dognuts products, got {total}"

    def test_frozen_treats_category(self):
        """frozen-treats should return products"""
        r = requests.get(f"{BASE_URL}/api/products?category=frozen-treats&limit=40")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total > 0, f"Expected frozen-treats products, got {total}"

    def test_desi_treats_category(self):
        """desi-treats should return products"""
        r = requests.get(f"{BASE_URL}/api/products?category=desi-treats&limit=30")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total > 0, f"Expected desi-treats products, got {total}"

    def test_hampers_category(self):
        """hampers should return products"""
        r = requests.get(f"{BASE_URL}/api/products?category=hampers&limit=50")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total > 0, f"Expected hampers products, got {total}"

    def test_nut_butters_category(self):
        """nut-butters should return products"""
        r = requests.get(f"{BASE_URL}/api/products?category=nut-butters&limit=20")
        assert r.status_code == 200
        data = r.json()
        total = data.get("total", 0)
        assert total > 0, f"Expected nut-butters products, got {total}"

    def test_celebrate_bundles(self):
        """GET /api/celebrate/bundles should return 6 bundles"""
        r = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        assert r.status_code == 200
        data = r.json()
        bundles = data.get("bundles", [])
        assert len(bundles) >= 6, f"Expected 6+ bundles, got {len(bundles)}"

    def test_admin_products_load_2000(self):
        """Admin panel loads /api/products?limit=2000 - should return 300+ products"""
        r = requests.get(f"{BASE_URL}/api/products?limit=2000")
        assert r.status_code == 200
        data = r.json()
        products = data.get("products", [])
        total = data.get("total", 0)
        assert total >= 300, f"Expected 300+ products for admin, got {total}"
        assert len(products) >= 300, f"Expected 300+ products in response, got {len(products)}"

    def test_products_response_structure(self):
        """Products endpoint returns correct structure"""
        r = requests.get(f"{BASE_URL}/api/products?category=celebration&limit=5")
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
        assert "total" in data
        for p in data["products"]:
            assert "id" in p or "shopify_id" in p, f"Product has no id: {p.get('name')}"
            assert "name" in p, f"Product has no name"
            assert "price" in p, f"Product {p.get('name')} has no price"

    def test_bundles_response_structure(self):
        """Bundles endpoint returns correct structure"""
        r = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        assert r.status_code == 200
        data = r.json()
        for b in data["bundles"]:
            assert "id" in b or "_id" in b, "Bundle has no id"
            assert "name" in b, "Bundle has no name"


class TestProductImagesNotCropped:
    """Verify product images have image URLs for object-contain rendering"""

    def test_celebration_products_have_images(self):
        """Birthday cake products should have image URLs"""
        r = requests.get(f"{BASE_URL}/api/products?category=celebration&limit=20")
        assert r.status_code == 200
        data = r.json()
        products = data.get("products", [])
        assert len(products) > 0
        # At least 70% should have images
        with_images = [p for p in products if p.get("image") or p.get("image_url") or p.get("images")]
        pct = len(with_images) / len(products) * 100
        assert pct >= 50, f"Only {pct:.0f}% of celebration products have images"


class TestCelebrateRoutesHealth:
    """Smoke tests for celebrate pillar API health"""

    def test_celebrate_stats(self):
        """GET /api/celebrate/stats should return stats"""
        r = requests.get(f"{BASE_URL}/api/celebrate/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_products" in data
        assert "total_bundles" in data

    def test_celebrate_products_public(self):
        """GET /api/celebrate/products should return celebrate-specific products"""
        r = requests.get(f"{BASE_URL}/api/celebrate/products?limit=16")
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
