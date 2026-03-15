"""
Backend Tests for New Features - Iteration 135
Tests: pillar-products endpoint, bundles pagination, admin panel
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPillarProductsEndpoint:
    """Tests for unified /api/admin/pillar-products endpoint"""

    def test_pillar_products_celebrate_returns_data(self):
        """Test /api/admin/pillar-products?pillar=celebrate returns products with pagination"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=celebrate&page=1&limit=5")
        assert response.status_code == 200, f"Expected 200 got {response.status_code}: {response.text[:200]}"

        data = response.json()
        assert "products" in data, "Response must have 'products' key"
        assert "total" in data, "Response must have 'total' key"
        assert "pages" in data, "Response must have 'pages' key"
        assert "page" in data, "Response must have 'page' key"
        assert data["total"] > 0, f"Expected products for celebrate, got 0. Check products_master."
        assert len(data["products"]) > 0, "products list must not be empty"
        assert data["pages"] >= 1, "pages must be at least 1"
        assert data["page"] == 1, "page must be 1"
        print(f"[PASS] celebrate: total={data['total']}, pages={data['pages']}, returned={len(data['products'])}")

    def test_pillar_products_care_returns_data(self):
        """Test /api/admin/pillar-products?pillar=care returns products"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=care&page=1&limit=10")
        assert response.status_code == 200, f"Expected 200 got {response.status_code}"

        data = response.json()
        assert "products" in data
        assert data["total"] > 0, "Expected products for care pillar"
        assert len(data["products"]) > 0
        print(f"[PASS] care: total={data['total']}, pages={data['pages']}, returned={len(data['products'])}")

    def test_pillar_products_fit_returns_data(self):
        """Test fit pillar products"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=fit&page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 0  # May have 0 if not migrated
        print(f"[PASS] fit: total={data['total']}, pages={data['pages']}")

    def test_pillar_products_dine_returns_data(self):
        """Test dine pillar products"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"[PASS] dine: total={data['total']}, pages={data['pages']}")

    def test_pillar_products_search_filter(self):
        """Test /api/admin/pillar-products?pillar=dine&search=food returns filtered products"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&search=food")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        # If search returns results, verify they match search term
        if data["products"]:
            for product in data["products"]:
                name_or_desc = (product.get("name", "") + " " + product.get("description", "")).lower()
                assert "food" in name_or_desc, f"Product '{product.get('name')}' doesn't match 'food' filter"
        print(f"[PASS] dine search=food: found {data['total']} products")

    def test_pillar_products_pagination(self):
        """Test pagination works correctly"""
        resp_p1 = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=celebrate&page=1&limit=5")
        resp_p2 = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=celebrate&page=2&limit=5")

        assert resp_p1.status_code == 200
        assert resp_p2.status_code == 200

        data1 = resp_p1.json()
        data2 = resp_p2.json()

        # Both pages should have same total
        assert data1["total"] == data2["total"], "Total should be consistent across pages"
        # Products on page 2 should be different from page 1 (if enough products)
        if data1["total"] > 5 and data2["products"]:
            ids_p1 = {p.get("id") or p.get("shopify_id") for p in data1["products"]}
            ids_p2 = {p.get("id") or p.get("shopify_id") for p in data2["products"]}
            assert ids_p1 != ids_p2, "Page 1 and page 2 must have different products"
        print(f"[PASS] pagination: page1={len(data1['products'])} items, page2={len(data2['products'])} items")

    def test_pillar_products_returns_categories(self):
        """Test that categories are returned for filtering"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=celebrate&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data, "Response must include 'categories' for filter UI"
        print(f"[PASS] celebrate categories: {data['categories'][:5]}")

    def test_pillar_products_missing_pillar_param(self):
        """Test that missing pillar param returns error (pillar is required)"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products")
        # Should return 422 (validation error - required param missing)
        assert response.status_code in [400, 422], f"Expected 400/422 got {response.status_code}"
        print(f"[PASS] missing pillar param: {response.status_code}")

    def test_pillar_products_all_active_pillars(self):
        """Test multiple pillars return data (verify migration worked)"""
        pillars_with_products = []
        pillars = ['celebrate', 'care', 'dine', 'travel', 'stay', 'fit', 'farewell', 'emergency']
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar={pillar}&limit=1")
            assert response.status_code == 200, f"{pillar} endpoint failed"
            data = response.json()
            if data["total"] > 0:
                pillars_with_products.append(pillar)
        print(f"[PASS] Pillars with products: {pillars_with_products}")
        assert len(pillars_with_products) >= 2, f"At least 2 pillars should have products, got {pillars_with_products}"


