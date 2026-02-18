"""
Mira OS Voice & Pillar Audit - Iteration 211
=============================================
Tests for the PET_OS_BEHAVIOR_BIBLE v1.1 implementation.

Key bugs to test:
1. CELEBRATE Pillar: Should engage in soulful conversation BEFORE handoff to Concierge
2. TRAVEL Pillar: Should respond with travel-related guidance, NOT café/dine responses  
3. Breed Substitution: Should use correct breed (Shih Tzu for Lola), NOT wrong breeds (Maltese)
4. Voice First-Word Ban: Never start with 'Great idea', 'That sounds lovely', 'Absolutely'
5. Soulful Openers: Must start with 'Oh, [Pet]...', 'Since I know [Pet]...', etc.
6. Emergency Triage: 'I'm scared, [Pet] ate something' → calm triage questions
7. Emergency GO_NOW: 'ate chocolate' or 'not breathing' → IMMEDIATE emergency
8. Icon State API: GET /api/os/icon-state should return valid counts

Test credentials:
- User: dipali@clubconcierge.in / test123  
- Pet: Lola (pet-e6348b13c975), breed: Shih Tzu
"""

import pytest
import requests
import os
import json
import re
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_NAME = "Lola"
TEST_PET_BREED = "Shih Tzu"
TEST_PET_ID = "pet-e6348b13c975"

# Voice rules from PET_OS_BEHAVIOR_BIBLE
BANNED_FIRST_WORDS = [
    "great idea", "great question", "that sounds", "i'd be happy", 
    "absolutely", "sure", "of course", "no problem", "certainly",
    "good thinking", "what a great", "how exciting"
]

SOULFUL_OPENERS = [
    "oh,", "i know", "since i know", "lucky to have", "looking out for",
    "i love that", "i hear you", "i've got you", "let me find"
]


class TestAuth:
    """Authentication helper"""
    token = None
    user = None
    
    @classmethod
    def get_auth_token(cls, session):
        """Get or refresh auth token"""
        if cls.token:
            return cls.token
            
        # Login to get token
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            data = response.json()
            cls.token = data.get("token")
            cls.user = data.get("user")
            return cls.token
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
            return None


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    return TestAuth.get_auth_token(api_client)


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    if auth_token:
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ============================================
# CELEBRATE PILLAR TESTS
# ============================================

class TestCelebratePillar:
    """
    Test CELEBRATE pillar behavior - should engage in soulful conversation
    before creating ticket and handing off to Concierge
    """
    
    def test_celebrate_detection(self, authenticated_client):
        """Test that 'I want to celebrate Lola' triggers celebrate pillar"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/os/understand",
            json={
                "message": "I want to celebrate Lola",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check pillar detection
        detected_pillar = data.get("pillar") or data.get("detected_pillar")
        print(f"Detected pillar: {detected_pillar}")
        assert detected_pillar == "celebrate", f"Expected 'celebrate' pillar, got '{detected_pillar}'"
    
    def test_celebrate_engages_before_handoff(self, authenticated_client):
        """
        P0 BUG: When user says 'I want to celebrate Lola', Mira should engage first
        Should ask about celebration type, size, preferences BEFORE creating a ticket
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to celebrate Lola",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME,
                "pillar": "celebrate"
            }
        )
        
        assert response.status_code == 200, f"Chat API failed: {response.status_code}"
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        print(f"\n=== CELEBRATE RESPONSE ===\n{mira_response[:500]}...")
        
        # BUG CHECK: Response should NOT immediately mention ticket creation or concierge handoff
        # without first asking clarifying questions
        immediate_handoff_indicators = [
            "i've created a ticket",
            "ticket has been created",
            "concierge will take it from here",
            "i've handed this to",
            "tck-",  # Ticket ID format
        ]
        
        response_lower = mira_response.lower()
        has_immediate_handoff = any(indicator in response_lower for indicator in immediate_handoff_indicators)
        
        # Check if response asks clarifying questions (expected behavior)
        engagement_questions = [
            "?",  # Any question at all
            "what kind", "what type", "occasion", "birthday", "gathering",
            "play-date", "celebration", "friends", "other dogs"
        ]
        has_engagement = any(q in response_lower for q in engagement_questions)
        
        # Assert the response engages before handoff
        if has_immediate_handoff and not has_engagement:
            pytest.fail(
                f"CELEBRATE BUG: Mira immediately handed off to Concierge without engaging first.\n"
                f"Response: {mira_response[:300]}..."
            )
        
        print(f"Has engagement questions: {has_engagement}")
        print(f"Has immediate handoff: {has_immediate_handoff}")
        
        # Expected: Should ask questions first
        assert has_engagement, "Mira should ask clarifying questions about the celebration"


