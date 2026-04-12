"""
Rainbow Bridge Memorial Wall - Backend Tests (Iteration 263)
Tests:
- POST /api/rainbow-bridge/submit - community memorial submission (pending)
- GET /api/admin/rainbow-bridge/pending - admin view pending
- PATCH /api/admin/rainbow-bridge/{id}/approve - admin approve
- GET /api/rainbow-bridge/wall - public wall (active memorials)
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials for Basic Auth
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"
ADMIN_AUTH = (ADMIN_USER, ADMIN_PASS)

# Member credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASS = "test123"


@pytest.fixture(scope="module")
def member_token():
    """Get auth token for member user"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MEMBER_EMAIL,
        "password": MEMBER_PASS
    })
    if resp.status_code == 200:
        data = resp.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Member login failed: {resp.status_code} - {resp.text}")


@pytest.fixture(scope="module")
def auth_header(member_token):
    return {"Authorization": f"Bearer {member_token}", "Content-Type": "application/json"}


class TestRainbowBridgeWall:
    """GET /api/rainbow-bridge/wall — public active memorials"""

    def test_wall_returns_200(self):
        resp = requests.get(f"{BASE_URL}/api/rainbow-bridge/wall")
        assert resp.status_code == 200, f"Wall returned {resp.status_code}: {resp.text}"

    def test_wall_has_memorials_key(self):
        resp = requests.get(f"{BASE_URL}/api/rainbow-bridge/wall")
        data = resp.json()
        assert "memorials" in data, f"Missing 'memorials' key: {data}"

    def test_wall_contains_mystique(self):
        """Mystique should appear on the wall as active memorial"""
        resp = requests.get(f"{BASE_URL}/api/rainbow-bridge/wall")
        data = resp.json()
        memorials = data.get("memorials", [])
        names = [m.get("pet_name", "") for m in memorials]
        assert any("mystique" in n.lower() or "Mystique" in n for n in names), \
            f"Mystique not found in wall memorials: {names}"

    def test_wall_only_shows_active(self):
        """All memorials on the wall should have memorial_status = active"""
        resp = requests.get(f"{BASE_URL}/api/rainbow-bridge/wall")
        data = resp.json()
        for m in data.get("memorials", []):
            status = m.get("memorial_status", "active")
            assert status == "active", f"Non-active memorial on wall: {m.get('pet_name')} status={status}"


class TestSubmitMemorial:
    """POST /api/rainbow-bridge/submit — logged-in user submits memorial"""

    submitted_memorial_id = None

    def test_submit_requires_auth(self):
        """Unauthenticated submit should fail with 401"""
        resp = requests.post(f"{BASE_URL}/api/rainbow-bridge/submit", json={
            "pet_name": "Test Dog",
            "tribute_message": "Test tribute"
        })
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_submit_requires_pet_name(self, auth_header):
        """Empty pet_name should return 400"""
        resp = requests.post(f"{BASE_URL}/api/rainbow-bridge/submit",
            headers=auth_header,
            json={"pet_name": "", "tribute_message": "Some tribute"})
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"

    def test_submit_success(self, auth_header):
        """Valid submission returns success with memorial_id"""
        resp = requests.post(f"{BASE_URL}/api/rainbow-bridge/submit",
            headers=auth_header,
            json={
                "pet_name": "TEST_BuddyPendingTest",
                "breed": "Labrador",
                "tribute_message": "A loyal companion forever in our hearts",
                "crossing_date": "2024-01-01"
            })
        assert resp.status_code == 200, f"Submit failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert data.get("success") is True, f"Expected success=True: {data}"
        assert "memorial_id" in data, f"No memorial_id in response: {data}"
        # Store for later tests
        TestSubmitMemorial.submitted_memorial_id = data["memorial_id"]
        print(f"Submitted memorial_id: {TestSubmitMemorial.submitted_memorial_id}")

    def test_submit_stores_as_pending(self, auth_header):
        """After submit, memorial should appear in admin pending list"""
        memorial_id = TestSubmitMemorial.submitted_memorial_id
        if not memorial_id:
            pytest.skip("No memorial_id from previous test")
        
        resp = requests.get(
            f"{BASE_URL}/api/admin/rainbow-bridge/pending",
            auth=ADMIN_AUTH
        )
        assert resp.status_code == 200, f"Pending list failed: {resp.status_code}"
        data = resp.json()
        pending_ids = [m.get("id") for m in data.get("memorials", [])]
        assert memorial_id in pending_ids, f"memorial_id {memorial_id} not in pending: {pending_ids[:5]}"


