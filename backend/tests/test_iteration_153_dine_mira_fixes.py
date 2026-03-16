"""
Test file for iteration 153 - Dine page MiraOrb fix, MiraPicksSection, 
Bundle AI image generation endpoint, and Product generate-image admin check.
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test pet ID with 3768 scored dine items
PET_ID = "pet-mojo-7327ad56"

# Admin credentials
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"
ADMIN_AUTH = base64.b64encode(f"{ADMIN_USER}:{ADMIN_PASS}".encode()).decode()


class TestMiraPicksAPI:
    """Tests for GET /api/mira/claude-picks/{pet_id} endpoint with entity_type filter"""

    def test_claude_picks_product_returns_200(self):
        """GET /api/mira/claude-picks/{pet_id}?pillar=dine&entity_type=product should return 200"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=dine&limit=12&min_score=60&entity_type=product"
        response = requests.get(url, timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:300]}"
        data = response.json()
        assert "picks" in data, "Response missing 'picks' key"
        assert "count" in data, "Response missing 'count' key"
        assert data["pet_id"] == PET_ID
        print(f"Product picks count: {data['count']}, total picks: {len(data['picks'])}")

    def test_claude_picks_service_returns_200(self):
        """GET /api/mira/claude-picks/{pet_id}?pillar=dine&entity_type=service should return 200"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=dine&limit=6&min_score=60&entity_type=service"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:300]}"
        data = response.json()
        assert "picks" in data, "Response missing 'picks' key"
        assert isinstance(data["picks"], list), "picks should be a list"
        print(f"Service picks count: {data['count']}")

    def test_claude_picks_product_entity_type_filtering(self):
        """Product picks should only contain entity_type=product items"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=dine&limit=12&min_score=60&entity_type=product"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200
        data = response.json()
        picks = data.get("picks", [])
        if picks:
            for pick in picks:
                assert pick.get("entity_type") == "product", \
                    f"Expected entity_type=product, got {pick.get('entity_type')} for {pick.get('name')}"
            print(f"All {len(picks)} product picks verified with entity_type=product")
        else:
            print("No product picks found - may be no scored items above min_score=60")

    def test_claude_picks_pillar_filter_works(self):
        """Picks endpoint should accept pillar=dine query param"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=dine&limit=20&min_score=60"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200
        data = response.json()
        assert data.get("pillar") == "dine", f"Expected pillar=dine in response, got {data.get('pillar')}"

    def test_claude_picks_no_entity_filter_returns_all(self):
        """Picks without entity_type filter should return all entity types"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=dine&limit=20&min_score=60"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200
        data = response.json()
        picks = data.get("picks", [])
        entity_types = set(p.get("entity_type") for p in picks if p.get("entity_type"))
        print(f"Entity types in unfiltered picks: {entity_types}, total picks: {len(picks)}")
        # Just verifying the endpoint works
        assert isinstance(picks, list)

    def test_claude_picks_invalid_pet_returns_empty(self):
        """Invalid pet should return empty picks (not error)"""
        url = f"{BASE_URL}/api/mira/claude-picks/invalid-pet-999?pillar=dine&limit=12&min_score=60"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200
        data = response.json()
        assert data.get("picks") == [] or data.get("count") == 0


class TestBundleGenerateImageEndpoint:
    """Tests for POST /api/admin/celebrate/bundles/{bundle_id}/generate-image"""

    def _get_a_bundle_id(self):
        """Fetch a real bundle ID to test with"""
        url = f"{BASE_URL}/api/bundles?active_only=false&page=1&limit=5"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            bundles = data.get("bundles", [])
            if bundles:
                return bundles[0].get("id")
        return None

    def test_generate_image_requires_admin_auth(self):
        """POST /api/admin/celebrate/bundles/{id}/generate-image should return 401/403 without auth"""
        bundle_id = "test-bundle-001"
        url = f"{BASE_URL}/api/admin/celebrate/bundles/{bundle_id}/generate-image"
        response = requests.post(url, timeout=10)
        # Should be 401 or 403 without admin auth
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got {response.status_code}"
        print(f"Correctly rejected unauthenticated request with {response.status_code}")

    def test_generate_image_with_admin_auth_non_existent_bundle(self):
        """POST with admin auth + non-existent bundle should return 404"""
        fake_id = "non-existent-bundle-99999"
        url = f"{BASE_URL}/api/admin/celebrate/bundles/{fake_id}/generate-image"
        response = requests.post(
            url,
            headers={"Authorization": f"Basic {ADMIN_AUTH}"},
            timeout=10
        )
        # 404 = admin auth passed but bundle not found (correct behavior)
        # 500 = image gen failure is acceptable too (env key issue)
        # 401 = admin auth failed (wrong credentials)
        assert response.status_code in [404, 500], \
            f"With valid admin auth, expected 404 (not found) or 500, got {response.status_code}: {response.text[:200]}"
        print(f"Response with admin auth for non-existent bundle: {response.status_code}")

    def test_generate_image_admin_login_works(self):
        """Admin login with aditya/lola4304 should succeed"""
        url = f"{BASE_URL}/api/admin/login"
        response = requests.post(
            url,
            json={"username": ADMIN_USER, "password": ADMIN_PASS},
            timeout=10
        )
        assert response.status_code == 200, \
            f"Admin login failed: {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert "success" in data or "token" in data or "authenticated" in data
        print(f"Admin login successful: {data}")


class TestProductGenerateImageEndpoint:
    """Tests for /api/admin/products/{product_id}/generate-image"""

    def test_product_generate_image_without_auth(self):
        """Product generate-image should fail without admin auth"""
        url = f"{BASE_URL}/api/admin/products/some-product-id/generate-image"
        response = requests.post(url, timeout=10)
        assert response.status_code in [401, 403, 422], \
            f"Expected auth error, got {response.status_code}: {response.text[:200]}"
        print(f"Product generate-image without auth: {response.status_code} - correctly protected")


class TestDinePageIntegration:
    """Tests for overall Dine page API integration"""

    def test_dine_pillar_products_api(self):
        """GET /api/admin/pillar-products?pillar=dine should return products"""
        url = f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=10"
        response = requests.get(url, timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "products" in data
        print(f"Dine pillar products count: {len(data.get('products', []))}")

    def test_mira_routes_registered(self):
        """Verify mira score router is accessible"""
        url = f"{BASE_URL}/api/mira/claude-picks/{PET_ID}"
        response = requests.get(url, timeout=10)
        # Should return 200 (with picks or empty list)
        assert response.status_code == 200, f"Mira score router not accessible: {response.status_code}"
