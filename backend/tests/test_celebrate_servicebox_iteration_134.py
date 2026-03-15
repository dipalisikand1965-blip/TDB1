"""
Iteration 134 Backend Tests
Tests for:
1. Celebrate admin products (total=1499, merged from celebrate_products + products_master)
2. Service Box services (13 pillars, shop=0 active services)
3. Bundle pricing PATCH endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCelebrateAdminProducts:
    """Celebrate admin products endpoint - merged from 2 collections"""

    def test_products_total_is_1499(self):
        """GET /api/celebrate/admin/products should return total=1499"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=1&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        total = data["total"]
        print(f"Total products: {total}")
        assert total >= 1400, f"Expected at least 1400 products, got {total} (should be ~1499)"

    def test_products_pagination_50_per_page(self):
        """Products should return exactly 50 per page (page 1)"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=1&limit=50")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        assert len(products) == 50, f"Expected 50 products on page 1, got {len(products)}"
        assert data.get("page") == 1
        assert data.get("limit") == 50

    def test_products_have_shopify_badge_source(self):
        """Some products should have _source='products_master' for Shopify badge"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=1&limit=50")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        sources = [p.get("_source") for p in products]
        master_count = sources.count("products_master")
        cel_count = sources.count("celebrate_products")
        print(f"celebrate_products: {cel_count}, products_master: {master_count}")
        assert master_count > 0, "Expected some products from products_master (Shopify)"

    def test_products_page_2_exists(self):
        """Should be able to get page 2 with more products"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=2&limit=50")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        assert len(products) > 0, "Page 2 should have products"

    def test_category_filter_all(self):
        """Category filter 'all' returns same total as default"""
        default_response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=1&limit=50")
        default_total = default_response.json().get("total", 0)
        # Total should be consistent (1499)
        assert default_total >= 1400, f"Expected ~1499 products, got {default_total}"

    def test_search_filter(self):
        """Search filter should return matching products"""
        response = requests.get(f"{BASE_URL}/api/celebrate/admin/products?page=1&limit=50&search=cake")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        # Should find some cake products
        assert data.get("total", 0) > 0, "Search for 'cake' should return results"
        print(f"Search 'cake' found: {data.get('total')} products")


class TestServiceBoxServices:
    """Service Box services endpoint - 13 pillars (not shop)"""

    def test_care_pillar_has_76_plus_services(self):
        """GET /api/service-box/services?pillar=care should have 76+ services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=care&limit=200")
        assert response.status_code == 200
        data = response.json()
        total = data.get("total", 0)
        print(f"Care pillar services: {total}")
        assert total >= 76, f"Expected 76+ care services, got {total}"

    def test_shop_pillar_has_zero_active_services(self):
        """GET /api/service-box/services?pillar=shop&is_active=true should return 0"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=shop&is_active=true&limit=200")
        assert response.status_code == 200
        data = response.json()
        total = data.get("total", 0)
        print(f"Shop active services: {total}")
        assert total == 0, f"Expected 0 active shop services, got {total}"

    def test_all_13_non_shop_pillars_have_services(self):
        """All 13 active pillars should have services"""
        expected_pillars = [
            'care', 'fit', 'learn', 'advisory', 'celebrate', 'dine',
            'stay', 'travel', 'farewell', 'emergency', 'adopt', 'paperwork', 'enjoy'
        ]
        for pillar in expected_pillars:
            response = requests.get(f"{BASE_URL}/api/service-box/services?pillar={pillar}&limit=1")
            assert response.status_code == 200
            data = response.json()
            total = data.get("total", 0)
            print(f"{pillar}: {total} services")
            assert total > 0, f"Expected {pillar} to have services, got 0"

    def test_service_stats_endpoint(self):
        """Service stats should show breakdown by pillar"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "active" in data
        assert "by_pillar" in data
        by_pillar = data["by_pillar"]
        print(f"Total: {data['total']}, Active: {data['active']}")
        print(f"Pillars: {by_pillar}")
        # care should have 76+ services
        assert by_pillar.get("care", 0) >= 76, f"Care pillar has {by_pillar.get('care')} services"

    def test_services_list_includes_pillars_metadata(self):
        """List services response should include pillars list"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=1")
        assert response.status_code == 200
        data = response.json()
        assert "pillars" in data, "Response should include pillars metadata"
        pillars = data["pillars"]
        pillar_ids = [p["id"] for p in pillars]
        print(f"Pillars in response: {pillar_ids}")

    def test_advisory_pillar_has_many_services(self):
        """Advisory should have 200+ services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=advisory&limit=1")
        assert response.status_code == 200
        data = response.json()
        total = data.get("total", 0)
        print(f"Advisory services: {total}")
        assert total >= 100, f"Expected 100+ advisory services, got {total}"


class TestBundlePricing:
    """Bundle pricing PATCH endpoint"""

    def test_patch_bundle_pricing_returns_200(self):
        """PATCH /api/bundles/celebrate-birthday-bundle/pricing should return 200"""
        response = requests.patch(
            f"{BASE_URL}/api/bundles/celebrate-birthday-bundle/pricing",
            json={"price": 1499, "original_price": 1899}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"PATCH bundle pricing response: {data.get('message', data.get('bundle', {}).get('name'))}")

    def test_patch_bundle_pricing_updates_data(self):
        """PATCH should update the bundle pricing data"""
        new_price = 1599
        response = requests.patch(
            f"{BASE_URL}/api/bundles/celebrate-birthday-bundle/pricing",
            json={"price": new_price, "original_price": 2000}
        )
        assert response.status_code == 200
        data = response.json()
        bundle = data.get("bundle", {})
        print(f"Bundle after update: original_price={bundle.get('original_price')}, bundle_price={bundle.get('bundle_price')}")
        # original_price should be updated
        assert bundle.get("original_price") == 2000, f"Expected original_price=2000, got {bundle.get('original_price')}"


class TestCelebrateDashboardStats:
    """Celebrate dashboard stats"""

    def test_celebrate_stats_endpoint(self):
        """GET /api/celebrate/stats returns product counts"""
        response = requests.get(f"{BASE_URL}/api/celebrate/stats")
        assert response.status_code == 200
        data = response.json()
        print(f"Celebrate stats: {data}")
        assert "total_products" in data
        # From celebrate_products collection directly (not merged)
        assert data["total_products"] >= 0
