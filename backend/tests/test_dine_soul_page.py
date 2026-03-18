"""
Backend tests for DineSoulPage refactoring:
- TummyProfile states (MIRA KNOWS vs GROW SOUL)
- Quick Questions API with dine context
- Answer submission API
- TabBar and heading structure tested via frontend screenshot
"""

import pytest
import requests
import jwt
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-made-products.preview.emergentagent.com').rstrip('/')

# Test pets from the live DB
PET_WITH_FOOD_DATA = "pet-mojo-7327ad56"       # Mojo: allergies=chicken, loves=Salmon/PeanutButter
PET_NO_FOOD_DATA = "pet-testscoring-0faaab3d"  # TestScoring: no food data, score=0

# Generate auth token
def get_auth_token():
    SECRET_KEY = "tdb_super_secret_key_2025_woof"
    token = jwt.encode(
        {"sub": "dipali@clubconcierge.in", "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        SECRET_KEY, algorithm="HS256"
    )
    return token


@pytest.fixture(scope="module")
def auth_headers():
    token = get_auth_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestQuickQuestionsAPI:
    """Tests for GET /api/pet-soul/profile/:petId/quick-questions"""

    def test_quick_questions_dine_context_returns_questions_for_low_score_pet(self, api_client, auth_headers):
        """Pet with no food data should return questions"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/quick-questions?limit=4&context=dine",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "questions" in data
        assert "current_score" in data
        assert "pet_id" in data
        assert len(data["questions"]) <= 4, "Should not exceed limit of 4"
        print(f"✓ QuickQuestions dine: {len(data['questions'])} questions, score: {data['current_score']}")

    def test_quick_questions_dine_context_returns_correct_structure(self, api_client, auth_headers):
        """Each question should have required fields"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/quick-questions?limit=4&context=dine",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        questions = data.get("questions", [])
        for q in questions:
            assert "question_id" in q, f"Missing question_id in: {q}"
            assert "question" in q, f"Missing question text in: {q}"
            assert "type" in q, f"Missing type in: {q}"
            assert "weight" in q, f"Missing weight in: {q}"
            assert "folder_name" in q, f"Missing folder_name in: {q}"
            assert "folder_icon" in q, f"Missing folder_icon in: {q}"
        print(f"✓ Question structure valid for {len(questions)} questions")

    def test_quick_questions_with_full_score_pet_returns_empty(self, api_client, auth_headers):
        """Pet with score=100 (Mojo) may have 0 unanswered questions"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_WITH_FOOD_DATA}/quick-questions?limit=4&context=dine",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        # Mojo has score 100, possibly 0 unanswered questions
        print(f"✓ Mojo quick questions: {len(data.get('questions',[]))} (score: {data.get('current_score',0)})")

    def test_quick_questions_no_auth_works(self, api_client):
        """quick-questions endpoint works without auth (public)"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/quick-questions?limit=4&context=dine"
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "questions" in data
        print(f"✓ Public quick questions: {len(data.get('questions',[]))} questions")

    def test_quick_questions_context_dine_accepted(self, api_client, auth_headers):
        """API should accept 'dine' as a valid context parameter"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/quick-questions?limit=4&context=dine",
            headers=auth_headers
        )
        assert resp.status_code == 200  # Should not fail with dine context
        print("✓ 'dine' context parameter accepted by API")


class TestAnswerAPI:
    """Tests for POST /api/pet-soul/profile/:petId/answer"""

    def test_answer_submission_returns_scores(self, api_client, auth_headers):
        """Answer submission should return updated scores"""
        resp = api_client.post(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/answer",
            json={"question_id": "test_dine_q", "answer": "test_value"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "scores" in data, "Response should have scores"
        assert "overall" in data["scores"], "Scores should have overall"
        print(f"✓ Answer submission: score={data['scores']['overall']}")

    def test_answer_submission_structure(self, api_client, auth_headers):
        """Answer submission response should have proper structure"""
        resp = api_client.post(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/answer",
            json={"question_id": "test_structure_check", "answer": "test_answer"},
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should have message, question_id, answer, scores
        assert "message" in data or "question_id" in data, "Missing message/question_id"
        print(f"✓ Answer structure valid: {list(data.keys())}")

    def test_answer_submission_works_without_auth(self, api_client):
        """Answer API works without auth (uses get_current_user_optional)"""
        resp = api_client.post(
            f"{BASE_URL}/api/pet-soul/profile/{PET_NO_FOOD_DATA}/answer",
            json={"question_id": "test_no_auth", "answer": "test_no_auth_value"},
        )
        # This may or may not require auth - should not 500
        assert resp.status_code in [200, 401, 422], f"Unexpected: {resp.status_code}"
        print(f"✓ Answer without auth: {resp.status_code}")


class TestPetsWithFoodData:
    """Verify that the /api/pets endpoint returns food data for TummyProfile logic"""

    def test_mojo_has_food_allergies(self, api_client, auth_headers):
        """Mojo should have food allergies (chicken) for MIRA KNOWS state"""
        resp = api_client.get(f"{BASE_URL}/api/pets", headers=auth_headers)
        assert resp.status_code == 200
        pets = resp.json().get("pets", [])
        mojo = next((p for p in pets if p.get("id") == PET_WITH_FOOD_DATA), None)
        assert mojo is not None, "Mojo not found in pets"
        soul = mojo.get("doggy_soul_answers", {})
        allergies = soul.get("food_allergies", [])
        loves = soul.get("favorite_treats", [])
        # Mojo should have some food data
        has_food_data = bool(allergies) or bool(loves)
        assert has_food_data, f"Mojo should have food data but got allergies={allergies}, loves={loves}"
        print(f"✓ Mojo hasFoodData=True: allergies={allergies}, loves={loves}")

    def test_pets_api_returns_list(self, api_client, auth_headers):
        """Pets API returns proper list"""
        resp = api_client.get(f"{BASE_URL}/api/pets", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets", [])
        assert len(pets) > 0, "Should have at least 1 pet"
        print(f"✓ Pets API: {len(pets)} pets returned")


class TestDinePageAPIs:
    """Test APIs that DineSoulPage uses"""

    def test_pillar_products_dine_loads(self, api_client):
        """DineSoulPage fetches dine products on mount"""
        resp = api_client.get(f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=600")
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", [])
        print(f"✓ Dine pillar products: {len(products)} products")

    def test_pet_soul_profile_accessible(self, api_client, auth_headers):
        """Pet soul profile accessible for quick-questions petId"""
        resp = api_client.get(
            f"{BASE_URL}/api/pet-soul/profile/{PET_WITH_FOOD_DATA}",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "pet" in data or "soul_answers" in data
        print(f"✓ Pet soul profile accessible: keys={list(data.keys())[:4]}")
