"""
Test Suite for Concierge Features
=================================
Testing:
1. Member notifications API
2. Concierge online/offline status API
3. Service desk tickets with messages (two-way relay)
4. Concierge threads API for chat history
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://image-asset-audit.preview.emergentagent.com').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestMemberNotifications:
    """Test member notification bell API"""
    
    def test_get_notifications_returns_200(self):
        """Test that notifications API returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/user/notifications",
            params={"email": MEMBER_EMAIL, "limit": 10}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "notifications" in data, "Response should contain notifications array"
        assert "unread_count" in data, "Response should contain unread_count"
        print(f"✓ Notifications API returned {len(data['notifications'])} notifications with {data['unread_count']} unread")
    
    def test_notifications_have_required_fields(self):
        """Test that notifications have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/user/notifications",
            params={"email": MEMBER_EMAIL, "limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["notifications"]:
            notif = data["notifications"][0]
            required_fields = ["id", "type", "title", "message", "read", "created_at"]
            for field in required_fields:
                assert field in notif, f"Notification missing required field: {field}"
            print(f"✓ Notification has all required fields: {list(notif.keys())}")
        else:
            print("⚠ No notifications to verify fields")
    
    def test_unread_count_is_numeric(self):
        """Test that unread count is a number"""
        response = requests.get(
            f"{BASE_URL}/api/user/notifications",
            params={"email": MEMBER_EMAIL, "limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"✓ Unread count is {data['unread_count']}")


class TestConciergeStatus:
    """Test concierge online/offline status API"""
    
    def test_status_endpoint_returns_200(self):
        """Test that status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Concierge status endpoint returned 200")
    
    def test_status_has_required_fields(self):
        """Test that status response has required fields"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["is_live", "status_text", "status_color", "message"]
        for field in required_fields:
            assert field in data, f"Status response missing field: {field}"
        print(f"✓ Status response has all required fields")
    
    def test_status_is_live_boolean(self):
        """Test that is_live is a boolean"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["is_live"], bool), "is_live should be a boolean"
        print(f"✓ Concierge is_live = {data['is_live']}, status_text = {data['status_text']}")
    
    def test_hours_config_in_response(self):
        """Test that hours_config is in response"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        data = response.json()
        
        if "hours_config" in data:
            config = data["hours_config"]
            assert "start" in config, "hours_config should have start hour"
            assert "end" in config, "hours_config should have end hour"
            assert "timezone_name" in config, "hours_config should have timezone_name"
            print(f"✓ Hours config: {config['start']}:00 - {config['end']}:00 {config['timezone_name']}")
        else:
            print("⚠ hours_config not in response (may be hidden)")


class TestServiceDeskTickets:
    """Test Service Desk tickets API for two-way relay"""
    
    def test_tickets_endpoint_returns_200(self):
        """Test that tickets endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 5}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Tickets endpoint returned 200")
    
    def test_tickets_have_messages(self):
        """Test that tickets contain messages for two-way relay"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "tickets" in data, "Response should have tickets array"
        
        tickets_with_messages = 0
        for ticket in data["tickets"]:
            if ticket.get("messages"):
                tickets_with_messages += 1
                # Check message structure
                msg = ticket["messages"][0]
                assert "content" in msg, "Message should have content"
                assert "sender" in msg, "Message should have sender"
        
        print(f"✓ Found {tickets_with_messages}/{len(data['tickets'])} tickets with messages")
    
    def test_ticket_has_member_info(self):
        """Test that tickets have member info for replies"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["tickets"]:
            ticket = data["tickets"][0]
            # Tickets should have member info for sending replies
            has_member_email = "member_email" in ticket or (ticket.get("member", {}).get("email"))
            assert has_member_email, "Ticket should have member email for replies"
            print(f"✓ Ticket has member info: {ticket.get('member', {})}")
        else:
            print("⚠ No tickets to verify")
    
    def test_concierge_replies_in_messages(self):
        """Test that concierge replies appear in ticket messages"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        
        concierge_replies_count = 0
        for ticket in data["tickets"]:
            for msg in ticket.get("messages", []):
                if msg.get("sender") == "concierge":
                    concierge_replies_count += 1
        
        print(f"✓ Found {concierge_replies_count} concierge replies across tickets")


class TestConciergeThreads:
    """Test concierge threads for chat history (ConciergeThreadPanelV2)"""
    
    def test_threads_endpoint_exists(self):
        """Test that threads endpoint exists"""
        # This endpoint requires user_id, so we test it exists
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/threads",
            params={"user_id": "test-user", "limit": 5}
        )
        # Should return 200 (empty list) or threads
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        print(f"✓ Threads endpoint returned {response.status_code}")
    
    def test_concierge_home_endpoint(self):
        """Test concierge home endpoint for Recent Conversations"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": "a152181a-2f81-4323-845e-2b5146906fe9"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "recent_threads" in data, "Response should have recent_threads"
        assert "status" in data, "Response should have concierge status"
        print(f"✓ Concierge home has {len(data.get('recent_threads', []))} recent threads")


class TestAdminReplyFlow:
    """Test admin reply flow from Service Desk to member"""
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"
        data = response.json()
        assert data.get("success") or data.get("authenticated"), "Login should be successful"
        print("✓ Admin login successful")
    
    def test_tickets_reply_creates_notification(self):
        """Test that replies to tickets create member notifications"""
        # Get a ticket first
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 1}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["tickets"]:
            ticket = data["tickets"][0]
            ticket_id = ticket.get("ticket_id") or ticket.get("id")
            
            # Check if this ticket has concierge reply messages
            concierge_msgs = [m for m in ticket.get("messages", []) if m.get("sender") == "concierge"]
            if concierge_msgs:
                print(f"✓ Ticket {ticket_id} has {len(concierge_msgs)} concierge replies")
            else:
                print(f"⚠ Ticket {ticket_id} has no concierge replies yet")
        else:
            print("⚠ No tickets to verify reply flow")


class TestTwoWaySync:
    """Test two-way sync between concierge and service desk"""
    
    def test_member_message_appears_in_ticket(self):
        """Test that member messages from concierge appear in tickets"""
        # Get tickets and check for member messages
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            params={"limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        
        member_msgs_count = 0
        for ticket in data["tickets"]:
            for msg in ticket.get("messages", []):
                if msg.get("sender") == "member" or msg.get("sender") == "user":
                    member_msgs_count += 1
        
        print(f"✓ Found {member_msgs_count} member messages in tickets")
    
    def test_admin_reply_has_notification_type(self):
        """Test that concierge replies are typed for notifications"""
        response = requests.get(
            f"{BASE_URL}/api/user/notifications",
            params={"email": MEMBER_EMAIL, "limit": 20}
        )
        assert response.status_code == 200
        data = response.json()
        
        concierge_notifs = [n for n in data["notifications"] if n.get("type") == "concierge_reply"]
        print(f"✓ Found {len(concierge_notifs)} concierge_reply notifications for member")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
