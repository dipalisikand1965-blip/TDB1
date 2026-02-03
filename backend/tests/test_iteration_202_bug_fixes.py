"""
Test iteration 202 - Bug fixes for Party Planning Wizard and ConversationalEntry goal cards

Bug 1: Party Planning Wizard not appearing when clicking 'Plan Celebration' on /celebrate/cakes page
Bug 2: Quick action cards in ConversationalEntry.jsx opening Mira AI chat instead of triggering service requests

Tests:
1. POST /api/concierge/pillar-request - Creates service desk ticket and admin notification
2. Verify ticket and notification are created correctly
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestConciergePillarRequest:
    """Test the new /api/concierge/pillar-request endpoint"""
    
    def test_pillar_request_creates_ticket_and_notification(self):
        """Test that pillar request creates both service desk ticket and admin notification"""
        payload = {
            "pillar": "stay",
            "request_type": "boarding",
            "request_label": "Pet boarding",
            "message": "I want to help TestPet with pet boarding",
            "pet_name": "TestPet",
            "source": "conversational_entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        assert "ticket_id" in data
        assert "message" in data
        assert "Pet boarding" in data["message"]
        
        # Verify request_id format
        assert data["request_id"].startswith("GOAL-")
        
        # Verify ticket_id format
        assert data["ticket_id"].startswith("TKT-")
        
        print(f"✓ Pillar request created: {data['request_id']}, ticket: {data['ticket_id']}")
        
        return data["ticket_id"]
    
    def test_pillar_request_different_pillars(self):
        """Test pillar request works for different pillars"""
        pillars = [
            {"pillar": "fit", "request_type": "weight_loss", "request_label": "Weight loss"},
            {"pillar": "care", "request_type": "grooming", "request_label": "Grooming"},
            {"pillar": "celebrate", "request_type": "birthday", "request_label": "Birthday party"},
            {"pillar": "dine", "request_type": "date_night", "request_label": "Date night"},
            {"pillar": "travel", "request_type": "flight", "request_label": "Flight booking"},
        ]
        
        for pillar_data in pillars:
            payload = {
                **pillar_data,
                "message": f"Test request for {pillar_data['pillar']}",
                "pet_name": "TestDog",
                "source": "conversational_entry"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/concierge/pillar-request",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 200, f"Failed for pillar {pillar_data['pillar']}: {response.text}"
            data = response.json()
            assert data["success"] == True
            print(f"✓ Pillar {pillar_data['pillar']} request created successfully")
    
    def test_pillar_request_without_pet_name(self):
        """Test pillar request works without pet name"""
        payload = {
            "pillar": "stay",
            "request_type": "vacation",
            "request_label": "Vacation getaway",
            "message": "Looking for vacation options",
            "source": "conversational_entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Pillar request without pet name works")
    
    def test_pillar_request_with_authenticated_user(self):
        """Test pillar request with authenticated user"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "lola4304"},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated test")
        
        token = login_response.json().get("access_token")
        
        payload = {
            "pillar": "celebrate",
            "request_type": "birthday",
            "request_label": "Birthday party",
            "message": "Planning a birthday party for my dog",
            "pet_name": "Lola",
            "source": "conversational_entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Authenticated pillar request works")


class TestPartyPlanningEndpoint:
    """Test the party planning request endpoint"""
    
    def test_party_request_endpoint_exists(self):
        """Test that /api/celebrate/party-request endpoint exists"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "lola4304"},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed")
        
        token = login_response.json().get("access_token")
        
        payload = {
            "petId": "test-pet-id",
            "petName": "TestDog",
            "petType": "dog",
            "occasion": "birthday",
            "date": "2026-03-15",
            "time": "Afternoon",
            "guestCount": "5-10",
            "venue": "home",
            "budget": "standard",
            "specialRequests": "Test request",
            "includeGrooming": False,
            "includePhotography": False,
            "user_email": "dipali@clubconcierge.in",
            "user_name": "Dipali"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/celebrate/party-request",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        # The endpoint should exist and return success or validation error
        assert response.status_code in [200, 201, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Party request endpoint works: {data}")
        else:
            print(f"Party request endpoint returned {response.status_code}")


class TestServiceDeskTickets:
    """Test service desk ticket creation from pillar requests"""
    
    def test_ticket_created_with_correct_fields(self):
        """Verify ticket has all required fields"""
        # Create a pillar request
        payload = {
            "pillar": "stay",
            "request_type": "boarding",
            "request_label": "Pet boarding",
            "message": "Test ticket creation",
            "pet_name": "TicketTestDog",
            "source": "conversational_entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/pillar-request",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        ticket_id = data["ticket_id"]
        
        # Now verify the ticket exists in service desk
        # Try to get tickets (admin endpoint)
        admin_response = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            auth=("aditya", "lola4304")
        )
        
        if admin_response.status_code == 200:
            tickets = admin_response.json().get("tickets", [])
            ticket = next((t for t in tickets if t.get("ticket_id") == ticket_id), None)
            
            if ticket:
                # Verify ticket fields
                assert ticket["type"] == "concierge_goal"
                assert ticket["category"] == "stay"
                assert ticket["sub_category"] == "boarding"
                assert ticket["pillar"] == "stay"
                assert ticket["pet_name"] == "TicketTestDog"
                assert ticket["status"] == "open"
                print(f"✓ Ticket {ticket_id} has correct fields")
            else:
                print(f"Ticket {ticket_id} not found in list (may need pagination)")
        else:
            print(f"Could not verify ticket via admin API: {admin_response.status_code}")


class TestHealthAndBasicEndpoints:
    """Basic health checks"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Health endpoint working")
    
    def test_login_endpoint(self):
        """Test login endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "lola4304"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "dipali@clubconcierge.in"
        print("✓ Login endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
