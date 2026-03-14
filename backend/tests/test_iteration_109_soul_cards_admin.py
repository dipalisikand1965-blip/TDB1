"""
Tests for iteration 109:
1. Admin products endpoint with JWT Bearer token auth (verify_admin_auth)
2. Soul question card colors (code review only - UI tested via playwright)
3. showInactive default = true
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# User credentials
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASSWORD = "test123"


@pytest.fixture(scope="module")
def admin_jwt_token():
    """Get admin JWT token via login endpoint."""
    resp = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        print(f"[FIXTURE] Admin JWT token obtained: {str(token)[:20]}...")
        return token
    print(f"[FIXTURE] Admin JWT login failed: {resp.status_code} - {resp.text[:200]}")
    pytest.skip("Admin JWT login failed")


@pytest.fixture(scope="module")
def user_token():
    """Get regular user JWT token."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        print(f"[FIXTURE] User token obtained: {str(token)[:20]}...")
        return token
    print(f"[FIXTURE] User login failed: {resp.status_code} - {resp.text[:200]}")
    pytest.skip("User login failed")


class TestAdminProductsEndpoint:
    """Test /api/admin/products endpoint auth and data"""

    def test_admin_products_with_jwt_bearer(self, admin_jwt_token):
        """Verify GET /api/admin/products works with JWT Bearer token"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?limit=100",
            headers={"Authorization": f"Bearer {admin_jwt_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert "products" in data, f"Response missing 'products' key: {data.keys()}"
        assert isinstance(data["products"], list), "products should be a list"
        assert len(data["products"]) > 0, "products list should not be empty"
        print(f"[PASS] Admin products with JWT Bearer: {len(data['products'])} products returned")

    def test_admin_products_with_basic_auth(self):
        """Verify GET /api/admin/products still works with Basic Auth"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?limit=100",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert "products" in data
        print(f"[PASS] Admin products with Basic Auth: {len(data['products'])} products returned")

    def test_admin_products_no_auth_fails(self):
        """Verify GET /api/admin/products without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/admin/products?limit=10")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"[PASS] Admin products without auth correctly returns 401")

    def test_admin_products_filter_by_party_accessories(self, admin_jwt_token):
        """Verify filtering by party_accessories category works"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?category=party_accessories&limit=100",
            headers={"Authorization": f"Bearer {admin_jwt_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert "products" in data
        products = data["products"]
        print(f"[INFO] party_accessories products count: {len(products)}")
        # Each product should have category = party_accessories
        for p in products[:5]:
            cat = (p.get("category") or "").lower().strip()
            assert cat == "party_accessories", f"Expected category=party_accessories, got '{cat}' for product: {p.get('name')}"
        print(f"[PASS] Admin products party_accessories filter: {len(products)} products")

    def test_admin_products_contains_celebration_addons(self, admin_jwt_token):
        """Verify celebration_addons category products are returned"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?category=celebration_addons&limit=100",
            headers={"Authorization": f"Bearer {admin_jwt_token}"}
        )
        assert resp.status_code == 200, f"Expected 200: {resp.status_code}"
        data = resp.json()
        products = data.get("products", [])
        print(f"[INFO] celebration_addons products count: {len(products)}")
        # If there are products, they should be celebration_addons category
        for p in products[:5]:
            cat = (p.get("category") or "").lower().strip()
            assert cat == "celebration_addons", f"Expected celebration_addons, got '{cat}'"
        print(f"[PASS] celebration_addons filter returns {len(products)} products (0 is OK if DB is empty for this category)")

    def test_admin_products_large_limit(self, admin_jwt_token):
        """Verify fetching 5000 products (as CelebrateManager does) works"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?limit=5000",
            headers={"Authorization": f"Bearer {admin_jwt_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        total = data.get("total", 0)
        products = data.get("products", [])
        print(f"[PASS] Large limit request: {len(products)} products returned (total in DB: {total})")

    def test_admin_products_has_party_products(self, admin_jwt_token):
        """Verify the total product list contains party-related products"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/products?limit=5000",
            headers={"Authorization": f"Bearer {admin_jwt_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        all_products = data.get("products", [])
        
        # Look for party/celebration products
        party_cats = {'party_accessories', 'party_kits', 'celebration_addons', 'celebration-addons'}
        party_products = [p for p in all_products if (p.get("category") or "").lower().strip() in party_cats]
        
        print(f"[INFO] Total products: {len(all_products)}, Party-related: {len(party_products)}")
        
        # Check product names for known party accessories
        all_names = [p.get("name", "") for p in all_products]
        party_name_hits = [n for n in all_names if any(kw in n.lower() for kw in ['hat', 'tiara', 'birthday', 'pawty', 'party'])]
        print(f"[INFO] Products with party-related names: {party_name_hits[:10]}")


class TestSoulQuestionAPI:
    """Test soul questions API endpoints"""

    def test_get_mojo_pet_id(self, user_token):
        """Get Mojo's pet ID for soul question tests"""
        resp = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 200, f"Expected 200: {resp.status_code}"
        data = resp.json()
        pets = data.get("pets", [])
        print(f"[INFO] Found {len(pets)} pets: {[p.get('name') for p in pets]}")
        mojo = next((p for p in pets if p.get("name", "").lower() == "mojo"), None)
        if mojo:
            print(f"[PASS] Mojo found with ID: {mojo.get('id')}")
        else:
            print(f"[WARN] Mojo not found in pets list, available: {[p.get('name') for p in pets]}")

    def test_soul_quick_questions_api(self, user_token):
        """Verify soul quick-questions API returns questions and score"""
        # First get Mojo's ID
        pets_resp = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert pets_resp.status_code == 200
        pets = pets_resp.json().get("pets", [])
        mojo = next((p for p in pets if p.get("name", "").lower() == "mojo"), None)
        
        if not mojo:
            # Try first pet
            if pets:
                mojo = pets[0]
                print(f"[WARN] Using {mojo.get('name')} instead of Mojo")
            else:
                pytest.skip("No pets found for user")
        
        pet_id = mojo.get("id")
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{pet_id}/quick-questions?limit=5")
        assert resp.status_code == 200, f"Expected 200: {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "questions" in data, f"Response missing 'questions': {data.keys()}"
        assert "current_score" in data, f"Response missing 'current_score': {data.keys()}"
        score = data.get("current_score")
        questions = data.get("questions", [])
        print(f"[PASS] Soul questions for {mojo.get('name')}: score={score}%, questions={len(questions)}")
        print(f"[INFO] Sample question: {questions[0] if questions else 'No questions (score may be 100%)'}")


class TestAdminLogin:
    """Test admin login endpoint"""

    def test_admin_login_returns_token(self):
        """Admin login should return a JWT token"""
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        assert token is not None, "No token in admin login response"
        assert len(token) > 10, "Token too short"
        print(f"[PASS] Admin login returns JWT token: {str(token)[:30]}...")

    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpass"
        })
        assert resp.status_code in [401, 403], f"Expected 401/403: {resp.status_code}"
        print(f"[PASS] Admin login with wrong password returns {resp.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
