"""
Backend tests for Celebrate Pillars 5 changes:
1. FeastMenuCard - concierge-driven, no prices, 'Request via Concierge'
2. Products seeded - puzzle_toys, party_kits, memory_books, portraits, supplements
3. PawtyPlannerCard - all steps use sendToConcierge
4. MemoryInvitationCard - 4 options with 'Book via Concierge'
5. Admin panel - Generate tab with ProductGeneratorPanel
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="session")
def admin_token():
    """Get admin JWT token."""
    resp = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": "aditya",
        "password": "lola4304"
    })
    if resp.status_code == 200:
        return resp.json().get("token")
    pytest.skip(f"Admin login failed: {resp.status_code} {resp.text[:200]}")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. Admin Login Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminLogin:
    """Admin login endpoint tests"""

    def test_admin_login_success(self):
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "token" in data, "No token in response"
        assert data.get("success") is True

    def test_admin_login_invalid_creds(self):
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert resp.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 2. Concierge Pillar Request Endpoint
# ─────────────────────────────────────────────────────────────────────────────
class TestConciergeRequest:
    """Test /api/concierge/pillar-request used by FeastMenuCard and PawtyPlannerCard"""

    def test_feast_item_concierge_request(self):
        """FeastMenuCard: 'Request via Concierge' button creates a ticket"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "feast_item",
            "request_label": "Request Salmon Birthday Cake for Mojo",
            "message": "Please prepare Salmon Birthday Cake for Mojo's birthday feast",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200, f"Concierge request failed: {resp.text}"
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data, f"No ticket/request ID: {data}"
        print(f"✅ Feast item concierge ticket created: {data.get('ticket_id', data.get('request_id'))}")

    def test_pawty_venue_concierge_request(self):
        """PawtyPlannerCard Step 1: Find venue"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "venue_finder",
            "request_label": "Find a pet-friendly venue in Goa for Mojo's birthday",
            "message": "Please find a pet-friendly birthday venue in Goa for Mojo's pawty.",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200, f"Venue concierge request failed: {resp.text}"
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_pawty_invites_concierge_request(self):
        """PawtyPlannerCard Step 2: Order invites"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "order_invitations",
            "request_label": "Order paw print invitations for Mojo's birthday",
            "message": "Please prepare invitations for Mojo's birthday.",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200, f"Invites concierge request failed: {resp.text}"
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_full_concierge_pawty_request(self):
        """PawtyPlannerCard Step 4: Full Concierge"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "full_concierge_pawty",
            "request_label": "Full concierge birthday pawty planning for Mojo",
            "message": "Please handle Mojo's full birthday pawty.",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200, f"Full concierge request failed: {resp.text}"
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_memory_photoshoot_concierge_request(self):
        """MemoryInvitationCard: Birthday Photoshoot"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "birthday_photoshoot",
            "request_label": "Mojo's Birthday Photoshoot",
            "message": "Please arrange a professional birthday photoshoot for Mojo",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200, f"Photoshoot request failed: {resp.text}"
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_memory_portrait_concierge_request(self):
        """MemoryInvitationCard: Custom Portrait"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "custom_portrait",
            "request_label": "Commission Mojo's Custom Portrait",
            "message": "Please commission a custom illustrated portrait of Mojo",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_memory_book_concierge_request(self):
        """MemoryInvitationCard: Memory Book"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "memory_book",
            "request_label": "Mojo's Birthday Memory Book",
            "message": "Please create a personalised birthday memory book for Mojo",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data

    def test_soul_story_book_concierge_request(self):
        """MemoryInvitationCard: Soul Story Book"""
        resp = requests.post(f"{BASE_URL}/api/concierge/pillar-request", json={
            "pillar": "celebrate",
            "request_type": "soul_story_book",
            "request_label": "Mojo's Soul Story Book",
            "message": "Please have Mira write and print a Soul Story Book for Mojo's birthday",
            "pet_name": "Mojo",
            "source": "soul_pillar_expanded"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data or "request_id" in data


# ─────────────────────────────────────────────────────────────────────────────
# 3. Products Endpoint - Category Counts
# ─────────────────────────────────────────────────────────────────────────────
class TestProductCategories:
    """Verify new products seeded: puzzle_toys, party_kits, memory_books, portraits, supplements"""

    def test_puzzle_toys_products_exist(self):
        """Learning & Mind pillar: puzzle_toys products should exist"""
        resp = requests.get(f"{BASE_URL}/api/products?category=puzzle_toys&limit=20")
        assert resp.status_code == 200, f"Products API failed: {resp.text}"
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, f"No puzzle_toys products found! Expected 9 seeded products"
        print(f"✅ Found {len(products)} puzzle_toys products")

    def test_party_kits_products_exist(self):
        """Social & Friends pillar: party_kits products should exist"""
        resp = requests.get(f"{BASE_URL}/api/products?category=party_kits&limit=20")
        assert resp.status_code == 200, f"Products API failed: {resp.text}"
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, f"No party_kits products found! Expected 10 seeded products"
        print(f"✅ Found {len(products)} party_kits products")

    def test_memory_books_products_exist(self):
        """Love & Memory pillar: memory_books products should exist"""
        resp = requests.get(f"{BASE_URL}/api/products?category=memory_books&limit=20")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, f"No memory_books products found! Expected 6 seeded products"
        print(f"✅ Found {len(products)} memory_books products")

    def test_portraits_products_exist(self):
        """Love & Memory pillar: portraits products should exist"""
        resp = requests.get(f"{BASE_URL}/api/products?category=portraits&limit=20")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, f"No portraits products found! Expected 3 seeded products"
        print(f"✅ Found {len(products)} portraits products")

    def test_supplements_products_exist(self):
        """Health & Wellness pillar: supplements should have >5 products"""
        resp = requests.get(f"{BASE_URL}/api/products?category=supplements&limit=20")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, f"No supplements products found"
        print(f"✅ Found {len(products)} supplements products")

    def test_puzzle_toys_product_data_structure(self):
        """Puzzle toys products have required fields"""
        resp = requests.get(f"{BASE_URL}/api/products?category=puzzle_toys&limit=5")
        data = resp.json()
        products = data.get("products", [])
        if products:
            p = products[0]
            assert "name" in p, "Missing name field"
            assert "price" in p, "Missing price field"
            assert "category" in p, "Missing category field"
            assert p["category"] == "puzzle_toys", f"Wrong category: {p['category']}"
            print(f"✅ Puzzle toy product: {p['name']}, ₹{p['price']}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Admin Celebrate Generation Endpoints
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminCelebrateGeneration:
    """Test admin celebrate product generation endpoints"""

    def test_generation_status_endpoint(self, admin_headers):
        """GET /api/admin/celebrate/generation-status"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/celebrate/generation-status",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Status endpoint failed: {resp.text}"
        data = resp.json()
        assert "phase" in data, "Missing phase field"
        assert "category_counts" in data, "Missing category_counts"
        cat_counts = data["category_counts"]
        print(f"✅ Generation status: phase={data['phase']}")
        print(f"   Category counts: {cat_counts}")

    def test_generation_status_has_category_counts(self, admin_headers):
        """Category counts include puzzle_toys, party_kits, etc."""
        resp = requests.get(
            f"{BASE_URL}/api/admin/celebrate/generation-status",
            headers=admin_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        cat_counts = data.get("category_counts", {})
        # These categories should exist in the count
        for cat in ["puzzle_toys", "party_kits", "memory_books", "portraits"]:
            assert cat in cat_counts, f"Category '{cat}' missing from category_counts"
        print(f"✅ All expected categories present in status: {cat_counts}")

    def test_generation_status_requires_auth(self):
        """Endpoint should reject unauthenticated requests"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/celebrate/generation-status"
        )
        assert resp.status_code in [401, 403, 422], f"Expected auth failure but got {resp.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Products in DB for Feast Menu (salmon-based)
# ─────────────────────────────────────────────────────────────────────────────
class TestFeastMenuProducts:
    """Verify salmon-related products exist in cakes/treats categories"""

    def test_cakes_products_exist(self):
        """Food pillar: cakes category should have products"""
        resp = requests.get(f"{BASE_URL}/api/products?category=cakes&limit=10")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "No cakes products found"
        print(f"✅ Found {len(products)} cakes products")

    def test_treats_products_exist(self):
        """Food pillar: treats category should have products"""
        resp = requests.get(f"{BASE_URL}/api/products?category=treats&limit=10")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "No treats products found"
        print(f"✅ Found {len(products)} treats products")
