"""
Test suite for iteration 209 - Migration endpoints + ProductBox fixes
Tests:
- POST /api/admin/migrate/legacy-services  (Basic Auth)
- POST /api/admin/migrate/soul-products   (Basic Auth)
- Admin login
- ProductBox GET products (Basic Auth)
"""

import pytest
import requests
import os

# Load BASE_URL from frontend .env if not in environment
def _load_base_url():
    url = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
    if not url:
        env_path = '/app/frontend/.env'
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        url = line.split('=', 1)[1].strip().rstrip('/')
                        break
    return url

BASE_URL = _load_base_url()

ADMIN_CREDS = ("aditya", "lola4304")


# ==================== Admin Auth Tests ====================

class TestAdminAuth:
    """Verify admin login works with given credentials"""

    def test_admin_login_success(self):
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "aditya", "password": "lola4304"})
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        assert token, f"No token in login response: {data}"
        print(f"Admin login success, token: {token[:20]}...")

    def test_admin_login_wrong_password(self):
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "aditya", "password": "wrongpassword"})
        assert resp.status_code in [401, 403], f"Expected 401/403 for wrong password, got {resp.status_code}"

    def test_admin_basic_auth_verify(self):
        """Admin verify endpoint with Basic Auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/verify", auth=ADMIN_CREDS)
        assert resp.status_code == 200, f"Admin Basic Auth verify failed: {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert data.get("valid") == True, f"verify returned valid!=True: {data}"


# ==================== Migration Endpoint Tests ====================

class TestLegacyServicesMigration:
    """POST /api/admin/migrate/legacy-services - uses Basic Auth"""

    def test_migrate_legacy_services_status_200(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/legacy-services", auth=ADMIN_CREDS)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:500]}"

    def test_migrate_legacy_services_success_true(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/legacy-services", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True, f"success is not True: {data}"

    def test_migrate_legacy_services_has_migrated_key(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/legacy-services", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        assert "migrated" in data, f"Missing 'migrated' key: {data}"
        print(f"Migration: migrated={data.get('migrated')}, skipped={data.get('skipped_duplicates')}, total_in_master={data.get('total_in_services_master')}")

    def test_services_master_has_records_after_migration(self):
        """After migration, services_master total should be > 0"""
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/legacy-services", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        total = data.get("total_in_services_master", 0)
        assert total > 0, f"services_master empty after migration: {data}"
        print(f"services_master total: {total}")


class TestSoulProductsMigration:
    """POST /api/admin/migrate/soul-products - uses Basic Auth"""

    def test_migrate_soul_products_status_200(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/soul-products", auth=ADMIN_CREDS)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:500]}"

    def test_migrate_soul_products_success_true(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/soul-products", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True, f"success is not True: {data}"

    def test_migrate_soul_products_has_migrated_key(self):
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/soul-products", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        assert "migrated" in data, f"Missing 'migrated' key: {data}"
        print(f"Soul products: migrated={data.get('migrated')}, skipped={data.get('skipped_duplicates')}, total={data.get('total_in_products_master')}")

    def test_products_master_has_records_after_migration(self):
        """products_master total > 0 after migration"""
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/soul-products", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        total = data.get("total_in_products_master", 0)
        assert total > 0, f"products_master empty after migration: {data}"
        print(f"products_master total: {total}")


# ==================== ProductBox - Products endpoint ====================

class TestProductBoxAPI:
    """Tests for product listing via admin endpoint"""

    def test_get_admin_products_returns_200(self):
        """Admin products endpoint should return 200"""
        resp = requests.get(f"{BASE_URL}/api/admin/products", auth=ADMIN_CREDS)
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:300]}"

    def test_admin_products_returns_data(self):
        """Admin products endpoint should return non-empty data"""
        resp = requests.get(f"{BASE_URL}/api/admin/products", auth=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        assert len(products) > 0, "No products found"
        print(f"Got {len(products)} products")

    def test_product_update_with_is_active(self):
        """Update product with is_active field (allowedFields fix)"""
        # Get first product
        resp = requests.get(f"{BASE_URL}/api/admin/products?limit=1", auth=ADMIN_CREDS)
        if resp.status_code != 200:
            pytest.skip("Cannot get products list")
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        if not products:
            pytest.skip("No products found")
        product = products[0]
        product_id = product.get("id")
        if not product_id:
            pytest.skip("Product has no ID")

        current_active = product.get("is_active", True)
        update_payload = {"is_active": not current_active, "name": product.get("name", "Test")}
        update_resp = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json=update_payload,
            auth=ADMIN_CREDS
        )
        print(f"is_active update: {update_resp.status_code}: {update_resp.text[:200]}")
        assert update_resp.status_code in [200, 201, 204], f"is_active update failed: {update_resp.status_code}"

        # Restore
        requests.put(f"{BASE_URL}/api/admin/products/{product_id}", json={"is_active": current_active, "name": product.get("name", "Test")}, auth=ADMIN_CREDS)

    def test_product_update_with_inventory(self):
        """Update product with inventory field (allowedFields fix)"""
        resp = requests.get(f"{BASE_URL}/api/admin/products?limit=1", auth=ADMIN_CREDS)
        if resp.status_code != 200:
            pytest.skip("Cannot get products list")
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        if not products:
            pytest.skip("No products found")
        product = products[0]
        product_id = product.get("id")
        if not product_id:
            pytest.skip("Product has no ID")

        update_payload = {
            "inventory": {"track_inventory": True, "stock_quantity": 99, "low_stock_threshold": 5},
            "name": product.get("name", "Test")
        }
        update_resp = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json=update_payload,
            auth=ADMIN_CREDS
        )
        print(f"inventory update: {update_resp.status_code}: {update_resp.text[:200]}")
        assert update_resp.status_code in [200, 201, 204], f"inventory update failed: {update_resp.status_code}"
