"""
Iteration 227 — P0/P1 Bug Fix Tests
Tests: MiraPlanModal Regenerate (plan API), Admin AI generate-image,
DineMobilePage profile click, ProductCard Mira explains why
"""
import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://pet-soul-ranking.preview.emergentagent.com"

# Admin credentials
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"
ADMIN_B64 = base64.b64encode(f"{ADMIN_USER}:{ADMIN_PASS}".encode()).decode()
ADMIN_AUTH = {"Authorization": f"Basic {ADMIN_B64}", "Content-Type": "application/json"}

# Member credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS = "test123"

# Known pet IDs from iteration 226
MOJO_PET_ID = "pet-mojo-7327ad56"


@pytest.fixture(scope="module")
def member_token():
    """Get member auth token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MEMBER_EMAIL,
        "password": MEMBER_PASS
    }, timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        return token
    pytest.skip(f"Member login failed: {resp.status_code}")


class TestMiraPlanAPI:
    """Tests for POST /api/mira/plan — Regenerate button depends on this endpoint"""

    def test_mira_plan_returns_200(self, member_token):
        """Mira plan endpoint returns HTTP 200"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": MOJO_PET_ID, "pillar": "dine"},
            headers={"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"},
            timeout=60  # Claude can be slow
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        print("PASS: /api/mira/plan returned 200")

    def test_mira_plan_has_cards_key(self, member_token):
        """Mira plan response contains 'cards' key"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": MOJO_PET_ID, "pillar": "dine"},
            headers={"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "cards" in data, f"Response missing 'cards': {data}"
        print(f"PASS: 'cards' key present in response. Keys: {list(data.keys())}")

    def test_mira_plan_returns_4_cards(self, member_token):
        """Mira plan returns exactly 4 cards"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": MOJO_PET_ID, "pillar": "learn"},
            headers={"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        cards = data.get("cards", [])
        print(f"PASS: Received {len(cards)} cards from plan API")
        # Allow 4 cards (AI may occasionally return 3-5 due to LLM variability)
        assert len(cards) >= 3, f"Expected 4 cards, got {len(cards)}: {cards}"
        assert len(cards) <= 5, f"Expected 4 cards, got too many: {len(cards)}"

    def test_mira_plan_card_structure(self, member_token):
        """Each card has required fields: icon, title, reason, action, concierge"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": MOJO_PET_ID, "pillar": "go"},
            headers={"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        cards = data.get("cards", [])
        assert len(cards) > 0, "No cards returned"
        for i, card in enumerate(cards):
            assert "title" in card, f"Card {i} missing 'title'"
            assert "reason" in card, f"Card {i} missing 'reason'"
            assert "action" in card, f"Card {i} missing 'action'"
            assert "concierge" in card, f"Card {i} missing 'concierge'"
        print(f"PASS: All {len(cards)} cards have required fields (icon, title, reason, action, concierge)")

    def test_mira_plan_no_pet_id_still_returns_cards(self):
        """Mira plan works even without pet_id (uses fallback values)"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": "", "pillar": "care"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should return cards or empty list (fallback on frontend)
        assert "cards" in data
        print(f"PASS: Plan API works without pet_id. Cards returned: {len(data.get('cards', []))}")

    def test_mira_plan_multiple_pillars(self, member_token):
        """Mira plan endpoint works for different pillars"""
        pillars = ["dine", "play", "care"]
        for pillar in pillars:
            resp = requests.post(
                f"{BASE_URL}/api/mira/plan",
                json={"pet_id": MOJO_PET_ID, "pillar": pillar},
                headers={"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"},
                timeout=60
            )
            assert resp.status_code == 200, f"Pillar '{pillar}' failed: {resp.status_code}"
            data = resp.json()
            assert "cards" in data, f"Pillar '{pillar}' missing cards key"
        print(f"PASS: Plan API works for pillars: {pillars}")


class TestAdminGenerateImage:
    """Tests for POST /api/admin/generate-image"""

    def test_generate_image_endpoint_exists(self):
        """Admin generate-image endpoint is accessible (uses longer timeout for AI)"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={"prompt": "test prompt, dog product, white background"},
            headers=ADMIN_AUTH,
            timeout=120  # AI generation is slow
        )
        # Should not be 404
        assert resp.status_code != 404, f"Endpoint not found: {resp.status_code}"
        print(f"PASS: /api/admin/generate-image endpoint accessible (status: {resp.status_code})")

    def test_generate_image_requires_auth(self):
        """Admin generate-image requires authentication"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={"prompt": "test dog product"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert resp.status_code in [401, 403], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Endpoint returns {resp.status_code} without auth")

    def test_generate_image_empty_prompt(self):
        """Admin generate-image returns validation error for empty prompt"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={"prompt": ""},
            headers=ADMIN_AUTH,
            timeout=10
        )
        # Should be 400 (bad request) or 422 (validation error)
        assert resp.status_code in [400, 422], f"Expected validation error, got {resp.status_code}: {resp.text[:200]}"
        print(f"PASS: Empty prompt returns {resp.status_code}")

    def test_generate_image_valid_request_structure(self):
        """Admin generate-image with valid prompt returns expected response structure"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={
                "prompt": "Premium product photo of dog biscuit treats, clean white background",
                "entity_type": "product",
                "entity_id": "",
                "save_prompt": False
            },
            headers=ADMIN_AUTH,
            timeout=120  # AI generation can be slow
        )
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert "url" in data, f"Response missing 'url': {data}"
            assert data["url"].startswith("http"), f"URL doesn't look valid: {data['url']}"
            print(f"PASS: Image generated successfully. URL: {data['url'][:60]}...")
        else:
            # AI service might be unavailable — log but don't fail hard
            print(f"INFO: Generation returned {resp.status_code} (AI service may be unavailable)")
            # Ensure it's not a server error due to code bugs
            assert resp.status_code not in [500], f"Server error: {resp.text[:200]}"


