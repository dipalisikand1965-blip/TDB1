"""
Test Suite for Service Desk SLA and Messaging Features
Tests: SLA stats, auto-assignment, escalations, and two-way messaging
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petlife-os-4.preview.emergentagent.com')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


@pytest.fixture
def auth():
    """Return basic auth tuple"""
    return (ADMIN_USERNAME, ADMIN_PASSWORD)


@pytest.fixture
def api_client():
    """Shared requests session with auth"""
    session = requests.Session()
    session.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestSLAStats:
    """SLA Statistics endpoint tests"""
    
    def test_get_sla_stats(self, api_client):
        """GET /api/tickets/sla/stats - Should return SLA statistics"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "sla_breach_rate" in data
        assert "current_breached" in data
        assert "avg_resolution_hours" in data
        assert "avg_first_response_hours" in data
        assert "by_concierge" in data
        
        # Verify data types
        assert isinstance(data["sla_breach_rate"], (int, float))
        assert isinstance(data["current_breached"], int)
        assert isinstance(data["by_concierge"], list)
        
        print(f"SLA Stats: breach_rate={data['sla_breach_rate']}%, breached={data['current_breached']}")


class TestAutoAssignment:
    """Auto-assignment endpoint tests"""
    
    def test_auto_assign_single_ticket(self, api_client):
        """POST /api/tickets/sla/auto-assign/{ticket_id} - Auto-assign a ticket"""
        # First get a ticket
        tickets_response = api_client.get(f"{BASE_URL}/api/tickets/")
        assert tickets_response.status_code == 200
        tickets = tickets_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available for testing")
        
        ticket_id = tickets[0]["ticket_id"]
        
        # Try to auto-assign
        response = api_client.post(f"{BASE_URL}/api/tickets/sla/auto-assign/{ticket_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should either succeed or say already assigned
        assert "success" in data
        if data["success"]:
            assert "assigned_to" in data
            print(f"Ticket {ticket_id} assigned to: {data['assigned_to']}")
        else:
            assert "message" in data
            print(f"Auto-assign result: {data['message']}")
    
    def test_auto_assign_all_unassigned(self, api_client):
        """POST /api/tickets/sla/auto-assign-all - Auto-assign all unassigned tickets"""
        response = api_client.post(f"{BASE_URL}/api/tickets/sla/auto-assign-all")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "total_unassigned" in data
        assert "assigned_count" in data
        assert "assignments" in data
        
        assert isinstance(data["total_unassigned"], int)
        assert isinstance(data["assigned_count"], int)
        assert isinstance(data["assignments"], list)
        
        print(f"Auto-assign all: {data['assigned_count']}/{data['total_unassigned']} assigned")
    
    def test_auto_assign_nonexistent_ticket(self, api_client):
        """POST /api/tickets/sla/auto-assign/{ticket_id} - Should return 404 for nonexistent ticket"""
        response = api_client.post(f"{BASE_URL}/api/tickets/sla/auto-assign/TKT-NONEXISTENT-999")
        
        assert response.status_code == 404


class TestEscalations:
    """Escalation engine tests"""
    
    def test_check_escalations(self, api_client):
        """POST /api/tickets/sla/check-escalations - Check and escalate overdue tickets"""
        response = api_client.post(f"{BASE_URL}/api/tickets/sla/check-escalations")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "escalated_count" in data
        assert "notifications_sent" in data
        assert "details" in data
        
        assert isinstance(data["escalated_count"], int)
        assert isinstance(data["notifications_sent"], int)
        assert isinstance(data["details"], list)
        
        print(f"Escalations: {data['escalated_count']} escalated, {data['notifications_sent']} notifications")
    
    def test_get_breached_tickets(self, api_client):
        """GET /api/tickets/sla/breached - Get SLA breached tickets"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/breached")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "breached_tickets" in data
        assert "total" in data
        assert isinstance(data["breached_tickets"], list)
        
        print(f"Breached tickets: {data['total']}")
    
    def test_get_at_risk_tickets(self, api_client):
        """GET /api/tickets/sla/at-risk - Get tickets at risk of SLA breach"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/at-risk")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "at_risk_tickets" in data
        assert "total" in data
        assert isinstance(data["at_risk_tickets"], list)
        
        print(f"At-risk tickets: {data['total']}")


