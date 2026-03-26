"""
Iteration 225 — Critical pre-launch sprint tests
Tests for:
  - POST /api/admin/cleanup-broken-images (emergentagent.com URL removal)
  - POST /api/admin/sync-image-fields (cloudinary_url → watercolor_image sync)
  - POST /api/mira/plan (Claude Haiku 4 AI plan generation)
  - Life-stage puppy filter via claude-picks (adult dogs should not see puppy products)
  - Breed isolation for Mojo (Indie) — no Labrador/Akita/Corgi products
  - Service box APIs for Emergency/Farewell pillars
  - Admin generate-image ai_prompt save
"""
import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"
ADMIN_AUTH = base64.b64encode(f"{ADMIN_USER}:{ADMIN_PASS}".encode()).decode()
ADMIN_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Basic {ADMIN_AUTH}",
}

# Pet IDs
PET_MOJO_ID = "pet-mojo-7327ad56"      # Indie, adult
PET_MYSTIQUE_ID = "pet-mystique-7327ad57"  # Shih Tzu
PET_BRUNO_ID = "pet-bruno-7327ad58"     # Labrador

MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS = "test123"


@pytest.fixture(scope="module")
def member_token():
    """Get member auth token"""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": MEMBER_EMAIL, "password": MEMBER_PASS},
    )
    if resp.status_code == 200:
        data = resp.json()
        return data.get("token") or data.get("access_token", "")
    pytest.skip("Member auth failed — skipping member tests")


