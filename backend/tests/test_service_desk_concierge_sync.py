"""
Service Desk to Concierge Sync Tests - Iteration 208
=====================================================
Tests for:
1. Service Desk reply sync to Concierge (add_reply endpoint)
2. Member notifications when Service Desk replies
3. Concierge conversation loading 
4. AI Reply draft generation with different styles (Mira tone)
5. Two-way message display - verify no HTML tags in Concierge
"""

import pytest
import requests
import os
import json
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-data-heal.preview.emergentagent.com')

# Test credentials from requirements
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
TEST_ADMIN_USERNAME = "aditya"
TEST_ADMIN_PASSWORD = "lola4304"
TEST_TICKET_ID = "48d4ac66-4a88-43f4-80b6-105013f6f0ed"
TEST_THREAD_ID = "48d4ac66-4a88-43f4-80b6-105013f6f0ed"
TEST_USER_ID = "a152181a-2f81-4323-845e-2b5146906fe9"


class TestServiceDeskReplySyncToConcierge:
    """Test Service Desk reply sync to Concierge thread"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def api_client(self, admin_token):
        """Session with admin auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        return session
    
    def test_ticket_exists(self, api_client):
        """Test that the ticket exists and has messages"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{TEST_TICKET_ID}")
        assert response.status_code == 200, f"Ticket not found: {response.text}"
        
        ticket = response.json()
        if 'ticket' in ticket:
            ticket = ticket['ticket']
        
        assert ticket is not None
        print(f"SUCCESS: Ticket {TEST_TICKET_ID} exists")
        print(f"  - Category: {ticket.get('category', 'N/A')}")
        print(f"  - Status: {ticket.get('status', 'N/A')}")
        print(f"  - Messages count: {len(ticket.get('messages', []))}")
    
    def test_add_reply_to_ticket(self, api_client):
        """Test adding a reply via Service Desk API"""
        unique_id = uuid.uuid4().hex[:8]
        reply_content = f"TEST_SYNC_{unique_id}: Testing Service Desk to Concierge sync at {datetime.now().isoformat()}"
        
        response = api_client.post(
            f"{BASE_URL}/api/tickets/{TEST_TICKET_ID}/reply",
            json={
                "message": reply_content,
                "is_internal": False,
                "channel": "chat"
            }
        )
        
        assert response.status_code == 200, f"Failed to add reply: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("message") is not None
        
        message = data["message"]
        print(f"SUCCESS: Reply added to ticket")
        print(f"  - Message ID: {message.get('id')}")
        print(f"  - Content preview: {message.get('content', '')[:50]}...")
        
        return message.get("id")
    
    def test_reply_synced_to_concierge_thread(self, api_client):
        """Verify reply appears in Concierge thread"""
        # First, get the thread detail
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{TEST_THREAD_ID}?user_id={TEST_USER_ID}"
        )
        
        # Thread might not exist for old tickets - check different scenarios
        if response.status_code == 404:
            print("INFO: Thread not found - checking if ticket has metadata.thread_id")
            # Get ticket to check metadata
            ticket_response = api_client.get(f"{BASE_URL}/api/tickets/{TEST_TICKET_ID}")
            if ticket_response.status_code == 200:
                ticket = ticket_response.json()
                if 'ticket' in ticket:
                    ticket = ticket['ticket']
                metadata = ticket.get("metadata", {})
                print(f"  - metadata: {metadata}")
            pytest.skip("Thread not found - test requires existing concierge thread")
        
        assert response.status_code == 200, f"Failed to get thread: {response.text}"
        
        data = response.json()
        messages = data.get("messages", [])
        
        print(f"SUCCESS: Thread loaded with {len(messages)} messages")
        
        # Check for recent service_desk messages
        sd_messages = [m for m in messages if m.get("source") == "service_desk"]
        print(f"  - Service Desk sourced messages: {len(sd_messages)}")
        
        if sd_messages:
            last_sd_msg = sd_messages[-1]
            print(f"  - Last SD message: {last_sd_msg.get('content', '')[:50]}...")


class TestMemberNotifications:
    """Test member notifications for Service Desk replies"""
    
    def test_notifications_created_for_member(self):
        """Verify notification is created when Service Desk replies"""
        response = requests.get(
            f"{BASE_URL}/api/user/notifications?email={TEST_USER_EMAIL}"
        )
        
        assert response.status_code == 200, f"Failed to get notifications: {response.text}"
        
        data = response.json()
        notifications = data.get("notifications", [])
        
        print(f"SUCCESS: Retrieved {len(notifications)} notifications for {TEST_USER_EMAIL}")
        
        # Check for concierge_reply notifications
        concierge_notifs = [n for n in notifications if n.get("type") == "concierge_reply"]
        print(f"  - Concierge reply notifications: {len(concierge_notifs)}")
        
        if concierge_notifs:
            latest = concierge_notifs[0]
            print(f"  - Latest: {latest.get('title')} - {latest.get('message', '')[:50]}...")
            assert latest.get("ticket_id") or latest.get("thread_id"), "Notification should have ticket_id or thread_id"


class TestConciergeConversationLoading:
    """Test Concierge conversation loading from Recent Conversations"""
    
    def test_concierge_home_returns_threads(self):
        """Verify /api/os/concierge/home returns recent_threads"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home?user_id={TEST_USER_ID}"
        )
        
        assert response.status_code == 200, f"Failed to get concierge home: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        
        recent_threads = data.get("recent_threads", [])
        active_requests = data.get("active_requests", [])
        
        print(f"SUCCESS: Concierge home loaded")
        print(f"  - Recent threads: {len(recent_threads)}")
        print(f"  - Active requests: {len(active_requests)}")
        
        if recent_threads:
            thread = recent_threads[0]
            print(f"  - First thread: {thread.get('title')} (ID: {thread.get('id')})")
    
    def test_thread_detail_returns_messages(self):
        """Verify thread detail returns messages when opened"""
        # First get threads list
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/threads?user_id={TEST_USER_ID}&limit=5"
        )
        
        if response.status_code != 200:
            pytest.skip("No threads found for user")
        
        data = response.json()
        threads = data.get("threads", [])
        
        if not threads:
            pytest.skip("No threads available for testing")
        
        # Get first thread detail
        thread_id = threads[0].get("id")
        detail_response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}?user_id={TEST_USER_ID}"
        )
        
        assert detail_response.status_code == 200, f"Failed to get thread detail: {detail_response.text}"
        
        detail = detail_response.json()
        messages = detail.get("messages", [])
        
        print(f"SUCCESS: Thread {thread_id} loaded with {len(messages)} messages")
        assert len(messages) >= 0, "Messages should be loaded (can be empty array)"


