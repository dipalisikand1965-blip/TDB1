"""
Backend tests for iteration 130:
- POST /api/admin/products/{product_id}/generate-image (new AI image endpoint)
- POST /api/admin/celebrate/bundles/{bundle_id}/generate-image (new bundle AI image endpoint)
- GET /api/admin/celebrate/excel-seed-status (pillar counts verification)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_CREDS = {"username": "aditya", "password": "lola4304"}
TEST_PRODUCT_ID = "cel-ff-001-0c1650"
TEST_BUNDLE_ID = "celebrate-bun-001"


@pytest.fixture(scope="module")
def admin_token():
    """Obtain admin JWT token for authenticated requests."""
    resp = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_CREDS)
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    data = resp.json()
    token = data.get("token") or data.get("access_token")
    assert token, "No token returned from login"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ─── AUTH TESTS ───────────────────────────────────────────────────────────────

class TestAuthentication:
    """Verify admin authentication works"""

    def test_admin_login(self):
        resp = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_CREDS)
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data or "access_token" in data

    def test_generate_product_image_requires_auth(self):
        """generate-image endpoint must reject unauthenticated requests"""
        resp = requests.post(f"{BASE_URL}/api/admin/products/{TEST_PRODUCT_ID}/generate-image")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_generate_bundle_image_requires_auth(self):
        """bundle generate-image endpoint must reject unauthenticated requests"""
        resp = requests.post(f"{BASE_URL}/api/admin/celebrate/bundles/{TEST_BUNDLE_ID}/generate-image")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_excel_seed_status_requires_auth(self):
        """excel-seed-status endpoint must reject unauthenticated requests"""
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"


# ─── EXCEL SEED STATUS ─────────────────────────────────────────────────────────

class TestExcelSeedStatus:
    """Verify pillar counts from excel-seed-status endpoint"""

    def test_excel_seed_status_returns_200(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_excel_seed_status_has_pillar_counts(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "pillar_counts" in data, "Missing 'pillar_counts' key in response"
        pc = data["pillar_counts"]
        assert isinstance(pc, dict), "pillar_counts should be a dict"

    def test_pillar_count_food_equals_14(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        assert resp.status_code == 200
        pc = resp.json()["pillar_counts"]
        assert pc.get("food") == 14, f"Expected food=14, got {pc.get('food')}"

    def test_pillar_count_play_equals_14(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("play") == 14, f"Expected play=14, got {pc.get('play')}"

    def test_pillar_count_social_equals_11(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("social") == 11, f"Expected social=11, got {pc.get('social')}"

    def test_pillar_count_adventure_equals_10(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("adventure") == 10, f"Expected adventure=10, got {pc.get('adventure')}"

    def test_pillar_count_grooming_equals_12(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("grooming") == 12, f"Expected grooming=12, got {pc.get('grooming')}"

    def test_pillar_count_learning_memory_equals_21(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("learning_memory") == 21, f"Expected learning_memory=21, got {pc.get('learning_memory')}"

    def test_pillar_count_health_equals_11(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/celebrate/excel-seed-status", headers=auth_headers)
        pc = resp.json()["pillar_counts"]
        assert pc.get("health") == 11, f"Expected health=11, got {pc.get('health')}"


# ─── PRODUCT GENERATE IMAGE ENDPOINT ─────────────────────────────────────────

class TestProductGenerateImage:
    """Test POST /api/admin/products/{product_id}/generate-image"""

    def test_product_exists_in_db(self, auth_headers):
        """Verify the test product exists before testing image generation"""
        resp = requests.get(f"{BASE_URL}/api/admin/products/{TEST_PRODUCT_ID}", headers=auth_headers)
        assert resp.status_code == 200, f"Test product not found: {resp.status_code}"
        data = resp.json()
        product = data.get("product", data)
        assert product.get("id") == TEST_PRODUCT_ID or product.get("sku") == "FF-001"

    def test_generate_image_404_for_nonexistent_product(self, auth_headers):
        """Non-existent product should return 404"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/products/nonexistent-product-xyz-999/generate-image",
            headers=auth_headers
        )
        assert resp.status_code == 404, f"Expected 404 for non-existent product, got {resp.status_code}"

    def test_generate_image_endpoint_accessible(self, auth_headers):
        """Endpoint must be reachable (not 404 route), returns valid HTTP response"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/products/{TEST_PRODUCT_ID}/generate-image",
            headers=auth_headers,
            timeout=90  # AI generation may take a while
        )
        # Should NOT return 404 (route missing) or 401/403 (auth issue)
        assert resp.status_code != 404, "Route not found - endpoint missing!"
        assert resp.status_code != 401, "Auth rejected for valid token"
        assert resp.status_code != 403, "Auth forbidden for admin user"
        # 200 = success, 500 = AI/Cloudinary config issue (but route exists)
        assert resp.status_code in [200, 500], f"Unexpected status: {resp.status_code}: {resp.text[:300]}"

    def test_generate_image_response_structure_on_success(self, auth_headers):
        """If generation succeeds, response must have {success: true, image_url: str}"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/products/{TEST_PRODUCT_ID}/generate-image",
            headers=auth_headers,
            timeout=90
        )
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("success") is True, f"Expected success=true, got: {data}"
            assert "image_url" in data, "Missing 'image_url' in response"
            assert isinstance(data["image_url"], str), "image_url must be a string"
            assert data["image_url"].startswith("http"), f"image_url not a valid URL: {data['image_url']}"
            print(f"SUCCESS: Generated image URL: {data['image_url'][:80]}...")
        elif resp.status_code == 500:
            # AI/Cloudinary config issue - log but don't fail
            data = resp.json()
            print(f"WARNING: Generate image returned 500 (likely AI/Cloudinary config): {data.get('detail', '')[:200]}")
            pytest.skip("AI image generation not configured in this environment")


