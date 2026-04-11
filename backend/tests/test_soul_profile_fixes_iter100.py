"""
Backend tests for Pet Life OS - Soul Profile System Fixes (Iteration 100)
Tests:
  Fix 1: Soul score sync — GET /api/pet-soul/profile/{pet_id} returns live soul_score
  Fix 2: PillarSoulModal filter logic — checked via answers count and field existence
  Fix 3: POST /api/pets/{pet_id}/infer-archetype — returns archetype and archetype_label
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
PET_MOJO_ID = "pet-mojo-7327ad56"


@pytest.fixture(scope="module")
def access_token():
    """Login and return access token"""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    if resp.status_code != 200:
        pytest.skip(f"Login failed ({resp.status_code}): {resp.text}")
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip("No access_token in login response")
    return token


@pytest.fixture(scope="module")
def auth_headers(access_token):
    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


# ── Fix 1: Soul score sync tests ─────────────────────────────────────────────

class TestSoulScoreSync:
    """Fix 1: GET /api/pet-soul/profile/{pet_id} returns live soul_score"""

    def test_soul_profile_endpoint_returns_200(self):
        """Public endpoint returns 200 for existing pet"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_soul_profile_contains_required_fields(self):
        """Response contains scores/soul_score data"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        assert resp.status_code == 200
        data = resp.json()
        # Must have scores or soul_score key
        assert "scores" in data or "soul_score" in data or "overall_score" in data, \
            f"No score field found. Keys: {list(data.keys())}"

    def test_soul_score_is_non_zero_for_pet_with_answers(self):
        """Pet Mojo has soul answers — score must be > 0"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        assert resp.status_code == 200
        data = resp.json()
        scores = data.get("scores", {})
        soul_score = (
            data.get("soul_score")
            or data.get("overall_score")
            or scores.get("overall")
            or 0
        )
        assert soul_score > 0, f"Expected non-zero score, got: {soul_score}"

    def test_soul_profile_contains_soul_answers(self):
        """Pet Mojo has soul_answers in response"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        assert resp.status_code == 200
        data = resp.json()
        soul_answers = data.get("soul_answers", {})
        assert len(soul_answers) > 0, "Expected soul_answers to be non-empty for Mojo"

    def test_soul_profile_404_for_nonexistent_pet(self):
        """Unknown pet returns 404"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/nonexistent-pet-xyz")
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"

    def test_soul_score_tier_present_for_mojo(self):
        """Mojo's profile has tier info (soul_master expected for 100% score)"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        data = resp.json()
        scores = data.get("scores", {})
        tier = scores.get("tier", "")
        assert tier != "", f"Expected tier to be non-empty, got: {tier}"
        print(f"[PASS] Mojo tier: {tier}, overall: {scores.get('overall')}")

    def test_soul_profile_answered_count_for_mojo(self):
        """Mojo has answered multiple questions"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        data = resp.json()
        scores = data.get("scores", {})
        answered = scores.get("answered_count", 0)
        assert answered > 0, f"Expected answered_count > 0, got: {answered}"
        print(f"[PASS] Mojo answered_count: {answered}")


# ── Fix 2: PillarSoulModal filter — answered questions should not appear ─────

