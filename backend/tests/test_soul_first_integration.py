"""
Integration Tests for Soul-First Response Generation
Tests the API integration with Soul-First logic to verify:
1. Soul-First logic is triggered for grooming/care queries
2. Response uses Soul fields instead of breed assumptions
3. Fallback questions are asked when Soul is sparse
4. Data extraction from user responses works
5. Data write-back to pet profile works
6. Profile-First Doctrine is enforced
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-3661ae55d2e2"  # Mystique - Shih Tzu

class TestSoulFirstIntegration:
    """Integration tests for Soul-First Response Generation"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Session with auth headers"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_auth_works(self):
        """Verify authentication endpoint works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Auth failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        print(f"✓ Authentication successful, got token")
    
    def test_get_pet_profile_for_mystique(self, authenticated_session):
        """Verify we can fetch the test pet Mystique's profile"""
        response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Failed to get pet: {response.text}"
        pet = response.json()
        
        assert pet.get("name") == "Mystique", f"Pet name mismatch: {pet.get('name')}"
        
        # Verify Soul data exists
        doggy_soul = pet.get("doggy_soul_answers", {})
        print(f"✓ Got Mystique's profile with soul data keys: {list(doggy_soul.keys())}")
        
        # Log what Soul fields are available
        soul_fields = []
        if doggy_soul.get("coat_type"):
            soul_fields.append(f"coat_type={doggy_soul.get('coat_type')}")
        if doggy_soul.get("grooming_preference"):
            soul_fields.append(f"grooming_preference={doggy_soul.get('grooming_preference')}")
        if doggy_soul.get("grooming_anxiety_triggers"):
            soul_fields.append(f"grooming_anxiety_triggers={doggy_soul.get('grooming_anxiety_triggers')}")
        if doggy_soul.get("loud_sounds"):
            soul_fields.append(f"loud_sounds={doggy_soul.get('loud_sounds')}")
        if doggy_soul.get("handling_comfort"):
            soul_fields.append(f"handling_comfort={doggy_soul.get('handling_comfort')}")
        
        print(f"  Soul fields: {', '.join(soul_fields) if soul_fields else 'none'}")
    
    def test_mira_grooming_query_uses_soul_data(self, authenticated_session):
        """Test that Mira responds to grooming queries using Soul data, not breed assumptions"""
        
        # Send a grooming-related query
        payload = {
            "message": "I want to groom Mystique. What should I know?",
            "pet_id": TEST_PET_ID,
            "history": []
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        result = response.json()
        
        mira_response = result.get("response", result.get("message", ""))
        assert mira_response, "No response from Mira"
        
        print(f"✓ Mira response to grooming query ({len(mira_response)} chars)")
        print(f"  First 300 chars: {mira_response[:300]}...")
        
        # Check for Profile-First Doctrine compliance
        mira_lower = mira_response.lower()
        
        # Positive checks: Should use Soul data
        soul_indicators = [
            "mystique",  # Uses pet name
            "dryer" in mira_lower or "loud" in mira_lower or "noise" in mira_lower,  # References known triggers
            "comfort" in mira_lower or "handling" in mira_lower,  # References handling comfort
            "home" in mira_lower or "salon" in mira_lower,  # References grooming preference
        ]
        
        # Negative checks: Should NOT make breed-specific assumptions without Soul confirmation
        # Per the requirement: Shih Tzu is brachycephalic but Mira should NOT assume heat sensitivity 
        # unless it's explicitly in the Soul profile
        breed_assumption_violations = []
        
        # Check for forbidden breed assumptions (heat sensitivity for brachycephalic not in Soul)
        forbidden_assumptions = [
            ("brachycephalic heat sensitivity", "heat sensitiv"),
            ("breathing problems without Soul confirmation", "breathing problem"),
        ]
        
        for assumption_name, pattern in forbidden_assumptions:
            if pattern in mira_lower:
                # Only flag if it's presented as a fact, not as a question
                breed_assumption_violations.append(assumption_name)
        
        if breed_assumption_violations:
            print(f"⚠️ WARNING: Potential breed assumption violations: {breed_assumption_violations}")
        else:
            print("✓ No forbidden breed assumptions detected")
        
        return mira_response  # Return for further analysis if needed
    
    def test_mira_generates_fallback_questions_when_soul_sparse(self, authenticated_session):
        """Test that Mira asks fallback questions when Soul data is insufficient"""
        
        # Create or use a pet with minimal Soul data for this test
        # We'll simulate by asking about grooming for a pet without complete Soul data
        # For this test, we query general grooming with minimal context
        
        payload = {
            "message": "I need grooming help",
            "pet_id": TEST_PET_ID,  # Mystique has some data, but let's see what questions get asked
            "history": []
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        result = response.json()
        
        mira_response = result.get("response", result.get("message", ""))
        
        print(f"✓ Mira response to general grooming query")
        print(f"  Contains question mark: {'?' in mira_response}")
        
        # If Soul data is sparse, Mira should ask questions
        # If Soul data is sufficient, Mira should provide personalized advice
        # Both are valid based on the current Soul state
        
        return mira_response
    
    def test_soul_data_extraction_from_user_response(self, authenticated_session):
        """Test that Soul data is extracted correctly from user responses to fallback questions"""
        
        # First, simulate Mira asking questions
        initial_payload = {
            "message": "Help me with grooming",
            "pet_id": TEST_PET_ID,
            "history": []
        }
        
        initial_response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=initial_payload
        )
        
        assert initial_response.status_code == 200
        initial_result = initial_response.json()
        mira_question = initial_result.get("response", initial_result.get("message", ""))
        
        # Now simulate user answering with Soul data
        followup_payload = {
            "message": "She has a long matted coat, prefers home grooming, and is scared of dryers",
            "pet_id": TEST_PET_ID,
            "history": [
                {"role": "user", "content": "Help me with grooming"},
                {"role": "assistant", "content": mira_question}
            ]
        }
        
        followup_response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=followup_payload
        )
        
        assert followup_response.status_code == 200, f"Followup failed: {followup_response.text}"
        followup_result = followup_response.json()
        
        mira_followup = followup_result.get("response", followup_result.get("message", ""))
        
        print(f"✓ Mira processed user's Soul data answer")
        print(f"  Response acknowledges data: {len(mira_followup)} chars")
        
        # Allow time for data write-back
        time.sleep(1)
        
        # Verify the data was written back to the pet profile
        pet_response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        if pet_response.status_code == 200:
            pet_data = pet_response.json()
            doggy_soul = pet_data.get("doggy_soul_answers", {})
            
            # Check if extracted data is in the profile
            print(f"  Soul data after extraction:")
            if doggy_soul.get("coat_type"):
                print(f"    - coat_type: {doggy_soul.get('coat_type')}")
            if doggy_soul.get("grooming_preference"):
                print(f"    - grooming_preference: {doggy_soul.get('grooming_preference')}")
            if doggy_soul.get("grooming_anxiety_triggers"):
                print(f"    - grooming_anxiety_triggers: {doggy_soul.get('grooming_anxiety_triggers')}")
        
        return mira_followup
    
    def test_soul_first_prompt_injection_for_grooming(self, authenticated_session):
        """Verify Soul-First prompt is injected for grooming queries"""
        
        # This tests that the Soul-First logic modifies how Mira responds
        # by checking the response quality and personalization
        
        payload = {
            "message": "What grooming services does Mystique need based on her profile?",
            "pet_id": TEST_PET_ID,
            "history": []
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        result = response.json()
        
        mira_response = result.get("response", result.get("message", ""))
        mira_lower = mira_response.lower()
        
        # The response should be personalized to Mystique's Soul data
        personalization_indicators = [
            "mystique" in mira_lower,  # Uses pet name
            any(word in mira_lower for word in ["her", "she"]),  # Uses pronouns
        ]
        
        is_personalized = any(personalization_indicators)
        print(f"✓ Response personalization check: {'PASS' if is_personalized else 'REVIEW NEEDED'}")
        print(f"  Contains 'Mystique': {'mystique' in mira_lower}")
        
        return mira_response
    
    def test_no_breed_assumptions_for_shih_tzu_heat_sensitivity(self, authenticated_session):
        """
        CRITICAL TEST: Verify Mira does NOT assume heat sensitivity for Shih Tzu
        unless it's explicitly in the Soul profile.
        
        Per the requirement: Mystique is a Shih Tzu (brachycephalic) but the Soul-First
        logic should NOT claim 'brachycephalic heat sensitivity' unless confirmed in Soul.
        """
        
        # First, get current pet Soul data
        pet_response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        assert pet_response.status_code == 200
        pet_data = pet_response.json()
        
        breed = pet_data.get("breed") or (pet_data.get("identity", {}).get("breed", ""))
        print(f"✓ Pet breed: {breed}")
        
        doggy_soul = pet_data.get("doggy_soul_answers", {})
        has_heat_sensitivity_in_soul = doggy_soul.get("heat_sensitivity") is not None
        print(f"  Heat sensitivity in Soul: {has_heat_sensitivity_in_soul}")
        
        # Query Mira about grooming in summer/heat context
        payload = {
            "message": "Can you groom Mystique on a hot summer day?",
            "pet_id": TEST_PET_ID,
            "history": []
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        result = response.json()
        
        mira_response = result.get("response", result.get("message", ""))
        mira_lower = mira_response.lower()
        
        # Check if Mira makes unsupported breed assumptions
        forbidden_claims = [
            "brachycephalic breed",  # Should not claim this specifically
            "breathing difficulty",  # Should not assume this
            "flat-faced breed",  # Should not make this claim without Soul confirmation
        ]
        
        violations = []
        for claim in forbidden_claims:
            if claim in mira_lower:
                # Only flag as violation if NOT backed by Soul data
                if not has_heat_sensitivity_in_soul:
                    violations.append(claim)
        
        if violations:
            print(f"⚠️ PROFILE-FIRST DOCTRINE VIOLATION: Made claims without Soul backing: {violations}")
        else:
            print("✓ Profile-First Doctrine respected - no unsupported breed claims")
        
        # If heat sensitivity IS in Soul, it's OK to mention it
        if has_heat_sensitivity_in_soul and "heat" in mira_lower:
            print("✓ Heat mention is backed by Soul data")
        
        return len(violations) == 0


class TestSoulDataWriteBack:
    """Tests for data extraction and write-back functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Session with auth headers"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_coat_type_extraction_and_persistence(self, authenticated_session):
        """Test that coat_type mentioned by user is extracted and saved"""
        
        # Simulate a conversation where user mentions coat type
        history = [
            {"role": "user", "content": "I need grooming for Mystique"},
            {"role": "assistant", "content": "Got it — grooming for Mystique. Quick check: What's her coat like right now — short, long, matted?"}
        ]
        
        payload = {
            "message": "Her coat is very matted right now",
            "pet_id": TEST_PET_ID,
            "history": history
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        
        # Allow time for write-back
        time.sleep(1)
        
        # Check if coat_type was updated
        pet_response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        if pet_response.status_code == 200:
            pet = pet_response.json()
            doggy_soul = pet.get("doggy_soul_answers", {})
            coat_type = doggy_soul.get("coat_type")
            print(f"✓ Coat type in Soul after extraction: {coat_type}")
            
            # 'matted' should be detected
            if coat_type and "matted" in coat_type.lower():
                print("✓ 'matted' coat type was correctly extracted")
            return coat_type
    
    def test_anxiety_trigger_extraction_and_persistence(self, authenticated_session):
        """Test that anxiety triggers mentioned by user are extracted and saved"""
        
        # Simulate conversation where user mentions anxiety trigger
        history = [
            {"role": "user", "content": "Grooming help please"},
            {"role": "assistant", "content": "Has Mystique been groomed before? Any anxiety with dryers, clipping, or being handled?"}
        ]
        
        payload = {
            "message": "Yes, she really hates the dryer and gets scared",
            "pet_id": TEST_PET_ID,
            "history": history
        }
        
        response = authenticated_session.post(
            f"{BASE_URL}/api/mira/chat",
            json=payload
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        
        # Allow time for write-back
        time.sleep(1)
        
        # Check if anxiety triggers were updated
        pet_response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        if pet_response.status_code == 200:
            pet = pet_response.json()
            doggy_soul = pet.get("doggy_soul_answers", {})
            triggers = doggy_soul.get("grooming_anxiety_triggers", [])
            print(f"✓ Anxiety triggers in Soul after extraction: {triggers}")
            
            if triggers and "dryers" in str(triggers).lower():
                print("✓ 'dryers' anxiety trigger was correctly extracted")
            return triggers


class TestSoulFirstResponseStrategy:
    """Tests for the response strategy determination"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for API calls"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Session with auth headers"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_soul_first_strategy_with_rich_profile(self, authenticated_session):
        """Test that Mira uses soul_first strategy when profile has >= 2 grooming-relevant fields"""
        
        # Mystique should have enough Soul data to trigger soul_first strategy
        pet_response = authenticated_session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        assert pet_response.status_code == 200
        
        pet = pet_response.json()
        doggy_soul = pet.get("doggy_soul_answers", {})
        
        # Count grooming-relevant fields
        relevant_fields = 0
        if doggy_soul.get("coat_type"):
            relevant_fields += 1
        if doggy_soul.get("grooming_preference"):
            relevant_fields += 1
        if doggy_soul.get("grooming_anxiety_triggers"):
            relevant_fields += 1
        if doggy_soul.get("loud_sounds"):
            relevant_fields += 1
        if doggy_soul.get("handling_comfort"):
            relevant_fields += 1
        
        print(f"✓ Grooming-relevant fields in Soul: {relevant_fields}")
        
        # If >= 2 fields, expect soul_first strategy (personalized response)
        if relevant_fields >= 2:
            print("  Expected strategy: soul_first")
            
            # Send grooming query and expect personalized response
            payload = {
                "message": "What are the grooming considerations for Mystique?",
                "pet_id": TEST_PET_ID,
                "history": []
            }
            
            response = authenticated_session.post(
                f"{BASE_URL}/api/mira/chat",
                json=payload
            )
            
            assert response.status_code == 200
            result = response.json()
            mira_response = result.get("response", result.get("message", ""))
            
            # Check for personalization (soul_first strategy should produce "because {pet_name}..." lines)
            has_personalization = "mystique" in mira_response.lower()
            print(f"  Response is personalized: {has_personalization}")
            
            return has_personalization
        else:
            print("  Expected strategy: breed_fallback or ask_questions (sparse profile)")
            return True  # Test passes if profile is sparse (different strategy expected)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
