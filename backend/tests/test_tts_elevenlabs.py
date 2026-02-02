"""
Test TTS (Text-to-Speech) ElevenLabs Integration
Tests the /api/tts/* endpoints for Mira's voice functionality
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTTSConfig:
    """Test TTS configuration endpoint"""
    
    def test_tts_config_returns_provider_info(self):
        """Test /api/tts/config returns ElevenLabs configuration"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        assert response.status_code == 200
        
        data = response.json()
        assert data["provider"] == "elevenlabs"
        assert data["configured"] == True
        assert "default_voice_id" in data
        assert "features" in data
        assert "pronunciation_fixes" in data
        
    def test_tts_config_has_mira_features(self):
        """Test TTS config includes Mira-specific features"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        data = response.json()
        
        features = data.get("features", [])
        assert any("Mira" in f or "Meera" in f for f in features), "Should have Mira pronunciation feature"


class TestTTSVoices:
    """Test TTS voices listing endpoint"""
    
    def test_voices_endpoint_returns_list(self):
        """Test /api/tts/voices returns available voices"""
        response = requests.get(f"{BASE_URL}/api/tts/voices")
        assert response.status_code == 200
        
        data = response.json()
        assert data["configured"] == True
        assert "default_voice_id" in data
        
    def test_voices_list_contains_voices(self):
        """Test voices list has voice entries"""
        response = requests.get(f"{BASE_URL}/api/tts/voices")
        data = response.json()
        
        if "voices" in data:
            assert len(data["voices"]) > 0, "Should have at least one voice"
            # Check voice structure
            voice = data["voices"][0]
            assert "voice_id" in voice
            assert "name" in voice


class TestTTSGenerate:
    """Test TTS audio generation endpoint"""
    
    def test_generate_tts_returns_audio(self):
        """Test /api/tts/generate returns base64 audio"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Hello, I am Mira!"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio_base64" in data
        assert "text_spoken" in data
        assert "voice_id" in data
        
        # Verify audio_base64 is valid base64
        audio_b64 = data["audio_base64"]
        assert len(audio_b64) > 1000, "Audio should have substantial content"
        
        # Try to decode base64 to verify it's valid
        try:
            decoded = base64.b64decode(audio_b64)
            assert len(decoded) > 0
        except Exception as e:
            pytest.fail(f"Invalid base64 audio: {e}")
    
    def test_generate_tts_mira_pronunciation_fix(self):
        """Test that 'Mira' is converted to 'Meera' for pronunciation"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Hello, I am Mira, your pet concierge!"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # The text_spoken should have "Meera" instead of "Mira"
        assert "Meera" in data["text_spoken"], "Mira should be converted to Meera"
        assert "Mira" not in data["text_spoken"], "Original Mira should be replaced"
    
    def test_generate_tts_emoji_handling(self):
        """Test that emojis are handled properly"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Hello! 🐾 Welcome to pet care! 🎉"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Emojis should be removed or converted
        text_spoken = data["text_spoken"]
        assert "🐾" not in text_spoken or "paw" in text_spoken.lower()
        assert "🎉" not in text_spoken or "celebration" in text_spoken.lower()
    
    def test_generate_tts_empty_text_fails(self):
        """Test that empty text returns error"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": ""}
        )
        # Should return 400 for empty text
        assert response.status_code == 400
    
    def test_generate_tts_emoji_only_text_fails(self):
        """Test that emoji-only text returns error after cleaning"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "🎉✨🐾"}
        )
        # Should return 400 as text becomes empty after emoji removal
        assert response.status_code == 400
    
    def test_generate_tts_with_custom_voice_settings(self):
        """Test TTS with custom stability and similarity settings"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={
                "text": "Testing custom voice settings",
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio_base64" in data
        assert len(data["audio_base64"]) > 1000


class TestTTSIntegration:
    """Integration tests for TTS with real scenarios"""
    
    def test_tts_typical_mira_greeting(self):
        """Test TTS with a typical Mira greeting message"""
        greeting = "Good morning! I'm Mira, your pet concierge. How can I help you and your furry friend today?"
        
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": greeting}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "Meera" in data["text_spoken"]  # Mira -> Meera
        assert len(data["audio_base64"]) > 5000  # Should be substantial audio
    
    def test_tts_pet_care_message(self):
        """Test TTS with pet care related message"""
        message = "Your pup Bruno needs his vaccination next week. Would you like me to schedule an appointment?"
        
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": message}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio_base64" in data
        assert "Bruno" in data["text_spoken"]  # Pet name should be preserved


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