class TestMessaging:
    """Two-way messaging endpoint tests"""
    
    def test_send_email_message(self, api_client):
        """POST /api/tickets/messaging/send - Send message via email"""
        # Get a ticket with email
        tickets_response = api_client.get(f"{BASE_URL}/api/tickets/")
        tickets = tickets_response.json().get("tickets", [])
        
        ticket_with_email = None
        for t in tickets:
            if t.get("member", {}).get("email"):
                ticket_with_email = t
                break
        
        if not ticket_with_email:
            pytest.skip("No ticket with email found")
        
        response = api_client.post(f"{BASE_URL}/api/tickets/messaging/send", json={
            "ticket_id": ticket_with_email["ticket_id"],
            "message": "Test email message from pytest",
            "channel": "email",
            "is_internal": False
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "channel" in data
        assert data["channel"] == "email"
        
        if data["success"]:
            assert "email_id" in data
            print(f"Email sent successfully: {data['email_id']}")
        else:
            print(f"Email send result: {data}")
    
    def test_send_whatsapp_message(self, api_client):
        """POST /api/tickets/messaging/send - Send message via WhatsApp (generates click-to-chat link)"""
        # Get a ticket with phone
        tickets_response = api_client.get(f"{BASE_URL}/api/tickets/")
        tickets = tickets_response.json().get("tickets", [])
        
        ticket_with_phone = None
        for t in tickets:
            if t.get("member", {}).get("phone"):
                ticket_with_phone = t
                break
        
        if not ticket_with_phone:
            pytest.skip("No ticket with phone found")
        
        response = api_client.post(f"{BASE_URL}/api/tickets/messaging/send", json={
            "ticket_id": ticket_with_phone["ticket_id"],
            "message": "Test WhatsApp message from pytest",
            "channel": "whatsapp",
            "is_internal": False
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "channel" in data
        assert data["channel"] == "whatsapp"
        
        if data["success"]:
            assert "whatsapp_url" in data
            assert "wa.me" in data["whatsapp_url"]
            print(f"WhatsApp link generated: {data['whatsapp_url'][:50]}...")
    
    def test_send_message_nonexistent_ticket(self, api_client):
        """POST /api/tickets/messaging/send - Should return 404 for nonexistent ticket"""
        response = api_client.post(f"{BASE_URL}/api/tickets/messaging/send", json={
            "ticket_id": "TKT-NONEXISTENT-999",
            "message": "Test message",
            "channel": "email",
            "is_internal": False
        })
        
        assert response.status_code == 404
    
    def test_get_conversation_thread(self, api_client):
        """GET /api/tickets/messaging/{ticket_id}/thread - Get conversation thread"""
        # Get a ticket
        tickets_response = api_client.get(f"{BASE_URL}/api/tickets/")
        tickets = tickets_response.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available")
        
        ticket_id = tickets[0]["ticket_id"]
        
        response = api_client.get(f"{BASE_URL}/api/tickets/messaging/{ticket_id}/thread")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "ticket_id" in data
        assert "messages" in data
        assert "total" in data
        assert isinstance(data["messages"], list)
        
        print(f"Thread for {ticket_id}: {data['total']} messages")


class TestSLARules:
    """SLA and Assignment rules management tests"""
    
    def test_get_assignment_rules(self, api_client):
        """GET /api/tickets/sla/rules/assignment - Get assignment rules"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/rules/assignment")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rules" in data
        assert isinstance(data["rules"], list)
        
        print(f"Assignment rules: {len(data['rules'])} rules")
    
    def test_get_sla_rules(self, api_client):
        """GET /api/tickets/sla/rules/sla - Get SLA rules"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/rules/sla")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rules" in data
        assert "defaults" in data
        
        print(f"SLA rules: {len(data['rules'])} custom, {len(data['defaults'])} defaults")
    
    def test_get_escalation_rules(self, api_client):
        """GET /api/tickets/sla/rules/escalation - Get escalation rules"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/rules/escalation")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rules" in data
        assert isinstance(data["rules"], list)
        
        print(f"Escalation rules: {len(data['rules'])} rules")


class TestConciergeAvailability:
    """Concierge availability tests"""
    
    def test_get_concierge_availability(self, api_client):
        """GET /api/tickets/sla/concierges/availability - Get all concierge availability"""
        response = api_client.get(f"{BASE_URL}/api/tickets/sla/concierges/availability")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "concierges" in data
        assert isinstance(data["concierges"], list)
        
        for concierge in data["concierges"]:
            assert "concierge_id" in concierge
            assert "available" in concierge
            assert "current_tickets" in concierge
        
        print(f"Concierges: {len(data['concierges'])} found")


class TestTicketIntegration:
    """Integration tests for ticket workflow with SLA and messaging"""
    
    def test_full_ticket_workflow(self, api_client):
        """Test complete ticket workflow: create -> auto-assign -> send message -> check SLA"""
        # 1. Create a new ticket
        create_response = api_client.post(f"{BASE_URL}/api/tickets/", json={
            "member": {
                "name": "TEST_Integration User",
                "phone": "9999999999",
                "email": "test_integration@example.com",
                "city": "Mumbai",
                "country": "India"
            },
            "category": "shop",
            "urgency": "high",
            "description": "Integration test ticket - please ignore",
            "source": "internal"
        })
        
        assert create_response.status_code == 200
        ticket_data = create_response.json()
        ticket_id = ticket_data.get("ticket", {}).get("ticket_id") or ticket_data.get("ticket_id")
        
        assert ticket_id is not None
        print(f"Created ticket: {ticket_id}")
        
        # 2. Auto-assign the ticket
        assign_response = api_client.post(f"{BASE_URL}/api/tickets/sla/auto-assign/{ticket_id}")
        assert assign_response.status_code == 200
        assign_data = assign_response.json()
        print(f"Auto-assign result: {assign_data}")
        
        # 3. Send a message via email
        message_response = api_client.post(f"{BASE_URL}/api/tickets/messaging/send", json={
            "ticket_id": ticket_id,
            "message": "Thank you for contacting us. We are processing your request.",
            "channel": "email",
            "is_internal": False
        })
        assert message_response.status_code == 200
        message_data = message_response.json()
        print(f"Message sent: {message_data}")
        
        # 4. Get conversation thread
        thread_response = api_client.get(f"{BASE_URL}/api/tickets/messaging/{ticket_id}/thread")
        assert thread_response.status_code == 200
        thread_data = thread_response.json()
        assert thread_data["total"] >= 1
        print(f"Thread has {thread_data['total']} messages")
        
        # 5. Check SLA stats
        sla_response = api_client.get(f"{BASE_URL}/api/tickets/sla/stats")
        assert sla_response.status_code == 200
        print("SLA stats retrieved successfully")
        
        print(f"✅ Full workflow completed for ticket {ticket_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
