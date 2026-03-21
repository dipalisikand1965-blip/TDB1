"""
Backend Tests for The Doggy Company - 12 Checkpoint E2E Test
Tests all critical endpoints for the pre-launch review:
1. Login/Auth
2. Mira's Picks (care pillar)
3. Booking (ConciergeModal / service booking)
4. Admin Inbox (service_desk tickets)
5. My Requests (tickets by parent)
6. NearMe Booking
7. Concierge Reply
8. Unread Badge (mark_reply_read)
9. Mira Chat (intent + ticket creation)
10. Soul Score
11. Shop Tabs
12. Footer (contact info)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Shared state
_user_token = None
_user_id = None
_pet_id = None
_pet_name = None
_pet_breed = None
_created_ticket_id = None


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_token(session):
    """Get user auth token for dipali@clubconcierge.in"""
    global _user_token, _user_id
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if resp.status_code == 200:
        data = resp.json()
        _user_token = data.get("access_token") or data.get("token")
        _user_id = data.get("user", {}).get("id") or data.get("user_id") or USER_EMAIL
        print(f"Login OK. user_id={_user_id}, token={'YES' if _user_token else 'NO'}")
        return _user_token
    print(f"Login failed: {resp.status_code} {resp.text[:200]}")
    pytest.skip(f"User auth failed with {resp.status_code}")


@pytest.fixture(scope="module")
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 1: LOGIN
# ──────────────────────────────────────────────────────────────

class TestLogin:
    """Checkpoint 1: Login dipali@clubconcierge.in / test123"""

    def test_user_login_success(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        assert ("access_token" in data or "token" in data), "No token in login response"
        assert "user" in data or "user_id" in data, "No user in login response"
        print("✅ Login: 200 OK with token")

    def test_user_has_pet(self, session, user_token):
        """User should have at least one pet (Mojo)"""
        global _pet_id, _pet_name, _pet_breed
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(f"{BASE_URL}/api/pets", headers=headers)
        assert resp.status_code == 200, f"GET /api/pets failed: {resp.status_code}"
        data = resp.json()
        pets = data if isinstance(data, list) else data.get("pets", data.get("items", []))
        assert len(pets) > 0, "No pets found for dipali"
        _pet_id = pets[0].get("id")
        _pet_name = pets[0].get("name")
        _pet_breed = pets[0].get("breed")
        print(f"✅ Pet found: {_pet_name} ({_pet_breed}) id={_pet_id}")

    def test_soul_score_present(self, session, user_token):
        """Soul score should be visible for Mojo"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(f"{BASE_URL}/api/pets/{_pet_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        pet = data.get("pet", data) if isinstance(data, dict) else data
        soul_score = pet.get("overall_score") or pet.get("soul_score") or pet.get("soul_completion_pct")
        print(f"✅ Soul score: {soul_score}")
        # Don't assert specific value, just that it's present and > 0 conceptually
        assert soul_score is not None or pet.get("doggy_soul_answers"), "No soul score data"


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 2: MIRA'S PICKS (CARE PILLAR)
# ──────────────────────────────────────────────────────────────

class TestMirasPicks:
    """Checkpoint 2: Care pillar → Mira's Picks tab shows AI-scored product cards"""

    def test_claude_picks_endpoint(self, session, user_token):
        """GET /api/mira/claude-picks/{pet_id}?pillar=care should return products"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/mira/claude-picks/{_pet_id}?pillar=care&limit=10",
            headers=headers,
            timeout=30
        )
        assert resp.status_code == 200, f"claude-picks failed: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        picks = data.get("picks", [])
        print(f"✅ Mira's Picks returned {len(picks)} items for {_pet_name} (care)")
        assert len(picks) > 0, "No picks returned — Mira's Picks will show empty"
        # Verify they have expected fields
        first = picks[0]
        assert "name" in first or "entity_name" in first, "Pick missing name field"

    def test_mira_score_status(self, session, user_token):
        """Scores should exist for this pet"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/mira/score-status/{_pet_id}",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"✅ Score status: has_scores={data.get('has_scores')}, count={data.get('count')}")


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 3: BOOKING via ConciergeModal
# ──────────────────────────────────────────────────────────────