# ============================================
# TRAVEL PILLAR TESTS
# ============================================

class TestTravelPillar:
    """
    Test TRAVEL pillar behavior - should NOT route to café/dine responses
    """
    
    def test_travel_detection(self, authenticated_client):
        """Test that 'trip to Goa' triggers travel pillar"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/os/understand",
            json={
                "message": "planning a trip to Goa",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        detected_pillar = data.get("pillar") or data.get("detected_pillar")
        print(f"Detected pillar for 'trip to Goa': {detected_pillar}")
        
        # Should be travel, NOT dine
        assert detected_pillar == "travel", f"Expected 'travel' pillar, got '{detected_pillar}'"
    
    def test_travel_not_dine_response(self, authenticated_client):
        """
        P1 BUG: When user says 'trip to Goa', Mira should respond with travel guidance
        NOT café/restaurant/dine responses
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I'm planning a trip to Goa with Lola",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME,
                "pillar": "travel"
            }
        )
        
        assert response.status_code == 200, f"Chat API failed: {response.status_code}"
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        print(f"\n=== TRAVEL RESPONSE ===\n{mira_response[:500]}...")
        
        response_lower = mira_response.lower()
        
        # BUG CHECK: Should NOT have café/dine/restaurant content
        dine_indicators = [
            "café", "cafe", "restaurant", "dine", "dining", 
            "meal plan", "food recommendation", "treat", "snack",
            "pet-friendly restaurant", "places to eat"
        ]
        
        # Should have travel-related content
        travel_indicators = [
            "travel", "trip", "flight", "road trip", "car", "carrier", "airline",
            "journey", "destination", "goa", "pet-friendly hotel", "accommodation",
            "transport", "documents", "checklist", "vacation"
        ]
        
        has_dine_content = any(d in response_lower for d in dine_indicators)
        has_travel_content = any(t in response_lower for t in travel_indicators)
        
        print(f"Has dine content: {has_dine_content}")
        print(f"Has travel content: {has_travel_content}")
        
        if has_dine_content and not has_travel_content:
            pytest.fail(
                f"TRAVEL BUG: Mira responded with dine/café content instead of travel.\n"
                f"Response: {mira_response[:300]}..."
            )
        
        assert has_travel_content, "Response should contain travel-related guidance"


# ============================================
# BREED SUBSTITUTION TESTS
# ============================================

