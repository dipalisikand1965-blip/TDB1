"""
Test Suite for LEARN OS Layer Personalization (Pet First, Breed Second)
========================================================================
Tests personalization features:
- derive_pet_tags_from_profile() correctly extracts pet tags
- calculate_relevance_score() correctly scores content
- GET /api/os/learn/home with pet_id returns for_your_pet shelf
- GET /api/os/learn/topic/{topic} with pet_id returns personalized content
- Frontend receives relevance_badge and is_personalized flags
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - user with pet Lola (Maltese with anxiety)
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestLearnPersonalizationAPIs:
    """Test personalization features in Learn OS APIs"""
    
    @pytest.fixture
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
    
    @pytest.fixture
    def pet_id(self, auth_token):
        """Get pet ID for the test user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        if response.status_code == 200:
            pets = response.json().get("pets", [])
            if pets:
                return pets[0]["id"]
        pytest.skip("No pets found for test user")
    
    def test_home_without_pet_id_no_personalization(self):
        """Home without pet_id should have personalization disabled"""
        response = requests.get(f"{BASE_URL}/api/os/learn/home")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["personalization"]["enabled"] == False
        assert data["pet_name"] is None
        # for_your_pet should be empty when no pet_id
        assert len(data.get("for_your_pet", [])) == 0
        
        print("✓ Home without pet_id: personalization disabled, no for_your_pet shelf")
    
    def test_home_with_pet_id_returns_personalized_shelf(self, auth_token, pet_id):
        """Home with pet_id should return personalized for_your_pet shelf"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Personalization should be enabled
        assert data["personalization"]["enabled"] == True
        assert data["pet_name"] == "Lola"  # Expected pet name
        
        # Pet tags should be derived (Lola has anxiety markers)
        pet_tags = data["personalization"]["pet_tags"]
        assert "anxious" in pet_tags, f"Expected 'anxious' in pet_tags, got {pet_tags}"
        assert "all" in pet_tags  # Always includes 'all'
        
        # Breed tags should be derived (Maltese)
        breed_tags = data["personalization"]["breed_tags"]
        assert "toy" in breed_tags, f"Expected 'toy' in breed_tags for Maltese, got {breed_tags}"
        assert "long_coat" in breed_tags, f"Expected 'long_coat' in breed_tags for Maltese, got {breed_tags}"
        
        # for_your_pet shelf should have items
        for_your_pet = data.get("for_your_pet", [])
        assert len(for_your_pet) > 0, "for_your_pet shelf should have content"
        
        print(f"✓ Home with pet_id: personalization enabled, {len(for_your_pet)} personalized items")
        print(f"  Pet tags: {pet_tags}")
        print(f"  Breed tags: {breed_tags}")
    
    def test_personalized_items_have_relevance_badge(self, auth_token, pet_id):
        """Personalized items should have relevance_badge 'For {pet_name}'"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        for_your_pet = data.get("for_your_pet", [])
        
        # Items with score >= 10 should have relevance_badge
        high_score_items = [item for item in for_your_pet if item.get("relevance_score", 0) >= 10]
        
        for item in high_score_items:
            assert item.get("relevance_badge") == "For Lola", \
                f"Item '{item['title']}' with score {item['relevance_score']} missing relevance_badge"
            assert item.get("is_personalized") == True, \
                f"Item '{item['title']}' should have is_personalized=True"
        
        print(f"✓ {len(high_score_items)} items have 'For Lola' badge (score >= 10)")
    
    def test_relevance_scoring_pet_tags_10_points(self, auth_token, pet_id):
        """Pet tag match should give 10 points (not 'all' tag)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        for_your_pet = data.get("for_your_pet", [])
        
        # Find item with "anxious" pet tag (Lola has anxious tag)
        anxious_items = [
            item for item in for_your_pet 
            if "anxious" in item.get("pet_tags", [])
        ]
        
        assert len(anxious_items) > 0, "Should have items tagged for anxious pets"
        
        # Check score is at least 10 (pet tag match = 10 points)
        for item in anxious_items:
            assert item.get("relevance_score", 0) >= 10, \
                f"Item '{item['title']}' with 'anxious' tag should have score >= 10, got {item['relevance_score']}"
        
        print(f"✓ {len(anxious_items)} anxiety-related items have score >= 10")
    
    def test_relevance_scoring_breed_tags_5_points(self, auth_token, pet_id):
        """Breed tag match should give 5 points"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/os/learn/topic/grooming?pet_id={pet_id}", 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        shelves = data.get("shelves", {})
        
        # Combine all items to check breed tag scoring
        all_items = []
        all_items.extend(shelves.get("for_your_pet") or [])
        all_items.extend(shelves.get("start_here") or [])
        all_items.extend(shelves.get("guides") or [])
        
        # Find items with "long_coat" or "toy" breed tags (Maltese breed tags)
        breed_items = [
            item for item in all_items 
            if any(tag in item.get("breed_tags", []) for tag in ["long_coat", "toy"])
        ]
        
        # Items with only breed tag match should have score >= 5
        for item in breed_items:
            if not any(tag in item.get("pet_tags", []) for tag in ["anxious", "allergies", "puppy", "senior"]):
                # Only breed tag match, no special pet tags
                assert item.get("relevance_score", 0) >= 5, \
                    f"Item '{item['title']}' with breed tags should have score >= 5"
        
        print(f"✓ Found {len(breed_items)} items with Maltese breed tags")
    
    def test_topic_content_with_pet_id_personalized(self, auth_token, pet_id):
        """Topic content with pet_id should return personalized for_your_pet shelf"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/os/learn/topic/behaviour?pet_id={pet_id}", 
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["personalization"]["enabled"] == True
        assert data["pet_name"] == "Lola"
        
        # Check for_your_pet shelf in topic view
        for_your_pet = data["shelves"].get("for_your_pet")
        
        print(f"✓ Topic 'behaviour' with pet_id: pet_name={data['pet_name']}")
        print(f"  for_your_pet count: {len(for_your_pet) if for_your_pet else 0}")
    
    def test_topic_without_pet_id_no_for_your_pet(self):
        """Topic without pet_id should not have for_your_pet shelf"""
        response = requests.get(f"{BASE_URL}/api/os/learn/topic/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["personalization"]["enabled"] == False
        
        # for_your_pet should be None or empty
        for_your_pet = data["shelves"].get("for_your_pet")
        assert for_your_pet is None or len(for_your_pet) == 0, \
            "for_your_pet should be empty when no pet_id"
        
        print("✓ Topic without pet_id: no for_your_pet shelf")


class TestPetTagDerivation:
    """Test pet tag derivation logic"""
    
    @pytest.fixture
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
    
    @pytest.fixture
    def pet_id(self, auth_token):
        """Get pet ID for the test user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        if response.status_code == 200:
            pets = response.json().get("pets", [])
            if pets:
                return pets[0]["id"]
        pytest.skip("No pets found for test user")
    
    def test_anxiety_tags_derived_from_profile(self, auth_token, pet_id):
        """Pet with anxiety indicators should get 'anxious' tag"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First verify the pet profile has anxiety markers
        pet_response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        pets = pet_response.json().get("pets", [])
        pet = next((p for p in pets if p["id"] == pet_id), None)
        
        # Check pet has anxiety indicators
        doggy_soul = pet.get("doggy_soul_answers", {})
        has_anxiety = (
            doggy_soul.get("noise_sensitivity") == "high" or
            doggy_soul.get("temperament") == "anxious" or
            len(doggy_soul.get("anxiety_triggers", [])) > 0
        )
        assert has_anxiety, "Test pet should have anxiety indicators"
        
        # Now verify API derives anxious tag
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        data = response.json()
        
        pet_tags = data["personalization"]["pet_tags"]
        assert "anxious" in pet_tags, f"Expected 'anxious' tag for pet with anxiety, got {pet_tags}"
        
        print(f"✓ Anxiety tag correctly derived from pet profile")
        print(f"  Indicators: noise_sensitivity={doggy_soul.get('noise_sensitivity')}, temperament={doggy_soul.get('temperament')}")
    
    def test_allergy_tags_derived_from_profile(self, auth_token, pet_id):
        """Pet with allergies should get 'allergies' tag"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First verify the pet profile has allergies
        pet_response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        pets = pet_response.json().get("pets", [])
        pet = next((p for p in pets if p["id"] == pet_id), None)
        
        # Check pet has allergies in preferences or doggy_soul
        has_allergies = (
            pet.get("preferences", {}).get("allergies") or
            pet.get("doggy_soul_answers", {}).get("food_allergies")
        )
        assert has_allergies, "Test pet should have allergies"
        
        # Now verify API derives allergies tag
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        data = response.json()
        
        pet_tags = data["personalization"]["pet_tags"]
        assert "allergies" in pet_tags, f"Expected 'allergies' tag for pet with allergies, got {pet_tags}"
        
        print(f"✓ Allergies tag correctly derived from pet profile")
    
    def test_maltese_breed_tags(self, auth_token, pet_id):
        """Maltese breed should get 'toy' and 'long_coat' tags"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        data = response.json()
        
        breed_tags = data["personalization"]["breed_tags"]
        assert "toy" in breed_tags, f"Expected 'toy' tag for Maltese, got {breed_tags}"
        assert "long_coat" in breed_tags, f"Expected 'long_coat' tag for Maltese, got {breed_tags}"
        
        print(f"✓ Maltese breed tags correctly mapped: {breed_tags}")


class TestPersonalizedContentOrdering:
    """Test that personalized content is properly ordered"""
    
    @pytest.fixture
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
    
    @pytest.fixture
    def pet_id(self, auth_token):
        """Get pet ID for the test user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        if response.status_code == 200:
            pets = response.json().get("pets", [])
            if pets:
                return pets[0]["id"]
        pytest.skip("No pets found for test user")
    
    def test_for_your_pet_ordered_by_relevance(self, auth_token, pet_id):
        """for_your_pet items should be ordered by relevance score (descending)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        data = response.json()
        
        for_your_pet = data.get("for_your_pet", [])
        if len(for_your_pet) < 2:
            pytest.skip("Not enough items to test ordering")
        
        # Check items are ordered by relevance_score (descending)
        scores = [item.get("relevance_score", 0) for item in for_your_pet]
        assert scores == sorted(scores, reverse=True), \
            f"Items not ordered by relevance. Scores: {scores}"
        
        print(f"✓ for_your_pet items ordered by relevance: {scores[:5]}")
    
    def test_anxiety_content_appears_first_for_anxious_pet(self, auth_token, pet_id):
        """For anxious pet, anxiety-related content should appear first in for_your_pet"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={pet_id}", 
            headers=headers
        )
        data = response.json()
        
        for_your_pet = data.get("for_your_pet", [])
        if not for_your_pet:
            pytest.skip("No personalized content")
        
        # Check first few items are anxiety-related
        top_items = for_your_pet[:3]
        anxiety_keywords = ["anxiety", "anxious", "firework", "noise", "loud"]
        
        has_anxiety_content = any(
            any(kw in item.get("title", "").lower() for kw in anxiety_keywords)
            for item in top_items
        )
        
        assert has_anxiety_content, \
            f"Expected anxiety content in top items for anxious pet. Got: {[i['title'] for i in top_items]}"
        
        print(f"✓ Anxiety content appears first: {[i['title'] for i in top_items]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
