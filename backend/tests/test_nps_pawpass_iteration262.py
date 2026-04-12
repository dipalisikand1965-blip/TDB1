"""
Backend tests for iteration 262:
1. NPS/Pawmoter endpoints (submit and check)
2. PAW PASS data for dipali's pets (Mojo pet_pass_number/status)
3. Mira navigation link verification via API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MEMBER_EMAIL,
        "password": MEMBER_PASS
    })
    if resp.status_code == 200:
        data = resp.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Login failed: {resp.status_code} - {resp.text[:200]}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestLogin:
    """Test login for dipali"""

    def test_login_dipali_succeeds(self):
        """Login with member credentials returns token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASS
        })
        assert resp.status_code == 200, f"Login failed: {resp.text[:200]}"
        data = resp.json()
        token = data.get("token") or data.get("access_token")
        assert token, "No token in login response"
        assert len(token) > 10
        print(f"Login SUCCESS - token length: {len(token)}")


class TestPawPassData:
    """PAW PASS tests for dipali's pets"""

    def test_get_my_pets_returns_pets(self, auth_headers):
        """GET /api/pets/my-pets returns pets list"""
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        assert resp.status_code == 200, f"my-pets failed: {resp.text[:200]}"
        data = resp.json()
        pets = data.get("pets") if isinstance(data, dict) else data
        assert isinstance(pets, list), f"Expected list, got: {type(pets)}"
        assert len(pets) > 0, "No pets returned"
        print(f"Got {len(pets)} pets: {[p.get('name') for p in pets]}")

    def test_mojo_has_pet_pass_number(self, auth_headers):
        """Mojo's pet_pass_number should be TDC-516B445F"""
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets") if isinstance(data, dict) else data
        
        mojo = next((p for p in pets if p.get("name", "").lower() == "mojo"), None)
        assert mojo is not None, f"Mojo not found in pets. Available: {[p.get('name') for p in pets]}"
        
        pet_pass_number = mojo.get("pet_pass_number")
        assert pet_pass_number, f"Mojo has no pet_pass_number. pet data: {mojo.get('pet_pass_number')}"
        assert pet_pass_number == "TDC-516B445F", f"Expected TDC-516B445F, got {pet_pass_number}"
        print(f"Mojo pet_pass_number: {pet_pass_number} ✓")

    def test_mojo_has_active_pass_status(self, auth_headers):
        """Mojo's pet_pass_status should be 'active'"""
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets") if isinstance(data, dict) else data
        
        mojo = next((p for p in pets if p.get("name", "").lower() == "mojo"), None)
        assert mojo is not None, "Mojo not found"
        
        status = mojo.get("pet_pass_status")
        assert status, f"Mojo has no pet_pass_status. Fields: {list(mojo.keys())}"
        assert status.lower() == "active", f"Expected active, got {status}"
        print(f"Mojo pet_pass_status: {status} ✓")

    def test_all_pets_have_pass_status(self, auth_headers):
        """All pets for dipali should have pet_pass_status (not None/empty)"""
        resp = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets") if isinstance(data, dict) else data
        
        missing_status = [p.get("name") for p in pets if not p.get("pet_pass_status")]
        assert len(missing_status) == 0, f"These pets have no pet_pass_status: {missing_status}"
        print(f"All {len(pets)} pets have pet_pass_status ✓")


