"""Tests for Admin → Places (TDC Verified Registry) endpoints."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pet-soul-ranking.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/admin/places"

TEST_NAME = "TEST_Doggy Paradise Vet Clinic"
TEST_CITY = "Bangalore"
TEST_PILLAR = "care"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # cleanup: delete test entry
    try:
        s.delete(f"{API}/verify/{TEST_NAME.lower()}", timeout=15)
    except Exception:
        pass


# ── GET /verified ───────────────────────────────────────────────────────────
def test_list_verified_places(session):
    r = session.get(f"{API}/verified", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "total" in data and "places" in data
    assert isinstance(data["places"], list)
    assert isinstance(data["total"], int)
    # seeded at least 2 entries per handover note
    print(f"Seeded verified total={data['total']}")


# ── POST /verify (create) ───────────────────────────────────────────────────
def test_verify_upsert_create(session):
    payload = {
        "name": TEST_NAME,
        "city": TEST_CITY,
        "pillar": TEST_PILLAR,
        "tdc_verified": True,
    }
    r = session.post(f"{API}/verify", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
    assert data.get("action") in ("created", "updated", "no-op")

    # verify via GET
    g = session.get(f"{API}/verified", params={"search": "doggy paradise"}, timeout=15)
    assert g.status_code == 200
    items = g.json().get("places", [])
    assert any(p.get("name") == TEST_NAME for p in items), f"Test name not found after upsert. Got: {[p.get('name') for p in items]}"


# ── POST /verify (toggle off) ───────────────────────────────────────────────
def test_verify_toggle_off(session):
    payload = {
        "name": TEST_NAME,
        "city": TEST_CITY,
        "pillar": TEST_PILLAR,
        "tdc_verified": False,
    }
    r = session.post(f"{API}/verify", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True

    # should not appear in verified list now
    g = session.get(f"{API}/verified", params={"search": "doggy paradise"}, timeout=15)
    assert g.status_code == 200
    items = g.json().get("places", [])
    assert not any(p.get("name") == TEST_NAME for p in items)


# ── POST /verify missing name ───────────────────────────────────────────────
def test_verify_missing_name(session):
    r = session.post(f"{API}/verify", json={"name": "", "tdc_verified": True}, timeout=15)
    assert r.status_code in (400, 422)


# ── GET /top-unverified ─────────────────────────────────────────────────────
def test_top_unverified(session):
    r = session.get(f"{API}/top-unverified", params={"days": 30, "top_n": 5}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "pillars" in data
    assert "total_unverified" in data
    assert data.get("window_days") == 30
    assert isinstance(data["pillars"], dict)


# ── POST /send-outreach-digest ──────────────────────────────────────────────
def test_send_outreach_digest(session):
    r = session.post(f"{API}/send-outreach-digest", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    # force=True inside handler, so always tries to send
    assert "success" in data
    # Can be success:true w/ recipients, or success:false w/ error (missing key)
    if data.get("success"):
        assert "recipients" in data or "skipped" in data
    print(f"Digest response: {data}")


# ── DELETE /verify/{id} ─────────────────────────────────────────────────────
def test_delete_verify(session):
    # create first
    session.post(f"{API}/verify", json={"name": TEST_NAME, "city": TEST_CITY, "pillar": TEST_PILLAR, "tdc_verified": True}, timeout=15)
    r = session.delete(f"{API}/verify/{TEST_NAME.lower()}", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
