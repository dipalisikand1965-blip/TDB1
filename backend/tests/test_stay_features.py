"""
Test Stay Page Features - Iteration 206
Tests for:
1. ConversationalEntry goal cards create service requests via POST /api/concierge/pillar-request
2. ElevenLabs TTS endpoint at POST /api/tts/generate with Elise voice
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestConciergeGoalRequest:
    """Test ConversationalEntry goal cards create service requests"""
    
    def test_pillar_request_endpoint_exists(self):
        """Test that /api/concierge/pillar-request endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json={
                "pillar": "stay",
                "request_type": "vacation",
                "request_label": "Vacation getaway",
                "message": "Test request for vacation getaway",
                "pet_name": "TestPet",
                "source": "conversational_entry"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_pillar_request_returns_ticket_id(self):
        """Test that pillar request returns ticket_id and request_id"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json={
                "pillar": "stay",
                "request_type": "boarding",
                "request_label": "Pet boarding",
                "message": "I need pet boarding services",
                "pet_name": "Buddy",
                "source": "conversational_entry"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] == True, "Request should be successful"
        assert "ticket_id" in data, "Response should contain 'ticket_id'"
        assert "request_id" in data, "Response should contain 'request_id'"
        assert data["ticket_id"].startswith("TKT-"), "Ticket ID should start with TKT-"
        assert data["request_id"].startswith("GOAL-"), "Request ID should start with GOAL-"
        
    def test_pillar_request_all_stay_goals(self):
        """Test all stay pillar goal types"""
        stay_goals = [
            ("vacation", "Vacation getaway"),
            ("boarding", "Pet boarding"),
            ("staycation", "Local staycation"),
            ("business", "Business trip"),
            ("weekend", "Weekend escape"),
            ("multi_pet", "Multi-pet trip")
        ]
        
        for goal_id, goal_label in stay_goals:
            response = requests.post(
                f"{BASE_URL}/api/concierge/pillar-request",
                json={
                    "pillar": "stay",
                    "request_type": goal_id,
                    "request_label": goal_label,
                    "message": f"Test request for {goal_label}",
                    "pet_name": "TestPet",
                    "source": "conversational_entry"
                },
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200, f"Failed for goal: {goal_label}"
            data = response.json()
            assert data["success"] == True, f"Request failed for goal: {goal_label}"


class TestElevenLabsTTS:
    """Test ElevenLabs TTS endpoint with Elise voice"""
    
    def test_tts_endpoint_exists(self):
        """Test that /api/tts/generate endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Hello, this is a test."},
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 (success) or 503 (API key not configured)
        assert response.status_code in [200, 503], f"Unexpected status: {response.status_code}"
        
    def test_tts_config_endpoint(self):
        """Test TTS config endpoint returns Elise voice info"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify Elise voice configuration
        assert "default_voice_id" in data, "Should have default_voice_id"
        assert data["provider"] == "elevenlabs", "Provider should be elevenlabs"
        
    def test_tts_generate_returns_audio(self):
        """Test TTS generate returns audio base64"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={
                "text": "Hello, this is Mira speaking.",
                "stability": 0.7,
                "similarity_boost": 0.75
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "audio_base64" in data, "Should return audio_base64"
            assert "text_spoken" in data, "Should return text_spoken"
            assert "voice_id" in data, "Should return voice_id"
            # Verify Mira pronunciation fix
            assert "Meera" in data["text_spoken"] or "Mira" not in data["text_spoken"], \
                "Mira should be converted to Meera for pronunciation"
        elif response.status_code == 503:
            # API key not configured - acceptable in test environment
            data = response.json()
            assert "ElevenLabs API key not configured" in data.get("detail", "")


class TestHealthEndpoints:
    """Test basic health endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        
    def test_stay_properties_endpoint(self):
        """Test /api/stay/properties endpoint"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
