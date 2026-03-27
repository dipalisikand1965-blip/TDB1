"""
Dine Pillar Mobile Audit - Iteration 234
Tests: Service desk tickets, pet data (Mojo), pillar products, pawrent journey, Mira picks
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email":"dipali@clubconcierge.in","password":"test123"})
    assert resp.status_code == 200
    return resp.json().get("access_token","")

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}

# ── Pet data ─────────────────────────────────────────────────────────────────
class TestMojoPetData:
    """Verify Mojo's pet data for Dine page context"""

    def test_mojo_pet_exists(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        assert resp.status_code == 200
        pets = resp.json().get("pets", [])
        mojo = next((p for p in pets if p["name"] == "Mojo"), None)
        assert mojo is not None, "Mojo pet not found"
        assert mojo["breed"] == "Indie"
        assert mojo["id"] == "pet-mojo-7327ad56"

    def test_mojo_allergy_data(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        pets = resp.json().get("pets", [])
        mojo = next((p for p in pets if p["name"] == "Mojo"), None)
        assert mojo is not None
        soul = mojo.get("doggy_soul_answers", {})
        # Mojo has chicken allergy in food_allergies
        assert soul.get("food_allergies") == "chicken", f"Expected chicken, got: {soul.get('food_allergies')}"

    def test_mojo_favourite_protein(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        pets = resp.json().get("pets", [])
        mojo = next((p for p in pets if p["name"] == "Mojo"), None)
        soul = mojo.get("doggy_soul_answers", {})
        # favorite_protein should be Salmon
        assert soul.get("favorite_protein") == "Salmon"

    def test_mojo_birth_date(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        pets = resp.json().get("pets", [])
        mojo = next((p for p in pets if p["name"] == "Mojo"), None)
        # birth_date should be set
        assert mojo.get("birth_date") == "2022-03-27"


# ── Service desk tickets ──────────────────────────────────────────────────────
class TestServiceDeskTickets:
    """Verify ticket creation for Dine CTAs"""

    def test_tickets_endpoint_returns_ok(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit=10", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        tickets = data.get("tickets", data) if isinstance(data, dict) else data
        assert isinstance(tickets, list)
        assert len(tickets) >= 0

    def test_dine_intake_ticket_exists(self, auth_headers):
        """CTA7 and CTA10: Dine concierge intake creates ticket"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit=20", headers=auth_headers)
        data = resp.json()
        tickets = data.get("tickets", data) if isinstance(data, dict) else data
        dine_intake = [t for t in tickets if t.get("pillar") == "dine" and t.get("channel") == "dine_intake"]
        assert len(dine_intake) > 0, "No dine_intake tickets found"
        for t in dine_intake:
            assert t.get("intent_primary") == "concierge_request"

    def test_dine_mira_sheet_ticket_exists(self, auth_headers):
        """CTA5: Mira picks → Reserve via Concierge creates ticket"""
        resp = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit=20", headers=auth_headers)
        data = resp.json()
        tickets = data.get("tickets", data) if isinstance(data, dict) else data
        mira_tickets = [t for t in tickets if t.get("pillar") == "dine" and t.get("channel") == "dine_mira_sheet"]
        assert len(mira_tickets) > 0, "No dine_mira_sheet tickets found (CTA5)"
        assert mira_tickets[0].get("intent_primary") == "service_booking"

    def test_create_dine_ticket_via_api(self, auth_headers):
        """Test ticket creation for pawrent journey (CTA11)"""
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers=auth_headers,
            json={
                "parent_id": "dipali@clubconcierge.in",
                "pet_id": "pet-mojo-7327ad56",
                "pillar": "dine",
                "intent_primary": "meal_plan_setup",
                "life_state": "WELCOME_HOME",
                "channel": "pawrent_journey",
                "initial_message": {"sender": "parent", "text": "Pawrent Journey — Meal plan for Mojo"}
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data
        ticket_id = data["ticket_id"]
        assert ticket_id.startswith("TDB-"), f"Unexpected ticket ID format: {ticket_id}"
        print(f"Created ticket: {ticket_id}")


# ── Dine Products ─────────────────────────────────────────────────────────────
class TestDineProducts:
    """Verify dine pillar products exist with correct data"""

    def test_daily_meals_products(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=20&category=Daily+Meals",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "No Daily Meals products found"
        # Check first product has required fields
        p = products[0]
        assert p.get("name"), "Product name missing"
        price = p.get("price") or p.get("pricing", {}).get("selling_price", 0)
        assert price > 0, f"Product price is 0 or missing: {p.get('name')}"

    def test_treats_products(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=20&category=Treats+%26+Rewards",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "No Treats products found"

    def test_supplements_products(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=20&category=Supplements",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        assert len(products) > 0, "No Supplements products found"

    def test_products_have_non_zero_prices(self, auth_headers):
        """PHASE7: Product prices must not be ₹0"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=10&category=Daily+Meals",
            headers=auth_headers
        )
        data = resp.json()
        products = data.get("products", [])
        for p in products[:5]:
            price = p.get("price") or p.get("pricing", {}).get("selling_price", 0)
            assert float(price) > 0, f"Product '{p.get('name')}' has price=0"


# ── Mira Picks ────────────────────────────────────────────────────────────────
class TestMiraPicks:
    """Verify Mira picks endpoint for Dine"""

    def test_mira_dine_picks_endpoint(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56?pillar=dine&limit=6&min_score=60&entity_type=product",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get("picks", [])
        assert isinstance(picks, list)
        print(f"Mira dine product picks count: {len(picks)}")

    def test_mira_dine_service_picks(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56?pillar=dine&limit=3&min_score=60&entity_type=service",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get("picks", [])
        assert isinstance(picks, list)
        print(f"Mira dine service picks count: {len(picks)}")


# ── Pawrent Journey ────────────────────────────────────────────────────────────
class TestPawrentJourney:
    """Verify pawrent journey progress endpoint"""

    def test_pawrent_progress_endpoint(self, auth_headers):
        resp = requests.get(
            f"{BASE_URL}/api/pawrent-journey/progress/pet-mojo-7327ad56",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "completed_steps" in data
        assert isinstance(data["completed_steps"], list)
        print(f"Completed steps: {data['completed_steps']}")

    def test_complete_dine_step(self, auth_headers):
        """CTA11: Complete a dine step creates progress record"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers=auth_headers,
            json={
                "pet_id": "pet-mojo-7327ad56",
                "step_id": "dine-fresh-food",
                "pillar": "dine"
            }
        )
        assert resp.status_code in [200, 201, 204], f"Unexpected: {resp.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