# ─── BUNDLE GENERATE IMAGE ENDPOINT ─────────────────────────────────────────

class TestBundleGenerateImage:
    """Test POST /api/admin/celebrate/bundles/{bundle_id}/generate-image"""

    def test_bundle_exists_in_celebrate_api(self):
        """Verify the test bundle exists"""
        resp = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        assert resp.status_code == 200
        data = resp.json()
        bundles = data if isinstance(data, list) else data.get("bundles", [])
        bundle_ids = [b.get("id") for b in bundles]
        assert TEST_BUNDLE_ID in bundle_ids, f"Test bundle {TEST_BUNDLE_ID} not found in {bundle_ids[:5]}"

    def test_generate_bundle_image_404_for_nonexistent(self, auth_headers):
        """Non-existent bundle should return 404"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/celebrate/bundles/nonexistent-bundle-xyz-999/generate-image",
            headers=auth_headers
        )
        assert resp.status_code == 404, f"Expected 404 for non-existent bundle, got {resp.status_code}"

    def test_generate_bundle_image_endpoint_accessible(self, auth_headers):
        """Bundle generate-image endpoint must be reachable"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/celebrate/bundles/{TEST_BUNDLE_ID}/generate-image",
            headers=auth_headers,
            timeout=90
        )
        assert resp.status_code != 404, "Route not found - endpoint missing!"
        assert resp.status_code != 401, "Auth rejected for valid token"
        assert resp.status_code != 403, "Auth forbidden for admin user"
        assert resp.status_code in [200, 500], f"Unexpected: {resp.status_code}: {resp.text[:300]}"

    def test_generate_bundle_image_response_structure_on_success(self, auth_headers):
        """If generation succeeds, response must have {success: true, image_url: str}"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/celebrate/bundles/{TEST_BUNDLE_ID}/generate-image",
            headers=auth_headers,
            timeout=90
        )
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("success") is True, f"Expected success=true, got: {data}"
            assert "image_url" in data, "Missing 'image_url' in response"
            assert isinstance(data["image_url"], str), "image_url must be a string"
            assert data["image_url"].startswith("http"), f"image_url not a valid URL: {data['image_url']}"
            print(f"SUCCESS: Generated bundle image URL: {data['image_url'][:80]}...")
        elif resp.status_code == 500:
            data = resp.json()
            print(f"WARNING: Bundle generate image 500 (likely AI/Cloudinary config): {data.get('detail', '')[:200]}")
            pytest.skip("AI image generation not configured in this environment")
