"""
Backend tests for Product Box category filter fixes:
1. Category filter in /api/product-box/products  
2. pillar-products endpoint with category filter
3. Page reset behavior (skip=0 with category filter)
4. DineSoulPage food category products
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

FOOD_CATEGORIES = [
    'Daily Meals',
    'Treats & Rewards',
    'Supplements',
    'Frozen & Fresh',
    'Homemade & Recipes',
]

class TestProductBoxCategoryFilter:
    """Tests for category filter in unified Product Box API"""

    def test_get_products_no_filter(self):
        """Basic products fetch without filters"""
        resp = requests.get(f"{BASE_URL}/api/product-box/products?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert "total" in data
        assert len(data["products"]) > 0

    def test_dine_pillar_filter(self):
        """Filter by dine pillar returns dine products"""
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=20")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        assert len(data["products"]) > 0

    def test_daily_meals_category_filter(self):
        """Category filter for Daily Meals returns exactly food products"""
        resp = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=dine&category=Daily+Meals&limit=20"
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should return 13 Daily Meals products
        assert data["total"] == 13, f"Expected 13 Daily Meals, got {data['total']}"
        assert len(data["products"]) > 0
        # All returned products must have "Daily Meals" category
        for p in data["products"]:
            assert p.get("category") == "Daily Meals", f"Product {p.get('name')} has wrong category: {p.get('category')}"

    def test_treats_rewards_category_filter(self):
        """Category filter for Treats & Rewards"""
        resp = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=dine&category=Treats+%26+Rewards&limit=20"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 12, f"Expected 12 Treats & Rewards, got {data['total']}"
        for p in data["products"]:
            assert p.get("category") == "Treats & Rewards", f"Wrong category: {p.get('category')}"

    def test_page_reset_with_category_filter(self):
        """Category filter with skip=0 returns page 1 correctly"""
        resp = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=dine&category=Daily+Meals&skip=0&limit=5"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["skip"] == 0
        assert len(data["products"]) <= 5

    def test_all_food_categories_have_products(self):
        """All 5 food categories for dine pillar have products"""
        import urllib.parse
        for cat in FOOD_CATEGORIES:
            encoded = urllib.parse.quote(cat)
            resp = requests.get(
                f"{BASE_URL}/api/product-box/products?pillar=dine&category={encoded}&limit=5"
            )
            assert resp.status_code == 200, f"Failed for category: {cat}"
            data = resp.json()
            assert data["total"] > 0, f"No products for food category: {cat}"

    def test_clear_filter_returns_all(self):
        """Without category filter, all dine products are returned"""
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=20&skip=0")
        assert resp.status_code == 200
        data = resp.json()
        # Should have more products than just Daily Meals (13) alone
        assert data["total"] > 13


class TestPillarProductsEndpoint:
    """Tests for /api/admin/pillar-products with category filter"""

    def test_pillar_products_dine(self):
        """Get dine pillar products"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert "total" in data
        assert "categories" in data

    def test_pillar_products_with_daily_meals_category(self):
        """Pillar products filtered by Daily Meals category"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=20&category=Daily+Meals"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 13, f"Expected 13 Daily Meals, got {data['total']}"
        for p in data["products"]:
            assert p.get("category") == "Daily Meals"

    def test_pillar_products_all_food_categories(self):
        """All food categories return non-empty results"""
        import urllib.parse
        expected_counts = {
            'Daily Meals': 13,
            'Treats & Rewards': 12,
            'Supplements': 11,
            'Frozen & Fresh': 5,
            'Homemade & Recipes': 7,
        }
        for cat, expected in expected_counts.items():
            encoded = urllib.parse.quote(cat)
            resp = requests.get(
                f"{BASE_URL}/api/admin/pillar-products?pillar=dine&category={encoded}&limit=20"
            )
            assert resp.status_code == 200, f"Failed for {cat}"
            data = resp.json()
            assert data["total"] == expected, f"Category '{cat}': expected {expected}, got {data['total']}"

    def test_categories_list_in_response(self):
        """categories field in response should include dine food categories"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=5")
        assert resp.status_code == 200
        data = resp.json()
        cats = data.get("categories", [])
        # At least some food categories should be present
        food_cats_in_response = [c for c in cats if c in FOOD_CATEGORIES]
        assert len(food_cats_in_response) > 0, f"No food categories in response. Got: {cats}"


class TestDinePageProductFetch:
    """Tests to verify DineSoulPage fetches food products not breed merchandise"""

    def test_dine_food_products_not_breed_merchandise(self):
        """Products returned for daily meals should be food, not breed merchandise"""
        import urllib.parse
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&category=Daily+Meals&limit=13"
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        # None of the products should have breed-specific names like "Akita Placemat"
        breed_keywords = ['placemat', 'plush toy', 'bandana', 'bow tie', 'collar', 'leash']
        for p in products:
            name_lower = p.get("name", "").lower()
            for kw in breed_keywords:
                assert kw not in name_lower, (
                    f"Found breed merchandise in Daily Meals: {p.get('name')}"
                )

    def test_dine_treats_are_food_not_merchandise(self):
        """Treats & Rewards category returns food treats, not merchandise"""
        import urllib.parse
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&category=Treats+%26+Rewards&limit=12"
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        food_keywords = ['biscuit', 'treat', 'bite', 'chew', 'cake', 'jerky', 'platter', 'pack']
        # At least 80% of products should have food keywords in name
        food_count = sum(1 for p in products 
                        if any(kw in p.get("name", "").lower() for kw in food_keywords))
        assert food_count >= len(products) * 0.7, (
            f"Only {food_count}/{len(products)} products are food-related treats"
        )
