"""
Test suite for Pet Life OS iteration 214 - Pawrent Journey feature
Tests: pawrent journey API endpoints (complete-step + progress)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali@clubconcierge.in / test123"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def pet_id():
    """Return the test pet ID for Mojo"""
    return "pet-mojo-7327ad56"


class TestPawrentJourneyProgress:
    """GET /api/pawrent-journey/progress/{pet_id}"""

    def test_progress_returns_200(self, auth_token, pet_id):
        """Endpoint returns 200 with completed_steps array"""
        resp = requests.get(
            f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_progress_response_has_completed_steps(self, auth_token, pet_id):
        """Response contains completed_steps array (empty or with values)"""
        resp = requests.get(
            f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "completed_steps" in data, f"completed_steps missing from response: {data}"
        assert isinstance(data["completed_steps"], list), "completed_steps must be a list"

    def test_progress_requires_auth(self, pet_id):
        """Endpoint returns 401/403 without auth token"""
        resp = requests.get(f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"


class TestPawrentJourneyCompleteStep:
    """POST /api/pawrent-journey/complete-step"""

    def test_complete_step_returns_200(self, auth_token, pet_id):
        """Endpoint returns 200 with ok:true"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"pet_id": pet_id, "step_id": "test_step_001"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_complete_step_response_ok_true(self, auth_token, pet_id):
        """Response contains ok:true"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"pet_id": pet_id, "step_id": "test_step_002"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok:true, got: {data}"

    def test_complete_step_persists_in_progress(self, auth_token, pet_id):
        """Step completion is persisted and returned by GET progress"""
        step_id = "test_persist_step_xyz"
        # Complete a step
        post_resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"pet_id": pet_id, "step_id": step_id}
        )
        assert post_resp.status_code == 200

        # Verify it appears in progress
        get_resp = requests.get(
            f"{BASE_URL}/api/pawrent-journey/progress/{pet_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert step_id in data["completed_steps"], f"Step {step_id} not in completed_steps: {data}"

    def test_complete_step_requires_auth(self, pet_id):
        """Endpoint returns 401/403 without auth token"""
        resp = requests.post(
            f"{BASE_URL}/api/pawrent-journey/complete-step",
            json={"pet_id": pet_id, "step_id": "unauth_step"}
        )
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
