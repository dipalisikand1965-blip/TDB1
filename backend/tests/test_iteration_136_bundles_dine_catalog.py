"""
Iteration 136 - Bundles Architecture Fix + Dine Catalog Seed
Tests:
1. Canonical bundles API GET /api/bundles?pillar=X
2. Bundle CRUD via canonical API
3. Dine catalog seed endpoint
4. Dine product count after seed
"""

import pytest
import requests
import os
from pathlib import Path

# Load env from frontend/.env
env_file = Path("/app/frontend/.env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestCanonicalBundlesAPI:
    """Canonical /api/bundles endpoint tests"""

    def test_get_bundles_no_filter(self):
        """GET /api/bundles - should return bundles with pagination"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "bundles" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"GET /api/bundles total bundles: {data['total']}")

    def test_get_bundles_dine_pillar(self):
        """GET /api/bundles?pillar=dine&active_only=false - should return dine bundles"""
        res = requests.get(f"{BASE_URL}/api/bundles?pillar=dine&active_only=false&page=1&limit=10")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "bundles" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert data.get("pillar") == "dine"
        # Verify bundles are for dine pillar
        for bundle in data.get("bundles", []):
            if "pillar" in bundle:
                assert bundle["pillar"] == "dine", f"Bundle {bundle.get('name')} has wrong pillar: {bundle['pillar']}"
        print(f"GET /api/bundles?pillar=dine total: {data['total']}, bundles returned: {len(data['bundles'])}")

    def test_get_bundles_care_pillar(self):
        """GET /api/bundles?pillar=care&active_only=false - should return care bundles"""
        res = requests.get(f"{BASE_URL}/api/bundles?pillar=care&active_only=false&page=1&limit=10")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "bundles" in data
        assert data.get("pillar") == "care"
        print(f"GET /api/bundles?pillar=care total: {data['total']}")

    def test_get_bundles_fit_pillar(self):
        """GET /api/bundles?pillar=fit&active_only=false - should return fit bundles"""
        res = requests.get(f"{BASE_URL}/api/bundles?pillar=fit&active_only=false&page=1&limit=10")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "bundles" in data
        assert data.get("pillar") == "fit"
        print(f"GET /api/bundles?pillar=fit total: {data['total']}")

    def test_get_bundles_pagination(self):
        """Test pagination fields are correct"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false&page=1&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert data["page"] == 1
        assert data["limit"] == 5
        assert isinstance(data["pages"], int)
        assert data["pages"] >= 1
        print(f"Pagination test: pages={data['pages']}, total={data['total']}")


class TestBundleCRUD:
    """Bundle Create/Read/Update/Delete via canonical API"""

    created_bundle_id = None

    def test_create_dine_bundle(self):
        """POST /api/bundles - create a dine bundle"""
        payload = {
            "name": "TEST_Dine Bundle - Iteration 136",
            "description": "Test bundle for Dine pillar",
            "pillar": "dine",
            "items": ["Test Item 1", "Test Item 2"],
            "original_price": 1500,
            "bundle_price": 999,
            "icon": "🍽️",
            "popular": False,
            "active": True
        }
        res = requests.post(f"{BASE_URL}/api/bundles", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        data = res.json()
        assert "bundle" in data
        bundle = data["bundle"]
        assert bundle["name"] == payload["name"]
        assert bundle["pillar"] == "dine"
        assert bundle["bundle_price"] == 999
        assert "id" in bundle
        TestBundleCRUD.created_bundle_id = bundle["id"]
        print(f"Created bundle ID: {bundle['id']}")

    def test_get_created_bundle(self):
        """GET /api/bundles/{id} - verify bundle was persisted"""
        if not TestBundleCRUD.created_bundle_id:
            pytest.skip("No bundle created in previous test")
        res = requests.get(f"{BASE_URL}/api/bundles/{TestBundleCRUD.created_bundle_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert data["name"] == "TEST_Dine Bundle - Iteration 136"
        assert data["pillar"] == "dine"
        print(f"Bundle persisted correctly: {data['name']}")

    def test_update_bundle(self):
        """PUT /api/bundles/{id} - update existing bundle"""
        if not TestBundleCRUD.created_bundle_id:
            pytest.skip("No bundle created in previous test")
        payload = {"name": "TEST_Dine Bundle Updated", "bundle_price": 1199}
        res = requests.put(f"{BASE_URL}/api/bundles/{TestBundleCRUD.created_bundle_id}", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "bundle" in data
        # Verify update persisted
        get_res = requests.get(f"{BASE_URL}/api/bundles/{TestBundleCRUD.created_bundle_id}")
        assert get_res.status_code == 200
        updated = get_res.json()
        assert updated["name"] == "TEST_Dine Bundle Updated"
        assert updated["bundle_price"] == 1199
        print(f"Bundle updated correctly: name={updated['name']}, price={updated['bundle_price']}")

    def test_delete_bundle(self):
        """DELETE /api/bundles/{id} - soft delete"""
        if not TestBundleCRUD.created_bundle_id:
            pytest.skip("No bundle created in previous test")
        res = requests.delete(f"{BASE_URL}/api/bundles/{TestBundleCRUD.created_bundle_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "message" in data
        print(f"Bundle deleted: {data['message']}")


class TestDineCatalogSeed:
    """Tests for Dine product catalog seeding"""

    def test_seed_dine_catalog_first_run(self):
        """POST /api/admin/pillar-products/seed-dine-catalog - should seed 48 products"""
        res = requests.post(f"{BASE_URL}/api/admin/pillar-products/seed-dine-catalog")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        data = res.json()
        assert "seeded" in data or "skipped" in data
        assert "total_catalog" in data
        print(f"Seed result: seeded={data.get('seeded')}, skipped={data.get('skipped')}, total={data.get('total_catalog')}")

    def test_seed_dine_catalog_idempotent(self):
        """POST /api/admin/pillar-products/seed-dine-catalog - second run should skip all"""
        res = requests.post(f"{BASE_URL}/api/admin/pillar-products/seed-dine-catalog")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        data = res.json()
        assert data.get("seeded") == 0, f"Expected seeded=0 on second run, got {data.get('seeded')}"
        assert data.get("skipped", 0) > 0, f"Expected skipped>0 on second run"
        print(f"Idempotent seed: seeded={data.get('seeded')}, skipped={data.get('skipped')}")

    def test_dine_product_count_after_seed(self):
        """GET /api/admin/pillar-products?pillar=dine - should return 48+ products"""
        res = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=100")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        total = data.get("total", 0)
        print(f"Dine product count: {total}")
        assert total >= 48, f"Expected 48+ dine products, got {total}"

    def test_dine_products_have_correct_fields(self):
        """Verify dine products have required fields"""
        res = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=10")
        assert res.status_code == 200
        data = res.json()
        products = data.get("products", [])
        assert len(products) > 0, "No dine products found"
        for product in products:
            assert product.get("pillar") == "dine", f"Product {product.get('id')} has wrong pillar"
            assert "name" in product
            assert "id" in product
        print(f"Verified {len(products)} dine products have correct fields")


class TestBundlesAPIStructure:
    """Test bundle API response structure"""

    def test_bundle_response_has_no_mongodb_id(self):
        """Verify _id is excluded from bundle responses"""
        res = requests.get(f"{BASE_URL}/api/bundles?pillar=dine&active_only=false")
        assert res.status_code == 200
        data = res.json()
        for bundle in data.get("bundles", []):
            assert "_id" not in bundle, f"Bundle {bundle.get('id')} has exposed _id field"
        print("All bundles correctly exclude _id field")

    def test_bundle_search(self):
        """Test bundle search functionality"""
        res = requests.get(f"{BASE_URL}/api/bundles?active_only=false&search=bundle")
        assert res.status_code == 200
        data = res.json()
        assert "bundles" in data
        print(f"Search 'bundle' returned {len(data['bundles'])} results")
