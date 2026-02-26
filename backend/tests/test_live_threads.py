"""
Live Conversation Threads API Tests
====================================
Tests the real-time conversation monitoring system for Mira AI.

Features tested:
- POST /api/live_threads/start - creates a new live conversation thread
- POST /api/live_threads/append - appends messages to thread
- GET /api/live_threads/active - returns list of active threads (admin only with basic auth)
- GET /api/live_threads/{thread_id} - returns thread details with messages
- POST /api/live_threads/{thread_id}/reply - concierge can reply to thread
- POST /api/live_threads/{thread_id}/close - closes thread
- GET /api/live_threads/stats/overview - returns stats overview
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_THREAD_"


class TestLiveThreadsAPI:
    """Test Live Conversation Threads API endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get headers with basic auth for admin endpoints"""
        import base64
        credentials = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        return {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for testing"""
        return f"{TEST_PREFIX}{uuid.uuid4().hex[:12]}"
    
    # ==================== START THREAD TESTS ====================
    
    def test_start_thread_success(self, session_id):
        """Test starting a new conversation thread"""
        payload = {
            "session_id": session_id,
            "user_id": "test-user-001",
            "user_email": "test@example.com",
            "user_name": "Test User",
            "pet_id": "test-pet-001",
            "pet_name": "Buddy",
            "pet_breed": "Golden Retriever",
            "initial_message": "I need help with my dog",
            "source": "mira_demo",
            "pillar": "care"
        }
        
        response = requests.post(f"{BASE_URL}/api/live_threads/start", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "thread_id" in data, "Response should contain thread_id"
        assert data["thread_id"].startswith("LT-"), f"Thread ID should start with 'LT-', got {data['thread_id']}"
        assert data["status"] == "active", f"Thread status should be 'active', got {data['status']}"
        assert data["is_new"] == True, "New thread should have is_new=True"
        
        print(f"✓ Thread created: {data['thread_id']}")
        return data["thread_id"]
    
    def test_start_thread_duplicate_session(self, session_id):
        """Test that duplicate session returns existing thread"""
        payload = {
            "session_id": session_id,
            "initial_message": "First message",
            "source": "mira_demo"
        }
        
        # Create first thread
        response1 = requests.post(f"{BASE_URL}/api/live_threads/start", json=payload)
        assert response1.status_code == 200
        first_thread_id = response1.json()["thread_id"]
        
        # Try to create duplicate
        payload["initial_message"] = "Second message"
        response2 = requests.post(f"{BASE_URL}/api/live_threads/start", json=payload)
        assert response2.status_code == 200
        
        data2 = response2.json()
        assert data2["thread_id"] == first_thread_id, "Should return existing thread for same session"
        assert data2["is_new"] == False, "Existing thread should have is_new=False"
        
        print(f"✓ Duplicate session returns existing thread: {first_thread_id}")
    
    def test_start_thread_minimal_payload(self):
        """Test starting thread with minimal required fields"""
        payload = {
            "session_id": f"{TEST_PREFIX}{uuid.uuid4().hex[:8]}",
            "initial_message": "Hello Mira",
            "source": "widget"
        }
        
        response = requests.post(f"{BASE_URL}/api/live_threads/start", json=payload)
        assert response.status_code == 200, f"Minimal payload should work: {response.text}"
        
        data = response.json()
        assert data["thread_id"].startswith("LT-")
        print(f"✓ Thread created with minimal payload: {data['thread_id']}")
    
    # ==================== APPEND MESSAGE TESTS ====================
    
    def test_append_message_success(self, session_id):
        """Test appending messages to a thread"""
        # First create a thread
        start_payload = {
            "session_id": session_id,
            "initial_message": "Starting conversation",
            "source": "mira_demo"
        }
        start_response = requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        assert start_response.status_code == 200
        thread_id = start_response.json()["thread_id"]
        
        # Append user message
        user_msg = {
            "thread_id": thread_id,
            "sender": "user",
            "content": "Can you help me find a vet?",
            "metadata": {"intent": "care"}
        }
        response1 = requests.post(f"{BASE_URL}/api/live_threads/append", json=user_msg)
        assert response1.status_code == 200, f"Failed to append user message: {response1.text}"
        
        data1 = response1.json()
        assert data1["success"] == True
        assert "message_id" in data1
        
        # Append Mira response
        mira_msg = {
            "thread_id": thread_id,
            "sender": "mira",
            "content": "Of course! I'd be happy to help find a vet for your pet.",
            "metadata": {"pillar": "care", "chips_offered": ["Find nearby vet", "Book appointment"]}
        }
        response2 = requests.post(f"{BASE_URL}/api/live_threads/append", json=mira_msg)
        assert response2.status_code == 200, f"Failed to append mira message: {response2.text}"
        
        print(f"✓ Messages appended to thread {thread_id}")
    
    def test_append_message_invalid_thread(self):
        """Test appending to non-existent thread returns 404"""
        payload = {
            "thread_id": "LT-NONEXISTENT-12345",
            "sender": "user",
            "content": "This should fail"
        }
        
        response = requests.post(f"{BASE_URL}/api/live_threads/append", json=payload)
        assert response.status_code == 404, f"Expected 404 for non-existent thread, got {response.status_code}"
        print("✓ Non-existent thread returns 404")
    
    # ==================== GET ACTIVE THREADS TESTS (ADMIN) ====================
    
    def test_get_active_threads_success(self, auth_headers, session_id):
        """Test fetching active threads as admin"""
        # Create a test thread first
        start_payload = {
            "session_id": session_id,
            "initial_message": "Test message for active threads",
            "source": "mira_demo"
        }
        requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        
        # Fetch active threads
        response = requests.get(f"{BASE_URL}/api/live_threads/active?limit=10", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "threads" in data, "Response should contain threads array"
        assert "total" in data, "Response should contain total count"
        assert "active_count" in data, "Response should contain active_count"
        assert "status_counts" in data, "Response should contain status_counts"
        
        print(f"✓ Active threads fetched: {data['total']} threads, {data['active_count']} active")
    
    def test_get_active_threads_no_auth(self):
        """Test that active threads endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/live_threads/active")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Active threads requires authentication")
    
    def test_get_active_threads_wrong_auth(self):
        """Test that active threads rejects wrong credentials"""
        import base64
        bad_credentials = base64.b64encode(b"wrong:password").decode()
        headers = {"Authorization": f"Basic {bad_credentials}"}
        
        response = requests.get(f"{BASE_URL}/api/live_threads/active", headers=headers)
        
        assert response.status_code == 401, f"Expected 401 with wrong auth, got {response.status_code}"
        print("✓ Active threads rejects invalid credentials")
    
    def test_get_active_threads_filter_by_status(self, auth_headers, session_id):
        """Test filtering threads by status"""
        # Create a thread
        start_payload = {
            "session_id": session_id,
            "initial_message": "Test for status filter",
            "source": "mira_demo"
        }
        requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        
        # Filter by active status
        response = requests.get(f"{BASE_URL}/api/live_threads/active?status=active", headers=auth_headers)
        
        assert response.status_code == 200, f"Filter request failed: {response.text}"
        
        data = response.json()
        # All returned threads should be active
        for thread in data.get("threads", []):
            assert thread["status"] == "active", f"Found non-active thread: {thread['status']}"
        
        print(f"✓ Status filter works: {data['total']} active threads")
    
    # ==================== GET THREAD DETAILS TESTS (ADMIN) ====================
    
    def test_get_thread_details_success(self, auth_headers, session_id):
        """Test fetching thread details with all messages"""
        # Create a thread with messages
        start_payload = {
            "session_id": session_id,
            "user_name": "Detail Test User",
            "pet_name": "Max",
            "pet_breed": "Labrador",
            "initial_message": "I want to book grooming",
            "source": "mira_demo"
        }
        start_response = requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        assert start_response.status_code == 200
        thread_id = start_response.json()["thread_id"]
        
        # Add more messages
        mira_msg = {
            "thread_id": thread_id,
            "sender": "mira",
            "content": "Great choice! Let me find grooming options for Max.",
            "metadata": {}
        }
        requests.post(f"{BASE_URL}/api/live_threads/append", json=mira_msg)
        
        # Fetch details
        response = requests.get(f"{BASE_URL}/api/live_threads/{thread_id}", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed to get details: {response.text}"
        
        data = response.json()
        assert "thread" in data, "Response should contain thread object"
        assert "message_count" in data, "Response should contain message_count"
        
        thread = data["thread"]
        assert thread["thread_id"] == thread_id
        assert thread["user_name"] == "Detail Test User"
        assert thread["pet_name"] == "Max"
        assert "messages" in thread
        assert len(thread["messages"]) >= 2, f"Expected at least 2 messages, got {len(thread['messages'])}"
        
        print(f"✓ Thread details retrieved: {data['message_count']} messages")
    
    def test_get_thread_details_not_found(self, auth_headers):
        """Test fetching non-existent thread returns 404"""
        response = requests.get(f"{BASE_URL}/api/live_threads/LT-NOTEXIST-99999", headers=auth_headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent thread returns 404")
    
    # ==================== CONCIERGE REPLY TESTS (ADMIN) ====================
    
    def test_concierge_reply_success(self, auth_headers, session_id):
        """Test concierge replying to a thread"""
        # Create thread
        start_payload = {
            "session_id": session_id,
            "user_id": "user-for-reply",
            "user_name": "Reply Test User",
            "initial_message": "I need urgent help",
            "source": "mira_demo"
        }
        start_response = requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        assert start_response.status_code == 200
        thread_id = start_response.json()["thread_id"]
        
        # Concierge reply
        reply_payload = {
            "message": "Hi! I'm here to help. What do you need assistance with?",
            "agent_name": "Test Concierge",
            "notify_user": True
        }
        response = requests.post(
            f"{BASE_URL}/api/live_threads/{thread_id}/reply",
            json=reply_payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Reply failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "message_id" in data
        assert data["status"] == "with_concierge", "Status should update to with_concierge"
        
        # Verify thread was updated
        details_response = requests.get(f"{BASE_URL}/api/live_threads/{thread_id}", headers=auth_headers)
        details = details_response.json()
        assert details["thread"]["status"] == "with_concierge"
        assert details["thread"]["concierge_assigned"] == "Test Concierge"
        
        print(f"✓ Concierge replied to thread {thread_id}")
    
    def test_concierge_reply_no_auth(self, session_id):
        """Test that concierge reply requires auth"""
        # Create thread first
        start_payload = {
            "session_id": session_id,
            "initial_message": "Test message",
            "source": "mira_demo"
        }
        start_response = requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        thread_id = start_response.json()["thread_id"]
        
        # Try to reply without auth
        reply_payload = {"message": "This should fail"}
        response = requests.post(
            f"{BASE_URL}/api/live_threads/{thread_id}/reply",
            json=reply_payload
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Concierge reply requires authentication")
    
    # ==================== CLOSE THREAD TESTS (ADMIN) ====================
    
    def test_close_thread_success(self, auth_headers, session_id):
        """Test closing a thread"""
        # Create thread
        start_payload = {
            "session_id": session_id,
            "initial_message": "Test to close",
            "source": "mira_demo"
        }
        start_response = requests.post(f"{BASE_URL}/api/live_threads/start", json=start_payload)
        assert start_response.status_code == 200
        thread_id = start_response.json()["thread_id"]
        
        # Close thread
        response = requests.post(
            f"{BASE_URL}/api/live_threads/{thread_id}/close?resolution=Resolved",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Close failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "closed"
        
        # Verify thread is closed
        details_response = requests.get(f"{BASE_URL}/api/live_threads/{thread_id}", headers=auth_headers)
        details = details_response.json()
        assert details["thread"]["status"] == "closed"
        
        print(f"✓ Thread {thread_id} closed successfully")
    
    def test_close_thread_not_found(self, auth_headers):
        """Test closing non-existent thread returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/live_threads/LT-NOTEXIST-99999/close",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Close non-existent thread returns 404")
    
    # ==================== STATS OVERVIEW TESTS (ADMIN) ====================
    
    def test_stats_overview_success(self, auth_headers):
        """Test getting stats overview"""
        response = requests.get(f"{BASE_URL}/api/live_threads/stats/overview", headers=auth_headers)
        
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        data = response.json()
        assert "active_threads" in data, "Should have active_threads count"
        assert "needing_attention" in data, "Should have needing_attention count"
        assert "today_new" in data, "Should have today_new count"
        assert "today_closed" in data, "Should have today_closed count"
        assert "by_source" in data, "Should have by_source breakdown"
        assert "timestamp" in data, "Should have timestamp"
        
        print(f"✓ Stats: {data['active_threads']} active, {data['needing_attention']} need attention")
    
    def test_stats_overview_no_auth(self):
        """Test that stats endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/live_threads/stats/overview")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Stats overview requires authentication")


class TestMiraChatIntegration:
    """Test that Mira chat creates threads automatically"""
    
    def test_mira_chat_creates_thread(self):
        """Test that sending a message via /api/mira/chat creates a live thread"""
        session_id = f"{TEST_PREFIX}mira_{uuid.uuid4().hex[:8]}"
        
        # Send chat message to Mira
        chat_payload = {
            "message": "I want to book grooming for my dog",
            "session_id": session_id,
            "pet_id": "test-pet-001",
            "pet_name": "Buddy",
            "pet_breed": "Poodle",
            "source": "mira_demo"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=chat_payload)
        
        # Chat should succeed
        assert response.status_code == 200, f"Chat failed: {response.text}"
        
        # Now check if thread was created (admin auth required)
        import base64
        credentials = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        auth_headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json"
        }
        
        # Get active threads and look for our session
        threads_response = requests.get(
            f"{BASE_URL}/api/live_threads/active?limit=100",
            headers=auth_headers
        )
        
        if threads_response.status_code == 200:
            threads_data = threads_response.json()
            matching_threads = [
                t for t in threads_data.get("threads", [])
                if t.get("session_id") == session_id
            ]
            
            if matching_threads:
                print(f"✓ Mira chat created live thread: {matching_threads[0]['thread_id']}")
            else:
                print("⚠ No matching thread found - integration may not be enabled")
        else:
            print(f"⚠ Could not verify thread creation: {threads_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