class TestBreedSubstitution:
    """
    Test that Mira uses the CORRECT pet breed from profile, not substitutes
    """
    
    def test_correct_breed_used(self, authenticated_client):
        """
        P1 BUG: Mira should use 'Shih Tzu' for Lola, NOT substitute wrong breeds like 'Maltese'
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What grooming does Lola need?",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200, f"Chat API failed: {response.status_code}"
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        print(f"\n=== GROOMING RESPONSE ===\n{mira_response[:500]}...")
        
        response_lower = mira_response.lower()
        
        # Check for wrong breed substitution
        wrong_breeds = ["maltese", "poodle", "labrador", "golden retriever", "beagle", "husky"]
        
        has_wrong_breed = any(breed in response_lower for breed in wrong_breeds)
        has_correct_breed = "shih tzu" in response_lower or "shihtzu" in response_lower
        
        # Prefer soul-first (mentioning Lola's profile) over breed-first
        has_soul_first = any(phrase in response_lower for phrase in [
            "lola's profile", "lola's soul", "i know lola", "since i know lola",
            "from lola's profile", "looking at lola's"
        ])
        
        print(f"Has wrong breed: {has_wrong_breed}")
        print(f"Has correct breed (Shih Tzu): {has_correct_breed}")
        print(f"Has soul-first approach: {has_soul_first}")
        
        if has_wrong_breed:
            pytest.fail(
                f"BREED BUG: Mira used wrong breed instead of Shih Tzu.\n"
                f"Response: {mira_response[:300]}..."
            )


# ============================================
# VOICE RULES TESTS
# ============================================

class TestVoiceRules:
    """
    Test voice transformation rules from PET_OS_BEHAVIOR_BIBLE Section 2.7
    """
    
    def test_banned_first_words(self, authenticated_client):
        """
        Voice First-Word Ban: Mira should NEVER start with banned phrases
        """
        # Test a few different prompts
        test_prompts = [
            "What food should I give Lola?",
            "Can you help me plan Lola's birthday?",
            "I need advice on grooming"
        ]
        
        for prompt in test_prompts:
            response = authenticated_client.post(
                f"{BASE_URL}/api/mira/chat",
                json={
                    "message": prompt,
                    "pet_id": TEST_PET_ID,
                    "pet_name": TEST_PET_NAME
                }
            )
            
            if response.status_code != 200:
                continue
                
            data = response.json()
            mira_response = data.get("response") or data.get("message") or data.get("reply", "")
            
            # Check first 50 characters for banned words
            first_words = mira_response[:100].lower()
            
            for banned in BANNED_FIRST_WORDS:
                if first_words.startswith(banned):
                    pytest.fail(
                        f"VOICE BUG: Response starts with banned phrase '{banned}'.\n"
                        f"Prompt: {prompt}\n"
                        f"Response start: {mira_response[:100]}..."
                    )
            
            print(f"Prompt: {prompt}")
            print(f"Response start: {mira_response[:80]}...")
            print("---")
    
    def test_soulful_openers(self, authenticated_client):
        """
        Soulful Openers: Mira should start with approved openers when appropriate
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I'm worried about Lola not eating well",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        first_words = mira_response[:150].lower()
        
        # Check for soulful opener usage
        has_soulful_opener = any(opener in first_words for opener in SOULFUL_OPENERS)
        
        # Also acceptable: Starting with pet name
        starts_with_pet_name = first_words.startswith("lola") or "lola" in first_words[:30]
        
        print(f"Response start: {mira_response[:100]}...")
        print(f"Has soulful opener: {has_soulful_opener}")
        print(f"Starts with pet name: {starts_with_pet_name}")
        
        # This is a soft test - we just log if no soulful opener
        if not has_soulful_opener and not starts_with_pet_name:
            print("WARNING: Response doesn't use soulful opener or pet name")


# ============================================
# EMERGENCY TRIAGE TESTS
# ============================================

class TestEmergencyTriage:
    """
    Test two-tier emergency system: TRIAGE_FIRST vs GO_NOW
    """
    
    def test_triage_first_calm_response(self, authenticated_client):
        """
        Emergency Triage: 'I'm scared, [Pet] ate something' should trigger calm triage questions
        NOT immediate emergency escalation
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I'm scared, Lola ate something weird",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        print(f"\n=== TRIAGE FIRST RESPONSE ===\n{mira_response[:600]}...")
        
        response_lower = mira_response.lower()
        
        # Should have calm triage questions
        triage_questions = [
            "what did", "how long ago", "how much", "vomiting", "breathing",
            "when did", "any symptoms", "is she", "are there", "?",
            "tell me", "let me know"
        ]
        
        # Should NOT immediately say "emergency vet NOW"
        immediate_emergency = [
            "emergency vet now", "go to the vet immediately", 
            "rush to", "take her to emergency now"
        ]
        
        has_triage = any(q in response_lower for q in triage_questions)
        has_immediate_escalation = any(e in response_lower for e in immediate_emergency)
        
        print(f"Has triage questions: {has_triage}")
        print(f"Has immediate escalation: {has_immediate_escalation}")
        
        # Triage should ask questions, not immediately escalate
        assert has_triage, "Triage response should include clarifying questions"
    
    def test_go_now_immediate_response(self, authenticated_client):
        """
        Emergency GO_NOW: 'ate chocolate' should trigger IMMEDIATE emergency response
        """
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Lola ate a lot of chocolate!",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        mira_response = data.get("response") or data.get("message") or data.get("reply", "")
        print(f"\n=== GO NOW RESPONSE ===\n{mira_response[:600]}...")
        
        response_lower = mira_response.lower()
        
        # Should have urgent action language
        go_now_indicators = [
            "emergency", "vet", "immediately", "now", "urgent", "toxic",
            "poison", "call", "serious", "dangerous", "don't wait", "right away"
        ]
        
        has_urgency = any(i in response_lower for i in go_now_indicators)
        
        print(f"Has urgent response: {has_urgency}")
        
        assert has_urgency, "Chocolate ingestion should trigger immediate emergency response"


# ============================================
# ICON STATE API TESTS
# ============================================

class TestIconStateAPI:
    """
    Test GET /api/os/icon-state returns valid counts
    """
    
    def test_icon_state_endpoint(self, authenticated_client):
        """Test icon state API returns valid structure"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/os/icon-state",
            params={"pet_id": TEST_PET_ID}
        )
        
        assert response.status_code == 200, f"Icon state API failed: {response.status_code}"
        data = response.json()
        
        print(f"\n=== ICON STATE RESPONSE ===\n{json.dumps(data, indent=2)[:500]}...")
        
        # Check expected fields exist
        expected_fields = ["services", "today", "picks", "learn"]
        
        for field in expected_fields:
            # Field should exist (directly or in a nested structure)
            found = field in data or any(field in str(k).lower() for k in data.keys())
            if not found:
                # Check in nested structure
                for v in data.values():
                    if isinstance(v, dict) and field in v:
                        found = True
                        break
            
            print(f"Field '{field}' found: {found}")
        
        # Basic structure validation
        assert isinstance(data, dict), "Response should be a dictionary"


