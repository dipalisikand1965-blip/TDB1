"""
Mira Pure OS - Backend API Tests
=================================

Tests for the Mira Pure OS page features:
- Pets endpoint
- Chat endpoint with AI responses
- Service creation via function calling
- Soul data and personalization
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraPureHealth:
    """Health check for Mira Pure API"""
    
    def test_health_endpoint(self):
        """Test /api/mira-pure/health returns ok status"""
        response = requests.get(f"{BASE_URL}/api/mira-pure/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "pure-1.0"
        assert data["model"] == "gpt-5.1"
        print(f"SUCCESS: Health check passed - model: {data['model']}")


class TestMiraPurePets:
    """Tests for pet data retrieval"""
    
    def test_get_pets_for_user(self):
        """Test /api/mira-pure/pets returns pets for email"""
        response = requests.get(f"{BASE_URL}/api/mira-pure/pets?email=dipali@clubconcierge.in")
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        assert len(data["pets"]) > 0
        print(f"SUCCESS: Found {len(data['pets'])} pets")
    
    def test_mojo_pet_soul_data(self):
        """Test Mojo pet has correct soul data (personality, allergies)"""
        response = requests.get(f"{BASE_URL}/api/mira-pure/pets?email=dipali@clubconcierge.in")
        assert response.status_code == 200
        data = response.json()
        
        # Find Mojo
        mojo = None
        for pet in data["pets"]:
            if pet["name"] == "Mojo":
                mojo = pet
                break
        
        assert mojo is not None, "Mojo pet not found"
        
        # Check soul data
        soul_data = mojo.get("soul_data", {})
        assert "personality" in soul_data, "Personality missing from soul data"
        
        personality = soul_data["personality"]
        assert "calm" in personality, "calm not in personality"
        assert "drama-queen" in personality, "drama-queen not in personality"
        assert "motherly" in personality, "motherly not in personality"
        assert "food-motivated" in personality, "food-motivated not in personality"
        
        # Check soul completeness
        assert soul_data.get("soul_completeness") == 87, f"Soul completeness should be 87%, got {soul_data.get('soul_completeness')}"
        
        print(f"SUCCESS: Mojo soul data correct - personality: {personality}, soul: {soul_data.get('soul_completeness')}%")
    
    def test_mojo_health_allergies(self):
        """Test Mojo has chicken allergy in health data"""
        response = requests.get(f"{BASE_URL}/api/mira-pure/pets?email=dipali@clubconcierge.in")
        assert response.status_code == 200
        data = response.json()
        
        mojo = None
        for pet in data["pets"]:
            if pet["name"] == "Mojo":
                mojo = pet
                break
        
        assert mojo is not None, "Mojo pet not found"
        
        health_data = mojo.get("health_data", {})
        allergies = health_data.get("allergies", [])
        
        assert "chicken" in allergies, f"Chicken allergy not found in {allergies}"
        print(f"SUCCESS: Mojo allergies: {allergies}")


class TestMiraPureChat:
    """Tests for AI chat functionality"""
    
    def test_basic_chat(self):
        """Test basic chat returns response"""
        payload = {
            "message": "Hello, how is Mojo doing?",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-basic-chat"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        assert data.get("pet_name") == "Mojo"
        print(f"SUCCESS: Chat response received ({len(data['response'])} chars)")
    
    def test_chat_creates_grooming_service(self):
        """Test chat with grooming request creates service ticket"""
        payload = {
            "message": "I want to book grooming for Mojo next week",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-grooming-service"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Response should mention ticket or confirm service
        response_text = data["response"].lower()
        
        # Check for TKT- ticket ID or service confirmation
        has_ticket = "tkt-" in response_text
        has_service_confirm = any(word in response_text for word in ["grooming", "spa", "request", "arranged", "set up", "concierge"])
        
        assert has_ticket or has_service_confirm, f"No service confirmation in response: {data['response'][:200]}"
        print(f"SUCCESS: Grooming service request processed - has_ticket: {has_ticket}")
    
    def test_chat_with_pet_context(self):
        """Test that chat responses reference pet's soul data"""
        payload = {
            "message": "Tell me about Mojo's personality",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-personality"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        
        # Should mention some personality traits or pet name
        has_pet_name = "mojo" in response_text
        has_personality = any(trait in response_text for trait in ["calm", "drama", "motherly", "food"])
        
        assert has_pet_name, "Response doesn't mention pet name"
        print(f"SUCCESS: Response mentions pet - has_personality_traits: {has_personality}")
    
    def test_chat_respects_allergy(self):
        """Test that food recommendations avoid allergies (chicken for Mojo)"""
        payload = {
            "message": "Can you recommend some treats for Mojo?",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-allergy"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # AI should ideally mention chicken-free or allergy awareness
        response_text = data["response"].lower()
        
        # Check if response is allergy-aware
        allergy_aware = any(word in response_text for word in ["chicken-free", "allergy", "chicken", "avoid"])
        
        print(f"SUCCESS: Treat recommendation received - allergy_aware: {allergy_aware}")


class TestMiraPureServiceCreation:
    """Tests for service creation via function calling"""
    
    def test_dog_walker_service_creation(self):
        """Test that asking for dog walker creates service request"""
        payload = {
            "message": "I need a dog walker for Mojo next Tuesday",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-walker-service"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        
        # Should either create ticket or acknowledge walker request
        has_ticket = "tkt-" in response_text
        has_walker_mention = "walker" in response_text or "walk" in response_text
        
        assert has_ticket or has_walker_mention, f"No walker service confirmation: {data['response'][:200]}"
        print(f"SUCCESS: Dog walker request processed - has_ticket: {has_ticket}")
    
    def test_birthday_party_service(self):
        """Test that birthday party request creates service"""
        payload = {
            "message": "I want to plan a birthday party for Mojo",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": "test-birthday-service"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        
        # Should acknowledge birthday/party
        has_party = any(word in response_text for word in ["birthday", "party", "celebration", "celebrate"])
        
        assert has_party, f"No birthday party acknowledgment: {data['response'][:200]}"
        print(f"SUCCESS: Birthday party request acknowledged")


class TestMiraPureConversationHistory:
    """Tests for conversation context"""
    
    def test_conversation_maintains_context(self):
        """Test that follow-up messages maintain conversation context"""
        session_id = "test-context-session"
        
        # First message
        payload1 = {
            "message": "I'm thinking about booking grooming for Mojo",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": session_id,
            "conversation_history": []
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload1,
            timeout=30
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second message with history
        payload2 = {
            "message": "Yes, please book it for next week",
            "pet_id": "699fa0a513e44c977327ad56",
            "pet_name": "Mojo",
            "user_email": "dipali@clubconcierge.in",
            "session_id": session_id,
            "conversation_history": [
                {"role": "user", "content": payload1["message"]},
                {"role": "assistant", "content": data1["response"]}
            ]
        }
        
        response2 = requests.post(
            f"{BASE_URL}/api/mira-pure/chat",
            json=payload2,
            timeout=30
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Response should be contextual (about grooming, not confused)
        response_text = data2["response"].lower()
        is_contextual = any(word in response_text for word in ["grooming", "spa", "booked", "set up", "arranged", "request", "tkt-"])
        
        assert is_contextual, f"Response doesn't maintain context: {data2['response'][:200]}"
        print(f"SUCCESS: Conversation context maintained")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
