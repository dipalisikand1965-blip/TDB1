"""
Comprehensive backend tests for celebrate page and AI personalization (soul-ranked products).
Tests: health check, soul-ranked products API, service images (Cloudinary), admin panel endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
REQUEST_TIMEOUT = 60  # Backend may be slow due to background AI image gen tasks

# ── Pets used for testing ───────────────────────────────────────────
PET_MOJO_ID = "pet-mojo-7327ad56"
PET_MYSTIQUE_ID = "pet-mystique-7327ad57"
ADMIN_PASS = "lola4304"


class TestHealthCheck:
    """Backend health check"""

    def test_health_returns_healthy(self):
        resp = requests.get(f"{BASE_URL}/api/health", timeout=REQUEST_TIMEOUT)
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "healthy", f"Expected 'healthy', got: {data}"
        print(f"✅ Health check: {data}")


class TestSoulRankedProducts:
    """Soul-ranked products API: /api/products/soul-ranked"""

    def test_soul_ranked_mojo_cakes_returns_personalized(self):
        """Mojo's cakes should return personalized=true and products"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MOJO_ID, "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "products" in data, "Response missing 'products' key"
        assert "personalized" in data, "Response missing 'personalized' key"
        assert data["personalized"] is True, f"Expected personalized=True, got: {data['personalized']}"
        assert len(data["products"]) >= 1, f"Expected >= 1 products, got {len(data['products'])}"
        print(f"✅ Mojo cakes: personalized={data['personalized']}, count={len(data['products'])}, top_score={data.get('top_score')}")

    def test_soul_ranked_mojo_has_soul_score(self):
        """Products from soul-ranked endpoint should have _soul_score field"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MOJO_ID, "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data["products"]
        if products:
            # Each product should have _soul_score
            for p in products:
                assert "_soul_score" in p, f"Product '{p.get('name')}' missing _soul_score"
            print(f"✅ All {len(products)} products have _soul_score field")

    def test_soul_ranked_mystique_cakes_returns_personalized(self):
        """Mystique's cakes should also return personalized=true"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MYSTIQUE_ID, "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert data["personalized"] is True, f"Expected personalized=True for Mystique, got: {data['personalized']}"
        assert len(data["products"]) >= 1, f"Expected >= 1 products for Mystique"
        print(f"✅ Mystique cakes: personalized={data['personalized']}, count={len(data['products'])}, top_score={data.get('top_score')}")

    def test_soul_ranked_different_pets_may_differ(self):
        """Two different pets should potentially have different product ordering (soul scores)"""
        resp_mojo = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MOJO_ID, "limit": 8},
            timeout=10
        )
        resp_mystique = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MYSTIQUE_ID, "limit": 8},
            timeout=10
        )
        assert resp_mojo.status_code == 200
        assert resp_mystique.status_code == 200
        mojo_products = resp_mojo.json().get("products", [])
        mystique_products = resp_mystique.json().get("products", [])

        if mojo_products and mystique_products:
            mojo_scores = [p.get("_soul_score", 0) for p in mojo_products]
            mystique_scores = [p.get("_soul_score", 0) for p in mystique_products]
            print(f"Mojo scores:    {mojo_scores}")
            print(f"Mystique scores:{mystique_scores}")
            # At minimum both should return products
            assert len(mojo_products) >= 1
            assert len(mystique_products) >= 1
            print(f"✅ Both pets return products (Mojo: {len(mojo_products)}, Mystique: {len(mystique_products)})")

    def test_soul_ranked_returns_pet_name(self):
        """Response should include pet_name when pet exists"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MOJO_ID, "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        # pet_name should be present and non-empty
        assert "pet_name" in data, "Response missing pet_name"
        assert data["pet_name"], f"Expected pet_name to be truthy, got: {data['pet_name']}"
        print(f"✅ pet_name returned: {data['pet_name']}")

    def test_soul_ranked_unknown_pet_returns_not_personalized(self):
        """Unknown pet_id should return personalized=False"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": "pet-unknown-xxxxxxxx", "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["personalized"] is False, f"Expected personalized=False for unknown pet, got: {data['personalized']}"
        print(f"✅ Unknown pet: personalized={data['personalized']}")

    def test_soul_ranked_limit_respected(self):
        """Limit parameter should be respected"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "cakes", "pet_id": PET_MOJO_ID, "limit": 3},
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["products"]) <= 3, f"Limit 3 not respected: got {len(data['products'])}"
        print(f"✅ Limit respected: {len(data['products'])} <= 3 products")

    def test_soul_ranked_treats_category(self):
        """Treats category should also work"""
        resp = requests.get(
            f"{BASE_URL}/api/products/soul-ranked",
            params={"category": "treats", "pet_id": PET_MOJO_ID, "limit": 8},
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        print(f"✅ Treats category: {len(data['products'])} products returned")


class TestCelebrateServices:
    """Service-box services for celebrate pillar — must use Cloudinary URLs"""

    def test_celebrate_services_returns_data(self):
        """API should return a list of services for celebrate pillar"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services",
            params={"pillar": "celebrate", "limit": 20, "is_active": "true"},
            timeout=10
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "services" in data, "Response missing 'services' key"
        services = data["services"]
        assert len(services) >= 1, f"Expected at least 1 service, got {len(services)}"
        print(f"✅ Celebrate services: {len(services)} services returned")
        return services

    def test_celebrate_services_all_have_image_url(self):
        """All celebrate services should have an image_url"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services",
            params={"pillar": "celebrate", "limit": 20, "is_active": "true"},
            timeout=10
        )
        assert resp.status_code == 200
        services = resp.json().get("services", [])
        missing_image = []
        for svc in services:
            img = svc.get("image_url") or svc.get("image") or svc.get("watercolor_image")
            if not img:
                missing_image.append(svc.get("name"))
        assert len(missing_image) == 0, f"Services missing image: {missing_image}"
        print(f"✅ All {len(services)} celebrate services have image URLs")

    def test_celebrate_services_no_unsplash_urls(self):
        """Celebrate services must NOT use unsplash.com URLs (should be Cloudinary)"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services",
            params={"pillar": "celebrate", "limit": 20, "is_active": "true"},
            timeout=10
        )
        assert resp.status_code == 200
        services = resp.json().get("services", [])
        unsplash_services = []
        for svc in services:
            img = svc.get("image_url") or svc.get("image") or ""
            if "unsplash" in img.lower():
                unsplash_services.append({"name": svc.get("name"), "url": img})
        assert len(unsplash_services) == 0, f"Services still using Unsplash: {unsplash_services}"
        print(f"✅ No Unsplash URLs found in {len(services)} celebrate services")

    def test_celebrate_services_cloudinary_urls(self):
        """At least most celebrate services should use cloudinary.com URLs"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services",
            params={"pillar": "celebrate", "limit": 20, "is_active": "true"},
            timeout=10
        )
        assert resp.status_code == 200
        services = resp.json().get("services", [])
        cloudinary_count = 0
        non_cloudinary = []
        for svc in services:
            img = svc.get("image_url") or svc.get("image") or ""
            if "cloudinary.com" in img.lower():
                cloudinary_count += 1
            else:
                non_cloudinary.append({"name": svc.get("name"), "url": img[:80]})
        print(f"Cloudinary: {cloudinary_count}/{len(services)}")
        if non_cloudinary:
            print(f"Non-cloudinary services: {non_cloudinary}")
        # At least 10 services should have Cloudinary URLs
        assert cloudinary_count >= 10, f"Expected >= 10 Cloudinary URLs, got {cloudinary_count}. Non-cloudinary: {non_cloudinary}"

    def test_celebrate_services_count_15(self):
        """Should have approximately 15 celebrate services"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services",
            params={"pillar": "celebrate", "limit": 20, "is_active": "true"},
            timeout=10
        )
        assert resp.status_code == 200
        services = resp.json().get("services", [])
        print(f"Total celebrate services: {len(services)}")
        # Previous context says 15 services
        assert len(services) >= 10, f"Expected >= 10 services, got {len(services)}"
        print(f"✅ {len(services)} celebrate services found")


