"""
Iteration 218 - Backend tests for 5 fixes:
1. Memory API: POST /api/mira/memory/save and GET /api/mira/memory/{pet_id}
2. Multi-pillar intent: POST /api/mira/detect-intent returns pillars array
3. DELETE /api/mira/memory/{pet_id} cleanup
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali@clubconcierge.in"""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "dipali@clubconcierge.in", "password": "test123"},
    )
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        if token:
            return token
    pytest.skip(f"Auth failed: {resp.status_code} — {resp.text[:200]}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ── Fix 5: Mira Memory API ───────────────────────────────────────────────────

class TestMiraMemoryAPI:
    """Fix 5 — /api/mira/memory/* endpoints"""

    TEST_PET_ID = "mem_test_001"

    def test_save_mira_memory(self, auth_headers):
        """POST /api/mira/memory/save — store messages"""
        payload = {
            "pet_id": self.TEST_PET_ID,
            "pet_name": "Mojo",
            "messages": [
                {"role": "user",      "content": "I want grooming", "pillar": "care"},
                {"role": "assistant", "content": "Done!",            "pillar": "care"},
            ],
        }
        resp = requests.post(
            f"{BASE_URL}/api/mira/memory/save",
            json=payload,
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok:true, got {data}"
        assert data.get("stored") == 2, f"Expected stored:2, got {data.get('stored')}"

    def test_get_mira_memory(self, auth_headers):
        """GET /api/mira/memory/{pet_id} — retrieve stored messages"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/memory/{self.TEST_PET_ID}",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "messages" in data, "Response should have 'messages' key"
        assert isinstance(data["messages"], list), "messages should be a list"
        # Verify our saved messages are present
        assert len(data["messages"]) >= 2, f"Expected >= 2 messages, got {len(data['messages'])}"
        # Verify message content
        roles = [m.get("role") for m in data["messages"][-2:]]
        assert "user" in roles, f"Expected 'user' role in messages: {roles}"
        assert "assistant" in roles, f"Expected 'assistant' role in messages: {roles}"

    def test_get_memory_response_structure(self, auth_headers):
        """Verify response structure has all expected fields"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/memory/{self.TEST_PET_ID}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "preferences" in data, "Response should have 'preferences' key"
        assert "service_interests" in data, "Response should have 'service_interests' key"
        assert "concierge_requests" in data, "Response should have 'concierge_requests' key"
        assert isinstance(data["preferences"], list)
        assert isinstance(data["service_interests"], list)
        assert isinstance(data["concierge_requests"], list)

    def test_save_with_preference_and_service_interest(self, auth_headers):
        """POST /api/mira/memory/save with preferences and service_interest"""
        payload = {
            "pet_id": self.TEST_PET_ID,
            "pet_name": "Mojo",
            "messages": [
                {"role": "user", "content": "Mojo loves baths", "pillar": "care"},
            ],
            "preferences": ["Mojo loves baths"],
            "service_interest": "grooming",
        }
        resp = requests.post(
            f"{BASE_URL}/api/mira/memory/save",
            json=payload,
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("ok") is True

    def test_get_memory_no_auth_still_works(self):
        """GET without auth token should still return empty/valid response"""
        resp = requests.get(f"{BASE_URL}/api/mira/memory/{self.TEST_PET_ID}")
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "messages" in data

    def test_delete_mira_memory(self, auth_headers):
        """DELETE /api/mira/memory/{pet_id} — clear conversation history"""
        resp = requests.delete(
            f"{BASE_URL}/api/mira/memory/{self.TEST_PET_ID}",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok:true, got {data}"

    def test_get_memory_after_delete_is_empty(self, auth_headers):
        """After delete, GET should return empty messages"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/memory/{self.TEST_PET_ID}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["messages"], list)
        assert len(data["messages"]) == 0, f"Expected empty messages after delete, got {len(data['messages'])}"


# ── Multi-pillar Intent Detection ────────────────────────────────────────────

class TestMultiPillarIntent:
    """Multi-pillar intent — /api/mira/detect-intent returns pillars array"""

    def test_single_pillar_intent(self):
        """Grooming intent → care pillar"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "I want a grooming session for my dog", "pet_name": "Mojo", "pet_breed": "Indie"},
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "pillars" in data, f"Response should have 'pillars' array: {data}"
        assert isinstance(data["pillars"], list), f"pillars should be a list: {data}"

    def test_multi_pillar_intent_walk_and_grooming(self):
        """'birthday walk AND grooming session' → should detect go/celebrate + care"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={
                "message": "I want birthday walk AND grooming session",
                "pet_name": "Mojo",
                "pet_breed": "Indie",
            },
        )
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text}"
        data = resp.json()
        pillars = data.get("pillars", [])
        assert isinstance(pillars, list), f"pillars should be a list: {data}"
        assert len(pillars) >= 2, f"Expected >=2 pillars for multi-intent, got {len(pillars)}: {pillars}"
        # Each pillar should have confidence >= 40
        for p in pillars:
            assert p.get("confidence", 0) >= 40, f"Pillar confidence should be >=40: {p}"
            assert "pillar" in p, f"Each pillar entry should have 'pillar' key: {p}"
            assert "service" in p, f"Each pillar entry should have 'service' key: {p}"

    def test_multi_pillar_response_structure(self):
        """Verify full response structure"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={
                "message": "I want birthday walk AND grooming session",
                "pet_name": "Mojo",
                "pet_breed": "Indie",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        # Required fields
        assert "pillars" in data
        # Legacy compat fields
        assert "primary_pillar" in data
        assert "display_text" in data

    def test_short_message_returns_empty(self):
        """Short message under 5 chars → no pillars"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "hi", "pet_name": "Mojo"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Short message should return pillar=None or empty
        pillars = data.get("pillars", None)
        confidence = data.get("confidence", 0)
        # Either empty pillars or 0 confidence
        assert pillars is None or (isinstance(pillars, list) and len(pillars) == 0) or confidence == 0

    def test_food_intent_dine_pillar(self):
        """Nutrition/food intent → dine pillar"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "I need a diet plan and meal consultation for my dog", "pet_name": "Mojo"},
        )
        assert resp.status_code == 200
        data = resp.json()
        pillars = data.get("pillars", [])
        # Should detect dine pillar
        if pillars:
            pillar_ids = [p.get("pillar") for p in pillars]
            assert "dine" in pillar_ids, f"Expected 'dine' pillar, got: {pillar_ids}"


# ── Memory Route Registration Check ─────────────────────────────────────────

class TestMemoryRouteRegistration:
    """Check all memory endpoints are properly registered"""

    def test_memory_save_endpoint_exists(self, auth_headers):
        """POST /api/mira/memory/save endpoint reachable"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/memory/save",
            json={"pet_id": "route_test_001", "messages": []},
            headers=auth_headers,
        )
        # Should NOT be 404 or 405
        assert resp.status_code != 404, "Memory save endpoint not found (404)"
        assert resp.status_code != 405, "Method not allowed (405) on memory save"

    def test_memory_get_endpoint_exists(self):
        """GET /api/mira/memory/{pet_id} endpoint reachable"""
        resp = requests.get(f"{BASE_URL}/api/mira/memory/route_test_001")
        assert resp.status_code != 404, "Memory GET endpoint not found (404)"
        assert resp.status_code != 405, "Method not allowed (405) on memory GET"

    def test_memory_delete_endpoint_exists(self, auth_headers):
        """DELETE /api/mira/memory/{pet_id} endpoint reachable"""
        resp = requests.delete(
            f"{BASE_URL}/api/mira/memory/route_test_001",
            headers=auth_headers,
        )
        assert resp.status_code != 404, "Memory DELETE endpoint not found (404)"
        assert resp.status_code != 405, "Method not allowed (405) on memory DELETE"
