"""
Test file for Pawrent Journey backend endpoints - iteration 231
Tests: GET /api/pawrent-journey/progress/{pet_id}
       POST /api/pawrent-journey/complete-step
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')

# ── Auth fixtures ─────────────────────────────────────────────

@pytest.fixture(scope="module")
def auth_token():
    """Login and get token for dipali@clubconcierge.in"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if resp.status_code != 200:
        pytest.skip(f"Login failed with status {resp.status_code}: {resp.text}")
    data = resp.json()
    token = data.get("token") or data.get("access_token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def pet_id(auth_headers):
    """Get a valid pet_id (Mojo - created 2026-02-26, GROWING mode)"""
    resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
    if resp.status_code != 200:
        pytest.skip(f"Could not get pets: {resp.status_code}")
    data = resp.json()
    # Handle both list and dict response
    pets = data.get("pets", data) if isinstance(data, dict) else data
    if not pets:
        pytest.skip("No pets found for this user")
    # Look for Mojo specifically
    for pet in pets:
        if isinstance(pet, dict) and pet.get("name", "").lower() == "mojo":
            print(f"Found Mojo with id={pet['id']}, created={pet.get('created_at')}")
            return pet["id"]
    # Fall back to first pet
    first = pets[0]
    if isinstance(first, dict):
        print(f"Mojo not found, using first pet: {first.get('name')} id={first['id']}")
        return first["id"]
    pytest.skip("Could not find a valid pet")


# ── Tests ─────────────────────────────────────────────────────

class TestPawrentJourneyProgress:
    """Test GET /api/pawrent-journey/progress/{pet_id}"""

    def test_get_progress_returns_200(self, auth_headers, pet_id):
        """GET progress returns 200 with auth"""
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print(f"GET progress 200 OK")

    def test_get_progress_returns_completed_steps_list(self, auth_headers, pet_id):
        """Response has completed_steps array"""
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "completed_steps" in data, f"'completed_steps' not in response: {data}"
        assert isinstance(data["completed_steps"], list), f"completed_steps should be a list, got: {type(data['completed_steps'])}"
        print(f"completed_steps: {data['completed_steps']}")

    def test_get_progress_unauthenticated_returns_401(self, pet_id):
        """GET progress without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
        print(f"Unauthenticated returns {resp.status_code} - correct")


class TestPawrentJourneyCompleteStep:
    """Test POST /api/pawrent-journey/complete-step"""

    def test_complete_step_returns_ok_true(self, auth_headers, pet_id):
        """POST complete-step returns {ok: true}"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers=auth_headers,
            json={
                "pet_id": pet_id,
                "step_id": "TEST_care-first-vet",
                "pillar": "care"
            }
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok=true, got: {data}"
        print(f"complete-step returned: {data}")

    def test_complete_step_persists_in_progress(self, auth_headers, pet_id):
        """Completed step appears in GET progress response"""
        step_id = "TEST_care-microchip-231"
        
        # Complete the step
        post_resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers=auth_headers,
            json={"pet_id": pet_id, "step_id": step_id, "pillar": "care"}
        )
        assert post_resp.status_code == 200, f"POST failed: {post_resp.status_code}"
        assert post_resp.json().get("ok") is True
        
        # Verify it's in GET progress
        get_resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert step_id in data["completed_steps"], f"Step {step_id} not in completed_steps: {data['completed_steps']}"
        print(f"Step {step_id} correctly persisted in progress")

    def test_complete_step_returns_streak_days(self, auth_headers, pet_id):
        """POST complete-step returns streak_days"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers=auth_headers,
            json={"pet_id": pet_id, "step_id": "TEST_streak-check", "pillar": "care"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "streak_days" in data, f"'streak_days' not in response: {data}"
        assert isinstance(data["streak_days"], int), f"streak_days should be int, got: {type(data['streak_days'])}"
        print(f"streak_days: {data['streak_days']}")

    def test_complete_step_unauthenticated_returns_401(self, pet_id):
        """POST complete-step without auth returns 401"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            json={"pet_id": pet_id, "step_id": "care-first-vet", "pillar": "care"}
        )
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
        print(f"Unauthenticated returns {resp.status_code} - correct")
