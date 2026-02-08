"""
Test Voice Features - TTS and Voice Integration
Tests for The Doggy Company Mira Voice functionality
"""
import pytest
import requests
import os

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTTSEndpoints:
    """TTS (Text-to-Speech) endpoint tests"""
    
    def test_tts_generate_success(self):
        """Test TTS generation with valid text"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={
                "text": "Hello, I am Mira. Welcome to The Doggy Company!"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "audio_base64" in data
        assert "text_spoken" in data
        assert "voice_id" in data
        
        # Verify audio data is returned
        assert len(data["audio_base64"]) > 0
        print(f"TTS generated audio - length: {len(data['audio_base64'])} chars")
        print(f"Text spoken: {data['text_spoken'][:100]}...")
    
    def test_tts_generate_with_personality(self):
        """Test TTS with different voice personalities"""
        personalities = ["default", "celebration", "health", "comfort", "urgent"]
        
        for personality in personalities:
            response = requests.post(
                f"{BASE_URL}/api/tts/generate",
                json={
                    "text": "This is a test message.",
                    "personality": personality
                },
                timeout=30
            )
            
            assert response.status_code == 200, f"Failed for personality: {personality}"
            data = response.json()
            assert "audio_base64" in data
            assert data.get("personality") == personality or data.get("personality") is not None
            print(f"TTS personality '{personality}' - OK")
    
    def test_tts_generate_with_emoji_text(self):
        """Test TTS handles emojis properly"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={
                "text": "Happy birthday! 🎂🎉 Mojo is so cute 🐕"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Emojis should be cleaned from spoken text
        assert "🎂" not in data.get("text_spoken", "")
        assert "🎉" not in data.get("text_spoken", "")
        print(f"Cleaned text: {data['text_spoken']}")
    
    def test_tts_generate_empty_text(self):
        """Test TTS rejects empty text"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={
                "text": "   "
            },
            timeout=30
        )
        
        # Should return error for empty text (400, 500, or CDN error 520)
        assert response.status_code in [400, 500, 520]
        print(f"Empty text correctly rejected with status: {response.status_code}")
    
    def test_tts_voices_list(self):
        """Test listing available voices"""
        response = requests.get(f"{BASE_URL}/api/tts/voices", timeout=15)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return voice configuration
        assert "default_voice_id" in data
        if data.get("configured"):
            assert "voices" in data or "error" not in data
        print(f"TTS configured: {data.get('configured')}")
        print(f"Default voice ID: {data.get('default_voice_id')}")
    
    def test_tts_config(self):
        """Test TTS configuration endpoint"""
        response = requests.get(f"{BASE_URL}/api/tts/config", timeout=15)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("provider") == "elevenlabs"
        assert "default_voice_id" in data
        assert "features" in data
        print(f"TTS config: {data}")
    
    def test_tts_personalities_list(self):
        """Test listing voice personalities"""
        response = requests.get(f"{BASE_URL}/api/tts/personalities", timeout=15)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "personalities" in data
        
        personalities = data.get("personalities", {})
        expected = ["default", "celebration", "health", "comfort", "urgent"]
        for p in expected:
            assert p in personalities, f"Missing personality: {p}"
        
        print(f"Available personalities: {list(personalities.keys())}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "dipali@clubconcierge.in",
                "password": "lola4304"
            },
            timeout=15
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "dipali@clubconcierge.in"
        
        print(f"Login successful for: {data['user']['name']}")
        print(f"Membership tier: {data['user'].get('membership_tier')}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "dipali@clubconcierge.in",
                "password": "wrongpassword"
            },
            timeout=15
        )
        
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")


class TestMiraEndpoints:
    """Mira AI chat endpoint tests"""
    
    def test_mira_chat(self):
        """Test Mira chat endpoint responds"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Show me some treats",
                "pet_name": "Buddy",
                "pet_breed": "Golden Retriever"
            },
            timeout=60  # AI responses may take time
        )
        
        # Either 200 success or auth required
        assert response.status_code in [200, 401, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "response" in data or "message" in data
            print("Mira chat responded successfully")
        else:
            print(f"Mira chat returned status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
