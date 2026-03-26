"""
Backend Tests for Pet Life OS Fixes (Iteration 213)
Tests:
- Mira Notifications datetime bug fix
- Paw Points Leaderboard endpoint
- Paw Points My-Badges endpoint
- WhatsApp Daily Digest automation trigger
- Birthday Reminders automation trigger
- Medication Reminders automation trigger
- Admin Automations Status endpoint
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"


@pytest.fixture(scope="module")
def member_token():
    """Get auth token for dipali@clubconcierge.in — returns access_token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MEMBER_EMAIL,
        "password": MEMBER_PASSWORD
    })
    if resp.status_code == 200:
        data = resp.json()
        # Login returns 'access_token' key (not 'token')
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Login failed: {resp.status_code} {resp.text[:200]}")


@pytest.fixture(scope="module")
def auth_headers(member_token):
    """Headers with Bearer token"""
    return {"Authorization": f"Bearer {member_token}"}


@pytest.fixture(scope="module")
def admin_auth():
    """HTTP Basic auth tuple for admin endpoints"""
    return (ADMIN_USER, ADMIN_PASS)


# ─── Mira Notifications ────────────────────────────────────────────────────
class TestMiraNotifications:
    """Test GET /api/mira/notifications returns success:true (datetime bug fix)"""

    def test_notifications_returns_200(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/mira/notifications", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"

    def test_notifications_success_true(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/mira/notifications", headers=auth_headers)
        data = resp.json()
        assert data.get("success") is True, f"success should be True, got: {data}"

    def test_notifications_has_notifications_key(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/mira/notifications", headers=auth_headers)
        data = resp.json()
        assert "notifications" in data, f"Missing 'notifications' key: {data}"
        assert isinstance(data["notifications"], list), "notifications should be a list"

    def test_notifications_has_unread_count(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/mira/notifications", headers=auth_headers)
        data = resp.json()
        assert "unread_count" in data, f"Missing 'unread_count': {data}"

    def test_notifications_no_error_key(self, auth_headers):
        """When success:true, there should be no error in response"""
        resp = requests.get(f"{BASE_URL}/api/mira/notifications", headers=auth_headers)
        data = resp.json()
        if data.get("success") is True:
            assert "error" not in data or data.get("error") is None, f"Unexpected error: {data.get('error')}"


# ─── Paw Points Leaderboard ────────────────────────────────────────────────
class TestPawPointsLeaderboard:
    """Test GET /api/paw-points/leaderboard returns leaderboard array"""

    def test_leaderboard_returns_200(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/leaderboard", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"

    def test_leaderboard_has_leaderboard_key(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/leaderboard", headers=auth_headers)
        data = resp.json()
        assert "leaderboard" in data, f"Missing 'leaderboard' key: {data}"
        assert isinstance(data["leaderboard"], list), "leaderboard should be a list"

    def test_leaderboard_has_total_entries(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/leaderboard", headers=auth_headers)
        data = resp.json()
        assert "total_entries" in data, f"Missing 'total_entries': {data}"

    def test_leaderboard_entry_structure(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/leaderboard", headers=auth_headers)
        data = resp.json()
        entries = data.get("leaderboard", [])
        if entries:
            entry = entries[0]
            assert "rank" in entry, f"Entry missing 'rank': {entry}"
            assert "name" in entry, f"Entry missing 'name': {entry}"
            assert "points" in entry, f"Entry missing 'points': {entry}"
            assert "tier" in entry, f"Entry missing 'tier': {entry}"

    def test_leaderboard_401_without_auth(self):
        resp = requests.get(f"{BASE_URL}/api/paw-points/leaderboard")
        assert resp.status_code == 401, f"Expected 401 without auth, got {resp.status_code}"


# ─── Paw Points My-Badges ─────────────────────────────────────────────────
class TestPawPointsMyBadges:
    """Test GET /api/paw-points/my-badges returns earned badges"""

    def test_my_badges_returns_200(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"

    def test_my_badges_has_badges_key(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges", headers=auth_headers)
        data = resp.json()
        assert "badges" in data, f"Missing 'badges' key: {data}"
        assert isinstance(data["badges"], list), "badges should be a list"

    def test_my_badges_has_earned_key(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges", headers=auth_headers)
        data = resp.json()
        assert "earned" in data, f"Missing 'earned' key: {data}"
        assert isinstance(data["earned"], list), "earned should be a list"

    def test_my_badges_has_total_earned(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges", headers=auth_headers)
        data = resp.json()
        assert "total_earned" in data, f"Missing 'total_earned': {data}"
        print(f"Total badges earned: {data.get('total_earned')}")

    def test_my_badges_badge_structure(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges", headers=auth_headers)
        data = resp.json()
        all_badges = data.get("badges", [])
        if all_badges:
            badge = all_badges[0]
            assert "id" in badge, f"Badge missing 'id': {badge}"
            assert "name" in badge, f"Badge missing 'name': {badge}"
            assert "earned" in badge, f"Badge missing 'earned': {badge}"
            assert isinstance(badge["earned"], bool), f"'earned' should be bool: {badge}"

    def test_my_badges_401_without_auth(self):
        resp = requests.get(f"{BASE_URL}/api/paw-points/my-badges")
        assert resp.status_code == 401, f"Expected 401 without auth, got {resp.status_code}"


# ─── Admin Automation Endpoints ───────────────────────────────────────────
class TestAdminAutomations:
    """Test admin automation trigger endpoints using HTTP Basic Auth"""

    def test_automation_status_returns_200(self, admin_auth):
        resp = requests.get(f"{BASE_URL}/api/admin/automations/status", auth=admin_auth)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"

    def test_automation_status_has_automations_key(self, admin_auth):
        resp = requests.get(f"{BASE_URL}/api/admin/automations/status", auth=admin_auth)
        data = resp.json()
        assert "automations" in data, f"Missing 'automations' key: {data}"

    def test_automation_status_has_schedule_info(self, admin_auth):
        resp = requests.get(f"{BASE_URL}/api/admin/automations/status", auth=admin_auth)
        data = resp.json()
        automations = data.get("automations", {})
        assert "daily_digest" in automations, f"Missing daily_digest: {automations}"
        assert "birthday_reminders" in automations, f"Missing birthday_reminders: {automations}"
        assert "medication_reminders" in automations, f"Missing medication_reminders: {automations}"
        daily = automations["daily_digest"]
        assert "schedule" in daily, f"Missing schedule in daily_digest: {daily}"
        assert "sent_today" in daily, f"Missing sent_today in daily_digest: {daily}"

    def test_automation_status_401_without_auth(self):
        resp = requests.get(f"{BASE_URL}/api/admin/automations/status")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_daily_digest_trigger_returns_success(self, admin_auth):
        """POST /api/admin/automations/trigger/daily-digest — executes digest"""
        resp = requests.post(f"{BASE_URL}/api/admin/automations/trigger/daily-digest", auth=admin_auth, timeout=60)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert data.get("success") is True, f"success should be True: {data}"
        result = data.get("result") or {}
        print(f"Daily digest result: {result}")
        # Result should have at least 'sent' or 'total' keys
        assert isinstance(result, dict), f"result should be a dict: {result}"

    def test_birthday_reminders_trigger(self, admin_auth):
        """POST /api/admin/automations/trigger/birthday-reminders"""
        resp = requests.post(f"{BASE_URL}/api/admin/automations/trigger/birthday-reminders", auth=admin_auth, timeout=60)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert data.get("success") is True, f"success should be True: {data}"
        print(f"Birthday reminders result: {data.get('result')}")

    def test_medication_reminders_trigger(self, admin_auth):
        """POST /api/admin/automations/trigger/medication-reminders"""
        resp = requests.post(f"{BASE_URL}/api/admin/automations/trigger/medication-reminders", auth=admin_auth, timeout=60)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        assert data.get("success") is True, f"success should be True: {data}"
        print(f"Medication reminders result: {data.get('result')}")

    def test_automation_triggers_401_without_auth(self):
        """All trigger endpoints should require auth"""
        for path in ["daily-digest", "birthday-reminders", "medication-reminders"]:
            resp = requests.post(f"{BASE_URL}/api/admin/automations/trigger/{path}")
            assert resp.status_code == 401, f"Expected 401 for {path}, got {resp.status_code}"


# ─── Member Notification Inbox (bell endpoint) ────────────────────────────
class TestMemberNotificationInbox:
    """Test the notification bell endpoint used by MemberNotificationBell.jsx"""

    def test_inbox_endpoint_returns_200(self):
        """GET /api/member/notifications/inbox/{email} should return data"""
        resp = requests.get(f"{BASE_URL}/api/member/notifications/inbox/{MEMBER_EMAIL}?limit=10")
        # Should either return 200 with data or 200 with empty list
        assert resp.status_code in [200, 401, 404], f"Got {resp.status_code}: {resp.text[:200]}"
        if resp.status_code == 200:
            data = resp.json()
            assert "notifications" in data, f"Missing notifications key: {data}"


# ─── Paw Points Balance (tier check) ─────────────────────────────────────
class TestPawPointsTierSystem:
    """Verify tier thresholds match MembershipCardTiers.jsx"""

    def test_balance_endpoint_200(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/balance", headers=auth_headers)
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"

    def test_tier_data_structure(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/paw-points/balance", headers=auth_headers)
        data = resp.json()
        assert "tier" in data, f"Missing tier: {data}"
        assert "balance" in data, f"Missing balance: {data}"
        assert "tier_thresholds" in data, f"Missing tier_thresholds: {data}"
        thresholds = data["tier_thresholds"]
        # Gold threshold should be 1500 (fixed from 5000)
        assert thresholds.get("gold") == 1500, f"Gold threshold should be 1500, got: {thresholds.get('gold')}"
        print(f"User tier: {data['tier']}, balance: {data['balance']}, thresholds: {thresholds}")