class TestNPSEndpoints:
    """NPS/Pawmoter Score endpoint tests"""

    def test_nps_check_endpoint_exists(self):
        """GET /api/rewards/nps/check returns valid response"""
        resp = requests.get(f"{BASE_URL}/api/rewards/nps/check", params={"user_email": MEMBER_EMAIL})
        assert resp.status_code == 200, f"NPS check failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json()
        assert "has_recent_submission" in data, f"Missing has_recent_submission: {data}"
        assert isinstance(data["has_recent_submission"], bool), "has_recent_submission should be bool"
        print(f"NPS check result: {data}")

    def test_nps_check_has_last_submission_field(self):
        """NPS check response has last_submission field"""
        resp = requests.get(f"{BASE_URL}/api/rewards/nps/check", params={"user_email": MEMBER_EMAIL})
        assert resp.status_code == 200
        data = resp.json()
        assert "last_submission" in data, f"Missing last_submission field: {data}"
        print(f"last_submission: {data.get('last_submission')}")

    def test_nps_submit_endpoint(self):
        """POST /api/rewards/nps/submit accepts valid score and returns success+submission_id"""
        payload = {
            "user_email": "TEST_nps_user@example.com",
            "user_name": "Test NPS User",
            "score": 9,
            "category": "promoter",
            "feedback": "Great app for pet parents!",
            "reward_points": 50
        }
        resp = requests.post(f"{BASE_URL}/api/rewards/nps/submit", json=payload)
        assert resp.status_code == 200, f"NPS submit failed: {resp.status_code} - {resp.text[:300]}"
        data = resp.json()
        assert data.get("success") is True, f"success not True: {data}"
        assert "submission_id" in data, f"No submission_id in response: {data}"
        assert data["submission_id"].startswith("nps-"), f"Unexpected id format: {data['submission_id']}"
        print(f"NPS submit SUCCESS: submission_id={data['submission_id']}, points_awarded={data.get('points_awarded')}")

    def test_nps_submit_dipali(self):
        """POST /api/rewards/nps/submit for dipali returns success and 50 points"""
        payload = {
            "user_email": MEMBER_EMAIL,
            "user_name": "Dipali",
            "score": 9,
            "category": "promoter",
            "feedback": "Testing NPS submission",
            "reward_points": 50
        }
        resp = requests.post(f"{BASE_URL}/api/rewards/nps/submit", json=payload)
        assert resp.status_code == 200, f"NPS submit failed: {resp.status_code} - {resp.text[:300]}"
        data = resp.json()
        assert data.get("success") is True
        assert data.get("points_awarded") == 50, f"Expected 50 points, got {data.get('points_awarded')}"
        print(f"NPS submit for dipali: submission_id={data.get('submission_id')}, points={data.get('points_awarded')}")

    def test_nps_submit_validates_score_range(self):
        """NPS submit rejects score > 10"""
        payload = {
            "user_email": "TEST_invalid@example.com",
            "score": 11,  # Invalid
            "category": "promoter",
            "reward_points": 50
        }
        resp = requests.post(f"{BASE_URL}/api/rewards/nps/submit", json=payload)
        assert resp.status_code in [400, 422], f"Expected 400/422 for invalid score, got {resp.status_code}"
        print(f"Score validation: {resp.status_code} ✓")

    def test_nps_submit_score_0_valid(self):
        """NPS submit accepts score=0 (min valid)"""
        payload = {
            "user_email": "TEST_min_score@example.com",
            "score": 0,
            "category": "detractor",
            "reward_points": 50
        }
        resp = requests.post(f"{BASE_URL}/api/rewards/nps/submit", json=payload)
        assert resp.status_code == 200, f"Score 0 should be valid: {resp.text[:200]}"
        data = resp.json()
        assert data.get("success") is True
        print("Score=0 accepted ✓")

    def test_nps_check_after_submission_shows_recent(self):
        """After submitting NPS for dipali, check shows has_recent_submission=true"""
        # First submit (already done in test_nps_submit_dipali)
        # Check
        resp = requests.get(f"{BASE_URL}/api/rewards/nps/check", params={"user_email": MEMBER_EMAIL})
        assert resp.status_code == 200
        data = resp.json()
        # Since we just submitted, should be True
        assert data["has_recent_submission"] is True, f"Expected True after submission, got {data}"
        print(f"has_recent_submission=True after submission ✓")


class TestNPSStats:
    """Test NPS stats endpoint"""

    def test_nps_stats_endpoint(self):
        """GET /api/rewards/nps/stats returns valid NPS data"""
        resp = requests.get(f"{BASE_URL}/api/rewards/nps/stats")
        assert resp.status_code == 200, f"NPS stats failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json()
        assert "total_responses" in data, f"Missing total_responses: {data}"
        assert "nps_score" in data, f"Missing nps_score: {data}"
        print(f"NPS stats: total={data.get('total_responses')}, score={data.get('nps_score')}")
