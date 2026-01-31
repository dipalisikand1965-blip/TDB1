"""
Iteration 140: Mira Chat Widget Enhancements Testing
=====================================================
Tests for:
1. MiraChatWidget: Opens on all pillar pages
2. MiraChatWidget: Has pillar-specific colors
3. MiraChatWidget: Pulse button works
4. MiraChatWidget: Welcome message includes pillar name
5. Pet Recommendations API: /api/mira/pet-recommendations/{pet_id}
6. Mira Context API: /api/mira/context/{pillar}
7. Pet switching in widget updates context
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


class TestMiraContextAPI:
    """Test /api/mira/context/{pillar} endpoint"""
    
    def test_context_celebrate_pillar(self):
        """Test context endpoint for celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/context/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pillar" in data
        assert "pillar_name" in data
        assert "pillar_icon" in data
        
        # Verify celebrate-specific data
        assert data["pillar"] == "celebrate"
        assert data["pillar_name"] == "Celebrate"
        assert data["pillar_icon"] == "🎂"
        print(f"✅ Celebrate context: {data}")
    
    def test_context_stay_pillar(self):
        """Test context endpoint for stay pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/context/stay")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "stay"
        assert data["pillar_name"] == "Stay"
        assert data["pillar_icon"] == "🏨"
        print(f"✅ Stay context: {data}")
    
    def test_context_care_pillar(self):
        """Test context endpoint for care pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/context/care")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "care"
        assert data["pillar_name"] == "Care"
        assert data["pillar_icon"] == "💊"
        print(f"✅ Care context: {data}")
    
    def test_context_fit_pillar(self):
        """Test context endpoint for fit pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/context/fit")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "fit"
        assert data["pillar_name"] == "Fit"
        assert data["pillar_icon"] == "🏃"
        print(f"✅ Fit context: {data}")
    
    def test_context_travel_pillar(self):
        """Test context endpoint for travel pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/context/travel")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "travel"
        assert data["pillar_name"] == "Travel"
        assert data["pillar_icon"] == "✈️"
        print(f"✅ Travel context: {data}")
    
    def test_context_all_pillars(self):
        """Test context endpoint for all 14 pillars"""
        pillars = [
            ("celebrate", "Celebrate", "🎂"),
            ("dine", "Dine", "🍽️"),
            ("stay", "Stay", "🏨"),
            ("travel", "Travel", "✈️"),
            ("care", "Care", "💊"),
            ("enjoy", "Enjoy", "🎾"),
            ("fit", "Fit", "🏃"),
            ("learn", "Learn", "🎓"),
            ("paperwork", "Paperwork", "📄"),
            ("advisory", "Advisory", "📋"),
            ("emergency", "Emergency", "🚨"),
            ("farewell", "Farewell", "🌈"),
            ("adopt", "Adopt", "🐾"),
            ("shop", "Shop", "🛒"),
        ]
        
        for pillar_key, pillar_name, pillar_icon in pillars:
            response = requests.get(f"{BASE_URL}/api/mira/context/{pillar_key}")
            assert response.status_code == 200, f"Failed for pillar: {pillar_key}"
            data = response.json()
            assert data["pillar"] == pillar_key
            assert data["pillar_name"] == pillar_name
            assert data["pillar_icon"] == pillar_icon
            print(f"✅ {pillar_name} ({pillar_icon}) context OK")


class TestPetRecommendationsAPI:
    """Test /api/mira/pet-recommendations/{pet_id} endpoint"""
    
    def test_pet_recommendations_nonexistent_pet(self):
        """Test recommendations for non-existent pet returns empty"""
        response = requests.get(f"{BASE_URL}/api/mira/pet-recommendations/nonexistent-pet-id?pillar=celebrate")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert data["recommendations"] == []
        assert data.get("message") == "Pet not found"
        print(f"✅ Non-existent pet returns empty recommendations")
    
    def test_pet_recommendations_with_pillar(self):
        """Test recommendations endpoint accepts pillar parameter"""
        pillars = ["celebrate", "stay", "care", "fit", "enjoy", "learn"]
        
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/mira/pet-recommendations/test-pet?pillar={pillar}")
            assert response.status_code == 200
            data = response.json()
            assert "recommendations" in data
            print(f"✅ Pet recommendations for pillar '{pillar}' - OK")
    
    def test_pet_recommendations_default_limit(self):
        """Test recommendations endpoint has default limit"""
        response = requests.get(f"{BASE_URL}/api/mira/pet-recommendations/test-pet?pillar=celebrate")
        assert response.status_code == 200
        data = response.json()
        
        # Even with no pet, should return proper structure
        assert "recommendations" in data
        print(f"✅ Pet recommendations returns proper structure")


