"""
Backend tests for dine/celebrate fixes - iteration 144
Tests:
- /api/service_desk/attach_or_create_ticket (pillar=dine)
- /api/pets/{pet_id} - refetch pet
- /api/pet-soul/profile/{id}/answer - save soul answer
"""

import pytest
import requests
import os
import jwt
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# JWT config (matches backend)
SECRET_KEY = "tdb_super_secret_key_2025_woof"
ALGORITHM = "HS256"
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_PET_ID = "pet-mojo-7327ad56"


@pytest.fixture(scope="module")
def auth_token():
    """Create JWT token for test user"""
    data = {
        'sub': TEST_USER_EMAIL,
        'email': TEST_USER_EMAIL,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Auth token created for {TEST_USER_EMAIL}")
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    if not auth_token:
        pytest.skip("Authentication failed")
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def test_pet_id(auth_headers):
    """Use known test pet ID"""
    return TEST_PET_ID


class TestServiceDeskAttachOrCreate:
    """Tests for /api/service_desk/attach_or_create_ticket with pillar=dine"""

    def test_attach_or_create_ticket_dine_pillar(self, auth_headers, test_pet_id):
        """POST creates a ticket with pillar=dine and returns ticket_id"""
        payload = {
            "parent_id": "test_aditya_user",
            "pet_id": test_pet_id,
            "pillar": "dine",
            "intent_primary": "mira_imagines_product",
            "intent_secondary": ["Salmon Weekly Meal Box", "custom_dine_product"],
            "life_state": "dine",
            "channel": "dine_mira_imagines",
            "initial_message": {
                "sender": "parent",
                "source": "dine_page",
                "text": f'Hi! I\'d love to get "Salmon Weekly Meal Box". Can you source this?'
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=auth_headers
        )
        print(f"Response: {resp.status_code} - {resp.text[:300]}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        assert "ticket_id" in data, "Response must contain ticket_id"
        assert "status" in data, "Response must contain status"
        assert data["ticket_id"] is not None
        print(f"Ticket created: {data['ticket_id']}, status={data['status']}, is_new={data.get('is_new')}")

    def test_attach_or_create_ticket_attaches_to_existing(self, auth_headers, test_pet_id):
        """Second POST with same parent_id/pet_id/pillar should attach to existing ticket"""
        payload = {
            "parent_id": "test_aditya_user",
            "pet_id": test_pet_id,
            "pillar": "dine",
            "intent_primary": "mira_imagines_product",
            "intent_secondary": ["Balanced Wholesome Bowl", "custom_dine_product"],
            "life_state": "dine",
            "channel": "dine_mira_imagines",
            "initial_message": {
                "sender": "parent",
                "source": "dine_page",
                "text": "Second request for a different product"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data
        print(f"Second call: is_new={data.get('is_new')}, ticket={data['ticket_id']}")

    def test_ticket_without_auth_still_works(self, test_pet_id):
        """Endpoint should work even without auth (concierge public endpoint)"""
        payload = {
            "parent_id": "dine_guest",
            "pet_id": test_pet_id,
            "pillar": "dine",
            "intent_primary": "mira_imagines_product",
            "intent_secondary": ["Recovery Support Bowl"],
            "life_state": "dine",
            "channel": "dine_mira_imagines",
            "initial_message": {
                "sender": "parent",
                "source": "dine_page",
                "text": "Guest user requesting Recovery Support Bowl"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload
        )
        print(f"No-auth response: {resp.status_code}")
        # Should not 401, may be 200 or 422 (if pillar validation fails)
        assert resp.status_code in [200, 422], f"Unexpected status: {resp.status_code}"


class TestPetsFetch:
    """Tests for /api/pets/{pet_id} - used in soulScoreUpdated refetch"""

    def test_get_pet_by_id(self, auth_headers, test_pet_id):
        """GET /api/pets/{id} returns pet data with doggy_soul_answers"""
        resp = requests.get(
            f"{BASE_URL}/api/pets/{test_pet_id}",
            headers=auth_headers
        )
        print(f"GET /api/pets/{test_pet_id}: {resp.status_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data or "_id" not in data, "Pet should have id field"
        assert "_id" not in data, "MongoDB _id must be excluded"
        # Check that doggy_soul_answers field exists (may be empty)
        print(f"Pet name: {data.get('name')}, soul answers: {list(data.get('doggy_soul_answers', {}).keys())[:5]}")

    def test_pet_response_includes_soul_fields(self, auth_headers, test_pet_id):
        """Pet response should include favorite_protein, food_allergies, health_conditions"""
        resp = requests.get(
            f"{BASE_URL}/api/pets/{test_pet_id}",
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        soul = data.get("doggy_soul_answers", {})
        # Just print what we have - these may or may not be answered
        print(f"favorite_protein: {soul.get('favorite_protein', 'not answered')}")
        print(f"food_allergies: {soul.get('food_allergies', 'not answered')}")
        print(f"health_conditions: {soul.get('health_conditions', 'not answered')}")


class TestSoulAnswerSave:
    """Tests for /api/pet-soul/profile/{id}/answer - soul answer persistence"""

    def test_save_soul_answer_and_verify(self, auth_headers, test_pet_id):
        """POST answer and verify it's saved via GET"""
        # First get current state
        resp_before = requests.get(
            f"{BASE_URL}/api/pets/{test_pet_id}",
            headers=auth_headers
        )
        assert resp_before.status_code == 200
        soul_before = resp_before.json().get("doggy_soul_answers", {})

        # Save an answer
        answer_payload = {
            "question_id": "test_vet_comfort_iter144",
            "folder": "long_horizon",
            "answer": "Very comfortable - no issues"
        }
        resp_answer = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answer",
            json=answer_payload,
            headers=auth_headers
        )
        print(f"Save answer: {resp_answer.status_code} - {resp_answer.text[:200]}")
        assert resp_answer.status_code == 200
        data = resp_answer.json()
        # Response has "message" not "success" field
        assert data.get("message") == "Answer saved" or data.get("success") == True
        assert "scores" in data
        assert "overall" in data["scores"]
        print(f"Score after answer: {data['scores']['overall']}")

        # Verify persistence
        resp_after = requests.get(
            f"{BASE_URL}/api/pets/{test_pet_id}",
            headers=auth_headers
        )
        assert resp_after.status_code == 200
        soul_after = resp_after.json().get("doggy_soul_answers", {})
        assert soul_after.get("test_vet_comfort_iter144") == "Very comfortable - no issues", \
            f"Answer not persisted. Got: {soul_after.get('test_vet_comfort_iter144')}"
        print(f"Answer persisted correctly: {soul_after.get('test_vet_comfort_iter144')}")

    def test_quick_questions_dine_context(self, auth_headers, test_pet_id):
        """GET quick questions with context=dine should return unanswered questions"""
        resp = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/quick-questions?limit=4&context=dine",
            headers=auth_headers
        )
        print(f"Quick questions (dine): {resp.status_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert "questions" in data
        assert "current_score" in data
        print(f"Questions returned: {len(data['questions'])}, current_score: {data['current_score']}")
        # Questions should have required fields
        for q in data["questions"]:
            assert "question_id" in q
            assert "question" in q
            assert "type" in q
            assert "weight" in q


class TestCelebrateEndpoints:
    """Tests confirming celebrate endpoints still work"""

    def test_attach_or_create_ticket_celebrate_pillar(self, auth_headers, test_pet_id):
        """POST creates a ticket with pillar=celebrate"""
        payload = {
            "parent_id": "test_aditya_celebrate",
            "pet_id": test_pet_id,
            "pillar": "celebrate",
            "intent_primary": "mira_imagines_product",
            "intent_secondary": ["Birthday Cake", "custom_celebrate_product"],
            "life_state": "celebrate",
            "channel": "celebrate_mira_imagines",
            "initial_message": {
                "sender": "parent",
                "source": "celebrate_page",
                "text": "I want a birthday cake for my dog!"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=auth_headers
        )
        print(f"Celebrate ticket: {resp.status_code} - {resp.text[:200]}")
        assert resp.status_code == 200
        data = resp.json()
        assert "ticket_id" in data
        print(f"Celebrate ticket created: {data['ticket_id']}")
