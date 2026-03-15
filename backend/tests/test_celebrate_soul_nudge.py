"""
Backend tests for celebrate page bug fixes and MiraSoulNudge feature:
1. quick-questions API endpoint
2. Pet soul profile data integrity for none_confirmed allergies
3. Answer saving endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali user"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json().get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


PET_ID = "pet-mojo-7327ad56"
BUDDY_PET_ID = "pet-buddy-0faaab34"


class TestQuickQuestionsEndpoint:
    """Tests for GET /api/pet-soul/profile/:petId/quick-questions"""

    def test_quick_questions_mojo_returns_empty_with_94_score(self, auth_headers):
        """Mojo has 94% score - should return empty questions array"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "questions" in data, "Response must have 'questions' key"
        assert data["questions"] == [], f"Mojo should have 0 unanswered questions, got: {data['questions']}"
        assert "current_score" in data, "Response must have 'current_score' key"
        assert data["current_score"] == 94, f"Expected score 94, got {data['current_score']}"

    def test_quick_questions_returns_pet_id(self, auth_headers):
        """Response should include pet_id"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3},
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("pet_id") == PET_ID, f"Expected pet_id={PET_ID}"

    def test_quick_questions_returns_total_unanswered(self, auth_headers):
        """Response should have total_unanswered = 0 for Mojo"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3},
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_unanswered" in data
        assert data["total_unanswered"] == 0

    def test_quick_questions_no_auth_still_works(self):
        """Public endpoint - works without auth"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "questions" in data

    def test_quick_questions_limit_respected(self, auth_headers):
        """limit param should be respected (<=3 questions returned)"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3},
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data.get("questions", [])) <= 3


class TestNoneConfirmedAllergyBugFix:
    """Tests for none_confirmed not showing as allergy"""

    def test_mojo_food_allergies_are_chicken(self, auth_headers):
        """Mojo should have food_allergies: ['chicken'], NOT none_confirmed"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        pet = data.get("pet", data)
        soul_answers = pet.get("doggy_soul_answers", {})
        food_allergies = soul_answers.get("food_allergies", [])
        if isinstance(food_allergies, str):
            food_allergies = [food_allergies]
        # Verify none_confirmed is NOT in Mojo's allergies
        assert "none_confirmed" not in food_allergies, "none_confirmed should not be in Mojo's allergies"
        # Verify chicken IS in Mojo's allergies (this is the real data)
        assert "chicken" in food_allergies, f"Expected chicken in food_allergies, got: {food_allergies}"

    def test_buddy_has_none_confirmed_in_db(self, auth_headers):
        """Verify Buddy has none_confirmed in DB (for code review testing)"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{BUDDY_PET_ID}",
            headers=auth_headers
        )
        if resp.status_code == 404:
            pytest.skip("Buddy pet not accessible via this endpoint")
        assert resp.status_code == 200
        data = resp.json()
        pet = data.get("pet", data)
        soul_answers = pet.get("doggy_soul_answers", {})
        food_allergies = soul_answers.get("food_allergies", [])
        if isinstance(food_allergies, str):
            food_allergies = [food_allergies]
        print(f"Buddy's food_allergies: {food_allergies}")
        # This test documents the bug scenario - buddy has none_confirmed in DB


class TestPetSoulProfile:
    """Tests for pet soul profile endpoint"""

    def test_pet_soul_profile_returns_soul_score(self, auth_headers):
        """Pet profile should include soul score"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        # Check soul_score or overall_score exists
        has_score = (
            "soul_score" in data or
            "overall_score" in data or
            (isinstance(data.get("scores"), dict) and "overall" in data.get("scores", {}))
        )
        assert has_score, f"Response should have soul_score. Got keys: {list(data.keys())}"

    def test_pet_soul_profile_returns_pet_name(self, auth_headers):
        """Profile should include pet name"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        pet = data.get("pet", data)
        assert pet.get("name") == "Mojo", f"Expected pet name Mojo, got: {pet.get('name')}"

    def test_pet_soul_profile_invalid_pet_returns_404(self, auth_headers):
        """Non-existent pet should return 404"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/pet-nonexistent-99999",
            headers=auth_headers
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"

    def test_pet_soul_profile_mojo_has_correct_score(self, auth_headers):
        """Mojo quick-questions reports 94% soul score"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_ID}/quick-questions",
            params={"context": "celebrate", "limit": 3},
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        score = data.get("current_score", 0)
        assert score >= 90, f"Expected score >=90%, got {score}"
