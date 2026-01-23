"""
Test Mira Context Personalization and Care Bundles
Tests for:
1. POST /api/mira/context - personalized greeting when logged in
2. POST /api/mira/context - welcome message when not logged in
3. GET /api/care/bundles - care bundles endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"


class TestMiraContextPersonalization:
    """Test Mira context endpoint personalization"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_mira_context_without_auth_returns_welcome_message(self):
        """POST /api/mira/context without auth should return generic welcome message"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"current_pillar": "travel"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pillar_note" in data, "Response should contain pillar_note"
        assert data["user"] is None, "User should be None for unauthenticated request"
        
        # Should contain welcome message with "Sign in"
        pillar_note = data.get("pillar_note", "")
        assert "Welcome" in pillar_note or "Sign in" in pillar_note, \
            f"Expected welcome message with 'Sign in', got: {pillar_note}"
        
        print(f"✓ Unauthenticated pillar_note: {pillar_note}")
    
    def test_mira_context_with_auth_returns_personalized_greeting(self, auth_token):
        """POST /api/mira/context with auth should return personalized greeting with user and pet name"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"current_pillar": "travel"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pillar_note" in data, "Response should contain pillar_note"
        assert data["user"] is not None, "User should not be None for authenticated request"
        
        pillar_note = data.get("pillar_note", "")
        
        # Should NOT contain "Sign in" for logged-in users
        assert "Sign in" not in pillar_note, \
            f"Personalized greeting should NOT contain 'Sign in', got: {pillar_note}"
        
        # Should contain user's name (first name)
        user_name = data.get("user", {}).get("name", "")
        if user_name:
            first_name = user_name.split()[0]
            assert first_name in pillar_note, \
                f"Personalized greeting should contain user's first name '{first_name}', got: {pillar_note}"
        
        # If user has pets, should contain pet name
        pets = data.get("pets", [])
        if pets:
            pet_name = pets[0].get("name", "")
            if pet_name:
                assert pet_name in pillar_note, \
                    f"Personalized greeting should contain pet name '{pet_name}', got: {pillar_note}"
        
        print(f"✓ Authenticated pillar_note: {pillar_note}")
        print(f"✓ User: {data.get('user')}")
        print(f"✓ Pets: {data.get('pets')}")
    
    def test_mira_context_different_pillars(self, auth_token):
        """Test personalized greetings for different pillars"""
        pillars = ["travel", "stay", "care", "dine", "celebrate"]
        
        for pillar in pillars:
            response = requests.post(
                f"{BASE_URL}/api/mira/context",
                json={"current_pillar": pillar},
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            assert response.status_code == 200, f"Pillar {pillar}: Expected 200, got {response.status_code}"
            
            data = response.json()
            pillar_note = data.get("pillar_note", "")
            
            # Should NOT contain "Sign in" for any pillar when logged in
            assert "Sign in" not in pillar_note, \
                f"Pillar {pillar}: Should not contain 'Sign in', got: {pillar_note}"
            
            print(f"✓ Pillar '{pillar}': {pillar_note[:80]}...")
    
    def test_mira_context_response_structure(self, auth_token):
        """Verify response structure contains all expected fields"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"current_pillar": "care"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "user" in data, "Response should contain 'user' field"
        assert "pets" in data, "Response should contain 'pets' field"
        assert "selected_pet" in data, "Response should contain 'selected_pet' field"
        assert "suggestions" in data, "Response should contain 'suggestions' field"
        assert "pillar_note" in data, "Response should contain 'pillar_note' field"
        
        # Verify user structure
        if data["user"]:
            assert "name" in data["user"], "User should have 'name' field"
        
        # Verify pets structure
        if data["pets"]:
            for pet in data["pets"]:
                assert "id" in pet or "name" in pet, "Pet should have 'id' or 'name'"
        
        print(f"✓ Response structure verified")


class TestCareBundles:
    """Test Care bundles endpoint"""
    
    def test_get_care_bundles_endpoint_exists(self):
        """GET /api/care/bundles should return 200"""
        response = requests.get(f"{BASE_URL}/api/care/bundles")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bundles" in data, "Response should contain 'bundles' field"
        assert "total" in data, "Response should contain 'total' field"
        
        print(f"✓ Care bundles endpoint working, total: {data.get('total', 0)}")
    
    def test_care_bundles_response_structure(self):
        """Verify care bundles response structure"""
        response = requests.get(f"{BASE_URL}/api/care/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        bundles = data.get("bundles", [])
        
        # If bundles exist, verify structure
        if bundles:
            bundle = bundles[0]
            # Check for common bundle fields
            assert "id" in bundle or "bundle_id" in bundle, "Bundle should have 'id' field"
            print(f"✓ Found {len(bundles)} care bundles")
            print(f"✓ Sample bundle: {bundle.get('name', bundle.get('title', 'N/A'))}")
        else:
            print("✓ No care bundles found (empty but endpoint works)")
    
    def test_care_bundles_with_type_filter(self):
        """GET /api/care/bundles with care_type filter"""
        # Test with a care type filter
        response = requests.get(f"{BASE_URL}/api/care/bundles?care_type=grooming")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "bundles" in data
        
        print(f"✓ Care bundles with filter working, found: {len(data.get('bundles', []))}")


class TestMiraContextEdgeCases:
    """Test edge cases for Mira context"""
    
    def test_mira_context_no_pillar(self):
        """POST /api/mira/context without pillar should still work"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Context endpoint works without pillar")
    
    def test_mira_context_invalid_pillar(self):
        """POST /api/mira/context with invalid pillar should still work"""
        response = requests.post(
            f"{BASE_URL}/api/mira/context",
            json={"current_pillar": "invalid_pillar_xyz"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Context endpoint handles invalid pillar gracefully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