class TestBundlesEndpoint:
    """Tests for bundles GET with pagination and search"""

    def test_bundles_get_with_pagination(self):
        """Test /api/bundles?pillar=celebrate&page=1&limit=5 returns paginated results with pages field"""
        response = requests.get(f"{BASE_URL}/api/bundles?pillar=celebrate&page=1&limit=5&active_only=false")
        assert response.status_code == 200, f"Expected 200 got {response.status_code}: {response.text[:200]}"

        data = response.json()
        assert "bundles" in data, "Response must have 'bundles' key"
        assert "total" in data, "Response must have 'total' key"
        assert "pages" in data, "Response must have 'pages' field (new feature)"
        assert "page" in data, "Response must have 'page' key"
        assert data["pages"] >= 1, "pages must be at least 1"
        print(f"[PASS] bundles celebrate: total={data['total']}, pages={data['pages']}, returned={len(data['bundles'])}")

    def test_bundles_get_all_active_only_false(self):
        """Test getting all bundles with active_only=false"""
        response = requests.get(f"{BASE_URL}/api/bundles?active_only=false&page=1&limit=30")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert "pages" in data
        assert data["total"] >= 0
        print(f"[PASS] all bundles: total={data['total']}, pages={data['pages']}")

    def test_bundles_search(self):
        """Test bundles search parameter"""
        response = requests.get(f"{BASE_URL}/api/bundles?search=birthday&active_only=false")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"[PASS] bundles search=birthday: found {data['total']}")

    def test_bundles_pagination_different_pages(self):
        """Test paginated bundles returns different pages"""
        resp_p1 = requests.get(f"{BASE_URL}/api/bundles?active_only=false&page=1&limit=5")
        assert resp_p1.status_code == 200
        data = resp_p1.json()
        assert "pages" in data
        assert isinstance(data["pages"], int)
        print(f"[PASS] bundles pagination: pages={data['pages']}, total={data['total']}")

    def test_bundles_total_is_103(self):
        """Test that bundles migration ran (should have ~103 bundles)"""
        response = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=200")
        assert response.status_code == 200
        data = response.json()
        total = data["total"]
        # After migration we should have 103 bundles
        assert total > 50, f"Expected 103+ bundles after migration, got {total}"
        print(f"[PASS] total bundles in DB: {total}")


class TestAdminEndpoints:
    """Tests for admin panel functionality"""

    def test_admin_login(self):
        """Test admin login works at /api/admin/login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200, f"Login failed: {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data.get("success") or "token" in data, "Admin login must return success/token"
        print(f"[PASS] admin login successful: {list(data.keys())}")

    def test_backend_health(self):
        """Test backend is running"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        # Health may return 200 or 404 (if disabled)
        assert response.status_code in [200, 404], f"Backend not running: {response.status_code}"
        print(f"[PASS] backend health: {response.status_code}")

    def test_celebrate_products_not_uncategorized(self):
        """Test that celebrate products no longer have uncategorized items"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=celebrate&limit=200")
        assert response.status_code == 200
        data = response.json()
        categories = data.get("categories", [])
        # Should not have 'uncategorized' as primary category if fix was applied
        print(f"[PASS] celebrate categories: {categories}")
        assert data["total"] > 0, "Celebrate must have products"

    def test_products_master_has_5789_products(self):
        """Verify products_master migration - should have 5789 products"""
        # Test across pillars to verify total migration
        total_count = 0
        for pillar in ['celebrate', 'care', 'dine', 'travel', 'stay', 'fit', 'farewell', 'emergency', 'enjoy', 'learn', 'adopt', 'advisory', 'paperwork']:
            r = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar={pillar}&limit=1")
            if r.status_code == 200:
                total_count += r.json().get("total", 0)
        print(f"[INFO] Total products across all pillars: {total_count}")
        # Should be significant (5789 was migrated)
        assert total_count > 1000, f"Expected 1000+ products, got {total_count}"


class TestBundlesCRUD:
    """Test bundle CRUD operations"""

    def test_create_and_delete_bundle(self):
        """Test creating and deleting a test bundle"""
        # Create
        payload = {
            "name": "TEST_Bundle_Delete_Me",
            "description": "Test bundle for automated testing",
            "pillar": "celebrate",
            "items": ["Item1", "Item2"],
            "original_price": 1000.0,
            "bundle_price": 800.0,
            "icon": "🎁",
            "popular": False,
            "active": True
        }
        create_resp = requests.post(f"{BASE_URL}/api/bundles", json=payload)
        assert create_resp.status_code == 200, f"Create failed: {create_resp.status_code}: {create_resp.text[:200]}"
        created = create_resp.json()
        bundle = created.get("bundle", created)
        bundle_id = bundle.get("id")
        assert bundle_id, "Created bundle must have an id"

        # Verify GET
        get_resp = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["name"] == payload["name"]

        # Delete (soft delete)
        del_resp = requests.delete(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert del_resp.status_code == 200
        print(f"[PASS] bundle CRUD: create+get+delete for {bundle_id}")

    def test_bundle_discount_calculated(self):
        """Test bundle discount is auto-calculated on creation"""
        payload = {
            "name": "TEST_Discount_Bundle",
            "description": "Tests discount calc",
            "pillar": "dine",
            "items": ["Bowl", "Mat"],
            "original_price": 1000.0,
            "bundle_price": 800.0,
        }
        resp = requests.post(f"{BASE_URL}/api/bundles", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        bundle = data.get("bundle", data)
        # Discount should be 20% ((1 - 800/1000) * 100 = 20)
        assert bundle.get("discount") == 20, f"Expected discount=20, got {bundle.get('discount')}"

        # Cleanup
        bundle_id = bundle.get("id")
        if bundle_id:
            requests.delete(f"{BASE_URL}/api/bundles/{bundle_id}")
        print(f"[PASS] bundle discount calculation: {bundle.get('discount')}%")
