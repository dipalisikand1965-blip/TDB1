"""
Test Mira OS - CELEBRATE Pillar Multi-Step Flow and Emergency Triage Chips
Iteration 212

Tests:
1. CELEBRATE pillar 3-step flow: Step 1 (location) -> Step 2 (size) -> Step 3 (execution)
2. Emergency triage chips: scared + ate something -> 6 chips
3. Location consent gate: 'Pet cafe near me' -> mode=clarify with consent chips
4. Travel pillar: 'Trip to Goa' -> pillar=travel (not dine/cafe)
5. Voice compliance: Responses don't start with banned words
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://product-box-overhaul.preview.emergentagent.com').rstrip('/')
PET_ID = "pet-e6348b13c975"  # Lola
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"

# Banned first words per PET_OS_BEHAVIOR_BIBLE.md Section 0.05.2
BANNED_OPENERS = [
    "Great idea",
    "Great question", 
    "That sounds",
    "I'd be happy to",
    "Absolutely",
    "Sure",
    "Of course",
    "No problem",
    "Certainly",
    "How exciting"
]


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token") or data.get("token")
        if token:
            return token
    pytest.skip("Authentication failed - skipping tests")


@pytest.fixture
def auth_headers(auth_token):
    """Get auth headers with token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CELEBRATE PILLAR 3-STEP FLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCelebratePillarFlow:
    """
    Test CELEBRATE pillar 3-step conversation flow:
    Step 1: Initial birthday request -> location question
    Step 2: Location answer -> size question  
    Step 3: Size answer -> execution options
    
    Uses SAME session_id across all 3 steps to test flow continuity
    """
    
    def test_celebrate_step1_location_question(self, auth_headers):
        """
        Step 1: 'Plan Lola's birthday' -> Should ask about location
        Expected: celebrate_stage='location', quick_replies with location options
        """
        session_id = f"test-celebrate-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Plan Lola's birthday",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # Log response for debugging
        print(f"\n[CELEBRATE STEP 1] Response: {data.get('response', '')[:200]}")
        print(f"[CELEBRATE STEP 1] Pillar: {data.get('pillar')}")
        print(f"[CELEBRATE STEP 1] Stage: {data.get('celebrate_stage')}")
        
        # Verify CELEBRATE flow started
        assert data.get("pillar") == "celebrate", f"Expected pillar=celebrate, got {data.get('pillar')}"
        assert data.get("celebrate_stage") == "location", f"Expected celebrate_stage=location, got {data.get('celebrate_stage')}"
        
        # Verify location question chips per Section 11.3.4A
        contract = data.get("conversation_contract", {})
        quick_replies = contract.get("quick_replies", [])
        
        print(f"[CELEBRATE STEP 1] Quick replies: {[qr.get('label') for qr in quick_replies]}")
        
        assert len(quick_replies) >= 3, f"Expected at least 3 location chips, got {len(quick_replies)}"
        
        # Check for expected location options
        labels = [qr.get("label") for qr in quick_replies]
        assert "At home" in labels, f"Missing 'At home' chip. Got: {labels}"
        
        # Verify voice compliance - no banned openers
        response_text = data.get("response", "")
        for banned in BANNED_OPENERS:
            assert not response_text.lower().startswith(banned.lower()), \
                f"Response starts with banned opener: {banned}"
    
    def test_celebrate_step2_size_question(self, auth_headers):
        """
        Step 2: Answer location 'At home' -> Should ask about party size
        Expected: celebrate_stage='size', quick_replies with size options
        """
        session_id = f"test-celebrate-flow-{uuid.uuid4().hex[:8]}"
        
        # Step 1: Initial request
        response1 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Plan Lola's birthday",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        assert response1.status_code == 200
        print(f"\n[CELEBRATE STEP 2] Step 1 response pillar: {response1.json().get('pillar')}")
        
        # Step 2: Provide location
        response2 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "At home",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response2.status_code == 200, f"API returned {response2.status_code}"
        data = response2.json()
        
        print(f"[CELEBRATE STEP 2] Response: {data.get('response', '')[:200]}")
        print(f"[CELEBRATE STEP 2] Pillar: {data.get('pillar')}")
        print(f"[CELEBRATE STEP 2] Stage: {data.get('celebrate_stage')}")
        
        # Verify CELEBRATE flow progressed to size stage
        assert data.get("pillar") == "celebrate", f"Expected pillar=celebrate, got {data.get('pillar')}"
        assert data.get("celebrate_stage") == "size", f"Expected celebrate_stage=size, got {data.get('celebrate_stage')}"
        
        # Verify size question chips per Section 11.3.4B
        contract = data.get("conversation_contract", {})
        quick_replies = contract.get("quick_replies", [])
        
        print(f"[CELEBRATE STEP 2] Quick replies: {[qr.get('label') for qr in quick_replies]}")
        
        assert len(quick_replies) >= 3, f"Expected at least 3 size chips, got {len(quick_replies)}"
        
        # Check for expected size options
        labels = [qr.get("label") for qr in quick_replies]
        assert any("small" in label.lower() or "under" in label.lower() for label in labels), \
            f"Missing small party size chip. Got: {labels}"
    
    def test_celebrate_step3_execution_options(self, auth_headers):
        """
        Step 3: Answer size -> Should show execution options
        Expected: celebrate_stage='execution', quick_replies with execution options (cake, photographer, etc)
        """
        session_id = f"test-celebrate-full-{uuid.uuid4().hex[:8]}"
        
        # Step 1: Initial request
        response1 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Plan Lola's birthday",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        assert response1.status_code == 200, f"Step 1 failed: {response1.status_code}"
        print(f"\n[CELEBRATE STEP 3] Step 1 pillar: {response1.json().get('pillar')}")
        
        # Step 2: Provide location
        response2 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "At home",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        assert response2.status_code == 200, f"Step 2 failed: {response2.status_code}"
        print(f"[CELEBRATE STEP 3] Step 2 pillar: {response2.json().get('pillar')}, stage: {response2.json().get('celebrate_stage')}")
        
        # Step 3: Provide size
        response3 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Small, under 6 pups",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response3.status_code == 200, f"Step 3 failed: {response3.status_code}"
        data = response3.json()
        
        print(f"[CELEBRATE STEP 3] Response: {data.get('response', '')[:200]}")
        print(f"[CELEBRATE STEP 3] Pillar: {data.get('pillar')}")
        print(f"[CELEBRATE STEP 3] Stage: {data.get('celebrate_stage')}")
        
        # Verify CELEBRATE flow progressed to execution stage
        assert data.get("pillar") == "celebrate", f"Expected pillar=celebrate, got {data.get('pillar')}"
        assert data.get("celebrate_stage") == "execution", \
            f"Expected celebrate_stage=execution, got {data.get('celebrate_stage')}"
        
        # Verify execution options chips per Section 11.3.4C
        contract = data.get("conversation_contract", {})
        quick_replies = contract.get("quick_replies", [])
        
        print(f"[CELEBRATE STEP 3] Quick replies: {[qr.get('label') for qr in quick_replies]}")
        
        assert len(quick_replies) >= 3, f"Expected at least 3 execution chips, got {len(quick_replies)}"
        
        # Check for expected execution options
        labels = [qr.get("label").lower() for qr in quick_replies]
        assert any("cake" in label for label in labels), f"Missing 'Custom cake' execution chip. Got: {labels}"
        
        # Verify mode is 'handoff' for execution stage
        assert contract.get("mode") == "handoff", \
            f"Expected mode=handoff at execution stage, got {contract.get('mode')}"


# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCY TRIAGE CHIPS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestEmergencyTriageChips:
    """
    Test emergency triage chips per PET_OS_BEHAVIOR_BIBLE.md Section 0.05.6
    
    When user says "scared + ate something", system should enter triage_first mode
    and return 6 specific chips: Chocolate, Medicine, Grapes/raisins, Plant, Not sure, Go to vet now
    """
    
    def test_emergency_triage_scared_ate_something(self, auth_headers):
        """
        'I'm scared. Lola ate something weird' -> 6 triage chips
        Expected: mode=clarify, 6 emergency triage chips
        """
        session_id = f"test-triage-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "I'm scared. Lola ate something weird",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200, f"API returned {response.status_code}"
        data = response.json()
        
        print(f"\n[TRIAGE] Response: {data.get('response', '')[:200]}")
        print(f"[TRIAGE] Pillar: {data.get('pillar')}")
        print(f"[TRIAGE] is_triage: {data.get('is_triage')}")
        
        # Verify triage mode was triggered
        is_triage = data.get("is_triage") or data.get("awaiting_triage_response") or data.get("pillar") == "triage_first"
        assert is_triage, f"Expected triage mode. Got: pillar={data.get('pillar')}, is_triage={data.get('is_triage')}"
        
        # Verify conversation contract has 6 chips
        contract = data.get("conversation_contract", {})
        quick_replies = contract.get("quick_replies", [])
        
        print(f"[TRIAGE] Quick replies count: {len(quick_replies)}")
        print(f"[TRIAGE] Quick replies: {[qr.get('label') for qr in quick_replies]}")
        
        # Per Section 11.3.6: Should have exactly 6 chips
        assert len(quick_replies) == 6, f"Expected 6 triage chips, got {len(quick_replies)}: {[qr.get('label') for qr in quick_replies]}"
        
        # Check for specific expected chips
        expected_labels = ["Chocolate", "Medicine", "Grapes/raisins", "Plant", "Not sure", "Go to vet now"]
        actual_labels = [qr.get("label") for qr in quick_replies]
        
        for expected in expected_labels:
            assert expected in actual_labels, f"Missing expected chip: {expected}. Got: {actual_labels}"
        
        # Verify mode is clarify (triage questioning)
        assert contract.get("mode") == "clarify", f"Expected mode=clarify, got {contract.get('mode')}"


