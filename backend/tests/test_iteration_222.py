"""
Iteration 222 Backend Tests
- Account Status endpoint for trial and active users
- Notification Preferences GET/PUT endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

TRIAL_USER_EMAIL = "trial_test_1774515870@test.com"
TRIAL_USER_PASSWORD = "test1234"
ACTIVE_USER_EMAIL = "dipali@clubconcierge.in"
ACTIVE_USER_PASSWORD = "test123"


def get_token(email, password):
    """Helper to login and get token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


# ─── Account Status Tests ──────────────────────────────────────────────────

class TestAccountStatus:
    """Tests for GET /api/auth/account-status"""

    def test_account_status_requires_auth(self):
        """Should return 401/403 without token"""
        resp = requests.get(f"{BASE_URL}/api/auth/account-status")
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"
        print("PASS: account-status requires auth")

    def test_trial_user_account_status(self):
        """trial_test user should return tier=trial"""
        token = get_token(TRIAL_USER_EMAIL, TRIAL_USER_PASSWORD)
        if not token:
            pytest.skip(f"Could not login as {TRIAL_USER_EMAIL}")

        resp = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        data = resp.json()
        print(f"Trial user account-status: {data}")
        assert "tier" in data, "Response should have 'tier'"
        assert data["tier"] == "trial", f"Expected tier=trial, got {data['tier']}"
        assert "days_remaining" in data, "Response should have 'days_remaining'"
        assert "can_book" in data, "Response should have 'can_book'"
        assert "is_paused" in data, "Response should have 'is_paused'"
        assert data["can_book"] is True, f"Trial user should be able to book"
        assert data["is_paused"] is False, f"Trial user should not be paused"
        print(f"PASS: trial user account-status tier={data['tier']}, days_remaining={data['days_remaining']}")

    def test_active_user_account_status(self):
        """Dipali (active user) should return tier=active"""
        token = get_token(ACTIVE_USER_EMAIL, ACTIVE_USER_PASSWORD)
        if not token:
            pytest.skip(f"Could not login as {ACTIVE_USER_EMAIL}")

        resp = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        data = resp.json()
        print(f"Active user account-status: {data}")
        assert "tier" in data, "Response should have 'tier'"
        assert data["tier"] == "active", f"Expected tier=active for dipali, got {data['tier']}"
        assert data.get("can_book") is True, "Active user should be able to book"
        assert data.get("is_paused") is False, "Active user should not be paused"
        print(f"PASS: active user (dipali) account-status tier={data['tier']}")

    def test_account_status_response_structure(self):
        """Check account-status returns all required fields"""
        token = get_token(ACTIVE_USER_EMAIL, ACTIVE_USER_PASSWORD)
        if not token:
            pytest.skip("Could not login as dipali")

        resp = requests.get(
            f"{BASE_URL}/api/auth/account-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        data = resp.json()
        required_fields = ["tier", "can_book", "can_purchase", "is_paused", "status_label"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"PASS: account-status returns all required fields: {list(data.keys())}")


# ─── Notification Preferences Tests ───────────────────────────────────────

class TestNotificationPreferences:
    """Tests for GET/PUT /api/member/notification-preferences"""

    def test_get_notification_prefs_requires_auth(self):
        """Should return 401 without token"""
        resp = requests.get(f"{BASE_URL}/api/member/notification-preferences")
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"
        print("PASS: notification-preferences GET requires auth")

    def test_put_notification_prefs_requires_auth(self):
        """PUT should return 401 without token"""
        resp = requests.put(
            f"{BASE_URL}/api/member/notification-preferences",
            json={"preferences": {}}
        )
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"
        print("PASS: notification-preferences PUT requires auth")

    def test_get_notification_prefs_returns_200(self):
        """Authenticated GET should return 200 with preferences object"""
        token = get_token(ACTIVE_USER_EMAIL, ACTIVE_USER_PASSWORD)
        if not token:
            pytest.skip("Could not login as dipali")

        resp = requests.get(
            f"{BASE_URL}/api/member/notification-preferences",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        data = resp.json()
        print(f"Notification preferences response: {data}")
        assert "preferences" in data, "Response should have 'preferences' key"
        assert isinstance(data["preferences"], dict), "preferences should be a dict"
        print(f"PASS: GET notification-preferences returns 200 with preferences={data['preferences']}")

    def test_put_and_get_notification_prefs_persistence(self):
        """PUT preferences, then GET to verify they persisted"""
        token = get_token(ACTIVE_USER_EMAIL, ACTIVE_USER_PASSWORD)
        if not token:
            pytest.skip("Could not login as dipali")

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Create test preferences with a unique test pet ID
        test_prefs = {
            "test_pet_222": {
                "daily_digest": True,
                "birthday_reminders": False,
                "medication_reminders": True,
                "order_updates": True,
                "concierge_updates": False
            }
        }

        # PUT the preferences
        put_resp = requests.put(
            f"{BASE_URL}/api/member/notification-preferences",
            headers=headers,
            json={"preferences": test_prefs}
        )
        assert put_resp.status_code == 200, f"PUT failed: {put_resp.status_code}: {put_resp.text}"

        put_data = put_resp.json()
        assert put_data.get("success") is True, "PUT should return success=True"
        assert "preferences" in put_data, "PUT response should include preferences"
        print(f"PASS: PUT notification-preferences returned success={put_data['success']}")

        # GET to verify persistence
        get_resp = requests.get(
            f"{BASE_URL}/api/member/notification-preferences",
            headers=headers
        )
        assert get_resp.status_code == 200, f"GET failed: {get_resp.status_code}"

        get_data = get_resp.json()
        saved_prefs = get_data.get("preferences", {})

        # Verify the test pet preferences are saved
        assert "test_pet_222" in saved_prefs, "Saved pet prefs should be present after PUT"
        pet_prefs = saved_prefs["test_pet_222"]
        assert pet_prefs.get("daily_digest") is True, "daily_digest should be True"
        assert pet_prefs.get("birthday_reminders") is False, "birthday_reminders should be False"
        assert pet_prefs.get("medication_reminders") is True, "medication_reminders should be True"
        assert pet_prefs.get("concierge_updates") is False, "concierge_updates should be False"
        print(f"PASS: notification preferences persisted correctly after PUT+GET")

    def test_trial_user_can_access_notification_prefs(self):
        """Trial user should also be able to access notification preferences"""
        token = get_token(TRIAL_USER_EMAIL, TRIAL_USER_PASSWORD)
        if not token:
            pytest.skip(f"Could not login as {TRIAL_USER_EMAIL}")

        resp = requests.get(
            f"{BASE_URL}/api/member/notification-preferences",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        data = resp.json()
        assert "preferences" in data, "Response should have 'preferences' key"
        print(f"PASS: trial user can access notification preferences")

    def test_put_all_notification_types(self):
        """PUT all 5 notification types and verify"""
        token = get_token(ACTIVE_USER_EMAIL, ACTIVE_USER_PASSWORD)
        if not token:
            pytest.skip("Could not login as dipali")

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Test all 5 notification types
        all_types_prefs = {
            "test_pet_all_types_222": {
                "daily_digest": False,
                "birthday_reminders": False,
                "medication_reminders": False,
                "order_updates": False,
                "concierge_updates": False
            }
        }

        put_resp = requests.put(
            f"{BASE_URL}/api/member/notification-preferences",
            headers=headers,
            json={"preferences": all_types_prefs}
        )
        assert put_resp.status_code == 200

        get_resp = requests.get(
            f"{BASE_URL}/api/member/notification-preferences",
            headers=headers
        )
        saved = get_resp.json().get("preferences", {})
        pet_p = saved.get("test_pet_all_types_222", {})

        for notif_type in ["daily_digest", "birthday_reminders", "medication_reminders", "order_updates", "concierge_updates"]:
            assert notif_type in pet_p, f"Missing notification type: {notif_type}"
            assert pet_p[notif_type] is False, f"{notif_type} should be False"

        print(f"PASS: All 5 notification types saved correctly")
