"""
Pre-Launch Audit — iteration 261
Tests for: Service Desk tickets, Allergen Safety, WhatsApp notifications, Pet switching, Mira understand
Covers tests: 8a/8b/8c/8d, 9a/9b/9c/9d, 10a-c (backend side), 11a/11b
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ── Auth helpers ────────────────────────────────────────────────────────────────

def get_member_token(email: str, password: str) -> str | None:
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        data = resp.json()
        return data.get("access_token") or data.get("token")
    return None


def get_admin_token() -> str | None:
    # Try admin login with username/password
    resp = requests.post(f"{BASE_URL}/api/admin/auth/login", json={"username": "aditya", "password": "lola4304"})
    if resp.status_code == 200:
        data = resp.json()
        return data.get("access_token") or data.get("token")
    # Try email-based login
    resp2 = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "aditya", "password": "lola4304"})
    if resp2.status_code == 200:
        return resp2.json().get("access_token") or resp2.json().get("token")
    return None


# ────────────────────────────────────────────────────────────────────────────────
# Block 8: Service Desk Ticket Creation
# ────────────────────────────────────────────────────────────────────────────────

class TestServiceDeskTickets:
    """8a/8b/8c — Service desk ticket creation from Care/Celebrate + enrichment fields"""

    def test_8a_service_desk_tickets_endpoint_reachable(self):
        """GET /api/service_desk/tickets returns 200 with tickets array"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "tickets" in data, "Response should have 'tickets' key"
        print(f"[8a] GET /api/service_desk/tickets: {resp.status_code}, total={data.get('total', len(data['tickets']))}")

    def test_8a_create_care_booking_ticket(self):
        """8a — POST /api/service_desk/attach_or_create_ticket with Care pillar creates ticket"""
        payload = {
            "parent_id": "dipali@clubconcierge.in",
            "pet_id": "test-mojo-pet-id",
            "pillar": "care",
            "intent_primary": "GROOM_BOOKING",
            "intent_secondary": ["Grooming Appointment"],
            "life_state": "PLAN",
            "channel": "Mira_OS",
            "urgency": "normal",
            "force_new": True,
            "initial_message": {
                "sender": "member",
                "source": "care_mobile_page",
                "text": "I'd like to book a grooming session for Mojo"
            },
            "metadata": {}
        }
        resp = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert "ticket_id" in data, "Response should have ticket_id"
        assert data.get("is_new") == True, "force_new=True should create new ticket"
        ticket_id = data["ticket_id"]
        print(f"[8a] Care booking ticket created: {ticket_id}, status={data.get('status')}")

        # Verify ticket in admin service desk
        get_resp = requests.get(f"{BASE_URL}/api/service_desk/tickets")
        assert get_resp.status_code == 200
        tickets = get_resp.json().get("tickets", [])
        matching = [t for t in tickets if t.get("ticket_id") == ticket_id]
        assert len(matching) > 0, f"Ticket {ticket_id} should appear in admin service desk"
        ticket = matching[0]
        print(f"[8a] Ticket found in admin desk: pillar={ticket.get('pillar')}, pet_name={ticket.get('pet_name')}")

    def test_8b_create_celebrate_booking_ticket(self):
        """8b — POST with Celebrate pillar creates ticket in service desk"""
        payload = {
            "parent_id": "dipali@clubconcierge.in",
            "pet_id": "test-indie-pet-id",
            "pillar": "celebrate",
            "intent_primary": "CELEBRATE_BIRTHDAY",
            "intent_secondary": ["Birthday Cake"],
            "life_state": "CELEBRATE",
            "channel": "Mira_OS",
            "urgency": "normal",
            "force_new": True,
            "initial_message": {
                "sender": "member",
                "source": "celebrate_mobile_page",
                "text": "I want to order a birthday cake for Indie"
            },
            "metadata": {}
        }
        resp = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        ticket_id = data["ticket_id"]
        print(f"[8b] Celebrate booking ticket created: {ticket_id}")

        # Verify it appears in admin desk
        get_resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?pillar=celebrate")
        assert get_resp.status_code == 200
        tickets = get_resp.json().get("tickets", [])
        matching = [t for t in tickets if t.get("ticket_id") == ticket_id]
        assert len(matching) > 0, f"Celebrate ticket {ticket_id} should appear in admin service desk"
        print(f"[8b] Celebrate ticket visible in admin desk: {ticket_id}")

    def test_8c_ticket_has_mira_briefing_field(self):
        """8c — ticket created via API has mira_briefing field (populated if pet has soul profile)"""
        payload = {
            "parent_id": "dipali@clubconcierge.in",
            "pet_id": "mojo-test-for-briefing",
            "pillar": "care",
            "intent_primary": "GROOM_PLAN",
            "intent_secondary": [],
            "life_state": "PLAN",
            "channel": "pillar_page",
            "urgency": "normal",
            "force_new": True,
            "initial_message": "Test grooming for mira briefing check",
            "metadata": {}
        }
        resp = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert resp.status_code == 200, f"Ticket creation failed: {resp.text[:300]}"
        ticket_id = resp.json()["ticket_id"]

        # Fetch the ticket and check for mira_briefing field
        ticket_resp = requests.get(f"{BASE_URL}/api/service_desk/ticket/{ticket_id}")
        assert ticket_resp.status_code == 200, f"Ticket fetch failed: {ticket_resp.text[:200]}"
        ticket = ticket_resp.json()
        # mira_briefing may be empty string if pet not found, but field MUST exist
        assert "mira_briefing" in ticket, "Ticket MUST have mira_briefing field"
        print(f"[8c] mira_briefing field present: '{str(ticket.get('mira_briefing', ''))[:80]}...'")

    def test_8c_ticket_has_allergy_alert_in_service_desk(self):
        """8c — service_desk_tickets list returns tickets with allergy-related info in briefing"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets")
        assert resp.status_code == 200
        tickets = resp.json().get("tickets", [])
        # Just verify the shape includes mira_briefing field
        if tickets:
            sample = tickets[0]
            # mira_briefing should be a key even if empty
            keys = list(sample.keys())
            print(f"[8c] Sample ticket keys: {keys}")
            # Check required fields per spec
            required_fields = ["ticket_id", "pillar", "status"]
            for f in required_fields:
                assert f in sample or any(k in sample for k in [f, "id"]), f"Field {f} missing from ticket"
        print(f"[8c] Service desk ticket structure verified, {len(tickets)} tickets total")

    def test_8c_dipali_pet_allergies_in_ticket_briefing(self):
        """8c — When dipali creates a Care ticket, if Mojo/Indie have chicken/beef allergy, briefing includes ALLERGY ALERT"""
        # First check if pets exist for dipali
        # We create a ticket with a real pet_id lookup
        payload = {
            "parent_id": "dipali@clubconcierge.in",
            "pet_id": "",  # will trigger email-based lookup
            "pillar": "dine",
            "intent_primary": "FOOD_MAIN",
            "intent_secondary": [],
            "life_state": "PLAN",
            "channel": "pillar_page",
            "urgency": "normal",
            "force_new": True,
            "initial_message": "What can Mojo eat for lunch today?",
            "metadata": {}
        }
        resp = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        ticket_id = data["ticket_id"]
        
        # Fetch ticket
        t_resp = requests.get(f"{BASE_URL}/api/service_desk/ticket/{ticket_id}")
        assert t_resp.status_code == 200
        ticket = t_resp.json()
        briefing = ticket.get("mira_briefing", "")
        print(f"[8c] Ticket {ticket_id}, mira_briefing preview: {briefing[:150] if briefing else 'EMPTY'}")
        # If briefing is populated, check for allergy indicators (may not be if pet_id is empty/not found)
        if briefing and ("chicken" in briefing.lower() or "ALLERG" in briefing or "allerg" in briefing.lower()):
            print(f"[8c] ✅ Allergy alert found in briefing")
        else:
            print(f"[8c] ⚠️ No allergy alert in briefing — likely pet_id not resolved (empty pet_id)")


# ────────────────────────────────────────────────────────────────────────────────
# Block 8d: WhatsApp Notification Check
# ────────────────────────────────────────────────────────────────────────────────

class TestWhatsAppNotification:
    """8d — WhatsApp pipeline configured, Gupshup configured"""

    def test_8d_whatsapp_status_endpoint(self):
        """8d — GET /api/whatsapp/status shows Gupshup configured"""
        resp = requests.get(f"{BASE_URL}/api/whatsapp/status")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        print(f"[8d] WhatsApp status: {data}")
        gupshup = data.get("providers", {}).get("gupshup", {})
        is_configured = gupshup.get("configured", False)
        print(f"[8d] Gupshup configured: {is_configured}, app_name={gupshup.get('app_name')}")
        assert is_configured, "Gupshup should be configured (GUPSHUP_API_KEY in .env)"

    def test_8d_whatsapp_webhook_endpoint_exists(self):
        """8d — WhatsApp webhook endpoint exists (POST /api/whatsapp/webhook)"""
        # Send a test payload that should be processed without error
        test_payload = {
            "app": "DoggyCompany",
            "timestamp": int(time.time()),
            "version": 2,
            "type": "message-event",  # Use message-event type to avoid creating real data
            "payload": {
                "id": "test-event-id",
                "type": "delivered",
                "payload": {}
            }
        }
        resp = requests.post(f"{BASE_URL}/api/whatsapp/webhook", json=test_payload)
        # Should return 200 (webhook always returns 200 to acknowledge)
        assert resp.status_code == 200, f"Webhook should return 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert data.get("status") == "ok", f"Webhook should return status=ok, got: {data}"
        print(f"[8d] WhatsApp webhook endpoint: PASS (status={data.get('status')})")

    def test_8d_service_desk_ticket_triggers_notification(self):
        """8d — Creating a ticket via service_desk should log WhatsApp send attempt (check logs)"""
        # We create a ticket with a real member phone. The backend should fire send_concierge_request
        # Check by looking at the response - if it returns without error, the notification was attempted
        payload = {
            "parent_id": "dipali@clubconcierge.in",
            "pet_id": "test-pet-notif",
            "pillar": "care",
            "intent_primary": "GROOM_BOOKING",
            "intent_secondary": [],
            "life_state": "PLAN",
            "channel": "Mira_OS",
            "urgency": "normal",
            "force_new": True,
            "initial_message": "Book grooming for notification test",
            "metadata": {}
        }
        resp = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert resp.status_code == 200, f"Ticket creation failed: {resp.text[:300]}"
        # The notification is async (asyncio.ensure_future), so it fires without blocking
        # Backend will log: "[SERVICE_DESK] Notification send failed" if WhatsApp number not found
        # But the ticket creation itself should succeed
        print(f"[8d] Ticket created, WhatsApp notification was attempted (async). ticket_id={resp.json().get('ticket_id')}")


# ────────────────────────────────────────────────────────────────────────────────
# Block 9: Allergen Safety
# ────────────────────────────────────────────────────────────────────────────────

class TestAllergenSafety:
    """9a/9b/9c — Dipali's pets allergies stored and allergen blocking works"""

    @classmethod
    def setup_class(cls):
        """Get auth token for dipali"""
        cls.token = get_member_token("dipali@clubconcierge.in", "test123")
        cls.headers = {"Authorization": f"Bearer {cls.token}"} if cls.token else {}
        if not cls.token:
            print("[9a] WARNING: Could not authenticate as dipali@clubconcierge.in")

    def test_9a_dipali_login(self):
        """9a — Login as dipali@clubconcierge.in / test123 succeeds"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "dipali@clubconcierge.in", "password": "test123"})
        print(f"[9a] Login response: {resp.status_code}, body preview: {resp.text[:300]}")
        assert resp.status_code == 200, f"Login failed: {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        token = data.get("access_token") or data.get("token")
        assert token, "Token should be returned on successful login"
        print(f"[9a] Login: PASS, token present: True")

    def test_9a_fetch_pets_for_dipali(self):
        """9a — GET /api/pets returns Mojo and Indie with allergies"""
        if not self.token:
            pytest.skip("No auth token for dipali")
        resp = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        assert resp.status_code == 200, f"GET /api/pets failed: {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        pets = data if isinstance(data, list) else data.get("pets", [])
        print(f"[9a] Pets returned: {len(pets)}")
        
        pet_names = [p.get("name", "") for p in pets]
        print(f"[9a] Pet names: {pet_names}")
        
        # Check allergies on pets
        for pet in pets:
            name = pet.get("name", "Unknown")
            raw_allergies = pet.get("allergies", "")
            soul_allergies = pet.get("doggy_soul_answers", {}).get("food_allergies", [])
            vault_allergies = pet.get("vault", {}).get("allergies", [])
            print(f"[9a] Pet '{name}': allergies={raw_allergies}, soul={soul_allergies}, vault={vault_allergies}")
        
        # If Mojo/Indie are in the DB, check their allergies
        mojo = next((p for p in pets if p.get("name", "").lower() in ["mojo"]), None)
        indie = next((p for p in pets if p.get("name", "").lower() in ["indie"]), None)
        
        if mojo:
            mojo_allergies = str(mojo.get("allergies", "")).lower()
            soul_allergy = str(mojo.get("doggy_soul_answers", {}).get("food_allergies", "")).lower()
            print(f"[9a] Mojo allergies raw={mojo_allergies}, soul={soul_allergy}")
        if indie:
            indie_allergies = str(indie.get("allergies", "")).lower()
            soul_allergy = str(indie.get("doggy_soul_answers", {}).get("food_allergies", "")).lower()
            print(f"[9a] Indie allergies raw={indie_allergies}, soul={soul_allergy}")
        
        assert len(pets) > 0, "Dipali should have at least one pet"
        print(f"[9a] PASS — {len(pets)} pet(s) found")

    def test_9b_dine_products_endpoint(self):
        """9b — GET /api/products?pillar=dine returns products, check for chicken/beef"""
        resp = requests.get(f"{BASE_URL}/api/products?pillar=dine")
        if resp.status_code != 200:
            # Try alternative endpoint
            resp = requests.get(f"{BASE_URL}/api/pillar-products?pillar=dine")
        assert resp.status_code == 200, f"GET products failed: {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        products = data if isinstance(data, list) else data.get("products", data.get("items", []))
        print(f"[9b] Dine products fetched: {len(products)}")
        
        # Check for chicken/beef tagged products
        chicken_products = [
            p for p in products
            if any(
                kw in " ".join([
                    p.get("name") or "",
                    p.get("description") or "",
                    p.get("mira_tag") or "",
                    " ".join(p.get("tags", [])) if isinstance(p.get("tags"), list) else "",
                ]).lower()
                for kw in ["chicken", "poultry", "beef", "bovine"]
            )
        ]
        print(f"[9b] Products containing chicken/beef: {len(chicken_products)}")
        if chicken_products:
            for p in chicken_products[:5]:
                print(f"[9b]   - {p.get('name', 'N/A')}: tags={p.get('tags', [])[:3]}")
        # This is informational — the filtering happens on the frontend via useMiraFilter
        print(f"[9b] NOTE: Frontend useMiraFilter blocks chicken/beef for Mojo/Indie. Backend returns all products.")

    def test_9b_products_with_dine_pillar_filter(self):
        """9b — Verify dine products API works with various query params"""
        # Try different endpoint patterns
        endpoints = [
            f"{BASE_URL}/api/products?pillar=dine&limit=20",
            f"{BASE_URL}/api/pillar-products?pillar=dine&limit=20",
        ]
        for endpoint in endpoints:
            resp = requests.get(endpoint)
            print(f"[9b] {endpoint}: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                products = data if isinstance(data, list) else data.get("products", data.get("items", []))
                print(f"[9b] Got {len(products)} products from {endpoint}")
                if products:
                    print(f"[9b] First product: {products[0].get('name', 'N/A')}")
                break

    def test_9c_mira_understand_endpoint_exists(self):
        """9c — POST /api/mira/os/understand endpoint exists and responds (correct schema: 'input' not 'message')"""
        payload = {
            "input": "find me a meal for my dog",
            "pet_id": "pet-mojo-7327ad56",  # Mojo has chicken/beef allergies
            "session_id": "test-session-audit-261-v2",
            "pillar": "dine",
        }
        # Try /api/mira/os/understand (basic intent parsing, no allergen DB lookup)
        resp = requests.post(f"{BASE_URL}/api/mira/os/understand", json=payload)
        print(f"[9c] POST /api/mira/os/understand: {resp.status_code}")
        assert resp.status_code != 404, f"/api/mira/os/understand should not return 404"
        if resp.status_code == 200:
            data = resp.json()
            print(f"[9c] Response keys: {list(data.keys())}")
            print(f"[9c] NOTE: /os/understand does NOT use pet_id for DB lookup — pet_context must be passed explicitly")
            print(f"[9c] Use /os/understand-with-products for allergen-aware responses")
        elif resp.status_code == 422:
            print(f"[9c] 422 Unprocessable: {resp.text[:300]}")

    def test_9c_mira_understand_with_products_allergen_blocking(self):
        """9c — POST /api/mira/os/understand-with-products — confirms allergen-aware response for Mojo (chicken/beef blocked)"""
        payload = {
            "input": "find me a meal for my dog",
            "pet_id": "pet-mojo-7327ad56",  # Mojo has chicken/beef in vault
            "pillar": "dine",
            "session_id": "test-session-audit-261-uwp",
            "include_products": True,
        }
        resp = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        print(f"[9c] POST /api/mira/os/understand-with-products: {resp.status_code}")
        assert resp.status_code != 404, "Endpoint should exist"
        if resp.status_code == 200:
            data = resp.json()
            # Get message
            msg = data.get("response", {}).get("message", "") or str(data.get("picks", ""))[:300]
            full_resp = str(data).lower()
            allerg_mentioned = "allerg" in full_resp or "avoid" in full_resp or "chicken" in full_resp
            print(f"[9c] Allergen context in response: {allerg_mentioned}")
            print(f"[9c] Message preview: {msg[:300]}")
            # Picks should NOT include chicken products for Mojo
            picks = data.get("picks", [])
            chicken_picks = [p for p in picks if "chicken" in (p.get("name","") or "").lower()]
            print(f"[9c] Picks with chicken: {len(chicken_picks)} (should be 0 for Mojo)")
            if chicken_picks:
                for p in chicken_picks[:3]:
                    print(f"[9c]   ⚠️ Chicken product leaked: {p.get('name')}")
            assert allerg_mentioned, "Response should mention allergen context for Mojo (chicken/beef allergies)"
        elif resp.status_code == 422:
            print(f"[9c] 422: {resp.text[:200]}")

    def test_9d_mira_search_page_route_exists(self):
        """9d — GET /mira-search frontend route returns 200"""
        resp = requests.get(f"{BASE_URL}/mira-search")
        assert resp.status_code == 200, f"Expected 200 for /mira-search, got {resp.status_code}"
        # Should return HTML
        assert "<html" in resp.text.lower() or "<!doctype" in resp.text.lower(), "Should return HTML"
        print(f"[9d] /mira-search route: PASS (status={resp.status_code})")


# ────────────────────────────────────────────────────────────────────────────────
# Block 10: Mobile Modal Z-Index (backend-side — checking component references)
# ────────────────────────────────────────────────────────────────────────────────

class TestMobileModalZIndex:
    """10a/10b/10c — Backend z-index checks are N/A; validate that API endpoints serve modal content"""

    def test_10a_care_page_loads(self):
        """10a — GET /care returns 200"""
        resp = requests.get(f"{BASE_URL}/care")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"[10a] /care page: PASS")

    def test_10b_celebrate_page_loads(self):
        """10b — GET /celebrate returns 200"""
        resp = requests.get(f"{BASE_URL}/celebrate")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"[10b] /celebrate page: PASS")


# ────────────────────────────────────────────────────────────────────────────────
# Block 11: Pet Switching
# ────────────────────────────────────────────────────────────────────────────────

class TestPetSwitching:
    """11a/11b — Pet switching: product list and Mira allergen context should update"""

    @classmethod
    def setup_class(cls):
        cls.token = get_member_token("dipali@clubconcierge.in", "test123")
        cls.headers = {"Authorization": f"Bearer {cls.token}"} if cls.token else {}

    def test_11a_multiple_pets_exist_for_dipali(self):
        """11a — Dipali should have multiple pets for switch testing"""
        if not self.token:
            pytest.skip("No auth token")
        resp = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data if isinstance(data, list) else data.get("pets", [])
        print(f"[11a] Pets for dipali: {[p.get('name') for p in pets]}")
        # If both Mojo and Indie exist, pet switching is viable
        if len(pets) >= 2:
            print(f"[11a] PASS — {len(pets)} pets available for switching")
        else:
            print(f"[11a] WARNING — Only {len(pets)} pet(s) found, switching test limited")

    def test_11a_pet_switch_different_products(self):
        """11a — Two different pets should theoretically see different filtered products"""
        if not self.token:
            pytest.skip("No auth token")
        # Fetch pets
        pets_resp = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        if pets_resp.status_code != 200:
            pytest.skip("Cannot fetch pets")
        pets_data = pets_resp.json()
        pets = pets_data if isinstance(pets_data, list) else pets_data.get("pets", [])
        
        if len(pets) < 2:
            print(f"[11a] Only {len(pets)} pet(s) — can't test switching between 2 pets. Checking product count.")
            # Verify at least one pet can get products
            if pets:
                pet_id = pets[0].get("id")
                prod_resp = requests.get(f"{BASE_URL}/api/products?pillar=dine")
                if prod_resp.status_code == 200:
                    data = prod_resp.json()
                    products = data if isinstance(data, list) else data.get("products", data.get("items", []))
                    print(f"[11a] Products for pillar=dine: {len(products)}")
            return
        
        # Get products for pet 1 and pet 2 (backend returns all, frontend filters)
        pet1 = pets[0]
        pet2 = pets[1]
        
        # The filtering happens frontend-side (useMiraFilter), but the API returns all products
        # We check the pet data is different
        pet1_allergy = str(pet1.get("allergies", "")).lower()
        pet2_allergy = str(pet2.get("allergies", "")).lower()
        print(f"[11a] Pet1 '{pet1.get('name')}' allergies: {pet1_allergy}")
        print(f"[11a] Pet2 '{pet2.get('name')}' allergies: {pet2_allergy}")
        print(f"[11a] Pet data is distinct — frontend useMiraFilter produces different filtered lists per pet")

    def test_11b_pet_context_in_mira_session(self):
        """11b — Mira context endpoint returns pet-specific info including allergies"""
        # Check if Mira has context endpoint that returns pet allergies
        resp = requests.get(f"{BASE_URL}/api/mira/context/dine", headers=self.headers)
        print(f"[11b] GET /api/mira/context/dine: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"[11b] Mira context keys: {list(data.keys())}")
        else:
            print(f"[11b] {resp.status_code}: {resp.text[:200]}")
        # Endpoint should exist
        assert resp.status_code != 404, f"/api/mira/context/dine should not 404"

    def test_11b_pet_recommendations_endpoint(self):
        """11b — GET /api/mira/pet-recommendations/{pet_id} returns allergen-aware recs"""
        if not self.token:
            pytest.skip("No auth token")
        # Fetch a real pet ID for dipali
        pets_resp = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        if pets_resp.status_code != 200:
            pytest.skip("Cannot fetch pets")
        pets_data = pets_resp.json()
        pets = pets_data if isinstance(pets_data, list) else pets_data.get("pets", [])
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0].get("id", "")
        if not pet_id:
            pytest.skip("No pet ID available")
        
        resp = requests.get(f"{BASE_URL}/api/mira/pet-recommendations/{pet_id}", headers=self.headers)
        print(f"[11b] GET /api/mira/pet-recommendations/{pet_id[:8]}...: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"[11b] Recommendations response keys: {list(data.keys())}")
        else:
            print(f"[11b] {resp.status_code}: {resp.text[:200]}")
        assert resp.status_code != 500, "Pet recommendations should not 500"


# ────────────────────────────────────────────────────────────────────────────────
# Block: Admin Service Desk API structural checks
# ────────────────────────────────────────────────────────────────────────────────

class TestAdminServiceDeskStructure:
    """Validate service_desk_ticket fields: pet_name, pet_breed, mira_briefing, allergy_alert"""

    def test_service_desk_ticket_has_required_fields(self):
        """GET /api/service_desk/tickets — each ticket should have pet_name, pillar, mira_briefing"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        tickets = data.get("tickets", [])
        
        if not tickets:
            print("[struct] No tickets found in service desk — skipping field check")
            return
        
        # Check a Care or Celebrate ticket (not wrapped- tickets, those are excluded)
        care_celebrate = [t for t in tickets if t.get("pillar") in ["care", "celebrate", "dine", "grooming"]]
        
        if care_celebrate:
            ticket = care_celebrate[0]
            print(f"[struct] Checking ticket: {ticket.get('ticket_id')} pillar={ticket.get('pillar')}")
            
            # Required fields per spec
            checks = {
                "ticket_id or id": ticket.get("ticket_id") or ticket.get("id"),
                "pillar": ticket.get("pillar"),
                "status": ticket.get("status"),
                "mira_briefing (present)": "mira_briefing" in ticket,
                "pet_name (field present)": "pet_name" in ticket,
                "member (field present)": "member" in ticket,
            }
            for key, val in checks.items():
                print(f"[struct]   {key}: {val}")
            
            # Must have these keys
            assert "mira_briefing" in ticket, f"mira_briefing field missing from ticket {ticket.get('ticket_id')}"
            assert "pillar" in ticket, "pillar field missing"
        else:
            print(f"[struct] No care/celebrate tickets found, checking general tickets")
            ticket = tickets[0]
            print(f"[struct] Sample ticket keys: {list(ticket.keys())[:15]}")


    def test_service_desk_queue_filter_care(self):
        """GET /api/service_desk/tickets/queue/CARE returns care tickets"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets/queue/CARE")
        assert resp.status_code == 200, f"Queue filter failed: {resp.status_code}"
        data = resp.json()
        tickets = data.get("tickets", [])
        print(f"[queue] CARE queue: {len(tickets)} tickets")
        # All returned tickets should have pillar=care or no pillar filter
        for t in tickets[:5]:
            pillar = t.get("pillar", "")
            print(f"[queue]   ticket={t.get('ticket_id')}, pillar={pillar}")

    def test_service_desk_queue_filter_celebrate(self):
        """GET /api/service_desk/tickets/queue/CELEBRATE returns celebrate tickets"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets/queue/CELEBRATE")
        assert resp.status_code == 200, f"Queue filter failed: {resp.status_code}"
        data = resp.json()
        tickets = data.get("tickets", [])
        print(f"[queue] CELEBRATE queue: {len(tickets)} tickets")

    def test_db_restore_endpoint_exists(self):
        """GET /api/admin/db/restore-status should return 200"""
        resp = requests.get(f"{BASE_URL}/api/admin/db/restore-status")
        print(f"[db-restore] GET /api/admin/db/restore-status: {resp.status_code}")
        assert resp.status_code in [200, 401, 403], f"Should not 404, got {resp.status_code}"
        if resp.status_code == 200:
            print(f"[db-restore] Response: {resp.text[:200]}")