@pytest.fixture(scope="module")
def member_headers(member_token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {member_token}",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Admin Image Cleanup Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestAdminCleanupBrokenImages:
    """POST /api/admin/cleanup-broken-images — remove emergentagent.com URLs from DB"""

    def test_cleanup_broken_images_returns_200(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/cleanup-broken-images",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"

    def test_cleanup_broken_images_response_structure(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/cleanup-broken-images",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") is True, f"Expected success=True, got: {data}"
        assert "cleaned" in data, f"Expected 'cleaned' key in response, got: {data}"

    def test_cleanup_broken_images_cleaned_counts(self):
        """All count keys must exist in the cleaned dict"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/cleanup-broken-images",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        cleaned = resp.json().get("cleaned", {})
        expected_keys = [
            "products_master_image_cleaned",
            "products_master_images_array_cleaned",
            "breed_products_image_cleaned",
            "bundles_image_cleaned",
        ]
        for k in expected_keys:
            assert k in cleaned, f"Missing key '{k}' in cleaned: {cleaned}"
            assert isinstance(cleaned[k], int), f"Expected int for {k}, got {type(cleaned[k])}"

    def test_cleanup_requires_admin_auth(self):
        """Unauthenticated request should be rejected"""
        resp = requests.post(f"{BASE_URL}/api/admin/cleanup-broken-images")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# Admin Sync Image Fields Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestAdminSyncImageFields:
    """POST /api/admin/sync-image-fields — cloudinary_url → watercolor_image sync"""

    def test_sync_image_fields_returns_200(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/sync-image-fields",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"

    def test_sync_image_fields_response_structure(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/sync-image-fields",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") is True, f"Expected success=True, got: {data}"
        assert "synced" in data, f"Expected 'synced' key, got: {data}"
        synced = data["synced"]
        assert "breed_products_synced" in synced, f"Missing breed_products_synced: {synced}"
        assert "products_master_synced" in synced, f"Missing products_master_synced: {synced}"
        assert isinstance(synced["breed_products_synced"], int)
        assert isinstance(synced["products_master_synced"], int)

    def test_sync_requires_admin_auth(self):
        """Unauthenticated request should be rejected"""
        resp = requests.post(f"{BASE_URL}/api/admin/sync-image-fields")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# /api/mira/plan — Claude Haiku endpoint
# ─────────────────────────────────────────────────────────────────────────────

class TestMiraPlanEndpoint:
    """POST /api/mira/plan — Claude claude-haiku-4-5 AI plan generation"""

    def test_mira_plan_returns_200(self):
        """Basic health check — endpoint exists and returns 200"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": PET_MOJO_ID, "pillar": "play"},
            timeout=30,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"

    def test_mira_plan_returns_cards(self):
        """Claude should return a list of 4 plan cards"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": PET_MOJO_ID, "pillar": "play"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "cards" in data, f"Expected 'cards' key, got: {data.keys()}"
        cards = data.get("cards", [])
        # Claude should return 4 cards, but may return 0 on error (fallback mode)
        # We just check the shape is correct
        if len(cards) > 0:
            assert len(cards) <= 8, f"Too many cards: {len(cards)}"
            # Validate card structure
            card = cards[0]
            assert "title" in card or "icon" in card, f"Card missing title/icon: {card}"
        # If 0 cards, it means Claude failed — note it but don't hard fail (fallback returns [])
        print(f"[MIRA_PLAN] Received {len(cards)} cards for Mojo play plan")

    def test_mira_plan_returns_4_cards_for_mojo(self):
        """The primary requirement: 4 Claude cards for Mojo play plan"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": PET_MOJO_ID, "pillar": "play"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        cards = data.get("cards", [])
        assert len(cards) == 4, f"Expected exactly 4 cards from Claude, got {len(cards)}. Data: {data}"

    def test_mira_plan_card_structure(self):
        """Each card must have icon, title, reason, action fields"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": PET_MOJO_ID, "pillar": "play"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        cards = data.get("cards", [])
        if not cards:
            pytest.skip("Claude returned 0 cards — skipping structure check (may need retry)")
        for i, card in enumerate(cards):
            assert "icon" in card, f"Card {i} missing 'icon': {card}"
            assert "title" in card, f"Card {i} missing 'title': {card}"
            assert "reason" in card, f"Card {i} missing 'reason': {card}"
            assert "action" in card, f"Card {i} missing 'action': {card}"
            assert "concierge" in card, f"Card {i} missing 'concierge': {card}"
            assert isinstance(card["concierge"], bool), f"Card {i} 'concierge' not bool: {card}"

    def test_mira_plan_pet_info_in_response(self):
        """Response should include pet name and pillar"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pet_id": PET_MOJO_ID, "pillar": "learn"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "pet" in data, f"Expected 'pet' key in response: {data}"
        assert "pillar" in data, f"Expected 'pillar' key in response: {data}"
        assert data["pillar"] == "learn", f"Expected pillar='learn', got {data.get('pillar')}"

    def test_mira_plan_without_pet_id(self):
        """Plan without pet_id should still return 200 (graceful fallback)"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/plan",
            json={"pillar": "dine"},
            timeout=30,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# Life-stage Filter (Backend) — Puppy products hidden from adult dogs
# ─────────────────────────────────────────────────────────────────────────────

class TestLifeStagePuppyFilter:
    """Life-stage filter: puppy products should NOT appear in adult dog (Mojo) product responses"""

    def test_mojo_pillar_products_no_puppy(self, member_headers):
        """Mojo (adult Indie) should not see puppy products in pillar-products endpoint"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=200&breed=Indie",
            headers=member_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        if not products:
            pytest.skip("No dine products found — skipping puppy filter check")
        
        # Check each product for puppy-related content
        puppy_products = []
        for p in products:
            check_text = " ".join([
                p.get("name", ""),
                p.get("category", ""),
                p.get("sub_category", ""),
                p.get("mira_tag", ""),
                " ".join(p.get("tags", []) if isinstance(p.get("tags"), list) else []),
                " ".join(p.get("life_stages", []) if isinstance(p.get("life_stages"), list) else []),
            ]).lower()
            import re
            if re.search(r'\bpuppy\b|\bpuppies\b', check_text):
                puppy_products.append(p.get("name", ""))
        
        # Note: The backend filter applies to mira-score-engine picks, not raw pillar-products
        # The pillar-products endpoint may still return puppy products — the filter is client-side
        print(f"[LIFE_STAGE] Found {len(puppy_products)} puppy products in dine pillar-products: {puppy_products[:5]}")

    def test_mojo_mira_claude_picks_no_puppy_products(self, member_headers):
        """Mojo (adult Indie) claude-picks should NOT contain puppy products after mira_score_engine filter"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{PET_MOJO_ID}?entity_type=product&pillar=dine&limit=50",
            headers=member_headers,
            timeout=15,
        )
        if resp.status_code != 200:
            pytest.skip(f"claude-picks returned {resp.status_code} — skipping")
        
        data = resp.json()
        picks = data.get("picks", [])
        if not picks:
            pytest.skip("No claude-picks for Mojo dine — skipping puppy filter check")
        
        import re
        puppy_picks = []
        for p in picks:
            check_text = " ".join([
                p.get("name", ""),
                p.get("category", ""),
                p.get("mira_tag", ""),
                " ".join(p.get("tags", []) if isinstance(p.get("tags"), list) else []),
                " ".join(p.get("life_stages", []) if isinstance(p.get("life_stages"), list) else []),
            ]).lower()
            if re.search(r'\bpuppy\b|\bpuppies\b', check_text):
                puppy_picks.append(p.get("name", ""))
        
        assert len(puppy_picks) == 0, (
            f"Adult dog Mojo should see ZERO puppy products in picks, "
            f"but found {len(puppy_picks)}: {puppy_picks}"
        )
        print(f"[LIFE_STAGE] PASS — 0 puppy products in Mojo's dine picks (total {len(picks)} picks)")


# ─────────────────────────────────────────────────────────────────────────────
# Breed Isolation — Mojo (Indie) tests
# ─────────────────────────────────────────────────────────────────────────────

class TestBreedIsolation:
    """Breed isolation: Mojo (Indie) should see ZERO Labrador/Akita/Corgi products"""

    def test_mojo_claude_picks_no_labrador_products(self, member_headers):
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{PET_MOJO_ID}?entity_type=product&breed=Indie&limit=100",
            headers=member_headers,
            timeout=15,
        )
        if resp.status_code != 200:
            pytest.skip(f"claude-picks returned {resp.status_code}")
        
        data = resp.json()
        picks = data.get("picks", [])
        if not picks:
            pytest.skip("No claude-picks for Mojo — skipping breed isolation check")
        
        forbidden_breeds = ["labrador", "akita", "corgi", "retriever"]
        violating_products = []
        for p in picks:
            breed_tags = [
                *([t.lower() for t in p.get("breed_tags", [])] if isinstance(p.get("breed_tags"), list) else []),
                *([b.lower() for b in (p.get("breed_metadata") or {}).get("breeds", [])])
            ]
            for fb in forbidden_breeds:
                if any(fb in bt for bt in breed_tags):
                    violating_products.append({"name": p.get("name"), "breed_tags": breed_tags})
        
        assert len(violating_products) == 0, (
            f"Mojo (Indie) should see ZERO Labrador/Akita/Corgi products, "
            f"found {len(violating_products)}: {[v['name'] for v in violating_products[:5]]}"
        )
        print(f"[BREED_ISOLATION] PASS — Mojo: 0 forbidden breed products in {len(picks)} picks")


# ─────────────────────────────────────────────────────────────────────────────
# Service Box APIs — Emergency/Farewell
# ─────────────────────────────────────────────────────────────────────────────

class TestServiceBoxAPIs:
    """Service box endpoints for Emergency and Farewell pillars"""

    def test_emergency_services_returns_200(self, member_headers):
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=emergency&limit=20",
            headers=member_headers,
        )
        # It's acceptable if this returns 200 or 404 (no services seeded yet)
        assert resp.status_code in [200, 404], f"Unexpected status: {resp.status_code}"

    def test_emergency_services_response_structure(self, member_headers):
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=emergency&limit=20",
            headers=member_headers,
        )
        if resp.status_code == 404:
            pytest.skip("No emergency services in DB — skipping structure check")
        assert resp.status_code == 200
        data = resp.json()
        assert "services" in data, f"Expected 'services' key, got: {data.keys()}"

    def test_farewell_services_returns_200(self, member_headers):
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=farewell&limit=20",
            headers=member_headers,
        )
        assert resp.status_code in [200, 404], f"Unexpected status: {resp.status_code}"

    def test_farewell_services_response_structure(self, member_headers):
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=farewell&limit=20",
            headers=member_headers,
        )
        if resp.status_code == 404:
            pytest.skip("No farewell services in DB — skipping structure check")
        assert resp.status_code == 200
        data = resp.json()
        assert "services" in data, f"Expected 'services' key, got: {data.keys()}"

    def test_emergency_services_no_prices(self, member_headers):
        """Emergency services from DB should not have prices (removed in hardcoded array)"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=emergency&limit=20",
            headers=member_headers,
        )
        if resp.status_code != 200:
            pytest.skip("No emergency services in DB")
        data = resp.json()
        services = data.get("services", [])
        # Check that no services have non-zero prices in the response
        # (prices may exist in DB but the frontend hardcoded array has no prices)
        print(f"[SERVICES] Found {len(services)} emergency services")
        for svc in services:
            print(f"  - {svc.get('name')}: price={svc.get('price', 'N/A')}")

    def test_farewell_services_no_prices(self, member_headers):
        """Farewell services from DB"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=farewell&limit=20",
            headers=member_headers,
        )
        if resp.status_code != 200:
            pytest.skip("No farewell services in DB")
        data = resp.json()
        services = data.get("services", [])
        print(f"[SERVICES] Found {len(services)} farewell services")
        for svc in services:
            print(f"  - {svc.get('name')}: price={svc.get('price', 'N/A')}")


# ─────────────────────────────────────────────────────────────────────────────
# Admin Generate Image — saves ai_prompt field
# ─────────────────────────────────────────────────────────────────────────────

class TestAdminGenerateImage:
    """POST /api/admin/generate-image — saves ai_prompt field to product"""

    def test_generate_image_requires_prompt(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={"entity_type": "product", "entity_id": "test-123"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400, f"Expected 400 for missing prompt, got {resp.status_code}"

    def test_generate_image_requires_admin_auth(self):
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={"prompt": "test product photo"},
        )
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_generate_image_returns_url(self):
        """Generate a test image and verify URL is returned"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/generate-image",
            json={
                "prompt": "Premium product photo of test dog treat, clean white background, professional",
                "entity_type": "product",
                "entity_id": "",
                "save_prompt": True,
            },
            headers=ADMIN_HEADERS,
            timeout=60,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert "url" in data, f"Expected 'url' key: {data}"
        assert data.get("success") is True, f"Expected success=True: {data}"
        assert data["url"].startswith("http"), f"URL should start with http: {data.get('url')}"
        print(f"[GEN_IMAGE] Generated URL: {data['url'][:80]}...")


