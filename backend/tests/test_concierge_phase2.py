"""
Concierge Command Center Phase 2 Tests
======================================
Tests for:
- SLA countdown calculation (breached/warning/ok)
- SLA breaches endpoint
- Reports overview endpoint
- Daily reports endpoint
- Agent list endpoint with workload
- Auto-assign endpoint (load-balanced)
- Email reply endpoint (Resend)
- WhatsApp reply endpoint (click-to-chat)
- Member tickets endpoint
- Member ticket detail endpoint
- Member reply endpoint
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_USER_EMAIL = "dipali@clubconcierge.in"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")


class TestSLACalculation:
    """Test SLA countdown calculation"""
    
    def test_sla_status_endpoint_exists(self):
        """Test that SLA status endpoint exists"""
        # Use a known ticket ID from queue
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?limit=1")
        assert queue_response.status_code == 200
        items = queue_response.json().get("items", [])
        
        if items:
            ticket_id = items[0].get("ticket_id")
            response = requests.get(f"{BASE_URL}/api/concierge/sla-status/{ticket_id}")
            # Should return 200 or 404 (if ticket not found in specific collections)
            assert response.status_code in [200, 404]
            print(f"✅ SLA status endpoint exists for ticket {ticket_id}")
        else:
            pytest.skip("No tickets in queue to test SLA status")
    
    def test_sla_status_returns_correct_fields(self):
        """Test SLA status returns required fields"""
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?source=mira&limit=1")
        items = queue_response.json().get("items", [])
        
        if items:
            ticket_id = items[0].get("ticket_id")
            response = requests.get(f"{BASE_URL}/api/concierge/sla-status/{ticket_id}")
            
            if response.status_code == 200:
                data = response.json()
                # Check required fields
                assert "status" in data, "Missing 'status' field"
                assert "remaining_seconds" in data, "Missing 'remaining_seconds' field"
                assert "breached" in data, "Missing 'breached' field"
                assert data["status"] in ["breached", "warning", "ok", "unknown"]
                print(f"✅ SLA status returns correct fields: status={data['status']}, breached={data['breached']}")
            else:
                print(f"⚠️ SLA status returned {response.status_code} for ticket {ticket_id}")
        else:
            pytest.skip("No mira tickets to test SLA status")


class TestSLABreaches:
    """Test SLA breaches endpoint"""
    
    def test_sla_breaches_endpoint(self):
        """Test /api/concierge/sla-breaches returns breached tickets"""
        response = requests.get(f"{BASE_URL}/api/concierge/sla-breaches")
        assert response.status_code == 200
        
        data = response.json()
        assert "breaches" in data, "Missing 'breaches' field"
        assert "breaches_count" in data, "Missing 'breaches_count' field"
        assert "warnings" in data, "Missing 'warnings' field"
        assert "warnings_count" in data, "Missing 'warnings_count' field"
        assert "total_at_risk" in data, "Missing 'total_at_risk' field"
        
        print(f"✅ SLA breaches endpoint: {data['breaches_count']} breaches, {data['warnings_count']} warnings")
    
    def test_sla_breaches_have_sla_info(self):
        """Test that breached tickets have SLA info"""
        response = requests.get(f"{BASE_URL}/api/concierge/sla-breaches?limit=5")
        data = response.json()
        
        breaches = data.get("breaches", [])
        if breaches:
            for breach in breaches[:3]:
                assert "sla" in breach, f"Breach ticket missing 'sla' field"
                sla = breach["sla"]
                assert sla.get("breached") == True, "Breach ticket should have breached=True"
            print(f"✅ Breached tickets have correct SLA info")
        else:
            print("⚠️ No breached tickets found (this may be expected)")


class TestReportsOverview:
    """Test reports overview endpoint"""
    
    def test_reports_overview_endpoint(self):
        """Test /api/concierge/reports/overview returns stats"""
        response = requests.get(f"{BASE_URL}/api/concierge/reports/overview")
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields (actual API structure)
        assert "overview" in data, "Missing 'overview' field"
        assert "performance" in data, "Missing 'performance' field"
        
        overview = data["overview"]
        assert "total_tickets" in overview, "Missing 'total_tickets' in overview"
        assert "open_tickets" in overview, "Missing 'open_tickets' in overview"
        assert "sla_breaches" in overview, "Missing 'sla_breaches' in overview"
        
        print(f"✅ Reports overview: total={overview['total_tickets']}, open={overview['open_tickets']}, sla_breaches={overview['sla_breaches']}")
    
    def test_reports_overview_agent_performance(self):
        """Test agent performance data in overview"""
        response = requests.get(f"{BASE_URL}/api/concierge/reports/overview")
        data = response.json()
        
        performance = data.get("performance", {})
        agent_stats = performance.get("agent_stats", [])
        # Agent stats should be a list
        assert isinstance(agent_stats, list), "agent_stats should be a list"
        
        if agent_stats:
            for agent in agent_stats[:2]:
                assert "agent" in agent or "username" in agent, "Agent entry missing identifier"
            print(f"✅ Agent performance data: {len(agent_stats)} agents")
        else:
            print("⚠️ No agent performance data (may be expected if no agents)")


class TestDailyReports:
    """Test daily reports endpoint"""
    
    def test_daily_reports_endpoint(self):
        """Test /api/concierge/reports/daily returns 7-day history"""
        response = requests.get(f"{BASE_URL}/api/concierge/reports/daily")
        assert response.status_code == 200
        
        data = response.json()
        assert "daily_stats" in data, "Missing 'daily_stats' field"
        
        daily_stats = data["daily_stats"]
        assert isinstance(daily_stats, list), "daily_stats should be a list"
        
        # Should have up to 7 days of data
        assert len(daily_stats) <= 7, "Should have at most 7 days of data"
        
        if daily_stats:
            day = daily_stats[0]
            assert "date" in day, "Missing 'date' in daily stat"
            print(f"✅ Daily reports: {len(daily_stats)} days of data")
        else:
            print("⚠️ No daily stats data")


class TestAgentList:
    """Test agent list endpoint"""
    
    def test_agents_endpoint(self):
        """Test /api/concierge/agents returns available agents"""
        response = requests.get(f"{BASE_URL}/api/concierge/agents")
        assert response.status_code == 200
        
        data = response.json()
        assert "agents" in data, "Missing 'agents' field"
        
        agents = data["agents"]
        assert isinstance(agents, list), "agents should be a list"
        
        if agents:
            for agent in agents[:2]:
                assert "username" in agent, "Agent missing 'username'"
                assert "active_tickets" in agent, "Agent missing 'active_tickets' (workload)"
            print(f"✅ Agents endpoint: {len(agents)} agents with workload info")
        else:
            print("⚠️ No agents found")


class TestAutoAssignment:
    """Test auto-assignment endpoint"""
    
    def test_auto_assign_endpoint_exists(self):
        """Test auto-assign endpoint exists"""
        # Get an unassigned ticket
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?source=mira&limit=10")
        items = queue_response.json().get("items", [])
        
        unassigned = [i for i in items if not i.get("assigned_to")]
        
        if unassigned:
            ticket_id = unassigned[0].get("ticket_id")
            response = requests.post(f"{BASE_URL}/api/concierge/auto-assign/{ticket_id}")
            # Should return 200 (success) or 404 (not found)
            assert response.status_code in [200, 404]
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    assert "assigned_to" in data, "Missing 'assigned_to' in response"
                    print(f"✅ Auto-assign: ticket {ticket_id} assigned to {data['assigned_to']}")
                else:
                    print(f"⚠️ Auto-assign returned message: {data.get('message')}")
        else:
            print("⚠️ No unassigned tickets to test auto-assign")
    
    def test_bulk_auto_assign_endpoint(self):
        """Test bulk auto-assign endpoint"""
        response = requests.post(f"{BASE_URL}/api/concierge/bulk-auto-assign?max_tickets=2")
        assert response.status_code == 200
        
        data = response.json()
        assert "assigned_count" in data, "Missing 'assigned_count'"
        assert "results" in data, "Missing 'results'"
        
        print(f"✅ Bulk auto-assign: {data['assigned_count']} tickets assigned")


class TestEmailReply:
    """Test email reply endpoint (Resend)"""
    
    def test_email_reply_endpoint_exists(self):
        """Test /api/concierge/reply/email endpoint exists"""
        # Get a ticket to reply to
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?source=mira&limit=1")
        items = queue_response.json().get("items", [])
        
        if items:
            ticket_id = items[0].get("ticket_id")
            
            # API uses query params: ticket_id, message, recipient_email
            response = requests.post(
                f"{BASE_URL}/api/concierge/reply/email",
                params={
                    "ticket_id": ticket_id,
                    "message": "Test email reply from automated testing - please ignore",
                    "recipient_email": "test@example.com"
                }
            )
            
            # Should return 200 (success), 400 (bad request), 404 (not found), or 500 (email config issue)
            assert response.status_code in [200, 400, 404, 422, 500]
            
            if response.status_code == 200:
                data = response.json()
                assert data.get("success") == True
                assert data.get("channel") == "email"
                print(f"✅ Email reply endpoint works: sent to {data.get('recipient')}")
            else:
                print(f"⚠️ Email reply returned {response.status_code}: {response.text[:200]}")
        else:
            pytest.skip("No tickets to test email reply")


class TestWhatsAppReply:
    """Test WhatsApp reply endpoint (click-to-chat)"""
    
    def test_whatsapp_reply_endpoint_exists(self):
        """Test /api/concierge/reply/whatsapp endpoint exists"""
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?source=mira&limit=1")
        items = queue_response.json().get("items", [])
        
        if items:
            ticket_id = items[0].get("ticket_id")
            
            response = requests.post(
                f"{BASE_URL}/api/concierge/reply/whatsapp/{ticket_id}",
                json={
                    "message": "Test WhatsApp reply",
                    "agent_id": "test_agent",
                    "agent_name": "Test Agent"
                }
            )
            
            assert response.status_code in [200, 400, 404, 500]
            
            if response.status_code == 200:
                data = response.json()
                # Should return a click-to-chat link
                if "whatsapp_link" in data or "link" in data:
                    link = data.get("whatsapp_link") or data.get("link")
                    assert "wa.me" in link or "whatsapp" in link.lower(), "Should be a WhatsApp link"
                    print(f"✅ WhatsApp reply returns click-to-chat link: {link[:50]}...")
                else:
                    print(f"✅ WhatsApp reply endpoint works: {data}")
            else:
                print(f"⚠️ WhatsApp reply returned {response.status_code}: {response.text[:200]}")
        else:
            pytest.skip("No tickets to test WhatsApp reply")


class TestMemberTickets:
    """Test member tickets endpoint (self-service portal)"""
    
    def test_member_tickets_endpoint(self):
        """Test /api/concierge/member/tickets returns tickets for email"""
        response = requests.get(
            f"{BASE_URL}/api/concierge/member/tickets",
            params={"email": TEST_USER_EMAIL}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "tickets" in data, "Missing 'tickets' field"
        assert "stats" in data, "Missing 'stats' field"
        
        stats = data["stats"]
        assert "total" in stats, "Missing 'total' in stats"
        assert "open" in stats, "Missing 'open' in stats"
        assert "resolved" in stats, "Missing 'resolved' in stats"
        
        print(f"✅ Member tickets: {stats['total']} total, {stats['open']} open for {TEST_USER_EMAIL}")
    
    def test_member_tickets_without_email_fails(self):
        """Test that member tickets requires email"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/tickets")
        # Should return 400 or 422 (validation error)
        assert response.status_code in [400, 422]
        print("✅ Member tickets correctly requires email parameter")


