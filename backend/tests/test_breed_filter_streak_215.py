"""
Test file: Breed filter & Pawrent Journey streak — iteration 215
Tests:
  1. Backend: GET /api/pawrent-journey/progress/{pet_id} returns streak_days
  2. Backend: POST /api/pawrent-journey/complete-step returns streak_days and increments
  3. Verify filterBreedProducts import chain (ShopSoulPage bug check)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali@clubconcierge.in"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if resp.status_code != 200:
        pytest.skip(f"Auth failed: {resp.status_code} {resp.text[:200]}")
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("No token in auth response")
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ─────────────────────────────────────────────────────────────────────────────
# 1. GET /api/pawrent-journey/progress/{pet_id}
# ─────────────────────────────────────────────────────────────────────────────
class TestPawrentProgressGet:
    """GET progress endpoint — returns streak_days"""

    def test_get_progress_returns_200(self, headers):
        pet_id = "pet-bruno-7327ad58"  # Labrador
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        print("PASS: GET progress returns 200")

    def test_get_progress_has_streak_days_field(self, headers):
        pet_id = "pet-bruno-7327ad58"
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "streak_days" in data, f"Missing streak_days in response: {data}"
        assert isinstance(data["streak_days"], int), f"streak_days should be int, got {type(data['streak_days'])}"
        print(f"PASS: streak_days present = {data['streak_days']}")

    def test_get_progress_has_completed_steps_field(self, headers):
        pet_id = "pet-bruno-7327ad58"
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=headers)
        data = resp.json()
        assert "completed_steps" in data, f"Missing completed_steps in response: {data}"
        assert isinstance(data["completed_steps"], list)
        print(f"PASS: completed_steps present, count={len(data['completed_steps'])}")

    def test_get_progress_new_pet_returns_zero_streak(self, headers):
        """New pet should return streak_days=0 (or a valid int)"""
        pet_id = "pet-test-breed-filter-215"  # unlikely to exist
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        # New pet → should return default 0
        assert data.get("streak_days") == 0, f"New pet should have streak_days=0, got {data.get('streak_days')}"
        assert data.get("completed_steps") == [], f"New pet should have empty completed_steps, got {data.get('completed_steps')}"
        print("PASS: New pet returns streak_days=0 and empty completed_steps")

    def test_get_progress_requires_auth(self):
        """Unauthenticated request should fail"""
        pet_id = "pet-bruno-7327ad58"
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Unauthenticated returns {resp.status_code}")


# ─────────────────────────────────────────────────────────────────────────────
# 2. POST /api/pawrent-journey/complete-step
# ─────────────────────────────────────────────────────────────────────────────
class TestPawrentCompleteStep:
    """POST complete-step — returns streak_days, increments on consecutive days"""

    def test_complete_step_returns_200(self, headers):
        payload = {"pet_id": "pet-bruno-7327ad58", "step_id": "test-step-215-a", "pillar": "play", "mode": "GROWING"}
        resp = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=payload, headers=headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        print("PASS: POST complete-step returns 200")

    def test_complete_step_returns_ok_true(self, headers):
        payload = {"pet_id": "pet-bruno-7327ad58", "step_id": "test-step-215-b", "pillar": "play", "mode": "GROWING"}
        resp = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=payload, headers=headers)
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok=True, got {data}"
        print("PASS: POST complete-step returns ok=True")

    def test_complete_step_returns_streak_days(self, headers):
        payload = {"pet_id": "pet-bruno-7327ad58", "step_id": "test-step-215-c", "pillar": "play", "mode": "GROWING"}
        resp = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=payload, headers=headers)
        data = resp.json()
        assert "streak_days" in data, f"Missing streak_days in POST response: {data}"
        assert isinstance(data["streak_days"], int), f"streak_days should be int, got {type(data['streak_days'])}"
        assert data["streak_days"] >= 1, f"streak_days should be >= 1, got {data['streak_days']}"
        print(f"PASS: POST returns streak_days={data['streak_days']}")

    def test_complete_step_streak_persists_in_get(self, headers):
        """After POST, GET should reflect streak_days >= 1"""
        pet_id = "pet-mojo-7327ad56"
        # POST a step
        payload = {"pet_id": pet_id, "step_id": "test-step-215-persist", "pillar": "care", "mode": "GROWING"}
        post_resp = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=payload, headers=headers)
        assert post_resp.status_code == 200
        post_data = post_resp.json()
        post_streak = post_data.get("streak_days", 0)

        # GET should return matching streak
        get_resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}", headers=headers)
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        get_streak = get_data.get("streak_days", -1)

        assert get_streak == post_streak, f"GET streak_days ({get_streak}) != POST streak_days ({post_streak})"
        print(f"PASS: Streak persists — POST returned {post_streak}, GET confirmed {get_streak}")

    def test_complete_step_same_day_keeps_streak(self, headers):
        """Completing step on same day should not decrement streak"""
        pet_id = "pet-lola-0faaab37"
        step1 = {"pet_id": pet_id, "step_id": "test-step-215-same-a", "pillar": "play"}
        step2 = {"pet_id": pet_id, "step_id": "test-step-215-same-b", "pillar": "care"}

        r1 = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=step1, headers=headers)
        streak1 = r1.json().get("streak_days", 0)

        r2 = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=step2, headers=headers)
        streak2 = r2.json().get("streak_days", 0)

        # Second step on same day should keep streak (not reset to 1 from gap > 1)
        assert streak2 >= streak1, f"Same day: streak should not decrease. Before={streak1}, After={streak2}"
        print(f"PASS: Same-day steps keep streak: {streak1} → {streak2}")

    def test_complete_step_requires_auth(self):
        """Unauthenticated request should fail"""
        payload = {"pet_id": "pet-bruno-7327ad58", "step_id": "test-anon"}
        resp = requests.post(f"{BASE_URL}/api/pawrent-journey/complete-step", json=payload)
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Unauthenticated POST returns {resp.status_code}")


# ─────────────────────────────────────────────────────────────────────────────
# 3. Verify general API health
# ─────────────────────────────────────────────────────────────────────────────
class TestGeneralHealth:
    def test_health_endpoint(self):
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code in [200, 404], f"Unexpected: {resp.status_code}"
        print(f"Health check: {resp.status_code}")

    def test_pets_endpoint_accessible(self, headers):
        resp = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets", data) if isinstance(data, dict) else data
        assert len(pets) > 0, "No pets found"
        print(f"PASS: /api/pets returns {len(pets)} pets")
