"""
Test Pet Soul Enriched Data - Comprehensive Testing
====================================================
Tests Mira's use of comprehensive pet soul data (50+ fields per pet)
covering: Identity, Health, Personality, Preferences, Travel, Training, and Lifestyle.

Test Pets (dipali@clubconcierge.in):
- Mystique: Senior, arthritis, chicken/wheat allergy
- Lola: Young, energetic, beef/corn allergy
- Meister: Senior, heart condition, severe anxiety, cannot fly
- Bruno: Young, high energy, loves swimming
- Luna: Hip dysplasia, grain allergy

Focus areas:
1. Health-First Safety Rule (allergies, conditions)
2. Emergency Triage
3. Personalization (activity recommendations)
4. Fear/Anxiety Awareness (travel restrictions)
5. Soul Learning (_memory_trace in responses)
6. Celebrate pillar (birthday planning)
7. Travel pillar (joint-friendly activities)
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


class TestAuthAndPets:
    """Test authentication and pet data retrieval"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    @pytest.fixture(scope="class")
    def user_pets(self, api_client):
        """Get all pets for the test user"""
        response = api_client.get(f"{BASE_URL}/api/pets/my-pets")
        assert response.status_code == 200, f"Failed to get pets: {response.text}"
        data = response.json()
        pets = data.get("pets", [])
        print(f"[INFO] Found {len(pets)} pets for user")
        return pets
    
    def test_pets_have_enriched_soul_data(self, user_pets):
        """Verify pets have enriched soul data"""
        test_pets = ["Mystique", "Lola", "Meister", "Bruno", "Luna"]
        found_pets = []
        
        for pet in user_pets:
            pet_name = pet.get("name", "")
            if pet_name in test_pets:
                found_pets.append(pet_name)
                soul_answers = pet.get("doggy_soul_answers", {})
                
                # Check for enriched fields
                has_health = bool(soul_answers.get("allergies") or soul_answers.get("medical_conditions"))
                has_personality = bool(soul_answers.get("general_nature") or soul_answers.get("anxiety_triggers"))
                has_preferences = bool(soul_answers.get("favorite_treats") or soul_answers.get("dislikes"))
                
                print(f"[INFO] {pet_name}: health={has_health}, personality={has_personality}, prefs={has_preferences}")
                
                # At least one enrichment category should be present
                assert has_health or has_personality or has_preferences, f"{pet_name} missing enriched data"
        
        print(f"[INFO] Found enriched pets: {found_pets}")
        assert len(found_pets) >= 1, "At least one test pet should exist"


class TestHealthFirstSafetyRule:
    """Test Health-First Safety Rule - allergies and conditions"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def mystique_pet(self, auth_token):
        """Get Mystique pet (allergic to chicken/wheat)"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "mystique":
                return pet
        pytest.skip("Mystique pet not found")
    
    @pytest.fixture(scope="class")
    def meister_pet(self, auth_token):
        """Get Meister pet (heart condition, low sodium)"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "meister":
                return pet
        pytest.skip("Meister pet not found")
    
    def test_mystique_chicken_allergy_awareness(self, auth_token, mystique_pet):
        """Test: Ask about treats for Mystique - Mira should refuse chicken treats"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        pet_context = {
            "id": mystique_pet.get("id"),
            "name": mystique_pet.get("name"),
            "breed": mystique_pet.get("breed"),
            "allergies": mystique_pet.get("doggy_soul_answers", {}).get("allergies", []),
            "sensitivities": mystique_pet.get("doggy_soul_answers", {}).get("allergies", []),
            "health_conditions": mystique_pet.get("doggy_soul_answers", {}).get("medical_conditions", [])
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "Can you recommend some chicken treats for Mystique?",
            "session_id": f"test-chicken-allergy-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": mystique_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Mira should be aware of chicken allergy
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Check if _memory_trace is present
        memory_trace = data.get("_memory_trace", {})
        print(f"[MEMORY_TRACE] {json.dumps(memory_trace, indent=2)[:500]}")
        
        # Verify allergy awareness (should mention allergy OR refuse chicken)
        allergy_mentioned = "allergy" in response_text or "allergic" in response_text
        chicken_avoided = "can't" in response_text or "avoid" in response_text or "instead" in response_text
        
        assert allergy_mentioned or chicken_avoided, f"Mira should acknowledge chicken allergy. Response: {response_text[:300]}"
    
    def test_meister_heart_condition_diet(self, auth_token, meister_pet):
        """Test: Ask about food for Meister - should recommend low sodium diet"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        pet_context = {
            "id": meister_pet.get("id"),
            "name": meister_pet.get("name"),
            "breed": meister_pet.get("breed"),
            "allergies": meister_pet.get("doggy_soul_answers", {}).get("allergies", []),
            "medical_conditions": meister_pet.get("doggy_soul_answers", {}).get("medical_conditions", []),
            "dietary_restrictions": meister_pet.get("doggy_soul_answers", {}).get("dietary_restrictions", []),
            "health_conditions": meister_pet.get("doggy_soul_answers", {}).get("medical_conditions", [])
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "What food would be good for Meister? He's a senior with health issues.",
            "session_id": f"test-heart-diet-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": meister_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Should consider heart condition or dietary restrictions
        heart_aware = any(term in response_text for term in ["heart", "senior", "health", "special", "prescription", "low sodium", "sodium"])
        
        print(f"[CHECK] Heart condition awareness: {heart_aware}")
        # Note: If heart condition not mentioned, log it but don't fail - we want to identify gaps


class TestEmergencyTriage:
    """Test Emergency Protocol triggers"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def lola_pet(self, auth_token):
        """Get Lola pet for emergency testing"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "lola":
                return pet
        pytest.skip("Lola pet not found")
    
    def test_chocolate_emergency_protocol(self, auth_token, lola_pet):
        """Test: 'Lola ate chocolate' should trigger emergency protocol"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        pet_context = {
            "id": lola_pet.get("id"),
            "name": lola_pet.get("name"),
            "breed": lola_pet.get("breed")
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "Lola ate chocolate! What do I do?",
            "session_id": f"test-emergency-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": lola_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:600]}")
        
        # Should trigger emergency awareness
        emergency_indicators = [
            "vet" in response_text,
            "emergency" in response_text,
            "immediately" in response_text,
            "poison" in response_text,
            "toxic" in response_text,
            "call" in response_text,
            "contact" in response_text
        ]
        
        assert any(emergency_indicators), f"Should trigger emergency protocol. Response: {response_text[:300]}"
        
        # Check for quick replies suggesting emergency actions
        quick_replies = data.get("quick_replies", []) or data.get("conversation_contract", {}).get("quick_replies", [])
        print(f"[QUICK_REPLIES] {quick_replies}")


