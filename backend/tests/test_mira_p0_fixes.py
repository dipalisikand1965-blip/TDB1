"""
Test MIRA OS P0 Fixes - Intelligence Score and Pillar Detection
===============================================================
Tests for:
1. Intelligence Score with inline conversation_memories
2. Pillar Detection with word boundary checking for short keywords
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIntelligenceScore:
    """Tests for Intelligence Score endpoint - verifies inline conversation_memories are counted"""
    
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
    
    def test_intelligence_score_returns_valid_score(self, auth_token):
        """Test that intelligence score endpoint returns a valid numeric score for pet-e6348b13c975 (Lola)"""
        pet_id = "pet-e6348b13c975"
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-score/{pet_id}", headers=headers)
        
        print(f"Intelligence score response status: {response.status_code}")
        print(f"Intelligence score response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify total_score exists and is numeric (not N/A)
        assert "total_score" in data, "Response should contain total_score"
        total_score = data["total_score"]
        assert isinstance(total_score, (int, float)), f"total_score should be numeric, got {type(total_score)}: {total_score}"
        assert total_score >= 0, f"total_score should be >= 0, got {total_score}"
        assert total_score != "N/A", "total_score should not be N/A"
        
        print(f"PASS: Intelligence score = {total_score}")
    
    def test_intelligence_score_includes_conversation_memories(self, auth_token):
        """Test that conversation_learning > 0 when pet has inline conversation_memories"""
        pet_id = "pet-e6348b13c975"
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-score/{pet_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check breakdown exists
        assert "breakdown" in data, "Response should contain breakdown"
        breakdown = data["breakdown"]
        
        # Verify conversation_learning is included and > 0
        assert "conversation_learning" in breakdown, "Breakdown should contain conversation_learning"
        conv_learning = breakdown["conversation_learning"]
        
        print(f"conversation_learning = {conv_learning}")
        print(f"Full breakdown: {breakdown}")
        
        # The fix should ensure conversation_learning > 0 if inline memories exist
        assert conv_learning > 0, f"conversation_learning should be > 0 (inline memories fix), got {conv_learning}"
        
        print(f"PASS: conversation_learning = {conv_learning} (> 0 as expected)")
    
    def test_intelligence_score_has_valid_tier(self, auth_token):
        """Test that intelligence score returns a valid tier"""
        pet_id = "pet-e6348b13c975"
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/mira/intelligence-score/{pet_id}", headers=headers)
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify tier exists and is valid
        assert "tier" in data, "Response should contain tier"
        valid_tiers = ["curious_pup", "growing_bond", "trusted_guardian", "deep_connection", "soulmate"]
        assert data["tier"] in valid_tiers, f"Invalid tier: {data['tier']}"
        
        print(f"PASS: tier = {data['tier']}")


class TestPillarDetection:
    """Tests for Pillar Detection - verifies word boundary checking for short keywords"""
    
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
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_lola_haircut_returns_care_not_travel(self, auth_token):
        """
        CRITICAL BUG FIX TEST: 'Lola needs a haircut' should return 'care' pillar, NOT 'travel'
        The bug was: 'ola' substring in 'Lola' was matching travel keyword 'ola' (the cab company)
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test via understand-with-products endpoint
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Lola needs a haircut",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"Detected pillar: {pillar}")
        
        # CRITICAL: Should be 'care' NOT 'travel'
        assert pillar == "care", f"'Lola needs a haircut' should detect 'care' pillar, got '{pillar}'"
        assert pillar != "travel", f"BUG: 'Lola needs a haircut' incorrectly detected as 'travel' (ola substring match)"
        
        print(f"PASS: 'Lola needs a haircut' → pillar='{pillar}' (correctly NOT travel)")
    
    def test_buy_dog_food_returns_dine(self, auth_token):
        """Test that 'Buy dog food' returns 'dine' pillar"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Buy dog food",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Buy dog food' → pillar='{pillar}'")
        
        # Should be 'dine' or 'shop'
        assert pillar in ["dine", "shop"], f"'Buy dog food' should detect 'dine' or 'shop' pillar, got '{pillar}'"
        
        print(f"PASS: 'Buy dog food' → pillar='{pillar}'")
    
    def test_plan_birthday_party_returns_celebrate(self, auth_token):
        """Test that 'Plan Lola birthday party' returns 'celebrate' pillar"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Plan Lola birthday party",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Plan Lola birthday party' → pillar='{pillar}'")
        
        # Should be 'celebrate'
        assert pillar == "celebrate", f"'Plan Lola birthday party' should detect 'celebrate' pillar, got '{pillar}'"
        
        print(f"PASS: 'Plan Lola birthday party' → pillar='{pillar}'")
    
    def test_book_ola_cab_returns_travel(self, auth_token):
        """
        Test that 'Book an Ola cab' correctly returns 'travel' pillar
        This verifies the word boundary check works correctly - 'Ola' as a standalone word should match travel
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Book an Ola cab",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Book an Ola cab' → pillar='{pillar}'")
        
        # Should be 'travel' - 'Ola' as standalone word should match
        assert pillar == "travel", f"'Book an Ola cab' should detect 'travel' pillar, got '{pillar}'"
        
        print(f"PASS: 'Book an Ola cab' → pillar='{pillar}' (Ola as standalone word correctly matches)")
    
    def test_vocabulary_not_match_cab(self, auth_token):
        """Test that 'vocabulary' doesn't match 'cab' keyword (word boundary check)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Help me expand my dog's vocabulary",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Help me expand my dog's vocabulary' → pillar='{pillar}'")
        
        # Should NOT be 'travel' - 'cab' is substring of 'vocabulary' but shouldn't match
        assert pillar != "travel", f"BUG: 'vocabulary' incorrectly matched 'cab' keyword for travel"
        
        print(f"PASS: 'vocabulary' query → pillar='{pillar}' (correctly NOT travel)")


class TestWordBoundaryEdgeCases:
    """Additional edge case tests for word boundary checking"""
    
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
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_scare_not_match_car(self, auth_token):
        """Test that 'scare' doesn't match 'car' keyword"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Thunder sounds scare my dog",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Thunder sounds scare my dog' → pillar='{pillar}'")
        
        # Should NOT be 'travel' - 'car' is substring of 'scare' but shouldn't match
        assert pillar != "travel", f"BUG: 'scare' incorrectly matched 'car' keyword for travel"
        
        print(f"PASS: 'scare' query → pillar='{pillar}' (correctly NOT travel)")
    
    def test_car_trip_matches_travel(self, auth_token):
        """Test that 'car trip' correctly matches travel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "Taking my dog on a car trip",
                "pet_id": "pet-e6348b13c975"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        
        data = response.json()
        pillar = data.get("pillar", "").lower()
        
        print(f"'Taking my dog on a car trip' → pillar='{pillar}'")
        
        # Should be 'travel'
        assert pillar == "travel", f"'car trip' should detect 'travel' pillar, got '{pillar}'"
        
        print(f"PASS: 'car trip' → pillar='{pillar}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
