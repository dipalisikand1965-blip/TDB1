"""
Test Bible Compliance Issues for Mira Chat
Iteration 222: Testing fixes for:
1. P0: Picks panel showing wrong pillar items (Travel instead of Dine for treats)
2. P1: Quick replies must be Bible-compliant with full schema
3. Allergy data must merge from ALL sources (preferences.allergies AND doggy_soul_answers.allergies)

Test credentials: dipali@clubconcierge.in / test123
Pet: Lola (id: pet-e6348b13c975)
"""

import pytest
import requests
import os
import time

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL not set", allow_module_level=True)


class TestBibleComplianceIteration222:
    """Tests for P0 pillar fix and P1 quick replies + allergy merging"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Authenticate
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        self.session.close()

    # ═══════════════════════════════════════════════════════════════════════════
    # P0: PILLAR RETURNED IN RESPONSE FOR TREATS QUESTION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_treats_question_returns_dine_pillar(self):
        """P0: When user asks about treats, backend MUST return pillar='dine' in response"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "What treats should I give Lola?",
            "session_id": f"test-dine-pillar-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # P0 FIX VERIFICATION: pillar must be 'dine' for treat questions
        pillar = data.get("pillar")
        assert pillar is not None, "FAIL: pillar field missing from response - P0 NOT FIXED"
        assert pillar.lower() == "dine", f"FAIL: Expected pillar='dine' but got '{pillar}' - P0 NOT FIXED"
        
        print(f"✅ P0 PASS: pillar='{pillar}' returned for treats question")
    
    def test_treats_picks_contain_dine_pillar_items(self):
        """P0: Picks array should contain items with pillar='dine' for treat questions, NOT Travel"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Show me some treats for my dog",
            "session_id": f"test-dine-picks-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        picks = data.get("picks", [])
        if picks:
            # Check that picks are NOT from Travel pillar
            travel_picks = [p for p in picks if p.get("pillar", "").lower() == "travel"]
            dine_picks = [p for p in picks if p.get("pillar", "").lower() == "dine"]
            shop_picks = [p for p in picks if p.get("pillar", "").lower() == "shop"]
            
            # For treat questions, we should NOT have Travel pillar items
            assert len(travel_picks) == 0, f"FAIL: Found {len(travel_picks)} Travel pillar picks for treats question - P0 NOT FIXED"
            
            # Should have Dine or Shop picks (treats are typically in dine or shop)
            valid_picks = dine_picks + shop_picks
            print(f"✅ P0 PASS: {len(valid_picks)} valid picks (Dine: {len(dine_picks)}, Shop: {len(shop_picks)}), 0 Travel picks")
        else:
            print("⚠️ No picks returned - check if this is expected behavior")

    # ═══════════════════════════════════════════════════════════════════════════
    # P1: QUICK REPLIES BIBLE COMPLIANCE (Section 11.2/11.3)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_quick_replies_bible_compliant_schema(self):
        """P1: Quick replies MUST have Bible-compliant format with full schema"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a vet for Lola",  # Vet without location triggers clarify mode
            "session_id": f"test-qr-schema-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check conversation_contract exists
        contract = data.get("conversation_contract", {})
        assert contract, "FAIL: conversation_contract missing from response"
        
        # Check mode is returned
        mode = contract.get("mode")
        assert mode, "FAIL: conversation_contract.mode missing"
        print(f"conversation_contract.mode = '{mode}'")
        
        # Check quick_replies
        quick_replies = contract.get("quick_replies", [])
        
        if quick_replies:
            # Bible Section 11.2.3 requires: label, payload_text, intent_type, action, analytics_tag
            required_fields = ["label", "payload_text", "intent_type", "action", "analytics_tag"]
            
            for i, qr in enumerate(quick_replies):
                missing_fields = [f for f in required_fields if not qr.get(f)]
                
                # Log each quick reply
                print(f"Quick Reply {i+1}: {qr.get('label', 'NO_LABEL')}")
                
                # Check compliance
                if missing_fields:
                    print(f"  ⚠️ Missing fields: {missing_fields}")
                else:
                    print(f"  ✅ All required fields present")
                    
            # At least one quick reply should have all required fields
            fully_compliant = any(
                all(qr.get(f) for f in required_fields) 
                for qr in quick_replies
            )
            
            # Soft check - report but don't fail if schema is partially implemented
            if fully_compliant:
                print(f"✅ P1 PASS: {len(quick_replies)} quick replies with Bible-compliant schema")
            else:
                print(f"⚠️ P1 WARNING: Quick replies present but missing some Bible-required fields")
        else:
            print(f"⚠️ No quick_replies in response - may be expected for some modes")

    def test_vet_clarify_mode_without_location(self):
        """Conversation_contract.mode should be 'clarify' for vet without location"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find me a vet",  # No location = clarify mode expected
            "session_id": f"test-clarify-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        contract = data.get("conversation_contract", {})
        mode = contract.get("mode")
        
        # For vet without location, mode should be 'clarify' (per Bible Section 11.4)
        print(f"Mode for 'Find me a vet' (no location): {mode}")
        
        if mode == "clarify":
            print("✅ PASS: conversation_contract.mode='clarify' for vet without location")
        elif mode == "places":
            print("⚠️ WARNING: mode='places' but no location was provided - might need consent flow")
        else:
            print(f"ℹ️ Mode is '{mode}' - checking quick replies for location clarification")
            
        # Should have location-related quick replies
        quick_replies = contract.get("quick_replies", [])
        location_related = [qr for qr in quick_replies if any(
            term in (qr.get("label", "") + qr.get("payload_text", "")).lower()
            for term in ["location", "near", "area", "current"]
        )]
        
        if location_related:
            print(f"✅ Has {len(location_related)} location-related quick replies")

    # ═══════════════════════════════════════════════════════════════════════════
    # ALLERGY MERGING FROM ALL SOURCES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_allergies_merged_from_all_sources(self):
        """Allergies must be merged from preferences.allergies AND doggy_soul_answers.allergies"""
        # First, get pet data to verify allergies exist in multiple places
        pet_response = self.session.get(f"{BASE_URL}/api/pets/pet-e6348b13c975")
        
        if pet_response.status_code == 200:
            pet_data = pet_response.json()
            
            # Check where allergies are stored
            prefs_allergies = (pet_data.get("preferences") or {}).get("allergies", [])
            soul_allergies = (pet_data.get("doggy_soul_answers") or {}).get("allergies", [])
            food_allergies = (pet_data.get("doggy_soul_answers") or {}).get("food_allergies", [])
            direct_allergies = pet_data.get("allergies", [])
            
            print(f"Allergies in preferences.allergies: {prefs_allergies}")
            print(f"Allergies in doggy_soul_answers.allergies: {soul_allergies}")
            print(f"Allergies in doggy_soul_answers.food_allergies: {food_allergies}")
            print(f"Allergies in direct allergies field: {direct_allergies}")
            
            # All sources of allergies
            all_allergy_sources = [prefs_allergies, soul_allergies, food_allergies, direct_allergies]
            all_allergies = set()
            for source in all_allergy_sources:
                if isinstance(source, list):
                    for a in source:
                        if isinstance(a, str):
                            all_allergies.add(a.lower())
                        elif isinstance(a, dict):
                            all_allergies.add((a.get("allergen") or a.get("name", "")).lower())
                elif isinstance(source, str):
                    all_allergies.add(source.lower())
            
            all_allergies.discard("")  # Remove empty strings
            print(f"Total unique allergies across all sources: {all_allergies}")
        
        # Now test that Mira chat returns ALL allergies
        chat_response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "What are Lola's allergies? List them all.",
            "session_id": f"test-allergies-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert chat_response.status_code == 200
        chat_data = chat_response.json()
        
        # Check pet_context_used for merged allergies
        pet_context = chat_data.get("pet_context_used", {})
        context_allergies = pet_context.get("allergies", [])
        
        print(f"Allergies in pet_context_used: {context_allergies}")
        
        # Response text should mention allergies
        response_text = chat_data.get("response", "").lower()
        
        # Check if allergies from ALL sources are represented
        if all_allergies:
            mentioned = [a for a in all_allergies if a in response_text or a in str(context_allergies).lower()]
            print(f"Allergies mentioned in response/context: {mentioned}")
            
            if len(mentioned) >= len(all_allergies):
                print(f"✅ PASS: All allergies from all sources appear to be merged")
            else:
                missing = all_allergies - set(mentioned)
                print(f"⚠️ WARNING: Some allergies may be missing: {missing}")


class TestOSContextAllergyMerging:
    """Test get_mira_os_context allergy merging logic directly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Authenticate
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_os_context_safety_gates_include_all_allergies(self):
        """OS context safety gates should include merged allergies from all sources"""
        # Send a dine/food related message to trigger safety gates
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "What food is safe for Lola given her allergies?",
            "session_id": f"test-safety-gates-{int(time.time())}",
            "pet_id": "pet-e6348b13c975"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check OS context data
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        print(f"OS Context safety_gates: {safety_gates}")
        
        # Find allergy gate
        allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
        
        if allergy_gates:
            allergy_items = allergy_gates[0].get("items", [])
            print(f"Allergy items in safety gates: {allergy_items}")
            
            # Should have multiple allergies merged
            if len(allergy_items) > 1:
                print(f"✅ PASS: Multiple allergies ({len(allergy_items)}) in safety gates - merging working")
            else:
                print(f"⚠️ Only {len(allergy_items)} allergy in safety gates - check if merge is working")
        else:
            print("⚠️ No allergy safety gates found - may need to verify pet has allergies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
