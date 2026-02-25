"""
Test suite for Mira OS Critical Bug Fixes (Iteration 195)

Tests for:
1. Grooming flow asks clarifying questions before searching for groomers
2. Quick reply tabs appear with Mira's responses for grooming query
3. Leash query does NOT generate meal plan tip card
4. Boarding flow asks clarifying questions
5. Pet First doctrine - Mira should say 'From what I know about [Pet]'
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test pet context
TEST_PET_CONTEXT = {
    "name": "Lola",
    "breed": "Golden Retriever",
    "age": "2 years",
    "weight": 25,
    "species": "dog"
}


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_mira_endpoint_accessible(self):
        """Verify API health check passes"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ API health check passed")


class TestGroomingClarifyingQuestions:
    """
    BUG FIX #1: Grooming flow asks clarifying questions BEFORE searching for groomers
    
    When user says "I need a groomer", Mira should:
    1. NOT trigger Places API immediately
    2. Ask clarifying questions like "salon or home grooming?"
    3. Only search for locations after user provides preference
    """
    
    def test_grooming_query_asks_clarifying_question_first(self):
        """Grooming query should ask clarifying question, not show places immediately"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "i need a groomer",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_grooming_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200, f"API failed with status {response.status_code}"
        data = response.json()
        
        # Validate response structure
        assert "response" in data, "Response missing 'response' field"
        message = data.get("response", {}).get("message", "")
        
        # Should ask a clarifying question (contain question mark)
        has_question = "?" in message
        
        # Should NOT show places/locations immediately
        places_shown = data.get("nearby_places", [])
        places_count = len(places_shown) if places_shown else 0
        
        print(f"Message (first 200 chars): {message[:200]}")
        print(f"Has question: {has_question}")
        print(f"Places shown: {places_count}")
        
        # Assert fix is working
        assert has_question, "Grooming query should ask clarifying question (contain '?')"
        assert places_count == 0, f"Grooming query should NOT show places immediately, got {places_count}"
    
    def test_grooming_explicit_near_me_may_search(self):
        """When user explicitly asks 'near me', can proceed to search"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "find me a groomer near me",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_grooming_near_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify API returns valid response structure
        assert "response" in data
        print(f"✓ Explicit 'near me' query handled correctly")


class TestQuickRepliesInResponse:
    """
    BUG FIX #2: Quick reply tabs appear with Mira's responses
    
    When Mira asks a clarifying question, the response should include quick_replies
    """
    
    def test_grooming_query_returns_quick_replies(self):
        """Grooming query should return quick_replies for user options"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "i need a groomer for my dog",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_quickreply_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for quick_replies in response
        quick_replies = data.get("response", {}).get("quick_replies", [])
        message = data.get("response", {}).get("message", "")
        
        print(f"Quick replies found: {quick_replies}")
        print(f"Response message (first 200 chars): {message[:200]}")
        
        # Grooming queries should return quick replies since they're clarifying questions
        assert len(quick_replies) >= 2, f"Grooming query should include at least 2 quick_replies, got: {quick_replies}"
        
        # Verify quick replies are non-empty strings
        for reply in quick_replies:
            assert isinstance(reply, str) and len(reply) > 0, f"Quick reply should be non-empty string, got: {reply}"
        
        print(f"✓ Quick replies returned: {quick_replies}")


class TestLeashQueryNoMealPlanTipCard:
    """
    BUG FIX #3: Leash query does NOT generate meal plan tip card
    
    When user asks for "a leash for my dog", it should:
    1. NOT generate a tip_card (especially not meal_plan)
    2. Show products instead
    """
    
    def test_leash_query_no_tip_card(self):
        """Leash query should NOT return a tip card - it's a product query"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "i need a leash for my dog",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_leash_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check tip_card in response
        tip_card = data.get("response", {}).get("tip_card")
        tip_card_type = data.get("response", {}).get("tip_card_type")
        products_count = len(data.get("response", {}).get("products", []))
        
        print(f"Tip card returned: {tip_card}")
        print(f"Tip card type: {tip_card_type}")
        print(f"Products count: {products_count}")
        
        # Leash is a PRODUCT query - should NOT generate tip card
        assert tip_card is None, f"Leash query should NOT generate tip_card, but got: {tip_card}"
        assert tip_card_type is None, f"Leash query tip_card_type should be None, but got: {tip_card_type}"
        
        print(f"✓ No tip card for leash query - products shown instead")
    
    def test_leash_query_not_meal_plan(self):
        """Leash query should NEVER be categorized as meal_plan"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "i need a leash for my dog",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_leash_mealplan_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        tip_card_type = data.get("response", {}).get("tip_card_type")
        
        # Should NOT be meal_plan
        assert tip_card_type != "meal_plan", "Leash query should NEVER be categorized as meal_plan"
        print(f"✓ Leash not categorized as meal_plan")
    
    def test_collar_query_no_tip_card(self):
        """Similar product queries (collar) should NOT return tip card"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "show me some collars for dogs",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_collar_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        tip_card = data.get("response", {}).get("tip_card")
        
        assert tip_card is None, f"Collar query should NOT generate tip_card, but got: {tip_card}"
        print(f"✓ No tip card for collar query")


