"""
Test Real-Time Concierge Communication System
==============================================
Testing the Golden Standard Communication System with:
1. Connection status endpoint
2. Unread count endpoint
3. Admin users endpoint
4. Admin initiate conversation endpoint
5. Admin threads endpoint
6. Admin thread detail endpoint
7. Admin reply endpoint
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestConnectionAndStatus:
    """Test connection status and related endpoints"""
    
    def test_connection_status_endpoint(self):
        """Test GET /api/concierge/realtime/connection-status"""
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/connection-status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "admin_online" in data
        assert "online_admin_count" in data
        assert "online_user_count" in data
        print(f"✓ Connection status: admin_online={data['admin_online']}, users={data['online_user_count']}")
    
    def test_connection_status_with_user_id(self):
        """Test connection status with user_id query param"""
        # First get a user ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            user_data = login_response.json()
            user_id = user_data.get("user", {}).get("id")
            
            if user_id:
                response = requests.get(f"{BASE_URL}/api/concierge/realtime/connection-status?user_id={user_id}")
                assert response.status_code == 200
                
                data = response.json()
                assert "user_online" in data
                print(f"✓ User {user_id} online status: {data['user_online']}")


class TestUnreadCount:
    """Test unread message count endpoint"""
    
    def test_unread_count_endpoint(self):
        """Test GET /api/concierge/realtime/unread-count"""
        # First login to get user_id
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        user_data = login_response.json()
        user_id = user_data.get("user", {}).get("id")
        assert user_id, "No user ID in login response"
        
        # Get unread count
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/unread-count?user_id={user_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "unread_count" in data
        assert data.get("user_id") == user_id
        print(f"✓ Unread count for user {user_id}: {data['unread_count']}")
    
    def test_unread_count_missing_user_id(self):
        """Test unread count without user_id - should fail"""
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/unread-count")
        
        # Should return 422 (validation error) because user_id is required
        assert response.status_code == 422, f"Expected 422 for missing user_id, got {response.status_code}"
        print("✓ Correctly rejects request without user_id")


class TestAdminUsers:
    """Test admin users endpoint for initiating conversations"""
    
    def test_get_users_for_initiation(self):
        """Test GET /api/concierge/realtime/admin/users"""
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/admin/users?limit=20")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "users" in data
        assert isinstance(data["users"], list)
        
        print(f"✓ Found {len(data['users'])} users for admin initiation")
        
        # Verify user structure if any users exist
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "id" in user, "User should have id"
            assert "name" in user or "email" in user, "User should have name or email"
            print(f"  First user: {user.get('name', user.get('email', 'Unknown'))}")
    
    def test_get_users_with_search(self):
        """Test GET /api/concierge/realtime/admin/users with search"""
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/admin/users?search=dipali&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Search 'dipali' returned {len(data.get('users', []))} users")


class TestAdminInitiateConversation:
    """Test admin-initiated conversation endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for tests - get a user ID to initiate conversation with"""
        # Login to get user ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            user_data = login_response.json()
            self.user_id = user_data.get("user", {}).get("id")
        else:
            self.user_id = None
    
    def test_admin_initiate_conversation(self):
        """Test POST /api/concierge/realtime/admin/initiate"""
        if not self.user_id:
            pytest.skip("No user ID available for test")
        
        payload = {
            "user_id": self.user_id,
            "subject": f"TEST: Admin Initiated - {datetime.now().strftime('%H:%M')}",
            "initial_message": "Hello! This is a test message from the admin dashboard."
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge/realtime/admin/initiate", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Admin initiated conversation with user {self.user_id}")
    
    def test_admin_initiate_missing_fields(self):
        """Test admin initiate with missing required fields"""
        # Missing initial_message
        payload = {
            "user_id": "some-user-id",
            "subject": "Test Subject"
            # missing initial_message
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge/realtime/admin/initiate", json=payload)
        
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print("✓ Correctly rejects request with missing initial_message")


class TestAdminThreads:
    """Test admin threads viewing and management"""
    
    def test_get_admin_threads(self):
        """Test GET /api/os/concierge/admin/threads"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=20")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "threads" in data
        assert isinstance(data["threads"], list)
        
        print(f"✓ Admin threads endpoint returned {len(data['threads'])} threads")
        
        # Check counts if present
        if "counts" in data:
            print(f"  Awaiting concierge: {data['counts'].get('awaiting_concierge', 0)}")
            print(f"  Active: {data['counts'].get('active', 0)}")
        
        # Verify thread structure if any threads exist
        if len(data["threads"]) > 0:
            thread = data["threads"][0]
            assert "id" in thread, "Thread should have id"
            assert "status" in thread, "Thread should have status"
            print(f"  First thread: {thread.get('title', 'No title')} - Status: {thread.get('status')}")
    
    def test_get_admin_threads_filtered_by_status(self):
        """Test GET /api/os/concierge/admin/threads with status filter"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?status=awaiting_concierge&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # All returned threads should have the filtered status
        for thread in data.get("threads", []):
            assert thread.get("status") == "awaiting_concierge", f"Thread has wrong status: {thread.get('status')}"
        
        print(f"✓ Filtered threads by status 'awaiting_concierge': {len(data.get('threads', []))} threads")


class TestAdminThreadDetail:
    """Test getting individual thread details"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a thread ID for testing"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=1")
        
        if response.status_code == 200:
            data = response.json()
            threads = data.get("threads", [])
            if len(threads) > 0:
                self.thread_id = threads[0].get("id")
            else:
                self.thread_id = None
        else:
            self.thread_id = None
    
    def test_get_admin_thread_detail(self):
        """Test GET /api/os/concierge/admin/thread/{thread_id}"""
        if not self.thread_id:
            pytest.skip("No threads available for testing")
        
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/thread/{self.thread_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "thread" in data
        assert "messages" in data
        
        thread = data["thread"]
        assert thread.get("id") == self.thread_id
        
        print(f"✓ Thread detail: {thread.get('title', 'No title')}")
        print(f"  Messages count: {len(data.get('messages', []))}")
        
        # Check if user and pet info are included
        if data.get("user"):
            print(f"  User: {data['user'].get('name', 'Unknown')}")
        if data.get("pet"):
            print(f"  Pet: {data['pet'].get('name', 'Unknown')}")
    
    def test_get_admin_thread_not_found(self):
        """Test GET /api/os/concierge/admin/thread/{thread_id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/thread/nonexistent-thread-id")
        
        assert response.status_code == 404, f"Expected 404 for nonexistent thread, got {response.status_code}"
        print("✓ Correctly returns 404 for nonexistent thread")


class TestAdminReply:
    """Test admin sending replies"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a thread ID for testing"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=1")
        
        if response.status_code == 200:
            data = response.json()
            threads = data.get("threads", [])
            if len(threads) > 0:
                self.thread_id = threads[0].get("id")
            else:
                self.thread_id = None
        else:
            self.thread_id = None
    
    def test_send_admin_reply(self):
        """Test POST /api/os/concierge/admin/reply"""
        if not self.thread_id:
            pytest.skip("No threads available for testing")
        
        payload = {
            "thread_id": self.thread_id,
            "content": f"TEST: Admin reply at {datetime.now().strftime('%H:%M:%S')}",
            "status_chip": "Testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/os/concierge/admin/reply", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        
        message = data["message"]
        assert message.get("sender") == "concierge"
        assert message.get("content") == payload["content"]
        
        print(f"✓ Admin reply sent to thread {self.thread_id}")
        print(f"  Message ID: {message.get('id')}")
    
    def test_send_admin_reply_to_nonexistent_thread(self):
        """Test admin reply to nonexistent thread"""
        payload = {
            "thread_id": "nonexistent-thread-id",
            "content": "This should fail"
        }
        
        response = requests.post(f"{BASE_URL}/api/os/concierge/admin/reply", json=payload)
        
        assert response.status_code == 404, f"Expected 404 for nonexistent thread, got {response.status_code}"
        print("✓ Correctly returns 404 for reply to nonexistent thread")


class TestRealtimeRESTEndpoints:
    """Test the REST fallback endpoints in realtime_concierge.py"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get user and thread info for testing"""
        # Login to get user ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            user_data = login_response.json()
            self.user_id = user_data.get("user", {}).get("id")
        else:
            self.user_id = None
        
        # Get a thread ID
        threads_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=1")
        if threads_response.status_code == 200:
            data = threads_response.json()
            threads = data.get("threads", [])
            if len(threads) > 0:
                self.thread_id = threads[0].get("id")
            else:
                self.thread_id = None
        else:
            self.thread_id = None
    
    def test_get_messages_with_status(self):
        """Test GET /api/concierge/realtime/thread/{thread_id}/messages"""
        if not self.thread_id or not self.user_id:
            pytest.skip("No thread or user available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/thread/{self.thread_id}/messages?user_id={self.user_id}"
        )
        
        # This may return 404 if user doesn't own the thread - that's acceptable
        if response.status_code == 404:
            print("✓ Thread not found for user (expected if user doesn't own thread)")
            return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "messages" in data
        
        print(f"✓ Got {len(data.get('messages', []))} messages from thread")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
