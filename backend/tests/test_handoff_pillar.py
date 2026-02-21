"""
Test Suite for HandoffSummary Pillar Detection and Edit Functionality
=====================================================================
Tests for:
1. Backend endpoint /api/service_desk/handoff_to_concierge accepts pillar parameter
2. Pillar detection correctly identifies 'grooming' as 'groom' pillar
3. Backend correctly stores the edited pillar from user
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHandoffToConcierge:
    """Tests for the handoff_to_concierge endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a ticket for testing handoff"""
        self.test_ticket_id = f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.parent_id = "test-parent-001"
        self.pet_id = "test-pet-001"
    
    def test_handoff_endpoint_exists(self):
        """Test that the handoff endpoint exists and responds"""
        # First create a ticket to test handoff
        create_response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.parent_id,
                "pet_id": self.pet_id,
                "pillar": "Grooming",
                "intent_primary": "GROOM_PLAN",
                "intent_secondary": [],
                "life_state": "PLAN",
                "channel": "Mira_OS",
                "initial_message": {
                    "sender": "parent",
                    "source": "Mira_OS",
                    "text": "I need grooming for my dog"
                }
            }
        )
        assert create_response.status_code == 200, f"Failed to create ticket: {create_response.text}"
        ticket_data = create_response.json()
        ticket_id = ticket_data.get("ticket_id")
        assert ticket_id is not None, "No ticket_id returned"
        
        # Now test handoff with pillar parameter
        handoff_response = requests.post(
            f"{BASE_URL}/api/service_desk/handoff_to_concierge",
            json={
                "ticket_id": ticket_id,
                "concierge_queue": "GROOMING",
                "latest_mira_summary": "Parent needs grooming for their pet",
                "pillar": "groom",  # Test passing pillar
                "request_title": "Grooming Request"
            }
        )
        
        assert handoff_response.status_code == 200, f"Handoff failed: {handoff_response.text}"
        data = handoff_response.json()
        assert data.get("success") == True
        assert data.get("status") == "open_concierge"
        assert data.get("concierge_queue") == "GROOMING"
        print(f"✅ Handoff endpoint accepts pillar parameter - ticket: {ticket_id}")
    
    def test_pillar_is_stored_correctly(self):
        """Test that the pillar is stored in the ticket after handoff"""
        # Create a ticket with initial pillar as "celebrate" (simulating the bug scenario)
        create_response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": self.parent_id,
                "pet_id": self.pet_id,
                "pillar": "Celebrate",  # Initial pillar (wrong)
                "intent_primary": "GROOM_PLAN",  # But intent says grooming
                "intent_secondary": [],
                "life_state": "PLAN",
                "channel": "Mira_OS",
                "initial_message": {
                    "sender": "parent",
                    "source": "Mira_OS",
                    "text": "I need grooming for my dog Luna"
                }
            }
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("ticket_id")
        
        # Handoff with corrected pillar - user edited to "groom"
        handoff_response = requests.post(
            f"{BASE_URL}/api/service_desk/handoff_to_concierge",
            json={
                "ticket_id": ticket_id,
                "concierge_queue": "GROOMING",
                "latest_mira_summary": "Parent needs grooming for Luna",
                "pillar": "groom",  # User corrected pillar
                "request_title": "Grooming for Luna"
            }
        )
        
        assert handoff_response.status_code == 200
        
        # Verify the ticket was updated with correct pillar
        get_ticket_response = requests.get(f"{BASE_URL}/api/service_desk/ticket/{ticket_id}")
        assert get_ticket_response.status_code == 200
        ticket = get_ticket_response.json()
        
        # The pillar should now be "groom" (user edited)
        assert ticket.get("pillar") == "groom", f"Expected pillar 'groom', got '{ticket.get('pillar')}'"
        assert ticket.get("request_title") == "Grooming for Luna"
        print(f"✅ Pillar correctly stored after edit - ticket: {ticket_id}")
    
    def test_handoff_with_different_pillars(self):
        """Test handoff with various pillar values"""
        test_pillars = [
            ("groom", "GROOMING"),
            ("care", "CARE"),
            ("celebrate", "CELEBRATE"),
            ("travel", "TRAVEL"),
            ("dine", "DINE"),
            ("shop", "SHOP"),
            ("emergency", "EMERGENCY")
        ]
        
        for pillar, expected_queue in test_pillars:
            # Create ticket
            create_response = requests.post(
                f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
                json={
                    "parent_id": f"{self.parent_id}-{pillar}",
                    "pet_id": self.pet_id,
                    "pillar": "General",  # Start with generic
                    "intent_primary": "GENERAL_HELP",
                    "intent_secondary": [],
                    "life_state": "EXPLORE",
                    "channel": "Mira_OS",
                    "initial_message": {
                        "sender": "parent",
                        "source": "Mira_OS",
                        "text": f"Test for {pillar}"
                    }
                }
            )
            
            if create_response.status_code != 200:
                print(f"⚠️ Could not create ticket for pillar {pillar}: {create_response.text}")
                continue
            
            ticket_id = create_response.json().get("ticket_id")
            
            # Handoff with specific pillar
            handoff_response = requests.post(
                f"{BASE_URL}/api/service_desk/handoff_to_concierge",
                json={
                    "ticket_id": ticket_id,
                    "concierge_queue": expected_queue,
                    "latest_mira_summary": f"Test request for {pillar}",
                    "pillar": pillar
                }
            )
            
            assert handoff_response.status_code == 200, f"Handoff failed for pillar {pillar}"
            print(f"✅ Pillar '{pillar}' -> Queue '{expected_queue}' works correctly")


class TestRouteIntent:
    """Tests for intent routing and pillar detection"""
    
    def test_grooming_intent_detection(self):
        """Test that grooming-related utterances are correctly classified"""
        grooming_utterances = [
            "I need grooming for my dog",
            "Can you help with grooming",
            "Looking for a groomer",
            "My dog needs a haircut",
            "Need to book a bath for my pet",
            "Nail trim needed"
        ]
        
        for utterance in grooming_utterances:
            response = requests.post(
                f"{BASE_URL}/api/mira/route_intent",
                json={
                    "parent_id": "test-parent",
                    "pet_id": "test-pet",
                    "utterance": utterance,
                    "source_event": "search",
                    "device": "web"
                }
            )
            
            assert response.status_code == 200, f"Route intent failed for: {utterance}"
            data = response.json()
            
            # Should detect as Grooming pillar
            assert data.get("pillar") == "Grooming", f"Expected 'Grooming' pillar for '{utterance}', got '{data.get('pillar')}'"
            assert "GROOM" in data.get("intent_primary", ""), f"Expected GROOM intent for '{utterance}'"
            print(f"✅ '{utterance[:30]}...' -> Pillar: {data.get('pillar')}, Intent: {data.get('intent_primary')}")


class TestHandoffModel:
    """Tests for HandoffToConciergeRequest model"""
    
    def test_model_accepts_pillar_field(self):
        """Verify the request model accepts pillar and request_title fields"""
        # Create a ticket first
        create_response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": "test-model-parent",
                "pet_id": "test-model-pet",
                "pillar": "General",
                "intent_primary": "GENERAL_HELP",
                "intent_secondary": [],
                "life_state": "EXPLORE",
                "channel": "Mira_OS",
                "initial_message": {
                    "sender": "parent",
                    "source": "Mira_OS",
                    "text": "Model test"
                }
            }
        )
        ticket_id = create_response.json().get("ticket_id")
        
        # Test with all new fields
        response = requests.post(
            f"{BASE_URL}/api/service_desk/handoff_to_concierge",
            json={
                "ticket_id": ticket_id,
                "concierge_queue": "GROOMING",
                "latest_mira_summary": "Test summary",
                "pillar": "groom",  # New field
                "request_title": "Test Title"  # New field
            }
        )
        
        assert response.status_code == 200, f"Request with new fields failed: {response.text}"
        print("✅ HandoffToConciergeRequest model accepts pillar and request_title fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