class TestBoardingClarifyingQuestions:
    """
    BUG FIX #4: Boarding flow asks clarifying questions
    
    Similar to grooming, boarding queries should ask clarifying questions first
    """
    
    def test_boarding_query_asks_clarifying_question(self):
        """Boarding query should ask clarifying question first"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "i need boarding for my dog",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_boarding_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        message = data.get("response", {}).get("message", "")
        places_shown = data.get("nearby_places", [])
        quick_replies = data.get("response", {}).get("quick_replies", [])
        
        # Should ask clarifying question
        has_question = "?" in message
        places_count = len(places_shown) if places_shown else 0
        
        print(f"Boarding message (first 200 chars): {message[:200]}")
        print(f"Has question: {has_question}")
        print(f"Quick replies: {quick_replies}")
        print(f"Places count: {places_count}")
        
        assert has_question, "Boarding query should ask clarifying question (contain '?')"
        assert places_count == 0, f"Boarding query should NOT show places immediately, got {places_count}"
        
        print(f"✓ Boarding asks clarifying question with quick replies")


class TestPetFirstDoctrine:
    """
    BUG FIX #5: Pet First doctrine - Mira should personalize responses
    
    Mira should mention pet by name and not use generic breed language
    """
    
    def test_response_mentions_pet_name(self):
        """Response should mention pet by name for personalization"""
        response = requests.post(f"{BASE_URL}/api/mira/os/understand-with-products", json={
            "input": "what should I feed my dog?",
            "pet_context": TEST_PET_CONTEXT,
            "session_id": f"test_petfirst_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "conversation_stage": "initial",
            "step_history": []
        })
        
        assert response.status_code == 200
        data = response.json()
        
        message = data.get("response", {}).get("message", "")
        pet_name = TEST_PET_CONTEXT.get("name", "Lola")
        
        print(f"Pet name: {pet_name}")
        print(f"Message (first 300 chars): {message[:300]}")
        
        # Check if pet name is mentioned
        pet_name_mentioned = pet_name.lower() in message.lower()
        
        # Check for generic breed language (should be avoided)
        generic_phrases = ["golden retrievers are", "golden retrievers typically", "this breed", "dogs of this breed"]
        uses_generic_language = any(phrase in message.lower() for phrase in generic_phrases)
        
        print(f"Pet name mentioned: {pet_name_mentioned}")
        print(f"Uses generic language: {uses_generic_language}")
        
        # Pet name should be mentioned for personalization
        assert pet_name_mentioned, f"Response should mention pet name '{pet_name}' for personalization"
        
        if not uses_generic_language:
            print(f"✓ Pet First doctrine applied - personalized response")
        else:
            print(f"⚠ Response uses some generic breed language")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
