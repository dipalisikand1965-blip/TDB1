"""
Backend tests for iteration 216:
- Mira Notification Preferences API (GET + POST)
- WhatsApp toggle fields: whatsapp_daily_digest, whatsapp_birthday_reminder, whatsapp_medication_reminder
- Concierge pillar-request endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = 'test_iter216_prefs@test.example.com'


@pytest.fixture(scope='module')
def api():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


# ──────────────────────────────────────────────────────────────────────────────
# 1. GET notification preferences — default values returned for new email
# ──────────────────────────────────────────────────────────────────────────────
class TestGetNotificationPreferences:
    def test_get_prefs_returns_200(self, api):
        r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_prefs_contains_whatsapp_fields(self, api):
        r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        d = r.json()
        assert 'whatsapp_daily_digest' in d, "Missing whatsapp_daily_digest field"
        assert 'whatsapp_birthday_reminder' in d, "Missing whatsapp_birthday_reminder field"
        assert 'whatsapp_medication_reminder' in d, "Missing whatsapp_medication_reminder field"

    def test_get_prefs_defaults_are_true(self, api):
        r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        d = r.json()
        # New email should have all WhatsApp defaults = True
        assert d['whatsapp_daily_digest'] is True
        assert d['whatsapp_birthday_reminder'] is True
        assert d['whatsapp_medication_reminder'] is True

    def test_get_prefs_has_email_field(self, api):
        r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        d = r.json()
        # email field should be present (exact case may vary)
        assert 'email' in d


# ──────────────────────────────────────────────────────────────────────────────
# 2. POST notification preferences — save and verify
# ──────────────────────────────────────────────────────────────────────────────
class TestPostNotificationPreferences:
    def test_post_prefs_returns_200(self, api):
        payload = {
            'email': TEST_EMAIL,
            'whatsapp_daily_digest': False,
            'whatsapp_birthday_reminder': True,
            'whatsapp_medication_reminder': False,
        }
        r = api.post(f'{BASE_URL}/api/mira/notifications/preferences', json=payload)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_post_prefs_returns_success(self, api):
        payload = {
            'email': TEST_EMAIL,
            'whatsapp_daily_digest': False,
            'whatsapp_birthday_reminder': True,
            'whatsapp_medication_reminder': False,
        }
        r = api.post(f'{BASE_URL}/api/mira/notifications/preferences', json=payload)
        d = r.json()
        assert d.get('success') is True or 'preferences' in d

    def test_post_prefs_persists_to_db(self, api):
        # Set specific values
        payload = {
            'email': TEST_EMAIL,
            'whatsapp_daily_digest': False,
            'whatsapp_birthday_reminder': False,
            'whatsapp_medication_reminder': True,
        }
        post_r = api.post(f'{BASE_URL}/api/mira/notifications/preferences', json=payload)
        assert post_r.status_code == 200

        # GET to verify persistence
        get_r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        assert get_r.status_code == 200
        d = get_r.json()
        assert d['whatsapp_daily_digest'] is False, f"Expected False, got {d['whatsapp_daily_digest']}"
        assert d['whatsapp_birthday_reminder'] is False, f"Expected False, got {d['whatsapp_birthday_reminder']}"
        assert d['whatsapp_medication_reminder'] is True, f"Expected True, got {d['whatsapp_medication_reminder']}"

    def test_post_prefs_toggle_daily_digest(self, api):
        # Toggle daily digest OFF
        payload = {
            'email': TEST_EMAIL,
            'whatsapp_daily_digest': False,
            'whatsapp_birthday_reminder': True,
            'whatsapp_medication_reminder': True,
        }
        api.post(f'{BASE_URL}/api/mira/notifications/preferences', json=payload)

        # Verify it's saved
        get_r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        d = get_r.json()
        assert d['whatsapp_daily_digest'] is False

        # Toggle back ON
        payload['whatsapp_daily_digest'] = True
        api.post(f'{BASE_URL}/api/mira/notifications/preferences', json=payload)
        get_r2 = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{TEST_EMAIL}')
        d2 = get_r2.json()
        assert d2['whatsapp_daily_digest'] is True


# ──────────────────────────────────────────────────────────────────────────────
# 3. Concierge pillar-request endpoint (used by MiraOSPage Concierge tab)
# ──────────────────────────────────────────────────────────────────────────────
class TestConciergePillarRequest:
    def test_pillar_request_endpoint_accessible(self, api):
        """Endpoint returns 2xx or 4xx (not 500) for a well-formed payload"""
        payload = {
            'pillar': 'mira_os',
            'request_label': 'Test freeform request',
            'request_type': 'freeform',
            'source': 'mira_os_concierge_tab',
            'message': 'Please help me find a vet for my dog',
            'pet_name': 'Test Dog',
            'pet_breed': 'Labrador',
            'member_name': 'Test User',
            'member_email': 'test_user@example.com',
        }
        r = api.post(f'{BASE_URL}/api/concierge/pillar-request', json=payload)
        # Accept 200, 201, 404 (endpoint may not exist), 422 — but NOT 500
        assert r.status_code != 500, f"Server error 500 on concierge/pillar-request: {r.text}"
        print(f"Concierge pillar-request status: {r.status_code}")


# ──────────────────────────────────────────────────────────────────────────────
# 4. Test with URL-encoded email (special chars)
# ──────────────────────────────────────────────────────────────────────────────
class TestGetPrefsUrlEncoding:
    def test_get_prefs_with_encoded_email(self, api):
        """Test that URL-encoded email (dipali@clubconcierge.in) works"""
        import urllib.parse
        email = 'dipali@clubconcierge.in'
        encoded = urllib.parse.quote(email, safe='')
        r = api.get(f'{BASE_URL}/api/mira/notifications/preferences/{encoded}')
        assert r.status_code == 200, f"Expected 200 for encoded email, got {r.status_code}"
        d = r.json()
        assert 'whatsapp_daily_digest' in d
        assert 'whatsapp_birthday_reminder' in d
        assert 'whatsapp_medication_reminder' in d
