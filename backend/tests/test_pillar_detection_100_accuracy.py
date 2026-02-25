"""
Test MIRA OS Pillar Detection - 100/100 Accuracy Validation
===========================================================
Tests for the 10 specific pillar detection cases per review request.

Architecture decisions locked:
- GROOMING inside CARE
- SHOP not a pillar (execution layer)
- PHOTOGRAPHY inside CELEBRATE
- YouTube as supporting media in LEARN only

Test Cases:
1. 'Do we need a trainer?' → LEARN
2. 'Lola needs a haircut' → CARE (grooming is under CARE)
3. 'Do we need a professional photo shoot?' → CELEBRATE (photography is under CELEBRATE)
4. 'What are signs that food not agreeing' → CARE (symptoms context)
5. 'Where should Buddy sleep' → STAY
6. 'Is flying with Buddy necessary' → TRAVEL
7. 'Buddy barks too much' → LEARN (behavior/training)
8. 'How many walks does Buddy need' → FIT (exercise/fitness)
9. 'Is boarding right for Buddy' → STAY
10. 'Is daycare right for Buddy' → STAY
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPillarDetection100Accuracy:
    """Tests for 100% pillar detection accuracy - all 10 cases"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    def _detect_pillar(self, message: str, auth_token: str, pet_id: str = "pet-e6348b13c975") -> str:
        """Helper method to detect pillar from message via API"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": message,
                "pet_id": pet_id
            },
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.fail(f"API call failed: {response.status_code} - {response.text}")
        
        data = response.json()
        # Pillar is in 'current_pillar' field or in 'intelligence.last_search_context.pillar'
        pillar = (data.get("current_pillar") or 
                  data.get("intelligence", {}).get("last_search_context", {}).get("pillar") or 
                  "").lower()
        
        return pillar
    
    # Test Case 1: 'Do we need a trainer?' → LEARN
    def test_case_1_trainer_returns_learn(self, auth_token):
        """
        Test Case 1: 'Do we need a trainer?' should return 'learn' pillar
        Reason: 'trainer' keyword prioritized for LEARN per priority overrides
        """
        message = "Do we need a trainer?"
        expected_pillar = "learn"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 1: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 1 - '{message}' → '{pillar}'")
    
    # Test Case 2: 'Lola needs a haircut' → CARE
    def test_case_2_haircut_returns_care(self, auth_token):
        """
        Test Case 2: 'Lola needs a haircut' should return 'care' pillar
        Reason: GROOMING is inside CARE per architecture doctrine
        """
        message = "Lola needs a haircut"
        expected_pillar = "care"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 2: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        # Extra check: should NOT be travel (ola substring bug fix)
        assert pillar != "travel", f"BUG: 'Lola' should NOT match 'ola' travel keyword"
        
        print(f"PASS: Test Case 2 - '{message}' → '{pillar}'")
    
    # Test Case 3: 'Do we need a professional photo shoot?' → CELEBRATE
    def test_case_3_photo_shoot_returns_celebrate(self, auth_token):
        """
        Test Case 3: 'Do we need a professional photo shoot?' should return 'celebrate' pillar
        Reason: PHOTOGRAPHY is inside CELEBRATE per architecture doctrine
        """
        message = "Do we need a professional photo shoot?"
        expected_pillar = "celebrate"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 3: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 3 - '{message}' → '{pillar}'")
    
    # Test Case 4: 'What are signs that food not agreeing' → CARE
    def test_case_4_food_signs_returns_care(self, auth_token):
        """
        Test Case 4: 'What are signs that food not agreeing' should return 'care' pillar
        Reason: "signs that" + "not agreeing" indicates health symptoms, routed to CARE
        Priority override: 'not agreeing' and 'signs that' phrases → CARE (symptom context)
        """
        message = "What are signs that food not agreeing"
        expected_pillar = "care"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 4: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar (symptoms), got '{pillar}'"
        # Should NOT be DINE even though 'food' keyword is present
        assert pillar != "dine", f"'{message}' should be CARE (symptoms), not DINE"
        
        print(f"PASS: Test Case 4 - '{message}' → '{pillar}'")
    
    # Test Case 5: 'Where should Buddy sleep' → STAY
    def test_case_5_sleep_returns_stay(self, auth_token):
        """
        Test Case 5: 'Where should Buddy sleep' should return 'stay' pillar
        Reason: 'sleep' keyword is in STAY pillar (home setup, sleeping arrangements)
        """
        message = "Where should Buddy sleep"
        expected_pillar = "stay"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 5: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 5 - '{message}' → '{pillar}'")
    
    # Test Case 6: 'Is flying with Buddy necessary' → TRAVEL
    def test_case_6_flying_returns_travel(self, auth_token):
        """
        Test Case 6: 'Is flying with Buddy necessary' should return 'travel' pillar
        Reason: 'flying' keyword is in TRAVEL pillar
        """
        message = "Is flying with Buddy necessary"
        expected_pillar = "travel"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 6: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 6 - '{message}' → '{pillar}'")
    
    # Test Case 7: 'Buddy barks too much' → LEARN
    def test_case_7_barks_returns_learn(self, auth_token):
        """
        Test Case 7: 'Buddy barks too much' should return 'learn' pillar
        Reason: 'barks' is a behavior keyword in LEARN pillar (training needed)
        """
        message = "Buddy barks too much"
        expected_pillar = "learn"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 7: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 7 - '{message}' → '{pillar}'")
    
    # Test Case 8: 'How many walks does Buddy need' → FIT
    def test_case_8_walks_returns_fit(self, auth_token):
        """
        Test Case 8: 'How many walks does Buddy need' should return 'fit' pillar
        Reason: 'walks' and 'how many walks' are fitness/exercise keywords in FIT pillar
        """
        message = "How many walks does Buddy need"
        expected_pillar = "fit"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 8: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 8 - '{message}' → '{pillar}'")
    
    # Test Case 9: 'Is boarding right for Buddy' → STAY
    def test_case_9_boarding_returns_stay(self, auth_token):
        """
        Test Case 9: 'Is boarding right for Buddy' should return 'stay' pillar
        Reason: 'boarding' is a STAY service keyword
        """
        message = "Is boarding right for Buddy"
        expected_pillar = "stay"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 9: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 9 - '{message}' → '{pillar}'")
    
    # Test Case 10: 'Is daycare right for Buddy' → STAY
    def test_case_10_daycare_returns_stay(self, auth_token):
        """
        Test Case 10: 'Is daycare right for Buddy' should return 'stay' pillar
        Reason: 'daycare' is a STAY service keyword
        """
        message = "Is daycare right for Buddy"
        expected_pillar = "stay"
        
        pillar = self._detect_pillar(message, auth_token)
        
        print(f"Test Case 10: '{message}' → pillar='{pillar}'")
        
        assert pillar == expected_pillar, f"'{message}' should detect '{expected_pillar}' pillar, got '{pillar}'"
        
        print(f"PASS: Test Case 10 - '{message}' → '{pillar}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
