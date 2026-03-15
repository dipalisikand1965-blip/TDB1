"""
Test: Admin Panel - PricingHub, Bundles, and Manager components
Iteration 132 - Testing bundle pricing, pillar bundles, product count, services
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"

def get_admin_headers():
    """Build Basic auth header for admin endpoints"""
    import base64
    token = base64.b64encode(f"{ADMIN_USER}:{ADMIN_PASS}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


class TestBundlesAPI:
    """Tests for /api/bundles endpoints"""

    def test_get_all_bundles_active_only_false(self):
        """GET /api/bundles?active_only=false - should return 39 bundles across 13 pillars"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=500")
        assert res.status_code == 200
        data = res.json()
        assert "bundles" in data
        assert data["total"] >= 39, f"Expected 39 bundles, got {data['total']}"
        assert len(data["bundles"]) >= 39

    def test_get_bundles_pillar_breakdown(self):
        """GET /api/bundles?active_only=false - all 13 pillars must be present"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false&limit=500")
        assert res.status_code == 200
        bundles = res.json()["bundles"]

        # Build pillar map
        pillars = {}
        for b in bundles:
            p = b.get("pillar", "unknown")
            pillars[p] = pillars.get(p, 0) + 1

        expected_pillars = [
            "celebrate", "dine", "stay", "travel", "care", "fit",
            "enjoy", "learn", "farewell", "emergency", "adopt", "advisory", "paperwork"
        ]
        for pillar in expected_pillars:
            assert pillar in pillars, f"Missing pillar: {pillar} — found: {list(pillars.keys())}"

    def test_get_bundles_default_active_only(self):
        """GET /api/bundles - default active_only=true should return bundles"""
        res = requests.get(f"{BASE_URL}/api/bundles")
        assert res.status_code == 200
        data = res.json()
        assert "bundles" in data
        assert data["total"] > 0

    def test_get_bundle_by_id(self):
        """GET /api/bundles/{id} - should return specific bundle"""
        # Get a bundle id first
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false")
        assert res.status_code == 200
        bundles = res.json()["bundles"]
        assert len(bundles) > 0
        bundle_id = bundles[0]["id"]

        # Fetch by ID
        res2 = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert res2.status_code == 200
        bundle = res2.json()
        assert bundle["id"] == bundle_id
        assert "name" in bundle
        assert "pillar" in bundle

    def test_patch_bundle_pricing(self):
        """PATCH /api/bundles/{id}/pricing - should update bundle price and return updated bundle"""
        # Get a bundle id first
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false")
        assert res.status_code == 200
        bundles = res.json()["bundles"]
        assert len(bundles) > 0
        bundle_id = bundles[0]["id"]

        # Store original price
        original_bundle_price = bundles[0].get("bundle_price", 999)

        # Patch pricing
        new_price = 888
        patch_res = requests.patch(
            f"{BASE_URL}/api/bundles/{bundle_id}/pricing",
            json={"original_price": 1200, "bundle_price": new_price, "active": True}
        )
        assert patch_res.status_code == 200
        data = patch_res.json()
        assert "bundle" in data
        assert data["bundle"]["bundle_price"] == new_price
        assert data["bundle"]["original_price"] == 1200
        # Verify discount recalculated: (1200 - 888) / 1200 * 100 = 26%
        assert data["bundle"]["discount"] == 26

    def test_patch_bundle_pricing_404(self):
        """PATCH /api/bundles/nonexistent/pricing - should return 404"""
        res = requests.patch(
            f"{BASE_URL}/api/bundles/nonexistent-bundle-xyz-999/pricing",
            json={"bundle_price": 500}
        )
        assert res.status_code == 404

    def test_bundle_items_are_serializable(self):
        """All bundle items should be strings or objects with name/title fields"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false")
        assert res.status_code == 200
        bundles = res.json()["bundles"]

        for bundle in bundles:
            items = bundle.get("items", [])
            for item in items:
                # Item should be string or object with name
                if isinstance(item, dict):
                    assert "name" in item or "title" in item, \
                        f"Bundle {bundle['id']} has object item without name/title: {item}"
                else:
                    assert isinstance(item, str), \
                        f"Bundle {bundle['id']} has non-string, non-dict item: {item}"