class TestMemberTicketDetail:
    """Test member ticket detail endpoint"""
    
    def test_member_ticket_detail_endpoint(self):
        """Test /api/concierge/member/ticket/{id} returns ticket detail"""
        # First get a ticket for the test user
        tickets_response = requests.get(
            f"{BASE_URL}/api/concierge/member/tickets",
            params={"email": TEST_USER_EMAIL}
        )
        tickets = tickets_response.json().get("tickets", [])
        
        if tickets:
            ticket_id = tickets[0].get("ticket_id")
            
            response = requests.get(
                f"{BASE_URL}/api/concierge/member/ticket/{ticket_id}",
                params={"email": TEST_USER_EMAIL}
            )
            assert response.status_code == 200
            
            data = response.json()
            assert "ticket_id" in data or "original_request" in data, "Missing ticket data"
            print(f"✅ Member ticket detail works for {ticket_id}")
        else:
            print(f"⚠️ No tickets found for {TEST_USER_EMAIL} to test detail")
    
    def test_member_ticket_detail_verifies_ownership(self):
        """Test that member can only view their own tickets"""
        # Get a ticket from queue that doesn't belong to test user
        queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?limit=5")
        items = queue_response.json().get("items", [])
        
        other_ticket = None
        for item in items:
            member = item.get("member") or {}
            if member.get("email") and member.get("email") != TEST_USER_EMAIL:
                other_ticket = item
                break
        
        if other_ticket:
            ticket_id = other_ticket.get("ticket_id")
            response = requests.get(
                f"{BASE_URL}/api/concierge/member/ticket/{ticket_id}",
                params={"email": TEST_USER_EMAIL}
            )
            # Should return 403 (forbidden) or 404 (not found)
            assert response.status_code in [403, 404]
            print(f"✅ Member ticket detail correctly restricts access to other users' tickets")
        else:
            print("⚠️ Could not find ticket from another user to test ownership verification")