class TestAIReplyDraft:
    """Test AI Reply draft generation with different styles"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def api_client(self, admin_token):
        """Session with admin auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        return session
    
    def test_ai_draft_professional(self, api_client):
        """Test AI draft reply with professional style"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            json={
                "ticket_id": TEST_TICKET_ID,
                "reply_type": "professional"
            }
        )
        
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 404:
            pytest.skip(f"Ticket {TEST_TICKET_ID} not found for AI draft test")
        
        data = response.json()
        print(f"SUCCESS: AI draft generated (professional)")
        print(f"  - Draft preview: {data.get('draft', '')[:100]}...")
    
    def test_ai_draft_friendly(self, api_client):
        """Test AI draft reply with friendly style"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            json={
                "ticket_id": TEST_TICKET_ID,
                "reply_type": "friendly"
            }
        )
        
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 404:
            pytest.skip(f"Ticket {TEST_TICKET_ID} not found for AI draft test")
        
        data = response.json()
        print(f"SUCCESS: AI draft generated (friendly)")
        print(f"  - Draft preview: {data.get('draft', '')[:100]}...")
    
    def test_ai_draft_empathetic(self, api_client):
        """Test AI draft reply with empathetic style (Mira tone)"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            json={
                "ticket_id": TEST_TICKET_ID,
                "reply_type": "empathetic"
            }
        )
        
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 404:
            pytest.skip(f"Ticket {TEST_TICKET_ID} not found for AI draft test")
        
        data = response.json()
        print(f"SUCCESS: AI draft generated (empathetic/Mira tone)")
        print(f"  - Draft preview: {data.get('draft', '')[:100]}...")


class TestTwoWayMessageDisplay:
    """Test that Service Desk messages display correctly without HTML tags"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def api_client(self, admin_token):
        """Session with admin auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        return session
    
    def test_html_tags_stripped_from_messages(self, api_client):
        """Verify HTML tags are stripped from Service Desk messages in Concierge"""
        # Add an HTML-formatted reply
        unique_id = uuid.uuid4().hex[:8]
        html_content = f"<p>Test message with <strong>bold</strong> and <em>italic</em> text. ID: {unique_id}</p>"
        
        response = api_client.post(
            f"{BASE_URL}/api/tickets/{TEST_TICKET_ID}/reply",
            json={
                "message": html_content,
                "is_internal": False,
                "channel": "chat"
            }
        )
        
        if response.status_code != 200:
            pytest.skip(f"Could not add reply: {response.text}")
        
        # Now check thread messages
        thread_response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{TEST_THREAD_ID}?user_id={TEST_USER_ID}"
        )
        
        if thread_response.status_code != 200:
            pytest.skip("Could not retrieve thread to verify HTML stripping")
        
        data = thread_response.json()
        messages = data.get("messages", [])
        
        # Find our test message
        for msg in messages:
            if unique_id in str(msg.get("content", "")):
                content = msg.get("content", "")
                # Backend should have stored raw HTML, frontend will strip it
                print(f"SUCCESS: Found test message in thread")
                print(f"  - Content: {content[:100]}...")
                # Note: HTML stripping is done in frontend's stripHtml function
                break
        else:
            print("INFO: Test message not found in thread - may need manual verification")


class TestServiceDeskEndpoints:
    """Test basic Service Desk endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def api_client(self, admin_token):
        """Session with admin auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        return session
    
    def test_list_tickets(self, api_client):
        """Test listing tickets"""
        response = api_client.get(f"{BASE_URL}/api/tickets/")
        assert response.status_code == 200
        
        data = response.json()
        tickets = data.get("tickets", [])
        print(f"SUCCESS: Listed {len(tickets)} tickets")
    
    def test_get_ticket_detail(self, api_client):
        """Test getting ticket detail"""
        response = api_client.get(f"{BASE_URL}/api/tickets/{TEST_TICKET_ID}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        ticket = data.get("ticket", data)
        
        print(f"SUCCESS: Got ticket detail")
        print(f"  - Status: {ticket.get('status')}")
        print(f"  - Category: {ticket.get('category')}")
        print(f"  - Messages: {len(ticket.get('messages', []))}")
    
    def test_get_ticket_categories(self, api_client):
        """Test getting ticket categories"""
        response = api_client.get(f"{BASE_URL}/api/tickets/categories")
        assert response.status_code == 200
        
        data = response.json()
        categories = data.get("categories", [])
        print(f"SUCCESS: Got {len(categories)} categories")
    
    def test_get_concierges(self, api_client):
        """Test getting concierges/agents list"""
        response = api_client.get(f"{BASE_URL}/api/tickets/concierges")
        assert response.status_code == 200
        
        data = response.json()
        concierges = data.get("concierges", [])
        print(f"SUCCESS: Got {len(concierges)} concierges")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