class TestPricingProductsAPI:
    """Tests for /api/admin/pricing/products"""

    def test_products_total_count(self):
        """GET /api/admin/pricing/products - should show 3987 products"""
        res = requests.get(f"{BASE_URL}/api/admin/pricing/products?limit=100", 
                          headers=get_admin_headers())
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 3987, f"Expected 3987+ products, got {data['total']}"

    def test_products_stats_endpoint(self):
        """GET /api/admin/pricing/stats - should show total_products = 3987"""
        res = requests.get(f"{BASE_URL}/api/admin/pricing/stats", 
                          headers=get_admin_headers())
        assert res.status_code == 200
        data = res.json()
        assert "total_products" in data
        assert data["total_products"] >= 3987, \
            f"Expected 3987+ total_products in stats, got {data['total_products']}"

    def test_products_returns_list(self):
        """GET /api/admin/pricing/products - should return products list"""
        res = requests.get(f"{BASE_URL}/api/admin/pricing/products?limit=10", 
                          headers=get_admin_headers())
        assert res.status_code == 200
        data = res.json()
        assert "products" in data
        assert len(data["products"]) > 0
        # Check first product structure
        product = data["products"][0]
        assert "id" in product or "name" in product


class TestServicesAPI:
    """Tests for /api/service-box/services"""

    def test_services_load(self):
        """GET /api/service-box/services - should return services"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?limit=200")
        assert res.status_code == 200
        data = res.json()
        assert "services" in data
        assert data["total"] > 0, "Expected services to be present"
        assert len(data["services"]) > 0

    def test_services_total_count(self):
        """GET /api/service-box/services - total should be > 0"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?limit=200")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 100, f"Expected 100+ services, got {data['total']}"


class TestArchitectureAuditDoc:
    """Tests for /api/docs/architecture-audit"""

    def test_architecture_audit_accessible(self):
        """GET /api/docs/architecture-audit - should return 200"""
        res = requests.get(f"{BASE_URL}/api/docs/architecture-audit")
        assert res.status_code == 200

    def test_architecture_audit_returns_html(self):
        """GET /api/docs/architecture-audit - should return HTML content"""
        res = requests.get(f"{BASE_URL}/api/docs/architecture-audit")
        assert res.status_code == 200
        assert "text/html" in res.headers.get("content-type", "")
        assert len(res.text) > 1000


class TestBundlesCRUD:
    """Test bundle create and full CRUD flow"""

    def test_create_and_delete_bundle(self):
        """POST /api/bundles - create a test bundle, then soft-delete"""
        # Create
        bundle_data = {
            "name": "TEST_Integration Bundle",
            "description": "Test bundle for integration testing",
            "pillar": "celebrate",
            "items": ["Test Item 1", "Test Item 2"],
            "original_price": 1000,
            "bundle_price": 800,
            "icon": "🧪",
            "active": True
        }
        res = requests.post(f"{BASE_URL}/api/bundles", json=bundle_data)
        assert res.status_code == 200
        data = res.json()
        assert "bundle" in data
        bundle_id = data["bundle"]["id"]
        assert bundle_id is not None

        # Verify GET
        get_res = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["name"] == "TEST_Integration Bundle"
        assert fetched["pillar"] == "celebrate"

        # PATCH pricing
        patch_res = requests.patch(
            f"{BASE_URL}/api/bundles/{bundle_id}/pricing",
            json={"original_price": 1000, "bundle_price": 750, "active": True}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["bundle"]["bundle_price"] == 750

        # Soft delete
        del_res = requests.delete(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert del_res.status_code == 200

        # Verify soft-deleted (not in active_only list)
        get_active = requests.get(f"{BASE_URL}/api/bundles?pillar=celebrate&active_only=true")
        active_ids = [b["id"] for b in get_active.json().get("bundles", [])]
        assert bundle_id not in active_ids, "Deleted bundle should not appear in active list"