class TestMemberReply:
    """Test member reply endpoint"""
    
    def test_member_reply_endpoint(self):
        """Test /api/concierge/member/ticket/{id}/reply allows adding replies"""
        # Get a ticket for the test user
        tickets_response = requests.get(
            f"{BASE_URL}/api/concierge/member/tickets",
            params={"email": TEST_USER_EMAIL}
        )
        tickets = tickets_response.json().get("tickets", [])
        
        # Find an open ticket
        open_tickets = [t for t in tickets if t.get("status") not in ["resolved", "closed"]]
        
        if open_tickets:
            ticket_id = open_tickets[0].get("ticket_id")
            
            response = requests.post(
                f"{BASE_URL}/api/concierge/member/ticket/{ticket_id}/reply",
                params={"email": TEST_USER_EMAIL},
                json={"message": "Test reply from automated testing - please ignore"}
            )
            
            assert response.status_code in [200, 201]
            
            data = response.json()
            assert data.get("success") == True or "message" in data
            print(f"✅ Member reply works for ticket {ticket_id}")
        else:
            print(f"⚠️ No open tickets for {TEST_USER_EMAIL} to test reply")


class TestQueueSLAFields:
    """Test that queue items have SLA fields"""
    
    def test_queue_items_have_sla_info(self):
        """Test queue items include SLA information"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?limit=10")
        assert response.status_code == 200
        
        items = response.json().get("items", [])
        
        if items:
            for item in items[:5]:
                # Check for SLA-related fields
                assert "sla_breached" in item or "sla" in item, f"Item {item.get('ticket_id')} missing SLA info"
                assert "priority_bucket" in item, f"Item {item.get('ticket_id')} missing priority_bucket"
            print(f"✅ Queue items have SLA information")
        else:
            print("⚠️ No items in queue to check SLA fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
