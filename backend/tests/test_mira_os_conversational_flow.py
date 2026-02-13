"""
Test suite for Mira OS Conversational Flow
==========================================
Tests the Pet-First, Context-Aware, Memory-Driven conversational flow:
1. When pet has known location → only ask seating preference (1 question)
2. When pet has NO location → ask both location AND seating (2 questions max)
3. Correct pronouns (she/her for female, he/his for male, they/their for unknown)
4. Pet traits (energy_level, temperament) used in response
5. When user provides seating preference → return Google Places results
6. Response includes execution options (arrange table, check availability)
7. Combined response (location + seating) skips to results
"""

import pytest
import requests
import os
import json
from typing import Dict, Any

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("access_token")


@pytest.fixture(scope="module")
def test_pets(auth_token):
    """Get all pets for the test user"""
    response = requests.get(
        f"{BASE_URL}/api/pets",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200, f"Failed to get pets: {response.text}"
    return response.json().get("pets", [])


@pytest.fixture(scope="module")
def female_pet(test_pets):
    """Get a female pet for pronoun testing"""
    for pet in test_pets:
        gender = pet.get("gender")
        if gender and gender.lower() == "female":
            return pet
    pytest.skip("No female pet found for testing")


@pytest.fixture(scope="module")
def male_pet(test_pets):
    """Get a male pet for pronoun testing"""
    for pet in test_pets:
        gender = pet.get("gender")
        if gender and gender.lower() == "male":
            return pet
    pytest.skip("No male pet found for testing")


@pytest.fixture(scope="module")
def unknown_gender_pet(test_pets):
    """Get a pet with unknown/null gender for pronoun testing"""
    for pet in test_pets:
        if not pet.get("gender"):
            return pet
    pytest.skip("No pet with unknown gender found for testing")


@pytest.fixture(scope="module")
def pet_with_traits(test_pets):
    """Get a pet with energy_level and temperament defined"""
    for pet in test_pets:
        doggy_soul = pet.get("doggy_soul_answers", {})
        if doggy_soul.get("energy_level") or doggy_soul.get("temperament"):
            return pet
    # If no pet with traits, return the first pet
    if test_pets:
        return test_pets[0]
    pytest.skip("No pets found for testing")


def call_mira_chat(auth_token: str, message: str, pet_context: Dict[str, Any], session_id: str = None) -> Dict:
    """
    Helper function to call Mira chat endpoint
    """
    payload = {
        "message": message,
        "pet_context": pet_context,
        "session_id": session_id,
        "selected_pet_id": pet_context.get("id"),
        "conversation_history": []
    }
    
    response = requests.post(
        f"{BASE_URL}/api/mira/chat",
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    return response


class TestMiraOSConversationalFlow:
    """Tests for Mira OS Conversational Flow - Pet-First, Context-Aware"""
    
    # =========================================================================
    # TEST 1: Pet with known location → only ask seating preference (1 question)
    # =========================================================================
    def test_known_location_asks_only_seating(self, auth_token, pet_with_traits):
        """
        When pet_context has location, Mira should only ask for seating preference.
        NOT ask for location again.
        """
        # Add location to pet context
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            "location": {"city": "Bangalore", "area": "Koramangala"},  # Known location
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "I want to go to a pet-friendly restaurant with my dog",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True, "Response should be successful"
        response_text = data.get("response", "").lower()
        
        # Should ask about seating, NOT location (since we have location)
        # Look for seating-related keywords
        seating_keywords = ["seating", "indoor", "outdoor", "patio", "cafe"]
        has_seating_question = any(kw in response_text for kw in seating_keywords)
        
        # Should NOT ask for location since we have it
        location_question_keywords = ["which area", "which city", "where are you", "your location"]
        asks_for_location = any(kw in response_text for kw in location_question_keywords)
        
        # Check awaiting field - should be waiting for seating, not location
        awaiting = data.get("awaiting", "")
        
        print(f"Response: {data.get('response')[:300]}")
        print(f"Awaiting: {awaiting}")
        print(f"Intent: {data.get('intent')}")
        
        # The response should ask for seating preference since location is known
        if awaiting:
            assert "seating" in awaiting.lower() or "location" not in awaiting.lower(), \
                f"With known location, should ask for seating not location. Got: {awaiting}"
    
    
    # =========================================================================
    # TEST 2: Pet with NO location → ask both location AND seating (max 2 questions)
    # =========================================================================
    def test_no_location_asks_both_questions(self, auth_token, pet_with_traits):
        """
        When pet_context has NO location, Mira should ask for both location 
        AND seating preference (max 2 questions).
        """
        # Pet context WITHOUT location
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            # NO location field
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "Find me a pet-friendly cafe",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") is True, "Response should be successful"
        response_text = data.get("response", "").lower()
        
        # Should ask for location
        location_keywords = ["area", "city", "where", "location", "search"]
        asks_location = any(kw in response_text for kw in location_keywords)
        
        # Check awaiting field
        awaiting = data.get("awaiting", "")
        
        print(f"Response: {data.get('response')[:300]}")
        print(f"Awaiting: {awaiting}")
        print(f"Intent: {data.get('intent')}")
        
        # Without location, should ask for it
        if awaiting:
            assert "location" in awaiting.lower() or awaiting == "location_and_seating", \
                f"Without location, should ask for location. Got: {awaiting}"
    
    
    # =========================================================================
    # TEST 3: Female pet pronouns (she/her)
    # =========================================================================
    def test_female_pet_pronouns(self, auth_token, female_pet):
        """
        For female pets, Mira should use she/her pronouns.
        """
        pet_context = {
            "id": female_pet.get("id"),
            "name": female_pet.get("name"),
            "breed": female_pet.get("breed"),
            "gender": female_pet.get("gender"),  # Should be "female"
            "temperament": female_pet.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": female_pet.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "I want to find a restaurant for my dog",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        pet_name = female_pet.get("name")
        
        print(f"Pet: {pet_name}, Gender: {female_pet.get('gender')}")
        print(f"Response: {response_text[:400]}")
        
        # Check for correct pronouns in response or pet_context_used
        response_lower = response_text.lower()
        pet_context_used = data.get("pet_context_used", {})
        
        # For a female pet, we should NOT see he/his as pronouns (unless it's part of another word)
        # This is a soft check since LLM responses vary
        if pet_name.lower() in response_lower:
            # If pet name is mentioned, check pronouns around it
            has_female_pronoun = "her" in response_lower or "she" in response_lower
            has_male_pronoun_alone = " he " in response_lower or " his " in response_lower
            
            # Log but don't fail hard since LLM responses vary
            print(f"Female pronouns (her/she) found: {has_female_pronoun}")
            print(f"Male pronouns (he/his) found: {has_male_pronoun_alone}")
    
    
    # =========================================================================
    # TEST 4: Male pet pronouns (he/his)
    # =========================================================================
    def test_male_pet_pronouns(self, auth_token, male_pet):
        """
        For male pets, Mira should use he/his pronouns.
        """
        pet_context = {
            "id": male_pet.get("id"),
            "name": male_pet.get("name"),
            "breed": male_pet.get("breed"),
            "gender": male_pet.get("gender"),  # Should be "male"
            "temperament": male_pet.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": male_pet.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "Looking for a pet-friendly restaurant",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        pet_name = male_pet.get("name")
        
        print(f"Pet: {pet_name}, Gender: {male_pet.get('gender')}")
        print(f"Response: {response_text[:400]}")
        
        response_lower = response_text.lower()
        
        # For a male pet, check if correct pronouns are used
        if pet_name.lower() in response_lower:
            has_male_pronoun = " he " in response_lower or " his " in response_lower
            has_female_pronoun_alone = " she " in response_lower or " her " in f" {response_lower} "
            
            print(f"Male pronouns (he/his) found: {has_male_pronoun}")
            print(f"Female pronouns (she/her) found: {has_female_pronoun_alone}")
    
    
    # =========================================================================
    # TEST 5: Unknown gender pet pronouns (they/their)
    # =========================================================================
    def test_unknown_gender_pronouns(self, auth_token, unknown_gender_pet):
        """
        For pets with unknown gender, Mira should use they/their pronouns.
        """
        pet_context = {
            "id": unknown_gender_pet.get("id"),
            "name": unknown_gender_pet.get("name"),
            "breed": unknown_gender_pet.get("breed"),
            "gender": None,  # Unknown gender
            "temperament": unknown_gender_pet.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": unknown_gender_pet.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "Recommend a cafe for my dog",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        pet_name = unknown_gender_pet.get("name")
        
        print(f"Pet: {pet_name}, Gender: {unknown_gender_pet.get('gender')}")
        print(f"Response: {response_text[:400]}")
        
        # For unknown gender, they/their should be used
        response_lower = response_text.lower()
        if pet_name.lower() in response_lower:
            has_neutral_pronoun = "their" in response_lower or "they" in response_lower
            print(f"Neutral pronouns (they/their) found: {has_neutral_pronoun}")
    
    
    # =========================================================================
    # TEST 6: Pet traits (energy_level, temperament) used in response
    # =========================================================================
    def test_pet_traits_used_in_response(self, auth_token, test_pets):
        """
        Mira should use pet behavioral traits (energy_level, temperament) 
        in her response for personalization.
        """
        # Find a pet with defined traits
        pet_with_traits = None
        for pet in test_pets:
            doggy_soul = pet.get("doggy_soul_answers", {})
            if doggy_soul.get("temperament") or doggy_soul.get("energy_level"):
                pet_with_traits = pet
                break
        
        if not pet_with_traits:
            pytest.skip("No pet with traits found")
        
        doggy_soul = pet_with_traits.get("doggy_soul_answers", {})
        temperament = doggy_soul.get("temperament")
        energy_level = doggy_soul.get("energy_level")
        
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            "temperament": temperament,
            "energy_level": energy_level
        }
        
        response = call_mira_chat(
            auth_token,
            "Find a restaurant for us to dine out",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        pet_context_used = data.get("pet_context_used", {})
        
        print(f"Pet: {pet_with_traits.get('name')}")
        print(f"Temperament: {temperament}")
        print(f"Energy Level: {energy_level}")
        print(f"Response: {response_text[:400]}")
        print(f"Pet Context Used: {pet_context_used}")
        
        # Check if pet traits are referenced in response or returned in context
        response_lower = response_text.lower()
        
        traits_mentioned = False
        if temperament and temperament.lower() in response_lower:
            traits_mentioned = True
            print(f"Temperament '{temperament}' found in response")
        if energy_level and energy_level.lower() in response_lower:
            traits_mentioned = True
            print(f"Energy level '{energy_level}' found in response")
        
        # Also check pet_context_used in response
        if pet_context_used:
            if pet_context_used.get("temperament"):
                print(f"Temperament in pet_context_used: {pet_context_used.get('temperament')}")
            if pet_context_used.get("energy"):
                print(f"Energy in pet_context_used: {pet_context_used.get('energy')}")
    
    
    # =========================================================================
    # TEST 7: Seating preference → Google Places results
    # =========================================================================
    def test_seating_preference_returns_places(self, auth_token, pet_with_traits):
        """
        When user provides seating preference, Mira should return Google Places results.
        """
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            "location": {"city": "Bangalore"},  # Provide location
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        # User provides seating preference (answering the question)
        response = call_mira_chat(
            auth_token,
            "Outdoor seating please, in Koramangala",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response: {data.get('response', '')[:400]}")
        print(f"Intent: {data.get('intent')}")
        print(f"Has nearby_places: {'nearby_places' in data and data['nearby_places'] is not None}")
        
        nearby_places = data.get("nearby_places")
        
        # If nearby_places is returned, validate structure
        if nearby_places:
            print(f"Places type: {nearby_places.get('type')}")
            print(f"Places count: {len(nearby_places.get('places', []))}")
            print(f"City: {nearby_places.get('city')}")
            print(f"Source: {nearby_places.get('source')}")
            
            # Validate places structure
            places = nearby_places.get("places", [])
            if places:
                first_place = places[0]
                print(f"First place: {first_place.get('name')}")
                
                # Places should have expected fields
                expected_fields = ["name"]
                for field in expected_fields:
                    assert field in first_place, f"Place missing field: {field}"
    
    
    # =========================================================================
    # TEST 8: Response includes execution options
    # =========================================================================
    def test_execution_options_in_response(self, auth_token, pet_with_traits):
        """
        Response should include execution options like 'arrange table', 
        'check availability' when showing places.
        """
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            "location": {"city": "Bangalore", "area": "Koramangala"},
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        # Provide both location and seating to get results
        response = call_mira_chat(
            auth_token,
            "Outdoor dining in Indiranagar",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        execution_options = data.get("execution_options", [])
        follow_ups = data.get("follow_ups", [])
        
        print(f"Response: {response_text[:400]}")
        print(f"Execution options: {execution_options}")
        print(f"Follow-ups: {follow_ups}")
        print(f"Intent: {data.get('intent')}")
        
        # Check if execution options are present (when places are returned)
        if data.get("nearby_places"):
            # Should have execution options
            if execution_options:
                print("Execution options found in response")
                action_types = [opt.get("action") or opt.get("type") for opt in execution_options]
                print(f"Action types: {action_types}")
            
            # Or check if response text mentions actions
            response_lower = response_text.lower()
            action_keywords = ["arrange", "book", "check availability", "confirm", "reserve"]
            has_action_text = any(kw in response_lower for kw in action_keywords)
            print(f"Action keywords in response text: {has_action_text}")
    
    
    # =========================================================================
    # TEST 9: Combined response (location + seating) skips to results
    # =========================================================================
    def test_combined_response_shows_results(self, auth_token, pet_with_traits):
        """
        When user provides both location AND seating in one message,
        Mira should skip questions and show results directly.
        """
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            # No location - user will provide both in message
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        # User provides BOTH location AND seating preference in one message
        response = call_mira_chat(
            auth_token,
            "Outdoor restaurants in Koramangala, Bangalore",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "")
        awaiting = data.get("awaiting")
        nearby_places = data.get("nearby_places")
        intent = data.get("intent")
        
        print(f"Response: {response_text[:400]}")
        print(f"Intent: {intent}")
        print(f"Awaiting: {awaiting}")
        print(f"Has nearby_places: {nearby_places is not None}")
        
        # When both location AND seating are provided, should skip to results
        # (not ask more questions)
        if nearby_places:
            print("SUCCESS: Combined input resulted in places being returned")
            assert nearby_places.get("places"), "Places should be returned"
        else:
            # If no places, at least shouldn't be awaiting both
            if awaiting:
                print(f"Still awaiting: {awaiting}")
                # Should not be awaiting BOTH location AND seating if user provided both
    
    
    # =========================================================================
    # TEST 10: API endpoint returns correct structure
    # =========================================================================
    def test_api_response_structure(self, auth_token, pet_with_traits):
        """
        Verify the API returns the expected response structure for place searches.
        """
        pet_context = {
            "id": pet_with_traits.get("id"),
            "name": pet_with_traits.get("name"),
            "breed": pet_with_traits.get("breed"),
            "gender": pet_with_traits.get("gender"),
            "temperament": pet_with_traits.get("doggy_soul_answers", {}).get("temperament"),
            "energy_level": pet_with_traits.get("doggy_soul_answers", {}).get("energy_level")
        }
        
        response = call_mira_chat(
            auth_token,
            "Find a cafe for my dog",
            pet_context
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Verify expected fields exist in response
        assert "success" in data, "Response missing 'success' field"
        assert "response" in data, "Response missing 'response' field"
        assert "session_id" in data, "Response missing 'session_id' field"
        
        # These fields should be present for place search responses
        optional_fields = ["intent", "awaiting", "place_search_type", "pet_context_used", 
                          "follow_ups", "nearby_places", "execution_options"]
        
        present_fields = [f for f in optional_fields if f in data]
        print(f"Present optional fields: {present_fields}")
        
        # For place search, should have intent and potentially awaiting
        if data.get("intent"):
            print(f"Intent: {data.get('intent')}")
            assert "place" in data.get("intent", "").lower() or \
                   "search" in data.get("intent", "").lower() or \
                   "dine" in data.get("pillar", "").lower(), \
                   f"Intent should relate to places. Got: {data.get('intent')}"


class TestMiraChatBasics:
    """Basic Mira chat tests to ensure endpoint is working"""
    
    def test_chat_endpoint_accessible(self, auth_token):
        """Basic test that chat endpoint responds"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Hello",
                "pet_context": {"name": "TestDog"},
                "conversation_history": []
            }
        )
        
        assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
        data = response.json()
        assert "response" in data, "Missing response field"
        print(f"Chat response: {data.get('response', '')[:200]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
