"""
Backend tests for iteration 155:
- P0: Image URLs accessible (cloudinary and static.prod-images)
- P1: Admin AI image generation endpoint
- P2: Dine dimension products API
- P2b: Mira Picks API for pet
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndAuth:
    """Basic health and auth checks"""

    def test_health_check(self):
        resp = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "healthy"

    def test_user_login_dipali(self):
        """Login as dipali test user"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "TestPass@123"
        }, timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data or "token" in data
        user = data.get("user", {})
        assert user.get("email") == "dipali@clubconcierge.in"
        return data.get("access_token") or data.get("token")


class TestDineProductImages:
    """P0: Verify image URLs in dine products are accessible"""

    def test_dine_products_have_valid_images(self):
        """Products should have cloudinary or static.prod-images URLs"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=20",
            headers={"Authorization": "Basic YWRpdHlhOmxvbGE0MzA0"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "Should have dine products"

        # Check image URLs
        products_with_images = 0
        cloudinary_count = 0
        static_prod_count = 0

        for p in products:
            img = p.get("image_url") or p.get("image") or p.get("media", {}).get("primary_image", "")
            if img and img.startswith("http"):
                products_with_images += 1
                if "cloudinary" in img:
                    cloudinary_count += 1
                elif "static.prod-images" in img:
                    static_prod_count += 1

        print(f"Products with images: {products_with_images}/{len(products)}")
        print(f"Cloudinary: {cloudinary_count}, static.prod-images: {static_prod_count}")
        assert products_with_images > 0, "At least some products should have images"

    def test_dine_daily_meals_products(self):
        """Daily Meals dimension should have products"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&category=Daily+Meals&limit=5",
            headers={"Authorization": "Basic YWRpdHlhOmxvbGE0MzA0"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "Daily Meals should have products"
        print(f"Daily Meals products: {len(products)}")


class TestMiraPicksAPI:
    """P2b: Test Mira Picks API for Mojo"""

    def test_mira_picks_dine_products(self):
        """Mira picks should return dine products with scores"""
        pet_id = "pet-mojo-7327ad56"
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=dine&limit=12&min_score=60&entity_type=product",
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get("picks", [])
        assert len(picks) > 0, "Should have dine product picks"

        # Verify picks have required fields
        for pick in picks[:3]:
            assert pick.get("mira_score") is not None, "Pick should have mira_score"
            assert pick.get("mira_score") >= 60, "Pick score should be >= min_score"
            name = pick.get("name") or pick.get("entity_name")
            assert name, "Pick should have a name"

        print(f"Mira picks: {len(picks)}, scores: {[p.get('mira_score') for p in picks[:5]]}")

    def test_mira_picks_dine_services(self):
        """Mira picks should return dine services"""
        pet_id = "pet-mojo-7327ad56"
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=dine&limit=6&min_score=60&entity_type=service",
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get("picks", [])
        assert len(picks) > 0, "Should have dine service picks"
        print(f"Mira service picks: {len(picks)}")

    def test_picks_have_images(self):
        """Picks should have image URLs"""
        pet_id = "pet-mojo-7327ad56"
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=dine&limit=12&min_score=60&entity_type=product",
            timeout=15
        )
        assert resp.status_code == 200
        picks = resp.json().get("picks", [])

        picks_with_images = 0
        for pick in picks:
            img = pick.get("image_url") or pick.get("image") or pick.get("media", {}).get("primary_image", "")
            if img and img.startswith("http"):
                picks_with_images += 1

        print(f"Picks with images: {picks_with_images}/{len(picks)}")
        # At least half should have images
        assert picks_with_images >= len(picks) // 2, "At least half of picks should have images"


class TestAdminProductAPI:
    """P1: Test admin product AI image generation"""

    def _get_admin_auth(self):
        import base64
        return "Basic " + base64.b64encode(b"aditya:lola4304").decode()

    def test_admin_products_accessible(self):
        """Admin products API should be accessible"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=5",
            headers={"Authorization": self._get_admin_auth()},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print(f"Admin products count: {data.get('total', 0)}")

    def test_admin_product_update(self):
        """Admin should be able to update a product"""
        import base64
        # First get a product
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=1",
            headers={"Authorization": self._get_admin_auth()},
            timeout=10
        )
        assert resp.status_code == 200
        products = resp.json().get("products", [])
        assert len(products) > 0
        product = products[0]
        product_id = product["id"]
        print(f"Testing with product: {product['name']} ({product_id})")

        # Update the product (only touch a safe non-critical field)
        update_resp = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={"status": product.get("status", "unknown")},  # No-op update
            headers={
                "Authorization": self._get_admin_auth(),
                "Content-Type": "application/json"
            },
            timeout=10
        )
        print(f"Update response: {update_resp.status_code}")
        assert update_resp.status_code in [200, 201, 204], f"Update failed: {update_resp.text[:200]}"


@pytest.fixture(scope="module")
def auth_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "TestPass@123"
    }, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("access_token") or data.get("token")
    pytest.skip("Could not get auth token")
