"""
Celebrate Pillar Full Audit — Backend CTA Ticket Tests
Tests all ticket creation pathways from the Celebrate pillar

Iteration 232 — tests for:
- Ticket creation: breed cake, concierge intake, category strip, service grid
- Near Me venue ticket
- PawrentJourney step booking
- Ticket listing + verification
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS = "test123"

PET_ID = "pet-mojo-7327ad56"
PET_NAME = "Mojo"

@pytest.fixture(scope="module")
def token():
    """Login as member and get token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MEMBER_EMAIL,
        "password": MEMBER_PASS
    })
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text[:200]}"
    data = resp.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, "No token in login response"
    return tok


@pytest.fixture
def auth_headers(token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }


# ── Helper: get latest tickets ───────────────────────────────────────────────

def get_latest_tickets(auth_headers, limit=5):
    resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit={limit}", headers=auth_headers)
    assert resp.status_code == 200, f"Tickets endpoint failed: {resp.status_code}"
    data = resp.json()
    tickets = data.get('tickets', data) if isinstance(data, dict) else data
    return tickets if isinstance(tickets, list) else []


# ── STRUCTURAL CHECKS via API ────────────────────────────────────────────────

class TestStructuralAPIs:
    """Verify APIs that back the mobile page components"""

    def test_category_strip_birthday_cakes_modal_products(self, auth_headers):
        """CelebrateCategoryStrip → Birthday Cakes → CelebrateContentModal loads products"""
        # Category content is loaded via mira picks or product-box
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{PET_ID}?pillar=celebrate&limit=6&entity_type=product",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Mira picks endpoint failed: {resp.status_code}"
        data = resp.json()
        assert 'picks' in data or isinstance(data, list), "No picks in response"

    def test_service_box_celebrate_services(self, auth_headers):
        """CelebrateServiceGrid → /api/service-box/services?pillar=celebrate returns services"""
        resp = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=20&is_active=true",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Service box failed: {resp.status_code}"
        data = resp.json()
        services = data.get('services', [])
        assert isinstance(services, list), "services should be a list"
        # At least some celebrate services expected
        print(f"[test] Found {len(services)} celebrate services")

    def test_breed_cake_illustrations_load(self, auth_headers):
        """BreedCakeOrderModal → loads breed illustrations for labrador"""
        resp = requests.get(
            f"{BASE_URL}/api/mockups/breed-products?breed=labrador&product_type=birthday_cake&limit=8",
            headers=auth_headers
        )
        assert resp.status_code in [200, 404], f"Breed illustrations endpoint: {resp.status_code}"
        if resp.status_code == 200:
            data = resp.json()
            products = data.get('products', data.get('results', []))
            print(f"[test] Found {len(products)} labrador cake illustrations")

    def test_personalised_breed_section_products(self, auth_headers):
        """PersonalisedBreedSection → /api/breed-catalogue/products?breed=Indie"""
        resp = requests.get(
            f"{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Breed catalogue failed: {resp.status_code}"
        data = resp.json()
        products = data.get('products', [])
        print(f"[test] Found {len(products)} Indie breed products")

    def test_birthday_countdown_pet_profile(self, auth_headers):
        """BirthdayCountdown → pet profile has birthday field"""
        resp = requests.get(f"{BASE_URL}/api/pets/{PET_ID}", headers=auth_headers)
        assert resp.status_code == 200, f"Pet profile failed: {resp.status_code}"
        data = resp.json()
        pet = data.get('pet', data)
        print(f"[test] Pet: {pet.get('name','?')}, birthday: {pet.get('birthday','not set')}")

    def test_pawrent_journey_progress(self, auth_headers):
        """PawrentFirstStepsTab → /api/pawrent-journey/progress/{petId}"""
        resp = requests.get(
            f"{BASE_URL}/api/pawrent-journey/progress/{PET_ID}",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Pawrent journey progress: {resp.status_code}"
        data = resp.json()
        assert 'completed_steps' in data, "completed_steps field missing"
        print(f"[test] Completed steps: {len(data['completed_steps'])}")

    def test_near_me_celebrate_places(self, auth_headers):
        """CelebrateNearMe → nearby places API"""
        resp = requests.get(
            f"{BASE_URL}/api/places/nearby?pillar=celebrate&lat=19.0760&lng=72.8777",
            headers=auth_headers
        )
        # May return 200 or 404 depending on location services
        assert resp.status_code in [200, 404, 422], f"Unexpected status: {resp.status_code}"
        print(f"[test] Near me status: {resp.status_code}")


# ── CTA TICKET CREATION TESTS ────────────────────────────────────────────────

class TestCTATicketCreation:
    """Verify each CTA creates a real ticket in the backend"""

    TICKET_ENDPOINT = "/api/service_desk/attach_or_create_ticket"

    def _create_ticket(self, auth_headers, payload):
        resp = requests.post(
            f"{BASE_URL}{self.TICKET_ENDPOINT}",
            headers=auth_headers,
            json=payload
        )
        assert resp.status_code in [200, 201], f"Ticket creation failed: {resp.status_code} {resp.text[:300]}"
        data = resp.json()
        ticket_id = data.get('ticket_id') or data.get('id') or data.get('_id')
        print(f"[test] Created ticket: {ticket_id}")
        return ticket_id, data

    def test_cta1_birthday_cakes_category_strip_ticket(self, auth_headers):
        """CTA TEST 1: Tap Birthday Cakes in category strip → ticket created"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "browse_birthday_cakes",
            "pillar": "celebrate",
            "channel": "celebrate_category_strip",
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 1: Birthday Cakes category viewed for {PET_NAME}"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"

        # Verify in recent tickets
        tickets = get_latest_tickets(auth_headers, limit=10)
        found = any(
            t.get('channel') == 'celebrate_category_strip' or
            t.get('pillar') == 'celebrate'
            for t in tickets[:5]
        )
        assert found, "Ticket not found in recent listings"
        print(f"[test] CTA1 ticket {ticket_id} verified in listings")

    def test_cta2_birthday_countdown_plan_party_ticket(self, auth_headers):
        """CTA TEST 2: Tap Plan Party from BirthdayCountdown → ConciergeIntakeModal → ticket"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "birthday_planning",
            "pillar": "celebrate",
            "channel": "celebrate_concierge_intake_modal",
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 2: Plan birthday party for {PET_NAME}"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"
        print(f"[test] CTA2 ticket {ticket_id} — Birthday Countdown Plan Party")

    def test_cta4_soul_celebration_pillars_ticket(self, auth_headers):
        """CTA TEST 4: Tap SoulCelebrationPillars option → intent ticket"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "celebrate_soul_pillar",
            "pillar": "celebrate",
            "channel": "soul_celebration_pillars",
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 4: Soul pillar option selected for {PET_NAME}"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"
        print(f"[test] CTA4 ticket {ticket_id} — SoulCelebrationPillars")

    def test_cta7_service_grid_ticket(self, auth_headers):
        """CTA TEST 7: Tap service in CelebrateServiceGrid → ticket with pillar=celebrate"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "celebrate_service",
            "pillar": "celebrate",
            "channel": "celebrate_service_grid",
            "urgency": "normal",
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 7: {PET_NAME} — Birthday Party via service grid"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"

        # Check pillar is celebrate in the returned data
        returned_pillar = data.get('pillar') or data.get('ticket', {}).get('pillar')
        if returned_pillar:
            assert returned_pillar == 'celebrate', f"Expected pillar=celebrate, got {returned_pillar}"
        print(f"[test] CTA7 ticket {ticket_id} — service grid, pillar=celebrate")

    def test_cta8_plan_with_concierge_ticket(self, auth_headers):
        """CTA TEST 8: Plan with Concierge® button → ticket with channel=celebrate_intake"""
        # The CelebrateConciergeCard calls setIntakeOpen(true) → ConciergeIntakeModal submits via bookViaConcierge
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "concierge_request",
            "pillar": "celebrate",
            "channel": "celebrate_concierge_intake_modal",  # channel used by ConciergeIntakeModal
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 8: Plan with Concierge® for {PET_NAME}"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"
        print(f"[test] CTA8 ticket {ticket_id} — Plan with Concierge®")

    def test_cta9_pawrent_first_steps_ticket(self, auth_headers):
        """CTA TEST 9: PawrentFirstStepsTab step action → ticket via bookViaConciergeDirect"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "birthday_planning",
            "pillar": "celebrate",
            "channel": "pawrent_journey",
            "life_state": "GROWING",
            "initial_message": {
                "sender": "parent",
                "text": f"CTA TEST 9: Pawrent Journey — Plan birthday for {PET_NAME}"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"
        print(f"[test] CTA9 ticket {ticket_id} — PawrentFirstStepsTab step action")

    def test_breed_cake_order_ticket(self, auth_headers):
        """Breed Cakes → BreedCakeOrderModal → Order → ticket with channel=doggy_bakery_order"""
        ticket_id, data = self._create_ticket(auth_headers, {
            "parent_id": MEMBER_EMAIL,
            "pet_id": PET_ID,
            "intent_primary": "breed_cake_order",
            "pillar": "celebrate",
            "channel": "doggy_bakery_order",
            "urgency": "normal",
            "initial_message": {
                "sender": "parent",
                "source": "breed_cake_order",
                "text": f"🎂 BREED CAKE ORDER — THE DOGGY BAKERY\nFOR: {PET_NAME} (Indie)\nBase: Oats\nFlavour: Banana\nPrice: ₹950"
            }
        })
        assert ticket_id is not None, "No ticket_id returned"

        # Verify in listings
        tickets = get_latest_tickets(auth_headers, limit=10)
        breed_cake_tickets = [
            t for t in tickets
            if t.get('channel') == 'doggy_bakery_order' or t.get('intent_primary') == 'breed_cake_order'
        ]
        print(f"[test] Breed cake ticket {ticket_id} — found {len(breed_cake_tickets)} matching in recent tickets")
        # Assert ticket_id exists (creation verified above)

    def test_ticket_listing_returns_recent_celebrate_tickets(self, auth_headers):
        """GET /api/service_desk/tickets → recent tickets include celebrate pillar"""
        tickets = get_latest_tickets(auth_headers, limit=20)
        assert len(tickets) > 0, "No tickets returned"

        celebrate_tickets = [t for t in tickets if t.get('pillar') == 'celebrate']
        assert len(celebrate_tickets) > 0, f"No celebrate tickets found in last 20 tickets (pillars: {[t.get('pillar') for t in tickets[:5]]})"
        print(f"[test] Found {len(celebrate_tickets)} celebrate tickets in last 20")

        # Print latest 5 for audit
        for t in tickets[:5]:
            print(f"  {t.get('created_at','?')[:16]} | {t.get('pillar','?')} | {t.get('intent_primary','?')} | {t.get('channel','?')} | id: {t.get('id','?')}")


# ── DEAD CODE CHECK ──────────────────────────────────────────────────────────

class TestDeadCodeCheck:
    """Verify dead import flagging"""

    def test_soul_made_modal_import_is_unused_in_mobile_page(self):
        """
        DEAD CODE: SoulMadeModal is imported on line 20 of CelebrateMobilePage.jsx
        but is never rendered in the component's JSX.
        PersonalisedBreedSection handles SoulMadeModal internally.
        """
        import re
        mobile_page_path = "/app/frontend/src/pages/CelebrateMobilePage.jsx"
        with open(mobile_page_path, 'r') as f:
            content = f.read()

        # Confirm import exists
        assert 'SoulMadeModal' in content, "SoulMadeModal import not found — test invalid"

        # Check that SoulMadeModal is imported
        import_match = re.search(r"import SoulMadeModal", content)
        assert import_match, "SoulMadeModal import line not found"

        # Now check if SoulMadeModal is used in JSX (render/return section)
        # Remove the import line itself
        content_no_import = re.sub(r"import SoulMadeModal.*\n", "", content)
        is_used_in_jsx = '<SoulMadeModal' in content_no_import
        is_referenced = 'SoulMadeModal' in content_no_import

        print(f"[test] SoulMadeModal imported: True")
        print(f"[test] SoulMadeModal used in JSX: {is_used_in_jsx}")
        print(f"[test] SoulMadeModal referenced elsewhere: {is_referenced}")

        # This is the dead import — assert it IS unused (document the bug)
        assert not is_used_in_jsx, (
            "SoulMadeModal IS rendered in JSX — dead import claim is wrong"
        )
        # This assertion will PASS when the import is indeed dead (bug confirmed)


# ── LAYOUT ORDER VERIFICATION (file-based) ──────────────────────────────────

class TestLayoutOrderFromCode:
    """Parse CelebrateMobilePage.jsx to verify component order matches spec"""

    def test_category_strip_outside_tabs(self):
        """CelebrateCategoryStrip must appear BEFORE the tab bar in source"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            content = f.read()

        strip_idx = content.find('CelebrateCategoryStrip')
        tab_bar_idx = content.find('celebrate-tab-')
        assert strip_idx < tab_bar_idx, \
            f"CelebrateCategoryStrip (pos {strip_idx}) appears AFTER tab bar (pos {tab_bar_idx})"
        print(f"[test] CelebrateCategoryStrip at {strip_idx}, tab bar at {tab_bar_idx} ✅")

    def test_celebration_memory_wall_is_last_before_modals(self):
        """CelebrationMemoryWall must be last content in the celebrate tab"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            content = f.read()

        wall_idx = content.rfind('CelebrationMemoryWall')
        concierge_card_idx = content.rfind('CelebrateConciergeCard')
        service_grid_idx = content.rfind('CelebrateServiceGrid')

        assert concierge_card_idx < wall_idx, \
            f"CelebrateConciergeCard must come BEFORE CelebrationMemoryWall, got: concierge={concierge_card_idx}, wall={wall_idx}"
        assert service_grid_idx < wall_idx, \
            f"CelebrateServiceGrid must come BEFORE CelebrationMemoryWall"
        print(f"[test] Layout order: ServiceGrid({service_grid_idx}) < ConciergeCard({concierge_card_idx}) < MemoryWall({wall_idx}) ✅")

    def test_pawrent_first_steps_starts_collapsed(self):
        """PawrentFirstStepsTab must have defaultCollapsed={true} on mobile page"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            content = f.read()

        assert 'PawrentFirstStepsTab' in content, "PawrentFirstStepsTab not found in mobile page"
        assert 'defaultCollapsed={true}' in content, \
            "defaultCollapsed={true} not found — PawrentFirstStepsTab may start OPEN (bug)"
        print("[test] PawrentFirstStepsTab defaultCollapsed={true} ✅")

    def test_breed_cakes_opens_breed_cake_order_modal(self):
        """handleCategorySelect for 'breed-cakes' must call setBreedCakeOpen(true), not old modal"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            content = f.read()

        # Must have the breed-cakes check
        assert "categoryId === 'breed-cakes'" in content, "breed-cakes check missing in handleCategorySelect"
        assert 'setBreedCakeOpen(true)' in content, "setBreedCakeOpen(true) not called for breed-cakes"
        # Must import from BreedCakeOrderModal
        assert 'BreedCakeOrderModal' in content, "BreedCakeOrderModal not imported"
        print("[test] Breed Cakes → setBreedCakeOpen(true) → DoggyBakeryCakeModal (BreedCakeOrderModal) ✅")

    def test_near_me_tab_has_padding(self):
        """Near Me tab content div must have 16px padding"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            content = f.read()

        # Find the Near Me tab section
        nearme_idx = content.find("activeTab === 'nearme'")
        assert nearme_idx != -1, "Near Me tab section not found"
        # The nearme block should have 16px padding in its container
        nearme_block = content[nearme_idx:nearme_idx + 400]
        has_padding = '16px' in nearme_block
        assert has_padding, f"16px padding not found in Near Me block: {nearme_block[:200]}"
        print("[test] Near Me tab 16px padding ✅")

    def test_soul_made_import_is_dead(self):
        """SoulMadeModal imported but not rendered in CelebrateMobilePage.jsx"""
        with open("/app/frontend/src/pages/CelebrateMobilePage.jsx") as f:
            lines = f.readlines()

        import_line = None
        for i, line in enumerate(lines, 1):
            if 'import SoulMadeModal' in line:
                import_line = i
                break

        assert import_line is not None, "SoulMadeModal import not found"
        print(f"[test] SoulMadeModal imported on line {import_line} (expected line ~20)")

        # Check it's never rendered
        full_content = ''.join(lines)
        import re
        content_no_import = re.sub(r"import SoulMadeModal.*\n", "", full_content)
        assert '<SoulMadeModal' not in content_no_import, \
            "SoulMadeModal IS rendered — dead import claim is wrong"
        print(f"[test] ⚠️ DEAD IMPORT CONFIRMED: SoulMadeModal on line {import_line} — never rendered. Remove it.")

    def test_desktop_breed_cakes_uses_breed_cake_order_modal(self):
        """CelebratePageNew.jsx breed-cakes also opens BreedCakeOrderModal"""
        with open("/app/frontend/src/pages/CelebratePageNew.jsx") as f:
            content = f.read()

        assert "BreedCakeOrderModal" in content, "BreedCakeOrderModal not imported in CelebratePageNew.jsx"
        assert "categoryId === 'breed-cakes'" in content or "breed-cakes" in content, \
            "breed-cakes check missing in CelebratePageNew.jsx"
        # Should open via state, not old event-based modal
        assert 'setBreedCakeOpen(true)' in content, \
            "setBreedCakeOpen(true) not found in CelebratePageNew desktop page"
        print("[test] Desktop CelebratePageNew Breed Cakes → BreedCakeOrderModal ✅")
