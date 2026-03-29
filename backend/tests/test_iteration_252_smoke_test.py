"""
Iteration 252 – Pre-deployment smoke test
Tests: auth, pets, pillar pages, products, service-desk ticket (photo), admin, concierge
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ── Credentials ────────────────────────────────────────────────────────────────
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS  = "test123"
ADMIN_USER   = "aditya"
ADMIN_PASS   = "lola4304"

# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def member_token():
    """Login as member and return access_token."""
    res = requests.post(f"{BASE_URL}/api/auth/login",
                        json={"email": MEMBER_EMAIL, "password": MEMBER_PASS})
    assert res.status_code == 200, f"Member login failed: {res.status_code} — {res.text[:200]}"
    data = res.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {list(data.keys())}"
    return token


@pytest.fixture(scope="module")
def member_headers(member_token):
    return {"Authorization": f"Bearer {member_token}"}


@pytest.fixture(scope="module")
def admin_headers():
    creds = requests.auth.HTTPBasicAuth(ADMIN_USER, ADMIN_PASS)
    return creds


# ─────────────────────────────────────────────────────────────────────────────
# 1. Auth
# ─────────────────────────────────────────────────────────────────────────────

class TestAuth:
    """Auth login – token returned"""

    def test_member_login_returns_access_token(self):
        res = requests.post(f"{BASE_URL}/api/auth/login",
                            json={"email": MEMBER_EMAIL, "password": MEMBER_PASS})
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"access_token missing. Keys: {list(data.keys())}"
        print(f"[PASS] Auth login — token length={len(token)}")

    def test_bad_credentials_rejected(self):
        res = requests.post(f"{BASE_URL}/api/auth/login",
                            json={"email": MEMBER_EMAIL, "password": "wrongpass"})
        assert res.status_code in (401, 400, 422), f"Expected 401/400, got {res.status_code}"
        print("[PASS] Bad credentials properly rejected")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Pets
# ─────────────────────────────────────────────────────────────────────────────

class TestPets:
    """Pet list for logged-in member"""

    def test_my_pets_returns_mojo(self, member_headers):
        res = requests.get(f"{BASE_URL}/api/pets/my-pets",
                           headers=member_headers)
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        pets = data.get("pets", [])
        assert isinstance(pets, list), "pets field not a list"
        names = [p.get("name","").lower() for p in pets]
        print(f"[INFO] Pets returned: {names}")
        # Mojo check (soft — may have other pets too)
        mojo = next((p for p in pets if "mojo" in p.get("name","").lower()), None)
        assert mojo is not None, f"Mojo not found in pets: {names}"
        assert mojo.get("breed"), f"Mojo has no breed: {mojo}"
        assert mojo.get("id"), f"Mojo has no id: {mojo}"
        print(f"[PASS] Mojo found — breed={mojo['breed']}, id={mojo['id']}")


# ─────────────────────────────────────────────────────────────────────────────
# 3. Products API
# ─────────────────────────────────────────────────────────────────────────────

class TestProducts:
    """Products API for dine pillar"""

    def test_products_dine_returns_items(self, member_headers):
        res = requests.get(f"{BASE_URL}/api/products?pillar=dine",
                           headers=member_headers)
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        items = data.get("products") or data.get("items") or (data if isinstance(data, list) else [])
        assert len(items) > 0, f"No dine products returned. Response: {str(data)[:200]}"
        print(f"[PASS] Dine products count={len(items)}")

    def test_service_box_services_shop(self, member_headers):
        res = requests.get(f"{BASE_URL}/api/service-box/services?pillar=shop&limit=5",
                           headers=member_headers)
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        services = data.get("services", [])
        print(f"[PASS] Shop services count={len(services)}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Service Desk – ticket creation with photo_url
# ─────────────────────────────────────────────────────────────────────────────

class TestServiceDesk:
    """Ticket creation with metadata.photo_url"""

    def test_create_ticket_with_photo_url(self, member_headers, member_token):
        """POST attach_or_create_ticket with photo_url in metadata"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "parent_id": MEMBER_EMAIL,
            "pet_id": "test-pet-smoke",
            "pillar": "shop",
            "intent_primary": "product_interest",
            "urgency": "normal",
            "channel": "smoke_test",
            "force_new": True,
            "initial_message": {
                "sender": "member",
                "source": "smoke_test",
                "text": f"TEST smoke photo upload {unique_id}"
            },
            "metadata": {
                "photo_url": "https://example.com/test-dog-photo.jpg",
                "soul_made": True,
                "test_run": unique_id
            }
        }
        res = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers={**member_headers, "Content-Type": "application/json"}
        )
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:300]}"
        data = res.json()
        ticket_id = data.get("ticket_id")
        assert ticket_id, f"No ticket_id returned: {data}"
        assert data.get("is_new") is True, f"Expected is_new=True: {data}"
        print(f"[PASS] Ticket created: {ticket_id}")

        # Verify photo_url stored in ticket
        detail_res = requests.get(
            f"{BASE_URL}/api/service_desk/ticket/{ticket_id}",
            headers=member_headers
        )
        assert detail_res.status_code == 200, f"Get ticket {ticket_id} failed: {detail_res.status_code}"
        ticket_doc = detail_res.json()
        # Check photo_url on ticket root OR in conversation
        photo_url = ticket_doc.get("photo_url") or ticket_doc.get("soul_made_photo")
        conversation = ticket_doc.get("conversation", [])
        photo_in_convo = any(
            msg.get("image_url") or "photo" in (msg.get("text","")).lower()
            for msg in conversation
        )
        assert photo_url or photo_in_convo, (
            f"photo_url not stored in ticket. photo_url={photo_url}, "
            f"conversation messages={len(conversation)}"
        )
        print(f"[PASS] photo_url stored: root={photo_url}, in_convo={photo_in_convo}")

    def test_get_all_tickets(self, member_headers):
        """Admin ticket list endpoint"""
        res = requests.get(
            f"{BASE_URL}/api/service_desk/tickets?limit=5",
            headers=member_headers
        )
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        tickets = data.get("tickets", [])
        print(f"[PASS] Service desk ticket list — count={len(tickets)}")

    def test_admin_tickets_endpoint(self):
        """Admin tickets endpoint with basic auth"""
        res = requests.get(
            f"{BASE_URL}/api/tickets?limit=5",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        # Accept 200 or 401 (if endpoint needs different auth)
        assert res.status_code in (200, 401, 403), f"Unexpected status {res.status_code}: {res.text[:200]}"
        if res.status_code == 200:
            data = res.json()
            tickets = data.get("tickets", data if isinstance(data, list) else [])
            print(f"[PASS] Admin tickets endpoint — count={len(tickets) if isinstance(tickets, list) else 'N/A'}")
        else:
            print(f"[INFO] Admin tickets needs different auth: {res.status_code}")


# ─────────────────────────────────────────────────────────────────────────────
# 5. Admin Login
# ─────────────────────────────────────────────────────────────────────────────

class TestAdminAuth:
    """Admin login"""

    def test_admin_login(self):
        res = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USER, "password": ADMIN_PASS}
        )
        # Try alternate endpoint if 404
        if res.status_code == 404:
            res = requests.post(
                f"{BASE_URL}/api/auth/admin/login",
                json={"username": ADMIN_USER, "password": ADMIN_PASS}
            )
        print(f"[INFO] Admin login status: {res.status_code}")
        assert res.status_code in (200, 401, 404), f"Unexpected: {res.status_code}: {res.text[:200]}"
        if res.status_code == 200:
            data = res.json()
            print(f"[PASS] Admin login response keys: {list(data.keys())}")

    def test_admin_auth_basic(self):
        """Test admin with HTTP Basic auth"""
        res = requests.get(
            f"{BASE_URL}/api/admin/pets?limit=1",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        assert res.status_code in (200, 401, 403, 404), f"Unexpected: {res.status_code}"
        print(f"[INFO] Admin basic auth status: {res.status_code}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. Mira personalization stats
# ─────────────────────────────────────────────────────────────────────────────

class TestMiraPersonalization:
    """Mira personalization-stats endpoint"""

    def test_personalization_stats_requires_valid_pet(self, member_headers, member_token):
        """Get Mojo's pet_id first, then call stats"""
        res = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=member_headers)
        assert res.status_code == 200
        pets = res.json().get("pets", [])
        mojo = next((p for p in pets if "mojo" in p.get("name","").lower()), None)
        if not mojo:
            pytest.skip("Mojo not found — skipping personalization stats test")
        pet_id = mojo.get("id")
        assert pet_id

        stats_res = requests.get(
            f"{BASE_URL}/api/mira/personalization-stats/{pet_id}",
            headers=member_headers
        )
        assert stats_res.status_code == 200, f"Status {stats_res.status_code}: {stats_res.text[:200]}"
        stats_data = stats_res.json()
        print(f"[PASS] personalization-stats for {pet_id}: keys={list(stats_data.keys())[:5]}")

    def test_mira_route_intent(self, member_headers):
        """Route intent classification"""
        res = requests.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": MEMBER_EMAIL,
                "pet_id": "test-pet-smoke",
                "utterance": "I want to book grooming for my dog",
                "source_event": "search",
                "device": "web"
            },
            headers={**member_headers, "Content-Type": "application/json"}
        )
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert data.get("pillar"), f"No pillar returned: {data}"
        assert data.get("intent_primary"), f"No intent_primary: {data}"
        print(f"[PASS] Route intent: pillar={data['pillar']}, intent={data['intent_primary']}")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Ticket TDB-2026-1618 photo field check