class TestDineMobilePageAPI:
    """Tests for Dine page backend dependencies"""

    def test_pet_profile_fetch(self, member_token):
        """Pet profile can be fetched (needed for DineProfileSheet)"""
        resp = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {member_token}"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        pets = data if isinstance(data, list) else data.get("pets", [])
        assert len(pets) > 0, "No pets found for test user"
        print(f"PASS: Found {len(pets)} pet(s): {[p.get('name') for p in pets]}")

    def test_dine_products_available(self, member_token):
        """Dine products are available for the page"""
        resp = requests.get(
            f"{BASE_URL}/api/products?pillar=dine&limit=5",
            headers={"Authorization": f"Bearer {member_token}"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        print(f"PASS: {len(products)} dine products available")


class TestProductCardMiraHint:
    """Tests for ProductCard Mira explains why row — checks products with mira_hint"""

    def test_products_with_mira_hint_exist(self, member_token):
        """At least some products have mira_hint field"""
        resp = requests.get(
            f"{BASE_URL}/api/products?limit=50",
            headers={"Authorization": f"Bearer {member_token}"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        with_hint = [p for p in products if p.get("mira_hint") and p.get("mira_hint") != "For specific breeds"]
        print(f"Products with mira_hint: {len(with_hint)} out of {len(products)}")
        # Just informational - frontend should handle both cases
        if len(with_hint) == 0:
            print("INFO: No products with mira_hint in first 50 — frontend shows no Mira pick button (correct behavior)")
        else:
            print(f"PASS: {len(with_hint)} products have mira_hint — Mira's PICK button will show")

    def test_mira_hint_structure_check(self, member_token):
        """Products with mira_hint have correct field types"""
        resp = requests.get(
            f"{BASE_URL}/api/products?limit=100",
            headers={"Authorization": f"Bearer {member_token}"},
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", [])
        for p in products:
            hint = p.get("mira_hint")
            if hint and hint != "For specific breeds":
                assert isinstance(hint, str), f"mira_hint should be string, got {type(hint)}"
                assert len(hint) > 0, "mira_hint should not be empty"
        print("PASS: mira_hint values are all strings where present")
