"""
P1 Features Testing - Breed-specific content filtering and Auto-switch PICKS pillar
==================================================================================

Features to test:
1. LEARN API: GET /api/os/learn/home?pet_id={pet_id} should return personalization with breed_tags
2. LEARN API: Content should have relevance_badge 'For {pet_name}' for personalized items
3. CHAT API: POST /api/mira/chat with grooming message should return suggested_pillar='care'
4. CHAT API: POST /api/mira/chat with vet message should return suggested_pillar='care' or 'health'
5. CHAT API: POST /api/mira/chat with food message should return suggested_pillar='dine'

Test pet: Mojo (Shih Tzu) - should get brachy, long_coat, toy tags
Pet ID from MongoDB: 699fa0a513e44c977327ad56
"""

import pytest
import requests
import os
import uuid

# Get the backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-ranking.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
# Pet Mojo (Shih Tzu)
TEST_PET_ID = "699fa0a513e44c977327ad56"
EXPECTED_BREED_TAGS = ["brachy", "long_coat", "toy"]


class TestP1Features:
    """Test suite for P1 breed-specific content and auto-switch pillar features."""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for the test user."""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            print(f"Got token: {'Yes' if token else 'No'}")
            return token
        else:
            print(f"Login failed: {response.text[:200]}")
            pytest.skip("Authentication failed - skipping tests")
        return None
    
    @pytest.fixture(scope="class")
    def session_id(self):
        """Generate a unique session ID for chat tests."""
        return f"test-session-{uuid.uuid4().hex[:8]}"

    # ═══════════════════════════════════════════════════════════════════════════
    # FEATURE 1: LEARN API - Breed-specific content filtering
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_learn_home_returns_personalization_without_pet(self):
        """Test that LEARN home works without pet_id (no personalization)."""
        response = requests.get(f"{BASE_URL}/api/os/learn/home")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        data = response.json()
        assert data.get("success") is True
        
        # Without pet_id, personalization should be disabled
        personalization = data.get("personalization", {})
        assert personalization.get("enabled") is False or personalization.get("pet_tags") == []
        print(f"[LEARN] No pet: personalization.enabled={personalization.get('enabled')}")
    
    def test_learn_home_returns_breed_tags_for_shih_tzu(self, auth_token):
        """Test that LEARN home returns breed_tags for Shih Tzu pet."""
        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        data = response.json()
        assert data.get("success") is True
        
        # Check personalization is enabled
        personalization = data.get("personalization", {})
        assert personalization.get("enabled") is True, "Personalization should be enabled with pet_id"
        
        # Check breed_tags are returned
        breed_tags = personalization.get("breed_tags", [])
        print(f"[LEARN] Breed tags for Shih Tzu: {breed_tags}")
        
        # Shih Tzu should have brachy, long_coat, toy tags
        for expected_tag in EXPECTED_BREED_TAGS:
            assert expected_tag in breed_tags, f"Expected '{expected_tag}' in breed_tags, got {breed_tags}"
        
        print(f"[LEARN] ✅ Breed tags match expected: {EXPECTED_BREED_TAGS}")
    
    def test_learn_home_returns_pet_name(self, auth_token):
        """Test that LEARN home returns pet_name for personalization."""
        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check pet_name is returned
        pet_name = data.get("pet_name")
        print(f"[LEARN] Pet name: {pet_name}")
        assert pet_name is not None, "pet_name should be returned in response"
    
    def test_learn_home_for_your_pet_shelf_is_personalized(self, auth_token):
        """Test that 'For your pet' shelf contains personalized content."""
        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        response = requests.get(
            f"{BASE_URL}/api/os/learn/home?pet_id={TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for_your_pet = data.get("for_your_pet", [])
        pet_name = data.get("pet_name", "your pet")
        
        print(f"[LEARN] 'For {pet_name}' shelf has {len(for_your_pet)} items")
        
        if len(for_your_pet) > 0:
            # Check that personalized items have relevance_badge
            personalized_items = [item for item in for_your_pet if item.get("is_personalized")]
            badged_items = [item for item in for_your_pet if item.get("relevance_badge")]
            
            print(f"[LEARN] Personalized items: {len(personalized_items)}")
            print(f"[LEARN] Items with relevance_badge: {len(badged_items)}")
            
            # Log the first few items
            for item in for_your_pet[:3]:
                print(f"  - {item.get('title')} | badge: {item.get('relevance_badge')} | score: {item.get('relevance_score')}")
            
            # At least some items should have relevance_badge
            assert len(badged_items) > 0 or len(personalized_items) > 0, "For your pet shelf should have personalized items"
    
    def test_learn_topic_content_personalized(self, auth_token):
        """Test that topic content is also personalized based on pet."""
        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        # Test grooming topic (should be relevant for long_coat tag)
        response = requests.get(
            f"{BASE_URL}/api/os/learn/topic/grooming?pet_id={TEST_PET_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        shelves = data.get("shelves", {})
        for_your_pet = shelves.get("for_your_pet")
        personalization = data.get("personalization", {})
        
        print(f"[LEARN TOPIC] Grooming - personalization.enabled: {personalization.get('enabled')}")
        print(f"[LEARN TOPIC] Breed tags applied: {personalization.get('breed_tags_applied')}")
        
        if for_your_pet:
            print(f"[LEARN TOPIC] 'For your pet' shelf has {len(for_your_pet)} items")
            for item in for_your_pet[:2]:
                print(f"  - {item.get('title')} | badge: {item.get('relevance_badge')}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FEATURE 2: CHAT API - Auto-switch PICKS pillar based on conversation
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_chat_grooming_returns_care_pillar(self, auth_token, session_id):
        """Test that grooming conversation returns suggested_pillar='care'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "I need to book a grooming appointment for my dog",
            "session_id": session_id,
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:300]}"
        
        data = response.json()
        
        # Check suggested_pillar
        suggested_pillar = data.get("suggested_pillar")
        highlight_tab = data.get("highlight_tab")
        
        print(f"[CHAT GROOMING] suggested_pillar: {suggested_pillar}")
        print(f"[CHAT GROOMING] highlight_tab: {highlight_tab}")
        
        assert suggested_pillar == "care", f"Expected suggested_pillar='care' for grooming query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Grooming conversation correctly returns suggested_pillar='care'")
    
    def test_chat_vet_returns_care_pillar(self, auth_token, session_id):
        """Test that vet conversation returns suggested_pillar='care'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "I need to take my dog to the vet for a checkup",
            "session_id": f"{session_id}-vet",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggested_pillar = data.get("suggested_pillar")
        print(f"[CHAT VET] suggested_pillar: {suggested_pillar}")
        
        # Vet should return 'care' pillar
        assert suggested_pillar == "care", f"Expected suggested_pillar='care' for vet query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Vet conversation correctly returns suggested_pillar='care'")
    
    def test_chat_food_returns_dine_pillar(self, auth_token, session_id):
        """Test that food conversation returns suggested_pillar='dine'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "What food should I feed my dog? Any treat recommendations?",
            "session_id": f"{session_id}-food",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggested_pillar = data.get("suggested_pillar")
        print(f"[CHAT FOOD] suggested_pillar: {suggested_pillar}")
        
        assert suggested_pillar == "dine", f"Expected suggested_pillar='dine' for food query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Food conversation correctly returns suggested_pillar='dine'")
    
    def test_chat_birthday_returns_celebrate_pillar(self, auth_token, session_id):
        """Test that birthday conversation returns suggested_pillar='celebrate'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "I want to plan a birthday party for my dog",
            "session_id": f"{session_id}-bday",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggested_pillar = data.get("suggested_pillar")
        print(f"[CHAT BIRTHDAY] suggested_pillar: {suggested_pillar}")
        
        assert suggested_pillar == "celebrate", f"Expected suggested_pillar='celebrate' for birthday query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Birthday conversation correctly returns suggested_pillar='celebrate'")
    
    def test_chat_travel_returns_travel_pillar(self, auth_token, session_id):
        """Test that travel conversation returns suggested_pillar='travel'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "I'm planning a trip to Goa with my dog",
            "session_id": f"{session_id}-travel",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggested_pillar = data.get("suggested_pillar")
        print(f"[CHAT TRAVEL] suggested_pillar: {suggested_pillar}")
        
        assert suggested_pillar == "travel", f"Expected suggested_pillar='travel' for travel query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Travel conversation correctly returns suggested_pillar='travel'")
    
    def test_chat_boarding_returns_stay_pillar(self, auth_token, session_id):
        """Test that boarding conversation returns suggested_pillar='stay'."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "I need boarding for my dog while I'm away for a week",
            "session_id": f"{session_id}-stay",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggested_pillar = data.get("suggested_pillar")
        print(f"[CHAT BOARDING] suggested_pillar: {suggested_pillar}")
        
        assert suggested_pillar == "stay", f"Expected suggested_pillar='stay' for boarding query, got '{suggested_pillar}'"
        print("[CHAT] ✅ Boarding conversation correctly returns suggested_pillar='stay'")
    
    def test_chat_response_contains_highlight_tab_for_service(self, auth_token, session_id):
        """Test that service ticket creation highlights the services tab."""
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        payload = {
            "message": "Book a grooming session for my dog next week",
            "session_id": f"{session_id}-book",
            "source": "test",
            "selected_pet_id": TEST_PET_ID,
            "pet_name": "Mojo"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        highlight_tab = data.get("highlight_tab")
        actions = data.get("actions", [])
        
        print(f"[CHAT SERVICE] highlight_tab: {highlight_tab}")
        print(f"[CHAT SERVICE] actions: {actions}")
        
        # If a ticket was created, highlight_tab should be 'services'
        has_service_action = any(a.get("type") == "service_created" for a in actions)
        
        if has_service_action:
            assert highlight_tab == "services", "When service ticket is created, highlight_tab should be 'services'"
            print("[CHAT] ✅ Service ticket creation correctly highlights 'services' tab")
        else:
            print("[CHAT] ℹ️ No service ticket was created in this interaction")


class TestLearnBreeTagMap:
    """Test breed tag mapping logic."""
    
    def test_learn_topics_endpoint(self):
        """Test that topics endpoint works."""
        response = requests.get(f"{BASE_URL}/api/os/learn/topics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        topics = data.get("topics", [])
        
        print(f"[LEARN] Topics available: {len(topics)}")
        for topic in topics[:5]:
            print(f"  - {topic.get('id')}: {topic.get('label')}")
        
        assert len(topics) > 0, "Should have at least one topic"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
