"""
Test Iteration 118: Mira Behavior Framework
============================================
Tests for:
1. Mandatory opening line in Mira chat responses
2. Breed-specific guidance (Golden Retriever test)
3. Emergency keyword escalation
4. Section-aware behavior
5. Voice Mira health escalation patterns (frontend code review)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraMandatoryOpeningLine:
    """Test that Mira returns the mandatory opening line"""
    
    def test_mira_chat_returns_opening_line(self):
        """Verify Mira's response starts with mandatory opening line"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello",
                "session_id": "test-opening-line-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        
        # Check for mandatory opening line
        mandatory_opening = "Hi, I'm Mira. I can help explain things, guide you to the right place, or connect you with our Concierge."
        assert mandatory_opening in data["response"], f"Response should contain mandatory opening line. Got: {data['response'][:200]}"
        
        print(f"✅ Mandatory opening line verified: {data['response'][:150]}...")

    def test_mira_chat_creates_ticket(self):
        """Verify Mira creates a ticket for each conversation"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need help with my dog",
                "session_id": "test-ticket-creation-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "ticket_id" in data, "Response should contain ticket_id"
        assert data["ticket_id"].startswith("ADV-") or data["ticket_id"].startswith("CNC-") or data["ticket_id"].startswith("EMG-"), \
            f"Ticket ID should have proper prefix. Got: {data['ticket_id']}"
        
        print(f"✅ Ticket created: {data['ticket_id']}")


class TestMiraBreedSpecificGuidance:
    """Test breed-specific guidance using AKC reference data"""
    
    def test_golden_retriever_guidance(self):
        """Verify Mira provides Golden Retriever specific health tips"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I have a Golden Retriever, what health tips should I know?",
                "session_id": "test-golden-retriever-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        
        # Golden Retriever specific concerns from BREED_HEALTH_DATA
        golden_keywords = ["weight", "exercise", "joint", "hip", "cancer", "obesity"]
        found_keywords = [kw for kw in golden_keywords if kw in response_text]
        
        assert len(found_keywords) >= 2, f"Response should mention Golden Retriever health concerns. Found: {found_keywords}. Response: {data['response'][:300]}"
        
        print(f"✅ Golden Retriever guidance verified. Keywords found: {found_keywords}")

    def test_labrador_guidance(self):
        """Verify Mira provides Labrador specific guidance"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I have a Labrador, any diet tips?",
                "session_id": "test-labrador-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        
        # Labrador specific concerns - obesity prone
        lab_keywords = ["portion", "weight", "overeat", "food", "obesity"]
        found_keywords = [kw for kw in lab_keywords if kw in response_text]
        
        assert len(found_keywords) >= 1, f"Response should mention Labrador diet concerns. Found: {found_keywords}"
        
        print(f"✅ Labrador guidance verified. Keywords found: {found_keywords}")


class TestMiraEmergencyEscalation:
    """Test emergency keyword detection and immediate escalation"""
    
    def test_emergency_bleeding_escalation(self):
        """Verify bleeding emergency triggers immediate escalation"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "My dog is bleeding badly!",
                "session_id": "test-emergency-bleeding-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "emergency", f"Pillar should be 'emergency'. Got: {data['pillar']}"
        assert data["ticket_type"] == "emergency", f"Ticket type should be 'emergency'. Got: {data['ticket_type']}"
        
        # Check for emergency response indicators
        response_text = data["response"].upper()
        assert "EMERGENCY" in response_text or "URGENT" in response_text, \
            f"Response should indicate emergency. Got: {data['response'][:200]}"
        
        print(f"✅ Emergency escalation verified for bleeding. Pillar: {data['pillar']}, Type: {data['ticket_type']}")

    def test_emergency_not_breathing_escalation(self):
        """Verify 'not breathing' triggers emergency escalation"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "My dog is not breathing!",
                "session_id": "test-emergency-breathing-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "emergency", f"Pillar should be 'emergency'. Got: {data['pillar']}"
        assert data["ticket_type"] == "emergency", f"Ticket type should be 'emergency'. Got: {data['ticket_type']}"
        
        print(f"✅ Emergency escalation verified for 'not breathing'. Pillar: {data['pillar']}")

    def test_emergency_seizure_escalation(self):
        """Verify seizure triggers emergency escalation"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "My dog is having a seizure!",
                "session_id": "test-emergency-seizure-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "emergency", f"Pillar should be 'emergency'. Got: {data['pillar']}"
        
        print(f"✅ Emergency escalation verified for seizure. Pillar: {data['pillar']}")

    def test_emergency_lost_pet_escalation(self):
        """Verify lost pet triggers emergency escalation"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "My dog is missing! I can't find him!",
                "session_id": "test-emergency-lost-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "emergency", f"Pillar should be 'emergency'. Got: {data['pillar']}"
        
        print(f"✅ Emergency escalation verified for lost pet. Pillar: {data['pillar']}")


class TestMiraSectionAwareBehavior:
    """Test section-aware behavior based on current pillar"""
    
    def test_care_pillar_context(self):
        """Verify Mira responds appropriately in Care context"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need grooming for my dog",
                "session_id": "test-care-context-118",
                "source": "web_widget",
                "current_pillar": "care"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should detect care pillar
        assert data["pillar"] == "care", f"Pillar should be 'care'. Got: {data['pillar']}"
        
        print(f"✅ Care pillar context verified. Pillar: {data['pillar']}")

    def test_travel_pillar_context(self):
        """Verify Mira responds appropriately in Travel context"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to travel with my dog",
                "session_id": "test-travel-context-118",
                "source": "web_widget",
                "current_pillar": "travel"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "travel", f"Pillar should be 'travel'. Got: {data['pillar']}"
        
        print(f"✅ Travel pillar context verified. Pillar: {data['pillar']}")


class TestMiraTicketTypes:
    """Test different ticket types based on intent"""
    
    def test_advisory_ticket_for_questions(self):
        """Verify advisory ticket is created for general questions"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What food is best for puppies?",
                "session_id": "test-advisory-ticket-118",
                "source": "web_widget"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["ticket_type"] == "advisory", f"Ticket type should be 'advisory'. Got: {data['ticket_type']}"
        assert data["ticket_id"].startswith("ADV-"), f"Advisory ticket should start with ADV-. Got: {data['ticket_id']}"
        
        print(f"✅ Advisory ticket verified: {data['ticket_id']}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
