"""
Test Mira OS In-App Service Request Flow
P0: Fix where service/experience cards were linking externally instead of opening a modal
P1: Add 'Let Concierge Handle It' tile alongside service options

Tests verify that:
1. Service desk API accepts service request submissions
2. Tickets are created correctly with proper pillar mapping
3. Intent secondary should be a list, not string
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraServiceRequestAPI:
    """Test the service desk API used by the service request modal"""
    
    def test_create_service_ticket_grooming(self):
        """Test creating a grooming service ticket"""
        response = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "pillar": "Care",
            "intent_primary": "GROOMING",
            "intent_secondary": ["SERVICE"],  # Must be a list
            "life_state": "PLANNING",
            "channel": "mira_os_demo",
            "initial_message": {
                "sender": "parent",
                "source": "mira_os",
                "text": "TEST: Grooming request for Buddy - needs full groom session"
            }
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "ticket_id" in data, "Response should contain ticket_id"
        assert data["ticket_id"].startswith("TCK-"), f"Ticket ID should start with TCK-: {data['ticket_id']}"
        print(f"✅ Grooming ticket created: {data['ticket_id']}")
    
    def test_create_experience_ticket_party(self):
        """Test creating a party planning experience ticket"""
        response = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "pillar": "Celebrate",
            "intent_primary": "PARTY_PLANNING_WIZARD",
            "intent_secondary": ["EXPERIENCE"],  # Must be a list
            "life_state": "PLANNING",
            "channel": "mira_os_demo",
            "initial_message": {
                "sender": "parent",
                "source": "mira_os",
                "text": "TEST: Party planning request for Buddy's birthday"
            }
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "ticket_id" in data, "Response should contain ticket_id"
        print(f"✅ Party planning ticket created: {data['ticket_id']}")
    
    def test_create_concierge_direct_ticket(self):
        """Test creating a 'Let Concierge Handle It' ticket"""
        response = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "pillar": "General",
            "intent_primary": "LET_CONCIERGE_HANDLE_IT",
            "intent_secondary": ["SERVICE"],
            "life_state": "PLANNING",
            "channel": "mira_os_demo",
            "initial_message": {
                "sender": "parent",
                "source": "mira_os",
                "text": "TEST: Please handle this for me - I need help with my pet"
            }
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "ticket_id" in data, "Response should contain ticket_id"
        print(f"✅ Concierge direct ticket created: {data['ticket_id']}")
    
    def test_intent_secondary_must_be_list(self):
        """Test that intent_secondary must be a list (not string)"""
        # This should fail with 422 if intent_secondary is a string
        response = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "pillar": "Care",
            "intent_primary": "GROOMING",
            "intent_secondary": "SERVICE",  # This is WRONG - should be a list
            "life_state": "PLANNING",
            "channel": "mira_os_demo",
            "initial_message": {
                "sender": "parent",
                "source": "mira_os",
                "text": "TEST: This should fail"
            }
        })
        
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422 for string intent_secondary, got {response.status_code}"
        print("✅ Correctly rejected string intent_secondary (expects list)")
    
    def test_various_pillars(self):
        """Test ticket creation for different service pillars"""
        pillar_intents = [
            ("Care", "WALKS_AND_SITTING"),
            ("Learn", "TRAINING"),
            ("Stay", "BOARDING"),
            ("Stay", "PAWCATION"),
            ("Travel", "TRAVEL_PLANNING"),
            ("Dine", "CHEFS_TABLE"),
        ]
        
        for pillar, intent in pillar_intents:
            response = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json={
                "parent_id": "TEST_demo-user",
                "pet_id": "TEST_demo-pet",
                "pillar": pillar,
                "intent_primary": intent,
                "intent_secondary": ["SERVICE"],
                "life_state": "PLANNING",
                "channel": "mira_os_demo",
                "initial_message": {
                    "sender": "parent",
                    "source": "mira_os",
                    "text": f"TEST: Request for {intent}"
                }
            })
            
            assert response.status_code == 200, f"Failed for {pillar}/{intent}: {response.status_code} {response.text}"
            print(f"✅ {pillar}/{intent} ticket created")


class TestMiraRouteIntent:
    """Test the route intent API used to determine service category"""
    
    def test_grooming_intent_detection(self):
        """Test that grooming query routes to Care pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/route_intent", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "utterance": "Buddy needs a haircut and grooming",
            "source_event": "search",
            "device": "web",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age_years": 3,
                "allergies": [],
                "notes": []
            }
        })
        
        assert response.status_code == 200, f"Route intent failed: {response.status_code}"
        data = response.json()
        assert "pillar" in data, "Response should contain pillar"
        # Grooming should map to Care pillar or Grooming
        assert data.get("pillar") in ["Care", "Grooming"], f"Expected Care or Grooming pillar, got {data.get('pillar')}"
        print(f"✅ Grooming intent detected: pillar={data.get('pillar')}")
    
    def test_birthday_intent_detection(self):
        """Test that birthday query routes to Celebrate pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/route_intent", json={
            "parent_id": "TEST_demo-user",
            "pet_id": "TEST_demo-pet",
            "utterance": "I want to plan Buddy's birthday party",
            "source_event": "search",
            "device": "web",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age_years": 3,
                "allergies": [],
                "notes": []
            }
        })
        
        assert response.status_code == 200, f"Route intent failed: {response.status_code}"
        data = response.json()
        assert "pillar" in data, "Response should contain pillar"
        assert data.get("pillar") == "Celebrate", f"Expected Celebrate pillar, got {data.get('pillar')}"
        print(f"✅ Birthday intent detected: pillar={data.get('pillar')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