# ═══════════════════════════════════════════════════════════════════════════════
# LOCATION CONSENT GATE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLocationConsentGate:
    """
    Test location consent gate per PET_OS_BEHAVIOR_BIBLE.md Section 11.4
    
    When user says 'near me' without prior consent, system should ask for location permission
    """
    
    def test_cafe_near_me_consent_gate(self, auth_headers):
        """
        'Pet cafe near me' -> Should trigger clarify mode with location consent chips
        Expected: mode=clarify, chips include 'Use current location' and 'Type an area'
        """
        session_id = f"test-consent-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Pet cafe near me",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200, f"API returned {response.status_code}"
        data = response.json()
        
        print(f"\n[CONSENT GATE] Response: {data.get('response', '')[:200]}")
        print(f"[CONSENT GATE] Pillar: {data.get('pillar')}")
        
        # Verify clarify mode (asking for location consent)
        contract = data.get("conversation_contract", {})
        mode = contract.get("mode")
        
        print(f"[CONSENT GATE] Mode: {mode}")
        
        # Should be clarify mode asking about location
        assert mode == "clarify", f"Expected mode=clarify for location consent gate, got {mode}"
        
        # Verify consent chips are present
        quick_replies = contract.get("quick_replies", [])
        labels = [qr.get("label") for qr in quick_replies]
        
        print(f"[CONSENT GATE] Quick replies: {labels}")
        
        # Per Section 11.2.8: Should have 'Use current location' and 'Type an area' chips
        has_location_chip = any("current location" in label.lower() or "use location" in label.lower() for label in labels)
        assert has_location_chip, f"Missing 'Use current location' consent chip. Got: {labels}"


# ═══════════════════════════════════════════════════════════════════════════════
# TRAVEL PILLAR DETECTION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestTravelPillarDetection:
    """
    Test travel pillar detection - ensure travel queries don't route to dine/cafe
    """
    
    def test_trip_to_goa_is_travel_pillar(self, auth_headers):
        """
        'Trip to Goa' -> Should be pillar=travel, NOT dine/cafe
        """
        session_id = f"test-travel-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "I am planning a trip to Goa with Lola",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200, f"API returned {response.status_code}"
        data = response.json()
        
        print(f"\n[TRAVEL] Response: {data.get('response', '')[:200]}")
        print(f"[TRAVEL] Pillar: {data.get('pillar')}")
        
        # Verify TRAVEL pillar detected
        pillar = data.get("pillar")
        assert pillar == "travel", f"Expected pillar=travel, got {pillar}"
        
        # Verify response doesn't mention cafe booking
        response_text = data.get("response", "").lower()
        assert "arrange a table" not in response_text, \
            f"TRAVEL response incorrectly mentions cafe booking: {response_text[:200]}"


# ═══════════════════════════════════════════════════════════════════════════════
# VOICE COMPLIANCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestVoiceCompliance:
    """
    Test Mira voice compliance per PET_OS_BEHAVIOR_BIBLE.md Section 0.05
    
    Responses should NOT start with banned openers
    """
    
    def test_no_banned_openers_birthday(self, auth_headers):
        """Birthday request should not start with banned openers"""
        session_id = f"test-voice-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "I want to plan a birthday party for Lola",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data.get("response", "")
        first_sentence = response_text.split('.')[0] if response_text else ""
        
        print(f"\n[VOICE] First sentence: {first_sentence[:100]}")
        
        for banned in BANNED_OPENERS:
            assert not first_sentence.lower().startswith(banned.lower()), \
                f"Response starts with banned opener '{banned}': {first_sentence}"
    
    def test_no_banned_openers_grooming(self, auth_headers):
        """Grooming request should not start with banned openers"""
        session_id = f"test-voice-groom-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=auth_headers,
            json={
                "message": "Lola needs grooming",
                "pet_id": PET_ID,
                "session_id": session_id,
                "source": "web"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data.get("response", "")
        first_sentence = response_text.split('.')[0] if response_text else ""
        
        print(f"\n[VOICE GROOM] First sentence: {first_sentence[:100]}")
        
        for banned in BANNED_OPENERS:
            assert not first_sentence.lower().startswith(banned.lower()), \
                f"Response starts with banned opener '{banned}': {first_sentence}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