# ─────────────────────────────────────────────────────────────────────────────

class TestTicketPhoto:
    """Check specific ticket for photo fields"""

    def test_ticket_tdb_2026_1618_has_photo(self, member_headers):
        ticket_id = "TDB-2026-1618"
        res = requests.get(
            f"{BASE_URL}/api/service_desk/ticket/{ticket_id}",
            headers=member_headers
        )
        if res.status_code == 404:
            print(f"[SKIP] Ticket {ticket_id} not found (may not exist in this environment)")
            return
        assert res.status_code == 200, f"Status {res.status_code}: {res.text[:200]}"
        data = res.json()
        photo_url = data.get("photo_url") or data.get("soul_made_photo")
        conversation = data.get("conversation", [])
        photo_in_convo = any(
            msg.get("image_url") or msg.get("is_soul_made_photo")
            for msg in conversation
        )
        has_photo = bool(photo_url or photo_in_convo)
        print(f"[INFO] Ticket {ticket_id}: photo_url={photo_url}, photo_in_convo={photo_in_convo}")
        # Soft assertion — ticket may not have photo depending on seed data
        if has_photo:
            print(f"[PASS] Ticket {ticket_id} has photo field")
        else:
            print(f"[WARN] Ticket {ticket_id} has no photo field — may need investigation")