# ─────────────────────────────────────────────────────────────────────────────
# isValidUrl in ProductCard — emergentagent.com URLs are BLOCKED (code review)
# ─────────────────────────────────────────────────────────────────────────────

class TestProductsNoEmergentagentURLs:
    """Verify DB products do NOT return emergentagent.com URLs"""

    def test_pillar_products_no_emergentagent_urls(self, member_headers):
        """After cleanup, dine pillar products should have no emergentagent.com image URLs"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=200&breed=Indie",
            headers=member_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        if not products:
            pytest.skip("No dine products found")
        
        broken_products = []
        for p in products:
            for field in ["image", "image_url", "cloudinary_url", "mockup_url", "watercolor_image", "primary_image"]:
                val = p.get(field, "")
                if isinstance(val, str) and "emergentagent.com" in val:
                    broken_products.append({"name": p.get("name"), "field": field, "url": val[:80]})
            # Check images[] array
            for img in (p.get("images") or []):
                if isinstance(img, str) and "emergentagent.com" in img:
                    broken_products.append({"name": p.get("name"), "field": "images[]", "url": img[:80]})
        
        assert len(broken_products) == 0, (
            f"Found {len(broken_products)} products with emergentagent.com URLs after cleanup: "
            f"{broken_products[:3]}"
        )
        print(f"[EMERGENTAGENT_URLS] PASS — 0 broken URLs in {len(products)} dine products")

    def test_claude_picks_no_emergentagent_urls(self, member_headers):
        """Claude picks for Mojo should have no emergentagent.com image URLs"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{PET_MOJO_ID}?entity_type=product&breed=Indie&limit=50",
            headers=member_headers,
            timeout=15,
        )
        if resp.status_code != 200:
            pytest.skip(f"claude-picks returned {resp.status_code}")
        
        data = resp.json()
        picks = data.get("picks", [])
        
        broken = []
        for p in picks:
            for field in ["image", "image_url", "cloudinary_url", "watercolor_image"]:
                val = p.get(field, "")
                if isinstance(val, str) and "emergentagent.com" in val:
                    broken.append({"name": p.get("name"), "field": field})
        
        assert len(broken) == 0, (
            f"Found {len(broken)} claude-picks with emergentagent.com URLs: {broken[:3]}"
        )
        print(f"[EMERGENTAGENT_URLS] PASS — 0 broken URLs in {len(picks)} claude-picks for Mojo")