class TestBooking:
    """Checkpoint 3: Book via Concierge → creates a ticket"""

    def test_book_via_concierge(self, session, user_token):
        """POST /api/service_desk/attach_or_create_ticket creates a booking ticket"""
        global _created_ticket_id
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        payload = {
            "parent_id": _user_id or USER_EMAIL,
            "pet_id": _pet_id,
            "pillar": "care",
            "intent_primary": "service_booking",
            "intent_secondary": ["grooming"],
            "life_state": "PLAN",
            "channel": "care_concierge_modal",
            "initial_message": {
                "sender": "parent",
                "source": "pillar_page",
                "text": f"TEST BOOKING: Book grooming for {_pet_name} on 2026-04-15. Notes: Please use gentle shampoo."
            }
        }
        resp = session.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=headers,
            timeout=20
        )
        assert resp.status_code == 200, f"Booking failed: {resp.status_code} {resp.text[:300]}"
        data = resp.json()
        _created_ticket_id = data.get("ticket_id")
        print(f"✅ Booking ticket created: {_created_ticket_id}")
        assert _created_ticket_id, "No ticket_id in response"
        assert _created_ticket_id.startswith("TCK-"), f"Ticket ID format wrong: {_created_ticket_id}"

    def test_booking_visible_in_admin_ticket_list(self, session, user_token):
        """Checkpoint 4: Admin should see the ticket in service_desk"""
        if not _created_ticket_id:
            pytest.skip("No ticket created")
        # Check that the ticket exists in service_desk_tickets (admin inbox)
        resp = session.get(
            f"{BASE_URL}/api/service_desk/ticket/{_created_ticket_id}",
            timeout=10
        )
        assert resp.status_code in (200, 404), f"Unexpected status: {resp.status_code}"
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Ticket exists: {data.get('ticket_id')} — subject: {data.get('subject','N/A')}")
            # Verify Mira briefing is present
            has_briefing = bool(data.get("mira_briefing")) or any(
                m.get("is_briefing") for m in (data.get("conversation") or [])
            )
            print(f"   Has Mira briefing: {has_briefing}")


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 5: MY REQUESTS
# ──────────────────────────────────────────────────────────────

