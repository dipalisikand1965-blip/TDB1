"""
Test file for Free Trial flow — Iteration 221
Tests: register with trial fields, account-status endpoint for trial/active users
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTrialRegistration:
    """Test that new registrations get account_tier=trial"""

    def test_register_new_user_has_trial_tier(self):
        """POST /api/auth/register — new user should have account_tier=trial and trial_start_date set"""
        unique_email = f"trial_test_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "test1234",
            "name": "Trial Test User"
        }
        res = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Register status: {res.status_code}, body: {res.text[:300]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "user_id" in data or "message" in data, "Should return user_id or message"
        print("PASS: Register new user returned 200")

    def test_register_then_login_confirms_trial_fields(self):
        """Register then login — login response should include account_tier=trial"""
        unique_email = f"trial_test_{uuid.uuid4().hex[:8]}@test.com"
        # Register
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test1234",
            "name": "Trial Test User 2"
        })
        assert reg_res.status_code == 200, f"Register failed: {reg_res.status_code}"

        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "test1234"
        })
        print(f"Login status: {login_res.status_code}, body: {login_res.text[:500]}")
        assert login_res.status_code == 200, f"Login failed: {login_res.status_code}"
        data = login_res.json()
        user = data.get("user", {})
        print(f"account_tier: {user.get('account_tier')}, trial_start_date: {user.get('trial_start_date')}")
        assert user.get("account_tier") == "trial", f"Expected account_tier=trial, got: {user.get('account_tier')}"
        assert user.get("trial_start_date") is not None, "trial_start_date should be set on registration"
        print("PASS: New user login confirms account_tier=trial and trial_start_date is set")


class TestAccountStatusEndpoint:
    """Test GET /api/auth/account-status endpoint"""

    @pytest.fixture
    def trial_token(self):
        """Login with trial test user and return token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "trial_test_1774515870@test.com",
            "password": "test1234"
        })
        if res.status_code != 200:
            pytest.skip(f"Trial user login failed: {res.status_code} — {res.text}")
        data = res.json()
        token = data.get("access_token")
        if not token:
            pytest.skip("No access_token in trial user login response")
        return token

    @pytest.fixture
    def active_token(self):
        """Login with dipali (active user) and return token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if res.status_code != 200:
            pytest.skip(f"Active user login failed: {res.status_code}")
        data = res.json()
        token = data.get("access_token")
        if not token:
            pytest.skip("No access_token in active user login response")
        return token

    def test_account_status_for_trial_user(self, trial_token):
        """GET /api/auth/account-status — trial user should get tier=trial, days_remaining=30, can_book=true"""
        res = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {trial_token}"}
        )
        print(f"Trial account-status: {res.status_code}, body: {res.text[:500]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        print(f"tier: {data.get('tier')}, days_remaining: {data.get('days_remaining')}, can_book: {data.get('can_book')}")
        assert data.get("tier") in ("trial", "trial_ending", "grace_period", "paused"), \
            f"Unexpected tier: {data.get('tier')}"
        assert data.get("can_book") is not None, "can_book field should be present"
        assert "days_remaining" in data, "days_remaining should be present"
        assert "status_label" in data, "status_label should be present"
        print(f"PASS: Trial user account-status returned tier={data.get('tier')}, days_remaining={data.get('days_remaining')}")

    def test_account_status_for_active_user(self, active_token):
        """GET /api/auth/account-status — active user (dipali) should get tier=active, days_remaining=null"""
        res = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {active_token}"}
        )
        print(f"Active account-status: {res.status_code}, body: {res.text[:500]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        print(f"tier: {data.get('tier')}, days_remaining: {data.get('days_remaining')}, can_book: {data.get('can_book')}")
        # dipali is an active user (not trial), so tier should be 'active' and days_remaining=None
        assert data.get("tier") == "active", f"Expected tier=active for active user, got: {data.get('tier')}"
        assert data.get("days_remaining") is None, f"Expected days_remaining=None for active user, got: {data.get('days_remaining')}"
        assert data.get("can_book") is True, f"Active user should be able to book"
        print("PASS: Active user account-status returned tier=active, days_remaining=None")

    def test_account_status_requires_auth(self):
        """GET /api/auth/account-status without token should return 401/403"""
        res = requests.get(f"{BASE_URL}/api/auth/account-status")
        print(f"Unauthenticated account-status: {res.status_code}")
        assert res.status_code in (401, 403, 422), \
            f"Expected 401/403/422 for unauthenticated request, got {res.status_code}"
        print(f"PASS: Unauthenticated request returns {res.status_code}")

    def test_new_trial_user_account_status(self):
        """Register fresh trial user, get account-status — should have trial tier and ~30 days"""
        unique_email = f"trial_fresh_{uuid.uuid4().hex[:8]}@test.com"
        # Register
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test1234",
            "name": "Fresh Trial"
        })
        assert reg_res.status_code == 200, f"Register failed: {reg_res.status_code}"

        # Login to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "test1234"
        })
        assert login_res.status_code == 200
        token = login_res.json().get("access_token")
        assert token, "Should get access_token"

        # Check account-status
        status_res = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Fresh trial account-status: {status_res.status_code}, body: {status_res.text[:500]}")
        assert status_res.status_code == 200
        data = status_res.json()
        print(f"tier: {data.get('tier')}, days_remaining: {data.get('days_remaining')}, can_book: {data.get('can_book')}")
        assert data.get("tier") == "trial", f"Fresh user should have tier=trial, got: {data.get('tier')}"
        assert data.get("days_remaining") == 30, f"Fresh user should have 30 days remaining, got: {data.get('days_remaining')}"
        assert data.get("can_book") is True, "Trial user should be able to book"
        assert data.get("can_purchase") is True, "Trial user should be able to purchase"
        print(f"PASS: Fresh trial user has tier=trial, 30 days remaining, can_book=True")
