"""
Backend tests for iteration 210:
- Migration endpoints (legacy-services)
- Concierge request (ticket creation)
- Products API endpoints for mobile pages
- Admin pillar products
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def get_member_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if resp.status_code == 200:
        return resp.json().get('access_token', '')
    return ''


@pytest.fixture(scope="module")
def token():
    t = get_member_token()
    if not t:
        pytest.skip("Could not get auth token")
    return t


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ── Migration endpoint (POST) ─────────────────────────────────────
class TestMigrationEndpoints:
    """Migration endpoints for legacy-services"""

    def test_post_migrate_legacy_services_returns_200(self):
        """POST /api/admin/migrate/legacy-services returns 200 with basic auth"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/migrate/legacy-services",
            auth=("aditya", "lola4304")
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "success" in data
        assert data["success"] is True

    def test_migrate_legacy_services_response_structure(self):
        """POST /api/admin/migrate/legacy-services returns expected fields"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/migrate/legacy-services",
            auth=("aditya", "lola4304")
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "migrated" in data
        assert "skipped_duplicates" in data
        assert isinstance(data.get("migrated"), int)

    def test_migrate_legacy_services_no_auth_fails(self):
        """POST /api/admin/migrate/legacy-services fails without auth"""
        resp = requests.post(f"{BASE_URL}/api/admin/migrate/legacy-services")
        assert resp.status_code in [401, 403, 422]


# ── Concierge / Ticket creation (via service_desk endpoint) ────────
class TestConciergeRequest:
    """Concierge request (ticket) creation via /api/service_desk/attach_or_create_ticket
    (This is what useConcierge hook uses internally)"""

    def test_create_concierge_ticket_dine_empty(self, auth_headers):
        """Creating a concierge ticket for dine_empty_products channel via service_desk"""
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers=auth_headers,
            json={
                "pillar": "dine",
                "channel": "dine_empty_products",
                "initial_message": {
                    "text": "Mojo needs Food & Nutrition (dine). Breed: Indie. No chicken. Please source options for Mojo.",
                    "sender": "member"
                },
                "intent_primary": "concierge_request",
                "pet_name": "Mojo",
                "parent_id": "dipali@clubconcierge.in",
                "parent_email": "dipali@clubconcierge.in",
                "parent_name": "Dipali",
                "force_new": True
            }
        )
        assert resp.status_code in [200, 201], f"Expected 200/201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Check that ticket was created
        assert data.get("ticket_id") or data.get("id") or data.get("success")

    def test_create_concierge_ticket_celebrate_empty(self, auth_headers):
        """Creating a concierge ticket for celebrate_empty_category channel"""
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            headers=auth_headers,
            json={
                "pillar": "celebrate",
                "channel": "celebrate_empty_category",
                "initial_message": {
                    "text": "Mojo needs Party & Decor (celebrate). Breed: Indie. Please source options for Mojo.",
                    "sender": "member"
                },
                "intent_primary": "concierge_request",
                "pet_name": "Mojo",
                "parent_id": "dipali@clubconcierge.in",
                "parent_email": "dipali@clubconcierge.in",
                "parent_name": "Dipali",
                "force_new": True
            }
        )
        assert resp.status_code in [200, 201], f"Expected 200/201, got {resp.status_code}: {resp.text}"

    def test_concierge_request_without_auth_fails(self):
        """Concierge requests without auth return 401/403"""
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "pillar": "dine",
                "channel": "test",
                "parent_id": "test@test.com",
                "initial_message": {"text": "test", "sender": "member"}
            }
        )
        assert resp.status_code in [401, 403, 422], f"Expected 401/403, got {resp.status_code}"


# ── Pillar Products (products_master) ──────────────────────────────
class TestPillarProducts:
    """Admin pillar products API"""

    def test_get_dine_products_returns_200(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=dine returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "dine", "limit": 10}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "products" in data
        assert isinstance(data["products"], list)

    def test_get_celebrate_products_returns_200(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=celebrate returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "celebrate", "limit": 10}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_get_celebrate_style_subcategory(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=celebrate&sub_category=party_accessories"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "celebrate", "sub_category": "party_accessories", "limit": 20}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "products" in data

    def test_get_celebrate_accessories_subcategory(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=celebrate&sub_category=accessories"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "celebrate", "sub_category": "accessories", "limit": 20}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_care_products_returns_200(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=care returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "care", "limit": 10}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_go_products_returns_200(self, auth_headers):
        """GET /api/admin/pillar-products?pillar=go returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            headers=auth_headers,
            params={"pillar": "go", "limit": 10}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


# ── Auth ────────────────────────────────────────────────────────────
class TestAuthFlow:
    """Authentication flows"""

    def test_member_login_success(self):
        """Member login returns access_token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 10

    def test_admin_basic_auth(self):
        """Admin Basic Auth works for migration endpoint"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/migrate/legacy-services",
            auth=("aditya", "lola4304")
        )
        assert resp.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