class TestAdminPendingMemorials:
    """GET /api/admin/rainbow-bridge/pending — admin view"""

    def test_pending_requires_admin_auth(self):
        """Without auth should return 401"""
        resp = requests.get(f"{BASE_URL}/api/admin/rainbow-bridge/pending")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_pending_with_admin_auth(self):
        """Admin can list pending memorials"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/rainbow-bridge/pending",
            auth=ADMIN_AUTH
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code} - {resp.text}"

    def test_pending_response_structure(self):
        """Response has correct structure"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/rainbow-bridge/pending",
            auth=ADMIN_AUTH
        )
        data = resp.json()
        assert "memorials" in data, f"Missing 'memorials': {data}"
        assert "count" in data, f"Missing 'count': {data}"
        assert isinstance(data["memorials"], list), "memorials should be list"

    def test_pending_memorials_are_pending(self):
        """All returned memorials should have memorial_status=pending"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/rainbow-bridge/pending",
            auth=ADMIN_AUTH
        )
        data = resp.json()
        for m in data.get("memorials", []):
            assert m.get("memorial_status") == "pending", \
                f"Non-pending in pending list: {m.get('pet_name')} = {m.get('memorial_status')}"


class TestAdminApproveMemorial:
    """PATCH /api/admin/rainbow-bridge/{id}/approve"""

    def test_approve_requires_admin(self):
        """Without admin auth should fail"""
        resp = requests.patch(f"{BASE_URL}/api/admin/rainbow-bridge/fake-id-123/approve")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"

    def test_approve_nonexistent_returns_404(self):
        """Approving non-existent memorial returns 404"""
        resp = requests.patch(
            f"{BASE_URL}/api/admin/rainbow-bridge/nonexistent-memorial-xyz/approve",
            auth=ADMIN_AUTH
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}: {resp.text}"

    def test_approve_submitted_memorial(self):
        """Approve the memorial we submitted earlier and verify it becomes active"""
        memorial_id = TestSubmitMemorial.submitted_memorial_id
        if not memorial_id:
            pytest.skip("No memorial_id from submit test")
        
        # Approve it
        resp = requests.patch(
            f"{BASE_URL}/api/admin/rainbow-bridge/{memorial_id}/approve",
            auth=ADMIN_AUTH
        )
        assert resp.status_code == 200, f"Approve failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert data.get("success") is True, f"Expected success=True: {data}"
        print(f"Approved memorial: {data}")

    def test_approved_memorial_appears_on_wall(self):
        """After approval, memorial should appear on the public wall"""
        memorial_id = TestSubmitMemorial.submitted_memorial_id
        if not memorial_id:
            pytest.skip("No memorial_id from submit test")
        
        resp = requests.get(f"{BASE_URL}/api/rainbow-bridge/wall")
        assert resp.status_code == 200
        data = resp.json()
        wall_ids = [m.get("id") for m in data.get("memorials", [])]
        # Check by name since id might differ
        wall_names = [m.get("pet_name", "") for m in data.get("memorials", [])]
        assert any("TEST_BuddyPendingTest" in name for name in wall_names), \
            f"Approved memorial not on wall. Wall names: {wall_names[:10]}"

    def test_approved_not_in_pending_list(self):
        """After approval, memorial should NOT be in pending list"""
        memorial_id = TestSubmitMemorial.submitted_memorial_id
        if not memorial_id:
            pytest.skip("No memorial_id from submit test")
        
        resp = requests.get(
            f"{BASE_URL}/api/admin/rainbow-bridge/pending",
            auth=ADMIN_AUTH
        )
        data = resp.json()
        pending_ids = [m.get("id") for m in data.get("memorials", [])]
        assert memorial_id not in pending_ids, \
            f"Approved memorial still in pending list: {memorial_id}"


class TestCleanup:
    """Clean up test data"""

    def test_cleanup_test_memorial(self):
        """Mark test memorial as rejected to clean up"""
        memorial_id = TestSubmitMemorial.submitted_memorial_id
        if not memorial_id:
            pytest.skip("Nothing to clean up")
        
        # Reject the test memorial to clean up
        resp = requests.patch(
            f"{BASE_URL}/api/admin/rainbow-bridge/{memorial_id}/reject",
            auth=ADMIN_AUTH
        )
        # 200 means cleaned up, 404 means already gone
        assert resp.status_code in [200, 404], f"Cleanup failed: {resp.status_code}"
        print(f"Cleanup: memorial {memorial_id} rejected/removed")
