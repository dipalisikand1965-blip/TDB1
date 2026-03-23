"""
Backend tests for BreedCakeManager admin features and DoggyBakeryCakeModal ticket endpoint.
Tests:
- /api/mockups/breed-products API (gallery data)
- /api/service_desk/attach_or_create_ticket (order ticket creation)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def auth_token():
    """Get user JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    }, timeout=10)
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token", "")
    pytest.skip(f"Auth failed: {response.status_code}")


@pytest.fixture(scope="module")
def admin_auth():
    """Admin Basic auth header"""
    import base64
    creds = base64.b64encode(b"aditya:lola4304").decode()
    return {"Authorization": f"Basic {creds}", "Content-Type": "application/json"}


class TestBreedCakeGallery:
    """Tests for breed cake illustration gallery API"""

    def test_breed_products_returns_200(self, admin_auth):
        """GET /api/mockups/breed-products returns 200"""
        res = requests.get(
            f"{BASE_URL}/api/mockups/breed-products?product_type=birthday_cake&limit=10",
            headers=admin_auth, timeout=30
        )
        assert res.status_code == 200

    def test_breed_products_has_illustrations(self, admin_auth):
        """Gallery should have at least some cake illustrations"""
        res = requests.get(
            f"{BASE_URL}/api/mockups/breed-products?product_type=birthday_cake&limit=200",
            headers=admin_auth, timeout=15
        )
        assert res.status_code == 200
        data = res.json()
        products = data.get("products") or data if isinstance(data, list) else []
        if isinstance(data, dict):
            products = data.get("products", [])
        print(f"INFO: Found {len(products)} cake illustrations")
        assert len(products) > 10, f"Expected >10 illustrations, got {len(products)}"

    def test_breed_products_have_required_fields(self, admin_auth):
        """Each product should have id, breed, product_type fields"""
        res = requests.get(
            f"{BASE_URL}/api/mockups/breed-products?product_type=birthday_cake&limit=5",
            headers=admin_auth, timeout=15
        )
        assert res.status_code == 200
        data = res.json()
        products = data.get("products") or (data if isinstance(data, list) else [])
        if isinstance(data, dict):
            products = data.get("products", [])

        if products:
            item = products[0]
            assert "id" in item, "Missing 'id' field"
            assert "breed" in item, "Missing 'breed' field"
            # Image URL should exist
            has_image = item.get("cloudinary_url") or item.get("mockup_url") or item.get("image_url")
            assert has_image, "Product should have at least one image URL"

    def test_breed_products_filter_by_breed(self, admin_auth):
        """Filter by breed=beagle should return beagle illustrations"""
        res = requests.get(
            f"{BASE_URL}/api/mockups/breed-products?breed=beagle&product_type=birthday_cake&limit=10",
            headers=admin_auth, timeout=15
        )
        assert res.status_code == 200
        data = res.json()
        products = data.get("products") or (data if isinstance(data, list) else [])
        if isinstance(data, dict):
            products = data.get("products", [])

        if products:
            for p in products:
                assert p.get("breed") == "beagle", f"Expected breed=beagle, got {p.get('breed')}"
            print(f"PASS: {len(products)} beagle illustrations found")


class TestMockupGenStatus:
    """Tests for generation status endpoint"""

    def test_gen_status_returns_200(self):
        """GET /api/mockups/mockup-gen-status returns 200"""
        res = requests.get(f"{BASE_URL}/api/mockups/mockup-gen-status", timeout=10)
        assert res.status_code == 200

    def test_gen_status_has_fields(self):
        """Status should have running, generated, total fields"""
        res = requests.get(f"{BASE_URL}/api/mockups/mockup-gen-status", timeout=10)
        assert res.status_code == 200
        data = res.json()
        assert "running" in data, "Missing 'running' field"
        print(f"INFO: Gen status — running={data.get('running')}, generated={data.get('generated')}/{data.get('total')}")


class TestAttachOrCreateTicket:
    """Tests for the ticket creation endpoint used by DoggyBakeryCakeModal"""

    def test_ticket_without_parent_id_returns_422(self, auth_token):
        """Missing parent_id should return 422 validation error (NOT 500)"""
        res = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {auth_token}"},
            json={
                "intent_primary": "breed_cake_order",
                "pillar": "celebrate",
                "channel": "doggy_bakery_order",
                "urgency": "normal",
            },
            timeout=10
        )
        assert res.status_code == 422, f"Expected 422, got {res.status_code}"
        data = res.json()
        assert "detail" in data
        errors = data["detail"]
        missing_fields = [e["loc"][-1] for e in errors if isinstance(e, dict) and e.get("type") == "missing"]
        assert "parent_id" in missing_fields, f"Expected parent_id in missing fields, got {missing_fields}"

    def test_ticket_with_parent_id_no_initial_message_returns_200(self, auth_token):
        """With parent_id but no initial_message should NOT crash (500 fix verification)"""
        res = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {auth_token}"},
            json={
                "parent_id": "dipali@clubconcierge.in",
                "intent_primary": "breed_cake_order",
                "pillar": "celebrate",
                "channel": "doggy_bakery_order",
                "urgency": "normal",
            },
            timeout=20
        )
        # Should be 200, NOT 500 (that was the bug we fixed)
        assert res.status_code != 500, f"Got 500 Internal Server Error — initial_message null check fix failed"
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"

    def test_ticket_with_parent_id_and_initial_message_returns_200(self, auth_token):
        """Full fixed payload (parent_id + initial_message) should return 200 with ticket_id"""
        res = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {auth_token}"},
            json={
                "parent_id": "dipali@clubconcierge.in",
                "intent_primary": "breed_cake_order",
                "pillar": "celebrate",
                "channel": "doggy_bakery_order",
                "urgency": "normal",
                "initial_message": {
                    "sender": "parent",
                    "source": "breed_cake_order",
                    "text": "🎂 TEST Breed Cake Order — Indie · Oats · Banana — for Mojo\n\nFOR: Mojo (Indie)\nBase: Oats\nFlavour: Banana\nPrice: ₹950"
                }
            },
            timeout=20
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "ticket_id" in data, f"Expected ticket_id in response, got: {data}"
        assert "is_new" in data, "Expected is_new in response"
        print(f"PASS: Ticket created with id={data.get('ticket_id')}, is_new={data.get('is_new')}")