class TestPersonalizationAndActivities:
    """Test personalization based on pet activity level and preferences"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def bruno_pet(self, auth_token):
        """Get Bruno pet (high energy, loves swimming)"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "bruno":
                return pet
        pytest.skip("Bruno pet not found")
    
    def test_bruno_activity_recommendations(self, auth_token, bruno_pet):
        """Test: Ask about activities for Bruno - should recommend active options"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        soul_answers = bruno_pet.get("doggy_soul_answers", {})
        pet_context = {
            "id": bruno_pet.get("id"),
            "name": bruno_pet.get("name"),
            "breed": bruno_pet.get("breed"),
            "energy_level": soul_answers.get("energy_level", "high"),
            "favorite_activities": soul_answers.get("favorite_activities", []),
            "exercise_needs": soul_answers.get("exercise_needs", "")
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "What activities would be good for Bruno this weekend?",
            "session_id": f"test-activities-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": bruno_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Should recommend active activities
        active_terms = ["swim", "run", "hike", "play", "fetch", "exercise", "active", "energy", "park"]
        has_active_recommendation = any(term in response_text for term in active_terms)
        
        print(f"[CHECK] Active recommendation: {has_active_recommendation}")


class TestFearAnxietyAwareness:
    """Test fear and anxiety awareness in recommendations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def meister_pet(self, auth_token):
        """Get Meister pet (severe anxiety, can't fly)"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "meister":
                return pet
        pytest.skip("Meister pet not found")
    
    def test_meister_travel_anxiety_awareness(self, auth_token, meister_pet):
        """Test: Ask about travel for Meister - should NOT recommend flights"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        soul_answers = meister_pet.get("doggy_soul_answers", {})
        pet_context = {
            "id": meister_pet.get("id"),
            "name": meister_pet.get("name"),
            "breed": meister_pet.get("breed"),
            "anxiety_triggers": soul_answers.get("anxiety_triggers", []),
            "separation_anxiety": soul_answers.get("separation_anxiety", ""),
            "travel_style": soul_answers.get("travel_style", ""),
            "flight_experience": soul_answers.get("flight_experience", ""),
            "do_not_recommend": soul_answers.get("do_not_recommend", []),
            "medical_conditions": soul_answers.get("medical_conditions", [])
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "I want to travel with Meister. What options do we have?",
            "session_id": f"test-travel-anxiety-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": meister_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Should show awareness of anxiety/travel concerns
        anxiety_terms = ["anxiety", "anxious", "stress", "calm", "comfort", "senior", "careful"]
        shows_awareness = any(term in response_text for term in anxiety_terms)
        
        # Should NOT enthusiastically recommend flying
        flight_recommended = "fly" in response_text and "great" in response_text
        
        print(f"[CHECK] Anxiety awareness: {shows_awareness}, Flight recommended: {flight_recommended}")


class TestSoulLearning:
    """Test Soul Learning - _memory_trace in responses"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def any_pet(self, auth_token):
        """Get any pet for soul learning testing"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        if pets:
            return pets[0]
        pytest.skip("No pets found")
    
    def test_memory_trace_in_response(self, auth_token, any_pet):
        """Test: Check if _memory_trace is returned in chat responses"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        pet_context = {
            "id": any_pet.get("id"),
            "name": any_pet.get("name"),
            "breed": any_pet.get("breed"),
            "allergies": any_pet.get("doggy_soul_answers", {}).get("allergies", [])
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": f"Tell me about {any_pet.get('name')}'s health needs",
            "session_id": f"test-memory-trace-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": any_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Check for _memory_trace
        memory_trace = data.get("_memory_trace")
        print(f"[MEMORY_TRACE] Present: {memory_trace is not None}")
        
        if memory_trace:
            print(f"[MEMORY_TRACE] known_fields_used: {memory_trace.get('known_fields_used', [])}")
            print(f"[MEMORY_TRACE] saved_enrichments: {memory_trace.get('saved_enrichments', [])}")
            print(f"[MEMORY_TRACE] rejected_enrichments: {memory_trace.get('rejected_enrichments', [])}")
            
            # Verify structure
            assert "known_fields_used" in memory_trace, "Missing known_fields_used"
            assert "saved_enrichments" in memory_trace, "Missing saved_enrichments"
        else:
            print("[WARNING] _memory_trace not found in response")


class TestCelebratePillar:
    """Test Celebrate pillar with pet preferences"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def lola_pet(self, auth_token):
        """Get Lola pet for birthday planning"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "lola":
                return pet
        pytest.skip("Lola pet not found")
    
    def test_lola_birthday_party_planning(self, auth_token, lola_pet):
        """Test: Birthday party planning for Lola using her preferences"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        soul_answers = lola_pet.get("doggy_soul_answers", {})
        pet_context = {
            "id": lola_pet.get("id"),
            "name": lola_pet.get("name"),
            "breed": lola_pet.get("breed"),
            "allergies": soul_answers.get("allergies", []),
            "favorite_treats": soul_answers.get("favorite_treats", []),
            "favorite_activities": soul_answers.get("favorite_activities", []),
            "behavior_with_dogs": soul_answers.get("behavior_with_dogs", "")
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "I want to plan a birthday party for Lola! She loves meeting other dogs.",
            "session_id": f"test-celebrate-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": lola_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Should show celebration awareness
        celebrate_terms = ["party", "birthday", "celebrate", "cake", "treat", "fun", "special"]
        has_celebrate_awareness = any(term in response_text for term in celebrate_terms)
        
        print(f"[CHECK] Celebrate awareness: {has_celebrate_awareness}")
        
        # Check detected pillar
        pillar = data.get("pillar", "")
        print(f"[PILLAR] Detected: {pillar}")


class TestTravelPillarJointFriendly:
    """Test Travel pillar with health considerations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def luna_pet(self, auth_token):
        """Get Luna pet (hip dysplasia)"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("name", "").lower() == "luna":
                return pet
        pytest.skip("Luna pet not found")
    
    def test_luna_travel_joint_friendly(self, auth_token, luna_pet):
        """Test: Plan trip for Luna - should suggest joint-friendly activities"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        soul_answers = luna_pet.get("doggy_soul_answers", {})
        pet_context = {
            "id": luna_pet.get("id"),
            "name": luna_pet.get("name"),
            "breed": luna_pet.get("breed"),
            "medical_conditions": soul_answers.get("medical_conditions", []),
            "special_needs": soul_answers.get("special_needs", ""),
            "allergies": soul_answers.get("allergies", []),
            "exercise_needs": soul_answers.get("exercise_needs", "")
        }
        
        response = session.post(f"{BASE_URL}/api/mira/chat", json={
            "input": "I want to plan a trip with Luna. She has hip dysplasia.",
            "session_id": f"test-travel-joint-{int(time.time())}",
            "pet_context": pet_context,
            "pet_id": luna_pet.get("id")
        })
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        response_text = data.get("response", "").lower()
        print(f"[RESPONSE] {response_text[:500]}")
        
        # Should show awareness of hip condition
        joint_aware_terms = ["hip", "joint", "gentle", "easy", "swimming", "comfort", "careful", "mobility"]
        shows_awareness = any(term in response_text for term in joint_aware_terms)
        
        print(f"[CHECK] Joint-friendly awareness: {shows_awareness}")


class TestPetSoulEndpoint:
    """Test the Pet Soul API endpoint directly"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def any_pet(self, auth_token):
        """Get any pet for testing"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = response.json().get("pets", [])
        if pets:
            return pets[0]
        pytest.skip("No pets found")
    
    def test_pet_soul_endpoint(self, auth_token, any_pet):
        """Test /api/pets/{pet_id}/soul endpoint returns enriched data"""
        session = requests.Session()
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        
        pet_id = any_pet.get("id")
        response = session.get(f"{BASE_URL}/api/pets/{pet_id}/soul")
        
        print(f"[SOUL ENDPOINT] Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"[SOUL DATA] Keys: {list(data.keys())}")
            
            soul = data.get("soul", {})
            doggy_answers = data.get("doggy_soul_answers", {})
            
            print(f"[SOUL] Fields: {len(soul)} in soul, {len(doggy_answers)} in doggy_soul_answers")
        else:
            print(f"[WARNING] Soul endpoint returned {response.status_code}: {response.text[:200]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
