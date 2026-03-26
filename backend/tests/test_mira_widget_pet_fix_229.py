"""
Test file for Iteration 229: Mira Widget Correct Pet Loading Fix
Tests:
- Backend /api/mira/os/stream returns correct pet context for Bruno vs Mojo
- Pet list for dipali has 8 pets with correct ordering
- Pet IDs match expected values
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def auth_token():
    """Login as dipali@clubconcierge.in and return access token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def api_client(auth_token):
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestDipaliPetList:
    """Verify dipali has 8 pets with Mojo as pets[0] and Bruno as pets[2]"""

    def test_pet_count_is_8(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/pets")
        assert resp.status_code == 200
        data = resp.json()
        pets = data.get("pets", [])
        assert len(pets) == 8, f"Expected 8 pets, got {len(pets)}: {[p['name'] for p in pets]}"

    def test_mojo_is_pets_0(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/pets")
        assert resp.status_code == 200
        pets = resp.json().get("pets", [])
        assert len(pets) > 0
        assert pets[0]["name"] == "Mojo", f"pets[0] should be Mojo, got {pets[0]['name']}"
        assert pets[0]["id"] == "pet-mojo-7327ad56", f"Wrong Mojo pet_id: {pets[0]['id']}"
        assert pets[0]["breed"] == "Indie", f"Mojo breed should be Indie, got {pets[0]['breed']}"

    def test_bruno_is_pets_2(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/pets")
        assert resp.status_code == 200
        pets = resp.json().get("pets", [])
        assert len(pets) > 2
        assert pets[2]["name"] == "Bruno", f"pets[2] should be Bruno, got {pets[2]['name']}"
        assert pets[2]["id"] == "pet-bruno-7327ad58", f"Wrong Bruno pet_id: {pets[2]['id']}"
        assert pets[2]["breed"] == "Labrador", f"Bruno breed should be Labrador, got {pets[2]['breed']}"

    def test_all_expected_pets_present(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/pets")
        assert resp.status_code == 200
        pets = resp.json().get("pets", [])
        names = [p["name"] for p in pets]
        # At minimum, Mojo, Mystique, Bruno, Buddy, Lola should be present
        for expected in ["Mojo", "Mystique", "Bruno", "Buddy", "Lola"]:
            assert expected in names, f"Expected pet '{expected}' not found in {names}"


class TestMiraStreamBrunoPet:
    """Test /api/mira/os/stream responds with Bruno's context when given Bruno's pet_id"""

    def test_stream_bruno_returns_bruno_name(self, auth_token):
        """POST /api/mira/os/stream with Bruno's pet_id should mention Bruno in response"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "message": "What is my dog's name and breed?",
                "pet_id": "pet-bruno-7327ad58"
            },
            stream=True,
            timeout=30
        )
        assert resp.status_code == 200, f"Stream failed: {resp.status_code}"

        # Collect streamed text
        full_text = ""
        for line in resp.iter_lines():
            if line:
                line_str = line.decode("utf-8") if isinstance(line, bytes) else line
                if line_str.startswith("data: ") and line_str != "data: [DONE]":
                    try:
                        data = json.loads(line_str[6:])
                        full_text += data.get("text", "")
                    except json.JSONDecodeError:
                        pass

        assert "Bruno" in full_text, f"Response should mention 'Bruno', got: {full_text[:200]}"
        # Should NOT mention Mojo (wrong pet)
        assert "Mojo" not in full_text, f"Response should NOT mention 'Mojo' for Bruno context, got: {full_text[:200]}"

    def test_stream_bruno_mentions_labrador(self, auth_token):
        """Stream response for Bruno should mention Labrador breed"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "message": "Tell me about my pet's breed",
                "pet_id": "pet-bruno-7327ad58"
            },
            stream=True,
            timeout=30
        )
        assert resp.status_code == 200

        full_text = ""
        for line in resp.iter_lines():
            if line:
                line_str = line.decode("utf-8") if isinstance(line, bytes) else line
                if line_str.startswith("data: ") and line_str != "data: [DONE]":
                    try:
                        data = json.loads(line_str[6:])
                        full_text += data.get("text", "")
                    except json.JSONDecodeError:
                        pass

        # Should mention either Bruno or Labrador
        assert "Bruno" in full_text or "Labrador" in full_text, \
            f"Response should mention Bruno or Labrador, got: {full_text[:200]}"


class TestMiraStreamMojoPet:
    """Test /api/mira/os/stream responds with Mojo's context when given Mojo's pet_id"""

    def test_stream_mojo_returns_mojo_name(self, auth_token):
        """POST /api/mira/os/stream with Mojo's pet_id should mention Mojo in response"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "message": "What is my dog's name and breed?",
                "pet_id": "pet-mojo-7327ad56"
            },
            stream=True,
            timeout=30
        )
        assert resp.status_code == 200, f"Stream failed: {resp.status_code}"

        full_text = ""
        for line in resp.iter_lines():
            if line:
                line_str = line.decode("utf-8") if isinstance(line, bytes) else line
                if line_str.startswith("data: ") and line_str != "data: [DONE]":
                    try:
                        data = json.loads(line_str[6:])
                        full_text += data.get("text", "")
                    except json.JSONDecodeError:
                        pass

        assert "Mojo" in full_text, f"Response should mention 'Mojo', got: {full_text[:200]}"
        # Should NOT mention Bruno (wrong pet)
        assert "Bruno" not in full_text, f"Response should NOT mention 'Bruno' for Mojo context, got: {full_text[:200]}"

    def test_stream_mojo_mentions_indie(self, auth_token):
        """Stream response for Mojo should mention Indie breed"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "message": "Tell me about my pet's breed",
                "pet_id": "pet-mojo-7327ad56"
            },
            stream=True,
            timeout=30
        )
        assert resp.status_code == 200

        full_text = ""
        for line in resp.iter_lines():
            if line:
                line_str = line.decode("utf-8") if isinstance(line, bytes) else line
                if line_str.startswith("data: ") and line_str != "data: [DONE]":
                    try:
                        data = json.loads(line_str[6:])
                        full_text += data.get("text", "")
                    except json.JSONDecodeError:
                        pass

        assert "Mojo" in full_text or "Indie" in full_text, \
            f"Response should mention Mojo or Indie, got: {full_text[:200]}"


class TestMiraStreamEdgeCases:
    """Test stream endpoint edge cases"""

    def test_stream_no_message_returns_400(self, auth_token):
        """Stream with no message should return 400"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={"pet_id": "pet-bruno-7327ad58"},
            timeout=10
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"

    def test_stream_without_pet_id_works(self, auth_token):
        """Stream without pet_id should still work (generic response)"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/os/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={"message": "Hello Mira!"},
            stream=True,
            timeout=30
        )
        assert resp.status_code == 200
        full_text = ""
        for line in resp.iter_lines():
            if line:
                line_str = line.decode("utf-8") if isinstance(line, bytes) else line
                if line_str.startswith("data: ") and line_str != "data: [DONE]":
                    try:
                        data = json.loads(line_str[6:])
                        full_text += data.get("text", "")
                    except json.JSONDecodeError:
                        pass
        assert len(full_text) > 0, "Stream should return some text"