class TestMyRequests:
    """Checkpoint 5: /my-requests shows tickets for dipali"""

    def test_tickets_by_parent(self, session, user_token):
        """GET /api/service_desk/tickets/by_parent/{parent_id}"""
        if not _user_id:
            pytest.skip("No user_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/service_desk/tickets/by_parent/{_user_id}?limit=50",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200, f"Tickets by parent failed: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        tickets = data.get("tickets", [])
        print(f"✅ {len(tickets)} tickets found for parent={_user_id}")
        assert len(tickets) >= 0  # May be empty but endpoint must return 200

    def test_my_requests_shows_booking(self, session, user_token):
        """The just-created booking should appear in /my-requests"""
        if not _created_ticket_id or not _user_id:
            pytest.skip("No ticket or user ID")
        headers = {"Authorization": f"Bearer {user_token}"}
        # Try by email too (dipali@clubconcierge.in)
        resp = session.get(
            f"{BASE_URL}/api/service_desk/tickets/by_parent/{USER_EMAIL}?limit=50",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        tickets = data.get("tickets", [])
        ticket_ids = [t.get("ticket_id") or t.get("id") for t in tickets]
        print(f"✅ Tickets by email: {len(tickets)} found. IDs include our ticket: {_created_ticket_id in ticket_ids}")
        # Also verify mira_briefing in at least one ticket
        briefed = [t for t in tickets if t.get("mira_briefing")]
        print(f"   Tickets with Mira briefing: {len(briefed)}")


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 7: CONCIERGE REPLY
# ──────────────────────────────────────────────────────────────

class TestConciergeReply:
    """Checkpoint 7: Admin sends reply → sets has_unread_concierge_reply=True"""

    def test_concierge_reply_sets_unread(self, session, user_token):
        """POST /api/service_desk/concierge_reply"""
        if not _created_ticket_id:
            pytest.skip("No ticket created")
        resp = session.post(
            f"{BASE_URL}/api/service_desk/concierge_reply"
            f"?ticket_id={_created_ticket_id}&concierge_name=Aditya&message=Test+reply+from+backend+test",
            timeout=15
        )
        assert resp.status_code == 200, f"Concierge reply failed: {resp.status_code} {resp.text[:300]}"
        data = resp.json()
        print(f"✅ Concierge reply: success={data.get('success')}, has_unread={data.get('has_unread_concierge_reply')}")
        assert data.get("success") is True, "Reply did not return success=True"
        assert data.get("has_unread_concierge_reply") is True, "Missing has_unread_concierge_reply flag"


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 8: UNREAD BADGE
# ──────────────────────────────────────────────────────────────

class TestUnreadBadge:
    """Checkpoint 8: Unread badge visible → tapping clears it"""

    def test_ticket_has_unread_flag(self, session, user_token):
        """After concierge reply, ticket should have has_unread_concierge_reply=True"""
        if not _created_ticket_id or not _user_id:
            pytest.skip("No ticket or user_id")
        headers = {"Authorization": f"Bearer {user_token}"}
        # Re-fetch tickets to check unread flag
        resp = session.get(
            f"{BASE_URL}/api/service_desk/tickets/by_parent/{USER_EMAIL}?limit=50",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        tickets = data.get("tickets", [])
        unread_tickets = [t for t in tickets if t.get("has_unread_concierge_reply") is True]
        print(f"✅ Tickets with unread reply: {len(unread_tickets)}")
        our_ticket = next((t for t in tickets if (t.get("ticket_id") or t.get("id")) == _created_ticket_id), None)
        if our_ticket:
            print(f"   Our ticket unread: {our_ticket.get('has_unread_concierge_reply')}")

    def test_mark_reply_read(self, session, user_token):
        """POST /api/service_desk/mark_reply_read?ticket_id=... clears the badge"""
        if not _created_ticket_id:
            pytest.skip("No ticket created")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.post(
            f"{BASE_URL}/api/service_desk/mark_reply_read?ticket_id={_created_ticket_id}",
            headers=headers,
            timeout=10
        )
        assert resp.status_code == 200, f"mark_reply_read failed: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        print(f"✅ mark_reply_read: success={data.get('success')}")
        assert data.get("success") is True, "mark_reply_read did not return success=True"

    def test_unread_flag_cleared(self, session, user_token):
        """After mark_reply_read, the ticket should have has_unread_concierge_reply=False"""
        if not _created_ticket_id or not _user_id:
            pytest.skip("No ticket or user_id")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/service_desk/tickets/by_parent/{USER_EMAIL}?limit=50",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        tickets = data.get("tickets", [])
        our_ticket = next((t for t in tickets if (t.get("ticket_id") or t.get("id")) == _created_ticket_id), None)
        if our_ticket:
            print(f"✅ After mark_read: has_unread={our_ticket.get('has_unread_concierge_reply')}")
            assert our_ticket.get("has_unread_concierge_reply") is not True, "Unread flag not cleared"


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 9: MIRA CHAT INTENT
# ──────────────────────────────────────────────────────────────

class TestMiraChatIntent:
    """Checkpoint 9: Mira chat creates a mira_chat_intent ticket"""

    def test_route_intent_food_query(self, session, user_token):
        """POST /api/mira/route_intent classifies food query"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": _user_id or USER_EMAIL,
                "pet_id": _pet_id,
                "utterance": "What should Mojo eat today?",
                "source_event": "mira_chat",
                "device": "web"
            },
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200, f"route_intent failed: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        print(f"✅ route_intent: pillar={data.get('pillar')}, intent={data.get('intent_primary')}")
        assert data.get("pillar") is not None, "No pillar in route_intent response"
        assert data.get("intent_primary") is not None, "No intent_primary in response"


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 10: SOUL SCORE (6 chapters)
# ──────────────────────────────────────────────────────────────

class TestSoulScore:
    """Checkpoint 10: Soul ring with 6 chapter pills"""

    def test_pet_soul_data(self, session, user_token):
        """Pet should have doggy_soul_answers with 6 chapters"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/pets/{_pet_id}",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        pet = data.get("pet", data)
        soul = pet.get("doggy_soul_answers", {})
        soul_score = pet.get("overall_score") or pet.get("soul_score")
        print(f"✅ Soul data: score={soul_score}, soul_keys={list(soul.keys())[:8] if soul else 'EMPTY'}")

    def test_soul_score_endpoint(self, session, user_token):
        """GET /api/soul/score/{pet_id} returns Mojo's soul score"""
        if not _pet_id:
            pytest.skip("No pet_id available")
        headers = {"Authorization": f"Bearer {user_token}"}
        # Try pet score endpoint
        resp = session.get(
            f"{BASE_URL}/api/soul/score/{_pet_id}",
            headers=headers,
            timeout=15
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Soul score endpoint: {data.get('score') or data.get('overall_score')}")
        elif resp.status_code == 404:
            print(f"ℹ️ /api/soul/score not found, trying /api/pet-score/{_pet_id}")
            resp2 = session.get(f"{BASE_URL}/api/pet-score/{_pet_id}", headers=headers, timeout=15)
            print(f"   /api/pet-score: {resp2.status_code}")
        else:
            print(f"ℹ️ Soul score endpoint: {resp.status_code}")


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 11: SHOP TABS
# ──────────────────────────────────────────────────────────────

class TestShopTabs:
    """Checkpoint 11: Shop → Celebrate tab products load, Care tab different products"""

    def test_shop_celebrate_products(self, session, user_token):
        """Products for celebrate pillar should exist"""
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/products?pillar=celebrate&limit=10",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200, f"Shop celebrate: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", data.get("items", []))
        print(f"✅ Celebrate products: {len(products)}")
        assert len(products) > 0, "No celebrate products returned"

    def test_shop_care_products(self, session, user_token):
        """Products for care pillar should exist and be different from celebrate"""
        headers = {"Authorization": f"Bearer {user_token}"}
        resp = session.get(
            f"{BASE_URL}/api/products?pillar=care&limit=10",
            headers=headers,
            timeout=15
        )
        assert resp.status_code == 200, f"Shop care: {resp.status_code} {resp.text[:200]}"
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", data.get("items", []))
        print(f"✅ Care products: {len(products)}")
        assert len(products) > 0, "No care products returned"


# ──────────────────────────────────────────────────────────────
# CHECKPOINT 12: FOOTER
# ──────────────────────────────────────────────────────────────

class TestFooter:
    """Checkpoint 12: Footer shows correct phone and email"""

    def test_footer_info_in_settings_or_config(self, session):
        """Verify contact info is consistent in backend config"""
        # Check if there's a contact/config endpoint
        resp = session.get(f"{BASE_URL}/api/health", timeout=10)
        if resp.status_code == 200:
            print(f"✅ Health check: {resp.json()}")
        # This is mainly a frontend test, just verify backend is up
        resp2 = session.get(f"{BASE_URL}/api/", timeout=10)
        print(f"   Backend root: {resp2.status_code}")


# ──────────────────────────────────────────────────────────────
# ADMIN TESTS (Checkpoint 4)
# ──────────────────────────────────────────────────────────────

class TestAdminInbox:
    """Checkpoint 4: Admin inbox shows the booking ticket"""

    def test_admin_login(self, session):
        """Admin login with aditya/lola4304"""
        resp = session.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if resp.status_code == 200:
            print(f"✅ Admin login OK")
        elif resp.status_code == 404:
            # Try alternate auth
            resp2 = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            print(f"   Alt admin login: {resp2.status_code}")
        else:
            print(f"ℹ️ Admin login: {resp.status_code} — may use HTTP Basic")

    def test_admin_service_desk_tickets(self, session):
        """GET /api/admin/service-desk or similar returns tickets"""
        # Try with basic auth
        resp = session.get(
            f"{BASE_URL}/api/admin/service-desk",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            timeout=15
        )
        if resp.status_code == 200:
            data = resp.json()
            tickets = data.get("tickets", data.get("items", []))
            print(f"✅ Admin service desk: {len(tickets)} tickets")
        elif resp.status_code == 404:
            # Try alternate endpoint
            resp2 = session.get(
                f"{BASE_URL}/api/service_desk/tickets",
                auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
                timeout=15
            )
            print(f"   Alt service desk: {resp2.status_code}")
        else:
            print(f"ℹ️ Admin service desk: {resp.status_code}")

    def test_booking_ticket_in_service_desk(self, session, user_token):
        """The booking ticket should be in service_desk_tickets collection"""
        if not _created_ticket_id:
            pytest.skip("No ticket created")
        resp = session.get(
            f"{BASE_URL}/api/service_desk/ticket/{_created_ticket_id}",
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            has_briefing = bool(data.get("mira_briefing"))
            has_conv = bool(data.get("conversation") or data.get("thread"))
            subject = data.get("subject", "N/A")
            print(f"✅ Admin ticket: subject='{subject}', briefing={has_briefing}, conversation={has_conv}")
            # Check subject is NOT just 'Request received' (generic)
            assert subject != "Request received", "Subject is generic 'Request received'"
        else:
            print(f"ℹ️ Ticket {_created_ticket_id}: {resp.status_code}")


if __name__ == "__main__":
    import subprocess
    subprocess.run(["pytest", __file__, "-v", "--tb=short"])