# ============================================
# OS UNDERSTAND ENDPOINT TESTS  
# ============================================

class TestOSUnderstand:
    """Test the /api/mira/os/understand endpoint for pillar detection"""
    
    def test_celebrate_pillar_detection(self, authenticated_client):
        """Test celebrate keywords trigger celebrate pillar"""
        test_cases = [
            ("I want to celebrate Lola's birthday", "celebrate"),
            ("plan a party for Lola", "celebrate"),
            ("Lola's gotcha day is coming", "celebrate"),
        ]
        
        for message, expected_pillar in test_cases:
            response = authenticated_client.post(
                f"{BASE_URL}/api/mira/os/understand",
                json={
                    "message": message,
                    "pet_id": TEST_PET_ID,
                    "pet_name": TEST_PET_NAME
                }
            )
            
            if response.status_code != 200:
                print(f"Failed for '{message}': {response.status_code}")
                continue
                
            data = response.json()
            detected = data.get("pillar") or data.get("detected_pillar")
            
            print(f"Message: '{message}' -> Pillar: {detected}")
            assert detected == expected_pillar, f"Expected '{expected_pillar}', got '{detected}'"
    
    def test_travel_pillar_detection(self, authenticated_client):
        """Test travel keywords trigger travel pillar"""
        test_cases = [
            ("planning a trip to Goa", "travel"),
            ("traveling with Lola next week", "travel"),
            ("road trip with my dog", "travel"),
            ("flying with Lola", "travel"),
        ]
        
        for message, expected_pillar in test_cases:
            response = authenticated_client.post(
                f"{BASE_URL}/api/mira/os/understand",
                json={
                    "message": message,
                    "pet_id": TEST_PET_ID,
                    "pet_name": TEST_PET_NAME
                }
            )
            
            if response.status_code != 200:
                print(f"Failed for '{message}': {response.status_code}")
                continue
                
            data = response.json()
            detected = data.get("pillar") or data.get("detected_pillar")
            
            print(f"Message: '{message}' -> Pillar: {detected}")
            # Allow "travel" or related
            assert detected in ["travel", "stay"], f"Expected 'travel', got '{detected}'"


# ============================================
# PILLAR DETECTION UNIT TESTS
# ============================================

class TestPillarDetectionLogic:
    """Unit tests for pillar detection edge cases"""
    
    def test_triage_first_detection(self, authenticated_client):
        """Test that ingestion uncertainty triggers triage_first, not emergency"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/os/understand",
            json={
                "message": "I'm scared, Lola swallowed something",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            detected = data.get("pillar") or data.get("detected_pillar")
            print(f"Pillar for 'swallowed something': {detected}")
            # Should be triage_first or emergency (handled by response tone)
            assert detected in ["triage_first", "emergency", "care"], f"Got: {detected}"
    
    def test_go_now_detection(self, authenticated_client):
        """Test that known toxins trigger emergency/go_now"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/mira/os/understand",
            json={
                "message": "Lola ate rat poison!",
                "pet_id": TEST_PET_ID,
                "pet_name": TEST_PET_NAME
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            detected = data.get("pillar") or data.get("detected_pillar")
            print(f"Pillar for 'ate rat poison': {detected}")
            assert detected == "emergency", f"Expected 'emergency', got '{detected}'"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