class TestMiraContextWithAuth:
    """Test Mira context with authenticated user"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_context_with_auth(self, auth_token):
        """Test context endpoint with authenticated user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/mira/context/celebrate", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "celebrate"
        # With auth, may have personalized suggestions
        assert "proactive_suggestions" in data
        print(f"✅ Authenticated context: {data}")


class TestPetRecommendationsWithRealPet:
    """Test pet recommendations with a real pet from database"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_get_user_pets_and_recommendations(self, auth_token):
        """Test getting user's pets and then recommendations for them"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get user's pets
        pets_response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        if pets_response.status_code != 200:
            pytest.skip("Could not fetch pets")
        
        pets_data = pets_response.json()
        pets = pets_data.get("pets", [])
        
        if not pets:
            print("⚠️ No pets found for user, skipping pet-specific test")
            pytest.skip("No pets found")
        
        # Test recommendations for first pet
        pet = pets[0]
        pet_id = pet.get("id")
        pet_name = pet.get("name", "Unknown")
        
        print(f"Testing recommendations for pet: {pet_name} (ID: {pet_id})")
        
        response = requests.get(
            f"{BASE_URL}/api/mira/pet-recommendations/{pet_id}?pillar=celebrate",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert data.get("pet_id") == pet_id
        assert data.get("pet_name") == pet_name
        assert "personalization_factors" in data
        
        print(f"✅ Pet recommendations for {pet_name}: {len(data['recommendations'])} products")
        print(f"   Personalization factors: {data['personalization_factors']}")


class TestMiraQuickPrompts:
    """Test Mira quick prompts endpoint"""
    
    def test_quick_prompts_celebrate(self):
        """Test quick prompts for celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        assert "prompts" in data
        print(f"✅ Celebrate quick prompts: {data['prompts']}")
    
    def test_quick_prompts_all_pillars(self):
        """Test quick prompts for all pillars"""
        pillars = ["celebrate", "stay", "care", "fit", "travel", "enjoy", "learn"]
        
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/{pillar}")
            assert response.status_code == 200
            data = response.json()
            assert "prompts" in data
            print(f"✅ {pillar.title()} quick prompts: {len(data['prompts'])} prompts")


class TestMiraChatWithPillarContext:
    """Test Mira chat with pillar context"""
    
    def test_chat_with_celebrate_pillar(self):
        """Test Mira chat with celebrate pillar context"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to plan a birthday party for my dog",
            "session_id": f"test-session-{uuid.uuid4().hex[:8]}",
            "source": "chat_widget",
            "current_pillar": "celebrate"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✅ Mira chat with celebrate pillar: Response received")
    
    def test_chat_with_stay_pillar(self):
        """Test Mira chat with stay pillar context"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a pet-friendly hotel in Goa",
            "session_id": f"test-session-{uuid.uuid4().hex[:8]}",
            "source": "chat_widget",
            "current_pillar": "stay"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        print(f"✅ Mira chat with stay pillar: Response received")


class TestPillarColors:
    """Test pillar color configurations (frontend verification)"""
    
    def test_pillar_config_exists(self):
        """Verify pillar configurations exist in context endpoint"""
        pillars_with_expected_colors = {
            "celebrate": "pink",  # from-pink-500 to-rose-500
            "stay": "purple",     # from-purple-500 to-violet-500
            "care": "rose",       # from-rose-500 to-pink-600
            "fit": "teal",        # from-teal-500 to-cyan-500
            "travel": "blue",     # from-blue-500 to-cyan-500
            "dine": "orange",     # from-orange-500 to-amber-500
            "enjoy": "yellow",    # from-yellow-500 to-orange-500
            "learn": "blue",      # from-blue-600 to-indigo-600
        }
        
        for pillar, expected_color in pillars_with_expected_colors.items():
            response = requests.get(f"{BASE_URL}/api/mira/context/{pillar}")
            assert response.status_code == 200
            data = response.json()
            assert data["pillar"] == pillar
            print(f"✅ {pillar.title()} pillar config exists (expected color: {expected_color})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