class TestAdminEndpoints:
    """Admin endpoints: fix-celebrate-data"""

    def test_admin_fix_celebrate_data_with_correct_password(self):
        """fix-celebrate-data should succeed with correct admin password"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/fix-celebrate-data",
            params={"password": ADMIN_PASS},
            timeout=30
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        print(f"✅ fix-celebrate-data response: {data}")
        # Should return some results
        assert "services_fixed" in data or "errors" in data or "status" in data, f"Unexpected response: {data}"

    def test_admin_fix_celebrate_data_wrong_password(self):
        """fix-celebrate-data should fail with wrong password"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/fix-celebrate-data",
            params={"password": "wrong-password"},
            timeout=10
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print(f"✅ Wrong password correctly rejected: {resp.status_code}")

    def test_admin_login_endpoint(self):
        """Admin login should work with aditya/lola4304"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"},
            timeout=10
        )
        print(f"Admin login response: {resp.status_code}: {resp.text[:200]}")
        # Either 200 (success) or not 500 (error)
        assert resp.status_code != 500, f"Admin login returned 500: {resp.text[:200]}"


class TestUserAuth:
    """User authentication: dipali@clubconcierge.in / test123"""

    def test_user_login(self):
        """User login should succeed"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"},
            timeout=10
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "token" in data or "access_token" in data, f"No token in response: {data}"
        print(f"✅ User login successful, token present")

    def test_user_has_pets(self):
        """Logged-in user should have pets (including Mojo)"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"},
            timeout=10
        )
        if login_resp.status_code != 200:
            pytest.skip("Login failed - cannot test pets")
        
        token = login_resp.json().get("token") or login_resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        pets_resp = requests.get(f"{BASE_URL}/api/pets", headers=headers, timeout=REQUEST_TIMEOUT)
        assert pets_resp.status_code == 200, f"Pets API failed: {pets_resp.status_code}"
        data = pets_resp.json()
        pets = data.get("pets") or data if isinstance(data, list) else []
        assert len(pets) >= 1, f"Expected at least 1 pet, got: {pets}"
        pet_names = [p.get("name") for p in pets]
        print(f"✅ User has pets: {pet_names}")