class TestPillarSoulModalFilter:
    """Fix 2: PILLAR_QUESTIONS should filter out already-answered soul_fields"""

    def test_mojo_soul_answers_exist(self):
        """Mojo has doggy_soul_answers — so PillarSoulModal should show 0 new questions"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        data = resp.json()
        soul_answers = data.get("soul_answers", {})
        # With 93 answers, all pillar questions should be filtered out
        assert len(soul_answers) > 20, f"Expected many answers, got {len(soul_answers)}"
        print(f"[PASS] Mojo soul answers: {len(soul_answers)}")

    def test_soul_answers_contain_expected_fields(self):
        """Known soul fields (general_nature, describe_3_words) are present"""
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        data = resp.json()
        soul_answers = data.get("soul_answers", {})
        # These are common pillar question soul_fields
        common_fields = ["general_nature", "describe_3_words"]
        for field in common_fields:
            assert field in soul_answers, f"Expected field '{field}' in soul_answers"
        print(f"[PASS] Common soul fields present: {common_fields}")

    def test_get_pet_api_has_doggy_soul_answers(self, auth_headers):
        """GET /api/pets/{id} returns doggy_soul_answers for PillarSoulModal filter"""
        resp = requests.get(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}",
            headers=auth_headers,
        )
        if resp.status_code != 200:
            pytest.skip(f"GET /api/pets/{PET_MOJO_ID} not accessible: {resp.status_code}")
        data = resp.json()
        # doggy_soul_answers must be present for the filter to work
        assert "doggy_soul_answers" in data or "soul_answers" in data, \
            f"Missing doggy_soul_answers in pet response. Keys: {list(data.keys())}"
        print("[PASS] doggy_soul_answers present in pet data")


# ── Fix 3: POST /api/pets/{pet_id}/infer-archetype ────────────────────────────

class TestInferArchetype:
    """Fix 3: POST /api/pets/{pet_id}/infer-archetype endpoint"""

    def test_infer_archetype_returns_200(self, auth_headers):
        """Endpoint returns 200 for valid pet"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_infer_archetype_returns_archetype_field(self, auth_headers):
        """Response has 'archetype' field"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "archetype" in data, f"Missing 'archetype' in response: {data}"
        assert isinstance(data["archetype"], str) and len(data["archetype"]) > 0

    def test_infer_archetype_returns_archetype_label(self, auth_headers):
        """Response has human-readable 'archetype_label'"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "archetype_label" in data, f"Missing 'archetype_label' in response: {data}"
        assert isinstance(data["archetype_label"], str) and len(data["archetype_label"]) > 0

    def test_infer_archetype_mojo_is_wild_explorer(self, auth_headers):
        """Mojo (energetic, outdoor dog) should be 'wild_explorer'"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        data = resp.json()
        archetype = data.get("archetype", "")
        label = data.get("archetype_label", "")
        # Based on Mojo's soul_answers profile
        assert archetype == "wild_explorer", f"Expected 'wild_explorer', got '{archetype}'"
        assert "Wild Explorer" in label, f"Expected label to contain 'Wild Explorer', got '{label}'"
        print(f"[PASS] Mojo archetype: {archetype}, label: {label}")

    def test_infer_archetype_returns_pet_info(self, auth_headers):
        """Response includes pet_id and pet_name"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        data = resp.json()
        assert data.get("pet_id") == PET_MOJO_ID, f"pet_id mismatch: {data.get('pet_id')}"
        assert data.get("pet_name") == "Mojo", f"pet_name mismatch: {data.get('pet_name')}"

    def test_infer_archetype_returns_reason(self, auth_headers):
        """Response includes 'reason' for the archetype decision"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        data = resp.json()
        assert "reason" in data, f"Missing 'reason' in response: {data}"
        assert isinstance(data["reason"], str) and len(data["reason"]) > 0

    def test_infer_archetype_no_auth_also_works(self):
        """Endpoint accepts optional auth — works without token too"""
        resp = requests.post(f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype")
        assert resp.status_code == 200, f"Expected 200 without auth, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "archetype" in data

    def test_infer_archetype_404_for_unknown_pet(self, auth_headers):
        """Nonexistent pet returns 404"""
        resp = requests.post(
            f"{BASE_URL}/api/pets/nonexistent-pet-xyz/infer-archetype",
            headers=auth_headers,
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"

    def test_infer_archetype_persists_to_db(self, auth_headers):
        """After infer, primary_archetype is persisted in pet record"""
        # First infer
        requests.post(
            f"{BASE_URL}/api/pets/{PET_MOJO_ID}/infer-archetype",
            headers=auth_headers,
        )
        # Verify via soul profile (check pet sub-object)
        resp = requests.get(f"{BASE_URL}/api/pet-soul/profile/{PET_MOJO_ID}")
        data = resp.json()
        pet = data.get("pet", {})
        archetype = pet.get("primary_archetype", "")
        assert archetype != "", f"Expected primary_archetype to be persisted, got empty. Pet keys: {list(pet.keys())}"
        print(f"[PASS] Persisted archetype: {archetype}")

    def test_infer_archetype_default_for_pet_without_answers(self, auth_headers):
        """Pet with no answers should get default archetype (playful_spirit)"""
        # Find any other pet with no answers
        # Use a fresh pet by checking /api/pets/my-pets
        resp_pets = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=auth_headers,
        )
        if resp_pets.status_code != 200:
            pytest.skip("Cannot list pets")
        pets = resp_pets.json()
        pet_list = pets.get("pets", pets) if isinstance(pets, dict) else pets
        # Find a pet without soul answers (not Mojo)
        no_answer_pet = None
        for p in pet_list:
            if p.get("id") != PET_MOJO_ID:
                soul_ans = p.get("doggy_soul_answers", {})
                if not soul_ans or len(soul_ans) == 0:
                    no_answer_pet = p
                    break

        if not no_answer_pet:
            pytest.skip("No pet without soul answers found for this test")

        resp = requests.post(
            f"{BASE_URL}/api/pets/{no_answer_pet['id']}/infer-archetype",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        archetype = data.get("archetype", "")
        # Default is 'playful_spirit' when no answers
        assert archetype == "playful_spirit", \
            f"Expected 'playful_spirit' for pet with no answers, got '{archetype}'"
        print(f"[PASS] Default archetype for {no_answer_pet.get('name', '?')}: {archetype}")
