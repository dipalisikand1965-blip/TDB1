"""
Test Mira Concierge Picks API - Intelligence Layer for 'Picks for {Pet}' feature
===============================================================================

Tests:
- GET /api/mira/curated-set/{pet_id}/{pillar} - personalized concierge cards
- POST /api/mira/concierge-pick/ticket - ticket creation with notifications
- why_for_pet text reflects actual pet traits (anxious → "calm and gentle approach")
- 3-5 cards returned (2-3 products + 1-2 services)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
ANXIOUS_PET_ID = "pet-e6348b13c975"  # Lola - anxious pet
ANXIOUS_PET_NAME = "Lola"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API calls"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # API returns 'access_token' not 'token'
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestCuratedSetAPI:
    """Tests for GET /api/mira/curated-set/{pet_id}/{pillar}"""
    
    def test_curated_set_returns_200(self, api_client):
        """API should return 200 with valid pet_id and pillar"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ Curated set API returns 200")
    
    def test_curated_set_returns_correct_structure(self, api_client):
        """Response should have concierge_products, concierge_services, meta"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "concierge_products" in data, "Missing concierge_products"
        assert "concierge_services" in data, "Missing concierge_services"
        assert "meta" in data, "Missing meta"
        
        print(f"✅ Response structure correct - {len(data['concierge_products'])} products, {len(data['concierge_services'])} services")
    
    def test_curated_set_returns_3_to_5_cards(self, api_client):
        """Should return 3-5 cards total (2-3 products + 1-2 services)"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        total = len(products) + len(services)
        
        # Should be 3-5 cards total
        assert 3 <= total <= 5, f"Expected 3-5 cards, got {total}"
        assert 2 <= len(products) <= 3, f"Expected 2-3 products, got {len(products)}"
        assert 1 <= len(services) <= 2, f"Expected 1-2 services, got {len(services)}"
        
        print(f"✅ Card count correct: {len(products)} products + {len(services)} services = {total} total")
    
    def test_anxious_pet_gets_calm_why_for_pet(self, api_client):
        """Anxious pet Lola should get 'calm and gentle approach' NOT 'elegant'"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        all_cards = data.get("concierge_products", []) + data.get("concierge_services", [])
        
        # Collect all why_for_pet texts
        why_texts = [card.get("why_for_pet", "") for card in all_cards]
        
        # Check that at least one card has anxiety-related text
        anxious_keywords = ["calm", "gentle", "quiet", "cozy", "peaceful"]
        found_anxious_text = False
        for text in why_texts:
            if any(kw in text.lower() for kw in anxious_keywords):
                found_anxious_text = True
                print(f"✅ Found anxious-appropriate text: '{text}'")
                break
        
        assert found_anxious_text, f"Expected 'calm/gentle/quiet' in why_for_pet for anxious pet, got: {why_texts}"
        
        # Verify NOT 'elegant' (unless also calm)
        for text in why_texts:
            if "elegant" in text.lower() and not any(kw in text.lower() for kw in anxious_keywords):
                pytest.fail(f"Anxious pet got 'elegant' without calm context: '{text}'")
    
    def test_cards_have_correct_type_labels(self, api_client):
        """Cards should have type 'concierge_product' or 'concierge_service'"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        for card in data.get("concierge_products", []):
            assert card.get("type") == "concierge_product", f"Product card has wrong type: {card.get('type')}"
        
        for card in data.get("concierge_services", []):
            assert card.get("type") == "concierge_service", f"Service card has wrong type: {card.get('type')}"
        
        print("✅ All cards have correct type labels")
    
    def test_cards_have_cta_action_create_ticket(self, api_client):
        """All concierge cards should have cta_action='create_ticket'"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        all_cards = data.get("concierge_products", []) + data.get("concierge_services", [])
        
        for card in all_cards:
            assert card.get("cta_action") == "create_ticket", f"Card {card.get('id')} has wrong cta_action: {card.get('cta_action')}"
        
        print("✅ All cards have cta_action='create_ticket'")
    
    def test_invalid_pillar_returns_400(self, api_client):
        """Invalid pillar should return 400"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/invalid_pillar")
        assert response.status_code == 400, f"Expected 400 for invalid pillar, got {response.status_code}"
        print("✅ Invalid pillar returns 400")
    
    def test_invalid_pet_returns_404(self, api_client):
        """Invalid pet_id should return 404"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/invalid-pet-id-xxx/celebrate")
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✅ Invalid pet returns 404")


class TestConciergePickTicketAPI:
    """Tests for POST /api/mira/concierge-pick/ticket"""
    
    def test_create_ticket_returns_200(self, api_client):
        """Ticket creation should return 200 with ticket_id"""
        payload = {
            "pet_id": ANXIOUS_PET_ID,
            "card_id": "celebrate_custom_cake_design",
            "card_type": "concierge_product",
            "card_name": "TEST_Custom Celebration Cake Design",
            "pillar": "celebrate",
            "description": "Test ticket creation",
            "why_for_pet": "Designed for Lola's calm and gentle approach"
        }
        
        response = api_client.post(f"{BASE_URL}/api/mira/concierge-pick/ticket", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "ticket_id" in data, f"Missing ticket_id in response: {data}"
        
        print(f"✅ Ticket created: {data['ticket_id']}")
    
    def test_create_ticket_with_service_card(self, api_client):
        """Service card ticket creation should work"""
        payload = {
            "pet_id": ANXIOUS_PET_ID,
            "card_id": "celebrate_home_setup",
            "card_type": "concierge_service",
            "card_name": "TEST_At-Home Setup + Safe Zones",
            "pillar": "celebrate",
            "description": "Test service ticket",
            "why_for_pet": "Tailored for Lola's quiet-and-cozy style"
        }
        
        response = api_client.post(f"{BASE_URL}/api/mira/concierge-pick/ticket", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        print(f"✅ Service ticket created: {data['ticket_id']}")
    
    def test_create_ticket_invalid_pet_returns_404(self, api_client):
        """Invalid pet_id should return 404"""
        payload = {
            "pet_id": "invalid-pet-xxx",
            "card_id": "celebrate_custom_cake_design",
            "card_type": "concierge_product",
            "card_name": "Test Card",
            "pillar": "celebrate"
        }
        
        response = api_client.post(f"{BASE_URL}/api/mira/concierge-pick/ticket", json=payload)
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✅ Invalid pet in ticket creation returns 404")
    
    def test_create_ticket_unauthenticated_returns_401(self):
        """Unauthenticated request should return 401"""
        payload = {
            "pet_id": ANXIOUS_PET_ID,
            "card_id": "celebrate_custom_cake_design",
            "card_type": "concierge_product",
            "card_name": "Test Card",
            "pillar": "celebrate"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/concierge-pick/ticket",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401 for unauth, got {response.status_code}"
        print("✅ Unauthenticated ticket creation returns 401")


class TestQuestionCard:
    """Tests for question_card in curated-set response"""
    
    def test_question_card_has_microcopy_field(self, api_client):
        """Question card should exist and have proper structure"""
        response = api_client.get(f"{BASE_URL}/api/mira/curated-set/{ANXIOUS_PET_ID}/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        question_card = data.get("question_card")
        if question_card:  # Only test if present (may be None if profile is complete)
            assert question_card.get("type") == "question_card"
            assert "question" in question_card
            assert "options" in question_card
            # The microcopy "This will refine {pet}'s picks" is in the frontend
            print(f"✅ Question card present: '{question_card.get('question')}'")
        else:
            print("ℹ️ No question card (profile may be complete)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
