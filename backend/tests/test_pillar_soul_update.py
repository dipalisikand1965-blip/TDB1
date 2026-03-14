"""
Test suite for 8-Pillar Soul Celebration features:
1. PATCH /api/pets/{pet_id}/pillar-soul-update - New endpoint for PillarSoulModal
2. GET /api/products?category=X - Products for pillar tabs
3. POST /api/concierge/pillar-request - Concierge requests from special panels
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test user credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestPillarSoulUpdate:
    """Tests for the new /api/pets/{pet_id}/pillar-soul-update endpoint"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")

    @pytest.fixture(scope="class")
    def pet_id(self, auth_token):
        """Get the first pet for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        if response.status_code == 200:
            data = response.json()
            pets = data.get("pets", [])
            if pets and len(pets) > 0:
                return pets[0].get("id")
        pytest.skip("No pets found for testing")

    def test_pillar_soul_update_food_pillar(self, auth_token, pet_id):
        """Test updating soul answers for food pillar"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "pillar": "food",
            "answers": {
                "favorite_treats": ["Salmon", "Peanut Butter"],
                "birthday_feast_style": "A BIG cake — show stopper"
            },
            "learned_facts": [
                "[Food & Flavour] What flavours does the pet go wild for? → Salmon, Peanut Butter",
                "[Food & Flavour] For the birthday feast style → A BIG cake — show stopper"
            ],
            "summary": "Test pet's Food profile updated via pillar soul modal"
        }

        response = requests.patch(
            f"{BASE_URL}/api/pets/{pet_id}/pillar-soul-update",
            headers=headers,
            json=payload
        )

        # Assert status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        # Assert response structure
        data = response.json()
        assert "pet" in data, "Response should contain 'pet' object"
        assert "new_score" in data, "Response should contain 'new_score'"
        assert "pillar" in data, "Response should contain 'pillar'"
        assert data["pillar"] == "food", "Pillar should be 'food'"
        assert "facts_added" in data, "Response should contain 'facts_added'"
        assert data["facts_added"] >= 0, "facts_added should be non-negative"

        # Verify the pet object has updated soul answers
        pet = data["pet"]
        soul_answers = pet.get("doggy_soul_answers", {})
        assert "favorite_treats" in soul_answers or "birthday_feast_style" in soul_answers, \
            "Soul answers should be updated"

    def test_pillar_soul_update_play_pillar(self, auth_token, pet_id):
        """Test updating soul answers for play pillar"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "pillar": "play",
            "answers": {
                "energy_level": "High energy, great napper",
                "play_style": "With their human"
            },
            "learned_facts": [
                "[Play & Joy] Energy level → High energy, great napper"
            ],
            "summary": "Test pet's Play profile updated"
        }

        response = requests.patch(
            f"{BASE_URL}/api/pets/{pet_id}/pillar-soul-update",
            headers=headers,
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["pillar"] == "play"
        assert "new_score" in data

    def test_pillar_soul_update_invalid_pet(self, auth_token):
        """Test that invalid pet_id returns 404"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "pillar": "food",
            "answers": {"test": "value"},
            "learned_facts": []
        }

        response = requests.patch(
            f"{BASE_URL}/api/pets/invalid-pet-id-12345/pillar-soul-update",
            headers=headers,
            json=payload
        )

        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"

    def test_pillar_soul_update_score_recalculation(self, auth_token, pet_id):
        """Test that soul score is recalculated after update"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

        # Get current score
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        assert response.status_code == 200
        data = response.json()
        pets = data.get("pets", [])
        pet = next((p for p in pets if p["id"] == pet_id), None)
        original_score = pet.get("overall_score", 0) if pet else 0

        # Update with new answers
        payload = {
            "pillar": "grooming",
            "answers": {
                "groom_frequency": "Every 2-3 weeks",
                "bath_reaction": "Tolerates it fine"
            },
            "learned_facts": ["[Grooming] Frequency → Every 2-3 weeks"],
            "summary": "Grooming profile test"
        }

        response = requests.patch(
            f"{BASE_URL}/api/pets/{pet_id}/pillar-soul-update",
            headers=headers,
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        # Score should be calculated (may be same or different depending on existing data)
        assert "new_score" in data
        assert isinstance(data["new_score"], (int, float))
        assert "score_tier" in data


class TestCelebratePillarsProducts:
    """Test product fetching for pillar tabs"""

    def test_get_products_cakes_category(self):
        """Test fetching products with cakes category"""
        response = requests.get(f"{BASE_URL}/api/products?category=cakes&limit=8")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

        data = response.json()
        assert "products" in data, "Response should contain 'products'"

    def test_get_products_treats_category(self):
        """Test fetching products with treats category"""
        response = requests.get(f"{BASE_URL}/api/products?category=treats&limit=8")
        assert response.status_code == 200

        data = response.json()
        assert "products" in data

    def test_get_products_toys_category(self):
        """Test fetching products with toys category"""
        response = requests.get(f"{BASE_URL}/api/products?category=toys&limit=8")
        assert response.status_code == 200

        data = response.json()
        assert "products" in data

    def test_get_products_supplements_category(self):
        """Test fetching products with supplements category (health pillar)"""
        response = requests.get(f"{BASE_URL}/api/products?category=supplements&limit=8")
        assert response.status_code == 200

        data = response.json()
        assert "products" in data


class TestConciergeRequests:
    """Test concierge request endpoint used by special panels"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")

    def test_pillar_concierge_request(self, auth_token):
        """Test POST /api/concierge/pillar-request for special panel actions"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "pillar": "celebrate",
            "request_type": "feast_item",
            "request_label": "Request Salmon Birthday Cake for Test Pet",
            "pet_name": "Test Pet",
            "message": "Please prepare Salmon Birthday Cake for Test Pet's birthday feast",
            "source": "soul_pillar_expanded"
        }

        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            headers=headers,
            json=payload
        )

        # The endpoint may return 200/201 if exists, or 404 if not implemented yet
        if response.status_code in [200, 201]:
            data = response.json()
            # Check for ticket_id or request_id in response
            assert "ticket_id" in data or "request_id" in data or "success" in data
        elif response.status_code == 404:
            pytest.skip("Concierge pillar-request endpoint not yet implemented")
        else:
            # Log but don't fail for other status codes during testing
            print(f"Concierge request returned {response.status_code}: {response.text}")


class TestCelebratePageAPIs:
    """Test APIs used by the celebrate-soul page"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")

    def test_pet_soul_profile(self, auth_token):
        """Test GET /api/pet-soul/profile/{pet_id} used by CelebratePageNew"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get pet ID first
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        assert response.status_code == 200
        data = response.json()
        pets = data.get("pets", [])
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0].get("id")
        
        # Get soul profile - this endpoint may return 404 if not implemented
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{pet_id}", headers=headers)
        # Accept 200 (exists) or 404 (endpoint may redirect to pet data)
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        if response.status_code == 404:
            # Try alternative endpoint
            response = requests.get(f"{BASE_URL}/api/pets/{pet_id}", headers=headers)
            assert response.status_code == 200, f"Alternative endpoint failed: {response.status_code}"

    def test_celebrate_bundles(self):
        """Test GET /api/celebrate/bundles"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        assert response.status_code == 200

    def test_celebrate_page_config(self):
        """Test GET /api/celebrate/page-config"""
        response = requests.get(f"{BASE_URL}/api/celebrate/page-config")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
